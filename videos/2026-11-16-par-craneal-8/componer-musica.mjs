#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «El par craneal VIII: el nervio que oye y equilibra» (67,8 s).
 * Tono: asombro (un átomo, quince mil células) con aviso rápido de «síguenos» al inicio, cotidiano en el equilibrio y cierre curioso.
 * Pista de «música» del motor: colchón armónico + eventos alineados con lo que se ve (los tiempos usan el ritmo REAL de cada escena).
 *
 *   colchón   acordes Do → Sol → Mi menor → Fa → Re menor → La menor sobrio (el ruido) → Do → Mi menor → Sol
 *   gancho    pops de las dos ramas y destello del átomo
 *   sigue     campanas del aviso, golpe del botón y tics de los 13 pares
 *   par       pops de las ramas coclear y vestibular
 *   cóclea    subida del desenrollado y tics del contador hasta quince mil
 *   átomo     tics de los pelitos y destello del átomo
 *   ruido     golpe del ruido fuerte, crujido y renacer de las aves
 *   equilibrio burbuja del nivel y clics de las piedritas
 *   alcohol   vaivén del mareo, burbujas de la copa y vaivén de la cama
 *   reflejo   tics del vaivén de la cabeza, zap de compensación y campana de la pregunta
 *
 * Uso:  node videos/2026-11-16-par-craneal-8/componer-musica.mjs   → assets/musica/par-craneal-8.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-8.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 70.5;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const x = new Float32Array(N);
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(161116);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sua = (v, a, b) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const ex = (t, tau) => Math.exp(-t / tau);
const add = (t0, dur, fn) => { const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round((t0 + dur) * SR)); for (let i = i0; i < i1; i++) x[i] += fn((i - i0) / SR, i / SR); };
const osc = (fFn) => { let ph = 0; return (g) => { ph += (TAU * fFn(g)) / SR; return Math.sin(ph); }; };
const lp = (fc) => { let y = 0; const a = 1 - Math.exp(-TAU * fc / SR); return (w) => (y += a * (w - y)); };
const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
const easeOut = (k) => 1 - Math.pow(1 - clamp(k), 3);


/* ───────── tiempos reales ───────── */
const dur = [6.5, 4.5, 7.0, 7.5, 7.0, 7.5, 7.5, 8.0, 7.5, 4.8];
const ideal = [6.0, 4.0, 6.5, 7.0, 6.5, 7.0, 7.0, 7.5, 7.0, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TVA en src/anim/piezas.ts
  gancho: { nervio: 0.2, oir: 1.6, caer: 2.6, celulas: 3.6, atomo: 4.8 },
  sigue: { antes: 0.2, sigue: 1.2, pares: 2.9 },
  par: { par: 0.2, oir: 2.3, coclear: 3.4, equilibrio: 4.5, vestibular: 5.7 },
  coclea: { caracol: 0.2, guisante: 2.4, desenrolla: 3.8, celulas: 5.0 },
  atomo: { debil: 0.2, pelos: 2.6, mueven: 3.8, atomo: 4.8 },
  ruido: { humanos: 0.2, ruido: 2.2, dano: 3.6, aves: 5.0, renuevan: 5.8 },
  equilibrio: { equilibrio: 0.2, canales: 1.2, burbuja: 3.0, piedritas: 4.4, gravedad: 5.6 },
  alcohol: { suelta: 0.2, gira: 2.0, alcohol: 3.4, sistema: 4.8, cama: 6.0 },
  reflejo: { mueve: 0.2, compensan: 3.0, coche: 4.6, comenta: 6.0 },
};

