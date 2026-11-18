/**
 * Kit de «El ascensor espacial» (IMNOBA · NASA NIAC / Obayashi · plano secuencia vertical · carril B). Todo en vectores, sin imágenes externas.
 * Paleta de marca: dorado #fdc300 (cinta, trepador, láser, acentos) y azul marino #0f1c46 (espacio profundo, fondos).
 *   Cielo        degradado según la altura `u` (0 = nivel del mar, 1 = espacio) con estrellas y halo de la atmósfera
 *   Nubes, Tormenta   capas con parallax que bajan mientras se sube, y rayos
 *   Cinta        cinta plana dorada con pulsos de luz que suben · Trepador: robot con paneles, rodillos, carita y gafas · Laser: haz con destellos
 *   Plataforma   plataforma oceánica móvil con grúa, torres y luces · Cohete: con corte de tanque de combustible
 *   Hexa, Nanotubo   red hexagonal de carbono (patrón) y nanotubo con sombreado
 *   Tierra, Cinturon, Estacion, Contrapeso   planeta con curvatura y luces, cinturones de Van Allen, estación GEO y asteroide contrapeso
 *   Flecha, Gaviota, Persona
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeOut, lerp, mezclar, aclarar, oscurecer, useReloj } from "../comun";
import { FONT, MONOF } from "./real-kit";

export const ES = {
  oro: "#fdc300", azul: "#0f1c46", azulMed: "#1B3380", cian: "#4FE3FF", rojo: "#FF5A4A", verde: "#7CFFB0", naranja: "#FF8A3D", blanco: "#F8FAFC",
  mar: "#1D6FA8", marOsc: "#0B3550", acero: "#9FB0C4", roca: "#6B5E52",
} as const;

/* ───────────── cielo y nubes ───────────── */

const CIELOS: { u: number; a: string; b: string }[] = [
  { u: 0, a: "#4FA8E8", b: "#CDEBFF" }, { u: 0.22, a: "#2A6CB5", b: "#7BBDEB" }, { u: 0.45, a: "#0B2147", b: "#245B9E" },
  { u: 0.7, a: "#050B22", b: "#0f1c46" }, { u: 1, a: "#02040E", b: "#0f1c46" },
];
const cieloColor = (u: number): [string, string] => {
  const x = clamp(u);
  for (let i = 1; i < CIELOS.length; i++) if (x <= CIELOS[i].u) { const k = (x - CIELOS[i - 1].u) / (CIELOS[i].u - CIELOS[i - 1].u); return [mezclar(CIELOS[i - 1].a, CIELOS[i].a, k), mezclar(CIELOS[i - 1].b, CIELOS[i].b, k)]; }
  return [CIELOS[4].a, CIELOS[4].b];
};

