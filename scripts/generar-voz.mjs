#!/usr/bin/env node
/**
 * VideMed · Fase 2 — voz + tiempos por palabra (modo DESARROLLO gratis o PRODUCCIÓN de calidad estudio).
 *
 *   node scripts/generar-voz.mjs                              lee src/data/guion.txt (modo dev, voz del perfil activo)
 *   node scripts/generar-voz.mjs --mode=prod                  producción (OpenAI o ElevenLabs según tus claves)
 *   node scripts/generar-voz.mjs --mode=prod --proveedor elevenlabs
 *   node scripts/generar-voz.mjs --texto "Tu guion..."        (lo guarda en guion.txt)
 *   node scripts/generar-voz.mjs --perfil inmobiliario-co     (elige voz y entonación del nicho)
 *
 * MODOS
 *   dev   (por defecto, $0)  edge-tts, sin clave:  medicina-ar → es-AR-TomasNeural · inmobiliario-co → es-CO-GonzaloNeural
 *                            Atajos --voz: ar ar-f co co-f mx mx-f es es-f (o cualquier voz de edge-tts)
 *   prod  (calidad estudio)  --proveedor openai      gpt-4o-mini-tts (con `instructions` de entonación del perfil) + whisper-1
 *                                                    (verbose_json, timestamp_granularities=["word"]).  Necesita OPENAI_API_KEY
 *                            --proveedor elevenlabs  /with-timestamps (plan gratuito sirve).           Necesita ELEVENLABS_API_KEY
 *                            Sin --proveedor: VOZ_PROVEEDOR del .env, o OpenAI si hay clave, o ElevenLabs.
 *
 * OTRAS OPCIONES   --velocidad +10% (solo dev) · --tono · --volumen · --instrucciones "..." (prod/openai)
 *                  --voz-prod ash (voz de OpenAI) · --voz-id <id> (ElevenLabs) · --archivo mi-guion.txt
 *
 * GENERA  public/audios/voz.mp3 · public/audios/tiempos.vtt · src/data/timestamps.json [{word,start,end}] · src/data/meta.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cargarEnv } from "./ia/entorno.mjs";
import { cargarPerfil } from "./ia/perfil.mjs";
import { ErrorVoz, alinearConGuion, escribirSalidas, ruta } from "./voz/comun.mjs";
import { nombreVozEdge, sintetizarEdge } from "./voz/edge.mjs";
import { VOCES_ELEVEN, sintetizarElevenLabs } from "./voz/elevenlabs.mjs";
import { sintetizarOpenAI } from "./voz/openai.mjs";

function leerArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    if (eq > -1) out[a.slice(2, eq)] = a.slice(eq + 1);
    else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith("--")) out[a.slice(2)] = argv[++i];
    else out[a.slice(2)] = true;
  }
  return out;
}

const fallo = (msg) => {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
};

export async function generarVoz(args, { log = console.log } = {}) {
  cargarEnv();
  const env = process.env;

  // ---------- guion ----------
  const rutaGuion = ruta("src", "data", "guion.txt");
  let texto;
  if (typeof args.texto === "string") texto = args.texto;
  else if (typeof args.archivo === "string") {
    if (!existsSync(args.archivo)) throw new ErrorVoz(`No existe el archivo ${args.archivo}`);
    texto = readFileSync(args.archivo, "utf8");
  } else if (existsSync(rutaGuion)) texto = readFileSync(rutaGuion, "utf8");
  else throw new ErrorVoz('No hay guion. Pásalo con --texto "..." o créalo en src/data/guion.txt');
  texto = texto.replace(/\r/g, "").replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
  if (!texto) throw new ErrorVoz("El guion está vacío.");
  mkdirSync(dirname(rutaGuion), { recursive: true });
  writeFileSync(rutaGuion, texto + "\n", "utf8");

  // ---------- perfil (voz y entonación del nicho) ----------
  let perfil = null;
  try {
    const tema = existsSync(ruta("src", "data", "tema.json")) ? JSON.parse(readFileSync(ruta("src", "data", "tema.json"), "utf8")) : {};
    perfil = cargarPerfil(typeof args.perfil === "string" ? args.perfil : tema.perfil || "medicina-ar");
  } catch {
    /* sin perfil: valores de siempre */
  }
  const voces = perfil?.voces ?? {};

  const modo = String(args.mode ?? args.modo ?? env.VOZ_MODE ?? "dev").toLowerCase();
  if (!["dev", "prod"].includes(modo)) throw new ErrorVoz(`--mode debe ser dev o prod (recibí «${modo}»).`);

  let resultado;
  let proveedor;
  if (modo === "dev") {
    proveedor = "edge-tts";
    const voz = args.voz ?? voces.dev?.voz ?? perfil?.voz ?? "ar";
    const velocidad = String(args.velocidad ?? voces.dev?.velocidad ?? perfil?.velocidad ?? "+5%");
    log(`🎙️  Modo DEV · edge-tts (gratis) · voz ${nombreVozEdge(voz)} · velocidad ${velocidad}`);
    resultado = await sintetizarEdge({ texto, voz, velocidad, tono: String(args.tono ?? "+0Hz"), volumen: String(args.volumen ?? "+0%"), log });
  } else {
    const pedido = String(args.proveedor ?? env.VOZ_PROVEEDOR ?? "").toLowerCase();
    proveedor = pedido || (env.OPENAI_API_KEY ? "openai" : env.ELEVENLABS_API_KEY ? "elevenlabs" : "openai");
    if (!["openai", "elevenlabs"].includes(proveedor)) throw new ErrorVoz(`--proveedor debe ser openai o elevenlabs en modo prod (recibí «${proveedor}»).`);
    log(`🎙️  Modo PROD · ${proveedor === "openai" ? "OpenAI gpt-4o-mini-tts + whisper-1" : "ElevenLabs /with-timestamps"}`);
    if (proveedor === "openai") {
      const p = voces.prod?.openai ?? {};
      resultado = await sintetizarOpenAI({
        texto,
        voz: args["voz-prod"] ?? env.OPENAI_TTS_VOICE ?? p.voz ?? "ash",
        instrucciones: typeof args.instrucciones === "string" ? args.instrucciones : p.instrucciones ?? "",
        modeloTts: env.OPENAI_TTS_MODEL || undefined,
        modeloStt: env.OPENAI_STT_MODEL || undefined,
        clave: (env.OPENAI_API_KEY ?? "").trim(),
        url: env.OPENAI_BASE_URL,
        log,
      });
    } else {
      const p = voces.prod?.elevenlabs ?? {};
      resultado = await sintetizarElevenLabs({
        texto,
        voiceId: args["voz-id"] ?? env.ELEVENLABS_VOICE_ID ?? p.voiceId ?? (String(args.voz ?? "").endsWith("-f") ? VOCES_ELEVEN.femenina : VOCES_ELEVEN.masculina),
        modelo: env.ELEVENLABS_MODEL || p.modelo,
        clave: (env.ELEVENLABS_API_KEY ?? "").trim(),
        url: env.ELEVENLABS_BASE_URL,
        log,
      });
    }
  }

  // ---------- alinear con el guion y guardar ----------
  const tokens = texto.split(/\s+/).filter(Boolean);
  const { palabras, sinPareja, cobertura } = alinearConGuion(tokens, resultado.marcas);
  if (cobertura < 0.6) throw new ErrorVoz(`Solo pude emparejar el ${Math.round(cobertura * 100)} % de las palabras del guion con las del audio: la voz dijo algo muy distinto al guion. Repite la síntesis.`);
  const meta = escribirSalidas({ mp3: resultado.mp3, palabras, texto, meta: { modo, ...resultado.meta, velocidad: resultado.meta.velocidad ?? null, coberturaAlineacion: Math.round(cobertura * 1000) / 1000 } });

  log(`\n✅ ${palabras.length} palabras · audio ≈ ${meta.duracionAudio}s · última palabra termina en ${meta.ultimaPalabraFin}s  (${proveedor})`);
  log("   → public/audios/voz.mp3\n   → public/audios/tiempos.vtt\n   → src/data/timestamps.json");
  if (sinPareja.length) console.warn(`⚠️  Palabras sin pareja exacta en el audio (tiempo estimado): ${sinPareja.slice(0, 12).join(", ")}${sinPareja.length > 12 ? "…" : ""}`);

  // el rango de palabras depende del perfil (medicina 85–110; inmobiliaria 70–100…)
  const rango = Array.isArray(perfil?.palabras) ? perfil.palabras : [85, 110];
  const maxSeg = perfil?.duracion ? Math.round(perfil.duracion * 1.3) : 45;
  if (palabras.length < rango[0] - 5 || palabras.length > rango[1] + 5) console.warn(`⚠️  El guion tiene ${palabras.length} palabras (objetivo ${rango[0]}–${rango[1]}).`);
  if (meta.ultimaPalabraFin > maxSeg) console.warn(`⚠️  Dura ${meta.ultimaPalabraFin}s: demasiado largo para este tipo de video (máx. ≈ ${maxSeg} s).`);
  return meta;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    await generarVoz(leerArgs(process.argv.slice(2)));
  } catch (e) {
    fallo(e instanceof ErrorVoz ? e.message : `Error inesperado en la voz: ${e?.stack ?? e}`);
  }
}
