#!/usr/bin/env node
/**
 * Pruebas del motor de animación (SVG + 3D) SIN gastar nada: servidor simulado de OpenAI.
 *   npm run anim:prueba            (≈ 20 s, no abre Chrome)
 *   npm run anim:prueba -- --render   (añade capturas reales de las 5 escenas con Chrome + QA)
 * Comprueba: parser local de bloques, costos exactos, esquema estricto, paletas IMNOBA, saneado/validación,
 * SFX apagables, agente (modelos, reparación, costo real), y la API del panel (guion → animación → costo real).
 * Al terminar restaura src/data/animacion.json.
 */
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { iniciarMock, comprobarEstricto, validarEsquema } from "../ia/mock-server.mjs";
import { configuracion } from "../ia/entorno.mjs";
import { iniciarPanel } from "../panel/servidor.mjs";
import { generarAnimacion } from "./agente.mjs";
import { cargarNucleoAnim, RAIZ } from "./nucleo.mjs";

const conRender = process.argv.includes("--render");
const p = (...x) => join(RAIZ, ...x);
let pasadas = 0;
const falladas = [];
const prueba = (nombre, cond, detalle = "") => {
  if (cond) { pasadas++; console.log(`  ✅ ${nombre}`); }
  else { falladas.push(nombre); console.log(`  ❌ ${nombre}${detalle ? `\n       ${detalle}` : ""}`); }
};

const ANIM = p("src", "data", "animacion.json");
const respaldo = existsSync(ANIM) ? readFileSync(ANIM, "utf8") : null;
const historialAntes = new Set(existsSync(p("trabajo", "anim", "historial")) ? readdirSync(p("trabajo", "anim", "historial")) : []);
const N = await cargarNucleoAnim();
const guionEjemplo = readFileSync(p("ejemplos", "animacion-imnoba", "guion.txt"), "utf8");
const respuestaEjemplo = JSON.parse(readFileSync(p("ejemplos", "animacion-imnoba", "respuesta-ia.json"), "utf8"));
const cfgMock = (m) => ({ ...configuracion(), clave: "prueba", url: m.url, timeoutS: 60 });

