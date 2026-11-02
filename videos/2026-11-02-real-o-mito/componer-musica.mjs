#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «¿Real o mito?» (58,1 s). Estilo concurso de TV caricaturesco.
 * Pista de «música» del motor: base saltarina + eventos alineados con lo que se ve (los tiempos usan el ritmo REAL de cada escena).
 *
 *   base de concurso       bajo con pizzicato (Do–La menor–Fa–Sol, 116 lpm), arpegio de plucks y bloque de madera en los tiempos 2 y 4
 *   sello REAL             golpe seco + campanilla ascendente de tres notas + ovación breve
 *   sello MITO             golpe + zumbido de error + trombón triste de cuatro notas («uah-uah-uah-uaaah»)
 *   hics                   inhalación breve + «boing» agudo en cada hipo (escena 2) y gruñido nasal del cerdo
 *   risas                  chillidos agudos rápidos (cosquillas de otra persona) y un solo grillo cuando son las propias
 *   chicle                 trago grave, zap al tachar el 7 y chirridos que suben y bajan mientras recorre el tubo
 *   caja registradora      «cha-ching» al aparecer la pastilla cara y barras que suben con tics
 *   violín                 melodía propia de cinco notas con arco y vibrato mientras suena el electrodo
 *   ¡PUM!                  explosión cómica con platillo al golpe de la lesión (escena 7)
 *   marcador               campanillas verdes, zumbido en el rojo, fanfarria de trofeo, confeti y aplausos
 *
 * Uso:  node videos/2026-11-02-real-o-mito/componer-musica.mjs   → assets/musica/real-o-mito.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/real-o-mito.wav   (y --restaurar al terminar; el WAV no va a git)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, escribirWavEstereo } from "../../scripts/audio.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DURACION = 58.5;
const N = Math.round(DURACION * SR), TAU = Math.PI * 2;
const x = new Float32Array(N);
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(1618033);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sua = (v, a, b) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;
const ex = (t, tau) => Math.exp(-t / tau);
const add = (t0, dur, fn) => { const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round((t0 + dur) * SR)); for (let i = i0; i < i1; i++) x[i] += fn((i - i0) / SR, i / SR); };
const osc = (fFn) => { let ph = 0; return (g) => { ph += (TAU * fFn(g)) / SR; return Math.sin(ph); }; };
const lp = (fc) => { let y = 0; const a = 1 - Math.exp(-TAU * fc / SR); return (w) => (y += a * (w - y)); };
const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);

/* ───────── tiempos reales ───────── */
const dur = [5.2, 6.6, 6.9, 6.2, 7.9, 7.6, 6.9, 5.2, 5.6];
const ideal = [4.8, 6.2, 6.4, 5.9, 7.4, 7.1, 6.4, 4.8, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TCUR en src/anim/piezas.ts
  gancho: { mascota: 0.3, cartas: 2.6, paso: 0.32, pregunta: 4.4 },
  hipo: { cerdo: 0.5, hic: [1.7, 2.6, 3.5, 4.4, 5.3], anios: 1.5, aniosDur: 2.8, sello: 5.7 },
  cosquillas: { otro: 0.9, serio: 3.0, cerebelo: 3.8, sello: 5.6 },
  chicle: { boca: 0.2, siete: 1.0, tacha: 2.6, sello: 3.7, viaje: 4.1, viajeDur: 1.9 },
  pastilla: { barata: 0.5, cara: 1.4, barras: 3.3, barrasDur: 2.2, mas: 5.5, sello: 6.6 },
  violin: { violin: 0.9, electrodo: 2.2, dolor: 4.8, sello: 6.2 },
  acento: { antes: 1.0, golpe: 2.3, despues: 2.9, banderas: 4.1, sello: 5.6 },
  marcador: { luces: 0.5, paso: 0.38, copa: 3.0, comentar: 3.6 },
};

