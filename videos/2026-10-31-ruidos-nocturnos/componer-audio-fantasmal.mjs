#!/usr/bin/env node
/**
 * AUDIO FANTASMAL Y GRACIOSO para «La física de los ruidos nocturnos» (51,3 s): UN solo archivo con efectos de terror de dibujos animados
 * (crujidos, pasos, gemidos de fantasma, un grito, cadenas, susurros, viento) y una música de fantasma divertida (theremin tembloroso, pizzicato «de puntillas»,
 * celesta de caja de música, clavicordio, fagot, redoble, «ba-dum-tss» y trombón triste). Todo sintetizado aquí mismo: sin muestras ni licencias.
 *
 * Está ALINEADO al video: cada «cue» arranca en el inicio de su escena y los golpes caen en los eventos visuales
 * (pico de la señal a los 2,5 s, salto de la fricción a los 26,35 s, «¡igual de seco!» a los 32,2 s, sello a los 37,8 s, colapso del zoom a los 44,5 s).
 * A los 28,9 s hay un CORTE BRUSCO (el video pasa a papel): 0,35 s de silencio total.
 * Los textos hablados no están (el video aún no lleva voz): los gags caen en el momento aproximado de cada palabra.
 *
 * Uso: node videos/2026-10-31-ruidos-nocturnos/componer-audio-fantasmal.mjs   → trabajo/archivo/2026-10-31-ruidos-nocturnos/audio-fantasmal-comico.wav (estéreo, 48 kHz, 16 bits)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const SR = 48000;
export const DUR = 51.3;
export const CORTE = 28.9, SILENCIO = 0.35;
const N = Math.round(DUR * SR);
const TAU = Math.PI * 2;
const prng = (s) => () => { let t = (s += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const R = prng(31415);
const L = new Float32Array(N), Rt = new Float32Array(N), W = new Float32Array(N);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
const ns = (d) => Math.max(1, Math.round(d * SR));
const buf = (d) => new Float32Array(ns(d));
const ex = (t, tau) => Math.exp(-t / tau);
const sm = (v, a, b) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, k) => a + (b - a) * k;

/* ───────── DSP básico ───────── */
/** oscilador con frecuencia fija o f(t) */
function osc(d, fn, wave = "sine") {
  const x = buf(d); let ph = 0;
  for (let i = 0; i < x.length; i++) {
    const f = typeof fn === "function" ? fn(i / SR) : fn;
    ph += f / SR; ph -= Math.floor(ph);
    x[i] = wave === "sine" ? Math.sin(TAU * ph) : wave === "saw" ? 2 * ph - 1 : wave === "square" ? (ph < 0.5 ? 1 : -1) : wave === "tri" ? 4 * Math.abs(ph - 0.5) - 1 : wave === "pulse" ? (ph < 0.25 ? 1 : -1) : 0;
  }
  return x;
}
const noise = (d) => { const x = buf(d); for (let i = 0; i < x.length; i++) x[i] = R() * 2 - 1; return x; };
/** filtro de estado variable (Chamberlin): lp / bp / hp con corte fijo o f(t) */
function svf(x, tipo, fc, Q = 1) {
  const y = new Float32Array(x.length); let low = 0, band = 0; const q = 1 / Q;
  for (let i = 0; i < x.length; i++) {
    const f = Math.min(7000, Math.max(20, typeof fc === "function" ? fc(i / SR) : fc));
    const F = 2 * Math.sin((Math.PI * f) / SR);
    low += F * band; const high = x[i] - low - q * band; band += F * high;
    y[i] = tipo === "lp" ? low : tipo === "bp" ? band * q : high;
  }
  return y;
}
const mul = (x, fn) => { for (let i = 0; i < x.length; i++) x[i] *= fn(i / SR); return x; };
const sum = (...xs) => { const m = Math.max(...xs.map((a) => a.length)); const o = new Float32Array(m); for (const a of xs) for (let i = 0; i < a.length; i++) o[i] += a[i]; return o; };
const scale = (x, g) => { for (let i = 0; i < x.length; i++) x[i] *= g; return x; };
const fade = (x, a = 0.005, b = 0.02) => { const fa = ns(a), fb = ns(b); for (let i = 0; i < Math.min(fa, x.length); i++) x[i] *= i / fa; for (let i = 0; i < Math.min(fb, x.length); i++) x[x.length - 1 - i] *= i / fb; return x; };
/** coloca un sonido mono en t0 con ganancia, panorama (-1…1) y envío a la reverb */
function put(t0, x, g = 1, pan = 0, rev = 0.2) {
  const i0 = Math.round(t0 * SR), gl = g * Math.cos(((pan + 1) * Math.PI) / 4), gr = g * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let k = 0; k < x.length; k++) { const i = i0 + k; if (i < 0 || i >= N) continue; L[i] += x[k] * gl; Rt[i] += x[k] * gr; W[i] += x[k] * g * rev; }
}
/** ruido de baja frecuencia suave (para pequeñas derivas) */
const deriva = (semilla, rapidez = 3) => { const r = prng(semilla); const pts = Array.from({ length: 400 }, () => r() * 2 - 1); return (t) => { const u = t * rapidez, i = Math.floor(u), k = u - Math.floor(u); return lerp(pts[i % 400], pts[(i + 1) % 400], k * k * (3 - 2 * k)); }; };

