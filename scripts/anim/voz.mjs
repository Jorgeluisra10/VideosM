#!/usr/bin/env node
/**
 * VOZ EN OFF CON IA para la animación activa (src/data/animacion.json): la lee escena por escena con OpenAI gpt-4o-mini-tts (acento colombiano y alegre,
 * pedido con `instructions`) o con ElevenLabs (voz de estudio, a elegir de tu cuenta), ajusta cada frase al tiempo de su escena y deja UNA pista de voz
 * colocada en el tiempo (trabajo/anim/voz/voz-mezcla.wav) que el render mezcla con los efectos y la música, más un mp3 para escucharla (trabajo/salida/voz/voz-completa.mp3).
 *
 *   node scripts/anim/voz.mjs [--estilo=rolo-f] [--voz=coral] [--ritmo=agil] [--instrucciones="texto extra"] [--sin-cache]            OpenAI
 *   node scripts/anim/voz.mjs --motor=eleven --voz-id=<ID de la voz> [--modelo=eleven_multilingual_v2] [--perfil=equilibrada] [--ritmo=agil]   ElevenLabs
 *   … --ajuste=video   en vez de acelerar la voz, ALARGA las escenas que no caben (hay que renderizar de nuevo); --deshacer en voz-externa.mjs lo revierte
 *   node scripts/anim/voz.mjs --probar [--motor=eleven --voz-id=…] [--texto="Hola…"]   → un mp3 corto de prueba (trabajo/salida/voz/prueba-*.mp3)
 *
 * Necesita OPENAI_API_KEY o ELEVENLABS_API_KEY (archivo .env / panel → Ajustes). OpenAI ≈ US$ 0,015 por minuto de audio; ElevenLabs gasta créditos por carácter.
 * Cada frase se guarda en caché (misma voz + ajustes + texto = no se paga dos veces).
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


/** Una frase → mp3 con ElevenLabs (text-to-speech). Las frases vecinas (`previo`/`siguiente`) se mandan como contexto para que la entonación continúe entre escenas. */
export async function sintetizarFraseEleven({ texto, voiceId, modelo, clave, url, ajustes, previo, siguiente }) {
  if (!clave) throw new ErrorVoz("Falta la clave de ElevenLabs (panel → Ajustes) para generar la voz.");
  const base = (url || "https://api.elevenlabs.io").replace(/\/+$/, "");
  const cuerpo = { text: texto, model_id: modelo, voice_settings: { stability: ajustes.estabilidad, similarity_boost: ajustes.similitud, style: ajustes.estilo, use_speaker_boost: true, speed: ajustes.velocidad } };
  if (previo) cuerpo.previous_text = previo;
  if (siguiente) cuerpo.next_text = siguiente;
  const r = await pedir(`${base}/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, { method: "POST", headers: { "xi-api-key": clave, "Content-Type": "application/json", Accept: "audio/mpeg" }, body: JSON.stringify(cuerpo) }, { etiqueta: "ElevenLabs text-to-speech" });
  const mp3 = Buffer.from(await r.arrayBuffer());
  if (mp3.length < 1000) throw new ErrorVoz("ElevenLabs devolvió un audio vacío.");
  return mp3;
}

/** Las voces de tu cuenta de ElevenLabs (las «premade», las que añadiste de la biblioteca y las clonadas), con las que hablan español primero. */
export async function listarVocesEleven({ clave, url }) {
  if (!clave) throw new ErrorVoz("Falta la clave de ElevenLabs (panel → Ajustes).");
  const base = (url || "https://api.elevenlabs.io").replace(/\/+$/, "");
  const r = await pedir(`${base}/v1/voices`, { method: "GET", headers: { "xi-api-key": clave, Accept: "application/json" } }, { etiqueta: "ElevenLabs voces" });
  const j = await r.json();
  const voces = (j.voices ?? []).map((v) => {
    const idiomas = [...new Set((v.verified_languages ?? []).map((l) => String(l.language ?? l.locale ?? "").toLowerCase()).filter(Boolean))];
    const l = v.labels ?? {};
    return { id: String(v.voice_id ?? ""), nombre: String(v.name ?? "").slice(0, 60), categoria: String(v.category ?? ""), genero: String(l.gender ?? ""), acento: String(l.accent ?? ""), edad: String(l.age ?? ""), uso: String(l.use_case ?? l.usecase ?? ""), descripcion: String(l.descriptive ?? v.description ?? "").slice(0, 120), preview: typeof v.preview_url === "string" && /^https:\/\//.test(v.preview_url) ? v.preview_url : "", espanol: idiomas.includes("es") || idiomas.some((x) => x.startsWith("es")) || /espa|spanish|colomb|mexic|argent/i.test(`${l.accent ?? ""} ${l.language ?? ""}`) };
  }).filter((v) => /^[A-Za-z0-9]{10,40}$/.test(v.id));
  return voces.sort((a, b) => Number(b.espanol) - Number(a.espanol) || a.nombre.localeCompare(b.nombre));
}

// ---------------------------------------------------------------------------
// Tiempos originales: al alinear el video a una voz (propia o «ajustar el video») se guarda una copia para poder deshacerlo.
// El archivo lleva la firma de lo que dejó escrito: si después cargas otro video, esa copia ya no vale y se ignora.
// ---------------------------------------------------------------------------
export const COPIA_TIEMPOS = () => dirVoz("tiempos-originales.json");

export async function guardarTiemposOriginales(original, ajustada) {
  const N = await cargarNucleoAnim();
  mkdirSync(dirVoz(), { recursive: true });
  writeFileSync(COPIA_TIEMPOS(), JSON.stringify({ firma: N.firmaVoz(ajustada), original }));
}

/** Los tiempos originales, solo si la animación activa es la que dejó ese ajuste. */
export async function leerTiemposOriginales(actual) {
  try {
    const c = JSON.parse(readFileSync(COPIA_TIEMPOS(), "utf8"));
    const N = await cargarNucleoAnim();
    return c.firma === N.firmaVoz(actual) && c.original?.escenas ? c.original : null;
  } catch {
    return null;
  }
}

/** Deshace el ajuste de tiempos y quita la voz que lo causó. Devuelve true si había algo que deshacer. */
export async function restaurarTiemposOriginales(archivoAnim) {
  const actual = JSON.parse(readFileSync(archivoAnim, "utf8"));
  const original = await leerTiemposOriginales(actual);
  rmSync(COPIA_TIEMPOS(), { force: true });
  if (!original) return false;
  writeFileSync(archivoAnim, JSON.stringify(original, null, 1));
  rmSync(ARCHIVO_ACTUAL(), { force: true });
  return true;
}

/**
 * Genera la voz de TODA la animación y la deja lista para el render.
 * `opciones` = { motor: "openai"|"eleven", estilo, voz, ritmo, extra, modelo, voiceId, perfil, nombreVoz, ajuste: "voz"|"video" }.
 * ajuste «voz» (por defecto): la voz se acelera (OpenAI ×1,35 · ElevenLabs ×1,25 como máximo) para caber en cada escena.
 * ajuste «video»: la voz queda natural y se ALARGAN las escenas que no caben (cambia animacion.json; hay que renderizar de nuevo).
 * Devuelve el manifiesto (también guardado en trabajo/anim/voz/actual.json).
 */
export async function generarVozAnimacion({ anim, opciones = {}, clave, url, log = console.log, sinCache = false }) {
  const N = await cargarNucleoAnim();
  const eleven = opciones.motor === "eleven";
  const ajusteVideo = opciones.ajuste === "video";
  const archivoAnim = join(RAIZ, "src", "data", "animacion.json");
  // «ajustar el video» parte siempre de los tiempos originales (así repetirlo con otra voz no encadena alargues)
  const base = ajusteVideo ? (await leerTiemposOriginales(anim)) ?? anim : anim;
  const textosBase = N.textosVoz(base);
  if (!textosBase.length) throw new ErrorVoz("Esta animación no trae texto de voz (la locución). Carga o genera un video con el motor viral.");
  const { ffmpeg } = buscarFfmpeg();
  mkdirSync(dirVoz("cache"), { recursive: true });
  const tmp = dirVoz("tmp");

  let modelo, voz, instrucciones = "", ajustes = null, estimado;
  if (eleven) {
    modelo = N.modeloElevenPorId(opciones.modelo).id;
    voz = N.sanearVoiceId(opciones.voiceId);
    if (!voz) throw new ErrorVoz("Elige una voz de ElevenLabs (o pega su ID).");
    ajustes = N.ajustesEleven(opciones.perfil, opciones.ritmo);
    estimado = N.estimarVozEleven(base, modelo);
    log(`🎙️ ElevenLabs · ${opciones.nombreVoz || voz} · ${modelo} · perfil «${N.perfilElevenPorId(opciones.perfil).id}» · ritmo «${opciones.ritmo || N.RITMO_POR_DEFECTO}» (velocidad ${ajustes.velocidad})`);
    log(`   ${estimado.escenas} escenas · ${estimado.caracteres} caracteres ≈ ${estimado.creditos} créditos (≈ US$ ${estimado.usdApi.toFixed(3)} a tarifa de API)`);
  } else {
    modelo = opciones.modelo || N.MODELO_TTS;
    voz = N.vozEfectiva(opciones);
    instrucciones = N.construirInstrucciones(opciones);
    estimado = N.estimarVoz(base);
    log(`🎙️ Voz «${voz}» · estilo «${opciones.estilo || N.ESTILO_POR_DEFECTO}» · ritmo «${opciones.ritmo || N.RITMO_POR_DEFECTO}» · ${modelo}`);
    log(`   ${textosBase.length} escenas · ${estimado.caracteres} caracteres ≈ ${estimado.segundos.toFixed(0)} s de audio ≈ US$ ${estimado.usd.toFixed(3)}`);
  }

  // 1 · cada frase → mp3 (caché primero; de 3 en 3 para ir más rápido)
  const mp3s = new Array(textosBase.length);
  const pendientes = [];
  let desdeCache = 0, pedidas = 0, caracteresPedidos = 0;
  textosBase.forEach((e, i) => {
    const ctx = N.contextoFrases(textosBase, i);
    const clave_ = eleven ? N.claveCacheEleven(modelo, voz, ajustes, e.texto, ctx.previo, ctx.siguiente) : N.claveCacheVoz(modelo, voz, instrucciones, e.texto);
    const f = dirVoz("cache", `${clave_}.mp3`);
    if (!sinCache && existsSync(f) && readFileSync(f).length > 1000) { mp3s[i] = f; desdeCache++; }
    else pendientes.push({ i, f, e, ctx });
  });
  for (let k = 0; k < pendientes.length; k += 3) {
    await Promise.all(pendientes.slice(k, k + 3).map(async ({ i, f, e, ctx }) => {
      const mp3 = eleven ? await sintetizarFraseEleven({ texto: e.texto, voiceId: voz, modelo, clave, url, ajustes, previo: ctx.previo, siguiente: ctx.siguiente }) : await sintetizarFrase({ texto: e.texto, voz, instrucciones, modelo, clave, url });
      writeFileSync(f, mp3);
      mp3s[i] = f;
      pedidas++;
      caracteresPedidos += e.texto.length;
      log(`   ↓ escena ${e.n}: «${e.texto.slice(0, 48)}${e.texto.length > 48 ? "…" : ""}»`);
    }));
  }
  if (desdeCache) log(`   ♻️ ${desdeCache} frases salieron de la caché (sin costo)`);

  // 2 · el audio de cada frase, recortado
  const xs = mp3s.map((f) => recortarSilencio(decodificar(ffmpeg, f, tmp)));
  const durNat = xs.map((x) => x.length / SR);

  // 3 · «ajustar el video a la voz»: las escenas donde la voz natural no cabe se alargan (las demás no se tocan)
  let animFinal = anim;
  const alargadas = [];
  if (ajusteVideo) {
    const durs = textosBase.map((e, i) => {
      const necesario = Math.ceil((durNat[i] + N.ENTRADA_VOZ + N.COLA_ESCENA + 0.02) * 20) / 20;
      if (necesario > e.dur + 0.01) alargadas.push(e.n);
      return Math.max(e.dur, necesario);
    });
    animFinal = N.reajustarAnimacion(base, durs);
    const prob = N.validar(animFinal);
    if (prob.length) log(`⚠️ La animación alargada tiene avisos de validación: ${prob.slice(0, 3).join(" | ")}`);
    if (alargadas.length) {
      await guardarTiemposOriginales(base, animFinal);
      writeFileSync(archivoAnim, JSON.stringify(animFinal, null, 1));
      log(`↔️ Alargué ${alargadas.length} escena(s) (${alargadas.join(", ")}) para que la voz quepa sin acelerarla: el video dura ${animFinal.duracion.toFixed(1)} s (antes ${base.duracion.toFixed(1)} s). Hay que renderizar de nuevo.`);
    } else {
      // con esta voz no hace falta alargar nada: si un ajuste anterior había alargado el video, vuelve a sus tiempos originales
      if (base !== anim) { writeFileSync(archivoAnim, JSON.stringify(base, null, 1)); rmSync(COPIA_TIEMPOS(), { force: true }); }
      animFinal = base;
      log("   ✔ La voz natural cabe en todas las escenas: no hizo falta alargar nada.");
    }
  }

  // 4 · la pista de voz colocada en el tiempo de cada escena
  const textos = N.textosVoz(animFinal);
  const tempoMax = ajusteVideo ? 1 : eleven ? N.TEMPO_MAX_ELEVEN : N.TEMPO_MAX;
  const total = Math.max(...animFinal.escenas.map((e) => Number(e.fin ?? Number(e.inicio) + Number(e.dur))));
  const pista = new Float32Array(Math.ceil((total + 1) * SR));
  const escenas = [];
  for (let i = 0; i < textos.length; i++) {
    const e = textos[i];
    let x = xs[i];
    const aj = N.ajusteTempo(durNat[i], e.dur, tempoMax);
    if (aj.tempo > 1.001) x = acelerar(ffmpeg, x, aj.tempo, tmp);
    const ini = Math.round((e.inicio + N.ENTRADA_VOZ) * SR);
    const maxLen = Math.max(0, Math.round((e.inicio + e.dur - 0.05) * SR) - ini);
    const largo = Math.min(x.length, maxLen);
    const cortada = largo < x.length;
    for (let k = 0; k < largo; k++) {
      // fundido de 80 ms al cortar una frase que no cabe
      const f = cortada ? Math.min(1, (largo - k) / (0.08 * SR)) : 1;
      if (ini + k < pista.length) pista[ini + k] += x[k] * f;
    }
    escenas.push({ n: e.n, inicio: e.inicio, dur: e.dur, caracteres: e.texto.length, durVoz: +durNat[i].toFixed(2), tempo: +aj.tempo.toFixed(3), cabe: aj.cabe && !cortada, cortada, alargada: alargadas.includes(e.n) });
    const marca = cortada ? "✂️ no cabe: se cortó el final" : aj.tempo > 1.001 ? `⏩ ×${aj.tempo.toFixed(2)}` : alargadas.includes(e.n) ? "↔️ escena alargada" : "ok";
    log(`   ✔ escena ${e.n} · ${e.dur.toFixed(1)} s · voz ${durNat[i].toFixed(1)} s · ${marca}`);
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

  const frac = pedidas / Math.max(1, textos.length);
  const creditos = eleven ? Math.round(caracteresPedidos * N.modeloElevenPorId(modelo).credito) : 0;
  const manifiesto = {
    version: 1,
    creado: new Date().toISOString(),
    firma: N.firmaVoz(animFinal),
    motor: eleven ? "eleven" : "openai",
    modelo, voz: eleven ? (opciones.nombreVoz || voz) : voz, voiceId: eleven ? voz : undefined,
    estilo: eleven ? N.perfilElevenPorId(opciones.perfil).id : opciones.estilo || N.ESTILO_POR_DEFECTO,
    ritmo: opciones.ritmo || N.RITMO_POR_DEFECTO, extra: eleven ? "" : opciones.extra || "",
    ajuste: ajusteVideo ? "video" : "voz", alargadas, cambioTiempos: alargadas.length > 0,
    instrucciones,
    escenas,
    frasesPedidas: pedidas, frasesDeCache: desdeCache,
    estimado,
    creditos,
    costoUsd: eleven ? Math.round((caracteresPedidos / 1000) * N.modeloElevenPorId(modelo).usdPor1000Api * 10000) / 10000 : Math.round(frac * estimado.usd * 10000) / 10000,
    pista: "trabajo/anim/voz/voz-mezcla.wav",
    audio: existsSync(mp3) ? "/salida/voz/voz-completa.mp3" : null,
  };
  writeFileSync(ARCHIVO_ACTUAL(), JSON.stringify(manifiesto, null, 1));
  const noCaben = escenas.filter((e) => !e.cabe);
  log(`\n✅ Voz lista: ${escenas.length} escenas · ${pedidas} frases nuevas (${eleven ? `${creditos} créditos ≈ ` : "≈ "}US$ ${manifiesto.costoUsd.toFixed(3)})${noCaben.length ? ` · ⚠️ ${noCaben.length} escena(s) con la voz muy larga (${noCaben.map((e) => e.n).join(", ")}): acorta el texto, alarga la escena o usa «ajustar el video a la voz»` : ""}`);
  log(manifiesto.cambioTiempos ? "   Ahora pulsa «Renderizar con voz»: cambiaron los tiempos del video." : "   Ahora pulsa «Renderizar» (la voz se mezcla sola) o «Ponerla al video ya renderizado».");
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
  const eleven = opciones.motor === "eleven";
  const frase = N.textoParaVoz(texto) || "¿Sabías que Bogotá lleva setenta y siete años esperando un metro? En mil novecientos cuarenta y dos tenía cuatrocientos mil habitantes. Hoy, casi ocho millones.";
  mkdirSync(dirSalidaVoz(), { recursive: true });
  if (eleven) {
    const modelo = N.modeloElevenPorId(opciones.modelo).id, voiceId = N.sanearVoiceId(opciones.voiceId);
    if (!voiceId) throw new ErrorVoz("Elige una voz de ElevenLabs (o pega su ID).");
    const ajustes = N.ajustesEleven(opciones.perfil, opciones.ritmo);
    const id = N.claveCacheEleven(modelo, voiceId, ajustes, frase);
    const f = dirSalidaVoz(`prueba-${id}.mp3`);
    let creditos = 0;
    if (!existsSync(f) || readFileSync(f).length < 1000) {
      writeFileSync(f, await sintetizarFraseEleven({ texto: frase, voiceId, modelo, clave, url, ajustes }));
      creditos = Math.round(frase.length * N.modeloElevenPorId(modelo).credito);
    }
    return { url: `/salida/voz/prueba-${id}.mp3`, voz: opciones.nombreVoz || voiceId, modelo, creditos, costoUsd: Math.round((creditos ? (frase.length / 1000) * N.modeloElevenPorId(modelo).usdPor1000Api : 0) * 10000) / 10000, instrucciones: "" };
  }
  const modelo = opciones.modelo || N.MODELO_TTS;
  const voz = N.vozEfectiva(opciones);
  const instrucciones = N.construirInstrucciones(opciones);
  const id = N.claveCacheVoz(modelo, voz, instrucciones, frase);
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
  const eleven = valor("motor") === "eleven";
  const claveEleven = (process.env.ELEVENLABS_API_KEY ?? "").trim();
  if (eleven ? !claveEleven : !cfg.clave) {
    console.error(eleven ? "❌ No hay ELEVENLABS_API_KEY. Ponla en el archivo .env (panel → Ajustes) y vuelve a intentarlo." : "❌ No hay OPENAI_API_KEY. Ponla en el archivo .env (panel → Ajustes) y vuelve a intentarlo.");
    process.exit(1);
  }
  const opciones = { motor: eleven ? "eleven" : "openai", estilo: valor("estilo"), voz: valor("voz"), ritmo: valor("ritmo"), extra: valor("instrucciones"), modelo: valor("modelo"), voiceId: valor("voz-id"), perfil: valor("perfil"), nombreVoz: valor("nombre-voz"), ajuste: valor("ajuste") };
  const destino = eleven ? { clave: claveEleven, url: process.env.ELEVENLABS_BASE_URL } : { clave: cfg.clave, url: cfg.url };
  try {
    if (args.includes("--probar")) {
      const r = await probarVoz({ opciones, texto: valor("texto", ""), ...destino });
      console.log(`✅ Prueba de voz «${r.voz}»: ${r.url}`);
    } else {
      const anim = JSON.parse(readFileSync(join(RAIZ, "src", "data", "animacion.json"), "utf8"));
      await generarVozAnimacion({ anim, opciones, ...destino, sinCache: args.includes("--sin-cache") });
    }
  } catch (e) {
    console.error(`❌ ${e.message ?? e}`);
    process.exit(1);
  }
}
