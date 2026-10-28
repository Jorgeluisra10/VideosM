#!/usr/bin/env node
/**
 * REVISIÓN DEL VIDEO RENDERIZADO (paso obligatorio de REGLAS_DE_VIDEO.md): extrae fotogramas del MP4 final para MIRARLOS y mide lo que se puede medir.
 *
 *   node scripts/anim/revisar-video.mjs [--video=trabajo/salida/video-animacion.mp4] [--fotogramas=8] [--salida=trabajo/tmp/revision] [--sin-guias]
 *
 * Fotogramas (≥ 8): el inicio, el gancho (1 s), el comienzo de CADA escena (con su segundo) y el cierre. Llevan guías amarillas de zona segura
 * (12 % superior, 20 % inferior y márgenes laterales de 6 %): nada importante debe pasar de esas líneas. Mídelos con la herramienta de lectura de imágenes.
 * Mediciones: resolución, fps, códecs, duración, volumen (LUFS, pico verdadero), recortes y silencios de la voz al inicio y al final.
 * Deja trabajo/tmp/revision/informe.json y muestra un resumen con ✅ / ⚠️ / ❌.
 */
import "../_tmp.mjs";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { deflateSync, inflateSync } from "node:zlib";
import { decodificar, medirLUFS, SR } from "../audio.mjs";
import { buscarFfmpeg } from "../medios.mjs";
import { RAIZ } from "./nucleo.mjs";

// PNG mínimo (sin dependencias): el ffmpeg que trae Remotion no tiene el filtro drawbox, así que las guías se dibujan aquí
const TABLA_CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = TABLA_CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function escribirPng(ruta, rgb, w, h) {
  const crudo = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) rgb.copy(crudo, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  const trozo = (tipo, datos) => { const t = Buffer.from(tipo, "ascii"), l = Buffer.alloc(4), c = Buffer.alloc(4); l.writeUInt32BE(datos.length); c.writeUInt32BE(crc32(Buffer.concat([t, datos]))); return Buffer.concat([l, t, datos, c]); };
  const cab = Buffer.alloc(13); cab.writeUInt32BE(w, 0); cab.writeUInt32BE(h, 4); cab[8] = 8; cab[9] = 2;
  writeFileSync(ruta, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), trozo("IHDR", cab), trozo("IDAT", deflateSync(crudo)), trozo("IEND", Buffer.alloc(0))]));
}
/** Lee un PNG de 8 bits RGB (lo que escribe ffmpeg con -pix_fmt rgb24): devuelve el buffer RGB sin filtros. */
function leerPng(archivo) {
  const b = readFileSync(archivo);
  let o = 8, w = 0, h = 0;
  const idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o), tipo = b.toString("ascii", o + 4, o + 8), d = b.subarray(o + 8, o + 8 + len);
    if (tipo === "IHDR") { w = d.readUInt32BE(0); h = d.readUInt32BE(4); if (d[8] !== 8 || d[9] !== 2 || d[12] !== 0) throw new Error("PNG no admitido (se espera RGB de 8 bits sin entrelazado)."); }
    if (tipo === "IDAT") idat.push(d);
    o += 12 + len;
  }
  const crudo = inflateSync(Buffer.concat(idat)), fila = w * 3, sal = Buffer.alloc(fila * h);
  for (let y = 0; y < h; y++) {
    const f = crudo[y * (fila + 1)];
    for (let x = 0; x < fila; x++) {
      const v = crudo[y * (fila + 1) + 1 + x];
      const a = x >= 3 ? sal[y * fila + x - 3] : 0, u = y > 0 ? sal[(y - 1) * fila + x] : 0, c = x >= 3 && y > 0 ? sal[(y - 1) * fila + x - 3] : 0;
      let r = v;
      if (f === 1) r = v + a; else if (f === 2) r = v + u; else if (f === 3) r = v + ((a + u) >> 1);
      else if (f === 4) { const p = a + u - c, pa = Math.abs(p - a), pb = Math.abs(p - u), pc = Math.abs(p - c); r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? u : c); }
      sal[y * fila + x] = r & 255;
    }
  }
  return { rgb: sal, w, h };
}
/** Líneas amarillas de zona segura: 12 % arriba, 20 % abajo y 6 % a cada lado (de 2 px y 80 % de opacidad). */
function dibujarGuias(rgb, w, h) {
  const punto = (x, y) => { const i = (y * w + x) * 3; rgb[i] = Math.round(rgb[i] * 0.2 + 255 * 0.8); rgb[i + 1] = Math.round(rgb[i + 1] * 0.2 + 220 * 0.8); rgb[i + 2] = Math.round(rgb[i + 2] * 0.2); };
  for (const y of [Math.round(h * 0.12), Math.round(h * 0.8)]) for (let x = 0; x < w; x++) { punto(x, y); punto(x, y + 1); }
  for (const x of [Math.round(w * 0.06), Math.round(w * 0.94)]) for (let y = 0; y < h; y++) { punto(x, y); punto(x + 1, y); }
}

