#!/usr/bin/env node
/**
 * VideMed · agente de IA (API de OpenAI). Convierte un TEMA en un video terminado:
 *
 *   1. Guion      → escribe 85–110 palabras, lo revisa un segundo "médico revisor" y te lo enseña para aprobarlo.
 *   2. Voz        → edge-tts (gratis) con tiempos por palabra.
 *   3. Plan       → el modelo diseña las escenas (JSON estricto); el validador lo mide y el modelo lo repara.
 *   4. Visión     → se renderizan capturas reales y un modelo con visión las critica; se corrige y se repite.
 *   5. Post       → descripción + 5 hashtags.
 *   6. (opcional) → QA completo + render + portada (--render).
 *
 *   npm run ia -- "Por qué la insulina baja el azúcar"
 *   npm run ia -- "tema" --si --render            (sin preguntar, hasta el video final)
 *   npm run ia -- --guion mi-guion.txt            (usa TU guion: no lo modifica)
 *   npm run ia -- --solo-plan                     (el guion/voz de src/data ya existen: solo diseña las escenas)
 *   npm run ia -- --prueba "tema"                 (usa el servidor simulado: sin clave ni coste)
 *
 * Opciones: --si · --render · --solo-guion · --solo-plan · --sin-voz · --sin-revision · --sin-vision · --reanudar
 *           --voz ar|mx|es|ar-f|mx-f|es-f · --velocidad +5% · --modelo <id> · --rondas N · --comentario "..."
 *           --emergencia (si no hay plan válido, usa uno sencillo) · --aceptar-errores · --ayuda
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { Cliente, ErrorApi, anotarUso } from "./cliente.mjs";
import { configuracion, enmascarar } from "./entorno.mjs";
import { construirEsquemaPlan, esquemaCritica, esquemaGuion, esquemaPost, esquemaRevision } from "./esquemas.mjs";
import { normalizarPlan, planDeEmergencia, puntuacion, sanear } from "./plan-util.mjs";
import { entradaCritica, entradaGuion, entradaPlan, entradaPost, entradaReparacion, entradaRevisor, sistemaCritica, sistemaGuion, sistemaPlan, sistemaPost, sistemaRevisor } from "./prompts.mjs";
import { renderizarCapturas } from "./capturas.mjs";
import { RAIZ } from "./puente.mjs";
import { resumirProblemas, validarPlan } from "./validar-plan.mjs";

// ---------------------------------------------------------------------------
// Argumentos
// ---------------------------------------------------------------------------
const CON_VALOR = new Set(["guion", "voz", "velocidad", "tono", "modelo", "rondas", "comentario", "id"]);
function leerArgs(argv) {
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
  return a;
}
const args = leerArgs(process.argv.slice(2));
if (args.ayuda || args.help) {
  console.log(readFileSync(new URL(import.meta.url), "utf8").split("*/")[0].replace(/^#!.*\n/, "").replace(/^\/\*\*?|^ \* ?/gm, ""));
  process.exit(0);
}

const p = (...x) => join(RAIZ, ...x);
const dato = (n) => p("src", "data", n);
const hr = (s) => console.log(`\n━━━ ${s} ━━━`);
const info = (s) => console.log(s);
const sal = (codigo, msg) => { if (msg) console.error(`\n${msg}\n`); process.exit(codigo); };
const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "video";
const contarPalabras = (t) => t.trim().split(/\s+/).filter(Boolean).length;
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

