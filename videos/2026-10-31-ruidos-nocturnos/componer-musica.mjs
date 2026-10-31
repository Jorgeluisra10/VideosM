#!/usr/bin/env node
/**
 * Pista propia (síntesis aditiva, sin muestras ni licencias) para «La física de los ruidos nocturnos»: terror que se CORTA en seco y se vuelve laboratorio.
 *
 *   0,0 – 28,9 s  TERROR · drones de 41 Hz con batido lento, clúster disonante (220/233 Hz), pings metálicos con eco y un chillido que sube hasta cortarse
 *   28,9 s        CORTE BRUSCO (5 ms) → silencio de 0,35 s
 *   29,25 – 43 s  CLÍNICO · zumbido de red a 60 Hz + armónicos, clics de laboratorio secos e irregulares, un bip de 1 kHz al cambiar de ficha (34,1 y 39,5 s)
 *   43 – 52 s     la pregunta final: un swell grave que vuelve despacio y un latido (el punto rojo)
 *
 * Uso:  node videos/2026-10-31-ruidos-nocturnos/componer-musica.mjs   → assets/musica/ruidos-nocturnos.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/ruidos-nocturnos.wav
 * Después del render:  node scripts/anim/musica.mjs --restaurar  (el WAV de assets/musica no se sube a git: se regenera con este script).
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const CORTE = 28.9;       // s: el papel entra y la música muere
export const DURACION = 52;      // s
const N = Math.round(DURACION * SR);
const x = new Float32Array(N);
const TAU = Math.PI * 2;

/** PRNG determinista (mulberry32) */
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(314);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sua = (v, a, b) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const add = (t0, dur, fn) => { const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round((t0 + dur) * SR)); for (let i = i0; i < i1; i++) x[i] += fn((i - i0) / SR, i / SR); };

/* ───────── TERROR (0 → CORTE) ───────── */
// 1) drones: 41 Hz y 41,6 Hz (batido de 0,6 Hz) + octava, con crescendo lento
add(0, CORTE, (t, T) => {
  const env = 0.16 + 0.36 * sua(T, 0, CORTE);
  return env * (0.9 * Math.sin(TAU * 41 * T) + 0.8 * Math.sin(TAU * 41.6 * T) + 0.35 * Math.sin(TAU * 82.4 * T + Math.sin(TAU * 0.13 * T)));
});
// 2) clúster disonante (segunda menor + tritono) con tremolo lento, entra a los 3 s
add(3, CORTE - 3, (t, T) => {
  const env = 0.05 * sua(t, 0, 5) * (0.55 + 0.45 * sua(T, 3, CORTE));
  const trem = 0.65 + 0.35 * Math.sin(TAU * (0.22 + 0.5 * sua(T, 10, CORTE)) * T);
  return env * trem * (Math.sin(TAU * 220 * T) + Math.sin(TAU * 233.1 * T) + 0.7 * Math.sin(TAU * 311.1 * T));
});
// 3) respiración: ruido de banda que sube y baja (filtro de un polo, corte creciente)
{
  let lp = 0, lp2 = 0;
  add(0, CORTE, (t, T) => {
    const w = (R() * 2 - 1);
    const a = 0.004 + 0.05 * sua(T, 6, CORTE);
    lp += a * (w - lp); lp2 += a * (lp - lp2);
    return (0.4 + 0.6 * Math.max(0, Math.sin(TAU * 0.17 * T - 1))) * lp2 * (2.0 + 6.0 * sua(T, 6, CORTE));
  });
}
// 4) pings metálicos con eco (pequeñas ráfagas inarmónicas que se repiten atenuadas): «ecos» en el pasillo
const pings = [1.7, 4.3, 6.9, 9.6, 12.8, 14.4, 17.2, 19.0, 21.3, 23.1, 24.6, 25.9, 26.9, 27.7];
for (const p0 of pings) {
  const f = 520 + R() * 900;
  for (let rep = 0; rep < 5; rep++) {
    const gain = 0.05 * Math.pow(0.55, rep) * (0.6 + 0.6 * sua(p0, 0, CORTE));
    add(p0 + rep * 0.43, 1.6, (t) => gain * Math.exp(-t * 3.2) * (Math.sin(TAU * f * t) + 0.6 * Math.sin(TAU * f * 2.76 * t) + 0.35 * Math.sin(TAU * f * 5.4 * t)));
  }
}
// 5) latido grave que se acelera (el pulso del espectador): 1,0 → 2,2 Hz
{
  let fase = 0;
  const latido = (T) => { const f = 1.0 + 1.2 * sua(T, 5, CORTE); fase += f / SR; return fase % 1; };
  add(5, CORTE - 5, (t, T) => {
    const ph = latido(T);
    const g1 = Math.exp(-ph * 22), g2 = Math.exp(-Math.max(0, ph - 0.17) * 24) * (ph > 0.17 ? 1 : 0);
    return (0.16 + 0.12 * sua(T, 5, CORTE)) * (g1 + 0.75 * g2) * Math.sin(TAU * 52 * T);
  });
}
// 6) chillido ascendente que culmina en el corte (dos senos a un semitono de distancia, 380 → 1.900 Hz, con aspereza)
{
  let f1 = 0, f2 = 0;
  add(CORTE - 7.5, 7.5, (t, T) => {
    const u = t / 7.5, f = 380 * Math.pow(5, u * u);
    f1 += (f / SR); f2 += (f * 1.0595 / SR);
    const env = 0.02 + 0.17 * u * u * u;
    return env * (Math.sin(TAU * f1) + Math.sin(TAU * f2) + 0.4 * Math.sin(TAU * f1 * 2 + 0.7 * Math.sin(TAU * 7 * T)));
  });
}
// CORTE BRUSCO: 5 ms de fundido y silencio total hasta el inicio del tono clínico
{
  const i0 = Math.round(CORTE * SR), f = Math.round(0.005 * SR);
  for (let i = i0 - f; i < i0; i++) x[i] *= (i0 - i) / f;
  for (let i = i0; i < Math.round((CORTE + 0.35) * SR); i++) x[i] = 0;
}

