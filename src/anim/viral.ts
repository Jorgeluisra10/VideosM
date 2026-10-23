/**
 * DIRECTOR VIRAL: de UNA FRASE de idea a un reel completo. La IA actúa de guionista y director de arte en una sola llamada barata (JSON compacto):
 * escribe la locución (VOZ_OFF) de cada escena, decide su duración y elige una de 10 plantillas profesionales de reel (gancho cinético, número gigante,
 * versus, barras, línea de tendencia, pasos, lista, ruta de metro, ciudad que crece y cierre con llamada a la acción). Un motor prefabricado
 * (src/viral/) dibuja cada plantilla con texto cinético, contadores, gráficas e iconos: la IA nunca escribe código ni coordenadas.
 *
 * Aquí vive todo lo PURO (sin Node ni navegador): leer la idea, vocabulario, prompt cacheable, saneado de lo que devuelve la IA,
 * ritmo y duraciones, fondos alternados, SFX, locución, ensamblado y costo.
 */
import { modeloPorId, tokensDeTexto } from "./costos";
import { coloresEstudio, mezclar, oscurecer, type ColoresEstudio } from "./estudio";
import type { EscenaEstudioGuion } from "./estudio";
import type { Animacion, EventoSfx } from "./tipos";

/* ───────────── vocabulario cerrado ───────────── */

export const TIPOS_VIRAL = ["HOOK", "NUM", "VS", "BARS", "LINE", "STEPS", "LIST", "ROUTE", "SKYLINE", "CTA"] as const;
export type TipoViral = (typeof TIPOS_VIRAL)[number];
export const FONDOS_VIRAL = ["dark", "gold", "light"] as const;
export type FondoViral = (typeof FONDOS_VIRAL)[number];

/** Iconos que la IA puede pedir (lucide, nombres sin prefijo). */
export const ICONOS_VIRAL = [
  "casa", "edificio", "torre", "pin", "mapa", "auto", "velocimetro", "tendencia-alza", "tendencia-baja", "barras", "linea-grafica", "alcancia", "billete", "monedas",
  "porcentaje", "banco", "acuerdo", "contrato", "reloj", "telefono", "chat", "globo", "estrella", "premio", "verificado", "brillo", "corona", "tren", "bus", "cohete",
  "diana", "idea", "candado", "seguridad", "llave", "dolar", "colegio", "compras", "arboles", "calendario-ok", "etiqueta", "dinero-mano", "wifi", "sol", "tienda", "firma", "check", "alerta", "rayo",
] as const;
const ICONOS_BASICOS = new Set(["check", "alerta", "rayo", "cruz"]);
/** Nombre real que entiende dibujarIcono(): «lu-casa» para lucide y el básico para check/alerta/rayo. */
export const iconoReal = (n: string): string => (ICONOS_BASICOS.has(n) ? n : `lu-${n}`);

export type LadoVs = { l: string; n: string; ic: string };
export type DatosViral = {
  /** titular (HOOK/CTA) o encabezado de la escena (el resto) */
  h: string;
  /** palabra destacada del titular */
  w: string;
  sub: string;
  ic: string;
  /** NUM */
  num: { n: string; u: string; pre: string; l: string } | null;
  /** VS */
  vs: { a: LadoVs; b: LadoVs; op: ">" | "<" | "=" } | null;
  /** BARS */
  bars: { l: string; v: number }[];
  barsU: string;
  hi: number;
  /** LINE */
  line: { pts: number[]; l0: string; l1: string; end: string } | null;
  /** STEPS (con icono) y LIST (solo texto) */
  items: { l: string; ic: string }[];
  /** ROUTE */
  stops: string[];
  end: string;
};

export type EscenaViral = { n: number; t: TipoViral; voz: string; dur: number } & DatosViral;

/** Escena tal como se guarda en animacion.json. */
export type EscenaViralGuardada = EscenaViral & {
  modo: "VIRAL";
  tema: "oscuro" | "claro";
  bg: FondoViral;
  /** 0…1: cuánto se comprime la animación cuando la escena dura menos de lo ideal */
  ritmo: number;
  /** posición en el video (para la barra de progreso) */
  total: number;
  sfx?: EventoSfx[];
  inicio: number;
  fin: number;
  texto: string;
};

/* ───────────── tiempos compartidos entre el motor visual y el sonido ───────────── */

/** Retrasos (s) de cada plantilla a ritmo normal; el motor y los SFX los multiplican por `ritmo`. */
export const TV = {
  titulo: 0.15,
  /** n-ésimo elemento de una lista/pasos */
  item: (i: number): number => 0.75 + 0.62 * i,
  barra: (i: number): number => 0.7 + 0.2 * i,
  barraDur: 0.9,
  contar: 0.6,
  contarDur: 1.5,
  linea: 0.7,
  lineaDur: 2.1,
  ruta: 0.6,
  rutaDur: 2.8,
  ciudad: 0.5,
  etiqueta: 1.9,
} as const;

