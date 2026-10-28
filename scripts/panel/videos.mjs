/**
 * PANEL DE VIDEOS (servidor): el almacén local data/videos.json y sus operaciones. Sin base de datos:
 *   · lectura y escritura seguras (archivo temporal + renombrar), con copia con fecha en data/backups/ antes de cada cambio (se conservan las últimas 30);
 *   · crear / editar / eliminar / duplicar, métricas, acciones de negocio, estado (pipeline);
 *   · importar desde CSV (vista previa con errores por fila) y exportar todo a CSV;
 *   · registrar solo el video que genera el sistema (estado «grabado», con guion, voz e instrucciones) y guardar una copia del MP4 + miniatura para abrirlo desde el panel;
 *   · sincronizar la carpeta videos/ (registro.json + revision.mp4 + miniatura.jpg de cada video), que SÍ viaja por git: así los videos creados en otra máquina o sesión aparecen en TU panel.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { escribirJsonSeguro, leerJson } from "../archivo-seguro.mjs";
import { buscarFfmpeg } from "../medios.mjs";
import { cargarNucleoAnim, RAIZ } from "../anim/nucleo.mjs";
import { dirDatos } from "../anim/voz-config.mjs";

export const ARCHIVO_VIDEOS = () => dirDatos("videos.json");
export const dirBackups = () => dirDatos("backups");
export const dirMedia = (...p) => dirDatos("media", ...p);
const error = (mensaje, codigo = 400) => Object.assign(new Error(mensaje), { codigo });

/** La base completa (normalizada). Si no existe, está vacía; si está corrupta se avisa sin pisarla. */
export async function leerBase() {
  const N = await cargarNucleoAnim();
  return N.normalizarBase(leerJson(ARCHIVO_VIDEOS(), { version: 1, videos: [] }));
}

async function guardarBase(base) {
  escribirJsonSeguro(ARCHIVO_VIDEOS(), { version: 1, videos: base.videos }, { respaldos: { dir: dirBackups(), conservar: 30 } });
}

const tocar = (v) => { v.actualizado = new Date().toISOString(); return v; };
const buscar = (base, id) => {
  const v = base.videos.find((x) => x.id === String(id ?? ""));
  if (!v) throw error("No existe ese video.", 404);
  return v;
};

/** Crea o actualiza (por id) un video con los campos que lleguen. Devuelve { video, parecidos } (los parecidos solo se calculan si es nuevo o cambió título/gancho). */
export async function guardarVideo(campos) {
  const N = await cargarNucleoAnim();
  const base = await leerBase();
  const hoy = N.hoyISO();
  const actual = campos?.id ? base.videos.find((x) => x.id === campos.id) : null;
  const unido = { ...(actual ?? {}), ...campos, id: actual?.id ?? campos?.id, creado: actual?.creado, origen: actual?.origen ?? campos?.origen };
  // las listas solo se reemplazan si llegan; el servidor nunca pierde métricas por un formulario que no las trae
  for (const k of ["publicaciones", "metricas", "acciones"]) if (!(k in (campos ?? {}))) unido[k] = actual?.[k] ?? [];
  const video = N.normalizarVideo(unido, hoy);
  const errores = N.validarVideo(video);
  if (errores.length) throw error(errores.join(" "));
  if (video.estado === "publicado" && !video.fecha_publicacion) video.fecha_publicacion = video.publicaciones[0]?.fecha ?? hoy;
  tocar(video);
  const i = base.videos.findIndex((x) => x.id === video.id);
  if (i >= 0) base.videos[i] = video; else base.videos.unshift(video);
  await guardarBase(base);
  const cambioTexto = !actual || actual.titulo !== video.titulo || actual.gancho !== video.gancho;
  return { video, parecidos: cambioTexto ? N.buscarParecidos(video, base.videos, hoy) : [] };
}

