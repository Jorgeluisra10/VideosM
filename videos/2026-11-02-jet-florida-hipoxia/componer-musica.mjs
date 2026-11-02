#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «El aire que no avisa» (61,8 s).
 * Pista de «música» del motor: ambiente + eventos físicos alineados con lo que se ve (los tiempos usan el ritmo REAL de cada escena).
 *
 *   rugido de turbina       ruido grave constante que cae al entrar a la cabina y vuelve a sonar al final (escenas 1–2 y 8)
 *   paso del jet            barrido de ruido con efecto Doppler cuando cruza el encuadre (escena 1)
 *   sello                   golpe sordo + anillo metálico al estamparse «causa en investigación» (escena 2)
 *   aire que se adelgaza    viento que sube de tono durante el ascenso y se vuelve silbido fino arriba (escena 2)
 *   choques de moléculas    chasquidos diminutos, densos a nivel del mar y cada vez más raros a 10.668 m (escena 3)
 *   siseo de presurización  flujo de aire de las salidas del techo y, al final, escape que se apaga con un aviso de altitud de cabina (escena 4)
 *   latidos                 «lub-dub» que acompañan al cerebro, se aceleran con la hipoxia (escenas 6–7) y se serenan con el oxígeno (escena 8)
 *   neuronas                destellos agudos y bajada de energía cuando el cerebro se apaga (escena 5)
 *   zumbido en el oído      tono agudo que crece mientras se cierra la visión en túnel y se apaga con la máscara (escenas 7–8)
 *   máscara                 siseo del oxígeno y acorde abierto cuando la visión se despeja (escena 8)
 *   cama armónica           colchón suave: tensa y menor hasta la escena 7, abierto y mayor al final
 *
 * Uso:  node videos/2026-11-02-jet-florida-hipoxia/componer-musica.mjs   → assets/musica/jet-florida-hipoxia.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/jet-florida-hipoxia.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 62;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const x = new Float32Array(N);
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(31337);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sua = (v, a, b) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const ex = (t, tau) => Math.exp(-t / tau);
const add = (t0, dur, fn) => { const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round((t0 + dur) * SR)); for (let i = i0; i < i1; i++) x[i] += fn((i - i0) / SR, i / SR); };
/** oscilador de frecuencia variable con fase acumulada (sin deslizamientos no deseados) */
const osc = (fFn) => { let ph = 0; return (g) => { ph += (TAU * fFn(g)) / SR; return Math.sin(ph); }; };
const lp = (fc) => { let y = 0; const a = 1 - Math.exp(-TAU * fc / SR); return (w) => (y += a * (w - y)); };

/* ───────── tiempos reales: inicio de cada escena y su ritmo (igual que el motor) ───────── */
const dur = [7.1, 8.9, 8.2, 6.8, 5.8, 6.4, 7.2, 7.2, 4.2];
const ideal = [6.6, 8.4, 8.0, 6.4, 5.4, 5.8, 6.7, 6.4, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TJET en src/anim/piezas.ts
  gancho: { jet: 0.2, chip: 0.4, alt: 0.8, altDur: 2.6, frase2: 2.7 },
  ascenso: { sello: 0.4, sale: 3.1, asc: 3.3, ascDur: 4.4, cuarta: 7.8 },
  aire: { camaras: 0.3, mol: 0.5, o2: 1.9, sube: 2.6, subeDur: 1.6, pio: 3.5, barras: 5.4, ever: 6.9 },
  cabina: { casco: 0.2, aire: 1.9, gauge: 3.4, fuga: 5.3 },
  cerebro: { cerebro: 0.2, flujo: 0.8, col20: 2.9, apaga: 4.5 },
  reloj: { aguja: 0.9, agujaDur: 3.0, luz: 3.9, tunel: 4.6 },
  silencio: { tunel: 1.2, tunelDur: 4.8, chips: [2.0, 3.0, 3.95, 4.9, 5.8] },
  descenso: { techo: 0.2, mascara: 0.5, bolsa: 1.6, desc: 2.2, descDur: 3.4, abre: 2.6, frase: 5.7 },
};

