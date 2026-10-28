/**
 * Kit del video «El pegamento que no era pegamento» (carril B · SINAPSIS): figuras de microscopía dibujadas como renders —brillo interior, luz de borde,
 * halos suaves— sobre el estudio azul marino de los demás videos. Todo es SVG determinista (mismas ramas en cada fotograma y en el render).
 *   geoCelula        árbol de ramas de una célula (astrocito o neurona) con sus puntas, como datos puros
 *   Astrocito        célula con forma de estrella: soma dorado, ramas que crecen, puntas que se iluminan (sinapsis)
 *   Neurona          soma azul, dendritas finas y un axón largo con su botón terminal
 *   Pegote           mancha de «pegamento» gris con brillo y goteo
 *   Frasco           frasco de pegamento con etiqueta que se agrieta y se rompe
 */
import React from "react";
import { mulberry32 } from "../../anim/piezas";
import { useUid } from "../../estudio/util";
import { clamp, mezclar } from "../comun";

export const AC = {
  /** neuronas */
  azul: "#4C7DFF",
  azulClaro: "#9EC0FF",
  azulOscuro: "#1B2F7A",
  /** astrocitos */
  oro: "#FFC500",
  oroClaro: "#FFE58A",
  oroOscuro: "#9A6A00",
  /** pegamento */
  pega: "#D8D2C2",
  pegaOscuro: "#8E8878",
  rojo: "#F04124",
  hielo: "#BFE0FF",
  verde: "#10B981",
} as const;

export type Rama = { d: string; w: number; nivel: 1 | 2 | 3; ini: number; fin: number };
export type Punta = { x: number; y: number; ang: number };
export type GeoCelula = { ramas: Rama[]; puntas: Punta[]; radio: number };

export type OpcionesCelula = {
  semilla: number;
  /** ramas primarias saliendo del soma */
  primarias: number;
  /** [mín, máx] del largo de cada nivel (px, a escala 1) */
  l1: [number, number];
  l2: [number, number];
  l3: [number, number];
  /** ramas hijas por cada rama de nivel 1 y 2 */
  hijos2: number;
  hijos3: number;
  /** curvatura (radianes) */
  curva: number;
  /** grosor de cada nivel */
  w: [number, number, number];
  /** radio del soma (donde nacen las ramas) */
  soma: number;
};

const cache = new Map<string, GeoCelula>();

/** Árbol de ramas determinista: cada rama es una curva cuadrática; `ini`/`fin` (0–1) dicen cuándo crece (primarias, luego secundarias, luego puntas). */
export function geoCelula(o: OpcionesCelula): GeoCelula {
  const clave = JSON.stringify(o);
  const guardada = cache.get(clave);
  if (guardada) return guardada;
  const r = mulberry32(o.semilla);
  const rango = (p: [number, number]): number => p[0] + (p[1] - p[0]) * r();
  const ramas: Rama[] = [];
  const puntas: Punta[] = [];
  let radio = 0;
  const tramo = (x0: number, y0: number, ang: number, largo: number, curv: number): { d: string; x1: number; y1: number; ang1: number } => {
    const cx = x0 + Math.cos(ang + curv) * largo * 0.55;
    const cy = y0 + Math.sin(ang + curv) * largo * 0.55;
    const ang1 = ang + curv * 0.6;
    const x1 = x0 + Math.cos(ang1) * largo;
    const y1 = y0 + Math.sin(ang1) * largo;
    return { d: `M ${x0.toFixed(1)} ${y0.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`, x1, y1, ang1 };
  };
  for (let k = 0; k < o.primarias; k++) {
    const a0 = (k / o.primarias) * Math.PI * 2 + (r() - 0.5) * 0.35;
    const x0 = Math.cos(a0) * o.soma * 0.7, y0 = Math.sin(a0) * o.soma * 0.7;
    const t1 = tramo(x0, y0, a0, rango(o.l1), (r() - 0.5) * 2 * o.curva);
    const off = (k / o.primarias) * 0.12;
    ramas.push({ d: t1.d, w: o.w[0], nivel: 1, ini: off, fin: 0.45 + off });
    for (let j = 0; j < o.hijos2; j++) {
      const a1 = t1.ang1 + (j - (o.hijos2 - 1) / 2) * (0.75 + r() * 0.3) + (r() - 0.5) * 0.2;
      const t2 = tramo(t1.x1, t1.y1, a1, rango(o.l2), (r() - 0.5) * 2 * o.curva);
      ramas.push({ d: t2.d, w: o.w[1], nivel: 2, ini: 0.3 + off, fin: 0.75 + off * 0.5 });
      for (let q = 0; q < o.hijos3; q++) {
        const a2 = t2.ang1 + (q - (o.hijos3 - 1) / 2) * (0.8 + r() * 0.4) + (r() - 0.5) * 0.25;
        const t3 = tramo(t2.x1, t2.y1, a2, rango(o.l3), (r() - 0.5) * 2 * o.curva);
        ramas.push({ d: t3.d, w: o.w[2], nivel: 3, ini: 0.6 + off * 0.5, fin: 1 });
        puntas.push({ x: t3.x1, y: t3.y1, ang: t3.ang1 });
        radio = Math.max(radio, Math.hypot(t3.x1, t3.y1));
      }
    }
  }
  const g = { ramas, puntas, radio };
  cache.set(clave, g);
  return g;
}

