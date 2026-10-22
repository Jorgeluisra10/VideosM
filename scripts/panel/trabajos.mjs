/**
 * Panel · gestor de trabajos: ejecuta UN script a la vez (Chrome se cae si hay dos renders/QA simultáneos),
 * guarda su salida línea a línea y la reparte por SSE a las pantallas abiertas.
 *
 * Un trabajo es una cadena de pasos [{ titulo, cmd: [script, ...args] }]; si un paso falla, la cadena se detiene.
 */
import { spawn, spawnSync } from "node:child_process";
import { EventEmitter } from "node:events";
import { RAIZ } from "../ia/puente.mjs";

const MAX_LINEAS = 4000;
export const bus = new EventEmitter();
bus.setMaxListeners(50);

let actual = null; // trabajo en curso o el último terminado
let secuencia = 0;

/** Avisos de Remotion sobre la memoria de Docker/cgroups: ensucian el registro y no son accionables. */
const RUIDO = /CGroup|MemAvailable|--memory flag|differing memory amounts|lower amount of memory/;
const limpiarAnsi = (s) => s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "").replace(/\r/g, "");

/** Foto del trabajo para la interfaz (sin el proceso). */
export function instantanea(j = actual) {
  if (!j) return null;
  const { id, nombre, titulo, estado, inicio, fin, codigo, paso, pasos, progreso, resumen } = j;
  return { id, nombre, titulo, estado, inicio, fin, codigo, paso, pasos: pasos.map((p) => p.titulo), progreso, resumen };
}
export const lineasDe = (desde = 0) => (actual ? actual.lineas.slice(desde) : []);
export const hayTrabajo = () => actual?.estado === "corriendo";
export const trabajoActual = () => actual;

function emitir(j, tipo, datos) {
  bus.emit("evento", { tipo, ...datos, job: instantanea(j) });
}

/** Mata el proceso y sus hijos (en Windows hace falta taskkill /T). */
function matar(proc) {
  if (!proc || proc.killed) return;
  try {
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(proc.pid), "/T", "/F"]);
    else {
      process.kill(-proc.pid, "SIGTERM");
      setTimeout(() => {
        try { process.kill(-proc.pid, "SIGKILL"); } catch { /* ya terminó */ }
      }, 4000).unref();
    }
  } catch {
    try { proc.kill("SIGKILL"); } catch { /* ya terminó */ }
  }
}

/**
 * Lanza una cadena de pasos. Devuelve la instantánea o lanza Error si ya hay un trabajo en curso.
 * @param {{nombre:string, titulo:string, pasos:{titulo:string, cmd:string[], env?:Record<string,string>, alOk?:(j)=>void}[], alTerminar?:(j)=>void}} def
 * `alOk` de un paso se llama cuando ese paso termina con código 0; `alTerminar` al final de toda la cadena (bien o mal).
 */
