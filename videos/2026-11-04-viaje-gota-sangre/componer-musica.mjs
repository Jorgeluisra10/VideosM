#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «El viaje de una gota de sangre» (65,4 s). Tono: asombro tranquilo, de documental «por dentro del cuerpo».
 * Pista de «música» del motor: colchón armónico + latido del corazón + flujo + eventos alineados con lo que se ve (los tiempos usan el ritmo REAL de cada escena).
 *
 *   colchón        acordes suaves Re menor → Si bemol → Sol menor → La menor → Re mayor al volver al corazón
 *   latido         «lub-dub» a 75 lpm (periodo 0,8 s del dibujo) en el corazón, la aorta y las ramas; vuelve al llegar al pulmón y al final
 *   flujo          soplo de ruido suave en cada latido (aorta, árbol); fluir continuo y bajo en el capilar y las venas
 *   gota           campana al decir «un minuto», barrido grave al caer al corazón
 *   contadores     tics suaves mientras corren los números (mL, L, hemoglobinas, vueltas) y campanas al cerrar cada cifra
 *   árbol          campanas en escala pentatónica que suben con cada generación de ramas; «boing» del cabello
 *   capilar        chasquido suave al deformarse el glóbulo y destellos agudos del oxígeno que sale; el sonido baja de tono al frenarse
 *   venas          clics de válvula, golpe sordo del músculo en cada apretón y barrido hacia arriba
 *   pulmón         respiración (ruido que sube y baja), burbujeo de O2 y CO2 y destello brillante al volver a ser rojo
 *   vida           anillo que se dibuja, tics que aceleran y frenan con el contador, golpecitos de la médula, latido y acorde final
 *
 * Uso:  node videos/2026-11-04-viaje-gota-sangre/componer-musica.mjs   → assets/musica/viaje-gota-sangre.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/viaje-gota-sangre.wav   (y --restaurar al terminar; el WAV no va a git)
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
const R = prng(404404);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sua = (v, a, b) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const ex = (t, tau) => Math.exp(-t / tau);
const add = (t0, dur, fn) => { const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round((t0 + dur) * SR)); for (let i = i0; i < i1; i++) x[i] += fn((i - i0) / SR, i / SR); };
const osc = (fFn) => { let ph = 0; return (g) => { ph += (TAU * fFn(g)) / SR; return Math.sin(ph); }; };
const lp = (fc) => { let y = 0; const a = 1 - Math.exp(-TAU * fc / SR); return (w) => (y += a * (w - y)); };
const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
const easeIO = (k) => { const c = clamp(k); return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2; };

/* ───────── tiempos reales ───────── */
const dur = [6.8, 7.4, 7.4, 7.8, 7.5, 7.2, 7.8, 8.9, 4.6];
const ideal = [6.7, 7.4, 7.4, 7.4, 7.4, 6.4, 7.1, 8.4, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TSAN en src/anim/piezas.ts
  gancho: { gota: 0.3, anillo: 1.0, anilloDur: 5.0, frase2: 3.2, cae: 6.3 },
  corazon: { camara: 0.2, ml: 2.2, minuto: 3.7, dia: 5.4 },
  aorta: { tubo: 0.0, ancho: 2.7, ramas: 5.3 },
  ramas: { arbol: 0.3, genDur: 0.9, escala: 4.2, cabello: 6.0 },
  capilar: { tubo: 0.2, entra: 1.2, o2: 2.7, hb: 4.5, lento: 6.2 },
  venas: { vena: 0.3, valvulas: 1.7, musculo: 4.0, sube: 5.4 },
  pulmon: { alveolo: 0.3, pasa: 1.6, pasaDur: 2.4, co2: 3.0, bola: 5.6 },
  vida: { anillo: 0.4, vueltas: 1.4, vueltasDur: 4.0, medula: 5.6, fin: 7.4 },
};
const PER = 0.8;                                           // periodo del latido del dibujo

