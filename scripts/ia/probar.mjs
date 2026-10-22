#!/usr/bin/env node
/**
 * Batería de pruebas del agente de IA SIN gastar nada: usa el servidor simulado de OpenAI.
 *   npm run ia:prueba                 (≈ 30 s, no abre Chrome)
 *   npm run ia:prueba -- --con-vision (añade una ronda real de capturas + crítica; ≈ 2 min, necesita memoria libre)
 *
 * Comprueba: esquemas estrictos, validador, elección de modelo, y el agente completo ante guion corto,
 * revisor que corrige, plan defectuoso que se repara, servidor sin /responses, errores 429, falta de visto
 * bueno, plan imposible (código 4), plan de emergencia, guion propio, --solo-plan y --reanudar.
 * Al terminar restaura el proyecto que tenías activo.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ordenarCandidatos } from "./cliente.mjs";
import { construirEsquemaPlan, esquemaCritica, esquemaGuion, esquemaPost, esquemaRevision } from "./esquemas.mjs";
import { comprobarEstricto, validarEsquema } from "./mock-server.mjs";
import { limpiarNulos } from "./plan-util.mjs";
import { RAIZ } from "./puente.mjs";
import { validarPlan } from "./validar-plan.mjs";

const conVision = process.argv.includes("--con-vision");
const p = (...x) => join(RAIZ, ...x);
let pasadas = 0;
const falladas = [];
const prueba = (nombre, cond, detalle = "") => {
  if (cond) { pasadas++; console.log(`  ✅ ${nombre}`); }
  else { falladas.push(nombre); console.log(`  ❌ ${nombre}${detalle ? `\n       ${detalle}` : ""}`); }
};

// ---------------------------------------------------------------- copia de seguridad del proyecto activo
const ACTIVOS = ["src/data/guion.txt", "src/data/timestamps.json", "src/data/meta.json", "src/data/tema.json", "src/data/post.txt", "src/data/plan.json", "src/tema.ts", "src/sonido.ts"];
const copia = p("trabajo", "tmp", "probar-respaldo");
rmSync(copia, { recursive: true, force: true });
mkdirSync(copia, { recursive: true });
for (const f of ACTIVOS) if (existsSync(p(f))) copyFileSync(p(f), join(copia, f.replace(/\//g, "__")));
const restaurar = () => {
  for (const f of ACTIVOS) {
    const c = join(copia, f.replace(/\//g, "__"));
    if (existsSync(c)) copyFileSync(c, p(f));
  }
  for (const d of readdirSync(p("trabajo", "ia"), { withFileTypes: true })) if (d.isDirectory() && d.name.startsWith("prueba-")) rmSync(p("trabajo", "ia", d.name), { recursive: true, force: true });
};

try {
  // ------------------------------------------------------------ unitarias
  console.log("\nUnitarias");
  for (const [n, s] of Object.entries({ guion: esquemaGuion, revision: esquemaRevision, post: esquemaPost, critica: esquemaCritica, plan: construirEsquemaPlan() })) {
    const e = comprobarEstricto(s, n);
    prueba(`esquema ${n} cumple el modo estricto`, e.length === 0, e[0]);
  }
  for (const ej of ["infarto-dolor-referido", "insulina-glucosa", "potencial-accion"]) {
    const d = p("ejemplos", ej);
    const r = await validarPlan(JSON.parse(readFileSync(join(d, "plan.json"), "utf8")), JSON.parse(readFileSync(join(d, "timestamps.json"), "utf8")));
    prueba(`ejemplo ${ej} pasa el validador sin errores ni avisos`, r.ok && r.avisos.length === 0, r.errores[0]?.mensaje ?? r.avisos[0]?.mensaje);
  }
  const roto = JSON.parse(readFileSync(p("ejemplos", "insulina-glucosa", "plan.json"), "utf8"));
  roto.escenas[2].elementos[0].cuando = "frase que nadie dice";
  roto.escenas[3].elementos.push({ tipo: "etiqueta", cuando: "receptor", x: 50, y: 50, texto: "A" }, { tipo: "etiqueta", cuando: "receptor", x: 50, y: 50, texto: "B" });
  const rr = await validarPlan(roto, JSON.parse(readFileSync(p("ejemplos", "insulina-glucosa", "timestamps.json"), "utf8")));
  prueba("el validador detecta un ancla inventada", rr.errores.some((e) => /no está en el guion|no coincide/.test(e.mensaje)));
  prueba("el validador detecta dos textos pisados", rr.errores.some((e) => /se pisan dos textos/i.test(e.mensaje)));
  prueba("limpiarNulos quita los null anidados", JSON.stringify(limpiarNulos({ a: 1, b: null, c: [{ d: null, e: 2 }] })) === '{"a":1,"c":[{"e":2}]}');
  const orden = ordenarCandidatos(["gpt-realtime-mini", "gpt-6-transcribe", "gpt-6-luna", "gpt-6-astra", "gpt-6.1-sol", "gpt-5.6-sol", "text-embedding-3-large", "gpt-4o", "gpt-6.1-sol-2026-09-29", "gpt-6-pro"]);
  prueba("la elección automática prefiere el modelo equilibrado más reciente", orden[0] === "gpt-6.1-sol", orden.join(", "));
  prueba("la elección automática descarta audio, embeddings y pro", !orden.some((m) => /realtime|transcribe|embedding|pro$/.test(m)), orden.join(", "));
  const ok1 = { type: "object", properties: { a: { type: "string", enum: ["x"] } }, required: ["a"], additionalProperties: false };
  prueba("el mini-validador de esquemas rechaza valores fuera del enum", validarEsquema({ a: "y" }, ok1).length === 1);

  // ------------------------------------------------------------ agente completo
  console.log("\nAgente completo (servidor simulado)");
  const ej = p("ejemplos", "insulina-glucosa");
  for (const f of ["guion.txt", "timestamps.json", "meta.json"]) copyFileSync(join(ej, f), p("src", "data", f));
  const tema = "Por qué la insulina baja el azúcar";
  const base = ["--prueba", "--sin-voz", "--sin-vision"];
  const agente = (extra, env = {}) => {
    const r = spawnSync(process.execPath, [p("scripts", "ia", "agente.mjs"), ...extra], { cwd: RAIZ, encoding: "utf8", env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"], timeout: 180000 });
    return { codigo: r.status, salida: `${r.stdout}\n${r.stderr}` };
  };
  const planActivo = () => JSON.parse(readFileSync(p("src", "data", "plan.json"), "utf8"));

  let r = agente([tema, ...base, "--si", "--id", "prueba-1"]);
  prueba("camino feliz: termina con código 0 y plan sin errores", r.codigo === 0 && /0 error\(es\), 0 aviso\(s\)/.test(r.salida), r.salida.slice(-400));
  prueba("camino feliz: escribe plan.json, tema.json y post.txt", existsSync(p("src", "data", "post.txt")) && planActivo().escenas.length >= 5 && JSON.parse(readFileSync(p("src", "data", "tema.json"), "utf8")).id === "prueba-1");
  prueba("camino feliz: el plan guardado no contiene null", !JSON.stringify(planActivo()).includes("null"));
  prueba("camino feliz: deja el tema dinámico activo", /scenes\/dinamico/.test(readFileSync(p("src", "tema.ts"), "utf8")));
  prueba("camino feliz: genera informe.md", existsSync(p("trabajo", "ia", "prueba-1", "informe.md")));

  r = agente([tema, ...base, "--si", "--id", "prueba-2"], { MOCK_GUION_CORTO: "1", MOCK_REVISION_FALLA: "1", MOCK_PLAN_ERRORES: "1", MOCK_SIN_RESPONSES: "1" });
  prueba("guion corto → pide ajuste de longitud", /pido ajuste/.test(r.salida));
  prueba("el revisor médico puede corregir el guion", /El revisor corrige el guion/.test(r.salida));
  prueba("plan defectuoso → bucle de reparación hasta 0 errores", /reparar plan/.test(r.salida) && /ronda 1: .*0 error\(es\)/.test(r.salida) && r.codigo === 0, r.salida.slice(-500));
  prueba("sin /responses → cae a chat/completions", /uso \/chat\/completions/.test(r.salida));

  r = agente([tema, ...base, "--si", "--id", "prueba-3"], { MOCK_ERRORES: "429:2" });
  prueba("errores 429 → reintenta y termina bien", /reintento 1\/4/.test(r.salida) && r.codigo === 0, r.salida.slice(-300));

  r = agente([tema, ...base, "--id", "prueba-4"]);
  prueba("sin --si y sin terminal: se detiene a pedir visto bueno (código 3)", r.codigo === 3 && /visto bueno/.test(r.salida));

  r = agente([tema, ...base, "--si", "--rondas", "1", "--id", "prueba-5"], { MOCK_PLAN_SIEMPRE_MAL: "1" });
  prueba("plan imposible: sale con código 4 y guarda plan-mejor.json", r.codigo === 4 && existsSync(p("trabajo", "ia", "prueba-5", "plan-mejor.json")), r.salida.slice(-300));

  r = agente([tema, ...base, "--si", "--rondas", "1", "--emergencia", "--id", "prueba-6"], { MOCK_PLAN_SIEMPRE_MAL: "1" });
  prueba("--emergencia: genera un plan sencillo que valida", r.codigo === 0 && /plan de emergencia/.test(r.salida), r.salida.slice(-300));
  const ts = JSON.parse(readFileSync(p("src", "data", "timestamps.json"), "utf8"));
  prueba("el plan de emergencia pasa el validador", (await validarPlan(planActivo(), ts)).ok);

  r = agente(["--guion", p("src", "data", "guion.txt"), ...base, "--id", "prueba-7"]);
  prueba("--guion: usa el guion del usuario sin pedir aprobación", r.codigo === 0 && /no se modificará/.test(r.salida), r.salida.slice(-300));

  r = agente(["--solo-plan", "--prueba", "--sin-vision", "--id", "prueba-8"]);
  prueba("--solo-plan: diseña escenas con el guion y la voz ya existentes", r.codigo === 0 && /Guion de src\/data/.test(r.salida), r.salida.slice(-300));

  r = agente(["--solo-plan", "--prueba", "--sin-vision", "--comentario", "pon la etiqueta más a la izquierda", "--id", "prueba-8b"]);
  prueba("--solo-plan --comentario: retoca el plan existente con tus indicaciones", r.codigo === 0 && /Retoco el plan actual/.test(r.salida) && /reparar plan/.test(r.salida), r.salida.slice(-300));

  agente([tema, ...base, "--si", "--solo-guion", "--id", "prueba-9"]);
  r = agente([tema, ...base, "--si", "--reanudar", "--id", "prueba-9"]);
  prueba("--reanudar reutiliza el guion aprobado", /Reutilizo el guion aprobado/.test(r.salida) && r.codigo === 0, r.salida.slice(-300));

  if (conVision) {
    console.log("\nRevisión visual (renderiza capturas reales; tarda)");
    r = agente([tema, "--prueba", "--sin-voz", "--si", "--id", "prueba-10"], { MOCK_CRITICA: "1" });
    prueba("visión: capturas → crítica grave → reparación → segunda ronda aprobada", /1 grave\(s\)/.test(r.salida) && /plan corregido/.test(r.salida) && /0 grave\(s\)/.test(r.salida) && r.codigo === 0, r.salida.slice(-600));
  }
} finally {
  restaurar();
}

console.log(`\n${falladas.length ? "❌" : "✅"} ${pasadas} pruebas correctas, ${falladas.length} fallidas${falladas.length ? ": " + falladas.join(" · ") : ""}`);
console.log("   (se restauró el proyecto que tenías activo)");
process.exit(falladas.length ? 1 : 0);