/* 1 · RUGIDO DE TURBINA (constante, grave) con su volumen por escena */
{
  const f1 = lp(130), f2 = lp(420), f3 = lp(60);
  const vol = (g) => {
    const e1 = T(3, 0), e4 = T(4, 0), e5 = T(5, 0), e8 = T(8, 0);
    if (g < e1) return lerp(0.75, 0.5, sua(g, T(2, 3), T(2, 8)));
    if (g < e4) return lerp(0.4, 0.3, sua(g, e1, e4));
    if (g < e5) return 0.34;                                   // zumbido de cabina
    if (g < e8) return lerp(0.16, 0.26, sua(g, T(6, 0), T(7, 6)));
    return lerp(0.34, 0.2, sua(g, e8 + 2.6, e8 + 6.5));
  };
  const muffle = (g) => 1 - 0.7 * sua(g, T(7, SC.silencio.tunel), T(7, SC.silencio.tunel + SC.silencio.tunelDur)) * (1 - sua(g, T(8, SC.descenso.abre), T(8, SC.descenso.abre + 2.4)));
  add(0, DURACION, (t, g) => {
    const w = R() * 2 - 1;
    const a = f1(w), b = f2(w), c = f3(w);
    const rumble = 2.2 * a + 0.9 * (b - a) * muffle(g) + 2.6 * c;
    const zumbido = 0.05 * Math.sin(TAU * 58 * g) + 0.03 * Math.sin(TAU * 116.4 * g);
    return vol(g) * (rumble + zumbido) * sua(g, 0, 0.8);
  });
}

/* 2 · PASO DEL JET (escena 1): barrido con Doppler + silbido de turbinas */
{
  const t0 = T(1, SC.gancho.jet), d = 3.2;
  const a = lp(900), b = lp(2600);
  add(t0, d, (t, g) => {
    const u = t / d, env = Math.sin(Math.PI * clamp(u)) ** 1.6;
    const w = R() * 2 - 1;
    const doppler = 1 + 0.22 * (0.5 - u);
    const silbo = 0.05 * Math.sin(TAU * 2300 * doppler * t) * env + 0.03 * Math.sin(TAU * 3450 * doppler * t) * env;
    return env * 0.6 * (a(w) * 1.8 + (b(w) - a(w)) * 0.7) + silbo;
  });
  add(T(1, SC.gancho.chip), 0.5, (t) => 0.2 * (Math.sin(TAU * 1320 * t) + 0.4 * Math.sin(TAU * 1980 * t)) * ex(t, 0.16) * Math.min(1, t / 0.003)); // pitido de la noticia
}

/* 3 · SELLO «CAUSA EN INVESTIGACIÓN» (escena 2) */
{
  const t0 = T(2, SC.ascenso.sello);
  add(t0, 0.9, (t) => 0.7 * Math.sin(TAU * (92 - 40 * t) * t) * ex(t, 0.14) + 0.4 * (R() * 2 - 1) * ex(t, 0.012));
  add(t0 + 0.01, 1.4, (t) => 0.1 * (Math.sin(TAU * 820 * t) + 0.5 * Math.sin(TAU * 2180 * t)) * ex(t, 0.3) * Math.min(1, t / 0.002));
}

/* 4 · AIRE QUE SE ADELGAZA (escena 2): viento que sube de tono y se afina arriba */
{
  const t0 = T(2, SC.ascenso.asc), d = SC.ascenso.ascDur * rit[1];
  let a = 0, b = 0;
  const silb = osc((g) => 1500 + 1800 * clamp((g - t0) / d));
  add(t0 - 0.3, d + 1.5, (t, g) => {
    const k = clamp((g - t0) / d), env = sua(g, t0 - 0.3, t0 + 0.7) * (1 - sua(g, t0 + d, t0 + d + 1.2));
    const w = R() * 2 - 1;
    const fc1 = 260 + 700 * k, fc2 = 1500 + 3500 * k;
    a += (1 - Math.exp(-TAU * fc1 / SR)) * (w - a);
    b += (1 - Math.exp(-TAU * fc2 / SR)) * (w - b);
    const silbo = 0.03 * k * silb(g) * (0.6 + 0.4 * Math.sin(TAU * 3 * g));
    return env * ((0.8 - 0.3 * k) * a * 2.2 + (0.25 + 0.4 * k) * (b - a) + silbo);
  });
  const td = T(2, SC.ascenso.asc + SC.ascenso.ascDur);
  add(td, 1.2, (t) => 0.2 * (Math.sin(TAU * 784 * t) + 0.45 * Math.sin(TAU * 1568 * t)) * ex(t, 0.35) * Math.min(1, t / 0.003));     // llega a 10.668 m
  add(T(2, SC.ascenso.cuarta), 0.8, (t) => 0.3 * Math.sin(TAU * 52 * t) * ex(t, 0.2));                                                  // «casi una cuarta parte»
}

