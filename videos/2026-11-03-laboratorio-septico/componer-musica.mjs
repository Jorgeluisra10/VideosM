#!/usr/bin/env node
/**
 * Música psicodélica + diseño sonoro propio (síntesis, sin muestras ni licencias) para «El laboratorio bacteriano bajo tu terreno» (81,5 s).
 * Cama musical distinta a la del video anterior: fa♯ frigia dominante, 96 bpm, arpegiador «burbujeante» con filtro que se abre y se cierra,
 * tanpura, sitar, pad con phaser, bajo «wub» y tabla, con ecos y reverberación. Se arma por secciones que siguen la historia:
 * inquietud (el pozo) → groove (las cámaras) → calma (la segunda cámara y la ventilación) → ascenso (grava y tierra) → pausa tensa (mantenimiento) → cierre.
 * Encima, sonidos DISTINTOS en cada escena, alineados con lo que se ve:
 *
 *   1 · gancho     caída al subsuelo (rumor con barrido) · crujido de tierra al cruzar los estratos · «ping» de sonar al revelar el laboratorio · burbujas
 *   2 · pozo       goteo · «glub» grave del agua sucia · hilo de agua que se filtra · bocina que se desinfla con el olor · alarma al llegar a la napa · «dun» grave
 *   3 · idea       golpes de hormigón al armarse las paredes · raspado de llana · tres campanas de marimba (etapas 1, 2 y 3)
 *   4 · decanta    «plop» descendente de lo que se hunde · «bloop» ascendente de la grasa · remolino que se asienta
 *   5 · bacterias  chillidos de bacterias · mordiscos · burbujas de gas que suben · «pfff» de la ventilación
 *   6 · cámara 2   agua que pasa por la abertura · campanitas suaves al asentarse
 *   7 · olores     «gloc» de la trampa de agua · silbido del viento en el tubo de ventilación
 *   8 · grava      lluvia de piedras y traqueteo · goteo del tubo perforado · chillidos agudos de las bacterias aerobias
 *   9 · suelo      gotas que bajan y bajan de tono · «ping» de sonar en la napa · acorde brillante y campana del pozo limpio
 *   10 · mant.     motor del camión · aspiración · dos zumbidos de «prohibido»
 *   11 · lote      martillazo del letrero · tres «tics» de la lista · destello final
 *   12 · cierre    marimba y sitar en arpegio ascendente
 *
 * Uso:  node videos/2026-11-03-laboratorio-septico/componer-musica.mjs   → assets/musica/laboratorio-septico-psicodelica.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/laboratorio-septico-psicodelica.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 82;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(424242);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sua = (v, a, b) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const ex = (t, tau) => Math.exp(-t / tau);
const buf = () => new Float32Array(N);
const mus = buf(), pad = buf(), fx = buf();
const add = (b, t0, dur, fn) => { const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round((t0 + dur) * SR)); for (let i = i0; i < i1; i++) b[i] += fn((i - i0) / SR, i / SR); };
const hz = (n) => 369.99 * Math.pow(2, n / 12); // n = semitonos sobre fa♯4

/* ───────── tiempos reales de las escenas ───────── */
const dur = [5.6, 9.0, 5.9, 8.3, 7.9, 5.9, 5.9, 5.9, 6.6, 7.9, 7.6, 5.0];
const ES = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const T = (n, t) => ES[n - 1] + t; // los ritmos son 1 en todas las piezas
const BPM = 96, B = 60 / BPM, BAR = 4 * B;

