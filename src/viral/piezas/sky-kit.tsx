/**
 * Kit de «La piscina de 35 metros» (IMNOBA · figuras realistas · carril B). Todo en vectores (SVG), sin imágenes externas, sobre el estudio azul
 * marino de `real-kit.tsx`. Origen de cada objeto indicado en su comentario.
 *   Piscina    vista lateral de la canaleta de acrílico (paredes y fondo gruesos, bordes verdosos, agua con ondas y brillo)
 *   Bloque     sección de acrílico en oblicua (frente, cara superior y costado translúcidos)
 *   Grua       grúa móvil amarilla con pluma que gira (devuelve la punta con `puntaGrua`)
 *   Apoyo      apoyo de puente en corte: hormigón, placa de acero, superficie deslizante, placa superior que se desplaza y gira, marco y acrílico
 *   Regla      regla escolar con marcas
 */
import React from "react";
import { useUid } from "../../estudio/util";
import { azar } from "../../lib/anim";
import { FONT, MONOF, RE, Sombra, aclarar, clamp, lerp, mezclar, oscurecer } from "./real-kit";

export const SK = {
  acrilico: "#BFF3F0",
  borde: "#8FF0DC",
  agua: "#27B7E6",
  aguaOscura: "#0A5E94",
  acero: "#8FA2B5",
  amarillo: "#F2B705",
  hormigon: "#7E8A96",
} as const;

/* ───────────── Piscina (vista lateral) ───────────── */

