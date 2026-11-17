/**
 * Kit del video «El par craneal X: el vago, el nervio errante» (SINAPSIS · pares craneales): ilustración vectorial esquemática sobre fondo oscuro, determinista.
 *   Torso   cuerpo de frente (cabeza, cuello, pulmones, corazón e intestino) con el vago a ambos lados y sus ramas a cada órgano
 *   Oreja   oreja con el conducto auditivo, un hisopo que se acerca y la rama auricular del vago
 *   Lazo    recorrido del nervio laríngeo recurrente: baja hasta el cayado de la aorta, gira y sube a la laringe (largo variable)
 * Color: verde = vago (X) · rojo = corazón y aorta · azul = pulmones · naranja = intestino · violeta = cerebro · dorado = datos.
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { clamp, easeOut, lerp, mezclar } from "../comun";
import { ME, Ambiente, Chip, Cerebro, Corazon, FONT, GLC, MONOF, Manometro, polyPt, azar } from "./gl-kit";

export { ME, Ambiente, Chip, Cerebro, Corazon, FONT, MONOF, GLC, Manometro, polyPt, azar, clamp, easeOut, lerp, mezclar };
export const VGC = { vago: "#9BE08A", rojo: "#FF5A5F", pulm: "#5C9BE8", gut: "#F0A46A", cereb: "#B78CFF", oro: "#FFD166", hueso: "#C8D2E8", gris: "#8B97B8", piel: "#1B2448", trazo: "#4A5C92" } as const;

const TORSO = "M 182 212 L 110 234 C 80 246 70 272 72 322 L 90 562 C 92 642 120 702 150 722 L 270 722 C 300 702 328 642 330 562 L 348 322 C 350 272 340 246 310 234 L 238 212 Z";
const PULM_I = "M 160 262 C 120 270 112 340 126 402 C 138 432 170 426 180 398 L 184 292 C 184 272 174 260 160 262 Z";
const PULM_D = "M 260 262 C 300 270 308 340 294 402 C 282 432 250 426 240 398 L 236 292 C 236 272 246 260 260 262 Z";
export const VR = {
  izq: [[200, 150], [190, 200], [178, 250], [168, 320], [176, 400], [186, 470], [196, 520]] as [number, number][],
  der: [[220, 150], [230, 200], [242, 250], [252, 320], [244, 400], [234, 470], [224, 520]] as [number, number][],
  corazon: [[178, 250], [196, 310], [214, 358]] as [number, number][],
  pulmI: [[170, 300], [152, 330]] as [number, number][],
  pulmD: [[250, 300], [268, 330]] as [number, number][],
  intestino: [[196, 520], [204, 548]] as [number, number][],
};
const d = (pts: [number, number][]): string => pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
/** punto de pantalla de un punto local del torso (centro local (210, 380) → (x, y)) */
export const pT = (x: number, y: number, s: number, lx: number, ly: number): [number, number] => [x + (lx - 210) * s, y + (ly - 380) * s];

export type TorsoProps = { x: number; y: number; s?: number; opacidad?: number; t?: number; v?: number; rc?: number; rp?: number; ri?: number; luzC?: number; luzP?: number; luzI?: number; freqC?: number; ritmoC?: number; cerebro?: number };
export const Torso: React.FC<TorsoProps> = ({ x, y, s = 1, opacidad = 1, t = 0, v = 0, rc = 0, rp = 0, ri = 0, luzC = 0, luzP = 0, luzI = 0, freqC = 9, ritmoC = 1, cerebro = 0.3 }) => {
  const dash = (k: number): string => `${clamp(k)} 2`;
  const intest: [number, number][] = [[150, 506], [270, 506], [270, 534], [150, 534], [150, 562], [270, 562], [270, 590], [150, 590], [150, 618], [270, 618]];
  return (
    <g transform={`translate(${x - 210 * s} ${y - 380 * s}) scale(${s})`} opacity={opacidad}>
      <ellipse cx={210} cy={90} rx={68} ry={82} fill={VGC.piel} stroke={VGC.trazo} strokeWidth={6} />
      <ellipse cx={210} cy={78} rx={52} ry={44} fill={mezclar("#201838", "#3A2A66", clamp(cerebro))} stroke={VGC.cereb} strokeWidth={4} />
      <rect x={182} y={150} width={56} height={70} fill={VGC.piel} stroke={VGC.trazo} strokeWidth={5} />
      <path d={TORSO} fill={VGC.piel} stroke={VGC.trazo} strokeWidth={6} strokeLinejoin="round" />
      <path d={PULM_I} fill={VGC.pulm} opacity={0.35 + 0.45 * luzP} stroke="#9CC4FF" strokeOpacity={0.6} strokeWidth={3} />
      <path d={PULM_D} fill={VGC.pulm} opacity={0.35 + 0.45 * luzP} stroke="#9CC4FF" strokeOpacity={0.6} strokeWidth={3} />
      <ellipse cx={250} cy={470} rx={38} ry={22} fill={VGC.gut} opacity={0.35 + 0.35 * luzI} transform="rotate(-20 250 470)" />
      <path d={d(intest)} fill="none" stroke="#6B3E22" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d(intest)} fill="none" stroke={mezclar("#C9825A", VGC.gut, clamp(luzI))} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
      <Corazon x={222} y={372} s={0.42} t={t} ritmo={ritmoC} freq={freqC} color={mezclar("#B8454A", VGC.rojo, 0.4 + 0.6 * luzC)} />
      {v > 0 && <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={d(VR.izq)} pathLength={1} stroke={VGC.vago} strokeWidth={8} strokeDasharray={dash(v)} />
        <path d={d(VR.der)} pathLength={1} stroke={VGC.vago} strokeWidth={8} strokeDasharray={dash(v)} />
        {rc > 0 && <path d={d(VR.corazon)} pathLength={1} stroke={VGC.vago} strokeWidth={7} strokeDasharray={dash(rc)} />}
        {rp > 0 && <><path d={d(VR.pulmI)} pathLength={1} stroke={VGC.vago} strokeWidth={7} strokeDasharray={dash(rp)} /><path d={d(VR.pulmD)} pathLength={1} stroke={VGC.vago} strokeWidth={7} strokeDasharray={dash(rp)} /></>}
        {ri > 0 && <path d={d(VR.intestino)} pathLength={1} stroke={VGC.vago} strokeWidth={7} strokeDasharray={dash(ri)} />}
      </g>}
    </g>
  );
};

