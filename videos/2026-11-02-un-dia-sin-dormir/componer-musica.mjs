#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «Un día sin dormir» (61,4 s).
 * Pista de «música» del motor: ambiente nocturno + eventos físicos alineados con lo que se ve (los tiempos usan el ritmo REAL de cada escena).
 *
 *   noche                    colchón suave (La menor) y grillos lejanos (escenas 1–5)
 *   tictac y alcoholímetro   tictac que se acelera con el reloj, pitidos que suben con el dial y pitido largo al llegar a 0,10 % (escenas 1–2)
 *   alerta                   dos tonos tipo sirena y golpe grave al cruzar el límite legal (escena 3)
 *   moléculas                burbujeo agudo cada vez más denso con la adenosina (escena 4)
 *   receptor                 clic de acople, goteo del café y «clunk» al bloquearse el receptor (escena 5)
 *   carretera                motor y ruido de calzada, tono que cae al cabecear, silencio sordo con latido lento al cerrar los ojos y franja sonora + bocina al abrirlos (escena 6)
 *   hospital                 zumbido de ventilación, monitor cardíaco, tono que sube con la barra y alarma doble en +36 %; impacto en los choques (escena 7)
 *   descanso                 respiración serena, pulso grave lento del sueño profundo, campana a las 8 h y acorde abierto (escenas 8–9)
 *
 * Uso:  node videos/2026-11-02-un-dia-sin-dormir/componer-musica.mjs   → assets/musica/un-dia-sin-dormir.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/un-dia-sin-dormir.wav   (y --restaurar al terminar; el WAV no va a git)
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
const R = prng(8675309);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sua = (v, a, b) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const ex = (t, tau) => Math.exp(-t / tau);
const add = (t0, dur, fn) => { const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round((t0 + dur) * SR)); for (let i = i0; i < i1; i++) x[i] += fn((i - i0) / SR, i / SR); };
/** oscilador de frecuencia variable con fase acumulada (sin deslizamientos no deseados) */
const osc = (fFn) => { let ph = 0; return (g) => { ph += (TAU * fFn(g)) / SR; return Math.sin(ph); }; };
const lp = (fc) => { let y = 0; const a = 1 - Math.exp(-TAU * fc / SR); return (w) => (y += a * (w - y)); };

/* ───────── tiempos reales ───────── */
const dur = [6.2, 7.2, 7.2, 6.2, 6.2, 6.9, 9.0, 7.9, 4.6];
const ideal = [5.7, 6.8, 6.7, 5.9, 5.9, 6.4, 8.4, 7.4, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TSUE en src/anim/piezas.ts
  gancho: { alcohol: 0.5, sube: 0.9, subeDur: 3.4, lectura: 4.5 },
  horas: { sube: 0.8, subeDur: 3.6, marca: 4.6 },
  limite: { sube: 0.6, subeDur: 2.0, cruza: 1.9, alerta: 2.5, nota: 4.4 },
  adenosina: { moleculas: 0.8, sube: 1.0, subeDur: 3.6, chip: 4.8 },
  cafe: { une: 1.5, cafe: 2.3, bloquea: 3.3, sigue: 4.4 },
  micro: { cabecea: 1.5, cierra: 2.1, cierraDur: 0.5, ciego: 2.6, ciegoDur: 2.8, abre: 5.4 },
  hospital: { barraA: 1.0, barraB: 2.0, mas36: 3.8, panel2: 5.0, choque: 6.0, x23: 6.4 },
  dormir: { eeg: 0.6, sube: 1.0, subeDur: 4.2, siete: 5.2, frase: 6.0 },
};
const E6 = { ini: T(6, 0), cab: T(6, SC.micro.cabecea), cie: T(6, SC.micro.cierra), ab: T(6, SC.micro.abre), fin: T(7, 0) };

/* 1 · COLCHÓN NOCTURNO (La menor → La mayor en el cierre) y grillos */
{
  const mayor = (g) => sua(g, T(8, SC.dormir.sube), T(8, SC.dormir.sube + 2));
  add(0, DURACION, (t, g) => {
    const env = sua(g, 0, 2.5) * (1 - sua(g, DURACION - 2.2, DURACION)) * (g >= E6.ini && g < E6.fin ? 0.15 : 1) * 0.05;
    const m = mayor(g);
    return env * (Math.sin(TAU * 110 * g) + 0.6 * ((1 - m) * Math.sin(TAU * 130.81 * g) + m * Math.sin(TAU * 138.59 * g)) + 0.5 * Math.sin(TAU * 164.81 * g) + 0.25 * Math.sin(TAU * 220.5 * g)) * (0.8 + 0.2 * Math.sin(TAU * 0.17 * g));
  });
  // grillos lejanos (escenas 1–5)
  for (let g = 0.4; g < T(6, 0); g += 0.34 + R() * 0.5) {
    const f = 4100 + R() * 500, n = 3 + Math.floor(R() * 3);
    for (let k = 0; k < n; k++) add(g + k * 0.045, 0.03, (t) => 0.014 * Math.sin(TAU * f * t) * Math.sin(Math.PI * clamp(t / 0.03)));
  }
}

