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
 *   3. Cada trozo de 5 s (300 fotogramas) se codifica a H.264 EN CUANTO está listo y sus fotogramas se BORRAN: el disco nunca guarda más de ~300 JPEG
 *      a la vez (< 1 GB). Al final se unen los trozos con el audio → trabajo/salida/video-terminado.mp4 (H.264 + AAC).
 *      Antes de empezar se mide el espacio libre y, si falta, se borran los temporales viejos (npm run limpiar los borra a mano).
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
import { mezclarAudio, mezclarSfx, normalizarEnSitio } from "./audio.mjs";
import { PISTA_VOZ, vozVigente } from "./anim/voz.mjs";
import { cargarNucleoAnim } from "./anim/nucleo.mjs";
import { esSinEspacio, espacioLibreGB, limpiarTemporales, mensajeSinEspacio } from "./_disco.mjs";

const args = process.argv.slice(2);
const valor = (nombre) => args.find((a) => a.startsWith(`--${nombre}=`))?.split("=")[1];

const ramGB = os.totalmem() / 2 ** 30;
const CONCURRENCIA = Number(valor("concurrency") ?? (ramGB < 10 ? 1 : 2));
const TANDA = Number(valor("tanda") ?? 100);
const MAX_INTENTOS = 6;
const MEMORIA_MIN_GB = Number(valor("memoria-min") ?? 0.6);
const ESPERA_MAX_MIN = Number(valor("espera-max") ?? 40);

const COMPOSICION = valor("composicion") ?? "VideoMedico";
const ES_ANIMACION = COMPOSICION === "Animacion";
/** La animación activa (motor SVG + 3D): se pasa como inputProps, así que no hace falta volver a empaquetar al cambiarla. */
const ANIMACION = ES_ANIMACION ? JSON.parse(readFileSync(join(RAIZ_PROYECTO, "src", "data", "animacion.json"), "utf8")) : null;
// cada animación tiene su propia carpeta de trabajo (huella de su contenido): cambiar el guion nunca reutiliza fotogramas viejos
const HUELLA_ANIM = ES_ANIMACION ? createHash("sha1").update(JSON.stringify(ANIMACION)).digest("hex").slice(0, 10) : "";

const TRABAJO = join(RAIZ_PROYECTO, "trabajo", "tmp", ES_ANIMACION ? `render-anim-${HUELLA_ANIM}` : "render");
const FOTOGRAMAS = join(TRABAJO, "fotogramas");
const TANDA_DIR = join(TRABAJO, "tanda");
// voz en off con IA (scripts/anim/voz.mjs): se mezcla sola si está generada para ESTA versión del video; --sin-voz la omite
const VOZ = ES_ANIMACION && !args.includes("--sin-voz") ? await vozVigente(ANIMACION) : { manifiesto: null, vigente: false };
const VOZ_PISTA = VOZ.vigente ? PISTA_VOZ() : null;
const AUDIO = join(TRABAJO, VOZ_PISTA ? `mezcla-voz-${statSync(VOZ_PISTA).mtimeMs | 0}.wav` : "mezcla.wav");
const SALIDA = join(RAIZ_PROYECTO, "trabajo", "salida", ES_ANIMACION ? "video-animacion.mp4" : "video-terminado.mp4");
const FPS = 60;

if (args.includes("--desde-cero")) rmSync(TRABAJO, { recursive: true, force: true });
mkdirSync(FOTOGRAMAS, { recursive: true });
mkdirSync(join(RAIZ_PROYECTO, "trabajo", "salida"), { recursive: true });

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const nombre = (f) => `f-${String(f).padStart(5, "0")}.jpg`;
/** Cada trozo de 5 s se codifica a un mp4 en cuanto está completo y sus fotogramas se borran para no llenar el disco. */
const SEG_FOTOGRAMAS = 300;
const SEGMENTOS_DIR = join(TRABAJO, "segmentos");
mkdirSync(SEGMENTOS_DIR, { recursive: true });
const archivoSegmento = (k) => join(SEGMENTOS_DIR, `seg-${String(k).padStart(2, "0")}.mp4`);
const segmentoListo = (k) => existsSync(archivoSegmento(k)) && statSync(archivoSegmento(k)).size > 20000;
const hecho = (f) => segmentoListo(Math.floor(f / SEG_FOTOGRAMAS)) || existsSync(join(FOTOGRAMAS, nombre(f)));

