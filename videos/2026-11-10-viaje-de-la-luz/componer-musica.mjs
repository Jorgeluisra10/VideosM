#!/usr/bin/env node
/**
 * Música electrónica de alta energía + diseño sonoro propio (síntesis, sin muestras ni licencias) para «El viaje de la luz» (60,9 s).
 * Cama: synth-electro en la menor a 124 bpm: bajo de sierra con sidechain, arpegiador con filtro, pads con phaser, bombo, aplauso, hats y subidas (risers)
 * en cada cambio de escena; aguanta en la escena 5 (torres, el «drop»), baja en el barrio, se tensa en el equilibrio de la red y explota en el enchufe.
 * Encima, sonidos DISTINTOS por escena, alineados con lo que se ve:
 *
 *   1 · gancho     clic del interruptor · zumbido de la lámpara que enciende · whoosh que se mete por el cable · «ping» de llegada
 *   2 · fuente     crepitar del fuego · rugido del quemador · chorro de agua · zap del paquete · whoosh de salida
 *   3 · turbina    rotor que acelera (barrido ascendente) · silbido del vapor · golpe grave de arranque
 *   4 · generador  tics del imán al pasar por cada bobina · zumbido eléctrico que crece · «ding» de la onda
 *   5 · transmisión zumbido de transformador a 120 Hz · zap de subida de voltaje · paso de cada torre · crepitar de corona
 *   6 · barrio     golpe del poste · zap de bajada de voltaje · campanita de la ventana · clics del medidor de luz
 *   7 · balance    radar de equilibrio · tics de casas que se encienden · tono de 60 Hz · «ding» de igualdad
 *   8 · enchufe    llegada · golpe seco al conectar · destello y «ding» de la lámpara · zumbido del filamento
 *   9 · cierre     arpegio ascendente de sintetizador y marimba
 *
 * Uso:  node videos/2026-11-10-viaje-de-la-luz/componer-musica.mjs   → assets/musica/viaje-de-la-luz.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/viaje-de-la-luz.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 61.5;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(110110);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sua = (v, a, b) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const ex = (t, tau) => Math.exp(-t / tau);
const buf = () => new Float32Array(N);
const mus = buf(), pad = buf(), fx = buf();
const add = (b, t0, dur, fn) => { const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round((t0 + dur) * SR)); for (let i = i0; i < i1; i++) b[i] += fn((i - i0) / SR, i / SR); };
const hz = (n) => 220 * Math.pow(2, n / 12); // n = semitonos sobre la3

const dur = [6.1, 7.0, 7.2, 6.9, 8.4, 7.2, 7.4, 5.7, 5.0];
const ES = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const T = (n, t) => ES[n - 1] + t;
const BPM = 124, B = 60 / BPM, BAR = 4 * B;
const ventana = (g, a, b, r = 0.3) => sua(g, a, a + r) * (1 - sua(g, b - r, b));
const escena = (t) => ES.findIndex((e, i) => t >= e && (i === ES.length - 1 || t < ES[i + 1])) + 1;
/** sidechain: baja la música en cada golpe de bombo (cada tiempo) */
const sidechain = (t) => 0.35 + 0.65 * sua(((t % B) + B) % B, 0, 0.18);

