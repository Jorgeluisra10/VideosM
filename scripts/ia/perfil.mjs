/**
 * Perfiles de video (medicina, inmobiliaria, genérico…) y briefs.
 *
 *  perfiles/<id>/perfil.json   qué elementos usa, voz, paleta, campos del formulario…
 *  perfiles/<id>/*.md          textos de los prompts de ese tipo de video (guion, revisor, plan, critica, post)
 *  perfiles/paletas.json       paletas de color de marca
 *
 * Un BRIEF (proyectos/<id>/brief.json) es lo que cuenta de qué trata UN video concreto.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ } from "./puente.mjs";

export const DIR_PERFILES = join(RAIZ, "perfiles");
export const DIR_PROYECTOS = join(RAIZ, "proyectos");
const MD = ["guion", "revisor", "plan", "critica", "post"];

export function listarPerfiles() {
  if (!existsSync(DIR_PERFILES)) return [];
  return readdirSync(DIR_PERFILES, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(DIR_PERFILES, d.name, "perfil.json")))
    .map((d) => JSON.parse(readFileSync(join(DIR_PERFILES, d.name, "perfil.json"), "utf8")));
}

export function cargarPerfil(id = "medicina") {
  const dir = join(DIR_PERFILES, id);
  if (!existsSync(join(dir, "perfil.json"))) {
    throw new Error(`No existe el perfil "${id}". Disponibles: ${listarPerfiles().map((p) => p.id).join(", ") || "(ninguno)"}`);
  }
  const perfil = JSON.parse(readFileSync(join(dir, "perfil.json"), "utf8"));
  perfil.prompts = {};
  for (const n of MD) {
    const ruta = join(dir, `${n}.md`);
    perfil.prompts[n] = existsSync(ruta) ? readFileSync(ruta, "utf8").trim() : "";
  }
  perfil.dir = dir;
  return perfil;
}

export const paletas = () => JSON.parse(readFileSync(join(DIR_PERFILES, "paletas.json"), "utf8"));

/** Perfil del proyecto activo (src/data/tema.json → "perfil"); medicina si no consta (proyectos antiguos). */
export function perfilActivo() {
  try {
    const t = JSON.parse(readFileSync(join(RAIZ, "src", "data", "tema.json"), "utf8"));
    return cargarPerfil(t.perfil || "medicina");
  } catch {
    return cargarPerfil("medicina");
  }
}

/** Palabras objetivo del guion: el perfil fija el rango para ~35 s; otra duración lo escala (≈ 2,6 palabras por segundo). */
export function objetivoPalabras(perfil, brief = {}) {
  const base = perfil.duracion ?? 35;
  const seg = Math.min(90, Math.max(15, Number(brief.duracion) || base));
  const [a, b] = perfil.palabras ?? [85, 110];
  const k = seg / base;
  return { min: Math.round(a * k), max: Math.round(b * k), segundos: seg };
}

/** Sustituye {{CLAVE}} en un texto. */
export const rellenar = (texto, vars) => String(texto).replace(/\{\{(\w+)\}\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));

export function varsDePrompt(perfil, brief) {
  const o = objetivoPalabras(perfil, brief);
  return { PALABRAS_MIN: o.min, PALABRAS_MAX: o.max, SEGUNDOS: o.segundos };
}

// ---------------------------------------------------------------------------
// Brief
// ---------------------------------------------------------------------------
const vacio = (v) => v === undefined || v === null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length);

export function leerBrief(ruta) {
  const b = JSON.parse(readFileSync(ruta, "utf8"));
  b.datos ??= {};
  b.marca ??= {};
  return b;
}

/** Tema del video: el escrito por el usuario o uno deducido de los datos. */
export function temaDe(brief, perfil) {
  if (!vacio(brief.tema)) return String(brief.tema).trim();
  const d = brief.datos ?? {};
  if (perfil.id === "inmobiliaria" && (d.tipo || d.ubicacion)) return `${d.operacion ?? "Venta"} de ${String(d.tipo ?? "propiedad").toLowerCase()}${d.ubicacion ? ` en ${d.ubicacion}` : ""}`;
  return brief.titulo ? String(brief.titulo) : "";
}

