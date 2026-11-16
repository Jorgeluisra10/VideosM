/**
 * Kit del video «El par craneal IX: el nervio de la arcada y la presión» (SINAPSIS · pares craneales): ilustración vectorial esquemática sobre fondo oscuro, determinista.
 *   Perfil     cabeza y cuello de perfil (cara a la derecha) con cerebro, tronco, boca, lengua, faringe, arteria carótida y glándula parótida; el IX y sus ramas se dibujan encima
 *   Cepillo    cepillo de dientes que se acerca al fondo de la garganta
 *   Persona    figura humana simple (se puede resaltar)
 *   Manometro  reloj de presión con aguja
 *   Corazon    corazón con latido
 * Color: naranja = glosofaríngeo (IX) · verde = vago (X) · rojo = arcada, dolor y arteria · violeta = cerebro · rosa = lengua · dorado = datos.
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { clamp, easeOut, lerp, mezclar } from "../comun";
import { ME, Ambiente, Chip, Cerebro, FONT, MONOF, polyPt, azar } from "./fa-kit";

export { ME, Ambiente, Chip, Cerebro, FONT, MONOF, polyPt, azar, clamp, easeOut, lerp, mezclar };
export const GLC = { ix: "#FF9F5A", vago: "#9BE08A", rojo: "#FF5A5F", cereb: "#B78CFF", lengua: "#E86A8A", oro: "#FFD166", hueso: "#C8D2E8", gris: "#8B97B8", piel: "#1B2448", trazo: "#4A5C92", azul: "#6AD0E6", glandula: "#4FA08A" } as const;

const CABEZA = "M 190 740 C 192 650 186 590 160 548 C 96 514 66 430 76 330 C 88 190 190 90 320 94 C 450 98 524 190 526 292 C 527 330 540 352 562 392 C 574 414 556 424 534 426 C 534 444 548 452 548 470 C 548 486 528 490 524 500 C 534 520 540 548 516 574 C 486 606 448 610 430 632 C 420 668 428 706 436 740 Z";
const CEREBRO = "M 110 340 C 90 190 190 120 320 124 C 450 130 500 210 490 300 C 485 340 440 360 400 366 C 330 376 250 376 190 366 C 140 358 112 350 110 340 Z";
const TRONCO = "M 238 366 L 264 366 C 272 420 264 462 260 500 L 224 500 C 222 450 226 410 238 366 Z";
const LENGUA = "M 524 500 C 480 480 410 488 340 522 C 322 534 320 580 336 592 C 380 604 446 566 524 506 Z";
const BOCA = "M 524 498 C 470 462 380 466 318 496 L 318 560 C 330 584 360 596 400 596 C 460 590 500 540 524 506 Z";
/** rutas del IX y su entorno (coordenadas locales de Perfil) */
export const RUTA = {
  ix: [[250, 440], [256, 470], [272, 496], [300, 516], [318, 530]] as [number, number][],
  lengua: [[318, 530], [326, 552], [332, 578]] as [number, number][],
  faringe: [[304, 520], [298, 550], [296, 590], [298, 640]] as [number, number][],
  seno: [[308, 524], [340, 570], [372, 620], [392, 648]] as [number, number][],
  parotida: [[262, 452], [230, 456], [200, 462], [178, 476]] as [number, number][],
  vago: [[244, 446], [244, 490], [262, 550], [292, 600]] as [number, number][],
};
const d = (pts: [number, number][]): string => pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
/** punto de pantalla de un punto local de Perfil (centro local (320, 420) → (x, y)) */
export const pP = (x: number, y: number, s: number, lx: number, ly: number): [number, number] => [x + (lx - 320) * s, y + (ly - 420) * s];

