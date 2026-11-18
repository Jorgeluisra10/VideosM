#!/usr/bin/env node
/**
 * Música épica cinematográfica espacial + diseño sonoro cómico propio (síntesis, sin muestras ni licencias) para «El ascensor espacial» (≈ 117 s).
 * Cama: re menor a 84 bpm (dron grave, cuerdas que crecen, coro, arpegio sintético tipo órgano, timbales, cornos en los momentos grandes),
 * música de ascensor (vibráfono y bajo bossa) en el viaje y resolución en re mayor con fanfarria al cierre.
 * Encima, sonidos DISTINTOS por escena, alineados con lo que se ve:
 *   1 · gancho      rugido del cohete · chisporroteo · «pfff» al quedarse sin combustible · silbato de émbolo al caer · «ding» de ascensor
 *   2 · nanotubo    campanas de cristal de los átomos · zumbido eléctrico · barridos de zoom · tics de la regla
 *   3 · cinta       aleteo de la cinta · crujido de papel · ping de la ampliación
 *   4 · plataforma  olas · bocina de barco · graznido de gaviota · motor y clank de la grúa
 *   5 · trepador    zumbido del láser (zap) · motor de rodillos · chirrido de los rodillos · «ding» de carga
 *   6 · clima       trueno · lluvia · viento · rayo (crac)
 *   7 · Van Allen   contador geiger · destellos de aurora · barrido de radiación · pad misterioso
 *   8 · física      latido grave de la gravedad · remolino de la fuerza centrífuga · «ding» del empate · giro de honda
 *   9 · contrapeso  honda que gira (whoosh periódico) · golpe del asteroide · tensión que sube
 *  10 · viaje       música de ascensor · barajar cartas · pasos del calendario · «¿ya llegamos?» · acople de la estación (clunk)
 *  11 · acero       quejido del metal · «pling» y latigazo del cable · ding de la cinta
 *  12 · laboratorio clic de pinza · tics de regla · «crac» de la grieta · barrido hasta el cielo
 *  13 · cierre      barrido de bajada · golpe de obra · tres «ding» de verificación · sello (thump) y fanfarria
 *  14 · CTA         fanfarria de cornos
 * Uso:  node videos/2026-11-18-ascensor-espacial/componer-musica.mjs   → assets/musica/ascensor-espacial.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/ascensor-espacial.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dur = [8, 9, 9, 9, 9, 8, 8, 9, 9, 8, 8, 9, 9, 5];
export const DURACION = dur.reduce((a, b) => a + b, 0) + 0.5;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(181118);
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
const BPM = 84, B = 60 / BPM, BAR = 4 * B;
const escena = (t) => ES.findIndex((e, i) => t >= e && (i === ES.length - 1 || t < ES[i + 1])) + 1;
const ventana = (g, a, b, r = 0.3) => sua(g, a, a + r) * (1 - sua(g, b - r, b));

/* ───────── instrumentos ───────── */
const ruidoLP = (cor) => { let y = 0; return (g) => { const f = Math.max(20, typeof cor === "function" ? cor(g) : cor); y += (1 - Math.exp((-TAU * f) / SR)) * ((R() * 2 - 1) - y); return y; }; };
const ruidoHP = (cor) => { let y = 0; return (g) => { const f = Math.max(20, typeof cor === "function" ? cor(g) : cor); const w = R() * 2 - 1; y += (1 - Math.exp((-TAU * f) / SR)) * (w - y); return w - y; }; };
function dron(t0, d, n, g = 0.2) { const f = mid(n); add(mus, t0, d + 0.5, (t) => { const e = sua(t, 0, 1.0) * (1 - sua(t, d - 0.5, d + 0.5)); return g * e * (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 2.002 * t) + 0.25 * Math.sin(TAU * f * 3.01 * t)) * (0.85 + 0.15 * Math.sin(TAU * 0.3 * t)); }); }
function cuerdas(t0, d, notas, g = 0.05) { add(mus, t0, d + 0.4, (t) => { const e = sua(t, 0, 0.9) * (1 - sua(t, d - 0.3, d + 0.4)); let s = 0; for (const n of notas) { const f = mid(n); for (const de of [-0.004, 0.004]) for (let h = 1; h <= 5; h++) s += Math.sin(TAU * f * (1 + de) * h * t) / (h * 1.2); } return g * e * s * (0.75 + 0.25 * Math.sin(TAU * 5.5 * t)); }); }
function coro(t0, d, notas, g = 0.05, b = mus) { add(b, t0, d, (t) => { const e = sua(t, 0, 1.0) * (1 - sua(t, d - 0.9, d)); let s = 0; for (const n of notas) { const f = mid(n) * (1 + 0.003 * Math.sin(TAU * 5 * t)); s += Math.sin(TAU * f * t) + 0.55 * Math.sin(TAU * f * 2 * t) + 0.35 * Math.sin(TAU * f * 3 * t) + 0.2 * Math.sin(TAU * f * 5 * t); } return g * e * s; }); }
function organo(t0, n, d, g = 0.07) { const f = mid(n); add(mus, t0, d + 0.05, (t) => { const e = sua(t, 0, 0.01) * (1 - sua(t, d - 0.04, d + 0.05)); return g * e * (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 2 * t) + 0.3 * Math.sin(TAU * f * 3 * t) + 0.15 * Math.sin(TAU * f * 4 * t)); }); }
function corno(t0, n, d = 0.6, g = 0.14, b = fx) { const f = mid(n); add(b, t0, d + 0.1, (t) => { const e = sua(t, 0, 0.05) * (1 - sua(t, d - 0.1, d + 0.1)); let s = 0; for (let h = 1; h <= 9; h++) s += (Math.sin(TAU * f * h * t) / h) * (0.5 + 0.5 * sua(t, 0, 0.1)); return g * e * s; }); }
const timbal = (t0, f = 62, g = 0.45) => add(fx, t0, 1.0, (t) => g * Math.sin(TAU * (f + 36 * ex(t, 0.05)) * t) * ex(t, 0.32));
const kick = (t0, g = 0.3) => add(fx, t0, 0.3, (t) => g * Math.sin(TAU * (48 + 100 * ex(t, 0.03)) * t) * ex(t, 0.1));
const hat = (t0, g = 0.04) => { const n = ruidoHP(7000); add(fx, t0, 0.06, (t, gg) => g * n(gg) * ex(t, 0.014)); };
const crunch = (t0, g = 0.3, d = 0.05, hp = 1500) => { const n = ruidoHP(hp); add(fx, t0, d + 0.02, (t, gg) => g * n(gg) * ex(t, d * 0.45)); };
const thud = (t0, f = 70, g = 0.5) => add(fx, t0, 0.5, (t) => g * Math.sin(TAU * (f + 40 * ex(t, 0.04)) * t) * ex(t, 0.14) + g * 0.25 * (R() * 2 - 1) * ex(t, 0.01));
const ding = (t0, f = 1568, g = 0.2) => add(fx, t0, 1.6, (t) => g * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2.76 * t) * ex(t, 0.2)) * ex(t, 0.5) * Math.min(1, t / 0.002));
const vidrio = (t0, n, g = 0.12) => { const f = mid(n); add(fx, t0, 1.8, (t) => g * Math.min(1, t / 0.001) * (Math.sin(TAU * f * t) * ex(t, 0.8) + 0.5 * Math.sin(TAU * f * 2.76 * t) * ex(t, 0.4) + 0.3 * Math.sin(TAU * f * 5.4 * t) * ex(t, 0.2))); };
const vibra = (b, t0, n, g = 0.1) => { const f = mid(n); add(b, t0, 1.1, (t) => g * Math.min(1, t / 0.001) * (Math.sin(TAU * f * t * (1 + 0.003 * Math.sin(TAU * 5 * t))) * ex(t, 0.45) + 0.3 * Math.sin(TAU * f * 3.98 * t) * ex(t, 0.06))); };
const clink = (t0, g = 0.14, f = 2800) => add(fx, t0, 0.4, (t) => g * (Math.sin(TAU * f * t) * ex(t, 0.06) + 0.6 * Math.sin(TAU * f * 1.51 * t) * ex(t, 0.04)) * Math.min(1, t / 0.001));
const whoosh = (t0, d = 0.5, g = 0.2, f0 = 300, f1 = 4000) => { const n = ruidoHP((gg) => lerp(f0, f1, clamp((gg - t0) / d))); add(fx, t0, d + 0.1, (t, gg) => g * n(gg) * sua(t, 0, d * 0.5) * (1 - sua(t, d * 0.7, d + 0.1))); };
const gota = (t0, g = 0.14, f = 1500) => add(fx, t0, 0.25, (t) => g * Math.sin(TAU * (f - 700 * clamp(t / 0.08)) * t) * ex(t, 0.05) * Math.min(1, t / 0.002));
function retumbar(t0, d, g = 0.4, f = 120) { const n = ruidoLP(f); add(fx, t0, d, (t, gg) => g * n(gg) * (0.6 + 0.4 * Math.sin(TAU * 5 * t)) * ventana(t, 0, d, 0.4)); }
function cohete(t0, d, g = 0.4) { const n = ruidoLP((gg) => 300 + 600 * sua(gg, t0, t0 + d)); add(fx, t0, d, (t, gg) => g * n(gg) * ventana(t, 0, d, 0.2) * (0.8 + 0.2 * Math.sin(TAU * 31 * t))); retumbar(t0, d, g * 0.8, 90); }
function pfff(t0, g = 0.25) { const n = ruidoHP((gg) => 4000 - 3000 * clamp((gg - t0) / 0.8)); add(fx, t0, 0.9, (t, gg) => g * n(gg) * ex(t, 0.4)); }
function silbatoEmbolo(t0, f0, f1, d = 0.6, g = 0.16) { let ph = 0; add(fx, t0, d + 0.05, (t) => { const k = clamp(t / d); ph += (TAU * (lerp(f0, f1, k) + 30 * Math.sin(TAU * 7 * t))) / SR; return g * Math.sin(ph) * sua(t, 0, 0.03) * (1 - sua(t, d - 0.05, d)); }); }
function boing(t0, g = 0.2, f = 260) { let ph = 0; add(fx, t0, 0.7, (t) => { ph += (TAU * f * (1 + 0.6 * Math.sin(TAU * 11 * t) * ex(t, 0.25))) / SR; return g * Math.sin(ph) * ex(t, 0.22) * Math.min(1, t / 0.003); }); }
function zap(t0, g = 0.2) { let ph = 0; add(fx, t0, 0.5, (t) => { ph += (TAU * lerp(300, 2800, clamp(t / 0.4) ** 2)) / SR; return g * (Math.sin(ph) + 0.4 * Math.sin(2 * ph)) * ex(t, 0.3) * Math.min(1, t / 0.003); }); }
function laserZumbido(t0, d, g = 0.14) { let ph = 0; add(fx, t0, d, (t) => { ph += (TAU * (600 + 200 * sua(t, 0, d) + 40 * Math.sin(TAU * 8 * t))) / SR; return g * (Math.sin(ph) + 0.4 * Math.sin(2 * ph)) * ventana(t, 0, d, 0.3); }); }
function motor(t0, d, g = 0.12, f = 70) { let ph = 0; add(fx, t0, d, (t) => { ph += (TAU * (f + 14 * Math.sin(TAU * 3 * t))) / SR; return g * (Math.sin(ph) + 0.6 * Math.sin(2.1 * ph) + 0.3 * Math.sin(3.2 * ph)) * ventana(t, 0, d, 0.3); }); }
function chirrio(t0, d = 0.8, g = 0.12, f = 190) { let ph = 0; add(fx, t0, d, (t) => { ph += (TAU * (f + 60 * Math.sin(TAU * 2.1 * t))) / SR; return g * (Math.sin(ph) + 0.6 * Math.sin(2.3 * ph)) * (0.4 + 0.6 * Math.abs(Math.sin(TAU * 11 * t))) * ventana(t, 0, d, 0.1); }); }
function trueno(t0, g = 0.5) { retumbar(t0 + 0.05, 2.2, g, 140); crunch(t0, g * 0.8, 0.12, 700); thud(t0, 45, g * 0.8); }
function lluvia(t0, d, g = 0.1) { const n = ruidoHP(4500); add(fx, t0, d, (t, gg) => g * n(gg) * ventana(t, 0, d, 0.4)); }
function viento(t0, d, g = 0.18) { const n = ruidoLP((gg) => 300 + 800 * sua(gg, t0, t0 + d)); add(fx, t0, d, (t, gg) => g * n(gg) * ventana(t, 0, d, 0.6) * (0.7 + 0.3 * Math.sin(TAU * 0.8 * t))); }
function olas(t0, d, g = 0.14) { const n = ruidoLP(700); add(fx, t0, d, (t, gg) => g * n(gg) * (0.5 + 0.5 * Math.sin(TAU * 0.35 * t)) * ventana(t, 0, d, 0.5)); }
function bocina(t0, d = 0.9, g = 0.2, f = 110) { add(fx, t0, d + 0.1, (t) => { const e = sua(t, 0, 0.06) * (1 - sua(t, d - 0.2, d + 0.1)); return g * e * (Math.sin(TAU * f * t) + 0.7 * Math.sin(TAU * f * 1.5 * t) + 0.5 * Math.sin(TAU * f * 3 * t)); }); }
function gaviota(t0, g = 0.12) { for (const o of [0, 0.35]) { let ph = 0; add(fx, t0 + o, 0.3, (t) => { ph += (TAU * (1900 - 700 * clamp(t / 0.28) + 80 * Math.sin(TAU * 18 * t))) / SR; return g * Math.sin(ph) * ventana(t, 0, 0.3, 0.05); }); } }
function geiger(t0, d, g = 0.1) { const n = ruidoHP(4000); add(fx, t0, d, (t, gg) => g * n(gg) * (R() > 0.92 ? 1 : 0) * ventana(t, 0, d, 0.1)); }
function aurora(t0, d, g = 0.05) { add(fx, t0, d, (t) => g * (Math.sin(TAU * 1760 * t) + Math.sin(TAU * 1760 * 1.5 * t) + Math.sin(TAU * 2349 * t)) * ventana(t, 0, d, 0.5) * (0.6 + 0.4 * Math.sin(TAU * 3 * t))); }
function remolino(t0, d, g = 0.14) { const n = ruidoHP((gg) => 400 + 3000 * sua(gg, t0, t0 + d)); add(fx, t0, d, (t, gg) => g * n(gg) * (0.5 + 0.5 * Math.sin(TAU * (2 + 8 * t / d) * t)) * ventana(t, 0, d, 0.3)); }
function latido(t0, g = 0.35) { for (const o of [0, 0.22]) add(fx, t0 + o, 0.3, (t) => g * Math.sin(TAU * (50 + 30 * ex(t, 0.05)) * t) * ex(t, 0.1)); }
function sling(t0, k, g = 0.12) { for (let i = 0; i < k; i++) whoosh(t0 + i * 0.5, 0.4, g, 400, 2500); }
function barajar(t0, g = 0.1) { for (let k = 0; k < 12; k++) crunch(t0 + k * 0.045, g, 0.02, 2500); }
function clunk(t0, g = 0.4) { thud(t0, 60, g); clink(t0, g * 0.5, 600); crunch(t0, g * 0.5, 0.08, 900); }
function gemido(t0, d, g = 0.14) { let ph = 0; add(fx, t0, d, (t) => { ph += (TAU * (55 + 30 * sua(t, 0, d))) / SR; return g * (Math.sin(ph) + 0.6 * Math.sin(2.3 * ph)) * ventana(t, 0, d, 0.3) * (0.4 + 0.6 * Math.abs(Math.sin(TAU * 9 * t))); }); }
function latigazo(t0, g = 0.3) { crunch(t0, g, 0.03, 3500); zap(t0, g * 0.5); }
function trombonTriste(t0, g = 0.16) { let tt = t0; [[57, 0.4], [56, 0.4], [55, 0.4], [54, 1.2]].forEach(([n, d], k) => { const f = mid(n); add(fx, tt, d + 0.1, (t) => { const e = sua(t, 0, 0.03) * (1 - sua(t, d - 0.1, d + 0.08)); const vib = k === 3 ? 1 + 0.02 * Math.sin(TAU * 6 * t) : 1; const wah = k === 3 ? 0.55 + 0.45 * Math.sin(TAU * 4 * t) : 0.8; let s = 0; for (let h = 1; h <= 8; h++) s += (Math.sin(TAU * f * vib * h * t) / h) * (h < 4 ? 1 : wah); return g * e * s; }); tt += d; }); }
function riser(tf, d = 1.0, g = 0.16) { const n = ruidoHP((gg) => 500 + 6000 * Math.pow(clamp((gg - (tf - d)) / d), 2)); add(fx, tf - d, d, (t, gg) => g * n(gg) * Math.pow(t / d, 2)); }
function fanfarria(t0, notas, g = 0.13) { notas.forEach((n, k) => corno(t0 + k * 0.11, n, 0.55, g)); }

