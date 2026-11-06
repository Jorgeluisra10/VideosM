#!/usr/bin/env node
/**
 * Música «de carretera» + diseño sonoro propio (síntesis, sin muestras ni licencias) para «Los 3 códigos escondidos en tu vehículo» (42,5 s).
 * Cama: synthwave en la menor, 108 bpm: arpegiador de sierra con filtro, bajo con compuerta, pad con phaser, kick, caja con aplauso y hi-hats;
 * entra en la escena 2, se aligera en la 4 (las llantas que vencen), sube en la 5 (el VIN) y explota en la 6. Encima, sonidos DISTINTOS por escena:
 *
 *   1 · gancho   arranque del motor (marcha y encendido) · «tic» de la aguja del medidor · campanita del cinturón · riser
 *   2 · tanque   intermitente «tic-toc» · tapa que abre «clic» · pistola que encaja · gluglú de la gasolina · timbre de la bomba
 *   3 · llanta   chirrido de llanta · golpe de goma · barrido del zoom · sello del código · 52 clics del calendario
 *   4 · edad     crujido del caucho · reloj que se acelera · pitido de aviso (6 años) y alarma doble (10 años)
 *   5 · VIN      18 golpes de máquina de escribir al estampar la placa · «bip» de escáner · acorde de la letra T
 *   6 · repaso   limpiaparabrisas · golpe de papel de la tarjeta · barrido láser · tres «tics» de la lista
 *   7 · cierre   «bip-bip» del seguro del vehículo · portazo · jingle de marimba
 *
 * Uso:  node videos/2026-11-06-codigos-vehiculo/componer-musica.mjs   → assets/musica/codigos-vehiculo.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/codigos-vehiculo.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 43;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(20261106);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sua = (v, a, b) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const ex = (t, tau) => Math.exp(-t / tau);
const buf = () => new Float32Array(N);
const mus = buf(), pad = buf(), fx = buf();
const add = (b, t0, dur, fn) => { const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round((t0 + dur) * SR)); for (let i = i0; i < i1; i++) b[i] += fn((i - i0) / SR, i / SR); };
const hz = (n) => 220 * Math.pow(2, n / 12); // n = semitonos sobre la3

const dur = [6.4, 6.9, 6.1, 5.3, 6.9, 5.9, 5.0];
const ES = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const T = (n, t) => ES[n - 1] + t;
const BPM = 108, B = 60 / BPM, BAR = 4 * B;
const ventana = (g, a, b, r = 0.3) => sua(g, a, a + r) * (1 - sua(g, b - r, b));

/* ───────── instrumentos ───────── */
function saw(b, t0, n, d, g, brillo = 2400, oct = 0) {
  const f = hz(n + oct * 12); let ph = 0;
  add(b, t0, d + 0.12, (t, gl) => {
    ph += (TAU * f) / SR;
    const c = brillo * (0.3 + 0.7 * ex(t, 0.12)) * (0.7 + 0.3 * Math.sin(TAU * 0.13 * gl));
    let s = 0; for (let h = 1; h <= 14; h++) s += (Math.sin(h * ph) / h) * Math.max(0, 1 - (h * f) / c);
    return g * s * Math.min(1, t / 0.003) * (t < d ? 1 : ex(t - d, 0.05));
  });
}
const kick = (t0, g = 0.7) => add(fx, t0, 0.4, (t) => g * Math.sin(TAU * (45 + 120 * ex(t, 0.03)) * t) * ex(t, 0.13));
const snare = (t0, g = 0.4) => { let y = 0; add(fx, t0, 0.3, (t) => { const w = R() * 2 - 1; y += 0.3 * (w - y); return g * ((w - y) * 1.2 * ex(t, 0.09) + 0.4 * Math.sin(TAU * 190 * t) * ex(t, 0.06)); }); };
const hat = (t0, g = 0.08, d = 0.04) => { let y = 0; add(fx, t0, d + 0.02, (t) => { const w = R() * 2 - 1; const hp = w - y; y += 0.6 * (w - y); return g * hp * ex(t, d * 0.5); }); };
function marimba(b, t0, n, g = 0.3) { const f = hz(n); add(b, t0, 0.9, (t) => g * Math.min(1, t / 0.001) * (Math.sin(TAU * f * t) * ex(t, 0.28) + 0.35 * Math.sin(TAU * f * 3.99 * t) * ex(t, 0.05) + 0.1 * Math.sin(TAU * f * 9.2 * t) * ex(t, 0.02))); }
const bip = (t0, f = 1800, d = 0.08, g = 0.22) => add(fx, t0, d + 0.02, (t) => g * Math.sin(TAU * f * t) * (t < d ? 1 : 0) * Math.min(1, t / 0.002));
const crunch = (t0, g = 0.3, d = 0.05, hp = 1500) => { let y = 0; add(fx, t0, d + 0.02, (t) => { const w = R() * 2 - 1; y += (1 - Math.exp((-TAU * hp) / SR)) * (w - y); return g * (w - y) * ex(t, d * 0.45); }); };
const thud = (t0, f = 70, g = 0.5) => add(fx, t0, 0.5, (t) => g * Math.sin(TAU * (f + 40 * ex(t, 0.04)) * t) * ex(t, 0.14) + g * 0.25 * (R() * 2 - 1) * ex(t, 0.01));
const bloop = (t0, f0, f1, g = 0.25, d = 0.12) => { let ph = 0; add(fx, t0, d + 0.05, (t) => { const k = clamp(t / d); ph += (TAU * lerp(f0, f1, k * k)) / SR; return g * Math.sin(ph) * Math.min(1, t / 0.002) * ex(t, d * 0.7); }); };
const ruidoLP = (cor) => { let y = 0; return (g) => { const f = typeof cor === "function" ? cor(g) : cor; y += (1 - Math.exp((-TAU * f) / SR)) * ((R() * 2 - 1) - y); return y; }; };
const ruidoHP = (cor) => { let y = 0; return (g) => { const f = typeof cor === "function" ? cor(g) : cor; const w = R() * 2 - 1; y += (1 - Math.exp((-TAU * f) / SR)) * (w - y); return w - y; }; };

