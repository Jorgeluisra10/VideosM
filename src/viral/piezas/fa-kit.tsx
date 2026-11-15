/**
 * Kit del video «El par craneal VII: el nervio de los gestos» (SINAPSIS · pares craneales): ilustración vectorial esquemática sobre fondo oscuro, determinista.
 *   CaraGesto  cara de frente que sonríe, guiña, frunce el ceño, sopla o se cae de un lado (parálisis): ceja, arrugas de la frente, ojo, párpado y boca animables
 *   Gota       lágrima o gota de saliva
 *   Lengua     lengua con la punta resaltada
 * Color: rosa = nervio facial (VII) · rojo = parálisis y urgencia · dorado = pista y datos · azul = lágrimas · verde = confirmación.
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { clamp, easeOut, lerp, mezclar } from "../comun";
import { ME, Ambiente, Chip, azar, sua, FONT, MONOF, Cerebro } from "./me-kit";
import { PC } from "./pc-kit";
import { polyPt } from "./op-kit";
import { Flecha } from "./tr-kit";

export { ME, PC, Ambiente, Chip, Cerebro, Flecha, azar, sua, FONT, MONOF, clamp, easeOut, lerp, mezclar, polyPt };
export const FAC = { facial: "#FF7EC7", rojo: "#FF5A5F", oro: "#FFD166", azul: "#6AD0E6", verde: "#7BE08A", hueso: "#C8D2E8", gris: "#8B97B8", piel: "#1B2448", trazo: "#4A5C92" } as const;

export type GestoProps = {
  x: number; y: number; s?: number; opacidad?: number;
  /** sonrisa 0–1 */ sonrisa?: number;
  /** cejas: elevación 0–1 de la izquierda y de la derecha de la pantalla */ cejaI?: number; cejaD?: number;
  /** ceño fruncido 0–1 */ ceno?: number;
  /** guiño 0–1 del ojo derecho de la pantalla */ guino?: number;
  /** soplo 0–1 (boca en «o» y mejillas infladas) */ soplo?: number;
  /** lado de la parálisis: −1 = izquierda de la pantalla, 1 = derecha, 0 = ninguno */ lado?: -1 | 0 | 1;
  /** gravedad de la caída 0–1 */ caida?: number;
  /** 1 = la parálisis incluye la frente (periférica); 0 = la frente se salva (central) */ frenteCae?: number;
  /** arrugas de la frente 0–1 (al intentar levantar las cejas) */ frente?: number;
};

