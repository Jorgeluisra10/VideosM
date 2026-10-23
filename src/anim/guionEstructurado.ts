/**
 * Parser LOCAL (sin IA, $0) del FORMATO ESTRUCTURADO del estilo Retro-Científica:
 *
 *   [CONFIG]
 *   DURACION: 00:28
 *   HUD: ON
 *   GAUGE_1: ÁREA | 30-120 | m²
 *   GAUGE_2: PRECIO/M² | 2-8 | M
 *   GAUGE_3: VALOR | 60-700 | M
 *
 *   [ESCENA 1 | 00:00-00:05 | FONDO: dark | MODO: SVG]
 *   H1: EL VALOR DE UN INMUEBLE
 *   SUB: > MODELO: V = ÁREA × PRECIO/M²
 *   VOZ_OFF: Texto que grabas tú (no se dibuja ni se envía a la IA).
 *   GEO (00:00-00:03): Ejes punteados y una curva roja que sube.
 *   HUD (00:01-00:03): G1=90 | G2=5.5 | G3=-
 *   SFX (00:03): ding
 *
 * Solo las líneas GEO (y el MODO) viajan a OpenAI; título, subtítulo, HUD, fondo, sonido y locución se resuelven aquí.
 * Tolera mayúsculas/minúsculas, «=» en vez de «:», líneas de continuación y tiempos como 0s, 4-9 o 00:09.
 */
import { normalizarEscenas, parsearRango, parsearTiempo, type Modo } from "./parser";

export type FondoEscena = "dark" | "paper";
export type ConfigGauge = { etiqueta: string; unidad: string; min: number; max: number; decimales: number };
export type ConfigEstructurada = { duracion: number | null; hud: boolean; gauges: ConfigGauge[] };
/** Todos los tiempos son segundos RELATIVOS al inicio de la escena. */
export type GeoLinea = { t: number; hasta: number; texto: string };
export type HudClave = { t: number; dur: number; valores: (number | null)[] };
export type SfxLinea = { t: number; tipo: string };
export type EscenaEstructurada = {
  n: number;
  inicio: number;
  fin: number;
  dur: number;
  modo: Modo;
  /** MODO: 3D+SVG → escena 3D con capa vectorial completa encima */
  mixto: boolean;
  fondo: FondoEscena;
  h1: string;
  sub: string | null;
  vozOff: string;
  geo: GeoLinea[];
  hud: HudClave[];
  sfx: SfxLinea[];
};
export type ResultadoEstructurado = {
  formato: "estructurado";
  config: ConfigEstructurada;
  escenas: EscenaEstructurada[];
  errores: string[];
  avisos: string[];
  duracion: number;
  caracteres: number;
  /** caracteres de las líneas GEO (lo único que se envía a la IA) */
  caracteresGeo: number;
  lineasGeo: number;
};

export const SFX_CONOCIDOS = ["pop", "whoosh", "heartbeat", "cash", "tick", "thud", "zap", "ding"] as const;

const ENCABEZADO = /^\s*\[\s*ESCENA\s*(\d+)\s*\|(.+)\]\s*$/i;
const CLAVE = /^\s*(H1|SUB|VOZ_OFF|VOZ|GEO|HUD|SFX)\s*(?:\(([^)]*)\))?\s*[:=]\s*(.*)$/i;
const NUM = "-?\\d+(?:[.,]\\d+)?";
const RANGO_NUM = new RegExp(`(${NUM})\\s*(?:–|—|→|\\.\\.|\\ba\\b|-)\\s*(${NUM})`);

const aNumero = (s: string): number => Number(s.replace(",", "."));

/** ¿El texto usa el formato estructurado? (hay [CONFIG] o cabeceras con FONDO:) */
export function detectarFormato(texto: string): "simple" | "estructurado" {
  return /^\s*\[\s*CONFIG\s*\]/im.test(texto) || /^\s*\[\s*ESCENA[^\]]*FONDO\s*:/im.test(texto) ? "estructurado" : "simple";
}

