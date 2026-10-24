#!/usr/bin/env node
/**
 * Genera los efectos de sonido sintetizados (100% propios, sin licencias ni descargas).
 *   node scripts/generar-sfx.mjs
 * Escribe WAV mono 44.1 kHz:
 *   public/sfx/      pop, tick, whoosh, thud, heartbeat, zap, ding, cash   (efectos de <SoundEffect />)
 *   public/audios/   ambiente.wav                                          (colchón de fondo)
 * Con --solo-faltantes no pisa los que ya existan.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SALIDA = join(RAIZ, "public", "sfx");
const SALIDA_AUDIOS = join(RAIZ, "public", "audios");
mkdirSync(SALIDA, { recursive: true });
mkdirSync(SALIDA_AUDIOS, { recursive: true });
const soloFaltantes = process.argv.includes("--solo-faltantes");
const SR = 44100;
const TAU = Math.PI * 2;

// RNG determinista para que el ruido sea idéntico en cada generación
let semilla = 12345;
const rnd = () => {
  semilla = (semilla * 1664525 + 1013904223) >>> 0;
  return semilla / 4294967296 - 0.5;
};

function escribirWav(nombre, muestras, carpeta = SALIDA) {
  if (soloFaltantes && existsSync(join(carpeta, nombre))) return;
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
  writeFileSync(join(carpeta, nombre), datos);
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
  "pop.wav",
  crear(0.2, (t) => {
    const f = 480 + 520 * (1 - Math.exp(-t * 38));
    return Math.sin(TAU * f * t) * Math.exp(-t * 24) * ataque(t, 0.004) * 0.9 + Math.sin(TAU * f * 2 * t) * Math.exp(-t * 40) * 0.18;
  }),
);

// --- tick: clic corto
escribirWav("tick.wav", crear(0.07, (t) => Math.sin(TAU * 2100 * t) * Math.exp(-t * 90) * ataque(t, 0.001)));

// --- whoosh: ruido filtrado que barre de grave a agudo
{
  let low = 0;
  let band = 0;
  escribirWav(
    "whoosh.wav",
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
  "thud.wav",
  crear(0.7, (t) => {
    const f = 38 + 90 * Math.exp(-t * 16);
    const cuerpo = Math.sin(TAU * f * t) * Math.exp(-t * 7.5) * ataque(t, 0.002);
    const clic = rnd() * Math.exp(-t * 90) * 0.5;
    return cuerpo + clic;
  }),
);

// --- latido: lub-dub
escribirWav(
  "heartbeat.wav",
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
  "zap.wav",
  crear(0.28, (t) => {
    const f = 900 + 2600 * (t / 0.28);
    const mod = Math.sin(TAU * 60 * t);
    return Math.sin(TAU * f * t + mod * 3.5) * Math.exp(-t * 11) * ataque(t, 0.002) * 0.7;
  }),
);

// --- ding: campana suave de cierre
escribirWav(
  "ding.wav",
  crear(1.6, (t) => {
    const parcial = (f, a, d) => Math.sin(TAU * f * t) * a * Math.exp(-t * d);
    return (parcial(1318.5, 1, 3.2) + parcial(1976, 0.4, 4.2) + parcial(2637, 0.18, 6)) * ataque(t, 0.004);
  }),
);

// --- cash: "cha-ching" de caja registradora (dos golpes metálicos + brillo de monedas)
escribirWav(
  "cash.wav",
  crear(1.0, (t) => {
    const clink = (t0, amp, f0) => {
      const dt = t - t0;
      if (dt < 0) return 0;
      const parciales = [1, 2.76, 5.4, 8.93].map((r, i) => Math.sin(TAU * f0 * r * dt) * Math.exp(-dt * (16 + i * 13)) / (1 + i * 0.7));
      return parciales.reduce((a, b) => a + b, 0) * ataque(dt, 0.0015) * amp + rnd() * Math.exp(-dt * 120) * 0.25 * amp;
    };
    const brillo = (Math.sin(TAU * 4186 * t) + Math.sin(TAU * 5274 * t) * 0.6 + Math.sin(TAU * 6272 * t) * 0.4) * Math.exp(-(t - 0.2) * 7) * (t > 0.2 ? 1 : 0) * ataque(Math.max(0, t - 0.2), 0.004);
    return clink(0, 0.8, 1568) + clink(0.11, 1, 2093) + brillo * 0.22;
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
    SALIDA_AUDIOS,
  );
}
// ───────────── foley del motor viral (agua, impactos, estática, clics, polvo, sonar) ─────────────

// --- gota: «plip» de agua con una gotita secundaria
escribirWav(
  "gota.wav",
  crear(0.4, (t) => {
    const plip = (t0, amp, f0) => {
      const dt = t - t0;
      if (dt < 0) return 0;
      return Math.sin(TAU * (f0 * 0.45 + f0 * 1.1 * Math.exp(-dt * 38)) * dt) * Math.exp(-dt * 16) * ataque(dt, 0.002) * amp;
    };
    return plip(0, 1, 900) + plip(0.13, 0.35, 1250);
  }),
);

// --- estática: ráfaga de ruido de radio con crepitar
{
  let prev = 0;
  escribirWav(
    "estatica.wav",
    crear(0.55, (t) => {
      const x = rnd() * 2;
      const alto = x - prev * 0.6; // paso alto muy simple
      prev = x;
      const env = Math.min(1, t / 0.02) * Math.exp(-t * 4.2);
      const crepitar = 0.55 + 0.45 * Math.sign(Math.sin(TAU * 47 * t + Math.sin(TAU * 7 * t) * 3));
      return alto * env * crepitar * 0.8;
    }),
  );
}

// --- clic: contacto mecánico seco (contadores)
escribirWav("clic.wav", crear(0.06, (t) => rnd() * 2 * Math.exp(-t * 230) * 0.7 + Math.sin(TAU * 3200 * t) * Math.exp(-t * 170) * 0.55));

// --- golpe: impacto seco con cuerpo grave y chasquido
escribirWav(
  "golpe.wav",
  crear(0.45, (t) => {
    const cuerpo = Math.sin(TAU * (48 + 70 * Math.exp(-t * 26)) * t) * Math.exp(-t * 11) * ataque(t, 0.001);
    const madera = Math.sin(TAU * 190 * t) * Math.exp(-t * 34) * 0.45;
    return cuerpo + madera + rnd() * 2 * Math.exp(-t * 120) * 0.6;
  }),
);

// --- polvo: soplo grave de partículas que se asienta
{
  let low = 0;
  escribirWav(
    "polvo.wav",
    crear(0.9, (t) => {
      low += (rnd() * 2 - low) * 0.07;
      return low * (1 - Math.exp(-t * 35)) * Math.exp(-t * 4.2) * 1.6;
    }),
  );
}

// --- radar: ping de sonar con dos ecos
escribirWav(
  "radar.wav",
  crear(1.1, (t) => {
    const ping = (t0, amp) => {
      const dt = t - t0;
      if (dt < 0) return 0;
      return (Math.sin(TAU * 1180 * dt) + 0.3 * Math.sin(TAU * 2360 * dt)) * Math.exp(-dt * 6.5) * ataque(dt, 0.004) * amp;
    };
    return ping(0, 1) + ping(0.34, 0.38) + ping(0.68, 0.16);
  }),
);

// ───────────── música: pista sintética en bucle (synth científico, 120 BPM, 16 s) ─────────────
// Pad + bajo pulsante + arpegio de 16avos + bombo suave + hi-hat. Todas las notas se escriben «envueltas» (módulo N): el final enlaza con el principio sin corte.
{
  const LARGO = 16;
  const N = Math.floor(LARGO * SR);
  const out = new Float32Array(N);
  const BAR = 2; // 120 BPM, compás de 4/4
  const nota = (f, ini, dur, amp, env, armonicos = [1]) => {
    const i0 = Math.floor(ini * SR);
    const n = Math.floor(dur * SR);
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      let v = 0;
      for (let h = 0; h < armonicos.length; h++) v += Math.sin(TAU * f * (h + 1) * t) * armonicos[h];
      out[(i0 + k) % N] += v * env(t, dur) * amp;
    }
  };
  const ruido = (ini, dur, amp, decaimiento) => {
    const i0 = Math.floor(ini * SR);
    const n = Math.floor(dur * SR);
    let prev = 0;
    for (let k = 0; k < n; k++) {
      const x = rnd() * 2;
      const alto = x - prev;
      prev = x;
      out[(i0 + k) % N] += alto * Math.exp(-(k / SR) * decaimiento) * amp;
    }
  };
  // acordes: [bajo, tres notas del arpegio]
  const ACORDES = [
    [110.0, 440.0, 523.25, 659.25], // Am
    [87.31, 349.23, 440.0, 523.25], // F
    [130.81, 392.0, 523.25, 659.25], // C
    [98.0, 392.0, 493.88, 587.33], // G
    [110.0, 440.0, 523.25, 659.25], // Am
    [87.31, 349.23, 440.0, 523.25], // F
    [98.0, 392.0, 493.88, 587.33], // G
    [82.41, 329.63, 392.0, 493.88], // Em
  ];
  const PATRON = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 1];
  ACORDES.forEach(([bajo, a, b, c], bar) => {
    const t0 = bar * BAR;
    const tonos = [a, b, c, a * 2];
    // pad: tres notas con envolvente en campana que muere en cada compás
    for (const f of [a, b, c]) nota(f * 0.5, t0, BAR, 0.075, (t, d) => Math.pow(Math.sin((Math.PI * t) / d), 2), [1, 0.28]);
    // bajo: corcheas pulsantes
    for (let k = 0; k < 8; k++) nota(bajo, t0 + k * 0.25, 0.3, k % 2 === 0 ? 0.34 : 0.2, (t) => Math.exp(-t * 9) * Math.min(1, t / 0.004), [1, 0.35]);
    // arpegio: semicorcheas tipo pluck
    PATRON.forEach((idx, k) => nota(tonos[idx], t0 + k * 0.125, 0.4, 0.12 + (k % 4 === 0 ? 0.05 : 0), (t) => Math.exp(-t * 16) * Math.min(1, t / 0.003), [1, 0.5, 0.22]));
    // bombo en cada pulso y hi-hat a contratiempo
    for (let k = 0; k < 4; k++) {
      nota(52, t0 + k * 0.5, 0.35, 0.5, (t) => Math.exp(-t * 13) * Math.min(1, t / 0.002), [1]);
      ruido(t0 + k * 0.5 + 0.25, 0.06, 0.07, 55);
    }
    // el bombo baja de frecuencia al golpear: segundo componente corto
    for (let k = 0; k < 4; k++) nota(110, t0 + k * 0.5, 0.08, 0.22, (t) => Math.exp(-t * 48), [1]);
  });
  escribirWav("musica.wav", out, SALIDA_AUDIOS);
}

console.log("✅ Efectos listos en public/sfx/ (y ambiente y música en public/audios/)");
