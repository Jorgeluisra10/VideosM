#!/usr/bin/env node
/**
 * VideMed · Fase 5 — renderizado del video final, robusto para equipos justos de memoria o disco.
 *
 *   npm run build                       render completo (reanuda donde se quedó si se cayó)
 *   npm run build -- --desde-cero       ignora lo ya renderizado
 *   npm run build -- --ensamblar        solo une los fotogramas ya hechos con el audio (sin Chrome)
 *   npm run build -- --concurrency=2    más hilos si tu equipo tiene RAM de sobra
 *   npm run build -- --tanda=60         fotogramas por tanda (por defecto 100)
 *   npm run build -- --memoria-min=0.6  GB de memoria libre que espera antes de cada tanda (def. 0.9)
 *   npm run build -- --bundle=<carpeta> reutiliza un paquete ya empaquetado (evita el pico de memoria)
 *
 * Cómo funciona (y por qué):
 *   1. Audio: se mezcla en Node (voz + ambiente + efectos), sin Chrome: scripts/audio.mjs.
 *   2. Imagen: los fotogramas se renderizan en TANDAS pequeñas, cada una con un Chrome nuevo.
 *      Si una tanda falla (memoria virtual agotada, Chrome caído...) se reintenta sola, y los
 *      fotogramas ya hechos no se repiten, ni siquiera si cierras y vuelves a lanzar el comando.
 *   3. Se ensambla con el ffmpeg incluido en Remotion → trabajo/salida/video-terminado.mp4 (H.264 + AAC).
 *   El paquete (bundle) se cachea por huella de src/ y public/: solo se vuelve a empaquetar si cambias algo.
 *   Antes de cada tanda espera a que haya memoria libre suficiente (Windows mata procesos si no).
 *   Los temporales van dentro del proyecto (si C: está lleno, el render normal de Remotion falla).
 */
import { RAIZ_PROYECTO, TMP_PROYECTO } from "./_tmp.mjs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition } from "@remotion/renderer";
import { abrirNavegador } from "./navegador.mjs";
import { mezclarAudio } from "./audio.mjs";

const args = process.argv.slice(2);
const valor = (nombre) => args.find((a) => a.startsWith(`--${nombre}=`))?.split("=")[1];

const ramGB = os.totalmem() / 2 ** 30;
const CONCURRENCIA = Number(valor("concurrency") ?? (ramGB < 10 ? 1 : 2));
const TANDA = Number(valor("tanda") ?? 100);
const MAX_INTENTOS = 6;
const MEMORIA_MIN_GB = Number(valor("memoria-min") ?? 0.6);
const ESPERA_MAX_MIN = Number(valor("espera-max") ?? 40);

const TRABAJO = join(RAIZ_PROYECTO, "trabajo", "tmp", "render");
const FOTOGRAMAS = join(TRABAJO, "fotogramas");
const TANDA_DIR = join(TRABAJO, "tanda");
const AUDIO = join(TRABAJO, "mezcla.wav");
const SALIDA = join(RAIZ_PROYECTO, "trabajo", "salida", "video-terminado.mp4");
const FPS = 60;

if (args.includes("--desde-cero")) rmSync(TRABAJO, { recursive: true, force: true });
mkdirSync(FOTOGRAMAS, { recursive: true });
mkdirSync(join(RAIZ_PROYECTO, "trabajo", "salida"), { recursive: true });

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const nombre = (f) => `f-${String(f).padStart(5, "0")}.jpg`;
const hecho = (f) => existsSync(join(FOTOGRAMAS, nombre(f)));

function buscarFfmpeg() {
  const base = join(RAIZ_PROYECTO, "node_modules", "@remotion");
  const exe = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  for (const d of readdirSync(base)) {
    if (d.startsWith("compositor-") && existsSync(join(base, d, exe))) return { ffmpeg: join(base, d, exe), ffprobe: join(base, d, exe.replace("ffmpeg", "ffprobe")) };
  }
  throw new Error("No encuentro el ffmpeg incluido en Remotion (@remotion/compositor-*). Ejecuta: npm install");
}

