import React from "react";
import { C } from "../../lib/colores";
import { onda, pop, prog, useT } from "../../lib/anim";
import { tiempoDe } from "../../lib/voz";
import { Brazo } from "../../components/anatomia/Cuerpo";
import { Corazon } from "../../components/anatomia/Corazon";
import { Aros, Etiqueta, Flecha, Halo, Impulso, RayosDolor, Rotulo } from "../../components/svg/primitivas";
import type { EscenaProps } from "../tipos";

const CORAZON = { x: 268, y: 1010, e: 0.64 };
const BRAZO = { x: 790, y: 700, e: 0.72 };
const SENAL = "M 392,930 C 480,812 620,774 792,836";

/** 31–36,6 s · "Eso es el dolor referido: el corazón sufre, pero el brazo avisa." */
export const Cierre: React.FC<EscenaProps> = ({ ini }) => {
  const t = useT();
  const T = {
    dolor: tiempoDe("dolor referido"),
    referido: tiempoDe("referido"),
    corazon: tiempoDe("corazón", 2),
    sufre: tiempoDe("sufre"),
    brazo: tiempoDe("brazo", 4),
    avisa: tiempoDe("avisa"),
  };
  const insignia = pop(t, T.avisa);

  return (
    <g>
      <Halo x={CORAZON.x} y={CORAZON.y} r={300} color="rojo" opacidad={0.5 * prog(t, T.corazon, 0.5)} />
      <Halo x={BRAZO.x + 60} y={BRAZO.y + 220} r={300} color="rojo" opacidad={0.5 * prog(t, T.brazo, 0.5)} />

      {/* Título de cierre */}
      <Rotulo x={540} y={500} texto="DOLOR" t0={T.dolor} tam={136} color={C.hueso} />
      <Rotulo x={540} y={628} texto="REFERIDO" t0={T.referido} tam={136} color={C.amarillo} />

      {/* Corazón (causa) y brazo (síntoma) */}
      <Corazon x={CORAZON.x} y={CORAZON.y} escala={CORAZON.e} t0={ini - 0.12} bpm={92} vasos={false} coronarias={ini + 0.1} dolor={{ t: T.corazon, intensidad: 0.9 }} tinte="rgba(239,68,68,0.28)" />
      <Brazo x={BRAZO.x} y={BRAZO.y} escala={BRAZO.e} t0={ini - 0.18} dur={0.7} dolor={{ t: T.brazo, dur: 0.7, rayos: true }} />

      {/* La señal "referida" del corazón al brazo */}
      <Flecha d={SENAL} color={C.rojo} ancho={9} t0={T.referido + 0.2} dur={1.0} cabeza={30} brillo={0.9} punteado="14 12" />
      <Impulso d={SENAL} t0={T.sufre} dur={1.1} periodo={1.5} color={C.rojo} ancho={9} />

      {/* Insignia de aviso en el brazo */}
      {insignia > 0.02 && (
        <g transform={`translate(938 716) scale(${Math.min(1.15, insignia)})`} opacity={Math.min(1, insignia)}>
          <circle r={50} fill={C.rojo} opacity={0.25 + 0.2 * onda(t, 0.5)} transform="scale(1.35)" />
          <circle r={44} fill={C.rojo} stroke={C.hueso} strokeWidth={5} />
          <text data-texto="insignia" textAnchor="middle" y={26} fontFamily="Inter, sans-serif" fontWeight={900} fontSize={76} fill={C.hueso}>
            !
          </text>
        </g>
      )}
      <Aros x={BRAZO.x + 60} y={BRAZO.y + 150} color={C.rojo} r0={50} r1={190} n={2} periodo={1.1} t0={T.avisa} t1={T.avisa + 3} ancho={5} />

      {/* Etiquetas */}
      <Etiqueta x={268} y={1240} texto={["El corazón", "sufre"]} t0={T.sufre} color={C.rojo} tam={36} guia={{ x: CORAZON.x, y: CORAZON.y + 120 }} />
      <Etiqueta x={800} y={1240} texto={["El brazo", "avisa"]} t0={T.avisa} color={C.rojo} tam={36} guia={{ x: BRAZO.x + 40, y: BRAZO.y + 335 }} />
    </g>
  );
};
