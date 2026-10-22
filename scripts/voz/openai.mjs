/**
 * Proveedor PRODUCCIÓN · OpenAI Audio:
 *   1. audio.speech.create  (gpt-4o-mini-tts) con `instructions` = la entonación del perfil
 *   2. audio.transcriptions.create (whisper-1, verbose_json, timestamp_granularities=["word"]) sobre ese mismo mp3
 * El array `words` de Whisper se alinea después con el guion (comun.mjs → alinearConGuion).
 * Usa OPENAI_API_KEY y OPENAI_BASE_URL del .env (el mismo que el agente de guion/escenas).
 */
import { ErrorVoz, pedir } from "./comun.mjs";

export async function sintetizarOpenAI({ texto, voz = "ash", instrucciones = "", modeloTts, modeloStt, idioma = "es", clave, url, log = console.log }) {
  if (!clave) throw new ErrorVoz("Falta OPENAI_API_KEY en .env (modo producción con OpenAI). Para probar gratis usa --mode dev.");
  const base = (url || "https://api.openai.com/v1").replace(/\/+$/, "");
  const tts = modeloTts || "gpt-4o-mini-tts";
  const stt = modeloStt || "whisper-1";
  const auth = { Authorization: `Bearer ${clave}` };

  log(`   1/2 ${tts} · voz «${voz}»…`);
  const r1 = await pedir(`${base}/audio/speech`, { method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ model: tts, voice: voz, input: texto, ...(instrucciones ? { instructions: instrucciones } : {}), response_format: "mp3" }) }, { etiqueta: "OpenAI audio.speech" });
  const mp3 = Buffer.from(await r1.arrayBuffer());
  if (mp3.length < 2000) throw new ErrorVoz("OpenAI devolvió un audio vacío.");

  log(`   2/2 ${stt} · tiempos por palabra…`);
  const f = new FormData();
  f.append("file", new Blob([mp3], { type: "audio/mpeg" }), "voz.mp3");
  f.append("model", stt);
  f.append("response_format", "verbose_json");
  f.append("timestamp_granularities[]", "word");
  f.append("language", idioma);
  f.append("prompt", texto.slice(0, 700)); // sesga la ortografía hacia el guion (nombres, cifras, siglas)
  const r2 = await pedir(`${base}/audio/transcriptions`, { method: "POST", headers: auth, body: f }, { etiqueta: "OpenAI audio.transcriptions" });
  const j = await r2.json();
  const marcas = (j.words ?? []).map((w) => ({ word: String(w.word ?? "").trim(), start: Number(w.start), end: Number(w.end) })).filter((w) => w.word && Number.isFinite(w.start) && Number.isFinite(w.end));
  if (!marcas.length) throw new ErrorVoz("Whisper no devolvió palabras con tiempos (¿el modelo de transcripción admite timestamp_granularities=word?).");
  return { mp3, marcas, meta: { proveedor: "openai", modeloTts: tts, modeloStt: stt, voz, instrucciones } };
}
