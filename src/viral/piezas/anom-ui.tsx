/**
 * Kit visual del ensayo «Anomalía» (carril B, v2 abstracto): sin trenes, buses, autos, edificios ni personas; todo son cápsulas, nodos, vectores, mallas y partículas.
 * Paleta fija del brief (no depende del tema): oscuro #0D0E12 · marino profundo · papel #F4F1EA · rojo bermellón #F04124 (el sujeto, con semitono) ·
 * azul eléctrico #2B38F0 (fuerzas opuestas, déficits, comparativas) · lima ácido #D4FF33 (métricas, escalas, vectores y contadores).
 * Piezas: Lienzo (fondos), Titular (con tachado dinámico), Odometro (dígitos que ruedan en vertical), Knob (potenciómetro), Visor (esquinas ┌ ┐ └ ┘),
 * Blancos («_ _ _ _» que se resuelve), PuntosSemitono (halftone), ruido de valor, y las geometrías compartidas (fyllotaxis del disco, Voronoi).
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { ANCHO_DOC, FUENTE, H, MONO, W, ajustarTexto, clamp, easeOut, lerp, spr, useReloj, useViral } from "../comun";

export const AN = {
  oscuro: "#0D0E12",
  marino: "#081238",
  marinoFondo: "#04091F",
  papel: "#F4F1EA",
  tinta: "#0D0E12",
  rojo: "#F04124",
  azul: "#2B38F0",
  lima: "#D4FF33",
  blanco: "#F4F1EA",
  suaveOscuro: "rgba(244,241,234,0.55)",
  suavePapel: "rgba(13,14,18,0.5)",
} as const;

/* ───────────── fondos ───────────── */

/** Lienzo de la pieza: negro mate, azul marino profundo o papel crema cuadriculado. Cubre TODO el fotograma (la pieza es dueña de su fondo). */
export const Lienzo: React.FC<{ modo: "oscuro" | "marino" | "papel"; children?: React.ReactNode; rejilla?: boolean }> = ({ modo, children, rejilla = true }) => {
  const uid = useUid();
  const papel = modo === "papel";
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: papel ? AN.papel : modo === "marino" ? AN.marinoFondo : AN.oscuro }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id={`${uid}m`} cx="50%" cy="42%" r="80%"><stop offset="0" stopColor="#0E2A7A" stopOpacity="0.95" /><stop offset="0.55" stopColor={AN.marino} /><stop offset="1" stopColor={AN.marinoFondo} /></radialGradient>
          <pattern id={`${uid}g`} width="54" height="54" patternUnits="userSpaceOnUse"><path d="M 54 0 L 0 0 0 54" fill="none" stroke={papel ? AN.tinta : "#FFFFFF"} strokeOpacity={papel ? 0.075 : 0.05} strokeWidth="1.5" /></pattern>
          <pattern id={`${uid}G`} width="270" height="270" patternUnits="userSpaceOnUse"><path d="M 270 0 L 0 0 0 270" fill="none" stroke={papel ? AN.tinta : "#FFFFFF"} strokeOpacity={papel ? 0.13 : 0.085} strokeWidth="2" /></pattern>
          <radialGradient id={`${uid}v`} cx="50%" cy="46%" r="78%"><stop offset="0.6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity={papel ? 0.07 : 0.32} /></radialGradient>
        </defs>
        {modo === "marino" && <rect width={W} height={H} fill={`url(#${uid}m)`} />}
        {rejilla && <rect width={W} height={H} fill={`url(#${uid}g)`} />}
        {rejilla && <rect width={W} height={H} fill={`url(#${uid}G)`} />}
        <rect width={W} height={H} fill={`url(#${uid}v)`} />
      </svg>
      {children}
    </div>
  );
};

/* ───────────── ruido y geometrías compartidas ───────────── */

const suave = (k: number): number => k * k * (3 - 2 * k);
/** ruido de valor 2D en [0,1) (determinista) */
export function ruido(x: number, y: number, s = 0): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = suave(x - xi), yf = suave(y - yi);
  const h = (i: number, j: number): number => azar(i * 12.9898 + j * 78.233 + s * 37.719);
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), xf), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), xf), yf);
}

