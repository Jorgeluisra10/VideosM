/**
 * Kit de «El viaje de la luz» (IMNOBA · POV en primera persona · carril B). Todo en vectores, sin imágenes externas. Estilo inmersivo: túnel de líneas de
 * velocidad, paquete de energía que viaja, golpes de zoom y destellos.
 *   FondoPOV      fondo oscuro con líneas de velocidad radiales y partículas (la sensación de ir a toda velocidad)
 *   Paquete       la «energía» (tú, en primera persona): orbe dorado con estela
 *   Caldera/Fuego caldera de acero con llamas animadas · Presa: muro de concreto con caída de agua
 *   Turbina       rotor de aspas con chorro de vapor o de agua · Generador: corte con imán que gira y bobinas que brillan
 *   Transformador núcleo con bobinas de pocas y de muchas vueltas · TorresPOV: torres de alta tensión en perspectiva
 *   Poste/Casa    poste con transformador y casa con ventana encendida · Interruptor, Enchufe, Lampara
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeInOut, easeOut, lerp, mezclar, aclarar, oscurecer, useReloj } from "../comun";
import { FONT, MONOF, RE, Sombra } from "./real-kit";

export const CE = { oro: "#FFC500", cian: "#3DE0FF", rojo: "#FF5A3C", azul: "#3D7BFF", cobre: "#D98B4A", acero: "#9FB0C4" } as const;

/** Golpe de cámara: escala que arranca en `desde` y cae a 1 con rebote suave (sensación de impacto). Devuelve también un temblor. */
export function golpe(t: number, ini: number, desde = 1.18, dur = 0.5): { s: number; dx: number; dy: number } {
  const k = clamp((t - ini) / dur);
  const e = 1 - Math.pow(1 - k, 3);
  const tr = (1 - k) * (1 - k) * 14;
  return { s: lerp(desde, 1, e), dx: Math.sin(t * 90) * tr, dy: Math.cos(t * 77) * tr };
}

/* ───────────── fondo POV ───────────── */

export const FondoPOV: React.FC<{ cx?: number; cy?: number; vel?: number; color?: string; children?: React.ReactNode; lineas?: number }> = ({ cx = W / 2, cy = 900, vel = 1, color = CE.cian, children, lineas = 46 }) => {
  const { t } = useReloj();
  const uid = useUid();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#04060F" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id={`${uid}b`} cx={cx / W} cy={cy / H} r="0.8"><stop offset="0" stopColor="#10224A" /><stop offset="0.55" stopColor="#0A1430" /><stop offset="1" stopColor="#03040A" /></radialGradient>
          <radialGradient id={`${uid}v`} cx="50%" cy="48%" r="78%"><stop offset="0.5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.65" /></radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}b)`} />
        {Array.from({ length: lineas }, (_, i) => {
          const ang = (i / lineas) * Math.PI * 2 + azar(i * 3.3) * 0.12;
          const q = (t * vel * (0.35 + azar(i * 5.1) * 0.5) + azar(i * 7.7)) % 1;
          const r0 = 120 + q * 1500, r1 = r0 + 60 + q * 380 * vel;
          return <line key={i} x1={cx + Math.cos(ang) * r0} y1={cy + Math.sin(ang) * r0} x2={cx + Math.cos(ang) * r1} y2={cy + Math.sin(ang) * r1} stroke={color} strokeWidth={1.5 + q * 4} strokeLinecap="round" opacity={0.05 + 0.3 * q * (1 - q * 0.4)} />;
        })}
        {Array.from({ length: 26 }, (_, i) => {
          const x = (azar(i * 3.1) * W + Math.sin(t * 0.8 + i) * 26 + W) % W, y = (azar(i * 5.7) * H - t * (24 + azar(i) * 40) * vel + H * 5) % H;
          return <circle key={i} cx={x} cy={y} r={1.2 + azar(i * 9.3) * 2.6} fill="#CFEFFF" opacity={0.15 + 0.3 * azar(i * 7.7)} />;
        })}
        <rect width={W} height={H} fill={`url(#${uid}v)`} />
      </svg>
      {children}
      <div style={{ position: "absolute", inset: 0, background: "#02030C", opacity: clamp(1 - t / 0.2) * 0.9, pointerEvents: "none" }} />
    </div>
  );
};