/* ───────── 1 · CAMA ───────── */
const PROG = [[38, [62, 65, 69]], [34, [62, 65, 70]], [41, [60, 65, 69]], [36, [60, 64, 67]]]; // Dm · Bb · F · C
const PROGM = [[38, [62, 66, 69]], [43, [62, 67, 71]], [45, [61, 64, 69]], [38, [62, 66, 69]]];
for (let b = 0, t = 0; t < DURACION - 0.6; b++, t += BAR) {
  const sc = escena(t);
  const mayor = sc >= 13;
  const [raiz, ac] = (mayor ? PROGM : PROG)[b % 4];
  const muzak = sc === 10;
  const grande = sc === 8 || sc === 9 || sc === 13 || sc === 14;
  dron(t, BAR, raiz, muzak ? 0.08 : 0.17);
  if (!muzak) cuerdas(t, BAR, ac, 0.045 + (grande ? 0.02 : 0));
  if (grande || sc === 7 || sc === 5) coro(t, BAR, ac.map((n) => n + 12), 0.04);
  // arpegio de órgano (semicorcheas)
  if (!muzak) for (let s = 0; s < 8; s++) organo(t + s * (B / 2), ac[[0, 1, 2, 1, 0, 1, 2, 1][s]] + 12, (B / 2) * 0.9, grande ? 0.07 : 0.05);
  if (grande) { for (let q = 0; q < 4; q++) { kick(t + q * B, 0.3); } timbal(t, 55, 0.4); for (let s = 0; s < 8; s++) hat(t + s * (B / 2) + B / 4, 0.035); }
  // música de ascensor (vibráfono + bajo bossa) en el viaje
  if (muzak) { for (let s = 0; s < 8; s++) { const n = [0, 4, 7, 11, 7, 4, 2, 4][s]; vibra(mus, t + s * (B / 2), 69 + n, 0.12); } for (let q = 0; q < 4; q++) { organo(t + q * B, raiz + 12 + (q % 2 ? 7 : 0), B * 0.6, 0.09); hat(t + q * B + B / 2, 0.05); } }
}
{ const dl = Math.round(0.42 * SR), e = new Float32Array(dl); let p = 0, lp = 0;
  for (let i = 0; i < N; i++) { const o = e[p]; lp += 0.3 * (o - lp); e[p] = mus[i] + 0.4 * lp; mus[i] += 0.28 * o; p = (p + 1) % dl; } }