/* ───────── instrumentos ───────── */
function sitar(t0, n, d = 1.2, g = 0.3, bend = 0, buzz = 2.4) {
  const f0 = hz(n); let ph = 0, ph2 = 0;
  add(mus, t0, d + 0.4, (t) => {
    const f = f0 * Math.pow(2, (bend * (1 - sua(t, 0, 0.14))) / 12) * (1 + 0.004 * Math.sin(TAU * 5.2 * t) * sua(t, 0.2, 0.5));
    ph += (TAU * f) / SR; ph2 += (TAU * f * 1.003) / SR;
    const s = Math.sin(ph) + 0.62 * Math.sin(2 * ph2) + 0.5 * Math.sin(3 * ph) + 0.36 * Math.sin(4 * ph2) * ex(t, 0.25) + 0.22 * Math.sin(7 * ph) * ex(t, 0.12);
    return g * Math.min(1, t / 0.002) * ex(t, 0.5 + d * 0.25) * Math.tanh(buzz * s * 0.55) * 0.9;
  });
  add(mus, t0, 0.03, (t) => g * 0.5 * (R() * 2 - 1) * ex(t, 0.006));
}
function marimba(b, t0, n, g = 0.3) {
  const f = hz(n);
  add(b, t0, 0.9, (t) => g * Math.min(1, t / 0.001) * (Math.sin(TAU * f * t) * ex(t, 0.28) + 0.35 * Math.sin(TAU * f * 3.99 * t) * ex(t, 0.05) + 0.1 * Math.sin(TAU * f * 9.2 * t) * ex(t, 0.02)));
}
function tanpura(t0, f, g = 0.2) {
  let ph = 0;
  add(mus, t0, 2.6, (t) => { ph += (TAU * f * (1 + 0.0008 * Math.sin(TAU * 0.4 * t))) / SR; const s = Math.sin(ph) + 0.7 * Math.sin(2 * ph) + 0.5 * Math.sin(3 * ph) + 0.4 * Math.sin(5 * ph) * (0.5 + 0.5 * Math.sin(TAU * 3 * t)); return g * Math.tanh(1.8 * s * 0.5) * Math.min(1, t / 0.02) * ex(t, 1.2); });
}
/** arpegiador burbujeante: diente de sierra con filtro que se abre y decae */
function burbuja(t0, n, d, g, brillo = 2600) {
  const f = hz(n); let ph = 0;
  add(mus, t0, d + 0.1, (t, gl) => {
    ph += (TAU * f) / SR;
    const c = (brillo * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(TAU * 0.11 * gl))) ) * (0.25 + 0.75 * ex(t, 0.09));
    let s = 0; for (let h = 1; h <= 12; h++) s += (Math.sin(h * ph) / h) * Math.max(0, 1 - (h * f) / c);
    return g * s * Math.min(1, t / 0.003) * ex(t, d * 0.55);
  });
}
const bayan = (b, t0, g = 0.5) => add(b, t0, 0.5, (t) => g * Math.sin(TAU * (58 + 90 * ex(t, 0.045)) * t) * ex(t, 0.16) + 0.15 * g * (R() * 2 - 1) * ex(t, 0.008));
const dayan = (b, t0, g = 0.25, f = 520) => add(b, t0, 0.3, (t) => g * (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 2.1 * t)) * ex(t, 0.05) * Math.min(1, t / 0.0008));
const shaker = (b, t0, g = 0.07) => { let y = 0; add(b, t0, 0.12, (t) => { const w = R() * 2 - 1; const hp = w - y; y += 0.5 * (w - y); return g * hp * ex(t, 0.028); }); };
function gong(b, t0, f = 110, g = 0.5, tau = 2.4) {
  const r = [1, 1.47, 2.09, 2.46, 3.1, 4.2, 5.6];
  add(b, t0, tau * 2.2, (t) => g * Math.min(1, t / 0.003) * r.reduce((s, q, i) => s + Math.sin(TAU * f * q * t + i) * ex(t, tau / (1 + i * 0.5)) * (1 / (1 + i * 0.35)), 0) * (1 + 0.15 * Math.sin(TAU * 2.1 * t)));
}
/** efectos sueltos */
const bloop = (t0, f0, f1, g = 0.3, d = 0.14) => { let ph = 0; add(fx, t0, d + 0.05, (t) => { const k = clamp(t / d); ph += (TAU * lerp(f0, f1, k * k)) / SR; return g * Math.sin(ph) * Math.min(1, t / 0.002) * ex(t, d * 0.7); }); };
const chirp = (t0, f = 1800, g = 0.2) => { let ph = 0; add(fx, t0, 0.14, (t) => { ph += (TAU * (f * (1 + 0.5 * Math.sin(TAU * 38 * t)) * (1 + 0.6 * ex(t, 0.03)))) / SR; return g * Math.sin(ph) * ex(t, 0.05) * Math.min(1, t / 0.002); }); };
const crunch = (t0, g = 0.3, d = 0.06, hp = 1500) => { let y = 0; add(fx, t0, d + 0.02, (t) => { const w = R() * 2 - 1; y += (1 - Math.exp(-TAU * hp / SR)) * (w - y); return g * (w - y) * ex(t, d * 0.45); }); };
const thud = (t0, f = 70, g = 0.5) => add(fx, t0, 0.6, (t) => g * Math.sin(TAU * (f + 40 * ex(t, 0.04)) * t) * ex(t, 0.15) + g * 0.25 * (R() * 2 - 1) * ex(t, 0.01));
const ruidoLP = (cor) => { let y = 0; return (g) => { const f = typeof cor === "function" ? cor(g) : cor; y += (1 - Math.exp((-TAU * f) / SR)) * ((R() * 2 - 1) - y); return y; }; };
const ruidoHP = (cor) => { let y = 0; return (g) => { const f = typeof cor === "function" ? cor(g) : cor; const w = R() * 2 - 1; y += (1 - Math.exp((-TAU * f) / SR)) * (w - y); return w - y; }; };
const ping = (t0, f = 1560, g = 0.25) => add(fx, t0, 1.8, (t) => g * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2.01 * t)) * ex(t, 0.6) * Math.min(1, t / 0.002));
const ventana = (g, a, b, r = 0.4) => sua(g, a, a + r) * (1 - sua(g, b - r, b));

