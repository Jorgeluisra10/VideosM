#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para el video sobre el paro cardíaco de un futbolista (65,4 s). Tono SOBRIO.
 * Pista de «música» del motor: colchón grave y suave + eventos clínicos alineados con lo que se ve (los tiempos usan el ritmo REAL de cada escena).
 *
 *   colchón           acorde muy suave en Re menor (Re–La–Fa) y ruido de sala; pasa a Re mayor en el homenaje final
 *   monitor cardíaco  pitido de 1 kHz en cada onda R a 75 lpm (escenas 1, 3, 4 y tras la descarga)
 *   golpe             golpe sordo (sin estridencia) en los impactos del esquema; el monitor se detiene en la ventana vulnerable
 *   fibrilación       zumbido grave irregular que crece (escenas 3–4)
 *   cerebro           tictac de reloj y tensión grave que sube sin dramatizar (escena 5)
 *   desfibrilador     tres pitidos de análisis, carga que sube de tono, descarga eléctrica y vuelta del latido (escena 6)
 *   reanimación       tono de llamada, metrónomo de 110 por minuto y pitidos del DEA (escena 7)
 *   homenaje          notas suaves de arpa y acorde abierto (escenas 8–9)
 *
 * Uso:  node videos/2026-11-03-futbolista-paro-cardiaco/componer-musica.mjs   → assets/musica/futbolista-paro-cardiaco.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/futbolista-paro-cardiaco.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 66;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const x = new Float32Array(N);
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(112112);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sua = (v, a, b) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const ex = (t, tau) => Math.exp(-t / tau);
const add = (t0, dur, fn) => { const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round((t0 + dur) * SR)); for (let i = i0; i < i1; i++) x[i] += fn((i - i0) / SR, i / SR); };
const osc = (fFn) => { let ph = 0; return (g) => { ph += (TAU * fFn(g)) / SR; return Math.sin(ph); }; };
const lp = (fc) => { let y = 0; const a = 1 - Math.exp(-TAU * fc / SR); return (w) => (y += a * (w - y)); };
const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);

/* ───────── tiempos reales ───────── */
const dur = [7.9, 6.5, 8.2, 6.5, 7.2, 8.9, 8.6, 6.9, 4.7];
const ideal = [7.4, 6.0, 7.7, 6.0, 6.7, 8.4, 8.1, 6.4, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TFUT en src/anim/piezas.ts
  gancho: { nombre: 0.6, ecg: 0.8, frase2: 3.8, frase3: 5.9, apaga: 6.0 },
  causa: { sello: 0.4, sale: 3.0, term: 3.1, gloss: 4.4 },
  ventana: { ecg: 0.3, banda: 1.0, golpe1: 2.48, golpe2: 4.448 },
  fibrilacion: { golpe: 1.4, rotulo: 2.6, sangre: 4.0 },
  cerebro: { reloj: 0.8, relojDur: 4.2, marca10s: 1.4, marca4min: 3.0, cae: 5.0 },
  descarga: { dea: 0.4, parches: 1.6, analiza: 2.6, carga: 3.6, cargaDur: 1.0, shock: 4.6, normal: 4.9, cifra: 5.8 },
  rcp: { paso1: 2.6, paso2: 4.2, paso3: 6.6, ritmo: 110 },
  cierre: { frase1: 0.3, frase2: 3.6, chip: 5.0 },
};

/* ───────── elementos ───────── */
const bip = (t0, f = 1000, g = 0.11) => add(t0, 0.09, (t) => g * Math.sin(TAU * f * t) * Math.sin(Math.PI * clamp(t / 0.09)));
const golpe = (t0, g = 0.45) => { add(t0, 0.6, (t) => g * Math.sin(TAU * (74 - 28 * t) * t) * ex(t, 0.13)); const f = lp(260); add(t0, 0.12, (t) => g * 0.8 * f(R() * 2 - 1) * 3 * ex(t, 0.03)); };
const arpa = (t0, n, g = 0.1) => { const f0 = hz(n); add(t0, 2.4, (t) => g * (Math.sin(TAU * f0 * t) + 0.3 * Math.sin(TAU * f0 * 2 * t) + 0.1 * Math.sin(TAU * f0 * 3 * t)) * ex(t, 0.7) * Math.min(1, t / 0.004)); };

/* 1 · COLCHÓN SUAVE (Re menor → Re mayor en el homenaje) y sala */
{
  const e8 = T(8, SC.cierre.frase2) - 0.3;
  const sala = lp(240);
  add(0, DURACION, (t, g) => {
    const env = sua(g, 0, 2.5) * (1 - sua(g, DURACION - 2.5, DURACION));
    const m = sua(g, e8, e8 + 1.5);
    const acorde = Math.sin(TAU * 73.42 * g) + 0.7 * Math.sin(TAU * 110 * g) + 0.5 * ((1 - m) * Math.sin(TAU * 174.61 * g) + m * Math.sin(TAU * 185 * g)) + 0.25 * Math.sin(TAU * 293.66 * g);
    return env * (0.045 * acorde * (0.85 + 0.15 * Math.sin(TAU * 0.16 * g)) + 0.5 * 0.03 * sala(R() * 2 - 1) * 4);
  });
}

