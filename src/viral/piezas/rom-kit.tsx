/**
 * Kit de «El secreto perdido del hormigón romano» (IMNOBA · investigación forense y microscópica · carril B). Todo en vectores, sin imágenes externas.
 * Estilo: laboratorio forense azul petróleo con rejilla, retícula y barra de escala; evidencias en ámbar; humor de inspector con lupa.
 *   FondoLab     fondo de laboratorio: degradado, rejilla, línea de escaneo, viñeta y esquinas de visor
 *   Reticula     retícula de microscopio con barra de escala · Mar: agua con olas
 *   Inspector    detective con gabardina, sombrero y lupa
 *   PuenteModerno puente de hormigón armado que se oxida y se desmorona · Viaducto: tramo que cae
 *   MuelleRomano muelle de hormigón romano bajo el agua con destellos de cristales
 *   Bloque       corte de hormigón con áridos y poros · Cristales: placas de tobermorita que crecen
 *   Barco, Volcan, Panteon, Fabrica, Sello, Ion, Gota
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeOut, lerp, mezclar, aclarar, oscurecer, useReloj } from "../comun";
import { FONT, MONOF } from "./real-kit";

export const RO = {
  cian: "#4FE3FF", ambar: "#FFB020", terracota: "#D9774A", marmol: "#EDE6D6", oro: "#FFC500", verde: "#7CFFB0", rojo: "#FF5A4A",
  tinta: "#04101A", mar: "#1F7FA8", marOsc: "#0B3550", cal: "#F4F1E8", ceniza: "#8A8F96", herrumbre: "#B5532A", hormigon: "#9A9C98", papel: "#E9DDBF",
} as const;

/* ───────────── fondo de laboratorio ───────────── */

export const FondoLab: React.FC<{ tono?: "cian" | "ambar" | "rojo" | "verde"; children?: React.ReactNode; escaneo?: boolean }> = ({ tono = "cian", children, escaneo = true }) => {
  const { t } = useReloj();
  const uid = useUid();
  const c = { cian: ["#0E3347", "#08202E", "#030C13"], ambar: ["#3A2A12", "#22180A", "#0C0803"], rojo: ["#3E1A1A", "#241010", "#0B0404"], verde: ["#12362B", "#0A2119", "#030D09"] }[tono];
  const col = { cian: RO.cian, ambar: RO.ambar, rojo: RO.rojo, verde: RO.verde }[tono];
  const yb = ((t * 120) % (H + 200)) - 100;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: c[2] }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id={`${uid}b`} cx="50%" cy="44%" r="85%"><stop offset="0" stopColor={c[0]} /><stop offset="0.6" stopColor={c[1]} /><stop offset="1" stopColor={c[2]} /></radialGradient>
          <radialGradient id={`${uid}v`} cx="50%" cy="50%" r="78%"><stop offset="0.5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.72" /></radialGradient>
          <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={col} stopOpacity="0" /><stop offset="0.5" stopColor={col} stopOpacity="0.09" /><stop offset="1" stopColor={col} stopOpacity="0" /></linearGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}b)`} />
        {Array.from({ length: 28 }, (_, i) => <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={H} stroke={col} strokeWidth={1} opacity={0.05} />)}
        {Array.from({ length: 49 }, (_, i) => <line key={`h${i}`} x1={0} y1={i * 40} x2={W} y2={i * 40} stroke={col} strokeWidth={1} opacity={0.05} />)}
        {Array.from({ length: 22 }, (_, i) => {
          const q = (t * 0.03 + azar(i * 3.1)) % 1;
          return <circle key={i} cx={azar(i * 5.3) * W + Math.sin(t + i) * 20} cy={H * (1 - q)} r={1.5 + azar(i * 7.7) * 2.5} fill={col} opacity={0.22 * Math.sin(q * Math.PI)} />;
        })}
        {escaneo && <rect x={0} y={yb} width={W} height={200} fill={`url(#${uid}s)`} />}
        <rect width={W} height={H} fill={`url(#${uid}v)`} />
        {[[56, 56, 1, 1], [W - 56, 56, -1, 1], [56, H - 56, 1, -1], [W - 56, H - 56, -1, -1]].map(([x, y, sx, sy], i) => (
          <path key={i} d={`M ${x} ${y + sy * 70} L ${x} ${y} L ${x + sx * 70} ${y}`} fill="none" stroke={col} strokeWidth={4} opacity={0.6} />
        ))}
        <circle cx={96} cy={104} r={8} fill={RO.rojo} opacity={0.5 + 0.5 * Math.sin(t * 5)} />
      </svg>
      {children}
      <div style={{ position: "absolute", inset: 0, background: "#02070B", opacity: clamp(1 - t / 0.18) * 0.9, pointerEvents: "none" }} />
    </div>
  );
};

