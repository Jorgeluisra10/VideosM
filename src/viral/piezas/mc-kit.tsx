/**
 * Kit del video «Los cuadernos radiactivos de Marie Curie» (SINAPSIS · historia de la medicina): laboratorio oscuro con el brillo verde-azulado del radio, todo en vectores y determinista.
 *   Trebol      símbolo de radiación
 *   Cuaderno    cuaderno de laboratorio (cerrado o abierto, con letra y fórmulas) con aura radiactiva
 *   CajaPlomo   caja de plomo con tapa que se abre y trébol
 *   Geiger      contador Geiger con aguja que tiembla y luz que parpadea
 *   Mujer       busto de una científica de 1900 (moño, vestido oscuro, bata)
 *   Vial        tubo de ensayo con sal de radio que brilla
 *   LineaH      línea de tiempo (1867 · 1891 · 1898 · 1903 · 1914 · hoy)
 * Color: verde-azul = radio · sepia = papel · plomo = gris · oro = fechas y datos.
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeOut, lerp, mezclar } from "../comun";
import { FONT, MONOF } from "./real-kit";
import { sua } from "./jet-kit";

export const MC = {
  fondo: "#05080A",
  rad: "#5CFFD0",
  radOsc: "#0F5A48",
  sepia: "#C8A878",
  papel: "#E8DDC0",
  plomo: "#6B7480",
  oro: "#FFD166",
  rojo: "#FF5A5F",
  hielo: "#BFE0FF",
} as const;
export { sua, clamp, lerp, mezclar, easeOut, FONT, MONOF, azar };
export const SERIF = "Georgia, 'Times New Roman', serif";

export const Chip: React.FC<{ x: number; y: number; texto: string; color?: string; px?: number; opacidad?: number; id: string; anchor?: "left" | "center" }> = ({ x, y, texto, color = MC.oro, px = 28, opacidad = 1, id, anchor = "left" }) => (
  <div data-texto={id} style={{ position: "absolute", left: anchor === "left" ? x : x - 450, top: y, width: anchor === "left" ? undefined : 900, textAlign: anchor, opacity: opacidad, fontFamily: MONOF, fontWeight: 800, fontSize: px, letterSpacing: "0.06em", color, textShadow: "0 4px 18px rgba(0,0,0,0.85)", whiteSpace: "pre" }}>{texto}</div>
);

/** Ambiente: fondo oscuro con resplandor verde-azulado y partículas que brillan. */
export const Ambiente: React.FC<{ t: number; x?: number; y?: number; intensidad?: number }> = ({ t, x = 540, y = 900, intensidad = 1 }) => {
  const uid = useUid();
  return (
    <>
      <defs><radialGradient id={`${uid}g`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={MC.rad} stopOpacity={0.22 * intensidad} /><stop offset="0.6" stopColor={MC.radOsc} stopOpacity={0.1 * intensidad} /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient></defs>
      <circle cx={x} cy={y} r={640} fill={`url(#${uid}g)`} opacity={0.85 + 0.15 * Math.sin(t * 5)} />
      {Array.from({ length: 22 }, (_, i) => {
        const px = azar(i * 3.1) * W + Math.sin(t * 0.3 + i) * 30, py = ((azar(i * 5.7) * H - t * (8 + azar(i) * 18)) % H + H) % H;
        return <circle key={i} cx={px} cy={py} r={2 + azar(i * 2.9) * 3} fill={MC.rad} opacity={0.06 + 0.14 * azar(i * 7.7) * (0.6 + 0.4 * Math.sin(t * 3 + i))} />;
      })}
    </>
  );
};

/** Trébol de radiación. */
export const Trebol: React.FC<{ x: number; y: number; r: number; color?: string; fondo?: string }> = ({ x, y, r, color = "#111", fondo = "#FFD166" }) => {
  const sector = (a0: number): string => {
    const a1 = a0 + 60, p = (a: number, rr: number) => `${(Math.cos((a * Math.PI) / 180) * rr).toFixed(1)} ${(Math.sin((a * Math.PI) / 180) * rr).toFixed(1)}`;
    return `M ${p(a0, r * 0.22)} L ${p(a0, r * 0.88)} A ${r * 0.88} ${r * 0.88} 0 0 1 ${p(a1, r * 0.88)} L ${p(a1, r * 0.22)} A ${r * 0.22} ${r * 0.22} 0 0 0 ${p(a0, r * 0.22)} Z`;
  };
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={fondo} stroke={color} strokeWidth={r * 0.06} />
      {[-30, 90, 210].map((a) => <path key={a} d={sector(a)} fill={color} />)}
      <circle r={r * 0.14} fill={color} />
    </g>
  );
};

