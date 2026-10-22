import React from "react";
import { Composition, Still } from "remotion";
import meta from "./data/meta.json";
import { Portada } from "./Portada";
import { VideoMedico } from "./VideoMedico";
import { FPS, H, W } from "./lib/colores";
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
    <Still id="Portada" component={Portada} width={W} height={H} />
  </>
);
