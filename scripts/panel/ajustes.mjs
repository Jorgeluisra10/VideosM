/**
 * Panel · ajustes (.env), diagnóstico del equipo y prueba de conexiones.
 * Las claves NUNCA salen del servidor: la interfaz solo recibe si existen y sus últimos 4 caracteres.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { buscarFfmpeg } from "../medios.mjs";
import { ejecutableNavegador } from "../navegador.mjs";
import { RAIZ } from "../ia/puente.mjs";

const RUTA_ENV = join(RAIZ, ".env");

/** Claves del .env que la interfaz puede leer/escribir. `secreta` = nunca se devuelve su valor. */
export const CLAVES = {
  OPENAI_API_KEY: { secreta: true },
  OPENAI_BASE_URL: {},
  OPENAI_MODEL: {},
  OPENAI_MODEL_PLAN: {},
  OPENAI_MODEL_VISION: {},
  OPENAI_MODEL_REVISOR: {},
  OPENAI_ESFUERZO: {},
  IA_MAX_RONDAS: {},
  IA_MAX_RONDAS_VISION: {},
  VOZ_MODE: {},
  VOZ_PROVEEDOR: {},
  OPENAI_TTS_VOICE: {},
  OPENAI_TTS_MODEL: {},
  OPENAI_STT_MODEL: {},
  ELEVENLABS_API_KEY: { secreta: true },
  ELEVENLABS_VOICE_ID: {},
  ELEVENLABS_MODEL: {},
};

function parsear() {
  const valores = {};
  if (!existsSync(RUTA_ENV)) return valores;
  for (const linea of readFileSync(RUTA_ENV, "utf8").replace(/^﻿/, "").split(/\r?\n/)) {
    const m = linea.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || linea.trim().startsWith("#")) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, "");
    valores[m[1]] = v;
  }
  return valores;
}

/** Lo que ve la interfaz: valores normales tal cual; secretos solo como «configurada» + últimos 4 caracteres. */
export function leerAjustes() {
  const v = parsear();
  const salida = {};
  for (const [k, def] of Object.entries(CLAVES)) {
    const valor = v[k] ?? "";
    salida[k] = def.secreta ? { configurada: Boolean(valor.trim()), final: valor.trim() ? valor.trim().slice(-4) : "" } : valor;
  }
  return salida;
}

/**
 * Escribe cambios en .env conservando comentarios y el resto de líneas.
 * cambios: { CLAVE: "valor" } · "" en una clave NO secreta la vacía · en una secreta "" = no tocar · { CLAVE: null } = borrar
 */
export function guardarAjustes(cambios) {
  let texto = existsSync(RUTA_ENV) ? readFileSync(RUTA_ENV, "utf8") : existsSync(join(RAIZ, ".env.example")) ? readFileSync(join(RAIZ, ".env.example"), "utf8") : "";
  const lineas = texto.split(/\r?\n/);
  for (const [k, valor] of Object.entries(cambios)) {
    if (!(k in CLAVES)) continue;
    if (CLAVES[k].secreta && valor === "") continue;
    if (typeof valor === "string" && /[\r\n]/.test(valor)) throw new Error(`El valor de ${k} no puede tener saltos de línea.`);
    const nuevo = valor === null ? `${k}=` : `${k}=${valor}`;
    const i = lineas.findIndex((l) => new RegExp(`^\\s*(export\\s+)?${k}\\s*=`).test(l));
    if (i >= 0) lineas[i] = nuevo;
    else lineas.push(nuevo);
  }
  writeFileSync(RUTA_ENV, lineas.join("\n").replace(/\n*$/, "\n"), { mode: 0o600 });
  // lo que ya está cargado en este proceso debe reflejar el cambio
  for (const [k, v] of Object.entries(parsear())) if (k in CLAVES) process.env[k] = v;
  for (const [k, valor] of Object.entries(cambios)) if (k in CLAVES && (valor === null || (valor === "" && !CLAVES[k].secreta))) delete process.env[k];
}

// ---------------------------------------------------------------------------
// Diagnóstico del equipo
// ---------------------------------------------------------------------------
function python() {
  for (const [cmd, ...pre] of [["py", "-3"], ["python"], ["python3"]]) {
    const r = spawnSync(cmd, [...pre, "-c", "import sys; print(sys.version.split()[0])"], { encoding: "utf8" });
    if (r.status === 0 && /^3\./.test(r.stdout.trim())) {
      const e = spawnSync(cmd, [...pre, "-c", "import edge_tts; print(getattr(edge_tts,'__version__','ok'))"], { encoding: "utf8" });
      return { version: r.stdout.trim(), edgeTts: e.status === 0 ? e.stdout.trim() || "ok" : null };
    }
  }
  return null;
}

async function alcanzable(url, ms = 2500) {
  try {
    await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(ms) });
    return true;
  } catch (e) {
    // un 403/404 también significa que hay red; solo el fallo de conexión cuenta como «no»
    return !/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|fetch failed|timeout|aborted/i.test(String(e?.cause?.code ?? e?.name ?? e?.message ?? ""));
  }
}

