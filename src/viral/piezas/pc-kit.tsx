/**
 * Kit del video «El par craneal 0» (SINAPSIS · neuroanatomía): anatomía vectorial esquemática sobre fondo oscuro, determinista.
 *   Cabeza     corte sagital de la cabeza (de perfil, mirando a la derecha): cerebro, bulbo olfatorio, lámina cribosa, cavidad nasal, hipotálamo,
 *              nervio olfatorio (azul), nervio terminal = par 0 (menta, un plexo de fibras finas) y neuronas con GnRH (doradas) que migran por su ruta
 *   Tiburon    silueta de tiburón con el nervio terminal en el hocico
 *   VistaInf   vista inferior esquemática del cerebro con los pares craneales 0, I, II… colocados de delante hacia atrás
 *   LineaP     barra de recorrido (nariz · lámina cribosa · septo · hipotálamo)
 *   ParesHUD   regleta de los 13 pares (0, I… XII)
 * Color: menta = nervio terminal (0) · azul = nervio olfatorio (I) · dorado = GnRH · rosa = hipotálamo · violeta = cerebro.
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { useUid } from "../../estudio/util";
import { W, H, clamp, easeOut, lerp, mezclar } from "../comun";
import { ME, Ambiente, Chip, azar, sua, FONT, MONOF } from "./me-kit";

export { ME, Ambiente, Chip, azar, sua, FONT, MONOF, clamp, easeOut, lerp, mezclar };
export const PC = {
  nervio: "#6BF2C4",
  olfat: "#3FA9FF",
  gnrh: "#FFD166",
  hipo: "#FF8FD0",
  cereb: "#B78CFF",
  rojo: "#FF5A5F",
  hueso: "#C8D2E8",
} as const;

/* ───────────── cabeza (corte sagital) ───────────── */

const CRANEO = "M -230 -20 C -250 -200 -120 -290 20 -290 C 170 -290 260 -190 262 -70 C 264 -20 268 20 292 50 C 310 70 336 110 346 140 C 348 160 320 164 296 166 C 280 170 280 190 270 210 C 262 250 220 270 190 280 C 140 300 40 300 -40 270 C -150 240 -230 160 -230 -20 Z";
const CEREBRO = "M -170 -40 C -190 -180 -80 -250 40 -240 C 170 -235 240 -150 225 -50 C 220 -5 200 14 160 22 C 120 38 60 44 -10 44 C -90 44 -165 20 -170 -40 Z";
/** ruta del nervio terminal desde la mucosa nasal hasta el hipotálamo (coordenadas locales de la cabeza) */
export const RUTA: [number, number][] = [[272, 114], [258, 88], [236, 66], [216, 52], [192, 32], [165, 14], [140, 4], [116, 10], [96, 26]];
export const ptRuta = (u: number): [number, number] => {
  const k = clamp(u) * (RUTA.length - 1), i = Math.min(RUTA.length - 2, Math.floor(k)), f = k - i;
  return [lerp(RUTA[i][0], RUTA[i + 1][0], f), lerp(RUTA[i][1], RUTA[i + 1][1], f)];
};
const PLEXO = [
  "M 272 114 C 262 86 238 70 216 52 C 196 36 170 16 140 4",
  "M 268 118 C 254 90 232 76 220 54 C 200 40 176 22 138 8",
  "M 276 110 C 268 82 244 64 212 48 C 190 30 166 10 142 0",
];
/** punto de pantalla de un punto local de la cabeza */
export const pCab = (x: number, y: number, s: number, lx: number, ly: number): [number, number] => [x + s * lx, y + s * ly];

/**
 * Cabeza en corte sagital. Origen = centro; ancho ≈ 580·s. Parámetros 0–1:
 *   nervio  cuánto del nervio terminal (par 0) está dibujado · olfat  nervio olfatorio y bulbo · dots  avance de las neuronas GnRH (−1 = ocultas)
 *   rotura  1 = la ruta falla (fibras enredadas, ✗ en la lámina y neuronas atascadas en la nariz) · hipo  brillo del hipotálamo · pulso  brillo del nervio
 */
