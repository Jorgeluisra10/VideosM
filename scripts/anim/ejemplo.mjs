#!/usr/bin/env node
/**
 * Carga el ejemplo incluido (ejemplos/animacion-imnoba) como animación activa, SIN IA y SIN coste:
 * parsea el guion con el mismo parser, ensambla la respuesta de ejemplo y escribe src/data/animacion.json.
 *   node scripts/anim/ejemplo.mjs [--sin-sfx] [--paleta=imnoba|medicina]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cargarNucleoAnim, RAIZ } from "./nucleo.mjs";

const args = process.argv.slice(2);
const N = await cargarNucleoAnim();
const paleta = args.find((a) => a.startsWith("--paleta="))?.split("=")[1] ?? "imnoba";
const sfx = !args.includes("--sin-sfx");
const formato = args.find((a) => a.startsWith("--formato="))?.split("=")[1] ?? "libre";
const libre = formato === "libre";
const estructurado = formato === "hud";
let anim, correcciones;

if (libre) {
  // LIENZO LIBRE (por defecto): el código de cada escena está escrito a mano en ejemplos/animacion-libre y pasa por la misma política y compilación que el de la IA
  const dir = join(RAIZ, "ejemplos", "animacion-libre");
  const parsed = N.parsearLibre(readFileSync(join(dir, "guion-libre.txt"), "utf8"));
  if (parsed.errores.length) throw new Error(parsed.errores.join("\n"));
  const { ensamblarLibre } = await import("./libre.mjs");
  const r = await ensamblarLibre(JSON.parse(readFileSync(join(dir, "codigo-ia.json"), "utf8")), parsed.escenas, { paleta, sfx });
  if (!r.anim) throw new Error(r.errores.join("\n"));
  anim = r.anim;
  correcciones = r.correcciones;
  mkdirSync(join(RAIZ, "trabajo", "salida"), { recursive: true });
  writeFileSync(join(RAIZ, "trabajo", "salida", "guion-locucion.txt"), N.textoLocucion(parsed.escenas.map((e) => ({ ...e, vozOff: e.voz })), anim.titulo));
} else if (estructurado) {
  // formato estructurado ([CONFIG], FONDO, GEO, HUD…): título, HUD y sonido salen del guion; la geometría, del archivo de ejemplo
  const dir = join(RAIZ, "ejemplos", "animacion-retro");
  const parsed = N.parsearEstructurado(readFileSync(join(dir, "guion-estructurado.txt"), "utf8"));
  if (parsed.errores.length) throw new Error(parsed.errores.join("\n"));
  const r = N.ensamblarGeo(JSON.parse(readFileSync(join(dir, "geometria-ia.json"), "utf8")), parsed.escenas, parsed.config, { paleta, sfx });
  if (!r.anim) throw new Error(r.errores.join("\n"));
  anim = r.anim;
  correcciones = r.correcciones;
  mkdirSync(join(RAIZ, "trabajo", "salida"), { recursive: true });
  writeFileSync(join(RAIZ, "trabajo", "salida", "guion-locucion.txt"), N.textoLocucion(parsed.escenas, anim.titulo));
} else {
  // formato simple: el estilo retro tiene su propio ejemplo (título, terminal, medidores y modelo paramétrico)
  const dir = join(RAIZ, "ejemplos", N.esRetro(paleta) ? "animacion-retro" : "animacion-imnoba");
  const parsed = N.parsearGuion(readFileSync(join(dir, "guion.txt"), "utf8"));
  if (parsed.errores.length) throw new Error(parsed.errores.join("\n"));
  const r = N.ensamblar(JSON.parse(readFileSync(join(dir, "respuesta-ia.json"), "utf8")), parsed.escenas, { paleta, sfx });
  if (!r.anim) throw new Error(r.errores.join("\n"));
  anim = r.anim;
  correcciones = r.correcciones;
}
for (const c of correcciones) console.log("  ~", c);
writeFileSync(join(RAIZ, "src", "data", "animacion.json"), JSON.stringify(anim, null, 1));
console.log(`✔ src/data/animacion.json · ${anim.escenas.length} escenas · ${anim.duracion} s · SFX ${sfx ? "sí" : "no"}${libre ? " · lienzo libre" : estructurado ? " · formato estructurado" : ""}`);
