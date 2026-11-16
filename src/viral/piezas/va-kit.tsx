/**
 * Kit del video «El par craneal VIII: el nervio que oye y equilibra» (SINAPSIS · pares craneales): ilustración vectorial esquemática sobre fondo oscuro, determinista.
 *   Coclea     caracol del oído interno (espiral) que se puede desenrollar en un tubo recto (`des` 0–1)
 *   Cilio      célula ciliada con su «pelito» (haz de estereocilios escalonados): se inclina (`inclina`) o se aplasta por el ruido (`dano`)
 *   Atomo      átomo esquemático (núcleo y electrones) para comparar escalas
 *   Canales    tres canales semicirculares (anillos en tres planos) con líquido
 *   Nivel      nivel de burbuja (analogía del canal con líquido)
 *   Piedritas  membrana gelatinosa con cristales (otoconias) sobre células ciliadas; se inclina con la cabeza
 *   Cabeza     cabeza de frente con ojos que miran (reflejo vestíbulo-ocular)
 * Color: ámbar = coclear (oír) · turquesa = vestibular (equilibrio) · lavanda = nervio VIII · azul = células ciliadas · rojo = daño y alerta · dorado = datos.
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { clamp, easeOut, lerp, mezclar } from "../comun";
import { ME, Ambiente, Chip, Cerebro, FONT, MONOF, polyPt, azar } from "./fa-kit";

export { ME, Ambiente, Chip, Cerebro, FONT, MONOF, polyPt, azar, clamp, easeOut, lerp, mezclar };
export const VAC = { coclear: "#FFB347", vest: "#4DE3C1", nervio: "#9BA9FF", cel: "#4B7BEC", celClaro: "#8FB0FF", rojo: "#FF5A5F", oro: "#FFD166", verde: "#7BE08A", hueso: "#C8D2E8", gris: "#8B97B8", piel: "#1B2448", trazo: "#4A5C92", tubo: "#2B3A66" } as const;

/** Puntos de una espiral de `vueltas` vueltas, de radio externo r0 a interno r1, empezando a la derecha. */
function espiral(cx: number, cy: number, r0: number, r1: number, vueltas: number, n: number): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => { const u = i / n, th = u * vueltas * Math.PI * 2, r = lerp(r0, r1, u); return [cx + r * Math.cos(th), cy + r * Math.sin(th)] as [number, number]; });
}
const trazo = (pts: [number, number][]): string => pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

/** Cóclea: espiral (des = 0) o tubo recto (des = 1) de `largo` px a la altura cy. Origen en (cx, cy). */
export const Coclea: React.FC<{ cx: number; cy: number; r?: number; des?: number; largo?: number; grosor?: number; color?: string; opacidad?: number }> = ({ cx, cy, r = 150, des = 0, largo = 760, grosor = 30, color = VAC.coclear, opacidad = 1 }) => {
  const n = 90, esp = espiral(cx, cy, r, r * 0.16, 2.5, n);
  const k = easeOut(des), pts = esp.map((p, i) => [lerp(p[0], cx - largo / 2 + (largo * i) / n, k), lerp(p[1], cy, k)] as [number, number]);
  const d = trazo(pts);
  return (
    <g opacity={opacidad} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={d} stroke={VAC.tubo} strokeWidth={grosor + 14} />
      <path d={d} stroke={color} strokeWidth={grosor} opacity={0.9} />
      <path d={d} stroke="#fff" strokeWidth={4} opacity={0.35} />
    </g>
  );
};

/** Célula ciliada con su pelito. Origen = base del pelito (arriba de la célula). Alto del pelito ≈ 58·s. */
export const Cilio: React.FC<{ x: number; y: number; s?: number; inclina?: number; dano?: number; color?: string; opacidad?: number }> = ({ x, y, s = 1, inclina = 0, dano = 0, color = VAC.cel, opacidad = 1 }) => {
  const hs = [24, 32, 40, 48, 58], dx = [-20, -10, 0, 10, 20], a = clamp(dano) * 1.35;
  const gone = dano > 0.92;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
      <path d="M -26 4 C -30 40 -22 70 0 74 C 22 70 30 40 26 4 Z" fill={color} stroke="#fff" strokeOpacity={0.35} strokeWidth={3} opacity={1 - 0.55 * clamp(dano)} />
      {hs.map((h, i) => {
        const tx = dx[i] + inclina * (h / 58) * (1 - dano) + h * Math.sin(a), ty = -h * Math.cos(a) * 1 + (dano > 0 ? 0 : 0);
        return <line key={i} x1={dx[i]} y1={2} x2={tx} y2={ty} stroke={mezclar(VAC.celClaro, "#6B6F86", clamp(dano))} strokeWidth={5.5} strokeLinecap="round" opacity={1 - 0.35 * clamp(dano)} />;
      })}
      {gone && <g stroke={VAC.rojo} strokeWidth={6} strokeLinecap="round"><line x1={-14} y1={-30} x2={14} y2={-4} /><line x1={14} y1={-30} x2={-14} y2={-4} /></g>}
    </g>
  );
};

