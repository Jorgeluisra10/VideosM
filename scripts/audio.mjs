/**
 * VideMed · mezcla de audio SIN navegador.
 *
 * Replica lo que monta src/VideoMedico.tsx — voz (volumen 1) + ambiente en bucle (rampa de entrada y
 * salida a 0,07; solo si la marca lo pide) + música de la marca (si hay) + cada efecto de tema.sfx en su
 * fotograma (public/sfx/<tipo>.wav) — pero directamente en Node:
 * es determinista, tarda segundos y no necesita Chrome (que en equipos justos de memoria es lo que falla).
 *
 *   import { mezclarAudio } from "./audio.mjs";
 *   await mezclarAudio({ raiz, ffmpeg, segundos, salidaWav })
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { build } from "esbuild";

export const SR = 48000;
const FPS = 60;

/** Lee la lista de efectos del tema activo (src/sonido.ts) empaquetándola con esbuild, sin cargar React. */
async function cargarSonido(raiz) {
  const r = await build({
    entryPoints: [join(raiz, "src", "sonido.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
    logLevel: "silent",
    loader: { ".json": "json" },
  });
  const codigo = r.outputFiles[0].text;
  return import("data:text/javascript;base64," + Buffer.from(codigo).toString("base64"));
}

/**
 * Decodifica cualquier audio a PCM float mono a 48 kHz con el ffmpeg incluido en Remotion.
 * Esa build es mínima (sin muxers "crudos"): se decodifica a un WAV temporal y se lee en Node.
 */
export function decodificar(ffmpeg, ruta, tmpDir) {
  mkdirSync(tmpDir, { recursive: true });
  const tmp = join(tmpDir, `dec-${basename(ruta)}.wav`);
  const r = spawnSync(ffmpeg, ["-v", "error", "-y", "-i", ruta, "-ac", "1", "-ar", String(SR), "-c:a", "pcm_s16le", tmp], { encoding: "utf8" });
  if (r.status !== 0 || !existsSync(tmp)) throw new Error(`No pude decodificar ${ruta}: ${String(r.stderr ?? r.error ?? "").slice(0, 200)}`);
  const b = readFileSync(tmp);
  rmSync(tmp, { force: true });
  let o = 12;
  while (o + 8 <= b.length) {
    const id = b.toString("ascii", o, o + 4);
    const tam = b.readUInt32LE(o + 4);
    if (id === "data") {
      const n = Math.floor(Math.min(tam, b.length - (o + 8)) / 2);
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) out[i] = b.readInt16LE(o + 8 + i * 2) / 32768;
      return out;
    }
    o += 8 + tam + (tam % 2);
  }
  throw new Error(`WAV sin datos: ${ruta}`);
}

const interpolar = (x, xs, ys) => {
  if (x <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]) return ys[i - 1] + ((ys[i] - ys[i - 1]) * (x - xs[i - 1])) / (xs[i] - xs[i - 1]);
  }
  return ys[ys.length - 1];
};

export function escribirWavEstereo(ruta, mono) {
  const n = mono.length;
  const datos = Buffer.alloc(44 + n * 4);
  datos.write("RIFF", 0);
  datos.writeUInt32LE(36 + n * 4, 4);
  datos.write("WAVEfmt ", 8);
  datos.writeUInt32LE(16, 16);
  datos.writeUInt16LE(1, 20);
  datos.writeUInt16LE(2, 22);
  datos.writeUInt32LE(SR, 24);
  datos.writeUInt32LE(SR * 4, 28);
  datos.writeUInt16LE(4, 32);
  datos.writeUInt16LE(16, 34);
  datos.write("data", 36);
  datos.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.round(Math.max(-1, Math.min(1, mono[i])) * 32767);
    datos.writeInt16LE(v, 44 + i * 4);
    datos.writeInt16LE(v, 46 + i * 4);
  }
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, datos);
}

