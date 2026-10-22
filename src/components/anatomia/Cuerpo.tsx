import React, { useId } from "react";
import { C } from "../../lib/colores";
import { onda, prog, useT } from "../../lib/anim";
import { Halo, Pieza, RayosDolor, Trazo, Tubo } from "../svg/primitivas";

const LINEA = "rgba(248,250,252,0.6)";
const RELLENO = "rgba(248,250,252,0.06)";

export const BRAZO = {
  /** Contorno cerrado: hombro redondeado, brazo más ancho, codo, antebrazo fino y mano con dedos. */
  contorno:
    "M -44,-6 C -36,60 -18,140 6,214 C 14,262 22,300 28,338 C 18,368 20,420 38,450 C 50,466 84,470 94,444 C 102,418 96,368 78,338 C 84,300 84,250 80,206 C 76,150 68,70 52,-6 C 54,-30 34,-44 4,-44 C -20,-44 -44,-30 -44,-6 Z",
  /** Línea central: sirve para barridos (el dolor "baja" por el brazo) */
  eje: "M 4,-20 C 12,60 34,130 46,200 C 52,260 54,300 53,338 L 56,440",
  dedos: "M 50,452 L 50,420 M 66,458 L 66,420 M 82,452 L 82,422",
  pulgar: "M 24,356 C 6,372 4,398 20,412",
  /** parche de piel de la cara interna del brazo (dermatomas T1–T2) */
  piel: "M -36,24 C -28,90 -10,150 10,214 L 32,206 C 14,150 0,90 -6,30 Z",
};

type BrazoProps = {
  x: number;
  y: number;
  escala?: number;
  /** espejo horizontal (brazo derecho del paciente = izquierda de la pantalla) */
  espejo?: boolean;
  t0: number;
  dur?: number;
  /** el dolor "recorre" el brazo entre t y t+dur */
  dolor?: { t: number; dur?: number; fin?: number; rayos?: boolean };
  /** resalta solo el parche de piel */
  piel?: { t: number; fin?: number; color?: string };
  opacidad?: number;
  rot?: number;
};

