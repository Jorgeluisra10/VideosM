import React from "react";
import { C, FUENTE } from "../../lib/colores";
import { prog, useT } from "../../lib/anim";

/** Posición (fracción 0–1 del ancho) de cada proteína: receptores primero, canales después, bomba al final. */
export function fraccionesMembrana(
  receptores: number,
  canales: number,
  bomba: boolean,
): { receptores: number[]; canales: number[]; bomba: number | null } {
  const total = receptores + canales;
  const hasta = bomba ? 0.8 : 1;
  const f = (i: number) => 0.05 + (hasta - 0.1) * ((i + 0.5) / Math.max(1, total));
  return {
    receptores: Array.from({ length: receptores }, (_, i) => f(i)),
    canales: Array.from({ length: canales }, (_, j) => f(receptores + j)),
    bomba: bomba ? 0.9 : null,
  };
}

type Props = {
  x: number;
  y: number;
  /** ancho en px */
  ancho: number;
  t0: number;
  receptores?: number;
  canales?: number;
  bomba?: boolean;
  ladoSuperior?: string | null;
  ladoInferior?: string | null;
  color?: string;
};

/** Bicapa lipídica con receptores (arriba), canales iónicos y bomba. Centro = (x, y). */
export const Membrana: React.FC<Props> = ({ x, y, ancho, t0, receptores = 0, canales = 0, bomba = false, ladoSuperior, ladoInferior, color = C.azul }) => {
  const t = useT();
  const k = prog(t, t0, 0.6);
  if (k <= 0.001) return null;
  const n = Math.max(8, Math.floor(ancho / 24));
  const paso = ancho / n;
  const fr = fraccionesMembrana(receptores, canales, bomba);
  const cabezas: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const cx = -ancho / 2 + paso * (i + 0.5);
    cabezas.push(
      <g key={i}>
        <line x1={cx - 4} y1={-16} x2={cx - 4} y2={-2} stroke={C.hueso} strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" />
        <line x1={cx + 4} y1={-16} x2={cx + 4} y2={-2} stroke={C.hueso} strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" />
        <line x1={cx - 4} y1={16} x2={cx - 4} y2={2} stroke={C.hueso} strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" />
        <line x1={cx + 4} y1={16} x2={cx + 4} y2={2} stroke={C.hueso} strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={-24} r={9.5} fill={C.panel} stroke={color} strokeWidth={4} />
        <circle cx={cx} cy={24} r={9.5} fill={C.panel} stroke={color} strokeWidth={4} />
      </g>,
    );
  }
  const px = (f: number) => -ancho / 2 + ancho * f;
  return (
    <g transform={`translate(${x} ${y})`} opacity={k}>
      {cabezas}
      {fr.receptores.map((f, i) => (
        <g key={`r${i}`} transform={`translate(${px(f)} -34)`} opacity={prog(t, t0 + 0.4 + i * 0.1, 0.3)}>
          <path d="M 0,0 L 0,-30 M 0,-30 L -15,-52 M 0,-30 L 15,-52" fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={-15} cy={-55} r={6} fill={color} />
          <circle cx={15} cy={-55} r={6} fill={color} />
        </g>
      ))}
      {fr.canales.map((f, j) => (
        <g key={`c${j}`} transform={`translate(${px(f)} 0)`} opacity={prog(t, t0 + 0.4 + (receptores + j) * 0.1, 0.3)}>
          <rect x={-24} y={-40} width={17} height={80} rx={7} fill={C.panel} stroke={color} strokeWidth={5} />
          <rect x={7} y={-40} width={17} height={80} rx={7} fill={C.panel} stroke={color} strokeWidth={5} />
        </g>
      ))}
      {fr.bomba !== null && (
        <g transform={`translate(${px(fr.bomba)} 0)`} opacity={prog(t, t0 + 0.9, 0.3)}>
          <rect x={-30} y={-42} width={60} height={84} rx={14} fill="rgba(250,204,21,0.14)" stroke={C.amarillo} strokeWidth={5} />
          <path d="M -12,-8 L 12,-8 M -12,8 L 12,8" stroke={C.amarillo} strokeWidth={4} strokeLinecap="round" />
        </g>
      )}
      {ladoSuperior && (
        <text data-texto="membrana" x={-ancho / 2} y={-92} fontFamily={FUENTE} fontWeight={700} fontSize={30} fill={C.hueso} fillOpacity={0.75} stroke={C.fondo} strokeWidth={6} paintOrder="stroke">
          {ladoSuperior}
        </text>
      )}
      {ladoInferior && (
        <text data-texto="membrana" x={-ancho / 2} y={78} fontFamily={FUENTE} fontWeight={700} fontSize={30} fill={C.hueso} fillOpacity={0.75} stroke={C.fondo} strokeWidth={6} paintOrder="stroke">
          {ladoInferior}
        </text>
      )}
    </g>
  );
};