/* 5 · CHOQUES DE MOLÉCULAS (escena 3): chasquidos densos que se vuelven raros */
{
  const t0 = T(3, SC.aire.mol), t1 = T(3, SC.aire.sube + SC.aire.subeDur) + 0.3, tf = T(3, SC.aire.barras);
  for (let tk = t0; tk < tf; ) {
    const dens = tk < T(3, SC.aire.sube) ? 1 : lerp(1, 0.235, sua(tk, T(3, SC.aire.sube), t1));
    const f = 2200 + R() * 3800;
    add(tk, 0.03, (t) => 0.09 * dens * Math.sin(TAU * f * t) * ex(t, 0.005));
    tk += (1 / (46 * dens)) * (0.5 + R());
  }
  add(T(3, SC.aire.o2), 0.4, (t) => 0.16 * Math.sin(TAU * (700 + 900 * t / 0.4) * t) * ex(t, 0.15));                                     // se encienden los de oxígeno
  add(T(3, SC.aire.ever), 1.2, (t) => 0.22 * (Math.sin(TAU * 523 * t) + 0.45 * Math.sin(TAU * 1046 * t)) * ex(t, 0.34) * Math.min(1, t / 0.003)); // Everest
  add(T(3, SC.aire.ever), 0.9, (t) => 0.3 * Math.sin(TAU * 49 * t) * ex(t, 0.22));
}

/* 6 · SISEO DE PRESURIZACIÓN y ESCAPE (escena 4) */
{
  const t0 = T(4, SC.cabina.aire), t1 = T(4, SC.cabina.fuga), d = T(4, 6.2) - t1;
  add(T(4, SC.cabina.casco), 0.8, (t) => 0.45 * Math.sin(TAU * 64 * t) * ex(t, 0.2) + 0.15 * (R() * 2 - 1) * ex(t, 0.02));                // el casco se cierra
  let a = 0, b = 0;
  add(t0, t1 - t0 + 0.6, (t, g) => {                                                                                                      // salidas de aire del techo
    const env = sua(g, t0, t0 + 0.6) * (1 - sua(g, t1, t1 + 0.6));
    const w = R() * 2 - 1;
    a += (1 - Math.exp(-TAU * 2800 / SR)) * (w - a);
    b += (1 - Math.exp(-TAU * 900 / SR)) * (w - b);
    return env * 0.22 * ((a - b) * 1.6 + 0.4 * b);
  });
  let c = 0;
  add(t1, d + 0.4, (t, g) => {                                                                                                            // escape de presión: silbido que cae
    const k = clamp((g - t1) / d), env = sua(g, t1, t1 + 0.08) * (1 - sua(g, t1 + d * 0.7, t1 + d + 0.4));
    const w = R() * 2 - 1, fc = 5200 * Math.pow(0.12, k);
    c += (1 - Math.exp(-TAU * fc / SR)) * (w - c);
    return env * 0.26 * c * 2.4;
  });
  for (let k = 0; k < 3; k++) add(t1 + 0.05 + k * 0.42, 0.3, (t) => 0.2 * (Math.sin(TAU * (k % 2 ? 660 : 880) * t) + 0.3 * Math.sin(TAU * (k % 2 ? 1320 : 1760) * t)) * Math.min(1, t / 0.004) * (t < 0.24 ? 1 : ex(t - 0.24, 0.03))); // aviso de altitud de cabina
}