export const Brazo: React.FC<BrazoProps> = ({ x, y, escala = 1, espejo = false, t0, dur = 0.9, dolor, piel, opacidad = 1, rot = 0 }) => {
  const t = useT();
  const idClip = "cb" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const entra = prog(t, t0, 0.5);
  if (entra <= 0.001) return null;
  const dk = dolor ? prog(t, dolor.t, 0.4) * (dolor.fin ? 1 - prog(t, dolor.fin, 0.4) : 1) : 0;
  const pk = piel ? prog(t, piel.t, 0.4) * (piel.fin ? 1 - prog(t, piel.fin, 0.4) : 1) : 0;
  const sx = espejo ? -escala : escala;
  const durDolor = dolor?.dur ?? 0.7;
  return (
    <g opacity={opacidad * entra}>
      {dk > 0.01 && <Halo x={x + (espejo ? -1 : 1) * 40 * escala} y={y + 220 * escala} r={300 * escala} color="rojo" opacidad={0.6 * dk} />}
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sx} ${escala})`}>
        <defs>
          <clipPath id={idClip}>
            <path d={BRAZO.contorno} />
          </clipPath>
        </defs>
        <Pieza d={BRAZO.contorno} relleno={C.panel} t0={t0} dur={0.5} />
        <Pieza d={BRAZO.contorno} relleno={RELLENO} t0={t0} dur={0.5} />
        <Trazo d={BRAZO.contorno} color={LINEA} ancho={5} t0={t0} dur={dur} />
        <Trazo d={BRAZO.pulgar} color="rgba(248,250,252,0.45)" ancho={4} t0={t0 + dur * 0.8} dur={0.3} />
        <Trazo d={BRAZO.dedos} color="rgba(248,250,252,0.42)" ancho={3} t0={t0 + dur * 0.9} dur={0.3} />

        {piel && pk > 0.01 && (
          <g opacity={pk} clipPath={`url(#${idClip})`}>
            <path d={BRAZO.piel} fill={piel.color ?? C.rojo} opacity={0.5 + 0.25 * onda(t, 0.6)} />
            <path d={BRAZO.piel} fill="none" stroke={piel.color ?? C.rojo} strokeWidth={5} strokeLinejoin="round" />
          </g>
        )}

        {dolor && dk > 0.01 && (
          <g opacity={dk}>
            <g clipPath={`url(#${idClip})`}>
              <Trazo d={BRAZO.eje} color={C.rojo} ancho={140} t0={dolor.t} dur={durDolor} opacidad={0.3 + 0.12 * onda(t, 0.5)} />
            </g>
            <Trazo d={BRAZO.contorno} color={C.rojo} ancho={7} t0={dolor.t} dur={durDolor * 1.3} brillo={0.9} />
          </g>
        )}
      </g>
      {dolor?.rayos && dk > 0.01 && (
        <RayosDolor
          x={x + (espejo ? -1 : 1) * 60 * escala}
          y={y + 130 * escala}
          r={90 * escala}
          n={9}
          t0={dolor.t + 0.1}
          t1={dolor.fin}
          largo={34}
          arco={espejo ? [-70, 70] : [110, 250]}
        />
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Busto (vista frontal): cabeza, cuello, tórax y brazos
// ---------------------------------------------------------------------------
export const BUSTO = {
  cabeza:
    "M 0,-398 C 36,-398 58,-372 58,-336 C 58,-298 36,-266 0,-266 C -36,-266 -58,-298 -58,-336 C -58,-372 -36,-398 0,-398 Z",
  cuello: "M -24,-276 L 24,-276 C 24,-246 34,-230 58,-218 L -58,-218 C -34,-230 -24,-246 -24,-276 Z",
  torso:
    "M -34,-232 C -90,-218 -180,-205 -200,-160 C -214,-120 -196,-40 -186,40 C -180,120 -184,200 -186,262 L 186,262 C 184,200 180,120 186,40 C 196,-40 214,-120 200,-160 C 180,-205 90,-218 34,-232 C 20,-226 -20,-226 -34,-232 Z",
  hombroDer: { x: 196, y: -170 }, // hombro izquierdo del paciente (derecha en pantalla)
  hombroIzq: { x: -196, y: -170 },
};

export const Busto: React.FC<{
  x: number;
  y: number;
  escala?: number;
  t0: number;
  /** dolor en el brazo izquierdo del paciente (derecha de la pantalla) */
  dolorBrazo?: { t: number; fin?: number };
}> = ({ x, y, escala = 1, t0, dolorBrazo }) => {
  const t = useT();
  const respira = 1 + 0.006 * Math.sin(t * 2.2);
  return (
    <g>
      <g transform={`translate(${x} ${y}) scale(${escala * respira})`}>
        <defs>
          {/* el torso se desvanece hacia abajo como un busto, sin corte seco */}
          <linearGradient id="gBusto" gradientUnits="userSpaceOnUse" x1="0" y1="120" x2="0" y2="262">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id="mBusto" maskUnits="userSpaceOnUse" x="-320" y="-460" width="640" height="760">
            <rect x="-320" y="-460" width="640" height="760" fill="url(#gBusto)" />
          </mask>
        </defs>
        {/* brazos detrás del tórax */}
        <Brazo x={BUSTO.hombroIzq.x} y={BUSTO.hombroIzq.y} espejo t0={t0 + 0.25} />
        <Brazo
          x={BUSTO.hombroDer.x}
          y={BUSTO.hombroDer.y}
          t0={t0 + 0.25}
          dolor={dolorBrazo ? { t: dolorBrazo.t, dur: 0.8, fin: dolorBrazo.fin, rayos: false } : undefined}
        />
        <g mask="url(#mBusto)">
          <Pieza d={BUSTO.torso} relleno={C.panel} t0={t0} />
          <Pieza d={BUSTO.torso} relleno={RELLENO} t0={t0} />
          <Trazo d={BUSTO.torso} color={LINEA} ancho={5} t0={t0} dur={1.0} />
          <Trazo d="M -24,-206 C -70,-212 -120,-204 -168,-182" color="rgba(248,250,252,0.3)" ancho={4} t0={t0 + 0.7} dur={0.6} />
          <Trazo d="M 24,-206 C 70,-212 120,-204 168,-182" color="rgba(248,250,252,0.3)" ancho={4} t0={t0 + 0.7} dur={0.6} />
          <Trazo d="M 0,-196 L 0,-70" color="rgba(248,250,252,0.16)" ancho={4} t0={t0 + 0.9} dur={0.6} />
        </g>
        <Pieza d={BUSTO.cuello} relleno={C.panel} borde={LINEA} anchoBorde={4} t0={t0 + 0.1} />
        <Pieza d={BUSTO.cabeza} relleno={C.panel} borde={LINEA} anchoBorde={5} t0={t0 + 0.1} />
        <Pieza d={BUSTO.cabeza} relleno={RELLENO} t0={t0 + 0.1} />
      </g>
    </g>
  );
};