function parsearGauge(valor: string, i: number, avisos: string[]): ConfigGauge | null {
  const partes = valor.split("|").map((p) => p.trim());
  const r = partes.findIndex((p) => RANGO_NUM.test(p));
  if (r < 0) return null;
  const m = partes[r].match(RANGO_NUM)!;
  let etiqueta = r > 0 ? partes[0] : partes[0].slice(0, m.index).replace(/[:=]\s*$/, "").trim();
  let unidad = partes[r + 1] ?? partes[r].slice((m.index ?? 0) + m[0].length).replace(/[()]/g, "").trim();
  if (r === 0 && partes[1] && !RANGO_NUM.test(partes[1]) && !unidad) unidad = partes[1];
  if (!etiqueta) etiqueta = `G${i}`;
  etiqueta = etiqueta.toUpperCase();
  if (etiqueta.length > 14) {
    avisos.push(`GAUGE_${i}: la etiqueta «${etiqueta}» se recorta a 14 caracteres.`);
    etiqueta = etiqueta.slice(0, 14);
  }
  let min = aNumero(m[1]), max = aNumero(m[2]);
  if (max <= min) {
    avisos.push(`GAUGE_${i}: el rango ${m[1]}-${m[2]} no es creciente; se usa ${Math.min(min, max)}-${Math.max(min, max) + 1}.`);
    [min, max] = [Math.min(min, max), Math.max(min, max) + 1];
  }
  return { etiqueta, unidad: unidad.slice(0, 6), min, max, decimales: /[.,]\d/.test(m[1] + m[2]) ? 1 : 0 };
}

/** «ON/OFF/SI/NO/true/false» → boolean (o null si no se entiende) */
const aBool = (s: string): boolean | null => (/^(on|si|sí|true|1|yes)$/i.test(s.trim()) ? true : /^(off|no|false|0)$/i.test(s.trim()) ? false : null);

