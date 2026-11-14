#!/usr/bin/env node
/**
 * Música de misterio forense con pulso electrónico + diseño sonoro cómico propio (síntesis, sin muestras ni licencias) para «El secreto perdido del hormigón romano» (≈ 107 s).
 * Cama: re menor a 100 bpm (bajo con sidechain, cuerdas, vibráfono, chasquidos y hi-hat), con intriga en el zoom, campanas de cristal que suben mientras crece la tobermorita,
 * coro en el Panteón, pizzicato cómico en el sesgo, maquinaria en el cemento y resolución en re mayor con fanfarria en el cierre.
 * Encima, sonidos DISTINTOS por escena, alineados con lo que se ve:
 *   1 · gancho     sonar de ping · barrido de escaneo · crujido de metal oxidado · bocina de barco · destellos de cristal · «¡caso abierto!»
 *   2 · óxido      gotas de agua salada · quejido de metal · «crac» del hormigón · trozo que cae · «¡auxilio, me oxido!» (boing)
 *   3 · ceniza     retumbar de volcán · «fump» de los sacos · bocina de barco · graznido de gaviota · olas
 *   4 · receta     chapoteo de cada ingrediente · vertido de mezcla · crujido de madera · «¡no!» de buzzer (sin acero)
 *   5 · zoom       tres barridos de zoom · tics de contador geiger · burbujas · ping de retícula
 *   6 · reacción   gotas que entran · fizz de la disolución · tics de iones · cristales que nacen (campanas de vidrio)
 *   7 · cristal    tic-tac de cámara rápida que acelera · campanas de cristal que suben · «ding» de los 2.000 años · obturador
 *   8 · curita     «crac» de la grieta · goteo · cristales que sellan · rasgado de curita (velcro) · boing de «¡curita!»
 *   9 · grumos     disolución (fizz) · tics de calcio · calcita que tapa · tapa del botiquín
 *  10 · panteón    cartel · derrumbe del viaducto (crash y polvo) · coro de la cúpula · ding de luz
 *  11 · sesgo      pizzicato cómico de ruinas que caen · foco (thunk) · trombón triste · «ojo»
 *  12 · cemento    horno que ruge · tics del termómetro · maquinaria · tos «cof, cof»
 *  13 · caso       olas y destellos · sello (thump) · máquina de escribir · fanfarria resolutiva
 *  14 · cierre     arpegio de vibráfono y ta-da
 * Uso:  node videos/2026-11-14-hormigon-romano/componer-musica.mjs   → assets/musica/hormigon-romano.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/hormigon-romano.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dur = [8.0, 8.0, 7.6, 7.6, 7.4, 7.6, 8.0, 8.0, 7.2, 7.6, 7.6, 8.9, 8.0, 5.0];
export const DURACION = dur.reduce((a, b) => a + b, 0) + 0.5;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(141114);
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
const BPM = 100, B = 60 / BPM, BAR = 4 * B;
const escena = (t) => ES.findIndex((e, i) => t >= e && (i === ES.length - 1 || t < ES[i + 1])) + 1;
const ventana = (g, a, b, r = 0.3) => sua(g, a, a + r) * (1 - sua(g, b - r, b));
const sidechain = (t) => 0.4 + 0.6 * sua(((t % B) + B) % B, 0, 0.16);

/* ───────── instrumentos ───────── */
const ruidoLP = (cor) => { let y = 0; return (g) => { const f = Math.max(20, typeof cor === "function" ? cor(g) : cor); y += (1 - Math.exp((-TAU * f) / SR)) * ((R() * 2 - 1) - y); return y; }; };
const ruidoHP = (cor) => { let y = 0; return (g) => { const f = Math.max(20, typeof cor === "function" ? cor(g) : cor); const w = R() * 2 - 1; y += (1 - Math.exp((-TAU * f) / SR)) * (w - y); return w - y; }; };
function bajo(t0, n, d, g = 0.3) { const f = mid(n); add(mus, t0, d + 0.05, (t, gl) => { const e = sua(t, 0, 0.012) * (1 - sua(t, d - 0.05, d + 0.05)); let s = 0; for (let h = 1; h <= 6; h++) s += Math.sin(TAU * f * h * t) / (h * h * 0.6); return g * e * s * sidechain(gl); }); }
function cuerdas(t0, d, notas, g = 0.06) { add(mus, t0, d + 0.3, (t) => { const e = sua(t, 0, 0.5) * (1 - sua(t, d - 0.2, d + 0.3)); let s = 0; for (const n of notas) { const f = mid(n); for (const de of [-0.004, 0, 0.004]) for (let h = 1; h <= 5; h++) s += Math.sin(TAU * f * (1 + de) * h * t) / (h * 1.3); } return g * e * s * (0.85 + 0.15 * Math.sin(TAU * 0.3 * t)); }); }
function vibra(b, t0, n, g = 0.12) { const f = mid(n); add(b, t0, 1.2, (t) => g * Math.min(1, t / 0.001) * (Math.sin(TAU * f * t * (1 + 0.003 * Math.sin(TAU * 5 * t))) * ex(t, 0.45) + 0.3 * Math.sin(TAU * f * 3.98 * t) * ex(t, 0.06))); }
function vidrio(t0, n, g = 0.14) { const f = mid(n); add(fx, t0, 1.8, (t) => g * Math.min(1, t / 0.001) * (Math.sin(TAU * f * t) * ex(t, 0.8) + 0.5 * Math.sin(TAU * f * 2.76 * t) * ex(t, 0.4) + 0.3 * Math.sin(TAU * f * 5.4 * t) * ex(t, 0.2))); }
const pizz = (t0, n, g = 0.18) => { const f = mid(n); add(fx, t0, 0.3, (t) => g * Math.sin(TAU * f * t) * ex(t, 0.06) * Math.min(1, t / 0.001)); };
const kick = (t0, g = 0.45) => add(fx, t0, 0.3, (t) => g * Math.sin(TAU * (48 + 110 * ex(t, 0.03)) * t) * ex(t, 0.1));
const chasquido = (t0, g = 0.16) => { const n = ruidoHP(2200); add(fx, t0, 0.12, (t, gg) => g * n(gg) * ex(t, 0.025)); };
const hat = (t0, g = 0.05) => { const n = ruidoHP(7000); add(fx, t0, 0.06, (t, gg) => g * n(gg) * ex(t, 0.012)); };
const crunch = (t0, g = 0.3, d = 0.05, hp = 1500) => { const n = ruidoHP(hp); add(fx, t0, d + 0.02, (t, gg) => g * n(gg) * ex(t, d * 0.45)); };
const thud = (t0, f = 70, g = 0.5) => add(fx, t0, 0.5, (t) => g * Math.sin(TAU * (f + 40 * ex(t, 0.04)) * t) * ex(t, 0.14) + g * 0.25 * (R() * 2 - 1) * ex(t, 0.01));
const ding = (t0, f = 1568, g = 0.2) => add(fx, t0, 1.6, (t) => g * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2.76 * t) * ex(t, 0.2)) * ex(t, 0.5) * Math.min(1, t / 0.002));
const ping = (t0, f = 1320, g = 0.18) => add(fx, t0, 1.4, (t) => g * Math.sin(TAU * f * t) * ex(t, 0.35) * Math.min(1, t / 0.002) + 0.5 * g * Math.sin(TAU * f * t) * ex(Math.max(0, t - 0.28), 0.25) * (t > 0.28 ? 1 : 0));
const whoosh = (t0, d = 0.5, g = 0.2, f0 = 300, f1 = 4000) => { const n = ruidoHP((gg) => lerp(f0, f1, clamp((gg - t0) / d))); add(fx, t0, d + 0.1, (t, gg) => g * n(gg) * sua(t, 0, d * 0.5) * (1 - sua(t, d * 0.7, d + 0.1))); };
const gota = (t0, g = 0.16, f = 1500) => add(fx, t0, 0.2, (t) => g * Math.sin(TAU * (f - 700 * clamp(t / 0.08)) * t) * ex(t, 0.04) * Math.min(1, t / 0.002));
const burbuja = (t0, g = 0.14, f = 500) => add(fx, t0, 0.2, (t) => g * Math.sin(TAU * (f + 600 * t / 0.1) * t) * ex(t, 0.05) * Math.min(1, t / 0.003));
function chirrio(t0, d = 0.8, g = 0.14, f = 190) { let ph = 0; add(fx, t0, d, (t) => { ph += (TAU * (f + 60 * Math.sin(TAU * 2.1 * t) + 30 * Math.sin(TAU * 7 * t))) / SR; return g * (Math.sin(ph) + 0.6 * Math.sin(2.3 * ph)) * (0.4 + 0.6 * Math.abs(Math.sin(TAU * 11 * t))) * ventana(t, 0, d, 0.1); }); }
function crac(t0, g = 0.3) { crunch(t0, g, 0.08, 800); thud(t0, 60, g * 0.9); crunch(t0 + 0.05, g * 0.7, 0.05, 2400); }
function retumbar(t0, d, g = 0.4) { const n = ruidoLP(120); add(fx, t0, d, (t, gg) => g * n(gg) * (0.6 + 0.4 * Math.sin(TAU * 5 * t)) * ventana(t, 0, d, 0.5)); }
function bocina(t0, d = 0.9, g = 0.2, f = 110) { add(fx, t0, d + 0.1, (t) => { const e = sua(t, 0, 0.06) * (1 - sua(t, d - 0.2, d + 0.1)); return g * e * (Math.sin(TAU * f * t) + 0.7 * Math.sin(TAU * f * 1.5 * t) + 0.5 * Math.sin(TAU * f * 3 * t)); }); }
function gaviota(t0, g = 0.12) { for (const o of [0, 0.35]) { let ph = 0; add(fx, t0 + o, 0.3, (t) => { ph += (TAU * (1900 - 700 * clamp(t / 0.28) + 80 * Math.sin(TAU * 18 * t))) / SR; return g * Math.sin(ph) * ventana(t, 0, 0.3, 0.05); }); } }
function chapoteo(t0, g = 0.22) { const n = ruidoLP(900); add(fx, t0, 0.4, (t, gg) => g * n(gg) * ex(t, 0.12) + g * 0.2 * Math.sin(TAU * (300 - 200 * clamp(t / 0.3)) * t) * ex(t, 0.15)); }
function fizz(t0, d, g = 0.1) { const n = ruidoHP(4500); add(fx, t0, d, (t, gg) => g * n(gg) * (R() > 0.7 ? 1 : 0.2) * ventana(t, 0, d, 0.2)); }
function velcro(t0, d = 0.35, g = 0.2) { const n = ruidoHP(2500); add(fx, t0, d, (t, gg) => g * n(gg) * (0.5 + 0.5 * Math.sin(TAU * 90 * t)) * ventana(t, 0, d, 0.04)); }
function boing(t0, g = 0.2, f = 260) { let ph = 0; add(fx, t0, 0.7, (t) => { ph += (TAU * f * (1 + 0.6 * Math.sin(TAU * 11 * t) * ex(t, 0.25))) / SR; return g * Math.sin(ph) * ex(t, 0.22) * Math.min(1, t / 0.003); }); }
function silbatoEmbolo(t0, f0, f1, d = 0.6, g = 0.16) { let ph = 0; add(fx, t0, d + 0.05, (t) => { const k = clamp(t / d); ph += (TAU * (lerp(f0, f1, k) + 30 * Math.sin(TAU * 7 * t))) / SR; return g * Math.sin(ph) * sua(t, 0, 0.03) * (1 - sua(t, d - 0.05, d)); }); }
function trombonTriste(t0, g = 0.16) { let tt = t0; [[57, 0.4], [56, 0.4], [55, 0.4], [54, 1.2]].forEach(([n, d], k) => { const f = mid(n); add(fx, tt, d + 0.1, (t) => { const e = sua(t, 0, 0.03) * (1 - sua(t, d - 0.1, d + 0.08)); const vib = k === 3 ? 1 + 0.02 * Math.sin(TAU * 6 * t) : 1; const wah = k === 3 ? 0.55 + 0.45 * Math.sin(TAU * 4 * t) : 0.8; let s = 0; for (let h = 1; h <= 8; h++) s += (Math.sin(TAU * f * vib * h * t) / h) * (h < 4 ? 1 : wah); return g * e * s; }); tt += d; }); }
function buzzer(t0, g = 0.18) { add(fx, t0, 0.5, (t) => g * ((Math.sin(TAU * 110 * t) > 0 ? 1 : -1) * 0.5 + 0.3 * Math.sin(TAU * 220 * t)) * ventana(t, 0, 0.5, 0.03)); }
function coro(t0, d, notas, g = 0.07) { add(fx, t0, d, (t) => { const e = sua(t, 0, 0.8) * (1 - sua(t, d - 0.8, d)); let s = 0; for (const n of notas) { const f = mid(n) * (1 + 0.003 * Math.sin(TAU * 5 * t)); s += Math.sin(TAU * f * t) + 0.55 * Math.sin(TAU * f * 2 * t) + 0.35 * Math.sin(TAU * f * 3 * t) + 0.25 * Math.sin(TAU * f * 5 * t); } return g * e * s; }); }
function estruendo(t0, g = 0.4) { retumbar(t0, 1.8, g); crunch(t0, g * 0.7, 0.3, 500); for (let k = 0; k < 8; k++) crunch(t0 + 0.2 + k * 0.17 + R() * 0.1, g * 0.4, 0.1, 700 + R() * 1200); thud(t0, 45, g); }
function tos(t0, g = 0.2) { for (const o of [0, 0.22]) { const n = ruidoLP(1100); add(fx, t0 + o, 0.15, (t, gg) => g * (n(gg) * 1.5 + 0.4 * Math.sin(TAU * (160 - 40 * clamp(t / 0.12)) * t)) * ventana(t, 0, 0.15, 0.03)); } }
function obturador(t0, g = 0.22) { crunch(t0, g, 0.01, 3000); crunch(t0 + 0.06, g * 0.8, 0.01, 2200); }
function riser(tf, d = 1.2, g = 0.16) { const n = ruidoHP((gg) => 500 + 6000 * Math.pow(clamp((gg - (tf - d)) / d), 2)); add(fx, tf - d, d, (t, gg) => g * n(gg) * Math.pow(t / d, 2)); }
function fanfarria(t0, notas, g = 0.13) { notas.forEach((n, k) => add(fx, t0 + k * 0.1, 0.55, (t) => { const f = mid(n); const e = sua(t, 0, 0.03) * (1 - sua(t, 0.4, 0.55)); let s = 0; for (let h = 1; h <= 9; h++) s += Math.sin(TAU * f * h * t) / h; return g * e * s; })); }