/* ───────── elementos ───────── */
const campana = (t0, n, g = 0.08, dec = 0.9) => { const f0 = hz(n); add(t0, dec * 4, (t) => g * (Math.sin(TAU * f0 * t) + 0.32 * Math.sin(TAU * f0 * 2 * t) + 0.12 * Math.sin(TAU * f0 * 3.01 * t) + 0.06 * Math.sin(TAU * f0 * 4.2 * t)) * ex(t, dec) * Math.min(1, t / 0.004)); };
const tic = (t0, g = 0.07, f = 2600) => add(t0, 0.03, (t) => g * Math.sin(TAU * f * t) * ex(t, 0.006));
const golpe = (t0, g = 0.4, f = 70) => { add(t0, 0.5, (t) => g * Math.sin(TAU * (f - 24 * t) * t) * ex(t, 0.12)); const l = lp(300); add(t0, 0.1, (t) => g * 0.6 * l(R() * 2 - 1) * 3 * ex(t, 0.025)); };
const soplo = (t0, d, g, fc = 700) => { const l = lp(fc); add(t0, d, (t) => g * l(R() * 2 - 1) * 3 * Math.sin(Math.PI * clamp(t / d))); };
const subida = (t0, d, f0, f1, g = 0.05) => { const w = osc((gg) => lerp(f0, f1, easeOut((gg - t0) / d))); add(t0, d + 0.15, (t, gg) => g * w(gg) * sua(t, 0, 0.08) * (1 - sua(t, d, d + 0.15))); };
const chispas = (t0, d, g = 0.1) => { for (let s = t0; s < t0 + d; s += 0.04 + R() * 0.16) add(s, 0.02, (t) => g * (R() * 2 - 1) * ex(t, 0.004)); };
const moneda = (t0, g = 0.06) => { const f = 2400 + R() * 900; add(t0, 0.35, (t) => g * (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 1.51 * t)) * ex(t, 0.07) * Math.min(1, t / 0.002)); };
const ticsContador = (t0, d, curva, pasos, g = 0.05, f0 = 2000, f1 = 3200) => { let prev = 0; for (let ms = 0; ms <= d * 1000; ms++) { const k = ms / (d * 1000), v = Math.floor(curva(k) * pasos); if (v > prev) { prev = v; tic(t0 + ms / 1000, g, lerp(f0, f1, k)); } } };
const penta = [0, 2, 4, 7, 9];

const murmullo = (t0, d, g = 0.04, fc = 420) => { const l = lp(fc); add(t0, d, (t, gg) => g * l(R() * 2 - 1) * 3 * (0.55 + 0.45 * Math.sin(TAU * 3.7 * gg)) * sua(t, 0, 0.3) * (1 - sua(t, d - 0.3, d))); };
const burbuja = (t0, g = 0.05) => { const f = 500 + R() * 900; add(t0, 0.12, (t) => g * Math.sin(TAU * (f + 900 * t) * t) * ex(t, 0.03) * Math.min(1, t / 0.003)); };
const crujir = (t0, g = 0.2) => { const l = lp(700); add(t0, 0.25, (t) => g * l(R() * 2 - 1) * 3 * ex(t, 0.07) * Math.min(1, t / 0.01)); };   // tela y madera

/** chasquidos de un contador Geiger entre t0 y t1; la frecuencia (clics/s) va de r0 a r1 */
const geiger = (t0, t1, r0, r1) => { let g = t0; while (g < t1) { const r = lerp(r0, r1, (g - t0) / Math.max(0.01, t1 - t0)); add(g, 0.012, (t) => 0.09 * (R() * 2 - 1) * ex(t, 0.002) + 0.05 * Math.sin(TAU * 4200 * t) * ex(t, 0.003)); g += -Math.log(1 - R()) / Math.max(0.5, r); } };

const lubdub = (t0, g = 0.4) => { golpe(t0, g, 62); golpe(t0 + 0.27, g * 0.7, 78); };
const pitido = (t0, f = 1800, g = 0.06) => add(t0, 0.07, (t) => g * Math.sin(TAU * f * t) * Math.sin(Math.PI * clamp(t / 0.07)));

/* 1 · COLCHÓN: acordes suaves */
{
  const acordes = [
    { t: 0, notas: [24, 36, 43, 48, 52] },                          // Do mayor: asombro
    { t: T(2, 0), notas: [31, 43, 50, 55, 59] },                    // Sol mayor: el aviso, luminoso
    { t: T(3, 0), notas: [28, 40, 47, 52, 55] },                    // Mi menor: las dos ramas
    { t: T(4, 0), notas: [29, 41, 48, 53, 57, 60] },                // Fa mayor: la cóclea
    { t: T(5, 0), notas: [26, 38, 45, 50, 53] },                    // Re menor: el átomo
    { t: T(6, 0), notas: [33, 45, 52, 57, 60] },                    // La menor sobrio: el ruido
    { t: T(7, 0), notas: [36, 48, 55, 60, 64] },                    // Do mayor: el equilibrio cotidiano
    { t: T(8, 0), notas: [28, 40, 47, 52, 55, 59] },                // Mi menor: el mareo
    { t: T(9, 0), notas: [31, 43, 50, 55, 59, 62] },                // Sol mayor: la pregunta
  ];
  const sala = lp(220);
  acordes.forEach((c, i) => {
    const a = c.t, b = i + 1 < acordes.length ? acordes[i + 1].t : DURACION;
    add(a - 1.2, b - a + 2.4, (t, g) => {
      const env = sua(g, a - 1.2, a + 0.6) * (1 - sua(g, b - 0.6, b + 1.2)) * sua(g, 0, 2.5) * (1 - sua(g, DURACION - 2.5, DURACION));
      let s = 0;
      c.notas.forEach((n, k) => { const f = hz(n); s += (Math.sin(TAU * f * g) + 0.5 * Math.sin(TAU * f * 1.003 * g + k)) * (n < 48 ? 1 : 0.55); });
      return env * 0.014 * s * (0.85 + 0.15 * Math.sin(TAU * 0.11 * g + i));
    });
  });
  add(0, DURACION, (t, g) => 0.01 * sala(R() * 2 - 1) * 4 * sua(g, 0, 2) * (1 - sua(g, DURACION - 2, DURACION)));
}