/* ───────── 1 · CAMA MUSICAL ───────── */
const SEC = { // inicio y fin de cada sección (s)
  intro: [0, ES[1]], pozo: [ES[1], ES[2]], idea: [ES[2], ES[3]], groove: [ES[3], ES[5]], calma: [ES[5], ES[7]], asc: [ES[7], ES[9]], pausa: [ES[9], ES[10]], vuelve: [ES[10], ES[11]], cierre: [ES[11], DURACION],
};
const dentro = (t, s) => t >= SEC[s][0] - 1e-6 && t < SEC[s][1] - 1e-6;
// tanpura
for (let t = 0; t < DURACION - 1; t += BAR / 4) {
  const k = Math.round(t / (BAR / 4)) % 4;
  tanpura(t, [hz(-19), hz(-12), hz(-12), hz(-24)][k], dentro(t, "pausa") ? 0.26 : 0.19);
}
// pad con phaser: Fa♯ sus · Sol (frigio) · Fa♯ sus · Mi; en el ascenso sube a un acorde abierto y luminoso
const ACORDES = [[-12, -5, 0, 2], [-11, -4, 1, 3], [-12, -5, 0, 2], [-14, -7, -2, 2]];
const ACORDE_LIMPIO = [-12, -5, 0, 4, 7];
for (let b = 0, t = 0; t < DURACION; b++, t += BAR) {
  const luminoso = t >= ES[8] - 0.1 && t < ES[9] + 0.1 || t >= ES[10];
  const acorde = luminoso ? ACORDE_LIMPIO : dentro(t, "pozo") ? [-12, -11, -5, 1] : ACORDES[b % 4];
  const nivel = dentro(t, "pausa") ? 0.5 : 1;
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
{ let z = [0, 0, 0, 0], fb = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR, lfo = 0.5 + 0.5 * Math.sin(TAU * 0.14 * t);
    const fc = 260 + 2200 * lfo * lfo, k = Math.tan((Math.PI * fc) / SR), a = (k - 1) / (k + 1);
    let v = pad[i] + 0.38 * fb;
    for (let s = 0; s < 4; s++) { const y = a * v + z[s]; z[s] = v - a * y; v = y; }
    fb = v; mus[i] += 0.5 * (pad[i] + v);
  } }
