/**
 * Una escena del motor viral: fondo animado + plantilla + zoom lento de cámara + barra de progreso + transición de barrido diagonal.
 * El fotograma 0 es el inicio de la escena (va dentro de un <Sequence>); la escena anterior sigue visible 0,3 s por debajo mientras entra el barrido.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { temaViral, type EscenaViralGuardada } from "../anim/viral";
import { ViralCtx, FPS, H, W, clamp, easeInOut } from "./comun";
import { FondoViral } from "./fondos";
import { Cta, Hook, Num, Vs } from "./plantillas1";
import { Bars, Line, Lista, Steps } from "./plantillas2";
import { Ciudad, Ruta } from "./plantillas3";
import { Donut, Mito, Picto, Top } from "./plantillas4";

const Plantilla: React.FC<{ e: EscenaViralGuardada }> = ({ e }) => {
  switch (e.t) {
    case "NUM": return e.num ? <Num e={e} /> : <Hook e={e} />;
    case "VS": return e.vs ? <Vs e={e} /> : <Hook e={e} />;
    case "BARS": return <Bars e={e} />;
    case "LINE": return e.line ? <Line e={e} /> : <Hook e={e} />;
    case "STEPS": return <Steps e={e} />;
    case "LIST": return <Lista e={e} />;
    case "ROUTE": return <Ruta e={e} />;
    case "SKYLINE": return <Ciudad e={e} />;
    case "DONUT": return <Donut e={e} />;
    case "PICTO": return e.picto ? <Picto e={e} /> : <Hook e={e} />;
    case "TOP": return <Top e={e} />;
    case "MITO": return <Mito e={e} />;
    case "CTA": return <Cta e={e} />;
    default: return <Hook e={e} />;
  }
};

/** Duración (s) del barrido de entrada. */
const SEG_BARRIDO = 0.3;

export const EscenaViral: React.FC<{ escena: EscenaViralGuardada; paleta: string; primera: boolean }> = ({ escena, paleta, primera }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const T = useMemo(() => temaViral(paleta, escena.bg), [paleta, escena.bg]);
  const marca = paleta === "imnoba" || paleta === "retro-imnoba";
  const zoom = 1 + 0.045 * clamp(t / escena.dur);
  const barrido = primera ? 1 : easeInOut(t / SEG_BARRIDO);
  const X = barrido * 122;
  const clip = primera || barrido >= 1 ? undefined : `polygon(0 0, ${X}% 0, ${X - 16}% 100%, 0 100%)`;
  const progreso = clamp((escena.inicio + t) / Math.max(1, escena.total));
  return (
    <ViralCtx.Provider value={{ T, ritmo: escena.ritmo, dur: escena.dur, paleta, marca }}>
      <AbsoluteFill style={{ clipPath: clip, backgroundColor: T.bg1 }}>
        <FondoViral bg={escena.bg} />
        <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "50% 48%" }}>
          <Plantilla e={escena} />
        </AbsoluteFill>
        <div style={{ position: "absolute", left: 120, top: 78, width: W - 240, height: 8, borderRadius: 4, background: T.oscuro ? "rgba(255,255,255,0.18)" : "rgba(2,34,78,0.16)" }}>
          <div style={{ width: `${progreso * 100}%`, height: "100%", borderRadius: 4, background: T.acento }} />
        </div>
      </AbsoluteFill>
      {!primera && barrido < 1 && (
        <div style={{ position: "absolute", top: -40, left: `${X - 16}%`, width: 70, height: H + 80, background: T.acento, transform: "skewX(-9deg)", opacity: 0.95 }} />
      )}
    </ViralCtx.Provider>
  );
};