/* 7 · LATIDOS (lub-dub): del cerebro (escena 5) a la hipoxia (6–7) y la calma (8) */
{
  const lub = (t0, g = 0.5) => { add(t0, 0.22, (t) => g * Math.sin(TAU * (62 - 20 * t) * t) * ex(t, 0.055) * Math.min(1, t / 0.004)); add(t0 + 0.27, 0.2, (t) => g * 0.62 * Math.sin(TAU * (74 - 24 * t) * t) * ex(t, 0.045) * Math.min(1, t / 0.004)); };
  const bpm = (g) => {
    if (g < T(6, SC.reloj.tunel)) return g < T(5, SC.cerebro.apaga) ? 66 : 52;
    if (g < T(8, 0)) return lerp(78, 132, sua(g, T(6, SC.reloj.tunel), T(8, 0)));
    return lerp(124, 74, sua(g, T(8, SC.descenso.desc), T(8, SC.descenso.desc + SC.descenso.descDur)));
  };
  const gan = (g) => {
    if (g < T(5, 0)) return 0;
    if (g < T(6, SC.reloj.tunel)) return g < T(5, SC.cerebro.apaga) ? 0.5 : 0.36;
    if (g < T(8, 0)) return lerp(0.5, 0.95, sua(g, T(6, SC.reloj.tunel), T(8, 0)));
    return lerp(0.9, 0.35, sua(g, T(8, SC.descenso.desc), T(8, SC.descenso.desc + SC.descenso.descDur + 1)));
  };
  for (let g = T(5, 0.05); g < T(9, 0); g += 60 / bpm(g)) lub(g, gan(g));
}

/* 8 · NEURONAS (escena 5) y apagón */
{
  const t0 = T(5, SC.cerebro.flujo), t1 = T(5, SC.cerebro.apaga);
  for (let k = 0; k < 46; k++) {
    const tk = t0 + R() * (t1 - t0), f = 2600 + R() * 3400, g = 0.035 + R() * 0.03;
    add(tk, 0.16, (t) => g * Math.sin(TAU * f * t) * ex(t, 0.035) * Math.min(1, t / 0.002));
  }
  add(T(5, SC.cerebro.col20), 0.9, (t) => 0.32 * Math.sin(TAU * 55 * t) * ex(t, 0.2) + 0.12 * (R() * 2 - 1) * ex(t, 0.02));               // el 20 %
  { const pd = osc((g) => 40 + 190 * Math.pow(0.1, (g - t1) / 1.1)); add(t1, 1.4, (t, g) => 0.28 * pd(g) * (1 - sua(t, 0.6, 1.3))); }                // baja la energía
}

/* 9 · TENSIÓN (escenas 6–7): zumbido grave que sube y tono en el oído */
{
  const t0 = T(6, SC.reloj.tunel), t1 = T(8, 0);
  const o1 = osc((g) => 55 + 22 * clamp((g - t0) / (t1 - t0))), o2 = osc((g) => 82.4 + 30 * clamp((g - t0) / (t1 - t0))), o3 = osc((g) => (164 + 50 * clamp((g - t0) / (t1 - t0))) * (1 + 0.003 * Math.sin(TAU * 6 * g)));
  add(t0, t1 - t0 + 0.4, (t, g) => {
    const k = (g - t0) / (t1 - t0), env = sua(g, t0, t0 + 1.0) * (1 - sua(g, t1, t1 + 0.4));
    return env * (0.12 + 0.2 * k) * (o1(g) + 0.5 * o2(g) + 0.2 * o3(g));
  });
  const ti0 = T(7, SC.silencio.tunel), ti1 = T(8, SC.descenso.desc + 1.4);                                                                 // tinnitus
  const n1 = osc((g) => 3650 + 380 * sua(g, ti0, T(8, 0))), n2 = osc((g) => 4410 + 300 * sua(g, ti0, T(8, 0)));
  add(ti0, ti1 - ti0, (t, g) => {
    const env = sua(g, ti0, ti0 + 2.2) * (1 - sua(g, T(8, SC.descenso.mascara), ti1));
    const k = sua(g, ti0, T(8, 0));
    return env * (0.012 + 0.07 * k) * (n1(g) + 0.4 * n2(g));
  });
  for (const c of SC.silencio.chips) add(T(7, c), 0.35, (t) => 0.13 * Math.sin(TAU * (c === 5.8 ? 220 : 520) * t) * ex(t, 0.09) * Math.min(1, t / 0.003)); // cada síntoma
}