/** Oreja de frente con el conducto, un hisopo (0–1 hacia el conducto) y la rama auricular del vago (0–1). Origen = centro; alto ≈ 300·s. */
export const Oreja: React.FC<{ x: number; y: number; s?: number; hisopo?: number; rama?: number; t?: number; opacidad?: number }> = ({ x, y, s = 1, hisopo = -1, rama = 0, t = 0, opacidad = 1 }) => {
  const hx = hisopo >= 0 ? lerp(-260, -34, easeOut(hisopo)) : -260;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
      <ellipse cx={4} cy={-6} rx={98} ry={142} transform="rotate(-6)" fill={VGC.piel} stroke={VGC.trazo} strokeWidth={8} />
      <ellipse cx={22} cy={10} rx={58} ry={102} transform="rotate(-6)" fill="none" stroke={VGC.trazo} strokeWidth={6} opacity={0.85} />
      <path d="M 30 -80 C 60 -40 62 20 40 70" fill="none" stroke={VGC.trazo} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
      <ellipse cx={-4} cy={128} rx={44} ry={28} fill={VGC.piel} stroke={VGC.trazo} strokeWidth={7} />
      <ellipse cx={-40} cy={6} rx={16} ry={24} fill={VGC.piel} stroke={VGC.trazo} strokeWidth={6} />
      <ellipse cx={-4} cy={-2} rx={26} ry={34} fill="#070B18" stroke="#3A4A7C" strokeWidth={5} />
      {rama > 0 && <path d="M -4 -2 C 40 -60 80 -120 120 -150 L 200 -190" pathLength={1} stroke={VGC.vago} strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray={`${clamp(rama)} 2`} />}
      {hisopo >= 0 && <g transform={`translate(${hx} 0)`}>
        <rect x={-150} y={-5} width={150} height={10} rx={5} fill="#E4EAF8" stroke="#8B97B8" strokeWidth={2} />
        <ellipse cx={4} cy={0} rx={18} ry={12} fill="#fff" stroke="#C8D2E8" strokeWidth={3} />
      </g>}
    </g>
  );
};

/** Recorrido del laríngeo recurrente: cerebro arriba, baja `largo` px, gira bajo el cayado de la aorta y sube a la laringe. Origen = arriba y centro. */
export const rutaLazo = (x: number, y0: number, largo: number): [number, number][] => {
  const y1 = y0 + largo;
  return [[x - 34, y0], [x - 34, y1 + 34], [x - 24, y1 + 48], [x - 8, y1 + 56], [x + 8, y1 + 56], [x + 24, y1 + 48], [x + 34, y1 + 34], [x + 34, y0 + 46]];
};
export const Lazo: React.FC<{ x: number; y0: number; largo: number; prog?: number; t?: number; opacidad?: number; color?: string }> = ({ x, y0, largo, prog = 1, t = 0, opacidad = 1, color = VGC.vago }) => {
  const y1 = y0 + largo, pts = rutaLazo(x, y0, largo);
  const [px, py] = polyPt(pts, (t * 0.35) % 1);
  return (
    <g opacity={opacidad}>
      <rect x={x - 54} y={y0 - 26} width={52} height={26} rx={8} fill="#251C44" stroke={VGC.cereb} strokeWidth={4} />
      <circle cx={x} cy={y1} r={26} fill="none" stroke={VGC.rojo} strokeWidth={14} opacity={0.85} />
      <rect x={x + 14} y={y0 + 22} width={58} height={26} rx={8} fill="#3A2A44" stroke={GLC.rojo} strokeWidth={0} />
      <path d={pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ")} pathLength={1} stroke={color} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${clamp(prog)} 2`} />
      {prog > 0.2 && <circle cx={px} cy={py} r={8} fill="#fff" />}
    </g>
  );
};

/** Intestino (asas apiladas). Origen = centro; ancho ≈ 140·s. */
export const Intestino: React.FC<{ x: number; y: number; s?: number; luz?: number; opacidad?: number }> = ({ x, y, s = 1, luz = 0, opacidad = 1 }) => {
  const pts: [number, number][] = [[-60, -52], [60, -52], [60, -26], [-60, -26], [-60, 0], [60, 0], [60, 26], [-60, 26], [-60, 52], [60, 52]];
  const dd = pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
      <path d={dd} fill="none" stroke="#6B3E22" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
      <path d={dd} fill="none" stroke={mezclar("#C9825A", VGC.gut, clamp(luz))} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};
