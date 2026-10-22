import { Easing, interpolate, spring, useCurrentFrame } from "remotion";
import { FPS } from "./colores";

/** Tiempo absoluto del video en segundos (las escenas no usan <Sequence>, así que es global). */
export const useT = (): number => useCurrentFrame() / FPS;

export const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v));

type Facil = (n: number) => number;

/** Progreso 0→1 entre `ini` y `ini+dur` segundos, con easing. */
export const prog = (t: number, ini: number, dur: number, easing: Facil = Easing.out(Easing.cubic)): number =>
  interpolate(t, [ini, ini + Math.max(dur, 0.0001)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** Progreso 1→0 (para salidas). */
export const progInv = (t: number, ini: number, dur: number, easing?: Facil): number => 1 - prog(t, ini, dur, easing);

/** `spring()` de Remotion retrasado hasta `ini` segundos. Devuelve 0 antes de empezar. */
export const resorte = (
  t: number,
  ini: number,
  config: { damping?: number; stiffness?: number; mass?: number; overshootClamping?: boolean } = {},
): number => {
  const frame = (t - ini) * FPS;
  if (frame <= 0) return 0;
  return spring({ frame, fps: FPS, config: { damping: 13, stiffness: 150, mass: 0.7, ...config } });
};

/** Entrada con rebote suave 0→(≈1.0) usada por etiquetas y piezas que "aparecen". */
export const pop = (t: number, ini: number): number => resorte(t, ini, { damping: 11, stiffness: 190, mass: 0.6 });

/** Intervalo [a,b] con fundido de entrada y salida; 1 mientras está visible. */
export const ventana = (t: number, a: number, b: number, fade = 0.25): number =>
  Math.min(prog(t, a, fade, Easing.out(Easing.quad)), b >= 9000 ? 1 : 1 - prog(t, b - fade, fade, Easing.in(Easing.quad)));

/** Oscilación suave 0..1. */
export const onda = (t: number, periodo: number, fase = 0): number =>
  0.5 + 0.5 * Math.sin(((t / periodo) + fase) * Math.PI * 2);

/** Latido "lub-dub" 0..1 con `bpm` pulsaciones por minuto (antes de `t0` vale 0). */
export function latido(t: number, bpm = 72, t0 = 0): number {
  if (t < t0) return 0;
  const T = 60 / bpm;
  const ph = (((t - t0) % T) + T) % T / T;
  const g = (c: number, w: number) => Math.exp(-Math.pow((ph - c) / w, 2));
  return Math.min(1, g(0.05, 0.05) + 0.7 * g(0.3, 0.055));
}

/** Pseudoaleatorio determinista (los renders deben ser idénticos en cada pasada). */
export function azar(semilla: number): number {
  const s = Math.sin(semilla * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Sacudida de cámara tras un impacto en `t0`: amplitud px, decae en `dur` s. */
export function sacudida(t: number, t0: number, amp = 10, dur = 0.45): { x: number; y: number } {
  const dt = t - t0;
  if (dt < 0 || dt > dur) return { x: 0, y: 0 };
  const k = Math.pow(1 - dt / dur, 2) * amp;
  return { x: Math.sin(dt * 90) * k, y: Math.cos(dt * 73) * k * 0.7 };
}

export const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
