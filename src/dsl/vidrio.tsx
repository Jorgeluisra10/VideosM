import React, { createContext, useContext, useId } from "react";
import { C, H, W } from "../lib/colores";
import { clamp, useT } from "../lib/anim";
import { existeMedia, infoMedia, rutaMedia } from "../lib/media";
import { movimientoFoto } from "./kenburns";
import type { FondoPlan } from "./tipos";

/**
 * Glassmorphism de verdad sobre las fotos de fondo.
 *
 * El escenario (SVG) tiene una máscara en sus orillas, y eso impide usar `backdrop-filter` del navegador
 * (no vería la foto de atrás). En su lugar cada tarjeta de cristal pinta DENTRO de sí misma una copia
 * desenfocada de la foto de la escena, colocada exactamente donde está la foto real (mismo movimiento Ken Burns,
 * deshaciendo el zoom y la sacudida de cámara del escenario) y encima un velo oscuro, un brillo diagonal y un
 * borde claro. Resultado: se ve la foto "a través" del cristal, con el texto siempre legible.
 *
 * Sin foto de fondo en la escena, la tarjeta es un panel oscuro clásico con borde de color.
 */

/** Zoom y sacudida de cámara del escenario en este fotograma (lo provee VideoMedico). */
export const CamaraCtx = createContext({ escala: 1, dx: 0, dy: 0 });

/** Foto de fondo de la escena que se está dibujando (lo provee EscenaDinamica). */
export const FondoEscenaCtx = createContext<{ fondo: FondoPlan | null; ini: number; fin: number }>({ fondo: null, ini: 0, fin: 1 });

/** Centro del escenario en coordenadas de vídeo (el escenario hace zoom alrededor de él). */
const CX = W / 2;
const CY = 350 + 1000 / 2;

type Props = {
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  /** color de acento (borde fino y tinte) */
  color: string;
  /** opacidad del velo oscuro (0.2–0.7): más alto = más contraste para el texto */
  velo?: number;
};

export const Cristal: React.FC<Props> = ({ x, y, w, h, r = 32, color, velo = 0.44 }) => {
  const t = useT();
  const cam = useContext(CamaraCtx);
  const { fondo, ini, fin } = useContext(FondoEscenaCtx);
  const id = "cr" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const tiene = Boolean(fondo?.foto) && existeMedia(fondo!.foto);

  if (!tiene) {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} rx={r} fill={C.fondo} fillOpacity={0.92} stroke={color} strokeWidth={5} />
        <rect x={x} y={y} width={w} height={h} rx={r} fill={color} fillOpacity={0.08} />
      </g>
    );
  }

  const info = infoMedia(fondo!.foto);
  const fuente = rutaMedia(info?.fondo ?? fondo!.foto);
  const p = clamp((t - ini) / Math.max(1, fin - ini));
  const marco = fondo!.modo === "marco";
  const m = marco ? { s: 1.15, tx: 0, ty: 0 } : movimientoFoto(fondo!.mov ?? "zoom-in", p);
  // deshace la cámara del escenario para que la foto quede alineada con la foto real de atrás
  const inversa = `translate(${CX} ${CY}) scale(${1 / cam.escala}) translate(${-(CX + cam.dx)} ${-(CY + cam.dy)})`;
  const foto = `translate(${CX} ${H / 2}) translate(${m.tx * W} ${m.ty * H}) scale(${m.s}) translate(${-CX} ${-H / 2})`;

  return (
    <g>
      <defs>
        <clipPath id={`${id}c`}>
          <rect x={x} y={y} width={w} height={h} rx={r} />
        </clipPath>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.2} />
          <stop offset="0.45" stopColor="#fff" stopOpacity={0.04} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.75} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.12} />
          <stop offset="1" stopColor={color} stopOpacity={0.55} />
        </linearGradient>
      </defs>
      {/* sombra suave bajo el cristal */}
      <rect x={x + 2} y={y + 14} width={w} height={h} rx={r} fill="#000" opacity={0.28} />
      <g clipPath={`url(#${id}c)`}>
        <g transform={inversa}>
          <image href={fuente} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" transform={foto} />
        </g>
        <rect x={x} y={y} width={w} height={h} fill="#0B0F19" fillOpacity={velo} />
        <rect x={x} y={y} width={w} height={h} fill={color} fillOpacity={0.07} />
        <rect x={x} y={y} width={w} height={h} fill={`url(#${id}b)`} />
      </g>
      <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={`url(#${id}l)`} strokeWidth={3} />
    </g>
  );
};
