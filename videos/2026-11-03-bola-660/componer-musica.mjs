#!/usr/bin/env node
/**
 * Música psicodélica + diseño sonoro propio (síntesis, sin muestras ni licencias) para «La bola de 660 toneladas» (43,4 s).
 * Cama musical (escala frigia dominante en re, 104 bpm): tanpura (drones), sitar (motivos y escalas), pad con phaser, bajo «wub», tabla y shaker
 * que entran y salen por escena, ecos en corchea con puntillo y reverberación. Encima, sonidos DISTINTOS en cada parte, alineados con lo que se ve:
 *
 *   1 · gancho   gong con caída grave · «boing» elástico al abrir la lupa · campanitas de cristal al armarse el edificio · riser de platillo invertido
 *   2 · viento   ráfagas de viento · crujido metálico de la torre · «wub» grave cuando la bola va al revés · riser láser
 *   3 · discos   zumbido de la grúa · chisporroteo de soldadura · yunque que sube de tono cada 5 discos · «ka-chunk» al cerrar el disco 41
 *   4 · bola     barrido de armónicos de cristal · «zip» de la cota · latido grave · destellos de marimba
 *   5 · cuelga   trinquete de cabrestante + marimba por cada piso · «tañido» grave de cable · siseo de pistón
 *   6 · tifón    trueno y lluvia · «swoosh» doppler en cada vaivén · estruendo grave · calma con campanas
 *   7 · cierre   marimba y sitar en arpegio ascendente (jingle) con destello
 *
 * Uso:  node videos/2026-11-03-bola-660/componer-musica.mjs        → assets/musica/bola-660-psicodelica.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/bola-660-psicodelica.wav   (y --restaurar al terminar)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 44;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(8675309);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sua = (v, a, b) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const ex = (t, tau) => Math.exp(-t / tau);
const buf = () => new Float32Array(N);
const mus = buf(), pad = buf(), fx = buf(); // música (con eco y reverb), pad (con phaser) y efectos (secos)
const add = (b, t0, dur, fn) => { const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round((t0 + dur) * SR)); for (let i = i0; i < i1; i++) b[i] += fn((i - i0) / SR, i / SR); };
const hz = (n) => 293.66 * Math.pow(2, n / 12); // n = semitonos sobre re4

/* ───────── tiempos reales: inicio de cada escena y su ritmo (igual que el motor) ───────── */
const dur = [6.2, 6.1, 7.0, 6.2, 5.8, 7.1, 5.0];
const ideal = [5.75, 5.65, 6.55, 5.75, 5.35, 6.65, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const ES = ini; // inicio de cada escena
const BPM = 104, B = 60 / BPM, BAR = 4 * B;

/* ───────── instrumentos ───────── */
/** pulso de sitar: parciales con brillo nasal («jawari» = saturación), deslizamiento inicial `bend` semitonos y vibrato leve */
function sitar(t0, n, d = 1.2, g = 0.3, bend = 0, buzz = 2.4) {
  const f0 = hz(n); let ph = 0, ph2 = 0;
  add(mus, t0, d + 0.4, (t) => {
    const f = f0 * Math.pow(2, (bend * (1 - sua(t, 0, 0.14))) / 12) * (1 + 0.004 * Math.sin(TAU * 5.2 * t) * sua(t, 0.2, 0.5));
    ph += (TAU * f) / SR; ph2 += (TAU * f * 1.003) / SR;
    const env = Math.min(1, t / 0.002) * ex(t, 0.5 + d * 0.25);
    const s = Math.sin(ph) + 0.62 * Math.sin(2 * ph2) + 0.5 * Math.sin(3 * ph) + 0.36 * Math.sin(4 * ph2) * ex(t, 0.25) + 0.22 * Math.sin(7 * ph) * ex(t, 0.12);
    return g * env * Math.tanh(buzz * s * 0.55) * 0.9;
  });
  add(mus, t0, 0.03, (t) => g * 0.5 * (R() * 2 - 1) * ex(t, 0.006)); // clic de la púa
}
/** marimba: tono de madera con segundo parcial corto */
function marimba(b, t0, n, g = 0.3) {
  const f = hz(n);
  add(b, t0, 0.9, (t) => g * Math.min(1, t / 0.001) * (Math.sin(TAU * f * t) * ex(t, 0.28) + 0.35 * Math.sin(TAU * f * 3.99 * t) * ex(t, 0.05) + 0.1 * Math.sin(TAU * f * 9.2 * t) * ex(t, 0.02)));
}
/** cuerda de tanpura (drone) con zumbido */
function tanpura(t0, f, g = 0.2) {
  let ph = 0;
  add(mus, t0, 2.4, (t) => { ph += (TAU * f * (1 + 0.0008 * Math.sin(TAU * 0.4 * t))) / SR; const s = Math.sin(ph) + 0.7 * Math.sin(2 * ph) + 0.5 * Math.sin(3 * ph) + 0.4 * Math.sin(5 * ph) * (0.5 + 0.5 * Math.sin(TAU * 3 * t)); return g * Math.tanh(1.8 * s * 0.5) * Math.min(1, t / 0.02) * ex(t, 1.1); });
}
const bayan = (b, t0, g = 0.5) => add(b, t0, 0.5, (t) => g * Math.sin(TAU * (60 + 90 * ex(t, 0.045)) * t) * ex(t, 0.16) + 0.15 * g * (R() * 2 - 1) * ex(t, 0.008));
const dayan = (b, t0, g = 0.25, f = 520) => add(b, t0, 0.3, (t) => g * (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 2.1 * t)) * ex(t, 0.05) * Math.min(1, t / 0.0008));
const shaker = (b, t0, g = 0.07) => { let y = 0; add(b, t0, 0.12, (t) => { const w = R() * 2 - 1; const hp = w - y; y += 0.5 * (w - y); return g * hp * ex(t, 0.028); }); };
/** gong / campana de metal: parciales inarmónicos */
function gong(b, t0, f = 110, g = 0.5, tau = 2.4) {
  const r = [1, 1.47, 2.09, 2.46, 3.1, 4.2, 5.6];
  add(b, t0, tau * 2.2, (t) => g * Math.min(1, t / 0.003) * r.reduce((s, q, i) => s + Math.sin(TAU * f * q * t + i) * ex(t, tau / (1 + i * 0.5)) * (1 / (1 + i * 0.35)), 0) * (1 + 0.15 * Math.sin(TAU * 2.1 * t)));
}
const clang = (t0, f = 220, g = 0.4, tau = 0.45) => {
  add(fx, t0, tau * 4, (t) => g * ex(t, tau) * (Math.sin(TAU * f * t) + 0.55 * Math.sin(TAU * f * 2.76 * t) + 0.35 * Math.sin(TAU * f * 5.4 * t) + 0.2 * Math.sin(TAU * f * 8.93 * t)) * Math.min(1, t / 0.0015));
  add(fx, t0, 0.04, (t) => g * 0.7 * (R() * 2 - 1) * ex(t, 0.006));
};
/** ruido filtrado en un polo con corte f(g) (g = segundo absoluto) */
const ruido = (cor) => { let y = 0; return (g) => { const f = typeof cor === "function" ? cor(g) : cor; y += (1 - Math.exp((-TAU * f) / SR)) * ((R() * 2 - 1) - y); return y; }; };
const ruidoHP = (cor) => { let y = 0; return (g) => { const f = typeof cor === "function" ? cor(g) : cor; const w = R() * 2 - 1; y += (1 - Math.exp((-TAU * f) / SR)) * (w - y); return w - y; }; };

