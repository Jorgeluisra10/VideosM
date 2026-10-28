/**
 * PANEL DE VIDEOS (interfaz): resumen, biblioteca, detalle, registrar métricas, pipeline, qué funciona, evitar repetición e importar / exportar CSV.
 * Los datos viven en data/videos.json (servidor: scripts/panel/videos.mjs). Aquí solo se muestran; toda la lógica (resumen, ranking, parecidos, CSV) es la del núcleo
 * compartido (src/anim/videos.ts). Recibe del panel principal sus utilidades en `ctx` = { h, api, aviso, fallo, num, N }.
 */
let ctx, h, api, aviso, fallo, num, N;
const PV = { videos: null, filtros: { q: "", serie: "", plataforma: "", estado: "", desde: "", hasta: "" }, orden: { col: "fecha", dir: -1 }, previa: null, csv: "", idea: { titulo: "", serie: "otro", gancho: "", guion: "" }, parecidos: [] };

const NS = "http://www.w3.org/2000/svg";
function svg(tag, attrs = {}, ...hijos) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  hijos.forEach((c) => c != null && el.append(c));
  return el;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const fechaCorta = (f) => { if (!f) return "—"; const [a, m, d] = f.split("-").map(Number); return `${d} ${MESES[m - 1]} ${a}`; };
const hoy = () => N.hoyISO();
const fmt = (n) => Number(n ?? 0).toLocaleString("es-CO");
const pct = (x) => `${(x * 100).toLocaleString("es-CO", { maximumFractionDigits: 1 })} %`;
const porId = (id) => PV.videos.find((v) => v.id === id);
const urlMiniatura = (v) => (v.ruta_miniatura ? `/media-videos/${v.ruta_miniatura.split("/").pop()}` : "");
const urlVideo = (v) => (v.ruta_archivo ? `/media-videos/${v.ruta_archivo.split("/").pop()}` : "");

async function cargar() {
  PV.videos = (await api("/api/videos")).videos;
}

const chipEstado = (e) => h(`span.pv-chip.pv-est-${e}`, N.ESTADOS_ETIQUETA[e] ?? e);
const chipSerie = (s) => h("span.pv-chip.pv-serie", N.SERIES_ETIQUETA[s] ?? s);
const chipClase = (c) => h(`span.pv-chip.pv-clase-${c}`, c === "convierte" ? "🟢 Convierte" : c === "interesa" ? "🟡 Interesa" : "⚪ Solo entretiene");

function estadoVacio(icono, titulo, texto, ...acciones) {
  return h("div.pv-vacio", h("div.pv-vacio-ico", icono), h("h3", titulo), h("p.suave", texto), h("div.fila", { style: "justify-content:center" }, acciones));
}
const botonIr = (texto, hash, clase = "") => h(`a.btn${clase ? "." + clase : ""}`, { href: hash }, texto);

function miniatura(v, clase = "pv-mini") {
  const u = urlMiniatura(v);
  return u ? h(`img.${clase}`, { src: u, alt: "", loading: "lazy" }) : h(`div.${clase}.pv-mini-vacia`, { "aria-hidden": "true" }, (v.titulo || "?").slice(0, 1).toUpperCase());
}

/* ───────────── videos grabados: lo primero que se ve ───────────── */
/** «Nuevo»: llegó de la carpeta videos/ (git) o se creó hace menos de 3 días y todavía no se publica. */
const esNuevo = (v) => v.estado === "grabado" && (v.origen === "carpeta" || Date.now() - new Date(v.creado).getTime() < 3 * 864e5);
const insigniaNuevo = (v) => (esNuevo(v) ? h("span.pv-nuevo", "🆕 NUEVO") : null);

async function traerDeLaCarpeta() {
  try {
    const r = await api("/api/videos/sincronizar", { metodo: "POST", cuerpo: {} });
    aviso(r.nuevos || r.actualizados ? `✅ Trajo ${r.nuevos} video(s) nuevo(s) de la carpeta videos/${r.actualizados ? ` y completó ${r.actualizados}` : ""}.` : `Todo al día: ${r.total} video(s) en la carpeta videos/ y ya están en el panel.`, "ok", 5000);
    await PV.recargarVista?.();
  } catch (er) { fallo(er); }
}

/** Tarjetas grandes con los videos «grabados» (listos para publicar), con su miniatura, serie y duración. Aparece arriba del Resumen y de la Biblioteca. */
function bloqueGrabados() {
  const l = PV.videos.filter((v) => v.estado === "grabado").sort((a, b) => String(b.creado).localeCompare(String(a.creado)));
  const tarjeta = (v) => h("a.pv-video-tarjeta", { href: `#/videos/v/${v.id}`, title: "Abrir el video, su guion y sus notas" },
    miniatura(v, "pv-mini-grande"),
    h("div.pv-video-info", h("div", insigniaNuevo(v), chipSerie(v.serie)), h("strong", v.titulo), h("span.chico-t.suave", `${v.duracion_seg ? `${v.duracion_seg} s · ` : ""}${v.voz_usada ? `🎙️ ${v.voz_usada}` : "sin voz todavía"}`), h("span.pv-ver", urlVideo(v) ? "▶ Ver el video" : "Ver detalle")));
  return h("section.pv-listos", { "aria-label": "Videos grabados listos para publicar" },
    h("div.pv-listos-cab", h("h2", `🎬 Listos para publicar (${l.length})`), h("span.espacio"), h("button.btn.primario.chico", { type: "button", onclick: traerDeLaCarpeta, title: "Busca en la carpeta videos/ los videos que creó Claude y todavía no están aquí" }, "🔄 Traer videos de la carpeta videos/")),
    l.length ? h("div.pv-listos-rejilla", l.map(tarjeta)) : h("p.suave", "Aún no hay videos grabados. Los que se crean con /video aparecen aquí solos (si no, pulsa «Traer videos de la carpeta videos/» después de actualizar el código)."));
}

