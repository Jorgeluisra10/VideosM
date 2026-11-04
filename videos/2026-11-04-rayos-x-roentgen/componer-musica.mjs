#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «La noche que Röntgen vio a través de la piel» (64,7 s). Tono: misterio de laboratorio de 1895 que se abre a asombro.
 * Pista de «música» del motor: colchón grave + zumbido eléctrico + eventos alineados con lo que se ve (los tiempos usan el ritmo REAL de cada escena).
 *
 *   colchón        acordes graves en Re menor / La menor; se abre a Fa y Re mayor en el Nobel y en el Día de la Radiología
 *   zumbido        zumbido eléctrico de 50–60 Hz y chispas de la bobina; se corta con el clic de la luz
 *   pantalla       destello ascendente cuando la pantalla verde se enciende y campanas cuando aparecen los huesos
 *   contador       tics suaves mientras corre el 131, el ≈ 15 min de exposición y las vueltas
 *   interrogantes  blips agudos de marimba y golpe sordo al caer la «X»
 *   placa          siseo de revelado, campana del anillo y reloj de la exposición
 *   mundo          sello, pings de las ciudades que se encienden y chasquido de la aguja
 *   Nobel          golpe del sello «rechazó», campana dorada y monedas
 *   cierre         golpe sordo de las quemaduras, destello de «hoy» y gran campana del 8 de noviembre
 *
 * Uso:  node videos/2026-11-04-rayos-x-roentgen/componer-musica.mjs   → assets/musica/rayos-x-roentgen.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/rayos-x-roentgen.wav   (y --restaurar al terminar; el WAV no va a git)
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
const R = prng(181895);
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
const dur = [7.6, 7.8, 7, 6, 7.8, 7.8, 7.1, 8.8, 4.8];
const ideal = [7.1, 7.3, 6.6, 5.5, 7.1, 7.3, 6.5, 8.1, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TRX en src/anim/piezas.ts
  gancho: { titulo: 0.2, anios: 1.4, aniosDur: 1.8, pantalla: 3.0, huesos: 5.0 },
  tubo: { chip: 0.2, bobina: 0.6, carton: 1.2, luz: 3.6, brilla: 5.7 },
  huesos: { rayos: 1.0, mano: 2.6, manoDur: 1.0, cuenta: 4.0, huesos: 5.0 },
  x: { pregunta: 0.2, x: 1.8, incognita: 3.6 },
  anna: { semanas: 0.2, fecha: 1.2, placa: 2.6, anillo: 5.0, tiempo: 6.0, cita: 6.4 },
  mundo: { papel: 0.2, fecha: 1.2, enero: 2.6, aguja: 4.7 },
  nobel: { patente: 0.2, sello: 0.8, medalla: 1.2, primer: 2.6, dinero: 4.0 },
  cierre: { riesgo: 0.2, quema: 2.2, hoy: 3.3, dia: 4.4 },
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

/* 1 · COLCHÓN: acordes graves que se abren con la historia */
{
  const acordes = [
    { t: 0, notas: [38, 45, 53, 57] },                      // Re menor
    { t: T(3, 0), notas: [33, 45, 52, 57, 60] },            // La menor
    { t: T(5, 0), notas: [38, 45, 50, 53, 57] },            // Re menor 7
    { t: T(7, 0), notas: [41, 48, 53, 57, 60] },            // Fa mayor: el premio
    { t: T(8, SC.cierre.hoy) - 0.3, notas: [38, 45, 54, 62, 66, 69] }, // Re mayor
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

/* 2 · ESCENA 1: contador, pantalla que se enciende y huesos */
{
  ticsContador(T(1, SC.gancho.anios), SC.gancho.aniosDur * rit[0], easeOut, 131, 0.05, 1800, 3400);
  campana(T(1, SC.gancho.anios) + SC.gancho.aniosDur * rit[0], 62, 0.07, 1.2);
  const tp = T(1, SC.gancho.pantalla);
  subida(tp, 0.7, 120, 900, 0.06); chispas(tp, 0.5, 0.1);
  add(tp, 4, (t) => 0.025 * Math.sin(TAU * 60 * t) * sua(t, 0, 0.5) * (1 - sua(t, 3, 4)));              // zumbido de la pantalla
  const th = T(1, SC.gancho.huesos);
  [[0, 62], [0.12, 69], [0.24, 74]].forEach(([d, n]) => campana(th + d, n, 0.08, 1.4));
  golpe(th, 0.3, 58);
}

/* 3 · ESCENA 2: bobina, cartón, clic de la luz y pantalla que brilla */
{
  const t0 = T(2, SC.tubo.bobina);
  add(t0, T(2, SC.tubo.luz) - t0, (t, g) => 0.02 * (Math.sin(TAU * 100 * t) + 0.5 * Math.sin(TAU * 300 * t)) * sua(t, 0, 0.4));         // zumbido de la bobina
  chispas(t0, T(2, SC.tubo.luz) - t0 + 2, 0.06);
  golpe(T(2, SC.tubo.carton), 0.4, 66); soplo(T(2, SC.tubo.carton), 0.4, 0.05, 900);
  const tl = T(2, SC.tubo.luz);
  tic(tl, 0.16, 1500); tic(tl + 0.03, 0.1, 800);                                                         // clic del interruptor
  golpe(tl + 0.04, 0.18, 50);
  const tb = T(2, SC.tubo.brilla);
  subida(tb, 0.9, 200, 1500, 0.05); campana(tb + 0.8, 69, 0.08, 1.4); campana(tb + 0.95, 76, 0.06, 1.4);
}

/* 4 · ESCENA 3: rayos, mano y huesos */
{
  const tr = T(3, SC.huesos.rayos);
  soplo(tr, 1.4, 0.05, 3200); subida(tr, 0.7, 500, 1400, 0.03);
  const tm = T(3, SC.huesos.mano);
  soplo(tm, SC.huesos.manoDur * rit[2] + 0.3, 0.07, 600);
  tic(T(3, SC.huesos.cuenta), 0.1, 1700);
  const th = T(3, SC.huesos.huesos);
  [[0, 57], [0.15, 64], [0.3, 69]].forEach(([d, n]) => campana(th + d, n, 0.09, 1.5));
  golpe(th, 0.32, 56);
}

/* 5 · ESCENA 4: interrogantes y la X */
{
  const t0 = T(4, SC.x.pregunta), t1 = T(4, SC.x.x);
  for (let g = t0 + 0.1, k = 0; g < t1 - 0.1; k++, g += 0.16 + R() * 0.12) campana(g, 69 + penta[Math.floor(R() * 5)] + 12 * Math.floor(R() * 2), 0.03, 0.25);   // blips de marimba
  subida(t1 - 0.3, 0.5, 200, 1200, 0.05);
  golpe(t1, 0.45, 56); campana(t1 + 0.04, 62, 0.1, 1.6); campana(t1 + 0.04, 74, 0.05, 1.6);
  const ti = T(4, SC.x.incognita);
  tic(ti, 0.1, 1600); campana(ti + 0.1, 66, 0.07, 1.0);
}

/* 6 · ESCENA 5: revelado, anillo y reloj de la exposición */
{
  const tp = T(5, SC.anna.placa);
  soplo(tp, 1.8, 0.05, 3600); subida(tp, 1.4, 150, 700, 0.025);
  for (let g = tp + 0.3; g < tp + 2; g += 0.05 + R() * 0.1) burbuja(g, 0.015);
  const ta = T(5, SC.anna.anillo);
  campana(ta, 81, 0.09, 1.2); campana(ta + 0.1, 88, 0.05, 1.2); golpe(ta, 0.2, 60);
  const tt = T(5, SC.anna.tiempo);
  ticsContador(tt, 1.2, (k) => k, 10, 0.05, 1500, 1500);
  golpe(T(5, SC.anna.cita), 0.34, 52);
  [[0, 50], [0.1, 57], [0.2, 62]].forEach(([d, n]) => campana(T(5, SC.anna.cita) + d, n, 0.07, 1.8));
}
function burbuja(t0, g = 0.05) { const f = 500 + R() * 900; add(t0, 0.12, (t) => g * Math.sin(TAU * (f + 900 * t) * t) * ex(t, 0.03) * Math.min(1, t / 0.003)); }

/* 7 · ESCENA 6: sello, ciudades que se encienden y aguja */
{
  golpe(T(6, SC.mundo.fecha), 0.4, 62);
  const te = T(6, SC.mundo.enero);
  soplo(te, 0.8, 0.06, 1200); subida(te, 0.8, 200, 900, 0.03);
  for (let i = 0; i < 34; i++) { const g = te + 0.2 + Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1) * 1.9; campana(g, 74 + penta[i % 5] + 12 * (i % 3 === 0 ? 1 : 0), 0.022, 0.35); }
  const ta = T(6, SC.mundo.aguja);
  subida(ta, 0.4, 600, 2400, 0.05); chispas(ta, 0.3, 0.1); campana(ta + 0.35, 81, 0.1, 1.4); campana(ta + 0.5, 88, 0.06, 1.4);
}

/* 8 · ESCENA 7: patente rechazada, Nobel y monedas */
{
  golpe(T(7, SC.nobel.sello), 0.5, 56);
  const tm = T(7, SC.nobel.medalla);
  [[0, 65], [0.1, 72], [0.2, 77], [0.3, 81]].forEach(([d, n]) => campana(tm + d, n, 0.08, 1.6));
  tic(T(7, SC.nobel.primer), 0.1, 1800);
  for (let g = T(7, SC.nobel.dinero) + 0.1; g < T(7, SC.nobel.dinero) + 1.9; g += 0.15 + R() * 0.05) moneda(g, 0.05);
  campana(T(7, SC.nobel.dinero) + 1.9, 69, 0.07, 1.2);
}

/* 9 · ESCENA 8: quemaduras, hoy y el día de la radiología */
{
  const tq = T(8, SC.cierre.quema);
  golpe(tq, 0.42, 48); add(tq, 0.7, (t) => 0.05 * (Math.sin(TAU * 98 * t) + Math.sin(TAU * 103.5 * t)) * ex(t, 0.3));   // disonancia breve
  const th = T(8, SC.cierre.hoy);
  subida(th - 0.1, 0.4, 300, 1400, 0.04); campana(th + 0.3, 76, 0.07, 1.0); campana(th + 0.45, 81, 0.05, 1.0);
  const td = T(8, SC.cierre.dia);
  tic(td - 0.05, 0.12, 1500);
  [[0, 50], [0.1, 57], [0.2, 62], [0.3, 66], [0.4, 69], [0.5, 74], [0.6, 78]].forEach(([d, n]) => campana(td + d, n, 0.08, 2.0));
  golpe(td, 0.3, 54);
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
const salida = join(RAIZ, "assets", "musica", "rayos-x-roentgen.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
