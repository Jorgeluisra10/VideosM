/**
 * Kit de figuras del video «La regla del 37 %» (IMNOBA): casas dibujadas como renders (paredes con volumen, techo de teja, ventanas con luz, puerta, jardín),
 * mini casas para cuadrículas, siluetas de candidatas, un dado, una señal de sentido único y una copa. Todo SVG, sin imágenes externas, sobre el estudio azul marino
 * de real-kit.tsx (Estudio, Reflejo, Frases, Persona…). Origen de cada figura: centro de su base (y negativa = hacia arriba). Los tamaños nunca son negativos.
 */
import React from "react";
import { useUid } from "../../estudio/util";
import { aclarar, clamp, oscurecer } from "../comun";
import { FONT, MONOF, RE, Sombra } from "./real-kit";

const TONOS = [
  { pared: "#F2E6D0", sombra: "#C9B48E", techo: "#C0492F", techoOsc: "#7A281A" },
  { pared: "#DCE8F5", sombra: "#A3BBD6", techo: "#46587A", techoOsc: "#222D44" },
  { pared: "#F6F4EF", sombra: "#CBCAC1", techo: "#8A5532", techoOsc: "#4E2C18" },
  { pared: "#E9D7B6", sombra: "#BBA076", techo: "#52744F", techoOsc: "#2B4029" },
  { pared: "#DDBBA8", sombra: "#AE8873", techo: "#33425E", techoOsc: "#192238" },
] as const;

export type EstadoCasa = "normal" | "rechazada" | "elegida" | "vendida";