/* ───────────── paquete de energía ───────────── */

export const Paquete: React.FC<{ x: number; y: number; r?: number; t: number; dir?: number; estela?: number; color?: string }> = ({ x, y, r = 34, t, dir = 0, estela = 8, color = CE.oro }) => {
  const uid = useUid();
  const rad = (dir * Math.PI) / 180;
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}o`}><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.3" stopColor={aclarar(color, 0.5)} /><stop offset="0.7" stopColor={color} /><stop offset="1" stopColor={color} stopOpacity="0" /></radialGradient>
      </defs>
      {Array.from({ length: estela }, (_, i) => {
        const k = (i + 1) / estela;
        return <circle key={i} cx={x - Math.cos(rad) * k * r * 5} cy={y - Math.sin(rad) * k * r * 5} r={r * (1 - k * 0.8)} fill={color} opacity={0.35 * (1 - k)} />;
      })}
      <circle cx={x} cy={y} r={r * (2.6 + 0.3 * Math.sin(t * 12))} fill={`url(#${uid}o)`} opacity={0.55} />
      <circle cx={x} cy={y} r={r} fill={`url(#${uid}o)`} />
      <circle cx={x} cy={y} r={r * 0.4} fill="#fff" />
    </g>
  );
};

/* ───────────── llamas, caldera y presa ───────────── */

