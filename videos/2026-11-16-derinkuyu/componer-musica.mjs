#!/usr/bin/env node
/**
 * Música de aventura oscura tipo Indiana Jones + diseño sonoro propio (síntesis, sin muestras ni licencias) para «Derinkuyu» (≈ 99 s).
 * Cama: re menor armónico a 104 bpm: dron grave, cuerdas en trémolo, timbales y tambores, motivo de metales y flauta tipo duduk; mucha reverberación de cueva,
 * silencio tenso con latido en los invasores y fanfarria de aventura en el cierre.
 * Encima, sonidos DISTINTOS por escena, alineados con lo que se ve:
 *   1 · gancho     golpes de mazo · ladrillos que caen · cacareo de la gallina · derrumbe de la pared · «¡!» · caída por el agujero
 *   2 · roca       picos que tintinean en la piedra · desmoronamiento · chillido del topo · polvo
 *   3 · pisos A    ascensor que baja · crujir de cuerda · «ding» por cada piso · relincho · rebuzno · cacareo
 *   4 · pisos B    crepitar del horno · muela de la prensa · tintineo de tinajas · campana de la escuela
 *   5 · pisos C    campanas de iglesia · coro · murciélagos · golpe grave del fondo
 *   6 · aire       aullido del viento por el pozo · respiración (inhalar y exhalar) · soplo caliente · flauta
 *   7 · puerta     pasos que corren · rodar de la piedra (retumbar) · golpe con polvo · lanza que roza · chillido del soldado · metal
 *   8 · gente      murmullo que crece · pop por cada piso · redoble de tambor · «ding» final
 *   9 · túnel      goteo con eco · pasos · aleteo de murciélagos · destello de ojos
 *  10 · invasores  galope · latido en el silencio · olfateo · kazoo de «¿eh?» · huida al galope
 *  11 · hoy        charla de turistas · obturador y destello · cinta que tintinea · pad misterioso
 *  12 · cierre     subida rápida · martillo que sube · guiño · golpe y luz dorada
 *  13 · CTA        fanfarria de aventura
 * Uso:  node videos/2026-11-16-derinkuyu/componer-musica.mjs   → assets/musica/derinkuyu.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/derinkuyu.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dur = [8, 7, 8, 8, 8, 9, 8, 8, 7, 8, 7, 8, 5];
export const DURACION = dur.reduce((a, b) => a + b, 0) + 0.5;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(161116);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sua = (v, a, b) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const ex = (t, tau) => Math.exp(-t / tau);
const buf = () => new Float32Array(N);
const mus = buf(), fx = buf();
const add = (b, t0, d, fn) => { const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round((t0 + d) * SR)); for (let i = i0; i < i1; i++) b[i] += fn((i - i0) / SR, i / SR); };
const mid = (n) => 440 * Math.pow(2, (n - 69) / 12);
const ES = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const T = (n, t) => ES[n - 1] + t;
const BPM = 104, B = 60 / BPM, BAR = 4 * B;
const escena = (t) => ES.findIndex((e, i) => t >= e && (i === ES.length - 1 || t < ES[i + 1])) + 1;
const ventana = (g, a, b, r = 0.3) => sua(g, a, a + r) * (1 - sua(g, b - r, b));

/* ───────── instrumentos ───────── */
const ruidoLP = (cor) => { let y = 0; return (g) => { const f = Math.max(20, typeof cor === "function" ? cor(g) : cor); y += (1 - Math.exp((-TAU * f) / SR)) * ((R() * 2 - 1) - y); return y; }; };
const ruidoHP = (cor) => { let y = 0; return (g) => { const f = Math.max(20, typeof cor === "function" ? cor(g) : cor); const w = R() * 2 - 1; y += (1 - Math.exp((-TAU * f) / SR)) * (w - y); return w - y; }; };
function dron(t0, d, n, g = 0.18) { const f = mid(n); add(mus, t0, d + 0.4, (t) => { const e = sua(t, 0, 0.8) * (1 - sua(t, d - 0.4, d + 0.4)); return g * e * (Math.sin(TAU * f * t) + 0.6 * Math.sin(TAU * f * 2.003 * t) + 0.3 * Math.sin(TAU * f * 3.01 * t)) * (0.85 + 0.15 * Math.sin(TAU * 0.4 * t)); }); }
function cuerdas(t0, d, notas, g = 0.05) { add(mus, t0, d + 0.3, (t) => { const e = sua(t, 0, 0.4) * (1 - sua(t, d - 0.2, d + 0.3)); let s = 0; for (const n of notas) { const f = mid(n); for (const de of [-0.004, 0.004]) for (let h = 1; h <= 5; h++) s += Math.sin(TAU * f * (1 + de) * h * t) / (h * 1.2); } return g * e * s * (0.7 + 0.3 * Math.sin(TAU * 7 * t)); }); }
function metal(t0, n, d = 0.4, g = 0.12) { const f = mid(n); add(mus, t0, d + 0.1, (t) => { const e = sua(t, 0, 0.03) * (1 - sua(t, d - 0.06, d + 0.1)); let s = 0; for (let h = 1; h <= 9; h++) s += (Math.sin(TAU * f * h * t) / h) * (0.5 + 0.5 * sua(t, 0, 0.08)); return g * e * s; }); }
function duduk(t0, n, d = 0.8, g = 0.1, b = mus) { const f = mid(n); add(b, t0, d + 0.1, (t) => { const e = sua(t, 0, 0.1) * (1 - sua(t, d - 0.12, d + 0.1)); const v = 1 + 0.008 * Math.sin(TAU * 5.2 * t) * sua(t, 0.1, 0.4); let s = 0; for (const h of [1, 3, 5, 7]) s += Math.sin(TAU * f * v * h * t) / h; return g * e * s; }); }
const tom = (t0, f = 90, g = 0.3, b = mus) => add(b, t0, 0.45, (t) => g * Math.sin(TAU * (f + 60 * ex(t, 0.04)) * t) * ex(t, 0.16));
const timbal = (t0, f = 62, g = 0.4) => add(fx, t0, 0.9, (t) => g * Math.sin(TAU * (f + 36 * ex(t, 0.05)) * t) * ex(t, 0.3));
const caja = (t0, g = 0.14) => { const n = ruidoHP(1400); add(fx, t0, 0.14, (t, gg) => g * (n(gg) * ex(t, 0.04) + 0.3 * Math.sin(TAU * 200 * t) * ex(t, 0.05))); };
const shaker = (t0, g = 0.05) => { const n = ruidoHP(6500); add(fx, t0, 0.07, (t, gg) => g * n(gg) * ex(t, 0.02)); };
const crunch = (t0, g = 0.3, d = 0.05, hp = 1500) => { const n = ruidoHP(hp); add(fx, t0, d + 0.02, (t, gg) => g * n(gg) * ex(t, d * 0.45)); };
const thud = (t0, f = 70, g = 0.5) => add(fx, t0, 0.5, (t) => g * Math.sin(TAU * (f + 40 * ex(t, 0.04)) * t) * ex(t, 0.14) + g * 0.25 * (R() * 2 - 1) * ex(t, 0.01));
const ding = (t0, f = 1568, g = 0.2) => add(fx, t0, 1.6, (t) => g * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2.76 * t) * ex(t, 0.2)) * ex(t, 0.5) * Math.min(1, t / 0.002));
const campana = (t0, f = 220, g = 0.22) => add(fx, t0, 3.2, (t) => g * Math.min(1, t / 0.003) * ex(t, 1.2) * (Math.sin(TAU * f * t) + 0.6 * Math.sin(TAU * f * 2.0 * t) * ex(t, 0.8) + 0.5 * Math.sin(TAU * f * 2.76 * t) * ex(t, 0.5) + 0.35 * Math.sin(TAU * f * 5.4 * t) * ex(t, 0.3)));
const clink = (t0, g = 0.16, f = 2800) => add(fx, t0, 0.4, (t) => g * (Math.sin(TAU * f * t) * ex(t, 0.06) + 0.6 * Math.sin(TAU * f * 1.51 * t) * ex(t, 0.04)) * Math.min(1, t / 0.001));
const pico = (t0, g = 0.28) => { clink(t0, g, 3400 + R() * 600); crunch(t0, g * 0.8, 0.03, 2500); thud(t0, 110, g * 0.5); };
const whoosh = (t0, d = 0.5, g = 0.2, f0 = 300, f1 = 4000) => { const n = ruidoHP((gg) => lerp(f0, f1, clamp((gg - t0) / d))); add(fx, t0, d + 0.1, (t, gg) => g * n(gg) * sua(t, 0, d * 0.5) * (1 - sua(t, d * 0.7, d + 0.1))); };
const gota = (t0, g = 0.16, f = 1500) => add(fx, t0, 0.25, (t) => g * Math.sin(TAU * (f - 700 * clamp(t / 0.08)) * t) * ex(t, 0.05) * Math.min(1, t / 0.002));
function retumbar(t0, d, g = 0.4, f = 120) { const n = ruidoLP(f); add(fx, t0, d, (t, gg) => g * n(gg) * (0.6 + 0.4 * Math.sin(TAU * 5 * t)) * ventana(t, 0, d, 0.4)); }
function derrumbe(t0, g = 0.4) { retumbar(t0, 1.4, g); for (let k = 0; k < 9; k++) { crunch(t0 + k * 0.1 + R() * 0.08, g * 0.5, 0.1, 600 + R() * 1400); thud(t0 + k * 0.1, 55 + R() * 40, g * 0.4); } }
function cacareo(t0, g = 0.14) { for (let k = 0; k < 5; k++) add(fx, t0 + k * 0.09, 0.07, (t) => g * Math.sin(TAU * (900 + 300 * Math.sin(k * 2.1) + 200 * t / 0.07) * t) * ex(t, 0.03)); }
function relincho(t0, g = 0.18) { let ph = 0; add(fx, t0, 0.9, (t) => { const k = t / 0.9; ph += (TAU * (lerp(520, 1100, sua(k, 0, 0.2)) * (1 - 0.5 * sua(k, 0.5, 1)) + 40 * Math.sin(TAU * 14 * t))) / SR; return g * (Math.sin(ph) + 0.5 * Math.sin(2 * ph)) * ventana(t, 0, 0.9, 0.08); }); }
function rebuzno(t0, g = 0.2) { for (const [o, f0, f1] of [[0, 300, 520], [0.45, 520, 260], [0.9, 300, 520], [1.35, 520, 240]]) { let ph = 0; add(fx, t0 + o, 0.42, (t) => { ph += (TAU * lerp(f0, f1, t / 0.4)) / SR; return g * (Math.sin(ph) + 0.6 * Math.sin(2 * ph) + 0.4 * Math.sin(3 * ph)) * ventana(t, 0, 0.42, 0.04); }); } }
function viento(t0, d, g = 0.2) { const n = ruidoLP((gg) => 300 + 900 * sua(gg, t0, t0 + d)); add(fx, t0, d, (t, gg) => g * n(gg) * ventana(t, 0, d, 0.6) * (0.7 + 0.3 * Math.sin(TAU * 0.8 * t))); }
function respira(t0, g = 0.12) { for (const [o, d] of [[0, 0.9], [1.2, 1.1]]) { const n = ruidoLP(900); add(fx, t0 + o, d, (t, gg) => g * n(gg) * Math.sin(Math.PI * clamp(t / d))); } }
function pasos(t0, k, paso = 0.2, g = 0.18) { for (let i = 0; i < k; i++) { thud(t0 + i * paso, 100 + (i % 2) * 20, g * 0.6); crunch(t0 + i * paso, g * 0.6, 0.03, 900); } }
function galope(t0, k, g = 0.2) { for (let i = 0; i < k; i++) { const tt = t0 + i * 0.36; for (const o of [0, 0.1, 0.2]) { thud(tt + o, 90 + o * 120, g * (o === 0.2 ? 1 : 0.7)); crunch(tt + o, g * 0.4, 0.03, 700); } } }
function aleteo(t0, d = 1.2, g = 0.1) { const n = ruidoHP(1500); add(fx, t0, d, (t, gg) => g * n(gg) * (0.5 + 0.5 * Math.sin(TAU * 18 * t)) * ventana(t, 0, d, 0.2)); }
function kazoo(t0, g = 0.16) { let ph = 0; add(fx, t0, 0.5, (t) => { ph += (TAU * (lerp(380, 520, t / 0.5) + 14 * Math.sin(TAU * 7 * t))) / SR; return g * (Math.sin(ph) > 0 ? 1 : -1) * 0.4 * ventana(t, 0, 0.5, 0.04) + g * 0.5 * Math.sin(ph) * ventana(t, 0, 0.5, 0.04); }); }
function yelp(t0, g = 0.16) { let ph = 0; add(fx, t0, 0.3, (t) => { ph += (TAU * lerp(900, 1500, t / 0.12) * (t > 0.12 ? 0.7 : 1)) / SR; return g * Math.sin(ph) * ventana(t, 0, 0.3, 0.03); }); }
function murmullo(t0, d, g = 0.1) { const n = ruidoLP(1100); add(fx, t0, d, (t, gg) => g * n(gg) * (0.6 + 0.4 * Math.sin(TAU * 3.1 * t + Math.sin(t * 7))) * ventana(t, 0, d, 0.5)); }
function crepita(t0, d, g = 0.16) { const n = ruidoHP(3000); add(fx, t0, d, (t, gg) => g * n(gg) * (R() > 0.88 ? 1 : 0.06) * ventana(t, 0, d, 0.3)); }
function coro(t0, d, notas, g = 0.06) { add(fx, t0, d, (t) => { const e = sua(t, 0, 0.8) * (1 - sua(t, d - 0.8, d)); let s = 0; for (const n of notas) { const f = mid(n) * (1 + 0.003 * Math.sin(TAU * 5 * t)); s += Math.sin(TAU * f * t) + 0.55 * Math.sin(TAU * f * 2 * t) + 0.35 * Math.sin(TAU * f * 3 * t); } return g * e * s; }); }
function chirrio(t0, d = 0.8, g = 0.12, f = 140) { let ph = 0; add(fx, t0, d, (t) => { ph += (TAU * (f + 40 * Math.sin(TAU * 2.1 * t))) / SR; return g * (Math.sin(ph) + 0.6 * Math.sin(2.3 * ph)) * (0.4 + 0.6 * Math.abs(Math.sin(TAU * 11 * t))) * ventana(t, 0, d, 0.1); }); }
function obturador(t0, g = 0.22) { crunch(t0, g, 0.01, 3000); crunch(t0 + 0.06, g * 0.8, 0.01, 2200); }
function zap(t0, g = 0.2) { let ph = 0; add(fx, t0, 0.35, (t) => { ph += (TAU * lerp(300, 2800, clamp(t / 0.3) ** 2)) / SR; return g * (Math.sin(ph) + 0.4 * Math.sin(2 * ph)) * ex(t, 0.2) * Math.min(1, t / 0.003); }); }
function riser(tf, d = 1.0, g = 0.16) { const n = ruidoHP((gg) => 500 + 6000 * Math.pow(clamp((gg - (tf - d)) / d), 2)); add(fx, tf - d, d, (t, gg) => g * n(gg) * Math.pow(t / d, 2)); }
function fanfarria(t0, notas, g = 0.13) { notas.forEach((n, k) => metal(t0 + k * 0.11, n, 0.5, g)); }