/** El disco de la ciudad: filotaxis (ángulo áureo). Es la geometría del primer fotograma y a la que regresa el cierre en bucle. */
export const DISCO = { n: 2400, cx: W / 2, cy: 1135, R: 400 } as const;
const AUREO = Math.PI * (3 - Math.sqrt(5));
export type PuntoDisco = { x0: number; y0: number; r: number; a: number; i: number; rad: number };
export const puntosDisco = (): PuntoDisco[] =>
  Array.from({ length: DISCO.n }, (_, i) => {
    const rr = Math.sqrt((i + 0.5) / DISCO.n);
    const a = i * AUREO;
    return { x0: DISCO.cx + Math.cos(a) * rr * DISCO.R, y0: DISCO.cy + Math.sin(a) * rr * DISCO.R, r: rr, a, i, rad: 2.2 + 5.6 * Math.pow(1 - rr, 0.9) };
  });

/** Polígono (lista de puntos) recortado por el semiplano {p : n·p ≤ c} (Sutherland–Hodgman). */
function recortar(poli: [number, number][], nx: number, ny: number, c: number): [number, number][] {
  const salida: [number, number][] = [];
  for (let i = 0; i < poli.length; i++) {
    const A = poli[i], B = poli[(i + 1) % poli.length];
    const da = nx * A[0] + ny * A[1] - c, db = nx * B[0] + ny * B[1] - c;
    if (da <= 0) salida.push(A);
    if (da * db < 0) { const k = da / (da - db); salida.push([A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k]); }
  }
  return salida;
}

export type CeldaVoronoi = { sx: number; sy: number; poli: [number, number][]; i: number };
/** Teselación de Voronoi de `semillas` dentro de [0,ancho]×[0,alto], con `relajar` pasos de Lloyd (celdas más parejas). */
export function voronoi(semillas: [number, number][], ancho: number, alto: number, relajar = 2): CeldaVoronoi[] {
  let pts = semillas.map((p) => [...p] as [number, number]);
  const calcular = (): CeldaVoronoi[] => pts.map((p, i) => {
    let poli: [number, number][] = [[0, 0], [ancho, 0], [ancho, alto], [0, alto]];
    for (let j = 0; j < pts.length && poli.length; j++) {
      if (j === i) continue;
      const q = pts[j];
      const nx = q[0] - p[0], ny = q[1] - p[1];
      poli = recortar(poli, nx, ny, (q[0] * q[0] + q[1] * q[1] - p[0] * p[0] - p[1] * p[1]) / 2);
    }
    return { sx: p[0], sy: p[1], poli, i };
  });
  let celdas = calcular();
  for (let k = 0; k < relajar; k++) {
    pts = celdas.map((c) => {
      if (c.poli.length < 3) return [c.sx, c.sy] as [number, number];
      let A = 0, cx = 0, cy = 0;
      for (let i = 0; i < c.poli.length; i++) {
        const P = c.poli[i], Q = c.poli[(i + 1) % c.poli.length];
        const cr = P[0] * Q[1] - Q[0] * P[1];
        A += cr; cx += (P[0] + Q[0]) * cr; cy += (P[1] + Q[1]) * cr;
      }
      return A === 0 ? ([c.sx, c.sy] as [number, number]) : ([cx / (3 * A), cy / (3 * A)] as [number, number]);
    });
    celdas = calcular();
  }
  return celdas;
}

/* ───────────── texto y contadores ───────────── */

/**
 * Titular de 1–3 líneas en sans extra-bold mayúscula. Cada línea: color propio, `tachado` (segundo en que una raya bermellón la cruza) y retraso.
 * Se ajusta al ancho para no tocar los márgenes.
 */