/* 2 · ESCENA 1: un nervio, oír y no caerte, el átomo */
{
  campana(T(1, SC.gancho.nervio) + 0.2, 60, 0.06, 1.0);
  const to = T(1, SC.gancho.oir); campana(to, 69, 0.07, 1.0); tic(to, 0.1, 2000);
  const tc = T(1, SC.gancho.caer); campana(tc, 64, 0.07, 1.0); tic(tc, 0.1, 1700);
  const tl = T(1, SC.gancho.celulas); for (let k = 0; k < 6; k++) tic(tl + k * 0.14, 0.05, 2200 + 90 * k);
  const ta = T(1, SC.gancho.atomo);
  [[0, 79], [0.1, 83], [0.2, 88]].forEach(([d, n]) => campana(ta + d, n, 0.06, 1.6)); chispas(ta, 0.3, 0.06);
}

/* 3 · ESCENA 2: aviso rápido de síguenos */
{
  const ts = T(2, SC.sigue.antes) + 0.1;
  soplo(ts, 0.4, 0.05, 1600);
  const tk = T(2, SC.sigue.sigue);
  [[0, 76], [0.1, 81], [0.2, 88]].forEach(([d, n]) => campana(tk + d, n, 0.08, 1.2)); golpe(tk + 0.35, 0.16, 70); moneda(tk + 0.4, 0.06);
  const tp = T(2, SC.sigue.pares);
  for (let k = 0; k < 13; k++) tic(tp + k * 0.05, 0.05, 1500 + 90 * k);
}

/* 4 · ESCENA 3: las dos ramas */
{
  campana(T(3, SC.par.par) + 0.2, 55, 0.06, 1.0);
  tic(T(3, SC.par.oir), 0.1, 1900);
  const tc = T(3, SC.par.coclear); campana(tc, 72, 0.07, 1.2); moneda(tc, 0.05);
  tic(T(3, SC.par.equilibrio), 0.1, 1600);
  const tv = T(3, SC.par.vestibular); campana(tv, 64, 0.07, 1.2); moneda(tv, 0.05);
}

/* 5 · ESCENA 4: la cóclea */
{
  campana(T(4, SC.coclea.caracol) + 0.2, 57, 0.06, 1.2);
  const tg = T(4, SC.coclea.guisante); campana(tg, 67, 0.06, 1.0); moneda(tg, 0.05);
  const td = T(4, SC.coclea.desenrolla); subida(td, 1.0, 300, 1200, 0.04); soplo(td, 0.9, 0.04, 1000);
  const tn = T(4, SC.coclea.celulas); ticsContador(tn, 1.8 * rit[3], easeOut, 60, 0.05, 1800, 3400);
  campana(tn + 1.9 * rit[3], 76, 0.07, 1.4);
}

/* 6 · ESCENA 5: el átomo */
{
  campana(T(5, SC.atomo.debil) + 0.2, 62, 0.05, 1.2); soplo(T(5, SC.atomo.debil) + 0.2, 0.6, 0.025, 1800);
  tic(T(5, SC.atomo.pelos), 0.1, 2200);
  const tm = T(5, SC.atomo.mueven); for (let k = 0; k < 8; k++) tic(tm + k * 0.11, 0.045, 2600 + (k % 2) * 300);
  const ta = T(5, SC.atomo.atomo);
  [[0, 81], [0.1, 86], [0.2, 91]].forEach(([d, n]) => campana(ta + d, n, 0.06, 1.6)); chispas(ta, 0.3, 0.06);
}