/** Fondo de cielo a pantalla completa. `u` = altura estilizada (0–1); `sc` = desplazamiento (px) de las estrellas al subir. */
export const Cielo: React.FC<{ u: number; t: number; sc?: number }> = ({ u, t, sc = 0 }) => {
  const uid = useUid();
  const [a, b] = cieloColor(u);
  const est = clamp((u - 0.32) * 2.2);
  return (
    <g>
      <defs><linearGradient id={`${uid}c`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient></defs>
      <rect width={W} height={H} fill={`url(#${uid}c)`} />
      {est > 0 && Array.from({ length: 90 }, (_, i) => {
        const prof = 0.3 + azar(i * 3.1) * 0.9;
        const y = ((azar(i * 5.3) * H + sc * prof) % H + H) % H;
        return <circle key={i} cx={azar(i * 7.7) * W} cy={y} r={0.8 + azar(i * 9.1) * 2.2 * prof} fill="#FFFFFF" opacity={est * (0.3 + 0.7 * Math.abs(Math.sin(t * 1.5 + i)))} />;
      })}
      {u < 0.5 && <ellipse cx={W * 0.78} cy={H * 0.2} rx={260} ry={260} fill="#FFF1B8" opacity={0.25 * (1 - u * 2)} />}
    </g>
  );
};

/** Nubes en capas que bajan al subir (`sc` = px de ascenso). `oscuras` 0–1 = cuánto se ennegrecen. */
export const Nubes: React.FC<{ sc: number; t: number; oscuras?: number; opacidad?: number; n?: number }> = ({ sc, t, oscuras = 0, opacidad = 1, n = 16 }) => (
  <g opacity={opacidad}>
    {Array.from({ length: n }, (_, i) => {
      const prof = 0.4 + azar(i * 3.7) * 1.1;
      const y = (((azar(i * 5.9) * (H + 600) + sc * prof) % (H + 600)) + (H + 600)) % (H + 600) - 300;
      const x = ((azar(i * 7.1) * (W + 600) + t * 14 * prof) % (W + 600)) - 300;
      const s = 0.8 + prof * 0.9;
      const col = mezclar("#FFFFFF", "#3A3F52", oscuras);
      return (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`} opacity={0.5 + 0.35 * prof / 1.5}>
          <ellipse cx={0} cy={0} rx={150} ry={46} fill={col} /><ellipse cx={-80} cy={-18} rx={90} ry={44} fill={col} /><ellipse cx={70} cy={-26} rx={100} ry={52} fill={col} /><ellipse cx={0} cy={22} rx={170} ry={30} fill={oscurecer(col, 0.12)} />
        </g>
      );
    })}
  </g>
);

/** Cumulonimbos oscuros con rayos. `rayo` 0–1 = destello. */
export const Tormenta: React.FC<{ sc: number; t: number; rayo?: number; x?: number }> = ({ sc, t, rayo = 0, x = 300 }) => (
  <g>
    <Nubes sc={sc} t={t} oscuras={0.85} n={12} />
    {rayo > 0 && <g opacity={rayo}><path d={`M ${x} 200 l -40 180 l 60 20 l -70 220 l 150 -260 l -70 -20 l 50 -140 Z`} fill="#FFF6C4" stroke="#FFE27A" strokeWidth={4} /><rect width={W} height={H} fill="#DDE8FF" opacity={0.25 * rayo} /></g>}
  </g>
);

/* ───────────── cinta y trepador ───────────── */

/** Cinta plana dorada vertical (x = centro) entre y0 e y1, con pulsos de luz que suben. */
export const Cinta: React.FC<{ x?: number; y0?: number; y1?: number; ancho?: number; t: number; brillo?: number; sube?: number }> = ({ x = 540, y0 = -50, y1 = H + 50, ancho = 34, t, brillo = 1, sube = 1 }) => {
  const uid = useUid();
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}r`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8A6A00" /><stop offset="0.35" stopColor="#FFE27A" /><stop offset="0.6" stopColor="#fdc300" /><stop offset="1" stopColor="#7A5A00" /></linearGradient>
      </defs>
      <rect x={x - ancho * 2.2} y={y0} width={ancho * 4.4} height={y1 - y0} fill="#fdc300" opacity={0.08 * brillo} />
      <rect x={x - ancho / 2} y={y0} width={ancho} height={y1 - y0} fill={`url(#${uid}r)`} stroke="#FFF0A0" strokeWidth={2} />
      {Array.from({ length: 14 }, (_, i) => { const q = ((t * 0.3 * sube + i / 14) % 1); const yy = lerp(y1, y0, q); return <rect key={i} x={x - ancho / 2} y={yy} width={ancho} height={60} fill="#FFFFFF" opacity={0.5 * brillo * Math.sin(q * Math.PI)} />; })}
      {Array.from({ length: Math.floor((y1 - y0) / 24) }, (_, i) => <line key={i} x1={x - ancho / 2} y1={y0 + i * 24} x2={x + ancho / 2} y2={y0 + i * 24} stroke="#7A5A00" strokeWidth={1.5} opacity={0.35} />)}
    </g>
  );
};

/** Trepador robótico: cuerpo azul marino con franjas doradas, paneles solares hacia abajo, rodillos que agarran la cinta y una carita. Origen = centro. */
export const Trepador: React.FC<{ x: number; y: number; t: number; s?: number; laser?: number; cara?: "normal" | "feliz" | "gafas" | "aburrido"; ventana?: boolean }> = ({ x, y, t, s = 1, laser = 0, cara = "normal", ventana }) => {
  const parp = Math.sin(t * 0.9) > 0.96 ? 0.1 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* paneles solares debajo */}
      <g transform="translate(0 150)">
        {Array.from({ length: 5 }, (_, i) => <rect key={i} x={-190 + i * 76} y={0} width={70} height={26} rx={3} fill="#2A56B8" stroke="#9FD0FF" strokeWidth={2} />)}
        <rect x={-190} y={-6} width={380} height={8} fill="#5A6A8A" />
        {laser > 0 && <ellipse cx={0} cy={12} rx={200 * laser} ry={26} fill="#FFF6C4" opacity={0.5 * laser} />}
      </g>
      {/* cuerpo */}
      <rect x={-90} y={-130} width={180} height={270} rx={26} fill="#0f1c46" stroke="#fdc300" strokeWidth={6} />
      <rect x={-90} y={-60} width={180} height={18} fill="#fdc300" /><rect x={-90} y={80} width={180} height={18} fill="#fdc300" />
      <rect x={-50} y={-120} width={100} height={46} rx={12} fill="#08122F" stroke="#4FE3FF" strokeWidth={3} />
      {cara !== "gafas" && <><ellipse cx={-20} cy={-98} rx={9} ry={11 * parp} fill="#4FE3FF" /><ellipse cx={20} cy={-98} rx={9} ry={11 * parp} fill="#4FE3FF" /></>}
      {cara === "gafas" && <g><rect x={-38} y={-110} width={34} height={22} rx={6} fill="#111" stroke="#fdc300" strokeWidth={3} /><rect x={4} y={-110} width={34} height={22} rx={6} fill="#111" stroke="#fdc300" strokeWidth={3} /><line x1={-4} y1={-100} x2={4} y2={-100} stroke="#fdc300" strokeWidth={3} /></g>}
      <path d={cara === "feliz" ? "M -16 -82 Q 0 -66 16 -82" : cara === "aburrido" ? "M -14 -78 L 14 -78" : "M -12 -80 Q 0 -74 12 -80"} stroke="#4FE3FF" strokeWidth={4} fill="none" strokeLinecap="round" />
      {ventana && <g><rect x={-60} y={-30} width={120} height={64} rx={12} fill="#BFE3FF" stroke="#fdc300" strokeWidth={4} /><circle cx={-20} cy={4} r={14} fill="#EBCDA6" /><circle cx={24} cy={8} r={12} fill="#E0B58A" /></g>}
      {/* rodillos que agarran la cinta */}
      {[-70, 40].map((yy, i) => <g key={i}><rect x={-34} y={yy} width={68} height={34} rx={10} fill="#3A4A7A" stroke="#fdc300" strokeWidth={3} /><circle cx={-22} cy={yy + 17} r={11} fill="#8FA0C8" /><circle cx={22} cy={yy + 17} r={11} fill="#8FA0C8" /><line x1={-22} y1={yy + 17 - 8} x2={-22 + Math.cos(t * 9 + i) * 8} y2={yy + 17 + Math.sin(t * 9 + i) * 8} stroke="#0f1c46" strokeWidth={3} /></g>)}
      <line x1={0} y1={-130} x2={0} y2={-175} stroke="#fdc300" strokeWidth={5} /><circle cx={0} cy={-180} r={9} fill={Math.sin(t * 6) > 0 ? "#FF5A4A" : "#7A2A22"} />
    </g>
  );
};

/** Haz láser desde (x0, y0) hasta (x1, y1) con destellos que viajan. */
export const Laser: React.FC<{ x0: number; y0: number; x1: number; y1: number; t: number; k?: number; ancho?: number }> = ({ x0, y0, x1, y1, t, k = 1, ancho = 16 }) => (
  <g opacity={clamp(k * 2)}>
    <line x1={x0} y1={y0} x2={lerp(x0, x1, k)} y2={lerp(y0, y1, k)} stroke="#FFE27A" strokeWidth={ancho * 2.4} opacity={0.18} strokeLinecap="round" />
    <line x1={x0} y1={y0} x2={lerp(x0, x1, k)} y2={lerp(y0, y1, k)} stroke="#fdc300" strokeWidth={ancho} opacity={0.6} strokeLinecap="round" />
    <line x1={x0} y1={y0} x2={lerp(x0, x1, k)} y2={lerp(y0, y1, k)} stroke="#FFFFFF" strokeWidth={ancho * 0.35} strokeLinecap="round" />
    {Array.from({ length: 6 }, (_, i) => { const q = (t * 1.2 + i / 6) % 1; return <circle key={i} cx={lerp(x0, lerp(x0, x1, k), q)} cy={lerp(y0, lerp(y0, y1, k), q)} r={ancho * 0.9} fill="#FFFFFF" opacity={0.8 * Math.sin(q * Math.PI)} />; })}
  </g>
);

/* ───────────── plataforma, cohete y gente ───────────── */

/** Plataforma oceánica móvil: dos pontones, cubierta, torres, grúa y luces. Origen = centro de la línea de flotación. */
export const Plataforma: React.FC<{ x: number; y: number; t: number; s?: number; grua?: number }> = ({ x, y, t, s = 1, grua = 0 }) => (
  <g transform={`translate(${x} ${y + Math.sin(t * 1.6) * 5}) rotate(${Math.sin(t * 1.1) * 0.8}) scale(${s})`}>
    <rect x={-330} y={-10} width={120} height={70} rx={20} fill="#C9D3DE" stroke="#3A4A5A" strokeWidth={5} /><rect x={210} y={-10} width={120} height={70} rx={20} fill="#C9D3DE" stroke="#3A4A5A" strokeWidth={5} />
    {[-270, 270].map((px) => <rect key={px} x={px - 22} y={-120} width={44} height={116} fill="#E5432D" stroke="#3A4A5A" strokeWidth={4} />)}
    <rect x={-360} y={-170} width={720} height={56} rx={8} fill="#F4F6F9" stroke="#3A4A5A" strokeWidth={5} />
    <rect x={-300} y={-250} width={110} height={80} fill="#9FB0C4" stroke="#3A4A5A" strokeWidth={4} />
    {[-280, -250, -220].map((wx) => <rect key={wx} x={wx} y={-232} width={18} height={20} fill="#FFE27A" />)}
    <g transform="translate(240 -170)"><line x1={0} y1={0} x2={0} y2={-230} stroke="#E5432D" strokeWidth={14} /><line x1={0} y1={-230} x2={-150 + grua * 150} y2={-210 + grua * 60} stroke="#E5432D" strokeWidth={10} /><line x1={-150 + grua * 150} y1={-210 + grua * 60} x2={-150 + grua * 150} y2={-130 + grua * 100} stroke="#FFFFFF" strokeWidth={3} /></g>
    {Array.from({ length: 6 }, (_, i) => <circle key={i} cx={-330 + i * 132} cy={-175} r={6} fill={Math.sin(t * 4 + i) > 0 ? "#FF5A4A" : "#FFE27A"} />)}
  </g>
);

/** Cohete con corte: tanque lleno de combustible (`comb` 0–1), cápsula chiquita arriba y llama (`fuego` 0–1). Origen = centro de la base. */
export const Cohete: React.FC<{ x: number; y: number; t: number; s?: number; fuego?: number; comb?: number; rot?: number }> = ({ x, y, t, s = 1, fuego = 1, comb = 1, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {fuego > 0 && <g>
      <ellipse cx={0} cy={60} rx={90 * fuego} ry={150 * fuego * (0.9 + 0.1 * Math.sin(t * 40))} fill="#FF7A2E" opacity={0.7} />
      <ellipse cx={0} cy={40} rx={52 * fuego} ry={110 * fuego * (0.9 + 0.1 * Math.sin(t * 52))} fill="#FFB020" />
      <ellipse cx={0} cy={20} rx={24 * fuego} ry={70 * fuego} fill="#FFF6C4" />
    </g>}
    <path d="M -60 0 L -60 -300 Q -60 -380 0 -430 Q 60 -380 60 -300 L 60 0 Z" fill="#F4F6F9" stroke="#3A4A5A" strokeWidth={5} />
    <rect x={-48} y={-290} width={96} height={280} rx={8} fill="#1B3380" opacity={0.35} />
    <rect x={-48} y={-10 - 280 * comb} width={96} height={280 * comb} rx={6} fill="#FF8A3D" opacity={0.85} />
    <ellipse cx={0} cy={-10 - 280 * comb} rx={48} ry={5} fill="#FFD39A" />
    <path d="M -24 -300 Q -24 -350 0 -380 Q 24 -350 24 -300 Z" fill="#0f1c46" stroke="#fdc300" strokeWidth={3} />
    <circle cx={0} cy={-332} r={9} fill="#4FE3FF" />
    <path d="M -60 -40 L -110 40 L -60 0 Z M 60 -40 L 110 40 L 60 0 Z" fill="#E5432D" stroke="#3A4A5A" strokeWidth={4} />
  </g>
);

export const Persona: React.FC<{ x: number; y: number; s?: number; color?: string; t?: number }> = ({ x, y, s = 1, color = "#E5432D", t = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={2} rx={14} ry={3} fill="#000" opacity={0.3} />
    <line x1={-3} y1={-20} x2={-4} y2={-1} stroke="#2B1E14" strokeWidth={5} strokeLinecap="round" /><line x1={4} y1={-20} x2={5} y2={-1} stroke="#2B1E14" strokeWidth={5} strokeLinecap="round" />
    <rect x={-8} y={-44} width={16} height={26} rx={6} fill={color} />
    <line x1={7} y1={-40} x2={14} y2={-30 + Math.sin(t * 8) * 4} stroke={color} strokeWidth={4} strokeLinecap="round" />
    <circle cx={0} cy={-52} r={8} fill="#EBCDA6" /><path d="M -8 -54 Q 0 -66 8 -54 Z" fill="#F2C230" />
  </g>
);

export const Gaviota: React.FC<{ x: number; y: number; t: number; s?: number }> = ({ x, y, t, s = 1 }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d={`M -36 0 Q -18 ${-24 + Math.sin(t * 9) * 8} 0 0 Q 18 ${-24 + Math.sin(t * 9) * 8} 36 0`} fill="none" stroke="#F8FAFC" strokeWidth={6} strokeLinecap="round" />
);

/* ───────────── materiales ───────────── */

/** Red hexagonal de carbono como patrón de relleno (átomos y enlaces). `z` = escala; se dibuja en el rectángulo dado. */
export const Hexa: React.FC<{ x: number; y: number; w: number; h: number; z?: number; t?: number; color?: string; atomo?: string; rot?: number }> = ({ x, y, w, h, z = 1, t = 0, color = "#4FE3FF", atomo = "#fdc300", rot = 0 }) => {
  const uid = useUid();
  const a = 40, W3 = 3 * a, H3 = Math.sqrt(3) * a;
  const hex = (cx: number, cy: number) => Array.from({ length: 6 }, (_, k) => `${(cx + a * Math.cos((k * Math.PI) / 3)).toFixed(1)},${(cy + a * Math.sin((k * Math.PI) / 3)).toFixed(1)}`).join(" ");
  const centros: [number, number][] = [[0, 0], [1.5 * a, H3 / 2], [3 * a, 0], [0, H3], [3 * a, H3], [1.5 * a, -H3 / 2], [1.5 * a, 1.5 * H3]];
  return (
    <g>
      <defs>
        <pattern id={`${uid}h`} width={W3} height={H3} patternUnits="userSpaceOnUse" patternTransform={`rotate(${rot}) scale(${z})`}>
          {centros.map(([cx, cy], i) => <polygon key={i} points={hex(cx, cy)} fill="none" stroke={color} strokeWidth={4} strokeLinejoin="round" />)}
          {centros.map(([cx, cy]) => Array.from({ length: 6 }, (_, k) => <circle key={`${cx}${cy}${k}`} cx={cx + a * Math.cos((k * Math.PI) / 3)} cy={cy + a * Math.sin((k * Math.PI) / 3)} r={7} fill={atomo} />))}
        </pattern>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${uid}h)`} opacity={0.95 + 0.05 * Math.sin(t * 3)} />
    </g>
  );
};

/** Nanotubo vertical: cilindro con red hexagonal y sombreado. Origen = centro. */
export const Nanotubo: React.FC<{ x: number; y: number; w: number; h: number; t?: number; z?: number }> = ({ x, y, w, h, t = 0, z = 0.6 }) => {
  const uid = useUid();
  return (
    <g>
      <defs>
        <clipPath id={`${uid}c`}><rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={w / 2} /></clipPath>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#000" stopOpacity="0.7" /><stop offset="0.35" stopColor="#fff" stopOpacity="0.1" /><stop offset="0.5" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.75" /></linearGradient>
      </defs>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={w / 2} fill="#08122F" />
      <g clipPath={`url(#${uid}c)`}>
        <Hexa x={x - w / 2} y={y - h / 2 - ((t * 20) % 70)} w={w} h={h + 70} z={z} t={t} />
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} fill={`url(#${uid}s)`} />
      </g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={w / 2} fill="none" stroke="#4FE3FF" strokeWidth={4} />
    </g>
  );
};

/* ───────────── espacio ───────────── */

/** Tierra vista desde arriba: disco con océanos, continentes, luces de ciudad en la noche y halo atmosférico. Origen = centro. */
export const Tierra: React.FC<{ cx: number; cy: number; r: number; t: number; luces?: number }> = ({ cx, cy, r, t, luces = 0.7 }) => {
  const uid = useUid();
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}e`} cx="38%" cy="32%" r="80%"><stop offset="0" stopColor="#4FB0F0" /><stop offset="0.6" stopColor="#1D6FA8" /><stop offset="1" stopColor="#0A2A52" /></radialGradient>
        <radialGradient id={`${uid}a`} cx="50%" cy="50%" r="50%"><stop offset="0.9" stopColor="#7FD0FF" stopOpacity="0.5" /><stop offset="1" stopColor="#7FD0FF" stopOpacity="0" /></radialGradient>
        <clipPath id={`${uid}k`}><circle cx={cx} cy={cy} r={r} /></clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r * 1.08} fill={`url(#${uid}a)`} />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}e)`} />
      <g clipPath={`url(#${uid}k)`}>
        {[[-0.3, -0.2, 0.34, 0.2], [0.35, 0.1, 0.28, 0.26], [-0.1, 0.45, 0.3, 0.14], [0.1, -0.6, 0.22, 0.12]].map(([dx, dy, rx, ry], i) => <ellipse key={i} cx={cx + dx * r + Math.sin(t * 0.1 + i) * 6} cy={cy + dy * r} rx={rx * r} ry={ry * r} fill="#3E8A4E" opacity={0.85} />)}
        {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={cx + (azar(i * 3.3) - 0.3) * r * 1.4} cy={cy + (azar(i * 5.1) - 0.2) * r * 1.4} r={2.4} fill="#FFE27A" opacity={luces * (0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i)))} />)}
        <circle cx={cx} cy={cy} r={r} fill="#000" opacity={0.0} />
      </g>
    </g>
  );
};

