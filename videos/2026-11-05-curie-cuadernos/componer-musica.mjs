#!/usr/bin/env node
/**
 * Diseño sonoro propio (síntesis, sin muestras ni licencias) para «Los cuadernos radiactivos de Marie Curie» (62,4 s). Tono: asombro científico con un fondo de inquietud sobria.
 * Pista de «música» del motor: colchón armónico + contador Geiger + eventos alineados con lo que se ve (los tiempos usan el ritmo REAL de cada escena).
 *
 *   colchón      acordes suaves La menor → Fa → Do mayor (el Nobel) → Re menor (el riesgo) → La menor
 *   Geiger       chasquidos al azar cuya frecuencia sube cuando se abre la caja y cuando aparecen los tubos de radio
 *   gancho       golpe de la caja de plomo, tics del contador de 159 años y campana final
 *   viaje        golpe de la puerta cerrada, traqueteo del tren y campana de París
 *   elementos    pop y campanas de las fichas del polonio y del radio
 *   toneladas    golpes de los sacos, remover de la olla, crepitar del fuego y reloj de los años
 *   Nobel        campanas de las dos medallas y acorde luminoso de «única en dos ciencias»
 *   guerra       motor grave de la ambulancia, zumbido y chispa de los rayos X y tics de las cifras
 *   riesgo       campana grave de 1934 y silencio
 *   cuadernos    barrido descendente del decaimiento, campana de la mitad y rasguño de la pluma al firmar
 *
 * Uso:  node videos/2026-11-05-curie-cuadernos/componer-musica.mjs   → assets/musica/curie-cuadernos.wav
 *       node scripts/anim/musica.mjs --usar=assets/musica/curie-cuadernos.wav   (y --restaurar al terminar; el WAV no va a git)
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
const dur = [7.6, 6.6, 7.3, 5.6, 8.3, 7.6, 7.3, 7.3, 4.8];
const ideal = [7.1, 6.1, 6.8, 5.1, 7.8, 7.1, 6.8, 6.8, 1];
const ini = dur.reduce((a, d, i) => (a.push(i ? a[i - 1] + dur[i - 1] : 0), a), []);
const rit = dur.map((d, i) => Math.min(1, Math.max(0.55, (d - 0.45) / ideal[i])));
const T = (n, t) => ini[n - 1] + t * rit[n - 1];
const SC = { // los mismos tiempos que TMC en src/anim/piezas.ts
  gancho: { geiger: 0.2, caja: 0.9, fecha: 3.0, anios: 4.3, aniosDur: 1.6 },
  paris: { varsovia: 0.2, puerta: 1.2, viaje: 4.3, viajeDur: 1.4, paris: 5.7 },
  elementos: { anio: 0.2, pierre: 2.3, polonio: 3.0, pais: 4.0, radio: 5.7 },
  toneladas: { gramo: 0.2, mineral: 3.0, anios: 4.3 },
  nobel: { medalla1: 1.0, medalla2: 2.0, mujer: 3.0, unica: 5.0 },
  guerra: { fecha: 0.2, furgon: 1.9, rayos: 3.6, apodo: 5.7, cifras: 6.3 },
  riesgo: { tubo: 0.2, sin: 1.0, muerte: 3.0, prob: 5.4 },
  cuadernos: { caja: 0.2, vida: 2.3, mitad: 4.3, permiso: 5.6 },
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

/* 1 · COLCHÓN: acordes suaves */
{
  const acordes = [
    { t: 0, notas: [33, 45, 52, 57, 60] },                  // La menor
    { t: T(3, 0), notas: [29, 41, 48, 53, 57, 60] },        // Fa mayor
    { t: T(5, 0), notas: [36, 48, 55, 60, 64] },            // Do mayor: el Nobel
    { t: T(7, 0), notas: [38, 45, 53, 57] },                // Re menor: el riesgo
    { t: T(8, 0), notas: [33, 45, 52, 57, 64] },            // La menor sus
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

/* 2 · ESCENA 1: caja de plomo, Geiger y contador de años */
{
  geiger(T(1, SC.gancho.geiger), T(1, SC.gancho.caja), 2, 4);
  geiger(T(1, SC.gancho.caja), ini[1] - 0.2, 6, 22);
  const tc = T(1, SC.gancho.caja);
  golpe(tc, 0.36, 60); tic(tc + 0.03, 0.12, 1100); tic(tc + 0.06, 0.08, 800);                                  // clanc de la caja
  campana(tc + 0.5, 57, 0.06, 1.4);
  tic(T(1, SC.gancho.fecha), 0.1, 1700);
  ticsContador(T(1, SC.gancho.anios), SC.gancho.aniosDur * rit[0], easeOut, 159, 0.045, 1800, 3400);
  campana(T(1, SC.gancho.anios) + SC.gancho.aniosDur * rit[0], 69, 0.08, 1.4); campana(T(1, SC.gancho.anios) + SC.gancho.aniosDur * rit[0] + 0.14, 76, 0.06, 1.4);
}

/* 3 · ESCENA 2: Varsovia → París */
{
  campana(T(2, SC.paris.varsovia) + 0.1, 57, 0.06, 1.0);
  golpe(T(2, SC.paris.puerta), 0.46, 56); crujir(T(2, SC.paris.puerta), 0.1);                                  // portazo
  const tv = T(2, SC.paris.viaje), dv = SC.paris.viajeDur * rit[1];
  for (let g = tv, k = 0; g < tv + dv; k++, g += 0.12) tic(g, 0.06, k % 2 ? 1500 : 2000);                      // traqueteo del tren
  soplo(tv, dv, 0.06, 900);
  const tp = T(2, SC.paris.paris);
  [[0, 69], [0.14, 76]].forEach(([d, n]) => campana(tp + d, n, 0.08, 1.4));
}

/* 4 · ESCENA 3: polonio y radio */
{
  tic(T(3, SC.elementos.anio) + 0.2, 0.1, 1700); tic(T(3, SC.elementos.pierre), 0.08, 1600);
  const tp = T(3, SC.elementos.polonio);
  golpe(tp, 0.2, 66); [[0, 65], [0.1, 72], [0.2, 77]].forEach(([d, n]) => campana(tp + d, n, 0.08, 1.4));
  tic(T(3, SC.elementos.pais), 0.1, 1700);
  const tr = T(3, SC.elementos.radio);
  subida(tr - 0.2, 0.6, 300, 1500, 0.04); golpe(tr, 0.2, 62); [[0, 69], [0.1, 76], [0.2, 81], [0.3, 84]].forEach(([d, n]) => campana(tr + d, n, 0.08, 1.6));
  geiger(tr, ini[3] - 0.2, 3, 9);
}

/* 5 · ESCENA 4: toneladas de mineral */
{
  campana(T(4, SC.toneladas.gramo) + 0.1, 81, 0.07, 1.0);
  const tm = T(4, SC.toneladas.mineral);
  for (let i = 0; i < 10; i++) { const tt = tm + i * 0.12; golpe(tt, 0.22, 66 - (i % 3) * 5); crujir(tt, 0.08); }      // sacos que caen
  soplo(tm, 2.4, 0.04, 900);                                                                                    // remover de la olla
  for (let g = tm; g < ini[4] - 0.3; g += 0.05 + R() * 0.12) tic(g, 0.01 + 0.02 * R(), 500 + R() * 1200);       // crepitar del fuego
  const ta = T(4, SC.toneladas.anios);
  tic(ta, 0.12, 1500);
  for (let g = ta + 0.2, k = 0; g < ta + 1.0; k++, g += 0.18) tic(g, 0.06, k % 2 ? 1500 : 2000);                // reloj
}

/* 6 · ESCENA 5: dos Nobel */
{
  [[SC.nobel.medalla1, [60, 67, 72]], [SC.nobel.medalla2, [62, 69, 74]]].forEach(([tt, ns]) => ns.forEach((n, i) => campana(T(5, tt) + i * 0.1, n, 0.08, 1.8)));
  const tm = T(5, SC.nobel.mujer);
  tic(tm, 0.12, 1700); campana(tm + 0.05, 76, 0.07, 1.2);
  const tu = T(5, SC.nobel.unica);
  [[0, 60], [0.1, 67], [0.2, 72], [0.3, 76], [0.4, 79], [0.5, 84]].forEach(([d, n]) => campana(tu + d, n, 0.07, 2.0));
  golpe(tu, 0.2, 58);
}

/* 7 · ESCENA 6: ambulancias radiológicas */
{
  tic(T(6, SC.guerra.fecha) + 0.2, 0.1, 1700);
  const tf = T(6, SC.guerra.furgon);
  const mo = osc((g) => 52 + 6 * Math.sin(TAU * 11 * g));
  add(tf, 1.8, (t, g) => 0.06 * mo(g) * sua(t, 0, 0.3) * (1 - sua(t, 1.3, 1.8)) * (0.7 + 0.3 * Math.sin(TAU * 14 * g)));  // motor
  soplo(tf, 1.2, 0.07, 800);
  const tr = T(6, SC.guerra.rayos);
  subida(tr - 0.1, 0.4, 400, 2200, 0.05); chispas(tr, 0.4, 0.1); campana(tr + 0.4, 74, 0.08, 1.4); campana(tr + 0.55, 81, 0.06, 1.4);
  const ta = T(6, SC.guerra.apodo);
  campana(ta, 62, 0.07, 1.0); tic(ta, 0.1, 1700);
  [0, 0.25, 0.5].forEach((d) => tic(T(6, SC.guerra.cifras) + d, 0.09, 1900));
}

/* 8 · ESCENA 7: sin protección y 1934 */
{
  geiger(T(7, SC.riesgo.tubo), T(7, SC.riesgo.muerte), 3, 16);
  golpe(T(7, SC.riesgo.sin), 0.3, 56);
  const tm = T(7, SC.riesgo.muerte);
  campana(tm, 38, 0.12, 4.0); campana(tm + 0.02, 50, 0.07, 3.0); golpe(tm, 0.3, 50);                          // toque grave
  tic(T(7, SC.riesgo.prob), 0.1, 1500);
}

/* 9 · ESCENA 8: cuadernos y decaimiento */
{
  const tc = T(8, SC.cuadernos.caja);
  golpe(tc + 0.1, 0.4, 54); tic(tc + 0.13, 0.12, 1000);
  geiger(tc + 0.3, ini[8] - 0.2, 5, 2);                                                                       // el Geiger se calma
  const tv = T(8, SC.cuadernos.vida), dv = 2.0 * rit[7];
  const w = osc((g) => lerp(900, 220, easeOut((g - tv) / dv)));
  add(tv, dv + 0.2, (t, g) => 0.04 * w(g) * sua(t, 0, 0.2) * (1 - sua(t, dv, dv + 0.2)));                    // barrido descendente
  const tmi = T(8, SC.cuadernos.mitad);
  [[0, 57], [0.1, 64], [0.2, 69], [0.3, 72]].forEach(([d, n]) => campana(tmi + d, n, 0.08, 1.8));
  const tp = T(8, SC.cuadernos.permiso);
  soplo(tp, 0.4, 0.05, 3000);                                                                                 // papel
  for (let g = tp + 0.5; g < tp + 1.3; g += 0.04) add(g, 0.03, (t) => 0.02 * (R() * 2 - 1) * ex(t, 0.01));    // rasguño de la pluma
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
const salida = join(RAIZ, "assets", "musica", "curie-cuadernos.wav");
escribirWavEstereo(salida, x);
console.log(`✅ ${salida} · ${DURACION} s`);
console.log("   escenas (inicio · ritmo):", ini.map((a, i) => `${i + 1}:${a.toFixed(1)}s×${rit[i].toFixed(2)}`).join("  "));