/* ───────── instrumentos ───────── */
function saw(b, t0, n, d, g, brillo = 2400) {
  const f = hz(n); let ph = 0;
  add(b, t0, d + 0.1, (t, gl) => { ph += (TAU * f) / SR; const c = brillo * (0.3 + 0.7 * ex(t, 0.1)) * (0.8 + 0.2 * Math.sin(TAU * 0.11 * gl)); let s = 0; for (let h = 1; h <= 14; h++) s += (Math.sin(h * ph) / h) * Math.max(0, 1 - (h * f) / c); return g * s * Math.min(1, t / 0.003) * (t < d ? 1 : ex(t - d, 0.04)); });
}
const kick = (t0, g = 0.75) => add(fx, t0, 0.35, (t) => g * Math.sin(TAU * (46 + 130 * ex(t, 0.028)) * t) * ex(t, 0.12));
const clap = (t0, g = 0.3) => { let y = 0; for (const o of [0, 0.012, 0.024]) add(fx, t0 + o, 0.2, (t) => { const w = R() * 2 - 1; y += 0.4 * (w - y); return g * (w - y) * 1.3 * ex(t, 0.07); }); };
const hat = (t0, g = 0.07, d = 0.04) => { let y = 0; add(fx, t0, d + 0.02, (t) => { const w = R() * 2 - 1; const hp = w - y; y += 0.6 * (w - y); return g * hp * ex(t, d * 0.5); }); };
function marimba(b, t0, n, g = 0.3) { const f = hz(n); add(b, t0, 0.9, (t) => g * Math.min(1, t / 0.001) * (Math.sin(TAU * f * t) * ex(t, 0.28) + 0.35 * Math.sin(TAU * f * 3.99 * t) * ex(t, 0.05))); }
const ding = (t0, f = 1568, g = 0.25) => add(fx, t0, 1.6, (t) => g * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2.76 * t) * ex(t, 0.2)) * ex(t, 0.55) * Math.min(1, t / 0.002));
const crunch = (t0, g = 0.3, d = 0.05, hp = 1500) => { let y = 0; add(fx, t0, d + 0.02, (t) => { const w = R() * 2 - 1; y += (1 - Math.exp((-TAU * hp) / SR)) * (w - y); return g * (w - y) * ex(t, d * 0.45); }); };
const thud = (t0, f = 70, g = 0.5) => add(fx, t0, 0.5, (t) => g * Math.sin(TAU * (f + 40 * ex(t, 0.04)) * t) * ex(t, 0.14) + g * 0.25 * (R() * 2 - 1) * ex(t, 0.01));
const bip = (t0, f = 1800, d = 0.05, g = 0.2) => add(fx, t0, d + 0.02, (t) => g * Math.sin(TAU * f * t) * (t < d ? 1 : 0) * Math.min(1, t / 0.002));
const ruidoLP = (cor) => { let y = 0; return (g) => { const f = typeof cor === "function" ? cor(g) : cor; y += (1 - Math.exp((-TAU * f) / SR)) * ((R() * 2 - 1) - y); return y; }; };
const ruidoHP = (cor) => { let y = 0; return (g) => { const f = typeof cor === "function" ? cor(g) : cor; const w = R() * 2 - 1; y += (1 - Math.exp((-TAU * f) / SR)) * (w - y); return w - y; }; };
/** zap: barrido de sierra de f0 a f1 */
const zap = (t0, f0, f1, d = 0.3, g = 0.2) => { let ph = 0; add(fx, t0, d + 0.05, (t) => { const k = clamp(t / d); ph += (TAU * lerp(f0, f1, k * k)) / SR; return g * (Math.sin(ph) + 0.5 * Math.sin(2 * ph)) * Math.min(1, t / 0.003) * (1 - sua(t, d * 0.8, d + 0.05)); }); };
/** riser: ruido filtrado que sube hacia el cambio de escena */
const riser = (tf, d = 1.3, g = 0.3) => { const n = ruidoHP((gg) => 600 + 7000 * Math.pow(clamp((gg - (tf - d)) / d), 2)); add(fx, tf - d, d, (t, gg) => g * n(gg) * Math.pow(t / d, 2)); };

/* ───────── 1 · CAMA ───────── */
const PROG = [[-12, -5, 0, 3], [-16, -9, -4, 0], [-14, -7, -2, 2], [-9, -2, 3, 7]]; // Am · F · G · C
// pad con phaser (suave en 1; más abierto en 5)
for (let b = 0, t = 0; t < DURACION; b++, t += BAR) {
  const sc = escena(t), nivel = sc === 6 ? 0.7 : sc === 7 ? 0.5 : 1;
  for (const n of PROG[b % 4]) { const f = hz(n); add(pad, t, BAR + 0.4, (tt) => { const e = sua(tt, 0, 0.4) * (1 - sua(tt, BAR - 0.1, BAR + 0.4)); let s = 0; for (let j = 0; j < 3; j++) { const ff = f * (1 + (j - 1) * 0.005); for (let h = 1; h <= 4; h++) s += Math.sin(TAU * ff * h * tt + j * 1.7 * h) / (h * h * 0.7); } return 0.05 * nivel * e * s; }); }
}
{ let z = [0, 0, 0, 0], fb = 0;
  for (let i = 0; i < N; i++) { const t = i / SR, lfo = 0.5 + 0.5 * Math.sin(TAU * 0.17 * t); const fc = 260 + 2200 * lfo * lfo, k = Math.tan((Math.PI * fc) / SR), a = (k - 1) / (k + 1); let v = pad[i] + 0.35 * fb; for (let s = 0; s < 4; s++) { const y = a * v + z[s]; z[s] = v - a * y; v = y; } fb = v; mus[i] += 0.5 * (pad[i] + v) * sidechain(t); } }
