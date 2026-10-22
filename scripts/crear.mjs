#!/usr/bin/env node
/**
 * VideMed · asistente de terminal: te hace las preguntas del nicho elegido y deja listo el proyecto.
 *
 *   npm run crear
 *
 * Pregunta nicho → tema → datos (los campos del perfil) → marca y fotos, guarda proyectos/<id>/brief.json
 * y ofrece generarlo ahora (con IA, o gratis con la plantilla en inmobiliario). Si prefieres una pantalla: npm run panel.
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { cargarEnv } from "./ia/entorno.mjs";
import { cargarPerfil, guardarBrief, listarPerfiles, paletas, slug, temaDe, validarBrief } from "./ia/perfil.mjs";
import { RAIZ } from "./ia/puente.mjs";

if (!process.stdin.isTTY) {
  console.error("Este asistente es interactivo (necesita una terminal). Sin terminal usa:  npm run crear-video -- --ayuda   o el panel:  npm run panel");
  process.exit(2);
}
cargarEnv();
const rl = createInterface({ input: process.stdin, output: process.stdout });
const preguntar = async (t, def = "") => ((await rl.question(def ? `${t} [${def}]: ` : `${t}: `)).trim() || def);

async function elegir(titulo, opciones, def = 0) {
  console.log(`\n${titulo}`);
  opciones.forEach((o, i) => console.log(`  ${i + 1}) ${o}`));
  for (;;) {
    const r = await preguntar("Elige un número", String(def + 1));
    const n = parseInt(r, 10);
    if (n >= 1 && n <= opciones.length) return n - 1;
    const i = opciones.findIndex((o) => o.toLowerCase() === r.toLowerCase());
    if (i >= 0) return i;
  }
}

const visible = (c, datos) => {
  if (!c.si) return true;
  const v = datos[c.si.clave];
  if (c.si.en) return c.si.en.includes(v);
  if (c.si.excepto) return !c.si.excepto.includes(v);
  return true;
};

try {
  console.log("\n🎬 VideMed · asistente para crear un video\n");
  const perfiles = listarPerfiles().filter((p) => p.id !== "inmobiliaria");
  const perfil = cargarPerfil(perfiles[await elegir("¿Qué tipo de video?", perfiles.map((p) => `${p.icono ?? ""} ${p.nombre}`))].id);

  const brief = { perfil: perfil.id, duracion: perfil.duracion, voz: perfil.voz, marca: {}, datos: {} };
  brief.tema = await preguntar("\nTema o frase gancho del video (puedes dejarlo vacío si rellenas los datos)");
  brief.tono = perfil.tonos?.[await elegir("Tono", perfil.tonos ?? ["cercano"])];

  let grupo = "";
  for (const c of perfil.campos ?? []) {
    if (!visible(c, brief.datos)) continue;
    if (c.grupo && c.grupo !== grupo) { grupo = c.grupo; console.log(`\n— ${grupo} —`); }
    const ayuda = c.ayuda ? `\n   (${c.ayuda})` : "";
    let v;
    if (c.tipo === "opcion") {
      const ops = (c.opciones ?? []).filter(Boolean);
      v = ops[await elegir(`${c.etiqueta}${c.requerido ? " *" : ""}${ayuda}`, ops, Math.max(0, ops.indexOf(c.defecto)))];
    } else {
      v = await preguntar(`${c.etiqueta}${c.requerido ? " *" : ""}${ayuda}`, c.defecto ?? "");
      if (c.tipo === "numero" && v) v = Number(String(v).replace(/[^\d.,-]/g, "").replace(",", ".")) || undefined;
      if (c.tipo === "lista" && v) v = v.split(",").map((x) => x.trim()).filter(Boolean);
    }
    if (v !== undefined && v !== "" && !(Array.isArray(v) && !v.length)) brief.datos[c.clave] = v;
  }

  console.log("\n— Marca —");
  brief.marca.nombre = await preguntar("Nombre de tu marca o empresa (vacío = ninguno)");
  if (brief.marca.nombre) brief.marca.etiqueta = (await preguntar("Etiqueta corta en MAYÚSCULAS para la pastilla superior", brief.marca.nombre.toUpperCase().slice(0, 22))).toUpperCase();
  const pal = Object.entries(paletas());
  const iPal = await elegir("Paleta de colores", pal.map(([, p]) => p.nombre), Math.max(0, pal.findIndex(([k]) => k === perfil.paleta)));
  brief.marca.paleta = pal[iPal][0];

  if (!brief.tema) brief.tema = temaDe(brief, perfil);
  const vb = validarBrief(brief, perfil);
  vb.avisos.forEach((x) => console.log(`⚠ ${x}`));
  if (!vb.ok) {
    vb.errores.forEach((e) => console.log(`❌ ${e}`));
    console.log("\nFaltan datos obligatorios (marcados con *). Vuelve a ejecutar  npm run crear.");
    process.exit(1);
  }
  brief.id = slug(await preguntar("\nNombre del proyecto (carpeta)", slug(brief.tema)));
  const g = guardarBrief(brief);
  console.log(`\n📝 Guardado: proyectos/${g.id}/brief.json`);
  const fotos = await preguntar("Carpeta con tus fotos y logo (vacío = ninguna; luego puedes copiarlas a proyectos/" + g.id + "/media)");
  if (fotos) {
    const o = resolve(fotos.replace(/^~/, process.env.HOME ?? "~"));
    if (existsSync(o)) { cpSync(o, join(g.dir, "media"), { recursive: true }); console.log("🖼  Fotos copiadas."); }
    else console.log(`⚠ No existe ${o}: sin fotos por ahora.`);
  }

  const hayClave = Boolean((process.env.OPENAI_API_KEY ?? "").trim());
  const opciones = [];
  if (hayClave) opciones.push(["ia", "Con IA (OpenAI): guion, escenas y revisión visual"]);
  if (perfil.plantilla) opciones.push(["plantilla", "Sin IA (plantilla gratuita): guion y escenas desde tus datos"]);
  opciones.push(["nada", "Solo guardar el proyecto (lo genero luego desde el panel: npm run panel)"]);
  const modo = opciones[await elegir("¿Cómo lo genero?", opciones.map((o) => o[1]))][0];
  rl.close();
  if (modo === "nada") { console.log("\n✅ Listo. Ábrelo en el panel:  npm run panel"); process.exit(0); }
  const sinVoz = []; // la voz se genera siempre (dev gratis); --mode prod desde el panel o crear-video
  const cmd = modo === "ia"
    ? [join(RAIZ, "scripts", "ia", "agente.mjs"), "--brief", g.dir, "--nicho", perfil.id, ...sinVoz]
    : [join(RAIZ, "scripts", "plantilla.mjs"), g.dir, "--nicho", perfil.id];
  const r = spawnSync(process.execPath, cmd, { cwd: RAIZ, stdio: "inherit" });
  process.exit(r.status ?? 1);
} catch (e) {
  rl.close();
  throw e;
}