/* ───────── 1 · CAMA ───────── */
const PROG = [[38, [62, 65, 69]], [34, [62, 65, 70]], [43, [62, 67, 70]], [45, [61, 64, 69]]]; // Dm · Bb · Gm · A
const PROGM = [[38, [62, 66, 69]], [43, [62, 67, 71]], [45, [61, 64, 69]], [38, [62, 66, 69]]]; // D · G · A · D (resolución)
for (let b = 0, t = 0; t < DURACION - 0.6; b++, t += BAR) {
  const sc = escena(t);
  const mayor = sc >= 13;
  const [raiz, ac] = (mayor ? PROGM : PROG)[b % 4];
  const fino = sc === 5 || sc === 7;       // zoom y cristal: cama delgada
  const alegre = sc === 8 || sc === 9 || sc === 11;
  const lleno = sc === 1 || sc === 10 || sc === 12 || sc === 13;
  cuerdas(t, BAR, ac.map((n) => n - 12), fino ? 0.035 : 0.06);
  for (let s = 0; s < 8; s++) { if (fino && s % 2) continue; bajo(t + s * (B / 2), raiz + (s % 4 === 3 ? 12 : 0), (B / 2) * 0.7, fino ? 0.12 : 0.26); }
  for (let q = 0; q < 4; q++) { if (!fino || q % 2 === 0) kick(t + q * B, lleno ? 0.5 : 0.34); if (q % 2) chasquido(t + q * B, alegre ? 0.12 : 0.17); }
  for (let s = 0; s < 8; s++) hat(t + s * (B / 2) + B / 4, 0.045);
  // vibráfono: arpegio sencillo
  const pat = [0, 1, 2, 1, 0, 1, 2, 1];
  if (sc !== 3) for (let s = 0; s < 8; s++) { if (alegre && s % 2) continue; vibra(mus, t + s * (B / 2), ac[pat[s]] + 12, fino ? 0.07 : 0.1); }
}
{ const dl = Math.round(0.45 * SR), e = new Float32Array(dl); let p = 0, lp = 0;
  for (let i = 0; i < N; i++) { const o = e[p]; lp += 0.3 * (o - lp); e[p] = mus[i] + 0.35 * lp; mus[i] += 0.25 * o; p = (p + 1) % dl; } }