// arpegiador (semicorcheas), con más brillo en la escena 5 y 8
for (let b = 0, t = 0; t < DURACION - 1; b++, t += BAR) {
  const sc = escena(t);
  if (sc === 1 && t < ES[0] + 2) continue;
  const suave = sc === 1 || sc === 6 || sc === 7;
  const pat = [0, 1, 2, 3, 2, 1, 3, 2];
  for (let s = 0; s < 16; s++) { if (suave && s % 2) continue; saw(mus, t + s * (B / 4), PROG[b % 4][pat[s % 8]] + 12, (B / 4) * 0.9, suave ? 0.07 : 0.11, sc === 5 || sc === 8 ? 3800 : 2400); }
}
// bajo con sidechain y batería: entra en la escena 2, drop en la 5, se afloja en 6 y 7, vuelve fuerte en 8
for (let b = 0, t = ES[1]; t < ES[8] - 0.2; b++, t += BAR) {
  const sc = escena(t);
  const lleno = sc === 5 || sc === 8, bajo = sc === 6 || sc === 7;
  for (let s = 0; s < 8; s++) { if (bajo && s % 2) continue; saw(mus, t + s * (B / 2), PROG[b % 4][0] - 12, (B / 2) * 0.55, lleno ? 0.26 : 0.2, 800); }
  for (let q = 0; q < 4; q++) { if (!bajo || q % 2 === 0) kick(t + q * B, lleno ? 0.8 : 0.6); }
  if (!bajo) { clap(t + B, 0.3); clap(t + 3 * B, 0.3); }
  for (let s = 0; s < 8; s++) hat(t + s * (B / 2) + B / 4, s % 2 ? 0.09 : 0.06);
  if (lleno) for (let s = 0; s < 16; s++) if (s % 4 === 3) hat(t + s * (B / 4), 0.07);
}
// eco y reverb
{ const dl = Math.round(0.75 * B * SR), e = new Float32Array(dl); let p = 0, lp = 0;
  for (let i = 0; i < N; i++) { const o = e[p]; lp += 0.3 * (o - lp); e[p] = mus[i] + 0.4 * lp; mus[i] += 0.35 * o; p = (p + 1) % dl; }
  const y = buf(); for (const ms of [37.1, 53.3, 71.9, 97.3]) { const d = Math.round((ms * SR) / 1000), lin = new Float32Array(d); let q = 0, l2 = 0; for (let i = 0; i < N; i++) { const o = lin[q]; l2 += 0.3 * (o - l2); lin[q] = mus[i] + 0.75 * l2; y[i] += o; q = (q + 1) % d; } for (let i = 0; i < N; i++) mus[i] += y[i] * 0.18; } }

/* ───────── 2 · SONIDOS POR ESCENA ───────── */
// 1 · gancho
{ crunch(T(1, 1.0), 0.55, 0.02, 1800); thud(T(1, 1.0), 120, 0.25);                                                                   // clic del interruptor
  add(fx, T(1, 1.25), 1.4, (t) => 0.16 * (Math.sin(TAU * 120 * t) + 0.5 * Math.sin(TAU * 240 * t)) * ex(t, 0.8) * (0.7 + 0.3 * Math.sin(TAU * 17 * t)));   // zumbido de la lámpara
  zap(T(1, 1.25), 300, 2600, 0.25, 0.2);
  { let ph = 0; add(fx, T(1, 2.7), 1.0, (t) => { ph += (TAU * (200 * Math.pow(14, clamp(t / 0.9)))) / SR; return 0.22 * Math.sin(ph) * sua(t, 0, 0.1) * (1 - sua(t, 0.8, 1.0)); }); }   // se mete por el cable
  riser(T(1, 3.5), 0.9, 0.28); ding(T(1, 3.6), 2093, 0.16); }
// 2 · fuente
{ { const n = ruidoHP(2600); add(fx, T(2, 0.2), 2.6, (t, g) => 0.13 * n(g) * (0.6 + 0.4 * Math.sin(TAU * 13 * t)) * ventana(t, 0, 2.6, 0.3)); }                // crepitar del fuego
  { const n = ruidoLP(180); add(fx, T(2, 0.4), 2.4, (t, g) => 0.5 * n(g) * ventana(t, 0, 2.4, 0.4)); }                                                          // rugido del quemador
  { const n = ruidoHP((g) => 2400 + 1400 * Math.sin(g * 5)); add(fx, T(2, 0.9), 3.6, (t, g) => 0.14 * n(g) * ventana(t, 0, 3.6, 0.3)); }                          // chorro de agua
  zap(T(2, 2.4), 400, 3000, 0.3, 0.22); ding(T(2, 2.5), 1568, 0.14);
  [1.8, 3.2].forEach((tt) => { crunch(T(2, tt), 0.35, 0.02, 2200); bip(T(2, tt) + 0.004, 1200, 0.04, 0.14); });
  { const nn = ruidoLP((g) => 400 + 4000 * sua(g, T(2, 4.6), T(2, 5.5))); add(fx, T(2, 4.7), 0.9, (t, g) => 0.5 * nn(g) * ventana(t, 0, 0.9, 0.2)); }  riser(ES[2], 1.0, 0.25); }
