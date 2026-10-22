#!/usr/bin/env node
/**
 * Comprueba que este ordenador y tu cuenta de OpenAI están listos para producir videos.
 *   npm run ia:diagnostico              (usa tu .env)
 *   npm run ia:diagnostico -- --prueba  (contra el servidor simulado: no necesita clave)
 *   npm run ia:diagnostico -- --sin-api (solo el ordenador, sin llamar a OpenAI)
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { Cliente, ErrorApi, ordenarCandidatos } from "./cliente.mjs";
import { configuracion, enmascarar } from "./entorno.mjs";
import { construirEsquemaPlan, contarPropiedades, esquemaCritica, esquemaGuion, esquemaPost, esquemaRevision, objeto } from "./esquemas.mjs";
import { comprobarEstricto, iniciarMock } from "./mock-server.mjs";
import { RAIZ } from "./puente.mjs";
import { validarPlan } from "./validar-plan.mjs";

const args = new Set(process.argv.slice(2));
let fallos = 0;
let avisos = 0;
const ok = (m) => console.log(`  ✅ ${m}`);
const aviso = (m) => { avisos++; console.log(`  ⚠️  ${m}`); };
const mal = (m) => { fallos++; console.log(`  ❌ ${m}`); };
const seccion = (t) => console.log(`\n${t}`);

// ---------------------------------------------------------------- ordenador
seccion("Ordenador");
const [mayor] = process.versions.node.split(".").map(Number);
mayor >= 18 ? ok(`Node ${process.versions.node}`) : mal(`Node ${process.versions.node}: hace falta 18 o superior (https://nodejs.org)`);
console.log(`     ${os.platform()} ${os.arch()} · ${(os.totalmem() / 2 ** 30).toFixed(1)} GB de RAM`);
existsSync(join(RAIZ, "node_modules", "remotion")) ? ok("Dependencias instaladas (node_modules)") : mal("Faltan dependencias: ejecuta  npm install");
try {
  const v = JSON.parse(readFileSync(join(RAIZ, "node_modules", "remotion", "package.json"), "utf8")).version;
  v === "4.0.536" ? ok(`Remotion ${v}`) : aviso(`Remotion ${v} (el proyecto está probado con 4.0.536)`);
} catch { /* ya avisado arriba */ }

// Python se comprueba en un proceso aparte: en algunos Windows, lanzar `py`/`python` y después otro proceso
// desde el MISMO Node aborta con "AssignProcessToJobObject: (87)". Así el diagnóstico no se corta.
const sondaPython = `
const { spawnSync } = require("node:child_process");
let py = null;
for (const c of [["py", "-3"], ["python"], ["python3"]]) {
  const r = spawnSync(c[0], [...c.slice(1), "-c", "import sys;print(sys.version_info[0])"], { encoding: "utf8" });
  if (r.status === 0 && r.stdout.trim() === "3") { py = c; break; }
}
const edge = py ? spawnSync(py[0], [...py.slice(1), "-c", "import edge_tts"]).status === 0 : false;
console.log(JSON.stringify({ py, edge }));`;
const sonda = spawnSync(process.execPath, ["-e", sondaPython], { encoding: "utf8" });
let py = null;
let edge = false;
try { ({ py, edge } = JSON.parse(sonda.stdout.trim().split("\n").pop())); } catch { /* sin Python */ }
if (!py) mal("No encuentro Python 3 (hace falta solo para la voz gratuita edge-tts): https://www.python.org/downloads/");
else {
  ok(`Python 3 (${py.join(" ")})`);
  edge ? ok("edge-tts instalado") : aviso("edge-tts no está instalado: se instalará solo la primera vez que generes una voz (pip install edge-tts)");
}
existsSync(join(RAIZ, "public", "fonts")) ? ok("Tipografía local (public/fonts)") : mal("Falta public/fonts");