/* ───────── 1 · CAMA MUSICAL ───────── */
const ACORDES = [[-12, -5, 0, 3], [-16, -9, -4, 0], [-14, -7, -2, 2], [-17, -10, -5, -1]]; // Am · F · G · E
// pad con phaser
for (let b = 0, t = 0; t < DURACION; b++, t += BAR) {
  const nivel = t >= ES[3] && t < ES[4] ? 0.7 : 1;
  for (const n of ACORDES[b % 4]) {
    const f = hz(n);
    add(pad, t, BAR + 0.5, (tt, g) => { const e = sua(tt, 0, 0.4) * (1 - sua(tt, BAR - 0.1, BAR + 0.5)); let s = 0; for (let j = 0; j < 3; j++) { const ff = f * (1 + (j - 1) * 0.005); for (let h = 1; h <= 5; h++) s += Math.sin(TAU * ff * h * tt + j * 1.7 * h) / (h * h * 0.7); } return 0.06 * nivel * e * s; });
  }
}
{ let z = [0, 0, 0, 0], fb = 0;
  for (let i = 0; i < N; i++) { const t = i / SR, lfo = 0.5 + 0.5 * Math.sin(TAU * 0.17 * t); const fc = 280 + 2000 * lfo * lfo, k = Math.tan((Math.PI * fc) / SR), a = (k - 1) / (k + 1); let v = pad[i] + 0.35 * fb; for (let s = 0; s < 4; s++) { const y = a * v + z[s]; z[s] = v - a * y; v = y; } fb = v; mus[i] += 0.5 * (pad[i] + v); } }