/* ───────── 2 · SONIDOS POR ESCENA ───────── */
// 1 · gancho
{ cohete(T(1, 0.3), 3.0, 0.35); crunch(T(1, 0.3), 0.2, 0.3, 2500); pfff(T(1, 3.2), 0.26); trombonTriste(T(1, 3.9), 0.09); silbatoEmbolo(T(1, 3.7), 1500, 200, 1.4, 0.12); ding(T(1, 4.4), 2093, 0.22); ding(T(1, 4.45), 1568, 0.12); whoosh(T(1, 4.4), 2.5, 0.1, 200, 1800); riser(ES[1], 0.6, 0.12); }
// 2 · nanotubo
{ for (let k = 0; k < 10; k++) vidrio(T(2, 0.2 + k * 0.25), 84 + [0, 2, 4, 7, 9][k % 5], 0.08); add(fx, T(2, 0.2), 2.4, (t) => 0.06 * Math.sin(TAU * 120 * t) * ventana(t, 0, 2.4, 0.4));
  whoosh(T(2, 2.6), 2.0, 0.18, 200, 3000); whoosh(T(2, 4.6), 1.8, 0.2, 200, 3500); for (let k = 0; k < 8; k++) crunch(T(2, 0.6 + k * 0.5), 0.1, 0.012, 3000);
  [0, 4, 7, 12].forEach((n, k) => vidrio(T(2, 6.4 + k * 0.1), 88 + n, 0.12)); ding(T(2, 6.4), 1760, 0.14); riser(ES[2], 0.6, 0.12); }
