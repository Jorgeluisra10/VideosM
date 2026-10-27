/**
 * Kit del ensayo «La regla del 37 %» (parada óptima, para IMNOBA): abstracto (cápsulas, visor, curva), con los colores de la marca.
 * Navy #02224E (fondo) · amarillo #FFC500 (la MEJOR opción y lo que importa) · azul #4C7DFF (la opción mediocre que se atrapa por frenar pronto) ·
 * azul claro #8EB8FF (telemetría: visor, ejes, lecturas) · rojo suave (lo que se pierde).
 * Piezas: LienzoIM (fondo con rejilla), Fila (N cápsulas con valor oculto/visible), VisorFila (esquinas ┌ ┐ └ ┘ sobre una cápsula), Etq (rótulo mono), ejes de la fila.
 * Titular, Odometro y Visor se reutilizan de anom-ui.tsx pasándoles estos colores.
 */
import React from "react";
import { useUid } from "../../estudio/util";
import { H, MONO, W, clamp, lerp } from "../comun";
import { Visor } from "./anom-ui";

export const IM = {
  navy: "#02224E",
  profundo: "#011433",
  medio: "#08336F",
  amarillo: "#FFC500",
  luz: "#FFE27A",
  azul: "#4C7DFF",
  tele: "#8EB8FF",
  blanco: "#FFFFFF",
  rojo: "#FF5A5F",
  verde: "#2BD48D",
  capsula: "#5A7DB8",
  oculta: "#2D4C86",
} as const;

/** Fondo de la pieza: navy con halo, rejilla fina y viñeta (cubre todo el fotograma). */
export const LienzoIM: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const uid = useUid();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: IM.profundo }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id={`${uid}m`} cx="50%" cy="46%" r="80%"><stop offset="0" stopColor={IM.medio} /><stop offset="0.55" stopColor={IM.navy} /><stop offset="1" stopColor={IM.profundo} /></radialGradient>
          <pattern id={`${uid}g`} width="54" height="54" patternUnits="userSpaceOnUse"><path d="M 54 0 L 0 0 0 54" fill="none" stroke="#fff" strokeOpacity="0.05" strokeWidth="1.5" /></pattern>
          <pattern id={`${uid}G`} width="270" height="270" patternUnits="userSpaceOnUse"><path d="M 270 0 L 0 0 0 270" fill="none" stroke="#fff" strokeOpacity="0.085" strokeWidth="2" /></pattern>
          <radialGradient id={`${uid}v`} cx="50%" cy="46%" r="78%"><stop offset="0.6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.4" /></radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}m)`} />
        <rect width={W} height={H} fill={`url(#${uid}g)`} />
        <rect width={W} height={H} fill={`url(#${uid}G)`} />
        <rect width={W} height={H} fill={`url(#${uid}v)`} />
      </svg>
      {children}
    </div>
  );
};

export const GEO = { x0: 100, ancho: 880 } as const;

export type EstCap = { rev: number; color?: string; op?: number; brillo?: number };

/** Posición x (centro) de la cápsula `i` (puede ser fraccionaria) en una fila de `n`. */
export const xCap = (i: number, n: number, x0: number = GEO.x0, ancho: number = GEO.ancho): number => x0 + ((i + 0.5) * ancho) / n;

/**
 * Fila de cápsulas verticales: la altura de cada una es su valor (1…n); mientras `rev` = 0 está «oculta» (bajita y apagada) y al revelarse crece hasta su valor.
 * `est(i)` decide el estado de cada cápsula en este fotograma. Va DENTRO de un <svg>.
 */