export async function mezclarAudio({ raiz, ffmpeg, segundos, salidaWav }) {
  const { sfx, DUR_SFX, VOL_SFX, archivoSfx } = await cargarSonido(raiz);
  // si falta algún efecto en public/sfx (o el ambiente), se sintetiza (propio, sin licencias ni descargas)
  const faltan = [...new Set(sfx.map((s) => archivoSfx(s.tipo)))].some((f) => !existsSync(join(raiz, "public", f))) || !existsSync(join(raiz, "public", "audios", "ambiente.wav"));
  if (faltan) spawnSync(process.execPath, [join(raiz, "scripts", "generar-sfx.mjs"), "--solo-faltantes"], { cwd: raiz, stdio: "ignore" });
  const audios = join(raiz, "public", "audios");
  const N = Math.ceil(segundos * SR);
  const mezcla = new Float32Array(N);
  const totalFrames = Math.round(segundos * FPS);

  // Voz (volumen 1)
  const tmpDir = join(dirname(salidaWav), "dec");
  const voz = decodificar(ffmpeg, join(audios, "voz.mp3"), tmpDir);
  for (let i = 0; i < Math.min(N, voz.length); i++) mezcla[i] += voz[i];

  // La marca (src/data/marca.json) decide si hay ambiente y música; sin archivo = el comportamiento de siempre
  let marca = {};
  try {
    marca = JSON.parse(readFileSync(join(raiz, "src", "data", "marca.json"), "utf8"));
  } catch {
    /* proyectos antiguos: ambiente activado, sin música */
  }

  // Ambiente en bucle: 0 → 0,07 en los primeros 90 fotogramas, 0,07 → 0 en los últimos 120
  if (marca.ambiente !== false) {
    const amb = decodificar(ffmpeg, join(audios, "ambiente.wav"), tmpDir);
    const xs = [0, 90, totalFrames - 120, totalFrames];
    const ys = [0, 0.07, 0.07, 0];
    for (let i = 0; i < N; i++) mezcla[i] += amb[i % amb.length] * interpolar((i / SR) * FPS, xs, ys);
  }

  // Música de la marca en bucle: 0 → vol en 60 fotogramas, vol → 0 en los últimos 90
  if (marca.musica && existsSync(join(raiz, "public", "media", marca.musica))) {
    const mus = decodificar(ffmpeg, join(raiz, "public", "media", marca.musica), tmpDir);
    const v = typeof marca.volumenMusica === "number" ? marca.volumenMusica : 0.14;
    const xs = [0, 60, totalFrames - 90, totalFrames];
    const ys = [0, v, v, 0];
    for (let i = 0; i < N; i++) mezcla[i] += mus[i % mus.length] * interpolar((i / SR) * FPS, xs, ys);
  }

  // Efectos: cada uno arranca en su fotograma (como <Sequence from>) y se corta a su duración
  const cache = new Map();
  let usados = 0;
  for (const s of sfx) {
    if (!cache.has(s.tipo)) cache.set(s.tipo, decodificar(ffmpeg, join(raiz, "public", archivoSfx(s.tipo)), tmpDir));
    const buf = cache.get(s.tipo);
    const inicio = Math.round((Math.round(s.t * FPS) / FPS) * SR);
    const largo = Math.min(buf.length, Math.ceil(DUR_SFX[s.tipo] * FPS) * (SR / FPS));
    const vol = s.vol ?? VOL_SFX;
    for (let k = 0; k < largo; k++) {
      const i = inicio + k;
      if (i >= 0 && i < N) mezcla[i] += buf[k] * vol;
    }
    usados++;
  }

  // Limitador: si la suma pasa de 0,97 se baja todo proporcionalmente (nunca recorta)
  let pico = 0;
  for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(mezcla[i]));
  if (pico > 0.97) for (let i = 0; i < N; i++) mezcla[i] *= 0.97 / pico;

  rmSync(tmpDir, { recursive: true, force: true });
  escribirWavEstereo(salidaWav, mezcla);
  return { efectos: usados, pico: Math.min(pico, 0.97), segundos: N / SR };
}