/* ───────── elementos ───────── */
const campana = (t0, n, g = 0.08, dec = 0.9) => { const f0 = hz(n); add(t0, dec * 4, (t) => g * (Math.sin(TAU * f0 * t) + 0.32 * Math.sin(TAU * f0 * 2 * t) + 0.12 * Math.sin(TAU * f0 * 3.01 * t) + 0.06 * Math.sin(TAU * f0 * 4.2 * t)) * ex(t, dec) * Math.min(1, t / 0.004)); };
const tic = (t0, g = 0.07, f = 2600) => add(t0, 0.03, (t) => g * Math.sin(TAU * f * t) * ex(t, 0.006));
const golpe = (t0, g = 0.4, f = 70) => { add(t0, 0.5, (t) => g * Math.sin(TAU * (f - 24 * t) * t) * ex(t, 0.12)); const l = lp(300); add(t0, 0.1, (t) => g * 0.6 * l(R() * 2 - 1) * 3 * ex(t, 0.025)); };
const lubdub = (t0, g = 0.4) => { golpe(t0, g, 62); golpe(t0 + 0.27, g * 0.7, 78); };
const soplo = (t0, dur, g, fc = 700) => { const l = lp(fc); add(t0, dur, (t) => g * l(R() * 2 - 1) * 3 * Math.sin(Math.PI * clamp(t / dur)) * 1.0); };
const burbuja = (t0, g = 0.05) => { const f = 500 + R() * 900; add(t0, 0.12, (t) => g * Math.sin(TAU * (f + 900 * t) * t) * ex(t, 0.03) * Math.min(1, t / 0.003)); };
const penta = [0, 2, 4, 7, 9];
const notaPenta = (base, i) => base + 12 * Math.floor(i / 5) + penta[i % 5];
/** ticks que siguen un contador animado: uno por cada fracción `paso` del avance (curva `curva(k)` con k 0–1) */
const ticsContador = (t0, d, curva, pasos, g = 0.055, f0 = 2200, f1 = 3200) => {
  let prev = 0;
  for (let ms = 0; ms <= d * 1000; ms++) { const k = ms / (d * 1000), v = Math.floor(curva(k) * pasos); if (v > prev) { prev = v; tic(t0 + ms / 1000, g, lerp(f0, f1, k)); } }
};

/* 1 · COLCHÓN: acordes suaves que cambian con las escenas (Dm → Bb → Gm → Am → D) */
{
  const acordes = [
    { t: 0, notas: [38, 45, 53, 60, 64] },                  // Dm9
    { t: T(3, 0), notas: [34, 46, 53, 57, 62] },            // Si bemol
    { t: T(5, 0), notas: [43, 50, 53, 58, 62] },            // Sol menor
    { t: T(7, 0), notas: [45, 52, 57, 60, 64] },            // La menor
    { t: T(8, SC.vida.fin) - 0.4, notas: [38, 45, 54, 62, 66, 69] }, // Re mayor: vuelta al corazón
  ];
  const sala = lp(220);
  acordes.forEach((c, i) => {
    const a = c.t, b = i + 1 < acordes.length ? acordes[i + 1].t : DURACION;
    add(a - 1.2, b - a + 2.4, (t, g) => {
      const env = sua(g, a - 1.2, a + 0.6) * (1 - sua(g, b - 0.6, b + 1.2)) * sua(g, 0, 2.5) * (1 - sua(g, DURACION - 2.5, DURACION));
      let s = 0;
      c.notas.forEach((n, k) => { const f = hz(n); s += (Math.sin(TAU * f * g) + 0.5 * Math.sin(TAU * f * 1.003 * g + k)) * (n < 48 ? 1 : 0.55); });
      return env * 0.014 * s * (0.85 + 0.15 * Math.sin(TAU * 0.13 * g + i));
    });
  });
  add(0, DURACION, (t, g) => 0.012 * sala(R() * 2 - 1) * 4 * sua(g, 0, 2) * (1 - sua(g, DURACION - 2, DURACION)));
}

