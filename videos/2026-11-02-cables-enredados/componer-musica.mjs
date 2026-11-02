#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «Por qué tus cables se enredan solos» (40,4 s).
 * Pista de «música» del motor: base juguetona + eventos físicos alineados con lo que se ve (los tiempos se calculan con el ritmo REAL de cada escena).
 *
 *   base juguetona        bajo y marimba en pentatónica de do mayor a 112 bpm, suave (los efectos del motor van encima)
 *   roce de cuerda        ruido filtrado en ráfagas mientras la cuerda se desordena (escena 1) y mientras gira la caja (escenas 2 y 4), una ráfaga por vuelta
 *   «cinch» del nudo      barrido agudo + golpecito cuando el nudo se cierra (escenas 1 y 6)
 *   palomitas             tres «ding» ascendentes al marcar largo, flexible y agitado (escena 6)
 *
 * Uso:  node videos/2026-11-02-cables-enredados/componer-musica.mjs   → assets/musica/cables-enredados.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/cables-enredados.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 40.4;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const x = new Float32Array(N);
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(3141);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ex = (t, tau) => Math.exp(-t / tau);
const add = (t0, dur, fn) => { const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round((t0 + dur) * SR)); for (let i = i0; i < i1; i++) x[i] += fn((i - i0) / SR, i / SR); };

/* tiempos reales: inicio de cada escena y su ritmo (el ideal de cada pieza, igual que el motor) */
const dur = [5.0, 6.8, 7.0, 5.0, 6.3, 6.5, 3.8];
const ideal = [4.55, 6.35, 6.7, 4.75, 5.85, 6.05, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TCAB en src/anim/piezas.ts
  gancho: { nudo: 2.0, nudoDur: 2.2 },
  caja: { gira: 0.9, giraDur: 5.0 },
  flexible: { gira: 0.8, giraDur: 3.6 },
  receta: { i1: 0.8, i2: 1.8, i3: 2.8, igual: 3.9 },
};

/* 1 · BASE JUGUETONA: bajo + marimba (pentatónica de do mayor), 112 bpm */
{
  const beat = 60 / 112, nota = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const bajo = [48, 48, 55, 52, 53, 53, 55, 50], mel = [72, 76, 79, 76, 74, 79, 76, 72, 74, 76, 79, 81, 79, 76, 74, 72];
  const r = prng(55);
  for (let b = 0; b * beat < DURACION; b++) {
    const t0 = b * beat, g = clamp(t0 / 1.5) * (1 - clamp((t0 - (DURACION - 1.2)) / 1.2));
    const nb = nota(bajo[Math.floor(b / 2) % bajo.length]);
    if (b % 2 === 0) add(t0, 0.45, (t) => 0.1 * g * Math.sin(TAU * nb * t) * ex(t, 0.2) * Math.min(1, t / 0.005));
    if (b % 2 === 1 || r() > 0.45) {
      const nm = nota(mel[b % mel.length]);
      add(t0 + (b % 2 ? beat / 2 : 0), 0.5, (t) => 0.06 * g * (Math.sin(TAU * nm * t) + 0.3 * Math.sin(TAU * nm * 4 * t) * ex(t, 0.05)) * ex(t, 0.16) * Math.min(1, t / 0.003));
    }
  }
}
/* 2 · ROCE DE CUERDA: ráfagas de ruido filtrado */
function roce(t0, dur, vueltas, fuerza) {
  for (let k = 0; k < vueltas; k++) {
    const tk = t0 + (dur * k) / vueltas, d = (dur / vueltas) * 0.8;
    let a = 0, b = 0;
    add(tk, d, (t) => { const w = R() * 2 - 1, f = 1400 + 1800 * Math.sin(Math.PI * t / d); a += (1 - Math.exp(-TAU * f / SR)) * (w - a); b += 0.08 * (a - b); const env = Math.sin(Math.PI * t / d) ** 1.5; return fuerza * (a - b) * 2.4 * env; });
  }
}
roce(T(1, SC.gancho.nudo), SC.gancho.nudoDur * rit[0], 5, 0.16);
roce(T(2, SC.caja.gira), SC.caja.giraDur * rit[1], 10, 0.17);
roce(T(4, SC.flexible.gira), SC.flexible.giraDur * rit[3], 8, 0.15);
/* 3 · «CINCH» del nudo: barrido agudo + golpecito */
function cinch(t0) {
  add(t0, 0.35, (t) => 0.2 * Math.sin(TAU * (500 * Math.pow(6, t / 0.3)) * t) * ex(t, 0.12) * Math.min(1, t / 0.004));
  add(t0 + 0.28, 0.3, (t) => 0.3 * Math.sin(TAU * (160 - 60 * t) * t) * ex(t, 0.07));
}
cinch(T(1, SC.gancho.nudo + SC.gancho.nudoDur));
cinch(T(6, SC.receta.igual));
/* 4 · PALOMITAS ascendentes */
[SC.receta.i1, SC.receta.i2, SC.receta.i3].forEach((ti, k) => {
  const f = 880 * Math.pow(2, [0, 4, 7][k] / 12), t0 = T(6, ti + 0.25);
  add(t0, 0.5, (t) => 0.13 * (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * f * 3 * t)) * ex(t, 0.13) * Math.min(1, t / 0.003));
});
/* 5 · CTA: arpegio final */
{
  const t0 = ini[6] + 0.1;
  [72, 76, 79, 84].forEach((m, k) => { const f = 440 * Math.pow(2, (m - 69) / 12); add(t0 + k * 0.16, 0.8, (t) => 0.1 * Math.sin(TAU * f * t) * ex(t, 0.3) * Math.min(1, t / 0.003)); });
}

let pico = 0;
for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(x[i]));
const g = 0.9 / Math.max(1e-4, pico);
for (let i = 0; i < N; i++) x[i] = Math.tanh(x[i] * g * 1.1) * 0.9;
const f = Math.round(0.03 * SR);
for (let i = 0; i < f; i++) { x[i] *= i / f; x[N - 1 - i] *= i / f; }
mkdirSync(join(RAIZ, "assets", "musica"), { recursive: true });
const salida = join(RAIZ, "assets", "musica", "cables-enredados.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
console.log(`   cinch ${T(1, SC.gancho.nudo + SC.gancho.nudoDur).toFixed(2)} s y ${T(6, SC.receta.igual).toFixed(2)} s · roce caja ${T(2, SC.caja.gira).toFixed(2)}–${(T(2, SC.caja.gira) + SC.caja.giraDur * rit[1]).toFixed(2)} s`);