// bajo «wub» (desde las cámaras hasta el cierre, menos en la pausa)
for (let b = 0, t = ES[2]; t < ES[11] + 6; b++, t += BAR) {
  const ok = !dentro(t, "pausa") && !dentro(t, "calma") && t < DURACION - 3;
  if (!ok) continue;
  for (let q = 0; q < 4; q++) {
    const n = [-24, -24, -23, -24][(q + b) % 4], tq = t + q * B, f = hz(n);
    add(mus, tq, B * 0.95, (tt, g) => { const w = 0.5 + 0.5 * Math.sin(TAU * (BPM / 60) * 2 * g); return 0.28 * ex(tt, 0.4) * Math.min(1, tt / 0.004) * (Math.sin(TAU * f * tt) + 0.55 * w * Math.sin(TAU * 2 * f * tt)); });
  }
}
// «latido» del pozo (escena 2): dos golpes graves por compás
for (let t = ES[1]; t < ES[2] - 0.5; t += BAR) { bayan(mus, t, 0.45); bayan(mus, t + 0.35 * B, 0.3); bayan(mus, t + 2 * B, 0.4); }
// percusión de tabla: desde la idea hasta el cierre, más ligera en la calma y la pausa
for (let b = 0, t = ES[2]; t < ES[11] + 0.5; b++, t += BAR) {
  const ligera = dentro(t, "calma") || dentro(t, "pausa");
  const fill = (b + 1) % 4 === 0;
  bayan(mus, t, 0.5); if (!ligera) { bayan(mus, t + 1.5 * B, 0.4); bayan(mus, t + 2.5 * B, 0.45); }
  if (!ligera) [0.5, 1, 2, 3, 3.5].forEach((p, i) => dayan(mus, t + p * B, 0.2, i % 2 ? 520 : 690)); else dayan(mus, t + 2 * B, 0.15, 600);
  for (let s = 0; s < 8; s++) shaker(mus, t + (s * B) / 2, s % 2 ? 0.08 : 0.045);
  if (fill && !ligera) for (let s = 0; s < 6; s++) dayan(mus, t + 3 * B + (s * B) / 6, 0.16 + 0.02 * s, 480 + 60 * s);
}
// arpegiador burbujeante en semicorcheas (Hijaz sobre fa♯): entra en la idea, se oscurece en la calma, brilla en el ascenso y calla en la pausa
{
  const ESC = [0, 1, 4, 5, 7, 8, 10, 12, 10, 8, 7, 5, 4, 1, 0, -2];
  for (let t = ES[2] + 3.0, s = 0; t < ES[11] + 4; t += B / 4, s++) {
    if (dentro(t, "pausa")) continue;
    const calma = dentro(t, "calma"), asc = dentro(t, "asc"), fin = t >= ES[11];
    if (calma && s % 2) continue;
    const n = ESC[(s * (asc ? 3 : 1) + Math.floor(s / 16) * 2) % ESC.length] + (asc || fin ? 12 : 0);
    burbuja(t, n - 12, B * 0.5, calma ? 0.07 : 0.13, calma ? 1500 : asc ? 3600 : 2600);
  }
}
// sitar: motivos por sección
const MOTIVO = [[0, 0, 2], [2, 1, 1, -1], [3, 4, 1], [4, 5, 1.5], [5.5, 4, 0.5], [6, 1, 1, 0], [7, 0, 1]];
for (let b = 0, t = 0; t < ES[11] - 0.5; b++, t += BAR) {
  if (dentro(t, "pozo")) { if (b % 2 === 0) sitar(t + 0.4, 1, 2.4, 0.22, -1, 3); else sitar(t + 0.2, 0, 2.2, 0.2, 0, 3); continue; }
  if (dentro(t, "pausa")) { sitar(t + 0.3, 7, 2.2, 0.2, 2); continue; }
  if (dentro(t, "calma")) { if (b % 2 === 0) { sitar(t, 7, 1.6, 0.24, -2); sitar(t + 2 * B, 5, 1.2, 0.22, 1); } continue; }
  if (dentro(t, "intro") || dentro(t, "idea") || b % 3 === 0) for (const [p, n, d, bend] of MOTIVO) sitar(t + p * B, n, d * B * 1.5, 0.28, bend ?? 0);
  else { sitar(t, 7, 1.6, 0.26, -2); sitar(t + 2 * B, 5, 1.2, 0.24, 1); sitar(t + 3 * B, 4, 1.4, 0.24, 0); }
}
// eco en corchea con puntillo y reverberación de pasillo
{
  const dl = Math.round(0.75 * B * SR), e = new Float32Array(dl); let p = 0, lp = 0;
  for (let i = 0; i < N; i++) { const o = e[p]; lp += 0.3 * (o - lp); e[p] = mus[i] + 0.46 * lp; mus[i] += 0.5 * o; p = (p + 1) % dl; }
  const y = buf();
  for (const ms of [41.7, 59.3, 79.1, 103.9, 137.3, 181.1]) { const d = Math.round((ms * SR) / 1000), lin = new Float32Array(d); let q = 0, l2 = 0; for (let i = 0; i < N; i++) { const o = lin[q]; l2 += 0.32 * (o - l2); lin[q] = mus[i] + 0.8 * l2; y[i] += o; q = (q + 1) % d; } }
  for (let i = 0; i < N; i++) mus[i] += y[i] * 0.22;
}