/* ───────── instrumentos ───────── */
const pluck = (t0, f, g = 0.3, tau = 0.12) => add(t0, tau * 6, (t) => g * (Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * f * 2 * t) + 0.12 * Math.sin(TAU * f * 3 * t)) * ex(t, tau) * Math.min(1, t / 0.003));
const campanilla = (t0, f, g = 0.2, tau = 0.4) => add(t0, tau * 5, (t) => g * (Math.sin(TAU * f * t) + 0.45 * Math.sin(TAU * f * 2.76 * t) + 0.2 * Math.sin(TAU * f * 5.4 * t)) * ex(t, tau) * Math.min(1, t / 0.002));
const golpe = (t0, g = 0.6) => { add(t0, 0.5, (t) => g * Math.sin(TAU * (90 - 45 * t) * t) * ex(t, 0.1)); add(t0, 0.06, (t) => g * 0.9 * (R() * 2 - 1) * ex(t, 0.012)); };
const aplauso = (t0, d, g = 0.1) => { const f = lp(3200), f2 = lp(700); add(t0, d, (t) => { const w = R() * 2 - 1, env = sua(t, 0, 0.15) * (1 - sua(t, d - 0.5, d)); const clap = Math.pow(R(), 6) > 0.5 ? 1 : 0.35; return env * g * (f(w) - f2(w)) * 4 * clap; }); };

/* 1 · BASE DE CONCURSO: bajo + pluck + bloque de madera (116 lpm) */
{
  const beat = 60 / 116, acordes = [[36, 43, 48], [33, 40, 45], [29, 36, 41], [31, 38, 43]];
  const aplausoFin = T(9, 0) + 5.6;
  for (let b = 0; b * beat < DURACION - 1; b++) {
    const g = b * beat;
    if (g < 0.2 || g > aplausoFin) continue;
    const ac = acordes[Math.floor(b / 4) % 4], k = b % 4;
    const vol = g < T(2, 0) ? 0.7 : 1;
    pluck(g, hz(ac[k % 2 === 0 ? 0 : 1]), 0.2 * vol, 0.16);                              // bajo
    if (k === 1 || k === 3) add(g, 0.04, (t) => 0.1 * vol * Math.sin(TAU * 1800 * t) * ex(t, 0.008));   // bloque de madera en 2 y 4
    pluck(g + beat / 2, hz(ac[2] + 12 + (k % 3) * 2), 0.07 * vol, 0.09);                 // arpegio sobre el contratiempo
  }
}

/* 2 · STING DE SELLO (REAL o MITO) */
const real = (t0) => {
  golpe(t0, 0.55);
  [[0, 84], [0.09, 88], [0.18, 91]].forEach(([d, n]) => campanilla(t0 + 0.04 + d, hz(n), 0.18, 0.35));
  aplauso(t0 + 0.12, 1.1, 0.12);
};
const mito = (t0) => {
  golpe(t0, 0.6);
  const z = osc(() => 108);
  add(t0, 0.7, (t, g) => 0.16 * (z(g) + 0.6 * Math.sign(Math.sin(TAU * 112 * g))) * ex(t, 0.35) * Math.min(1, t / 0.004));    // zumbido de error
  const nt = [[0.5, 62, 0.34], [0.9, 61, 0.34], [1.3, 60, 0.34], [1.7, 58, 0.9]];                                           // trombón triste
  nt.forEach(([d, n, l], i) => {
    const f0 = hz(n), v = osc((g) => f0 * (1 + 0.012 * Math.sin(TAU * 5.5 * g)) * (i === 3 ? 1 - 0.035 * clamp((g - (t0 + d)) / l) : 1));
    add(t0 + d, l + 0.1, (t, g) => 0.15 * (v(g) + 0.5 * Math.sin(TAU * f0 * 2 * g) + 0.25 * Math.sin(TAU * f0 * 3 * g)) * Math.min(1, t / 0.04) * (1 - sua(t, l - 0.06, l + 0.1)));
  });
};