/* ───────── 1 · CAMA MUSICAL ───────── */
const A_PAD = [[-12, -5, 0, 2], [-11, -4, 1], [-12, -5, 0, 2], [-14, -7, -2, 4]]; // Dsus · Eb · Dsus · C (semitonos sobre re4)
const ventana = (g, a, b, r = 0.4) => sua(g, a, a + r) * (1 - sua(g, b - r, b));
// tanpura: Pa-Sa-Sa-Sa cada compás (A2 · D3 · D3 · D2)
for (let t = 0; t < DURACION - 1; t += BAR / 4) {
  const k = Math.round(t / (BAR / 4)) % 4, g = 0.2 * (t < ES[6] ? 1 : 0.7);
  tanpura(t, [hz(-19), hz(-12), hz(-12), hz(-24)][k], g);
}
// pad con phaser (se renderiza aparte y luego se le aplica el phaser)
for (let b = 0, t = 0; t < DURACION; b++, t += BAR) {
  const acorde = A_PAD[b % 4];
  const nivel = ventana(t, 0, ES[6] + 0.1, 0.3) * (t >= ES[4] && t < ES[5] ? 0.6 : 1);
  for (const n of acorde) {
    const f = hz(n); const fases = [0, 1.7, 3.1];
    add(pad, t, BAR + 0.5, (tt, g) => {
      const e = sua(tt, 0, 0.5) * (1 - sua(tt, BAR - 0.1, BAR + 0.5));
      let s = 0;
      for (let j = 0; j < 3; j++) { const ff = f * (1 + (j - 1) * 0.0045); for (let h = 1; h <= 5; h++) s += Math.sin(TAU * ff * h * tt + fases[j] * h) / (h * h * 0.7); }
      return 0.06 * nivel * e * s * (0.75 + 0.25 * Math.sin(TAU * 0.5 * g));
    });
  }
}
{ // phaser de 4 etapas, LFO lento
  let z = [0, 0, 0, 0], fb = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR, lfo = 0.5 + 0.5 * Math.sin(TAU * 0.16 * t);
    const fc = 260 + 2200 * lfo * lfo, k = Math.tan((Math.PI * fc) / SR), a = (k - 1) / (k + 1);
    let v = pad[i] + 0.38 * fb;
    for (let s = 0; s < 4; s++) { const y = a * v + z[s]; z[s] = v - a * y; v = y; }
    fb = v;
    mus[i] += 0.5 * (pad[i] + v);
  }
}
// bajo «wub» (sub con segundo armónico que se abre y se cierra a ritmo de corchea)
for (let b = 0, t = 0; t < DURACION; b++, t += BAR) {
  const act = ventana(t, ES[1], ES[6] - 0.1, 0.3) * (t >= ES[4] && t < ES[5] ? 0 : 1);
  if (act < 0.01) continue;
  for (let q = 0; q < 4; q++) {
    const n = [-24, -24, -23, -24][(q + b) % 4];
    const tq = t + q * B, f = hz(n);
    add(mus, tq, B * 0.95, (tt, g) => { const w = 0.5 + 0.5 * Math.sin(TAU * (BPM / 60) * 2 * g); return act * 0.3 * ex(tt, 0.4) * Math.min(1, tt / 0.004) * (Math.sin(TAU * f * tt) + 0.55 * w * Math.sin(TAU * 2 * f * tt)); });
  }
}
// percusión: tabla (bayan / dayan), shaker; entra en la escena 2, se aligera en la 5 y vuelve fuerte en la 6
for (let b = 0, t = 0; t < ES[6] - 0.05; b++, t += BAR) {
  const tipo = t < ES[1] ? 0 : t < ES[4] ? 2 : t < ES[5] ? 1 : 2;
  if (tipo === 0) continue;
  const fill = (b + 1) % 4 === 0;
  bayan(mus, t, 0.5); if (tipo === 2) { bayan(mus, t + 1.5 * B, 0.4); bayan(mus, t + 2.5 * B, 0.45); }
  if (tipo === 2) [0.5, 1, 2, 3, 3.5].forEach((p, i) => dayan(mus, t + p * B, 0.2, i % 2 ? 520 : 690));
  else dayan(mus, t + 2 * B, 0.16, 600);
  for (let s = 0; s < 8; s++) shaker(mus, t + (s * B) / 2, s % 2 ? 0.08 : 0.045);
  if (fill && tipo === 2) for (let s = 0; s < 6; s++) dayan(mus, t + 3 * B + (s * B) / 6, 0.16 + 0.02 * s, 480 + 60 * s);
}
// sitar: motivos y escalas por sección (semitonos sobre re4 en la frigia dominante)
const MOTIVO = [[0, 0, 2], [2, 1, 1, -1], [3, 4, 1], [4, 5, 1.5], [5.5, 4, 0.5], [6, 1, 1, 0], [7, 0, 1]];
for (let b = 0, t = 0; t < ES[6] - 0.5; b++, t += BAR) {
  if (t >= ES[4] && t < ES[5] - 0.3) { // escena 5: solo dos notas largas, muy espaciadas
    if (b % 2 === 0) sitar(t + 0.2, 7, 2.2, 0.26, 2); else sitar(t + 0.2, 4, 2.2, 0.22, 1);
    continue;
  }
  const modo = t < ES[1] ? (b % 2 ? 1 : 0) : t < ES[2] ? (b % 2 ? 2 : 0) : t < ES[3] ? 2 : t < ES[4] ? (b % 2 ? 2 : 0) : 2;
  if (modo === 0) for (const [p, n, d, bend] of MOTIVO) sitar(t + p * B, n, d * B * 1.5, 0.3, bend ?? 0);
  else if (modo === 1) { sitar(t, 7, 1.6, 0.28, -2); sitar(t + 2 * B, 5, 1.2, 0.26, 1); sitar(t + 3 * B, 4, 1.4, 0.26, 0); }
  else { // escala veloz en semicorcheas que sube y baja
    const esc = [0, 1, 4, 5, 7, 8, 10, 12, 10, 8, 7, 5, 4, 1, 0, 1];
    for (let s = 0; s < 16; s++) sitar(t + (s * B) / 2, esc[(s + b * 3) % esc.length] + (b % 4 === 3 ? 12 : 0), 0.5, 0.2, 0, 3);
  }
}
// eco en corchea con puntillo sobre toda la cama (psicodelia) y reverberación de pasillo
{
  const dl = Math.round(0.75 * B * SR), e = new Float32Array(dl); let p = 0, lp = 0;
  for (let i = 0; i < N; i++) { const o = e[p]; lp += 0.3 * (o - lp); e[p] = mus[i] + 0.46 * lp; mus[i] += 0.5 * o; p = (p + 1) % dl; }
  const retardos = [41.7, 59.3, 79.1, 103.9, 137.3, 181.1], y = buf();
  for (const ms of retardos) { const d = Math.round((ms * SR) / 1000), lin = new Float32Array(d); let q = 0, l2 = 0; for (let i = 0; i < N; i++) { const o = lin[q]; l2 += 0.32 * (o - l2); lin[q] = mus[i] + 0.8 * l2; y[i] += o; q = (q + 1) % d; } }
  for (let i = 0; i < N; i++) mus[i] += y[i] * 0.22;
}