export const Titular: React.FC<{ lineas: { texto: string; color?: string; tachado?: number; delay?: number; colorTachado?: string }[]; y: number; maxPx?: number; minPx?: number; ancho?: number; id?: string; color?: string; alinear?: "center" | "left"; x?: number }> = ({ lineas, y, maxPx = 100, minPx = 44, ancho = 840, id = "titular-an", color = AN.blanco, alinear = "center", x = W / 2 }) => {
  const { f, t, a } = useReloj();
  const { doc } = useViral();
  const k = 0.68 * (doc ? ANCHO_DOC : 1);
  // todas las líneas con el MISMO tamaño: el que cabe la más larga
  const px = Math.min(...lineas.map((l) => ajustarTexto(l.texto, ancho, maxPx, minPx, 1, k).px));
  return (
    <div data-texto={id} style={{ position: "absolute", left: alinear === "center" ? x - ancho / 2 : x, top: y, width: ancho, transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: alinear === "center" ? "center" : "flex-start", gap: px * 0.04, fontFamily: FUENTE, fontWeight: 900, fontSize: px, lineHeight: 1.0, letterSpacing: "-0.025em", textTransform: "uppercase" }}>
      {lineas.map((l, i) => {
        const s = spr(f, a(l.delay ?? 0.1 + i * 0.25), { damping: 14, stiffness: 140, mass: 0.7 });
        const tach = l.tachado !== undefined ? easeOut((t - a(l.tachado)) / 0.28) : 0;
        return (
          <span key={i} style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap", color: l.color ?? color, opacity: clamp(s * 2), transform: `translateY(${(1 - s) * px * 0.45}px)` }}>
            {l.texto}
            {tach > 0 && <span style={{ position: "absolute", left: -px * 0.08, top: "52%", height: Math.max(8, px * 0.13), width: `calc(${tach * 100}% + ${px * 0.16 * tach}px)`, background: l.colorTachado ?? AN.rojo, transform: "translateY(-50%) rotate(-1.4deg)", transformOrigin: "left center", borderRadius: 2 }} />}
          </span>
        );
      })}
    </div>
  );
};

/** «_ _ _ _»: cuatro guiones bajos mono que parpadean y se resuelven en `valor` a partir de `resuelve` s (como una etiqueta de laboratorio por completar). */
export const Blancos: React.FC<{ x: number; y: number; px: number; color?: string; valor?: string; resuelve?: number; delay?: number; alinear?: "center" | "left" | "right"; id?: string; antes?: string }> = ({ x, y, px, color = AN.lima, valor, resuelve, delay = 0, alinear = "center", id = "blancos", antes }) => {
  const { f, t, a } = useReloj();
  const s = spr(f, a(delay), { damping: 14, stiffness: 130, mass: 0.7 });
  const res = valor !== undefined && resuelve !== undefined && t >= a(resuelve);
  const flash = res && t < a(resuelve) + 0.18 ? (Math.floor(f / 2) % 2 ? 0.25 : 1) : 1;
  const pos: React.CSSProperties = alinear === "center" ? { left: x, transform: "translate(-50%, -50%)" } : alinear === "left" ? { left: x, transform: "translateY(-50%)" } : { left: x, transform: "translate(-100%, -50%)" };
  const cursor = Math.floor(t * 2.5) % 2 === 0;
  return (
    <div data-texto={id} style={{ position: "absolute", top: y, width: "max-content", ...pos, fontFamily: MONO, fontWeight: 700, fontSize: px, color, opacity: clamp(s * 2) * flash, whiteSpace: "pre", lineHeight: 1.1, letterSpacing: "0.04em" }}>
      {antes}{res ? valor : (cursor ? "_ _ _ _" : "_ _ _  ")}
    </div>
  );
};

