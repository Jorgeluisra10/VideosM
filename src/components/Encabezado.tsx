import React from "react";
import { Easing, useVideoConfig } from "remotion";
import { C, FUENTE, MARGEN, W } from "../lib/colores";
import { lerp, prog, useT, ventana } from "../lib/anim";

export type TituloEscena = { titulo: string; acento: string; desde: number; hasta: number };

/**
 * Zona superior (y < 350): etiqueta de especialidad + título del capítulo actual
 * + barra de progreso. Se mantiene fuera de las zonas de UI de Reels/TikTok.
 */
export const Encabezado: React.FC<{ etiqueta: string; escenas: TituloEscena[] }> = ({ etiqueta, escenas }) => {
  const t = useT();
  const { durationInFrames, fps } = useVideoConfig();
  const total = durationInFrames / fps;

  return (
    <>
      {/* Barra de progreso */}
      <div
        style={{
          position: "absolute",
          left: MARGEN,
          top: 74,
          width: W - MARGEN * 2,
          height: 8,
          borderRadius: 4,
          background: "rgba(248,250,252,0.12)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(100, (t / total) * 100)}%`,
            height: "100%",
            borderRadius: 4,
            background: `linear-gradient(90deg, ${C.azul}, ${C.amarillo})`,
          }}
        />
      </div>

      {/* Etiqueta de especialidad */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 128,
          width: W,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          data-texto="etiqueta-especialidad"
          style={{
            fontFamily: FUENTE,
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: 5,
            color: C.fondo,
            background: C.amarillo,
            padding: "8px 26px",
            borderRadius: 999,
            opacity: prog(t, 0.05, 0.4),
            transform: `translateY(${lerp(-16, 0, prog(t, 0.05, 0.4))}px)`,
          }}
        >
          {etiqueta}
        </div>
      </div>

      {/* Título del capítulo */}
      {escenas.map((e, i) => {
        const primero = i === 0;
        const ultimo = i === escenas.length - 1;
        const a = primero ? 0 : e.desde;
        const b = ultimo ? total + 1 : e.hasta;
        const k = ventana(t, a, b, 0.32);
        if (k <= 0.01) return null;
        const entra = primero ? prog(t, 0.1, 0.5, Easing.out(Easing.cubic)) : prog(t, e.desde, 0.45, Easing.out(Easing.cubic));
        return (
          <div
            key={e.titulo}
            style={{
              position: "absolute",
              left: MARGEN,
              top: 196,
              width: W - MARGEN * 2,
              height: 140,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              opacity: k * entra,
              transform: `translateY(${lerp(34, 0, entra)}px)`,
            }}
          >
            <div
              data-texto="titulo"
              style={{
                fontFamily: FUENTE,
                fontWeight: 900,
                fontSize: 60,
                lineHeight: 1.06,
                letterSpacing: -0.5,
                color: C.hueso,
                textTransform: "uppercase",
                textShadow: `0 4px 0 rgba(0,0,0,0.4), 0 0 40px ${e.acento}66`,
              }}
            >
              {e.titulo}
            </div>
          </div>
        );
      })}
    </>
  );
};
