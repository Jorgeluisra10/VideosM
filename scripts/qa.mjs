#!/usr/bin/env node
/**
 * VideMed · Fase 4 — Autorevisión visual (QA).
 *
 *   node scripts/qa.mjs                  QA completo (4 capturas clave + barrido cada 0,5 s)
 *   node scripts/qa.mjs --imagenes 60,300,900   solo renderiza esos fotogramas a trabajo/tmp/qa-rapido/
 *                                        (opcional: --formato jpeg --escala 0.75 para imágenes ligeras)
 *   node scripts/qa.mjs --paso 0.25      barrido más fino
 *   node scripts/qa.mjs --bundle=<carpeta>   reutiliza un paquete ya empaquetado
 *
 * Comprueba, con mediciones reales y no a ojo:
 *   1. Márgenes: ningún texto (etiquetas, títulos, subtítulos) a menos de 80 px de los lados
 *      (mide el DOM renderizado con una sonda).
 *   2. Solapes: la ilustración no invade la zona de subtítulos (y 1450-1650) ni el encabezado.
 *   3. Movimiento: ninguna ventana de más de 2 s sin cambios visibles en la ilustración.
 *   4. Escenas vacías: ningún instante con el escenario prácticamente en blanco.
 * Deja las 4 capturas pedidas (frames 60, 300, 600, 900) y un informe en trabajo/salida/qa/.
 */
import "./_tmp.mjs"; // temporales dentro del proyecto (evita discos del sistema llenos)
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { esperarMemoria, obtenerPaquete } from "./_comun.mjs";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";

const require = createRequire(import.meta.url);
const { PNG } = require("pngjs");

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FPS = 60;
const W = 1080;
const H = 1920;
const MARGEN = 80;
const ESC = { y0: 350, y1: 1350 };
const SUBS = { y0: 1450, y1: 1650 };
const FONDO = [0x0b, 0x0f, 0x19];

// ---------- args ----------
const argv = process.argv.slice(2);
const arg = (n) => {
  const i = argv.indexOf(`--${n}`);
  return i > -1 ? argv[i + 1] : undefined;
};
const paso = Number(arg("paso") ?? 0.5);
const soloImagenes = arg("imagenes");
const jpeg = arg("formato") === "jpeg"; // modo rápido: JPEG (más ligero para enviarlo a un modelo con visión)
const escala = Math.min(1, Math.max(0.25, Number(arg("escala") ?? 1)));

const salida = soloImagenes ? join(RAIZ, "trabajo", "tmp", "qa-rapido") : join(RAIZ, "trabajo", "salida", "qa");
const tmp = join(RAIZ, "trabajo", "tmp", "qa-analisis");
mkdirSync(salida, { recursive: true });
mkdirSync(tmp, { recursive: true });

const serveUrl = await obtenerPaquete({ bundleDado: argv.find((a) => a.startsWith("--bundle="))?.split("=")[1] ?? arg("bundle") });
await esperarMemoria("abrir el navegador", { min: 0.5 });
let navegador = await openBrowser("chrome", { chromiumOptions: {}, logLevel: "error" });

const logs = [];
const onBrowserLog = (l) => {
  if (typeof l.text === "string" && l.text.startsWith("[QA] ")) logs.push(l.text.slice(5));
};

async function reabrir() {
  try { await navegador.close({ silent: true }); } catch { /* ya estaba cerrado */ }
  navegador = await openBrowser("chrome", { chromiumOptions: {}, logLevel: "error" });
}

async function compo(props) {
  return selectComposition({ serveUrl, id: "VideoMedico", inputProps: props, puppeteerInstance: navegador });
}

/** Renderiza un fotograma; si el navegador se cae ("Target closed") lo reabre y reintenta. */
async function foto(composition, props, frame, archivo) {
  for (let intento = 1; ; intento++) {
    try {
      await renderStill({
        composition,
        serveUrl,
        frame,
        output: archivo,
        imageFormat: soloImagenes && jpeg ? "jpeg" : "png",
        ...(soloImagenes && jpeg ? { jpegQuality: 82 } : {}),
        ...(soloImagenes && escala < 1 ? { scale: escala } : {}),
        inputProps: props,
        puppeteerInstance: navegador,
        onBrowserLog,
        overwrite: true,
      });
      return;
    } catch (e) {
      if (intento >= 3) throw e;
      console.warn(`  ↻ reintentando fotograma ${frame} (${String(e.message ?? e).slice(0, 60)})`);
      await reabrir();
    }
  }
}

