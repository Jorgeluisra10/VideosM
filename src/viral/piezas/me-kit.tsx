/**
 * Kit del video «La médula espinal: el atajo del cuerpo» (SINAPSIS · neuroanatomía): anatomía vectorial sobre fondo oscuro, determinista.
 *   Columna     columna vertebral de perfil (24 vértebras + sacro + cóccix) con el canal medular, la médula (cono en L1–L2), la cola de caballo y los 31 pares de nervios
 *   Corte       corte transversal de la médula: mariposa de sustancia gris, sustancia blanca, canal central, raíces dorsal y ventral y vías que suben y bajan
 *   Axon        axón con vainas de mielina y nodos de Ranvier; el impulso salta de nodo en nodo
 *   Cerebro     icono del cerebro (se apaga cuando no participa)
 *   Cuerpo      silueta humana con zonas (brazos, tronco, piernas) conectadas o no a la médula
 *   LineaN      barra de partes del sistema (cerebro · médula · nervios · músculo) con el tramo activo
 * Color: azul = sensitivo · naranja = motor · violeta = cerebro · blanco azulado = sustancia blanca · gris = sustancia gris · dorado = datos.
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeOut, lerp, mezclar } from "../comun";
import { FONT, MONOF } from "./real-kit";
import { sua } from "./jet-kit";

export const ME = {
  fondo: "#050913",
  blanca: "#E6EDFF",
  gris: "#8FA3C8",
  sens: "#3FA9FF",
  mot: "#FF6A4A",
  cereb: "#B78CFF",
  oro: "#FFD166",
  verde: "#5CE0A0",
  rojo: "#FF5A5F",
  hielo: "#BFE0FF",
} as const;
export { sua, clamp, lerp, mezclar, easeOut, FONT, MONOF, azar };
export const SERIF = "Georgia, 'Times New Roman', serif";

export const Chip: React.FC<{ x: number; y: number; texto: string; color?: string; px?: number; opacidad?: number; id: string; anchor?: "left" | "center" | "right" }> = ({ x, y, texto, color = ME.oro, px = 28, opacidad = 1, id, anchor = "left" }) => (
  <div data-texto={id} style={{ position: "absolute", left: anchor === "left" ? x : anchor === "center" ? x - 450 : x - 900, top: y, width: anchor === "left" ? undefined : 900, textAlign: anchor, opacity: opacidad, fontFamily: MONOF, fontWeight: 800, fontSize: px, letterSpacing: "0.06em", color, textShadow: "0 4px 18px rgba(0,0,0,0.85)", whiteSpace: "pre" }}>{texto}</div>
);

export const Ambiente: React.FC<{ t: number; x?: number; y?: number; color?: string; intensidad?: number }> = ({ t, x = 540, y = 900, color = ME.cereb, intensidad = 1 }) => {
  const uid = useUid();
  return (
    <>
      <defs><radialGradient id={`${uid}g`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={color} stopOpacity={0.2 * intensidad} /><stop offset="0.6" stopColor={color} stopOpacity={0.06 * intensidad} /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient></defs>
      <circle cx={x} cy={y} r={680} fill={`url(#${uid}g)`} opacity={0.85 + 0.15 * Math.sin(t * 3)} />
      {Array.from({ length: 20 }, (_, i) => {
        const px = azar(i * 3.1) * W + Math.sin(t * 0.3 + i) * 30, py = ((azar(i * 5.7) * H - t * (8 + azar(i) * 16)) % H + H) % H;
        return <circle key={i} cx={px} cy={py} r={2 + azar(i * 2.9) * 3} fill={ME.sens} opacity={0.05 + 0.12 * azar(i * 7.7)} />;
      })}
    </>
  );
};

/* ───────────── cerebro ───────────── */

