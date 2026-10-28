#!/usr/bin/env node
/**
 * Crea la animación activa (src/data/animacion.json) SIN IA y SIN costo a partir de una IDEA y de la RESPUESTA que escribe Claude Code
 * (el mismo JSON que devolvería la IA del Estudio: {"titulo","scenes":[{t,voz,dur,h,w,…}]}). Pasa por el mismo saneado y ensamblado que usa el panel.
 *
 *   node scripts/anim/desde-respuesta.mjs --idea=videos/2026-10-30-estafas/idea.txt --respuesta=videos/2026-10-30-estafas/respuesta-ia.json [--paleta=imnoba] [--sin-sfx]
 *
 * Deja también trabajo/salida/guion-locucion.txt (lo que dice cada escena). Después: voz (node scripts/anim/voz.mjs), render (npm run anim:render) y revisión
 * (node scripts/anim/revisar-video.mjs). Si ya había otra animación activa, la reemplaza: carga primero el ejemplo con `node scripts/anim/ejemplo.mjs` cuando termines.
 */
import "../_tmp.mjs";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { cargarNucleoAnim, RAIZ } from "./nucleo.mjs";

/** Devuelve { anim, correcciones, locucion, avisos }; lanza un Error con un mensaje claro si algo no es válido. */
export async function crearDesdeRespuesta({ idea, respuesta, paleta, sfx = true }) {
  const N = await cargarNucleoAnim();
  const p = paleta ?? N.paletaDeTema(undefined);
  if (!N.PALETAS[p]) throw new Error(`Paleta desconocida «${p}». Usa una de: ${Object.keys(N.PALETAS).join(", ")}.`);
  const i = N.parsearIdea(idea, { paleta: p });
  if (i.errores.length) throw new Error(`La idea tiene problemas:\n· ${i.errores.join("\n· ")}`);
  if (!respuesta || !Array.isArray(respuesta.scenes) || !respuesta.scenes.length) throw new Error("La respuesta debe ser un JSON con «titulo» y una lista «scenes» (mira ejemplos/animacion-viral/respuesta-ia.json).");
  const r = N.ensamblarViral(respuesta, { modo: "idea", paleta: p, sfx });
  const avisos = N.validar(r.anim);
  return { anim: r.anim, correcciones: r.correcciones, locucion: r.locucion, avisos, escenasPedidas: i.escenasObjetivo };
}

if (process.argv[1]?.endsWith("anim/desde-respuesta.mjs")) {
  const args = process.argv.slice(2);
  const valor = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
  const abs = (f) => (isAbsolute(f) ? f : resolve(RAIZ, f));
  try {
    if (!valor("idea") || !valor("respuesta")) throw new Error("Faltan --idea=archivo.txt y --respuesta=archivo.json");
    for (const f of [valor("idea"), valor("respuesta")]) if (!existsSync(abs(f))) throw new Error(`No encuentro ${f}`);
    let respuesta;
    try { respuesta = JSON.parse(readFileSync(abs(valor("respuesta")), "utf8")); } catch (e) { throw new Error(`La respuesta no es un JSON válido: ${e.message}`); }
    const r = await crearDesdeRespuesta({ idea: readFileSync(abs(valor("idea")), "utf8"), respuesta, paleta: valor("paleta"), sfx: !args.includes("--sin-sfx") });
    mkdirSync(join(RAIZ, "src", "data"), { recursive: true });
    mkdirSync(join(RAIZ, "trabajo", "salida"), { recursive: true });
    writeFileSync(join(RAIZ, "src", "data", "animacion.json"), JSON.stringify(r.anim, null, 1));
    writeFileSync(join(RAIZ, "trabajo", "salida", "guion-locucion.txt"), r.locucion);
    console.log(`✅ «${r.anim.titulo}» · ${r.anim.escenas.length} escenas · ${r.anim.duracion.toFixed(1)} s · paleta ${r.anim.paleta} · SFX ${r.anim.sfx ? "sí" : "no"}`);
    r.anim.escenas.forEach((e) => console.log(`   ${String(e.n).padStart(2)} · ${e.inicio.toFixed(1)}–${e.fin.toFixed(1)} s · ${e.t ?? e.modo} · ${(e.voz ?? "").slice(0, 60)}`));
    r.correcciones.forEach((c) => console.log(`⚠️ corregido: ${c}`));
    r.avisos.forEach((a) => console.log(`⚠️ ${a}`));
  } catch (e) {
    console.error(`❌ ${e.message ?? e}`);
    process.exit(1);
  }
}
