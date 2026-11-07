#!/usr/bin/env node
/**
 * Música «de ascensor que se tuerce» + diseño sonoro propio (síntesis, sin muestras ni licencias) para «El piso que no existe» (44,9 s).
 * Cama: bossa-lounge en re menor a 96 bpm: piano eléctrico (Rhodes) con acordes de séptima, bajo caminante, vibráfono, escobillas y cencerro suave;
 * entra limpio, se «tuerce» (desafina y se ralentiza) cuando aparece el piso fantasma y cierra con un giro luminoso. Encima, sonidos DISTINTOS por escena:
 *
 *   1 · gancho   timbre «ding» de llegada · puertas que se abren · clic de botones · desafinación hacia abajo del piso fantasma · «¿?» de dos notas
 *   2 · torre    motor del ascensor que sube · cable que cruje · «bip» de cada piso · destello dorado del 13
 *   3 · conteo   629 cuadritos como lluvia de teclas · golpes de máquina de contar · campana al marcar los 55 · caja registradora suave
 *   4 · asia     gong con ecos · puerta que se cierra · tono grave de «muerte» (tritono) · «tic» de borrado del 4
 *   5 · precio   campana alegre del 8 · golpe sordo del 4 · barras que crecen con «pop» · bocina de mercado que baja de tono
 *   6 · consejo  contador de pisos con tics · rollo de plano de papel · lápiz que marca · sello de «ok»
 *   7 · cierre   «ding» del ascensor · puertas · jingle de marimba
 *
 * Uso:  node videos/2026-11-07-piso-que-no-existe/componer-musica.mjs   → assets/musica/piso-que-no-existe.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/piso-que-no-existe.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 45;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(1313);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sua = (v, a, b) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const ex = (t, tau) => Math.exp(-t / tau);
const buf = () => new Float32Array(N);
const mus = buf(), fx = buf();
const add = (b, t0, dur, fn) => { const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round((t0 + dur) * SR)); for (let i = i0; i < i1; i++) b[i] += fn((i - i0) / SR, i / SR); };
const hz = (n, det = 0) => 293.66 * Math.pow(2, (n + det) / 12); // n = semitonos sobre re4

const dur = [5.5, 5.2, 6.1, 6.9, 9.0, 7.2, 5.0];
const ES = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const T = (n, t) => ES[n - 1] + t;
const BPM = 96, B = 60 / BPM, BAR = 4 * B;
const ventana = (g, a, b, r = 0.3) => sua(g, a, a + r) * (1 - sua(g, b - r, b));
/** desafinación de la música: 0 normal; baja hasta −1,2 semitonos mientras aparece el piso fantasma (escena 1, 2,4–5,5 s) y vuelve */
const torcer = (g) => -1.2 * sua(g, T(1, 2.6), T(1, 3.4)) * (1 - sua(g, T(2, 0.2), T(2, 1.0)));

