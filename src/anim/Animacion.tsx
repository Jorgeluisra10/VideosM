import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { cargarFuentes } from "../lib/fuentes";
import { easeRetro, prog, useT } from "../lib/anim";
import { H, W } from "../lib/colores";
import { SondaQA } from "../components/SondaQA";
import { SoundEffect } from "../components/SoundEffect";
import { CapaRetro, Elementos2D, Fondo2D } from "./motor2d";
import { Escena3DView } from "./motor3d";
import { ProveedorColor, useTema } from "./contexto";
import { paletaPorId } from "./paletas";
import { MUSICA, eventosSfx, llevaMusica } from "./sonido";
import { EscenaLibre } from "./EscenaLibre";
import { EscenaEstudio } from "../estudio/EscenaEstudio";
import { EscenaViral } from "../viral/EscenaViral";
import { FPS_ANIM } from "./parser";
import type { Animacion as Anim, EscenaGuardada } from "./tipos";

/** Segundos que una escena sigue visible bajo la siguiente mientras esta se funde (evita parpadeos entre fondos distintos). */
const SOLAPE = 0.3;

const Fundido: React.FC<{ aparece: boolean; children: React.ReactNode }> = ({ aparece, children }) => {
  const t = useT();
  return <AbsoluteFill style={{ opacity: aparece ? prog(t, 0, SOLAPE) : 1 }}>{children}</AbsoluteFill>;
};

/** Duración (s) de la transición de semitono entre escenas del estilo retro. */
const SEG_SEMITONO = 0.7;
const PASO = 64; // separación de la retícula de puntos (a 45°)

/**
 * Halftone Wipe: círculos de semitono que crecen de radio 0 % a 100 % hasta cubrir TODA la pantalla con el color de fondo de la escena que entra.
 * El barrido avanza en diagonal (los puntos de la esquina superior izquierda arrancan antes) con la curva global retro.
 */