/* ───────────── cuaderno ───────────── */

/** Cuaderno de laboratorio. Origen = centro. Cerrado: 220×300; abierto (`abierto` = 1): 2 páginas de 400×320. `brillo` 0–1 = aura radiactiva. */
export const Cuaderno: React.FC<{ x: number; y: number; s?: number; abierto?: number; brillo?: number; t?: number; rot?: number }> = ({ x, y, s = 1, abierto = 0, brillo = 0.6, t = 0, rot = 0 }) => {
  const uid = useUid();
  const k = easeOut(abierto);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <defs>
        <radialGradient id={`${uid}a`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={MC.rad} stopOpacity="0.55" /><stop offset="1" stopColor={MC.rad} stopOpacity="0" /></radialGradient>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6A4426" /><stop offset="1" stopColor="#3A2412" /></linearGradient>
      </defs>
      <circle cx={0} cy={0} r={300 + 50 * k} fill={`url(#${uid}a)`} opacity={brillo * (0.8 + 0.2 * Math.sin(t * 6))} />
      {k < 0.5 ? (
        <g opacity={1 - k * 2}>
          <rect x={-110} y={-150} width={220} height={300} rx={10} fill={`url(#${uid}c)`} stroke="#1A0E06" strokeWidth={5} />
          <rect x={-110} y={-150} width={26} height={300} rx={8} fill="#2A180A" />
          <rect x={-60} y={-90} width={130} height={70} rx={4} fill={MC.papel} /><path d="M -46 -66 L 56 -66 M -46 -50 L 40 -50 M -46 -36 L 52 -36" stroke="#7A6A4A" strokeWidth={4} strokeLinecap="round" />
          <path d="M -110 90 L 110 90" stroke="#C8A878" strokeOpacity={0.5} strokeWidth={4} />
        </g>
      ) : null}
      <g opacity={clamp((k - 0.2) / 0.5)}>
        <rect x={-410} y={-170} width={410} height={330} rx={10} fill="#3A2412" /><rect x={0} y={-170} width={410} height={330} rx={10} fill="#3A2412" />
        <path d="M -400 -160 L -6 -160 L -6 150 L -400 150 Z" fill={MC.papel} /><path d="M 6 -160 L 400 -160 L 400 150 L 6 150 Z" fill="#E0D4B4" />
        {Array.from({ length: 11 }, (_, i) => <g key={i}><path d={`M -370 ${-120 + i * 26} L ${-60 - (i % 3) * 40} ${-120 + i * 26}`} stroke="#8A7A5A" strokeWidth={4} strokeLinecap="round" opacity={0.7} /><path d={`M 40 ${-120 + i * 26} L ${360 - (i % 4) * 50} ${-120 + i * 26}`} stroke="#8A7A5A" strokeWidth={4} strokeLinecap="round" opacity={0.7} /></g>)}
        <circle cx={-240} cy={30} r={50} fill="none" stroke="#6A5A3A" strokeWidth={4} /><circle cx={-240} cy={30} r={22} fill="none" stroke="#6A5A3A" strokeWidth={4} /><path d="M -190 30 L -120 30" stroke="#6A5A3A" strokeWidth={4} />
        <text x={110} y={-70} fontFamily={SERIF} fontStyle="italic" fontSize={34} fill="#5A4A2A">Ra</text><text x={180} y={-70} fontFamily={SERIF} fontStyle="italic" fontSize={34} fill="#5A4A2A">Po</text>
        <circle cx={-80} cy={110} r={11} fill={MC.rad} opacity={0.9} /><circle cx={310} cy={90} r={9} fill={MC.rad} opacity={0.7} /><circle cx={-300} cy={-120} r={8} fill={MC.rad} opacity={0.7} />
      </g>
      {Array.from({ length: 8 }, (_, i) => { const u = ((t * 0.25 + i / 8) % 1); return <circle key={i} cx={Math.cos(i * 0.8) * (100 + u * 200)} cy={-80 - u * 220 + Math.sin(i) * 30} r={4} fill={MC.rad} opacity={brillo * (1 - u) * 0.8} />; })}
    </g>
  );
};