// 3 · cinta
{ whoosh(T(3, 0.2), 1.0, 0.16, 300, 2500); crunch(T(3, 1.6), 0.2, 0.06, 900); thud(T(3, 1.6), 100, 0.2); for (let k = 0; k < 6; k++) crunch(T(3, 3.2 + k * 0.09), 0.1, 0.03, 3500);
  ding(T(3, 3.2), 2349, 0.12); viento(T(3, 6.4), 2.4, 0.14); zap(T(3, 6.4), 0.06); riser(ES[3], 0.6, 0.12); }
// 4 · plataforma
{ olas(T(4, 0.2), 8.4, 0.16); gota(T(4, 0.4), 0.1); thud(T(4, 0.6), 55, 0.3); bocina(T(4, 1.2), 1.1, 0.14, 98);
  motor(T(4, 2.6), 2.0, 0.1, 80); clunk(T(4, 4.4), 0.25); gaviota(T(4, 5.6), 0.12); boing(T(4, 5.65), 0.1, 400); gaviota(T(4, 6.6), 0.1); riser(ES[4], 0.6, 0.12); }
// 5 · trepador
{ whoosh(T(5, 0.2), 1.0, 0.14); laserZumbido(T(5, 1.2), 7.0, 0.14); zap(T(5, 1.2), 0.24); motor(T(5, 1.0), 7.5, 0.12, 90);
  for (let k = 0; k < 8; k++) crunch(T(5, 1.0 + k * 0.9), 0.14, 0.03, 1800); chirrio(T(5, 2.4), 3.0, 0.06, 420); ding(T(5, 2.8), 1760, 0.14); ding(T(5, 4.6), 1568, 0.1); boing(T(5, 6.4), 0.1, 420); riser(ES[5], 0.6, 0.12); }
