#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «El par craneal I: el nervio que renace» (67,1 s).
 * Tono: curiosidad científica que termina en esperanza. Pista de «música» del motor: colchón armónico + eventos alineados con lo que se ve
 * (los tiempos usan el ritmo REAL de cada escena).
 *
 *   colchón   acordes Re menor → Si bemol → Sol menor → Do → La menor → Re mayor (la recuperación)
 *   gancho    tics de neuronas grises y pops verdes cuando las del olfato renacen
 *   mucosa    barrido del aire y golpe de las neuronas dañadas
 *   ciclo     tics del reloj de 1–3 meses y pops de las células madre
 *   receptor  tics de la cuadrícula de 400 receptores y chispas de cada olor
 *   axones    campana de la lámina cribosa y tics de los axones nuevos
 *   memoria   pops de la amígdala y el hipocampo y destello del recuerdo
 *   daño      golpe del trauma, barrido del virus y pop de las células de soporte
 *   recupera  pops de los cuatro frascos y acorde final de esperanza
 *
 * Uso:  node videos/2026-11-09-par-craneal-1/componer-musica.mjs   → assets/musica/par-craneal-1.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-1.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 69.8;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const x = new Float32Array(N);
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(91109);
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
const dur = [7.8, 7.8, 7.8, 8.5, 7, 8.1, 7.8, 7.5, 4.8];
const ideal = [7.3, 7.3, 7.3, 8, 6.6, 7.6, 7.3, 7, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TOL en src/anim/piezas.ts
  gancho: { mayoria: 0.3, pero: 3.3, par: 4.6, renuevan: 6.0 },
  mucosa: { techo: 0.2, aire: 2.4, dano: 4.8 },
  ciclo: { ratones: 0.2, meses: 1.1, madre: 4.0, nuevas: 5.7 },
  receptor: { uno: 0.2, cuatro: 3.0, olor: 5.8 },
  axones: { cruzan: 0.2, nuevas: 3.0, bulbo: 5.4 },
  memoria: { bulbo: 0.2, amigdala: 1.6, hipocampo: 3.3, recuerdo: 5.4 },
  dano: { golpe: 0.2, covid: 3.6, soporte: 5.4, noneuronas: 6.6 },
  recupera: { recuperan: 0.2, entrena: 3.9, cuatro: 5.0, estudios: 6.3 },
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
    { t: T(2, 0), notas: [34, 46, 53, 58, 62] },                    // Si bemol mayor: el aire
    { t: T(4, 0), notas: [31, 43, 50, 55, 58] },                    // Sol menor: receptores
    { t: T(6, 0), notas: [36, 48, 55, 60, 64] },                    // Do mayor: memoria
    { t: T(7, 0), notas: [33, 45, 52, 57, 60] },                    // La menor: el daño
    { t: T(8, SC.recupera.entrena) - 0.3, notas: [38, 45, 54, 62, 66, 69] }, // Re mayor: recuperación
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

/* 2 · ESCENA 1: neuronas que no se reemplazan vs las del olfato */
{
  const tm = T(1, SC.gancho.mayoria) + 0.2;
  for (let k = 0; k < 6; k++) tic(tm + k * 0.09, 0.05, 1500 + 80 * k);
  tic(T(1, SC.gancho.pero), 0.1, 1800);
  for (let k = 0; k < 6; k++) tic(T(1, SC.gancho.pero) + 0.15 + k * 0.09, 0.05, 2000 + 80 * k);
  const tp = T(1, SC.gancho.par);
  campana(tp, 69, 0.06, 1.0);
  const tr = T(1, SC.gancho.renuevan);
  for (let k = 0; k < 6; k++) { burbuja(tr + k * 0.22, 0.04); campana(tr + k * 0.22, 74 + [0, 2, 4, 7, 9, 12][k], 0.03, 0.5); }
  chispas(tr, 0.8, 0.04);
}

/* 3 · ESCENA 2: aire y neuronas dañadas */
{
  campana(T(2, SC.mucosa.techo) + 0.1, 57, 0.06, 1.2);
  const ta = T(2, SC.mucosa.aire);
  soplo(ta, 1.6, 0.06, 1100); subida(ta, 1.2, 250, 900, 0.03);
  const td = T(2, SC.mucosa.dano);
  golpe(td, 0.3, 54); crujir(td, 0.12); golpe(td + 0.5, 0.22, 58);
  add(td, 0.8, (t) => 0.04 * (Math.sin(TAU * 98 * t) + Math.sin(TAU * 103.5 * t)) * ex(t, 0.25));
}

/* 4 · ESCENA 3: ciclo de 1–3 meses y células madre */
{
  campana(T(3, SC.ciclo.ratones) + 0.1, 62, 0.06, 1.0);
  ticsContador(T(3, SC.ciclo.meses), 1.8 * rit[2], (k) => k, 12, 0.05, 1800, 3000);
  const tm = T(3, SC.ciclo.madre);
  moneda(tm, 0.05); campana(tm, 72, 0.06, 1.0);
  for (let k = 0; k < 5; k++) burbuja(tm + 0.3 + k * 0.16, 0.035);
  const tn = T(3, SC.ciclo.nuevas);
  subida(tn, 1.4, 250, 1300, 0.04); [[0, 69], [0.12, 76], [0.24, 81]].forEach(([d, n]) => campana(tn + 1.4 + d, n, 0.06, 1.4));
}

/* 5 · ESCENA 4: receptores */
{
  campana(T(4, SC.receptor.uno) + 0.1, 64, 0.06, 1.0); tic(T(4, SC.receptor.uno) + 0.9, 0.1, 1900);
  const tc = T(4, SC.receptor.cuatro);
  ticsContador(tc, 1.6 * rit[3], easeOut, 400, 0.035, 1700, 3400);
  campana(tc + 1.6 * rit[3], 76, 0.07, 1.4);
  const to = T(4, SC.receptor.olor);
  chispas(to, 0.5, 0.07); for (let k = 0; k < 6; k++) { moneda(to + 0.1 + k * 0.07, 0.03); }
  const to2 = to + 1.1 * rit[3];
  chispas(to2, 0.5, 0.07); for (let k = 0; k < 6; k++) { moneda(to2 + 0.1 + k * 0.07, 0.03); }
}

/* 6 · ESCENA 5: axones y lámina cribosa */
{
  const tc = T(5, SC.axones.cruzan);
  campana(tc + 0.1, 57, 0.06, 1.0); for (let k = 0; k < 7; k++) tic(tc + 0.5 + k * 0.1, 0.06, 1800 + 100 * k);
  const tn = T(5, SC.axones.nuevas);
  tic(tn, 0.1, 1900); for (let g = tn + 0.2; g < tn + 2.0; g += 0.12) tic(g, 0.04, 2300);
  const tb = T(5, SC.axones.bulbo);
  [[0, 69], [0.1, 76], [0.2, 81]].forEach(([d, n]) => campana(tb + d, n, 0.07, 1.4));
}

/* 7 · ESCENA 6: amígdala, hipocampo y recuerdo */
{
  campana(T(6, SC.memoria.bulbo) + 0.1, 64, 0.06, 1.0);
  const ta = T(6, SC.memoria.amigdala);
  campana(ta, 57, 0.07, 1.2); soplo(ta, 0.6, 0.04, 800);
  const th = T(6, SC.memoria.hipocampo);
  campana(th, 69, 0.07, 1.2); soplo(th, 0.6, 0.04, 1200);
  const tr = T(6, SC.memoria.recuerdo);
  chispas(tr, 0.4, 0.06); [[0, 76], [0.12, 81], [0.24, 86]].forEach(([d, n]) => campana(tr + d, n, 0.06, 1.6)); lubdub(tr, 0.28);
}

/* 8 · ESCENA 7: golpe y COVID-19 */
{
  const tg = T(7, SC.dano.golpe) + 0.5;
  golpe(tg, 0.42, 50); crujir(tg, 0.2); chispas(tg, 0.3, 0.06);
  add(tg, 0.9, (t) => 0.05 * (Math.sin(TAU * 98 * t) + Math.sin(TAU * 103.5 * t)) * ex(t, 0.3));
  const tv = T(7, SC.dano.covid);
  soplo(tv, 1.6, 0.05, 900); subida(tv, 1.6, 900, 300, 0.03);
  const ts = T(7, SC.dano.soporte);
  golpe(ts, 0.24, 58); campana(ts, 55, 0.06, 1.2);
  tic(T(7, SC.dano.noneuronas), 0.1, 1900); campana(T(7, SC.dano.noneuronas), 72, 0.05, 1.0);
}

/* 9 · ESCENA 8: recuperación y entrenamiento */
{
  const tr = T(8, SC.recupera.recuperan);
  campana(tr + 0.1, 62, 0.06, 1.0); for (let k = 0; k < 5; k++) burbuja(tr + 0.6 + k * 0.3, 0.035);
  tic(T(8, SC.recupera.entrena), 0.1, 1800);
  const tc = T(8, SC.recupera.cuatro);
  [72, 76, 79, 84].forEach((n, k) => { moneda(tc + k * 0.28, 0.04); campana(tc + k * 0.28, n, 0.05, 0.8); });
  const te = T(8, SC.recupera.estudios);
  golpe(te, 0.26, 60);
  [[0.1, 50], [0.2, 57], [0.3, 62], [0.4, 66], [0.5, 69], [0.6, 74]].forEach(([d, n]) => campana(te + d, n, 0.08, 2.0));
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
const salida = join(RAIZ, "assets", "musica", "par-craneal-1.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
