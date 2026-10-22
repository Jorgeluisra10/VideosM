import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { SoundEffects } from "./components/SoundEffect";
import { Transicion, esTransicionExterna } from "./components/Transicion";
import { Encabezado } from "./components/Encabezado";
import { Escenario } from "./components/Escenario";
import { Fondo } from "./components/Fondo";
import { SondaQA } from "./components/SondaQA";
import { Subtitulos } from "./components/Subtitulos";
import { C, FPS } from "./lib/colores";
import { cargarFuentes } from "./lib/fuentes";
import { MARCA } from "./lib/marca";
import { lerp, prog, sacudida } from "./lib/anim";
import { tema } from "./tema";
import { CamaraCtx } from "./dsl/vidrio";
import { type EscenaDef } from "./scenes/tipos";

cargarFuentes();

export type VideoProps = {
  /** "normal" = video completo · "soloEscena" = solo la ilustración sobre fondo liso (QA de movimiento) */
  modo?: "normal" | "soloEscena";
  /** monta la sonda que mide los textos reales en el DOM (QA de márgenes) */
  qa?: boolean;
};

const SOLAPE_ENTRADA = 0.22;
const SOLAPE_SALIDA = 0.3;

const Escena: React.FC<{ e: EscenaDef; i: number; total: number; hasta: number; fin: number; modo: "normal" | "soloEscena"; qa: boolean }> = ({ e, i, total, hasta, fin, modo, qa }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const primera = i === 0;
  const ultima = i === total - 1;
  const ini = primera ? 0 : e.desde - SOLAPE_ENTRADA;
  const final = ultima ? fin : hasta + SOLAPE_SALIDA;
  if (t < ini || t > final) return null;

  const entra = primera ? 1 : prog(t, ini, 0.5, Easing.out(Easing.cubic));
  const sale = ultima ? 1 : 1 - prog(t, hasta - 0.12, SOLAPE_SALIDA + 0.12, Easing.in(Easing.cubic));
  const deriva = prog(t, e.desde, Math.max(1, hasta - e.desde), (n) => n);
  // en el QA se mide con la transición clásica (las externas desplazan el contenido a propósito mientras duran)
  const externa = modo !== "soloEscena" && !qa && esTransicionExterna(MARCA.transicion) ? MARCA.transicion : null;
  const escala = externa ? 1 + 0.035 * deriva : lerp(0.92, 1, entra) * lerp(1, 1.08, 1 - sale) * (1 + 0.035 * deriva);

  let dx = 0;
  let dy = 0;
  for (const ti of tema.impactos) {
    const s = sacudida(t, ti, 11, 0.5);
    dx += s.x;
    dy += s.y;
  }

  const Comp = e.Componente;
  const Fondo = e.Fondo;
  const opacidad = externa ? 1 : entra * sale;
  const contenido = (
    <>
      {/* foto de fondo a pantalla completa (no se pinta en el QA de movimiento "soloEscena") */}
      {Fondo && modo !== "soloEscena" && (
        <AbsoluteFill style={{ opacity: opacidad }}>
          <Fondo ini={e.desde} fin={hasta} />
        </AbsoluteFill>
      )}
      <Escenario opacidad={opacidad} escala={escala} dx={dx} dy={dy}>
        <CamaraCtx.Provider value={{ escala, dx, dy }}>
          <Comp ini={e.desde} fin={hasta} />
        </CamaraCtx.Provider>
      </Escenario>
    </>
  );
  if (!externa) return contenido;
  // transición de @remotion/transitions: la escena que sale usa el progreso inverso a su "sale"; la que entra, su "entra"
  const saliendo = !ultima && t >= hasta - 0.12;
  return (
    <Transicion tipo={externa} direccion={saliendo ? "exiting" : "entering"} progreso={saliendo ? 1 - sale : entra}>
      {contenido}
    </Transicion>
  );
};

export const VideoMedico: React.FC<VideoProps> = ({ modo = "normal", qa = false }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / FPS;
  const total = durationInFrames / FPS;
  const escenas = tema.escenas;

  const tramos = escenas.map((e, i) => ({
    e,
    hasta: i < escenas.length - 1 ? escenas[i + 1].desde : total,
  }));

  // Color de acento del fondo: se mantiene dentro de cada escena y se funde en los cambios.
  const entradas: number[] = [];
  const colores: string[] = [];
  tramos.forEach(({ e, hasta }, i) => {
    const a = i === 0 ? 0 : e.desde;
    const b = Math.max(a + 0.01, hasta - 0.35);
    entradas.push(a, b);
    colores.push(e.acento, e.acento);
  });
  const acento = interpolateColors(t, entradas, colores);

  return (
    <AbsoluteFill style={{ backgroundColor: C.fondo }}>
      {modo !== "soloEscena" && <Fondo acento={acento} />}

      {tramos.map(({ e, hasta }, i) => (
        <Escena key={e.id} e={e} i={i} total={tramos.length} hasta={hasta} fin={total} modo={modo} qa={qa} />
      ))}

      {modo !== "soloEscena" && (
        <>
          <Encabezado etiqueta={tema.etiqueta} escenas={tramos.map(({ e, hasta }) => ({ titulo: e.titulo, acento: e.acento, desde: e.desde, hasta }))} />
          <Subtitulos />
        </>
      )}

      {/* Audio: voz + ambiente + efectos */}
      <Audio src={staticFile("audios/voz.mp3")} volume={1} />
      {MARCA.ambiente && (
        <Audio
          src={staticFile("audios/ambiente.wav")}
          loop
          volume={(f) => interpolate(f, [0, 90, durationInFrames - 120, durationInFrames], [0, 0.07, 0.07, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      )}
      {MARCA.musica && (
        <Audio
          src={staticFile(`media/${MARCA.musica}`)}
          loop
          volume={(f) => interpolate(f, [0, 60, durationInFrames - 90, durationInFrames], [0, MARCA.volumenMusica, MARCA.volumenMusica, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      )}
      <SoundEffects lista={tema.sfx} />

      {qa && <SondaQA />}
    </AbsoluteFill>
  );
};
