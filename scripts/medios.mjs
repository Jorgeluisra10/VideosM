#!/usr/bin/env node
/**
 * VideMed · medios (fotos, logo, música) de un proyecto.
 *
 * Toma una carpeta con tus archivos y los deja listos para el video:
 *   public/media/<nombre>.jpg      fotos reducidas a ≤ 1600 px (ligeras: el render va justo de memoria)
 *   public/media/bg-<nombre>.jpg   miniatura desenfocada (fondo del modo "marco")
 *   public/media/logo.png          el archivo cuyo nombre empieza por "logo"
 *   public/media/musica.<ext>      el primer archivo de audio (mp3, wav, m4a…)
 *   src/data/media.json            lista con tamaños y descripciones (la leen el render y la IA)
 *
 *   node scripts/medios.mjs <carpeta>          importa
 *   node scripts/medios.mjs --limpiar          vacía los medios del proyecto activo
 *   node scripts/medios.mjs --listar
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SALIDA = join(RAIZ, "public", "media");
const JSON_MEDIOS = join(RAIZ, "src", "data", "media.json");

const FOTOS = new Set([".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif", ".tif", ".tiff"]);
const AUDIOS = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"]);

export function buscarFfmpeg() {
  const base = join(RAIZ, "node_modules", "@remotion");
  const exe = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  for (const d of readdirSync(base)) {
    if (d.startsWith("compositor-") && existsSync(join(base, d, exe))) return { ffmpeg: join(base, d, exe), ffprobe: join(base, d, exe.replace("ffmpeg", "ffprobe")) };
  }
  throw new Error("No encuentro el ffmpeg incluido en Remotion (@remotion/compositor-*). Ejecuta: npm install");
}

const slug = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "foto";

/** Orden "natural": foto2 antes que foto10. */
const natural = (a, b) => a.localeCompare(b, "es", { numeric: true, sensitivity: "base" });

function dimensiones(ffprobe, ruta) {
  const r = spawnSync(ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0:s=x", ruta], { encoding: "utf8" });
  const m = String(r.stdout ?? "").trim().match(/^(\d+)x(\d+)/);
  return m ? { ancho: Number(m[1]), alto: Number(m[2]) } : {};
}

export function limpiarMedios() {
  rmSync(SALIDA, { recursive: true, force: true });
  mkdirSync(SALIDA, { recursive: true });
  writeFileSync(JSON_MEDIOS, "[]\n");
}

export function leerMedios() {
  try {
    return JSON.parse(readFileSync(JSON_MEDIOS, "utf8"));
  } catch {
    return [];
  }
}

/**
 * Importa los medios de una carpeta.
 * @param {{origen:string, descripciones?:Record<string,string>, orden?:string[], log?:(s:string)=>void}} o
 *   descripciones: nombre original (sin distinguir mayúsculas) → descripción de la foto.
 *   orden: nombres originales en el orden deseado (el resto va después, en orden natural).
 */
export function importarMedios({ origen, descripciones = {}, orden = [], log = () => {} }) {
  const dir = resolve(origen);
  if (!existsSync(dir)) throw new Error(`No existe la carpeta de medios: ${dir}`);
  const { ffmpeg, ffprobe } = buscarFfmpeg();
  limpiarMedios();

  const archivos = readdirSync(dir, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name);
  const pos = (n) => {
    const i = orden.findIndex((o) => o.toLowerCase() === n.toLowerCase());
    return i < 0 ? 9999 : i;
  };
  const imagenes = archivos.filter((n) => FOTOS.has(extname(n).toLowerCase())).sort((a, b) => pos(a) - pos(b) || natural(a, b));
  const audios = archivos.filter((n) => AUDIOS.has(extname(n).toLowerCase())).sort(natural);
  const desc = Object.fromEntries(Object.entries(descripciones).map(([k, v]) => [k.toLowerCase(), v]));

  const lista = [];
  const usados = new Set();
  const unico = (base) => {
    let n = base;
    for (let i = 2; usados.has(n); i++) n = `${base}-${i}`;
    usados.add(n);
    return n;
  };
  const convertir = (entrada, salida, filtro, calidad = "3") => {
    const r = spawnSync(ffmpeg, ["-v", "error", "-y", "-i", entrada, "-vf", filtro, "-frames:v", "1", "-q:v", calidad, salida], { encoding: "utf8" });
    return r.status === 0 && existsSync(salida);
  };

  let hayLogo = false;
  for (const n of imagenes) {
    const entrada = join(dir, n);
    const base = basename(n, extname(n));
    if (/^logo/i.test(base) && !hayLogo) {
      const salida = join(SALIDA, "logo.png");
      if (!convertir(entrada, salida, "scale='min(800,iw)':-2")) {
        log(`⚠ No pude convertir el logo ${n}`);
        continue;
      }
      hayLogo = true;
      lista.push({ archivo: "logo.png", tipo: "logo", original: n, ...dimensiones(ffprobe, salida) });
      continue;
    }
    const nombre = unico(slug(base));
    const salida = join(SALIDA, `${nombre}.jpg`);
    if (!convertir(entrada, salida, "scale='min(1600,iw)':-2")) {
      log(`⚠ No pude convertir la foto ${n} (¿formato no admitido?). Pásala a JPG o PNG.`);
      continue;
    }
    const item = { archivo: `${nombre}.jpg`, tipo: "foto", original: n, ...dimensiones(ffprobe, salida) };
    // miniatura desenfocada para el modo "marco": 1) con boxblur si existe; 2) si no, solo reducida (el navegador la suaviza al ampliarla)
    const bg = join(SALIDA, `bg-${nombre}.jpg`);
    if (convertir(entrada, bg, "scale=108:192:force_original_aspect_ratio=increase,crop=108:192,boxblur=4:2", "5") || convertir(entrada, bg, "scale=54:96:force_original_aspect_ratio=increase,crop=54:96", "5")) item.fondo = `bg-${nombre}.jpg`;
    const d = desc[n.toLowerCase()] ?? desc[base.toLowerCase()];
    if (d) item.descripcion = d;
    lista.push(item);
  }
  if (audios.length) {
    const n = audios[0];
    const nombre = `musica${extname(n).toLowerCase()}`;
    copyFileSync(join(dir, n), join(SALIDA, nombre));
    lista.push({ archivo: nombre, tipo: "musica", original: n });
  }

  writeFileSync(JSON_MEDIOS, JSON.stringify(lista, null, 2) + "\n");
  return lista;
}

// ---------------------------------------------------------------------------
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const [a] = process.argv.slice(2);
  try {
    if (a === "--limpiar") {
      limpiarMedios();
      console.log("✅ Medios vaciados.");
    } else if (a === "--listar") {
      for (const m of leerMedios()) console.log(`• ${m.archivo.padEnd(28)} ${m.tipo.padEnd(7)} ${m.ancho ? `${m.ancho}×${m.alto}` : ""} ${m.descripcion ?? ""}  (${m.original ?? ""})`);
    } else if (a) {
      const lista = importarMedios({ origen: a, log: console.log });
      console.log(`✅ ${lista.length} medio(s) listos en public/media/:`);
      for (const m of lista) console.log(`   • ${m.archivo} (${m.tipo}${m.ancho ? `, ${m.ancho}×${m.alto}` : ""})`);
    } else {
      console.log("Uso: node scripts/medios.mjs <carpeta> | --limpiar | --listar");
      process.exit(1);
    }
  } catch (e) {
    console.error("❌", e.message);
    process.exit(1);
  }
}