// arpegiador de sierra (semicorcheas) con el acorde de cada compás
for (let b = 0, t = 0; t < DURACION - 1; b++, t += BAR) {
  const suave = t < ES[1] || (t >= ES[3] && t < ES[4]);
  const ac = ACORDES[b % 4];
  const pat = [0, 1, 2, 3, 2, 1, 3, 2];
  for (let s = 0; s < 16; s++) { if (suave && s % 2) continue; saw(mus, t + s * (B / 4), ac[pat[s % 8]] + 12, B / 4 * 0.9, suave ? 0.08 : 0.12, t >= ES[4] ? 3400 : 2400); }
}
// bajo con compuerta y batería
for (let b = 0, t = ES[1]; t < ES[6] + 1; b++, t += BAR) {
  const rapida = t >= ES[3] && t < ES[4];
  for (let s = 0; s < 8; s++) { const n = ACORDES[b % 4][0] - 12; saw(mus, t + s * (B / 2), n, B / 2 * 0.55, 0.2, 900); }
  kick(t, 0.6); if (!rapida) { kick(t + 2 * B, 0.55); kick(t + 2.75 * B, 0.4); } snare(t + B, 0.38); snare(t + 3 * B, 0.38);
  if (!rapida) for (let s = 0; s < 8; s++) hat(t + s * (B / 2), s % 2 ? 0.1 : 0.06);
}
// eco y reverberación
{ const dl = Math.round(0.75 * B * SR), e = new Float32Array(dl); let p = 0, lp = 0;
  for (let i = 0; i < N; i++) { const o = e[p]; lp += 0.3 * (o - lp); e[p] = mus[i] + 0.4 * lp; mus[i] += 0.4 * o; p = (p + 1) % dl; }
  const y = buf();
  for (const ms of [37.1, 53.3, 71.9, 97.3]) { const d = Math.round((ms * SR) / 1000), lin = new Float32Array(d); let q = 0, l2 = 0; for (let i = 0; i < N; i++) { const o = lin[q]; l2 += 0.32 * (o - l2); lin[q] = mus[i] + 0.75 * l2; y[i] += o; q = (q + 1) % d; } }
  for (let i = 0; i < N; i++) mus[i] += y[i] * 0.18; }

/* ───────── 2 · SONIDOS DISTINTOS POR ESCENA ───────── */
// ESCENA 1 · arranque del motor y aguja
{ const t0 = 0.1; const nr = ruidoLP(380);
  add(fx, t0, 0.9, (t, g) => 0.35 * Math.sin(TAU * (28 + 20 * sua(t, 0, 0.8)) * t) * (0.6 + 0.4 * Math.sin(TAU * 18 * t)) + 0.25 * nr(g) * ventana(t, 0, 0.9, 0.1));        // marcha
  for (let k = 0; k < 6; k++) thud(t0 + 0.9 + k * 0.045 * (1 + k * 0.2), 55 + k * 4, 0.22);                                                                                  // encendido
  add(fx, t0 + 1.2, 3.2, (t) => 0.22 * (Math.sin(TAU * 42 * t) + 0.6 * Math.sin(TAU * 84 * t) + 0.3 * Math.sin(TAU * 126 * t)) * (1 - sua(t, 2.4, 3.2)) * sua(t, 0, 0.3));      // ralentí
  for (let k = 0; k < 12; k++) bip(T(1, 0.3 + k * 0.14), 2400 + k * 40, 0.015, 0.1);                                                                                         // tics de la aguja
  [1568, 1175].forEach((f, k) => add(fx, T(1, 1.9) + k * 0.28, 0.9, (t) => 0.2 * Math.sin(TAU * f * t) * ex(t, 0.35) * Math.min(1, t / 0.002)));                            // campanita del cinturón
  { const te = ES[1], d = 1.0; const n = ruidoHP((g) => 800 + 6000 * Math.pow(clamp((g - (te - d)) / d), 2)); add(fx, te - d, d, (t, g) => 0.25 * n(g) * Math.pow(t / d, 2)); } }  // riser
