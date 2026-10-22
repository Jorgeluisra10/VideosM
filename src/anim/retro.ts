import { easeRetro, prog } from "../lib/anim";
import type { Medidor } from "./tipos";

/** Segundos que un medidor sigue «activo» (borde lima 6 px) después de terminar de moverse. */
export const RETENCION_ACTIVO = 0.5;

/** Progreso 0→1 del cambio de un medidor, con la curva global retro. Es el ÚNICO reloj de aguja, número, borde y modelo: así se mueven en el mismo fotograma. */
export const progMedidor = (m: Medidor, t: number): number => prog(t, m.t, m.dur, easeRetro);

export const valorMedidor = (m: Medidor, t: number): number => m.inicio + (m.fin - m.inicio) * progMedidor(m, t);

/** 0…1 dentro del rango [min, max] del medidor. */
export const normMedidor = (m: Medidor, t: number): number => Math.min(1, Math.max(0, (valorMedidor(m, t) - m.min) / (m.max - m.min)));

export const medidorActivo = (m: Medidor, t: number): boolean => t >= m.t && t < m.t + m.dur + RETENCION_ACTIVO;

/** Hex «#RRGGBB» → [r,g,b] 0…1 SIN conversión de espacio de color (el shader NPR escribe los colores tal cual: hex exacto en pantalla). */
export const hexARgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];

/** Mezcla de dos hex (k = 0 → a, k = 1 → b). */
export const mezclarHex = (a: string, b: string, k: number): string => {
  const A = hexARgb(a), B = hexARgb(b);
  return "#" + A.map((v, i) => Math.round((v + (B[i] - v) * k) * 255).toString(16).padStart(2, "0")).join("");
};