// 6 · clima
{ whoosh(T(6, 0.2), 1.0, 0.14); viento(T(6, 0.2), 7.0, 0.16); trueno(T(6, 1.6), 0.45); lluvia(T(6, 2.0), 2.4, 0.1); trueno(T(6, 3.2), 0.5);
  whoosh(T(6, 4.4), 1.4, 0.16, 200, 3000); add(fx, T(6, 5.6), 2.0, (t) => 0.06 * Math.sin(TAU * 70 * t) * ventana(t, 0, 2.0, 0.5)); boing(T(6, 6.4), 0.1, 360); riser(ES[6], 0.6, 0.12); }
// 7 · Van Allen
{ whoosh(T(7, 0.2), 1.0, 0.16, 300, 2500); geiger(T(7, 1.2), 6.5, 0.12); geiger(T(7, 3.4), 3.4, 0.16); aurora(T(7, 5.6), 2.4, 0.06); zap(T(7, 3.4), 0.1);
  coro(T(7, 1.2), 5.0, [62, 69, 74], 0.05, fx); boing(T(7, 4.6), 0.1, 340); riser(ES[7], 0.6, 0.12); }
// 8 · física
{ for (let k = 0; k < 6; k++) latido(T(8, 1.0 + k * 0.6), 0.3); remolino(T(8, 3.2), 2.4, 0.14); ding(T(8, 5.6), 1976, 0.24); [0, 4, 7, 12].forEach((n, k) => ding(T(8, 5.65 + k * 0.1), 1500 + n * 60, 0.1)); sling(T(8, 7.0), 3, 0.12); riser(ES[8], 0.6, 0.12); }
// 9 · contrapeso
{ sling(T(9, 0.4), 8, 0.14); for (let k = 0; k < 10; k++) crunch(T(9, 1.0 + k * 0.1), 0.05 + k * 0.01, 0.01, 3000); thud(T(9, 3.2), 50, 0.6); timbal(T(9, 3.2), 50, 0.4);
  add(fx, T(9, 5.0), 2.0, (t) => 0.1 * Math.sin(TAU * (200 + 400 * sua(t, 0, 2)) * t) * ventana(t, 0, 2.0, 0.3)); ding(T(9, 6.6), 1760, 0.18); riser(ES[9], 0.6, 0.12); }
