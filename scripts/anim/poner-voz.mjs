#!/usr/bin/env node
/**
 * Pone la VOZ EN OFF (ya generada con scripts/anim/voz.mjs) a un MP4 ya renderizado, SIN volver a renderizar los fotogramas:
 * mezcla la pista de voz con el audio que ya trae el video (efectos y música, un poco más bajos) y copia el video tal cual.
 *
 *   node scripts/anim/poner-voz.mjs [--video=trabajo/salida/video-animacion.mp4] [--salida=trabajo/salida/video-animacion-con-voz.mp4] [--original=0.7]
 *
 * El video tiene que ser el de la MISMA animación para la que se generó la voz (la voz va colocada en el tiempo de cada escena).
 */
import "../_tmp.mjs";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { decodificar, duckear, escribirWavEstereo, normalizarEnSitio, SR } from "../audio.mjs";
import { buscarFfmpeg } from "../medios.mjs";
import { cargarNucleoAnim, RAIZ } from "./nucleo.mjs";
import { PISTA_VOZ, vozVigente } from "./voz.mjs";

/** Devuelve { salida, segundos, vozVigente } o lanza un Error con un mensaje claro. */
export async function ponerVoz({ video, salida, original = 0.7, log = console.log }) {
  const { ffmpeg, ffprobe } = buscarFfmpeg();
  if (!existsSync(video)) throw new Error(`No encuentro el video: ${video}. Primero pulsa «Renderizar».`);
  const anim = JSON.parse(readFileSync(join(RAIZ, "src", "data", "animacion.json"), "utf8"));
  const { manifiesto, vigente } = await vozVigente(anim);
  if (!manifiesto || !existsSync(PISTA_VOZ())) throw new Error("Todavía no hay voz generada: pulsa «Generar voz» primero.");
  if (!vigente) log("⚠️ La voz se generó para otra versión del video (cambió el texto o los tiempos): puede quedar descuadrada. Vuelve a generarla si cambiaste algo.");

  const dur = Number(String(spawnSync(ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video], { encoding: "utf8" }).stdout).trim()) || 0;
  const conAudio = /audio/.test(String(spawnSync(ffprobe, ["-v", "error", "-select_streams", "a", "-show_entries", "stream=codec_type", "-of", "csv=p=0", video], { encoding: "utf8" }).stdout));
  if (dur && Math.abs(dur - anim.duracion) > 1) log(`⚠️ El video dura ${dur.toFixed(1)} s y la animación activa ${anim.duracion} s: ¿es el video de esta animación?`);
  log(`🎞️ ${video} · ${dur.toFixed(1)} s · ${conAudio ? "con audio (efectos/música)" : "sin audio"}`);

  const tmp = join(dirname(salida), "tmp-poner-voz");
  mkdirSync(tmp, { recursive: true });
  const N = Math.ceil((dur || anim.duracion) * SR);
  const mezcla = new Float32Array(N);
  const v = decodificar(ffmpeg, PISTA_VOZ(), tmp);
  if (conAudio) {
    const o = decodificar(ffmpeg, video, tmp);
    for (let i = 0; i < Math.min(N, o.length); i++) mezcla[i] = o[i] * original;
    duckear(mezcla, v); // ducking: la música y los efectos del video bajan mientras habla la voz
  }
  for (let i = 0; i < Math.min(N, v.length); i++) mezcla[i] += v[i];
  let pico = 0;
  for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(mezcla[i]));
  if (pico > 0.97) for (let i = 0; i < N; i++) mezcla[i] *= 0.97 / pico;
  const wav = join(tmp, "mezcla-final.wav");
  escribirWavEstereo(wav, mezcla);
  const norm = normalizarEnSitio(ffmpeg, wav, { objetivo: -14, pico: -1.5 }); // volumen de plataforma
  log(norm ? `🔊 Volumen normalizado: ${norm.antes.toFixed(1)} → −14 LUFS` : "🔊 (no pude normalizar el volumen: se deja la mezcla tal cual)");

  rmSync(salida, { force: true });
  const r = spawnSync(ffmpeg, ["-v", "error", "-y", "-i", video, "-i", wav, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", salida], { encoding: "utf8" });
  rmSync(tmp, { recursive: true, force: true });
  if (r.status !== 0 || !existsSync(salida) || statSync(salida).size < 10000) throw new Error(`No pude unir la voz al video: ${String(r.stderr ?? "").slice(0, 300)}`);
  log(`\n✅ ${salida}\n   ${(statSync(salida).size / 1048576).toFixed(1)} MB · voz «${manifiesto.voz}» (${manifiesto.estilo})`);
  return { salida, segundos: dur, vozVigente: vigente };
}

if (process.argv[1]?.endsWith("anim/poner-voz.mjs")) {
  const args = process.argv.slice(2);
  const valor = (n, def) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? def;
  const abs = (p) => (isAbsolute(p) ? p : resolve(RAIZ, p));
  try {
    await ponerVoz({ video: abs(valor("video", "trabajo/salida/video-animacion.mp4")), salida: abs(valor("salida", "trabajo/salida/video-animacion-con-voz.mp4")), original: Number(valor("original", "0.7")) || 0.7 });
  } catch (e) {
    console.error(`❌ ${e.message ?? e}`);
    process.exit(1);
  }
}
