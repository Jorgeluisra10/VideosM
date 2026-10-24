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
  prueba("hay 5 modelos (gpt-4.1-mini el recomendado, primero; gpt-4.1-nano $0.10/$0.40 añadido)", N.MODELOS.length === 5 && N.MODELOS[0].id === "gpt-4.1-mini" && /Recomendado/.test(N.MODELOS[0].etiqueta) && N.MODELOS.some((m) => m.id === "gpt-4.1-nano" && m.entrada === 0.1 && m.salida === 0.4 && !m.razonador));
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
  prueba("el motor de animación solo monta <Audio> para la música del motor viral (y solo si llevaMusica(); los efectos van por SoundEffect y eventosSfx)", (readFileSync(p("src", "anim", "Animacion.tsx"), "utf8").match(/<Audio/g) ?? []).length === 1 && /llevaMusica\(animacion\) && \(\s*<Audio/.test(readFileSync(p("src", "anim", "Animacion.tsx"), "utf8")) && /eventosSfx/.test(readFileSync(p("src", "anim", "Animacion.tsx"), "utf8")));
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
  const resR = await generarAnimacion({ guion: guionRetro, modelo: "gpt-4.1-mini", sfx: true, paleta: "retro", cfg: cfgMock(mockR), motor: "clasico" });
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
  prueba("los prompts del formato HUD y del formato simple siguen existiendo (en «Otros formatos»)", /PROMPT_FORMATEADOR_ESTRUCTURADO/.test(readFileSync(p("scripts", "panel", "web", "app.js"), "utf8")) && /\[CONFIG\]/.test(N.PROMPT_FORMATEADOR_ESTRUCTURADO) && /GEO \(00:00-00:03\)/.test(N.PROMPT_FORMATEADOR_ESTRUCTURADO) && /HUD \(00:01-00:03\): G1=90/.test(N.PROMPT_FORMATEADOR_ESTRUCTURADO) && /\[ESCENA 1 \| 0s-4s \| MODO: SVG\]/.test(N.PROMPT_FORMATEADOR));

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


  // ------------------------------------------------------------ LIENZO LIBRE (Dirección de Arte)
  console.log("\nLienzo libre (código generativo sobre todo el lienzo)");
  const guionLibre = readFileSync(p("ejemplos", "animacion-libre", "guion-libre.txt"), "utf8");
  const codigoLibre = JSON.parse(readFileSync(p("ejemplos", "animacion-libre", "codigo-ia.json"), "utf8"));
  prueba("detectarFormato: «libre» cuando las cabeceras solo traen el tiempo; MODO: o FONDO: siguen siendo simple o estructurado", N.detectarFormato(guionLibre) === "libre" && N.detectarFormato("[ESCENA 1 | 00:00-00:05]\nhola") === "libre" && N.detectarFormato("[ESCENA 1 | 0s-4s | MODO: SVG]\nx") === "simple" && N.detectarFormato("[ESCENA 1 | 0-3 | FONDO: dark | MODO: SVG]\nGEO: x") === "estructurado" && N.detectarFormato(guionEst) === "estructurado");
  const pl = N.parsearLibre(guionLibre);
  prueba("el ejemplo libre se interpreta: 5 escenas, 28 s, SIN errores ni avisos y sin [CONFIG] ni medidores", pl.escenas.length === 5 && pl.duracion === 28 && pl.errores.length === 0 && pl.avisos.length === 0, JSON.stringify([pl.errores, pl.avisos]));
  prueba("VOZ_OFF y DIRECCION_VISUAL se separan; la voz es contexto y la dirección es lo que se dibuja", /publicar tu casa/.test(pl.escenas[0].voz) && /Noche azul profunda/.test(pl.escenas[0].direccion) && !/publicar tu casa/.test(pl.escenas[0].direccion) && pl.escenas[0].dur === 5 && pl.escenas[2].inicio === 10);
  prueba("SFX con tiempo relativo a la escena (whoosh@0, ding@3) y nombres desconocidos caen en silencio a pop/whoosh, sin avisos", pl.escenas[0].sfx.map((x) => `${x.tipo}@${x.t}`).join() === "whoosh@0,ding@3" && (() => { const r = N.parsearLibre("[ESCENA 1 | 0-4]\nDIRECCION_VISUAL: algo\nSFX: bum (1), swish (2), ding"); return r.avisos.length === 0 && r.errores.length === 0 && r.escenas[0].sfx.map((x) => x.tipo).join() === "pop,whoosh,ding" && N.sfxConFallback("raro") === "pop" && N.sfxConFallback("latido") === "heartbeat"; })());
  prueba("texto libre sin claves = dirección visual; claves desconocidas (NOTA:, CAMARA:) no dan error; GEO/H1/SUB/HUD se entienden como dirección", (() => { const r = N.parsearLibre("[ESCENA 1 | 00:00-00:04]\nUna casa que se dibuja sola.\nCAMARA: zoom lento\nH1: HOLA\nHUD (00:01-00:03): G1=75\nGEO (00:01-00:02): estrellas"); const d = r.escenas[0].direccion; return r.errores.length === 0 && r.avisos.length === 0 && /Una casa que se dibuja sola/.test(d) && /camara: zoom lento/.test(d) && /«HOLA»/.test(d) && /\(1\.0–3\.0 s de la escena\)/.test(d) && /\(1\.0–2\.0 s de la escena\) estrellas/.test(d); })());
  prueba("sin dirección: usa la voz como pista; sin nada, un aviso suave (no un error)", (() => { const a = N.parsearLibre("[ESCENA 1 | 0-4]\nVOZ_OFF: hola mundo"); const b = N.parsearLibre("[ESCENA 1 | 0-4]\nSFX: pop"); return a.errores.length === 0 && /hola mundo/.test(a.escenas[0].direccion) && b.errores.length === 0 && b.avisos.some((x) => /no tiene texto/.test(x)); })());
  prueba("errores reales y solo esos: tiempo ilegible, fin ≤ inicio, solapes y texto sin escenas", N.parsearLibre("[ESCENA 1 | hola]\nx").errores.length === 1 && N.parsearLibre("[ESCENA 1 | 5-2]\nx").errores.length === 1 && N.parsearLibre("[ESCENA 1 | 0-5]\nx\n[ESCENA 2 | 4-9]\ny").errores.length === 1 && N.parsearLibre("hola").errores.length === 1);
  prueba("una escena que empieza en 00:05 conserva sus tiempos relativos y la primera siempre arranca en 0", N.parsearLibre("[ESCENA 1 | 00:02-00:05]\nx").escenas[0].inicio === 0 && N.parsearLibre("[ESCENA 1 | 0-5]\nx\n[ESCENA 2 | 5-9]\nGEO (00:06-00:08): y").escenas[1].direccion.includes("(1.0–3.0 s de la escena)"));
  const imnC = N.coloresIA("imnoba");
  prueba("coloresIA IMNOBA: azul profundo #02224E, dorado #FFC500, blanco #F8FAFC, coral #E63926 y esmeralda #10B981", imnC.fondo === "#02224E" && imnC.acento === "#FFC500" && imnC.blanco === "#F8FAFC" && imnC.coral === "#E63926" && imnC.esmeralda === "#10B981" && N.coloresIA("medicina").fondo === "#0B0F19" && N.coloresIA("retro").acento === "#D4FF33" && Object.keys(N.coloresIA("retro-imnoba")).sort().join() === Object.keys(imnC).sort().join());
  prueba("revisarCodigo acepta las 5 escenas del ejemplo escritas a mano", codigoLibre.escenas.every((e) => N.revisarCodigo(e.codigo).length === 0), codigoLibre.escenas.map((e) => N.revisarCodigo(e.codigo).join("|")).join(" / "));
  const rev = (c) => N.revisarCodigo(c).join(" | ");
  const buena = "const f = useCurrentFrame();\nreturn <AbsoluteFill />;";
  prueba("política: rechaza Math.random, Date, fetch, window, document, eval, import, useState/useEffect, setTimeout y cualquier cosa de red", /Math\.random/.test(rev(buena + " Math.random()")) && /Date/.test(rev(buena + " new Date()")) && /red/.test(rev(buena + " fetch('x')")) && /window/.test(rev(buena + " window.x")) && /window/.test(rev(buena + " document.body")) && /eval/.test(rev(buena + " eval('1')")) && /import/.test(rev("import x from 'y'\n" + buena)) && /useState/.test(rev(buena + " const [a]=useState(1)")) && /temporizadores/.test(rev(buena + " setTimeout(()=>1)")) && /constructor/.test(rev(buena + " ({}).constructor")));
  prueba("política: no marca falsos positivos habituales (style top:, variables location/parent/self/process, texto «window» en rótulos)", rev(buena + " const location = 1; const parent = 2; const self = 3; const process = 4; const x = <div style={{ top: 10 }} />;") === "");
  prueba("política: exige return y uso del tiempo (escena estática = error); las palabras prohibidas dentro de textos o comentarios NO cuentan", /return/.test(rev("const f = useCurrentFrame();")) && /tiempo/.test(rev("return <AbsoluteFill />;")) && rev(buena.replace("<AbsoluteFill />", '<KineticText texto="Date y window son palabras" />') + " // fetch en un comentario") === "" && /demasiado largo/.test(rev(buena + " ".repeat(15000))) && /vacío/.test(rev("")));
  const eL = N.esquemaLibre({ sfx: true }), eLn = N.esquemaLibre({ sfx: false });
  prueba("esquema del lienzo libre: solo el sobre {escenas:[{n, codigo, sfx?}]}, estricto y minúsculo (sin casillas rígidas)", comprobarEstricto(eL.schema).length === 0 && comprobarEstricto(eLn.schema).length === 0 && JSON.stringify(eL.schema).length < 700 && !JSON.stringify(eLn.schema).includes("sfx") && JSON.stringify(eL.schema).includes("sfx") && Object.keys(eL.schema.properties.escenas.items.properties).join() === "n,codigo,sfx");
  const sisL = N.sistemaLibre({ paleta: "imnoba", sfx: true });
  prueba("prompt de sistema libre: lienzo 1080×1920 completo, sin cabecera/HUD/cajas fijas, kit con sus 5 pinceles, paleta IMNOBA con hex y reglas de movimiento", /TODO el lienzo vertical 1080×1920/.test(sisL) && /no hay cabecera, HUD ni cajas fijas/.test(sisL) && ["Camera2D", "OrganicDrawPath", "FloatingAnnotation", "Isometric3DStage", "AmbientParticles", "KineticText"].every((k) => sisL.includes(k)) && ["#02224E", "#FFC500", "#F8FAFC", "#E63926", "#10B981"].every((h) => sisL.includes(h)) && /Prohibidas las cajas rectangulares/.test(sisL) && /movimiento continuo/.test(sisL) && /useCurrentFrame/.test(sisL) && /lu-/.test(sisL) && /hi-/.test(sisL));
  prueba("el prompt libre sin SFX no pide sonido; con SFX sí; la paleta Medicina cambia los colores", !/«sfx»/.test(N.sistemaLibre({ paleta: "imnoba", sfx: false })) && /«sfx»/.test(sisL) && /#0B0F19/.test(N.sistemaLibre({ paleta: "medicina", sfx: false })) && !/#02224E/.test(N.sistemaLibre({ paleta: "medicina", sfx: false })));
  const usuarioL = N.promptUsuarioLibre(pl.escenas);
  prueba("a la IA viajan la duración, la DIRECCIÓN VISUAL y la VOZ solo como contexto; nada de [CONFIG], HUD ni medidores", /\[ESCENA 1 \| 5\.0 s\]/.test(usuarioL) && /DIRECCIÓN VISUAL: Noche azul/.test(usuarioL) && /VOZ \(solo contexto/.test(usuarioL) && !/CONFIG|GAUGE|HUD:/.test(usuarioL) && !/SFX/.test(usuarioL));
  const fijosL = N.tokensFijosLibre({ paleta: "imnoba", sfx: true });
  const elib = N.estimarLibre({ modelo: "gpt-4.1-mini", caracteres: pl.caracteresIA, escenas: 5, sfx: true, tokensSistema: fijosL.sistema, tokensEsquema: fijosL.esquema });
  prueba("estimarLibre: entrada = sistema + esquema + texto/3.6 + 24 por escena; salida = 1.300 por escena (+70 con SFX); el esquema ya casi no pesa", elib.tokensEntrada === fijosL.sistema + fijosL.esquema + Math.ceil(pl.caracteresIA / 3.6) + 120 && elib.tokensSalida === 5 * 1370 && fijosL.esquema < 200 && fijosL.sistema > 1200 && fijosL.sistema < 4000, JSON.stringify([fijosL, elib]));
  prueba("estimarLibre crece con las escenas y con el modelo (o4-mini razona)", N.estimarLibre({ modelo: "gpt-4.1-mini", caracteres: 2 * pl.caracteresIA, escenas: 10, sfx: true, tokensSistema: fijosL.sistema, tokensEsquema: fijosL.esquema }).costo > elib.costo && N.estimarLibre({ modelo: "o4-mini", caracteres: pl.caracteresIA, escenas: 5, sfx: true, tokensSistema: fijosL.sistema, tokensEsquema: fijosL.esquema }).tokensSalida > elib.tokensSalida);
  prueba("el Prompt Formateador libre: [ESCENA n | MM:SS-MM:SS], VOZ_OFF y DIRECCION_VISUAL; solo el tiempo es obligatorio; prohíbe cajas y HUD fijo", /\[ESCENA 1 \| 00:00-00:05\]/.test(N.PROMPT_FORMATEADOR_LIBRE) && /VOZ_OFF:/.test(N.PROMPT_FORMATEADOR_LIBRE) && /DIRECCION_VISUAL:/.test(N.PROMPT_FORMATEADOR_LIBRE) && /Solo es obligatorio el tiempo/.test(N.PROMPT_FORMATEADOR_LIBRE) && /Nada de cajas rectangulares/.test(N.PROMPT_FORMATEADOR_LIBRE) && /no existe cabecera ni panel fijo/.test(N.PROMPT_FORMATEADOR_LIBRE) && !/CONFIG|GAUGE/.test(N.PROMPT_FORMATEADOR_LIBRE));

  // compilación y ensamblado (Node)
  const { compilarEscena, ensamblarLibre, aplicarRescate } = await import("./libre.mjs");
  const jsOk = await compilarEscena(codigoLibre.escenas[0].codigo);
  prueba("compilarEscena: JSX → React.createElement y define la función Escena", /function Escena\(/.test(jsOk) && /React\.createElement\(/.test(jsOk) && !/<AbsoluteFill/.test(jsOk));
  prueba("compilarEscena: un error de sintaxis se explica con su línea (para que la IA lo repare)", await compilarEscena("const f = ;\nreturn <div/>;").then(() => false, (e) => /sintaxis \(línea 1\)/.test(e.message)));
  const al = await ensamblarLibre(codigoLibre, pl.escenas, { paleta: "imnoba", sfx: true });
  prueba("ensamblarLibre: 5 escenas «LIBRE» con código, js, tiempos del guion y formato libre sin HUD", Boolean(al.anim) && al.anim.formato === "libre" && al.anim.hud === false && al.anim.escenas.length === 5 && al.anim.escenas.every((e) => e.modo === "LIBRE" && e.js.length > 50 && e.codigo.length > 50) && al.anim.escenas[2].inicio === 10 && al.anim.duracion === 28 && al.anim.paleta === "imnoba", al.errores.join(" | "));
  prueba("SFX: lo que escribió el usuario manda (whoosh@0, ding@3); sin SFX en el guion se usan los de la IA; con SFX = No no hay ninguno", al.anim.escenas[0].sfx.map((x) => x.tipo + "@" + x.t).join() === "whoosh@0,ding@3" && al.anim.escenas[4].sfx[0].tipo === "ding" && N.eventosSfx(al.anim).length >= 8 && (await ensamblarLibre(codigoLibre, pl.escenas, { sfx: false })).anim.escenas.every((e) => e.sfx === undefined) && N.eventosSfx((await ensamblarLibre(codigoLibre, pl.escenas, { sfx: false })).anim).length === 0);
  const rotoL = JSON.parse(JSON.stringify(codigoLibre)); rotoL.escenas[0].codigo = "const f = useCurrentFrame(); const r = Math.random();\nreturn <AbsoluteFill />;"; rotoL.escenas.splice(2, 1);
  const alRoto = await ensamblarLibre(rotoL, pl.escenas, { sfx: true });
  prueba("ensamblarLibre: código prohibido y escena ausente son errores por escena; con rescate=true se sustituyen por una escena segura y el video sigue", alRoto.anim === null && alRoto.errores.some((e) => /^Escena 1:.*Math\.random/.test(e)) && alRoto.errores.some((e) => /^Escena 3:.*no devolvió/.test(e)) && await (async () => { const r = await ensamblarLibre(rotoL, pl.escenas, { sfx: true, rescate: true }); return Boolean(r.anim) && r.rescatadas.join() === "1,3" && r.anim.escenas[0].fallback === true && N.revisarCodigo(r.anim.escenas[0].codigo).length === 0 && r.anim.escenas[1].fallback === undefined; })());
  prueba("aplicarRescate sustituye por código seguro las escenas pedidas", await (async () => { const a2 = JSON.parse(JSON.stringify(al.anim)); await aplicarRescate(a2, [2], pl.escenas); return a2.escenas[1].fallback === true && /KineticText/.test(a2.escenas[1].codigo) && a2.escenas[0].fallback === undefined; })());
  prueba("validar() acepta la animación libre y exige código compilado", N.validar(al.anim).length === 0 && N.validar({ ...al.anim, escenas: al.anim.escenas.map((e, i) => (i === 0 ? { ...e, js: "" } : e)) }).some((x) => /sin código compilado/.test(x)));

  // código fuente: kit y runtime
  const kit = readFileSync(p("src", "primitives", "MotionKit.tsx"), "utf8"), runtime = readFileSync(p("src", "anim", "EscenaLibre.tsx"), "utf8");
  prueba("MotionKit exporta Camera2D, OrganicDrawPath (evolvePath), FloatingAnnotation, Isometric3DStage (@remotion/three, luces, sombras suaves, flotación Math.sin(frame / 20)) y AmbientParticles", ["Camera2D", "OrganicDrawPath", "FloatingAnnotation", "Isometric3DStage", "AmbientParticles", "KineticText"].every((n) => new RegExp(`export const ${n}\\b`).test(kit)) && /evolvePath/.test(kit) && /ThreeCanvas/.test(kit) && /shadows=\{shadows \? "soft"/.test(kit) && /Math\.sin\(f \/ 20\)/.test(kit) && /lighting === "dramatic"|"dramatic"/.test(kit) && /shake/.test(kit) && /glow/.test(kit));
  prueba("el kit no usa Math.random ni Date (render determinista)", !/Math\.random|\bDate\b/.test(kit));
  prueba("EscenaLibre: compila con new Function en modo estricto, aísla fallos con un ErrorBoundary y deja «[ESCENA-ERROR]» en consola", /new Function/.test(runtime) && /"use strict"/.test(runtime) && /getDerivedStateFromError/.test(runtime) && /\[ESCENA-ERROR\]/.test(runtime) && /Rescate/.test(runtime));
  prueba("Animacion: la escena LIBRE ocupa el 100 % (no pasa por CapaRetro, HUD, título ni Fondo2D) y el halftone wipe solo va en los formatos con HUD", /e\.modo === "LIBRE"\) return <EscenaLibre/.test(anim) && /animacion\.formato !== "libre"/.test(anim));
  prueba("las constantes del kit coinciden con el lienzo (W=1080, H=1920, FPS=60) y el ámbito expone useT, entra, float, rand, ease y los pinceles", /export const W = 1080/.test(kit) && /export const H = 1920/.test(kit) && /export const FPS = 60/.test(kit) && ["useT", "entra", "float", "rand", "ease", "Svg", "KineticText", "Cuerpo3D", "Barras3D", "Ciudad3D"].every((n) => new RegExp(`\\b${n}\\b`).test(kit.slice(kit.indexOf("AMBITO_KIT")))));
  prueba("el panel: «Copiar Prompt Formateador» y «Cargar ejemplo» usan la frase de idea (viral); el lienzo libre queda en «Avanzado»", /PROMPT_FORMATEADOR_IDEA/.test(readFileSync(p("scripts", "panel", "web", "app.js"), "utf8")) && /cargarEjemplo\("viral"\)/.test(readFileSync(p("scripts", "panel", "web", "app.js"), "utf8")) && /PROMPT_FORMATEADOR_LIBRE/.test(readFileSync(p("scripts", "panel", "web", "app.js"), "utf8")) && /Avanzado/.test(readFileSync(p("scripts", "panel", "web", "app.js"), "utf8")));

  // agente del lienzo libre (OpenAI simulado, sin Chrome: la verificación en navegador se prueba con --render)
  const mockL = await iniciarMock(0);
  const resL = await generarAnimacion({ guion: guionLibre, modelo: "gpt-4.1-mini", sfx: true, paleta: "imnoba", cfg: cfgMock(mockL), verificar: false, motor: "clasico" });
  const ulL = mockL.estado.ultimaAnimacion, uL = resL.uso;
  prueba("agente libre: UNA llamada (esquema «escenas_libres»), animación libre de 5 escenas y locución para grabar", resL.formato === "libre" && uL.llamadas === 1 && ulL.nombre === "escenas_libres" && ulL.estricto && resL.anim.escenas.length === 5 && /\[ESCENA 1 \| 00:00-00:05\]/.test(resL.locucion) && /publicar tu casa/.test(resL.locucion), JSON.stringify(uL));
  prueba("agente libre: el prompt de sistema es el del kit con la paleta IMNOBA y la entrada lleva dirección visual + voz como contexto", /Camera2D/.test(ulL.sistema) && /#02224E/.test(ulL.sistema) && /DIRECCIÓN VISUAL:/.test(ulL.usuario) && /VOZ \(solo contexto/.test(ulL.usuario) && !/CONFIG|GAUGE/.test(ulL.usuario));
  prueba("agente libre: costo real = prompt_tokens × entrada + completion_tokens × salida", Math.abs(uL.costo_usd - (uL.prompt_tokens * 0.4 + uL.completion_tokens * 1.6) / 1e6) < 1e-12 && uL.prompt_tokens > 1500);
  const estL = N.estimarLibre({ modelo: "gpt-4.1-mini", caracteres: pl.caracteresIA, escenas: 5, sfx: true, tokensSistema: fijosL.sistema, tokensEsquema: fijosL.esquema });
  prueba("la estimación libre queda en el mismo orden de magnitud que el costo real (0,3×–3×)", estL.costo / uL.costo_usd > 0.3 && estL.costo / uL.costo_usd < 3, `${estL.costo.toFixed(5)} vs ${uL.costo_usd.toFixed(5)}`);
  await mockL.cerrar();
  process.env.MOCK_ANIM_ERRORES = "1";
  const mockL2 = await iniciarMock(0);
  const resL2 = await generarAnimacion({ guion: guionLibre, modelo: "gpt-4.1-mini", sfx: true, paleta: "imnoba", cfg: cfgMock(mockL2), verificar: false, motor: "clasico" });
  delete process.env.MOCK_ANIM_ERRORES;
  prueba("agente libre: código con Math.random → UNA reparación acotada a esa escena; el costo suma ambas llamadas y no queda ninguna escena de rescate", resL2.uso.llamadas === 2 && resL2.rescatadas.length === 0 && resL2.anim.escenas.every((e) => !e.fallback) && /Tu código anterior/.test(mockL2.estado.ultimaAnimacion.usuario) && /Math\.random/.test(mockL2.estado.ultimaAnimacion.usuario) && (mockL2.estado.ultimaAnimacion.usuario.match(/\[ESCENA \d+ \|/g) ?? []).length === 1, JSON.stringify(resL2.uso));
  await mockL2.cerrar();
  process.env.MOCK_LIBRE_SIEMPRE_MAL = "1";
  const mockL3 = await iniciarMock(0);
  const resL3 = await generarAnimacion({ guion: guionLibre, modelo: "gpt-4.1-mini", sfx: true, paleta: "imnoba", cfg: cfgMock(mockL3), verificar: false, motor: "clasico" });
  delete process.env.MOCK_LIBRE_SIEMPRE_MAL;
  prueba("agente libre: si una escena no se logra reparar tras 2 rondas se sustituye por una escena de rescate y el video sigue (1 + 2 llamadas)", resL3.uso.llamadas === 3 && resL3.rescatadas.join() === "1" && resL3.anim.escenas[0].fallback === true && resL3.anim.escenas.slice(1).every((e) => !e.fallback) && N.validar(resL3.anim).length === 0, JSON.stringify(resL3.uso));
  await mockL3.cerrar();

  // ------------------------------------------------------------ agente con servidor simulado
  console.log("\nAgente (OpenAI simulado)");
  let mock = await iniciarMock(0);
  let res = await generarAnimacion({ guion: guionEjemplo, modelo: "gpt-4.1-mini", sfx: true, paleta: "imnoba", cfg: cfgMock(mock), motor: "clasico" });
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
  res = await generarAnimacion({ guion: guionEjemplo, modelo: "o4-mini", sfx: false, paleta: "medicina", cfg: cfgMock(mock), motor: "clasico" });
  prueba("o4-mini recibe reasoning_effort y max_completion_tokens de 40000; SFX = No → sin eventos", mock.estado.ultimaAnimacion.razonamiento === "medium" && mock.estado.ultimaAnimacion.maxTokens === 40000 && res.anim.sfx === false && res.anim.escenas.every((e) => !e.sfx));
  prueba("paleta Medicina Clínica: se guarda y no deja iconos de inmobiliaria", res.anim.paleta === "medicina" && !JSON.stringify(res.anim).includes('"casa"'));
  prueba("costo real de o4-mini con sus precios (1.10 / 4.40)", Math.abs(res.uso.costo_usd - (res.uso.prompt_tokens * 1.1 + res.uso.completion_tokens * 4.4) / 1e6) < 1e-12);
  await mock.cerrar();

  process.env.MOCK_ANIM_ERRORES = "1";
  mock = await iniciarMock(0);
  res = await generarAnimacion({ guion: guionEjemplo, modelo: "gpt-4.1-mini", sfx: true, paleta: "imnoba", cfg: cfgMock(mock), motor: "clasico" });
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

  const guionEstudio = readFileSync(p("ejemplos", "animacion-estudio", "guion.txt"), "utf8");
  // ------------------------------------------------------------ motor viral (una frase → video)
  console.log("\nMotor viral (una frase → video con plantillas de reel)");
  {
    const ideaEj = readFileSync(p("ejemplos", "animacion-viral", "idea.txt"), "utf8");
    const respViral = JSON.parse(readFileSync(p("ejemplos", "animacion-viral", "respuesta-ia.json"), "utf8"));
    const pi = N.parsearIdea(ideaEj);
    prueba("parsearIdea: una frase es un video; «de 35 segundos» fija la duración (≈ una escena cada 3,6 s); sin duración ≈ 32 s", pi.errores.length === 0 && pi.duracion === 35 && pi.escenasObjetivo === 10 && N.parsearIdea("Un video sobre el metro de Bogotá").duracion === 32 && N.parsearIdea("un reel de 1 minuto sobre autos").duracion === 60 && N.parsearIdea("algo de 300 segundos").duracion === 120 && N.parsearIdea("algo de 5 segundos").duracion === 15, JSON.stringify(pi));
    prueba("parsearIdea: vacía o demasiado corta → UN error claro; los guiones en bloques ([ESCENA…], [CONFIG]) NO son ideas", N.parsearIdea("").errores.length === 1 && N.parsearIdea("hola").errores.length === 1 && !N.esIdea("[ESCENA 1 | 0s-4s | MODO: SVG]\nx") && !N.esIdea("[CONFIG]\nHUD: ON") && N.esIdea("una frase cualquiera sobre casas"));
    {
      const base = "Un video sobre el metro de Bogotá y la valorización de las propiedades cercanas a las estaciones. ";
      const larga = Array.from({ length: 40 }, (_, k) => `${k + 1}. Punto ${k + 1}: dato importante número ${k + 1} que debe aparecer en el video con su cifra exacta.`).join("\n");
      const gr = N.parsearIdea(`${base}\n\n${larga}`);
      prueba("idea SIN límite de caracteres: una idea de más de 3.000 caracteres es válida (antes el máximo era 1.200), conserva los saltos de línea y las viñetas, y no da errores", gr.caracteres > 3000 && gr.errores.length === 0 && gr.idea.includes("\n") && /1\. Punto 1/.test(gr.idea) && N.parsearIdea("x".repeat(60000) + " idea").errores.length === 0);
      prueba("idea detallada: sin duración pedida el video se alarga con el detalle (32 s hasta 400 caracteres; hasta 90 s), con más escenas y un aviso; una idea corta sigue en 32 s", N.parsearIdea("Un video sobre el metro de Bogotá").duracion === 32 && gr.duracion > 32 && gr.duracion <= 90 && gr.escenasObjetivo > 10 && gr.avisos.some((a) => /detallada/.test(a)) && N.parsearIdea(base + "x ".repeat(10000)).duracion === 90, JSON.stringify([gr.duracion, gr.escenasObjetivo, gr.avisos]));
      prueba("duración pedida de verdad: «video de 2 minutos» / «dura 90 segundos» se respeta (hasta 120 s) aunque la idea sea larga; «5 minutos» como dato del tema NO es la duración", N.parsearIdea(`${base}\n${larga}\nEl video dura 2 minutos.`).duracion === 120 && N.parsearIdea(`${larga}\nQue sea un reel de 90 segundos`).duracion === 90 && N.parsearIdea(`${base}\nLlegar al centro toma solo 5 minutos en metro.\n${larga}`).duracion <= 90 && N.parsearIdea("algo de 300 segundos").avisos.some((a) => /15–120/.test(a)));
      const pu = N.promptUsuarioIdea({ idea: gr.idea, duracion: gr.duracion, escenasObjetivo: gr.escenasObjetivo, paleta: "imnoba" });
      prueba("el mensaje a la IA pide cubrir TODOS los puntos de una idea detallada (y la corta no lleva esa línea); las ideas con saltos de línea llegan completas", /DETALLE: .*TODOS/.test(pu) && pu.includes("40. Punto 40") && !/DETALLE/.test(N.promptUsuarioIdea({ idea: "Una idea corta sobre casas", duracion: 32, escenasObjetivo: 9 })));
      prueba("el costo estimado crece con el detalle de la idea (más caracteres y más escenas) y sigue siendo de centavos", (() => { const e1 = N.estimarViral({ modelo: "gpt-4.1-mini", caracteres: 120, escenas: 9, tokensSistema: 1750 }); const e2 = N.estimarViral({ modelo: "gpt-4.1-mini", caracteres: gr.caracteres, escenas: gr.escenasObjetivo, tokensSistema: 1750 }); return e2.costo > e1.costo && e2.costo < 0.05; })());
    }
    // saneado
    const sv = (raw, n = 1, voz) => N.normalizarEscenaViral(raw, n, voz);
    const mal = sv({ t: "gif", h: "titular larguísimo que no cabe en ninguna línea de ninguna plantilla de reel posible", w: "inexistente", ic: "unicornio", dur: "mucho", voz: "x".repeat(400) });
    prueba("saneado viral: tipo inventado → HOOK; titular en mayúsculas ≤ 40; palabra destacada dentro del titular; icono inexistente → uno válido; duración numérica acotada; voz ≤ 260", mal.escena.t === "HOOK" && mal.escena.h === mal.escena.h.toUpperCase() && mal.escena.h.length <= 40 && mal.escena.h.split(/\s+/).includes(mal.escena.w) && N.ICONOS_VIRAL.includes(mal.escena.ic) && mal.escena.dur >= 2 && mal.escena.dur <= 8 && mal.escena.voz.length <= 260 && mal.correcciones.length > 0, JSON.stringify(mal));
    prueba("saneado viral: NUM sin número toma la cifra de la locución; VS deduce el operador por los números; BARS con pocos datos y LINE con pocos puntos se completan; STEPS/LIST/ROUTE con pocos elementos se completan", sv({ t: "NUM", voz: "Se valoriza un 35 % cada año" }).escena.num.n === "35" && sv({ t: "NUM", voz: "Se valoriza un 35 % cada año" }).escena.num.u === "%" && sv({ t: "VS", a: { l: "A", n: "9" }, b: { l: "B", n: "3" } }).escena.vs.op === ">" && sv({ t: "VS", a: { l: "A", n: "1.200" }, b: { l: "B", n: "300" } }).escena.vs.op === ">" && sv({ t: "BARS", bars: [{ l: "x", v: 3 }] }).escena.bars.length >= 2 && sv({ t: "LINE", line: { pts: [1] } }).escena.line.pts.length >= 3 && sv({ t: "STEPS", items: [] }).escena.items.length >= 2 && sv({ t: "LIST", items: ["a"] }).escena.items.length >= 2 && sv({ t: "ROUTE", stops: ["a"] }).escena.stops.length >= 3);
    prueba("saneado viral: BARS marca la barra mayor si no se pide otra (hi) y recorta a 6; LIST siempre con check; los iconos se deducen del texto (tren, casa, dinero, reloj)", sv({ t: "BARS", bars: [{ l: "a", v: 1 }, { l: "b", v: 9 }, { l: "c", v: 5 }] }).escena.hi === 1 && sv({ t: "BARS", bars: Array.from({ length: 9 }, (_, i) => ({ l: `m${i}`, v: i + 1 })) }).escena.bars.length === 6 && sv({ t: "LIST", items: ["uno", "dos"] }).escena.items.every((i) => i.ic === "check") && N.iconoPorTexto("el metro llega") === "tren" && N.iconoPorTexto("tu casa o apartamento") === "casa" && N.iconoPorTexto("cuesta mucho dinero") === "billete" && N.iconoPorTexto("en pocos minutos") === "reloj");
    // fondos y ritmo
    const tipos = ["HOOK", "NUM", "NUM", "VS", "BARS", "BARS", "LIST", "LIST", "CTA"];
    const fond = N.asignarFondos(tipos);
    prueba("fondos alternados: la primera escena es oscura, el CTA dorado y nunca hay dos escenas seguidas con el mismo fondo", fond[0] === "dark" && fond[fond.length - 1] === "gold" && fond.every((f, i) => i === 0 || f !== fond[i - 1]), fond.join());
    // ensamblado idea
    const ev = N.ensamblarViral(respViral, { modo: "idea", paleta: "imnoba", sfx: true });
    const esc = ev.anim.escenas;
    prueba("ensamblarViral (idea): 10 escenas modo VIRAL, consecutivas desde 0, título y animación válida (validar); formato «viral»", esc.length === 10 && esc.every((e) => e.modo === "VIRAL") && esc[0].inicio === 0 && esc.every((e, i) => i === 0 || Math.abs(e.inicio - esc[i - 1].fin) < 0.011) && ev.anim.titulo === "El metro que valoriza Bogotá" && ev.anim.formato === "viral" && N.validar(ev.anim).length === 0 && ev.anim.duracion === esc[9].fin, JSON.stringify(N.validar(ev.anim)));
    prueba("cada escena dura al menos lo que se tarda en decir su locución (palabras ÷ 2,9 + 0,5 s) y su tiempo ideal queda bajo control con el ritmo", esc.every((e) => e.dur + 0.011 >= e.voz.split(/\s+/).length / 2.9 + 0.5) && esc.every((e) => e.ritmo > 0.5 && e.ritmo <= 1) && esc.every((e) => e.total === ev.anim.duracion));
    prueba("la locución se guarda para grabarla: una línea [ESCENA n | mm:ss-mm:ss] por escena con su voz, y el aviso de verificar cifras", /\[ESCENA 1 \| 00:00-00:0\d\]\n¿Te imaginas cruzar Bogotá/.test(ev.locucion) && (ev.locucion.match(/\[ESCENA \d+ \|/g) ?? []).length === 10 && /Verifica las cifras/.test(ev.locucion));
    prueba("SFX automáticos sincronizados: arrancan con whoosh, todos caen dentro de la escena, ordenados; con SFX = No no hay ninguno", esc.every((e) => e.sfx && e.sfx[0].tipo === "whoosh" && e.sfx.every((s, i) => s.t >= 0 && s.t < e.dur && (i === 0 || s.t >= e.sfx[i - 1].t))) && N.ensamblarViral(respViral, { modo: "idea", sfx: false }).anim.escenas.every((e) => !e.sfx) && N.eventosSfx(ev.anim).length > 20);
    const evB = N.ensamblarViral({ scenes: [{ id: 1, t: "HOOK", h: "HOLA" }, { id: 2, t: "CTA", h: "ADIÓS" }] }, { modo: "bloques", escenas: N.parsearEstudio("[ESCENA 1 | 0s-4s | MODO: SVG]\nVOZ_OFF: uno dos tres\nDIRECCION_VISUAL: algo\n[ESCENA 2 | 4s-9s | MODO: SVG]\nVOZ_OFF: cuatro cinco\nDIRECCION_VISUAL: otro").escenas, sfx: true });
    prueba("ensamblarViral (bloques): los tiempos y la locución son los del guion (0–4 s y 4–9 s) y la IA solo pone la plantilla", evB.anim.escenas[0].inicio === 0 && evB.anim.escenas[0].fin === 4 && evB.anim.escenas[1].fin === 9 && evB.anim.escenas[1].voz === "cuatro cinco" && evB.anim.escenas[1].t === "CTA" && evB.sinRespuesta.length === 0);
    const tIm = N.temaViral("imnoba", "dark"), tGo = N.temaViral("imnoba", "gold"), tLi = N.temaViral("imnoba", "light");
    prueba("colores IMNOBA en los 3 fondos: oscuro azul de marca con acento dorado #FFC500; dorado con texto azul #02224E; claro con texto azul", tIm.acento === "#FFC500" && tIm.oscuro && tGo.texto === "#02224E" && tLi.texto === "#02224E" && !tGo.oscuro && !tLi.oscuro);
    // prompt y costo
    const sv1 = N.sistemaViral();
    const fv = N.tokensFijosViral();
    prueba("prompt de sistema viral: estático (idéntico siempre → prefijo cacheable), marca [DIRECTOR_VIRAL], los 22 tipos y todos los iconos, y compacto (900–2.400 tokens estimados; pasa de los 1.024 que activan el caché de OpenAI)", sv1 === N.sistemaViral() && sv1.includes("[DIRECTOR_VIRAL]") && N.TIPOS_VIRAL.every((t) => sv1.includes(t)) && N.ICONOS_VIRAL.every((i) => sv1.includes(i)) && fv.sistema > 900 && fv.sistema < 2400 && fv.esquema === 0, JSON.stringify(fv));
    prueba("la marca va en el mensaje de usuario (no en el prompt estático): IMNOBA la incluye, Medicina no", /MARCA: IMNOBA/.test(N.promptUsuarioIdea({ ...pi, paleta: "imnoba" })) && !/MARCA/.test(N.promptUsuarioIdea({ ...pi, paleta: "medicina" })) && !/IMNOBA/.test(sv1.replace(/ICONOS[\s\S]*$/, "")) && /ESCENAS: 10/.test(N.promptUsuarioIdea(pi)));
    const eV = N.estimarViral({ modelo: "gpt-4.1-mini", caracteres: pi.caracteres, escenas: pi.escenasObjetivo, tokensSistema: fv.sistema });
    prueba("estimarViral: entrada = prompt fijo + frase/3,6 + 30; salida = 165 por escena + 30; costo con la tarifa del modelo", eV.tokensEntrada === fv.sistema + Math.ceil(pi.caracteres / 3.6) + 30 && eV.tokensSalida === 165 * 10 + 30 && Math.abs(eV.costo - (eV.tokensEntrada * 0.4 + eV.tokensSalida * 1.6) / 1e6) < 1e-12, JSON.stringify(eV));
    const cV = (m) => N.estimarViral({ modelo: m, caracteres: pi.caracteres, escenas: 10, tokensSistema: fv.sistema }).costo;
    prueba("orden de tarifas: nano < 4o-mini < 4.1-mini < 4.1 (≈ $0,001–$0,01 por video de 35 s)", cV("gpt-4.1-nano") < cV("gpt-4o-mini") && cV("gpt-4o-mini") < cV("gpt-4.1-mini") && cV("gpt-4.1-mini") < cV("gpt-4.1") && cV("gpt-4.1") < 0.02 && cV("gpt-4.1-nano") < 0.001, [cV("gpt-4.1-nano"), cV("gpt-4o-mini"), cV("gpt-4.1-mini"), cV("gpt-4.1")].join(" · "));
    {
      const ideaLarga = Array.from({ length: 60 }, (_, k) => `Punto ${k + 1}: dato importante ${k + 1} del tema con su cifra.`).join("\n");
      const mkL = await iniciarMock(0);
      const rL = await generarAnimacion({ guion: `Un video sobre el metro de Bogotá.\n${ideaLarga}`, modelo: "gpt-4.1-mini", sfx: true, paleta: "imnoba", cfg: cfgMock(mkL) });
      prueba("agente con una idea LARGA (≈ 3.000 caracteres, 60 puntos): se genera sin error, dura más que una corta (≈ 90 s, ≈ 25 escenas), sigue siendo UNA llamada y el video es válido", rL.anim.escenas.length >= 20 && rL.anim.duracion > 60 && rL.uso.llamadas === 1 && N.validar(rL.anim).length === 0, JSON.stringify([rL.anim.escenas.length, rL.anim.duracion, rL.uso.llamadas]));
      await mkL.cerrar();
    }
    // plantillas nuevas: DONUT, PICTO, TOP, MITO
    prueba("hay 22 plantillas (las 10 de siempre + DONUT, PICTO, TOP, MITO + ZOOM, CAPAS, MIRA, IMPACTO, RED, TERMO, SPLIT y PILA) y el prompt explica la viralidad (gancho que frena el scroll, cambio de plantilla, acción final)", N.TIPOS_VIRAL.length === 22 && ["DONUT", "PICTO", "TOP", "MITO", "ZOOM", "CAPAS", "MIRA", "IMPACTO", "RED", "TERMO", "SPLIT", "PILA"].every((t) => N.TIPOS_VIRAL.includes(t) && sv1.includes(t)) && /frenar el scroll/.test(sv1) && /Guárdalo y compártelo/.test(sv1) && /nunca la misma dos veces seguidas/.test(sv1));
    prueba("saneado DONUT: 2–4 partes con valores ≥ 0; sin datos usa la cifra de la voz (sí/no suman 100)", sv({ t: "DONUT", donut: [{ l: "a", v: 60 }, { l: "b", v: 40 }, { l: "c", v: 5 }, { l: "d", v: 1 }, { l: "e", v: 9 }] }).escena.donut.length === 4 && (() => { const d = sv({ t: "DONUT", voz: "el 62 % son propietarios" }).escena.donut; return d.length === 2 && d[0].v + d[1].v === 100 && d[0].v === 62; })());
    prueba("saneado PICTO: n entre 4 y 20 (si no, 10), k entre 1 y n−1, icono por texto; TOP con 3–5 puestos; MITO sin «myth» se completa y marca la corrección", (() => { const a = sv({ t: "PICTO", picto: { n: 99, k: 50, ic: "casa", l: "x" } }).escena.picto; const b = sv({ t: "PICTO", picto: { n: 10, k: 0 } }).escena.picto; return a.n === 10 && a.k === 9 && b.k >= 1 && b.k < b.n; })() && sv({ t: "TOP", top: [{ l: "a" }] }).escena.top.length === 3 && sv({ t: "TOP", top: Array.from({ length: 9 }, (_, i) => ({ l: `p${i}`, v: "1" })) }).escena.top.length === 5 && (() => { const m = sv({ t: "MITO", h: "LA REALIDAD" }); return m.escena.myth.length > 0 && m.escena.truth.length > 0 && m.correcciones.length > 0; })());
    const pcr = N.parsearIdea(readFileSync(p("ejemplos", "animacion-viral", "idea-carros.txt"), "utf8"));
    const evc = N.ensamblarViral(JSON.parse(readFileSync(p("ejemplos", "animacion-viral", "respuesta-ia-carros.json"), "utf8")), { modo: "idea", paleta: "imnoba", sfx: true });
    prueba("ejemplo de carros (otro tema): idea de 30 s, 8 escenas válidas con PICTO, MITO, DONUT y TOP; el TOP sfx suena por puesto y el MITO tiene golpe, tachado y revelación", pcr.errores.length === 0 && pcr.duracion === 30 && evc.anim.escenas.length === 8 && N.validar(evc.anim).length === 0 && ["PICTO", "MITO", "DONUT", "TOP"].every((t) => evc.anim.escenas.some((e) => e.t === t)) && evc.anim.escenas.find((e) => e.t === "TOP").sfx.filter((x) => x.tipo === "pop" || x.tipo === "ding").length === 3 && evc.anim.escenas.find((e) => e.t === "MITO").sfx.map((x) => x.tipo).join().includes("thud,zap,ding"), JSON.stringify(N.validar(evc.anim)));
    const fc = N.asignarFondos(evc.anim.escenas.map((e) => e.t));
    prueba("en el ejemplo de carros los fondos también alternan sin repetirse y el CTA es dorado", fc.every((x, i) => i === 0 || x !== fc[i - 1]) && fc[0] === "dark" && fc[fc.length - 1] === "gold");

    // ── Viral v3: plantillas documentales (ZOOM, CAPAS, MIRA, IMPACTO, RED, TERMO, SPLIT), cita, escenarios, zoom continuo, música y foley ──
    {
      const z = sv({ t: "ZOOM", h: "de la tierra a un musgo", zoom: { a: 8, b: -4, items: [{ l: "tierra", e: 7, ic: "globo" }, { l: "casi igual", e: 7.3, ic: "casa" }, { l: "musgo", e: -1, ic: "arboles" }, { l: "bicho", e: -3.3, ic: "bicho" }] } }).escena.zoom;
      prueba("saneado ZOOM: exponentes enteros acotados, items ordenados según hacia dónde viaja la cámara y sin dos del mismo tamaño", z.a === 8 && z.b === -4 && z.items.length === 3 && z.items.every((it, i) => i === 0 || it.e < z.items[i - 1].e) && z.items[0].l === "CASI IGUAL" && !z.items.some((it) => it.l === "TIERRA"), JSON.stringify(z));
      const z2 = sv({ t: "ZOOM", zoom: { a: 2, b: 3 } });
      prueba("ZOOM sin elementos o con recorrido corto: se completa (≥ 3 potencias de diez, 3 escalas de ejemplo) y se avisa", z2.escena.zoom.items.length === 3 && Math.abs(z2.escena.zoom.a - z2.escena.zoom.b) >= 3 && z2.correcciones.length >= 2);
      const cam = { a: 8, b: -4, items: z.items };
      const cs = [0, 0.3, 0.8, 1.5, 2.5, 3.5, 4.5, 5.15, 5.6].map((t) => N.exponenteZoom(cam, t, 5.6));
      prueba("cámara del ZOOM: arranca en a, termina en b, es monótona y se frena junto a cada elemento", Math.abs(cs[0] - 8) < 1e-9 && Math.abs(cs[cs.length - 1] - -4) < 0.01 && cs.every((c, i) => i === 0 || c <= cs[i - 1] + 1e-9) && (() => { const e = (t) => N.exponenteZoom(cam, t, 5.6); const v = (c) => { const t = N.tiempoZoom(cam, 5.6, c); return Math.abs(e(t + 0.05) - e(t - 0.05)); }; return v(7.155) < v(3) && v(-0.845) < v(3); })(), cs.map((c) => c.toFixed(2)).join(" "));
      prueba("tiempoZoom es la inversa de exponenteZoom y opacidadZoom aparece al ocupar ≈10 % del cuadro y se va al pasarlo", (() => { const t = N.tiempoZoom(cam, 5.6, 2); return Math.abs(N.exponenteZoom(cam, t, 5.6) - 2) < 0.02; })() && N.opacidadZoom(0, 3) === 0 && N.opacidadZoom(0, 0.2) === 1 && N.opacidadZoom(0, -2) === 0);
      prueba("longitudLegible: potencias de diez en km, m, cm, mm, µm y nm", ["3:1 KM", "4:10 KM", "0:1 M", "2:100 M", "-1:10 CM", "-3:1 MM", "-4:100 µM", "-6:1 µM", "-8:10 NM"].every((x) => { const [k, v] = x.split(":"); return N.longitudLegible(Number(k)) === v; }), [3, 4, 0, 2, -1, -3, -4, -6, -8].map((k) => N.longitudLegible(k)).join(" | "));
      const c = sv({ t: "CAPAS", capas: { items: [{ l: "tapa de níquel muy larga", m: "níquel" }, "resina"], medida: "12 cm" } }).escena.capas;
      prueba("saneado CAPAS: 2–4 capas, nombre ≤ 12 caracteres, material mono y medida; sin capas usa tres de ejemplo", c.items.length === 2 && c.items[0].l.length <= 12 && c.medida === "12 CM" && sv({ t: "CAPAS" }).escena.capas.items.length === 3);
      const im = sv({ t: "IMPACTO", sc: "espacio", impacto: { l: "sonda", v: "500 km/h" } }).escena;
      prueba("saneado IMPACTO: el escenario es siempre la superficie lunar (la plantilla dibuja ese suelo) y la velocidad va en mayúsculas", im.sc === "luna" && im.impacto.v === "500 KM/H" && im.impacto.ic === "cohete");
      const rd = sv({ t: "RED", red: { c: "proteína", nodes: ["adn", "agua", "x", "y", "z", "w", "v"] } }).escena;
      prueba("saneado RED: 3–6 nodos, centro en mayúsculas y escenario célula por defecto", rd.red.nodes.length === 6 && rd.red.c === "PROTEÍNA" && rd.sc === "celula" && sv({ t: "RED", red: { nodes: ["a"] } }).escena.red.nodes.length >= 3);
      const tm = sv({ t: "TERMO", termo: { u: "°C", lo: 150, hi: -200, n: 40, k: 99, l: "sobreviven" } }).escena.termo;
      prueba("saneado TERMO: lo < hi (se reordenan), n entre 6 y 12, k entre 1 y n−1", tm.lo < tm.hi && tm.n === 12 && tm.k >= 1 && tm.k < tm.n, JSON.stringify(tm));
      const sp = sv({ t: "SPLIT", a: { l: "x", n: "85" }, b: { l: "y", n: "3" } }).escena;
      prueba("saneado SPLIT: reutiliza los datos de VS (lados, números y operador calculado)", sp.vs && sp.vs.op === ">" && sp.vs.a.n === "85" && sp.vs.b.l === "Y");
      const pi2 = sv({ t: "PILA", pila: { l1: "una atmósfera", l2: "seis mil", n: "6000" } }).escena.pila;
      prueba("saneado PILA: etiquetas en mayúsculas, n solo dígitos (6000), icono por defecto y valores de ejemplo si faltan", pi2.n === "6000" && pi2.l1 === "UNA ATMÓSFERA" && pi2.ic === "bicho" && sv({ t: "PILA" }).escena.pila.n === "100" && N.sfxViral({ t: "PILA", items: [], bars: [], stops: [], top: [], picto: null, dur: 5, pila: pi2 }, 1).filter((x) => x.tipo === "clic").length >= 10);
      const ci = sv({ t: "HOOK", h: "x", cita: "Jönsson et al., 2008" }).escena.cita;
      prueba("ficha de cita: acepta texto «Fuente, año» u objeto {t, y}; el CTA nunca lleva cita", ci.t === "Jönsson et al." && ci.y === "2008" && sv({ t: "NUM", cita: { t: "NASA", y: "2019" } }).escena.cita.t === "NASA" && sv({ t: "CTA", cita: "NASA, 2019" }).escena.cita === null && sv({ t: "HOOK", cita: "" }).escena.cita === null);
      prueba("escenario: solo espacio/luna/bio/celula (lo demás se ignora); ZOOM=espacio por defecto", sv({ t: "HOOK", sc: "bio" }).escena.sc === "bio" && sv({ t: "HOOK", sc: "infierno" }).escena.sc === "" && sv({ t: "ZOOM" }).escena.sc === "espacio");
      const f1 = N.asignarFondos(["HOOK", "ZOOM", "MIRA", "RED", "CAPAS", "CTA"], ["", "espacio", "", "celula", "", ""]);
      prueba("asignarFondos con escenarios: las escenas con escenario siempre van sobre el tema oscuro y las vecinas se adaptan", f1[1] === "dark" && f1[3] === "dark" && f1[0] === "dark" && f1[5] === "gold" && N.asignarFondos(["HOOK", "NUM", "VS"]).join() === "dark,gold,dark");
      prueba("ICONOS: los de ciencia se resuelven (hi-adn, hi-microscopio, gota, bacteria, luna, atomo, bicho, planeta) y los propios se dibujan en el motor", ["adn", "microscopio", "celula", "termometro"].every((n) => N.iconoReal(n) === `hi-${n}`) && ["gota", "bacteria", "virus", "luna", "atomo", "bicho", "planeta"].every((n) => N.iconoReal(n) === n) && N.iconoReal("casa") === "lu-casa");
      const pcs = N.parsearIdea(readFileSync(p("ejemplos", "animacion-viral", "idea-ciencia.txt"), "utf8"));
      const evs = N.ensamblarViral(JSON.parse(readFileSync(p("ejemplos", "animacion-viral", "respuesta-ia-ciencia.json"), "utf8")), { modo: "idea", paleta: "imnoba", sfx: true });
      const esc = evs.anim.escenas;
      prueba("ejemplo de ciencia (tardígrado): 10 escenas válidas con ZOOM, MIRA, SPLIT, TERMO, NUM, IMPACTO, CAPAS, RED y 3 fichas de cita", pcs.errores.length === 0 && esc.length === 10 && N.validar(evs.anim).length === 0 && ["ZOOM", "MIRA", "SPLIT", "TERMO", "IMPACTO", "CAPAS", "RED"].every((t) => esc.some((e) => e.t === t)) && esc.filter((e) => e.cita).length === 3 && evs.correcciones.length === 0, JSON.stringify([N.validar(evs.anim), evs.correcciones]));
      prueba("transiciones: zoom continuo al entrar o salir de un ZOOM (y tras una MIRA), barrido en el resto; trs = la entrada de la siguiente", esc[0].tr === "barrido" && esc[1].tr === "zoom" && esc[2].tr === "zoom" && esc[3].tr === "zoom" && esc[4].tr === "barrido" && esc.every((e, i) => e.trs === (esc[i + 1]?.tr ?? "barrido")) && esc[0].trs === "zoom" && esc[3].trs === "barrido");
      prueba("el ejemplo mantiene el ritmo: duración total 35–50 s, cada escena ≥ 2,2 s y el viaje de escala ≥ 5,2 s", evs.anim.duracion > 35 && evs.anim.duracion < 50 && esc.every((e) => e.dur >= 2.2) && esc[1].dur >= 5.2);
      const sfxZ = esc[1].sfx, sfxI = esc[6].sfx, sfxM = esc[2].sfx;
      prueba("SFX de ciencia: el ZOOM suena con clics por potencia de diez, radar al aparecer cada elemento y estática; el IMPACTO con golpe+thud+polvo en el choque; la MIRA con radar, zap de fijado y clic de cota", sfxZ.filter((x) => x.tipo === "clic").length >= 8 && sfxZ.filter((x) => x.tipo === "radar").length === 3 && sfxZ.some((x) => x.tipo === "estatica") && ["golpe", "thud", "polvo"].every((t) => sfxI.some((x) => x.tipo === t)) && Math.abs(sfxI.find((x) => x.tipo === "golpe").t - 1.55 * esc[6].ritmo) < 0.01 && ["radar", "zap", "clic"].every((t) => sfxM.some((x) => x.tipo === t)));
      prueba("foley en contadores: el NUM y el SPLIT suenan con clics mecánicos mientras cuentan; una escena con cita suena un clic al aparecer la ficha", esc[5].sfx.filter((x) => x.tipo === "clic").length >= 8 && esc[3].sfx.filter((x) => x.tipo === "clic").length >= 5 && esc[0].sfx.some((x) => x.tipo === "clic" && Math.abs(x.t - 1.0) < 0.01));
      prueba("los efectos nuevos tienen archivo, duración y tipo (gota, estática, clic, golpe, polvo, radar) y la música existe en public/audios", ["gota", "estatica", "clic", "golpe", "polvo", "radar"].every((t) => existsSync(p("public", "sfx", `${t}.wav`))) && existsSync(p("public", "audios", "musica.wav")) && /gota: 0\.4/.test(readFileSync(p("src", "scenes", "tipos.ts"), "utf8")) && /"radar"/.test(readFileSync(p("src", "anim", "tipos.ts"), "utf8")));
      prueba("música: la lleva el viral con el interruptor de sonido (sfx=false → sin música); Remotion la monta con <Audio loop> y el render la mezcla en Node con rampas", evs.anim.musica === true && N.llevaMusica(evs.anim) && N.ensamblarViral(JSON.parse(readFileSync(p("ejemplos", "animacion-viral", "respuesta-ia-ciencia.json"), "utf8")), { modo: "idea", sfx: false }).anim.musica === false && !N.llevaMusica({ sfx: false, musica: true }) && N.ensamblarViral(JSON.parse(readFileSync(p("ejemplos", "animacion-viral", "respuesta-ia-ciencia.json"), "utf8")), { modo: "idea", sfx: true, musica: false }).anim.musica === false && /<Audio[\s\S]{0,80}loop/.test(readFileSync(p("src", "anim", "Animacion.tsx"), "utf8")) && /musica/.test(readFileSync(p("scripts", "audio.mjs"), "utf8")) && /musicaAnim/.test(readFileSync(p("scripts", "render.mjs"), "utf8")));
      prueba("animaciones guardadas ANTES de esta versión (sin cita, escenario ni transición) siguen siendo válidas y no cambian su fondo ni su transición", (() => { const vieja = JSON.parse(JSON.stringify(evc.anim)); for (const e of vieja.escenas) { delete e.cita; delete e.sc; delete e.tr; delete e.trs; delete e.zoom; } delete vieja.musica; return N.validar(vieja).length === 0 && N.eventosSfx(vieja).length > 0 && !N.llevaMusica(vieja); })());
    }

    // agente con servidor simulado
    for (const mo of ["gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano", "gpt-4o-mini", "o4-mini"]) {
      const mk = await iniciarMock(0);
      const rv = await generarAnimacion({ guion: ideaEj, modelo: mo, sfx: true, paleta: "imnoba", cfg: cfgMock(mk) });
      const uv = mk.estado.ultimaAnimacion;
      const mm = N.modeloPorId(mo);
      prueba(`una frase con ${mo}: 1 llamada con json_object (sin esquema), guion de 10 escenas, costo real con su tarifa${mm.razonador ? ", razonamiento «low»" : ""}`, rv.uso.llamadas === 1 && uv.nombre === "viral_json" && uv.formato === "json_object" && uv.estricto === false && (mm.razonador ? uv.razonamiento === "low" : uv.razonamiento === null) && rv.formato === "viral" && rv.anim.escenas.length === 10 && rv.anim.formato === "viral" && Math.abs(rv.uso.costo_usd - (rv.uso.prompt_tokens * mm.entrada + rv.uso.completion_tokens * mm.salida) / 1e6) < 1e-12 && /\[ESCENA 1 \|/.test(rv.locucion), JSON.stringify(uv && { ...uv, sistema: "…", usuario: "…" }));
      await mk.cerrar();
    }
    let mkV = await iniciarMock(0);
    const r20 = await generarAnimacion({ guion: "Un reel de 20 segundos sobre vender tu carro sin comisión en IMNOBA", modelo: "gpt-4.1-nano", sfx: true, paleta: "imnoba", cfg: cfgMock(mkV) });
    prueba("la duración pedida en la frase manda: «de 20 segundos» → 6 escenas, HOOK primero y CTA último; a la IA solo viajan la frase, la duración y la marca", r20.anim.escenas.length === 6 && r20.anim.escenas[0].t === "HOOK" && r20.anim.escenas[5].t === "CTA" && /DURACIÓN TOTAL: 20 s/.test(mkV.estado.ultimaAnimacion.usuario) && /ESCENAS: 6/.test(mkV.estado.ultimaAnimacion.usuario) && /MARCA: IMNOBA/.test(mkV.estado.ultimaAnimacion.usuario) && !/SFX|whoosh/.test(mkV.estado.ultimaAnimacion.usuario));
    await mkV.cerrar();
    process.env.MOCK_VIRAL_POCAS = "1";
    mkV = await iniciarMock(0);
    const rP = await generarAnimacion({ guion: ideaEj, modelo: "gpt-4.1-nano", sfx: true, paleta: "imnoba", cfg: cfgMock(mkV) });
    delete process.env.MOCK_VIRAL_POCAS;
    prueba("si la IA devuelve muy pocas escenas se pide de nuevo UNA vez el guion completo (2 llamadas, el costo suma ambas)", rP.uso.llamadas === 2 && rP.anim.escenas.length === 10 && /muy pocas escenas/.test(mkV.estado.ultimaAnimacion.usuario), JSON.stringify(rP.uso));
    await mkV.cerrar();
    process.env.MOCK_VIRAL_MAL = "1";
    mkV = await iniciarMock(0);
    const rM = await generarAnimacion({ guion: ideaEj, modelo: "gpt-4.1-nano", sfx: true, paleta: "imnoba", cfg: cfgMock(mkV) });
    delete process.env.MOCK_VIRAL_MAL;
    prueba("una respuesta basura en una escena se sanea sin llamadas extra y el video sigue siendo válido", rM.uso.llamadas === 1 && rM.correcciones.length > 0 && N.validar(rM.anim).length === 0 && rM.anim.escenas.length === 10, JSON.stringify(rM.correcciones));
    await mkV.cerrar();
    mkV = await iniciarMock(0);
    const rB = await generarAnimacion({ guion: guionEstudio, modelo: "gpt-4.1-mini", sfx: true, paleta: "imnoba", cfg: cfgMock(mkV) });
    prueba("un guion en bloques también funciona con el motor viral: sus tiempos y su locución se respetan y la IA solo elige plantilla (sin «voz» ni «dur» en la petición)", rB.uso.llamadas === 1 && rB.anim.escenas.length === 6 && rB.anim.duracion === 37 && rB.anim.escenas[0].voz.includes("Bogotá está atrapada") && /^ESC 1 \| 6s/m.test(mkV.estado.ultimaAnimacion.usuario) && /MODO: bloques/.test(mkV.estado.ultimaAnimacion.usuario), JSON.stringify(rB.uso));
    await mkV.cerrar();
    process.env.MOCK_VIRAL_FALTAN = "1";
    mkV = await iniciarMock(0);
    const rF = await generarAnimacion({ guion: guionEstudio, modelo: "gpt-4.1-nano", sfx: true, paleta: "imnoba", cfg: cfgMock(mkV) });
    delete process.env.MOCK_VIRAL_FALTAN;
    prueba("bloques: si la IA se deja una escena se pide de nuevo SOLO esa", rF.uso.llamadas === 2 && /^ESC 2 \|/m.test(mkV.estado.ultimaAnimacion.usuario) && !/ESC 1 \|/.test(mkV.estado.ultimaAnimacion.usuario) && rF.anim.escenas.length === 6 && rF.anim.escenas[1].t === "NUM", JSON.stringify(rF.uso));
    await mkV.cerrar();
    let errIdea = null;
    try { await generarAnimacion({ guion: "una frase de idea", modelo: "gpt-4.1-mini", motor: "estudio", cfg: cfgMock((mkV = await iniciarMock(0))) }); } catch (e) { errIdea = e; }
    await mkV.cerrar();
    prueba("con los motores clásicos una frase suelta se rechaza con un mensaje claro (piden bloques)", errIdea?.name === "ErrorGuion" && /bloques/.test(errIdea.message));
    const rEst2 = N.estimarViral({ modelo: "gpt-4.1-mini", caracteres: pi.caracteres, escenas: pi.escenasObjetivo, tokensSistema: fv.sistema }).costo;
    mkV = await iniciarMock(0);
    const rC = await generarAnimacion({ guion: ideaEj, modelo: "gpt-4.1-mini", sfx: true, paleta: "imnoba", cfg: cfgMock(mkV) });
    prueba("la estimación previa del panel está en el mismo orden que el costo real (0,3×–3×)", rEst2 / rC.uso.costo_usd > 0.3 && rEst2 / rC.uso.costo_usd < 3, `estimado ${rEst2.toFixed(5)} · real ${rC.uso.costo_usd.toFixed(5)}`);
    await mkV.cerrar();
  }

  // ------------------------------------------------------------ motor de estudio (JSON ultraligero)
  console.log("\nMotor de estudio (JSON ultraligero + figuras prefabricadas)");
  {
  const guionEstudio = readFileSync(p("ejemplos", "animacion-estudio", "guion.txt"), "utf8");
  const respEstudio = JSON.parse(readFileSync(p("ejemplos", "animacion-estudio", "respuesta-ia.json"), "utf8"));
  const pe0 = N.parsearEstudio(guionEstudio);
  prueba("el parser NO cambió: el formato [ESCENA 1 | 0s-6s | MODO: SVG] + VOZ_OFF + DIRECCION_VISUAL + SFX sigue siendo «simple» y lo aceptan parsearGuion y parsearEstudio sin errores", N.detectarFormato(guionEstudio) === "simple" && N.parsearGuion(guionEstudio).errores.length === 0 && pe0.errores.length === 0 && pe0.escenas.length === 6 && pe0.duracion === 37, JSON.stringify(pe0.errores));
  prueba("parsearEstudio separa VOZ_OFF, DIRECCION_VISUAL, SFX y MODO (SVG/3D) de cada escena", pe0.escenas[0].modo === "SVG" && pe0.escenas[2].modo === "3D" && /Bogotá está atrapada/.test(pe0.escenas[0].voz) && /esfera roja/.test(pe0.escenas[0].direccion) && pe0.escenas[0].sfx.map((s) => s.tipo).join() === "whoosh,pop" && pe0.escenas[2].sfx.length === 0);
  prueba("usaEstudio: el formato simple y el libre sí; el estructurado ([CONFIG]) conserva su motor", N.usaEstudio(guionEstudio) && N.usaEstudio(guionLibre) && !N.usaEstudio(guionEst));
  prueba("un guion vacío da UN solo error legible (no dos iguales) y un MODO inválido sigue rechazándose", N.parsearEstudio("").errores.length === 1 && N.parsearEstudio("[ESCENA 1 | 0s-4s | MODO: XYZ]\nx").errores.length === 1);
  prueba("también acepta el formato libre ([ESCENA 1 | 00:00-00:05]) con modo SVG por defecto", N.parsearEstudio(guionLibre).escenas.length === 5 && N.parsearEstudio(guionLibre).escenas.every((e) => e.modo === "SVG") && N.parsearEstudio(guionLibre).errores.length === 0);

  // vocabulario y saneado
  const base0 = N.escenaPorReglas({ n: 1, voz: "", direccion: "" });
  const sanE = (raw, b = base0) => N.normalizarEscenaEstudio(raw, b);
  const maloE = sanE({ layout: "hero center", headline: { text: "titular en minúsculas muy muy muy largo que no cabe", highlightWord: "inexistente" }, primary: { shape: "triangulo", colorRole: "fucsia", detail: "dog_ears", animation: "volar", motionTrail: "true" }, versus: { operator: "&gt;" } });
  prueba("saneado: valores fuera del vocabulario → los de las reglas locales; layout «hero center» se entiende; titular en mayúsculas y ≤ 40 car.; palabra destacada inexistente se corrige", maloE.escena.layout === "HERO_CENTER" && N.FIGURAS.includes(maloE.escena.primary.shape) && N.ANIMACIONES.includes(maloE.escena.primary.animation) && maloE.escena.headline.text === maloE.escena.headline.text.toUpperCase() && maloE.escena.headline.text.length <= 40 && maloE.escena.headline.text.split(/\s+/).includes(maloE.escena.headline.highlightWord) && maloE.escena.primary.motionTrail === true && maloE.correcciones.length > 0, JSON.stringify(maloE));
  prueba("saneado: un detalle imposible se descarta (speedometer_needle en SPHERE → none; dog_ears en RING_GAUGE → none)", sanE({ primary: { shape: "SPHERE", detail: "speedometer_needle" } }).escena.primary.detail === "none" && sanE({ primary: { shape: "RING_GAUGE", detail: "dog_ears" } }).escena.primary.detail === "none" && sanE({ primary: { shape: "CELLULAR_OVAL", detail: "inner_voronoi_cells" } }).escena.primary.detail === "inner_voronoi_cells");
  const veE = sanE({ layout: "VERSUS_50_50" });
  prueba("saneado: VERSUS_50_50 siempre trae contadores, etiquetas, operador y segunda figura; DIAGONAL_SPLIT siempre dos estados; HERO_CENTER no arrastra versus", veE.escena.versus && veE.escena.secondary.shape !== "NONE" && N.OPERADORES.includes(veE.escena.versus.operator) && sanE({ layout: "DIAGONAL_SPLIT", secondary: { shape: "NONE" } }).escena.secondary.shape !== "NONE" && sanE({ layout: "HERO_CENTER" }).escena.versus === null);
  prueba("saneado: dos figuras nunca quedan del mismo rol de color; contadores y etiquetas se recortan", sanE({ layout: "VERSUS_50_50", primary: { colorRole: "primary" }, secondary: { shape: "SPHERE", colorRole: "primary" }, versus: { leftCounter: "1234567890", rightCounter: "9", leftLabel: "UNA ETIQUETA MUY LARGA QUE NO CABE", rightLabel: "x", operator: ">" } }).escena.secondary.colorRole === "secondary" && sanE({ layout: "VERSUS_50_50", versus: { leftCounter: "1234567890", leftLabel: "UNA ETIQUETA MUY LARGA QUE NO CABE" } }).escena.versus.leftCounter.length <= 6 && sanE({ layout: "VERSUS_50_50", versus: { leftLabel: "UNA ETIQUETA MUY LARGA QUE NO CABE" } }).escena.versus.leftLabel.length <= 14);

  // traductor determinista de DIRECCION_VISUAL
  const Rg = (direccion, voz = "") => N.escenaPorReglas({ n: 1, voz, direccion });
  prueba("reglas locales: «composición central», «comparación 50/50», «pantalla dividida diagonal» y «superficie» → los 4 layouts", Rg("Composición central: una esfera").layout === "HERO_CENTER" && Rg("Comparación 50/50 entre A y B").layout === "VERSUS_50_50" && Rg("PANTALLA DIVIDIDA DIAGONAL: antes y después").layout === "DIAGONAL_SPLIT" && Rg("Una cápsula avanza sobre una barra, superficie metálica").layout === "SURFACE_STAGE");
  prueba("reglas locales: el titular sale de lo que va entre comillas; «50/50» no cuenta como cifra; cifras y etiquetas van a versus; operador por comparación", (() => { const e = Rg('Comparación 50/50: "PERRO" con 000 y "GATO" con 140. Titular "EL HUEVO FUE ANTES"'); return e.headline.text === "EL HUEVO FUE ANTES" && e.versus.leftCounter === "000" && e.versus.rightCounter === "140" && e.versus.leftLabel === "PERRO" && e.versus.rightLabel === "GATO" && e.versus.operator === "<"; })());
  prueba("reglas locales: huevo→CELLULAR_OVAL+células · velocímetro→RING_GAUGE+aguja · torre→PILL_TOWER · perro/gato→orejas · abeja→rayas · oruga→CAPSULE elástica", Rg("un huevo celular").primary.shape === "CELLULAR_OVAL" && Rg("un huevo celular").primary.detail === "inner_voronoi_cells" && Rg("el velocímetro sube").primary.shape === "RING_GAUGE" && Rg("el velocímetro sube").primary.detail === "speedometer_needle" && Rg("una torre que crece").primary.shape === "PILL_TOWER" && Rg("un perro").primary.detail === "dog_ears" && Rg("un gato").primary.detail === "cat_ears" && Rg("una abeja").primary.detail === "bee_stripes" && Rg("una oruga").primary.shape === "CAPSULE" && Rg("una oruga").primary.animation === "elastic_crawl");
  prueba("reglas locales: sin comillas el titular sale de la primera frase de la VOZ en mayúsculas (≤ 30 car.)", (() => { const e = Rg("una esfera", "¿Sabías que Bogotá está atrapada por culpa del tráfico y de las obras? Sigue."); return e.headline.text.length <= 30 && e.headline.text === e.headline.text.toUpperCase() && /^SABÍAS QUE BOGOTÁ/.test(e.headline.text); })());

  // ensamblado
  const ens = N.ensamblarEstudio(respEstudio, pe0.escenas, { paleta: "imnoba", sfx: true });
  prueba("ensamblarEstudio: 6 escenas modo ESTUDIO con los 4 layouts, tiempos del guion, 3D marcado y animación válida (validar)", ens.anim.escenas.length === 6 && ens.anim.escenas.every((e) => e.modo === "ESTUDIO") && new Set(ens.anim.escenas.map((e) => e.layout)).size === 4 && ens.anim.escenas[2].es3D === true && ens.anim.escenas[0].es3D === false && ens.anim.duracion === 37 && ens.anim.formato === "estudio" && N.validar(ens.anim).length === 0 && ens.sinRespuesta.length === 0 && ens.correcciones.length === 0, JSON.stringify([N.validar(ens.anim), ens.correcciones]));
  prueba("SFX: los del guion mandan (whoosh,pop); sin ellos hay SFX automáticos locales sincronizados; con SFX = No no hay ninguno", ens.anim.escenas[0].sfx.map((s) => s.tipo).join() === "whoosh,pop" && ens.anim.escenas[2].sfx.length >= 2 && ens.anim.escenas[2].sfx.every((s) => s.t < ens.anim.escenas[2].dur) && N.ensamblarEstudio(respEstudio, pe0.escenas, { sfx: false }).anim.escenas.every((e) => !e.sfx) && N.eventosSfx(ens.anim).length > 0 && N.eventosSfx({ ...ens.anim, sfx: false }).length === 0);
  const sinIA = N.ensamblarEstudio({ scenes: [] }, pe0.escenas, { paleta: "imnoba" });
  prueba("si la IA no devuelve nada, las reglas locales diseñan todas las escenas y el video sigue siendo válido (sin romper)", sinIA.sinRespuesta.length === 6 && N.validar(sinIA.anim).length === 0 && sinIA.anim.escenas.every((e) => N.LAYOUTS.includes(e.layout)));
  prueba("la respuesta con la clave antigua (primaryObject/versusData/«scenes» con n) también se entiende", N.ensamblarEstudio({ scenes: [{ n: 1, layout: "VERSUS_50_50", primaryObject: { primitive: "CAPSULE" }, versusData: { leftCounter: "5", rightCounter: "9", leftLabel: "A", rightLabel: "B", symbol: "<" } }] }, pe0.escenas.slice(0, 1), {}).anim.escenas[0].versus.operator === "<");

  // paletas
  const ce = N.coloresEstudio("imnoba");
  prueba("paleta IMNOBA de estudio: fondo azul de marca #02224E (con borde más oscuro), acento dorado #FFC500; Medicina usa su fondo y el símbolo lima #D4FF00", ce.fondoCentro === "#02224E" && ce.roles.accent === "#FFC500" && ce.fondo !== "#02224E" && N.coloresEstudio("medicina").neon === "#D4FF00" && N.coloresEstudio("medicina").fondoCentro === "#0B0F19");

  // prompt + costos
  const sis = N.sistemaEstudio();
  const fijos = N.tokensFijosEstudio();
  prueba("prompt de sistema: estático (no depende de paleta ni del guion → prefijo idéntico para el caché), con la marca JSON y TODO el vocabulario cerrado", sis === N.sistemaEstudio() && sis.includes("[ESTUDIO_JSON]") && [...N.LAYOUTS, ...N.FIGURAS, ...N.ANIMACIONES, ...N.DETALLES, ...N.ROLES].every((v) => sis.includes(v)) && /comillas/.test(sis) && /VOZ/.test(sis) && /COMPOSICI|composición central/i.test(sis));
  prueba("prompt de sistema compacto (< 750 tokens estimados) y sin esquema aparte", fijos.sistema < 750 && fijos.esquema === 0, JSON.stringify(fijos));
  const eEst = N.estimarEstudio({ modelo: "gpt-4.1-mini", caracteres: pe0.caracteresIA, escenas: 6, tokensSistema: fijos.sistema });
  prueba("estimarEstudio: entrada = prompt fijo + texto/3.6 + 14 por escena; salida = 120 por escena; costo = tokens × tarifa del modelo", eEst.tokensEntrada === fijos.sistema + Math.ceil(pe0.caracteresIA / 3.6) + 84 && eEst.tokensSalida === 720 && Math.abs(eEst.costo - (eEst.tokensEntrada * 0.4 + 720 * 1.6) / 1e6) < 1e-12, JSON.stringify(eEst));
  const porModelo = (m) => N.estimarEstudio({ modelo: m, caracteres: pe0.caracteresIA, escenas: 6, tokensSistema: fijos.sistema }).costo;
  prueba("el costo respeta el orden de tarifas: nano < 4o-mini < 4.1-mini < 4.1; o4-mini suma su razonamiento", porModelo("gpt-4.1-nano") < porModelo("gpt-4o-mini") && porModelo("gpt-4o-mini") < porModelo("gpt-4.1-mini") && porModelo("gpt-4.1-mini") < porModelo("gpt-4.1") && N.estimarEstudio({ modelo: "o4-mini", caracteres: 1000, escenas: 6, tokensSistema: fijos.sistema }).tokensSalida > 720);
  const fl2 = N.tokensFijosLibre({ paleta: "imnoba", sfx: true });
  const antes = N.estimarLibre({ modelo: "gpt-4.1-mini", caracteres: N.parsearLibre(guionLibre).caracteresIA, escenas: 6, sfx: true, tokensSistema: fl2.sistema, tokensEsquema: fl2.esquema });
  prueba("ahorro frente al lienzo libre con el mismo número de escenas: ≥ 80 % menos tokens de salida y ≥ 80 % menos costo", eEst.tokensSalida <= antes.tokensSalida * 0.2 && eEst.costo <= antes.costo * 0.2, `libre ${antes.costo.toFixed(5)} · estudio ${eEst.costo.toFixed(5)} · salida ${antes.tokensSalida} → ${eEst.tokensSalida}`);

  // agente con servidor simulado
  const modelos5 = ["gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano", "gpt-4o-mini", "o4-mini"];
  for (const mo of modelos5) {
    const mk = await iniciarMock(0);
    const rs = await generarAnimacion({ guion: guionEstudio, modelo: mo, sfx: true, paleta: "imnoba", motor: "estudio", cfg: cfgMock(mk) });
    const ue = mk.estado.ultimaAnimacion;
    const m5 = N.modeloPorId(mo);
    prueba(`agente estudio con ${mo}: 1 llamada, response_format json_object (sin esquema), costo real con su tarifa${m5.razonador ? ", razonamiento «low»" : ", sin reasoning_effort"}`, rs.uso.llamadas === 1 && ue.nombre === "estudio_json" && ue.formato === "json_object" && ue.estricto === false && ue.ruta === "/chat/completions" && (m5.razonador ? ue.razonamiento === "low" : ue.razonamiento === null) && rs.anim.formato === "estudio" && rs.anim.escenas.length === 6 && Math.abs(rs.uso.costo_usd - (rs.uso.prompt_tokens * m5.entrada + rs.uso.completion_tokens * m5.salida) / 1e6) < 1e-12 && rs.formato === "estudio", JSON.stringify(ue && { ...ue, sistema: "…", usuario: "…" }));
    await mk.cerrar();
  }
  let mkE = await iniciarMock(0);
  const rE = await generarAnimacion({ guion: guionEstudio, modelo: "gpt-4.1-mini", sfx: true, paleta: "imnoba", motor: "estudio", cfg: cfgMock(mkE) });
  const uE = mkE.estado.ultimaAnimacion;
  prueba("a la IA solo viajan la dirección visual y la voz (ni SFX ni tiempos ni «SFX:»); el prompt de sistema lleva las reglas y el vocabulario", /^ESC 1 \| 6s \| SVG\nDIR: .*\nVOZ: /m.test(uE.usuario) && !/SFX|whoosh|0s-6s/.test(uE.usuario) && /ESTUDIO_JSON/.test(uE.sistema), uE.usuario.slice(0, 300));
  prueba("1 llamada pequeña para 6 escenas y costo real < 1/5 del que cuesta el lienzo libre (0,0123)", rE.uso.llamadas === 1 && rE.uso.completion_tokens < 6 * 220 && rE.uso.costo_usd < 0.0025 && rE.locucion.includes("Bogotá está atrapada"), JSON.stringify(rE.uso));
  const rEst = N.estimarEstudio({ modelo: "gpt-4.1-mini", caracteres: N.parsearEstudio(guionEstudio).caracteresIA, escenas: 6, tokensSistema: fijos.sistema }).costo;
  prueba("la estimación previa del panel está en el mismo orden que el costo real (0,3×–3×)", rEst / rE.uso.costo_usd > 0.3 && rEst / rE.uso.costo_usd < 3, `estimado ${rEst.toFixed(5)} · real ${rE.uso.costo_usd.toFixed(5)}`);
  await mkE.cerrar();
  process.env.MOCK_ESTUDIO_FALTAN = "1";
  mkE = await iniciarMock(0);
  const rF = await generarAnimacion({ guion: guionEstudio, modelo: "gpt-4.1-nano", sfx: true, paleta: "imnoba", motor: "estudio", cfg: cfgMock(mkE) });
  delete process.env.MOCK_ESTUDIO_FALTAN;
  prueba("si la IA se deja una escena: UNA petición solo de esa escena y el costo suma ambas llamadas", rF.uso.llamadas === 2 && /^ESC 2 \|/.test(mkE.estado.ultimaAnimacion.usuario) && !/ESC 1 \|/.test(mkE.estado.ultimaAnimacion.usuario) && rF.anim.escenas.length === 6 && rF.anim.escenas[1].layout === "VERSUS_50_50", JSON.stringify(rF.uso));
  await mkE.cerrar();
  process.env.MOCK_ESTUDIO_MAL = "1";
  mkE = await iniciarMock(0);
  const rM = await generarAnimacion({ guion: guionEstudio, modelo: "gpt-4.1-nano", sfx: true, paleta: "imnoba", motor: "estudio", cfg: cfgMock(mkE) });
  delete process.env.MOCK_ESTUDIO_MAL;
  prueba("una respuesta basura (enums inventados, titular larguísimo) se sanea sin reparaciones ni llamadas extra y el video es válido", rM.uso.llamadas === 1 && rM.correcciones.length > 0 && N.validar(rM.anim) .length === 0 && rM.anim.escenas[0].layout === "HERO_CENTER" && rM.anim.escenas[0].headline.text.length <= 40, JSON.stringify(rM.correcciones));
  await mkE.cerrar();
  const rL = await generarAnimacion({ guion: guionEstudio, modelo: "gpt-4.1-mini", sfx: true, paleta: "imnoba", motor: "clasico", cfg: cfgMock((mkE = await iniciarMock(0))) });
  prueba("el motor clásico sigue disponible (motor: «clasico»): el formato simple vuelve a pedir geometría SVG/3D completa", mkE.estado.ultimaAnimacion.nombre === "animacion_imnoba" && rL.anim.escenas.every((e) => e.modo === "SVG" || e.modo === "3D"));
  await mkE.cerrar();
  const rB = await generarAnimacion({ guion: guionLibre, modelo: "gpt-4.1-mini", sfx: true, paleta: "imnoba", cfg: cfgMock((mkE = await iniciarMock(0))), motor: "estudio" });
  prueba("con motor «estudio» el formato libre ([ESCENA n | 00:00-00:05]) también se diseña en 1 llamada compacta", rB.uso.llamadas === 1 && mkE.estado.ultimaAnimacion.nombre === "estudio_json" && rB.anim.formato === "estudio" && rB.anim.escenas.length === 5);
  await mkE.cerrar();
  mkE = await iniciarMock(0);
  const rEs = await generarAnimacion({ guion: guionEst, modelo: "gpt-4.1-mini", sfx: true, paleta: "retro", cfg: cfgMock(mkE) });
  prueba("el formato estructurado ([CONFIG], GEO, HUD) NO cambia: sigue con su motor retro", mkE.estado.ultimaAnimacion.nombre === "geometria_central" && rEs.anim.formato === "estructurado");
  await mkE.cerrar();
  }

  // ------------------------------------------------------------ disco y render sin ENOSPC
  console.log("\nDisco y render (sin quedarse sin espacio)");
  {
    const { espacioLibreGB, esSinEspacio, limpiarTemporales, mensajeSinEspacio, tamanoCarpeta } = await import("../_disco.mjs");
    const { mkdirSync: mk, writeFileSync: wf, existsSync: ex, rmSync: rm2 } = await import("node:fs");
    prueba("espacioLibreGB mide el disco (número > 0) y funciona aunque la ruta aún no exista", typeof espacioLibreGB() === "number" && espacioLibreGB() > 0 && espacioLibreGB(join(RAIZ, "carpeta", "que", "no", "existe")) > 0);
    prueba("esSinEspacio reconoce ENOSPC (código y mensaje de Node, Chrome y ffmpeg) y no confunde otros errores", esSinEspacio(Object.assign(new Error("x"), { code: "ENOSPC" })) && esSinEspacio(new Error("ENOSPC: no space left on device, write")) && esSinEspacio("av_interleaved_write_frame(): No space left on device") && !esSinEspacio(new Error("Target closed")));
    const t = join(p("trabajo", "tmp"), "prueba-limpieza");
    rm2(t, { recursive: true, force: true });
    for (const d of ["render-anim-viejo", "anim-previa", "conservame"]) { mk(join(t, d), { recursive: true }); wf(join(t, d, "a.bin"), Buffer.alloc(200000)); }
    const lr = limpiarTemporales({ conservar: ["conservame"], tmp: t });
    prueba("limpiarTemporales borra renders viejos y capturas pero respeta lo que se pide conservar, y cuenta lo liberado", !ex(join(t, "render-anim-viejo")) && !ex(join(t, "anim-previa")) && ex(join(t, "conservame")) && lr.borradas.length === 2 && lr.liberadoGB > 0 && tamanoCarpeta(join(t, "conservame")) === 200000, JSON.stringify(lr));
    rm2(t, { recursive: true, force: true });
    prueba("el mensaje de falta de espacio explica qué hacer (npm run limpiar, temporales de Windows, mover el proyecto) y npm run limpiar existe", /npm run limpiar/.test(mensajeSinEspacio(0.1)) && /Papelera|temporales/.test(mensajeSinEspacio(0.1)) && /otro disco/.test(mensajeSinEspacio(0.1)) && JSON.parse(readFileSync(p("package.json"), "utf8")).scripts.limpiar === "node scripts/limpiar.mjs");
    const fuenteRender = readFileSync(p("scripts", "render.mjs"), "utf8");
    prueba("render.mjs codifica cada trozo de 5 s y BORRA sus fotogramas (pico ≈ 0,2 GB), mide el disco antes de empezar, limpia temporales viejos y atrapa ENOSPC con un mensaje claro", /async function codificarSegmento/.test(fuenteRender) && /rmSync\(join\(FOTOGRAMAS, nombre\(f\)\)/.test(fuenteRender) && /espacioLibreGB\(RAIZ_PROYECTO\)/.test(fuenteRender) && /limpiarTemporales/.test(fuenteRender) && /unhandledRejection/.test(fuenteRender) && /fatalDisco/.test(fuenteRender) && /process\.exit\(3\)/.test(fuenteRender));
  }

  {
    // disco casi lleno simulado: el render debe parar ANTES de empezar, con código 3 y el mensaje de qué hacer (y sin tocar nada)
    const rr = await new Promise((ok) => {
      const proc = spawn(process.execPath, [p("scripts", "render.mjs"), "--composicion=Animacion"], { cwd: RAIZ, env: { ...process.env, VIDEMED_DISCO_GB: "0.1" } });
      let out = "", err = "";
      proc.stdout.on("data", (d) => (out += d));
      proc.stderr.on("data", (d) => (err += d));
      proc.on("close", (status) => ok({ status, out, err }));
    });
    prueba("render con el disco casi lleno (simulado, 0,1 GB libres): para antes de empezar con código 3, explica qué hacer y avisa que lo hecho se conserva", rr.status === 3 && /se quedó sin espacio/.test(rr.err) && /npm run limpiar/.test(rr.err) && /sigue donde quedó/.test(rr.err), (rr.out + rr.err).slice(-500));
  }

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
    let h = await http("GET", "/api/estado");
    prueba("el panel informa su versión (commit) y NO pide reiniciar mientras el código no cambie; el aviso para reiniciar existe en la interfaz y `npm run actualizar` está disponible", h.codigo === 200 && typeof h.json.commit === "string" && h.json.reiniciar === false && /aviso-version/.test(readFileSync(p("scripts", "panel", "web", "app.js"), "utf8")) && JSON.parse(readFileSync(p("package.json"), "utf8")).scripts.actualizar === "node scripts/actualizar.mjs" && existsSync(p("scripts", "actualizar.mjs")), h.texto.slice(0, 200));
    h = await http("GET", "/modulos/anim-nucleo.js");
    prueba("el panel sirve el MISMO núcleo (parser, costos, esquema) compilado para el navegador", h.codigo === 200 && /javascript/.test(h.tipo) && /parsearGuion/.test(h.texto) && /costoUSD/.test(h.texto) && !/require\(/.test(h.texto));
    h = await http("GET", "/");
    prueba("la interfaz tiene el Estudio como pantalla principal", /data-nav="estudio"/.test(h.texto));
    h = await http("GET", "/app.js");
    prueba("el Estudio tiene los 4 controles: textarea, modelo, SFX y paleta, más el costo en vivo y copiar prompt", ["textarea#guion", "select#modelo", "input#sfx", "select#paleta", "costo-estimado", "Copiar Prompt Formateador", "Costo estimado de este video", "Costo real de este video"].every((t) => h.texto.includes(t)));
    h = await http("GET", "/api/anim/ejemplo");
    prueba("API: entrega el ejemplo (una frase)", h.codigo === 200 && h.json.guion.length > 40);
    h = await http("GET", "/api/anim/ejemplo?formato=hud&paleta=retro");
    prueba("API: formato=hud entrega el ejemplo estructurado (HUD retro)", h.codigo === 200 && /\[CONFIG\]/.test(h.json.guion) && /GAUGE_1/.test(h.json.guion) && /valor de un inmueble/i.test(h.json.guion));
    h = await http("POST", "/api/accion", { nombre: "anim-generar", opciones: { guion: "[ESCENA 1 | 5s-2s | MODO: X]\nhola", modelo: "gpt-4.1-mini" } });
    prueba("API: un guion inválido se rechaza con 400 y explica el problema", h.codigo === 400 && /problemas/.test(h.json.error), h.texto.slice(0, 200));
    h = await http("POST", "/api/accion", { nombre: "anim-generar", opciones: { guion: guionEjemplo, modelo: "gpt-4.1-mini", sfx: false, paleta: "imnoba", motor: "clasico" } });
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
    h = await http("POST", "/api/accion", { nombre: "anim-generar", opciones: { guion: guionLibre, modelo: "gpt-4.1-mini", sfx: true, paleta: "imnoba", verificar: false, motor: "clasico" } });
    const finL = await esperarTrabajo();
    h = await http("GET", "/api/anim/estado");
    prueba("API: generar en formato libre → animación LIBRE con costo real, enlace a la locución y sin escenas de rescate", finL?.estado === "ok" && h.json.animacion?.formato === "libre" && h.json.animacion.escenas.every((e) => e.modo === "LIBRE") && h.json.animacion.uso.costo_usd > 0 && h.json.locucion?.url === "/salida/guion-locucion.txt?descargar=1" && h.json.rescatadas.length === 0, JSON.stringify(finL) + h.texto.slice(0, 200));
    h = await http("GET", "/salida/guion-locucion.txt");
    prueba("la locución del formato libre se sirve con la VOZ_OFF (sin la dirección visual)", h.codigo === 200 && /publicar tu casa/.test(h.texto) && !/Noche azul profunda/.test(h.texto));
    h = await http("POST", "/api/accion", { nombre: "anim-generar", opciones: { guion: readFileSync(p("ejemplos", "animacion-viral", "idea.txt"), "utf8"), modelo: "gpt-4.1-nano", sfx: true, paleta: "imnoba" } });
    prueba("API: una frase de idea lanza la generación (sin errores de guion)", h.codigo === 200 && h.json.trabajo?.nombre === "anim-generar", h.texto.slice(0, 200));
    const finI = await esperarTrabajo();
    h = await http("GET", "/api/anim/estado");
    prueba("API: una frase → video viral de 10 escenas con costo real, plantillas en la tabla y enlace a la locución", finI?.estado === "ok" && h.json.animacion?.formato === "viral" && h.json.animacion.escenas.length === 10 && h.json.animacion.escenas[0].tipo === "HOOK" && h.json.animacion.escenas[9].tipo === "CTA" && h.json.animacion.uso.costo_usd > 0 && h.json.animacion.uso.modelo === "gpt-4.1-nano" && h.json.locucion?.url === "/salida/guion-locucion.txt?descargar=1", JSON.stringify(finI) + h.texto.slice(0, 200));
    h = await http("GET", "/salida/guion-locucion.txt");
    prueba("la locución del video (guion para grabar) se sirve con la voz de cada escena", h.codigo === 200 && /Te imaginas cruzar Bogotá/.test(h.texto) && /\[ESCENA 10 \|/.test(h.texto));
    process.env.VIDEMED_DISCO_GB = "0.1";
    h = await http("POST", "/api/accion", { nombre: "anim-render", opciones: {} });
    delete process.env.VIDEMED_DISCO_GB;
    prueba("panel: con el disco casi lleno (simulado) el render no arranca y explica cómo liberar espacio (507) en vez de fallar a mitad", h.codigo === 507 && /npm run limpiar/.test(h.json.error), h.texto.slice(0, 250));
    h = await http("POST", "/api/accion", { nombre: "anim-generar", opciones: { guion: "hola", modelo: "gpt-4.1-mini" } });
    prueba("API: una frase demasiado corta se rechaza con 400 y pide una idea", h.codigo === 400 && /idea/i.test(h.json.error), h.texto.slice(0, 200));
    h = await http("POST", "/api/accion", { nombre: "anim-generar", opciones: { guion: "[ESCENA 1 | 5-2]\nx", modelo: "gpt-4.1-mini" } });
    prueba("API: un guion libre con el tiempo al revés se rechaza con 400 y explica el problema", h.codigo === 400 && /fin/.test(h.json.error), h.texto.slice(0, 200));
    h = await http("GET", "/api/anim/ejemplo");
    prueba("API: el ejemplo por defecto es UNA frase de idea (sin bloques, sin CONFIG)", h.codigo === 200 && !/\[ESCENA|\[CONFIG/.test(h.json.guion) && /IMNOBA/.test(h.json.guion) && h.json.guion.split("\n").length === 1);
    h = await http("GET", "/api/anim/ejemplo?formato=estudio");
    prueba("API: formato=estudio entrega el guion en bloques ([ESCENA n | 0s-6s | MODO: SVG] + VOZ_OFF + DIRECCION_VISUAL + SFX)", h.codigo === 200 && /\[ESCENA 1 \| 0s-6s \| MODO: SVG\]/.test(h.json.guion) && /VOZ_OFF:/.test(h.json.guion) && /DIRECCION_VISUAL:/.test(h.json.guion) && /SFX:/.test(h.json.guion) && !/CONFIG/.test(h.json.guion));
    h = await http("GET", "/api/anim/ejemplo?formato=libre");
    prueba("API: formato=libre sigue entregando el ejemplo del lienzo libre (sin MODO)", h.codigo === 200 && /\[ESCENA 1 \| 00:00-00:05\]/.test(h.json.guion) && !/CONFIG|MODO:/.test(h.json.guion));
    h = await http("GET", "/api/anim/ejemplo?formato=simple");
    prueba("API: formato=simple sigue entregando el ejemplo de siempre", h.codigo === 200 && /MODO: SVG/.test(h.json.guion));
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
    spawnSync(process.execPath, [p("scripts", "anim", "ejemplo.mjs"), "--formato=libre"], { cwd: RAIZ });
    const rp = spawnSync(process.execPath, [p("scripts", "anim", "previa.mjs"), "--qa"], { cwd: RAIZ, encoding: "utf8", timeout: 600000 });
    const { verificarEscenas } = await import("./verificar.mjs");
    const vOk = await verificarEscenas(JSON.parse(readFileSync(ANIM, "utf8")));
    prueba("verificarEscenas (Chrome real): las 5 escenas del ejemplo libre se ejecutan bien, sin texto fuera del lienzo, vacías ni congeladas", vOk.errores.length === 0, vOk.errores.join(" | "));
    const mala = JSON.parse(readFileSync(ANIM, "utf8"));
    const fabrica = async (n, cuerpo) => { const e = mala.escenas[n - 1]; e.codigo = cuerpo; e.js = await compilarEscena(cuerpo); };
    await fabrica(1, "const f = useCurrentFrame();\nreturn <AbsoluteFill>{cosaQueNoExiste(f)}</AbsoluteFill>;");
    await fabrica(2, 'const f = useCurrentFrame();\nreturn <AbsoluteFill><KineticText texto="PALABRAINTERMINABLEQUESEDESBORDA" tam={200} maxAncho={2000} x={-300} /></AbsoluteFill>;');
    await fabrica(3, "const f = useCurrentFrame();\nreturn <AbsoluteFill style={{ background: C.fondo }} />;");
    await fabrica(4, "const f = useCurrentFrame();\nreturn <AbsoluteFill style={{ background: `linear-gradient(${C.fondo}, ${C.azul})` }}><Svg><circle cx={540} cy={900} r={300} fill={C.acento} /></Svg></AbsoluteFill>;");
    const vMal = await verificarEscenas(mala);
    prueba("verificarEscenas detecta en el navegador: error de ejecución (1), escena vacía (3) y escena congelada (4)", vMal.errores.some((e) => /^Escena 1:.*falla al ejecutarse.*cosaQueNoExiste/.test(e)) && vMal.errores.some((e) => /^Escena 3:.*vac[ií]a/.test(e)) && vMal.errores.some((e) => /^Escena 4:.*congelada/.test(e)) && !vMal.errores.some((e) => /^Escena 5:/.test(e)), vMal.errores.join(" | "));
    prueba("la escena rota no tumba el video: se dibuja la de rescate y el error queda registrado", vMal.errores.some((e) => /^Escena 1:/.test(e)));
    prueba("previa.mjs --qa: 5 capturas (SVG y 3D con WebGL) y QA sin problemas", rp.status === 0 && readdirSync(p("trabajo", "tmp", "anim-previa")).filter((x) => /^escena-\d+\.png$/.test(x)).length === 5, (rp.stdout + rp.stderr).slice(-500));
    spawnSync(process.execPath, [p("scripts", "anim", "ejemplo.mjs")], { cwd: RAIZ });
    const rq = spawnSync(process.execPath, [p("scripts", "anim", "previa.mjs"), "--qa"], { cwd: RAIZ, encoding: "utf8", timeout: 600000 });
    prueba("previa.mjs --qa del motor viral (10 plantillas: gancho, número, versus, ruta, pasos, tendencia, barras, ciudad, lista y cierre): una captura por escena y QA sin problemas (márgenes ≥ 80 px, sin vacíos ni congelados)", rq.status === 0 && readdirSync(p("trabajo", "tmp", "anim-previa")).filter((x) => /^escena-\d+\.png$/.test(x)).length === 10 && /sin escenas vac/.test(rq.stdout), (rq.stdout + rq.stderr).slice(-600));
    spawnSync(process.execPath, [p("scripts", "anim", "ejemplo.mjs"), "--tema=carros"], { cwd: RAIZ });
    const rq3 = spawnSync(process.execPath, [p("scripts", "anim", "previa.mjs"), "--qa"], { cwd: RAIZ, encoding: "utf8", timeout: 600000 });
    prueba("previa.mjs --qa del ejemplo de carros (PICTO, MITO, DONUT, TOP + las de siempre): una captura por escena y QA sin problemas", rq3.status === 0 && readdirSync(p("trabajo", "tmp", "anim-previa")).filter((x) => /^escena-\d+\.png$/.test(x)).length === 8, (rq3.stdout + rq3.stderr).slice(-600));
    spawnSync(process.execPath, [p("scripts", "anim", "ejemplo.mjs"), "--tema=ciencia"], { cwd: RAIZ });
    const rq4 = spawnSync(process.execPath, [p("scripts", "anim", "previa.mjs"), "--qa"], { cwd: RAIZ, encoding: "utf8", timeout: 600000 });
    prueba("previa.mjs --qa del ejemplo de ciencia (ZOOM, MIRA, SPLIT, TERMO, IMPACTO, CAPAS, RED con banda, fichas de cita y escenarios): una captura por escena y QA sin problemas", rq4.status === 0 && readdirSync(p("trabajo", "tmp", "anim-previa")).filter((x) => /^escena-\d+\.png$/.test(x)).length === 10, (rq4.stdout + rq4.stderr).slice(-700));
    spawnSync(process.execPath, [p("scripts", "anim", "ejemplo.mjs"), "--formato=estudio"], { cwd: RAIZ });
    const rq2 = spawnSync(process.execPath, [p("scripts", "anim", "previa.mjs"), "--qa"], { cwd: RAIZ, encoding: "utf8", timeout: 600000 });
    prueba("previa.mjs --qa del motor de estudio (figuras halftone, los 4 layouts): 6 capturas y QA sin problemas", rq2.status === 0 && readdirSync(p("trabajo", "tmp", "anim-previa")).filter((x) => /^escena-\d+\.png$/.test(x)).length === 6, (rq2.stdout + rq2.stderr).slice(-500));
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
