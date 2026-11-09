/**
 * Kit del video «El par craneal I: el nervio que renace» (SINAPSIS · pares craneales): anatomía vectorial esquemática sobre fondo oscuro, determinista.
 *   Neurona     neurona esquemática (soma, dendritas y axón) que puede morir (se apaga) o nacer (crece)
 *   Epitelio    corte del techo de la nariz: aire y mucosa, neuronas olfatorias con cilios, células de soporte, células madre basales, axones que cruzan la
 *               lámina cribosa y llegan a los glomérulos del bulbo olfatorio; admite daño, renacimiento, golpe (axones cortados) y virus sobre las células de soporte
 *   Frasco      frasquito de aroma (rosa, limón, clavo, eucalipto)
 * Color: azul = neurona olfatoria · verde = neurona nueva / célula madre · ámbar = célula de soporte · rojo = daño / virus · 7 matices = tipos de receptor.
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { useUid } from "../../estudio/util";
import { clamp, easeOut, lerp, mezclar } from "../comun";
import { ME, Ambiente, Chip, azar, sua, FONT, MONOF } from "./me-kit";
import { PC } from "./pc-kit";

export { ME, PC, Ambiente, Chip, azar, sua, FONT, MONOF, clamp, easeOut, lerp, mezclar };
export const OLC = ["#FF6A8A", "#FFB347", "#F7E26B", "#7BE08A", "#4FD6D0", "#4FA3FF", "#B78CFF"] as const;
export const NUEVA = "#5CE0A0";
export const VIRUS = "#FF4D6D";

/* ───────────── neurona esquemática ───────────── */

/**
 * Neurona de frente: soma, 5 dendritas hacia arriba y axón hacia abajo. Origen = soma. `vida` 1 = viva · `muerta` 0–1 la apaga y la tacha · `nace` 0–1 la hace crecer
 * (si `nace` < 1 es una neurona en formación, en verde).
 */
export const Neurona: React.FC<{ x: number; y: number; s?: number; color?: string; muerta?: number; nace?: number; t?: number; brillo?: number }> = ({ x, y, s = 1, color = ME.sens, muerta = 0, nace = 1, t = 0, brillo = 0 }) => {
  const k = easeOut(nace), col = nace < 1 ? mezclar(NUEVA, color, clamp(nace * 1.1)) : mezclar(color, "#4A5470", clamp(muerta));
  const op = clamp(1 - muerta * 0.55) * clamp(nace * 3);
  const den = [[-34, -46], [-14, -58], [8, -60], [30, -50], [48, -30]] as const;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
      {brillo > 0 && <circle r={54 + 6 * Math.sin(t * 6)} fill={color} opacity={0.18 * brillo} />}
      <g stroke={col} strokeWidth={5} strokeLinecap="round" fill="none">
        {den.map(([dx, dy], i) => <path key={i} d={`M 0 0 L ${dx * k} ${dy * k}`} />)}
        <path d={`M 0 22 L 0 ${22 + 70 * k}`} />
      </g>
      <circle cy={0} r={22 * (0.5 + 0.5 * k)} fill={col} stroke="#fff" strokeOpacity={0.55} strokeWidth={3} />
      <circle cy={0} r={8} fill="#0B1220" opacity={0.55} />
      {muerta > 0.55 && <g opacity={clamp((muerta - 0.55) * 3)}><circle r={26} fill="#3A0A14" stroke={PC.rojo} strokeWidth={5} /><path d="M -10 -10 L 10 10 M 10 -10 L -10 10" stroke="#fff" strokeWidth={5} strokeLinecap="round" /></g>}
    </g>
  );
};

/* ───────────── corte del epitelio olfatorio ───────────── */

const XS = [-270, -180, -90, 0, 90, 180, 270] as const;
/** índices de las neuronas que mueren y renacen en la animación */
export const DAN = [2, 4] as const;
export type EpitelioProps = {
  x: number; y: number; s?: number; t?: number;
  /** 0–1 partículas de aire cayendo sobre la mucosa (cada 4ª es un tóxico) */
  aire?: number;
  /** 0–1 las neuronas DAN se apagan */
  dano?: number;
  /** 0–1 neuronas nuevas crecen desde las células madre en los huecos DAN */
  renace?: number;
  /** 0–1 las células madre brillan / se dividen */
  madre?: number;
  /** 0–1 las células de soporte se vuelven ámbar y luego rojas con el virus */
  soporte?: number;
  /** 0–1 partículas de virus que se posan sobre las células de soporte */
  virus?: number;
  /** 0–1 los axones descienden hasta los glomérulos */
  axones?: number;
  /** 0–1 el golpe corta los axones en la lámina cribosa */
  corte?: number;
  /** 0–1 muestra el bulbo olfatorio con los glomérulos */
  bulbo?: number;
  /** 1 = neuronas de 7 colores (tipos de receptor) */
  colores?: number;
};

