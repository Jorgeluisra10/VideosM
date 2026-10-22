import React from "react";
import { PALABRAS } from "../lib/voz";
import { REGISTRO } from "./registro";
import { tiemposElemento } from "./tiempos";
import type { EscenaPlan } from "./tipos";
import { FondoEscenaCtx } from "./vidrio";

/**
 * Dibuja una escena de un plan: cada elemento aparece cuando la voz dice su frase ("cuando")
 * y puede desaparecer cuando dice otra ("hasta"). El orden del arreglo es el orden de capas.
 */
export const EscenaDinamica: React.FC<{ ini: number; fin: number; escena: EscenaPlan }> = ({ ini, fin, escena }) => (
  <FondoEscenaCtx.Provider value={{ fondo: escena.fondo ?? null, ini, fin }}>
    <g>
      {escena.elementos.map((el, i) => {
        const Comp = REGISTRO[el.tipo];
        if (!Comp) return null;
        const { t0, t1 } = tiemposElemento(el, ini, fin, PALABRAS);
        return <Comp key={`${escena.id}-${i}`} el={el} t0={t0} t1={t1} />;
      })}
    </g>
  </FondoEscenaCtx.Provider>
);
