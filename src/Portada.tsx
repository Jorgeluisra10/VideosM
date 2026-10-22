import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "./lib/colores";
import { tema } from "./tema";

/** Portada del tema activo (cada tema aporta la suya; si no, queda un fondo liso para no romper el render). */
export const Portada: React.FC = () => {
  const P = tema.Portada;
  return P ? <P /> : <AbsoluteFill style={{ backgroundColor: C.fondo }} />;
};