// ---------- modo rápido ----------
if (soloImagenes) {
  const props = { modo: "normal", qa: false };
  const c = await compo(props);
  for (const f of soloImagenes.split(",").map(Number)) {
    const a = join(salida, `frame-${String(f).padStart(5, "0")}.${jpeg ? "jpg" : "png"}`);
    await foto(c, props, f, a);
    console.log("  ✔", a);
  }
  await navegador.close({ silent: true });
  process.exit(0);
}

// ---------- QA completo ----------
const propsNormal = { modo: "normal", qa: true };
const propsEscena = { modo: "soloEscena", qa: false };
const cNormal = await compo(propsNormal);
const cEscena = await compo(propsEscena);
const total = cNormal.durationInFrames;
const duracion = total / FPS;

const clave = [60, 300, 600, 900].filter((f) => f < total);
const muestras = [];
for (let s = 0; s * paso * FPS < total; s++) muestras.push(Math.min(total - 1, Math.round(s * paso * FPS)));
muestras.push(total - 1);
const unicas = [...new Set(muestras)];

const problemas = [];
const avisar = (tipo, frame, detalle) => problemas.push({ tipo, segundo: +(frame / FPS).toFixed(2), frame, detalle });

console.log(`🔎 ${duracion.toFixed(1)} s · ${unicas.length} muestras · 4 capturas clave`);

// Pasada 1 — capturas clave del video final + márgenes con sonda
for (const f of clave) {
  logs.length = 0;
  const a = join(salida, `captura-frame-${f}.png`);
  await foto(cNormal, propsNormal, f, a);
}
console.log("  ✔ 4 capturas clave guardadas en trabajo/salida/qa/");

// Pasada 2 — márgenes (sonda) en todas las muestras
let textosMedidos = 0;
let minX = Infinity;
let maxX = -Infinity;
let textoMin = "";
let textoMax = "";
for (const f of unicas) {
  logs.length = 0;
  await foto(cNormal, propsNormal, f, join(tmp, "m.png"));
  const reg = logs.map((l) => JSON.parse(l)).filter((r) => r.frame === f).pop();
  if (!reg) continue;
  for (const it of reg.items) {
    textosMedidos++;
    if (it.x0 < minX) { minX = it.x0; textoMin = `"${it.txt}" (${it.k}) a ${(f / FPS).toFixed(1)} s`; }
    if (it.x1 > maxX) { maxX = it.x1; textoMax = `"${it.txt}" (${it.k}) a ${(f / FPS).toFixed(1)} s`; }
    if (it.x0 < MARGEN - 1 || it.x1 > W - MARGEN + 1) {
      avisar("margen", f, `"${it.txt}" (${it.k}) ocupa x ${it.x0}→${it.x1}; debe estar entre ${MARGEN} y ${W - MARGEN}`);
    }
  }
}
console.log(`  ✔ márgenes: ${textosMedidos} textos medidos · borde izquierdo más cercano x=${minX} ${textoMin} · borde derecho más cercano x=${maxX} (margen ${W - maxX}) ${textoMax}`);

