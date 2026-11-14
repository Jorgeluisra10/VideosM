#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «El par craneal VI: el chivato de la presión» (63,2 s).
 * Tono: curiosidad cotidiana (mirar de reojo) que se va volviendo tensión clínica y termina en alerta sobria.
 * Pista de «música» del motor: colchón armónico + eventos alineados con lo que se ve (los tiempos usan el ritmo REAL de cada escena).
 *
 *   colchón   acordes Re menor → Si bemol → La menor → Fa → Mi menor → Re menor sobrio (la alerta)
 *   gancho    whoosh de reojo a un lado y al otro y pops de los músculos
 *   regla     pops de LR6, SO4 y «el resto 3»
 *   núcleo    cruce de fibras y los dos ojos que se mueven juntos
 *   Dorello   tics de la subida por el clivus y golpe del ligamento que ancla
 *   presión   golpe grave del estiramiento y ojo que se desvía
 *   falso     ondas de la masa lejana y nervio que falla
 *   Duane     tics del nervio ausente y golpe de la retracción
 *   consulta  zap de la doble imagen y cierre sobrio
 *
 * Uso:  node videos/2026-11-14-par-craneal-6/componer-musica.mjs   → assets/musica/par-craneal-6.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-6.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 65.9;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const x = new Float32Array(N);
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(141114);
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
const dur = [7.1, 7.1, 7.8, 6.5, 7.1, 7.8, 7.5, 7.5, 4.8];
const ideal = [6.6, 6.6, 7.3, 6, 6.6, 7.3, 7, 7, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TAB en src/anim/piezas.ts
  gancho: { reojo: 0.2, par: 2.0, abducens: 3.7, musculo: 4.9 },
  regla: { truco: 0.2, seis: 1.8, cuatro: 3.6, tres: 5.6 },
  nucleo: { puente: 0.2, coordina: 2.4, afuera: 4.6, adentro: 5.7 },
  dorello: { sube: 0.2, canal: 2.2, anclado: 4.2 },
  presion: { presion: 0.2, anclado: 2.6, estira: 4.0, ojo: 5.2 },
  falso: { falso: 0.2, lejos: 2.6, masa: 5.2 },
  duane: { nacen: 0.2, duane: 2.4, oculo: 4.6, retrae: 6.4 },
  consulta: { doble: 0.2, medico: 3.2, avisar: 4.8 },
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
    { t: 0, notas: [26, 38, 45, 50, 53] },                          // Re menor
    { t: T(2, 0), notas: [34, 46, 53, 58, 62] },                    // Si bemol mayor: la regla
    { t: T(3, 0), notas: [33, 45, 52, 57, 60] },                    // La menor: el núcleo
    { t: T(4, 0), notas: [29, 41, 48, 53, 57, 60] },                // Fa mayor: el recorrido
    { t: T(5, 0), notas: [28, 40, 47, 52, 55] },                    // Mi menor: la presión
    { t: T(8, 0), notas: [26, 38, 45, 50, 53, 57] },                // Re menor sobrio: la consulta
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

/* 2 · ESCENA 1: mirar de reojo */
{
  const tr = T(1, SC.gancho.reojo) + 0.2;
  soplo(tr, 0.5, 0.05, 1400); soplo(tr + 1.3, 0.5, 0.05, 1400); soplo(tr + 2.6, 0.5, 0.05, 1400);
  campana(T(1, SC.gancho.par), 62, 0.06, 1.0);
  tic(T(1, SC.gancho.abducens), 0.1, 1800);
  const tm = T(1, SC.gancho.musculo);
  [[0, 69], [0.12, 76], [0.24, 81]].forEach(([d, n]) => campana(tm + d, n, 0.07, 1.4)); chispas(tm, 0.2, 0.06);
}

/* 3 · ESCENA 2: LR6 SO4 y el resto 3 */
{
  campana(T(2, SC.regla.truco) + 0.2, 57, 0.06, 1.0);
  const t6 = T(2, SC.regla.seis); moneda(t6, 0.05); campana(t6, 69, 0.07, 1.0);
  const t4 = T(2, SC.regla.cuatro); moneda(t4, 0.05); campana(t4, 73, 0.07, 1.0);
  const t3 = T(2, SC.regla.tres); moneda(t3, 0.05); campana(t3, 76, 0.07, 1.0); campana(t3 + 0.35, 81, 0.06, 1.4);
}

/* 4 · ESCENA 3: núcleo y mirada conjugada */
{
  campana(T(3, SC.nucleo.puente) + 0.2, 62, 0.06, 1.0);
  const tc = T(3, SC.nucleo.coordina);
  soplo(tc, 1.0, 0.05, 1200); subida(tc, 0.8, 400, 1500, 0.035); for (let k = 0; k < 9; k++) tic(tc + 0.2 + k * 0.15, 0.05, 1700 + 70 * k);
  const ta = T(3, SC.nucleo.afuera);
  campana(ta, 69, 0.06, 1.0); campana(ta + 0.9, 76, 0.06, 1.2); chispas(ta + 0.9, 0.2, 0.05);
}

/* 5 · ESCENA 4: clivus y canal de Dorello */
{
  const ts = T(4, SC.dorello.sube);
  campana(ts + 0.2, 57, 0.06, 1.0); for (let k = 0; k < 10; k++) tic(ts + 0.4 + k * 0.17, 0.04, 1500 + 80 * k);
  tic(T(4, SC.dorello.canal), 0.12, 1900);
  const ta = T(4, SC.dorello.anclado);
  golpe(ta, 0.3, 56); campana(ta, 64, 0.06, 1.2); crujir(ta, 0.08);
}

/* 6 · ESCENA 5: presión y estiramiento */
{
  const tp = T(5, SC.presion.presion);
  campana(tp + 0.2, 55, 0.06, 1.2); for (let k = 0; k < 4; k++) golpe(tp + 0.6 + k * 0.4, 0.12, 60);
  tic(T(5, SC.presion.anclado), 0.12, 1700);
  const te = T(5, SC.presion.estira);
  subida(te, 1.0, 300, 1100, 0.04); golpe(te + 0.8, 0.34, 50); crujir(te + 0.8, 0.14);
  const to = T(5, SC.presion.ojo);
  chispas(to, 0.25, 0.07); soplo(to, 0.6, 0.04, 900);
}

/* 7 · ESCENA 6: falso signo localizador */
{
  campana(T(6, SC.falso.falso) + 0.2, 55, 0.06, 1.2);
  const tl = T(6, SC.falso.lejos);
  soplo(tl, 1.4, 0.05, 700); for (let k = 0; k < 6; k++) tic(tl + 0.3 + k * 0.3, 0.05, 1500 + 80 * k);
  const tm = T(6, SC.falso.masa);
  golpe(tm, 0.34, 52); chispas(tm, 0.3, 0.08); campana(tm + 0.2, 64, 0.06, 1.4);
}

/* 8 · ESCENA 7: síndrome de Duane */
{
  campana(T(7, SC.duane.nacen) + 0.2, 62, 0.06, 1.0);
  tic(T(7, SC.duane.duane), 0.12, 1800); campana(T(7, SC.duane.duane), 69, 0.05, 1.0);
  const to = T(7, SC.duane.oculo);
  soplo(to, 0.8, 0.05, 1100); for (let k = 0; k < 6; k++) tic(to + 0.2 + k * 0.14, 0.05, 2000 + 80 * k);
  const tr = T(7, SC.duane.retrae);
  golpe(tr, 0.28, 56); crujir(tr, 0.08);
}

/* 9 · ESCENA 8: consulta */
{
  const td = T(8, SC.consulta.doble) + 0.2;
  chispas(td, 0.3, 0.07); subida(td, 0.4, 400, 1500, 0.03);
  const tm = T(8, SC.consulta.medico);
  campana(tm, 64, 0.07, 1.4); campana(tm + 0.14, 71, 0.05, 1.2); golpe(tm, 0.2, 58);
  const ta = T(8, SC.consulta.avisar);
  tic(ta, 0.1, 1800); [[0.5, 50], [0.6, 57], [0.7, 62]].forEach(([d, n]) => campana(ta + d, n, 0.06, 2.0));
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
const salida = join(RAIZ, "assets", "musica", "par-craneal-6.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
