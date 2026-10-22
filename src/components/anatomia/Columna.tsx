import React from "react";
import { Easing } from "remotion";
import { C, FUENTE } from "../../lib/colores";
import { lerp, onda, prog, useT } from "../../lib/anim";
import { Halo, Pieza, Trazo } from "../svg/primitivas";

/** Vista posterior de la columna dorsal: vértebras a los lados y la médula visible al centro. */
export const COL = {
  cx: 430,
  y0: 500,
  paso: 82,
  etiquetas: ["C7", "T1", "T2", "T3", "T4", "T5", "T6", "T7"],
} as const;

export const yNivel = (i: number): number => COL.y0 + i * COL.paso;
/** Cadena simpática: fila de ganglios paralela a la columna, a su derecha. */
export const CADENA_X = COL.cx + 205;
/** Altura de la raíz nerviosa que sale justo debajo de la vértebra i. */
export const yRaiz = (i: number): number => yNivel(i) + 41;
/** Raíz derecha (cordón → cadena simpática) y su sentido inverso (cadena → cordón), mismo trazado. */
export const raizDerecha = (i: number): string =>
  `M ${COL.cx + 30},${yRaiz(i)} C ${COL.cx + 90},${yRaiz(i)} ${COL.cx + 150},${yRaiz(i) + 6} ${CADENA_X},${yRaiz(i)}`;
export const raizHaciaCordon = (i: number): string =>
  `M ${CADENA_X},${yRaiz(i)} C ${COL.cx + 150},${yRaiz(i) + 6} ${COL.cx + 90},${yRaiz(i)} ${COL.cx + 30},${yRaiz(i)}`;

const TOP = yNivel(0) - 58;
const BOT = yNivel(COL.etiquetas.length - 1) + 58;

const capsula = (cx: number, top: number, bot: number, r: number) =>
  `M ${cx - r},${top + r} A ${r} ${r} 0 0 1 ${cx + r},${top + r} L ${cx + r},${bot - r} A ${r} ${r} 0 0 1 ${cx - r},${bot - r} Z`;

type Props = {
  t0: number;
  /** segundo en que se resalta cada nivel (índice de COL.etiquetas) */
  resaltado?: Record<number, number>;
  /** la médula brilla (pulsa) a partir de este segundo */
  brilloMedula?: number;
};

export const Columna: React.FC<Props> = ({ t0, resaltado = {}, brilloMedula }) => {
  const t = useT();
  const { cx } = COL;
  const n = COL.etiquetas.length;
  const brillo = brilloMedula === undefined ? 0 : prog(t, brilloMedula, 0.5);

  return (
    <g>
      {/* Médula */}
      {brillo > 0.01 && <Halo x={cx} y={(TOP + BOT) / 2} r={430} color="amarillo" opacidad={0.28 * brillo + 0.1 * brillo * onda(t, 1.2)} />}
      <Pieza d={capsula(cx, TOP, BOT, 30)} relleno="rgba(250,204,21,0.13)" t0={t0} />
      <Trazo d={capsula(cx, TOP, BOT, 30)} color={C.amarillo} ancho={4} t0={t0} dur={1.0} opacidad={0.75} brillo={0.6 * brillo} />

      {/* Raíces nerviosas (finas, a ambos lados) */}
      {COL.etiquetas.map((_, i) => {
        const y = yRaiz(i);
        if (i === n - 1) return null;
        const res = resaltado[i] !== undefined ? prog(t, resaltado[i], 0.3) : 0;
        const op = lerp(0.32, 1, res);
        return (
          <g key={i}>
            <Trazo d={`M ${cx - 30},${y} C ${cx - 70},${y} ${cx - 110},${y + 6} ${cx - 170},${y + 14}`} color={C.amarillo} ancho={4} t0={t0 + 0.5 + i * 0.05} dur={0.4} opacidad={0.3} />
            <Trazo d={raizDerecha(i)} color={C.amarillo} ancho={4 + 3 * res} t0={t0 + 0.5 + i * 0.05} dur={0.5} opacidad={op} brillo={res * 0.8} />
          </g>
        );
      })}

      {/* Vértebras */}
      {COL.etiquetas.map((nombre, i) => {
        const y = yNivel(i);
        const ini = t0 + 0.08 * i;
        const k = prog(t, ini, 0.45, Easing.out(Easing.cubic));
        if (k <= 0.01) return null;
        const res = resaltado[i] !== undefined ? prog(t, resaltado[i], 0.3) : 0;
        const borde = res > 0.01 ? C.amarillo : "rgba(248,250,252,0.6)";
        const relleno = res > 0.01 ? `rgba(250,204,21,${0.12 + 0.12 * res})` : "rgba(248,250,252,0.06)";
        const lam = (x0: number, ancho: number, alto: number, dy = 0) => (
          <g>
            <rect x={x0} y={y - alto / 2 + dy} width={ancho} height={alto} rx={Math.min(20, alto / 2)} fill={C.panel} />
            <rect x={x0} y={y - alto / 2 + dy} width={ancho} height={alto} rx={Math.min(20, alto / 2)} fill={relleno} stroke={borde} strokeWidth={res > 0.01 ? 4 : 3} />
          </g>
        );
        return (
          <g key={nombre} opacity={k} transform={`translate(0 ${(1 - k) * -14})`}>
            {lam(cx - 112, 62, 52)}
            {lam(cx + 50, 62, 52)}
            {lam(cx - 162, 52, 20)}
            {lam(cx + 110, 52, 20)}
            <text
              data-texto="nivel"
              x={cx - 190}
              y={y + 11}
              textAnchor="end"
              fontFamily={FUENTE}
              fontWeight={res > 0.01 ? 900 : 700}
              fontSize={lerp(30, 40, res)}
              fill={res > 0.01 ? C.amarillo : "rgba(248,250,252,0.62)"}
              stroke={C.fondo}
              strokeWidth={6}
              paintOrder="stroke"
              strokeLinejoin="round"
            >
              {nombre}
            </text>
          </g>
        );
      })}
    </g>
  );
};
