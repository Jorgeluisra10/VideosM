#!/usr/bin/env node
/**
 * VideMed · Fase 2 — Síntesis de voz gratuita + timestamps por palabra.
 *
 * Uso:
 *   node scripts/generar-voz.mjs                        (lee src/data/guion.txt)
 *   node scripts/generar-voz.mjs --texto "Tu guion..."   (lo guarda en guion.txt)
 *   node scripts/generar-voz.mjs --archivo mi-guion.txt
 *   node scripts/generar-voz.mjs --voz mx --velocidad +10%
 *
 * Voces rápidas (--voz):
 *   ar    es-AR-TomasNeural   (por defecto)     ar-f  es-AR-ElenaNeural
 *   mx    es-MX-JorgeNeural                     mx-f  es-MX-DaliaNeural
 *   es    es-ES-AlvaroNeural                    es-f  es-ES-ElviraNeural
 *   (o cualquier nombre completo de voz de edge-tts)
 *
 * Genera:
 *   public/audios/voz.mp3        audio
 *   public/audios/tiempos.vtt    WebVTT, una palabra por cue
 *   src/data/timestamps.json     [{ "word": "...", "start": 0.12, "end": 0.45 }]
 *   src/data/meta.json           voz, duración, nº de palabras, etc.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...partes) => join(RAIZ, ...partes);

const VOCES = {
  ar: "es-AR-TomasNeural",
  "ar-f": "es-AR-ElenaNeural",
  mx: "es-MX-JorgeNeural",
  "mx-f": "es-MX-DaliaNeural",
  es: "es-ES-AlvaroNeural",
  "es-f": "es-ES-ElviraNeural",
};

// ---------- argumentos ----------
function leerArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    if (eq > -1) out[a.slice(2, eq)] = a.slice(eq + 1);
    else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith("--")) out[a.slice(2)] = argv[++i];
    else out[a.slice(2)] = true;
  }
  return out;
}

const args = leerArgs(process.argv.slice(2));
const voz = VOCES[args.voz] ?? args.voz ?? VOCES.ar;
const velocidad = String(args.velocidad ?? "+5%");
const tono = String(args.tono ?? "+0Hz");
const volumen = String(args.volumen ?? "+0%");

function fallo(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

// ---------- guion ----------
const rutaGuion = p("src", "data", "guion.txt");
let texto;
if (typeof args.texto === "string") {
  texto = args.texto;
} else if (typeof args.archivo === "string") {
  if (!existsSync(args.archivo)) fallo(`No existe el archivo ${args.archivo}`);
  texto = readFileSync(args.archivo, "utf8");
} else if (existsSync(rutaGuion)) {
  texto = readFileSync(rutaGuion, "utf8");
} else {
  fallo("No hay guion. Pásalo con --texto \"...\" o créalo en src/data/guion.txt");
}
texto = texto.replace(/\r/g, "").replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
if (!texto) fallo("El guion está vacío.");
mkdirSync(dirname(rutaGuion), { recursive: true });
writeFileSync(rutaGuion, texto + "\n", "utf8");

// ---------- Python + edge-tts ----------
function buscarPython() {
  const candidatos = [["py", "-3"], ["python"], ["python3"]];
  for (const [cmd, ...pre] of candidatos) {
    const r = spawnSync(cmd, [...pre, "-c", "import sys; print(sys.version_info[0])"], { encoding: "utf8" });
    if (r.status === 0 && r.stdout.trim() === "3") return [cmd, ...pre];
  }
  return null;
}

const py = buscarPython();
if (!py) {
  fallo("No encuentro Python 3. Instálalo desde https://www.python.org/downloads/ (marca 'Add to PATH') y repite.");
}
const [pyCmd, ...pyPre] = py;
const entorno = { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" };

if (spawnSync(pyCmd, [...pyPre, "-c", "import edge_tts"], { encoding: "utf8" }).status !== 0) {
  console.log("📦 Instalando edge-tts (gratis, sin API key)...");
  const inst = spawnSync(pyCmd, [...pyPre, "-m", "pip", "install", "--upgrade", "edge-tts"], {
    stdio: "inherit",
    env: entorno,
  });
  if (inst.status !== 0) fallo("No pude instalar edge-tts. Prueba a mano:  python -m pip install edge-tts");
}

// ---------- sintetizar ----------
mkdirSync(p("public", "audios"), { recursive: true });
mkdirSync(p("trabajo", "tmp"), { recursive: true });
const rutaTexto = p("trabajo", "tmp", "guion-tts.txt");
const rutaMp3 = p("public", "audios", "voz.mp3");
const rutaVtt = p("public", "audios", "tiempos.vtt");
writeFileSync(rutaTexto, texto, "utf8");

console.log(`🎙️  Voz: ${voz}  ·  velocidad ${velocidad}  ·  tono ${tono}`);
const res = spawnSync(
  pyCmd,
  [
    ...pyPre,
    p("scripts", "voz_edge.py"),
    "--texto-archivo", rutaTexto,
    "--voz", voz,
    "--velocidad", velocidad,
    "--tono", tono,
    "--volumen", volumen,
    "--mp3", rutaMp3,
    "--vtt", rutaVtt,
  ],
  { encoding: "utf8", env: entorno },
);
if (res.stdout) process.stdout.write(res.stdout);
if (res.stderr) process.stderr.write(res.stderr);
if (res.status !== 0) fallo("Falló la síntesis de voz (revisa tu conexión a internet).");

// ---------- parser VTT/SRT -> palabras ----------
function aSegundos(h, m, s, ms) {
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms.padEnd(3, "0").slice(0, 3)) / 1000;
}

function parsearVtt(contenido) {
  const cues = [];
  const bloques = contenido.replace(/\r/g, "").split(/\n{2,}/);
  const re = /(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})/;
  for (const b of bloques) {
    const lineas = b.split("\n").map((l) => l.trim()).filter(Boolean);
    const i = lineas.findIndex((l) => re.test(l));
    if (i < 0) continue;
    const m = lineas[i].match(re);
    const text = lineas.slice(i + 1).join(" ").trim();
    if (!text) continue;
    cues.push({ start: aSegundos(m[1], m[2], m[3], m[4]), end: aSegundos(m[5], m[6], m[7], m[8]), text });
  }
  return cues;
}

const norm = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * El servicio devuelve las palabras SIN signos (¿, ?, comas...). Se vuelven a alinear
 * con las palabras del guion original para que los subtítulos conserven la puntuación.
 */
