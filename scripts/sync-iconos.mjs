#!/usr/bin/env node
/**
 * VideMed · sincroniza los iconos profesionales (healthicons-react + lucide-react).
 *
 *   src/dsl/iconos-pro.json   ← única fuente: clave del plan → componente de la librería
 *   ↓ node scripts/sync-iconos.mjs
 *   src/dsl/elementos/iconosPro.generated.tsx   importaciones explícitas (el paquete solo incluye estos iconos)
 *   src/dsl/catalogo.json                       enum de `icono` (la IA solo puede elegir iconos que existen)
 *
 * Para añadir un icono: ponlo en iconos-pro.json y ejecuta este script (npm run iconos).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fuente = JSON.parse(readFileSync(join(RAIZ, "src", "dsl", "iconos-pro.json"), "utf8"));

const hi = await import(join(RAIZ, "node_modules", "healthicons-react", "dist", "esm", "outline", "index.mjs"));
const lu = await import(join(RAIZ, "node_modules", "lucide-react", "dist", "esm", "lucide-react.mjs"));
const faltan = [
  ...Object.entries(fuente.hi).filter(([, n]) => !hi[n]).map(([k, n]) => `hi-${k} → ${n}`),
  ...Object.entries(fuente.lu).filter(([, n]) => !lu[n]).map(([k, n]) => `lu-${k} → ${n}`),
];
if (faltan.length) {
  console.error(`❌ Estos iconos no existen en la librería instalada:\n  ${faltan.join("\n  ")}`);
  process.exit(1);
}

const comillas = (k) => JSON.stringify(k);
const mapa = (o) => Object.entries(o).map(([k, n]) => `  ${comillas(k)}: ${n},`).join("\n");
const unicos = (o) => [...new Set(Object.values(o))].sort();
writeFileSync(
  join(RAIZ, "src", "dsl", "elementos", "iconosPro.generated.tsx"),
  `/* GENERADO por scripts/sync-iconos.mjs desde src/dsl/iconos-pro.json — no editar a mano. */
import type React from "react";
import { ${unicos(fuente.hi).join(", ")} } from "healthicons-react/outline";
import { ${unicos(fuente.lu).join(", ")} } from "lucide-react";

export type IconoLib = React.ComponentType<Record<string, unknown>>;

/** healthicons-react (relleno, viewBox 48): clave del plan sin el prefijo «hi-» */
export const ICONOS_HI: Record<string, IconoLib> = {
${mapa(fuente.hi)}
};

/** lucide-react (trazo, viewBox 24): clave del plan sin el prefijo «lu-» */
export const ICONOS_LU: Record<string, IconoLib> = {
${mapa(fuente.lu)}
};
`,
);

const ruta = join(RAIZ, "src", "dsl", "catalogo.json");
const cat = JSON.parse(readFileSync(ruta, "utf8"));
const def = cat.elementos.icono;
const BASE = def.props.icono.valores.filter((v) => !v.startsWith("hi-") && !v.startsWith("lu-"));
def.props.icono.valores = [...BASE, ...Object.keys(fuente.hi).map((k) => `hi-${k}`), ...Object.keys(fuente.lu).map((k) => `lu-${k}`)];
def.descripcion = `${def.descripcion.split(" ICONOS PRO:")[0]} ICONOS PRO (más pulidos; úsalos para destacar): hi-* de salud (${Object.keys(fuente.hi).map((k) => `hi-${k}`).join(", ")}) y lu-* de inmobiliaria, autos, ubicación y finanzas (${Object.keys(fuente.lu).map((k) => `lu-${k}`).join(", ")}). Las fichas y las llamadas a la acción también aceptan los lu-*.`;
writeFileSync(ruta, JSON.stringify(cat, null, 2));
console.log(`✅ ${Object.keys(fuente.hi).length} iconos de salud (hi-) + ${Object.keys(fuente.lu).length} de inmobiliaria/finanzas (lu-) sincronizados.`);