// ---------- espacio en disco (antes de empezar) ----------
/** Medido: el pico real es ≈ 0,2 GB (≈ 300 JPEG + empaquetado + trozos codificados). Se avisa por debajo de 1,2 GB y se para por debajo de 0,35 GB. */
const NECESARIO_GB = 1.2;
const MINIMO_GB = 0.35;
function fatalDisco(libre) {
  console.error(`\n❌ ${mensajeSinEspacio(libre ?? espacioLibreGB(RAIZ_PROYECTO))}`);
  console.error("\n   Lo ya renderizado queda guardado: cuando liberes espacio vuelve a lanzar el mismo comando y sigue donde quedó.");
  process.exit(3);
}
// Remotion escribe los fotogramas de forma asíncrona: un ENOSPC puede llegar como promesa rechazada sin dueño. Se captura aquí con un mensaje claro.
process.on("unhandledRejection", (e) => {
  if (esSinEspacio(e)) fatalDisco();
  console.error(`\n❌ Error inesperado: ${String(e?.stack ?? e).split("\n").slice(0, 4).join("\n")}`);
  process.exit(1);
});
process.on("uncaughtException", (e) => {
  if (esSinEspacio(e)) fatalDisco();
  console.error(`\n❌ Error inesperado: ${String(e?.stack ?? e).split("\n").slice(0, 4).join("\n")}`);
  process.exit(1);
});
{
  let libre = espacioLibreGB(RAIZ_PROYECTO);
  if (libre !== null && libre < NECESARIO_GB) {
    console.warn(`   💾 Poco espacio en disco (${libre.toFixed(2)} GB libres): borro temporales viejos de este proyecto...`);
    const r = limpiarTemporales({ conservar: [join(TRABAJO).split(/[\\/]/).pop(), "sistema"] });
    libre = espacioLibreGB(RAIZ_PROYECTO);
    if (r.liberadoGB > 0.01) console.log(`   🗑️  Liberados ${r.liberadoGB.toFixed(2)} GB (${r.borradas.map((b) => b.nombre).join(", ")}). Libre ahora: ${libre?.toFixed(2)} GB`);
    if (libre !== null && libre < MINIMO_GB) fatalDisco(libre);
    if (libre !== null && libre < NECESARIO_GB) console.warn(`   ⚠️  Queda poco espacio (${libre.toFixed(2)} GB); intento el render igualmente porque ahora usa muy poco disco.`);
  } else if (libre !== null) console.log(`   💾 Espacio libre en disco: ${libre.toFixed(1)} GB (el render usa unos 0,2–0,3 GB a la vez)`);
}

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
      else if (/[\\/]data[\\/]animacion\.json$/.test(ruta)) continue; // la animación viaja como inputProps: cambiarla no obliga a empaquetar de nuevo
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
const inputProps = ES_ANIMACION ? { animacion: ANIMACION, qa: false } : { modo: "normal", qa: false };

let composition = null;
async function obtenerComposition() {
  composition ??= await reintentar("composición", () => conNavegador((nav) => selectComposition({ serveUrl, id: COMPOSICION, inputProps, puppeteerInstance: nav })));
  return composition;
}

// --ensamblar: ya están todos los fotogramas, solo falta unir con el audio (no necesita Chrome)
const soloEnsamblar = args.includes("--ensamblar");
let total;
const ESTADO = join(TRABAJO, "estado.json");
if (soloEnsamblar) {
  total = existsSync(ESTADO) ? JSON.parse(readFileSync(ESTADO, "utf8")).total : readdirSync(FOTOGRAMAS).filter((x) => /^f-\d+\.jpg$/.test(x)).length;
  console.log(`   modo ensamblar: ${total} fotogramas`);
} else {
  total = (await obtenerComposition()).durationInFrames;
  writeFileSync(ESTADO, JSON.stringify({ total }));
}
if (composition) console.log(`   ${composition.width}×${composition.height} · ${total} fotogramas · ${(total / FPS).toFixed(1)} s`);