/* ───────────── gráficas (SVG, sin librerías) ───────────── */
function barras(datos, { clave, etiqueta, color }) {
  const W = 520, H = 160, pad = { l: 52, r: 8, t: 10, b: 24 };
  const max = Math.max(1, ...datos.map((d) => d[clave]));
  const bw = (W - pad.l - pad.r) / datos.length;
  const g = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "pv-grafica", role: "img", "aria-label": etiqueta });
  for (let i = 0; i <= 2; i++) {
    const y = pad.t + ((H - pad.t - pad.b) * i) / 2;
    g.append(svg("line", { x1: pad.l, x2: W - pad.r, y1: y, y2: y, class: "pv-eje" }), svg("text", { x: pad.l - 4, y: y + 4, "text-anchor": "end", class: "pv-eje-t" }, fmt(Math.round(max * (1 - i / 2)))));
  }
  datos.forEach((d, i) => {
    const alto = ((H - pad.t - pad.b) * d[clave]) / max;
    const x = pad.l + i * bw + bw * 0.15;
    const r = svg("rect", { x, y: H - pad.b - alto, width: bw * 0.7, height: Math.max(alto, d[clave] ? 2 : 0), rx: 3, fill: color });
    r.append(svg("title", {}, `Semana del ${fechaCorta(d.semana)}: ${fmt(d[clave])} ${etiqueta.toLowerCase()}`));
    g.append(r);
    if (i % 2 === (datos.length - 1) % 2) g.append(svg("text", { x: x + bw * 0.35, y: H - 8, "text-anchor": "middle", class: "pv-eje-t" }, fechaCorta(d.semana).slice(0, -5)));
  });
  return g;
}

function linea(puntos, { etiqueta }) {
  const W = 420, H = 140, pad = { l: 40, r: 10, t: 10, b: 22 };
  const max = Math.max(1, ...puntos.map((p) => p.y));
  const g = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "pv-grafica", role: "img", "aria-label": etiqueta });
  g.append(svg("line", { x1: pad.l, x2: W - pad.r, y1: H - pad.b, y2: H - pad.b, class: "pv-eje" }), svg("text", { x: pad.l - 4, y: pad.t + 4, "text-anchor": "end", class: "pv-eje-t" }, fmt(max)));
  const X = (i) => pad.l + (puntos.length === 1 ? (W - pad.l - pad.r) / 2 : ((W - pad.l - pad.r) * i) / (puntos.length - 1));
  const Y = (v) => H - pad.b - ((H - pad.t - pad.b) * v) / max;
  g.append(svg("polyline", { points: puntos.map((p, i) => `${X(i)},${Y(p.y)}`).join(" "), class: "pv-linea", fill: "none" }));
  puntos.forEach((p, i) => { const c = svg("circle", { cx: X(i), cy: Y(p.y), r: 4, class: "pv-punto" }); c.append(svg("title", {}, `${fechaCorta(p.x)}: ${fmt(p.y)}`)); g.append(c); });
  g.append(svg("text", { x: pad.l, y: H - 6, class: "pv-eje-t" }, fechaCorta(puntos[0].x).slice(0, -5)), svg("text", { x: W - pad.r, y: H - 6, "text-anchor": "end", class: "pv-eje-t" }, fechaCorta(puntos.at(-1).x).slice(0, -5)));
  return g;
}

/* ───────────── cabecera y pestañas ───────────── */
const TABS = [["", "📊 Resumen"], ["biblioteca", "🗂️ Biblioteca"], ["pipeline", "🧭 Pipeline"], ["funciona", "🏆 Qué funciona"], ["nueva", "💡 Nueva idea"], ["metricas", "✍️ Registrar métricas"], ["importar", "📥 Importar / exportar"]];
function marco(actual, ...contenido) {
  return h("div.pv",
    h("div.pv-cab", h("div", h("h1", "Panel de Videos"), h("p.suave", "Todos tus videos, lo que publicaste, qué resultados dio y qué contenido repetir o descartar. Todo se guarda en este computador (data/videos.json).")), h("span.espacio"), botonIr("＋ Nueva idea", "#/videos/nueva", "primario")),
    h("nav.pv-tabs", { "aria-label": "Secciones del Panel de Videos" }, TABS.map(([r, t]) => h(`a.pv-tab${r === actual ? ".activa" : ""}`, { href: `#/videos${r ? "/" + r : ""}`, ...(r === actual ? { "aria-current": "page" } : {}) }, t, r === "biblioteca" && PV.videos?.length ? h("span.pv-contador", String(PV.videos.length)) : null))),
    contenido);
}

/* ───────────── 1 · Resumen ───────────── */
function vistaResumen(cont) {
  if (!PV.videos.length) return cont.replaceChildren(marco("", estadoVacio("📭", "Todavía no hay videos", "Importa los que ya subiste (un CSV con título, serie, plataforma, enlace, fecha y cifras) o empieza por una idea nueva. Los videos que genera el sistema aparecen solos al renderizarlos.", botonIr("📥 Importar mis videos", "#/videos/importar", "primario"), botonIr("💡 Nueva idea", "#/videos/nueva"))));
  const r = N.resumenMes(PV.videos, hoy());
  const sem = N.serieSemanal(PV.videos, hoy(), 12);
  const [a, m] = r.mes.split("-").map(Number);
  const tarjeta = (ico, valor, titulo, sub) => h("div.pv-kpi", h("div.pv-kpi-ico", ico), h("div.pv-kpi-v", fmt(valor)), h("div.pv-kpi-t", titulo), sub ? h("div.pv-kpi-s", sub) : null);
  cont.replaceChildren(marco("",
    bloqueGrabados(),
    h("h2", `Este mes · ${MESES[m - 1]} ${a}`),
    h("div.pv-kpis",
      tarjeta("📦", PV.videos.filter((v) => v.estado === "grabado").length, "Grabados sin publicar", "listos para subir"),
      tarjeta("🎬", r.publicados, "Videos publicados", `${r.videos} en total`),
      tarjeta("👁️", r.mes_totales.vistas, "Vistas", "de los publicados este mes"),
      tarjeta("🔖", r.mes_totales.guardados, "Guardados", r.mes_totales.vistas ? `${pct(r.mes_totales.guardados / r.mes_totales.vistas)} de las vistas` : ""),
      tarjeta("↗️", r.mes_totales.compartidos, "Compartidos", ""),
      tarjeta("🏠", r.acciones_mes, "Acciones de negocio", "registros, solicitudes, visitas, contactos")),
    h("div.pv-dos",
      h("div.pv-tarjeta", h("h3", "Vistas por semana"), h("p.chico-t.suave", "Las vistas de cada video cuentan en la semana en que se publicó."), barras(sem, { clave: "vistas", etiqueta: "Vistas", color: "var(--pv-oro)" })),
      h("div.pv-tarjeta", h("h3", "Acciones de negocio por semana"), h("p.chico-t.suave", "Según la semana en que ocurrió cada acción."), barras(sem, { clave: "acciones", etiqueta: "Acciones", color: "var(--pv-azul)" }))),
    h("p.chico-t.suave", `Acumulado de todos los videos: ${fmt(r.todo.vistas)} vistas · ${fmt(r.todo.guardados)} guardados · ${fmt(r.todo.compartidos)} compartidos · ${fmt(r.todo.acciones)} acciones de negocio.`)));
}