/** Llamas animadas (origen = centro de la base). `k` intensidad 0–1. */
export const Fuego: React.FC<{ x: number; y: number; w?: number; h?: number; t: number; k?: number }> = ({ x, y, w = 260, h = 260, t, k = 1 }) => {
  const uid = useUid();
  const n = 7;
  return (
    <g transform={`translate(${x} ${y})`} opacity={clamp(k * 2)}>
      <defs>
        <linearGradient id={`${uid}f`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#FFF3A8" /><stop offset="0.35" stopColor="#FFB020" /><stop offset="0.75" stopColor="#FF5A1F" /><stop offset="1" stopColor="#C21A0A" stopOpacity="0.6" /></linearGradient>
        <radialGradient id={`${uid}g`}><stop offset="0" stopColor="#FF8A2E" stopOpacity="0.7" /><stop offset="1" stopColor="#FF8A2E" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx={0} cy={-h * 0.3} rx={w * 1.1} ry={h * 0.8} fill={`url(#${uid}g)`} />
      {Array.from({ length: n }, (_, i) => {
        const cx = lerp(-w / 2, w / 2, i / (n - 1));
        const hh = h * (0.55 + 0.45 * azar(i * 3.7)) * k * (0.8 + 0.2 * Math.sin(t * (9 + i * 1.3) + i));
        const ww = (w / n) * 0.95;
        const sway = Math.sin(t * (6 + i) + i * 2) * 14;
        return <path key={i} d={`M ${cx - ww} 0 C ${cx - ww * 0.8} ${-hh * 0.4} ${cx + sway - ww * 0.3} ${-hh * 0.7} ${cx + sway} ${-hh} C ${cx + sway + ww * 0.3} ${-hh * 0.7} ${cx + ww * 0.8} ${-hh * 0.4} ${cx + ww} 0 Z`} fill={`url(#${uid}f)`} />;
      })}
      {Array.from({ length: 12 }, (_, i) => { const q = (t * 0.8 + i / 12) % 1; return <circle key={i} cx={lerp(-w / 2, w / 2, azar(i * 4.1)) + Math.sin(t * 3 + i) * 12} cy={-q * h * 1.4} r={3.5 * (1 - q)} fill="#FFD27A" opacity={1 - q} />; })}
    </g>
  );
};

/** Caldera de acero con ventana de fuego y tubería de vapor. (x, y) = centro de la base. */
export const Caldera: React.FC<{ x: number; y: number; s?: number; t: number; fuego?: number }> = ({ x, y, s = 1, t, fuego = 1 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}a`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#3A4658" /><stop offset="0.3" stopColor="#8E9DB2" /><stop offset="0.6" stopColor="#566275" /><stop offset="1" stopColor="#2A3342" /></linearGradient>
      </defs>
      <Sombra x={0} y={4} rx={200} ry={14} opacidad={0.55} />
      <rect x={-150} y={-400} width={300} height={400} rx={30} fill={`url(#${uid}a)`} stroke="#B8C6DA" strokeOpacity={0.4} strokeWidth={3} />
      {[-300, -200, -100].map((yy) => <rect key={yy} x={-150} y={yy} width={300} height={10} fill="#1B2230" opacity={0.6} />)}
      {Array.from({ length: 18 }, (_, i) => <circle key={i} cx={-132 + (i % 9) * 33} cy={-390 + Math.floor(i / 9) * 372} r={5} fill="#C9D3DE" opacity={0.7} />)}
      <rect x={-90} y={-170} width={180} height={130} rx={18} fill="#150A06" stroke="#C9D3DE" strokeWidth={5} />
      <g clipPath={`url(#${uid}c)`}><Fuego x={0} y={-48} w={150} h={120} t={t} k={fuego} /></g>
      <defs><clipPath id={`${uid}c`}><rect x={-86} y={-166} width={172} height={122} rx={14} /></clipPath></defs>
      <path d="M 120 -400 L 120 -470 L 330 -470" fill="none" stroke="#B8C6DA" strokeWidth={26} strokeLinecap="round" />
      <path d="M 120 -400 L 120 -470 L 330 -470" fill="none" stroke="#5B6A80" strokeWidth={14} strokeLinecap="round" />
      {Array.from({ length: 6 }, (_, i) => { const q = (t * 0.6 + i / 6) % 1; return <circle key={i} cx={120 + q * 330} cy={-470 - Math.sin(q * 6 + i) * 8} r={10 + q * 14} fill="#E8F2FF" opacity={0.5 * (1 - q)} />; })}
    </g>
  );
};

/** Presa vista de lado: embalse a la izquierda, muro de concreto y caída de agua a la derecha. (x, y) = pie del muro. */
export const Presa: React.FC<{ x: number; y: number; s?: number; t: number }> = ({ x, y, s = 1, t }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8A94A1" /><stop offset="1" stopColor="#5B6573" /></linearGradient>
        <linearGradient id={`${uid}w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4FC3F7" /><stop offset="1" stopColor="#0B5F9C" /></linearGradient>
      </defs>
      <Sombra x={60} y={4} rx={260} ry={14} opacidad={0.5} />
      {/* embalse */}
      <path d={`M -360 -330 ${Array.from({ length: 19 }, (_, i) => `L ${-360 + i * 20} ${-330 + Math.sin(t * 2 + i * 0.7) * 4}`).join(" ")} L 0 -330 L 0 0 L -360 0 Z`} fill={`url(#${uid}w)`} opacity={0.95} />
      {/* muro */}
      <polygon points="0,-380 70,-380 150,0 0,0" fill={`url(#${uid}c)`} stroke="#B8C6DA" strokeOpacity={0.35} strokeWidth={3} />
      {Array.from({ length: 7 }, (_, i) => <line key={i} x1={0} y1={-380 + i * 54} x2={lerp(70, 150, (i * 54) / 380)} y2={-380 + i * 54} stroke="#2A323E" strokeOpacity={0.45} strokeWidth={2} />)}
      <rect x={-8} y={-410} width={90} height={30} fill="#7A8594" />
      {/* compuerta y chorro */}
      <rect x={40} y={-150} width={60} height={46} fill="#1B2230" stroke="#B8C6DA" strokeWidth={3} />
      {Array.from({ length: 9 }, (_, i) => { const q = (t * 1.6 + i / 9) % 1; return <rect key={i} x={95 + i * 6} y={-130 + q * 130} width={10} height={44} rx={5} fill="#BFE9FF" opacity={0.85 * (1 - q * 0.3)} />; })}
      <rect x={96} y={-128} width={56} height={128} fill="#8FD8FF" opacity={0.45} />
      {Array.from({ length: 10 }, (_, i) => { const q = (t * 1.2 + i / 10) % 1; return <circle key={i} cx={100 + azar(i * 3.1) * 90} cy={-8 - q * 40} r={8 + q * 14} fill="#fff" opacity={0.5 * (1 - q)} />; })}
    </g>
  );
};

/* ───────────── turbina y generador ───────────── */

/** Turbina de aspas curvas. (x, y) = centro; `ang` en grados; `chorro` muestra vapor/agua que la empuja desde arriba a la izquierda. */
export const Turbina: React.FC<{ x: number; y: number; R?: number; ang: number; chorro?: "vapor" | "agua" | null; t: number }> = ({ x, y, R = 280, ang, chorro = null, t }) => {
  const uid = useUid();
  const n = 14;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${uid}h`} cx="40%" cy="35%" r="75%"><stop offset="0" stopColor="#F4F8FC" /><stop offset="0.5" stopColor="#8A9AB0" /><stop offset="1" stopColor="#3A4658" /></radialGradient>
        <linearGradient id={`${uid}b`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E6EEF7" /><stop offset="1" stopColor="#5B6A80" /></linearGradient>
      </defs>
      <Sombra x={0} y={R + 10} rx={R * 0.9} ry={14} opacidad={0.5} />
      <circle r={R * 1.12} fill="#161C27" stroke="#4A586E" strokeWidth={10} />
      <circle r={R * 1.04} fill="none" stroke="#B8C6DA" strokeOpacity={0.3} strokeWidth={3} />
      <g transform={`rotate(${ang})`}>
        {Array.from({ length: n }, (_, i) => {
          const a = (i / n) * 360;
          return <path key={i} transform={`rotate(${a})`} d={`M 0 ${-R * 0.18} C ${R * 0.16} ${-R * 0.4} ${R * 0.26} ${-R * 0.7} ${R * 0.12} ${-R * 1.0} L ${-R * 0.04} ${-R * 1.0} C ${R * 0.06} ${-R * 0.7} ${-R * 0.02} ${-R * 0.4} ${-R * 0.1} ${-R * 0.18} Z`} fill={`url(#${uid}b)`} stroke="#1B2230" strokeWidth={3} />;
        })}
        <circle r={R * 0.22} fill={`url(#${uid}h)`} stroke="#1B2230" strokeWidth={4} />
        {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={Math.cos((a * Math.PI) / 180) * R * 0.13} cy={Math.sin((a * Math.PI) / 180) * R * 0.13} r={9} fill="#2A323E" />)}
      </g>
      {chorro && Array.from({ length: 10 }, (_, i) => {
        const q = (t * 1.5 + i / 10) % 1;
        const sx = -R * 1.5 + q * R * 1.1, sy = -R * 1.2 + q * R * 0.9;
        return <ellipse key={i} cx={sx} cy={sy} rx={chorro === "vapor" ? 30 + q * 30 : 14} ry={chorro === "vapor" ? 16 + q * 14 : 30} transform={`rotate(38 ${sx} ${sy})`} fill={chorro === "vapor" ? "#EAF4FF" : "#7FD3FF"} opacity={(1 - q) * 0.7} />;
      })}
    </g>
  );
};