/** Icono del cerebro (violeta). `apagado` 0–1 lo oscurece. Origen = centro; ancho ≈ 220·s. */
export const Cerebro: React.FC<{ x: number; y: number; s?: number; brillo?: number; apagado?: number; t?: number }> = ({ x, y, s = 1, brillo = 0.5, apagado = 0, t = 0 }) => {
  const uid = useUid();
  const col = mezclar(ME.cereb, "#3A3A4A", clamp(apagado));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs><radialGradient id={`${uid}r`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={ME.cereb} stopOpacity="0.6" /><stop offset="1" stopColor={ME.cereb} stopOpacity="0" /></radialGradient></defs>
      <circle r={190} fill={`url(#${uid}r)`} opacity={brillo * (1 - apagado) * (0.8 + 0.2 * Math.sin(t * 5))} />
      <path d="M -100 10 C -118 -40 -80 -84 -30 -82 C -16 -100 24 -100 38 -80 C 86 -86 120 -40 100 10 C 114 50 80 84 40 72 C 24 90 -16 90 -30 72 C -76 82 -118 50 -100 10 Z" fill={col} stroke="#2A1A5A" strokeWidth={5} />
      <g fill="none" stroke="#2A1A5A" strokeOpacity={0.55} strokeWidth={4} strokeLinecap="round"><path d="M -70 -10 C -50 -40 -20 -20 -10 -50" /><path d="M 10 -52 C 30 -30 60 -48 80 -20" /><path d="M -80 30 C -50 10 -30 40 0 20 C 20 8 50 40 76 24" /><path d="M 0 -76 L 0 70" strokeOpacity={0.3} /></g>
      <path d="M -40 74 C -30 110 -10 130 6 150" stroke={col} strokeWidth={22} strokeLinecap="round" fill="none" />
      {apagado > 0.5 && <g opacity={apagado}><circle r={40} fill="#3A0A14" stroke={ME.rojo} strokeWidth={7} /><path d="M -16 -16 L 16 16 M 16 -16 L -16 16" stroke="#fff" strokeWidth={8} strokeLinecap="round" /></g>}
    </g>
  );
};

/* ───────────── columna vertebral ───────────── */

export type VertGeo = { x: number; y: number; ang: number; w: number; h: number; reg: "c" | "t" | "l" };
const NC = 7, NT = 12, NL = 5;
/** Geometría de la columna de perfil: `alto` = alto total en px (desde C1 hasta el cóccix). Origen = arriba-centro. */
export function geoColumna(alto: number): { v: VertGeo[]; sacro: { x: number; y: number; h: number }; coccix: { x: number; y: number }; yDe: (i: number) => number; xDe: (i: number) => number } {
  const pesos = [...Array(NC).fill(0.62), ...Array(NT).fill(0.84), ...Array(NL).fill(1.12)];
  const total = pesos.reduce((a, b) => a + b, 0) + 2.6 + 0.8;
  const ys: number[] = []; let acc = 0;
  pesos.forEach((p) => { ys.push(acc + p / 2); acc += p; });
  const k = alto / total;
  const curva = (y: number): number => { const u = y / alto; return -34 * Math.sin(u * Math.PI * 2.1 + 0.9) + 20 * u; };
  const v: VertGeo[] = ys.map((yy, i) => {
    const y = yy * k, x = curva(y), dx = curva(y + 2) - curva(y - 2);
    const reg = i < NC ? "c" : i < NC + NT ? "t" : "l";
    return { x, y, ang: (Math.atan2(dx, 4) * 180) / Math.PI, w: reg === "c" ? 40 : reg === "t" ? 54 : 70, h: reg === "c" ? 24 : reg === "t" ? 32 : 40, reg };
  });
  const yS = (acc + 1.3) * k, yC = (acc + 2.6 + 0.4) * k;
  const yDe = (i: number): number => { const a = clamp(i, 0, v.length - 1), i0 = Math.floor(a), i1 = Math.min(v.length - 1, i0 + 1); return lerp(v[i0].y, v[i1].y, a - i0); };
  const xDe = (i: number): number => { const a = clamp(i, 0, v.length - 1), i0 = Math.floor(a), i1 = Math.min(v.length - 1, i0 + 1); return lerp(v[i0].x, v[i1].x, a - i0); };
  return { v, sacro: { x: curva(yS), y: yS, h: 2.6 * k }, coccix: { x: curva(yC) + 6, y: yC }, yDe, xDe };
}
const REGCOL = { c: ME.sens, t: ME.verde, l: ME.oro } as const;

