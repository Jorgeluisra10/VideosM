#!/usr/bin/env node
/**
 * Pista propia (síntesis aditiva, sin muestras ni licencias) para «Tu cerebro no siente dolor» (sin voz: la música sigue a las escenas).
 *   0,0 –  4,2 s  GANCHO · drone grave, latido, riser y golpe al decir «dolor» (2,1 s) y campana al marcar cero (2,7 s)
 *   4,2 – 10,2 s  CAPAS · pulso de ticks y tres descargas (zap) que «prueban» cuero, cráneo y meninges; resuelve en 8,6 s
 * 10,2 – 15,6 s  QUIRÓFANO · pitido de monitor cardíaco (880 Hz) cada 1,1 s sobre un pad suspendido
 * 15,6 – 21,6 s  MAPA · ritmo de ticks a 120 bpm, descargas en cada prueba y zumbido grave cuando el habla se detiene (18,8 s)
 * 21,6 – 27,4 s  HOMÚNCULO · pad que se abre en mayor, arpegio de campanas y barrido de la deformación (23,3 → 25,3 s)
 * 27,4 – 32,6 s  MÚSICA · una melodía de «violín» sintético (vibrato) en Re mayor
 * 32,6 – 38,3 s  CABEZA · latido que se acelera y ruido filtrado (la migraña); alivio en 36,4 s
 * 38,3 – 43,3 s  CIERRE · pulsos que suben por la médula, golpe y campana al marcar cero (42,2 s)
 * 43,3 – 47,2 s  CTA · resuelve a Re mayor, campanas y cola
 * Uso:  node videos/2026-10-31-cerebro-no-duele/componer-musica.mjs   → assets/musica/cerebro-no-duele.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/cerebro-no-duele.wav   (después: --restaurar)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 47.2;
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
const bip = (t0, f, vol, dur = 0.09) => add(t0, dur, (t) => vol * Math.min(1, t / 0.004) * Math.exp(-t * 18) * Math.sin(TAU * f * t));
const tick = (t0, vol, f = 1500) => add(t0, 0.08, (t) => vol * Math.exp(-t * 70) * Math.sin(TAU * f * t));
const zap = (t0, vol) => { let ph = 0; add(t0, 0.28, (t) => { const u = t / 0.28; ph += (900 * Math.pow(0.25, u)) / SR; return vol * (1 - u) * Math.sign(Math.sin(TAU * ph)) * 0.6; }); };
const violin = (t0, dur, m, vol, p = 0) => {
  const f = nota(m);
  add(t0, dur, (t, T) => {
    const vib = 1 + 0.006 * Math.sin(TAU * 5.4 * t) * sua(t, 0.12, 0.4);
    const env = Math.min(1, t / 0.06) * (1 - sua(t, dur - 0.16, dur));
    let v = 0;
    for (let h = 1; h <= 7; h++) v += Math.sin(TAU * f * vib * h * T) / (h * 1.1);
    return vol * env * v;
  }, p);
};

// ── GANCHO 0 → 4,2
sub(0, 4.6, 55, 0.34);
add(0, 4.6, (t, T) => 0.05 * sua(t, 0, 1.5) * (Math.sin(TAU * 220 * T) + Math.sin(TAU * 220.9 * T)), 0);
[0.4, 1.2, 2.0].forEach((t0) => latido(t0, 0.22));
{ let ph = 0; add(0.6, 1.5, (t) => { const u = t / 1.5; ph += (200 * Math.pow(7, u)) / SR; return 0.06 * u * Math.sin(TAU * ph); }, -0.3); }
add(2.1, 0.4, (t) => 0.5 * Math.exp(-t * 9) * Math.sin(TAU * 62 * t)); // golpe en «dolor»
add(2.1, 0.3, (t) => 0.22 * (R() * 2 - 1) * Math.exp(-t * 18));
campana(2.7, 81, 0.12, 0.2); pad(2.7, 1.8, [57, 64, 69, 72], 0.045);

// ── CAPAS 4,2 → 10,2
sub(4.2, 6, 55, 0.26);
pad(4.2, 6, [45, 57, 60, 64], 0.04, -0.1);
for (let b = 0; b < 15; b++) tick(4.4 + b * 0.4, 0.14, b % 2 ? 1400 : 1000);
[0, 1, 2].forEach((i) => { zap(4.2 + 2.4 + i * 0.6, 0.16); add(4.2 + 2.4 + i * 0.6, 0.35, (t) => 0.3 * Math.exp(-t * 10) * Math.sin(TAU * (70 - i * 6) * t)); });
campana(4.2 + 4.4, 76, 0.1, -0.2); campana(4.2 + 4.55, 79, 0.1, 0.3); pad(4.2 + 4.4, 1.8, [48, 55, 60, 67], 0.05);

// ── QUIRÓFANO 10,2 → 15,6 : monitor cardíaco
pad(10.2, 5.6, [50, 57, 62, 65], 0.05);
sub(10.2, 5.6, 49, 0.22);
for (let k = 0; k < 5; k++) bip(10.5 + k * 1.1, 880, 0.12);
[10.2 + 1.0].forEach((t0) => add(t0, 0.35, (t) => 0.3 * Math.exp(-t * 9) * Math.sin(TAU * 60 * t))); // se abre la ventana
for (let i = 0; i < 4; i++) campana(10.2 + 2.3 + i * 0.55, [74, 77, 81, 77][i], 0.07, i % 2 ? 0.4 : -0.4);

// ── MAPA 15,6 → 21,6 : ritmo de prueba
sub(15.6, 6.2, 49, 0.24);
pad(15.6, 6.2, [47, 54, 59, 62], 0.04);
for (let b = 0; b < 24; b++) tick(15.8 + b * 0.25, 0.1 + 0.03 * (b % 4 === 0), b % 4 === 0 ? 1900 : 1300);
[0, 1, 3, 4].forEach((i) => { zap(15.6 + 1.5 + i * 0.85, 0.15); campana(15.6 + 1.7 + i * 0.85, [79, 76, 0, 83, 86][i], 0.06, 0.2); });
add(15.6 + 1.5 + 2 * 0.85, 0.7, (t) => 0.45 * Math.exp(-t * 3.5) * (Math.sin(TAU * 58 * t) + 0.6 * Math.sign(Math.sin(TAU * 29 * t)) * 0.4)); // el habla se detiene
campana(15.6 + 4.9, 81, 0.1); campana(15.6 + 5.1, 85, 0.1, 0.3);

// ── HOMÚNCULO 21,6 → 27,4 : maravilla
const H0 = 21.6;
[[50, 57, 62, 66], [47, 54, 59, 66], [43, 55, 59, 62], [45, 57, 61, 64]].forEach((c, i) => pad(H0 + i * 1.5, 2.0, c, 0.055));
sub(H0, 6, 50, 0.2);
[74, 78, 81, 86, 81, 78, 74, 78, 81, 86, 90, 86].forEach((m, i) => campana(H0 + 0.4 + i * 0.42, m, 0.07, Math.sin(i) * 0.6));
{ let ph = 0; add(H0 + 1.7, 2.0, (t) => { const u = t / 2.0; ph += (260 * Math.pow(4, u)) / SR; return 0.06 * u * Math.sin(TAU * ph); }); }
add(H0 + 3.7, 0.5, (t) => 0.4 * Math.exp(-t * 7) * Math.sin(TAU * 62 * t));
campana(H0 + 4.2, 90, 0.11, 0);

// ── MÚSICA 27,4 → 32,6 : melodía de violín en Re mayor
const V0 = 27.4;
pad(V0, 5.4, [50, 57, 62, 66], 0.045);
sub(V0, 5.4, 49, 0.18);
[[0.3, 0.55, 74], [0.9, 0.45, 76], [1.4, 0.45, 78], [1.9, 0.9, 81], [2.9, 0.45, 79], [3.4, 0.45, 78], [3.9, 0.45, 76], [4.4, 0.9, 74]].forEach(([t, d, m]) => violin(V0 + t, d, m, 0.09, -0.2));
for (const t0 of [0.5, 2.0, 3.5, 5.0]) latido(V0 + t0, 0.08);

// ── CABEZA 32,6 → 38,3 : migraña y alivio
const C0 = 32.6;
sub(C0, 5.9, 55, 0.28);
{ let fase = 0; add(C0, 3.8, (t, T) => { const f = 1.2 + 1.2 * sua(t, 0, 3.8); fase += f / SR; const ph = fase % 1; return (0.18 + 0.1 * sua(t, 0, 3.8)) * (Math.exp(-ph * 22) + 0.7 * Math.exp(-Math.max(0, ph - 0.17) * 24) * (ph > 0.17 ? 1 : 0)) * Math.sin(TAU * 52 * T); }); }
{ let lp = 0; add(C0 + 1.2, 2.6, (t, T) => { lp += 0.02 * ((R() * 2 - 1) - lp); return 2.4 * lp * sua(t, 0, 1.2) * (1 - sua(t, 2.0, 2.6)); }); }
add(C0, 3.8, (t, T) => 0.04 * sua(t, 0, 1.5) * (1 - sua(t, 3.2, 3.8)) * (Math.sin(TAU * 220 * T) + Math.sin(TAU * 233.1 * T) + 0.6 * Math.sin(TAU * 349.2 * T)));
campana(C0 + 3.8, 81, 0.1, 0.2); pad(C0 + 3.8, 2.4, [45, 57, 64, 69], 0.055); campana(C0 + 4.1, 88, 0.08, -0.3);

// ── CIERRE 38,3 → 43,3
const Z0 = 38.3;
sub(Z0, 5.2, 55, 0.24);
pad(Z0, 5.2, [45, 52, 57, 64], 0.05);
for (let i = 0; i < 4; i++) { zap(Z0 + 1.6 + i * 0.7, 0.14); latido(Z0 + 1.6 + i * 0.7, 0.12); }
add(Z0 + 3.9, 0.6, (t) => 0.5 * Math.exp(-t * 6) * Math.sin(TAU * 58 * t));
campana(Z0 + 3.9, 81, 0.13, 0); campana(Z0 + 4.2, 88, 0.09, 0.4);

// ── CTA 43,3 → 47,2 : resuelve a Re mayor
pad(43.3, 4.0, [50, 57, 62, 66, 69], 0.07);
sub(43.3, 4, 49, 0.28);
campana(43.3, 78, 0.14, 0); campana(43.75, 81, 0.1, 0.4); campana(44.2, 86, 0.09, -0.4); campana(44.8, 90, 0.07, 0.2);
latido(43.4, 0.18);

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
const salida = join(RAIZ, "assets", "musica", "cerebro-no-duele.wav");
escribirWavEstereo(salida, mono);
console.log(`✅ ${salida} · ${DURACION} s`);
