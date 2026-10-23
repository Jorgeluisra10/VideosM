/**
 * Shaders y texturas SVG del estudio: <StudioSvgDefs/> (halftone, máscaras, filtros), brillo especular, sombra de piso en puntos,
 * reflejo de suelo, estela de movimiento y fondo de estudio con bokeh.
 */
import React, { createContext, useContext } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { azar } from "../lib/anim";
import { coloresEstudio, type ColoresEstudio } from "../anim/estudio";
import { FPS, H, TINTA, W, arco, useUid } from "./util";

/* ───────────── colores de la paleta activa ───────────── */

export const EstudioCtx = createContext<ColoresEstudio>(coloresEstudio("imnoba"));
export const useEstudio = (): ColoresEstudio => useContext(EstudioCtx);

/* ───────────── textura de ruido ───────────── */

let teselaRuido: string | null = null;
/**
 * Tesela de ruido sutil (160×160 px en escala de grises con alfa), generada UNA vez con un generador determinista y repetida como <pattern>.
 * Es mucho más barata que un filtro feTurbulence a pantalla completa en cada fotograma (el render del estudio tardaba el doble).
 */
function teselaDeRuido(): string {
  if (teselaRuido !== null) return teselaRuido;
  teselaRuido = "";
  if (typeof document === "undefined") return teselaRuido;
  try {
    const N = 160;
    const c = document.createElement("canvas");
    c.width = c.height = N;
    const g = c.getContext("2d");
    if (!g) return teselaRuido;
    const img = g.createImageData(N, N);
    for (let i = 0; i < N * N; i++) {
      const v = Math.floor(azar(i * 0.37 + 11) * 255);
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    teselaRuido = c.toDataURL("image/png");
  } catch {
    teselaRuido = "";
  }
  return teselaRuido;
}

/* ───────────── definiciones globales ───────────── */

/**
 * Se inyecta en CADA lienzo SVG. Los ids son globales del documento, y como el contenido es idéntico en todas las copias, da igual cuál resuelva el navegador.
 *   #halftone-dots-s|m|l   retículas de puntos a 45° (pequeña, media y grande)
 *   #halftone-shadow       máscara: transparente arriba-izquierda → blanco abajo-derecha (zona de sombra)
 *   #halftone-shadow-strong igual, pero solo la esquina inferior derecha (puntos grandes)
 *   #halftone-belly        igual, pero vertical (panza de la cápsula)
 *   #floor-fade            máscara radial (sombra de piso: centro opaco → borde transparente)
 *   #studio-noise-tile     ruido sutil repetible (textura del fondo)
 */
export const StudioSvgDefs: React.FC = () => (
  <defs>
    <pattern id="studio-noise-tile" width="160" height="160" patternUnits="userSpaceOnUse">
      {teselaDeRuido() && <image href={teselaDeRuido()} width="160" height="160" />}
    </pattern>
    <pattern id="halftone-dots-s" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <circle cx="5.5" cy="5.5" r="1.9" fill={TINTA} fillOpacity="0.6" />
    </pattern>
    <pattern id="halftone-dots-m" width="15" height="15" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <circle cx="7.5" cy="7.5" r="3.3" fill={TINTA} fillOpacity="0.62" />
    </pattern>
    <pattern id="halftone-dots-l" width="21" height="21" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <circle cx="10.5" cy="10.5" r="5.8" fill={TINTA} fillOpacity="0.66" />
    </pattern>
    <linearGradient id="halftone-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0.12" stopColor="#000" />
      <stop offset="0.62" stopColor="#fff" />
    </linearGradient>
    <linearGradient id="halftone-grad-strong" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0.45" stopColor="#000" />
      <stop offset="0.95" stopColor="#fff" />
    </linearGradient>
    <mask id="halftone-shadow" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox" x="0" y="0" width="1" height="1">
      <rect x="0" y="0" width="1" height="1" fill="url(#halftone-grad)" />
    </mask>
    <mask id="halftone-shadow-strong" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox" x="0" y="0" width="1" height="1">
      <rect x="0" y="0" width="1" height="1" fill="url(#halftone-grad-strong)" />
    </mask>
    <linearGradient id="halftone-grad-belly" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0.42" stopColor="#000" />
      <stop offset="1" stopColor="#fff" />
    </linearGradient>
    <mask id="halftone-belly" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox" x="0" y="0" width="1" height="1">
      <rect x="0" y="0" width="1" height="1" fill="url(#halftone-grad-belly)" />
    </mask>
    <radialGradient id="floor-fade-grad" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#fff" />
      <stop offset="0.55" stopColor="#999" />
      <stop offset="1" stopColor="#000" />
    </radialGradient>
    <mask id="floor-fade" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox" x="0" y="0" width="1" height="1">
      <rect x="0" y="0" width="1" height="1" fill="url(#floor-fade-grad)" />
    </mask>
    <filter id="studio-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
  </defs>
);

/* ───────────── fondo de estudio con bokeh ───────────── */

const BOKEH = 12;

/** Fragmento SVG del fondo (degradado + 12 círculos de bokeh desenfocados que flotan con sin(frame/40) + ruido sutil). */
export const FondoEstudioSvg: React.FC<{ centro?: string; borde?: string; ruido?: boolean; bokeh?: boolean }> = ({ centro, borde, ruido = true, bokeh = true }) => {
  const f = useCurrentFrame();
  const C = useEstudio();
  const uid = useUid();
  const colores = [C.roles.accent, C.roles.secondary, "#FFFFFF", C.roles.primary];
  return (
    <>
      <radialGradient id={`${uid}bg`} cx="50%" cy="42%" r="78%">
        <stop offset="0" stopColor={centro ?? C.fondoCentro} />
        <stop offset="1" stopColor={borde ?? C.fondo} />
      </radialGradient>
      <rect width={W} height={H} fill={`url(#${uid}bg)`} />
      {bokeh && (
        <g>
          {Array.from({ length: BOKEH }, (_, i) => {
            const r = 38 + azar(i * 3.1 + 1) * 86;
            const x = azar(i * 5.7 + 2) * W + 34 * Math.sin(f / 40 + i);
            const y = azar(i * 7.3 + 3) * H + 26 * Math.sin(f / 40 * 0.8 + i * 1.7);
            // desenfoque de 18 px por círculo (región de filtro pequeña): igual de suave y mucho más barato que desenfocar todo el lienzo
            return <circle key={i} cx={x} cy={y} r={r} fill={colores[i % colores.length]} opacity={0.05 + azar(i * 2.3 + 4) * 0.07} style={{ filter: "blur(18px)" }} />;
          })}
        </g>
      )}
      {ruido && <rect width={W} height={H} fill="url(#studio-noise-tile)" opacity={0.06} style={{ mixBlendMode: "overlay" }} />}
    </>
  );
};

/** Fondo de estudio a pantalla completa (lienzo SVG propio con sus definiciones). */
export const StudioBackground: React.FC = () => (
  <AbsoluteFill>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <StudioSvgDefs />
      <FondoEstudioSvg />
    </svg>
  </AbsoluteFill>
);

/* ───────────── brillo especular ───────────── */

/**
 * Trazo blanco curvo en el borde superior izquierdo interior de una esfera, óvalo o cápsula (efecto de volumen brillante).
 * Dibuja el arco de `a0` a `a1` grados sobre la elipse (cx, cy, rx, ry); `extra` añade un tramo recto al final (cápsulas).
 */
export const SpecularHighlight: React.FC<{ cx: number; cy: number; rx: number; ry: number; a0?: number; a1?: number; extra?: number; opacidad?: number }> = ({ cx, cy, rx, ry, a0 = 198, a1 = 252, extra = 0, opacidad = 1 }) => {
  const d = arco(cx, cy, rx, ry, a0, a1) + (extra ? ` l ${extra} 0` : "");
  const a2 = a1 + (a1 - a0) * 0.32;
  const dp = arco(cx, cy, rx, ry, a2 + 4, a2 + 9);
  return (
    <g opacity={opacidad} fill="none" stroke="#FFFFFF" strokeLinecap="round">
      <path d={d} strokeWidth={6} opacity={0.85} />
      <path d={dp} strokeWidth={6} opacity={0.5} />
    </g>
  );
};

/* ───────────── sombra de piso en puntos ───────────── */

/** Elipse horizontal bajo la figura con puntos de semitono que se desvanecen hacia afuera. `elevacion` (px) la encoge y aclara cuando la figura flota. */
export const HalftoneFloorShadow: React.FC<{ ancho: number; elevacion?: number; opacidad?: number }> = ({ ancho, elevacion = 0, opacidad = 1 }) => {
  const k = Math.max(0.55, 1 - elevacion / 260);
  const rx = ancho * 0.58 * k, ry = Math.max(12, ancho * 0.085 * k);
  return (
    <g opacity={opacidad * (0.6 + 0.4 * k)}>
      <ellipse cx={0} cy={ry * 0.35} rx={rx} ry={ry} fill={TINTA} fillOpacity={0.35} mask="url(#floor-fade)" />
      <ellipse cx={0} cy={ry * 0.35} rx={rx} ry={ry} fill="url(#halftone-dots-m)" mask="url(#floor-fade)" />
    </g>
  );
};

/* ───────────── reflejo de suelo ───────────── */

/** Copia invertida verticalmente (espejo en y = 0) del objeto, opacity 0.18, desenfoque de 2 px y máscara de desvanecimiento hacia abajo. */
export const FloorReflection: React.FC<{ ancho: number; alto: number; children: React.ReactNode; opacidad?: number }> = ({ ancho, alto, children, opacidad = 0.18 }) => {
  const uid = useUid();
  const largo = Math.min(alto * 0.8, 320);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}rg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`${uid}rm`} maskUnits="userSpaceOnUse" x={-ancho} y={0} width={ancho * 2} height={largo}>
          <rect x={-ancho} y={0} width={ancho * 2} height={largo} fill={`url(#${uid}rg)`} />
        </mask>
      </defs>
      <g transform="scale(1,-1)" opacity={opacidad} mask={`url(#${uid}rm)`} style={{ filter: "blur(2px)" }}>
        {children}
      </g>
    </g>
  );
};

