#!/usr/bin/env node
/**
 * VideMed · PANEL (interfaz web local para usar TODO el sistema sin tocar la terminal).
 *
 *   npm run panel                  → http://localhost:4173
 *   npm run panel -- --abrir       (abre el navegador)   ·   --puerto 5000
 *
 * Es un servidor local sin dependencias (solo Node): sirve la interfaz (scripts/panel/web), expone una API JSON
 * y ejecuta los mismos scripts de siempre (voz, agente de IA, plantilla, QA, render…) mostrando su salida en vivo.
 * Escucha SOLO en 127.0.0.1: nadie de tu red puede usarlo. Las claves de .env no salen nunca del servidor.
 */
import { spawn, spawnSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { cargarEnv } from "../ia/entorno.mjs";
import { PERFIL_BASE, cargarPerfil, listarPerfiles, paletas, slug } from "../ia/perfil.mjs";
import { RAIZ } from "../ia/puente.mjs";
import { cargarNucleoAnim, compilarNucleo } from "../anim/nucleo.mjs";
import { archivosDoc, entorno, guardarAjustes, leerAjustes, probar } from "./ajustes.mjs";
import { activarBorrador, borrarMedio, borrarProyecto, dirArchivo, dirProyecto, dirTrabajoIa, estadoProyecto, existeProyecto, guardarBriefProyecto, guardarMedio, guionDe, importarEjemplo, leerBriefProyecto, listarArchivo, listarEjemplos, listarMediosProyecto, listarProyectos, marcarEtapa, nombreSeguro, resumenActivo, temaActivoJson } from "./proyectos.mjs";
import { bus, cancelar, detenerServicio, detenerTodo, estadoServicio, hayTrabajo, instantanea, iniciarServicio, lanzar, lineasDe } from "./trabajos.mjs";

cargarEnv();
const WEB = join(dirname(fileURLToPath(import.meta.url)), "web");
const salida = (...p) => join(RAIZ, "trabajo", "salida", ...p);
const script = (...p) => join(RAIZ, "scripts", ...p);
const dato = (n) => join(RAIZ, "src", "data", n);

const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".txt": "text/plain; charset=utf-8", ".md": "text/markdown; charset=utf-8", ".ico": "image/x-icon" };

