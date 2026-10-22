#!/usr/bin/env node
/**
 * VideMed · crear-video — de un TEMA o de los DATOS de un inmueble/vehículo a un video, en un comando.
 *
 *   # medicina (Argentina)
 *   node scripts/crear-video.mjs --niche medicina-ar "Por qué la insulina baja el azúcar"
 *
 *   # inmobiliario (Colombia): datos sueltos en JSON, fotos de una carpeta
 *   node scripts/crear-video.mjs --niche inmobiliario-co --fotos ~/fotos-apto \
 *       --datos '{"tipo":"Apartamento","ubicacion":"Chapinero, Bogotá","precio":520000000,"dormitorios":3,"banos":2,"supTotal":112,
 *                 "puntosFuertes":["terraza con vista a los cerros"],"telefono":"300 555 0100"}'
 *
 *   # con un brief ya escrito (carpeta o archivo)
 *   node scripts/crear-video.mjs --brief proyectos/mi-apto
 *
 * Qué hace: arma el brief (proyectos/<id>/brief.json) y llama a la API de OpenAI con Structured Outputs
 * (response_format json_schema estricto) para obtener el PLAN DE ESCENAS determinista: locución, qué ícono o dibujo
 * va en cada segundo (atado a una palabra del guion), coordenadas seguras 6–94 y palabras resaltadas. El plan se
 * valida (márgenes, solapes, anclas) y se repara antes de renderizar, así Remotion no falla.
 *
 * Opciones:  --niche medicina-ar|inmobiliario-co|inmobiliaria|generico   (alias --nicho / --perfil)
 *            --datos '<json>' | archivo.json     datos del inmueble/vehículo (claves = campos del perfil)
 *            --fotos <carpeta>                   se copian a proyectos/<id>/media (fotos y logo*)
 *            --id nombre · --tono "..." · --duracion 35 · --marca "Nombre de la marca"
 *            --sin-api                           inmobiliario sin IA: guion y escenas desde la plantilla gratuita
 *            --mode dev|prod · --proveedor openai|elevenlabs · --voz ar|co|…     (voz; dev = gratis)
 *            --si · --sin-vision · --render · --prueba                           (se pasan al agente de IA)
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { cargarEnv } from "./ia/entorno.mjs";
import { PERFIL_BASE, cargarPerfil, guardarBrief, leerBrief, listarPerfiles, slug, temaDe, validarBrief } from "./ia/perfil.mjs";
import { RAIZ } from "./ia/puente.mjs";

const argv = process.argv.slice(2);
const CON_VALOR = new Set(["niche", "nicho", "perfil", "datos", "fotos", "id", "tono", "duracion", "marca", "brief", "mode", "modo", "proveedor", "voz", "velocidad", "comentario", "modelo", "rondas"]);
const a = { _: [] };
for (let i = 0; i < argv.length; i++) {
  const t = argv[i];
  if (!t.startsWith("--")) { a._.push(t); continue; }
  const eq = t.indexOf("=");
  const k = eq > -1 ? t.slice(2, eq) : t.slice(2);
  if (eq > -1) a[k] = t.slice(eq + 1);
  else if (CON_VALOR.has(k) && argv[i + 1] !== undefined) a[k] = argv[++i];
  else a[k] = true;
}
const sal = (c, m) => { if (m) console.error(`\n${m}\n`); process.exit(c); };
if (a.ayuda || a.help) sal(0, readFileSync(new URL(import.meta.url), "utf8").split("*/")[0].replace(/^#!.*\n/, "").replace(/^\/\*\*?|^ \* ?/gm, ""));
cargarEnv();

