/**
 * Deja un proyecto como ACTIVO (lo que se renderiza): plan, tema, marca, brief y medios.
 * Lo comparten el agente de IA, la plantilla sin IA y el asistente de terminal.
 */
import { spawnSync } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { importarMedios, leerMedios, limpiarMedios } from "../medios.mjs";
import { DIR_PROYECTOS, construirMarca, escribirMarca } from "./perfil.mjs";
import { RAIZ } from "./puente.mjs";

const dato = (n) => join(RAIZ, "src", "data", n);

/** Carpeta de un proyecto de usuario: proyectos/<id>/ */
export const dirProyecto = (id) => join(DIR_PROYECTOS, id);

/**
 * Importa las fotos/logo/música del brief a public/media y devuelve la lista de medios.
 * Carpeta: brief.medios (relativa a la raíz del proyecto) o proyectos/<id>/media.
 */
export function prepararMedios(brief, { dir = null, log = () => {} } = {}) {
  const candidata = brief.medios ? resolve(RAIZ, brief.medios) : dir ? join(dir, "media") : null;
  if (!candidata || !existsSync(candidata)) {
    limpiarMedios();
    return [];
  }
  const fotos = Array.isArray(brief.fotos) ? brief.fotos : [];
  const descripciones = Object.fromEntries(fotos.filter((f) => f?.archivo && f?.descripcion).map((f) => [f.archivo, f.descripcion]));
  const orden = fotos.map((f) => f?.archivo).filter(Boolean);
  const lista = importarMedios({ origen: candidata, descripciones, orden, log });
  log(`   🖼  ${lista.filter((m) => m.tipo === "foto").length} foto(s)${lista.some((m) => m.tipo === "logo") ? ", logo" : ""}${lista.some((m) => m.tipo === "musica") ? ", música" : ""} importadas`);
  return lista;
}

export function activarProyecto({ plan, proyecto, perfil, brief = null, medios = null, silencioso = true }) {
  writeFileSync(dato("plan.json"), JSON.stringify(plan, null, 2) + "\n");
  writeFileSync(dato("tema.json"), JSON.stringify({ id: proyecto.id, etiqueta: proyecto.etiqueta, titulo: proyecto.titulo, perfil: perfil.id }, null, 2) + "\n");
  if (brief) writeFileSync(dato("brief.json"), JSON.stringify(brief, null, 2) + "\n");
  else rmSync(dato("brief.json"), { force: true });
  escribirMarca(construirMarca(perfil, brief ?? {}, medios ?? leerMedios()));
  const r = spawnSync(process.execPath, [join(RAIZ, "scripts", "activar-tema.mjs"), "dinamico"], { cwd: RAIZ, stdio: silencioso ? "ignore" : "inherit" });
  if (r.status !== 0) throw new Error("No pude activar el tema dinámico (scripts/activar-tema.mjs).");
}

/** Guarda el proyecto activo en trabajo/archivo antes de pisarlo (cortesía: nunca se pierde un trabajo anterior). */
export function respaldarProyectoActivo() {
  try {
    if (existsSync(dato("tema.json")) && existsSync(dato("guion.txt"))) spawnSync(process.execPath, [join(RAIZ, "scripts", "proyecto.mjs"), "guardar"], { cwd: RAIZ, stdio: "ignore" });
  } catch {
    /* es solo una cortesía */
  }
}

/**
 * Escribe el guion y genera la voz gratuita (edge-tts) con tiempos por palabra.
 * Devuelve true si todo salió bien (y deja src/data/timestamps.json listo).
 */
export function sintetizarVoz({ guion, voz, velocidad, tono, silencioso = false }) {
  writeFileSync(dato("guion.txt"), guion.trim() + "\n");
  const extra = [];
  if (voz) extra.push("--voz", String(voz));
  if (velocidad) extra.push("--velocidad", String(velocidad));
  if (tono) extra.push("--tono", String(tono));
  const r = spawnSync(process.execPath, [join(RAIZ, "scripts", "generar-voz.mjs"), ...extra], { cwd: RAIZ, stdio: silencioso ? "ignore" : "inherit" });
  return r.status === 0;
}
