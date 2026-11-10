/**
 * Kit del video «El par craneal III: la pupila que avisa» (SINAPSIS · pares craneales): anatomía vectorial esquemática sobre fondo oscuro, determinista.
 *   OjoP     ojo de frente con pupila variable (0–1 del iris), mirada desplazada (abajo y afuera) y párpado superior que cae (ptosis)
 *   Aviso    triángulo de advertencia con «!»
 * Color: ámbar = oculomotor (III) · azul = óptico (II) · verde = fibras de la pupila · rojo = presión, daño y urgencia · violeta = cerebro.
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { useUid } from "../../estudio/util";
import { clamp, easeOut, lerp, mezclar } from "../comun";
import { ME, Ambiente, Chip, azar, sua, FONT, MONOF, Cerebro } from "./me-kit";
import { PC } from "./pc-kit";
import { OPC, polyPt } from "./op-kit";

export { ME, PC, OPC, Ambiente, Chip, Cerebro, azar, sua, FONT, MONOF, clamp, easeOut, lerp, mezclar, polyPt };
export const OCC = { oculo: "#FFB347", optico: "#4FA3FF", pupila: "#7BE08A", rojo: "#FF5A5F", cereb: "#B78CFF", hueso: "#C8D2E8" } as const;

/**
 * Ojo de frente. Origen = centro; radio = r. `pupila` = radio de la pupila como fracción del iris (0.25 contraída · 0.55 normal · 0.95 dilatada) ·
 * `mira` = desplazamiento del iris [dx, dy] en fracciones de r · `parpado` 0–1 = cuánto cubre el párpado superior · `brillo` 0–1 halo.
 */
export const OjoP: React.FC<{ x: number; y: number; r?: number; pupila?: number; iris?: string; mira?: [number, number]; parpado?: number; brillo?: number; t?: number; opacidad?: number }> = ({ x, y, r = 100, pupila = 0.55, iris = "#4FA3FF", mira = [0, 0], parpado = 0, brillo = 0, t = 0, opacidad = 1 }) => {
  const uid = useUid();
  const ir = r * 0.5, px = mira[0] * r, py = mira[1] * r;
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacidad}>
      <defs>
        <radialGradient id={`${uid}e`} cx="40%" cy="35%" r="75%"><stop offset="0" stopColor="#F4F7FF" /><stop offset="1" stopColor="#B9C6E4" /></radialGradient>
        <clipPath id={`${uid}c`}><circle r={r} /></clipPath>
      </defs>
      {brillo > 0 && <circle r={r * 1.45 + 6 * Math.sin(t * 5)} fill={iris} opacity={0.2 * brillo} />}
      <circle r={r} fill={`url(#${uid}e)`} stroke="#5C6A90" strokeWidth={4} />
      <g clipPath={`url(#${uid}c)`}>
        <circle cx={px} cy={py} r={ir} fill={iris} stroke="#1B2A55" strokeWidth={3} />
        {Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; return <line key={i} x1={px + Math.cos(a) * ir * 0.45} y1={py + Math.sin(a) * ir * 0.45} x2={px + Math.cos(a) * ir * 0.95} y2={py + Math.sin(a) * ir * 0.95} stroke="#fff" strokeOpacity={0.22} strokeWidth={2} />; })}
        <circle cx={px} cy={py} r={Math.max(4, ir * pupila)} fill="#0A0F1F" />
        <circle cx={px - ir * 0.28} cy={py - ir * 0.3} r={Math.max(3, ir * 0.14)} fill="#fff" opacity={0.85} />
        {parpado > 0 && <path d={`M ${-r - 4} ${-r - 4} L ${r + 4} ${-r - 4} L ${r + 4} ${lerp(-r, r * 0.05, parpado)} Q 0 ${lerp(-r * 0.55, r * 0.5, parpado)} ${-r - 4} ${lerp(-r, r * 0.05, parpado)} Z`} fill="#5A4A6A" stroke="#2A2038" strokeWidth={5} />}
      </g>
    </g>
  );
};

/** Triángulo de advertencia con «!». Origen = centro; ancho ≈ 120·s. */
export const Aviso: React.FC<{ x: number; y: number; s?: number; color?: string; t?: number; opacidad?: number }> = ({ x, y, s = 1, color = OCC.rojo, t = 0, opacidad = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s * (1 + 0.06 * Math.sin(t * 7))})`} opacity={opacidad}>
    <path d="M 0 -62 L 62 46 L -62 46 Z" fill="#2A0A14" stroke={color} strokeWidth={8} strokeLinejoin="round" />
    <path d="M 0 -26 L 0 12" stroke="#fff" strokeWidth={9} strokeLinecap="round" /><circle cy={30} r={6} fill="#fff" />
  </g>
);
