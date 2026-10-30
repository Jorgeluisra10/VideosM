/**
 * Kit del video «Puentes colgantes» (SINAPSIS · física estructural): cuaderno de laboratorio sobre el kit de «Anomalía» (anom-ui) y los trazos de dig-kit.
 * Cable en halftone (tubo de puntos cuya luz rota), flechas de fuerza, cajas alámbricas isométricas (Rayos X), redes hexagonales.
 * Código de color físico: rojo bermellón = TRACCIÓN, azul eléctrico = COMPRESIÓN, lima = instrumentos y medidas, papel = peso/estructura.
 */
import React from "react";
import { clamp } from "../comun";
import { AN } from "./anom-ui";

export const PT = {
  traccion: AN.rojo,
  traccionSuave: "#FF8A5C",
  compresion: AN.azul,
  /** azul más claro para textos sobre fondo oscuro (el #2B38F0 puro cansa la vista en letra pequeña) */
  compresionTexto: "#7D88FF",
  medida: AN.lima,
  papel: AN.papel,
  oscuro: AN.oscuro,
} as const;

/** y de una parábola entre dos torres a la misma altura: `yTop` en las torres y `sag` de flecha en el centro. */
export const yParabola = (x: number, xa: number, xb: number, yTop: number, sag: number): number => {
  const u = (x - (xa + xb) / 2) / ((xb - xa) / 2);
  return yTop + sag * (1 - u * u);
};

export const puntosParabola = (xa: number, xb: number, yTop: number, sag: number, n = 60): { x: number; y: number }[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const x = xa + ((xb - xa) * i) / n;
    return { x, y: yParabola(x, xa, xb, yTop, sag) };
  });

/**
 * Tubo de puntos (halftone) a lo largo de una curva: cada muestra pone varios puntos a lo ancho; el radio sigue la luz, que se desplaza con `luz` (rad) para que el brillo rote.
 * `radio` = semiancho del tubo (px).
 */
export const TuboHalftone: React.FC<{ pts: { x: number; y: number }[]; radio: number; luz: number; opacidad?: number; paso?: number; avance?: number }> = ({ pts, radio, luz, opacidad = 1, paso = 8, avance = 1 }) => {
  const out: React.ReactNode[] = [];
  const m = 3;
  const n = Math.max(2, Math.floor(pts.length * clamp(avance)));
  for (let i = 1; i < n; i++) {
    if (i % Math.max(1, Math.round(paso / 8)) !== 0) continue;
    const a = pts[i - 1], b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b.x - a.x, ty = b.y - a.y;
    const L = Math.hypot(tx, ty) || 1;
    const nx = -ty / L, ny = tx / L;
    for (let j = -m; j <= m; j++) {
      const off = (j / m) * radio;
      const q = j / m;
      const brillo = Math.max(0, 1 - Math.pow(Math.abs(q - Math.sin(luz + i * 0.05) * 0.55), 1.4));
      const r = 1.4 + (radio / m) * 0.62 * brillo;
      out.push(<circle key={`${i}:${j}`} cx={pts[i].x + nx * off} cy={pts[i].y + ny * off} r={r} fill={(i + j) % 2 === 0 ? PT.traccion : PT.traccionSuave} opacity={opacidad} />);
    }
  }
  return <g>{out}</g>;
};

/** Flecha de fuerza con estela de brillo. `k` 0→1 = cuánto se ha dibujado. */
export const Flecha: React.FC<{ x0: number; y0: number; x1: number; y1: number; color: string; k?: number; grosor?: number; cabeza?: number; discontinua?: boolean; brillo?: boolean }> = ({ x0, y0, x1, y1, color, k = 1, grosor = 8, cabeza = 26, discontinua = false, brillo = true }) => {
  const kk = clamp(k);
  if (kk <= 0.005) return null;
  const ex = x0 + (x1 - x0) * kk, ey = y0 + (y1 - y0) * kk;
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const hx = (g: number): [number, number] => [ex - Math.cos(ang + g) * cabeza, ey - Math.sin(ang + g) * cabeza];
  const [ax, ay] = hx(0.45), [bx, by] = hx(-0.45);
  return (
    <g opacity={clamp(kk * 3)} strokeLinecap="round" strokeLinejoin="round">
      {brillo && <line x1={x0} y1={y0} x2={ex} y2={ey} stroke={color} strokeWidth={grosor * 2.6} opacity={0.18} />}
      <line x1={x0} y1={y0} x2={ex - Math.cos(ang) * cabeza * 0.4} y2={ey - Math.sin(ang) * cabeza * 0.4} stroke={color} strokeWidth={grosor} strokeDasharray={discontinua ? "10 10" : undefined} />
      {kk > 0.12 && <polygon points={`${ex},${ey} ${ax},${ay} ${bx},${by}`} fill={color} />}
    </g>
  );
};

