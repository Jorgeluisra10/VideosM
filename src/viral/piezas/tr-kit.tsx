/**
 * Kit del video «El par craneal IV: el nervio que rompe las reglas» (SINAPSIS · pares craneales): anatomía vectorial esquemática sobre fondo oscuro, determinista.
 *   Estallido  estrella de impacto (golpe)
 *   Flecha     flecha simple con punta (dirección de la mirada, del movimiento)
 *   Doble      letra «E» vista doble (dos imágenes desplazadas verticalmente)
 * Color: ámbar = troclear (IV) · azul/naranja = los dos lados · dorado = polea y datos · rojo = daño · violeta = tronco encefálico.
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { clamp, easeOut, lerp, mezclar } from "../comun";
import { ME, Ambiente, Chip, azar, sua, FONT, MONOF } from "./me-kit";
import { PC } from "./pc-kit";
import { OPC, polyPt } from "./op-kit";
import { OjoP, OCC } from "./oc-kit";

export { ME, PC, OPC, OCC, OjoP, Ambiente, Chip, azar, sua, FONT, MONOF, clamp, easeOut, lerp, mezclar, polyPt };
export const TRC = { troclear: "#FFB347", izq: "#4FA3FF", der: "#FF9E3D", polea: "#FFD166", tronco: "#B78CFF", rojo: "#FF5A5F", gris: "#8B97B8", verde: "#7BE08A" } as const;

export const Estallido: React.FC<{ x: number; y: number; s?: number; opacidad?: number }> = ({ x, y, s = 1, opacidad = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}><polygon points="0,-60 14,-22 52,-34 28,-2 60,20 20,22 16,60 -6,26 -42,48 -26,10 -62,-8 -22,-14" fill="#FF9E3D" stroke="#fff" strokeWidth={3} /></g>
);

/** Flecha de (x0,y0) a (x1,y1). `k` 0–1 = cuánto está dibujada. */
export const Flecha: React.FC<{ x0: number; y0: number; x1: number; y1: number; color?: string; k?: number; grosor?: number }> = ({ x0, y0, x1, y1, color = "#fff", k = 1, grosor = 7 }) => {
  const xe = lerp(x0, x1, easeOut(k)), ye = lerp(y0, y1, easeOut(k)), an = Math.atan2(y1 - y0, x1 - x0), L = 26;
  return (
    <g opacity={clamp(k * 3)}>
      <line x1={x0} y1={y0} x2={xe} y2={ye} stroke={color} strokeWidth={grosor} strokeLinecap="round" />
      <path d={`M ${xe - Math.cos(an - 0.5) * L} ${ye - Math.sin(an - 0.5) * L} L ${xe} ${ye} L ${xe - Math.cos(an + 0.5) * L} ${ye - Math.sin(an + 0.5) * L}`} stroke={color} strokeWidth={grosor} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** Letra «E» con visión doble: `sep` = separación vertical en px (0 = una sola imagen). */
export const Doble: React.FC<{ x: number; y: number; px?: number; sep?: number; giro?: number; color?: string }> = ({ x, y, px = 220, sep = 0, giro = 0, color = "#E6EDFF" }) => (
  <g transform={`translate(${x} ${y})`}>
    <text x={0} y={-sep / 2} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={px} fill={color} opacity={sep > 2 ? 0.7 : 1} transform={`rotate(${-giro} 0 ${-sep / 2})`}>E</text>
    {sep > 2 && <text x={0} y={sep / 2} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={px} fill={color} opacity={0.7} transform={`rotate(${giro} 0 ${sep / 2})`}>E</text>}
  </g>
);
