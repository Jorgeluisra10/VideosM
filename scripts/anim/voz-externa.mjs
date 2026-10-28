#!/usr/bin/env node
/**
 * VOZ EXTERNA: usa una voz que ya tienes (CapCut, ElevenLabs, un locutor, tu grabación) y ajusta el VIDEO a ella, en vez de pelearte alineando a mano.
 *
 *   node scripts/anim/voz-externa.mjs --audio=mi-voz.mp3 [--duraciones=9.8,11.2,…] [--cola=0.5]   alinea la animación activa a esa voz
 *   node scripts/anim/voz-externa.mjs --deshacer                                                  vuelve a los tiempos originales y quita la voz
 *
 * Cómo funciona: mide la voz, detecta las pausas, elige las que separan las escenas (las que mejor encajan con el largo del texto de cada una) y hace que cada
 * escena dure lo que dura su locución. La voz queda como pista de voz del video (se mezcla sola al renderizar) y empieza en 0:00, igual que el video.
 * Si el corte automático se equivoca, pasa las duraciones a mano con --duraciones (una por escena con locución).
 */
import "../_tmp.mjs";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, isAbsolute, join, resolve } from "node:path";
import { decodificar, escribirWavEstereo, SR } from "../audio.mjs";
import { buscarFfmpeg } from "../medios.mjs";
import { cargarNucleoAnim, RAIZ } from "./nucleo.mjs";
import { ARCHIVO_ACTUAL, PISTA_VOZ, dirSalidaVoz, dirVoz, guardarTiemposOriginales, leerTiemposOriginales, restaurarTiemposOriginales } from "./voz.mjs";

const ANIM = () => join(RAIZ, "src", "data", "animacion.json");
const VENTANA = 0.02; // s por ventana de análisis

/** Silencios (pausas) de una pista mono: ventanas de 20 ms por debajo de un umbral adaptativo, de al menos `minimo` s. */
export function analizarVoz(x, minimo = 0.18) {
  const w = Math.round(VENTANA * SR);
  const n = Math.floor(x.length / w);
  const db = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let a = 0;
    for (let k = i * w; k < (i + 1) * w; k++) a += x[k] * x[k];
    db[i] = 10 * Math.log10(a / w + 1e-12);
  }
  const ord = Array.from(db).sort((p, q) => p - q);
  const piso = Math.max(-90, ord[Math.floor(n * 0.1)] ?? -90), habla = ord[Math.floor(n * 0.9)] ?? -20;
  const umbral = Math.min(habla - 18, Math.max(-55, piso + 0.3 * (habla - piso)));
  let primero = -1, ultimo = -1;
  for (let i = 0; i < n; i++) if (db[i] > umbral) { if (primero < 0) primero = i; ultimo = i; }
  const silencios = [];
  let ini = -1;
  for (let i = 0; i <= n; i++) {
    const bajo = i < n && db[i] <= umbral;
    if (bajo && ini < 0) ini = i;
    if (!bajo && ini >= 0) { if ((i - ini) * VENTANA >= minimo) silencios.push({ ini: ini * VENTANA, fin: i * VENTANA }); ini = -1; }
  }
  return { silencios, desde: Math.max(0, primero * VENTANA), hasta: (ultimo + 1) * VENTANA, duracion: x.length / SR, umbral };
}

