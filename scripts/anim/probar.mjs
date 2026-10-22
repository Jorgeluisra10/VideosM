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
  prueba("hay solo dos paletas: IMNOBA y Medicina Clínica", Object.keys(N.PALETAS).sort().join() === "imnoba,medicina" && /IMNOBA \(Colores oficiales de marca\)/.test(imn.nombre) && N.PALETAS.medicina.nombre === "Medicina Clínica");
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
  prueba("las escenas 3D usan <ThreeCanvas width={W} height={H}>, luces, extrusión y la cámara interpolada con useCurrentFrame()/spring()", /<ThreeCanvas width=\{W\} height=\{H\}/.test(m3d) && /directionalLight/.test(m3d) && /ambientLight/.test(m3d) && /ExtrudeGeometry/.test(m3d) && /useCurrentFrame/.test(m3d) && /spring\(/.test(m3d));

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
