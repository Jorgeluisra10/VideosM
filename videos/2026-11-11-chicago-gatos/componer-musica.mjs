#!/usr/bin/env node
/**
 * Música de marcha-ragtime steampunk + diseño sonoro cómico propio (síntesis, sin muestras ni licencias) para «La ciudad que subió con gatos» (89,9 s).
 * Cama: oom-pah a 112 bpm (tuba, banjo, calíope, caja y bloque de madera); sombría en el cólera, de timbal y fuego en el incendio, fanfarria en el cierre.
 * Encima, sonidos DISTINTOS por escena, alineados con lo que se ve:
 *   1 · gancho     clic de engranaje · golpe de cada gato (clank) · crujido de madera · campanita de la taza · «¿más té?»
 *   2 · pantano    glub de burbujas · pasos en el barro · slurp con silbato de émbolo · bocina de vapor lejana
 *   3 · cólera     campana de duelo · órgano sombrío · tics de contador (geiger) · gotera sucia
 *   4 · plan       lápiz sobre el plano · tink de la regla · glub atascado · trombón triste (wah-wah)
 *   5 · idea       bombilla (ding) · paladas de tierra · fanfarria de trompeta al «¡que suba!» · pop de corcho
 *   6 · gato       matraca de la manivela · engranajes · tic-tac mecánico · rechinar del tornillo
 *   7 · ejército   caja redoblante · cuatro silbatos de vapor · «¡hup!» de los obreros · clank de cada subida
 *   8 · té         vertido del té · tintineo de tazas · campanilla de la puerta · boing + «¡plof!» + trombón triste
 *   9 · calle      pasos en escalones · escalera que rechina · «¡ay!» (boing) y tropiezo · silbato de émbolo
 *  10 · nivel      agua que corre por el tubo · placa de bronce (ding) · aplausos y vivas · banderines
 *  11 · incendio   crepitar · rugido de llamas · timbal · sirena · «dun dun duuun» en «continuará»
 *  12 · cierre     fanfarria con trompeta, glissando de piano y «ta-da»
 * Uso:  node videos/2026-11-11-chicago-gatos/componer-musica.mjs   → assets/musica/chicago-gatos.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/chicago-gatos.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dur = [6.6, 7.5, 8.0, 7.4, 7.2, 7.8, 8.6, 8.0, 7.8, 7.4, 8.1, 5.0];
export const DURACION = dur.reduce((a, b) => a + b, 0) + 0.5;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(185711);
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
const BPM = 112, B = 60 / BPM, BAR = 4 * B;
const escena = (t) => ES.findIndex((e, i) => t >= e && (i === ES.length - 1 || t < ES[i + 1])) + 1;
const ventana = (g, a, b, r = 0.3) => sua(g, a, a + r) * (1 - sua(g, b - r, b));

/* ───────── instrumentos ───────── */
const ruidoLP = (cor) => { let y = 0; return (g) => { const f = Math.max(20, typeof cor === "function" ? cor(g) : cor); y += (1 - Math.exp((-TAU * f) / SR)) * ((R() * 2 - 1) - y); return y; }; };
const ruidoHP = (cor) => { let y = 0; return (g) => { const f = Math.max(20, typeof cor === "function" ? cor(g) : cor); const w = R() * 2 - 1; y += (1 - Math.exp((-TAU * f) / SR)) * (w - y); return w - y; }; };
/** banjo: pulsación brillante que cae rápido */
function banjo(b, t0, n, g = 0.16) { const f = mid(n); add(b, t0, 0.6, (t) => g * Math.min(1, t / 0.001) * (Math.sin(TAU * f * t) * ex(t, 0.16) + 0.6 * Math.sin(TAU * f * 2.01 * t) * ex(t, 0.09) + 0.35 * Math.sin(TAU * f * 3.02 * t) * ex(t, 0.05) + 0.2 * Math.sin(TAU * f * 4.99 * t) * ex(t, 0.03))); }
function acorde(b, t0, notas, g = 0.13) { notas.forEach((n, k) => banjo(b, t0 + k * 0.012, n, g)); }
/** tuba: bajo redondo con armónicos */
function tuba(b, t0, n, d = 0.4, g = 0.3) { const f = mid(n); add(b, t0, d + 0.1, (t) => { const e = sua(t, 0, 0.02) * (1 - sua(t, d - 0.08, d + 0.08)); let s = 0; for (let h = 1; h <= 7; h++) s += Math.sin(TAU * f * h * t) / Math.pow(h, 1.4); return g * e * s * (0.7 + 0.3 * ex(t, 0.12)); }); }
/** calíope / flauta de feria: cuasi cuadrada con vibrato */
function calio(b, t0, n, d = 0.2, g = 0.1) { const f = mid(n); add(b, t0, d + 0.06, (t) => { const e = sua(t, 0, 0.012) * (1 - sua(t, d - 0.04, d + 0.05)); const v = 1 + 0.004 * Math.sin(TAU * 5.5 * t); let s = 0; for (const h of [1, 3, 5, 7]) s += Math.sin(TAU * f * v * h * t) / h; return g * e * s; }); }
function trompeta(b, t0, n, d = 0.3, g = 0.14) { const f = mid(n); add(b, t0, d + 0.08, (t) => { const e = sua(t, 0, 0.03) * (1 - sua(t, d - 0.05, d + 0.08)); let s = 0; for (let h = 1; h <= 9; h++) s += (Math.sin(TAU * f * h * t) / h) * (0.5 + 0.5 * sua(t, 0, 0.06)); return g * e * s; }); }
function organo(b, t0, d, notas, g = 0.1) { add(b, t0, d, (t) => { const e = sua(t, 0, 0.5) * (1 - sua(t, d - 0.6, d)); let s = 0; for (const n of notas) { const f = mid(n); s += Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 2 * t) + 0.25 * Math.sin(TAU * f * 3.01 * t); } return g * e * s * (0.85 + 0.15 * Math.sin(TAU * 5 * t)); }); }
const kick = (t0, g = 0.5) => add(fx, t0, 0.3, (t) => g * Math.sin(TAU * (50 + 110 * ex(t, 0.03)) * t) * ex(t, 0.1));
const caja = (t0, g = 0.2, d = 0.12) => { const n = ruidoHP(1200); add(fx, t0, d + 0.05, (t, gg) => g * (n(gg) * ex(t, d * 0.4) + 0.4 * Math.sin(TAU * 190 * t) * ex(t, 0.05))); };
const bloque = (t0, g = 0.15, f = 1700) => add(fx, t0, 0.08, (t) => g * Math.sin(TAU * f * t) * ex(t, 0.012) * Math.min(1, t / 0.0008));
const crunch = (t0, g = 0.3, d = 0.05, hp = 1500) => { let y = 0; add(fx, t0, d + 0.02, (t) => { const w = R() * 2 - 1; y += (1 - Math.exp((-TAU * hp) / SR)) * (w - y); return g * (w - y) * ex(t, d * 0.45); }); };
const thud = (t0, f = 70, g = 0.5) => add(fx, t0, 0.5, (t) => g * Math.sin(TAU * (f + 40 * ex(t, 0.04)) * t) * ex(t, 0.14) + g * 0.25 * (R() * 2 - 1) * ex(t, 0.01));
const ding = (t0, f = 1568, g = 0.2) => add(fx, t0, 1.6, (t) => g * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2.76 * t) * ex(t, 0.2)) * ex(t, 0.5) * Math.min(1, t / 0.002));
const campana = (t0, f = 220, g = 0.25) => add(fx, t0, 3.2, (t) => g * Math.min(1, t / 0.003) * ex(t, 1.1) * (Math.sin(TAU * f * t) + 0.6 * Math.sin(TAU * f * 2.0 * t) * ex(t, 0.8) + 0.5 * Math.sin(TAU * f * 2.76 * t) * ex(t, 0.5) + 0.35 * Math.sin(TAU * f * 5.4 * t) * ex(t, 0.3)));
const clank = (t0, g = 0.3) => { const n = ruidoHP(2000); add(fx, t0, 0.5, (t, gg) => g * (Math.sin(TAU * 340 * t) * ex(t, 0.1) + 0.7 * Math.sin(TAU * 563 * t) * ex(t, 0.07) + 0.5 * Math.sin(TAU * 1210 * t) * ex(t, 0.05) + 0.4 * n(gg) * ex(t, 0.01))); };
const clink = (t0, g = 0.14, f = 3200) => add(fx, t0, 0.4, (t) => g * (Math.sin(TAU * f * t) * ex(t, 0.07) + 0.6 * Math.sin(TAU * f * 1.51 * t) * ex(t, 0.05)) * Math.min(1, t / 0.001));
function silbato(t0, d = 0.7, g = 0.2, f = 2200) { const n = ruidoHP(3000); add(fx, t0, d + 0.1, (t, gg) => { const e = sua(t, 0, 0.04) * (1 - sua(t, d - 0.15, d + 0.1)); return g * e * (Math.sin(TAU * f * (1 + 0.01 * Math.sin(TAU * 18 * t)) * t) + 0.5 * Math.sin(TAU * f * 1.5 * t) + 0.25 * n(gg)); }); }
function silbatoEmbolo(t0, f0, f1, d = 0.6, g = 0.18) { let ph = 0; add(fx, t0, d + 0.05, (t) => { const k = clamp(t / d); ph += (TAU * (lerp(f0, f1, k) + 30 * Math.sin(TAU * 7 * t))) / SR; return g * Math.sin(ph) * sua(t, 0, 0.03) * (1 - sua(t, d - 0.05, d)); }); }
function boing(t0, g = 0.2, f = 260) { let ph = 0; add(fx, t0, 0.7, (t) => { ph += (TAU * f * (1 + 0.6 * Math.sin(TAU * 11 * t) * ex(t, 0.25))) / SR; return g * Math.sin(ph) * ex(t, 0.22) * Math.min(1, t / 0.003); }); }
function trombonTriste(t0, g = 0.2) {
  const notas = [[57, 0.4], [56, 0.4], [55, 0.4], [54, 1.2]];
  let tt = t0;
  notas.forEach(([n, d], k) => { const f = mid(n); add(fx, tt, d + 0.1, (t) => { const e = sua(t, 0, 0.03) * (1 - sua(t, d - 0.1, d + 0.08)); const vib = k === 3 ? 1 + 0.02 * Math.sin(TAU * 6 * t) : 1; const wah = k === 3 ? 0.55 + 0.45 * Math.sin(TAU * 4 * t) : 0.8; let s = 0; for (let h = 1; h <= 8; h++) s += (Math.sin(TAU * f * vib * h * t) / h) * (h < 4 ? 1 : wah); return g * e * s; }); tt += d; });
}
function glub(t0, g = 0.18, f = 520) { add(fx, t0, 0.2, (t) => g * Math.sin(TAU * (f + 380 * t / 0.12) * t) * ex(t, 0.05) * Math.min(1, t / 0.003)); }
function slurp(t0, g = 0.3) { const n = ruidoLP((gg) => 1200 - 800 * clamp((gg - t0) / 0.5)); add(fx, t0, 0.55, (t, gg) => g * n(gg) * (0.5 + 0.5 * Math.sin(TAU * 26 * t)) * ventana(t, 0, 0.55, 0.06) + 0.15 * Math.sin(TAU * (500 - 380 * clamp(t / 0.5)) * t) * ex(t, 0.4)); }
function matraca(t0, d, ritmo = 0.07, g = 0.25) { for (let k = 0; k * ritmo < d; k++) { crunch(t0 + k * ritmo, g, 0.012, 2600); bloque(t0 + k * ritmo + 0.001, g * 0.5, 1300); } }
function pasos(t0, k, paso = 0.22, g = 0.22) { for (let i = 0; i < k; i++) { const tt = t0 + i * paso; thud(tt, 110 + (i % 2) * 20, g * 0.6); crunch(tt, g * 0.7, 0.03, 900); } }
function hup(t0, g = 0.2) { const n = ruidoLP(900); add(fx, t0, 0.22, (t, gg) => g * (Math.sin(TAU * (130 - 40 * clamp(t / 0.2)) * t) * 0.8 + 0.5 * n(gg)) * ventana(t, 0, 0.2, 0.03)); }
function crepita(t0, d, g = 0.2) { const n = ruidoHP(3000); add(fx, t0, d, (t, gg) => g * n(gg) * (R() > 0.86 ? 1 : 0.06) * ventana(t, 0, d, 0.3)); }
function aplausos(t0, d, g = 0.12) { const n = ruidoHP(1800); add(fx, t0, d, (t, gg) => g * n(gg) * (R() > 0.55 ? 1 : 0.2) * ventana(t, 0, d, 0.3)); }
function murmullo(t0, d, g = 0.1) { const n = ruidoLP(1100); add(fx, t0, d, (t, gg) => g * n(gg) * (0.6 + 0.4 * Math.sin(TAU * 3.1 * t + Math.sin(t * 7))) * ventana(t, 0, d, 0.4)); }
function agua(t0, d, g = 0.1) { const n = ruidoHP((gg) => 2200 + 1200 * Math.sin(gg * 6)); add(fx, t0, d, (t, gg) => g * n(gg) * ventana(t, 0, d, 0.3)); }
function crujido(t0, d, g = 0.15) { let ph = 0; add(fx, t0, d, (t) => { ph += (TAU * (95 + 40 * Math.sin(TAU * 1.3 * t))) / SR; return g * (Math.sin(ph) + 0.5 * Math.sin(2.3 * ph)) * (0.3 + 0.7 * Math.abs(Math.sin(TAU * 13 * t))) * ventana(t, 0, d, 0.1); }); }
function timbal(t0, f = 75, g = 0.5) { add(fx, t0, 0.8, (t) => g * Math.sin(TAU * (f + 40 * ex(t, 0.05)) * t) * ex(t, 0.28)); }
function riser(tf, d = 1.2, g = 0.18) { const n = ruidoHP((gg) => 500 + 6000 * Math.pow(clamp((gg - (tf - d)) / d), 2)); add(fx, tf - d, d, (t, gg) => g * n(gg) * Math.pow(t / d, 2)); }

