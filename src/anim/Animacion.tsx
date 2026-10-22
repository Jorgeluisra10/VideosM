import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { cargarFuentes } from "../lib/fuentes";
import { prog, useT } from "../lib/anim";
import { SondaQA } from "../components/SondaQA";
import { SoundEffect } from "../components/SoundEffect";
import { Elementos2D, Fondo2D } from "./motor2d";
import { Escena3DView } from "./motor3d";
import { ProveedorColor, useTema } from "./contexto";
import { eventosSfx } from "./sonido";
import { FPS_ANIM } from "./parser";
import type { Animacion as Anim, EscenaGuardada } from "./tipos";

/** Segundos que una escena sigue visible bajo la siguiente mientras esta se funde (evita parpadeos entre fondos distintos). */
const SOLAPE = 0.3;

const Fundido: React.FC<{ aparece: boolean; children: React.ReactNode }> = ({ aparece, children }) => {
  const t = useT();
  return <AbsoluteFill style={{ opacity: aparece ? prog(t, 0, SOLAPE) : 1 }}>{children}</AbsoluteFill>;
};

const Contenido: React.FC<{ e: EscenaGuardada }> = ({ e }) => {
  const { tema } = useTema();
  return (
    <>
      <Fondo2D ambiente={e.modo === "SVG" ? e.ambiente : "ninguno"} id={`e${e.n}${tema}`} solido={e.modo === "3D" && e.suelo !== "ninguno"} />
      {e.modo === "3D" && <Escena3DView escena={e} />}
      <Elementos2D elementos={e.modo === "SVG" ? e.elementos : e.overlay} />
    </>
  );
};

export type PropsAnimacion = { animacion: Anim; qa?: boolean };

/**
 * Video 100 % visual: sin subtítulos, sin encabezado y sin voz (la locución se graba aparte).
 * Cada escena dura exactamente lo que dicen sus tiempos (segundos × 60 fotogramas).
 * Si `animacion.sfx` es false no se monta ninguna pista de audio (eventosSfx() devuelve una lista vacía).
 */
export const Animacion: React.FC<PropsAnimacion> = ({ animacion, qa }) => {
  cargarFuentes();
  const efectos = eventosSfx(animacion);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {animacion.escenas.map((e, k) => {
        const desde = Math.round(e.inicio * FPS_ANIM);
        const largo = Math.round(e.dur * FPS_ANIM) + (k < animacion.escenas.length - 1 ? Math.round(SOLAPE * FPS_ANIM) : 0);
        return (
          <Sequence key={e.n} from={desde} durationInFrames={Math.max(1, largo)} layout="none">
            <ProveedorColor paleta={animacion.paleta} tema={e.tema}>
              <Fundido aparece={k > 0}>
                <Contenido e={e} />
              </Fundido>
            </ProveedorColor>
          </Sequence>
        );
      })}
      {efectos.map((s, i) => (
        <SoundEffect key={i} type={s.tipo} frame={s.frame} volume={s.vol} />
      ))}
      {qa && <SondaQA />}
    </AbsoluteFill>
  );
};