// Pasada 3 — solo ilustración: solapes, movimiento y escenas vacías
const leer = (ruta) => PNG.sync.read(readFileSync(ruta));
function region(png, y0, y1, paso = 3) {
  // muestrea 1 de cada `paso` px; devuelve array de [r,g,b] por celda
  const out = [];
  for (let y = y0; y < y1; y += paso) {
    for (let x = 0; x < W; x += paso) {
      const i = (y * W + x) * 4;
      out.push(png.data[i], png.data[i + 1], png.data[i + 2]);
    }
  }
  return out;
}
const dif = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]);
function actividad(png, y0, y1) {
  // fracción de píxeles distintos del fondo
  let n = 0;
  let tot = 0;
  for (let y = y0; y < y1; y += 3) {
    for (let x = 0; x < W; x += 3) {
      const i = (y * W + x) * 4;
      tot++;
      if (dif([png.data[i], png.data[i + 1], png.data[i + 2]], FONDO) > 24) n++;
    }
  }
  return n / tot;
}
function cambio(a, b) {
  const ra = region(a, ESC.y0 + 40, ESC.y1 - 40, 4);
  const rb = region(b, ESC.y0 + 40, ESC.y1 - 40, 4);
  let c = 0;
  const n = ra.length / 3;
  for (let i = 0; i < ra.length; i += 3) {
    if (Math.abs(ra[i] - rb[i]) + Math.abs(ra[i + 1] - rb[i + 1]) + Math.abs(ra[i + 2] - rb[i + 2]) > 40) c++;
  }
  return c / n;
}

let anterior = null;
let ultimoMovimiento = 0;
const tablaMov = [];
for (const f of unicas) {
  const a = join(tmp, "e.png");
  await foto(cEscena, propsEscena, f, a);
  const png = leer(a);

  // solapes: la ilustración no debe pintar fuera del escenario (zona libre hasta los subtítulos y encabezado)
  const fugaAbajo = actividad(png, ESC.y1 + 45, SUBS.y1 + 60);
  const fugaArriba = actividad(png, 0, ESC.y0 - 45);
  if (fugaAbajo > 0.0005) avisar("solape-subtitulos", f, `la ilustración invade la zona de subtítulos (${(fugaAbajo * 100).toFixed(2)} % de píxeles)`);
  if (fugaArriba > 0.0005) avisar("solape-encabezado", f, `la ilustración invade el encabezado (${(fugaArriba * 100).toFixed(2)} % de píxeles)`);

  // escena vacía
  const llena = actividad(png, ESC.y0 + 40, ESC.y1 - 40);
  if (llena < 0.012 && f / FPS > 0.15 && f < total - 1.2 * FPS) avisar("escenario-vacio", f, `solo ${(llena * 100).toFixed(2)} % del escenario tiene dibujo`);

  // movimiento
  if (anterior) {
    const c = cambio(anterior.png, png);
    tablaMov.push({ s: +(f / FPS).toFixed(2), cambio: +c.toFixed(4) });
    if (c > 0.0025) ultimoMovimiento = f;
    else if ((f - ultimoMovimiento) / FPS > 2.0 && f < total - 1.2 * FPS) {
      avisar("sin-movimiento", f, `más de 2 s sin cambios visibles (desde ${(ultimoMovimiento / FPS).toFixed(1)} s)`);
      ultimoMovimiento = f; // un aviso por tramo
    }
  }
  anterior = { png, f };
}
console.log("  ✔ solapes, movimiento y escenas vacías analizados");

await navegador.close({ silent: true });
rmSync(tmp, { recursive: true, force: true });

// ---------- informe ----------
const resumen = problemas.reduce((acc, p) => ((acc[p.tipo] = (acc[p.tipo] ?? 0) + 1), acc), {});
writeFileSync(join(salida, "informe.json"), JSON.stringify({ duracion, muestras: unicas.length, textosMedidos, bordeIzquierdoMin: minX, bordeDerechoMax: maxX, resumen, problemas, movimiento: tablaMov }, null, 2));

console.log("\n══════ INFORME QA ══════");
if (!problemas.length) {
  console.log("✅ Sin problemas: márgenes ≥ 80 px, sin solapes, sin pantallas vacías ni tramos estáticos > 2 s.");
} else {
  console.log(`⚠️  ${problemas.length} problema(s):`, resumen);
  for (const p of problemas.slice(0, 40)) console.log(`  • [${p.tipo}] ${p.segundo}s (frame ${p.frame}) — ${p.detalle}`);
  if (problemas.length > 40) console.log(`  ... y ${problemas.length - 40} más (ver informe.json)`);
}
process.exit(problemas.length ? 2 : 0);
