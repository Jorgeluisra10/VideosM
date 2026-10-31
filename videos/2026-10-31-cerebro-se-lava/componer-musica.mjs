#!/usr/bin/env node
/**
 * Pista propia (síntesis aditiva, sin muestras ni licencias) para «Tu cerebro se lava mientras duermes» (sin voz: la música ES la narración).
 *   0,0 –  4,2 s  NOCHE · drone grave (La 55 Hz), latido lento, brillo agudo y un riser que desemboca en la ola (≈ 3,7 s)
 *   4,2 –  8,8 s  TRABAJO · pulso de neuronas (ticks sincopados) con tensión disonante creciente
 *   8,8 – 14,2 s  FLUJO · acordes de pad (Lam–Fa–Do–Sol) y arpegio de campanas como agua que corre
 *  14,2 – 23,8 s  CALMA · pad cálido y ancho, notas de campana espaciadas, graves suaves: el sueño profundo
 *  23,8 – 29,0 s  OLAS · pulso lento de 20 «s» comprimido, ondulación de ruido filtrado
 *  29,0 – 34,0 s  CAUTELA · segunda menor suave y tic-tac; sube la tensión honesta
 *  34,0 – 37,6 s  CIERRE · resuelve a La mayor, campana final y cola
 * Uso:  node videos/2026-10-31-cerebro-se-lava/componer-musica.mjs   → assets/musica/cerebro-se-lava.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/cerebro-se-lava.wav   (después: --restaurar)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 38;
const N = Math.round(DURACION * SR);
const L = new Float32Array(N), Rr = new Float32Array(N);
const TAU = Math.PI * 2;
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(2026);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sua = (v, a, b) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const nota = (m) => 440 * Math.pow(2, (m - 69) / 12);
/** suma una voz mono a ambos canales con paneo p (-1…1) */
const add = (t0, dur, fn, p = 0) => {
  const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round((t0 + dur) * SR));
  const gl = Math.cos(((p + 1) * Math.PI) / 4), gr = Math.sin(((p + 1) * Math.PI) / 4);
  for (let i = i0; i < i1; i++) { const v = fn((i - i0) / SR, i / SR); L[i] += v * gl; Rr[i] += v * gr; }
};
const pad = (t0, dur, midis, vol, p = 0) => {
  for (const [k, m] of midis.entries()) {
    const f = nota(m), det = 1 + (k % 2 ? 0.0023 : -0.0019);
    add(t0, dur, (t, T) => vol * sua(t, 0, 1.6) * (1 - sua(t, dur - 1.6, dur)) * (Math.sin(TAU * f * T) + 0.5 * Math.sin(TAU * f * det * T + 0.4) + 0.18 * Math.sin(TAU * f * 2 * T) * (0.6 + 0.4 * Math.sin(TAU * 0.2 * T + k))), p + (k - 1.5) * 0.18);
  }
};
const campana = (t0, m, vol, p = 0) => {
  const f = nota(m);
  add(t0, 3.2, (t) => vol * Math.exp(-t * 1.5) * Math.min(1, t / 0.004) * (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 2.01 * t) * Math.exp(-t * 2) + 0.3 * Math.sin(TAU * f * 3.99 * t) * Math.exp(-t * 4) + 0.15 * Math.sin(TAU * f * 5.43 * t) * Math.exp(-t * 7)), p);
};
const latido = (t0, vol) => add(t0, 0.5, (t) => vol * (Math.exp(-t * 20) + 0.7 * Math.exp(-Math.max(0, t - 0.17) * 22) * (t > 0.17 ? 1 : 0)) * Math.sin(TAU * 52 * t));
const sub = (t0, dur, f, vol) => add(t0, dur, (t) => vol * sua(t, 0, 0.8) * (1 - sua(t, dur - 1, dur)) * Math.sin(TAU * f * t));

// ── NOCHE 0 → 4,2
sub(0, 5, 55, 0.34);
add(0, 5, (t, T) => 0.05 * sua(t, 0, 2) * (Math.sin(TAU * 220 * T) + Math.sin(TAU * 220.9 * T)), 0);
[0.4, 1.5, 2.6].forEach((t0) => latido(t0, 0.22));
add(0.4, 3.4, (t, T) => 0.035 * sua(t, 0, 1.5) * Math.sin(TAU * (2200 + 600 * Math.sin(TAU * 0.3 * T)) * T) * (0.5 + 0.5 * Math.sin(TAU * 5 * T)), 0.6);
// riser hacia la ola (2,3 → 3,7)
{ let ph = 0; add(2.3, 1.4, (t) => { const u = t / 1.4; ph += (220 * Math.pow(8, u)) / SR; return 0.07 * u * Math.sin(TAU * ph); }, -0.3); }
add(2.7, 1.3, (t) => { const u = t / 1.3; return 0.12 * u * u * (R() * 2 - 1) * Math.sin(Math.PI * clamp(u)); });

// ── BLOOM de la ola (3,7)
pad(3.7, 1.4, [57, 64, 69, 72], 0.045);
campana(3.7, 81, 0.12, 0.2);

// ── TRABAJO 4,2 → 8,8 : pulso de neuronas
for (let b = 0; b < 12; b++) {
  const t0 = 4.2 + b * 0.38 + (b % 3 === 2 ? 0.12 : 0);
  add(t0, 0.09, (t) => 0.2 * Math.exp(-t * 60) * Math.sin(TAU * (b % 2 ? 1500 : 1100) * t) * (0.6 + 0.4 * sua(t0, 4.2, 8.8)), (b % 4 - 1.5) * 0.4);
}
sub(4.2, 4.8, 55, 0.3);
pad(4.2, 4.8, [45, 57, 60, 63], 0.04 + 0, -0.1); // La menor con 3ª menor
add(6.0, 2.8, (t, T) => 0.05 * sua(t, 0, 2.6) * Math.sin(TAU * nota(70) * T) * (0.6 + 0.4 * Math.sin(TAU * 4 * T)), 0.3); // sib disonante creciente
[4.2, 5.6, 7.0, 8.2].forEach((t0) => latido(t0, 0.14));

