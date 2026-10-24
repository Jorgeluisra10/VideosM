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

/** Música de fondo del motor viral: pista sintetizada en bucle (public/audios/musica.wav), volumen y rampas de entrada y salida (s). */
export const MUSICA = { archivo: "audios/musica.wav", volumen: 0.1, entrada: 1.2, salida: 1.6 } as const;

/** La música va con el interruptor de sonido: solo suena si la animación la pide Y los SFX están activados. */
export const llevaMusica = (anim: Pick<Animacion, "sfx" | "musica">): boolean => !!anim.sfx && !!anim.musica;