/* ───────── 1 · CAMA ───────── */
// re menor armónico: Dm · Bb · A · Dm; motivo de aventura
const PROG = [[38, [62, 65, 69]], [34, [62, 65, 70]], [33, [61, 64, 69]], [38, [62, 65, 69]]];
const MOT = [0, 0, 2, 3, 5, 3, 2, 0];   // grados sobre re
const ESC = [62, 64, 65, 67, 69, 70, 73, 74];
for (let b = 0, t = 0; t < DURACION - 0.6; b++, t += BAR) {
  const sc = escena(t);
  const [raiz, ac] = PROG[b % 4];
  const tenso = sc === 10;          // invasores: casi silencio
  const hondo = sc === 3 || sc === 4 || sc === 5 || sc === 6 || sc === 9;
  dron(t, BAR, raiz, tenso ? 0.1 : 0.17);
  cuerdas(t, BAR, ac.map((n) => n - 12), tenso ? 0.02 : 0.045);
  if (!tenso) for (let q = 0; q < 4; q++) { tom(t + q * B, q % 2 ? 80 : 100, hondo ? 0.2 : 0.3); if (q === 3) tom(t + q * B + B / 2, 120, 0.2); for (let s = 0; s < 2; s++) shaker(t + q * B + s * (B / 2), 0.04); }
  if (sc === 1 || sc === 7 || sc === 12 || sc === 13) { timbal(t, 55, 0.35); for (let q = 0; q < 4; q++) caja(t + q * B + B / 2, 0.1); }
  // motivo de metales (más escaso en descensos y silencio)
  if (!tenso && (sc === 1 || sc === 7 || sc === 8 || sc === 11 || sc === 12 || sc === 13)) for (let s = 0; s < 8; s += 1) { if (b % 2 && s > 3) continue; metal(t + s * (B / 2), 50 + ESC[MOT[s] % 8] - 62 + 12, (B / 2) * 0.8, 0.09); }
  // duduk en el aire, la gente y los descensos
  if (sc === 6 || sc === 8 || sc === 3 || sc === 5) { const nn = [69, 70, 69, 67][b % 4]; duduk(t, nn, BAR * 0.9, 0.08); duduk(t + BAR / 2, [65, 67, 65, 62][b % 4], BAR * 0.45, 0.06); }
}
// cueva: eco largo + reverberación
{ const dl = Math.round(0.52 * SR), e = new Float32Array(dl); let p = 0, lp = 0;
  for (let i = 0; i < N; i++) { const o = e[p]; lp += 0.28 * (o - lp); e[p] = mus[i] + 0.45 * lp; mus[i] += 0.3 * o; p = (p + 1) % dl; } }