/** Cara de frente. Origen = centro; ancho ≈ 460·s, alto ≈ 580·s. */
export const CaraGesto: React.FC<GestoProps> = ({ x, y, s = 1, opacidad = 1, sonrisa = 0, cejaI = 0, cejaD = 0, ceno = 0, guino = 0, soplo = 0, lado = 0, caida = 0, frenteCae = 1, frente = 0 }) => {
  const dI = lado === -1 ? caida : 0, dD = lado === 1 ? caida : 0;
  const lado2 = (sd: -1 | 1): { d: number; ceja: number } => (sd === -1 ? { d: dI, ceja: cejaI } : { d: dD, ceja: cejaD });
  const brow = (sd: -1 | 1): React.ReactNode => {
    const { d, ceja } = lado2(sd), fCae = d * frenteCae;
    const yb = -140 - 40 * ceja * (1 - fCae) + 26 * fCae + 18 * ceno, yi = yb + 24 * ceno;
    return <path d={`M ${sd * 140} ${yb + 6 * (1 - ceno)} Q ${sd * 92} ${yb - 14} ${sd * 44} ${yi}`} stroke="#E4EAF8" strokeWidth={13} fill="none" strokeLinecap="round" />;
  };
  const ojo = (sd: -1 | 1): React.ReactNode => {
    const { d } = lado2(sd), cierre = sd === 1 ? clamp(guino) : 0, ancho = 1 + 0.18 * d;
    return (
      <g transform={`translate(${sd * 86} -85)`}>
        <ellipse rx={28 * ancho} ry={26 * ancho} fill="#E4EAF8" /><circle cy={3 * d} r={11} fill="#0A0F1F" />
        <ellipse cy={-26 * (1 - cierre) + 0} rx={30 * ancho} ry={26 * cierre + 0.01} fill={FAC.piel} stroke={FAC.trazo} strokeWidth={cierre > 0.05 ? 4 : 0} />
        {cierre > 0.5 && <path d="M -26 0 Q 0 14 26 0" stroke="#E4EAF8" strokeWidth={6} fill="none" strokeLinecap="round" />}
      </g>
    );
  };
  const cI = 135 - 30 * sonrisa + 38 * dI + (soplo > 0 ? 10 : 0) * 0, cD = 135 - 30 * sonrisa + 38 * dD;
  const xm = 75 * (1 - 0.7 * soplo);
  const centro = 165 + 18 * sonrisa - 6 * (dI + dD) * 0.5;
  const mejilla = (sd: -1 | 1): React.ReactNode => <circle cx={sd * 118} cy={112} r={34 * soplo} fill="#FF9BC2" opacity={0.7 * soplo} />;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
      <ellipse rx={230} ry={290} fill={FAC.piel} stroke={FAC.trazo} strokeWidth={7} />
      {frente > 0 && ([-1, 1] as const).map((sd) => { const fCae = lado2(sd).d * frenteCae; return <g key={sd} opacity={clamp(frente) * (1 - fCae)}>{[0, 1, 2].map((i) => <path key={i} d={`M ${sd * 60} ${-232 + i * 24} Q ${sd * 115} ${-248 + i * 24} ${sd * 170} ${-230 + i * 24}`} stroke="#8B97B8" strokeWidth={6} fill="none" strokeLinecap="round" />)}</g>; })}
      {brow(-1)}{brow(1)}{ojo(-1)}{ojo(1)}
      <path d="M 0 -60 L -16 30 L 14 34" stroke="#8B97B8" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {soplo < 0.2 ? <path d={`M ${-xm} ${cI} Q 0 ${centro} ${xm} ${cD}`} stroke="#E4EAF8" strokeWidth={9} fill="none" strokeLinecap="round" /> : <ellipse cx={0} cy={140} rx={22 + 8 * (1 - soplo)} ry={22} fill="#3A0A14" stroke="#E4EAF8" strokeWidth={7} />}
      {mejilla(-1)}{mejilla(1)}
      {lado !== 0 && caida > 0.3 && <path d={`M ${lado * 92} 100 Q ${lado * 122} 40 ${lado * 106} -10`} stroke={FAC.rojo} strokeWidth={5} fill="none" strokeDasharray="8 8" strokeLinecap="round" opacity={0.6 * caida} />}
    </g>
  );
};

/** Gota de lágrima o saliva. Origen = punta superior; alto ≈ 60·s. */
export const Gota: React.FC<{ x: number; y: number; s?: number; color?: string; opacidad?: number }> = ({ x, y, s = 1, color = FAC.azul, opacidad = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
    <path d="M 0 0 C 24 34 34 52 22 72 C 12 88 -12 88 -22 72 C -34 52 -24 34 0 0 Z" fill={color} stroke="#fff" strokeOpacity={0.6} strokeWidth={4} />
    <path d="M -8 40 C -12 52 -8 62 0 66" stroke="#fff" strokeOpacity={0.6} strokeWidth={5} fill="none" strokeLinecap="round" />
  </g>
);

/** Lengua de frente con la punta resaltada (`punta` 0–1). Origen = centro; ancho ≈ 190·s. */
export const Lengua: React.FC<{ x: number; y: number; s?: number; punta?: number; opacidad?: number }> = ({ x, y, s = 1, punta = 0, opacidad = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
    <path d="M -80 -70 C -90 40 -60 110 0 120 C 60 110 90 40 80 -70 C 40 -90 -40 -90 -80 -70 Z" fill="#E86A8A" stroke="#7A1E3A" strokeWidth={6} strokeLinejoin="round" />
    <path d="M 0 -80 L 0 70" stroke="#7A1E3A" strokeWidth={4} opacity={0.5} />
    <path d="M -56 70 C -40 108 40 108 56 70 C 30 120 -30 120 -56 70 Z" fill={mezclar("#E86A8A", FAC.oro, clamp(punta))} stroke="#fff" strokeOpacity={0.6 * punta} strokeWidth={4} />
    {punta > 0.1 && <circle cx={0} cy={96} r={60 + 6 * Math.sin(punta * 20)} fill="none" stroke={FAC.oro} strokeWidth={5} opacity={0.6 * punta} />}
  </g>
);
