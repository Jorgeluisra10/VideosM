import React from "react";
import plan from "../../data/plan.json";
import { C } from "../../lib/colores";
import { PALABRAS } from "../../lib/voz";
import { EscenaDinamica } from "../../dsl/EscenaDinamica";
import { FondoFoto } from "../../dsl/FondoFoto";
import { PortadaDinamica } from "../../dsl/PortadaDinamica";
import { COLORES } from "../../dsl/elementos/comun";
import { tiemposDePlan } from "../../dsl/tiempos";
import type { Plan } from "../../dsl/tipos";
import type { EscenaProps, Tema } from "../tipos";
import { impactosDePlan, sfx } from "./sonido";

/**
 * Tema "dinámico": se construye por completo a partir de src/data/plan.json,
 * que escribe la IA (scripts/ia/agente.mjs) o que puedes editar a mano.
 */
const P = plan as unknown as Plan;
const { inicios } = tiemposDePlan(P, PALABRAS);

export const tema: Tema = {
  id: P.proyecto.id,
  etiqueta: P.proyecto.etiqueta,
  escenas: P.escenas.map((e, i) => ({
    id: e.id,
    titulo: e.titulo,
    acento: COLORES[e.acento] ?? C.amarillo,
    desde: inicios[i],
    Componente: (props: EscenaProps) => <EscenaDinamica ini={props.ini} fin={props.fin} escena={e} />,
    Fondo: e.fondo?.foto ? (props: EscenaProps) => <FondoFoto fondo={e.fondo!} ini={props.ini} fin={props.fin} /> : undefined,
  })),
  sfx,
  impactos: impactosDePlan(),
  fotogramaPortada: P.portada.segundo,
  Portada: () => <PortadaDinamica plan={P} />,
};
