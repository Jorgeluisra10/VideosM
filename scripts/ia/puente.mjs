/**
 * Puente Node ↔ motor TypeScript: empaqueta src/dsl/nucleo.ts con esbuild (en memoria) y lo importa.
 * Garantiza que el validador mide EXACTAMENTE como renderiza el video.
 */
import { build } from "esbuild";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
let cache = null;

export async function cargarNucleo() {
  if (cache) return cache;
  const r = await build({
    entryPoints: [join(RAIZ, "src", "dsl", "nucleo.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
    logLevel: "silent",
    loader: { ".json": "json" },
  });
  cache = await import("data:text/javascript;base64," + Buffer.from(r.outputFiles[0].text).toString("base64"));
  return cache;
}

export const cargarCatalogo = () => JSON.parse(readFileSync(join(RAIZ, "src", "dsl", "catalogo.json"), "utf8"));
