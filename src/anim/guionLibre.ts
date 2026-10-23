/**
 * Parser LOCAL (sin IA, $0) del FORMATO LIBRE («Dirección de Arte»): solo hace falta el tiempo de cada escena.
 *
 *   [ESCENA 1 | 00:00-00:05]
 *   VOZ_OFF: Lo que tú grabas (la IA lo recibe solo como contexto narrativo).
 *   DIRECCION_VISUAL: Cámara que se acerca a una casa que se dibuja sola; las letras entran con física spring…
 *
 * No hay [CONFIG], ni medidores, ni FONDO/MODO obligatorios. Dentro de la escena se escribe como se quiera:
 * las líneas con clave (VOZ_OFF, DIRECCION_VISUAL, GEO, H1, SUB, HUD, SFX, cualquier CLAVE: en mayúsculas) se entienden y el resto se toma como dirección visual.
 * Un SFX desconocido NO da error: cae en silencio a «pop» (o «whoosh» si el nombre suena a movimiento).
 */
import { normalizarEscenas, parsearRango, parsearTiempo } from "./parser";

export type SfxLibre = { t: number; tipo: string };
export type EscenaLibreGuion = {
  n: number;
  inicio: number;
  fin: number;
  dur: number;
  /** locución (VOZ_OFF): se guarda para que la grabes; a la IA solo llega como contexto de ritmo */
  voz: string;
  /** dirección visual libre (lo que la IA convierte en una composición única) */
  direccion: string;
  sfx: SfxLibre[];
};
export type ResultadoLibre = {
  formato: "libre";
  escenas: EscenaLibreGuion[];
  errores: string[];
  avisos: string[];
  duracion: number;
  caracteres: number;
  /** caracteres de dirección visual + voz que se envían a la IA */
  caracteresIA: number;
};

const SFX_BASE = ["pop", "whoosh", "heartbeat", "cash", "tick", "thud", "zap", "ding"];
const ENCABEZADO = /^\s*\[\s*ESCENA\s*(\d+)\s*\|\s*([^|\]]+?)\s*(?:\|[^\]]*)?\]\s*(.*)$/i;
const CLAVE = /^\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9_]{1,24})\s*(?:\(([^)]*)\))?\s*[:=]\s*(.*)$/;

/** Fallback silencioso: lo desconocido suena a «whoosh» si parece movimiento y a «pop» en cualquier otro caso. */
export function sfxConFallback(nombre: string): string {
  const n = nombre.toLowerCase().replace(/[^a-záéíóúñ]/g, "");
  if (n === "latido") return "heartbeat";
  if (SFX_BASE.includes(n)) return n;
  return /(swish|swoosh|viento|barrido|deslizar|paso|rapido|rápido|golpe)/.test(n) ? "whoosh" : "pop";
}