/* ───────── CLÍNICO (CORTE + 0,35 → 43) ───────── */
const T0 = CORTE + 0.35, T1 = 43;
// zumbido de red (60 Hz) con armónicos 120/180/300: un osciloscopio sin blindar
add(T0, 52 - T0, (t, T) => {
  const sal = 1 - sua(T, 44, 49);
  const env = 0.075 * sua(t, 0, 0.1) * (T < T1 ? 1 : 0.85 * sal + 0.15);
  return env * (Math.sin(TAU * 60 * T) + 0.55 * Math.sin(TAU * 120 * T + 0.3) + 0.3 * Math.sin(TAU * 180 * T + 0.9) + 0.12 * Math.sin(TAU * 300 * T));
});
// clics de laboratorio: ráfagas de ruido de 1,5 ms, secas, a intervalos irregulares
{
  let t = T0 + 0.5;
  while (t < T1) {
    add(t, 0.004, (u) => 0.62 * (R() * 2 - 1) * Math.exp(-u * 700));
    t += 0.55 + R() * 0.75;
  }
}
// bips de ficha: 1 kHz, 55 ms, con envolvente seca (al cambiar de pantalla: 34,1 y 39,5 s)
for (const b of [34.1, 39.5]) add(b, 0.055, (t) => 0.2 * Math.sin(TAU * 1000 * t) * Math.min(1, t / 0.003) * Math.exp(-t * 18));
// pequeño «tecleo» de teclas cortas durante la caja de datos (34 → 39,5)
for (let k = 0; k < 6; k++) add(35.0 + k * 0.33, 0.01, (u) => 0.3 * (R() * 2 - 1) * Math.exp(-u * 500) * Math.sin(TAU * 2400 * u));

/* ───────── LA PREGUNTA FINAL (43 → 52) ───────── */
add(43, 9, (t, T) => {
  const env = 0.34 * sua(t, 0, 4.5) * (1 - sua(t, 7, 9));
  return env * (Math.sin(TAU * 41 * T) + 0.8 * Math.sin(TAU * 41.7 * T) + 0.3 * Math.sin(TAU * 61.5 * T));
});
for (const b of [46.0, 47.3, 48.6, 49.9]) add(b, 0.5, (t) => 0.2 * Math.exp(-t * 14) * Math.sin(TAU * 52 * t) * (b < 49 ? 1 : 0.7));

/* ───────── limitador suave y salida ───────── */
let pico = 0;
for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(x[i]));
const g = 0.9 / Math.max(0.0001, pico);
for (let i = 0; i < N; i++) x[i] = Math.tanh(x[i] * g * 1.2) * 0.9;
const f = Math.round(0.03 * SR);
for (let i = 0; i < f; i++) { x[N - 1 - i] *= i / f; }
mkdirSync(join(RAIZ, "assets", "musica"), { recursive: true });
const salida = join(RAIZ, "assets", "musica", "ruidos-nocturnos.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s · terror hasta ${CORTE} s, corte en seco y laboratorio clínico después`);
