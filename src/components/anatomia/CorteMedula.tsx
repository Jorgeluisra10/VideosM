import React from "react";
import { C } from "../../lib/colores";
import { prog, useT } from "../../lib/anim";
import { Pieza, Trazo } from "../svg/primitivas";

const LINEA = "rgba(248,250,252,0.55)";

/** Mitad derecha de la sustancia gris en "mariposa"; la izquierda es su espejo. Coordenadas locales. */
const MITAD =
  "M 0,-40 C 12,-52 24,-80 32,-122 C 36,-142 62,-150 80,-134 C 88,-118 80,-84 86,-56 C 90,-36 118,-30 146,-26 C 168,-22 176,0 168,20 C 180,42 174,86 148,106 C 122,122 86,114 68,94 C 54,76 40,46 22,38 C 12,34 4,36 0,36";

type Props = {
  x: number;
  y: number;
  escala?: number;
  t0: number;
};

/** Sección transversal de la médula espinal: sustancia blanca, sustancia gris, conducto central. */
export const CorteMedula: React.FC<Props> = ({ x, y, escala = 1, t0 }) => {
  const t = useT();
  const k = prog(t, t0, 0.5);
  if (k <= 0.001) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`} opacity={k}>
      {/* sustancia blanca */}
      <Pieza d="M -300,0 A 300 250 0 1 1 300,0 A 300 250 0 1 1 -300,0 Z" relleno={C.panel} t0={t0} />
      <Pieza d="M -300,0 A 300 250 0 1 1 300,0 A 300 250 0 1 1 -300,0 Z" relleno="rgba(248,250,252,0.06)" t0={t0} />
      <Trazo d="M -300,0 A 300 250 0 1 1 300,0 A 300 250 0 1 1 -300,0 Z" color={LINEA} ancho={5} t0={t0} dur={1.0} />
      {/* sustancia gris */}
      <g transform="scale(1.35)">
        <Pieza d={`${MITAD} Z`} relleno="rgba(148,163,184,0.26)" t0={t0 + 0.35} />
        <g transform="scale(-1 1)">
          <Pieza d={`${MITAD} Z`} relleno="rgba(148,163,184,0.26)" t0={t0 + 0.35} />
        </g>
        <Trazo d={MITAD} color="rgba(203,213,225,0.8)" ancho={3.4} t0={t0 + 0.35} dur={0.9} />
        <g transform="scale(-1 1)">
          <Trazo d={MITAD} color="rgba(203,213,225,0.8)" ancho={3.4} t0={t0 + 0.35} dur={0.9} />
        </g>
        <circle cx={0} cy={-2} r={7} fill="none" stroke="rgba(203,213,225,0.8)" strokeWidth={3} opacity={prog(t, t0 + 0.9, 0.3)} />
      </g>
    </g>
  );
};

/** Convierte coordenadas locales del corte a coordenadas del escenario. */
export const enCorte = (x: number, y: number, escala: number, lx: number, ly: number) => ({
  x: x + lx * 1.35 * escala,
  y: y + ly * 1.35 * escala,
});
