/**
 * Cajas (en píxeles del video) que ocupa cada elemento de un plan, calculadas con las mismas medidas
 * que usa el render. Lógica pura (sin React): la usa el validador de Node para detectar solapes,
 * textos fuera de margen y composiciones descompensadas ANTES de gastar minutos de render.
 */
import { anchoEstimado } from "../lib/texto";
import { curvaPreset, yEn } from "./curvas";
import { medidasCta, medidasFicha, medidasLista, medidasPrecio } from "./layout-negocio";
import { pu, px, py } from "./medidas";
import type { Elemento } from "./tipos";

export type Caja = { x0: number; y0: number; x1: number; y1: number };
export type Clase = "pieza" | "texto" | "trazo" | "fondo";
export type Pieza = { caja: Caja; clase: Clase; nombre: string };

const num = (v: unknown, d: number): number => (typeof v === "number" && Number.isFinite(v) ? v : d);
const txt = (v: unknown): string => (typeof v === "string" ? v : "");
const lineasDe = (v: unknown): string[] => txt(v).split(/\\n|\n/);
const centrada = (cx: number, cy: number, w: number, h: number): Caja => ({ x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 });
const acotar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Márgenes locales a los que el render recorta los textos (80 px + holgura del zoom de cámara). */
export const MARGEN_LOCAL = 102;

function cajaEtiqueta(el: Elemento, nombre: string): Pieza {
  const fs = ({ s: 30, m: 36, l: 44 } as Record<string, number>)[txt(el.tam)] ?? 36;
  const lineas = lineasDe(el.texto);
  const w = Math.max(...lineas.map((l) => anchoEstimado(l, fs, 700)), 10) + fs * 1.2;
  const h = lineas.length * fs * 1.22 + fs * 0.68;
  const izq = acotar(px(el.x) - w / 2, MARGEN_LOCAL, 1080 - MARGEN_LOCAL - w);
  return { caja: { x0: izq, y0: py(el.y) - h / 2, x1: izq + w, y1: py(el.y) + h / 2 }, clase: "texto", nombre };
}