/** Casa de frente (≈ 220 × 190 a escala 1) con ventanas que se encienden (`luz` 0–1) y un estado: rechazada (apagada con ✕), elegida (aura dorada y ✓) o vendida (cinta roja). */
export const Casa: React.FC<{ x: number; y: number; s?: number; tono?: number; luz?: number; estado?: EstadoCasa; brillo?: number }> = ({ x, y, s = 1, tono = 0, luz = 0.7, estado = "normal", brillo = 1 }) => {
  const uid = useUid();
  const C = TONOS[((Math.round(tono) % TONOS.length) + TONOS.length) % TONOS.length];
  const ventana = (vx: number): React.ReactNode => (
    <g transform={`translate(${vx} -80)`}>
      <rect x={-19} y={-3} width={38} height={44} rx={3} fill="#FFFFFF" />
      <rect x={-16} y={0} width={32} height={38} rx={2} fill={`url(#${uid}g)`} />
      <rect x={-16} y={0} width={32} height={38} rx={2} fill="#FFD98A" opacity={0.55 * clamp(luz)} />
      <line x1={0} y1={0} x2={0} y2={38} stroke="#FFFFFF" strokeWidth={2.5} />
      <line x1={-16} y1={19} x2={16} y2={19} stroke="#FFFFFF" strokeWidth={2.5} />
      <path d="M -12 34 L 12 4" stroke="#fff" strokeOpacity={0.5} strokeWidth={4} strokeLinecap="round" />
      <rect x={-21} y={40} width={42} height={5} rx={2} fill={C.sombra} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={brillo}>
      <defs>
        <linearGradient id={`${uid}w`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={aclarar(C.pared, 0.2)} /><stop offset="0.7" stopColor={C.pared} /><stop offset="1" stopColor={C.sombra} /></linearGradient>
        <linearGradient id={`${uid}r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={aclarar(C.techo, 0.25)} /><stop offset="1" stopColor={C.techoOsc} /></linearGradient>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#CFE6F7" /><stop offset="1" stopColor="#4A6F93" /></linearGradient>
        <linearGradient id={`${uid}d`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8A5A34" /><stop offset="1" stopColor="#5A3720" /></linearGradient>
        <radialGradient id={`${uid}a`}><stop offset="0" stopColor={RE.oro} stopOpacity="0.75" /><stop offset="1" stopColor={RE.oro} stopOpacity="0" /></radialGradient>
      </defs>
      {estado === "elegida" && <ellipse cx={0} cy={-90} rx={190} ry={150} fill={`url(#${uid}a)`} />}
      <Sombra x={0} y={4} rx={120} ry={10} opacidad={0.55} />
      {/* arbustos */}
      <circle cx={-104} cy={-14} r={22} fill="#2E6B45" /><circle cx={-122} cy={-8} r={15} fill="#3B8556" /><circle cx={106} cy={-14} r={22} fill="#2E6B45" /><circle cx={124} cy={-8} r={15} fill="#3B8556" />
      {/* paredes */}
      <rect x={-92} y={-102} width={184} height={102} fill={`url(#${uid}w)`} />
      <rect x={-92} y={-12} width={184} height={12} fill={C.sombra} opacity={0.55} />
      {/* chimenea y techo */}
      <rect x={46} y={-178} width={24} height={58} fill={oscurecer(C.pared, 0.25)} /><rect x={42} y={-182} width={32} height={8} fill={oscurecer(C.pared, 0.4)} />
      <polygon points="-112,-98 0,-190 112,-98" fill={`url(#${uid}r)`} />
      <polygon points="-112,-98 0,-190 0,-176 -96,-98" fill="#fff" opacity={0.14} />
      {Array.from({ length: 4 }, (_, i) => <line key={i} x1={-104 + i * 12} y1={-98 - i * 8} x2={104 - i * 12} y2={-98 - i * 8} stroke={C.techoOsc} strokeOpacity={0.45} strokeWidth={2} />)}
      <rect x={-114} y={-100} width={228} height={6} rx={2} fill={C.techoOsc} />
      {/* puerta y ventanas */}
      {ventana(-58)}{ventana(58)}
      <rect x={-17} y={-66} width={34} height={66} rx={3} fill="#FFFFFF" /><rect x={-14} y={-63} width={28} height={63} rx={2} fill={`url(#${uid}d)`} />
      <circle cx={8} cy={-30} r={2.6} fill="#E8C66A" /><rect x={-14} y={-63} width={28} height={9} fill="#fff" opacity={0.12} />
      <rect x={-24} y={0} width={48} height={5} rx={2} fill="#C9C5BC" />
      {/* estados */}
      {estado === "rechazada" && (
        <g>
          <polygon points="-112,-98 0,-190 112,-98" fill="#0B1828" opacity={0.58} /><rect x={-114} y={-102} width={228} height={106} fill="#0B1828" opacity={0.58} />
          <g stroke={RE.rojo} strokeWidth={13} strokeLinecap="round"><line x1={-52} y1={-134} x2={52} y2={-34} /><line x1={52} y1={-134} x2={-52} y2={-34} /></g>
        </g>
      )}
      {estado === "elegida" && (
        <g transform="translate(92 -176)"><circle r={26} fill={RE.esmeralda} stroke="#fff" strokeWidth={4} /><path d="M -12 1 L -3 11 L 14 -9" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" /></g>
      )}
      {estado === "vendida" && (
        <g transform="translate(0 -88) rotate(-14)"><rect x={-110} y={-24} width={220} height={48} rx={6} fill={RE.rojo} stroke="#fff" strokeWidth={3} /><text x={0} y={11} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="#fff" letterSpacing="0.06em">VENDIDA</text></g>
      )}
    </g>
  );
};

/** Casa pequeña y simple para cuadrículas (≈ 80 × 76 a escala 1). `color` = relleno de la fachada. */
export const MiniCasa: React.FC<{ x: number; y: number; s?: number; color?: string; op?: number; brillo?: number }> = ({ x, y, s = 1, color = "#5A7DB8", op = 1, brillo = 0 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
      <defs><linearGradient id={`${uid}m`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={aclarar(color, 0.3)} /><stop offset="1" stopColor={oscurecer(color, 0.3)} /></linearGradient></defs>
      {brillo > 0 && <ellipse cx={0} cy={-34} rx={58} ry={50} fill={color} opacity={0.35 * clamp(brillo)} />}
      <path d="M -36 0 L -36 -36 L -44 -36 L 0 -76 L 44 -36 L 36 -36 L 36 0 Z" fill={`url(#${uid}m)`} stroke="#fff" strokeOpacity={0.45} strokeWidth={2} strokeLinejoin="round" />
      <rect x={-8} y={-26} width={16} height={26} rx={2} fill="#0B1828" opacity={0.45} />
      <rect x={-27} y={-34} width={13} height={13} rx={2} fill="#fff" opacity={0.55} /><rect x={14} y={-34} width={13} height={13} rx={2} fill="#fff" opacity={0.55} />
    </g>
  );
};

/** Silueta de candidata (busto con luz de borde, como la Persona del kit). `estado`: normal, rechazada (apagada) o elegida (dorada con aura). */
export const Candidata: React.FC<{ x: number; y: number; s?: number; estado?: "normal" | "rechazada" | "elegida"; op?: number; brillo?: number }> = ({ x, y, s = 1, estado = "normal", op = 1, brillo = 0 }) => {
  const uid = useUid();
  const base = estado === "elegida" ? RE.oro : estado === "rechazada" ? "#2A3B52" : "#16304A";
  const borde = estado === "elegida" ? "#FFF1B0" : estado === "rechazada" ? "#5F7391" : "#A9CBEE";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
      <defs><radialGradient id={`${uid}a`}><stop offset="0" stopColor={RE.oro} stopOpacity="0.8" /><stop offset="1" stopColor={RE.oro} stopOpacity="0" /></radialGradient></defs>
      {brillo > 0 && <circle cx={0} cy={-52} r={88} fill={`url(#${uid}a)`} opacity={clamp(brillo)} />}
      <path d="M -44 0 C -44 -30 -26 -42 0 -42 C 26 -42 44 -30 44 0 Z" fill={base} stroke={borde} strokeOpacity={0.85} strokeWidth={2.4} strokeLinejoin="round" />
      <rect x={-8} y={-52} width={16} height={14} rx={5} fill={base} />
      <circle cx={0} cy={-72} r={26} fill={base} stroke={borde} strokeOpacity={0.85} strokeWidth={2.4} />
      <path d="M -18 -80 C -16 -92 -4 -98 8 -96" fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};

/** Dado de seis caras (vista 3D) mostrando el 5. */
export const Dado: React.FC<{ x: number; y: number; s?: number; giro?: number }> = ({ x, y, s = 1, giro = 0 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#C9D3DE" /></linearGradient>
        <linearGradient id={`${uid}t`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#DDE5EE" /></linearGradient>
      </defs>
      <Sombra x={10} y={6} rx={96} ry={10} opacidad={0.5} />
      <polygon points="-70,-122 -30,-158 96,-158 60,-122" fill={`url(#${uid}t)`} />
      <polygon points="60,-122 96,-158 96,-34 60,0" fill="#9AA7B6" />
      <rect x={-70} y={-122} width={130} height={122} rx={16} fill={`url(#${uid}f)`} />
      {[[-42, -94], [28, -94], [-7, -61], [-42, -28], [28, -28]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={11} fill="#1B2A44" />)}
      <circle cx={102} cy={-168} r={7} fill="#1B2A44" opacity={0.0} />
    </g>
  );
};

/** Señal de sentido único: cartel azul con flecha blanca y, debajo, la flecha de «volver» prohibida. */
export const SenalUnica: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><linearGradient id={`${uid}b`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3C7BE0" /><stop offset="1" stopColor="#1B4A9E" /></linearGradient></defs>
      <Sombra x={0} y={4} rx={70} ry={8} opacidad={0.5} />
      <rect x={-7} y={-250} width={14} height={250} fill="#8E9CAA" /><rect x={-7} y={-250} width={5} height={250} fill="#fff" opacity={0.35} />
      <rect x={-98} y={-300} width={196} height={112} rx={14} fill="#fff" /><rect x={-92} y={-294} width={184} height={100} rx={10} fill={`url(#${uid}b)`} />
      <path d="M -62 -244 L 18 -244 L 18 -266 L 70 -244 L 18 -222 L 18 -244" fill="#fff" stroke="#fff" strokeWidth={6} strokeLinejoin="round" />
      <g transform="translate(0 -128)"><circle r={42} fill="#fff" stroke={RE.rojo} strokeWidth={9} /><path d="M 20 0 L -14 0 M -14 0 L -2 -12 M -14 0 L -2 12" stroke="#1B2A44" strokeWidth={7} strokeLinecap="round" fill="none" /><line x1={-30} y1={-30} x2={30} y2={30} stroke={RE.rojo} strokeWidth={9} strokeLinecap="round" /></g>
    </g>
  );
};

/** Copa dorada con brillo. */
export const Copa: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}o`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#B98419" /><stop offset="0.3" stopColor="#FFE27A" /><stop offset="0.65" stopColor={RE.oro} /><stop offset="1" stopColor="#A87413" /></linearGradient>
      </defs>
      <Sombra x={0} y={4} rx={80} ry={9} opacidad={0.5} />
      <rect x={-62} y={-30} width={124} height={30} rx={6} fill={`url(#${uid}o)`} /><rect x={-40} y={-44} width={80} height={16} rx={4} fill={`url(#${uid}o)`} />
      <rect x={-12} y={-92} width={24} height={52} fill={`url(#${uid}o)`} />
      <path d="M -74 -250 L 74 -250 C 74 -170 40 -104 0 -98 C -40 -104 -74 -170 -74 -250 Z" fill={`url(#${uid}o)`} />
      <path d="M -74 -232 C -128 -232 -122 -164 -62 -150" fill="none" stroke={RE.oro} strokeWidth={14} strokeLinecap="round" /><path d="M 74 -232 C 128 -232 122 -164 62 -150" fill="none" stroke={RE.oro} strokeWidth={14} strokeLinecap="round" />
      <ellipse cx={0} cy={-250} rx={74} ry={12} fill="#FFF3B8" opacity={0.9} />
      <path d="M -46 -230 C -46 -190 -34 -150 -14 -122" fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={9} strokeLinecap="round" />
    </g>
  );
};

/** Cartel con puntaje (placa de madera sobre un poste), para la casa que se evalúa. */
export const Cartel: React.FC<{ x: number; y: number; s?: number; texto: string; sub?: string; color?: string }> = ({ x, y, s = 1, texto, sub, color = RE.oro }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Sombra x={0} y={4} rx={52} ry={7} opacidad={0.5} />
    <rect x={-6} y={-92} width={12} height={92} fill="#8E9CAA" />
    <rect x={-84} y={-176} width={168} height={92} rx={12} fill="#0C1A2A" stroke={color} strokeWidth={4} />
    <rect x={-78} y={-170} width={156} height={80} rx={9} fill="none" stroke="#fff" strokeOpacity={0.18} strokeWidth={2} />
    {sub && <text x={0} y={-148} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={19} fill="#BFE0FF" letterSpacing="0.06em">{sub}</text>}
    <text x={0} y={-104} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={54} fill={color}>{texto}</text>
  </g>
);