/**
 * Columna con médula. `resalta`: región enfatizada (c/t/l/s) · `medula` 0–1 = cuánto se dibuja la médula · `pares` 0–1 = nervios espinales · `cola` 0–1 = cola de caballo ·
 * `canal` 1 = dibuja el canal vertebral. `t` = tiempo para el brillo de las señales.
 */
export const Columna: React.FC<{ x: number; y: number; alto: number; s?: number; medula?: number; pares?: number; cola?: number; resalta?: "c" | "t" | "l" | "s" | null; t?: number; etiquetas?: boolean }> = ({ x, y, alto, s = 1, medula = 1, pares = 0, cola = 0, resalta = null, t = 0, etiquetas = false }) => {
  const g = React.useMemo(() => geoColumna(alto), [alto]);
  const iCono = 19.75;                                              // entre L1 (19) y L2 (20)
  const yTop = g.v[0].y - 6, yCono = g.yDe(iCono);
  const xc = (i: number): number => g.xDe(i) + 46;                  // la médula va por detrás de los cuerpos vertebrales
  const nMed = Math.round(60 * clamp(medula));
  const ptsMed = Array.from({ length: nMed + 1 }, (_, i) => { const idx = lerp(-0.4, iCono, i / 60); return `${xc(idx).toFixed(1)},${(idx < 0 ? yTop + (idx + 0.4) * 8 : g.yDe(idx)).toFixed(1)}`; });
  const pares31 = React.useMemo(() => {
    const lista: { x: number; y: number; reg: "c" | "t" | "l" | "s" | "co" }[] = [];
    const seg = (n: number, i0: number, i1: number, reg: "c" | "t" | "l" | "s" | "co") => { for (let k = 0; k < n; k++) { const idx = lerp(i0, i1, (k + 0.5) / n); lista.push({ x: xc(idx), y: g.yDe(idx), reg }); } };
    seg(8, -0.2, 6.6, "c"); seg(12, 7, 18.6, "t"); seg(5, 18.9, 19.7, "l"); seg(5, 19.7, 19.95, "s"); seg(1, 19.95, 20, "co");
    return lista;
  }, [g]);
  const nPares = Math.round(31 * clamp(pares));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* sacro y cóccix */}
      <path d={`M ${g.sacro.x - 38} ${g.sacro.y - g.sacro.h / 2} L ${g.sacro.x + 40} ${g.sacro.y - g.sacro.h / 2} L ${g.sacro.x + 16} ${g.sacro.y + g.sacro.h / 2} L ${g.sacro.x - 8} ${g.sacro.y + g.sacro.h / 2} Z`} fill={resalta === "s" ? "#C9B07A" : "#8A8A9A"} stroke="#2A2A38" strokeWidth={4} strokeLinejoin="round" opacity={0.9} />
      <path d={`M ${g.coccix.x - 10} ${g.coccix.y - 14} L ${g.coccix.x + 8} ${g.coccix.y - 14} L ${g.coccix.x} ${g.coccix.y + 20} Z`} fill="#8A8A9A" stroke="#2A2A38" strokeWidth={3} />
      {/* canal vertebral */}
      <path d={`M ${xc(-0.4) - 12} ${yTop} ${g.v.map((q, i) => `L ${xc(i) - 12} ${q.y}`).join(" ")} L ${xc(23.8) - 12} ${g.sacro.y + g.sacro.h * 0.2}`} fill="none" stroke="#2A3150" strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
      {/* vértebras */}
      {g.v.map((q, i) => {
        const act = resalta === q.reg;
        return (
          <g key={i} transform={`translate(${q.x} ${q.y}) rotate(${q.ang})`}>
            <path d={`M ${q.w / 2 - 4} -4 L ${q.w / 2 + 34} ${q.reg === "c" ? 6 : 14} L ${q.w / 2 - 4} 6 Z`} fill={act ? "#E8D8A8" : "#B8B8C8"} stroke="#2A2A38" strokeWidth={3} strokeLinejoin="round" />
            <rect x={-q.w / 2} y={-q.h / 2 + 1} width={q.w} height={q.h - 2} rx={8} fill={act ? "#EBD9A0" : "#CFCFDC"} stroke="#2A2A38" strokeWidth={3.5} />
            <rect x={-q.w / 2 + 4} y={-q.h / 2 + 5} width={q.w - 8} height={4} rx={2} fill="#fff" opacity={0.35} />
            {act && <rect x={-q.w / 2} y={-q.h / 2 + 1} width={q.w} height={q.h - 2} rx={8} fill={REGCOL[q.reg]} opacity={0.35} />}
          </g>
        );
      })}
      {/* cola de caballo */}
      {cola > 0 && Array.from({ length: 12 }, (_, i) => {
        const x0 = xc(iCono), x1 = g.sacro.x + 20 + (i - 5.5) * 3, y1 = g.sacro.y + g.sacro.h * 0.3, ycs = yCono + (y1 - yCono) * clamp(cola);
        return <path key={i} d={`M ${x0 + (i - 5.5) * 0.5} ${yCono} C ${x0 + (i - 5.5) * 4} ${yCono + 40} ${x1 + (i - 5.5) * 2 + 8 * Math.sin(t * 2 + i)} ${ycs - 60} ${x0 + (x1 - x0) * clamp(cola) + (i - 5.5) * 3} ${ycs}`} stroke="#E6EDFF" strokeWidth={3.4} fill="none" strokeLinecap="round" opacity={0.85} />;
      })}
      {/* médula */}
      <polyline points={ptsMed.join(" ")} fill="none" stroke={ME.blanca} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={ptsMed.join(" ")} fill="none" stroke={ME.cereb} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={0.45} />
      {medula > 0.95 && <circle cx={xc(iCono)} cy={yCono} r={11} fill={ME.blanca} stroke={ME.cereb} strokeWidth={3} />}
      {/* pares de nervios */}
      {pares31.slice(0, nPares).map((p, i) => (
        <line key={i} x1={p.x} y1={p.y} x2={p.x + 74} y2={p.y + (p.reg === "c" ? -10 : p.reg === "t" ? 12 : 22)} stroke={p.reg === "c" ? ME.sens : p.reg === "t" ? ME.verde : p.reg === "l" ? ME.oro : p.reg === "s" ? ME.mot : ME.cereb} strokeWidth={4} strokeLinecap="round" opacity={0.9} />
      ))}
      {etiquetas && ([["C", 3], ["T", 12.5], ["L", 21]] as [string, number][]).map(([n, i]) => <text key={n} x={g.xDe(i) - 70} y={g.yDe(i) + 10} textAnchor="end" fontFamily={MONOF} fontWeight={800} fontSize={34} fill={n === "C" ? ME.sens : n === "T" ? ME.verde : ME.oro}>{n}</text>)}
    </g>
  );
};
/** coordenadas útiles de la columna (para colocar rótulos): devuelve y de la vértebra fraccional y x de la médula */
export const puntoColumna = (alto: number, i: number): { x: number; y: number } => { const g = geoColumna(alto); return { x: g.xDe(i) + 46, y: g.yDe(i) }; };