/** Caja de plomo con tapa que se abre (`tapa` 0 = cerrada · 1 = abierta). Origen = centro de la base. */
export const CajaPlomo: React.FC<{ x: number; y: number; s?: number; tapa?: number }> = ({ x, y, s = 1, tapa = 0 }) => {
  const k = easeOut(tapa);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-250} y={-60} width={500} height={150} rx={12} fill="#5A626E" stroke="#2A2E36" strokeWidth={6} />
      <rect x={-250} y={-60} width={500} height={30} rx={10} fill="#7A8290" />
      {[-220, -110, 0, 110, 220].map((rx, i) => <circle key={i} cx={rx} cy={40} r={8} fill="#8A92A0" stroke="#2A2E36" strokeWidth={3} />)}
      <Trebol x={0} y={14} r={44} />
      <g transform={`translate(-250 -60) rotate(${-k * 110})`}>
        <rect x={0} y={-34} width={500} height={34} rx={8} fill="#6B7480" stroke="#2A2E36" strokeWidth={6} />
        <rect x={0} y={-34} width={500} height={10} rx={5} fill="#8A92A0" />
      </g>
    </g>
  );
};

/** Contador Geiger. `nivel` 0–1 = lectura (la aguja tiembla alrededor). Origen = centro. */
export const Geiger: React.FC<{ x: number; y: number; s?: number; nivel: number; t: number }> = ({ x, y, s = 1, nivel, t }) => {
  const ang = -60 + 120 * clamp(nivel + 0.05 * Math.sin(t * 40) * nivel + 0.03 * Math.sin(t * 17));
  const clic = Math.sin(t * 23) > 0.6 && nivel > 0.1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-130} y={-110} width={260} height={220} rx={26} fill="#C9A23A" stroke="#6A5014" strokeWidth={6} />
      <rect x={-104} y={-86} width={208} height={116} rx={14} fill="#F2EAD0" stroke="#6A5014" strokeWidth={4} />
      {Array.from({ length: 9 }, (_, i) => { const a = ((-60 + i * 15) * Math.PI) / 180; return <line key={i} x1={Math.sin(a) * 78} y1={20 - Math.cos(a) * 78} x2={Math.sin(a) * 92} y2={20 - Math.cos(a) * 92} stroke={i > 5 ? "#C2362F" : "#2A2418"} strokeWidth={4} />; })}
      <line x1={0} y1={20} x2={Math.sin((ang * Math.PI) / 180) * 84} y2={20 - Math.cos((ang * Math.PI) / 180) * 84} stroke="#B23A2A" strokeWidth={5} strokeLinecap="round" /><circle cx={0} cy={20} r={8} fill="#2A2418" />
      <circle cx={-80} cy={72} r={11} fill={clic ? "#FF5A5F" : "#5A1A1A"} />
      {Array.from({ length: 6 }, (_, i) => <circle key={i} cx={10 + (i % 3) * 26} cy={60 + Math.floor(i / 3) * 24} r={6} fill="#6A5014" />)}
    </g>
  );
};

