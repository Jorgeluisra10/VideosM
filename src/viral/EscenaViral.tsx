/**
 * Una escena del motor viral: fondo animado + plantilla + zoom lento de cámara + barra de progreso + transición de barrido diagonal.
 * El fotograma 0 es el inicio de la escena (va dentro de un <Sequence>); la escena anterior sigue visible 0,3 s por debajo mientras entra el barrido.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { marcaDePaleta } from "../anim/marcas";
import { esDocumental, temaViral, type EscenaViralGuardada } from "../anim/viral";
import { ViralCtx, FPS, H, LineaCap, VARS_DOCUMENTAL, W, clamp, easeInOut, easeOut, lerp } from "./comun";
import { FondoViral } from "./fondos";
import { FondoEscenario } from "./escenarios";
import { Capas, FichaCita, Mira, Zoom } from "./ciencia1";
import { Impacto, Pila, Red, Split, Termo } from "./ciencia2";
import { Ciclo, Papel, Pilares, Punch } from "./documental1";
import { Cubo, Diales, Duo, Oscilo } from "./documental2";
import { Pieza } from "./piezas";
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
    case "PILA": return e.pila ? <Pila e={e} /> : <Hook e={e} />;
    case "PAPEL": return e.papel ? <Papel e={e} /> : <Hook e={e} />;
    case "PILARES": return e.pilares ? <Pilares e={e} /> : <Hook e={e} />;
    case "CICLO": return e.ciclo ? <Ciclo e={e} /> : <Hook e={e} />;
    case "PUNCH": return <Punch e={e} />;
    case "DUO": return e.duo ? <Duo e={e} /> : <Hook e={e} />;
    case "OSCILO": return e.osc ? <Oscilo e={e} /> : <Hook e={e} />;
    case "CUBO": return e.cubo ? <Cubo e={e} /> : <Hook e={e} />;
    case "DIALES": return e.diales ? <Diales e={e} /> : <Hook e={e} />;
    case "PIEZA": return <Pieza e={e} alternativa={<Hook e={e} />} />;
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
  const marcaId = marcaDePaleta(paleta).id;
  const marca = marcaId === "imnoba";
  // estilo documental (paletas Retro-Científica): fondo plano, titulares en Archivo Black, cortes secos y la ficha de papel que entra deslizándose
  const doc = esDocumental(paleta);
  const entraZoom = !primera && escena.tr === "zoom";
  const entraCorte = !primera && (escena.tr === "corte" || escena.tr === "semitono");
  const entraPapel = !primera && escena.tr === "papel";
  const saleZoom = escena.trs === "zoom" && t > escena.dur;
  // la cámara del viaje de escala ya hace su propio zoom: la deriva lenta solo se aplica al resto de plantillas
  // las piezas «anom-*», «real-*», «med-*», «par-*», «astro-*», «dscr-*», «tej-*» y «ein-*» son composiciones exactas (el cierre repite el primer fotograma): sin deriva de cámara
  const sinDeriva = escena.t === "ZOOM" || (escena.t === "PIEZA" && Boolean(escena.pieza?.id.startsWith("anom-") || escena.pieza?.id.startsWith("real-") || escena.pieza?.id.startsWith("med-") || escena.pieza?.id.startsWith("par-") || escena.pieza?.id.startsWith("astro-") || escena.pieza?.id.startsWith("dscr-") || escena.pieza?.id.startsWith("tej-") || escena.pieza?.id.startsWith("ein-") || escena.pieza?.id.startsWith("dig-") || escena.pieza?.id.startsWith("pte-") || escena.pieza?.id.startsWith("rui-") || escena.pieza?.id.startsWith("glf-")));
  const zoomLento = sinDeriva ? 1 : 1 + (doc ? 0.02 : 0.045) * clamp(t / escena.dur);
  const k = primera ? 1 : easeInOut(t / SEG_BARRIDO);
  const X = k * 122;
  const clip = primera || k >= 1 || entraCorte || entraPapel ? undefined : entraZoom ? `circle(${k * 1300}px at 50% 50%)` : `polygon(0 0, ${X}% 0, ${X - 16}% 100%, 0 100%)`;
  // zoom continuo: la escena entrante «llega» desde lejos y la saliente se lanza hacia la cámara
  const escalaTransicion = entraZoom && k < 1 ? lerp(0.55, 1, k) : saleZoom ? 1 + 0.9 * easeInOut((t - escena.dur) / SEG_BARRIDO) : 1;
  const desliza = entraPapel && k < 1 ? (1 - easeOut(t / SEG_BARRIDO)) * W : 0;
  const progreso = clamp((escena.inicio + t) / Math.max(1, escena.total));
  return (
    <ViralCtx.Provider value={{ T, ritmo: escena.ritmo, dur: escena.dur, paleta, marca, marcaId, doc }}>
      <AbsoluteFill style={{ clipPath: clip, backgroundColor: T.bg1, transform: desliza ? `translateX(${desliza}px)` : undefined, ...(doc ? VARS_DOCUMENTAL : {}) }}>
        <AbsoluteFill style={{ transform: escalaTransicion !== 1 ? `scale(${escalaTransicion})` : undefined, transformOrigin: "50% 50%" }}>
          {escena.sc ? <FondoEscenario sc={escena.sc} /> : <FondoViral bg={escena.bg} />}
          <AbsoluteFill style={{ transform: `scale(${zoomLento})`, transformOrigin: "50% 48%" }}>
            <Plantilla e={escena} />
            {escena.cap && escena.t === "HOOK" && <LineaCap texto={escena.cap} y={1500} px={32} delay={0.9} id="cap-hook" />}
            {escena.cita && <FichaCita cita={escena.cita} />}
          </AbsoluteFill>
        </AbsoluteFill>
        {!doc && (
          <div style={{ position: "absolute", left: 120, top: 78, width: W - 240, height: 8, borderRadius: 4, background: T.oscuro ? "rgba(255,255,255,0.18)" : "rgba(2,34,78,0.16)" }}>
            <div style={{ width: `${progreso * 100}%`, height: "100%", borderRadius: 4, background: T.acento }} />
          </div>
        )}
        {entraPapel && desliza > 0 && (
          <div style={{ position: "absolute", top: 0, left: -190, width: 190, height: H, backgroundImage: `radial-gradient(circle, ${T.bg0} 3.4px, transparent 4px)`, backgroundSize: "18px 18px", WebkitMaskImage: "linear-gradient(to right, transparent, #000)", maskImage: "linear-gradient(to right, transparent, #000)" }} />
        )}
      </AbsoluteFill>
      {!primera && k < 1 && !entraZoom && !entraCorte && !entraPapel && (
        <div style={{ position: "absolute", top: -40, left: `${X - 16}%`, width: 70, height: H + 80, background: T.acento, transform: "skewX(-9deg)", opacity: 0.95 }} />
      )}
    </ViralCtx.Provider>
  );
};
