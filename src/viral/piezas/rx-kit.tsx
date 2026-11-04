/**
 * Kit del video «La noche que Röntgen vio a través de la piel» (SINAPSIS · historia de la medicina): laboratorio oscuro de 1895 y pantalla fluorescente, todo en vectores y determinista.
 *   Mano           esqueleto de la mano (carpo, metacarpianos, falanges, radio y cúbito) con la carne alrededor; modo «pantalla» (sombra sobre fondo verde) o «placa» (huesos claros sobre negro); anillo y aguja opcionales
 *   TuboCrookes    ampolla de vidrio con cátodo, ánodo y rayos catódicos; el cartón negro baja y la tapa
 *   Pantalla       tarjeta con platinocianuro de bario que brilla en verde-amarillo, con contenido recortado dentro
 *   Rayos          líneas de puntos que viajan del tubo a la pantalla (rayos invisibles, dibujados)
 *   Linea          línea de tiempo (nov 1895 · 22 dic · 28 dic · ene 1896 · 1901 · hoy)
 * Color: verde fósforo = pantalla · azul = rayos y vidrio · oro = fechas y datos · hueso = placa.
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { clamp, easeOut, lerp, mezclar } from "../comun";
import { FONT, MONOF } from "./real-kit";
import { rebote, sua } from "./jet-kit";

export const RX = {
  fondo: "#04070A",
  verde: "#7CFFB2",
  verdeOsc: "#0B5A33",
  amarillo: "#D8FF7A",
  azul: "#5AB8FF",
  oro: "#FFD166",
  hueso: "#EAF4FF",
  rojo: "#FF5A5F",
  hielo: "#BFE0FF",
  papel: "#E8DDC0",
} as const;
export { rebote, sua, clamp, lerp, mezclar, easeOut, FONT, MONOF, azar };

/* ───────────── mano ───────────── */

type Seg = { x1: number; y1: number; x2: number; y2: number; w: number };
type Dedo = { bx: number; by: number; ang: number; largos: number[]; w: number };
const DEDOS: Dedo[] = [
  { bx: -88, by: -196, ang: -9, largos: [74, 46, 36], w: 21 },   // índice
  { bx: -30, by: -210, ang: -1, largos: [82, 52, 38], w: 22 },   // medio
  { bx: 30, by: -200, ang: 7, largos: [76, 49, 36], w: 21 },     // anular
  { bx: 84, by: -176, ang: 16, largos: [60, 37, 30], w: 18 },    // meñique
];
const GEO = (() => {
  const huesos: Seg[] = [], juntas: { x: number; y: number; r: number }[] = [];
  const poner = (x1: number, y1: number, x2: number, y2: number, w: number) => { huesos.push({ x1, y1, x2, y2, w }); juntas.push({ x: x2, y: y2, r: w * 0.78 }); };
  const falanges: { dedo: number; i: number; seg: Seg }[] = [];
  DEDOS.forEach((d, k) => {
    poner(d.bx * 0.32, -78, d.bx, d.by, d.w - 2);                         // metacarpiano
    let x = d.bx, y = d.by, a = d.ang;
    d.largos.forEach((L, i) => {
      const r = (a * Math.PI) / 180, x2 = x + Math.sin(r) * L, y2 = y - Math.cos(r) * L, w = d.w - i * 3;
      poner(x, y, x2, y2, w); falanges.push({ dedo: k, i, seg: { x1: x, y1: y, x2, y2, w } });
      x = x2; y = y2; a += 3;
    });
  });
  poner(-30, -66, -108, -132, 22);                                         // metacarpiano del pulgar
  { let x = -108, y = -132, a = -52; [56, 42].forEach((L, i) => { const r = (a * Math.PI) / 180, x2 = x + Math.sin(r) * L, y2 = y - Math.cos(r) * L; poner(x, y, x2, y2, 22 - i * 3); x = x2; y = y2; a -= 4; }); }
  poner(-28, -30, -34, 320, 27);                                           // radio
  poner(30, -30, 36, 320, 22);                                             // cúbito
  const carpo = Array.from({ length: 8 }, (_, i) => ({ x: -42 + (i % 4) * 28 + (i > 3 ? 6 : 0), y: -64 + Math.floor(i / 4) * 30, r: 17 }));
  return { huesos, juntas, carpo, falanges };
})();