/* ───────── 1 · CAMA ───────── */
const MAYOR = [[36, [60, 64, 67]], [41, [60, 65, 69]], [43, [59, 62, 67]], [36, [60, 64, 67]]];
const MENOR = [[33, [57, 60, 64]], [38, [57, 62, 65]], [40, [56, 59, 64]], [33, [57, 60, 64]]];
const MOTIVO = [[0, 4, 7, 4, 0, 4, 7, 12], [7, 5, 4, 2, 0, 2, 4, 7], [0, 0, 7, 7, 9, 9, 7, 7], [4, 7, 12, 11, 9, 7, 4, 0]];
for (let b = 0, t = 0; t < DURACION - 0.6; b++, t += BAR) {
  const sc = escena(t);
  const menor = sc === 3 || sc === 11;
  const [raiz, ac] = (menor ? MENOR : MAYOR)[b % 4];
  const base = ac[0];
  // fondo sombrío (cólera): órgano largo y campana
  if (sc === 3) { organo(mus, t, BAR + 0.2, [raiz + 12, raiz + 19, raiz + 24], 0.08); continue; }
  const lleno = sc === 7 || sc === 10 || sc === 12;
  const suave = sc === 4 || sc === 8;
  for (let q = 0; q < 4; q++) {
    const tq = t + q * B;
    if (q % 2 === 0) tuba(mus, tq, raiz + (q === 2 && b % 2 ? 7 : 0), B * 0.7, menor ? 0.24 : 0.3);
    else if (!suave || q === 1) acorde(mus, tq, ac, 0.12);
    if (lleno || sc === 11) { kick(tq, 0.4); if (q % 2) caja(tq, 0.16); }
    if (sc === 11) timbal(tq + B / 2, 60, 0.35);
    bloque(tq + B / 2, suave ? 0.06 : 0.1, 1500 + (q % 2) * 250);
  }
  // melodía de calíope (más escasa en las escenas tranquilas)
  if (sc !== 1 || t > 0.5) {
    const mo = MOTIVO[(b + sc) % 4];
    for (let s = 0; s < 8; s++) {
      if (suave && s % 2) continue;
      if (sc === 11 && s % 2) continue;
      calio(mus, t + s * (B / 2), (menor ? 69 : base + 12) + mo[s] + (menor && mo[s] === 4 ? -1 : 0), (B / 2) * 0.85, suave ? 0.07 : 0.1);
    }
  }
}
// eco y reverb ligeros
{ const dl = Math.round(0.36 * SR), e = new Float32Array(dl); let p = 0, lp = 0;
  for (let i = 0; i < N; i++) { const o = e[p]; lp += 0.35 * (o - lp); e[p] = mus[i] + 0.35 * lp; mus[i] += 0.22 * o; p = (p + 1) % dl; } }

