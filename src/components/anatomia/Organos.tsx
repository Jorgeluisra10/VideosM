import React from "react";
import { Easing } from "remotion";
import { C } from "../../lib/colores";
import { onda, prog, useT } from "../../lib/anim";
import { Halo, Pieza, Trazo } from "../svg/primitivas";

export const TIPOS_ORGANO = ["pulmones", "rinon", "higado", "estomago", "pancreas", "hueso"] as const;
export type TipoOrgano = (typeof TIPOS_ORGANO)[number];

const LINEA = "rgba(248,250,252,0.7)";
const TENUE = "rgba(248,250,252,0.28)";

/** Tamaño natural aproximado (px) de cada dibujo, para escalar por ancho. */
export const ANCHO_ORGANO: Record<TipoOrgano, number> = { pulmones: 470, rinon: 300, higado: 470, estomago: 330, pancreas: 480, hueso: 240 };

type Dibujo = { contorno: string[]; detalle: string[]; tubos?: { d: string; ancho: number }[] };

const DIBUJOS: Record<TipoOrgano, Dibujo> = {
  pulmones: {
    contorno: [
      "M -34,-160 C -120,-160 -208,-60 -218,60 C -226,150 -196,190 -124,186 C -62,182 -36,140 -34,60 Z",
      "M 34,-160 C 120,-160 208,-60 218,60 C 226,150 196,190 124,186 C 62,182 36,140 34,60 Z",
    ],
    detalle: [
      "M -46,-20 C -90,-10 -130,10 -160,60 M -50,10 C -90,30 -120,70 -140,120 M -48,-60 C -100,-60 -150,-30 -176,10",
      "M 46,-20 C 90,-10 130,10 160,60 M 50,10 C 90,30 120,70 140,120 M 48,-60 C 100,-60 150,-30 176,10",
    ],
    tubos: [
      { d: "M 0,-230 L 0,-100", ancho: 34 },
      { d: "M 0,-100 L -52,-34", ancho: 24 },
      { d: "M 0,-100 L 52,-34", ancho: 24 },
    ],
  },
  rinon: {
    contorno: ["M -20,-160 C 90,-170 150,-90 140,10 C 130,110 60,170 -30,160 C -80,155 -70,110 -45,85 C -20,60 -20,30 -45,5 C -80,-30 -90,-150 -20,-160 Z"],
    detalle: [
      "M -10,-120 C 70,-130 110,-70 100,10 C 92,90 40,130 -20,122",
      "M 8,-40 L 70,-70 M 12,10 L 84,10 M 4,60 L 66,90",
    ],
    tubos: [{ d: "M -42,26 C -60,80 -46,150 -30,230", ancho: 18 }],
  },
  higado: {
    contorno: ["M -230,-40 C -200,-120 -60,-150 60,-130 C 170,-110 240,-60 230,10 C 220,70 150,110 60,120 C -40,130 -120,100 -190,40 C -215,15 -235,-10 -230,-40 Z"],
    detalle: ["M 20,-130 C 10,-60 20,40 60,120", "M -120,-70 C -90,-20 -60,30 -40,100", "M 110,-100 C 130,-40 130,30 100,100"],
    tubos: [{ d: "M 70,96 C 86,118 96,142 80,166", ancho: 30 }],
  },
  estomago: {
    contorno: ["M -60,-150 C -20,-170 30,-150 40,-100 C 60,-60 130,-40 150,20 C 170,90 120,160 40,160 C -30,160 -80,110 -90,40 C -95,-20 -110,-100 -60,-150 Z"],
    detalle: ["M -50,-90 C -20,-60 10,-20 60,10", "M -70,-20 C -30,10 0,60 40,100", "M -30,-120 C 0,-100 20,-70 60,-40"],
    tubos: [
      { d: "M -76,-210 C -72,-180 -66,-160 -62,-140", ancho: 26 },
      { d: "M 148,16 C 190,10 214,-20 214,-60", ancho: 24 },
    ],
  },
  pancreas: {
    contorno: ["M -230,30 C -200,-20 -100,-40 0,-30 C 100,-20 190,-60 230,-40 C 250,-20 230,20 190,30 C 120,50 60,70 0,60 C -80,50 -150,100 -200,80 C -240,70 -245,50 -230,30 Z"],
    detalle: ["M -210,52 C -140,20 -60,10 20,10 C 100,10 170,-10 215,-24"],
    tubos: [],
  },
  hueso: {
    contorno: [
      "M -40,-190 C -80,-200 -110,-170 -90,-140 C -110,-130 -120,-100 -70,-95 C -55,-60 -55,60 -70,95 C -120,100 -110,130 -90,140 C -110,170 -80,200 -40,190 C -20,185 -10,170 0,170 C 10,170 20,185 40,190 C 80,200 110,170 90,140 C 110,130 120,100 70,95 C 55,60 55,-60 70,-95 C 120,-100 110,-130 90,-140 C 110,-170 80,-200 40,-190 C 20,-185 10,-170 0,-170 C -10,-170 -20,-185 -40,-190 Z",
    ],
    detalle: ["M -30,-80 L -30,80 M 30,-80 L 30,80", "M -22,-40 L 22,-50 M -22,0 L 22,-10 M -22,40 L 22,30"],
    tubos: [],
  },
};

type Props = {
  x: number;
  y: number;
  tipo: TipoOrgano;
  /** escala del dibujo (se calcula a partir del ancho deseado en px / ANCHO_ORGANO[tipo]) */
  escala: number;
  t0: number;
  color?: string;
  /** resalta el órgano con halo y relleno de color desde este segundo */
  resaltar?: number;
};

export const Organo: React.FC<Props> = ({ x, y, tipo, escala, t0, color = C.rojo, resaltar }) => {
  const t = useT();
  const k = prog(t, t0, 0.6, Easing.out(Easing.cubic));
  if (k <= 0.001) return null;
  const rk = resaltar === undefined ? 0 : prog(t, resaltar, 0.4);
  const d = DIBUJOS[tipo];
  return (
    <g opacity={k}>
      {rk > 0.01 && <Halo x={x} y={y} r={escala * ANCHO_ORGANO[tipo] * 0.75} color={color === C.azul ? "azul" : color === C.amarillo ? "amarillo" : "rojo"} opacidad={0.55 * rk * (0.75 + 0.25 * onda(t, 0.9))} />}
      <g transform={`translate(${x} ${y}) scale(${escala * (0.92 + 0.08 * k)})`}>
        {(d.tubos ?? []).map((tb, i) => (
          <g key={`t${i}`}>
            <Trazo d={tb.d} color={LINEA} ancho={tb.ancho} t0={t0 + 0.1} dur={0.7} />
            <Trazo d={tb.d} color={C.panel} ancho={tb.ancho - 8} t0={t0 + 0.1} dur={0.7} />
          </g>
        ))}
        {d.contorno.map((c, i) => (
          <g key={`c${i}`}>
            <Pieza d={c} relleno={C.panel} t0={t0} />
            <Pieza d={c} relleno={rk > 0.01 ? `${color}${Math.round(34 + 40 * rk).toString(16).padStart(2, "0")}` : "rgba(248,250,252,0.07)"} borde={LINEA} anchoBorde={6} t0={t0} />
          </g>
        ))}
        {d.detalle.map((c, i) => (
          <Trazo key={`d${i}`} d={c} color={TENUE} ancho={5} t0={t0 + 0.4 + i * 0.08} dur={0.6} />
        ))}
      </g>
    </g>
  );
};
