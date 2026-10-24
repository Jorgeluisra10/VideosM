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
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { build } from "esbuild";

const SR = 48000;
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
function decodificar(ffmpeg, ruta, tmpDir) {
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

function escribirWavEstereo(ruta, mono) {
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

/**
 * Mezcla SOLO efectos de sonido (sin voz, sin ambiente, sin música) para el motor de animación.
 * `eventos` = [{ frame, tipo, vol }] con fotograma absoluto (lo da eventosSfx() de src/anim/sonido.ts).
 */
export async function mezclarSfx({ raiz, ffmpeg, segundos, salidaWav, eventos, musica }) {
  const { DUR_SFX, VOL_SFX, archivoSfx } = await cargarSonido(raiz);
  const faltan = [...new Set(eventos.map((s) => archivoSfx(s.tipo)))].some((f) => !existsSync(join(raiz, "public", f))) || (musica && !existsSync(join(raiz, "public", musica.archivo)));
  if (faltan) spawnSync(process.execPath, [join(raiz, "scripts", "generar-sfx.mjs"), "--solo-faltantes"], { cwd: raiz, stdio: "ignore" });
  const N = Math.ceil(segundos * SR);
  const mezcla = new Float32Array(N);
  const tmpDir = join(dirname(salidaWav), "dec");
  const cache = new Map();
  // música de fondo en bucle (motor viral): rampa de entrada y de salida, igual que <Audio volume> en src/anim/Animacion.tsx
  if (musica) {
    const mus = decodificar(ffmpeg, join(raiz, "public", musica.archivo), tmpDir);
    for (let i = 0; i < N; i++) {
      const seg = i / SR;
      const rampa = Math.min(1, seg / musica.entrada, Math.max(0, (segundos - seg) / musica.salida));
      mezcla[i] += mus[i % mus.length] * musica.volumen * rampa;
    }
  }
  for (const s of eventos) {
    if (!cache.has(s.tipo)) cache.set(s.tipo, decodificar(ffmpeg, join(raiz, "public", archivoSfx(s.tipo)), tmpDir));
    const buf = cache.get(s.tipo);
    const inicio = Math.round(s.frame * (SR / FPS));
    const largo = Math.min(buf.length, Math.ceil(DUR_SFX[s.tipo] * FPS) * (SR / FPS));
    const vol = s.vol ?? VOL_SFX;
    for (let k = 0; k < largo; k++) {
      const i = inicio + k;
      if (i >= 0 && i < N) mezcla[i] += buf[k] * vol;
    }
  }
  let pico = 0;
  for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(mezcla[i]));
  if (pico > 0.97) for (let i = 0; i < N; i++) mezcla[i] *= 0.97 / pico;
  rmSync(tmpDir, { recursive: true, force: true });
  escribirWavEstereo(salidaWav, mezcla);
  return { efectos: eventos.length, pico: Math.min(pico, 0.97), segundos: N / SR };
}