/* ───────── 2 · SONIDOS POR ESCENA ───────── */
// 1 · gancho
{ ping(T(1, 0.2), 1320, 0.2); whoosh(T(1, 0.4), 0.5, 0.14); chirrio(T(1, 1.2), 1.8, 0.1, 160);
  bocina(T(1, 3.3), 0.9, 0.12, 98); for (let k = 0; k < 8; k++) vidrio(T(1, 3.8 + k * 0.28), 88 + (k % 4) * 2, 0.06);
  boing(T(1, 5.9), 0.14, 330); ping(T(1, 6.6), 1760, 0.14); riser(ES[1], 0.7, 0.14); }
// 2 · óxido
{ thud(T(2, 0.2), 55, 0.4); for (let k = 0; k < 8; k++) gota(T(2, 1.0 + k * 0.28), 0.12, 1300 + (k % 3) * 160);
  chirrio(T(2, 2.4), 2.6, 0.16, 150); crac(T(2, 4.2), 0.34); crunch(T(2, 4.6), 0.2, 0.04, 1800); thud(T(2, 5.1), 70, 0.3); boing(T(2, 4.8), 0.16, 280); ding(T(2, 5.6), 1320, 0.1); riser(ES[2], 0.6, 0.12); }
// 3 · ceniza
{ retumbar(T(3, 0.2), 3.4, 0.35); thud(T(3, 0.3), 50, 0.45); for (let k = 0; k < 6; k++) { crunch(T(3, 1.6 + k * 0.3), 0.18, 0.1, 500); thud(T(3, 1.75 + k * 0.3), 90, 0.22); }
  bocina(T(3, 2.6), 1.0, 0.16, 90); gaviota(T(3, 4.2), 0.12); boing(T(3, 4.3), 0.1, 400); for (let k = 0; k < 4; k++) chapoteo(T(3, 3.0 + k * 0.7), 0.1); riser(ES[3], 0.6, 0.12); }