export type PerfilProps = {
  x: number; y: number; s?: number; opacidad?: number; t?: number;
  /** progreso 0–1 del IX principal y de sus ramas */ ix?: number; rl?: number; rf?: number; rs?: number; rp?: number;
  /** vago (X) 0–1 */ vago?: number;
  /** cepillo 0–1 (hacia el fondo de la garganta); −1 = oculto */ toque?: number;
  /** arcada 0–1 (destello rojo en la garganta) */ arcada?: number;
  /** nervio irritado 0–1 (zigzag rojo en el IX) */ irrita?: number;
  /** brillo 0–1 del seno carotídeo */ seno?: number;
  /** brillo del cerebro */ cerebro?: number;
};
export const Perfil: React.FC<PerfilProps> = ({ x, y, s = 1, opacidad = 1, t = 0, ix = 0, rl = 0, rf = 0, rs = 0, rp = 0, vago = 0, toque = -1, arcada = 0, irrita = 0, seno = 0, cerebro = 0.3 }) => {
  const dash = (k: number): string => `${clamp(k)} 2`;
  const zig = RUTA.ix.map((p, i) => [p[0] + (i % 2 ? 7 : -7) * Math.sin(t * 20 + i), p[1] + 3 * Math.cos(t * 17 + i)] as [number, number]);
  const bx = toque >= 0 ? lerp(700, 346, easeOut(toque)) : 700;
  return (
    <g transform={`translate(${x - 320 * s} ${y - 420 * s}) scale(${s})`} opacity={opacidad}>
      <path d={CABEZA} fill={GLC.piel} stroke={GLC.trazo} strokeWidth={6} strokeLinejoin="round" />
      <path d={CEREBRO} fill={mezclar("#201838", "#3A2A66", clamp(cerebro))} stroke={GLC.cereb} strokeWidth={4} strokeLinejoin="round" />
      <g fill="none" stroke={GLC.cereb} strokeOpacity={0.3} strokeWidth={4} strokeLinecap="round"><path d="M 150 270 C 190 210 240 250 270 190" /><path d="M 330 190 C 370 230 420 200 460 260" /><path d="M 170 330 C 230 300 280 330 340 300 C 390 280 430 310 470 300" /></g>
      <path d={TRONCO} fill="#2E2452" stroke={GLC.cereb} strokeWidth={3} />
      <rect x={224} y={500} width={36} height={240} fill="#2A2F52" stroke="#4A4F82" strokeWidth={3} />
      {/* boca, lengua y garganta */}
      <path d={BOCA} fill="#070B18" stroke="#3A4A7C" strokeWidth={3} />
      <path d={LENGUA} fill={GLC.lengua} stroke="#7A1E3A" strokeWidth={4} strokeLinejoin="round" />
      <rect x={272} y={500} width={46} height={240} fill="#070B18" stroke="#3A4A7C" strokeWidth={3} />
      <rect x={326} y={560} width={46} height={180} fill="#0B1126" stroke="#3A4A7C" strokeWidth={3} />
      <ellipse cx={166} cy={484} rx={30} ry={40} fill={GLC.glandula} opacity={0.55} stroke="#9BF0D8" strokeOpacity={0.5} strokeWidth={3} />
      {/* arteria carótida y seno */}
      <path d="M 392 740 L 392 652 C 392 626 404 606 418 570" stroke={GLC.rojo} strokeWidth={20} fill="none" strokeLinecap="round" opacity={0.85} />
      <path d="M 392 652 C 392 632 382 614 372 592" stroke={GLC.rojo} strokeWidth={16} fill="none" strokeLinecap="round" opacity={0.7} />
      <ellipse cx={394} cy={648} rx={24 + 5 * Math.sin(t * 6) * seno} ry={28 + 5 * Math.sin(t * 6) * seno} fill={GLC.rojo} opacity={0.55 + 0.4 * seno} stroke="#fff" strokeOpacity={0.5} strokeWidth={3} />
      {/* nervio IX */}
      {ix > 0 && <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={d(RUTA.ix)} pathLength={1} stroke={GLC.ix} strokeWidth={9} strokeDasharray={dash(ix)} />
        {rl > 0 && <path d={d(RUTA.lengua)} pathLength={1} stroke={GLC.ix} strokeWidth={8} strokeDasharray={dash(rl)} />}
        {rf > 0 && <path d={d(RUTA.faringe)} pathLength={1} stroke={GLC.ix} strokeWidth={8} strokeDasharray={dash(rf)} />}
        {rs > 0 && <path d={d(RUTA.seno)} pathLength={1} stroke={GLC.ix} strokeWidth={8} strokeDasharray={dash(rs)} />}
        {rp > 0 && <path d={d(RUTA.parotida)} pathLength={1} stroke={GLC.ix} strokeWidth={8} strokeDasharray={dash(rp)} />}
      </g>}
      {vago > 0 && <path d={d(RUTA.vago)} pathLength={1} stroke={GLC.vago} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash(vago)} />}
      {irrita > 0 && <g opacity={irrita}><path d={d(zig)} stroke={GLC.rojo} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" /><circle cx={300} cy={516} r={26 + 6 * Math.sin(t * 14)} fill={GLC.rojo} opacity={0.3} /></g>}
      {/* cepillo */}
      {toque >= 0 && <g transform={`translate(${bx} 524)`}>
        <rect x={0} y={-8} width={300} height={16} rx={8} fill="#E4EAF8" stroke="#8B97B8" strokeWidth={3} />
        <rect x={-46} y={-14} width={50} height={28} rx={8} fill="#6AD0E6" />
        {Array.from({ length: 7 }, (_, i) => <line key={i} x1={-42 + i * 7} y1={-14} x2={-42 + i * 7} y2={-30} stroke="#fff" strokeWidth={4} strokeLinecap="round" />)}
      </g>}
      {arcada > 0 && <g opacity={clamp(1.4 - arcada)} transform="translate(310 548)">
        {[0, 1, 2].map((i) => <circle key={i} r={20 + 70 * arcada + i * 18} fill="none" stroke={GLC.rojo} strokeWidth={8 - 2 * i} opacity={0.9 - 0.25 * i} />)}
      </g>}
    </g>
  );
};

