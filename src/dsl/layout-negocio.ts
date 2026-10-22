/**
 * Medidas (en píxeles del video) de las piezas de negocio/inmobiliaria: lista, ficha, cta, precio…
 * Lógica PURA, sin React: la comparten los componentes (que dibujan) y el validador de Node
 * (que detecta solapes con las mismas cifras).
 */
import { anchoEstimado } from "../lib/texto";
import { pu } from "./medidas";

type El = Record<string, any>;
const num = (v: unknown, d: number): number => (typeof v === "number" && Number.isFinite(v) ? v : d);
const txt = (v: unknown): string => (typeof v === "string" ? v : "");
const acotar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lista = (v: unknown, max: number): El[] => (Array.isArray(v) ? (v.filter((x) => x && typeof x === "object") as El[]).slice(0, max) : []);

export const miles = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** 185000 → "185.000"; "185000" → "185.000"; "Consultar" → "Consultar". */
export function formatoMonto(v: unknown): string {
  if (typeof v === "number" && Number.isFinite(v)) return miles(v);
  const s = txt(v).trim();
  if (/^[\d.,\s]+$/.test(s) && /\d/.test(s)) return miles(Number(s.replace(/[.,\s]/g, "")));
  return s;
}

/** Valor numérico de un monto (para animar la cuenta), o null si es texto libre. */
export function valorMonto(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = txt(v).trim();
  return /^[\d.,\s]+$/.test(s) && /\d/.test(s) ? Number(s.replace(/[.,\s]/g, "")) : null;
}

export function medidasLista(el: El) {
  const items = lista(el.items, 6);
  const w = pu(el.ancho, 76);
  const tituloH = txt(el.titulo) ? 100 : 0;
  const fila = 86;
  return { items, w, tituloH, fila, h: tituloH + items.length * fila + 40 };
}

export function medidasFicha(el: El) {
  const items = lista(el.items, 6);
  const n = Math.max(1, items.length);
  const cols = n <= 3 ? n : n === 4 ? 2 : 3;
  const filas = Math.ceil(n / cols);
  const W = pu(el.ancho, 86);
  const gap = 22;
  const cw = (W - gap * (cols - 1)) / cols;
  const ch = 196;
  return { items, cols, filas, W, gap, cw, ch, H: filas * ch + (filas - 1) * gap };
}

export function medidasCta(el: El) {
  const contactos = lista(el.contactos, 4);
  const w = pu(el.ancho, 84);
  const tituloH = 128;
  const subH = txt(el.subtitulo) ? 62 : 0;
  const fila = 74;
  const botonH = txt(el.boton) ? 112 : 0;
  return { contactos, w, tituloH, subH, fila, botonH, h: 48 + tituloH + subH + contactos.length * fila + botonH + 24 };
}

export function medidasPrecio(el: El) {
  const fs = acotar(pu(el.tam, 15), 70, 170);
  const monto = formatoMonto(el.valor);
  const moneda = txt(el.moneda);
  const sufijo = txt(el.sufijo);
  const operacion = txt(el.operacion);
  const detalle = txt(el.detalle);
  const wMonto = anchoEstimado(monto, fs, 900) + (moneda ? anchoEstimado(moneda, fs * 0.42, 800) + 16 : 0) + (sufijo ? anchoEstimado(sufijo, fs * 0.34, 800) + 18 : 0);
  const pillW = operacion ? anchoEstimado(operacion, 34, 800) + 76 : 0;
  const detW = detalle ? anchoEstimado(detalle, 34, 700) : 0;
  const pillH = operacion ? 66 : 0;
  const detH = detalle ? 60 : 0;
  return { fs, monto, moneda, sufijo, operacion, detalle, wMonto, pillW, pillH, detH, w: Math.max(wMonto, pillW, detW) + 40, h: pillH + fs * 1.3 + detH + 24 };
}