export async function eliminarVideo(id) {
  const base = await leerBase();
  const v = buscar(base, id);
  base.videos = base.videos.filter((x) => x.id !== v.id);
  await guardarBase(base);
  for (const f of [v.ruta_archivo, v.ruta_miniatura]) if (f && f.startsWith("data/media/")) rmSync(dirMedia(basename(f)), { force: true });
  return { ok: true };
}

export async function duplicarVideo(id) {
  const N = await cargarNucleoAnim();
  const base = await leerBase();
  const copia = N.duplicarComoIdea(buscar(base, id));
  base.videos.unshift(copia);
  await guardarBase(base);
  return { video: copia };
}

export async function agregarMetrica(id, metrica) {
  const N = await cargarNucleoAnim();
  const base = await leerBase();
  const v = buscar(base, id);
  const m = N.normalizarMetrica(metrica, N.hoyISO());
  if (!m.vistas && !m.me_gusta && !m.comentarios && !m.guardados && !m.compartidos) throw error("Escribe al menos un número (vistas, guardados…).");
  v.metricas.push(m);
  tocar(v);
  await guardarBase(base);
  return { video: v };
}

export async function agregarAccion(id, accion) {
  const N = await cargarNucleoAnim();
  const base = await leerBase();
  const v = buscar(base, id);
  v.acciones.push(N.normalizarAccion(accion, N.hoyISO()));
  tocar(v);
  await guardarBase(base);
  return { video: v };
}

export async function cambiarEstado(id, estado) {
  const N = await cargarNucleoAnim();
  if (!N.ESTADOS.includes(estado)) throw error("Estado no válido.");
  const base = await leerBase();
  const v = buscar(base, id);
  v.estado = estado;
  if (estado === "publicado" && !v.fecha_publicacion) v.fecha_publicacion = N.hoyISO();
  tocar(v);
  await guardarBase(base);
  return { video: v };
}

/** Ideas parecidas (últimos 60 días) a un título/gancho que se está escribiendo. */
export async function parecidos({ titulo, gancho, id }) {
  const N = await cargarNucleoAnim();
  const base = await leerBase();
  return { parecidos: N.buscarParecidos({ titulo: String(titulo ?? ""), gancho: String(gancho ?? ""), id }, base.videos, N.hoyISO()) };
}

// ───────────────────────────── CSV ─────────────────────────────
/** Vista previa de una importación: cada fila con su veredicto (sin guardar nada). */
export async function vistaPreviaCSV(texto) {
  const N = await cargarNucleoAnim();
  if (typeof texto !== "string" || !texto.trim()) throw error("El archivo está vacío.");
  if (texto.length > 3 * 1024 * 1024) throw error("El CSV es demasiado grande (máximo 3 MB).");
  const base = await leerBase();
  const existentes = new Set(base.videos.flatMap((v) => v.publicaciones.map((p) => p.url)).filter(Boolean));
  const { columnas, filas, errores } = N.parsearCSV(texto);
  const faltan = ["titulo", "plataforma", "fecha"].filter((c) => !columnas.includes(c));
  if (faltan.length) throw error(`Al CSV le faltan columnas obligatorias: ${faltan.join(", ")}. Descarga el CSV de ejemplo para ver el formato.`);
  if (filas.length > 2000) throw error("El CSV tiene más de 2.000 filas: divídelo en partes.");
  const resultado = N.validarFilasCSV(filas, N.hoyISO(), existentes);
  return { columnas, errores, filas: resultado.map((f) => ({ ...f, video: f.video ? { titulo: f.video.titulo, serie: f.video.serie, plataforma: f.video.publicaciones[0].plataforma, url: f.video.publicaciones[0].url, fecha: f.video.fecha_publicacion, vistas: f.video.metricas[0].vistas, guardados: f.video.metricas[0].guardados, compartidos: f.video.metricas[0].compartidos } : null })), resumen: { total: resultado.length, validas: resultado.filter((f) => f.ok && !f.duplicada).length, conError: resultado.filter((f) => !f.ok).length, duplicadas: resultado.filter((f) => f.duplicada).length } };
}

