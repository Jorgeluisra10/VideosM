/**
 * Registro de piezas a medida (carril B): id → componente. El motor las dibuja cuando una escena es de tipo PIEZA.
 * Para añadir una pieza nueva: (1) su ficha pura en src/anim/piezas.ts (duración ideal, fondo, sonido), (2) su componente aquí.
 */
import React from "react";
import type { EscenaViralGuardada } from "../../anim/viral";
import { MetroFriccion, MetroPlano, MetroRieles } from "./metro1";
import { MetroCapacidad, MetroCarrera } from "./metro2";
import { MetroCurva, MetroSuelo } from "./metro3";
import { MetroBalanza, MetroSilueta } from "./metro4";
import { AnomCierre, AnomDisco } from "./anom1";
import { AnomContinente, AnomFriccion } from "./anom2";
import { AnomCarrera, AnomVertical } from "./anom3";
import { AnomEscala, AnomSuelo } from "./anom4";
import { AnomCompresion, AnomLaboratorio } from "./anom5";

export const COMPONENTES_PIEZA: Record<string, React.FC<{ e: EscenaViralGuardada }>> = {
  "metro-plano": MetroPlano,
  "metro-friccion": MetroFriccion,
  "metro-rieles": MetroRieles,
  "metro-carrera": MetroCarrera,
  "metro-capacidad": MetroCapacidad,
  "metro-suelo": MetroSuelo,
  "metro-curva": MetroCurva,
  "metro-silueta": MetroSilueta,
  "metro-balanza": MetroBalanza,
  "anom-disco": AnomDisco,
  "anom-friccion": AnomFriccion,
  "anom-continente": AnomContinente,
  "anom-vertical": AnomVertical,
  "anom-carrera": AnomCarrera,
  "anom-escala": AnomEscala,
  "anom-suelo": AnomSuelo,
  "anom-laboratorio": AnomLaboratorio,
  "anom-compresion": AnomCompresion,
  "anom-cierre": AnomCierre,
};

export const Pieza: React.FC<{ e: EscenaViralGuardada; alternativa: React.ReactNode }> = ({ e, alternativa }) => {
  const C = e.pieza ? COMPONENTES_PIEZA[e.pieza.id] : undefined;
  return C ? <C e={e} /> : <>{alternativa}</>;
};