/* ───────── 2 · SONIDOS POR ESCENA ───────── */
// 1 · gancho: engranaje, cada gato (clank), madera, taza
{ matraca(T(1, 0.3), 0.5, 0.06, 0.18); riser(T(1, 1.0), 0.7, 0.14);
  for (let k = 0; k < 5; k++) { clank(T(1, 1.0 + k * 0.55), 0.28); thud(T(1, 1.0 + k * 0.55), 80, 0.3); crujido(T(1, 1.05 + k * 0.55), 0.35, 0.09); }
  clink(T(1, 2.4), 0.16); clink(T(1, 2.5), 0.12, 3900); pop(T(1, 4.4)); ding(T(1, 4.5), 1760, 0.12); }
function pop(t0, g = 0.25) { let ph = 0; add(fx, t0, 0.1, (t) => { ph += (TAU * (900 - 700 * clamp(t / 0.06))) / SR; return g * Math.sin(ph) * ex(t, 0.025); }); }
// 2 · pantano: burbujas, pasos y slurp
{ for (let k = 0; k < 9; k++) glub(T(2, 0.4 + k * 0.25), 0.12, 380 + R() * 300);
  pasos(T(2, 1.5), 4, 0.24, 0.2); murmullo(T(2, 0.2), 2.2, 0.04);
  silbatoEmbolo(T(2, 2.1), 600, 250, 0.9, 0.1); slurp(T(2, 3.3), 0.4); pop(T(2, 3.8), 0.3); boing(T(2, 3.85), 0.12, 340);
  silbato(T(2, 4.9), 0.9, 0.06, 900); riser(ES[2], 0.7, 0.14); }
