#!/usr/bin/env node
/**
 * Importa un plan de escenas escrito por una IA (o por ti): lo limpia, lo valida y, si es correcto,
 * lo activa (src/data/plan.json + tema dinámico). Acepta el JSON suelto o dentro de un bloque ```json.
 *
 *   npm run ia:importar -- plan-chatgpt.json
 *   npm run ia:importar -- plan.json --forzar     (lo activa aunque tenga errores; no recomendado)
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Cliente } from "./cliente.mjs";
import { normalizarPlan, sanear } from "./plan-util.mjs";
import { RAIZ } from "./puente.mjs";
import { resumirProblemas, validarPlan } from "./validar-plan.mjs";

const [archivo, ...resto] = process.argv.slice(2);
if (!archivo || !existsSync(resolve(archivo))) {
  console.error("Uso: npm run ia:importar -- <archivo.json> [--forzar]");
  process.exit(2);
}
const d = (n) => join(RAIZ, "src", "data", n);
let plan;
try {
  plan = Cliente.parsearJson(readFileSync(resolve(archivo), "utf8"));
} catch (e) {
  console.error("❌ El archivo no contiene un JSON válido:", e.message);
  process.exit(1);
}
const tema = existsSync(d("tema.json")) ? JSON.parse(readFileSync(d("tema.json"), "utf8")) : plan.proyecto;
plan = normalizarPlan(plan, { id: plan.proyecto?.id ?? tema.id, etiqueta: plan.proyecto?.etiqueta ?? tema.etiqueta, titulo: plan.proyecto?.titulo ?? tema.titulo });
const palabras = JSON.parse(readFileSync(d("timestamps.json"), "utf8"));

let r = await validarPlan(plan, palabras);
console.log(`${r.metricas.escenas ?? "?"} escenas · ${r.metricas.elementos ?? "?"} elementos · ${r.errores.length} error(es), ${r.avisos.length} aviso(s)`);
if (!r.ok) {
  const s = sanear(plan, r);
  if (s.quitados) {
    const r2 = await validarPlan(s.plan, palabras);
    console.log(`✂ Quitando ${s.quitados} elemento(s) defectuoso(s) quedaría: ${r2.errores.length} error(es)`);
    if (r2.ok) { plan = s.plan; r = r2; }
  }
}
const txt = resumirProblemas(r, 40);
if (txt) console.log(txt);
if (!r.ok && !resto.includes("--forzar")) {
  console.error("\n❌ El plan tiene errores. Pega esta lista de problemas a la IA para que lo corrija y vuelve a importar (o usa --forzar).");
  process.exit(1);
}
writeFileSync(d("plan.json"), JSON.stringify(plan, null, 2) + "\n");
writeFileSync(d("tema.json"), JSON.stringify({ id: plan.proyecto.id, etiqueta: plan.proyecto.etiqueta, titulo: plan.proyecto.titulo }, null, 2) + "\n");
spawnSync(process.execPath, [join(RAIZ, "scripts", "activar-tema.mjs"), "dinamico"], { cwd: RAIZ, stdio: "inherit" });
console.log("✅ Plan activado. Mira las escenas con  npm run ia:capturas  o  npm start, y produce con  npm run producir -- --sin-voz");