/* ───────────── 2 · Biblioteca ───────────── */
function filtrados() {
  const f = PV.filtros, q = N.normalizarTexto(f.q);
  let l = PV.videos.filter((v) =>
    (!q || N.normalizarTexto(`${v.titulo} ${v.gancho} ${v.guion} ${v.notas}`).includes(q)) && (!f.serie || v.serie === f.serie) && (!f.estado || v.estado === f.estado) &&
    (!f.plataforma || v.publicaciones.some((p) => p.plataforma === f.plataforma)) && (!f.desde || N.fechaDelVideo(v) >= f.desde) && (!f.hasta || N.fechaDelVideo(v) <= f.hasta));
  const { col, dir } = PV.orden;
  const val = (v) => col === "titulo" ? N.normalizarTexto(v.titulo) : col === "serie" ? v.serie : col === "estado" ? N.ESTADOS.indexOf(v.estado) : col === "fecha" ? N.fechaDelVideo(v) : N.metricasActuales(v)[col] ?? 0;
  l = l.slice().sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * dir; });
  return l;
}

function vistaBiblioteca(cont) {
  const f = PV.filtros;
  const campo = (etq, el) => h("label.campo", etq, el);
  const sel = (k, opciones, vacio) => h("select", { onchange: (e) => { f[k] = e.target.value; pintarTabla(); } }, h("option", { value: "" }, vacio), opciones.map(([v, t]) => h("option", { value: v, selected: f[k] === v }, t)));
  const cuerpo = h("div#pv-tabla");
  const pintarTabla = () => {
    const l = filtrados();
    const th = (col, t) => h("th", { "aria-sort": PV.orden.col === col ? (PV.orden.dir > 0 ? "ascending" : "descending") : "none" }, h("button.pv-th", { type: "button", onclick: () => { PV.orden = { col, dir: PV.orden.col === col ? -PV.orden.dir : -1 }; pintarTabla(); } }, t, PV.orden.col === col ? (PV.orden.dir > 0 ? " ▲" : " ▼") : ""));
    if (!l.length) return cuerpo.replaceChildren(PV.videos.length ? estadoVacio("🔎", "Ningún video coincide", "Cambia o quita los filtros.", h("button.btn", { type: "button", onclick: () => { Object.assign(PV.filtros, { q: "", serie: "", plataforma: "", estado: "", desde: "", hasta: "" }); vistaBiblioteca(cont); } }, "Quitar filtros")) : estadoVacio("📭", "Aún no hay videos", ""));
    cuerpo.replaceChildren(h("p.chico-t.suave", `${l.length} de ${PV.videos.length} videos`),
      h("div.pv-scroll", h("table.pv-tabla", h("thead", h("tr", h("th", ""), th("titulo", "Título"), th("serie", "Serie"), th("estado", "Estado"), th("fecha", "Fecha"), h("th", "Plataformas"), th("vistas", "Vistas"), th("guardados", "Guardados"), th("acciones", "Acciones"))),
        h("tbody", l.map((v) => { const m = N.metricasActuales(v); return h("tr", h("td", miniatura(v)), h("td", h("a.pv-titulo", { href: `#/videos/v/${v.id}` }, v.titulo), insigniaNuevo(v)), h("td", chipSerie(v.serie)), h("td", chipEstado(v.estado)), h("td", fechaCorta(N.fechaDelVideo(v))), h("td", v.publicaciones.length ? v.publicaciones.map((p) => (p.url ? h("a.pv-plat", { href: p.url, target: "_blank", rel: "noopener noreferrer", title: p.url }, N.PLATAFORMAS_ETIQUETA[p.plataforma]) : h("span.pv-plat", N.PLATAFORMAS_ETIQUETA[p.plataforma]))) : h("span.suave", "—")), h("td.pv-num", fmt(m.vistas)), h("td.pv-num", fmt(m.guardados)), h("td.pv-num", fmt(m.acciones))); })))));
  };
  cont.replaceChildren(marco("biblioteca",
    bloqueGrabados(),
    h("div.pv-filtros",
      campo("Buscar", h("input", { type: "search", placeholder: "título, gancho, guion…", value: f.q, oninput: (e) => { f.q = e.target.value; pintarTabla(); } })),
      campo("Serie", sel("serie", N.SERIES.map((s) => [s, N.SERIES_ETIQUETA[s]]), "Todas")),
      campo("Plataforma", sel("plataforma", N.PLATAFORMAS.map((s) => [s, N.PLATAFORMAS_ETIQUETA[s]]), "Todas")),
      campo("Estado", sel("estado", N.ESTADOS.map((s) => [s, N.ESTADOS_ETIQUETA[s]]), "Todos")),
      campo("Desde", h("input", { type: "date", value: f.desde, onchange: (e) => { f.desde = e.target.value; pintarTabla(); } })),
      campo("Hasta", h("input", { type: "date", value: f.hasta, onchange: (e) => { f.hasta = e.target.value; pintarTabla(); } }))),
    cuerpo));
  pintarTabla();
}

