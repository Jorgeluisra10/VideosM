#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «La piscina que cuelga entre dos edificios» (55,8 s).
 * Pista de «música» del motor: ambiente de altura + eventos físicos alineados con lo que se ve (los tiempos se calculan con el ritmo REAL de cada escena).
 *
 *   viento de altura         ruido filtrado constante; sube cuando las torres se mecen (escena 6) y vuelve a calmarse
 *   fractura del vidrio      chasquido seco + lluvia de esquirlas cristalinas (escena 2, cuando la viga de vidrio cede) y un golpe grave cuando entra el acrílico
 *   encastre metálico        golpes graves de las tinas de acero y del cojinete que desliza (escenas 5 y 6)
 *   zumbido de tensión       dos senos casi iguales que baten y suben cuando se tensan los cables (escena 5)
 *   llenado de agua          chorro filtrado + burbujas que suben con el odómetro de 0 a 150 t (escena 7) y un «ding» al llegar
 *   burbujeo y chapoteo      al final del zoom (escena 8): un chapuzón con reverberación y burbujas subacuáticas
 *
 * Uso:  node videos/2026-11-01-piscina-suspendida/componer-musica.mjs   → assets/musica/piscina-suspendida.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/piscina-suspendida.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 56;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const x = new Float32Array(N);
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(2718);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sua = (v, a, b) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const ex = (t, tau) => Math.exp(-t / tau);
const add = (t0, dur, fn) => { const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round((t0 + dur) * SR)); for (let i = i0; i < i1; i++) x[i] += fn((i - i0) / SR, i / SR); };

/* ───────── tiempos reales: inicio de cada escena y su ritmo (ideal de cada pieza; igual que el motor) ───────── */
const dur = [5.8, 6.5, 6.5, 6.5, 6.7, 7.5, 5.2, 6.9, 4.2];
const ideal = [5.25, 6.2, 6.45, 6.2, 6.7, 7.0, 5.2, 6.9, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
/** segundo absoluto del evento `t` (en segundos a ritmo normal) de la escena `n` (1–9) */
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TPIS en src/anim/piezas.ts
  vidrio: { carga: 0.9, rompe: 2.8, acril: 4.0 },
  tinas: { tinas: 0.2, viga: 1.0, tensores: 1.9, presion: 3.3 },
  viento: { rafaga: 1.5, falla: 3.1, rayosx: 4.0, apoyos: 4.4, flota: 5.4 },
  carga: { grifo: 0.8, sube: 1.0, subeDur: 3.2 },
  zoom: { ini: 0.2, dur: 5.0, nada: 5.5 },
};

/* ───────── DSP ───────── */
/** ruido filtrado en un polo (lp) con corte f(t) */
function ruidoLP(d, fc) { let y = 0; return (i) => { const t = i / SR, f = typeof fc === "function" ? fc(t) : fc; const a = 1 - Math.exp(-TAU * f / SR); y += a * ((R() * 2 - 1) - y); return y; }; }