// ---------------------------------------------------------------------------
// Utilidades HTTP
// ---------------------------------------------------------------------------
const json = (res, codigo, obj) => {
  const cuerpo = JSON.stringify(obj);
  res.writeHead(codigo, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Length": Buffer.byteLength(cuerpo) });
  res.end(cuerpo);
};
const error = (res, codigo, mensaje, extra = {}) => json(res, codigo, { error: mensaje, ...extra });

function leerCuerpo(req, limite = 60 * 1024 * 1024) {
  return new Promise((ok, mal) => {
    const trozos = [];
    let n = 0;
    req.on("data", (c) => {
      n += c.length;
      if (n > limite) {
        mal(Object.assign(new Error(`El archivo supera el límite de ${Math.round(limite / 1048576)} MB.`), { codigo: 413 }));
        req.destroy();
      } else trozos.push(c);
    });
    req.on("end", () => ok(Buffer.concat(trozos)));
    req.on("error", mal);
  });
}
const leerJson = async (req) => {
  const b = await leerCuerpo(req, 8 * 1024 * 1024);
  if (!b.length) return {};
  try {
    return JSON.parse(b.toString("utf8"));
  } catch {
    throw Object.assign(new Error("El cuerpo no es un JSON válido."), { codigo: 400 });
  }
};

/** Sirve un archivo con soporte de Range (necesario para mover el cursor de <video> y <audio>). */
function servirArchivo(req, res, ruta, { descarga = false } = {}) {
  let st;
  try {
    st = statSync(ruta);
    if (!st.isFile()) throw new Error();
  } catch {
    return error(res, 404, "No existe ese archivo.");
  }
  const tipo = TIPOS[extname(ruta).toLowerCase()] ?? "application/octet-stream";
  const cab = { "Content-Type": tipo, "Accept-Ranges": "bytes", "Cache-Control": "no-cache", ...(descarga ? { "Content-Disposition": `attachment; filename="${ruta.split(sep).pop()}"` } : {}) };
  const rango = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
  if (rango && (rango[1] || rango[2])) {
    let ini = rango[1] ? Number(rango[1]) : Math.max(0, st.size - Number(rango[2]));
    let fin = rango[1] && rango[2] ? Number(rango[2]) : st.size - 1;
    fin = Math.min(fin, st.size - 1);
    if (ini > fin || ini >= st.size) {
      res.writeHead(416, { "Content-Range": `bytes */${st.size}` });
      return res.end();
    }
    res.writeHead(206, { ...cab, "Content-Range": `bytes ${ini}-${fin}/${st.size}`, "Content-Length": fin - ini + 1 });
    return createReadStream(ruta, { start: ini, end: fin }).pipe(res);
  }
  res.writeHead(200, { ...cab, "Content-Length": st.size });
  if (req.method === "HEAD") return res.end();
  createReadStream(ruta).pipe(res);
}

/** Une una ruta relativa a una carpeta base impidiendo salir de ella (../). */
function dentro(base, rel) {
  const r = resolve(base, normalize(decodeURIComponent(rel)).replace(/^([/\\])+/, ""));
  return r === resolve(base) || r.startsWith(resolve(base) + sep) ? r : null;
}

// ---------------------------------------------------------------------------
// Información de perfiles
// ---------------------------------------------------------------------------
const infoPerfil = (p) => ({
  id: p.id,
  nombre: p.nombre,
  descripcion: p.descripcion,
  icono: p.icono,
  locale: p.locale ?? null,
  duracion: p.duracion,
  palabras: p.palabras,
  tonos: p.tonos ?? [],
  paleta: p.paleta,
  voz: p.voz,
  velocidad: p.velocidad,
  voces: p.voces ?? null,
  campos: p.campos ?? [],
  plantilla: p.plantilla ?? null,
  revision: p.revision ?? null,
  transicion: p.marca?.transicion ?? "zoom",
});

// ---------------------------------------------------------------------------
// Acciones (cada una = un trabajo que ejecuta scripts del proyecto)
// ---------------------------------------------------------------------------
const agente = script("ia", "agente.mjs");
const claveOpenAI = () => Boolean((process.env.OPENAI_API_KEY ?? "").trim());

function pedir(cond, mensaje, codigo = 400) {
  if (!cond) throw Object.assign(new Error(mensaje), { codigo });
}

/** Argumentos de voz a partir de las opciones del panel. */
function argsVoz(o = {}, perfilId) {
  const a = [];
  if (o.modo) a.push("--mode", String(o.modo));
  if (o.proveedor) a.push("--proveedor", String(o.proveedor));
  if (o.voz) a.push(o.modo === "prod" && o.proveedor !== "elevenlabs" ? "--voz-prod" : "--voz", String(o.voz));
  if (o.velocidad && o.modo !== "prod") a.push("--velocidad", String(o.velocidad));
  if (o.instrucciones && o.modo === "prod" && o.proveedor !== "elevenlabs") a.push("--instrucciones", String(o.instrucciones));
  if (perfilId) a.push("--perfil", perfilId);
  return a;
}

function leerQa() {
  try {
    return JSON.parse(readFileSync(salida("qa", "informe.json"), "utf8"));
  } catch {
    return null;
  }
}

/** Construye la definición de trabajo para una acción; lanza Error con .codigo si falta algo. */
function definirAccion(nombre, id, o = {}) {
  const necesitaProyecto = !["ia-diagnostico", "sfx", "pruebas"].includes(nombre);
  let brief = null;
  let perfil = null;
  if (necesitaProyecto) {
    pedir(id && existeProyecto(id), "Elige o crea un proyecto primero.", 404);
    brief = leerBriefProyecto(id);
    perfil = cargarPerfil(brief.perfil ?? PERFIL_BASE);
  }
  const dir = necesitaProyecto ? dirProyecto(id) : null;
  const base = necesitaProyecto ? ["--brief", dir, "--nicho", perfil.id] : [];
  const marca = (etapa, extra) => () => marcarEtapa(id, etapa, typeof extra === "function" ? extra() : extra);
  const pasoEscenasIA = () => {
    pedir(claveOpenAI() || o.prueba, "Para diseñar las escenas con IA hace falta la clave de OpenAI (pestaña Ajustes). La plantilla gratuita sirve para inmobiliario.", 412);
    return { titulo: "Diseñar escenas con IA (OpenAI) + validar + revisión visual", cmd: [agente, "--solo-plan", ...base, ...(o.comentario ? ["--comentario", String(o.comentario)] : []), ...(o.sinVision ? ["--sin-vision"] : []), ...(o.emergencia ? ["--emergencia"] : []), ...(o.prueba ? ["--prueba"] : [])], alOk: marca("escenas") };
  };
  const pasoEscenasPlantilla = () => {
    pedir(perfil.plantilla, `El nicho «${perfil.id}» no tiene plantilla gratuita: usa la IA o pega un plan.`, 412);
    return { titulo: "Escenas con la plantilla gratuita", cmd: [script("plantilla.mjs"), dir, "--sin-voz", "--nicho", perfil.id], alOk: marca("escenas") };
  };
  const guionAprobado = () => {
    const g = guionDe(id);
    pedir(g?.aprobado, "Primero aprueba el guion (pestaña Guion).", 412);
    return g;
  };
  const pasoVoz = () => {
    const g = guionAprobado();
    writeFileSync(dato("guion.txt"), g.guion.trim() + "\n");
    return { titulo: `Voz (${o.modo === "prod" ? `producción · ${o.proveedor ?? "auto"}` : "desarrollo · edge-tts gratis"}) y tiempos por palabra`, cmd: [script("generar-voz.mjs"), ...argsVoz(o, perfil.id)], alOk: marca("voz", () => ({ modo: o.modo ?? "dev", proveedor: o.proveedor ?? null })) };
  };
  const pasoQa = () => ({
    titulo: "Control de calidad (márgenes, solapes, movimiento)",
    cmd: [script("qa.mjs")],
    alOk: marca("qa", () => {
      const q = leerQa();
      return { ok: (q?.problemas?.length ?? 1) === 0, problemas: q?.problemas?.length ?? null };
    }),
  });
  const pasoRender = () => ({ titulo: "Renderizar el video (1080×1920 a 60 fps)", cmd: [script("render.mjs"), ...(o.desdeCero ? ["--desde-cero"] : []), ...(o.hilos ? [`--concurrency=${Number(o.hilos) || 1}`] : [])], alOk: marca("render") });
  const pasoEntrega = () => ({ titulo: "Portada, texto del post y copia de seguridad", cmd: [script("entregables.mjs")], alOk: marca("entrega") });
  const pasoArchivar = () => ({ titulo: "Guardar el proyecto en el archivo", cmd: [script("proyecto.mjs"), "guardar"] });

  switch (nombre) {
    case "guion-ia":
      pedir(claveOpenAI() || o.prueba, "Para escribir el guion con IA hace falta la clave de OpenAI (pestaña Ajustes). En inmobiliario puedes usar la plantilla gratuita; en cualquier nicho puedes escribirlo tú.", 412);
      return { nombre, titulo: "Guion con IA", pasos: [{ titulo: "Redactar y revisar el guion con IA (OpenAI)", cmd: [agente, "--solo-guion", "--si", ...base, ...(o.comentario ? ["--comentario", String(o.comentario)] : []), ...(o.sinRevision ? ["--sin-revision"] : []), ...(o.prueba ? ["--prueba"] : [])] }] };
    case "guion-plantilla":
      pedir(perfil.plantilla, `El nicho «${perfil.id}» no tiene plantilla gratuita.`, 412);
      return { nombre, titulo: "Guion con la plantilla", pasos: [{ titulo: "Guion de la plantilla gratuita (solo con tus datos)", cmd: [script("plantilla.mjs"), dir, "--solo-guion", "--nicho", perfil.id] }] };
    case "voz":
      return { nombre, titulo: "Voz", pasos: [pasoVoz()] };
    case "escenas-ia":
      return { nombre, titulo: "Escenas con IA", pasos: [pasoEscenasIA()] };
    case "escenas-plantilla":
      return { nombre, titulo: "Escenas con plantilla", pasos: [pasoEscenasPlantilla()] };
    case "escenas-importar": {
      pedir(o.plan && typeof o.plan === "object", "Pega un plan en formato JSON.");
      mkdirSync(join(RAIZ, "trabajo", "panel"), { recursive: true });
      const f = join(RAIZ, "trabajo", "panel", "plan-pegado.json");
      writeFileSync(f, JSON.stringify(o.plan, null, 2));
      return { nombre, titulo: "Importar plan", pasos: [{ titulo: "Validar e importar el plan pegado", cmd: [script("ia", "importar-plan.mjs"), f, ...(o.forzar ? ["--forzar"] : [])], alOk: marca("escenas") }] };
    }
    case "validar":
      return { nombre, titulo: "Validar escenas", pasos: [{ titulo: "Validar el plan de escenas", cmd: [script("ia", "validar.mjs")] }] };
    case "capturas":
      return { nombre, titulo: "Capturas de las escenas", pasos: [{ titulo: "Renderizar una captura por escena", cmd: [script("ia", "capturas.mjs")] }] };
    case "qa":
      return { nombre, titulo: "Control de calidad", pasos: [pasoQa()] };
    case "render":
      return { nombre, titulo: "Render", pasos: [pasoRender()] };
    case "entregables":
      return { nombre, titulo: "Entrega", pasos: [pasoEntrega(), pasoArchivar()] };
    case "producir": {
      // cadena inteligente: hace solo lo que falta (voz → escenas → calidad → render → entrega)
      const st = estadoProyecto(id);
      guionAprobado();
      const pasos = [];
      const desdeCero = o.desde === "voz";
      if (desdeCero || !st.etapas.voz.ok) pasos.push(pasoVoz());
      if (desdeCero || !st.etapas.voz.ok || !st.etapas.escenas.ok) pasos.push(guionDe(id).origen === "plantilla" && perfil.plantilla && !(claveOpenAI() && o.escenas === "ia") ? pasoEscenasPlantilla() : pasoEscenasIA());
      if (!o.sinQa) pasos.push(pasoQa());
      pasos.push(pasoRender(), pasoEntrega(), pasoArchivar());
      return { nombre, titulo: "Producir el video completo", pasos };
    }
    case "ia-diagnostico":
      return { nombre, titulo: "Diagnóstico de OpenAI", pasos: [{ titulo: "Comprobar clave, modelos y formato estructurado", cmd: [script("ia", "diagnostico.mjs")] }] };
    case "sfx":
      return { nombre, titulo: "Efectos de sonido", pasos: [{ titulo: "Sintetizar los efectos de sonido (public/sfx)", cmd: [script("generar-sfx.mjs")] }] };
    case "pruebas":
      return { nombre, titulo: "Pruebas automáticas", pasos: [{ titulo: "Pruebas del agente y la voz con servidores simulados (sin gastar nada)", cmd: [script("ia", "probar.mjs")] }] };
    default:
      throw Object.assign(new Error(`Acción desconocida: ${nombre}`), { codigo: 404 });
  }
}

function lanzarAccion(nombre, id, opciones) {
  const def = definirAccion(nombre, id, opciones);
  if (id) activarBorrador(id); // la ranura activa debe ser ESTE proyecto antes de tocar nada
  // (definirAccion ya escribió guion.txt si hacía falta; se vuelve a escribir tras activar por si se restauró otro)
  if (nombre === "voz" || (nombre === "producir" && def.pasos.some((p) => /Voz/.test(p.titulo)))) {
    const g = guionDe(id);
    if (g?.guion) writeFileSync(dato("guion.txt"), g.guion.trim() + "\n");
  }
  return lanzar(def);
}

// ---------------------------------------------------------------------------
// Estudio de animación (guion en bloques → SVG + 3D). No usa proyectos ni ranura activa: trabaja sobre src/data/animacion.json.
// ---------------------------------------------------------------------------
const dirAnim = (...p) => join(RAIZ, "trabajo", "anim", ...p);
const archivoAnim = () => dato("animacion.json");
const leerAnim = () => {
  try {
    return JSON.parse(readFileSync(archivoAnim(), "utf8"));
  } catch {
    return null;
  }
};

let nucleoNavegador = null;
const moduloNucleo = async () => (nucleoNavegador ??= await compilarNucleo("browser"));

function historialAnim() {
  const dir = dirAnim("historial");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse()
    .slice(0, 30)
    .map((f) => {
      try {
        const h = JSON.parse(readFileSync(join(dir, f), "utf8"));
        return { id: h.id, creado: h.creado, titulo: h.animacion?.titulo ?? "", modelo: h.opciones?.modelo, escenas: h.animacion?.escenas?.length ?? 0, duracion: h.animacion?.duracion ?? 0, costo: h.animacion?.uso?.costo_usd ?? null };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function estadoAnim() {
  const a = leerAnim();
  const dirPrevia = join(RAIZ, "trabajo", "tmp", "anim-previa");
  const video = salida("video-animacion.mp4");
  let qa = null;
  try {
    qa = JSON.parse(readFileSync(join(dirPrevia, "qa.json"), "utf8"));
  } catch {
    /* aún no se ha hecho */
  }
  return {
    claveOpenAI: claveOpenAI(),
    locucion: a?.formato === "estructurado" && existsSync(salida("guion-locucion.txt")) ? { url: "/salida/guion-locucion.txt?descargar=1" } : null,
    animacion: a ? { titulo: a.titulo, paleta: a.paleta, sfx: a.sfx, formato: a.formato ?? "simple", hud: a.hud !== false, duracion: a.duracion, uso: a.uso, escenas: a.escenas.map((e) => ({ n: e.n, modo: e.modo, inicio: e.inicio, fin: e.fin, dur: e.dur, tema: e.tema, texto: e.texto })) } : null,
    previas: existsSync(dirPrevia) ? readdirSync(dirPrevia).filter((f) => /^escena-\d+\.png$/.test(f)).sort().map((f) => `/anim-previa/${f}?t=${statSync(join(dirPrevia, f)).mtimeMs | 0}`) : [],
    qa,
    video: existsSync(video) ? { url: `/salida/video-animacion.mp4?t=${statSync(video).mtimeMs | 0}`, mb: +(statSync(video).size / 1048576).toFixed(1), fecha: statSync(video).mtimeMs } : null,
    historial: historialAnim(),
  };
}

/** Acciones del estudio (siempre «un trabajo a la vez», como el resto del panel). */
async function lanzarAnim(nombre, o = {}) {
  switch (nombre) {
    case "anim-generar": {
      pedir(claveOpenAI() || o.prueba, "Para generar la animación hace falta la clave de OpenAI (Ajustes). Mientras tanto puedes cargar el ejemplo y renderizarlo gratis.", 412);
      pedir(typeof o.guion === "string" && o.guion.trim(), "Escribe o pega el guion en bloques.");
      const N = await cargarNucleoAnim();
      const r = N.detectarFormato(o.guion) === "estructurado" ? N.parsearEstructurado(o.guion) : N.parsearGuion(o.guion);
      pedir(!r.errores.length, `El guion tiene problemas:\n· ${r.errores.join("\n· ")}`);
      const modelo = N.MODELOS.some((m) => m.id === o.modelo) ? o.modelo : "gpt-4.1-mini";
      const paleta = N.PALETAS[o.paleta] ? o.paleta : "imnoba";
      mkdirSync(dirAnim(), { recursive: true });
      const f = dirAnim("guion-actual.txt");
      writeFileSync(f, o.guion);
      return lanzar({ nombre, titulo: "Generar animación (SVG + 3D)", pasos: [{ titulo: `Dibujar ${r.escenas.length} escenas con ${modelo}`, cmd: [script("anim", "generar.mjs"), `--guion=${f}`, `--modelo=${modelo}`, `--sfx=${o.sfx === false ? "no" : "si"}`, `--paleta=${paleta}`] }] });
    }
    case "anim-ejemplo": {
      const N_PALETAS = Object.keys((await cargarNucleoAnim()).PALETAS);
      return lanzar({ nombre, titulo: "Cargar el ejemplo IMNOBA", pasos: [{ titulo: "Cargar el ejemplo (sin IA, sin coste)", cmd: [script("anim", "ejemplo.mjs"), ...(o.sfx === false ? ["--sin-sfx"] : []), ...(o.paleta ? [`--paleta=${N_PALETAS.includes(o.paleta) ? o.paleta : "imnoba"}`] : [])] }] });
    }
    case "anim-previa":
      pedir(leerAnim(), "Primero genera la animación (o carga el ejemplo).", 412);
      return lanzar({ nombre, titulo: "Capturas y control de calidad", pasos: [{ titulo: "Una captura por escena + QA (márgenes, vacíos, movimiento)", cmd: [script("anim", "previa.mjs"), "--qa"] }] });
    case "anim-render":
      pedir(leerAnim(), "Primero genera la animación (o carga el ejemplo).", 412);
      return lanzar({ nombre, titulo: "Renderizar video (1080×1920 a 60 fps)", pasos: [{ titulo: "Renderizar la animación (SVG + 3D)", cmd: [script("render.mjs"), "--composicion=Animacion", ...(o.hilos ? [`--concurrency=${Number(o.hilos) || 1}`] : []), ...(o.desdeCero ? ["--desde-cero"] : [])] }] });
    default:
      throw Object.assign(new Error(`Acción desconocida: ${nombre}`), { codigo: 404 });
  }
}

// ---------------------------------------------------------------------------
// Enrutador
// ---------------------------------------------------------------------------
async function api(req, res, url) {
  const m = req.method;
  const ruta = url.pathname;
  const partes = ruta.split("/").filter(Boolean).slice(1); // sin "api"
  const [recurso, a, b, c] = partes;

  if (m === "GET" && recurso === "estado") {
    return json(res, 200, { version: JSON.parse(readFileSync(join(RAIZ, "package.json"), "utf8")).version, activo: resumenActivo(), trabajo: instantanea(), studio: estadoServicio("studio"), claves: { openai: claveOpenAI(), elevenlabs: Boolean((process.env.ELEVENLABS_API_KEY ?? "").trim()) } });
  }
  if (m === "GET" && recurso === "entorno") return json(res, 200, await entorno({ red: url.searchParams.get("red") !== "0" }));
  if (m === "GET" && recurso === "perfiles") {
    const ps = listarPerfiles().map((p) => ({ ...infoPerfil(cargarPerfil(p.id)), principal: ["medicina-ar", "inmobiliario-co"].includes(p.id) }));
    return json(res, 200, { perfiles: ps, paletas: paletas(), defecto: PERFIL_BASE });
  }
  if (m === "GET" && recurso === "proyectos" && !a) return json(res, 200, { usuario: listarProyectos(), archivo: listarArchivo(), ejemplos: listarEjemplos(), activo: temaActivoJson()?.id ?? null });
  if (m === "POST" && recurso === "proyectos" && a === "importar-ejemplo") {
    const o = await leerJson(req);
    return json(res, 200, { id: importarEjemplo(String(o.ejemplo ?? ""), o.id) });
  }
  if (m === "POST" && recurso === "proyectos" && !a) {
    const o = await leerJson(req);
    pedir(o && typeof o === "object" && o.perfil, "Falta el nicho (perfil) del proyecto.");
    const r = guardarBriefProyecto(o);
    return json(res, 200, { ...r, estado: estadoProyecto(r.id) });
  }
  if (recurso === "proyectos" && a) {
    const id = slug(a);
    if (m === "GET" && !b) {
      pedir(existeProyecto(id), "No existe ese proyecto.", 404);
      return json(res, 200, { brief: leerBriefProyecto(id), medios: listarMediosProyecto(id), estado: estadoProyecto(id), guion: guionDe(id) });
    }
    if (m === "DELETE" && !b) {
      pedir(existeProyecto(id), "No existe ese proyecto.", 404);
      pedir(temaActivoJson()?.id !== id || !hayTrabajo(), "No se puede borrar mientras hay un trabajo en curso.", 409);
      borrarProyecto(id);
      return json(res, 200, { ok: true });
    }
    if (b === "media" && c) {
      pedir(existeProyecto(id), "No existe ese proyecto.", 404);
      if (m === "PUT") {
        const buf = await leerCuerpo(req);
        pedir(buf.length > 0, "El archivo está vacío.");
        const nombre = guardarMedio(id, decodeURIComponent(c), buf);
        return json(res, 200, { archivo: nombre, medios: listarMediosProyecto(id) });
      }
      if (m === "DELETE") {
        borrarMedio(id, decodeURIComponent(c));
        return json(res, 200, { medios: listarMediosProyecto(id) });
      }
    }
    if (m === "POST" && b === "activar") {
      pedir(!hayTrabajo(), "Hay un trabajo en curso: espera a que termine.", 409);
      return json(res, 200, activarBorrador(id));
    }
    if (m === "POST" && b === "guion") {
      pedir(existeProyecto(id), "No existe ese proyecto.", 404);
      const o = await leerJson(req);
      pedir(typeof o.guion === "string" && o.guion.trim().split(/\s+/).length >= 8, "El guion es demasiado corto.");
      const dir = dirTrabajoIa(id);
      mkdirSync(dir, { recursive: true });
      const previo = guionDe(id) ?? {};
      const limpio = o.guion.replace(/\r/g, "").replace(/\[[^\]]*\]/g, " ").replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
      const g = { ...previo, proyectoId: id, etiqueta: previo.etiqueta ?? "", titulo: previo.titulo ?? limpio.split(/(?<=[?.!])\s/)[0], guion: limpio, aprobado: o.aprobado !== false, origen: o.origen ?? previo.origen ?? "manual", verificacion: previo.verificacion ?? [], simplificaciones: previo.simplificaciones ?? [] };
      writeFileSync(join(dir, "guion.json"), JSON.stringify(g, null, 2) + "\n");
      writeFileSync(join(dir, "guion.txt"), limpio + "\n");
      marcarEtapa(id, "guion", { palabras: limpio.split(/\s+/).length });
      return json(res, 200, { guion: g, estado: estadoProyecto(id) });
    }
    if (m === "GET" && b === "estado") return json(res, 200, estadoProyecto(id) ?? {});
  }
  if (m === "POST" && recurso === "archivo" && a && b === "activar") {
    pedir(!hayTrabajo(), "Hay un trabajo en curso: espera a que termine.", 409);
    const r = spawnSync(process.execPath, [script("proyecto.mjs"), "activar", slug(a)], { cwd: RAIZ, encoding: "utf8" });
    pedir(r.status === 0, (r.stderr || r.stdout || "No se pudo restaurar el proyecto.").trim().slice(0, 300), 500);
    return json(res, 200, { ok: true, salida: r.stdout });
  }
  if (m === "GET" && recurso === "activo" && a === "plan") {
    try {
      return json(res, 200, JSON.parse(readFileSync(dato("plan.json"), "utf8")));
    } catch {
      return json(res, 200, {});
    }
  }
  if (m === "GET" && recurso === "activo") return json(res, 200, resumenActivo() ?? {});
  if (m === "POST" && recurso === "activo" && a === "post") {
    const o = await leerJson(req);
    pedir(typeof o.texto === "string", "Falta el texto del post.");
    writeFileSync(dato("post.txt"), o.texto.trim() + "\n");
    if (existsSync(salida())) writeFileSync(salida("texto-del-post.txt"), o.texto.trim() + "\n");
    const t = temaActivoJson();
    if (t && existsSync(dirArchivo(t.id))) writeFileSync(join(dirArchivo(t.id), "texto-del-post.txt"), o.texto.trim() + "\n");
    return json(res, 200, { ok: true });
  }
  if (m === "GET" && recurso === "anim" && a === "estado") return json(res, 200, estadoAnim());
  if (m === "GET" && recurso === "anim" && a === "ejemplo") {
    const N = await cargarNucleoAnim();
    // paleta retro → ejemplo en formato estructurado ([CONFIG], FONDO, GEO, HUD…); el resto → formato simple
    const retro = N.esRetro(url.searchParams.get("paleta") ?? "");
    return json(res, 200, { guion: readFileSync(join(RAIZ, "ejemplos", retro ? "animacion-retro" : "animacion-imnoba", retro ? "guion-estructurado.txt" : "guion.txt"), "utf8") });
  }
  if (m === "POST" && recurso === "anim" && a === "cargar") {
    const o = await leerJson(req);
    const f = join(dirAnim("historial"), `${String(o.id ?? "").replace(/[^0-9A-Za-z_-]/g, "")}.json`);
    pedir(existsSync(f), "No existe esa generación en el historial.", 404);
    pedir(!hayTrabajo(), "Hay un trabajo en curso: espera a que termine.", 409);
    const h = JSON.parse(readFileSync(f, "utf8"));
    writeFileSync(archivoAnim(), JSON.stringify(h.animacion, null, 1));
    return json(res, 200, { guion: h.guion, opciones: h.opciones });
  }
  if (m === "POST" && recurso === "accion") {
    const o = await leerJson(req);
    if (String(o.nombre ?? "").startsWith("anim-")) {
      try {
        return json(res, 200, { trabajo: await lanzarAnim(String(o.nombre), o.opciones ?? {}) });
      } catch (e) {
        return error(res, e.codigo ?? 500, e.message);
      }
    }
    try {
      return json(res, 200, { trabajo: lanzarAccion(String(o.nombre ?? ""), o.proyecto ? slug(o.proyecto) : null, o.opciones ?? {}) });
    } catch (e) {
      return error(res, e.codigo ?? 500, e.message);
    }
  }
  if (m === "POST" && recurso === "cancelar") return json(res, 200, { cancelado: cancelar() });
  if (m === "GET" && recurso === "log") return json(res, 200, { trabajo: instantanea(), lineas: lineasDe(Number(url.searchParams.get("desde") ?? 0)) });
  if (m === "GET" && recurso === "ajustes") return json(res, 200, leerAjustes());
  if (m === "POST" && recurso === "ajustes") {
    guardarAjustesSeguro(await leerJson(req));
    return json(res, 200, leerAjustes());
  }
  if (m === "POST" && recurso === "probar") return json(res, 200, await probar(String((await leerJson(req)).que ?? "")));
  if (m === "GET" && recurso === "doc" && a) {
    const ok = archivosDoc().includes(a);
    pedir(ok, "Documento desconocido.", 404);
    return json(res, 200, { nombre: a, texto: readFileSync(join(RAIZ, `${a}.md`), "utf8"), docs: archivosDoc() });
  }
  if (m === "GET" && recurso === "docs") return json(res, 200, { docs: archivosDoc() });
  if (m === "POST" && recurso === "studio") {
    const o = await leerJson(req);
    if (o.accion === "detener") {
      detenerServicio("studio");
      return json(res, 200, estadoServicio("studio"));
    }
    return json(res, 200, iniciarServicio("studio", [join(RAIZ, "node_modules", "@remotion", "cli", "remotion-cli.js"), "studio", "src/index.ts", "--no-open", "--port=3000"], { url: "http://localhost:3000" }));
  }
  if (m === "GET" && recurso === "capturas") {
    const dir = join(RAIZ, "trabajo", "ia", "capturas");
    return json(res, 200, { capturas: existsSync(dir) ? readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f)).sort().map((f) => ({ archivo: f, url: `/capturas/${encodeURIComponent(f)}?t=${statSync(join(dir, f)).mtimeMs | 0}` })) : [] });
  }
  if (m === "GET" && recurso === "qa") {
    const q = leerQa();
    const dir = salida("qa");
    return json(res, 200, { informe: q, imagenes: existsSync(dir) ? readdirSync(dir).filter((f) => /\.png$/i.test(f)).sort().map((f) => `/qa/${f}?t=${statSync(join(dir, f)).mtimeMs | 0}`) : [] });
  }
  if (m === "GET" && recurso === "informe-ia" && a) {
    const f = join(dirTrabajoIa(a), "informe.md");
    return json(res, 200, { texto: existsSync(f) ? readFileSync(f, "utf8") : "" });
  }
  return error(res, 404, `Ruta de API desconocida: ${m} ${ruta}`);
}

function guardarAjustesSeguro(o) {
  const cambios = {};
  for (const [k, v] of Object.entries(o ?? {})) if (typeof v === "string" || v === null) cambios[k] = v;
  guardarAjustes(cambios);
}

// ---------------------------------------------------------------------------
// Servidor
// ---------------------------------------------------------------------------
function crearServidor(puerto) {
  const clientesSse = new Set();
  bus.on("evento", (ev) => {
    const datos = `data: ${JSON.stringify(ev)}\n\n`;
    for (const r of clientesSse) r.write(datos);
  });

  const servidor = createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
    // 1) solo se atiende a "localhost" (evita el rebinding de DNS desde otras webs)
    const host = String(req.headers.host ?? "").replace(/:\d+$/, "");
    if (!["localhost", "127.0.0.1", "[::1]"].includes(host)) return error(res, 403, "Host no permitido.");
    // 2) las peticiones que modifican algo exigen una cabecera propia (un sitio externo no puede enviarla sin permiso CORS)
    if (!["GET", "HEAD"].includes(req.method) && req.headers["x-videmed"] !== "panel") return error(res, 403, "Falta la cabecera de seguridad del panel.");
    try {
      if (url.pathname === "/api/eventos") {
        res.writeHead(200, { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" });
        res.write(`data: ${JSON.stringify({ tipo: "hola", job: instantanea(), lineas: lineasDe(Math.max(0, lineasDe().length - 400)) })}\n\n`);
        clientesSse.add(res);
        const latido = setInterval(() => res.write(": ping\n\n"), 20000);
        req.on("close", () => { clearInterval(latido); clientesSse.delete(res); });
        return;
      }
      if (url.pathname.startsWith("/api/")) return await api(req, res, url);

      // archivos de resultados
      let m;
      if ((m = url.pathname.match(/^\/salida\/(.+)$/))) { const r = dentro(salida(), m[1]); return r ? servirArchivo(req, res, r, { descarga: url.searchParams.has("descargar") }) : error(res, 403, "Ruta no válida."); }
      if ((m = url.pathname.match(/^\/qa\/(.+)$/))) { const r = dentro(salida("qa"), m[1]); return r ? servirArchivo(req, res, r) : error(res, 403, "Ruta no válida."); }
      if ((m = url.pathname.match(/^\/capturas\/(.+)$/))) { const r = dentro(join(RAIZ, "trabajo", "ia", "capturas"), m[1]); return r ? servirArchivo(req, res, r) : error(res, 403, "Ruta no válida."); }
      if ((m = url.pathname.match(/^\/archivo\/([^/]+)\/(.+)$/))) { const r = dentro(dirArchivo(m[1]), m[2]); return r ? servirArchivo(req, res, r, { descarga: url.searchParams.has("descargar") }) : error(res, 403, "Ruta no válida."); }
      if (url.pathname === "/modulos/anim-nucleo.js") {
        const codigo = await moduloNucleo();
        res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-cache" });
        return res.end(codigo);
      }
      if ((m = url.pathname.match(/^\/anim-previa\/(.+)$/))) { const r = dentro(join(RAIZ, "trabajo", "tmp", "anim-previa"), m[1]); return r ? servirArchivo(req, res, r) : error(res, 403, "Ruta no válida."); }
      if (url.pathname === "/audio/voz.mp3") return servirArchivo(req, res, join(RAIZ, "public", "audios", "voz.mp3"));
      if ((m = url.pathname.match(/^\/p\/([^/]+)\/media\/(.+)$/))) { const r = dentro(join(dirProyecto(m[1]), "media"), m[2]); return r ? servirArchivo(req, res, r) : error(res, 403, "Ruta no válida."); }

      // interfaz
      const rel = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      const r = dentro(WEB, rel);
      if (!r || !existsSync(r)) return error(res, 404, "No existe.");
      return servirArchivo(req, res, r);
    } catch (e) {
      if (!res.headersSent) error(res, e.codigo ?? 500, e.message ?? String(e));
      else res.end();
    }
  });
  return { servidor, clientesSse };
}

export function iniciarPanel({ puerto = 4173, intentos = 20 } = {}) {
  return new Promise((ok, mal) => {
    const probar = (p, restantes) => {
      const { servidor, clientesSse } = crearServidor(p);
      servidor.once("error", (e) => {
        if (e.code === "EADDRINUSE" && restantes > 0) probar(p + 1, restantes - 1);
        else mal(e);
      });
      servidor.listen(p, "127.0.0.1", () => ok({ puerto: p, url: `http://localhost:${p}`, cerrar: () => new Promise((r) => { detenerTodo(); for (const c of clientesSse) c.end(); servidor.closeAllConnections?.(); servidor.close(() => r()); }) }));
    };
    probar(puerto, intentos);
  });
}

function abrirNavegador(url) {
  const cmd = process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
  try {
    spawn(cmd[0], cmd[1], { stdio: "ignore", detached: true }).on("error", () => {}).unref();
  } catch {
    /* sin navegador: se puede abrir a mano */
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const args = process.argv.slice(2);
  const i = args.indexOf("--puerto");
  const puerto = Number(i > -1 ? args[i + 1] : process.env.PANEL_PUERTO) || 4173;
  const p = await iniciarPanel({ puerto });
  console.log(`\n🎬 Panel de VideMed listo:  ${p.url}\n   (solo accesible desde este equipo · Ctrl+C para cerrar)\n`);
  if (args.includes("--abrir")) abrirNavegador(p.url);
  const salir = () => { detenerTodo(); process.exit(0); };
  process.on("SIGINT", salir);
  process.on("SIGTERM", salir);
}
