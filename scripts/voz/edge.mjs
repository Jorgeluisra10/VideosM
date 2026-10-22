/**
 * Proveedor DESARROLLO · edge-tts (voces neuronales de Microsoft Edge): gratis, sin clave, con tiempo por palabra.
 * Necesita internet y Python 3 (instala edge-tts solo la primera vez).
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { ErrorVoz, ruta } from "./comun.mjs";

/** Atajos de voz (--voz) → nombre completo de edge-tts. */
export const VOCES_EDGE = {
  ar: "es-AR-TomasNeural",
  "ar-f": "es-AR-ElenaNeural",
  co: "es-CO-GonzaloNeural",
  "co-f": "es-CO-SalomeNeural",
  mx: "es-MX-JorgeNeural",
  "mx-f": "es-MX-DaliaNeural",
  es: "es-ES-AlvaroNeural",
  "es-f": "es-ES-ElviraNeural",
};

export const nombreVozEdge = (v) => VOCES_EDGE[String(v)] ?? String(v);

function buscarPython() {
  for (const [cmd, ...pre] of [["py", "-3"], ["python"], ["python3"]]) {
    const r = spawnSync(cmd, [...pre, "-c", "import sys; print(sys.version_info[0])"], { encoding: "utf8" });
    if (r.status === 0 && r.stdout.trim() === "3") return [cmd, ...pre];
  }
  return null;
}

const aSegundos = (h, m, s, ms) => Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms.padEnd(3, "0").slice(0, 3)) / 1000;

/** WebVTT con una palabra por cue → [{word,start,end}] */
export function parsearVtt(contenido) {
  const cues = [];
  const re = /(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})/;
  for (const b of contenido.replace(/\r/g, "").split(/\n{2,}/)) {
    const lineas = b.split("\n").map((l) => l.trim()).filter(Boolean);
    const i = lineas.findIndex((l) => re.test(l));
    if (i < 0) continue;
    const m = lineas[i].match(re);
    const word = lineas.slice(i + 1).join(" ").trim();
    if (word) cues.push({ word, start: aSegundos(m[1], m[2], m[3], m[4]), end: aSegundos(m[5], m[6], m[7], m[8]) });
  }
  return cues;
}

export async function sintetizarEdge({ texto, voz, velocidad = "+5%", tono = "+0Hz", volumen = "+0%", log = console.log }) {
  const py = buscarPython();
  if (!py) throw new ErrorVoz("No encuentro Python 3. Instálalo desde https://www.python.org/downloads/ (marca 'Add to PATH') y repite.");
  const [cmd, ...pre] = py;
  const entorno = { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" };
  if (spawnSync(cmd, [...pre, "-c", "import edge_tts"], { encoding: "utf8" }).status !== 0) {
    log("📦 Instalando edge-tts (gratis, sin API key)...");
    const inst = spawnSync(cmd, [...pre, "-m", "pip", "install", "--upgrade", "edge-tts"], { stdio: "inherit", env: entorno });
    if (inst.status !== 0) throw new ErrorVoz("No pude instalar edge-tts. Prueba a mano:  python -m pip install edge-tts");
  }
  const tmp = ruta("trabajo", "tmp", "voz");
  mkdirSync(tmp, { recursive: true });
  const rTexto = `${tmp}/guion-tts.txt`;
  const rMp3 = `${tmp}/voz-edge.mp3`;
  const rVtt = `${tmp}/voz-edge.vtt`;
  writeFileSync(rTexto, texto, "utf8");
  const res = spawnSync(cmd, [...pre, ruta("scripts", "voz_edge.py"), "--texto-archivo", rTexto, "--voz", nombreVozEdge(voz), "--velocidad", velocidad, "--tono", tono, "--volumen", volumen, "--mp3", rMp3, "--vtt", rVtt], { encoding: "utf8", env: entorno });
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  if (res.status !== 0) throw new ErrorVoz("Falló la síntesis de voz con edge-tts (revisa tu conexión a internet).");
  const mp3 = readFileSync(rMp3);
  const marcas = parsearVtt(readFileSync(rVtt, "utf8"));
  rmSync(tmp, { recursive: true, force: true });
  return { mp3, marcas, meta: { proveedor: "edge-tts", voz: nombreVozEdge(voz), velocidad, tono } };
}