// 3 · cólera: campana, tics de contador, gotera
{ [0.3, 2.3, 4.3, 6.3].forEach((tt, k) => campana(T(3, tt), 131 + (k % 2) * 4, 0.28));
  add(fx, T(3, 1.0), 3.5, (t) => 0.08 * Math.sin(TAU * (60 + 6 * Math.sin(TAU * 0.4 * t)) * t) * ventana(t, 0, 3.5, 0.5));
  { const n = ruidoHP(4000); add(fx, T(3, 3.2), 2.8, (t, g) => 0.14 * n(g) * (R() > 0.93 ? 1 : 0) * ventana(t, 0, 2.8, 0.1)); }
  for (let k = 0; k < 18; k++) { const tk = T(3, 3.2 + k * 0.15); bloque(tk, 0.1, 1100 + k * 40); }
  for (let k = 0; k < 6; k++) glub(T(3, 2.3 + k * 0.45), 0.1, 300 + R() * 160);
  timbal(T(3, 5.9), 55, 0.5); pop(T(3, 5.8), 0.18); riser(ES[3], 0.8, 0.12); }
// 4 · plan: lápiz, tink, glub, trombón
{ add(fx, T(4, 0.4), 1.2, (t, g) => 0.07 * (R() * 2 - 1) * (0.5 + 0.5 * Math.sin(TAU * 25 * t)) * ventana(t, 0, 1.2, 0.1));
  clink(T(4, 1.6), 0.2, 2400); clink(T(4, 1.75), 0.14, 3000); bloque(T(4, 1.8), 0.15, 2200);
  silbatoEmbolo(T(4, 3.6), 900, 300, 0.5, 0.12); thud(T(4, 3.6), 90, 0.3);
  for (let k = 0; k < 4; k++) glub(T(4, 4.6 + k * 0.2), 0.14, 340 + k * 40);
  trombonTriste(T(4, 5.3), 0.17); riser(ES[4], 0.7, 0.12); }