/* ───────── 2 · SONIDOS POR ESCENA ───────── */
// 1 · gancho
{ whoosh(T(1, 0.2), 0.6, 0.1); cacareo(T(1, 0.9), 0.16); thud(T(1, 1.8), 70, 0.45); crunch(T(1, 1.8), 0.3, 0.08, 800); thud(T(1, 2.7), 70, 0.5); crunch(T(1, 2.7), 0.3, 0.08, 800);
  derrumbe(T(1, 3.2), 0.5); [0, 1, 2, 3, 4].forEach((k) => crunch(T(1, 3.4 + k * 0.12), 0.2, 0.05, 1400)); yelp(T(1, 3.9), 0.16); ding(T(1, 3.95), 1760, 0.1);
  whoosh(T(1, 4.6), 3.0, 0.2, 200, 3200); viento(T(1, 4.6), 3.0, 0.1); riser(ES[1], 0.6, 0.12); }
// 2 · roca
{ for (let k = 0; k < 16; k++) pico(T(2, 0.2 + k * 0.4 + R() * 0.12), 0.18 + R() * 0.1);
  derrumbe(T(2, 1.6), 0.18); { const n = ruidoHP(3500); add(fx, T(2, 3.0), 1.0, (t, g) => 0.07 * n(g) * ventana(t, 0, 1.0, 0.2)); } yelp(T(2, 2.6), 0.1); yelp(T(2, 5.4), 0.1); riser(ES[2], 0.6, 0.12); }
