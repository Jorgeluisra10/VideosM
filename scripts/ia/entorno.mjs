/**
 * Configuración de la IA: lee `.env` (sin dependencias) y las variables de entorno.
 *
 *   OPENAI_API_KEY        obligatoria (salvo con el servidor de pruebas)
 *   OPENAI_BASE_URL       por defecto https://api.openai.com/v1 (sirve para Azure/proxies compatibles)
 *   OPENAI_MODEL          modelo general (guion, post). Vacío = elige el equilibrado más reciente de tu cuenta
 *   OPENAI_MODEL_PLAN     modelo del plan de escenas (la tarea más difícil). Vacío = el general
 *   OPENAI_MODEL_VISION   modelo con visión para revisar las capturas (vacío = el general)
 *   OPENAI_MODEL_REVISOR  modelo que revisa el guion médico (vacío = el general)
 *   OPENAI_ESFUERZO       esfuerzo de razonamiento: low | medium | high | xhigh | max (vacío = el de la API)
 *   IA_MAX_RONDAS         intentos de reparación del plan (por defecto 4)
 *   IA_MAX_RONDAS_VISION  rondas de revisión visual (por defecto 2; 0 = sin revisión visual)
 *   IA_TIMEOUT_S          segundos máximos por llamada (por defecto 600)
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ } from "./puente.mjs";

let cargado = false;

/** Lee `.env` de la raíz del proyecto. Lo que ya esté en el entorno tiene prioridad. */
export function cargarEnv() {
  if (cargado) return;
  cargado = true;
  const ruta = join(RAIZ, ".env");
  if (!existsSync(ruta)) return;
  for (const linea of readFileSync(ruta, "utf8").replace(/^﻿/, "").split(/\r?\n/)) {
    const m = linea.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || linea.trim().startsWith("#")) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, "");
    if (process.env[m[1]] === undefined || process.env[m[1]] === "") process.env[m[1]] = v;
  }
}

const entero = (v, def) => {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : def;
};

export function configuracion() {
  cargarEnv();
  const e = process.env;
  return {
    clave: (e.OPENAI_API_KEY ?? "").trim(),
    url: (e.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, ""),
    modelo: (e.OPENAI_MODEL ?? "").trim(),
    modeloPlan: (e.OPENAI_MODEL_PLAN ?? "").trim(),
    modeloVision: (e.OPENAI_MODEL_VISION ?? "").trim(),
    modeloRevisor: (e.OPENAI_MODEL_REVISOR ?? "").trim(),
    esfuerzo: (e.OPENAI_ESFUERZO ?? "").trim().toLowerCase(),
    maxRondas: entero(e.IA_MAX_RONDAS, 4),
    maxRondasVision: entero(e.IA_MAX_RONDAS_VISION, 2),
    timeoutS: entero(e.IA_TIMEOUT_S, 600) || 600,
  };
}

/** Oculta una clave para mostrarla en consola: sk-proj-…abcd */
export const enmascarar = (k) => (k ? (k.length > 12 ? `${k.slice(0, 7)}…${k.slice(-4)}` : "••••") : "(vacía)");
