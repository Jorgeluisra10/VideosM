import type { Animacion, EventoSfx } from "./tipos";
import { FPS_ANIM } from "./parser";

export type SfxAbs = { frame: number; tipo: EventoSfx["tipo"]; vol: number };

/**
 * Lista de efectos con fotograma ABSOLUTO. Si el usuario apagó los SFX (anim.sfx === false) devuelve [] y NO se
 * monta ningún <Audio> ni se mezcla ninguna pista. Si la IA no pidió ninguno en una escena, se pone un whoosh de entrada.
 */
export function eventosSfx(anim: Pick<Animacion, "sfx" | "escenas">): SfxAbs[] {
  if (!anim.sfx) return [];
  const salida: SfxAbs[] = [];
  anim.escenas.forEach((esc, k) => {
    const propios = (esc.sfx ?? []).filter((e) => e.t >= 0 && e.t < esc.dur);
    const lista = propios.length ? propios : k > 0 ? [{ t: 0.05, tipo: "whoosh" as const, vol: 0.15 }] : [];
    for (const e of lista) salida.push({ frame: Math.round((esc.inicio + e.t) * FPS_ANIM), tipo: e.tipo, vol: Math.min(0.4, Math.max(0.02, e.vol || 0.15)) });
  });
  return salida.sort((a, b) => a.frame - b.frame);
}
