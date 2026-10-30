/**
 * PANEL DE VIDEOS (lógica pura): el modelo de datos de data/videos.json, su saneado, buscar ideas parecidas, resumen del mes, series por semana,
 * ranking de lo que funciona (guardados, compartidos y acciones de negocio, no solo vistas) y la importación / exportación por CSV.
 * Sin base de datos: todo son listas de objetos. El servidor (scripts/panel/videos.mjs) lo lee y lo escribe; el navegador solo lo muestra.
 * Las fechas son texto «AAAA-MM-DD»; las funciones que necesitan «hoy» lo reciben como parámetro (así se pueden probar).
 */

export const SERIES = ["estafas", "adivina_precio", "diario_fundador", "florida", "experimentos", "agente_semana", "propiedad_del_dia", "secretos_usa", "anatomia", "neuroanatomia", "neuroeconomia", "fisica_estructural", "otro"] as const;
export const SERIES_ETIQUETA: Record<string, string> = {
  estafas: "Estafas", adivina_precio: "Adivina el precio", diario_fundador: "Diario del fundador", florida: "Florida", experimentos: "Experimentos",
  agente_semana: "Agente de la semana", propiedad_del_dia: "Propiedad del día", secretos_usa: "Secretos de inversión en USA", anatomia: "Anatomía humana · curiosidades médicas", neuroanatomia: "Neuroanatomía en SINAPSIS", neuroeconomia: "Neuroeconomía en SINAPSIS", fisica_estructural: "Física estructural en SINAPSIS", otro: "Otro",
};
export const ESTADOS = ["idea", "guion", "grabado", "programado", "publicado"] as const;
export const ESTADOS_ETIQUETA: Record<string, string> = { idea: "💡 Idea", guion: "📝 Guion", grabado: "🎬 Grabado", programado: "🗓️ Programado", publicado: "✅ Publicado" };
export const PLATAFORMAS = ["instagram", "tiktok", "facebook", "youtube"] as const;
export const PLATAFORMAS_ETIQUETA: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", youtube: "YouTube" };
export const TIPOS_ACCION = ["registro_agente", "solicitud_florida", "visita_codigo_imn", "contacto_whatsapp", "otro"] as const;
export const TIPOS_ACCION_ETIQUETA: Record<string, string> = { registro_agente: "Registro de agente", solicitud_florida: "Solicitud Florida", visita_codigo_imn: "Visita con código IMN", contacto_whatsapp: "Contacto por WhatsApp", otro: "Otra acción" };

export type Publicacion = { plataforma: string; url: string; fecha: string };
export type Metrica = { fecha_medicion: string; plataforma: string; vistas: number; me_gusta: number; comentarios: number; guardados: number; compartidos: number; retencion_pct: number | null };
export type Accion = { tipo: string; cantidad: number; fecha: string; notas: string };
export type Video = {
  id: string; titulo: string; serie: string; guion: string; gancho: string; duracion_seg: number; voz_usada: string; instrucciones_voz: string;
  ruta_archivo: string; ruta_miniatura: string; estado: string; fecha_publicacion: string; notas: string;
  publicaciones: Publicacion[]; metricas: Metrica[]; acciones: Accion[];
  creado: string; actualizado: string; origen: string; origen_clave: string;
};
export type BaseVideos = { version: 1; videos: Video[] };