/* 2 · ESCENA 1: monitor, nota inicial y golpe sordo al decir «paro cardíaco» */
{
  arpa(T(1, SC.gancho.nombre), 45, 0.1);                                                                  // nota grave inicial
  for (let g = T(1, SC.gancho.ecg) + 0.256; g < T(1, SC.gancho.apaga); g += 0.8) bip(g, 1000, 0.1);        // monitor 75 lpm
  golpe(T(1, SC.gancho.frase2), 0.32);
  arpa(T(1, SC.gancho.frase3), 50, 0.06);
}

/* 3 · ESCENA 2: sello, ticks de escritura y glosa */
{
  const ts = T(2, SC.causa.sello);
  golpe(ts, 0.4);
  add(ts + 0.02, 1.2, (t) => 0.08 * (Math.sin(TAU * 523 * t) + 0.5 * Math.sin(TAU * 1405 * t)) * ex(t, 0.35) * Math.min(1, t / 0.002));
  for (let k = 0; k < 15; k++) add(T(2, SC.causa.term) + k * 0.07, 0.03, (t) => 0.1 * Math.sin(TAU * 2000 * t) * ex(t, 0.006));
  arpa(T(2, SC.causa.gloss), 62, 0.08);
}

/* 4 · ESCENA 3: monitor, golpe fuera de la ventana, golpe en la ventana y fibrilación */
{
  const tp = SC.ventana.periodo ?? 0.8;
  for (let k = 0; ; k++) { const tn = k * 0.8 + 0.256; if (tn >= SC.ventana.golpe2 - 0.05) break; if (tn > SC.ventana.ecg) bip(T(3, tn), 1000, 0.1); }
  golpe(T(3, SC.ventana.golpe1), 0.3);                                                                     // fuera de la ventana: el monitor sigue
  const t2 = T(3, SC.ventana.golpe2);
  golpe(t2, 0.55);                                                                                         // dentro de la ventana
  const fvO = osc((g) => 90 + 30 * Math.sin(TAU * 7 * g) + 20 * Math.sin(TAU * 13.3 * g));
  const t3 = T(4, 0) ;
  add(t2 + 0.05, t3 - t2 + 6.4, (t, g) => 0.07 * fvO(g) * sua(t, 0, 0.3) * (0.6 + 0.4 * Math.sin(TAU * 9 * g)) * (1 - sua(g, T(4, 5.6), T(4, 6.5))));
}

/* 5 · ESCENA 4: latidos hasta el golpe y fibrilación */
{
  for (let k = 0; ; k++) { const tn = k * 0.8 + 0.256; if (tn >= SC.fibrilacion.golpe - 0.05) break; golpe(T(4, tn), 0.18); }
  golpe(T(4, SC.fibrilacion.golpe), 0.5);
  const f = osc((g) => 80 + 35 * Math.sin(TAU * 6.1 * g) + 25 * Math.sin(TAU * 11.7 * g));
  add(T(4, SC.fibrilacion.golpe), 5.1, (t, g) => 0.09 * f(g) * sua(t, 0, 0.2) * (0.55 + 0.45 * Math.sin(TAU * 8.3 * g + 1)));
  add(T(4, SC.fibrilacion.rotulo), 0.6, (t) => 0.1 * Math.sin(TAU * 880 * t) * ex(t, 0.25) * Math.min(1, t / 0.003));
}

/* 6 · ESCENA 5: tictac y tensión grave */
{
  const t0 = T(5, SC.cerebro.reloj), d = SC.cerebro.relojDur * rit[4];
  for (let g = t0, k = 0; g < t0 + d; k++) { const u = (g - t0) / d, rate = lerp(2.4, 7, u); add(g, 0.04, (t) => 0.12 * Math.sin(TAU * (k % 2 ? 1700 : 2200) * t) * ex(t, 0.008)); g += 1 / rate; }
  const o = osc((g) => 73.42 + 12 * sua(g, t0, T(5, SC.cerebro.cae)));
  add(t0, 6, (t, g) => 0.07 * o(g) * sua(t, 0, 0.8) * (1 - sua(g, T(5, SC.cerebro.cae), T(5, SC.cerebro.cae) + 1.5)));
  golpe(T(5, SC.cerebro.marca10s), 0.18); arpa(T(5, SC.cerebro.marca4min), 57, 0.07);
  golpe(T(5, SC.cerebro.cae), 0.3);
}