/** Odómetro: cada dígito es una columna que rueda en vertical (el de las unidades, continuo; los demás, al completar la vuelta del anterior). */
export const Odometro: React.FC<{ valor: number; x: number; y: number; px: number; digitos?: number; color?: string; sufijo?: string; prefijo?: string; alinear?: "center" | "left" | "right"; separador?: string; decimales?: number; id?: string; opacidad?: number }> = ({ valor, x, y, px, digitos, color = AN.lima, sufijo = "", prefijo = "", alinear = "center", separador = ".", decimales = 0, id = "odometro", opacidad = 1 }) => {
  const v = Math.max(0, valor) * Math.pow(10, decimales);
  const n = digitos ?? Math.max(1, String(Math.round(Math.pow(10, decimales) * Math.max(1, valor))).length);
  const hDig = px * 1.12;
  const wDig = px * 0.62;
  const cols: React.ReactNode[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const p = v / Math.pow(10, i);
    const base = Math.floor(p);
    const frac = p - base;
    const rueda = i === 0 ? p : base + clamp((frac - 0.86) / 0.14);
    const m = ((rueda % 10) + 10) % 10;
    const apagado = i > 0 && p < 1 && i >= Math.max(1, String(Math.floor(v)).length);
    cols.push(
      <span key={`d${i}`} style={{ display: "inline-block", width: wDig, height: hDig, overflow: "hidden", position: "relative", opacity: apagado ? 0.18 : 1 }}>
        <span style={{ position: "absolute", left: 0, top: 0, width: "100%", transform: `translateY(${-m * hDig}px)` }}>
          {Array.from({ length: 11 }, (_, d) => <span key={d} style={{ display: "block", height: hDig, lineHeight: `${hDig}px`, textAlign: "center" }}>{d % 10}</span>)}
        </span>
      </span>,
    );
    const pos = i - decimales;
    if (i > 0 && decimales > 0 && pos === 0) cols.push(<span key={`c${i}`} style={{ display: "inline-block", width: wDig * 0.45, textAlign: "center", lineHeight: `${hDig}px` }}>,</span>);
    else if (i > 0 && pos > 0 && pos % 3 === 0) cols.push(<span key={`s${i}`} style={{ display: "inline-block", width: wDig * 0.45, textAlign: "center", lineHeight: `${hDig}px`, opacity: v >= Math.pow(10, i) ? 1 : 0.18 }}>{separador}</span>);
  }
  const pos: React.CSSProperties = alinear === "center" ? { left: x, transform: "translate(-50%, -50%)" } : alinear === "left" ? { left: x, transform: "translateY(-50%)" } : { left: x, transform: "translate(-100%, -50%)" };
  return (
    <div data-texto={id} style={{ position: "absolute", top: y, width: "max-content", ...pos, display: "flex", alignItems: "center", fontFamily: MONO, fontWeight: 800, fontSize: px, color, opacity: opacidad, whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>
      {prefijo && <span style={{ marginRight: px * 0.1, lineHeight: `${hDig}px` }}>{prefijo}</span>}
      {cols}
      {sufijo && <span style={{ marginLeft: px * 0.14, fontSize: px * 0.46, fontWeight: 600, opacity: 0.85, lineHeight: `${hDig}px` }}>{sufijo}</span>}
    </div>
  );
};

/* ───────────── instrumentos (dentro de un <svg>) ───────────── */

/** Potenciómetro circular: arco de 270°, marcas, aguja que gira hasta `valor` (0–1) y la lectura debajo. Dibuja con su propio <g>. */
export const Knob: React.FC<{ cx: number; cy: number; r: number; valor: number; etiqueta: string; lectura?: string; color?: string; ink?: string; aparece?: number }> = ({ cx, cy, r, valor, etiqueta, lectura, color = AN.lima, ink = AN.blanco, aparece = 1 }) => {
  const v = clamp(valor);
  const a0 = 135, span = 270;
  const ang = a0 + span * v;
  const pol = (g: number, rr: number): [number, number] => [cx + rr * Math.cos((g * Math.PI) / 180), cy + rr * Math.sin((g * Math.PI) / 180)];
  const arco = (g0: number, g1: number, rr: number): string => {
    const [x0, y0] = pol(g0, rr), [x1, y1] = pol(g1, rr);
    return `M ${x0} ${y0} A ${rr} ${rr} 0 ${g1 - g0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  const [px, py] = pol(ang, r * 0.78);
  return (
    <g opacity={aparece}>
      <circle cx={cx} cy={cy} r={r * 1.04} fill={AN.oscuro} fillOpacity={0.55} stroke={ink} strokeOpacity={0.35} strokeWidth={2} />
      {Array.from({ length: 28 }, (_, i) => {
        const g = a0 + (span * i) / 27;
        const [x1, y1] = pol(g, r * 0.86), [x2, y2] = pol(g, r * (i % 9 === 0 ? 0.98 : 0.93));
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ink} strokeOpacity={g <= ang ? 0.9 : 0.28} strokeWidth={i % 9 === 0 ? 3 : 1.8} />;
      })}
      {v > 0.003 && <path d={arco(a0, ang, r * 0.7)} fill="none" stroke={color} strokeWidth={r * 0.1} strokeLinecap="round" />}
      <line x1={cx} y1={cy} x2={px} y2={py} stroke={ink} strokeWidth={r * 0.06} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r * 0.11} fill={color} />
      <text x={cx} y={cy + r * 1.42} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={r * 0.3} fill={ink} fillOpacity={0.85} letterSpacing="0.06em">{etiqueta}</text>
      {lectura !== undefined && <text x={cx} y={cy + r * 0.52} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={r * 0.34} fill={color}>{lectura}</text>}
    </g>
  );
};

/** Visor técnico: cuatro esquinas ┌ ┐ └ ┘ que se abren hacia fuera, más una cruz central opcional. */
export const Visor: React.FC<{ x: number; y: number; w: number; h: number; color?: string; largo?: number; grosor?: number; progreso?: number; cruz?: boolean }> = ({ x, y, w, h, color = AN.lima, largo = 56, grosor = 5, progreso = 1, cruz = false }) => {
  const d = (1 - progreso) * 36;
  const l = largo;
  const E = (px: number, py: number, sx: number, sy: number): string => `M ${px + sx * l} ${py} L ${px} ${py} L ${px} ${py + sy * l}`;
  return (
    <g opacity={clamp(progreso * 2)} stroke={color} strokeWidth={grosor} fill="none" strokeLinecap="square">
      <path d={E(x - d, y - d, 1, 1)} /><path d={E(x + w + d, y - d, -1, 1)} /><path d={E(x - d, y + h + d, 1, -1)} /><path d={E(x + w + d, y + h + d, -1, -1)} />
      {cruz && <><line x1={x + w / 2 - 22} x2={x + w / 2 + 22} y1={y + h / 2} y2={y + h / 2} strokeWidth={2.5} /><line y1={y + h / 2 - 22} y2={y + h / 2 + 22} x1={x + w / 2} x2={x + w / 2} strokeWidth={2.5} /></>}
    </g>
  );
};

/**
 * Semitono: puntos en retícula a 45° cuyo radio sigue un campo 0–1 (0 = sin punto). `campo(x, y)` devuelve la intensidad.
 * Es el sombreado del sujeto (rojo) y de los mapas de calor.
 */
export const PuntosSemitono: React.FC<{ campo: (x: number, y: number) => number; x0: number; y0: number; w: number; h: number; paso?: number; color: string; rMax?: number; opacidad?: number; recorte?: (x: number, y: number) => boolean }> = ({ campo, x0, y0, w, h, paso = 22, color, rMax, opacidad = 1, recorte }) => {
  const R = rMax ?? paso * 0.56;
  const out: React.ReactNode[] = [];
  const c = paso * Math.SQRT1_2;
  const cx = x0 + w / 2, cy = y0 + h / 2;
  const nU = Math.ceil((w + h) / (2 * c)) + 2;
  for (let u = -nU; u <= nU; u++)
    for (let v = -nU; v <= nU; v++) {
      const x = cx + (u - v) * c, y = cy + (u + v) * c;
      if (x < x0 || x > x0 + w || y < y0 || y > y0 + h) continue;
      if (recorte && !recorte(x, y)) continue;
      const k = clamp(campo(x, y));
      if (k < 0.04) continue;
      out.push(<circle key={`${u},${v}`} cx={x} cy={y} r={Math.max(0.8, R * Math.sqrt(k))} fill={color} opacity={opacidad} />);
    }
  return <g>{out}</g>;
};

/** Cápsula orientada (sin dibujar nada literal): rectángulo redondeado que apunta según `ang` (rad). */
export const Capsula: React.FC<{ x: number; y: number; ang: number; l?: number; g?: number; color: string; opacidad?: number }> = ({ x, y, ang, l = 30, g = 11, color, opacidad = 1 }) => (
  <rect x={-l / 2} y={-g / 2} width={l} height={g} rx={g / 2} fill={color} opacity={opacidad} transform={`translate(${x} ${y}) rotate(${(ang * 180) / Math.PI})`} />
);

/** Proyección isométrica: (x, y) sobre el plano y z hacia arriba → pantalla. `sc` = px por unidad en el plano, `zs` = px por unidad de altura. */
export const proyectar = (x: number, y: number, z: number, cfg: { cx: number; cy: number; sc: number; zs: number }): [number, number] => [cfg.cx + (x - y) * 0.866 * cfg.sc, cfg.cy + (x + y) * 0.5 * cfg.sc - z * cfg.zs];

/** Cruce de los segmentos AB y CD (o null). */
export function cruceSegmentos(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, d: { x: number; y: number }): { x: number; y: number } | null {
  const r = { x: b.x - a.x, y: b.y - a.y }, q = { x: d.x - c.x, y: d.y - c.y };
  const den = r.x * q.y - r.y * q.x;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c.x - a.x) * q.y - (c.y - a.y) * q.x) / den;
  const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { x: a.x + t * r.x, y: a.y + t * r.y } : null;
}

/** Catmull-Rom → cadena de curvas de Bézier cúbicas por los puntos dados. */
export function bezierPor(pts: { x: number; y: number }[], tension = 0.5): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + ((p2.x - p0.x) * tension) / 3, c1y = p1.y + ((p2.y - p0.y) * tension) / 3;
    const c2x = p2.x - ((p3.x - p1.x) * tension) / 3, c2y = p2.y - ((p3.y - p1.y) * tension) / 3;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Muestrea una cadena Bézier de `bezierPor` en `n` puntos igualmente espaciados en longitud de arco. */
export function muestrear(pts: { x: number; y: number }[], n = 200, tension = 0.5): { x: number; y: number; a: number; s: number }[] {
  const crudo: { x: number; y: number }[] = [];
  const paso = 14;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = { x: p1.x + ((p2.x - p0.x) * tension) / 3, y: p1.y + ((p2.y - p0.y) * tension) / 3 };
    const c2 = { x: p2.x - ((p3.x - p1.x) * tension) / 3, y: p2.y - ((p3.y - p1.y) * tension) / 3 };
    for (let k = 0; k < paso; k++) {
      const u = k / paso, v = 1 - u;
      crudo.push({ x: v * v * v * p1.x + 3 * v * v * u * c1.x + 3 * v * u * u * c2.x + u * u * u * p2.x, y: v * v * v * p1.y + 3 * v * v * u * c1.y + 3 * v * u * u * c2.y + u * u * u * p2.y });
    }
  }
  crudo.push(pts[pts.length - 1]);
  const acum = [0];
  for (let i = 1; i < crudo.length; i++) acum.push(acum[i - 1] + Math.hypot(crudo[i].x - crudo[i - 1].x, crudo[i].y - crudo[i - 1].y));
  const total = acum[acum.length - 1];
  const out: { x: number; y: number; a: number; s: number }[] = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const s = (total * i) / (n - 1);
    while (j < acum.length - 2 && acum[j + 1] < s) j++;
    const k = (s - acum[j]) / Math.max(1e-6, acum[j + 1] - acum[j]);
    const A = crudo[j], B = crudo[j + 1];
    out.push({ x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k), a: Math.atan2(B.y - A.y, B.x - A.x), s });
  }
  return out;
}