const num = (x) => { const n = Number(x); return Number.isFinite(n) ? n : null; };

/** Segundos en los que se toman los fotogramas: inicio, gancho, comienzo de cada escena, cierre, y se completan hasta `minimo` repartidos parejo. */
export function instantesDeRevision(duracion, escenas = [], minimo = 8) {
  const t = [0.05, Math.min(1, duracion * 0.1)];
  for (const e of escenas) if (Number.isFinite(e.inicio) && e.inicio > 0.2) t.push(e.inicio + 0.7);
  t.push(Math.max(0.05, duracion - 0.35));
  let l = [...new Set(t.map((x) => Math.round(Math.min(Math.max(0.05, x), duracion - 0.1) * 100) / 100))].sort((a, b) => a - b);
  l = l.filter((x, i) => i === 0 || x - l[i - 1] >= 0.4);
  for (let k = 1; l.length < minimo && k <= 40; k++) {
    const x = Math.round(((duracion * k) / (minimo + 1)) * 100) / 100;
    if (l.every((y) => Math.abs(y - x) >= 0.4)) l.push(x);
    l.sort((a, b) => a - b);
  }
  return l.slice(0, 40);
}

/** Primer y último instante (s) en que una pista supera el umbral de energía (RMS de 10 ms); null si no hay señal. */
export function limitesDeSenal(x, umbral = 0.01) {
  const w = Math.round(0.01 * SR), n = Math.floor(x.length / w);
  let ini = -1, fin = -1;
  for (let i = 0; i < n; i++) {
    let a = 0;
    for (let k = i * w; k < (i + 1) * w; k++) a += x[k] * x[k];
    if (Math.sqrt(a / w) > umbral) { if (ini < 0) ini = i; fin = i; }
  }
  return ini < 0 ? null : { inicio: (ini * w) / SR, fin: ((fin + 1) * w) / SR, duracion: x.length / SR };
}