/* ───────── instrumentos ───────── */
function rhodes(t0, n, d, g) {
  const f = hz(n);
  add(mus, t0, d + 0.2, (t, gl) => { const ff = f * Math.pow(2, torcer(gl) / 12); const s = Math.sin(TAU * ff * t) + 0.4 * Math.sin(TAU * ff * 2 * t) * ex(t, 0.3) + 0.5 * Math.sin(TAU * ff * 4.01 * t) * ex(t, 0.05); return g * s * Math.min(1, t / 0.004) * ex(t, 0.9) * (t < d ? 1 : ex(t - d, 0.08)); });
}
function vibra(t0, n, g) {
  const f = hz(n);
  add(mus, t0, 1.6, (t, gl) => { const ff = f * Math.pow(2, torcer(gl) / 12); return g * (Math.sin(TAU * ff * t) + 0.2 * Math.sin(TAU * ff * 4 * t) * ex(t, 0.1)) * ex(t, 0.8) * (0.8 + 0.2 * Math.sin(TAU * 5.5 * t)) * Math.min(1, t / 0.003); });
}
function bajo(t0, n, d, g) {
  const f = hz(n - 24);
  add(mus, t0, d + 0.1, (t, gl) => { const ff = f * Math.pow(2, torcer(gl) / 12); return g * (Math.sin(TAU * ff * t) + 0.35 * Math.sin(TAU * ff * 2 * t)) * Math.min(1, t / 0.005) * ex(t, 0.5) * (t < d ? 1 : ex(t - d, 0.04)); });
}
const brush = (t0, g = 0.06, d = 0.12) => { let y = 0; add(mus, t0, d + 0.03, (t) => { const w = R() * 2 - 1; y += 0.4 * (w - y); return g * (w - y) * Math.sin(Math.PI * clamp(t / d)); }); };
const rim = (t0, g = 0.1) => add(mus, t0, 0.1, (t) => g * Math.sin(TAU * 1700 * t) * ex(t, 0.015));
function marimba(b, t0, n, g = 0.3) { const f = hz(n); add(b, t0, 0.9, (t) => g * Math.min(1, t / 0.001) * (Math.sin(TAU * f * t) * ex(t, 0.28) + 0.35 * Math.sin(TAU * f * 3.99 * t) * ex(t, 0.05))); }
const ding = (t0, f = 1318, g = 0.3) => add(fx, t0, 1.8, (t) => g * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2.76 * t) * ex(t, 0.2)) * ex(t, 0.6) * Math.min(1, t / 0.002));
const crunch = (t0, g = 0.3, d = 0.05, hp = 1500) => { let y = 0; add(fx, t0, d + 0.02, (t) => { const w = R() * 2 - 1; y += (1 - Math.exp((-TAU * hp) / SR)) * (w - y); return g * (w - y) * ex(t, d * 0.45); }); };
const thud = (t0, f = 70, g = 0.5) => add(fx, t0, 0.5, (t) => g * Math.sin(TAU * (f + 40 * ex(t, 0.04)) * t) * ex(t, 0.14) + g * 0.25 * (R() * 2 - 1) * ex(t, 0.01));
const bip = (t0, f = 1800, d = 0.08, g = 0.22) => add(fx, t0, d + 0.02, (t) => g * Math.sin(TAU * f * t) * (t < d ? 1 : 0) * Math.min(1, t / 0.002));
const bloop = (t0, f0, f1, g = 0.25, d = 0.12) => { let ph = 0; add(fx, t0, d + 0.05, (t) => { const k = clamp(t / d); ph += (TAU * lerp(f0, f1, k * k)) / SR; return g * Math.sin(ph) * Math.min(1, t / 0.002) * ex(t, d * 0.7); }); };
const ruidoLP = (cor) => { let y = 0; return (g) => { const f = typeof cor === "function" ? cor(g) : cor; y += (1 - Math.exp((-TAU * f) / SR)) * ((R() * 2 - 1) - y); return y; }; };
const ruidoHP = (cor) => { let y = 0; return (g) => { const f = typeof cor === "function" ? cor(g) : cor; const w = R() * 2 - 1; y += (1 - Math.exp((-TAU * f) / SR)) * (w - y); return w - y; }; };
function gong(t0, f = 110, g = 0.5, tau = 2.4) { const r = [1, 1.47, 2.09, 2.46, 3.1, 4.2]; add(fx, t0, tau * 2.2, (t) => g * Math.min(1, t / 0.003) * r.reduce((s, q, i) => s + Math.sin(TAU * f * q * t + i) * ex(t, tau / (1 + i * 0.5)) / (1 + i * 0.35), 0)); }

/* ───────── 1 · CAMA ───────── */
const ACORDES = [[-12, -5, 0, 4, 7], [-14, -7, -2, 2, 5], [-9, -2, 3, 7, 10], [-12, -5, 0, 3, 7]]; // Dm9 · Bb·· · A7 · Dm6 (aprox.)
const RAIZ_B = [-12, -14, -9, -12];
for (let b = 0, t = 0; t < DURACION - 0.5; b++, t += BAR) {
  const calla = t >= ES[3] + 0.5 && t < ES[3] + 2.5; // sin bajo en el conteo para oír las teclas
  const ac = ACORDES[b % 4];
  // piano: acorde sincopado (1, 2.5 y 3.5 tiempos)
  [0, 1.5, 2.5].forEach((p, k) => { for (const n of ac) rhodes(t + p * B, n, B * (k === 2 ? 0.9 : 1.2), 0.045); });
  // bajo caminante
  [0, 1, 2, 3].forEach((q) => { const n = RAIZ_B[b % 4] + [0, 7, 4, 5][q]; if (!(calla && q % 2)) bajo(t + q * B, n + 12, B * 0.9, 0.2); });
  // escobillas y rimshot
  for (let q = 0; q < 8; q++) brush(t + q * (B / 2), q % 2 ? 0.05 : 0.08);
  rim(t + 1.5 * B, 0.08); rim(t + 3.5 * B, 0.08);
  // vibráfono: melodía en pentatónica menor, una nota por compás o dos
  if (t > ES[1]) { const mel = [7, 10, 12, 9, 7, 5, 3, 7]; vibra(t + 0.5 * B, mel[b % 8] + 12, 0.09); if (b % 2) vibra(t + 2.5 * B, mel[(b + 3) % 8] + 12, 0.07); }
}
// giro luminoso del final (do mayor séptima mayor en lugar del re menor)
[0, 4, 7, 11, 14].forEach((n) => rhodes(ES[6] + 0.3, n - 5, 2.6, 0.06));
// eco y reverb
{ const dl = Math.round(0.75 * B * SR), e = new Float32Array(dl); let p = 0, lp = 0;
  for (let i = 0; i < N; i++) { const o = e[p]; lp += 0.3 * (o - lp); e[p] = mus[i] + 0.35 * lp; mus[i] += 0.3 * o; p = (p + 1) % dl; }
  const y = buf(); for (const ms of [43.1, 61.3, 83.9, 109.7]) { const d = Math.round((ms * SR) / 1000), lin = new Float32Array(d); let q = 0, l2 = 0; for (let i = 0; i < N; i++) { const o = lin[q]; l2 += 0.3 * (o - l2); lin[q] = mus[i] + 0.78 * l2; y[i] += o; q = (q + 1) % d; } for (let i = 0; i < N; i++) mus[i] += y[i] * 0.2; } }