/* 2 · TICTAC que se acelera y alcoholímetro (escenas 1 y 2) */
{
  const tic = (t0, g = 0.28, f = 2300) => { add(t0, 0.05, (t) => g * Math.sin(TAU * f * t) * ex(t, 0.008)); add(t0, 0.1, (t) => g * 0.7 * Math.sin(TAU * 140 * t) * ex(t, 0.025)); };
  const tictac = (t0, d, r0, r1) => { for (let g = t0, k = 0; g < t0 + d; k++) { const u = (g - t0) / d, rate = lerp(r0, r1, u * u); tic(g, 0.22 + 0.1 * (k % 2), k % 2 ? 1900 : 2500); g += 1 / rate; } };
  tictac(T(1, SC.gancho.sube), SC.gancho.subeDur * rit[0], 3, 14);
  tictac(T(2, SC.horas.sube), SC.horas.subeDur * rit[1], 3, 12);
  // pitidos del alcoholímetro que suben con la lectura
  const b0 = T(1, SC.gancho.sube), bd = SC.gancho.subeDur * rit[0];
  for (let k = 0; k < 12; k++) { const u = k / 11, tk = b0 + 0.25 + u * (bd - 0.4), f = 900 + 900 * u; add(tk, 0.09, (t) => 0.13 * Math.sin(TAU * f * t) * Math.min(1, t / 0.004) * ex(t, 0.05)); }
  const tl = T(1, SC.gancho.lectura);
  add(tl, 0.7, (t) => 0.2 * (Math.sin(TAU * 1250 * t) + 0.3 * Math.sin(TAU * 2500 * t)) * Math.min(1, t / 0.004) * (1 - sua(t, 0.55, 0.7)));        // pitido largo: 0,10 %
  add(tl, 0.9, (t) => 0.35 * Math.sin(TAU * 52 * t) * ex(t, 0.2));
  const th = T(2, SC.horas.sube + SC.horas.subeDur);
  for (const [k, f] of [[0, 523.25], [0.13, 659.25], [0.26, 783.99]]) add(th + k, 0.8, (t) => 0.13 * (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2 * t)) * ex(t, 0.3) * Math.min(1, t / 0.003)); // campanada de las 17 h
}

/* 3 · ALERTA al cruzar el límite legal (escena 3) */
{
  const t0 = T(3, SC.limite.alerta), d = 2.4;
  const sir = osc((g) => 850 + 330 * Math.sin(TAU * 1.3 * (g - t0)));
  add(t0, d, (t, g) => 0.12 * sir(g) * sua(t, 0, 0.1) * (1 - sua(t, d - 0.5, d)));
  add(T(3, SC.limite.cruza), 0.35, (t) => 0.22 * Math.sin(TAU * (500 + 3000 * t) * t) * ex(t, 0.12));      // zap de cruce
  add(t0, 1.0, (t) => 0.5 * Math.sin(TAU * (80 - 30 * t) * t) * ex(t, 0.16) + 0.25 * (R() * 2 - 1) * ex(t, 0.015)); // golpe
}

/* 4 · MOLÉCULAS (escena 4): burbujeo agudo cada vez más denso */
{
  const t0 = T(4, SC.adenosina.moleculas), t1 = T(4, SC.adenosina.sube + SC.adenosina.subeDur);
  for (let g = t0; g < t1 + 0.6; ) {
    const u = clamp((g - t0) / (t1 - t0)), f = 1500 + R() * 1800, v = 0.04 + 0.05 * u;
    add(g, 0.1, (t) => v * Math.sin(TAU * f * (1 + 2.5 * t) * t) * ex(t, 0.025) * Math.min(1, t / 0.002));
    g += (1 / lerp(5, 34, u)) * (0.5 + R());
  }
  add(T(4, SC.adenosina.chip), 0.9, (t) => 0.16 * (Math.sin(TAU * 659.25 * t) + 0.4 * Math.sin(TAU * 1318.5 * t)) * ex(t, 0.3) * Math.min(1, t / 0.003));
  add(T(4, SC.adenosina.sube), 3.8 * rit[3], (t, g) => { const k = clamp(t / (3.8 * rit[3])); return 0.07 * k * Math.sin(TAU * (110 + 60 * k) * g) * sua(t, 0, 0.5); }); // zumbido de somnolencia (aprox.)
}

