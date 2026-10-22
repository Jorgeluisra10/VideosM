import React from "react";
import { AbsoluteFill } from "remotion";
import { C, ESCENARIO, H, W } from "../lib/colores";
import { azar, onda, useT } from "../lib/anim";
import { MARCA } from "../lib/marca";

/**
 * Fondo médico: #0B0F19, cuadrícula sutil (opacidad 0.05) que se desplaza despacio,
 * halo de color según la escena y motas flotantes para que nunca haya pantalla muerta.
 */
export const Fondo: React.FC<{ acento: string }> = ({ acento }) => {
  const t = useT();
  const desp = (t * 8) % 60;
  return (
    <AbsoluteFill style={{ backgroundColor: C.fondo }}>
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <pattern id="rejilla" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform={`translate(${desp} ${desp})`}>
            <path d="M 60 0 L 0 0 L 0 60" fill="none" stroke={C.hueso} strokeWidth="2" />
          </pattern>
          <radialGradient id="haloEscena" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor={acento} stopOpacity="0.26" />
            <stop offset="0.6" stopColor={acento} stopOpacity="0.06" />
            <stop offset="1" stopColor={acento} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="viñeta" cx="50%" cy="46%" r="75%">
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.55" />
          </radialGradient>
        </defs>
        <ellipse
          cx={W / 2 + Math.sin(t * 0.5) * 40}
          cy={ESCENARIO.y0 + ESCENARIO.alto / 2 + Math.cos(t * 0.4) * 30}
          rx={820}
          ry={760}
          fill="url(#haloEscena)"
          opacity={0.8 + 0.2 * onda(t, 4)}
        />
        <rect width={W} height={H} fill="url(#rejilla)" opacity={MARCA.fondo.rejilla} />
        {Array.from({ length: MARCA.fondo.particulas ? 26 : 0 }, (_, i) => {
          const vel = 10 + azar(i + 9) * 24;
          const y = (((azar(i + 40) * H - t * vel) % H) + H) % H;
          const x = azar(i + 1) * W + Math.sin(t * 0.6 + i) * 16;
          const r = 1.6 + azar(i + 70) * 3.2;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={r}
              fill={i % 3 === 0 ? acento : C.hueso}
              opacity={0.1 + 0.12 * onda(t, 2.5 + azar(i) * 2, azar(i + 5))}
            />
          );
        })}
        <rect width={W} height={H} fill="url(#viñeta)" />
      </svg>
    </AbsoluteFill>
  );
};
