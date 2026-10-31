/**
 * Kit del video «Tu cerebro se lava mientras duermes» (carril B · SINAPSIS): un cerebro dibujado como render —volumen, giros, brillo especular,
 * halo— y los residuos ámbar / el líquido cefalorraquídeo cian que se mueven por él. Todo SVG determinista (mismas ramas en cada fotograma).
 *   Cerebro     perfil lateral con giros, cerebelo y tronco; admite hijos (en coordenadas del cerebro, recortados a su silueta)
 *   Residuos    motitas ámbar que brillan y la ola cian que las barre
 *   Zs          las «Z» del sueño que suben
 * Coordenadas locales del cerebro: x ∈ [-260, 260], y ∈ [-190, 150] (centro del cerebro en 0,0).
 */
import React from "react";
import { mulberry32 } from "../../anim/piezas";
import { useUid } from "../../estudio/util";
import { clamp } from "../comun";
import { MONOF } from "./real-kit";

export const GL = {
  /** líquido cefalorraquídeo */
  lcr: "#4FD1FF",
  lcrClaro: "#BDEBFF",
  lcrOsc: "#0B6E99",
  /** residuos (β-amiloide y metabolitos) */
  ambar: "#FFB020",
  ambarClaro: "#FFE0A3",
  ambarOsc: "#B26A00",
  /** tejido */
  carne: "#C98AA6",
  carneClara: "#F5D3E0",
  carneOsc: "#5E2C4C",
  surco: "#3F1733",
  /** vasos */
  arteria: "#E5392B",
  arteriaClara: "#FF9A8E",
  vena: "#4C7DFF",
  venaClara: "#9EC0FF",
  /** astrocitos */
  oro: "#FFC500",
  oroClaro: "#FFE58A",
  neurona: "#7C9BFF",
  fondoTejido: "#1A1230",
} as const;

/* ───────────── geometría del cerebro (polar → cartesiana) ───────────── */

const rBase = (th: number): number => 250 * (1 + 0.026 * Math.sin(7 * th + 0.6) + 0.016 * Math.sin(13 * th + 2) + 0.008 * Math.sin(21 * th + 1));
/** punto del contorno (escala `k` del radio) en el ángulo `th`; el borde de abajo es más plano y el de arriba más alto */
export const ptCerebro = (th: number, k = 1, ex = 0): [number, number] => {
  const r = rBase(th) * k * (1 + ex);
  const sy = Math.sin(th) > 0 ? 0.6 : 0.74;
  return [r * Math.cos(th), r * Math.sin(th) * sy - 20];
};

/** ¿el punto (x, y) cae dentro del cerebro (con un margen `m` < 1)? */
export const dentroCerebro = (x: number, y: number, m = 0.9): boolean => {
  const th = Math.atan2((y + 20) / (y + 20 > 0 ? 0.6 : 0.74), x);
  const [px, py] = ptCerebro(th, m);
  return Math.hypot(x, y + 20) <= Math.hypot(px, py + 20);
};

const trazo = (pts: [number, number][], cerrar = false): string => pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + (cerrar ? " Z" : "");

type GeoCer = { contorno: string; surcos: { d: string; w: number; dash: string }[]; cerebelo: string; tallo: string };
let GEO: GeoCer | null = null;
const geoCerebro = (): GeoCer => {
  if (GEO) return GEO;
  const contorno = trazo(Array.from({ length: 121 }, (_, i) => ptCerebro((i / 120) * Math.PI * 2)), true);
  const r = mulberry32(21);
  const surcos: GeoCer["surcos"] = [];
  // giros: trazos serpenteantes (caminata con giro suave) que no salen de la silueta
  for (let k = 0; k < 34; k++) {
    let x = 0, y = 0, guard = 0;
    do { x = (r() * 2 - 1) * 235; y = (r() * 2 - 1) * 165 - 20; } while (!dentroCerebro(x, y, 0.84) && guard++ < 200);
    let ang = r() * Math.PI * 2;
    const pts: [number, number][] = [[x, y]];
    const pasos = 8 + Math.floor(r() * 9);
    for (let i = 0; i < pasos; i++) {
      ang += (r() - 0.5) * 1.5 + 0.3 * Math.sin(i * 1.3 + k);
      const nx = x + Math.cos(ang) * 20, ny = y + Math.sin(ang) * 20;
      if (!dentroCerebro(nx, ny, 0.9)) break;
      x = nx; y = ny; pts.push([x, y]);
    }
    if (pts.length < 4) continue;
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length - 1; i++) d += ` Q ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${((pts[i][0] + pts[i + 1][0]) / 2).toFixed(1)} ${((pts[i][1] + pts[i + 1][1]) / 2).toFixed(1)}`;
    surcos.push({ d, w: 3.2 + r() * 2.2, dash: "none" });
  }
  // cisura lateral (la «hendidura» que separa el lóbulo temporal)
  surcos.push({ d: "M -40 40 C 20 -2 80 4 150 -30", w: 5, dash: "none" });
  surcos.push({ d: "M -150 -90 C -90 -40 -80 10 -50 40", w: 3.2, dash: "none" });
  const cerebelo = "M 70 62 C 120 40 215 52 232 92 C 244 124 190 150 134 146 C 90 143 52 108 70 62 Z";
  const tallo = "M 20 84 C 34 120 36 156 30 206 C 54 210 76 206 90 198 C 84 150 82 118 92 92 Z";
  GEO = { contorno, surcos, cerebelo, tallo };
  return GEO;
};

