/**
 * VideMed · piezas comunes de la síntesis de voz (todos los proveedores).
 *
 * Cada proveedor entrega  { mp3: Buffer, palabras: [{ word, start, end }], fuente }  y aquí se unifica:
 *   alinearConGuion()   las palabras del servicio (Whisper, ElevenLabs…) se alinean con las del GUION original
 *                       (DP tipo Needleman–Wunsch con tolerancia a erratas), porque las escenas se anclan a las
 *                       palabras del guion (`tiempoDe("bloquea")`) y los subtítulos conservan ¿ ? , .
 *   escribirSalidas()   public/audios/voz.mp3 + tiempos.vtt, src/data/timestamps.json y meta.json
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const ruta = (...p) => join(RAIZ, ...p);

export const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

/** 0 = idénticas · hasta ~0.45 = misma palabra con errata · 1 = distintas */
function distancia(a, b) {
  if (a === b) return 0;
  if (!a || !b) return 1;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return 0.25;
  const d = levenshtein(a, b) / Math.max(a.length, b.length);
  return d <= 0.4 ? 0.1 + d : 1;
}

/**
 * Alinea las palabras del guion con las que devuelve el servicio de voz y reparte sus tiempos.
 *  - palabra del guion con pareja → su tiempo; el final se extiende hasta las palabras del servicio que sobran detrás
 *    (p. ej. "185.000" dicho como cinco palabras);
 *  - palabra sin pareja → tiempo interpolado entre sus vecinas, proporcional a su longitud.
 * Devuelve { palabras: [{word,start,end}], sinPareja: [...], cobertura: 0–1 }.
 */
export function alinearConGuion(tokensGuion, marcas) {
  const S = tokensGuion.map((w) => ({ w, n: norm(w) }));
  // las marcas sin letras ni números (signos sueltos) no son palabras
  const T = marcas.filter((m) => norm(m.word)).map((m) => ({ ...m, n: norm(m.word) }));
  const n = S.length;
  const m = T.length;
  if (!m) throw new Error("El servicio de voz no devolvió ninguna palabra con tiempos.");
  const GAP_S = 0.85; // palabra del guion que el servicio no dijo
  const GAP_T = 0.6; // palabra de más en el servicio
  const D = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
  const B = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1)); // 1 diag, 2 arriba (S), 3 izquierda (T)
  for (let i = 1; i <= n; i++) { D[i][0] = i * GAP_S; B[i][0] = 2; }
  for (let j = 1; j <= m; j++) { D[0][j] = j * GAP_T; B[0][j] = 3; }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const d = distancia(S[i - 1].n, T[j - 1].n);
      const diag = D[i - 1][j - 1] + (d >= 1 ? 1.4 : d);
      const arr = D[i - 1][j] + GAP_S;
      const izq = D[i][j - 1] + GAP_T;
      if (diag <= arr && diag <= izq) { D[i][j] = diag; B[i][j] = 1; }
      else if (arr <= izq) { D[i][j] = arr; B[i][j] = 2; }
      else { D[i][j] = izq; B[i][j] = 3; }
    }
  }
  // camino: pareja[i] = índice j del servicio o -1
  const pareja = new Array(n).fill(-1);
  for (let i = n, j = m; i > 0 || j > 0; ) {
    const b = B[i][j];
    if (i > 0 && j > 0 && b === 1) {
      if (distancia(S[i - 1].n, T[j - 1].n) < 1) pareja[i - 1] = j - 1;
      i--; j--;
    } else if (i > 0 && (b === 2 || j === 0)) i--;
    else j--;
  }

  const out = new Array(n);
  let cubiertas = 0;
  for (let i = 0; i < n; i++) {
    if (pareja[i] < 0) continue;
    cubiertas++;
    let jf = pareja[i];
    // palabras del servicio que sobran hasta la siguiente pareja se atribuyen a esta palabra
    const sig = pareja.slice(i + 1).find((x) => x >= 0);
    const tope = sig === undefined ? m - 1 : sig - 1;
    while (jf < tope) jf++;
    out[i] = { word: S[i].w, start: T[pareja[i]].start, end: Math.max(T[pareja[i]].end, T[jf].end) };
  }
  // interpolación de las palabras sin pareja
  for (let i = 0; i < n; ) {
    if (out[i]) { i++; continue; }
    let j = i;
    while (j < n && !out[j]) j++;
    const t0 = i > 0 ? out[i - 1].end : T[0].start;
    const t1 = j < n ? out[j].start : T[m - 1].end;
    const peso = S.slice(i, j).reduce((s, x) => s + x.w.length + 2, 0);
    let t = t0;
    const hueco = Math.max(0.05 * (j - i), t1 - t0);
    for (let k = i; k < j; k++) {
      const d = (hueco * (S[k].w.length + 2)) / peso;
      out[k] = { word: S[k].w, start: t, end: t + d };
      t += d;
    }
    i = j;
  }
  // monotonía y duración mínima
  for (let i = 0; i < n; i++) {
    if (i > 0 && out[i].start < out[i - 1].start) out[i].start = out[i - 1].start;
    if (out[i].end < out[i].start + 0.04) out[i].end = out[i].start + 0.04;
  }
  const redondear = (x) => Math.round(x * 1000) / 1000;
  return {
    palabras: out.map((w) => ({ word: w.word, start: redondear(w.start), end: redondear(w.end) })),
    sinPareja: S.filter((_, i) => pareja[i] < 0).map((x) => x.w),
    cobertura: n ? cubiertas / n : 1,
  };
}