/* ───────── 2 · SONIDOS DISTINTOS EN CADA PARTE (secos, con su propia mini-reverb al final) ───────── */
// ESCENA 1 · gancho
gong(fx, 0.02, 98, 0.55, 2.6);
add(fx, 0.02, 1.4, (t) => 0.6 * Math.sin(TAU * (84 - 48 * (1 - ex(t, 0.5))) * t) * ex(t, 0.55));                                   // caída grave del gong
for (let k = 0; k < 16; k++) { const tk = 0.1 + Math.pow(R(), 1.3) * 1.5, f = [1175, 1319, 1568, 1760, 2093, 2349][k % 6] * (R() > 0.7 ? 2 : 1); add(fx, tk, 0.9, (t) => 0.1 * Math.sin(TAU * f * t) * ex(t, 0.25) * Math.min(1, t / 0.001)); } // campanitas de cristal al armarse el edificio
{ const t0 = T(1, 1.7); add(fx, t0, 0.8, (t) => 0.5 * Math.sin(TAU * (900 * Math.pow(0.18, t * 2.2) + 120) * t + 3 * Math.sin(TAU * 24 * t)) * ex(t, 0.28) * Math.min(1, t / 0.003)); } // «boing» elástico de la lupa
{ const te = ES[1], d = 1.5; const n = ruidoHP((g) => 1200 + 7000 * Math.pow(clamp((g - (te - d)) / d), 2)); add(fx, te - d, d, (t, g) => 0.28 * n(g) * Math.pow(t / d, 2.2)); add(fx, te - 0.02, 0.2, (t) => 0.4 * (R() * 2 - 1) * ex(t, 0.02)); } // platillo invertido hacia la escena 2
// ESCENA 2 · viento
{
  const n1 = ruido((g) => 380 + 300 * Math.sin(TAU * 0.35 * g)), n2 = ruido((g) => 1400 + 800 * Math.sin(TAU * 0.6 * g + 1));
  add(fx, ES[1], dur[1] + 0.2, (t, g) => { const k = ventana(t, 0, dur[1], 0.4) * (0.5 + 0.5 * sua(g, T(2, 0.8), T(2, 3))); return k * (0.9 * n1(g) + 0.45 * n2(g)) * (0.6 + 0.4 * Math.sin(TAU * 0.5 * g)); });
  add(fx, T(2, 1.4), 2.2, (t) => 0.26 * Math.sin(TAU * (190 + 55 * Math.sin(TAU * 0.9 * t) + 9 * Math.sin(TAU * 11 * t)) * t) * Math.sin(Math.PI * clamp(t / 2.2)));      // crujido metálico de la torre que se mece
  const tb = T(2, 2.8);                                                                                                               // la bola va al revés: «whoomp» grave con filtro que se abre
  add(fx, tb, 1.2, (t) => 0.7 * Math.sin(TAU * (48 + 26 * ex(t, 0.2)) * t) * ex(t, 0.4) + 0.3 * Math.sin(TAU * 96 * t) * ex(t, 0.15) * (0.5 + 0.5 * Math.sin(TAU * 7 * t)));
  const te = ES[2], d = 1.2; let ph = 0;
  add(fx, te - d, d, (t) => { ph += (TAU * 300 * Math.pow(16, clamp(t / d))) / SR; return 0.2 * Math.sin(ph) * sua(t, 0, 0.3) * clamp(t / d); });                    // riser láser hacia la escena 3
}
// ESCENA 3 · discos soldados
{
  const t0 = T(3, 0.6), t1 = T(3, 5.2);
  add(fx, ES[2], t1 - ES[2] + 0.3, (t, g) => 0.1 * (Math.sin(TAU * 92 * t + 2 * Math.sin(TAU * 3 * t)) + 0.5 * Math.sin(TAU * 184 * t)) * ventana(g, ES[2], t1 + 0.2, 0.4) * (0.6 + 0.4 * sua(g, t0 - 0.3, t0))); // zumbido de la grúa
  const hs = ruidoHP(4500);
  add(fx, t0, t1 - t0, (t, g) => ventana(g, t0, t1, 0.2) * (0.05 * hs(g) + (R() > 0.985 ? 0.5 * (R() * 2 - 1) : 0))); // chisporroteo de soldadura
  for (let i = 0; i < 7; i++) clang(T(3, 0.6 + (i + 1) * 5 * 0.11), 180 * Math.pow(2, i / 7 * 1.2), 0.3, 0.3);                  // yunque: sube de tono cada 5 discos
  clang(t1, 130, 0.65, 0.7);                                                                                                  // «ka-chunk» del disco 41
  add(fx, t1, 0.5, (t) => 0.5 * Math.sin(TAU * 52 * t) * ex(t, 0.16));
  for (let k = 0; k < 7; k++) marimba(fx, t1 + 0.05 + k * 0.06, [12, 16, 19, 24, 28, 31, 36][k], 0.12);                      // destello de cierre
}
// ESCENA 4 · bola
{
  const t0 = ES[3], d = 1.8;
  add(fx, t0, d, (t, g) => { let s = 0; for (let h = 1; h <= 7; h++) s += Math.sin(TAU * 220 * h * (1 + 0.5 * clamp(t / d)) * t + h) / h; return 0.1 * s * sua(t, 0, 0.5) * (1 - sua(t, d - 0.5, d)); }); // armónicos de cristal que suben al armarse la esfera
  let ph = 0; const tz = T(4, 3.0);                                                                                           // «zip» de la cota
  add(fx, tz, 0.35, (t) => { ph += (TAU * (500 + 3500 * clamp(t / 0.3))) / SR; return 0.22 * Math.sin(ph) * (1 - sua(t, 0.25, 0.35)); });
  const th = T(4, 3.9); for (let k = 0; k < 2; k++) add(fx, th + k * 0.27, 0.4, (t) => 0.55 * Math.sin(TAU * (66 - 20 * t) * t) * ex(t, 0.1)); // latido grave del peso
  [24, 28, 31, 36, 40].forEach((n, k) => marimba(fx, T(4, 0.75) + k * 0.1, n, 0.1));                                          // destellos al abrir la lupa de 12,5 cm
  const te = ES[4], d2 = 1.0; const nn = ruido((g) => 120 + 2400 * Math.pow(clamp((g - (te - d2)) / d2), 2));
  add(fx, te - d2, d2, (t, g) => 0.7 * nn(g) * Math.pow(t / d2, 2));                                                         // rumor ascendente hacia la escena 5
}
// ESCENA 5 · cuelga (cabrestante, marimba por piso, tañido de cable y pistón)
{
  const tc = T(5, 0.8);
  let ph = 0; add(fx, tc, 1.6, (t) => { ph += (TAU * (62 + 8 * Math.sin(TAU * 5 * t))) / SR; return 0.35 * (Math.sin(ph) + 0.6 * Math.sin(2 * ph) + 0.4 * Math.sin(5 * ph)) * ex(t, 0.55) * Math.min(1, t / 0.002); }); // tañido grave del cable
  const hs = ruidoHP(3000);
  const pis = (t0) => add(fx, t0, 0.5, (t, g) => 0.3 * hs(g) * ex(t, 0.12) * Math.min(1, t / 0.01));                              // «psss» del pistón
  pis(T(5, 1.2)); pis(T(5, 3.3));
  [0, 1, 2, 3, 4, 5].forEach((i) => {
    const ti = T(5, 2.0 + (i * 1.9) / 6);
    for (let k = 0; k < 3; k++) add(fx, ti + k * 0.045, 0.03, (t) => 0.4 * (R() * 2 - 1) * ex(t, 0.005));                        // trinquete del cabrestante
    marimba(fx, ti, [-5, -4, -1, 0, 2, 3][i] + 12, 0.28);                                                                      // una nota por piso (re mi♭ fa♯ sol la si♭ …)
  });
  const te = ES[5], d = 1.2; let q = 0;
  for (let k = 0, tt = te - d; tt < te; k++) { add(fx, tt, 0.02, (t) => 0.35 * (R() * 2 - 1) * ex(t, 0.004)); tt += Math.max(0.03, 0.2 * Math.pow(0.8, k)); q++; }      // trinquete que se acelera hacia la escena 6
}
// ESCENA 6 · tifón
{
  const nl = ruido(180), nr = ruidoHP(5200);
  add(fx, ES[5], dur[5], (t, g) => 0.55 * nl(g) * ex(t, 1.8) * Math.min(1, t / 0.05) * (0.7 + 0.5 * Math.sin(TAU * 1.7 * g) * Math.sin(TAU * 0.6 * g)) + 0.05 * nr(g) * ventana(g, ES[5], ES[6], 0.5) * (1 - 0.6 * sua(g, T(6, 4.4), T(6, 5.6)))); // trueno que rueda + lluvia
  for (let k = 0; k < 4; k++) {                                                                                                // «swoosh» doppler en cada extremo del vaivén
    const tk = T(6, 0.8 + k * 1.15), dd = 0.7; const nn = ruido((g) => 500 + 3500 * Math.sin(Math.PI * clamp((g - tk) / dd)));
    add(fx, tk, dd, (t, g) => 0.7 * nn(g) * Math.sin(Math.PI * clamp(t / dd)) * (1 - 0.18 * k));
  }
  const tc = T(6, 3.0); add(fx, tc, 1.4, (t) => 0.75 * Math.sin(TAU * (44 + 20 * ex(t, 0.3)) * t) * ex(t, 0.5) + 0.25 * (R() * 2 - 1) * ex(t, 0.03));  // estruendo grave de la cota de 1 m
  const tb = T(6, 4.5); gong(fx, tb, 196, 0.22, 1.4);                                                                          // calma: campana suave cuando entran las barras
  [24, 28, 31].forEach((n, k) => marimba(fx, tb + 0.3 + k * 0.18, n, 0.16));
}
// ESCENA 7 · cierre (jingle de marimba y sitar con destello)
{
  const t0 = ES[6];
  [0, 4, 7, 12, 16, 19, 24].forEach((n, k) => { marimba(fx, t0 + 0.12 + k * 0.1, n + 12, 0.24); });
  sitar(t0 + 0.1, 0, 2.4, 0.3, 1); sitar(t0 + 0.8, 7, 2.2, 0.26, 0); sitar(t0 + 1.5, 12, 2.6, 0.26, -1);
  gong(fx, t0 + 0.05, 146.8, 0.3, 1.8);
  const hs = ruidoHP(7000); add(fx, t0 + 1.3, 1.2, (t, g) => 0.1 * hs(g) * ex(t, 0.4));
  for (let k = 0; k < 8; k++) marimba(fx, t0 + 1.7 + k * 0.07, 24 + k * 3, 0.08);
}

