/**
 * Verificación en NAVEGADOR REAL de las escenas del lienzo libre (Chrome + WebGL, el mismo motor del render final).
 * Para cada escena renderiza 3 fotogramas y comprueba:
 *   · que el código no falle al ejecutarse ([ESCENA-ERROR] de EscenaLibre) ni deje errores de consola;
 *   · que ningún texto se salga del lienzo (el DOM real, no una estimación);
 *   · que la escena no esté vacía ni congelada (compara los tres fotogramas).
 * Devuelve `errores` («Escena N: …») listos para pedirle a la IA que los repare.
 */
import "../_tmp.mjs";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { renderStill, selectComposition } from "@remotion/renderer";
import { esperarMemoria, obtenerPaquete } from "../_comun.mjs";
import { abrirNavegador } from "../navegador.mjs";
import { RAIZ } from "./nucleo.mjs";

const require = createRequire(import.meta.url);
const { PNG } = require("pngjs");
const FPS = 60;

/** Muestra de luminancia (rejilla 48×86) de un PNG. */
function huella(ruta) {
  const png = PNG.sync.read(readFileSync(ruta));
  const out = [];
  for (let gy = 0; gy < 86; gy++)
    for (let gx = 0; gx < 48; gx++) {
      const x = Math.min(png.width - 1, Math.floor(((gx + 0.5) / 48) * png.width)), y = Math.min(png.height - 1, Math.floor(((gy + 0.5) / 86) * png.height));
      const i = (y * png.width + x) * 4;
      out.push(0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2]);
    }
  return out;
}
const desviacion = (v) => {
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length);
};
const cambio = (a, b) => a.filter((x, i) => Math.abs(x - b[i]) > 10).length / a.length;

/**
 * @param {object} anim animación con escenas modo «LIBRE»
 * @param {{log?:(s:string)=>void, muestras?:number[], bundle?:string}} o
 * @returns {Promise<{errores:string[], avisos:string[]}>}
 */
export async function verificarEscenas(anim, { log = () => {}, muestras = [0.15, 0.5, 0.9], bundle } = {}) {
  const libres = anim.escenas.filter((e) => e.modo === "LIBRE");
  if (!libres.length) return { errores: [], avisos: [] };
  const serveUrl = await obtenerPaquete({ bundleDado: bundle, log: () => {} });
  await esperarMemoria("verificar las escenas", { min: 0.5 });
  let navegador = await abrirNavegador();
  const tmp = join(RAIZ, "trabajo", "tmp", "verificar");
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  const consola = [];
  const onBrowserLog = (l) => {
    const t = String(l.text ?? "");
    if (t.startsWith("[QA] ") || /\[ESCENA-ERROR\]/.test(t) || l.type === "error") consola.push(t);
  };
  const inputProps = { animacion: anim, qa: true };
  const errores = [];
  const avisos = [];
  const marcar = (n, msg) => {
    const m = `Escena ${n}: ${msg}`;
    if (!errores.includes(m)) errores.push(m);
  };
  try {
    const comp = await selectComposition({ serveUrl, id: "Animacion", inputProps, puppeteerInstance: navegador });
    for (const e of libres) {
      const huellas = [];
      log(`   🔎 verificando la escena ${e.n}…`);
      for (const m of muestras) {
        const frame = Math.min(comp.durationInFrames - 1, Math.round((e.inicio + Math.max(0.6, e.dur * m)) * FPS));
        consola.length = 0;
        const archivo = join(tmp, `e${e.n}-${frame}.png`);
        for (let intento = 1; ; intento++) {
          try {
            await renderStill({ composition: comp, serveUrl, frame, output: archivo, imageFormat: "png", scale: 0.5, inputProps, puppeteerInstance: navegador, onBrowserLog, overwrite: true, timeoutInMilliseconds: 120000 });
            break;
          } catch (err) {
            if (intento >= 2) { marcar(e.n, `no se pudo dibujar el fotograma ${frame}: ${String(err?.message ?? err).split("\n")[0].slice(0, 160)}`); break; }
            try { await navegador.close({ silent: true }); } catch { /* ya cerrado */ }
            navegador = await abrirNavegador();
          }
        }
        for (const l of consola) {
          const x = l.match(/\[ESCENA-ERROR\]\s*(.*)$/);
          if (x) { const n = x[1].match(/escena (\d+): (.*)$/); marcar(n ? Number(n[1]) : e.n, `el código falla al ejecutarse: ${(n ? n[2] : x[1]).slice(0, 220)}`); continue; }
          if (l.startsWith("[QA] ")) {
            let reg; try { reg = JSON.parse(l.slice(5)); } catch { continue; }
            if (reg.frame !== frame) continue;
            for (const it of reg.items ?? []) if (it.x0 < 24 || it.x1 > 1056) marcar(e.n, `el texto «${String(it.txt).slice(0, 30)}» se sale del lienzo (x ${it.x0}→${it.x1}); acórtalo, achícalo o ajusta su posición`);
            continue;
          }
          if (!/Failed to load resource|favicon|net::ERR|GPU stall|WebGL: INVALID_/i.test(l)) marcar(e.n, `error en la consola: ${l.slice(0, 200)}`);
        }
        try { huellas.push(huella(archivo)); } catch { /* el fotograma falló: ya está marcado */ }
      }
      if (huellas.length === muestras.length) {
        if (huellas.every((h) => desviacion(h) < 5)) marcar(e.n, "la escena está casi vacía (fondo liso): dibuja un protagonista claro con el kit");
        else if (cambio(huellas[0], huellas[1]) < 0.002 && cambio(huellas[1], huellas[2]) < 0.002) marcar(e.n, "la escena está congelada (no cambia entre los fotogramas): anima cámara, trazados, flotación o partículas con useCurrentFrame()");
      }
    }
  } finally {
    try { await navegador.close({ silent: true }); } catch { /* ya cerrado */ }
    rmSync(tmp, { recursive: true, force: true });
  }
  return { errores, avisos };
}