// ───────────────────────────── saneado ─────────────────────────────
const txt = (x: unknown, max = 5000): string => String(x ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
const entero = (x: unknown): number => { const n = Math.round(Number(x)); return Number.isFinite(n) && n > 0 ? Math.min(n, 1e12) : 0; };
const dentro = <T extends string>(x: unknown, lista: readonly T[], def: T): T => (lista.includes(x as T) ? (x as T) : def);

/** Fecha «AAAA-MM-DD» válida (acepta también «DD/MM/AAAA» y una fecha ISO con hora); si no, «». */
export function fechaValida(x: unknown): string {
  const s = String(x ?? "").trim();
  let a: number, m: number, d: number;
  let r = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/.exec(s);
  if (r) { a = +r[1]; m = +r[2]; d = +r[3]; }
  else if ((r = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s))) { d = +r[1]; m = +r[2]; a = +r[3]; }
  else return "";
  const f = new Date(Date.UTC(a, m - 1, d));
  if (f.getUTCFullYear() !== a || f.getUTCMonth() !== m - 1 || f.getUTCDate() !== d) return "";
  return `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export const hoyISO = (d = new Date()): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const nuevoIdVideo = (): string => `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function normalizarMetrica(x: any, hoy = hoyISO()): Metrica {
  const ret = x?.retencion_pct;
  const r = ret === null || ret === undefined || ret === "" ? null : Number(ret);
  return {
    fecha_medicion: fechaValida(x?.fecha_medicion) || hoy,
    plataforma: dentro(x?.plataforma, ["", ...PLATAFORMAS] as readonly string[], ""),
    vistas: entero(x?.vistas), me_gusta: entero(x?.me_gusta), comentarios: entero(x?.comentarios), guardados: entero(x?.guardados), compartidos: entero(x?.compartidos),
    retencion_pct: r !== null && Number.isFinite(r) ? Math.max(0, Math.min(100, Math.round(r * 10) / 10)) : null,
  };
}
export const normalizarAccion = (x: any, hoy = hoyISO()): Accion => ({ tipo: dentro(x?.tipo, TIPOS_ACCION, "otro"), cantidad: Math.max(1, entero(x?.cantidad) || 1), fecha: fechaValida(x?.fecha) || hoy, notas: txt(x?.notas, 500) });
export const normalizarPublicacion = (x: any, hoy = hoyISO()): Publicacion => ({ plataforma: dentro(x?.plataforma, PLATAFORMAS, "instagram"), url: txt(x?.url, 500), fecha: fechaValida(x?.fecha) || hoy });

/** Un video con todos sus campos en regla (lo que falte o venga mal toma su valor por defecto). */
export function normalizarVideo(x: any, hoy = hoyISO()): Video {
  const ahora = new Date().toISOString();
  return {
    id: txt(x?.id, 60).replace(/[^A-Za-z0-9_-]/g, "") || nuevoIdVideo(),
    titulo: txt(x?.titulo, 200), serie: dentro(x?.serie, SERIES, "otro"), guion: txt(x?.guion, 20000), gancho: txt(x?.gancho, 400),
    duracion_seg: Math.round(Math.max(0, Number(x?.duracion_seg) || 0) * 10) / 10, voz_usada: txt(x?.voz_usada, 200), instrucciones_voz: txt(x?.instrucciones_voz, 3000),
    ruta_archivo: txt(x?.ruta_archivo, 300), ruta_miniatura: txt(x?.ruta_miniatura, 300),
    estado: dentro(x?.estado, ESTADOS, "idea"), fecha_publicacion: fechaValida(x?.fecha_publicacion), notas: txt(x?.notas, 3000),
    publicaciones: (Array.isArray(x?.publicaciones) ? x.publicaciones : []).slice(0, 40).map((p: any) => normalizarPublicacion(p, hoy)),
    metricas: (Array.isArray(x?.metricas) ? x.metricas : []).slice(0, 500).map((m: any) => normalizarMetrica(m, hoy)),
    acciones: (Array.isArray(x?.acciones) ? x.acciones : []).slice(0, 500).map((a: any) => normalizarAccion(a, hoy)),
    creado: txt(x?.creado, 40) || ahora, actualizado: txt(x?.actualizado, 40) || ahora,
    origen: dentro(x?.origen, ["manual", "generador", "importado", "carpeta"] as const, "manual"), origen_clave: txt(x?.origen_clave, 40),
  };
}

export const normalizarBase = (x: any): BaseVideos => ({ version: 1, videos: (Array.isArray(x?.videos) ? x.videos : []).map((v: any) => normalizarVideo(v)) });

export function validarVideo(v: Video): string[] {
  const e: string[] = [];
  if (!v.titulo) e.push("Escribe un título.");
  if (v.estado === "publicado" && !v.fecha_publicacion && !v.publicaciones.length) e.push("Un video publicado necesita la fecha de publicación (o al menos una publicación con su fecha).");
  return e;
}

/** Un video «generado» por el sistema: crea el registro con estado «grabado» (guion, voz e instrucciones usadas). */
export function videoDesdeAnimacion(anim: { titulo?: string; duracion?: number; escenas?: { voz?: string; vozOff?: string }[] }, o: { voz?: string; instrucciones?: string; ruta_archivo?: string; ruta_miniatura?: string; estado?: string } = {}): Video {
  const frases = (anim.escenas ?? []).map((e) => String(e.voz ?? e.vozOff ?? "").replace(/\*/g, "").replace(/\s+/g, " ").trim()).filter(Boolean);
  const titulo = txt(anim.titulo || "Video sin título", 200);
  const serie = /estafa/i.test(titulo) ? "estafas" : /adivina|cu[aá]nto cuesta/i.test(titulo) ? "adivina_precio" : /florida/i.test(titulo) ? "florida" : /experiment/i.test(titulo) ? "experimentos" : /agente/i.test(titulo) ? "agente_semana" : /propiedad del d[ií]a/i.test(titulo) ? "propiedad_del_dia" : /diario|fundador/i.test(titulo) ? "diario_fundador" : "otro";
  return normalizarVideo({
    titulo, serie, guion: frases.join("\n"), gancho: (frases[0] ?? "").split(/(?<=[.!?])\s/)[0], duracion_seg: anim.duracion ?? 0, voz_usada: o.voz ?? "", instrucciones_voz: o.instrucciones ?? "",
    ruta_archivo: o.ruta_archivo ?? "", ruta_miniatura: o.ruta_miniatura ?? "", estado: o.estado ?? "grabado", origen: "generador", origen_clave: huellaTexto(`${titulo}\u0001${frases.join("\n")}`),
  });
}

/** hash corto de 8 hex (FNV-1a) para reconocer «el mismo video» al volver a renderizarlo */
export function huellaTexto(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Copia un video como idea nueva: conserva serie, gancho, guion y voz; sin archivo, fechas, publicaciones, métricas ni acciones. */
export function duplicarComoIdea(v: Video): Video {
  return normalizarVideo({ titulo: `${v.titulo} (nueva versión)`, serie: v.serie, guion: v.guion, gancho: v.gancho, voz_usada: v.voz_usada, instrucciones_voz: v.instrucciones_voz, notas: v.notas, estado: "idea", origen: "manual" });
}

// ───────────────────────────── métricas ─────────────────────────────
export type Totales = { vistas: number; me_gusta: number; comentarios: number; guardados: number; compartidos: number; acciones: number };
const CERO: Totales = { vistas: 0, me_gusta: 0, comentarios: 0, guardados: 0, compartidos: 0, acciones: 0 };

/** Lo que tiene hoy el video: la última medición de cada plataforma, sumadas (las mediciones sin plataforma cuentan como «total»). */
export function metricasActuales(v: Video): Totales {
  const ultima = new Map<string, Metrica>();
  for (const m of [...v.metricas].sort((a, b) => a.fecha_medicion.localeCompare(b.fecha_medicion))) ultima.set(m.plataforma, m);
  const t: Totales = { ...CERO };
  for (const m of ultima.values()) { t.vistas += m.vistas; t.me_gusta += m.me_gusta; t.comentarios += m.comentarios; t.guardados += m.guardados; t.compartidos += m.compartidos; }
  t.acciones = v.acciones.reduce((a, x) => a + x.cantidad, 0);
  return t;
}

const sumar = (a: Totales, b: Totales): Totales => ({ vistas: a.vistas + b.vistas, me_gusta: a.me_gusta + b.me_gusta, comentarios: a.comentarios + b.comentarios, guardados: a.guardados + b.guardados, compartidos: a.compartidos + b.compartidos, acciones: a.acciones + b.acciones });
const mesDe = (f: string): string => f.slice(0, 7);

/** Fecha que se toma como «cuándo es» el video: la de publicación; si no, la de creación. */
export const fechaDelVideo = (v: Video): string => v.fecha_publicacion || v.publicaciones[0]?.fecha || v.creado.slice(0, 10);

export type ResumenMes = { mes: string; publicados: number; mes_totales: Totales; acciones_mes: number; todo: Totales; videos: number };

/** Resumen del mes de `hoy`: videos publicados este mes y sus vistas / guardados / compartidos, y las acciones de negocio registradas en el mes (de cualquier video). */
export function resumenMes(videos: Video[], hoy: string): ResumenMes {
  const mes = mesDe(hoy);
  const delMes = videos.filter((v) => v.estado === "publicado" && mesDe(fechaDelVideo(v)) === mes);
  const mes_totales = delMes.reduce((a, v) => sumar(a, { ...metricasActuales(v), acciones: 0 }), { ...CERO });
  const acciones_mes = videos.reduce((a, v) => a + v.acciones.filter((x) => mesDe(x.fecha) === mes).reduce((s, x) => s + x.cantidad, 0), 0);
  return { mes, publicados: delMes.length, mes_totales, acciones_mes, todo: videos.reduce((a, v) => sumar(a, metricasActuales(v)), { ...CERO }), videos: videos.length };
}

/** Lunes de la semana de una fecha «AAAA-MM-DD». */
export function inicioSemana(f: string): string {
  const [a, m, d] = f.split("-").map(Number);
  const x = new Date(Date.UTC(a, m - 1, d));
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
}

export type SemanaDato = { semana: string; vistas: number; acciones: number; videos: number };

/** Últimas `n` semanas (lunes a domingo): vistas de los videos según la semana en que se publicaron y acciones de negocio según la semana en que ocurrieron. */
export function serieSemanal(videos: Video[], hoy: string, n = 12): SemanaDato[] {
  const fin = inicioSemana(hoy);
  const semanas: SemanaDato[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const [a, m, d] = fin.split("-").map(Number);
    const x = new Date(Date.UTC(a, m - 1, d - 7 * i));
    semanas.push({ semana: x.toISOString().slice(0, 10), vistas: 0, acciones: 0, videos: 0 });
  }
  const idx = new Map(semanas.map((s, i) => [s.semana, i]));
  for (const v of videos) {
    if (v.estado === "publicado") {
      const i = idx.get(inicioSemana(fechaDelVideo(v)));
      if (i !== undefined) { semanas[i].vistas += metricasActuales(v).vistas; semanas[i].videos++; }
    }
    for (const x of v.acciones) { const i = idx.get(inicioSemana(x.fecha)); if (i !== undefined) semanas[i].acciones += x.cantidad; }
  }
  return semanas;
}

// ───────────────────────────── qué funciona ─────────────────────────────
export type Clase = "convierte" | "interesa" | "entretiene";
export type FilaRanking = { clave: string; etiqueta: string; videos: number; vistas: number; guardados: number; compartidos: number; acciones: number; interaccion: number; puntos: number; clase: Clase };

/**
 * Puntos = lo que de verdad importa: acciones de negocio ×50, compartidos ×5, guardados ×3 y las vistas casi nada (×0,002), por video.
 * Clase: «convierte» si trajo acciones de negocio; «interesa» si la gente guarda o comparte (≥ 2 % de las vistas); «entretiene» si solo suma vistas.
 */
function fila(clave: string, etiqueta: string, vs: Video[]): FilaRanking {
  const t = vs.reduce((a, v) => sumar(a, metricasActuales(v)), { ...CERO });
  const n = Math.max(1, vs.length);
  const interaccion = (t.guardados + t.compartidos) / Math.max(1, t.vistas);
  const clase: Clase = t.acciones > 0 ? "convierte" : interaccion >= 0.02 ? "interesa" : "entretiene";
  return { clave, etiqueta, videos: vs.length, vistas: t.vistas, guardados: t.guardados, compartidos: t.compartidos, acciones: t.acciones, interaccion, puntos: Math.round(((t.acciones * 50 + t.compartidos * 5 + t.guardados * 3 + t.vistas * 0.002) / n) * 10) / 10, clase };
}

const ORDEN_CLASE: Record<Clase, number> = { convierte: 0, interesa: 1, entretiene: 2 };
/** Primero lo que convierte, luego lo que interesa y al final lo que solo entretiene; dentro de cada clase, por puntos. */
const porResultados = (a: FilaRanking, b: FilaRanking): number => ORDEN_CLASE[a.clase] - ORDEN_CLASE[b.clase] || b.puntos - a.puntos;

/** Ranking de series (solo videos publicados). */
export function rankingSeries(videos: Video[]): FilaRanking[] {
  const pub = videos.filter((v) => v.estado === "publicado");
  return SERIES.map((s) => fila(s, SERIES_ETIQUETA[s], pub.filter((v) => v.serie === s))).filter((f) => f.videos > 0).sort(porResultados);
}

/** Ranking de ganchos: cada gancho distinto con los videos que lo usaron (publicados). */
export function rankingGanchos(videos: Video[], max = 15): FilaRanking[] {
  const por = new Map<string, Video[]>();
  for (const v of videos.filter((x) => x.estado === "publicado" && x.gancho)) { const k = normalizarTexto(v.gancho); por.set(k, [...(por.get(k) ?? []), v]); }
  return [...por.entries()].map(([k, vs]) => fila(k, vs[0].gancho, vs)).sort(porResultados).slice(0, max);
}

// ───────────────────────────── evitar repetición ─────────────────────────────
export const normalizarTexto = (s: string): string => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const VACIAS = new Set(["el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al", "y", "o", "en", "a", "con", "por", "para", "que", "es", "se", "su", "sus", "lo", "mi", "tu", "como", "este", "esta", "esto"]);
const palabrasClave = (s: string): string[] => normalizarTexto(s).split(" ").filter((w) => w.length > 2 && !VACIAS.has(w));

/** Parecido entre dos textos (0–1): mezcla de palabras clave en común y de pedazos de 3 letras compartidos (tolera plurales y erratas). */
export function similitud(a: string, b: string): number {
  const A = palabrasClave(a), B = palabrasClave(b);
  if (!A.length || !B.length) return 0;
  const sa = new Set(A), sb = new Set(B);
  const inter = [...sa].filter((w) => sb.has(w)).length;
  const jaccard = inter / (sa.size + sb.size - inter);
  const contenido = inter / Math.min(sa.size, sb.size);
  const tri = (s: string): Set<string> => { const t = normalizarTexto(s).replace(/ /g, "_"); const r = new Set<string>(); for (let i = 0; i + 3 <= t.length; i++) r.add(t.slice(i, i + 3)); return r; };
  const ta = tri(a), tb = tri(b);
  const ti = [...ta].filter((x) => tb.has(x)).length;
  const dice = (2 * ti) / Math.max(1, ta.size + tb.size);
  return Math.max(jaccard, contenido * 0.85, dice * 0.9);
}

export type Parecido = { video: Video; similitud: number; motivo: "título" | "gancho"; dias: number };

export function diasEntre(desde: string, hasta: string): number {
  const f = (s: string): number => { const [a, m, d] = s.split("-").map(Number); return Date.UTC(a, m - 1, d); };
  return Math.round((f(hasta) - f(desde)) / 86400000);
}

/** Videos de los últimos `dias` días (por fecha de publicación, o de creación si aún no salió) con título o gancho parecido al nuevo. */
export function buscarParecidos(nuevo: { titulo?: string; gancho?: string; id?: string }, videos: Video[], hoy: string, { dias = 60, umbral = 0.5 }: { dias?: number; umbral?: number } = {}): Parecido[] {
  const r: Parecido[] = [];
  for (const v of videos) {
    if (nuevo.id && v.id === nuevo.id) continue;
    const d = diasEntre(fechaDelVideo(v), hoy);
    if (d > dias || d < -dias) continue;
    const st = nuevo.titulo ? similitud(nuevo.titulo, v.titulo) : 0;
    const sg = nuevo.gancho && v.gancho ? similitud(nuevo.gancho, v.gancho) : 0;
    if (Math.max(st, sg) >= umbral) r.push({ video: v, similitud: Math.round(Math.max(st, sg) * 100) / 100, motivo: sg > st ? "gancho" : "título", dias: d });
  }
  return r.sort((a, b) => b.similitud - a.similitud);
}

// ───────────────────────────── CSV ─────────────────────────────
export const COLUMNAS_IMPORTAR = ["titulo", "serie", "plataforma", "url", "fecha", "vistas", "guardados", "compartidos"];
export const CSV_EJEMPLO = [
  COLUMNAS_IMPORTAR.join(","),
  'Estafas con propiedades: 3 señales para no caer,estafas,instagram,https://www.instagram.com/reel/ejemplo1/,2026-09-03,18400,320,145',
  'Adivina el precio de esta propiedad,adivina_precio,tiktok,https://www.tiktok.com/@imnoba/video/ejemplo2,2026-09-10,52300,610,98',
  '"Diario del fundador, semana 4",diario_fundador,youtube,https://www.youtube.com/shorts/ejemplo3,2026-09-17,7600,88,12',
].join("\n");

/** Lee un CSV (coma, punto y coma o tabulador; comillas dobles; BOM). Devuelve las filas como objetos con las cabeceras en minúscula y sin tildes. */
export function parsearCSV(texto: string): { columnas: string[]; filas: Record<string, string>[]; errores: string[] } {
  const t = String(texto ?? "").replace(/^﻿/, "");
  const primera = t.split(/\r?\n/, 1)[0] ?? "";
  const sep = [",", ";", "\t"].map((c) => [c, (primera.match(new RegExp(c === "\t" ? "\t" : `\\${c}`, "g")) ?? []).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const filas: string[][] = [];
  let campo = "", fila: string[] = [], q = false;
  const errores: string[] = [];
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { campo += '"'; i++; } else q = false; } else campo += c; }
    else if (c === '"' && campo === "") q = true;
    else if (c === sep) { fila.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; fila.push(campo); campo = ""; if (fila.some((x) => x.trim())) filas.push(fila); fila = []; }
    else campo += c;
  }
  if (q) errores.push("Hay unas comillas sin cerrar: revisa el archivo.");
  fila.push(campo);
  if (fila.some((x) => x.trim())) filas.push(fila);
  if (!filas.length) return { columnas: [], filas: [], errores: ["El archivo está vacío."] };
  const columnas = filas[0].map((c) => normalizarTexto(c).replace(/ /g, "_"));
  return { columnas, filas: filas.slice(1).map((f) => Object.fromEntries(columnas.map((c, i) => [c, (f[i] ?? "").trim()]))), errores };
}

const ALIAS_PLATAFORMA: Record<string, string> = { instagram: "instagram", ig: "instagram", insta: "instagram", reels: "instagram", tiktok: "tiktok", tik_tok: "tiktok", tt: "tiktok", facebook: "facebook", fb: "facebook", youtube: "youtube", yt: "youtube", shorts: "youtube" };

/** Número entero de un CSV: acepta «18400», «18.400», «18,400» y «1 200»; vacío = 0; negativo o con letras = error (null). */
export function enteroCSV(x: string): number | null {
  const s = String(x ?? "").trim();
  if (s === "") return 0;
  if (/^\d+$/.test(s)) return Number(s);
  if (/^\d{1,3}([.,\s]\d{3})+$/.test(s)) return Number(s.replace(/[.,\s]/g, ""));
  return null;
}

export type FilaImportada = { fila: number; ok: boolean; errores: string[]; avisos: string[]; video: Video | null; duplicada: boolean };

/**
 * Valida cada fila del CSV y arma el video que se crearía (estado «publicado», con su publicación y una medición de hoy).
 * Errores: título vacío, serie o plataforma desconocidas, URL que no empieza por http, fecha inválida, números con letras o negativos.
 * Aviso (no error): el enlace ya existe en la base (`urlsExistentes`) o está repetido dentro del archivo → `duplicada`.
 */
export function validarFilasCSV(filas: Record<string, string>[], hoy: string, urlsExistentes: Set<string> = new Set()): FilaImportada[] {
  const vistas = new Set<string>();
  const serieDe = (s: string): string | null => { const n = normalizarTexto(s).replace(/ /g, "_"); if (!n) return "otro"; if ((SERIES as readonly string[]).includes(n)) return n; const e = Object.entries(SERIES_ETIQUETA).find(([, l]) => normalizarTexto(l).replace(/ /g, "_") === n); return e ? e[0] : null; };
  return filas.map((f, i): FilaImportada => {
    const errores: string[] = [], avisos: string[] = [];
    const n = i + 2; // fila del archivo (la 1 es la cabecera)
    if (!f.titulo) errores.push("Falta el título.");
    const serie = serieDe(f.serie ?? "");
    if (serie === null) errores.push(`Serie «${f.serie}» no reconocida (usa: ${SERIES.join(", ")}).`);
    const plataforma = ALIAS_PLATAFORMA[normalizarTexto(f.plataforma ?? "").replace(/ /g, "_")];
    if (!plataforma) errores.push(`Plataforma «${f.plataforma ?? ""}» no reconocida (usa: ${PLATAFORMAS.join(", ")}).`);
    const url = (f.url ?? "").trim();
    if (url && !/^https?:\/\/\S+$/i.test(url)) errores.push("El enlace debe empezar por http:// o https://");
    const fecha = fechaValida(f.fecha);
    if (!fecha) errores.push(`Fecha «${f.fecha ?? ""}» no válida (usa AAAA-MM-DD o DD/MM/AAAA).`);
    const num: Record<string, number> = {};
    for (const c of ["vistas", "guardados", "compartidos", "me_gusta", "comentarios"]) { const v = enteroCSV(f[c] ?? ""); if (v === null) errores.push(`«${c}» debe ser un número entero (no negativo): «${f[c]}».`); else num[c] = v; }
    if (num.guardados > num.vistas && num.vistas > 0) avisos.push("Hay más guardados que vistas: ¿están bien las columnas?");
    const duplicada = Boolean(url) && (urlsExistentes.has(url) || vistas.has(url));
    if (duplicada) avisos.push("Este enlace ya existe: se omitirá.");
    if (url) vistas.add(url);
    if (errores.length) return { fila: n, ok: false, errores, avisos, video: null, duplicada };
    const video = normalizarVideo({
      titulo: f.titulo, serie, estado: "publicado", fecha_publicacion: fecha, origen: "importado",
      publicaciones: [{ plataforma, url, fecha }],
      metricas: [{ fecha_medicion: hoy, plataforma, vistas: num.vistas, guardados: num.guardados, compartidos: num.compartidos, me_gusta: num.me_gusta, comentarios: num.comentarios }],
    }, hoy);
    return { fila: n, ok: true, errores, avisos, video, duplicada };
  });
}

const celda = (x: unknown): string => { const s = String(x ?? ""); return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

/** Todo a CSV: una fila por publicación (las 8 primeras columnas son las de la importación, así que el archivo se puede volver a importar), más estado, ganchos y acciones. */
export function aCSV(videos: Video[]): string {
  const cab = [...COLUMNAS_IMPORTAR, "me_gusta", "comentarios", "retencion_pct", "estado", "acciones", "gancho", "id"];
  const filas: string[] = [cab.join(",")];
  for (const v of videos) {
    const pubs = v.publicaciones.length ? v.publicaciones : [{ plataforma: "", url: "", fecha: v.fecha_publicacion }];
    for (const p of pubs) {
      const m = metricasActuales({ ...v, metricas: v.metricas.filter((x) => !p.plataforma || !x.plataforma || x.plataforma === p.plataforma) });
      const ret = [...v.metricas].reverse().find((x) => x.retencion_pct !== null)?.retencion_pct ?? "";
      filas.push([v.titulo, v.serie, p.plataforma, p.url, p.fecha || v.fecha_publicacion, m.vistas, m.guardados, m.compartidos, m.me_gusta, m.comentarios, ret, v.estado, m.acciones, v.gancho, v.id].map(celda).join(","));
    }
  }
  return filas.join("\n") + "\n";
}
