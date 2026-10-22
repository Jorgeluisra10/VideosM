/**
 * Puente Node ↔ motor de animación: empaqueta src/anim/nucleo.ts con esbuild (en memoria).
 * El panel (navegador) usa el MISMO código vía /modulos/anim-nucleo.js, así que el costo en vivo, el parser y el validador
 * son idénticos en el navegador, en Node y en el render.
 */
import { build } from "esbuild";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Código ESM del núcleo para un destino: "node" (scripts) o "browser" (panel). */
export async function compilarNucleo(plataforma = "node") {
  const r = await build({
    entryPoints: [join(RAIZ, "src", "anim", "nucleo.ts")],
    bundle: true,
    format: "esm",
    platform: plataforma === "browser" ? "browser" : "node",
    write: false,
    logLevel: "silent",
    minify: plataforma === "browser",
    loader: { ".json": "json" },
  });
  return r.outputFiles[0].text;
}

let cache = null;
export async function cargarNucleoAnim() {
  if (cache) return cache;
  cache = await import("data:text/javascript;base64," + Buffer.from(await compilarNucleo("node")).toString("base64"));
  return cache;
}