/* ───────── 2 · SONIDOS DISTINTOS EN CADA ESCENA ───────── */
// ESCENA 1 · gancho: caída al subsuelo
{
  const nr = ruidoLP((g) => 900 * Math.pow(0.12, clamp(g / 4.5)) + 80);
  add(fx, 0.2, 4.8, (t, g) => 0.7 * nr(g) * sua(t, 0, 0.3) * (1 - sua(t, 3.8, 4.8)));                                           // rumor que baja
  add(fx, 0.3, 4.4, (t) => 0.4 * Math.sin(TAU * (160 * Math.pow(0.25, t / 4.4)) * t) * sua(t, 0, 0.5) * (1 - sua(t, 3.6, 4.4))); // sub que cae
  for (let k = 0; k < 18; k++) crunch(1.1 + k * 0.17 + R() * 0.05, 0.28, 0.05, 1200 + R() * 2200);                                  // crujido de tierra al cruzar los estratos
  ping(T(1, 2.2), 1480, 0.3); ping(T(1, 2.2) + 0.12, 2217, 0.12);                                                                 // sonar al revelar el laboratorio
  for (let k = 0; k < 7; k++) bloop(T(1, 3.8) + k * 0.13, 380 + R() * 500, 1200 + R() * 900, 0.2, 0.09);                          // burbujas
}
// ESCENA 2 · pozo
{
  for (let k = 0; k < 5; k++) bloop(T(2, 0.4 + k * 0.7), 900, 280, 0.28, 0.12);                                                    // goteo
  bloop(T(2, 1.9), 150, 70, 0.55, 0.3); bloop(T(2, 2.0), 110, 55, 0.35, 0.3);                                                     // «glub» grave
  { const n = ruidoHP((g) => 1800 + 1400 * Math.sin(g * 6)); add(fx, T(2, 3.8), 4.2, (t, g) => 0.14 * n(g) * (0.6 + 0.4 * Math.sin(TAU * 7 * g)) * ventana(t, 0, 4.2, 0.5)); } // hilo de agua que se filtra
  { let ph = 0; add(fx, T(2, 0.9), 2.4, (t) => { ph += (TAU * (190 * Math.pow(0.55, t / 2.4) + 3 * Math.sin(TAU * 6 * t))) / SR; return 0.24 * (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.4 * Math.sin(3 * ph)) * ventana(t, 0, 2.4, 0.3); }); } // bocina que se desinfla: olor
  { let ph = 0; for (let k = 0; k < 4; k++) { const t0 = T(2, 6.4) + k * 0.28; add(fx, t0, 0.2, (t) => { ph += (TAU * (880 + (k % 2) * 220)) / SR; return 0.16 * Math.sin(ph) * (1 - sua(t, 0.14, 0.2)); }); } } // alarma al llegar a la napa
  thud(T(2, 7.9), 52, 0.6);                                                                                                       // «dun» del pozo contaminado
}
// ESCENA 3 · idea
{
  for (let k = 0; k < 14; k++) { const tk = T(3, 0.5 + (k * 3.0) / 14); thud(tk, 90 + R() * 80, 0.28); crunch(tk, 0.12, 0.05, 900); }  // golpes de hormigón
  { const n = ruidoHP(2600); add(fx, T(3, 0.8), 2.6, (t, g) => 0.1 * n(g) * (0.5 + 0.5 * Math.sin(TAU * 2.2 * t)) * ventana(t, 0, 2.6, 0.4)); } // raspado de llana
  [0, 4, 7].forEach((n, k) => marimba(fx, T(3, 2.0 + k * 1.0), n + 12, 0.34));                                                    // campanas de las etapas 1, 2 y 3
}
// ESCENA 4 · decantación
{
  for (let k = 0; k < 8; k++) bloop(T(4, 1.2 + k * 0.4), 700, 180, 0.2, 0.18);                                                    // lo pesado se hunde: «plop» que baja
  for (let k = 0; k < 6; k++) bloop(T(4, 3.2 + k * 0.35), 300, 1100, 0.18, 0.18);                                                 // la grasa flota: «bloop» que sube
  { const n = ruidoLP(500); add(fx, T(4, 1.0), 4.8, (t, g) => 0.5 * n(g) * (1 - sua(t, 1.5, 4.8)) * sua(t, 0, 0.6)); }              // remolino que se asienta
  marimba(fx, T(4, 5.6), 16, 0.3); marimba(fx, T(4, 5.75), 19, 0.26);
}
// ESCENA 5 · bacterias
{
  for (let k = 0; k < 22; k++) chirp(T(5, 0.8 + k * 0.28 + R() * 0.1), 1500 + R() * 1600, 0.16);                                      // chillidos de bacterias
  for (let k = 0; k < 16; k++) crunch(T(5, 3.6 + k * 0.22), 0.3, 0.05, 700);                                                       // mordiscos
  for (let k = 0; k < 14; k++) bloop(T(5, 4.4 + k * 0.17), 250 + R() * 200, 800 + R() * 600, 0.16, 0.1);                           // burbujas de gas
  { const n = ruidoHP(3800); add(fx, T(5, 5.8), 1.4, (t, g) => 0.35 * n(g) * ex(t, 0.4) * Math.min(1, t / 0.01)); }               // «pfff» de la ventilación
}
// ESCENA 6 · cámara 2
{
  { const n = ruidoHP((g) => 1500 + 800 * Math.sin(g * 4)); add(fx, T(6, 0.8), 3.2, (t, g) => 0.16 * n(g) * ventana(t, 0, 3.2, 0.5)); } // agua por la abertura
  [4, 7, 11, 16].forEach((n, k) => marimba(fx, T(6, 3.5 + k * 0.17), n + 12, 0.18));                                               // campanitas suaves
}
// ESCENA 7 · olores
{
  bloop(T(7, 0.4), 500, 180, 0.5, 0.2); bloop(T(7, 0.52), 360, 140, 0.4, 0.22);                                                   // «gloc» de la trampa
  { let ph = 0; add(fx, T(7, 2.4), 3.2, (t) => { ph += (TAU * (880 + 220 * Math.sin(TAU * 0.7 * t) + 40 * Math.sin(TAU * 5 * t))) / SR; return 0.12 * Math.sin(ph) * ventana(t, 0, 3.2, 0.6); }); } // silbido en el tubo de ventilación
  { const n = ruidoHP(4200); add(fx, T(7, 2.5), 1.0, (t, g) => 0.25 * n(g) * ex(t, 0.3)); }
  marimba(fx, T(7, 3.4), 23, 0.26);
}
// ESCENA 8 · grava
{
  for (let k = 0; k < 40; k++) { const tk = T(8, 0.5 + (k * 2.3) / 40 + R() * 0.03); crunch(tk, 0.34, 0.07, 800 + R() * 2400); if (k % 4 === 0) thud(tk, 150 + R() * 100, 0.12); }   // lluvia de piedras y traqueteo
  for (let k = 0; k < 10; k++) bloop(T(8, 2.8 + k * 0.28), 1200 + R() * 500, 600, 0.14, 0.08);                                      // goteo del tubo perforado
  for (let k = 0; k < 12; k++) chirp(T(8, 3.8 + k * 0.17 + R() * 0.05), 2600 + R() * 1800, 0.12);                                    // aerobias: chillidos agudos
}
// ESCENA 9 · suelo
{
  for (let k = 0; k < 16; k++) { const f = 1900 * Math.pow(0.78, k * 0.6); bloop(T(9, 0.5 + k * 0.17), f * 1.1, f * 0.9, 0.18, 0.07); }  // gotas que bajan y bajan de tono
  ping(T(9, 3.4), 1180, 0.3);                                                                                                       // sonar en la napa
  [0, 4, 7, 12, 16].forEach((n, k) => marimba(fx, T(9, 4.6 + k * 0.08), n + 12, 0.2));                                              // acorde brillante: agua limpia
  gong(fx, T(9, 5.0), 523, 0.16, 1.6);                                                                                              // campana del pozo limpio
}
// ESCENA 10 · mantenimiento
{
  { let ph = 0; add(fx, T(10, 0.3), 6.0, (t, g) => { ph += (TAU * (46 + 6 * Math.sin(TAU * 11 * t))) / SR; return 0.34 * (Math.sin(ph) + 0.6 * Math.sin(2 * ph) + 0.3 * Math.sin(3 * ph)) * (0.7 + 0.3 * Math.sin(TAU * 9 * t)) * ventana(t, 0, 6.0, 0.5); }); } // motor del camión
  { const n = ruidoLP((g) => 300 + 2200 * sua(g, T(10, 2.2), T(10, 3.6))); add(fx, T(10, 2.2), 2.8, (t, g) => 0.55 * n(g) * ventana(t, 0, 2.8, 0.4)); } // aspiración
  for (let k = 0; k < 2; k++) { const t0 = T(10, 5.4) + k * 0.36; let ph = 0; add(fx, t0, 0.3, (t) => { ph += (TAU * (118 + 4 * Math.sin(TAU * 30 * t))) / SR; return 0.3 * Math.sign(Math.sin(ph)) * (1 - sua(t, 0.22, 0.3)) * 0.6; }); } // zumbido de «prohibido»
}
// ESCENA 11 · lote
{
  { const t0 = T(11, 0.4); thud(t0, 160, 0.4); marimba(fx, t0 + 0.02, 24, 0.22); }                                                // martillazo del letrero
  [3.4, 4.4, 5.4].forEach((t, k) => { add(fx, T(11, t), 0.2, (tt) => 0.24 * Math.sin(TAU * [1318, 1568, 1976][k] * tt) * ex(tt, 0.05) * Math.min(1, tt / 0.001)); }); // tic de la lista
  for (let k = 0; k < 8; k++) marimba(fx, T(11, 5.9 + k * 0.07), 12 + k * 3, 0.12);                                                  // destello final
}
// ESCENA 12 · cierre
{
  const t0 = ES[11];
  [0, 4, 7, 12, 16, 19, 24].forEach((n, k) => marimba(fx, t0 + 0.12 + k * 0.1, n + 12, 0.24));
  sitar(t0 + 0.1, 0, 2.4, 0.3, 1); sitar(t0 + 0.8, 7, 2.2, 0.26, 0); sitar(t0 + 1.5, 12, 2.6, 0.26, -1);
  gong(fx, t0 + 0.05, 185, 0.3, 1.8);
  const hs = ruidoHP(7000); add(fx, t0 + 1.3, 1.2, (t, g) => 0.1 * hs(g) * ex(t, 0.4));
  for (let k = 0; k < 8; k++) marimba(fx, t0 + 1.7 + k * 0.07, 24 + k * 3, 0.08);
}