/* ───────────── 3 · Detalle ───────────── */
function formAccionMini(v, recargar) {
  const o = { tipo: "registro_agente", cantidad: 1, fecha: hoy(), notas: "" };
  return h("form.pv-form-mini", { onsubmit: async (e) => { e.preventDefault(); try { await api("/api/videos/accion", { metodo: "POST", cuerpo: { id: v.id, accion: o } }); aviso("✅ Acción registrada.", "ok", 2500); await recargar(); } catch (er) { fallo(er); } } },
    h("select", { onchange: (e) => (o.tipo = e.target.value) }, N.TIPOS_ACCION.map((t) => h("option", { value: t }, N.TIPOS_ACCION_ETIQUETA[t]))),
    h("input", { type: "number", min: 1, value: 1, "aria-label": "Cantidad", style: "width:80px", oninput: (e) => (o.cantidad = Number(e.target.value)) }),
    h("input", { type: "date", value: o.fecha, "aria-label": "Fecha", onchange: (e) => (o.fecha = e.target.value) }),
    h("input", { type: "text", placeholder: "nota (opcional)", "aria-label": "Notas", oninput: (e) => (o.notas = e.target.value) }),
    h("button.btn.primario.chico", { type: "submit" }, "＋ Registrar acción"));
}

async function vistaDetalle(cont, id) {
  const v = porId(id);
  if (!v) return cont.replaceChildren(marco("biblioteca", estadoVacio("🤷", "No encuentro ese video", "Puede que lo hayas eliminado.", botonIr("Volver a la biblioteca", "#/videos/biblioteca", "primario"))));
  const recargar = async () => { await cargar(); await vistaDetalle(cont, id); };
  const e = { ...v };
  const campo = (etq, el, ancho = "") => h(`label.campo${ancho}`, etq, el);
  const guardar = async () => {
    try {
      const r = await api("/api/videos/guardar", { metodo: "POST", cuerpo: { video: { id: v.id, titulo: e.titulo, serie: e.serie, estado: e.estado, fecha_publicacion: e.fecha_publicacion, duracion_seg: e.duracion_seg, gancho: e.gancho, guion: e.guion, voz_usada: e.voz_usada, instrucciones_voz: e.instrucciones_voz, notas: e.notas } } });
      aviso("✅ Guardado.", "ok", 2500);
      if (r.parecidos?.length) aviso(`⚠️ Se parece a «${r.parecidos[0].video.titulo}» (hace ${Math.abs(r.parecidos[0].dias)} días).`, "aviso", 7000);
      await recargar();
    } catch (er) { fallo(er); }
  };
  const nuevaPub = { plataforma: "instagram", url: "", fecha: hoy() };
  const m = N.metricasActuales(v);
  const porFecha = [...v.metricas].sort((a, b) => a.fecha_medicion.localeCompare(b.fecha_medicion));
  const historia = porFecha.map((x, i) => ({ x: x.fecha_medicion, y: x.vistas, i })).filter((p) => p.y > 0);
  cont.replaceChildren(marco("biblioteca",
    h("div.pv-ruta", h("a", { href: "#/videos/biblioteca" }, "← Biblioteca")),
    h("div.pv-detalle",
      h("div.pv-col",
        h("div.pv-tarjeta", h("h2", "Datos del video"),
          h("div.pv-rejilla",
            campo("Título", h("input", { type: "text", value: e.titulo, oninput: (x) => (e.titulo = x.target.value) }), ".pv-ancho"),
            campo("Serie", h("select", { onchange: (x) => (e.serie = x.target.value) }, N.SERIES.map((s) => h("option", { value: s, selected: s === e.serie }, N.SERIES_ETIQUETA[s])))),
            campo("Estado", h("select", { onchange: (x) => (e.estado = x.target.value) }, N.ESTADOS.map((s) => h("option", { value: s, selected: s === e.estado }, N.ESTADOS_ETIQUETA[s])))),
            campo("Fecha de publicación", h("input", { type: "date", value: e.fecha_publicacion, onchange: (x) => (e.fecha_publicacion = x.target.value) })),
            campo("Duración (segundos)", h("input", { type: "number", min: 0, step: "0.1", value: e.duracion_seg, oninput: (x) => (e.duracion_seg = Number(x.target.value)) })),
            campo("Gancho (la primera frase)", h("input", { type: "text", value: e.gancho, oninput: (x) => (e.gancho = x.target.value) }), ".pv-ancho"),
            campo("Guion", h("textarea", { rows: 7, value: e.guion, oninput: (x) => (e.guion = x.target.value) }), ".pv-ancho"),
            campo("Voz usada", h("input", { type: "text", value: e.voz_usada, oninput: (x) => (e.voz_usada = x.target.value) })),
            campo("Notas", h("input", { type: "text", value: e.notas, oninput: (x) => (e.notas = x.target.value) })),
            campo("Instrucciones de voz usadas", h("textarea", { rows: 3, value: e.instrucciones_voz, oninput: (x) => (e.instrucciones_voz = x.target.value) }), ".pv-ancho")),
          h("div.fila", { style: "margin-top:12px" },
            h("button.btn.primario", { type: "button", onclick: guardar }, "💾 Guardar cambios"),
            h("button.btn", { type: "button", onclick: async () => { try { const r = await api("/api/videos/duplicar", { metodo: "POST", cuerpo: { id: v.id } }); aviso("✅ Copia creada como idea nueva.", "ok", 3000); location.hash = `#/videos/v/${r.video.id}`; } catch (er) { fallo(er); } } }, "📄 Duplicar como nueva idea"),
            h("span.espacio"),
            h("button.btn.peligro", { type: "button", onclick: async () => { if (!confirm(`¿Eliminar «${v.titulo}»? No se puede deshacer (queda una copia en data/backups).`)) return; try { await api("/api/videos/eliminar", { metodo: "POST", cuerpo: { id: v.id } }); aviso("Video eliminado.", "ok", 2500); location.hash = "#/videos/biblioteca"; } catch (er) { fallo(er); } } }, "🗑️ Eliminar"))),
        h("div.pv-tarjeta", h("h2", "Publicaciones"),
          v.publicaciones.length ? h("ul.pv-lista", v.publicaciones.map((p, i) => h("li", h("strong", N.PLATAFORMAS_ETIQUETA[p.plataforma]), " · ", fechaCorta(p.fecha), " · ", p.url ? h("a", { href: p.url, target: "_blank", rel: "noopener noreferrer" }, "abrir enlace ↗") : h("span.suave", "sin enlace"), h("button.btn.chico.peligro", { type: "button", "aria-label": "Quitar publicación", onclick: async () => { try { await api("/api/videos/guardar", { metodo: "POST", cuerpo: { video: { id: v.id, publicaciones: v.publicaciones.filter((_, j) => j !== i) } } }); await recargar(); } catch (er) { fallo(er); } } }, "✕")))) : h("p.suave", "Todavía no hay enlaces por plataforma."),
          h("form.pv-form-mini", { onsubmit: async (ev) => { ev.preventDefault(); try { await api("/api/videos/guardar", { metodo: "POST", cuerpo: { video: { id: v.id, publicaciones: [...v.publicaciones, nuevaPub] } } }); aviso("✅ Publicación agregada.", "ok", 2500); await recargar(); } catch (er) { fallo(er); } } },
            h("select", { onchange: (x) => (nuevaPub.plataforma = x.target.value) }, N.PLATAFORMAS.map((s) => h("option", { value: s }, N.PLATAFORMAS_ETIQUETA[s]))),
            h("input", { type: "url", placeholder: "https://…", "aria-label": "Enlace", oninput: (x) => (nuevaPub.url = x.target.value) }),
            h("input", { type: "date", value: nuevaPub.fecha, "aria-label": "Fecha", onchange: (x) => (nuevaPub.fecha = x.target.value) }),
            h("button.btn.chico", { type: "submit" }, "＋ Agregar"))),
      ),
      h("div.pv-col",
        urlVideo(v) ? h("div.pv-tarjeta", h("h2", "Video"), h("video.pv-reproductor", { src: urlVideo(v), controls: true, preload: "metadata", poster: urlMiniatura(v) }), h("p.chico-t.suave", v.voz_usada ? `🎙️ ${v.voz_usada}` : "Sin voz registrada")) : h("div.pv-tarjeta", h("h2", "Video"), h("p.suave", "Este video aún no tiene archivo. Los que genera el sistema aparecen aquí al renderizarlos.")),
        h("div.pv-tarjeta", h("h2", "Resultados"),
          h("div.pv-mini-kpis", [["👁️", m.vistas, "vistas"], ["❤️", m.me_gusta, "me gusta"], ["💬", m.comentarios, "comentarios"], ["🔖", m.guardados, "guardados"], ["↗️", m.compartidos, "compartidos"], ["🏠", m.acciones, "acciones"]].map(([i, n, t]) => h("div", h("strong", fmt(n)), h("span", `${i} ${t}`)))),
          historia.length ? linea(historia, { etiqueta: "Vistas por medición" }) : h("p.suave", "Aún no hay mediciones."),
          botonIr("✍️ Registrar métricas", `#/videos/metricas/${v.id}`, "primario"),
          porFecha.length ? h("details", h("summary.chico-t.suave", `Historial de mediciones (${porFecha.length})`), h("div.pv-scroll", h("table.pv-tabla", h("thead", h("tr", ["Fecha", "Plataforma", "Vistas", "Me gusta", "Coment.", "Guardados", "Compart.", "Retención"].map((t) => h("th", t)))), h("tbody", [...porFecha].reverse().map((x) => h("tr", h("td", fechaCorta(x.fecha_medicion)), h("td", x.plataforma ? N.PLATAFORMAS_ETIQUETA[x.plataforma] : "Total"), h("td.pv-num", fmt(x.vistas)), h("td.pv-num", fmt(x.me_gusta)), h("td.pv-num", fmt(x.comentarios)), h("td.pv-num", fmt(x.guardados)), h("td.pv-num", fmt(x.compartidos)), h("td.pv-num", x.retencion_pct === null ? "—" : `${x.retencion_pct} %`))))))) : null),
        h("div.pv-tarjeta", h("h2", "Acciones de negocio"),
          v.acciones.length ? h("ul.pv-lista", [...v.acciones].sort((a, b) => b.fecha.localeCompare(a.fecha)).map((a) => h("li", h("strong", `${a.cantidad} × ${N.TIPOS_ACCION_ETIQUETA[a.tipo]}`), ` · ${fechaCorta(a.fecha)}`, a.notas ? h("span.suave", ` · ${a.notas}`) : null))) : h("p.suave", "Todavía no registraste acciones que haya traído este video (registros de agentes, solicitudes, visitas con código IMN, contactos por WhatsApp)."),
          formAccionMini(v, recargar))))));
}

