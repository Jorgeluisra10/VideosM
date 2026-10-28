/**
 * Escritura segura de archivos JSON locales: se escribe a un temporal y se renombra (un corte de luz no deja el archivo a medias),
 * y, si se pide, antes se guarda una copia con fecha y se conservan solo las últimas N.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";

const sello = () => new Date().toISOString().replace(/[:.]/g, "-");

/** Lee un JSON; si no existe devuelve `porDefecto`; si está corrupto lanza un error claro (no lo pisa en silencio). */
export function leerJson(ruta, porDefecto) {
  if (!existsSync(ruta)) return porDefecto;
  try {
    return JSON.parse(readFileSync(ruta, "utf8").replace(/^﻿/, ""));
  } catch (e) {
    throw new Error(`El archivo ${ruta} no es un JSON válido (${e.message}). Corrígelo a mano o restaura una copia de data/backups/.`);
  }
}

/** Escribe `datos` en `ruta` de forma atómica. `respaldos` = { dir, conservar } guarda antes una copia con fecha del archivo actual. */
export function escribirJsonSeguro(ruta, datos, { respaldos = null } = {}) {
  mkdirSync(dirname(ruta), { recursive: true });
  if (respaldos && existsSync(ruta)) {
    mkdirSync(respaldos.dir, { recursive: true });
    const ext = extname(ruta), base = basename(ruta, ext);
    copyFileSync(ruta, join(respaldos.dir, `${base}-${sello()}${ext}`));
    const previos = readdirSync(respaldos.dir).filter((f) => f.startsWith(`${base}-`) && f.endsWith(ext)).sort();
    for (const f of previos.slice(0, Math.max(0, previos.length - (respaldos.conservar ?? 30)))) rmSync(join(respaldos.dir, f), { force: true });
  }
  const tmp = `${ruta}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(datos, null, 2) + "\n");
  renameSync(tmp, ruta);
}
