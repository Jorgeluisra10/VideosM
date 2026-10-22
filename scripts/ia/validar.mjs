#!/usr/bin/env node
/**
 * Valida un plan de escenas contra su guion (sin gastar nada de IA ni de render).
 *   node scripts/ia/validar.mjs                       valida src/data/plan.json (perfil y fotos del proyecto activo)
 *   node scripts/ia/validar.mjs ejemplos/x/plan.json  (usa timestamps.json, tema.json/brief.json y media.json de esa carpeta)
 *   node scripts/ia/validar.mjs plan.json tiempos.json
 *   --perfil inmobiliaria                             fuerza el perfil
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { cargarPerfil } from "./perfil.mjs";
import { RAIZ } from "./puente.mjs";
import { resumirProblemas, validarPlan } from "./validar-plan.mjs";

const args = process.argv.slice(2);
const iPerfil = args.indexOf("--perfil");
const perfilForzado = iPerfil > -1 ? args.splice(iPerfil, 2)[1] : null;
const [a, b] = args;
const rutaPlan = resolve(a ?? join(RAIZ, "src", "data", "plan.json"));
const dir = a ? dirname(rutaPlan) : join(RAIZ, "src", "data");
const rutaTs = resolve(b ?? join(dir, "timestamps.json"));
if (!existsSync(rutaPlan) || !existsSync(rutaTs)) {
  console.error("❌ No encuentro el plan o los timestamps:", rutaPlan, rutaTs);
  process.exit(2);
}
const leer = (r) => (existsSync(r) ? JSON.parse(readFileSync(r, "utf8")) : null);
const idPerfil = perfilForzado ?? leer(join(dir, "tema.json"))?.perfil ?? leer(join(dir, "brief.json"))?.perfil ?? "medicina-ar";
const perfil = cargarPerfil(idPerfil);
const media = leer(join(dir, "media.json"));
const r = await validarPlan(JSON.parse(readFileSync(rutaPlan, "utf8")), JSON.parse(readFileSync(rutaTs, "utf8")), { perfil, media });
console.log(`Plan: ${rutaPlan} · perfil ${perfil.id}${media ? ` · ${media.length} medios` : ""}\n${r.metricas.escenas ?? "?"} escenas · ${r.metricas.elementos ?? "?"} elementos · ${r.metricas.duracion ?? "?"} s`);
const txt = resumirProblemas(r, 80);
console.log(txt || "✅ Sin errores ni avisos.");
console.log(`\n${r.errores.length} error(es), ${r.avisos.length} aviso(s)`);
process.exit(r.ok ? 0 : 1);
