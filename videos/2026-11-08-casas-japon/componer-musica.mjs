#!/usr/bin/env node
/**
 * Música «Japón moderno» + diseño sonoro propio (síntesis, sin muestras ni licencias) para «La casa que vale menos cada año» (47,8 s).
 * Cama: escala hirajoshi en mi (mi–fa♯–sol–si–do), 100 bpm: koto (pulsos con caída de tono), shamisen percusivo, flauta tipo shakuhachi con aire,
 * taiko (don y ka), bajo sub y pad con phaser; entra suave, crece con la demolición y se aquieta en las casas vacías. Encima, sonidos DISTINTOS por escena:
 *
 *   1 · gancho    reloj que se acelera (30 años) · campana de templo al llegar a 30 · destello del terreno · tic de medidores
 *   2 · gráfico   lápiz que traza las líneas · marcas de los ejes · golpe de sello en los 22 años · moneda que cae
 *   3 · demolición motor diésel · quejido hidráulico · crash del derrumbe · traqueteo de escombros · polvo (soplo) · tres «pop» de barras
 *   4 · porqué    temblor de tierra grave · flecha (whoosh) · campanita de cristal de la casa nueva · onda sísmica · tics de las razones
 *   5 · vacías    crujido de puerta · clac de madera por cada casita vacía · viento solitario · eco de silbido · dato final
 *   6 · lección   hoja de papel que se desliza · sello · bolígrafo que escribe · «ding» de la clave
 *   7 · cierre    koto en arpegio ascendente · marimba · campana final
 *
 * Uso:  node videos/2026-11-08-casas-japon/componer-musica.mjs   → assets/musica/casas-japon.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/casas-japon.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 48;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(1108);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sua = (v, a, b) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const ex = (t, tau) => Math.exp(-t / tau);
const buf = () => new Float32Array(N);
const mus = buf(), pad = buf(), fx = buf();
const add = (b, t0, dur, fn) => { const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round((t0 + dur) * SR)); for (let i = i0; i < i1; i++) b[i] += fn((i - i0) / SR, i / SR); };
const hz = (n) => 329.63 * Math.pow(2, n / 12); // n = semitonos sobre mi4
const HIRA = [0, 2, 3, 7, 8]; // mi fa♯ sol si do
const nota = (g, oct = 0) => HIRA[((g % 5) + 5) % 5] + 12 * (Math.floor(g / 5) + oct);

const dur = [6.6, 7.6, 8.1, 6.7, 6.9, 6.9, 5.0];
const ES = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const T = (n, t) => ES[n - 1] + t;
const BPM = 100, B = 60 / BPM, BAR = 4 * B;
const ventana = (g, a, b, r = 0.3) => sua(g, a, a + r) * (1 - sua(g, b - r, b));

/* ───────── instrumentos ───────── */
function koto(b, t0, n, g = 0.25) {
  const f = hz(n);
  add(b, t0, 1.3, (t) => { const ff = f * (1 + 0.035 * ex(t, 0.04)); return g * (Math.sin(TAU * ff * t) + 0.5 * Math.sin(TAU * ff * 2 * t) * ex(t, 0.2) + 0.3 * Math.sin(TAU * ff * 3.01 * t) * ex(t, 0.1)) * Math.min(1, t / 0.0015) * ex(t, 0.45); });
}
function shami(b, t0, n, g = 0.2) {
  const f = hz(n); let ph = 0;
  add(b, t0, 0.5, (t) => { ph += (TAU * f) / SR; const s = Math.sin(ph) + 0.6 * Math.sin(2 * ph) + 0.5 * Math.sin(3 * ph) + 0.4 * Math.sin(5 * ph); return g * Math.tanh(1.6 * s * 0.5) * Math.min(1, t / 0.001) * ex(t, 0.12); });
  add(b, t0, 0.03, (t) => g * 0.5 * (R() * 2 - 1) * ex(t, 0.005));
}
function flauta(t0, n, d, g = 0.1) {
  const f = hz(n); let ph = 0; let y = 0;
  add(mus, t0, d + 0.3, (t) => { ph += (TAU * f * (1 + 0.006 * Math.sin(TAU * 5.2 * t) * sua(t, 0.3, 0.8))) / SR; const w = R() * 2 - 1; y += 0.15 * (w - y); return g * (Math.sin(ph) + 0.25 * Math.sin(2 * ph) + 0.5 * y) * sua(t, 0, 0.18) * (1 - sua(t, d, d + 0.3)); });
}
const don = (t0, g = 0.6) => add(mus, t0, 0.6, (t) => g * Math.sin(TAU * (48 + 80 * ex(t, 0.05)) * t) * ex(t, 0.2) + 0.2 * g * (R() * 2 - 1) * ex(t, 0.01));
const ka = (t0, g = 0.3) => add(mus, t0, 0.2, (t) => g * Math.sin(TAU * (260 + 120 * ex(t, 0.02)) * t) * ex(t, 0.05) + 0.3 * g * (R() * 2 - 1) * ex(t, 0.015));
function marimba(b, t0, n, g = 0.3) { const f = hz(n); add(b, t0, 0.9, (t) => g * Math.min(1, t / 0.001) * (Math.sin(TAU * f * t) * ex(t, 0.28) + 0.35 * Math.sin(TAU * f * 3.99 * t) * ex(t, 0.05))); }
const campana = (t0, f = 220, g = 0.4, tau = 2.2) => { const r = [1, 2.0, 2.4, 3.0, 4.1]; add(fx, t0, tau * 2.2, (t) => g * Math.min(1, t / 0.003) * r.reduce((s, q, i) => s + Math.sin(TAU * f * q * t + i) * ex(t, tau / (1 + i * 0.6)) / (1 + i * 0.4), 0) * (1 + 0.1 * Math.sin(TAU * 1.7 * t))); };
const ding = (t0, f = 1568, g = 0.25) => add(fx, t0, 1.6, (t) => g * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2.76 * t) * ex(t, 0.2)) * ex(t, 0.55) * Math.min(1, t / 0.002));
const crunch = (t0, g = 0.3, d = 0.05, hp = 1500) => { let y = 0; add(fx, t0, d + 0.02, (t) => { const w = R() * 2 - 1; y += (1 - Math.exp((-TAU * hp) / SR)) * (w - y); return g * (w - y) * ex(t, d * 0.45); }); };
const thud = (t0, f = 70, g = 0.5) => add(fx, t0, 0.5, (t) => g * Math.sin(TAU * (f + 40 * ex(t, 0.04)) * t) * ex(t, 0.14) + g * 0.25 * (R() * 2 - 1) * ex(t, 0.01));
const bip = (t0, f = 1800, d = 0.05, g = 0.2) => add(fx, t0, d + 0.02, (t) => g * Math.sin(TAU * f * t) * (t < d ? 1 : 0) * Math.min(1, t / 0.002));
const bloop = (t0, f0, f1, g = 0.25, d = 0.12) => { let ph = 0; add(fx, t0, d + 0.05, (t) => { const k = clamp(t / d); ph += (TAU * lerp(f0, f1, k * k)) / SR; return g * Math.sin(ph) * Math.min(1, t / 0.002) * ex(t, d * 0.7); }); };
const ruidoLP = (cor) => { let y = 0; return (g) => { const f = typeof cor === "function" ? cor(g) : cor; y += (1 - Math.exp((-TAU * f) / SR)) * ((R() * 2 - 1) - y); return y; }; };
const ruidoHP = (cor) => { let y = 0; return (g) => { const f = typeof cor === "function" ? cor(g) : cor; const w = R() * 2 - 1; y += (1 - Math.exp((-TAU * f) / SR)) * (w - y); return w - y; }; };

