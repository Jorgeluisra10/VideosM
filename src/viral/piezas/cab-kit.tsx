/**
 * Kit del video «Tus cables se enredan solos» (SINAPSIS · física cotidiana): cuaderno de laboratorio sobre anom-ui y dig-kit.
 * Cuerda con borde y puntos de semitono, cruces con ARRIBA y ABAJO (un halo del color del fondo corta la hebra de abajo), caja que gira,
 * curvas de nudos toroidales (trébol y cinquefoil) y utilidades de remuestreo. Código de color: bermellón = la cuerda, azul claro = la rígida, lima = medidas, papel = esquema.
 */
import React from "react";
import { clamp } from "../comun";
import { AN } from "./anom-ui";

export const CB = {
  cuerda: AN.rojo,
  rigida: "#7D88FF",
  medida: AN.lima,
  papel: AN.papel,
  tinta: AN.tinta,
  oscuro: AN.oscuro,
} as const;

export type P2 = { x: number; y: number };
export type P3 = { x: number; y: number; z: number };

/** Remuestrea una polilínea (x0,y0,x1,y1,…) a `m` puntos equiespaciados en longitud de arco. */
export function remuestrear(p: ArrayLike<number>, m: number): P2[] {
  const n = p.length / 2;
  const acc = [0];
  for (let i = 1; i < n; i++) acc.push(acc[i - 1] + Math.hypot(p[i * 2] - p[i * 2 - 2], p[i * 2 + 1] - p[i * 2 - 1]));
  const L = acc[n - 1] || 1;
  const out: P2[] = [];
  let j = 1;
  for (let k = 0; k < m; k++) {
    const s = (L * k) / (m - 1);
    while (j < n - 1 && acc[j] < s) j++;
    const d = acc[j] - acc[j - 1] || 1;
    const u = clamp((s - acc[j - 1]) / d);
    out.push({ x: p[(j - 1) * 2] + (p[j * 2] - p[(j - 1) * 2]) * u, y: p[(j - 1) * 2 + 1] + (p[j * 2 + 1] - p[(j - 1) * 2 + 1]) * u });
  }
  return out;
}

/** Suaviza una polilínea con el corte de esquinas de Chaikin (conserva los extremos). */
export function chaikin(pts: P2[], it = 2): P2[] {
  let q = pts;
  for (let r = 0; r < it; r++) {
    const o: P2[] = [q[0]];
    for (let i = 0; i < q.length - 1; i++) {
      const a = q[i], b = q[i + 1];
      o.push({ x: 0.75 * a.x + 0.25 * b.x, y: 0.75 * a.y + 0.25 * b.y }, { x: 0.25 * a.x + 0.75 * b.x, y: 0.25 * a.y + 0.75 * b.y });
    }
    o.push(q[q.length - 1]);
    q = o;
  }
  return q;
}

/** Nudo toroidal T(p,q) en proyección (x,y en ≈ [−1,1]) con altura z: p = 2, q = 3 es el trébol (3 cruces) y q = 5 el cinquefoil (5 cruces). `abierta` deja un hueco para que parezca una cuerda con dos extremos. */
export function curvaToro(p: number, q: number, m: number, abierta = false): P3[] {
  const ini = abierta ? 0.16 : 0, fin = abierta ? Math.PI * 2 - 0.16 : Math.PI * 2;
  return Array.from({ length: m }, (_, i) => {
    const t = ini + ((fin - ini) * i) / (m - 1);
    const r = Math.cos(q * t) + 2;
    return { x: (r * Math.cos(p * t)) / 3, y: (r * Math.sin(p * t)) / 3, z: -Math.sin(q * t) };
  });
}

/** Cruces visibles (en 2D) de una polilínea con la altura de cada hebra en el cruce: sirve para dibujar arriba/abajo y para comprobar el número de cruces de un nudo. */
export function crucesZ(pts: P3[], cerrada = false): { i: number; j: number; u: number; v: number; arriba: "i" | "j" }[] {
  const out: { i: number; j: number; u: number; v: number; arriba: "i" | "j" }[] = [];
  const n = pts.length;
  for (let i = 0; i < n - 1; i++)
    for (let j = i + 2; j < n - 1; j++) {
      if (cerrada && i === 0 && j === n - 2) continue;
      const a = pts[i], b = pts[i + 1], c = pts[j], d = pts[j + 1];
      const r = { x: b.x - a.x, y: b.y - a.y }, s = { x: d.x - c.x, y: d.y - c.y };
      const den = r.x * s.y - r.y * s.x;
      if (Math.abs(den) < 1e-9) continue;
      const u = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den, v = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
      if (u <= 0 || u >= 1 || v <= 0 || v >= 1) continue;
      const zi = a.z + (b.z - a.z) * u, zj = c.z + (d.z - c.z) * v;
      out.push({ i, j, u, v, arriba: zi >= zj ? "i" : "j" });
    }
  return out;
}

