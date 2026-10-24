/**
 * Una escena del motor viral: fondo animado + plantilla + zoom lento de cámara + barra de progreso + transición de barrido diagonal.
 * El fotograma 0 es el inicio de la escena (va dentro de un <Sequence>); la escena anterior sigue visible 0,3 s por debajo mientras entra el barrido.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { temaViral, type EscenaViralGuardada } from "../anim/viral";
import { ViralCtx, FPS, H, W, clamp, easeInOut, lerp } from "./comun";
import { FondoViral } from "./fondos";
import { FondoEscenario } from "./escenarios";
import { Capas, FichaCita, Mira, Zoom } from "./ciencia1";
import { Impacto, Red, Split, Termo } from "./ciencia2";
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
    case "ZOOM": return e.zoom ? <Zoom e={e} /> : <Hook e={e} />;
    case "CAPAS": return e.capas ? <Capas e={e} /> : <Hook e={e} />;
    case "MIRA": return e.mira ? <Mira e={e} /> : <Hook e={e} />;
    case "IMPACTO": return e.impacto ? <Impacto e={e} /> : <Hook e={e} />;
    case "RED": return e.red ? <Red e={e} /> : <Hook e={e} />;
    case "TERMO": return e.termo ? <Termo e={e} /> : <Hook e={e} />;
    case "SPLIT": return e.vs ? <Split e={e} /> : <Hook e={e} />;
    case "CTA": return <Cta e={e} />;
    default: return <Hook e={e} />;
  }
};

/** Duración (s) del barrido de entrada (y del zoom continuo entre escenas). */
const SEG_BARRIDO = 0.3;

export const EscenaViral: React.FC<{ escena: EscenaViralGuardada; paleta: string; primera: boolean }> = ({ escena, paleta, primera }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const T = useMemo(() => temaViral(paleta, escena.bg), [paleta, escena.bg]);
  const marca = paleta === "imnoba" || paleta === "retro-imnoba";
  const entraZoom = !primera && escena.tr === "zoom";
  const saleZoom = escena.trs === "zoom" && t > escena.dur;
  // la cámara del viaje de escala ya hace su propio zoom: la deriva lenta solo se aplica al resto de plantillas
  const zoomLento = escena.t === "ZOOM" ? 1 : 1 + 0.045 * clamp(t / escena.dur);
  const k = primera ? 1 : easeInOut(t / SEG_BARRIDO);
  const X = k * 122;
  const clip = primera || k >= 1 ? undefined : entraZoom ? `circle(${k * 1300}px at 50% 50%)` : `polygon(0 0, ${X}% 0, ${X - 16}% 100%, 0 100%)`;
  // zoom continuo: la escena entrante «llega» desde lejos y la saliente se lanza hacia la cámara
  const escalaTransicion = entraZoom && k < 1 ? lerp(0.55, 1, k) : saleZoom ? 1 + 0.9 * easeInOut((t - escena.dur) / SEG_BARRIDO) : 1;
  const progreso = clamp((escena.inicio + t) / Math.max(1, escena.total));
  return (
    <ViralCtx.Provider value={{ T, ritmo: escena.ritmo, dur: escena.dur, paleta, marca }}>
      <AbsoluteFill style={{ clipPath: clip, backgroundColor: T.bg1 }}>
        <AbsoluteFill style={{ transform: escalaTransicion !== 1 ? `scale(${escalaTransicion})` : undefined, transformOrigin: "50% 50%" }}>
          {escena.sc ? <FondoEscenario sc={escena.sc} /> : <FondoViral bg={escena.bg} />}
          <AbsoluteFill style={{ transform: `scale(${zoomLento})`, transformOrigin: "50% 48%" }}>
            <Plantilla e={escena} />
            {escena.cita && <FichaCita cita={escena.cita} />}
          </AbsoluteFill>
        </AbsoluteFill>
        <div style={{ position: "absolute", left: 120, top: 78, width: W - 240, height: 8, borderRadius: 4, background: T.oscuro ? "rgba(255,255,255,0.18)" : "rgba(2,34,78,0.16)" }}>
          <div style={{ width: `${progreso * 100}%`, height: "100%", borderRadius: 4, background: T.acento }} />
        </div>
      </AbsoluteFill>
      {!primera && k < 1 && !entraZoom && (
        <div style={{ position: "absolute", top: -40, left: `${X - 16}%`, width: 70, height: H + 80, background: T.acento, transform: "skewX(-9deg)", opacity: 0.95 }} />
      )}
    </ViralCtx.Provider>
  );
};