/* 10 · MÁSCARA DE OXÍGENO (escena 8): compuerta, caída, siseo y respiración que se calma */
{
  add(T(8, SC.descenso.techo), 0.18, (t) => 0.25 * (R() * 2 - 1) * ex(t, 0.012) + 0.2 * Math.sin(TAU * 1800 * t) * ex(t, 0.02));
  add(T(8, SC.descenso.mascara), 0.5, (t) => 0.4 * Math.sin(TAU * 78 * t) * ex(t, 0.11) + 0.2 * (R() * 2 - 1) * ex(t, 0.02));
  const t0 = T(8, SC.descenso.bolsa), t1 = T(8, SC.descenso.frase);
  let a = 0, b = 0;
  add(t0 - 0.1, t1 - t0 + 0.5, (t, g) => {
    const env = sua(g, t0 - 0.1, t0 + 0.3) * (1 - sua(g, t1 - 0.3, t1 + 0.4));
    const w = R() * 2 - 1;
    a += (1 - Math.exp(-TAU * 6500 / SR)) * (w - a);
    b += (1 - Math.exp(-TAU * 1800 / SR)) * (w - b);
    const resp = 0.65 + 0.35 * Math.sin(TAU * (0.45 + 0.1 * (1 - sua(g, t0, t1))) * g);
    return env * 0.2 * resp * (a - b) * 2.4;
  });
  // acorde abierto cuando se despeja la visión (La mayor con novena)
  const ta = T(8, SC.descenso.abre), tb = T(9, 0) + 3.2;
  add(ta, tb - ta, (t, g) => {
    const env = sua(g, ta, ta + 1.8) * (1 - sua(g, tb - 1.4, tb));
    return env * 0.075 * (Math.sin(TAU * 220 * g) + 0.7 * Math.sin(TAU * 277.18 * g) + 0.6 * Math.sin(TAU * 329.63 * g) + 0.4 * Math.sin(TAU * 493.88 * g) + 0.3 * Math.sin(TAU * 659.25 * g)) * (0.85 + 0.15 * Math.sin(TAU * 0.35 * g));
  });
  for (let k = 0; k < 4; k++) add(T(8, SC.descenso.frase) + 0.12 * k, 0.9, (t) => 0.07 * Math.sin(TAU * [880, 1108.7, 1318.5, 1760][k] * t) * ex(t, 0.4) * Math.min(1, t / 0.003)); // destello final
}

/* 11 · CAMA ARMÓNICA suave (todo el video): menor y tensa hasta la escena 7, abierta y mayor desde la 8 */
{
  const e8 = T(8, SC.descenso.abre);
  add(0, DURACION, (t, g) => {
    const mayor = sua(g, e8 - 0.4, e8 + 1.6);
    const env = sua(g, 0, 2.5) * (1 - sua(g, DURACION - 2.2, DURACION)) * 0.055;
    const tens = 1 + 0.5 * sua(g, T(6, 0), T(8, 0)) * (1 - mayor);
    // La menor (Do) se funde con La mayor (Do#): dos osciladores fijos con fundido cruzado
    return env * tens * (Math.sin(TAU * 110 * g) + (0.6 * (1 - mayor)) * Math.sin(TAU * 130.81 * g) + (0.6 * mayor) * Math.sin(TAU * 138.59 * g) + 0.5 * Math.sin(TAU * 164.81 * g) + 0.25 * Math.sin(TAU * 220.5 * g)) * (0.8 + 0.2 * Math.sin(TAU * 0.18 * g));
  });
}

/* 12 · reverb corto de cabina y límite suave */
{
  const retardos = [29.7, 41.1, 61.3, 89.9, 113.3];
  const y = new Float32Array(N);
  for (const ms of retardos) { const dl = Math.round((ms * SR) / 1000), lin = new Float32Array(dl); let p = 0, l = 0; for (let i = 0; i < N; i++) { const o = lin[p]; l += 0.4 * (o - l); lin[p] = x[i] + 0.72 * l; y[i] += o; p = (p + 1) % dl; } }
  for (let i = 0; i < N; i++) x[i] += y[i] * 0.16;
}
let pico = 0;
for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(x[i]));
const gn = 0.9 / Math.max(1e-4, pico);
for (let i = 0; i < N; i++) x[i] = Math.tanh(x[i] * gn * 1.1) * 0.9;
const f = Math.round(0.03 * SR);
for (let i = 0; i < f; i++) { x[i] *= i / f; x[N - 1 - i] *= i / f; }
mkdirSync(join(RAIZ, "assets", "musica"), { recursive: true });
const salida = join(RAIZ, "assets", "musica", "jet-florida-hipoxia.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
