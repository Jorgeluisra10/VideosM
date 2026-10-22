import { getLength, getPointAtLength } from "@remotion/paths";

type Punto = { x: number; y: number };
type Tabla = { largo: number; pts: Punto[] };

const cache = new Map<string, Tabla>();

function tabla(d: string): Tabla {
  let t = cache.get(d);
  if (!t) {
    const largo = getLength(d);
    const n = Math.max(24, Math.min(400, Math.ceil(largo / 5)));
    const pts: Punto[] = [];
    for (let i = 0; i <= n; i++) {
      const p = getPointAtLength(d, (largo * i) / n);
      pts.push({ x: p?.x ?? 0, y: p?.y ?? 0 });
    }
    t = { largo, pts };
    cache.set(d, t);
  }
  return t;
}

/** Posición (x, y) y ángulo en grados sobre un path SVG, con u ∈ [0,1]. Determinista y barato. */
export function enRuta(d: string, u: number): Punto & { ang: number } {
  const { pts } = tabla(d);
  const uu = Math.min(1, Math.max(0, u));
  const f = uu * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(f));
  const k = f - i;
  const a = pts[i];
  const b = pts[i + 1];
  return {
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
    ang: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
  };
}

export const largoRuta = (d: string): number => tabla(d).largo;
