import React from "react";
import { Composition, Still } from "remotion";
import meta from "./data/meta.json";
import { Portada } from "./Portada";
import { VideoMedico } from "./VideoMedico";
import { FPS, H, W } from "./lib/colores";
import { Animacion, type PropsAnimacion } from "./anim/Animacion";
import animacionPorDefecto from "./data/animacion.json";
import { framesDeAnimacion } from "./anim/validar";
import type { Animacion as Anim } from "./anim/tipos";
import { FIN_VOZ } from "./lib/voz";

/** El video dura lo que dura la voz + 1 s de cola (el audio estimado nunca recorta la última palabra). */
const SEGUNDOS = Math.max(meta.duracionAudio, FIN_VOZ) + 1.0;
const DURACION = Math.ceil(SEGUNDOS * FPS);

export const Root: React.FC = () => (
  <>
    <Composition
      id="VideoMedico"
      component={VideoMedico}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={DURACION}
      defaultProps={{ modo: "normal", qa: false }}
    />
    <Composition
      id="Animacion"
      component={Animacion}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={framesDeAnimacion(animacionPorDefecto as unknown as Anim)}
      defaultProps={{ animacion: animacionPorDefecto as unknown as Anim, qa: false } satisfies PropsAnimacion}
      calculateMetadata={({ props }) => ({ durationInFrames: framesDeAnimacion(props.animacion) })}
    />
    <Still id="Portada" component={Portada} width={W} height={H} />
  </>
);
