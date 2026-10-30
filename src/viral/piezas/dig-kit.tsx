/**
 * Kit del video «El efecto del dígito izquierdo» (SINAPSIS · neuroeconomía): estética de cuaderno de laboratorio sobre el kit de «Anomalía»
 * (anom-ui.tsx: negro mate #0D0E12, papel #F4F1EA, bermellón #F04124, lima ácido #D4FF33, azul #2B38F0).
 * Añade lo «hecho a mano»: óvalos y subrayados temblorosos que se dibujan solos, marcas de conteo (tally), etiquetas de precio y rótulos mono.
 * Todo SVG/HTML determinista (sin filtros).
 */
import React from "react";
import { azar } from "../../lib/anim";
import { MONO, clamp, easeOut, spr, useReloj } from "../comun";
import { AN } from "./anom-ui";

export const DG = { ...AN, naranjaSuave: "#FF8A5C" } as const;

/** Óvalo dibujado a mano (se pasa un poco del cierre). */
export function ovaloMano(cx: number, cy: number, rx: number, ry: number, semilla = 1): string {
  const n = 30;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const ang = -2.2 + u * Math.PI * 2 * 1.07;
    const j = 1 + (azar(i * 3.1 + semilla * 7.3) - 0.5) * 0.08 + u * 0.05;
    d += `${i ? "L" : "M"} ${(cx + Math.cos(ang) * rx * j).toFixed(1)} ${(cy + Math.sin(ang) * ry * j).toFixed(1)} `;
  }
  return d;
}

/** Línea con temblor de pulso. */
export function lineaMano(x0: number, y0: number, x1: number, y1: number, semilla = 1): string {
  const n = 8;
  let d = `M ${x0} ${y0} `;
  const nx = -(y1 - y0), ny = x1 - x0;
  const L = Math.hypot(nx, ny) || 1;
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    const off = (azar(i * 5.7 + semilla * 3.3) - 0.5) * 5 * (i < n ? 1 : 0);
    d += `L ${(x0 + (x1 - x0) * u + (nx / L) * off).toFixed(1)} ${(y0 + (y1 - y0) * u + (ny / L) * off).toFixed(1)} `;
  }
  return d;
}