/* 7 · ESCENA 6: el ruido y las aves */
{
  campana(T(6, SC.ruido.humanos) + 0.2, 57, 0.06, 1.2);
  const tr = T(6, SC.ruido.ruido);
  golpe(tr, 0.34, 56); crujir(tr, 0.16); subida(tr, 1.0, 200, 900, 0.04);
  const td = T(6, SC.ruido.dano); golpe(td, 0.22, 52); crujir(td, 0.1);
  const ta = T(6, SC.ruido.aves);
  [[0, 72], [0.12, 76], [0.24, 79]].forEach(([d, n]) => campana(ta + d, n, 0.06, 1.2));
  const tn = T(6, SC.ruido.renuevan); for (let k = 0; k < 5; k++) moneda(tn + k * 0.12, 0.04); campana(tn, 84, 0.06, 1.6);
}

/* 8 · ESCENA 7: el equilibrio */
{
  campana(T(7, SC.equilibrio.equilibrio) + 0.2, 60, 0.06, 1.0);
  tic(T(7, SC.equilibrio.canales), 0.1, 1800);
  const tb = T(7, SC.equilibrio.burbuja); burbuja(tb, 0.06); burbuja(tb + 0.25, 0.05); campana(tb, 67, 0.06, 1.0);
  const tp = T(7, SC.equilibrio.piedritas); for (let k = 0; k < 5; k++) crujir(tp + k * 0.12, 0.06); campana(tp, 72, 0.06, 1.0);
  const tg = T(7, SC.equilibrio.gravedad); soplo(tg, 0.6, 0.04, 900); tic(tg, 0.1, 1600);
}

/* 9 · ESCENA 8: piedrita suelta, alcohol, cama que gira */
{
  const ts = T(8, SC.alcohol.suelta); tic(ts + 0.2, 0.1, 1700); crujir(ts + 0.4, 0.08);
  const tg = T(8, SC.alcohol.gira); subida(tg, 0.7, 300, 900, 0.035); subida(tg + 0.7, 0.7, 900, 300, 0.035); campana(tg, 62, 0.06, 1.2);
  const ta = T(8, SC.alcohol.alcohol); for (let k = 0; k < 4; k++) burbuja(ta + k * 0.2, 0.05); campana(ta, 69, 0.06, 1.2);
  tic(T(8, SC.alcohol.sistema), 0.1, 1700);
  const tc = T(8, SC.alcohol.cama); subida(tc, 0.7, 300, 800, 0.035); subida(tc + 0.7, 0.7, 800, 300, 0.035); golpe(tc + 1.4, 0.12, 60);
}

/* 10 · ESCENA 9: reflejo y pregunta para comentar */
{
  const tm = T(9, SC.reflejo.mueve) + 0.2;
  campana(tm, 62, 0.06, 1.0); for (let k = 0; k < 12; k++) tic(tm + 0.3 + k * 0.18, 0.04, 1800 + 80 * Math.sin(k * 1.1));
  const tc = T(9, SC.reflejo.compensan); chispas(tc, 0.25, 0.06); campana(tc, 76, 0.06, 1.2);
  const th = T(9, SC.reflejo.coche); campana(th, 69, 0.07, 1.0); campana(th + 0.14, 76, 0.05, 1.2);
  const tj = T(9, SC.reflejo.comenta); tic(tj, 0.1, 2200); campana(tj, 81, 0.06, 1.4);
}

/* 11 · ESCENA 10 (CTA): destellos suaves */
{
  const tc = T(10, 0.3);
  [[0, 71], [0.15, 76], [0.3, 79], [0.45, 83]].forEach(([d, n]) => campana(tc + d, n, 0.05, 1.2));
}

/* reverb de sala y límite suave */
{
  const retardos = [33.1, 47.3, 67.9, 93.1, 123.7];
  const y = new Float32Array(N);
  for (const ms of retardos) { const dl = Math.round((ms * SR) / 1000), lin = new Float32Array(dl); let p = 0, l = 0; for (let i = 0; i < N; i++) { const o = lin[p]; l += 0.4 * (o - l); lin[p] = x[i] + 0.74 * l; y[i] += o; p = (p + 1) % dl; } }
  for (let i = 0; i < N; i++) x[i] += y[i] * 0.2;
}
let pico = 0;
for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(x[i]));
const gn = 0.9 / Math.max(1e-4, pico);
for (let i = 0; i < N; i++) x[i] = Math.tanh(x[i] * gn * 1.05) * 0.9;
const f = Math.round(0.03 * SR), fo = Math.round(1.5 * SR);
for (let i = 0; i < f; i++) x[i] *= i / f;
for (let i = 0; i < fo; i++) x[N - 1 - i] *= i / fo;
mkdirSync(join(RAIZ, "assets", "musica"), { recursive: true });
const salida = join(RAIZ, "assets", "musica", "par-craneal-8.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
