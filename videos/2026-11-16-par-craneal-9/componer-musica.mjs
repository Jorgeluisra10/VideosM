#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «El par craneal IX: el nervio de la arcada y la presión» (67,5 s).
 * Tono: cotidiano y curioso (arcada con el cepillo) que baja a tensión sobria en el dolor y el desmayo, con el aviso rápido de «síguenos» al inicio.
 * Pista de «música» del motor: colchón armónico + eventos alineados con lo que se ve (los tiempos usan el ritmo REAL de cada escena).
 *
 *   colchón   acordes Do → Sol → La menor → Re menor → Fa → Mi menor → Si menor sobrio → Mi menor → Sol
 *   gancho    campana del nervio, golpe de la arcada con el cepillo, destello de la presión
 *   sigue     campanas del aviso, golpe del botón y tics de los 13 pares
 *   par       pops de sabor, sensibilidad y saliva
 *   arcada    tics del toque, subida del aviso del IX, pop del vago y golpe de la arcada
 *   sin       tics de las 10 personas y campanas del «uno de cada tres»
 *   presión   latido del seno carotídeo, subida hacia el cerebro y chispa del aviso
 *   neuralgia rayo del dolor, burbuja de tragar y soplo del bostezo
 *   síncope   latidos que se detienen, pausa y golpe del desmayo
 *   prueba    campana de «consulta a un médico», pops de los iconos y campana de la pregunta
 *
 * Uso:  node videos/2026-11-16-par-craneal-9/componer-musica.mjs   → assets/musica/par-craneal-9.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-9.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 70.2;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const x = new Float32Array(N);
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(171116);
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
const dur = [7.0, 4.5, 6.2, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 4.8];
const ideal = [6.5, 4.0, 5.8, 7.0, 7.0, 7.0, 7.0, 7.0, 7.0, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TGL (y TVA.sigue) en src/anim/piezas.ts
  gancho: { nervio: 0.2, arcada: 2.0, cepillo: 3.3, presion: 5.0 },
  sigue: { antes: 0.2, sigue: 1.2, pares: 2.9 },
  par: { par: 0.2, glosofaringeo: 1.5, sabor: 2.7, sensibilidad: 4.2, saliva: 5.2 },
  arcada: { toca: 0.2, garganta: 2.2, aviso: 3.6, vago: 5.0, arcada: 6.0 },
  sin: { wow: 0.2, estudio: 1.2, tercio: 2.5, sanos: 3.7, sinArcada: 4.6, bien: 6.0 },
  presion: { cuello: 0.2, sensor: 2.0, seno: 3.4, vigila: 4.6, avisa: 5.8 },
  neuralgia: { rara: 0.2, neuralgia: 1.8, dolor: 3.2, tragar: 5.0, bostezar: 6.0 },
  sincope: { pocos: 0.2, dolor: 1.6, desmayos: 3.0, cree: 4.4, frena: 5.8 },
  prueba: { dolor: 0.2, consulta: 2.6, arcadas: 4.2, comenta: 5.6 },
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
    { t: 0, notas: [24, 36, 43, 48, 52] },                          // Do mayor: curiosidad cotidiana
    { t: T(2, 0), notas: [31, 43, 50, 55, 59] },                    // Sol mayor: el aviso, luminoso
    { t: T(3, 0), notas: [33, 45, 52, 57, 60] },                    // La menor: el nervio
    { t: T(4, 0), notas: [26, 38, 45, 50, 53] },                    // Re menor: la arcada
    { t: T(5, 0), notas: [29, 41, 48, 53, 57, 60] },                // Fa mayor: el dato wow
    { t: T(6, 0), notas: [28, 40, 47, 52, 55] },                    // Mi menor: la presión
    { t: T(7, 0), notas: [35, 47, 54, 59, 62] },                    // Si menor sobrio: el dolor
    { t: T(8, 0), notas: [28, 40, 47, 52, 55, 59] },                // Mi menor: el desmayo
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

/* 2 · ESCENA 1: arcada con el cepillo y presión */
{
  campana(T(1, SC.gancho.nervio) + 0.2, 60, 0.06, 1.0);
  const ta = T(1, SC.gancho.arcada); soplo(ta, 0.6, 0.04, 1500); for (let k = 0; k < 5; k++) tic(ta + 0.5 + k * 0.14, 0.04, 2000 + 90 * k);
  const tc = T(1, SC.gancho.arcada) + 1.3; golpe(tc, 0.3, 58); crujir(tc, 0.12);
  const tp = T(1, SC.gancho.presion);
  [[0, 76], [0.1, 81], [0.2, 88]].forEach(([d, n]) => campana(tp + d, n, 0.06, 1.6)); chispas(tp, 0.3, 0.06);
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

/* 4 · ESCENA 3: sabor, sensibilidad y saliva */
{
  campana(T(3, SC.par.par) + 0.2, 57, 0.06, 1.0);
  tic(T(3, SC.par.glosofaringeo), 0.1, 1800);
  const tsb = T(3, SC.par.sabor); campana(tsb, 69, 0.07, 1.2); moneda(tsb, 0.05);
  const tse = T(3, SC.par.sensibilidad); campana(tse, 64, 0.06, 1.0); tic(tse, 0.1, 1600);
  const tsa = T(3, SC.par.saliva); burbuja(tsa, 0.06); burbuja(tsa + 0.22, 0.05); campana(tsa, 72, 0.06, 1.0);
}

/* 5 · ESCENA 4: la arcada (IX avisa, X ordena) */
{
  const tt = T(4, SC.arcada.toca) + 0.2; campana(tt, 50, 0.06, 1.2); for (let k = 0; k < 6; k++) tic(tt + 0.3 + k * 0.2, 0.04, 1500 + 70 * k);
  tic(T(4, SC.arcada.garganta), 0.1, 1900);
  const tav = T(4, SC.arcada.aviso); subida(tav, 1.0, 300, 1300, 0.04); campana(tav, 69, 0.06, 1.2);
  const tv = T(4, SC.arcada.vago); campana(tv, 62, 0.06, 1.2); subida(tv, 0.8, 900, 300, 0.035);
  const tr = T(4, SC.arcada.arcada); golpe(tr, 0.36, 54); crujir(tr, 0.18); soplo(tr, 0.5, 0.05, 700);
}

/* 6 · ESCENA 5: el dato wow, uno de cada tres */
{
  campana(T(5, SC.sin.wow) + 0.2, 65, 0.06, 1.0);
  const te = T(5, SC.sin.estudio); for (let k = 0; k < 10; k++) tic(te + k * 0.11, 0.045, 1700 + 85 * k);
  const tt = T(5, SC.sin.tercio); [[0, 72], [0.14, 76], [0.28, 81]].forEach(([d, n]) => campana(tt + d, n, 0.06, 1.2));
  tic(T(5, SC.sin.sanos), 0.1, 1700);
  const tb = T(5, SC.sin.bien); campana(tb, 79, 0.06, 1.4); moneda(tb, 0.05);
}

/* 7 · ESCENA 6: el seno carotídeo */
{
  campana(T(6, SC.presion.cuello) + 0.2, 55, 0.06, 1.2);
  tic(T(6, SC.presion.sensor), 0.1, 1800);
  const ts = T(6, SC.presion.seno); lubdub(ts, 0.3); lubdub(ts + 1.0, 0.28); lubdub(ts + 2.0, 0.26);
  const tv = T(6, SC.presion.vigila); campana(tv, 62, 0.06, 1.2);
  const ta = T(6, SC.presion.avisa); subida(ta, 0.9, 400, 1600, 0.04); chispas(ta + 0.5, 0.4, 0.06); campana(ta + 0.9, 81, 0.06, 1.4);
}

/* 8 · ESCENA 7: neuralgia */
{
  campana(T(7, SC.neuralgia.rara) + 0.2, 59, 0.06, 1.2);
  tic(T(7, SC.neuralgia.neuralgia), 0.1, 1700);
  const td = T(7, SC.neuralgia.dolor); chispas(td, 0.7, 0.12); golpe(td + 0.1, 0.32, 56); subida(td, 0.4, 600, 2400, 0.05);
  const tt = T(7, SC.neuralgia.tragar); burbuja(tt, 0.06); burbuja(tt + 0.2, 0.05); campana(tt, 66, 0.06, 1.0);
  const tb = T(7, SC.neuralgia.bostezar); soplo(tb, 0.9, 0.05, 600); subida(tb, 0.9, 300, 700, 0.03);
}

/* 9 · ESCENA 8: dolor y desmayo (latidos y pausa) */
{
  campana(T(8, SC.sincope.pocos) + 0.2, 55, 0.06, 1.2);
  tic(T(8, SC.sincope.dolor), 0.1, 1900); chispas(T(8, SC.sincope.dolor), 0.3, 0.08);
  const td = T(8, SC.sincope.desmayos);
  lubdub(td - 1.4, 0.26); lubdub(td - 0.5, 0.26);
  golpe(td + 0.6, 0.22, 52); crujir(td + 0.6, 0.12);
  const tc = T(8, SC.sincope.cree); campana(tc, 52, 0.05, 2.0);
  const tf = T(8, SC.sincope.frena); lubdub(tf + 0.9, 0.3);
}

/* 10 · ESCENA 9: consulta y pregunta para comentar */
{
  tic(T(9, SC.prueba.dolor) + 0.2, 0.1, 1800);
  const tc = T(9, SC.prueba.consulta); campana(tc, 64, 0.07, 1.4); campana(tc + 0.14, 71, 0.05, 1.2);
  const ta = T(9, SC.prueba.arcadas); for (let k = 0; k < 3; k++) { moneda(ta + k * 0.2, 0.05); tic(ta + k * 0.2, 0.06, 2000 + 200 * k); }
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
const salida = join(RAIZ, "assets", "musica", "par-craneal-9.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