/* 3 · ESCENA 1: presentación */
{
  const t0 = T(1, SC.gancho.mascota);
  add(t0, 0.25, (t) => 0.3 * Math.sin(TAU * (260 + 700 * t / 0.25) * t) * ex(t, 0.12));                                    // «boing» de Cerebrito
  for (let i = 0; i < 6; i++) { const tk = T(1, SC.gancho.cartas + SC.gancho.paso * i); add(tk, 0.08, (t) => 0.15 * Math.sin(TAU * (500 + 120 * i) * t) * ex(t, 0.03)); }
  const sw = osc((g) => 500 * Math.pow(3, clamp((g - T(1, SC.gancho.pregunta)) / 0.5)));
  add(T(1, SC.gancho.pregunta), 0.55, (t, g) => 0.16 * sw(g) * sua(t, 0, 0.05) * (1 - sua(t, 0.4, 0.55)));                // silbido ascendente
}

/* 4 · ESCENA 2: hipo, cerdo y años */
{
  const oink = (t0) => { const f = osc((g) => 190 - 60 * clamp((g - t0) / 0.28)); add(t0, 0.3, (t, g) => 0.22 * (f(g) + 0.7 * Math.sign(Math.sin(TAU * 95 * g))) * sua(t, 0, 0.03) * (1 - sua(t, 0.2, 0.3))); };
  oink(T(2, SC.hipo.cerdo));
  for (const h of SC.hipo.hic) {
    const th = T(2, h);
    add(th - 0.06, 0.07, (t) => 0.16 * (R() * 2 - 1) * Math.sin(Math.PI * clamp(t / 0.07)));                                // inhalación
    const f = osc((g) => 700 - 380 * clamp((g - th) / 0.12));
    add(th, 0.15, (t, g) => 0.32 * f(g) * ex(t, 0.05) * Math.min(1, t / 0.003));                                            // «hic»
    add(th + 0.03, 0.3, (t) => 0.22 * Math.sin(TAU * (320 + 640 * clamp(t / 0.12)) * t) * ex(t, 0.09));                      // boing
  }
  real(T(2, SC.hipo.sello));
}

/* 5 · ESCENA 3: cosquillas */
{
  const t0 = T(3, SC.cosquillas.otro), t1 = T(3, SC.cosquillas.serio);
  for (let g = t0; g < t1 - 0.1; g += 0.07 + R() * 0.07) { const f = 1100 + R() * 1400; add(g, 0.07, (t) => 0.1 * Math.sin(TAU * f * (1 + 0.8 * t / 0.07) * t) * Math.sin(Math.PI * clamp(t / 0.07))); }
  add(t1, 0.4, (t) => 0.2 * Math.sin(TAU * 4300 * t) * Math.sin(Math.PI * clamp(t / 0.12)) * (t < 0.12 ? 1 : 0));          // un solo grillo
  add(t1 + 0.25, 0.1, (t) => 0.2 * Math.sin(TAU * 4300 * t) * Math.sin(Math.PI * clamp(t / 0.1)));
  add(T(3, SC.cosquillas.cerebelo), 0.4, (t) => 0.2 * Math.sin(TAU * (400 + 2600 * t / 0.4) * t) * ex(t, 0.2));
  real(T(3, SC.cosquillas.sello));
}

