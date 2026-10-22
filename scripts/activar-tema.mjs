#!/usr/bin/env node
/**
 * Cambia el tema ACTIVO del video (qué escenas se renderizan).
 *   node scripts/activar-tema.mjs dinamico         escenas generadas desde src/data/plan.json (las que escribe la IA)
 *   node scripts/activar-tema.mjs dolor-referido   el tema hecho a mano del infarto
 *   node scripts/activar-tema.mjs --listar
 *
 * Reescribe src/tema.ts y src/sonido.ts a la vez (siempre deben apuntar a la misma carpeta).
 */
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ESCENAS = join(RAIZ, "src", "scenes");

const disponibles = readdirSync(ESCENAS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(ESCENAS, d.name, "sonido.ts")) && (existsSync(join(ESCENAS, d.name, "index.ts")) || existsSync(join(ESCENAS, d.name, "index.tsx"))))
  .map((d) => d.name);

const nombre = process.argv[2];
if (!nombre || nombre === "--listar") {
  console.log("Temas disponibles:", disponibles.join(", "));
  process.exit(nombre ? 0 : 1);
}
if (!disponibles.includes(nombre)) {
  console.error(`❌ No existe el tema "${nombre}". Disponibles: ${disponibles.join(", ")}`);
  process.exit(1);
}

writeFileSync(
  join(RAIZ, "src", "tema.ts"),
  `/**
 * Tema ACTIVO (lo cambia scripts/activar-tema.mjs; no hace falta editarlo a mano).
 * Cada tema define sus escenas ancladas a PALABRAS del guion, no a segundos fijos.
 */
export { tema } from "./scenes/${nombre}";
`,
);
writeFileSync(
  join(RAIZ, "src", "sonido.ts"),
  `/**
 * Sonido del tema ACTIVO, sin dependencias de React: lo lee scripts/audio.mjs (vía esbuild)
 * para mezclar el audio sin abrir Chrome. Apunta a la misma carpeta que src/tema.ts.
 */
export { sfx } from "./scenes/${nombre}/sonido";
export { DUR_SFX } from "./scenes/tipos";
`,
);
console.log(`✅ Tema activo: ${nombre}`);