function alinear(tokens, cues) {
  const out = [];
  const avisos = [];
  let j = 0;
  let prefijo = "";
  for (const tok of tokens) {
    const nt = norm(tok);
    if (!nt) {
      // signo suelto ("—", "¿"): se pega a la palabra vecina
      if (out.length) out[out.length - 1].word += ` ${tok}`;
      else prefijo += tok;
      continue;
    }
    let acc = "";
    let primero = null;
    let ultimo = null;
    let k = j;
    while (k < cues.length) {
      const nb = norm(cues[k].text);
      if (!nb) { k++; continue; }
      if (!nt.startsWith(acc + nb)) break;
      primero ??= cues[k];
      ultimo = cues[k];
      acc += nb;
      k++;
      if (acc === nt) break;
    }
    if (acc === nt && primero) {
      out.push({ word: prefijo + tok, start: primero.start, end: ultimo.end });
      prefijo = "";
      j = k;
    } else {
      // no coincide: se consume 1 marca para no desfasar el resto
      const c = cues[Math.min(j, cues.length - 1)];
      avisos.push(tok);
      out.push({ word: prefijo + tok, start: c.start, end: c.end });
      prefijo = "";
      j = Math.min(j + 1, cues.length);
    }
  }
  return { out, avisos };
}

const cues = parsearVtt(readFileSync(rutaVtt, "utf8"));
if (!cues.length) fallo("El archivo de tiempos salió vacío.");
const tokens = texto.split(/\s+/).filter(Boolean);
const { out: palabras, avisos } = alinear(tokens, cues);

// monotonía: ninguna palabra empieza antes de que termine la anterior (evita saltos del resaltado)
for (let i = 0; i < palabras.length; i++) {
  const w = palabras[i];
  if (i > 0 && w.start < palabras[i - 1].start) w.start = palabras[i - 1].start;
  if (w.end < w.start + 0.04) w.end = w.start + 0.04;
}
const timestamps = palabras.map((w) => ({
  word: w.word,
  start: Math.round(w.start * 1000) / 1000,
  end: Math.round(w.end * 1000) / 1000,
}));
writeFileSync(p("src", "data", "timestamps.json"), JSON.stringify(timestamps, null, 2) + "\n", "utf8");

const bytes = statSync(rutaMp3).size;
const duracionAudio = Math.round(((bytes * 8) / 48000) * 100) / 100; // edge-tts: mp3 mono 48 kbps
const ultimaFin = timestamps[timestamps.length - 1].end;
const meta = {
  voz,
  velocidad,
  tono,
  palabras: timestamps.length,
  duracionAudio,
  ultimaPalabraFin: ultimaFin,
  texto,
  generado: new Date().toISOString(),
};
writeFileSync(p("src", "data", "meta.json"), JSON.stringify(meta, null, 2) + "\n", "utf8");

// ---------- resumen ----------
console.log(`\n✅ ${timestamps.length} palabras · audio ≈ ${duracionAudio}s · última palabra termina en ${ultimaFin}s`);
console.log("   → public/audios/voz.mp3");
console.log("   → public/audios/tiempos.vtt");
console.log("   → src/data/timestamps.json");
if (avisos.length) console.warn(`⚠️  No pude alinear con certeza: ${avisos.join(", ")} (revisa los subtítulos de esas palabras)`);
// el rango de palabras depende del perfil del proyecto (medicina 85–110; inmobiliaria 70–100…)
let rango = [85, 110];
let maxSeg = 45;
try {
  const tema = JSON.parse(readFileSync(p("src", "data", "tema.json"), "utf8"));
  const perfil = JSON.parse(readFileSync(p("perfiles", tema.perfil || "medicina", "perfil.json"), "utf8"));
  if (Array.isArray(perfil.palabras)) rango = perfil.palabras;
  if (perfil.duracion) maxSeg = Math.round(perfil.duracion * 1.3);
} catch {
  /* sin perfil: se usa el rango médico de siempre */
}
if (timestamps.length < rango[0] - 5 || timestamps.length > rango[1] + 5)
  console.warn(`⚠️  El guion tiene ${timestamps.length} palabras (objetivo ${rango[0]}–${rango[1]}).`);
if (ultimaFin > maxSeg) console.warn(`⚠️  Dura ${ultimaFin}s: demasiado largo para este tipo de video (máx. ≈ ${maxSeg} s).`);
