import React from "react";
import { Easing } from "remotion";
import { C } from "../../lib/colores";
import { latido, onda, pop, prog, useT } from "../../lib/anim";
import { enRuta } from "../../lib/ruta";
import { Aros, Flujo, Halo, Pieza, Trazo, Tubo } from "../svg/primitivas";

// Coordenadas locales: el corazón ocupa ~ x∈[-180,180], y∈[-230,230]; ápex abajo a la derecha
// (a la izquierda del paciente), como en una vista anterior.
export const CORAZON = {
  cuerpo:
    "M -128,-92 C -165,-60 -172,10 -140,70 C -110,125 -50,175 5,212 C 30,228 58,226 78,206 C 118,168 168,98 176,24 C 182,-40 150,-92 100,-108 C 60,-120 40,-98 10,-104 C -30,-112 -60,-122 -90,-112 C -105,-107 -118,-100 -128,-92 Z",
  auriculaIzq: "M 96,-108 C 138,-130 182,-104 170,-58 C 150,-66 122,-78 96,-108 Z",
  auriculaDer: "M -126,-92 C -168,-122 -128,-158 -86,-136 C -62,-124 -62,-112 -74,-104 Z",
  surco: "M 10,-102 C 24,-30 32,60 56,140 C 64,168 70,190 76,208",
  // Arteria coronaria descendente anterior (DA): la que más se obstruye
  da: "M 22,-100 C 30,-30 22,50 46,128 C 56,160 66,188 74,210",
  daConAorta: "M 9,-143 C 12,-125 18,-112 22,-100 C 30,-30 22,50 46,128 C 56,160 66,188 74,210",
  circunfleja: "M 22,-100 C 78,-98 136,-70 162,-12",
  coronariaDer: "M -8,-104 C -70,-100 -124,-62 -140,8 C -146,60 -122,112 -78,142",
  ramaDA1: "M 28,-8 C 62,-4 100,12 124,52",
  ramaDA2: "M 38,62 C 74,72 104,96 114,128",
  aorta: "M 6,-100 C 6,-160 20,-210 76,-222 C 128,-230 168,-190 166,-132",
  pulmonar: "M -34,-108 C -40,-150 -10,-176 40,-168",
  cavaSup: "M -98,-120 C -104,-165 -104,-205 -98,-240",
  // Territorio de la DA: pared anterior del ventrículo izquierdo y ápex
  zonaIsquemica:
    "M 32,-70 C 60,-52 140,-30 168,26 C 160,100 118,170 78,206 C 58,200 48,150 42,118 C 36,70 30,0 32,-70 Z",
  trombo:
    "M -12,-14 C 0,-26 22,-22 30,-8 C 42,2 38,22 24,28 C 12,38 -8,32 -12,18 C -22,8 -20,-6 -12,-14 Z",
};

/** Dónde se aloja el coágulo (coordenadas locales) y en qué fracción u de la ruta de flujo queda. */
export const PUNTO_TROMBO = enRuta(CORAZON.da, 0.3);
export const U_TROMBO = (() => {
  let mejor = 0;
  let dmin = Infinity;
  for (let i = 0; i <= 600; i++) {
    const u = i / 600;
    const p = enRuta(CORAZON.daConAorta, u);
    const d = Math.hypot(p.x - PUNTO_TROMBO.x, p.y - PUNTO_TROMBO.y);
    if (d < dmin) {
      dmin = d;
      mejor = u;
    }
  }
  return mejor;
})();

type Props = {
  x: number;
  y: number;
  escala?: number;
  /** aparece (fundido) */
  t0: number;
  /** latidos por minuto; 0 = quieto */
  bpm?: number;
  /** cuándo empiezan a dibujarse las coronarias */
  coronarias?: number;
  /** muestra aorta, pulmonar y vena cava */
  vasos?: boolean;
  /** el músculo aguas abajo del trombo se apaga entre t y t+dur */
  isquemia?: { t: number; dur: number };
  /** aparece un coágulo en la DA */
  trombo?: { t: number; fin?: number };
  /** intensidad de dolor 0..1 (halo rojo + anillos) */
  dolor?: { t: number; fin?: number; intensidad?: number };
  /** partículas de sangre por la aorta/DA, atascándose en el trombo */
  flujo?: { t0: number; t1?: number };
  tinte?: string;
  /** opacidad global */
  opacidad?: number;
  /** aparece más tarde: desde cuándo la coronaria DA se resalta con brillo */
  resaltarDA?: number;
};