// 3 · pisos A
{ whoosh(T(3, 0.1), 1.0, 0.14, 200, 1800); chirrio(T(3, 0.4), 7, 0.06, 90);
  for (let k = 0; k < 6; k++) { ding(T(3, 0.9 + k * 1.15), 1320 + k * 40, 0.1); crunch(T(3, 0.9 + k * 1.15), 0.12, 0.03, 1200); }
  relincho(T(3, 1.8), 0.16); rebuzno(T(3, 3.4), 0.14); cacareo(T(3, 5.6), 0.12); murmullo(T(3, 3.8), 3.0, 0.04); riser(ES[3], 0.6, 0.12); }
// 4 · pisos B
{ whoosh(T(4, 0.1), 1.0, 0.14, 200, 1800); crepita(T(4, 0.6), 4.5, 0.2);
  { const n = ruidoLP(260); add(fx, T(4, 2.2), 3.0, (t, g) => 0.4 * n(g) * (0.6 + 0.4 * Math.sin(TAU * 3 * t)) * ventana(t, 0, 3.0, 0.4)); }
  for (let k = 0; k < 6; k++) { ding(T(4, 0.9 + k * 1.15), 1320 + k * 40, 0.1); clink(T(4, 1.0 + k * 1.15), 0.12, 2400 + R() * 800); }
  campana(T(4, 5.4), 880, 0.14); campana(T(4, 5.8), 880, 0.1); riser(ES[4], 0.6, 0.12); }