// 5 · idea: bombilla, paladas, fanfarria, corcho
{ ding(T(5, 0.3), 2093, 0.2); [0, 4, 7].forEach((n, k) => calio(fx, T(5, 0.32 + k * 0.08), 84 + n, 0.25, 0.08));
  for (let k = 0; k < 6; k++) { thud(T(5, 1.5 + k * 0.25), 65, 0.22); crunch(T(5, 1.5 + k * 0.25), 0.2, 0.08, 700); }
  silbatoEmbolo(T(5, 2.3), 250, 1400, 1.4, 0.12);
  boing(T(5, 4.0), 0.12, 300); thud(T(5, 4.0), 100, 0.25);
  [60, 64, 67, 72].forEach((n, k) => trompeta(fx, T(5, 4.75 + k * 0.1), n + 12, 0.45, 0.15)); pop(T(5, 5.4), 0.25); riser(ES[5], 0.7, 0.14); }
// 6 · gato: matraca, engranajes, tic-tac, rechinar
{ thud(T(6, 0.2), 70, 0.35); matraca(T(6, 0.8), 3.4, 0.09, 0.22);
  for (let k = 0; k < 14; k++) bloque(T(6, 0.9 + k * 0.25), 0.1, k % 2 ? 1300 : 1000);
  crujido(T(6, 0.8), 3.4, 0.07); riser(T(6, 2.6), 0.5, 0.12); silbatoEmbolo(T(6, 2.6), 400, 1000, 0.5, 0.1);
  clank(T(6, 3.8), 0.28); ding(T(6, 5.4), 1568, 0.14); ding(T(6, 6.2), 1976, 0.14); riser(ES[6], 0.6, 0.12); }