/* ───────── 3 · mezcla: música + efectos, limitador suave y fundidos ───────── */
const x = buf();
for (let i = 0; i < N; i++) x[i] = mus[i] * 0.85 + fx[i];
{ // mini-reverb de los efectos
  const y = buf();
  for (const ms of [29.3, 43.7, 61.1]) { const d = Math.round((ms * SR) / 1000), lin = new Float32Array(d); let q = 0, lp = 0; for (let i = 0; i < N; i++) { const o = lin[q]; lp += 0.4 * (o - lp); lin[q] = fx[i] + 0.7 * lp; y[i] += o; q = (q + 1) % d; } }
  for (let i = 0; i < N; i++) x[i] += y[i] * 0.16;
}
let pico = 0;
for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(x[i]));
const gl = 0.9 / Math.max(1e-4, pico);
for (let i = 0; i < N; i++) x[i] = Math.tanh(x[i] * gl * 1.25) * 0.9;
const fi = Math.round(0.04 * SR), fo = Math.round(1.2 * SR);
for (let i = 0; i < fi; i++) x[i] *= i / fi;
for (let i = 0; i < fo; i++) x[N - 1 - i] *= i / fo;
mkdirSync(join(RAIZ, "assets", "musica"), { recursive: true });
const salida = join(RAIZ, "assets", "musica", "bola-660-psicodelica.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s · ${BPM} bpm`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
