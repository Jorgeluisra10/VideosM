/**
 * Kit del video «La dopamina NO es la molécula del placer» (carril B · SINAPSIS):
 *   Molecula   dopamina (C8H11NO2) como modelo de esferas y enlaces en 3D real (rotación, perspectiva, sombreado por profundidad)
 *   FilaPicos  registro de una neurona: línea base, ráfagas, caída, curva de tasa de disparo, señal (luz) y jugo
 */
import React from "react";
import { mulberry32 } from "../../anim/piezas";
import { useUid } from "../../estudio/util";
import { clamp } from "../comun";
import { MONOF } from "./real-kit";

export const DP = {
  carbono: "#566274",
  oxigeno: "#EF4444",
  nitrogeno: "#4C7DFF",
  hidrogeno: "#F1F5F9",
  enlace: "#9FB0C3",
  neurona: "#7C9BFF",
  neuronaClara: "#CFE0FF",
  ambar: "#FFB020",
  ambarClaro: "#FFE0A3",
  jugo: "#FF8A3D",
  jugoClaro: "#FFD1A3",
  rosa: "#FF7AB6",
  hielo: "#BFE0FF",
  rojo: "#FF4A3D",
  verde: "#34D399",
  luz: "#FFE66B",
} as const;

/* ───────────── molécula de dopamina ───────────── */

type At = { id: string; el: "C" | "O" | "N" | "H"; p: [number, number, number] };
const R = 95;
const ang = (g: number): [number, number] => [R * Math.cos((g * Math.PI) / 180), R * Math.sin((g * Math.PI) / 180)];
const C1 = ang(-30), C2 = ang(-90), C3 = ang(-150), C4 = ang(150), C5 = ang(90), C6 = ang(30);
const sal = (c: [number, number], d: number, z = 0): [number, number, number] => { const k = Math.hypot(c[0], c[1]); return [c[0] + (c[0] / k) * d, c[1] + (c[1] / k) * d, z]; };
const ATOMOS: At[] = [
  { id: "C1", el: "C", p: [...C1, 0] }, { id: "C2", el: "C", p: [...C2, 0] }, { id: "C3", el: "C", p: [...C3, 0] },
  { id: "C4", el: "C", p: [...C4, 0] }, { id: "C5", el: "C", p: [...C5, 0] }, { id: "C6", el: "C", p: [...C6, 0] },
  { id: "O3", el: "O", p: sal(C3, 78) }, { id: "O4", el: "O", p: sal(C4, 78) },
  { id: "HO3", el: "H", p: [sal(C3, 78)[0] - 36, sal(C3, 78)[1] - 28, 30] }, { id: "HO4", el: "H", p: [sal(C4, 78)[0] - 36, sal(C4, 78)[1] + 28, -30] },
  { id: "Ca", el: "C", p: [C1[0] + 70, C1[1] - 40, 38] }, { id: "Cb", el: "C", p: [C1[0] + 150, C1[1] + 6, -38] },
  { id: "N", el: "N", p: [C1[0] + 214, C1[1] - 52, 34] },
  { id: "H2", el: "H", p: sal(C2, 52) }, { id: "H5", el: "H", p: sal(C5, 52) }, { id: "H6", el: "H", p: sal(C6, 52) },
  { id: "Ha1", el: "H", p: [C1[0] + 64, C1[1] - 92, 80] }, { id: "Ha2", el: "H", p: [C1[0] + 112, C1[1] - 30, 80] },
  { id: "Hb1", el: "H", p: [C1[0] + 142, C1[1] + 58, -78] }, { id: "Hb2", el: "H", p: [C1[0] + 190, C1[1] + 2, -80] },
  { id: "Hn1", el: "H", p: [C1[0] + 272, C1[1] - 40, 70] }, { id: "Hn2", el: "H", p: [C1[0] + 222, C1[1] - 108, 12] },
];
const idx: Record<string, At> = Object.fromEntries(ATOMOS.map((a) => [a.id, a]));
const BONDS: [string, string, 1 | 2][] = [
  ["C1", "C2", 2], ["C2", "C3", 1], ["C3", "C4", 2], ["C4", "C5", 1], ["C5", "C6", 2], ["C6", "C1", 1],
  ["C3", "O3", 1], ["C4", "O4", 1], ["O3", "HO3", 1], ["O4", "HO4", 1],
  ["C1", "Ca", 1], ["Ca", "Cb", 1], ["Cb", "N", 1],
  ["C2", "H2", 1], ["C5", "H5", 1], ["C6", "H6", 1], ["Ca", "Ha1", 1], ["Ca", "Ha2", 1], ["Cb", "Hb1", 1], ["Cb", "Hb2", 1], ["N", "Hn1", 1], ["N", "Hn2", 1],
];
const RAD = { C: 27, O: 30, N: 30, H: 15 } as const;
const COL = { C: DP.carbono, O: DP.oxigeno, N: DP.nitrogeno, H: DP.hidrogeno } as const;
const CENTRO: [number, number, number] = [60, -20, 0];

