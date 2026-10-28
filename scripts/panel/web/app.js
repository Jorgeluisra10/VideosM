/* VideMed · panel — interfaz sin dependencias (ES modules). Habla con scripts/panel/servidor.mjs */

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
// replaceChildren con null/false (hijos condicionales) no debe pintar el texto «null»
const _reemplazar = Element.prototype.replaceChildren;
Element.prototype.replaceChildren = function (...hijos) { return _reemplazar.apply(this, hijos.flat().filter((x) => x != null && x !== false)); };

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
/** Mini hyperscript: h("div.clase#id", {atributos, onclick}, ...hijos). Los textos van como texto (nunca como HTML). */
function h(sel, attrs, ...hijos) {
  const m = sel.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i);
  const el = document.createElement(m?.[1] || "div");
  for (const t of (m?.[2] ?? "").match(/[.#][\w-]+/g) ?? []) t[0] === "." ? el.classList.add(t.slice(1)) : (el.id = t.slice(1));
  if (attrs && (typeof attrs !== "object" || attrs instanceof Node || Array.isArray(attrs))) { hijos.unshift(attrs); attrs = null; }
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === false || v == null) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className += " " + v;
    else if (k === "value") el.value = v;
    else if (k === "checked" || k === "disabled" || k === "hidden" || k === "selected" || k === "open") el[k] = Boolean(v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  const poner = (x) => {
    if (x == null || x === false) return;
    if (Array.isArray(x)) x.forEach(poner);
    else el.append(x instanceof Node ? x : document.createTextNode(String(x)));
  };
  hijos.forEach(poner);
  return el;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const seg = (ms) => { const s = Math.round(ms / 1000); return s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`; };
const guardarLocal = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };
const leerLocal = (k) => { try { return localStorage.getItem(k); } catch { return null; } };

async function api(ruta, { metodo = "GET", cuerpo, crudo } = {}) {
  const init = { method: metodo, headers: {} };
  if (metodo !== "GET") init.headers["X-VideMed"] = "panel";
  if (crudo !== undefined) { init.body = crudo; init.headers["Content-Type"] = "application/octet-stream"; }
  else if (cuerpo !== undefined) { init.body = JSON.stringify(cuerpo); init.headers["Content-Type"] = "application/json"; }
  let r;
  try { r = await fetch(ruta, init); } catch { throw new Error("No hay conexión con el panel. ¿Sigue abierto en la terminal (npm run panel)?"); }
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(datos.error || `Error ${r.status}`), { estado: r.status });
  return datos;
}

function aviso(texto, tipo = "info", ms = 5200) {
  const el = h(`div.aviso${tipo === "ok" ? ".ok" : tipo === "mal" ? ".mal" : tipo === "aviso" ? ".aviso-ambar" : ""}`, { role: "status" }, texto);
  $("#avisos").append(el);
  setTimeout(() => el.remove(), ms);
}
const fallo = (e) => aviso(`❌ ${e.message ?? e}`, "mal", 9000);

function modal(contenido, { cerrarFuera = true } = {}) {
  const m = $("#modal");
  m.replaceChildren(contenido);
  m.hidden = false;
  const cerrar = () => { m.hidden = true; m.replaceChildren(); document.removeEventListener("keydown", tecla); };
  const tecla = (e) => e.key === "Escape" && cerrar();
  document.addEventListener("keydown", tecla);
  if (cerrarFuera) m.onclick = (e) => e.target === m && cerrar();
  return cerrar;
}

// ---------------------------------------------------------------------------
// Markdown mínimo para la guía (escapa todo el HTML)
// ---------------------------------------------------------------------------
function markdown(texto) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s) => esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:]|$)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const lineas = texto.replace(/\r/g, "").split("\n");
  const out = [];
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    let m;
    if (/^```/.test(l)) {
      const code = [];
      for (i++; i < lineas.length && !/^```/.test(lineas[i]); i++) code.push(lineas[i]);
      out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
    } else if ((m = l.match(/^(#{1,4})\s+(.*)$/))) out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
    else if (/^---+\s*$/.test(l)) out.push("<hr>");
    else if (/^\s*\|.*\|\s*$/.test(l) && /^\s*\|[\s:|-]+\|\s*$/.test(lineas[i + 1] ?? "")) {
      const celdas = (x) => x.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const cab = celdas(l);
      i += 2;
      const filas = [];
      for (; i < lineas.length && /^\s*\|.*\|\s*$/.test(lineas[i]); i++) filas.push(celdas(lineas[i]));
      i--;
      out.push(`<table><thead><tr>${cab.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${filas.map((f) => `<tr>${f.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
    } else if (/^\s*[-*]\s+/.test(l)) {
      const it = [];
      for (; i < lineas.length && /^\s*[-*]\s+/.test(lineas[i]); i++) it.push(`<li>${inline(lineas[i].replace(/^\s*[-*]\s+/, ""))}</li>`);
      i--;
      out.push(`<ul>${it.join("")}</ul>`);
    } else if (/^\s*\d+\.\s+/.test(l)) {
      const it = [];
      for (; i < lineas.length && /^\s*\d+\.\s+/.test(lineas[i]); i++) it.push(`<li>${inline(lineas[i].replace(/^\s*\d+\.\s+/, ""))}</li>`);
      i--;
      out.push(`<ol>${it.join("")}</ol>`);
    } else if (/^>\s?/.test(l)) {
      const q = [];
      for (; i < lineas.length && /^>\s?/.test(lineas[i]); i++) q.push(lineas[i].replace(/^>\s?/, ""));
      i--;
      out.push(`<blockquote>${inline(q.join(" "))}</blockquote>`);
    } else if (l.trim()) {
      const p = [l];
      while (i + 1 < lineas.length && lineas[i + 1].trim() && !/^(#{1,4}\s|```|\s*[-*]\s|\s*\d+\.\s|>|\s*\|)/.test(lineas[i + 1])) p.push(lineas[++i]);
      out.push(`<p>${inline(p.join(" "))}</p>`);
    }
  }
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// Estado global
// ---------------------------------------------------------------------------
const S = {
  perfiles: [], paletas: {}, claves: { openai: false, elevenlabs: false },
  trabajo: null, lineas: [], studio: { activo: false },
  proyectos: null, actual: null, activo: null,
};
const perfilDe = (id) => S.perfiles.find((p) => p.id === id) ?? S.perfiles[0];

const ETAPAS = [
  { id: "datos", titulo: "Datos", icono: "📝" },
  { id: "guion", titulo: "Guion", icono: "✍️" },
  { id: "voz", titulo: "Voz", icono: "🎙️" },
  { id: "escenas", titulo: "Escenas", icono: "🎞️" },
  { id: "calidad", titulo: "Calidad", icono: "🔎" },
  { id: "video", titulo: "Video", icono: "🎬" },
  { id: "entrega", titulo: "Entrega", icono: "📦" },
];

const VOCES_EDGE = [
  ["ar", "🇦🇷 Argentina · Tomás (hombre)"], ["ar-f", "🇦🇷 Argentina · Elena (mujer)"],
  ["co", "🇨🇴 Colombia · Gonzalo (hombre)"], ["co-f", "🇨🇴 Colombia · Salomé (mujer)"],
  ["mx", "🇲🇽 México · Jorge (hombre)"], ["mx-f", "🇲🇽 México · Dalia (mujer)"],
  ["es", "🇪🇸 España · Álvaro (hombre)"], ["es-f", "🇪🇸 España · Elvira (mujer)"],
];
const VOCES_OPENAI = ["ash", "onyx", "alloy", "echo", "fable", "sage", "ballad", "coral", "nova", "shimmer", "verse"];
const TRANSICIONES = [["zoom", "Zoom suave (clásica)"], ["fade", "Fundido"], ["slide", "Deslizar"], ["wipe", "Cortinilla"], ["flip", "Giro"], ["reloj", "Reloj"]];

// ---------------------------------------------------------------------------
// Trabajos en curso (SSE) y registro
// ---------------------------------------------------------------------------
let registroFijado = false; // el usuario lo abrió a mano: no se cierra solo
function mostrarRegistro(v, { fijar = false } = {}) {
  $("#registro").hidden = !v;
  document.body.classList.toggle("con-registro", v);
  if (fijar) registroFijado = v;
}

function pintarTrabajo() {
  const t = S.trabajo;
  const b = $("#trabajo");
  b.className = `trabajo ${t ? (t.estado === "corriendo" ? "corriendo" : t.estado === "ok" ? "ok" : t.estado === "cancelado" ? "reposo" : "error") : "reposo"}`;
  const prog = $("#trabajo-prog");
  if (!t) { $("#trabajo-texto").textContent = "Sin trabajos en curso"; prog.hidden = true; }
  else {
    const extra = t.pasos.length > 1 && t.estado === "corriendo" ? ` (${t.paso + 1}/${t.pasos.length})` : "";
    $("#trabajo-texto").textContent = t.estado === "corriendo" ? `⏳ ${t.titulo}${extra}${t.progreso != null ? ` · ${t.progreso} %` : ""}` : t.estado === "ok" ? `✅ ${t.titulo}: listo` : t.estado === "cancelado" ? `⏹ ${t.titulo}: cancelado` : `❌ ${t.titulo}: falló`;
    prog.hidden = t.progreso == null || t.estado !== "corriendo";
    $("#trabajo-prog i").style.width = `${t.progreso ?? 0}%`;
  }
  $("#registro-cancelar").hidden = !(t && t.estado === "corriendo");
  $("#registro-titulo").textContent = t ? `Registro · ${t.titulo}` : "Registro";
}

function pintarLinea(l) {
  const cuerpo = $("#registro-cuerpo");
  const pegado = cuerpo.scrollTop + cuerpo.clientHeight >= cuerpo.scrollHeight - 40;
  cuerpo.append(h(`span${l.tipo === "err" ? ".err" : l.tipo === "ok" ? ".ok" : l.tipo === "paso" ? ".paso" : ""}`, l.l + "\n"));
  while (cuerpo.childNodes.length > 1800) cuerpo.firstChild.remove();
  if (pegado) cuerpo.scrollTop = cuerpo.scrollHeight;
}

let alTerminarCallbacks = [];
const alTerminar = (fn) => alTerminarCallbacks.push(fn);

function conectarSSE() {
  const es = new EventSource("/api/eventos");
  es.onmessage = (m) => {
    const ev = JSON.parse(m.data);
    if (ev.tipo === "hola") {
      S.trabajo = ev.job;
      $("#registro-cuerpo").replaceChildren();
      (ev.lineas ?? []).forEach(pintarLinea);
      pintarTrabajo();
      return;
    }
    if (ev.tipo === "servicio") { S.studio = ev.servicio; refrescarSiVista(["escenas"]); return; }
    if (ev.job) S.trabajo = ev.job;
    if (ev.tipo === "inicio") { $("#registro-cuerpo").replaceChildren(); mostrarRegistro(true); }
    if (ev.tipo === "linea") pintarLinea(ev.linea);
    pintarTrabajo();
    if (ev.tipo === "progreso") pintarProgresoVista();
    if (ev.tipo === "fin") {
      const cbs = alTerminarCallbacks; alTerminarCallbacks = [];
      aviso(ev.job.estado === "ok" ? `✅ ${ev.job.titulo}: listo` : ev.job.estado === "cancelado" ? `⏹ ${ev.job.titulo}: cancelado` : `❌ ${ev.job.titulo}: terminó con error (mira el registro)`, ev.job.estado === "ok" ? "ok" : ev.job.estado === "cancelado" ? "info" : "mal", 7000);
      // si todo fue bien el registro se recoge solo (queda en la barra superior); si falló, se queda abierto
      if (ev.job.estado === "ok" && !registroFijado) setTimeout(() => { if (S.trabajo?.estado !== "corriendo") mostrarRegistro(false); }, 2500);
      refrescarTrasTrabajo(ev.job).then(() => cbs.forEach((f) => f(ev.job)));
    }
  };
  es.onerror = () => { /* el navegador reintenta solo */ };
}

async function refrescarTrasTrabajo(job) {
  try {
    const [est, pr] = await Promise.all([api("/api/estado"), api("/api/proyectos")]);
    S.activo = est.activo; S.claves = est.claves; S.proyectos = pr;
    avisoVersion(est);
    if (S.actual) await cargarProyecto(S.actual.id, { silencioso: true });
  } catch { /* sin conexión */ }
  const v = ruta();
  if (v.vista === "estudio") return S.estudioRefrescar?.();
  if (v.vista === "proyecto" && (!["datos"].includes(v.paso) || job.estado === "ok")) pintarVista();
  else if (v.vista === "inicio") pintarVista();
}
function refrescarSiVista(pasos) { const v = ruta(); if (v.vista === "proyecto" && pasos.includes(v.paso)) pintarVista(); }
function pintarProgresoVista() { const el = $("#prog-render"); if (el && S.trabajo?.progreso != null) { el.firstChild.style.width = `${S.trabajo.progreso}%`; const t = $("#prog-render-txt"); if (t) t.textContent = `${S.trabajo.progreso} %`; } }

async function lanzar(nombre, opciones = {}, { abrirRegistro = true } = {}) {
  if (!S.actual && !["ia-diagnostico", "sfx", "pruebas"].includes(nombre) && !nombre.startsWith("anim-")) return aviso("Abre un proyecto primero.", "aviso");
  try {
    const r = await api("/api/accion", { metodo: "POST", cuerpo: { nombre, proyecto: nombre.startsWith("anim-") ? undefined : S.actual?.id, opciones } });
    S.trabajo = r.trabajo;
    if (abrirRegistro) mostrarRegistro(true);
    pintarTrabajo();
    return r.trabajo;
  } catch (e) { fallo(e); }
}
const ocupado = () => S.trabajo?.estado === "corriendo";

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
function ruta() {
  const p = decodeURIComponent(location.hash.replace(/^#\/?/, "")).split("/").filter(Boolean);
  if (!p.length || p[0] === "estudio") return { vista: "estudio" };
  if (p[0] === "clasico") return { vista: "inicio" };
  if (p[0] === "nuevo") return { vista: "nuevo" };
  if (p[0] === "p" && p[1]) return { vista: "proyecto", id: p[1], paso: ETAPAS.some((e) => e.id === p[2]) ? p[2] : null };
  if (p[0] === "ajustes") return { vista: "ajustes" };
  if (p[0] === "guia") return { vista: "guia", doc: p[1] ?? "GUIA" };
  return { vista: "inicio" };
}
const ir = (hash) => { if (location.hash === hash) pintarVista(); else location.hash = hash; };

async function pintarVista() {
  const v = ruta();
  $$(".menu a").forEach((a) => a.classList.toggle("activo", (a.dataset.nav === "clasico" && ["inicio", "nuevo", "proyecto"].includes(v.vista)) || a.dataset.nav === v.vista));
  const cont = $("#vista");
  try {
    EST.N ??= await import("/modulos/anim-nucleo.js");
    if (v.vista !== "estudio" && v.vista !== "proyecto") pintarMarca(null);
    if (v.vista === "estudio") await vistaEstudio(cont);
    else if (v.vista === "inicio") await vistaInicio(cont);
    else if (v.vista === "nuevo") vistaNuevo(cont);
    else if (v.vista === "proyecto") await vistaProyecto(cont, v);
    else if (v.vista === "ajustes") await vistaAjustes(cont);
    else if (v.vista === "guia") await vistaGuia(cont, v.doc);
  } catch (e) {
    cont.replaceChildren(h("div.tarjeta", h("h2", "😕 Algo salió mal"), h("p", e.message), h("button.btn", { onclick: () => pintarVista() }, "Reintentar")));
  }
}


// ---------------------------------------------------------------------------
// Vista: ESTUDIO (guion en bloques → animación SVG + 3D). Una sola caja de texto y 3 ajustes.
// ---------------------------------------------------------------------------
// Dos marcas, dos espacios de trabajo: IMNOBA (inmobiliario y vehículos) y SINAPSIS (medicina y ciencia). Cada una guarda SU borrador de idea y SU paleta.
const CLAVE_MARCA = "videmed-marca";
const claveGuion = (m) => (m === "sinapsis" ? "videmed-anim-guion-sinapsis" : "videmed-anim-guion");
const clavePaleta = (m) => (m === "sinapsis" ? "videmed-anim-paleta-sinapsis" : "videmed-anim-paleta");
const EST = { marca: null, guion: "", modelo: leerLocal("videmed-anim-modelo") ?? "gpt-4.1-mini", sfx: (leerLocal("videmed-anim-sfx") ?? "si") === "si", paleta: "", verTodo: false, datos: null, N: null };
/** Carga el borrador (idea + paleta) de la marca activa; la paleta guardada solo vale si es de esa marca. */
function cargarBorradorMarca() {
  EST.guion = leerLocal(claveGuion(EST.marca)) ?? "";
  EST.paleta = EST.N.paletaValidaParaMarca(EST.marca, leerLocal(clavePaleta(EST.marca)));
}
/** Marca activa: la guardada; la primera vez, la de la animación que ya estaba cargada; si no, IMNOBA. */
function iniciarMarca() {
  if (EST.marca) return;
  const N = EST.N;
  const guardada = N.marcaPorId(leerLocal(CLAVE_MARCA));
  EST.marca = guardada ? guardada.id : EST.datos?.animacion ? N.marcaDePaleta(EST.datos.animacion.paleta).id : N.MARCA_POR_DEFECTO;
  cargarBorradorMarca();
}
const marcaActiva = () => EST.N.MARCAS[EST.marca];
/** Etiqueta de color de una marca (la misma en el Estudio, el historial y los proyectos). */
const chipMarca = (m, extra = "") => h(`span.chip.marca-${m.id}`, { title: `${m.nombre} · ${m.rubro}` }, `${m.icono} ${m.nombre}${extra}`);
/** La animación cargada en el servidor, solo si es de la marca que se está viendo (la otra marca no se mezcla). */
const animActiva = () => { const a = EST.datos?.animacion; return a && EST.N && EST.N.marcaDePaleta(a.paleta).id === EST.marca ? a : null; };
/** Pinta la marca en toda la interfaz: color de acento (body[data-marca]) y la etiqueta de la barra superior. */
function pintarMarca(m) {
  if (m) document.body.dataset.marca = m.id; else delete document.body.dataset.marca;
  const el = $("#marca-activa");
  if (!el) return;
  el.hidden = !m;
  if (m) { el.className = `pill-marca marca-${m.id}`; el.textContent = `${m.icono} ${m.nombre}`; el.title = `Estás trabajando en ${m.nombre} · ${m.rubro}`; }
}
const fijosCache = new Map();
/** Aviso bajo la paleta: las Retro-Científica activan el estilo documental (otro prompt, otras plantillas, duración ≈ 60 s). */
const notaPaleta = () => (EST.N && EST.N.esDocumental(EST.paleta) ? "🎞️ Estilo documental: fondo negro/papel, titulares pesados + mono, cortes secos y la estructura de los explicativos con estudios citados (≈ 60 s)." : "");
const num = (x, d = 0) => Number(x).toLocaleString("es-CO", { minimumFractionDigits: d, maximumFractionDigits: d });
const reloj = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/** Si hiciste `git pull` con el panel abierto, el servidor sigue con el código viejo en memoria: se avisa para reiniciarlo. */
function avisoVersion(est) {
  S.commit = est?.commit ?? "";
  let b = $("#aviso-version");
  if (!est?.reiniciar) { b?.remove(); return; }
  if (!b) { b = h("div#aviso-version.nota.error", { style: "margin:0;border-radius:0;text-align:center;position:sticky;top:0;z-index:50" }); document.body.prepend(b); }
  b.replaceChildren("🔄 El código del proyecto se actualizó mientras el panel estaba abierto. Para ver la versión nueva: cierra la terminal del panel (Ctrl+C), vuelve a escribir ", h("code", "npm run panel"), " y recarga esta página con Ctrl+F5.");
}

/** Copia al portapapeles (con alternativa si el navegador no da permiso). */
async function copiarTexto(texto) {
  try { await navigator.clipboard.writeText(texto); return true; } catch { /* alternativa */ }
  const t = h("textarea", { style: "position:fixed;left:-9999px" }, texto);
  document.body.append(t); t.select();
  let ok = false; try { ok = document.execCommand("copy"); } catch { ok = false; }
  t.remove();
  return ok;
}

/** Costo estimado: parsea el guion localmente (sin IA) y aplica los precios del modelo elegido. */
function calcularEstimacion() {
  const N = EST.N;
  const formato = N.detectarFormato(EST.guion);
  if (formato !== "estructurado" && N.esIdea(EST.guion)) {
    // UNA FRASE → video: la IA escribe el guion y elige las plantillas (JSON compacto) → entrada = prompt fijo + idea; salida ≈ 165 tokens por escena
    const r = N.parsearIdea(EST.guion, { paleta: EST.paleta });
    if (r.errores.length) return { r: { ...r, escenas: [] }, svg: 0, tres: 0, est: null, idea: true };
    const claveV = N.esDocumental(EST.paleta) ? "viral-doc" : "viral";
    if (!fijosCache.has(claveV)) fijosCache.set(claveV, N.tokensFijosViral(N.esDocumental(EST.paleta) ? "documental" : "general"));
    const fijos = fijosCache.get(claveV);
    const est = N.estimarViral({ modelo: EST.modelo, caracteres: r.caracteres, escenas: r.escenasObjetivo, tokensSistema: fijos.sistema });
    return { r: { ...r, escenas: new Array(r.escenasObjetivo).fill(0) }, svg: 0, tres: 0, est, idea: true, fijos };
  }
  if (formato !== "estructurado") {
    // guion en bloques: la locución y los tiempos son los tuyos; la IA solo elige la plantilla de cada escena (≈ 120 tokens por escena)
    const r = N.parsearEstudio(EST.guion);
    const svg = r.escenas.filter((e) => e.modo === "SVG").length, tres = r.escenas.filter((e) => e.modo === "3D").length;
    if (!r.escenas.length) return { r, svg, tres, est: null, estudio: true };
    const claveB = N.esDocumental(EST.paleta) ? "viral-doc" : "viral";
    if (!fijosCache.has(claveB)) fijosCache.set(claveB, N.tokensFijosViral(N.esDocumental(EST.paleta) ? "documental" : "general"));
    const fijos = fijosCache.get(claveB);
    const est = N.estimarViral({ modelo: EST.modelo, caracteres: r.caracteresIA, escenas: r.escenas.length, tokensSistema: fijos.sistema, conVoz: false });
    return { r, svg, tres, est, estudio: true, fijos };
  }
  if (formato === "estructurado") {
    // formato estructurado: a la IA solo viajan las líneas GEO → entrada = GEO/4 + prompt compacto (+ esquema), salida = 450 por línea GEO
    const r = N.parsearEstructurado(EST.guion);
    const svg = r.escenas.filter((e) => e.modo === "SVG").length, tres = r.escenas.filter((e) => e.modo === "3D").length;
    if (!r.escenas.length || !r.lineasGeo) return { r, svg, tres, est: null, estructurado: true };
    const opc = { paleta: N.paletaRetroDe(EST.paleta), svg: svg > 0, tres: tres > 0, mixto: r.escenas.some((e) => e.mixto), hud: r.config.hud };
    const clave = `g|${opc.paleta}|${opc.svg}|${opc.tres}|${opc.mixto}|${opc.hud}`;
    if (!fijosCache.has(clave)) fijosCache.set(clave, N.tokensFijosGeo(opc));
    const fijos = fijosCache.get(clave);
    const est = N.estimarGeo({ modelo: EST.modelo, caracteresGeo: r.caracteresGeo, lineasGeo: r.lineasGeo, escenas: r.escenas.length, tokensSistema: fijos.sistema, tokensEsquema: fijos.esquema });
    return { r, svg, tres, est, estructurado: true, fijos };
  }
  return { r: N.parsearEstudio(EST.guion), svg: 0, tres: 0, est: null, estudio: true };
}

function pintarEstimacion() {
  const { r, svg, tres, est, estructurado, estudio, idea, fijos } = calcularEstimacion();
  const N = EST.N;
  const badge = $("#costo-estimado");
  if (badge) {
    const detalle = !est ? "escribe tu idea para calcularlo" : idea
      ? `≈ ${num(est.tokensEntrada)} tokens de entrada (prompt fijo ${num(fijos.sistema)} + tu frase) + ${num(est.tokensSalida)} de salida (guion y diseño de ≈ ${r.escenasObjetivo} escenas × ${num(N.SALIDA_POR_ESCENA_VIRAL)})`
      : estudio
      ? `≈ ${num(est.tokensEntrada)} tokens de entrada (prompt fijo ${num(fijos.sistema)} + guion) + ${num(est.tokensSalida)} de salida (diseño de ${r.escenas.length} escenas × ${num(N.SALIDA_POR_ESCENA_VIRAL_BLOQUES)})`
      : estructurado
      ? `≈ ${num(est.tokensEntrada)} tokens de entrada (GEO ${num(Math.ceil(r.caracteresGeo / 4))} + sistema ${num(fijos.sistema)} + esquema ${num(fijos.esquema)}) + ${num(est.tokensSalida)} de salida (${r.lineasGeo} líneas GEO × 450)`
      : `≈ ${num(est.tokensEntrada)} tokens de entrada + ${num(est.tokensSalida)} de salida`;
    badge.replaceChildren(h("span.costo-etq", "Costo estimado de este video: "), h("strong#costo-valor", N.formatoUSD(est?.costo ?? 0, 4)), h("span.costo-det", detalle));
  }
  const info = $("#guion-info");
  if (info) {
    const partes = [];
    if (idea && !r.errores.length) {
      partes.push(h("div.fila.chicos", h("span.chip.ok", "Una frase → video"), h("span.chip", `≈ ${r.duracion} s`), h("span.chip", `≈ ${r.escenasObjetivo} escenas`), h("span.chip", `${num(r.caracteres)} caracteres → IA`)));
      partes.push(h("p.suave.chico-t", "La IA escribe el guion (locución incluida), decide la duración y elige entre 10 plantillas de reel: gancho, número gigante, versus, barras, tendencia, pasos, lista, ruta de metro, ciudad y cierre. Te deja la locución en un archivo para que la grabes. Si dices «de 45 segundos» respeta esa duración."));
    } else if (estudio && r.escenas.length) {
      partes.push(h("div.fila.chicos", h("span.chip.ok", "Guion en bloques"), h("span.chip", `${r.escenas.length} escena${r.escenas.length > 1 ? "s" : ""}`), h("span.chip", `${reloj(r.duracion)} min:s · ${num(r.duracion, 1)} s`), h("span.chip", `${svg} SVG`), h("span.chip", `${tres} 3D`), h("span.chip", `${num(r.caracteresIA)} caracteres → IA`)));
      partes.push(h("p.suave.chico-t", "Tu locución y tus tiempos se respetan; la IA solo elige la plantilla de cada escena y sus datos. La DIRECCION_VISUAL y la VOZ_OFF son lo único que viaja."));
    } else if (estructurado && r.escenas.length) {
      partes.push(h("div.fila.chicos", h("span.chip.ok", "Formato estructurado"), h("span.chip", `${r.escenas.length} escena${r.escenas.length > 1 ? "s" : ""}`), h("span.chip", `${reloj(r.duracion)} min:s · ${num(r.duracion, 1)} s`), h("span.chip", `${svg} SVG`), h("span.chip", `${tres} 3D`), h("span.chip", `${r.lineasGeo} líneas GEO → IA`), h("span.chip", r.config.hud ? `HUD: ${r.config.gauges.map((g) => g.etiqueta).join(" · ") || "ON"}` : "HUD: OFF")));
      partes.push(h("p.suave.chico-t", "Solo las líneas GEO (y el modo) se envían a la IA. Título, subtítulo, HUD, fondo, sonido y VOZ_OFF se resuelven en tu equipo."));
      if (!N.esRetro(EST.paleta)) partes.push(h("div.nota", `ℹ️ El formato estructurado usa el diseño Retro-Científico: se aplicará «${N.PALETAS[N.paletaRetroDe(EST.paleta)].nombre}».`));
    }
    const vacio = !EST.guion.trim();
    if (vacio) partes.push(h("p.suave.chico-t", `Escribe tu idea de ${marcaActiva().nombre} en una frase y la IA hace el resto (guion, locución y diseño). Ejemplo: «${marcaActiva().ideaCorta}».`));
    for (const e of vacio ? [] : r.errores) partes.push(h("div.nota.error", "⛔ " + e));
    for (const a of r.avisos) partes.push(h("div.nota.aviso", "⚠️ " + a));
    info.replaceChildren(...partes);
  }
  const gen = $("#btn-generar");
  if (gen) {
    const sinClave = !S.claves.openai;
    gen.disabled = !r.escenas.length || r.errores.length > 0;
    gen.title = !r.escenas.length ? "Escribe el guion en bloques" : r.errores.length ? "Corrige los errores del guion" : sinClave ? "Falta la clave de OpenAI (Ajustes)" : "";
  }
}

async function estudioDatos() {
  EST.datos = await api("/api/anim/estado");
  return EST.datos;
}

function pintarResultadoEstudio() {
  const cont = $("#estudio-resultado");
  if (!cont) return;
  const d = EST.datos, N = EST.N;
  const a = animActiva();
  const hijos = [];
  const otra = d?.animacion && !a ? N.marcaDePaleta(d.animacion.paleta) : null;
  if (otra) {
    // la animación cargada es de la OTRA marca: no se muestra ni se puede renderizar desde aquí (así no se mezclan los videos de IMNOBA y SINAPSIS)
    hijos.push(h(`div.tarjeta.otra-marca.marca-${otra.id}`,
      h("div.fila", chipMarca(otra), h("strong", d.animacion.titulo || "Animación cargada"), h("span.espacio"),
        h("button.btn.primario", { type: "button", onclick: () => cambiarMarca(otra.id) }, `Ir a ${otra.nombre} para verla`)),
      h("p.suave.chico-t", `Esta animación (${d.animacion.escenas.length} escenas · ${num(d.animacion.duracion, 0)} s) es de ${otra.nombre} y ahora estás en ${marcaActiva().nombre}. Cada marca tiene su propio espacio: genera o carga un ejemplo de ${marcaActiva().nombre} para trabajar aquí.`)));
  }
  if (a) {
    const uso = a.uso;
    hijos.push(h("div.tarjeta",
      h("div.cab-vista", h("div", h("h2", `🎞️ ${a.titulo || "Animación lista"} `, chipMarca(marcaActiva())), h("p.suave", `${a.escenas.length} escenas · ${num(a.duracion, 1)} s · paleta ${N.PALETAS[a.paleta]?.nombre ?? a.paleta} · SFX ${a.sfx ? "sí" : "no"}${a.formato === "estructurado" ? ` · formato estructurado · HUD ${a.hud ? "ON" : "OFF"}` : a.formato === "libre" ? " · lienzo libre" : a.formato === "estudio" ? " · motor de estudio" : a.formato === "viral" ? " · motor viral" : ""} · sin subtítulos ni voz`),
          d.rescatadas?.length ? h("div.nota.aviso", `⚠️ ${d.rescatadas.length === 1 ? `La escena ${d.rescatadas[0]} no se pudo reparar y quedó` : `Las escenas ${d.rescatadas.join(", ")} no se pudieron reparar y quedaron`} en versión sencilla. Puedes volver a generar o ajustar su DIRECCION_VISUAL.`) : null,
          d.locucion ? h("p", h("a.btn.chico", { href: d.locucion.url }, "📝 Descargar guion de locución (VOZ_OFF)"), h("span.chico-t.suave", " para leerlo al grabar tu audio")) : null),
        h("span.espacio"),
        uso ? h("div.costo.real", h("span.costo-etq", "Costo real de este video: "), h("strong#costo-real", N.formatoUSD(uso.costo_usd, 5)), h("span.costo-det", `${num(uso.prompt_tokens)} tokens de entrada (prompt_tokens) + ${num(uso.completion_tokens)} de salida (completion_tokens) · ${uso.llamadas} llamada${uso.llamadas > 1 ? "s" : ""} · ${uso.modelo}`)) : h("div.costo.real", h("span.costo-etq", "Ejemplo cargado sin IA · costo: "), h("strong", N.formatoUSD(0, 5)))),
      h("table", h("thead", h("tr", h("th", "#"), h("th", "Plantilla"), h("th", "Tiempo"), h("th", "Fotogramas"), h("th", "Locución / guion"))),
        h("tbody", a.escenas.map((e) => h("tr", h("td", e.n), h("td", h(`span.chip.modo-${e.modo}`, e.modo === "VIRAL" ? e.tipo : e.modo === "ESTUDIO" ? `${e.layout}${e.es3D ? " · 3D" : ""}` : e.modo)), h("td", `${reloj(e.inicio)}–${reloj(e.fin)}`), h("td", `${Math.round(e.dur * 60)}`), h("td.chico-t", e.texto.replace(/\s+/g, " ").slice(0, 90) + (e.texto.length > 90 ? "…" : "")))))),
      h("div.fila", { style: "margin-top:12px" },
        h("button.btn", { onclick: () => lanzar("anim-previa") }, "👁️ Ver capturas + control de calidad"),
        h("button.btn.primario", { onclick: () => lanzar("anim-render") }, "🎬 Renderizar video (1080×1920 · 60 fps)"),
        h("span.chico-t.suave", "El render de las escenas 3D tarda más que el de las SVG; el registro muestra el avance."))));
    if (d.previas.length) {
      const q = d.qa?.problemas;
      hijos.push(h("div.tarjeta", h("h3", "👁️ Capturas por escena"),
        q ? (q.length ? h("div.nota.aviso", "⚠️ El control de calidad encontró:", h("ul", q.map((x) => h("li", x)))) : h("div.nota.ok", "✅ Control de calidad: márgenes ≥ 80 px, sin escenas vacías ni congeladas.")) : null,
        h("div.rejilla-capturas", d.previas.map((u, i) => h("figure", h("a", { href: u, target: "_blank" }, h("img", { src: u, loading: "lazy", alt: `Captura de la escena ${i + 1}` })), h("figcaption", `Escena ${a.escenas[i]?.n ?? i + 1} · ${a.escenas[i]?.modo ?? ""}`))))));
    }
    if (d.video) {
      hijos.push(h("div.tarjeta", h("h3", "🎬 Video terminado"),
        h("div.fila", { style: "align-items:flex-start;gap:18px" },
          h("video.reel", { src: d.video.url, controls: true, preload: "metadata" }),
          h("div", h("p", `${d.video.mb} MB · 1080×1920 · 60 fps · H.264${a.sfx ? (a.musica ? " + AAC (efectos y música)" : " + AAC (efectos)") : " · sin pista de audio (SFX desactivados)"}`),
            h("a.btn.primario", { href: "/salida/video-animacion.mp4?descargar=1" }, "⬇️ Descargar el video"),
            h("p.chico-t.suave", "Sin subtítulos y sin voz: añade tu locución grabada en tu editor (CapCut, DaVinci, etc.)."))))); 
    }
  }
  if (d?.historial?.length) {
    // el historial se ve por marca: por defecto solo las generaciones de la marca activa; «ver todas» muestra también las de la otra
    const deMarca = (x) => N.marcaDePaleta(x.paleta);
    const propias = d.historial.filter((x) => deMarca(x).id === EST.marca);
    const filas = EST.verTodo ? d.historial : propias;
    const ocultas = d.historial.length - propias.length;
    hijos.push(h("details.tarjeta", { open: EST.verTodo }, h("summary", `🕘 Historial de ${marcaActiva().nombre} (${propias.length})`),
      ocultas > 0 ? h("div.fila.chicos", { style: "margin:8px 0" }, h("span.chico-t.suave", `${ocultas} de la otra marca ${EST.verTodo ? "se muestran" : "están ocultas"}.`),
        h("button.btn.chico", { type: "button", onclick: () => { EST.verTodo = !EST.verTodo; pintarResultadoEstudio(); } }, EST.verTodo ? "Ver solo las de esta marca" : "Ver también las de la otra marca")) : null,
      filas.length ? h("table", h("thead", h("tr", h("th", "Marca"), h("th", "Fecha"), h("th", "Título"), h("th", "Modelo"), h("th", "Escenas"), h("th", "Costo real"), h("th", ""))),
        h("tbody", filas.map((x) => h("tr", h("td", chipMarca(deMarca(x))), h("td", new Date(x.creado).toLocaleString("es-CO")), h("td", x.titulo), h("td", x.modelo ?? "—"), h("td", `${x.escenas} · ${num(x.duracion, 0)} s`), h("td", x.costo != null ? N.formatoUSD(x.costo, 5) : "—"), h("td", h("button.btn.chico", { onclick: () => cargarHistorial(x.id) }, "Cargar")))))) : h("p.chico-t.suave", `Todavía no hay generaciones de ${marcaActiva().nombre}.`)));
  }
  cont.replaceChildren(...hijos);
}

async function cargarHistorial(id) {
  if (ocupado()) return aviso("Hay un trabajo en curso: espera a que termine.", "aviso");
  try {
    const r = await api("/api/anim/cargar", { metodo: "POST", cuerpo: { id } });
    if (r.opciones?.paleta) EST.marca = EST.N.marcaDePaleta(r.opciones.paleta).id;
    EST.guion = r.guion; if (r.opciones?.modelo) EST.modelo = r.opciones.modelo; EST.sfx = r.opciones?.sfx !== false; EST.paleta = EST.N.paletaValidaParaMarca(EST.marca, r.opciones?.paleta);
    guardarEstado();
    aviso("🕘 Generación cargada.", "ok");
    await vistaEstudio($("#vista"));
  } catch (e) { fallo(e); }
}

const guardarEstado = () => { guardarLocal(CLAVE_MARCA, EST.marca); guardarLocal(claveGuion(EST.marca), EST.guion); guardarLocal("videmed-anim-modelo", EST.modelo); guardarLocal("videmed-anim-sfx", EST.sfx ? "si" : "no"); guardarLocal(clavePaleta(EST.marca), EST.paleta); };

/** Carga un ejemplo en el cuadro de texto (viral = una frase, por defecto; estudio = guion en bloques; «libre» = lienzo libre; «hud» = formato estructurado retro; «simple» = el de siempre). */
async function cargarEjemplo(formato) {
  try {
    EST.guion = (await api(`/api/anim/ejemplo?formato=${formato}&marca=${EST.marca}&paleta=${encodeURIComponent(EST.paleta)}`)).guion;
    $("#guion").value = EST.guion;
    guardarEstado();
    pintarEstimacion();
  } catch (e) { fallo(e); }
}

/* ───────────── Voz en off: se pone DESPUÉS de ver el video. Tres caminos: ElevenLabs (voz de estudio), OpenAI (barata, estilos colombianos) o tu propia voz (CapCut, locutor) ───────────── */
const VOZ = {
  motor: leerLocal("videmed-voz-motor") || "eleven", estilo: leerLocal("videmed-voz-estilo") ?? "", voz: leerLocal("videmed-voz-voz") ?? "", ritmo: leerLocal("videmed-voz-ritmo") ?? "", extra: leerLocal("videmed-voz-extra") ?? "",
  voiceId: leerLocal("videmed-voz-id") ?? "", nombreVoz: leerLocal("videmed-voz-nombre") ?? "", modeloEleven: leerLocal("videmed-voz-modeloe") ?? "", perfil: leerLocal("videmed-voz-perfil") ?? "", ajuste: leerLocal("videmed-voz-ajuste") || "voz",
  archivo: "", duraciones: "", vocesEleven: null, cargandoVoces: false, subiendo: false, info: null, probando: false, prueba: null,
};
const guardarVoz = () => { for (const [k, v] of [["motor", VOZ.motor], ["estilo", VOZ.estilo], ["voz", VOZ.voz], ["ritmo", VOZ.ritmo], ["extra", VOZ.extra], ["id", VOZ.voiceId], ["nombre", VOZ.nombreVoz], ["modeloe", VOZ.modeloEleven], ["perfil", VOZ.perfil], ["ajuste", VOZ.ajuste]]) guardarLocal(`videmed-voz-${k}`, v); };
const opcionesDeVoz = () => ({ motor: VOZ.motor === "eleven" ? "eleven" : "openai", estilo: VOZ.estilo, voz: VOZ.voz, ritmo: VOZ.ritmo, extra: VOZ.extra, voiceId: VOZ.voiceId, nombreVoz: VOZ.nombreVoz, modelo: VOZ.modeloEleven, perfil: VOZ.perfil, ajuste: VOZ.ajuste });

async function probarVozPanel() {
  if (VOZ.probando) return;
  VOZ.probando = true;
  await pintarVoz(false);
  try {
    const frase = animActiva()?.escenas?.[0]?.texto;
    VOZ.prueba = await api("/api/anim/voz/probar", { metodo: "POST", cuerpo: { ...opcionesDeVoz(), texto: frase ? String(frase).slice(0, 260) : "" } });
    const costo = VOZ.prueba.creditos ? ` (${VOZ.prueba.creditos} créditos)` : VOZ.prueba.costoUsd ? ` (≈ US$ ${VOZ.prueba.costoUsd})` : " (de la caché)";
    aviso(`🔊 Voz «${VOZ.prueba.voz}» lista${costo}.`, "ok", 3500);
  } catch (e) { fallo(e); }
  VOZ.probando = false;
  await pintarVoz(false);
  document.querySelector("#voz-prueba-audio")?.play?.().catch(() => {});
}

async function cargarVocesEleven() {
  VOZ.cargandoVoces = true;
  await pintarVoz(false);
  try {
    VOZ.vocesEleven = (await api("/api/anim/voz/eleven-voces")).voces;
    const v = VOZ.vocesEleven.find((x) => x.id === VOZ.voiceId) ?? VOZ.vocesEleven[0];
    if (v) { VOZ.voiceId = v.id; VOZ.nombreVoz = v.nombre; guardarVoz(); }
    aviso(`✅ ${VOZ.vocesEleven.length} voces de tu cuenta de ElevenLabs.`, "ok", 3500);
  } catch (e) { fallo(e); }
  VOZ.cargandoVoces = false;
  await pintarVoz(false);
}

async function subirAudioVoz(archivo) {
  if (!archivo) return;
  VOZ.subiendo = true;
  await pintarVoz(false);
  try {
    const r = await api(`/api/anim/voz/subir?nombre=${encodeURIComponent(archivo.name)}`, { metodo: "POST", crudo: archivo });
    VOZ.archivo = r.archivo;
    aviso(`✅ Audio subido (${r.mb} MB).`, "ok", 3500);
  } catch (e) { fallo(e); }
  VOZ.subiendo = false;
  await pintarVoz();
}

/** «9.8, 11.2, 12» → [9.8, 11.2, 12] (con «;» o saltos de línea como separador, la coma puede ser decimal); vacío → [] (corte automático) */
const leerDuraciones = (t) => { const x = String(t ?? "").trim(); return (/[;\n]/.test(x) ? x.split(/[;\n]+/) : x.split(/[,\s]+/)).map((q) => q.trim().replace(",", ".")).filter(Boolean).map(Number); };

async function pintarVoz(recargar = true) {
  const cont = $("#estudio-voz");
  if (!cont) return;
  const N = EST.N;
  if (recargar || !VOZ.info) { try { VOZ.info = await api("/api/anim/voz"); } catch { VOZ.info = null; } }
  const d = VOZ.info;
  const estilo = N.estiloPorId(VOZ.estilo) ?? N.estiloPorId(N.ESTILO_POR_DEFECTO);
  VOZ.estilo = estilo.id;
  VOZ.ritmo = N.RITMOS_VOZ.find((r) => r.id === VOZ.ritmo)?.id ?? N.RITMO_POR_DEFECTO;
  if (VOZ.voz && !N.vozPorId(VOZ.voz)) VOZ.voz = "";
  if (!["eleven", "openai", "propia"].includes(VOZ.motor)) VOZ.motor = "eleven";
  VOZ.modeloEleven = N.modeloElevenPorId(VOZ.modeloEleven).id;
  VOZ.perfil = N.perfilElevenPorId(VOZ.perfil).id;
  if (VOZ.ajuste !== "video") VOZ.ajuste = "voz";
  const hayAnim = Boolean(animActiva());
  if (!hayAnim) { cont.replaceChildren(); return; }
  const eleven = VOZ.motor === "eleven", propia = VOZ.motor === "propia";
  const clave = eleven ? S.claves.elevenlabs : S.claves.openai;
  const nombreClave = eleven ? "ElevenLabs" : "OpenAI";
  const sinClave = !propia && !clave;
  const faltaVoz = eleven && !VOZ.voiceId;
  const bloqueado = !d?.hayTexto || sinClave || faltaVoz || ocupado();
  const razon = !d?.hayTexto ? "Este video no trae texto de voz" : sinClave ? `Falta la clave de ${nombreClave} (Ajustes)` : faltaVoz ? "Elige una voz de ElevenLabs" : ocupado() ? "Hay un trabajo en curso" : "";
  const v = d?.voz;
  const est = d?.estimado;
  const estE = d?.estimadoEleven?.[VOZ.modeloEleven];
  const elegir = (k, f) => (e) => { VOZ[k] = e.target.value; f?.(); guardarVoz(); pintarVoz(false); };
  const ritmoSel = h("div.campo", h("label.etq", { for: "voz-ritmo" }, "Ritmo"),
    h("select#voz-ritmo", { onchange: elegir("ritmo") }, N.RITMOS_VOZ.map((x) => h("option", { value: x.id, selected: x.id === VOZ.ritmo }, x.etiqueta))));

  /* ── selector de dónde sale la voz ── */
  const motores = [["eleven", "🎙️ ElevenLabs", "voz de estudio, la más natural"], ["openai", "🤖 OpenAI", "barata, estilos colombianos"], ["propia", "🎧 Mi voz", "CapCut, locutor o tu grabación"]];
  const selector = h("div.selector-motor", { role: "tablist", "aria-label": "De dónde sale la voz" }, motores.map(([id, t, sub]) =>
    h(`button.motor-op${VOZ.motor === id ? ".activa" : ""}`, { type: "button", role: "tab", "aria-selected": String(VOZ.motor === id), onclick: () => { VOZ.motor = id; VOZ.prueba = null; guardarVoz(); pintarVoz(false); } }, h("strong", t), h("span", sub))));

  /* ── ajustes del camino elegido ── */
  let ajustes;
  if (eleven) {
    const lista = VOZ.vocesEleven;
    ajustes = [
      h("div.ajustes-3",
        h("div.campo", h("label.etq", { for: "voz-eleven" }, "Voz de ElevenLabs"),
          lista ? h("select#voz-eleven", { onchange: (e) => { const x = lista.find((q) => q.id === e.target.value); VOZ.voiceId = x?.id ?? ""; VOZ.nombreVoz = x?.nombre ?? ""; VOZ.prueba = null; guardarVoz(); pintarVoz(false); } },
            lista.some((x) => x.id === VOZ.voiceId) ? null : h("option", { value: "", selected: true }, "— elige una —"),
            lista.map((x) => h("option", { value: x.id, selected: x.id === VOZ.voiceId }, `${x.espanol ? "🇪🇸 " : ""}${x.nombre}${[x.genero, x.acento, x.edad, x.uso].filter(Boolean).length ? " · " + [x.genero, x.acento, x.edad, x.uso].filter(Boolean).join(" · ") : ""}`)))
            : h("p.chico-t.suave", { style: "margin:0" }, "Pulsa «Cargar mis voces» para ver las de tu cuenta, o pega abajo el ID de una voz."),
          h("div.fila.chicos", h("button.btn.chico", { type: "button", disabled: !S.claves.elevenlabs || VOZ.cargandoVoces, onclick: cargarVocesEleven }, VOZ.cargandoVoces ? "⏳ Cargando…" : "🔄 Cargar mis voces de ElevenLabs"),
            (lista?.find((x) => x.id === VOZ.voiceId)?.preview) ? h("audio", { controls: true, src: lista.find((x) => x.id === VOZ.voiceId).preview, style: "height:32px", preload: "none" }) : null)),
        h("div.campo", h("label.etq", { for: "voz-id" }, "o pega el ID de la voz"),
          h("input#voz-id", { type: "text", spellcheck: false, autocomplete: "off", placeholder: "p. ej. pNInz6obpgDQGcFmaJgB", value: VOZ.voiceId, oninput: (e) => { VOZ.voiceId = e.target.value.trim(); VOZ.nombreVoz = lista?.find((x) => x.id === VOZ.voiceId)?.nombre ?? ""; guardarVoz(); }, onchange: () => pintarVoz(false) }),
          h("p.chico-t.suave", { style: "margin:0" }, "En elevenlabs.io → Voices: añade a «Mis voces» una colombiana o latina y copia su ID.")),
        h("div.campo", h("label.etq", { for: "voz-modelo-e" }, "Modelo"),
          h("select#voz-modelo-e", { onchange: elegir("modeloEleven") }, N.MODELOS_ELEVEN.map((x) => h("option", { value: x.id, selected: x.id === VOZ.modeloEleven }, x.etiqueta)))),
        h("div.campo", h("label.etq", { for: "voz-perfil" }, "Expresión"),
          h("select#voz-perfil", { onchange: elegir("perfil") }, N.PERFILES_ELEVEN.map((x) => h("option", { value: x.id, selected: x.id === VOZ.perfil }, x.etiqueta)))),
        ritmoSel),
    ];
  } else if (!propia) {
    ajustes = [
      h("div.ajustes-3",
        h("div.campo", h("label.etq", { for: "voz-estilo" }, "Estilo colombiano"),
          h("select#voz-estilo", { onchange: elegir("estilo") }, N.ESTILOS_VOZ.map((x) => h("option", { value: x.id, selected: x.id === VOZ.estilo }, x.etiqueta)))),
        h("div.campo", h("label.etq", { for: "voz-voz" }, "Voz base"),
          h("select#voz-voz", { onchange: elegir("voz") },
            h("option", { value: "", selected: !VOZ.voz }, `✨ Recomendada del estilo (${estilo.voz})`),
            N.VOCES_OPENAI.map((x) => h("option", { value: x.id, selected: x.id === VOZ.voz }, `${x.nombre} · ${x.suena} · ${x.nota}`)))),
        ritmoSel),
      h("details", { open: Boolean(VOZ.extra) }, h("summary.chico-t.suave", "Instrucciones propias (opcional) y lo que se le pide al modelo"),
        h("textarea#voz-extra", { rows: 2, spellcheck: false, placeholder: "Ej.: habla como si le contaras un chisme a una amiga; más emoción en las cifras; di «parce» al final…", value: VOZ.extra, oninput: (e) => { VOZ.extra = e.target.value; guardarVoz(); } }),
        h("p.chico-t.suave", { style: "white-space:pre-wrap" }, N.construirInstrucciones(opcionesDeVoz()))),
    ];
  }

  /* ── cómo se encaja la voz con el video (solo ElevenLabs y OpenAI) ── */
  const ajusteCampo = propia ? null : h("div.campo", { style: "margin-top:10px" }, h("label.etq", { for: "voz-ajuste" }, "Si una frase no cabe en su escena…"),
    h("select#voz-ajuste", { onchange: elegir("ajuste") },
      h("option", { value: "voz", selected: VOZ.ajuste === "voz" }, `⏩ Acelerar un poco la voz (hasta ×${eleven ? N.TEMPO_MAX_ELEVEN : N.TEMPO_MAX}) · el video renderizado se queda igual`),
      h("option", { value: "video", selected: VOZ.ajuste === "video" }, "↔️ Alargar esa escena y dejar la voz natural · hay que renderizar de nuevo")));

  /* ── costo ── */
  const costo = propia ? null
    : eleven ? (estE && estE.escenas ? h("div", { style: "margin-top:10px" },
      h("div.fila.chicos", h("span.chip", `${estE.escenas} escenas`), h("span.chip", `${num(estE.caracteres)} caracteres ≈ ${Math.round(estE.segundos)} s de voz`), h("span.chip.ok", `≈ ${num(estE.creditos)} créditos`), h("span.chip", `≈ US$ ${estE.usdApi.toFixed(2)} a tarifa de API`)),
      h("details", h("summary.chico-t.suave", "¿Cuánto me cuesta con un plan de ElevenLabs?"),
        h("table", h("thead", h("tr", h("th", "Plan"), h("th", "US$/mes"), h("th", "Créditos/mes"), h("th", "Videos como este"), h("th", "≈ por video"))),
          h("tbody", estE.porPlan.map((q) => h("tr", h("td", q.plan.nombre + (q.plan.comercial ? "" : " (sin uso comercial)")), h("td", q.plan.usdMes), h("td", num(q.plan.creditos)), h("td", q.videos), h("td", `US$ ${q.usdPorVideo.toFixed(2)}`))))),
        h("p.chico-t.suave", "Referencia (verifícala en elevenlabs.io/pricing: los planes cambian). Probar una voz y regenerar gastan créditos; las frases ya generadas con la misma voz y ajustes salen de la caché sin costo. Para publicar con fines comerciales necesitas un plan de pago."))) : null)
      : est && est.escenas ? h("div.fila.chicos", { style: "margin-top:10px" }, h("span.chip", `${est.escenas} escenas`), h("span.chip", `${est.caracteres} caracteres ≈ ${Math.round(est.segundos)} s de voz`), h("span.chip.ok", `≈ US$ ${est.usd.toFixed(3)} (gpt-4o-mini-tts)`)) : null;

  /* ── Mi voz (CapCut u otra) ── */
  const archivos = d?.externa?.archivos ?? [];
  if (propia && !archivos.includes(VOZ.archivo)) VOZ.archivo = archivos.at(-1) ?? "";
  const bloquePropia = propia ? h("div",
    h("div.nota", h("strong", "Con CapCut (o cualquier locutor): "), "genera la voz en CapCut con TODO el texto seguido (te lo dejo en «guion-locucion»), expórtala como audio (mp3/m4a/wav) y súbela aquí. El video se ajusta a ella: cada escena pasa a durar lo que dura su frase y la voz empieza en 0:00, igual que el video. Así ya no tienes que alinear nada a mano. Tu voz debe decir el mismo texto, en el mismo orden."),
    h("div.fila", { style: "align-items:center;margin:8px 0" },
      h("label.btn", { for: "voz-archivo" }, VOZ.subiendo ? "⏳ Subiendo…" : "📤 Subir el audio de mi voz"),
      h("input#voz-archivo", { type: "file", accept: "audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.opus", hidden: true, disabled: VOZ.subiendo, onchange: (e) => subirAudioVoz(e.target.files?.[0]) }),
      archivos.length ? h("select#voz-archivo-sel", { onchange: (e) => { VOZ.archivo = e.target.value; } }, archivos.map((f) => h("option", { value: f, selected: f === VOZ.archivo }, f))) : h("span.chico-t.suave", "Todavía no subiste ningún audio.")),
    h("details", { open: Boolean(VOZ.duraciones) }, h("summary.chico-t.suave", `Si el corte automático se equivoca: escribe las duraciones a mano (${est?.escenas ?? "?"} números, una por escena con locución)`),
      h("textarea#voz-duraciones", { rows: 2, spellcheck: false, placeholder: "Ej.: 9.8, 11.2, 8.5, …  (segundos, decimales con punto; vacío = automático)", value: VOZ.duraciones, oninput: (e) => { VOZ.duraciones = e.target.value; } })),
    h("div.fila", { style: "margin-top:10px" }, h("span.espacio"),
      h("button.btn.primario", { type: "button", disabled: ocupado() || !d?.hayTexto || !VOZ.archivo, title: !VOZ.archivo ? "Primero sube tu audio" : "", onclick: async () => { if (ocupado()) return aviso("Hay un trabajo en curso: espera a que termine.", "aviso"); await lanzar("anim-voz-externa", { archivo: VOZ.archivo, duraciones: leerDuraciones(VOZ.duraciones) }); } }, "🎯 Alinear el video a esta voz"))) : null;

  /* ── resultado (común a los tres caminos) ── */
  const etiquetaVoz = !v ? "" : v.externa ? `tu voz (${v.archivo})` : v.motor === "eleven" ? `ElevenLabs «${v.voz}» · ${v.modelo} · expresión ${v.estilo}` : `«${v.voz}» · ${N.estiloPorId(v.estilo)?.etiqueta ?? v.estilo} · ritmo ${v.ritmo}`;
  const resultado = v ? h("div", { style: "margin-top:12px" },
    v.vigente ? h("div.nota.ok", `✅ Voz lista: ${etiquetaVoz}. ${v.necesitaRender ? "Cambió los tiempos del video: renderízalo de nuevo (la voz se mezcla sola)." : "Se mezcla sola al renderizar, o ponla al video que ya renderizaste."}`) : h("div.nota.aviso", "⚠️ La voz generada es de otra versión de este video (cambió el texto o los tiempos). Vuelve a generarla."),
    v.creditos ? h("p.chico-t.suave", `Gasto real de esta generación: ${num(v.creditos)} créditos (≈ US$ ${Number(v.costoUsd).toFixed(3)} a tarifa de API).`) : null,
    v.avisos?.length ? h("div.nota.aviso", v.avisos.map((m) => h("div", `⚠️ ${m}`))) : null,
    v.ajuste === "video" && v.alargadas?.length ? h("div.nota", `↔️ Alargué las escenas ${v.alargadas.join(", ")} para que la voz natural quepa. Al renderizar, el video dura lo que su locución.`) : null,
    v.audio ? h("div.fila.chicos", h("span.chico-t.suave", "Escucha la voz completa:"), h("audio", { controls: true, src: v.audio, style: "height:36px" })) : null,
    v.escenas?.some((x) => !x.cabe) ? h("div.nota.aviso", `⚠️ En la(s) escena(s) ${v.escenas.filter((x) => !x.cabe).map((x) => x.n).join(", ")} la voz es más larga que la escena (se aceleró al máximo y se cortó el final). Acorta ese texto, alarga la escena o elige «Alargar esa escena».`) : null,
    h("details", h("summary.chico-t.suave", "Detalle por escena"),
      h("table", h("thead", h("tr", h("th", "#"), h("th", "Escena"), h("th", "Voz"), h("th", "Ajuste"))),
        h("tbody", v.escenas.map((x) => h("tr", h("td", x.n), h("td", `${num(x.dur, 1)} s`), h("td", `${num(x.durVoz, 1)} s`), h("td", x.cortada ? "✂️ cortada" : x.alargada ? "↔️ escena alargada" : x.tempo > 1.001 ? `⏩ ×${num(x.tempo, 2)}` : "✅")))))),
    h("div.fila", { style: "margin-top:10px" },
      h("button.btn.primario", { type: "button", disabled: ocupado() || !v.vigente, title: v.vigente ? "" : "La voz es de otra versión del video: vuelve a generarla", onclick: async () => { if (ocupado()) return aviso("Hay un trabajo en curso: espera a que termine.", "aviso"); await lanzar("anim-render"); } }, "🎬 Renderizar con voz"),
      h("button.btn", { type: "button", disabled: ocupado() || !d?.video || !v.vigente || v.necesitaRender, title: !v.vigente ? "La voz es de otra versión del video: vuelve a generarla" : v.necesitaRender ? "Los tiempos del video cambiaron: usa «Renderizar con voz»" : d?.video ? "Mezcla la voz con el audio del MP4 ya renderizado, sin volver a renderizar" : "Primero renderiza el video", onclick: async () => { if (ocupado()) return aviso("Hay un trabajo en curso: espera a que termine.", "aviso"); await lanzar("anim-poner-voz"); } }, "➕ Ponerla al video ya renderizado"),
      h("button.btn.chico", { type: "button", disabled: ocupado(), onclick: async () => { if (ocupado()) return aviso("Hay un trabajo en curso: espera a que termine.", "aviso"); await lanzar("anim-render", { sinVoz: true }); } }, "🔇 Renderizar sin voz"),
      d?.externa?.hayCopia ? h("button.btn.chico", { type: "button", disabled: ocupado(), title: "Vuelve a los tiempos que tenía el video antes de ajustarlo a la voz", onclick: async () => { if (ocupado()) return aviso("Hay un trabajo en curso: espera a que termine.", "aviso"); await lanzar("anim-voz-externa", { deshacer: true }); } }, "↩️ Volver a los tiempos originales") : null)) : null;

  cont.replaceChildren(h("div.tarjeta.voz",
    h("h2", "🎙️ Voz en off · ponla después de ver tu video"),
    h("ol.pasos-voz",
      h("li", h("strong", "Renderiza el video sin voz"), " y míralo (el botón «Renderizar» de arriba)."),
      h("li", h("strong", "Elige de dónde sale la voz"), ` y pruébala: ${d?.video ? "ya tienes un video renderizado ✅" : "todavía no hay video renderizado"}.`),
      h("li", h("strong", "Genera la voz"), ": cada frase se ajusta a su escena."),
      h("li", h("strong", "Ponla al video ya renderizado"), " (sin volver a renderizar) y descárgalo.")),
    selector,
    propia ? bloquePropia : [
      h("p.suave", eleven ? "ElevenLabs entrega la voz más natural. Elige una de tu cuenta (mejor una latina o colombiana), pruébala y genera la voz de TODAS las escenas: cada frase se lee con el contexto de la anterior y la siguiente para que la entonación fluya." : "Elige un estilo (bogotano, paisa, costeño, caleño…), pruébalo y genera la voz de TODAS las escenas de este video. Cada frase se ajusta al tiempo de su escena."),
      ajustes, ajusteCampo, costo,
      h("div.fila", { style: "margin-top:10px;align-items:center" },
        h("button.btn", { type: "button", disabled: sinClave || faltaVoz || VOZ.probando || ocupado(), title: sinClave ? `Falta la clave de ${nombreClave} (Ajustes)` : faltaVoz ? "Elige una voz de ElevenLabs" : "", onclick: probarVozPanel }, VOZ.probando ? "⏳ Generando prueba…" : "🔊 Probar esta voz"),
        VOZ.prueba ? h("audio#voz-prueba-audio", { controls: true, src: VOZ.prueba.url, style: "height:36px" }) : null,
        h("span.espacio"),
        h("button.btn.primario", { type: "button", disabled: bloqueado, title: razon, onclick: async () => { if (ocupado()) return aviso("Hay un trabajo en curso: espera a que termine.", "aviso"); await lanzar("anim-voz", opcionesDeVoz()); } }, v && !v.externa ? "🎙️ Volver a generar la voz" : "🎙️ Generar la voz de este video")),
      sinClave ? h("div.nota.aviso", `🔑 Para generar la voz con ${nombreClave} falta su clave: `, h("a", { href: "#/ajustes" }, "ponla en Ajustes"), ".") : null,
    ],
    resultado,
    d?.videoConVoz ? h("div", { style: "margin-top:12px" }, h("h3", "🎞️ Video con voz"),
      h("div.fila", { style: "align-items:flex-start;gap:18px" },
        h("video.reel", { src: d.videoConVoz.url, controls: true, preload: "metadata" }),
        h("div", h("p", `${d.videoConVoz.mb} MB · con la voz mezclada`), h("a.btn.primario", { href: "/salida/video-animacion-con-voz.mp4?descargar=1" }, "⬇️ Descargar el video con voz")))) : null,
    propia ? null : h("p.chico-t.suave", "⚠️ Son voces sintéticas: la entonación puede variar de una generación a otra. Prueba varias y quédate con la que mejor suene."),
  ));
}

/** Cambia de marca: guarda el borrador de la actual, carga el de la otra y repinta todo el Estudio (ejemplos, paletas, historial, colores). */
async function cambiarMarca(id) {
  if (!EST.N.marcaPorId(id) || id === EST.marca) return;
  guardarEstado();
  EST.marca = id;
  EST.verTodo = false;
  cargarBorradorMarca();
  guardarEstado();
  await vistaEstudio($("#vista"));
}

async function vistaEstudio(cont) {
  EST.N ??= await import("/modulos/anim-nucleo.js");
  const N = EST.N;
  await estudioDatos();
  iniciarMarca();
  const M = marcaActiva();
  pintarMarca(M);
  S.estudioRefrescar = async () => { await estudioDatos(); pintarResultadoEstudio(); pintarEstimacion(); await pintarVoz(); };
  const generar = async () => {
    if (ocupado()) return aviso("Hay un trabajo en curso: espera a que termine.", "aviso");
    if (!S.claves.openai) return aviso("Falta la clave de OpenAI: ponla en ⚙️ Ajustes. Mientras tanto puedes cargar el ejemplo y renderizarlo gratis.", "aviso", 9000);
    guardarEstado();
    await lanzar("anim-generar", { guion: EST.guion, modelo: EST.modelo, sfx: EST.sfx, paleta: EST.paleta, marca: EST.marca });
  };
  cont.replaceChildren(
    h("div.cab-vista", h("div", h("h1", "✨ Estudio de video"), h("p.suave", "Primero elige la marca: cada una tiene sus propios ejemplos, su paleta, su historial y su identidad. Después escribe tu idea (una frase o todo el detalle que quieras): la IA escribe el guion, decide la duración y diseña cada escena. Sin subtítulos: la voz la grabas tú con el guion que te deja listo, o se la pones con IA (voces colombianas) en la tarjeta «🎙️ Voz en off»."))),
    h("div.selector-marca", { role: "tablist", "aria-label": "Marca del video" }, N.IDS_MARCA.map((id) => {
      const m = N.MARCAS[id], sel = id === EST.marca;
      return h(`button.marca-opcion.marca-${id}${sel ? ".activa" : ""}`, { type: "button", role: "tab", "aria-selected": String(sel), title: m.descripcion, onclick: () => cambiarMarca(id) },
        h("span.ico", m.icono), h("span.cuerpo", h("strong", m.nombre), h("span", m.rubro)), h("span.estado", sel ? "✓ activa" : "cambiar"));
    })),
    h(`div.banda-marca.marca-${M.id}`, h("div", h("strong", `${M.icono} ${M.nombre}`), h("span", ` · ${M.rubro}`)), h("p", M.descripcion),
      h("div.fila.chicos", h("span.chico-t", "Paletas de esta marca:"), M.paletas.map((id) => h("span.chip.paleta", N.PALETAS[id]?.nombre ?? id)))),
    h(`div.tarjeta.estudio.marca-${M.id}`,
      h("div.fila", h("label.etq", { for: "guion" }, `1 · Tu idea para ${M.nombre} (una frase o todo el detalle que quieras)`), h("span.espacio"),
        h("button.btn.chico", { type: "button", onclick: async () => aviso((await copiarTexto(N.promptFormateadorIdea(EST.marca))) ? `📋 Prompt de ${M.nombre} copiado. Pégalo en ChatGPT/Claude con tus notas y te devolverá la frase de idea lista para pegar aquí.` : "No pude copiar automáticamente: selecciona el texto a mano.", "ok", 7000) }, "📋 Copiar Prompt Formateador"),
        h("button.btn.chico", { type: "button", onclick: async () => cargarEjemplo("viral") }, `🧪 Cargar idea de ejemplo de ${M.nombre}`)),
      h("div.fila.chicos", h("span.chico-t.suave", `Ejemplos de ${M.nombre} (sin IA y sin coste):`),
        M.ejemplos.map((ej) => h(`button.btn.chico${ej.principal ? ".primario" : ""}`, { type: "button", "data-ejemplo": ej.id, title: ej.ayuda, onclick: async () => { if (ocupado()) return aviso("Hay un trabajo en curso: espera a que termine.", "aviso"); await lanzar("anim-ejemplo", { tema: ej.tema, paleta: ej.paleta, sfx: EST.sfx }); } }, ej.etiqueta))),
      h("details.otros-formatos", h("summary.chico-t.suave", "Avanzado: guion en bloques, lienzo libre, HUD retro y simple"),
        h("div.fila.chicos",
          h("button.btn.chico", { type: "button", onclick: async () => aviso((await copiarTexto(N.PROMPT_FORMATEADOR_ESTUDIO)) ? "📋 Prompt del guion en bloques copiado ([ESCENA | tiempo | MODO] + VOZ_OFF + DIRECCION_VISUAL + SFX)." : "No pude copiar automáticamente.", "ok", 5000) }, "📋 Prompt guion en bloques"),
          M.id === "imnoba" ? h("button.btn.chico", { type: "button", onclick: async () => cargarEjemplo("estudio") }, "🧪 Ejemplo en bloques") : null,
          h("button.btn.chico", { type: "button", onclick: async () => aviso((await copiarTexto(N.PROMPT_FORMATEADOR_LIBRE)) ? "📋 Prompt del lienzo libre copiado (solo [ESCENA n | tiempo])." : "No pude copiar automáticamente.", "ok", 5000) }, "📋 Prompt lienzo libre"),
          M.id === "imnoba" ? h("button.btn.chico", { type: "button", onclick: async () => cargarEjemplo("libre") }, "🧪 Ejemplo lienzo libre") : null,
          h("button.btn.chico", { type: "button", onclick: async () => aviso((await copiarTexto(N.PROMPT_FORMATEADOR_ESTRUCTURADO)) ? "📋 Prompt del formato con HUD copiado ([CONFIG], GEO y HUD)." : "No pude copiar automáticamente.", "ok", 5000) }, "📋 Prompt formato HUD"),
          h("button.btn.chico", { type: "button", onclick: async () => aviso((await copiarTexto(N.PROMPT_FORMATEADOR)) ? "📋 Prompt del formato simple copiado." : "No pude copiar automáticamente.", "ok", 5000) }, "📋 Prompt formato simple"),
          M.id === "imnoba" ? h("button.btn.chico", { type: "button", onclick: async () => cargarEjemplo("hud") }, "🧪 Ejemplo HUD") : null,
          M.id === "imnoba" ? h("button.btn.chico", { type: "button", onclick: async () => cargarEjemplo("simple") }, "🧪 Ejemplo simple") : null,
          M.id !== "imnoba" ? h("span.chico-t.suave", `Los ejemplos de estos formatos son de IMNOBA; para ${M.nombre} usa los de arriba o escribe tu idea.`) : null)),
      h("textarea#guion.guion", { rows: 8, spellcheck: false, placeholder: M.placeholder, value: EST.guion, oninput: (e) => { EST.guion = e.target.value; guardarEstado(); pintarEstimacion(); } }),
      h("div#guion-info.guion-info"),
      h("div.ajustes-3",
        h("div.campo", h("label.etq", { for: "modelo" }, "2 · Modelo de IA"),
          h("select#modelo", { onchange: (e) => { EST.modelo = e.target.value; guardarEstado(); pintarEstimacion(); } }, N.MODELOS.map((m) => h("option", { value: m.id, selected: m.id === EST.modelo }, m.etiqueta)))),
        h("div.campo", h("label.etq", { for: "sfx" }, "3 · Incluir sonido (efectos + música)"),
          h("label.interruptor", h("input#sfx", { type: "checkbox", checked: EST.sfx, onchange: (e) => { EST.sfx = e.target.checked; $("#sfx-txt").textContent = EST.sfx ? "Sí" : "No"; guardarEstado(); pintarEstimacion(); } }), h("span.pista"), h("strong#sfx-txt", EST.sfx ? "Sí" : "No")),
          h("span.chico-t.suave", "No = el video sale sin pista de audio (sin efectos ni música). Sí = efectos sincronizados y música de fondo en el motor viral.")),
        h("div.campo", h("label.etq", { for: "paleta" }, `4 · Paleta de ${M.nombre}`),
          h("select#paleta", { onchange: (e) => { EST.paleta = e.target.value; $("#paleta-nota").textContent = notaPaleta(); guardarEstado(); pintarEstimacion(); } }, M.paletas.map((id) => N.PALETAS[id]).filter(Boolean).map((p) => h("option", { value: p.id, selected: p.id === EST.paleta }, p.nombre))),
          h("span#paleta-nota.chico-t.suave", notaPaleta()))),
      h("div.fila.pie-estudio", h("div#costo-estimado.costo"), h("span.espacio"),
        h("button#btn-generar.btn.primario.grande", { type: "button", onclick: generar }, `🎨 Generar animación de ${M.nombre}`))),
    !S.claves.openai ? h("div.nota.aviso", "🔑 Para generar con IA falta la clave de OpenAI: ", h("a", { href: "#/ajustes" }, "ponla en Ajustes"), ". El botón «Cargar ejemplo» + «Renderizar» funciona sin clave.") : null,
    h("div#estudio-voz"),
    h("div#estudio-resultado"),
  );
  pintarEstimacion();
  pintarResultadoEstudio();
  pintarVoz();
}

// ---------------------------------------------------------------------------
// Vista: inicio (mis proyectos)
// ---------------------------------------------------------------------------
const NOMBRE_ETAPA = { guion: "Guion", voz: "Voz", escenas: "Escenas", qa: "Calidad", render: "Video", entrega: "Entrega" };

function miniProgreso(est) {
  const e = est?.etapas ?? {};
  return h("div.miniprogreso", { title: "Guion · Voz · Escenas · Calidad · Video · Entrega" }, ["guion", "voz", "escenas", "qa", "render", "entrega"].map((k) => h(`i${e[k]?.ok ? ".on" : ""}`)));
}

/** Marca de un perfil del modo clásico (null = genérico). */
const marcaDePerfilPanel = (perfil) => EST.N.marcaDePerfil(perfil);
/** Chip de la marca de un perfil; los perfiles genéricos muestran su nombre corto. */
const chipPerfil = (perfil) => { const m = marcaDePerfilPanel(perfil); return m ? chipMarca(m) : h("span.chip", perfilDe(perfil)?.nombre?.split("·")[0] ?? perfil); };

async function vistaInicio(cont) {
  S.proyectos = await api("/api/proyectos");
  const N = EST.N;
  const filtro = N.marcaPorId(S.filtroMarca)?.id ?? "todas";
  const dentro = (perfil) => filtro === "todas" || marcaDePerfilPanel(perfil)?.id === filtro;
  const usuario = S.proyectos.usuario.filter((p) => dentro(p.perfil)), archivo = S.proyectos.archivo.filter((a) => dentro(a.perfil)), marcaEj = (e) => (e.conBrief ? marcaDePerfilPanel(e.perfil) : e.id.startsWith("animacion-") ? N.MARCAS.imnoba : N.MARCAS.sinapsis), ejemplos = S.proyectos.ejemplos.filter((e) => filtro === "todas" || marcaEj(e)?.id === filtro);
  const filtros = h("div.selector-marca.chico", { role: "tablist", "aria-label": "Filtrar por marca" },
    h(`button.marca-opcion.todas${filtro === "todas" ? ".activa" : ""}`, { type: "button", onclick: () => { S.filtroMarca = "todas"; pintarVista(); } }, h("span.ico", "🎬"), h("span.cuerpo", h("strong", "Todas"), h("span", `${S.proyectos.usuario.length} proyectos`))),
    N.IDS_MARCA.map((id) => { const m = N.MARCAS[id]; return h(`button.marca-opcion.marca-${id}${filtro === id ? ".activa" : ""}`, { type: "button", onclick: () => { S.filtroMarca = id; pintarVista(); } }, h("span.ico", m.icono), h("span.cuerpo", h("strong", m.nombre), h("span", `${S.proyectos.usuario.filter((p) => marcaDePerfilPanel(p.perfil)?.id === id).length} proyectos · ${m.rubro}`))); }));
  cont.replaceChildren(
    h("div.cab-vista", h("div", h("h1", "🎬 Mis proyectos"), h("p.suave", "Cada proyecto es un video: eliges el nicho (cada uno es de IMNOBA o de SINAPSIS), cargas tus datos y fotos, y el panel te lleva paso a paso hasta el .mp4.")), h("span.espacio"), h("a.btn.primario.grande", { href: "#/nuevo" }, "➕ Nuevo video")),
    filtros,
    usuario.length
      ? h("div.rejilla", usuario.map((p) => tarjetaProyecto(p)))
      : h("div.tarjeta.vacio", h("p", "Todavía no tienes proyectos."), h("a.btn.primario", { href: "#/nuevo" }, "Crear el primero ✨"), h("p.chico-t", "…o parte de un ejemplo listo aquí abajo.")),
    h("details.tarjeta", { open: !usuario.length }, h("summary", "📚 Ejemplos para copiar y adaptar"),
      h("p.suave.chico-t", "Datos y fotos ficticios (las imágenes son ilustraciones). «Usar como base» crea una copia editable en tus proyectos."),
      h("div.rejilla", ejemplos.filter((e) => e.conBrief).map((e) => h("div.tarjeta.proy", h("strong", e.titulo), h("div.meta", chipPerfil(e.perfil)), h("button.btn.chico", { onclick: () => usarEjemplo(e) }, "Usar como base")))),
      N.IDS_MARCA.map((id) => { const lista = ejemplos.filter((e) => !e.conBrief && marcaEj(e)?.id === id); return lista.length ? h("p.chico-t.suave", chipMarca(N.MARCAS[id]), id === "imnoba" ? " Ejemplos del Estudio (ya con escenas): " : " Ejemplos de medicina (ya con guion, voz y escenas): ", lista.map((e) => h("button.btn.chico", { style: "margin:2px", onclick: () => restaurar(e.id) }, `Abrir «${e.id}» en el Studio`))) : null; })),
    archivo.length ? h("details.tarjeta", h("summary", `🗄️ Videos anteriores (${archivo.length})`),
      h("p.suave.chico-t", "Trabajos ya producidos. «Restaurar» los deja como proyecto activo (guion, voz, escenas y fotos) para volver a renderizarlos o abrirlos en el Studio."),
      h("table", h("thead", h("tr", h("th", "Proyecto"), h("th", "Nicho"), h("th", "Video"), h("th", ""))),
        h("tbody", archivo.map((a) => h("tr", h("td", a.titulo), h("td", chipPerfil(a.perfil)), h("td", a.video ? h("a", { href: `/archivo/${a.id}/video-terminado.mp4`, target: "_blank" }, "▶ ver") : "—"), h("td", a.restaurable ? h("button.btn.chico", { onclick: () => restaurar(a.id) }, "Restaurar") : "")))))) : null,
  );
}

function tarjetaProyecto(p) {
  const pf = perfilDe(p.perfil);
  const e = p.estado;
  const sig = e ? (["guion", "voz", "escenas", "qa", "render", "entrega"].find((k) => !e.etapas[k]?.ok) ?? null) : null;
  const mc = marcaDePerfilPanel(p.perfil);
  return h(`div.tarjeta.proy${mc ? `.marca-${mc.id}` : ""}`,
    h("div.fila", h("span", { style: "font-size:1.6rem" }, pf?.icono ?? "🎬"), h("div", h("strong", p.tema || p.id), h("div.chico-t.suave", p.id))),
    h("div.meta", chipPerfil(p.perfil), p.fotos ? h("span.chip", `🖼 ${p.fotos}`) : null, e?.activo ? h("span.chip.ok", "● activo") : null, e?.video ? h("span.chip.ok", "🎬 con video") : null),
    miniProgreso(e),
    h("div.chico-t.suave", sig ? `Siguiente: ${NOMBRE_ETAPA[sig]}` : "✅ Todo listo"),
    h("div.fila", h("a.btn.primario.chico", { href: `#/p/${p.id}/${sig ? { guion: "guion", voz: "voz", escenas: "escenas", qa: "calidad", render: "video", entrega: "entrega" }[sig] : "entrega"}` }, "Abrir"), h("button.btn.chico.peligro", { onclick: () => borrarProyecto(p) }, "Borrar")),
  );
}

async function usarEjemplo(e) {
  const id = prompt("Nombre para tu copia del ejemplo (sin espacios):", `${e.id}-copia`);
  if (!id) return;
  try {
    const r = await api("/api/proyectos/importar-ejemplo", { metodo: "POST", cuerpo: { ejemplo: e.id, id } });
    ir(`#/p/${r.id}/datos`);
  } catch (err) { fallo(err); }
}
async function restaurar(id) {
  if (ocupado()) return aviso("Hay un trabajo en curso: espera a que termine.", "aviso");
  if (!confirm(`Esto guarda el proyecto activo y deja «${id}» como activo. ¿Continuar?`)) return;
  try {
    await api(`/api/archivo/${id}/activar`, { metodo: "POST" });
    aviso(`✅ «${id}» quedó como proyecto activo (guion, voz, escenas y fotos). Ábrelo con Remotion Studio o vuelve a renderizarlo desde la terminal con npm run build.`, "ok", 10000);
  } catch (err) { fallo(err); }
}
async function borrarProyecto(p) {
  if (!confirm(`¿Borrar el proyecto «${p.tema || p.id}»? Se eliminan su brief y sus fotos (no los videos ya archivados).`)) return;
  try { await api(`/api/proyectos/${p.id}`, { metodo: "DELETE" }); aviso("Proyecto borrado.", "ok"); pintarVista(); } catch (e) { fallo(e); }
}

// ---------------------------------------------------------------------------
// Vista: nuevo proyecto
// ---------------------------------------------------------------------------
function vistaNuevo(cont) {
  const N = EST.N;
  const principales = S.perfiles.filter((p) => p.principal);
  const otros = S.perfiles.filter((p) => !p.principal);
  const crear = async (pf) => {
    const tema = "";
    const brief = { perfil: pf.id, tema, duracion: pf.duracion, tono: pf.tonos?.[0], voz: pf.voz, velocidad: pf.velocidad, marca: { paleta: pf.paleta }, datos: {}, fotos: [] };
    brief.id = `video-${new Date().toISOString().slice(5, 16).replace(/[-:T]/g, "")}`;
    try { const r = await api("/api/proyectos", { metodo: "POST", cuerpo: brief }); ir(`#/p/${r.id}/datos`); } catch (e) { fallo(e); }
  };
  const tarjeta = (pf) => { const m = N.marcaDePerfil(pf.id); return h(`button.nicho${m ? `.marca-${m.id}` : ""}`, { type: "button", onclick: () => crear(pf) }, h("span.ico", pf.icono), h("div.fila.chicos", m ? chipMarca(m) : h("span.chip", "Sin marca")), h("strong", pf.nombre), h("span.suave", pf.descripcion), h("span.chip", `~${pf.duracion} s · voz ${pf.voz}`)); };
  cont.replaceChildren(
    h("div.cab-vista", h("div", h("h1", "➕ Nuevo video"), h("p.suave", "Elige la marca y el tipo de video. Cada nicho trae su voz, su paleta, su estilo de guion y sus datos."))),
    N.IDS_MARCA.map((id) => {
      const m = N.MARCAS[id];
      const lista = principales.filter((p) => N.marcaDePerfil(p.id)?.id === id);
      return lista.length ? h(`section.grupo-marca.marca-${id}`, h("div.fila", chipMarca(m), h("span.suave.chico-t", m.rubro)), h("div.rejilla.dos", lista.map(tarjeta))) : null;
    }),
    principales.some((p) => !N.marcaDePerfil(p.id)) ? h("section.grupo-marca", h("div.fila", h("span.chip", "Sin marca")), h("div.rejilla.dos", principales.filter((p) => !N.marcaDePerfil(p.id)).map(tarjeta))) : null,
    otros.length ? h("details.tarjeta", h("summary", "Otros tipos de video"), h("div.rejilla", otros.map(tarjeta))) : null,
  );
}

// ---------------------------------------------------------------------------
// Vista: proyecto
// ---------------------------------------------------------------------------
async function cargarProyecto(id, { silencioso = false } = {}) {
  const r = await api(`/api/proyectos/${id}`);
  S.actual = { id, ...r };
  if (!silencioso) S.actual.pasoSucio = false;
  return S.actual;
}

function estadoPaso(id) {
  const e = S.actual?.estado?.etapas ?? {};
  const mapa = { datos: e.brief, guion: e.guion, voz: e.voz, escenas: e.escenas, calidad: e.qa, video: e.render, entrega: e.entrega };
  const x = mapa[id];
  if (id === "calidad" && e.qa?.ok_informe === false) return { clase: "fallo", texto: `${e.qa.problemas ?? "?"} avisos` };
  if (x?.ok) return { clase: "hecho", texto: "✓ listo" };
  const idx = ETAPAS.findIndex((p) => p.id === id);
  const previoOk = idx <= 1 || mapa[ETAPAS[idx - 1].id]?.ok;
  return { clase: "", texto: previoOk ? "pendiente" : "—" };
}

async function vistaProyecto(cont, v) {
  if (!S.actual || S.actual.id !== v.id) {
    try { await cargarProyecto(v.id); } catch (e) { return cont.replaceChildren(h("div.tarjeta", h("h2", "No encuentro ese proyecto"), h("p", e.message), h("a.btn", { href: "#/clasico" }, "← Volver"))); }
  }
  if (!v.paso) {
    const e = S.actual.estado?.etapas ?? {};
    const primero = !e.brief?.ok ? "datos" : !e.guion?.ok ? "guion" : !e.voz?.ok ? "voz" : !e.escenas?.ok ? "escenas" : !e.qa?.ok ? "calidad" : !e.render?.ok ? "video" : "entrega";
    return ir(`#/p/${v.id}/${primero}`);
  }
  const pf = perfilDe(S.actual.brief.perfil);
  pintarMarca(marcaDePerfilPanel(S.actual.brief.perfil));
  const cuerpo = h("div#paso");
  cont.replaceChildren(
    h("div.cab-vista",
      h("div", h("h1", `${pf?.icono ?? "🎬"} ${S.actual.brief.tema || S.actual.id}`), h("div.fila", chipPerfil(S.actual.brief.perfil), h("span.chip", pf?.nombre ?? S.actual.brief.perfil), S.actual.estado?.activo ? h("span.chip.ok", "● proyecto activo") : h("span.chip", "se activa al ejecutar un paso"))),
      h("span.espacio"),
      h("button.btn.ambar.grande", { type: "button", onclick: modalProducir, disabled: ocupado() }, "🚀 Producir todo"),
    ),
    h("nav.pasos", ETAPAS.map((p, i) => { const e = estadoPaso(p.id); return h(`a.paso${p.id === v.paso ? ".actual" : ""}${e.clase ? "." + e.clase : ""}`, { href: `#/p/${v.id}/${p.id}` }, h("span.num", `${i + 1}`), h("span.tit", `${p.icono} ${p.titulo}`), h("span.est", e.texto)); })),
    cuerpo,
  );
  const f = { datos: pasoDatos, guion: pasoGuion, voz: pasoVoz, escenas: pasoEscenas, calidad: pasoCalidad, video: pasoVideo, entrega: pasoEntrega }[v.paso];
  await f(cuerpo, pf);
  cont.focus({ preventScroll: true });
}

function navegacion(anterior, siguiente) {
  return h("div.fila", { style: "margin-top:18px" },
    anterior ? h("a.btn", { href: `#/p/${S.actual.id}/${anterior}` }, "← Anterior") : null, h("span.espacio"),
    siguiente ? h("a.btn.primario", { href: `#/p/${S.actual.id}/${siguiente}` }, "Siguiente →") : null);
}

// ---------------------------------------------------------------------------
// Paso 1 · Datos
// ---------------------------------------------------------------------------
const visibleCampo = (c, datos) => {
  if (!c.si) return true;
  const v = datos[c.si.clave];
  if (c.si.en) return c.si.en.includes(v);
  if (c.si.excepto) return !c.si.excepto.includes(v);
  return true;
};

function pasoDatos(cont, pf) {
  const brief = S.actual.brief;
  brief.datos ??= {}; brief.marca ??= {}; brief.fotos ??= [];
  // los valores por defecto (p. ej. Operación = Venta) se muestran seleccionados: también deben guardarse
  for (const c of pf.campos) if (c.defecto !== undefined && (brief.datos[c.clave] === undefined || brief.datos[c.clave] === "") && visibleCampo(c, brief.datos)) brief.datos[c.clave] = c.defecto;
  const estadoGuardado = h("span.chip", "—");
  let validacion = null;
  const guardar = debounce(async () => {
    try {
      estadoGuardado.textContent = "Guardando…";
      const r = await api("/api/proyectos", { metodo: "POST", cuerpo: brief });
      validacion = r;
      brief.id = r.id;
      S.actual.estado = r.estado;
      estadoGuardado.textContent = "✓ Guardado";
      estadoGuardado.className = "chip ok";
      pintarValidacion();
    } catch (e) { estadoGuardado.textContent = "No se pudo guardar"; estadoGuardado.className = "chip mal"; fallo(e); }
  }, 650);
  const cambio = () => { estadoGuardado.textContent = "Cambios sin guardar…"; estadoGuardado.className = "chip aviso"; guardar(); };

  const contValid = h("div");
  const pintarValidacion = () => contValid.replaceChildren(
    validacion?.errores?.length ? h("div.nota.aviso", h("strong", "Faltan datos obligatorios: "), h("ul", validacion.errores.map((e) => h("li", e)))) : null,
    validacion?.avisos?.length ? h("div.nota", validacion.avisos.map((a) => h("div", `⚠ ${a}`))) : null);

  const controladores = new Set(pf.campos.filter((c) => c.si).map((c) => c.si.clave));
  const entrada = (c) => {
    const valor = brief.datos[c.clave];
    const dato = (v) => {
      if (v === "" || v == null || (Array.isArray(v) && !v.length)) delete brief.datos[c.clave]; else brief.datos[c.clave] = v;
      cambio();
      if (controladores.has(c.clave)) pintarCampos(); // p. ej. «tipo» pasa de Apartamento a Carro: cambian los campos visibles
    };
    let el;
    if (c.tipo === "opcion") el = h("select", { onchange: (e) => dato(e.target.value) }, (c.opciones ?? []).map((o) => h("option", { value: o, selected: (valor ?? c.defecto ?? "") === o }, o || "(sin indicar)")));
    else if (c.tipo === "multilinea") el = h("textarea", { oninput: (e) => dato(e.target.value) }, valor ?? "");
    else if (c.tipo === "numero") el = h("input", { type: "number", step: "any", value: valor ?? "", oninput: (e) => dato(e.target.value === "" ? "" : Number(e.target.value)) });
    else if (c.tipo === "lista") el = h("input", { type: "text", value: Array.isArray(valor) ? valor.join(", ") : valor ?? "", placeholder: "separados por coma", oninput: (e) => dato(e.target.value.split(",").map((x) => x.trim()).filter(Boolean)) });
    else el = h("input", { type: "text", value: valor ?? "", oninput: (e) => dato(e.target.value) });
    return h("label.campo", h("span", c.etiqueta, c.requerido ? h("span.req", " *") : null), c.ayuda ? h("span.ayuda", c.ayuda) : null, el);
  };

  const zonaCampos = h("div");
  const pintarCampos = () => {
    const grupos = [];
    for (const c of pf.campos) {
      if (!visibleCampo(c, brief.datos)) continue;
      const g = c.grupo ?? (pf.plantilla ? "Datos" : "Detalles");
      let gr = grupos.find((x) => x.g === g);
      if (!gr) grupos.push((gr = { g, campos: [] }));
      gr.campos.push(c);
    }
    zonaCampos.replaceChildren(...grupos.map((gr) => h("fieldset", h("legend", gr.g), h("div.cols2", gr.campos.map(entrada)))));
  };
  pintarCampos();

  const paletaSel = h("select", { onchange: (e) => { brief.marca.paleta = e.target.value; muestra.replaceChildren(...swatches(e.target.value)); cambio(); } }, Object.entries(S.paletas).map(([k, p]) => h("option", { value: k, selected: (brief.marca.paleta ?? pf.paleta) === k }, p.nombre)));
  const swatches = (k) => Object.entries(S.paletas[k]?.colores ?? {}).filter(([n]) => ["fondo", "rojo", "azul", "amarillo", "hueso"].includes(n)).map(([, c]) => h("i", { style: `background:${c}` }));
  const muestra = h("span.swatches", swatches(brief.marca.paleta ?? pf.paleta));

  const voz = h("select", { onchange: (e) => { brief.voz = e.target.value; cambio(); } }, VOCES_EDGE.map(([k, n]) => h("option", { value: k, selected: (brief.voz ?? pf.voz) === k }, n)));

  cont.replaceChildren(
    h("div.tarjeta",
      h("div.fila", h("h2", "📝 Datos del video"), h("span.espacio"), estadoGuardado),
      h("p.suave", "Todo se guarda solo. Escribe SOLO datos reales: el video no inventa nada que no esté aquí."),
      contValid,
      h("label.campo", h("span", "Tema o idea del video"), h("span.ayuda", pf.plantilla ? "Opcional: si lo dejas vacío se deduce de los datos (p. ej. «Venta de apartamento en Chapinero»)." : "p. ej. «Por qué la insulina baja el azúcar». Es lo que la IA usará para escribir el guion."), h("textarea", { style: "min-height:64px", oninput: (e) => { brief.tema = e.target.value; cambio(); } }, brief.tema ?? "")),
      h("div.cols2",
        h("label.campo", "Tono", h("select", { onchange: (e) => { brief.tono = e.target.value; cambio(); } }, (pf.tonos ?? ["cercano"]).map((t) => h("option", { value: t, selected: (brief.tono ?? pf.tonos?.[0]) === t }, t)))),
        h("label.campo", "Duración objetivo (segundos)", h("input", { type: "number", min: 15, max: 90, value: brief.duracion ?? pf.duracion, oninput: (e) => { brief.duracion = Number(e.target.value) || pf.duracion; cambio(); } }))),
      zonaCampos),
    h("div.tarjeta",
      h("h2", "🏷️ Marca y estilo"),
      h("div.cols2",
        h("label.campo", "Nombre de tu marca o empresa", h("input", { type: "text", value: brief.marca.nombre ?? "", oninput: (e) => { brief.marca.nombre = e.target.value; cambio(); } })),
        h("label.campo", "Etiqueta de la pastilla superior", h("span.ayuda", "Corta y en MAYÚSCULAS (máx. 28)."), h("input", { type: "text", maxlength: 28, value: brief.marca.etiqueta ?? "", placeholder: (pf.plantilla ? "p. ej. ALTOS DEL NORTE" : "p. ej. CARDIOLOGÍA"), oninput: (e) => { brief.marca.etiqueta = e.target.value.toUpperCase(); cambio(); } })),
        h("label.campo", "Paleta de colores", h("div.fila", paletaSel, muestra)),
        h("label.campo", "Transición entre escenas", h("select", { onchange: (e) => { brief.marca.transicion = e.target.value; cambio(); } }, TRANSICIONES.map(([k, n]) => h("option", { value: k, selected: (brief.marca.transicion ?? pf.transicion ?? "zoom") === k }, n)))),
        h("label.campo", "Voz de referencia", h("span.ayuda", "La voz definitiva se elige en el paso Voz."), voz),
        h("label.campo", "Contacto en la marca (teléfono)", h("input", { type: "text", value: brief.marca.telefono ?? "", oninput: (e) => { brief.marca.telefono = e.target.value; cambio(); } })))),
    tarjetaFotos(cambio),
    navegacion(null, "guion"),
  );
  guardar();
}

function tarjetaFotos(cambio) {
  const brief = S.actual.brief;
  const id = S.actual.id;
  const cont = h("div");
  const lista = h("div.fotos");
  const barra = h("span.chip", "");

  const sincronizar = () => {
    // brief.fotos sigue el orden elegido; se añaden las nuevas y se quitan las borradas
    const fotos = S.actual.medios.filter((m) => m.tipo === "foto").map((m) => m.archivo);
    brief.fotos = [...brief.fotos.filter((f) => fotos.includes(f.archivo)), ...fotos.filter((a) => !brief.fotos.some((f) => f.archivo === a)).map((a) => ({ archivo: a, descripcion: "" }))];
  };
  const pintar = () => {
    sincronizar();
    const logo = S.actual.medios.find((m) => m.tipo === "logo");
    const musica = S.actual.medios.find((m) => m.tipo === "musica");
    barra.textContent = `${brief.fotos.length} foto(s)${logo ? " · logo ✓" : ""}${musica ? " · música ✓" : ""}`;
    lista.replaceChildren(...brief.fotos.map((f, i) => h("div.foto",
      h("img", { src: `/p/${id}/media/${encodeURIComponent(f.archivo)}`, alt: f.descripcion || f.archivo, loading: "lazy" }),
      h("div.pie",
        h("input", { type: "text", placeholder: "Describe la foto (ej. Sala con balcón)", value: f.descripcion ?? "", oninput: (e) => { f.descripcion = e.target.value; cambio(); } }),
        h("div.acciones", h("span.nombre", { style: "flex:1" }, `${i + 1}. ${f.archivo}`),
          h("button.btn.chico", { type: "button", title: "Subir", disabled: i === 0, onclick: () => { [brief.fotos[i - 1], brief.fotos[i]] = [brief.fotos[i], brief.fotos[i - 1]]; cambio(); pintar(); } }, "↑"),
          h("button.btn.chico", { type: "button", title: "Bajar", disabled: i === brief.fotos.length - 1, onclick: () => { [brief.fotos[i + 1], brief.fotos[i]] = [brief.fotos[i], brief.fotos[i + 1]]; cambio(); pintar(); } }, "↓"),
          h("button.btn.chico.peligro", { type: "button", title: "Quitar", onclick: () => quitar(f.archivo) }, "✕"))))),
      ...[logo, musica].filter(Boolean).map((m) => h("div.foto", m.tipo === "logo" ? h("img", { src: `/p/${id}/media/${encodeURIComponent(m.archivo)}`, style: "object-fit:contain;padding:14px", alt: "logo" }) : h("audio", { controls: true, src: `/p/${id}/media/${encodeURIComponent(m.archivo)}` }), h("div.pie", h("div.acciones", h("span.nombre", { style: "flex:1" }, `${m.tipo === "logo" ? "🏷 Logo" : "🎵 Música"} · ${m.archivo}`), h("button.btn.chico.peligro", { type: "button", onclick: () => quitar(m.archivo) }, "✕"))))));
  };
  const quitar = async (archivo) => {
    try { const r = await api(`/api/proyectos/${id}/media/${encodeURIComponent(archivo)}`, { metodo: "DELETE" }); S.actual.medios = r.medios; cambio(); pintar(); } catch (e) { fallo(e); }
  };
  const subir = async (archivos, comoLogo = false) => {
    for (const f of archivos) {
      let nombre = f.name;
      if (comoLogo) nombre = "logo" + (f.name.match(/\.[a-z0-9]+$/i)?.[0] ?? ".png");
      else if (/\.(mp3|wav|m4a|aac|ogg)$/i.test(f.name)) nombre = "musica" + f.name.match(/\.[a-z0-9]+$/i)[0];
      try {
        barra.textContent = `Subiendo ${f.name}…`;
        const r = await api(`/api/proyectos/${id}/media/${encodeURIComponent(nombre)}`, { metodo: "PUT", crudo: f });
        S.actual.medios = r.medios;
      } catch (e) { fallo(new Error(`${f.name}: ${e.message}`)); }
    }
    cambio(); pintar();
  };
  const zona = h("div.zona-fotos", { ondragover: (e) => { e.preventDefault(); zona.classList.add("sobre"); }, ondragleave: () => zona.classList.remove("sobre"), ondrop: (e) => { e.preventDefault(); zona.classList.remove("sobre"); subir([...e.dataTransfer.files]); } },
    h("p", "📷 Arrastra aquí tus fotos (jpg, png, webp), el logo y, si quieres, una música (mp3)."),
    h("div.fila", { style: "justify-content:center" },
      h("label.btn", "Elegir fotos", h("input", { type: "file", multiple: true, accept: "image/*,audio/*", hidden: true, onchange: (e) => { subir([...e.target.files]); e.target.value = ""; } })),
      h("label.btn", "Subir logo", h("input", { type: "file", accept: "image/*", hidden: true, onchange: (e) => { subir([...e.target.files], true); e.target.value = ""; } })),
      barra),
    h("p.chico-t", "Se reducen solas a ≤ 1600 px. Cada foto lleva efecto Ken Burns y las tarjetas de datos salen como cristal esmerilado. Sin fotos el video usa dibujos vectoriales."));
  cont.append(h("div.tarjeta", h("h2", "🖼️ Fotos, logo y música"), zona, lista));
  pintar();
  return cont.firstChild;
}

// ---------------------------------------------------------------------------
// Paso 2 · Guion
// ---------------------------------------------------------------------------
function pasoGuion(cont, pf) {
  const brief = S.actual.brief;
  let g = S.actual.guion;
  const [min, max] = (() => { const k = (brief.duracion ?? pf.duracion) / pf.duracion; return [Math.round(pf.palabras[0] * k), Math.round(pf.palabras[1] * k)]; })();
  const ta = h("textarea.guion", { placeholder: "Escribe aquí el guion (texto corrido que leerá la voz) o genéralo con una de las opciones de arriba.", oninput: actualizar }, g?.guion ?? "");
  const cuenta = h("span.contador", "");
  const comentario = h("input", { type: "text", placeholder: "Pídele cambios a la IA (ej. «hazlo más corto y menciona el tálamo»)" });
  const contInfo = h("div");
  function actualizar() {
    const n = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
    cuenta.textContent = `${n} palabras · ≈ ${Math.round(n / 2.7)} s de voz (objetivo ${min}–${max})`;
    cuenta.className = `contador ${n >= min - 5 && n <= max + 5 ? "ok" : "aviso"}`;
    aprobar.disabled = n < 8;
  }
  const aprobar = h("button.btn.primario.grande", { type: "button", onclick: guardarAprobar }, g?.aprobado ? "✅ Guardar cambios (guion aprobado)" : "✅ Aprobar guion y seguir");
  async function guardarAprobar() {
    const igual = g && ta.value.trim() === g.guion.trim();
    try {
      const r = await api(`/api/proyectos/${S.actual.id}/guion`, { metodo: "POST", cuerpo: { guion: ta.value, aprobado: true, origen: igual ? g.origen ?? "ia" : "manual" } });
      S.actual.guion = r.guion; S.actual.estado = r.estado; g = r.guion;
      aviso("✅ Guion aprobado y guardado.", "ok");
      if (!igual) { ta.value = r.guion.guion; actualizar(); }
      ir(`#/p/${S.actual.id}/voz`);
    } catch (e) { fallo(e); }
  }
  const ia = () => {
    if (!S.claves.openai) return aviso("Falta la clave de OpenAI: ponla en ⚙️ Ajustes. Mientras tanto puedes escribir el guion tú o usar la plantilla.", "aviso", 8000);
    alTerminar(async () => { await cargarProyecto(S.actual.id, { silencioso: true }); g = S.actual.guion; if (g) { ta.value = g.guion; actualizar(); info(); } });
    lanzar("guion-ia", { comentario: comentario.value.trim() || undefined });
  };
  const plantilla = () => {
    alTerminar(async () => { await cargarProyecto(S.actual.id, { silencioso: true }); g = S.actual.guion; if (g) { ta.value = g.guion; actualizar(); info(); } });
    lanzar("guion-plantilla");
  };
  function info() {
    const v = g?.verificacion ?? [];
    const probs = g?.revision?.problemas ?? [];
    contInfo.replaceChildren(
      g?.origen === "plantilla" ? h("div.nota", "🆓 Guion de la plantilla: usa solo tus datos y mantiene las escenas exactamente sincronizadas. Si lo editas, las escenas deberán diseñarse con IA (o pegando un plan).") : null,
      v.length ? h("details", { open: true }, h("summary", `🔍 ${pf.revision?.verificacion ?? "Verificación"} (hecha por la IA: revísala tú)`), h("table", h("thead", h("tr", h("th", "Certeza"), h("th", "Afirmación"), h("th", "Nota"))), h("tbody", v.map((x) => h("tr", h("td", h(`span.chip${x.certeza === "alta" ? ".ok" : x.certeza === "media" ? ".aviso" : ".mal"}`, x.certeza)), h("td", x.afirmacion), h("td.suave", x.nota)))))) : null,
      probs.length ? h("div.nota.aviso", h("strong", `Observaciones del ${pf.revision?.nombre ?? "revisor"}:`), h("ul", probs.map((x) => h("li", `(${x.tipo}) «${x.fragmento}» → ${x.correccion}`)))) : null,
      g?.simplificaciones?.length ? h("p.chico-t.suave", `Simplificaciones: ${g.simplificaciones.join(" · ")}`) : null);
  }
  info();
  cont.replaceChildren(
    h("div.tarjeta",
      h("h2", "✍️ Guion"),
      h("p.suave", `${pf.id === "medicina-ar" ? "Gancho (0–3 s) → mecanismo → remate." : "Gancho → qué es y dónde → datos → precio → cierre con contacto."} Tienes que dar el visto bueno antes de seguir (es una regla del proyecto: ningún video sale sin que una persona lea el guion).`),
      h("div.fila", { style: "margin-bottom:12px" },
        h("button.btn.primario", { type: "button", onclick: ia, disabled: ocupado(), title: S.claves.openai ? "" : "Necesita la clave de OpenAI (Ajustes)" }, `✨ Escribirlo con IA ${S.claves.openai ? "" : "🔒"}`),
        pf.plantilla ? h("button.btn", { type: "button", onclick: plantilla, disabled: ocupado() }, "🆓 Plantilla gratuita (solo tus datos)") : null,
        h("span.suave.chico-t", "…o escríbelo/pégalo tú directamente aquí abajo.")),
      ta,
      h("div.fila", { style: "margin-top:6px" }, cuenta),
      h("label.campo", { style: "margin-top:12px" }, "Cambios para la IA", comentario),
      contInfo,
      h("div.fila", { style: "margin-top:12px" }, aprobar)),
    navegacion("datos", g?.aprobado ? "voz" : null));
  actualizar();
}

// ---------------------------------------------------------------------------
// Paso 3 · Voz
// ---------------------------------------------------------------------------
function pasoVoz(cont, pf) {
  const brief = S.actual.brief;
  const est = S.actual.estado?.etapas?.voz ?? {};
  const g = S.actual.guion;
  const voces = pf.voces ?? {};
  const prefs = (() => { try { return JSON.parse(leerLocal("videmed-voz") ?? "{}"); } catch { return {}; } })();
  const o = { modo: prefs.modo ?? "dev", proveedor: prefs.proveedor ?? (S.claves.openai ? "openai" : "elevenlabs"), voz: brief.voz ?? pf.voz, velocidad: voces.dev?.velocidad ?? pf.velocidad ?? "+5%", vozOpenai: voces.prod?.openai?.voz ?? "ash", instrucciones: voces.prod?.openai?.instrucciones ?? "" };
  const guardarPref = () => guardarLocal("videmed-voz", JSON.stringify({ modo: o.modo, proveedor: o.proveedor }));
  const zona = h("div");
  const pintar = () => {
    const prod = o.modo === "prod";
    const faltaClave = prod && ((o.proveedor === "openai" && !S.claves.openai) || (o.proveedor === "elevenlabs" && !S.claves.elevenlabs));
    zona.replaceChildren(
      h("div.rejilla.dos",
        h("button.nicho", { type: "button", style: !prod ? "border-color:var(--acento);box-shadow:0 0 0 1px var(--acento) inset" : "", onclick: () => { o.modo = "dev"; guardarPref(); pintar(); } }, h("span.ico", "🧪"), h("strong", "Desarrollo · gratis"), h("span.suave", `edge-tts (voz neuronal de Microsoft), sin clave. ${voces.dev?.voz ?? ""}. Ideal para probar el video completo sin gastar.`)),
        h("button.nicho", { type: "button", style: prod ? "border-color:var(--acento);box-shadow:0 0 0 1px var(--acento) inset" : "", onclick: () => { o.modo = "prod"; guardarPref(); pintar(); } }, h("span.ico", "🎙️"), h("strong", "Producción · calidad estudio"), h("span.suave", "OpenAI gpt-4o-mini-tts + Whisper (tiempos por palabra) o ElevenLabs. Con entonación exacta según el nicho."))),
      h("div.tarjeta", { style: "background:var(--capa2);box-shadow:none" },
        !prod
          ? h("div.cols2", h("label.campo", "Voz", h("select", { onchange: (e) => { o.voz = e.target.value; } }, VOCES_EDGE.map(([k, n]) => h("option", { value: k, selected: o.voz === k }, n)))), h("label.campo", `Velocidad (${o.velocidad})`, h("input", { type: "range", min: -20, max: 25, step: 1, value: parseInt(o.velocidad, 10) || 0, oninput: (e) => { const n = Number(e.target.value); o.velocidad = `${n >= 0 ? "+" : ""}${n}%`; e.target.parentElement.firstChild.textContent = `Velocidad (${o.velocidad})`; } })))
          : h("div",
            h("label.campo", "Proveedor", h("select", { onchange: (e) => { o.proveedor = e.target.value; guardarPref(); pintar(); } }, h("option", { value: "openai", selected: o.proveedor === "openai" }, `OpenAI (gpt-4o-mini-tts + whisper-1) ${S.claves.openai ? "✓ clave" : "— sin clave"}`), h("option", { value: "elevenlabs", selected: o.proveedor === "elevenlabs" }, `ElevenLabs (/with-timestamps) ${S.claves.elevenlabs ? "✓ clave" : "— sin clave"}`))),
            o.proveedor === "openai"
              ? h("div", h("label.campo", "Voz de OpenAI", h("select", { onchange: (e) => { o.vozOpenai = e.target.value; } }, VOCES_OPENAI.map((v) => h("option", { value: v, selected: o.vozOpenai === v }, v)))), h("label.campo", "Instrucciones de entonación", h("span.ayuda", "Se envían en el campo `instructions`: ritmo, acento y emoción."), h("textarea", { oninput: (e) => { o.instrucciones = e.target.value; } }, o.instrucciones)))
              : h("p.suave.chico-t", "La voz se toma de ELEVENLABS_VOICE_ID (Ajustes) o usa una voz multilingüe por defecto."),
            faltaClave ? h("div.nota.aviso", "Falta la clave de este proveedor: ", h("a", { href: "#/ajustes" }, "ponla en Ajustes"), ".") : null)),
      h("div.fila", { style: "margin-top:14px" },
        h("button.btn.primario.grande", { type: "button", disabled: ocupado() || !g?.aprobado || faltaClave, onclick: generar }, est.ok ? "🔁 Volver a generar la voz" : "🎙️ Generar voz"),
        !g?.aprobado ? h("span.chip.aviso", "Primero aprueba el guion") : null),
      h("div.tarjeta", { style: "margin-top:14px" }, h("h3", "🔊 Resultado"), est.ok ? h("div", h("audio", { controls: true, src: `/audio/voz.mp3?t=${S.actual.estado.etapas.voz.duracion ?? Date.now()}` }), h("p.chico-t.suave", `${est.duracion ? Math.round(est.duracion) + " s · " : ""}${est.proveedor ?? ""} ${est.voz ?? ""} · modo ${est.modo ?? "dev"} · cada palabra tiene su tiempo exacto para sincronizar escenas y subtítulos.`)) : h("p.suave", "Todavía no hay voz para este guion.")));
  };
  const generar = () => {
    const opc = o.modo === "prod" ? { modo: "prod", proveedor: o.proveedor, voz: o.proveedor === "openai" ? o.vozOpenai : undefined, instrucciones: o.proveedor === "openai" ? o.instrucciones : undefined } : { modo: "dev", voz: o.voz, velocidad: o.velocidad };
    alTerminar((job) => { if (job.estado === "ok") aviso("🎙️ Voz lista. Escúchala abajo.", "ok"); });
    lanzar("voz", opc);
  };
  cont.replaceChildren(h("div.tarjeta", h("h2", "🎙️ Voz y tiempos por palabra"), h("p.suave", "La voz se genera desde el guion aprobado y deja el tiempo exacto de cada palabra: así las escenas aparecen justo cuando se nombra cada cosa y los subtítulos resaltan la palabra que suena."), zona), navegacion("guion", est.ok ? "escenas" : null));
  pintar();
}

// ---------------------------------------------------------------------------
// Paso 4 · Escenas
// ---------------------------------------------------------------------------
async function pasoEscenas(cont, pf) {
  const est = S.actual.estado?.etapas ?? {};
  const g = S.actual.guion;
  const comentario = h("input", { type: "text", placeholder: "Pide cambios (ej. «más fotos, menos texto» / «pon la gráfica antes»)" });
  const pegar = h("textarea", { style: "min-height:150px;font-family:ui-monospace,monospace;font-size:.85rem", placeholder: '{ "proyecto": {…}, "escenas": [ … ], "portada": {…} }' });
  const contPlan = h("div");
  const contCap = h("div");
  const recomienda = g?.origen === "plantilla" && pf.plantilla;
  const requisitos = est.voz?.ok;

  const cargarPlan = async () => {
    if (!est.escenas?.ok) return contPlan.replaceChildren(h("p.suave", "Aún no hay escenas para este proyecto."));
    const plan = await api("/api/activo/plan");
    contPlan.replaceChildren(h("table", h("thead", h("tr", h("th", "#"), h("th", "Escena"), h("th", "Elementos"), h("th", "Foto"))), h("tbody", (plan.escenas ?? []).map((e, i) => h("tr", h("td", i + 1), h("td", h("strong", e.titulo), h("div.chico-t.suave", e.id)), h("td.chico-t", e.elementos.map((x) => x.tipo).join(", ")), h("td.chico-t", e.fondo?.foto ?? "—"))))));
  };
  const cargarCapturas = async () => {
    const r = await api("/api/capturas");
    contCap.replaceChildren(r.capturas.length ? h("div", h("h3", "📸 Así se ve cada escena"), h("div.galeria", r.capturas.map((c) => h("figure", { style: "margin:0" }, h("img", { src: c.url, alt: c.archivo, loading: "lazy", onclick: () => modal(h("div", { style: "text-align:center" }, h("img.grande", { src: c.url }), h("p.chico-t.suave", c.archivo), h("button.btn", { onclick: () => $("#modal").click() }, "Cerrar")), {}) }), h("figcaption", c.archivo.replace(/\.jpe?g$/, "")))))) : h("p.suave", "Todavía no hay capturas: pulsa «Ver capturas»."));
  };

  const tras = () => alTerminar(async () => { await cargarProyecto(S.actual.id, { silencioso: true }); pintarVista(); });
  cont.replaceChildren(
    h("div.tarjeta",
      h("h2", "🎞️ Escenas"),
      h("p.suave", "Cada escena dibuja una idea del guion (foto, tarjetas de cristal, íconos, mapa, precio…) y aparece justo cuando la voz nombra cada cosa. Hay tres formas de diseñarlas:"),
      !requisitos ? h("div.nota.aviso", "Antes necesitas el guion aprobado y la voz generada (pasos 2 y 3).") : null,
      recomienda ? h("div.nota.ok", "💡 Tu guion viene de la plantilla gratuita: las escenas de la plantilla encajan perfectamente con él.") : null,
      h("div.rejilla",
        h("div.tarjeta.proy", h("strong", "✨ Con IA (OpenAI)"), h("p.chico-t.suave", "El modelo diseña el plan, un validador mide márgenes y solapes, y un modelo con visión revisa capturas reales. Usa la clave de OpenAI."), comentario, h("div.fila", h("button.btn.primario", { type: "button", disabled: ocupado() || !requisitos || !S.claves.openai, onclick: () => { tras(); lanzar("escenas-ia", { comentario: comentario.value.trim() || undefined }); } }, "Diseñar con IA"), S.claves.openai ? null : h("span.chip.aviso", "🔒 sin clave"))),
        pf.plantilla ? h("div.tarjeta.proy", h("strong", "🆓 Plantilla gratuita"), h("p.chico-t.suave", "Escenas deterministas con tus fotos y datos: gancho, recorrido, ficha, ubicación, inversión, precio y cierre. Sin gastar nada."), h("button.btn.primario", { type: "button", disabled: ocupado() || !requisitos || g?.origen !== "plantilla", title: g?.origen !== "plantilla" ? "El guion fue modificado: la plantilla solo encaja con su propio guion" : "", onclick: () => { tras(); lanzar("escenas-plantilla"); } }, "Usar la plantilla")) : null,
        h("div.tarjeta.proy", h("strong", "📋 Pegar un plan"), h("p.chico-t.suave", "¿Lo diseñó ChatGPT/Claude por ti? Pega aquí el JSON: se limpia, se valida y se activa."), h("details", h("summary", "Pegar JSON"), pegar, h("div.fila", h("button.btn.primario.chico", { type: "button", disabled: ocupado() || !requisitos, onclick: () => { let plan; try { plan = JSON.parse(pegar.value.replace(/^```json\s*|```\s*$/g, "")); } catch { return aviso("Eso no es un JSON válido.", "mal"); } tras(); lanzar("escenas-importar", { plan }); } }, "Importar plan"))))),
    ),
    h("div.tarjeta", h("div.fila", h("h3", { style: "margin:0" }, "Plan actual"), h("span.espacio"),
      h("button.btn.chico", { type: "button", disabled: ocupado() || !est.escenas?.ok, onclick: () => lanzar("validar") }, "✔ Validar"),
      h("button.btn.chico", { type: "button", disabled: ocupado() || !est.escenas?.ok, onclick: () => { alTerminar(cargarCapturas); lanzar("capturas"); } }, "📸 Ver capturas"),
      h("button.btn.chico", { type: "button", onclick: async () => { try { const r = await api("/api/studio", { metodo: "POST", cuerpo: { accion: S.studio.activo ? "detener" : "iniciar" } }); S.studio = r; if (r.activo) { aviso("Abriendo Remotion Studio en el puerto 3000…", "ok"); setTimeout(() => window.open(r.url, "_blank"), 2500); } pintarVista(); } catch (e) { fallo(e); } } }, S.studio.activo ? "⏹ Cerrar Studio" : "🎛 Abrir Remotion Studio")), contPlan, contCap),
    navegacion("voz", est.escenas?.ok ? "calidad" : null));
  cargarPlan().catch(() => {});
  cargarCapturas().catch(() => {});
}

// ---------------------------------------------------------------------------
// Paso 5 · Calidad
// ---------------------------------------------------------------------------
async function pasoCalidad(cont) {
  const est = S.actual.estado?.etapas ?? {};
  const r = await api("/api/qa");
  // el informe de trabajo/salida/qa es el del último proyecto que pasó el control: solo se muestra si es de ESTE
  const q = est.qa?.ejecutado && S.actual.estado.activo ? r.informe : null;
  const problemas = q?.problemas ?? [];
  cont.replaceChildren(
    h("div.tarjeta",
      h("h2", "🔎 Control de calidad"),
      h("p.suave", "Revisa por ti: márgenes de 80 px medidos en el DOM, solapes con los subtítulos (y 1450–1680), pantallas vacías y tramos sin movimiento de más de 2 s. Si hay problemas se muestran aquí con su segundo exacto."),
      h("div.fila", h("button.btn.primario.grande", { type: "button", disabled: ocupado() || !est.escenas?.ok, onclick: () => { alTerminar(() => pintarVista()); lanzar("qa"); } }, q ? "🔁 Repetir control" : "▶ Ejecutar control (≈ 1 min)"), !est.escenas?.ok ? h("span.chip.aviso", "Primero diseña las escenas") : null),
      q ? h("div", { style: "margin-top:14px" },
        problemas.length ? h("div.nota.aviso", h("strong", `⚠️ ${problemas.length} problema(s) detectado(s)`), h("table", h("thead", h("tr", h("th", "Tipo"), h("th", "Segundo"), h("th", "Detalle"))), h("tbody", problemas.slice(0, 40).map((p) => h("tr", h("td", h("span.chip.aviso", p.tipo)), h("td", `${p.segundo}s`), h("td.chico-t", p.detalle))))), h("p.chico-t", "Corrige las escenas (paso 4: pide cambios a la IA o edita el plan) y repite el control. Puedes renderizar igualmente, pero no es lo recomendable."))
          : h("div.nota.ok", "✅ Sin problemas: márgenes ≥ 80 px, sin solapes, sin pantallas vacías ni tramos estáticos > 2 s."),
        h("p.chico-t.suave", `${q.textosMedidos ?? "?"} textos medidos · ${q.muestras ?? "?"} muestras · ${Math.round(q.duracion ?? 0)} s de video`),
        r.imagenes.length ? h("div.galeria", r.imagenes.map((u) => h("figure", { style: "margin:0" }, h("img", { src: u, loading: "lazy", onclick: () => modal(h("div", { style: "text-align:center" }, h("img.grande", { src: u }), h("p", h("button.btn", { onclick: () => $("#modal").click() }, "Cerrar"))), {}) }), h("figcaption", u.match(/frame-(\d+)/)?.[0] ?? "")))) : null) : null),
    navegacion("escenas", "video"));
}

// ---------------------------------------------------------------------------
// Paso 6 · Video
// ---------------------------------------------------------------------------
function pasoVideo(cont) {
  const est = S.actual.estado?.etapas ?? {};
  const hilos = h("select", ["1", "2", "3", "4", "6", "8"].map((n) => h("option", { value: n, selected: n === "1" }, `${n} hilo${n === "1" ? "" : "s"}${n === "1" ? " (seguro, ≈ 25 min)" : ""}`)));
  const desdeCero = h("input", { type: "checkbox" });
  const corriendo = S.trabajo?.estado === "corriendo" && S.trabajo.nombre === "render";
  cont.replaceChildren(
    h("div.tarjeta",
      h("h2", "🎬 Renderizar el video"),
      h("p.suave", "1080×1920 a 60 fps, H.264 + AAC. Es robusto y reanudable: si se corta, vuelve a pulsar y sigue donde quedó. No uses el equipo para otras cosas pesadas mientras renderiza."),
      h("div.cols2", h("label.campo", "Hilos de render", h("span.ayuda", "Más hilos = más rápido pero más memoria (1 si tienes menos de 8 GB libres)."), hilos), h("label.campo.check", { style: "align-self:end" }, desdeCero, "Empezar de cero (ignorar lo ya renderizado)")),
      h("div.fila", h("button.btn.primario.grande", { type: "button", disabled: ocupado() || !est.escenas?.ok, onclick: () => { alTerminar(() => pintarVista()); lanzar("render", { hilos: Number(hilos.value), desdeCero: desdeCero.checked }); } }, est.render?.ok ? "🔁 Renderizar de nuevo" : "▶ Renderizar"), !est.escenas?.ok ? h("span.chip.aviso", "Primero diseña las escenas") : null, est.qa?.ok_informe === false ? h("span.chip.aviso", "El control de calidad tiene avisos pendientes") : null),
      corriendo || (S.trabajo?.nombre === "render" && S.trabajo?.estado === "corriendo") ? h("div", { style: "margin-top:14px" }, h("div.progreso#prog-render", h("i", { style: `width:${S.trabajo.progreso ?? 0}%` })), h("p.chico-t.suave", h("span#prog-render-txt", `${S.trabajo.progreso ?? 0} %`), " · mira el registro para el detalle")) : null),
    est.render?.ok && S.actual.estado.video ? h("div.tarjeta", h("h3", "✅ Video renderizado"), h("video.vertical", { controls: true, preload: "metadata", src: `${S.actual.estado.video.ruta}?t=${est.render.en}` }), h("p.chico-t.suave.centro", `${S.actual.estado.video.mb} MB`)) : null,
    navegacion("calidad", est.render?.ok ? "entrega" : null));
}

// ---------------------------------------------------------------------------
// Paso 7 · Entrega
// ---------------------------------------------------------------------------
async function pasoEntrega(cont) {
  const est = S.actual.estado ?? {};
  const e = est.etapas ?? {};
  const activo = await api("/api/activo");
  const esActivo = est.activo;
  const post = h("textarea", { style: "min-height:170px", oninput: contar }, esActivo ? activo.post ?? "" : "");
  const tags = h("span.chip", "");
  function contar() { const n = (post.value.match(/#[\p{L}\p{N}_]+/gu) ?? []).length; tags.textContent = `${n} hashtags`; tags.className = `chip ${n === 5 ? "ok" : "aviso"}`; }
  const entregar = () => { alTerminar(() => pintarVista()); lanzar("entregables"); };
  cont.replaceChildren(
    h("div.tarjeta",
      h("h2", "📦 Entrega"),
      !e.render?.ok ? h("div.nota.aviso", "Todavía no hay video renderizado (paso 6).") : null,
      e.render?.ok && est.video ? h("div.rejilla.dos",
        h("div", h("h3", "🎬 Video"), h("video.vertical", { controls: true, preload: "metadata", src: `${est.video.ruta}?t=${e.render.en}` }), h("div.fila", { style: "justify-content:center;margin-top:10px" }, h("a.btn.primario", { href: `${est.video.ruta}?descargar=1`, download: "video-terminado.mp4" }, `⬇ Descargar video (${est.video.mb} MB)`))),
        h("div", h("h3", "🖼️ Portada"), est.portada ? h("img", { src: `${est.portada}?t=${e.entrega?.en ?? 0}`, style: "max-width:260px;width:100%;border-radius:12px;display:block;margin:0 auto" }) : h("p.suave", "Aún no hay portada: genera los entregables."), est.portada ? h("div.fila", { style: "justify-content:center;margin-top:10px" }, h("a.btn", { href: `${est.portada}?descargar=1`, download: "portada.jpg" }, "⬇ Descargar portada")) : null)) : null,
      h("div.fila", { style: "margin-top:14px" }, h("button.btn.primario", { type: "button", disabled: ocupado() || !e.render?.ok, onclick: entregar }, e.entrega?.ok ? "🔁 Regenerar portada, texto y copia" : "📦 Generar portada, texto del post y copia"))),
    h("div.tarjeta",
      h("div.fila", h("h3", { style: "margin:0" }, "📝 Texto del post (Instagram / TikTok)"), h("span.espacio"), tags),
      esActivo ? h("div", post, h("div.fila", { style: "margin-top:8px" },
        h("button.btn", { type: "button", onclick: async () => { try { await navigator.clipboard.writeText(post.value); aviso("📋 Copiado al portapapeles.", "ok"); } catch { post.select(); document.execCommand?.("copy"); aviso("Copiado.", "ok"); } } }, "📋 Copiar"),
        h("button.btn", { type: "button", onclick: async () => { try { await api("/api/activo/post", { metodo: "POST", cuerpo: { texto: post.value } }); aviso("Texto guardado.", "ok"); } catch (x) { fallo(x); } } }, "💾 Guardar cambios"))) : h("p.suave", "Activa este proyecto (ejecutando cualquier paso) para editar su texto."),
      h("p.chico-t.suave", "El post lleva exactamente 5 hashtags. Revisa el contenido: si hay datos de contacto o cifras, deben coincidir con tus datos reales.")),
    navegacion("video", null));
  contar();
}

// ---------------------------------------------------------------------------
// Producir todo
// ---------------------------------------------------------------------------
async function modalProducir() {
  const e = S.actual.estado.etapas;
  const pf = perfilDe(S.actual.brief.perfil);
  const faltaGuion = !e.guion?.ok;
  const pasos = [
    ["Voz", e.voz?.ok, "voz"], ["Escenas", e.escenas?.ok, "escenas"], ["Control de calidad", false, "qa"], ["Render del video (≈ 25 min a 1 hilo)", false, "render"], ["Portada, texto del post y copia", false, "entrega"],
  ];
  const origen = S.actual.guion?.origen;
  const escenasConIA = !(origen === "plantilla" && pf.plantilla);
  const bloqueado = faltaGuion || (escenasConIA && !e.escenas?.ok && !S.claves.openai);
  const cerrar = modal(h("div.caja",
    h("h2", "🚀 Producir todo"),
    h("p.suave", "Se ejecuta en cadena solo lo que falta. Si algo falla, se detiene y puedes seguir desde ese paso."),
    faltaGuion ? h("div.nota.aviso", "Primero aprueba el guion (paso 2): ningún video sale sin que una persona lo lea.") : null,
    !faltaGuion && escenasConIA && !e.escenas?.ok && !S.claves.openai ? h("div.nota.aviso", "Para diseñar las escenas hace falta la clave de OpenAI (o usar el guion de la plantilla en inmobiliario).") : null,
    h("ul.estado-lista", pasos.map(([t, ok]) => h("li", h("span", ok ? "✅" : "⏳"), h("span", `${t}${ok ? " — ya está hecho, se salta" : ""}`)))),
    h("div.fila", { style: "justify-content:flex-end;margin-top:16px" },
      h("button.btn", { type: "button", onclick: () => cerrar() }, "Cancelar"),
      h("button.btn.ambar.grande", { type: "button", disabled: bloqueado || ocupado(), onclick: async () => { cerrar(); alTerminar(() => pintarVista()); await lanzar("producir", { escenas: escenasConIA ? "ia" : undefined }); } }, "🚀 Empezar"))));
}

// ---------------------------------------------------------------------------
// Ajustes
// ---------------------------------------------------------------------------
async function vistaAjustes(cont) {
  const [aj, ent] = await Promise.all([api("/api/ajustes"), api("/api/entorno")]);
  S.claves = { openai: aj.OPENAI_API_KEY.configurada, elevenlabs: aj.ELEVENLABS_API_KEY.configurada };
  const cambios = {};
  const campo = (k, etiqueta, { secreto = false, ayuda, tipo = "text", placeholder } = {}) => {
    const v = aj[k];
    return h("label.campo", etiqueta, ayuda ? h("span.ayuda", ayuda) : null, h("input", { type: secreto ? "password" : tipo, autocomplete: "off", spellcheck: false, placeholder: secreto ? (v.configurada ? `configurada (…${v.final}) · escribe para cambiarla` : "pega tu clave aquí") : placeholder ?? "", value: secreto ? "" : v ?? "", oninput: (e) => { cambios[k] = e.target.value; } }));
  };
  const probarBtn = (que) => { const res = h("span.chico-t"); return h("div.fila", h("button.btn.chico", { type: "button", onclick: async () => { res.textContent = "Probando…"; await guardarCambios(false); const r = await api("/api/probar", { metodo: "POST", cuerpo: { que } }); res.textContent = (r.ok ? "✅ " : "❌ ") + r.mensaje; } }, "Probar conexión"), res); };
  async function guardarCambios(avisar = true) {
    if (!Object.keys(cambios).length) return;
    try { const r = await api("/api/ajustes", { metodo: "POST", cuerpo: cambios }); for (const k of Object.keys(cambios)) delete cambios[k]; S.claves = { openai: r.OPENAI_API_KEY.configurada, elevenlabs: r.ELEVENLABS_API_KEY.configurada }; if (avisar) aviso("✅ Ajustes guardados en .env", "ok"); } catch (e) { fallo(e); }
  }
  const fila = (ok, titulo, detalle) => h("li", h("span", ok === true ? "✅" : ok === false ? "⚠️" : "ℹ️"), h("div", h("strong", titulo), detalle ? h("div.chico-t.suave", detalle) : null));
  cont.replaceChildren(
    h("div.cab-vista", h("div", h("h1", "⚙️ Ajustes"), h("p.suave", "Claves y preferencias. Se guardan en el archivo .env de esta carpeta; las claves nunca salen de tu equipo ni se muestran completas."))),
    h("div.rejilla.dos",
      h("div.tarjeta", h("h2", "🤖 OpenAI (guion, escenas, voz de producción)"),
        campo("OPENAI_API_KEY", "Clave de API", { secreto: true, ayuda: "Créala en platform.openai.com/api-keys (la cuenta necesita saldo)." }),
        h("details", h("summary", "Modelos y opciones avanzadas"), campo("OPENAI_BASE_URL", "URL base", { placeholder: "https://api.openai.com/v1" }), campo("OPENAI_MODEL", "Modelo general", { ayuda: "Vacío = elige el equilibrado más reciente de tu cuenta." }), campo("OPENAI_MODEL_PLAN", "Modelo del plan de escenas"), campo("OPENAI_MODEL_VISION", "Modelo con visión"), campo("OPENAI_MODEL_REVISOR", "Modelo del revisor"), campo("OPENAI_TTS_MODEL", "Modelo de voz (TTS)", { placeholder: "gpt-4o-mini-tts" }), campo("OPENAI_STT_MODEL", "Modelo de tiempos (STT)", { placeholder: "whisper-1" })),
        probarBtn("openai"), h("div.fila", { style: "margin-top:8px" }, h("button.btn.chico", { type: "button", onclick: () => lanzar("ia-diagnostico") }, "🩺 Diagnóstico completo"))),
      h("div.tarjeta", h("h2", "🎙️ ElevenLabs (voz de producción)"),
        campo("ELEVENLABS_API_KEY", "Clave de API", { secreto: true, ayuda: "El plan gratuito sirve." }), campo("ELEVENLABS_VOICE_ID", "ID de la voz", { ayuda: "Vacío = voz multilingüe por defecto." }), campo("ELEVENLABS_MODEL", "Modelo", { placeholder: "eleven_multilingual_v2" }), probarBtn("elevenlabs"))),
    h("div.tarjeta", h("div.fila", h("button.btn.primario", { type: "button", onclick: () => guardarCambios() }, "💾 Guardar ajustes"))),
    h("div.tarjeta", h("h2", "🖥️ Tu equipo"),
      h("ul.estado-lista",
        fila(true, `Node ${ent.node}`, ent.plataforma),
        fila(Boolean(ent.python), ent.python ? `Python ${ent.python.version}` : "Python 3 no encontrado", ent.python ? (ent.python.edgeTts ? `edge-tts ${ent.python.edgeTts} instalado (voz gratis)` : "edge-tts se instalará solo la primera vez que generes voz (necesita internet)") : "Instálalo desde python.org marcando «Add to PATH» (solo hace falta para la voz gratuita)."),
        fila(ent.memoria.libreGB >= 2, `Memoria libre ${ent.memoria.libreGB} GB de ${ent.memoria.totalGB} GB`, ent.memoria.libreGB < 2 ? "Poca memoria libre: cierra navegadores y usa 1 hilo de render." : null),
        fila(true, "Navegador de render", ent.navegador),
        fila(ent.ffmpeg, ent.ffmpeg ? "ffmpeg de Remotion encontrado" : "Falta ffmpeg: ejecuta npm install"),
        fila(ent.efectosFaltantes.length === 0, ent.efectosFaltantes.length ? `Faltan efectos de sonido: ${ent.efectosFaltantes.join(", ")}` : "Efectos de sonido listos (public/sfx)", ent.efectosFaltantes.length ? "Se sintetizan solos al renderizar, o pulsa el botón." : null),
        ent.red ? fila(ent.red.voz, "Internet para la voz gratis (edge-tts)", ent.red.voz ? null : "Sin conexión con el servicio de voz de Microsoft: la voz de desarrollo no funcionará.") : null,
        ent.red ? fila(ent.red.openai, "Conexión con OpenAI", ent.red.openai ? null : "No se alcanza api.openai.com desde este equipo.") : null,
        ent.red ? fila(ent.red.elevenlabs, "Conexión con ElevenLabs") : null),
      h("div.fila", h("button.btn.chico", { type: "button", onclick: () => lanzar("sfx") }, "🔊 Regenerar efectos de sonido"), h("button.btn.chico", { type: "button", onclick: () => lanzar("pruebas") }, "🧪 Ejecutar pruebas automáticas"))));
}

// ---------------------------------------------------------------------------
// Guía
// ---------------------------------------------------------------------------
async function vistaGuia(cont, doc) {
  const r = await api(`/api/doc/${doc}`).catch(() => api("/api/doc/LEEME"));
  const nombres = { GUIA: "📘 Guía de uso", LEEME: "📄 Léeme", "GUIA-IA": "🤖 Guía de IA", AGENTS: "🧩 Relevo (AGENTS)", CLAUDE: "🛠️ Notas técnicas", GEMINI: "📜 Prompt original" };
  const cuerpo = h("div.doc");
  cuerpo.innerHTML = markdown(r.texto);
  cont.replaceChildren(h("div.fila", { style: "margin-bottom:14px" }, r.docs.map((d) => h(`a.btn.chico${d === r.nombre ? ".primario" : ""}`, { href: `#/guia/${d}` }, nombres[d] ?? d))), h("div.tarjeta", cuerpo));
}

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
async function iniciar() {
  const t = leerLocal("videmed-tema");
  if (t) document.documentElement.dataset.tema = t;
  $("#tema").onclick = () => {
    const actual = document.documentElement.dataset.tema || (matchMedia("(prefers-color-scheme: light)").matches ? "claro" : "oscuro");
    const nuevo = actual === "claro" ? "oscuro" : "claro";
    document.documentElement.dataset.tema = nuevo;
    guardarLocal("videmed-tema", nuevo);
  };
  $("#trabajo").onclick = () => mostrarRegistro($("#registro").hidden, { fijar: true });
  $("#registro-cerrar").onclick = () => mostrarRegistro(false);
  $("#registro-cancelar").onclick = async () => { if (confirm("¿Cancelar el trabajo en curso? Lo ya renderizado se conserva.")) { try { await api("/api/cancelar", { metodo: "POST" }); } catch (e) { fallo(e); } } };
  try {
    const [pf, est] = await Promise.all([api("/api/perfiles"), api("/api/estado")]);
    S.perfiles = pf.perfiles; S.paletas = pf.paletas; S.activo = est.activo; S.claves = est.claves; S.trabajo = est.trabajo; S.studio = est.studio;
  } catch (e) { $("#vista").replaceChildren(h("div.tarjeta", h("h2", "No puedo hablar con el panel"), h("p", e.message))); return; }
  pintarTrabajo();
  conectarSSE();
  window.addEventListener("hashchange", () => pintarVista());
  await pintarVista();
}
iniciar();
