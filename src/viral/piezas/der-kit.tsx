/**
 * Kit de «Derinkuyu» (IMNOBA · ciudad subterránea de Capadocia · carril B). Todo en vectores, sin imágenes externas y con CASI NADA de texto: el corte
 * transversal ocupa TODA la pantalla y se explica solo (cámara que baja por los pisos, flechas de aire, puertas de piedra, gente y animales con vida propia).
 * Mundo: 1.080 px de ancho; la profundidad `y = metros × PPM`. Pozo central de ventilación (x = 540), dos pozos laterales (x = 60 y 1.020) y 18 niveles
 * con una sala a cada lado (izquierda x 100–440, derecha x 640–980), pasillos, escaleras de mano y puertas de piedra.
 *   Camara        mueve y escala el mundo (centro = (xc, yc), zoom)
 *   RocaFondo     toba volcánica: degradado, poros y vetas en todo el cuadro
 *   Superficie    cielo, sol, nubes, chimeneas de hadas, casas y pájaros (y < 0)
 *   Ciudad        los 18 niveles con sus salas (establo, casa, cocina, prensa, bodega, almacén, escuela, iglesia, refugio, pozo)
 *   Aire          partículas de aire frío que bajan y aire caliente que sube
 *   Aldeano, Soldado, Animal, Antorcha, PuertaPiedra, Casa (el sótano de la primera escena), Polvo
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeInOut, easeOut, lerp, mezclar, aclarar, oscurecer, useReloj } from "../comun";

export const DR = {
  roca: "#9A7448", rocaMed: "#6F5133", rocaOsc: "#3E2A1A", rocaNegra: "#150D07", luz: "#FFB347", brasa: "#FF7A2E", frio: "#6FD6FF", caliente: "#FF8A3D",
  piedra: "#BDAE90", cal: "#EADBB8", cielo0: "#1B2547", cielo1: "#E58F52", paja: "#D9B45C", oro: "#FFC500", piel: "#E8C39A",
} as const;
export const PPM = 52;
export const NIV = 18;
export const ALTO_SALA = 190;
/** y del piso del nivel k (0–17); el nivel 17 queda a ≈ 81 m de profundidad. */
export const pisoY = (k: number): number => (6 + 4.4 * k) * PPM;
export const metros = (y: number): number => Math.max(0, Math.round(y / PPM));
export const IZQ = { x: 100, w: 340 }, DER = { x: 640, w: 340 };
export const POZO = { c: 540, w: 60, izq: 60, der: 1020, wl: 28 };

/** Tipos de sala de cada nivel: [izquierda, derecha]. */
export const SALAS: [string, string][] = [
  ["establo", "establo"], ["establo", "almacen"], ["casa", "casa"], ["casa", "cocina"], ["casa", "prensa"], ["bodega", "bodega"],
  ["almacen", "cocina"], ["casa", "escuela"], ["casa", "casa"], ["almacen", "casa"], ["casa", "almacen"], ["casa", "casa"],
  ["iglesia", "iglesia"], ["casa", "almacen"], ["almacen", "casa"], ["casa", "casa"], ["refugio", "pozo"], ["refugio", "refugio"],
];

/* ───────────── cámara ───────────── */

export const Camara: React.FC<{ yc: number; zoom: number; xc?: number; dx?: number; dy?: number; children: React.ReactNode }> = ({ yc, zoom, xc = 540, dx = 0, dy = 0, children }) => (
  <g transform={`translate(${W / 2 + dx} ${H / 2 + dy}) scale(${zoom}) translate(${-xc} ${-yc})`}>{children}</g>
);

/* ───────────── roca ───────────── */

export const RocaFondo: React.FC<{ y0?: number; y1?: number; x0?: number; x1?: number; fresca?: number }> = ({ y0 = 0, y1 = 4700, x0 = -1500, x1 = 2600, fresca = 0 }) => {
  const uid = useUid();
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1={0} y1={y0} x2={0} y2={y1}><stop offset="0" stopColor={mezclar("#A47D4E", "#D9C7A0", fresca)} /><stop offset="0.5" stopColor={mezclar("#74553A", "#C9B48A", fresca)} /><stop offset="1" stopColor="#3E2A1A" /></linearGradient>
        <pattern id={`${uid}p`} width={240} height={240} patternUnits="userSpaceOnUse">
          {Array.from({ length: 34 }, (_, i) => <ellipse key={i} cx={azar(i * 3.3) * 240} cy={azar(i * 5.1) * 240} rx={3 + azar(i * 7.7) * 9} ry={2 + azar(i * 9.1) * 5} fill="#2A1B10" opacity={0.28} />)}
          {Array.from({ length: 22 }, (_, i) => <circle key={i} cx={azar(i * 11.3) * 240} cy={azar(i * 13.7) * 240} r={2 + azar(i * 4.9) * 4} fill="#D9BC8A" opacity={0.18} />)}
          {Array.from({ length: 4 }, (_, i) => <path key={i} d={`M 0 ${40 + i * 55} q 60 ${azar(i * 3) * 24 - 12} 120 0 t 120 0`} fill="none" stroke="#2A1B10" strokeWidth={2} opacity={0.2} />)}
        </pattern>
      </defs>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={`url(#${uid}g)`} />
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={`url(#${uid}p)`} />
    </g>
  );
};

/** Motas de polvo que flotan por TODO el cuadro (coordenadas de pantalla). */
export const Polvo: React.FC<{ t: number; n?: number; color?: string; vel?: number }> = ({ t, n = 46, color = "#FFE2B0", vel = 1 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const q = (t * (0.02 + azar(i * 3.1) * 0.05) * vel + azar(i * 9.7)) % 1;
      return <circle key={i} cx={(azar(i * 5.3) * W + Math.sin(t * 0.7 + i) * 26 + W) % W} cy={H * (1 - q)} r={1.5 + azar(i * 7.1) * 3} fill={color} opacity={0.35 * Math.sin(q * Math.PI)} />;
    })}
  </g>
);