/**
 * Caja isométrica alámbrica (Rayos X): rectángulo frontal + profundidad `d` hacia arriba a la derecha. `relleno` 0→1 = opacidad del sólido (1 = cuerpo macizo, 0 = solo el alambre).
 */
export const CajaAlambre: React.FC<{ x: number; y: number; w: number; h: number; d?: number; color: string; relleno?: number; grosor?: number; cruz?: boolean }> = ({ x, y, w, h, d = 46, color, relleno = 0, grosor = 4, cruz = false }) => {
  const f = 0.6;
  const top = `${x},${y} ${x + d},${y - d * f} ${x + w + d},${y - d * f} ${x + w},${y}`;
  const lado = `${x + w},${y} ${x + w + d},${y - d * f} ${x + w + d},${y + h - d * f} ${x + w},${y + h}`;
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {relleno > 0.01 && (
        <>
          <polygon points={top} fill={color} opacity={0.5 * relleno} />
          <polygon points={lado} fill={color} opacity={0.3 * relleno} />
          <rect x={x} y={y} width={w} height={h} fill={color} opacity={0.42 * relleno} />
        </>
      )}
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={color} strokeWidth={grosor} />
      <polyline points={`${x},${y} ${x + d},${y - d * f} ${x + w + d},${y - d * f} ${x + w + d},${y + h - d * f} ${x + w},${y + h}`} fill="none" stroke={color} strokeWidth={grosor * 0.7} opacity={0.85} />
      <line x1={x + w} y1={y} x2={x + w + d} y2={y - d * f} stroke={color} strokeWidth={grosor * 0.7} opacity={0.85} />
      <line x1={x + w} y1={y} x2={x + w} y2={y + h} stroke={color} strokeWidth={grosor * 0.7} />
      {cruz && (
        <g stroke={color} strokeWidth={grosor * 0.5} opacity={0.6}>
          {Array.from({ length: Math.floor(h / (w * 1.4)) }, (_, i) => {
            const y0 = y + i * w * 1.4, y1 = y + (i + 1) * w * 1.4;
            return <g key={i}><line x1={x} y1={y0} x2={x + w} y2={y1} /><line x1={x + w} y1={y0} x2={x} y2={y1} /></g>;
          })}
        </g>
      )}
    </g>
  );
};

/** Centros de una red hexagonal compacta (1, 6, 12, 18… por anillo) alrededor de (0,0), con `paso` entre vecinos. */
export function redHexagonal(anillos: number, paso: number): { x: number; y: number; anillo: number }[] {
  const pts: { x: number; y: number; anillo: number }[] = [{ x: 0, y: 0, anillo: 0 }];
  for (let r = 1; r <= anillos; r++) {
    for (let lado = 0; lado < 6; lado++) {
      for (let k = 0; k < r; k++) {
        const a0 = (Math.PI / 3) * lado, a1 = (Math.PI / 3) * (lado + 1);
        const vx0 = Math.cos(a0) * r * paso, vy0 = Math.sin(a0) * r * paso;
        const vx1 = Math.cos(a1) * r * paso, vy1 = Math.sin(a1) * r * paso;
        pts.push({ x: vx0 + ((vx1 - vx0) * k) / r, y: vy0 + ((vy1 - vy0) * k) / r, anillo: r });
      }
    }
  }
  return pts;
}

/** suavizado cúbico 0→1 entre `a` y `b`. */
export const suave = (v: number, a: number, b: number): number => {
  const x = clamp((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};