/* 5 · RECEPTOR Y CAFÉ (escena 5) */
{
  const clunk = (t0, g = 0.4) => { add(t0, 0.4, (t) => g * Math.sin(TAU * 95 * t) * ex(t, 0.09)); add(t0, 0.05, (t) => g * 0.8 * (R() * 2 - 1) * ex(t, 0.008)); add(t0, 0.3, (t) => g * 0.3 * Math.sin(TAU * 1800 * t) * ex(t, 0.05)); };
  clunk(T(5, SC.cafe.une), 0.25);                                                                            // la adenosina encaja
  const tu = T(5, SC.cafe.une);
  for (let k = 0; k < 4; k++) add(tu + 0.2 + k * 0.7, 0.5, (t) => 0.08 * Math.sin(TAU * 74 * t) * ex(t, 0.18));  // pulsos de señal «sueño»
  const tc = T(5, SC.cafe.cafe);
  for (let k = 0; k < 14; k++) { const tk = tc + k * 0.07 + R() * 0.03, f = 500 + R() * 800; add(tk, 0.09, (t) => 0.1 * Math.sin(TAU * f * (1 + 4 * t) * t) * ex(t, 0.03) * Math.min(1, t / 0.002)); } // goteo del café
  clunk(T(5, SC.cafe.bloquea), 0.55);                                                                        // la cafeína bloquea
  add(T(5, SC.cafe.bloquea) + 0.05, 0.5, (() => { const f = osc((g) => 320); return (t, g) => 0.06 * f(g) * ex(t, 0.2) * (Math.sin(TAU * 14 * t) > 0 ? 1 : 0.2); })()); // zumbido de «bloqueado»
}

/* 6 · CARRETERA, MICROSUEÑO Y DESPERTAR (escena 6) */
{
  const fL = lp(220), fM = lp(900), fB = lp(70);
  const muff = (g) => 1 - 0.9 * sua(g, E6.cab, E6.cie + 0.4) * (1 - sua(g, E6.ab, E6.ab + 0.15));
  const motor = osc((g) => 62 + 10 * Math.sin(TAU * 0.4 * g) - 22 * sua(g, E6.cab, E6.cie) * (1 - sua(g, E6.ab, E6.ab + 0.4)));
  add(E6.ini, E6.fin - E6.ini + 0.3, (t, g) => {
    const w = R() * 2 - 1, env = sua(g, E6.ini, E6.ini + 0.5) * (1 - sua(g, E6.fin - 0.4, E6.fin));
    const a = fL(w), b = fM(w), c = fB(w);
    return env * muff(g) * (0.55 * (motor(g) + 0.5 * Math.sin(TAU * 124 * g * (1 + 0.003 * Math.sin(TAU * 7 * g)))) * 0.45 + 1.1 * a + 0.5 * (b - a) + 1.8 * c) * 0.55;
  });
  add(E6.cie, 0.6, (t) => 0.5 * Math.sin(TAU * (70 - 24 * t) * t) * ex(t, 0.13) + 0.2 * (R() * 2 - 1) * ex(t, 0.02));         // se cierran los párpados
  for (let g = E6.cie + 0.5; g < E6.ab - 0.1; g += 1.15) { add(g, 0.2, (t) => 0.32 * Math.sin(TAU * (60 - 20 * t) * t) * ex(t, 0.05)); add(g + 0.26, 0.2, (t) => 0.2 * Math.sin(TAU * (68 - 20 * t) * t) * ex(t, 0.04)); } // latido lento y sordo
  // franja sonora (rumble strip) al abrir los ojos + bocina de un camión
  add(E6.ab, 1.0, (t) => { const am = 0.5 + 0.5 * Math.sign(Math.sin(TAU * 26 * t)); return 0.45 * ((R() * 2 - 1) * 0.6 + Math.sin(TAU * 90 * t)) * am * (1 - sua(t, 0.6, 1.0)) * sua(t, 0, 0.02); });
  add(E6.ab + 0.2, 0.9, (t) => 0.2 * (Math.sin(TAU * 349.2 * t) + Math.sin(TAU * 440 * t) + 0.4 * Math.sin(TAU * 698.4 * t)) * Math.min(1, t / 0.02) * (1 - sua(t, 0.6, 0.9)));
  add(E6.ab - 0.05, 0.3, (t) => 0.1 * (R() * 2 - 1) * sua(t, 0, 0.12) * (1 - sua(t, 0.12, 0.3)));                        // inhalación brusca
  for (let k = 0; k < 4; k++) add(E6.ab + 0.4 + k * 0.5, 0.2, (t) => 0.4 * Math.sin(TAU * (62 - 18 * t) * t) * ex(t, 0.05));  // latidos rápidos
}