/** Palabras con tiempos a partir de marcas por CARÁCTER (ElevenLabs): trocea el texto original por espacios. */
export function palabrasDesdeCaracteres(texto, caracteres, inicios, fines) {
  const palabras = [];
  let pos = 0;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const i = texto.indexOf(w, pos);
    if (i < 0) return null;
    pos = i + w.length;
    const a = inicios[i];
    const b = fines[Math.min(pos - 1, fines.length - 1)];
    if (typeof a !== "number" || typeof b !== "number") return null;
    palabras.push({ word: w, start: a, end: b });
  }
  return caracteres.length >= texto.length - 2 ? palabras : null;
}

// ---------------------------------------------------------------------------
// ffmpeg / ffprobe de Remotion
// ---------------------------------------------------------------------------
export function buscarFfprobe() {
  const base = ruta("node_modules", "@remotion");
  const exe = process.platform === "win32" ? "ffprobe.exe" : "ffprobe";
  try {
    for (const d of readdirSync(base)) {
      if (d.startsWith("compositor-") && existsSync(join(base, d, exe))) return join(base, d, exe);
    }
  } catch { /* sin node_modules */ }
  return null;
}

/** Duración real de un audio en segundos (ffprobe de Remotion; si no está, estima por tamaño a 128 kbps). */
export function duracionAudio(archivo, bytesEstimados = 0) {
  const ffprobe = buscarFfprobe();
  if (ffprobe) {
    const r = spawnSync(ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", archivo], { encoding: "utf8" });
    const d = parseFloat(String(r.stdout ?? "").trim());
    if (Number.isFinite(d) && d > 0) return Math.round(d * 100) / 100;
  }
  return Math.round(((bytesEstimados * 8) / 128000) * 100) / 100;
}

const aTiempo = (seg) => {
  const ms = Math.max(0, Math.round(seg * 1000));
  const h = Math.floor(ms / 3600000);
  const mi = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`;
};

/** Escribe voz.mp3, tiempos.vtt, timestamps.json y meta.json. Devuelve el meta. */
export function escribirSalidas({ mp3, palabras, texto, meta = {} }) {
  mkdirSync(ruta("public", "audios"), { recursive: true });
  mkdirSync(ruta("src", "data"), { recursive: true });
  const rutaMp3 = ruta("public", "audios", "voz.mp3");
  writeFileSync(rutaMp3, mp3);
  const vtt = ["WEBVTT", "", ...palabras.flatMap((w, i) => [String(i + 1), `${aTiempo(w.start)} --> ${aTiempo(w.end)}`, w.word, ""])];
  writeFileSync(ruta("public", "audios", "tiempos.vtt"), vtt.join("\n"));
  writeFileSync(ruta("src", "data", "timestamps.json"), JSON.stringify(palabras, null, 2) + "\n");
  const ultimaFin = palabras[palabras.length - 1].end;
  const completo = {
    ...meta,
    palabras: palabras.length,
    duracionAudio: duracionAudio(rutaMp3, mp3.length),
    ultimaPalabraFin: ultimaFin,
    texto,
    generado: new Date().toISOString(),
  };
  writeFileSync(ruta("src", "data", "meta.json"), JSON.stringify(completo, null, 2) + "\n");
  rmSync(ruta("trabajo", "tmp", "dec"), { recursive: true, force: true });
  return completo;
}

/** Errores de red/API con mensaje claro en español. */
export class ErrorVoz extends Error {}

export async function pedir(url, opciones, { etiqueta, reintentos = 3 }) {
  let ultimo;
  for (let intento = 1; intento <= reintentos; intento++) {
    try {
      const r = await fetch(url, { ...opciones, signal: AbortSignal.timeout(180000) });
      if (r.ok) return r;
      const cuerpo = await r.text().catch(() => "");
      const detalle = cuerpo.slice(0, 300).replace(/\s+/g, " ");
      if (r.status === 401 || r.status === 403) throw new ErrorVoz(`${etiqueta}: la clave no es válida o no tiene permiso (${r.status}). ${detalle}`);
      if (r.status === 402 || /quota|billing|credit/i.test(detalle)) throw new ErrorVoz(`${etiqueta}: sin saldo o cuota agotada. ${detalle}`);
      if (r.status === 400 || r.status === 404 || r.status === 422) throw new ErrorVoz(`${etiqueta}: petición rechazada (${r.status}). ${detalle}`);
      ultimo = new Error(`${etiqueta}: HTTP ${r.status} ${detalle}`);
    } catch (e) {
      if (e instanceof ErrorVoz) throw e;
      ultimo = e;
    }
    if (intento < reintentos) await new Promise((res) => setTimeout(res, 1500 * intento));
  }
  throw new ErrorVoz(`${etiqueta}: no se pudo conectar (${String(ultimo?.cause?.code ?? ultimo?.message ?? ultimo).slice(0, 160)}). Revisa tu conexión a internet.`);
}
