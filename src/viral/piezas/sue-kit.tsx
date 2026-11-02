/**
 * Kit del video «Un día sin dormir» (SINAPSIS · medicina cotidiana): figuras tipo render, todo en vectores (SVG) y deterministas.
 *   Noche          cielo nocturno con estrellas, luna y bruma
 *   RelojPared     reloj de pared analógico con arco de horas despierto (cian → ámbar → rojo)
 *   Alcoholimetro  alcoholímetro de mano con pantalla, barra de LED y destello de alerta (ILUSTRACIÓN)
 *   DialBAC        dial semicircular de rendimiento equivalente a alcohol con zonas y límite legal
 *   Adenosina / Cafeina   moléculas dibujadas como estructura (anillos y átomos)
 *   CerebroSue     cerebro con degradado y surcos (vista lateral)
 *   Carretera      carretera nocturna vista desde el asiento del conductor, con perspectiva real
 *   Parpados       párpados que se cierran sobre la escena
 *   Pasillo        pasillo de hospital en perspectiva con luces de techo
 *   Eeg            trazo de electroencefalograma que se desplaza
 * Color: violeta = adenosina y sueño · ámbar = cafeína y precaución · rojo = alerta · cian = tiempo despierto · verde = normal.
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeOut, lerp, mezclar } from "../comun";
import { FONT, MONOF } from "./real-kit";
import { JK, rebote, sua } from "./jet-kit";

export const SU = {
  noche: "#070B22",
  violeta: "#8B6CFF",
  violetaClaro: "#C3B2FF",
  ambar: "#FFB547",
  cian: "#3DE0FF",
  rojo: "#FF4B4B",
  verde: "#3CFF8F",
  hielo: "#BFE0FF",
  blanco: "#F5F8FC",
} as const;
export { JK, rebote, sua, lerp, mezclar, clamp, easeOut };

/** formato es-CO con coma: 0.1 → «0,10» */
export const pct2 = (v: number): string => v.toFixed(2).replace(".", ",");

/* ───────────── noche ───────────── */