/** Cinturones de Van Allen: dos toroides luminosos alrededor de la Tierra con partículas. */
export const Cinturon: React.FC<{ cx: number; cy: number; r: number; t: number; k?: number }> = ({ cx, cy, r, t, k = 1 }) => (
  <g opacity={clamp(k * 2)}>
    {[1.35, 1.9].map((m, i) => (
      <g key={i}>
        <ellipse cx={cx} cy={cy} rx={r * m} ry={r * m * 0.62} fill="none" stroke={i ? "#FF8A3D" : "#4FE3FF"} strokeWidth={r * 0.18 * (i ? 1.3 : 1)} opacity={0.22} />
        <ellipse cx={cx} cy={cy} rx={r * m} ry={r * m * 0.62} fill="none" stroke={i ? "#FFD39A" : "#BFF3FF"} strokeWidth={5} opacity={0.6} />
        {Array.from({ length: 22 }, (_, j) => { const an = t * (i ? 0.6 : 0.9) + (j / 22) * Math.PI * 2; return <circle key={j} cx={cx + Math.cos(an) * r * m} cy={cy + Math.sin(an) * r * m * 0.62} r={6 + (j % 3) * 2} fill={i ? "#FFD39A" : "#BFF3FF"} opacity={0.9} />; })}
      </g>
    ))}
  </g>
);