/** Canaleta de acrílico vista de lado. `yFondo` = borde inferior; `alto` total; `nivel` 0–1 de agua. */
export const Piscina: React.FC<{ x0: number; x1: number; yFondo: number; alto: number; fondo: number; pared: number; nivel?: number; t?: number; op?: number; brillo?: number }> = ({ x0, x1, yFondo, alto, fondo, pared, nivel = 1, t = 0, op = 1, brillo = 1 }) => {
  const uid = useUid();
  const ix0 = x0 + pared, ix1 = x1 - pared, ib = yFondo - fondo, it = yFondo - alto;
  const yw = ib - (ib - it) * 0.94 * clamp(nivel);
  const onda = (x: number): number => yw + (nivel > 0.02 ? Math.sin(x * 0.035 + t * 3) * 2.4 + Math.sin(x * 0.081 - t * 2.1) * 1.5 : 0);
  const pts: string[] = [];
  for (let x = ix0; x <= ix1; x += 10) pts.push(`${x.toFixed(1)},${onda(x).toFixed(1)}`);
  const agua = `M ${ix0},${ib} L ${pts.join(" L ")} L ${ix1},${onda(ix1).toFixed(1)} L ${ix1},${ib} Z`;
  const w = x1 - x0;
  return (
    <g opacity={op}>
      <defs>
        <linearGradient id={`${uid}ac`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E6FFFB" stopOpacity="0.42" /><stop offset="1" stopColor={SK.acrilico} stopOpacity="0.2" /></linearGradient>
        <linearGradient id={`${uid}ag`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6FE0FF" stopOpacity="0.92" /><stop offset="0.5" stopColor={SK.agua} stopOpacity="0.88" /><stop offset="1" stopColor={SK.aguaOscura} stopOpacity="0.95" /></linearGradient>
        <linearGradient id={`${uid}sp`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.5" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <clipPath id={`${uid}cl`}><rect x={ix0} y={it} width={ix1 - ix0} height={ib - it} /></clipPath>
      </defs>
      {nivel > 0.001 && <path d={agua} fill={`url(#${uid}ag)`} />}
      {nivel > 0.02 && <path d={`M ${pts.join(" L ")}`} fill="none" stroke="#fff" strokeOpacity={0.75} strokeWidth={2.2} />}
      {nivel > 0.1 && (
        <g clipPath={`url(#${uid}cl)`} opacity={0.55 * brillo}>
          {[0.18, 0.42, 0.66, 0.86].map((k, i) => <polygon key={i} points={`${lerp(ix0, ix1, k)},${yw} ${lerp(ix0, ix1, k) + 22},${yw} ${lerp(ix0, ix1, k) - 40},${ib} ${lerp(ix0, ix1, k) - 62},${ib}`} fill="#fff" opacity={0.07 + 0.05 * Math.sin(t * 1.3 + i * 2)} />)}
        </g>
      )}
      {/* acrílico: paredes y fondo */}
      {[[x0, it, pared, alto], [ix1, it, pared, alto], [x0, ib, w, fondo]].map(([x, y, ww, hh], i) => (
        <g key={i}>
          <rect x={x} y={y} width={ww} height={hh} fill={`url(#${uid}ac)`} />
          <rect x={x} y={y} width={ww} height={hh} fill="none" stroke={SK.borde} strokeOpacity={0.9} strokeWidth={2.6} />
          <rect x={x + 2} y={y + 2} width={Math.max(1, ww - 4)} height={Math.max(1, hh - 4)} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={1.2} />
        </g>
      ))}
      <rect x={x0} y={ib} width={w} height={fondo * 0.22} fill={`url(#${uid}sp)`} opacity={0.35 * brillo} />
      <rect x={x0} y={it} width={w} height={2} fill="#fff" opacity={0.0} />
    </g>
  );
};

/* ───────────── Bloque de acrílico en oblicua ───────────── */

/** Sección de acrílico: (x, y) = esquina inferior izquierda del frente; `d` = profundidad oblicua en px; `glow` ilumina las caras. */
export const Bloque: React.FC<{ x: number; y: number; w: number; h: number; d?: number; glow?: number; op?: number; canal?: boolean }> = ({ x, y, w, h, d = 90, glow = 0, op = 1, canal = true }) => {
  const uid = useUid();
  const dx = d, dy = d * 0.55;
  return (
    <g opacity={op}>
      <defs>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E9FFFC" stopOpacity="0.5" /><stop offset="1" stopColor={SK.acrilico} stopOpacity="0.2" /></linearGradient>
        <linearGradient id={`${uid}t`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#F2FFFD" stopOpacity="0.62" /><stop offset="1" stopColor={SK.acrilico} stopOpacity="0.3" /></linearGradient>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={SK.acrilico} stopOpacity="0.3" /><stop offset="1" stopColor="#4FA6A8" stopOpacity="0.28" /></linearGradient>
      </defs>
      <polygon points={`${x + w},${y - h} ${x + w + dx},${y - h - dy} ${x + w + dx},${y - dy} ${x + w},${y}`} fill={`url(#${uid}s)`} stroke={SK.borde} strokeOpacity={0.75} strokeWidth={2.4} />
      <polygon points={`${x},${y - h} ${x + w},${y - h} ${x + w + dx},${y - h - dy} ${x + dx},${y - h - dy}`} fill={`url(#${uid}t)`} stroke={SK.borde} strokeOpacity={0.85} strokeWidth={2.4} />
      {canal && <polygon points={`${x + w * 0.1 + dx * 0.3},${y - h - dy * 0.3} ${x + w * 0.9 + dx * 0.3},${y - h - dy * 0.3} ${x + w * 0.9 + dx * 0.72},${y - h - dy * 0.72} ${x + w * 0.1 + dx * 0.72},${y - h - dy * 0.72}`} fill="#0B3A5A" fillOpacity={0.42} stroke="#fff" strokeOpacity={0.3} strokeWidth={1.4} />}
      <rect x={x} y={y - h} width={w} height={h} fill={`url(#${uid}f)`} stroke={SK.borde} strokeOpacity={0.95} strokeWidth={2.8} />
      <rect x={x + 5} y={y - h + 5} width={Math.max(1, w - 10)} height={Math.max(1, h - 10)} fill="none" stroke="#fff" strokeOpacity={0.28} strokeWidth={1.4} />
      <polygon points={`${x + w * 0.12},${y - h} ${x + w * 0.3},${y - h} ${x + w * 0.1},${y} ${x - w * 0.08},${y}`} fill="#fff" opacity={0.1} />
      {glow > 0.01 && <rect x={x - 6} y={y - h - 6} width={w + 12} height={h + 12} rx={10} fill="none" stroke={RE.oro} strokeOpacity={0.5 * glow} strokeWidth={5} />}
    </g>
  );
};

/* ───────────── Grúa ───────────── */

/** Punta de la pluma de `Grua` (coordenadas del lienzo). */
export const puntaGrua = (x: number, y: number, s: number, ang: number, largo: number): [number, number] => [x + 60 * s + Math.cos((ang * Math.PI) / 180) * largo * s, y - 150 * s - Math.sin((ang * Math.PI) / 180) * largo * s];

/** Grúa móvil: (x, y) = centro de la base sobre el piso; `ang` grados de la pluma sobre la horizontal; `largo` de la pluma en px (antes de `s`). */
export const Grua: React.FC<{ x: number; y: number; s?: number; ang: number; largo: number }> = ({ x, y, s = 1, ang, largo }) => {
  const uid = useUid();
  const cel = Math.max(6, Math.round(largo / 46));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}a`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD84A" /><stop offset="0.55" stopColor={SK.amarillo} /><stop offset="1" stopColor="#9A6F00" /></linearGradient>
        <linearGradient id={`${uid}n`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A4654" /><stop offset="1" stopColor="#12171E" /></linearGradient>
      </defs>
      <Sombra x={10} y={2} rx={230} ry={12} opacidad={0.6} />
      {/* estabilizadores */}
      {[-150, 190].map((px) => <g key={px}><rect x={px - 4} y={-54} width={8} height={50} fill="#222A33" /><rect x={px - 28} y={-8} width={56} height={9} rx={3} fill="#4A5766" /></g>)}
      {/* chasis */}
      <rect x={-180} y={-78} width={380} height={44} rx={8} fill={`url(#${uid}a)`} />
      <rect x={-180} y={-78} width={380} height={9} rx={5} fill="#fff" opacity={0.3} />
      {[-130, -70, 90, 150].map((wx) => <g key={wx}><circle cx={wx} cy={-30} r={30} fill="#0A0C0F" /><circle cx={wx} cy={-30} r={17} fill="#8793A0" /><circle cx={wx} cy={-30} r={6} fill="#232B34" /></g>)}
      {/* cabina */}
      <path d="M -180 -78 L -180 -126 L -118 -126 L -92 -78 Z" fill={`url(#${uid}a)`} />
      <path d="M -170 -118 L -124 -118 L -106 -86 L -170 -86 Z" fill="#12202E" /><path d="M -166 -114 L -140 -114 L -154 -90 L -166 -90 Z" fill="#9CCBFF" opacity={0.35} />
      {/* torreta y contrapeso */}
      <rect x={-40} y={-150} width={170} height={72} rx={10} fill={`url(#${uid}a)`} />
      <rect x={110} y={-142} width={80} height={64} rx={6} fill={`url(#${uid}n)`} />
      <rect x={-40} y={-150} width={170} height={8} rx={4} fill="#fff" opacity={0.28} />
      {/* pluma */}
      <g transform={`translate(60 -150) rotate(${-ang})`}>
        <polygon points={`0,-22 ${largo},-8 ${largo},8 0,22`} fill="#CF9A00" stroke="#7A5600" strokeWidth={2} />
        {Array.from({ length: cel }, (_, i) => {
          const x0 = (largo * i) / cel, x1 = (largo * (i + 1)) / cel;
          const h0 = lerp(20, 7, i / cel), h1 = lerp(20, 7, (i + 1) / cel);
          return <polyline key={i} points={`${x0},${i % 2 ? h0 : -h0} ${(x0 + x1) / 2},${i % 2 ? -h1 : h1} ${x1},${i % 2 ? h1 : -h1}`} fill="none" stroke="#FFE27A" strokeOpacity={0.8} strokeWidth={2} />;
        })}
        <polygon points={`0,-22 ${largo},-8 ${largo},-3 0,-16`} fill="#fff" opacity={0.3} />
        <circle cx={largo} cy={0} r={10} fill="#3A4654" stroke="#9FB4C8" strokeWidth={3} />
      </g>
      <circle cx={60} cy={-150} r={14} fill="#3A4654" stroke="#9FB4C8" strokeWidth={3} />
    </g>
  );
};

/* ───────────── Apoyo de puente en corte ───────────── */

/**
 * Apoyo deslizante y giratorio en corte (origen: centro de la cara superior del hormigón). Se mueve: placa superior (`desp` px a la derecha),
 * marco de acero y acrílico encima (giran `giro` grados alrededor del apoyo). Línea de referencia fija punteada.
 */
export const Apoyo: React.FC<{ x: number; y: number; s?: number; desp?: number; giro?: number; marca?: number }> = ({ x, y, s = 1, desp = 0, giro = 0, marca = 1 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}h`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#97A3AF" /><stop offset="1" stopColor="#4C5762" /></linearGradient>
        <linearGradient id={`${uid}p`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C6D2DE" /><stop offset="0.5" stopColor="#8C9DAE" /><stop offset="1" stopColor="#4E5C6B" /></linearGradient>
        <linearGradient id={`${uid}d`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#EAF4FA" /><stop offset="0.5" stopColor="#FFFFFF" /><stop offset="1" stopColor="#CFE3F0" /></linearGradient>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E9FFFC" stopOpacity="0.55" /><stop offset="1" stopColor={SK.acrilico} stopOpacity="0.22" /></linearGradient>
      </defs>
      <Sombra x={0} y={118} rx={330} ry={14} opacidad={0.5} />
      {/* hormigón del edificio */}
      <rect x={-330} y={0} width={660} height={120} fill={`url(#${uid}h)`} />
      {Array.from({ length: 70 }, (_, i) => <circle key={i} cx={-320 + azar(i * 3.3) * 640} cy={6 + azar(i * 7.1) * 108} r={0.8 + azar(i * 1.9) * 1.6} fill="#2F3841" opacity={0.35} />)}
      <rect x={-330} y={0} width={660} height={6} fill="#fff" opacity={0.25} />
      {/* placa inferior fija */}
      <rect x={-190} y={-34} width={380} height={34} rx={4} fill={`url(#${uid}p)`} stroke="#2A323B" strokeWidth={2} />
      {[-160, 160].map((bx) => <circle key={bx} cx={bx} cy={-17} r={7} fill="#2A323B" />)}
      {/* referencia fija */}
      {marca > 0 && <line x1={0} y1={-340} x2={0} y2={0} stroke={RE.oro} strokeWidth={2.4} strokeDasharray="6 8" opacity={0.75 * marca} />}
      {/* superficie deslizante */}
      <rect x={-170} y={-44} width={340} height={10} rx={3} fill={`url(#${uid}d)`} />
      {/* conjunto que se mueve */}
      <g transform={`translate(${desp} 0) rotate(${giro} 0 -44)`}>
        {/* domo giratorio */}
        <path d="M -70 -44 A 70 18 0 0 1 70 -44 Z" fill="#6E7F90" stroke="#2A323B" strokeWidth={2} />
        <rect x={-210} y={-82} width={420} height={38} rx={4} fill={`url(#${uid}p)`} stroke="#2A323B" strokeWidth={2} />
        {[-180, 180].map((bx) => <circle key={bx} cx={bx} cy={-63} r={7} fill="#2A323B" />)}
        {/* marco de acero bajo la piscina */}
        <rect x={-280} y={-150} width={560} height={68} rx={4} fill="#5C6E81" stroke="#222B34" strokeWidth={2} />
        <rect x={-280} y={-150} width={560} height={9} fill="#fff" opacity={0.22} />
        {[-3, -2, -1, 0, 1, 2, 3].map((k) => <rect key={k} x={k * 74 - 3} y={-142} width={6} height={52} fill="#222B34" opacity={0.5} />)}
        {/* acrílico */}
        <rect x={-260} y={-420} width={520} height={270} rx={5} fill={`url(#${uid}c)`} stroke={SK.borde} strokeWidth={3} />
        <rect x={-252} y={-412} width={504} height={254} rx={3} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={1.5} />
        <polygon points="-190,-420 -130,-420 -230,-150 -290,-150" fill="#fff" opacity={0.1} />
        <rect x={-258} y={-330} width={516} height={178} fill={SK.agua} opacity={0.55} />
      </g>
      {/* escala en la placa inferior */}
      {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((m) => <line key={m} x1={m} y1={-34} x2={m} y2={m % 60 === 0 ? -24 : -28} stroke="#222B34" strokeWidth={m === 0 ? 3 : 1.6} />)}
    </g>
  );
};

/* ───────────── Regla ───────────── */

/** Regla escolar horizontal de `cm` centímetros a `pxCm` píxeles por centímetro (origen: esquina izquierda, borde superior). */
export const Regla: React.FC<{ x: number; y: number; cm: number; pxCm: number; alto?: number; k?: number }> = ({ x, y, cm, pxCm, alto = 56, k = 1 }) => {
  const uid = useUid();
  const w = cm * pxCm * clamp(k);
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs><linearGradient id={`${uid}r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F1F4F7" /><stop offset="1" stopColor="#B9C3CE" /></linearGradient></defs>
      <rect x={0} y={0} width={w} height={alto} rx={4} fill={`url(#${uid}r)`} stroke="#6C7A88" strokeWidth={2} />
      {Array.from({ length: Math.floor(cm * clamp(k)) + 1 }, (_, i) => <line key={i} x1={i * pxCm} y1={0} x2={i * pxCm} y2={i % 5 === 0 ? alto * 0.5 : alto * 0.3} stroke="#2B3640" strokeWidth={i % 5 === 0 ? 2.4 : 1.4} />)}
      {Array.from({ length: Math.floor((cm * clamp(k)) / 5) + 1 }, (_, i) => i * 5).filter((c) => c > 0 && c <= cm * clamp(k)).map((c) => <text key={c} x={c * pxCm} y={alto * 0.82} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={Math.max(14, alto * 0.28)} fill="#2B3640">{c}</text>)}
    </g>
  );
};

/* ───────────── Soporte de cota horizontal ───────────── */

/** Cota horizontal con flechas y texto encima. */
export const CotaH: React.FC<{ x0: number; x1: number; y: number; texto: string; color?: string; px?: number; k?: number; fondo?: boolean }> = ({ x0, x1, y, texto, color = RE.oro, px = 36, k = 1, fondo = true }) => {
  const xb = lerp(x0, x1, clamp(k));
  const w = texto.length * px * 0.62 + 28;
  return (
    <g opacity={clamp(k * 3)}>
      <line x1={x0} y1={y} x2={xb} y2={y} stroke={color} strokeWidth={4} />
      <line x1={x0} y1={y - 18} x2={x0} y2={y + 18} stroke={color} strokeWidth={4} />
      <line x1={xb} y1={y - 18} x2={xb} y2={y + 18} stroke={color} strokeWidth={4} />
      <polygon points={`${x0},${y} ${x0 + 18},${y - 8} ${x0 + 18},${y + 8}`} fill={color} />
      <polygon points={`${xb},${y} ${xb - 18},${y - 8} ${xb - 18},${y + 8}`} fill={color} />
      {fondo && <rect x={(x0 + xb) / 2 - w / 2} y={y - px - 22} width={w} height={px + 20} rx={12} fill="#050A12" opacity={0.78} />}
      <text x={(x0 + xb) / 2} y={y - 18} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={px} fill={color}>{texto}</text>
    </g>
  );
};

export { mezclar, oscurecer, aclarar };
