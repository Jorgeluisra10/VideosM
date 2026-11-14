/**
 * Kit del video «El par craneal VI: el chivato de la presión» (SINAPSIS · pares craneales): ilustración vectorial esquemática sobre fondo oscuro, determinista.
 *   DobleH   letra «E» con visión doble horizontal (dos imágenes lado a lado)
 * y reexporta lo ya hecho en otros kits (OjoP, Cabeza, Cerebro, Flecha, polyPt, Estallido).
 * Color: verde azulado = abducens (VI) · violeta = troclear (IV) · ámbar = oculomotor (III) · rojo = presión, daño y aviso · dorado = ligamento y datos.
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { clamp, easeOut, lerp, mezclar } from "../comun";
import { ME, Ambiente, Chip, azar, sua, FONT, MONOF, Cerebro } from "./me-kit";
import { PC, Cabeza } from "./pc-kit";
import { polyPt } from "./op-kit";
import { OjoP } from "./oc-kit";
import { Flecha, Estallido } from "./tr-kit";

export { ME, PC, Cabeza, OjoP, Ambiente, Chip, Cerebro, Flecha, Estallido, azar, sua, FONT, MONOF, clamp, easeOut, lerp, mezclar, polyPt };
export const ABC = { abd: "#33D6C0", troc: "#B78CFF", oculo: "#FFB347", rojo: "#FF5A5F", oro: "#FFD166", hueso: "#C8D2E8", gris: "#8B97B8", verde: "#7BE08A" } as const;

/** Letra «E» con visión doble horizontal: `sep` = separación en px (0 = una sola imagen). */
export const DobleH: React.FC<{ x: number; y: number; px?: number; sep?: number; color?: string }> = ({ x, y, px = 230, sep = 0, color = "#E6EDFF" }) => (
  <g transform={`translate(${x} ${y})`}>
    <text x={-sep / 2} y={0} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={px} fill={color} opacity={sep > 2 ? 0.72 : 1}>E</text>
    {sep > 2 && <text x={sep / 2} y={0} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={px} fill={color} opacity={0.72}>E</text>}
  </g>
);
