#!/usr/bin/env node
/**
 * VOZ DE CAPCUT EN 3 PASOS (un solo comando). No cambia el motor: usa el alineador de «Mi voz» (voz-externa.mjs) y le añade lo que faltaba:
 * el texto ya listo para pegar, un informe claro de si salió bien y una vía a prueba de errores (un audio por escena).
 *
 *   npm run capcut                                    PASO 1 · prepara el texto para pegar en CapCut (trabajo/salida/guion-capcut.txt) y te dice cuánto debería durar tu voz
 *   npm run capcut -- --audio=mi-voz.mp3              PASO 2 · alinea el video a tu voz (un solo audio con todo el texto) y te da un informe: ✅ / ⚠️ por escena
 *   npm run capcut -- --escenas=carpeta               PASO 2 (alternativa 100 % exacta) · una carpeta con un audio por escena (1.mp3, 2.mp3…): no hay que detectar pausas
 *   npm run capcut -- --deshacer                      vuelve a los tiempos originales y quita la voz
 *   [--carpeta=videos/AAAA-MM-DD-slug]                además guarda el texto y el informe en la carpeta del video
 *
 * PASO 3 · renderiza: `npm run anim:render` (la voz se mezcla sola, normalizada a −14 LUFS).
 * No hay nada que «calibrar»: el VIDEO se ajusta a tu voz, no al revés. Lo único que puedes tocar es la velocidad en CapCut para que suene natural.
 */
import "../_tmp.mjs";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { isAbsolute, join, resolve, extname, basename } from "node:path";
import { decodificar, escribirWavEstereo, SR } from "../audio.mjs";
import { buscarFfmpeg } from "../medios.mjs";
import { cargarNucleoAnim, RAIZ } from "./nucleo.mjs";
import { alinearConVozExterna, analizarVoz, quitarVozExterna } from "./voz-externa.mjs";
import { dirVoz } from "./voz.mjs";

const ANIM = () => join(RAIZ, "src", "data", "animacion.json");
/** palabras por segundo de una voz natural en español (ritmo cómodo) y los límites que dan aviso */
export const RITMO = { comodoMin: 2.0, comodoMax: 3.3, avisoMin: 1.5, avisoMax: 4.0 };

const contar = (t) => t.trim().split(/\s+/).filter(Boolean).length;
const seg = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/**
 * Texto para pegar en CapCut: cada escena en su párrafo (línea en blanco entre escenas) y terminada en punto, para que la voz haga una pausa entre una y otra.
 * Devuelve también la versión «escena por escena» con marcas, la cantidad de palabras y cuánto debería durar la voz.
 */
export function prepararTextoCapcut(textos) {
  const limpios = textos.map((t) => t.texto.trim().replace(/\s+/g, " ")).map((t) => (/[.!?…]$/.test(t) ? t : `${t}.`));
  const palabras = limpios.reduce((a, t) => a + contar(t), 0);
  return {
    texto: limpios.join("\n\n") + "\n",
    porEscena: limpios.map((t, i) => `— ESCENA ${i + 1} —\n${t}`).join("\n\n") + "\n",
    palabras,
    escenas: limpios.length,
    voz: { min: Math.round(palabras / RITMO.comodoMax), max: Math.round(palabras / RITMO.comodoMin) },
  };
}

/**
 * Informe de la alineación: por escena, palabras, duración y palabras por segundo. Un ritmo fuera de lo natural suele significar que el corte cayó en la pausa equivocada.
 * Confianza: ALTA (todo natural y cortes por pausas reales), MEDIA (alguna escena rara) o BAJA (no había pausas suficientes: tiempos repartidos por el largo del texto).
 */