// 5 · pisos C
{ whoosh(T(5, 0.1), 1.0, 0.14, 200, 1800); campana(T(5, 0.6), 196, 0.26); campana(T(5, 1.5), 196, 0.2); coro(T(5, 1.2), 4.4, [62, 69, 74, 77], 0.07);
  aleteo(T(5, 2.4), 1.2, 0.1); aleteo(T(5, 4.6), 1.4, 0.1); for (let k = 0; k < 6; k++) ding(T(5, 4.4 + k * 0.55), 1100 + k * 30, 0.08);
  whoosh(T(5, 4.2), 3.0, 0.14, 200, 1600); timbal(T(5, 6.4), 48, 0.5); riser(ES[5], 0.6, 0.12); }
// 6 · aire
{ whoosh(T(6, 0.2), 1.0, 0.16, 300, 3000); viento(T(6, 0.8), 5.8, 0.28); respira(T(6, 1.0), 0.14); respira(T(6, 3.6), 0.14);
  zap(T(6, 3.2), 0.1); { const n = ruidoLP(500); add(fx, T(6, 4.8), 2.4, (t, g) => 0.16 * n(g) * (0.6 + 0.4 * Math.sin(TAU * 2.6 * t)) * ventana(t, 0, 2.4, 0.4)); }
  whoosh(T(6, 5.4), 3.0, 0.16, 200, 2200); [0, 3, 7, 10, 12].forEach((n, k) => duduk(T(6, 6.0 + k * 0.5), 62 + n + 12, 0.5, 0.06, fx)); ding(T(6, 7.8), 1760, 0.14); riser(ES[6], 0.6, 0.12); }
