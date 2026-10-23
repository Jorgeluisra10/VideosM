import { easeRetro, prog } from "../lib/anim";
import type { Medidor } from "./tipos";

/** Segundos que un medidor sigue «activo» (borde lima 6 px) después de terminar de moverse. */
export const RETENCION_ACTIVO = 0.5;

type Tramo = { t: number; dur: number; valor: number };
const tramos = (m: Medidor): Tramo[] => (m.claves?.length ? m.claves : [{ t: m.t, dur: m.dur, valor: m.fin }]);

/**
 * Valor del medidor en el instante `t` (s): parte de `inicio` y va de tramo en tramo (cada línea HUD del guion) con la curva global retro.
 * Es el ÚNICO reloj de aguja, número, borde y modelo: por eso se mueven en el mismo fotograma.
 */
export const valorMedidor = (m: Medidor, t: number): number => {
  let previo = m.inicio;
  for (const c of tramos(m)) {
    if (t <= c.t) return previo;
    const p = prog(t, c.t, c.dur, easeRetro);
    if (p < 1) return previo + (c.valor - previo) * p;
    previo = c.valor;
  }
  return previo;
};

/** Progreso 0→1 del tramo en curso (0 si ninguno se está moviendo). */
export const progMedidor = (m: Medidor, t: number): number => {
  for (const c of tramos(m)) if (t >= c.t && t < c.t + c.dur) return prog(t, c.t, c.dur, easeRetro);
  return 0;
};

/** 0…1 dentro del rango [min, max] del medidor. */
export const normMedidor = (m: Medidor, t: number): number => Math.min(1, Math.max(0, (valorMedidor(m, t) - m.min) / (m.max - m.min)));

/** Activo mientras se mueve (y un instante más): borde lima de 6 px. */
export const medidorActivo = (m: Medidor, t: number): boolean => tramos(m).some((c) => t >= c.t && t < c.t + c.dur + RETENCION_ACTIVO);

/** Hex «#RRGGBB» → [r,g,b] 0…1 SIN conversión de espacio de color (el shader NPR escribe los colores tal cual: hex exacto en pantalla). */
export const hexARgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];

/** Mezcla de dos hex (k = 0 → a, k = 1 → b). */
export const mezclarHex = (a: string, b: string, k: number): string => {
  const A = hexARgb(a), B = hexARgb(b);
  return "#" + A.map((v, i) => Math.round((v + (B[i] - v) * k) * 255).toString(16).padStart(2, "0")).join("");
};