export const Corazon: React.FC<Props> = ({
  x,
  y,
  escala = 1,
  t0,
  bpm = 72,
  coronarias,
  vasos = true,
  isquemia,
  trombo,
  dolor,
  flujo,
  tinte = "rgba(239,68,68,0.20)",
  opacidad = 1,
  resaltarDA,
}) => {
  const t = useT();
  const entra = prog(t, t0, 0.55, Easing.out(Easing.cubic));
  if (entra <= 0.001) return null;
  const b = bpm > 0 ? latido(t, bpm, t0 + 0.4) : 0;
  const dolorK = dolor ? prog(t, dolor.t, 0.35) * (dolor.fin ? 1 - prog(t, dolor.fin, 0.4) : 1) * (dolor.intensidad ?? 1) : 0;
  const esc = escala * (0.9 + 0.1 * entra) * (1 + 0.045 * b + dolorK * 0.015 * Math.sin(t * 34));
  const tCor = coronarias ?? t0 + 0.5;
  const isq = isquemia ? prog(t, isquemia.t, isquemia.dur, Easing.inOut(Easing.quad)) : 0;
  const posTrombo = PUNTO_TROMBO;
  const trK = trombo ? pop(t, trombo.t) * (trombo.fin ? 1 - prog(t, trombo.fin, 0.3) : 1) : 0;

  return (
    <g opacity={entra * opacidad}>
      {dolorK > 0.01 && <Halo x={x} y={y} r={300 * escala} color="rojo" opacidad={0.55 * dolorK + 0.15 * dolorK * onda(t, 0.5)} />}
      <g transform={`translate(${x} ${y}) scale(${esc})`}>
        {/* Grandes vasos (detrás del corazón) */}
        {vasos && (
          <>
            <Tubo d={CORAZON.cavaSup} ancho={34} borde={C.azul} relleno="#13264a" t0={t0 + 0.1} dur={0.7} grosorBorde={5} />
            <Tubo d={CORAZON.aorta} ancho={44} borde={C.rojo} relleno="#3a1620" t0={t0 + 0.1} dur={0.8} grosorBorde={5} />
            <Tubo d={CORAZON.pulmonar} ancho={38} borde={C.azul} relleno="#13264a" t0={t0 + 0.2} dur={0.6} grosorBorde={5} />
          </>
        )}

        {/* Cuerpo del corazón */}
        <Pieza d={CORAZON.auriculaDer} relleno="rgba(239,68,68,0.12)" borde={C.hueso} anchoBorde={4} t0={t0} opacidad={0.9} />
        <Pieza d={CORAZON.auriculaIzq} relleno="rgba(239,68,68,0.12)" borde={C.hueso} anchoBorde={4} t0={t0} opacidad={0.9} />
        <path d={CORAZON.cuerpo} fill={C.panel} />
        <path d={CORAZON.cuerpo} fill={tinte} />
        <path d={CORAZON.cuerpo} fill="none" stroke={C.hueso} strokeWidth={5} strokeLinejoin="round" opacity={0.85} />
        <path d={CORAZON.surco} fill="none" stroke={C.hueso} strokeWidth={3} strokeLinecap="round" opacity={0.28} />

        {/* Músculo sin riego: se apaga y se vuelve gris azulado */}
        {isq > 0.01 && (
          <g>
            <path d={CORAZON.zonaIsquemica} fill="#475569" opacity={0.7 * isq} />
            <path d={CORAZON.zonaIsquemica} fill="none" stroke={C.hueso} strokeWidth={3} strokeDasharray="8 10" opacity={0.5 * isq} />
          </g>
        )}

        {/* Coronarias */}
        <Trazo d={CORAZON.coronariaDer} color={C.rojo} ancho={9} t0={tCor} dur={0.9} brillo={0.5} />
        <Trazo d={CORAZON.circunfleja} color={C.rojo} ancho={9} t0={tCor + 0.1} dur={0.8} brillo={0.5} />
        <Trazo d={CORAZON.ramaDA1} color={C.rojo} ancho={6} t0={tCor + 0.5} dur={0.5} />
        <Trazo d={CORAZON.ramaDA2} color={C.rojo} ancho={6} t0={tCor + 0.6} dur={0.5} />
        <Trazo d={CORAZON.da} color={C.rojo} ancho={11} t0={tCor} dur={1.0} brillo={resaltarDA !== undefined ? 0.4 + 0.6 * prog(t, resaltarDA, 0.3) : 0.5} />

        {flujo && (
          <Flujo
            d={CORAZON.daConAorta}
            color={C.rojo}
            n={11}
            velocidad={0.27}
            radio={7.5}
            t0={flujo.t0}
            t1={flujo.t1}
            bloqueo={trombo ? { t: trombo.t, tope: U_TROMBO - 0.035, hueco: 0.032 } : undefined}
          />
        )}

        {/* Trombo */}
        {trK > 0.01 && (
          <g transform={`translate(${posTrombo.x} ${posTrombo.y}) scale(${1.5 * trK}) translate(-10 -4)`}>
            <path d={CORAZON.trombo} fill="#7f1d1d" stroke={C.rojo} strokeWidth={3.5} strokeLinejoin="round" />
            <path d="M -6,-6 L 22,16 M 2,-12 L 26,8 M -10,6 L 14,24 M 8,-14 L 30,2" stroke="#fca5a5" strokeWidth={1.6} opacity={0.65} fill="none" />
          </g>
        )}
      </g>

      {dolorK > 0.01 && (
        <Aros x={x} y={y} color={C.rojo} r0={60 * escala} r1={250 * escala} n={3} periodo={1.1} t0={dolor!.t} t1={dolor!.fin} ancho={5} />
      )}
    </g>
  );
};

/** Posición (en coordenadas del video) de un punto del corazón dado en coordenadas locales. */
export const puntoCorazon = (x: number, y: number, escala: number, lx: number, ly: number) => ({
  x: x + lx * escala,
  y: y + ly * escala,
});