/** Figura humana simple. Origen = centro; alto ≈ 120·s. */
export const Persona: React.FC<{ x: number; y: number; s?: number; color?: string; opacidad?: number; resalta?: number }> = ({ x, y, s = 1, color = "#5C6A90", opacidad = 1, resalta = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
    <circle cy={-40} r={20} fill={mezclar(color, GLC.oro, clamp(resalta))} />
    <path d="M -26 56 C -28 16 -22 -8 0 -12 C 22 -8 28 16 26 56 Z" fill={mezclar(color, GLC.oro, clamp(resalta))} />
  </g>
);

/** Reloj de presión con aguja (valor −1..1). Origen = centro; radio ≈ 90·s. */
export const Manometro: React.FC<{ x: number; y: number; s?: number; valor?: number; opacidad?: number }> = ({ x, y, s = 1, valor = 0, opacidad = 1 }) => {
  const an = -Math.PI / 2 + clamp(valor, -1, 1) * 1.1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
      <circle r={90} fill="rgba(11,18,40,0.92)" stroke={GLC.oro} strokeWidth={7} />
      {Array.from({ length: 9 }, (_, i) => { const a = -Math.PI / 2 - 1.1 + (i * 2.2) / 8; return <line key={i} x1={Math.cos(a) * 70} y1={Math.sin(a) * 70} x2={Math.cos(a) * 82} y2={Math.sin(a) * 82} stroke={GLC.hueso} strokeWidth={4} strokeLinecap="round" />; })}
      <line x1={0} y1={0} x2={Math.cos(an) * 66} y2={Math.sin(an) * 66} stroke={valor > 0.5 ? GLC.rojo : GLC.vago} strokeWidth={8} strokeLinecap="round" />
      <circle r={10} fill={GLC.hueso} />
    </g>
  );
};

/** Corazón con latido (`ritmo` 1 = latiendo, 0 = quieto). Origen = centro; ancho ≈ 140·s. */
export const Corazon: React.FC<{ x: number; y: number; s?: number; t?: number; ritmo?: number; opacidad?: number; color?: string }> = ({ x, y, s = 1, t = 0, ritmo = 1, opacidad = 1, color = GLC.rojo }) => {
  const lat = 1 + 0.1 * Math.max(0, Math.sin(t * 9)) * ritmo;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * lat})`} opacity={opacidad}>
      <path d="M 0 60 C -90 -2 -78 -60 -36 -60 C -14 -60 0 -44 0 -30 C 0 -44 14 -60 36 -60 C 78 -60 90 -2 0 60 Z" fill={color} stroke="#fff" strokeOpacity={0.5} strokeWidth={4} />
    </g>
  );
};