// 4 · receta
{ whoosh(T(4, 0.2), 0.5, 0.12, 200, 1500); for (let k = 0; k < 4; k++) { chapoteo(T(4, 0.8 + k * 0.5), 0.2); vidrio(T(4, 0.8 + k * 0.5), 72 + k * 3, 0.05); }
  { const n = ruidoLP(500); add(fx, T(4, 2.4), 2.2, (t, g) => 0.3 * n(g) * ventana(t, 0, 2.2, 0.3)); } chirrio(T(4, 2.5), 1.8, 0.08, 120);
  buzzer(T(4, 4.6), 0.18); thud(T(4, 4.6), 60, 0.3); ding(T(4, 5.4), 1568, 0.1); riser(ES[4], 0.6, 0.12); }
// 5 · zoom
{ ping(T(5, 0.2), 1760, 0.14); [0.8, 2.6, 4.4].forEach((tt, k) => { whoosh(T(5, tt), 0.9, 0.2, 200 + k * 150, 4500 + k * 1500); thud(T(5, tt + 0.8), 70, 0.25); });
  for (let k = 0; k < 24; k++) crunch(T(5, 0.6 + k * 0.28 + R() * 0.12), 0.1, 0.01, 3500); for (let k = 0; k < 6; k++) burbuja(T(5, 4.4 + k * 0.3), 0.08, 400 + k * 50);
  boing(T(5, 3.6), 0.12, 360); ding(T(5, 5.6), 1976, 0.12); riser(ES[5], 0.6, 0.12); }
