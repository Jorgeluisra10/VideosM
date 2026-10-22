import React from "react";
import { ESCENARIO, W } from "../lib/colores";
import { Defs } from "./svg/primitivas";

/**
 * Lienzo SVG de la zona central (y: 350–1350). Las escenas dibujan con coordenadas
 * absolutas del video (x 0–1080, y 350–1350). Las orillas se difuminan para no chocar
 * con el encabezado ni con los subtítulos.
 */
export const Escenario: React.FC<{
  children: React.ReactNode;
  opacidad?: number;
  escala?: number;
  dx?: number;
  dy?: number;
}> = ({ children, opacidad = 1, escala = 1, dx = 0, dy = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: ESCENARIO.y0,
      width: W,
      height: ESCENARIO.alto,
      opacity: opacidad,
      transform: `translate(${dx}px, ${dy}px) scale(${escala})`,
      transformOrigin: "50% 50%",
      WebkitMaskImage:
        "linear-gradient(to bottom, transparent 0px, #000 46px, #000 954px, transparent 1000px)",
      maskImage: "linear-gradient(to bottom, transparent 0px, #000 46px, #000 954px, transparent 1000px)",
    }}
  >
    <svg width={W} height={ESCENARIO.alto} viewBox={`0 ${ESCENARIO.y0} ${W} ${ESCENARIO.alto}`}>
      <Defs />
      {children}
    </svg>
  </div>
);