/* ───────────── 4 · Registrar métricas ───────────── */
async function vistaMetricas(cont, idInicial) {
  const lista = [...PV.videos].sort((a, b) => (b.estado === "publicado") - (a.estado === "publicado") || N.fechaDelVideo(b).localeCompare(N.fechaDelVideo(a)));
  if (!lista.length) return cont.replaceChildren(marco("metricas", estadoVacio("✍️", "Primero necesitas un video", "Importa los que ya subiste o crea uno nuevo.", botonIr("📥 Importar", "#/videos/importar", "primario"), botonIr("💡 Nueva idea", "#/videos/nueva"))));
  const o = { id: idInicial && porId(idInicial) ? idInicial : lista[0].id, plataforma: "", fecha_medicion: hoy(), vistas: "", guardados: "", compartidos: "", me_gusta: "", comentarios: "", retencion_pct: "" };
  const zona = h("div");
  const pintar = () => {
    const v = porId(o.id);
    const ult = [...v.metricas].sort((a, b) => b.fecha_medicion.localeCompare(a.fecha_medicion))[0];
    const num_ = (k, etq, ico, extra = {}) => h("label.campo.pv-num-campo", `${ico} ${etq}`, h("input", { type: "number", inputmode: "numeric", min: 0, step: k === "retencion_pct" ? "0.1" : "1", value: o[k], placeholder: ult && k !== "retencion_pct" ? fmt(ult[k]) : "", oninput: (e) => (o[k] = e.target.value), ...extra }));
    zona.replaceChildren(h("form.pv-tarjeta.pv-metricas", { onsubmit: async (ev) => {
      ev.preventDefault();
      const otra = ev.submitter?.dataset.otra === "1";
      try {
        await api("/api/videos/metrica", { metodo: "POST", cuerpo: { id: o.id, metrica: { ...o, retencion_pct: o.retencion_pct === "" ? null : o.retencion_pct } } });
        aviso("✅ Métricas guardadas.", "ok", 2500);
        await cargar();
        if (otra) { for (const k of ["vistas", "guardados", "compartidos", "me_gusta", "comentarios", "retencion_pct"]) o[k] = ""; const sig = lista[(lista.findIndex((x) => x.id === o.id) + 1) % lista.length]; o.id = sig.id; pintar(); } else location.hash = `#/videos/v/${o.id}`;
      } catch (er) { fallo(er); }
    } },
      h("div.pv-rejilla",
        h("label.campo.pv-ancho", "Video", h("select", { onchange: (e) => { o.id = e.target.value; pintar(); } }, lista.map((x) => h("option", { value: x.id, selected: x.id === o.id }, `${x.titulo}${x.estado === "publicado" ? "" : ` (${N.ESTADOS_ETIQUETA[x.estado]})`}`)))),
        h("label.campo", "Plataforma", h("select", { onchange: (e) => (o.plataforma = e.target.value) }, h("option", { value: "", selected: !o.plataforma }, "Todas (total)"), N.PLATAFORMAS.map((p) => h("option", { value: p, selected: o.plataforma === p }, N.PLATAFORMAS_ETIQUETA[p])))),
        h("label.campo", "Fecha de la medición", h("input", { type: "date", value: o.fecha_medicion, onchange: (e) => (o.fecha_medicion = e.target.value) }))),
      h("div.pv-rejilla.pv-cinco", num_("vistas", "Vistas", "👁️", { autofocus: true }), num_("guardados", "Guardados", "🔖"), num_("compartidos", "Compartidos", "↗️"), num_("me_gusta", "Me gusta", "❤️"), num_("comentarios", "Comentarios", "💬")),
      h("details", h("summary.chico-t.suave", "Retención (opcional)"), num_("retencion_pct", "Retención %", "⏱️")),
      ult ? h("p.chico-t.suave", `Última medición (${fechaCorta(ult.fecha_medicion)}): ${fmt(ult.vistas)} vistas · ${fmt(ult.guardados)} guardados · ${fmt(ult.compartidos)} compartidos. Los números de gris son esa medición; escribe los de hoy.`) : h("p.chico-t.suave", "Es la primera medición de este video."),
      h("div.fila", h("button.btn.primario", { type: "submit" }, "💾 Guardar"), h("button.btn", { type: "submit", "data-otra": "1" }, "💾 Guardar y registrar otro video"), h("span.espacio"), botonIr("Cancelar", `#/videos/v/${o.id}`))));
  };
  cont.replaceChildren(marco("metricas", h("p.suave", "Pensado para llenarse en 30 segundos: elige el video, escribe los números que ves en la plataforma y guarda."), zona));
  pintar();
}

