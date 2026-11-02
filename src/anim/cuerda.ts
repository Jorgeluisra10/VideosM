/**
 * Simulación 2D de una cuerda que gira dentro de una caja (puro, determinista, sin azar): el dibujo del video «Los cables se enredan solos».
 * Es una ILUSTRACIÓN inspirada en el experimento de Raymer y Smith (PNAS 2007): en 2D no hay nudos de verdad (solo cruces), pero la cuerda se desordena igual.
 *
 * Método: integración de Verlet con restricciones de distancia entre nodos vecinos, una restricción de «curvatura máxima» (rigidez) y las paredes de una caja
 * cuadrada que gira a velocidad constante mientras la gravedad cae siempre hacia abajo. Unidades: la caja mide 2 de lado (de −1 a 1 en su propio sistema).
 */

export type CfgCuerda = {
  /** nodos de la cuerda */
  n: number;
  /** longitud total (en unidades de caja; la caja mide 2) */
  largo: number;
  /** 0 = muy flexible … 1 = casi una varilla */
  rigidez: number;
  /** revoluciones de la caja por segundo (el estudio usó 1) */
  rps: number;
  /** segundos simulados */
  seg: number;
};

export type SimCuerda = {
  cfg: CfgCuerda;
  /** por fotograma (60 por segundo): x0,y0,x1,y1,… en el sistema del MUNDO (la caja gira, la gravedad no) */
  frames: Float32Array[];
  /** ángulo de la caja en cada fotograma (rad) */
  angulos: number[];
  /** cruces entre tramos no vecinos en cada fotograma */
  cruces: number[];
};

export const FPS_CUERDA = 60;
const SUB = 3;
/** gravedad en unidades de caja por s²: débil, para que la cuerda ruede y se desordene en vez de apilarse en el fondo */
const G = 0.8;

/** Cuerda en espiral (la «bien enrollada»), con nodos equiespaciados sobre la curva. */
export function cuerdaEnrollada(n: number, largo: number, cx = 0, cy = 0.3): Float32Array {
  const seg = largo / (n - 1);
  const p = new Float32Array(n * 2);
  let th = 0, r = 0.1;
  for (let i = 0; i < n; i++) {
    p[i * 2] = cx + r * Math.cos(th);
    p[i * 2 + 1] = cy + r * Math.sin(th);
    const dth = seg / Math.max(0.08, r);
    th += dth;
    r = 0.1 + 0.045 * th;
  }
  return p;
}

/** Número de cruces entre pares de tramos no consecutivos. */
export function contarCruces(p: Float32Array): number {
  const n = p.length / 2;
  let c = 0;
  const cr = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number): boolean => {
    const d1 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax), d2 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
    const d3 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx), d4 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
    return d1 * d2 < 0 && d3 * d4 < 0;
  };
  for (let i = 0; i < n - 1; i++)
    for (let j = i + 2; j < n - 1; j++)
      if (cr(p[i * 2], p[i * 2 + 1], p[i * 2 + 2], p[i * 2 + 3], p[j * 2], p[j * 2 + 1], p[j * 2 + 2], p[j * 2 + 3])) c++;
  return c;
}

const memo = new Map<string, SimCuerda>();