/** Retícula de microscopio (círculo con cruz y marcas) con barra de escala. Origen = centro. */
export const Reticula: React.FC<{ x: number; y: number; r: number; t?: number; color?: string; escala?: string; k?: number }> = ({ x, y, r, t = 0, color = RO.cian, escala, k = 1 }) => (
  <g opacity={clamp(k * 2)}>
    <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={4} opacity={0.85} />
    <circle cx={x} cy={y} r={r + 14} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="6 10" opacity={0.5} transform={`rotate(${t * 12} ${x} ${y})`} />
    <line x1={x - r} y1={y} x2={x - r * 0.15} y2={y} stroke={color} strokeWidth={2} opacity={0.7} /><line x1={x + r * 0.15} y1={y} x2={x + r} y2={y} stroke={color} strokeWidth={2} opacity={0.7} />
    <line x1={x} y1={y - r} x2={x} y2={y - r * 0.15} stroke={color} strokeWidth={2} opacity={0.7} /><line x1={x} y1={y + r * 0.15} x2={x} y2={y + r} stroke={color} strokeWidth={2} opacity={0.7} />
    {Array.from({ length: 10 }, (_, i) => <line key={i} x1={x - r + (i * 2 * r) / 9} y1={y - 8} x2={x - r + (i * 2 * r) / 9} y2={y + 8} stroke={color} strokeWidth={2} opacity={0.5} />)}
    {escala && <g transform={`translate(${x - r} ${y + r + 40})`}><line x1={0} y1={0} x2={150} y2={0} stroke={color} strokeWidth={5} /><line x1={0} y1={-10} x2={0} y2={10} stroke={color} strokeWidth={4} /><line x1={150} y1={-10} x2={150} y2={10} stroke={color} strokeWidth={4} /><text x={170} y={9} fontFamily={MONOF} fontWeight={700} fontSize={28} fill={color} data-texto="rom-escala">{escala}</text></g>}
  </g>
);

/* ───────────── mar ───────────── */