/* ───────────── 5 · Pipeline ───────────── */
function vistaPipeline(cont) {
  const mover = async (id, estado) => {
    const v = porId(id);
    if (!v || v.estado === estado) return;
    try { await api("/api/videos/estado", { metodo: "POST", cuerpo: { id, estado } }); await cargar(); vistaPipeline(cont); aviso(`✅ «${v.titulo}» → ${N.ESTADOS_ETIQUETA[estado]}`, "ok", 2200); } catch (er) { fallo(er); }
  };
  const tarjeta = (v) => h("div.pv-card", { draggable: "true", "data-id": v.id, ondragstart: (e) => { e.dataTransfer.setData("text/plain", v.id); e.dataTransfer.effectAllowed = "move"; e.currentTarget.classList.add("arrastrando"); }, ondragend: (e) => e.currentTarget.classList.remove("arrastrando") },
    h("a.pv-titulo", { href: `#/videos/v/${v.id}` }, v.titulo), h("div.fila.chicos", chipSerie(v.serie), v.fecha_publicacion ? h("span.chico-t.suave", fechaCorta(v.fecha_publicacion)) : null),
    h("select.pv-mover", { "aria-label": `Mover «${v.titulo}» a otra columna`, onchange: (e) => mover(v.id, e.target.value) }, N.ESTADOS.map((s) => h("option", { value: s, selected: s === v.estado }, N.ESTADOS_ETIQUETA[s]))));
  cont.replaceChildren(marco("pipeline",
    h("p.suave", "Arrastra las tarjetas entre columnas (o usa el selector de cada tarjeta) para avanzar de idea a publicado."),
    h("div.pv-tablero", N.ESTADOS.map((est) => {
      const col = PV.videos.filter((v) => v.estado === est).sort((a, b) => N.fechaDelVideo(b).localeCompare(N.fechaDelVideo(a)));
      return h("section.pv-columna", { "aria-label": N.ESTADOS_ETIQUETA[est], ondragover: (e) => { e.preventDefault(); e.currentTarget.classList.add("sobre"); }, ondragleave: (e) => e.currentTarget.classList.remove("sobre"), ondrop: (e) => { e.preventDefault(); e.currentTarget.classList.remove("sobre"); mover(e.dataTransfer.getData("text/plain"), est); } },
        h("h3", N.ESTADOS_ETIQUETA[est], h("span.pv-cuenta", String(col.length))), col.length ? col.map(tarjeta) : h("div.pv-suelta", "Suelta aquí"));
    }))));
}