export type CabezaProps = { x: number; y: number; s?: number; nervio?: number; olfat?: number; dots?: number; rotura?: number; hipo?: number; pulso?: number; t?: number };
export const Cabeza: React.FC<CabezaProps> = ({ x, y, s = 1, nervio = 1, olfat = 0, dots = -1, rotura = 0, hipo = 0, pulso = 0, t = 0 }) => {
  const uid = useUid();
  const N = 14;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <radialGradient id={`${uid}h`} cx="40%" cy="35%" r="75%"><stop offset="0" stopColor="#1B2748" /><stop offset="1" stopColor="#0C1226" /></radialGradient>
        <filter id={`${uid}b`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      <path d={CRANEO} fill={`url(#${uid}h)`} stroke="#4A5C92" strokeWidth={5} strokeLinejoin="round" />
      {/* cavidad nasal */}
      <ellipse cx={252} cy={112} rx={66} ry={30} transform="rotate(22 252 112)" fill="#070B18" stroke="#3A4A7C" strokeWidth={3} />
      <path d="M 200 66 C 236 98 290 130 330 150" stroke="#3A4A7C" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.7} />
      {/* cerebro */}
      <path d={CEREBRO} fill="#251C44" stroke={PC.cereb} strokeWidth={4} strokeLinejoin="round" />
      <g fill="none" stroke={PC.cereb} strokeOpacity={0.3} strokeWidth={4} strokeLinecap="round"><path d="M -120 -60 C -90 -110 -50 -80 -30 -120" /><path d="M 10 -130 C 50 -90 100 -120 140 -70" /><path d="M -100 -10 C -60 -40 -20 -10 20 -40 C 60 -60 100 -30 150 -40" /></g>
      {/* hipotálamo */}
      <ellipse cx={96} cy={26} rx={30} ry={18} fill={mezclar("#3A2A44", PC.hipo, clamp(hipo))} stroke={PC.hipo} strokeWidth={3} strokeOpacity={0.55 + 0.45 * hipo} />
      {hipo > 0.2 && <circle cx={96} cy={26} r={46 + 8 * Math.sin(t * 5)} fill={PC.hipo} opacity={0.2 * hipo} filter={`url(#${uid}b)`} />}
      {/* lámina cribosa */}
      <rect x={168} y={48} width={96} height={10} rx={4} fill={PC.hueso} stroke="#5C6A90" strokeWidth={2} />
      {[184, 198, 212, 226, 240, 254].map((cx, i) => <circle key={i} cx={cx} cy={53} r={2.6} fill="#0C1226" />)}
      {/* nervio olfatorio + bulbo */}
      {olfat > 0 && (
        <g opacity={clamp(olfat * 2)}>
          {[190, 206, 222].map((cx, i) => <path key={i} d={`M ${cx + 46 - i * 6} ${122 - i * 3} C ${cx + 20} 100 ${cx + 4} 80 ${cx} ${53} L ${cx - 2 + i} ${34}`} stroke={PC.olfat} strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray="1 0" opacity={0.9} />)}
          <ellipse cx={205} cy={28} rx={36} ry={20} fill={PC.olfat} opacity={0.35 + 0.15 * Math.sin(t * 3)} stroke="#fff" strokeOpacity={0.5} strokeWidth={3} />
          <path d="M 170 26 C 130 30 90 30 50 26" stroke={PC.olfat} strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.8} />
        </g>
      )}
      {/* nervio terminal (par 0): plexo de fibras finas */}
      {rotura < 0.5 && nervio > 0 && (
        <g>
          {PLEXO.map((d, i) => <path key={i} d={d} pathLength={1} stroke={PC.nervio} strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.18 + 0.32 * pulso} filter={`url(#${uid}b)`} strokeDasharray={`${clamp(nervio)} 2`} />)}
          {PLEXO.map((d, i) => <path key={`n${i}`} d={d} pathLength={1} stroke={PC.nervio} strokeWidth={3.2} fill="none" strokeLinecap="round" strokeDasharray={`${clamp(nervio)} 2`} opacity={0.95} />)}
        </g>
      )}
      {rotura >= 0.5 && (
        <g>
          {/* fibras que se enredan antes de la lámina y no llegan */}
          {[0, 1, 2].map((i) => <path key={i} d={`M ${272 + i * 2} ${114 + i * 2} C ${262 - i * 4} 88 ${250 - i * 8} 78 ${240 - i * 6} ${70 + i * 3} c -14 -10 6 -22 -4 -8 c -8 12 10 8 2 -2`} stroke={PC.nervio} strokeWidth={3.2} fill="none" strokeLinecap="round" opacity={0.9} />)}
          <g transform="translate(216 52)"><circle r={20} fill="#3A0A14" stroke={PC.rojo} strokeWidth={5} /><path d="M -9 -9 L 9 9 M 9 -9 L -9 9" stroke="#fff" strokeWidth={5} strokeLinecap="round" /></g>
        </g>
      )}
      {/* neuronas con GnRH */}
      {dots >= 0 && Array.from({ length: N }, (_, i) => {
        const off = i / N, u0 = clamp(dots * 1.35 - off * 0.35);
        const atasco = rotura >= 0.5;
        const u = atasco ? Math.min(u0, 0.1 + 0.05 * azar(i * 3.3)) : u0;
        const [px, py] = ptRuta(u);
        const jx = atasco ? 6 * Math.sin(t * 4 + i * 1.7) : 3 * Math.sin(t * 3 + i), jy = atasco ? 5 * Math.cos(t * 3.4 + i) : 3 * Math.cos(t * 3 + i * 1.3);
        const vis = 1;
        return <g key={i} opacity={vis}><circle cx={px + jx} cy={py + jy} r={9} fill={PC.gnrh} opacity={0.3} /><circle cx={px + jx} cy={py + jy} r={4.6} fill={PC.gnrh} stroke="#fff" strokeWidth={1.4} /></g>;
      })}
    </g>
  );
};

