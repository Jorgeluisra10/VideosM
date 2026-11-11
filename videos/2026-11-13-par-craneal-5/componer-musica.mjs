#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «El par craneal V: el picante no es un sabor» (62,4 s).
 * Tono: juguetón y atrevido (picante, hielo) con un giro serio en la neuralgia y un cierre abierto que invita a comentar.
 * Pista de «música» del motor: colchón armónico + eventos alineados con lo que se ve (los tiempos usan el ritmo REAL de cada escena).
 *
 *   colchón   acordes La menor → Fa → Sol → Do → Re menor → Mi menor → La mayor (pregunta abierta)
 *   gancho    pop del chile, golpe del «no es un sabor» y chispa del calor y del dolor
 *   capsaicina apertura del canal TRPV1, iones que entran y quemadura que sube al cerebro
 *   nobel     campanas de la medalla y del año
 *   mentol    destello de hielo del receptor del frío
 *   ramas     pops de V1, V2 y V3 y masticación
 *   helado    barrido del frío en el paladar y chispa del dolor en la frente
 *   neuralgia golpe de las descargas
 *   comenta   pops de las dos opciones y campanita final
 *
 * Uso:  node videos/2026-11-13-par-craneal-5/componer-musica.mjs   → assets/musica/par-craneal-5.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-5.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 65.1;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const x = new Float32Array(N);
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(131113);
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
const dur = [7.1, 8.5, 6.2, 7, 7, 7.5, 7.8, 6.5, 4.8];
const ideal = [6.6, 8, 5.7, 6.5, 6.5, 7, 7.3, 6, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TTG en src/anim/piezas.ts
  gancho: { picante: 0.2, sabor: 1.1, dolorCalor: 2.4, trigemino: 4.4 },
  capsaicina: { chile: 0.2, activa: 1.4, trpv1: 3.1, quemando: 5.4, fuego: 7.7 },
  nobel: { descubrir: 0.2, julius: 2.4, nobel: 3.7, anio: 5.1 },
  mentol: { contrario: 0.2, frio: 2.6, fresco: 4.6, temperatura: 6.0 },
  ramas: { nombre: 0.2, grande: 1.6, ramas: 3.6, mastica: 5.0 },
  helado: { cree: 0.2, congelamiento: 1.2, paladar: 3.8, frente: 5.6 },
  neuralgia: { irrita: 0.2, neuralgia: 2.2, roce: 4.4, viento: 5.3, descargas: 7.0 },
  comenta: { ahora: 0.2, picante: 2.6, helado: 4.2 },
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
    { t: 0, notas: [33, 45, 52, 57, 60] },                          // La menor
    { t: T(2, 0), notas: [29, 41, 48, 53, 57, 60] },                // Fa mayor: el chile
    { t: T(3, 0), notas: [31, 43, 50, 55, 59] },                    // Sol mayor: el Nobel
    { t: T(4, 0), notas: [36, 48, 55, 60, 64] },                    // Do mayor: el mentol
    { t: T(5, 0), notas: [38, 45, 53, 57, 60] },                    // Re menor: las ramas
    { t: T(7, 0), notas: [28, 40, 47, 52, 55] },                    // Mi menor: la neuralgia
    { t: T(8, 0), notas: [33, 45, 52, 57, 61, 64] },                // La mayor: pregunta abierta
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

/* 2 · ESCENA 1: el picante no es un sabor */
{
  const tc = T(1, SC.gancho.picante) + 0.2;
  for (let k = 0; k < 5; k++) tic(tc + k * 0.1, 0.05, 1700 + 90 * k);
  campana(T(1, SC.gancho.picante) + 0.5, 69, 0.06, 0.9);
  const ts = T(1, SC.gancho.sabor);
  golpe(ts, 0.34, 56); crujir(ts, 0.1);
  const td = T(1, SC.gancho.dolorCalor);
  chispas(td, 0.35, 0.08); subida(td, 0.4, 400, 1700, 0.04);
  const tt = T(1, SC.gancho.trigemino);
  [[0, 69], [0.12, 76], [0.24, 81]].forEach(([d, n]) => campana(tt + d, n, 0.07, 1.4));
}

/* 3 · ESCENA 2: capsaicina y TRPV1 */
{
  campana(T(2, SC.capsaicina.chile) + 0.2, 62, 0.06, 1.0);
  const ta = T(2, SC.capsaicina.activa);
  for (let k = 0; k < 6; k++) tic(ta + k * 0.2, 0.05, 1500 + 90 * k);
  const tt = T(2, SC.capsaicina.trpv1);
  golpe(tt, 0.26, 62); chispas(tt, 0.3, 0.07); for (let k = 0; k < 8; k++) burbuja(tt + 0.2 + k * 0.1, 0.03);
  const tq = T(2, SC.capsaicina.quemando);
  subida(tq, 1.4, 300, 1800, 0.05); for (let k = 0; k < 8; k++) tic(tq + k * 0.17, 0.05, 1700 + 80 * k);
  const tf = T(2, SC.capsaicina.fuego);
  golpe(tf, 0.3, 54); campana(tf + 0.1, 64, 0.06, 1.2);
}

/* 4 · ESCENA 3: Nobel */
{
  tic(T(3, SC.nobel.descubrir) + 0.2, 0.1, 1800);
  const tj = T(3, SC.nobel.julius);
  campana(tj, 69, 0.06, 1.0);
  const tn = T(3, SC.nobel.nobel);
  [[0, 65], [0.1, 72], [0.2, 77], [0.3, 81]].forEach(([d, n]) => campana(tn + d, n, 0.08, 1.8)); moneda(tn, 0.06);
  const ta = T(3, SC.nobel.anio);
  tic(ta, 0.1, 2000); campana(ta, 76, 0.05, 1.0);
}

/* 5 · ESCENA 4: mentol y receptor del frío */
{
  campana(T(4, SC.mentol.contrario) + 0.2, 76, 0.05, 1.0);
  const tf = T(4, SC.mentol.frio);
  chispas(tf, 0.3, 0.06); subida(tf, 0.6, 2400, 800, 0.03); for (let k = 0; k < 7; k++) { moneda(tf + 0.3 + k * 0.1, 0.03); }
  const tr = T(4, SC.mentol.fresco);
  [[0, 81], [0.1, 86], [0.2, 90]].forEach(([d, n]) => campana(tr + d, n, 0.05, 1.6));
  tic(T(4, SC.mentol.temperatura), 0.1, 1900);
}

/* 6 · ESCENA 5: tres ramas y masticación */
{
  campana(T(5, SC.ramas.nombre) + 0.2, 62, 0.06, 1.0);
  tic(T(5, SC.ramas.grande), 0.12, 1700);
  const tr = T(5, SC.ramas.ramas);
  [[0, 66], [0.35, 70], [0.7, 73]].forEach(([d, n]) => campana(tr + d, n, 0.07, 1.0));
  const tm = T(5, SC.ramas.mastica);
  for (let k = 0; k < 6; k++) { golpe(tm + k * 0.26, 0.14, 68); crujir(tm + k * 0.26, 0.05); }
}

/* 7 · ESCENA 6: congelamiento cerebral */
{
  campana(T(6, SC.helado.cree) + 0.2, 57, 0.05, 1.0);
  const tc = T(6, SC.helado.congelamiento);
  campana(tc, 81, 0.05, 1.0); tic(tc, 0.1, 2400);
  const tp = T(6, SC.helado.paladar);
  soplo(tp, 0.8, 0.05, 1800); subida(tp, 0.8, 2000, 700, 0.03); for (let k = 0; k < 6; k++) moneda(tp + 0.3 + k * 0.12, 0.03);
  const tf = T(6, SC.helado.frente);
  golpe(tf, 0.36, 52); chispas(tf, 0.3, 0.08);
}

/* 8 · ESCENA 7: neuralgia */
{
  campana(T(7, SC.neuralgia.irrita) + 0.2, 55, 0.06, 1.2);
  golpe(T(7, SC.neuralgia.neuralgia), 0.3, 50);
  const tr = T(7, SC.neuralgia.roce) + 0.3;
  chispas(tr, 0.25, 0.09); golpe(tr, 0.28, 56);
  const tv = T(7, SC.neuralgia.viento) + 0.3;
  chispas(tv, 0.25, 0.09); golpe(tv, 0.28, 54);
  const td = T(7, SC.neuralgia.descargas);
  for (let k = 0; k < 4; k++) { chispas(td + k * 0.2, 0.12, 0.09); golpe(td + k * 0.2, 0.22, 52); }
}

/* 9 · ESCENA 8: pregunta para comentar */
{
  campana(T(8, SC.comenta.ahora) + 0.2, 69, 0.07, 1.0); campana(T(8, SC.comenta.ahora) + 0.35, 76, 0.05, 1.0);
  const tp = T(8, SC.comenta.picante);
  moneda(tp, 0.05); campana(tp, 64, 0.07, 1.0); golpe(tp, 0.14, 62);
  const th = T(8, SC.comenta.helado);
  moneda(th, 0.05); campana(th, 81, 0.07, 1.0); golpe(th, 0.14, 62);
  [[0.9, 69], [1.0, 73], [1.1, 76], [1.2, 81]].forEach(([d, n]) => campana(th + d, n, 0.06, 1.4));
}

/* 10 · ESCENA 9 (CTA): destellos suaves */
{
  const tc = T(9, 0.3);
  [[0, 74], [0.15, 78], [0.3, 81], [0.45, 86]].forEach(([d, n]) => campana(tc + d, n, 0.05, 1.2));
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
const salida = join(RAIZ, "assets", "musica", "par-craneal-5.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
