/**
 * Kit del video «El par craneal V: el picante no es un sabor» (SINAPSIS · pares craneales): ilustración vectorial esquemática sobre fondo oscuro, determinista.
 *   Chile      chile rojo con tallo verde            Cono     helado de cono con dos bolas
 *   Llama      llama de fuego (se puede tachar)      Copo     copo de nieve (frío)
 *   Molecula   anillo hexagonal con cola             Rayo     rayo en zigzag (descarga de dolor)
 *   Cara       cara de frente con tres zonas V1/V2/V3 (frente y ojos · mejillas y labio superior · mandíbula) y boca que se abre
 *   Burbuja    globo de diálogo para pedir comentarios
 * Color: rojo-naranja = calor y picante · azul hielo = frío · dorado = nervio trigémino y datos · rojo = dolor · verde = receptor y confirmación.
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { useUid } from "../../estudio/util";
import { clamp, easeOut, lerp, mezclar } from "../comun";
import { ME, Ambiente, Chip, azar, sua, FONT, MONOF } from "./me-kit";
import { PC } from "./pc-kit";
import { polyPt } from "./op-kit";
import { Flecha } from "./tr-kit";

export { ME, PC, Ambiente, Chip, azar, sua, FONT, MONOF, clamp, easeOut, lerp, mezclar, polyPt, Flecha };
export const TGC = { picante: "#FF4D3D", calor: "#FF8A3D", frio: "#6AD0E6", nervio: "#FFD166", dolor: "#FF5A5F", verde: "#7BE08A", cereb: "#B78CFF", gris: "#8B97B8", v1: "#4FA3FF", v2: "#7BE08A", v3: "#FF9E3D" } as const;

export const Chile: React.FC<{ x: number; y: number; s?: number; brillo?: number; t?: number; opacidad?: number }> = ({ x, y, s = 1, brillo = 0, t = 0, opacidad = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${-8 + 3 * Math.sin(t * 3)})`} opacity={opacidad}>
    {brillo > 0 && <circle r={150} fill={TGC.picante} opacity={0.18 * brillo} />}
    <path d="M -100 -50 C -40 -90 60 -60 100 0 C 130 45 140 90 150 120 C 90 100 40 70 -10 40 C -60 10 -110 0 -100 -50 Z" fill={TGC.picante} stroke="#7A1410" strokeWidth={6} strokeLinejoin="round" />
    <path d="M -60 -50 C 0 -66 50 -44 80 -8" stroke="#fff" strokeOpacity={0.4} strokeWidth={8} fill="none" strokeLinecap="round" />
    <path d="M -100 -52 C -120 -86 -100 -112 -72 -118 L -66 -96 C -82 -92 -88 -76 -86 -58 Z" fill="#3E9E4E" stroke="#1E5A2A" strokeWidth={5} strokeLinejoin="round" />
  </g>
);

export const Cono: React.FC<{ x: number; y: number; s?: number; opacidad?: number }> = ({ x, y, s = 1, opacidad = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
    <path d="M -44 0 L 44 0 L 0 128 Z" fill="#D9A05B" stroke="#8A5A22" strokeWidth={5} strokeLinejoin="round" />
    <path d="M -24 20 L 18 94 M 0 6 L 28 56 M -34 6 L 6 112 M 24 6 L -14 94" stroke="#8A5A22" strokeWidth={3} opacity={0.6} />
    <circle cy={-16} r={50} fill="#FF9BC2" stroke="#B0457A" strokeWidth={5} /><circle cy={-62} r={38} fill="#FFF1D6" stroke="#B89A5A" strokeWidth={5} /><circle cx={0} cy={-104} r={9} fill="#FF4D6D" />
  </g>
);

export const Llama: React.FC<{ x: number; y: number; s?: number; t?: number; opacidad?: number; tachada?: number }> = ({ x, y, s = 1, t = 0, opacidad = 1, tachada = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
    <path d={`M 0 -${90 + 6 * Math.sin(t * 8)} C 40 -40 60 -10 50 30 C 44 66 10 84 0 84 C -10 84 -48 66 -50 30 C -52 -6 -30 -20 -22 -56 C -10 -40 -6 -30 0 -${90 + 6 * Math.sin(t * 8)} Z`} fill={TGC.calor} stroke="#7A1410" strokeWidth={5} strokeLinejoin="round" />
    <path d="M 0 -20 C 24 8 30 30 22 52 C 14 68 -14 68 -22 52 C -28 30 -12 10 0 -20 Z" fill="#FFD27A" />
    {tachada > 0 && <g opacity={tachada}><circle r={92} fill="none" stroke={TGC.dolor} strokeWidth={9} /><path d="M -64 64 L 64 -64" stroke={TGC.dolor} strokeWidth={9} strokeLinecap="round" /></g>}
  </g>
);

export const Copo: React.FC<{ x: number; y: number; s?: number; color?: string; opacidad?: number; giro?: number }> = ({ x, y, s = 1, color = TGC.frio, opacidad = 1, giro = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${giro})`} opacity={opacidad} stroke={color} strokeWidth={8} strokeLinecap="round" fill="none">
    {[0, 60, 120].map((a) => <g key={a} transform={`rotate(${a})`}><line x1={-70} y1={0} x2={70} y2={0} /><path d="M 40 0 L 56 -16 M 40 0 L 56 16 M -40 0 L -56 -16 M -40 0 L -56 16" /></g>)}
  </g>
);

export const Molecula: React.FC<{ x: number; y: number; s?: number; color?: string; opacidad?: number; giro?: number }> = ({ x, y, s = 1, color = TGC.picante, opacidad = 1, giro = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${giro})`} opacity={opacidad}>
    <polygon points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15" fill="none" stroke={color} strokeWidth={6} strokeLinejoin="round" />
    <path d="M 26 -15 L 56 -30 L 84 -14" stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={0} cy={-30} r={7} fill={color} /><circle cx={84} cy={-14} r={7} fill={color} />
  </g>
);

export const Rayo: React.FC<{ x: number; y: number; s?: number; opacidad?: number; color?: string }> = ({ x, y, s = 1, opacidad = 1, color = TGC.dolor }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
    <polygon points="14,-70 -32,6 -2,6 -18,70 36,-14 4,-14" fill={color} stroke="#fff" strokeWidth={4} strokeLinejoin="round" />
  </g>
);

/** Cara de frente. Origen = centro; ancho ≈ 460·s, alto ≈ 580·s. `zonas` = [v1, v2, v3] intensidad 0–1 · `boca` 0–1 abierta. */
export const Cara: React.FC<{ x: number; y: number; s?: number; zonas?: [number, number, number]; boca?: number; opacidad?: number }> = ({ x, y, s = 1, zonas = [0, 0, 0], boca = 0, opacidad = 1 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
      <defs><clipPath id={`${uid}c`}><ellipse rx={230} ry={290} /></clipPath></defs>
      <ellipse rx={230} ry={290} fill="#1B2448" stroke="#4A5C92" strokeWidth={7} />
      <g clipPath={`url(#${uid}c)`}>
        <rect x={-240} y={-295} width={480} height={215} fill={TGC.v1} opacity={0.12 + 0.55 * zonas[0]} />
        <rect x={-240} y={-80} width={480} height={170} fill={TGC.v2} opacity={0.12 + 0.55 * zonas[1]} />
        <rect x={-240} y={90} width={480} height={205} fill={TGC.v3} opacity={0.12 + 0.55 * zonas[2]} />
      </g>
      <ellipse rx={230} ry={290} fill="none" stroke="#4A5C92" strokeWidth={7} />
      <circle cx={-86} cy={-100} r={26} fill="#E4EAF8" /><circle cx={86} cy={-100} r={26} fill="#E4EAF8" /><circle cx={-86} cy={-96} r={12} fill="#0A0F1F" /><circle cx={86} cy={-96} r={12} fill="#0A0F1F" />
      <path d="M 0 -60 L -16 30 L 14 34" stroke="#8B97B8" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={0} cy={128} rx={62} ry={6 + 30 * boca} fill={boca > 0.05 ? "#3A0A14" : "none"} stroke="#8B97B8" strokeWidth={6} />
    </g>
  );
};

/** Globo de diálogo (comentarios). Origen = centro; ancho ≈ 300·s. */
export const Burbuja: React.FC<{ x: number; y: number; s?: number; color?: string; opacidad?: number; t?: number }> = ({ x, y, s = 1, color = TGC.nervio, opacidad = 1, t = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s * (1 + 0.04 * Math.sin(t * 6))})`} opacity={opacidad}>
    <path d="M -130 -80 H 130 A 30 30 0 0 1 160 -50 V 40 A 30 30 0 0 1 130 70 H 0 L -50 120 L -40 70 H -130 A 30 30 0 0 1 -160 40 V -50 A 30 30 0 0 1 -130 -80 Z" fill="#0F1730" stroke={color} strokeWidth={7} strokeLinejoin="round" />
    {[-60, 0, 60].map((dx) => <circle key={dx} cx={dx} cy={-8} r={13} fill={color} />)}
  </g>
);