// 7 · ejército: caja, silbatos, hup, clank
{ for (let k = 0; k < 10; k++) caja(T(7, 0.6 + k * 0.12), 0.05 + 0.014 * k, 0.07);
  murmullo(T(7, 1.4), 2.0, 0.07);
  for (let k = 0; k < 4; k++) { const tk = T(7, 2.6 + k * 1.15); silbato(tk, 0.5, 0.22); hup(tk + 0.45, 0.2); hup(tk + 0.53, 0.16); clank(tk + 0.5, 0.26); thud(tk + 0.5, 80, 0.35); crujido(tk + 0.5, 0.4, 0.09); }
  ding(T(7, 6.8), 1760, 0.14); riser(ES[7], 0.8, 0.14); }
// 8 · té: vertido, tintineo, campanilla de puerta, boing, plof
{ agua(T(8, 0.6), 1.2, 0.07);
  for (let k = 0; k < 5; k++) clink(T(8, 1.9 + k * 0.4), 0.12, 2800 + R() * 900);
  clink(T(8, 2.3), 0.16); murmullo(T(8, 2.4), 3.0, 0.04);
  for (let k = 0; k < 5; k++) { thud(T(8, 1.2 + k * 0.75), 80, 0.28); crujido(T(8, 1.25 + k * 0.75), 0.4, 0.08); }
  ding(T(8, 5.4), 2637, 0.2); ding(T(8, 5.5), 3322, 0.14); boing(T(8, 5.9), 0.18, 280); silbatoEmbolo(T(8, 5.95), 1200, 250, 0.4, 0.1);
  thud(T(8, 6.3), 60, 0.65); crunch(T(8, 6.3), 0.3, 0.08, 800); trombonTriste(T(8, 6.6), 0.1); riser(ES[8], 0.5, 0.1); }
// 9 · calle: pasos, escalera, ay, tropiezo
{ pasos(T(9, 0.8), 8, 0.24, 0.16);
  for (let k = 0; k < 5; k++) crujido(T(9, 1.0 + k * 0.5), 0.35, 0.08);
  bloque(T(9, 2.0), 0.2, 900); bloque(T(9, 2.1), 0.2, 1100);
  boing(T(9, 3.6), 0.22, 320); silbatoEmbolo(T(9, 3.65), 1400, 200, 0.7, 0.14);
  thud(T(9, 4.25), 60, 0.6); crunch(T(9, 4.25), 0.3, 0.08, 800); [0.0, 0.12, 0.25].forEach((o) => clink(T(9, 4.3 + o), 0.1, 1800)); // sombrero y paquete
  ding(T(9, 5.2), 1568, 0.12); riser(ES[9], 0.6, 0.12); }
// 10 · nivel: agua, placa, aplausos, vivas
{ thud(T(10, 0.2), 80, 0.3); agua(T(10, 1.0), 4.0, 0.1);
  zap(T(10, 3.4)); ding(T(10, 3.5), 1976, 0.2); [60, 64, 67].forEach((n, k) => trompeta(fx, T(10, 3.5 + k * 0.1), n + 12, 0.5, 0.12));
  aplausos(T(10, 4.3), 2.6, 0.12); murmullo(T(10, 4.4), 2.5, 0.08);
  for (let k = 0; k < 3; k++) hup(T(10, 4.4 + k * 0.45), 0.12); ding(T(10, 5.0), 1760, 0.14); riser(ES[10], 0.5, 0.12); }