// ---------------------------------------------------------------------------
// Posproceso de la voz y de la mezcla: silencios largos, ducking de la música y volumen de plataforma (-14 LUFS)
// ---------------------------------------------------------------------------
const VENTANA_MS = 10;
/** RMS de la música sintetizada del proyecto (≈ −16,9 dBFS): toda música se nivela a esto antes de mezclarla. */
export const RMS_MUSICA_REFERENCIA = 0.1429;
/** Ganancia de la música cuando hay voz: con el ducking deja la música ≈ 24 dB por debajo de la voz mientras habla (regla: −22 a −26 dB). */
export const NIVEL_MUSICA_CON_VOZ = 1.4;

/** Silencios largos DENTRO de una frase (más de `max` s por debajo de `umbral` de RMS) se acortan a `deja` s; los bordes no se tocan. */
export function recortarSilenciosLargos(x, { umbral = 0.006, max = 0.6, deja = 0.35 } = {}) {
  const w = Math.round((VENTANA_MS / 1000) * SR);
  const n = Math.floor(x.length / w);
  const silencio = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    let a = 0;
    for (let k = i * w; k < (i + 1) * w; k++) a += x[k] * x[k];
    silencio[i] = Math.sqrt(a / w) < umbral;
  }
  let ini = 0;
  while (ini < n && silencio[ini]) ini++;
  let fin = n - 1;
  while (fin > ini && silencio[fin]) fin--;
  const trozos = [];
  let desde = 0, quitados = 0;
  for (let i = ini; i <= fin; ) {
    if (!silencio[i]) { i++; continue; }
    let j = i;
    while (j <= fin && silencio[j]) j++;
    const largo = (j - i) * w;
    if (largo > max * SR) {
      const conserva = Math.round(deja * SR), mitad = Math.floor(conserva / 2);
      trozos.push(x.subarray(desde, i * w + mitad), x.subarray(j * w - (conserva - mitad), j * w));
      quitados += largo - conserva;
      desde = j * w;
    }
    i = j;
  }
  if (!quitados) return { audio: x, quitadosSeg: 0 };
  trozos.push(x.subarray(desde));
  const sal = new Float32Array(x.length - quitados);
  let o = 0;
  for (const t of trozos) { sal.set(t, o); o += t.length; }
  return { audio: sal, quitadosSeg: quitados / SR };
}

/** Envolvente de la voz (0 = calla, 1 = habla) con ataque rápido y caída lenta, una muestra cada 10 ms. */
export function envolventeVoz(voz, { umbral = 0.012, ataque = 0.03, soltar = 0.35 } = {}) {
  const w = Math.round((VENTANA_MS / 1000) * SR), n = Math.floor(voz.length / w), dt = VENTANA_MS / 1000;
  const ca = 1 - Math.exp(-dt / ataque), cs = 1 - Math.exp(-dt / soltar);
  const env = new Float32Array(n);
  let e = 0;
  for (let i = 0; i < n; i++) {
    let a = 0;
    for (let k = i * w; k < (i + 1) * w; k++) a += voz[k] * voz[k];
    const objetivo = Math.sqrt(a / w) > umbral ? 1 : 0;
    e += (objetivo - e) * (objetivo > e ? ca : cs);
    env[i] = e;
  }
  return env;
}

/** Ducking: baja `base` (música, o el audio ya mezclado) mientras habla `voz`. `profundidad` 0,65 = hasta ×0,35 (≈ −9 dB). Modifica `base` en el sitio. */
export function duckear(base, voz, { profundidad = 0.65, ...o } = {}) {
  const env = envolventeVoz(voz, o), w = Math.round((VENTANA_MS / 1000) * SR);
  let minimo = 1;
  for (let i = 0; i < base.length; i++) {
    const p = Math.min(env.length - 1, i / w), a = Math.floor(p), b = Math.min(env.length - 1, a + 1);
    const e = env.length ? env[a] + (env[b] - env[a]) * (p - a) : 0;
    const g = 1 - profundidad * e;
    if (g < minimo) minimo = g;
    base[i] *= g;
  }
  return { gananciaMinima: minimo };
}