/* ───────── 2 · SONIDOS POR ESCENA ───────── */
// ESCENA 1
{ ding(T(1, 0.15), 1568, 0.3); crunch(T(1, 0.5), 0.2, 0.2, 700); thud(T(1, 0.7), 60, 0.25);                                                       // ding y puertas
  for (let k = 0; k < 4; k++) { crunch(T(1, 1.0 + k * 0.28), 0.4, 0.015, 2500); bip(T(1, 1.0 + k * 0.28) + 0.005, 1200 + k * 120, 0.03, 0.12); }   // botones
  { let ph = 0; add(fx, T(1, 2.6), 1.0, (t) => { ph += (TAU * (700 * Math.pow(0.4, t))) / SR; return 0.18 * Math.sin(ph) * ventana(t, 0, 1.0, 0.1); }); }   // desafinación hacia abajo
  [659, 523].forEach((f, k) => add(fx, T(1, 3.9) + k * 0.45, 0.9, (t) => 0.16 * Math.sin(TAU * f * t) * ex(t, 0.4) * Math.min(1, t / 0.003))); }   // «¿?»
// ESCENA 2
{ add(fx, T(2, 0.3), 2.4, (t) => 0.18 * (Math.sin(TAU * 58 * t) + 0.5 * Math.sin(TAU * 116 * t)) * ventana(t, 0, 2.4, 0.3) * (0.8 + 0.2 * Math.sin(TAU * 7 * t)));   // motor
  for (let k = 0; k < 10; k++) crunch(T(2, 0.6 + k * 0.2), 0.14, 0.05, 700 + R() * 600);                                                              // cable que cruje
  for (let k = 0; k < 13; k++) bip(T(2, 0.45 + (k * 1.9) / 13), 1600, 0.025, 0.1);                                                                    // bip de cada piso
  [0, 4, 7, 12, 16].forEach((n, k) => marimba(fx, T(2, 2.7) + k * 0.06, n + 12, 0.22)); }                                                            // destello dorado
// ESCENA 3
{ for (let k = 0; k < 60; k++) crunch(T(3, 0.2 + (k * 1.3) / 60 + R() * 0.01), 0.18, 0.012, 2800 + R() * 2000);                                    // lluvia de teclas
  for (let k = 0; k < 18; k++) { const tk = T(3, 2.0 + (k * 1.3) / 18); crunch(tk, 0.35, 0.02, 1800); thud(tk, 130, 0.12); }                          // máquina de contar
  [0, 4, 7].forEach((n, k) => marimba(fx, T(3, 3.5) + k * 0.12, n + 24, 0.26)); ding(T(3, 3.5), 2093, 0.16);                                         // campana de los 55
  crunch(T(3, 4.6), 0.4, 0.04, 1200); bip(T(3, 4.65), 1500, 0.12, 0.16); }                                                                            // caja registradora
