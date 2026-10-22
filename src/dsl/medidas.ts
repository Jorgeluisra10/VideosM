/**
 * Geometría del escenario para los planes de la IA.
 *
 * La IA trabaja en una cuadrícula de 0–100 en ambos ejes (centro = 50,50) que cae dentro de la
 * zona segura del escenario (x 100–980 px, y 410–1290 px): 1 unidad = 8,8 px, casilla cuadrada.
 * Así ningún elemento colocado en 0–100 invade los subtítulos ni el encabezado ni los márgenes.
 */
export const U = 8.8;
export const X0 = 100;
export const Y0 = 410;

const acotar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const num = (v: unknown, def = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : def);

/** unidades (0–100) → píxeles del video. Se permite salir un poco (-15…115) para efectos de borde. */
export const px = (x: unknown): number => X0 + acotar(num(x, 50), -15, 115) * U;
export const py = (y: unknown): number => Y0 + acotar(num(y, 50), -15, 115) * U;
/** longitud en unidades → píxeles */
export const pu = (u: unknown, def = 10): number => num(u, def) * U;

export type Punto = [number, number];

export const puntosValidos = (p: unknown): p is Punto[] =>
  Array.isArray(p) && p.length >= 2 && p.every((q) => Array.isArray(q) && q.length === 2 && q.every((n) => typeof n === "number" && Number.isFinite(n)));

/** Puntos en unidades → polilínea "M x,y L x,y ..." en píxeles. */
export function polilinea(puntos: Punto[]): string {
  return puntos.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${px(x).toFixed(1)},${py(y).toFixed(1)}`).join(" ");
}

/** Curva suave (Catmull-Rom → Bézier cúbica) que pasa por todos los puntos dados EN PÍXELES. */
export function curvaPx(P: [number, number][], tension = 0.5): string {
  if (P.length < 3) return P.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  let d = `M ${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
  const k = tension / 3;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)];
    const p1 = P[i];
    const p2 = P[i + 1];
    const p3 = P[Math.min(P.length - 1, i + 2)];
    d += ` C ${(p1[0] + (p2[0] - p0[0]) * k).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) * k).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) * k).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) * k).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Igual que curvaPx pero con puntos en unidades 0–100. */
export const curvaSuave = (puntos: Punto[], tension = 0.5): string => curvaPx(puntos.map(([x, y]) => [px(x), py(y)] as [number, number]), tension);

/** Ruta de píxeles a partir de puntos en unidades. */
export const rutaDe = (puntos: Punto[], curva = true): string => (curva ? curvaSuave(puntos) : polilinea(puntos));

/** Posiciones recomendadas ("slots") que se documentan a la IA para evitar solapes. */
export const SLOTS: Record<string, Record<string, Punto>> = {
  centro: { A: [50, 50] },
  "dos-columnas": { A: [27, 50], B: [73, 50] },
  "dos-filas": { A: [50, 27], B: [50, 73] },
  "tres-filas": { A: [50, 17], B: [50, 50], C: [50, 83] },
  "tres-columnas": { A: [17, 50], B: [50, 50], C: [83, 50] },
  cuadricula: { A: [27, 27], B: [73, 27], C: [27, 73], D: [73, 73] },
  triangulo: { A: [50, 20], B: [24, 76], C: [76, 76] },
};