// 6 · reacción
{ for (let k = 0; k < 7; k++) gota(T(6, 0.8 + k * 0.25), 0.15, 1700 - k * 40); boing(T(6, 1.0), 0.1, 450);
  fizz(T(6, 2.2), 2.2, 0.1); for (let k = 0; k < 12; k++) crunch(T(6, 2.6 + k * 0.16), 0.1, 0.012, 3200);
  [0, 3, 7, 10, 12, 15].forEach((n, k) => vidrio(T(6, 4.4 + k * 0.14), 86 + n, 0.1)); ding(T(6, 5.4), 1760, 0.14); riser(ES[6], 0.6, 0.12); }
// 7 · cristal
{ ping(T(7, 0.2), 1320, 0.12); obturador(T(7, 1.2), 0.2);
  for (let k = 0; k < 20; k++) { const tk = T(7, 1.2 + (k * k * 0.0105) + k * 0.1); crunch(tk, 0.14, 0.012, 2400); }
  for (let k = 0; k < 14; k++) vidrio(T(7, 1.4 + k * 0.34), 74 + [0, 2, 4, 7, 9, 12][k % 6] + Math.floor(k / 6) * 12, 0.08);
  whoosh(T(7, 1.2), 4.8, 0.08, 400, 6000); ding(T(7, 6.0), 1760, 0.2); [0, 4, 7, 12].forEach((n, k) => vidrio(T(7, 6.0 + k * 0.08), 96 + n, 0.1)); riser(ES[7], 0.6, 0.12); }