console.log(`🎬 VideMed · render robusto  (RAM ${ramGB.toFixed(1)} GB, libre ${(os.freemem() / 2 ** 30).toFixed(1)} GB, hilos ${CONCURRENCIA}, tandas de ${TANDA})`);
console.log(`   temporales en ${TRABAJO}`);

/**
 * UN solo Chrome persistente para la composición y todos los fotogramas. Un proceso que ya tiene su
 * memoria comprometida no la pierde; el que falla en equipos justos es el que intenta crecer más tarde.
 * Solo se cierra si Chrome realmente cayó, o cada RECICLAR_CADA fotogramas (acumula memoria).
 * Un simple timeout NO lo cierra: soltar la memoria que ya teníamos es lo peor que podemos hacer.
 */
const RECICLAR_CADA = 1200;
let navegador = null;
let fotogramasEnNavegador = 0;

async function cerrarNavegador() {
  if (!navegador) return;
  try {
    await navegador.close({ silent: true });
  } catch {
    /* ya estaba cerrado */
  }
  navegador = null;
  fotogramasEnNavegador = 0;
}

const chromeCayo = (e) => /target closed|protocol error|browser (has been )?closed|disconnected|crash|out of memory|ECONNRESET/i.test(String(e?.message ?? e));

async function conNavegador(fn) {
  navegador ??= await abrirNavegador();
  try {
    return await fn(navegador);
  } catch (e) {
    if (chromeCayo(e)) await cerrarNavegador();
    throw e;
  }
}

async function reintentar(etiqueta, fn) {
  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    try {
      if (!navegador) await esperarMemoria(etiqueta);
      return await fn();
    } catch (e) {
      const msg = String(e?.message ?? e).split("\n")[0].slice(0, 110);
      if (intento === MAX_INTENTOS) throw new Error(`${etiqueta}: ${msg}`);
      const espera = 4000 * intento;
      console.warn(`   ↻ ${etiqueta} falló (${msg}). Reintento ${intento}/${MAX_INTENTOS - 1} en ${espera / 1000}s...`);
      await dormir(espera);
    }
  }
}

/** Memoria libre que importa: en Windows es la memoria COMPROMETIDA (RAM + archivo de paginación). */
function memoriaLibreGB() {
  if (process.platform === "win32") {
    const r = spawnSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", "(Get-CimInstance Win32_OperatingSystem).FreeVirtualMemory"], { encoding: "utf8" });
    const kb = Number(String(r.stdout ?? "").trim());
    if (Number.isFinite(kb) && kb > 0) return kb / 1048576;
  }
  return os.freemem() / 2 ** 30;
}

async function esperarMemoria(para) {
  const inicio = Date.now();
  let ultimoAviso = 0;
  for (;;) {
    const libre = memoriaLibreGB();
    if (libre >= MEMORIA_MIN_GB) return;
    const min = (Date.now() - inicio) / 60000;
    if (min >= ESPERA_MAX_MIN) {
      console.warn(`   ⚠️  Sigo sin memoria tras ${ESPERA_MAX_MIN} min (${libre.toFixed(2)} GB libres). Lo intento igualmente.`);
      return;
    }
    if (Date.now() - ultimoAviso > 60000) {
      console.log(`   ⏳ Memoria insuficiente para ${para}: ${libre.toFixed(2)} GB libres, necesito ${MEMORIA_MIN_GB}. Cierra Chrome/Edge, WSL u otras ventanas pesadas; continúo solo en cuanto haya.`);
      ultimoAviso = Date.now();
    }
    await dormir(8000);
  }
}

/** Huella de lo que afecta al paquete: si no cambió nada, se reutiliza el empaquetado anterior. */
function huellaProyecto() {
  const h = createHash("sha1");
  const recorrer = (dir) => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const ruta = join(dir, e.name);
      if (e.isDirectory()) recorrer(ruta);
      else {
        const st = statSync(ruta);
        h.update(`${ruta}:${st.size}:${Math.round(st.mtimeMs)};`);
      }
    }
  };
  for (const d of ["src", "public"]) recorrer(join(RAIZ_PROYECTO, d));
  for (const f of ["package.json", "remotion.config.ts", "tsconfig.json"]) {
    const ruta = join(RAIZ_PROYECTO, f);
    if (existsSync(ruta)) h.update(`${f}:${statSync(ruta).size}:${Math.round(statSync(ruta).mtimeMs)};`);
  }
  return h.digest("hex").slice(0, 12);
}