export const Estacion: React.FC<{ x: number; y: number; t: number; s?: number }> = ({ x, y, t, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${Math.sin(t * 0.4) * 3}) scale(${s})`}>
    <rect x={-300} y={-14} width={200} height={28} fill="#2A56B8" stroke="#9FD0FF" strokeWidth={3} /><rect x={100} y={-14} width={200} height={28} fill="#2A56B8" stroke="#9FD0FF" strokeWidth={3} />
    {Array.from({ length: 5 }, (_, i) => <line key={i} x1={-300 + i * 40} y1={-14} x2={-300 + i * 40} y2={14} stroke="#9FD0FF" strokeWidth={2} />)}
    <rect x={-100} y={-70} width={200} height={140} rx={30} fill="#E8EDF3" stroke="#3A4A5A" strokeWidth={5} />
    <rect x={-60} y={-40} width={120} height={80} rx={16} fill="#0f1c46" stroke="#fdc300" strokeWidth={4} />
    {Array.from({ length: 5 }, (_, i) => <circle key={i} cx={-40 + i * 20} cy={0} r={5} fill={Math.sin(t * 4 + i) > 0 ? "#7CFFB0" : "#FFE27A"} />)}
    <rect x={-6} y={-130} width={12} height={60} fill="#fdc300" /><circle cx={0} cy={-136} r={8} fill="#FF5A4A" />
  </g>
);

export const Contrapeso: React.FC<{ x: number; y: number; t: number; s?: number }> = ({ x, y, t, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${t * 4}) scale(${s})`}>
    <path d="M -150 -20 L -90 -110 L 10 -140 L 120 -90 L 160 10 L 100 110 L -20 140 L -120 90 Z" fill="#6B5E52" stroke="#2E2822" strokeWidth={6} />
    {[[-60, -40, 36], [50, 20, 46], [-20, 70, 30], [90, -60, 24]].map(([cx, cy, r], i) => <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * 0.7} fill="#4A4038" stroke="#2E2822" strokeWidth={3} />)}
    <circle cx={0} cy={-150} r={14} fill="#fdc300" stroke="#7A5A00" strokeWidth={4} />
  </g>
);

export const Flecha: React.FC<{ x: number; y: number; L: number; abajo?: boolean; color: string; ancho?: number }> = ({ x, y, L, abajo, color, ancho = 14 }) => {
  const d = abajo ? 1 : -1;
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + d * L} stroke={color} strokeWidth={ancho} strokeLinecap="round" />
      <polygon points={`${x - ancho * 1.4},${y + d * (L - ancho)} ${x + ancho * 1.4},${y + d * (L - ancho)} ${x},${y + d * (L + ancho * 1.4)}`} fill={color} />
    </g>
  );
};

export { H, W, easeOut, aclarar, FONT, MONOF };
