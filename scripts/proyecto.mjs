#!/usr/bin/env node
/**
 * VideMed · proyectos (guardar / activar / listar).
 *
 * "Proyecto" = todo lo que hace falta para volver a renderizar un video: guion, voz, tiempos,
 * metadatos, texto del post y —si lo hizo la IA— el plan de escenas. Se guarda en
 *   trabajo/archivo/<id>/datos/
 * junto al video/portada ya terminados, así puedes tener muchos videos y volver a cualquiera.
 *
 *   node scripts/proyecto.mjs guardar            guarda el proyecto ACTIVO (id sale de src/data/tema.json)
 *   node scripts/proyecto.mjs listar             lista los proyectos guardados
 *   node scripts/proyecto.mjs activar <id>       restaura ese proyecto como activo (datos + tema); también acepta los
 *                                                 ejemplos de la carpeta ejemplos/ (insulina-glucosa, potencial-accion...)
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ARCHIVO = join(RAIZ, "trabajo", "archivo");

/** [ruta activa relativa a la raíz, nombre dentro de datos/] */
const ARCHIVOS = [
  ["src/data/guion.txt", "guion.txt"],
  ["src/data/timestamps.json", "timestamps.json"],
  ["src/data/meta.json", "meta.json"],
  ["src/data/tema.json", "tema.json"],
  ["src/data/post.txt", "post.txt"],
  ["src/data/plan.json", "plan.json"],
  ["public/audios/voz.mp3", "voz.mp3"],
  ["public/audios/tiempos.vtt", "tiempos.vtt"],
];

function temaActivo() {
  const t = readFileSync(join(RAIZ, "src", "tema.ts"), "utf8");
  return t.match(/from\s+"\.\/scenes\/([\w-]+)"/)?.[1] ?? "dolor-referido";
}

function guardar() {
  const info = JSON.parse(readFileSync(join(RAIZ, "src", "data", "tema.json"), "utf8"));
  const tema = temaActivo();
  const destino = join(ARCHIVO, info.id, "datos");
  mkdirSync(destino, { recursive: true });
  let n = 0;
  for (const [origen, nombre] of ARCHIVOS) {
    if (nombre === "plan.json" && tema !== "dinamico") continue; // el plan solo pertenece a proyectos de la IA
    const ruta = join(RAIZ, origen);
    if (existsSync(ruta)) {
      copyFileSync(ruta, join(destino, nombre));
      n++;
    }
  }
  writeFileSync(join(destino, "tema-activo.txt"), tema + "\n", "utf8");
  console.log(`✅ Proyecto "${info.id}" guardado (${n} archivos, tema ${tema}) en trabajo/archivo/${info.id}/datos/`);
}

function listar() {
  if (!existsSync(ARCHIVO)) return console.log("(no hay proyectos guardados todavía)");
  for (const d of readdirSync(ARCHIVO, { withFileTypes: true }).filter((x) => x.isDirectory())) {
    const datos = join(ARCHIVO, d.name, "datos");
    const tiene = existsSync(join(datos, "guion.txt"));
    const video = existsSync(join(ARCHIVO, d.name, "video-terminado.mp4"));
    const tema = existsSync(join(datos, "tema-activo.txt")) ? readFileSync(join(datos, "tema-activo.txt"), "utf8").trim() : "?";
    console.log(`• ${d.name}  ${video ? "🎬 video" : "· sin video"}  ${tiene ? "· restaurable" : "· (sin datos para restaurar)"}  · tema ${tema}`);
  }
}

function activar(id) {
  if (!id) throw new Error("Indica el id:  node scripts/proyecto.mjs activar <id>");
  const base = join(ARCHIVO, id);
  const candidatos = [join(base, "datos"), base, join(RAIZ, "ejemplos", id)];
  const datos = candidatos.find((d) => existsSync(join(d, "guion.txt"))) ?? base;
  if (!existsSync(join(datos, "guion.txt"))) throw new Error(`El proyecto "${id}" no tiene datos restaurables en ${datos}`);
  for (const [destino, nombre] of ARCHIVOS) {
    const ruta = join(datos, nombre);
    if (existsSync(ruta)) copyFileSync(ruta, join(RAIZ, destino));
  }
  const tema = existsSync(join(datos, "tema-activo.txt")) ? readFileSync(join(datos, "tema-activo.txt"), "utf8").trim() : existsSync(join(datos, "plan.json")) ? "dinamico" : "dolor-referido";
  const r = spawnSync("node", [join(RAIZ, "scripts", "activar-tema.mjs"), tema], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("No pude activar el tema " + tema);
  console.log(`✅ Proyecto "${id}" activo. Para regenerar el video:  npm run build`);
}

const [cmd, arg] = process.argv.slice(2);
try {
  if (cmd === "guardar") guardar();
  else if (cmd === "listar") listar();
  else if (cmd === "activar") activar(arg);
  else {
    console.log("Uso: node scripts/proyecto.mjs guardar | listar | activar <id>");
    process.exit(1);
  }
} catch (e) {
  console.error("❌", e.message);
  process.exit(1);
}
