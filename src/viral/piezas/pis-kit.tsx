/**
 * Kit del video «La piscina que cuelga entre dos edificios» (SINAPSIS · ingeniería extrema): isometría con sombreado de puntos (halftone), modo Rayos X alámbrico y anotaciones a mano.
 * Sobre el kit de «Anomalía» (anom-ui) y los trazos de dig-kit / pte-kit. Todo SVG determinista (sin filtros).
 * Color: bermellón = acrílico (la pieza correcta) · azul eléctrico = el modelo que FALLA · lima = instrumentos y acero · cian = agua · papel = hormigón y estructura.
 */
import React from "react";
import { clamp } from "../comun";
import { AN, PuntosSemitono } from "./anom-ui";

export const PS = {
  acrilico: AN.rojo,
  fallo: AN.azul,
  falloTexto: "#7D88FF",
  agua: "#3FC8FF",
  acero: AN.lima,
  hormigon: AN.papel,
  oscuro: AN.oscuro,
} as const;

export type Pt = [number, number];
export type Iso = (x: number, y: number, z: number) => Pt;
/** proyección isométrica: x crece hacia la derecha-abajo, y hacia la izquierda-abajo, z hacia arriba (`s` px por unidad) */
export const mkIso = (cx: number, cy: number, s: number): Iso => (x, y, z) => [cx + (x - y) * 0.866 * s, cy + (x + y) * 0.5 * s - z * s];

export function dentro(x: number, y: number, poli: Pt[]): boolean {
  let c = false;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const [xi, yi] = poli[i], [xj, yj] = poli[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const pts = (p: Pt[]): string => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/** Cara de un sólido: relleno plano translúcido + sombreado de puntos recortado al polígono. `k` 0–1 = intensidad del semitono (0 = sin puntos). */
export const CaraHT: React.FC<{ p: Pt[]; color: string; k?: number; fill?: number; paso?: number; rMax?: number; borde?: string; grosor?: number; opacidad?: number }> = ({ p, color, k = 0, fill = 0.1, paso = 15, rMax, borde, grosor = 3, opacidad = 1 }) => {
  const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  const w = Math.max(...xs) - x0, h = Math.max(...ys) - y0;
  return (
    <g opacity={opacidad}>
      {fill > 0 && <polygon points={pts(p)} fill={color} fillOpacity={fill} />}
      {k > 0.03 && w > 6 && h > 6 && <PuntosSemitono x0={x0} y0={y0} w={w} h={h} paso={paso} rMax={rMax ?? paso * 0.5} color={color} campo={() => k} recorte={(x, y) => dentro(x, y, p)} />}
      <polygon points={pts(p)} fill="none" stroke={borde ?? color} strokeWidth={grosor} strokeLinejoin="round" />
    </g>
  );
};

/** Sólido isométrico (caja) con tres caras visibles (arriba, +x y +y). `ht` = semitono por cara; `alambre` = solo aristas (Rayos X) con las ocultas a trazos. */
export const CajaIso: React.FC<{ iso: Iso; x0: number; y0: number; z0: number; dx: number; dy: number; dz: number; color: string; ht?: { top?: number; x?: number; y?: number }; fill?: number; alambre?: boolean; grosor?: number; paso?: number; opacidad?: number }> = ({ iso, x0, y0, z0, dx, dy, dz, color, ht = {}, fill = 0.1, alambre = false, grosor = 3, paso = 15, opacidad = 1 }) => {
  const x1 = x0 + dx, y1 = y0 + dy, z1 = z0 + dz;
  const top: Pt[] = [iso(x0, y0, z1), iso(x1, y0, z1), iso(x1, y1, z1), iso(x0, y1, z1)];
  const cx: Pt[] = [iso(x1, y0, z0), iso(x1, y1, z0), iso(x1, y1, z1), iso(x1, y0, z1)];
  const cy: Pt[] = [iso(x0, y1, z0), iso(x1, y1, z0), iso(x1, y1, z1), iso(x0, y1, z1)];
  if (alambre) {
    const ocultas: [Pt, Pt][] = [[iso(x0, y0, z0), iso(x1, y0, z0)], [iso(x0, y0, z0), iso(x0, y1, z0)], [iso(x0, y0, z0), iso(x0, y0, z1)]];
    return (
      <g opacity={opacidad} fill="none" stroke={color} strokeWidth={grosor} strokeLinejoin="round" strokeLinecap="round">
        {ocultas.map(([a, b], i) => <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeDasharray="6 8" opacity={0.5} />)}
        <polygon points={pts(top)} /><polygon points={pts(cx)} /><polygon points={pts(cy)} />
      </g>
    );
  }
  return (
    <g opacity={opacidad}>
      <CaraHT p={cx} color={color} k={ht.x ?? 0.25} fill={fill * 1.3} paso={paso} grosor={grosor} />
      <CaraHT p={cy} color={color} k={ht.y ?? 0.45} fill={fill * 1.6} paso={paso} grosor={grosor} />
      <CaraHT p={top} color={color} k={ht.top ?? 0.08} fill={fill} paso={paso} grosor={grosor} />
    </g>
  );
};

/** Línea de cota con extremos y texto a lo largo (se dibuja con `k` 0→1). */
export const Cota: React.FC<{ a: Pt; b: Pt; color?: string; k?: number; grosor?: number }> = ({ a, b, color = AN.lima, k = 1, grosor = 4 }) => {
  const kk = clamp(k);
  if (kk <= 0.01) return null;
  const ex = a[0] + (b[0] - a[0]) * kk, ey = a[1] + (b[1] - a[1]) * kk;
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), nx = -Math.sin(ang) * 12, ny = Math.cos(ang) * 12;
  return (
    <g stroke={color} strokeWidth={grosor} strokeLinecap="round" fill="none">
      <line x1={a[0]} y1={a[1]} x2={ex} y2={ey} />
      <line x1={a[0] - nx} y1={a[1] - ny} x2={a[0] + nx} y2={a[1] + ny} />
      {kk > 0.98 && <line x1={b[0] - nx} y1={b[1] - ny} x2={b[0] + nx} y2={b[1] + ny} />}
    </g>
  );
};

/** Grietas (fractura): líneas quebradas que se abren desde un punto; `k` 0→1 = cuánto se han propagado. */
export const Grietas: React.FC<{ x: number; y: number; k: number; color: string; n?: number; largo?: number; grosor?: number; semilla?: number }> = ({ x, y, k, color, n = 7, largo = 140, grosor = 4, semilla = 1 }) => {
  const kk = clamp(k);
  if (kk <= 0.01) return null;
  return (
    <g stroke={color} strokeWidth={grosor} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {Array.from({ length: n }, (_, i) => {
        const a0 = (i / n) * Math.PI * 2 + Math.sin(semilla * 7 + i * 3.1) * 0.35;
        let px = x, py = y, d = `M ${x} ${y}`;
        const L = largo * (0.55 + 0.45 * Math.abs(Math.sin(semilla + i * 1.7)));
        const pasos = 4;
        for (let s = 1; s <= pasos; s++) {
          const u = (s / pasos) * kk;
          const ang = a0 + Math.sin(i * 2.3 + s * 1.9 + semilla) * 0.5;
          px = x + Math.cos(ang) * L * u; py = y + Math.sin(ang) * L * u;
          d += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
        }
        return <path key={i} d={d} />;
      })}
    </g>
  );
};

export { clamp };