export function parsearEstructurado(texto: string): ResultadoEstructurado {
  const errores: string[] = [];
  const avisos: string[] = [];
  const config: ConfigEstructurada = { duracion: null, hud: true, gauges: [] };
  const gaugesDef: (ConfigGauge | null)[] = [null, null, null];
  type Borrador = { n: number; linea: number; rango: [number, number] | null; rangoTxt: string; fondoTxt: string; modoTxt: string; h1: string; sub: string; voz: string; geo: { rango: string; texto: string }[]; hud: { rango: string; texto: string }[]; sfx: { rango: string; texto: string }[]; ultimo: string };
  const borradores: Borrador[] = [];
  let seccion: "ninguna" | "config" | "escena" = "ninguna";
  let actual: Borrador | null = null;
  let suelto = 0;

  texto.replace(/\r/g, "").split("\n").forEach((linea, idx) => {
    if (/^\s*\[\s*CONFIG\s*\]\s*$/i.test(linea)) { seccion = "config"; return; }
    const enc = linea.match(ENCABEZADO);
    if (enc) {
      const campos = enc[2].split("|").map((c) => c.trim());
      const kv = (clave: string) => campos.map((c) => c.match(new RegExp(`^${clave}\\s*:\\s*(.+)$`, "i"))?.[1]?.trim()).find(Boolean) ?? "";
      const rangoTxt = campos.find((c) => !/^(FONDO|MODO)\s*:/i.test(c) && c) ?? "";
      actual = { n: Number(enc[1]), linea: idx + 1, rango: parsearRango(rangoTxt), rangoTxt, fondoTxt: kv("FONDO"), modoTxt: kv("MODO"), h1: "", sub: "", voz: "", geo: [], hud: [], sfx: [], ultimo: "" };
      borradores.push(actual);
      seccion = "escena";
      return;
    }
    if (!linea.trim()) return;
    if (seccion === "config") {
      const m = linea.match(/^\s*([A-Za-z_0-9]+)\s*[:=]\s*(.*)$/);
      if (!m) return;
      const clave = m[1].toUpperCase();
      if (clave === "DURACION" || clave === "DURACIÓN") {
        const d = parsearTiempo(m[2]);
        if (d === null || d <= 0) errores.push(`[CONFIG] DURACION: no entiendo «${m[2]}». Usa por ejemplo 00:28 o 28s.`);
        else config.duracion = d;
      } else if (clave === "HUD") {
        const b = aBool(m[2]);
        if (b === null) errores.push(`[CONFIG] HUD: debe ser ON u OFF (puse «${m[2]}»).`);
        else config.hud = b;
      } else {
        const g = clave.match(/^(?:GAUGE_?|G)([1-3])$/);
        if (g) {
          const cfg = parsearGauge(m[2], Number(g[1]), avisos);
          if (!cfg) errores.push(`[CONFIG] ${clave}: necesito un rango, por ejemplo  ${clave}: ÁREA | 30-120 | m²`);
          else gaugesDef[Number(g[1]) - 1] = cfg;
        } else avisos.push(`[CONFIG] la clave «${m[1]}» no se conoce y se ignora.`);
      }
      return;
    }
    if (!actual) { suelto++; return; }
    const k = linea.match(CLAVE);
    if (k) {
      const clave = k[1].toUpperCase();
      const rango = (k[2] ?? "").trim();
      const valor = k[3].trim();
      if (clave === "H1") { actual.h1 = valor; actual.ultimo = "h1"; }
      else if (clave === "SUB") { actual.sub = valor; actual.ultimo = "sub"; }
      else if (clave === "VOZ_OFF" || clave === "VOZ") { actual.voz = valor; actual.ultimo = "voz"; }
      else if (clave === "GEO") { actual.geo.push({ rango, texto: valor }); actual.ultimo = "geo"; }
      else if (clave === "HUD") { actual.hud.push({ rango, texto: valor }); actual.ultimo = "hud"; }
      else { actual.sfx.push({ rango, texto: valor }); actual.ultimo = "sfx"; }
    } else {
      // línea de continuación: se pega al último campo
      const t = linea.trim();
      if (actual.ultimo === "h1") actual.h1 += ` ${t}`;
      else if (actual.ultimo === "sub") actual.sub += ` ${t}`;
      else if (actual.ultimo === "voz") actual.voz += ` ${t}`;
      else if (actual.ultimo === "geo" && actual.geo.length) actual.geo[actual.geo.length - 1].texto += ` ${t}`;
      else if (actual.ultimo === "hud" && actual.hud.length) actual.hud[actual.hud.length - 1].texto += ` ${t}`;
      else if (actual.ultimo === "sfx" && actual.sfx.length) actual.sfx[actual.sfx.length - 1].texto += ` ${t}`;
      else avisos.push(`Línea ${idx + 1}: «${t.slice(0, 40)}» no está en ningún campo (H1, SUB, VOZ_OFF, GEO, HUD, SFX) y se ignora.`);
    }
  });

  const vacio: ResultadoEstructurado = { formato: "estructurado", config, escenas: [], errores, avisos, duracion: 0, caracteres: texto.length, caracteresGeo: 0, lineasGeo: 0 };
  if (!borradores.length) {
    errores.push("No encuentro ninguna escena. Cada una empieza con  [ESCENA 1 | 00:00-00:05 | FONDO: dark | MODO: SVG]  (MODO: SVG, 3D o 3D+SVG; FONDO: dark o paper).");
    return vacio;
  }
  if (suelto) avisos.push(`Hay ${suelto} línea(s) antes del primer bloque que se ignoran.`);

  // ---- escenas
  type Prev = Omit<EscenaEstructurada, "geo" | "hud" | "sfx"> & { b: Borrador; inicio0: number };
  const previas: Prev[] = [];
  for (const b of borradores) {
    const nombre = `Escena ${b.n} (línea ${b.linea})`;
    if (!b.rango) { errores.push(`${nombre}: no entiendo el tiempo «${b.rangoTxt}». Usa por ejemplo 00:00-00:05.`); continue; }
    const [inicio, fin] = b.rango;
    if (fin <= inicio) { errores.push(`${nombre}: el fin (${fin}s) debe ser mayor que el inicio (${inicio}s).`); continue; }
    const modoTxt = b.modoTxt.toUpperCase().replace(/\s+/g, "");
    const mixto = modoTxt === "3D+SVG" || modoTxt === "SVG+3D";
    const modo: Modo | null = modoTxt === "SVG" ? "SVG" : modoTxt === "3D" || mixto ? "3D" : null;
    if (!modo) { errores.push(`${nombre}: el modo «${b.modoTxt || "(falta)"}» no existe. Usa MODO: SVG, MODO: 3D o MODO: 3D+SVG.`); continue; }
    const f = b.fondoTxt.toLowerCase();
    const fondo: FondoEscena | null = /^(dark|oscuro|negro)$/.test(f) ? "dark" : /^(paper|papel|claro)$/.test(f) ? "paper" : f === "" ? "dark" : null;
    if (!fondo) { errores.push(`${nombre}: el fondo «${b.fondoTxt}» no existe. Usa FONDO: dark o FONDO: paper.`); continue; }
    if (!b.fondoTxt) avisos.push(`${nombre}: falta FONDO; se usa dark.`);
    if (!b.geo.length) { errores.push(`${nombre}: falta al menos una línea  GEO (00:00-00:03): …  con lo que debe dibujarse en el escenario.`); continue; }
    if (!b.h1.trim()) avisos.push(`${nombre}: no tiene H1 (título).`);
    previas.push({ n: b.n, inicio, fin, dur: fin - inicio, modo, mixto, fondo, h1: b.h1.trim(), sub: b.sub.trim() || null, vozOff: b.voz.trim(), b, inicio0: inicio });
  }

  const norm = normalizarEscenas(previas, errores, avisos);
  const tiempo = (txt: string, desde: number, e: Prev): number | null => {
    const t = parsearTiempo(txt);
    return t === null ? null : Math.max(0, +(t - desde).toFixed(3));
  };
  const escenas: EscenaEstructurada[] = norm.map((e) => {
    const nombre = `Escena ${e.n}`;
    const rel = (txt: string): [number, number] | null => {
      if (!txt.trim()) return [0, e.dur];
      const r = parsearRango(txt);
      if (!r) return null;
      return [Math.max(0, +(r[0] - e.inicio0).toFixed(3)), Math.min(e.dur, +(r[1] - e.inicio0).toFixed(3))];
    };
    const geo: GeoLinea[] = [];
    for (const g of e.b.geo) {
      const r = rel(g.rango);
      if (!r) { errores.push(`${nombre}: no entiendo el tiempo de GEO «${g.rango}».`); continue; }
      if (r[1] <= r[0]) { avisos.push(`${nombre}: la línea GEO (${g.rango}) cae fuera de la escena y se ignora.`); continue; }
      if (!g.texto.trim()) { avisos.push(`${nombre}: hay una línea GEO vacía.`); continue; }
      geo.push({ t: r[0], hasta: r[1], texto: g.texto.trim() });
    }
    if (!geo.length && !errores.some((x) => x.startsWith(nombre))) errores.push(`${nombre}: ninguna línea GEO es válida.`);

    const hud: HudClave[] = [];
    for (const h of e.b.hud) {
      const r = rel(h.rango);
      if (!r) { errores.push(`${nombre}: no entiendo el tiempo de HUD «${h.rango}».`); continue; }
      const valores: (number | null)[] = [null, null, null];
      for (const par of h.texto.split("|")) {
        const m = par.trim().match(/^G([1-3])\s*[=:]\s*(.*)$/i);
        if (!m) { if (par.trim()) avisos.push(`${nombre}: en HUD no entiendo «${par.trim()}» (usa G1=75 | G2=40 | G3=-).`); continue; }
        const num = m[2].trim().match(new RegExp(`^${NUM}`));
        valores[Number(m[1]) - 1] = num ? aNumero(num[0]) : null; // «-» o vacío = no cambia
      }
      hud.push({ t: r[0], dur: Math.min(2, Math.max(0.6, +(r[1] - r[0]).toFixed(3))), valores });
    }

    const sfx: SfxLinea[] = [];
    for (const s of e.b.sfx) {
      const base = s.rango ? tiempo(s.rango, e.inicio0, e) : null;
      for (const tok of s.texto.split(/[,;|]/)) {
        const m = tok.trim().match(/^([A-Za-zñÑ]+)\s*(?:[(@]\s*([^)\s]+)\s*\)?)?$/);
        if (!m) { if (tok.trim()) avisos.push(`${nombre}: en SFX no entiendo «${tok.trim()}».`); continue; }
        let tipo = m[1].toLowerCase();
        if (tipo === "latido") tipo = "heartbeat";
        if (!(SFX_CONOCIDOS as readonly string[]).includes(tipo)) { avisos.push(`${nombre}: el sonido «${m[1]}» no existe (${SFX_CONOCIDOS.join(", ")}); se ignora.`); continue; }
        const propio = m[2] ? tiempo(m[2], e.inicio0, e) : null;
        const t = propio ?? base ?? 0.05;
        sfx.push({ t: Math.min(Math.max(0, t), Math.max(0, e.dur - 0.1)), tipo });
      }
    }
    const { b: _b, inicio0: _i, ...resto } = e;
    return { ...resto, geo, hud, sfx };
  });

  // ---- HUD y medidores
  const usados = new Set<number>();
  for (const e of escenas) for (const h of e.hud) h.valores.forEach((v, i) => v !== null && usados.add(i));
  // los medidores son contiguos desde G1 (el modelo 3D los vincula por posición): lo que falte entre G1 y el último usado se crea con rango 0-100
  const ultimo = Math.max(-1, ...gaugesDef.map((g, i) => (g || usados.has(i) ? i : -1)));
  config.gauges = [];
  for (let i = 0; i <= ultimo; i++) config.gauges.push(gaugesDef[i] ?? { etiqueta: `G${i + 1}`, unidad: "", min: 0, max: 100, decimales: 0 });
  if (gaugesDef.some((g, i) => !g && i <= ultimo)) avisos.push("Hay un medidor sin GAUGE_n en [CONFIG] (o con huecos): se crea con rango 0-100.");
  if (config.hud && !config.gauges.length) errores.push("HUD: ON pero no hay medidores. Define al menos  GAUGE_1: NOMBRE | 0-100 | unidad  en [CONFIG], o pon HUD: OFF.");
  if (!config.hud && escenas.some((e) => e.hud.length)) avisos.push("HUD: OFF → las líneas HUD de las escenas se ignoran.");
  // los medidores solo pueden llegar a G3 y las agujas no se salen de su rango
  for (const e of escenas) for (const h of e.hud) h.valores = h.valores.map((v, i) => {
    const g = config.gauges[i];
    if (v === null || !g) return v;
    if (v < g.min || v > g.max) avisos.push(`Escena ${e.n}: G${i + 1}=${v} sale del rango ${g.min}-${g.max}; se acota.`);
    return Math.min(g.max, Math.max(g.min, v));
  });

  const duracion = escenas.length ? escenas[escenas.length - 1].fin : 0;
  if (config.duracion !== null && escenas.length && Math.abs(config.duracion - duracion) > 0.5) avisos.push(`[CONFIG] DURACION es ${config.duracion}s pero las escenas terminan en ${duracion}s: manda lo que dicen las escenas.`);
  if (duracion > 120) avisos.push(`El video dura ${duracion.toFixed(0)} s; los reels suelen ir de 15 a 60 s.`);
  const lineasGeo = escenas.reduce((n, e) => n + e.geo.length, 0);
  const caracteresGeo = escenas.reduce((n, e) => n + e.geo.reduce((m, g) => m + g.texto.length, 0), 0);
  return { ...vacio, escenas, duracion, caracteresGeo, lineasGeo };
}

/** Texto de locución (VOZ_OFF) para que lo leas al grabar el audio. No se dibuja ni se envía a la IA. */
export function textoLocucion(escenas: EscenaEstructurada[], titulo = ""): string {
  const reloj = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const lineas = escenas.map((e) => `[ESCENA ${e.n} | ${reloj(e.inicio)}-${reloj(e.fin)}]\n${e.vozOff || "(sin locución)"}`);
  return `${titulo ? `${titulo}\n${"=".repeat(Math.min(60, titulo.length))}\n\n` : ""}${lineas.join("\n\n")}\n`;
}