/**
 * Mano de frente (muñeca abajo). Origen = centro de la muñeca. `modo`: «pantalla» = huesos como sombra oscura sobre la pantalla verde; «placa» = huesos claros sobre negro.
 * `anillo` 0–1 = cuánto se destaca el anillo (en el anular); `aguja` 0–1 = cuánto se dibuja una aguja clavada.
 */
export const Mano: React.FC<{ x: number; y: number; s?: number; rot?: number; modo?: "pantalla" | "placa"; opacidad?: number; anillo?: number; aguja?: number; carne?: number; huesos?: number; piel?: string }> = ({ x, y, s = 1, rot = 0, modo = "pantalla", opacidad = 1, anillo = 0, aguja = 0, carne = 1, huesos = 1, piel }) => {
  const uid = useUid();
  const pant = modo === "pantalla";
  const colCarne = piel ?? (pant ? "#0C7A45" : "#6C8CB0"), opCarne = (piel ? 0.95 : pant ? 0.62 : 0.2) * carne;
  const colHueso = pant ? "#031A0D" : RX.hueso;
  const ani = DEDOS[2], fa = GEO.falanges.find((f) => f.dedo === 2 && f.i === 0)!.seg;
  const ax = lerp(fa.x1, fa.x2, 0.42), ay = lerp(fa.y1, fa.y2, 0.42);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={opacidad}>
      <defs><filter id={`${uid}b`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={pant ? 3 : 7} /></filter></defs>
      <g filter={`url(#${uid}b)`} opacity={opCarne}>
        {GEO.huesos.map((b, i) => <line key={i} x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke={colCarne} strokeWidth={b.w + 46} strokeLinecap="round" />)}
        <ellipse cx={-4} cy={-118} rx={134} ry={104} fill={colCarne} />
        <rect x={-48} y={-40} width={102} height={380} rx={40} fill={colCarne} />
      </g>
      <g stroke={colHueso} fill={colHueso} opacity={(pant ? 0.92 : 0.96) * huesos}>
        {GEO.huesos.map((b, i) => <line key={i} x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} strokeWidth={b.w} strokeLinecap="round" />)}
        {GEO.juntas.map((j, i) => <circle key={i} cx={j.x} cy={j.y} r={j.r} strokeWidth={0} />)}
        {GEO.carpo.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={c.r} strokeWidth={0} />)}
      </g>
      {anillo > 0 && (
        <g transform={`translate(${ax} ${ay}) rotate(${ani.ang})`} opacity={clamp(anillo * 3)}>
          <circle cx={0} cy={0} r={54 + 10 * Math.sin(anillo * 20)} fill={RX.oro} opacity={0.16 * anillo} />
          <rect x={-(ani.w + 13)} y={-8} width={2 * (ani.w + 13)} height={16} rx={7} fill={pant ? "#000" : "#fff"} stroke={RX.oro} strokeWidth={3} />
        </g>
      )}
      {aguja > 0 && (
        <g opacity={clamp(aguja * 3)}>
          <line x1={-176} y1={-262} x2={lerp(-176, -34, clamp(aguja))} y2={lerp(-262, -150, clamp(aguja))} stroke="#fff" strokeWidth={8} strokeLinecap="round" />
          <circle cx={-176} cy={-262} r={9} fill="none" stroke="#fff" strokeWidth={4} />
        </g>
      )}
    </g>
  );
};

/* ───────────── tubo de rayos catódicos ───────────── */