/* ───────────── 6 · Qué funciona ───────────── */
function vistaFunciona(cont) {
  const series = N.rankingSeries(PV.videos), ganchos = N.rankingGanchos(PV.videos);
  if (!series.length) return cont.replaceChildren(marco("funciona", estadoVacio("🏆", "Aún no hay resultados", "Esta pantalla compara tus series y ganchos con los videos publicados y sus métricas. Importa los que ya subiste o registra métricas.", botonIr("📥 Importar", "#/videos/importar", "primario"), botonIr("✍️ Registrar métricas", "#/videos/metricas"))));
  const maxP = Math.max(1, ...series.map((s) => s.puntos), ...ganchos.map((s) => s.puntos));
  const tabla = (filas, titulo) => h("div.pv-scroll", h("table.pv-tabla", h("thead", h("tr", h("th", titulo), h("th", "Resultado"), h("th", "Videos"), h("th", "Acciones"), h("th", "Compart."), h("th", "Guardados"), h("th", "Interacción"), h("th", "Vistas"), h("th", "Puntos"))),
    h("tbody", filas.map((f) => h(`tr.pv-fila-${f.clase}`, h("td", h("strong", f.etiqueta)), h("td", chipClase(f.clase)), h("td.pv-num", f.videos), h("td.pv-num", fmt(f.acciones)), h("td.pv-num", fmt(f.compartidos)), h("td.pv-num", fmt(f.guardados)), h("td.pv-num", pct(f.interaccion)), h("td.pv-num.suave", fmt(f.vistas)), h("td", h("div.pv-barra", h("i", { style: `width:${Math.round((f.puntos / maxP) * 100)}%` }), h("span", fmt(f.puntos)))))))));
  cont.replaceChildren(marco("funciona",
    h("div.pv-nota", h("strong", "Cómo se lee: "), "no manda quién tiene más vistas, sino quién hace que la gente actúe. ", chipClase("convierte"), " trajo acciones de negocio · ", chipClase("interesa"), " la gente lo guarda o lo comparte (≥ 2 % de las vistas) · ", chipClase("entretiene"), " suma vistas pero nada más. Los puntos pesan acciones ×50, compartidos ×5, guardados ×3 y vistas ×0,002 (por video)."),
    h("h2", "Series"), tabla(series, "Serie"),
    h("h2", { style: "margin-top:22px" }, "Ganchos"), ganchos.length ? tabla(ganchos, "Gancho") : h("p.suave", "Todavía no hay ganchos registrados en los videos publicados (se llena en el detalle de cada video).")));
}

/* ───────────── 7 · Nueva idea (evitar repetición) ───────────── */
function vistaNueva(cont) {
  const i = PV.idea;
  const zona = h("div#pv-parecidos");
  let t;
  const buscar = () => { clearTimeout(t); t = setTimeout(async () => {
    if (!i.titulo.trim() && !i.gancho.trim()) { PV.parecidos = []; return pintar(); }
    try { PV.parecidos = (await api("/api/videos/parecidos", { metodo: "POST", cuerpo: { titulo: i.titulo, gancho: i.gancho } })).parecidos; pintar(); } catch { /* sin conexión: no se avisa en cada tecla */ }
  }, 300); };
  const pintar = () => zona.replaceChildren(PV.parecidos.length
    ? h("div.pv-alerta", h("strong", `⚠️ Ya hay ${PV.parecidos.length === 1 ? "una idea parecida" : `${PV.parecidos.length} ideas parecidas`} en los últimos 60 días`), h("ul.pv-lista", PV.parecidos.map((p) => h("li", h("a", { href: `#/videos/v/${p.video.id}` }, p.video.titulo), h("span.suave", ` · ${p.motivo} ${Math.round(p.similitud * 100)} % parecido · ${p.dias >= 0 ? `hace ${p.dias} días` : `en ${-p.dias} días`} · `), chipEstado(p.video.estado)))), h("p.chico-t", "Puedes guardarla igual, pero piensa si conviene repetir el tema o cambiar el ángulo."))
    : (i.titulo.trim() || i.gancho.trim()) ? h("div.pv-ok", "✅ No encuentro nada parecido en los últimos 60 días.") : h("p.chico-t.suave", "Escribe el título o el gancho y te aviso si ya hay algo parecido."));
  cont.replaceChildren(marco("nueva",
    h("div.pv-tarjeta",
      h("h2", "Nueva idea o guion"),
      h("div.pv-rejilla",
        h("label.campo.pv-ancho", "Título", h("input", { type: "text", value: i.titulo, placeholder: "Ej.: 3 señales de estafa al comprar una propiedad", oninput: (e) => { i.titulo = e.target.value; buscar(); } })),
        h("label.campo", "Serie", h("select", { onchange: (e) => (i.serie = e.target.value) }, N.SERIES.map((s) => h("option", { value: s, selected: s === i.serie }, N.SERIES_ETIQUETA[s])))),
        h("label.campo.pv-ancho", "Gancho (la primera frase)", h("input", { type: "text", value: i.gancho, placeholder: "¿Sabías que…?", oninput: (e) => { i.gancho = e.target.value; buscar(); } })),
        h("label.campo.pv-ancho", "Guion (opcional)", h("textarea", { rows: 6, value: i.guion, oninput: (e) => (i.guion = e.target.value) }))),
      zona,
      h("div.fila", { style: "margin-top:12px" }, h("button.btn.primario", { type: "button", onclick: async () => {
        try {
          const r = await api("/api/videos/guardar", { metodo: "POST", cuerpo: { video: { titulo: i.titulo, serie: i.serie, gancho: i.gancho, guion: i.guion, estado: i.guion.trim() ? "guion" : "idea" } } });
          PV.idea = { titulo: "", serie: "otro", gancho: "", guion: "" }; PV.parecidos = [];
          aviso("✅ Idea guardada.", "ok", 2500); location.hash = `#/videos/v/${r.video.id}`;
        } catch (er) { fallo(er); }
      } }, "💾 Guardar idea"), h("button.btn", { type: "button", onclick: () => { PV.idea = { titulo: "", serie: "otro", gancho: "", guion: "" }; PV.parecidos = []; vistaNueva(cont); } }, "Limpiar")))));
  pintar();
  if (i.titulo || i.gancho) buscar();
}