/* 7 · ESCENA 6: desfibrilador */
{
  const bipDea = (t0, f) => add(t0, 0.18, (t) => 0.13 * Math.sin(TAU * f * t) * Math.sin(Math.PI * clamp(t / 0.18)));
  [600, 800, 1000].forEach((f, i) => bipDea(T(6, SC.descarga.analiza) + i * 0.4, f));                       // análisis
  const tc = T(6, SC.descarga.carga), dc = SC.descarga.cargaDur * rit[5];
  const w = osc((g) => 300 + 2400 * Math.pow(clamp((g - tc) / dc), 1.6));
  add(tc, dc + 0.05, (t, g) => 0.1 * w(g) * sua(t, 0, 0.05) * (0.5 + 0.5 * clamp((g - tc) / dc)));         // carga que sube de tono
  const ts = T(6, SC.descarga.shock);
  for (let k = 0; k < 6; k++) bipDea(ts - 0.5 + k * 0.08, 1200);                                           // listo
  add(ts, 0.35, (t) => 0.5 * (R() * 2 - 1) * ex(t, 0.02) * Math.min(1, t / 0.001));                          // descarga eléctrica
  add(ts, 0.5, (t) => 0.5 * Math.sin(TAU * 58 * t) * ex(t, 0.12));
  add(ts, 0.3, (t) => 0.25 * Math.sin(TAU * (3200 - 2400 * t / 0.3) * t) * ex(t, 0.08));
  for (let g = T(6, SC.descarga.normal) + 0.4, k = 0; k < 6; k++, g += 0.8) bip(g, 1000, 0.11);             // vuelve el latido
  [[0, 69], [0.12, 73], [0.24, 76]].forEach(([d, n]) => arpa(T(6, SC.descarga.cifra) + d, n, 0.06));
}

/* 8 · ESCENA 7: llamada, metrónomo y DEA */
{
  const t0 = T(7, SC.rcp.paso1);
  for (let k = 0; k < 2; k++) add(t0 + k * 0.6, 0.4, (t) => 0.07 * (Math.sin(TAU * 440 * t) + Math.sin(TAU * 480 * t)) * Math.sin(Math.PI * clamp(t / 0.4)));  // tono de llamada
  const tm = T(7, SC.rcp.paso2);
  for (let g = tm, k = 0; g < T(8, 0) - 0.25; k++, g += 60 / SC.rcp.ritmo) add(g, 0.06, (t) => 0.2 * Math.sin(TAU * 1400 * t) * ex(t, 0.012));          // metrónomo
  [600, 800, 1000].forEach((f, i) => add(T(7, SC.rcp.paso3) + i * 0.3, 0.15, (t) => 0.08 * Math.sin(TAU * f * t) * Math.sin(Math.PI * clamp(t / 0.15))));
}

/* 9 · ESCENAS 8 y 9: homenaje */
{
  const t0 = T(8, SC.cierre.frase1);
  [[0, 62], [1.2, 66], [2.2, 69], [3.4, 74]].forEach(([d, n]) => arpa(t0 + d, n, 0.1));
  const ta = T(8, SC.cierre.frase2);
  [[0, 69], [0.2, 74], [0.4, 78], [0.6, 81]].forEach(([d, n]) => arpa(ta + d, n, 0.08));
  const tc = T(8, SC.cierre.chip);
  add(tc, 0.04, (t) => 0.06 * Math.sin(TAU * 2000 * t) * ex(t, 0.008));
  [[0, 74], [0.15, 78], [0.3, 81]].forEach(([d, n]) => arpa(T(9, 0.3) + d, n, 0.06));
}

/* 10 · reverb de sala y límite suave */
{
  const retardos = [33.1, 47.3, 67.9, 93.1, 123.7];
  const y = new Float32Array(N);
  for (const ms of retardos) { const dl = Math.round((ms * SR) / 1000), lin = new Float32Array(dl); let p = 0, l = 0; for (let i = 0; i < N; i++) { const o = lin[p]; l += 0.4 * (o - l); lin[p] = x[i] + 0.74 * l; y[i] += o; p = (p + 1) % dl; } }
  for (let i = 0; i < N; i++) x[i] += y[i] * 0.18;
}
let pico = 0;
for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(x[i]));
const gn = 0.9 / Math.max(1e-4, pico);
for (let i = 0; i < N; i++) x[i] = Math.tanh(x[i] * gn * 1.05) * 0.9;
const f = Math.round(0.03 * SR), fo = Math.round(1.5 * SR);
for (let i = 0; i < f; i++) x[i] *= i / f;
for (let i = 0; i < fo; i++) x[N - 1 - i] *= i / fo;
mkdirSync(join(RAIZ, "assets", "musica"), { recursive: true });
const salida = join(RAIZ, "assets", "musica", "futbolista-paro-cardiaco.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
