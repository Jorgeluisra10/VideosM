#!/usr/bin/env node
/**
 * VOZ EN OFF CON IA para la animación activa (src/data/animacion.json): la lee escena por escena con gpt-4o-mini-tts (acento colombiano y alegre,
 * pedido con `instructions`), ajusta cada frase al tiempo de su escena y deja UNA pista de voz colocada en el tiempo (trabajo/anim/voz/voz-mezcla.wav)
 * que el render mezcla con los efectos y la música, más un mp3 para escucharla (trabajo/salida/voz/voz-completa.mp3).
 *
 *   node scripts/anim/voz.mjs [--estilo=rolo-f] [--voz=coral] [--ritmo=agil] [--instrucciones="texto extra"] [--sin-cache]
 *   node scripts/anim/voz.mjs --probar --estilo=paisa-f [--texto="Hola…"]   → un mp3 corto de prueba (trabajo/salida/voz/prueba-*.mp3)
 *
 * Necesita OPENAI_API_KEY (archivo .env / panel → Ajustes). Costo ≈ US$ 0,015 por minuto de audio. Cada frase se guarda en caché (misma voz + estilo + texto = no se paga dos veces).
 */
import "../_tmp.mjs";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decodificar, escribirWavEstereo, SR } from "../audio.mjs";
import { cargarEnv, configuracion } from "../ia/entorno.mjs";
import { buscarFfmpeg } from "../medios.mjs";
import { ErrorVoz, pedir } from "../voz/comun.mjs";
import { cargarNucleoAnim, RAIZ } from "./nucleo.mjs";

export const dirVoz = (...p) => join(RAIZ, "trabajo", "anim", "voz", ...p);
export const dirSalidaVoz = (...p) => join(RAIZ, "trabajo", "salida", "voz", ...p);
export const ARCHIVO_ACTUAL = () => dirVoz("actual.json");
export const PISTA_VOZ = () => dirVoz("voz-mezcla.wav");

/** Una frase → mp3 (gpt-4o-mini-tts). `speed` no se usa: ese modelo no lo admite; el ritmo se pide en las instrucciones. */
export async function sintetizarFrase({ texto, voz, instrucciones, modelo, clave, url }) {
  if (!clave) throw new ErrorVoz("Falta OPENAI_API_KEY (panel → Ajustes) para generar la voz con IA.");
  const base = (url || "https://api.openai.com/v1").replace(/\/+$/, "");
  const r = await pedir(`${base}/audio/speech`, { method: "POST", headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: modelo, voice: voz, input: texto, ...(instrucciones ? { instructions: instrucciones } : {}), response_format: "mp3" }) }, { etiqueta: "OpenAI audio.speech" });
  const mp3 = Buffer.from(await r.arrayBuffer());
  if (mp3.length < 1000) throw new ErrorVoz("OpenAI devolvió un audio vacío.");
  return mp3;
}

/** Quita el silencio de los extremos (umbral bajo) y deja 60 ms de aire. */
function recortarSilencio(x) {
  const umbral = 0.012, aire = Math.round(0.06 * SR);
  let a = 0, b = x.length - 1;
  while (a < b && Math.abs(x[a]) < umbral) a++;
  while (b > a && Math.abs(x[b]) < umbral) b--;
  return x.slice(Math.max(0, a - aire), Math.min(x.length, b + aire + 1));
}

function aWavMono(ruta, x) {
  const n = x.length, b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x[i])) * 32767), 44 + i * 2);
  writeFileSync(ruta, b);
}

/** Acelera una frase (ffmpeg atempo, conserva el tono). */
function acelerar(ffmpeg, x, tempo, tmp) {
  mkdirSync(tmp, { recursive: true });
  const a = join(tmp, "t-in.wav"), b = join(tmp, "t-out.wav");
  aWavMono(a, x);
  const r = spawnSync(ffmpeg, ["-v", "error", "-y", "-i", a, "-filter:a", `atempo=${tempo.toFixed(4)}`, "-ac", "1", "-ar", String(SR), b], { encoding: "utf8" });
  if (r.status !== 0 || !existsSync(b)) throw new Error(`No pude acelerar la frase: ${String(r.stderr ?? "").slice(0, 200)}`);
  return decodificar(ffmpeg, b, tmp);
}

/**
 * Genera la voz de TODA la animación y la deja lista para el render.
 * `opciones` = { estilo, voz, ritmo, extra, modelo }. Devuelve el manifiesto (también guardado en trabajo/anim/voz/actual.json).
 */