/** Busto de científica (≈ 1900): moño, vestido oscuro y bata. Origen = centro de la cabeza (radio ≈ 44). */
export const Mujer: React.FC<{ x: number; y: number; s?: number; bata?: boolean; mira?: number }> = ({ x, y, s = 1, bata = true, mira = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -108 230 C -108 140 -76 96 -24 80 L 24 80 C 76 96 108 140 108 230 Z" fill="#241E2A" stroke="#000" strokeOpacity={0.4} strokeWidth={3} />
    {bata && <path d="M -108 230 C -108 140 -76 96 -24 80 L 0 150 L 24 80 C 76 96 108 140 108 230 Z" fill="#E8EEF4" opacity={0.92} />}
    <path d="M -22 80 L 0 120 L 22 80 Z" fill="#F4EEE4" />
    <rect x={-14} y={34} width={28} height={48} rx={10} fill="#E0B898" />
    <circle cx={0} cy={-52} r={26} fill="#4A3426" />
    <ellipse cx={0} cy={0} rx={42} ry={48} fill="#E6BE9E" stroke="#7A5A44" strokeWidth={2} />
    <path d="M -46 -6 C -52 -62 52 -62 46 -6 C 38 -34 -38 -34 -46 -6 Z" fill="#4A3426" />
    <path d="M -46 -6 C -50 18 -44 34 -38 40 L -40 0 Z M 46 -6 C 50 18 44 34 38 40 L 40 0 Z" fill="#4A3426" />
    <ellipse cx={-16 + mira * 3} cy={0} rx={6} ry={5} fill="#fff" /><ellipse cx={16 + mira * 3} cy={0} rx={6} ry={5} fill="#fff" /><circle cx={-16 + mira * 5} cy={0} r={3.2} fill="#2A1A14" /><circle cx={16 + mira * 5} cy={0} r={3.2} fill="#2A1A14" />
    <path d="M -24 -14 Q -16 -19 -8 -15 M 8 -15 Q 16 -19 24 -14" stroke="#3A2A20" strokeWidth={3} fill="none" strokeLinecap="round" />
    <path d="M -9 24 Q 0 27 9 24" stroke="#8A4A44" strokeWidth={3.2} fill="none" strokeLinecap="round" />
  </g>
);

/** Tubo de ensayo con sal de radio que brilla. Origen = base centrada; alto ≈ 150·s. */
export const Vial: React.FC<{ x: number; y: number; s?: number; brillo?: number; t?: number }> = ({ x, y, s = 1, brillo = 1, t = 0 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><radialGradient id={`${uid}r`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={MC.rad} stopOpacity="0.7" /><stop offset="1" stopColor={MC.rad} stopOpacity="0" /></radialGradient></defs>
      <circle cx={0} cy={-60} r={110} fill={`url(#${uid}r)`} opacity={brillo * (0.8 + 0.2 * Math.sin(t * 7))} />
      <path d="M -22 0 L -22 -120 L 22 -120 L 22 0 C 22 20 -22 20 -22 0 Z" fill="rgba(207,233,255,0.16)" stroke="#BFE0FF" strokeOpacity={0.7} strokeWidth={4} />
      <path d="M -20 -4 L -20 -40 L 20 -40 L 20 -4 C 20 14 -20 14 -20 -4 Z" fill={MC.rad} opacity={0.5 + 0.5 * brillo} />
      <rect x={-28} y={-130} width={56} height={12} rx={5} fill="#BFE0FF" opacity={0.7} />
    </g>
  );
};

/* ───────────── línea de tiempo ───────────── */

const HITOS = ["1867", "1891", "1898", "1903", "1914", "HOY"];
/** Línea de tiempo del video: `pos` 0–5 (parte entera = hito actual). */
export const LineaH: React.FC<{ y?: number; pos: number; opacidad?: number }> = ({ y = 1420, pos, opacidad = 1 }) => {
  const X0 = 150, X1 = 930, dx = (X1 - X0) / (HITOS.length - 1), p = clamp(pos / (HITOS.length - 1)) * (X1 - X0) + X0;
  const act = Math.min(HITOS.length - 1, Math.floor(pos + 0.001));
  return (
    <g opacity={opacidad}>
      <line x1={X0} y1={y} x2={X1} y2={y} stroke="#BFE0FF" strokeOpacity={0.25} strokeWidth={6} strokeLinecap="round" />
      <line x1={X0} y1={y} x2={p} y2={y} stroke={MC.rad} strokeWidth={6} strokeLinecap="round" />
      {HITOS.map((n, i) => {
        const a = i === act, h = i < act;
        return (
          <g key={n} transform={`translate(${X0 + i * dx} ${y})`}>
            <circle r={a ? 17 : 11} fill={a ? MC.rad : h ? "#1C6A58" : "#0B1412"} stroke={a ? "#fff" : "#BFE0FF"} strokeOpacity={a ? 1 : 0.5} strokeWidth={a ? 4 : 3} />
            {a && <circle r={30} fill="none" stroke={MC.rad} strokeWidth={3} opacity={0.4} />}
            <text x={0} y={52} textAnchor="middle" fontFamily={MONOF} fontWeight={a ? 800 : 600} fontSize={19} fill={a ? "#fff" : "#BFE0FF"} opacity={a ? 1 : 0.65}>{n}</text>
          </g>
        );
      })}
      <circle cx={p} cy={y} r={9} fill="#fff" />
    </g>
  );
};
