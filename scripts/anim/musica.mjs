#!/usr/bin/env node
/**
 * MÚSICA LIBRE: pon una pista libre de derechos (la que dejes en assets/musica/) como música de fondo de los videos del motor viral.
 *
 *   node scripts/anim/musica.mjs --listar                              pistas disponibles en assets/musica/ (con su duración)
 *   node scripts/anim/musica.mjs --usar=assets/musica/mi-pista.mp3     la deja como música de fondo (public/audios/musica.wav, 48 kHz)
 *   node scripts/anim/musica.mjs --restaurar                           vuelve a la música sintetizada del proyecto
 *   node scripts/anim/musica.mjs --actual                              qué música está en uso
 *
 * El render la mezcla sola: se nivela al mismo volumen que la sintetizada, queda ≈ 24 dB bajo la voz mientras habla (ducking) y entra y sale con fundido.
 * Solo se aceptan pistas que estén dentro de assets/musica/ (ahí van únicamente las libres de derechos o creadas por ti; ver assets/musica/README.md).
 */
import "../_tmp.mjs";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative, resolve, sep } from "node:path";
import { decodificar, escribirWavEstereo, SR } from "../audio.mjs";
import { buscarFfmpeg } from "../medios.mjs";
import { RAIZ } from "./nucleo.mjs";

export const EXT_MUSICA = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".opus"];
const rutas = (raiz) => ({ dir: join(raiz, "assets", "musica"), destino: join(raiz, "public", "audios", "musica.wav"), respaldo: join(raiz, "trabajo", "anim", "musica-sintetica.wav"), ficha: join(raiz, "trabajo", "anim", "musica-usada.json") });

const duracion = (ffprobe, f) => Number(String(spawnSync(ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).stdout).trim()) || 0;

/** Pistas de assets/musica/ (mp3, wav, m4a, aac, ogg, flac, opus) con su duración en segundos. */
export function listarMusica({ raiz = RAIZ } = {}) {
  const { dir } = rutas(raiz);
  if (!existsSync(dir)) return [];
  const { ffprobe } = buscarFfmpeg();
  return readdirSync(dir).filter((f) => EXT_MUSICA.includes(extname(f).toLowerCase())).sort().map((f) => ({ archivo: f, ruta: join("assets", "musica", f), segundos: Math.round(duracion(ffprobe, join(dir, f)) * 10) / 10 }));
}

/** Qué música está en uso: { origen: "sintetizada" | "libre", archivo?, desde? }. */
export function musicaActual({ raiz = RAIZ } = {}) {
  const { ficha } = rutas(raiz);
  try { return { origen: "libre", ...JSON.parse(readFileSync(ficha, "utf8")) }; } catch { return { origen: "sintetizada" }; }
}

/** Convierte la pista a public/audios/musica.wav (48 kHz, 30 ms de fundido en los extremos para que el bucle no haga clic). Devuelve { segundos }. */
export function usarMusica({ archivo, raiz = RAIZ }) {
  const { dir, destino, respaldo, ficha } = rutas(raiz);
  const abs = resolve(raiz, archivo);
  if (!(abs === resolve(dir) || abs.startsWith(resolve(dir) + sep))) throw new Error("La pista tiene que estar dentro de assets/musica/ (ahí solo van pistas libres de derechos o creadas por ti).");
  if (!existsSync(abs) || !statSync(abs).isFile()) throw new Error(`No encuentro la pista: ${archivo}`);
  if (!EXT_MUSICA.includes(extname(abs).toLowerCase())) throw new Error(`Formato no admitido (${EXT_MUSICA.join(", ")}).`);
  if (statSync(abs).size > 200 * 1024 * 1024) throw new Error("La pista pesa más de 200 MB.");
  const { ffmpeg, ffprobe } = buscarFfmpeg();
  const seg = duracion(ffprobe, abs);
  if (seg < 8) throw new Error("La pista dura menos de 8 segundos: busca una más larga (se repite en bucle si el video es más largo).");
  mkdirSync(join(raiz, "trabajo", "anim"), { recursive: true });
  // la sintetizada se guarda una sola vez para poder volver a ella
  if (!existsSync(ficha) && existsSync(destino) && !existsSync(respaldo)) copyFileSync(destino, respaldo);
  const tmp = `${destino}.nuevo.wav`, tmpDec = join(raiz, "trabajo", "anim", "tmp-musica");
  try {
    // el mezclador trabaja en mono a 48 kHz: se decodifica igual y se le dan 30 ms de fundido a los extremos para que el bucle no haga clic
    const x = decodificar(ffmpeg, abs, tmpDec);
    if (x.length < 8 * SR) throw new Error("No pude leer la pista (¿está dañada?).");
    const f = Math.round(0.03 * SR);
    for (let i = 0; i < f; i++) { const g = i / f; x[i] *= g; x[x.length - 1 - i] *= g; }
    escribirWavEstereo(tmp, x);
  } catch (e) {
    rmSync(tmp, { force: true });
    throw e;
  } finally {
    rmSync(tmpDec, { recursive: true, force: true });
  }
  renameSync(tmp, destino);
  writeFileSync(ficha, JSON.stringify({ archivo: relative(raiz, abs).split(sep).join("/"), desde: new Date().toISOString(), segundos: Math.round(seg * 10) / 10 }, null, 2));
  return { segundos: seg };
}

/** Vuelve a la música sintetizada (la copia guardada; si no existe, la que trae git). */
export function restaurarMusica({ raiz = RAIZ } = {}) {
  const { destino, respaldo, ficha } = rutas(raiz);
  if (!existsSync(ficha)) return false;
  if (existsSync(respaldo)) copyFileSync(respaldo, destino);
  else spawnSync("git", ["checkout", "--", "public/audios/musica.wav"], { cwd: raiz, stdio: "ignore" });
  rmSync(ficha, { force: true });
  return true;
}

if (process.argv[1]?.endsWith("anim/musica.mjs")) {
  const args = process.argv.slice(2);
  const valor = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
  try {
    if (valor("usar")) {
      const r = usarMusica({ archivo: valor("usar") });
      console.log(`✅ Música de fondo: ${basename(valor("usar"))} (${r.segundos.toFixed(0)} s). Se mezcla sola al renderizar: ≈ 24 dB bajo la voz, con fundido de entrada y salida.`);
    } else if (args.includes("--restaurar")) console.log(restaurarMusica() ? "↩️ Listo: vuelve la música sintetizada del proyecto." : "Ya estaba la música sintetizada.");
    else if (args.includes("--actual")) { const a = musicaActual(); console.log(a.origen === "libre" ? `🎵 En uso: ${a.archivo} (${a.segundos} s)` : "🎵 En uso: la música sintetizada del proyecto (creada por el sistema, libre de derechos)."); }
    else {
      const l = listarMusica();
      if (!l.length) console.log("No hay pistas en assets/musica/. Lee assets/musica/README.md para saber cómo agregar música libre de derechos.\nMientras tanto se usa la música sintetizada del proyecto (creada por el sistema, libre de derechos).");
      else l.forEach((p) => console.log(`🎵 ${p.ruta} · ${p.segundos} s`));
    }
  } catch (e) {
    console.error(`❌ ${e.message ?? e}`);
    process.exit(1);
  }
}