// 3 · turbina
{ thud(T(3, 0.2), 52, 0.7);
  { let ph = 0; add(fx, T(3, 0.8), 5.2, (t) => { ph += (TAU * (60 + 340 * sua(t, 0, 3.2) + 50 * Math.sin(TAU * 0.7 * t))) / SR; return 0.18 * (Math.sin(ph) + 0.6 * Math.sin(2 * ph) + 0.4 * Math.sin(3.01 * ph)) * ventana(t, 0, 5.2, 0.4); }); }   // rotor que acelera
  { const n = ruidoHP(4200); add(fx, T(3, 0.4), 5.0, (t, g) => 0.1 * n(g) * (0.7 + 0.3 * Math.sin(TAU * 9 * t)) * ventana(t, 0, 5.0, 0.5)); }                         // silbido del vapor
  crunch(T(3, 3.4), 0.3, 0.02, 2400); zap(T(3, 4.8), 200, 2400, 0.4, 0.18); riser(ES[3], 1.0, 0.25); }
// 4 · generador
{ for (let k = 0; k < 12; k++) { const tk = T(4, 1.0 + (k * 1.4) / 12); crunch(tk, 0.32, 0.014, 2800); bip(tk + 0.002, 900 + k * 60, 0.025, 0.12); }                    // tics de cada bobina
  add(fx, T(4, 2.4), 3.8, (t) => 0.2 * (Math.sin(TAU * (90 + 120 * sua(t, 0, 3.0)) * t) + 0.5 * Math.sin(TAU * (180 + 240 * sua(t, 0, 3.0)) * t)) * ventana(t, 0, 3.8, 0.4));   // zumbido eléctrico que crece
  zap(T(4, 2.4), 200, 3200, 0.5, 0.2); ding(T(4, 3.4), 1760, 0.2); [0, 4, 7, 12].forEach((n, k) => marimba(fx, T(4, 3.4) + k * 0.07, n + 24, 0.14)); riser(ES[4], 1.0, 0.28); }
// 5 · transmisión (drop)
{ thud(T(5, 0.2), 55, 0.8);
  add(fx, T(5, 0.3), 3.2, (t) => 0.16 * (Math.sin(TAU * 120 * t) + 0.6 * Math.sin(TAU * 240 * t) + 0.3 * Math.sin(TAU * 360 * t)) * ventana(t, 0, 3.2, 0.3));                // zumbido del transformador
  zap(T(5, 1.4), 150, 4200, 0.4, 0.26); ding(T(5, 2.4), 1320, 0.16);
  { const n = ruidoHP(5000); add(fx, T(5, 1.4), 1.6, (t, g) => 0.08 * n(g) * (R() > 0.4 ? 1 : 0.3) * ventana(t, 0, 1.6, 0.2)); }                                           // corona
  for (let k = 0; k < 5; k++) { const tk = T(5, 3.5 + k * 0.9); const n = ruidoLP((g) => 300 + 3800 * Math.sin(Math.PI * clamp((g - tk) / 0.8))); add(fx, tk, 0.8, (t, g) => 0.5 * n(g) * Math.sin(Math.PI * clamp(t / 0.8))); crunch(tk + 0.35, 0.25, 0.03, 2000); }   // paso de cada torre
  riser(ES[5], 0.8, 0.22); }
// 6 · barrio
{ thud(T(6, 0.2), 90, 0.5);
  { let ph = 0; add(fx, T(6, 1.2), 0.6, (t) => { ph += (TAU * (3000 * Math.pow(0.08, clamp(t / 0.5)))) / SR; return 0.2 * Math.sin(ph) * (1 - sua(t, 0.4, 0.55)); }); }                 // zap de bajada de voltaje
  ding(T(6, 2.0), 1568, 0.16); [3.4].forEach((tt) => { ding(T(6, tt), 2349, 0.12); thud(T(6, tt), 80, 0.2); });
  for (let k = 0; k < 14; k++) { const tk = T(6, 4.8 + (k * 1.6) / 14); crunch(tk, 0.3, 0.012, 3000); bip(tk + 0.002, 800 + (k % 2) * 150, 0.02, 0.1); }                       // medidor de luz
  crunch(T(6, 5.4), 0.4, 0.02, 2000); }
