/**
 * Proveedor PRODUCCIÓN · ElevenLabs (plan gratuito incluido): POST /v1/text-to-speech/{voz}/with-timestamps
 * devuelve el audio (base64) y el tiempo de CADA CARÁCTER; aquí se agrupan en palabras del guion.
 * Usa ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID y ELEVENLABS_MODEL del .env.
 */
import { ErrorVoz, palabrasDesdeCaracteres, pedir } from "./comun.mjs";

/** Voces "premade" multilingües (disponibles en el plan gratuito vía API). Cámbiala con ELEVENLABS_VOICE_ID. */
export const VOCES_ELEVEN = { masculina: "pNInz6obpgDQGcFmaJgB", femenina: "EXAVITQu4vr4xnSDxMaL" };

export async function sintetizarElevenLabs({ texto, voiceId, modelo, clave, url, estabilidad = 0.45, similitud = 0.8, estilo = 0.25, log = console.log }) {
  if (!clave) throw new ErrorVoz("Falta ELEVENLABS_API_KEY en .env (modo producción con ElevenLabs). Para probar gratis usa --mode dev.");
  const base = (url || "https://api.elevenlabs.io").replace(/\/+$/, "");
  const voz = voiceId || VOCES_ELEVEN.masculina;
  const model = modelo || "eleven_multilingual_v2";
  log(`   ElevenLabs · ${model} · voz ${voz}…`);
  const r = await pedir(
    `${base}/v1/text-to-speech/${encodeURIComponent(voz)}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": clave, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ text: texto, model_id: model, voice_settings: { stability: estabilidad, similarity_boost: similitud, style: estilo, use_speaker_boost: true } }),
    },
    { etiqueta: "ElevenLabs with-timestamps" },
  );
  const j = await r.json();
  if (!j.audio_base64) throw new ErrorVoz("ElevenLabs no devolvió audio.");
  const mp3 = Buffer.from(j.audio_base64, "base64");
  const al = j.alignment ?? j.normalized_alignment;
  if (!al?.characters?.length) throw new ErrorVoz("ElevenLabs no devolvió tiempos por carácter.");
  // Si el alineamiento coincide con el texto enviado, la correspondencia palabra→carácter es exacta.
  const directas = al.characters.join("") === texto ? palabrasDesdeCaracteres(texto, al.characters, al.character_start_times_seconds, al.character_end_times_seconds) : null;
  let marcas;
  if (directas) marcas = directas;
  else {
    // normalizado (cifras expandidas…): se agrupan los caracteres por espacios y se alinearán con el guion por similitud
    marcas = [];
    let acc = "";
    let ini = 0;
    al.characters.forEach((ch, i) => {
      if (/\s/.test(ch)) {
        if (acc) marcas.push({ word: acc, start: al.character_start_times_seconds[ini], end: al.character_end_times_seconds[i - 1] });
        acc = "";
      } else {
        if (!acc) ini = i;
        acc += ch;
      }
    });
    if (acc) marcas.push({ word: acc, start: al.character_start_times_seconds[ini], end: al.character_end_times_seconds[al.characters.length - 1] });
  }
  return { mp3, marcas, directo: Boolean(directas), meta: { proveedor: "elevenlabs", modelo: model, voz } };
}