/* ───────── EFECTOS DE TERROR ───────── */
/** crujido de madera/puerta: pulsos de adherencia-deslizamiento sobre un tono que tiembla, con resonancia de madera */
function crujido(d, f0 = 220, f1 = f0, ritmo = 22, aspereza = 0.5, semilla = 1) {
  const dv = deriva(semilla, 5), jit = deriva(semilla + 9, 11);
  let ph = 0, pulso = 0;
  const x = buf(d);
  for (let i = 0; i < x.length; i++) {
    const t = i / SR, u = t / d;
    const f = lerp(f0, f1, u) * (1 + 0.22 * dv(t));
    ph += f / SR; ph -= Math.floor(ph);
    pulso += (ritmo * (1 + 0.5 * jit(t))) / SR; pulso -= Math.floor(pulso);
    const gate = Math.pow(Math.sin(Math.PI * pulso), 1.5);
    x[i] = (2 * ph - 1) * gate * (0.55 + 0.45 * Math.abs(jit(t * 1.7)));
  }
  const body = svf(x, "bp", (t) => 900 + 500 * Math.sin(t * 7), 4);
  const bajo = svf(x, "lp", 300, 1.5);
  const y = sum(scale(body, 1.3), scale(bajo, 0.5), scale(mul(noise(d), (t) => 0.06 * aspereza * Math.abs(Math.sin(t * 60))), 1));
  return fade(mul(y, (t) => sm(t, 0, 0.08) * (1 - sm(t, d - 0.15, d))), 0.003, 0.02);
}
/** chasquido seco de madera que cede (con ecos de «tic-tic») */
function chasquido(grande = 1) {
  const a = svf(noise(0.18), "bp", 1800, 3), b = osc(0.3, (t) => 85 - 30 * t, "sine");
  const golpe = sum(scale(mul(a, (t) => ex(t, 0.012)), 1.6), scale(mul(b, (t) => ex(t, 0.07)), 1.1 * grande));
  const tics = buf(0.35);
  for (const [t, g] of [[0.045, 0.45], [0.09, 0.3], [0.16, 0.2]]) { const c = svf(noise(0.05), "bp", 2300 + R() * 900, 4); for (let k = 0; k < c.length; k++) { const i = ns(t) + k; if (i < tics.length) tics[i] += c[k] * g * ex(k / SR, 0.008); } }
  return sum(golpe, tics);
}
/** paso sobre tarima que cruje */
function paso(peso = 1) {
  const thud = mul(osc(0.2, (t) => 72 - 30 * t, "sine"), (t) => ex(t, 0.06));
  const roce = mul(svf(noise(0.15), "lp", 450, 1), (t) => ex(t, 0.035));
  return sum(scale(thud, peso), scale(roce, 0.9 * peso), scale(crujido(0.28, 190 + R() * 80, 140 + R() * 60, 24, 0.3, Math.floor(R() * 99)), 0.22));
}
/** gemido de fantasma «uuuUUUuuu» (vocales con formantes, vibrato y respiración) */
function gemido(d, f0, f1, vocal = "u", fuerza = 1) {
  const vib = (t) => 1 + 0.035 * Math.sin(TAU * 5.2 * t) * sm(t, 0.1, 0.6);
  const f = (t) => lerp(f0, f1, sm(t / d, 0, 1)) * vib(t) * (1 + 0.012 * Math.sin(TAU * 0.7 * t));
  const base = osc(d, f, "pulse"), alto = osc(d, (t) => f(t) * 2.003, "sine");
  const F = vocal === "u" ? [[320, 5], [820, 6]] : vocal === "o" ? [[500, 6], [900, 6]] : [[750, 7], [1200, 7]];
  const bocas = F.map(([fc, q]) => svf(base, "bp", (t) => fc * (1 + 0.1 * Math.sin(TAU * 0.5 * t)), q));
  const aire = mul(svf(noise(d), "bp", 1600, 1.2), () => 0.25);
  const env = (t) => sm(t, 0, d * 0.35) * (1 - sm(t, d * 0.7, d)) * (0.85 + 0.15 * Math.sin(TAU * 4.1 * t));
  return mul(sum(scale(bocas[0], 1.4), scale(bocas[1], 1.1), scale(alto, 0.12), aire), (t) => env(t) * fuerza);
}
/** grito de dibujos animados (agudo, con vibrato rápido y caída) */
function grito(d = 1.0) {
  const f = (t) => lerp(620, 1350, sm(t / d, 0, 0.25)) * (1 - 0.35 * sm(t / d, 0.55, 1)) * (1 + 0.04 * Math.sin(TAU * 8.5 * t));
  const base = osc(d, f, "saw");
  const bocas = [[820, 6], [1250, 6], [2700, 8]].map(([fc, q]) => svf(base, "bp", fc, q));
  const aspero = mul(svf(noise(d), "bp", 2400, 1.5), () => 0.35);
  return fade(mul(sum(scale(bocas[0], 1.3), scale(bocas[1], 1.0), scale(bocas[2], 0.5), aspero), (t) => sm(t, 0, 0.03) * ex(t, d * 0.7)), 0.003, 0.06);
}
/** susurros «ssshhh» con sílabas */
function susurro(d, silabas = 5) {
  const x = svf(noise(d), "bp", 3600, 0.9), r = prng(5);
  const marcas = Array.from({ length: silabas }, (_, i) => ({ t: (i + 0.3 * r()) * (d / silabas), l: (0.5 + 0.5 * r()) * (d / silabas) }));
  return mul(x, (t) => { let g = 0; for (const m of marcas) { const u = (t - m.t) / m.l; if (u > 0 && u < 1) g = Math.max(g, Math.sin(Math.PI * u)); } return 0.5 * g; });
}
/** viento con silbido (corte que barre) */
function viento(d, fuerza = 1) {
  const dv = deriva(77, 0.7);
  const x = noise(d);
  const a = svf(x, "bp", (t) => 380 + 260 * dv(t) + 90 * Math.sin(t * 0.9), 5), b = svf(x, "lp", 260, 1);
  return mul(sum(scale(a, 0.9), scale(b, 0.7)), (t) => fuerza * (0.55 + 0.45 * dv(t * 0.6)) * sm(t, 0, 0.8) * (1 - sm(t, d - 1.2, d)));
}
/** cadenas arrastrándose: ráfagas de campanitas metálicas inarmónicas */
function cadenas(d = 1.0, densidad = 38) {
  const x = buf(d), r = prng(404);
  for (let k = 0; k < densidad * d; k++) {
    const t0 = r() * d * (0.4 + 0.6 * r()), f = 900 + r() * 2600, g = 0.08 + r() * 0.1;
    const ping = sum(osc(0.15, f, "sine"), scale(osc(0.15, f * 2.76, "sine"), 0.5), scale(osc(0.15, f * 5.4, "sine"), 0.25));
    for (let i = 0; i < ping.length; i++) { const j = ns(t0) + i; if (j < x.length) x[j] += ping[i] * g * ex(i / SR, 0.03); }
  }
  return x;
}
/** campanada grave de reloj de pie */
function campana(f = 196) {
  const d = 2.4;
  return mul(sum(osc(d, f, "sine"), scale(osc(d, f * 2.0, "sine"), 0.35), scale(osc(d, f * 2.76, "sine"), 0.22), scale(osc(d, f * 4.1, "sine"), 0.12), scale(osc(d, f * 5.43, "sine"), 0.07)), (t) => ex(t, 0.7) * sm(t, 0, 0.002));
}
const tictac = (alto) => mul(sum(svf(noise(0.04), "bp", alto ? 2100 : 1500, 6), scale(osc(0.04, alto ? 900 : 700, "sine"), 0.5)), (t) => ex(t, 0.008) * 1.2);
/** silbato de émbolo (slide whistle) */
function silbato(d, f0, f1) {
  const x = osc(d, (t) => lerp(f0, f1, sm(t / d, 0, 1)) * (1 + 0.012 * Math.sin(TAU * 6 * t)), "sine");
  return fade(mul(sum(x, scale(mul(svf(noise(d), "bp", 3000, 2), () => 0.06), 1)), (t) => sm(t, 0, 0.03) * (1 - sm(t, d - 0.06, d))), 0.004, 0.02);
}
const boing = (f0 = 200) => mul(osc(0.7, (t) => f0 * (1 + 0.7 * ex(t, 0.2) * Math.sin(TAU * 11 * (1 + 2 * t) * t)) + 40 * ex(t, 0.3), "sine"), (t) => ex(t, 0.22) * sm(t, 0, 0.004));
/** trombón triste: cuatro notas descendentes con «wah» */
function trombonTriste() {
  const notas = [[0, 0.5, 58], [0.55, 0.5, 57], [1.1, 0.5, 56], [1.65, 1.6, 55]];
  const x = buf(3.4);
  for (const [t0, dn, m] of notas) {
    const ult = t0 > 1.5;
    const o = osc(dn + 0.05, (t) => mf(m) * (ult ? 1 - 0.03 * sm(t, 0.3, dn) + 0.012 * Math.sin(TAU * 6.5 * t) * sm(t, 0.4, 1) : 1), "saw");
    const wah = svf(o, "lp", (t) => (ult ? 700 + 500 * Math.sin(TAU * 4.2 * t + 1) : 650 + 400 * Math.sin(TAU * 3 * t)), 2.5);
    const y = mul(wah, (t) => sm(t, 0, 0.04) * (1 - sm(t, dn - 0.08, dn + 0.05)));
    for (let i = 0; i < y.length; i++) { const j = ns(t0) + i; if (j < x.length) x[j] += y[i]; }
  }
  return x;
}
/** «ba-dum-tss» */
function redoblante(tipo) {
  if (tipo === "tom") return sum(mul(osc(0.3, (t) => 150 - 60 * t, "sine"), (t) => ex(t, 0.09)), scale(mul(svf(noise(0.1), "lp", 900), (t) => ex(t, 0.02)), 0.6));
  if (tipo === "caja") return sum(mul(osc(0.2, 210, "sine"), (t) => ex(t, 0.04)), scale(mul(svf(noise(0.25), "hp", 1800), (t) => ex(t, 0.07)), 0.9));
  return scale(mul(svf(noise(0.9), "hp", 5500), (t) => ex(t, 0.25) * sm(t, 0, 0.003)), 0.9);
}
const timbal = () => sum(mul(osc(1.2, (t) => 82 - 12 * t, "sine"), (t) => ex(t, 0.32)), scale(mul(svf(noise(0.12), "lp", 500), (t) => ex(t, 0.02)), 0.7));
const sello = () => sum(mul(osc(0.35, (t) => 95 - 30 * t, "sine"), (t) => ex(t, 0.07)), scale(mul(svf(noise(0.15), "lp", 1300), (t) => ex(t, 0.025)), 1.2));
const latido = () => sum(mul(osc(0.3, 52, "sine"), (t) => ex(t, 0.07) * sm(t, 0, 0.006)), scale(mul(osc(0.3, 48, "sine"), (t) => ex(Math.max(0, t - 0.17), 0.08) * (t > 0.17 ? 1 : 0)), 0.8));
const grillo = () => { const x = buf(0.5); for (let k = 0; k < 3; k++) { const c = mul(osc(0.1, 4300, "sine"), (t) => Math.sin(Math.PI * t / 0.1) * (0.5 + 0.5 * Math.sin(TAU * 38 * t))); for (let i = 0; i < c.length; i++) x[ns(k * 0.14) + i] += c[i] * 0.4; } return x; };
const click = () => mul(svf(noise(0.012), "bp", 2800, 3), (t) => ex(t, 0.003) * 3);
const madera = (f = 1500) => sum(mul(osc(0.12, f, "sine"), (t) => ex(t, 0.025)), scale(mul(svf(noise(0.05), "bp", f * 1.3, 4), (t) => ex(t, 0.01)), 0.8));
const metal = (f = 1800) => sum(mul(osc(0.9, f, "sine"), (t) => ex(t, 0.28)), scale(mul(osc(0.9, f * 2.76, "sine"), (t) => ex(t, 0.16)), 0.5), scale(mul(osc(0.9, f * 5.4, "sine"), (t) => ex(t, 0.08)), 0.3));
const clonk = (f = 520) => sum(mul(osc(0.5, f, "square"), (t) => ex(t, 0.05) * 0.4), scale(mul(osc(0.7, f * 1.5, "sine"), (t) => ex(t, 0.18)), 0.6), scale(mul(svf(noise(0.05), "bp", 1400, 3), (t) => ex(t, 0.01)), 0.8));
/** barrido de ruido que sube (zoom) o implosión */
function barrido(d, f0, f1, g = 1) { const x = noise(d); return mul(svf(x, "bp", (t) => f0 * Math.pow(f1 / f0, t / d), 2.2), (t) => g * Math.pow(t / d, 1.6) * sm(t, 0, 0.1)); }
function subida(d, f0, f1, ruido = 0.3) { return mul(sum(osc(d, (t) => f0 * Math.pow(f1 / f0, Math.pow(t / d, 1.4)), "sine"), scale(mul(svf(noise(d), "bp", (t) => f0 * 2 * Math.pow(f1 / f0, t / d), 2), () => ruido), 1)), (t) => sm(t, 0, d * 0.2) * Math.pow(t / d, 0.8)); }
function cajon(d = 0.9) { return crujido(d, 330, 520, 17, 0.9, 12); }