/** Generador en corte: estator con 12 bobinas de cobre que brillan cuando pasa el imán; rotor con polos N (rojo) y S (azul). (x, y) = centro. */
export const Generador: React.FC<{ x: number; y: number; R?: number; ang: number; brillo?: number }> = ({ x, y, R = 300, ang, brillo = 1 }) => {
  const uid = useUid();
  const bob = 12;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${uid}g`}><stop offset="0" stopColor="#FFE9A8" stopOpacity="0.95" /><stop offset="1" stopColor="#FFB020" stopOpacity="0" /></radialGradient>
      </defs>
      <circle r={R * 1.1} fill="#141A24" stroke="#4A586E" strokeWidth={10} />
      {Array.from({ length: bob }, (_, i) => {
        const a = (i / bob) * 360;
        const rel = ((ang - a) % 360 + 360) % 360;
        const cerca = Math.max(0, Math.cos(((rel > 180 ? rel - 360 : rel) * Math.PI) / 90));
        const brillar = clamp(cerca) * brillo;
        return (
          <g key={i} transform={`rotate(${a})`}>
            <circle cx={0} cy={-R * 0.84} r={R * 0.26 * (0.6 + 0.9 * brillar)} fill={`url(#${uid}g)`} opacity={brillar} />
            <rect x={-R * 0.1} y={-R * 1.0} width={R * 0.2} height={R * 0.3} rx={10} fill={mezclar("#8A4F22", CE.cobre, 0.4 + 0.6 * brillar)} stroke="#3A210E" strokeWidth={3} />
            {[0, 1, 2, 3].map((k) => <line key={k} x1={-R * 0.1} y1={-R * 0.97 + k * R * 0.07} x2={R * 0.1} y2={-R * 0.97 + k * R * 0.07} stroke="#3A210E" strokeWidth={3} opacity={0.7} />)}
          </g>
        );
      })}
      <circle r={R * 0.68} fill="#0E131B" stroke="#2A323E" strokeWidth={4} />
      <g transform={`rotate(${ang})`}>
        <rect x={-R * 0.2} y={-R * 0.6} width={R * 0.4} height={R * 0.6} fill="#E23B2E" stroke="#fff" strokeOpacity={0.5} strokeWidth={3} />
        <rect x={-R * 0.2} y={0} width={R * 0.4} height={R * 0.6} fill="#2E6BFF" stroke="#fff" strokeOpacity={0.5} strokeWidth={3} />
        <text x={0} y={-R * 0.26} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={R * 0.22} fill="#fff">N</text>
        <text x={0} y={R * 0.46} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={R * 0.22} fill="#fff">S</text>
        <circle r={R * 0.08} fill="#C9D3DE" />
      </g>
    </g>
  );
};

