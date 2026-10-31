/**
 * Kit del video «Tu cerebro no siente dolor» (carril B · SINAPSIS). Reutiliza el cerebro de glf-kit y añade:
 *   Capas    cuero cabelludo, cráneo y meninges como anillos alrededor del cerebro (con ventana abierta opcional) + destellos de «dolor»
 *   Sonda    varilla metálica con punta que se ilumina al estimular
 *   Burbuja  globo de diálogo con texto mono
 * Coordenadas: las mismas del cerebro (local, centro en 0,0); `Capas` y `Sonda` reciben x, y, s (centro y escala del cerebro).
 */
import React from "react";
import { useUid } from "../../estudio/util";
import { clamp } from "../comun";
import { MONOF } from "./real-kit";
import { GL, ptCerebro } from "./glf-kit";

export const DK = {
  cuero: "#E9A98F",
  cueroOsc: "#9C5A44",
  hueso: "#EFE7D2",
  huesoOsc: "#A89C80",
  menin: "#7FC4E6",
  rojo: "#FF4A3D",
  verde: "#34D399",
  metal: "#D8E2EC",
  amarillo: "#FFD84A",
} as const;

/** punto de un anillo a escala `k` (ensanchado en la zona del cerebelo, que va dentro del cráneo) */
const ptCapa = (th: number, k: number): [number, number] => {
  const d = Math.atan2(Math.sin(th - 0.8), Math.cos(th - 0.8));
  const bump = Math.abs(d) < 0.7 ? 0.3 * Math.cos(d * 2.24) : 0;
  return ptCerebro(th, k, bump);
};

/** banda entre las escalas k1 (interior) y k2 (exterior) para th ∈ [a, b] (radianes) */
export const bandaPath = (k1: number, k2: number, a: number, b: number, pasos = 120): string => {
  const ext: [number, number][] = [], int: [number, number][] = [];
  for (let i = 0; i <= pasos; i++) {
    const th = a + ((b - a) * i) / pasos;
    ext.push(ptCapa(th, k2));
    int.push(ptCapa(th, k1));
  }
  const f = (p: [number, number]): string => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  return `M ${f(ext[0])} ` + ext.slice(1).map((p) => `L ${f(p)}`).join(" ") + ` L ${f(int[int.length - 1])} ` + int.slice(0, -1).reverse().map((p) => `L ${f(p)}`).join(" ") + " Z";
};
const lineaPath = (k: number, a: number, b: number, pasos = 120): string =>
  Array.from({ length: pasos + 1 }, (_, i) => { const [x, y] = ptCapa(a + ((b - a) * i) / pasos, k); return `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`; }).join(" ");

const DEG = Math.PI / 180;
const FULL = [-93 * DEG, 273 * DEG] as const;
/** con ventana: se quita un trozo arriba (de -128° a -52°) */
const CON_VENTANA = [-52 * DEG, 232 * DEG] as const;

/**
 * Anillos de la cabeza. `k` de cada capa (relativo al cerebro): meninges 1,03–1,06 · cráneo 1,08–1,2 · cuero 1,2–1,27.
 * Aparición 0–1 de cada capa: `cuero`, `craneo`, `menin`. `ventana` = hay un hueco arriba (craneotomía).
 * `duele` {cuero, craneo, menin}: 0–1 = destello rojo de «dolor» en esa capa. `pulso` 0–1 hace latir las meninges (vasos).
 */
