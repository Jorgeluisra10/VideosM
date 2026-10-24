#!/usr/bin/env node
/**
 * Libera espacio en disco: borra los temporales del proyecto (renders cortados, capturas, empaquetados viejos).
 *   npm run limpiar            borra todo lo de trabajo/tmp
 *   npm run limpiar -- --ver   solo muestra cuánto ocupa, sin borrar
 * No toca tus videos terminados (trabajo/salida), tus guiones ni tus proyectos.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { TMP, espacioLibreGB, limpiarTemporales, tamanoCarpeta } from "./_disco.mjs";

const soloVer = process.argv.includes("--ver");
const libreAntes = espacioLibreGB();
console.log(`💾 Espacio libre ahora: ${libreAntes == null ? "(no se pudo medir)" : libreAntes.toFixed(2) + " GB"}`);
if (!existsSync(TMP)) {
  console.log("✔ No hay temporales que borrar.");
  process.exit(0);
}
if (soloVer) {
  for (const e of readdirSync(TMP, { withFileTypes: true })) {
    const bytes = e.isDirectory() ? tamanoCarpeta(join(TMP, e.name)) : statSync(join(TMP, e.name)).size;
    console.log(`   ${(bytes / 2 ** 30).toFixed(2).padStart(7)} GB  ${e.name}`);
  }
  process.exit(0);
}
const r = limpiarTemporales();
for (const b of r.borradas) console.log(`   🗑️  ${b.nombre}  (${b.gb.toFixed(2)} GB)`);
const libreDespues = espacioLibreGB();
console.log(`\n✅ Liberados ${r.liberadoGB.toFixed(2)} GB. Espacio libre ahora: ${libreDespues == null ? "(no se pudo medir)" : libreDespues.toFixed(2) + " GB"}`);
if (libreDespues != null && libreDespues < 1.5) console.log("⚠️  Sigue habiendo poco espacio en este disco: libera más (Papelera, archivos temporales de Windows) o mueve el proyecto a otro disco.");