function limpiarGuion(t) {
  return String(t)
    .replace(/\r/g, "")
    .replace(/\[[^\]]*\]/g, " ") // acotaciones [pausa]
    .replace(/[*_#`>~]/g, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Preparación: configuración, servidor simulado, cliente
// ---------------------------------------------------------------------------
let mock = null;
const cfg = configuracion();
if (args.prueba) {
  const { iniciarMock } = await import("./mock-server.mjs");
  mock = await iniciarMock(0);
  cfg.url = mock.url;
  cfg.clave = cfg.clave || "prueba";
  info(`🧪 Modo prueba: servidor simulado en ${mock.url} (no se gasta nada).`);
}
if (args.modelo) cfg.modelo = String(args.modelo);
if (args.rondas) cfg.maxRondas = Math.max(0, parseInt(args.rondas, 10) || cfg.maxRondas);
if (args["sin-vision"]) cfg.maxRondasVision = 0;
if (!cfg.clave) {
  sal(2, "❌ Falta la clave de OpenAI.\n   1. Copia .env.example como .env\n   2. Pon tu clave en OPENAI_API_KEY=sk-...   (créala en https://platform.openai.com/api-keys)\n   3. Vuelve a ejecutar.\n   Para probar sin clave: añade --prueba");
}

const tema = args._.join(" ").trim();
const soloPlan = Boolean(args["solo-plan"]);
if (!tema && !args.guion && !soloPlan) sal(2, '❌ Indica el tema:  npm run ia -- "Por qué la insulina baja el azúcar"\n   (o --guion archivo.txt, o --solo-plan con el guion ya en src/data). Más ayuda: npm run ia -- --ayuda');

const dirNombre = slug(args.id ?? (tema || (args.guion ? String(args.guion).replace(/\.[^.]+$/, "").split(/[\\/]/).pop() : "plan")));
const DIR = p("trabajo", "ia", dirNombre);
mkdirSync(DIR, { recursive: true });
const registro = join(DIR, "llamadas.jsonl");
const cl = new Cliente(cfg, { log: info });
const llamar = async (descripcion, opciones) => {
  const t0 = Date.now();
  const r = await cl.pedir(opciones);
  anotarUso(registro, { paso: descripcion, modelo: r.modelo, entrada: r.entrada, salida: r.salida, ms: Date.now() - t0 });
  info(`   ✓ ${descripcion} · ${r.modelo} · ${((Date.now() - t0) / 1000).toFixed(0)} s · ${r.entrada}→${r.salida} tokens`);
  return r.datos;
};
const guardarJson = (n, o) => writeFileSync(join(DIR, n), JSON.stringify(o, null, 2) + "\n");
const leerJson = (n) => (existsSync(join(DIR, n)) ? JSON.parse(readFileSync(join(DIR, n), "utf8")) : null);

info(`🤖 Agente VideMed · API ${cfg.url} · clave ${enmascarar(cfg.clave)} · carpeta de trabajo trabajo/ia/${dirNombre}/`);

// ---------------------------------------------------------------------------
// 1. Guion
// ---------------------------------------------------------------------------
async function preguntar(texto) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try { return (await rl.question(texto)).trim(); } finally { rl.close(); }
}

function mostrarGuion(g, revision) {
  const n = contarPalabras(g.guion);
  hr("GUION PROPUESTO");
  info(`Título : ${g.titulo}\nÁrea   : ${g.etiqueta}\nLongitud: ${n} palabras (≈ ${Math.round(n / 2.7)} s de voz)\n`);
  info(g.guion + "\n");
  if (g.verificacion?.length) {
    info("Afirmaciones clave y certeza:");
    for (const v of g.verificacion) info(`  • [${v.certeza}] ${v.afirmacion} — ${v.nota}`);
  }
  if (g.simplificaciones?.length) info("Simplificaciones didácticas: " + g.simplificaciones.join(" · "));
  if (revision?.problemas?.length) {
    info("\nObservaciones del revisor médico:");
    for (const x of revision.problemas) info(`  • (${x.tipo}) «${x.fragmento}» → ${x.correccion}`);
  }
}

async function etapaGuion() {
  const guardado = args.reanudar && leerJson("guion.json");
  if (guardado) {
    info(`↩ Reutilizo el guion aprobado de ${DIR}`);
    return guardado;
  }
  let fijo = null;
  if (args.guion) {
    const ruta = args.guion === true || args.guion === "activo" ? dato("guion.txt") : String(args.guion);
    if (!existsSync(ruta)) sal(2, `❌ No existe el archivo de guion: ${ruta}`);
    fijo = limpiarGuion(readFileSync(ruta, "utf8"));
    info(`📄 Guion del usuario: ${contarPalabras(fijo)} palabras (no se modificará).`);
  }

  let previo = fijo;
  let comentario = args.comentario ? String(args.comentario) : "";
  const temaTxt = tema || fijo?.split(/[.?!]/)[0] || "";

  for (let vuelta = 1; ; vuelta++) {
    hr(`FASE 1 · Guion${vuelta > 1 ? ` (versión ${vuelta})` : ""}`);
    let g = await llamar("redactar guion", {
      rol: "general", nombre: "guion", esquema: esquemaGuion, instrucciones: sistemaGuion(), maxSalida: 24000,
      entrada: entradaGuion({ tema: temaTxt, previo: fijo ? `GUION DEL USUARIO — NO LO CAMBIES: devuélvelo idéntico en «guion» y completa el resto de campos.\n${fijo}` : previo, comentario }),
    });
    g.guion = fijo ?? limpiarGuion(g.guion);
    g.proyectoId = slug(args.id ?? g.proyectoId);
    g.etiqueta = String(g.etiqueta).toUpperCase();

    // longitud 85–110 palabras
    for (let k = 0; !fijo && k < 3; k++) {
      const n = contarPalabras(g.guion);
      if (n >= 85 && n <= 110) break;
      info(`   ⚠ El guion tiene ${n} palabras (objetivo 85–110): pido ajuste (${k + 1}/3)…`);
      const g2 = await llamar("ajustar longitud", {
        rol: "general", nombre: "guion", esquema: esquemaGuion, instrucciones: sistemaGuion(), maxSalida: 24000,
        entrada: entradaGuion({ tema: temaTxt, previo: g.guion, comentario: `El texto tiene ${n} palabras y debe tener entre 90 y 105. ${n < 85 ? "Amplía el mecanismo con un paso más" : "Condensa"} sin perder precisión. ${comentario}` }),
      });
      g = { ...g2, guion: limpiarGuion(g2.guion), proyectoId: g.proyectoId };
      g.etiqueta = String(g.etiqueta).toUpperCase();
    }
    const palabras = contarPalabras(g.guion);
    if (!fijo && (palabras < 80 || palabras > 118)) info(`   ⚠ Aun así quedó en ${palabras} palabras; lo dejo a tu criterio.`);

    // revisión médica
    let revision = null;
    if (!args["sin-revision"]) {
      for (let r = 1; r <= 2; r++) {
        revision = await llamar("revisión médica", { rol: "revisor", nombre: "revision", esquema: esquemaRevision, instrucciones: sistemaRevisor(), maxSalida: 25000, entrada: entradaRevisor({ tema: temaTxt, guion: g.guion }) });
        if (revision.aprobado || !revision.guionCorregido) break;
        if (fijo) { info("   ⚠ El revisor médico ve problemas en TU guion (no lo toco; revísalos abajo)."); break; }
        info(`   ✎ El revisor corrige el guion (${revision.problemas.length} observación/es).`);
        g.guion = limpiarGuion(revision.guionCorregido);
      }
    }
    mostrarGuion(g, revision);
    g.revision = revision;

    // aprobación
    if (args.si || fijo) return g;
    if (!process.stdin.isTTY) {
      writeFileSync(join(DIR, "guion-borrador.txt"), g.guion + "\n");
      guardarJson("guion-borrador.json", g);
      sal(3, `⏸ Guion pendiente de tu visto bueno (GEMINI.md lo exige).\n   Borrador: trabajo/ia/${dirNombre}/guion-borrador.txt\n   Si lo apruebas, repite el comando añadiendo --si  (o pasa tu versión con --guion <archivo>).`);
    }
    const r = await preguntar("\n¿Apruebas el guion? [S]í · [n]o (salir) · o escribe qué cambiar: ");
    if (!r || /^(s|si|sí|y|yes|ok|dale|vale)$/i.test(r)) return g;
    if (/^(n|no|salir)$/i.test(r)) sal(0, "Cancelado. Nada se ha modificado.");
    previo = g.guion;
    comentario = r;
  }
}

// ---------------------------------------------------------------------------
// 2. Voz
// ---------------------------------------------------------------------------
function respaldoDelProyectoActivo() {
  if (args.prueba) return; // las pruebas no ensucian trabajo/archivo
  try {
    if (existsSync(dato("tema.json")) && existsSync(dato("guion.txt"))) {
      spawnSync(process.execPath, [p("scripts", "proyecto.mjs"), "guardar"], { cwd: RAIZ, stdio: "ignore" });
    }
  } catch { /* el respaldo es una cortesía */ }
}

function etapaVoz(g) {
  hr("FASE 2 · Voz y tiempos por palabra");
  if (!args["sin-voz"]) {
    respaldoDelProyectoActivo();
    writeFileSync(dato("guion.txt"), g.guion + "\n");
    const extra = [];
    for (const k of ["voz", "velocidad", "tono"]) if (args[k]) extra.push(`--${k}`, String(args[k]));
    const r = spawnSync(process.execPath, [p("scripts", "generar-voz.mjs"), ...extra], { cwd: RAIZ, stdio: "inherit" });
    if (r.status !== 0) sal(1, "❌ Falló la síntesis de voz (edge-tts necesita internet y Python 3). Revisa el mensaje de arriba.");
  } else {
    info("↩ --sin-voz: reutilizo src/data/timestamps.json");
  }
  const palabras = JSON.parse(readFileSync(dato("timestamps.json"), "utf8"));
  const esperadas = g.guion.split(/\s+/).filter(Boolean).map(norm).filter(Boolean);
  const reales = palabras.map((w) => norm(w.word)).filter(Boolean);
  if (esperadas.join(" ") !== reales.join(" ")) {
    sal(1, "❌ Los timestamps de src/data no corresponden a este guion. Quita --sin-voz para regenerar la voz.");
  }
  return palabras;
}

// ---------------------------------------------------------------------------
// 3. Plan
// ---------------------------------------------------------------------------
const esquemaPlan = construirEsquemaPlan();
let instruccionesPlan = null;
const sistemaDelPlan = () => (instruccionesPlan ??= sistemaPlan());

/** Indicaciones del usuario para el plan (solo con --solo-plan --comentario "..."). */
const indicaciones = soloPlan && args.comentario ? String(args.comentario) : "";

async function pedirPlan(g, palabras, proyecto) {
  const r = await llamar("diseñar escenas", { rol: "plan", nombre: "plan", esquema: esquemaPlan, instrucciones: sistemaDelPlan(), maxSalida: 48000, entrada: entradaPlan({ guion: g.guion, palabras, proyecto, indicaciones }) });
  return normalizarPlan(r, proyecto);
}

async function repararPlan(g, palabras, proyecto, plan, problemas, critica, indic = "") {
  const r = await llamar("reparar plan", { rol: "plan", nombre: "plan", esquema: esquemaPlan, instrucciones: sistemaDelPlan(), maxSalida: 48000, entrada: entradaReparacion({ guion: g.guion, palabras, plan, problemas, critica, indicaciones: indic }) });
  return normalizarPlan(r, proyecto);
}

const resumen = (r) => `${r.errores.length} error(es), ${r.avisos.length} aviso(s)`;

async function etapaPlan(g, palabras, proyecto) {
  hr("FASE 3 · Diseño de escenas (plan) + validación");
  const guardado = args.reanudar && leerJson("plan.json");
  let mejor = null;

  if (guardado) {
    const r = await validarPlan(guardado, palabras);
    info(`↩ Plan guardado: ${resumen(r)}`);
    if (r.ok) return { plan: guardado, resultado: r };
    mejor = { plan: guardado, r };
  }

  let plan = mejor?.plan;
  if (!plan && indicaciones && existsSync(dato("plan.json"))) {
    // retoque de un plan que ya existe: se parte de él y se aplican las indicaciones del usuario
    const actual = JSON.parse(readFileSync(dato("plan.json"), "utf8"));
    const ra = await validarPlan(actual, palabras);
    info(`↻ Retoco el plan actual (${resumen(ra)}) con tus indicaciones.`);
    plan = await repararPlan(g, palabras, proyecto, actual, resumirProblemas(ra, 40), "", indicaciones);
  }
  plan ??= await pedirPlan(g, palabras, proyecto);
  let sinMejora = 0;
  for (let ronda = 0; ; ronda++) {
    const r = await validarPlan(plan, palabras);
    info(`   ▸ ronda ${ronda}: ${r.metricas.escenas ?? "?"} escenas · ${r.metricas.elementos ?? "?"} elementos · ${resumen(r)}`);
    if (!mejor || puntuacion(r) < puntuacion(mejor.r)) { mejor = { plan, r }; sinMejora = 0; } else sinMejora++;
    guardarJson("plan-mejor.json", mejor.plan);
    if (r.ok && r.avisos.length <= 2) break;
    if (r.ok && ronda >= 2) break; // los avisos restantes no merecen más coste
    if (ronda >= cfg.maxRondas || sinMejora >= 2) break;
    info(resumirProblemas(r, 14).split("\n").map((l) => "      " + l.slice(0, 190)).join("\n"));
    try {
      plan = await repararPlan(g, palabras, proyecto, mejor.plan, resumirProblemas(mejor.r, 40));
    } catch (e) {
      if (e instanceof ErrorApi && !e.fatal) { info(`   ⚠ No pude reparar (${e.message}); me quedo con el mejor plan.`); break; }
      throw e;
    }
  }

  let { plan: elegido, r: res } = mejor;
  if (!res.ok) {
    const s = sanear(elegido, res);
    if (s.quitados) {
      const r2 = await validarPlan(s.plan, palabras);
      info(`   ✂ Saneado automático: quito ${s.quitados} elemento(s) defectuoso(s) → ${resumen(r2)}`);
      if (puntuacion(r2) < puntuacion(res)) { elegido = s.plan; res = r2; }
    }
  }
  if (!res.ok) {
    guardarJson("problemas.json", { errores: res.errores, avisos: res.avisos });
    if (args.emergencia) {
      info("   🛟 Uso el plan de emergencia (sencillo pero válido).");
      const pe = await planDeEmergencia(palabras, proyecto);
      const r3 = await validarPlan(pe, palabras);
      if (!r3.ok) sal(4, `❌ Ni el plan de emergencia valida:\n${resumirProblemas(r3, 20)}`);
      return { plan: pe, resultado: r3, emergencia: true };
    }
    if (args["aceptar-errores"]) {
      info("   ⚠ --aceptar-errores: sigo con un plan que NO pasa el validador.");
      return { plan: elegido, resultado: res };
    }
    sal(4, `❌ El modelo no logró un plan válido tras ${cfg.maxRondas} ronda(s) de reparación (${resumen(res)}).\n${resumirProblemas(res, 12)}\n\n   Guardado en trabajo/ia/${dirNombre}/plan-mejor.json y problemas.json.\n   Opciones: repetir con más rondas (--rondas 8) o un modelo más capaz (--modelo / OPENAI_MODEL_PLAN),\n   usar --emergencia (plan sencillo garantizado) o editar el plan a mano y validarlo con  npm run ia:validar`);
  }
  return { plan: elegido, resultado: res };
}

// ---------------------------------------------------------------------------
// 4. Activar + revisión visual
// ---------------------------------------------------------------------------
function activarProyecto(plan, proyecto) {
  writeFileSync(dato("plan.json"), JSON.stringify(plan, null, 2) + "\n");
  writeFileSync(dato("tema.json"), JSON.stringify(proyecto, null, 2) + "\n");
  const r = spawnSync(process.execPath, [p("scripts", "activar-tema.mjs"), "dinamico"], { cwd: RAIZ, stdio: "ignore" });
  if (r.status !== 0) sal(1, "❌ No pude activar el tema dinámico (scripts/activar-tema.mjs).");
}

async function etapaVision(g, palabras, proyecto, hecho) {
  let { plan, resultado } = hecho;
  if (cfg.maxRondasVision <= 0) return { plan, resultado, critica: null };
  hr("FASE 4 · Revisión visual con un modelo de visión");
  let ultima = null;
  for (let ronda = 1; ronda <= cfg.maxRondasVision; ronda++) {
    activarProyecto(plan, proyecto);
    info(`   📸 Renderizando capturas reales (ronda ${ronda})…`);
    const capturas = await renderizarCapturas(plan, palabras);
    if (!capturas?.length) { info("   ⚠ No pude renderizar capturas (¿memoria?). Salto la revisión visual."); break; }
    const dirCap = join(DIR, `capturas-${ronda}`);
    mkdirSync(dirCap, { recursive: true });
    capturas.forEach((c, i) => copyFileSync(c.archivo, join(dirCap, `${String(i + 1).padStart(2, "0")}-${c.escena}.jpg`)));

    let critica;
    try {
      critica = await llamar("crítica visual", { rol: "vision", nombre: "critica", esquema: esquemaCritica, instrucciones: sistemaCritica(), maxSalida: 32000, imagenes: capturas.map((c) => ({ dataUrl: c.dataUrl, detalle: "high" })), entrada: entradaCritica({ guion: g.guion, plan, capturas }) });
    } catch (e) {
      if (e instanceof ErrorApi && !e.fatal) { info(`   ⚠ La revisión visual falló (${e.message.slice(0, 100)}); sigo sin ella.`); break; }
      throw e;
    }
    ultima = critica;
    guardarJson(`critica-${ronda}.json`, critica);
    const graves = critica.problemas.filter((x) => x.gravedad === "alta");
    const medios = critica.problemas.filter((x) => x.gravedad === "media");
    info(`   👁 ${graves.length} grave(s), ${medios.length} media(s), ${critica.problemas.length - graves.length - medios.length} leve(s).`);
    for (const x of critica.problemas.filter((y) => y.gravedad !== "baja").slice(0, 8)) info(`      [${x.gravedad}] ${x.escena}: ${x.descripcion.slice(0, 150)}`);
    if (!graves.length && medios.length < 3) break;
    if (ronda === cfg.maxRondasVision) { info("   ℹ Se agotaron las rondas visuales; dejo el plan como está."); break; }

    const txt = critica.problemas.filter((x) => x.gravedad !== "baja").map((x) => `[${x.gravedad}] escena ${x.escena} (${x.tipo}): ${x.descripcion} → ${x.arreglo}`).join("\n");
    const nuevo = await repararPlan(g, palabras, proyecto, plan, resumirProblemas(resultado, 20), txt);
    const r2 = await validarPlan(nuevo, palabras);
    info(`   ▸ plan corregido: ${resumen(r2)}`);
    if (r2.ok && puntuacion(r2) <= puntuacion(resultado) + 3) { plan = nuevo; resultado = r2; guardarJson("plan.json", plan); }
    else { info("   ↩ La corrección empeora el plan: me quedo con el anterior."); break; }
  }
  return { plan, resultado, critica: ultima };
}

// ---------------------------------------------------------------------------
// 5. Post
// ---------------------------------------------------------------------------
async function etapaPost(g) {
  hr("FASE 5 · Texto del post");
  const post = await llamar("texto del post", { rol: "general", nombre: "post", esquema: esquemaPost, instrucciones: sistemaPost(), maxSalida: 16000, entrada: entradaPost({ titulo: g.titulo, guion: g.guion }) });
  const base = ["#medicina", "#fisiologia", "#anatomia", "#salud", "#estudiantesdemedicina"];
  const tags = [];
  for (const h of [...post.hashtags, ...base]) {
    const t = "#" + norm(String(h).replace(/^#/, ""));
    if (t.length > 2 && !tags.includes(t)) tags.push(t);
    if (tags.length === 5) break;
  }
  const texto = `${post.descripcion.trim()}\n\n${tags.join(" ")}\n`;
  writeFileSync(dato("post.txt"), texto);
  info(texto);
  return texto;
}

// ---------------------------------------------------------------------------
// Informe para el humano
// ---------------------------------------------------------------------------
function escribirInforme(g, hecho, critica, emergencia) {
  const l = [];
  l.push(`# ${g.titulo}\n`, `Proyecto: \`${g.proyectoId}\` · ${g.etiqueta}\n`, "## Guion\n", g.guion + "\n");
  l.push("## Verificación médica (hecha por el modelo: revísala tú)\n");
  for (const v of g.verificacion ?? []) l.push(`- **${v.certeza}** — ${v.afirmacion}. _${v.nota}_`);
  if (g.simplificaciones?.length) l.push("\nSimplificaciones: " + g.simplificaciones.join("; "));
  if (g.revision?.problemas?.length) {
    l.push("\n### Observaciones del revisor médico\n");
    for (const x of g.revision.problemas) l.push(`- (${x.tipo}) «${x.fragmento}» → ${x.correccion}`);
  }
  l.push("\n## Plan de escenas\n", `Validador: ${resumen(hecho.resultado)}${emergencia ? " · **PLAN DE EMERGENCIA**" : ""}\n`);
  for (const e of hecho.plan.escenas) l.push(`- **${e.id}** «${e.titulo}» (${e.elementos.length} elementos)`);
  if (hecho.resultado.avisos.length) l.push("\nAvisos pendientes:\n" + hecho.resultado.avisos.map((a) => `- [${a.escena ?? "general"}] ${a.mensaje}`).join("\n"));
  if (critica) l.push("\n## Última revisión visual\n", critica.aprobado ? "Aprobada." : critica.problemas.map((x) => `- [${x.gravedad}] ${x.escena}: ${x.descripcion}`).join("\n"));
  l.push(`\n## Consumo\n\n${cl.uso.llamadas} llamadas · ${cl.uso.entrada} tokens de entrada · ${cl.uso.salida} de salida.`);
  writeFileSync(join(DIR, "informe.md"), l.join("\n") + "\n");
}

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------
async function main() {
  let g;
  let palabras;
  if (soloPlan) {
    if (!existsSync(dato("guion.txt")) || !existsSync(dato("timestamps.json"))) sal(2, "❌ --solo-plan necesita src/data/guion.txt y timestamps.json (ejecuta antes  npm run voz).");
    const guion = limpiarGuion(readFileSync(dato("guion.txt"), "utf8"));
    const t = existsSync(dato("tema.json")) ? JSON.parse(readFileSync(dato("tema.json"), "utf8")) : {};
    g = { proyectoId: args.id ? slug(args.id) : t.id ?? "video", etiqueta: t.etiqueta ?? "MEDICINA", titulo: t.titulo ?? guion.split(/(?<=[?.!])\s/)[0], guion, verificacion: [], simplificaciones: [] };
    palabras = JSON.parse(readFileSync(dato("timestamps.json"), "utf8"));
    info(`📄 Guion de src/data (${contarPalabras(guion)} palabras) · ${palabras.length} palabras con tiempos`);
  } else {
    g = await etapaGuion();
    guardarJson("guion.json", g);
    writeFileSync(join(DIR, "guion.txt"), g.guion + "\n");
    if (args["solo-guion"]) {
      info(`\n✅ Guion aprobado y guardado en trabajo/ia/${dirNombre}/guion.json. Siguiente: repite sin --solo-guion (con --reanudar para reutilizarlo).`);
      return;
    }
    palabras = etapaVoz(g);
  }
  const proyecto = { id: g.proyectoId, etiqueta: g.etiqueta, titulo: g.titulo };

  let hecho = await etapaPlan(g, palabras, proyecto);
  guardarJson("plan.json", hecho.plan);
  activarProyecto(hecho.plan, proyecto);

  let critica = null;
  if (!hecho.emergencia) {
    const v = await etapaVision(g, palabras, proyecto, hecho);
    hecho = { ...hecho, plan: v.plan, resultado: v.resultado };
    critica = v.critica;
  }
  guardarJson("plan.json", hecho.plan);
  activarProyecto(hecho.plan, proyecto);

  const post = soloPlan && existsSync(dato("post.txt")) ? null : await etapaPost(g);
  void post;
  escribirInforme(g, hecho, critica, hecho.emergencia);

  hr("LISTO");
  info(`✅ Proyecto "${proyecto.id}" preparado: guion, voz, plan (${resumen(hecho.resultado)}) y post.`);
  info(`   Informe para revisar (incluye la verificación médica): trabajo/ia/${dirNombre}/informe.md`);
  info(`   Tokens: ${cl.uso.llamadas} llamadas · ${cl.uso.entrada} entrada · ${cl.uso.salida} salida`);

  if (args.render) {
    hr("FASES 4–5 · QA completo + render + entregables");
    const r = spawnSync(process.execPath, [p("scripts", "producir.mjs"), "--sin-voz"], { cwd: RAIZ, stdio: "inherit" });
    if (r.status !== 0) sal(r.status ?? 1, "❌ El render no terminó. Vuelve a lanzar:  npm run producir -- --sin-voz   (es reanudable)");
    spawnSync(process.execPath, [p("scripts", "proyecto.mjs"), "guardar"], { cwd: RAIZ, stdio: "inherit" });
    info("\n🎬 Video listo en trabajo/salida/video-terminado.mp4 (con portada.jpg y texto-del-post.txt)");
  } else {
    info("\n   Siguiente paso (QA completo + render ≈ 25 min + portada):   npm run producir -- --sin-voz");
    info("   Para ver las escenas antes:                                   npm start");
  }
}

try {
  await main();
} catch (e) {
  if (e instanceof ErrorApi) sal(1, `❌ Error de la API de OpenAI${e.status ? ` (${e.status})` : ""}: ${e.message}`);
  throw e;
} finally {
  if (mock) await mock.cerrar();
}