// ---------- 1. Audio (mezcla en Node, sin Chrome) ----------
const { ffmpeg, ffprobe } = buscarFfmpeg();
// La animación solo lleva audio si tiene SFX activados y al menos un efecto: si no, el mp4 sale sin pista de audio.
const nucleoAnim = ES_ANIMACION ? await cargarNucleoAnim() : null;
const eventosAnim = nucleoAnim ? nucleoAnim.eventosSfx(ANIMACION) : [];
const musicaAnim = nucleoAnim && nucleoAnim.llevaMusica(ANIMACION) ? nucleoAnim.MUSICA : null;
const CON_AUDIO = !ES_ANIMACION || eventosAnim.length > 0 || !!musicaAnim || !!VOZ_PISTA;
if (ES_ANIMACION && VOZ.manifiesto && !VOZ.vigente && !args.includes("--sin-voz")) console.log("⚠️ La voz generada es de otra versión de este video (cambió el texto o los tiempos): se renderiza SIN voz. Vuelve a generarla en el Estudio (🎙️ Voz en off).");
if (VOZ_PISTA) console.log(`🎙️ Con voz en off «${VOZ.manifiesto.voz}» (${VOZ.manifiesto.estilo})`);
if (!CON_AUDIO) {
  console.log(ANIMACION.sfx ? "🔇 La animación no tiene efectos de sonido: el video sale sin audio" : "🔇 SFX desactivados: el video sale sin pista de audio");
} else if (existsSync(AUDIO) && statSync(AUDIO).size > 1000 && !args.includes("--audio-nuevo")) {
  console.log("🔊 Audio ya mezclado (se reutiliza)");
} else if (ES_ANIMACION) {
  console.log(`🔊 Mezclando efectos de sonido${musicaAnim ? " y música" : ""}${VOZ_PISTA ? " con la voz en off" : " (sin voz)"}...`);
  const m = await mezclarSfx({ raiz: RAIZ_PROYECTO, ffmpeg, segundos: total / FPS, salidaWav: AUDIO, eventos: eventosAnim, musica: musicaAnim, vozWav: VOZ_PISTA });
  console.log(`   ✔ audio listo: ${m.efectos} efectos${musicaAnim ? " + música" : ""}, ${m.segundos.toFixed(1)} s, pico ${m.pico.toFixed(2)}`);
  // con voz en off el audio final se lleva a −14 LUFS (el volumen que piden las plataformas); sin voz se deja como estaba
  if (VOZ_PISTA) {
    const n = normalizarEnSitio(ffmpeg, AUDIO, { objetivo: -14, pico: -1.5 });
    console.log(n ? `   ✔ volumen normalizado: ${n.antes.toFixed(1)} → −14 LUFS` : "   (no pude normalizar el volumen: se deja la mezcla tal cual)");
  }
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
        jpegQuality: 92,
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

/** Codifica el trozo `k` (fotogramas a…a+n-1) a H.264 y, si sale bien, BORRA sus JPEG: así el disco nunca guarda más de ~300 a la vez. */
async function codificarSegmento(k) {
  const a = k * SEG_FOTOGRAMAS;
  const n = Math.min(SEG_FOTOGRAMAS, total - a);
  const archivo = archivoSegmento(k);
  if (segmentoListo(k)) return true;
  for (let f = a; f < a + n; f++) if (!existsSync(join(FOTOGRAMAS, nombre(f)))) throw new Error(`Falta el fotograma ${f} para codificar el trozo ${k + 1}.`);
  for (let intento = 1; intento <= MAX_INTENTOS * 2; intento++) {
    await esperarMemoria(`codificar el trozo ${k + 1}`);
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
    if (r.status === 0 && existsSync(archivo) && statSync(archivo).size > 20000) {
      for (let f = a; f < a + n; f++) rmSync(join(FOTOGRAMAS, nombre(f)), { force: true });
      return true;
    }
    rmSync(archivo, { force: true });
    if (esSinEspacio(r.stderr)) fatalDisco();
    console.warn(`   ↻ trozo ${k + 1} falló al codificar (código ${r.status}; suele ser falta de memoria). Reintento ${intento}...`);
    if (intento >= 2) await cerrarNavegador(); // libera la memoria de Chrome para que ffmpeg pueda crecer
    await dormir(3000);
  }
  return false;
}

const NUM_SEGMENTOS = Math.ceil(total / SEG_FOTOGRAMAS);
for (let k = 0; !soloEnsamblar && k < NUM_SEGMENTOS; k++) {
  const s0 = k * SEG_FOTOGRAMAS;
  const sFin = Math.min(total - 1, s0 + SEG_FOTOGRAMAS - 1);
  if (!segmentoListo(k)) {
    for (let a = s0; a <= sFin; a += TANDA) {
      const b = Math.min(sFin, a + TANDA - 1);
      let sinProgreso = 0;
      while (primerFaltante(a, b) !== null) {
        const desde = primerFaltante(a, b);
        if (!navegador) await esperarMemoria(`fotogramas ${desde}-${b}`);
        try {
          await renderizarRango(desde, b);
        } catch (e) {
          if (esSinEspacio(e)) {
            // sin espacio: se borra lo que sobre (renders viejos) y se comprueba antes de reintentar
            limpiarTemporales({ conservar: [TRABAJO.split(/[\\/]/).pop(), "sistema", "bundle-cache"] });
            const libre = espacioLibreGB(RAIZ_PROYECTO);
            if (libre !== null && libre < 0.15) fatalDisco(libre);
          }
          const msg = String(e?.message ?? e).split("\n")[0].slice(0, 110);
          const siguiente = primerFaltante(a, b);
          sinProgreso = siguiente !== null && siguiente > desde ? 0 : sinProgreso + 1;
          if (sinProgreso >= MAX_INTENTOS) throw new Error(`fotogramas ${desde}-${b}: ${msg}`);
          console.warn(`   ↻ fotogramas ${desde}-${b} falló (${msg}). Conservo lo hecho y reintento desde el ${siguiente ?? b}...`);
          await dormir(4000);
        }
      }
      fotogramasEnNavegador += b - a + 1;
      if (fotogramasEnNavegador >= RECICLAR_CADA) await cerrarNavegador();
    }
    if (!(await codificarSegmento(k))) {
      console.error("\n❌ No pude codificar un trozo. Lo ya codificado queda guardado: vuelve a lanzar el mismo comando.");
      process.exit(1);
    }
  }
  const listos = Math.min(total, (k + 1) * SEG_FOTOGRAMAS);
  console.log(`   ✔ ${listos}/${total} (${((listos / total) * 100).toFixed(0)} %) · ${((Date.now() - t0) / 60000).toFixed(1)} min`);
}
rmSync(TANDA_DIR, { recursive: true, force: true });
await cerrarNavegador();

// ---------- 3. Unión de los trozos con el audio ----------
// Los trozos de 5 s ya están codificados (arriba). Si alguno falta y aún quedan sus fotogramas (modo --ensamblar), se codifica ahora.
console.log("🎞️  Uniendo los trozos de video + audio (H.264 + AAC)...");
const archivosSegmento = [];
for (let k = 0; k < NUM_SEGMENTOS; k++) {
  if (!segmentoListo(k)) {
    try {
      if (!(await codificarSegmento(k))) throw new Error("ffmpeg falló");
    } catch (e) {
      console.error(`\n❌ Falta el trozo ${k + 1} (${String(e?.message ?? e).split("\n")[0]}). Vuelve a lanzar el render (sin --ensamblar).`);
      process.exit(1);
    }
  }
  archivosSegmento.push(archivoSegmento(k));
}
const SEGMENTOS_LISTA = SEGMENTOS_DIR;

// Unión final: copia el video tal cual y codifica el audio (ligero)
const lista = join(SEGMENTOS_LISTA, "lista.txt");
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
      ...(CON_AUDIO ? ["-i", AUDIO, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest"] : ["-map", "0:v:0", "-c:v", "copy", "-an"]),
      "-movflags", "+faststart",
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
