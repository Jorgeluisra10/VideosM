#!/usr/bin/env node
/**
 * Capturas de la animación activa (src/data/animacion.json) para mirarlas antes de renderizar.
 *   node scripts/anim/previa.mjs                  1 captura por escena (a 2/3 de su duración) en trabajo/tmp/anim-previa/
 *   node scripts/anim/previa.mjs --frames=30,200  fotogramas concretos
 *   node scripts/anim/previa.mjs --qa             además mide márgenes en el DOM y busca fotogramas vacíos / sin movimiento
 * Sale con código 2 si el QA encuentra problemas.
 */
import "../_tmp.mjs";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { renderStill, selectComposition } from "@remotion/renderer";
import { esperarMemoria, obtenerPaquete } from "../_comun.mjs";
import { abrirNavegador } from "../navegador.mjs";
import { RAIZ } from "./nucleo.mjs";

const require = createRequire(import.meta.url);
const { PNG } = require("pngjs");
const args = process.argv.slice(2);
const valor = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
const FPS = 60;
const MARGEN = 80;
const anim = JSON.parse(readFileSync(join(RAIZ, "src", "data", "animacion.json"), "utf8"));
const SALIDA = valor("salida") ?? join(RAIZ, "trabajo", "tmp", "anim-previa");
rmSync(SALIDA, { recursive: true, force: true });
mkdirSync(SALIDA, { recursive: true });

const frames = valor("frames")
  ? valor("frames").split(",").map(Number)
  : anim.escenas.map((e) => Math.round((e.inicio + e.dur * 0.66) * FPS));
const hacerQA = args.includes("--qa");

const serveUrl = await obtenerPaquete({ bundleDado: valor("bundle") });
await esperarMemoria("abrir el navegador", { min: 0.5 });
let navegador = await abrirNavegador();
const logs = [];
const onBrowserLog = (l) => {
  if (typeof l.text === "string" && l.text.startsWith("[QA] ")) logs.push(l.text.slice(5));
};
const inputProps = { animacion: anim, qa: hacerQA };
const comp = await selectComposition({ serveUrl, id: "Animacion", inputProps, puppeteerInstance: navegador });

async function foto(frame, archivo, jpg = false) {
  for (let intento = 1; ; intento++) {
    try {
      await renderStill({ composition: comp, serveUrl, frame, output: archivo, imageFormat: jpg ? "jpeg" : "png", ...(jpg ? { jpegQuality: 80, scale: 0.5 } : {}), inputProps, puppeteerInstance: navegador, onBrowserLog, overwrite: true, timeoutInMilliseconds: 120000 });
      return;
    } catch (e) {
      if (intento >= 3) throw e;
      console.warn(`  ↻ reintentando fotograma ${frame} (${String(e.message ?? e).slice(0, 80)})`);
      try { await navegador.close({ silent: true }); } catch { /* ya cerrado */ }
      navegador = await abrirNavegador();
    }
  }
}

const problemas = [];
const t0 = Date.now();
for (const f of frames) {
  logs.length = 0;
  const archivo = join(SALIDA, `escena-${String(f).padStart(5, "0")}.png`);
  await foto(f, archivo);
  console.log(`  ✔ fotograma ${f} (${(f / FPS).toFixed(1)} s) → ${archivo}`);
  if (hacerQA) {
    const reg = logs.map((l) => JSON.parse(l)).filter((r) => r.frame === f).pop();
    for (const it of reg?.items ?? []) if (it.x0 < MARGEN - 1 || it.x1 > 1080 - MARGEN + 1) problemas.push(`margen · ${(f / FPS).toFixed(1)} s · «${it.txt}» (${it.k}) ocupa x ${it.x0}→${it.x1}; debe estar entre ${MARGEN} y ${1080 - MARGEN}`);
  }
}

if (hacerQA) {
  // Vacío / sin movimiento: compara cada escena consigo misma a 0,5 s de distancia.
  const leer = (ruta) => PNG.sync.read(readFileSync(ruta));
  const tmpA = join(SALIDA, "_a.png"), tmpB = join(SALIDA, "_b.png");
  for (const e of anim.escenas) {
    const a = Math.round((e.inicio + Math.min(e.dur * 0.55, e.dur - 0.7)) * FPS), b = a + 30;
    await foto(a, tmpA);
    await foto(b, tmpB);
    const A = leer(tmpA), B = leer(tmpB);
    let cambios = 0, distintos = 0, total = 0;
    const base = [A.data[0], A.data[1], A.data[2]];
    for (let y = 0; y < 1920; y += 6)
      for (let x = 0; x < 1080; x += 6) {
        const i = (y * 1080 + x) * 4;
        total++;
        if (Math.abs(A.data[i] - B.data[i]) + Math.abs(A.data[i + 1] - B.data[i + 1]) + Math.abs(A.data[i + 2] - B.data[i + 2]) > 20) cambios++;
        if (Math.abs(A.data[i] - base[0]) + Math.abs(A.data[i + 1] - base[1]) + Math.abs(A.data[i + 2] - base[2]) > 40) distintos++;
      }
    if (distintos / total < 0.03) problemas.push(`vacía · escena ${e.n}: casi todo es fondo (${((distintos / total) * 100).toFixed(1)} % con contenido)`);
    if (cambios / total < 0.0008) problemas.push(`sin movimiento · escena ${e.n}: entre ${(a / FPS).toFixed(1)} y ${(b / FPS).toFixed(1)} s no cambia nada`);
  }
  rmSync(tmpA, { force: true });
  rmSync(tmpB, { force: true });
  writeFileSync(join(SALIDA, "qa.json"), JSON.stringify({ problemas }, null, 1));
  console.log(problemas.length ? `\n⚠️  QA: ${problemas.length} problema(s)\n${problemas.map((p) => "   · " + p).join("\n")}` : "\n✅ QA: márgenes ≥ 80 px, sin escenas vacías ni congeladas");
}
await navegador.close({ silent: true });
console.log(`   ${((Date.now() - t0) / 1000).toFixed(0)} s`);
process.exit(problemas.length ? 2 : 0);