/** Onda senoidal que se dibuja y avanza (corriente alterna). */
export const Onda: React.FC<{ x: number; y: number; w: number; h: number; t: number; color?: string; ciclos?: number; k?: number }> = ({ x, y, w, h, t, color = CE.cian, ciclos = 3, k = 1 }) => {
  const pts = Array.from({ length: 90 }, (_, i) => { const u = i / 89; return `${x + u * w * clamp(k)},${y + Math.sin(u * ciclos * Math.PI * 2 - t * 8) * h}`; }).join(" ");
  return <polyline points={pts} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 10px ${color})` }} />;
};

/* ───────────── transformador ───────────── */

/** Transformador: núcleo de hierro, bobina primaria (pocas vueltas) y secundaria (muchas) o al revés (`sube`). (x, y) = centro. */
export const Transformador: React.FC<{ x: number; y: number; s?: number; sube?: boolean; t: number; carga?: number }> = ({ x, y, s = 1, sube = true, t, carga = 1 }) => {
  const uid = useUid();
  const vueltas = (n: number, cx: number, col: string) => Array.from({ length: n }, (_, i) => <rect key={i} x={cx - 62} y={-140 + i * (280 / n)} width={124} height={280 / n - 3} rx={5} fill={col} stroke="#3A210E" strokeWidth={2} />);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><linearGradient id={`${uid}n`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8E9DB2" /><stop offset="1" stopColor="#3A4658" /></linearGradient></defs>
      <Sombra x={0} y={200} rx={280} ry={16} opacidad={0.55} />
      <rect x={-250} y={-180} width={500} height={360} rx={20} fill="#10161F" stroke="#4A586E" strokeWidth={6} />
      <rect x={-210} y={-160} width={420} height={320} fill="none" stroke={`url(#${uid}n)`} strokeWidth={34} />
      <rect x={-20} y={-160} width={40} height={320} fill={`url(#${uid}n)`} />
      {vueltas(sube ? 4 : 10, -120, "#C4783A")}
      {vueltas(sube ? 10 : 4, 120, "#E09A52")}
      {[-120, 120].map((cx, i) => <circle key={cx} cx={cx} cy={-8} r={110 + 8 * Math.sin(t * 7 + i)} fill={CE.oro} opacity={0.08 * carga} />)}
      {/* aisladores */}
      {[-120, 120].map((cx) => <g key={cx}><rect x={cx - 12} y={-250} width={24} height={72} fill="#CFC6B0" stroke="#7A7260" strokeWidth={2} />{[0, 1, 2].map((k) => <ellipse key={k} cx={cx} cy={-246 + k * 22} rx={28} ry={8} fill="#E8E0CC" stroke="#7A7260" strokeWidth={2} />)}</g>)}
    </g>
  );
};