export const Epitelio: React.FC<EpitelioProps> = ({ x, y, s = 1, t = 0, aire = 0, dano = 0, renace = 0, madre = 0, soporte = 0, virus = 0, axones = 1, corte = 0, bulbo = 1, colores = 0 }) => {
  const uid = useUid();
  const colN = (i: number): string => (colores > 0.5 ? OLC[i % OLC.length] : ME.sens);
  const sop = mezclar("#2B3556", soporte > 0.6 ? "#E0463C" : "#E0A23C", clamp(soporte));
  const xsop = [-315, -225, -135, -45, 45, 135, 225, 315];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><filter id={`${uid}b`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter></defs>
      {/* bulbo olfatorio */}
      <g opacity={bulbo}>
        <rect x={-340} y={222} width={680} height={170} rx={60} fill="#141C3C" stroke={PC.olfat} strokeWidth={4} />
        {XS.map((xx, i) => <circle key={i} cx={xx} cy={302} r={24} fill="#0C1226" stroke={OLC[i]} strokeWidth={4} />)}
      </g>
      {/* axones: epitelio → lámina propia → agujeros de la lámina cribosa → glomérulos */}
      {XS.map((xx, i) => {
        const isD = (DAN as readonly number[]).includes(i);
        const cortado = corte > 0.5;
        const yEnd = lerp(-13, 302, easeOut(axones));
        const col = colN(i);
        const aOp = isD ? 1 - 0.8 * clamp(dano) * (1 - renace) : 1;
        return (
          <g key={i} opacity={aOp}>
            <line x1={xx} y1={-13} x2={xx} y2={Math.min(yEnd, cortado ? 168 : 302)} stroke={col} strokeWidth={5} strokeLinecap="round" />
            {cortado && yEnd > 200 && <line x1={xx} y1={196} x2={xx} y2={yEnd} stroke={col} strokeWidth={5} strokeLinecap="round" opacity={0.35} strokeDasharray="4 10" />}
          </g>
        );
      })}
      {/* lámina cribosa */}
      <rect x={-340} y={166} width={680} height={26} rx={8} fill={PC.hueso} stroke="#5C6A90" strokeWidth={3} />
      {XS.map((xx, i) => <circle key={i} cx={xx} cy={179} r={7} fill="#0C1226" />)}
      {corte > 0.5 && XS.map((xx, i) => <g key={i} transform={`translate(${xx} 179)`} opacity={clamp((corte - 0.5) * 3) * (0.6 + 0.4 * Math.sin(t * 9 + i))}><path d="M -11 -11 L 11 11 M 11 -11 L -11 11" stroke={PC.rojo} strokeWidth={5} strokeLinecap="round" /></g>)}
      {corte > 0 && corte < 0.8 && <circle cx={0} cy={179} r={120 * corte} fill={PC.rojo} opacity={0.22 * (1 - corte)} filter={`url(#${uid}b)`} />}
      {/* lámina propia / membrana basal */}
      <line x1={-340} y1={66} x2={340} y2={66} stroke="#6C7BB0" strokeOpacity={0.5} strokeWidth={4} strokeDasharray="12 8" />
      {/* células de soporte */}
      {xsop.map((xx, i) => <rect key={i} x={xx - 17} y={-172} width={34} height={236} rx={14} fill={sop} opacity={0.85} stroke={mezclar("#5C6A90", "#FFD27A", clamp(soporte))} strokeWidth={3} />)}
      {/* células madre basales */}
      {xsop.map((xx, i) => (
        <g key={i}>
          <circle cx={xx - 22} cy={50} r={10} fill={NUEVA} opacity={0.55 + 0.45 * madre} />
          <circle cx={xx + 22} cy={50} r={10} fill={NUEVA} opacity={0.55 + 0.45 * madre} />
        </g>
      ))}
      {madre > 0 && XS.map((xx, i) => (DAN as readonly number[]).includes(i) ? <circle key={i} cx={xx} cy={48} r={22 + 8 * Math.sin(t * 7)} fill="none" stroke={NUEVA} strokeWidth={4} opacity={0.5 * madre} /> : null)}
      {/* neuronas */}
      {XS.map((xx, i) => {
        const isD = (DAN as readonly number[]).includes(i);
        const col = colN(i);
        const muerta = isD ? dano : 0;
        const vieja = mezclar(col, "#4A5470", clamp(muerta));
        const opV = isD ? clamp(1 - muerta * 0.65) * (1 - clamp(renace * 2)) : 1;
        return (
          <g key={i}>
            <g opacity={opV}>
              <line x1={xx} y1={-35} x2={xx} y2={-164} stroke={vieja} strokeWidth={5} strokeLinecap="round" />
              <circle cx={xx} cy={-168} r={9} fill={vieja} stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />
              {[-1, 0, 1].map((c) => <line key={c} x1={xx} y1={-170} x2={xx + c * 22} y2={-198 + Math.abs(c) * 6} stroke={vieja} strokeWidth={2.4} strokeLinecap="round" opacity={0.85} />)}
              <ellipse cx={xx} cy={-35} rx={16} ry={24} fill={vieja} stroke="#fff" strokeOpacity={0.5} strokeWidth={3} />
              {muerta > 0.6 && <g transform={`translate(${xx} -35)`} opacity={clamp((muerta - 0.6) * 3)}><circle r={14} fill="#3A0A14" stroke={PC.rojo} strokeWidth={4} /><path d="M -6 -6 L 6 6 M 6 -6 L -6 6" stroke="#fff" strokeWidth={4} strokeLinecap="round" /></g>}
            </g>
            {isD && renace > 0 && (
              <g opacity={clamp(renace * 3)}>
                <line x1={xx} y1={lerp(40, -35, easeOut(renace))} x2={xx} y2={lerp(40, -164, easeOut(renace))} stroke={NUEVA} strokeWidth={5} strokeLinecap="round" />
                <circle cx={xx} cy={lerp(40, -168, easeOut(renace))} r={9} fill={NUEVA} stroke="#fff" strokeOpacity={0.6} strokeWidth={2} />
                <ellipse cx={xx} cy={lerp(46, -35, easeOut(renace))} rx={16} ry={24} fill={NUEVA} stroke="#fff" strokeOpacity={0.6} strokeWidth={3} />
                <line x1={xx} y1={lerp(46, -11, easeOut(renace))} x2={xx} y2={lerp(46, 302, easeOut(renace) * axones)} stroke={NUEVA} strokeWidth={5} strokeLinecap="round" strokeDasharray={renace < 1 ? "3 9" : "0"} />
              </g>
            )}
          </g>
        );
      })}
      {/* mucosa */}
      <path d={`M -340 -200 ${Array.from({ length: 12 }, (_, i) => `L ${-340 + (i + 1) * 56.7} ${-200 + 3 * Math.sin(t * 2 + i)}`).join(" ")} L 340 -172 L -340 -172 Z`} fill="#6AD0E6" opacity={0.2} stroke="#6AD0E6" strokeOpacity={0.5} strokeWidth={3} />
      {/* aire y tóxicos */}
      {aire > 0 && Array.from({ length: 22 }, (_, i) => {
        const u = ((azar(i * 4.1) + t * (0.18 + 0.1 * azar(i))) % 1), px = lerp(-330, 330, azar(i * 7.3)) + 30 * Math.sin(t * 2 + i) + u * 40, py = lerp(-330, -206, u);
        const toxico = i % 4 === 0;
        return <circle key={i} cx={px} cy={py} r={toxico ? 8 : 5} fill={toxico ? VIRUS : "#BFE0FF"} opacity={aire * (toxico ? 0.95 : 0.55) * (1 - sua(u, 0.85, 1))} />;
      })}
      {/* virus sobre las células de soporte */}
      {virus > 0 && xsop.map((xx, i) => {
        const ky = easeOut(clamp(virus * 1.4 - i * 0.05)), py = lerp(-290, -182, ky);
        return (
          <g key={i} transform={`translate(${xx} ${py})`} opacity={clamp(virus * 3)}>
            <circle r={11} fill={VIRUS} stroke="#fff" strokeOpacity={0.7} strokeWidth={2} />
            {Array.from({ length: 8 }, (_, k) => { const a = (k / 8) * Math.PI * 2; return <line key={k} x1={Math.cos(a) * 11} y1={Math.sin(a) * 11} x2={Math.cos(a) * 17} y2={Math.sin(a) * 17} stroke={VIRUS} strokeWidth={3} strokeLinecap="round" />; })}
          </g>
        );
      })}
    </g>
  );
};
/** punto de pantalla de un punto local del epitelio */
export const pEp = (x: number, y: number, s: number, lx: number, ly: number): [number, number] => [x + s * lx, y + s * ly];

/* ───────────── frasco de aroma ───────────── */

export const Frasco: React.FC<{ x: number; y: number; s?: number; color: string; texto: string; k?: number }> = ({ x, y, s = 1, color, texto, k = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s * (0.6 + 0.4 * easeOut(k))})`} opacity={clamp(k * 2)}>
    <rect x={-14} y={-64} width={28} height={20} rx={5} fill="#C8D2E8" stroke="#5C6A90" strokeWidth={3} />
    <path d="M -34 -44 L 34 -44 L 40 40 C 40 52 -40 52 -40 40 Z" fill="#141C3C" stroke="#8B97B8" strokeWidth={4} strokeLinejoin="round" />
    <path d="M -36 -8 L 36 -8 L 40 40 C 40 52 -40 52 -40 40 Z" fill={color} opacity={0.85} />
    <text y={86} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={22} fill={color}>{texto}</text>
  </g>
);

export { FONT as OLFONT };