/* ───────────── corte transversal ───────────── */

const MARIPOSA = "M 0 -34 C 26 -70 64 -140 104 -176 C 128 -156 124 -104 98 -66 C 150 -50 196 -22 204 14 C 204 76 180 124 128 126 C 84 126 36 94 0 62 C -36 94 -84 126 -128 126 C -180 124 -204 76 -204 14 C -196 -22 -150 -50 -98 -66 C -124 -104 -128 -156 -104 -176 C -64 -140 -26 -70 0 -34 Z";
/** Corte transversal de la médula. Origen = centro; ancho ≈ 520·s. `gris`/`blanca` = énfasis 0–1; `t` anima los pulsos. */
export const Corte: React.FC<{ x: number; y: number; s?: number; gris?: number; blanca?: number; raices?: number; pulsos?: number; vias?: number; t?: number }> = ({ x, y, s = 1, gris = 0.5, blanca = 0.5, raices = 1, pulsos = 0, vias = 0, t = 0 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <radialGradient id={`${uid}w`} cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="#F4F7FF" /><stop offset="1" stopColor="#B8C6E8" /></radialGradient>
        <radialGradient id={`${uid}g`} cx="50%" cy="45%" r="65%"><stop offset="0" stopColor="#A9BAE0" /><stop offset="1" stopColor="#6F85B8" /></radialGradient>
      </defs>
      {/* sustancia blanca */}
      <ellipse cx={0} cy={0} rx={270} ry={214} fill={`url(#${uid}w)`} stroke={mezclar("#6F85B8", ME.oro, blanca)} strokeWidth={6 + 8 * blanca} />
      {/* vías: ascendentes (sensitivas, azules) y descendentes (motoras, naranjas) */}
      {vias > 0 && [[-210, -60], [-170, 70], [-214, 10], [210, 10], [172, 70], [210, -60]].map(([vx, vy], i) => {
        const sube = i % 2 === 0, u = ((t * 0.9 + i / 6) % 1), yy = sube ? vy + 50 - u * 100 : vy - 50 + u * 100;
        return <g key={i} opacity={vias}><rect x={vx - 22} y={vy - 56} width={44} height={112} rx={20} fill={sube ? ME.sens : ME.mot} opacity={0.28} /><circle cx={vx} cy={yy} r={9} fill={sube ? ME.sens : ME.mot} /></g>;
      })}
      <path d={MARIPOSA} fill={`url(#${uid}g)`} stroke={mezclar("#44598A", ME.sens, gris)} strokeWidth={5 + 8 * gris} strokeLinejoin="round" />
      <path d={MARIPOSA} fill="none" stroke="#fff" strokeOpacity={0.35 * gris} strokeWidth={14} strokeLinejoin="round" />
      <circle cx={0} cy={0} r={12} fill="#1B2440" stroke="#fff" strokeOpacity={0.6} strokeWidth={3} />
      {/* pulsos que se procesan en la sustancia gris */}
      {pulsos > 0 && Array.from({ length: 10 }, (_, i) => { const u = ((t * 0.7 + i / 10) % 1), an = azar(i * 3.7) * Math.PI * 2, r = 30 + azar(i * 5.1) * 100; return <circle key={i} cx={Math.cos(an) * r * (0.4 + 0.6 * u)} cy={Math.sin(an) * r * 0.9 * (0.4 + 0.6 * u)} r={7} fill={i % 2 ? ME.sens : ME.mot} opacity={pulsos * (1 - Math.abs(u - 0.5) * 1.4)} />; })}
      {/* raíces: dorsal (sensitiva) con ganglio y ventral (motora) */}
      <g opacity={raices}>
        <path d="M 104 -176 C 130 -230 190 -250 250 -262" stroke={ME.sens} strokeWidth={14} fill="none" strokeLinecap="round" /><circle cx={190} cy={-246} r={22} fill={ME.sens} stroke="#fff" strokeWidth={4} />
        <path d="M 128 126 C 160 190 230 230 290 250" stroke={ME.mot} strokeWidth={14} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
};

/* ───────────── axón ───────────── */

/** Axón horizontal con mielina. `u` = avance del impulso (0–1, se repite); `n` = segmentos. Origen = izquierda-centro. */
export const Axon: React.FC<{ x: number; y: number; largo: number; n?: number; u: number; mielina?: number; color?: string; grosor?: number }> = ({ x, y, largo, n = 6, u, mielina = 1, color = ME.oro, grosor = 1 }) => {
  const seg = largo / n, gap = 22;
  const pos = u * n, k = Math.floor(pos), f = pos - k;
  const salto = mielina > 0.5 ? easeOut(clamp(f / 0.35)) : f;
  const px = mielina > 0.5 ? (k + salto) * seg : pos * seg;
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1={-30} y1={0} x2={largo + 30} y2={0} stroke="#C8D4F0" strokeWidth={8 * grosor} strokeLinecap="round" />
      {Array.from({ length: n }, (_, i) => (
        <g key={i} opacity={mielina}><rect x={i * seg + gap / 2} y={-34 * grosor} width={seg - gap} height={68 * grosor} rx={28 * grosor} fill="#E8D49A" stroke="#8A6A22" strokeWidth={4} /><rect x={i * seg + gap / 2 + 10} y={-26 * grosor} width={seg - gap - 20} height={10} rx={5} fill="#fff" opacity={0.4} /></g>
      ))}
      <circle cx={px} cy={0} r={30 * grosor} fill={color} opacity={0.25} /><circle cx={px} cy={0} r={13 * grosor} fill={color} stroke="#fff" strokeWidth={3} />
    </g>
  );
};