/* ───────── INSTRUMENTOS DE LA MÚSICA ───────── */
/** theremin con portamento: notas = [[inicio, duración, midi], …] */
function theremin(notasAbs, g = 1, pan = 0.15) {
  const tIni = notasAbs[0][0], notas = notasAbs.map(([a, d, m]) => [a - tIni, d, m]);
  const fin = Math.max(...notas.map(([t, d]) => t + d)) + 0.3, x = buf(fin);
  let ph = 0, fAct = mf(notas[0][2]), vph = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    let obj = null;
    for (const [t0, dn, m] of notas) if (t >= t0 && t < t0 + dn) { obj = { t0, dn, m }; break; }
    if (obj) fAct += (mf(obj.m) - fAct) * (1 - Math.exp(-1 / (SR * 0.07)));
    const u = obj ? t - obj.t0 : 0;
    vph += (5.6 + 0.8 * Math.sin(t)) / SR;
    const f = fAct * (1 + (obj ? 0.013 * sm(u, 0.2, 0.7) : 0) * Math.sin(TAU * vph));
    ph += f / SR; ph -= Math.floor(ph);
    const env = obj ? sm(u, 0, 0.09) * (1 - sm(u, obj.dn - 0.12, obj.dn)) : 0;
    x[i] = env * (Math.sin(TAU * ph) + 0.22 * Math.sin(TAU * 2 * ph + 0.4)) * (0.9 + 0.1 * Math.sin(TAU * 0.3 * t));
  }
  put(tIni, scale(x, g), 1, pan, 0.45);
}
const pizz = (m, d = 0.4) => { const f = mf(m), x = buf(d); for (let i = 0; i < x.length; i++) { const t = i / SR; let s = 0; for (let k = 1; k <= 5; k++) s += (1 / k) * Math.sin(TAU * f * k * t) * ex(t, 0.16 / (1 + 0.6 * k)); x[i] = s * (1 + 0.5 * ex(t, 0.004)); } return fade(x, 0.001, 0.02); };
const celesta = (m, d = 1.0) => { const f = mf(m); return mul(sum(osc(d, f, "sine"), scale(osc(d, f * 4, "sine"), 0.28), scale(osc(d, f * 7.1, "sine"), 0.1)), (t) => (ex(t, 0.35) * 0.75 + ex(t, 0.06) * 0.35) * sm(t, 0, 0.002)); };
const clave = (m, d = 0.5) => { const f = mf(m); return mul(svf(osc(d, f, "saw"), "lp", 3200, 1), (t) => ex(t, 0.13) * sm(t, 0, 0.002)); };
const fagot = (m, d = 0.45) => { const f = mf(m); return fade(mul(svf(osc(d, f, "square"), "lp", 750, 1.4), (t) => sm(t, 0, 0.02) * (1 - sm(t, d - 0.12, d)) * (1 + 0.15 * Math.sin(TAU * 5 * t))), 0.004, 0.03); };
const sneakMotivo = [45, 48, 52, null, 56, 52, 48, null];
/** riff de pizzicato «de puntillas»: tantos compases como `compases`, a corcheas de `corchea` segundos */
function sneak(t0, compases, corchea = 0.325, g = 0.5, transp = 0) {
  for (let k = 0; k < Math.round(compases * 8); k++) { const m = sneakMotivo[k % 8]; if (m !== null) put(t0 + k * corchea, pizz(m + transp, 0.35), g * (k % 4 === 0 ? 1 : 0.8), -0.25, 0.25); }
}
/** acorde de clavicordio picado */
const acorde = (t0, ms, g = 0.35, pan = 0.3) => ms.forEach((m, k) => put(t0 + k * 0.012, clave(m, 0.4), g, pan + k * 0.05, 0.3));
/** drone grave y oscuro */
function drone(t0, d, g = 0.4, f = 55) {
  const x = sum(osc(d, f, "sine"), osc(d, f * 1.0108, "sine"), scale(osc(d, f * 1.5, "sine"), 0.35), scale(osc(d, f * 2.02, "sine"), 0.15));
  put(t0, mul(x, (t) => sm(t, 0, Math.min(1.2, d * 0.3)) * (1 - sm(t, d - 1.0, d))), g, 0, 0.35);
}

