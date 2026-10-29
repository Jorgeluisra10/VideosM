/**
 * Kit del video «Los dueños del cerebro» (SINAPSIS · astrocitos, barrera hematoencefálica, sinapsis tripartita y el estudio de Einstein).
 * Figuras con aire de histología: campo de microscopio redondo (corte H&E o fluorescencia GFAP), toxinas, nutrientes y estrellas gliales.
 * Todo SVG determinista (sin filtros: el brillo se hace con trazos superpuestos), sobre el estudio de real-kit.tsx.
 */
import React from "react";
import { mulberry32 } from "../../anim/piezas";
import { useUid } from "../../estudio/util";
import { clamp } from "../comun";
import { FONT, MONOF } from "./real-kit";
import { AC } from "./astro-kit";

export const HE = {
  /** campo de un corte teñido con hematoxilina-eosina (esquema) */
  fondo: "#D8A3C0",
  fondoClaro: "#EBC7DA",
  nucleo: "#5A3D8F",
  nucleoOsc: "#3B2765",
  eosina: "#F2B8CF",
  /** tinta oscura para texto sobre el corte */
  tinta: "#2A1B45",
  /** fluorescencia (fondo negro azulado) */
  noche: "#050B1A",
  dapi: "#3F6BFF",
} as const;

/** Campo de microscopio circular: lo que se ve por el ocular. `children` se recorta al círculo; encima van la viñeta, el aro y los rótulos. */
export const CampoMicroscopio: React.FC<{
  cx: number; cy: number; r: number; fondo?: string; children?: React.ReactNode; etiqueta?: string; escala?: string; cruz?: boolean; colorTexto?: string; aro?: number;
}> = ({ cx, cy, r, fondo = HE.fondo, children, etiqueta, escala, cruz = false, colorTexto = "#fff", aro = 1 }) => {
  const uid = useUid();
  return (
    <g opacity={aro}>
      <defs>
        <clipPath id={`${uid}cm`}><circle cx={cx} cy={cy} r={r} /></clipPath>
        <radialGradient id={`${uid}vg`} cx="50%" cy="50%" r="50%"><stop offset="0.62" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.55" /></radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r + 18} fill="#0A1626" stroke="#3E546E" strokeWidth={3} />
      <circle cx={cx} cy={cy} r={r} fill={fondo} />
      <g clipPath={`url(#${uid}cm)`}>{children}</g>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}vg)`} />
      <circle cx={cx} cy={cy} r={r + 9} fill="none" stroke="#9FB6CC" strokeOpacity={0.55} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={r + 22} fill="none" stroke="#fff" strokeOpacity={0.12} strokeWidth={2} />
      {cruz && (
        <g stroke="#fff" strokeOpacity={0.35} strokeWidth={1.6}>
          <line x1={cx - r * 0.9} y1={cy} x2={cx + r * 0.9} y2={cy} strokeDasharray="4 10" />
          <line x1={cx} y1={cy - r * 0.9} x2={cx} y2={cy + r * 0.9} strokeDasharray="4 10" />
        </g>
      )}
      {etiqueta && <text x={cx - r * 0.62} y={cy - r * 0.7} fontFamily={MONOF} fontWeight={700} fontSize={24} fill={colorTexto} opacity={0.92} letterSpacing="0.05em">{etiqueta}</text>}
      {escala && (
        <g>
          <line x1={cx + r * 0.18} y1={cy + r * 0.82} x2={cx + r * 0.18 + 84} y2={cy + r * 0.82} stroke={colorTexto} strokeWidth={5} strokeLinecap="round" />
          <text x={cx + r * 0.18 + 42} y={cy + r * 0.82 - 12} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={20} fill={colorTexto}>{escala}</text>
        </g>
      )}
    </g>
  );
};

/** Textura de un corte H&E: puntos de núcleos y fibrillas rosas, deterministas (semilla). Cubre ≈ `ancho` × `alto` alrededor de (0,0). */
export const TejidoHE: React.FC<{ ancho: number; alto: number; semilla?: number; n?: number; deriva?: number }> = ({ ancho, alto, semilla = 3, n = 70, deriva = 0 }) => {
  const r = mulberry32(semilla);
  const puntos = Array.from({ length: n }, () => ({ x: (r() - 0.5) * ancho, y: (r() - 0.5) * alto, rad: 3 + r() * 6, a: 0.25 + r() * 0.4 }));
  const fibras = Array.from({ length: 26 }, () => ({ x: (r() - 0.5) * ancho, y: (r() - 0.5) * alto, l: 40 + r() * 110, g: r() * Math.PI }));
  return (
    <g transform={`translate(${deriva} 0)`}>
      {fibras.map((f, i) => <line key={`f${i}`} x1={f.x} y1={f.y} x2={f.x + Math.cos(f.g) * f.l} y2={f.y + Math.sin(f.g) * f.l} stroke={HE.eosina} strokeOpacity={0.55} strokeWidth={2 + (i % 3)} strokeLinecap="round" />)}
      {puntos.map((p, i) => <ellipse key={i} cx={p.x} cy={p.y} rx={p.rad} ry={p.rad * 0.8} fill={HE.nucleo} opacity={p.a} />)}
    </g>
  );
};

/** Toxina: bola con púas (violeta). Origen = centro. */
export const Toxina: React.FC<{ x: number; y: number; s?: number; rot?: number; op?: number }> = ({ x, y, s = 1, rot = 0, op = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={op}>
    <circle r={30} fill="#C04BFF" opacity={0.18} />
    {Array.from({ length: 10 }, (_, k) => {
      const a = (k / 10) * Math.PI * 2;
      return <line key={k} x1={Math.cos(a) * 14} y1={Math.sin(a) * 14} x2={Math.cos(a) * 26} y2={Math.sin(a) * 26} stroke="#E08BFF" strokeWidth={4.5} strokeLinecap="round" />;
    })}
    <circle r={15} fill="#8E2BD6" stroke="#E7B0FF" strokeWidth={2.5} />
    <circle cx={-5} cy={-5} r={4.5} fill="#fff" opacity={0.55} />
  </g>
);

/** Nutriente (glucosa): hexágono verde menta con brillo. */
export const Nutriente: React.FC<{ x: number; y: number; s?: number; op?: number }> = ({ x, y, s = 1, op = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
    <circle r={24} fill="#4DFFB4" opacity={0.16} />
    <polygon points="0,-15 13,-7.5 13,7.5 0,15 -13,7.5 -13,-7.5" fill="#34D399" stroke="#B9FFE2" strokeWidth={2.5} strokeLinejoin="round" />
    <circle cx={-3} cy={-5} r={3.5} fill="#fff" opacity={0.6} />
  </g>
);

/** Glóbulo rojo visto de lado. */
export const Globulo: React.FC<{ x: number; y: number; rot?: number; s?: number }> = ({ x, y, rot = 0, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <ellipse rx={26} ry={17} fill="#E5392B" stroke="#FF9A8E" strokeWidth={1.6} />
    <ellipse rx={11} ry={6.5} fill="#8E1B12" opacity={0.6} />
  </g>
);

/** Rayos de una estrella glial teñida con GFAP como UN solo trazado (barato de dibujar muchas veces). Devuelve el atributo `d` en coordenadas locales. */
export function rayosGFAP(semilla: number, rayos: number, largo: number): string {
  const r = mulberry32(semilla);
  let d = "";
  for (let k = 0; k < rayos; k++) {
    const a = (k / rayos) * Math.PI * 2 + (r() - 0.5) * 0.5;
    const l = largo * (0.6 + r() * 0.55);
    const curv = (r() - 0.5) * 0.7;
    const mx = Math.cos(a + curv) * l * 0.55, my = Math.sin(a + curv) * l * 0.55;
    const ex = Math.cos(a + curv * 0.6) * l, ey = Math.sin(a + curv * 0.6) * l;
    d += `M 0 0 Q ${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)} `;
    // ramita
    const b = a + curv * 0.6 + (r() < 0.5 ? 0.7 : -0.7);
    d += `M ${(mx * 0.95).toFixed(1)} ${(my * 0.95).toFixed(1)} L ${(mx + Math.cos(b) * l * 0.32).toFixed(1)} ${(my + Math.sin(b) * l * 0.32).toFixed(1)} `;
  }
  return d;
}

/** Estrella glial fluorescente (GFAP). `luz` 0–1 = brillo; origen = centro del soma. */
export const EstrellaGFAP: React.FC<{ x: number; y: number; d: string; s?: number; luz?: number; soma?: number; color?: string }> = ({ x, y, d, s = 1, luz = 1, soma = 6, color = AC.oro }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={clamp(luz)}>
    <path d={d} fill="none" stroke={color} strokeOpacity={0.22} strokeWidth={7} strokeLinecap="round" />
    <path d={d} fill="none" stroke={AC.oroClaro} strokeWidth={2.4} strokeLinecap="round" />
    <circle r={soma * 1.9} fill={color} opacity={0.3} />
    <circle r={soma} fill="#FFF6CC" stroke={color} strokeWidth={2} />
  </g>
);

/** Texto de rótulo de campo (esquema) sobre un fondo claro. */
export const RotuloCampo: React.FC<{ x: number; y: number; texto: string; color?: string; px?: number; ancla?: "start" | "middle" | "end" }> = ({ x, y, texto, color = HE.tinta, px = 24, ancla = "middle" }) => (
  <text x={x} y={y} textAnchor={ancla} fontFamily={FONT} fontWeight={800} fontSize={px} fill={color}>{texto}</text>
);