async function obtenerPaquete() {
  const dado = valor("bundle");
  if (dado) {
    if (!existsSync(join(dado, "index.html"))) throw new Error(`--bundle: no encuentro index.html en ${dado}`);
    console.log(`📦 Usando paquete indicado: ${dado}`);
    return dado;
  }
  const cache = join(RAIZ_PROYECTO, "trabajo", "tmp", "bundle-cache");
  const destino = join(cache, huellaProyecto());
  if (existsSync(join(destino, "index.html"))) {
    console.log("📦 Paquete en caché (nada cambió desde la última vez)");
    return destino;
  }
  console.log("📦 Empaquetando proyecto (solo ocurre cuando cambia algo)...");
  await esperarMemoria("empaquetar");
  rmSync(cache, { recursive: true, force: true });
  mkdirSync(cache, { recursive: true });
  return reintentar("empaquetado", () => bundle({ entryPoint: join(RAIZ_PROYECTO, "src", "index.ts"), outDir: destino, onProgress: () => {} }));
}

const serveUrl = await obtenerPaquete();
const inputProps = { modo: "normal", qa: false };

let composition = null;
async function obtenerComposition() {
  composition ??= await reintentar("composición", () => conNavegador((nav) => selectComposition({ serveUrl, id: "VideoMedico", inputProps, puppeteerInstance: nav })));
  return composition;
}

// --ensamblar: ya están todos los fotogramas, solo falta unir con el audio (no necesita Chrome)
const soloEnsamblar = args.includes("--ensamblar");
let total;
if (soloEnsamblar) {
  total = readdirSync(FOTOGRAMAS).filter((x) => /^f-\d+\.jpg$/.test(x)).length;
  console.log(`   modo ensamblar: ${total} fotogramas en disco`);
} else {
  total = (await obtenerComposition()).durationInFrames;
}
if (composition) console.log(`   ${composition.width}×${composition.height} · ${total} fotogramas · ${(total / FPS).toFixed(1)} s`);

// ---------- 1. Audio (mezcla en Node, sin Chrome) ----------
const { ffmpeg, ffprobe } = buscarFfmpeg();
if (existsSync(AUDIO) && statSync(AUDIO).size > 1000 && !args.includes("--audio-nuevo")) {
  console.log("🔊 Audio ya mezclado (se reutiliza)");
} else {
  console.log("🔊 Mezclando audio (voz + ambiente + efectos)...");
  const m = await mezclarAudio({ raiz: RAIZ_PROYECTO, ffmpeg, segundos: total / FPS, salidaWav: AUDIO });
  console.log(`   ✔ audio listo: ${m.efectos} efectos, ${m.segundos.toFixed(1)} s, pico ${m.pico.toFixed(2)}`);
}

// ---------- 2. Fotogramas por tandas ----------
const SIN_AVANCE_MS = 150000; // si en este tiempo no entra ningún fotograma, Chrome está colgado: se reinicia

/** Un JPEG completo empieza por FFD8 y termina en FFD9 (descarta el que quedó a medio escribir). */
function jpegCompleto(ruta) {
  try {
    if (statSync(ruta).size < 5000) return false;
    const b = readFileSync(ruta);
    return b[0] === 0xff && b[1] === 0xd8 && b[b.length - 2] === 0xff && b[b.length - 1] === 0xd9;
  } catch {
    return false;
  }
}

/** Mueve a su sitio definitivo los fotogramas buenos de la carpeta de tanda (aunque la tanda haya fallado). */
function cosechar(desde, hasta) {
  let n = 0;
  if (!existsSync(TANDA_DIR)) return 0;
  for (const f of readdirSync(TANDA_DIR)) {
    const m = f.match(/(\d+)\.jpe?g$/i);
    if (!m) continue;
    const fr = Number(m[1]); // renderFrames nombra los archivos con el número real de fotograma
    if (fr < desde || fr > hasta || hecho(fr)) continue;
    const ruta = join(TANDA_DIR, f);
    if (jpegCompleto(ruta)) {
      renameSync(ruta, join(FOTOGRAMAS, nombre(fr)));
      n++;
    }
  }
  return n;
}

