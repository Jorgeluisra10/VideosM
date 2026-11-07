#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «El par craneal 0: el nervio que casi nadie te enseñó» (65,5 s).
 * Tono: misterio científico que se resuelve en curiosidad. Pista de «música» del motor: colchón armónico + eventos alineados con lo que se ve
 * (los tiempos usan el ritmo REAL de cada escena).
 *
 *   colchón   acordes La menor → Fa → Re menor → Do → Sol → La mayor (el misterio que queda)
 *   gancho    tics de los 12 pares, hueco del cero y chispa menta cuando aparece el 0
 *   fritsch   contador de 1878, golpe del «no en personas» y barrido del tiburón
 *   recorrido fibras que se tejen, campana de la lámina cribosa y llegada al cerebro
 *   número    pops de los bulbos y whoosh de «por delante»
 *   GnRH      saltos de las neuronas doradas hasta el hipotálamo
 *   Kallmann  golpe de la ruta cortada y disonancia
 *   misterio  signo de interrogación y sellos de «sin demostrar»
 *   libro     línea de tiempo 1878 → 1998 → hoy y golpe final del libro
 *
 * Uso:  node videos/2026-11-08-par-craneal-0/componer-musica.mjs   → assets/musica/par-craneal-0.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-0.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 68.2;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const x = new Float32Array(N);
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(81108);
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
const dur = [7, 7.1, 7.8, 7, 8.1, 8.1, 7.8, 7.8, 4.8];
const ideal = [6.5, 6.6, 7.3, 6.5, 7.6, 7.6, 7.3, 7.3, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TPC en src/anim/piezas.ts
  gancho: { doce: 0.4, uno: 2.8, antes: 3.9, cero: 5.6 },
  fritsch: { anio: 0.2, nombre: 2.3, personas: 4.9, tiburon: 5.7 },
  recorrido: { red: 0.2, mielina: 2.4, olfatorio: 3.3, placa: 5.0, cerebro: 6.5 },
  numero: { bautizo: 0.6, ochenta: 2.0, delante: 3.9, olfatorio: 5.6 },
  gnrh: { embrion: 0.2, gnrh: 1.3, hormona: 2.4, viaja: 4.6, nervio: 6.2 },
  kallmann: { falla: 0.2, sindrome: 1.8, olfato: 3.8, pubertad: 4.9 },
  misterio: { adultos: 0.2, nose: 1.4, repro: 3.0, feromonas: 5.2, nada: 6.7 },
  libro: { nomenclatura: 0.2, anio: 2.3, libros: 5.2 },
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
    { t: 0, notas: [33, 45, 52, 57, 60] },                         // La menor
    { t: T(2, 0), notas: [29, 41, 48, 53, 57, 60] },               // Fa mayor: el pasado
    { t: T(3, 0), notas: [38, 45, 53, 57] },                       // Re menor: el misterio anatómico
    { t: T(5, 0), notas: [36, 48, 55, 60, 64] },                   // Do mayor: la migración
    { t: T(6, 0), notas: [31, 43, 50, 55, 58] },                   // Sol menor: Kallmann
    { t: T(7, SC.misterio.nose) - 0.3, notas: [33, 45, 52, 57, 61, 64] }, // La mayor: el interrogante abierto
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

/* 2 · ESCENA 1: los 12 pares y el hueco del cero */
{
  const td = T(1, SC.gancho.doce);
  for (let k = 0; k < 12; k++) tic(td + k * 0.15, 0.05, 1500 + 90 * k);                                         // aparecen los pares I–XII
  campana(T(1, SC.gancho.uno), 64, 0.05, 0.9);
  tic(T(1, SC.gancho.antes), 0.1, 1700);
  const tc = T(1, SC.gancho.cero);
  chispas(tc, 0.35, 0.09); subida(tc, 0.35, 400, 1800, 0.05); golpe(tc + 0.02, 0.28, 66);
  [[0.15, 74], [0.25, 81], [0.35, 86]].forEach(([d, n]) => campana(tc + d, n, 0.07, 1.4));
}

/* 3 · ESCENA 2: 1878, no en personas, tiburón */
{
  const ta = T(2, SC.fritsch.anio) + 0.2;
  ticsContador(ta, 1.6 * rit[1], easeOut, 78, 0.04, 1800, 3200);
  campana(ta + 1.6 * rit[1], 62, 0.06, 1.0);
  tic(T(2, SC.fritsch.nombre), 0.1, 1700);
  const tp = T(2, SC.fritsch.personas);
  golpe(tp, 0.34, 56); add(tp, 0.7, (t) => 0.04 * (Math.sin(TAU * 98 * t) + Math.sin(TAU * 103.5 * t)) * ex(t, 0.25));
  const tt = T(2, SC.fritsch.tiburon);
  soplo(tt, 0.9, 0.06, 900); subida(tt, 0.9, 250, 900, 0.03);
  campana(tt + 0.9, 69, 0.07, 1.4); for (let k = 0; k < 5; k++) burbuja(tt + 1.0 + k * 0.14, 0.03);
}

/* 4 · ESCENA 3: red de fibras, lámina cribosa, llegada al cerebro */
{
  const tr = T(3, SC.recorrido.red);
  for (let g = tr; g < tr + 1.8; g += 0.06 + R() * 0.06) burbuja(g, 0.022); campana(tr + 0.2, 57, 0.06, 1.2);
  tic(T(3, SC.recorrido.mielina), 0.1, 2200);
  const to = T(3, SC.recorrido.olfatorio);
  campana(to, 72, 0.06, 1.0); soplo(to, 0.6, 0.04, 1500);
  const tp = T(3, SC.recorrido.placa);
  for (let k = 0; k < 6; k++) tic(tp + k * 0.06, 0.07, 2000 + 140 * k); campana(tp + 0.3, 79, 0.07, 1.4);
  const tc = T(3, SC.recorrido.cerebro);
  subida(tc, 0.9, 300, 1400, 0.04); campana(tc + 1.0, 64, 0.07, 1.6); campana(tc + 1.12, 71, 0.05, 1.4);
}

/* 5 · ESCENA 4: por qué se llama cero (vista inferior) */
{
  const tb = T(4, SC.numero.bautizo);
  chispas(tb, 0.4, 0.08); campana(tb + 0.1, 81, 0.06, 1.2);
  tic(T(4, SC.numero.ochenta), 0.1, 1700);
  const td = T(4, SC.numero.delante);
  soplo(td, 0.7, 0.06, 1400); subida(td, 0.6, 400, 1500, 0.04);
  const to = T(4, SC.numero.olfatorio);
  campana(to, 72, 0.07, 1.2); campana(to + 0.15, 76, 0.05, 1.0);
}

/* 6 · ESCENA 5: GnRH viaja de la nariz al cerebro */
{
  campana(T(5, SC.gnrh.embrion) + 0.1, 62, 0.05, 1.0);
  const tg = T(5, SC.gnrh.gnrh);
  moneda(tg, 0.06); campana(tg, 76, 0.06, 1.0);
  tic(T(5, SC.gnrh.hormona), 0.1, 1900);
  const tv = T(5, SC.gnrh.viaja);
  for (let k = 0; k < 14; k++) { tic(tv + k * 0.13, 0.05, 1500 + 110 * k); }                                    // las neuronas saltan una a una
  subida(tv, 1.8, 250, 1600, 0.035);
  const tl = tv + 2.2 * rit[4];
  [[0, 69], [0.1, 76], [0.2, 81]].forEach(([d, n]) => campana(tl + d, n, 0.07, 1.6)); lubdub(tl, 0.3);
}

/* 7 · ESCENA 6: Kallmann, la ruta falla */
{
  const tf = T(6, SC.kallmann.falla) + 0.3;
  golpe(tf, 0.4, 50); crujir(tf, 0.18); add(tf, 0.9, (t) => 0.05 * (Math.sin(TAU * 98 * t) + Math.sin(TAU * 103.5 * t)) * ex(t, 0.3));
  const ts = T(6, SC.kallmann.sindrome);
  campana(ts, 55, 0.06, 1.4); soplo(ts, 0.8, 0.04, 600);
  const to = T(6, SC.kallmann.olfato);
  golpe(to, 0.26, 58); soplo(to, 0.5, 0.05, 1000);
  const tp = T(6, SC.kallmann.pubertad);
  subida(tp, 1.0, 900, 220, 0.04); tic(tp + 1.1, 0.1, 1200);
}

/* 8 · ESCENA 7: el interrogante y los sellos */
{
  campana(T(7, SC.misterio.adultos) + 0.1, 57, 0.06, 1.2);
  const tn = T(7, SC.misterio.nose);
  [[0, 69], [0.12, 73], [0.24, 76]].forEach(([d, n]) => campana(tn + d, n, 0.06, 1.8));
  moneda(T(7, SC.misterio.repro), 0.05); moneda(T(7, SC.misterio.feromonas), 0.05);
  tic(T(7, SC.misterio.repro), 0.1, 1700); tic(T(7, SC.misterio.feromonas), 0.1, 1900);
  const tz = T(7, SC.misterio.nada);
  golpe(tz, 0.36, 54); crujir(tz, 0.12); golpe(tz + 0.3, 0.22, 60);
}

/* 9 · ESCENA 8: línea de tiempo y libro */
{
  tic(T(8, SC.libro.nomenclatura) + 0.2, 0.1, 1700);
  tic(T(8, 1.2), 0.1, 1800);
  const ta = T(8, SC.libro.anio);
  campana(ta, 69, 0.07, 1.4); campana(ta + 0.12, 76, 0.05, 1.2);
  const tl = T(8, SC.libro.libros);
  golpe(tl, 0.34, 54); crujir(tl, 0.1);
  const tf = tl + 1.2;
  [[0, 50], [0.1, 57], [0.2, 62], [0.3, 66], [0.4, 69], [0.5, 74]].forEach(([d, n]) => campana(tf + d, n, 0.07, 2.0));
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
const salida = join(RAIZ, "assets", "musica", "par-craneal-0.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