// ── FLUJO 8,8 → 14,2 : Lam – Fa – Do – Sol + arpegio de campanas
const acordes = [[45, 57, 60, 64], [41, 53, 57, 60], [48, 55, 60, 64], [43, 55, 59, 62]];
acordes.forEach((c, i) => pad(8.8 + i * 1.35, 1.9, c, 0.05));
const arp = [69, 72, 76, 79, 76, 72, 74, 77, 81, 77, 74, 71, 67, 71, 74, 79];
arp.forEach((m, i) => campana(8.9 + i * 0.335, m, 0.075, Math.sin(i) * 0.6));
sub(8.8, 5.4, 55, 0.24);

// ── CALMA 14,2 → 23,8 : el sueño profundo
const calma = [[45, 52, 57, 64], [41, 48, 57, 65], [48, 55, 60, 67], [43, 50, 59, 66]];
calma.forEach((c, i) => pad(14.2 + i * 2.4, 3.2, c, 0.055));
sub(14.2, 9.6, 55, 0.2);
[[14.6, 76], [16.6, 79], [18.2, 81], [19.3, 76], [20.6, 72], [22.0, 74], [23.0, 69]].forEach(([t, m], i) => campana(t, m, 0.09, (i % 2 ? 0.4 : -0.4)));
// marea: ruido filtrado que respira cada ≈ 4 s
{ let lp = 0; add(14.2, 9.6, (t, T) => { lp += 0.012 * ((R() * 2 - 1) - lp); return 0.9 * lp * (0.5 + 0.5 * Math.sin(TAU * 0.24 * T)) * sua(t, 0, 2) * (1 - sua(t, 8.4, 9.6)); }, 0); }
for (const t0 of [14.4, 17.2, 20.0]) latido(t0 + 0.4, 0.09);

// ── OLAS 23,8 → 29 : dos osciladores en batido (EEG vs líquido)
add(23.8, 5.2, (t, T) => 0.1 * sua(t, 0, 1) * (1 - sua(t, 4.4, 5.2)) * (Math.sin(TAU * 110 * T) + Math.sin(TAU * 111.5 * T)) * (0.6 + 0.4 * Math.sin(TAU * 0.35 * T)), 0);
pad(23.8, 5.2, [45, 52, 57, 59], 0.05);
for (let k = 0; k < 4; k++) campana(24.6 + k * 1.2, [76, 79, 74, 72][k], 0.075, k % 2 ? 0.5 : -0.5);
for (let b = 0; b < 14; b++) add(24.2 + b * 0.35, 0.05, (t) => 0.1 * Math.exp(-t * 80) * Math.sin(TAU * 1700 * t), 0.2);

// ── CAUTELA 29 → 34 : la tensión honesta
sub(29, 5.2, 55, 0.26);
add(29, 5.2, (t, T) => 0.05 * sua(t, 0, 1.2) * (1 - sua(t, 4.4, 5.2)) * (Math.sin(TAU * 220 * T) + Math.sin(TAU * 233.1 * T) + 0.6 * Math.sin(TAU * 349.2 * T)), 0);
for (let b = 0; b < 10; b++) add(29.4 + b * 0.5, 0.012, (t) => 0.25 * (R() * 2 - 1) * Math.exp(-t * 400), (b % 2 ? 0.3 : -0.3));
[29.2, 30.4, 31.6, 32.8].forEach((t0) => latido(t0, 0.13 + 0.03 * (t0 - 29)));
{ let ph = 0; add(31.6, 2.4, (t) => { const u = t / 2.4; ph += (300 * Math.pow(3.2, u * u)) / SR; return 0.05 * u * Math.sin(TAU * ph); }, 0); }
campana(33.2, 81, 0.07, 0.3);

// ── CIERRE 34 → 37,6 : resuelve a La mayor
pad(34.0, 4.0, [45, 57, 61, 64, 69], 0.07);
sub(34, 4, 55, 0.3);
campana(34.0, 81, 0.15, 0); campana(34.5, 85, 0.1, 0.4); campana(35.0, 88, 0.09, -0.4); campana(35.6, 93, 0.07, 0.2);
latido(34.1, 0.2);

// ── reverberación simple (3 retardos) para dar espacio
const eco = (buf, tms, g) => { const d = Math.round((tms / 1000) * SR); for (let i = N - 1; i >= d; i--) buf[i] += buf[i - d] * g; };
for (const buf of [L, Rr]) { eco(buf, 173, 0.28); eco(buf, 281, 0.2); eco(buf, 433, 0.14); }
// ── salida: limitador suave y fundidos
let pico = 0;
for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(L[i]), Math.abs(Rr[i]));
const g = 0.9 / Math.max(0.0001, pico);
const mono = new Float32Array(N);
for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * g * 1.15) * 0.9; Rr[i] = Math.tanh(Rr[i] * g * 1.15) * 0.9; mono[i] = (L[i] + Rr[i]) / 2; }
const f = Math.round(0.4 * SR);
for (let i = 0; i < f; i++) mono[N - 1 - i] *= i / f;
mkdirSync(join(RAIZ, "assets", "musica"), { recursive: true });
const salida = join(RAIZ, "assets", "musica", "cerebro-se-lava.wav");
escribirWavEstereo(salida, mono);
console.log(`✅ ${salida} · ${DURACION} s`);
