#!/usr/bin/env node
/**
 * Genera los efectos de sonido sintetizados (100% propios, sin licencias ni descargas).
 *   node scripts/generar-sfx.mjs
 * Escribe WAV mono 44.1 kHz en public/audios/: sfx-*.wav y ambiente.wav
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SALIDA = join(RAIZ, "public", "audios");
mkdirSync(SALIDA, { recursive: true });
const SR = 44100;
const TAU = Math.PI * 2;

// RNG determinista para que el ruido sea idéntico en cada generación
let semilla = 12345;
const rnd = () => {
  semilla = (semilla * 1664525 + 1013904223) >>> 0;
  return semilla / 4294967296 - 0.5;
};

function escribirWav(nombre, muestras) {
  let pico = 0;
  for (const m of muestras) pico = Math.max(pico, Math.abs(m));
  const norm = pico > 0 ? 0.92 / pico : 1;
  const datos = Buffer.alloc(44 + muestras.length * 2);
  datos.write("RIFF", 0);
  datos.writeUInt32LE(36 + muestras.length * 2, 4);
  datos.write("WAVEfmt ", 8);
  datos.writeUInt32LE(16, 16);
  datos.writeUInt16LE(1, 20);
  datos.writeUInt16LE(1, 22);
  datos.writeUInt32LE(SR, 24);
  datos.writeUInt32LE(SR * 2, 28);
  datos.writeUInt16LE(2, 32);
  datos.writeUInt16LE(16, 34);
  datos.write("data", 36);
  datos.writeUInt32LE(muestras.length * 2, 40);
  for (let i = 0; i < muestras.length; i++) {
    datos.writeInt16LE(Math.round(Math.max(-1, Math.min(1, muestras[i] * norm)) * 32767), 44 + i * 2);
  }
  writeFileSync(join(SALIDA, nombre), datos);
  console.log(`  ${nombre}  (${(muestras.length / SR).toFixed(2)} s)`);
}

const crear = (seg, fn) => {
  const n = Math.floor(seg * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / SR, i);
  return out;
};
const ataque = (t, a) => Math.min(1, t / a);

// --- pop: burbuja suave al aparecer una etiqueta
escribirWav(
  "sfx-pop.wav",
  crear(0.2, (t) => {
    const f = 480 + 520 * (1 - Math.exp(-t * 38));
    return Math.sin(TAU * f * t) * Math.exp(-t * 24) * ataque(t, 0.004) * 0.9 + Math.sin(TAU * f * 2 * t) * Math.exp(-t * 40) * 0.18;
  }),
);

// --- tick: clic corto
escribirWav("sfx-tick.wav", crear(0.07, (t) => Math.sin(TAU * 2100 * t) * Math.exp(-t * 90) * ataque(t, 0.001)));

// --- whoosh: ruido filtrado que barre de grave a agudo
{
  let low = 0;
  let band = 0;
  escribirWav(
    "sfx-whoosh.wav",
    crear(0.6, (t) => {
      const fc = 350 + 4200 * Math.pow(t / 0.6, 1.6);
      const f = 2 * Math.sin((Math.PI * fc) / SR);
      const q = 0.28;
      const x = rnd() * 2;
      low += f * band;
      const high = x - low - q * band;
      band += f * high;
      const env = Math.pow(Math.sin(Math.PI * Math.min(1, t / 0.6)), 2);
      return band * env * 0.9;
    }),
  );
}

// --- thud: golpe grave de impacto (bloqueo)
escribirWav(
  "sfx-thud.wav",
  crear(0.7, (t) => {
    const f = 38 + 90 * Math.exp(-t * 16);
    const cuerpo = Math.sin(TAU * f * t) * Math.exp(-t * 7.5) * ataque(t, 0.002);
    const clic = rnd() * Math.exp(-t * 90) * 0.5;
    return cuerpo + clic;
  }),
);

// --- latido: lub-dub
escribirWav(
  "sfx-latido.wav",
  crear(0.9, (t) => {
    const golpe = (t0, amp, f0) => {
      const dt = t - t0;
      if (dt < 0) return 0;
      return Math.sin(TAU * (f0 + 40 * Math.exp(-dt * 30)) * dt) * Math.exp(-dt * 14) * ataque(dt, 0.003) * amp;
    };
    return golpe(0, 1, 48) + golpe(0.27, 0.65, 55);
  }),
);

// --- zap: chispa nerviosa
escribirWav(
  "sfx-zap.wav",
  crear(0.28, (t) => {
    const f = 900 + 2600 * (t / 0.28);
    const mod = Math.sin(TAU * 60 * t);
    return Math.sin(TAU * f * t + mod * 3.5) * Math.exp(-t * 11) * ataque(t, 0.002) * 0.7;
  }),
);

// --- ding: campana suave de cierre
escribirWav(
  "sfx-ding.wav",
  crear(1.6, (t) => {
    const parcial = (f, a, d) => Math.sin(TAU * f * t) * a * Math.exp(-t * d);
    return (parcial(1318.5, 1, 3.2) + parcial(1976, 0.4, 4.2) + parcial(2637, 0.18, 6)) * ataque(t, 0.004);
  }),
);

// --- ambiente: colchón armónico de 12 s que se repite sin corte
{
  const LARGO = 12;
  const cuantizar = (f) => Math.round(f * LARGO) / LARGO; // ciclos enteros => bucle perfecto
  const voces = [
    { f: 110, a: 1.0, lfo: 1 },
    { f: 164.81, a: 0.7, lfo: 2 },
    { f: 220, a: 0.55, lfo: 3 },
    { f: 261.63, a: 0.38, lfo: 2 },
    { f: 329.63, a: 0.28, lfo: 1 },
    { f: 493.88, a: 0.12, lfo: 3 },
  ].map((v) => ({ ...v, f: cuantizar(v.f) }));
  escribirWav(
    "ambiente.wav",
    crear(LARGO, (t) => {
      let s = 0;
      for (const [i, v] of voces.entries()) {
        const am = 0.65 + 0.35 * Math.sin(TAU * (v.lfo / LARGO) * t + i * 1.3);
        s += Math.sin(TAU * v.f * t) * v.a * am;
      }
      return s * 0.3;
    }),
  );
}
console.log("✅ Efectos listos en public/audios/");
