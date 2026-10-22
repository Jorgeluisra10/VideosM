/**
 * Redirige la carpeta temporal (TEMP/TMP/TMPDIR) a trabajo/tmp/sistema dentro del proyecto.
 * Remotion y Chrome vuelcan miles de fotogramas ahí; si el disco del sistema (C:) está casi lleno,
 * el render falla con "Chrome ran out of memory or disk space". Importar ANTES que Remotion.
 */
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ_PROYECTO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const TMP_PROYECTO = join(RAIZ_PROYECTO, "trabajo", "tmp", "sistema");

mkdirSync(TMP_PROYECTO, { recursive: true });
process.env.TEMP = TMP_PROYECTO;
process.env.TMP = TMP_PROYECTO;
process.env.TMPDIR = TMP_PROYECTO;