export const OPC_ASTRO: OpcionesCelula = { semilla: 7, primarias: 10, l1: [120, 165], l2: [85, 120], l3: [38, 62], hijos2: 2, hijos3: 2, curva: 0.55, w: [9, 5.2, 2.6], soma: 52 };
export const OPC_NEURONA: OpcionesCelula = { semilla: 21, primarias: 6, l1: [95, 140], l2: [70, 105], l3: [34, 56], hijos2: 2, hijos3: 2, curva: 0.4, w: [6.4, 3.6, 1.9], soma: 46 };

const prog01 = (k: number, ini: number, fin: number): number => clamp((k - ini) / Math.max(0.0001, fin - ini));

/** Una pasada de ramas con crecimiento (dash) y un color/ancho/opacidad dados. */
const Pasada: React.FC<{ geo: GeoCelula; k: number; stroke: string; extra: number; mult: number; opacidad: number }> = ({ geo, k, stroke, extra, mult, opacidad }) => (
  <g fill="none" strokeLinecap="round" stroke={stroke} opacity={opacidad}>
    {geo.ramas.map((r, i) => {
      const p = prog01(k, r.ini, r.fin);
      if (p <= 0) return null;
      return <path key={i} d={r.d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} strokeWidth={r.w * mult + extra} />;
    })}
  </g>
);

/** Soma con volumen: degradado radial, borde de luz y núcleo. */
const Soma: React.FC<{ r: number; claro: string; medio: string; oscuro: string; nucleo: string; pulso?: number; id: string }> = ({ r, claro, medio, oscuro, nucleo, pulso = 0, id }) => (
  <g>
    <defs>
      <radialGradient id={`${id}so`} cx="38%" cy="32%" r="80%"><stop offset="0" stopColor={claro} /><stop offset="0.55" stopColor={medio} /><stop offset="1" stopColor={oscuro} /></radialGradient>
      <radialGradient id={`${id}nu`} cx="40%" cy="35%" r="70%"><stop offset="0" stopColor={mezclar(nucleo, "#fff", 0.35)} /><stop offset="1" stopColor={nucleo} /></radialGradient>
    </defs>
    <circle r={r * (1.5 + 0.12 * pulso)} fill={medio} opacity={0.12 + 0.1 * pulso} />
    <ellipse rx={r} ry={r * 0.9} fill={`url(#${id}so)`} />
    <ellipse rx={r} ry={r * 0.9} fill="none" stroke={claro} strokeOpacity={0.6} strokeWidth={2} />
    <circle cx={r * 0.06} cy={r * 0.04} r={r * 0.36} fill={`url(#${id}nu)`} />
    <ellipse cx={-r * 0.34} cy={-r * 0.4} rx={r * 0.28} ry={r * 0.15} fill="#fff" opacity={0.28} transform={`rotate(-30 ${-r * 0.34} ${-r * 0.4})`} />
  </g>
);

/**
 * Astrocito: célula con forma de estrella. `k` (0–1) = cuánto han crecido las ramas; `giro` = grados de giro lento; `luz` = brillo extra (0–1);
 * `puntasLuz(i)` (0–1) ilumina la punta i (sinapsis); el origen es el centro del soma.
 */