/** Viñeta oscura de claustrofobia, con un círculo de luz cálido que respira (coordenadas de pantalla). */
export const Vineta: React.FC<{ t: number; fuerza?: number; cx?: number; cy?: number }> = ({ t, fuerza = 0.8, cx = W / 2, cy = H / 2 }) => {
  const uid = useUid();
  return (
    <g>
      <defs><radialGradient id={`${uid}v`} cx={cx / W} cy={cy / H} r="0.78"><stop offset="0.35" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity={fuerza} /></radialGradient></defs>
      <rect width={W} height={H} fill={`url(#${uid}v)`} />
      <rect width={W} height={H} fill="#FF9A3C" opacity={0.035 + 0.02 * Math.sin(t * 9)} />
    </g>
  );
};

/* ───────────── antorcha y llama ───────────── */

export const Antorcha: React.FC<{ x: number; y: number; t: number; s?: number; sem?: number; glow?: number }> = ({ x, y, t, s = 1, sem = 0, glow = 1 }) => {
  const f1 = 0.8 + 0.2 * Math.sin(t * 13 + sem * 2.1), f2 = 0.8 + 0.2 * Math.sin(t * 17 + sem * 3.7);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={120 * glow} fill="#FF9A3C" opacity={0.08 * f1} /><circle r={70 * glow} fill="#FFB347" opacity={0.12 * f2} /><circle r={34 * glow} fill="#FFD98A" opacity={0.2 * f1} />
      <rect x={-3} y={4} width={6} height={34} rx={2} fill="#5A3A1E" />
      <path d={`M -9 6 Q -12 -16 ${Math.sin(t * 11 + sem) * 3} ${-34 * f1} Q 12 -16 9 6 Z`} fill="#FF6A1E" />
      <path d={`M -5 5 Q -6 -8 ${Math.sin(t * 15 + sem) * 2} ${-20 * f2} Q 6 -8 5 5 Z`} fill="#FFB020" />
      <path d="M -2 4 Q -2 -2 0 -9 Q 2 -2 2 4 Z" fill="#FFF0B0" />
    </g>
  );
};

/* ───────────── personajes ───────────── */

export type PoseA = "quieto" | "camina" | "sienta" | "duerme" | "empuja" | "silencio" | "pica" | "reza" | "baila";
const ROPAS = ["#B35A3C", "#4E7A8A", "#8A6A9C", "#6E8A4E", "#C9A24A", "#A04A55", "#5A6EA8", "#8F7A58"];

/** Aldeano en vista lateral. Origen = centro de los pies; altura ≈ 52 px a escala 1. */
export const Aldeano: React.FC<{ x: number; y: number; s?: number; t?: number; sem?: number; pose?: PoseA; espejo?: boolean; color?: string; antorcha?: boolean; cabeza?: string }> = ({ x, y, s = 1, t = 0, sem = 0, pose = "quieto", espejo, color, antorcha, cabeza }) => {
  const col = color ?? ROPAS[Math.abs(Math.floor(sem * 7)) % ROPAS.length];
  const ph = t * 8 + sem * 2;
  const paso = pose === "camina" ? Math.sin(ph) * 9 : pose === "baila" ? Math.sin(ph * 1.6) * 8 : 0;
  const bob = pose === "camina" ? Math.abs(Math.sin(ph)) * -2.5 : pose === "baila" ? Math.abs(Math.sin(ph * 1.6)) * -5 : Math.sin(t * 2.2 + sem) * 0.8;
  const rot = pose === "duerme" ? 88 : pose === "empuja" ? 22 + Math.sin(ph * 0.7) * 5 : 0;
  const sentado = pose === "sienta" || pose === "reza";
  const brazo = pose === "pica" ? -80 + Math.sin(ph * 0.9) * 70 : pose === "silencio" ? -150 : pose === "empuja" ? -80 : pose === "baila" ? -120 + Math.sin(ph * 1.6) * 40 : pose === "camina" ? Math.sin(ph) * 25 : 8;
  return (
    <g transform={`translate(${x} ${y}) scale(${(espejo ? -1 : 1) * s} ${s})`}>
      <ellipse cx={0} cy={1} rx={13} ry={3} fill="#000" opacity={0.3} />
      <g transform={`rotate(${rot} 0 0) translate(0 ${bob})`}>
        {!sentado && <><line x1={-3} y1={-20} x2={-3 - paso} y2={-1} stroke="#2B1E14" strokeWidth={5} strokeLinecap="round" /><line x1={4} y1={-20} x2={4 + paso} y2={-1} stroke="#2B1E14" strokeWidth={5} strokeLinecap="round" /></>}
        {sentado && <><line x1={0} y1={-12} x2={13} y2={-12} stroke="#2B1E14" strokeWidth={5} strokeLinecap="round" /><line x1={13} y1={-12} x2={13} y2={-1} stroke="#2B1E14" strokeWidth={5} strokeLinecap="round" /></>}
        <rect x={-8} y={sentado ? -34 : -42} width={16} height={sentado ? 24 : 24} rx={6} fill={col} stroke={oscurecer(col, 0.45)} strokeWidth={1.5} />
        <g transform={`translate(5 ${sentado ? -30 : -38}) rotate(${brazo})`}>
          <line x1={0} y1={0} x2={0} y2={15} stroke={col} strokeWidth={4.5} strokeLinecap="round" />
          <circle cx={0} cy={16} r={2.6} fill={DR.piel} />
          {pose === "pica" && <g transform="translate(0 16)"><line x1={0} y1={0} x2={0} y2={-24} stroke="#5A3A1E" strokeWidth={3} /><path d="M -9 -24 L 9 -24 L 0 -30 Z" fill="#9AA0A4" /></g>}
          {antorcha && <g transform="translate(0 16)"><rect x={-1.5} y={-14} width={3} height={14} fill="#5A3A1E" /><path d={`M -5 -14 Q -6 -26 ${Math.sin(t * 12 + sem) * 2} ${-34 + Math.sin(t * 17 + sem) * 3} Q 6 -26 5 -14 Z`} fill="#FF8A2E" /><circle cy={-24} r={34} fill="#FFB347" opacity={0.12} /></g>}
        </g>
        <circle cx={1} cy={sentado ? -42 : -50} r={8} fill={DR.piel} stroke="#7A5A3A" strokeWidth={1} />
        <path d={`M -7 ${sentado ? -44 : -52} Q 1 ${sentado ? -54 : -62} 9 ${sentado ? -44 : -52} Z`} fill={cabeza ?? oscurecer(col, 0.3)} />
        <circle cx={4} cy={sentado ? -43 : -51} r={1.2} fill="#1A1008" />
        {pose === "silencio" && <line x1={3} y1={sentado ? -39 : -47} x2={9} y2={sentado ? -39 : -47} stroke="#7A5A3A" strokeWidth={1.5} />}
      </g>
    </g>
  );
};