/* ───────── 1 · CAMA ───────── */
const demo = (t) => t >= ES[2] && t < ES[3]; // la demolición: más intensidad
const calma = (t) => t >= ES[4] && t < ES[5]; // las casas vacías: se aquieta
// pad con phaser
for (let b = 0, t = 0; t < DURACION; b++, t += BAR) {
  const acorde = [[-12, -5, 0, 3], [-10, -3, 2, 7], [-12, -5, 0, 3], [-17, -9, -2, 3]][b % 4];
  for (const n of acorde) { const f = hz(n); add(pad, t, BAR + 0.5, (tt) => { const e = sua(tt, 0, 0.5) * (1 - sua(tt, BAR - 0.1, BAR + 0.5)); let s = 0; for (let j = 0; j < 3; j++) { const ff = f * (1 + (j - 1) * 0.005); for (let h = 1; h <= 4; h++) s += Math.sin(TAU * ff * h * tt + j * 1.7 * h) / (h * h * 0.7); } return 0.05 * e * s * (calma(t) ? 1.3 : 1); }); }
}
{ let z = [0, 0, 0, 0], fb = 0;
  for (let i = 0; i < N; i++) { const t = i / SR, lfo = 0.5 + 0.5 * Math.sin(TAU * 0.15 * t); const fc = 260 + 1800 * lfo * lfo, k = Math.tan((Math.PI * fc) / SR), a = (k - 1) / (k + 1); let v = pad[i] + 0.35 * fb; for (let s = 0; s < 4; s++) { const y = a * v + z[s]; z[s] = v - a * y; v = y; } fb = v; mus[i] += 0.5 * (pad[i] + v); } }