export function parsearLibre(texto: string): ResultadoLibre {
  const errores: string[] = [];
  const avisos: string[] = [];
  type Borrador = { n: number; linea: number; rango: [number, number] | null; rangoTxt: string; voz: string; piezas: string[]; sfx: { rango: string; texto: string }[]; ultimo: "voz" | "dir" | "sfx" };
  const bloques: Borrador[] = [];
  let actual: Borrador | null = null;
  let suelto = 0;

  const relativo = (rango: string, inicio0: number | null): string => {
    const r = rango ? parsearRango(rango) : null;
    if (!r || inicio0 === null) return "";
    const f = (x: number) => Math.max(0, x - inicio0).toFixed(1);
    return ` (${f(r[0])}–${f(r[1])} s de la escena)`;
  };

  texto.replace(/\r/g, "").split("\n").forEach((linea, idx) => {
    const enc = linea.match(ENCABEZADO);
    if (enc) {
      actual = { n: Number(enc[1]), linea: idx + 1, rango: parsearRango(enc[2]), rangoTxt: enc[2].trim(), voz: "", piezas: enc[3].trim() ? [enc[3].trim()] : [], sfx: [], ultimo: "dir" };
      bloques.push(actual);
      return;
    }
    if (!linea.trim()) return;
    if (!actual) { suelto++; return; }
    const k = linea.match(CLAVE);
    const inicio0 = actual.rango ? actual.rango[0] : null;
    if (k) {
      const clave = k[1].toUpperCase().replace("Ó", "O").replace("Í", "I");
      const rango = (k[2] ?? "").trim();
      const valor = k[3].trim();
      if (clave === "VOZ_OFF" || clave === "VOZ") { actual.voz = valor; actual.ultimo = "voz"; }
      else if (clave === "SFX") { actual.sfx.push({ rango, texto: valor }); actual.ultimo = "sfx"; }
      else if (["DIRECCION_VISUAL", "DIRECCION", "GEO", "VISUAL"].includes(clave)) { actual.piezas.push(`${relativo(rango, inicio0).trim()} ${valor}`.trim()); actual.ultimo = "dir"; }
      else if (clave === "H1" || clave === "TITULO") { actual.piezas.push(`Texto principal en pantalla: «${valor}»`); actual.ultimo = "dir"; }
      else if (clave === "SUB") { actual.piezas.push(`Texto secundario: «${valor}»`); actual.ultimo = "dir"; }
      else { actual.piezas.push(`${clave.replace(/_/g, " ").toLowerCase()}${relativo(rango, inicio0)}: ${valor}`); actual.ultimo = "dir"; }
    } else {
      const t = linea.trim();
      if (actual.ultimo === "voz") actual.voz += ` ${t}`;
      else if (actual.ultimo === "sfx" && actual.sfx.length) actual.sfx[actual.sfx.length - 1].texto += ` ${t}`;
      else actual.piezas.push(t); // el resto es dirección visual escrita con libertad (las piezas se unen con espacios)
    }
  });

  if (!bloques.length) {
    errores.push("No encuentro ninguna escena. Cada una empieza con una línea como  [ESCENA 1 | 00:00-00:05]  y debajo escribes la VOZ_OFF y la DIRECCION_VISUAL.");
    return { formato: "libre", escenas: [], errores, avisos, duracion: 0, caracteres: texto.length, caracteresIA: 0 };
  }
  if (suelto) avisos.push(`Hay ${suelto} línea(s) antes de la primera escena: se ignoran.`);

  type Prev = { n: number; inicio: number; fin: number; dur: number; inicio0: number; b: Borrador };
  const previas: Prev[] = [];
  for (const b of bloques) {
    const nombre = `Escena ${b.n} (línea ${b.linea})`;
    if (!b.rango) { errores.push(`${nombre}: no entiendo el tiempo «${b.rangoTxt}». Usa por ejemplo 00:00-00:05.`); continue; }
    const [inicio, fin] = b.rango;
    if (fin <= inicio) { errores.push(`${nombre}: el fin (${fin}s) debe ser mayor que el inicio (${inicio}s).`); continue; }
    previas.push({ n: b.n, inicio, fin, dur: fin - inicio, inicio0: inicio, b });
  }
  const norm = normalizarEscenas(previas, errores, avisos);
  const escenas: EscenaLibreGuion[] = norm.map((e) => {
    let direccion = e.b.piezas.join(" ").replace(/\s+/g, " ").trim();
    const voz = e.b.voz.trim();
    if (!direccion && voz) direccion = `(sin dirección visual: ilustra con libertad lo que dice la voz) ${voz}`;
    else if (!direccion) avisos.push(`La escena ${e.n} no tiene texto: la IA inventará la composición solo con la duración.`);
    const sfx: SfxLibre[] = [];
    for (const s of e.b.sfx) {
      const base = s.rango ? parsearTiempo(s.rango) : null;
      for (const tok of s.texto.split(/[,;|]/)) {
        const m = tok.trim().match(/^([\p{L}_-]+)\s*(?:[(@]\s*([^)\s]+)\s*\)?)?$/u);
        if (!m) continue; // sin alertas: lo que no se entiende se ignora
        const propio = m[2] ? parsearTiempo(m[2]) : null;
        const t = propio ?? base ?? 0.05;
        sfx.push({ t: Math.min(Math.max(0, +(t - e.inicio0).toFixed(2)), Math.max(0, e.dur - 0.1)), tipo: sfxConFallback(m[1]) });
      }
    }
    return { n: e.n, inicio: e.inicio, fin: e.fin, dur: e.dur, voz, direccion, sfx };
  });
  const duracion = escenas.length ? escenas[escenas.length - 1].fin : 0;
  if (duracion > 120) avisos.push(`El video dura ${duracion.toFixed(0)} s; los reels suelen ir de 15 a 60 s.`);
  const caracteresIA = escenas.reduce((n, e) => n + e.direccion.length + e.voz.length, 0);
  return { formato: "libre", escenas, errores, avisos, duracion, caracteres: texto.length, caracteresIA };
}