/* 2 · ESCENA 1: gota, anillo y caída hacia el corazón */
{
  campana(T(1, SC.gancho.gota), 62, 0.07);
  for (let k = 0; ; k++) { const tn = T(1, 0) + 0.4 + k * PER; if (tn > T(1, SC.gancho.cae)) break; lubdub(tn, 0.3 + 0.1 * Math.min(1, k / 4)); }
  // el anillo se dibuja: destello que sube
  const w = osc((g) => 300 + 500 * clamp((g - T(1, SC.gancho.anillo)) / (SC.gancho.anilloDur * rit[0])));
  add(T(1, SC.gancho.anillo), SC.gancho.anilloDur * rit[0], (t) => 0.03 * w(t) * sua(t, 0, 0.5) * (1 - sua(t, SC.gancho.anilloDur * rit[0] - 0.8, SC.gancho.anilloDur * rit[0])));
  campana(T(1, SC.gancho.frase2), 69, 0.07, 1.2); campana(T(1, SC.gancho.frase2) + 0.14, 74, 0.05, 1.2);
  // caída: barrido que sube y golpe grave al entrar al corazón
  const tc = T(1, SC.gancho.cae), wc = osc((g) => 120 + 1500 * Math.pow(clamp((g - tc) / (0.9 * rit[0])), 1.8));
  add(tc, 0.9 * rit[0], (t) => 0.06 * wc(t + tc) * sua(t, 0, 0.1) * (0.4 + t));
  soplo(tc, 0.9, 0.12, 900);
  golpe(T(2, 0), 0.55, 55);
}

/* 3 · ESCENA 2: corazón — latidos, contadores y cifras */
{
  for (let k = 0; ; k++) { const tn = T(2, 0) + k * PER + 0.05; if (tn > T(3, 0) - 0.2) break; lubdub(tn, 0.4); soplo(tn + 0.02, 0.3, 0.05, 500); }
  [[SC.corazon.ml, 1.2, 70], [SC.corazon.minuto, 1.4, 50], [SC.corazon.dia, 1.6, 72]].forEach(([t0, d, pasos], i) => {
    ticsContador(T(2, t0), d, (k) => 1 - Math.pow(1 - k, 3), pasos, 0.05, 2000, 3000);
    campana(T(2, t0) + d, [64, 69, 76][i], 0.08, 1.0);
  });
  golpe(T(2, SC.corazon.dia) + 1.65, 0.3, 80);
}

/* 4 · ESCENA 3: aorta — túnel, soplos con cada latido y medida */
{
  soplo(T(3, 0), 0.7, 0.1, 1200);
  for (let k = 0; ; k++) { const tn = T(3, 0) + k * PER; if (tn > T(4, 0) - 0.1) break; lubdub(tn + 0.04, 0.33); soplo(tn, 0.45, 0.09, 600); }
  campana(T(3, SC.aorta.ancho), 76, 0.07, 1.0); campana(T(3, SC.aorta.ancho) + 0.12, 81, 0.05, 1.0);
  const w = osc((g) => 200 + 900 * clamp((g - T(3, SC.aorta.ramas)) / 1.2));
  add(T(3, SC.aorta.ramas), 1.3, (t, g) => 0.04 * w(g) * sua(t, 0, 0.2) * (1 - sua(t, 0.9, 1.3)));
}