/* 1 · VIENTO DE ALTURA (constante, con ráfagas) */
{
  const lfo = (() => { const r = prng(77); const pts = Array.from({ length: 500 }, () => r() * 2 - 1); return (t, v) => { const u = t * v, i = Math.floor(u), k = u - i; return lerp(pts[i % 500], pts[(i + 1) % 500], k * k * (3 - 2 * k)); }; })();
  const rafaga = (T0, T1) => (t) => sua(t, T0 - 0.4, T0 + 0.9) * (1 - sua(t, T1, T1 + 1.8));
  const rf = rafaga(T(6, SC.viento.rafaga), T(6, SC.viento.apoyos) + 0.3);
  let a = 0, b = 0, c = 0;
  add(0, DURACION, (t, g) => {
    const fuerza = 0.55 + 0.2 * lfo(g, 0.35) + 1.15 * rf(g) * (0.7 + 0.3 * lfo(g, 1.9));
    const fc1 = 280 + 220 * lfo(g, 0.5) + 420 * rf(g), fc2 = 900 + 500 * lfo(g, 0.8) + 900 * rf(g);
    const w = R() * 2 - 1;
    a += (1 - Math.exp(-TAU * fc1 / SR)) * (w - a);
    b += (1 - Math.exp(-TAU * fc2 / SR)) * (w - b);
    c += (1 - Math.exp(-TAU * 90 / SR)) * (w - c);
    const silbo = Math.sin(TAU * (1250 + 260 * lfo(g, 0.45)) * g) * 0.015 * (0.4 + rf(g)) * (0.5 + 0.5 * lfo(g, 0.9));
    return fuerza * (1.6 * a + 0.8 * (b - a) * 0.6 + 2.2 * c) * sua(g, 0, 1.2) + silbo;
  });
}
/* 2 · FRACTURA DEL VIDRIO (escena 2) */
{
  const t0 = T(2, SC.vidrio.rompe);
  add(t0, 0.25, (t) => 0.9 * (R() * 2 - 1) * ex(t, 0.012) * (1 - 0.6 * sua(t, 0, 0.2)));                                // chasquido seco
  add(t0, 0.5, (t) => 0.5 * Math.sin(TAU * (95 - 40 * t) * t) * ex(t, 0.09));                                             // golpe sordo
  for (let k = 0; k < 46; k++) {                                                                                        // esquirlas: pings agudos que caen
    const tk = t0 + 0.03 + Math.pow(R(), 1.7) * 1.1, f = 2400 + R() * 5200, g = 0.045 + R() * 0.07, tau = 0.04 + R() * 0.12;
    add(tk, 0.5, (t) => g * ex(t, tau) * (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 2.37 * t)));
  }
  add(t0 + 0.02, 0.9, (() => { const n = ruidoLP(0.9, 7000); return (t, g) => 0.18 * ex(t, 0.2) * (n(Math.round(t * SR)) - 0.7 * n(Math.round(t * SR) + 3)); })());
  const ta = T(2, SC.vidrio.acril);                                                                                      // llega el acrílico: golpe grave y «tunc» denso
  add(ta, 0.9, (t) => 0.55 * (Math.sin(TAU * 58 * t) + 0.4 * Math.sin(TAU * 116 * t)) * ex(t, 0.22));
  add(ta, 0.2, (t) => 0.3 * (R() * 2 - 1) * ex(t, 0.02));
}
/* 3 · ENCASTRE METÁLICO (escenas 5 y 6) y ECOS DE ACERO */
const clang = (t0, f = 180, g = 0.5) => {
  add(t0, 1.4, (t) => g * ex(t, 0.35) * (Math.sin(TAU * f * t) + 0.55 * Math.sin(TAU * f * 2.76 * t) + 0.35 * Math.sin(TAU * f * 5.4 * t) + 0.2 * Math.sin(TAU * f * 8.93 * t)) * Math.min(1, t / 0.0015));
  add(t0, 0.5, (t) => g * 0.8 * Math.sin(TAU * 62 * t) * ex(t, 0.1));
  add(t0, 0.04, (t) => g * 0.7 * (R() * 2 - 1) * ex(t, 0.006));
};
clang(T(5, SC.tinas.tinas), 190, 0.7);                       // tina izquierda
clang(T(5, SC.tinas.tinas) + 0.42, 160, 0.6);                // tina derecha
add(T(5, SC.tinas.viga), 0.7, (t) => 0.4 * Math.sin(TAU * 74 * t) * ex(t, 0.16) + 0.12 * (R() * 2 - 1) * ex(t, 0.03)); // la viga asienta
/* 4 · ZUMBIDO DE TENSIÓN (escena 5: se tensan los dos cables) */
{
  const t0 = T(5, SC.tinas.tensores), t1 = T(5, SC.tinas.presion) + 1.2;
  add(t0 - 0.1, t1 - t0 + 1.2, (t, g) => {
    const k = sua(g, t0, t1), env = sua(g, t0 - 0.1, t0 + 0.5) * (1 - sua(g, t1, t1 + 1.1));
    const f = 118 + 36 * k;
    return env * (0.2 + 0.4 * k) * (Math.sin(TAU * f * g) + Math.sin(TAU * (f * 1.012) * g) + 0.4 * Math.sin(TAU * f * 2 * g) + 0.15 * Math.sin(TAU * (700 + 700 * k) * g) * (0.6 + 0.4 * Math.sin(TAU * 6 * g)));
  });
  for (let k = 0; k < 2; k++) add(t0 + 0.1 + k * 0.15, 0.7, (t) => 0.26 * Math.sin(TAU * (410 + 180 * k) * t) * ex(t, 0.2));   // «pling» de cada tensor al engancharse
}
/* 5 · VIENTO QUE MECE LAS TORRES: CRUJIDO DE LA UNIÓN RÍGIDA Y APOYOS QUE DESLIZAN (escena 6) */
{
  const tf = T(6, SC.viento.falla);
  add(tf, 0.7, (t) => 0.8 * (R() * 2 - 1) * ex(t, 0.02) * (t < 0.12 ? 1 : 0.2));                                          // crac de la unión rígida (ilustración)
  add(tf, 1.2, (t) => 0.45 * Math.sin(TAU * (210 + 70 * Math.sin(TAU * 7 * t)) * t) * ex(t, 0.4));                         // quejido metálico
  for (let k = 0; k < 18; k++) { const f = 3000 + R() * 4500, tk = tf + Math.pow(R(), 1.4) * 0.8; add(tk, 0.3, (t) => 0.04 * ex(t, 0.08) * Math.sin(TAU * f * t)); }
  const ta = T(6, SC.viento.apoyos);
  clang(ta, 150, 0.6);                                                                                                       // el apoyo encaja
  add(ta + 0.2, 1.8, (() => { let y = 0; return (t) => { const w = R() * 2 - 1; y += 0.08 * (w - y); return 0.22 * y * Math.sin(Math.PI * clamp(t / 1.8)) * (0.7 + 0.3 * Math.sin(TAU * 22 * t)); }; })()); // deslizamiento: roce suave
  add(ta + 1.8, 0.9, (t) => 0.22 * (Math.sin(TAU * 523 * t) + 0.4 * Math.sin(TAU * 1046 * t)) * ex(t, 0.35) * Math.min(1, t / 0.003));   // «ding» del puente que flota
}
/* 6 · LLENADO DE AGUA (escena 7), sincronizado con el odómetro */
{
  const t0 = T(7, SC.carga.sube), d = SC.carga.subeDur * rit[6], tg = T(7, SC.carga.grifo);
  add(tg, 0.4, (t) => 0.3 * Math.sin(TAU * 240 * t) * ex(t, 0.07));                                                         // se abre la válvula
  add(t0 - 0.1, d + 0.4, (() => { let a = 0, b = 0; return (t, g) => {
    const k = clamp((g - t0) / d), env = sua(g, t0 - 0.1, t0 + 0.4) * (1 - sua(g, t0 + d, t0 + d + 0.4));
    const w = R() * 2 - 1, f1 = 500 + 1500 * k, f2 = 2500 + 1500 * k;
    a += (1 - Math.exp(-TAU * f1 / SR)) * (w - a); b += (1 - Math.exp(-TAU * f2 / SR)) * (w - b);
    return env * (0.25 + 0.2 * k) * (a * 2.4 + (b - a) * 0.5 * (0.5 + 0.5 * Math.sin(TAU * 11 * g)));
  }; })());
  const nb = 140;
  for (let k = 0; k < nb; k++) {                                                                                           // burbujas: «bloop» que suben de tono
    const u = (k + R()) / nb, tk = t0 + u * d, f0 = 380 + 900 * R() + 700 * u, g = (0.05 + 0.06 * R()) * (0.5 + u);
    add(tk, 0.09, (t) => g * Math.sin(TAU * (f0 * (1 + 4 * t)) * t) * ex(t, 0.03) * Math.min(1, t / 0.002));
  }
  const tl = t0 + d;
  add(tl, 1.1, (t) => 0.28 * (Math.sin(TAU * 784 * t) + 0.45 * Math.sin(TAU * 1568 * t)) * ex(t, 0.35) * Math.min(1, t / 0.002));  // llegó a 150 t
  add(tl, 0.9, (t) => 0.3 * Math.sin(TAU * 49 * t) * ex(t, 0.22));
}
/* 7 · ZOOM Y CHAPUZÓN (escena 8) */
{
  const t0 = T(8, SC.zoom.ini), d = SC.zoom.dur * rit[7];
  add(t0, d + 0.4, (() => { let a = 0; return (t, g) => {                                                                // barrido que sube al alejarse
    const k = clamp((g - t0) / d), w = R() * 2 - 1, f = 300 * Math.pow(10, 2.0 * k);
    a += (1 - Math.exp(-TAU * f / SR)) * (w - a);
    return 0.16 * a * 3 * sua(g, t0, t0 + 0.6) * (1 - 0.7 * sua(g, t0 + d, t0 + d + 0.4)) + 0.05 * Math.sin(TAU * (120 * Math.pow(8, k)) * g) * sua(g, t0, t0 + 0.8);
  }; })());
  const tn = T(8, SC.zoom.nada);
  add(tn, 0.9, (() => { let a = 0; return (t) => { const w = R() * 2 - 1, f = 5000 * ex(t, 0.22) + 400; a += (1 - Math.exp(-TAU * f / SR)) * (w - a); return 0.95 * a * 2 * (Math.min(1, t / 0.004)) * ex(t, 0.28); }; })()); // chapoteo
  add(tn, 0.7, (t) => 0.55 * Math.sin(TAU * (130 - 70 * t) * t) * ex(t, 0.14));                                           // «plof» grave
  for (let k = 0; k < 90; k++) {                                                                                         // burbujeo subacuático
    const tk = tn + 0.05 + Math.pow(R(), 1.3) * 2.6, f0 = 220 + R() * 900, g = 0.1 * (1 - clamp((tk - tn) / 3));
    add(tk, 0.12, (t) => g * Math.sin(TAU * (f0 * (1 + 5 * t)) * t) * ex(t, 0.04) * Math.min(1, t / 0.002));
  }
}
/* 8 · REVERB DE PASILLO DE CRISTAL y fundido final */
{
  const retardos = [37.3, 53.1, 71.7, 97.9, 131.3, 167.9];
  const y = new Float32Array(N);
  for (const ms of retardos) { const dl = Math.round((ms * SR) / 1000), lin = new Float32Array(dl); let p = 0, lp = 0; for (let i = 0; i < N; i++) { const o = lin[p]; lp += 0.35 * (o - lp); lin[p] = x[i] + 0.78 * lp; y[i] += o; p = (p + 1) % dl; } }
  for (let i = 0; i < N; i++) x[i] += y[i] * 0.2;
}
let pico = 0;
for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(x[i]));
const g = 0.9 / Math.max(1e-4, pico);
for (let i = 0; i < N; i++) x[i] = Math.tanh(x[i] * g * 1.15) * 0.9;
const f = Math.round(0.03 * SR);
for (let i = 0; i < f; i++) { x[i] *= i / f; x[N - 1 - i] *= i / f; }
mkdirSync(join(RAIZ, "assets", "musica"), { recursive: true });
const salida = join(RAIZ, "assets", "musica", "piscina-suspendida.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
console.log(`   fractura ${T(2, SC.vidrio.rompe).toFixed(2)} s · tinas ${T(5, SC.tinas.tinas).toFixed(2)} s · tensión ${T(5, SC.tinas.tensores).toFixed(2)} s · ráfaga ${T(6, SC.viento.rafaga).toFixed(2)} s · apoyos ${T(6, SC.viento.apoyos).toFixed(2)} s · llenado ${T(7, SC.carga.sube).toFixed(2)}–${(T(7, SC.carga.sube) + SC.carga.subeDur * rit[6]).toFixed(2)} s · chapuzón ${T(8, SC.zoom.nada).toFixed(2)} s`);
