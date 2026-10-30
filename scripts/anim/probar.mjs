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
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
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

// las pruebas nunca tocan tus datos: voz.config.json, pronunciacion.json, data/ (videos, uso de voz) y cache/audio van a una carpeta temporal
const DIR_PRUEBA = p("trabajo", "tmp", "prueba-datos");
rmSync(DIR_PRUEBA, { recursive: true, force: true });
mkdirSync(join(DIR_PRUEBA, "config"), { recursive: true });
for (const f of ["voz.config.json", "pronunciacion.json"]) copyFileSync(p(f), join(DIR_PRUEBA, "config", f));
process.env.VIDEMED_CONFIG = join(DIR_PRUEBA, "config");
process.env.VIDEMED_DATOS = join(DIR_PRUEBA, "data");
process.env.VIDEMED_VIDEOS = join(DIR_PRUEBA, "videos-vacia"); // las pruebas no leen la carpeta videos/ real (traería los videos de verdad al panel de prueba)
process.env.VIDEMED_CACHE = join(DIR_PRUEBA, "cache");
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
  // la voz en off con IA es opcional y vive SOLO en scripts/anim/voz.mjs (OpenAI audio/speech o ElevenLabs text-to-speech; nada de whisper ni edge-tts); el resto de los scripts y el motor no tocan ninguna API de voz
  const fuenteSinVoz = readdirSync(p("scripts", "anim")).filter((x) => /\.(tsx?|mjs)$/.test(x) && !["probar.mjs", "voz.mjs", "poner-voz.mjs"].includes(x)).map((x) => readFileSync(p("scripts", "anim", x), "utf8")).join("\n");
  const vozSrc = readFileSync(p("scripts", "anim", "voz.mjs"), "utf8");
  prueba("los scripts de animación no llaman a ninguna API de voz (TTS/whisper/ElevenLabs), salvo voz.mjs: la voz en off opcional con OpenAI audio/speech o ElevenLabs text-to-speech (sin whisper, with-timestamps ni edge-tts)", !/audio\/speech|audio\/transcriptions|api\.elevenlabs|text-to-speech|xi-api-key|edge-tts|generar-voz/i.test(fuenteSinVoz) && !/audio\/speech/.test(srcAnim) && /audio\/speech/.test(vozSrc) && /text-to-speech/.test(vozSrc) && !/audio\/transcriptions|with-timestamps|edge-tts/i.test(vozSrc));
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
  prueba("el panel: «Copiar Prompt Formateador» y «Cargar ejemplo» usan la frase de idea (viral); el lienzo libre queda en «Avanzado»", /promptFormateadorIdea\(EST\.marca\)/.test(readFileSync(p("scripts", "panel", "web", "app.js"), "utf8")) && /cargarEjemplo\("viral"\)/.test(readFileSync(p("scripts", "panel", "web", "app.js"), "utf8")) && /PROMPT_FORMATEADOR_LIBRE/.test(readFileSync(p("scripts", "panel", "web", "app.js"), "utf8")) && /Avanzado/.test(readFileSync(p("scripts", "panel", "web", "app.js"), "utf8")));

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
    prueba("parsearIdea: una frase es un video; «de 35 segundos» fija la duración (≈ una escena cada 3,6 s); sin duración ≈ 32 s", pi.errores.length === 0 && pi.duracion === 35 && pi.escenasObjetivo === 10 && N.parsearIdea("Un video sobre el metro de Bogotá").duracion === 32 && N.parsearIdea("un reel de 1 minuto sobre autos").duracion === 60 && N.parsearIdea("algo de 300 segundos").duracion === 180 && N.parsearIdea("algo de 5 segundos").duracion === 15, JSON.stringify(pi));
    prueba("parsearIdea: vacía o demasiado corta → UN error claro; los guiones en bloques ([ESCENA…], [CONFIG]) NO son ideas", N.parsearIdea("").errores.length === 1 && N.parsearIdea("hola").errores.length === 1 && !N.esIdea("[ESCENA 1 | 0s-4s | MODO: SVG]\nx") && !N.esIdea("[CONFIG]\nHUD: ON") && N.esIdea("una frase cualquiera sobre casas"));
    {
      const base = "Un video sobre el metro de Bogotá y la valorización de las propiedades cercanas a las estaciones. ";
      const larga = Array.from({ length: 40 }, (_, k) => `${k + 1}. Punto ${k + 1}: dato importante número ${k + 1} que debe aparecer en el video con su cifra exacta.`).join("\n");
      const gr = N.parsearIdea(`${base}\n\n${larga}`);
      prueba("idea SIN límite de caracteres: una idea de más de 3.000 caracteres es válida (antes el máximo era 1.200), conserva los saltos de línea y las viñetas, y no da errores", gr.caracteres > 3000 && gr.errores.length === 0 && gr.idea.includes("\n") && /1\. Punto 1/.test(gr.idea) && N.parsearIdea("x".repeat(60000) + " idea").errores.length === 0);
      prueba("idea detallada: sin duración pedida el video se alarga con el detalle (32 s hasta 400 caracteres; hasta 90 s), con más escenas y un aviso; una idea corta sigue en 32 s", N.parsearIdea("Un video sobre el metro de Bogotá").duracion === 32 && gr.duracion > 32 && gr.duracion <= 90 && gr.escenasObjetivo > 10 && gr.avisos.some((a) => /detallada/.test(a)) && N.parsearIdea(base + "x ".repeat(10000)).duracion === 90, JSON.stringify([gr.duracion, gr.escenasObjetivo, gr.avisos]));
      prueba("duración pedida de verdad: «video de 2 minutos» / «dura 90 segundos» se respeta (hasta 120 s) aunque la idea sea larga; «5 minutos» como dato del tema NO es la duración", N.parsearIdea(`${base}\n${larga}\nEl video dura 2 minutos.`).duracion === 120 && N.parsearIdea(`${larga}\nQue sea un reel de 90 segundos`).duracion === 90 && N.parsearIdea(`${base}\nLlegar al centro toma solo 5 minutos en metro.\n${larga}`).duracion <= 90 && N.parsearIdea("algo de 300 segundos").avisos.some((a) => /15–180/.test(a)));
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
    prueba("prompt de sistema viral: estático (idéntico siempre → prefijo cacheable), marca [DIRECTOR_VIRAL], los 22 tipos generales y todos los iconos, y compacto (900–2.400 tokens estimados; pasa de los 1.024 que activan el caché de OpenAI); la variante documental también es estática, con los 8 tipos documentales y los generales salvo ROUTE y SKYLINE (de inmuebles)", sv1 === N.sistemaViral() && N.sistemaViral("documental") === N.sistemaViral("documental") && N.sistemaViral("documental") !== sv1 && N.sistemaViral("documental").includes("[DOCUMENTAL]") && N.TIPOS_VIRAL.filter((t) => t !== "ROUTE" && t !== "SKYLINE" && t !== "PIEZA").every((t) => N.sistemaViral("documental").includes(t)) && N.tokensFijosViral("documental").sistema > 1024 && N.tokensFijosViral("documental").sistema < 4000 && sv1.includes("[DIRECTOR_VIRAL]") && N.TIPOS_VIRAL.filter((t) => !N.TIPOS_DOCUMENTAL.includes(t) && t !== "PIEZA").every((t) => sv1.includes(t)) && N.ICONOS_VIRAL.every((i) => sv1.includes(i)) && fv.sistema > 900 && fv.sistema < 2400 && fv.esquema === 0, JSON.stringify(fv));
    prueba("la marca va en el mensaje de usuario (no en el prompt estático): IMNOBA incluye la suya y Medicina la de SINAPSIS (sin nombrar a IMNOBA)", /MARCA: IMNOBA/.test(N.promptUsuarioIdea({ ...pi, paleta: "imnoba" })) && /MARCA: SINAPSIS/.test(N.promptUsuarioIdea({ ...pi, paleta: "medicina" })) && !/IMNOBA\)|MARCA: IMNOBA/.test(N.promptUsuarioIdea({ ...pi, paleta: "medicina" })) && !/IMNOBA/.test(sv1.replace(/ICONOS[\s\S]*$/, "")) && /ESCENAS: 10/.test(N.promptUsuarioIdea(pi)));
    const eV = N.estimarViral({ modelo: "gpt-4.1-mini", caracteres: pi.caracteres, escenas: pi.escenasObjetivo, tokensSistema: fv.sistema });
    prueba("estimarViral: entrada = prompt fijo + frase/3,6 + 30; salida = 165 por escena + 30; costo con la tarifa del modelo", eV.tokensEntrada === fv.sistema + Math.ceil(pi.caracteres / 3.6) + 30 && eV.tokensSalida === 165 * 10 + 30 && Math.abs(eV.costo - (eV.tokensEntrada * 0.4 + eV.tokensSalida * 1.6) / 1e6) < 1e-12, JSON.stringify(eV));
    const cV = (m) => N.estimarViral({ modelo: m, caracteres: pi.caracteres, escenas: 10, tokensSistema: fv.sistema }).costo;
    prueba("orden de tarifas: nano < 4o-mini < 4.1-mini < 4.1 (≈ $0,001–$0,01 por video de 35 s)", cV("gpt-4.1-nano") < cV("gpt-4o-mini") && cV("gpt-4o-mini") < cV("gpt-4.1-mini") && cV("gpt-4.1-mini") < cV("gpt-4.1") && cV("gpt-4.1") < 0.02 && cV("gpt-4.1-nano") < 0.001, [cV("gpt-4.1-nano"), cV("gpt-4o-mini"), cV("gpt-4.1-mini"), cV("gpt-4.1")].join(" · "));
    {
      const mkR = await iniciarMock(0), mkI = await iniciarMock(0);
      const rR = await generarAnimacion({ guion: ideaEj, modelo: "gpt-4.1-mini", sfx: true, paleta: "retro", cfg: cfgMock(mkR) });
      const rI = await generarAnimacion({ guion: ideaEj, modelo: "gpt-4.1-mini", sfx: true, paleta: "imnoba", cfg: cfgMock(mkI) });
      prueba("agente con paleta Retro-Científica: pide el prompt DOCUMENTAL (con IMNOBA, el general), sigue siendo UNA llamada, devuelve escenas válidas y las dibuja con fondos documentales; con IMNOBA todo igual que antes", mkR.estado.ultimaAnimacion.sistema.includes("[DOCUMENTAL]") && !mkI.estado.ultimaAnimacion.sistema.includes("[DOCUMENTAL]") && rR.uso.llamadas === 1 && N.validar(rR.anim).length === 0 && rR.anim.paleta === "retro" && rR.anim.escenas.length >= 6 && rR.anim.escenas.every((e) => e.bg === (e.t === "PAPEL" || e.t === "CICLO" ? "light" : "dark")) && rI.anim.escenas.some((e) => e.bg === "gold") && rI.anim.escenas.every((e) => e.tr === "barrido" || e.tr === "zoom"), JSON.stringify([rR.anim.escenas.map((e) => e.t + ":" + e.bg), rI.anim.escenas.length]));
      await mkR.cerrar(); await mkI.cerrar();
    }
    {
      const ideaLarga = Array.from({ length: 60 }, (_, k) => `Punto ${k + 1}: dato importante ${k + 1} del tema con su cifra.`).join("\n");
      const mkL = await iniciarMock(0);
      const rL = await generarAnimacion({ guion: `Un video sobre el metro de Bogotá.\n${ideaLarga}`, modelo: "gpt-4.1-mini", sfx: true, paleta: "imnoba", cfg: cfgMock(mkL) });
      prueba("agente con una idea LARGA (≈ 3.000 caracteres, 60 puntos): se genera sin error, dura más que una corta (≈ 90 s, ≈ 25 escenas), sigue siendo UNA llamada y el video es válido", rL.anim.escenas.length >= 20 && rL.anim.duracion > 60 && rL.uso.llamadas === 1 && N.validar(rL.anim).length === 0, JSON.stringify([rL.anim.escenas.length, rL.anim.duracion, rL.uso.llamadas]));
      await mkL.cerrar();
    }
    // ── Documental v4: estilo de los videos de referencia (Retro-Científica) y sus 8 plantillas ──
    {
      const dp = sv({ t: "PAPEL", papel: { autor: "Danziger y equipo", anio: "año 2011", rol: "psicólogo · Israel", n: "1.112 decisiones", u: "decisiones", desc: "de 8 jueces", puntos: "false" } }).escena.papel;
      prueba("saneado PAPEL: año de 4 dígitos, n solo dígitos, rol largo cabe (≤ 38), `puntos` falso se respeta y por defecto es verdadero", dp.anio === "2011" && /^[\d.,]+$/.test(dp.n) && dp.puntos === false && sv({ t: "PAPEL" }).escena.papel.puntos === true && sv({ t: "PAPEL", papel: { rol: "paleontólogo · Estados Unidos" } }).escena.papel.rol === "paleontólogo · Estados Unidos");
      const pl = sv({ t: "PILARES", pilares: { cabeza: "1 de 3", cols: [{ l: "a", k: 500, n: 10, u: "x" }, { l: "b", k: 3, n: 100 }, { l: "c", k: 2, n: 50 }, { l: "d" }, { l: "e" }] } }).escena.pilares;
      prueba("saneado PILARES: 2–4 columnas, k nunca pasa de n, la columna destacada por defecto es la más pequeña; sin columnas usa tres de ejemplo", pl.cols.length === 4 && pl.cols[0].k === 10 && pl.hi === 0 && sv({ t: "PILARES" }).escena.pilares.cols.length === 3 && sv({ t: "PILARES", pilares: { cols: [{ n: 5, k: 1 }, { n: 9, k: 3 }], hi: 1 } }).escena.pilares.hi === 1);
      const ci = sv({ t: "CICLO", ciclo: { pasos: ["uno", "dos", "tres", "cuatro", "cinco"] } }).escena.ciclo;
      prueba("saneado CICLO: 3–4 pasos (el exceso se recorta; con menos de 3 se completa con pasos de ejemplo y se avisa)", ci.pasos.length === 4 && sv({ t: "CICLO", ciclo: { pasos: ["uno"] } }).escena.ciclo.pasos.length === 3 && sv({ t: "CICLO", ciclo: { pasos: ["uno"] } }).correcciones.length === 1);
      const du = sv({ t: "DUO", duo: { a: { l: "se queda", v: 65 }, b: { l: "antes del descanso en la sesión", v: -3 }, palabra: "culpa" } }).escena.duo;
      prueba("saneado DUO: v acepta 0–1 o 0–100 y se acota a [0, 1], la palabra va en mayúsculas y las etiquetas caben (≤ 28)", du.a.v === 0.65 && du.b.v === 0 && du.palabra === "CULPA" && du.b.l.length <= 28 && sv({ t: "DUO" }).escena.duo.a.v === 1);
      const os = sv({ t: "OSCILO", osc: { curva: "raro", a: "año 1962" } }).escena.osc;
      const cu = sv({ t: "CUBO", cubo: { ejes: ["x"], n: 9999, zonas: [{ l: "caracoles", x: 7, y: -2, z: "0,5" }] } }).escena.cubo;
      prueba("saneado OSCILO y CUBO: curva por defecto lissajous; el cubo completa los 3 ejes, acota n (60–400) y x,y,z a [0, 1], y sin zonas usa dos de ejemplo", os.curva === "lissajous" && os.a === "1962" && cu.ejes.length === 3 && cu.n === 400 && cu.zonas[0].x === 1 && cu.zonas[0].y === 0 && cu.zonas[0].z === 0.5 && sv({ t: "CUBO" }).escena.cubo.zonas.length === 2);
      const dl = sv({ t: "DIALES", diales: { fig: "onda", items: [{ l: "se ensancha", a: 3, b: 400, max: 500, u: "×" }] } }).escena.diales;
      prueba("saneado DIALES: siempre 3 diales (los que faltan se completan), min < max, figura espiral por defecto o onda", dl.items.length === 3 && dl.fig === "onda" && dl.items.every((it) => it.min < it.max) && dl.items[0].b === 400 && sv({ t: "DIALES" }).escena.diales.fig === "espiral");
      prueba("PUNCH no pide datos extra; `cap` (línea mono) solo se guarda en HOOK y en las plantillas documentales", sv({ t: "PUNCH", h: "QUIETO", cap: "x *y*" }).escena.cap === "x *y*" && sv({ t: "HOOK", cap: "a" }).escena.cap === "a" && sv({ t: "NUM", cap: "no cabe aquí" }).escena.cap === "" && sv({ t: "DIALES", cap: "1 · *se ensancha*" }).escena.cap.includes("*"));
      prueba("estilo documental = las dos paletas Retro-Científica (retro, retro-imnoba); IMNOBA y Medicina no cambian", N.esDocumental("retro") && N.esDocumental("retro-imnoba") && !N.esDocumental("imnoba") && !N.esDocumental("medicina") && !N.esDocumental(undefined));
      const tOsc = N.temaViral("retro", "dark"), tLuz = N.temaViral("retro", "light"), tGold = N.temaViral("retro", "gold");
      prueba("tema documental (hex del brief): fondo negro mate #0B0C10 plano, papel #F4F1EA, rojo bermellón #E63926 = el sujeto, cobalto #2B44FF = lo que cambia, lima #D4FF33 = datos; el «gold» se trata como oscuro", tOsc.bg0 === "#0B0C10" && tOsc.bg1 === "#0B0C10" && tLuz.bg0 === "#F4F1EA" && tOsc.acento === "#E63926" && tOsc.acento2 === "#2B44FF" && tOsc.neon === "#D4FF33" && tOsc.oscuro && !tLuz.oscuro && tGold.bg0 === "#0B0C10" && N.temaViral("imnoba", "dark").neon === undefined);
      prueba("fondos documentales: solo PAPEL y CICLO van sobre papel claro; el resto, oscuro, y puede repetirse; los generales no cambian", N.asignarFondos(["HOOK", "PAPEL", "PILARES", "PUNCH", "CICLO", "DUO", "CTA"], [], true).join() === "dark,light,dark,dark,light,dark,dark" && N.asignarFondos(["HOOK", "NUM", "VS"]).join() === "dark,gold,dark");
      const rawD = JSON.parse(readFileSync(p("ejemplos", "animacion-viral", "respuesta-ia-documental.json"), "utf8"));
      const eD = N.ensamblarViral(rawD, { modo: "idea", paleta: "retro", sfx: true });
      const eG = N.ensamblarViral(rawD, { modo: "idea", paleta: "imnoba", sfx: true });
      prueba("transiciones documentales: corte seco entre escenas, la ficha de papel entra deslizándose, la primera barrido; con IMNOBA siguen siendo barridos", eD.anim.escenas[0].tr === "barrido" && eD.anim.escenas.slice(1).every((e) => e.tr === "corte" || e.tr === "papel") && eD.anim.escenas.find((e) => e.t === "PAPEL").tr === "papel" && eD.anim.escenas.find((e) => e.t === "CICLO").tr === "papel" && eG.anim.escenas.every((e) => e.tr === "barrido") && eD.anim.escenas.every((e) => e.bg === (e.t === "PAPEL" || e.t === "CICLO" ? "light" : "dark")));
      const pdoc = N.parsearIdea("Un video sobre el estudio de los jueces", { paleta: "retro" });
      const pdet = N.parsearIdea("Un video sobre los jueces. " + "Dato importante del estudio. ".repeat(120), { paleta: "retro" });
      prueba("duración documental: sin pedirla ≈ 60 s (≈ 14 escenas, una cada ≈ 4,4 s); con mucho detalle hasta 120 s; se puede pedir hasta 180 s; sin paleta Retro sigue 32 s", pdoc.duracion === 60 && pdoc.escenasObjetivo === 14 && pdet.duracion > 100 && pdet.duracion <= 120 && N.parsearIdea("un video de 3 minutos", { paleta: "retro" }).duracion === 180 && N.parsearIdea("Un video sobre los jueces").duracion === 32, JSON.stringify([pdoc.duracion, pdoc.escenasObjetivo, pdet.duracion]));
      const sdoc = N.sistemaViral("documental");
      prueba("prompt documental: estático, marca [DIRECTOR_VIRAL] y [DOCUMENTAL], el ARCO NARRATIVO de los videos de referencia (afirmación → prueba → estudio con su muestra → patrón y giro → concepto con nombre → por qué → segunda fuente → analogías → pregunta final), no inventar autores ni cifras, y los 8 tipos documentales con su formato", sdoc === N.sistemaViral("documental") && sdoc.includes("[DIRECTOR_VIRAL]") && sdoc.includes("[DOCUMENTAL]") && /ARCO NARRATIVO/.test(sdoc) && /AFIRMACIÓN/.test(sdoc) && /pregunta abierta/.test(sdoc) && /nunca inventes un autor/.test(sdoc) && N.TIPOS_DOCUMENTAL.every((t) => new RegExp(`\\b${t}\\b`).test(sdoc)) && /"papel":\{/.test(sdoc) && /"diales":\{/.test(sdoc) && /"cubo":\{/.test(sdoc));
      const pc = N.parsearIdea(readFileSync(p("ejemplos", "animacion-viral", "idea-conchas.txt"), "utf8"), { paleta: "retro" });
      const ec = N.ensamblarViral(JSON.parse(readFileSync(p("ejemplos", "animacion-viral", "respuesta-ia-conchas.json"), "utf8")), { modo: "idea", paleta: "retro", sfx: true });
      const tiposDoc = new Set([...eD.anim.escenas, ...ec.anim.escenas].map((e) => e.t));
      prueba("ejemplos documentales (conchas y jueces): válidos y sin correcciones; juntos usan las 8 plantillas documentales; duran ≈ 1 minuto", pc.errores.length === 0 && N.validar(ec.anim).length === 0 && N.validar(eD.anim).length === 0 && ec.correcciones.length === 0 && eD.correcciones.length === 0 && N.TIPOS_DOCUMENTAL.every((t) => tiposDoc.has(t)) && ec.anim.duracion > 50 && ec.anim.duracion < 80 && eD.anim.duracion > 50 && eD.anim.duracion < 80, JSON.stringify([N.validar(ec.anim), ec.correcciones, eD.correcciones]));
      const sf = (t, extra = {}) => N.sfxViral({ t, items: [], bars: [], stops: [], top: [], picto: null, dur: 9, ...extra }, 1);
      prueba("SFX documentales: PAPEL cuenta con clics y cierra con golpe de sello; PILARES sube, golpea la fracción y rayado con clics; PUNCH golpe+thud+polvo; DUO golpea al llenar la palabra; DIALES con clics; CUBO con radar al marcar las zonas", sf("PAPEL", { papel: { puntos: true } }).some((x) => x.tipo === "golpe") && sf("PAPEL", { papel: { puntos: true } }).filter((x) => x.tipo === "clic").length >= 8 && sf("PILARES", { pilares: { cols: [{}, {}, {}] } }).filter((x) => x.tipo === "pop").length === 3 && ["golpe", "thud", "polvo"].every((t) => sf("PUNCH").some((x) => x.tipo === t)) && sf("DUO").some((x) => x.tipo === "golpe") && sf("DIALES").filter((x) => x.tipo === "clic").length >= 10 && sf("CUBO").some((x) => x.tipo === "radar") && sf("CICLO", { ciclo: { pasos: ["a", "b", "c"] } }).filter((x) => x.tipo === "pop").length === 3);
      prueba("años en los contadores (1966, 1989) se muestran tal cual, sin separador de miles ni cuenta", /esAnio/.test(readFileSync(p("src", "viral", "plantillas1.tsx"), "utf8")) && /esAnio/.test(readFileSync(p("src", "viral", "ciencia2.tsx"), "utf8")) && /\(19\|20\)/.test(readFileSync(p("src", "viral", "comun.tsx"), "utf8")));
      prueba("las fuentes del estilo (Archivo Black + JetBrains Mono) viajan en public/fonts con su licencia y se cargan antes de renderizar; los titulares usan variables CSS (--f-titulo) que solo el estilo documental redefine", existsSync(p("public", "fonts", "archivo-black-latin-400-normal.woff2")) && existsSync(p("public", "fonts", "ARCHIVO-BLACK-LICENSE.txt")) && /Archivo Black/.test(readFileSync(p("src", "lib", "fuentes.ts"), "utf8")) && /var\(--f-titulo/.test(readFileSync(p("src", "viral", "comun.tsx"), "utf8")) && /VARS_DOCUMENTAL/.test(readFileSync(p("src", "viral", "EscenaViral.tsx"), "utf8")));
      prueba("animaciones viral guardadas antes (sin cap, papel, pilares…) siguen válidas", (() => { const vieja = JSON.parse(JSON.stringify(ec.anim)); for (const e of vieja.escenas) { for (const k of ["cap", "papel", "pilares", "ciclo", "duo", "osc", "cubo", "diales"]) delete e[k]; } return N.validar(vieja).length === 0; })());
    }
    // plantillas nuevas: DONUT, PICTO, TOP, MITO
    prueba("hay 31 tipos de escena (las 10 de siempre + DONUT, PICTO, TOP, MITO + ZOOM, CAPAS, MIRA, IMPACTO, RED, TERMO, SPLIT, PILA + las 8 documentales PAPEL, PILARES, CICLO, PUNCH, DUO, OSCILO, CUBO y DIALES + PIEZA, la escena a medida que la IA del panel nunca elige) y el prompt explica la viralidad (gancho que frena el scroll, cambio de plantilla, acción final)", N.TIPOS_VIRAL.length === 31 && !sv1.includes("PIEZA") && !N.sistemaViral("documental").includes("PIEZA") && ["DONUT", "PICTO", "TOP", "MITO", "ZOOM", "CAPAS", "MIRA", "IMPACTO", "RED", "TERMO", "SPLIT", "PILA", "PAPEL", "PILARES", "CICLO", "PUNCH", "DUO", "OSCILO", "CUBO", "DIALES"].every((t) => N.TIPOS_VIRAL.includes(t)) && /frenar el scroll/.test(sv1) && /Guárdalo y compártelo/.test(sv1) && /nunca la misma dos veces seguidas/.test(sv1));
    prueba("saneado DONUT: 2–4 partes con valores ≥ 0; sin datos usa la cifra de la voz (sí/no suman 100)", sv({ t: "DONUT", donut: [{ l: "a", v: 60 }, { l: "b", v: 40 }, { l: "c", v: 5 }, { l: "d", v: 1 }, { l: "e", v: 9 }] }).escena.donut.length === 4 && (() => { const d = sv({ t: "DONUT", voz: "el 62 % son propietarios" }).escena.donut; return d.length === 2 && d[0].v + d[1].v === 100 && d[0].v === 62; })());
    prueba("saneado PICTO: n entre 4 y 20 (si no, 10), k entre 1 y n−1, icono por texto; TOP con 3–5 puestos; MITO sin «myth» se completa y marca la corrección", (() => { const a = sv({ t: "PICTO", picto: { n: 99, k: 50, ic: "casa", l: "x" } }).escena.picto; const b = sv({ t: "PICTO", picto: { n: 10, k: 0 } }).escena.picto; return a.n === 10 && a.k === 9 && b.k >= 1 && b.k < b.n; })() && sv({ t: "TOP", top: [{ l: "a" }] }).escena.top.length === 3 && sv({ t: "TOP", top: Array.from({ length: 9 }, (_, i) => ({ l: `p${i}`, v: "1" })) }).escena.top.length === 5 && (() => { const m = sv({ t: "MITO", h: "LA REALIDAD" }); return m.escena.myth.length > 0 && m.escena.truth.length > 0 && m.correcciones.length > 0; })());
    const pcr = N.parsearIdea(readFileSync(p("ejemplos", "animacion-viral", "idea-carros.txt"), "utf8"));
    const evc = N.ensamblarViral(JSON.parse(readFileSync(p("ejemplos", "animacion-viral", "respuesta-ia-carros.json"), "utf8")), { modo: "idea", paleta: "imnoba", sfx: true });
    prueba("ejemplo de carros (otro tema): idea de 30 s, 8 escenas válidas con PICTO, MITO, DONUT y TOP; el TOP sfx suena por puesto y el MITO tiene golpe, tachado y revelación", pcr.errores.length === 0 && pcr.duracion === 30 && evc.anim.escenas.length === 8 && N.validar(evc.anim).length === 0 && ["PICTO", "MITO", "DONUT", "TOP"].every((t) => evc.anim.escenas.some((e) => e.t === t)) && evc.anim.escenas.find((e) => e.t === "TOP").sfx.filter((x) => x.tipo === "pop" || x.tipo === "ding").length === 3 && evc.anim.escenas.find((e) => e.t === "MITO").sfx.map((x) => x.tipo).join().includes("thud,zap,ding"), JSON.stringify(N.validar(evc.anim)));
    const fc = N.asignarFondos(evc.anim.escenas.map((e) => e.t));
    prueba("en el ejemplo de carros los fondos también alternan sin repetirse y el CTA es dorado", fc.every((x, i) => i === 0 || x !== fc[i - 1]) && fc[0] === "dark" && fc[fc.length - 1] === "gold");

    // ── Carril B: escenas a medida (PIEZA) y el piloto «Metro de Bogotá» ──
    {
      const srcIdx = readFileSync(p("src", "viral", "piezas", "index.tsx"), "utf8");
      prueba("registro de piezas: cada id de src/anim/piezas.ts tiene su componente en src/viral/piezas/index.tsx, y hay 82 (9 del piloto «Metro de Bogotá» + 10 del ensayo «Anomalía» + 11 del video realista + 12 del video médico + 8 de «La regla del 37 %» + 6 de astrocitos + 5 de DSCR + 6 de los 4 tejidos + 8 de «Los dueños del cerebro» + 7 de «El efecto del dígito izquierdo»)", N.IDS_PIEZA.length === 82 && N.IDS_PIEZA.filter((id) => id.startsWith("dig-")).length === 7 && N.IDS_PIEZA.filter((id) => id.startsWith("ein-")).length === 8 && N.IDS_PIEZA.filter((id) => id.startsWith("tej-")).length === 6 && N.IDS_PIEZA.filter((id) => id.startsWith("astro-")).length === 6 && N.IDS_PIEZA.filter((id) => id.startsWith("dscr-")).length === 5 && N.IDS_PIEZA.filter((id) => id.startsWith("par-")).length === 8 && N.IDS_PIEZA.filter((id) => id.startsWith("real-")).length === 11 && N.IDS_PIEZA.filter((id) => id.startsWith("med-")).length === 12 && N.IDS_PIEZA.filter((id) => id.startsWith("anom-")).length === 10 && N.IDS_PIEZA.every((id) => srcIdx.includes(`"${id}":`)) && N.IDS_PIEZA.every((id) => N.PIEZAS[id].ideal > 3 && ["dark", "light"].includes(N.PIEZAS[id].fondo) && N.PIEZAS[id].sfx(N.PIEZAS[id].ideal, 1).length > 2));
      const pz = N.normalizarEscenaViral({ t: "PIEZA", voz: "ocho millones en un solo plano", h: "UN SOLO PLANO", dur: 8, cap: "Bogotá", pieza: { id: "metro-plano", props: { a: 1, b: "x", c: [1, 2], malo: { x: 1 }, f: () => 1 } } }, 1);
      prueba("PIEZA: conserva el id y limpia las props (solo números, textos, booleanos y listas); acepta la línea `cap`", pz.escena.t === "PIEZA" && pz.escena.pieza?.id === "metro-plano" && pz.escena.pieza.props.a === 1 && pz.escena.pieza.props.b === "x" && Array.isArray(pz.escena.pieza.props.c) && !("malo" in pz.escena.pieza.props) && pz.escena.cap === "Bogotá");
      const pzx = N.normalizarEscenaViral({ t: "PIEZA", voz: "una frase cualquiera sobre algo", h: "ALGO", pieza: { id: "no-existe" } }, 1);
      prueba("PIEZA con un id desconocido nunca rompe: cae a HOOK y avisa con la lista de ids válidos", pzx.escena.t === "HOOK" && pzx.correcciones.some((c) => c.includes("metro-plano")));
      prueba("valorSuelo: +35 % hasta 500 m, +20 % a 800 m (baja en línea recta), se apaga hacia los 1.500 m y nunca es negativo", N.valorSuelo(0) === 35 && N.valorSuelo(500) === 35 && N.valorSuelo(800) === 20 && Math.abs(N.valorSuelo(650) - 27.5) < 1e-9 && N.valorSuelo(1500) === 0 && N.valorSuelo(5000) === 0 && N.valorSuelo(1150) > 0 && N.valorSuelo(1150) < 20);
      prueba("datos del piloto: Bogotá = 0 km, el resto ordenado de mayor a menor, 24 km en 27 min y el tren llega antes de que acabe la carrera", N.METRO_KM[N.METRO_KM.length - 1].km === 0 && N.METRO_KM.slice(0, -1).every((c, i, a) => i === 0 || a[i - 1].km >= c.km) && N.METRO_DATOS.kmLinea === 24 && N.METRO_DATOS.minMetro === 27 && N.tTrenLlega() > N.TP.carrera.ini && N.tTrenLlega() < N.TP.carrera.ini + N.TP.carrera.dur);
      const rawM = JSON.parse(readFileSync(p("ejemplos", "animacion-viral", "respuesta-ia-metro-bogota.json"), "utf8"));
      const ideaM = N.parsearIdea(readFileSync(p("ejemplos", "animacion-viral", "idea-metro-bogota.txt"), "utf8"), { paleta: "retro" });
      const eM = N.ensamblarViral(rawM, { modo: "idea", paleta: "retro", sfx: true });
      prueba("piloto Metro de Bogotá: la idea es válida, el JSON se ensambla sin correcciones, 12 escenas (9 piezas + 3 PUNCH), válido y ≈ 100 s", ideaM.errores.length === 0 && eM.correcciones.length === 0 && eM.anim.escenas.length === 12 && eM.anim.escenas.filter((e) => e.t === "PIEZA").length === 9 && eM.anim.escenas.filter((e) => e.t === "PUNCH").length === 3 && N.validar(eM.anim).length === 0 && eM.anim.duracion > 90 && eM.anim.duracion < 115, JSON.stringify(eM.correcciones));
      prueba("piloto: cada pieza dura lo que necesita (≥ su ideal), el estudio analítico va sobre papel con la transición «papel» y el resto en oscuro con corte seco", eM.anim.escenas.filter((e) => e.t === "PIEZA").every((e) => e.dur >= N.PIEZAS[e.pieza.id].ideal - 0.01 && e.bg === N.PIEZAS[e.pieza.id].fondo && e.ritmo === 1) && eM.anim.escenas.find((e) => e.pieza?.id === "metro-suelo").tr === "papel" && eM.anim.escenas.find((e) => e.pieza?.id === "metro-curva").bg === "light" && eM.anim.escenas.slice(1).every((e) => e.tr === "corte" || e.tr === "papel"));
      prueba("piloto: SFX y música sincronizados (cada pieza trae efectos dentro de su duración) y la locución lista para grabar con las 12 escenas", eM.anim.escenas.every((e) => (e.sfx ?? []).length > 0 && e.sfx.every((x) => x.t >= 0 && x.t < e.dur)) && eM.locucion.includes("ocho millones de habitantes") && eM.locucion.includes("veintisiete minutos"));
      const eMg = N.ensamblarViral(rawM, { modo: "idea", paleta: "imnoba", sfx: true });
      prueba("PIEZA también funciona con la paleta IMNOBA (se dibuja igual; solo cambian los colores del tema) y sin SFX no trae efectos", eMg.anim.escenas.filter((e) => e.t === "PIEZA").length === 9 && N.validar(eMg.anim).length === 0 && N.ensamblarViral(rawM, { modo: "idea", paleta: "retro", sfx: false }).anim.escenas.every((e) => !e.sfx || e.sfx.length === 0));
      prueba("panel: el botón del piloto existe y el servidor deja pasar --tema=metro-bogota (lista blanca) al cargar el ejemplo", N.MARCAS.imnoba.ejemplos.some((e) => e.tema === "metro-bogota" && e.etiqueta.includes("Piezas a medida") && N.MARCAS.imnoba.paletas.includes(e.paleta)) && /M\.ejemplos\.map/.test(readFileSync(p("scripts", "panel", "web", "app.js"), "utf8")) && /IDS_MARCA\.flatMap/.test(readFileSync(p("scripts", "panel", "servidor.mjs"), "utf8")));
    }

    // ── Ensayo «Anomalía» (v2 abstracto): 10 piezas, cortinilla de semitono, zoom en Z, bucle al primer fotograma ──
    {
      const kitSrc = readFileSync(p("src", "viral", "piezas", "anom-ui.tsx"), "utf8");
      const fuentesAn = ["anom1", "anom2", "anom3", "anom4", "anom5"].map((f) => readFileSync(p("src", "viral", "piezas", `${f}.tsx`), "utf8")).join("\n");
      prueba("Anomalía · paleta del brief: #0D0E12, #F4F1EA, #F04124 (rojo bermellón), #2B38F0 (azul eléctrico) y #D4FF33 (lima ácido) en el kit, y las escenas usan la paleta AN (sin colores sueltos)", ["#0D0E12", "#F4F1EA", "#F04124", "#2B38F0", "#D4FF33"].every((h) => kitSrc.includes(h)) && !/#[0-9a-fA-F]{6}/.test(fuentesAn.replace(/\/\*[\s\S]*?\*\//g, "")));
      prueba("Anomalía · cero ilustración literal: ninguna escena usa iconos, esferas, escenarios ni plantillas de ciudad (solo cápsulas, nodos, vectores, mallas y partículas)", !/IconoSvg|EsferaIcono|FondoEscenario|Ciudad|Skyline|dibujarIcono/.test(fuentesAn) && /export const Capsula/.test(kitSrc) && /export function voronoi/.test(kitSrc) && /export const Odometro/.test(kitSrc) && /export const Knob/.test(kitSrc) && /export const Visor/.test(kitSrc) && /export const Blancos/.test(kitSrc) && /tachado/.test(kitSrc));
      const rawA = JSON.parse(readFileSync(p("ejemplos", "animacion-viral", "respuesta-ia-anomalia.json"), "utf8"));
      const ideaA = N.parsearIdea(readFileSync(p("ejemplos", "animacion-viral", "idea-anomalia.txt"), "utf8"), { paleta: "retro" });
      const eA = N.ensamblarViral(rawA, { modo: "idea", paleta: "retro", sfx: true });
      const ids = eA.anim.escenas.map((e) => e.pieza?.id);
      prueba("Anomalía: la idea es válida, el JSON se ensambla sin correcciones, 10 escenas a medida (disco → … → cierre), válido, 90–100 s y cada voz cabe en su escena", ideaA.errores.length === 0 && eA.correcciones.length === 0 && eA.anim.escenas.length === 10 && ids[0] === "anom-disco" && ids[9] === "anom-cierre" && ids.every((id) => id?.startsWith("anom-")) && N.validar(eA.anim).length === 0 && eA.anim.duracion > 90 && eA.anim.duracion < 100 && eA.anim.escenas.every((e) => e.dur >= e.voz.trim().split(/\s+/).length / 2.95), JSON.stringify(eA.correcciones));
      prueba("Anomalía: alternancia cromática (oscuro para sistemas físicos; papel solo en el suelo y el laboratorio), gancho en los primeros 3 s (la raya tacha «TRÁFICO» antes del 3.er segundo) y ritmo normal en todas", eA.anim.escenas.map((e) => e.bg).join() === "dark,dark,dark,dark,dark,dark,light,light,dark,dark" && N.TA.disco.tacha < 3 && eA.anim.escenas.every((e) => e.ritmo > 0.95));
      prueba("Anomalía: transiciones — cortinilla de semitono (fricción y compresión), zoom continuo en Z hacia la escala, y match-cuts secos en el resto; la primera entra con barrido", eA.anim.escenas[0].tr === "barrido" && eA.anim.escenas[1].tr === "semitono" && eA.anim.escenas[8].tr === "semitono" && eA.anim.escenas[5].tr === "zoom" && [2, 3, 4, 6, 7, 9].every((i) => eA.anim.escenas[i].tr === "corte") && /Semitono/.test(readFileSync(p("src", "anim", "Animacion.tsx"), "utf8")) && /semitono/.test(readFileSync(p("src", "viral", "EscenaViral.tsx"), "utf8")));
      prueba("Anomalía: SFX dentro de cada escena (con golpe al tachar el gancho y ding al resolverse cada «_ _ _ _»), sin SFX si se desactivan", eA.anim.escenas.every((e) => e.sfx.length > 2 && e.sfx.every((x) => x.t >= 0 && x.t < e.dur)) && eA.anim.escenas[0].sfx.some((x) => x.tipo === "golpe" && Math.abs(x.t - N.TA.disco.tacha) < 0.01) && N.ensamblarViral(rawA, { modo: "idea", paleta: "retro", sfx: false }).anim.escenas.every((e) => !e.sfx || e.sfx.length === 0));
      prueba("Anomalía: la locución (guion para grabar) trae el gancho, la tríada y la pregunta final; la fuente de la tarjeta académica es editable por props (no se inventa autor ni año)", eA.locucion.includes("Bogotá no tiene un problema de tráfico") && eA.locucion.includes("Densidad, cruces, semáforos") && eA.locucion.includes("¿qué ciudad va a aparecer?") && eA.anim.escenas[6].pieza.props.fuente === "BID y estudios de desarrollo urbano" && !/anio/.test(JSON.stringify(rawA)) && /props\?\.fuente/.test(readFileSync(p("src", "viral", "piezas", "anom4.tsx"), "utf8")));
      prueba("Anomalía: el panel tiene su botón y el servidor deja pasar --tema=anomalia", N.MARCAS.imnoba.ejemplos.some((e) => e.tema === "anomalia" && e.etiqueta.includes("Anomalía") && N.MARCAS.imnoba.paletas.includes(e.paleta)) && /M\.ejemplos\.map/.test(readFileSync(p("scripts", "panel", "web", "app.js"), "utf8")) && /IDS_MARCA\.flatMap/.test(readFileSync(p("scripts", "panel", "servidor.mjs"), "utf8")));
    }

    // ── «Bogotá, la ciudad sin metro» (v3 · figuras realistas con datos verificados) ──
    {
      const kitR = readFileSync(p("src", "viral", "piezas", "real-kit.tsx"), "utf8");
      const escR = ["real1", "real2", "real3"].map((f) => readFileSync(p("src", "viral", "piezas", `${f}.tsx`), "utf8")).join("\n");
      prueba("Bogotá realista · kit de figuras: estudio con piso y reflejo, bus articulado, tren de metro, auto/taxi, torre, cronómetro, semáforo, persona, monedas, riel y cota; las 11 escenas las usan", ["Estudio", "Reflejo", "BusArticulado", "TrenMetro", "Auto", "Torre", "Cronometro", "Semaforo", "Persona", "Monedas", "Riel", "Cota", "Frases"].every((n) => new RegExp(`export const ${n}\\b`).test(kitR)) && ["BusArticulado", "TrenMetro", "Auto", "Torre", "Cronometro", "Semaforo", "Persona", "Monedas"].every((n) => escR.includes(`<${n}`)) && !/https?:\/\//.test(kitR));
      const rawR = JSON.parse(readFileSync(p("ejemplos", "animacion-viral", "respuesta-ia-bogota-real.json"), "utf8"));
      const ideaR = N.parsearIdea(readFileSync(p("ejemplos", "animacion-viral", "idea-bogota-real.txt"), "utf8"), { paleta: "retro" });
      const eR = N.ensamblarViral(rawR, { modo: "idea", paleta: "retro", sfx: true });
      prueba("Bogotá realista: la idea es válida, el JSON se ensambla sin correcciones, 11 escenas real-* (historia → cierre), válido, 105–118 s y cada voz cabe en su escena", ideaR.errores.length === 0 && eR.correcciones.length === 0 && eR.anim.escenas.length === 11 && eR.anim.escenas[0].pieza.id === "real-historia" && eR.anim.escenas[10].pieza.id === "real-cierre" && eR.anim.escenas.every((e) => e.pieza?.id.startsWith("real-")) && N.validar(eR.anim).length === 0 && eR.anim.duracion > 105 && eR.anim.duracion < 118 && eR.anim.escenas.every((e) => e.dur >= e.voz.trim().split(/\s+/).length / 2.95), JSON.stringify(eR.correcciones));
      prueba("Bogotá realista: cortes secos (la primera entra con barrido), ritmo normal y SFX dentro de cada escena; sin SFX si se desactivan", eR.anim.escenas[0].tr === "barrido" && eR.anim.escenas.slice(1).every((e) => e.tr === "corte") && eR.anim.escenas.every((e) => e.ritmo > 0.95 && e.sfx.length > 2 && e.sfx.every((x) => x.t >= 0 && x.t < e.dur)) && N.ensamblarViral(rawR, { modo: "idea", paleta: "retro", sfx: false }).anim.escenas.every((e) => !e.sfx || e.sfx.length === 0));
      prueba("Bogotá realista · coherencia de los datos: 1 tren = 1.800 ÷ 150 = 12 buses; 191 h ≈ 8 días; 77 años (1942→2019); 33 años (1995→2028); 24 km; km de metro de mayor a menor con Bogotá = 0; Quito 23", N.BOG.pasTren / N.BOG.pasBusTM === 12 && Math.round(N.BOG.horasInrix2019 / 24) === 8 && N.BOG.anioAdjudicacion - N.BOG.anioEstudio === 77 && N.BOG.anioApertura - N.BOG.anioMedellin === 33 && N.BOG.km === 24 && N.BOG.estaciones === 16 && N.REDES_KM[N.REDES_KM.length - 1].km === 0 && N.REDES_KM.slice(0, -1).every((c, i, a) => i === 0 || a[i - 1].km >= c.km) && N.REDES_KM.find((c) => c.ciudad === "Quito").km === 23 && N.BOG.plusvalia800 === 11.7 && N.BOG.rentaMin === 6.8 && N.BOG.rentaMax === 9.3);
      const gt = readFileSync(p("ejemplos", "animacion-viral", "guion-tecnico-bogota-real.md"), "utf8");
      prueba("Bogotá realista · cada dato lleva su fuente: el guion técnico cita INRIX, Universidad Javeriana, Empresa Metro de Bogotá, Rodríguez y Targa (Transport Reviews), Noticias RCN y las precauciones antes de publicar; la locución trae el gancho, el 191 y la pregunta final", ["INRIX", "Javeriana", "Empresa Metro de Bogotá", "Rodríguez y Targa", "Transport Reviews", "Noticias RCN", "Precauciones antes de publicar"].every((x) => gt.includes(x)) && eR.locucion.includes("setenta y siete años esperando un metro") && eR.locucion.includes("ciento noventa y un horas") && eR.locucion.includes("¿Cuánto vale una hora de tu vida"));
      prueba("QA de la previa: atrapa los errores de la consola del navegador (p. ej. «<rect> attribute height: A negative value is not valid») y las torres bajas del kit realista ya no generan alturas negativas", /erroresConsola/.test(readFileSync(p("scripts", "anim", "previa.mjs"), "utf8")) && /consola · error del navegador/.test(readFileSync(p("scripts", "anim", "previa.mjs"), "utf8")) && /Math\.max\(1, \(h - 14\) \/ fil - 5\)/.test(kitR));
      prueba("Bogotá realista: el panel tiene su botón y el servidor deja pasar --tema=bogota-real", N.MARCAS.imnoba.ejemplos.some((e) => e.tema === "bogota-real" && e.etiqueta.includes("Bogotá, la ciudad sin metro") && N.MARCAS.imnoba.paletas.includes(e.paleta)) && /M\.ejemplos\.map/.test(readFileSync(p("scripts", "panel", "web", "app.js"), "utf8")) && /IDS_MARCA\.flatMap/.test(readFileSync(p("scripts", "panel", "servidor.mjs"), "utf8")));
    }

    // ── «Médicos que se probaron a sí mismos» (v4 · figuras médicas realistas con datos verificados) ──
    {
      const kitM = readFileSync(p("src", "viral", "piezas", "med-kit.tsx"), "utf8");
      const escM = ["med1", "med2", "med3"].map((f) => readFileSync(p("src", "viral", "piezas", `${f}.tsx`), "utf8")).join("\n");
      prueba("Médico · kit de figuras: radiografía con sonda, estómago con úlcera, bacteria helicoidal, vaso, medalla Nobel, endoscopia, cápsula, bisturí, pinzas, jeringa, espejo, lámpara y base polar; las 12 escenas las usan", ["Radiografia", "Estomago", "Bacteria", "CampoBacterias", "Vaso", "Medalla", "Endoscopia", "Capsula", "Bisturi", "Pinzas", "Jeringa", "Espejo", "Lampara", "Polar"].every((n) => new RegExp(`export const ${n}\\b`).test(kitM) && (n === "Bacteria" || new RegExp(`\\b${n}\\b`).test(escM))));
      const rawM = JSON.parse(readFileSync(p("ejemplos", "animacion-viral", "respuesta-ia-medicos-experimento.json"), "utf8"));
      const ideaM = N.parsearIdea(readFileSync(p("ejemplos", "animacion-viral", "idea-medicos-experimento.txt"), "utf8"), { paleta: "retro" });
      const eM = N.ensamblarViral(rawM, { modo: "idea", paleta: "retro", sfx: true });
      const durM = eM.anim.escenas.reduce((a, x) => a + x.dur, 0);
      prueba("Médico: la idea es válida, el JSON se ensambla sin correcciones, 12 escenas med-* (gancho → cierre), válido, 115–128 s y cada voz cabe en su escena", ideaM.errores.length === 0 && eM.correcciones.length === 0 && eM.anim.escenas.length === 12 && eM.anim.escenas[0].pieza.id === "med-gancho" && eM.anim.escenas[11].pieza.id === "med-cierre" && eM.anim.escenas.every((e) => e.t === "PIEZA" && N.piezaPorId(e.pieza.id) && e.voz.split(/\s+/).length / 2.9 + 0.5 <= e.dur + 0.01) && durM >= 115 && durM <= 128, `${durM} s · ${eM.correcciones.join(" | ")}`);
      prueba("Médico: cortes secos (la primera entra con barrido), ritmo normal y SFX dentro de cada escena; sin SFX si se desactivan", eM.anim.escenas[0].tr === "barrido" && eM.anim.escenas.slice(1).every((e) => e.tr === "corte") && eM.anim.escenas.every((e) => e.ritmo > 0.93 && e.ritmo < 1.07 && e.sfx.length > 2 && e.sfx.every((x) => x.t >= 0 && x.t < e.dur)) && N.ensamblarViral(rawM, { modo: "idea", paleta: "retro", sfx: false }).anim.escenas.every((e) => !e.sfx || e.sfx.length === 0), eM.anim.escenas.map((e) => e.ritmo.toFixed(2)).join(" "));
      prueba("Médico · coherencia de los datos: Forssmann 1929 → Nobel 1956; Marshall 1984 → Nobel 2005; Rogozov 1961 con 105 min; prevalencia 44,3 % (meta-análisis); el video no afirma la longitud del catéter, la dosis del caldo ni el día de los síntomas", N.MED.forssmann.anio === 1929 && N.MED.forssmann.nobel === 1956 && N.MED.marshall.anio === 1984 && N.MED.marshall.nobel === 2005 && N.MED.rogozov.anio === 1961 && N.MED.rogozov.minutos === 105 && N.MED.pylori.prevalencia === 44.3 && !/65 ?cm|centímetros|UFC|10\^9|10⁹/i.test(JSON.stringify(rawM) + escM));
      const gtM = readFileSync(p("ejemplos", "animacion-viral", "guion-tecnico-medicos-experimento.md"), "utf8");
      const locM = readFileSync(p("ejemplos", "animacion-viral", "locucion-medicos-experimento.txt"), "utf8");
      prueba("Médico · cada dato lleva su fuente: el guion técnico cita NobelPrize.org, el BMJ de Rogozov y Bermel, Marshall (Med J Aust 1985) y Zamani (Aliment Pharmacol Ther) con sus precauciones; la locución trae el gancho, la ética y la pregunta final", ["NobelPrize.org", "Rogozov y Bermel", "BMJ 2009", "Med J Aust", "Zamani", "Precauciones antes de publicar", "65 cm", "Ética"].every((k) => gtM.includes(k)) && locM.includes("Tres médicos usaron su propio cuerpo") && locM.includes("No lo imites") && locM.includes("¿hasta dónde llegarías por una idea?") && eM.anim.escenas.every((e) => locM.includes(e.voz)));
      prueba("Médico · el cierre avisa «NO LO IMITES» y las escenas polares tienen velo de texto; cada escena muestra su fuente (Fuente) salvo el cierre", /NO LO IMITES/.test(escM) && /VeloTexto/.test(escM) && (escM.match(/<Fuente /g) ?? []).length >= 10);
      prueba("Médico: el panel tiene su botón y el servidor deja pasar --tema=medicos-experimento", N.MARCAS.sinapsis.ejemplos.some((e) => e.tema === "medicos-experimento" && e.etiqueta.includes("Médicos que se probaron a sí mismos") && N.MARCAS.sinapsis.paletas.includes(e.paleta)) && /M\.ejemplos\.map/.test(readFileSync(p("scripts", "panel", "web", "app.js"), "utf8")) && /IDS_MARCA\.flatMap/.test(readFileSync(p("scripts", "panel", "servidor.mjs"), "utf8")) && /medicos-experimento/.test(readFileSync(p("scripts", "anim", "ejemplo.mjs"), "utf8")));
    }

    // ── «El pegamento que no era pegamento» (astrocitos · SINAPSIS) y «El truco de los préstamos DSCR» (IMNOBA): videos hechos con /video ──
    {
      const leer = (f) => readFileSync(p("ejemplos", "animacion-viral", f), "utf8");
      const mini = (j, paleta) => N.ensamblarViral(JSON.parse(leer(j)), { modo: "idea", paleta, sfx: true });
      const eA = mini("respuesta-ia-astrocitos.json", "medicina");
      const eD = mini("respuesta-ia-dscr.json", "imnoba");
      const durA = eA.anim.escenas.reduce((a, x) => a + x.dur, 0), durD = eD.anim.escenas.reduce((a, x) => a + x.dur, 0);
      prueba("Astrocitos: la idea y el JSON se ensamblan sin correcciones (6 piezas astro-* + cierre + CTA), 33–36 s y cada voz cabe en su escena; sin deriva de cámara en las piezas", N.parsearIdea(leer("idea-astrocitos.txt"), { paleta: "medicina" }).errores.length === 0 && eA.correcciones.length === 0 && eA.anim.escenas.length === 8 && eA.anim.escenas.slice(0, 6).every((e, i) => e.t === "PIEZA" && e.pieza.id === ["astro-gancho", "astro-glia", "astro-mitad", "astro-estrella", "astro-dialogo", "astro-memoria"][i]) && eA.anim.escenas[7].t === "CTA" && eA.anim.escenas.every((e) => e.voz.split(/\s+/).length / 2.9 + 0.5 <= e.dur + 0.01) && durA >= 33 && durA <= 36 && /startsWith\("astro-"\)/.test(readFileSync(p("src", "viral", "EscenaViral.tsx"), "utf8")), `${durA} s · ${eA.correcciones.join(" | ")}`);
      prueba("Astrocitos · datos con fuente: 86,1 y 84,6 mil millones (Azevedo 2009 → ≈ 50 % no neuronas), 270.000–2.000.000 sinapsis (Oberheim 2009) y 1856 (Virchow); no afirma que «controlen» la memoria ni usa cifras en personas para el estudio de ratones", N.AST.neuronas === 86_100_000_000 && N.AST.noNeuronales === 84_600_000_000 && Math.abs(N.AST.noNeuronales / (N.AST.neuronas + N.AST.noNeuronales) - 0.495) < 0.005 && N.AST.sinapsisMin === 270_000 && N.AST.sinapsisMax === 2_000_000 && N.AST.anioGlia === 1856 && !/controlan|los jefes/i.test(leer("respuesta-ia-astrocitos.json")) && /en ratones/i.test(leer("respuesta-ia-astrocitos.json")));
      const gtA = leer("guion-tecnico-astrocitos.md"), locA = leer("locucion-astrocitos.txt");
      prueba("Astrocitos · el guion técnico cita Azevedo, Oberheim, Williamson (Nature 2025), Virchow y Araque con sus precauciones; la locución trae todas las voces", ["Azevedo", "Oberheim", "Williamson", "Virchow", "Araque", "Precauciones antes de publicar"].every((k) => gtA.includes(k)) && eA.anim.escenas.every((e) => locA.includes(e.voz)));
      prueba("DSCR: la idea y el JSON se ensamblan sin correcciones (5 piezas dscr-* + gancho de cierre + CTA con la URL), 32–36 s, cada voz cabe en su escena y la marca es IMNOBA", N.parsearIdea(leer("idea-dscr.txt"), { paleta: "imnoba" }).errores.length === 0 && eD.correcciones.length === 0 && eD.anim.escenas.length === 7 && eD.anim.escenas.slice(0, 5).every((e, i) => e.t === "PIEZA" && e.pieza.id === ["dscr-gancho", "dscr-hack", "dscr-docs", "dscr-split", "dscr-catalogo"][i]) && eD.anim.escenas[6].t === "CTA" && /imnoba\.com\/usa/.test(JSON.stringify(eD.anim.escenas[6])) && eD.anim.escenas.every((e) => e.voz.split(/\s+/).length / 2.9 + 0.5 <= e.dur + 0.01) && durD >= 32 && durD <= 36 && N.marcaDePaleta("imnoba").id === "imnoba", `${durD} s · ${eD.correcciones.join(" | ")}`);
      const jD = leer("respuesta-ia-dscr.json"), gtD = leer("guion-tecnico-dscr.md"), locD = leer("locucion-dscr.txt");
      prueba("DSCR · honestidad: dice que sí hay pago inicial (≈ 30 %, banco hasta 70 %), que piden pasaporte, prueba de fondos y reservas; menciona imnoba.com/usa y el equipo en Florida; no promete rentabilidad ni aprobación", N.DSC.banco === 70 && N.DSC.inicial === 30 && /setenta por ciento/.test(jD) && /cerca del treinta/.test(jD) && /imnoba punto com barra usa/.test(jD) && /equipo en Florida/.test(jD) && !/rentabilidad|ganancia|garantiz|sin pago inicial|sin requisitos/i.test(jD) && ["pasaporte", "prueba de fondos", "reservas"].every((k) => readFileSync(p("src", "viral", "piezas", "dscr1.tsx"), "utf8").includes(k)));
      prueba("DSCR · el guion técnico cita las fuentes y trae las precauciones (no es asesoría, 25–30 %, tasas sin verificar, catálogo genérico); la locución trae todas las voces", ["HomeAbroad", "AD Mortgage", "Precauciones antes de publicar", "asesoría", "25–30 %", "Tasas"].every((k) => gtD.includes(k)) && eD.anim.escenas.every((e) => locD.includes(e.voz)));
    }

    // ── «Los 4 tejidos que te construyen» (SINAPSIS): video hecho con /video ──
    {
      const leerT = (f) => readFileSync(p("ejemplos", "animacion-viral", f), "utf8");
      const rawT = JSON.parse(leerT("respuesta-ia-tejidos.json"));
      const eT = N.ensamblarViral(rawT, { modo: "idea", paleta: "medicina", sfx: true });
      const durT = eT.anim.escenas.reduce((a, x) => a + x.dur, 0);
      const ids = ["tej-gancho", "tej-epitelial", "tej-sangre", "tej-hueso", "tej-muscular", "tej-nervioso"];
      prueba("4 tejidos: la idea y el JSON se ensamblan sin correcciones (6 piezas tej-* en orden gancho → nervioso + CTA), 34–36 s, cada voz cabe en su escena y los tejidos entran con transiciones distintas", N.parsearIdea(leerT("idea-tejidos.txt"), { paleta: "medicina" }).errores.length === 0 && eT.correcciones.length === 0 && eT.anim.escenas.length === 7 && eT.anim.escenas.slice(0, 6).every((e, i) => e.t === "PIEZA" && e.pieza.id === ids[i]) && eT.anim.escenas[6].t === "CTA" && eT.anim.escenas.every((e) => e.voz.split(/\s+/).length / 2.9 + 0.5 <= e.dur + 0.01) && durT >= 34 && durT <= 36 && new Set(ids.slice(1).map((id) => N.PIEZAS[id].entra)).size === 3, `${durT} s · ${eT.correcciones.join(" | ")}`);
      const jT = JSON.stringify(rawT);
      prueba("4 tejidos · datos y matices: epitelio 3–5 días, pH 1,5–3,5, pico en la aorta (el video dice «más de 2 km/h»), hueso ≈ 10 años, glóbulo rojo 120 días; NO dice «disuelve metal», «persona nueva» ni «todas las neuronas»; el corazón va «con oxígeno»", N.TEJ.epitelioDias[0] === 3 && N.TEJ.epitelioDias[1] === 5 && N.TEJ.phGastrico[0] === 1.5 && N.TEJ.phGastrico[1] === 3.5 && N.TEJ.sangreKmhMin === 2 && N.TEJ.huesoAnios === 10 && N.TEJ.globuloRojoDias === 120 && /corroe metales/.test(jT) && !/disuelve|persona nueva|todas las neuronas/i.test(jT) && /con oxígeno/.test(jT) && /la mayoría de tus neuronas/.test(jT));
      const gtT = leerT("guion-tecnico-tejidos.md"), locT = leerT("locucion-tejidos.txt");
      prueba("4 tejidos · el guion técnico cita Sender y Milo, Spalding, Africa Check y Langendorff con sus precauciones (ácido, 2 km/h pico, huesos, corazón, neuronas); la locución trae todas las voces", ["Sender", "Spalding", "Africa Check", "Langendorff", "Precauciones antes de publicar", "pico", "ersona nueva"].every((k) => gtT.includes(k)) && eT.anim.escenas.every((e) => locT.includes(e.voz)));
    }

    // ── «Los dueños del cerebro» (SINAPSIS · astrocitos y el cerebro de Einstein): video hecho con /video ──
    {
      const leerE = (f) => readFileSync(p("ejemplos", "animacion-viral", f), "utf8");
      const rawE = JSON.parse(leerE("respuesta-ia-astrocitos-einstein.json"));
      const eE = N.ensamblarViral(rawE, { modo: "idea", paleta: "medicina", sfx: true });
      const durE = eE.anim.escenas.reduce((a, x) => a + x.dur, 0);
      const idsE = ["ein-gancho", "ein-barrera", "ein-tripartita", "ein-esculpe", "ein-diamond", "ein-hallazgo", "ein-cautela", "ein-gfap"];
      prueba("Einstein: la idea y el JSON se ensamblan (8 piezas ein-* en orden gancho → gfap + CTA), 43–46 s y cada voz cabe en su escena", N.parsearIdea(leerE("idea-astrocitos-einstein.txt"), { paleta: "medicina" }).errores.length === 0 && eE.anim.escenas.length === 9 && eE.anim.escenas.slice(0, 8).every((e, i) => e.t === "PIEZA" && e.pieza.id === idsE[i]) && eE.anim.escenas[8].t === "CTA" && eE.anim.escenas.every((e) => e.voz.split(/\s+/).length / 2.9 + 0.5 <= e.dur + 0.01) && durE >= 43 && durE <= 46, `${durE} s · ${eE.correcciones.join(" | ")}`);
      const jE = JSON.stringify(rawE);
      prueba("Einstein · rigor: 11 controles, 4 áreas, 1 significativa (p < 0,05), Diamond 1985 y Chung 2013; el video dice «células gliales por cada neurona» y «una pista, no una prueba»; NO afirma «más astrocitos», «forman la barrera» ni «cerebro más grande»", N.EIN.controles === 11 && N.EIN.areasEstudiadas === 4 && N.EIN.areasSignificativas === 1 && N.EIN.pMax === 0.05 && N.EIN.diamondAnio === 1985 && N.EIN.chungAnio === 2013 && /gliales por cada neurona/.test(jE) && /una pista, no una prueba/i.test(jE) && /ayudan a mantener/.test(jE) && !/más astrocitos|tenía más neuronas|cerebro más grande|forman la barrera|deciden qué entra/i.test(jE));
      const gtE = leerE("guion-tecnico-astrocitos-einstein.md"), locE = leerE("locucion-astrocitos-einstein.txt");
      prueba("Einstein · el guion técnico cita Diamond, Hines, Colombo, Chung y Araque con sus precauciones (glía ≠ astrocitos, 1 de 4 áreas, endotelio, color falso); la locución trae todas las voces", ["Diamond", "Hines", "Colombo", "Chung", "Araque", "Precauciones antes de publicar", "endotelio", "color falso", "1 de 4"].every((k) => gtE.includes(k)) && eE.anim.escenas.every((e) => locE.includes(e.voz)));
    }

    // ── «El efecto del dígito izquierdo» (SINAPSIS · neuroeconomía): video hecho con /video ──
    {
      const leerG = (f) => readFileSync(p("ejemplos", "animacion-viral", f), "utf8");
      const rawG = JSON.parse(leerG("respuesta-ia-digito-izquierdo.json"));
      const eG = N.ensamblarViral(rawG, { modo: "idea", paleta: "medicina", sfx: true });
      const durG = eG.anim.escenas.reduce((a, x) => a + x.dur, 0);
      const idsG = ["dig-gancho", "dig-lectura", "dig-abismo", "dig-autos", "dig-thomas", "dig-escala", "dig-ojo"];
      prueba("Dígito izquierdo: la idea y el JSON se ensamblan sin correcciones (7 piezas dig-* en orden gancho → ojo + CTA), 44–46 s y cada voz cabe en su escena", N.parsearIdea(leerG("idea-digito-izquierdo.txt"), { paleta: "medicina" }).errores.length === 0 && eG.correcciones.length === 0 && eG.anim.escenas.length === 8 && eG.anim.escenas.slice(0, 7).every((e, i) => e.t === "PIEZA" && e.pieza.id === idsG[i]) && eG.anim.escenas[7].t === "CTA" && eG.anim.escenas.every((e) => e.voz.split(/\s+/).length / 2.9 + 0.5 <= e.dur + 0.01) && durG >= 44 && durG <= 46, `${durG} s · ${eG.correcciones.join(" | ")}`);
      const jG = JSON.stringify(rawG);
      prueba("Dígito izquierdo · rigor: Thomas y Morwitz 2005 (5 experimentos), Lacetera 2012 (> 22 millones, ≈ US$ 150–200 por umbral de 10.000 millas), Strulov-Shlain (25 cadenas, > 20 centavos, 1–4 %) y Laurent 2023; la voz NO dice «200 milisegundos», «límbico», «dispara las ventas», «imposible de apagar» ni «decide la compra»", N.DIG.thomasAnio === 2005 && N.DIG.thomasExperimentos === 5 && N.DIG.autosVentas === 22_000_000 && N.DIG.autosSaltoMin === 150 && N.DIG.autosSaltoMax === 200 && N.DIG.autosUmbralMillas === 10_000 && N.DIG.escalaCadenas === 25 && N.DIG.escalaCentavos === 20 && N.DIG.escalaPerdidaMin === 1 && N.DIG.escalaPerdidaMax === 4 && N.DIG.laurentAnio === 2023 && /Thomas y Morwitz/.test(jG) && /seguimiento ocular/.test(jG) && !/200 milisegundos|l[ií]mbico|dispara|imposible de apagar|decide la compra/i.test(jG));
      const gtG = leerG("guion-tecnico-digito-izquierdo.md"), locG = leerG("locucion-digito-izquierdo.txt");
      prueba("Dígito izquierdo · el guion técnico cita Thomas y Morwitz, Lacetera, Strulov-Shlain, Laurent y Hodges con sus precauciones (200 ms, eye-tracking del pedido, ventas vs percepción, pares de precios sin verificar, analogía, esquemas); la locución trae todas las voces", ["Thomas", "Lacetera", "Strulov-Shlain", "Laurent", "Hodges", "Precauciones antes de publicar", "200 milisegundos", "No pude leer el artículo completo", "analogía visual", "esquema"].every((k) => gtG.includes(k)) && eG.anim.escenas.every((e) => locG.includes(e.voz)));
    }

    // ── Panel de Videos · los videos de la carpeta videos/ viajan por git y aparecen solos en el panel ──
    {
      const V = await import("../panel/videos.mjs");
      const vid = join(DIR_PRUEBA, "videos-prueba");
      process.env.VIDEMED_VIDEOS = vid;
      mkdirSync(join(vid, "2026-01-01-uno"), { recursive: true });
      mkdirSync(join(vid, "2026-01-02-dos"), { recursive: true });
      mkdirSync(join(vid, "sin-registro"), { recursive: true });
      writeFileSync(join(vid, "2026-01-01-uno", "registro.json"), JSON.stringify({ version: 1, slug: "2026-01-01-uno", titulo: "Video de prueba uno", serie: "anatomia", estado: "grabado", guion: "Primera frase.\nSegunda frase.", gancho: "Primera frase.", duracion_seg: 12.5, notas: "nota uno", origen_clave: "clavepruebauno", video: "revision.mp4", miniatura: "miniatura.jpg" }));
      writeFileSync(join(vid, "2026-01-01-uno", "revision.mp4"), Buffer.alloc(4000, 1));
      writeFileSync(join(vid, "2026-01-01-uno", "miniatura.jpg"), Buffer.alloc(500, 2));
      writeFileSync(join(vid, "2026-01-02-dos", "registro.json"), JSON.stringify({ version: 1, titulo: "Video de prueba dos", serie: "secretos_usa", estado: "grabado", guion: "Hola.", origen_clave: "clavepruebados" }));
      writeFileSync(join(vid, "sin-registro", "notas.txt"), "no es un video");
      const r1 = await V.sincronizarCarpetaVideos();
      const b1 = (await V.leerBase()).videos;
      const u1 = b1.find((v) => v.titulo === "Video de prueba uno"), d1 = b1.find((v) => v.titulo === "Video de prueba dos");
      prueba("videos/ → panel: la sincronización trae los videos que tienen registro.json (los demás se ignoran) como «grabado», origen «carpeta», con su serie, guion, notas, copia del video y miniatura", r1.total === 2 && r1.nuevos === 2 && Boolean(u1) && Boolean(d1) && u1.estado === "grabado" && u1.origen === "carpeta" && u1.serie === "anatomia" && d1.serie === "secretos_usa" && u1.guion.split("\n").length === 2 && u1.duracion_seg === 12.5 && u1.notas === "nota uno" && u1.ruta_archivo === `data/media/${u1.id}.mp4` && existsSync(V.dirMedia(`${u1.id}.mp4`)) && u1.ruta_miniatura === `data/media/${u1.id}.jpg` && existsSync(V.dirMedia(`${u1.id}.jpg`)) && !d1.ruta_archivo, JSON.stringify(r1));
      await V.cambiarEstado(u1.id, "publicado");
      await V.agregarMetrica(u1.id, { vistas: 1000, guardados: 50, plataforma: "instagram" });
      const r2 = await V.sincronizarCarpetaVideos();
      const b2 = (await V.leerBase()).videos;
      const u2 = b2.find((v) => v.id === u1.id);
      prueba("videos/ → panel: repetir la sincronización no duplica nada y NUNCA pisa el estado, las publicaciones ni las métricas que ya tenía el video", r2.nuevos === 0 && b2.length === 2 && u2.estado === "publicado" && u2.metricas.length === 1 && u2.metricas[0].vistas === 1000, JSON.stringify(r2));
      await V.eliminarVideo(d1.id);
      await V.guardarVideo({ titulo: "Local dos", origen: "generador", origen_clave: "clavepruebados", estado: "grabado" });
      const r3 = await V.sincronizarCarpetaVideos();
      const b3 = (await V.leerBase()).videos;
      prueba("videos/ → panel: si el video ya está en el panel con la misma clave (p. ej. lo renderizaste en tu computador) no se crea un duplicado desde la carpeta", r3.nuevos === 0 && b3.length === 2 && b3.some((v) => v.titulo === "Local dos") && !b3.some((v) => v.titulo === "Video de prueba dos"), JSON.stringify(r3));
      let errCarpeta = "";
      try { await V.exportarRegistroCarpeta({ carpeta: "../fuera", titulo: "x" }); } catch (e) { errCarpeta = e.message; }
      prueba("videos/ → panel: exportar el registro solo funciona dentro de videos/ y pide registrar el video antes", /dentro de videos/.test(errCarpeta));
      const Nn = await cargarNucleoAnim();
      prueba("panel de videos: hay series para «Secretos de inversión en USA» y «Anatomía humana», el origen «carpeta» es válido y la receta (REGLAS) explica --carpeta", Nn.SERIES.includes("secretos_usa") && Nn.SERIES.includes("anatomia") && Nn.normalizarVideo({ titulo: "x", origen: "carpeta" }).origen === "carpeta" && /--carpeta=videos/.test(readFileSync(p("REGLAS_DE_VIDEO.md"), "utf8")) && /Listos para publicar/.test(readFileSync(p("scripts", "panel", "web", "videos.js"), "utf8")));
      process.env.VIDEMED_VIDEOS = join(DIR_PRUEBA, "videos-vacia");
    }

    // ── «La regla del 37 %» (parada óptima · video «¿sabías que?» de IMNOBA con figuras realistas) ──
    {
      const pr = (n, k) => N.probParada(n, k);
      prueba("Regla del 37 % · matemática exacta: con 100 opciones el máximo está en rechazar 37 y vale 37,1 %; elegir la primera o esperar al final = 1 %; n = 10 → 3 (39,9 %), n = 20 → 7 (38,4 %); tiende a 1/e", N.kOptimo(100) === 37 && Math.abs(pr(100, 37) - 0.3710428) < 1e-6 && Array.from({ length: 100 }, (_, k) => pr(100, k)).every((x) => x <= pr(100, 37) + 1e-12) && pr(100, 0) === 0.01 && Math.abs(pr(100, 99) - 0.01) < 1e-12 && N.kOptimo(10) === 3 && N.kOptimo(20) === 7 && Math.abs(pr(10, 3) - 0.39869) < 1e-4 && Math.abs(pr(20, 7) - 0.38421) < 1e-4 && Math.abs(pr(2000, N.kOptimo(2000)) - 1 / Math.E) < 2e-3 && Math.abs(N.kOptimo(2000) / 2000 - 1 / Math.E) < 2e-3);
      const o3 = N.enumerarOrdenes(3, 1);
      prueba("Regla del 37 % · la demostración con 3 casas es exacta: 6 órdenes, la regla (rechaza 1) acierta en 3 = 50 % (coincide con probParada(3,1)); con 4 casas acierta 11 de 24; con k = 0 elegir la primera acierta 1 de n", o3.length === 6 && o3.filter((x) => x.acierta).length === 3 && Math.abs(pr(3, 1) - 0.5) < 1e-12 && o3.every((x) => [...x.orden].sort().join() === "1,2,3") && N.enumerarOrdenes(4, 1).filter((x) => x.acierta).length === 11 && Math.abs(pr(4, 1) - 11 / 24) < 1e-12 && N.enumerarOrdenes(4, 0).filter((x) => x.acierta).length === 6);
      const sm1 = N.simularParada(100, 37, 10000, 2024), sm2 = N.simularParada(100, 37, 10000, 2024);
      prueba("Regla del 37 % · la simulación (10.000 intentos, semilla fija) es determinista, cae a menos de 1,5 puntos de la teoría y la regla supera 30 veces a elegir a ciegas", sm1.aciertos === sm2.aciertos && sm1.acum.length === 101 && sm1.acum[100] === sm1.aciertos && sm1.primeros.length === 100 && Math.abs(sm1.aciertos / 100 - 37.1) < 1.5 && sm1.aciertos / 10000 > 30 * 0.01, String(sm1.aciertos));
      const sR = N.secRegla();
      prueba("Regla del 37 % · la fila de la escena «100 casas» es una permutación de 1…100 y cuenta lo que dice la pantalla: el mejor de las 37 primeras vale 88 (casa 29) y la primera que lo supera es la mejor, la 61.ª", [...sR].sort((a, b) => a - b).every((v, i) => v === i + 1) && N.aplicarRegla(sR, 37) === 60 && sR[60] === 100 && sR[28] === 88 && Math.max(...sR.slice(0, 37)) === 88 && sR.slice(37, 60).every((v) => v < 88) && N.PAR.kepler.candidatas / Math.E > 4 && N.PAR.kepler.candidatas / Math.E < 4.1 && Math.round(N.PAR.plazo * 0.37) === 33);
      const rawP = JSON.parse(readFileSync(p("ejemplos", "animacion-viral", "respuesta-ia-parada-optima.json"), "utf8"));
      const ideaP = N.parsearIdea(readFileSync(p("ejemplos", "animacion-viral", "idea-parada-optima.txt"), "utf8"), { paleta: "retro-imnoba" });
      const eP = N.ensamblarViral(rawP, { modo: "idea", paleta: "retro-imnoba", sfx: true });
      const durP = eP.anim.escenas.reduce((a, x) => a + x.dur, 0);
      prueba("Regla del 37 %: la idea es válida, el JSON se ensambla sin correcciones (8 piezas par-* + cierre CTA con el logo de IMNOBA), válido, 90–105 s, ritmo normal y cada voz cabe en su escena", ideaP.errores.length === 0 && eP.correcciones.length === 0 && eP.anim.escenas.length === 9 && eP.anim.escenas.slice(0, 8).map((e) => e.pieza.id).join() === "par-gancho,par-kepler,par-n3,par-regla,par-curva,par-simula,par-aplica,par-supuestos" && eP.anim.escenas[8].t === "CTA" && eP.anim.escenas[8].sub === "imnoba.com" && N.validar(eP.anim).length === 0 && durP >= 90 && durP <= 105 && eP.anim.escenas.every((e) => e.ritmo > 0.99 && e.voz.split(/\s+/).length / 2.9 + 0.5 <= e.dur + 0.01 && e.sfx.length > 2 && e.sfx.every((x) => x.t >= 0 && x.t < e.dur)), `${durP} s · ${eP.correcciones.join(" | ")}`);
      prueba("Regla del 37 % · es de IMNOBA y honesto: figura en su ficha con paleta retro-imnoba, no nombra a SINAPSIS, el cierre dice «método» (nunca «certeza»), el tema «casa o pareja» está en la idea y la escena de supuestos avisa que es un modelo", N.marcaDeTema("parada-optima").id === "imnoba" && N.paletaDeTema("parada-optima") === "retro-imnoba" && !/SINAPSIS/i.test(JSON.stringify(rawP)) && !/certeza/i.test(JSON.stringify(rawP)) && /método/.test(eP.anim.escenas[8].voz) && /IMNOBA/.test(eP.anim.escenas[8].voz) && /pareja/.test(readFileSync(p("ejemplos", "animacion-viral", "idea-parada-optima.txt"), "utf8")) && /es un modelo/.test(eP.anim.escenas[7].voz) && /orden al azar/.test(eP.anim.escenas[7].voz));
      const gtP = readFileSync(p("ejemplos", "animacion-viral", "guion-tecnico-parada-optima.md"), "utf8"), locP = readFileSync(p("ejemplos", "animacion-viral", "locucion-parada-optima.txt"), "utf8");
      prueba("Regla del 37 % · fuentes y precauciones: el guion técnico cita a Ferguson (1989) para Kepler, a Gilbert y Mosteller (JASA 1966), advierte que los detalles de Kepler varían, que es un modelo y no una garantía, que la versión por tiempo es una aproximación y la semilla de la simulación; la locución trae el gancho, Kepler, la regla y el cierre en IMNOBA", ["Ferguson", "Statistical Science", "Gilbert", "Mosteller", "JASA", "Precauciones antes de publicar", "detalles cambian según la fuente", "no una garantía", "aproximación", "semilla", "asesoría"].every((k) => gtP.includes(k)) && eP.anim.escenas.every((e) => locP.includes(e.voz)) && /Kepler/.test(locP) && /treinta y siete por ciento/.test(locP));
      const kitP = readFileSync(p("src", "viral", "piezas", "par-kit.tsx"), "utf8"), escP = ["par1", "par2"].map((f) => readFileSync(p("src", "viral", "piezas", `${f}.tsx`), "utf8")).join("\n");
      prueba("Regla del 37 % · figuras realistas: el kit tiene casa (con estados rechazada/elegida/vendida), mini casa, candidata, dado, señal de sentido único, copa y cartel; las 8 escenas usan el estudio azul marino con piso y reflejo y las figuras (nada abstracto de «Anomalía»)", ["Casa", "MiniCasa", "Candidata", "Dado", "SenalUnica", "Copa", "Cartel"].every((n) => new RegExp(`export const ${n}\\b`).test(kitP)) && /vendida/.test(kitP) && /rechazada/.test(kitP) && /elegida/.test(kitP) && ["ParGancho", "ParKepler", "ParN3", "ParRegla", "ParCurva", "ParSimula", "ParAplica", "ParSupuestos"].every((n) => new RegExp(`export const ${n}\\b`).test(escP)) && (escP.match(/<Estudio /g) ?? []).length === 8 && ["Casa", "MiniCasa", "Candidata", "Dado", "SenalUnica", "Copa", "Cartel", "Persona"].every((n) => new RegExp(`\\b${n}\\b`).test(escP)) && !/\bAN\./.test(escP + kitP) && !existsSync(p("src", "viral", "piezas", "par-ui.tsx")));
    }

    // ── Marcas: IMNOBA (inmobiliario y vehículos) y SINAPSIS (medicina y ciencia) están separadas en todo el panel y el motor ──
    {
      const MI = N.MARCAS.imnoba, MS = N.MARCAS.sinapsis;
      prueba("marcas: hay dos (IMNOBA y SINAPSIS), cada paleta del motor pertenece a UNA sola marca y la de cada ejemplo es de su marca", N.IDS_MARCA.join() === "imnoba,sinapsis" && Object.keys(N.PALETAS).every((id) => N.IDS_MARCA.filter((m) => N.MARCAS[m].paletas.includes(id)).length === 1) && N.IDS_MARCA.every((m) => N.MARCAS[m].paletas.includes(N.MARCAS[m].paletaPorDefecto) && N.MARCAS[m].ejemplos.every((e) => N.MARCAS[m].paletas.includes(e.paleta))));
      prueba("marcas: la marca sale de la paleta (imnoba y retro-imnoba = IMNOBA; medicina y retro = SINAPSIS), del perfil del modo clásico y del tema del ejemplo; una paleta ajena se corrige", N.marcaDePaleta("imnoba").id === "imnoba" && N.marcaDePaleta("retro-imnoba").id === "imnoba" && N.marcaDePaleta("medicina").id === "sinapsis" && N.marcaDePaleta("retro").id === "sinapsis" && N.marcaDePaleta(undefined).id === "imnoba" && N.marcaDePerfil("inmobiliario-co").id === "imnoba" && N.marcaDePerfil("medicina-ar").id === "sinapsis" && N.marcaDePerfil("generico") === null && N.marcaDeTema("medicos-experimento").id === "sinapsis" && N.marcaDeTema("bogota-real").id === "imnoba" && N.paletaValidaParaMarca("sinapsis", "imnoba") === "medicina" && N.paletaValidaParaMarca("imnoba", "retro") === "imnoba" && N.paletaValidaParaMarca("imnoba", "retro-imnoba") === "retro-imnoba" && N.paletaDeTema("bogota-real") === "retro-imnoba" && N.paletaDeTema("medicos-experimento") === "retro");
      const dirE = p("ejemplos", "animacion-viral");
      const textoEj = (tema) => { const suf = tema ? `-${tema}` : ""; return readFileSync(join(dirE, `idea${suf}.txt`), "utf8") + readFileSync(join(dirE, `respuesta-ia${suf}.json`), "utf8"); };
      prueba("marcas · pureza: ningún ejemplo de IMNOBA nombra a SINAPSIS y ningún ejemplo de SINAPSIS nombra a IMNOBA (ni en la idea ni en el guion que devuelve la IA)", MI.ejemplos.every((e) => !/SINAPSIS/i.test(textoEj(e.tema))) && MS.ejemplos.every((e) => !/IMNOBA/i.test(textoEj(e.tema))) && !/SINAPSIS/i.test(readFileSync(join(dirE, MI.ideaEjemplo), "utf8")) && !/IMNOBA/i.test(readFileSync(join(dirE, MS.ideaEjemplo), "utf8")));
      prueba("marcas · ideas de muestra: la de cada marca es válida, nombra a SU marca y los ejemplos con tema existen (idea + respuesta de la IA)", [MI, MS].every((m) => { const r = N.parsearIdea(readFileSync(join(dirE, m.ideaEjemplo), "utf8"), { paleta: m.paletaPorDefecto }); return r.errores.length === 0 && new RegExp(m.nombre).test(readFileSync(join(dirE, m.ideaEjemplo), "utf8")) && m.ejemplos.every((e) => !e.tema || (existsSync(join(dirE, `idea-${e.tema}.txt`)) && existsSync(join(dirE, `respuesta-ia-${e.tema}.json`)))); }));
      const pu = { idea: "x", duracion: 30, escenasObjetivo: 6 };
      prueba("marcas · IA: la línea de marca del mensaje de usuario es la de SU marca (IMNOBA o SINAPSIS) y nunca nombra a la otra; el Prompt Formateador también es de cada marca", ["imnoba", "retro-imnoba"].every((pl) => /MARCA: IMNOBA/.test(N.promptUsuarioIdea({ ...pu, paleta: pl })) && !/SINAPSIS/.test(N.promptUsuarioIdea({ ...pu, paleta: pl }))) && ["medicina", "retro"].every((pl) => /MARCA: SINAPSIS/.test(N.promptUsuarioIdea({ ...pu, paleta: pl })) && !/MARCA: IMNOBA/.test(N.promptUsuarioIdea({ ...pu, paleta: pl })) && /no menciones a IMNOBA/.test(N.promptUsuarioIdea({ ...pu, paleta: pl }))) && /IMNOBA/.test(N.promptFormateadorIdea("imnoba")) && !/SINAPSIS/.test(N.promptFormateadorIdea("imnoba")) && /SINAPSIS/.test(N.promptFormateadorIdea("sinapsis")) && !/IMNOBA/.test(N.promptFormateadorIdea("sinapsis")));
      const tsV = readFileSync(p("src", "viral", "plantillas1.tsx"), "utf8"), tsE = readFileSync(p("src", "viral", "EscenaViral.tsx"), "utf8");
      prueba("marcas · cierre: el CTA de IMNOBA lleva su logo y el de SINAPSIS su insignia (neurona + nombre); la marca sale de la paleta; y el fondo «dorado» de SINAPSIS es el azul clínico, no el amarillo de IMNOBA", /imnoba-logo\.png/.test(tsV) && /InsigniaSinapsis/.test(tsV) && /marcaDePaleta\(paleta\)/.test(tsE) && N.temaViral("medicina", "gold").bg0 !== N.temaViral("imnoba", "gold").bg0 && parseInt(N.temaViral("medicina", "gold").bg0.slice(5, 7), 16) > parseInt(N.temaViral("medicina", "gold").bg0.slice(1, 3), 16), N.temaViral("medicina", "gold").bg0);
      const app = readFileSync(p("scripts", "panel", "web", "app.js"), "utf8"), css = readFileSync(p("scripts", "panel", "web", "estilos.css"), "utf8"), idx = readFileSync(p("scripts", "panel", "web", "index.html"), "utf8");
      prueba("marcas · panel: selector de marca (IMNOBA / SINAPSIS) con borrador y paleta propios, ejemplos y paletas de la marca, historial filtrado, aviso si la animación cargada es de la otra marca y etiqueta de color en la barra", ["selector-marca", "cambiarMarca", "cargarBorradorMarca", "claveGuion", "clavePaleta", "animActiva", "otra-marca", "chipMarca", "M.paletas.map", "M.ejemplos.map", "verTodo", "pintarMarca"].every((t) => app.includes(t)) && /id="marca-activa"/.test(idx) && /body\[data-marca="imnoba"\]/.test(css) && /body\[data-marca="sinapsis"\]/.test(css) && /\.chip\.marca-imnoba/.test(css) && /\.chip\.marca-sinapsis/.test(css));
      prueba("marcas · modo clásico: los proyectos, ejemplos y videos anteriores muestran la marca de su perfil, se pueden filtrar por marca y «Nuevo video» agrupa los nichos por marca", ["chipPerfil", "filtroMarca", "grupo-marca", "marcaDePerfilPanel", "marcaEj"].every((t) => app.includes(t)));
    }

    // ── Voz en off con IA: catálogo, instrucciones, estimación y firma (puro) ──
    {
      const est = N.ESTILOS_VOZ;
      prueba("voces: 11 voces de OpenAI y estilos colombianos (rola/o, paisa, costeña/o, caleña, locutor/a viral) con una voz base válida cada uno", N.VOCES_OPENAI.length === 11 && est.length >= 8 && est.every((e) => N.vozPorId(e.voz) && e.etiqueta && e.acento) && ["rolo", "paisa", "costen", "valluna", "viral"].every((k) => est.some((e) => e.id.startsWith(k))) && N.estiloPorId(N.ESTILO_POR_DEFECTO) !== null);
      const ins = N.construirInstrucciones({ estilo: "costena-f", ritmo: "muy-agil", extra: "dilo con picardía" });
      prueba("voces: las instrucciones piden español de Colombia, el acento del estilo, tono alegre, ritmo, cifras claras y la indicación propia al final con prioridad; nada de acento de España/México/Argentina", /español de Colombia/.test(ins) && /costeño/.test(ins) && /alegre/.test(ins) && /rápido y enérgico/.test(ins) && /cifras/.test(ins) && /No uses acento de España/.test(ins) && /prioridad\): dilo con picardía$/.test(ins) && !/Indicación extra/.test(N.construirInstrucciones({})) && N.construirInstrucciones({}) === N.construirInstrucciones({ estilo: "no-existe", ritmo: "no-existe" }));
      prueba("voces: la voz efectiva es la elegida a mano, o la recomendada del estilo; la instrucción extra se acota a 600 caracteres", N.vozEfectiva({ estilo: "paisa-m" }) === "ash" && N.vozEfectiva({ estilo: "paisa-m", voz: "onyx" }) === "onyx" && N.vozEfectiva({ voz: "inventada" }) === N.estiloPorId(N.ESTILO_POR_DEFECTO).voz && N.construirInstrucciones({ extra: "x".repeat(2000) }).length < 1400);
      const animT = { escenas: [{ n: 1, inicio: 0, dur: 5, voz: "Hola *mundo*  feliz" }, { n: 2, inicio: 5, dur: 4, voz: "" }, { n: 3, inicio: 9, dur: 6, voz: "Chao" }] };
      const tv = N.textosVoz(animT);
      prueba("voces: los textos por escena se limpian (sin asteriscos ni espacios dobles) y las escenas sin voz se omiten; la firma cambia si cambia un texto o un tiempo y no si no", tv.length === 2 && tv[0].texto === "Hola mundo feliz" && N.firmaVoz(animT) === N.firmaVoz(JSON.parse(JSON.stringify(animT))) && N.firmaVoz(animT) !== N.firmaVoz({ escenas: [{ ...animT.escenas[0], voz: "Hola mundo" }, animT.escenas[1], animT.escenas[2]] }) && N.firmaVoz(animT) !== N.firmaVoz({ escenas: [animT.escenas[0], animT.escenas[1], { ...animT.escenas[2], inicio: 10 }] }));
      const e1 = N.estimarVoz(animT);
      prueba("voces: la estimación cuenta caracteres, segundos (≈ 15 caracteres por segundo) y costo (≈ US$ 0,015 por minuto)", e1.escenas === 2 && e1.caracteres === 20 && Math.abs(e1.segundos - 20 / 15) < 1e-9 && Math.abs(e1.usd - Math.round((20 / 15 / 60) * 0.015 * 10000) / 10000) < 1e-9 && N.MODELO_TTS === "gpt-4o-mini-tts");
      const a1 = N.ajusteTempo(5, 10), a2 = N.ajusteTempo(10, 10), a3 = N.ajusteTempo(30, 10);
      prueba("voces: ajuste al tiempo de la escena — si cabe no se toca; si no, se acelera lo justo (máx. ×1,35); si ni así cabe, se marca y se corta", a1.tempo === 1 && a1.cabe && a2.tempo > 1 && a2.tempo <= 1.35 && a2.cabe && a3.tempo === 1.35 && !a3.cabe && a3.sobra > 0);
      prueba("voces: la caché distingue voz, instrucciones, modelo y texto (misma entrada = misma clave)", N.claveCacheVoz("m", "coral", "i", "t") === N.claveCacheVoz("m", "coral", "i", "t") && new Set([N.claveCacheVoz("m", "coral", "i", "t"), N.claveCacheVoz("m", "nova", "i", "t"), N.claveCacheVoz("m", "coral", "j", "t"), N.claveCacheVoz("n", "coral", "i", "t"), N.claveCacheVoz("m", "coral", "i", "u")]).size === 5);
      const app = readFileSync(p("scripts", "panel", "web", "app.js"), "utf8");
      prueba("voces: el Estudio tiene la tarjeta «🎙️ Voz en off» con select de estilo colombiano, voz base y ritmo, probar voz, generar, renderizar con voz, ponerla al video ya renderizado y renderizar sin voz", ["select#voz-estilo", "select#voz-voz", "select#voz-ritmo", "Probar esta voz", "Generar la voz de este video", "Renderizar con voz", "Ponerla al video ya renderizado", "Renderizar sin voz", "anim-voz", "anim-poner-voz"].every((t) => app.includes(t)));
      prueba("voces: el Estudio ofrece tres caminos para la voz (ElevenLabs, OpenAI y Mi voz de CapCut u otra), carga las voces de ElevenLabs, muestra el costo por plan, deja elegir acelerar la voz o alargar la escena, sube el audio propio, alinea el video a él y permite volver a los tiempos originales", ["selector-motor", "Cargar mis voces de ElevenLabs", "eleven-voces", "¿Cuánto me cuesta con un plan de ElevenLabs?", "select#voz-ajuste", "Subir el audio de mi voz", "Alinear el video a esta voz", "anim-voz-externa", "Volver a los tiempos originales", "Ponla al video ya renderizado", "api/anim/voz/subir"].every((t) => app.includes(t)));
      // ── ElevenLabs y voz propia (lógica pura) ──
      {
        const eM = N.estimarVozEleven(animT, "eleven_multilingual_v2"), eF = N.estimarVozEleven(animT, "eleven_flash_v2_5"), eX = N.estimarVozEleven(animT, "inventado");
        prueba("ElevenLabs: la estimación son caracteres × créditos del modelo (Multilingual v2 = 1, Flash = 0,5) con tarifa de API y cuántos videos como este caben en cada plan; un modelo desconocido cae al recomendado", eM.creditos === 20 && eF.creditos === 10 && eM.escenas === 2 && Math.abs(eM.usdApi - 0.002) < 1e-9 && Math.abs(eF.usdApi - 0.001) < 1e-9 && eX.creditos === 20 && eM.porPlan.find((q) => q.plan.id === "starter").videos === 1500 && eM.porPlan.length === N.PLANES_ELEVEN.length && N.PLANES_ELEVEN.find((q) => q.id === "free").comercial === false);
        prueba("ElevenLabs: el ID de la voz solo acepta letras y números (nada de rutas ni espacios); perfil y velocidad caen a valores válidos y el ritmo se traduce a la velocidad nativa (0,7–1,2)", N.sanearVoiceId("pNInz6obpgDQGcFmaJgB") === "pNInz6obpgDQGcFmaJgB" && N.sanearVoiceId("../../x") === "" && N.sanearVoiceId("a b c d e f g h i j") === "" && N.sanearVoiceId("x".repeat(50)) === "" && N.sanearVoiceId(null) === "" && JSON.stringify(N.ajustesEleven("expresiva", "muy-agil")) === JSON.stringify({ estabilidad: 0.3, similitud: 0.8, estilo: 0.55, velocidad: 1.12 }) && N.ajustesEleven("no", "no").velocidad === N.velocidadEleven(N.RITMO_POR_DEFECTO) && Object.values(N.VELOCIDAD_ELEVEN).every((x) => x >= 0.7 && x <= 1.2));
        const aE = N.ajustesEleven("equilibrada", "agil");
        const kE = (o = {}) => N.claveCacheEleven(o.m ?? "m", o.v ?? "v", o.a ?? aE, o.t ?? "t", o.p ?? "", o.s ?? "");
        prueba("ElevenLabs: la caché distingue modelo, voz, ajustes, texto y frases vecinas (cambian la entonación); misma entrada = misma clave", kE() === kE() && new Set([kE(), kE({ m: "n" }), kE({ v: "w" }), kE({ a: { ...aE, estilo: 0.9 } }), kE({ a: { ...aE, velocidad: 1.12 } }), kE({ t: "u" }), kE({ p: "antes" }), kE({ s: "después" })]).size === 8);
        const ctx = N.contextoFrases([{ texto: "uno" }, { texto: "dos" }, { texto: "tres" }], 1);
        prueba("ElevenLabs: cada frase se manda con el final de la anterior y el comienzo de la siguiente; la primera y la última no inventan contexto", ctx.previo === "uno" && ctx.siguiente === "tres" && N.contextoFrases([{ texto: "a" }, { texto: "b" }], 0).previo === "" && N.contextoFrases([{ texto: "a" }, { texto: "b" }], 1).siguiente === "");
        const t125 = N.ajusteTempo(30, 10, N.TEMPO_MAX_ELEVEN);
        prueba("ElevenLabs: una frase que no cabe se acelera como máximo ×1,25 (más suena apurada) y se marca; con OpenAI sigue siendo ×1,35", t125.tempo === 1.25 && !t125.cabe && N.TEMPO_MAX_ELEVEN === 1.25 && N.ajusteTempo(30, 10).tempo === 1.35);
        // voz propia: elegir las pausas que separan las escenas
        const sil = [{ ini: 3, fin: 3.2 }, { ini: 7.6, fin: 8.4 }, { ini: 15, fin: 15.3 }, { ini: 22.4, fin: 23 }];
        const rc = N.elegirCortes({ silencios: sil, desde: 0.5, hasta: 30, pesos: [10, 20, 10] });
        prueba("voz propia: de todas las pausas elige las que encajan con el largo de cada texto (centro de la pausa) y no marca nada como aproximado", rc.cortes.length === 2 && Math.abs(rc.cortes[0] - 8) < 1e-6 && Math.abs(rc.cortes[1] - 22.7) < 1e-6 && !rc.aproximado && rc.avisos.length === 0, JSON.stringify(rc));
        const rp = N.elegirCortes({ silencios: [{ ini: 7.6, fin: 8.4 }], desde: 0.5, hasta: 30, pesos: [10, 20, 10] });
        prueba("voz propia: si hay menos pausas que escenas reparte en proporción al texto y avisa (aproximado) para que pases las duraciones a mano; con una sola escena no hay cortes", rp.aproximado && rp.cortes.length === 2 && rp.avisos.length >= 1 && /duraciones a mano/.test(rp.avisos[0]) && N.elegirCortes({ silencios: [], desde: 0, hasta: 5, pesos: [10] }).cortes.length === 0);
        const du = N.duracionesDesdeCortes([8, 22.7], 30, 0.5);
        prueba("voz propia: de los cortes salen las duraciones (la última se alarga hasta el final del audio más 0,5 s de aire) y suman exactamente eso", du.length === 3 && Math.abs(du[0] - 8) < 1e-9 && Math.abs(du[1] - 14.7) < 1e-9 && Math.abs(du[2] - 7.8) < 1e-9 && Math.abs(du.reduce((a, b) => a + b, 0) - 30.5) < 0.02);
        const animR = N.ensamblarViral(JSON.parse(readFileSync(p("ejemplos", "animacion-viral", "respuesta-ia-bogota-real.json"), "utf8")), { modo: "idea", paleta: "retro", sfx: true }).anim;
        const tR = N.textosVoz(animR);
        const nuevaR = N.reajustarAnimacion(animR, tR.map((e) => e.dur + 0.5));
        const mismaR = N.reajustarAnimacion(animR, tR.map((e) => e.dur));
        prueba("voz propia: reajustar la animación a otras duraciones deja las escenas seguidas (sin huecos), recalcula ritmo (0,55–1) y efectos de sonido, cambia la firma de la voz, no toca el original y con las mismas duraciones queda igual", nuevaR.escenas.every((e, i) => (i === 0 ? e.inicio === 0 : Math.abs(e.inicio - nuevaR.escenas[i - 1].fin) < 0.011) && Math.abs(e.fin - e.inicio - e.dur) < 0.011 && e.ritmo >= 0.55 && e.ritmo <= 1 && e.total === nuevaR.duracion) && Math.abs(nuevaR.duracion - (animR.duracion + 0.5 * tR.length)) < 0.05 * tR.length && N.firmaVoz(nuevaR) !== N.firmaVoz(animR) && N.textosVoz(animR)[0].dur === tR[0].dur && N.firmaVoz(mismaR) === N.firmaVoz(animR), `${nuevaR.duracion} vs ${animR.duracion}`);
      }
      // ── Parte 1: preparador de guion, configuración de la voz y posproceso del audio ──
      {
        const L = N.numeroALetras;
        prueba("preparador: números a palabras (cero, veintiuno / veintiún, cien / ciento uno, mil, años, millones, mil millones, billón) y concordancia con el género", L(0) === "cero" && L(21) === "veintiuno" && L(21, { apocope: true }) === "veintiún" && L(100) === "cien" && L(101) === "ciento uno" && L(1000) === "mil" && L(2024) === "dos mil veinticuatro" && L(950e6) === "novecientos cincuenta millones" && L(1e6) === "un millón" && L(1.2e9) === "mil doscientos millones" && L(1e12) === "un billón" && L(200, { fem: true }) === "doscientas" && L(21000, { fem: true }) === "veintiuna mil" && L(2342001) === "dos millones trescientos cuarenta y dos mil uno");
        const pv = (t, o) => N.prepararParaVoz(t, o).texto;
        prueba("preparador: «$950.000.000» → «novecientos cincuenta millones de pesos»; «$950 millones» igual; «$1.200 millones» → mil doscientos millones de pesos; «2.500.000 pesos» sin «de»; sin cifras", /novecientos cincuenta millones de pesos/.test(pv("Cuesta $950.000.000 hoy")) && /novecientos cincuenta millones de pesos/.test(pv("Cuesta $950 millones hoy")) && /mil doscientos millones de pesos/.test(pv("Vale $1.200 millones")) && /dos millones quinientos mil pesos/.test(pv("Paga 2.500.000 pesos al mes")) && !/\d/.test(pv("Cuesta $950.000.000 y mide 85 m² con 3,5 % de 2024")));
        prueba("preparador: áreas, porcentajes, decimales y años (85 m² → ochenta y cinco metros cuadrados; 85 m2 y 85 metros cuadrados igual; 37 % → treinta y siete por ciento; 3,5 % → tres coma cinco por ciento; 2024; 1 m² → un metro cuadrado)", /ochenta y cinco metros cuadrados/.test(pv("Tiene 85 m² útiles")) && /ochenta y cinco metros cuadrados/.test(pv("Tiene 85 m2 útiles")) && /ochenta y cinco metros cuadrados/.test(pv("Tiene 85 metros cuadrados")) && /treinta y siete por ciento/.test(pv("El 37 % lo logra")) && /tres coma cinco por ciento/.test(pv("Subió 3,5 % este año")) && /dos mil veinticuatro/.test(pv("En 2024 todo cambió")) && /un metro cuadrado/.test(pv("Mide 1 m²")) && /cuatro kilómetros/.test(pv("Está a 4 km")));
        prueba("preparador: concordancia (1 vehículo → un vehículo; 1 propiedad → una propiedad; 21 propiedades → veintiuna propiedades; 200 propiedades → doscientas propiedades; 21 de marzo → veintiuno de marzo)", /\bun vehículo/.test(pv("Hay 1 vehículo")) && /\buna propiedad/.test(pv("Hay 1 propiedad")) && /veintiuna propiedades/.test(pv("Hay 21 propiedades")) && /doscientas propiedades/.test(pv("Hay 200 propiedades")) && /veintiuno de marzo/.test(pv("El 21 de marzo salimos")) && /ciento un vehículos/.test(pv("Hay 101 vehículos")));
        prueba("preparador: teléfonos en grupos (3-3-4) y códigos cifra por cifra, no como un número enorme", /tres cero cero, uno dos tres, cuatro cinco seis siete/.test(pv("Escribe al 3001234567")) && /i eme ene cuatro cinco dos uno/.test(pv("Código IMN-4521")));
        prueba("preparador: diccionario de pronunciación (imnoba.com → im-no-ba punto com, UPTC → u pe te ce, VIS, WhatsApp…), sin tocar palabras que lo contienen («visita»), y editable (las claves «_» son notas)", /im-no-ba punto com/.test(pv("Entra a imnoba.com ya")) && /u pe te ce/.test(pv("Cerca de la UPTC hay más")) && /vivienda de interés social/.test(pv("Es una VIS nueva")) && /la visita es hoy/i.test(pv("La visita es hoy")) && /guasap/.test(pv("Escríbenos por WhatsApp ahora")) && pv("Mira Zork ahora", { diccionario: { Zork: "Zórk", _nota: "no cuenta" } }).includes("Zórk") && !pv("Mira _nota ahora", { diccionario: { _nota: "x" } }).includes("x."));
        const largo = "Si buscas una propiedad con tres habitaciones, dos baños, parqueadero cubierto, cerca de la UPTC y con vigilancia las veinticuatro horas, que además permite mascotas, escríbenos hoy mismo...";
        const rl = N.prepararParaVoz(largo);
        prueba("preparador: sin puntos suspensivos ni guiones largos ni paréntesis; frases largas partidas en tramos de ≤ 14 palabras con comas y puntos; termina en punto", !/(\.\.\.|…|—|–|\(|\))/.test(pv("Mira esto... y esto — y (esto)")) && Math.max(...rl.tramos) <= 14 && /[.!?]$/.test(rl.texto) && rl.texto.split(/(?<=[.!?])\s+/).length >= 3);
        const sinNum = "Registra tu propiedad o vehículo gratis y conoce quiénes buscan algo parecido en tu zona, porque cada anuncio llega a personas reales que quieren hablar contigo";
        const pal = (t) => t.toLowerCase().match(/[\p{L}\p{N}]+/gu).join(" ");
        prueba("preparador: NO inventa ni cambia datos — sin cifras ni siglas, el resultado tiene exactamente las mismas palabras, en el mismo orden (solo cambia la puntuación)", pal(pv(sinNum)) === pal(sinNum) && pal(N.prepararParaVoz(sinNum, { partir: false }).texto) === pal(sinNum));
        prueba("preparador: es estable (prepararlo dos veces da lo mismo) y reporta cada cambio (número, diccionario, puntuación, pausa)", pv(pv(largo)) === pv(largo) && N.prepararParaVoz("Cuesta $950.000.000... UPTC").cambios.map((c) => c.tipo).sort().join() === "diccionario,numero,puntuacion");

        // configuración de la voz
        const cv = N.normalizarConfigVoz({ voz: "inventada", velocidad: 3, formato: "exe", instrucciones: "   " });
        prueba("config de voz: lo inválido cae al valor por defecto (voz → coral, velocidad fuera de 0,5–1,5 → 1, formato → mp3, instrucciones vacías → las de la locutora) y lo válido se respeta", cv.voz === "coral" && cv.velocidad === 1 && cv.formato === "mp3" && cv.instrucciones === N.INSTRUCCIONES_LOCUTORA && N.normalizarConfigVoz({ voz: "nova", velocidad: 1.1, formato: "wav", instrucciones: "Sé breve." }).voz === "nova" && N.normalizarConfigVoz({ velocidad: 1.1 }).velocidad === 1.1 && N.normalizarConfigVoz({ formato: "wav" }).formato === "wav" && N.normalizarConfigVoz(null).voz === "coral");
        prueba("instrucciones por defecto: locutora colombiana de 24 años de Bogotá, acento neutro, alegre, ritmo ágil al inicio y pausado en el dato, pausas cortas, pronunciar «im-NO-ba», sin robótica ni noticiero, sin acento de España/México/Argentina", ["locutora colombiana de 24 años, de Bogotá", "acento neutro colombiano", "alegre", "ágil al inicio", "más pausado en el dato importante", "pausas cortas", "im-NO-ba", "robótica", "noticiero", "España"].every((t) => N.INSTRUCCIONES_LOCUTORA.includes(t)) && N.construirInstrucciones({}) === N.INSTRUCCIONES_LOCUTORA && N.ESTILO_POR_DEFECTO === "locutora");
        prueba("instrucciones: las de voz.config.json mandan para la locutora; la indicación extra va al final con prioridad; un texto completo escrito a mano (laboratorio) se usa tal cual; la voz por defecto sale de la config pero un estilo propio conserva la suya", N.construirInstrucciones({ instruccionesBase: "Habla bajito." }) === "Habla bajito." && N.construirInstrucciones({ instruccionesBase: "Habla bajito.", extra: "más fuerte" }).endsWith("(tiene prioridad): más fuerte") && N.construirInstrucciones({ instrucciones: "Solo esto.", extra: "no cuenta", estilo: "paisa-f" }) === "Solo esto." && N.vozEfectiva({ vozPorDefecto: "nova" }) === "nova" && N.vozEfectiva({ estilo: "paisa-f", vozPorDefecto: "nova" }) === "coral" && N.vozEfectiva({ voz: "onyx", vozPorDefecto: "nova" }) === "onyx");

        // posproceso del audio (ffmpeg real, sin red)
        const A = await import("../audio.mjs");
        const { buscarFfmpeg: bf } = await import("../medios.mjs");
        const { ffmpeg: ff } = bf();
        const tonoA = (seg, f, amp) => { const n = Math.round(seg * A.SR), a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = amp * Math.sin((2 * Math.PI * f * i) / A.SR) * Math.min(1, i / 300, (n - i) / 300); return a; };
        const juntar = (...t) => { const x = new Float32Array(t.reduce((q, z) => q + z.length, 0)); let o = 0; for (const z of t) { x.set(z, o); o += z.length; } return x; };
        const sil = (seg) => new Float32Array(Math.round(seg * A.SR));
        const rmsA = (x, a, b) => { let q = 0, n = 0; for (let i = Math.floor(a * A.SR); i < Math.min(x.length, Math.floor(b * A.SR)); i++) { q += x[i] * x[i]; n++; } return Math.sqrt(q / Math.max(1, n)); };
        const conHueco = juntar(sil(0.8), tonoA(1, 220, 0.4), sil(2), tonoA(1, 220, 0.4), sil(0.3), tonoA(1, 220, 0.4), sil(0.8));
        const rec = A.recortarSilenciosLargos(conHueco);
        prueba("posproceso: un silencio largo DENTRO de la frase (2 s) se acorta a ≈ 0,35 s; el silencio corto (0,3 s) y los bordes no se tocan", Math.abs(rec.quitadosSeg - 1.65) < 0.05 && Math.abs(rec.audio.length / A.SR - (conHueco.length / A.SR - 1.65)) < 0.05 && A.recortarSilenciosLargos(juntar(sil(0.8), tonoA(1, 220, 0.4), sil(0.3), tonoA(1, 220, 0.4), sil(0.8))).quitadosSeg === 0, String(rec.quitadosSeg));
        const musica = tonoA(8, 330, 0.3), vozD = juntar(sil(3), tonoA(2, 200, 0.4), sil(3));
        const mus0 = musica.slice();
        const dk = A.duckear(musica, vozD);
        prueba("ducking: la música baja ≈ 9 dB mientras habla la voz (≥ 55 % menos), sube de nuevo en las pausas (≥ 90 % a los 2,5 s de callar) y antes de hablar queda intacta", rmsA(musica, 3.6, 4.8) < 0.45 * rmsA(mus0, 3.6, 4.8) && rmsA(musica, 7.5, 8) > 0.9 * rmsA(mus0, 7.5, 8) && Math.abs(rmsA(musica, 0.2, 2.5) - rmsA(mus0, 0.2, 2.5)) < 0.01 && dk.gananciaMinima < 0.4, JSON.stringify({ bajo: rmsA(musica, 3.6, 4.8) / rmsA(mus0, 3.6, 4.8), libre: rmsA(musica, 7.5, 8) / rmsA(mus0, 7.5, 8), g: dk.gananciaMinima }));
        mkdirSync(p("trabajo", "tmp", "prueba-posproceso"), { recursive: true });
        const wavQ = p("trabajo", "tmp", "prueba-posproceso", "baja.wav");
        A.escribirWavEstereo(wavQ, tonoA(12, 440, 0.04));
        const antesL = A.medirLUFS(ff, wavQ);
        const nr = A.normalizarEnSitio(ff, wavQ, { objetivo: -14, pico: -1.5 });
        const despuesL = A.medirLUFS(ff, wavQ);
        prueba("posproceso: normalizar a −14 LUFS lleva un audio flojo (≈ −30 LUFS) a −14 ±1 LUFS con el pico verdadero por debajo de −1,5 dBTP; un audio en silencio no se toca", antesL && antesL.integrado < -25 && nr && despuesL && Math.abs(despuesL.integrado + 14) < 1 && despuesL.picoVerdadero <= -1.4 && A.medirLUFS(ff, (() => { const f = p("trabajo", "tmp", "prueba-posproceso", "mudo.wav"); A.escribirWavEstereo(f, sil(4)); return f; })()) === null, JSON.stringify({ antes: antesL?.integrado, despues: despuesL }));
        rmSync(p("trabajo", "tmp", "prueba-posproceso"), { recursive: true, force: true });
      }
      // ── Parte 2: Panel de Videos (lógica pura) ──
      {
        const mk = (o) => N.normalizarVideo({ titulo: "Video", estado: "publicado", fecha_publicacion: "2026-10-05", ...o }, "2026-10-20");
        const nv = N.normalizarVideo({ id: "a/../b c", titulo: "  Hola  ", serie: "inventada", estado: "volando", fecha_publicacion: "2026-02-30", duracion_seg: -4, metricas: [{ vistas: -5, guardados: "12", fecha_medicion: "mañana", retencion_pct: 250 }, { vistas: 100.6 }], acciones: [{ tipo: "x", cantidad: 0 }], publicaciones: [{ plataforma: "myspace", url: "http://x" }] }, "2026-10-20");
        prueba("videos: el id solo admite letras, números, guion y guion bajo (una ruta o símbolos se limpian)", /^[A-Za-z0-9_-]+$/.test(nv.id) && nv.id === "abc", nv.id);
        prueba("videos: valores por defecto y límites del modelo de datos", nv.titulo === "Hola" && nv.serie === "otro" && nv.estado === "idea" && nv.fecha_publicacion === "" && nv.duracion_seg === 0 && nv.metricas[0].vistas === 0 && nv.metricas[0].guardados === 12 && nv.metricas[0].fecha_medicion === "2026-10-20" && nv.metricas[0].retencion_pct === 100 && nv.metricas[1].vistas === 101 && nv.acciones[0].tipo === "otro" && nv.acciones[0].cantidad === 1 && nv.publicaciones[0].plataforma === "instagram" && nv.publicaciones[0].fecha === "2026-10-20");
        prueba("videos: fechas — «2026-02-30» no existe; «03/09/2026» (día/mes/año) → 2026-09-03; una fecha ISO con hora se recorta; basura → vacío", N.fechaValida("2026-02-30") === "" && N.fechaValida("03/09/2026") === "2026-09-03" && N.fechaValida("2026-9-3T10:00:00Z") === "2026-09-03" && N.fechaValida("ayer") === "" && N.validarVideo(N.normalizarVideo({ titulo: "", estado: "idea" })).length === 1 && N.validarVideo(N.normalizarVideo({ titulo: "x", estado: "publicado" })).length === 1);
        const a = mk({ id: "a", serie: "estafas", metricas: [{ fecha_medicion: "2026-10-06", plataforma: "instagram", vistas: 1000, guardados: 10 }, { fecha_medicion: "2026-10-12", plataforma: "instagram", vistas: 3000, guardados: 90 }, { fecha_medicion: "2026-10-12", plataforma: "tiktok", vistas: 500, compartidos: 7 }], acciones: [{ tipo: "registro_agente", cantidad: 2, fecha: "2026-10-14" }, { tipo: "contacto_whatsapp", cantidad: 1, fecha: "2026-09-20" }] });
        const m = N.metricasActuales(a);
        prueba("videos: lo que tiene hoy un video = la ÚLTIMA medición de cada plataforma, sumadas (no se cuentan dos veces las anteriores), más todas sus acciones", m.vistas === 3500 && m.guardados === 90 && m.compartidos === 7 && m.acciones === 3);
        const b = mk({ id: "b", serie: "florida", fecha_publicacion: "2026-09-28", metricas: [{ vistas: 800 }] });
        const c = mk({ id: "c", estado: "grabado", fecha_publicacion: "", metricas: [{ vistas: 999 }] });
        const rm = N.resumenMes([a, b, c], "2026-10-20");
        prueba("videos: el resumen del mes cuenta solo los PUBLICADOS este mes (con sus vistas, guardados y compartidos), las acciones del mes de cualquier video (la de septiembre no) y el acumulado de todo", rm.mes === "2026-10" && rm.publicados === 1 && rm.mes_totales.vistas === 3500 && rm.mes_totales.guardados === 90 && rm.acciones_mes === 2 && rm.todo.vistas === 3500 + 800 + 999 && rm.videos === 3, JSON.stringify(rm));
        const sem = N.serieSemanal([a, b], "2026-10-20", 4);
        prueba("videos: la serie semanal trae 4 semanas (lunes) seguidas; las vistas van a la semana de publicación y las acciones a la semana en que ocurrieron", sem.length === 4 && sem[3].semana === "2026-10-19" && sem[0].semana === "2026-09-28" && sem[0].vistas === 800 && sem[1].vistas === 3500 && sem[2].acciones === 2 && sem.every((x, i) => i === 0 || N.diasEntre(sem[i - 1].semana, x.semana) === 7), JSON.stringify(sem));
        const rk = N.rankingSeries([mk({ serie: "estafas", metricas: [{ vistas: 1000, guardados: 5 }], acciones: [{ tipo: "registro_agente", cantidad: 1 }] }), mk({ serie: "adivina_precio", metricas: [{ vistas: 50000, guardados: 20, compartidos: 10 }] }), mk({ serie: "florida", metricas: [{ vistas: 2000, guardados: 80, compartidos: 20 }] }), mk({ serie: "otro", estado: "idea", metricas: [{ vistas: 9e6 }] })]);
        prueba("qué funciona: manda lo que convierte, no las vistas — la serie con una acción de negocio (1.000 vistas) va antes que la de 50.000 vistas; orden: convierte → interesa (guardan y comparten ≥ 2 %) → entretiene, y dentro de cada clase por puntos; las ideas sin publicar no cuentan", rk.length === 3 && rk.map((x) => x.clave).join() === "estafas,florida,adivina_precio" && rk[0].clase === "convierte" && rk[1].clase === "interesa" && rk[2].clase === "entretiene" && rk[2].vistas === 50000, JSON.stringify(rk.map((x) => [x.clave, x.clase, x.puntos])));
        const gk = N.rankingGanchos([mk({ gancho: "¿Sabías que te pueden estafar?", metricas: [{ vistas: 100 }] }), mk({ gancho: "Sabías que te pueden estafar", metricas: [{ vistas: 100, guardados: 40 }] }), mk({ gancho: "Otro gancho distinto", acciones: [{ cantidad: 3, tipo: "otro" }] })]);
        prueba("qué funciona: los ganchos iguales (sin importar signos ni mayúsculas) se juntan en una fila y se ordenan por resultados reales", gk.length === 2 && gk[0].etiqueta === "Otro gancho distinto" && gk[1].videos === 2);
        const base = [mk({ id: "x1", titulo: "Estafas con propiedades: 3 señales para no caer", gancho: "¿Te ofrecieron una propiedad muy barata?", fecha_publicacion: "2026-09-25" }), mk({ id: "x2", titulo: "Estafas con propiedades: 3 señales para no caer", fecha_publicacion: "2026-06-01" }), mk({ id: "x3", titulo: "Cómo cocinar arroz", fecha_publicacion: "2026-10-10" })];
        const pa = N.buscarParecidos({ titulo: "3 señales de estafas en propiedades" }, base, "2026-10-20");
        const pg = N.buscarParecidos({ titulo: "Algo distinto", gancho: "Te ofrecieron una propiedad muy barata" }, base, "2026-10-20");
        prueba("evitar repetición: avisa si hay un título parecido en los últimos 60 días (aunque cambie el orden o los plurales), ignora el de hace más de 60 días y el que no se parece, también compara el gancho, y no se compara con el mismo video", pa.length === 1 && pa[0].video.id === "x1" && pa[0].motivo === "título" && pa[0].dias === 25 && pg.length === 1 && pg[0].motivo === "gancho" && N.buscarParecidos({ titulo: "Estafas con propiedades: 3 señales para no caer", id: "x1" }, base, "2026-10-20").length === 0 && N.similitud("hola mundo", "adiós planeta") < 0.3 && N.similitud("Estafas con propiedades", "estafa en propiedad") > 0.5);
        const csv = N.parsearCSV('﻿titulo;Serie;plataforma;URL;fecha;vistas;guardados;compartidos\n"Casas; no, propiedades ""baratas""";estafas;IG;https://x.co/1;03/09/2026;18.400;320;145\n');
        prueba("importar CSV: lee punto y coma o coma, comillas con comas y comillas dobles, BOM y cabeceras con mayúsculas", csv.columnas.join() === "titulo,serie,plataforma,url,fecha,vistas,guardados,compartidos" && csv.filas.length === 1 && csv.filas[0].titulo === 'Casas; no, propiedades "baratas"' && csv.filas[0].vistas === "18.400" && N.parsearCSV("a,b\n1,2\n\n3,4\n").filas.length === 2 && N.parsearCSV("").errores.length === 1 && N.parsearCSV('a,b\n"sin cerrar,2\n').errores.length === 1);
        prueba("importar CSV: números con separador de miles (18.400, 18,400, 1 200) y rechazo de letras o negativos", N.enteroCSV("18.400") === 18400 && N.enteroCSV("18,400") === 18400 && N.enteroCSV("1 200") === 1200 && N.enteroCSV("") === 0 && N.enteroCSV("12k") === null && N.enteroCSV("-5") === null && N.enteroCSV("1,5") === null);
        const filas = N.parsearCSV([N.CSV_EJEMPLO, "Sin serie ni url,,tiktok,,2026-10-01,10,1,1", ",estafas,instagram,https://a.co/1,2026-10-01,1,1,1", "Mal,inventada,myspace,ftp://x,31/02/2026,doce,-1,", "Repetido,estafas,instagram,https://www.instagram.com/reel/ejemplo1/,2026-09-03,1,1,1"].join("\n")).filas;
        const val = N.validarFilasCSV(filas, "2026-10-20", new Set());
        prueba("importar CSV: el de ejemplo es válido; cada fila mala se reporta con su número de fila y TODOS sus errores (título, serie, plataforma, enlace, fecha, números); sin serie → «otro»; el enlace repetido en el archivo se marca como duplicado", val.slice(0, 3).every((f) => f.ok && f.video.estado === "publicado" && f.video.publicaciones.length === 1) && val[3].ok && val[3].video.serie === "otro" && !val[4].ok && val[4].fila === 6 && val[4].errores.some((e) => /título/.test(e)) && !val[5].ok && val[5].fila === 7 && val[5].errores.length >= 5 && val[6].duplicada && val[6].avisos.length === 1, JSON.stringify(val.map((f) => [f.fila, f.ok, f.errores.length, f.duplicada])));
        const exp = N.aCSV([N.normalizarVideo({ titulo: 'Con "comillas", y coma', serie: "florida", estado: "publicado", fecha_publicacion: "2026-10-01", publicaciones: [{ plataforma: "instagram", url: "https://a.co/1", fecha: "2026-10-01" }, { plataforma: "tiktok", url: "https://a.co/2", fecha: "2026-10-02" }], metricas: [{ plataforma: "instagram", vistas: 1000, guardados: 30, compartidos: 5, retencion_pct: 42 }, { plataforma: "tiktok", vistas: 2000 }] }, "2026-10-20")]);
        const vuelta = N.validarFilasCSV(N.parsearCSV(exp).filas, "2026-10-20");
        prueba("exportar CSV: una fila por publicación con las 8 columnas de la importación (más estado, acciones, gancho, id): lo exportado se puede volver a importar y conserva título, serie y cifras", exp.split("\n")[0].startsWith(N.COLUMNAS_IMPORTAR.join(",")) && vuelta.length === 2 && vuelta.every((f) => f.ok) && vuelta[0].video.titulo === 'Con "comillas", y coma' && vuelta[0].video.serie === "florida" && vuelta[0].video.metricas[0].vistas === 1000 && vuelta[1].video.metricas[0].vistas === 2000 && vuelta[1].video.publicaciones[0].plataforma === "tiktok");
        const vg = N.videoDesdeAnimacion({ titulo: "Estafas inmobiliarias: cómo evitarlas", duracion: 42.5, escenas: [{ voz: "¿Sabías que *miles* de personas caen? Evítalo." }, { voz: "Segunda frase." }] }, { voz: "OpenAI · coral", instrucciones: "Sé alegre" });
        const dup = N.duplicarComoIdea(N.normalizarVideo({ titulo: "Original", serie: "florida", guion: "g", gancho: "h", estado: "publicado", fecha_publicacion: "2026-10-01", metricas: [{ vistas: 5 }], acciones: [{ cantidad: 2 }] }));
        prueba("videos: el video que genera el sistema se registra «grabado» con título, guion, gancho (primera frase), duración, voz e instrucciones, serie deducida y una clave estable; duplicar deja una IDEA nueva sin fechas, métricas ni acciones", vg.estado === "grabado" && vg.origen === "generador" && vg.serie === "estafas" && vg.gancho === "¿Sabías que miles de personas caen?" && vg.guion.split("\n").length === 2 && vg.duracion_seg === 42.5 && vg.voz_usada === "OpenAI · coral" && vg.instrucciones_voz === "Sé alegre" && vg.origen_clave.length === 8 && vg.origen_clave === N.videoDesdeAnimacion({ titulo: "Estafas inmobiliarias: cómo evitarlas", escenas: [{ voz: "¿Sabías que *miles* de personas caen? Evítalo." }, { voz: "Segunda frase." }] }).origen_clave && dup.estado === "idea" && dup.titulo === "Original (nueva versión)" && dup.metricas.length === 0 && dup.acciones.length === 0 && dup.fecha_publicacion === "" && dup.serie === "florida" && dup.id !== "");
      }
      // ── Fase 3: reglas de video, pistas separadas, música libre, desde-respuesta y revisión ──
      {
        const A3 = await import("../audio.mjs"), { buscarFfmpeg: bf3 } = await import("../medios.mjs");
        const { ffmpeg: ff3 } = bf3();
        const tono3 = (seg, f, amp) => { const n = Math.round(seg * A3.SR), a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = amp * Math.sin((2 * Math.PI * f * i) / A3.SR) * Math.min(1, i / 300, (n - i) / 300); return a; };
        const sil3 = (seg) => new Float32Array(Math.round(seg * A3.SR));
        const cat3 = (...t) => { const x = new Float32Array(t.reduce((q, z) => q + z.length, 0)); let o = 0; for (const z of t) { x.set(z, o); o += z.length; } return x; };
        const rms3 = (x, a, b) => { let q = 0, n = 0; for (let i = Math.floor(a * A3.SR); i < Math.min(x.length, Math.floor(b * A3.SR)); i++) { q += x[i] * x[i]; n++; } return Math.sqrt(q / Math.max(1, n)); };
        const dir3 = p("trabajo", "tmp", "prueba-fase3");
        rmSync(dir3, { recursive: true, force: true });
        mkdirSync(dir3, { recursive: true });

        // pistas separadas y nivel de la música bajo la voz (mezclador real con la música real del proyecto)
        const vozW = join(dir3, "voz.wav"), mezW = join(dir3, "mezcla.wav"), fondoW = join(dir3, "stems", "musica-y-efectos.wav");
        A3.escribirWavEstereo(vozW, cat3(sil3(3), tono3(2.5, 200, 0.159), sil3(3.5)));
        const evs = [{ frame: 60, tipo: "pop", vol: 0.5 }];
        await A3.mezclarSfx({ raiz: RAIZ, ffmpeg: ff3, segundos: 9, salidaWav: mezW, eventos: evs, musica: N.MUSICA, vozWav: vozW, fondoWav: fondoW });
        const vz = A3.decodificar(ff3, vozW, dir3), mz = A3.decodificar(ff3, mezW, dir3), fd = existsSync(fondoW) ? A3.decodificar(ff3, fondoW, dir3) : null;
        const musicaBajoVoz = mz.map((x, i) => x - (vz[i] ?? 0));
        const dBrel = 20 * Math.log10(rms3(musicaBajoVoz, 3.6, 5.3) / rms3(vz, 3.6, 5.3));
        prueba("audio: la música queda ≈ 24 dB bajo la voz mientras habla (regla: −22 a −26 dB), medido con el mezclador real y la música del proyecto", dBrel <= -21 && dBrel >= -27, `${dBrel.toFixed(1)} dB`);
        prueba("audio: el render exporta la pista «música + efectos» SOLA (sin voz y sin ducking, para reeditar con otra voz): no cambia cuando habla la voz y trae el efecto", fd && Math.abs(20 * Math.log10(rms3(fd, 3.6, 5.3) / rms3(fd, 6.2, 7.8))) < 4 && rms3(fd, 0.95, 1.2) > 1.5 * rms3(fd, 2.1, 2.4) && mz.length >= fd.length - 10);
        const rndF3 = readFileSync(p("scripts", "render.mjs"), "utf8");
        prueba("audio: render.mjs guarda la voz sola (stems/voz.wav) y la música + efectos (stems/musica-y-efectos.wav), y borra una voz vieja si el render sale sin voz", /stems", "voz\.wav"/.test(rndF3) && /musica-y-efectos\.wav/.test(rndF3) && /fondoWav/.test(rndF3) && /rmSync\(join\(RAIZ_PROYECTO, "trabajo", "salida", "stems", "voz\.wav"\)/.test(rndF3));
        // una música libre muy baja suena igual de fuerte (se nivela)
        const quieta = p("public", "audios", "musica-prueba-baja.wav");
        spawnSync(ff3, ["-v", "error", "-y", "-i", p("public", "audios", "musica.wav"), "-af", "volume=0.15", quieta], { encoding: "utf8" });
        const mezB = join(dir3, "mezcla-baja.wav");
        await A3.mezclarSfx({ raiz: RAIZ, ffmpeg: ff3, segundos: 9, salidaWav: mezB, eventos: [], musica: { ...N.MUSICA, archivo: "audios/musica-prueba-baja.wav" }, vozWav: vozW });
        const mb = A3.decodificar(ff3, mezB, dir3);
        rmSync(quieta, { force: true });
        const dBb = 20 * Math.log10(rms3(mb.map((x, i) => x - (vz[i] ?? 0)), 3.6, 5.3) / rms3(vz, 3.6, 5.3));
        prueba("música libre: una pista grabada muy baja (−16 dB) se nivela y suena al mismo nivel bajo la voz (±2 dB)", Math.abs(dBb - dBrel) < 2, `${dBb.toFixed(1)} vs ${dBrel.toFixed(1)}`);

        // música libre (assets/musica → public/audios/musica.wav)
        const M = await import("./musica.mjs");
        const raizM = join(dir3, "raiz-musica");
        mkdirSync(join(raizM, "assets", "musica"), { recursive: true });
        mkdirSync(join(raizM, "public", "audios"), { recursive: true });
        copyFileSync(p("public", "audios", "musica.wav"), join(raizM, "public", "audios", "musica.wav"));
        const originalM = readFileSync(join(raizM, "public", "audios", "musica.wav"));
        A3.escribirWavEstereo(join(raizM, "assets", "musica", "pista-libre.wav"), tono3(12, 261, 0.3));
        A3.escribirWavEstereo(join(raizM, "assets", "musica", "corta.wav"), tono3(3, 261, 0.3));
        writeFileSync(join(raizM, "assets", "musica", "cancion.txt"), "no es audio");
        const lista = M.listarMusica({ raiz: raizM });
        prueba("música libre: `--listar` muestra las pistas de assets/musica/ (solo audio) con su duración; sin pistas se usa la sintetizada", lista.length === 2 && lista.some((x) => x.archivo === "pista-libre.wav" && Math.abs(x.segundos - 12) < 0.3) && M.musicaActual({ raiz: raizM }).origen === "sintetizada");
        const um = M.usarMusica({ archivo: "assets/musica/pista-libre.wav", raiz: raizM });
        const nuevoM = readFileSync(join(raizM, "public", "audios", "musica.wav"));
        prueba("música libre: `--usar` convierte la pista a public/audios/musica.wav (la que lee el mezclador), guarda la sintetizada para volver y deja constancia de cuál se usa", Math.abs(um.segundos - 12) < 0.3 && !nuevoM.equals(originalM) && existsSync(join(raizM, "trabajo", "anim", "musica-sintetica.wav")) && M.musicaActual({ raiz: raizM }).archivo === "assets/musica/pista-libre.wav" && Math.abs(A3.decodificar(ff3, join(raizM, "public", "audios", "musica.wav"), dir3).length / A3.SR - 12) < 0.3);
        let errs = [];
        for (const a of ["assets/musica/corta.wav", "assets/musica/cancion.txt", "assets/musica/no-existe.mp3", "../../etc/passwd", "public/audios/musica.wav"]) { try { M.usarMusica({ archivo: a, raiz: raizM }); errs.push(`aceptó ${a}`); } catch { /* esperado */ } }
        prueba("música libre: rechaza pistas muy cortas (< 8 s), que no sean audio, inexistentes o de FUERA de assets/musica/ (rutas con ../ o la carpeta del proyecto)", errs.length === 0, errs.join(" · "));
        prueba("música libre: `--restaurar` devuelve exactamente la música sintetizada original y quita la ficha", M.restaurarMusica({ raiz: raizM }) === true && readFileSync(join(raizM, "public", "audios", "musica.wav")).equals(originalM) && M.musicaActual({ raiz: raizM }).origen === "sintetizada" && M.restaurarMusica({ raiz: raizM }) === false);

        // crear la animación desde idea + respuesta (sin IA)
        const D = await import("./desde-respuesta.mjs");
        const ideaTxt = readFileSync(p("ejemplos", "animacion-viral", "idea.txt"), "utf8"), respJson = JSON.parse(readFileSync(p("ejemplos", "animacion-viral", "respuesta-ia.json"), "utf8"));
        const dr = await D.crearDesdeRespuesta({ idea: ideaTxt, respuesta: respJson, paleta: "imnoba" });
        let e1 = "", e2 = "", e3 = "";
        try { await D.crearDesdeRespuesta({ idea: ideaTxt, respuesta: { titulo: "x" } }); } catch (e) { e1 = e.message; }
        try { await D.crearDesdeRespuesta({ idea: ideaTxt, respuesta: respJson, paleta: "inventada" }); } catch (e) { e2 = e.message; }
        try { await D.crearDesdeRespuesta({ idea: "hola", respuesta: respJson }); } catch (e) { e3 = e.message; }
        prueba("desde-respuesta: idea + respuesta de Claude → animación viral válida (paleta IMNOBA, escenas con tiempos seguidos, SFX y locución) por el mismo ensamblado del panel; una respuesta sin «scenes», una paleta inventada o una idea demasiado corta dan un mensaje claro", dr.anim.formato === "viral" && dr.anim.paleta === "imnoba" && dr.anim.escenas.length >= 5 && dr.anim.sfx === true && dr.locucion.length > 100 && dr.anim.escenas.every((e, i) => i === 0 ? e.inicio === 0 : Math.abs(e.inicio - dr.anim.escenas[i - 1].fin) < 0.011) && /scenes/.test(e1) && /Paleta desconocida/.test(e2) && e3.length > 10, JSON.stringify({ e1, e2, e3 }));
        const cd = spawnSync(process.execPath, [p("scripts", "anim", "desde-respuesta.mjs")], { encoding: "utf8" });
        prueba("desde-respuesta: sin argumentos explica qué faltó y sale con error (no toca la animación activa)", cd.status === 1 && /--idea/.test(cd.stderr));

        // revisión del video renderizado
        const R = await import("./revisar-video.mjs");
        const ins = R.instantesDeRevision(30, [{ inicio: 0 }, { inicio: 3.6 }, { inicio: 7 }, { inicio: 10.7 }], 8);
        prueba("revisión: los fotogramas incluyen el inicio, el gancho (1 s), el comienzo de cada escena (+0,7 s) y el cierre; son ≥ 8, ordenados, separados ≥ 0,4 s y dentro del video", ins.length >= 8 && ins[0] <= 0.1 && ins.includes(1) && ins.includes(4.3) && ins.includes(7.7) && ins.includes(11.4) && ins.at(-1) >= 29.5 && ins.every((x, i) => i === 0 || x - ins[i - 1] >= 0.4) && ins.every((x) => x > 0 && x < 30), JSON.stringify(ins));
        const lim = R.limitesDeSenal(cat3(sil3(0.3), tono3(2, 220, 0.3), sil3(0.5)));
        prueba("revisión: mide cuándo empieza y termina la señal (≈ 0,3 s de silencio al inicio y 0,5 s al final)", lim && Math.abs(lim.inicio - 0.3) < 0.06 && Math.abs(lim.duracion - lim.fin - 0.5) < 0.06 && R.limitesDeSenal(sil3(2)) === null);
        const mp4B = join(dir3, "bueno.mp4"), mp4M = join(dir3, "malo.mp4"), audioB = join(dir3, "audio.wav");
        A3.escribirWavEstereo(audioB, cat3(sil3(0.3), tono3(21.2, 300, 0.3), sil3(0.5)));
        const mk = (f, w, h, fps) => spawnSync(ff3, ["-v", "error", "-y", "-f", "lavfi", "-i", `nullsrc=s=${w}x${h}:d=22:r=${fps}`, "-i", audioB, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", f], { encoding: "utf8" });
        mk(mp4B, 1080, 1920, 60); mk(mp4M, 1280, 720, 24);
        if (existsSync(mp4B) && existsSync(mp4M)) {
          const salidaR = join(dir3, "fot"), logs = [];
          const rb = await R.revisarVideo({ video: mp4B, salida: salidaR, raiz: dir3, log: (t) => logs.push(t) });
          const rm = await R.revisarVideo({ video: mp4M, salida: join(dir3, "fot2"), raiz: dir3, log: () => {} });
          const png = (f) => { const b = readFileSync(f); return b.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" && b.readUInt32BE(16) === 540 && b.readUInt32BE(20) === 960; };
          prueba("revisión: extrae ≥ 8 fotogramas PNG de 540×960 con las guías de zona segura, e informa resolución, fps, códecs, duración, volumen, pico, recortes y los silencios de la voz al inicio y al final", rb.fotogramas.length >= 8 && rb.fotogramas.every((f) => png(f.archivo)) && rb.resolucion === "1080x1920" && rb.fps === 60 && rb.audio && rb.audio.recortes === 0 && Math.abs(rb.audio.inicioSeg - 0.3) < 0.1 && Math.abs(rb.audio.colaSeg - 0.5) < 0.1 && existsSync(join(salidaR, "informe.json")) && logs.join("\n").includes("Fotogramas para mirar"), JSON.stringify({ n: rb.fotogramas.length, a: rb.audio, r: rb.resolucion }));
          prueba("revisión: un video fuera de formato (1280×720 a 24 fps) se marca con ❌ / ⚠️; el vertical de 1080×1920 a 60 fps pasa la parte de formato", rm.checks.some((c) => c.estado === "error" && /1280×720/.test(c.texto)) && rm.checks.some((c) => c.estado === "aviso" && /24 fps/.test(c.texto)) && rb.checks.filter((c) => /Resolución|fps|Video h264/.test(c.texto)).every((c) => c.estado === "ok"));
          // el primer fotograma lleva las líneas amarillas de las guías (y la versión sin guías no)
          const sinG = await R.revisarVideo({ video: mp4B, salida: join(dir3, "fot3"), raiz: dir3, guias: false, log: () => {} });
          prueba("revisión: con guías los fotogramas son distintos a los que no las llevan (líneas amarillas en el 12 % superior, el 20 % inferior y los márgenes de 6 %)", !readFileSync(rb.fotogramas[1].archivo).equals(readFileSync(sinG.fotogramas[1].archivo)));
        } else prueba("revisión (se omite: este ffmpeg no puede fabricar un MP4 de prueba)", true);
        let rx = "";
        try { await R.revisarVideo({ video: join(dir3, "no-existe.mp4"), raiz: dir3, log: () => {} }); } catch (e) { rx = e.message; }
        prueba("revisión: si no hay video renderizado lo explica (con el comando para renderizar)", /anim:render/.test(rx));

        // registrar con serie y nota
        const rg = spawnSync(process.execPath, [p("scripts", "panel", "registrar-video.mjs"), "--serie=florida", "--notas=Espero guardados; mirar compartidos"], { encoding: "utf8", env: { ...process.env } });
        const vr = JSON.parse(readFileSync(join(DIR_PRUEBA, "data", "videos.json"), "utf8")).videos.find((x) => x.origen === "generador");
        const rg2 = spawnSync(process.execPath, [p("scripts", "panel", "registrar-video.mjs"), "--serie=inventada"], { encoding: "utf8", env: { ...process.env } });
        const vr2 = JSON.parse(readFileSync(join(DIR_PRUEBA, "data", "videos.json"), "utf8")).videos.find((x) => x.origen === "generador");
        prueba("registro: `registrar-video.mjs --serie= --notas=` deja el video «grabado» con la serie y la nota pedidas; una serie inventada se ignora y no borra lo anterior", rg.status === 0 && vr?.serie === "florida" && vr.notas === "Espero guardados; mirar compartidos" && vr.estado === "grabado" && rg2.status === 0 && vr2.serie === "florida" && vr2.notas === vr.notas);
        rmSync(join(DIR_PRUEBA, "data", "videos.json"), { force: true });
        rmSync(dir3, { recursive: true, force: true });
      }
      // ── los archivos de reglas y comandos ──
      {
        const reglas = readFileSync(p("REGLAS_DE_VIDEO.md"), "utf8"), pedido = readFileSync(p("PEDIDO_VIDEO.md"), "utf8"), vid = readFileSync(p(".claude", "commands", "video.md"), "utf8"), ide = readFileSync(p(".claude", "commands", "ideas.md"), "utf8"), cl = readFileSync(p("CLAUDE.md"), "utf8"), mus = readFileSync(p("assets", "musica", "README.md"), "utf8"), gi = readFileSync(p(".gitignore"), "utf8");
        prueba("reglas de video: tienen todas las secciones pedidas (contexto, reparto, antes de crear, estructura viral, calidad visual, audio, voz, revisión, entrega, aprendizaje y LECCIONES) y las reglas clave de marca y lenguaje", ["## Contexto", "## Reparto de trabajo", "## Antes de crear", "## Estructura viral obligatoria", "## Calidad visual", "## Audio", "## Voz", "## Revisión obligatoria antes de entregar", "## Qué me entregas siempre", "## Aprendizaje", "## LECCIONES", 'Di "propiedad o vehículo", nunca "casa o carro"', "No prometas ganancias", "-14 LUFS", "ducking", "azul marino y dorado, fuente Inter", "Nunca uses canciones comerciales", "0,3 s de silencio al inicio y 0,5 s al final", "al menos 8 fotogramas", "Los 3 ganchos propuestos"].every((t) => reglas.includes(t)) && /guarda esto/.test(reglas) && /Lee esa sección antes de cada video/.test(reglas));
        prueba("reglas de video: la sección LECCIONES es la última (ahí se agregan las lecciones con fecha) y hay una receta técnica de ESTE sistema con sus límites (60 fps, sin subtítulos palabra por palabra, sin fotos, zona segura del motor, voz solo con clave)", reglas.trimEnd().endsWith("(vacío por ahora)") && reglas.lastIndexOf("## LECCIONES") > reglas.indexOf("# CÓMO SE HACE EN ESTE SISTEMA") && /60 fps/.test(reglas) && /NO genera\s+subtítulos|no genera\s+subtítulos/i.test(reglas) && /no\s+incorpora fotos/.test(reglas) && /220…1640/.test(reglas) && /OPENAI_API_KEY/.test(reglas));
        const cmds = [...reglas.matchAll(/node (scripts\/[\w./-]+\.mjs)/g)].map((m) => m[1]), npms = [...reglas.matchAll(/npm run ([\w:-]+)/g)].map((m) => m[1]);
        const pj = JSON.parse(readFileSync(p("package.json"), "utf8"));
        prueba("reglas de video: TODOS los scripts y comandos npm que menciona existen (nada de pasos imaginarios)", cmds.length >= 7 && cmds.every((c) => existsSync(p(c))) && npms.every((c) => pj.scripts[c]), JSON.stringify({ faltan: cmds.filter((c) => !existsSync(p(c))), npm: npms.filter((c) => !pj.scripts[c]) }));
        prueba("pedido de video: trae los 8 campos (TEMA, OBJETIVO, PÚBLICO, SERIE, DATOS Y MATERIAL, ESTILO EXTRA, DURACIÓN, LÍMITES) y la nota de que los campos vacíos los decide Claude", ["TEMA:", "OBJETIVO:", "PÚBLICO:", "SERIE:", "DATOS Y MATERIAL:", "ESTILO EXTRA:", "DURACIÓN:", "LÍMITES:", "Los campos vacíos los decides tú"].every((t) => pedido.includes(t)));
        prueba("comandos: /video (lee las reglas y LECCIONES, recibe $ARGUMENTS, decide objetivo y serie y hace todo el proceso) y /ideas (usa el registro de videos, $ARGUMENTS ideas o 10, formato de pedido, 60 días) existen en .claude/commands/", /REGLAS_DE_VIDEO\.md/.test(vid) && /\$ARGUMENTS/.test(vid) && /LECCIONES/.test(vid) && /PEDIDO_VIDEO\.md/.test(vid) && /revisión de fotogramas/.test(vid) && /\$ARGUMENTS/.test(ide) && /10/.test(ide) && /60 días/.test(ide) && /data\/videos\.json/.test(ide) && /TEMA, OBJETIVO, SERIE/.test(ide));
        prueba("CLAUDE.md dice que antes de cualquier video se lee REGLAS_DE_VIDEO.md, que /video crea un video y /ideas propone temas; y assets/musica/ trae su README (cómo agregar pistas libres, licencias, comandos) con las pistas fuera de git", /Antes de cualquier video, lee REGLAS_DE_VIDEO\.md\. El comando \/video crea un video y \/ideas propone temas\./.test(cl) && cl.indexOf("Antes de cualquier video") < cl.indexOf("Lo de arriba es el prompt original") && cl.indexOf("Antes de cualquier video") < cl.indexOf("@GEMINI.md") && /libres de derechos/.test(mus) && /musica\.mjs --usar/.test(mus) && /LICENCIAS\.md/.test(mus) && /assets\/musica\/\*/.test(gi) && existsSync(p("assets", "musica", "LICENCIAS.md")));
      }
      const rnd = readFileSync(p("scripts", "render.mjs"), "utf8");
      // mezcla real: con la voz, el audio de salida trae mucha más energía donde habla que solo con efectos y música (y la pista queda colocada en el tiempo de cada escena)
      {
        const mockV = await iniciarMock(0);
        const dirT = p("trabajo", "tmp", "prueba-voz");
        try {
          const { generarVozAnimacion } = await import("./voz.mjs");
          const { mezclarSfx, decodificar, SR } = await import("../audio.mjs");
          const { buscarFfmpeg } = await import("../medios.mjs");
          const { ffmpeg } = buscarFfmpeg();
          const animV = N.ensamblarViral(JSON.parse(readFileSync(p("ejemplos", "animacion-viral", "respuesta-ia-bogota-real.json"), "utf8")), { modo: "idea", paleta: "retro", sfx: true }).anim;
          const man = await generarVozAnimacion({ anim: animV, opciones: { estilo: "viral-m", ritmo: "agil" }, clave: "k", url: mockV.url, log: () => {} });
          const args = { raiz: RAIZ, ffmpeg, segundos: 20, eventos: N.eventosSfx(animV).filter((x) => x.frame < 20 * 60), musica: N.llevaMusica(animV) ? N.MUSICA : null };
          await mezclarSfx({ ...args, salidaWav: join(dirT, "sin-voz.wav") });
          await mezclarSfx({ ...args, salidaWav: join(dirT, "con-voz.wav"), vozWav: p("trabajo", "anim", "voz", "voz-mezcla.wav") });
          const rms = (x, a, b) => { let acc = 0, n = 0; for (let i = Math.floor(a * SR); i < Math.min(x.length, Math.floor(b * SR)); i++) { acc += x[i] * x[i]; n++; } return Math.sqrt(acc / Math.max(1, n)); };
          const A = decodificar(ffmpeg, join(dirT, "sin-voz.wav"), dirT), B = decodificar(ffmpeg, join(dirT, "con-voz.wav"), dirT);
          prueba("voces: al mezclar con mezclarSfx({vozWav}) el audio trae la voz (≥ 2× la energía de solo efectos y música), el manifiesto marca la firma de este video y ninguna frase invade la escena siguiente", rms(B, 0.5, 8) > 2 * rms(A, 0.5, 8) && man.firma === N.firmaVoz(animV) && man.escenas.length === 11 && man.escenas.every((e) => e.inicio >= 0 && e.dur > 0), `${rms(A, 0.5, 8).toFixed(3)} vs ${rms(B, 0.5, 8).toFixed(3)}`);
        } finally {
          await mockV.cerrar();
          rmSync(dirT, { recursive: true, force: true });
          rmSync(p("trabajo", "anim", "voz"), { recursive: true, force: true });
          rmSync(p("trabajo", "salida", "voz"), { recursive: true, force: true });
        }
      }
      prueba("voces: el render mezcla la voz sola cuando es vigente (y avisa si es de otra versión), con --sin-voz la omite, la música se agacha bajo la voz (ducking) y con voz el audio final se lleva a −14 LUFS", /vozVigente/.test(rnd) && /--sin-voz/.test(rnd) && /vozWav: VOZ_PISTA/.test(rnd) && /duckear\(fondoMusica, voz\)/.test(readFileSync(p("scripts", "audio.mjs"), "utf8")) && /normalizarEnSitio\(ffmpeg, AUDIO, \{ objetivo: -14/.test(rnd));
    }

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
    h = await http("GET", "/api/anim/ejemplo?marca=sinapsis");
    prueba("API: la idea de muestra de SINAPSIS es la suya (medicina, sin IMNOBA) y la de IMNOBA la suya; por paleta también se deduce", h.codigo === 200 && /SINAPSIS/.test(h.json.guion) && !/IMNOBA/.test(h.json.guion) && /IMNOBA/.test((await http("GET", "/api/anim/ejemplo?marca=imnoba")).json.guion) && /SINAPSIS/.test((await http("GET", "/api/anim/ejemplo?paleta=medicina")).json.guion));
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
    // cada ejemplo se carga con la paleta de SU marca, aunque el cliente pida la de la otra
    h = await http("POST", "/api/accion", { nombre: "anim-ejemplo", opciones: { tema: "medicos-experimento", paleta: "imnoba", sfx: true } });
    prueba("API: el ejemplo de SINAPSIS se lanza con su título de marca", h.codigo === 200 && /SINAPSIS/.test(h.json.trabajo?.titulo ?? ""), h.texto.slice(0, 200));
    await esperarTrabajo();
    h = await http("GET", "/api/anim/estado");
    prueba("API: pedir un ejemplo de SINAPSIS con paleta de IMNOBA se corrige a la de SINAPSIS (nunca se mezclan), y el historial trae la paleta", h.json.animacion.paleta === "retro" && h.json.animacion.escenas.length === 12 && h.json.historial.every((x) => typeof x.paleta === "string"), String(h.json.animacion.paleta));
    h = await http("POST", "/api/accion", { nombre: "anim-ejemplo", opciones: { tema: "bogota-real", paleta: "medicina", sfx: true } });
    await esperarTrabajo();
    h = await http("GET", "/api/anim/estado");
    prueba("API: y el de IMNOBA con paleta de SINAPSIS se corrige a la de IMNOBA (retro-imnoba)", h.json.animacion.paleta === "retro-imnoba" && h.json.animacion.escenas.length === 11, String(h.json.animacion.paleta));
    h = await http("POST", "/api/accion", { nombre: "anim-ejemplo", opciones: { sfx: true } });
    await esperarTrabajo();
    // ── Voz en off con IA (OpenAI gpt-4o-mini-tts simulado): estilos colombianos, probar, generar por escena, caché, vigencia y poner la voz a un MP4 ──
    {
      const dirVoz = p("trabajo", "anim", "voz");
      rmSync(dirVoz, { recursive: true, force: true });
      rmSync(p("trabajo", "salida", "voz"), { recursive: true, force: true });
      h = await http("GET", "/api/anim/voz");
      prueba("voz: el estado informa que hay texto de voz, la estimación de costo y que todavía no hay voz generada", h.codigo === 200 && h.json.hayTexto === true && h.json.estimado.escenas >= 5 && h.json.estimado.usd > 0 && h.json.voz === null && h.json.claveOpenAI === true, h.texto.slice(0, 300));
      h = await http("POST", "/api/anim/voz/probar", { estilo: "paisa-f", ritmo: "agil", extra: "más sonriente" });
      const uv = mock.estado.ultimaVoz;
      prueba("voz: «Probar voz» pide gpt-4o-mini-tts con la voz del estilo (paisa → coral) y las instrucciones colombianas y alegres (+ las propias), y sirve el mp3", h.codigo === 200 && /^\/salida\/voz\/prueba-.+\.mp3$/.test(h.json.url) && h.json.voz === "coral" && uv.modelo === "gpt-4o-mini-tts" && uv.voz === "coral" && /Colombia/.test(uv.instrucciones) && /paisa/.test(uv.instrucciones) && /alegre/.test(uv.instrucciones) && /más sonriente/.test(uv.instrucciones) && uv.formato === "mp3", JSON.stringify(uv).slice(0, 300));
      const rmp3 = await fetch(panel.url + h.json.url);
      prueba("voz: el mp3 de prueba se descarga del panel (audio/mpeg, con contenido)", rmp3.status === 200 && /audio/.test(rmp3.headers.get("content-type") ?? "") && (await rmp3.arrayBuffer()).byteLength > 1000);
      h = await http("POST", "/api/anim/voz/probar", { estilo: 'x"; rm -rf /', voz: "../../x", ritmo: "zz", extra: "línea 1\nlínea 2" });
      const uv2 = mock.estado.ultimaVoz;
      prueba("voz: un estilo/voz/ritmo desconocido cae al valor por defecto (la locutora de voz.config.json → coral), nunca se pasa tal cual, y los saltos de línea se limpian", h.codigo === 200 && uv2.voz === "coral" && !/rm -rf/.test(uv2.instrucciones) && /línea 1 línea 2/.test(uv2.instrucciones));
      const antes = mock.estado.voz.speech;
      h = await http("POST", "/api/accion", { nombre: "anim-voz", opciones: { estilo: "costena-f", ritmo: "agil", extra: "" } });
      const finV = await esperarTrabajo();
      const man = existsSync(join(dirVoz, "actual.json")) ? JSON.parse(readFileSync(join(dirVoz, "actual.json"), "utf8")) : null;
      prueba("voz: «Generar la voz» termina bien, pide una frase por escena y deja el manifiesto, la pista colocada en el tiempo (wav) y el mp3 completo", finV?.estado === "ok" && man && man.voz === "shimmer" && man.estilo === "costena-f" && man.escenas.length >= 5 && mock.estado.voz.speech - antes === man.escenas.length && existsSync(join(dirVoz, "voz-mezcla.wav")) && existsSync(p("trabajo", "salida", "voz", "voz-completa.mp3")), JSON.stringify(finV).slice(0, 300));
      h = await http("GET", "/api/anim/voz");
      prueba("voz: el estado la reconoce como vigente para este video, con una fila por escena y el audio completo", h.json.voz?.vigente === true && h.json.voz.voz === "shimmer" && h.json.voz.escenas.length === h.json.estimado.escenas && /voz-completa\.mp3/.test(h.json.voz.audio));
      const antes2 = mock.estado.voz.speech;
      await http("POST", "/api/accion", { nombre: "anim-voz", opciones: { estilo: "costena-f", ritmo: "agil", extra: "" } });
      await esperarTrabajo();
      prueba("voz: repetir con los mismos ajustes sale de la caché (0 llamadas nuevas a OpenAI = sin costo)", mock.estado.voz.speech === antes2);
      // si cambia el texto de una escena, la voz generada ya no sirve
      const animV = JSON.parse(readFileSync(ANIM, "utf8"));
      animV.escenas[0].voz = animV.escenas[0].voz + " Y un dato más.";
      writeFileSync(ANIM, JSON.stringify(animV, null, 1));
      h = await http("GET", "/api/anim/voz");
      prueba("voz: si cambia el texto de una escena, la voz deja de ser «vigente» (el render la omite y avisa)", h.json.voz?.vigente === false);
      writeFileSync(ANIM, JSON.stringify(JSON.parse(readFileSync(ANIM, "utf8")), null, 1));
      // ajuste de tiempos del mock (un mp3 largo): cada frase se acelera a ×1,35 como máximo y se corta con fundido si no cabe, sin salirse de su escena
      prueba("voz: las frases que no caben en su escena se aceleran (máx. ×1,35) y se marcan; la voz nunca invade la escena siguiente", man.escenas.every((e) => e.tempo <= 1.35 + 1e-6 && (e.cabe || e.cortada || e.tempo > 1)) && man.escenas.every((e) => e.durVoz > 0));
      // poner la voz a un MP4 ya renderizado (sin volver a renderizar): se fabrica uno mínimo con el ffmpeg de Remotion
      const { buscarFfmpeg } = await import("../medios.mjs");
      const { ffmpeg } = buscarFfmpeg();
      const mp4 = p("trabajo", "salida", "video-animacion.mp4");
      const hecho = spawnSync(ffmpeg, ["-v", "error", "-y", "-f", "lavfi", "-i", "nullsrc=s=160x120:d=3:r=30", "-f", "lavfi", "-i", "sine=f=330:d=3", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", mp4], { encoding: "utf8" });
      if (hecho.status === 0 && existsSync(mp4)) {
        const conVoz = p("trabajo", "salida", "video-animacion-con-voz.mp4");
        rmSync(conVoz, { force: true });
        await http("POST", "/api/accion", { nombre: "anim-poner-voz", opciones: {} });
        const finP = await esperarTrabajo();
        prueba("voz: «Ponerla al video ya renderizado» mezcla la voz con el audio del MP4 sin tocar el video y deja video-animacion-con-voz.mp4 con video H.264 y audio AAC", finP?.estado === "ok" && existsSync(conVoz) && /h264/.test(spawnSync(buscarFfmpeg().ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name", "-of", "csv=p=0", conVoz], { encoding: "utf8" }).stdout) && /aac/.test(spawnSync(buscarFfmpeg().ffprobe, ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_name", "-of", "csv=p=0", conVoz], { encoding: "utf8" }).stdout), JSON.stringify(finP).slice(0, 300));
        {
          const lv = (await http("GET", "/api/videos")).json.videos;
          const reg = lv.find((x) => x.ruta_archivo);
          prueba("videos: al terminar el trabajo el sistema registra SOLO el video en el Panel de Videos (estado «grabado», origen generador, con el guion y la duración) y guarda una copia del MP4 y su miniatura", reg && reg.estado === "grabado" && reg.origen === "generador" && reg.guion.length > 50 && reg.duracion_seg > 5 && existsSync(join(DIR_PRUEBA, "data", "media", `${reg.id}.mp4`)) && existsSync(join(DIR_PRUEBA, "data", "media", `${reg.id}.jpg`)), JSON.stringify(reg ? { estado: reg.estado, origen: reg.origen, guion: reg.guion.length, voz: reg.voz_usada, ins: reg.instrucciones_voz.slice(0, 60), dur: reg.duracion_seg, mp4: existsSync(join(DIR_PRUEBA, "data", "media", `${reg.id}.mp4`)), jpg: existsSync(join(DIR_PRUEBA, "data", "media", `${reg.id}.jpg`)) } : lv).slice(0, 400));
          if (reg) {
            const rr = await fetch(`${panel.url}/media-videos/${reg.id}.mp4`, { headers: { Range: "bytes=0-99" } });
            const rj = await fetch(`${panel.url}/media-videos/${reg.id}.jpg`);
            const rx = await fetch(`${panel.url}/media-videos/..%2F..%2Fpackage.json`);
            prueba("videos: el video registrado se abre desde el panel (MP4 con soporte de Range para mover el cursor) y su miniatura; las rutas no salen de la carpeta", rr.status === 206 && /video\/mp4/.test(rr.headers.get("content-type")) && (await rr.arrayBuffer()).byteLength === 100 && rj.status === 200 && /image\/jpeg/.test(rj.headers.get("content-type")) && rx.status !== 200);
          }
        }
        rmSync(mp4, { force: true });
        rmSync(conVoz, { force: true });
      } else prueba("voz: «Ponerla al video ya renderizado» (se omite: este ffmpeg no puede fabricar un MP4 de prueba)", true);
      rmSync(dirVoz, { recursive: true, force: true });
      rmSync(p("trabajo", "salida", "voz"), { recursive: true, force: true });
      h = await http("POST", "/api/accion", { nombre: "anim-poner-voz", opciones: {} });
      prueba("voz: sin video renderizado o sin voz generada se explica qué hacer (412), no se lanza nada", h.codigo === 412);
    }
    // ── Voz después del render: ElevenLabs simulado (voces, probar, generar por escena con contexto, caché, alargar escenas) y voz propia (subir, alinear, deshacer) ──
    {
      const dirVoz = p("trabajo", "anim", "voz");
      const mp4 = p("trabajo", "salida", "video-animacion.mp4");
      const { SR, escribirWavEstereo } = await import("../audio.mjs");
      const { utimesSync } = await import("node:fs");
      const claveAntes = { k: process.env.ELEVENLABS_API_KEY, u: process.env.ELEVENLABS_BASE_URL };
      rmSync(dirVoz, { recursive: true, force: true });
      rmSync(p("trabajo", "salida", "voz"), { recursive: true, force: true });
      const animBase = readFileSync(ANIM, "utf8");
      try {
        delete process.env.ELEVENLABS_API_KEY;
        h = await http("GET", "/api/anim/voz/eleven-voces");
        prueba("ElevenLabs: sin clave no se llama a nadie y se explica qué hacer (412)", h.codigo === 412);
        h = await http("POST", "/api/anim/voz/probar", { motor: "eleven", voiceId: "VozColombianaAbc123" });
        prueba("ElevenLabs: probar una voz sin clave tampoco gasta nada (412)", h.codigo === 412);
        process.env.ELEVENLABS_API_KEY = "prueba-eleven";
        process.env.ELEVENLABS_BASE_URL = mock.url.replace(/\/v1\/?$/, "");
        h = await http("GET", "/api/anim/voz");
        prueba("ElevenLabs: el estado informa la clave y la estimación en créditos para cada modelo (Multilingual v2 = 1 por carácter, Flash = la mitad)", h.json.claveEleven === true && h.json.estimadoEleven.eleven_multilingual_v2.creditos === h.json.estimado.caracteres && h.json.estimadoEleven.eleven_flash_v2_5.creditos === Math.round(h.json.estimado.caracteres * 0.5) && h.json.estimadoEleven.eleven_multilingual_v2.porPlan.length === 4, h.texto.slice(0, 200));
        h = await http("GET", "/api/anim/voz/eleven-voces");
        prueba("ElevenLabs: lista las voces de tu cuenta con las de español primero, descarta IDs inválidos y solo deja vistas previas https", h.codigo === 200 && h.json.voces.length === 2 && h.json.voces[0].id === "VozColombianaAbc123" && h.json.voces[0].espanol === true && h.json.voces[0].acento === "colombian" && h.json.voces[1].espanol === false && h.json.voces.every((v) => /^https:/.test(v.preview)), h.texto.slice(0, 300));
        h = await http("POST", "/api/anim/voz/probar", { motor: "eleven", voiceId: "VozColombianaAbc123", modelo: "eleven_flash_v2_5", perfil: "expresiva", ritmo: "muy-agil", nombreVoz: "Camila" });
        const ue = mock.estado.ultimaEleven;
        prueba("ElevenLabs: «Probar voz» pide la voz, el modelo, la expresión y la velocidad elegidos (audio directo, mp3) con la clave en la cabecera, y gasta solo la frase de prueba", h.codigo === 200 && /^\/salida\/voz\/prueba-.+\.mp3$/.test(h.json.url) && h.json.creditos > 0 && h.json.creditos < 400 && ue.voz === "VozColombianaAbc123" && ue.modelo === "eleven_flash_v2_5" && ue.ajustes.stability === 0.3 && ue.ajustes.style === 0.55 && ue.ajustes.speed === 1.12 && ue.conTiempos === false && /mp3_44100_128/.test(ue.query), JSON.stringify(ue).slice(0, 300));
        const antesP = mock.estado.voz.elevenlabs;
        await http("POST", "/api/anim/voz/probar", { motor: "eleven", voiceId: "VozColombianaAbc123", modelo: "eleven_flash_v2_5", perfil: "expresiva", ritmo: "muy-agil" });
        prueba("ElevenLabs: repetir la misma prueba sale de la caché (0 créditos)", mock.estado.voz.elevenlabs === antesP);
        h = await http("POST", "/api/anim/voz/probar", { motor: "eleven", voiceId: "../../etc/passwd" });
        prueba("seguridad: un ID de voz con rutas o símbolos se descarta y no se llama a ElevenLabs (412)", h.codigo === 412);
        h = await http("POST", "/api/accion", { nombre: "anim-voz", opciones: { motor: "eleven" } });
        prueba("ElevenLabs: generar sin elegir voz explica qué hacer (412)", h.codigo === 412);

        // generar la voz de todo el video
        const antes = mock.estado.voz.elevenlabs, ctxAntes = mock.estado.elevenConContexto ?? 0;
        h = await http("POST", "/api/accion", { nombre: "anim-voz", opciones: { motor: "eleven", voiceId: "VozColombianaAbc123", modelo: "eleven_multilingual_v2", perfil: "equilibrada", ritmo: "agil", nombreVoz: "Camila (simulada)" } });
        const finE = await esperarTrabajo();
        const manE = existsSync(join(dirVoz, "actual.json")) ? JSON.parse(readFileSync(join(dirVoz, "actual.json"), "utf8")) : null;
        prueba("ElevenLabs: «Generar la voz» pide una frase por escena, deja el manifiesto con la voz, el modelo, los créditos gastados y la pista colocada en el tiempo", finE?.estado === "ok" && manE?.motor === "eleven" && manE.voiceId === "VozColombianaAbc123" && manE.voz === "Camila (simulada)" && manE.modelo === "eleven_multilingual_v2" && manE.escenas.length >= 5 && mock.estado.voz.elevenlabs - antes === manE.escenas.length && manE.creditos > 0 && manE.ajuste === "voz" && existsSync(join(dirVoz, "voz-mezcla.wav")) && existsSync(p("trabajo", "salida", "voz", "voz-completa.mp3")), JSON.stringify(finE).slice(0, 300));
        prueba("ElevenLabs: cada frase viaja con el contexto de la anterior y la siguiente (entonación continua entre escenas): todas menos la primera y la última", (mock.estado.elevenConContexto ?? 0) - ctxAntes === manE.escenas.length - 2);
        h = await http("GET", "/api/anim/voz");
        prueba("ElevenLabs: el estado la reconoce como vigente, con el motor, los créditos reales y una fila por escena", h.json.voz?.vigente === true && h.json.voz.motor === "eleven" && h.json.voz.creditos === manE.creditos && h.json.voz.escenas.length === manE.escenas.length && h.json.voz.necesitaRender === false);
        const antes2 = mock.estado.voz.elevenlabs;
        await http("POST", "/api/accion", { nombre: "anim-voz", opciones: { motor: "eleven", voiceId: "VozColombianaAbc123", modelo: "eleven_multilingual_v2", perfil: "equilibrada", ritmo: "agil" } });
        await esperarTrabajo();
        prueba("ElevenLabs: repetir con la misma voz y ajustes sale de la caché (0 llamadas = 0 créditos)", mock.estado.voz.elevenlabs === antes2 && JSON.parse(readFileSync(join(dirVoz, "actual.json"), "utf8")).creditos === 0);
        prueba("ElevenLabs: las frases que no caben se aceleran como máximo ×1,25 y se marcan; ninguna invade la escena siguiente", manE.escenas.every((e) => e.tempo <= 1.25 + 1e-6 && e.durVoz > 0));

        // «alargar la escena»: una escena de 1,2 s no deja caber la voz → con el ajuste «video» se alarga y el MP4 viejo ya no sirve
        const animA = JSON.parse(animBase);
        const tvA = N.textosVoz(animA);
        const durVoz0 = manE.escenas[0].durVoz;
        const corta = N.reajustarAnimacion(animA, tvA.map((e, i) => (i === 0 ? 1.2 : e.dur)));
        writeFileSync(ANIM, JSON.stringify(corta, null, 1));
        writeFileSync(mp4, "no es un video real pero existe");
        utimesSync(mp4, new Date(Date.now() - 3600e3), new Date(Date.now() - 3600e3));
        await http("POST", "/api/accion", { nombre: "anim-voz", opciones: { motor: "eleven", voiceId: "VozColombianaAbc123", modelo: "eleven_multilingual_v2", perfil: "equilibrada", ritmo: "agil", ajuste: "video" } });
        const finV2 = await esperarTrabajo();
        const largo = JSON.parse(readFileSync(ANIM, "utf8"));
        const manV = JSON.parse(readFileSync(join(dirVoz, "actual.json"), "utf8"));
        const tvL = N.textosVoz(largo);
        prueba("ElevenLabs · «alargar la escena»: la voz natural no se acelera (tempo 1); cada escena donde no cabía se alarga lo justo (voz + entrada + cola), las escenas quedan seguidas y el video crece", finV2?.estado === "ok" && manV.ajuste === "video" && manV.cambioTiempos === true && manV.alargadas.includes(tvA[0].n) && manV.escenas.every((e) => e.tempo === 1 && e.cabe && !e.cortada) && manV.escenas.every((e, i) => e.alargada === false || (tvL[i].dur >= e.durVoz + 0.55 && tvL[i].dur < e.durVoz + 0.9)) && largo.escenas.every((e, i) => i === 0 ? e.inicio === 0 : Math.abs(e.inicio - largo.escenas[i - 1].fin) < 0.011) && largo.duracion > corta.duracion, JSON.stringify({ finV2: finV2?.estado, alargadas: manV.alargadas, durVoz0, dur: largo.escenas[0].dur }));
        h = await http("GET", "/api/anim/voz");
        prueba("ElevenLabs · si cambiaron los tiempos del video, el MP4 ya renderizado queda viejo: el estado lo dice y «Ponerla al video ya renderizado» se niega con una explicación (412)", durVoz0 <= 0.65 || (h.json.voz?.vigente === true && h.json.voz.cambioTiempos === true && h.json.voz.necesitaRender === true && h.json.externa.hayCopia === true));
        h = await http("POST", "/api/accion", { nombre: "anim-poner-voz", opciones: {} });
        prueba("… y por eso poner la voz al video viejo se rechaza explicando que hay que renderizar de nuevo", durVoz0 <= 0.65 || (h.codigo === 412 && /Renderizar con voz/.test(h.json.error)), h.texto.slice(0, 200));
        if (durVoz0 > 0.65) {
          h = await http("POST", "/api/accion", { nombre: "anim-voz-externa", opciones: { deshacer: true } });
          await esperarTrabajo();
          const vuelta = JSON.parse(readFileSync(ANIM, "utf8"));
          prueba("deshacer: vuelve a los tiempos que tenía el video, quita la voz que los cambió y borra la copia", vuelta.duracion === corta.duracion && vuelta.escenas[0].dur === 1.2 && !existsSync(join(dirVoz, "actual.json")) && !existsSync(join(dirVoz, "tiempos-originales.json")));
        }
        rmSync(mp4, { force: true });
        writeFileSync(ANIM, animBase);

        // ── voz propia (CapCut u otra): subir el audio, alinear el video a él y deshacer ──
        rmSync(dirVoz, { recursive: true, force: true });
        const tvB = N.textosVoz(JSON.parse(animBase));
        const tono = (dur, f) => { const n = Math.round(dur * SR), a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = 0.4 * Math.sin((2 * Math.PI * f * i) / SR) * Math.min(1, i / 400, (n - i) / 400); return a; };
        const silencio = (dur) => new Float32Array(Math.round(dur * SR));
        const trozos = [silencio(0.9)], reales = [];
        let tiempo = 0.9;
        tvB.forEach((e, k) => {
          const palabras = e.texto.split(/\s+/).length;
          for (let w = 0; w < palabras; w++) { const d = 0.3 + 0.1 * ((w * 7 + k) % 3); trozos.push(tono(d, 200 + 40 * ((w + k) % 5))); tiempo += d; const pa = w % 9 === 8 ? 0.3 : 0.07; trozos.push(silencio(pa)); tiempo += pa; }
          if (k < tvB.length - 1) { trozos.push(silencio(0.55)); tiempo += 0.55; reales.push(tiempo - 0.275); }
        });
        trozos.push(silencio(1.2));
        const xV = new Float32Array(trozos.reduce((a, b) => a + b.length, 0));
        let off = 0;
        for (const z of trozos) { xV.set(z, off); off += z.length; }
        mkdirSync(p("trabajo", "tmp", "prueba-externa"), { recursive: true });
        const wavV = p("trabajo", "tmp", "prueba-externa", "mi-voz.wav");
        escribirWavEstereo(wavV, xV);
        const subir = (nombre, cuerpo) => fetch(`${panel.url}/api/anim/voz/subir?nombre=${encodeURIComponent(nombre)}`, { method: "POST", headers: { "X-VideMed": "panel", "Content-Type": "application/octet-stream" }, body: cuerpo });
        let rs = await subir("mi voz (capcut).wav", readFileSync(wavV));
        prueba("voz propia: se sube el audio y queda en trabajo/anim/voz/externa, listado en el estado", rs.status === 200 && existsSync(join(dirVoz, "externa", "mi voz (capcut).wav")) && (await http("GET", "/api/anim/voz")).json.externa.archivos.includes("mi voz (capcut).wav"));
        rs = await subir("../../../escape.wav", readFileSync(wavV));
        prueba("seguridad: el nombre del audio no sale de la carpeta (se queda solo con el nombre de archivo)", rs.status === 200 && existsSync(join(dirVoz, "externa", "escape.wav")) && !existsSync(p("escape.wav")) && !existsSync(p("trabajo", "escape.wav")));
        rs = await subir("virus.exe", readFileSync(wavV));
        prueba("seguridad: solo se aceptan audios (mp3, wav, m4a, aac, ogg, flac, opus); un .exe se rechaza", rs.status === 400 && !existsSync(join(dirVoz, "externa", "virus.exe")));
        rs = await subir("vacio.wav", Buffer.alloc(10));
        prueba("un archivo vacío o diminuto se rechaza", rs.status === 400);
        h = await http("POST", "/api/accion", { nombre: "anim-voz-externa", opciones: { archivo: "no-existe.mp3" } });
        prueba("alinear con un audio que no se ha subido se explica (412)", h.codigo === 412);
        h = await http("POST", "/api/accion", { nombre: "anim-voz-externa", opciones: { archivo: "mi voz (capcut).wav", duraciones: [0.5, 3] } });
        prueba("duraciones fuera de rango (menos de 1,2 s) se rechazan", h.codigo === 400);
        h = await http("POST", "/api/accion", { nombre: "anim-voz-externa", opciones: { archivo: "mi voz (capcut).wav" } });
        const finX = await esperarTrabajo();
        const manX = existsSync(join(dirVoz, "actual.json")) ? JSON.parse(readFileSync(join(dirVoz, "actual.json"), "utf8")) : null;
        const alin = JSON.parse(readFileSync(ANIM, "utf8"));
        const desfases = tvB.slice(1).map((e, k) => Math.abs(alin.escenas.filter((q) => N.textosVoz({ escenas: [q] }).length)[k + 1].inicio - (reales[k] - 0.65)));
        prueba("voz propia: el video se ajusta a la voz — cada corte cae en la pausa entre frases (a menos de 0,35 s de la real), la voz empieza en 0:00 y dura lo mismo que el video", finX?.estado === "ok" && manX?.externa === true && manX.motor === "externa" && manX.escenas.length === tvB.length && Math.max(...desfases) < 0.35 && !manX.aproximado && Math.abs(manX.escenas.reduce((q, e) => q + e.dur, 0) - (xV.length / SR - 1.0)) < 0.3, JSON.stringify({ estado: finX?.estado, desfases: desfases.map((x) => +x.toFixed(2)), dur: alin.duracion }));
        h = await http("GET", "/api/anim/voz");
        prueba("voz propia: queda vigente para el video alineado, con el nombre del archivo, y avisa que hay que renderizar (cambiaron los tiempos)", h.json.voz?.vigente === true && h.json.voz.externa === true && h.json.voz.archivo === "mi voz (capcut).wav" && h.json.voz.cambioTiempos === true && h.json.externa.hayCopia === true && existsSync(join(dirVoz, "voz-mezcla.wav")));
        h = await http("POST", "/api/accion", { nombre: "anim-voz-externa", opciones: { archivo: "mi voz (capcut).wav", duraciones: tvB.map((e) => 3) } });
        await esperarTrabajo();
        const manail = JSON.parse(readFileSync(join(dirVoz, "actual.json"), "utf8"));
        const alin2 = JSON.parse(readFileSync(ANIM, "utf8"));
        prueba("voz propia: con duraciones a mano se respetan tal cual y repetir no encadena ajustes (siempre se parte de los tiempos originales)", manail.escenas.every((e) => Math.abs(e.dur - 3) < 0.011) && alin2.escenas.length === alin.escenas.length);
        h = await http("POST", "/api/accion", { nombre: "anim-voz-externa", opciones: { archivo: "mi voz (capcut).wav", duraciones: [3, 3] } });
        prueba("voz propia: si das menos duraciones que escenas con locución se explica el error (el trabajo falla con un mensaje claro)", await esperarTrabajo().then((t) => t?.estado !== "ok"));
        h = await http("POST", "/api/accion", { nombre: "anim-voz-externa", opciones: { deshacer: true } });
        await esperarTrabajo();
        const orig = JSON.parse(animBase), vuelta2 = JSON.parse(readFileSync(ANIM, "utf8"));
        prueba("deshacer: la animación vuelve exactamente a sus tiempos originales y se quita la voz propia", JSON.stringify(vuelta2) === JSON.stringify(orig) && !existsSync(join(dirVoz, "actual.json")) && !existsSync(join(dirVoz, "tiempos-originales.json")) && (await http("GET", "/api/anim/voz")).json.externa.hayCopia === false);
      } finally {
        if (claveAntes.k === undefined) delete process.env.ELEVENLABS_API_KEY; else process.env.ELEVENLABS_API_KEY = claveAntes.k;
        if (claveAntes.u === undefined) delete process.env.ELEVENLABS_BASE_URL; else process.env.ELEVENLABS_BASE_URL = claveAntes.u;
        writeFileSync(ANIM, animBase);
        rmSync(mp4, { force: true });
        rmSync(dirVoz, { recursive: true, force: true });
        rmSync(p("trabajo", "salida", "voz"), { recursive: true, force: true });
        rmSync(p("trabajo", "tmp", "prueba-externa"), { recursive: true, force: true });
      }
    }
    // ── Parte 1: laboratorio de voz (API) y Parte 2: Panel de Videos (API, datos en carpeta temporal) ──
    {
      const cfgReal = readFileSync(p("voz.config.json"), "utf8"), dicReal = readFileSync(p("pronunciacion.json"), "utf8");
      const DATOS = join(DIR_PRUEBA, "data"), CONFIG = join(DIR_PRUEBA, "config");
      h = await http("GET", "/api/voz/config");
      prueba("laboratorio: la configuración trae la voz por defecto (coral), las instrucciones de la locutora, el diccionario y el uso del mes", h.codigo === 200 && h.json.config.voz === "coral" && /locutora colombiana de 24 años/.test(h.json.config.instrucciones) && h.json.pronunciacion["imnoba.com"] === "im-no-ba punto com" && h.json.claveOpenAI === true && h.json.uso.mes === N.hoyISO().slice(0, 7), h.texto.slice(0, 200));
      h = await http("POST", "/api/voz/preparar", { texto: "Cuesta $950.000.000, tiene 85 m² y está en imnoba.com..." });
      prueba("laboratorio: «Así se lee en voz alta» devuelve el texto preparado (cifras a palabras, dominio como suena, sin puntos suspensivos) y la lista de cambios", h.codigo === 200 && /novecientos cincuenta millones de pesos/.test(h.json.texto) && /ochenta y cinco metros cuadrados/.test(h.json.texto) && /im-no-ba punto com/.test(h.json.texto) && !/\.\.\./.test(h.json.texto) && h.json.cambios.some((c) => c.tipo === "numero"));
      // generar 3 versiones
      const antesLab = mock.estado.voz.speech;
      const uso0 = (await http("GET", "/api/voz/uso")).json;
      const textoLab = "Esta propiedad cuesta $950.000.000 y tiene 85 m². Regístrala gratis en imnoba.com.";
      const vars = [{ voz: "coral", instrucciones: "Sé alegre uno." }, { voz: "nova", instrucciones: "Sé alegre dos." }, { voz: "sage", instrucciones: "Sé alegre tres." }];
      h = await http("POST", "/api/voz/lab", { texto: textoLab, variantes: vars });
      const entradas = mock.estado.voz.speech - antesLab;
      prueba("laboratorio: genera 3 versiones lado a lado (una llamada por versión) con la voz y las instrucciones de cada una, y al servicio le llega el texto YA preparado (sin cifras ni siglas)", h.codigo === 200 && entradas === 3 && h.json.versiones.length === 3 && h.json.versiones.map((x) => x.voz).join() === "coral,nova,sage" && h.json.versiones.every((x) => /^\/cache-audio\/lab-.+\.mp3$/.test(x.url) && x.desdeCache === false && x.costoUsd > 0) && !/\d/.test(mock.estado.ultimaVoz.entrada) && /novecientos cincuenta millones de pesos/.test(mock.estado.ultimaVoz.entrada) && /im-no-ba punto com/.test(mock.estado.ultimaVoz.entrada) && /Sé alegre/.test(mock.estado.ultimaVoz.instrucciones), JSON.stringify(h.json).slice(0, 300));
      const au = await fetch(panel.url + h.json.versiones[0].url);
      const bytesAu = Buffer.from(await au.arrayBuffer());
      prueba("laboratorio: cada versión se escucha desde el panel (mp3 ya sin silencios largos y a −14 LUFS para comparar al mismo volumen)", au.status === 200 && /audio\/mpeg/.test(au.headers.get("content-type")) && bytesAu.length > 1000);
      const A = await import("../audio.mjs"), { buscarFfmpeg: bf2 } = await import("../medios.mjs");
      const lufs = A.medirLUFS(bf2().ffmpeg, join(DIR_PRUEBA, "cache", "audio", h.json.versiones[1].url.split("/").pop()));
      prueba("laboratorio: el audio de escucha queda a −14 ±1,5 LUFS", lufs && Math.abs(lufs.integrado + 14) < 1.5, JSON.stringify(lufs));
      const antesRep = mock.estado.voz.speech;
      h = await http("POST", "/api/voz/lab", { texto: textoLab, variantes: vars });
      prueba("laboratorio: repetir lo mismo sale de la caché (0 llamadas, costo 0) y el contador de caracteres NO sube", mock.estado.voz.speech === antesRep && h.json.versiones.every((x) => x.desdeCache === true && x.costoUsd === 0));
      const usoA = (await http("GET", "/api/voz/uso")).json;
      const textoPrep = h.json.textoHablado;
      prueba("contador mensual: suma solo los caracteres realmente enviados (3 audios nuevos; los de la caché no), por motor, en data/uso-voz.json", usoA.total - uso0.total === textoPrep.length * 3 && usoA.porMotor.openai.solicitudes - (uso0.porMotor.openai?.solicitudes ?? 0) === 3 && existsSync(join(DATOS, "uso-voz.json")) && JSON.parse(readFileSync(join(DATOS, "uso-voz.json"), "utf8"))[usoA.mes].openai.caracteres + (usoA.porMotor.eleven?.caracteres ?? 0) === usoA.total, JSON.stringify({ antes: uso0.total, despues: usoA.total, por: textoPrep.length }));
      h = await http("POST", "/api/voz/lab", { texto: textoLab, variantes: [{ voz: "../../x", instrucciones: "" }, ...vars, ...vars] });
      prueba("laboratorio: máximo 3 versiones, una voz inválida cae a la de la configuración y sin instrucciones usa las de siempre", h.codigo === 200 && h.json.versiones.length === 3 && h.json.versiones[0].voz === "coral" && /locutora colombiana/.test(h.json.versiones[0].instrucciones));
      h = await http("POST", "/api/voz/lab", { texto: "hola", variantes: vars });
      prueba("laboratorio: un guion demasiado corto se rechaza (400)", h.codigo === 400);
      // «me gustó»: guardar como voz por defecto
      h = await http("POST", "/api/voz/config", { voz: "nova", instrucciones: "Habla muy sonriente y cercana.", velocidad: 3, formato: "exe" });
      const cfgGuardada = JSON.parse(readFileSync(join(CONFIG, "voz.config.json"), "utf8"));
      prueba("laboratorio: «Me gustó esta» guarda la voz y las instrucciones en voz.config.json; lo inválido (velocidad 3, formato exe) se corrige", h.codigo === 200 && cfgGuardada.voz === "nova" && cfgGuardada.instrucciones === "Habla muy sonriente y cercana." && cfgGuardada.velocidad === 1 && cfgGuardada.formato === "mp3");
      await http("POST", "/api/anim/voz/probar", {});
      const uvc = mock.estado.ultimaVoz;
      prueba("voz por defecto: lo guardado en voz.config.json es lo que usa «Probar voz» del Estudio (voz nova + sus instrucciones), sin tocar el resto de estilos", uvc.voz === "nova" && /Habla muy sonriente y cercana\./.test(uvc.instrucciones) && uvc.formato === "mp3");
      h = await http("POST", "/api/anim/voz/probar", { estilo: "paisa-f" });
      prueba("… y un estilo propio (paisa) sigue con su voz y su acento", mock.estado.ultimaVoz.voz === "coral" && /paisa/.test(mock.estado.ultimaVoz.instrucciones) && !/Habla muy sonriente/.test(mock.estado.ultimaVoz.instrucciones));
      h = await http("POST", "/api/voz/pronunciacion", { diccionario: { Zork: "Zórk", _nota: "hola" } });
      const prz = await http("POST", "/api/voz/preparar", { texto: "Mira a Zork ahora." });
      prueba("diccionario de pronunciación: se guarda en pronunciacion.json y se aplica a la siguiente preparación; valores que no son texto se rechazan (400)", h.codigo === 200 && JSON.parse(readFileSync(join(CONFIG, "pronunciacion.json"), "utf8")).Zork === "Zórk" && /Zórk/.test(prz.json.texto) && (await http("POST", "/api/voz/pronunciacion", { diccionario: { a: 5 } })).codigo === 400 && (await http("POST", "/api/voz/pronunciacion", { diccionario: [1] })).codigo === 400);
      prueba("seguridad: las pruebas NO tocaron tu voz.config.json ni tu pronunciacion.json reales (se usó una carpeta temporal)", readFileSync(p("voz.config.json"), "utf8") === cfgReal && readFileSync(p("pronunciacion.json"), "utf8") === dicReal);
      await http("POST", "/api/voz/config", { voz: "coral", instrucciones: N.INSTRUCCIONES_LOCUTORA });
      // generación con la voz: el texto se prepara y la pista queda normalizada
      h = await http("POST", "/api/accion", { nombre: "anim-voz", opciones: { estilo: "locutora", ritmo: "agil" } });
      const finG = await esperarTrabajo();
      const manG = existsSync(p("trabajo", "anim", "voz", "actual.json")) ? JSON.parse(readFileSync(p("trabajo", "anim", "voz", "actual.json"), "utf8")) : null;
      const lufsVoz = manG ? A.medirLUFS(bf2().ffmpeg, p("trabajo", "anim", "voz", "voz-mezcla.wav")) : null;
      prueba("voz del video: con la locutora por defecto la pista sale normalizada (≈ −16 LUFS), el preparador actuó y los audios van a cache/audio/ (no a trabajo/)", finG?.estado === "ok" && manG?.preparado?.normalizadaLUFS === -16 && lufsVoz && Math.abs(lufsVoz.integrado + 16) < 2 && readdirSync(join(DIR_PRUEBA, "cache", "audio")).length >= 4 && !existsSync(p("trabajo", "anim", "voz", "cache")), JSON.stringify({ manG: manG?.preparado, lufsVoz, estado: finG?.estado }));
      {
        // el video generado se registra con la voz usada y las instrucciones (lo que corre el panel al renderizar)
        mkdirSync(DATOS, { recursive: true });
        rmSync(join(DATOS, "videos.json"), { force: true });
        const rcv = spawnSync(process.execPath, [p("scripts", "panel", "registrar-video.mjs")], { encoding: "utf8", env: { ...process.env } });
        const rv = JSON.parse(readFileSync(join(DATOS, "videos.json"), "utf8")).videos[0];
        prueba("videos: el registro automático guarda la voz usada (motor · voz · modelo · estilo) y las instrucciones de voz del manifiesto", rcv.status === 0 && /^OpenAI · coral · gpt-4o-mini-tts · locutora$/.test(rv.voz_usada) && /locutora colombiana de 24 años/.test(rv.instrucciones_voz), JSON.stringify({ voz: rv.voz_usada, ins: rv.instrucciones_voz.slice(0, 50), out: rcv.stdout + rcv.stderr }).slice(0, 300));
      }
      rmSync(p("trabajo", "anim", "voz"), { recursive: true, force: true });
      rmSync(p("trabajo", "salida", "voz"), { recursive: true, force: true });

      {
        const antesM = mock.estado.voz.speech;
        // asíncrono: el servidor simulado vive en este mismo proceso y tiene que poder responder mientras corre el script
        const rm = await new Promise((ok) => { const c = spawn(process.execPath, [p("scripts", "anim", "muestras-voz.mjs")], { env: { ...process.env, OPENAI_API_KEY: "prueba", OPENAI_BASE_URL: mock.url } }); let o = ""; c.stdout.on("data", (d) => (o += d)); c.stderr.on("data", (d) => (o += d)); const t = setTimeout(() => c.kill(), 60000); c.on("close", (status) => { clearTimeout(t); ok({ status, stdout: o, stderr: "" }); }); });
        const dm = p("trabajo", "salida", "voz", "muestras");
        const archivosM = existsSync(dm) ? readdirSync(dm) : [];
        prueba("muestras de voz: `npm run voz:muestras` genera las 3 frases reales de Imnoba con coral, nova, shimmer y sage (12 mp3) y una página con reproductores; hablan de «propiedad o vehículo»", rm.status === 0 && archivosM.filter((f) => f.endsWith(".mp3")).length === 12 && archivosM.includes("muestras.html") && mock.estado.voz.speech - antesM === 12 && /propiedad o un vehículo/.test(readFileSync(join(dm, "muestras.html"), "utf8")) && JSON.parse(readFileSync(p("package.json"), "utf8")).scripts["voz:muestras"] === "node scripts/anim/muestras-voz.mjs", rm.stdout + rm.stderr);
        rmSync(dm, { recursive: true, force: true });
      }
      // ── Panel de Videos ──
      const ARCH = join(DATOS, "videos.json");
      rmSync(ARCH, { force: true });
      rmSync(join(DATOS, "backups"), { recursive: true, force: true });
      const antesVid = (await http("GET", "/api/videos")).json.videos.length;
      h = await http("POST", "/api/videos/guardar", { video: { titulo: "Estafas con propiedades: 3 señales para no caer", serie: "estafas", gancho: "¿Te ofrecieron una propiedad demasiado barata?", estado: "guion", guion: "Primera frase." } });
      const v1 = h.json.video;
      prueba("videos: crear una idea guarda data/videos.json (JSON legible, con sangría), sin archivos temporales a medias", h.codigo === 200 && v1.id && v1.estado === "guion" && existsSync(ARCH) && /\n  "videos": \[/.test(readFileSync(ARCH, "utf8")) && readdirSync(DATOS).every((f) => !f.endsWith(".tmp")) && JSON.parse(readFileSync(ARCH, "utf8")).videos.length === antesVid + 1);
      h = await http("POST", "/api/videos/guardar", { video: { titulo: "3 señales de estafas en propiedades", serie: "estafas" } });
      prueba("evitar repetición: al guardar una idea parecida (últimos 60 días) la respuesta trae el aviso con el video parecido", h.codigo === 200 && h.json.parecidos.length === 1 && h.json.parecidos[0].video.id === v1.id && h.json.parecidos[0].motivo === "título");
      h = await http("POST", "/api/videos/parecidos", { titulo: "Cómo cocinar arroz perfecto" });
      prueba("evitar repetición: un título distinto no da avisos", h.codigo === 200 && h.json.parecidos.length === 0);
      h = await http("POST", "/api/videos/guardar", { video: { titulo: "" } });
      prueba("videos: sin título se rechaza (400) con un mensaje claro", h.codigo === 400 && /título/i.test(h.json.error));
      h = await http("POST", "/api/videos/metrica", { id: v1.id, metrica: { plataforma: "instagram", vistas: 1200, guardados: 40, compartidos: 9 } });
      prueba("métricas: se agrega una medición (con fecha de hoy por defecto) y se conserva el historial", h.codigo === 200 && h.json.video.metricas.length === 1 && h.json.video.metricas[0].fecha_medicion === N.hoyISO() && h.json.video.metricas[0].vistas === 1200);
      h = await http("POST", "/api/videos/metrica", { id: v1.id, metrica: { vistas: "mucho", guardados: -3 } });
      prueba("métricas: sin ningún número válido se rechaza (400); id inexistente da 404", h.codigo === 400 && (await http("POST", "/api/videos/metrica", { id: "nada", metrica: { vistas: 5 } })).codigo === 404);
      h = await http("POST", "/api/videos/accion", { id: v1.id, accion: { tipo: "registro_agente", cantidad: 2, notas: "desde el reel" } });
      prueba("acciones de negocio: se registran con tipo, cantidad, fecha y notas (tipo desconocido → «otro»)", h.codigo === 200 && h.json.video.acciones[0].tipo === "registro_agente" && h.json.video.acciones[0].cantidad === 2 && (await http("POST", "/api/videos/accion", { id: v1.id, accion: { tipo: "inventada" } })).json.video.acciones[1].tipo === "otro");
      h = await http("POST", "/api/videos/guardar", { video: { id: v1.id, titulo: "Estafas con propiedades (editado)" } });
      prueba("editar un video por el formulario NO pierde sus métricas, acciones ni publicaciones (solo cambia lo que se envía)", h.codigo === 200 && h.json.video.titulo.endsWith("(editado)") && h.json.video.metricas.length === 1 && h.json.video.acciones.length === 2 && h.json.video.creado === v1.creado);
      h = await http("POST", "/api/videos/estado", { id: v1.id, estado: "publicado" });
      prueba("pipeline: mover a «publicado» pone la fecha de hoy si no tenía; un estado inválido se rechaza (400)", h.codigo === 200 && h.json.video.estado === "publicado" && h.json.video.fecha_publicacion === N.hoyISO() && (await http("POST", "/api/videos/estado", { id: v1.id, estado: "volando" })).codigo === 400);
      h = await http("POST", "/api/videos/duplicar", { id: v1.id });
      prueba("duplicar como nueva idea: copia título, gancho, serie y guion; sin métricas, acciones ni fechas", h.codigo === 200 && h.json.video.estado === "idea" && h.json.video.metricas.length === 0 && h.json.video.gancho === v1.gancho && h.json.video.id !== v1.id);
      const respaldos = existsSync(join(DATOS, "backups")) ? readdirSync(join(DATOS, "backups")) : [];
      prueba("copias de seguridad: antes de cada escritura se guarda una copia con fecha en data/backups/ (y es un JSON válido de un estado anterior)", respaldos.length >= 3 && respaldos.every((f) => /^videos-\d{4}-\d{2}-\d{2}T.*\.json$/.test(f)) && JSON.parse(readFileSync(join(DATOS, "backups", respaldos.sort()[0]), "utf8")).videos.length < JSON.parse(readFileSync(ARCH, "utf8")).videos.length, String(respaldos.length));
      for (let i = 0; i < 36; i++) await http("POST", "/api/videos/metrica", { id: v1.id, metrica: { vistas: 2000 + i } });
      const nResp = readdirSync(join(DATOS, "backups")).length;
      prueba("copias de seguridad: se conservan solo las últimas 30 (36 escrituras más no las hacen crecer)", nResp <= 30 && nResp >= 20, String(nResp));
      // archivo corrupto: no se pisa
      const bueno = readFileSync(ARCH, "utf8");
      writeFileSync(ARCH, "{ esto no es json");
      h = await http("GET", "/api/videos");
      const sigue = readFileSync(ARCH, "utf8") === "{ esto no es json";
      const h2 = await http("POST", "/api/videos/guardar", { video: { titulo: "No debe pisar" } });
      prueba("si data/videos.json está corrupto se avisa con un mensaje claro y NO se sobrescribe (ni al guardar); se puede restaurar a mano", h.codigo === 500 && /no es un JSON válido/.test(h.json.error) && sigue && h2.codigo === 500 && readFileSync(ARCH, "utf8") === "{ esto no es json");
      writeFileSync(ARCH, bueno);
      // CSV
      const csvOk = N.CSV_EJEMPLO + "\n";
      h = await http("POST", "/api/videos/importar/vista-previa", { csv: csvOk + "Malo,inventada,myspace,ftp://x,31/02/2026,doce,-1,\n" });
      prueba("importar: la vista previa dice cuántas filas valen, cuántas tienen errores (con su número de fila) y no guarda nada", h.codigo === 200 && h.json.resumen.validas === 3 && h.json.resumen.conError === 1 && h.json.filas[3].fila === 5 && h.json.filas[3].errores.length >= 4 && JSON.parse(readFileSync(ARCH, "utf8")).videos.length === (await http("GET", "/api/videos")).json.videos.length);
      const totalAntes = (await http("GET", "/api/videos")).json.videos.length;
      h = await http("POST", "/api/videos/importar", { csv: csvOk + "Malo,inventada,myspace,ftp://x,31/02/2026,doce,-1,\n" });
      const lista = (await http("GET", "/api/videos")).json.videos;
      prueba("importar: crea solo las filas válidas (3, publicadas, con su publicación y una medición) y las de error no entran", h.codigo === 200 && h.json.importados === 3 && h.json.conError === 1 && lista.length === totalAntes + 3 && lista.filter((x) => x.origen === "importado").length === 3 && lista.find((x) => x.titulo.startsWith("Adivina")).metricas[0].vistas === 52300);
      h = await http("POST", "/api/videos/importar", { csv: csvOk });
      prueba("importar: volver a cargar el mismo archivo no duplica nada (los enlaces repetidos se omiten)", h.json.importados === 0 && h.json.omitidas === 3 && (await http("GET", "/api/videos")).json.videos.length === lista.length);
      h = await http("POST", "/api/videos/importar/vista-previa", { csv: "nombre,otra\nx,y\n" });
      prueba("importar: un CSV sin las columnas obligatorias explica cuáles faltan (400)", h.codigo === 400 && /titulo|plataforma|fecha/.test(h.json.error));
      const ex = await fetch(panel.url + "/api/videos/exportar.csv"), exBuf = Buffer.from(await ex.arrayBuffer()), exTxt = exBuf.toString("utf8").replace(/^\uFEFF/, "");
      const ej = await fetch(panel.url + "/api/videos/ejemplo.csv"), ejTxt = await ej.text();
      prueba("exportar: baja un CSV con todos los videos (UTF-8 con BOM para Excel, una fila por publicación) y hay un CSV de ejemplo descargable", ex.status === 200 && /text\/csv/.test(ex.headers.get("content-type")) && /attachment/.test(ex.headers.get("content-disposition")) && exBuf.subarray(0, 3).toString("hex") === "efbbbf" && exTxt.startsWith("titulo,serie,plataforma,url,fecha,vistas") && exTxt.includes("Adivina el precio de esta propiedad") && ej.status === 200 && ejTxt.includes("Estafas con propiedades: 3 señales para no caer"), JSON.stringify({ ej: ej.status, ejTxt: ejTxt.slice(0, 120), st: ex.status, ct: ex.headers.get("content-type"), cd: ex.headers.get("content-disposition"), bom: exBuf.subarray(0, 3).toString("hex"), ini: exTxt.slice(0, 60), tiene: exTxt.includes("Adivina el precio de esta propiedad") }));
      h = await http("POST", "/api/videos/eliminar", { id: v1.id });
      prueba("eliminar: quita el video (queda copia en data/backups) y uno inexistente da 404", h.codigo === 200 && !(await http("GET", "/api/videos")).json.videos.some((x) => x.id === v1.id) && (await http("POST", "/api/videos/eliminar", { id: v1.id })).codigo === 404);
      // registro desde la línea de comandos (lo que corre el panel como último paso del render)
      const reg0 = (await http("GET", "/api/videos")).json.videos.length;
      const rc = spawnSync(process.execPath, [p("scripts", "panel", "registrar-video.mjs")], { encoding: "utf8", env: { ...process.env } });
      const reg1 = (await http("GET", "/api/videos")).json.videos;
      const rc2 = spawnSync(process.execPath, [p("scripts", "panel", "registrar-video.mjs")], { encoding: "utf8", env: { ...process.env } });
      const reg2 = (await http("GET", "/api/videos")).json.videos;
      prueba("registro automático: la animación activa se registra como «grabado» una sola vez (volver a renderizar el mismo video actualiza, no duplica)", rc.status === 0 && /Registrado en el Panel de Videos/.test(rc.stdout) && reg1.length === reg0 + 1 && reg1[0].origen === "generador" && reg1[0].estado === "grabado" && /Actualizado/.test(rc2.stdout) && reg2.length === reg1.length, `${rc.stdout}${rc.stderr}`);
      const vg = reg2.find((x) => x.origen === "generador");
      await http("POST", "/api/videos/estado", { id: vg.id, estado: "programado" });
      spawnSync(process.execPath, [p("scripts", "panel", "registrar-video.mjs")], { encoding: "utf8", env: { ...process.env } });
      prueba("registro automático: nunca baja de estado (un video ya programado o publicado se queda así al volver a renderizarlo)", (await http("GET", "/api/videos")).json.videos.find((x) => x.id === vg.id).estado === "programado");
      const srv = readFileSync(p("scripts", "panel", "servidor.mjs"), "utf8");
      prueba("el panel registra el video como último paso de «Renderizar» y de «Ponerla al video ya renderizado»", (srv.match(/registrar-video\.mjs/g) ?? []).length >= 2 && /Registrar el video en el Panel de Videos/.test(srv));
      const vjs = readFileSync(p("scripts", "panel", "web", "videos.js"), "utf8"), ljs = readFileSync(p("scripts", "panel", "web", "lab.js"), "utf8"), idx = readFileSync(p("scripts", "panel", "web", "index.html"), "utf8"), css = readFileSync(p("scripts", "panel", "web", "estilos.css"), "utf8");
      prueba("interfaz: el menú tiene «Videos» y «Voz»; el Panel de Videos trae las 8 pantallas (resumen, biblioteca, detalle, registrar métricas, pipeline arrastrable, qué funciona, evitar repetición, importar/exportar), con estados vacíos, filtros, orden y búsqueda", ['href="#/videos"', 'href="#/voz"'].every((t) => idx.includes(t)) && ["vistaResumen", "vistaBiblioteca", "vistaDetalle", "vistaMetricas", "vistaPipeline", "vistaFunciona", "vistaNueva", "vistaImportar", "ondragstart", "ondrop", "estadoVacio", "type: \"search\"", "PV.orden", "No pude leer data/videos.json"].every((t) => vjs.includes(t)));
      prueba("interfaz: el laboratorio genera y escucha hasta 3 versiones, deja editar instrucciones, marcar «Me gustó esta» como voz por defecto, ver el texto preparado, editar el diccionario y ver el uso del mes", ["Generar y escuchar", "Me gustó esta", "api/voz/lab", "api/voz/config", "api/voz/preparar", "api/voz/pronunciacion", "Uso este mes", "Diccionario de pronunciación", "coral", "nova", "shimmer", "sage"].every((t) => ljs.includes(t)));
      prueba("diseño: azul marino (#02224e) y dorado (#ffc500) con fuente Inter, solo dentro del Panel de Videos y el laboratorio", /--pv-navy: #02224e/.test(css) && /--pv-oro: #ffc500/.test(css) && /font-family: "Inter"/.test(css) && /body\.modo-pv|modo-pv/.test(readFileSync(p("scripts", "panel", "web", "app.js"), "utf8")));
      const fz = await fetch(panel.url + "/fuentes/inter-latin-700-normal.woff2"), fx = await fetch(panel.url + "/fuentes/..%2F..%2Fpackage.json");
      prueba("la fuente Inter se sirve desde el panel (woff2) y la ruta no deja salir de la carpeta", fz.status === 200 && /woff2/.test(fz.headers.get("content-type")) && fx.status !== 200);
    }
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
    {
      spawnSync(process.execPath, [p("scripts", "anim", "ejemplo.mjs"), "--tema=anomalia"], { cwd: RAIZ });
      const animA = JSON.parse(readFileSync(p("src", "data", "animacion.json"), "utf8"));
      const ultimo = Math.round(animA.duracion * 60) - 1;
      const rqa = spawnSync(process.execPath, [p("scripts", "anim", "previa.mjs"), "--qa"], { cwd: RAIZ, encoding: "utf8", timeout: 900000 });
      prueba("previa.mjs --qa del ensayo «Anomalía» (10 piezas a medida): una captura por escena y QA sin problemas (márgenes, vacíos, congelados)", rqa.status === 0 && readdirSync(p("trabajo", "tmp", "anim-previa")).filter((x) => /^escena-\d+\.png$/.test(x)).length === 10, (rqa.stdout + rqa.stderr).slice(-800));
      // bucle sin costuras: el último fotograma tiene EXACTAMENTE la geometría del primero (el disco de filotaxis)
      const dirB = p("trabajo", "tmp", "anim-bucle");
      const rqb = spawnSync(process.execPath, [p("scripts", "anim", "previa.mjs"), `--frames=0,${ultimo}`, `--salida=${dirB}`], { cwd: RAIZ, encoding: "utf8", timeout: 600000 });
      const { createRequire: cr } = await import("node:module");
      const { PNG } = cr(import.meta.url)("pngjs");
      const A = PNG.sync.read(readFileSync(join(dirB, "escena-00000.png"))), B = PNG.sync.read(readFileSync(join(dirB, `escena-${String(ultimo).padStart(5, "0")}.png`)));
      let difieren = 0, total = 0;
      for (let y = 800; y < 1500; y++) for (let x = 140; x < 940; x++) { const i = (y * A.width + x) * 4; total++; if (Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2]) > 24) difieren++; }
      prueba("Anomalía · cierre en bucle: el último fotograma repite la geometría del primero (disco de 2.400 puntos; ≤ 0,5 % de píxeles distintos en la zona del disco)", rqb.status === 0 && difieren / total < 0.005, `${difieren}/${total} ${(rqb.stdout + rqb.stderr).slice(-300)}`);
    }
    {
      spawnSync(process.execPath, [p("scripts", "anim", "ejemplo.mjs"), "--tema=bogota-real"], { cwd: RAIZ });
      const rqr = spawnSync(process.execPath, [p("scripts", "anim", "previa.mjs"), "--qa"], { cwd: RAIZ, encoding: "utf8", timeout: 900000 });
      prueba("previa.mjs --qa del video realista «Bogotá, la ciudad sin metro» (11 piezas): una captura por escena y QA sin problemas (márgenes, vacíos, congelados)", rqr.status === 0 && readdirSync(p("trabajo", "tmp", "anim-previa")).filter((x) => /^escena-\d+\.png$/.test(x)).length === 11, (rqr.stdout + rqr.stderr).slice(-800));
    }
    {
      spawnSync(process.execPath, [p("scripts", "anim", "ejemplo.mjs"), "--tema=parada-optima"], { cwd: RAIZ });
      const rqp = spawnSync(process.execPath, [p("scripts", "anim", "previa.mjs"), "--qa"], { cwd: RAIZ, encoding: "utf8", timeout: 900000 });
      prueba("previa.mjs --qa de «La regla del 37 %» de IMNOBA (8 piezas par-* con casas y figuras realistas + cierre): una captura por escena y QA sin problemas (márgenes, vacíos, congelados, consola)", rqp.status === 0 && readdirSync(p("trabajo", "tmp", "anim-previa")).filter((x) => /^escena-\d+\.png$/.test(x)).length === 9, (rqp.stdout + rqp.stderr).slice(-500));
    }
    {
      spawnSync(process.execPath, [p("scripts", "anim", "ejemplo.mjs"), "--tema=medicos-experimento"], { cwd: RAIZ });
      const rqm = spawnSync(process.execPath, [p("scripts", "anim", "previa.mjs"), "--qa"], { cwd: RAIZ, encoding: "utf8", timeout: 900000 });
      prueba("previa.mjs --qa del video médico «Médicos que se probaron a sí mismos» (12 piezas): una captura por escena y QA sin problemas (márgenes, vacíos, congelados, consola)", rqm.status === 0 && readdirSync(p("trabajo", "tmp", "anim-previa")).filter((x) => /^escena-\d+\.png$/.test(x)).length === 12, (rqm.stdout + rqm.stderr).slice(-500));
    }
    for (const [tema, esperadas, texto] of [["conchas", 9, "las conchas (DIALES, PAPEL, OSCILO, CUBO, SPLIT, PUNCH)"], ["documental", 8, "los jueces (DUO, PAPEL, PILARES, CICLO, PUNCH, MITO)"], ["metro-bogota", 12, "el piloto Metro de Bogotá (9 piezas a medida: plano, fricción, rieles, carrera, capacidad, suelo 3D, curva, silueta y balanza + PUNCH)"]]) {
      spawnSync(process.execPath, [p("scripts", "anim", "ejemplo.mjs"), `--tema=${tema}`], { cwd: RAIZ });
      const rqd = spawnSync(process.execPath, [p("scripts", "anim", "previa.mjs"), "--qa"], { cwd: RAIZ, encoding: "utf8", timeout: 600000 });
      prueba(`previa.mjs --qa del ejemplo documental de ${texto} con la paleta Retro-Científica: una captura por escena y QA sin problemas (márgenes, vacíos, congelados)`, rqd.status === 0 && readdirSync(p("trabajo", "tmp", "anim-previa")).filter((x) => /^escena-\d+\.png$/.test(x)).length === esperadas, (rqd.stdout + rqd.stderr).slice(-800));
    }
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