/** Mide el volumen de un archivo con loudnorm (EBU R128): { integrado (LUFS), picoVerdadero (dBTP), lra }. null si no hay señal. */
export function medirLUFS(ffmpeg, archivo, { objetivo = -14, pico = -1.5, lra = 11 } = {}) {
  const r = spawnSync(ffmpeg, ["-hide_banner", "-nostats", "-i", archivo, "-vn", "-af", `loudnorm=I=${objetivo}:TP=${pico}:LRA=${lra}:print_format=json`, "-f", "null", "-"], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  const m = /\{[^{}]*"input_i"[^{}]*\}/.exec(String(r.stderr ?? ""));
  if (!m) return null;
  const j = JSON.parse(m[0]);
  const num = (v) => { const x = Number(v); return Number.isFinite(x) ? x : null; };
  const integrado = num(j.input_i);
  if (integrado === null || integrado < -69) return null;
  return { integrado, picoVerdadero: num(j.input_tp), lra: num(j.input_lra), umbral: num(j.input_thresh), desfase: num(j.target_offset) };
}

/** Normaliza el volumen (loudnorm en dos pasadas, lineal) y escribe `salida` (wav estéreo 48 kHz). Devuelve las mediciones o null si no hay señal / ffmpeg falla. */
export function normalizarLUFS(ffmpeg, entrada, salida, { objetivo = -14, pico = -1.5, lra = 11 } = {}) {
  const med = medirLUFS(ffmpeg, entrada, { objetivo, pico, lra });
  if (!med || med.umbral === null || med.desfase === null) return null;
  const filtro = `loudnorm=I=${objetivo}:TP=${pico}:LRA=${lra}:measured_I=${med.integrado}:measured_TP=${med.picoVerdadero}:measured_LRA=${med.lra}:measured_thresh=${med.umbral}:offset=${med.desfase}:linear=true`;
  const r = spawnSync(ffmpeg, ["-v", "error", "-y", "-i", entrada, "-af", filtro, "-ar", String(SR), "-ac", "2", "-c:a", "pcm_s16le", salida], { encoding: "utf8" });
  if (r.status !== 0 || !existsSync(salida)) return null;
  return { antes: med.integrado, picoAntes: med.picoVerdadero, objetivo };
}

/** Normaliza un wav EN EL SITIO (escribe un temporal y lo renombra). true si se aplicó. */
export function normalizarEnSitio(ffmpeg, wav, opciones) {
  const tmp = `${wav}.norm.wav`;
  const r = normalizarLUFS(ffmpeg, wav, tmp, opciones);
  if (!r) { rmSync(tmp, { force: true }); return null; }
  renameSync(tmp, wav);
  return r;
}

/**
 * Mezcla SOLO efectos de sonido (sin voz, sin ambiente, sin música) para el motor de animación.
 * `eventos` = [{ frame, tipo, vol }] con fotograma absoluto (lo da eventosSfx() de src/anim/sonido.ts).
 */
export async function mezclarSfx({ raiz, ffmpeg, segundos, salidaWav, eventos, musica, vozWav, fondoWav }) {
  const { DUR_SFX, VOL_SFX, archivoSfx } = await cargarSonido(raiz);
  const faltan = [...new Set(eventos.map((s) => archivoSfx(s.tipo)))].some((f) => !existsSync(join(raiz, "public", f))) || (musica && !existsSync(join(raiz, "public", musica.archivo)));
  if (faltan) spawnSync(process.execPath, [join(raiz, "scripts", "generar-sfx.mjs"), "--solo-faltantes"], { cwd: raiz, stdio: "ignore" });
  const N = Math.ceil(segundos * SR);
  const mezcla = new Float32Array(N);
  const tmpDir = join(dirname(salidaWav), "dec");
  const cache = new Map();
  // voz en off (pista ya colocada por escena en scripts/anim/voz.mjs): volumen 1; se decodifica primero porque la música se «agacha» cuando habla
  const voz = vozWav ? decodificar(ffmpeg, vozWav, tmpDir) : null;
  // música de fondo en bucle (motor viral): rampa de entrada y de salida, igual que <Audio volume> en src/anim/Animacion.tsx.
  // Se nivela a un RMS de referencia (la pista sintetizada del proyecto) para que una música libre que pongas en public/audios/musica.wav
  // (scripts/anim/musica.mjs) suene al mismo nivel, sea cual sea el volumen con el que venga.
  let fondoMusica = null;
  if (musica) {
    const mus = decodificar(ffmpeg, join(raiz, "public", musica.archivo), tmpDir);
    let q = 0;
    for (let i = 0; i < mus.length; i++) q += mus[i] * mus[i];
    const rmsMus = Math.sqrt(q / Math.max(1, mus.length));
    const nivela = rmsMus > 1e-5 ? Math.min(6, Math.max(0.1, RMS_MUSICA_REFERENCIA / rmsMus)) : 1;
    fondoMusica = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const seg = i / SR;
      const rampa = Math.min(1, seg / musica.entrada, Math.max(0, (segundos - seg) / musica.salida));
      fondoMusica[i] = mus[i % mus.length] * nivela * musica.volumen * rampa;
    }
  }
  // efectos de sonido (cada uno arranca en su fotograma y se corta a su duración), sin el ajuste de volumen por la voz
  const fxMezcla = new Float32Array(N);
  for (const s of eventos) {
    if (!cache.has(s.tipo)) cache.set(s.tipo, decodificar(ffmpeg, join(raiz, "public", archivoSfx(s.tipo)), tmpDir));
    const buf = cache.get(s.tipo);
    const inicio = Math.round(s.frame * (SR / FPS));
    const largo = Math.min(buf.length, Math.ceil(DUR_SFX[s.tipo] * FPS) * (SR / FPS));
    const vol = s.vol ?? VOL_SFX;
    for (let k = 0; k < largo; k++) {
      const i = inicio + k;
      if (i >= 0 && i < N) fxMezcla[i] += buf[k] * vol;
    }
  }
  // pista «música + efectos» sola (sin voz y sin ducking): sirve para reeditar con otra voz
  if (fondoWav) {
    const f = new Float32Array(N);
    for (let i = 0; i < N; i++) f[i] = (fondoMusica ? fondoMusica[i] : 0) + fxMezcla[i];
    let pf = 0;
    for (let i = 0; i < N; i++) pf = Math.max(pf, Math.abs(f[i]));
    if (pf > 0.97) for (let i = 0; i < N; i++) f[i] *= 0.97 / pf;
    mkdirSync(dirname(fondoWav), { recursive: true });
    escribirWavEstereo(fondoWav, f);
  }
  // mezcla final: con voz, la música sube ×1,4 (≈ −24 dB bajo la voz mientras habla, medido) y se agacha con el ducking; los efectos ×0,8
  if (fondoMusica) {
    if (voz) {
      for (let i = 0; i < N; i++) fondoMusica[i] *= NIVEL_MUSICA_CON_VOZ;
      duckear(fondoMusica, voz); // ducking: baja ≈ 9 dB mientras habla y vuelve a subir en las pausas
    }
    for (let i = 0; i < N; i++) mezcla[i] += fondoMusica[i];
  }
  if (voz) for (let i = 0; i < Math.min(N, voz.length); i++) mezcla[i] += voz[i];
  for (let i = 0; i < N; i++) mezcla[i] += fxMezcla[i] * (voz ? 0.8 : 1);
  let pico = 0;
  for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(mezcla[i]));
  if (pico > 0.97) for (let i = 0; i < N; i++) mezcla[i] *= 0.97 / pico;
  rmSync(tmpDir, { recursive: true, force: true });
  escribirWavEstereo(salidaWav, mezcla);
  return { efectos: eventos.length, pico: Math.min(pico, 0.97), segundos: N / SR };
}