/** Zoom sobre la región nariz–lámina cribosa–septo: la cabeza se agranda y su borde superior se difumina bajo el título (y ≈ 680). */
export const ZOOM = { x: 188, y: 898, s: 1.6 } as const;
export const pz = (lx: number, ly: number): [number, number] => pCab(ZOOM.x, ZOOM.y, ZOOM.s, lx, ly);
export const CabezaZoom: React.FC<Omit<CabezaProps, "x" | "y" | "s">> = (p) => {
  const uid = useUid();
  return (
    <>
      <defs>
        <linearGradient id={`${uid}m`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" /><stop offset="0.16" stopColor="#fff" /><stop offset="0.86" stopColor="#fff" /><stop offset="1" stopColor="#000" /></linearGradient>
        <mask id={`${uid}k`} maskUnits="userSpaceOnUse" x={0} y={680} width={W} height={680}><rect x={0} y={680} width={W} height={680} fill={`url(#${uid}m)`} /></mask>
      </defs>
      <g mask={`url(#${uid}k)`}><Cabeza {...p} x={ZOOM.x} y={ZOOM.y} s={ZOOM.s} /></g>
    </>
  );
};

/* ───────────── tiburón ───────────── */

/** Tiburón nadando hacia la derecha (hocico a la derecha). Origen = centro; largo ≈ 640·s. `nervio` 0–1 dibuja el nervio terminal junto al hocico. */
export const Tiburon: React.FC<{ x: number; y: number; s?: number; nervio?: number; t?: number; opacidad?: number }> = ({ x, y, s = 1, nervio = 0, t = 0, opacidad = 1 }) => {
  const uid = useUid();
  const ond = Math.sin(t * 2.2) * 6;
  return (
    <g transform={`translate(${x} ${y + ond}) scale(${s})`} opacity={opacidad}>
      <defs><linearGradient id={`${uid}c`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7F93BE" /><stop offset="0.55" stopColor="#5A6D99" /><stop offset="0.56" stopColor="#D8E2F4" /><stop offset="1" stopColor="#B7C6E6" /></linearGradient></defs>
      <path d={`M -250 0 L ${-340 + ond} -78 L ${-304 + ond * 0.6} -2 L ${-348 + ond} 70 Z`} fill="#5A6D99" stroke="#27324F" strokeWidth={4} strokeLinejoin="round" />
      <path d="M -20 -58 L 36 -134 L 66 -44 Z" fill="#5A6D99" stroke="#27324F" strokeWidth={4} strokeLinejoin="round" />
      <path d="M 50 52 L -22 128 L 100 60 Z" fill="#7F93BE" stroke="#27324F" strokeWidth={4} strokeLinejoin="round" />
      <path d="M -260 0 C -200 -62 -80 -84 40 -54 C 120 -34 210 -14 292 24 C 210 44 124 54 40 64 C -60 84 -170 72 -260 0 Z" fill={`url(#${uid}c)`} stroke="#27324F" strokeWidth={5} strokeLinejoin="round" />
      <g stroke="#27324F" strokeWidth={4} strokeLinecap="round" opacity={0.55}><path d="M 96 -34 C 102 -12 102 14 96 36" /><path d="M 116 -30 C 122 -10 122 12 116 32" /><path d="M 136 -26 C 142 -8 142 10 136 28" /></g>
      <circle cx={206} cy={-2} r={9} fill="#0A0F1F" /><circle cx={209} cy={-5} r={3} fill="#fff" />
      {nervio > 0 && (
        <g>
          <path d="M 268 16 C 246 6 222 -6 196 -12 C 170 -16 150 -14 130 -8" stroke={PC.nervio} strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.25} pathLength={1} strokeDasharray={`${clamp(nervio)} 2`} />
          <path d="M 268 16 C 246 6 222 -6 196 -12 C 170 -16 150 -14 130 -8" stroke={PC.nervio} strokeWidth={4.5} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${clamp(nervio)} 2`} />
          <circle cx={268} cy={16} r={7} fill={PC.nervio} opacity={clamp(nervio * 3)} />
        </g>
      )}
    </g>
  );
};

/* ───────────── vista inferior del cerebro ───────────── */

/** Pares craneales de la vista inferior: [número, x local, y local, lado]. Origen = centro del cerebro; y negativa = delante. */
const PARES_INF: [string, number, number][] = [
  ["III", 84, -78], ["IV", 112, -44], ["V", 138, -4], ["VI", 84, 14], ["VII", 118, 50], ["VIII", 150, 72], ["IX", 56, 108], ["X", 60, 146], ["XI", 52, 184], ["XII", 30, 220],
];
/**
 * Vista inferior esquemática del cerebro (el frente arriba). `c0` = aparición del par 0 · `c1` = bulbos olfatorios (I) · `c2` = quiasma (II) · `resto` = los demás pares (0–1) · `flecha` = flecha «delante».
 */
export const VistaInf: React.FC<{ x: number; y: number; s?: number; c0?: number; c1?: number; c2?: number; resto?: number; t?: number }> = ({ x, y, s = 1, c0 = 0, c1 = 0, c2 = 0, resto = 0, t = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M 0 -250 C 130 -250 210 -170 214 -30 C 216 90 150 170 70 196 L 56 300 L -56 300 L -70 196 C -150 170 -216 90 -214 -30 C -210 -170 -130 -250 0 -250 Z" fill="#251C44" stroke={PC.cereb} strokeWidth={5} strokeLinejoin="round" />
    <path d="M 0 -250 L 0 190" stroke={PC.cereb} strokeOpacity={0.35} strokeWidth={4} />
    <g fill="none" stroke={PC.cereb} strokeOpacity={0.25} strokeWidth={4} strokeLinecap="round"><path d="M -150 -60 C -120 -110 -80 -90 -60 -140" /><path d="M 150 -60 C 120 -110 80 -90 60 -140" /><path d="M -170 40 C -120 20 -90 70 -50 50" /><path d="M 170 40 C 120 20 90 70 50 50" /></g>
    {/* par 0: dos hilos finos, lo más adelantado */}
    {c0 > 0 && (
      <g opacity={clamp(c0 * 2)}>
        {[-1, 1].map((sd) => <path key={sd} d={`M ${sd * 12} -176 C ${sd * 18} -214 ${sd * 22} -244 ${sd * 18} -${268 * easeOut(c0)}`} stroke={PC.nervio} strokeWidth={4} fill="none" strokeLinecap="round" />)}
        {[-1, 1].map((sd) => <circle key={`g${sd}`} cx={sd * 18} cy={-268 * easeOut(c0)} r={9 + 3 * Math.sin(t * 6)} fill={PC.nervio} opacity={0.9} />)}
      </g>
    )}
    {/* par I: bulbos olfatorios */}
    {c1 > 0 && (
      <g opacity={clamp(c1 * 2)}>
        {[-1, 1].map((sd) => <g key={sd}><ellipse cx={sd * 54} cy={-190 * easeOut(c1)} rx={30} ry={52} fill={PC.olfat} opacity={0.5} stroke="#fff" strokeOpacity={0.5} strokeWidth={3} /><path d={`M ${sd * 54} ${-150 * easeOut(c1)} L ${sd * 40} -60`} stroke={PC.olfat} strokeWidth={14} strokeLinecap="round" opacity={0.75} /></g>)}
      </g>
    )}
    {/* par II: quiasma óptico */}
    {c2 > 0 && <g opacity={clamp(c2 * 2)} stroke={PC.gnrh} strokeWidth={10} strokeLinecap="round" fill="none"><path d="M -46 -36 L 0 -4 L 46 -36" /><path d="M -30 34 L 0 -4 L 30 34" /></g>}
    {/* resto de los pares */}
    {PARES_INF.map(([n, px, py], i) => {
      const k = clamp(resto * 10 - i * 0.6);
      return k > 0 ? <g key={n} opacity={k}>{[-1, 1].map((sd) => <circle key={sd} cx={sd * px} cy={py} r={8} fill="#8B97B8" />)}<text x={px + 20} y={py + 8} fontFamily={MONOF} fontWeight={700} fontSize={22} fill="#C8D2E8" opacity={0.85}>{n}</text></g> : null;
    })}
  </g>
);

/* ───────────── barra de recorrido y regleta de pares ───────────── */

const NODOS = ["NARIZ", "LÁM. CRIBOSA", "SEPTO", "HIPOTÁLAMO"];
/** Barra de recorrido del nervio. `activo` = índice (0–3) · `prog` 0–1 dentro del tramo · `color` del tramo. */
export const LineaP: React.FC<{ y?: number; activo: number; prog?: number; opacidad?: number; color?: string }> = ({ y = 1420, activo, prog = 0, opacidad = 1, color = PC.nervio }) => {
  const X0 = 170, X1 = 910, dx = (X1 - X0) / (NODOS.length - 1), p = X0 + (activo + clamp(prog)) * dx;
  return (
    <g opacity={opacidad}>
      <line x1={X0} y1={y} x2={X1} y2={y} stroke="#BFE0FF" strokeOpacity={0.25} strokeWidth={6} strokeLinecap="round" />
      <line x1={X0} y1={y} x2={Math.min(X1, p)} y2={y} stroke={color} strokeWidth={6} strokeLinecap="round" />
      {NODOS.map((n, i) => {
        const a = i === activo, h = i < activo;
        return (
          <g key={n} transform={`translate(${X0 + i * dx} ${y})`}>
            <circle r={a ? 17 : 11} fill={a ? color : h ? mezclar("#0B1220", color, 0.45) : "#0B1220"} stroke={a ? "#fff" : "#BFE0FF"} strokeOpacity={a ? 1 : 0.5} strokeWidth={a ? 4 : 3} />
            {a && <circle r={30} fill="none" stroke={color} strokeWidth={3} opacity={0.4} />}
            <text x={0} y={52} textAnchor="middle" fontFamily={MONOF} fontWeight={a ? 800 : 600} fontSize={20} fill={a ? "#fff" : "#BFE0FF"} opacity={a ? 1 : 0.65}>{n}</text>
          </g>
        );
      })}
      <circle cx={Math.min(X1, p)} cy={y} r={9} fill="#fff" />
    </g>
  );
};

export const ROMANOS = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
/** Regleta de los 13 pares craneales. `lit` = cuántos están encendidos (0–13) · `cero` resalta el 0 en menta. */
export const ParesHUD: React.FC<{ y?: number; lit?: number; cero?: number; opacidad?: number }> = ({ y = 1420, lit = 13, cero = 1, opacidad = 1 }) => {
  const X0 = 150, X1 = 930, dx = (X1 - X0) / 12;
  return (
    <g opacity={opacidad}>
      <line x1={X0} y1={y} x2={X1} y2={y} stroke="#BFE0FF" strokeOpacity={0.22} strokeWidth={5} strokeLinecap="round" />
      {ROMANOS.map((n, i) => {
        const on = i + 1 <= lit, es0 = i === 0;
        const col = es0 ? mezclar("#0B1220", PC.nervio, clamp(cero)) : on ? "#3FA9FF" : "#0B1220";
        return (
          <g key={n} transform={`translate(${X0 + i * dx} ${y})`}>
            <circle r={es0 ? 15 : 10} fill={col} stroke={es0 && cero > 0.5 ? "#fff" : "#BFE0FF"} strokeOpacity={es0 && cero > 0.5 ? 1 : 0.5} strokeWidth={es0 ? 4 : 3} />
            {es0 && cero > 0.5 && <circle r={28} fill="none" stroke={PC.nervio} strokeWidth={3} opacity={0.45} />}
            <text x={0} y={50} textAnchor="middle" fontFamily={MONOF} fontWeight={es0 ? 800 : 600} fontSize={es0 ? 26 : 19} fill={es0 && cero > 0.5 ? PC.nervio : "#BFE0FF"} opacity={es0 ? 1 : on ? 0.85 : 0.5}>{n}</text>
          </g>
        );
      })}
    </g>
  );
};

export { W, H };