/* ───────────── torres en perspectiva ───────────── */

/** Torres de alta tensión que se acercan en perspectiva (POV volando por la línea). `p` avanza (cada 1 = una torre). Punto de fuga (cx, cy). */
export const TorresPOV: React.FC<{ cx?: number; cy?: number; p: number; t: number }> = ({ cx = W / 2, cy = 820, p, t }) => {
  const n = 9;
  const filas = Array.from({ length: n }, (_, i) => {
    const z = i + 1 - (p % 1);
    return { z, s: 1 / Math.max(0.55, z) };
  });
  const torre = (s: number) => ({ base: cy + 560 * s, tope: cy - 470 * s, a1: cy - 330 * s, a2: cy - 160 * s, w1: 360 * s, w2: 440 * s });
  return (
    <g>
      <path d={`M 0 ${cy + 40} L ${W} ${cy + 40} L ${W} ${H} L 0 ${H} Z`} fill="#08101C" opacity={0.75} />
      {filas.map(({ s }, i) => {
        const a = torre(s), b = filas[i + 1] ? torre(filas[i + 1].s) : null;
        const sw = Math.max(1.5, 14 * s);
        return (
          <g key={i} opacity={clamp(1.2 - (i / n) * 0.9) * clamp((filas[i].z - 0.1) / 0.5)}>
            {b && [[-1, a.a1, b.a1, a.w1, b.w1], [1, a.a1, b.a1, a.w1, b.w1], [0, a.tope, b.tope, 0, 0], [-1, a.a2, b.a2, a.w2, b.w2], [1, a.a2, b.a2, a.w2, b.w2]].map(([sg, ya, yb, wa, wb], k) => {
              const xa = cx + (sg as number) * (wa as number), xb = cx + (sg as number) * (wb as number);
              return (
                <g key={k}>
                  <path d={`M ${xa} ${ya} Q ${(xa + xb) / 2} ${((ya as number) + (yb as number)) / 2 + 40 * s} ${xb} ${yb}`} fill="none" stroke="#1B2433" strokeWidth={Math.max(1.5, 7 * s)} />
                  {Array.from({ length: 2 }, (_, q) => { const u = ((t * 1.2 + q * 0.5 + i * 0.13) % 1); const px = lerp(xa, xb, u), py = lerp(ya as number, yb as number, u) + Math.sin(u * Math.PI) * 40 * s; return <circle key={q} cx={px} cy={py} r={Math.max(2, 9 * s)} fill={CE.oro} opacity={0.9} />; })}
                </g>
              );
            })}
            <line x1={cx} y1={a.base} x2={cx} y2={a.tope} stroke="#6E7E95" strokeWidth={sw * 1.6} />
            <line x1={cx - a.w2} y1={a.a2} x2={cx + a.w2} y2={a.a2} stroke="#8A9AB0" strokeWidth={sw} />
            <line x1={cx - a.w1} y1={a.a1} x2={cx + a.w1} y2={a.a1} stroke="#8A9AB0" strokeWidth={sw} />
            <polyline points={`${cx - 60 * s * 1.4},${a.base} ${cx},${a.a2} ${cx + 60 * s * 1.4},${a.base}`} fill="none" stroke="#5B6A80" strokeWidth={sw * 0.8} />
            {[-1, 1].map((sg) => [a.a1, a.a2].map((ya, k) => <line key={`${sg}${k}`} x1={cx + sg * (k ? a.w2 : a.w1)} y1={ya} x2={cx + sg * (k ? a.w2 : a.w1)} y2={ya + 40 * s} stroke="#CFC6B0" strokeWidth={sw * 1.2} />))}
          </g>
        );
      })}
    </g>
  );
};

/* ───────────── poste, casa, medidor ───────────── */

