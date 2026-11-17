#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «El par craneal X: el vago, el nervio errante» (67,2 s).
 * Tono: asombro y curiosidad cotidiana (el errante, la tos del oído, la jirafa) con un tramo serio (el corazón que se frena, el implante) y el aviso rápido de «síguenos» al inicio.
 * Pista de «música» del motor: colchón armónico + eventos alineados con lo que se ve (los tiempos usan el ritmo REAL de cada escena).
 *
 *   colchón   acordes Do → Sol → La menor → Mi menor → Fa → Re menor → Do → La menor → Sol
 *   gancho    pops de los tres órganos (latido, soplo, burbuja) y destello del errante
 *   sigue     campanas del aviso, golpe del botón y tics de los 13 pares
 *   Loewi     chispas del estímulo, latido que se frena y campana del mensajero químico
 *   desmayo   pop de la gota, latidos lentos y golpe del desmayo
 *   oído      hisopo que se acerca y tos
 *   intestino subida y tics de las fibras que suben al cerebro
 *   jirafa    vaivén largo del nervio recurrente
 *   implante  pulsos del estimulador y calma del EEG
 *   prueba    campana de «consulta a un médico» y pregunta para comentar
 *
 * Uso:  node videos/2026-11-17-par-craneal-10/componer-musica.mjs   → assets/musica/par-craneal-10.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-10.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 69.9;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const x = new Float32Array(N);
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(181117);
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
const dur = [7.5, 4.5, 7.2, 7.2, 7.2, 7.2, 7.2, 7.2, 7.2, 4.8];
const ideal = [7.0, 4.0, 6.8, 6.8, 6.8, 6.8, 6.8, 6.8, 6.8, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TVG (y TVA.sigue) en src/anim/piezas.ts
  gancho: { par: 0.2, vago: 1.6, errante: 2.5, baja: 3.6, toca: 5.2 },
  sigue: { antes: 0.2, sigue: 1.2, pares: 2.9 },
  loewi: { ano: 0.2, loewi: 1.2, freno: 2.2, vago: 3.6, hallo: 4.6, mensajero: 5.6 },
  desmayo: { eso: 0.2, sangre: 1.2, pie: 2.4, frenar: 3.8, desmayo: 5.0, vasovagal: 6.0 },
  oido: { rama: 0.2, conducto: 2.0, personas: 3.4, tos: 4.6 },
  intestino: { habla: 0.2, estima: 1.8, mayoria: 3.2, informacion: 4.4, cerebro: 5.6 },
  jirafa: { voz: 0.2, recurrente: 1.8, baja: 3.0, jirafa: 4.6, metros: 5.6 },
  implante: { hoy: 0.2, implante: 1.2, estimula: 2.6, epilepsia: 4.2, farmacos: 5.6 },
  prueba: { desmayas: 0.2, consulta: 2.4, sangre: 4.0, comenta: 5.4 },
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
    { t: T(3, 0), notas: [33, 45, 52, 57, 60] },                    // La menor: Loewi
    { t: T(4, 0), notas: [28, 40, 47, 52, 55] },                    // Mi menor: el desmayo
    { t: T(5, 0), notas: [29, 41, 48, 53, 57, 60] },                // Fa mayor: el oído, curioso
    { t: T(6, 0), notas: [26, 38, 45, 50, 53] },                    // Re menor: el intestino
    { t: T(7, 0), notas: [36, 48, 55, 60, 64] },                    // Do mayor: la jirafa
    { t: T(8, 0), notas: [33, 45, 52, 57, 60, 64] },                // La menor: el implante
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

/* 2 · ESCENA 1: el errante */
{
  campana(T(1, SC.gancho.par) + 0.2, 55, 0.06, 1.0);
  tic(T(1, SC.gancho.vago), 0.1, 1800);
  const te = T(1, SC.gancho.errante); [[0, 64], [0.12, 69], [0.24, 76]].forEach(([d, n]) => campana(te + d, n, 0.06, 1.2));
  const tb = T(1, SC.gancho.baja); subida(tb, 1.3, 1400, 300, 0.035);
  const tt = T(1, SC.gancho.toca);
  lubdub(tt, 0.3); soplo(tt + 0.6, 0.6, 0.05, 1200); burbuja(tt + 1.2, 0.06); burbuja(tt + 1.4, 0.05); campana(tt + 1.4, 81, 0.06, 1.4);
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

/* 4 · ESCENA 3: Loewi */
{
  campana(T(3, SC.loewi.ano) + 0.2, 57, 0.06, 1.0);
  tic(T(3, SC.loewi.loewi), 0.1, 1800);
  const tf = T(3, SC.loewi.freno); chispas(tf, 0.5, 0.09); subida(tf, 0.5, 500, 1800, 0.04);
  for (let k = 0; k < 4; k++) golpe(tf + 0.4 + k * 0.45, 0.12, 62);
  const tv = T(3, SC.loewi.vago); for (let k = 0; k < 5; k++) burbuja(tv + k * 0.2, 0.05);
  const th = T(3, SC.loewi.hallo); golpe(th, 0.16, 58); golpe(th + 0.7, 0.12, 60);
  const tm = T(3, SC.loewi.mensajero); [[0, 69], [0.12, 76], [0.24, 81]].forEach(([d, n]) => campana(tm + d, n, 0.06, 1.4)); chispas(tm, 0.3, 0.06);
}

/* 5 · ESCENA 4: desmayo vasovagal */
{
  campana(T(4, SC.desmayo.eso) + 0.2, 52, 0.06, 1.2);
  const ts = T(4, SC.desmayo.sangre); burbuja(ts, 0.06); campana(ts, 64, 0.05, 1.0);
  const tp = T(4, SC.desmayo.pie); for (let k = 0; k < 5; k++) tic(tp + k * 0.18, 0.04, 1600);
  const tf = T(4, SC.desmayo.frenar); lubdub(tf, 0.3); lubdub(tf + 0.9, 0.26); lubdub(tf + 1.9, 0.2);
  const td = T(4, SC.desmayo.desmayo); golpe(td, 0.3, 52); crujir(td, 0.14); soplo(td, 0.6, 0.04, 600);
  campana(T(4, SC.desmayo.vasovagal), 55, 0.07, 1.8);
}

/* 6 · ESCENA 5: oído y tos */
{
  campana(T(5, SC.oido.rama) + 0.2, 65, 0.06, 1.0);
  tic(T(5, SC.oido.conducto), 0.1, 1800);
  const tp = T(5, SC.oido.personas); soplo(tp, 0.8, 0.03, 1500); for (let k = 0; k < 6; k++) tic(tp + 0.2 + k * 0.15, 0.04, 2200 + 60 * k);
  const tt = T(5, SC.oido.tos); golpe(tt, 0.22, 66); crujir(tt, 0.14); crujir(tt + 0.25, 0.12); crujir(tt + 0.5, 0.1);
}

/* 7 · ESCENA 6: el intestino habla */
{
  campana(T(6, SC.intestino.habla) + 0.2, 62, 0.06, 1.0);
  tic(T(6, SC.intestino.estima), 0.1, 1700);
  const tm = T(6, SC.intestino.mayoria); subida(tm, 1.2, 300, 1500, 0.035); for (let k = 0; k < 10; k++) tic(tm + 0.1 + k * 0.11, 0.045, 1700 + 80 * k);
  tic(T(6, SC.intestino.informacion), 0.1, 1900);
  const tc = T(6, SC.intestino.cerebro); [[0, 74], [0.12, 79], [0.24, 83]].forEach(([d, n]) => campana(tc + d, n, 0.06, 1.4)); chispas(tc, 0.25, 0.05);
}

/* 8 · ESCENA 7: la jirafa y el recurrente */
{
  campana(T(7, SC.jirafa.voz) + 0.2, 60, 0.06, 1.0);
  tic(T(7, SC.jirafa.recurrente), 0.1, 1800);
  const tb = T(7, SC.jirafa.baja); subida(tb, 1.2, 1200, 300, 0.035); subida(tb + 1.2, 0.5, 300, 700, 0.03);
  const tj = T(7, SC.jirafa.jirafa); campana(tj, 67, 0.06, 1.2); subida(tj, 2.0, 300, 1300, 0.04);
  const tm = T(7, SC.jirafa.metros); campana(tm, 79, 0.06, 1.6); moneda(tm, 0.05);
}

/* 9 · ESCENA 8: el implante */
{
  campana(T(8, SC.implante.hoy) + 0.2, 57, 0.06, 1.0);
  tic(T(8, SC.implante.implante), 0.1, 1800);
  const te = T(8, SC.implante.estimula); for (let k = 0; k < 10; k++) tic(te + k * 0.1, 0.06, 2600); chispas(te, 0.9, 0.07);
  const tp = T(8, SC.implante.epilepsia); campana(tp, 69, 0.06, 1.4); campana(tp + 0.2, 76, 0.05, 1.4);
  const tf = T(8, SC.implante.farmacos); campana(tf, 81, 0.06, 1.4); moneda(tf, 0.05);
}

/* 10 · ESCENA 9: consulta y pregunta para comentar */
{
  tic(T(9, SC.prueba.desmayas) + 0.2, 0.1, 1800);
  const tc = T(9, SC.prueba.consulta); campana(tc, 64, 0.07, 1.4); campana(tc + 0.14, 71, 0.05, 1.2);
  const ts = T(9, SC.prueba.sangre); burbuja(ts, 0.06); campana(ts, 69, 0.05, 1.0);
  const tm = T(9, SC.prueba.comenta); tic(tm, 0.1, 2200); campana(tm, 81, 0.06, 1.4);
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
const salida = join(RAIZ, "assets", "musica", "par-craneal-10.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