/* ───────────── 8 · Importar / exportar ───────────── */
function vistaImportar(cont) {
  const zona = h("div#pv-previa");
  const pintarPrevia = () => {
    const p = PV.previa;
    if (!p) return zona.replaceChildren();
    const icono = (f) => (!f.ok ? "❌" : f.duplicada ? "⚠️" : "✅");
    zona.replaceChildren(h("div.pv-tarjeta",
      h("h2", "Vista previa"),
      h("div.fila.chicos", h("span.pv-chip.pv-ok", `✅ ${p.resumen.validas} para importar`), h("span.pv-chip.pv-clase-entretiene", `⚠️ ${p.resumen.duplicadas} repetidas (se omiten)`), h("span.pv-chip.pv-mal", `❌ ${p.resumen.conError} con errores (no se importan)`)),
      p.errores.map((e) => h("div.pv-alerta", e)),
      h("div.pv-scroll", h("table.pv-tabla", h("thead", h("tr", ["Fila", "", "Título", "Serie", "Plataforma", "Fecha", "Vistas", "Guard.", "Compart.", "Detalle"].map((t) => h("th", t)))),
        h("tbody", p.filas.map((f) => h(!f.ok ? "tr.pv-fila-mal" : f.duplicada ? "tr.pv-fila-dup" : "tr", h("td.pv-num", f.fila), h("td", icono(f)), h("td", f.video?.titulo ?? "—"), h("td", f.video ? N.SERIES_ETIQUETA[f.video.serie] : "—"), h("td", f.video ? N.PLATAFORMAS_ETIQUETA[f.video.plataforma] : "—"), h("td", f.video ? fechaCorta(f.video.fecha) : "—"), h("td.pv-num", f.video ? fmt(f.video.vistas) : "—"), h("td.pv-num", f.video ? fmt(f.video.guardados) : "—"), h("td.pv-num", f.video ? fmt(f.video.compartidos) : "—"), h("td.chico-t", [...f.errores, ...f.avisos].join(" · ") || "—")))))),
      h("div.fila", { style: "margin-top:12px" },
        h("button.btn.primario", { type: "button", disabled: !p.resumen.validas, onclick: async () => { try { const r = await api("/api/videos/importar", { metodo: "POST", cuerpo: { csv: PV.csv } }); aviso(`✅ ${r.importados} videos importados${r.omitidas ? ` · ${r.omitidas} repetidos omitidos` : ""}${r.conError ? ` · ${r.conError} con error sin importar` : ""}.`, "ok", 6000); PV.previa = null; PV.csv = ""; await cargar(); location.hash = "#/videos/biblioteca"; } catch (er) { fallo(er); } } }, `📥 Importar ${p.resumen.validas} videos`),
        h("button.btn", { type: "button", onclick: () => { PV.previa = null; PV.csv = ""; pintarPrevia(); } }, "Cancelar"))));
  };
  const leerArchivo = async (archivo) => {
    if (!archivo) return;
    try { PV.csv = await archivo.text(); PV.previa = await api("/api/videos/importar/vista-previa", { metodo: "POST", cuerpo: { csv: PV.csv } }); pintarPrevia(); } catch (er) { PV.previa = null; pintarPrevia(); fallo(er); }
  };
  cont.replaceChildren(marco("importar",
    h("div.pv-dos",
      h("div.pv-tarjeta", h("h2", "📥 Importar videos ya subidos"),
        h("p.suave", "Carga un CSV con las columnas: ", h("code", N.COLUMNAS_IMPORTAR.join(", ")), ". Acepta coma, punto y coma o tabulador. Antes de guardar nada ves qué se va a importar y los errores fila por fila."),
        h("div.fila", h("label.btn.primario", { for: "pv-csv" }, "📂 Elegir archivo CSV"), h("input#pv-csv", { type: "file", accept: ".csv,text/csv,text/plain", hidden: true, onchange: (e) => leerArchivo(e.target.files?.[0]) }), h("a.btn", { href: "/api/videos/ejemplo.csv" }, "⬇️ Descargar CSV de ejemplo"))),
      h("div.pv-tarjeta", h("h2", "📤 Exportar todo"), h("p.suave", "Un CSV con todos tus videos (una fila por publicación). Sirve de copia y se puede volver a importar."), h("a.btn", { href: "/api/videos/exportar.csv" }, "⬇️ Exportar a CSV"), h("p.chico-t.suave", { style: "margin-top:10px" }, "Además, antes de cada cambio se guarda una copia en data/backups/ (las últimas 30)."))),
    zona));
  pintarPrevia();
}

/* ───────────── punto de entrada ───────────── */
export async function vistaVideos(cont, partes, contexto) {
  ctx = contexto; ({ h, api, aviso, fallo, num, N } = ctx);
  void num;
  PV.recargarVista = () => vistaVideos(cont, partes, contexto);
  document.body.classList.add("modo-pv");
  try {
    await cargar();
  } catch (e) {
    return cont.replaceChildren(marco("", h("div.pv-alerta", h("strong", "No pude leer data/videos.json. "), e.message, h("p.chico-t", "El archivo no se ha tocado. Corrígelo a mano o restaura una copia de data/backups/."))));
  }
  const [seccion, id] = partes;
  if (!seccion) return vistaResumen(cont);
  if (seccion === "biblioteca") return vistaBiblioteca(cont);
  if (seccion === "v" && id) return vistaDetalle(cont, id);
  if (seccion === "metricas") return vistaMetricas(cont, id);
  if (seccion === "pipeline") return vistaPipeline(cont);
  if (seccion === "funciona") return vistaFunciona(cont);
  if (seccion === "nueva") return vistaNueva(cont);
  if (seccion === "importar") return vistaImportar(cont);
  return vistaResumen(cont);
}
