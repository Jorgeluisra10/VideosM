#!/usr/bin/env node
/**
 * Pista propia (síntesis aditiva, sin muestras ni licencias) para «¿Tu intestino es un segundo cerebro?» (sin voz: la música sigue a las escenas).
 *   0,0 –  4,4 s  GANCHO · misterio: pad en Mi menor, pulsos que se encienden con la red de neuronas (0,8 → 3,2 s), campana al rotular (3,4 s)
 *   4,4 – 10,1 s  ESCALA · pizzicato juguetón; a los 9,0 s golpe seco: «no es un segundo cerebro»
 *  10,1 – 15,1 s  AUTÓNOMO · latido y, a los 12,3 s, el corte: descarga; luego un ritmo constante (sigue solo)
 *  15,1 – 20,9 s  PERISTALSIS · pulsos graves que ruedan cada 0,7 s con barrido de tono
 *  20,9 – 26,5 s  HIRSCHSPRUNG · pad disonante y golpes graves cuando se acumula el alimento (22,7 / 23,2 / 23,7 s)
 *  26,5 – 32,5 s  SEROTONINA · arpegio brillante ascendente que se corta con un golpe a los 29,7 s
 *  32,5 – 37,8 s  VAGO · arpegio que sube (80 %) con unas pocas notas que bajan (20 %)
 *  37,8 – 43,0 s  CIERRE · acordes cálidos y pulsos que se encuentran
 *  43,0 – 46,8 s  CTA · resuelve a Mi mayor y cola
 * Uso:  node videos/2026-11-01-intestino-segundo-cerebro/componer-musica.mjs   → assets/musica/intestino-segundo-cerebro.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/intestino-segundo-cerebro.wav   (después: --restaurar)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 46.8;
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



const eco = (buf, tms, g) => { const d = Math.round((tms / 1000) * SR); for (let i = N - 1; i >= d; i--) buf[i] += buf[i - d] * g; };
const tick = (t0, vol, f = 1500) => add(t0, 0.08, (t) => vol * Math.exp(-t * 70) * Math.sin(TAU * f * t));
const pluck = (t0, m, vol, p = 0) => { const f = nota(m); add(t0, 0.7, (t) => vol * Math.exp(-t * 7) * Math.min(1, t / 0.003) * (Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * f * 2 * t) * Math.exp(-t * 10))); void p; };
const zap = (t0, vol) => { let ph = 0; add(t0, 0.28, (t) => { const u = t / 0.28; ph += (900 * Math.pow(0.25, u)) / SR; return vol * (1 - u) * Math.sign(Math.sin(TAU * ph)) * 0.6; }); };
const golpe = (t0, vol, f = 60) => add(t0, 0.5, (t) => vol * Math.exp(-t * 8) * Math.sin(TAU * f * t));
const rodar = (t0, vol) => { let ph = 0; add(t0, 0.6, (t) => { const u = t / 0.6; ph += (60 + 30 * Math.sin(Math.PI * u)) / SR; return vol * Math.sin(Math.PI * u) * Math.sin(TAU * ph * 1); }); };

// ── GANCHO 0 → 4,4
sub(0, 4.8, 41, 0.3);
pad(0, 4.8, [52, 59, 64, 67], 0.045);
[0.3, 1.2, 2.1, 3.0].forEach((t0) => latido(t0, 0.14));
for (let b = 0; b < 12; b++) tick(0.8 + b * 0.2, 0.05 + 0.1 * (b / 12), 1100 + b * 90);
campana(3.4, 83, 0.13, 0.2); campana(3.6, 88, 0.09, -0.3);

// ── ESCALA 4,4 → 10,1
const E0 = 4.4;
sub(E0, 5.8, 41, 0.22);
pad(E0, 5.8, [48, 55, 60, 64], 0.04);
[[0, 76], [0.45, 79], [0.9, 83], [1.35, 79], [1.8, 76], [2.25, 74], [2.7, 76], [3.15, 79], [3.6, 83], [4.05, 86]].forEach(([t, m], i) => pluck(E0 + 0.3 + t, m, 0.1, i % 2 ? 0.4 : -0.4));
golpe(E0 + 4.6, 0.5); campana(E0 + 4.7, 76, 0.1, 0);

// ── AUTÓNOMO 10,1 → 15,1
const A0 = 10.1;
sub(A0, 5.2, 41, 0.24);
pad(A0, 5.2, [45, 52, 57, 60], 0.045);
[0.3, 1.3].forEach((t0) => latido(A0 + t0, 0.14));
zap(A0 + 2.2, 0.28); golpe(A0 + 2.2, 0.4, 70);
for (let b = 0; b < 8; b++) tick(A0 + 2.9 + b * 0.28, 0.1, b % 2 ? 1400 : 1000);
campana(A0 + 4.2, 81, 0.1, 0);

// ── PERISTALSIS 15,1 → 20,9
const P0 = 15.1;
pad(P0, 6.0, [50, 57, 62, 66], 0.045);
sub(P0, 6.0, 49, 0.2);
for (let k = 0; k < 5; k++) rodar(P0 + 0.8 + k * 0.7, 0.35);
for (let b = 0; b < 14; b++) tick(P0 + 0.5 + b * 0.4, 0.07, 1700);
campana(P0 + 4.4, 78, 0.1, 0.3); campana(P0 + 4.6, 85, 0.08, -0.3);

// ── HIRSCHSPRUNG 20,9 → 26,5
const H0 = 20.9;
sub(H0, 5.8, 41, 0.3);
add(H0, 5.8, (t, T) => 0.05 * sua(t, 0, 1.2) * (1 - sua(t, 5.0, 5.8)) * (Math.sin(TAU * 220 * T) + Math.sin(TAU * 233.1 * T) + 0.6 * Math.sin(TAU * 349.2 * T)));
[1.8, 2.3, 2.8].forEach((t0) => golpe(H0 + t0, 0.38, 50));
zap(H0 + 0.8, 0.14);
latido(H0 + 3.4, 0.2); latido(H0 + 4.4, 0.2);
campana(H0 + 3.8, 71, 0.08, 0);

// ── SEROTONINA 26,5 → 32,5
const S0 = 26.5;
pad(S0, 3.2, [52, 59, 64, 71], 0.05);
sub(S0, 6, 41, 0.22);
[83, 86, 90, 95, 90, 86, 83, 90, 95, 98].forEach((m, i) => campana(S0 + 0.9 + i * 0.22, m, 0.06, Math.sin(i) * 0.6));
golpe(S0 + 3.2, 0.5, 55); add(S0 + 3.2, 0.6, (t) => 0.2 * (R() * 2 - 1) * Math.exp(-t * 14));
pad(S0 + 3.4, 2.8, [45, 52, 57, 59], 0.04);
campana(S0 + 4.8, 76, 0.1, 0);

// ── VAGO 32,5 → 37,8
const V0 = 32.5;
pad(V0, 5.4, [50, 57, 62, 69], 0.05);
sub(V0, 5.4, 45, 0.22);
const subiendo = [62, 66, 69, 74, 78, 81, 86, 90];
subiendo.forEach((m, i) => campana(V0 + 0.8 + i * 0.3, m, 0.07, Math.sin(i) * 0.5));
[1.2, 2.4].forEach((t0, i) => campana(V0 + t0 + 0.12, 88 - i * 4, 0.05, 0.4));
latido(V0 + 3.0, 0.15); golpe(V0 + 3.0, 0.35); campana(V0 + 3.1, 93, 0.12, 0);

// ── CIERRE 37,8 → 43,0
const C0 = 37.8;
[[40, 52, 59, 64], [45, 52, 57, 64], [43, 50, 59, 62], [40, 52, 59, 64]].forEach((c, i) => pad(C0 + i * 1.4, 2.0, c, 0.055));
sub(C0, 5.4, 40, 0.24);
for (let i = 0; i < 4; i++) { zap(C0 + 1.4 + i * 0.6, 0.1); latido(C0 + 1.4 + i * 0.6, 0.1); }
campana(C0 + 3.6, 83, 0.12, 0); campana(C0 + 3.85, 88, 0.09, 0.4);

// ── CTA 43,0 → 46,8
pad(43.0, 3.9, [52, 59, 64, 68, 71], 0.07);
sub(43, 3.8, 40, 0.28);
campana(43.0, 76, 0.13, 0); campana(43.4, 80, 0.1, 0.4); campana(43.9, 83, 0.09, -0.4); campana(44.5, 88, 0.07, 0.2);
latido(43.1, 0.18);

// ── reverberación y salida
for (const buf of [L, Rr]) { eco(buf, 173, 0.28); eco(buf, 281, 0.2); eco(buf, 433, 0.14); }
let pico = 0;
for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(L[i]), Math.abs(Rr[i]));
const g = 0.9 / Math.max(0.0001, pico);
const mono = new Float32Array(N);
for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * g * 1.15) * 0.9; Rr[i] = Math.tanh(Rr[i] * g * 1.15) * 0.9; mono[i] = (L[i] + Rr[i]) / 2; }
const fo = Math.round(0.4 * SR);
for (let i = 0; i < fo; i++) mono[N - 1 - i] *= i / fo;
mkdirSync(join(RAIZ, "assets", "musica"), { recursive: true });
const salida = join(RAIZ, "assets", "musica", "intestino-segundo-cerebro.wav");
escribirWavEstereo(salida, mono);
console.log(`✅ ${salida} · ${DURACION} s`);