// koto: arpegio ascendente y descendente por compás
for (let b = 0, t = 0; t < DURACION - 1; b++, t += BAR) {
  const suave = t < ES[1] || calma(t);
  const patron = [0, 1, 2, 3, 4, 3, 2, 1];
  for (let s = 0; s < 8; s++) { if (suave && s % 2) continue; koto(mus, t + s * (B / 2), nota(patron[s] + (b % 2) * 2, 1), suave ? 0.17 : 0.22); }
  if (!suave && b % 2 === 0) { shami(mus, t + 0.5 * B, nota(2, 0), 0.2); shami(mus, t + 2.5 * B, nota(4, 0), 0.2); shami(mus, t + 3.5 * B, nota(3, 0), 0.18); }
}
// flauta (melodía larga)
for (let b = 0, t = ES[1]; t < ES[6] - 1; b++, t += BAR * 2) { if (calma(t) || t >= ES[3]) { const m = [4, 3, 2, 0, 1, 3]; flauta(t + 0.2, nota(m[b % 6], 1) , BAR * 1.4, 0.1); } }
// taiko
for (let b = 0, t = ES[1]; t < ES[6] - 0.5; b++, t += BAR) {
  if (calma(t)) { if (b % 2 === 0) don(t, 0.35); continue; }
  don(t, demo(t) ? 0.8 : 0.55); ka(t + 1 * B, 0.3); don(t + 2 * B, demo(t) ? 0.7 : 0.45); ka(t + 3 * B, 0.3);
  if (demo(t)) { don(t + 1.5 * B, 0.5); ka(t + 2.5 * B, 0.25); ka(t + 3.5 * B, 0.25); }
}
// bajo sub
for (let b = 0, t = ES[1]; t < ES[6]; b++, t += BAR) { const n = [-24, -22, -24, -29][b % 4]; add(mus, t, BAR, (tt) => 0.2 * Math.sin(TAU * hz(n) * tt) * ex(tt, 1.2) * sua(tt, 0, 0.05)); }
// eco y reverb
{ const dl = Math.round(0.75 * B * SR), e = new Float32Array(dl); let p = 0, lp = 0;
  for (let i = 0; i < N; i++) { const o = e[p]; lp += 0.3 * (o - lp); e[p] = mus[i] + 0.38 * lp; mus[i] += 0.35 * o; p = (p + 1) % dl; }
  const y = buf(); for (const ms of [43.1, 61.3, 83.9, 109.7]) { const d = Math.round((ms * SR) / 1000), lin = new Float32Array(d); let q = 0, l2 = 0; for (let i = 0; i < N; i++) { const o = lin[q]; l2 += 0.3 * (o - l2); lin[q] = mus[i] + 0.78 * l2; y[i] += o; q = (q + 1) % d; } for (let i = 0; i < N; i++) mus[i] += y[i] * 0.2; } }