/* ═════════════════════ PARTITURA, ESCENA POR ESCENA ═════════════════════ */
const B = 0.65; // pulso de la música (s)
// ── ESCENA 1 · 0,0–5,2 · «A las tres y catorce, un paso en el pasillo. ¿Demonio? No: física.» ──
put(0, viento(5.6, 0.6), 1, -0.3, 0.5);
drone(0, 5.2, 0.34);
for (let k = 0; k < 8; k++) put(0.25 + k * 0.5, tictac(k % 2 === 0), 0.14, -0.4, 0.15);              // reloj de pared
[0.55, 1.12, 1.7].forEach((t, k) => put(t, campana(k === 2 ? 174 : 196), 0.42, 0.1, 0.55));          // tres campanadas (las 3 AM)
theremin([[0.3, 1.3, 81], [1.7, 0.9, 80], [2.7, 1.5, 83]], 0.1, 0.2);                                  // melodía tenue y temblorosa
put(1.95, paso(0.9), 0.55, -0.3, 0.3); put(2.25, paso(1.0), 0.6, 0.1, 0.3);                           // pasos en el pasillo
put(2.5, chasquido(1.4), 1.0, 0, 0.5);                                                                  // ← el «paso exacto»: pico de la señal
put(2.65, gemido(1.5, 330, 520, "u", 0.8), 0.55, 0.3, 0.6);                                              // «¿Demonio?»
put(3.0, susurro(0.9, 5), 0.4, -0.5, 0.4);
put(3.95, boing(260), 0.5, 0, 0.3);                                                                      // «No: física» — el susto se desinfla
sneak(4.1, 0.5, 0.3, 0.5);
// ── ESCENA 2 · 5,2–10,4 · «De día el sol calienta tu casa y todo se expande, en silencio.» ──
const mel2 = [[0, 76], [1, 79], [2, 81], [3, 79], [4, 76], [5, 74], [6, 72], [7, 71]];
mel2.forEach(([b, m]) => put(5.25 + b * B, celesta(m, 1.0), 0.32, 0.2, 0.4));
[0, 2, 4, 6].forEach((b) => put(5.25 + b * B, pizz(45, 0.5), 0.5, -0.2, 0.2));
[1, 3, 5, 7].forEach((b) => acorde(5.25 + b * B, [57, 60, 64], 0.2, 0.3));
put(5.8, metal(2400), 0.25, 0.4, 0.4);                                                                   // el sol: destello
[6.0, 6.3, 6.6, 6.85, 7.1].forEach((t, k) => put(t, madera(1800 + k * 160), 0.18, 0.3 - k * 0.15, 0.2)); // fotones
put(7.2, silbato(0.8, 520, 1250), 0.4, 0.2, 0.3);                                                        // «se expande»
put(8.4, metal(1500), 0.18, -0.2, 0.3);                                                                  // 30 °C
put(9.62, grillo(), 0.22, -0.3, 0.2); put(10.12, grillo(), 0.18, 0.3, 0.2);                              // «en silencio»…
// ── ESCENA 3 · 10,4–15,6 · «De noche la temperatura cae y todo se encoge, pero no por igual.» ──
put(10.3, viento(5.4, 0.7), 1, 0.3, 0.5);
drone(10.4, 5.2, 0.34, 55);
put(10.9, gemido(1.7, 620, 280, "o", 0.9), 0.5, -0.3, 0.6);                                              // todo se «encoge»
put(11.4, silbato(0.9, 900, 300), 0.18, 0.2, 0.3);
sneak(10.6, 1, 0.34, 0.45);
theremin([[11.1, 1.1, 76], [12.3, 1.0, 74], [13.4, 1.2, 72]], 0.1, -0.2);
put(11.9, crujido(0.7, 380, 300, 20, 0.5, 3), 0.55, -0.4, 0.4);                                         // crujidos que difieren
put(12.6, crujido(1.0, 240, 190, 15, 0.7, 4), 0.6, 0.4, 0.4); put(12.6, sello(), 0.45, 0, 0.3);         // tensión acumulada
put(13.8, crujido(1.3, 300, 280, 18, 0.7, 5), 0.5, -0.5, 0.45); put(13.8, crujido(1.3, 360, 330, 19, 0.7, 6), 0.5, 0.5, 0.45); // «pero no por igual»
acorde(13.8, [57, 58, 64], 0.4, 0);                                                                       // segunda menor: disonancia
[14.5, 15.1].forEach((t) => put(t, latido(), 0.5, 0, 0.3));
// ── ESCENA 4 · 15,6–22,0 · «Aluminio, acero y madera se contraen distinto… hasta diez veces según su fibra.» ──
[15.9, 16.2, 16.5, 16.8, 17.1].forEach((t) => put(t, madera(900 + (t - 15.9) * 200), 0.25, (t - 16.5) * 0.4, 0.2)); // columnas que aparecen
put(16.35, metal(2000), 0.55, 0.4, 0.4);                                                                  // aluminio: tilín
put(17.3, clonk(520), 0.6, -0.1, 0.35);                                                                    // acero: clonc
put(18.0, madera(1300), 0.6, -0.4, 0.25); put(18.18, madera(1100), 0.55, -0.4, 0.25);                      // madera: toc-toc
[0, 1, 2, 3].forEach((k) => { put(15.7 + k * 1.3, fagot(45, 0.5), 0.35, -0.2, 0.2); put(16.35 + k * 1.3, fagot(52, 0.4), 0.3, -0.2, 0.2); });
for (let k = 0; k < 14; k++) put(19.2 + Math.pow(k / 13, 1.6) * 0.95, madera(1100 + k * 40), 0.16 + k * 0.012, 0.2, 0.15); // ratchet que acelera
put(20.1, boing(220), 0.55, 0, 0.3);                                                                       // ×10
put(20.2, gemido(1.6, 480, 760, "a", 0.5), 0.3, 0.3, 0.5);
theremin([[20.6, 0.5, 64], [21.15, 0.5, 69], [21.7, 0.9, 72]], 0.1, 0.2);
put(20.9, subida(1.4, 120, 520, 0.1), 0.32, 0, 0.3);
// ── ESCENA 5 · 22,0–28,9 · «La fricción frena el movimiento y acumula tensión, hasta que resbala de golpe. Ese salto es el crujido.» ──
put(21.95, viento(5, 0.5), 1, -0.3, 0.5);
sneak(22.0, 2, 0.24, 0.5, 0);
[0.8, 1.6, 2.3, 2.9, 3.3, 3.62, 3.88, 4.08, 4.24].forEach((t, k) => put(22 + t, crujido(0.5 - k * 0.03, 200 + k * 22, 260 + k * 28, 18 + k * 3, 0.6, 20 + k), 0.4 + k * 0.04, (k % 2 ? 0.4 : -0.4), 0.4)); // adhiere-resbala-adhiere, cada vez más rápido
put(22.4, subida(3.95, 180, 1900, 0.5), 0.34, 0, 0.35);
let tl = 22.3, gap = 0.9; while (tl < 26.3) { put(tl, latido(), 0.35 + 0.25 * sm(tl, 22, 26.3), 0, 0.3); tl += gap; gap = Math.max(0.32, gap * 0.82); }
for (let k = 0; k < 14; k++) put(24.2 + k * 0.15, timbal(), 0.04 + k * 0.022, -0.2, 0.3);               // redoble que crece
// ★ salto (26,35 s): CRAC + grito + cadenas + ecos de la onda de choque
put(26.35, chasquido(2.2), 1.0, 0, 0.6); put(26.35, timbal(), 0.9, 0, 0.5);
acorde(26.35, [45, 51, 57, 63], 0.55, 0);                                                                  // golpe de orquesta
put(26.4, grito(1.1), 0.55, 0, 0.6);
put(26.5, cadenas(0.9), 0.5, 0.4, 0.5);
put(26.7, gemido(2.0, 700, 260, "o", 0.9), 0.45, -0.3, 0.7);
[[26.92, 0.6], [27.4, 0.4], [27.9, 0.25]].forEach(([t, g], k) => put(t, chasquido(1), g, k % 2 ? 0.5 : -0.5, 0.6)); // ecos de la onda de choque
put(27.1, susurro(1.5, 7), 0.35, 0.5, 0.6);
// ── CORTE BRUSCO a 28,9 s (el video entra en papel): silencio total hasta 29,25 s ──
// ── ESCENA 6 · 28,9–34,1 · «Tu cerebro oye un asesino. La física oye un cajón enfriándose dos grados.» ──
put(29.25, click(), 0.9, -0.2, 0.05); put(29.55, silbato(0.06, 1000, 1000), 0.3, 0, 0.05); // clic de laboratorio + bip
[29.9, 30.5, 31.1, 31.7].forEach((t, k) => put(t, click(), 0.55, k % 2 ? 0.3 : -0.3, 0.05));
for (let k = 0; k < 14; k++) put(29.4 + k * 0.325, pizz(52, 0.12), 0.18, 0.2, 0.05);                      // ostinato seco de «oficina»
put(30.55, fagot(33, 0.5), 0.3, 0, 0.2); put(30.75, fagot(33, 0.5), 0.3, 0, 0.2); put(30.95, fagot(32, 1.1), 0.38, 0, 0.3); // «dun-dun-DUUUN»: «un asesino»
put(31.55, cajon(0.8), 0.42, 0.3, 0.25);                                                                    // «un cajón»: chirrido de cajón
put(32.3, redoblante("tom"), 0.7, 0, 0.2); put(32.46, redoblante("caja"), 0.7, 0, 0.2); put(32.62, redoblante("platillo"), 0.55, 0, 0.3); // ba-dum-tss
put(33.0, trombonTriste(), 0.32, 0.1, 0.35);
// ── ESCENA 7 · 34,1–39,5 · «El culpable: fricción estática mayor que cinética. Un fallo de diseño, no un fantasma.» ──
for (let k = 0; k < 17; k++) put(34.9 + k * 0.065, madera(2100 + (k % 5) * 120), 0.17, -0.2 + 0.4 * ((k % 5) / 4), 0.1); // marcas de conteo
const bajoB = [45, 52, 45, 50]; for (let k = 0; k < 14; k++) put(34.15 + k * 0.3, pizz(bajoB[k % 4], 0.3), 0.42, -0.2, 0.2);
[34.45, 35.05, 35.65].forEach((t, k) => acorde(t, k === 2 ? [57, 61, 64] : [57, 60, 64], 0.2, 0.3));
put(36.2, subida(0.8, 200, 900, 0.1), 0.25, 0, 0.2);                                                       // las barras crecen
put(37.0, fagot(33, 0.9), 0.3, 0, 0.3);
put(37.8, sello(), 0.9, 0, 0.3); put(37.85, metal(1700), 0.35, 0.3, 0.3);                                   // sello «FALLO DE DISEÑO»
put(38.2, gemido(1.2, 520, 180, "u", 0.9), 0.45, 0.3, 0.6);                                                 // «no un fantasma»: el fantasma se desinfla
put(38.35, silbato(0.9, 1100, 220), 0.3, 0.3, 0.4);
put(39.3, madera(2400), 0.4, 0.3, 0.3);                                                                     // pop: se fue
// ── ESCENA 8 · 39,5–46,9 · «Si te acercas, no hay espíritus: solo fibras de madera raspando metal. ¿Qué más está por crujir?» ──
put(39.4, viento(5.2, 0.45), 1, 0.2, 0.5);
drone(39.5, 5.1, 0.34, 49);
put(39.7, barrido(4.8, 250, 2800, 0.5), 0.9, 0, 0.4);                                                       // el zoom entra en la materia
for (let k = 0; k < 10; k++) put(40.4 + k * 0.38, crujido(0.35 + 0.02 * k, 600 + 70 * k, 900 + 90 * k, 28 + 3 * k, 1, 40 + k), 0.2 + k * 0.045, k % 2 ? 0.4 : -0.4, 0.3); // fibras raspando metal
for (let k = 0; k < 20; k++) put(41 + Math.pow(k / 19, 0.7) * 3.4, click(), 0.2 + k * 0.012, 0.3 * Math.sin(k), 0.2);
put(43.8, barrido(0.7, 400, 4000, 1.3), 0.9, 0, 0.1);                                                       // se aspira todo…
put(44.5, sum(mul(osc(1.6, (t) => 38 - 8 * t, "sine"), (t) => ex(t, 0.55) * 1.3)), 0.75, 0, 0.05);       // …y un golpe sordo al colapsar
put(45.3, latido(), 0.6, 0, 0.35); put(46.0, latido(), 0.5, 0, 0.35);                                        // el punto rojo que late
theremin([[44.85, 1.3, 64], [46.15, 0.7, 65]], 0.1, 0);
put(46.45, crujido(0.9, 190, 160, 13, 0.6, 77), 0.4, 0.5, 0.7);                                              // «¿qué más está por crujir?»: se oye otro crujido
// ── ESCENA 9 · 46,9–51,3 · «Guárdalo para tu próxima noche en vela y síguenos en Sinapsis.» ──
sneak(47.0, 1, 0.28, 0.5, 0);
[0, 1, 2, 3, 4, 5].forEach((k) => put(47.0 + k * 0.1, celesta(81 + k * 2, 0.9), 0.22, -0.3 + k * 0.12, 0.45)); // destello de cierre
put(47.4, gemido(0.5, 700, 900, "a", 0.5), 0.3, 0.3, 0.5);                                                    // «bu» simpático
theremin([[47.6, 0.35, 76], [48.0, 0.35, 79], [48.4, 0.35, 81], [48.8, 0.9, 84]], 0.1, 0.2);
put(49.7, boing(300), 0.45, 0, 0.3);
acorde(50.15, [57, 60, 64, 69], 0.4, 0); put(50.15, pizz(33, 1.0), 0.5, 0, 0.3);
put(50.45, crujido(0.5, 210, 330, 16, 0.5, 91), 0.35, 0.3, 0.5);                                              // la puerta rechina… (gag final)
put(51.0, madera(2000), 0.3, 0, 0.2);

