import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Busto } from "../../components/anatomia/Cuerpo";
import { Corazon } from "../../components/anatomia/Corazon";
import { Fondo } from "../../components/Fondo";
import { Defs, Halo, RayosDolor, Rotulo } from "../../components/svg/primitivas";
import { C, FPS, FUENTE, H, W } from "../../lib/colores";
import { cargarFuentes } from "../../lib/fuentes";
import { tiempoDe } from "../../lib/voz";

cargarFuentes();

const LINEAS: { texto: string; color: string }[] = [
  { texto: "¿POR QUÉ", color: C.hueso },
  { texto: "UN INFARTO", color: C.hueso },
  { texto: "DUELE EN EL", color: C.hueso },
  { texto: "BRAZO?", color: C.amarillo },
];

/**
 * Portada 1080×1920. El contenido importante queda en y 300–1620 para sobrevivir al recorte
 * 3:4 / 1:1 de la cuadrícula de perfil. Reutiliza el gancho congelado en el segundo de portada.
 */
export const PortadaInfarto: React.FC = () => {
  const tPortada = 2.6; // segundo del gancho donde se congela la ilustración
  const tBrazo = tiempoDe("brazo");
  const tInfarto = tiempoDe("infarto");
  const BX = 540;
  const BY = 1228;
  const BE = 0.9;
  const HX = BX + 44 * BE;
  const HY = BY - 36 * BE;
  return (
    <AbsoluteFill style={{ backgroundColor: C.fondo }}>
      <Sequence from={-Math.round(tPortada * FPS)} layout="none">
        <Fondo acento={C.rojo} />
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          <Defs />
          <Halo x={HX} y={HY} r={400} color="rojo" opacidad={0.85} />
          <Busto x={BX} y={BY} escala={BE} t0={0} dolorBrazo={{ t: tBrazo }} />
          <Corazon x={HX} y={HY} escala={0.52} t0={0} bpm={74} coronarias={0.1} dolor={{ t: tInfarto, intensidad: 1 }} />
          <RayosDolor x={BX + 262 * BE} y={BY - 40 * BE} r={80} n={9} t0={tBrazo + 0.25} largo={38} arco={[-60, 60]} />
          <Rotulo x={908} y={960} texto="?" t0={tiempoDe("no solo")} tam={250} color={C.amarillo} rot={10} />
        </svg>
      </Sequence>

      {/* Etiqueta */}
      <div style={{ position: "absolute", left: 0, top: 150, width: W, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: FUENTE,
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: 6,
            color: C.fondo,
            background: C.amarillo,
            padding: "10px 32px",
            borderRadius: 999,
          }}
        >
          CARDIOLOGÍA
        </div>
      </div>

      {/* Gancho */}
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 250,
          width: W - 160,
          textAlign: "center",
          fontFamily: FUENTE,
          fontWeight: 900,
          fontSize: 118,
          lineHeight: 1.0,
          letterSpacing: -2,
        }}
      >
        {LINEAS.map((l) => (
          <div
            key={l.texto}
            data-texto="portada"
            style={{
              color: l.color,
              textShadow: `0 8px 0 rgba(0,0,0,0.45), 0 0 50px ${l.color === C.amarillo ? "rgba(250,204,21,0.45)" : "rgba(239,68,68,0.35)"}`,
              WebkitTextStroke: `10px ${C.fondo}`,
              paintOrder: "stroke fill",
            }}
          >
            {l.texto}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