// 11 · incendio: crepitar, llamas, timbal, sirena, dun dun duuun
{ crepita(T(11, 2.4), 5.4, 0.2);
  { const n = ruidoLP((g) => 350 + 700 * Math.sin(g * 5)); add(fx, T(11, 2.6), 4.6, (t, g) => 0.5 * n(g) * ventana(t, 0, 4.6, 0.8)); }
  [0.0, 0.5, 1.0, 1.5].forEach((o) => timbal(T(11, 1.2 + o), 62, 0.4));
  { let ph = 0; add(fx, T(11, 3.0), 2.4, (t) => { ph += (TAU * (500 + 220 * Math.sin(TAU * 0.5 * t))) / SR; return 0.07 * Math.sin(ph) * ventana(t, 0, 2.4, 0.4); }); }
  [0.0, 0.5, 1.1].forEach((o, k) => { organo(fx, T(11, 5.4 + o), k === 2 ? 1.8 : 0.5, [k === 2 ? 45 : 50 - k * 2, k === 2 ? 52 : 57 - k * 2], 0.18); timbal(T(11, 5.4 + o), 50, 0.5); });
  ding(T(11, 6.0), 1245, 0.1); riser(ES[11], 0.6, 0.12); }
function zap(t0, g = 0.2) { let ph = 0; add(fx, t0, 0.35, (t) => { ph += (TAU * lerp(300, 2800, clamp(t / 0.3) ** 2)) / SR; return g * (Math.sin(ph) + 0.4 * Math.sin(2 * ph)) * ex(t, 0.2) * Math.min(1, t / 0.003); }); }
// 12 · cierre: fanfarria, glissando, ta-da
{ const t0 = ES[11];
  [60, 64, 67, 72, 76, 79].forEach((n, k) => trompeta(fx, t0 + 0.1 + k * 0.09, n + 12, 0.5, 0.15));
  for (let k = 0; k < 14; k++) calio(fx, t0 + 0.2 + k * 0.05, 72 + k, 0.12, 0.06);
  ding(t0 + 0.9, 1568, 0.2); ding(t0 + 0.95, 2093, 0.16); silbato(t0 + 1.5, 0.35, 0.12, 2600); bloque(t0 + 2.4, 0.2, 1400);
  [0, 4, 7, 12].forEach((n, k) => calio(fx, t0 + 3.2 + k * 0.1, 84 + n, 0.6, 0.08)); }

/* ───────── 3 · mezcla ───────── */
const x = buf();
for (let i = 0; i < N; i++) x[i] = mus[i] * 0.9 + fx[i];
{ const y = buf(); for (const ms of [29.1, 43.7, 61.9]) { const d = Math.round((ms * SR) / 1000), lin = new Float32Array(d); let q = 0, lp = 0; for (let i = 0; i < N; i++) { const o = lin[q]; lp += 0.4 * (o - lp); lin[q] = fx[i] + 0.3 * lp; y[i] += 0.08 * o; q = (q + 1) % d; } } for (let i = 0; i < N; i++) x[i] += y[i]; }
let pico = 0; for (let i = 0; i < N; i++) { if (!Number.isFinite(x[i])) x[i] = 0; pico = Math.max(pico, Math.abs(x[i])); }
const gl = 0.9 / Math.max(1e-4, pico);
for (let i = 0; i < N; i++) x[i] = Math.tanh(x[i] * gl * 1.15) * 0.9;
const fi = Math.round(0.04 * SR), fo = Math.round(1.2 * SR);
for (let i = 0; i < fi; i++) x[i] *= i / fi; for (let i = 0; i < fo; i++) x[N - 1 - i] *= i / fo;
mkdirSync(join(RAIZ, "assets", "musica"), { recursive: true });
const salida = join(RAIZ, "assets", "musica", "chicago-gatos.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION.toFixed(1)} s · ${BPM} bpm · pico ${pico.toFixed(2)}`);
console.log("   escenas (inicio):", ES.map((a, i) => `${i + 1}:${a.toFixed(1)}s`).join("  "));