/** Soldado invasor con casco y lanza (misma silueta que el aldeano, más rígido). Origen = pies. */
export const Soldado: React.FC<{ x: number; y: number; s?: number; t?: number; sem?: number; espejo?: boolean; busca?: boolean; duda?: number }> = ({ x, y, s = 1, t = 0, sem = 0, espejo, busca, duda = 0 }) => {
  const ph = t * 6 + sem;
  return (
    <g transform={`translate(${x} ${y}) scale(${(espejo ? -1 : 1) * s} ${s})`}>
      <ellipse cx={0} cy={1} rx={14} ry={3} fill="#000" opacity={0.3} />
      <line x1={-3} y1={-20} x2={-3 - Math.sin(ph) * 7} y2={-1} stroke="#2B2B33" strokeWidth={5} strokeLinecap="round" /><line x1={4} y1={-20} x2={4 + Math.sin(ph) * 7} y2={-1} stroke="#2B2B33" strokeWidth={5} strokeLinecap="round" />
      <rect x={-8} y={-42} width={16} height={24} rx={4} fill="#6A6E78" stroke="#2B2B33" strokeWidth={1.5} />
      <line x1={9} y1={-62} x2={9} y2={4} stroke="#5A3A1E" strokeWidth={3} /><path d="M 5 -62 L 9 -74 L 13 -62 Z" fill="#C9CED6" />
      <circle cx={1} cy={-50} r={8} fill={DR.piel} /><path d="M -9 -52 Q 1 -66 11 -52 L 11 -48 L -9 -48 Z" fill="#8A8F99" stroke="#2B2B33" strokeWidth={1.5} /><circle cx={5} cy={-50} r={1.3} fill="#1A1008" />
      {busca && <text x={0} y={-80 - Math.sin(t * 5) * 3} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={34} fill="#FFE27A" stroke="#1A1008" strokeWidth={5} paintOrder="stroke" opacity={clamp(duda * 3)}>?</text>}
    </g>
  );
};

