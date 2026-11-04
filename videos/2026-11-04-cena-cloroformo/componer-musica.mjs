#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «La cena en que tres médicos se durmieron» (62,4 s). Tono: salón victoriano a la luz de las velas, misterio cálido que se abre a alivio.
 * Pista de «música» del motor: colchón armónico + crepitar de velas + eventos alineados con lo que se ve (los tiempos usan el ritmo REAL de cada escena).
 *
 *   colchón      acordes suaves Re menor → Si bemol → Sol menor → Fa → Re mayor (el alivio de la anestesia moderna)
 *   velas        crepitar suave de llamas y madera durante toda la pista
 *   contador     tics mientras corre el 179, golpes sordos cuando caen los tres médicos y campana al decir «a propósito»
 *   cronómetro   tictac que acelera durante la «carrera», golpe grave de la amputación y cuenta final de los 30 s
 *   anfiteatro   murmullo de público, campanas del éter que funciona, chasquido de vidrio y siseo del olor fuerte
 *   frascos      choques de vidrio y golpecitos graves por cada sustancia descartada; burbujeo y destello del cloroformo
 *   noche        respiración al inhalar, murmullo de charla, golpes sordos al desplomarse y silencio grave
 *   despertar    campana de la idea, tics del calendario y nana de campanitas del parto
 *   reina        órgano grave de iglesia, fanfarria suave de campanas y pop final
 *   cierre       golpe del sello «ya no se usa», barrido del camino y pitidos del monitor moderno
 *
 * Uso:  node videos/2026-11-04-cena-cloroformo/componer-musica.mjs   → assets/musica/cena-cloroformo.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/cena-cloroformo.wav   (y --restaurar al terminar; el WAV no va a git)
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
const dur = [7.8, 8.3, 8.3, 6.0, 6.4, 6.6, 7.8, 6.4, 4.8];
const ideal = [7.3, 7.8, 7.8, 5.6, 6.0, 6.2, 7.3, 5.9, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TAN en src/anim/piezas.ts
  gancho: { fecha: 0.2, anios: 1.6, aniosDur: 1.6, cae: 3.8, cena: 5.0, proposito: 6.1 },
  carrera: { titulo: 0.2, carrera: 1.6, liston: 3.0, cuenta: 4.3, pierna: 5.4, treinta: 6.4 },
  eter: { fecha: 0.2, funciona: 3.0, boston: 4.0, irrita: 5.7, olor: 6.4 },
  busca: { edimburgo: 0.2, simpson: 0.9, mejor: 2.3, prueba: 3.3, ayudantes: 4.3, cloro: 5.0 },
  noche: { inhalan: 0.9, charla: 2.6, caen: 4.3, silencio: 5.2 },
  despierta: { ojos: 0.2, idea: 0.9, busca: 2.3, dias: 3.3, partos: 4.3 },
  reina: { critica: 0.2, fecha: 1.9, reina: 4.3, parto: 6.4 },
  cierre: { ya: 0.9, camino: 2.3, moderna: 4.7 },
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

/* 1 · COLCHÓN: acordes suaves + crepitar de velas */
{
  const acordes = [
    { t: 0, notas: [38, 45, 53, 57] },                      // Re menor
    { t: T(3, 0), notas: [34, 46, 53, 57, 62] },            // Si bemol
    { t: T(5, 0), notas: [43, 50, 53, 58, 62] },            // Sol menor
    { t: T(6, 0), notas: [41, 48, 53, 57, 60] },            // Fa mayor: el hallazgo
    { t: T(8, SC.cierre.moderna) - 0.4, notas: [38, 45, 54, 62, 66, 69] }, // Re mayor: alivio
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
  for (let g = 0.5; g < 58; g += 0.25 + R() * 0.7) tic(g, 0.012 + 0.02 * R(), 600 + R() * 1400);                 // crepitar de las velas
}

/* 2 · ESCENA 1: contador de años, golpes al caer los médicos y «a propósito» */
{
  ticsContador(T(1, SC.gancho.anios), SC.gancho.aniosDur * rit[0], easeOut, 179, 0.045, 1800, 3400);
  campana(T(1, SC.gancho.anios) + SC.gancho.aniosDur * rit[0], 62, 0.07, 1.2);
  [0, 0.45, 0.9].forEach((d, i) => { const tt = T(1, SC.gancho.cae) + d; golpe(tt, 0.34, 58 - i * 4); crujir(tt, 0.12); });
  murmullo(T(1, 0) + 0.2, T(1, SC.gancho.cae) - 0.4, 0.03);
  const tp = T(1, SC.gancho.proposito);
  campana(tp, 69, 0.08, 1.4); campana(tp + 0.14, 76, 0.06, 1.4);
}

/* 3 · ESCENA 2: cronómetro y carrera */
{
  const t0 = T(2, SC.carrera.carrera), t1 = T(2, SC.carrera.treinta);
  for (let g = t0, k = 0; g < t1; k++) { tic(g, k % 4 === 0 ? 0.12 : 0.07, k % 2 ? 2200 : 2800); g += lerp(0.2, 0.11, (g - t0) / (t1 - t0)); }     // tictac que acelera
  campana(T(2, SC.carrera.liston), 57, 0.06, 0.8);
  tic(T(2, SC.carrera.cuenta), 0.1, 1700);
  golpe(T(2, SC.carrera.pierna), 0.4, 52); crujir(T(2, SC.carrera.pierna), 0.1);
  ticsContador(t1, 1.0, (k) => k, 30, 0.05, 2000, 3600);
  campana(t1 + 1.1, 50, 0.08, 1.8);
}

/* 4 · ESCENA 3: anfiteatro, éter */
{
  murmullo(T(3, 0), dur[2] - 0.3, 0.035);
  const tf = T(3, SC.eter.funciona);
  [[0, 72], [0.12, 79]].forEach(([d, n]) => campana(tf + d, n, 0.08, 1.4));
  tic(T(3, SC.eter.boston), 0.14, 1500); tic(T(3, SC.eter.boston) + 0.04, 0.09, 900);                     // chasquido de vidrio
  const ti = T(3, SC.eter.irrita);
  add(ti, 0.7, (t) => 0.05 * (Math.sin(TAU * 98 * t) + Math.sin(TAU * 103.5 * t)) * ex(t, 0.3)); golpe(ti, 0.2, 60);   // disonancia breve
  subida(T(3, SC.eter.olor), 0.9, 300, 1100, 0.03); soplo(T(3, SC.eter.olor), 1.0, 0.05, 2500);
}

/* 5 · ESCENA 4: frascos descartados y cloroformo */
{
  for (let i = 0; i < 5; i++) { const tt = T(4, SC.busca.prueba - 0.5 + i * 0.42); tic(tt, 0.13, 1600); tic(tt + 0.03, 0.08, 1000); golpe(tt + 0.05, 0.16, 62); }
  campana(T(4, SC.busca.simpson), 62, 0.06, 0.8);
  tic(T(4, SC.busca.ayudantes), 0.1, 1700);
  const tc = T(4, SC.busca.cloro);
  for (let g = tc; g < tc + 0.9; g += 0.05 + R() * 0.08) burbuja(g, 0.03);
  subida(tc, 0.6, 300, 1400, 0.04); campana(tc + 0.4, 74, 0.09, 1.4); campana(tc + 0.55, 81, 0.06, 1.4);
}

/* 6 · ESCENA 5: la noche del cloroformo */
{
  const ti = T(5, SC.noche.inhalan);
  soplo(ti, 1.1, 0.07, 1800); soplo(ti + 1.3, 0.9, 0.06, 1600);                                           // respiraciones
  murmullo(T(5, SC.noche.charla), T(5, SC.noche.caen) - T(5, SC.noche.charla), 0.06, 700);
  [0, 0.5, 0.9].forEach((d) => campana(T(5, SC.noche.charla) + d, 76 + Math.floor(R() * 3) * 2, 0.025, 0.25));
  [0, 0.35, 0.7].forEach((d, i) => { const tt = T(5, SC.noche.caen) + d; golpe(tt, 0.36, 56 - i * 3); crujir(tt, 0.14); });
  const ts = T(5, SC.noche.silencio);
  add(ts, 1.5, (t) => 0.05 * Math.sin(TAU * 49 * t) * sua(t, 0, 0.4) * (1 - sua(t, 0.8, 1.5)));              // silencio grave
}

/* 7 · ESCENA 6: despertar, idea, calendario y parto */
{
  soplo(T(6, SC.despierta.ojos), 0.9, 0.06, 1500);
  const ti = T(6, SC.despierta.idea);
  campana(ti, 81, 0.1, 1.4); campana(ti + 0.1, 88, 0.06, 1.2);
  const tb = T(6, SC.despierta.busca);
  [[0, 65], [0.1, 69], [0.2, 72]].forEach(([d, n]) => campana(tb + d, n, 0.06, 1.2));
  ticsContador(T(6, SC.despierta.dias), 0.9, (k) => k, 5, 0.06, 1800, 2600);
  const tp = T(6, SC.despierta.partos);
  [[0, 77], [0.3, 81], [0.6, 84], [0.9, 81]].forEach(([d, n]) => campana(tp + d, n, 0.05, 1.0));        // nana de campanitas
}

/* 8 · ESCENA 7: críticas y reina */
{
  const tc = T(7, SC.reina.critica);
  add(tc, 2.2, (t) => 0.04 * (Math.sin(TAU * 73.4 * t) + 0.6 * Math.sin(TAU * 110 * t) + 0.4 * Math.sin(TAU * 174.6 * t)) * sua(t, 0, 0.5) * (1 - sua(t, 1.5, 2.2)));   // órgano grave
  tic(T(7, SC.reina.fecha), 0.1, 1700);
  const tr = T(7, SC.reina.reina);
  [[0, 62], [0.1, 69], [0.2, 74], [0.3, 78], [0.4, 81]].forEach(([d, n]) => campana(tr + d, n, 0.08, 1.8));
  golpe(tr, 0.22, 56);
  const tp = T(7, SC.reina.parto);
  campana(tp, 86, 0.05, 0.8); tic(tp, 0.1, 1600);
}

/* 9 · ESCENA 8: sello, camino y monitor */
{
  const ty = T(8, SC.cierre.ya);
  golpe(ty, 0.5, 50); crujir(ty, 0.12); add(ty, 0.7, (t) => 0.04 * (Math.sin(TAU * 98 * t) + Math.sin(TAU * 103.5 * t)) * ex(t, 0.3));
  const tc = T(8, SC.cierre.camino);
  subida(tc, 1.6, 200, 1000, 0.035); [0, 0.8, 1.6].forEach((d, i) => campana(tc + d, 69 + i * 5, 0.05, 0.8));
  const tm = T(8, SC.cierre.moderna);
  for (let g = tm; g < ini[8] - 0.2; g += 0.8) add(g, 0.09, (t) => 0.1 * Math.sin(TAU * 1000 * t) * Math.sin(Math.PI * clamp(t / 0.09)));   // monitor a 75 lpm
  [[0, 50], [0.18, 57], [0.36, 62], [0.54, 66], [0.72, 69], [0.9, 74]].forEach(([d, n]) => campana(tm + d, n, 0.07, 1.8));
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
const salida = join(RAIZ, "assets", "musica", "cena-cloroformo.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