export const Casa: React.FC<{ x: number; y: number; s?: number; luz?: number }> = ({ x, y, s = 1, luz = 0.4 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Sombra x={0} y={4} rx={210} ry={12} opacidad={0.5} />
    <rect x={-150} y={-170} width={300} height={170} fill="#E9DFC8" />
    <polygon points="-190,-166 190,-166 130,-290 -130,-290" fill="#3E5C86" />
    <rect x={-150} y={-6} width={300} height={6} fill="#6E6A60" />
    <rect x={-110} y={-130} width={92} height={78} fill={mezclar("#2C4A68", "#FFE9A8", luz)} stroke="#F4F7FA" strokeWidth={5} />
    <rect x={30} y={-120} width={64} height={120} fill="#7A5230" stroke="#2A1C10" strokeWidth={3} />
    <circle cx={82} cy={-58} r={4} fill="#D7C48A" />
    {luz > 0.3 && <ellipse cx={-64} cy={-90} rx={150} ry={110} fill="#FFE9A8" opacity={0.12 * luz} />}
  </g>
);

export const Poste: React.FC<{ x: number; y: number; s?: number; t: number }> = ({ x, y, s = 1, t }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Sombra x={0} y={4} rx={50} ry={7} opacidad={0.5} />
    <rect x={-14} y={-560} width={28} height={560} fill="#6B4E32" stroke="#2A1C10" strokeWidth={3} />
    <rect x={-120} y={-540} width={240} height={14} fill="#5A3F28" />
    {[-100, 0, 100].map((px) => <g key={px}><rect x={px - 5} y={-566} width={10} height={26} fill="#CFC6B0" /></g>)}
    <rect x={20} y={-460} width={70} height={110} rx={14} fill="#8E9DB2" stroke="#2A3342" strokeWidth={4} />
    <rect x={20} y={-460} width={70} height={14} rx={7} fill="#fff" opacity={0.3} />
    <circle cx={55} cy={-405} r={20 + 3 * Math.sin(t * 9)} fill={CE.oro} opacity={0.12} />
  </g>
);

/** Medidor de luz: carcasa redonda con vidrio, disco que gira y contador. */
export const MedidorLuz: React.FC<{ x: number; y: number; r?: number; t: number; vel?: number }> = ({ x, y, r = 150, t, vel = 1 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs><radialGradient id={`${uid}v`} cx="40%" cy="30%" r="80%"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.5" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></radialGradient></defs>
      <rect x={-r * 0.9} y={-r * 1.3} width={r * 1.8} height={r * 2.6} rx={22} fill="#CFD6DE" stroke="#7B8794" strokeWidth={5} />
      <circle r={r} fill="#EEF2F6" stroke="#5B6573" strokeWidth={8} />
      <ellipse cx={0} cy={r * 0.15} rx={r * 0.72} ry={r * 0.18} fill="#9AA6B3" />
      <g transform={`translate(0 ${r * 0.15})`}>
        {Array.from({ length: 6 }, (_, i) => { const a = i * 60 + t * 240 * vel; return <line key={i} x1={r * 0.72 * Math.cos((a * Math.PI) / 180)} y1={r * 0.18 * Math.sin((a * Math.PI) / 180)} x2={0} y2={0} stroke="#3A4658" strokeWidth={4} />; })}
      </g>
      <rect x={-r * 0.55} y={-r * 0.55} width={r * 1.1} height={r * 0.34} rx={6} fill="#0E131B" />
      <text x={0} y={-r * 0.3} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={r * 0.26} fill={"#7CFFB0"}>{String(Math.floor(1000 + t * 13)).padStart(5, "0")}</text>
      <text x={0} y={r * 0.62} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={r * 0.16} fill="#3A4658">kWh</text>
      <circle r={r} fill={`url(#${uid}v)`} />
    </g>
  );
};

/* ───────────── interruptor, enchufe, lámpara ───────────── */

export const Interruptor: React.FC<{ x: number; y: number; s?: number; on?: number }> = ({ x, y, s = 1, on = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-120} y={-190} width={240} height={380} rx={34} fill="#000" opacity={0.4} transform="translate(8 14)" />
    <rect x={-120} y={-190} width={240} height={380} rx={34} fill="#F1ECDD" stroke="#C9C2AE" strokeWidth={5} />
    <rect x={-60} y={-110} width={120} height={220} rx={16} fill="#D9D3C0" stroke="#A8A28E" strokeWidth={4} />
    <g transform={`translate(0 ${lerp(-52, 52, on)})`}>
      <rect x={-48} y={-58} width={96} height={116} rx={12} fill="#FBF8EE" stroke="#B9B3A0" strokeWidth={4} />
      <rect x={-40} y={-50} width={80} height={14} rx={6} fill="#fff" opacity={0.7} />
    </g>
    {[[-92, -160], [92, -160], [-92, 160], [92, 160]].map(([sx, sy], i) => <g key={i}><circle cx={sx} cy={sy} r={10} fill="#BDB6A2" /><line x1={sx - 6} y1={sy} x2={sx + 6} y2={sy} stroke="#7A7464" strokeWidth={3} /></g>)}
  </g>
);

export const Lampara: React.FC<{ x: number; y: number; s?: number; on?: number; t?: number }> = ({ x, y, s = 1, on = 0, t = 0 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <radialGradient id={`${uid}g`}><stop offset="0" stopColor="#FFF3C2" stopOpacity="0.95" /><stop offset="1" stopColor="#FFC500" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${uid}b`} cx="50%" cy="40%" r="60%"><stop offset="0" stopColor={mezclar("#C6D2DE", "#FFFFFF", on)} /><stop offset="1" stopColor={mezclar("#6F7E90", "#FFE27A", on)} /></radialGradient>
      </defs>
      {on > 0.01 && <circle cx={0} cy={-80} r={560 * on * (1 + 0.02 * Math.sin(t * 20))} fill={`url(#${uid}g)`} opacity={0.75} />}
      <line x1={0} y1={-480} x2={0} y2={-230} stroke="#1B2230" strokeWidth={10} />
      <rect x={-46} y={-240} width={92} height={70} rx={12} fill="#2A3342" stroke="#6B7C93" strokeWidth={4} />
      <path d="M -92 -80 C -92 -180 -50 -190 -46 -170 L 46 -170 C 50 -190 92 -180 92 -80 C 92 -10 50 20 30 30 L -30 30 C -50 20 -92 -10 -92 -80 Z" fill={`url(#${uid}b)`} stroke="#E6EEF7" strokeOpacity={0.5} strokeWidth={4} />
      <path d="M -26 -140 Q 0 -60 26 -140 M -10 -100 L -10 -20 M 10 -100 L 10 -20" fill="none" stroke={mezclar("#5B6A80", "#FF8A2E", on)} strokeWidth={4} strokeLinecap="round" />
      <ellipse cx={-40} cy={-100} rx={10} ry={30} fill="#fff" opacity={0.35} transform="rotate(20 -40 -100)" />
    </g>
  );
};

/** Enchufe de pared con dos ranuras y la espiga de tierra; `luz` ilumina las ranuras. */
export const Enchufe: React.FC<{ x: number; y: number; s?: number; luz?: number }> = ({ x, y, s = 1, luz = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-170} y={-170} width={340} height={340} rx={50} fill="#000" opacity={0.4} transform="translate(10 16)" />
    <rect x={-170} y={-170} width={340} height={340} rx={50} fill="#F1ECDD" stroke="#C9C2AE" strokeWidth={6} />
    <circle r={120} fill="#E6E0CE" stroke="#B9B3A0" strokeWidth={4} />
    {[-52, 52].map((px) => <g key={px}><rect x={px - 10} y={-70} width={20} height={80} rx={6} fill="#0B0F16" /><rect x={px - 10} y={-70} width={20} height={80} rx={6} fill={CE.oro} opacity={0.85 * luz} /></g>)}
    <circle cx={0} cy={72} r={14} fill="#0B0F16" />
    {luz > 0.01 && <circle r={220 * luz} fill={CE.oro} opacity={0.1 * luz} />}
  </g>
);

export { H, W, easeInOut, easeOut, lerp, clamp, RE };
