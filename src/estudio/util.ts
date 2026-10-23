/**
 * Geometría y animación compartidas por el motor de estudio. Todas las figuras se dibujan con el ORIGEN en el punto de contacto con el suelo
 * (centro de la base): y negativa = hacia arriba. Así la sombra, el reflejo (espejo en y = 0) y el aplastamiento elástico quedan anclados al suelo.
 */
import { useId } from "react";
import { spring } from "remotion";
import { latido } from "../lib/anim";
import type { AnimacionEstudio, FormaEstudio } from "../anim/estudio";

export const W = 1080;
export const H = 1920;
export const FPS = 60;
export const FUENTE = "Inter, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
export const MONO = "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace";
/** tinta de los puntos de semitono y de las sombras */
export const TINTA = "#010A1F";

export const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v));
export const grados = (g: number): number => (g * Math.PI) / 180;

/** id único por instancia, válido dentro de url(#…) (useId trae «:») */
export const useUid = (): string => "u" + useId().replace(/[^a-zA-Z0-9]/g, "");

export type Dim = { w: number; h: number };

/** Ancho y alto de cada figura a partir de su tamaño de referencia (diámetro de la esfera). */
export function dimensiones(forma: FormaEstudio, size: number): Dim {
  switch (forma) {
    case "CAPSULE": return { w: size * 1.6, h: size * 0.52 };
    case "CELLULAR_OVAL": return { w: size * 0.86, h: size * 1.12 };
    case "PILL_TOWER": return { w: size * 0.36, h: size * 1.22 };
    default: return { w: size, h: size };
  }
}

/** Tamaño de referencia más grande (≤ size) con el que la figura cabe en maxW × maxH. */
export function ajustarTam(forma: FormaEstudio, size: number, maxW: number, maxH: number): number {
  const d = dimensiones(forma, 1);
  return Math.min(size, maxW / d.w, maxH / d.h);
}

export const polar = (cx: number, cy: number, rx: number, ry: number, ang: number): [number, number] => [cx + rx * Math.cos(grados(ang)), cy + ry * Math.sin(grados(ang))];

/** Arco de elipse de `a0` a `a1` grados (sentido horario en pantalla). */
export function arco(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, rx, ry, a0);
  const [x1, y1] = polar(cx, cy, rx, ry, a1);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${rx.toFixed(2)} ${ry.toFixed(2)} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export const caminoCirculo = (cx: number, cy: number, r: number): string => `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;

/** Píldora (rectángulo con extremos redondos), base en y = 0. Horizontal si w ≥ h; vertical si h > w. */
export function caminoPildora(w: number, h: number): string {
  const r = Math.min(w, h) / 2;
  const x0 = -w / 2, x1 = w / 2, y0 = -h, y1 = 0;
  if (h > w) return `M ${x0} ${y0 + r} A ${r} ${r} 0 0 1 ${x1} ${y0 + r} L ${x1} ${y1 - r} A ${r} ${r} 0 0 1 ${x0} ${y1 - r} Z`;
  return `M ${x0 + r} ${y0} L ${x1 - r} ${y0} A ${r} ${r} 0 0 1 ${x1 - r} ${y1} L ${x0 + r} ${y1} A ${r} ${r} 0 0 1 ${x0 + r} ${y0} Z`;
}

/** Huevo: más estrecho arriba que abajo, base en y = 0. */
export function caminoHuevo(w: number, h: number): string {
  return `M 0 ${-h} C ${0.31 * w} ${-h} ${0.5 * w} ${-0.68 * h} ${0.5 * w} ${-0.38 * h} C ${0.5 * w} ${-0.12 * h} ${0.27 * w} 0 0 0 C ${-0.27 * w} 0 ${-0.5 * w} ${-0.12 * h} ${-0.5 * w} ${-0.38 * h} C ${-0.5 * w} ${-0.68 * h} ${-0.31 * w} ${-h} 0 ${-h} Z`;
}

/** Coroza (anillo) como camino con regla evenodd. */
export const caminoAnillo = (cx: number, cy: number, R: number, r: number): string => caminoCirculo(cx, cy, R) + " " + caminoCirculo(cx, cy, r);

/* ───────────── animación de la figura ───────────── */

export type MovimientoFigura = {
  /** escala X / Y respecto a la base (ya incluye la entrada) */
  sx: number;
  sy: number;
  /** desplazamiento en px */
  tx: number;
  ty: number;
  /** 0…1: cuánta velocidad lleva (para el largo de la estela) */
  vel: number;
  /** la figura ya apareció */
  visible: boolean;
};

/**
 * Movimiento de la figura según su `animation`. `f` = fotograma local de la escena; `t0` = segundo en que entra.
 *   spring_pop       aparece con rebote y flota
 *   elastic_crawl    se estira y se encoge con ondas desfasadas y avanza como una oruga
 *   high_speed_slide entra desde la izquierda a gran velocidad y frena con rebote
 *   heartbeat_pulse  entra y late «lub-dub»
 */
export function movimientoFigura(anim: AnimacionEstudio, f: number, t0: number): MovimientoFigura {
  const fr = f - t0 * FPS;
  if (fr <= 0) return { sx: 0, sy: 0, tx: anim === "high_speed_slide" ? -1300 : 0, ty: 0, vel: anim === "high_speed_slide" ? 1 : 0, visible: false };
  const t = f / FPS;
  const pop = spring({ frame: fr, fps: FPS, config: { damping: 9, stiffness: 140, mass: 0.7 } });
  switch (anim) {
    case "elastic_crawl": {
      const entra = spring({ frame: fr, fps: FPS, config: { damping: 14, stiffness: 110, mass: 0.8 } });
      const ph = (f / 78) * Math.PI * 2;
      const avance = Math.sin(ph - 0.7);
      return { sx: entra * (1 + 0.14 * Math.sin(ph)), sy: entra * (1 - 0.11 * Math.sin(ph + 0.9)), tx: 110 * Math.sin(f / 170), ty: 0, vel: clamp(0.35 + 0.35 * avance), visible: true };
    }
    case "high_speed_slide": {
      const p = spring({ frame: fr, fps: FPS, config: { damping: 16, stiffness: 70, mass: 0.9 } });
      const resto = clamp(1 - p, 0, 1);
      return { sx: 1 + 0.2 * resto, sy: 1 - 0.08 * resto, tx: -(1 - p) * 1300 + 10 * Math.sin(f / 9) * resto, ty: -6 * Math.sin(f / 52), vel: clamp(resto * 1.6 + 0.18), visible: true };
    }
    case "heartbeat_pulse": {
      const s = pop * (1 + 0.075 * latido(t, 72, t0 + 0.55));
      return { sx: s, sy: s, tx: 0, ty: 0, vel: 0, visible: true };
    }
    default: {
      const s = pop * (1 + 0.012 * Math.sin(f / 38));
      return { sx: s, sy: s, tx: 0, ty: -7 * Math.sin(f / 52), vel: 0.1 * clamp(1 - fr / 60), visible: true };
    }
  }
}