/** Ampolla de Crookes. `energia` 0–1 = brillo interior; `carton` 0–1 = cuánto la cubre el cartón negro (baja desde arriba). Origen = centro. */
export const TuboCrookes: React.FC<{ x: number; y: number; s?: number; t: number; energia?: number; carton?: number }> = ({ x, y, s = 1, t, energia = 0.8, carton = 0 }) => {
  const uid = useUid();
  const kc = easeOut(carton);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <radialGradient id={`${uid}v`} cx="45%" cy="40%" r="70%"><stop offset="0" stopColor="#CFE9FF" stopOpacity="0.55" /><stop offset="1" stopColor="#5A8AB8" stopOpacity="0.25" /></radialGradient>
        <radialGradient id={`${uid}g`} cx="50%" cy="50%" r="55%"><stop offset="0" stopColor="#7A6CFF" stopOpacity="0.8" /><stop offset="1" stopColor="#7A6CFF" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1B1B20" /><stop offset="1" stopColor="#050507" /></linearGradient>
      </defs>
      {/* cuellos y cables */}
      <rect x={-250} y={-18} width={120} height={36} rx={12} fill="#5A7A98" opacity={0.7} /><rect x={130} y={-18} width={120} height={36} rx={12} fill="#5A7A98" opacity={0.7} />
      <path d="M -250 0 C -300 0 -310 70 -330 90 M 250 0 C 300 0 310 70 330 90" stroke="#C98A4A" strokeWidth={6} fill="none" strokeLinecap="round" />
      {/* resplandor y ampolla */}
      <ellipse cx={0} cy={0} rx={210} ry={150} fill={`url(#${uid}g)`} opacity={energia * (0.55 + 0.25 * Math.sin(t * 17))} />
      <ellipse cx={0} cy={0} rx={150} ry={100} fill={`url(#${uid}v)`} stroke="#BFE0FF" strokeOpacity={0.7} strokeWidth={5} />
      <path d="M -84 -56 C -118 -20 -118 20 -84 56" stroke="#CFD8E8" strokeWidth={14} fill="none" strokeLinecap="round" />
      <path d="M 70 -48 L 104 -62 L 104 62 L 70 48 Z" fill="#CFD8E8" />
      {/* rayos catódicos: del cátodo al ánodo */}
      {Array.from({ length: 7 }, (_, i) => {
        const yy = -44 + i * 14.6, ph = (t * 2.4 + i * 0.37) % 1;
        return <line key={i} x1={-76} y1={yy * 0.7} x2={66} y2={yy * 0.9} stroke="#9EC8FF" strokeWidth={3} strokeDasharray="10 14" strokeDashoffset={-ph * 24 * 4} opacity={energia * (0.5 + 0.4 * Math.sin(t * 9 + i))} />;
      })}
      <ellipse cx={-30} cy={-34} rx={40} ry={9} fill="#fff" opacity={0.22} />
      {/* cartón negro */}
      <g transform={`translate(0 ${-(1 - kc) * 340})`} opacity={clamp(carton * 4)}>
        <rect x={-182} y={-130} width={364} height={260} rx={22} fill={`url(#${uid}c)`} stroke="#3A3A44" strokeWidth={4} />
        <rect x={-170} y={-120} width={340} height={14} rx={7} fill="#fff" opacity={0.06} />
      </g>
    </g>
  );
};

/* ───────────── pantalla fluorescente ───────────── */