// 8 · curita
{ thud(T(8, 0.2), 70, 0.3); crac(T(8, 0.8), 0.3);
  for (let k = 0; k < 6; k++) gota(T(8, 2.0 + k * 0.3), 0.14, 1400 + k * 80);
  [0, 2, 4, 7, 9, 12].forEach((n, k) => vidrio(T(8, 3.2 + k * 0.25), 82 + n, 0.08)); ding(T(8, 4.8), 1568, 0.16);
  velcro(T(8, 5.5), 0.35, 0.2); boing(T(8, 5.85), 0.2, 300); ding(T(8, 6.0), 2349, 0.1); riser(ES[8], 0.6, 0.12); }
// 9 · grumos
{ thud(T(9, 0.2), 70, 0.3); ding(T(9, 0.8), 1760, 0.1); crac(T(9, 2.0), 0.26);
  fizz(T(9, 3.0), 1.6, 0.1); for (let k = 0; k < 10; k++) crunch(T(9, 3.0 + k * 0.16), 0.1, 0.012, 3000);
  [0, 4, 7, 12].forEach((n, k) => vidrio(T(9, 4.4 + k * 0.1), 88 + n, 0.12)); ding(T(9, 4.5), 1976, 0.14); thud(T(9, 5.2), 90, 0.25); boing(T(9, 5.25), 0.12, 420); riser(ES[9], 0.6, 0.12); }
// 10 · panteón
{ whoosh(T(10, 0.2), 0.5, 0.12); boing(T(10, 0.8), 0.16, 300); estruendo(T(10, 1.6), 0.45); fizz(T(10, 1.8), 1.4, 0.06); silbatoEmbolo(T(10, 1.6), 1200, 220, 1.0, 0.1);
  whoosh(T(10, 3.0), 0.7, 0.14); coro(T(10, 3.0), 4.4, [62, 66, 69, 74], 0.07); ding(T(10, 4.0), 1760, 0.18); vidrio(T(10, 4.0), 98, 0.1); riser(ES[10], 0.6, 0.12); }