/** Simula la cuerda (con memoria: la misma configuración se calcula una sola vez). */
export function simularCuerda(cfg: CfgCuerda): SimCuerda {
  const clave = JSON.stringify(cfg);
  const hit = memo.get(clave);
  if (hit) return hit;
  const { n, largo, rigidez, rps, seg } = cfg;
  const segL = largo / (n - 1);
  const dt = 1 / FPS_CUERDA / SUB;
  const p = cuerdaEnrollada(n, largo);
  /* la espiral de partida debe caber dentro de la caja: si se sale por abajo se sube */
  let maxY = -9, minY = 9;
  for (let i = 0; i < n; i++) { maxY = Math.max(maxY, p[i * 2 + 1]); minY = Math.min(minY, p[i * 2 + 1]); }
  const dy0 = maxY > 0.88 ? 0.88 - maxY : 0;
  if (minY + dy0 < -0.88) throw new Error("La cuerda es demasiado larga para la caja");
  for (let i = 0; i < n; i++) p[i * 2 + 1] += dy0;
  const q = new Float32Array(p);
  const dmin = 2 * segL * (0.35 + 0.65 * Math.pow(Math.max(0, Math.min(1, rigidez)), 0.7));
  const omega = 2 * Math.PI * rps;
  const rad = 0.03;
  const frames: Float32Array[] = [new Float32Array(p)];
  const angulos: number[] = [0];
  const cruces: number[] = [contarCruces(p)];
  const total = Math.round(seg * FPS_CUERDA);
  let t = 0;
  for (let f = 1; f <= total; f++) {
    for (let s = 0; s < SUB; s++) {
      t += dt;
      for (let i = 0; i < n; i++) {
        const x = p[i * 2], y = p[i * 2 + 1];
        const vx = (x - q[i * 2]) * 0.996, vy = (y - q[i * 2 + 1]) * 0.996;
        q[i * 2] = x; q[i * 2 + 1] = y;
        p[i * 2] = x + vx; p[i * 2 + 1] = y + vy + G * dt * dt;
      }
      for (let it = 0; it < 7; it++) {
        for (let i = 0; i < n - 1; i++) {
          const dx = p[i * 2 + 2] - p[i * 2], dy = p[i * 2 + 3] - p[i * 2 + 1];
          const d = Math.hypot(dx, dy) || 1e-9, k = ((d - segL) / d) * 0.5;
          p[i * 2] += dx * k; p[i * 2 + 1] += dy * k; p[i * 2 + 2] -= dx * k; p[i * 2 + 3] -= dy * k;
        }
        for (let i = 0; i < n - 2; i++) {
          const dx = p[i * 2 + 4] - p[i * 2], dy = p[i * 2 + 5] - p[i * 2 + 1];
          const d = Math.hypot(dx, dy) || 1e-9;
          if (d < dmin) { const k = ((dmin - d) / d) * 0.5; p[i * 2] -= dx * k; p[i * 2 + 1] -= dy * k; p[i * 2 + 4] += dx * k; p[i * 2 + 5] += dy * k; }
        }
        const th = omega * t, c = Math.cos(th), sn = Math.sin(th);
        for (let i = 0; i < n; i++) {
          const x = p[i * 2], y = p[i * 2 + 1];
          let lx = c * x + sn * y, ly = -sn * x + c * y;
          const m = 1 - rad;
          if (lx > m || lx < -m || ly > m || ly < -m) {
            lx = Math.max(-m, Math.min(m, lx)); ly = Math.max(-m, Math.min(m, ly));
            p[i * 2] = c * lx - sn * ly; p[i * 2 + 1] = sn * lx + c * ly;
          }
        }
      }
    }
    frames.push(new Float32Array(p));
    angulos.push(omega * t);
    cruces.push(contarCruces(p));
  }
  const sim = { cfg, frames, angulos, cruces };
  memo.set(clave, sim);
  return sim;
}

/** Longitud actual de la cuerda (suma de tramos) de un fotograma: sirve para comprobar que no se estira. */
export function longitudCuerda(p: Float32Array): number {
  let L = 0;
  for (let i = 0; i < p.length / 2 - 1; i++) L += Math.hypot(p[i * 2 + 2] - p[i * 2], p[i * 2 + 3] - p[i * 2 + 1]);
  return L;
}

/**
 * Curva ESQUEMÁTICA de «probabilidad de nudo» según la longitud de la cuerda (cm): nada por debajo de 46 cm, sube con rapidez hasta ≈ 150 cm y se estanca por debajo del 100 %.
 * Solo reproduce la FORMA descrita por Raymer y Smith; no son sus datos. Devuelve 0–1 (la meseta se dibuja en `meseta`).
 */
export function probNudoEsquema(cm: number, meseta = 0.55): number {
  if (cm <= 46) return 0;
  const u = Math.min(1, (cm - 46) / (150 - 46));
  const s = u * u * (3 - 2 * u);
  return meseta * s;
}

/** Probabilidad RELATIVA de un nudo de `c` cruces (esquema): decae de forma exponencial con el número de cruces. */
export const probRelativaCruces = (c: number, k = 0.55): number => Math.exp(-k * (c - 3));