export const Astrocito: React.FC<{ x: number; y: number; s?: number; k?: number; t?: number; giro?: number; luz?: number; opacidad?: number; opciones?: OpcionesCelula; puntasLuz?: (i: number) => number; radioPunta?: number }> = ({
  x, y, s = 1, k = 1, t = 0, giro = 0, luz = 0, opacidad = 1, opciones = OPC_ASTRO, puntasLuz, radioPunta = 7,
}) => {
  const uid = useUid();
  const geo = geoCelula(opciones);
  const resp = 1 + 0.012 * Math.sin(t * 1.6);
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro + 2.5 * Math.sin(t * 0.45)}) scale(${s * resp})`} opacity={opacidad}>
      <Pasada geo={geo} k={k} stroke={AC.oroOscuro} extra={9} mult={1} opacidad={0.28} />
      <Pasada geo={geo} k={k} stroke={AC.oro} extra={0} mult={1} opacidad={0.95} />
      <Pasada geo={geo} k={k} stroke={AC.oroClaro} extra={0} mult={0.34} opacidad={0.8} />
      {puntasLuz && geo.puntas.map((p, i) => {
        const l = clamp(puntasLuz(i));
        if (l <= 0.01) return null;
        return (
          <g key={i} transform={`translate(${p.x} ${p.y})`}>
            <circle r={radioPunta * (2.4 + 1.6 * l)} fill={AC.azulClaro} opacity={0.22 * l} />
            <circle r={radioPunta * (0.7 + 0.5 * l)} fill="#fff" opacity={0.55 + 0.45 * l} />
            <circle r={radioPunta * 0.55} fill={AC.azul} opacity={l} />
          </g>
        );
      })}
      <Soma r={opciones.soma} claro={AC.oroClaro} medio={AC.oro} oscuro={AC.oroOscuro} nucleo="#B9650B" pulso={luz} id={uid} />
    </g>
  );
};

/**
 * Neurona: soma azul, dendritas ramificadas y un axón que baja con su botón terminal. `k` = crecimiento (0–1); `luz` = brillo; `axon` = 0–1 cuánto del axón se ve.
 * El axón sale por abajo (ángulo 90°) y mide `largoAxon` px.
 */
export const Neurona: React.FC<{ x: number; y: number; s?: number; k?: number; t?: number; luz?: number; opacidad?: number; axon?: number; largoAxon?: number; opciones?: OpcionesCelula; giro?: number }> = ({
  x, y, s = 1, k = 1, t = 0, luz = 0, opacidad = 1, axon = 1, largoAxon = 360, opciones = OPC_NEURONA, giro = 0,
}) => {
  const uid = useUid();
  const geo = geoCelula(opciones);
  const dAx = `M 0 ${opciones.soma * 0.8} C 24 ${largoAxon * 0.3} -30 ${largoAxon * 0.62} 6 ${largoAxon}`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${s})`} opacity={opacidad}>
      <Pasada geo={geo} k={k} stroke={AC.azulOscuro} extra={7} mult={1} opacidad={0.3} />
      <Pasada geo={geo} k={k} stroke={AC.azul} extra={0} mult={1} opacidad={0.95} />
      <Pasada geo={geo} k={k} stroke={AC.azulClaro} extra={0} mult={0.34} opacidad={0.75} />
      {axon > 0 && (
        <g fill="none" strokeLinecap="round">
          <path d={dAx} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(axon)} stroke={AC.azulOscuro} strokeOpacity={0.3} strokeWidth={14} />
          <path d={dAx} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(axon)} stroke={AC.azul} strokeWidth={6} />
          <path d={dAx} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(axon)} stroke={AC.azulClaro} strokeOpacity={0.7} strokeWidth={2} />
        </g>
      )}
      {axon > 0.98 && <circle cx={6} cy={largoAxon} r={14} fill={AC.azulClaro} stroke={AC.azul} strokeWidth={4} />}
      <Soma r={opciones.soma} claro={AC.azulClaro} medio={AC.azul} oscuro={AC.azulOscuro} nucleo="#25409A" pulso={luz * (0.7 + 0.3 * Math.sin(t * 3))} id={uid} />
    </g>
  );
};

/** Mancha de «pegamento»: óvalo gris crema con brillo, borde y un goteo (`gota` 0–1). `aparece` 0–1 escala desde cero. */
export const Pegote: React.FC<{ x: number; y: number; r?: number; aparece?: number; gota?: number; rot?: number }> = ({ x, y, r = 40, aparece = 1, gota = 0, rot = 0 }) => {
  const uid = useUid();
  const e = clamp(aparece);
  if (e <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${e})`}>
      <defs><radialGradient id={`${uid}pg`} cx="36%" cy="30%" r="85%"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.45" stopColor={AC.pega} /><stop offset="1" stopColor={AC.pegaOscuro} /></radialGradient></defs>
      <path d={`M ${-r} 0 C ${-r} ${-r * 0.8} ${-r * 0.3} ${-r} ${r * 0.2} ${-r * 0.9} C ${r * 0.9} ${-r * 0.8} ${r * 1.1} ${-r * 0.1} ${r * 0.8} ${r * 0.5} C ${r * 0.4} ${r * 0.95} ${-r * 0.7} ${r * 0.9} ${-r} 0 Z`} fill={`url(#${uid}pg)`} stroke="#fff" strokeOpacity={0.5} strokeWidth={1.6} />
      {gota > 0 && <path d={`M ${-r * 0.1} ${r * 0.6} C ${-r * 0.2} ${r * (0.9 + gota)} ${r * 0.25} ${r * (0.9 + gota)} ${r * 0.1} ${r * 0.6} Z`} fill={AC.pega} stroke={AC.pegaOscuro} strokeOpacity={0.4} />}
      <ellipse cx={-r * 0.35} cy={-r * 0.45} rx={r * 0.3} ry={r * 0.14} fill="#fff" opacity={0.6} transform={`rotate(-24 ${-r * 0.35} ${-r * 0.45})`} />
    </g>
  );
};