// 11 · sesgo
{ whoosh(T(11, 0.2), 0.5, 0.1); for (let k = 0; k < 4; k++) { pizz(T(11, 1.4 + k * 0.35), 60 - k * 3, 0.2); thud(T(11, 1.45 + k * 0.35), 80, 0.2); crunch(T(11, 1.45 + k * 0.35), 0.15, 0.06, 900); }
  { let ph = 0; add(fx, T(11, 3.0), 0.5, (t) => { ph += (TAU * (200 + 1500 * sua(t, 0, 0.4))) / SR; return 0.14 * Math.sin(ph) * ventana(t, 0, 0.5, 0.05); }); } thud(T(11, 3.2), 60, 0.35);
  trombonTriste(T(11, 4.2), 0.09); ding(T(11, 5.2), 1320, 0.1); riser(ES[11], 0.6, 0.12); }
// 12 · cemento
{ thud(T(12, 0.2), 50, 0.4); retumbar(T(12, 0.4), 6.0, 0.28); chirrio(T(12, 1.0), 3.2, 0.1, 130);
  for (let k = 0; k < 14; k++) crunch(T(12, 1.0 + k * 0.13), 0.14, 0.012, 3000); ding(T(12, 2.6), 1568, 0.14);
  crac(T(12, 4.4), 0.3); ding(T(12, 4.5), 1245, 0.12); tos(T(12, 6.4), 0.2); boing(T(12, 6.5), 0.1, 240); trombonTriste(T(12, 7.0), 0.07); riser(ES[12], 0.6, 0.12); }
// 13 · caso
{ whoosh(T(13, 0.2), 0.6, 0.12); for (let k = 0; k < 10; k++) vidrio(T(13, 1.0 + k * 0.2), 84 + [0, 4, 7, 9, 12][k % 5], 0.06);
  for (let k = 0; k < 6; k++) crunch(T(13, 3.0 + k * 0.08), 0.12, 0.01, 2800);
  thud(T(13, 4.2), 50, 0.7); crunch(T(13, 4.2), 0.4, 0.04, 900); ding(T(13, 4.45), 1568, 0.2); fanfarria(T(13, 4.7), [62, 66, 69, 74, 78], 0.12); riser(ES[13], 0.5, 0.1); }
// 14 · cierre
{ const t0 = ES[13];
  [0, 4, 7, 12, 16, 19, 24].forEach((n, k) => vibra(fx, t0 + 0.1 + k * 0.09, 62 + n, 0.16));
  fanfarria(t0 + 0.2, [62, 66, 69, 74], 0.12); ding(t0 + 0.9, 1568, 0.2); ding(t0 + 0.95, 2093, 0.14); obturador(t0 + 2.4, 0.16); }

/* ───────── 3 · mezcla ───────── */
const x = buf();
for (let i = 0; i < N; i++) x[i] = mus[i] * 0.9 + fx[i];
{ const y = buf(); for (const ms of [31.7, 47.3, 67.9]) { const d = Math.round((ms * SR) / 1000), lin = new Float32Array(d); let q = 0, lp = 0; for (let i = 0; i < N; i++) { const o = lin[q]; lp += 0.4 * (o - lp); lin[q] = fx[i] + 0.3 * lp; y[i] += 0.08 * o; q = (q + 1) % d; } } for (let i = 0; i < N; i++) x[i] += y[i]; }
let pico = 0; for (let i = 0; i < N; i++) { if (!Number.isFinite(x[i])) x[i] = 0; pico = Math.max(pico, Math.abs(x[i])); }
const gl = 0.9 / Math.max(1e-4, pico);
for (let i = 0; i < N; i++) x[i] = Math.tanh(x[i] * gl * 1.15) * 0.9;
const fi = Math.round(0.04 * SR), fo = Math.round(1.2 * SR);
for (let i = 0; i < fi; i++) x[i] *= i / fi; for (let i = 0; i < fo; i++) x[N - 1 - i] *= i / fo;
mkdirSync(join(RAIZ, "assets", "musica"), { recursive: true });
const salida = join(RAIZ, "assets", "musica", "hormigon-romano.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION.toFixed(1)} s · ${BPM} bpm · pico ${pico.toFixed(2)}`);
console.log("   escenas (inicio):", ES.map((a, i) => `${i + 1}:${a.toFixed(1)}s`).join("  "));