export const Capas: React.FC<{ x: number; y: number; s?: number; cuero?: number; craneo?: number; menin?: number; ventana?: boolean; duele?: { cuero?: number; craneo?: number; menin?: number }; pulso?: number; opacidad?: number }> = ({ x, y, s = 1, cuero = 1, craneo = 1, menin = 1, ventana = false, duele = {}, pulso = 0, opacidad = 1 }) => {
  const uid = useUid();
  const [a, b] = ventana ? CON_VENTANA : FULL;
  const dC = duele.cuero ?? 0, dK = duele.craneo ?? 0, dM = duele.menin ?? 0;
  const grosor = (v: number): number => 0.5 + 0.5 * clamp(v);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
      <defs>
        <linearGradient id={`${uid}cu`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={DK.cuero} /><stop offset="1" stopColor={DK.cueroOsc} /></linearGradient>
        <linearGradient id={`${uid}hu`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={DK.hueso} /><stop offset="1" stopColor={DK.huesoOsc} /></linearGradient>
        <filter id={`${uid}gl`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10" /></filter>
      </defs>
      {/* cuero cabelludo */}
      <g opacity={clamp(cuero * 1.5)} transform={`scale(${grosor(cuero) * 0.4 + 0.6})`}>
        <path d={bandaPath(1.2, 1.27, a, b)} fill={`url(#${uid}cu)`} stroke="#FFD2BE" strokeOpacity={0.5} strokeWidth={2} />
        {dC > 0 && <path d={bandaPath(1.2, 1.27, a, b)} fill={DK.rojo} opacity={dC * 0.85} filter={`url(#${uid}gl)`} />}
      </g>
      {/* cráneo */}
      <g opacity={clamp(craneo * 1.5)} transform={`scale(${grosor(craneo) * 0.4 + 0.6})`}>
        <path d={bandaPath(1.08, 1.19, a, b)} fill={`url(#${uid}hu)`} stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />
        <path d={lineaPath(1.17, a, b)} fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={3} />
        {dK > 0 && <path d={bandaPath(1.08, 1.19, a, b)} fill={DK.rojo} opacity={dK * 0.85} filter={`url(#${uid}gl)`} />}
      </g>
      {/* meninges (membrana fina con vasos) */}
      <g opacity={clamp(menin * 1.5)}>
        <path d={bandaPath(1.03, 1.065, FULL[0], FULL[1])} fill={DK.menin} opacity={0.55} stroke={DK.menin} strokeWidth={2} />
        <path d={lineaPath(1.048, FULL[0], FULL[1])} fill="none" stroke="#FF8A7A" strokeWidth={3 + 2.5 * pulso} strokeDasharray="14 12" strokeOpacity={0.55 + 0.4 * pulso} strokeLinecap="round" />
        {dM > 0 && <path d={bandaPath(1.03, 1.065, FULL[0], FULL[1])} fill={DK.rojo} opacity={dM * 0.9} filter={`url(#${uid}gl)`} />}
      </g>
    </g>
  );
};

/** Sonda de estimulación: varilla metálica con la punta en (x, y) y dirección `ang` (grados, hacia donde apunta la punta). `luz` 0–1 = destello amarillo en la punta. */
export const Sonda: React.FC<{ x: number; y: number; ang?: number; largo?: number; luz?: number; opacidad?: number }> = ({ x, y, ang = 90, largo = 420, luz = 0, opacidad = 1 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang - 90})`} opacity={opacidad}>
      <defs>
        <linearGradient id={`${uid}m`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#5D6B78" /><stop offset="0.4" stopColor="#F4F8FB" /><stop offset="1" stopColor="#6E7C89" /></linearGradient>
        <radialGradient id={`${uid}l`}><stop offset="0" stopColor={DK.amarillo} stopOpacity="1" /><stop offset="1" stopColor={DK.amarillo} stopOpacity="0" /></radialGradient>
      </defs>
      <path d={`M 0 0 L -7 -40 L -11 -${largo} L 11 -${largo} L 7 -40 Z`} fill={`url(#${uid}m)`} stroke="#243240" strokeOpacity={0.6} strokeWidth={1.5} />
      <rect x={-17} y={-largo - 40} width={34} height={46} rx={10} fill="#1C2733" stroke="#8FA3B5" strokeWidth={2} />
      {luz > 0 && <circle r={46 * luz + 10} fill={`url(#${uid}l)`} opacity={luz} />}
      <circle r={5} fill={luz > 0.2 ? DK.amarillo : "#E7EEF5"} />
    </g>
  );
};

/** Globo de diálogo con texto mono; `cola` = punto (x,y) hacia el que apunta la cola. */
export const Burbuja: React.FC<{ x: number; y: number; w: number; h: number; texto: string; cola: [number, number]; color?: string; px?: number; opacidad?: number; id?: string }> = ({ x, y, w, h, texto, cola, color = GL.lcrClaro, px = 40, opacidad = 1, id = "burbuja" }) => (
  <g opacity={opacidad}>
    <path d={`M ${x + w * 0.2 + (cola[0] - x - w * 0.2) * 0.25} ${y + h + Math.min(70, (cola[1] - y - h) * 0.3)} L ${x + w * 0.25} ${y + h - 2} L ${x + w * 0.45} ${y + h - 2} Z`} fill="#06101C" fillOpacity={0.9} stroke={color} strokeWidth={3} strokeLinejoin="round" />
    <rect x={x} y={y} width={w} height={h} rx={h / 2.2} fill="#06101C" fillOpacity={0.9} stroke={color} strokeWidth={3} />
    <rect x={x + w * 0.24} y={y + h - 6} width={w * 0.22} height={8} fill="#06101C" />
    <text data-texto={id} x={x + w / 2} y={y + h / 2 + px * 0.34} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={px} fill={color} letterSpacing="0.04em">{texto}</text>
  </g>
);

/** Punto de la polilínea `pts` en la fracción u (0–1) de su largo. */
export const puntoPoli = (pts: [number, number][], u: number): [number, number] => {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  let d = clamp(u) * total;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) { const k = seg[i] ? d / seg[i] : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; }
    d -= seg[i];
  }
  return pts[pts.length - 1];
};