export async function generarVozAnimacion({ anim, opciones = {}, clave, url, log = console.log, sinCache = false }) {
  const N = await cargarNucleoAnim();
  const textos = N.textosVoz(anim);
  if (!textos.length) throw new ErrorVoz("Esta animación no trae texto de voz (la locución). Carga o genera un video con el motor viral.");
  const modelo = opciones.modelo || N.MODELO_TTS;
  const voz = N.vozEfectiva(opciones);
  const instrucciones = N.construirInstrucciones(opciones);
  const { ffmpeg } = buscarFfmpeg();
  mkdirSync(dirVoz("cache"), { recursive: true });
  const tmp = dirVoz("tmp");
  const est = N.estimarVoz(anim);
  log(`🎙️ Voz «${voz}» · estilo «${opciones.estilo || N.ESTILO_POR_DEFECTO}» · ritmo «${opciones.ritmo || N.RITMO_POR_DEFECTO}» · ${modelo}`);
  log(`   ${textos.length} escenas · ${est.caracteres} caracteres ≈ ${est.segundos.toFixed(0)} s de audio ≈ US$ ${est.usd.toFixed(3)}`);

  const total = Math.max(...anim.escenas.map((e) => Number(e.fin ?? Number(e.inicio) + Number(e.dur))));
  const pista = new Float32Array(Math.ceil((total + 1) * SR));
  const escenas = [];
  let desdeCache = 0, pedidas = 0;

  // las frases se piden de 3 en 3 (más rápido); el resto del proceso es en orden
  const mp3s = new Array(textos.length);
  const pendientes = [];
  textos.forEach((e, i) => {
    const clave_ = N.claveCacheVoz(modelo, voz, instrucciones, e.texto);
    const f = dirVoz("cache", `${clave_}.mp3`);
    if (!sinCache && existsSync(f) && readFileSync(f).length > 1000) { mp3s[i] = f; desdeCache++; }
    else pendientes.push({ i, f, e });
  });
  for (let k = 0; k < pendientes.length; k += 3) {
    await Promise.all(pendientes.slice(k, k + 3).map(async ({ i, f, e }) => {
      const mp3 = await sintetizarFrase({ texto: e.texto, voz, instrucciones, modelo, clave, url });
      writeFileSync(f, mp3);
      mp3s[i] = f;
      pedidas++;
      log(`   ↓ escena ${e.n}: «${e.texto.slice(0, 48)}${e.texto.length > 48 ? "…" : ""}»`);
    }));
  }
  if (desdeCache) log(`   ♻️ ${desdeCache} frases salieron de la caché (sin costo)`);

  for (let i = 0; i < textos.length; i++) {
    const e = textos[i];
    let x = recortarSilencio(decodificar(ffmpeg, mp3s[i], tmp));
    const durOriginal = x.length / SR;
    const aj = N.ajusteTempo(durOriginal, e.dur);
    if (aj.tempo > 1.001) x = acelerar(ffmpeg, x, aj.tempo, tmp);
    const ini = Math.round((e.inicio + N.ENTRADA_VOZ) * SR);
    const maxLen = Math.max(0, Math.round((e.inicio + e.dur - 0.05) * SR) - ini);
    let largo = Math.min(x.length, maxLen);
    const cortada = largo < x.length;
    for (let k = 0; k < largo; k++) {
      // fundido de 80 ms al cortar una frase que no cabe
      const f = cortada ? Math.min(1, (largo - k) / (0.08 * SR)) : 1;
      if (ini + k < pista.length) pista[ini + k] += x[k] * f;
    }
    escenas.push({ n: e.n, inicio: e.inicio, dur: e.dur, caracteres: e.texto.length, durVoz: +(durOriginal).toFixed(2), tempo: +aj.tempo.toFixed(3), cabe: aj.cabe && !cortada, cortada });
    const marca = cortada ? "✂️ no cabe: se cortó el final" : aj.tempo > 1.001 ? `⏩ ×${aj.tempo.toFixed(2)}` : "ok";
    log(`   ✔ escena ${e.n} · ${e.dur.toFixed(1)} s · voz ${durOriginal.toFixed(1)} s · ${marca}`);
  }

  // nivela: pico a 0,92
  let pico = 0;
  for (let i = 0; i < pista.length; i++) pico = Math.max(pico, Math.abs(pista[i]));
  if (pico > 0.001) { const g = 0.92 / pico; for (let i = 0; i < pista.length; i++) pista[i] *= g; }

  mkdirSync(dirVoz(), { recursive: true });
  mkdirSync(dirSalidaVoz(), { recursive: true });
  escribirWavEstereo(PISTA_VOZ(), pista);
  const mp3 = dirSalidaVoz("voz-completa.mp3");
  rmSync(mp3, { force: true });
  spawnSync(ffmpeg, ["-v", "error", "-y", "-i", PISTA_VOZ(), "-codec:a", "libmp3lame", "-q:a", "3", mp3], { encoding: "utf8" });
  rmSync(tmp, { recursive: true, force: true });

  const manifiesto = {
    version: 1,
    creado: new Date().toISOString(),
    firma: N.firmaVoz(anim),
    modelo, voz, estilo: opciones.estilo || N.ESTILO_POR_DEFECTO, ritmo: opciones.ritmo || N.RITMO_POR_DEFECTO, extra: opciones.extra || "",
    instrucciones,
    escenas,
    frasesPedidas: pedidas, frasesDeCache: desdeCache,
    estimado: est,
    costoUsd: Math.round((pedidas / Math.max(1, textos.length)) * est.usd * 10000) / 10000,
    pista: "trabajo/anim/voz/voz-mezcla.wav",
    audio: existsSync(mp3) ? "/salida/voz/voz-completa.mp3" : null,
  };
  writeFileSync(ARCHIVO_ACTUAL(), JSON.stringify(manifiesto, null, 1));
  const noCaben = escenas.filter((e) => !e.cabe);
  log(`\n✅ Voz lista: ${escenas.length} escenas · ${pedidas} frases nuevas (≈ US$ ${manifiesto.costoUsd.toFixed(3)})${noCaben.length ? ` · ⚠️ ${noCaben.length} escena(s) con la voz muy larga (${noCaben.map((e) => e.n).join(", ")}): acorta el texto o alarga la escena` : ""}`);
  log("   Ahora pulsa «Renderizar» (la voz se mezcla sola) o «Ponerla al video ya renderizado».");
  return manifiesto;
}

