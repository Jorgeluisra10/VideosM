/**
 * Configuración de la voz (archivos locales, sin base de datos):
 *   voz.config.json     voz, instrucciones, velocidad y formato por defecto (la clave de OpenAI NO va aquí: está en .env)
 *   pronunciacion.json  diccionario de pronunciación editable (siglas, marcas, dominios)
 *   data/uso-voz.json   contador mensual de caracteres generados
 *   cache/audio/        audios ya pagados, con nombre = hash de (texto + voz + instrucciones…): no se paga dos veces lo mismo
 */
import { join } from "node:path";
import { escribirJsonSeguro, leerJson } from "../archivo-seguro.mjs";
import { cargarNucleoAnim, RAIZ } from "./nucleo.mjs";

// Las carpetas se pueden mover con variables de entorno (las pruebas las apuntan a una carpeta temporal para no tocar tus datos):
//   VIDEMED_CONFIG = carpeta de voz.config.json y pronunciacion.json · VIDEMED_DATOS = carpeta data/ · VIDEMED_CACHE = carpeta cache/
export const dirConfig = (...p) => join(process.env.VIDEMED_CONFIG || RAIZ, ...p);
export const dirDatos = (...p) => join(process.env.VIDEMED_DATOS || join(RAIZ, "data"), ...p);
export const ARCHIVO_CONFIG = () => dirConfig("voz.config.json");
export const ARCHIVO_PRONUNCIACION = () => dirConfig("pronunciacion.json");
export const ARCHIVO_USO = () => dirDatos("uso-voz.json");
export const dirCacheAudio = (...p) => join(process.env.VIDEMED_CACHE || join(RAIZ, "cache"), "audio", ...p);

/** La configuración vigente (lo que falte o venga mal cae al valor por defecto). */
export async function leerConfigVoz() {
  const N = await cargarNucleoAnim();
  return N.normalizarConfigVoz(leerJson(ARCHIVO_CONFIG(), {}));
}

/** Guarda (parcialmente) la configuración: se mezcla con la actual, se valida y se escribe de forma atómica. */
export async function guardarConfigVoz(parcial) {
  const N = await cargarNucleoAnim();
  const nueva = N.normalizarConfigVoz({ ...(await leerConfigVoz()), ...parcial });
  escribirJsonSeguro(ARCHIVO_CONFIG(), nueva);
  return nueva;
}

/** Diccionario de pronunciación: pronunciacion.json si existe; si no, el de fábrica. */
export async function leerPronunciacion() {
  const N = await cargarNucleoAnim();
  const d = leerJson(ARCHIVO_PRONUNCIACION(), null);
  return d && typeof d === "object" && !Array.isArray(d) ? d : { ...N.PRONUNCIACION_BASE };
}

/** Valida y guarda el diccionario (texto → texto, ≤ 300 entradas, claves ≤ 60 y valores ≤ 160 caracteres). */
export async function guardarPronunciacion(dic) {
  if (!dic || typeof dic !== "object" || Array.isArray(dic)) throw Object.assign(new Error("El diccionario debe ser un objeto «palabra»: «cómo suena»."), { codigo: 400 });
  const limpio = {};
  const entradas = Object.entries(dic);
  if (entradas.length > 300) throw Object.assign(new Error("El diccionario admite hasta 300 entradas."), { codigo: 400 });
  for (const [k, v] of entradas) {
    if (typeof v !== "string" || !k.trim() || k.length > 60 || v.length > 160) throw Object.assign(new Error(`Entrada no válida: «${k.slice(0, 40)}» (las claves hasta 60 caracteres y los valores hasta 160, ambos texto).`), { codigo: 400 });
    limpio[k.trim()] = v.trim();
  }
  escribirJsonSeguro(ARCHIVO_PRONUNCIACION(), limpio);
  return limpio;
}

const mesActual = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** Suma caracteres enviados a un motor de voz («openai» | «eleven») en el mes en curso. Los audios que salen de la caché no cuentan. */
export function registrarUsoVoz({ motor = "openai", caracteres = 0, solicitudes = 1, ahora = new Date() }) {
  if (!(caracteres > 0)) return null;
  const uso = leerJson(ARCHIVO_USO(), {});
  const mes = mesActual(ahora);
  const m = (uso[mes] ??= {});
  const e = (m[motor] ??= { caracteres: 0, solicitudes: 0 });
  e.caracteres += Math.round(caracteres);
  e.solicitudes += solicitudes;
  escribirJsonSeguro(ARCHIVO_USO(), uso);
  return { mes, ...e };
}

/** Uso mensual: { mes, porMotor, total, historial: [{mes, caracteres}] }. */
export function leerUsoVoz(ahora = new Date()) {
  const uso = leerJson(ARCHIVO_USO(), {});
  const mes = mesActual(ahora);
  const suma = (m) => Object.values(m ?? {}).reduce((a, e) => a + (e.caracteres ?? 0), 0);
  return { mes, porMotor: uso[mes] ?? {}, total: suma(uso[mes]), historial: Object.keys(uso).sort().slice(-12).map((k) => ({ mes: k, caracteres: suma(uso[k]) })) };
}
