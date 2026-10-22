/**
 * Panel · proyectos: briefs de usuario (proyectos/<id>), su estado por etapas y la "ranura activa"
 * (src/data + public/media), que es lo que Remotion renderiza en cada momento.
 *
 * Etapas: brief → guion → voz → escenas → calidad (QA) → render → entrega. Cada etapa guarda su marca de tiempo en
 * proyectos/<id>/estado.json; una etapa solo cuenta como válida si es posterior a la anterior (si cambias el guion,
 * la voz y todo lo que viene después pasan a «por rehacer»).
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { importarMedios, leerMedios } from "../medios.mjs";
import { activarProyecto as activarCompartido, prepararMedios, respaldarProyectoActivo } from "../ia/activar.mjs";
import { DIR_PROYECTOS, PERFIL_BASE, aplicarDefectos, cargarPerfil, construirMarca, escribirMarca, etiquetaDe, guardarBrief, leerBrief, listarProyectosUsuario, slug, temaDe, validarBrief } from "../ia/perfil.mjs";
import { RAIZ } from "../ia/puente.mjs";

const dato = (n) => join(RAIZ, "src", "data", n);
const leerJson = (r, def = null) => {
  try {
    return JSON.parse(readFileSync(r, "utf8"));
  } catch {
    return def;
  }
};
const normTxt = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export const dirProyecto = (id) => join(DIR_PROYECTOS, slug(id));
export const existeProyecto = (id) => existsSync(join(dirProyecto(id), "brief.json"));
export const dirTrabajoIa = (id) => join(RAIZ, "trabajo", "ia", slug(id));
export const dirArchivo = (id) => join(RAIZ, "trabajo", "archivo", slug(id));

// ---------------------------------------------------------------------------
// Brief y medios
// ---------------------------------------------------------------------------
export function leerBriefProyecto(id) {
  const ruta = join(dirProyecto(id), "brief.json");
  if (!existsSync(ruta)) return null;
  return leerBrief(ruta);
}

/** Guarda el brief (crea la carpeta) y devuelve { id, avisos, errores }. No bloquea por datos incompletos: se puede ir rellenando. */
export function guardarBriefProyecto(brief) {
  const perfil = cargarPerfil(brief.perfil ?? brief.niche ?? PERFIL_BASE);
  brief.perfil = perfil.id;
  delete brief.niche;
  aplicarDefectos(brief, perfil);
  if (!brief.tema) brief.tema = temaDe(brief, perfil);
  const { id } = guardarBrief({ ...brief, id: brief.id || slug(brief.tema || brief.marca?.nombre || "video") });
  const v = validarBrief(brief, perfil);
  return { id, errores: v.errores, avisos: v.avisos };
}

const EXT_FOTO = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tif", ".tiff"]);
const EXT_AUDIO = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg"]);

export function listarMediosProyecto(id) {
  const dir = join(dirProyecto(id), "media");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => !f.startsWith("."))
    .sort((a, b) => a.localeCompare(b, "es", { numeric: true }))
    .map((f) => {
      const e = extname(f).toLowerCase();
      return { archivo: f, tipo: EXT_AUDIO.has(e) ? "musica" : /^logo/i.test(f) ? "logo" : EXT_FOTO.has(e) ? "foto" : "otro", bytes: statSync(join(dir, f)).size };
    })
    .filter((m) => m.tipo !== "otro");
}

/** Nombre de archivo seguro (sin rutas, sin caracteres raros) conservando la extensión. */
export function nombreSeguro(nombre) {
  const e = extname(String(nombre)).toLowerCase();
  const base = slug(String(nombre).slice(0, String(nombre).length - e.length)) || "archivo";
  return `${base}${e}`;
}

export function guardarMedio(id, nombre, buffer) {
  const e = extname(nombre).toLowerCase();
  if (!EXT_FOTO.has(e) && !EXT_AUDIO.has(e)) throw Object.assign(new Error(`Tipo de archivo no admitido (${e || "sin extensión"}). Usa jpg, png, webp o mp3.`), { codigo: 415 });
  const dir = join(dirProyecto(id), "media");
  mkdirSync(dir, { recursive: true });
  const nombreFinal = nombreSeguro(nombre);
  writeFileSync(join(dir, nombreFinal), buffer);
  return nombreFinal;
}

export function borrarMedio(id, nombre) {
  rmSync(join(dirProyecto(id), "media", nombreSeguro(nombre)), { force: true });
}