/** Animales: caballo, burro, gallina y cabra. Origen = pezuñas. */
export const Animal: React.FC<{ x: number; y: number; s?: number; t?: number; sem?: number; tipo?: "caballo" | "burro" | "gallina" | "cabra"; espejo?: boolean; camina?: boolean }> = ({ x, y, s = 1, t = 0, sem = 0, tipo = "caballo", espejo, camina }) => {
  if (tipo === "gallina") {
    const pico = Math.max(0, Math.sin(t * 7 + sem * 3)) * 9;
    const paso = camina ? Math.sin(t * 14 + sem) * 4 : 0;
    return (
      <g transform={`translate(${x} ${y}) scale(${(espejo ? -1 : 1) * s} ${s})`}>
        <line x1={-3} y1={-9} x2={-3 + paso} y2={0} stroke="#E0A030" strokeWidth={2.5} /><line x1={4} y1={-9} x2={4 - paso} y2={0} stroke="#E0A030" strokeWidth={2.5} />
        <ellipse cx={0} cy={-16} rx={13} ry={10} fill="#F2E8D0" stroke="#A8946A" strokeWidth={1.5} />
        <path d="M -12 -16 Q -22 -26 -16 -30 Q -8 -26 -9 -18 Z" fill="#E9DCB6" />
        <circle cx={10} cy={-26 + pico * 0.4} r={6} fill="#F2E8D0" stroke="#A8946A" strokeWidth={1.5} />
        <path d={`M 15 ${-26 + pico * 0.4} L 22 ${-24 + pico * 0.5} L 15 ${-23 + pico * 0.4} Z`} fill="#F2A030" />
        <path d={`M 7 ${-32 + pico * 0.4} q 3 -6 6 0 q 3 -6 5 0`} fill="#E5432D" />
        <circle cx={12} cy={-27 + pico * 0.4} r={1} fill="#1A1008" />
      </g>
    );
  }
  const g = tipo === "burro" ? 0.78 : tipo === "cabra" ? 0.55 : 1;
  const col = tipo === "burro" ? "#8E8A84" : tipo === "cabra" ? "#E7DFD0" : "#7B4A26";
  const osc = oscurecer(col, 0.4);
  const mov = camina ? 1 : 0;
  const pata = (dx: number, f: number) => <line x1={dx} y1={-46} x2={dx + Math.sin(t * 8 + f) * 7 * mov} y2={-2} stroke={osc} strokeWidth={9} strokeLinecap="round" />;
  const resp = 1 + 0.02 * Math.sin(t * 2.4 + sem);
  return (
    <g transform={`translate(${x} ${y}) scale(${(espejo ? -1 : 1) * s * g} ${s * g})`}>
      <ellipse cx={0} cy={1} rx={52} ry={6} fill="#000" opacity={0.3} />
      {pata(-30, 0)}{pata(-18, 2)}{pata(26, 1)}{pata(38, 3)}
      <path d={`M -44 -64 Q -62 ${-64 + Math.sin(t * 3 + sem) * 14} -56 -30`} fill="none" stroke={osc} strokeWidth={6} strokeLinecap="round" />
      <ellipse cx={0} cy={-64} rx={50} ry={24 * resp} fill={col} stroke={osc} strokeWidth={2} />
      <path d={`M 34 -72 L ${60 + Math.sin(t * 2 + sem) * 2} -112 L 74 -104 L 52 -62 Z`} fill={col} stroke={osc} strokeWidth={2} />
      <ellipse cx={76} cy={-106} rx={17} ry={11} fill={col} stroke={osc} strokeWidth={2} transform={`rotate(${22 + Math.sin(t * 2 + sem) * 6} 76 -106)`} />
      <path d={`M 62 -116 L ${tipo === "burro" ? 58 : 64} ${tipo === "burro" ? -146 : -130} L 70 -114 Z`} fill={osc} />
      <circle cx={80} cy={-110} r={2.4} fill="#1A1008" />
      <path d="M 40 -76 q 8 -22 18 -34" fill="none" stroke={osc} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

/* ───────────── objetos ───────────── */

export const Tinaja: React.FC<{ x: number; y: number; s?: number; col?: string }> = ({ x, y, s = 1, col = "#B5683A" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -9 -52 Q -9 -44 -22 -34 Q -30 -16 -16 0 L 16 0 Q 30 -16 22 -34 Q 9 -44 9 -52 Z" fill={col} stroke={oscurecer(col, 0.45)} strokeWidth={2.5} />
    <ellipse cx={0} cy={-52} rx={12} ry={3.5} fill={oscurecer(col, 0.5)} />
    <path d="M -17 -26 Q 0 -20 17 -26" fill="none" stroke={oscurecer(col, 0.4)} strokeWidth={2} />
  </g>
);

/** Piedra de molino (disco con orificios para lanzas). Origen = centro. */
export const PuertaPiedra: React.FC<{ x: number; y: number; r?: number; rot?: number }> = ({ x, y, r = 100, rot = 0 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs><radialGradient id={`${uid}d`} cx="38%" cy="34%" r="75%"><stop offset="0" stopColor="#E6DCC4" /><stop offset="0.6" stopColor="#B7A98A" /><stop offset="1" stopColor="#6E634E" /></radialGradient></defs>
      <circle r={r} fill={`url(#${uid}d)`} stroke="#3E3626" strokeWidth={5} />
      <circle r={r * 0.88} fill="none" stroke="#6E634E" strokeWidth={3} opacity={0.6} />
      <g transform={`rotate(${rot})`}>
        <circle r={r * 0.16} fill="#4A4232" stroke="#2A2418" strokeWidth={3} />
        {[0, 90, 180, 270].map((a) => <line key={a} x1={0} y1={0} x2={r * 0.78} y2={0} stroke="#8F8266" strokeWidth={3} opacity={0.5} transform={`rotate(${a + 45})`} />)}
        <circle cx={r * 0.5} cy={0} r={r * 0.09} fill="#1A1208" />
        <circle cx={-r * 0.5} cy={0} r={r * 0.09} fill="#1A1208" />
      </g>
    </g>
  );
};

/* ───────────── salas ───────────── */

const SalaForma: React.FC<{ x: number; y: number; w: number; h: number; ton?: number }> = ({ x, y, w, h, ton = 0 }) => (
  <path d={`M ${x} ${y} L ${x} ${y - h + 40} Q ${x} ${y - h} ${x + 40} ${y - h} L ${x + w - 40} ${y - h} Q ${x + w} ${y - h} ${x + w} ${y - h + 40} L ${x + w} ${y} Z`} fill={mezclar("#2A1A0E", "#5A3A1E", 0.4 + ton * 0.3)} stroke="#150D07" strokeWidth={5} />
);

/** Contenido animado de una sala. (x, y) = esquina inferior izquierda; `gente` 0–1 = cuánta gente extra. */
export const Sala: React.FC<{ x: number; y: number; w: number; h?: number; tipo: string; t: number; sem: number; gente?: number; luz?: number }> = ({ x, y, w, h = ALTO_SALA, tipo, t, sem, gente = 0, luz = 1 }) => {
  const cx = x + w / 2;
  const extra = Math.floor(gente * 24);
  const piso = y - 6;
  const contenido = (): React.ReactNode => {
    switch (tipo) {
      case "establo": return (
        <g>
          <rect x={x + 20} y={piso - 22} width={w - 40} height={22} fill="#B99A50" stroke="#6A5420" strokeWidth={2} />
          {Array.from({ length: 12 }, (_, i) => <line key={i} x1={x + 28 + i * 25} y1={piso - 20} x2={x + 36 + i * 25} y2={piso - 4} stroke="#6A5420" strokeWidth={2} />)}
          <Animal x={x + 90} y={piso} s={1} t={t} sem={sem} tipo="caballo" />
          <Animal x={x + 230} y={piso} s={1} t={t} sem={sem + 1} tipo="burro" />
          <Animal x={x + 308} y={piso} s={1} t={t} sem={sem + 2} tipo="gallina" camina />
          <Aldeano x={x + 170} y={piso} s={1.1} t={t} sem={sem} pose="pica" />
        </g>
      );
      case "casa": return (
        <g>
          <rect x={x + 24} y={piso - 30} width={110} height={30} rx={6} fill="#8A5A3A" stroke="#3E2A1A" strokeWidth={3} /><rect x={x + 30} y={piso - 42} width={90} height={14} rx={6} fill="#D9C6A0" stroke="#8A7A5A" strokeWidth={2} />
          <rect x={x + 190} y={piso - 34} width={100} height={8} fill="#6A4A2A" /><line x1={x + 200} y1={piso - 26} x2={x + 200} y2={piso} stroke="#6A4A2A" strokeWidth={5} /><line x1={x + 282} y1={piso - 26} x2={x + 282} y2={piso} stroke="#6A4A2A" strokeWidth={5} />
          <Tinaja x={x + 240} y={piso - 34} s={0.45} />
          <Aldeano x={x + 76} y={piso - 42} s={0.9} t={t} sem={sem} pose="duerme" />
          <Aldeano x={x + 170} y={piso} s={1.1} t={t} sem={sem + 1} pose="quieto" />
          <Aldeano x={x + 310} y={piso} s={1} t={t} sem={sem + 2} pose="baila" espejo />
          <Antorcha x={x + w - 30} y={piso - 110} t={t} sem={sem} s={0.9} glow={luz} />
        </g>
      );
      case "cocina": return (
        <g>
          <path d={`M ${x + 40} ${piso} Q ${x + 40} ${piso - 80} ${x + 110} ${piso - 80} Q ${x + 180} ${piso - 80} ${x + 180} ${piso} Z`} fill="#8A5A3A" stroke="#3E2A1A" strokeWidth={4} />
          <path d={`M ${x + 85} ${piso} Q ${x + 85} ${piso - 40} ${x + 110} ${piso - 40} Q ${x + 135} ${piso - 40} ${x + 135} ${piso} Z`} fill="#1A0E06" />
          <g transform={`translate(${x + 110} ${piso - 2})`}>{Array.from({ length: 4 }, (_, i) => { const hh = 20 + 14 * Math.abs(Math.sin(t * 8 + i * 1.7 + sem)); return <path key={i} d={`M ${-18 + i * 12} 0 Q ${-20 + i * 12} ${-hh * 0.6} ${-12 + i * 12} ${-hh} Q ${-4 + i * 12} ${-hh * 0.6} ${-6 + i * 12} 0 Z`} fill={i % 2 ? "#FFB020" : "#FF6A1E"} />; })}</g>
          {Array.from({ length: 6 }, (_, i) => { const q = (t * 0.5 + i / 6 + sem) % 1; return <circle key={i} cx={x + 110 + Math.sin(i * 3 + t) * 10 * q} cy={piso - 90 - q * 70} r={7 + q * 15} fill="#CFC8BC" opacity={0.5 * (1 - q)} />; })}
          <Aldeano x={x + 250} y={piso} s={1.15} t={t} sem={sem} pose="pica" espejo />
          <Tinaja x={x + 300} y={piso} s={0.7} col="#A8553A" />
        </g>
      );
      case "prensa": return (
        <g>
          <ellipse cx={cx - 20} cy={piso - 4} rx={110} ry={10} fill="#7A6A4E" />
          <g transform={`translate(${cx - 20} ${piso - 56})`}><circle r={52} fill="#B7A98A" stroke="#4A4232" strokeWidth={4} /><g transform={`rotate(${t * 40})`}><circle r={8} fill="#4A4232" />{[0, 90].map((a) => <line key={a} x1={-46} y1={0} x2={46} y2={0} stroke="#6E634E" strokeWidth={4} transform={`rotate(${a})`} />)}</g></g>
          {Array.from({ length: 5 }, (_, i) => { const q = (t * 0.7 + i / 5) % 1; return <circle key={i} cx={cx + 70} cy={piso - 40 + q * 36} r={4} fill="#E8C438" opacity={1 - q * 0.5} />; })}
          <Tinaja x={cx + 70} y={piso} s={0.8} col="#C0834A" />
          <Animal x={x + 60} y={piso} s={0.8} t={t} sem={sem} tipo="burro" camina />
          <Aldeano x={x + 290} y={piso} s={1.1} t={t} sem={sem} pose="empuja" espejo />
        </g>
      );
      case "bodega": return (
        <g>
          {Array.from({ length: 5 }, (_, i) => <Tinaja key={i} x={x + 40 + i * 62} y={piso} s={1 + (i % 2) * 0.15} col={["#B5683A", "#A8553A", "#C0834A"][i % 3]} />)}
          {Array.from({ length: 4 }, (_, i) => { const q = (t * 0.6 + i / 4 + sem) % 1; return <circle key={i} cx={x + 60 + i * 80} cy={piso - 70 + q * 66} r={3.5} fill="#8E2A4A" opacity={1 - q * 0.6} />; })}
          <Aldeano x={x + 330} y={piso} s={1.1} t={t} sem={sem} pose="baila" espejo />
        </g>
      );
      case "almacen": return (
        <g>
          {Array.from({ length: 4 }, (_, i) => <Tinaja key={i} x={x + 36 + i * 52} y={piso} s={0.9 + (i % 2) * 0.2} col={["#B5683A", "#C0834A"][i % 2]} />)}
          {Array.from({ length: 3 }, (_, i) => <g key={i}><ellipse cx={x + 260 + i * 36} cy={piso - 16} rx={20} ry={16} fill="#D9C89A" stroke="#8A7A5A" strokeWidth={2} /></g>)}
          {Array.from({ length: 2 }, (_, i) => <ellipse key={i} cx={x + 278 + i * 36} cy={piso - 44} rx={20} ry={16} fill="#D9C89A" stroke="#8A7A5A" strokeWidth={2} />)}
          <Aldeano x={x + 215} y={piso} s={1} t={t} sem={sem} pose="camina" />
        </g>
      );
      case "escuela": return (
        <g>
          <rect x={x + 220} y={piso - 100} width={96} height={64} rx={4} fill="#2E3A2E" stroke="#8A6A3A" strokeWidth={4} />
          <path d={`M ${x + 232} ${piso - 80} q 14 -10 28 0 t 28 0`} fill="none" stroke="#EADBB8" strokeWidth={3} />
          <Aldeano x={x + 190} y={piso} s={1.2} t={t} sem={sem} pose="quieto" />
          {Array.from({ length: 5 }, (_, i) => <Aldeano key={i} x={x + 40 + i * 28} y={piso} s={0.7} t={t} sem={sem + i} pose="sienta" />)}
        </g>
      );
      case "iglesia": return (
        <g>
          <rect x={x + w / 2 - 22} y={piso - h + 20} width={44} height={h - 20} fill="#3A2412" opacity={0.7} />
          <path d={`M ${x + w / 2 - 8} ${piso - 170} h 16 v 40 h 40 v 16 h -40 v 60 h -16 v -60 h -40 v -16 h 40 Z`} fill="#F4E6B8" opacity={0.95} />
          {Array.from({ length: 6 }, (_, i) => <g key={i} transform={`translate(${x + 30 + i * 52} ${piso})`}><rect x={-2} y={-34} width={4} height={34} fill="#EADBB8" /><path d={`M -4 -34 Q ${Math.sin(t * 12 + i) * 1.5} ${-50 - Math.sin(t * 14 + i) * 3} 4 -34 Z`} fill="#FFB020" /></g>)}
          {Array.from({ length: 5 }, (_, i) => <Aldeano key={i} x={x + 60 + i * 52} y={piso} s={0.95} t={t} sem={sem + i} pose="reza" />)}
        </g>
      );
      case "refugio": return (
        <g>
          {Array.from({ length: 5 }, (_, i) => <Aldeano key={i} x={x + 50 + i * 58} y={piso - 2} s={0.85} t={t} sem={sem + i} pose={i % 2 ? "duerme" : "silencio"} />)}
          <Animal x={x + w - 60} y={piso} s={0.7} t={t} sem={sem} tipo="cabra" />
        </g>
      );
      case "pozo": return (
        <g>
          <rect x={cx - 16} y={y - h} width={32} height={h} fill="#0E0A06" />
          {Array.from({ length: 9 }, (_, i) => <line key={i} x1={cx - 16} y1={y - h + i * 20} x2={cx + 16} y2={y - h + i * 20} stroke="#4A3A28" strokeWidth={2} />)}
          <g transform={`translate(${cx} ${y - h + 40 + (0.5 + 0.5 * Math.sin(t * 1.2)) * 110})`}><line x1={0} y1={-200} x2={0} y2={-8} stroke="#8A6A3A" strokeWidth={2} /><path d="M -10 -8 L 10 -8 L 7 8 L -7 8 Z" fill="#7A5A32" stroke="#3E2A1A" strokeWidth={2} /></g>
          <Aldeano x={x + 80} y={piso} s={1} t={t} sem={sem} pose="empuja" />
          {Array.from({ length: 5 }, (_, i) => { const q = (t * 0.5 + i / 5) % 1; return <circle key={i} cx={cx + 40 + Math.sin(i * 4) * 8} cy={y - 20 - q * 90} r={3} fill="#6FD6FF" opacity={0.7 * (1 - q)} />; })}
        </g>
      );
      default: return null;
    }
  };
  return (
    <g>
      <SalaForma x={x} y={y} w={w} h={h} ton={luz} />
      <circle cx={cx} cy={y - h * 0.45} r={w * 0.62} fill="#FF9A3C" opacity={0.1 * luz} />
      <line x1={x} y1={y - 4} x2={x + w} y2={y - 4} stroke="#8A6A44" strokeWidth={6} opacity={0.55} />
      {contenido()}
      {extra > 0 && Array.from({ length: extra }, (_, i) => <Aldeano key={`g${i}`} x={x + 20 + ((i * 29 + sem * 13) % (w - 40))} y={piso - (i % 3) * 5} s={0.78} t={t} sem={sem + i * 0.3} pose={i % 3 ? "quieto" : "camina"} />)}
    </g>
  );
};

/* ───────────── ciudad completa ───────────── */

export const Ciudad: React.FC<{ t: number; yMin: number; yMax: number; luz?: number; gente?: number[]; apagarDesde?: number; foco?: number }> = ({ t, yMin, yMax, luz = 1, gente, apagarDesde = 99, foco }) => {
  const uid = useUid();
  const alto = pisoY(NIV - 1) + 120;
  return (
    <g>
      {/* pozos de ventilación */}
      <rect x={POZO.c - POZO.w / 2} y={0} width={POZO.w} height={alto} fill="#0E0905" stroke="#150D07" strokeWidth={4} />
      <rect x={POZO.izq - POZO.wl / 2} y={0} width={POZO.wl} height={pisoY(13)} fill="#0E0905" stroke="#150D07" strokeWidth={3} />
      <rect x={POZO.der - POZO.wl / 2} y={0} width={POZO.wl} height={pisoY(15)} fill="#0E0905" stroke="#150D07" strokeWidth={3} />
      {Array.from({ length: Math.floor(alto / 28) }, (_, i) => (28 * i + 60 > yMin - 40 && 28 * i < yMax + 40) ? <line key={i} x1={POZO.c - POZO.w / 2} y1={i * 28} x2={POZO.c + POZO.w / 2} y2={i * 28} stroke="#3A2A1A" strokeWidth={3} /> : null)}
      {Array.from({ length: NIV }, (_, k) => {
        const f = pisoY(k);
        if (f + 60 < yMin || f - ALTO_SALA - 260 > yMax) return null;
        const [ti, td] = SALAS[k];
        const apagado = k >= apagarDesde;
        const lz = apagado ? 0.0 : luz;
        const gk = gente ? gente[k] ?? 0 : 0;
        return (
          <g key={k}>
            {/* conexiones con los pozos laterales y corredor central */}
            <rect x={POZO.izq - 14} y={f - 74} width={IZQ.x - POZO.izq + 14} height={44} fill="#1C1209" />
            <rect x={DER.x + DER.w} y={f - 74} width={POZO.der - DER.x - DER.w + 14} height={44} fill="#1C1209" />
            <rect x={IZQ.x + IZQ.w - 4} y={f - 100} width={DER.x - IZQ.x - IZQ.w + 8} height={96} rx={10} fill="#241810" stroke="#150D07" strokeWidth={4} />
            <Sala x={IZQ.x} y={f} w={IZQ.w} tipo={ti} t={t} sem={k * 2 + 0.3} gente={gk} luz={lz} />
            <Sala x={DER.x} y={f} w={DER.w} tipo={td} t={t} sem={k * 2 + 1.3} gente={gk} luz={lz} />
            {/* escalera de mano al nivel siguiente */}
            {k < NIV - 1 && (
              <g transform={`translate(${k % 2 ? 612 : 470} ${f})`}>
                <rect x={-14} y={0} width={28} height={pisoY(k + 1) - f - 4} fill="#1C1209" />
                {Array.from({ length: 10 }, (_, i) => <line key={i} x1={-11} y1={14 + i * 22} x2={11} y2={14 + i * 22} stroke="#8A6A3A" strokeWidth={3} />)}
                {k % 3 === 0 && <Aldeano x={0} y={30 + ((t * 24 + k * 40) % 170)} s={0.5} t={t} sem={k} pose="camina" />}
              </g>
            )}
            <Antorcha x={POZO.c + (k % 2 ? 56 : -56)} y={f - 76} t={t} sem={k} s={0.6} glow={lz} />
            {apagado && <rect x={-20} y={f - ALTO_SALA - 20} width={1120} height={ALTO_SALA + 30} fill="#050302" opacity={0.74} />}
          </g>
        );
      })}
      {foco !== undefined && <rect x={0} y={pisoY(foco) - ALTO_SALA - 6} width={1080} height={ALTO_SALA + 10} fill="#FFE8B0" opacity={0.05 + 0.03 * Math.sin(t * 6)} />}
      <defs><linearGradient id={`${uid}x`} /></defs>
    </g>
  );
};

/* ───────────── aire ───────────── */

type Pt = [number, number];
const trayecto = (p: Pt[], u: number): Pt => {
  let L = 0; const seg: number[] = [];
  for (let i = 1; i < p.length; i++) { const d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); seg.push(d); L += d; }
  let r = clamp(u) * L;
  for (let i = 0; i < seg.length; i++) { if (r <= seg[i]) { const k = r / seg[i]; return [lerp(p[i][0], p[i + 1][0], k), lerp(p[i][1], p[i + 1][1], k)]; } r -= seg[i]; }
  return p[p.length - 1];
};

/** Lazos de aire: entra frío por el pozo central, recorre el nivel y sale caliente por un pozo lateral. `k` 0–1 = cuántos lazos se muestran; `calor` 0–1 = cuánto se calienta. */
export const Aire: React.FC<{ t: number; k?: number; calor?: number; escala?: number }> = ({ t, k = 1, calor = 1, escala = 1 }) => {
  const lazos: { p: Pt[]; col: number }[] = [
    { p: [[540, -60], [540, pisoY(2) - 60], [90, pisoY(2) - 60], [60, pisoY(2) - 60], [60, -60]], col: 0 },
    { p: [[540, -60], [540, pisoY(5) - 60], [990, pisoY(5) - 60], [1020, pisoY(5) - 60], [1020, -60]], col: 1 },
    { p: [[540, -60], [540, pisoY(8) - 60], [90, pisoY(8) - 60], [60, pisoY(8) - 60], [60, -60]], col: 0 },
    { p: [[540, -60], [540, pisoY(11) - 60], [990, pisoY(11) - 60], [1020, pisoY(11) - 60], [1020, -60]], col: 1 },
    { p: [[540, -60], [540, pisoY(14) - 60], [90, pisoY(14) - 60], [60, pisoY(14) - 60], [60, -60]], col: 0 },
  ];
  return (
    <g>
      {lazos.map((lz, li) => (li / lazos.length > k ? null : Array.from({ length: 34 }, (_, i) => {
        const u = (t * (0.11 + 0.02 * (li % 2)) + i / 34 + li * 0.13) % 1;
        const [x, y] = trayecto(lz.p, u);
        const [x2, y2] = trayecto(lz.p, clamp(u - 0.012));
        const caliente = clamp((u - 0.55) * 3) * calor;
        const col = mezclar("#6FD6FF", "#FF8A3D", caliente);
        return (
          <g key={`${li}-${i}`} opacity={clamp(u * 12) * clamp((1 - u) * 12)}>
            <line x1={x2} y1={y2} x2={x} y2={y} stroke={col} strokeWidth={9 * escala} strokeLinecap="round" opacity={0.45} />
            <circle cx={x} cy={y} r={7 * escala} fill={col} />
            <circle cx={x} cy={y} r={14 * escala} fill={col} opacity={0.18} />
          </g>
        );
      })))}
    </g>
  );
};


/* ───────────── galerías laterales (hormiguero de fondo para las vistas lejanas) ───────────── */

/** Cámaras y túneles pequeños a ambos lados de la ciudad, con antorchas y gente que va y viene: llenan de vida la roca cuando la cámara se aleja. */
export const Galerias: React.FC<{ t: number; yMin: number; yMax: number }> = ({ t, yMin, yMax }) => {
  const cams: React.ReactNode[] = [];
  for (const lado of [-1, 1]) {
    for (let i = 0; i < 26; i++) {
      const y = 140 + i * 175 + azar(i * 3.7 + lado) * 60;
      if (y < yMin - 200 || y > yMax + 200) continue;
      const w = 160 + azar(i * 5.3 + lado * 7) * 260, h = 86 + azar(i * 7.9 + lado) * 40;
      const x = lado < 0 ? -60 - 80 - azar(i * 9.1) * 560 - w + 400 : 1140 + azar(i * 9.1 + 3) * 440 - 0;
      const xs = lado < 0 ? Math.min(x, -120 - w) : Math.max(x, 1130);
      const sem = i * 1.9 + lado;
      cams.push(
        <g key={`${lado}-${i}`}>
          <path d={`M ${xs + (lado < 0 ? w : 0)} ${y - 20} L ${lado < 0 ? 40 : 1040} ${y - 20}`} stroke="#1C1209" strokeWidth={22} strokeLinecap="round" />
          <path d={`M ${xs} ${y} L ${xs} ${y - h + 30} Q ${xs} ${y - h} ${xs + 30} ${y - h} L ${xs + w - 30} ${y - h} Q ${xs + w} ${y - h} ${xs + w} ${y - h + 30} L ${xs + w} ${y} Z`} fill="#2A1A0E" stroke="#150D07" strokeWidth={4} />
          <circle cx={xs + w / 2} cy={y - h * 0.45} r={w * 0.5} fill="#FF9A3C" opacity={0.09} />
          <Antorcha x={xs + 26} y={y - h * 0.5} t={t} sem={sem} s={0.7} glow={0.7} />
          {Array.from({ length: 2 + (i % 2) }, (_, j) => <Aldeano key={j} x={xs + 30 + ((j * 71 + t * (22 + j * 9) * (j % 2 ? 1 : -1) + w * 5) % (w - 60 + 1 + 0) + (w - 60)) % (w - 60) } y={y - 6} s={0.9} t={t} sem={sem + j} pose="camina" espejo={j % 2 === 0} />)}
          {i % 3 === 0 && <Animal x={xs + w - 50} y={y - 6} s={0.55} t={t} sem={sem} tipo={i % 2 ? "burro" : "cabra"} />}
        </g>,
      );
    }
  }
  return <g>{cams}</g>;
};

/* ───────────── superficie ───────────── */

/** Superficie de Capadocia: cielo al atardecer, sol, nubes, colinas, chimeneas de hadas y casas. El suelo está en y = 0; el cielo llega hasta y = −1.700. */
export const Superficie: React.FC<{ t: number; vacia?: boolean }> = ({ t, vacia }) => {
  const uid = useUid();
  const chim = [[-420, 320], [-160, 220], [90, 280], [920, 300], [1180, 230], [1420, 340], [-620, 200]];
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1={0} y1={-1700} x2={0} y2={0}><stop offset="0" stopColor="#141C3C" /><stop offset="0.55" stopColor="#8A4F64" /><stop offset="1" stopColor="#F0A25C" /></linearGradient>
        <radialGradient id={`${uid}s`}><stop offset="0" stopColor="#FFF3C4" /><stop offset="0.4" stopColor="#FFD27A" stopOpacity="0.7" /><stop offset="1" stopColor="#FFB347" stopOpacity="0" /></radialGradient>
      </defs>
      <rect x={-1500} y={-1700} width={4100} height={1700} fill={`url(#${uid}c)`} />
      {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={-1000 + azar(i * 3.3) * 3200} cy={-1700 + azar(i * 5.1) * 900} r={1.5 + azar(i * 7.1) * 2} fill="#FFF" opacity={0.3 + 0.5 * Math.abs(Math.sin(t * 2 + i))} />)}
      <circle cx={760} cy={-210} r={300} fill={`url(#${uid}s)`} />
      {[0, 1, 2, 3].map((i) => <ellipse key={i} cx={((i * 560 + t * (18 + i * 6)) % 2400) - 700} cy={-1000 + i * 150} rx={220} ry={34} fill="#FFD9B0" opacity={0.16} />)}
      <path d="M -1500 -80 Q -1100 -260 -700 -100 T 100 -90 T 900 -120 T 1700 -80 T 2600 -100 L 2600 0 L -1500 0 Z" fill="#7A4A3A" opacity={0.9} />
      {chim.map(([x, h], i) => (
        <g key={i} transform={`translate(${x} 0)`}>
          <path d={`M -50 0 L -26 ${-h + 40} Q 0 ${-h - 18} 26 ${-h + 40} L 50 0 Z`} fill={["#C98A5A", "#B87850", "#D69A68"][i % 3]} stroke="#6A4028" strokeWidth={3} />
          <path d={`M -26 ${-h + 40} Q 0 ${-h - 18} 26 ${-h + 40} Q 0 ${-h + 20} -26 ${-h + 40} Z`} fill="#8A5A3A" />
          {i % 2 === 0 && <rect x={-7} y={-h * 0.45} width={14} height={20} rx={7} fill="#2A1608" />}
        </g>
      ))}
      {!vacia && [[260, 150], [520, 190]].map(([x, h], i) => <g key={i} transform={`translate(${x} 0)`}><rect x={-70} y={-h * 0.6} width={140} height={h * 0.6} fill="#D9B88A" stroke="#7A5A3A" strokeWidth={3} /><rect x={-20} y={-h * 0.4} width={40} height={h * 0.4} rx={6} fill="#4A2A14" /></g>)}
      {Array.from({ length: 6 }, (_, i) => { const q = (t * 0.08 + i / 6) % 1; return <path key={i} d={`M ${-300 + q * 2000 + i * 40} ${-520 - i * 70 + Math.sin(q * 20) * 10} q 12 -14 24 0 q 12 -14 24 0`} fill="none" stroke="#1A1220" strokeWidth={3} opacity={0.7} />; })}
      <rect x={-1500} y={0} width={4100} height={14} fill="#C9985C" />
    </g>
  );
};