/** Importa las filas válidas (las duplicadas por enlace se omiten; las que tienen error no se importan). */
export async function importarCSV(texto) {
  const N = await cargarNucleoAnim();
  const base = await leerBase();
  const existentes = new Set(base.videos.flatMap((v) => v.publicaciones.map((p) => p.url)).filter(Boolean));
  const { filas } = N.parsearCSV(texto);
  const r = N.validarFilasCSV(filas, N.hoyISO(), existentes);
  const nuevos = r.filter((f) => f.ok && !f.duplicada).map((f) => f.video);
  if (nuevos.length) { base.videos.unshift(...nuevos); await guardarBase(base); }
  return { importados: nuevos.length, omitidas: r.filter((f) => f.duplicada).length, conError: r.filter((f) => !f.ok).length };
}

export async function exportarCSV() {
  const N = await cargarNucleoAnim();
  return N.aCSV((await leerBase()).videos);
}

// ───────────────────────────── el video que genera el sistema ─────────────────────────────
function miniatura(video, destino) {
  try {
    const { ffmpeg } = buscarFfmpeg();
    const r = spawnSync(ffmpeg, ["-v", "error", "-y", "-ss", "1", "-i", video, "-frames:v", "1", "-vf", "scale=360:-2", "-q:v", "4", destino], { encoding: "utf8" });
    return r.status === 0 && existsSync(destino);
  } catch {
    return false;
  }
}

/**
 * Registra (o actualiza) el video que acaba de generar el sistema: estado «grabado», con el guion, la voz y las instrucciones usadas, y una copia
 * del MP4 y su miniatura en data/media/ para poder abrirlo desde el panel. Si ya existe un registro del mismo video (mismo título y guion), lo actualiza
 * sin tocar su estado, publicaciones ni métricas.
 * `entrada` = { anim, manifiestoVoz?, mp4?, estado? }.
 */
export async function registrarVideoGenerado({ anim, manifiestoVoz = null, mp4 = null, estado = "grabado", serie = "", notas = "" }) {
  const N = await cargarNucleoAnim();
  const base = await leerBase();
  const voz = manifiestoVoz ? (manifiestoVoz.externa ? `Voz propia (${manifiestoVoz.archivo ?? "audio subido"})` : manifiestoVoz.motor === "eleven" ? `ElevenLabs · ${manifiestoVoz.voz} · ${manifiestoVoz.modelo}` : `OpenAI · ${manifiestoVoz.voz} · ${manifiestoVoz.modelo}${manifiestoVoz.estilo ? ` · ${manifiestoVoz.estilo}` : ""}`) : "";
  const nuevo = N.videoDesdeAnimacion(anim, { voz, instrucciones: manifiestoVoz?.instrucciones ?? "", estado });
  if (N.SERIES.includes(serie)) nuevo.serie = serie; // la serie que pidió el usuario manda sobre la que se deduce del título
  if (notas) nuevo.notas = String(notas).slice(0, 3000);
  let v = base.videos.find((x) => x.origen_clave && x.origen_clave === nuevo.origen_clave);
  const creado = !v;
  if (!v) { v = nuevo; base.videos.unshift(v); }
  else {
    v.duracion_seg = nuevo.duracion_seg;
    if (N.SERIES.includes(serie)) v.serie = serie;
    if (notas) v.notas = nuevo.notas;
    if (voz) { v.voz_usada = voz; v.instrucciones_voz = nuevo.instrucciones_voz; }
    // nunca se baja de estado: si ya estaba programado o publicado se queda así
    if (N.ESTADOS.indexOf(estado) > N.ESTADOS.indexOf(v.estado)) v.estado = estado;
  }
  if (mp4 && existsSync(mp4) && statSync(mp4).size > 1000) {
    mkdirSync(dirMedia(), { recursive: true });
    copyFileSync(mp4, dirMedia(`${v.id}.mp4`));
    v.ruta_archivo = `data/media/${v.id}.mp4`;
    if (miniatura(dirMedia(`${v.id}.mp4`), dirMedia(`${v.id}.jpg`))) v.ruta_miniatura = `data/media/${v.id}.jpg`;
  }
  tocar(v);
  await guardarBase(base);
  return { video: v, creado };
}

