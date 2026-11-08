/**
 * Kit de «La casa que vale menos cada año» (IMNOBA · figuras realistas · carril B). Objetos dibujados como renders sobre el estudio azul marino de `real-kit.tsx`.
 *   CasaJ        casa de tejas con ventanas corredizas que envejece (`edad` 0–1): se desgasta el color, salen grietas, musgo, tejas rotas y maleza
 *   Terreno      lote en bloque (césped, tierra y estratos) con contorno dorado y brillo de valor
 *   Excavadora   excavadora amarilla de lado (mira a la izquierda) con pluma, brazo y cuchara articulados
 *   Escombros    pila de escombros y polvo para la demolición
 *   Medidor      barra vertical de valor con etiqueta
 */
import React from "react";
import { useUid } from "../../estudio/util";
import { azar } from "../../lib/anim";
import { H, W, clamp, easeOut, lerp, mezclar, aclarar, oscurecer } from "../comun";
import { FONT, MONOF, RE, Sombra } from "./real-kit";

export const JP = { oro: "#FFC500", rojo: "#E23B2E", verde: "#3DDC84", cian: "#3DD6F0" } as const;

/* ───────────── casa ───────────── */

/** Casa vista de frente; origen = centro de la base; ~380 px de ancho y ~300 de alto con s = 1. `edad` 0 = nueva, 1 = ruinosa; `luz` enciende las ventanas. */
export const CasaJ: React.FC<{ x: number; y: number; s?: number; edad?: number; luz?: number; brillo?: number; alto?: number }> = ({ x, y, s = 1, edad = 0, luz = 0.6, brillo = 0, alto = 1 }) => {
  const uid = useUid();
  const e = clamp(edad);
  const pared = mezclar("#EFE5CF", "#8E8878", e);
  const paredOsc = mezclar("#CFC4AA", "#6B665A", e);
  const teja = mezclar("#3E5C86", "#262D36", e * 0.9);
  const tejaCl = mezclar("#5C7FB0", "#3A424D", e * 0.9);
  const grietas = Math.floor(e * 9);
  const tejasRotas = Math.floor(e * 10);
  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${s * alto})`}>
      <defs>
        <linearGradient id={`${uid}p`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={paredOsc} /><stop offset="0.3" stopColor={pared} /><stop offset="0.75" stopColor={pared} /><stop offset="1" stopColor={paredOsc} /></linearGradient>
        <linearGradient id={`${uid}t`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={tejaCl} /><stop offset="1" stopColor={teja} /></linearGradient>
        <linearGradient id={`${uid}v`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={mezclar("#9CD0F0", "#FFE9A8", luz * 0.7)} /><stop offset="1" stopColor={mezclar("#2C4A68", "#C99A3C", luz * 0.6)} /></linearGradient>
        <radialGradient id={`${uid}b`}><stop offset="0" stopColor={JP.oro} stopOpacity="0.55" /><stop offset="1" stopColor={JP.oro} stopOpacity="0" /></radialGradient>
      </defs>
      <Sombra x={0} y={4} rx={230} ry={14} opacidad={0.5} />
      {brillo > 0.01 && <ellipse cx={0} cy={-150} rx={330} ry={250} fill={`url(#${uid}b)`} opacity={brillo} />}
      {/* paredes */}
      <rect x={-150} y={-170} width={300} height={170} fill={`url(#${uid}p)`} />
      <rect x={-150} y={-6} width={300} height={6} fill="#6E6A60" opacity={0.7} />
      {/* techo de tejas */}
      <polygon points="-196,-168 196,-168 138,-292 -138,-292" fill={`url(#${uid}t)`} />
      {Array.from({ length: 7 }, (_, r) => {
        const yy = -168 - r * 18, k = r / 7, x0 = lerp(-196, -138, k * 1.05), x1 = lerp(196, 138, k * 1.05);
        return <line key={r} x1={x0} y1={yy} x2={x1} y2={yy} stroke="#0A0F18" strokeOpacity={0.45} strokeWidth={2} />;
      })}
      {Array.from({ length: 22 }, (_, i) => <line key={i} x1={lerp(-190, 190, i / 21)} y1={-168} x2={lerp(-132, 132, i / 21)} y2={-292} stroke="#0A0F18" strokeOpacity={0.25} strokeWidth={1.5} />)}
      <polygon points="-142,-290 142,-290 138,-300 -138,-300" fill={mezclar("#8EA4C0", "#555B63", e)} />
      <polygon points="-200,-166 200,-166 200,-158 -200,-158" fill="#1B2230" opacity={0.7} />
      {/* tejas rotas */}
      {Array.from({ length: tejasRotas }, (_, i) => { const px = lerp(-150, 150, azar(i * 3.7)), py = -176 - azar(i * 5.3) * 100; return <polygon key={i} points={`${px},${py} ${px + 26},${py} ${px + 24},${py - 14} ${px + 2},${py - 14}`} fill="#06090E" opacity={0.85} />; })}
      {/* ventanas corredizas y puerta */}
      {[-92, 92].map((wx) => (
        <g key={wx}>
          <rect x={wx - 46} y={-142} width={92} height={78} rx={3} fill="#E8EEF4" opacity={0.9} />
          <rect x={wx - 41} y={-137} width={82} height={68} fill={`url(#${uid}v)`} />
          <line x1={wx} y1={-137} x2={wx} y2={-69} stroke="#E8EEF4" strokeWidth={3} />
          <line x1={wx - 41} y1={-103} x2={wx + 41} y2={-103} stroke="#E8EEF4" strokeWidth={2} opacity={0.7} />
          <polygon points={`${wx - 38},-134 ${wx - 8},-134 ${wx - 28},-72 ${wx - 38},-72`} fill="#fff" opacity={0.18} />
        </g>
      ))}
      <rect x={-30} y={-122} width={60} height={122} rx={3} fill={mezclar("#7A5230", "#3F3126", e)} stroke="#2A1C10" strokeWidth={3} />
      <rect x={-22} y={-114} width={44} height={50} fill={mezclar("#B98C55", "#5C4C3A", e)} opacity={0.8} />
      <circle cx={20} cy={-58} r={4} fill="#D7C48A" />
      {/* desgaste */}
      {Array.from({ length: grietas }, (_, i) => {
        const gx = lerp(-140, 140, azar(i * 4.1 + 1)), gy = -160 + azar(i * 6.7) * 120;
        return <polyline key={i} points={`${gx},${gy} ${gx + 8},${gy + 18} ${gx - 4},${gy + 34} ${gx + 10},${gy + 52}`} fill="none" stroke="#2A261F" strokeWidth={2.4} strokeLinecap="round" opacity={0.8} />;
      })}
      {e > 0.25 && Array.from({ length: Math.floor(e * 9) }, (_, i) => <ellipse key={i} cx={lerp(-140, 140, azar(i * 2.3 + 3))} cy={-4 - azar(i * 1.9) * 26} rx={10 + azar(i * 4.4) * 20} ry={4 + azar(i * 3.1) * 8} fill="#3E6B3A" opacity={0.7 * e} />)}
      {e > 0.5 && Array.from({ length: 8 }, (_, i) => <line key={i} x1={-150 + i * 40} y1={0} x2={-150 + i * 40 + (azar(i) - 0.5) * 20} y2={-20 - azar(i * 7) * 26 * e} stroke="#4C7A3A" strokeWidth={3} strokeLinecap="round" />)}
      {e > 0.35 && <rect x={-150} y={-170} width={300} height={170} fill="#2A2A24" opacity={0.18 * e} />}
    </g>
  );
};

