#!/usr/bin/env node
/**
 * VideMed · video SIN IA a partir de un brief y una plantilla (hoy: inmobiliaria).
 * Gratis, determinista y sin claves: guion + voz + escenas con tus fotos + post.
 *
 *   npm run plantilla -- proyectos/mi-casa              (carpeta con brief.json y media/)
 *   npm run plantilla -- proyectos/mi-casa/brief.json --render
 *   opciones: --sin-voz (reutiliza src/data/timestamps.json) · --render · --voz mx · --velocidad +5%
 *             --solo-guion                               (solo escribe el guion en trabajo/ia/<id>/guion.json)
 *             --nicho inmobiliario-co | inmobiliaria     (por defecto, el «perfil» del brief)
 *             --mode dev|prod  --proveedor openai|elevenlabs   (voz de calidad estudio en producción)
 *             --exportar-ejemplo ejemplos/mi-ejemplo   (deja una copia completa para usarla de ejemplo)
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { activarProyecto, prepararMedios, respaldarProyectoActivo, sintetizarVoz } from "./ia/activar.mjs";
import { cargarPerfil, etiquetaDe, leerBrief, validarBrief } from "./ia/perfil.mjs";
import { RAIZ, cargarNucleo } from "./ia/puente.mjs";
import { resumirProblemas, validarPlan } from "./ia/validar-plan.mjs";
import { ajustarPortada, fusionarEscenasCortas, generarInmobiliaria } from "./plantillas/inmobiliaria.mjs";

const args = process.argv.slice(2);
const valor = (n) => {
  const i = args.indexOf(`--${n}`);
  return i > -1 ? args[i + 1] : undefined;
};
const bandera = (n) => args.includes(`--${n}`);
const CON_VALOR = new Set(["voz", "velocidad", "exportar-ejemplo", "modo", "mode", "proveedor", "nicho", "perfil"]);
const posicionales = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) {
    if (CON_VALOR.has(args[i].slice(2))) i++;
  } else posicionales.push(args[i]);
}
const entrada = posicionales[0];
if (!entrada) {
  console.error("Uso: npm run plantilla -- <carpeta-del-proyecto | brief.json> [--render] [--sin-voz]");
  process.exit(2);
}
const ruta = resolve(entrada);
const rutaBrief = existsSync(ruta) && statSync(ruta).isDirectory() ? join(ruta, "brief.json") : ruta;
if (!existsSync(rutaBrief)) {
  console.error(`❌ No encuentro el brief: ${rutaBrief}\n   Créalo con  npm run crear  o copia ejemplos/inmobiliaria-casa/brief.json`);
  process.exit(2);
}
const dirProy = dirname(rutaBrief);
const brief = leerBrief(rutaBrief);
const perfil = cargarPerfil(valor("nicho") ?? valor("perfil") ?? brief.perfil ?? "inmobiliaria");
if (perfil.plantilla !== "inmobiliaria") {
  console.error(`❌ El perfil «${perfil.id}» no tiene plantilla sin IA. Usa  npm run ia -- --brief ${entrada}  (con tu clave de OpenAI).`);
  process.exit(2);
}
const vb = validarBrief(brief, perfil);
vb.avisos.forEach((a) => console.log(`⚠ ${a}`));
if (!vb.ok) {
  vb.errores.forEach((e) => console.error(`❌ ${e}`));
  process.exit(2);
}

console.log(`🏠 Plantilla «${perfil.nombre}» · proyecto ${brief.id ?? dirProy}`);
if (!bandera("sin-voz") && !bandera("solo-guion")) respaldarProyectoActivo();
const medios = prepararMedios(brief, { dir: dirProy, log: console.log });
if (!medios.some((m) => m.tipo === "foto")) console.log("⚠ No hay fotos: el video se hará con piezas gráficas (las fotos lo mejoran mucho: pon tus imágenes en la carpeta media/ del proyecto).");

const gen = generarInmobiliaria({ brief, medios, locale: perfil.locale });
const palabrasGuion = gen.guion.trim().split(/\s+/).length;
console.log(`✍️  Guion: ${palabrasGuion} palabras\n   ${gen.guion}\n`);

if (bandera("solo-guion")) {
  // solo el guion (para revisarlo en el panel); compatible con el guion.json del agente de IA
  const carpeta = join(RAIZ, "trabajo", "ia", gen.proyecto.id);
  mkdirSync(carpeta, { recursive: true });
  const g = { proyectoId: gen.proyecto.id, etiqueta: etiquetaDe(perfil, brief, gen.proyecto.etiqueta), titulo: gen.proyecto.titulo, guion: gen.guion, verificacion: [], simplificaciones: ["Guion generado por la plantilla gratuita: usa solo los datos del brief."], origen: "plantilla" };
  writeFileSync(join(carpeta, "guion.json"), JSON.stringify(g, null, 2) + "\n");
  writeFileSync(join(carpeta, "guion.txt"), gen.guion + "\n");
  console.log(`✅ Guion guardado en trabajo/ia/${gen.proyecto.id}/guion.json`);
  process.exit(0);
}

if (!bandera("sin-voz")) {
  console.log("🎙️  Generando la voz…");
  if (!sintetizarVoz({ guion: gen.guion, voz: valor("voz") ?? brief.voz ?? perfil.voz, velocidad: valor("velocidad") ?? brief.velocidad ?? perfil.velocidad, modo: valor("mode") ?? valor("modo"), proveedor: valor("proveedor"), perfil: perfil.id })) {
    console.error("❌ Falló la síntesis de voz (modo dev: necesita internet y Python 3; modo prod: revisa tus claves en .env).");
    process.exit(1);
  }
} else {
  writeFileSync(join(RAIZ, "src", "data", "guion.txt"), gen.guion + "\n");
}
const palabras = JSON.parse(readFileSync(join(RAIZ, "src", "data", "timestamps.json"), "utf8"));
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
if (gen.guion.split(/\s+/).map(norm).filter(Boolean).join(" ") !== palabras.map((w) => norm(w.word)).filter(Boolean).join(" ")) {
  console.error("❌ Los timestamps de src/data no corresponden a este guion. Quita --sin-voz para regenerar la voz.");
  process.exit(1);
}

const N = await cargarNucleo();
const fusiones = fusionarEscenasCortas(gen.plan, (pl) => N.tiemposDePlan(pl, palabras));
if (fusiones) console.log(`🔗 ${fusiones} escena(s) duraban menos de 2 s con esta voz y se fusionaron con su vecina.`);
const { inicios, fines } = N.tiemposDePlan(gen.plan, palabras);
ajustarPortada(gen.plan, inicios, fines);
gen.proyecto.etiqueta = etiquetaDe(perfil, brief, gen.proyecto.etiqueta);
gen.plan.proyecto = gen.proyecto;

const r = await validarPlan(gen.plan, palabras, { perfil, media: medios });
console.log(`🔎 Validación: ${r.errores.length} error(es), ${r.avisos.length} aviso(s)`);
const txt = resumirProblemas(r, 30);
if (txt) console.log(txt);
if (!r.ok) {
  mkdirSync(join(RAIZ, "trabajo", "ia"), { recursive: true });
  const p = join(RAIZ, "trabajo", "ia", `${gen.proyecto.id}-plan-plantilla.json`);
  writeFileSync(p, JSON.stringify(gen.plan, null, 2));
  console.error(`\n❌ El plan de la plantilla tiene errores (guardado en ${p}). Revisa el brief (¿textos demasiado largos?).`);
  process.exit(4);
}

activarProyecto({ plan: gen.plan, proyecto: gen.proyecto, perfil, brief, medios });
writeFileSync(join(RAIZ, "src", "data", "post.txt"), gen.post);
console.log(`\n✅ Proyecto «${gen.proyecto.id}» preparado: guion, voz, escenas con tus fotos y post.`);
console.log("   Ver las escenas:   npm run ia:capturas      (JPG en trabajo/ia/capturas/)   ·   npm start");
console.log("   Producir el video: npm run producir -- --sin-voz   (QA + render ≈ 25 min + portada)");

const exportar = valor("exportar-ejemplo");
if (exportar) {
  const dest = resolve(exportar);
  mkdirSync(dest, { recursive: true });
  for (const n of ["guion.txt", "timestamps.json", "meta.json", "tema.json", "post.txt", "plan.json", "marca.json", "media.json", "brief.json"]) {
    const o = join(RAIZ, "src", "data", n);
    if (existsSync(o)) copyFileSync(o, join(dest, n));
  }
  copyFileSync(join(RAIZ, "public", "audios", "voz.mp3"), join(dest, "voz.mp3"));
  console.log(`   📦 Ejemplo exportado a ${dest}`);
}

if (bandera("render")) {
  console.log("\n━━━ QA + render + entregables ━━━");
  const p = spawnSync(process.execPath, [join(RAIZ, "scripts", "producir.mjs"), "--sin-voz"], { cwd: RAIZ, stdio: "inherit" });
  if (p.status !== 0) process.exit(p.status ?? 1);
  spawnSync(process.execPath, [join(RAIZ, "scripts", "proyecto.mjs"), "guardar"], { cwd: RAIZ, stdio: "inherit" });
}