/** Alinea la animación activa (src/data/animacion.json) a un archivo de voz. Devuelve el resumen. */
export async function alinearConVozExterna({ audio, nombre, duraciones, cola = 0.5, log = console.log }) {
  const N = await cargarNucleoAnim();
  const { ffmpeg } = buscarFfmpeg();
  if (!existsSync(audio)) throw new Error(`No encuentro el audio: ${audio}`);
  if (!existsSync(ANIM())) throw new Error("Primero genera la animación (o carga un ejemplo).");
  const anim = JSON.parse(readFileSync(ANIM(), "utf8"));
  if (anim.formato !== "viral") throw new Error("La voz propia funciona con el motor viral (una idea). Carga un ejemplo viral o genera uno.");
  // si ya hay un ajuste de tiempos puesto (voz propia o «ajustar el video»), se parte de los tiempos originales para no encadenar ajustes
  const original = (await leerTiemposOriginales(anim)) ?? anim;
  const textos = N.textosVoz(original);
  if (!textos.length) throw new Error("Este video no trae texto de locución.");

  const tmp = dirVoz("tmp-externa");
  mkdirSync(tmp, { recursive: true });
  let x = decodificar(ffmpeg, audio, tmp);
  rmSync(tmp, { recursive: true, force: true });
  if (x.length < SR) throw new Error("El audio dura menos de 1 segundo.");
  // recorta el silencio de los extremos (deja 0,25 s al inicio y el final natural)
  const prim = analizarVoz(x);
  const ini = Math.max(0, Math.round((prim.desde - 0.25) * SR));
  const fin = Math.min(x.length, Math.round((prim.hasta + 0.35) * SR));
  x = x.slice(ini, fin);
  const a = analizarVoz(x);
  let pico = 0;
  for (let i = 0; i < x.length; i++) pico = Math.max(pico, Math.abs(x[i]));
  if (pico > 0.001) { const g = 0.92 / pico; for (let i = 0; i < x.length; i++) x[i] *= g; }

  let durs, cortes = [], aproximado = false, avisos = [];
  if (duraciones?.length) {
    if (duraciones.length !== textos.length) throw new Error(`Hay ${textos.length} escenas con locución y me diste ${duraciones.length} duraciones.`);
    durs = duraciones.map((d) => Math.round(Number(d) * 100) / 100);
    if (durs.some((d) => !(d >= 1.2 && d <= 90))) throw new Error("Cada duración debe estar entre 1,2 y 90 segundos.");
  } else {
    const r = N.elegirCortes({ silencios: a.silencios, desde: a.desde, hasta: a.hasta, pesos: textos.map((t) => t.texto.split(/\s+/).length) });
    cortes = r.cortes; aproximado = r.aproximado; avisos = r.avisos;
    durs = N.duracionesDesdeCortes(cortes, a.duracion, cola);
  }
  const nueva = N.reajustarAnimacion(original, durs);
  const prob = N.validar(nueva);
  if (prob.length) avisos.push(`La animación reajustada tiene avisos de validación: ${prob.slice(0, 3).join(" | ")}`);

  mkdirSync(dirVoz(), { recursive: true });
  mkdirSync(dirSalidaVoz(), { recursive: true });
  await guardarTiemposOriginales(original, nueva);
  writeFileSync(ANIM(), JSON.stringify(nueva, null, 1));
  escribirWavEstereo(PISTA_VOZ(), x);
  const mp3 = dirSalidaVoz("voz-completa.mp3");
  rmSync(mp3, { force: true });
  spawnSync(ffmpeg, ["-v", "error", "-y", "-i", PISTA_VOZ(), "-codec:a", "libmp3lame", "-q:a", "3", mp3], { encoding: "utf8" });

  const voc = N.textosVoz(nueva);
  const manifiesto = {
    version: 1, externa: true, motor: "externa", cambioTiempos: true, creado: new Date().toISOString(), firma: N.firmaVoz(nueva), archivo: nombre ?? basename(audio),
    modelo: "voz propia", voz: `voz propia (${nombre ?? basename(audio)})`, estilo: "externa", ritmo: "—", extra: "",
    escenas: voc.map((e) => ({ n: e.n, inicio: e.inicio, dur: e.dur, durVoz: e.dur, tempo: 1, cortada: false, cabe: true })),
    cortes, aproximado, avisos, costoUsd: 0, pista: "trabajo/anim/voz/voz-mezcla.wav",
    audio: existsSync(mp3) ? "/salida/voz/voz-completa.mp3" : null,
  };
  writeFileSync(ARCHIVO_ACTUAL(), JSON.stringify(manifiesto, null, 1));
  log(`✅ Video alineado a tu voz: ${voc.length} escenas · ${nueva.duracion.toFixed(1)} s (la voz dura ${a.duracion.toFixed(1)} s)`);
  voc.forEach((e) => log(`   escena ${e.n}: ${e.inicio.toFixed(1)}–${(e.inicio + e.dur).toFixed(1)} s (${e.dur.toFixed(1)} s)`));
  avisos.forEach((m) => log(`⚠️ ${m}`));
  log("   Ahora pulsa «Renderizar»: la voz se mezcla sola. Si vas a editar en CapCut, importa el video renderizado y esta misma voz en 0:00: ya coinciden.");
  return { anim: nueva, durs, cortes, aproximado, avisos, duracionVoz: a.duracion };
}

/** Vuelve a los tiempos originales y quita la voz que los cambió (voz propia o «ajustar el video a la voz»). */
export async function quitarVozExterna({ log = console.log } = {}) {
  if (!(await restaurarTiemposOriginales(ANIM()))) { log("No hay ningún ajuste de tiempos que deshacer."); return false; }
  log("↩️ Listo: el video volvió a sus tiempos originales y se quitó la voz. Si ya lo habías renderizado, vuelve a renderizarlo.");
  return true;
}

if (process.argv[1]?.endsWith("anim/voz-externa.mjs")) {
  const args = process.argv.slice(2);
  const valor = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
  const abs = (p) => (isAbsolute(p) ? p : resolve(RAIZ, p));
  try {
    if (args.includes("--deshacer")) await quitarVozExterna();
    else {
      const audio = valor("audio");
      if (!audio) throw new Error("Falta --audio=ruta/de/tu-voz.mp3 (o --deshacer).");
      await alinearConVozExterna({ audio: abs(audio), duraciones: valor("duraciones")?.split(",").map((s) => Number(s.trim().replace(",", "."))), cola: Number(valor("cola") ?? "0.5") });
    }
  } catch (e) {
    console.error(`❌ ${e.message ?? e}`);
    process.exit(1);
  }
}