/* ───────────── cuerpo ───────────── */

/** Silueta humana de frente. Zonas: `brazos`, `tronco`, `piernas` (1 = conectado, 0 = desconectado). Origen = centro de la cabeza; alto ≈ 640·s. */
export const Cuerpo: React.FC<{ x: number; y: number; s?: number; brazos?: number; tronco?: number; piernas?: number; paso?: number; muletas?: number }> = ({ x, y, s = 1, brazos = 1, tronco = 1, piernas = 1, paso = 0, muletas = 0 }) => {
  const col = (k: number): string => mezclar("#4A5470", "#9CB8FF", clamp(k));
  const sw = Math.sin(paso * 6.283);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g stroke={col(brazos)} strokeWidth={34} strokeLinecap="round" fill="none">
        <path d={`M -80 70 L ${-130 - 10 * sw * muletas} 190 L ${-120 - 20 * sw * muletas} 300`} /><path d={`M 80 70 L ${130 + 10 * sw * muletas} 190 L ${120 + 20 * sw * muletas} 300`} />
      </g>
      <rect x={-70} y={52} width={140} height={230} rx={46} fill={col(tronco)} />
      <g stroke={col(piernas)} strokeWidth={46} strokeLinecap="round" fill="none">
        <path d={`M -34 280 L ${-44 + 26 * sw} 450 L ${-46 + 34 * sw} 600`} /><path d={`M 34 280 L ${44 - 26 * sw} 450 L ${46 - 34 * sw} 600`} />
      </g>
      <circle cx={0} cy={0} r={46} fill={col(brazos)} />
      {muletas > 0 && <g stroke="#C8D2E0" strokeWidth={9} strokeLinecap="round" opacity={muletas}><path d={`M -150 220 L ${-190 - 20 * sw} 610`} /><path d={`M 150 220 L ${190 + 20 * sw} 610`} /></g>}
    </g>
  );
};