// 7 · balance
{ add(fx, T(7, 0.3), 1.6, (t) => 0.14 * Math.sin(TAU * (400 + 80 * Math.sin(TAU * 3 * t)) * t) * ventana(t, 0, 1.6, 0.3));                                                // radar
  for (let k = 0; k < 14; k++) { const tk = T(7, 1.8 + (k * 1.6) / 14); crunch(tk, 0.3, 0.012, 3200); bip(tk + 0.002, 1100 + (k % 3) * 120, 0.02, 0.1); }                       // casas que se encienden
  add(fx, T(7, 3.4), 3.6, (t) => 0.18 * Math.sin(TAU * 60 * t) * ventana(t, 0, 3.6, 0.3) + 0.06 * Math.sin(TAU * 120 * t));                                                // 60 Hz
  zap(T(7, 3.4), 200, 1800, 0.3, 0.16); ding(T(7, 5.0), 1760, 0.2); [0, 4, 7].forEach((n, k) => marimba(fx, T(7, 5.0) + k * 0.08, n + 24, 0.14)); riser(ES[7], 1.2, 0.3); }
// 8 · enchufe
{ { const nn = ruidoLP((g) => 400 + 4000 * sua(g, T(8, 0.2), T(8, 1.0))); add(fx, T(8, 0.2), 1.0, (t, g) => 0.4 * nn(g) * ventana(t, 0, 1.0, 0.2)); }
  { let ph = 0; add(fx, T(8, 1.0), 0.9, (t) => { ph += (TAU * (300 + 1800 * sua(t, 0, 0.8))) / SR; return 0.16 * Math.sin(ph) * ventana(t, 0, 0.9, 0.1); }); }                  // llegada
  thud(T(8, 1.8), 90, 0.7); crunch(T(8, 1.8), 0.5, 0.03, 1800);                                                                                                          // conecta
  zap(T(8, 2.1), 400, 3600, 0.2, 0.26); ding(T(8, 2.15), 2093, 0.26); [0, 4, 7, 12, 16].forEach((n, k) => marimba(fx, T(8, 2.15) + k * 0.06, n + 24, 0.16));
  add(fx, T(8, 2.2), 3.0, (t) => 0.1 * (Math.sin(TAU * 120 * t) + 0.5 * Math.sin(TAU * 360 * t)) * ex(t, 1.6) * (0.8 + 0.2 * Math.sin(TAU * 21 * t)));                  // filamento
  crunch(T(8, 3.4), 0.25, 0.02, 3000); }
// 9 · cierre
{ const t0 = ES[8];
  [0, 4, 7, 12, 16, 19, 24].forEach((n, k) => { saw(fx, t0 + 0.12 + k * 0.1, n, 0.4, 0.2, 3600); marimba(fx, t0 + 0.14 + k * 0.1, n + 12, 0.2); });
  ding(t0 + 0.1, 1568, 0.2); for (let k = 0; k < 6; k++) marimba(fx, t0 + 1.9 + k * 0.07, 24 + k * 3, 0.1); }

/* ───────── 3 · mezcla ───────── */
const x = buf();
for (let i = 0; i < N; i++) x[i] = mus[i] * 0.9 + fx[i];
{ const y = buf(); for (const ms of [27.1, 41.9, 59.3]) { const d = Math.round((ms * SR) / 1000), lin = new Float32Array(d); let q = 0, lp = 0; for (let i = 0; i < N; i++) { const o = lin[q]; lp += 0.4 * (o - lp); lin[q] = fx[i] + 0.7 * lp; y[i] += o; q = (q + 1) % d; } } for (let i = 0; i < N; i++) x[i] += y[i] * 0.14; }
let pico = 0; for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(x[i]));
const gl = 0.9 / Math.max(1e-4, pico);
for (let i = 0; i < N; i++) x[i] = Math.tanh(x[i] * gl * 1.2) * 0.9;
const fi = Math.round(0.04 * SR), fo = Math.round(1.2 * SR);
for (let i = 0; i < fi; i++) x[i] *= i / fi; for (let i = 0; i < fo; i++) x[N - 1 - i] *= i / fo;
mkdirSync(join(RAIZ, "assets", "musica"), { recursive: true });
const salida = join(RAIZ, "assets", "musica", "viaje-de-la-luz.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s · ${BPM} bpm`);
console.log("   escenas (inicio):", ES.map((a, i) => `${i + 1}:${a.toFixed(1)}s`).join("  "));