// ---------------------------------------------------------------- motor
seccion("Motor de escenas y esquemas");
const esq = { guion: esquemaGuion, revision: esquemaRevision, post: esquemaPost, critica: esquemaCritica, plan: construirEsquemaPlan(), prueba: objeto({ ok: { type: "boolean" } }) };
for (const [n, s] of Object.entries(esq)) {
  const e = comprobarEstricto(s, n);
  if (e.length) mal(`Esquema "${n}" no es estricto: ${e[0]}`);
}
ok(`Esquemas estrictos correctos (el del plan: ${contarPropiedades(esq.plan)} propiedades, ${(JSON.stringify(esq.plan).length / 1024).toFixed(0)} KB)`);
for (const ej of ["infarto-dolor-referido", "insulina-glucosa", "potencial-accion"]) {
  const d = join(RAIZ, "ejemplos", ej);
  if (!existsSync(join(d, "plan.json"))) { aviso(`Falta el ejemplo ${ej}`); continue; }
  const r = await validarPlan(JSON.parse(readFileSync(join(d, "plan.json"), "utf8")), JSON.parse(readFileSync(join(d, "timestamps.json"), "utf8")));
  r.ok ? ok(`Validador: ejemplo ${ej} → ${r.errores.length} errores, ${r.avisos.length} avisos`) : mal(`Validador: el ejemplo ${ej} falla (${r.errores[0]?.mensaje})`);
}

if (args.has("--sin-api")) {
  console.log(`\n${fallos ? "❌" : "✅"} ${fallos} fallo(s), ${avisos} aviso(s) (sin probar la API)`);
  process.exit(fallos ? 1 : 0);
}

// ---------------------------------------------------------------- API
seccion("API de OpenAI");
let mock = null;
const cfg = configuracion();
if (args.has("--prueba")) {
  mock = await iniciarMock(0);
  cfg.url = mock.url;
  cfg.clave ||= "prueba";
  aviso(`Modo prueba: servidor simulado (${mock.url}); esto NO demuestra que tu clave funcione.`);
}
if (!cfg.clave) {
  mal("No hay OPENAI_API_KEY. Copia .env.example a .env y pon tu clave (https://platform.openai.com/api-keys).");
  console.log(`\n❌ ${fallos} fallo(s), ${avisos} aviso(s)`);
  process.exit(1);
}
ok(`Clave ${enmascarar(cfg.clave)} · URL ${cfg.url}`);
const log = (m) => console.log("     " + m.trim());
const cl = new Cliente({ ...cfg, timeoutS: Math.min(cfg.timeoutS, 120) }, { log });
try {
  const ids = await cl.listarModelos();
  ok(`GET /models responde: ${ids.length} modelos`);
  const orden = ordenarCandidatos(ids);
  console.log(`     candidatos (mejor primero): ${orden.slice(0, 6).join(", ") || "(ninguno reconocido)"}`);
  for (const rol of ["general", "plan", "vision", "revisor"]) console.log(`     ${rol.padEnd(8)} → ${(await cl.candidatos(rol))[0]}`);
  if (!orden.length && !cfg.modelo) aviso("No reconozco ningún modelo gpt-N en tu cuenta: fija OPENAI_MODEL en .env.");

  const r = await cl.pedir({ rol: "general", nombre: "prueba", esquema: esq.prueba, instrucciones: "Responde con ok=true.", entrada: "Prueba de conexión.", maxSalida: 8000 });
  r.datos?.ok === true ? ok(`Salida estructurada (JSON Schema estricto) funciona con ${r.modelo} · ${r.ms} ms`) : mal("El modelo respondió, pero sin cumplir el esquema.");

  const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  const v = await cl.pedir({ rol: "vision", nombre: "prueba", esquema: esq.prueba, instrucciones: "Responde con ok=true si recibes una imagen.", entrada: "¿Hay una imagen adjunta?", imagenes: [{ dataUrl: `data:image/png;base64,${png}`, detalle: "low" }], maxSalida: 8000 });
  v.datos?.ok === true ? ok(`Entrada de imágenes (revisión visual) funciona con ${v.modelo}`) : aviso("El modelo no confirmó la imagen; la revisión visual podría no ser fiable (usa --sin-vision o fija OPENAI_MODEL_VISION).");
  console.log(`     uso de la prueba: ${cl.uso.llamadas} llamadas · ${cl.uso.entrada}→${cl.uso.salida} tokens`);
} catch (e) {
  if (e instanceof ErrorApi) mal(`${e.message}${e.status ? ` (HTTP ${e.status})` : ""}`);
  else mal(String(e?.stack ?? e));
}
if (mock) await mock.cerrar();
console.log(`\n${fallos ? "❌" : "✅"} ${fallos} fallo(s), ${avisos} aviso(s)${fallos ? "" : " — todo listo:  npm run ia -- \"tu tema\""}`);
process.exit(fallos ? 1 : 0);