/* ───────── 2 · SONIDOS POR ESCENA ───────── */
// ESCENA 1: reloj que se acelera y campana de templo
{ for (let t = 1.0, k = 0; t < 4.5; k++) { crunch(T(1, t), 0.3, 0.012, 3200); bip(T(1, t) + 0.004, k % 2 ? 1100 : 900, 0.02, 0.12); t += lerp(0.4, 0.08, (t - 1) / 3.5); }
  campana(T(1, 4.6), 196, 0.45, 2.6); [0, 5].forEach((n, k) => marimba(fx, T(1, 4.7) + k * 0.1, n + 12, 0.18));
  for (let k = 0; k < 6; k++) bip(T(1, 1.0 + k * 0.1), 2400, 0.012, 0.08);
  { let ph = 0; add(fx, T(1, 4.6), 0.9, (t) => { ph += (TAU * (500 + 2600 * clamp(t / 0.7))) / SR; return 0.14 * Math.sin(ph) * (1 - sua(t, 0.6, 0.9)); }); } }
// ESCENA 2: lápiz, marcas y sello
{ { const n = ruidoHP(3800); add(fx, T(2, 1.0), 2.8, (t, g) => 0.14 * n(g) * (0.5 + 0.5 * Math.sin(TAU * 14 * t)) * ventana(t, 0, 2.8, 0.2)); }
  for (let k = 0; k < 4; k++) crunch(T(2, 0.3 + k * 0.12), 0.3, 0.012, 3000);
  thud(T(2, 4.8), 90, 0.5); crunch(T(2, 4.8), 0.4, 0.03, 1200); bip(T(2, 4.85), 1320, 0.1, 0.18);
  [0, 5].forEach((n, k) => bloop(T(2, 5.9) + k * 0.12, 1600, 700, 0.18, 0.08)); ding(T(2, 6.0), 2093, 0.14); }
// ESCENA 3: demolición
{ add(fx, T(3, 0.1), 2.6, (t) => 0.22 * (Math.sin(TAU * 38 * t) + 0.6 * Math.sin(TAU * 76 * t) + 0.3 * Math.sin(TAU * 114 * t)) * (0.7 + 0.3 * Math.sin(TAU * 11 * t)) * ventana(t, 0, 2.6, 0.3));      // motor diésel
  { let ph = 0; add(fx, T(3, 0.8), 1.2, (t) => { ph += (TAU * (420 + 160 * Math.sin(TAU * 1.1 * t))) / SR; return 0.07 * Math.sin(ph) * ventana(t, 0, 1.2, 0.2); }); }                                          // quejido hidráulico
  { const n = ruidoLP(600); add(fx, T(3, 2.0), 0.9, (t, g) => 0.8 * n(g) * ex(t, 0.25) * Math.min(1, t / 0.004)); thud(T(3, 2.0), 55, 0.7); }                                                          // crash
  for (let k = 0; k < 40; k++) crunch(T(3, 2.1 + Math.pow(R(), 1.6) * 1.4), 0.28, 0.025, 600 + R() * 2200);                                                                                              // escombros
  { const n = ruidoHP(1600); add(fx, T(3, 2.4), 1.4, (t, g) => 0.1 * n(g) * ex(t, 0.7)); }                                                                                                              // polvo
  [4.0, 5.0, 6.0].forEach((tb, k) => { for (let q = 0; q < 5; q++) bloop(T(3, tb + q * 0.07), 300 + q * 100, 600 + q * 120, 0.14, 0.06); marimba(fx, T(3, tb), 12 + k * 3, 0.14); }); }