/* 7 · HOSPITAL (escena 7) */
{
  const t0 = T(7, 0), t1 = T(8, 0);
  const fh = lp(160);
  add(t0, t1 - t0 + 0.2, (t, g) => { const w = R() * 2 - 1; const env = sua(g, t0, t0 + 0.4) * (1 - sua(g, t1 - 0.3, t1)); return env * (0.9 * fh(w) + 0.035 * Math.sin(TAU * 60 * g) + 0.02 * Math.sin(TAU * 120 * g)); });
  for (let g = t0 + 0.3; g < t1 - 0.2; g += 60 / 70) add(g, 0.1, (t) => 0.1 * Math.sin(TAU * 1000 * t) * Math.sin(Math.PI * clamp(t / 0.1)));   // monitor cardíaco
  const ta = T(7, SC.hospital.barraB), td = 1.2 * rit[6];
  const sube = osc((g) => 600 + 600 * clamp((g - ta) / td));
  add(ta, td + 0.1, (t, g) => 0.07 * sube(g) * sua(t, 0, 0.1) * (1 - sua(t, td - 0.1, td + 0.1)));                          // la barra roja crece
  const tm = T(7, SC.hospital.mas36);
  for (let k = 0; k < 2; k++) add(tm + k * 0.2, 0.15, (t) => 0.16 * (Math.sin(TAU * 1500 * t) + 0.3 * Math.sin(TAU * 3000 * t)) * Math.min(1, t / 0.003) * (1 - sua(t, 0.1, 0.15))); // alarma doble
  add(tm, 0.7, (t) => 0.4 * Math.sin(TAU * 58 * t) * ex(t, 0.16));
  const tc = T(7, SC.hospital.choque);                                                                           // choque
  add(tc, 0.5, (t) => 0.8 * (R() * 2 - 1) * ex(t, 0.045) * Math.min(1, t / 0.001));
  add(tc, 0.7, (t) => 0.7 * Math.sin(TAU * (64 - 30 * t) * t) * ex(t, 0.16));
  for (let k = 0; k < 28; k++) { const tk = tc + 0.03 + Math.pow(R(), 1.6) * 0.8, f = 2600 + R() * 5000; add(tk, 0.3, (t) => 0.05 * ex(t, 0.06) * Math.sin(TAU * f * t)); } // cristales
  const tx = T(7, SC.hospital.x23);
  add(tx, 1.0, (t) => 0.2 * (Math.sin(TAU * 523.25 * t) + 0.45 * Math.sin(TAU * 1046.5 * t)) * ex(t, 0.35) * Math.min(1, t / 0.003));
}

/* 8 · DESCANSO (escenas 8 y 9): respiración, pulso grave lento, campana a las 8 h y acorde abierto */
{
  const t0 = T(8, SC.dormir.eeg), t1 = T(9, 0) + 2.8;
  const fb = lp(900), fb2 = lp(240);
  add(t0, t1 - t0, (t, g) => {
    const env = sua(g, t0, t0 + 1.2) * (1 - sua(g, t1 - 1.6, t1));
    const w = R() * 2 - 1, resp = 0.5 + 0.5 * Math.sin(TAU * 0.22 * g - 1.2);
    return env * 0.22 * resp * (fb(w) - fb2(w)) * 2.2 + env * 0.1 * Math.sin(TAU * 0.85 * g) * Math.sin(TAU * 55 * g);
  });
  const ts = T(8, SC.dormir.sube + SC.dormir.subeDur);
  for (const [k, f] of [[0, 659.25], [0.18, 830.61], [0.36, 987.77], [0.54, 1318.5]]) add(ts + k, 1.6, (t) => 0.12 * (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * f * 2.01 * t)) * ex(t, 0.55) * Math.min(1, t / 0.003)); // campana de las 8 h
  const ta = T(8, SC.dormir.frase), tb = T(9, 0) + 3.4;
  add(ta, tb - ta, (t, g) => {
    const env = sua(g, ta, ta + 1.2) * (1 - sua(g, tb - 1.5, tb));
    return env * 0.07 * (Math.sin(TAU * 220 * g) + 0.7 * Math.sin(TAU * 277.18 * g) + 0.6 * Math.sin(TAU * 329.63 * g) + 0.4 * Math.sin(TAU * 493.88 * g)) * (0.85 + 0.15 * Math.sin(TAU * 0.35 * g));
  });
  for (let k = 0; k < 4; k++) add(T(9, 0.2) + 0.12 * k, 0.9, (t) => 0.07 * Math.sin(TAU * [880, 1108.7, 1318.5, 1760][k] * t) * ex(t, 0.4) * Math.min(1, t / 0.003)); // destello final de Sinapsis
}

/* 9 · reverb corto y límite suave */
{
  const retardos = [29.7, 43.1, 61.3, 89.9, 117.3];
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
const salida = join(RAIZ, "assets", "musica", "un-dia-sin-dormir.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