/* ───────────── barra de partes del sistema ───────────── */

const PARTES = ["CEREBRO", "MÉDULA", "NERVIOS", "MÚSCULO"];
/** Barra de partes: `activo` = índice (0–3) resaltado; `prog` 0–1 dentro del tramo. */
export const LineaN: React.FC<{ y?: number; activo: number; prog?: number; opacidad?: number }> = ({ y = 1420, activo, prog = 0, opacidad = 1 }) => {
  const X0 = 170, X1 = 910, dx = (X1 - X0) / (PARTES.length - 1), p = X0 + (activo + clamp(prog)) * dx;
  return (
    <g opacity={opacidad}>
      <line x1={X0} y1={y} x2={X1} y2={y} stroke="#BFE0FF" strokeOpacity={0.25} strokeWidth={6} strokeLinecap="round" />
      <line x1={X0} y1={y} x2={Math.min(X1, p)} y2={y} stroke={ME.sens} strokeWidth={6} strokeLinecap="round" />
      {PARTES.map((n, i) => {
        const a = i === activo, h = i < activo;
        return (
          <g key={n} transform={`translate(${X0 + i * dx} ${y})`}>
            <circle r={a ? 17 : 11} fill={a ? ME.sens : h ? "#1F5AA8" : "#0B1220"} stroke={a ? "#fff" : "#BFE0FF"} strokeOpacity={a ? 1 : 0.5} strokeWidth={a ? 4 : 3} />
            {a && <circle r={30} fill="none" stroke={ME.sens} strokeWidth={3} opacity={0.4} />}
            <text x={0} y={52} textAnchor="middle" fontFamily={MONOF} fontWeight={a ? 800 : 600} fontSize={20} fill={a ? "#fff" : "#BFE0FF"} opacity={a ? 1 : 0.65}>{n}</text>
          </g>
        );
      })}
      <circle cx={Math.min(X1, p)} cy={y} r={9} fill="#fff" />
    </g>
  );
};
