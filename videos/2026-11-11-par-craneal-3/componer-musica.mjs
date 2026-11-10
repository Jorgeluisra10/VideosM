#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «El par craneal III: la pupila que avisa» (63,4 s).
 * Tono: tensión clínica contenida que termina en alerta sobria. Pista de «música» del motor: colchón armónico + eventos alineados con lo que se ve
 * (los tiempos usan el ritmo REAL de cada escena).
 *
 *   colchón   acordes La menor → Fa → Re menor → Mi menor → La menor tenso → Mi menor sobrio (la alerta)
 *   gancho    golpe del trauma, chispa de la pupila dilatada y alarma de la emergencia
 *   músculos  pops de los cuatro músculos y campana del párpado
 *   reflejo   zap de la luz, pulsos azul y ámbar y cierre de las dos pupilas
 *   recorrido tics del nervio entre las arterias y el seno cavernoso
 *   fibras    tics de las fibras de la superficie y golpe de la compresión
 *   herniación whoosh del desplazamiento y golpe grave de aplastamiento
 *   aneurisma latido del aneurisma, párpado que cae y ojo que se desvía
 *   urgencia  tres tics de las señales y campana de alerta final
 *
 * Uso:  node videos/2026-11-11-par-craneal-3/componer-musica.mjs   → assets/musica/par-craneal-3.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-3.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 66.1;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const x = new Float32Array(N);
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(111111);
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
const dur = [7.5, 6.6, 7.8, 7, 7.8, 7.1, 8.2, 6.6, 4.8];
const ideal = [7, 6.1, 7.3, 6.6, 7.3, 6.6, 7.7, 6.1, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TOC en src/anim/piezas.ts
  gancho: { pupila: 0.2, golpe: 1.8, emergencia: 3.6, par: 5.2 },
  musculos: { mueve: 0.2, cuatro: 1.7, giran: 3.6, parpado: 5.0 },
  reflejo: { luz: 0.2, optico: 2.4, oculo: 4.0, dos: 5.5 },
  recorrido: { nace: 0.2, arterias: 2.2, seno: 4.6, orbita: 6.0 },
  fibras: { superficie: 0.2, primeras: 4.0, comprime: 5.9 },
  herniacion: { presion: 0.2, lobulo: 2.4, aplasta: 4.4, dilata: 5.6 },
  aneurisma: { aneurisma: 0.2, parpado: 3.0, ojo: 4.4, pupila: 6.8 },
  urgencia: { parpado: 0.2, doble: 2.4, dolor: 3.7, urgente: 5.1 },
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
    { t: T(2, 0), notas: [29, 41, 48, 53, 57, 60] },                // Fa mayor: los músculos
    { t: T(3, 0), notas: [38, 45, 53, 57, 60] },                    // Re menor: el reflejo
    { t: T(5, 0), notas: [28, 40, 47, 52, 55] },                    // Mi menor: las fibras
    { t: T(6, 0), notas: [33, 45, 51, 57, 60] },                    // La menor tenso: la presión
    { t: T(8, 0), notas: [28, 40, 47, 52, 55, 59] },                // Mi menor sobrio: la alerta
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

/* 2 · ESCENA 1: golpe, pupila dilatada y alarma */
{
  campana(T(1, SC.gancho.pupila) + 0.2, 57, 0.06, 1.0);
  const tg = T(1, SC.gancho.golpe);
  golpe(tg, 0.4, 56); crujir(tg, 0.16); chispas(tg, 0.2, 0.06);
  const te = T(1, SC.gancho.emergencia);
  chispas(te, 0.3, 0.07); subida(te, 0.6, 300, 1600, 0.04);
  const tp = T(1, SC.gancho.par);
  [[0, 64], [0.14, 64], [0.28, 64]].forEach(([d, n]) => campana(tp + d, n, 0.07, 0.6)); campana(tp + 0.4, 52, 0.06, 1.6);
}

/* 3 · ESCENA 2: cuatro músculos y el párpado */
{
  campana(T(2, SC.musculos.mueve) + 0.2, 62, 0.06, 1.0);
  const tc = T(2, SC.musculos.cuatro);
  tic(tc, 0.1, 1700); [0, 0.3, 0.6, 0.9].forEach((d, k) => { moneda(tc + d, 0.04); campana(tc + d, 69 + [0, 3, 5, 8][k], 0.05, 0.7); });
  tic(T(2, SC.musculos.giran), 0.1, 1800);
  const tp = T(2, SC.musculos.parpado);
  soplo(tp, 0.5, 0.04, 1100); campana(tp, 76, 0.06, 1.2);
}

/* 4 · ESCENA 3: reflejo fotomotor */
{
  const tl = T(3, SC.reflejo.luz) + 0.2;
  chispas(tl, 0.3, 0.07); subida(tl, 0.4, 600, 1800, 0.04);
  const to = T(3, SC.reflejo.optico);
  campana(to, 72, 0.06, 1.0); for (let k = 0; k < 8; k++) tic(to + 0.2 + k * 0.15, 0.05, 1900 + 60 * k);
  const tc = T(3, SC.reflejo.oculo);
  campana(tc, 64, 0.07, 1.2); for (let k = 0; k < 8; k++) tic(tc + 0.2 + k * 0.15, 0.05, 1600 + 60 * k);
  const td = T(3, SC.reflejo.dos);
  [[0, 72], [0.1, 76], [0.2, 81]].forEach(([d, n]) => campana(td + d, n, 0.07, 1.4)); lubdub(td, 0.26);
}

/* 5 · ESCENA 4: recorrido */
{
  campana(T(4, SC.recorrido.nace) + 0.2, 57, 0.06, 1.0);
  const ta = T(4, SC.recorrido.arterias);
  campana(ta, 62, 0.06, 1.0); for (let k = 0; k < 6; k++) tic(ta + 0.1 + k * 0.18, 0.05, 1500 + 90 * k);
  const ts = T(4, SC.recorrido.seno);
  soplo(ts, 0.8, 0.05, 700); campana(ts, 69, 0.06, 1.2);
  const to = T(4, SC.recorrido.orbita);
  campana(to, 76, 0.07, 1.4); campana(to + 0.12, 81, 0.05, 1.2);
}

/* 6 · ESCENA 5: fibras de la superficie */
{
  campana(T(5, SC.fibras.superficie) + 0.2, 62, 0.06, 1.0);
  const tp = T(5, SC.fibras.primeras);
  for (let k = 0; k < 8; k++) tic(tp + k * 0.12, 0.05, 1900 - 30 * k);
  const tc = T(5, SC.fibras.comprime);
  golpe(tc, 0.36, 50); crujir(tc, 0.14); add(tc, 0.9, (t) => 0.04 * (Math.sin(TAU * 98 * t) + Math.sin(TAU * 103.5 * t)) * ex(t, 0.3));
}

/* 7 · ESCENA 6: presión y herniación */
{
  campana(T(6, SC.herniacion.presion) + 0.2, 55, 0.06, 1.2);
  const tl = T(6, SC.herniacion.lobulo);
  soplo(tl, 1.4, 0.05, 700); subida(tl, 1.4, 200, 700, 0.03);
  const ta = T(6, SC.herniacion.aplasta);
  golpe(ta, 0.42, 48); crujir(ta, 0.2);
  const td = T(6, SC.herniacion.dilata);
  chispas(td, 0.3, 0.07); campana(td, 52, 0.06, 1.6);
}

/* 8 · ESCENA 7: aneurisma */
{
  const ta = T(7, SC.aneurisma.aneurisma);
  for (let k = 0; k < 5; k++) lubdub(ta + 0.4 + k * 0.9, 0.2);
  const tp = T(7, SC.aneurisma.parpado);
  golpe(tp, 0.3, 54); soplo(tp, 0.6, 0.04, 600);
  const to = T(7, SC.aneurisma.ojo);
  soplo(to, 0.8, 0.05, 1000); subida(to, 0.8, 800, 300, 0.03);
  const tz = T(7, SC.aneurisma.pupila);
  chispas(tz, 0.3, 0.07); campana(tz, 57, 0.06, 1.4);
}

/* 9 · ESCENA 8: señales y alerta final */
{
  const tp = T(8, SC.urgencia.parpado) + 0.1;
  golpe(tp, 0.26, 56); tic(tp, 0.1, 1800);
  tic(T(8, SC.urgencia.doble), 0.12, 1900); tic(T(8, SC.urgencia.dolor), 0.12, 2000);
  const tu = T(8, SC.urgencia.urgente);
  golpe(tu, 0.36, 50);
  [[0, 64], [0.35, 64], [0.7, 64]].forEach(([d, n]) => campana(tu + d, n, 0.07, 0.7)); campana(tu + 0.2, 52, 0.06, 2.0);
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
const salida = join(RAIZ, "assets", "musica", "par-craneal-3.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