export function validarBrief(brief, perfil) {
  const errores = [];
  const avisos = [];
  if (!temaDe(brief, perfil)) errores.push("Falta el tema: cuenta de qué trata el video (campo «tema»).");
  for (const c of perfil.campos ?? []) {
    if (c.requerido && vacio(brief.datos?.[c.clave])) errores.push(`Falta el dato «${c.etiqueta}» (datos.${c.clave}).`);
  }
  if (perfil.id === "inmobiliaria") {
    if (vacio(brief.datos?.precio)) avisos.push("No hay precio: el video dirá «consultá el precio».");
    if (vacio(brief.datos?.telefono) && vacio(brief.datos?.whatsapp) && vacio(brief.datos?.web) && vacio(brief.marca?.telefono)) avisos.push("No hay ningún dato de contacto: el cierre no podrá decir cómo comunicarse.");
  }
  return { ok: errores.length === 0, errores, avisos };
}

/** Texto legible del brief para los prompts (etiquetas en claro + JSON exacto). */
export function textoBrief(brief, perfil) {
  const l = [];
  l.push(`Perfil: ${perfil.nombre}`);
  l.push(`Tema: ${temaDe(brief, perfil)}`);
  if (brief.titulo) l.push(`Título interno: ${brief.titulo}`);
  l.push(`Duración objetivo: ${objetivoPalabras(perfil, brief).segundos} s`);
  l.push(`Tono: ${brief.tono ?? perfil.tonos?.[0] ?? "cercano"}`);
  l.push(`Voz: ${brief.voz ?? perfil.voz ?? "ar"}`);
  if (brief.marca?.nombre) l.push(`Marca / empresa: ${brief.marca.nombre}`);
  for (const c of perfil.campos ?? []) {
    const v = brief.datos?.[c.clave];
    if (vacio(v)) continue;
    l.push(`${c.etiqueta}: ${Array.isArray(v) ? v.join(", ") : v}`);
  }
  if (brief.notas) l.push(`Indicaciones extra del cliente: ${brief.notas}`);
  const limpio = { ...brief };
  delete limpio.medios;
  return `${l.join("\n")}\n\nBRIEF EXACTO (JSON):\n${JSON.stringify(limpio)}`;
}

/** Lista de medios para los prompts. */
export function textoMedios(medios) {
  if (!medios?.length) return "(no hay fotos ni logo: compón solo con piezas gráficas)";
  return medios
    .filter((m) => m.tipo !== "musica")
    .map((m) => `- ${m.archivo} · ${m.tipo}${m.ancho ? ` · ${m.ancho}×${m.alto}${m.ancho >= m.alto ? " (horizontal)" : " (vertical)"}` : ""}${m.descripcion ? ` · «${m.descripcion}»` : ""}`)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Marca
// ---------------------------------------------------------------------------
const HEX = /^#[0-9a-f]{6}$/i;
export const FONDO_DEFECTO = { rejilla: 0.05, particulas: true };

export function construirMarca(perfil, brief = {}, medios = []) {
  const todas = paletas();
  const m = brief.marca ?? {};
  const colores = { ...todas.medico.colores, ...(todas[m.paleta ?? perfil.paleta ?? "medico"]?.colores ?? {}) };
  if (HEX.test(m.colorPrincipal ?? "")) colores.amarillo = m.colorPrincipal;
  if (HEX.test(m.colorSecundario ?? "")) colores.azul = m.colorSecundario;
  const logo = medios.find((x) => x.tipo === "logo")?.archivo ?? null;
  const musica = m.musica === false ? null : (medios.find((x) => x.tipo === "musica")?.archivo ?? null);
  return {
    colores,
    nombre: m.nombre ?? "",
    etiqueta: m.etiqueta ?? "",
    logo,
    telefono: m.telefono ?? brief.datos?.telefono ?? "",
    web: m.web ?? brief.datos?.web ?? "",
    musica,
    volumenMusica: perfil.marca?.volumenMusica ?? 0.14,
    ambiente: m.ambiente ?? perfil.marca?.ambiente ?? true,
    fondo: { ...FONDO_DEFECTO, ...(perfil.marca?.fondo ?? {}) },
  };
}

export const escribirMarca = (marca) => writeFileSync(join(RAIZ, "src", "data", "marca.json"), JSON.stringify(marca, null, 2) + "\n");

/** Marca por defecto (la paleta médica de siempre): la que usan los proyectos antiguos. */
export const marcaPorDefecto = () => construirMarca(cargarPerfil("medicina"), {}, []);

/** Etiqueta de la pastilla superior: marca/etiqueta del brief > sugerida por el modelo > por defecto del perfil. */
export function etiquetaDe(perfil, brief = {}, sugerida = "") {
  const e = brief.marca?.etiqueta || (perfil.id !== "medicina" && brief.marca?.nombre) || sugerida || perfil.etiquetaPorDefecto || "VIDEO";
  return String(e).toUpperCase().slice(0, 28);
}
