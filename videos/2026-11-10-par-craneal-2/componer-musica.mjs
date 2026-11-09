#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «El nervio óptico: la parte del cerebro que sale a mirar» (65,6 s).
 * Tono: asombro que se vuelve cautela honesta. Pista de «música» del motor: colchón armónico + eventos alineados con lo que se ve
 * (los tiempos usan el ritmo REAL de cada escena).
 *
 *   colchón   acordes Mi menor → Do → La menor → Sol → Re menor → Mi menor sobrio (la cautela)
 *   gancho    pulsos de los tallos violeta del cerebro a los ojos
 *   origen    tics de los mil puntos de axones y campana de las meninges
 *   ciego     chispa del punto ciego y barrido de «lo rellena»
 *   quiasma   whoosh del cruce de las fibras azules y naranjas
 *   regenera  golpe grave de las fibras que no vuelven
 *   genes     tres notas OSK, borrado de marcas y crecimiento de la fibra
 *   ensayo    pops de la línea de tiempo y de los tres participantes
 *   temprano  golpe del sello rojo y cierre sobrio sin triunfalismo
 *
 * Uso:  node videos/2026-11-10-par-craneal-2/componer-musica.mjs   → assets/musica/par-craneal-2.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-2.wav   (y --restaurar al terminar; el WAV no va a git)
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
const R = prng(101110);
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
const dur = [7, 7, 8.5, 7.5, 7.8, 8.1, 7.8, 7.1, 4.8];
const ideal = [6.5, 6.5, 8, 7, 7.3, 7, 7.3, 6.6, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TOP en src/anim/piezas.ts
  gancho: { par: 0.2, optico: 1.7, comun: 3.1, extension: 4.6 },
  origen: { diencefalo: 0.2, meninges: 2.2, millon: 4.2 },
  ciego: { sale: 0.2, sinFoto: 2.3, punto: 4.2, rellena: 6.0 },
  quiasma: { quiasma: 0.2, cruzan: 2.0, izquierda: 4.0, derecho: 5.6 },
  regenera: { parte: 0.2, noRegenera: 2.1, olfatorio: 3.5, glaucoma: 5.2 },
  genes: { anio: 0.2, ratones: 1.7, tres: 3.3, rejuvenece: 4.4, mejora: 6.3 },
  ensayo: { hoy: 0.2, personas: 2.6, octubre: 5.2, tolerada: 6.5 },
  temprano: { temprano: 0.2, seguridad: 1.8, tres: 3.4, noDemuestra: 4.9 },
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
    { t: 0, notas: [28, 40, 47, 52, 55] },                          // Mi menor
    { t: T(2, 0), notas: [36, 48, 55, 60, 64] },                    // Do mayor: el nervio
    { t: T(3, 0), notas: [33, 45, 52, 57, 60] },                    // La menor: el punto ciego
    { t: T(5, 0), notas: [31, 43, 50, 55, 59] },                    // Sol mayor: no se regenera
    { t: T(6, 0), notas: [38, 45, 53, 57, 60] },                    // Re menor: la reprogramación
    { t: T(8, 0), notas: [28, 40, 47, 52, 55, 59] },                // Mi menor sobrio: la cautela
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

/* 2 · ESCENA 1: el cerebro y sus tallos */
{
  campana(T(1, SC.gancho.par) + 0.2, 62, 0.06, 1.0);
  const to = T(1, SC.gancho.optico);
  subida(to, 1.4 * rit[0], 250, 1100, 0.04); for (let k = 0; k < 6; k++) tic(to + 0.3 + k * 0.2, 0.05, 1700 + 90 * k);
  tic(T(1, SC.gancho.comun), 0.1, 1800);
  const te = T(1, SC.gancho.extension);
  chispas(te, 0.3, 0.07); [[0, 69], [0.12, 76], [0.24, 81]].forEach(([d, n]) => campana(te + d, n, 0.07, 1.4));
}

/* 3 · ESCENA 2: origen, meninges y un millón de fibras */
{
  campana(T(2, SC.origen.diencefalo) + 0.1, 57, 0.06, 1.0);
  const tm = T(2, SC.origen.meninges);
  campana(tm, 64, 0.06, 1.2); soplo(tm, 0.6, 0.04, 900);
  const tf = T(2, SC.origen.millon);
  ticsContador(tf, 1.8 * rit[1], easeOut, 160, 0.035, 1700, 3400);
  campana(tf + 1.8 * rit[1], 76, 0.07, 1.4);
}

/* 4 · ESCENA 3: punto ciego */
{
  campana(T(3, SC.ciego.sale) + 0.1, 62, 0.06, 1.0);
  const ts = T(3, SC.ciego.sinFoto);
  tic(ts, 0.12, 1500); soplo(ts, 0.5, 0.04, 700);
  const tp = T(3, SC.ciego.punto);
  moneda(tp, 0.05); campana(tp, 69, 0.06, 1.0);
  const tr = T(3, SC.ciego.rellena);
  subida(tr, 0.7, 1500, 400, 0.04); [[0.3, 72], [0.42, 76], [0.54, 81]].forEach(([d, n]) => campana(tr + d, n, 0.06, 1.4));
}

/* 5 · ESCENA 4: quiasma y cruce de fibras */
{
  campana(T(4, SC.quiasma.quiasma) + 0.1, 64, 0.06, 1.0);
  const tc = T(4, SC.quiasma.cruzan);
  soplo(tc, 1.0, 0.05, 1400); subida(tc, 0.9, 400, 1500, 0.035); for (let k = 0; k < 8; k++) tic(tc + 0.2 + k * 0.14, 0.05, 1800 + 80 * k);
  tic(T(4, SC.quiasma.izquierda), 0.1, 1900);
  const td = T(4, SC.quiasma.derecho);
  campana(td, 72, 0.07, 1.4); campana(td + 0.12, 76, 0.05, 1.2);
}

/* 6 · ESCENA 5: no se regenera */
{
  campana(T(5, SC.regenera.parte) + 0.1, 55, 0.06, 1.2);
  const tn = T(5, SC.regenera.noRegenera);
  golpe(tn, 0.36, 52); crujir(tn, 0.12);
  const to = T(5, SC.regenera.olfatorio);
  campana(to, 72, 0.05, 0.9); for (let k = 0; k < 4; k++) burbuja(to + 0.2 + k * 0.18, 0.03);
  const tg = T(5, SC.regenera.glaucoma);
  for (let k = 0; k < 9; k++) tic(tg + k * 0.17, 0.06, 1500 - 40 * k);
  golpe(tg + 1.8, 0.3, 48); add(tg + 1.8, 0.9, (t) => 0.04 * (Math.sin(TAU * 98 * t) + Math.sin(TAU * 103.5 * t)) * ex(t, 0.3));
}

/* 7 · ESCENA 6: tres genes y reprogramación */
{
  tic(T(6, SC.genes.anio) + 0.2, 0.1, 1800);
  campana(T(6, SC.genes.ratones), 62, 0.05, 1.0);
  const tt = T(6, SC.genes.tres);
  [0, 0.2, 0.4].forEach((d, k) => { campana(tt + d, [64, 69, 76][k], 0.07, 1.2); chispas(tt + d, 0.15, 0.04); });
  const tr = T(6, SC.genes.rejuvenece);
  for (let k = 0; k < 14; k++) { burbuja(tr + k * 0.1, 0.03); }
  subida(tr, 1.5, 300, 1500, 0.04);
  const tm = T(6, SC.genes.mejora);
  [[0, 69], [0.1, 76], [0.2, 81]].forEach(([d, n]) => campana(tm + d, n, 0.07, 1.6)); lubdub(tm, 0.28);
}

/* 8 · ESCENA 7: línea de tiempo y ensayo */
{
  tic(T(7, SC.ensayo.hoy) + 0.2, 0.1, 1700); tic(T(7, 1.3), 0.1, 1800);
  const tp = T(7, SC.ensayo.personas);
  tic(tp, 0.1, 1900); [0, 0.4, 0.8].forEach((d) => { moneda(tp + d, 0.04); campana(tp + d, 72 + d * 5, 0.04, 0.8); });
  const to = T(7, SC.ensayo.octubre);
  campana(to, 69, 0.06, 1.2); tic(to, 0.1, 2000);
  const tt = T(7, SC.ensayo.tolerada);
  [[0, 72], [0.1, 76], [0.2, 81]].forEach(([d, n]) => campana(tt + d, n, 0.06, 1.4));
}

/* 9 · ESCENA 8: cautela, sin triunfalismo */
{
  golpe(T(8, SC.temprano.temprano) + 0.1, 0.2, 58);
  tic(T(8, SC.temprano.seguridad), 0.1, 1700);
  tic(T(8, SC.temprano.tres), 0.1, 1900);
  const tn = T(8, SC.temprano.noDemuestra);
  golpe(tn, 0.38, 50); crujir(tn, 0.12);
  [[0.4, 52], [0.5, 59], [0.6, 64]].forEach(([d, n]) => campana(tn + d, n, 0.06, 2.0));
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
const salida = join(RAIZ, "assets", "musica", "par-craneal-2.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