// ESCENA 2 · intermitente, tapa, pistola y gasolina
{ for (let k = 0; k < 6; k++) { const t0 = T(2, 0.3 + k * 0.38); crunch(t0, 0.4, 0.012, 3000); bip(t0 + 0.005, 900, 0.02, 0.2); }                                                // intermitente «tic-toc»
  crunch(T(2, 1.8), 0.5, 0.02, 2200); bloop(T(2, 1.82), 500, 900, 0.2, 0.05);                                                                                                   // tapa: clic y pop
  thud(T(2, 3.2), 120, 0.45); crunch(T(2, 3.2), 0.4, 0.03, 1800);                                                                                                                // pistola que encaja
  for (let k = 0; k < 12; k++) bloop(T(2, 3.4 + k * 0.09), 300 + R() * 200, 700 + R() * 400, 0.2, 0.07);                                                                         // gluglú
  [1976, 1568].forEach((f, k) => add(fx, T(2, 4.4) + k * 0.2, 0.6, (t) => 0.2 * Math.sin(TAU * f * t) * ex(t, 0.25) * Math.min(1, t / 0.002)));                               // timbre de la bomba
  crunch(T(2, 4.0), 0.35, 0.02, 2600); crunch(T(2, 4.8), 0.5, 0.02, 2200); thud(T(2, 5.2), 110, 0.4); for (let k = 0; k < 10; k++) bloop(T(2, 5.4 + k * 0.1), 300 + R() * 200, 700 + R() * 400, 0.16, 0.07); }
// ESCENA 3 · llanta y calendario
{ { const n = ruidoHP((g) => 2200 + 1800 * Math.sin(g * 30)); add(fx, T(3, 0.15), 0.6, (t, g) => 0.28 * n(g) * (0.7 + 0.3 * Math.sin(TAU * 90 * t)) * ventana(t, 0, 0.6, 0.1)); }         // chirrido de llanta
  thud(T(3, 0.8), 80, 0.45);                                                                                                                                                      // golpe de goma
  { const nn = ruidoLP((g) => 400 + 3400 * sua(g, T(3, 1.2), T(3, 2.2))); add(fx, T(3, 1.2), 1.1, (t, g) => 0.5 * nn(g) * ventana(t, 0, 1.1, 0.2)); }                          // barrido del zoom
  thud(T(3, 2.4), 100, 0.5); crunch(T(3, 2.4), 0.5, 0.04, 1200); bip(T(3, 2.45), 1320, 0.12, 0.2);                                                                              // sello del código
  for (let k = 0; k < 52; k++) crunch(T(3, 3.9 + (k * 0.9) / 52), 0.2, 0.01, 2800 + k * 30);                                                                                     // 52 clics del calendario
  marimba(fx, T(3, 4.9), 24, 0.22); }
// ESCENA 4 · llantas que vencen
{ { let ph = 0; add(fx, T(4, 0.4), 3.6, (t, g) => { ph += (TAU * (140 + 60 * Math.sin(TAU * 2.2 * t) + 30 * sua(t, 0, 3.6))) / SR; return 0.14 * (Math.sin(ph) + 0.5 * Math.sin(2.7 * ph)) * ventana(t, 0, 3.6, 0.4); }); } // crujido del caucho
  for (let k = 0; k < 30; k++) { const u = k / 30; crunch(T(4, 0.8 + u * 3.0 + R() * 0.05), 0.25, 0.012, 1800 + R() * 2200); }                                                       // grietas
  for (let t = 0.4, k = 0; t < 4.0; k++) { const p = lerp(0.5, 0.12, t / 4); crunch(T(4, t), 0.3, 0.02, 3000); bloop(T(4, t) + 0.005, k % 2 ? 1000 : 800, 700, 0.12, 0.03); t += p; }   // reloj que se acelera
  bip(T(4, 2.0), 1400, 0.18, 0.24); bip(T(4, 2.0) + 0.3, 1400, 0.18, 0.24);                                                                                                      // aviso a los 6 años
  for (let k = 0; k < 2; k++) { bip(T(4, 3.8) + k * 0.35, 880, 0.16, 0.3); bip(T(4, 3.8) + k * 0.35 + 0.17, 1180, 0.16, 0.3); } }                                               // alarma a los 10 años