/** Lee lo necesario del proyecto activo (animación + voz vigente + MP4 más reciente) y registra el video. Lo llama el panel al terminar un render. */
export async function registrarDesdeProyectoActivo({ estado = "grabado", sinVoz = false, serie = "", notas = "" } = {}) {
  const anim = leerJson(join(RAIZ, "src", "data", "animacion.json"), null);
  if (!anim?.escenas) return null;
  const { vozVigente } = await import("../anim/voz.mjs");
  const { manifiesto, vigente } = await vozVigente(anim);
  const mp4ConVoz = join(RAIZ, "trabajo", "salida", "video-animacion-con-voz.mp4"), mp4Render = join(RAIZ, "trabajo", "salida", "video-animacion.mp4");
  // el MP4 con voz solo vale si es posterior al render (si no, es de un render anterior)
  const mp4 = !sinVoz && existsSync(mp4ConVoz) && existsSync(mp4Render) && statSync(mp4ConVoz).mtimeMs >= statSync(mp4Render).mtimeMs ? mp4ConVoz : mp4Render;
  return registrarVideoGenerado({ anim, manifiestoVoz: vigente && !sinVoz ? manifiesto : null, mp4: existsSync(mp4) ? mp4 : null, estado, serie, notas });
}

// ───────────────────────────── videos/<carpeta>/registro.json (viaja por git) ─────────────────────────────
const dirVideos = () => process.env.VIDEMED_VIDEOS || join(RAIZ, "videos");

/** Copia liviana para ver desde el panel (720 px de ancho, 30 fps): la versión final a 1080×1920@60 se queda en trabajo/archivo/. */
function copiaLiviana(origen, destino) {
  try {
    const { ffmpeg } = buscarFfmpeg();
    const r = spawnSync(ffmpeg, ["-v", "error", "-y", "-i", origen, "-vf", "scale=720:-2", "-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "27", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", destino], { encoding: "utf8" });
    return r.status === 0 && existsSync(destino) && statSync(destino).size > 1000;
  } catch {
    return false;
  }
}

/**
 * Escribe en la carpeta del video (videos/AAAA-MM-DD-slug/) su `registro.json` con lo que el panel guarda del video (título, serie, guion, notas…), una
 * `miniatura.jpg` y una `revision.mp4` liviana. Esa carpeta va a git: al actualizar, el panel de cualquier computador trae el video (`sincronizarCarpetaVideos`).
 * Se busca el video del panel por `titulo` (o, si no se da, por el título de la respuesta-ia.json de la carpeta).
 */
