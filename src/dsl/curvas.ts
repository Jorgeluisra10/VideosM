/** Curvas prediseñadas de las gráficas del catálogo (puras, sin React: las usan el render y el validador). */
export type PN = [number, number]; // x, y normalizados 0–1 (y hacia arriba)

export function curvaPreset(tipo: string, libre: unknown): { pts: PN[]; suave: boolean } {
  switch (tipo) {
    case "potencial-accion":
      return { suave: true, pts: [[0, 0.22], [0.14, 0.22], [0.18, 0.31], [0.22, 0.62], [0.27, 0.92], [0.33, 0.76], [0.4, 0.4], [0.47, 0.15], [0.56, 0.12], [0.67, 0.19], [0.8, 0.22], [1, 0.22]] };
    case "ecg": {
      const pts: PN[] = [];
      for (let c = 0; c < 2; c++) {
        const b = c * 0.5;
        pts.push([b, 0.4], [b + 0.04, 0.4], [b + 0.07, 0.48], [b + 0.1, 0.4], [b + 0.15, 0.4], [b + 0.17, 0.34], [b + 0.19, 0.88], [b + 0.215, 0.1], [b + 0.24, 0.4], [b + 0.32, 0.4], [b + 0.37, 0.56], [b + 0.42, 0.4]);
      }
      pts.push([1, 0.4]);
      return { suave: false, pts };
    }
    case "farmacocinetica": {
      const f = (x: number) => Math.exp(-3.2 * x) - Math.exp(-14 * x);
      const max = Math.max(...Array.from({ length: 101 }, (_, i) => f(i / 100)));
      return { suave: true, pts: Array.from({ length: 21 }, (_, i) => [i / 20, 0.04 + (f(i / 20) / max) * 0.86] as PN) };
    }
    case "dosis-respuesta":
      return { suave: true, pts: Array.from({ length: 21 }, (_, i) => [i / 20, 0.04 + 0.9 / (1 + Math.exp(-11 * (i / 20 - 0.5)))] as PN) };
    default: {
      const ok = Array.isArray(libre) && libre.length >= 2 && libre.every((p) => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === "number"));
      return { suave: true, pts: ok ? (libre as PN[]).map(([x, y]) => [Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y))] as PN) : [[0, 0.1], [1, 0.9]] };
    }
  }
}

/** y normalizada de la curva en x normalizada (interpolación lineal entre puntos). */
export function yEn(pts: PN[], fx: number): number {
  for (let i = 1; i < pts.length; i++) {
    if (fx <= pts[i][0]) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      return x1 === x0 ? y1 : y0 + ((y1 - y0) * (fx - x0)) / (x1 - x0);
    }
  }
  return pts[pts.length - 1][1];
}
