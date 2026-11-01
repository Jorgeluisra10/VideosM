/**
 * Kit del video «¿Tu intestino es un segundo cerebro?» (carril B · SINAPSIS): un tubo digestivo dibujado como render —pared muscular con volumen,
 * luz interior con pliegues, bolo alimenticio— con su red de neuronas (plexo entérico) que se ilumina. Todo SVG determinista.
 *   Intestino   tubo vertical con onda peristáltica opcional, neuronas en la pared y un tramo «aganglionar» opcional (sin neuronas, estrecho)
 *   Ganglio     racimo de neuronas con halo
 *   cx          eje (x) del tubo a la altura y
 */
import React from "react";
import { mulberry32 } from "../../anim/piezas";
import { useUid } from "../../estudio/util";
import { clamp } from "../comun";

export const IC = {
  pared: "#E58C7B",
  paredClara: "#FFC2B3",
  paredOsc: "#7D2F33",
  luz: "#2C0B11",
  luzClara: "#6E2230",
  bolo: "#D9A25B",
  boloClaro: "#F6D79B",
  boloOsc: "#8A5A22",
  neurona: "#7C9BFF",
  neuronaClara: "#CFE0FF",
  azul: "#4C7DFF",
  oro: "#FFC500",
  serotonina: "#C58BFF",
  serotoninaClara: "#EBD3FF",
  rojo: "#FF4A3D",
  verde: "#34D399",
  hielo: "#BFE0FF",
} as const;

const gauss = (x: number, s: number): number => Math.exp(-(x * x) / (2 * s * s));

/** eje del tubo: serpentea suavemente */
export const cxTubo = (y: number, cx0 = 540, amp = 34): number => cx0 + amp * Math.sin(y / 130);

export type OpcionesTubo = {
  y0: number; y1: number;
  /** radio de la luz en reposo */
  R0: number;
  /** posición y del bolo (o null) */
  bolo?: number | null;
  /** hay onda peristáltica alrededor del bolo */
  onda?: boolean;
  /** y a partir de la cual el tubo es aganglionar: estrecho, sin neuronas (Hirschsprung) */
  agangDesde?: number | null;
  /** dilatación del tramo sano (por encima del tramo aganglionar) 0–1 */
  dilata?: number;
  neuronas?: boolean;
  /** 0–1 brillo de las neuronas en la altura y */
  luzNeuronas?: (y: number) => number;
  cx0?: number;
  amp?: number;
  /** aparición 0–1 */
  k?: number;
  /** semilla de neuronas */
  semilla?: number;
};

const radioEn = (y: number, o: OpcionesTubo): { luz: number; pared: number; contra: number } => {
  let R = o.R0, contra = 0;
  if (o.agangDesde != null) {
    const u = clamp((y - (o.agangDesde - 30)) / 60);
    const sano = o.R0 * (1 + 0.5 * (o.dilata ?? 0));
    const ang = o.R0 * 0.46;
    R = sano + (ang - sano) * u;
    contra = u;
  }
  if (o.onda && o.bolo != null) {
    const d = y - o.bolo;
    const aprieta = gauss(d + 110, 46);
    const ensancha = gauss(d, 52);
    R = R * (1 - 0.52 * aprieta + 0.22 * ensancha);
    contra = Math.max(contra, aprieta);
  }
  return { luz: R, pared: 24 + 16 * contra, contra };
};

/** Neurona pequeña (soma con halo). */
const Soma: React.FC<{ x: number; y: number; r: number; luz: number; id: string }> = ({ x, y, r, luz, id }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r * 2.6} fill={IC.neurona} opacity={0.12 + 0.45 * luz} />
    <circle r={r} fill={`url(#${id})`} stroke={IC.neuronaClara} strokeWidth={1.4} opacity={0.92} />
    <circle cx={-r * 0.3} cy={-r * 0.35} r={r * 0.28} fill="#fff" opacity={0.55} />
  </g>
);