export const Fila: React.FC<{ valores: number[]; est: (i: number) => EstCap; yBase: number; alto: number; x0?: number; ancho?: number; ejes?: boolean }> = ({ valores, est, yBase, alto, x0 = GEO.x0, ancho = GEO.ancho, ejes = false }) => {
  const n = valores.length;
  const paso = ancho / n;
  const w = Math.max(2.2, paso * 0.66);
  return (
    <g>
      {valores.map((v, i) => {
        const e = est(i);
        const rev = clamp(e.rev);
        const h = Math.max(2, lerp(alto * 0.2, alto * Math.max(0.05, v / Math.max(...valores)), rev));
        const ww = e.brillo ? w * 1.9 : w;
        const x = x0 + i * paso + (paso - ww) / 2;
        const color = e.color ?? (rev > 0.5 ? IM.capsula : IM.oculta);
        return (
          <g key={i} opacity={e.op ?? 1}>
            {e.brillo ? <rect x={x - w * 1.6} y={yBase - h - 6} width={w * 4.2} height={h + 12} rx={w * 2} fill={color} opacity={0.28 * clamp(e.brillo)} /> : null}
            <rect x={x} y={yBase - h} width={ww} height={h} rx={ww / 2} fill={color} />
          </g>
        );
      })}
      <line x1={x0 - 10} x2={x0 + ancho + 10} y1={yBase + 8} y2={yBase + 8} stroke={IM.tele} strokeOpacity={0.5} strokeWidth={2} />
      {ejes && [1, 25, 50, 75, 100].filter((k) => k <= n).map((k) => (
        <g key={k}>
          <line x1={xCap(k - 1, n, x0, ancho)} x2={xCap(k - 1, n, x0, ancho)} y1={yBase + 8} y2={yBase + 20} stroke={IM.tele} strokeOpacity={0.7} strokeWidth={2} />
          <text x={xCap(k - 1, n, x0, ancho)} y={yBase + 46} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={22} fill={IM.tele} fillOpacity={0.8}>{k}</text>
        </g>
      ))}
    </g>
  );
};

/** Visor técnico sobre la cápsula `idx` (fraccionaria: se desliza entre cápsulas). Va DENTRO de un <svg>. */
export const VisorFila: React.FC<{ idx: number; n: number; yBase: number; alto: number; color?: string; progreso?: number; ancho?: number; x0?: number }> = ({ idx, n, yBase, alto, color = IM.tele, progreso = 1, ancho = GEO.ancho, x0 = GEO.x0 }) => {
  const w = Math.max(40, (ancho / n) * 4.2);
  return <Visor x={xCap(idx, n, x0, ancho) - w / 2} y={yBase - alto - 40} w={w} h={alto + 60} color={color} largo={26} grosor={4} progreso={progreso} />;
};

/** Rótulo mono suave (etiquetas, lecturas, supuestos). `data-texto` para que el QA mida sus márgenes. */
export const Etq: React.FC<{ texto: string; x: number; y: number; px?: number; color?: string; alinear?: "center" | "left" | "right"; op?: number; peso?: number; id?: string; ancho?: number }> = ({ texto, x, y, px = 28, color = IM.tele, alinear = "center", op = 1, peso = 700, id = "etq", ancho }) => {
  const pos: React.CSSProperties = alinear === "center" ? { left: x, transform: "translate(-50%, -50%)" } : alinear === "left" ? { left: x, transform: "translateY(-50%)" } : { left: x, transform: "translate(-100%, -50%)" };
  return <div data-texto={id} style={{ position: "absolute", top: y, width: ancho ?? "max-content", maxWidth: 880, ...pos, textAlign: alinear, fontFamily: MONO, fontWeight: peso, fontSize: px, color, opacity: op, whiteSpace: ancho ? "normal" : "nowrap", lineHeight: 1.25, letterSpacing: "0.03em" }}>{texto}</div>;
};

/** Barrido: índice (fraccionario) que va de `desde` a `hasta` entre `ini` y `ini + dur` segundos, con aceleración suave opcional. */
export const barrido = (t: number, ini: number, dur: number, desde: number, hasta: number, suave = false): number => {
  const k = clamp((t - ini) / Math.max(0.0001, dur));
  const q = suave ? k * k * (3 - 2 * k) : k;
  return desde + (hasta - desde) * q;
};