export const Mar: React.FC<{ y: number; t: number; alto?: number; claro?: string; oscuro?: string; opacidad?: number }> = ({ y, t, alto = 700, claro = RO.mar, oscuro = RO.marOsc, opacidad = 0.92 }) => {
  const uid = useUid();
  const pts = Array.from({ length: 28 }, (_, i) => `L ${i * 40} ${y + Math.sin(t * 2 + i * 0.7) * 7 + Math.sin(t * 1.3 + i * 1.9) * 4}`).join(" ");
  return (
    <g>
      <defs><linearGradient id={`${uid}m`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={claro} stopOpacity={opacidad} /><stop offset="1" stopColor={oscuro} stopOpacity={opacidad} /></linearGradient></defs>
      <path d={`M 0 ${y + 20} ${pts} L ${W} ${y + alto} L 0 ${y + alto} Z`} fill={`url(#${uid}m)`} />
      <path d={`M 0 ${y} ${Array.from({ length: 28 }, (_, i) => `L ${i * 40} ${y + Math.sin(t * 2 + i * 0.7) * 7 + Math.sin(t * 1.3 + i * 1.9) * 4}`).join(" ")}`} fill="none" stroke="#CFF4FF" strokeWidth={3} opacity={0.7} />
      {Array.from({ length: 10 }, (_, i) => {
        const q = (t * 0.2 + azar(i * 3.3)) % 1;
        return <circle key={i} cx={azar(i * 7.1) * W} cy={y + alto * 0.9 * (1 - q)} r={3 + azar(i * 5.3) * 5} fill="#CFF4FF" opacity={0.3 * Math.sin(q * Math.PI)} />;
      })}
    </g>
  );
};

/* ───────────── personajes ───────────── */

/** Inspector con gabardina, sombrero y lupa. Origen = centro de los pies. */
export const Inspector: React.FC<{ x: number; y: number; s?: number; fase?: number; lupa?: boolean; espejo?: boolean; lupaGrande?: number }> = ({ x, y, s = 1, fase = 0, lupa = true, espejo, lupaGrande = 1 }) => {
  const bal = Math.sin(fase) * 4;
  return (
    <g transform={`translate(${x} ${y}) scale(${(espejo ? -1 : 1) * s} ${s})`}>
      <ellipse cx={0} cy={2} rx={34} ry={7} fill="#000" opacity={0.35} />
      <line x1={-9} y1={-56} x2={-11 - bal} y2={-2} stroke="#1B2A33" strokeWidth={12} strokeLinecap="round" />
      <line x1={9} y1={-56} x2={11 + bal} y2={-2} stroke="#1B2A33" strokeWidth={12} strokeLinecap="round" />
      <path d="M -30 -50 L -22 -126 Q 0 -138 22 -126 L 30 -50 Z" fill="#B58B54" stroke="#6B4F2A" strokeWidth={3} />
      <line x1={0} y1={-126} x2={0} y2={-52} stroke="#6B4F2A" strokeWidth={3} />
      <circle cx={-8} cy={-98} r={3} fill="#6B4F2A" /><circle cx={-8} cy={-80} r={3} fill="#6B4F2A" />
      <path d="M -20 -128 L 0 -108 L 20 -128 L 14 -138 L -14 -138 Z" fill="#8F6B3A" />
      <circle cx={0} cy={-152} r={20} fill="#EBCDA6" stroke="#8B6A44" strokeWidth={2} />
      <circle cx={7} cy={-154} r={2.6} fill="#1A1008" />
      <path d="M 2 -144 Q 9 -141 14 -145" stroke="#3B2716" strokeWidth={3} fill="none" strokeLinecap="round" />
      <ellipse cx={0} cy={-170} rx={38} ry={8} fill="#4A3820" stroke="#2A1E10" strokeWidth={2} />
      <path d="M -22 -170 Q -22 -202 0 -204 Q 22 -202 22 -170 Z" fill="#4A3820" stroke="#2A1E10" strokeWidth={2} />
      <rect x={-22} y={-178} width={44} height={7} fill="#2A1E10" />
      {lupa && (
        <g transform={`translate(34 -98) rotate(${-20 + bal})`}>
          <line x1={0} y1={0} x2={30} y2={-24} stroke="#6B4F2A" strokeWidth={8} strokeLinecap="round" />
          <circle cx={42} cy={-34} r={26 * lupaGrande} fill="#BDEFFF" fillOpacity={0.35} stroke="#C9A35E" strokeWidth={6} />
          <path d={`M ${42 - 14 * lupaGrande} ${-34 - 6 * lupaGrande} Q ${42 - 8 * lupaGrande} ${-34 - 18 * lupaGrande} ${42 + 4 * lupaGrande} ${-34 - 18 * lupaGrande}`} stroke="#fff" strokeWidth={3} fill="none" opacity={0.8} />
        </g>
      )}
    </g>
  );
};

/* ───────────── puente moderno ───────────── */

/** Puente de hormigón armado visto de lado: tablero y dos pilas dentro del agua. `deg` 0–1 = degradación (manchas de óxido, grietas, hierros a la vista, trozos que caen). Origen: (x, y) = centro del borde superior del tablero. */
export const PuenteModerno: React.FC<{ x: number; y: number; w?: number; deg?: number; t?: number; pila?: number }> = ({ x, y, w = 820, deg = 0, t = 0, pila = 230 }) => {
  const xs = [-w * 0.27, w * 0.27];
  return (
    <g transform={`translate(${x} ${y})`}>
      {xs.map((px, i) => (
        <g key={i}>
          <rect x={px - 40} y={44} width={80} height={pila} fill="#9AA0A4" stroke="#4A5156" strokeWidth={4} />
          {/* óxido que sangra */}
          {Array.from({ length: 5 }, (_, k) => <rect key={k} x={px - 30 + k * 14} y={44 + 40 + azar(i * 9 + k) * 40} width={9} height={(60 + azar(i * 5 + k) * 120) * deg} fill={RO.herrumbre} opacity={0.75 * clamp(deg * 1.6)} />)}
          {/* grietas */}
          {deg > 0.25 && <path d={`M ${px - 34} ${80} l 14 30 l -10 24 l 20 36 l -8 30`} fill="none" stroke="#1B1F22" strokeWidth={3} opacity={clamp((deg - 0.25) * 3)} />}
          {/* hierros a la vista */}
          {deg > 0.55 && <g opacity={clamp((deg - 0.55) * 3)}><rect x={px - 24} y={130} width={48} height={70} fill="#4A3A30" /><line x1={px - 22} y1={140} x2={px + 22} y2={140} stroke={RO.herrumbre} strokeWidth={6} /><line x1={px - 22} y1={160} x2={px + 22} y2={160} stroke={RO.herrumbre} strokeWidth={6} /><line x1={px - 22} y1={180} x2={px + 22} y2={180} stroke={RO.herrumbre} strokeWidth={6} /></g>}
          {/* trozos que caen */}
          {deg > 0.5 && Array.from({ length: 4 }, (_, k) => { const q = (t * 0.6 + k / 4 + i * 0.3) % 1; return <rect key={k} x={px - 20 + k * 14 + Math.sin(k * 3) * 10} y={150 + q * 130} width={10} height={9} fill="#7A8084" opacity={1 - q} transform={`rotate(${q * 240} ${px} ${150 + q * 130})`} />; })}
        </g>
      ))}
      <rect x={-w / 2} y={0} width={w} height={44} fill="#B3B7B9" stroke="#4A5156" strokeWidth={4} />
      <rect x={-w / 2} y={-30} width={w} height={8} fill="#6A7176" />
      {Array.from({ length: Math.floor(w / 60) + 1 }, (_, i) => <line key={i} x1={-w / 2 + i * 60} y1={-30} x2={-w / 2 + i * 60} y2={0} stroke="#6A7176" strokeWidth={5} />)}
      {deg > 0.3 && Array.from({ length: 6 }, (_, i) => <rect key={i} x={-w / 2 + 60 + i * 130} y={44} width={16} height={(18 + azar(i * 3.3) * 26) * deg} fill={RO.herrumbre} opacity={0.7} />)}
    </g>
  );
};

/** Viaducto moderno que se parte: dos mitades que se inclinan y caen con polvo. `k` 0–1 = cuánto se ha partido. */
export const Viaducto: React.FC<{ x: number; y: number; w?: number; k?: number; t?: number }> = ({ x, y, w = 460, k = 0, t = 0 }) => {
  const e = easeOut(k);
  return (
    <g transform={`translate(${x} ${y})`}>
      <g transform={`rotate(${-e * 20} ${-w / 2} 22)`}><rect x={-w / 2} y={0} width={w / 2 - 6} height={42} fill="#B3B7B9" stroke="#4A5156" strokeWidth={4} /></g>
      <g transform={`translate(${e * 8} ${e * 90}) rotate(${e * 24} ${w / 2} 22)`}><rect x={6} y={0} width={w / 2 - 6} height={42} fill="#B3B7B9" stroke="#4A5156" strokeWidth={4} /></g>
      <rect x={-w / 2 + 40} y={42} width={50} height={190} fill="#9AA0A4" stroke="#4A5156" strokeWidth={4} />
      <rect x={w / 2 - 90} y={42} width={50} height={190} fill="#9AA0A4" stroke="#4A5156" strokeWidth={4} opacity={1 - e * 0.5} />
      {k > 0.05 && Array.from({ length: 9 }, (_, i) => { const q = (t * 0.8 + i / 9) % 1; return <circle key={i} cx={Math.sin(i * 2.3) * 60} cy={30 + q * 200} r={12 + q * 26} fill="#C9C2B4" opacity={0.4 * (1 - q) * clamp(k * 3)} />; })}
    </g>
  );
};

/* ───────────── muelle romano ───────────── */

/** Muelle de hormigón romano visto de frente, con arcos y destellos dorados (`brillo` 0–1) de cristales. Origen = centro de la base. */
export const MuelleRomano: React.FC<{ x: number; y: number; w?: number; t?: number; brillo?: number }> = ({ x, y, w = 760, t = 0, brillo = 0 }) => {
  const arcos = 3, aw = (w - 80) / arcos;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-170} width={w} height={170} fill="#B8AE98" stroke="#5E5546" strokeWidth={4} />
      <rect x={-w / 2 - 10} y={-196} width={w + 20} height={30} fill="#CFC5AD" stroke="#5E5546" strokeWidth={4} />
      {Array.from({ length: arcos }, (_, i) => {
        const cx = -w / 2 + 40 + aw * (i + 0.5);
        return <path key={i} d={`M ${cx - aw * 0.32} 0 L ${cx - aw * 0.32} -70 A ${aw * 0.32} ${aw * 0.32} 0 0 1 ${cx + aw * 0.32} -70 L ${cx + aw * 0.32} 0 Z`} fill="#10222C" stroke="#5E5546" strokeWidth={4} />;
      })}
      {Array.from({ length: 5 }, (_, i) => <line key={i} x1={-w / 2} y1={-150 + i * 30} x2={w / 2} y2={-150 + i * 30} stroke="#8F8670" strokeWidth={2} opacity={0.5} />)}
      {/* destellos de cristales */}
      {brillo > 0 && Array.from({ length: 16 }, (_, i) => {
        const px = -w / 2 + 30 + azar(i * 3.3) * (w - 60), py = -150 + azar(i * 5.1) * 140;
        const p = 0.5 + 0.5 * Math.sin(t * 4 + i * 1.7);
        return <g key={i} transform={`translate(${px} ${py})`} opacity={brillo * (0.4 + 0.6 * p)}><line x1={-10} y1={0} x2={10} y2={0} stroke={RO.oro} strokeWidth={3} /><line x1={0} y1={-10} x2={0} y2={10} stroke={RO.oro} strokeWidth={3} /><circle r={3} fill="#FFF6C4" /></g>;
      })}
    </g>
  );
};