const envAntes = { base: process.env.OPENAI_BASE_URL, clave: process.env.OPENAI_API_KEY };
try {
  // ------------------------------------------------------------ parser local
  console.log("\nParser local (sin IA)");
  const r = N.parsearGuion(guionEjemplo);
  prueba("el ejemplo se interpreta: 5 escenas, 28 s, sin errores", r.escenas.length === 5 && r.duracion === 28 && r.errores.length === 0, JSON.stringify(r.errores));
  prueba("modos SVG/3D y duraciones por bloque", r.escenas.map((e) => `${e.modo}${e.dur}`).join() === "SVG5,3D5,SVG6,3D6,SVG6");
  prueba("fotogramas = segundos × 60", N.aFrames(5) === 300 && N.aFrames(28) === 1680 && N.framesDeAnimacion({ duracion: 28 }) === 1680);
  // la segunda escena conserva su rango tal cual (la primera siempre se normaliza a 0)
  const f = (t) => N.parsearGuion(`[ESCENA 1 | 0s-4s | MODO: SVG]\nuno\n[ESCENA 2 | ${t} | MODO: SVG]\nhola mundo`);
  prueba("acepta 4s-9s, 4-9, 00:04-00:09, guion largo (– —) y flecha (→)", ["4s-9s", "4-9", "00:04-00:09", "4s – 9s", "4s—9s", "4s→9s"].every((t) => { const e = f(t).escenas[1]; return e && e.inicio === 4 && e.fin === 9 && e.dur === 5; }), JSON.stringify(["4s-9s", "4-9", "00:04-00:09", "4s – 9s", "4s—9s", "4s→9s"].map((t) => f(t).escenas[1]?.fin)));
  prueba("modo en minúsculas y con espacios (modo: 3d)", N.parsearGuion("[escena 1 | 0s-3s | modo: 3d]\nx").escenas[0]?.modo === "3D");
  prueba("error: modo inválido", N.parsearGuion("[ESCENA 1 | 0s-3s | MODO: VR]\nx").errores.length > 0);
  prueba("error: fin <= inicio", N.parsearGuion("[ESCENA 1 | 5s-3s | MODO: SVG]\nx").errores.length > 0);
  prueba("error: escenas solapadas", N.parsearGuion("[ESCENA 1 | 0s-5s | MODO: SVG]\nx\n[ESCENA 2 | 4s-9s | MODO: SVG]\ny").errores.length > 0);
  prueba("error: número repetido", N.parsearGuion("[ESCENA 1 | 0s-3s | MODO: SVG]\nx\n[ESCENA 1 | 3s-6s | MODO: SVG]\ny").errores.length > 0);
  prueba("error: texto sin bloques", N.parsearGuion("hola, esto no tiene bloques").errores.length > 0);
  const hueco = N.parsearGuion("[ESCENA 1 | 0s-3s | MODO: SVG]\nx\n[ESCENA 2 | 5s-8s | MODO: 3D]\ny");
  prueba("hueco entre escenas: aviso y la anterior se extiende (sin cortes en negro)", hueco.errores.length === 0 && hueco.avisos.length > 0 && hueco.escenas[0].fin === 5 && hueco.escenas[0].dur === 5);
  prueba("la primera escena siempre arranca en 0", N.parsearGuion("[ESCENA 1 | 2s-6s | MODO: SVG]\nx").escenas[0].inicio === 0);

  // ------------------------------------------------------------ costos
  console.log("\nCostos");
  const exacto = (modelo, a, b, esperado) => Math.abs(N.costoUSD(modelo, a, b) - esperado) < 1e-12;
  prueba("precios exactos por 1M tokens: gpt-4.1-mini 0.40/1.60 · o4-mini 1.10/4.40 · gpt-4o-mini 0.15/0.60 · gpt-4.1 2.00/8.00", exacto("gpt-4.1-mini", 1e6, 1e6, 2.0) && exacto("o4-mini", 1e6, 1e6, 5.5) && exacto("gpt-4o-mini", 1e6, 1e6, 0.75) && exacto("gpt-4.1", 1e6, 1e6, 10.0));
  prueba("hay exactamente 4 modelos y gpt-4.1-mini es el recomendado (primero)", N.MODELOS.length === 4 && N.MODELOS[0].id === "gpt-4.1-mini" && /Recomendado/.test(N.MODELOS[0].etiqueta));
  prueba("formato de dinero: 4 decimales (estimado) y 5 (real)", N.formatoUSD(0.01234, 4) === "$0.0123 USD" && N.formatoUSD(0.017624, 5) === "$0.01762 USD");
  const cfgE = (modelo, escenasSVG, escenas3D, sfx, caracteres) => N.estimar({ modelo, caracteres, escenasSVG, escenas3D, sfx, tokensFijos: N.tokensFijos({ paleta: "imnoba", sfx, svg: escenasSVG > 0, tres: escenas3D > 0 }) });
  const e1 = cfgE("gpt-4.1-mini", 3, 2, true, 1500), e2 = cfgE("gpt-4.1-mini", 6, 4, true, 3000);
  prueba("la estimación crece con las escenas y con los caracteres", e2.costo > e1.costo && e2.tokensSalida > e1.tokensSalida && e2.tokensEntrada > e1.tokensEntrada);
  prueba("sin SFX la estimación baja", cfgE("gpt-4.1-mini", 3, 2, false, 1500).costo < e1.costo);
  prueba("o4-mini (razona) cuesta más que gpt-4o-mini para el mismo guion", cfgE("o4-mini", 3, 2, true, 1500).costo > cfgE("gpt-4o-mini", 3, 2, true, 1500).costo);
  prueba("una estimación típica (5 escenas, gpt-4.1-mini) es del orden de centavos de dólar", e1.costo > 0.002 && e1.costo < 0.05, String(e1.costo));

  // ------------------------------------------------------------ esquema y paletas
  console.log("\nEsquema estricto y paletas");
  for (const paleta of ["imnoba", "medicina"]) for (const sfx of [true, false]) for (const [svg, tres] of [[true, true], [true, false], [false, true]]) {
    const e = comprobarEstricto(N.esquemaAnimacion({ paleta, sfx, svg, tres }).schema);
    prueba(`esquema ${paleta} sfx=${sfx} svg=${svg} 3d=${tres} cumple el modo estricto de OpenAI`, e.length === 0, e[0]);
  }
  const sinSfx = JSON.stringify(N.esquemaAnimacion({ paleta: "imnoba", sfx: false, svg: true, tres: true }).schema);
  prueba("SFX = No → el esquema NO tiene campo de sonido y el prompt dice que no hay efectos", !sinSfx.includes('"vol"') && /NO incluyas sonido/.test(N.sistemaAnimacion({ paleta: "imnoba", sfx: false, svg: true, tres: true })));
  prueba("SFX = Sí → el esquema pide eventos de sonido", JSON.stringify(N.esquemaAnimacion({ paleta: "imnoba", sfx: true, svg: true, tres: true }).schema).includes('"vol"'));
  prueba("solo SVG → el esquema no incluye la cámara 3D (menos tokens)", !JSON.stringify(N.esquemaAnimacion({ paleta: "imnoba", sfx: true, svg: true, tres: false }).schema).includes('"camara"'));
  const imn = N.PALETAS.imnoba;
  prueba("IMNOBA es la paleta por defecto y usa los hex oficiales #02224E, #FFC500 y #FFFFFF", N.PALETA_DEFECTO === "imnoba" && imn.claro.primario === "#02224E" && imn.oscuro.fondoBorde === "#02224E" && imn.oscuro.acento === "#FFC500" && imn.claro.acento === "#FFC500" && imn.oscuro.blanco === "#FFFFFF");
  prueba("las paletas son IMNOBA, Medicina Clínica y las dos Retro-Científica (los nombres de IMNOBA y Medicina no cambian)", Object.keys(N.PALETAS).sort().join() === "imnoba,medicina,retro,retro-imnoba" && /IMNOBA \(Colores oficiales de marca\)/.test(imn.nombre) && N.PALETAS.medicina.nombre === "Medicina Clínica");
  prueba("el prompt no deja que la IA escriba hexadecimales (solo tokens)", /No escribes código ni colores hexadecimales/.test(N.sistemaAnimacion({ paleta: "imnoba", sfx: true, svg: true, tres: true })));
  const valida = validarEsquema(respuestaEjemplo, N.esquemaAnimacion({ paleta: "imnoba", sfx: true, svg: true, tres: true }).schema);
  prueba("la respuesta de ejemplo cumple su propio esquema", valida.length === 0, valida[0]);
  prueba("Prompt Formateador: formato exacto del encabezado y modos SVG/3D", /\[ESCENA 1 \| 0s-4s \| MODO: SVG\]/.test(N.PROMPT_FORMATEADOR) && /MODO: 3D/.test(N.PROMPT_FORMATEADOR) && /No uses subtítulos/.test(N.PROMPT_FORMATEADOR));

  // ------------------------------------------------------------ saneado y validación
  console.log("\nSaneado y validación local");
  const bloques = r.escenas;
  const ens = (raw, o = {}) => N.ensamblar(raw, bloques, { paleta: "imnoba", sfx: true, ...o });
  const bueno = ens(respuestaEjemplo);
  prueba("la respuesta de ejemplo se ensambla sin errores y conserva tiempos y texto del guion", Boolean(bueno.anim) && bueno.anim.duracion === 28 && bueno.anim.escenas[2].inicio === 10 && /plano/.test(bueno.anim.escenas[2].texto) && bueno.anim.escenas.length === 5, bueno.errores.join(" | "));
  prueba("el resultado pasa validar()", N.validar(bueno.anim).length === 0, N.validar(bueno.anim).join(" | "));
  prueba("los textos largos se envuelven y quedan dentro del margen de 90 px (con ≥ 80 px de margen real)", bueno.anim.escenas.filter((e) => e.modo === "SVG").flatMap((e) => e.elementos).filter((x) => x.tipo === "texto").every((t) => { const w = Math.max(...t.texto.split("\n").map((l) => N.anchoLinea(l, t.tam, t.peso))); const x0 = t.alinear === "centro" ? t.x - w / 2 : t.alinear === "izquierda" ? t.x : t.x - w; return x0 >= 89 && x0 + w <= 991; }));
  const sucio = JSON.parse(JSON.stringify(respuestaEjemplo));
  sucio.escenas[0].elementos[3].x = 5000; sucio.escenas[0].elementos[3].y = -300; sucio.escenas[0].elementos[0].t = 99; sucio.escenas[0].elementos[1].nombre = "no-existe";
  const san = ens(sucio);
  const el0 = san.anim.escenas[0].elementos;
  prueba("coordenadas y tiempos fuera de rango se acotan; iconos inexistentes se sustituyen", el0[3].x <= 990 && el0[3].y >= 150 && el0[0].t <= 5 && el0[1].nombre === "estrella" && san.correcciones.length > 0);
  const roto = JSON.parse(JSON.stringify(respuestaEjemplo));
  roto.escenas[0].elementos.find((x) => x.tipo === "trazo").d = "esto no es un path";
  prueba("un path SVG inválido es un ERROR que menciona la escena (para repararlo)", ens(roto).errores.some((e) => /^Escena 1:.*path/.test(e)));
  const falta = JSON.parse(JSON.stringify(respuestaEjemplo)); falta.escenas.splice(1, 1);
  prueba("una escena que la IA no devolvió es un error", ens(falta).errores.some((e) => /^Escena 2/.test(e)));
  const modo = JSON.parse(JSON.stringify(respuestaEjemplo)); modo.escenas[1] = JSON.parse(JSON.stringify(respuestaEjemplo.escenas[0])); modo.escenas[1].n = 2;
  prueba("modo equivocado (SVG donde se pidió 3D) es un error", ens(modo).errores.some((e) => /se pidió modo 3D/.test(e)));
  const sinsfx = ens(respuestaEjemplo, { sfx: false });
  prueba("SFX = No: ninguna escena guarda efectos y eventosSfx() devuelve lista vacía", sinsfx.anim.escenas.every((e) => e.sfx === undefined) && N.eventosSfx(sinsfx.anim).length === 0);
  const conSfx = N.eventosSfx(bueno.anim);
  prueba("SFX = Sí: eventos con fotograma absoluto = (inicio de escena + t) × 60, ordenados", conSfx.length >= 10 && conSfx.every((e, i) => i === 0 || e.frame >= conSfx[i - 1].frame) && conSfx.some((e) => e.frame === Math.round((5 + 0.1) * 60)), JSON.stringify(conSfx.slice(0, 4)));
  prueba("los 3D guardan cámara, luces y objetos acotados (radio de cámara ≤ 60)", bueno.anim.escenas.filter((e) => e.modo === "3D").every((e) => e.camara.radio <= 60 && e.objetos.length > 0 && e.luces.direccional >= 0));

  // ------------------------------------------------------------ código fuente: sin subtítulos ni TTS
  console.log("\nSin subtítulos ni voz");
  const fuente = (d) => readdirSync(p(...d)).filter((x) => /\.(tsx?|mjs)$/.test(x) && x !== "probar.mjs").map((x) => readFileSync(p(...d, x), "utf8")).join("\n");
  const srcAnim = fuente(["src", "anim"]);
  prueba("el motor de animación no usa subtítulos ni encabezado", !/Subtitulos|Encabezado|timestamps\.json|tiempoDe/.test(srcAnim));
  prueba("el motor de animación no monta <Audio> directamente (solo SoundEffect, y solo si hay eventos)", !/<Audio/.test(readFileSync(p("src", "anim", "Animacion.tsx"), "utf8")) && /eventosSfx/.test(readFileSync(p("src", "anim", "Animacion.tsx"), "utf8")));
  prueba("los scripts de animación no llaman a ninguna API de voz (TTS/whisper/elevenlabs)", !/audio\/speech|audio\/transcriptions|elevenlabs|edge-tts|generar-voz/i.test(fuente(["scripts", "anim"])));
  const pkg = JSON.parse(readFileSync(p("package.json"), "utf8"));
  prueba("dependencias 3D instaladas: three, @types/three, @react-three/fiber y @remotion/three", ["three", "@react-three/fiber", "@remotion/three"].every((d) => pkg.dependencies[d]) && pkg.devDependencies["@types/three"]);
  prueba("@remotion/three va a la misma versión exacta que remotion", pkg.dependencies["@remotion/three"] === pkg.dependencies.remotion, `${pkg.dependencies["@remotion/three"]} vs ${pkg.dependencies.remotion}`);
  const root = readFileSync(p("src", "Root.tsx"), "utf8");
  prueba("la composición «Animacion» es 1080×1920 a 60 fps y calcula su duración desde las escenas", /id="Animacion"/.test(root) && /calculateMetadata/.test(root));
  const m3d = readFileSync(p("src", "anim", "motor3d.tsx"), "utf8");
  prueba("las escenas 3D usan <ThreeCanvas width={W} height={H}>, luces, extrusión y la cámara interpolada con useCurrentFrame()/spring()", /<ThreeCanvas width=\{W\} height=\{alto\}/.test(m3d) && /directionalLight/.test(m3d) && /ambientLight/.test(m3d) && /ExtrudeGeometry/.test(m3d) && /useCurrentFrame/.test(m3d) && /spring\(/.test(m3d));


  // ------------------------------------------------------------ estilo Retro-Científica
  console.log("\nEstilo Retro-Científica (sin romper IMNOBA)");
  const R = N.PALETAS.retro, RI = N.PALETAS["retro-imnoba"];
  prueba("retro usa los hex EXACTOS del brief: fondo #0B0C10, papel #F4F1EA, bermellón #E63926, luz #FF9E8A, lima #D4FF33, cobalto #2B44FF", R.oscuro.fondoBorde === "#0B0C10" && R.claro.fondoBorde === "#F4F1EA" && R.oscuro.primario === "#E63926" && R.oscuro.luz === "#FF9E8A" && R.oscuro.acento === "#D4FF33" && R.oscuro.alerta === "#2B44FF" && R.oscuro.tinta === "#FFFFFF" && R.claro.tinta === "#0B0C10" && R.claro.acento === "#E63926");
  prueba("retro-imnoba conserva la ESENCIA de la marca: navy #02224E de fondo y amarillo #FFC500 como objeto de estudio", RI.oscuro.fondoBorde === "#02224E" && RI.oscuro.primario === "#FFC500" && RI.claro.primario === "#02224E" && RI.estilo === "retro");
  prueba("IMNOBA clásica y Medicina siguen siendo estilo clásico y IMNOBA sigue de paleta por defecto", imn.estilo === undefined && N.PALETAS.medicina.estilo === undefined && N.PALETA_DEFECTO === "imnoba" && N.esRetro("retro") && N.esRetro("retro-imnoba") && !N.esRetro("imnoba"));
  for (const paleta of ["retro", "retro-imnoba"]) for (const sfx of [true, false]) for (const [svg, tres] of [[true, true], [true, false], [false, true]]) {
    const e = comprobarEstricto(N.esquemaAnimacion({ paleta, sfx, svg, tres }).schema);
    prueba(`esquema ${paleta} sfx=${sfx} svg=${svg} 3d=${tres} cumple el modo estricto`, e.length === 0, e[0]);
  }
  const esqRetro = JSON.stringify(N.esquemaAnimacion({ paleta: "retro", sfx: true, svg: true, tres: true }).schema);
  const esqClasico = JSON.stringify(N.esquemaAnimacion({ paleta: "imnoba", sfx: true, svg: true, tres: true }).schema);
  prueba("el esquema retro pide título, subtítulo, medidores, línea de terminal y modelo paramétrico; el clásico no", ["titulo", "subtitulo", "medidores", "terminal", "modelo", "punteado"].every((k) => esqRetro.includes(`"${k}"`)) && ["subtitulo", "medidores", "terminal", "modelo", "punteado"].every((k) => !esqClasico.includes(`"${k}"`)));
  const sisRetro = N.sistemaAnimacion({ paleta: "retro", sfx: true, svg: true, tres: true });
  prueba("el prompt retro describe el layout (350–1450), el HUD de medidores, el modelo paramétrico y prohíbe rebotes", /y 350–1450/.test(sisRetro) && /medidores/.test(sisRetro) && /modelo/.test(sisRetro) && /sin rebotes/i.test(sisRetro) && /grosor 3/.test(sisRetro));
  const e1c = N.estimar({ modelo: "gpt-4.1-mini", caracteres: 1500, escenasSVG: 3, escenas3D: 2, sfx: true, tokensFijos: 9000 });
  prueba("la estimación del estilo retro es mayor (cada escena añade título, terminal y medidores)", N.estimar({ modelo: "gpt-4.1-mini", caracteres: 1500, escenasSVG: 3, escenas3D: 2, sfx: true, tokensFijos: 9000, retro: true }).costo > e1c.costo);

  const guionRetro = readFileSync(p("ejemplos", "animacion-retro", "guion.txt"), "utf8");
  const rawRetro = JSON.parse(readFileSync(p("ejemplos", "animacion-retro", "respuesta-ia.json"), "utf8"));
  const pr = N.parsearGuion(guionRetro);
  prueba("el ejemplo retro se interpreta: 4 escenas, 22 s", pr.errores.length === 0 && pr.escenas.length === 4 && pr.duracion === 22);
  prueba("la respuesta del ejemplo retro cumple su esquema estricto", validarEsquema(rawRetro, N.esquemaAnimacion({ paleta: "retro", sfx: true, svg: true, tres: true }).schema).length === 0);
  for (const paleta of ["retro", "retro-imnoba"]) {
    const rr = N.ensamblar(rawRetro, pr.escenas, { paleta, sfx: true });
    prueba(`ensamblar (${paleta}): sin errores y con título MAYÚSCULAS, subtítulo y 1–3 medidores por escena`, Boolean(rr.anim) && rr.anim.escenas.every((e) => e.titulo === e.titulo.toUpperCase() && e.titulo.length > 0 && e.medidores.length >= 1 && e.medidores.length <= 3), rr.errores.join(" | "));
  }
  const rr = N.ensamblar(rawRetro, pr.escenas, { paleta: "retro", sfx: true });
  const todos2D = rr.anim.escenas.flatMap((e) => (e.modo === "SVG" ? e.elementos : e.overlay));
  prueba("zona del escenario retro: todo elemento queda entre y 350 y 1450 (arriba el título, abajo el HUD)", todos2D.every((x) => ["y"].every(() => x.tipo === "linea" ? x.puntos.every((q) => q.y >= 350 && q.y <= 1450) : x.tipo === "trazo" || x.y === undefined || (x.y >= 350 && x.y <= 1450))));
  prueba("las líneas y trazos retro miden 3 px y admiten punteado", todos2D.filter((x) => x.tipo === "linea" || x.tipo === "trazo").every((x) => x.grosor === 3 && typeof x.punteado === "boolean"));
  prueba("el modelo paramétrico conserva sus vínculos a medidores (índices 0–2)", rr.anim.escenas.filter((e) => e.modo === "3D").flatMap((e) => e.objetos).filter((o) => o.tipo === "modelo").every((o) => [o.v1, o.v2, o.v3].every((v) => v === null || (v >= 0 && v <= 2))) && rr.anim.escenas[1].objetos.some((o) => o.tipo === "modelo" && o.v1 === 0 && o.v2 === 1 && o.v3 === 2));
  const sucioRetro = JSON.parse(JSON.stringify(rawRetro));
  sucioRetro.escenas[0].elementos[2].y = 200; sucioRetro.escenas[0].titulo = "un título larguísimo que no cabe en una sola línea de la pantalla vertical"; sucioRetro.escenas[0].medidores = [];
  const sr = N.ensamblar(sucioRetro, pr.escenas, { paleta: "retro", sfx: true });
  prueba("un elemento fuera del escenario retro se recoloca (y ≥ 350) y un HUD sin medidores es un error", sr.errores.some((e) => /necesita al menos 1 medidor/.test(e)));
  sucioRetro.escenas[0].medidores = rawRetro.escenas[0].medidores;
  const sr2 = N.ensamblar(sucioRetro, pr.escenas, { paleta: "retro", sfx: true });
  prueba("título largo: se envuelve en ≤ 2 líneas dentro de 900 px", sr2.anim.escenas[0].titulo.split("\n").length <= 2 && sr2.anim.escenas[0].titulo.split("\n").every((l) => l.length * sr2.anim.escenas[0].tituloTam * 0.66 <= 901), sr2.anim.escenas[0].titulo);
  prueba("la zona del escenario retro no se «pega»: IMNOBA clásica vuelve a usar y 150–1770", (() => { const cl = JSON.parse(JSON.stringify(respuestaEjemplo)); cl.escenas[0].elementos[3].y = 300; const x = N.ensamblar(cl, bloques, { paleta: "imnoba", sfx: true }); return x.anim.escenas[0].elementos[3].y === 300; })());
  const sinMed = JSON.parse(JSON.stringify(rawRetro)); sinMed.escenas[1].objetos[0].v1 = 7;
  prueba("un vínculo a un medidor inexistente se acota a 0–2 (sin romper)", N.ensamblar(sinMed, pr.escenas, { paleta: "retro", sfx: true }).anim.escenas[1].objetos[0].v1 === 2);

  // código fuente del motor retro: lo que pide el brief (se comprueba en el código porque el render real se verifica con capturas)
  const m2d = readFileSync(p("src", "anim", "motor2d.tsx"), "utf8"), anim = readFileSync(p("src", "anim", "Animacion.tsx"), "utf8"), libAnim = readFileSync(p("src", "lib", "anim.ts"), "utf8"), retroTs = readFileSync(p("src", "anim", "retro.ts"), "utf8");
  prueba("curva global cubic-bezier(0.22, 1, 0.36, 1) y sin rebotes en retro (Entrada/barras/cámara usan easeRetro, no spring)", /Easing\.bezier\(0\.22, 1, 0\.36, 1\)/.test(libAnim) && /retro \? prog\(t, el\.t, 0\.7, easeRetro\)/.test(m2d) && /retro \? easeRetro\(Math\.min\(1, f \/ dur\)\)/.test(m3d) && /retro \? easeRetro\(Math\.min\(1, frame \/ total\)\)/.test(m3d));
  prueba("terminal: 30 ms por carácter, cursor de 0,6 em × 1,1 em que parpadea cada 250 ms al terminar", /S_CARACTER = 0\.03/.test(m2d) && /S_PARPADEO = 0\.25/.test(m2d) && /width=\{tam \* 0\.6\} height=\{tam \* 1\.1\}/.test(m2d));
  prueba("H1: Inter Black (900), MAYÚSCULAS, tracking -0.03em, centrado en Y = 180", /fontWeight=\{900\}[^>]*fontSize=\{tam\}/.test(m2d) && /letterSpacing: "-0\.03em"/.test(m2d) && /y=\{180 - alto \/ 2/.test(m2d) && /\.toUpperCase\(\)/.test(readFileSync(p("src", "anim", "validar.ts"), "utf8")));
  prueba("HUD: panel desde y 1450, hasta 3 medidores; activo = borde 6 px del acento, inactivo = 2 px y opacidad 0,4; aguja y número del mismo reloj", /y=\{1450\}/.test(m2d) && /activo \? 6 : 2/.test(m2d) && /opacity=\{activo \? 1 : 0\.4\}/.test(m2d) && /normMedidor\(m, t\)/.test(m2d) && /valorMedidor\(m, t\)/.test(m2d) && /slice\(0, 3\)/.test(readFileSync(p("src", "anim", "validar.ts"), "utf8")));
  prueba("el modelo 3D usa el MISMO reloj de los medidores (normMedidor) para deformarse", /normMedidor\(medidores\[v\], t\)/.test(m3d) && /export const normMedidor/.test(retroTs));
  prueba("transición Halftone Wipe: círculos de radio 0 → 100 % que cubren la pantalla con el fondo de la escena que entra", /Semitono/.test(anim) && /rMax = PASO \* 0\.72/.test(anim) && /fill=\{color\}/.test(anim));
  prueba("cel-shading: 3 niveles duros (luz/base/semitono a 45°), contorno de 2 px y aristas negras; hex exacto sin conversión de color", /uLuz/.test(m3d) && /uSombra/.test(m3d) && /0\.70710678/.test(m3d) && /uPx: \{ value: 2 \}/.test(m3d) && /EdgesGeometry/.test(m3d) && /hexARgb/.test(m3d));
  prueba("el contexto de color se vuelve a montar dentro del Canvas 3D (los contextos de React no lo cruzan)", /<ProveedorColor paleta=\{paleta\.id\} tema=\{tema\}>/.test(m3d));
  prueba("JetBrains Mono (400 y 700) viene en public/fonts y se carga junto a Inter", existsSync(p("public", "fonts", "jetbrains-mono-latin-400-normal.woff2")) && existsSync(p("public", "fonts", "jetbrains-mono-latin-700-normal.woff2")) && /JetBrains Mono/.test(readFileSync(p("src", "lib", "fuentes.ts"), "utf8")));

  // agente con el estilo retro (OpenAI simulado)
  const mockR = await iniciarMock(0);
  const resR = await generarAnimacion({ guion: guionRetro, modelo: "gpt-4.1-mini", sfx: true, paleta: "retro", cfg: cfgMock(mockR) });
  prueba("agente retro: una llamada, escenas con título/medidores y costo real calculado", resR.uso.llamadas === 1 && resR.anim.escenas.length === 4 && resR.anim.escenas.every((e) => e.medidores.length > 0) && resR.uso.costo_usd > 0 && /medidores/.test(mockR.estado.ultimaAnimacion.sistema), JSON.stringify(resR.uso));
  prueba("agente retro: paleta guardada y el prompt de sistema es el retro", resR.anim.paleta === "retro" && /RETRO-CIENTÍFICA/.test(mockR.estado.ultimaAnimacion.sistema));
  await mockR.cerrar();


  // ------------------------------------------------------------ FORMATO ESTRUCTURADO
  console.log("\nFormato estructurado ([CONFIG], FONDO, GEO, HUD, SFX, VOZ_OFF)");
  const guionEst = readFileSync(p("ejemplos", "animacion-retro", "guion-estructurado.txt"), "utf8");
  const geoRaw = JSON.parse(readFileSync(p("ejemplos", "animacion-retro", "geometria-ia.json"), "utf8"));
  prueba("detectarFormato: reconoce el estructurado y deja pasar el simple y el retro simple", N.detectarFormato(guionEst) === "estructurado" && N.detectarFormato(guionEjemplo) === "simple" && N.detectarFormato(guionRetro) === "simple" && N.detectarFormato("[ESCENA 1 | 0-3 | FONDO: dark | MODO: SVG]\nGEO: x") === "estructurado");
  const pe = N.parsearEstructurado(guionEst);
  prueba("el ejemplo estructurado se interpreta: 4 escenas, 22 s, sin errores ni avisos", pe.escenas.length === 4 && pe.duracion === 22 && pe.errores.length === 0 && pe.avisos.length === 0, JSON.stringify([pe.errores, pe.avisos]));
  prueba("[CONFIG]: DURACION, HUD: ON y los 3 medidores con etiqueta, rango y unidad", pe.config.duracion === 22 && pe.config.hud === true && pe.config.gauges.length === 3 && pe.config.gauges[0].etiqueta === "ÁREA" && pe.config.gauges[0].min === 30 && pe.config.gauges[0].max === 120 && pe.config.gauges[0].unidad === "m²" && pe.config.gauges[1].decimales === 0 && pe.config.gauges[2].max === 700);
  prueba("escenas: FONDO dark/paper, MODO SVG/3D/3D+SVG (mixto) y H1/SUB/VOZ_OFF separados", pe.escenas.map((e) => `${e.fondo}:${e.modo}${e.mixto ? "+" : ""}`).join() === "dark:SVG,dark:3D,paper:SVG,dark:3D+" && pe.escenas[0].h1 === "EL VALOR DE UN INMUEBLE" && /^> MODELO/.test(pe.escenas[0].sub) && /área por precio/.test(pe.escenas[0].vozOff));
  prueba("GEO: tiempos relativos a la escena y varias líneas por escena", pe.escenas[0].geo.length === 2 && pe.escenas[0].geo[1].t === 3 && pe.escenas[0].geo[1].hasta === 5 && pe.escenas[1].geo[0].t === 0 && pe.escenas[1].geo[0].hasta === 6 && pe.lineasGeo === 5);
  prueba("HUD: cada línea es un tramo (G1=90 | G2=- | G3=-); «-» no mueve la aguja", pe.escenas[0].hud.length === 3 && pe.escenas[0].hud[0].valores.join() === "90,," && pe.escenas[0].hud[1].valores[1] === 5.5 && pe.escenas[0].hud[1].valores[0] === null && pe.escenas[0].hud[0].t === 1);
  prueba("SFX: tipo y tiempo relativo a la escena", pe.escenas[0].sfx.map((x) => `${x.tipo}@${x.t}`).join() === "tick@1,ding@4" && pe.escenas[1].sfx[1].tipo === "zap");
  const est2 = (txt) => N.parsearEstructurado(txt);
  const base = "[CONFIG]\nHUD: ON\nGAUGE_1: A | 0-100 | u\n[ESCENA 1 | 00:00-00:04 | FONDO: dark | MODO: SVG]\nH1: UNO\nGEO (00:00-00:04): algo\n";
  prueba("error: escena sin línea GEO", est2(base.replace("GEO (00:00-00:04): algo\n", "")).errores.some((e) => /falta al menos una línea\s+GEO/.test(e)));
  prueba("error: FONDO o MODO inexistentes", est2(base.replace("FONDO: dark", "FONDO: rojo")).errores.some((e) => /fondo/.test(e)) && est2(base.replace("MODO: SVG", "MODO: VR")).errores.some((e) => /modo/.test(e)));
  prueba("error: HUD: ON sin medidores; con HUD: OFF no hace falta y se avisa si hay líneas HUD", est2(base.replace("GAUGE_1: A | 0-100 | u\n", "")).errores.some((e) => /no hay medidores/.test(e)) && est2(base.replace("HUD: ON", "HUD: OFF") + "HUD (00:01-00:02): G1=5\n").avisos.some((a) => /HUD: OFF/.test(a)));
  prueba("tolerancia: «=» en vez de «:», minúsculas, líneas de continuación y tiempos 0s/4-9", (() => { const r = est2("[config]\nhud = on\ngauge_1 = Temp 10-50 °C\n[ESCENA 1 | 0s-9s | fondo: papel | modo: svg]\nh1 = Hola\ngeo (0-4): primera línea\n   que sigue aquí\nvoz_off: texto\n  continuado\n"); return r.errores.length === 0 && r.escenas[0].fondo === "paper" && r.escenas[0].geo[0].texto === "primera línea que sigue aquí" && r.escenas[0].vozOff === "texto continuado" && r.config.gauges[0].etiqueta === "TEMP" && r.config.gauges[0].unidad === "°C"; })());
  prueba("un valor HUD fuera del rango del medidor se acota y avisa; un sonido desconocido se ignora", (() => { const r = est2(base + "HUD (00:01-00:02): G1=500\nSFX (00:01): bum, pop\n"); return r.escenas[0].hud[0].valores[0] === 100 && r.avisos.some((a) => /sale del rango/.test(a)) && r.avisos.some((a) => /«bum»/.test(a)) && r.escenas[0].sfx.length === 1; })());
  prueba("tiempos de una escena que empieza en 00:05: GEO/HUD/SFX salen relativos (00:05-00:08 → t 0–3)", (() => { const r = est2(base.replace("00:00-00:04 | FONDO", "00:00-00:05 | FONDO") + "[ESCENA 2 | 00:05-00:11 | FONDO: dark | MODO: 3D]\nH1: DOS\nGEO (00:05-00:08): a\nHUD (00:06-00:08): G1=40\nSFX (00:07): ding\n"); const e = r.escenas[1]; return e.geo[0].t === 0 && e.geo[0].hasta === 3 && e.hud[0].t === 1 && e.sfx[0].t === 2; })());
  prueba("locución: textoLocucion junta los VOZ_OFF con sus tiempos", /\[ESCENA 2 \| 00:05-00:11\]/.test(N.textoLocucion(pe.escenas, "T")) && /área por precio/.test(N.textoLocucion(pe.escenas, "T")));

  const geoUsuario = N.promptUsuarioGeo(pe.escenas);
  prueba("a la IA viajan SOLO el modo, el fondo y las líneas GEO: ni H1, ni SUB, ni VOZ_OFF, ni HUD, ni SFX", /GEO \(0\.0-3\.0 s\): Ejes punteados/.test(geoUsuario) && /MODO: 3D\+SVG/.test(geoUsuario) && !/EL VALOR DE UN INMUEBLE|MODELO: V|fórmula simple|G1=90|tick|DEFORMANDO EN|SIMULACIÓN DE VOLATILIDAD|HUD \(/.test(geoUsuario), geoUsuario.slice(0, 300));
  const optGeo = { paleta: "retro-imnoba", svg: true, tres: true, mixto: true, hud: true };
  const fijosGeo = N.tokensFijosGeo(optGeo);
  prueba("el prompt de sistema del formato estructurado es compacto (< 1100 tokens) y menor que el del formato simple", fijosGeo.sistema < 1100 && fijosGeo.sistema < N.tokensFijos({ paleta: "retro", sfx: true, svg: true, tres: true }) / 3, JSON.stringify(fijosGeo));
  for (const paleta of ["retro", "retro-imnoba"]) for (const [svg, tres, mixto] of [[true, true, true], [true, false, false], [false, true, false], [false, true, true]]) {
    const e = comprobarEstricto(N.esquemaGeometria({ paleta, svg, tres, mixto }).schema);
    prueba(`esquema de geometría ${paleta} svg=${svg} 3d=${tres} mixto=${mixto} cumple el modo estricto`, e.length === 0, e[0]);
  }
  const esqGeo = JSON.stringify(N.esquemaGeometria(optGeo).schema);
  const clavesEscena = N.esquemaGeometria(optGeo).schema.properties.escenas.items.anyOf.flatMap((v) => Object.keys(v.properties));
  prueba("el esquema de geometría NO pide a nivel de escena título, subtítulo, medidores, tema ni sonido (eso es local)", ["titulo", "subtitulo", "medidores", "tema", "sfx"].every((k) => !clavesEscena.includes(k)) && !esqGeo.includes('"vol"') && esqGeo.includes('"modelo"') && esqGeo.includes('"terminal"'), clavesEscena.join());
  prueba("la geometría de ejemplo cumple su esquema estricto", validarEsquema(geoRaw, N.esquemaGeometria(optGeo).schema).length === 0, validarEsquema(geoRaw, N.esquemaGeometria(optGeo).schema)[0]);

  // estimador: entrada = GEO/4 + sistema (+ esquema), salida = 450 por línea GEO
  const eg = N.estimarGeo({ modelo: "gpt-4.1-mini", caracteresGeo: pe.caracteresGeo, lineasGeo: pe.lineasGeo, escenas: 4, tokensSistema: fijosGeo.sistema, tokensEsquema: fijosGeo.esquema });
  prueba("estimarGeo: entrada = ⌈GEO/4⌉ + sistema + esquema + 14 por escena; salida = 450 × líneas GEO", eg.tokensEntrada === Math.ceil(pe.caracteresGeo / 4) + fijosGeo.sistema + fijosGeo.esquema + 56 && eg.tokensSalida === 450 * pe.lineasGeo && Math.abs(eg.costo - (eg.tokensEntrada * 0.4 + eg.tokensSalida * 1.6) / 1e6) < 1e-12, JSON.stringify(eg));
  prueba("estimarGeo crece con más líneas GEO y con modelos más caros (o4-mini razona: más salida)", N.estimarGeo({ modelo: "gpt-4.1-mini", caracteresGeo: 2 * pe.caracteresGeo, lineasGeo: 2 * pe.lineasGeo, escenas: 8, tokensSistema: fijosGeo.sistema, tokensEsquema: fijosGeo.esquema }).costo > eg.costo && N.estimarGeo({ modelo: "o4-mini", caracteresGeo: pe.caracteresGeo, lineasGeo: pe.lineasGeo, escenas: 4, tokensSistema: fijosGeo.sistema, tokensEsquema: fijosGeo.esquema }).tokensSalida > eg.tokensSalida);

  // ensamblarGeo
  const rg = N.ensamblarGeo(geoRaw, pe.escenas, pe.config, { paleta: "retro", sfx: true });
  const ag = rg.anim;
  prueba("ensamblarGeo (retro): sin errores, formato estructurado, HUD ON, título local en MAYÚSCULAS y fondo desde FONDO", Boolean(ag) && ag.formato === "estructurado" && ag.hud === true && ag.escenas.map((e) => e.tema).join() === "oscuro,oscuro,claro,oscuro" && ag.escenas[0].titulo.replace(/\n/g, " ") === "EL VALOR DE UN INMUEBLE" && ag.titulo === "EL VALOR DE UN INMUEBLE", rg.errores.join(" | "));
  prueba("medidores locales: 3, con TRAMOS (claves) y el valor final de una escena es el inicial de la siguiente", ag.escenas.every((e) => e.medidores.length === 3) && ag.escenas[0].medidores[0].claves.length === 1 && ag.escenas[0].medidores[0].claves[0].valor === 90 && ag.escenas[1].medidores[0].inicio === 90 && ag.escenas[1].medidores[2].inicio === 495 && ag.escenas[0].medidores[0].inicio === 30);
  prueba("SFX locales (no los inventa la IA): vienen de las líneas SFX con vol 0.15; con SFX = No no hay eventos", ag.escenas[0].sfx.length === 2 && N.eventosSfx(ag).length >= 4 && N.eventosSfx(N.ensamblarGeo(geoRaw, pe.escenas, pe.config, { paleta: "retro", sfx: false }).anim).length === 0);
  prueba("la geometría 3D conserva el modelo atado a G1..G3 y la escena 3D+SVG admite capa vectorial completa (línea punteada)", ag.escenas[1].objetos.some((o) => o.tipo === "modelo" && o.v1 === 0 && o.v2 === 1 && o.v3 === 2) && ag.escenas[3].overlay.some((x) => x.tipo === "linea" && x.punteado === true && x.grosor === 3));
  const rgI = N.ensamblarGeo(geoRaw, pe.escenas, pe.config, { paleta: "imnoba", sfx: true });
  prueba("paleta IMNOBA + formato estructurado → se aplica retro-imnoba (con aviso); Medicina → retro", rgI.anim.paleta === "retro-imnoba" && rgI.correcciones.some((c) => /Retro-Científico/.test(c)) && N.paletaRetroDe("medicina") === "retro" && N.paletaRetroDe("retro") === "retro");
  // HUD: OFF → escenario hasta y 1800 y sin medidores
  const sinHud = est2(guionEst.replace("HUD: ON", "HUD: OFF"));
  const geoAlta = JSON.parse(JSON.stringify(geoRaw)); geoAlta.escenas[0].elementos[3].y = 1700;
  const rOff = N.ensamblarGeo(geoAlta, sinHud.escenas, sinHud.config, { paleta: "retro", sfx: true });
  const rOn = N.ensamblarGeo(geoAlta, pe.escenas, pe.config, { paleta: "retro", sfx: true });
  prueba("HUD: OFF → sin medidores, anim.hud = false y el escenario se expande (un elemento a y 1700 se respeta; con HUD ON se sube a ≤ 1450)", rOff.anim.hud === false && rOff.anim.escenas.every((e) => e.medidores.length === 0) && rOff.anim.escenas[0].elementos[3].y > 1450 && rOn.anim.escenas[0].elementos[3].y <= 1450, JSON.stringify([rOff.anim?.escenas[0].elementos[3].y, rOn.anim?.escenas[0].elementos[3].y]));
  const gSucia = JSON.parse(JSON.stringify(geoRaw)); gSucia.escenas[1].modo = "SVG";
  prueba("modo equivocado en la geometría sigue siendo un error por escena (para reparar)", N.ensamblarGeo(gSucia, pe.escenas, pe.config, { paleta: "retro", sfx: true }).errores.some((e) => /^Escena 2:.*modo 3D/.test(e)));
  const gRota = JSON.parse(JSON.stringify(geoRaw)); gRota.escenas[0].elementos.find((x) => x.tipo === "trazo").d = "no es path";
  prueba("path inválido en la geometría = error de esa escena", N.ensamblarGeo(gRota, pe.escenas, pe.config, { paleta: "retro", sfx: true }).errores.some((e) => /^Escena 1:.*path/.test(e)));
  prueba("ensamblarGeo no deja la zona «pegada»: IMNOBA clásica sigue usando y 150–1770", (() => { const cl = JSON.parse(JSON.stringify(respuestaEjemplo)); cl.escenas[0].elementos[3].y = 300; return N.ensamblar(cl, bloques, { paleta: "imnoba", sfx: true }).anim.escenas[0].elementos[3].y === 300; })());

  // reloj de medidores por tramos (retro.ts se empaqueta con esbuild: usa remotion, no está en el núcleo del panel)
  const { build } = await import("esbuild");
  const bundleRetro = await build({ entryPoints: [p("src", "anim", "retro.ts")], bundle: true, format: "esm", platform: "node", write: false, logLevel: "silent" });
  const R2 = await import("data:text/javascript;base64," + Buffer.from(bundleRetro.outputFiles[0].text).toString("base64"));
  const mTramos = { etiqueta: "X", unidad: "", min: 0, max: 100, inicio: 10, fin: 80, t: 1, dur: 1, decimales: 0, claves: [{ t: 1, dur: 1, valor: 50 }, { t: 3, dur: 1, valor: 80 }] };
  prueba("valorMedidor por tramos: inicio → 50 → 80, constante entre tramos y con la curva retro (arranque rápido)", R2.valorMedidor(mTramos, 0.5) === 10 && R2.valorMedidor(mTramos, 2.5) === 50 && R2.valorMedidor(mTramos, 5) === 80 && R2.valorMedidor(mTramos, 1.2) > 10 + 40 * 0.3 && R2.valorMedidor(mTramos, 3.5) > 50 && R2.valorMedidor(mTramos, 3.5) < 80);
  prueba("medidorActivo: activo mientras se mueve (cada tramo) y medio segundo después; inactivo entre tramos lejanos", R2.medidorActivo(mTramos, 1.5) && R2.medidorActivo(mTramos, 2.2) && !R2.medidorActivo(mTramos, 2.8) && R2.medidorActivo(mTramos, 3.2) && !R2.medidorActivo(mTramos, 5));
  prueba("sin claves (formato simple) el medidor sigue funcionando como antes: un tramo inicio → fin", R2.valorMedidor({ etiqueta: "X", unidad: "", min: 0, max: 10, inicio: 2, fin: 8, t: 1, dur: 2, decimales: 0 }, 5) === 8 && R2.valorMedidor({ etiqueta: "X", unidad: "", min: 0, max: 10, inicio: 2, fin: 8, t: 1, dur: 2, decimales: 0 }, 0) === 2);

  // código: nombres de catálogo, header de terminal y constantes del tema
  const tema = readFileSync(p("src", "theme", "retroScientific.ts"), "utf8"), comp = readFileSync(p("src", "anim", "componentesRetro.ts"), "utf8");
  prueba("src/theme/retroScientific.ts: dark #0B0C10, paper #F4F1EA, red #E63926, salmon #FF9E8A, yellow #D4FF33, blue #2B44FF; las paletas retro salen de ahí", ["#0B0C10", "#F4F1EA", "#E63926", "#FF9E8A", "#D4FF33", "#2B44FF"].every((h) => tema.includes(h)) && /LAYOUT/.test(tema) && /THEME\.red/.test(readFileSync(p("src", "anim", "paletas.ts"), "utf8")));
  prueba("componentes nativos con nombre: TerminalHeader, TelemetryHUD, GeometryStage, CelHalftoneMaterial, HalftoneWipeTransition y MasterVideoLayout", ["TerminalHeader", "TelemetryHUD", "GeometryStage", "CelHalftoneMaterial", "HalftoneWipeTransition", "MasterVideoLayout"].every((n) => comp.includes(n)));
  prueba("TerminalHeader: SUB lima sobre fondo oscuro y tinta (#0B0C10) sobre papel, con el cursor del mismo color; GeometryStage crece sin HUD", /tema === "claro" \? c\("tinta"\) : c\("acento"\)/.test(m2d) && /RETRO_ALTO_SIN_HUD = 1450/.test(m3d) && /hud = true/.test(m3d));
  prueba("el botón «Copiar Prompt Formateador» copia la plantilla con [CONFIG], GEO y HUD (y queda el formato simple aparte)", /PROMPT_FORMATEADOR_ESTRUCTURADO/.test(readFileSync(p("scripts", "panel", "web", "app.js"), "utf8")) && /\[CONFIG\]/.test(N.PROMPT_FORMATEADOR_ESTRUCTURADO) && /GEO \(00:00-00:03\)/.test(N.PROMPT_FORMATEADOR_ESTRUCTURADO) && /HUD \(00:01-00:03\): G1=90/.test(N.PROMPT_FORMATEADOR_ESTRUCTURADO) && /\[ESCENA 1 \| 0s-4s \| MODO: SVG\]/.test(N.PROMPT_FORMATEADOR));

  // agente estructurado (OpenAI simulado)
  const mockE = await iniciarMock(0);
  const resE = await generarAnimacion({ guion: guionEst, modelo: "gpt-4.1-mini", sfx: true, paleta: "retro", cfg: cfgMock(mockE) });
  const uE = resE.uso, ultE = mockE.estado.ultimaAnimacion;
  prueba("agente estructurado: una llamada con el esquema «geometria_central»; la IA recibe solo las líneas GEO", resE.formato === "estructurado" && uE.llamadas === 1 && ultE.nombre === "geometria_central" && /GEO \(0\.0-3\.0 s\)/.test(ultE.usuario) && !/VOZ_OFF|fórmula simple|EL VALOR DE UN INMUEBLE|G1=90|tick|ding/.test(ultE.usuario), ultE.usuario.slice(0, 200));
  prueba("agente estructurado: costo real = prompt_tokens × entrada + completion_tokens × salida", Math.abs(uE.costo_usd - (uE.prompt_tokens * 0.4 + uE.completion_tokens * 1.6) / 1e6) < 1e-12 && uE.prompt_tokens > 500);
  prueba("agente estructurado: devuelve la locución (VOZ_OFF) para guardarla y la animación trae título, HUD y SFX locales", /\[ESCENA 1 \| 00:00-00:05\]/.test(resE.locucion) && resE.anim.escenas.every((e) => e.medidores.length === 3 && e.titulo) && resE.anim.escenas[0].sfx.length === 2);
  const estimadoE = N.estimarGeo({ modelo: "gpt-4.1-mini", caracteresGeo: pe.caracteresGeo, lineasGeo: pe.lineasGeo, escenas: 4, tokensSistema: fijosGeo.sistema, tokensEsquema: fijosGeo.esquema });
  prueba("la estimación estructurada queda en el mismo orden de magnitud que el costo real (0,3×–3×)", estimadoE.costo / uE.costo_usd > 0.3 && estimadoE.costo / uE.costo_usd < 3, `${estimadoE.costo.toFixed(5)} vs ${uE.costo_usd.toFixed(5)}`);
  await mockE.cerrar();
  process.env.MOCK_ANIM_ERRORES = "1";
  const mockE2 = await iniciarMock(0);
  const resE2 = await generarAnimacion({ guion: guionEst, modelo: "gpt-4.1-mini", sfx: true, paleta: "retro-imnoba", cfg: cfgMock(mockE2) });
  delete process.env.MOCK_ANIM_ERRORES;
  prueba("agente estructurado: un path inválido provoca UNA reparación acotada y el costo suma ambas llamadas", resE2.uso.llamadas === 2 && resE2.anim.escenas.length === 4 && resE2.anim.paleta === "retro-imnoba", JSON.stringify(resE2.uso));
  await mockE2.cerrar();

  // ------------------------------------------------------------ agente con servidor simulado
  console.log("\nAgente (OpenAI simulado)");
  let mock = await iniciarMock(0);
  let res = await generarAnimacion({ guion: guionEjemplo, modelo: "gpt-4.1-mini", sfx: true, paleta: "imnoba", cfg: cfgMock(mock) });
  const ua = mock.estado.ultimaAnimacion;
  prueba("usa Chat Completions con esquema estricto y max_completion_tokens; gpt-4.1-mini no recibe reasoning_effort", ua?.ruta === "/chat/completions" && ua.estricto && ua.maxTokens === 32000 && ua.razonamiento === null, JSON.stringify(ua && { ...ua, sistema: "…" }));
  prueba("1 sola llamada para 5 escenas y animación válida", res.uso.llamadas === 1 && res.anim.escenas.length === 5);
  const u = res.uso;
  prueba("costo real = prompt_tokens × entrada + completion_tokens × salida (gpt-4.1-mini), guardado con 5 decimales", u.prompt_tokens > 1000 && u.completion_tokens > 500 && Math.abs(u.costo_usd - (u.prompt_tokens * 0.4 + u.completion_tokens * 1.6) / 1e6) < 1e-12 && /^\$\d+\.\d{5} USD$/.test(N.formatoUSD(u.costo_usd, 5)), JSON.stringify(u));
  prueba("la animación guarda el uso (modelo, tokens, costo)", res.anim.uso?.modelo === "gpt-4.1-mini" && res.anim.uso.prompt_tokens === u.prompt_tokens);
  const real = u.costo_usd;
  const estimado = N.estimar({ modelo: "gpt-4.1-mini", caracteres: N.parsearGuion(guionEjemplo).caracteres, escenasSVG: 3, escenas3D: 2, sfx: true, tokensFijos: N.tokensFijos({ paleta: "imnoba", sfx: true, svg: true, tres: true }) }).costo;
  prueba("la estimación previa está en el mismo orden de magnitud que el costo real (entre 0,3× y 3×)", estimado / real > 0.3 && estimado / real < 3, `estimado ${estimado.toFixed(5)} · real ${real.toFixed(5)}`);
  await mock.cerrar();

  mock = await iniciarMock(0);
  res = await generarAnimacion({ guion: guionEjemplo, modelo: "o4-mini", sfx: false, paleta: "medicina", cfg: cfgMock(mock) });
  prueba("o4-mini recibe reasoning_effort y max_completion_tokens de 40000; SFX = No → sin eventos", mock.estado.ultimaAnimacion.razonamiento === "medium" && mock.estado.ultimaAnimacion.maxTokens === 40000 && res.anim.sfx === false && res.anim.escenas.every((e) => !e.sfx));
  prueba("paleta Medicina Clínica: se guarda y no deja iconos de inmobiliaria", res.anim.paleta === "medicina" && !JSON.stringify(res.anim).includes('"casa"'));
  prueba("costo real de o4-mini con sus precios (1.10 / 4.40)", Math.abs(res.uso.costo_usd - (res.uso.prompt_tokens * 1.1 + res.uso.completion_tokens * 4.4) / 1e6) < 1e-12);
  await mock.cerrar();

  process.env.MOCK_ANIM_ERRORES = "1";
  mock = await iniciarMock(0);
  res = await generarAnimacion({ guion: guionEjemplo, modelo: "gpt-4.1-mini", sfx: true, paleta: "imnoba", cfg: cfgMock(mock) });
  delete process.env.MOCK_ANIM_ERRORES;
  prueba("respuesta con un path inválido → UNA reparación solo de esa escena y el costo suma ambas llamadas", res.uso.llamadas === 2 && res.anim.escenas.length === 5 && res.uso.completion_tokens > 0, JSON.stringify(res.uso));
  await mock.cerrar();

  // asíncrono: el servidor simulado vive en ESTE proceso y no podría responder mientras spawnSync lo bloquea
  const cli = (args, env = {}) => new Promise((ok) => {
    const proc = spawn(process.execPath, [p("scripts", "anim", "generar.mjs"), ...args], { cwd: RAIZ, env: { ...process.env, ...env } });
    let stdout = "", stderr = "";
    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("close", (status) => ok({ status, stdout, stderr }));
  });
  mock = await iniciarMock(0);
  let rc = await cli([`--guion=${p("ejemplos", "animacion-imnoba", "guion.txt")}`, "--modelo=gpt-4o-mini", "--sfx=no"], { OPENAI_BASE_URL: mock.url, OPENAI_API_KEY: "prueba" });
  const guardada = JSON.parse(readFileSync(ANIM, "utf8"));
  prueba("CLI generar.mjs: escribe animacion.json y muestra el costo real en USD", rc.status === 0 && /Costo real de este video: \$\d+\.\d{5} USD/.test(rc.stdout) && guardada.uso.modelo === "gpt-4o-mini" && guardada.sfx === false, (rc.stdout + rc.stderr).slice(-400));
  prueba("CLI: deja la generación en el historial", readdirSync(p("trabajo", "anim", "historial")).some((x) => !historialAntes.has(x)));
  const malo = join(p("trabajo", "tmp"), "guion-malo.txt");
  writeFileSync(malo, "[ESCENA 1 | 5s-2s | MODO: VR]\nx");
  const llamadasAntes = mock.estado.porEsquema.animacion_imnoba;
  rc = await cli([`--guion=${malo}`], { OPENAI_BASE_URL: mock.url, OPENAI_API_KEY: "prueba" });
  prueba("CLI con guion inválido: código 2 y lista los problemas (sin llamar a la IA)", rc.status === 2 && /problemas/.test(rc.stderr) && mock.estado.porEsquema.animacion_imnoba === llamadasAntes, rc.stderr.slice(-300));
  rmSync(malo, { force: true });
  await mock.cerrar();

  // ------------------------------------------------------------ panel
  console.log("\nPanel (API del Estudio)");
  mock = await iniciarMock(0);
  process.env.OPENAI_BASE_URL = mock.url;
  process.env.OPENAI_API_KEY = "prueba";
  const panel = await iniciarPanel({ puerto: 4290 });
  const http = async (metodo, ruta, cuerpo) => {
    const r = await fetch(panel.url + ruta, { method: metodo, headers: { ...(metodo !== "GET" ? { "X-VideMed": "panel", "Content-Type": "application/json" } : {}) }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
    const texto = await r.text();
    let json = null; try { json = JSON.parse(texto); } catch { /* no json */ }
    return { codigo: r.status, texto, json, tipo: r.headers.get("content-type") };
  };
  const esperarTrabajo = async () => { for (let i = 0; i < 400; i++) { const e = await http("GET", "/api/estado"); if (e.json.trabajo && e.json.trabajo.estado !== "corriendo") return e.json.trabajo; await new Promise((r) => setTimeout(r, 300)); } return null; };
  try {
    let h = await http("GET", "/modulos/anim-nucleo.js");
    prueba("el panel sirve el MISMO núcleo (parser, costos, esquema) compilado para el navegador", h.codigo === 200 && /javascript/.test(h.tipo) && /parsearGuion/.test(h.texto) && /costoUSD/.test(h.texto) && !/require\(/.test(h.texto));
    h = await http("GET", "/");
    prueba("la interfaz tiene el Estudio como pantalla principal", /data-nav="estudio"/.test(h.texto));
    h = await http("GET", "/app.js");
    prueba("el Estudio tiene los 4 controles: textarea, modelo, SFX y paleta, más el costo en vivo y copiar prompt", ["textarea#guion", "select#modelo", "input#sfx", "select#paleta", "costo-estimado", "Copiar Prompt Formateador", "Costo estimado de este video", "Costo real de este video"].every((t) => h.texto.includes(t)));
    h = await http("GET", "/api/anim/ejemplo");
    prueba("API: entrega el guion de ejemplo", h.codigo === 200 && /\[ESCENA 1/.test(h.json.guion));
    h = await http("GET", "/api/anim/ejemplo?paleta=retro");
    prueba("API: con la paleta retro entrega el ejemplo en formato estructurado", h.codigo === 200 && /\[CONFIG\]/.test(h.json.guion) && /GAUGE_1/.test(h.json.guion) && /valor de un inmueble/i.test(h.json.guion));
    h = await http("POST", "/api/accion", { nombre: "anim-generar", opciones: { guion: "[ESCENA 1 | 5s-2s | MODO: X]\nhola", modelo: "gpt-4.1-mini" } });
    prueba("API: un guion inválido se rechaza con 400 y explica el problema", h.codigo === 400 && /problemas/.test(h.json.error), h.texto.slice(0, 200));
    h = await http("POST", "/api/accion", { nombre: "anim-generar", opciones: { guion: guionEjemplo, modelo: "gpt-4.1-mini", sfx: false, paleta: "imnoba" } });
    prueba("API: lanza el trabajo de generación", h.codigo === 200 && h.json.trabajo?.nombre === "anim-generar", h.texto.slice(0, 200));
    const fin = await esperarTrabajo();
    prueba("el trabajo termina bien", fin?.estado === "ok", JSON.stringify(fin));
    h = await http("GET", "/api/anim/estado");
    const an = h.json.animacion;
    prueba("estado: animación con 5 escenas, SFX=No, paleta imnoba y costo real guardado", an?.escenas.length === 5 && an.sfx === false && an.paleta === "imnoba" && an.uso.costo_usd > 0 && an.uso.prompt_tokens > 0 && an.uso.completion_tokens > 0, h.texto.slice(0, 200));
    prueba("estado: historial con la generación", h.json.historial.length >= 1 && h.json.historial[0].costo > 0);
    const id = h.json.historial[0].id;
    h = await http("POST", "/api/accion", { nombre: "anim-generar", opciones: { guion: "[CONFIG]\nHUD: ON\n[ESCENA 1 | 00:00-00:04 | FONDO: dark | MODO: SVG]\nH1: X\n", modelo: "gpt-4.1-mini" } });
    prueba("API: un guion estructurado sin GEO ni medidores se rechaza con 400", h.codigo === 400 && /GEO|medidores/.test(h.json.error), h.texto.slice(0, 200));
    h = await http("POST", "/api/accion", { nombre: "anim-generar", opciones: { guion: guionEst, modelo: "gpt-4.1-mini", sfx: true, paleta: "retro" } });
    const finE = await esperarTrabajo();
    h = await http("GET", "/api/anim/estado");
    prueba("API: generar en formato estructurado → animación con HUD, costo real y enlace al guion de locución", finE?.estado === "ok" && h.json.animacion?.formato === "estructurado" && h.json.animacion.hud === true && h.json.animacion.uso.costo_usd > 0 && h.json.locucion?.url === "/salida/guion-locucion.txt?descargar=1", JSON.stringify(finE) + h.texto.slice(0, 200));
    h = await http("GET", "/salida/guion-locucion.txt");
    prueba("el guion de locución (VOZ_OFF) se sirve y trae los textos para grabar", h.codigo === 200 && /área por precio/.test(h.texto) && !/GEO|HUD/.test(h.texto));
    h = await http("POST", "/api/accion", { nombre: "anim-ejemplo", opciones: { sfx: true } });
    await esperarTrabajo();
    h = await http("GET", "/api/anim/estado");
    prueba("«Cargar ejemplo» funciona sin IA ni coste (uso = null)", h.json.animacion.uso === null && h.json.animacion.sfx === true);
    h = await http("POST", "/api/anim/cargar", { id });
    prueba("cargar del historial devuelve el guion y las opciones", h.codigo === 200 && /\[ESCENA 1/.test(h.json.guion) && h.json.opciones.modelo === "gpt-4.1-mini");
    h = await http("POST", "/api/accion", { nombre: "anim-generar", opciones: { guion: guionEjemplo } });
    delete process.env.OPENAI_API_KEY;
    h = await http("POST", "/api/anim/cargar", { id: "../../etc/passwd" });
    prueba("seguridad: el id del historial no permite salir de la carpeta", h.codigo === 404);
    await esperarTrabajo();
  } finally {
    await panel.cerrar();
    await mock.cerrar();
  }

  // ------------------------------------------------------------ render real de capturas
  if (conRender) {
    console.log("\nCapturas reales (Chrome + WebGL)");
    spawnSync(process.execPath, [p("scripts", "anim", "ejemplo.mjs")], { cwd: RAIZ });
    const rp = spawnSync(process.execPath, [p("scripts", "anim", "previa.mjs"), "--qa"], { cwd: RAIZ, encoding: "utf8", timeout: 600000 });
    prueba("previa.mjs --qa: 5 capturas (SVG y 3D con WebGL) y QA sin problemas", rp.status === 0 && readdirSync(p("trabajo", "tmp", "anim-previa")).filter((x) => /^escena-\d+\.png$/.test(x)).length === 5, (rp.stdout + rp.stderr).slice(-500));
  }
} finally {
  if (envAntes.base === undefined) delete process.env.OPENAI_BASE_URL; else process.env.OPENAI_BASE_URL = envAntes.base;
  if (envAntes.clave === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = envAntes.clave;
  if (respaldo !== null) writeFileSync(ANIM, respaldo);
  const dir = p("trabajo", "anim", "historial");
  if (existsSync(dir)) for (const f of readdirSync(dir)) if (!historialAntes.has(f)) rmSync(join(dir, f), { force: true });
}

console.log(`\n${falladas.length ? "❌" : "✅"} ${pasadas} pruebas correctas, ${falladas.length} fallidas${falladas.length ? ": " + falladas.join(" · ") : ""}`);
process.exit(falladas.length ? 1 : 0);