export function informeAlineacion(textos, durs, { aproximado = false, avisos = [] } = {}) {
  const filas = textos.map((t, i) => {
    const p = contar(t.texto), d = durs[i] ?? 0, pps = d > 0 ? p / d : 0;
    const estado = pps < RITMO.avisoMin ? "lenta" : pps > RITMO.avisoMax ? "apretada" : pps < RITMO.comodoMin || pps > RITMO.comodoMax ? "aceptable" : "natural";
    return { n: i + 1, palabras: p, dur: d, pps: Math.round(pps * 10) / 10, estado, texto: t.texto };
  });
  const raras = filas.filter((f) => f.estado === "lenta" || f.estado === "apretada");
  const confianza = aproximado ? "BAJA" : raras.length ? "MEDIA" : "ALTA";
  const consejos = [];
  if (aproximado) consejos.push("No encontré pausas claras entre escenas. Vuelve a generar la voz pegando el texto con una línea en blanco entre escenas, o usa --escenas=carpeta (un audio por escena).");
  raras.forEach((f) => consejos.push(`Escena ${f.n}: ${f.estado === "lenta" ? "sale muy lenta" : "sale muy apretada"} (${f.pps} palabras/s). Puede que el corte quedara en otra pausa: revisa ese tramo o pasa las duraciones con --duraciones=…`));
  avisos.forEach((a) => consejos.push(a));
  return { filas, confianza, consejos };
}

function imprimirInforme(inf, log = console.log) {
  log("");
  log(`📋 Informe de la voz · confianza ${inf.confianza === "ALTA" ? "✅ ALTA" : inf.confianza === "MEDIA" ? "⚠️ MEDIA" : "❌ BAJA"}`);
  inf.filas.forEach((f) => log(`   ${f.estado === "natural" ? "✅" : f.estado === "aceptable" ? "🟡" : "⚠️"} escena ${f.n}: ${f.dur.toFixed(1)} s · ${f.palabras} palabras · ${f.pps} pal/s (${f.estado}) — «${f.texto.slice(0, 46)}${f.texto.length > 46 ? "…" : ""}»`));
  inf.consejos.forEach((c) => log(`   💡 ${c}`));
  if (inf.confianza === "ALTA") log("   ✅ Todo encaja. Sigue con el PASO 3: npm run anim:render");
}

const naturales = (a, b) => a.localeCompare(b, "es", { numeric: true, sensitivity: "base" });
const AUDIOS = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".opus"];

