import React from "react";
import { Easing } from "remotion";
import { C, FUENTE, MARGEN, SUBS, W } from "../lib/colores";
import { prog, resorte, useT } from "../lib/anim";
import { BLOQUES } from "../lib/voz";

const TAM = 84;

/**
 * Subtítulos dinámicos palabra por palabra, en la franja y: 1450–1650.
 * Bloques de 2–4 palabras centrados; la palabra que suena se pone en #FACC15 y a escala 1.12.
 */
export const Subtitulos: React.FC = () => {
  const t = useT();
  let bi = -1;
  for (let i = 0; i < BLOQUES.length; i++) {
    if (t >= BLOQUES[i].ini - 0.04) bi = i;
    else break;
  }
  if (bi < 0) return null;
  const bloque = BLOQUES[bi];
  const ultima = bloque.palabras[bloque.palabras.length - 1];
  const siguiente = BLOQUES[bi + 1];
  // Tras una pausa larga (cambio de idea) el bloque se apaga solo en vez de quedarse pegado.
  const apagarEn = ultima.end + 0.55;
  if (!siguiente && t > apagarEn) return null;
  if (siguiente && siguiente.ini - ultima.end > 1.1 && t > apagarEn) return null;

  const entrada = resorte(t, bloque.ini - 0.04, { damping: 14, stiffness: 260, mass: 0.5 });
  const fade = prog(t, bloque.ini - 0.04, 0.1, Easing.out(Easing.quad));

  let activa = 0;
  bloque.palabras.forEach((p, k) => {
    if (t >= p.start) activa = k;
  });

  return (
    <div
      style={{
        position: "absolute",
        left: MARGEN,
        top: SUBS.y0,
        width: W - MARGEN * 2,
        height: SUBS.y1 - SUBS.y0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        opacity: fade,
        transform: `scale(${0.9 + 0.1 * Math.min(1.06, entrada)}) translateY(${(1 - Math.min(1, entrada)) * 18}px)`,
      }}
    >
      <div style={{ fontFamily: FUENTE, fontWeight: 900, fontSize: TAM, lineHeight: 1.12, letterSpacing: -1 }}>
        {bloque.palabras.map((p, k) => {
          const esActiva = k === activa;
          const pop = esActiva ? 1 + 0.12 * Math.min(1, resorte(t, p.start, { damping: 10, stiffness: 320, mass: 0.4 })) : 1;
          return (
            <span
              key={p.i}
              data-texto="subtitulo"
              style={{
                display: "inline-block",
                margin: "0 0.28em",
                color: esActiva ? C.amarillo : C.hueso,
                transform: `scale(${pop})`,
                WebkitTextStroke: `${TAM * 0.12}px ${C.fondo}`,
                paintOrder: "stroke fill",
                textShadow: esActiva
                  ? `0 0 30px rgba(250,204,21,0.55), 0 6px 0 rgba(0,0,0,0.35)`
                  : `0 6px 0 rgba(0,0,0,0.35), 0 0 22px rgba(0,0,0,0.55)`,
                whiteSpace: "nowrap",
              }}
            >
              {p.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