/** Modelo de esferas y enlaces de la dopamina. `giro` = ángulo (grados) alrededor del eje vertical; `x, y` = centro; `s` = escala; `resalta` = id de átomo(s) con halo. */
export const Molecula: React.FC<{ x: number; y: number; s?: number; giro?: number; inclina?: number; opacidad?: number; halo?: number }> = ({ x, y, s = 1, giro = 0, inclina = -12, opacidad = 1, halo = 0 }) => {
  const uid = useUid();
  const a = (giro * Math.PI) / 180, b = (inclina * Math.PI) / 180;
  const proy = (p: [number, number, number]): { x: number; y: number; z: number; k: number } => {
    const px = p[0] - CENTRO[0], py = p[1] - CENTRO[1], pz = p[2] - CENTRO[2];
    const x1 = px * Math.cos(a) + pz * Math.sin(a), z1 = -px * Math.sin(a) + pz * Math.cos(a);
    const y2 = py * Math.cos(b) - z1 * Math.sin(b), z2 = py * Math.sin(b) + z1 * Math.cos(b);
    const k = 1 + z2 / 900;
    return { x: x1 * k, y: y2 * k, z: z2, k };
  };
  const P = Object.fromEntries(ATOMOS.map((at) => [at.id, proy(at.p)]));
  type Prim = { z: number; el: React.ReactNode };
  const prims: Prim[] = [];
  BONDS.forEach(([i, j, orden], n) => {
    const A = P[i], B = P[j];
    const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const w = (idx[i].el === "H" || idx[j].el === "H" ? 7 : 12) * ((A.k + B.k) / 2);
    const trazo = (off: number, ww: number, op = 1): React.ReactNode => (
      <line x1={A.x + nx * off} y1={A.y + ny * off} x2={B.x + nx * off} y2={B.y + ny * off} stroke={`url(#${uid}en)`} strokeWidth={ww} strokeLinecap="round" opacity={op} />
    );
    prims.push({
      z: (A.z + B.z) / 2 - 1,
      el: <g key={`b${n}`}>{orden === 2 ? <>{trazo(-6 * A.k, w * 0.55)}{trazo(6 * A.k, w * 0.55)}</> : trazo(0, w)}<line x1={A.x - nx * w * 0.2} y1={A.y - ny * w * 0.2} x2={B.x - nx * w * 0.2} y2={B.y - ny * w * 0.2} stroke="#fff" strokeOpacity={0.35} strokeWidth={w * 0.18} strokeLinecap="round" /></g>,
    });
  });
  ATOMOS.forEach((at) => {
    const q = P[at.id];
    const r = RAD[at.el] * q.k;
    const sombra = clamp(0.45 - q.z / 320, 0, 0.7);
    prims.push({
      z: q.z,
      el: (
        <g key={at.id} transform={`translate(${q.x} ${q.y})`}>
          {halo > 0 && (at.el === "O" || at.el === "N") && <circle r={r * 2.4} fill={COL[at.el]} opacity={0.22 * halo} />}
          <circle r={r} fill={`url(#${uid}${at.el})`} />
          <circle r={r} fill="#000" opacity={sombra * 0.5} />
          <ellipse cx={-r * 0.32} cy={-r * 0.38} rx={r * 0.3} ry={r * 0.18} fill="#fff" opacity={0.7} transform={`rotate(-30 ${-r * 0.32} ${-r * 0.38})`} />
        </g>
      ),
    });
  });
  prims.sort((m, n) => m.z - n.z);
  const grad = (id: string, c: string): React.ReactNode => (
    <radialGradient id={`${uid}${id}`} cx="35%" cy="30%" r="80%"><stop offset="0" stopColor="#fff" stopOpacity="0.9" /><stop offset="0.25" stopColor={c} /><stop offset="1" stopColor="#0B1220" stopOpacity="0.85" /></radialGradient>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
      <defs>
        <linearGradient id={`${uid}en`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#D4DEEA" /><stop offset="1" stopColor="#6C7C90" /></linearGradient>
        {grad("C", DP.carbono)}{grad("O", DP.oxigeno)}{grad("N", DP.nitrogeno)}{grad("H", DP.hidrogeno)}
      </defs>
      {prims.map((p) => p.el)}
    </g>
  );
};

/* ───────────── registro de una neurona ───────────── */

export type ModoFila = "A" | "B" | "C";
const U_LUZ = 0.3, U_JUGO = 0.66;
const g = (u: number, mu: number, sg: number): number => Math.exp(-((u - mu) ** 2) / (2 * sg * sg));
/** tasa de disparo normalizada (0–1) en el tiempo relativo u de la fila */
export const tasa = (u: number, modo: ModoFila): number => {
  let r = 0.14;
  if (modo === "A") r += 0.86 * g(u, U_JUGO + 0.015, 0.03);
  if (modo === "B") r += 0.86 * g(u, U_LUZ + 0.015, 0.03);
  if (modo === "C") { r += 0.86 * g(u, U_LUZ + 0.015, 0.03); r -= 0.14 * g(u, U_JUGO + 0.02, 0.035); }
  return Math.max(0, r);
};

const picosDe = (modo: ModoFila, semilla: number): number[] => {
  const r = mulberry32(semilla);
  const out: number[] = [];
  for (let i = 0; i < 18; i++) { const u = (i + r()) / 18; if (modo === "C" && Math.abs(u - (U_JUGO + 0.02)) < 0.07) continue; out.push(u); }
  const ev = modo === "A" ? [U_JUGO] : [U_LUZ];
  ev.forEach((e) => { for (let i = 0; i < 8; i++) out.push(e + 0.008 + i * 0.011 + (r() - 0.5) * 0.004); });
  return out.sort((m, n) => m - n);
};

export const FilaPicos: React.FC<{ x: number; y: number; w: number; h: number; modo: ModoFila; revela: number; semilla?: number; titulo: string; color?: string; mostrarJugo?: boolean }> = ({ x, y, w, h, modo, revela, semilla = 4, titulo, color = DP.neurona, mostrarJugo = true }) => {
  const uid = useUid();
  const picos = picosDe(modo, semilla);
  const base = y + h - 14;
  const alto = h * 0.5;
  const curva = Array.from({ length: 121 }, (_, i) => i / 120).filter((u) => u <= revela);
  const path = curva.length > 1 ? `M ${x} ${base} ` + curva.map((u) => `L ${x + u * w} ${base - 2 - tasa(u, modo) * (h * 0.42)}`).join(" ") + ` L ${x + curva[curva.length - 1] * w} ${base} Z` : "";
  const xl = x + U_LUZ * w, xj = x + U_JUGO * w;
  return (
    <g>
      <rect x={x - 20} y={y - 38} width={w + 40} height={h + 48} rx={24} fill="#08101E" stroke={color} strokeOpacity={0.4} strokeWidth={2} />
      <text x={x} y={y - 8} fontFamily={MONOF} fontWeight={700} fontSize={24} fill={DP.hielo}>{titulo}</text>
      <defs><linearGradient id={`${uid}a`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.55" /><stop offset="1" stopColor={color} stopOpacity="0.05" /></linearGradient></defs>
      <line x1={x} y1={base} x2={x + w} y2={base} stroke={DP.hielo} strokeOpacity={0.25} strokeWidth={2} />
      {path && <path d={path} fill={`url(#${uid}a)`} />}
      {curva.length > 1 && <path d={curva.map((u, i) => `${i ? "L" : "M"} ${x + u * w} ${base - 2 - tasa(u, modo) * (h * 0.42)}`).join(" ")} fill="none" stroke={color} strokeWidth={4} strokeLinejoin="round" />}
      {picos.filter((u) => u <= revela).map((u, i) => <line key={i} x1={x + u * w} y1={y + 16} x2={x + u * w} y2={y + 16 + alto * 0.55} stroke={DP.neuronaClara} strokeWidth={3} strokeLinecap="round" />)}
      {modo !== "A" && (
        <g transform={`translate(${xl} ${y + h * 0.18})`}>
          <circle r={14} fill={DP.luz} stroke="#fff" strokeWidth={2} />
          <circle r={26} fill={DP.luz} opacity={0.2} />
        </g>
      )}
      {mostrarJugo && (
        <g transform={`translate(${xj} ${y + h * 0.18})`} opacity={modo === "C" ? 0.55 : 1}>
          <path d="M 0 -18 C 14 2 14 16 0 16 C -14 16 -14 2 0 -18 Z" fill={modo === "C" ? "none" : DP.jugo} stroke={modo === "C" ? DP.rojo : DP.jugoClaro} strokeWidth={3} strokeDasharray={modo === "C" ? "5 4" : undefined} />
          {modo === "C" && <path d="M -9 -9 L 9 9 M 9 -9 L -9 9" stroke={DP.rojo} strokeWidth={4} strokeLinecap="round" />}
        </g>
      )}
      {revela > U_JUGO + 0.02 && modo === "C" && <text x={xj} y={y + h - 34} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={22} fill={DP.rojo}>caída</text>}
    </g>
  );
};
