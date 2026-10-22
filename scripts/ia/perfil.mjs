/**
 * Perfiles de video (nichos: medicina-ar, inmobiliario-co, inmobiliaria, genérico…) y briefs.
 *
 *  perfiles/<id>/perfil.json   qué elementos usa, voz (dev y prod), paleta, campos del formulario…
 *  perfiles/<id>/*.md          textos de los prompts de ese tipo de video (guion, revisor, plan, critica, post)
 *  perfiles/paletas.json       paletas de color de marca
 *
 * Un BRIEF (proyectos/<id>/brief.json) es lo que cuenta de qué trata UN video concreto.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ } from "./puente.mjs";

export const DIR_PERFILES = join(RAIZ, "perfiles");
export const DIR_PROYECTOS = join(RAIZ, "proyectos");
const MD = ["guion", "revisor", "plan", "critica", "post"];
/** Nombres antiguos de perfiles → el actual (los proyectos guardados con «medicina» siguen funcionando). */
export const ALIAS_PERFIL = { medicina: "medicina-ar" };
/** Perfil por defecto de los proyectos antiguos (sin "perfil" en tema.json). */
export const PERFIL_BASE = "medicina-ar";

export function listarPerfiles() {
  if (!existsSync(DIR_PERFILES)) return [];
  return readdirSync(DIR_PERFILES, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(DIR_PERFILES, d.name, "perfil.json")))
    .map((d) => JSON.parse(readFileSync(join(DIR_PERFILES, d.name, "perfil.json"), "utf8")));
}