export async function exportarRegistroCarpeta({ carpeta, titulo = "", mp4 = null }) {
  const raiz = resolve(dirVideos());
  const abs = resolve(RAIZ, String(carpeta ?? ""));
  if (relative(raiz, abs).startsWith("..") || abs === raiz || !existsSync(abs)) throw error("La carpeta debe estar dentro de videos/ y existir.");
  const base = await leerBase();
  const tituloBuscado = String(titulo || leerJson(join(abs, "respuesta-ia.json"), {})?.titulo || "");
  const v = base.videos.find((x) => x.titulo === tituloBuscado);
  if (!v) throw error(`No encuentro en el panel un video titulado «${tituloBuscado}». Registra primero el video (registrar-video.mjs).`, 404);
  const fuente = mp4 && existsSync(mp4) ? mp4 : v.ruta_archivo && existsSync(join(RAIZ, v.ruta_archivo)) ? join(RAIZ, v.ruta_archivo) : null;
  let video = "", mini = "";
  if (fuente) {
    if (copiaLiviana(fuente, join(abs, "revision.mp4"))) video = "revision.mp4";
    if (miniatura(fuente, join(abs, "miniatura.jpg"))) mini = "miniatura.jpg";
  }
  const reg = { version: 1, slug: basename(abs), titulo: v.titulo, serie: v.serie, estado: v.estado, guion: v.guion, gancho: v.gancho, duracion_seg: v.duracion_seg, notas: v.notas, voz_usada: v.voz_usada, instrucciones_voz: v.instrucciones_voz, creado: v.creado, origen_clave: v.origen_clave, video, miniatura: mini, entrega: existsSync(join(abs, "entrega.md")) ? "entrega.md" : "" };
  writeFileSync(join(abs, "registro.json"), JSON.stringify(reg, null, 2) + "\n");
  return { registro: reg, carpeta: relative(RAIZ, abs) };
}

/**
 * Trae al panel los videos de la carpeta videos/ (cada uno con su registro.json) que todavía no estén: los crea con estado «grabado» y les pone su copia
 * de revisión y su miniatura. Es idempotente: los que ya existen (misma `origen_clave`) solo reciben el video o la miniatura si les faltaban; nunca se toca su estado,
 * sus publicaciones ni sus métricas.
 */
export async function sincronizarCarpetaVideos() {
  const N = await cargarNucleoAnim();
  const raiz = dirVideos();
  const r = { total: 0, nuevos: 0, actualizados: 0 };
  if (!existsSync(raiz)) return r;
  const base = await leerBase();
  let cambios = false;
  for (const nombre of readdirSync(raiz).sort()) {
    const dir = join(raiz, nombre);
    let reg = null;
    try { reg = leerJson(join(dir, "registro.json"), null); } catch { reg = null; }
    if (!reg?.titulo) continue;
    r.total++;
    const clave = String(reg.origen_clave || `carpeta:${nombre}`).slice(0, 40);
    let v = base.videos.find((x) => x.origen_clave === clave);
    const creado = !v;
    if (!v) {
      v = N.normalizarVideo({ titulo: reg.titulo, serie: reg.serie, guion: reg.guion, gancho: reg.gancho, duracion_seg: reg.duracion_seg, notas: reg.notas, voz_usada: reg.voz_usada, instrucciones_voz: reg.instrucciones_voz, estado: reg.estado || "grabado", creado: reg.creado, origen: "carpeta", origen_clave: clave });
      base.videos.unshift(v);
      r.nuevos++; cambios = true;
    }
    let toco = false;
    const mp4 = reg.video ? join(dir, basename(String(reg.video))) : "";
    if (!v.ruta_archivo && mp4 && existsSync(mp4)) { mkdirSync(dirMedia(), { recursive: true }); copyFileSync(mp4, dirMedia(`${v.id}.mp4`)); v.ruta_archivo = `data/media/${v.id}.mp4`; toco = true; }
    const jpg = reg.miniatura ? join(dir, basename(String(reg.miniatura))) : "";
    if (!v.ruta_miniatura) {
      mkdirSync(dirMedia(), { recursive: true });
      if (jpg && existsSync(jpg)) { copyFileSync(jpg, dirMedia(`${v.id}.jpg`)); v.ruta_miniatura = `data/media/${v.id}.jpg`; toco = true; }
      else if (v.ruta_archivo && miniatura(dirMedia(`${v.id}.mp4`), dirMedia(`${v.id}.jpg`))) { v.ruta_miniatura = `data/media/${v.id}.jpg`; toco = true; }
    }
    if (toco) { tocar(v); cambios = true; if (!creado) r.actualizados++; }
  }
  if (cambios) await guardarBase(base);
  return r;
}
