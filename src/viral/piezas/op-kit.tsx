/**
 * Kit del video «El nervio óptico: la parte del cerebro que sale a mirar» (SINAPSIS · pares craneales): anatomía vectorial esquemática sobre fondo oscuro, determinista.
 *   Ojo       globo ocular de frente (esclera, iris, pupila) con brillo opcional
 *   Helice    doble hélice de ADN horizontal con marcas epigenéticas (puntos rojos) que se pueden borrar
 *   Raton     icono de ratón
 *   Persona   icono de persona (participante de un ensayo)
 *   polyPt    punto a lo largo de una poligonal (para impulsos que recorren una vía)
 * Color: violeta = tejido cerebral · azul = campo visual izquierdo · naranja = campo visual derecho · verde = renacer · ámbar = datos · rojo = daño.
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { useUid } from "../../estudio/util";
import { clamp, easeOut, lerp, mezclar } from "../comun";
import { ME, Ambiente, Chip, azar, sua, FONT, MONOF, Cerebro } from "./me-kit";
import { PC } from "./pc-kit";
import { NUEVA } from "./ol-kit";

export { ME, PC, NUEVA, Ambiente, Chip, Cerebro, azar, sua, FONT, MONOF, clamp, easeOut, lerp, mezclar };
export const OPC = { izq: "#4FA3FF", der: "#FF9E3D", cereb: "#B78CFF", dato: "#FFD166", rojo: "#FF5A5F", verde: "#5CE0A0", gris: "#8B97B8" } as const;

/** punto a lo largo de una poligonal, u = 0–1 */
export const polyPt = (pts: [number, number][], u: number): [number, number] => {
  const k = clamp(u) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(k)), f = k - i;
  return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)];
};

/** Globo ocular de frente. Origen = centro; radio = r. `iris` = color del iris; `brillo` 0–1 añade un halo. */
export const Ojo: React.FC<{ x: number; y: number; r?: number; iris?: string; brillo?: number; t?: number; opacidad?: number }> = ({ x, y, r = 80, iris = "#4FA3FF", brillo = 0, t = 0, opacidad = 1 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacidad}>
      <defs><radialGradient id={`${uid}e`} cx="40%" cy="35%" r="75%"><stop offset="0" stopColor="#F4F7FF" /><stop offset="1" stopColor="#B9C6E4" /></radialGradient></defs>
      {brillo > 0 && <circle r={r * 1.5 + 6 * Math.sin(t * 5)} fill={iris} opacity={0.2 * brillo} />}
      <circle r={r} fill={`url(#${uid}e)`} stroke="#5C6A90" strokeWidth={4} />
      <circle r={r * 0.5} fill={iris} stroke="#1B2A55" strokeWidth={3} />
      <circle r={r * 0.22} fill="#0A0F1F" />
      <circle cx={-r * 0.12} cy={-r * 0.14} r={r * 0.08} fill="#fff" opacity={0.85} />
    </g>
  );
};

/** Doble hélice horizontal desde x0 hasta x1, a la altura y. `marcas` 0–1 = cuántas marcas epigenéticas quedan (1 = todas) · `color` de las hebras. */
export const Helice: React.FC<{ x0: number; x1: number; y: number; amp?: number; marcas?: number; color?: string; t?: number }> = ({ x0, x1, y, amp = 44, marcas = 1, color = "#8FA3C8", t = 0 }) => {
  const n = 60, w = (x1 - x0) / n;
  const hebra = (ph: number): string => Array.from({ length: n + 1 }, (_, i) => `${i ? "L" : "M"} ${x0 + i * w} ${y + amp * Math.sin(i * 0.5 + ph + t * 1.2)}`).join(" ");
  const nM = 14;
  return (
    <g>
      {Array.from({ length: 30 }, (_, i) => { const k = i * 2, xx = x0 + k * w; return <line key={i} x1={xx} y1={y + amp * Math.sin(k * 0.5 + t * 1.2)} x2={xx} y2={y + amp * Math.sin(k * 0.5 + Math.PI + t * 1.2)} stroke={color} strokeOpacity={0.35} strokeWidth={3} />; })}
      <path d={hebra(0)} stroke={color} strokeWidth={7} fill="none" strokeLinecap="round" /><path d={hebra(Math.PI)} stroke={mezclar(color, "#fff", 0.2)} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.85} />
      {Array.from({ length: Math.round(clamp(marcas) * nM) }, (_, i) => {
        const k = 3 + i * 4, xx = x0 + k * w, yy = y + amp * Math.sin(k * 0.5 + t * 1.2) - 16;
        return <circle key={i} cx={xx} cy={yy} r={9} fill={OPC.rojo} stroke="#fff" strokeOpacity={0.6} strokeWidth={2} />;
      })}
    </g>
  );
};

/** Ratón de perfil mirando a la derecha. Origen = centro del cuerpo; largo ≈ 150·s. */
export const Raton: React.FC<{ x: number; y: number; s?: number; color?: string }> = ({ x, y, s = 1, color = "#C8D2E8" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -70 20 C -110 20 -130 -10 -150 -20" stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" />
    <ellipse cx={-10} cy={0} rx={68} ry={40} fill={color} stroke="#27324F" strokeWidth={4} />
    <path d="M 40 -30 C 70 -34 96 -14 104 4 C 96 24 66 30 44 24 Z" fill={color} stroke="#27324F" strokeWidth={4} strokeLinejoin="round" />
    <circle cx={34} cy={-40} r={20} fill="#FF9BC2" stroke="#27324F" strokeWidth={4} /><circle cx={26} cy={-34} r={9} fill="#FFC3DB" />
    <circle cx={70} cy={-4} r={5} fill="#0A0F1F" /><circle cx={106} cy={4} r={6} fill="#FF7EA8" />
    <path d="M 100 8 L 138 2 M 100 12 L 136 18" stroke="#27324F" strokeWidth={2.5} strokeLinecap="round" />
  </g>
);

/** Persona (participante). Origen = base; alto ≈ 110·s. */
export const Persona: React.FC<{ x: number; y: number; s?: number; color?: string; brillo?: number }> = ({ x, y, s = 1, color = OPC.gris, brillo = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {brillo > 0 && <circle cy={-60} r={78} fill={OPC.verde} opacity={0.22 * brillo} />}
    <circle cy={-84} r={20} fill={color} /><rect x={-28} y={-58} width={56} height={58} rx={22} fill={color} />
  </g>
);