export const Semitono: React.FC<{ color: string; frames: number; adelanto?: string }> = ({ color, frames, adelanto }) => {
  const f = useCurrentFrame();
  const p = easeRetro(Math.min(1, Math.max(0, (f - (adelanto ? 0.22 * frames : 0)) / Math.max(1, frames * (adelanto ? 0.78 : 1)))));
  const pAdelanto = easeRetro(Math.min(1, f / Math.max(1, frames)));
  const puntos = useMemo(() => {
    const c = Math.SQRT1_2 * PASO;
    const lista: { x: number; y: number; d: number }[] = [];
    for (let u = -60; u <= 60; u++)
      for (let v = -60; v <= 60; v++) {
        const x = W / 2 + (u - v) * c, y = H / 2 + (u + v) * c;
        if (x < -PASO || x > W + PASO || y < -PASO || y > H + PASO) continue;
        lista.push({ x, y, d: Math.min(1, Math.max(0, (x / W + y / H) / 2)) });
      }
    return lista;
  }, []);
  const rMax = PASO * 0.72; // radio que cierra todos los huecos de la retícula
  return (
    <AbsoluteFill>
      <svg width={W} height={H}>
        {/* entre escenas del mismo tema (oscuro→oscuro o papel→papel) el barrido va en dos tintas: primero el color de acento y detrás el fondo */}
        {adelanto &&
          puntos.map((d, i) => {
            const r = Math.min(1, Math.max(0, pAdelanto * 1.7 - d.d * 0.7)) * rMax;
            return r > 0.3 ? <circle key={`a${i}`} cx={d.x} cy={d.y} r={r} fill={adelanto} /> : null;
          })}
        {puntos.map((d, i) => {
          const r = Math.min(1, Math.max(0, p * 1.7 - d.d * 0.7)) * rMax;
          return r > 0.3 ? <circle key={i} cx={d.x} cy={d.y} r={r} fill={color} /> : null;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** MasterVideoLayout (una escena): fondo + escenario central (GeometryStage) + capa retro (TerminalHeader y TelemetryHUD). */
export const Contenido: React.FC<{ e: EscenaGuardada; hud: boolean; primera?: boolean }> = ({ e, hud, primera = false }) => {
  const { paleta, tema } = useTema();
  // lienzo libre: la escena es código y es dueña del 100 % del lienzo (sin cabecera, HUD ni fondo impuestos)
  if (e.modo === "LIBRE") return <EscenaLibre escena={e} paleta={paleta.id} />;
  // motor de estudio: la escena es una decisión de diseño en JSON que dibujan los componentes prefabricados
  if (e.modo === "ESTUDIO") return <EscenaEstudio escena={e} paleta={paleta.id} />;
  // motor viral (reel completo desde una idea): plantillas de reel con barrido de entrada y barra de progreso
  if (e.modo === "VIRAL") return <EscenaViral escena={e} paleta={paleta.id} primera={primera} />;
  return (
    <>
      <Fondo2D ambiente={e.modo === "SVG" ? e.ambiente : "ninguno"} id={`e${e.n}${tema}`} solido={e.modo === "3D" && e.suelo !== "ninguno"} />
      {e.modo === "3D" && <Escena3DView escena={e} hud={hud} />}
      <Elementos2D elementos={e.modo === "SVG" ? e.elementos : e.overlay} />
      {paleta.estilo === "retro" && <CapaRetro titulo={e.titulo} tituloTam={e.tituloTam} subtitulo={e.subtitulo} medidores={e.medidores} />}
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
  const paleta = paletaPorId(animacion.paleta);
  // el barrido de semitono es del layout retro de los formatos con HUD; el lienzo libre usa fundido
  const retro = paleta.estilo === "retro" && animacion.formato !== "libre" && animacion.formato !== "estudio" && animacion.formato !== "viral";
  const framesSemitono = Math.round(SEG_SEMITONO * FPS_ANIM);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {animacion.escenas.map((e, k) => {
        const desde = Math.round(e.inicio * FPS_ANIM);
        const largo = Math.round(e.dur * FPS_ANIM) + (k < animacion.escenas.length - 1 ? Math.round(SOLAPE * FPS_ANIM) : 0);
        return (
          <Sequence key={e.n} from={desde} durationInFrames={Math.max(1, largo)} layout="none">
            <ProveedorColor paleta={animacion.paleta} tema={e.tema}>
              <Fundido aparece={k > 0 && !retro && animacion.formato !== "viral"}>
                <Contenido e={e} hud={animacion.hud !== false} primera={k === 0} />
              </Fundido>
            </ProveedorColor>
          </Sequence>
        );
      })}
      {/* estilo retro: entre escenas, barrido de semitono con el color de fondo de la escena que entra */}
      {retro &&
        animacion.escenas.slice(1).map((e, i) => {
          const hasta = Math.round(e.inicio * FPS_ANIM);
          const k = e.tema === "claro" ? paleta.claro : paleta.oscuro;
          const mismoTema = animacion.escenas[i].tema === e.tema;
          return (
            <Sequence key={`sw${e.n}`} from={Math.max(0, hasta - framesSemitono)} durationInFrames={framesSemitono + 1} layout="none">
              <Semitono color={k.fondoBorde} frames={framesSemitono} adelanto={mismoTema ? k.primario : undefined} />
            </Sequence>
          );
        })}
      {/* motor viral: las piezas a medida pueden entrar con una cortinilla de semitono (rojo primero si el fondo no cambia, y detrás el fondo de la escena que entra) */}
      {animacion.formato === "viral" &&
        animacion.escenas.slice(1).map((e, i) => {
          if (e.modo !== "VIRAL" || e.tr !== "semitono") return null;
          const hasta = Math.round(e.inicio * FPS_ANIM);
          const frames = Math.round(0.6 * FPS_ANIM);
          const mismoTema = animacion.escenas[i].tema === e.tema;
          return (
            <Sequence key={`sv${e.n}`} from={Math.max(0, hasta - frames)} durationInFrames={frames + 1} layout="none">
              <Semitono color={e.tema === "claro" ? "#F4F1EA" : "#0D0E12"} frames={frames} adelanto={mismoTema ? "#F04124" : undefined} />
            </Sequence>
          );
        })}
      {llevaMusica(animacion) && (
        <Audio
          src={staticFile(MUSICA.archivo)}
          loop
          volume={(fr) => MUSICA.volumen * Math.min(1, fr / (MUSICA.entrada * FPS_ANIM), Math.max(0, (animacion.duracion * FPS_ANIM - fr) / (MUSICA.salida * FPS_ANIM)))}
        />
      )}
      {efectos.map((s, i) => (
        <SoundEffect key={i} type={s.tipo} frame={s.frame} volume={s.vol} />
      ))}
      {qa && <SondaQA />}
    </AbsoluteFill>
  );
};
