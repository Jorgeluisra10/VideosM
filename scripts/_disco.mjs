/**
 * VideMed · espacio en disco. El render escribe miles de fotogramas (JPEG) y un disco casi lleno (típico en C:) rompe todo con ENOSPC.
 *
 *  - espacioLibreGB(ruta)        GB libres del disco donde está `ruta` (null si no se puede saber)
 *  - limpiarTemporales(opciones) borra lo que ya no sirve de trabajo/tmp (renders viejos o cortados, capturas, empaquetados antiguos)
 *  - esSinEspacio(error)         ¿el error es «no queda espacio en el disco»?
 *  - mensajeSinEspacio()         qué hacer cuando no queda espacio (para mostrarlo al usuario)
 *
 * No importa Remotion: se puede usar desde el panel, el render y `npm run limpiar`.
 */
import { existsSync, readdirSync, rmSync, statSync, statfsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const TMP = join(RAIZ, "trabajo", "tmp");

/** GB libres en el disco de `ruta` (la ruta debe existir; si no, sube al directorio padre que exista). */
export function espacioLibreGB(ruta = RAIZ) {
  // gancho de pruebas: VIDEMED_DISCO_GB=0.1 simula un disco casi lleno
  if (process.env.VIDEMED_DISCO_GB) return Number(process.env.VIDEMED_DISCO_GB);
  let r = ruta;
  while (r && !existsSync(r) && dirname(r) !== r) r = dirname(r);
  try {
    const s = statfsSync(r);
    return (Number(s.bavail) * Number(s.bsize)) / 2 ** 30;
  } catch {
    return null;
  }
}

/** Tamaño en bytes de una carpeta (recursivo, sin seguir enlaces). */
export function tamanoCarpeta(dir) {
  let total = 0;
  try {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const ruta = join(dir, e.name);
      if (e.isDirectory()) total += tamanoCarpeta(ruta);
      else if (e.isFile()) total += statSync(ruta).size;
    }
  } catch {
    /* carpeta que desaparece mientras se mide */
  }
  return total;
}

/**
 * Borra de trabajo/tmp todo lo que no esté en `conservar` (nombres de carpeta o archivo directos): renders cortados (render-anim-*, render),
 * capturas (anim-previa, qa-rapido), empaquetados antiguos (bundle-cache) y la carpeta temporal del sistema (sistema).
 * Devuelve { liberadoGB, borradas: [{ nombre, gb }] }.
 */
export function limpiarTemporales({ conservar = [], tmp = TMP } = {}) {
  const borradas = [];
  if (!existsSync(tmp)) return { liberadoGB: 0, borradas };
  for (const e of readdirSync(tmp, { withFileTypes: true })) {
    if (conservar.includes(e.name)) continue;
    const ruta = join(tmp, e.name);
    const bytes = e.isDirectory() ? tamanoCarpeta(ruta) : statSync(ruta).size;
    try {
      rmSync(ruta, { recursive: true, force: true });
      borradas.push({ nombre: e.name, gb: bytes / 2 ** 30 });
    } catch {
      /* en uso: se deja */
    }
  }
  return { liberadoGB: borradas.reduce((s, b) => s + b.gb, 0), borradas };
}

export const esSinEspacio = (e) => e?.code === "ENOSPC" || /ENOSPC|no space left|not enough space|espacio suficiente|disk full|there is not enough space/i.test(String(e?.message ?? e));

/** Mensaje claro para quien no es técnico. */
export function mensajeSinEspacio(libreGB) {
  const libre = libreGB == null ? "" : ` (quedan ${libreGB.toFixed(2)} GB libres)`;
  return [
    `💾 El disco donde está el proyecto se quedó sin espacio${libre}.`,
    "   Cómo arreglarlo (de más fácil a más trabajo):",
    "   1. Ejecuta  npm run limpiar  (borra temporales y renders cortados de este proyecto).",
    "   2. En Windows: Configuración → Sistema → Almacenamiento → «Archivos temporales», y vacía la Papelera.",
    "   3. Mueve la carpeta del proyecto a otro disco con más espacio (por ejemplo D:) y vuelve a lanzar el render.",
    "   El render necesita solo unos 0,3 GB libres a la vez: codifica cada trozo de 5 s y borra sus fotogramas enseguida.",
  ].join("\n");
}