/** Trazo que se dibuja solo (k 0→1). */
export const Garabato: React.FC<{ d: string; k: number; color: string; grosor?: number; opacidad?: number }> = ({ d, k, color, grosor = 6, opacidad = 1 }) => {
  const kk = clamp(k);
  if (kk <= 0.001) return null;
  return <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${kk} 1.2`} opacity={opacidad} />;
};

/** Marcas de conteo a mano: grupos de 4 palitos y el quinto tachando. `n` palitos totales; `k` 0→1 = cuántos ya se dibujaron. */
export function tallyMano(x: number, y: number, n: number, alto = 54, sep = 17): string {
  let d = "";
  for (let i = 0; i < n; i++) {
    const g = Math.floor(i / 5), r = i % 5;
    const gx = x + g * (sep * 5.2);
    if (r < 4) {
      const px = gx + r * sep + (azar(i * 2.3) - 0.5) * 3;
      d += `M ${px.toFixed(1)} ${(y + (azar(i * 4.1) - 0.5) * 3).toFixed(1)} L ${(px + (azar(i * 6.3) - 0.5) * 4).toFixed(1)} ${(y + alto).toFixed(1)} `;
    } else {
      d += `M ${(gx - 8).toFixed(1)} ${(y + alto * 0.78).toFixed(1)} L ${(gx + sep * 3 + 8).toFixed(1)} ${(y + alto * 0.22).toFixed(1)} `;
    }
  }
  return d;
}

export const Tally: React.FC<{ x: number; y: number; n: number; k: number; color: string; alto?: number; grosor?: number }> = ({ x, y, n, k, color, alto = 54, grosor = 5 }) => {
  const kk = clamp(k);
  const visibles = Math.floor(kk * n + 0.0001);
  const parcial = kk * n - visibles;
  const palitos = Array.from({ length: n }, (_, i) => tallyMano(x, y, n, alto).split("M ").filter(Boolean)[i]);
  return (
    <g stroke={color} strokeWidth={grosor} strokeLinecap="round" fill="none">
      {palitos.map((seg, i) => (i < visibles || (i === visibles && parcial > 0.05)) && <path key={i} d={`M ${seg}`} pathLength={1} strokeDasharray={`${i < visibles ? 1 : parcial} 1.2`} />)}
    </g>
  );
};

/** Texto suelto (HTML) con entrada suave. `x` es el centro, el borde izquierdo o el borde derecho según `alinear`. Mide solo su texto (no una caja fija). */
export const Texto: React.FC<{ texto: string; x: number; y: number; px: number; color?: string; alinear?: "left" | "center" | "right"; delay?: number; peso?: number; mono?: boolean; id?: string; opacidad?: number; interletra?: number; rot?: number }> = ({ texto, x, y, px, color = AN.blanco, alinear = "center", delay = 0, peso = 700, mono = true, id = "dig-texto", opacidad = 1, interletra = 0.02, rot = 0 }) => {
  const { f, a } = useReloj();
  const s = spr(f, a(delay), { damping: 14, stiffness: 140, mass: 0.7 });
  const tx = alinear === "center" ? "translateX(-50%)" : alinear === "right" ? "translateX(-100%)" : "";
  return (
    <div data-texto={id} style={{ position: "absolute", left: x, top: y, width: "max-content", transform: `${tx} translateY(-50%) translateY(${(1 - s) * 16}px) rotate(${rot}deg)`, fontFamily: mono ? MONO : undefined, fontWeight: peso, fontSize: px, lineHeight: 1.15, letterSpacing: `${interletra}em`, color, opacity: clamp(s * 2) * opacidad, whiteSpace: "pre", textAlign: alinear }}>
      {texto}
    </div>
  );
};

/** Nota en píldora (como las etiquetas de un cuaderno). */
export const Nota: React.FC<{ texto: string; x: number; y: number; color?: string; fondo?: string; delay?: number; px?: number; id?: string; opacidad?: number }> = ({ texto, x, y, color = AN.lima, fondo = "rgba(13,14,18,0.72)", delay = 0, px = 24, id = "dig-nota", opacidad = 1 }) => {
  const { f, a } = useReloj();
  const s = spr(f, a(delay), { damping: 14, stiffness: 140, mass: 0.7 });
  return (
    <div data-texto={id} style={{ position: "absolute", left: x, top: y, width: "max-content", transform: `translate(-50%, -50%) translateY(${(1 - s) * 14}px)`, fontFamily: MONO, fontWeight: 700, fontSize: px, letterSpacing: "0.03em", color, opacity: clamp(s * 2) * opacidad, whiteSpace: "nowrap" }}>
      <span style={{ display: "inline-block", padding: "8px 22px", borderRadius: 999, border: `2px solid ${color}`, background: fondo }}>{texto}</span>
    </div>
  );
};

/** Fuente al pie (mono pequeño). */
export const Pie: React.FC<{ texto: string; y?: number; delay?: number; color?: string }> = ({ texto, y = 1490, delay = 1, color = AN.blanco }) => {
  const { t, a } = useReloj();
  return <div data-texto="pie-fuente" style={{ position: "absolute", left: 540, top: y, width: "max-content", transform: "translate(-50%, -50%)", fontFamily: MONO, fontSize: 22, lineHeight: 1.3, color, opacity: 0.6 * clamp((t - a(delay)) / 0.6), whiteSpace: "pre", textAlign: "center" }}>{texto}</div>;
};

/** Etiqueta de precio (cartulina con agujero y cuerda). Dibuja en un <svg>. */
export const TagPrecio: React.FC<{ x: number; y: number; w: number; h: number; texto: string; px: number; fondo?: string; tinta?: string; k?: number; rot?: number; borde?: string }> = ({ x, y, w, h, texto, px, fondo = AN.papel, tinta = AN.tinta, k = 1, rot = 0, borde }) => (
  <g opacity={clamp(k * 1.6)} transform={`translate(${x + w / 2} ${y + h / 2}) rotate(${rot}) scale(${0.9 + 0.1 * clamp(k)}) translate(${-(x + w / 2)} ${-(y + h / 2)})`}>
    <rect x={x + 8} y={y + 12} width={w} height={h} rx={18} fill="#000" opacity={0.35} />
    <rect x={x} y={y} width={w} height={h} rx={18} fill={fondo} stroke={borde ?? "none"} strokeWidth={borde ? 5 : 0} />
    <circle cx={x + 34} cy={y + 34} r={11} fill={AN.oscuro} opacity={0.85} />
    <path d={`M ${x + 34} ${y + 34} C ${x + 10} ${y - 30} ${x - 40} ${y - 46} ${x - 70} ${y - 30}`} fill="none" stroke={fondo} strokeWidth={4} opacity={0.75} />
    <text x={x + w / 2} y={y + h * 0.66} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={px} fill={tinta} letterSpacing="-0.02em">{texto}</text>
  </g>
);

export { easeOut };
