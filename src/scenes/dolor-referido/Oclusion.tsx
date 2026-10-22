import React from "react";
import { C } from "../../lib/colores";
import { onda, prog, useT } from "../../lib/anim";
import { tiempoDe } from "../../lib/voz";
import { Corazon, PUNTO_TROMBO, puntoCorazon } from "../../components/anatomia/Corazon";
import { Aros, Etiqueta, Halo } from "../../components/svg/primitivas";
import type { EscenaProps } from "../tipos";

const X = 540;
const Y = 860;
const E = 1.62;

/** 4,2–6,5 s · "Cuando una arteria coronaria se bloquea," */
export const Oclusion: React.FC<EscenaProps> = ({ ini }) => {
  const t = useT();
  const tArteria = tiempoDe("arteria");
  const tCoronaria = tiempoDe("coronaria");
  const tBloquea = tiempoDe("bloquea");

  const clot = puntoCorazon(X, Y, E, PUNTO_TROMBO.x, PUNTO_TROMBO.y);
  const rca = puntoCorazon(X, Y, E, -143, 14); // coronaria derecha (a la izquierda en pantalla)
  const alarma = prog(t, tBloquea, 0.3);

  return (
    <g>
      <Halo x={X} y={Y} r={470} color="rojo" opacidad={0.22 + 0.3 * alarma + 0.1 * alarma * onda(t, 0.45)} />

      <Corazon
        x={X}
        y={Y}
        escala={E}
        t0={ini - 0.12}
        bpm={72}
        coronarias={tArteria}
        resaltarDA={tCoronaria}
        flujo={{ t0: tArteria - 0.1 }}
        trombo={{ t: tBloquea }}
      />

      <Etiqueta
        x={270}
        y={560}
        texto={["Arteria", "coronaria"]}
        t0={tCoronaria}
        color={C.rojo}
        tam={38}
        guia={{ x: rca.x, y: rca.y }}
      />

      {/* El impacto del bloqueo */}
      <Aros x={clot.x} y={clot.y} color={C.rojo} r0={30} r1={200} n={3} periodo={0.9} t0={tBloquea} t1={tBloquea + 2.4} ancho={6} />
      <Etiqueta x={850} y={640} texto="Trombo" t0={tBloquea + 0.12} color={C.rojo} tam={44} guia={{ x: clot.x, y: clot.y }} />
      <Etiqueta x={800} y={1195} texto={["Flujo", "bloqueado"]} t0={tBloquea + 0.5} color={C.rojo} tam={36} guia={{ x: puntoCorazon(X, Y, E, 52, 140).x, y: puntoCorazon(X, Y, E, 52, 140).y }} />
    </g>
  );
};
