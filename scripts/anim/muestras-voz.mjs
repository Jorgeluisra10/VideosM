#!/usr/bin/env node
/**
 * MUESTRAS DE VOZ: genera 3 frases reales de Imnoba con las voces coral, nova, shimmer y sage (con las instrucciones de voz.config.json y el guion ya
 * preparado) para que las escuches seguidas y elijas. Deja los mp3 y una página con reproductores en trabajo/salida/voz/muestras/.
 *
 *   node scripts/anim/muestras-voz.mjs [--voces=coral,nova,shimmer,sage]
 *
 * Necesita OPENAI_API_KEY (.env / panel → Ajustes). Cuesta ≈ US$ 0,03 en total (≈ 2.000 caracteres) y se guarda en caché: repetirlo no cuesta nada.
 */
import "../_tmp.mjs";
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cargarEnv, configuracion } from "../ia/entorno.mjs";
import { cargarNucleoAnim, RAIZ } from "./nucleo.mjs";
import { generarVariantesLab } from "./voz.mjs";
import { dirCacheAudio, leerConfigVoz } from "./voz-config.mjs";

export const FRASES_IMNOBA = [
  ["gancho", "¿Tienes una propiedad o un vehículo para vender? Publícalo gratis en imnoba.com y llega a personas que de verdad lo están buscando. Solo te toma tres minutos."],
  ["precio", "Esta propiedad en Tunja cuesta $950.000.000, tiene 85 m² y está a cinco minutos de la UPTC. ¿Cuánto crees que vale el metro cuadrado? Te lo cuento al final."],
  ["estafas", "Ojo con esto: si te piden plata antes de que veas la propiedad, desconfía. En el 37 % de las estafas el anuncio parecía perfecto. Verifica siempre con un agente registrado."],
];

if (process.argv[1]?.endsWith("anim/muestras-voz.mjs")) {
  cargarEnv();
  const args = process.argv.slice(2);
  const cfg = configuracion();
  if (!cfg.clave) { console.error("❌ No hay OPENAI_API_KEY. Ponla en el archivo .env (panel → Ajustes) y vuelve a intentarlo."); process.exit(1); }
  try {
    const N = await cargarNucleoAnim();
    const conf = await leerConfigVoz();
    const voces = (args.find((a) => a.startsWith("--voces="))?.slice(8) ?? "coral,nova,shimmer,sage").split(",").map((v) => N.vozPorId(v.trim())?.id).filter(Boolean).slice(0, 6);
    const dir = join(RAIZ, "trabajo", "salida", "voz", "muestras");
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const bloques = [];
    for (const [nombre, texto] of FRASES_IMNOBA) {
      console.log(`🎙️ «${nombre}»: ${voces.join(", ")}…`);
      const r = await generarVariantesLab({ texto, variantes: voces.map((voz) => ({ voz, instrucciones: conf.instrucciones })), preparar: true, clave: cfg.clave, url: cfg.url });
      const filas = r.versiones.map((v) => { const f = `${nombre}-${v.voz}.mp3`; copyFileSync(join(dirCacheAudio(), v.url.split("/").pop()), join(dir, f)); return `<tr><td><strong>${v.voz}</strong></td><td><audio controls preload="none" src="${f}"></audio></td></tr>`; });
      bloques.push(`<h2>${nombre}</h2><p>${r.textoHablado.replace(/</g, "&lt;")}</p><table>${filas.join("")}</table>`);
    }
    writeFileSync(join(dir, "muestras.html"), `<!doctype html><meta charset="utf-8"><title>Muestras de voz · Imnoba</title><style>body{font:16px Inter,system-ui,sans-serif;max-width:760px;margin:30px auto;padding:0 16px;color:#02224e}h1,h2{color:#02224e}table{border-collapse:collapse}td{padding:6px 12px}</style><h1>Muestras de voz</h1><p>Instrucciones: ${conf.instrucciones.replace(/</g, "&lt;").slice(0, 160)}…</p>${bloques.join("")}`);
    console.log(`\n✅ Listo: abre ${join(dir, "muestras.html")} y escucha las ${voces.length} voces con las 3 frases.`);
  } catch (e) {
    console.error(`❌ ${e.message ?? e}`);
    process.exit(1);
  }
}