const primerFaltante = (a, b) => {
  for (let f = a; f <= b; f++) if (!hecho(f)) return f;
  return null;
};

const contarHechos = () => {
  let n = 0;
  for (let f = 0; f < total; f++) if (hecho(f)) n++;
  return n;
};

const t0 = Date.now();
const recuperados = cosechar(0, total - 1); // por si una ejecución anterior se cortó con fotogramas buenos en la tanda
let hechos = contarHechos();
if (hechos) {
  console.log(`🖼️  Reanudando: ya hay ${hechos}/${total} fotogramas${recuperados ? ` (${recuperados} recuperados de una tanda interrumpida)` : ""}`);
}

/** Renderiza [desde, hasta] con vigilante anti-cuelgue. Lo que alcance a salir se conserva aunque falle. */
async function renderizarRango(desde, hasta) {
  rmSync(TANDA_DIR, { recursive: true, force: true });
  mkdirSync(TANDA_DIR, { recursive: true });
  let ultimoAvance = Date.now();
  const vigilante = setInterval(() => {
    if (Date.now() - ultimoAvance > SIN_AVANCE_MS) {
      console.warn(`   ⚠️  Chrome sin avance desde hace ${Math.round(SIN_AVANCE_MS / 1000)} s: lo reinicio (lo ya renderizado se conserva).`);
      ultimoAvance = Date.now();
      void cerrarNavegador();
    }
  }, 10000);
  try {
    const comp = await obtenerComposition();
    await conNavegador((nav) =>
      renderFrames({
        composition: comp,
        serveUrl,
        outputDir: TANDA_DIR,
        inputProps,
        imageFormat: "jpeg",
        jpegQuality: 95,
        frameRange: [desde, hasta],
        concurrency: CONCURRENCIA,
        muted: true,
        timeoutInMilliseconds: 240000,
        puppeteerInstance: nav,
        onStart: () => {},
        onFrameUpdate: () => {
          ultimoAvance = Date.now();
        },
        logLevel: "error",
      }),
    );
  } finally {
    clearInterval(vigilante);
    cosechar(desde, hasta);
  }
}

for (let a = 0; !soloEnsamblar && a < total; a += TANDA) {
  const b = Math.min(total - 1, a + TANDA - 1);
  let sinProgreso = 0;
  while (primerFaltante(a, b) !== null) {
    const desde = primerFaltante(a, b);
    if (!navegador) await esperarMemoria(`fotogramas ${desde}-${b}`);
    try {
      await renderizarRango(desde, b);
    } catch (e) {
      const msg = String(e?.message ?? e).split("\n")[0].slice(0, 110);
      const siguiente = primerFaltante(a, b);
      sinProgreso = siguiente !== null && siguiente > desde ? 0 : sinProgreso + 1;
      if (sinProgreso >= MAX_INTENTOS) throw new Error(`fotogramas ${desde}-${b}: ${msg}`);
      console.warn(`   ↻ fotogramas ${desde}-${b} falló (${msg}). Conservo lo hecho y reintento desde el ${siguiente ?? b}...`);
      await dormir(4000);
    }
  }
  hechos = contarHechos();
  fotogramasEnNavegador += b - a + 1;
  if (fotogramasEnNavegador >= RECICLAR_CADA) await cerrarNavegador();
  console.log(`   ✔ ${hechos}/${total} (${((hechos / total) * 100).toFixed(0)} %) · ${((Date.now() - t0) / 60000).toFixed(1)} min`);
}
rmSync(TANDA_DIR, { recursive: true, force: true });
await cerrarNavegador();

// ---------- 3. Ensamblado por segmentos ----------
// Se codifica en trozos de SEG_FOTOGRAMAS (5 s) guardados por separado y se unen al final con -c copy.
// Si falta memoria a mitad de un trozo solo se repite ese trozo, no el video entero.
console.log("🎞️  Ensamblando video + audio (H.264 + AAC) por segmentos...");
const faltan = primerFaltante(0, total - 1);
if (faltan !== null) throw new Error(`Faltan fotogramas (primero: ${faltan}). Ejecuta de nuevo npm run build.`);