/** Cielo nocturno. `luna` 0–1 = opacidad de la luna; `bruma` 0–1 = niebla violeta abajo. */
export const Noche: React.FC<{ t: number; luna?: number; bruma?: number; tinte?: string; children?: React.ReactNode }> = ({ t, luna = 1, bruma = 0.7, tinte = "#1B1B58", children }) => {
  const uid = useUid();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: SU.noche }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`${uid}c`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#040619" /><stop offset="0.55" stopColor="#0B1243" /><stop offset="1" stopColor={tinte} /></linearGradient>
          <radialGradient id={`${uid}m`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#EAF0FF" stopOpacity="0.5" /><stop offset="0.35" stopColor="#9FB4FF" stopOpacity="0.18" /><stop offset="1" stopColor="#6E86FF" stopOpacity="0" /></radialGradient>
          <radialGradient id={`${uid}d`} cx="38%" cy="34%" r="75%"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.6" stopColor="#DCE6FF" /><stop offset="1" stopColor="#9DB0E6" /></radialGradient>
          <linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6A4DFF" stopOpacity="0" /><stop offset="1" stopColor="#6A4DFF" stopOpacity={0.35 * bruma} /></linearGradient>
          <radialGradient id={`${uid}v`} cx="50%" cy="46%" r="78%"><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.55" /></radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}c)`} />
        {Array.from({ length: 90 }, (_, i) => <circle key={i} cx={azar(i * 2.3) * W} cy={azar(i * 5.1 + 1) * H * 0.72} r={0.7 + azar(i * 7.7) * 1.7} fill="#fff" opacity={(0.25 + 0.6 * azar(i * 3.1)) * (0.65 + 0.35 * Math.sin(t * (1 + azar(i) * 2) + i))} />)}
        <g opacity={luna}>
          <circle cx={925} cy={185} r={190} fill={`url(#${uid}m)`} />
          <circle cx={925} cy={185} r={52} fill={`url(#${uid}d)`} />
          {[[910, 172, 9], [942, 198, 7], [918, 202, 6], [940, 168, 4]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#8FA2D8" opacity={0.4} />)}
        </g>
        <rect x={0} y={H * 0.5} width={W} height={H * 0.5} fill={`url(#${uid}b)`} />
        <rect width={W} height={H} fill={`url(#${uid}v)`} />
      </svg>
      {children}
    </div>
  );
};

/* ───────────── reloj de pared ───────────── */

/** Reloj de pared. `horas` = horas despierto (0–24+) desde las `inicio`:00; el arco de color marca el tiempo despierto. */
export const RelojPared: React.FC<{ x: number; y: number; r: number; horas: number; inicio?: number; arco?: boolean }> = ({ x, y, r, horas, inicio = 7, arco = true }) => {
  const uid = useUid();
  const total = inicio + horas;
  const aH = ((total % 12) / 12) * 360, aM = ((total % 1) * 360);
  const pol = (g: number, rr: number): [number, number] => [Math.cos(((g - 90) * Math.PI) / 180) * rr, Math.sin(((g - 90) * Math.PI) / 180) * rr];
  // el arco cuenta vueltas de 12 h: cada vuelta completa se dibuja como círculo lleno; lo que falta es el resto
  const frac = clamp(horas / 24);
  const col = frac < 0.5 ? mezclar(SU.cian, SU.ambar, frac / 0.5) : mezclar(SU.ambar, SU.rojo, (frac - 0.5) / 0.5);
  const Rr = r * 1.1, C = 2 * Math.PI * Rr;
  const vueltas = horas / 12;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id={`${uid}m`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#EDEFF3" /><stop offset="0.4" stopColor="#7C8794" /><stop offset="0.75" stopColor="#D1D7DE" /><stop offset="1" stopColor="#3C4651" /></linearGradient>
        <radialGradient id={`${uid}f`} cx="42%" cy="35%" r="80%"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.7" stopColor="#F0F2F6" /><stop offset="1" stopColor="#CBD2DC" /></radialGradient>
        <filter id={`${uid}g`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" /></filter>
      </defs>
      <ellipse cx={0} cy={r + 40} rx={r * 0.9} ry={r * 0.07} fill="#000" opacity={0.45} />
      {arco && horas > 0.05 && (
        <g transform="rotate(-90)">
          <circle r={Rr} fill="none" stroke={col} strokeWidth={14} strokeDasharray={`${Math.min(1, vueltas) * C} ${C}`} strokeLinecap="round" opacity={0.95} />
          <circle r={Rr} fill="none" stroke={col} strokeWidth={14} strokeDasharray={`${Math.min(1, vueltas) * C} ${C}`} filter={`url(#${uid}g)`} opacity={0.6} />
          {vueltas > 1 && <circle r={Rr + 18} fill="none" stroke={col} strokeWidth={8} strokeDasharray={`${Math.min(1, vueltas - 1) * 2 * Math.PI * (Rr + 18)} ${2 * Math.PI * (Rr + 18)}`} strokeLinecap="round" opacity={0.85} />}
        </g>
      )}
      <circle r={r} fill={`url(#${uid}m)`} />
      <circle r={r * 0.94} fill="#1B232D" />
      <circle r={r * 0.9} fill={`url(#${uid}f)`} />
      {Array.from({ length: 60 }, (_, i) => { const [x1, y1] = pol(i * 6, r * 0.86), [x2, y2] = pol(i * 6, r * (i % 5 === 0 ? 0.76 : 0.81)); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1F2933" strokeWidth={i % 5 === 0 ? r * 0.026 : r * 0.01} />; })}
      {Array.from({ length: 12 }, (_, i) => { const [nx, ny] = pol((i + 1) * 30, r * 0.62); return <text key={i} x={nx} y={ny + r * 0.07} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={r * 0.2} fill="#1F2933">{i + 1}</text>; })}
      <g transform={`rotate(${aH})`}><polygon points={`0,${-r * 0.5} ${r * 0.045},${r * 0.05} ${-r * 0.045},${r * 0.05}`} fill="#1F2933" /></g>
      <g transform={`rotate(${aM})`}><polygon points={`0,${-r * 0.76} ${r * 0.03},${r * 0.06} ${-r * 0.03},${r * 0.06}`} fill="#1F2933" /></g>
      <circle r={r * 0.06} fill="#C93A3A" />
      <path d={`M ${-r * 0.78} ${-r * 0.24} A ${r * 0.82} ${r * 0.82} 0 0 1 ${-r * 0.12} ${-r * 0.8}`} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={r * 0.05} strokeLinecap="round" />
    </g>
  );
};

/* ───────────── alcoholímetro ───────────── */

/** Color de una lectura de alcohol equivalente: verde bajo, ámbar medio, rojo sobre el límite legal (0,08). */
export const colorBAC = (v: number): string => (v < 0.03 ? SU.verde : v < 0.08 ? SU.ambar : SU.rojo);

/** Alcoholímetro de mano (ILUSTRACIÓN): `valor` en % (0–0,12). `w` = ancho del cuerpo. Origen = centro. */
export const Alcoholimetro: React.FC<{ x: number; y: number; w?: number; valor: number; t?: number; parpadeo?: number }> = ({ x, y, w = 250, valor, t = 0, parpadeo = 0 }) => {
  const uid = useUid();
  const h = w * 2.05;
  const col = colorBAC(valor);
  const leds = 12;
  const enc = Math.round((valor / 0.12) * leds);
  const flash = parpadeo > 0 ? 0.5 + 0.5 * Math.sin(t * 14) : 0;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1C232D" /><stop offset="0.3" stopColor="#4A5666" /><stop offset="0.55" stopColor="#2A323E" /><stop offset="1" stopColor="#10151C" /></linearGradient>
        <linearGradient id={`${uid}b`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#C7D0DA" /><stop offset="0.5" stopColor="#FFFFFF" /><stop offset="1" stopColor="#8E9AA8" /></linearGradient>
        <filter id={`${uid}g`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" /></filter>
      </defs>
      <ellipse cx={0} cy={h / 2 + 26} rx={w * 0.6} ry={16} fill="#000" opacity={0.5} />
      {parpadeo > 0 && <rect x={-w * 0.8} y={-h * 0.6} width={w * 1.6} height={h * 1.2} rx={60} fill={SU.rojo} opacity={0.22 * flash * parpadeo} filter={`url(#${uid}g)`} />}
      {/* boquilla */}
      <rect x={-w * 0.17} y={-h / 2 - w * 0.2} width={w * 0.34} height={w * 0.26} rx={w * 0.06} fill={`url(#${uid}b)`} stroke="#6C7886" strokeWidth={2} />
      <ellipse cx={0} cy={-h / 2 - w * 0.2} rx={w * 0.17} ry={w * 0.05} fill="#10151C" />
      {/* cuerpo */}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w * 0.22} fill={`url(#${uid}c)`} stroke="#6C7886" strokeWidth={3} />
      <path d={`M ${-w * 0.44} ${-h * 0.4} L ${-w * 0.44} ${h * 0.2}`} stroke="#fff" strokeOpacity={0.25} strokeWidth={5} strokeLinecap="round" />
      {/* pantalla */}
      <rect x={-w * 0.4} y={-h * 0.4} width={w * 0.8} height={h * 0.3} rx={w * 0.06} fill="#03070A" stroke="#3D4856" strokeWidth={2.5} />
      <rect x={-w * 0.4} y={-h * 0.4} width={w * 0.8} height={h * 0.3} rx={w * 0.06} fill={col} opacity={0.08} />
      <text x={0} y={-h * 0.27} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={w * 0.3} fill={col} filter={`url(#${uid}g)`} opacity={0.65}>{pct2(valor)}</text>
      <text x={0} y={-h * 0.27} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={w * 0.3} fill={col}>{pct2(valor)}</text>
      <text x={0} y={-h * 0.14} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={w * 0.09} fill="#9FB2C8" letterSpacing="0.08em">% EQUIV.</text>
      {/* barra de LED */}
      {Array.from({ length: leds }, (_, i) => {
        const on = i < enc;
        const c = i < 4 ? SU.verde : i < 8 ? SU.ambar : SU.rojo;
        return <rect key={i} x={-w * 0.36 + i * (w * 0.72) / leds} y={h * 0.02} width={(w * 0.72) / leds - 4} height={h * 0.09} rx={3} fill={on ? c : "#1C232D"} opacity={on ? 1 : 0.8} />;
      })}
      {/* botón */}
      <circle cx={0} cy={h * 0.3} r={w * 0.15} fill="#10151C" stroke="#6C7886" strokeWidth={3} />
      <circle cx={0} cy={h * 0.3} r={w * 0.1} fill={mezclar("#2B3440", col, 0.3)} />
      <text x={0} y={h / 2 + 70} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={22} fill="#D6E6F7" opacity={0.85} letterSpacing="0.1em">ILUSTRACIÓN</text>
    </g>
  );
};

/* ───────────── dial de rendimiento equivalente ───────────── */

/** Dial semicircular 0–0,12 % con zonas verde/ámbar/roja, marca del límite legal de EE. UU. (0,08) y aguja. Origen = centro del diámetro. */
export const DialBAC: React.FC<{ x: number; y: number; r: number; valor: number; max?: number; limite?: number; etiquetas?: boolean }> = ({ x, y, r, valor, max = 0.12, limite = 0.08, etiquetas = true }) => {
  const uid = useUid();
  const ang = (v: number): number => Math.PI + Math.PI * clamp(v / max);
  const P = (v: number, rr: number): [number, number] => [Math.cos(ang(v)) * rr, Math.sin(ang(v)) * rr];
  const arco = (v0: number, v1: number, rr: number): string => { const [x0, y0] = P(v0, rr), [x1, y1] = P(v1, rr); return `M ${x0} ${y0} A ${rr} ${rr} 0 0 1 ${x1} ${y1}`; };
  const [nx, ny] = P(valor, r * 0.82);
  const [lx, ly] = P(limite, r * 1.12);
  const col = colorBAC(valor);
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs><filter id={`${uid}g`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" /></filter></defs>
      <path d={arco(0, max, r)} fill="none" stroke="rgba(190,224,255,0.14)" strokeWidth={r * 0.17} strokeLinecap="butt" />
      <path d={arco(0, 0.03, r)} fill="none" stroke={SU.verde} strokeWidth={r * 0.17} opacity={0.9} />
      <path d={arco(0.03, limite, r)} fill="none" stroke={SU.ambar} strokeWidth={r * 0.17} opacity={0.9} />
      <path d={arco(limite, max, r)} fill="none" stroke={SU.rojo} strokeWidth={r * 0.17} opacity={0.95} />
      {Array.from({ length: 13 }, (_, i) => { const v = i * 0.01; const [x1, y1] = P(v, r * 0.88), [x2, y2] = P(v, r * (i % 2 === 0 ? 0.7 : 0.78)); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F2F5F8" strokeWidth={i % 2 === 0 ? 4 : 2} />; })}
      {etiquetas && [0, 0.04, 0.08, 0.12].map((v) => { const [tx, ty] = P(v, r * 0.56); return <text key={v} x={tx} y={ty + 10} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={r * 0.11} fill="#D6E6F7">{pct2(v)}</text>; })}
      {/* límite legal */}
      <line x1={P(limite, r * 0.7)[0]} y1={P(limite, r * 0.7)[1]} x2={lx} y2={ly} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
      {/* aguja */}
      <line x1={0} y1={0} x2={nx} y2={ny} stroke="#000" strokeOpacity={0.4} strokeWidth={12} strokeLinecap="round" transform="translate(3 5)" />
      <line x1={0} y1={0} x2={nx} y2={ny} stroke={col} strokeWidth={16} strokeLinecap="round" filter={`url(#${uid}g)`} opacity={0.7} />
      <line x1={0} y1={0} x2={nx} y2={ny} stroke="#fff" strokeWidth={9} strokeLinecap="round" />
      <circle r={r * 0.1} fill="#1B232D" stroke="#fff" strokeWidth={4} />
      <circle r={r * 0.04} fill={col} />
    </g>
  );
};

/* ───────────── moléculas ───────────── */

const hexPts = (r: number, rot = 0): [number, number][] => Array.from({ length: 6 }, (_, i) => [Math.cos(((i * 60 + rot) * Math.PI) / 180) * r, Math.sin(((i * 60 + rot) * Math.PI) / 180) * r] as [number, number]);
const poly = (p: [number, number][]): string => p.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");

/** Adenosina esquemática: anillo de purina (hexágono + pentágono) unido por un enlace a la ribosa (pentágono). `s` escala; origen = centro de la purina. */
export const Adenosina: React.FC<{ x: number; y: number; s?: number; rot?: number; color?: string; opacidad?: number; brillo?: number }> = ({ x, y, s = 1, rot = 0, color = SU.violeta, opacidad = 1, brillo = 0.6 }) => {
  const hex = hexPts(16, 0);
  const pent: [number, number][] = [[16, 0], [24, 14], [12, 26], [-2, 20], [-4, 4]].map(([a, b]) => [a + 6, b - 10] as [number, number]);
  const ribosa: [number, number][] = [[62, -12], [76, -2], [70, 14], [54, 14], [50, -2]];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={opacidad}>
      <circle r={44} fill={color} opacity={0.18 * brillo} />
      <polygon points={poly(hex)} fill={color} fillOpacity={0.32} stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <polygon points={poly(pent.map(([a, b]) => [a + 20, b + 8] as [number, number]))} fill={color} fillOpacity={0.22} stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <line x1={46} y1={10} x2={52} y2={0} stroke={color} strokeWidth={3} />
      <polygon points={poly(ribosa)} fill={color} fillOpacity={0.4} stroke={SU.violetaClaro} strokeWidth={3} strokeLinejoin="round" />
      {[[-8, -14], [8, -14], [-16, 0]].map(([a, b], i) => <circle key={i} cx={a} cy={b} r={3.6} fill="#fff" opacity={0.9} />)}
      <line x1={70} y1={14} x2={74} y2={30} stroke={SU.violetaClaro} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

/** Cafeína esquemática: purina con tres grupos metilo y dos oxígenos, en ámbar. */
export const Cafeina: React.FC<{ x: number; y: number; s?: number; rot?: number; opacidad?: number; brillo?: number }> = ({ x, y, s = 1, rot = 0, opacidad = 1, brillo = 0.7 }) => {
  const c = SU.ambar;
  const hex = hexPts(18, 0);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={opacidad}>
      <circle r={48} fill={c} opacity={0.2 * brillo} />
      <polygon points={poly(hex)} fill={c} fillOpacity={0.34} stroke={c} strokeWidth={3} strokeLinejoin="round" />
      <polygon points={poly([[18, -2], [34, -12], [44, 4], [32, 20], [16, 14]])} fill={c} fillOpacity={0.24} stroke={c} strokeWidth={3} strokeLinejoin="round" />
      {[[-30, -4, "#fff"], [0, -34, "#fff"], [48, -26, "#FFE2A6"]].map(([a, b, f], i) => <circle key={i} cx={a as number} cy={b as number} r={7} fill={f as string} opacity={0.95} />)}
      <circle cx={0} cy={30} r={6} fill="#FF7A6B" /><circle cx={-18} cy={-20} r={6} fill="#FF7A6B" />
      <line x1={-18} y1={-10} x2={-18} y2={-20} stroke="#FF7A6B" strokeWidth={3} /><line x1={0} y1={18} x2={0} y2={30} stroke="#FF7A6B" strokeWidth={3} />
    </g>
  );
};

/* ───────────── cerebro ───────────── */

export const CEREBRO = "M -330,40 C -350,-60 -300,-180 -190,-225 C -120,-262 -20,-262 50,-235 C 140,-262 250,-232 300,-150 C 350,-95 352,-10 322,48 C 340,110 290,175 220,178 C 190,230 110,236 70,196 C 10,236 -60,228 -90,188 C -160,214 -250,190 -270,130 C -330,118 -345,80 -330,40 Z";
export const CEREBELO = "M 120,160 C 150,118 275,118 305,172 C 285,236 160,246 120,160 Z";
const TRONCO = "M 26,186 C 16,250 28,300 22,344 L 76,344 C 80,292 86,240 92,196 Z";

/** Cerebro en vista lateral (origen = centro de la corteza, ancho ≈ 700 a escala 1). `tono` mezcla el rosado hacia violeta (sueño); `latido` 0–1 pulsa el brillo. */
export const CerebroSue: React.FC<{ x: number; y: number; s?: number; tono?: number; brillo?: number; children?: React.ReactNode }> = ({ x, y, s = 1, tono = 0, brillo = 0.5, children }) => {
  const uid = useUid();
  const a = mezclar("#F6C0C4", "#BBA8FF", tono), b = mezclar("#D27A8A", "#7C63E8", tono), c = mezclar("#8E3E58", "#3C2E8F", tono);
  const surcos = React.useMemo(() => Array.from({ length: 16 }, (_, i) => {
    const x0 = -300 + azar(i * 2.3) * 560, y0 = -200 + azar(i * 4.9) * 330;
    const pts = Array.from({ length: 5 }, (_, k) => `${(x0 + k * 38 + Math.sin(i * 3 + k * 1.9) * 26).toFixed(0)},${(y0 + Math.cos(i * 2 + k * 2.4) * 30 + k * 6).toFixed(0)}`);
    return `M ${pts[0]} C ${pts[1]} ${pts[2]} ${pts[3]} S ${pts[4]} ${pts[4]}`;
  }), []);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <radialGradient id={`${uid}b`} cx="42%" cy="34%" r="75%"><stop offset="0" stopColor={a} /><stop offset="0.55" stopColor={b} /><stop offset="1" stopColor={c} /></radialGradient>
        <radialGradient id={`${uid}h`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={mezclar(SU.cian, SU.violeta, tono)} stopOpacity={0.45 * brillo} /><stop offset="1" stopColor={SU.cian} stopOpacity="0" /></radialGradient>
        <clipPath id={`${uid}k`}><path d={CEREBRO} /></clipPath>
      </defs>
      <ellipse cx={0} cy={-10} rx={470} ry={330} fill={`url(#${uid}h)`} />
      <path d={TRONCO} fill={mezclar("#C9707F", "#6A55D0", tono)} stroke="#4A2147" strokeWidth={3} />
      <path d={CEREBELO} fill={mezclar("#B35E70", "#5B47C4", tono)} stroke="#4A2147" strokeWidth={3} />
      <path d={CEREBRO} fill={`url(#${uid}b)`} stroke="#4A1F42" strokeWidth={5} />
      <g clipPath={`url(#${uid}k)`}>
        {surcos.map((d, i) => <path key={i} d={d} fill="none" stroke="#4A1F42" strokeWidth={5} strokeLinecap="round" opacity={0.5} />)}
        {surcos.map((d, i) => <path key={`l${i}`} d={d} fill="none" stroke="#FFE0F4" strokeWidth={2.5} strokeLinecap="round" opacity={0.25} transform="translate(-4 -4)" />)}
        {children}
      </g>
    </g>
  );
};

/* ───────────── carretera nocturna ───────────── */

const VX = 540, VY = 880, KY = 6400, KX = 1540;

/** Carretera de noche vista desde el asiento del conductor. `dist` = metros recorridos (hace avanzar las rayas), `deriva` = desvío lateral en metros. */
export const Carretera: React.FC<{ dist: number; deriva?: number; t: number; luz?: number }> = ({ dist, deriva = 0, t, luz = 1 }) => {
  const uid = useUid();
  const px = (X: number, z: number): number => VX + ((X - deriva) * KX) / z;
  const py = (z: number): number => VY + KY / z;
  const Z0 = 5.6, Z1 = 320;
  const raya = (z0: number, z1: number, X: number, hw: number): string => `${px(X - hw, z0)},${py(z0)} ${px(X + hw, z0)},${py(z0)} ${px(X + hw, z1)},${py(z1)} ${px(X - hw, z1)},${py(z1)}`;
  const paso = 12;
  const off = dist % paso;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#03040E" /><stop offset="0.7" stopColor="#10163F" /><stop offset="1" stopColor="#3A2A6B" /></linearGradient>
        <linearGradient id={`${uid}r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1B2036" /><stop offset="1" stopColor="#07090F" /></linearGradient>
        <radialGradient id={`${uid}l`} cx="50%" cy="100%" r="80%"><stop offset="0" stopColor="#FFF1C9" stopOpacity={0.55 * luz} /><stop offset="0.5" stopColor="#FFE2A6" stopOpacity={0.15 * luz} /><stop offset="1" stopColor="#FFE2A6" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${uid}c`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFB86B" stopOpacity="0.8" /><stop offset="1" stopColor="#FFB86B" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width={W} height={VY} fill={`url(#${uid}s)`} />
      {Array.from({ length: 50 }, (_, i) => <circle key={i} cx={azar(i * 2.9) * W} cy={azar(i * 5.3) * VY * 0.85} r={0.8 + azar(i * 8.7) * 1.4} fill="#fff" opacity={0.3 + 0.5 * azar(i * 3.1)} />)}
      {/* resplandor de una ciudad lejana en el horizonte */}
      <ellipse cx={VX + 180 - deriva * 12} cy={VY} rx={420} ry={60} fill={`url(#${uid}c)`} />
      <rect x={0} y={VY} width={W} height={H - VY} fill="#05070C" />
      {/* calzada */}
      <polygon points={raya(Z0, Z1, 0, 3.6)} fill={`url(#${uid}r)`} />
      {/* bordes blancos y línea central amarilla discontinua */}
      <polygon points={raya(Z0, Z1, -3.4, 0.09)} fill="#EDEFF3" opacity={0.85} />
      <polygon points={raya(Z0, Z1, 3.4, 0.09)} fill="#EDEFF3" opacity={0.85} />
      {Array.from({ length: 26 }, (_, k) => {
        const z0 = k * paso - off + 2;
        if (z0 < Z0 || z0 > Z1) return null;
        const z1 = Math.min(Z1, z0 + 4);
        return <polygon key={k} points={raya(z0, z1, 0, 0.14)} fill="#FFD23F" opacity={clamp(1.6 - z0 / 200)} />;
      })}
      {/* postes reflectantes */}
      {Array.from({ length: 14 }, (_, k) => {
        const z = k * 30 - (dist % 30) + 8;
        if (z < Z0 || z > Z1) return null;
        const lado = k % 2 ? 1 : -1;
        const X = lado * 4.6;
        const alto = (1.1 * KX) / z;
        return (
          <g key={k} opacity={clamp(1.5 - z / 240)}>
            <rect x={px(X, z) - alto * 0.06} y={py(z) - alto} width={alto * 0.12} height={alto} fill="#C9CED8" />
            <rect x={px(X, z) - alto * 0.07} y={py(z) - alto * 0.9} width={alto * 0.14} height={alto * 0.2} fill="#FF4B4B" />
            <circle cx={px(X, z)} cy={py(z) - alto * 0.8} r={Math.max(2, alto * 0.25)} fill="#FF4B4B" opacity={0.25} />
          </g>
        );
      })}
      {/* conos de los faros */}
      <polygon points={`${VX - 120},${VY} ${VX + 120},${VY} ${VX + 1100},${H} ${VX - 1100},${H}`} fill={`url(#${uid}l)`} />
    </svg>
  );
};

/** Párpados que se cierran: `k` 0 (abiertos) → 1 (cerrados). Cubre toda la pantalla; el borde tiene pestañas y un resplandor rojizo. */
export const Parpados: React.FC<{ k: number }> = ({ k }) => {
  const uid = useUid();
  const kk = clamp(k);
  if (kk <= 0.005) return null;
  const mitad = H / 2;
  const yT = kk * mitad, yB = H - kk * mitad;
  const curva = 220 * (1 - kk * 0.3);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <linearGradient id={`${uid}t`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0A0404" /><stop offset="0.8" stopColor="#2A0F0C" /><stop offset="1" stopColor="#4A1B15" /></linearGradient>
        <linearGradient id={`${uid}b`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#0A0404" /><stop offset="0.8" stopColor="#2A0F0C" /><stop offset="1" stopColor="#4A1B15" /></linearGradient>
        <radialGradient id={`${uid}r`} cx="50%" cy="50%" r="60%"><stop offset="0" stopColor="#7A1E14" stopOpacity={0.55 * kk} /><stop offset="1" stopColor="#1A0605" stopOpacity={0.9 * kk} /></radialGradient>
      </defs>
      <path d={`M 0 0 L ${W} 0 L ${W} ${yT} Q ${W / 2} ${yT + curva} 0 ${yT} Z`} fill={`url(#${uid}t)`} />
      <path d={`M 0 ${H} L ${W} ${H} L ${W} ${yB} Q ${W / 2} ${yB - curva * 0.7} 0 ${yB} Z`} fill={`url(#${uid}b)`} />
      <path d={`M 0 ${yT} Q ${W / 2} ${yT + curva} ${W} ${yT}`} fill="none" stroke="#120504" strokeWidth={9} />
      <path d={`M 0 ${yB} Q ${W / 2} ${yB - curva * 0.7} ${W} ${yB}`} fill="none" stroke="#120504" strokeWidth={9} />
      {kk > 0.9 && <rect width={W} height={H} fill={`url(#${uid}r)`} />}
    </svg>
  );
};

/* ───────────── pasillo de hospital ───────────── */

/** Pasillo de hospital en perspectiva; `t` hace avanzar las luces del techo hacia el espectador. Color base verde azulado frío. */
export const Pasillo: React.FC<{ t: number; ritmo?: number; children?: React.ReactNode }> = ({ t, ritmo = 1, children }) => {
  const uid = useUid();
  const cx = 540, cy = 860;
  const lad = 1000, techo = -170, piso = 420;
  const proy = (X: number, Y: number, z: number): [number, number] => [cx + (X * 900) / z, cy + (Y * 900) / z];
  const fase = (t * ritmo * 0.7) % 1;
  const luces = Array.from({ length: 9 }, (_, i) => 1.6 + (i - fase) * 1.35).filter((z) => z > 1.3);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#06121B" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`${uid}p`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8FB5C4" /><stop offset="1" stopColor="#1B3442" /></linearGradient>
          <linearGradient id={`${uid}w`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#0B2A33" /><stop offset="1" stopColor="#2D6A78" /></linearGradient>
          <linearGradient id={`${uid}t`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0B1B26" /><stop offset="1" stopColor="#3F6E80" /></linearGradient>
          <radialGradient id={`${uid}v`} cx="50%" cy="46%" r="78%"><stop offset="0.5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.7" /></radialGradient>
          <filter id={`${uid}b`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter>
        </defs>
        <rect width={W} height={H} fill="#06121B" />
        {/* suelo, techo y paredes hacia el punto de fuga */}
        <polygon points={`0,${H} ${W},${H} ${cx + 90},${cy + 30} ${cx - 90},${cy + 30}`} fill={`url(#${uid}p)`} />
        <polygon points={`0,0 ${W},0 ${cx + 90},${cy - 30} ${cx - 90},${cy - 30}`} fill={`url(#${uid}t)`} />
        <polygon points={`0,0 ${cx - 90},${cy - 30} ${cx - 90},${cy + 30} 0,${H}`} fill={`url(#${uid}w)`} />
        <polygon points={`${W},0 ${cx + 90},${cy - 30} ${cx + 90},${cy + 30} ${W},${H}`} fill={`url(#${uid}w)`} transform={`translate(${W} 0) scale(-1 1) translate(${-W} 0)`} opacity={0.9} />
        {/* puertas en las paredes */}
        {[0, 1, 2, 3].map((i) => {
          const z = 2.4 + (i - fase) * 2.2;
          if (z < 1.3) return null;
          const [xa, ya] = proy(-lad / 900 * 0.5, techo / 900 * 1.2, z);
          const [xb, yb] = proy(-lad / 900 * 0.5, piso / 900 * 1.2, z);
          const w = 1500 / z;
          return (
            <g key={i} opacity={0.9}>
              <polygon points={`${xa},${ya} ${xa - w * 0.7},${ya - 20} ${xb - w * 0.7},${yb + 20} ${xb},${yb}`} fill="#0A1E26" stroke="#4A8FA0" strokeWidth={2} opacity={0.6} />
            </g>
          );
        })}
        {/* luces de techo */}
        {luces.map((z, i) => {
          const [xa, ya] = proy(-0.55, -1.15, z), [xb, yb] = proy(0.55, -1.15, z);
          const h = 60 / z;
          const vis = clamp((ya - 560) / 140);
          if (vis <= 0.02) return null;
          return (
            <g key={i} opacity={vis}>
              <rect x={xa} y={ya - h / 2} width={xb - xa} height={h} rx={h / 2} fill="#EAFBFF" opacity={clamp(1.2 - z / 12)} />
              <rect x={xa} y={ya - h / 2} width={xb - xa} height={h} rx={h / 2} fill="#BDEFFF" opacity={0.5 * clamp(1.2 - z / 12)} filter={`url(#${uid}b)`} />
              <ellipse cx={(xa + xb) / 2} cy={proy(0, 0.75, z)[1]} rx={(xb - xa) * 0.65} ry={Math.max(3, h * 1.2)} fill="#CFF6FF" opacity={0.18 * clamp(1.2 - z / 12)} filter={`url(#${uid}b)`} />
            </g>
          );
        })}
        <rect width={W} height={H} fill={`url(#${uid}v)`} />
      </svg>
      {children}
    </div>
  );
};

/* ───────────── EEG ───────────── */

/** Trazo de electroencefalograma que se desplaza: suma de senos con amplitud `amp` y frecuencia base `frec` (Hz). */
export const Eeg: React.FC<{ x: number; y: number; w: number; t: number; amp: number; frec: number; color?: string; grosor?: number; n?: number }> = ({ x, y, w, t, amp, frec, color = SU.cian, grosor = 4, n = 160 }) => {
  const pts = Array.from({ length: n }, (_, i) => {
    const u = i / (n - 1);
    const tt = t - (1 - u) * 1.6;
    const v = Math.sin(tt * frec * Math.PI * 2) * 0.7 + Math.sin(tt * frec * 2.7 * Math.PI * 2 + 1.3) * 0.25 + Math.sin(tt * frec * 5.1 * Math.PI * 2 + 0.4) * 0.12;
    return `${(x + u * w).toFixed(1)},${(y - v * amp * Math.sin(Math.PI * Math.min(1, u * 1.15))).toFixed(1)}`;
  }).join(" ");
  return (
    <g>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={grosor + 6} strokeLinejoin="round" strokeLinecap="round" opacity={0.18} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={grosor} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
};
