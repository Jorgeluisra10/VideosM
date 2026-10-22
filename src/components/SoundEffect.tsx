import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { DUR_SFX, VOL_SFX, archivoSfx, type SfxDef, type SfxTipo } from "../scenes/tipos";
import { FPS } from "../lib/colores";

export type SoundEffectProps = {
  /** pop (aparece una etiqueta) · whoosh (transición) · heartbeat (latido) · cash (precio) · y también tick, thud, zap, ding */
  type: SfxTipo;
  /** Fotograma exacto en que suena: normalmente el mismo en que el elemento entra con spring(). */
  frame?: number;
  /** Alternativa en segundos (se convierte a fotograma). */
  segundo?: number;
  /** 0–1. Por defecto 0.15: se nota pero nunca tapa la voz. */
  volume?: number;
};

/**
 * Efecto de sonido sincronizado con un fotograma. Los archivos viven en public/sfx/<tipo>.wav
 * (si faltan: `npm run sfx` los sintetiza; no hay licencias ni descargas).
 *
 *   <SoundEffect type="pop" frame={Math.round(t0 * FPS)} />
 *
 * El render final mezcla el mismo audio en Node (scripts/audio.mjs) con la misma lista de efectos,
 * así que lo que oyes en el Studio es lo que sale en el .mp4.
 */
export const SoundEffect: React.FC<SoundEffectProps> = ({ type, frame, segundo, volume = VOL_SFX }) => {
  const desde = Math.max(0, Math.round(frame ?? (segundo ?? 0) * FPS));
  return (
    <Sequence from={desde} durationInFrames={Math.ceil(DUR_SFX[type] * FPS)} layout="none">
      <Audio src={staticFile(archivoSfx(type))} volume={volume} />
    </Sequence>
  );
};

/** Una lista de efectos de un tema (tema.sfx) montada de una vez. */
export const SoundEffects: React.FC<{ lista: SfxDef[] }> = ({ lista }) => (
  <>
    {lista.map((s, k) => (
      <SoundEffect key={k} type={s.tipo} segundo={s.t} volume={s.vol ?? VOL_SFX} />
    ))}
  </>
);