const SEG_FOTOGRAMAS = 300;
const SEGMENTOS_DIR = join(TRABAJO, "segmentos");
mkdirSync(SEGMENTOS_DIR, { recursive: true });
const archivosSegmento = [];

for (let a = 0, k = 0; a < total; a += SEG_FOTOGRAMAS, k++) {
  const n = Math.min(SEG_FOTOGRAMAS, total - a);
  const archivo = join(SEGMENTOS_DIR, `seg-${String(k).padStart(2, "0")}.mp4`);
  archivosSegmento.push(archivo);
  if (existsSync(archivo) && statSync(archivo).size > 20000) continue; // ya codificado en una ejecución anterior

  let listo = false;
  for (let intento = 1; intento <= MAX_INTENTOS * 2 && !listo; intento++) {
    await esperarMemoria(`ensamblar segmento ${k + 1}`);
    rmSync(archivo, { force: true });
    const r = spawnSync(
      ffmpeg,
      [
        "-hide_banner", "-loglevel", "error", "-y",
        "-framerate", String(FPS), "-start_number", String(a), "-i", join(FOTOGRAMAS, "f-%05d.jpg"),
        "-frames:v", String(n),
        "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
        "-threads", "2",
        "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-r", String(FPS),
        "-x264-params", "rc-lookahead=24:threads=2:keyint=60:min-keyint=60:scenecut=0",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
        "-an",
        archivo,
      ],
      { stdio: ["ignore", "ignore", "pipe"], encoding: "utf8" },
    );
    listo = r.status === 0 && existsSync(archivo) && statSync(archivo).size > 20000;
    if (!listo) {
      console.warn(`   ↻ segmento ${k + 1} falló (código ${r.status}; suele ser falta de memoria). Reintento ${intento}...`);
      rmSync(archivo, { force: true });
      await dormir(3000);
    }
  }
  if (!listo) {
    console.error("\n❌ No pude codificar un segmento. Lo ya codificado queda guardado: ejecuta  npm run build -- --ensamblar");
    process.exit(1);
  }
  console.log(`   ✔ segmento ${k + 1}/${Math.ceil(total / SEG_FOTOGRAMAS)}`);
}

// Unión final: copia el video tal cual y codifica el audio (ligero)
const lista = join(SEGMENTOS_DIR, "lista.txt");
writeFileSync(lista, archivosSegmento.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n") + "\n");
let unido = false;
for (let intento = 1; intento <= MAX_INTENTOS && !unido; intento++) {
  await esperarMemoria("unir segmentos");
  rmSync(SALIDA, { force: true });
  const r = spawnSync(
    ffmpeg,
    [
      "-hide_banner", "-loglevel", "error", "-y",
      "-f", "concat", "-safe", "0", "-i", lista,
      "-i", AUDIO,
      "-map", "0:v:0", "-map", "1:a:0",
      "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
      "-shortest", "-movflags", "+faststart",
      SALIDA,
    ],
    { stdio: ["ignore", "ignore", "pipe"], encoding: "utf8" },
  );
  unido = r.status === 0 && existsSync(SALIDA) && statSync(SALIDA).size > 100000;
  if (!unido) {
    console.warn(`   ↻ la unión falló (código ${r.status}). Reintento ${intento}...`);
    await dormir(3000 * intento);
  }
}
if (!unido) {
  console.error("\n❌ Falló la unión final. Ejecuta  npm run build -- --ensamblar");
  process.exit(1);
}

// ---------- verificación ----------
const sonda = spawnSync(ffprobe, ["-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate,duration", "-of", "default=nw=1", SALIDA], { encoding: "utf8" });
const mb = (statSync(SALIDA).size / 1048576).toFixed(1);
console.log(`\n✅ ${SALIDA}\n   ${mb} MB · ${((Date.now() - t0) / 60000).toFixed(1)} min de render`);
console.log((sonda.stdout ?? "").trim().split("\n").map((l) => "   " + l).join("\n"));

rmSync(TRABAJO, { recursive: true, force: true });
rmSync(TMP_PROYECTO, { recursive: true, force: true });