// ESCENA 4: temblor, casa nueva y onda
{ add(fx, T(4, 0.1), 2.8, (t) => 0.4 * (Math.sin(TAU * 31 * t) + 0.5 * Math.sin(TAU * 47 * t)) * (0.6 + 0.4 * Math.sin(TAU * 9 * t)) * ventana(t, 0, 2.8, 0.5));                            // temblor
  { const n = ruidoLP(300); add(fx, T(4, 1.6), 0.6, (t, g) => 0.4 * n(g) * ventana(t, 0, 0.6, 0.15)); }                                                                                                 // flecha
  [0, 5, 7, 12, 15].forEach((n, k) => marimba(fx, T(4, 2.2) + k * 0.06, n + 24, 0.14)); ding(T(4, 2.2), 2349, 0.16);                                                                                    // cristal de la casa nueva
  { let ph = 0; add(fx, T(4, 2.8), 1.2, (t) => { ph += (TAU * (90 + 50 * Math.sin(TAU * 6 * t))) / SR; return 0.16 * Math.sin(ph) * ventana(t, 0, 1.2, 0.2); }); }                                         // onda sísmica
  [3.4, 4.8].forEach((tt) => { crunch(T(4, tt), 0.3, 0.015, 3000); bip(T(4, tt) + 0.003, 1300, 0.03, 0.14); }); }
// ESCENA 5: casas vacías
{ add(fx, T(5, 0.1), 1.2, (t) => 0.22 * Math.sin(TAU * (200 + 30 * Math.sin(TAU * 8 * t)) * t) * ventana(t, 0, 1.2, 0.3) * (0.5 + 0.5 * sua(t, 0, 0.8)));                                         // crujido de puerta
  for (let k = 0; k < 14; k++) { const tk = T(5, 2.2 + (k * 2.0) / 14); crunch(tk, 0.4, 0.02, 900); bip(tk + 0.002, 620 + (k % 3) * 60, 0.03, 0.16); }                                                    // clac de cada casita vacía
  { const n = ruidoLP((g) => 500 + 300 * Math.sin(g * 1.3)); add(fx, T(5, 0.5), 6.0, (t, g) => 0.16 * n(g) * ventana(t, 0, 6.0, 1.0)); }                                                             // viento solitario
  [880, 1175].forEach((f, k) => add(fx, T(5, 3.2) + k * 0.4, 1.4, (t) => 0.1 * Math.sin(TAU * f * t) * ex(t, 0.6) * Math.min(1, t / 0.01)));                                                           // eco de silbido
  thud(T(5, 3.2), 58, 0.45); ding(T(5, 5.4), 1568, 0.16); }
// ESCENA 6: papel, sello, bolígrafo
{ { const n = ruidoHP(2500); add(fx, T(6, 0.3), 0.7, (t, g) => 0.2 * n(g) * ventana(t, 0, 0.7, 0.2)); }
  thud(T(6, 1.8), 100, 0.4); crunch(T(6, 1.8), 0.3, 0.03, 1400);
  { const n = ruidoHP(3000); add(fx, T(6, 4.0), 1.4, (t, g) => 0.1 * n(g) * (0.5 + 0.5 * Math.sin(TAU * 12 * t)) * ventana(t, 0, 1.4, 0.15)); }
  [3.2, 4.0, 4.4, 4.8].forEach((tt) => crunch(T(6, tt), 0.25, 0.01, 3500)); ding(T(6, 5.6), 1760, 0.22); [0, 5, 7].forEach((n, k) => marimba(fx, T(6, 5.6) + k * 0.08, n + 24, 0.14)); }
// ESCENA 7: cierre
{ const t0 = ES[6];
  [0, 1, 2, 3, 4, 5, 6].forEach((g, k) => koto(fx, t0 + 0.15 + k * 0.1, nota(g, 1), 0.24));
  [0, 5, 7, 12, 15, 19].forEach((n, k) => marimba(fx, t0 + 0.9 + k * 0.1, n + 12, 0.22));
  campana(t0 + 0.1, 220, 0.3, 2.0); for (let k = 0; k < 6; k++) marimba(fx, t0 + 1.9 + k * 0.07, 24 + k * 3, 0.1); }

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
const salida = join(RAIZ, "assets", "musica", "casas-japon.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s · ${BPM} bpm`);
console.log("   escenas (inicio):", ES.map((a, i) => `${i + 1}:${a.toFixed(1)}s`).join("  "));
