/**
 * Fondos animados de las plantillas virales (nunca estáticos):
 *   dark   azul profundo con luces suaves que flotan, rejilla que avanza y un haz de luz diagonal
 *   gold   dorado de marca con campo de puntos halftone y anillos que respiran
 *   light  blanco con rejilla fina y manchas de color que derivan
 * Sin filtros de pantalla completa (degradados radiales): el render es rápido.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { azar } from "../lib/anim";
import { StudioSvgDefs } from "../estudio/efectos";
import { useUid } from "../estudio/util";
import { H, W, useViral } from "./comun";

const Luz: React.FC<{ cx: number; cy: number; r: number; color: string; op: number; id: string }> = ({ cx, cy, r, color, op, id }) => (
  <>
    <radialGradient id={id}><stop offset="0" stopColor={color} stopOpacity={op} /><stop offset="1" stopColor={color} stopOpacity={0} /></radialGradient>
    <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
  </>
);

export const FondoViral: React.FC<{ bg: "dark" | "gold" | "light" }> = ({ bg }) => {
  const f = useCurrentFrame();
  const { T } = useViral();
  const uid = useUid();
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <StudioSvgDefs />
        <defs>
          <radialGradient id={`${uid}bg`} cx="50%" cy="38%" r="85%"><stop offset="0" stopColor={T.bg0} /><stop offset="1" stopColor={T.bg1} /></radialGradient>
          <radialGradient id={`${uid}mk`} cx="100%" cy="100%" r="95%"><stop offset="0" stopColor="#fff" /><stop offset="0.7" stopColor="#fff" stopOpacity={0.25} /><stop offset="1" stopColor="#000" /></radialGradient>
          <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}><rect width={W} height={H} fill={`url(#${uid}mk)`} /></mask>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}bg)`} />
        {bg === "dark" && (
          <>
            {Array.from({ length: 7 }, (_, i) => (
              <Luz key={i} id={`${uid}l${i}`} cx={azar(i * 3.1 + 1) * W + 40 * Math.sin(f / 70 + i)} cy={azar(i * 5.3 + 2) * H + 34 * Math.sin(f / 90 + i * 1.7)} r={150 + azar(i + 9) * 220} color={i % 3 === 0 ? T.acento : T.acento2} op={i % 3 === 0 ? 0.16 : 0.2} />
            ))}
            {Array.from({ length: 22 }, (_, i) => <line key={`h${i}`} x1={0} x2={W} y1={((i * 96 + f * 0.6) % (H + 96)) - 48} y2={((i * 96 + f * 0.6) % (H + 96)) - 48} stroke="#fff" strokeOpacity={0.04} strokeWidth={2} />)}
            {Array.from({ length: 12 }, (_, i) => <line key={`v${i}`} y1={0} y2={H} x1={i * 96} x2={i * 96} stroke="#fff" strokeOpacity={0.03} strokeWidth={2} />)}
            <polygon points={`${W * 0.55 + 60 * Math.sin(f / 120)},0 ${W * 0.9 + 60 * Math.sin(f / 120)},0 ${W * 0.2},${H} ${-W * 0.15},${H}`} fill="#fff" opacity={0.035} />
          </>
        )}
        {bg === "gold" && (
          <>
            <rect width={W} height={H} fill="url(#halftone-dots-l)" mask={`url(#${uid}m)`} opacity={0.5} />
            {[0, 1, 2].map((i) => {
              const k = ((f / 150 + i / 3) % 1 + 1) % 1;
              return <circle key={i} cx={W * 0.82} cy={H * 0.16} r={120 + k * 760} fill="none" stroke={T.texto} strokeOpacity={(1 - k) * 0.16} strokeWidth={5} />;
            })}
            <Luz id={`${uid}g1`} cx={W * 0.15} cy={H * 0.78 + 30 * Math.sin(f / 80)} r={520} color="#fff" op={0.28} />
          </>
        )}
        {bg === "light" && (
          <>
            {Array.from({ length: 22 }, (_, i) => <line key={`h${i}`} x1={0} x2={W} y1={i * 96 + (f * 0.3) % 96} y2={i * 96 + (f * 0.3) % 96} stroke={T.texto} strokeOpacity={0.045} strokeWidth={2} />)}
            {Array.from({ length: 12 }, (_, i) => <line key={`v${i}`} y1={0} y2={H} x1={i * 96} x2={i * 96} stroke={T.texto} strokeOpacity={0.04} strokeWidth={2} />)}
            <Luz id={`${uid}a1`} cx={W * 0.9 + 40 * Math.sin(f / 90)} cy={H * 0.18} r={520} color={T.acento} op={0.3} />
            <Luz id={`${uid}a2`} cx={W * 0.05} cy={H * 0.72 + 40 * Math.sin(f / 100)} r={560} color={T.acento2} op={0.18} />
          </>
        )}
      </svg>
    </AbsoluteFill>
  );
};
