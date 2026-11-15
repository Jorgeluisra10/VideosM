#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «El par craneal VII: el nervio de los gestos» (65,6 s).
 * Tono: cotidiano y cercano (gestos, lágrimas, saliva) que se vuelve tensión clínica (Bell vs ictus) y termina en alerta sobria + invitación a comentar.
 * Pista de «música» del motor: colchón armónico + eventos alineados con lo que se ve (los tiempos usan el ritmo REAL de cada escena).
 *
 *   colchón   acordes Sol mayor → Mi menor → Do → Re → La menor → Sol (cálido) → Mi menor sobrio (la alerta)
 *   gancho    tic de la caída, pops de las dos tarjetas y destello de la pista de la frente
 *   gestos    pops de sonreír y guiñar, ceño grave y soplo de la vela
 *   extras    pop del gusto, gotas de lágrima y de saliva
 *   túnel     eco del túnel, chispa que viaja y abanico de ramas
 *   Bell      golpe de la inflamación y chispas que se cortan
 *   frente    dos órdenes que llegan, pop del ictus y pop de Bell
 *   cocodrilo masticar, gotas y cables que se cruzan
 *   urgencia  latido de alerta y cierre sobrio
 *
 * Uso:  node videos/2026-11-15-par-craneal-7/componer-musica.mjs   → assets/musica/par-craneal-7.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-7.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 68.3;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const x = new Float32Array(N);
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(151115);
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
const dur = [7.5, 7.8, 7.0, 8.2, 7.8, 7.5, 7.5, 7.5, 4.8];
const ideal = [7.0, 7.3, 6.5, 7.7, 7.0, 7.0, 7.0, 7.0, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TFA en src/anim/piezas.ts
  gancho: { cae: 0.2, bell: 2.6, ictus: 4.2, pista: 5.4 },
  gestos: { par: 0.2, facial: 1.7, gestos: 2.8, sonreir: 4.2, guinar: 5.0, ceno: 5.8, vela: 6.8 },
  extras: { gusto: 0.2, lagrimas: 3.4, saliva: 5.2 },
  tunel: { tunel: 0.2, sale: 3.6, ramas: 5.6 },
  bell: { bell: 0.2, inflama: 2.2, media: 4.6 },
  frente: { pista: 0.2, dos: 2.0, ictus: 4.4, bell: 6.2 },
  cocodrilo: { curioso: 0.2, recuperarse: 2.0, comer: 3.4, cocodrilo: 5.0, cables: 6.6 },
  urgencia: { cae: 0.2, emergencias: 2.2, comentarios: 4.2, ceja: 5.8 },
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
    { t: 0, notas: [31, 43, 50, 55, 59] },                          // Sol mayor: cotidiano
    { t: T(2, 0), notas: [28, 40, 47, 52, 55] },                    // Mi menor: los gestos
    { t: T(3, 0), notas: [36, 48, 55, 60, 64] },                    // Do mayor: gusto, lágrimas y saliva
    { t: T(4, 0), notas: [38, 50, 57, 62, 66] },                    // Re mayor: el túnel
    { t: T(5, 0), notas: [33, 45, 52, 57, 60] },                    // La menor: Bell
    { t: T(7, 0), notas: [31, 43, 50, 55, 59, 62] },                // Sol mayor: el dato curioso
    { t: T(8, 0), notas: [28, 40, 47, 52, 55, 59] },                // Mi menor sobrio: la urgencia
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

/* 2 · ESCENA 1: la cara que se cae, Bell o ictus, la pista */
{
  const tc = T(1, SC.gancho.cae) + 0.2;
  soplo(tc, 0.7, 0.05, 900); subida(tc, 1.0, 700, 260, 0.03); golpe(tc + 1.0, 0.18, 62);
  const tb = T(1, SC.gancho.bell); campana(tb, 69, 0.07, 1.0); tic(tb, 0.1, 2000);
  const ti = T(1, SC.gancho.ictus); campana(ti, 64, 0.07, 1.0); tic(ti, 0.1, 1700);
  const tp = T(1, SC.gancho.pista);
  [[0, 71], [0.12, 76], [0.24, 83]].forEach(([d, n]) => campana(tp + d, n, 0.07, 1.4)); chispas(tp, 0.2, 0.06);
}

/* 3 · ESCENA 2: el nervio de los gestos */
{
  campana(T(2, SC.gestos.par) + 0.2, 55, 0.06, 1.0);
  campana(T(2, SC.gestos.facial), 62, 0.06, 1.0);
  campana(T(2, SC.gestos.gestos), 67, 0.06, 1.2);
  const ts = T(2, SC.gestos.sonreir); moneda(ts, 0.05); campana(ts, 76, 0.06, 0.9);
  const tg = T(2, SC.gestos.guinar); moneda(tg, 0.05); tic(tg, 0.1, 2400);
  const tn = T(2, SC.gestos.ceno); golpe(tn, 0.16, 70); crujir(tn, 0.05);
  const tv = T(2, SC.gestos.vela); soplo(tv, 0.7, 0.07, 1800); subida(tv, 0.5, 900, 300, 0.02);
}

/* 4 · ESCENA 3: gusto, lágrimas y saliva */
{
  campana(T(3, SC.extras.gusto) + 0.2, 60, 0.06, 1.0); moneda(T(3, SC.extras.gusto) + 0.3, 0.05);
  const tl = T(3, SC.extras.lagrimas);
  campana(tl, 67, 0.06, 1.2); for (let k = 0; k < 3; k++) burbuja(tl + 0.3 + k * 0.35, 0.05);
  const tv = T(3, SC.extras.saliva);
  campana(tv, 72, 0.06, 1.2); for (let k = 0; k < 3; k++) burbuja(tv + 0.3 + k * 0.3, 0.05);
}

/* 5 · ESCENA 4: el túnel y las ramas */
{
  const tt = T(4, SC.tunel.tunel);
  campana(tt + 0.2, 55, 0.06, 1.2); subida(tt + 0.4, 2.6, 300, 1100, 0.03); for (let k = 0; k < 12; k++) tic(tt + 0.6 + k * 0.22, 0.04, 1400 + 70 * k);
  const ts = T(4, SC.tunel.sale); campana(ts, 66, 0.06, 1.2); golpe(ts, 0.14, 64);
  const tr = T(4, SC.tunel.ramas);
  [[0, 74], [0.1, 78], [0.2, 81], [0.3, 86]].forEach(([d, n]) => campana(tr + d, n, 0.05, 1.2)); chispas(tr, 0.4, 0.06);
}

/* 6 · ESCENA 5: la parálisis de Bell */
{
  campana(T(5, SC.bell.bell) + 0.2, 57, 0.06, 1.2);
  const ti = T(5, SC.bell.inflama);
  subida(ti, 1.2, 250, 800, 0.04); for (let k = 0; k < 4; k++) golpe(ti + 0.4 + k * 0.4, 0.12, 58); golpe(ti + 1.4, 0.26, 52); crujir(ti + 1.4, 0.1);
  const tm = T(5, SC.bell.media);
  soplo(tm, 0.8, 0.05, 700); campana(tm, 60, 0.06, 1.6); tic(tm + 0.3, 0.1, 1500);
}

/* 7 · ESCENA 6: la pista de la frente */
{
  campana(T(6, SC.frente.pista) + 0.2, 69, 0.06, 1.0);
  const td = T(6, SC.frente.dos);
  campana(td, 64, 0.06, 1.0); campana(td + 0.5, 71, 0.06, 1.0); for (let k = 0; k < 6; k++) tic(td + 0.2 + k * 0.18, 0.04, 1800 + 80 * k);
  const ti = T(6, SC.frente.ictus); golpe(ti, 0.2, 60); campana(ti, 62, 0.06, 1.2);
  const tb = T(6, SC.frente.bell); golpe(tb, 0.2, 56); campana(tb, 74, 0.06, 1.2); chispas(tb, 0.2, 0.05);
}

/* 8 · ESCENA 7: lágrimas de cocodrilo */
{
  campana(T(7, SC.cocodrilo.curioso) + 0.2, 67, 0.06, 1.0);
  const tr = T(7, SC.cocodrilo.recuperarse); moneda(tr, 0.05);
  const tm = T(7, SC.cocodrilo.comer);
  for (let k = 0; k < 5; k++) crujir(tm + 0.1 + k * 0.22, 0.06); for (let k = 0; k < 3; k++) burbuja(tm + 0.5 + k * 0.3, 0.05);
  campana(T(7, SC.cocodrilo.cocodrilo), 60, 0.06, 1.2);
  const tc = T(7, SC.cocodrilo.cables);
  chispas(tc, 0.5, 0.07); subida(tc, 0.6, 500, 1600, 0.03); golpe(tc + 0.6, 0.14, 60);
}

/* 9 · ESCENA 8: urgencia y pregunta para comentar */
{
  const tc = T(8, SC.urgencia.cae) + 0.2;
  soplo(tc, 0.6, 0.05, 900); golpe(tc + 0.6, 0.2, 60);
  const te = T(8, SC.urgencia.emergencias);
  lubdub(te, 0.3); lubdub(te + 0.9, 0.3); campana(te, 52, 0.06, 1.6);
  const tm = T(8, SC.urgencia.comentarios);
  campana(tm, 69, 0.07, 1.0); campana(tm + 0.14, 76, 0.05, 1.2);
  const tj = T(8, SC.urgencia.ceja);
  tic(tj, 0.1, 2200); campana(tj, 81, 0.06, 1.4); chispas(tj, 0.2, 0.05);
}

/* 10 · ESCENA 9 (CTA): destellos suaves */
{
  const tc = T(9, 0.3);
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
const salida = join(RAIZ, "assets", "musica", "par-craneal-7.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
