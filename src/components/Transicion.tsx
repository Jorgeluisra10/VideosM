import React from "react";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { fade } from "@remotion/transitions/fade";
import { flip } from "@remotion/transitions/flip";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import type { TransitionPresentation } from "@remotion/transitions";
import { H, W } from "../lib/colores";

/**
 * Transiciones entre escenas con @remotion/transitions, pero con el reloj ABSOLUTO del video
 * (no usamos <TransitionSeries>: las escenas se anclan a palabras, no a segundos fijos).
 * Cada presentación recibe el progreso 0→1 de la transición y la dirección (entra / sale).
 *
 * Se elige en la marca: src/data/marca.json → "transicion": "zoom" (por defecto, la de siempre) | "fade" | "slide" | "wipe" | "flip" | "reloj".
 */
export const TRANSICIONES = ["zoom", "fade", "slide", "wipe", "flip", "reloj"] as const;
export type TipoTransicion = (typeof TRANSICIONES)[number];

const PRESENTACIONES: Record<Exclude<TipoTransicion, "zoom">, TransitionPresentation<any>> = {
  fade: fade(),
  slide: slide({ direction: "from-right" }),
  wipe: wipe({ direction: "from-left" }),
  flip: flip({ direction: "from-right" }),
  reloj: clockWipe({ width: W, height: H }),
};

export const esTransicionExterna = (t: string | undefined): t is Exclude<TipoTransicion, "zoom"> => Boolean(t) && t !== "zoom" && t! in PRESENTACIONES;

export const Transicion: React.FC<{ tipo: Exclude<TipoTransicion, "zoom">; direccion: "entering" | "exiting"; progreso: number; children: React.ReactNode }> = ({ tipo, direccion, progreso, children }) => {
  const p = PRESENTACIONES[tipo];
  const Comp = p.component as React.ComponentType<any>;
  return (
    <Comp presentationProgress={Math.min(1, Math.max(0, progreso))} presentationDirection={direccion} presentationDurationInFrames={30} passedProps={p.props} onElementImage={() => {}} onUnmount={() => {}} bothEnteringAndExiting={false}>
      {children}
    </Comp>
  );
};
