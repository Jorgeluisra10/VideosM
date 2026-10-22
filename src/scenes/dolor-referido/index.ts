import info from "../../data/tema.json";
import { C } from "../../lib/colores";
import { tiempoDe } from "../../lib/voz";
import type { Tema } from "../tipos";
import { Cerebro } from "./Cerebro";
import { Cierre } from "./Cierre";
import { Convergencia } from "./Convergencia";
import { Gancho } from "./Gancho";
import { Isquemia } from "./Isquemia";
import { Medula } from "./Medula";
import { Oclusion } from "./Oclusion";
import { PortadaInfarto } from "./Portada";
import { D, sfx } from "./sonido";

export const tema: Tema = {
  id: info.id,
  etiqueta: info.etiqueta,
  escenas: [
    { id: "gancho", titulo: "¿Por qué duele el brazo?", acento: C.rojo, desde: 0, Componente: Gancho },
    { id: "oclusion", titulo: "1 · La arteria se tapa", acento: C.rojo, desde: D.oclusion, Componente: Oclusion },
    { id: "isquemia", titulo: "2 · El músculo pide auxilio", acento: C.amarillo, desde: D.isquemia, Componente: Isquemia },
    { id: "medula", titulo: "3 · La señal sube a T1–T4", acento: C.amarillo, desde: D.medula, Componente: Medula },
    { id: "convergencia", titulo: "4 · Dos señales, una neurona", acento: C.amarillo, desde: D.convergencia, Componente: Convergencia },
    { id: "cerebro", titulo: "5 · El cerebro se confunde", acento: C.rojo, desde: D.cerebro, Componente: Cerebro },
    { id: "cierre", titulo: "En resumen", acento: C.rojo, desde: D.cierre, Componente: Cierre },
  ],
  sfx,
  impactos: [tiempoDe("infarto"), tiempoDe("bloquea"), tiempoDe("equivoca"), tiempoDe("proyecta")],
  fotogramaPortada: 2.6,
  Portada: PortadaInfarto,
};
