/**
 * Tiempos de un plan: cuándo empieza cada escena y cuándo aparece/desaparece cada elemento.
 * Lógica pura (sin React): la comparten el render (EscenaDinamica), el sonido automático
 * (scenes/dinamico/sonido.ts) y el validador de Node. Todo sale de las palabras del guion.
 */
import { PalabraT, finAncla, tiempoAncla } from "./anclas";
import type { Elemento, EscenaPlan, Plan } from "./tipos";

const SEPARACION_MIN = 0.8; // una escena nunca dura menos de esto

/** Segundo de inicio de cada escena. La primera siempre arranca en 0 y el orden es estrictamente creciente. */
export function inicioEscenas(escenas: EscenaPlan[], palabras: PalabraT[]): number[] {
  const out: number[] = [];
  escenas.forEach((e, i) => {
    if (i === 0) {
      out.push(0);
      return;
    }
    const t = tiempoAncla(palabras, e.desde, 1, out[i - 1] + SEPARACION_MIN);
    out.push(Math.max(t, out[i - 1] + SEPARACION_MIN));
  });
  return out;
}

export function tiemposElemento(el: Elemento, ini: number, fin: number, palabras: PalabraT[]): { t0: number; t1: number } {
  const base = tiempoAncla(palabras, el.cuando, el.n ?? 1, ini);
  const t0 = Math.max(ini - 0.15, base + (typeof el.desfase === "number" ? el.desfase : 0));
  let t1 = 9999;
  if (el.hasta) {
    const h = finAncla(palabras, el.hasta, 1, 9999);
    if (h > t0 + 0.4) t1 = h;
  }
  void fin;
  return { t0, t1 };
}

/** Duración total estimada del video (voz + cola) a partir de las palabras. */
export const duracionTotal = (palabras: PalabraT[]): number => (palabras.length ? palabras[palabras.length - 1].end : 0) + 1;

export type PlanTiempos = { inicios: number[]; fines: number[] };
export function tiemposDePlan(plan: Plan, palabras: PalabraT[]): PlanTiempos {
  const inicios = inicioEscenas(plan.escenas, palabras);
  const total = duracionTotal(palabras);
  const fines = inicios.map((_, i) => (i < inicios.length - 1 ? inicios[i + 1] : total));
  return { inicios, fines };
}