let cacheRed = { t: 0, v: null };
export async function entorno({ red = true } = {}) {
  const py = python();
  let ffmpeg = null;
  try {
    ffmpeg = buscarFfmpeg().ffmpeg;
  } catch {
    /* sin node_modules */
  }
  const sfx = ["pop", "whoosh", "heartbeat", "cash", "tick", "thud", "zap", "ding"].filter((n) => !existsSync(join(RAIZ, "public", "sfx", `${n}.wav`)));
  let disco = null;
  try {
    const st = statSync(RAIZ);
    void st;
    const r = spawnSync(process.platform === "win32" ? "wmic" : "df", process.platform === "win32" ? [] : ["-k", RAIZ], { encoding: "utf8" });
    const fila = String(r.stdout ?? "").trim().split("\n").pop()?.trim().split(/\s+/);
    if (process.platform !== "win32" && fila?.length >= 4) disco = { libreGB: Math.round((Number(fila[3]) / 1048576) * 10) / 10 };
  } catch {
    /* sin información */
  }
  if (red && Date.now() - cacheRed.t > 60000) {
    const [voz, openai, eleven] = await Promise.all([alcanzable("https://speech.platform.bing.com"), alcanzable("https://api.openai.com"), alcanzable("https://api.elevenlabs.io")]);
    cacheRed = { t: Date.now(), v: { voz, openai, elevenlabs: eleven } };
  }
  const env = parsear();
  return {
    node: process.version,
    plataforma: `${os.platform()} ${os.arch()}`,
    memoria: { totalGB: Math.round((os.totalmem() / 2 ** 30) * 10) / 10, libreGB: Math.round((os.freemem() / 2 ** 30) * 10) / 10 },
    disco,
    python: py,
    navegador: ejecutableNavegador() ?? "Chrome de Remotion (se descarga la primera vez que se renderiza)",
    ffmpeg: Boolean(ffmpeg),
    efectosFaltantes: sfx,
    healthicons: existsSync(join(RAIZ, "node_modules", "healthicons-react")),
    claves: { openai: Boolean((env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY ?? "").trim()), elevenlabs: Boolean((env.ELEVENLABS_API_KEY ?? process.env.ELEVENLABS_API_KEY ?? "").trim()) },
    red: red ? cacheRed.v : null,
  };
}

/** Prueba una conexión de verdad (GET barato). */
export async function probar(que) {
  const v = { ...parsear(), ...Object.fromEntries(Object.entries(process.env).filter(([k]) => k in CLAVES && process.env[k])) };
  try {
    if (que === "openai") {
      const clave = (v.OPENAI_API_KEY ?? "").trim();
      if (!clave) return { ok: false, mensaje: "Falta la clave de OpenAI." };
      const base = (v.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
      const r = await fetch(`${base}/models`, { headers: { Authorization: `Bearer ${clave}` }, signal: AbortSignal.timeout(15000) });
      if (r.status === 401) return { ok: false, mensaje: "OpenAI rechazó la clave (401). Revísala." };
      if (!r.ok) return { ok: false, mensaje: `OpenAI respondió ${r.status}.` };
      const j = await r.json();
      const ids = (j.data ?? []).map((m) => m.id);
      return { ok: true, mensaje: `Conexión correcta · ${ids.length} modelos disponibles.`, tts: ids.some((i) => /tts/.test(i)), whisper: ids.includes("whisper-1") };
    }
    if (que === "elevenlabs") {
      const clave = (v.ELEVENLABS_API_KEY ?? "").trim();
      if (!clave) return { ok: false, mensaje: "Falta la clave de ElevenLabs." };
      const base = (v.ELEVENLABS_BASE_URL || "https://api.elevenlabs.io").replace(/\/+$/, "");
      const r = await fetch(`${base}/v1/user`, { headers: { "xi-api-key": clave }, signal: AbortSignal.timeout(15000) });
      if (r.status === 401) return { ok: false, mensaje: "ElevenLabs rechazó la clave (401)." };
      if (!r.ok) return { ok: false, mensaje: `ElevenLabs respondió ${r.status}.` };
      const j = await r.json().catch(() => ({}));
      const sub = j.subscription;
      return { ok: true, mensaje: `Conexión correcta${sub ? ` · plan ${sub.tier} · ${sub.character_count}/${sub.character_limit} caracteres usados` : ""}.` };
    }
  } catch (e) {
    return { ok: false, mensaje: `No se pudo conectar: ${String(e?.cause?.code ?? e?.message ?? e).slice(0, 140)}` };
  }
  return { ok: false, mensaje: "Conexión desconocida." };
}

export const archivosDoc = () => ["GUIA", "LEEME", "GUIA-IA", "AGENTS", "CLAUDE", "GEMINI"].filter((n) => existsSync(join(RAIZ, `${n}.md`)));
export { readdirSync };
