#!/usr/bin/env node
/**
 * Pista propia (síntesis aditiva, sin muestras ni licencias) para «La dopamina NO es la molécula del placer» (pensada para llevar VOZ de CapCut encima: cama suave y limpia).
 *   0,0 –  4,6 s  GANCHO · pad misterioso y golpe al tachar «placer» (3,1 s)
 *   4,6 – 10,2 s  EXPERIMENTO · gota (5,8 s) y ráfaga de ticks (6,7 s)
 *  10,2 – 16,6 s  PREDICCIÓN · ráfaga en cada caso (11,5 / 12,7 / 14,5 s) y caída grave (15,3 s)
 *  16,6 – 23,0 s  QUERER · barrido que baja (17,0 → 18,7 s) y barrido que sube (19,9 → 21,6 s) con golpe
 *  23,0 – 28,8 s  RUTAS · tres descargas (24,0 / 24,75 / 25,5 s) y pad abierto
 *  28,8 – 33,6 s  DEBATE · tic-tac de balanza alternado
 *  33,6 – 38,6 s  CIERRE · aros de radar, golpe (36,7 s) y resolución
 *  38,6 – 42,4 s  CTA · Mi mayor y cola
 * Uso:  node videos/2026-11-01-dopamina-no-es-placer/componer-musica.mjs   → assets/musica/dopamina-no-es-placer.wav
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 42.4;
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



const tick = (t0, vol, f = 1500) => add(t0, 0.08, (t) => vol * Math.exp(-t * 70) * Math.sin(TAU * f * t));
const pluck = (t0, m, vol, p = 0) => { const f = nota(m); add(t0, 0.7, (t) => vol * Math.exp(-t * 7) * Math.min(1, t / 0.003) * (Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * f * 2 * t) * Math.exp(-t * 10))); void p; };
const zap = (t0, vol) => { let ph = 0; add(t0, 0.28, (t) => { const u = t / 0.28; ph += (900 * Math.pow(0.25, u)) / SR; return vol * (1 - u) * Math.sign(Math.sin(TAU * ph)) * 0.6; }); };
const golpe = (t0, vol, f = 60) => add(t0, 0.5, (t) => vol * Math.exp(-t * 8) * Math.sin(TAU * f * t));
const rodar = (t0, vol) => { let ph = 0; add(t0, 0.6, (t) => { const u = t / 0.6; ph += (60 + 30 * Math.sin(Math.PI * u)) / SR; return vol * Math.sin(Math.PI * u) * Math.sin(TAU * ph * 1); }); };


const eco = (buf, tms, g) => { const d = Math.round((tms / 1000) * SR); for (let i = N - 1; i >= d; i--) buf[i] += buf[i - d] * g; };
const barrido = (t0, dur, f0, f1, vol) => { let ph = 0; add(t0, dur, (t) => { const u = t / dur; ph += (f0 * Math.pow(f1 / f0, u)) / SR; return vol * Math.sin(Math.PI * u) * (Math.sin(TAU * ph) + 0.4 * Math.sin(TAU * ph * 2.01)); }); };

// ── GANCHO 0 → 4,6
sub(0, 5, 41, 0.28);
pad(0, 5, [52, 59, 64, 67], 0.045);
[0.4, 1.4, 2.4].forEach((t0) => latido(t0, 0.13));
{ let ph = 0; add(1.6, 1.5, (t) => { const u = t / 1.5; ph += (200 * Math.pow(6, u)) / SR; return 0.05 * u * Math.sin(TAU * ph); }, 0.2); }
golpe(3.1, 0.5, 58); add(3.1, 0.3, (t) => 0.2 * (R() * 2 - 1) * Math.exp(-t * 18)); campana(3.3, 83, 0.1, 0.2);

// ── EXPERIMENTO 4,6 → 10,2
const E0 = 4.6;
pad(E0, 5.8, [48, 55, 60, 64], 0.04);
sub(E0, 5.8, 41, 0.2);
campana(E0 + 1.2 + 0.7, 79, 0.12, 0.3); // la gota llega
for (let i = 0; i < 8; i++) tick(E0 + 2.1 + i * 0.07, 0.14, 1200 + i * 120);
campana(E0 + 2.2, 86, 0.1, -0.3); campana(E0 + 3.9, 83, 0.09, 0.3);

// ── PREDICCIÓN 10,2 → 16,6
const P0 = 10.2;
pad(P0, 6.6, [50, 57, 62, 65], 0.04);
sub(P0, 6.6, 49, 0.2);
for (let b = 0; b < 16; b++) tick(P0 + 0.5 + b * 0.38, 0.06, 1700);
[[0.4 + 0.9, 79], [2.2 + 0.3, 83], [4.0 + 0.3, 74]].forEach(([t, m], i) => { for (let k = 0; k < 6; k++) tick(P0 + t + k * 0.06, 0.14, 1100 + k * 150); campana(P0 + t, m, 0.09, i - 1); });
golpe(P0 + 5.1, 0.45, 48); campana(P0 + 5.6, 76, 0.1, 0);

// ── QUERER 16,6 → 23,0
const Q0 = 16.6;
pad(Q0, 6.6, [47, 54, 59, 62], 0.04);
sub(Q0, 6.6, 45, 0.2);
barrido(Q0 + 0.4, 1.8, 900, 120, 0.1); golpe(Q0 + 2.1, 0.3, 50);
barrido(Q0 + 3.3, 1.8, 120, 1100, 0.1); golpe(Q0 + 5.0, 0.5, 62); campana(Q0 + 5.1, 83, 0.11, 0);
for (let b = 0; b < 12; b++) tick(Q0 + 0.6 + b * 0.5, 0.05, 1400);

// ── RUTAS 23,0 → 28,8
const R0 = 23.0;
pad(R0, 6.0, [52, 59, 64, 68], 0.05);
sub(R0, 6.0, 41, 0.22);
[1.0, 1.75, 2.5].forEach((t0, i) => { zap(R0 + t0, 0.14); campana(R0 + t0 + 0.1, [76, 81, 86][i], 0.08, i - 1); });
campana(R0 + 3.9, 88, 0.1, 0);

// ── DEBATE 28,8 → 33,6
const D0 = 28.8;
pad(D0, 5.2, [50, 57, 62, 66], 0.045);
sub(D0, 5.2, 45, 0.2);
for (let k = 0; k < 7; k++) tick(D0 + 1.2 + k * 0.5, 0.1, k % 2 ? 1200 : 1800);
campana(D0 + 3.5, 78, 0.1, 0);

// ── CIERRE 33,6 → 38,6
const C0 = 33.6;
pad(C0, 5.4, [52, 59, 64, 71], 0.05);
sub(C0, 5.4, 41, 0.24);
for (let i = 0; i < 3; i++) { add(C0 + 1.3 + i * 0.5, 0.4, (t) => 0.08 * Math.exp(-t * 8) * Math.sin(TAU * (900 - 300 * t) * t)); }
golpe(C0 + 3.1, 0.5, 58); campana(C0 + 3.1, 83, 0.12, 0); campana(C0 + 3.4, 88, 0.09, 0.4);

// ── CTA 38,6 → 42,4
pad(38.6, 3.9, [52, 59, 64, 68, 71], 0.07);
sub(38.6, 3.8, 40, 0.26);
campana(38.6, 76, 0.13, 0); campana(39.0, 80, 0.1, 0.4); campana(39.5, 83, 0.09, -0.4); campana(40.1, 88, 0.07, 0.2);
latido(38.7, 0.16);

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
const salida = join(RAIZ, "assets", "musica", "dopamina-no-es-placer.wav");
escribirWavEstereo(salida, mono);
console.log(`✅ ${salida} · ${DURACION} s`);