// 10 · viaje
{ whoosh(T(10, 0.2), 0.8, 0.12); barajar(T(10, 1.8), 0.12); for (let k = 0; k < 7; k++) { crunch(T(10, 3.0 + k * 0.45), 0.14, 0.02, 2200); clink(T(10, 3.0 + k * 0.45), 0.08, 1800); }
  boing(T(10, 4.8), 0.12, 380); ding(T(10, 5.0), 1320, 0.1); clunk(T(10, 6.2), 0.5); ding(T(10, 6.5), 1976, 0.2); riser(ES[10], 0.5, 0.1); }
// 11 · acero
{ whoosh(T(11, 0.2), 0.8, 0.12); gemido(T(11, 1.6), 2.2, 0.16); chirrio(T(11, 2.0), 1.8, 0.1, 160); latigazo(T(11, 3.8), 0.4); thud(T(11, 3.8), 55, 0.5); silbatoEmbolo(T(11, 3.9), 1600, 250, 0.9, 0.1); boing(T(11, 4.2), 0.14, 300); ding(T(11, 6.0), 1760, 0.18); riser(ES[11], 0.5, 0.1); }
// 12 · laboratorio
{ crunch(T(12, 0.2), 0.3, 0.02, 3000); clink(T(12, 0.2), 0.2, 1500); for (let k = 0; k < 12; k++) crunch(T(12, 1.6 + k * 0.12), 0.1, 0.012, 3500); ding(T(12, 3.4), 880, 0.14);
  crunch(T(12, 4.0), 0.4, 0.1, 800); thud(T(12, 4.0), 60, 0.5); whoosh(T(12, 5.8), 1.8, 0.2, 200, 3500); ding(T(12, 7.4), 1760, 0.2); riser(ES[12], 0.6, 0.12); }
