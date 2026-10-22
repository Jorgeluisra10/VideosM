import React from "react";
import { C } from "../../lib/colores";
import { onda, prog, useT } from "../../lib/anim";
import { Halo, Impulso, Trazo } from "../svg/primitivas";

const DENDRITAS = [
  "M -22,-18 C -46,-40 -62,-52 -86,-62 M -62,-50 C -70,-64 -72,-76 -64,-90",
  "M -8,-28 C -12,-56 -4,-76 10,-94 M 2,-76 C 16,-82 28,-92 30,-106",
  "M 16,-24 C 40,-44 64,-50 84,-48 M 62,-48 C 70,-62 80,-68 92,-70",
  "M -30,4 C -58,2 -78,-8 -100,-24",
  "M -26,22 C -48,40 -70,46 -92,40",
];
export const EJE_NEURONA = "M 26,6 C 120,6 220,6 560,6";

type Props = {
  x: number;
  y: number;
  /** escala del dibujo (natural ≈ 730 px de ancho) */
  escala: number;
  t0: number;
  mielina?: boolean;
  /** el impulso recorre el axón desde este segundo */
  impulso?: number;
};

/** Neurona con dendritas, soma, axón (opcionalmente mielinizado) y botones terminales. Centro del soma = (x, y). */
export const Neurona: React.FC<Props> = ({ x, y, escala, t0, mielina = true, impulso }) => {
  const t = useT();
  const k = prog(t, t0, 0.5);
  if (k <= 0.001) return null;
  const ik = impulso === undefined ? 0 : prog(t, impulso, 0.3);
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      {ik > 0.01 && <Halo x={0} y={0} r={150} color="amarillo" opacidad={0.5 * ik * (0.7 + 0.3 * onda(t, 0.7))} />}
      {DENDRITAS.map((d, i) => (
        <Trazo key={i} d={d} color={C.amarillo} ancho={6} t0={t0 + 0.05 * i} dur={0.6} opacidad={0.9} />
      ))}
      <Trazo d={EJE_NEURONA} color={C.amarillo} ancho={7} t0={t0 + 0.2} dur={0.9} brillo={0.4} />
      {mielina &&
        [0, 1, 2, 3, 4].map((i) => (
          <g key={i} opacity={prog(t, t0 + 0.8 + i * 0.1, 0.3)}>
            <rect x={110 + i * 88} y={-13} width={62} height={38} rx={19} fill={C.panel} stroke={C.hueso} strokeOpacity={0.7} strokeWidth={4} />
            <rect x={110 + i * 88} y={-13} width={62} height={38} rx={19} fill="rgba(248,250,252,0.08)" />
          </g>
        ))}
      {[-34, 6, 46].map((dy, i) => (
        <g key={i} opacity={prog(t, t0 + 1.2 + i * 0.08, 0.3)}>
          <path d={`M 560,6 C 590,6 600,${dy} 620,${dy}`} fill="none" stroke={C.amarillo} strokeWidth={5} strokeLinecap="round" />
          <circle cx={628} cy={dy} r={10} fill={C.amarillo} />
        </g>
      ))}
      <g transform={`scale(${0.85 + 0.15 * Math.min(1.1, k)})`} opacity={k}>
        <circle r={32} fill={C.panel} stroke={C.amarillo} strokeWidth={6} />
        <circle r={32} fill="rgba(250,204,21,0.22)" />
        <circle r={11} fill={C.hueso} opacity={0.65} />
      </g>
      {impulso !== undefined && <Impulso d={EJE_NEURONA} t0={impulso} dur={1.4} periodo={2.0} ancho={9} />}
    </g>
  );
};