// ---------- brief ----------
let rutaBrief;
let perfil;
if (a.brief) {
  const r = resolve(String(a.brief));
  rutaBrief = existsSync(r) && statSync(r).isDirectory() ? join(r, "brief.json") : r;
  if (!existsSync(rutaBrief)) sal(2, `❌ No encuentro el brief: ${rutaBrief}`);
  perfil = cargarPerfil(a.niche ?? a.nicho ?? a.perfil ?? leerBrief(rutaBrief).perfil ?? PERFIL_BASE);
} else {
  const id = a.niche ?? a.nicho ?? a.perfil;
  if (!id) sal(2, `❌ Indica el nicho:  --niche ${listarPerfiles().map((p) => p.id).join(" | ")}`);
  try { perfil = cargarPerfil(id); } catch (e) { sal(2, `❌ ${e.message}`); }
  let datos = {};
  if (a.datos) {
    try {
      const txt = existsSync(String(a.datos)) ? readFileSync(String(a.datos), "utf8") : String(a.datos);
      datos = JSON.parse(txt);
    } catch (e) { sal(2, `❌ --datos no es un JSON válido: ${e.message}`); }
  }
  const brief = {
    perfil: perfil.id,
    ...(a.id ? { id: slug(a.id) } : {}),
    tema: a._.join(" ").trim() || datos.tema || "",
    duracion: Number(a.duracion) || perfil.duracion || 35,
    tono: a.tono ?? perfil.tonos?.[0],
    voz: a.voz ?? perfil.voz,
    marca: { ...(a.marca ? { nombre: String(a.marca) } : {}) },
    datos,
  };
  delete brief.datos.tema;
  if (!brief.tema) brief.tema = temaDe(brief, perfil);
  if (!brief.id) brief.id = slug(brief.tema);
  const g = guardarBrief(brief);
  rutaBrief = g.ruta;
  if (a.fotos) {
    const origen = resolve(String(a.fotos));
    if (!existsSync(origen)) sal(2, `❌ No existe la carpeta de fotos: ${origen}`);
    cpSync(origen, join(g.dir, "media"), { recursive: true });
  }
  console.log(`📝 Brief guardado en proyectos/${g.id}/brief.json`);
}
const brief = leerBrief(rutaBrief);
const vb = validarBrief(brief, perfil);
vb.avisos.forEach((x) => console.log(`⚠ ${x}`));
if (!vb.ok) sal(2, vb.errores.map((e) => `❌ ${e}`).join("\n"));

// ---------- generar ----------
const reenviar = [];
for (const k of ["mode", "modo", "proveedor", "voz", "velocidad", "comentario", "modelo", "rondas"]) if (a[k]) reenviar.push(`--${k}`, String(a[k]));
for (const k of ["si", "sin-vision", "render", "prueba", "sin-revision", "emergencia"]) if (a[k]) reenviar.push(`--${k}`);
const hayClave = Boolean((process.env.OPENAI_API_KEY ?? "").trim()) || a.prueba;
const sinApi = a["sin-api"] || (!hayClave && perfil.plantilla);

if (sinApi) {
  if (!perfil.plantilla) sal(2, `❌ El nicho «${perfil.id}» necesita la API de OpenAI (no tiene plantilla gratuita). Pon OPENAI_API_KEY en .env.`);
  console.log("🆓 Sin IA: plantilla gratuita (guion y escenas deterministas a partir de tus datos).");
  const extra = [];
  if (a.mode ?? a.modo) extra.push("--mode", String(a.mode ?? a.modo));
  if (a.proveedor) extra.push("--proveedor", String(a.proveedor));
  if (a.voz) extra.push("--voz", String(a.voz));
  if (a.render) extra.push("--render");
  const r = spawnSync(process.execPath, [join(RAIZ, "scripts", "plantilla.mjs"), dirname(rutaBrief), "--nicho", perfil.id, ...extra], { cwd: RAIZ, stdio: "inherit" });
  process.exit(r.status ?? 1);
}
if (!hayClave) sal(2, "❌ Falta OPENAI_API_KEY en .env (copia .env.example como .env). Para probar sin gastar: añade --prueba.");
const r = spawnSync(process.execPath, [join(RAIZ, "scripts", "ia", "agente.mjs"), "--brief", dirname(rutaBrief), "--nicho", perfil.id, ...reenviar], { cwd: RAIZ, stdio: "inherit" });
process.exit(r.status ?? 1);