/* 5 · ESCENA 4: árbol — campanas que suben por generación, y el cabello */
{
  for (let k = 0; ; k++) { const tn = T(4, 0) + k * PER; if (tn > T(5, 0) - 0.1) break; golpe(tn, 0.2, 66); soplo(tn, 0.4, 0.05, 450); }
  for (let g = 0; g < 5; g++) campana(T(4, SC.ramas.arbol + SC.ramas.genDur * g * 0.8), notaPenta(57, g + 1), 0.07 - g * 0.006, 0.9);
  campana(T(4, SC.ramas.escala), 81, 0.07, 1.1);
  const w = osc((g) => 500 + 700 * ex(g - T(4, SC.ramas.cabello), 0.08));
  add(T(4, SC.ramas.cabello), 0.4, (t, g) => 0.07 * w(g) * ex(t, 0.1) * Math.min(1, t / 0.004));    // «boing» del cabello
  campana(T(4, SC.ramas.cabello) + 0.5, 88, 0.04, 0.6);
}

/* 6 · ESCENA 5: capilar — chasquido, destellos de oxígeno, hemoglobina y frenado */
{
  const t0 = T(5, 0);
  const rio = lp(420);
  add(t0, dur[4], (t, g) => 0.02 * rio(R() * 2 - 1) * 3 * sua(t, 0, 0.8) * (1 - sua(t, dur[4] - 0.8, dur[4])));  // fluir continuo y bajo (sin latidos: el capilar no pulsa)
  const f = lp(1800);
  add(T(5, SC.capilar.entra), 0.35, (t) => 0.1 * f(R() * 2 - 1) * 3 * ex(t, 0.07) * Math.sin(Math.PI * clamp(t / 0.35)));     // chasquido: el glóbulo se deforma
  golpe(T(5, SC.capilar.entra), 0.18, 90);
  // destellos del oxígeno que sale
  for (let g = T(5, SC.capilar.o2), k = 0; g < T(5, SC.capilar.lento) + 0.3; k++) { campana(g, notaPenta(79, Math.floor(R() * 7)), 0.02 + 0.015 * R(), 0.35); g += 0.22 + R() * 0.2; }
  campana(T(5, SC.capilar.o2), 84, 0.07, 1.0);
  // hemoglobina: contador y cifra
  ticsContador(T(5, SC.capilar.hb), 1.3, (k) => 1 - Math.pow(1 - k, 3), 54, 0.05, 2000, 3200);
  campana(T(5, SC.capilar.hb) + 1.3, 72, 0.08, 1.0); campana(T(5, SC.capilar.hb) + 1.42, 79, 0.06, 1.0);
  // frenado: el tono baja
  const tl = T(5, SC.capilar.lento), wl = osc((g) => 420 - 260 * clamp((g - tl) / 0.8));
  add(tl, 0.9, (t, g) => 0.05 * wl(g) * sua(t, 0, 0.05) * (1 - sua(t, 0.5, 0.9)));
}

/* 7 · ESCENA 6: venas — clics de válvula, golpe del músculo y barrido hacia arriba */
{
  const t0 = T(6, 0);
  const rio = lp(260);
  add(t0, dur[5], (t, g) => 0.026 * rio(R() * 2 - 1) * 3 * sua(t, 0, 0.6) * (1 - sua(t, dur[5] - 0.8, dur[5])));
  [0, 0.42].forEach((d) => { const tv = T(6, SC.venas.valvulas) + d; tic(tv, 0.12, 1500); tic(tv + 0.03, 0.08, 900); campana(tv, 67 + (d ? 5 : 0), 0.04, 0.5); });
  const tm = T(6, SC.venas.musculo);
  for (let s = 0; tm + s * 1.8 < ini[6] - 0.3; s++) {
    const tt = tm + s * 1.8;
    golpe(tt, 0.42, 60);                                                                       // el músculo se contrae
    const w = osc((g) => 90 + 220 * clamp((g - tt) / 0.5)), l = lp(500);
    add(tt, 0.6, (t, g) => 0.05 * w(g) * sua(t, 0, 0.1) * (1 - sua(t, 0.4, 0.6)) + 0.05 * l(R() * 2 - 1) * 3 * Math.sin(Math.PI * clamp(t / 0.55)));
    tic(tt + 0.56, 0.1, 1400);                                                                 // la válvula se cierra
  }
  const wu = osc((g) => 280 + 520 * clamp((g - T(6, SC.venas.sube)) / 1.0));
  add(T(6, SC.venas.sube), 1.1, (t, g) => 0.04 * wu(g) * sua(t, 0, 0.15) * (1 - sua(t, 0.7, 1.1)));
  campana(T(6, SC.venas.sube) + 0.9, 74, 0.06, 1.0);
}