/* ───────────── bloque, poros y cristales ───────────── */

/** Corte de hormigón romano: matriz de mortero con trozos de roca volcánica (áridos), poros y una grieta opcional. Origen = esquina superior izquierda. */
export const Bloque: React.FC<{ x: number; y: number; w: number; h: number; poros?: number; semilla?: number; agua?: number; grieta?: number }> = ({ x, y, w, h, poros = 8, semilla = 1, agua = 0, grieta = 0 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs><clipPath id={`${uid}c`}><rect x={0} y={0} width={w} height={h} rx={14} /></clipPath></defs>
      <g clipPath={`url(#${uid}c)`}>
        <rect width={w} height={h} fill="#C9BFA8" />
        {Array.from({ length: 70 }, (_, i) => <circle key={i} cx={azar(i * 3.3 + semilla) * w} cy={azar(i * 5.1 + semilla) * h} r={2 + azar(i * 7.7) * 3} fill="#A99F88" opacity={0.7} />)}
        {Array.from({ length: 9 }, (_, i) => {
          const cx = azar(i * 11.3 + semilla) * w, cy = azar(i * 7.9 + semilla) * h, r = Math.min(w, h) * (0.07 + azar(i * 4.3) * 0.08);
          const pts = Array.from({ length: 7 }, (_, k) => { const a = (k / 7) * Math.PI * 2; const rr = r * (0.7 + azar(i * 13 + k) * 0.5); return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`; }).join(" ");
          return <polygon key={i} points={pts} fill={["#6B5E52", "#7C6B5B", "#5A5048"][i % 3]} stroke="#3B332C" strokeWidth={2} />;
        })}
        {Array.from({ length: poros }, (_, i) => {
          const cx = azar(i * 17.3 + semilla) * w, cy = azar(i * 9.7 + semilla) * h, r = Math.min(w, h) * (0.025 + azar(i * 3.1) * 0.03);
          return <g key={i}><ellipse cx={cx} cy={cy} rx={r * 1.4} ry={r} fill="#2A2620" /><ellipse cx={cx} cy={cy} rx={r * 1.4 * agua} ry={r * agua} fill={RO.cian} opacity={0.8} /></g>;
        })}
        {grieta > 0 && <path d={`M ${w * 0.1} ${h * 0.2} L ${w * 0.3} ${h * 0.4} L ${w * 0.45} ${h * 0.36} L ${w * 0.62} ${h * 0.6} L ${w * 0.8} ${h * 0.7} L ${w * 0.95} ${h * 0.9}`} fill="none" stroke="#14110D" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={grieta} />}
      </g>
      <rect width={w} height={h} rx={14} fill="none" stroke={RO.cian} strokeWidth={4} opacity={0.8} />
    </g>
  );
};

/** Cristales de tobermorita: placas finas que crecen desde un punto (o a lo largo de una línea). `k` 0–1 = cuánto han crecido. */
export const Cristales: React.FC<{ x: number; y: number; r: number; k: number; t?: number; n?: number; color?: string; semilla?: number }> = ({ x, y, r, k, t = 0, n = 26, color = RO.oro, semilla = 1 }) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + azar(i * 3.3 + semilla) * 0.4;
      const L = r * clamp(k * 1.4 - azar(i * 5.7 + semilla) * 0.4) * (0.55 + azar(i * 9.1 + semilla) * 0.6);
      if (L < 2) return null;
      const ww = 3 + azar(i * 2.9) * 5;
      return (
        <g key={i} transform={`rotate(${(a * 180) / Math.PI})`}>
          <rect x={0} y={-ww / 2} width={L} height={ww} rx={ww / 2} fill={color} opacity={0.9} />
          <rect x={L * 0.1} y={-ww / 2} width={L * 0.8} height={ww * 0.35} rx={1} fill="#FFF6C4" opacity={0.7} />
          {L > r * 0.5 && <circle cx={L} cy={0} r={ww * 0.7} fill="#FFF6C4" opacity={0.5 + 0.4 * Math.sin(t * 5 + i)} />}
        </g>
      );
    })}
    <circle r={r * 0.08} fill={color} />
  </g>
);

export const Ion: React.FC<{ x: number; y: number; texto: string; color?: string; r?: number; id?: string; k?: number }> = ({ x, y, texto, color = RO.cian, r = 26, id = "ion", k = 1 }) => (
  <g opacity={clamp(k * 2)}>
    <circle cx={x} cy={y} r={r * (0.7 + 0.3 * easeOut(k))} fill={mezclar("#04101A", color, 0.25)} stroke={color} strokeWidth={4} />
    <text x={x} y={y + r * 0.35} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={r * 0.95} fill={color} data-texto={id}>{texto}</text>
  </g>
);

export const Gota: React.FC<{ x: number; y: number; s?: number; color?: string }> = ({ x, y, s = 1, color = RO.cian }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M 0 -26 C 14 -6 22 4 22 14 A 22 22 0 0 1 -22 14 C -22 4 -14 -6 0 -26 Z" fill={color} stroke="#E5FAFF" strokeWidth={3} opacity={0.9} />
);

/* ───────────── escenarios ───────────── */

export const Barco: React.FC<{ x: number; y: number; s?: number; t?: number }> = ({ x, y, s = 1, t = 0 }) => (
  <g transform={`translate(${x} ${y + Math.sin(t * 2) * 6}) rotate(${Math.sin(t * 1.6) * 2}) scale(${s})`}>
    <path d="M -170 0 L 170 0 L 130 60 L -130 60 Z" fill="#7B4A26" stroke="#2A1608" strokeWidth={5} />
    <path d="M -190 -22 Q -180 -2 -170 0 L -170 -26 Z" fill="#7B4A26" stroke="#2A1608" strokeWidth={4} />
    <rect x={-6} y={-200} width={12} height={200} fill="#5A3A1E" stroke="#2A1608" strokeWidth={3} />
    <path d="M -130 -190 L 130 -190 L 110 -40 L -110 -40 Z" fill="#E8DCC0" stroke="#7A6A48" strokeWidth={4} />
    {[-70, 0, 70].map((dx) => <rect key={dx} x={dx - 6} y={-186} width={12} height={142} fill="#B3302A" opacity={0.85} />)}
    {[-110, -70, -30, 10, 50, 90].map((dx, i) => <g key={i}><rect x={dx} y={-16} width={34} height={26} rx={7} fill="#8A8F96" stroke="#3B3F44" strokeWidth={3} /></g>)}
    {Array.from({ length: 5 }, (_, i) => <line key={i} x1={-100 + i * 50} y1={30} x2={-130 + i * 50 + Math.sin(t * 3 + i) * 10} y2={96} stroke="#5A3A1E" strokeWidth={5} strokeLinecap="round" />)}
  </g>
);

/** Volcán con penacho de ceniza y brasas. Origen = centro de la base. */
export const Volcan: React.FC<{ x: number; y: number; s?: number; t?: number; k?: number }> = ({ x, y, s = 1, t = 0, k = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={clamp(k * 2)}>
    <path d="M -360 0 L -80 -330 L -30 -350 L 30 -340 L 90 -330 L 360 0 Z" fill="#3E3A38" stroke="#1B1816" strokeWidth={5} />
    <path d="M -80 -330 L -30 -350 L 30 -340 L 90 -330 L 50 -312 L -50 -318 Z" fill="#E5602D" />
    {Array.from({ length: 9 }, (_, i) => { const q = (t * 0.22 + i / 9) % 1; return <circle key={i} cx={Math.sin(i * 2.7 + t) * 50 * q} cy={-340 - q * 380} r={30 + q * 70} fill="#6E6A66" opacity={0.7 * (1 - q)} />; })}
    {Array.from({ length: 12 }, (_, i) => { const q = (t * 0.7 + i / 12) % 1; return <circle key={i} cx={Math.sin(i * 5.1) * 90 * q} cy={-340 - q * 220} r={4} fill="#FFB020" opacity={1 - q} />; })}
  </g>
);

/** Panteón visto de frente: pórtico con columnas, tambor y cúpula con ojo (óculo) y rayo de luz. Origen = centro de la base. */
export const Panteon: React.FC<{ x: number; y: number; s?: number; t?: number; brillo?: number }> = ({ x, y, s = 1, t = 0, brillo = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -190 -230 A 190 190 0 0 1 190 -230 Z" fill="#D9CFB8" stroke="#6A604C" strokeWidth={5} />
    {[-130, -70, 0, 70, 130].map((dx, i) => <path key={i} d={`M ${dx * 0.15} -230 Q ${dx * 0.9} -300 ${dx} -410`} fill="none" stroke="#B8AE98" strokeWidth={4} opacity={0.6} />)}
    <ellipse cx={0} cy={-422} rx={26} ry={8} fill="#FFF6C4" opacity={0.9 * brillo} />
    <rect x={-190} y={-232} width={380} height={160} fill="#CFC5AD" stroke="#6A604C" strokeWidth={5} />
    <polygon points="-150,-72 150,-72 130,-120 -130,-120" fill="#CFC5AD" stroke="#6A604C" strokeWidth={4} />
    <polygon points="-150,-120 0,-190 150,-120" fill="#D9CFB8" stroke="#6A604C" strokeWidth={5} />
    {[-120, -60, 0, 60, 120].map((dx) => <g key={dx}><rect x={dx - 13} y={-120} width={26} height={120} fill="#EDE6D6" stroke="#6A604C" strokeWidth={3} /><rect x={dx - 18} y={-128} width={36} height={10} fill="#D9CFB8" stroke="#6A604C" strokeWidth={3} /></g>)}
    <rect x={-170} y={0} width={340} height={14} fill="#B8AE98" stroke="#6A604C" strokeWidth={4} />
    <polygon points="-24,-422 24,-422 120,-100 -120,-100" fill="#FFF6C4" opacity={0.1 * brillo * (0.8 + 0.2 * Math.sin(t * 2))} />
  </g>
);

/** Fábrica de cemento con chimeneas que sueltan nubes de CO2. Origen = centro de la base. */
export const Fabrica: React.FC<{ x: number; y: number; s?: number; t?: number; k?: number }> = ({ x, y, s = 1, t = 0, k = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-260} y={-130} width={520} height={130} fill="#4A5258" stroke="#1B2126" strokeWidth={5} />
    <rect x={-210} y={-190} width={110} height={60} fill="#5A646B" stroke="#1B2126" strokeWidth={5} />
    {[-170, -30, 120].map((dx, i) => <g key={i}><rect x={dx - 26} y={-330 - i * 20} width={52} height={200 + i * 20} fill="#6A747B" stroke="#1B2126" strokeWidth={5} /><rect x={dx - 26} y={-330 - i * 20} width={52} height={14} fill="#B5532A" /></g>)}
    {[0, 1, 2].map((i) => Array.from({ length: 4 }, (_, j) => { const q = (t * 0.28 + j / 4 + i * 0.13) % 1; const dx = [-170, -30, 120][i]; return <g key={`${i}${j}`} opacity={clamp(k * 2) * 0.85 * (1 - q)}><circle cx={dx + Math.sin(j * 2 + t) * 20 * q + q * 60} cy={-350 - i * 20 - q * 260} r={32 + q * 54} fill="#5A5F63" /><text x={dx + q * 60} y={-340 - i * 20 - q * 260} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={26 + q * 18} fill="#E8EDEF" opacity={0.9}>CO₂</text></g>; }))}
    {[-200, -120, -40, 40, 120, 200].map((dx) => <rect key={dx} x={dx - 16} y={-100} width={32} height={30} fill="#FFB020" opacity={0.7 + 0.2 * Math.sin(t * 3 + dx)} />)}
  </g>
);

/** Sello de «CASO RESUELTO» (o el texto que sea) que cae de golpe. */
export const Sello: React.FC<{ x: number; y: number; texto: string; k?: number; color?: string; px?: number; rot?: number; id?: string }> = ({ x, y, texto, k = 1, color = RO.rojo, px = 74, rot = -10, id = "sello" }) => {
  const e = easeOut(k);
  const w = texto.length * px * 0.62 + 60;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${lerp(2.2, 1, e)})`} opacity={clamp(k * 3)}>
      <rect x={-w / 2} y={-px * 0.85} width={w} height={px * 1.5} rx={14} fill="none" stroke={color} strokeWidth={9} />
      <rect x={-w / 2 + 12} y={-px * 0.85 + 12} width={w - 24} height={px * 1.5 - 24} rx={8} fill="none" stroke={color} strokeWidth={3} />
      <text x={0} y={px * 0.25} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={px} letterSpacing={4} fill={color} data-texto={id}>{texto}</text>
    </g>
  );
};

/** Etiqueta de evidencia colgada de un hilo. (x, y) = punto donde cuelga. */
export const Evidencia: React.FC<{ x: number; y: number; texto: string; k?: number; color?: string; ancho?: number; id?: string }> = ({ x, y, texto, k = 1, color = RO.ambar, ancho = 360, id = "evid" }) => (
  <g transform={`translate(${x} ${y}) rotate(${Math.sin(k * 6) * 2 * (1 - clamp(k))})`} opacity={clamp(k * 2)}>
    <line x1={0} y1={0} x2={0} y2={34} stroke={color} strokeWidth={3} />
    <rect x={-ancho / 2} y={34} width={ancho} height={64} rx={10} fill="#0E1F2A" stroke={color} strokeWidth={4} />
    <circle cx={-ancho / 2 + 20} cy={66} r={6} fill={color} />
    <text x={8} y={76} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={27} fill={color} data-texto={id}>{texto}</text>
  </g>
);

export { H, W, aclarar, oscurecer };