// 13 · cierre
{ whoosh(T(13, 0.2), 4.2, 0.22, 200, 3500); viento(T(13, 0.4), 4.0, 0.1); thud(T(13, 4.6), 55, 0.4); clunk(T(13, 4.6), 0.2);
  ding(T(13, 5.4), 1568, 0.16); ding(T(13, 6.0), 1760, 0.16); ding(T(13, 6.6), 1976, 0.18); thud(T(13, 7.4), 50, 0.7); crunch(T(13, 7.4), 0.4, 0.05, 900); fanfarria(T(13, 7.6), [62, 66, 69, 74], 0.13); }
// 14 · CTA
{ const t0 = ES[13];
  fanfarria(t0 + 0.1, [62, 69, 74, 78, 81], 0.14); timbal(t0 + 0.1, 55, 0.5); ding(t0 + 0.9, 1568, 0.2); ding(t0 + 0.95, 2093, 0.14); for (let k = 0; k < 8; k++) vidrio(t0 + 0.4 + k * 0.1, 84 + k * 2, 0.06); }

/* ───────── 3 · mezcla ───────── */
const x = buf();
for (let i = 0; i < N; i++) x[i] = mus[i] * 0.9 + fx[i];
{ const y = buf(); for (const ms of [41.3, 59.9, 83.1, 119.7]) { const d = Math.round((ms * SR) / 1000), lin = new Float32Array(d); let q = 0, lp = 0; for (let i = 0; i < N; i++) { const o = lin[q]; lp += 0.4 * (o - lp); lin[q] = fx[i] + 0.35 * lp; y[i] += 0.1 * o; q = (q + 1) % d; } } for (let i = 0; i < N; i++) x[i] += y[i]; }
let pic = 0; for (let i = 0; i < N; i++) { if (!Number.isFinite(x[i])) x[i] = 0; pic = Math.max(pic, Math.abs(x[i])); }
const gl = 0.9 / Math.max(1e-4, pic);
for (let i = 0; i < N; i++) x[i] = Math.tanh(x[i] * gl * 1.15) * 0.9;
const fi = Math.round(0.04 * SR), fo = Math.round(1.2 * SR);
for (let i = 0; i < fi; i++) x[i] *= i / fi; for (let i = 0; i < fo; i++) x[N - 1 - i] *= i / fo;
mkdirSync(join(RAIZ, "assets", "musica"), { recursive: true });
const salida = join(RAIZ, "assets", "musica", "ascensor-espacial.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION.toFixed(1)} s · ${BPM} bpm · pico ${pic.toFixed(2)}`);
console.log("   escenas (inicio):", ES.map((a, i) => `${i + 1}:${a.toFixed(1)}s`).join("  "));