const camino = (pts: P2[], a = 0, b = pts.length - 1): string => {
  let d = "";
  for (let k = Math.max(0, a); k <= Math.min(pts.length - 1, b); k++) d += `${k === Math.max(0, a) ? "M" : "L"} ${pts[k].x.toFixed(1)} ${pts[k].y.toFixed(1)} `;
  return d;
};

/**
 * Cuerda con borde, puntos de semitono y cruces con arriba/abajo. `pts` en píxeles con z (mayor z = más cerca de la cámara).
 * `avance` 0→1 = cuánto de la cuerda se ha dibujado. `fondo` = color del fondo (el halo que corta la hebra de abajo).
 */
export const CuerdaZ: React.FC<{ pts: P3[]; color: string; fondo: string; borde?: string; grosor?: number; avance?: number; cerrada?: boolean; puntos?: boolean; maxCruces?: number }> = ({ pts, color, fondo, borde, grosor = 14, avance = 1, cerrada = false, puntos = true, maxCruces = 48 }) => {
  if (avance < 0.03) return null;
  const n = Math.max(2, Math.floor(pts.length * clamp(avance)));
  const vis = pts.slice(0, n);
  const bd = borde ?? fondo;
  const base = camino(vis);
  const cr = crucesZ(vis, cerrada && n === pts.length).slice(0, maxCruces);
  const ell = (() => { let L = 0; for (let k = 1; k < vis.length; k++) L += Math.hypot(vis[k].x - vis[k - 1].x, vis[k].y - vis[k - 1].y); return L / Math.max(1, vis.length - 1) || 1; })();
  const w = Math.ceil((grosor * 1.25 + 8) / ell);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={base} stroke={bd} strokeWidth={grosor + 7} />
      <path d={base} stroke={color} strokeWidth={grosor} />
      {puntos && <path d={base} stroke="#FFFFFF" strokeOpacity={0.38} strokeWidth={grosor * 0.3} strokeDasharray="0.1 11" />}
      {cr.map((c, k) => {
        const idx = c.arriba === "i" ? c.i + c.u : c.j + c.v;
        const a = Math.max(0, Math.floor(idx - w)), b = Math.min(vis.length - 1, Math.ceil(idx + 1 + w));
        const d = camino(vis, a, b);
        return (
          <g key={k}>
            <path d={d} stroke={fondo} strokeWidth={grosor + 17} strokeLinecap="butt" />
            <path d={d} stroke={bd} strokeWidth={grosor + 7} />
            <path d={d} stroke={color} strokeWidth={grosor} />
            {puntos && <path d={d} stroke="#FFFFFF" strokeOpacity={0.38} strokeWidth={grosor * 0.3} strokeDasharray="0.1 11" />}
          </g>
        );
      })}
    </g>
  );
};

/** Cuerda de la simulación 2D (nodos x,y en unidades de caja) dibujada en píxeles: centro (cx,cy), `s` px por unidad. Las hebras posteriores pasan por encima de las anteriores. */
export const CuerdaSim: React.FC<{ p: Float32Array; cx: number; cy: number; s: number; color: string; fondo: string; grosor?: number }> = ({ p, cx, cy, s, color, fondo, grosor = 12 }) => {
  const nodos: P2[] = [];
  for (let i = 0; i < p.length / 2; i++) nodos.push({ x: cx + p[i * 2] * s, y: cy + p[i * 2 + 1] * s });
  const suav = chaikin(nodos, 2);
  const pts: P3[] = suav.map((q, i) => ({ ...q, z: i / suav.length }));
  return <CuerdaZ pts={pts} color={color} fondo={fondo} grosor={grosor} maxCruces={40} />;
};

/** Caja cuadrada de lado 2·s que gira `ang` (rad, sentido horario en pantalla), con un punto en una esquina para ver el giro. */
export const CajaGiro: React.FC<{ cx: number; cy: number; s: number; ang: number; color?: string; grosor?: number; k?: number }> = ({ cx, cy, s, ang, color = CB.medida, grosor = 5, k = 1 }) => {
  const kk = clamp(k);
  if (kk <= 0.005) return null;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${(ang * 180) / Math.PI}) scale(${0.85 + 0.15 * kk})`} opacity={clamp(kk * 2)}>
      <rect x={-s - 10} y={-s - 10} width={2 * s + 20} height={2 * s + 20} rx={10} fill="rgba(244,241,234,0.035)" stroke={color} strokeOpacity={0.45} strokeWidth={grosor} />
      <circle cx={-s - 10} cy={-s - 10} r={grosor * 2.6} fill={color} />
      <line x1={-s * 0.3} x2={s * 0.3} y1={-s - 10} y2={-s - 10} stroke={color} strokeWidth={grosor * 2} strokeLinecap="round" />
    </g>
  );
};