/**
 * Cerebro de perfil (mirando a la izquierda). `x, y` = centro; `s` = escala; `luz` 0–1 = intensidad del halo cian;
 * `sucio` 0–1 = viraje ámbar del tejido (se ve «cargado»); `lavado` 0–1 = brillo limpio; los hijos se dibujan recortados a la silueta.
 */
export const Cerebro: React.FC<{ x: number; y: number; s?: number; luz?: number; sucio?: number; opacidad?: number; children?: React.ReactNode; giro?: number }> = ({ x, y, s = 1, luz = 0.25, sucio = 0, opacidad = 1, children, giro = 0 }) => {
  const uid = useUid();
  const g = geoCerebro();
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${s})`} opacity={opacidad}>
      <defs>
        <radialGradient id={`${uid}c`} cx="38%" cy="28%" r="80%"><stop offset="0" stopColor={GL.carneClara} /><stop offset="0.42" stopColor={GL.carne} /><stop offset="1" stopColor={GL.carneOsc} /></radialGradient>
        <radialGradient id={`${uid}h`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={GL.lcr} stopOpacity={0.55 * luz + 0.05} /><stop offset="1" stopColor={GL.lcr} stopOpacity="0" /></radialGradient>
        <radialGradient id={`${uid}a`} cx="50%" cy="55%" r="55%"><stop offset="0" stopColor={GL.ambar} stopOpacity="0.55" /><stop offset="1" stopColor={GL.ambar} stopOpacity="0.05" /></radialGradient>
        <linearGradient id={`${uid}cb`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B07894" /><stop offset="1" stopColor="#4B2040" /></linearGradient>
        <clipPath id={`${uid}k`}><path d={g.contorno} /></clipPath>
        <filter id={`${uid}b`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      <ellipse cx={0} cy={-20} rx={420} ry={330} fill={`url(#${uid}h)`} />
      {/* tronco y cerebelo detrás */}
      <path d={g.tallo} fill={`url(#${uid}cb)`} stroke={GL.surco} strokeOpacity={0.5} strokeWidth={2} />
      <path d={g.cerebelo} fill={`url(#${uid}cb)`} stroke={GL.surco} strokeOpacity={0.55} strokeWidth={2} />
      {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M ${82 + i * 6} ${70 + i * 13} C 130 ${58 + i * 13} 190 ${62 + i * 13} 228 ${88 + i * 9}`} fill="none" stroke={GL.surco} strokeOpacity={0.5} strokeWidth={2.4} />)}
      {/* sombra proyectada */}
      <path d={g.contorno} fill="#000" opacity={0.35} transform="translate(8 14)" filter={`url(#${uid}b)`} />
      {/* masa */}
      <path d={g.contorno} fill={`url(#${uid}c)`} />
      <g clipPath={`url(#${uid}k)`}>
        {sucio > 0 && <rect x={-280} y={-220} width={560} height={400} fill={`url(#${uid}a)`} opacity={sucio} />}
        {g.surcos.map((su, i) => <path key={i} d={su.d} fill="none" stroke={GL.surco} strokeOpacity={0.45} strokeWidth={su.w} strokeLinecap="round" strokeDasharray={su.dash === "none" ? undefined : su.dash} />)}
        {g.surcos.slice(0, 34).map((su, i) => <path key={`l${i}`} d={su.d} fill="none" stroke="#fff" strokeOpacity={0.2} strokeWidth={1.8} strokeLinecap="round" transform="translate(-2.6 -2.6)" />)}
        {children}
        {/* luz especular y borde oscuro */}
        <ellipse cx={-110} cy={-120} rx={150} ry={56} fill="#fff" opacity={0.2} transform="rotate(-18 -110 -120)" />
        <path d={g.contorno} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={26} />
      </g>
      <path d={g.contorno} fill="none" stroke={GL.carneClara} strokeOpacity={0.5} strokeWidth={2.4} />
    </g>
  );
};

/* ───────────── residuos ámbar ───────────── */

export type Motita = { x: number; y: number; r: number; fase: number };
const cacheMot = new Map<string, Motita[]>();
/** `n` motitas repartidas dentro de la silueta del cerebro (coordenadas locales), siempre las mismas. */
export const motitasCerebro = (n: number, semilla = 5): Motita[] => {
  const clave = `${n}|${semilla}`;
  const c = cacheMot.get(clave);
  if (c) return c;
  const r = mulberry32(semilla);
  const out: Motita[] = [];
  let guard = 0;
  while (out.length < n && guard++ < 4000) {
    const x = (r() * 2 - 1) * 250, y = (r() * 2 - 1) * 170 - 20;
    if (dentroCerebro(x, y, 0.86)) out.push({ x, y, r: 3.2 + r() * 4.8, fase: r() * 6.28 });
  }
  cacheMot.set(clave, out);
  return out;
};

/**
 * Motitas ámbar con halo. `visibles` 0–1 = qué fracción existe; `ola` = posición x (local) de una ola cian que las barre (o null);
 * las que quedan a la izquierda de la ola se apagan y empujan hacia la derecha.
 */
export const Residuos: React.FC<{ motitas: Motita[]; t: number; visibles?: number; ola?: number | null; opacidad?: number }> = ({ motitas, t, visibles = 1, ola = null, opacidad = 1 }) => {
  const n = Math.round(motitas.length * clamp(visibles));
  return (
    <g opacity={opacidad}>
      {motitas.slice(0, n).map((m, i) => {
        const barrida = ola === null ? 0 : clamp((ola - m.x) / 90);
        const k = 1 - barrida;
        if (k <= 0.01) return null;
        const pulso = 0.8 + 0.2 * Math.sin(t * 3 + m.fase);
        const dx = barrida * 40, dy = -barrida * 10 * Math.sin(m.fase);
        return (
          <g key={i} transform={`translate(${m.x + dx} ${m.y + dy})`} opacity={k}>
            <circle r={m.r * 3.2} fill={GL.ambar} opacity={0.18 * pulso} />
            <circle r={m.r} fill={GL.ambarClaro} stroke={GL.ambar} strokeWidth={1.4} opacity={0.95} />
          </g>
        );
      })}
    </g>
  );
};

/** La ola de líquido cefalorraquídeo (banda cian con borde brillante) que cruza el cerebro de izquierda a derecha; `x` = posición del frente. */
export const OlaLCR: React.FC<{ x: number; ancho?: number; alto?: number; opacidad?: number }> = ({ x, ancho = 230, alto = 460, opacidad = 1 }) => {
  const uid = useUid();
  return (
    <g opacity={opacidad}>
      <defs><linearGradient id={`${uid}o`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={GL.lcr} stopOpacity="0" /><stop offset="0.8" stopColor={GL.lcr} stopOpacity="0.5" /><stop offset="0.96" stopColor={GL.lcrClaro} stopOpacity="0.95" /><stop offset="1" stopColor="#fff" stopOpacity="0.95" /></linearGradient></defs>
      <rect x={x - ancho} y={-alto / 2} width={ancho} height={alto} fill={`url(#${uid}o)`} />
    </g>
  );
};

/* ───────────── detalles ───────────── */

/** Las «Z» del sueño: suben y se desvanecen. Van en coordenadas absolutas del lienzo. */
export const Zs: React.FC<{ x: number; y: number; t: number; opacidad?: number; px?: number }> = ({ x, y, t, opacidad = 1, px = 70 }) => (
  <g opacity={opacidad}>
    {[0, 1, 2].map((i) => {
      const u = ((t * 0.55 + i / 3) % 1);
      const op = Math.sin(u * Math.PI);
      return <text key={i} x={x + u * 90 + i * 12} y={y - u * 150} fontFamily="Inter, sans-serif" fontWeight={800} fontSize={px * (0.6 + 0.5 * u)} fill={GL.lcrClaro} opacity={op * 0.9} stroke={GL.lcrOsc} strokeWidth={1.5} strokeOpacity={0.5}>Z</text>;
    })}
  </g>
);

/** Reloj digital en mono (HH:MM) dentro de una cápsula. */
export const RelojDigital: React.FC<{ x: number; y: number; hora: string; color?: string; px?: number; opacidad?: number }> = ({ x, y, hora, color = GL.lcrClaro, px = 54, opacidad = 1 }) => (
  <g opacity={opacidad} transform={`translate(${x} ${y})`}>
    <rect x={-px * 1.7} y={-px * 0.8} width={px * 3.4} height={px * 1.6} rx={px * 0.5} fill="#06101C" fillOpacity={0.82} stroke={color} strokeWidth={2.4} />
    <text x={0} y={px * 0.34} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={px} fill={color} letterSpacing="0.04em">{hora}</text>
  </g>
);