/* 6 · ESCENA 4: chicle (MITO) */
{
  const tg = T(4, SC.chicle.boca), f = osc((g) => 220 - 150 * clamp((g - tg) / 0.3));
  add(tg + 0.1, 0.4, (t, g) => 0.3 * f(g) * ex(t, 0.12) + 0.1 * (R() * 2 - 1) * ex(t, 0.05));                              // trago
  add(T(4, SC.chicle.tacha), 0.3, (t) => 0.22 * Math.sin(TAU * (3000 - 2400 * t / 0.3) * t) * ex(t, 0.1));                  // zap al tachar
  mito(T(4, SC.chicle.sello));
  const t0 = T(4, SC.chicle.viaje), d = SC.chicle.viajeDur * rit[3];
  for (let i = 0; i < 6; i++) { const tk = t0 + (i / 6) * d, f0 = 500 + (i % 2) * 400; const sq = osc((g) => f0 * (1 + 0.8 * clamp((g - tk) / 0.18))); add(tk, 0.2, (t, g) => 0.12 * sq(g) * Math.sin(Math.PI * clamp(t / 0.2))); }   // chirridos del viaje
  campanilla(T(4, SC.chicle.viaje + SC.chicle.viajeDur), hz(88), 0.12, 0.3);
}

/* 7 · ESCENA 5: caja registradora */
{
  const tc = T(5, SC.pastilla.cara);
  campanilla(tc, 2093, 0.18, 0.18); campanilla(tc + 0.09, 3136, 0.14, 0.2);
  add(tc, 0.35, (t) => 0.25 * (R() * 2 - 1) * ex(t, 0.012) + 0.2 * Math.sin(TAU * 140 * t) * ex(t, 0.06));
  add(T(5, SC.pastilla.barata), 0.2, (t) => 0.25 * Math.sin(TAU * (300 + 500 * t / 0.2) * t) * ex(t, 0.1));
  const t0 = T(5, SC.pastilla.barras), d = SC.pastilla.barrasDur * rit[4];
  for (let k = 0; k < 14; k++) { const tk = t0 + (k / 13) * d; add(tk, 0.06, (t) => 0.1 * Math.sin(TAU * (700 + 60 * k) * t) * ex(t, 0.02)); }
  add(T(5, SC.pastilla.mas), 0.3, (t) => 0.22 * Math.sin(TAU * (350 + 900 * t / 0.3) * t) * ex(t, 0.12));
  real(T(5, SC.pastilla.sello));
}

/* 8 · ESCENA 6: violín con electrodos */
{
  const melodia = [[0, 0.5, 72], [0.5, 0.5, 76], [1.0, 0.5, 79], [1.5, 0.75, 76], [2.25, 0.5, 74], [2.75, 0.5, 77], [3.25, 0.5, 81], [3.75, 1.0, 79]];
  const t0 = T(6, SC.violin);
  for (const [d, l, n] of melodia) {
    const f0 = hz(n), tt = t0 + d, v = osc((g) => f0 * (1 + 0.006 * Math.sin(TAU * 5.8 * g) * sua(g - tt, 0.1, 0.3)));
    add(tt, l + 0.1, (t, g) => 0.1 * (v(g) + 0.5 * Math.sin(TAU * f0 * 2 * g) + 0.3 * Math.sin(TAU * f0 * 3 * g) + 0.15 * Math.sin(TAU * f0 * 4 * g)) * sua(t, 0, 0.06) * (1 - sua(t, l - 0.05, l + 0.1)) * (0.85 + 0.15 * (R() * 2 - 1) * 0.3));
  }
  const te = T(6, SC.violin + 1.3);
  add(te, 0.5, (t) => 0.2 * Math.sin(TAU * (800 + 2400 * t / 0.5) * t) * ex(t, 0.2));                                      // electrodo
  add(T(6, SC.violin.dolor), 0.3, (t) => 0.2 * (Math.sin(TAU * 1500 * t) + 0.4 * Math.sin(TAU * 3000 * t)) * ex(t, 0.08));  // tic de «sin dolor»
  real(T(6, SC.violin.sello));
}