/** Todas las cajas de un elemento (casi siempre una; las gráficas añaden sus etiquetas de marcadores). */
export function cajasDe(el: Elemento): Pieza[] {
  const x = px(el.x);
  const y = py(el.y);
  const t = el.tipo;
  switch (t) {
    case "corazon": {
      const w = pu(el.tam, 38);
      return [{ caja: centrada(x, y, w, w * 1.3), clase: "pieza", nombre: t }];
    }
    case "cerebro": {
      const w = pu(el.tam, 50);
      return [{ caja: centrada(x, y, w, w * 0.86), clase: "pieza", nombre: t }];
    }
    case "cuerpo": {
      const w = pu(el.tam, 60);
      const h = w * 1.4;
      const arriba = y - h / 2;
      return [
        { caja: { x0: x - w * 0.1, y0: arriba, x1: x + w * 0.1, y1: arriba + h * 0.22 }, clase: "pieza", nombre: t },
        { caja: { x0: x - w / 2, y0: arriba + h * 0.19, x1: x + w / 2, y1: arriba + h }, clase: "pieza", nombre: t },
      ];
    }
    case "brazo": {
      const h = pu(el.tam, 40);
      return [{ caja: centrada(x, y, h * 0.3, h), clase: "pieza", nombre: t }];
    }
    case "columna": {
      const h = pu(el.tam, 70);
      return [{ caja: centrada(x, y, h * 0.6, h), clase: "pieza", nombre: t }];
    }
    case "corte-medula": {
      const w = pu(el.tam, 60);
      return [{ caja: centrada(x, y, w, w * 0.84), clase: "pieza", nombre: t }];
    }
    case "organo": {
      const w = pu(el.tam, 40);
      const razon: Record<string, number> = { pulmones: 0.9, rinon: 1.33, higado: 0.64, estomago: 1.27, pancreas: 0.42, hueso: 1.67 };
      return [{ caja: centrada(x, y, w, w * (razon[txt(el.organo)] ?? 1)), clase: "pieza", nombre: t }];
    }
    case "celula": {
      const w = pu(el.tam, 30);
      return [{ caja: centrada(x, y, w, el.forma === "alargada" ? w * 0.4 : w), clase: "pieza", nombre: t }];
    }
    case "membrana": {
      const w = pu(el.ancho, 70);
      const h = pu(14);
      return [{ caja: centrada(x, y - pu(1), w, h), clase: "pieza", nombre: t }];
    }
    case "neurona": {
      const w = pu(el.tam, 80);
      return [{ caja: centrada(x, y, w, w * 0.38), clase: "pieza", nombre: t }];
    }
    case "grafica":
    case "pasos":
    case "comparacion": {
      const w = pu(el.ancho, t === "pasos" ? 58 : 80);
      const h = pu(el.alto, t === "pasos" ? 76 : t === "comparacion" ? 56 : 42);
      const out: Pieza[] = [{ caja: centrada(x, y, w, h), clase: "pieza", nombre: t }];
      if (t === "grafica" && Array.isArray(el.marcadores)) {
        const { pts } = curvaPreset(txt(el.grafica), el.puntos);
        const W = pu(el.ancho, 80);
        const H = pu(el.alto, 42);
        const ox = x - W / 2;
        const oy = y + H / 2;
        (el.marcadores as Elemento[]).slice(0, 5).forEach((m) => {
          const fx = acotar(num(m.x, 0.5), 0, 1);
          const X = ox + 16 + fx * (W - 32);
          const Y = oy - 12 - yEn(pts, fx) * (H - 36);
          const arriba = Y - 90 > 420;
          const e = cajaEtiqueta({ tipo: "etiqueta", cuando: "", texto: m.texto, tam: "s", x: (X - 100) / 8.8, y: ((arriba ? Y - 84 : Y + 84) - 410) / 8.8 } as Elemento, "marcador");
          out.push(e);
        });
      }
      return out;
    }
    case "dato": {
      const fs = acotar(pu(el.tam, 14), 60, 190);
      const w = anchoEstimado(txt(el.valor) || "—", fs, 900) + (txt(el.unidad) ? anchoEstimado(txt(el.unidad), fs * 0.42, 800) + 16 : 0);
      const y0 = y - fs * 0.65;
      const y1 = y + fs * 0.35 + (txt(el.etiqueta) ? 62 : 0);
      return [{ caja: { x0: x - w / 2, y0, x1: x + w / 2, y1 }, clase: "texto", nombre: t }];
    }
    case "etiqueta":
      return [cajaEtiqueta(el, t)];
    case "rotulo": {
      const fs = acotar(pu(el.tam, 12), 40, 220);
      const w = anchoEstimado(txt(el.texto), fs, 900);
      const cx = acotar(x, MARGEN_LOCAL + w / 2, 1080 - MARGEN_LOCAL - w / 2);
      return [{ caja: centrada(cx, y, w, fs * 0.85), clase: "texto", nombre: t }];
    }
    case "molecula": {
      const r = ({ s: 26, m: 34, l: 46 } as Record<string, number>)[txt(el.tam)] ?? 34;
      const fs = r * 0.78;
      const ancho = anchoEstimado(txt(el.simbolo) || "?", fs, 800);
      const w = ancho + 30 > r * 2 ? ancho + 36 : r * 2;
      return [{ caja: centrada(x, y, w + 24, r * 2 + 24), clase: "texto", nombre: t }];
    }
    case "icono": {
      const s = pu(el.tam, 10);
      return [{ caja: centrada(x, y, s, s), clase: "texto", nombre: t }];
    }
    case "forma": {
      const w = pu(el.ancho, 20);
      const h = el.forma === "circulo" ? w : pu(el.alto, 20);
      const tenue = !el.relleno || num(el.opacidad, 0.35) < 0.45;
      return [{ caja: centrada(x, y, w, h), clase: tenue ? "fondo" : "pieza", nombre: t }];
    }
    case "foto": {
      const w = pu(el.ancho, 80);
      const h = pu(el.alto, 56);
      return [{ caja: centrada(x, y, w, h), clase: "pieza", nombre: t }];
    }
    case "logo": {
      const w = pu(el.tam, 22);
      return [{ caja: centrada(x, y, w, w * 0.55), clase: "pieza", nombre: t }];
    }
    case "lista": {
      const m = medidasLista(el);
      return [{ caja: centrada(x, y, m.w, m.h), clase: "pieza", nombre: t }];
    }
    case "cta": {
      const m = medidasCta(el);
      return [{ caja: centrada(x, y, m.w, m.h), clase: "pieza", nombre: t }];
    }
    case "ficha": {
      const m = medidasFicha(el);
      return [{ caja: centrada(x, y, m.W, m.H), clase: "pieza", nombre: t }];
    }
    case "precio": {
      const m = medidasPrecio(el);
      return [{ caja: centrada(x, y, m.w, m.h), clase: "pieza", nombre: t }];
    }
    case "cinta": {
      const fs = acotar(pu(el.tam, 6), 30, 90);
      const lin = lineasDe(el.texto);
      const w = Math.max(...lin.map((l) => anchoEstimado(l, fs, 900)), 10) + fs * 1.4;
      return [{ caja: centrada(x, y, w, lin.length * fs * 1.15 + fs * 0.7), clase: "texto", nombre: t }];
    }
    case "mapa": {
      const w = pu(el.ancho, 84);
      const h = pu(el.alto, 56);
      return [{ caja: centrada(x, y, w, h), clase: "pieza", nombre: t }];
    }
    case "casa": {
      const w = pu(el.tam, 50);
      return [{ caja: centrada(x, y, w, w * 0.95), clase: "pieza", nombre: t }];
    }
    case "svg-libre": {
      const s = pu(el.tam, 20);
      return [{ caja: centrada(x, y, s, s), clase: "pieza", nombre: t }];
    }
    case "vaso":
    case "linea":
    case "particulas":
    case "impulso": {
      const r = el.ruta ?? el.puntos;
      if (!Array.isArray(r) || r.length < 2) return [];
      const xs = (r as number[][]).map((p) => px(p[0]));
      const ys = (r as number[][]).map((p) => py(p[1]));
      return [{ caja: { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }, clase: "trazo", nombre: t }];
    }
    case "aros":
    case "halo":
    case "rayos": {
      const r = pu(el.radio, 12);
      return [{ caja: centrada(x, y, r * 2, r * 2), clase: "trazo", nombre: t }];
    }
    default:
      return [];
  }
}

export const area = (c: Caja): number => Math.max(0, c.x1 - c.x0) * Math.max(0, c.y1 - c.y0);
export const interseccion = (a: Caja, b: Caja): Caja => ({ x0: Math.max(a.x0, b.x0), y0: Math.max(a.y0, b.y0), x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1) });

/** Elementos que se mueven por sí solos (cuentan como "no hay pantalla muerta" aunque no aparezca nada nuevo). */
export const TIPOS_CON_MOVIMIENTO = new Set(["corazon", "particulas", "impulso", "aros", "rayos", "halo", "neurona", "molecula", "grafica", "foto", "precio", "mapa", "cta", "casa"]);