/* ───────────── terreno ───────────── */

/** Lote en bloque: cara superior con césped, frente con estratos. Origen = centro del borde delantero superior. `valor` (0–1) enciende el contorno dorado y el brillo. */
export const Terreno: React.FC<{ x: number; y: number; s?: number; valor?: number; t?: number }> = ({ x, y, s = 1, valor = 0, t = 0 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5FB45A" /><stop offset="1" stopColor="#2F7A3A" /></linearGradient>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7A5636" /><stop offset="0.5" stopColor="#5E4128" /><stop offset="1" stopColor="#2F2418" /></linearGradient>
        <linearGradient id={`${uid}d`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#4A3420" /><stop offset="1" stopColor="#241A10" /></linearGradient>
        <radialGradient id={`${uid}g`}><stop offset="0" stopColor={JP.oro} stopOpacity="0.6" /><stop offset="1" stopColor={JP.oro} stopOpacity="0" /></radialGradient>
      </defs>
      <Sombra x={30} y={90} rx={340} ry={20} opacidad={0.55} />
      {valor > 0.01 && <ellipse cx={30} cy={-20} rx={420} ry={150} fill={`url(#${uid}g)`} opacity={valor * (0.8 + 0.2 * Math.sin(t * 4))} />}
      <polygon points="290,0 350,-56 350,34 290,90" fill={`url(#${uid}d)`} />
      <rect x={-290} y={0} width={580} height={90} fill={`url(#${uid}f)`} />
      {[28, 54, 72].map((yy, i) => <line key={i} x1={-290} y1={yy} x2={290} y2={yy} stroke="#000" strokeOpacity={0.2} strokeWidth={2} />)}
      {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={-280 + azar(i * 3.3) * 560} cy={8 + azar(i * 5.9) * 74} r={2 + azar(i * 7.7) * 3} fill="#2A1E12" opacity={0.5} />)}
      <polygon points="-290,0 290,0 350,-56 -230,-56" fill={`url(#${uid}c)`} />
      {Array.from({ length: 40 }, (_, i) => <line key={i} x1={-270 + azar(i * 2.1) * 600} y1={-6 - azar(i * 4.3) * 44} x2={-270 + azar(i * 2.1) * 600 + 2} y2={-12 - azar(i * 4.3) * 44} stroke="#8FE08A" strokeWidth={2} opacity={0.35} />)}
      <polygon points="-280,-6 280,-6 336,-52 -226,-52" fill="none" stroke={JP.oro} strokeWidth={4} strokeDasharray="16 12" opacity={0.2 + 0.8 * valor} />
    </g>
  );
};