/** Tarjeta recubierta que brilla (`brillo` 0–1). Origen = esquina superior izquierda del recuadro de `w`×`h`; el contenido (children) va recortado dentro. */
export const Pantalla: React.FC<{ x: number; y: number; w: number; h: number; brillo: number; rot?: number; children?: React.ReactNode; t?: number }> = ({ x, y, w, h, brillo, rot = 0, children, t = 0 }) => {
  const uid = useUid();
  const fl = brillo * (0.9 + 0.1 * Math.sin(t * 31) * Math.sin(t * 7));
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot} ${w / 2} ${h / 2})`}>
      <defs>
        <radialGradient id={`${uid}p`} cx="50%" cy="45%" r="75%"><stop offset="0" stopColor={mezclar("#10261A", "#E4FF9A", fl)} /><stop offset="0.7" stopColor={mezclar("#0A1A12", "#6CF09A", fl)} /><stop offset="1" stopColor={mezclar("#07110C", "#28B868", fl)} /></radialGradient>
        <filter id={`${uid}f`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="26" /></filter>
        <clipPath id={`${uid}k`}><rect x={0} y={0} width={w} height={h} rx={14} /></clipPath>
      </defs>
      <rect x={-18} y={-18} width={w + 36} height={h + 36} rx={30} fill="#7CFFB2" opacity={0.5 * fl} filter={`url(#${uid}f)`} />
      <rect x={-10} y={-10} width={w + 20} height={h + 20} rx={22} fill="#15171C" stroke="#3A3F4A" strokeWidth={4} />
      <rect x={0} y={0} width={w} height={h} rx={14} fill={`url(#${uid}p)`} />
      <g clipPath={`url(#${uid}k)`}>
        {children}
        {Array.from({ length: Math.floor(h / 9) }, (_, i) => <rect key={i} x={0} y={i * 9} width={w} height={2} fill="#000" opacity={0.08 * fl} />)}
        <rect x={0} y={((t * 90) % (h + 80)) - 40} width={w} height={40} fill="#fff" opacity={0.05 * fl} />
      </g>
    </g>
  );
};

/** Rayos invisibles del tubo a la pantalla: líneas de puntos que avanzan. */
export const Rayos: React.FC<{ x1: number; y1: number; x2: number; y2: number; t: number; opacidad?: number; n?: number; abierto?: number }> = ({ x1, y1, x2, y2, t, opacidad = 1, n = 6, abierto = 90 }) => (
  <g opacity={opacidad}>
    {Array.from({ length: n }, (_, i) => {
      const k = n === 1 ? 0.5 : i / (n - 1) - 0.5;
      return <line key={i} x1={x1} y1={y1 + k * 30} x2={x2} y2={y2 + k * abierto} stroke={RX.azul} strokeWidth={3} strokeDasharray="4 16" strokeDashoffset={-t * 90} strokeLinecap="round" opacity={0.5 + 0.3 * Math.sin(t * 6 + i)} />;
    })}
  </g>
);

/* ───────────── línea de tiempo ───────────── */

const HITOS = ["NOV 1895", "22 DIC", "28 DIC", "ENE 1896", "1901", "HOY"];
/** Línea de tiempo del video: `pos` 0–5 (parte entera = hito actual). */
export const Linea: React.FC<{ y?: number; pos: number; opacidad?: number }> = ({ y = 1405, pos, opacidad = 1 }) => {
  const X0 = 150, X1 = 930, dx = (X1 - X0) / (HITOS.length - 1), p = clamp(pos / (HITOS.length - 1)) * (X1 - X0) + X0;
  const act = Math.min(HITOS.length - 1, Math.floor(pos + 0.001));
  return (
    <g opacity={opacidad}>
      <line x1={X0} y1={y} x2={X1} y2={y} stroke="#BFE0FF" strokeOpacity={0.25} strokeWidth={6} strokeLinecap="round" />
      <line x1={X0} y1={y} x2={p} y2={y} stroke={RX.verde} strokeWidth={6} strokeLinecap="round" />
      {HITOS.map((n, i) => {
        const a = i === act, h = i < act;
        return (
          <g key={n} transform={`translate(${X0 + i * dx} ${y})`}>
            <circle r={a ? 17 : 11} fill={a ? RX.verde : h ? "#1C6A44" : "#0B1410"} stroke={a ? "#fff" : "#BFE0FF"} strokeOpacity={a ? 1 : 0.5} strokeWidth={a ? 4 : 3} />
            {a && <circle r={30} fill="none" stroke={RX.verde} strokeWidth={3} opacity={0.4} />}
            <text x={0} y={52} textAnchor="middle" fontFamily={MONOF} fontWeight={a ? 800 : 600} fontSize={19} fill={a ? "#fff" : "#BFE0FF"} opacity={a ? 1 : 0.65}>{n}</text>
          </g>
        );
      })}
      <circle cx={p} cy={y} r={9} fill="#fff" />
    </g>
  );
};
