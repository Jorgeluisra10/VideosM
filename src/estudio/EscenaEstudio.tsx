/**
 * Una escena del motor de estudio: fondo de estudio con bokeh + layout (HERO_CENTER, VERSUS_50_50, DIAGONAL_SPLIT o SURFACE_STAGE) + titular.
 * El fotograma 0 es el inicio de la escena (va dentro de un <Sequence>). MODO: 3D añade una órbita suave en perspectiva.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { coloresEstudio, type EscenaEstudioGuardada } from "../anim/estudio";
import { EstudioCtx, StudioBackground } from "./efectos";
import { LayoutEstudio, Titular } from "./layouts";

export const EscenaEstudio: React.FC<{ escena: EscenaEstudioGuardada; paleta: string }> = ({ escena, paleta }) => {
  const f = useCurrentFrame();
  const colores = useMemo(() => coloresEstudio(paleta), [paleta]);
  const orbita = escena.es3D ? { transform: `perspective(1900px) rotateY(${5.5 * Math.sin(f / 110)}deg) rotateX(${2.5 * Math.sin(f / 140 + 1)}deg) scale(1.08)`, transformOrigin: "50% 55%" } : undefined;
  return (
    <EstudioCtx.Provider value={colores}>
      <AbsoluteFill style={{ backgroundColor: colores.fondo }}>
        {escena.layout !== "DIAGONAL_SPLIT" && <StudioBackground />}
        <AbsoluteFill style={orbita}>
          <LayoutEstudio e={escena} />
          <Titular texto={escena.headline.text} destacada={escena.headline.highlightWord} />
        </AbsoluteFill>
      </AbsoluteFill>
    </EstudioCtx.Provider>
  );
};