/** ¿La voz generada corresponde a esta animación? (misma firma de textos y tiempos). */
export async function vozVigente(anim) {
  try {
    const m = JSON.parse(readFileSync(ARCHIVO_ACTUAL(), "utf8"));
    const N = await cargarNucleoAnim();
    return { manifiesto: m, vigente: m.firma === N.firmaVoz(anim) && existsSync(PISTA_VOZ()) };
  } catch {
    return { manifiesto: null, vigente: false };
  }
}

/** Un mp3 corto para probar una voz/estilo (se guarda en trabajo/salida/voz/prueba-<clave>.mp3 y se sirve al panel). */
export async function probarVoz({ opciones = {}, texto, clave, url }) {
  const N = await cargarNucleoAnim();
  const modelo = opciones.modelo || N.MODELO_TTS;
  const voz = N.vozEfectiva(opciones);
  const instrucciones = N.construirInstrucciones(opciones);
  const frase = N.textoParaVoz(texto) || "¿Sabías que Bogotá lleva setenta y siete años esperando un metro? En mil novecientos cuarenta y dos tenía cuatrocientos mil habitantes. Hoy, casi ocho millones.";
  const id = N.claveCacheVoz(modelo, voz, instrucciones, frase);
  mkdirSync(dirSalidaVoz(), { recursive: true });
  const f = dirSalidaVoz(`prueba-${id}.mp3`);
  let costo = 0;
  if (!existsSync(f) || readFileSync(f).length < 1000) {
    writeFileSync(f, await sintetizarFrase({ texto: frase, voz, instrucciones, modelo, clave, url }));
    costo = Math.round(((frase.length / N.CARACTERES_POR_SEGUNDO) / 60) * N.USD_POR_MINUTO_TTS * 10000) / 10000;
  }
  return { url: `/salida/voz/prueba-${id}.mp3`, voz, modelo, costoUsd: costo, instrucciones };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("anim/voz.mjs")) {
  cargarEnv();
  const args = process.argv.slice(2);
  const valor = (n, def) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? def;
  const cfg = configuracion();
  if (!cfg.clave) {
    console.error("❌ No hay OPENAI_API_KEY. Ponla en el archivo .env (panel → Ajustes) y vuelve a intentarlo.");
    process.exit(1);
  }
  const opciones = { estilo: valor("estilo"), voz: valor("voz"), ritmo: valor("ritmo"), extra: valor("instrucciones"), modelo: valor("modelo") };
  try {
    if (args.includes("--probar")) {
      const r = await probarVoz({ opciones, texto: valor("texto", ""), clave: cfg.clave, url: cfg.url });
      console.log(`✅ Prueba de voz «${r.voz}»: ${r.url}`);
    } else {
      const anim = JSON.parse(readFileSync(join(RAIZ, "src", "data", "animacion.json"), "utf8"));
      await generarVozAnimacion({ anim, opciones, clave: cfg.clave, url: cfg.url, sinCache: args.includes("--sin-cache") });
    }
  } catch (e) {
    console.error(`❌ ${e.message ?? e}`);
    process.exit(1);
  }
}