export function cargarPerfil(id = PERFIL_BASE) {
  id = ALIAS_PERFIL[id] ?? id;
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

/** Perfil del proyecto activo (src/data/tema.json → "perfil"); medicina-ar si no consta (proyectos antiguos). */
export function perfilActivo() {
  try {
    const t = JSON.parse(readFileSync(join(RAIZ, "src", "data", "tema.json"), "utf8"));
    return cargarPerfil(t.perfil || PERFIL_BASE);
  } catch {
    return cargarPerfil(PERFIL_BASE);
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
  // el nicho puede llamarse "perfil", "niche" o "nicho"
  b.perfil = ALIAS_PERFIL[b.perfil ?? b.niche ?? b.nicho] ?? b.perfil ?? b.niche ?? b.nicho;
  delete b.niche;
  delete b.nicho;
  return b;
}

/** Tema del video: el escrito por el usuario o uno deducido de los datos. */
export function temaDe(brief, perfil) {
  if (!vacio(brief.tema)) return String(brief.tema).trim();
  const d = brief.datos ?? {};
  if (perfil.plantilla === "inmobiliaria" && (d.tipo || d.ubicacion)) {
    const veh = /carro|camioneta|moto/i.test(String(d.tipo ?? ""));
    const que = veh && (d.marca || d.modelo) ? `${String(d.tipo).toLowerCase()} ${[d.marca, d.modelo, d.anio].filter(Boolean).join(" ")}` : String(d.tipo ?? "propiedad").toLowerCase();
    return `${String(d.operacion ?? "Venta").replace(/\s*\(.*\)/, "")} de ${que}${d.ubicacion ? ` en ${d.ubicacion}` : ""}`;
  }
  return brief.titulo ? String(brief.titulo) : "";
}

/** ¿Se cumple la condición `si` de un campo ({clave, en|excepto}) con estos datos? */
export function campoVisible(campo, datos = {}) {
  if (!campo.si) return true;
  const v = datos[campo.si.clave];
  if (campo.si.en) return campo.si.en.includes(v);
  if (campo.si.excepto) return !campo.si.excepto.includes(v);
  return true;
}

/** Rellena los valores por defecto de los campos del perfil que faltan (p. ej. operación = Venta, moneda = COP). */
export function aplicarDefectos(brief, perfil) {
  brief.datos ??= {};
  for (const c of perfil.campos ?? []) if (c.defecto !== undefined && vacio(brief.datos[c.clave]) && campoVisible(c, brief.datos)) brief.datos[c.clave] = c.defecto;
  return brief;
}

export function validarBrief(brief, perfil) {
  aplicarDefectos(brief, perfil);
  const errores = [];
  const avisos = [];
  if (!temaDe(brief, perfil)) errores.push("Falta el tema: cuenta de qué trata el video (campo «tema»).");
  for (const c of perfil.campos ?? []) {
    if (c.requerido && campoVisible(c, brief.datos) && vacio(brief.datos?.[c.clave])) errores.push(`Falta el dato «${c.etiqueta}» (datos.${c.clave}).`);
  }
  if (perfil.plantilla === "inmobiliaria") {
    if (vacio(brief.datos?.precio)) avisos.push(`No hay precio: el video dirá «${perfil.locale === "ar" ? "consultá" : "consulta"} el precio».`);
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
    transicion: m.transicion ?? perfil.marca?.transicion ?? "zoom",
    fondo: { ...FONDO_DEFECTO, ...(perfil.marca?.fondo ?? {}) },
  };
}

export const escribirMarca = (marca) => writeFileSync(join(RAIZ, "src", "data", "marca.json"), JSON.stringify(marca, null, 2) + "\n");

/** Marca por defecto (la paleta médica de siempre): la que usan los proyectos antiguos. */
export const marcaPorDefecto = () => construirMarca(cargarPerfil(PERFIL_BASE), {}, []);

/** Etiqueta de la pastilla superior: marca/etiqueta del brief > sugerida por el modelo > por defecto del perfil. */
export function etiquetaDe(perfil, brief = {}, sugerida = "") {
  const e = brief.marca?.etiqueta || (perfil.id !== PERFIL_BASE && brief.marca?.nombre) || sugerida || perfil.etiquetaPorDefecto || "VIDEO";
  return String(e).toUpperCase().slice(0, 28);
}

// ---------------------------------------------------------------------------
// Proyectos del usuario (proyectos/<id>/brief.json + media/)
// ---------------------------------------------------------------------------
export const slug = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "video";

/** Guarda proyectos/<id>/brief.json (crea también media/). Devuelve { id, dir, ruta }. */
export function guardarBrief(brief) {
  const id = slug(brief.id || brief.tema || brief.titulo);
  const dir = join(DIR_PROYECTOS, id);
  mkdirSync(join(dir, "media"), { recursive: true });
  const ruta = join(dir, "brief.json");
  writeFileSync(ruta, JSON.stringify({ ...brief, id }, null, 2) + "\n");
  return { id, dir, ruta };
}

const FOTO = /\.(jpe?g|png|webp|gif|bmp|tiff?)$/i;

/** Lista las carpetas de proyectos/ con lo esencial de cada brief. */
export function listarProyectosUsuario() {
  if (!existsSync(DIR_PROYECTOS)) return [];
  return readdirSync(DIR_PROYECTOS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(DIR_PROYECTOS, d.name, "brief.json")))
    .map((d) => {
      const dir = join(DIR_PROYECTOS, d.name);
      let b = {};
      try {
        b = JSON.parse(readFileSync(join(dir, "brief.json"), "utf8"));
      } catch {
        /* brief ilegible: se muestra igual para poder borrarlo */
      }
      const media = existsSync(join(dir, "media")) ? readdirSync(join(dir, "media")) : [];
      return { id: d.name, perfil: ALIAS_PERFIL[b.perfil ?? b.niche] ?? b.perfil ?? b.niche ?? null, tema: b.tema ?? b.titulo ?? "", fotos: media.filter((f) => FOTO.test(f)).length, logo: media.some((f) => /^logo/i.test(f)), modificado: statSync(join(dir, "brief.json")).mtimeMs };
    })
    .sort((a, b) => b.modificado - a.modificado);
}