/* ───────────── excavadora ───────────── */

/** Excavadora amarilla que mira a la izquierda. (x, y) = centro de las orugas sobre el piso. `b1`/`b2` = ángulos de pluma y brazo (grados, absolutos). */
export const Excavadora: React.FC<{ x: number; y: number; s?: number; b1?: number; b2?: number; b3?: number; t?: number }> = ({ x, y, s = 1, b1 = 35, b2 = -20, b3 = -60, t = 0 }) => {
  const uid = useUid();
  const P0: [number, number] = [-30, -128];
  const L1 = 240, L2 = 160;
  const r = (g: number): number => (g * Math.PI) / 180;
  const P1: [number, number] = [P0[0] - Math.cos(r(b1)) * L1, P0[1] - Math.sin(r(b1)) * L1];
  const P2: [number, number] = [P1[0] - Math.cos(r(b2)) * L2, P1[1] - Math.sin(r(b2)) * L2];
  const barra = (a: [number, number], b: [number, number], g: number): string => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = (-dy / l) * g / 2, ny = (dx / l) * g / 2;
    return `${a[0] + nx},${a[1] + ny} ${b[0] + nx},${b[1] + ny} ${b[0] - nx},${b[1] - ny} ${a[0] - nx},${a[1] - ny}`;
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}a`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD84A" /><stop offset="0.55" stopColor="#F2B705" /><stop offset="1" stopColor="#9A6F00" /></linearGradient>
        <linearGradient id={`${uid}k`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A4250" /><stop offset="1" stopColor="#0E1117" /></linearGradient>
      </defs>
      <Sombra x={0} y={4} rx={230} ry={13} opacidad={0.6} />
      {/* orugas */}
      <rect x={-170} y={-52} width={340} height={52} rx={26} fill={`url(#${uid}k)`} stroke="#5A6472" strokeWidth={3} />
      {Array.from({ length: 11 }, (_, i) => <line key={i} x1={-150 + i * 30} y1={-50} x2={-150 + i * 30} y2={-2} stroke="#000" strokeOpacity={0.5} strokeWidth={3} />)}
      {[-130, -45, 45, 130].map((wx) => <circle key={wx} cx={wx} cy={-26} r={15} fill="#6E7886" stroke="#1A1F27" strokeWidth={3} />)}
      {/* torreta y cabina */}
      <rect x={-130} y={-96} width={270} height={46} rx={8} fill={`url(#${uid}a)`} />
      <polygon points="40,-96 40,-196 140,-196 168,-120 168,-96" fill={`url(#${uid}a)`} />
      <polygon points="52,-186 130,-186 150,-124 52,-124" fill="#12202E" /><polygon points="58,-180 96,-180 82,-130 58,-130" fill="#9CD0F0" opacity={0.3} />
      <rect x={-136} y={-118} width={92} height={70} rx={6} fill="#3A4250" /><rect x={-136} y={-118} width={92} height={8} fill="#fff" opacity={0.2} />
      {/* pluma, brazo y cuchara */}
      <polygon points={barra(P0, P1, 30)} fill={`url(#${uid}a)`} stroke="#7A5600" strokeWidth={2} />
      <polygon points={barra(P1, P2, 22)} fill={`url(#${uid}a)`} stroke="#7A5600" strokeWidth={2} />
      <g transform={`translate(${P2[0]} ${P2[1]}) rotate(${-b3})`}>
        <polygon points="-34,-6 6,-16 40,6 20,44 -26,38" fill="#4A5260" stroke="#1A1F27" strokeWidth={3} />
        {[-26, -10, 6, 22].map((gx, i) => <polygon key={i} points={`${gx},38 ${gx + 6},38 ${gx + 3},52`} fill="#C9D3DE" />)}
      </g>
      <circle cx={P0[0]} cy={P0[1]} r={14} fill="#3A4250" stroke="#9FB0C8" strokeWidth={3} />
      <circle cx={P1[0]} cy={P1[1]} r={12} fill="#3A4250" stroke="#9FB0C8" strokeWidth={3} />
    </g>
  );
};