// ESCENA 5 · VIN
{ for (let k = 0; k < 17; k++) { const tk = T(5, 0.3 + (k * 1.4) / 17); crunch(tk, 0.45, 0.018, 1500); thud(tk, 150 + (k % 3) * 20, 0.18); }                                          // máquina de escribir
  bip(T(5, 2.9), 2600, 0.05, 0.2); bip(T(5, 2.98), 2600, 0.05, 0.2);                                                                                                            // escáner
  [0, 4, 7, 12, 16].forEach((n, k) => marimba(fx, T(5, 3.0) + k * 0.07, n + 12, 0.24));                                                                                          // acorde de la T
  for (let k = 0; k < 4; k++) marimba(fx, T(5, 4.3 + k * 0.17), 12 + k * 4, 0.12);                                                                                               // tabla de años
  crunch(T(5, 5.6), 0.3, 0.02, 3000); }
// ESCENA 6 · repaso
{ for (let k = 0; k < 2; k++) { const t0 = T(6, 0.3 + k * 0.5); const n = ruidoLP((g) => 600 + 1800 * Math.sin(Math.PI * clamp((g - t0) / 0.45))); add(fx, t0, 0.45, (t, g) => 0.4 * n(g) * Math.sin(Math.PI * clamp(t / 0.45))); }   // limpiaparabrisas
  { let ph = 0; add(fx, T(6, 0.5), 0.8, (t) => { ph += (TAU * (600 + 3000 * clamp(t / 0.7))) / SR; return 0.16 * Math.sin(ph) * (1 - sua(t, 0.6, 0.8)); }); }                         // barrido láser (VIN)
  { const n = ruidoHP(2200); add(fx, T(6, 2.4), 0.25, (t, g) => 0.5 * n(g) * ex(t, 0.07)); thud(T(6, 2.4), 100, 0.35); }                                                          // golpe de papel de la tarjeta
  [3.8, 4.3, 4.8].forEach((t, k) => add(fx, T(6, t), 0.22, (tt) => 0.26 * Math.sin(TAU * [1318, 1568, 1976][k] * tt) * ex(tt, 0.05) * Math.min(1, tt / 0.001))); }                 // tics de la lista
// ESCENA 7 · cierre
{ const t0 = ES[6];
  bip(t0 + 0.1, 2000, 0.09, 0.3); bip(t0 + 0.3, 2000, 0.09, 0.3);                                                                                                                 // «bip-bip» del seguro
  thud(t0 + 0.55, 60, 0.5); crunch(t0 + 0.55, 0.4, 0.04, 800);                                                                                                                    // portazo
  [0, 4, 7, 12, 16, 19, 24].forEach((n, k) => marimba(fx, t0 + 0.8 + k * 0.1, n + 12, 0.24));
  for (let k = 0; k < 6; k++) marimba(fx, t0 + 1.9 + k * 0.07, 24 + k * 3, 0.1); }

/* ───────── 3 · mezcla ───────── */
const x = buf();
for (let i = 0; i < N; i++) x[i] = mus[i] * 0.85 + fx[i];
{ const y = buf(); for (const ms of [27.1, 41.9, 59.3]) { const d = Math.round((ms * SR) / 1000), lin = new Float32Array(d); let q = 0, lp = 0; for (let i = 0; i < N; i++) { const o = lin[q]; lp += 0.4 * (o - lp); lin[q] = fx[i] + 0.7 * lp; y[i] += o; q = (q + 1) % d; } } for (let i = 0; i < N; i++) x[i] += y[i] * 0.14; }
let pico = 0; for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(x[i]));
const gl = 0.9 / Math.max(1e-4, pico);
for (let i = 0; i < N; i++) x[i] = Math.tanh(x[i] * gl * 1.2) * 0.9;
const fi = Math.round(0.04 * SR), fo = Math.round(1.2 * SR);
for (let i = 0; i < fi; i++) x[i] *= i / fi; for (let i = 0; i < fo; i++) x[N - 1 - i] *= i / fo;
mkdirSync(join(RAIZ, "assets", "musica"), { recursive: true });
const salida = join(RAIZ, "assets", "musica", "codigos-vehiculo.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s · ${BPM} bpm`);
console.log("   escenas (inicio):", ES.map((a, i) => `${i + 1}:${a.toFixed(1)}s`).join("  "));
