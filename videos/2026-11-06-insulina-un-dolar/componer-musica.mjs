#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «La inyección que cambió todo» (63,3 s). Tono: esperanza cálida que nace de un hospital sombrío.
 * Pista de «música» del motor: colchón armónico + latido + eventos alineados con lo que se ve (los tiempos usan el ritmo REAL de cada escena).
 *
 *   colchón     acordes suaves La menor → Fa → Re menor (la primera inyección falla) → Do mayor (funciona) → Sol → Re mayor
 *   latido      débil y lento en la sala del hospital; fuerte y firme cuando el niño mejora y al final
 *   gancho      pop del calendario, tics del contador de 135 años, campana del Día Mundial y moneda de un dólar
 *   hambre      respiración lenta, golpe grave de «mortal» y choque de cubiertos contra el plato
 *   perros      vidrio, burbujeo del extracto, chispa y barrido descendente del azúcar en sangre
 *   inyecciones pitidos de la báscula, whoosh de la jeringa, golpe de la reacción y burbujeo que aclara el extracto
 *   Nobel       campanas de la medalla y reparto de la mitad
 *   patente     golpe de la moneda, campana y pops de los frascos que se fabrican
 *   hoy         pings del mundo que se enciende y gran acorde de alivio
 *
 * Uso:  node videos/2026-11-06-insulina-un-dolar/componer-musica.mjs   → assets/musica/insulina-un-dolar.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/insulina-un-dolar.wav   (y --restaurar al terminar; el WAV no va a git)
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
const R = prng(181895);
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
const dur = [8.8, 6.7, 7.4, 7.3, 7.8, 6.7, 7.4, 6.4, 4.8];
const ideal = [7.8, 6.1, 6.8, 6.8, 6.8, 5.9, 6.8, 5.9, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TIN en src/anim/piezas.ts
  gancho: { calendario: 0.2, banting: 0.9, aniosDur: 1.6, sabado: 2.6, dia: 3.3, dolar: 6.0 },
  hambre: { sala: 0.2, mortal: 1.6, dieta: 3.6 },
  perros: { toronto: 0.2, doctores: 2.3, extracto: 4.3, baja: 5.3 },
  primera: { fecha: 0.2, nino: 3.0, inyeccion: 4.7, fallo: 6.1 },
  segunda: { collip: 0.2, filtro: 0.6, fecha: 1.9, inyeccion: 3.3, reloj: 4.7, mejora: 5.7 },
  nobel: { medalla: 0.2, nombres: 1.6, comparten: 3.3 },
  patente: { doc: 0.2, dolar: 3.0, fabrica: 4.3 },
  hoy: { mundo: 0.2, dia: 3.0, circulo: 4.2 },
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
    { t: 0, notas: [33, 45, 52, 57, 60] },                  // La menor
    { t: T(3, 0), notas: [29, 41, 48, 53, 57, 60] },        // Fa mayor
    { t: T(4, 0), notas: [38, 45, 53, 57] },                // Re menor: la primera inyección
    { t: T(5, SC.segunda.filtro), notas: [36, 48, 55, 60, 64] }, // Do mayor: funciona
    { t: T(7, 0), notas: [31, 43, 50, 55, 59] },            // Sol mayor
    { t: T(8, SC.hoy.dia) - 0.3, notas: [38, 45, 54, 62, 66, 69] }, // Re mayor: alivio
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

/* 2 · ESCENA 1: calendario, años, día mundial y moneda de un dólar */
{
  tic(T(1, SC.gancho.calendario) + 0.15, 0.1, 1700);
  ticsContador(T(1, SC.gancho.banting), SC.gancho.aniosDur * rit[0], easeOut, 135, 0.045, 1800, 3400);
  campana(T(1, SC.gancho.banting) + SC.gancho.aniosDur * rit[0], 69, 0.07, 1.2);
  tic(T(1, SC.gancho.sabado), 0.1, 1600);
  const td = T(1, SC.gancho.dia);
  [[0, 62], [0.1, 69], [0.2, 74], [0.3, 78]].forEach(([d, n]) => campana(td + d, n, 0.08, 1.6));
  const tm = T(1, SC.gancho.dolar);
  moneda(tm, 0.09); golpe(tm, 0.22, 60); campana(tm + 0.1, 81, 0.07, 1.2);
}

/* 3 · ESCENA 2: la sala del hospital */
{
  for (let g = T(2, SC.hambre.sala) + 0.3; g < T(2, SC.hambre.mortal); g += 1.25) lubdub(g, 0.16);                // latido débil y lento
  const tm = T(2, SC.hambre.mortal);
  golpe(tm, 0.4, 52); soplo(tm, 1.2, 0.05, 500);
  for (let g = tm + 0.4; g < T(2, SC.hambre.dieta); g += 1.2) soplo(g, 0.8, 0.03, 700);                          // respiración lenta
  const td = T(2, SC.hambre.dieta);
  tic(td, 0.12, 3000); tic(td + 0.35, 0.1, 2600);                                                               // cubiertos contra el plato
}

/* 4 · ESCENA 3: perros y gráfico */
{
  tic(T(3, SC.perros.toronto) + 0.2, 0.1, 1700); campana(T(3, SC.perros.doctores), 62, 0.06, 1.0);
  const te = T(3, SC.perros.extracto);
  for (let g = te; g < te + 0.9; g += 0.05 + R() * 0.08) burbuja(g, 0.03);
  subida(te, 0.6, 300, 1400, 0.04); tic(te + 0.1, 0.12, 1400);
  const tb = T(3, SC.perros.baja), w = osc((g) => lerp(1400, 400, easeOut((g - tb) / 1.2)));
  add(tb, 1.3, (t, g) => 0.04 * w(g) * sua(t, 0, 0.1) * (1 - sua(t, 1.0, 1.3)));                               // barrido: el azúcar baja
  campana(tb + 1.2, 72, 0.08, 1.4); campana(tb + 1.35, 79, 0.06, 1.4);
}

/* 5 · ESCENA 4: la primera inyección */
{
  tic(T(4, SC.primera.fecha) + 0.2, 0.1, 1700);
  const tn = T(4, SC.primera.nino);
  campana(tn, 57, 0.06, 1.0);
  for (let g = tn + 0.2, k = 0; g < tn + 1.4; k++, g += 0.12) pitido(g, 1500 + 80 * k, 0.05);                  // báscula digital
  const ti = T(4, SC.primera.inyeccion);
  soplo(ti, 0.6, 0.06, 2500); tic(ti + 0.7, 0.14, 1800);
  const tf = T(4, SC.primera.fallo);
  golpe(tf, 0.42, 52); add(tf, 0.8, (t) => 0.05 * (Math.sin(TAU * 98 * t) + Math.sin(TAU * 103.5 * t)) * ex(t, 0.3));
}

/* 6 · ESCENA 5: purificación y segunda inyección */
{
  const tf = T(5, SC.segunda.filtro);
  for (let g = tf; g < tf + 1.4; g += 0.05 + R() * 0.07) burbuja(g, 0.03);
  subida(tf, 1.4, 200, 1200, 0.04);
  tic(T(5, SC.segunda.fecha), 0.1, 1700);
  const ti = T(5, SC.segunda.inyeccion);
  soplo(ti, 0.6, 0.06, 2500); tic(ti + 0.7, 0.14, 1800);
  const tr = T(5, SC.segunda.reloj);
  for (let g = tr, k = 0; g < tr + 1.0; k++, g += lerp(0.2, 0.08, (g - tr) / 1.0)) tic(g, 0.06, k % 2 ? 1500 : 2000);
  const tm = T(5, SC.segunda.mejora);
  [[0, 60], [0.1, 67], [0.2, 72], [0.3, 76], [0.4, 79]].forEach(([d, n]) => campana(tm + d, n, 0.08, 1.8));
  lubdub(tm, 0.42); lubdub(tm + 0.8, 0.4);
}

/* 7 · ESCENA 6: Nobel y reparto */
{
  const tm = T(6, SC.nobel.medalla);
  [[0.2, 65], [0.3, 72], [0.4, 77]].forEach(([d, n]) => campana(tm + d, n, 0.08, 1.6));
  tic(T(6, SC.nobel.nombres), 0.12, 1700);
  const tc = T(6, SC.nobel.comparten);
  moneda(tc, 0.06); moneda(tc + 0.4, 0.06); campana(tc, 76, 0.06, 1.0); campana(tc + 0.4, 81, 0.06, 1.0);
}

/* 8 · ESCENA 7: patente y frascos */
{
  tic(T(7, SC.patente.doc) + 0.2, 0.1, 1500);
  const td = T(7, SC.patente.dolar);
  golpe(td, 0.36, 56); moneda(td, 0.1); campana(td + 0.05, 69, 0.08, 1.4); campana(td + 0.2, 76, 0.06, 1.4);
  for (let i = 0; i < 6; i++) { const g = T(7, SC.patente.fabrica) + i * 0.28; tic(g, 0.1, 1400 + i * 120); campana(g, 72 + i * 2, 0.03, 0.4); }
}

/* 9 · ESCENA 8: el mundo y el día */
{
  for (let i = 0; i < 34; i++) { const g = T(8, SC.hoy.mundo) + 0.3 + (Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1)) * 2.4; campana(g, 74 + [0, 2, 4, 7, 9][i % 5] + 12 * (i % 4 === 0 ? 1 : 0), 0.02, 0.35); }
  const td = T(8, SC.hoy.dia);
  [[0, 50], [0.1, 57], [0.2, 62], [0.3, 66], [0.4, 69], [0.5, 74]].forEach(([d, n]) => campana(td + d, n, 0.08, 2.0));
  const tc = T(8, SC.hoy.circulo);
  campana(tc, 81, 0.07, 1.2); lubdub(tc + 0.05, 0.4);
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
const salida = join(RAIZ, "assets", "musica", "insulina-un-dolar.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