/** Escombros y polvo. `k` = 0–1 de cuánto se derrumbó; `t` en s. Origen = centro de la base. */
export const Escombros: React.FC<{ x: number; y: number; s?: number; k: number; t: number }> = ({ x, y, s = 1, k, t }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={clamp(k * 3)}>
    {Array.from({ length: 34 }, (_, i) => {
      const px = lerp(-190, 190, azar(i * 3.1)), h = (10 + azar(i * 5.7) * 36) * clamp(k * 1.4), w = 22 + azar(i * 7.3) * 46;
      return <polygon key={i} points={`${px - w / 2},0 ${px - w / 3},${-h} ${px + w / 3},${-h * 0.8} ${px + w / 2},0`} fill={["#A79E8A", "#6B665A", "#3E5C86", "#7A5230"][i % 4]} stroke="#1B1A16" strokeWidth={1.5} />;
    })}
    {Array.from({ length: 12 }, (_, i) => {
      const q = ((t * 0.5 + i / 12) % 1);
      return <circle key={i} cx={lerp(-170, 170, azar(i * 4.1)) + Math.sin(t * 2 + i) * 14} cy={-30 - q * 190} r={30 + q * 52} fill="#CFC8B8" opacity={(1 - q) * 0.32 * clamp(k * 2)} />;
    })}
  </g>
);

/* ───────────── medidor de valor ───────────── */

/** Barra vertical de valor (0–1) con etiqueta debajo; (x, y) = centro de la base. */
export const Medidor: React.FC<{ x: number; y: number; alto?: number; valor: number; color: string; etiqueta: string; k?: number }> = ({ x, y, alto = 300, valor, color, etiqueta, k = 1 }) => {
  const v = clamp(valor);
  return (
    <g opacity={clamp(k * 2)}>
      <rect x={x - 38} y={y - alto} width={76} height={alto} rx={14} fill="#0B1424" stroke="#6B7C93" strokeWidth={3} />
      <rect x={x - 32} y={y - alto + 6 + (alto - 12) * (1 - v)} width={64} height={Math.max(0, (alto - 12) * v)} rx={9} fill={color} />
      {[0.25, 0.5, 0.75].map((q) => <line key={q} x1={x - 38} y1={y - alto * q} x2={x - 18} y2={y - alto * q} stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />)}
      <text x={x} y={y + 44} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={28} fill={color}>{etiqueta}</text>
    </g>
  );
};

export { H, W, FONT, RE, easeOut, aclarar, oscurecer };
