#!/usr/bin/env node
/**
 * Carga el ejemplo incluido (ejemplos/animacion-imnoba) como animación activa, SIN IA y SIN coste:
 * parsea el guion con el mismo parser, ensambla la respuesta de ejemplo y escribe src/data/animacion.json.
 *   node scripts/anim/ejemplo.mjs [--sin-sfx] [--paleta=imnoba|medicina]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cargarNucleoAnim, RAIZ } from "./nucleo.mjs";

const args = process.argv.slice(2);
const N = await cargarNucleoAnim();
const dir = join(RAIZ, "ejemplos", "animacion-imnoba");
const parsed = N.parsearGuion(readFileSync(join(dir, "guion.txt"), "utf8"));
if (parsed.errores.length) throw new Error(parsed.errores.join("\n"));
const raw = JSON.parse(readFileSync(join(dir, "respuesta-ia.json"), "utf8"));
const sfx = !args.includes("--sin-sfx");
const paleta = args.find((a) => a.startsWith("--paleta="))?.split("=")[1] ?? "imnoba";
const r = N.ensamblar(raw, parsed.escenas, { paleta, sfx });
if (!r.anim) throw new Error(r.errores.join("\n"));
for (const c of r.correcciones) console.log("  ~", c);
writeFileSync(join(RAIZ, "src", "data", "animacion.json"), JSON.stringify(r.anim, null, 1));
console.log(`✔ src/data/animacion.json · ${r.anim.escenas.length} escenas · ${r.anim.duracion} s · SFX ${sfx ? "sí" : "no"}`);