export async function revisarVideo({ video, nFotogramas = 8, salida, guias = true, raiz = RAIZ, log = console.log }) {
  const { ffmpeg, ffprobe } = buscarFfmpeg();
  if (!existsSync(video)) throw new Error(`No encuentro el video: ${video}. Primero renderiza (npm run anim:render).`);
  const sonda = JSON.parse(spawnSync(ffprobe, ["-v", "error", "-show_streams", "-show_format", "-of", "json", video], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }).stdout || "{}");
  const v = (sonda.streams ?? []).find((s) => s.codec_type === "video"), a = (sonda.streams ?? []).find((s) => s.codec_type === "audio");
  if (!v) throw new Error("El archivo no tiene pista de video.");
  const duracion = num(sonda.format?.duration) ?? num(v.duration) ?? 0;
  const [fn, fd] = String(v.r_frame_rate ?? "0/1").split("/").map(Number);
  const fps = fd ? Math.round((fn / fd) * 100) / 100 : 0;
  const checks = [];
  const nota = (estado, texto) => checks.push({ estado, texto });
  nota(v.width === 1080 && v.height === 1920 ? "ok" : "error", `Resolución ${v.width}×${v.height} (se pide 1080×1920, vertical 9:16)`);
  nota([30, 60].includes(Math.round(fps)) ? "ok" : "aviso", `${fps} fps (este sistema renderiza a 60 fps; 30 y 60 sirven en Instagram y TikTok)`);
  nota(v.codec_name === "h264" ? "ok" : "aviso", `Video ${v.codec_name} ${v.codec_name === "h264" ? "" : "(plataformas piden H.264)"}`.trim());
  nota(duracion >= 20 && duracion <= 35 ? "ok" : "aviso", `Duración ${duracion.toFixed(1)} s (los reels diarios: 20 a 35 s, salvo que el pedido diga otra)`);

  // fotogramas
  let escenas = [];
  try { const an = JSON.parse(readFileSync(join(raiz, "src", "data", "animacion.json"), "utf8")); if (Math.abs((an.duracion ?? 0) - duracion) < 1.5) escenas = an.escenas.map((e) => ({ n: e.n, inicio: Number(e.inicio) })); } catch { /* sin animación activa: se reparten parejo */ }
  const dir = salida ?? join(raiz, "trabajo", "tmp", "revision");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const instantes = instantesDeRevision(duracion, escenas, nFotogramas);
  const W = 540, H = 960;
  const fotogramas = [];
  instantes.forEach((t, i) => {
    const archivo = join(dir, `fotograma-${String(i + 1).padStart(2, "0")}-${t.toFixed(2)}s.png`);
    const r = spawnSync(ffmpeg, ["-v", "error", "-y", "-ss", String(t), "-i", video, "-frames:v", "1", "-vf", `scale=${W}:${H}`, "-pix_fmt", "rgb24", archivo], { encoding: "utf8" });
    if (r.status !== 0 || !existsSync(archivo)) return;
    if (guias) { const { rgb } = leerPng(archivo); dibujarGuias(rgb, W, H); escribirPng(archivo, rgb, W, H); }
    fotogramas.push({ segundo: t, archivo });
  });
  nota(fotogramas.length >= 8 ? "ok" : "aviso", `${fotogramas.length} fotogramas extraídos en ${dir} (míralos todos${guias ? "; las líneas amarillas marcan la zona segura" : ""})`);

  // audio
  let audio = null;
  if (!a) nota("aviso", "El video no tiene pista de audio (¿SFX desactivados y sin voz?)");
  else {
    const med = medirLUFS(ffmpeg, video);
    const tmp = join(dir, "tmp-audio");
    mkdirSync(tmp, { recursive: true });
    const x = decodificar(ffmpeg, video, tmp);
    let recortes = 0, pico = 0;
    for (let i = 0; i < x.length; i++) { const m = Math.abs(x[i]); if (m > pico) pico = m; if (m >= 0.999) recortes++; }
    const stem = join(raiz, "trabajo", "salida", "stems", "voz.wav");
    let lim = null, origen = "mezcla";
    if (existsSync(stem)) { const vz = decodificar(ffmpeg, stem, tmp); if (Math.abs(vz.length / SR - duracion) < 0.3) { lim = limitesDeSenal(vz); origen = "voz"; } }
    lim ??= limitesDeSenal(x);
    rmSync(tmp, { recursive: true, force: true });
    audio = { lufs: med?.integrado ?? null, picoVerdadero: med?.picoVerdadero ?? null, recortes, inicioSeg: lim ? Math.round(lim.inicio * 100) / 100 : null, colaSeg: lim ? Math.round((lim.duracion - lim.fin) * 100) / 100 : null, medidoEn: origen };
    if (med) nota(Math.abs(med.integrado + 14) <= 1.5 ? "ok" : "aviso", `Volumen ${med.integrado.toFixed(1)} LUFS (objetivo −14 ±1,5; solo se normaliza el video CON voz generada)`);
    if (med?.picoVerdadero !== null && med) nota(med.picoVerdadero <= -1 ? "ok" : "aviso", `Pico verdadero ${med.picoVerdadero.toFixed(1)} dBTP (debe quedar ≤ −1)`);
    nota(recortes === 0 ? "ok" : "error", recortes === 0 ? "Sin recortes (clipping) en el audio" : `${recortes} muestras recortadas (clipping): baja el volumen`);
    if (lim) {
      nota(audio.inicioSeg >= 0.15 && audio.inicioSeg <= 0.6 ? "ok" : "aviso", `${origen === "voz" ? "La voz" : "El audio"} empieza a los ${audio.inicioSeg} s (se pide ≈ 0,3 s de silencio al inicio)`);
      nota(audio.colaSeg >= 0.4 ? "ok" : "aviso", `${origen === "voz" ? "La voz" : "El audio"} termina ${audio.colaSeg} s antes del final (se pide ≈ 0,5 s de silencio)`);
    }
    const stemsOk = existsSync(join(raiz, "trabajo", "salida", "stems", "musica-y-efectos.wav"));
    nota(stemsOk ? "ok" : "aviso", stemsOk ? "Pistas separadas exportadas: trabajo/salida/stems/ (voz.wav y musica-y-efectos.wav)" : "No hay pistas separadas en trabajo/salida/stems/ (se crean al renderizar)");
  }
  const informe = { video, duracion, resolucion: `${v.width}x${v.height}`, fps, fotogramas, audio, checks, problemas: checks.filter((c) => c.estado !== "ok").length };
  writeFileSync(join(dir, "informe.json"), JSON.stringify(informe, null, 2));
  log(`\n🔎 Revisión de ${video}`);
  for (const c of checks) log(`  ${c.estado === "ok" ? "✅" : c.estado === "aviso" ? "⚠️" : "❌"} ${c.texto}`);
  log("\nFotogramas para mirar:");
  fotogramas.forEach((f) => log(`  ${f.segundo.toFixed(2).padStart(6)} s · ${f.archivo}`));
  log(`\n${informe.problemas ? `Hay ${informe.problemas} punto(s) a revisar.` : "Todo lo medible está en regla."} Falta lo que solo se ve: texto cortado, superposiciones, datos incorrectos (mira los fotogramas).`);
  return informe;
}

if (process.argv[1]?.endsWith("anim/revisar-video.mjs")) {
  const args = process.argv.slice(2);
  const valor = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
  const abs = (f) => (isAbsolute(f) ? f : resolve(RAIZ, f));
  try {
    await revisarVideo({ video: abs(valor("video") ?? "trabajo/salida/video-animacion.mp4"), nFotogramas: Math.max(8, Number(valor("fotogramas") ?? 8) || 8), salida: valor("salida") ? abs(valor("salida")) : undefined, guias: !args.includes("--sin-guias") });
  } catch (e) {
    console.error(`❌ ${e.message ?? e}`);
    process.exit(1);
  }
}
