import React from "react";
import { Easing } from "remotion";
import { C } from "../../lib/colores";
import { onda, prog, useT } from "../../lib/anim";
import { Halo } from "../svg/primitivas";

/** Punto del contorno y su normal exterior, para colocar receptores y canales sobre la membrana. */
function enContorno(forma: string, ang: number) {
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const rx = forma === "alargada" ? 230 : 160;
  const ry = forma === "alargada" ? 90 : 160;
  const x = rx * ca;
  const y = ry * sa;
  const nx = ca / rx;
  const ny = sa / ry;
  const l = Math.hypot(nx, ny) || 1;
  return { x, y, nx: nx / l, ny: ny / l, rot: (Math.atan2(ny / l, nx / l) * 180) / Math.PI + 90 };
}

const Receptor: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <path d="M 0,0 L 0,-26 M 0,-26 L -13,-44 M 0,-26 L 13,-44" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={-13} cy={-46} r={5} fill={color} />
    <circle cx={13} cy={-46} r={5} fill={color} />
  </g>
);

const Canal: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <rect x={-17} y={-18} width={13} height={36} rx={5} fill={C.panel} stroke={color} strokeWidth={4} />
    <rect x={4} y={-18} width={13} height={36} rx={5} fill={C.panel} stroke={color} strokeWidth={4} />
  </g>
);

type Props = {
  x: number;
  y: number;
  /** escala del dibujo (natural: radio 160 px, o 230×90 si es alargada) */
  escala: number;
  t0: number;
  forma?: "redonda" | "alargada" | "eritrocito";
  nucleo?: boolean;
  organelos?: boolean;
  receptores?: number;
  canales?: number;
  color?: string;
  /** halo de actividad (la célula "reacciona") desde este segundo */
  activa?: number;
};

export const Celula: React.FC<Props> = ({ x, y, escala, t0, forma = "redonda", nucleo = true, organelos = false, receptores = 0, canales = 0, color = C.azul, activa }) => {
  const t = useT();
  const k = prog(t, t0, 0.6, Easing.out(Easing.cubic));
  if (k <= 0.001) return null;
  const ak = activa === undefined ? 0 : prog(t, activa, 0.4);
  const contorno =
    forma === "alargada"
      ? "M -230,0 A 230 90 0 1 1 230,0 A 230 90 0 1 1 -230,0 Z"
      : "M 0,-158 C 96,-166 164,-84 158,6 C 152,98 84,164 -6,158 C -98,152 -164,84 -158,-6 C -152,-98 -84,-152 0,-158 Z";
  const total = receptores + canales;
  const marcas: React.ReactNode[] = [];
  for (let i = 0; i < total; i++) {
    const ang = -Math.PI / 2 + ((i + 0.5) / total) * Math.PI * 2;
    const p = enContorno(forma, ang);
    marcas.push(
      <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.rot})`} opacity={prog(t, t0 + 0.5 + i * 0.07, 0.3)}>
        {i < receptores ? <Receptor color={color} /> : <Canal color={color} />}
      </g>,
    );
  }
  const mitocondrias = forma === "alargada" ? [[-150, -26], [80, 24], [150, -20]] : [[-90, 60], [70, 70], [20, 100]];
  return (
    <g opacity={k}>
      {ak > 0.01 && <Halo x={x} y={y} r={escala * 260} color="amarillo" opacidad={0.55 * ak * (0.75 + 0.25 * onda(t, 0.8))} />}
      <g transform={`translate(${x} ${y}) scale(${escala * (0.9 + 0.1 * k)})`}>
        <path d={contorno} fill={C.panel} />
        <path d={contorno} fill={`${color}22`} stroke={color} strokeWidth={7} strokeLinejoin="round" />
        {forma === "eritrocito" && <ellipse rx={64} ry={64} fill={C.fondo} fillOpacity={0.35} stroke={color} strokeOpacity={0.5} strokeWidth={4} />}
        {nucleo && forma !== "eritrocito" && (
          <g transform={forma === "alargada" ? "translate(-30 0)" : "translate(14 -8)"}>
            <circle r={forma === "alargada" ? 50 : 62} fill="rgba(248,250,252,0.08)" stroke={C.hueso} strokeOpacity={0.65} strokeWidth={5} />
            <circle cx={12} cy={-8} r={14} fill={C.hueso} fillOpacity={0.4} />
          </g>
        )}
        {organelos &&
          mitocondrias.map(([mx, my], i) => (
            <g key={i} transform={`translate(${mx} ${my}) rotate(${i * 25})`}>
              <ellipse rx={30} ry={15} fill="rgba(250,204,21,0.14)" stroke={C.amarillo} strokeWidth={4} />
              <path d="M -16,-6 C -8,6 -4,-6 4,6 C 10,-6 14,4 18,-3" fill="none" stroke={C.amarillo} strokeWidth={3} opacity={0.8} />
            </g>
          ))}
        {marcas}
      </g>
    </g>
  );
};