/**
 * Tubo digestivo vertical (de `y0` a `y1`). Dibuja: pared exterior, luz con pliegues, bolo y, si `neuronas`, el plexo en ambas orillas.
 */
export const Intestino: React.FC<OpcionesTubo & { opacidad?: number }> = (o) => {
  const uid = useUid();
  const { y0, y1, neuronas = true, luzNeuronas = () => 0.3, cx0 = 540, amp = 34, k = 1, semilla = 3, opacidad = 1 } = o;
  const ys: number[] = [];
  for (let y = y0; y <= y1; y += 8) ys.push(y);
  const cx = (y: number): number => cxTubo(y, cx0, amp);
  const izq = (f: (y: number) => number): string => ys.map((y, i) => `${i ? "L" : "M"} ${(cx(y) - f(y)).toFixed(1)} ${y}`).join(" ");
  const der = (f: (y: number) => number): string => [...ys].reverse().map((y) => `L ${(cx(y) + f(y)).toFixed(1)} ${y}`).join(" ");
  const R = (y: number): number => radioEn(y, o).luz * k;
  const P = (y: number): number => radioEn(y, o).pared;
  const poligono = (f: (y: number) => number): string => `${izq(f)} ${der(f)} Z`;
  const rand = mulberry32(semilla);
  // pliegues circulares en la luz
  const pliegues = Array.from({ length: Math.floor((y1 - y0) / 38) }, (_, i) => y0 + 24 + i * 38);
  // ganglios del plexo
  const ganglios = Array.from({ length: Math.floor((y1 - y0) / 62) + 1 }, (_, i) => ({ y: y0 + 14 + i * 62, dx: rand() * 14, n: 2 + Math.floor(rand() * 2), fase: rand() * 6 }));
  const mostrarNeuronas = (y: number): boolean => !(o.agangDesde != null && y > o.agangDesde - 10);
  return (
    <g opacity={opacidad * clamp(k * 2)}>
      <defs>
        <linearGradient id={`${uid}p`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={IC.paredOsc} /><stop offset="0.28" stopColor={IC.paredClara} /><stop offset="0.55" stopColor={IC.pared} /><stop offset="1" stopColor={IC.paredOsc} /></linearGradient>
        <linearGradient id={`${uid}l`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#12040A" /><stop offset="0.4" stopColor={IC.luzClara} /><stop offset="1" stopColor="#14050B" /></linearGradient>
        <radialGradient id={`${uid}n`} cx="40%" cy="35%" r="75%"><stop offset="0" stopColor={IC.neuronaClara} /><stop offset="0.6" stopColor={IC.neurona} /><stop offset="1" stopColor="#2A3E9E" /></radialGradient>
        <radialGradient id={`${uid}b`} cx="38%" cy="32%" r="75%"><stop offset="0" stopColor={IC.boloClaro} /><stop offset="0.55" stopColor={IC.bolo} /><stop offset="1" stopColor={IC.boloOsc} /></radialGradient>
        <clipPath id={`${uid}c`}><path d={poligono((y) => R(y))} /></clipPath>
        <filter id={`${uid}s`} x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="12" /></filter>
        <linearGradient id={`${uid}fg`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset={Math.min(0.45, 56 / (y1 - y0))} stopColor="#fff" stopOpacity="1" /><stop offset={Math.max(0.55, 1 - 56 / (y1 - y0))} stopColor="#fff" stopOpacity="1" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <mask id={`${uid}fm`} maskUnits="userSpaceOnUse" x={0} y={y0 - 40} width={1080} height={y1 - y0 + 80}><rect x={0} y={y0} width={1080} height={y1 - y0} fill={`url(#${uid}fg)`} /></mask>
      </defs>
      <g mask={`url(#${uid}fm)`}>
      {/* sombra */}
      <path d={poligono((y) => R(y) + P(y))} fill="#000" opacity={0.4} transform="translate(10 14)" filter={`url(#${uid}s)`} />
      {/* pared muscular */}
      <path d={poligono((y) => R(y) + P(y))} fill={`url(#${uid}p)`} stroke={IC.paredClara} strokeOpacity={0.45} strokeWidth={2} />
      {/* estrías circulares de la pared */}
      {ys.filter((_, i) => i % 3 === 0).map((y) => <line key={y} x1={cx(y) - R(y) - P(y) + 6} y1={y} x2={cx(y) - R(y) - 2} y2={y} stroke={IC.paredOsc} strokeOpacity={0.35} strokeWidth={2} />)}
      {ys.filter((_, i) => i % 3 === 0).map((y) => <line key={`r${y}`} x1={cx(y) + R(y) + 2} y1={y} x2={cx(y) + R(y) + P(y) - 6} y2={y} stroke={IC.paredOsc} strokeOpacity={0.35} strokeWidth={2} />)}
      {/* luz */}
      <path d={poligono((y) => R(y))} fill={`url(#${uid}l)`} />
      <g clipPath={`url(#${uid}c)`}>
        {pliegues.map((y, i) => {
          const r = R(y);
          return <path key={i} d={`M ${cx(y) - r} ${y} Q ${cx(y)} ${y + 18 + (i % 2) * 6} ${cx(y) + r} ${y}`} fill="none" stroke="#B4505F" strokeOpacity={0.34} strokeWidth={3} />;
        })}
        <path d={izq((y) => R(y) * 0.78)} fill="none" stroke="#fff" strokeOpacity={0.12} strokeWidth={6} />
        {o.bolo != null && (
          <g>
            <ellipse cx={cx(o.bolo)} cy={o.bolo} rx={Math.max(10, R(o.bolo) * 0.86)} ry={R(o.bolo) * 0.86 * 0.9} fill={`url(#${uid}b)`} stroke={IC.boloClaro} strokeOpacity={0.6} strokeWidth={2} />
            <ellipse cx={cx(o.bolo) - R(o.bolo) * 0.3} cy={o.bolo - R(o.bolo) * 0.3} rx={R(o.bolo) * 0.28} ry={R(o.bolo) * 0.14} fill="#fff" opacity={0.4} />
          </g>
        )}
      </g>
      {/* plexo entérico: ganglios en ambas orillas, unidos por fibras */}
      {neuronas && ganglios.filter((g) => mostrarNeuronas(g.y)).map((g, i, arr) => {
        const l = clamp(luzNeuronas(g.y));
        return [-1, 1].map((d) => {
          const x = cx(g.y) + d * (R(g.y) + P(g.y) + 12 + g.dx * 0.4);
          const sig = arr[i + 1];
          return (
            <g key={`${i}${d}`}>
              {sig && <path d={`M ${x} ${g.y} Q ${x + d * 14} ${(g.y + sig.y) / 2} ${cx(sig.y) + d * (R(sig.y) + P(sig.y) + 12 + sig.dx * 0.4)} ${sig.y}`} fill="none" stroke={IC.neurona} strokeOpacity={0.35 + 0.5 * l} strokeWidth={2.4} />}
              {Array.from({ length: g.n }, (_, j) => <Soma key={j} x={x + d * (j * 8 - 4)} y={g.y + (j - 1) * 9} r={7 + (j % 2) * 2} luz={l} id={`${uid}n`} />)}
            </g>
          );
        });
      })}
      </g>
    </g>
  );
};

/** Punta de flecha/chevron pequeña (apunta hacia arriba por defecto). */
export const Chevron: React.FC<{ x: number; y: number; color: string; s?: number; abajo?: boolean; opacidad?: number }> = ({ x, y, color, s = 1, abajo = false, opacidad = 1 }) => (
  <path d="M -9 6 L 0 -6 L 9 6" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" transform={`translate(${x} ${y}) scale(${s}) ${abajo ? "scale(1 -1)" : ""}`} opacity={opacidad} />
);