export function lanzar(def) {
  if (hayTrabajo()) throw Object.assign(new Error(`Ya hay un trabajo en curso («${actual.titulo}»). Espera a que termine o cancélalo.`), { codigo: 409 });
  const j = { id: ++secuencia, nombre: def.nombre, titulo: def.titulo, estado: "corriendo", inicio: Date.now(), fin: null, codigo: null, paso: 0, pasos: def.pasos, lineas: [], progreso: null, resumen: null, proc: null, cancelado: false, alTerminar: def.alTerminar };
  actual = j;
  emitir(j, "inicio", {});

  const log = (texto, tipo = "out") => {
    for (const crudo of String(texto).split("\n")) {
      const l = limpiarAnsi(crudo);
      if (!l.trim()) continue;
      if (RUIDO.test(l)) continue;
      j.lineas.push({ t: Date.now(), tipo, l });
      if (j.lineas.length > MAX_LINEAS) j.lineas.splice(0, j.lineas.length - MAX_LINEAS);
      const m = l.match(/✔\s*(\d+)\/(\d+)\s*\((\d+)\s*%\)/); // render: «✔ 300/2200 (14 %)»
      if (m) { j.progreso = Number(m[3]); emitir(j, "progreso", {}); }
      bus.emit("evento", { tipo: "linea", linea: { t: Date.now(), tipo, l }, job: instantanea(j) });
    }
  };
  j.log = log;

  const correr = (i) => {
    if (j.cancelado) return terminar(j, 130);
    const paso = j.pasos[i];
    j.paso = i;
    j.progreso = null;
    log(`\n▶ ${j.pasos.length > 1 ? `Paso ${i + 1}/${j.pasos.length} · ` : ""}${paso.titulo}`, "paso");
    emitir(j, "paso", {});
    const [script, ...args] = paso.cmd;
    const proc = spawn(process.execPath, [script, ...args], { cwd: RAIZ, env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1", ...(paso.env ?? {}) }, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"] });
    j.proc = proc;
    proc.stdout.on("data", (d) => log(d.toString()));
    proc.stderr.on("data", (d) => log(d.toString(), "err"));
    proc.on("error", (e) => { log(`No pude lanzar el proceso: ${e.message}`, "err"); terminar(j, 1); });
    proc.on("close", (codigo) => {
      if (j.estado !== "corriendo") return;
      if (codigo !== 0) return terminar(j, codigo ?? 1);
      try { paso.alOk?.(j); } catch (e) { log(`(el paso terminó bien pero no pude anotarlo: ${e.message})`, "err"); }
      if (i + 1 < j.pasos.length) return correr(i + 1);
      terminar(j, 0);
    });
  };
  correr(0);
  return instantanea(j);
}

function terminar(j, codigo) {
  if (j.estado !== "corriendo") return;
  j.codigo = codigo;
  j.fin = Date.now();
  j.estado = j.cancelado ? "cancelado" : codigo === 0 ? "ok" : "error";
  j.proc = null;
  const seg = Math.round((j.fin - j.inicio) / 1000);
  j.log(j.estado === "ok" ? `\n✅ Terminado en ${seg} s` : j.estado === "cancelado" ? "\n⏹ Cancelado" : `\n❌ Terminó con error (código ${codigo}) tras ${seg} s`, j.estado === "ok" ? "ok" : "err");
  try { j.alTerminar?.(j); } catch (e) { j.log(`(alTerminar falló: ${e.message})`, "err"); }
  emitir(j, "fin", {});
}

export function cancelar() {
  if (!hayTrabajo()) return false;
  actual.cancelado = true;
  matar(actual.proc);
  setTimeout(() => terminar(actual, 130), 6000).unref(); // por si el proceso no avisa
  return true;
}

/** Servicios de larga duración (Remotion Studio): no bloquean los trabajos. */
const servicios = new Map();
export function estadoServicio(nombre) {
  const s = servicios.get(nombre);
  return s ? { activo: true, desde: s.desde, url: s.url } : { activo: false };
}
export function iniciarServicio(nombre, cmd, { url, env } = {}) {
  if (servicios.has(nombre)) return estadoServicio(nombre);
  const [script, ...args] = cmd;
  const proc = spawn(process.execPath, [script, ...args], { cwd: RAIZ, env: { ...process.env, FORCE_COLOR: "0", ...(env ?? {}) }, detached: process.platform !== "win32", stdio: "ignore" });
  const s = { proc, desde: Date.now(), url };
  servicios.set(nombre, s);
  proc.on("close", () => { servicios.delete(nombre); bus.emit("evento", { tipo: "servicio", nombre, servicio: { activo: false } }); });
  bus.emit("evento", { tipo: "servicio", nombre, servicio: estadoServicio(nombre) });
  return estadoServicio(nombre);
}
export function detenerServicio(nombre) {
  const s = servicios.get(nombre);
  if (!s) return false;
  matar(s.proc);
  return true;
}
export function detenerTodo() {
  cancelar();
  for (const n of [...servicios.keys()]) detenerServicio(n);
}