/* ───────────── estela de movimiento ───────────── */

const OPACIDADES_ESTELA = [0.35, 0.25, 0.15, 0.08, 0.03];

/**
 * Si `activa`: 5 clones de la figura desplazados hacia atrás (izquierda) con opacidad decreciente (0.35, 0.25, 0.15, 0.08, 0.03)
 * y un anillo de puntos blancos semitransparentes alrededor que gira para simular alta velocidad. `separacion` crece con la velocidad.
 */
export const MotionTrail: React.FC<{ activa: boolean; separacion: number; ancho: number; alto: number; children: React.ReactNode }> = ({ activa, separacion, ancho, alto, children }) => {
  const f = useCurrentFrame();
  if (!activa) return null;
  const N = 26;
  const rx = ancho / 2 + 34, ry = alto / 2 + 34;
  return (
    <g>
      {OPACIDADES_ESTELA.map((op, i) => (
        <g key={i} opacity={op} transform={`translate(${-separacion * (i + 1)} 0) scale(${1 - 0.025 * (i + 1)} 1)`}>{children}</g>
      ))}
      <g opacity={0.38}>
        {Array.from({ length: N }, (_, i) => {
          const a = (i / N) * Math.PI * 2 + f / FPS * 1.4;
          return <circle key={i} cx={rx * Math.cos(a)} cy={-alto / 2 + ry * Math.sin(a)} r={i % 3 === 0 ? 4.5 : 2.6} fill="#FFFFFF" opacity={0.45 + 0.4 * Math.sin(a * 3 + f / 9)} />;
        })}
      </g>
    </g>
  );
};
