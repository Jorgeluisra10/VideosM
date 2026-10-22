import React from "react";
import { C } from "../../lib/colores";
import { ventana, useT } from "../../lib/anim";

/** Un elemento del plan tal como llega de la IA (JSON); cada componente lee solo lo que necesita. */
export type El = Record<string, any>;
export type ElProps = {
  el: El;
  /** segundo (absoluto) en que aparece */
  t0: number;
  /** segundo (absoluto) en que desaparece; 9999 = dura toda la escena */
  t1: number;
};

export const COLORES: Record<string, string> = { rojo: C.rojo, azul: C.azul, amarillo: C.amarillo, hueso: C.hueso };
export const col = (n: unknown, def: keyof typeof COLORES = "hueso"): string => COLORES[String(n)] ?? COLORES[def];
export const claveColor = (n: unknown, def: "rojo" | "azul" | "amarillo" | "hueso" = "hueso"): "rojo" | "azul" | "amarillo" | "hueso" =>
  (["rojo", "azul", "amarillo", "hueso"].includes(String(n)) ? String(n) : def) as "rojo" | "azul" | "amarillo" | "hueso";

export const num = (v: unknown, def: number, min = -Infinity, max = Infinity): number =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def;
export const bool = (v: unknown, def = false): boolean => (typeof v === "boolean" ? v : def);
export const texto = (v: unknown, def = ""): string => (typeof v === "string" ? v : def);
export const lineasDe = (v: unknown): string[] => texto(v).split(/\\n|\n/).filter((l, i, a) => l.length > 0 || a.length === 1);

/** Envoltura con fundido de entrada y de salida (en t1). */
export const Aparece: React.FC<{ t0: number; t1: number; fade?: number; children: React.ReactNode }> = ({ t0, t1, fade = 0.3, children }) => {
  const t = useT();
  const k = ventana(t, t0, t1, fade);
  if (k <= 0.005) return null;
  return <g opacity={k}>{children}</g>;
};
