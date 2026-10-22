#!/usr/bin/env node
/**
 * Modo MANUAL (sin API): prepara los textos para pegarlos en ChatGPT (o cualquier chat) y luego
 * importa su respuesta con `npm run ia:importar`.
 *
 *   npm run ia:prompt -- "tema del video"     → trabajo/ia/prompts/1-guion.md   (pídele el guion)
 *   npm run ia:prompt                          → trabajo/ia/prompts/2-plan.md    (con el guion y la voz ya generados)
 *
 * Flujo: 1) pega 1-guion.md en el chat → guarda la respuesta; copia el campo "guion" a src/data/guion.txt
 *        y ajusta src/data/tema.json (id, etiqueta, titulo) → `npm run voz`
 *        2) `npm run ia:prompt` → pega 2-plan.md → guarda el JSON como plan-chatgpt.json
 *        3) `npm run ia:importar -- plan-chatgpt.json` → valida, corrige lo evidente y activa el plan
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { esquemaGuion } from "./esquemas.mjs";
import { entradaGuion, entradaPlan, sistemaGuion, sistemaPlan } from "./prompts.mjs";
import { RAIZ } from "./puente.mjs";

const dir = join(RAIZ, "trabajo", "ia", "prompts");
mkdirSync(dir, { recursive: true });
const tema = process.argv.slice(2).join(" ").trim();

if (tema) {
  const ejemploForma = JSON.stringify(Object.fromEntries(Object.keys(esquemaGuion.properties).map((k) => [k, "…"])), null, 2);
  const txt = `# PASO 1 · Guion\n\nPega TODO lo que sigue en ChatGPT.\n\n---\n\n${sistemaGuion()}\n\nFormato de tu respuesta: SOLO un objeto JSON válido con estas claves (verificacion y simplificaciones son listas):\n${ejemploForma}\n\n---\n\n${entradaGuion({ tema })}\n`;
  writeFileSync(join(dir, "1-guion.md"), txt);
  console.log("✅ trabajo/ia/prompts/1-guion.md  (pégalo en ChatGPT; después copia su campo \"guion\" a src/data/guion.txt y ejecuta npm run voz)");
} else {
  const f = (n) => join(RAIZ, "src", "data", n);
  if (!existsSync(f("guion.txt")) || !existsSync(f("timestamps.json"))) {
    console.error("❌ Falta src/data/guion.txt o timestamps.json. Escribe el guion y ejecuta  npm run voz  primero.");
    process.exit(1);
  }
  const guion = readFileSync(f("guion.txt"), "utf8").trim();
  const palabras = JSON.parse(readFileSync(f("timestamps.json"), "utf8"));
  const proyecto = existsSync(f("tema.json")) ? JSON.parse(readFileSync(f("tema.json"), "utf8")) : { id: "video", etiqueta: "MEDICINA", titulo: guion.split(/(?<=[?.!])\s/)[0] };
  const txt = `# PASO 2 · Plan de escenas\n\nPega TODO lo que sigue en ChatGPT (usa el modelo más capaz que tengas). Guarda su respuesta (solo el JSON) como plan-chatgpt.json y ejecuta: npm run ia:importar -- plan-chatgpt.json\n\n---\n\n${sistemaPlan({ manual: true })}\n\n---\n\n${entradaPlan({ guion, palabras, proyecto })}\n`;
  writeFileSync(join(dir, "2-plan.md"), txt);
  console.log(`✅ trabajo/ia/prompts/2-plan.md  (${(txt.length / 1024).toFixed(0)} KB). Pégalo en ChatGPT y guarda el JSON que devuelva como plan-chatgpt.json`);
}
