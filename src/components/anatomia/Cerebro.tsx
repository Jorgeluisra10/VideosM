import React from "react";
import { C } from "../../lib/colores";
import { onda, pop, prog, useT } from "../../lib/anim";
import { Halo, Pieza, Trazo } from "../svg/primitivas";

const LINEA = "rgba(248,250,252,0.62)";

/** Vista lateral (lóbulo frontal a la izquierda). Coordenadas locales centradas en (0,0). */
export const CEREBRO = {
  cerebro:
    "M -250,6 C -258,-70 -196,-142 -112,-166 C -40,-190 56,-196 128,-174 C 204,-152 254,-96 250,-24 C 247,36 214,70 170,82 C 150,88 132,88 116,84 C 96,98 60,104 24,98 C -6,112 -52,116 -86,102 C -132,106 -190,92 -226,58 C -244,40 -250,24 -250,6 Z",
  cerebelo: "M 96,84 C 130,70 196,80 208,110 C 216,140 176,160 134,152 C 100,146 84,112 96,84 Z",
  tronco: "M 30,98 C 26,140 40,186 50,232 L 92,232 C 94,182 88,140 80,96 Z",
  surcoLateral: "M -160,44 C -104,32 -40,22 44,-10",
  surcoCentral: "M 46,-192 C 40,-150 14,-100 -6,-46",
  /** circunvolución postcentral = corteza somatosensorial */
  cortezaSomato: "M 62,-190 C 62,-150 42,-108 18,-66",
  giros: [
    "M -214,-20 C -190,-60 -150,-50 -124,-84 C -100,-112 -60,-100 -40,-130",
    "M -190,30 C -150,10 -112,22 -84,-8",
    "M 80,-150 C 112,-122 158,-132 188,-100 C 214,-72 204,-44 232,-24",
    "M 90,-62 C 126,-44 156,-62 196,-32",
    "M -70,70 C -36,48 4,60 36,38",
    "M -214,-84 C -180,-110 -150,-120 -126,-146",
  ],
  talamo: { cx: -6, cy: 8, rx: 46, ry: 30, rot: -12 },
};

type Props = {
  x: number;
  y: number;
  escala?: number;
  t0: number;
  /** el tálamo se ilumina desde este segundo */
  talamo?: number;
  /** la corteza somatosensorial se ilumina desde este segundo */
  corteza?: number;
  /** el cerebro "se confunde" (parpadeo rojo) entre estos segundos */
  confusion?: { t: number; fin?: number };
  opacidad?: number;
};

export const Cerebro: React.FC<Props> = ({ x, y, escala = 1, t0, talamo, corteza, confusion, opacidad = 1 }) => {
  const t = useT();
  const k = prog(t, t0, 0.6);
  if (k <= 0.001) return null;
  const tk = talamo === undefined ? 0 : prog(t, talamo, 0.4);
  const ck = corteza === undefined ? 0 : prog(t, corteza, 0.4);
  const conf = confusion ? prog(t, confusion.t, 0.25) * (confusion.fin ? 1 - prog(t, confusion.fin, 0.4) : 1) : 0;
  const tal = CEREBRO.talamo;
  const respira = 1 + 0.008 * Math.sin(t * 2.4);

  return (
    <g opacity={k * opacidad}>
      {ck > 0.01 && <Halo x={x + 40 * escala} y={y - 120 * escala} r={230 * escala} color="amarillo" opacidad={0.5 * ck * (0.75 + 0.25 * onda(t, 0.8))} />}
      {tk > 0.01 && <Halo x={x + tal.cx * escala} y={y + tal.cy * escala} r={150 * escala} color="amarillo" opacidad={0.6 * tk * (0.75 + 0.25 * onda(t, 0.7))} />}
      {conf > 0.01 && <Halo x={x} y={y} r={380 * escala} color="rojo" opacidad={0.45 * conf * (0.6 + 0.4 * onda(t, 0.3))} />}
      <g transform={`translate(${x} ${y}) scale(${escala * respira})`}>
        <Pieza d={CEREBRO.tronco} relleno={C.panel} borde={LINEA} anchoBorde={4} t0={t0 + 0.1} />
        <Pieza d={CEREBRO.cerebelo} relleno={C.panel} borde={LINEA} anchoBorde={4} t0={t0 + 0.1} />
        <Pieza d={CEREBRO.cerebro} relleno={C.panel} t0={t0} />
        <Pieza d={CEREBRO.cerebro} relleno={conf > 0.01 ? `rgba(239,68,68,${0.1 + 0.16 * conf})` : "rgba(248,250,252,0.07)"} t0={t0} />
        <Trazo d={CEREBRO.cerebro} color={LINEA} ancho={5} t0={t0} dur={0.9} />
        {CEREBRO.giros.map((g, i) => (
          <Trazo key={i} d={g} color="rgba(248,250,252,0.22)" ancho={4} t0={t0 + 0.4 + i * 0.06} dur={0.6} />
        ))}
        <Trazo d={CEREBRO.surcoLateral} color="rgba(248,250,252,0.3)" ancho={4} t0={t0 + 0.6} dur={0.5} />
        <Trazo d={CEREBRO.surcoCentral} color="rgba(248,250,252,0.3)" ancho={4} t0={t0 + 0.6} dur={0.5} />
        <Trazo d="M 100,100 C 126,110 160,112 186,106 M 112,124 C 134,132 160,132 180,128" color="rgba(248,250,252,0.2)" ancho={3} t0={t0 + 0.7} dur={0.4} />

        {/* Corteza somatosensorial */}
        {ck > 0.01 && (
          <g>
            <path d={CEREBRO.cortezaSomato} fill="none" stroke={C.amarillo} strokeWidth={44} strokeLinecap="round" opacity={0.18 * ck} />
            <path d={CEREBRO.cortezaSomato} fill="none" stroke={C.amarillo} strokeWidth={22} strokeLinecap="round" opacity={0.95 * ck} />
          </g>
        )}

        {/* Tálamo */}
        <g transform={`translate(${tal.cx} ${tal.cy}) rotate(${tal.rot}) scale(${0.85 + 0.15 * Math.min(1.2, pop(t, t0 + 0.8))})`}>
          <ellipse rx={tal.rx} ry={tal.ry} fill={tk > 0.01 ? `rgba(250,204,21,${0.25 + 0.3 * tk})` : "rgba(248,250,252,0.12)"} stroke={tk > 0.01 ? C.amarillo : LINEA} strokeWidth={tk > 0.01 ? 5 : 4} />
        </g>
      </g>
    </g>
  );
};