/* 8 · ESCENA 7: pulmón — respiración, tránsito brillante, burbujeo y vuelta del rojo */
{
  const t0 = T(7, 0);
  const aire = lp(2500);
  add(t0, dur[6], (t, g) => 0.05 * aire(R() * 2 - 1) * 3 * (0.25 + 0.75 * Math.pow(Math.sin(Math.PI * ((t / 3.4) % 1)), 2)) * sua(t, 0, 0.8) * (1 - sua(t, dur[6] - 0.8, dur[6])));
  campana(T(7, SC.pulmon.alveolo), 69, 0.07, 1.0);
  const tp = T(7, SC.pulmon.pasa), dp = SC.pulmon.pasaDur * rit[6];
  const w = osc((g) => 300 + 1500 * easeIO((g - tp) / dp)), tr = osc(() => 7);
  add(tp, dp + 0.2, (t, g) => 0.05 * w(g) * sua(t, 0, 0.12) * (1 - sua(t, dp, dp + 0.2)) * (0.7 + 0.3 * tr(t)));
  for (let g = tp; g < tp + dp; g += 0.1 + R() * 0.14) burbuja(g, 0.04);                       // O2 entra, CO2 sale
  [0, 0.12, 0.24].forEach((d, i) => campana(T(7, SC.pulmon.co2) + d, [64, 68, 71][i], 0.05, 0.7));
  const tb = T(7, SC.pulmon.bola);
  [[0, 72], [0.1, 76], [0.2, 79], [0.3, 84]].forEach(([d, n]) => campana(tb + d, n, 0.07, 1.2));
  lubdub(tb + 0.05, 0.38);
}

/* 9 · ESCENA 8: vida — anillo, contador, médula y acorde final */
{
  const t0 = T(8, SC.vida.anillo), da = 0.9;
  const w = osc((g) => 260 + 700 * clamp((g - t0) / da));
  add(t0, da, (t, g) => 0.03 * w(g) * sua(t, 0, 0.1) * (1 - sua(t, 0.6, da)));
  const tv = T(8, SC.vida.vueltas), dv = SC.vida.vueltasDur;
  ticsContador(tv, dv, easeIO, 120, 0.05, 1800, 3400);
  campana(tv + dv, 74, 0.08, 1.2); campana(tv + dv + 0.14, 81, 0.06, 1.2);
  const tmed = T(8, SC.vida.medula);
  campana(tmed, 62, 0.06, 1.0);
  for (let g = tmed + 0.2; g < T(8, SC.vida.fin) + 0.2; g += 0.16 + R() * 0.2) burbuja(g, 0.035);   // la médula fabrica glóbulos
  const tf = T(8, SC.vida.fin);
  lubdub(tf, 0.45);
  [[0.0, 50], [0.18, 57], [0.36, 62], [0.54, 66], [0.72, 69], [0.9, 74]].forEach(([d, n]) => campana(tf + 0.25 + d, n, 0.07, 1.8));
}

/* 10 · ESCENA 9 (CTA): destellos suaves y cola de acorde */
{
  const tc = T(9, 0.3);
  [[0, 74], [0.15, 78], [0.3, 81], [0.45, 86]].forEach(([d, n]) => campana(tc + d, n, 0.05, 1.2));
  lubdub(T(9, 0), 0.3);
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
const salida = join(RAIZ, "assets", "musica", "viaje-gota-sangre.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