/** Une un audio por escena en uno solo con las duraciones EXACTAS (sin detectar pausas): cada escena dura lo que dura su locución más un poco de aire. */
export async function unirAudiosPorEscena({ carpeta, esperadas, ffmpeg }) {
  const archivos = readdirSync(carpeta).filter((f) => AUDIOS.includes(extname(f).toLowerCase())).sort(naturales);
  if (archivos.length !== esperadas) throw new Error(`En la carpeta hay ${archivos.length} audios y el video tiene ${esperadas} escenas con locución. Deben ser iguales (1.mp3, 2.mp3…, en orden).`);
  const tmp = dirVoz("tmp-capcut");
  mkdirSync(tmp, { recursive: true });
  const trozos = [], durs = [];
  try {
    archivos.forEach((f, i) => {
      const x = decodificar(ffmpeg, join(carpeta, f), tmp);
      const a = analizarVoz(x);
      const desde = Math.max(0, Math.round((a.desde - 0.03) * SR)), hasta = Math.min(x.length, Math.round((a.hasta + 0.03) * SR));
      const habla = x.slice(desde, hasta);
      if (habla.length < 0.3 * SR) throw new Error(`El audio «${f}» casi no tiene voz (dura ${(habla.length / SR).toFixed(2)} s).`);
      const lead = Math.round((i === 0 ? 0.25 : 0.12) * SR), cola = Math.round((i === archivos.length - 1 ? 0.45 : 0.3) * SR);
      const t = new Float32Array(lead + habla.length + cola);
      t.set(habla, lead);
      trozos.push(t); durs.push(Math.round((t.length / SR) * 100) / 100);
    });
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  const total = trozos.reduce((a, t) => a + t.length, 0);
  const y = new Float32Array(total);
  let o = 0;
  for (const t of trozos) { y.set(t, o); o += t.length; }
  const salida = dirVoz("capcut-unido.wav");
  mkdirSync(dirVoz(), { recursive: true });
  escribirWavEstereo(salida, y);
  return { archivo: salida, durs, nombres: archivos };
}

async function main() {
  const args = process.argv.slice(2);
  const valor = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
  const abs = (p) => (isAbsolute(p) ? p : resolve(RAIZ, p));
  const carpetaVideo = valor("carpeta") ? abs(valor("carpeta")) : null;
  if (args.includes("--deshacer")) { await quitarVozExterna(); return; }
  const N = await cargarNucleoAnim();
  if (!existsSync(ANIM())) throw new Error("Primero carga o genera la animación del video (src/data/animacion.json).");
  const anim = JSON.parse(readFileSync(ANIM(), "utf8"));
  const textos = N.textosVoz(anim);
  if (!textos.length) throw new Error("Este video no trae texto de locución.");
  const audio = valor("audio"), escenas = valor("escenas");

  if (!audio && !escenas) {
    const p = prepararTextoCapcut(textos);
    const out = join(RAIZ, "trabajo", "salida");
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, "guion-capcut.txt"), p.texto);
    writeFileSync(join(out, "guion-capcut-por-escena.txt"), p.porEscena);
    if (carpetaVideo && existsSync(carpetaVideo)) { writeFileSync(join(carpetaVideo, "guion-capcut.txt"), p.texto); writeFileSync(join(carpetaVideo, "guion-capcut-por-escena.txt"), p.porEscena); }
    console.log("🎙️ VOZ DE CAPCUT EN 3 PASOS");
    console.log("");
    console.log(`PASO 1 · En CapCut pega el texto y genera la voz (todo seguido, UN solo audio):`);
    console.log(`   📄 ${join("trabajo", "salida", "guion-capcut.txt")}   (${p.escenas} escenas · ${p.palabras} palabras; cada escena en su párrafo)`);
    console.log("   • Texto → «Texto a voz» (los nombres de los menús cambian según tu versión), elige la voz que te guste y genera.");
    console.log(`   • Cómo debe sonar: natural, sin prisa. Con este texto tu voz dura ≈ ${seg(p.voz.min)}–${seg(p.voz.max)} (${p.voz.min}–${p.voz.max} s). Si te queda muy distinta, solo cambia la VELOCIDAD en CapCut.`);
    console.log("   • Exporta SOLO el audio (mp3 o m4a) y guárdalo, por ejemplo, como mi-voz.mp3 en la carpeta del proyecto.");
    console.log("");
    console.log("PASO 2 · Alinea el video a tu voz (el VIDEO se ajusta a ella, no al revés):");
    console.log("   npm run capcut -- --audio=mi-voz.mp3");
    console.log("   ¿Un audio por escena? Usa  npm run capcut -- --escenas=carpeta  (guion-capcut-por-escena.txt trae el texto separado): es 100 % exacto.");
    console.log("");
    console.log("PASO 3 · Renderiza:  npm run anim:render   (la voz se mezcla sola, a −14 LUFS)");
    return;
  }

  const { ffmpeg } = buscarFfmpeg();
  let r;
  if (escenas) {
    const u = await unirAudiosPorEscena({ carpeta: abs(escenas), esperadas: textos.length, ffmpeg });
    console.log(`🔗 Uní ${u.nombres.length} audios en orden: ${u.nombres.join(", ")}`);
    r = await alinearConVozExterna({ audio: u.archivo, nombre: "voz por escenas (CapCut)", duraciones: u.durs });
  } else {
    r = await alinearConVozExterna({ audio: abs(audio), duraciones: valor("duraciones")?.split(",").map((s) => Number(s.trim().replace(",", "."))), cola: Number(valor("cola") ?? "0.5") });
  }
  const inf = informeAlineacion(textos, r.durs, { aproximado: r.aproximado, avisos: r.avisos });
  imprimirInforme(inf);
  if (carpetaVideo && existsSync(carpetaVideo)) writeFileSync(join(carpetaVideo, "informe-voz.json"), JSON.stringify({ creado: new Date().toISOString(), voz: audio ?? escenas, duracionVoz: r.duracionVoz, ...inf }, null, 1));
}

if (process.argv[1]?.endsWith("anim/capcut.mjs")) {
  main().catch((e) => { console.error(`❌ ${e.message ?? e}`); process.exit(1); });
}