/**
 * Frasco de pegamento (vidrio, líquido crema, tapa roja y etiqueta de papel). `grieta` 0–1 dibuja las grietas; `rotura` 0–1 lo desvanece y lo abre.
 * Origen: centro de la base.
 */
export const Frasco: React.FC<{ x: number; y: number; s?: number; grieta?: number; rotura?: number; etiqueta?: string; sub?: string }> = ({ x, y, s = 1, grieta = 0, rotura = 0, etiqueta = "PEGAMENTO", sub = "GLÍA" }) => {
  const uid = useUid();
  const op = 1 - clamp(rotura);
  if (op <= 0.01) return null;
  const abre = clamp(rotura) * 26;
  const cuerpo = "M -130 -10 C -130 -220 -110 -260 -80 -300 L -80 -340 L 80 -340 L 80 -300 C 110 -260 130 -220 130 -10 C 130 14 112 20 100 20 L -100 20 C -112 20 -130 14 -130 -10 Z";
  const grietas = ["M 20 -330 L 6 -250 L 44 -200 L 18 -130 L 58 -70 L 40 14", "M 6 -250 L -40 -210 L -62 -140 L -118 -96", "M 44 -200 L 96 -176 L 110 -110"];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
      <defs>
        <linearGradient id={`${uid}vi`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#9CCBFF" stopOpacity="0.5" /><stop offset="0.25" stopColor="#E9F4FF" stopOpacity="0.22" /><stop offset="0.7" stopColor="#9CCBFF" stopOpacity="0.1" /><stop offset="1" stopColor="#CFE8FF" stopOpacity="0.45" /></linearGradient>
        <linearGradient id={`${uid}li`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F3EEDD" /><stop offset="1" stopColor="#CFC7B0" /></linearGradient>
        <clipPath id={`${uid}cl`}><path d={cuerpo} /></clipPath>
      </defs>
      <ellipse cx={0} cy={22} rx={150} ry={16} fill="#000" opacity={0.45} />
      <g transform={`translate(${-abre * 0.4} 0) rotate(${-clamp(rotura) * 6} 0 0)`}>
        <path d={cuerpo} fill="#0C1B2C" opacity={0.55} />
        <g clipPath={`url(#${uid}cl)`}>
          <rect x={-140} y={-250} width={280} height={290} fill={`url(#${uid}li)`} opacity={0.92} />
          <ellipse cx={0} cy={-250} rx={130} ry={14} fill="#FFFFFF" opacity={0.5} />
        </g>
        <path d={cuerpo} fill={`url(#${uid}vi)`} stroke="#E9F4FF" strokeOpacity={0.7} strokeWidth={3} />
        <rect x={-92} y={-396} width={184} height={64} rx={10} fill="#C8321E" />
        <rect x={-92} y={-396} width={184} height={16} rx={8} fill="#fff" opacity={0.25} />
        <rect x={-104} y={-216} width={208} height={142} rx={8} fill="#F6F1E3" stroke="#B9B09A" strokeWidth={2} />
        <text x={0} y={-168} textAnchor="middle" fontFamily="'JetBrains Mono', ui-monospace, Menlo, monospace" fontWeight={700} fontSize={22} fill="#6B6552" letterSpacing={3}>{sub}</text>
        <text x={0} y={-118} textAnchor="middle" fontFamily="Inter, 'Segoe UI', Arial, sans-serif" fontWeight={900} fontSize={29} fill="#142033" letterSpacing={1}>{etiqueta}</text>
        <rect x={-76} y={-98} width={152} height={7} rx={3} fill="#C8321E" opacity={0.85} />
        <path d="M -112 -240 C -116 -190 -112 -80 -104 -30" fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={9} strokeLinecap="round" />
        {grieta > 0 && (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {grietas.map((d, i) => <path key={`h${i}`} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(grieta * 1.3 - i * 0.18)} stroke="#fff" strokeOpacity={0.3} strokeWidth={11} />)}
            {grietas.map((d, i) => <path key={i} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp(grieta * 1.3 - i * 0.18)} stroke="#fff" strokeWidth={4} />)}
          </g>
        )}
      </g>
    </g>
  );
};
