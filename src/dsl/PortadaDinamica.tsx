import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Fondo } from "../components/Fondo";
import { Defs } from "../components/svg/primitivas";
import { C, ESCENARIO, FPS, FUENTE, H, W } from "../lib/colores";
import { cargarFuentes } from "../lib/fuentes";
import { anchoEstimado } from "../lib/texto";
import { PALABRAS } from "../lib/voz";
import { EscenaDinamica } from "./EscenaDinamica";
import { FondoFoto } from "./FondoFoto";
import { tiemposDePlan } from "./tiempos";
import type { Plan } from "./tipos";
import { COLORES } from "./elementos/comun";

cargarFuentes();

/**
 * Portada genérica 1080×1920 para planes de la IA: etiqueta + gancho en 3–4 líneas grandes
 * (una resaltada en amarillo) y, debajo, la ilustración de una escena congelada en el segundo elegido.
 * Todo el contenido importante queda en y 150–1640, que sobrevive al recorte 3:4 / 1:1 del perfil.
 */
export const PortadaDinamica: React.FC<{ plan: Plan }> = ({ plan }) => {
  const { inicios, fines } = tiemposDePlan(plan, PALABRAS);
  const idx = Math.max(0, plan.escenas.findIndex((e) => e.id === plan.portada.escena));
  const escena = plan.escenas[idx];
  const seg = plan.portada.segundo;
  const lineas = plan.portada.lineas.slice(0, 4).map((l) => l.toUpperCase());
  // foto de fondo: la indicada para la portada o, si no, la de la escena elegida
  const fondoFoto = plan.portada.foto ? { foto: plan.portada.foto, modo: "cubrir" as const, mov: "fijo" as const, oscurecer: 0.35 } : escena?.fondo?.foto ? { ...escena.fondo, mov: "fijo" as const } : null;
  // tamaño de letra: el más grande que deje la línea más larga dentro de 880 px
  const mayor = Math.max(1, ...lineas.map((l) => anchoEstimado(l, 1, 900)));
  const fs = Math.max(78, Math.min(124, Math.floor(880 / mayor)));
  return (
    <AbsoluteFill style={{ backgroundColor: C.fondo }}>
      <Sequence from={-Math.round(seg * FPS)} layout="none">
        <Fondo acento={COLORES[escena?.acento ?? "rojo"] ?? C.rojo} />
        {fondoFoto && <FondoFoto fondo={fondoFoto} ini={inicios[idx]} fin={fines[idx]} />}
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          <Defs />
          <g transform={`translate(${W / 2} 1235) scale(0.82) translate(${-W / 2} ${-(ESCENARIO.y0 + ESCENARIO.alto / 2)})`}>
            {escena && <EscenaDinamica ini={inicios[idx]} fin={fines[idx]} escena={escena} />}
          </g>
        </svg>
      </Sequence>

      <div style={{ position: "absolute", left: 0, top: 150, width: W, display: "flex", justifyContent: "center" }}>
        <div style={{ fontFamily: FUENTE, fontWeight: 800, fontSize: 34, letterSpacing: 6, color: C.fondo, background: C.amarillo, padding: "10px 32px", borderRadius: 999 }}>
          {plan.proyecto.etiqueta}
        </div>
      </div>

      <div style={{ position: "absolute", left: 80, top: 250, width: W - 160, textAlign: "center", fontFamily: FUENTE, fontWeight: 900, fontSize: fs, lineHeight: 1.0, letterSpacing: -2 }}>
        {lineas.map((l, i) => {
          const resaltada = i === plan.portada.resaltar;
          return (
            <div
              key={`${l}-${i}`}
              data-texto="portada"
              style={{
                color: resaltada ? C.amarillo : C.hueso,
                textShadow: `0 8px 0 rgba(0,0,0,0.45), 0 0 50px ${resaltada ? "rgba(250,204,21,0.45)" : "rgba(239,68,68,0.35)"}`,
                WebkitTextStroke: `10px ${C.fondo}`,
                paintOrder: "stroke fill",
              }}
            >
              {l}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