// 7 · puerta
{ pasos(T(7, 0.6), 8, 0.2, 0.2); retumbar(T(7, 2.2), 1.6, 0.5, 90); chirrio(T(7, 2.2), 1.5, 0.16, 70); thud(T(7, 3.5), 55, 0.7); crunch(T(7, 3.5), 0.4, 0.1, 700);
  { const n = ruidoLP(800); add(fx, T(7, 3.6), 1.2, (t, g) => 0.3 * n(g) * ex(t, 0.4)); } yelp(T(7, 3.8), 0.18); yelp(T(7, 4.0), 0.14); crunch(T(7, 4.8), 0.22, 0.12, 2200); clink(T(7, 4.9), 0.2, 1800);
  pasos(T(7, 5.6), 6, 0.14, 0.2); whoosh(T(7, 5.6), 1.2, 0.12); riser(ES[7], 0.6, 0.12); }
// 8 · gente
{ whoosh(T(8, 0.2), 0.8, 0.14); murmullo(T(8, 0.8), 6.2, 0.14);
  for (let k = 0; k < 18; k++) { add(fx, T(8, 0.9 + k * 0.29), 0.1, (t) => 0.1 * Math.sin(TAU * (500 + k * 40) * t) * ex(t, 0.03)); }
  for (let k = 0; k < 24; k++) caja(T(8, 3.4 + k * 0.1), 0.04 + k * 0.004); zap(T(8, 1.6), 0.1); ding(T(8, 6.4), 1760, 0.22); [0, 4, 7, 12].forEach((n, k) => ding(T(8, 6.45 + k * 0.1), 1500 + n * 60, 0.1)); riser(ES[8], 0.6, 0.12); }
// 9 · túnel
{ whoosh(T(9, 0.2), 0.8, 0.12); for (let k = 0; k < 10; k++) gota(T(9, 0.4 + k * 0.55 + R() * 0.2), 0.14, 1100 + R() * 500);
  pasos(T(9, 0.6), 22, 0.26, 0.1); aleteo(T(9, 1.6), 2.4, 0.12); { add(fx, T(9, 3.2), 0.6, (t) => 0.1 * (Math.sin(TAU * 700 * t) + Math.sin(TAU * 1400 * t) * 0.5) * ventana(t, 0, 0.6, 0.1)); }
  ding(T(9, 5.4), 1500, 0.12); [0, 4, 7].forEach((n, k) => duduk(T(9, 5.4 + k * 0.25), 74 + n, 0.7, 0.06, fx)); riser(ES[9], 0.6, 0.12); }
