#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «La médula espinal: el atajo del cuerpo» (67,0 s).
 * Tono: curiosidad científica con pulso nervioso y un final de esperanza.
 * Pista de «música» del motor: colchón armónico + eventos alineados con lo que se ve (los tiempos usan el ritmo REAL de cada escena).
 *
 *   colchón   acordes Re menor → Sol menor → La menor → Fa → Do → Re mayor (el puente digital)
 *   gancho    golpe del martillo, chispa del arco reflejo y tics del cerebro tachado
 *   columna   tics de la regla de 45 cm y cuenta de los 31 pares de nervios
 *   cola      golpe grave del cono medular y silbido de la aguja de la punción
 *   mariposa  pops de la sustancia gris y barrido de las autopistas blancas
 *   velocidad saltos de nodo en nodo, contador hasta 120 m/s y campana de los 432 km/h
 *   reflejo   chispa de la sartén caliente, whoosh de la mano y golpe tardío del dolor
 *   lesión    golpe de la rotura y subida del nivel de lesión
 *   puente    pulsos del decodificador y gran acorde final
 *
 * Uso:  node videos/2026-11-07-medula-espinal/componer-musica.mjs   → assets/musica/medula-espinal.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/medula-espinal.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 69.5;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const x = new Float32Array(N);
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(271107);
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
const dur = [7, 8.1, 8.1, 7.6, 8.1, 6.9, 7.6, 8.8, 4.8];
const ideal = [6.5, 7.3, 7.3, 7.1, 7.1, 6.4, 7.1, 8.1, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TME en src/anim/piezas.ts
  gancho: { golpe: 1.9, arco: 0.7, cerebro: 2.5, medula: 4.7 },
  columna: { medula: 0.2, regla: 0.6, columna: 2.6, nervios: 4.3, conteo: 5.0 },
  cola: { arriba: 0.2, lumbar: 1.6, nervios: 4.7, caballo: 6.1, puncion: 6.6 },
  mariposa: { forma: 0.2, gris: 2.3, procesa: 3.3, blanca: 5.0, autopistas: 6.4 },
  velocidad: { axon: 0.2, mielina: 1.2, cifra: 3.0, cifraDur: 1.4, kmh: 5.0 },
  reflejo: { toca: 2.4, aparta: 2.6, cerebro: 4.0, dolor: 5.6 },
  lesion: { rotura: 0.2, desconecta: 1.9, sube: 4.7, funciones: 5.7 },
  puente: { anio: 0.2, hombre: 1.6, camina: 3.6, puente: 5.4, entre: 7.1 },
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
    { t: 0, notas: [26, 38, 45, 50, 53] },                       // Re menor
    { t: T(3, 0), notas: [31, 43, 50, 55, 58] },                 // Sol menor
    { t: T(4, 0), notas: [33, 45, 52, 57, 60] },                 // La menor
    { t: T(5, 0), notas: [29, 41, 48, 53, 57, 60] },             // Fa mayor
    { t: T(7, 0), notas: [36, 48, 55, 60, 64] },                 // Do mayor
    { t: T(8, SC.puente.puente) - 0.3, notas: [38, 45, 54, 62, 66, 69] }, // Re mayor: el puente
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

/* 2 · ESCENA 1: martillo, arco reflejo, cerebro tachado, médula */
{
  const tg = T(1, SC.gancho.golpe);
  golpe(tg, 0.32, 90); crujir(tg, 0.1);
  const ta = T(1, SC.gancho.arco) + 0.2;
  chispas(tg + 0.12, 0.35, 0.09); subida(tg + 0.1, 0.3, 500, 1600, 0.04);
  for (let k = 0; k < 4; k++) tic(ta + k * 0.3, 0.05, 1500 + 150 * k);                                         // latido de fondo del cerebro
  const tc = T(1, SC.gancho.cerebro);
  golpe(tc, 0.3, 56); add(tc, 0.6, (t) => 0.04 * (Math.sin(TAU * 98 * t) + Math.sin(TAU * 103.5 * t)) * ex(t, 0.25));
  const tm = T(1, SC.gancho.medula);
  campana(tm, 74, 0.08, 1.4); campana(tm + 0.12, 81, 0.06, 1.2); lubdub(tm + 0.05, 0.3);
}

/* 3 · ESCENA 2: columna, regla de 45 cm y 31 pares */
{
  campana(T(2, SC.columna.medula) + 0.1, 62, 0.07, 1.2);
  const tr = T(2, SC.columna.regla);
  ticsContador(tr, 1.6, easeOut, 45, 0.04, 1800, 3000);
  const tn = T(2, SC.columna.nervios);
  for (let i = 0; i < 6; i++) campana(tn + i * 0.1, 69 + [0, 2, 4, 7, 9, 12][i], 0.04, 0.8);
  ticsContador(T(2, SC.columna.conteo), 2.6, (k) => k, 31, 0.045, 2200, 3600);
}

/* 4 · ESCENA 3: cono medular, cola de caballo y punción */
{
  campana(T(3, SC.cola.arriba) + 0.1, 57, 0.07, 1.2);
  golpe(T(3, SC.cola.lumbar), 0.3, 58);
  const tn = T(3, SC.cola.nervios);
  for (let g = tn; g < tn + 1.2; g += 0.07 + R() * 0.05) burbuja(g, 0.025);
  campana(T(3, SC.cola.caballo), 64, 0.06, 1.2);
  const tp = T(3, SC.cola.puncion);
  subida(tp, 0.9, 1800, 700, 0.03); tic(tp + 0.95, 0.12, 1900); soplo(tp + 0.95, 0.3, 0.03, 2200);
}

/* 5 · ESCENA 4: mariposa, sustancia gris y blanca */
{
  campana(T(4, SC.mariposa.forma) + 0.1, 69, 0.07, 1.2);
  const tg = T(4, SC.mariposa.gris);
  moneda(tg, 0.05); campana(tg, 72, 0.06, 1.0);
  for (let i = 0; i < 5; i++) burbuja(T(4, SC.mariposa.procesa) + i * 0.18, 0.04);
  const tb = T(4, SC.mariposa.blanca);
  soplo(tb, 1.2, 0.05, 1200); campana(tb + 0.2, 76, 0.05, 1.0);
  const ta = T(4, SC.mariposa.autopistas);
  subida(ta, 1.0, 400, 1500, 0.04); for (let i = 0; i < 5; i++) tic(ta + i * 0.2, 0.06, 1500 + 200 * i);
}

/* 6 · ESCENA 5: axón, saltos y 120 m/s */
{
  campana(T(5, SC.velocidad.axon) + 0.1, 62, 0.06, 1.0);
  const tm = T(5, SC.velocidad.mielina);
  for (let k = 0; k < 7; k++) { tic(tm + 0.15 + k * 0.22, 0.07, 2400 + 140 * k); }                              // saltos de nodo en nodo
  const tc = T(5, SC.velocidad.cifra);
  ticsContador(tc, SC.velocidad.cifraDur * rit[4], easeOut, 120, 0.045, 1800, 3400);
  campana(tc + SC.velocidad.cifraDur * rit[4], 72, 0.07, 1.2);
  const tk = T(5, SC.velocidad.kmh);
  golpe(tk, 0.28, 64); subida(tk, 0.5, 300, 1800, 0.05);
  [[0.1, 69], [0.2, 76], [0.3, 81]].forEach(([d, n]) => campana(tk + d, n, 0.07, 1.4));
}

/* 7 · ESCENA 6: sartén caliente y mano que se aparta */
{
  const tt = T(6, SC.reflejo.toca);
  chispas(tt, 0.4, 0.1); crujir(tt, 0.08);
  const ta = T(6, SC.reflejo.aparta);
  soplo(ta, 0.4, 0.07, 1800); subida(ta, 0.3, 400, 1600, 0.04);
  const tc = T(6, SC.reflejo.cerebro);
  for (let k = 0; k < 4; k++) tic(tc + k * 0.25, 0.05, 1500 + 120 * k);
  const td = T(6, SC.reflejo.dolor);
  golpe(td, 0.34, 54); chispas(td, 0.5, 0.08); campana(td + 0.1, 57, 0.06, 1.0);
}

/* 8 · ESCENA 7: lesión */
{
  const tr = T(7, SC.lesion.rotura);
  golpe(tr + 0.1, 0.4, 50); crujir(tr + 0.1, 0.2); add(tr + 0.1, 0.8, (t) => 0.05 * (Math.sin(TAU * 98 * t) + Math.sin(TAU * 103.5 * t)) * ex(t, 0.3));
  const td = T(7, SC.lesion.desconecta);
  soplo(td, 1.0, 0.04, 500); campana(td, 55, 0.05, 1.4);
  const ts = T(7, SC.lesion.sube);
  subida(ts, 1.0, 250, 1000, 0.04); for (let k = 0; k < 4; k++) tic(ts + 0.1 + k * 0.22, 0.06, 1700 + 160 * k);
  const tf = T(7, SC.lesion.funciones);
  for (let k = 0; k < 3; k++) { golpe(tf + k * 0.35, 0.18, 62 - 4 * k); }
}

/* 9 · ESCENA 8: puente digital */
{
  campana(T(8, SC.puente.anio) + 0.1, 62, 0.06, 1.0);
  const th = T(8, SC.puente.hombre);
  moneda(th, 0.04); tic(th + 0.1, 0.07, 1700);
  const tw = T(8, SC.puente.camina);
  for (let k = 0; k < 6; k++) { golpe(tw + k * 0.42, 0.15, 70); tic(tw + k * 0.42 + 0.02, 0.05, 1500); }      // pasos con muletas
  const tp = T(8, SC.puente.puente);
  for (let k = 0; k < 8; k++) campana(tp + k * 0.12, 62 + [0, 4, 7, 9, 12, 16, 19, 24][k], 0.05, 1.2);
  chispas(tp, 0.8, 0.05);
  const te = T(8, SC.puente.entre);
  [[0, 50], [0.1, 57], [0.2, 62], [0.3, 66], [0.4, 69], [0.5, 74]].forEach(([d, n]) => campana(te + d, n, 0.08, 2.0));
  lubdub(te + 0.05, 0.35);
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
const salida = join(RAIZ, "assets", "musica", "medula-espinal.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
