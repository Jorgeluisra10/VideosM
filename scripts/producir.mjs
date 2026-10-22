#!/usr/bin/env node
/**
 * VideMed · pipeline completo en un solo comando (fases 2 → 5).
 *   npm run producir                (voz + QA + render + entregables)
 *   npm run producir -- --sin-voz   (reutiliza la voz y los tiempos que ya existen)
 *   npm run producir -- --sin-qa    (salta la autorevisión)
 *
 * Se detiene si el QA encuentra problemas, para no renderizar un video con defectos.
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function paso(titulo, cmd, params, { tolerarCodigos = [] } = {}) {
  console.log(`\n━━━ ${titulo} ━━━`);
  const r = spawnSync(cmd, params, { cwd: RAIZ, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0 && !tolerarCodigos.includes(r.status)) {
    console.error(`\n❌ Se detuvo en: ${titulo} (código ${r.status})`);
    process.exit(r.status ?? 1);
  }
}

if (!args.includes("--sin-voz")) paso("FASE 2 · Voz y timestamps", "node", ["scripts/generar-voz.mjs", ...args.filter((a) => a !== "--sin-qa")]);
if (!args.includes("--sin-qa")) paso("FASE 4 · Autorevisión (QA)", "node", ["scripts/qa.mjs"]);
paso("FASE 5 · Renderizando video", "node", ["scripts/render.mjs"]);
paso("FASE 5 · Portada, texto del post y archivo", "node", ["scripts/entregables.mjs"]);
console.log("\n🎬 Todo listo en trabajo/salida/");
