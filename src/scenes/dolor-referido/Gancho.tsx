import React from "react";
import { C } from "../../lib/colores";
import { onda, prog, useT } from "../../lib/anim";
import { tiempoDe } from "../../lib/voz";
import { Busto } from "../../components/anatomia/Cuerpo";
import { Corazon } from "../../components/anatomia/Corazon";
import { Aros, Etiqueta, Halo, RayosDolor, Rotulo } from "../../components/svg/primitivas";
import type { EscenaProps } from "../tipos";

// Coordenadas del busto en el escenario
export const BX = 540;
export const BY = 835;
export const BE = 0.95;
const HX = BX + 44 * BE; // corazón en el pecho izquierdo del paciente (derecha de la pantalla)
const HY = BY - 36 * BE;

/** 0–4 s · "¿Por qué un infarto duele en el brazo izquierdo y no solo en el corazón?" */
export const Gancho: React.FC<EscenaProps> = () => {
  const t = useT();
  const tInfarto = tiempoDe("infarto");
  const tBrazo = tiempoDe("brazo");
  const tNoSolo = tiempoDe("no solo");
  const tCorazon = tiempoDe("corazón");

  const dudar = onda(t, 1.3);
  return (
    <g>
      <Halo x={HX} y={HY} r={260} color="rojo" opacidad={prog(t, tInfarto, 0.4) * 0.8} />

      <Busto x={BX} y={BY} escala={BE} t0={0.05} dolorBrazo={{ t: tBrazo }} />

      <Corazon
        x={HX}
        y={HY}
        escala={0.54}
        t0={0.35}
        bpm={74}
        coronarias={0.6}
        dolor={{ t: tInfarto, intensidad: 1 }}
      />

      {/* El brazo izquierdo (derecha de la pantalla) recibe rayos de dolor */}
      <RayosDolor x={BX + 262 * BE} y={BY - 40 * BE} r={86} n={9} t0={tBrazo + 0.25} largo={36} arco={[-60, 60]} />

      {/* Etiquetas */}
      <Etiqueta x={250} y={BY - 215} texto="Infarto" t0={tInfarto + 0.05} color={C.rojo} tam={36} guia={{ x: HX - 12, y: HY - 8 }} ancla="middle" />
      <Etiqueta x={820} y={BY + 402} texto={["Brazo", "izquierdo"]} t0={tBrazo + 0.05} color={C.rojo} tam={34} guia={{ x: BX + 262 * BE, y: BY + 150 * BE }} />

      {/* Signo de pregunta que "rebota" cuando se dice "no solo en el corazón" */}
      <Rotulo x={862} y={560} texto="?" t0={tNoSolo} tam={230} color={C.amarillo} rot={10 + 6 * (dudar - 0.5)} />
      <Aros x={HX} y={HY} color={C.amarillo} r0={30} r1={140} n={2} periodo={1.2} t0={tCorazon} t1={tCorazon + 1.4} ancho={4} />

    </g>
  );
};