export function borrarProyecto(id) {
  const dir = dirProyecto(id);
  if (!dir.startsWith(DIR_PROYECTOS) || dir === DIR_PROYECTOS) throw new Error("Ruta no válida.");
  rmSync(dir, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Estado por etapas
// ---------------------------------------------------------------------------
const ORDEN = ["guion", "voz", "escenas", "qa", "render", "entrega"];
const rutaEstado = (id) => join(dirProyecto(id), "estado.json");
const leerEstado = (id) => leerJson(rutaEstado(id), { etapas: {} });

/** Anota que una etapa terminó (y, por tanto, invalida las posteriores si eran anteriores a ella). */
export function marcarEtapa(id, etapa, extra = {}) {
  if (!existeProyecto(id)) return;
  const e = leerEstado(id);
  e.etapas ??= {};
  e.etapas[etapa] = { en: Date.now(), ...extra };
  mkdirSync(dirProyecto(id), { recursive: true });
  writeFileSync(rutaEstado(id), JSON.stringify(e, null, 2) + "\n");
}

export const temaActivoJson = () => leerJson(dato("tema.json"), null);

export function guionDe(id) {
  const g = leerJson(join(dirTrabajoIa(id), "guion.json"), null);
  return g && typeof g.guion === "string" && g.guion.trim() ? g : null;
}

/** Estado de un proyecto: qué etapas están listas, cuáles por rehacer y si es el proyecto activo. */
export function estadoProyecto(id) {
  const brief = leerBriefProyecto(id);
  if (!brief) return null;
  const perfil = (() => {
    try {
      return cargarPerfil(brief.perfil ?? PERFIL_BASE);
    } catch {
      return null;
    }
  })();
  const activo = temaActivoJson()?.id === slug(id);
  const g = guionDe(id);
  const est = leerEstado(id).etapas ?? {};
  const meta = activo ? leerJson(dato("meta.json"), null) : null;
  const guionOk = Boolean(g?.aprobado);
  const tsGuion = est.guion?.en ?? 0;
  const vozOk = Boolean(activo && meta && g && normTxt(meta.texto) === normTxt(g.guion));
  const plan = activo ? leerJson(dato("plan.json"), null) : null;
  const escenasOk = Boolean(vozOk && plan?.proyecto?.id === slug(id) && (est.escenas?.en ?? 0) >= (est.voz?.en ?? 0));
  const marcas = ORDEN.map((k) => est[k]?.en ?? 0);
  // una etapa vale solo si es posterior a la anterior
  const valida = (k) => {
    const i = ORDEN.indexOf(k);
    return est[k] && (i === 0 || marcas[i] >= marcas[i - 1]) && (i < 2 || valida(ORDEN[i - 1]));
  };
  const arch = dirArchivo(id);
  const video = existsSync(join(arch, "video-terminado.mp4")) ? join(arch, "video-terminado.mp4") : activo && est.render && existsSync(join(RAIZ, "trabajo", "salida", "video-terminado.mp4")) ? join(RAIZ, "trabajo", "salida", "video-terminado.mp4") : null;
  void tsGuion;
  return {
    id: slug(id),
    perfil: perfil?.id ?? brief.perfil,
    tema: brief.tema ?? "",
    activo,
    etapas: {
      brief: { ok: validarBrief(brief, perfil ?? { campos: [] }).ok },
      guion: { ok: guionOk, palabras: g ? g.guion.trim().split(/\s+/).length : 0, origen: g?.origen ?? (g ? "ia" : null) },
      voz: { ok: vozOk, modo: meta?.modo ?? null, proveedor: meta?.proveedor ?? null, voz: meta?.voz ?? null, duracion: meta?.duracionAudio ?? null },
      escenas: { ok: escenasOk, escenas: plan?.escenas?.length ?? 0 },
      qa: { ok: Boolean(escenasOk && valida("qa") && est.qa?.ok !== false), ejecutado: Boolean(est.qa), ok_informe: est.qa?.ok ?? null, problemas: est.qa?.problemas ?? null },
      render: { ok: Boolean(est.render && (video ? true : false)), mb: video ? Math.round(statSync(video).size / 1048576) : null, en: est.render?.en ?? null },
      entrega: { ok: Boolean(est.entrega && existsSync(join(arch, "portada.jpg"))), en: est.entrega?.en ?? null },
    },
    video: video ? { ruta: video.startsWith(arch) ? `/archivo/${slug(id)}/video-terminado.mp4` : "/salida/video-terminado.mp4", mb: Math.round(statSync(video).size / 1048576) } : null,
    portada: existsSync(join(arch, "portada.jpg")) ? `/archivo/${slug(id)}/portada.jpg` : null,
    modificado: statSync(join(dirProyecto(id), "brief.json")).mtimeMs,
    fotos: listarMediosProyecto(id).filter((m) => m.tipo === "foto").length,
  };
}

export function listarProyectos() {
  return listarProyectosUsuario().map((p) => ({ ...p, estado: estadoProyecto(p.id) }));
}

// ---------------------------------------------------------------------------
// Ranura activa
// ---------------------------------------------------------------------------
export function resumenActivo() {
  const tema = temaActivoJson();
  if (!tema) return null;
  const meta = leerJson(dato("meta.json"), {});
  const plan = leerJson(dato("plan.json"), null);
  const post = existsSync(dato("post.txt")) ? readFileSync(dato("post.txt"), "utf8") : "";
  const salida = join(RAIZ, "trabajo", "salida");
  const video = join(salida, "video-terminado.mp4");
  const qa = leerJson(join(salida, "qa", "informe.json"), null);
  return {
    id: tema.id,
    etiqueta: tema.etiqueta,
    titulo: tema.titulo,
    perfil: tema.perfil ?? PERFIL_BASE,
    guion: existsSync(dato("guion.txt")) ? readFileSync(dato("guion.txt"), "utf8").trim() : "",
    voz: { duracion: meta.duracionAudio ?? null, palabras: meta.palabras ?? null, modo: meta.modo ?? "dev", proveedor: meta.proveedor ?? "edge-tts", voz: meta.voz ?? null },
    plan: plan ? { escenas: plan.escenas?.length ?? 0, id: plan.proyecto?.id ?? null } : null,
    post,
    video: existsSync(video) ? { mb: Math.round(statSync(video).size / 1048576), en: statSync(video).mtimeMs } : null,
    portada: existsSync(join(salida, "portada.jpg")),
    qa: qa ? { problemas: qa.problemas?.length ?? 0, resumen: qa.resumen ?? {}, duracion: qa.duracion } : null,
  };
}

/**
 * Deja el proyecto de usuario `id` como proyecto ACTIVO: guarda el que estaba, restaura el trabajo previo de este
 * (si existe en trabajo/archivo) y refresca brief, medios y marca. Es síncrono y rápido salvo la importación de fotos.
 */
export function activarBorrador(id, log = () => {}) {
  id = slug(id);
  const brief = leerBriefProyecto(id);
  if (!brief) throw Object.assign(new Error(`No existe el proyecto «${id}».`), { codigo: 404 });
  const perfil = cargarPerfil(brief.perfil ?? PERFIL_BASE);
  const actual = temaActivoJson();
  if (actual?.id !== id) {
    log(`Guardando el proyecto activo «${actual?.id ?? "—"}» antes de cambiar…`);
    respaldarProyectoActivo();
    if (existsSync(join(dirArchivo(id), "datos", "guion.txt"))) {
      log(`Restaurando el trabajo anterior de «${id}»…`);
      spawnSync(process.execPath, [join(RAIZ, "scripts", "proyecto.mjs"), "activar", id], { cwd: RAIZ, stdio: "ignore" });
    }
  }
  const medios = prepararMedios(brief, { dir: dirProyecto(id), log });
  const tema = { id, etiqueta: etiquetaDe(perfil, brief, actual?.id === id ? actual.etiqueta : ""), titulo: brief.titulo ?? brief.tema ?? id, perfil: perfil.id };
  writeFileSync(dato("tema.json"), JSON.stringify(tema, null, 2) + "\n");
  writeFileSync(dato("brief.json"), JSON.stringify({ ...brief, perfil: perfil.id }, null, 2) + "\n");
  escribirMarca(construirMarca(perfil, brief, medios));
  // el tema dinámico es el que dibuja cualquier plan (el tema manual del infarto solo sirve para ese video)
  spawnSync(process.execPath, [join(RAIZ, "scripts", "activar-tema.mjs"), "dinamico"], { cwd: RAIZ, stdio: "ignore" });
  return { id, perfil: perfil.id, medios: medios.length };
}

/** Copia un ejemplo (carpeta ejemplos/<id> con brief.json) a proyectos/<nuevo> para poder editarlo. */
export function importarEjemplo(ejemplo, nuevoId) {
  const origen = join(RAIZ, "ejemplos", ejemplo);
  if (!existsSync(join(origen, "brief.json"))) throw Object.assign(new Error(`El ejemplo «${ejemplo}» no tiene brief.json.`), { codigo: 404 });
  const brief = leerBrief(join(origen, "brief.json"));
  const id = slug(nuevoId || `${brief.id ?? ejemplo}-copia`);
  const destino = dirProyecto(id);
  mkdirSync(join(destino, "media"), { recursive: true });
  const media = brief.medios ? join(RAIZ, brief.medios) : join(origen, "media");
  if (existsSync(media)) for (const f of readdirSync(media)) copyFileSync(join(media, f), join(destino, "media", f));
  delete brief.medios; // las fotos viven ahora en la carpeta del proyecto
  writeFileSync(join(destino, "brief.json"), JSON.stringify({ ...brief, id }, null, 2) + "\n");
  return id;
}

export const listarArchivo = () => {
  const dir = join(RAIZ, "trabajo", "archivo");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const base = join(dir, d.name);
      const tema = leerJson(join(base, "datos", "tema.json"), {});
      return { id: d.name, titulo: tema.titulo ?? d.name, perfil: tema.perfil ?? PERFIL_BASE, video: existsSync(join(base, "video-terminado.mp4")), portada: existsSync(join(base, "portada.jpg")), restaurable: existsSync(join(base, "datos", "guion.txt")) };
    });
};

export const listarEjemplos = () => {
  const dir = join(RAIZ, "ejemplos");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const base = join(dir, d.name);
      const brief = leerJson(join(base, "brief.json"), null);
      const tema = leerJson(join(base, "tema.json"), {});
      return { id: d.name, titulo: tema.titulo ?? brief?.tema ?? d.name, perfil: brief?.perfil ?? tema.perfil ?? PERFIL_BASE, conBrief: Boolean(brief), restaurable: existsSync(join(base, "guion.txt")) };
    });
};

export { importarMedios, leerMedios };