/* ───────── 3 · mezcla ───────── */
const x = buf();
for (let i = 0; i < N; i++) x[i] = mus[i] * 0.85 + fx[i];
{ const y = buf();
  for (const ms of [29.3, 43.7, 61.1]) { const d = Math.round((ms * SR) / 1000), lin = new Float32Array(d); let q = 0, lp = 0; for (let i = 0; i < N; i++) { const o = lin[q]; lp += 0.4 * (o - lp); lin[q] = fx[i] + 0.7 * lp; y[i] += o; q = (q + 1) % d; } }
  for (let i = 0; i < N; i++) x[i] += y[i] * 0.16; }
let pico = 0;
for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(x[i]));
const gl = 0.9 / Math.max(1e-4, pico);
for (let i = 0; i < N; i++) x[i] = Math.tanh(x[i] * gl * 1.25) * 0.9;
const fi = Math.round(0.04 * SR), fo = Math.round(1.2 * SR);
for (let i = 0; i < fi; i++) x[i] *= i / fi;
for (let i = 0; i < fo; i++) x[N - 1 - i] *= i / fo;
mkdirSync(join(RAIZ, "assets", "musica"), { recursive: true });
const salida = join(RAIZ, "assets", "musica", "laboratorio-septico-psicodelica.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s · ${BPM} bpm`);
console.log("   escenas (inicio):", ES.map((a, i) => `${i + 1}:${a.toFixed(1)}s`).join("  "));