/* ═════════════════════ REVERB, MEZCLA Y SALIDA ═════════════════════ */
function reverb(x, retardosMs, fb, mezcla) {
  const y = new Float32Array(N);
  for (const ms of retardosMs) {
    const dl = Math.round((ms * SR) / 1000), lin = new Float32Array(dl); let p = 0, lp = 0;
    for (let i = 0; i < N; i++) { const o = lin[p]; lp += 0.35 * (o - lp); lin[p] = x[i] + fb * lp; y[i] += o; p = (p + 1) % dl; }
  }
  for (const ms of [5.0, 1.7]) { const dl = Math.round((ms * SR) / 1000), lin = new Float32Array(dl); let p = 0; for (let i = 0; i < N; i++) { const o = lin[p], v = y[i] - 0.5 * o; lin[p] = v; y[i] = o + 0.5 * v; p = (p + 1) % dl; } }
  for (let i = 0; i < N; i++) y[i] *= mezcla;
  return y;
}
const wl = reverb(W, [29.7, 37.1, 41.1, 43.7, 53.3, 61.7], 0.86, 0.22), wr = reverb(W, [31.3, 36.3, 42.7, 45.1, 52.9, 62.3], 0.86, 0.22);
for (let i = 0; i < N; i++) { L[i] += wl[i]; Rt[i] += wr[i]; }
// puerta de silencio del CORTE BRUSCO (5 ms de fundido de salida, silencio, y entrada seca)
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const g = t < CORTE - 0.005 ? 1 : t < CORTE ? (CORTE - t) / 0.005 : t < CORTE + SILENCIO ? 0 : 1;
  const fin = sm(DUR - t, 0, 0.35), ini = sm(t, 0, 0.05);
  L[i] *= g * fin * ini; Rt[i] *= g * fin * ini;
}
// limitador suave y normalización
let pico = 0; for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(L[i]), Math.abs(Rt[i]));
const gn = 1.9 / Math.max(1e-6, pico);
for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * gn) * 0.9; Rt[i] = Math.tanh(Rt[i] * gn) * 0.9; }
const datos = Buffer.alloc(44 + N * 4);
datos.write("RIFF", 0); datos.writeUInt32LE(36 + N * 4, 4); datos.write("WAVEfmt ", 8); datos.writeUInt32LE(16, 16); datos.writeUInt16LE(1, 20); datos.writeUInt16LE(2, 22);
datos.writeUInt32LE(SR, 24); datos.writeUInt32LE(SR * 4, 28); datos.writeUInt16LE(4, 32); datos.writeUInt16LE(16, 34); datos.write("data", 36); datos.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { datos.writeInt16LE(Math.round(clamp(L[i], -1, 1) * 32767), 44 + i * 4); datos.writeInt16LE(Math.round(clamp(Rt[i], -1, 1) * 32767), 46 + i * 4); }
const carpeta = join(RAIZ, "trabajo", "archivo", "2026-10-31-ruidos-nocturnos");
mkdirSync(carpeta, { recursive: true });
const salida = join(carpeta, "audio-fantasmal-comico.wav");
writeFileSync(salida, datos);
console.log(`✅ ${salida} · ${DUR} s · estéreo 48 kHz · corte brusco a ${CORTE} s`);
