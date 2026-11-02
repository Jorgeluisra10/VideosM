#!/usr/bin/env node
/**
 * Pista propia (síntesis aditiva, sin muestras ni licencias) para «¿Por qué se te duerme el pie?» (cama cotidiana y curiosa para llevar VOZ de CapCut encima).
 *   0,0 –  4,6 s  GANCHO · pizzicato curioso; chispas de hormigueo (2,0 → 2,8 s)
 *   4,6 – 10,2 s  MITO · latido de la sangre (5,5 s) y golpe al decir «nervio aplastado» (6,9 s)
 *  10,2 – 16,6 s  NERVIO · presión (12,6 s) y apagón del pie (14,0 s)
 *  16,6 – 23,0 s  SEÑAL · ticks de los impulsos, golpe de la pinza (19,2 s), descarga y silencio incómodo
 *  23,0 – 29,4 s  HORMIGUEO · liberación (23,9 s) y lluvia de campanitas agudas (24,7 → 27,2 s)
 *  29,4 – 35,0 s  CONSEJO · tres notas amables (30,0 / 31,2 / 32,4 s) y un toque grave de aviso (33,8 s)
 *  35,0 – 40,4 s  CIERRE · se reconecta (36,3 s) y resuelve en Do mayor
 *  40,4 – 44,2 s  CTA · Do mayor y cola
 * Uso:  node videos/2026-11-02-pie-dormido/componer-musica.mjs   → assets/musica/pie-dormido.wav
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 44.2;
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
sub(0, 5, 48, 0.26);
pad(0, 5, [48, 55, 60, 64], 0.04);
[[0.3, 72], [0.8, 76], [1.3, 79], [1.8, 76], [2.3, 72], [3.0, 74]].forEach(([t, m], i) => pluck(t, m, 0.12, i % 2 ? 0.3 : -0.3));
for (let i = 0; i < 8; i++) campana(2.0 + i * 0.1, 88 + (i % 4) * 3, 0.05, i % 2 ? 0.5 : -0.5);
campana(3.4, 84, 0.1, 0);

// ── MITO 4,6 → 10,2
const M0 = 4.6;
pad(M0, 5.8, [45, 52, 57, 60], 0.04);
sub(M0, 5.8, 45, 0.22);
[0.9, 1.7, 2.5].forEach((t0) => latido(M0 + t0, 0.14));
golpe(M0 + 2.3, 0.45, 55); campana(M0 + 2.4, 76, 0.1, 0.2);
for (let b = 0; b < 10; b++) tick(M0 + 0.4 + b * 0.5, 0.05, 1300);
campana(M0 + 4.2, 81, 0.09, 0);

// ── NERVIO 10,2 → 16,6
const N0 = 10.2;
pad(N0, 6.6, [43, 50, 55, 59], 0.045);
sub(N0, 6.6, 43, 0.24);
zap(N0 + 0.9, 0.1);
golpe(N0 + 2.4, 0.5, 50); add(N0 + 2.4, 0.4, (t) => 0.1 * (R() * 2 - 1) * Math.exp(-t * 14));
golpe(N0 + 3.8, 0.4, 44); campana(N0 + 5.0, 74, 0.09, 0);
for (let b = 0; b < 8; b++) tick(N0 + 0.5 + b * 0.4, 0.045, 1500);

// ── SEÑAL 16,6 → 23,0
const S0 = 16.6;
pad(S0, 3.0, [48, 55, 60, 64], 0.05);
sub(S0, 6.4, 41, 0.22);
for (let b = 0; b < 5; b++) tick(S0 + 0.8 + b * 0.62, 0.14, 1700);
golpe(S0 + 2.6, 0.5, 50); zap(S0 + 3.2, 0.14);
add(S0 + 3.2, 3.2, (t, T) => 0.03 * sua(t, 0, 1) * (Math.sin(TAU * 110 * T) + Math.sin(TAU * 116.5 * T))); // zumbido de «sin señal»

// ── HORMIGUEO 23,0 → 29,4
const H0 = 23.0;
pad(H0, 6.4, [52, 59, 64, 67], 0.045);
sub(H0, 6.4, 48, 0.2);
golpe(H0 + 0.9, 0.4, 62);
{ const rr = prng(77); for (let i = 0; i < 30; i++) campana(H0 + 1.7 + i * 0.085 + rr() * 0.05, 84 + Math.floor(rr() * 12), 0.035 + rr() * 0.03, rr() * 1.6 - 0.8); }
campana(H0 + 4.8, 79, 0.1, 0.2); campana(H0 + 5.0, 86, 0.08, -0.2);

// ── CONSEJO 29,4 → 35,0
const C0 = 29.4;
pad(C0, 5.8, [48, 55, 60, 64], 0.045);
sub(C0, 5.8, 48, 0.2);
[0.6, 1.8, 3.0].forEach((t0, i) => { campana(C0 + t0 + 0.3, [76, 79, 84][i], 0.11, i - 1); campana(C0 + t0 + 0.6, [84, 88, 91][i], 0.07, 1 - i); });
golpe(C0 + 4.4, 0.3, 55);

// ── CIERRE 35,0 → 40,4
const Z0 = 35.0;
pad(Z0, 1.6, [43, 50, 55, 59], 0.04);
for (let i = 0; i < 5; i++) tick(Z0 + 1.3 + i * 0.2, 0.1, 1200 + i * 150);
pad(Z0 + 1.5, 4.0, [48, 55, 60, 64, 67], 0.06);
sub(Z0, 5.6, 48, 0.24);
zap(Z0 + 2.3, 0.12); golpe(Z0 + 3.3, 0.4, 60);
campana(Z0 + 3.3, 84, 0.13, 0); campana(Z0 + 3.55, 88, 0.1, 0.4); campana(Z0 + 3.9, 91, 0.08, -0.4);

// ── CTA 40,4 → 44,2
pad(40.4, 3.9, [48, 55, 60, 64, 67], 0.07);
sub(40.4, 3.8, 48, 0.26);
campana(40.4, 72, 0.13, 0); campana(40.8, 76, 0.1, 0.4); campana(41.3, 79, 0.09, -0.4); campana(41.9, 84, 0.07, 0.2);
latido(40.5, 0.14);

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
const salida = join(RAIZ, "assets", "musica", "pie-dormido.wav");
escribirWavEstereo(salida, mono);
console.log(`✅ ${salida} · ${DURACION} s`);
