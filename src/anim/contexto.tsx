import React, { createContext, useContext } from "react";
import { color, paletaPorId, type Paleta, type TemaEscena } from "./paletas";

type Ctx = { paleta: Paleta; tema: TemaEscena };
const Contexto = createContext<Ctx>({ paleta: paletaPorId(undefined), tema: "oscuro" });

export const ProveedorColor: React.FC<{ paleta: string; tema: TemaEscena; children: React.ReactNode }> = ({ paleta, tema, children }) => (
  <Contexto.Provider value={{ paleta: paletaPorId(paleta), tema }}>{children}</Contexto.Provider>
);

/** token → hexadecimal según la paleta y el tema de la escena actual */
export const useColor = (): ((token: string) => string) => {
  const { paleta, tema } = useContext(Contexto);
  return (token) => color(paleta, token, tema);
};
export const useTema = (): Ctx => useContext(Contexto);