/** Casa en corte (el sótano de la primera escena): paredes de piedra, techo, planta baja y sótano; la pared derecha del sótano se rompe (`rotura` 0–1). */
export const CasaCorte: React.FC<{ x: number; t: number; rotura?: number; luz?: number }> = ({ x, t, rotura = 0, luz = 1 }) => (
  <g transform={`translate(${x} 0)`}>
    <rect x={-210} y={-300} width={420} height={300} fill="#CDB68A" stroke="#6A5230" strokeWidth={6} />
    <path d="M -250 -300 L 0 -430 L 250 -300 Z" fill="#9A4A32" stroke="#4A2418" strokeWidth={6} />
    {Array.from({ length: 9 }, (_, i) => <line key={i} x1={-210 + i * 52} y1={-300} x2={-210 + i * 52} y2={0} stroke="#A88E62" strokeWidth={2} opacity={0.5} />)}
    <rect x={-160} y={-250} width={90} height={80} rx={6} fill="#F4D58A" stroke="#6A5230" strokeWidth={5} opacity={0.95} />
    <rect x={-210} y={0} width={420} height={150} fill="#2B1B10" stroke="#150D07" strokeWidth={6} />
    <rect x={-190} y={14} width={380} height={122} fill="#4A3220" />
    {Array.from({ length: 14 }, (_, i) => <rect key={i} x={-190 + (i % 7) * 54} y={14 + Math.floor(i / 7) * 61} width={52} height={59} fill="none" stroke="#2E2014" strokeWidth={2} />)}
    {/* tarros del sótano */}
    <Tinaja x={-120} y={136} s={0.9} /><Tinaja x={-70} y={136} s={0.7} col="#A8553A" />
    {/* pared que se rompe */}
    <g opacity={1 - clamp(rotura * 3)}><rect x={150} y={14} width={40} height={122} fill="#5A4026" stroke="#2E2014" strokeWidth={3} />{Array.from({ length: 5 }, (_, i) => <line key={i} x1={150} y1={14 + i * 24} x2={190} y2={14 + i * 24} stroke="#2E2014" strokeWidth={2} />)}</g>
    {rotura > 0 && <g>
      <path d="M 190 14 L 190 136 L 150 136 Q 170 76 150 14 Z" fill="#050302" opacity={clamp(rotura * 2)} />
      <circle cx={196} cy={76} r={110 * rotura} fill="#FFB347" opacity={0.18 * rotura * (0.8 + 0.2 * Math.sin(t * 9))} />
      {Array.from({ length: 12 }, (_, i) => { const q = clamp((rotura - i * 0.02) * 1.2); return <rect key={i} x={170 - q * (60 + (i % 4) * 30)} y={76 - Math.sin(q * Math.PI) * (60 + i * 8) + q * q * 60} width={16} height={12} fill="#8A6A44" stroke="#2E2014" strokeWidth={2} transform={`rotate(${q * 300 * (i % 2 ? 1 : -1)} ${170 - q * 60} ${76})`} opacity={1 - q * 0.4} />; })}
    </g>}
  </g>
);

export { H, W, easeInOut, easeOut, aclarar };