/** Átomo esquemático (núcleo y dos órbitas con electrones). Origen = centro; radio ≈ r. */
export const Atomo: React.FC<{ x: number; y: number; r?: number; t?: number; color?: string; opacidad?: number }> = ({ x, y, r = 40, t = 0, color = VAC.oro, opacidad = 1 }) => (
  <g transform={`translate(${x} ${y})`} opacity={opacidad}>
    {[0, 60, 120].map((an, i) => <ellipse key={i} rx={r} ry={r * 0.38} transform={`rotate(${an})`} fill="none" stroke={color} strokeWidth={Math.max(2, r / 14)} opacity={0.8} />)}
    <circle r={r * 0.2} fill={color} />
    {[0, 1, 2].map((i) => { const th = t * 3 + (i * Math.PI * 2) / 3, an = (i * 60 * Math.PI) / 180, ex = r * Math.cos(th), ey = r * 0.38 * Math.sin(th); return <circle key={i} cx={ex * Math.cos(an) - ey * Math.sin(an)} cy={ex * Math.sin(an) + ey * Math.cos(an)} r={Math.max(3, r / 9)} fill="#fff" />; })}
  </g>
);

/** Tres canales semicirculares como tres lazos (trébol) que salen del vestíbulo. Origen = centro; radio ≈ 166·s. */
export const Canales: React.FC<{ x: number; y: number; s?: number; opacidad?: number; brillo?: number; girar?: number }> = ({ x, y, s = 1, opacidad = 1, brillo = 0, girar = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${girar})`} opacity={opacidad}>
    {[[0, "#4DE3C1"], [120, "#6AD0E6"], [240, "#7BE08A"]].map(([an, c], i) => (
      <g key={i} transform={`rotate(${an})`}>
        <ellipse cx={0} cy={-92} rx={50} ry={74} fill="rgba(77,227,193,0.10)" stroke={VAC.tubo} strokeWidth={26} />
        <ellipse cx={0} cy={-92} rx={50} ry={74} fill="none" stroke={c as string} strokeWidth={14} opacity={0.75 + 0.25 * brillo} />
        <circle cx={0} cy={-34} r={14} fill="#fff" opacity={0.5} />
      </g>
    ))}
    <circle r={30} fill={VAC.vest} stroke={VAC.tubo} strokeWidth={6} />
  </g>
);

/** Nivel de burbuja (analogía: canal con líquido). `inclina` −1..1 desplaza la burbuja. Origen = centro; ancho ≈ 300·s. */
export const Nivel: React.FC<{ x: number; y: number; s?: number; inclina?: number; opacidad?: number }> = ({ x, y, s = 1, inclina = 0, opacidad = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
    <rect x={-150} y={-34} width={300} height={68} rx={34} fill="#2A5E52" stroke="#9BF0D8" strokeWidth={6} />
    <rect x={-136} y={-20} width={272} height={40} rx={20} fill="#4DE3C1" opacity={0.55} />
    <ellipse cx={clamp(inclina, -1, 1) * 96} cy={0} rx={26} ry={16} fill="#EAFFF8" opacity={0.95} />
    <line x1={-22} y1={-34} x2={-22} y2={-22} stroke="#fff" strokeWidth={3} /><line x1={22} y1={-34} x2={22} y2={-22} stroke="#fff" strokeWidth={3} />
  </g>
);

/** Membrana gelatinosa con piedritas (otoconias) sobre células ciliadas. `ang` en grados; `desp` −1..1 desliza las piedritas; `suelta` 0–1 hace caer una piedrita hacia abajo. Origen = centro; ancho ≈ 300·s. */
export const Piedritas: React.FC<{ x: number; y: number; s?: number; ang?: number; desp?: number; opacidad?: number }> = ({ x, y, s = 1, ang = 0, desp = 0, opacidad = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${ang})`} opacity={opacidad}>
    {Array.from({ length: 6 }, (_, i) => <line key={i} x1={-120 + i * 48} y1={46} x2={-120 + i * 48 + desp * 10} y2={14} stroke={VAC.celClaro} strokeWidth={6} strokeLinecap="round" />)}
    <rect x={-150} y={46} width={300} height={40} rx={14} fill={VAC.cel} />
    <rect x={-150} y={-10} width={300} height={44} rx={16} fill="#5FD0B5" opacity={0.45} stroke="#9BF0D8" strokeWidth={3} />
    {Array.from({ length: 9 }, (_, i) => { const px = -126 + i * 31 + desp * 24 * (0.6 + 0.4 * azar(i + 3)), py = -22 - 6 * azar(i); return <polygon key={i} points={`${px - 9},${py + 6} ${px - 3},${py - 8} ${px + 8},${py - 5} ${px + 10},${py + 5} ${px},${py + 9}`} fill="#F4F1E6" stroke="#B9B39B" strokeWidth={2} />; })}
  </g>
);

/** Cabeza de frente (círculo) con ojos que miran a `mira` px (−1..1 se mueve hacia el lado opuesto al giro). Origen = centro; alto ≈ 230·s. */
export const Cabeza: React.FC<{ x: number; y: number; s?: number; giro?: number; mira?: number; opacidad?: number }> = ({ x, y, s = 1, giro = 0, mira = 0, opacidad = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${giro})`} opacity={opacidad}>
    <ellipse rx={92} ry={116} fill={VAC.piel} stroke={VAC.trazo} strokeWidth={6} />
    {[-1, 1].map((sd) => (
      <g key={sd} transform={`translate(${sd * 36} -22)`}>
        <ellipse rx={20} ry={17} fill="#E4EAF8" /><circle cx={clamp(mira, -1, 1) * 8} r={8} fill="#0A0F1F" />
      </g>
    ))}
    <path d="M -26 56 Q 0 72 26 56" stroke="#E4EAF8" strokeWidth={6} fill="none" strokeLinecap="round" />
    <path d="M 0 -6 L -8 24 L 8 26" stroke="#8B97B8" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);