// ESCENA 4
{ gong(T(4, 0.2), 98, 0.4, 2.2); gong(T(4, 0.9), 98 * 1.5, 0.12, 1.6);                                                                             // gong con eco
  crunch(T(4, 1.3), 0.4, 0.2, 600); thud(T(4, 1.4), 55, 0.3);                                                                                       // puerta que se cierra
  [233, 330].forEach((f) => add(fx, T(4, 2.6), 2.0, (t) => 0.12 * Math.sin(TAU * f * t) * ventana(t, 0, 2.0, 0.3) * (0.7 + 0.3 * Math.sin(TAU * 4 * t))));   // tritono grave de «muerte»
  for (let k = 0; k < 6; k++) crunch(T(4, 4.8 + k * 0.05), 0.3, 0.015, 3500); bloop(T(4, 4.8), 900, 300, 0.2, 0.1); }                                 // tic de borrado
// ESCENA 5
{ [1568, 1976, 2349].forEach((f, k) => add(fx, T(5, 0.4) + k * 0.1, 1.2, (t) => 0.22 * Math.sin(TAU * f * t) * ex(t, 0.4) * Math.min(1, t / 0.002)));    // campana del 8
  thud(T(5, 2.2), 62, 0.6); crunch(T(5, 2.2), 0.3, 0.05, 600);                                                                                       // golpe sordo del 4
  [4.2, 5.4, 6.6].forEach((tb, k) => { for (let q = 0; q < 6; q++) bloop(T(5, tb + q * 0.07), 300 + q * 120, 600 + q * 150, 0.14, 0.06); marimba(fx, T(5, tb), 12 + k * 3, 0.14); });   // barras
  { let ph = 0; add(fx, T(5, 8.0), 0.9, (t) => { ph += (TAU * (520 * Math.pow(0.45, t))) / SR; return 0.2 * Math.sign(Math.sin(ph)) * (1 - sua(t, 0.6, 0.9)) * 0.5; }); } }   // bocina de mercado que baja de tono
// ESCENA 6
{ for (let k = 0; k < 14; k++) { const tk = T(6, 0.4 + (k * 3.2) / 14); crunch(tk, 0.35, 0.015, 3000); bip(tk + 0.003, 1000 + k * 40, 0.02, 0.12); }   // contador de pisos
  { const n = ruidoLP(900); add(fx, T(6, 3.7), 0.7, (t, g) => 0.3 * n(g) * ventana(t, 0, 0.7, 0.15)); }                                           // rollo de plano
  { const n = ruidoHP(3500); add(fx, T(6, 4.9), 0.6, (t, g) => 0.12 * n(g) * (0.5 + 0.5 * Math.sin(TAU * 18 * t)) * ventana(t, 0, 0.6, 0.1)); }       // lápiz
  thud(T(6, 6.0), 100, 0.4); ding(T(6, 6.05), 1760, 0.2); }                                                                                          // sello de «ok»
// ESCENA 7
{ const t0 = ES[6]; ding(t0 + 0.1, 1568, 0.32); crunch(t0 + 0.5, 0.2, 0.2, 700);
  [0, 4, 7, 12, 16, 19, 24].forEach((n, k) => marimba(fx, t0 + 0.8 + k * 0.1, n + 12, 0.24));
  for (let k = 0; k < 6; k++) marimba(fx, t0 + 1.9 + k * 0.07, 24 + k * 3, 0.1); }

/* ───────── 3 · mezcla ───────── */
const x = buf();
for (let i = 0; i < N; i++) x[i] = mus[i] * 0.95 + fx[i];
{ const y = buf(); for (const ms of [27.1, 41.9, 59.3]) { const d = Math.round((ms * SR) / 1000), lin = new Float32Array(d); let q = 0, lp = 0; for (let i = 0; i < N; i++) { const o = lin[q]; lp += 0.4 * (o - lp); lin[q] = fx[i] + 0.7 * lp; y[i] += o; q = (q + 1) % d; } } for (let i = 0; i < N; i++) x[i] += y[i] * 0.14; }
let pico = 0; for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(x[i]));
const gl = 0.9 / Math.max(1e-4, pico);
for (let i = 0; i < N; i++) x[i] = Math.tanh(x[i] * gl * 1.2) * 0.9;
const fi = Math.round(0.04 * SR), fo = Math.round(1.2 * SR);
for (let i = 0; i < fi; i++) x[i] *= i / fi; for (let i = 0; i < fo; i++) x[N - 1 - i] *= i / fo;
mkdirSync(join(RAIZ, "assets", "musica"), { recursive: true });
const salida = join(RAIZ, "assets", "musica", "piso-que-no-existe.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s · ${BPM} bpm`);
console.log("   escenas (inicio):", ES.map((a, i) => `${i + 1}:${a.toFixed(1)}s`).join("  "));