/* 9 · ESCENA 7: acento extranjero */
{
  const tg = T(7, SC.acento.golpe);
  golpe(tg, 0.7);
  add(tg, 0.9, (t) => 0.3 * (R() * 2 - 1) * ex(t, 0.16) * (1 - ((t * 9000) % 1) * 0.3));                                    // platillo cómico
  add(T(7, SC.acento.antes), 0.2, (t) => 0.2 * Math.sin(TAU * (350 + 500 * t / 0.2) * t) * ex(t, 0.1));
  add(T(7, SC.acento.despues), 0.5, (t) => 0.2 * Math.sin(TAU * (300 + 90 * Math.sin(TAU * 8 * t)) * t) * ex(t, 0.25));         // voz que «cambia»
  campanilla(T(7, SC.acento.banderas), hz(84), 0.14, 0.3); campanilla(T(7, SC.acento.banderas) + 0.12, hz(79), 0.12, 0.3);
  real(T(7, SC.acento.sello));
}

/* 10 · ESCENA 8: marcador, trofeo y aplausos */
{
  [0, 1, 2, 3, 4, 5].forEach((i) => {
    const tk = T(8, SC.marcador.luces + SC.marcador.paso * i);
    if (i === 2) { golpe(tk, 0.3); add(tk, 0.5, (t, g) => 0.14 * Math.sign(Math.sin(TAU * 118 * g)) * ex(t, 0.2)); } else campanilla(tk, hz(84 + (i % 3) * 3), 0.16, 0.25);
  });
  const tt = T(8, SC.marcador.copa);
  [[0, 60], [0.14, 64], [0.28, 67], [0.46, 72]].forEach(([d, n]) => { const f0 = hz(n); add(tt + d, 0.6, (t, g) => 0.14 * (Math.sin(TAU * f0 * g) + 0.5 * Math.sin(TAU * f0 * 2 * g) + 0.3 * Math.sin(TAU * f0 * 3 * g) + 0.2 * Math.sin(TAU * f0 * 5 * g)) * sua(t, 0, 0.02) * (1 - sua(t, 0.4, 0.6))); });
  for (let k = 0; k < 5; k++) add(tt + 0.02 + k * 0.05, 0.12, (t) => 0.3 * (R() * 2 - 1) * ex(t, 0.03));                          // poppers de confeti
  aplauso(tt + 0.2, 3.2, 0.14);
  add(T(8, SC.marcador.comentar), 0.2, (t) => 0.25 * Math.sin(TAU * (400 + 700 * t / 0.2) * t) * ex(t, 0.1));
}

/* 11 · ESCENA 9: jingle de cierre */
{
  const t0 = T(9, 0.3);
  [[0, 72], [0.12, 76], [0.24, 79], [0.36, 84]].forEach(([d, n]) => pluck(t0 + d, hz(n), 0.2, 0.25));
  campanilla(t0 + 0.55, hz(96), 0.12, 0.5);
  const tf = T(9, 3.2);
  [[0, 67], [0.1, 72], [0.2, 76]].forEach(([d, n]) => campanilla(tf + d, hz(n + 12), 0.1, 0.5));
}

/* 12 · reverb corto, límite suave y fundidos */
{
  const retardos = [31.1, 44.9, 63.7, 87.3, 119.1];
  const y = new Float32Array(N);
  for (const ms of retardos) { const dl = Math.round((ms * SR) / 1000), lin = new Float32Array(dl); let p = 0, l = 0; for (let i = 0; i < N; i++) { const o = lin[p]; l += 0.4 * (o - l); lin[p] = x[i] + 0.7 * l; y[i] += o; p = (p + 1) % dl; } }
  for (let i = 0; i < N; i++) x[i] += y[i] * 0.14;
}
let pico = 0;
for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(x[i]));
const gn = 0.9 / Math.max(1e-4, pico);
for (let i = 0; i < N; i++) x[i] = Math.tanh(x[i] * gn * 1.1) * 0.9;
const f = Math.round(0.03 * SR), fo = Math.round(1.4 * SR);
for (let i = 0; i < f; i++) x[i] *= i / f;
for (let i = 0; i < fo; i++) x[N - 1 - i] *= i / fo;
mkdirSync(join(RAIZ, "assets", "musica"), { recursive: true });
const salida = join(RAIZ, "assets", "musica", "real-o-mito.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