// 10 · invasores
{ galope(T(10, 0.2), 5, 0.22); thud(T(10, 1.4), 55, 0.3); thud(T(10, 2.0), 55, 0.3); thud(T(10, 3.4), 55, 0.25); thud(T(10, 4.2), 55, 0.25);
  for (let k = 0; k < 8; k++) { thud(T(10, 2.6 + k * 0.85), 52, 0.22); thud(T(10, 2.74 + k * 0.85), 48, 0.16); }
  { const n = ruidoHP(3000); add(fx, T(10, 4.6), 0.5, (t, g) => 0.1 * n(g) * (0.4 + 0.6 * Math.abs(Math.sin(TAU * 6 * t))) * ventana(t, 0, 0.5, 0.05)); }
  kazoo(T(10, 5.4), 0.16); galope(T(10, 6.6), 3, 0.2); whoosh(T(10, 6.6), 1.2, 0.14); riser(ES[10], 0.5, 0.12); }
// 11 · hoy
{ whoosh(T(11, 0.2), 0.8, 0.12); murmullo(T(11, 0.4), 5.4, 0.1); zap(T(11, 1.0), 0.1);
  for (let k = 0; k < 12; k++) clink(T(11, 0.6 + k * 0.45), 0.06, 2000 + R() * 900); obturador(T(11, 3.0), 0.28); zap(T(11, 3.0), 0.14);
  thud(T(11, 5.2), 60, 0.3); clink(T(11, 5.25), 0.22, 1500); aleteo(T(11, 5.6), 1.2, 0.1); coro(T(11, 4.0), 3.0, [62, 65, 69], 0.04); riser(ES[11], 0.5, 0.12); }
// 12 · cierre
{ whoosh(T(12, 0.2), 3.0, 0.3, 200, 4500); viento(T(12, 0.2), 3.0, 0.14); murmullo(T(12, 3.4), 1.6, 0.05);
  for (let k = 0; k < 5; k++) crunch(T(12, 4.6 + k * 0.15), 0.1, 0.02, 2200); ding(T(12, 5.2), 2200, 0.12);
  thud(T(12, 5.8), 55, 0.8); crunch(T(12, 5.8), 0.5, 0.1, 700); derrumbe(T(12, 5.85), 0.3); coro(T(12, 5.9), 2.0, [62, 66, 69, 74], 0.1); ding(T(12, 6.0), 1568, 0.22); zap(T(12, 5.9), 0.12); }
// 13 · CTA
{ const t0 = ES[12];
  fanfarria(t0 + 0.1, [62, 69, 74, 77, 81], 0.14); timbal(t0 + 0.1, 55, 0.5); timbal(t0 + 0.6, 62, 0.4); ding(t0 + 0.9, 1568, 0.2); for (let k = 0; k < 8; k++) caja(t0 + 0.3 + k * 0.1, 0.05 + k * 0.01); }

/* ───────── 3 · mezcla ───────── */
const x = buf();
for (let i = 0; i < N; i++) x[i] = mus[i] * 0.9 + fx[i];
{ const y = buf(); for (const ms of [37.3, 53.9, 79.1, 113.7]) { const d = Math.round((ms * SR) / 1000), lin = new Float32Array(d); let q = 0, lp = 0; for (let i = 0; i < N; i++) { const o = lin[q]; lp += 0.4 * (o - lp); lin[q] = fx[i] + 0.35 * lp; y[i] += 0.1 * o; q = (q + 1) % d; } } for (let i = 0; i < N; i++) x[i] += y[i]; }
let pic = 0; for (let i = 0; i < N; i++) { if (!Number.isFinite(x[i])) x[i] = 0; pic = Math.max(pic, Math.abs(x[i])); }
const gl = 0.9 / Math.max(1e-4, pic);
for (let i = 0; i < N; i++) x[i] = Math.tanh(x[i] * gl * 1.15) * 0.9;
const fi = Math.round(0.04 * SR), fo = Math.round(1.2 * SR);
for (let i = 0; i < fi; i++) x[i] *= i / fi; for (let i = 0; i < fo; i++) x[N - 1 - i] *= i / fo;
mkdirSync(join(RAIZ, "assets", "musica"), { recursive: true });
const salida = join(RAIZ, "assets", "musica", "derinkuyu.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION.toFixed(1)} s · ${BPM} bpm · pico ${pic.toFixed(2)}`);
console.log("   escenas (inicio):", ES.map((a, i) => `${i + 1}:${a.toFixed(1)}s`).join("  "));