/** Segundos que necesita cada plantilla para mostrar todo con calma (a ritmo 1). */
export function duracionIdeal(e: Pick<EscenaViral, "t" | "items" | "bars" | "stops">): number {
  switch (e.t) {
    case "HOOK": return 2.6;
    case "NUM": return TV.contar + TV.contarDur + 0.9;
    case "VS": return 3.6;
    case "BARS": return TV.barra(Math.max(0, e.bars.length - 1)) + TV.barraDur + 0.9;
    case "LINE": return TV.linea + TV.lineaDur + 0.9;
    case "STEPS": case "LIST": return TV.item(Math.max(0, e.items.length - 1)) + 1.1;
    case "ROUTE": return TV.ruta + TV.rutaDur + 0.7;
    case "SKYLINE": return TV.etiqueta + 1.1;
    default: return 3.2;
  }
}

/* ───────────── la idea ───────────── */

export type ResultadoIdea = { formato: "idea"; idea: string; duracion: number; escenasObjetivo: number; errores: string[]; avisos: string[]; caracteres: number };

/** ¿El texto es una idea suelta (sin bloques [ESCENA …] ni [CONFIG])? Los guiones en bloques siguen funcionando igual. */
export const esIdea = (texto: string): boolean => !/^\s*\[\s*(ESCENA|CONFIG)\b/im.test(texto);

export const DURACION_DEFECTO = 32;
/** Escenas objetivo para una duración: ≈ una cada 3,6 s (ritmo de reel). */
export const escenasParaDuracion = (s: number): number => Math.min(18, Math.max(5, Math.round(s / 3.6)));

/**
 * Lee la idea: una frase (o un párrafo corto). Si dice «de 30 segundos» / «1 minuto» se respeta esa duración (15–75 s); si no, ≈ 32 s.
 */
export function parsearIdea(texto: string): ResultadoIdea {
  const idea = texto.replace(/\r/g, "").replace(/\s+/g, " ").trim();
  const errores: string[] = [];
  const avisos: string[] = [];
  if (idea.length < 8) errores.push("Escribe tu idea en una frase: qué quieres que cuente el video (por ejemplo «Por qué el metro de Bogotá valoriza las propiedades cerca de las estaciones»).");
  if (idea.length > 1200) errores.push("La idea es demasiado larga: resúmela en una o dos frases (máximo 1.200 caracteres).");
  let duracion = DURACION_DEFECTO;
  const seg = idea.match(/(\d+(?:[.,]\d+)?)\s*(?:s\b|seg\b|segundos?)/i);
  const min = idea.match(/(\d+(?:[.,]\d+)?)\s*(?:min\b|minutos?)/i);
  if (min) duracion = Number(min[1].replace(",", ".")) * 60;
  else if (seg) duracion = Number(seg[1].replace(",", "."));
  if (duracion < 15 || duracion > 75) {
    if (min || seg) avisos.push(`La duración pedida (${Math.round(duracion)} s) se ajusta al rango de un reel: 15–75 s.`);
    duracion = Math.min(75, Math.max(15, duracion));
  }
  return { formato: "idea", idea, duracion: Math.round(duracion), escenasObjetivo: escenasParaDuracion(duracion), errores, avisos, caracteres: idea.length };
}

/* ───────────── saneado ───────────── */

const sinAcentos = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const clave = (s: unknown): string => sinAcentos(String(s ?? "")).trim().toUpperCase().replace(/[\s-]+/g, "_");
/** Recorta a `max` caracteres SIN partir una palabra por la mitad. */
function recortar(s: string, max: number): string {
  if (s.length <= max) return s;
  const corte = s.lastIndexOf(" ", max);
  return (corte > max * 0.45 ? s.slice(0, corte) : s.slice(0, max)).replace(/[\s,;:–-]+$/, "");
}
const limpio = (v: unknown, max: number): string => recortar(String(v ?? "").replace(/\s+/g, " ").trim(), max);
const mayus = (v: unknown, max: number): string => limpio(v, max).toUpperCase();
const palabras = (s: string): number => s.split(/\s+/).filter(Boolean).length;

function elegirTipo(v: unknown): TipoViral | null {
  const k = clave(v);
  return (TIPOS_VIRAL as readonly string[]).includes(k) ? (k as TipoViral) : null;
}

/** Texto que parece un número: «35», «1.200», «0,5» → sin símbolos raros (máx. 7 caracteres). */
const numero = (v: unknown, defecto = ""): string => {
  const s = String(v ?? "").replace(/[^\d.,]/g, "").slice(0, 7);
  return s || defecto;
};
/** «1.200» → 1200 · «0,5» → 0.5 · «3.5» → 3.5 (el punto con 3 decimales exactos se lee como millar). */
const aNumero = (s: string): number => {
  let t = s;
  if (t.includes(".") && t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  else t = t.replace(",", ".");
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
};

const ICONO_POR_TEXTO: [RegExp, string][] = [
  [/metro|tren|estaci|ferro|riel/, "tren"], [/bus\b|transmilenio|buses|ruta/, "bus"], [/edificio|torre|rascacielo/, "edificio"], [/casa|vivienda|apartament|inmueble|hogar|propiedad/, "casa"],
  [/carro|auto|veh[ií]culo|moto|camioneta/, "auto"], [/velocidad|r[aá]pid|veloz|tr[aá]fico|trancon|colapso/, "velocimetro"], [/ahorr|alcanc/, "alcancia"], [/valoriz|plusval|crece|crecimiento|sube|aument|inversi|rentab/, "tendencia-alza"],
  [/cae|baja|pierde|p[eé]rdida|desvaloriz/, "tendencia-baja"], [/precio|d[oó]lar|usd/, "dolar"], [/dinero|plata|pesos|millones|costo|cuesta|pago|comisi/, "billete"], [/gratis|oferta|descuento|promo/, "etiqueta"],
  [/mapa|ciudad|zona|barrio|localidad/, "mapa"], [/ubicaci|direcci|cerca|lugar/, "pin"], [/tiempo|hora|minuto|rapid|ya\b|r[aá]pido/, "reloj"], [/segur|protec/, "seguridad"],
  [/contrato|escritura|legal|notar/, "contrato"], [/acuerdo|negocio|trato|cierre/, "acuerdo"], [/banco|cr[eé]dito|hipoteca|financi/, "banco"], [/colegio|universidad|educaci/, "colegio"],
  [/comercio|tienda|local|compras|centro comercial/, "tienda"], [/verde|parque|arbol|[aá]rbol|naturaleza/, "arboles"], [/whatsapp|chat|mensaje|contacto|escr[ií]b/, "chat"], [/llamar|tel[eé]fono|llama/, "telefono"],
  [/llave|entrega|estren/, "llave"], [/meta|objetivo|logro|exito|éxito/, "diana"], [/idea|plan|estrategia/, "idea"], [/premio|mejor|calidad/, "premio"], [/confianza|verificad|garant/, "verificado"],
  [/alerta|riesgo|peligro|cuidado/, "alerta"], [/cohete|despega|impulso|lanz/, "cohete"],
];
/** Icono que mejor encaja con un texto (para cuando la IA omite el icono o pide uno que no existe). */
export function iconoPorTexto(texto: string, defecto = "brillo"): string {
  const t = sinAcentos(texto).toLowerCase();
  return ICONO_POR_TEXTO.find(([re]) => re.test(t))?.[1] ?? defecto;
}
const icono = (v: unknown, contexto: string, defecto = "brillo"): string => {
  const k = String(v ?? "").trim().toLowerCase().replace(/^lu-/, "").replace(/[\s_]+/g, "-");
  return (ICONOS_VIRAL as readonly string[]).includes(k) ? k : iconoPorTexto(contexto, defecto);
};

/** Palabra a destacar: la pedida si está en el titular; si no, una cifra o la palabra más larga que no sea vacía. */
const VACIAS = new Set("el la los las un una unos unas de del al y o u en con por para que es fue se su sus lo le les mas muy como ya no si pero sin sobre entre hay son ser era tu te tus".split(" "));
function destacar(h: string, pedida: string): string {
  const ps = h.split(/\s+/).filter(Boolean);
  const n = (p: string) => sinAcentos(p).toLowerCase().replace(/[^\p{L}\p{N}%$+]/gu, "");
  const dada = ps.find((p) => n(p) === n(pedida));
  if (dada && n(pedida)) return dada;
  const cifra = ps.find((p) => /\d/.test(p));
  if (cifra) return cifra;
  const buenas = ps.filter((p) => !VACIAS.has(n(p)) && n(p).length >= 3);
  return (buenas.length ? buenas : ps).reduce((m, p) => (n(p).length > n(m).length ? p : m), ps[0] ?? "");
}

const VACIO: DatosViral = { h: "", w: "", sub: "", ic: "brillo", num: null, vs: null, bars: [], barsU: "", hi: -1, line: null, items: [], stops: [], end: "" };

/** Cifra más llamativa que aparece en un texto (para completar un NUM al que la IA no puso número). */
function primeraCifra(s: string): { n: string; u: string } | null {
  const m = s.match(/(\d[\d.,]*)\s*(%|veces|x|años|anos|km|m²|m2|millones|mil|minutos|horas|días|dias)?/i);
  return m ? { n: numero(m[1]), u: /%/.test(m[2] ?? "") ? "%" : m[2] && /millones/i.test(m[2]) ? "M" : m[2] && /m2|m²/i.test(m[2]) ? "m²" : (m[2] ?? "").slice(0, 4) } : null;
}

/**
 * Sanea UNA escena que devolvió la IA: tipo y valores dentro del vocabulario, textos recortados y en mayúsculas, iconos válidos,
 * datos completos para su plantilla (lo que falte se deduce de la locución). Nunca falla: devuelve también las correcciones hechas.
 */
export function normalizarEscenaViral(raw: any, n: number, vozDada?: string): { escena: EscenaViral; correcciones: string[] } {
  const corr: string[] = [];
  const r = raw && typeof raw === "object" ? raw : {};
  let t = elegirTipo(r.t ?? r.tipo ?? r.type ?? r.layout);
  if (!t) {
    corr.push(`Escena ${n}: el tipo «${limpio(r.t ?? r.tipo, 16)}» no existe; se usa HOOK`);
    t = "HOOK";
  }
  const voz = limpio(vozDada ?? r.voz ?? r.narracion ?? "", 260);
  const ctx = `${r.h ?? ""} ${voz}`;
  const d: DatosViral = { ...VACIO };
  d.h = mayus(r.h ?? r.headline?.text ?? r.headline, t === "HOOK" || t === "CTA" ? 40 : 34);
  if (!d.h) d.h = titularDeVoz(voz, t === "HOOK" || t === "CTA" ? 34 : 28);
  d.w = destacar(d.h, limpio(r.w ?? r.headline?.highlightWord, 24));
  d.sub = limpio(r.sub, 44);
  d.ic = icono(r.ic, ctx, t === "CTA" ? "cohete" : "brillo");

  switch (t) {
    case "NUM": {
      const num = r.num && typeof r.num === "object" ? r.num : r;
      let nn = numero(num.n);
      let u = limpio(num.u, 5);
      if (!nn) {
        const c = primeraCifra(ctx);
        if (c) { nn = c.n; u = u || c.u; corr.push(`Escena ${n}: NUM sin número; se toma «${c.n}» de la locución`); }
        else { nn = "100"; corr.push(`Escena ${n}: NUM sin número; se usa 100`); }
      }
      d.num = { n: nn, u, pre: limpio(num.pre, 2).replace(/[^+\-$~]/g, ""), l: mayus(num.l ?? r.l, 30) || d.h };
      if (d.num.l === d.h) d.h = "";
      break;
    }
    case "VS": {
      const lado = (o: any, defL: string): LadoVs => ({ l: mayus(o?.l ?? o?.label, 14) || defL, n: numero(o?.n ?? o?.counter, "0"), ic: icono(o?.ic, `${o?.l ?? ""}`, "estrella") });
      const a = lado(r.a ?? r.vs?.a, "ANTES"), b = lado(r.b ?? r.vs?.b, "AHORA");
      const opK = String(r.op ?? r.operator ?? "").replace(/&gt;/g, ">").replace(/&lt;/g, "<").trim();
      const na = aNumero(a.n), nb = aNumero(b.n);
      const op = opK === ">" || opK === "<" || opK === "=" ? (opK as ">" | "<" | "=") : na > nb ? ">" : na < nb ? "<" : "=";
      d.vs = { a, b, op };
      break;
    }
    case "BARS": {
      const lista: any[] = Array.isArray(r.bars) ? r.bars : [];
      d.bars = lista.slice(0, 6).map((b, i) => ({ l: mayus(b?.l ?? b?.label ?? `${i + 1}`, 10), v: Math.max(0, Number(String(b?.v ?? b?.value ?? 0).replace(",", ".")) || 0) })).filter((b) => b.l);
      if (d.bars.length < 2) { d.bars = [{ l: "ANTES", v: 30 }, { l: "AHORA", v: 70 }]; corr.push(`Escena ${n}: BARS sin datos suficientes; se usan dos barras de ejemplo`); }
      if (d.bars.every((b) => b.v === 0)) d.bars = d.bars.map((b, i) => ({ ...b, v: 20 + i * 20 }));
      d.barsU = limpio(r.u ?? r.barsU, 4);
      const hi = Number.isInteger(Number(r.hi)) ? Number(r.hi) : -1;
      d.hi = hi >= 0 && hi < d.bars.length ? hi : d.bars.reduce((m, b, i, a) => (b.v > a[m].v ? i : m), 0);
      break;
    }
    case "LINE": {
      const l = r.line && typeof r.line === "object" ? r.line : r;
      let pts: number[] = (Array.isArray(l.pts) ? l.pts : []).map((v: unknown) => Number(String(v).replace(",", "."))).filter((v: number) => Number.isFinite(v)).slice(0, 12);
      if (pts.length < 3) { pts = [20, 26, 24, 38, 52, 74]; corr.push(`Escena ${n}: LINE sin puntos suficientes; se usa una tendencia de ejemplo`); }
      d.line = { pts, l0: mayus(l.l0, 9), l1: mayus(l.l1, 9), end: limpio(l.end, 14) };
      break;
    }
    case "STEPS": {
      const lista: any[] = Array.isArray(r.items) ? r.items : [];
      d.items = lista.slice(0, 4).map((it) => ({ l: mayus(typeof it === "string" ? it : it?.l, 18), ic: icono(it?.ic, typeof it === "string" ? it : String(it?.l ?? ""), "brillo") })).filter((it) => it.l);
      if (d.items.length < 2) { d.items = [{ l: "PASO 1", ic: "idea" }, { l: "PASO 2", ic: "cohete" }, { l: "RESULTADO", ic: "premio" }]; corr.push(`Escena ${n}: STEPS sin pasos; se usan pasos de ejemplo`); }
      break;
    }
    case "LIST": {
      const lista: any[] = Array.isArray(r.items) ? r.items : [];
      d.items = lista.slice(0, 4).map((it) => ({ l: limpio(typeof it === "string" ? it : it?.l, 34), ic: "check" })).filter((it) => it.l);
      if (d.items.length < 2) { d.items = [{ l: "Sin complicaciones", ic: "check" }, { l: "Rápido y seguro", ic: "check" }, { l: "Resultados reales", ic: "check" }]; corr.push(`Escena ${n}: LIST sin elementos; se usan elementos de ejemplo`); }
      break;
    }
    case "ROUTE": {
      const lista: any[] = Array.isArray(r.stops) ? r.stops : [];
      d.stops = lista.slice(0, 5).map((s) => mayus(typeof s === "string" ? s : s?.l, 18)).filter(Boolean);
      if (d.stops.length < 3) { d.stops = ["ORIGEN", "CENTRO", "DESTINO"]; corr.push(`Escena ${n}: ROUTE sin estaciones suficientes; se usan tres de ejemplo`); }
      d.end = mayus(r.end, 22);
      break;
    }
    case "SKYLINE": {
      d.end = limpio(r.l ?? r.end, 14);
      if (!d.end) { const c = primeraCifra(ctx); d.end = c ? `+${c.n}${c.u}` : "+"; }
      break;
    }
    case "CTA": {
      if (!d.sub) d.sub = "";
      break;
    }
    default:
      break;
  }
  const dur = Math.min(8, Math.max(2, Number(String(r.dur ?? "").replace(",", ".")) || 3.5));
  return { escena: { n, t, voz, dur, ...d }, correcciones: corr };
}

/** Titular de emergencia a partir de la locución: primeras palabras en mayúsculas. */
function titularDeVoz(voz: string, max: number): string {
  const f = voz.replace(/^[¿¡"«“\s]+/, "").replace(/[?!.…,;:"»”]+$/g, "").toUpperCase();
  if (f.length <= max) return f || "IMNOBA";
  let s = "";
  for (const p of f.split(" ")) { if ((s + " " + p).trim().length > max) break; s = (s + " " + p).trim(); }
  return s || f.slice(0, max);
}

/* ───────────── fondos alternados, ritmo y SFX ───────────── */

const FONDO_PREFERIDO: Record<TipoViral, FondoViral> = { HOOK: "dark", NUM: "gold", VS: "dark", BARS: "light", LINE: "dark", STEPS: "light", LIST: "dark", ROUTE: "dark", SKYLINE: "light", CTA: "gold" };

/** Asigna un fondo a cada escena: el que prefiere su plantilla, cambiando el de las vecinas iguales para que el ritmo visual nunca se repita. */
export function asignarFondos(tipos: TipoViral[]): FondoViral[] {
  const f: FondoViral[] = tipos.map((t) => FONDO_PREFERIDO[t]);
  const ciclo: FondoViral[] = ["dark", "light", "gold"];
  for (let i = 1; i < f.length; i++) {
    if (f[i] !== f[i - 1]) continue;
    // CTA siempre dorado: se cambia la anterior; el resto toma el siguiente fondo del ciclo que no choque con vecinas
    if (tipos[i] === "CTA" && tipos[i - 1] !== "HOOK") { f[i - 1] = ciclo.find((c) => c !== f[i] && c !== f[i - 2]) ?? "dark"; continue; }
    f[i] = ciclo.find((c) => c !== f[i - 1] && c !== f[i + 1] && !(tipos[i] === "CTA" && c !== "gold")) ?? ciclo[(ciclo.indexOf(f[i]) + 1) % 3];
  }
  if (f.length) f[0] = "dark";
  return f;
}

/** Efectos de sonido automáticos sincronizados con lo que hace cada plantilla (tiempos escalados por el ritmo de la escena). */
export function sfxViral(e: Pick<EscenaViral, "t" | "items" | "bars" | "stops" | "dur">, ritmo: number): EventoSfx[] {
  const s = (x: number): number => x * ritmo;
  const L: EventoSfx[] = [{ t: 0.04, tipo: "whoosh", vol: 0.16 }];
  const A = (t: number, tipo: EventoSfx["tipo"], vol = 0.15): void => { L.push({ t, tipo, vol }); };
  switch (e.t) {
    case "HOOK": A(s(0.32), "thud", 0.2); break;
    case "NUM": A(s(TV.contar), "tick", 0.12); A(s(TV.contar + TV.contarDur), "ding", 0.18); break;
    case "VS": A(s(0.9), "tick", 0.12); A(s(2.0), "ding", 0.18); break;
    case "BARS": e.bars.forEach((_, i) => A(s(TV.barra(i) + 0.25), "pop", 0.13)); A(s(TV.barra(e.bars.length - 1) + TV.barraDur), "ding", 0.16); break;
    case "LINE": A(s(TV.linea), "zap", 0.1); A(s(TV.linea + TV.lineaDur), "ding", 0.18); break;
    case "STEPS": case "LIST": e.items.forEach((_, i) => A(s(TV.item(i)), "pop", 0.14)); break;
    case "ROUTE": e.stops.forEach((_, i) => A(s(TV.ruta + (TV.rutaDur * (i + 0.5)) / e.stops.length), "tick", 0.12)); A(s(TV.ruta + TV.rutaDur), "ding", 0.18); break;
    case "SKYLINE": A(s(TV.ciudad + 0.2), "thud", 0.14); A(s(TV.etiqueta), "ding", 0.18); break;
    case "CTA": A(s(0.5), "ding", 0.2); A(s(1.1), "pop", 0.15); break;
  }
  return L.filter((x) => x.t < e.dur - 0.08).sort((a, b) => a.t - b.t);
}

/* ───────────── ensamblado ───────────── */

export type ContextoViral =
  | { modo: "idea"; paleta?: string; sfx?: boolean; marca?: string }
  | { modo: "bloques"; escenas: EscenaEstudioGuion[]; paleta?: string; sfx?: boolean };

const reloj = (s: number): string => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Texto para que el usuario grabe la locución: una línea por escena con su tiempo. */
export function locucionViral(escenas: { n: number; inicio: number; fin: number; voz: string }[], titulo = ""): string {
  const cuerpo = escenas.map((e) => `[ESCENA ${e.n} | ${reloj(e.inicio)}-${reloj(e.fin)}]\n${e.voz || "(sin locución)"}`).join("\n\n");
  return `${titulo ? `${titulo}\n${"=".repeat(Math.min(60, titulo.length))}\n\n` : ""}${cuerpo}\n\n⚠️ Verifica las cifras y los datos antes de publicar: son ilustrativos salvo los que tú diste en la idea.\n`;
}

/**
 * Une lo que devolvió la IA ({"titulo":…, "scenes":[…]}) con lo local. En modo IDEA la IA decide locución, duración y tipo de cada escena;
 * en modo BLOQUES los tiempos y la locución son los del guion y la IA solo elige la plantilla y sus datos.
 */
export function ensamblarViral(raw: any, ctx: ContextoViral): { anim: Animacion; correcciones: string[]; titulo: string; locucion: string; sinRespuesta: number[] } {
  const crudas: any[] = Array.isArray(raw?.scenes) ? raw.scenes : Array.isArray(raw?.escenas) ? raw.escenas : [];
  const correcciones: string[] = [];
  const sinRespuesta: number[] = [];
  const lista: (EscenaViral & { inicioFijo?: number; finFijo?: number; dirTxt: string })[] = [];

  if (ctx.modo === "idea") {
    crudas.slice(0, 24).forEach((c, i) => {
      const { escena, correcciones: cc } = normalizarEscenaViral(c, i + 1);
      correcciones.push(...cc);
      lista.push({ ...escena, dirTxt: escena.voz });
    });
  } else {
    ctx.escenas.forEach((e, k) => {
      const c = crudas.find((x) => Number(x?.id ?? x?.n) === e.n) ?? (crudas.length === ctx.escenas.length ? crudas[k] : undefined);
      if (!c) { sinRespuesta.push(e.n); correcciones.push(`Escena ${e.n}: la IA no la devolvió; se usa un gancho con su locución`); }
      const { escena, correcciones: cc } = normalizarEscenaViral(c ?? { t: k === 0 ? "HOOK" : k === ctx.escenas.length - 1 ? "CTA" : "HOOK" }, e.n, e.voz || e.direccion);
      correcciones.push(...cc);
      lista.push({ ...escena, dur: e.dur, inicioFijo: e.inicio, finFijo: e.fin, dirTxt: e.direccion || e.voz });
    });
  }

  // duraciones (idea): lo que dice la IA, pero nunca menos de lo que se tarda en decir la locución ni de lo mínimo de la plantilla
  let t = 0;
  const salida: EscenaViralGuardada[] = [];
  const fondos = asignarFondos(lista.map((e) => e.t));
  lista.forEach((e, i) => {
    const ideal = duracionIdeal(e);
    let dur = e.dur;
    if (ctx.modo === "idea") {
      const habla = palabras(e.voz) / 2.9 + 0.5;
      dur = Math.round(Math.min(9, Math.max(dur, habla, Math.min(ideal, 5.2), 2.2)) * 10) / 10;
    }
    const inicio = e.inicioFijo ?? Math.round(t * 100) / 100;
    const fin = e.finFijo ?? Math.round((inicio + dur) * 100) / 100;
    t = fin;
    const ritmo = Math.min(1, Math.max(0.55, (dur - 0.45) / ideal));
    const { inicioFijo: _a, finFijo: _b, dirTxt, ...resto } = e;
    const gu: EscenaViralGuardada = { ...resto, dur: Math.round((fin - inicio) * 100) / 100, modo: "VIRAL", tema: fondos[i] === "light" ? "claro" : "oscuro", bg: fondos[i], ritmo, total: 0, inicio, fin, texto: dirTxt };
    salida.push(gu);
  });
  const duracion = salida.length ? salida[salida.length - 1].fin : 0;
  const sfx = ctx.sfx !== false;
  for (const e of salida) {
    e.total = duracion;
    if (sfx) e.sfx = sfxViral(e, e.ritmo);
  }
  const titulo = limpio(raw?.titulo ?? raw?.title ?? "", 70) || salida[0]?.h || "Video";
  const anim: Animacion = { version: 1, titulo, paleta: ctx.paleta ?? "imnoba", sfx, fps: 60, duracion, escenas: salida, uso: null, hud: false, formato: "viral" };
  return { anim, correcciones, titulo, locucion: locucionViral(salida, titulo), sinRespuesta };
}

/* ───────────── colores y fondos por plantilla ───────────── */

export type TemaViral = {
  bg0: string; bg1: string;
  texto: string; suave: string; acento: string; acento2: string; peligro: string; exito: string;
  /** relleno de tarjetas y paneles */
  panel: string; borde: string;
  /** texto sobre el color de acento */
  sobreAcento: string;
  oscuro: boolean;
};

/** Colores de cada fondo (dark / gold / light) derivados de la paleta elegida. IMNOBA: azul #02224E, dorado #FFC500, blanco. */
export function temaViral(paleta: string | undefined, bg: FondoViral): TemaViral {
  const C: ColoresEstudio = coloresEstudio(paleta);
  const navy = C.fondoCentro;
  const acento = C.roles.accent;
  if (bg === "gold") {
    return { bg0: mezclar(acento, "#FFFFFF", 0.12), bg1: mezclar(acento, "#000000", 0.1), texto: navy, suave: mezclar(navy, acento, 0.45), acento: navy, acento2: "#FFFFFF", peligro: C.roles.danger, exito: C.roles.success, panel: "rgba(2,34,78,0.10)", borde: "rgba(2,34,78,0.28)", sobreAcento: acento, oscuro: false };
  }
  if (bg === "light") {
    return { bg0: "#FFFFFF", bg1: "#E6ECF7", texto: navy, suave: mezclar(navy, "#FFFFFF", 0.55), acento: mezclar(acento, "#000000", 0.04), acento2: C.roles.secondary, peligro: C.roles.danger, exito: C.roles.success, panel: "#FFFFFF", borde: "rgba(2,34,78,0.14)", sobreAcento: navy, oscuro: false };
  }
  return { bg0: mezclar(navy, "#FFFFFF", 0.06), bg1: oscurecer(navy, 0.6), texto: "#FFFFFF", suave: mezclar("#FFFFFF", navy, 0.4), acento, acento2: C.roles.secondary, peligro: C.roles.danger, exito: C.roles.success, panel: "rgba(255,255,255,0.07)", borde: "rgba(255,255,255,0.16)", sobreAcento: navy, oscuro: true };
}

/* ───────────── prompt de sistema (estático y cacheable) y mensaje de usuario ───────────── */

export const MARCA_VIRAL = "DIRECTOR_VIRAL";

/**
 * Reglas, vocabulario y formato idénticos en cada llamada (van PRIMERO: prefijo cacheable). Lo variable (idea, duración, marca) va en el mensaje de usuario.
 */
export function sistemaViral(): string {
  return `Eres guionista y director de arte de reels virales de 9:16 en español de Colombia (tuteo, frases cortas, directo, sin relleno). Conviertes una idea en un video completo: escribes la locución y eliges, escena por escena, una plantilla; un motor prefabricado la dibuja (tú no dibujas). [${MARCA_VIRAL}]
Responde SOLO un objeto JSON: {"titulo":"…","scenes":[…]} (sin texto extra). Ritmo de reel: "dur" = palabras de la voz ÷ 2,9 + 0,5 s (mín. 2,8; HOOK y CTA ≈ 3,5). En modo bloques cada escena lleva "id" y NO "voz" ni "dur"; en modo idea lleva "voz" y "dur".
Cada escena: {"t":TIPO,"voz":"narración exacta a grabar (6–12 palabras)","dur":3.5,"h":"TITULAR EN MAYÚSCULAS ≤ 30 car.","w":"palabra del titular a resaltar","ic":"icono", …campos del tipo}
TIPOS y sus campos:
HOOK gancho cinético gigante (h ≤ 34 car., 2–3 líneas; "sub" opcional ≤ 40 car.). SIEMPRE la escena 1: pregunta o dato que frena el scroll.
NUM número gigante que cuenta: "num":{"n":"35","u":"%","pre":"+","l":"VALORIZACIÓN ANUAL"} (n solo dígitos).
VS comparación: "a":{"l":"BOGOTÁ","n":"1","ic":"tren"},"b":{"l":"SANTIAGO","n":"7","ic":"tren"},"op":"<" (n números; op > < =).
BARS barras que crecen: "bars":[{"l":"2020","v":30},…] (3–6), "u":"%","hi":índice destacado.
LINE tendencia: "line":{"pts":[10,14,13,25,40,70],"l0":"2020","l1":"2030","end":"+180 %"} (5–10 puntos).
STEPS causa→efecto/pasos: "items":[{"l":"METRO","ic":"tren"},{"l":"OBRAS","ic":"edificio"},{"l":"VALOR","ic":"tendencia-alza"}] (3–4).
LIST beneficios con check: "items":["Sin comisión","Más alcance","Gratis"] (3–4, ≤ 30 car.).
ROUTE ruta/recorrido de metro: "stops":["PORTAL","CENTRO","CALLE 72"] (3–5), "end":"VALORIZACIÓN".
SKYLINE ciudad que crece (inmuebles, plusvalía): "l":"+35 %","sub":"caption ≤ 28 car.".
CTA cierre con llamada a la acción: h ≤ 26 car., "sub" (web o marca). SIEMPRE la última escena.
ICONOS: ${ICONOS_VIRAL.join(", ")}.
ESTRUCTURA: HOOK → problema/contexto (NUM, VS, LINE) → mecanismo (STEPS, ROUTE) → prueba (BARS, SKYLINE) → beneficios (LIST) → CTA. No repitas el mismo tipo dos veces seguidas. ROUTE solo para recorridos o etapas en secuencia y SKYLINE solo para ciudad, inmuebles o crecimiento; si el tema es otro usa STEPS, BARS, LINE o NUM. Cada escena aporta una idea nueva. Titulares cortos y con fuerza; la locución completa la idea, no la repite.
DATOS: usa solo las cifras que da la idea; si necesitas una, usa un número redondo ilustrativo (nunca un dato oficial inventado). Nada de comillas ni emojis dentro de los textos.`;
}

const APROX_MARCA = (paleta?: string): string => (paleta === undefined || paleta === "imnoba" || paleta === "retro-imnoba" ? "MARCA: IMNOBA (plataforma colombiana para publicar y encontrar inmuebles y vehículos; web imnoba.com). El CTA es de IMNOBA." : "");

/** Mensaje de usuario en modo IDEA: la frase, la duración objetivo y el número de escenas. */
export function promptUsuarioIdea(i: { idea: string; duracion: number; escenasObjetivo: number; paleta?: string }): string {
  return `MODO: idea\nIDEA: ${i.idea}\nDURACIÓN TOTAL: ${i.duracion} s (suma de las "dur")\nESCENAS: ${i.escenasObjetivo} (±1)${APROX_MARCA(i.paleta) ? `\n${APROX_MARCA(i.paleta)}` : ""}`;
}

/** Mensaje de usuario en modo BLOQUES: cada bloque con su duración, su locución y su dirección visual. */
export function promptUsuarioBloques(escenas: { n: number; dur: number; voz: string; direccion: string }[], paleta?: string): string {
  const m = APROX_MARCA(paleta);
  return `MODO: bloques (devuelve cada "id"; sin "voz" ni "dur")${m ? `\n${m}` : ""}\n` + escenas.map((e) => `ESC ${e.n} | ${Math.round(e.dur * 10) / 10}s\nDIR: ${e.direccion || "(libre)"}${e.voz ? `\nVOZ: ${e.voz}` : ""}`).join("\n\n");
}

export function tokensFijosViral(): { sistema: number; esquema: number } {
  return { sistema: tokensDeTexto(sistemaViral().length, 3.4), esquema: 0 };
}

/* ───────────── costo ───────────── */

/** Tokens de salida por escena: con locución y duración (idea) ≈ 165; sin ellas (bloques) ≈ 120. */
export const SALIDA_POR_ESCENA_VIRAL = 165;
export const SALIDA_POR_ESCENA_VIRAL_BLOQUES = 120;
export type EntradaViral = { modelo: string; caracteres: number; escenas: number; tokensSistema: number; conVoz?: boolean };

/** Costo del flujo «una frase → video»: entrada = prompt fijo + idea; salida = ~165 tokens por escena (+ título). */
export function estimarViral(e: EntradaViral): { tokensEntrada: number; tokensSalida: number; costo: number } {
  const m = modeloPorId(e.modelo);
  const tokensEntrada = e.tokensSistema + tokensDeTexto(e.caracteres) + 30;
  let tokensSalida = (e.conVoz === false ? SALIDA_POR_ESCENA_VIRAL_BLOQUES : SALIDA_POR_ESCENA_VIRAL) * e.escenas + 30;
  if (m.razonador && e.escenas > 0) tokensSalida += 600 + 120 * e.escenas;
  return { tokensEntrada, tokensSalida, costo: (tokensEntrada * m.entrada + tokensSalida * m.salida) / 1_000_000 };
}

/* ───────────── plantilla del «Prompt Formateador» ───────────── */

export const PROMPT_FORMATEADOR_IDEA = `Ayúdame a escribir la IDEA de un reel en UNA sola frase (máximo dos). Una buena idea dice: de qué trata, para quién es y qué quiero que la gente haga al final. Puedes incluir la duración («de 30 segundos»).

Ejemplos:
· Un video de 30 segundos para IMNOBA: por qué el metro de Bogotá valoriza las propiedades cerca de las estaciones, y que publiquen gratis su inmueble.
· Reel de 25 segundos: 3 errores al vender tu carro usado y cómo evitarlos publicando en IMNOBA.

Devuélveme SOLO la frase final (sin comillas ni explicaciones), con los datos reales que yo te dé y sin inventar cifras. Mis notas:
`;
