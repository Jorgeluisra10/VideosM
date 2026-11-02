/**
 * «El aire que no avisa» (SINAPSIS · medicina de altura) · escenas 2/2
 *   jet-cerebro   el cerebro iluminado (neuronas y glóbulos rojos) y dos cuadrículas de 100 celdas: 2 % del peso, 20 % del oxígeno
 *   jet-reloj     cronómetro de conciencia útil a 35.000 pies (30–60 s) y la tabla de la FAA por altitud
 *   jet-silencio  tablero visto en primera persona: la visión en túnel se cierra mientras llegan los síntomas silenciosos
 *   jet-descenso  la máscara de oxígeno cae, el altímetro baja de 35.000 a 10.000 pies, el oxímetro se recupera y la visión se abre
 * Las lecturas de SpO2 y los síntomas son ILUSTRACIONES educativas, no registros de ningún vuelo real.
 */
import React, { useMemo } from "react";
import { JET, TJET } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeInOut, easeOut, lerp, mezclar, spr, useReloj } from "../comun";
import { LineaCap } from "../comun";
import { Altimetro, Cielo, JK, Mascara, Oximetro, PanelTecho, Tunel, sua } from "./jet-kit";
import { Estudio, Cronometro, FONT, Frases, MONOF, RE } from "./real-kit";
import { Fuente } from "./real1";

type P = { e: EscenaViralGuardada };
type Pt = [number, number];

const Cap: React.FC<{ e: EscenaViralGuardada }> = ({ e }) => (e.cap ? <LineaCap texto={e.cap} y={290} px={28} delay={0.12} id="cap-pieza" color={JK.hielo} /> : null);

/** punto sobre una polilínea a la fracción u (0–1) de su largo */
function enRuta(pts: Pt[], u: number): Pt {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = seg.reduce((s, v) => s + v, 0);
  let d = clamp(u) * total;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) { const k = seg[i] ? Math.min(1, d / seg[i]) : 0; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; }
    d -= seg[i];
  }
  return pts[pts.length - 1];
}

/* ───────────── jet-cerebro ───────────── */

const CEREBRO = "M -330,40 C -350,-60 -300,-180 -190,-225 C -120,-262 -20,-262 50,-235 C 140,-262 250,-232 300,-150 C 350,-95 352,-10 322,48 C 340,110 290,175 220,178 C 190,230 110,236 70,196 C 10,236 -60,228 -90,188 C -160,214 -250,190 -270,130 C -330,118 -345,80 -330,40 Z";
const CEREBELO = "M 120,160 C 150,118 275,118 305,172 C 285,236 160,246 120,160 Z";
const TRONCO = "M 26,186 C 16,250 28,300 22,344 L 76,344 C 80,292 86,240 92,196 Z";
const RUTAS: Pt[][] = [
  [[50, 340], [46, 250], [32, 170], [-40, 90], [-130, 20], [-215, -75]],
  [[50, 340], [60, 250], [84, 160], [156, 70], [236, -10], [286, -95]],
  [[50, 340], [48, 250], [42, 130], [12, 30], [0, -80], [-24, -190]],
];

const Waffle: React.FC<{ x: number; y: number; lit: number; color: string; cell?: number; gap?: number }> = ({ x, y, lit, color, cell = 30, gap = 5 }) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({ length: 100 }, (_, i) => {
      const cx = (i % 10) * (cell + gap), cy = Math.floor(i / 10) * (cell + gap);
      const on = clamp(lit - i);
      return (
        <g key={i}>
          <rect x={cx} y={cy} width={cell} height={cell} rx={6} fill="rgba(190,224,255,0.07)" stroke="rgba(190,224,255,0.22)" strokeWidth={1.5} />
          {on > 0.02 && <rect x={cx + cell / 2 * (1 - on)} y={cy + cell / 2 * (1 - on)} width={cell * on} height={cell * on} rx={6} fill={color} />}
          {on > 0.02 && on < 0.98 && <rect x={cx - 4} y={cy - 4} width={cell + 8} height={cell + 8} rx={9} fill="none" stroke="#fff" strokeWidth={3} opacity={0.8 * (1 - on)} />}
        </g>
      );
    })}
  </g>
);

export const JetCerebro: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TJET.cerebro;
  const uid = useUid();
  const entra = spr(f, a(C.cerebro), { damping: 15, stiffness: 110, mass: 0.9 });
  const vida = 1 - 0.78 * sua(t, a(C.apaga), a(C.apaga + 0.9));
  const latido = 1 + 0.012 * Math.sin(t * 7.2) * vida;
  const nodos = useMemo(() => Array.from({ length: 36 }, (_, i) => { const r = Math.sqrt(azar(i * 3.7)), ang = azar(i * 5.1) * Math.PI * 2; return [Math.cos(ang) * r * 290 - 6, Math.sin(ang) * r * 175 - 18] as Pt; }), []);
  const aristas = useMemo(() => nodos.flatMap((p, i) => nodos.map((q, j) => ({ i, j, d: Math.hypot(p[0] - q[0], p[1] - q[1]) })).filter((v) => v.j > v.i).sort((u, v) => u.d - v.d).slice(0, 2)).map((v) => [nodos[v.i], nodos[v.j]] as [Pt, Pt]), [nodos]);
  const surcos = useMemo(() => Array.from({ length: 16 }, (_, i) => {
    const x0 = -300 + azar(i * 2.3) * 560, y0 = -200 + azar(i * 4.9) * 330;
    const pts = Array.from({ length: 5 }, (_, k) => `${(x0 + k * 38 + Math.sin(i * 3 + k * 1.9) * 26).toFixed(0)},${(y0 + Math.cos(i * 2 + k * 2.4) * 30 + k * 6).toFixed(0)}`);
    return `M ${pts[0]} C ${pts[1]} ${pts[2]} ${pts[3]} S ${pts[4]} ${pts[4]}`;
  }), []);
  const k2 = easeOut((t - a(C.col2)) / a(0.9)), k20 = easeOut((t - a(C.col20)) / a(1.4));
  const pop2 = 1.2 * (t > a(C.col2) ? 1 : 0), pop20 = 20;
  return (
    <Estudio piso={1720} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id={`${uid}b`} cx="42%" cy="34%" r="75%"><stop offset="0" stopColor={mezclar("#F6C0C4", "#8D9DB5", 1 - vida)} /><stop offset="0.55" stopColor={mezclar("#D27A8A", "#5F6E88", 1 - vida)} /><stop offset="1" stopColor={mezclar("#8E3E58", "#34415C", 1 - vida)} /></radialGradient>
          <radialGradient id={`${uid}h`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={JK.cian} stopOpacity={0.45 * vida} /><stop offset="1" stopColor={JK.cian} stopOpacity="0" /></radialGradient>
          <clipPath id={`${uid}c`}><path d={CEREBRO} /></clipPath>
          <filter id={`${uid}g`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        <g transform={`translate(540 772) scale(${0.7 * latido * (0.9 + 0.1 * entra)}) `} opacity={clamp(entra * 1.6)}>
          <ellipse cx={0} cy={-10} rx={470} ry={330} fill={`url(#${uid}h)`} />
          {/* tronco y cerebelo */}
          <path d={TRONCO} fill={mezclar("#C9707F", "#44526C", 1 - vida)} stroke="#6E2D44" strokeWidth={3} />
          <path d={CEREBELO} fill={mezclar("#B35E70", "#3E4B66", 1 - vida)} stroke="#6E2D44" strokeWidth={3} />
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M ${135 + i * 6} ${150 + i * 14} C 190 ${138 + i * 14} 250 ${140 + i * 14} 296 ${166 + i * 8}`} fill="none" stroke="#6E2D44" strokeWidth={3} opacity={0.55} />)}
          {/* corteza */}
          <path d={CEREBRO} fill={`url(#${uid}b)`} stroke="#5B2038" strokeWidth={5} />
          <g clipPath={`url(#${uid}c)`}>
            {surcos.map((d, i) => <path key={i} d={d} fill="none" stroke="#5B2038" strokeWidth={5} strokeLinecap="round" opacity={0.55} />)}
            {surcos.map((d, i) => <path key={`l${i}`} d={d} fill="none" stroke="#FFE0E4" strokeWidth={2.5} strokeLinecap="round" opacity={0.28} transform="translate(-4 -4)" />)}
            {/* red neuronal que se enciende */}
            {aristas.map(([p, q], i) => <line key={i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={JK.cian} strokeWidth={2.2} opacity={0.35 * vida} />)}
            {nodos.map((p, i) => { const flash = Math.max(0, Math.sin(t * 3 + i * 1.7)) ** 8; return <circle key={i} cx={p[0]} cy={p[1]} r={4 + 7 * flash * vida} fill="#D8FAFF" opacity={(0.4 + 0.6 * flash) * vida} />; })}
            {aristas.map(([p, q], i) => { const u = (((t * 0.7 + azar(i * 3.9)) % 1) + 1) % 1; return <circle key={`s${i}`} cx={lerp(p[0], q[0], u)} cy={lerp(p[1], q[1], u)} r={5} fill="#fff" opacity={0.9 * vida * Math.sin(u * Math.PI)} />; })}
            <path d={CEREBRO} fill="none" stroke="#FFC9D0" strokeWidth={10} opacity={0.18} filter={`url(#${uid}g)`} />
          </g>
          {/* arterias con glóbulos rojos */}
          {RUTAS.map((r, i) => <polyline key={i} points={r.map((p) => p.join(",")).join(" ")} fill="none" stroke="#7A0F1F" strokeWidth={9 - i} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />)}
          {RUTAS.map((r, i) => Array.from({ length: 7 }, (_, j) => {
            const u = (((t * (0.22 + 0.1 * vida) + j / 7 + i * 0.13) % 1) + 1) % 1;
            const [x, y] = enRuta(r, u);
            return <circle key={`${i}${j}`} cx={x} cy={y} r={7} fill="#FF5A4F" stroke="#FFC9C2" strokeWidth={1.8} opacity={clamp(u * 6) * clamp((1 - u) * 6) * (0.4 + 0.6 * vida)} />;
          }))}
        </g>
        {/* cuadrículas de 100 celdas */}
        <Waffle x={110} y={1126} lit={Math.min(2, 2.2 * k2)} color={JK.hielo} />
        <Waffle x={590} y={1126} lit={20 * k20} color={mezclar(JK.cian, "#FFFFFF", 0.1)} />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "EL CEREBRO\nPESA POCO", px: 94 }, { t: 2.6, texto: "PERO GASTA\nMUCHO", px: 94, color: JK.cian }, { t: C.apaga, texto: "SIN OXÍGENO,\nSE APAGA PRIMERO", px: 76, color: JK.ambar }]} y={450} x={104} id="titular-cerebro" />
      <div data-texto="cerebro-p2" style={{ position: "absolute", left: 110, top: 1020, width: 350, opacity: clamp((t - a(C.col2)) / 0.4), fontFamily: MONOF, fontWeight: 800, fontSize: 70, color: JK.hielo, lineHeight: 1.05 }}>2 %<div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 27, color: JK.hielo, opacity: 0.9, lineHeight: 1.25 }}>del peso del cuerpo</div></div>
      <div data-texto="cerebro-p20" style={{ position: "absolute", left: 590, top: 1020, width: 350, opacity: clamp((t - a(C.col20)) / 0.4), fontFamily: MONOF, fontWeight: 800, fontSize: 70, color: JK.cian, lineHeight: 1.05 }}>20 %<div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 27, color: JK.hielo, opacity: 0.9, lineHeight: 1.25 }}>del oxígeno en reposo</div></div>
      <Fuente texto="Raichle y Gusnard, PNAS 2002: ≈ 2 % de la masa corporal y ≈ 20 % del metabolismo de oxígeno en reposo. Esquema." y={1500} delay={C.col2} />
      <Cap e={e} />
    </Estudio>
  );
};

/* ───────────── jet-reloj ───────────── */

const logPos = (s: number): number => clamp((Math.log10(s) - Math.log10(10)) / (Math.log10(2400) - Math.log10(10)));

export const JetReloj: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const R = TJET.reloj;
  const aguja = easeInOut((t - a(R.aguja)) / a(R.agujaDur));
  const seg = 60 * aguja;
  const marca30 = sua(t, a(R.aguja + R.agujaDur * 0.4), a(R.aguja + R.agujaDur * 0.5));
  const cron = spr(f, a(R.cron), { damping: 14, stiffness: 120, mass: 0.8 });
  const luz = sua(t, a(R.luz), a(R.luz + 0.4));
  const tunel = sua(t, a(R.tunel), a(R.tunel + 1.6));
  return (
    <Estudio piso={1720} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(cron * 1.8)} transform={`translate(0 ${(1 - cron) * 40})`}>
          <Cronometro x={540} y={848} r={200} valor={seg / 60} color={JK.rojo} arco={seg / 60} etiqueta="SEGUNDOS" />
          {/* zona de conciencia útil: de los 30 s (abajo) a los 60 s (arriba), se enciende al pasar la aguja */}
          <path d={`M 540 ${848 + 200 * 0.875} A ${200 * 0.875} ${200 * 0.875} 0 0 1 540 ${848 - 200 * 0.875}`} fill="none" stroke={JK.ambar} strokeWidth={11} strokeLinecap="round" strokeDasharray={`${Math.PI * 200 * 0.875 * clamp((seg - 30) / 30)} 2000`} opacity={0.95 * marca30 + 0.05} />
        </g>
        {/* tabla de tiempo de conciencia útil (escala logarítmica de 10 s a 40 min) */}
        <g>
          <text x={110} y={1126} fontFamily={MONOF} fontWeight={700} fontSize={24} fill={JK.acero} letterSpacing="0.06em">ALTITUD</text>
          <text x={970} y={1126} textAnchor="end" fontFamily={MONOF} fontWeight={700} fontSize={24} fill={JK.acero} letterSpacing="0.06em">TIEMPO DE CONCIENCIA ÚTIL (ESCALA LOG.)</text>
          {JET.tuc.map((r, i) => {
            const ki = easeOut((t - a(R.tabla + R.tablaPaso * i)) / a(0.6));
            const y = 1148 + i * 64;
            const x0 = 330, ancho = 640;
            const xa = x0 + ancho * logPos(r.min), xb = x0 + ancho * logPos(r.max);
            const es35 = r.ft === 35000;
            const col = es35 ? JK.ambar : r.ft === 40000 ? JK.rojo : JK.hielo;
            return (
              <g key={r.ft} opacity={clamp(ki * 2)}>
                {es35 && luz > 0 && <rect x={100} y={y - 8} width={880} height={54} rx={27} fill={JK.ambar} opacity={0.18 * luz} />}
                <text x={110} y={y + 30} fontFamily={MONOF} fontWeight={es35 ? 800 : 700} fontSize={es35 ? 29 : 27} fill={es35 ? "#fff" : JK.hielo}>{r.ft.toLocaleString("en-US").replace(",", ".")} pies</text>
                <rect x={x0} y={y + 8} width={ancho} height={4} rx={2} fill="rgba(190,224,255,0.13)" />
                <rect x={xa} y={y} width={Math.max(10, (xb - xa) * ki)} height={38} rx={19} fill={col} opacity={es35 ? 1 : 0.85} />
                <text x={xb > 800 ? xa - 16 : xb + 16} y={y + 30} textAnchor={xb > 800 ? "end" : "start"} fontFamily={MONOF} fontWeight={800} fontSize={27} fill={es35 ? JK.ambar : "#fff"}>{r.txt}</text>
              </g>
            );
          })}
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "A 35.000 PIES\n(10.668 m)", px: 92 }, { t: 2.0, texto: "30–60 s DE\nCONCIENCIA ÚTIL", px: 82, color: JK.ambar }]} y={450} x={104} id="titular-reloj" />
      <Fuente texto="FAA, AIM 8-1-2: tiempo de conciencia útil sin oxígeno suplementario; son rangos y varían por persona. Una despresurización brusca puede acortarlos." y={1500} delay={R.tabla} />
      <Tunel radio={lerp(1500, 760, tunel)} cx={540} cy={900} suavidad={280} opacidad={tunel} />
      <Cap e={e} />
    </Estudio>
  );
};

/* ───────────── jet-silencio ───────────── */

/** Indicador de actitud (horizonte artificial) con alabeo; r en px. */
const Horizonte: React.FC<{ x: number; y: number; r: number; alabeo: number; cabeceo: number }> = ({ x, y, r, alabeo, cabeceo }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <clipPath id={`${uid}c`}><circle r={r * 0.92} /></clipPath>
        <linearGradient id={`${uid}cielo`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2F7FD6" /><stop offset="1" stopColor="#9FD3FF" /></linearGradient>
        <linearGradient id={`${uid}suelo`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9B6B3F" /><stop offset="1" stopColor="#4A2F1A" /></linearGradient>
        <linearGradient id={`${uid}m`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E9EEF4" /><stop offset="0.45" stopColor="#6F7C8C" /><stop offset="1" stopColor="#2F3843" /></linearGradient>
      </defs>
      <circle r={r} fill={`url(#${uid}m)`} />
      <circle r={r * 0.94} fill="#05080C" />
      <g clipPath={`url(#${uid}c)`}>
        <g transform={`rotate(${alabeo}) translate(0 ${cabeceo})`}>
          <rect x={-r * 2} y={-r * 2} width={r * 4} height={r * 2} fill={`url(#${uid}cielo)`} />
          <rect x={-r * 2} y={0} width={r * 4} height={r * 2} fill={`url(#${uid}suelo)`} />
          <line x1={-r * 2} y1={0} x2={r * 2} y2={0} stroke="#fff" strokeWidth={3} />
          {[-40, -20, 20, 40].map((p) => <line key={p} x1={-r * (Math.abs(p) === 20 ? 0.18 : 0.3)} y1={p * 2} x2={r * (Math.abs(p) === 20 ? 0.18 : 0.3)} y2={p * 2} stroke="#fff" strokeWidth={3} />)}
        </g>
        <path d={`M ${-r * 0.5} 0 L ${-r * 0.16} 0 L ${-r * 0.16} ${r * 0.07}`} fill="none" stroke="#FFC93D" strokeWidth={r * 0.035} strokeLinejoin="round" />
        <path d={`M ${r * 0.5} 0 L ${r * 0.16} 0 L ${r * 0.16} ${r * 0.07}`} fill="none" stroke="#FFC93D" strokeWidth={r * 0.035} strokeLinejoin="round" />
        <circle r={r * 0.035} fill="#FFC93D" />
      </g>
      <path d={`M ${-r * 0.78} ${-r * 0.3} A ${r * 0.84} ${r * 0.84} 0 0 1 ${-r * 0.2} ${-r * 0.82}`} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={r * 0.05} strokeLinecap="round" />
    </g>
  );
};

/** Velocímetro simple (0–400 nudos). */
const Velocidad: React.FC<{ x: number; y: number; r: number; kt: number }> = ({ x, y, r, kt }) => {
  const pol = (g: number, rr: number): Pt => [Math.cos(((g - 90) * Math.PI) / 180) * rr, Math.sin(((g - 90) * Math.PI) / 180) * rr];
  const ang = -135 + (kt / 400) * 270;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="#6F7C8C" /><circle r={r * 0.94} fill="#05080C" />
      {Array.from({ length: 41 }, (_, i) => { const g = -135 + (i / 40) * 270; const [x1, y1] = pol(g, r * 0.86), [x2, y2] = pol(g, r * (i % 5 === 0 ? 0.74 : 0.8)); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F2F5F8" strokeWidth={i % 5 === 0 ? 3.5 : 1.6} />; })}
      {[0, 100, 200, 300, 400].map((v) => { const [nx, ny] = pol(-135 + (v / 400) * 270, r * 0.58); return <text key={v} x={nx} y={ny + r * 0.06} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={r * 0.17} fill="#F2F5F8">{v}</text>; })}
      <text x={0} y={r * 0.42} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={r * 0.12} fill="#AEBBCB" letterSpacing="0.1em">KT</text>
      <g transform={`rotate(${ang})`}><polygon points={`0,${-r * 0.78} ${r * 0.04},0 ${-r * 0.04},0`} fill="#fff" /></g>
      <circle r={r * 0.07} fill="#2B343E" stroke="#AEBBCB" strokeWidth={2} />
    </g>
  );
};

const SINTOMAS = [
  { txt: "sin dolor", color: JK.hielo },
  { txt: "euforia", color: JK.verde },
  { txt: "visión en túnel", color: JK.ambar },
  { txt: "labios azulados", color: "#7DA2FF" },
  { txt: "poco juicio", color: JK.rojo },
];

export const JetSilencio: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const S = TJET.silencio;
  const panel = easeOut((t - a(S.panel)) / a(0.6));
  const k = easeInOut((t - a(S.tunel)) / a(S.tunelDur));
  const radio = lerp(1250, 190, k);
  const alabeo = 6 * Math.sin(t * 0.8) + 2 * Math.sin(t * 2.3);
  const luces = (i: number): number => (i === 1 ? 0.35 + 0.65 * Math.max(0, Math.sin(t * 9)) * sua(t, a(S.chips[2]), a(S.chips[2] + 0.3)) : 0.25);
  const filas: [number, number][] = [[0, 1], [2], [3, 4]].flatMap((fila, r) => [fila.map((i) => i as number)]).map((fila, r) => [r, fila.length]) as [number, number][];
  void filas;
  const layout = [[0, 1, 2], [3, 4]];
  const anchos = [250, 220, 330, 340, 290];
  return (
    <Estudio piso={1720} resplandor={0.2} particulas={0}>
      <div style={{ position: "absolute", inset: 0, filter: `saturate(${1 - 0.55 * k}) contrast(${1 + 0.1 * k})`, opacity: panel }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="jet-panel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#202733" /><stop offset="1" stopColor="#0C1017" /></linearGradient>
          </defs>
          <rect x={50} y={610} width={980} height={640} rx={44} fill="url(#jet-panel)" stroke="#3C4757" strokeWidth={4} />
          {[[84, 644], [996, 644], [84, 1216], [996, 1216]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={11} fill="#6F7C8C" /><line x1={x - 7} y1={y - 5} x2={x + 7} y2={y + 5} stroke="#2A3340" strokeWidth={3} /></g>)}
          {/* luces de aviso */}
          {[["CABIN ALT", 0], ["MASTER", 1], ["OXYGEN", 2]].map(([n, i]) => {
            const idx = Number(i);
            const on = idx === 1 ? luces(1) : idx === 0 ? 0.25 + 0.75 * sua(t, a(S.chips[2]), a(S.chips[2] + 0.2)) : 0.25;
            return (
              <g key={n as string}>
                <rect x={150 + idx * 280} y={654} width={228} height={46} rx={10} fill="#10141B" stroke="#3C4757" strokeWidth={2} />
                <rect x={158 + idx * 280} y={662} width={212} height={30} rx={6} fill={idx === 1 ? JK.ambar : JK.rojo} opacity={on * 0.9} />
                <text x={264 + idx * 280} y={685} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={23} fill={on > 0.5 ? "#1B0B00" : "#8A97A8"}>{n as string}</text>
              </g>
            );
          })}
          <Horizonte x={540} y={950} r={220} alabeo={alabeo} cabeceo={Math.sin(t * 0.7) * 10} />
          <Velocidad x={236} y={1040} r={118} kt={410 - 40 + Math.sin(t) * 6 - 0} />
          <Altimetro x={846} y={1040} r={118} ft={35000 + Math.sin(t * 1.3) * 40} />
        </svg>
      </div>
      <Tunel radio={radio} cx={540} cy={950} suavidad={150 + 120 * (1 - k)} opacidad={panel} />
      <Frases frases={[{ t: 0.2, texto: "NO DUELE.\nNO AHOGA.", px: 98 }, { t: 3.0, texto: "SÍNTOMAS\nSILENCIOSOS", px: 94, color: JK.ambar }]} y={450} x={104} id="titular-silencio" />
      {layout.map((fila, r) => {
        const total = fila.reduce((s, i) => s + anchos[i], 0) + (fila.length - 1) * 18;
        let cursor = (W - total) / 2;
        return fila.map((i) => {
          const x0 = cursor; cursor += anchos[i] + 18;
          const s = spr(f, a(S.chips[i]), { damping: 12, stiffness: 190, mass: 0.6 });
          return (
            <div key={i} data-texto={`sintoma-${i}`} style={{ position: "absolute", left: x0, top: 1292 + r * 82, width: anchos[i], opacity: clamp(s * 2), transform: `scale(${0.85 + 0.15 * s})`, transformOrigin: "50% 50%" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "13px 18px", borderRadius: 999, border: `3px solid ${SINTOMAS[i].color}`, background: "rgba(5,12,24,0.88)", fontFamily: FONT, fontWeight: 800, fontSize: 33, color: "#fff", boxShadow: `0 0 28px ${SINTOMAS[i].color}55`, whiteSpace: "nowrap" }}>
                <span style={{ width: 16, height: 16, borderRadius: 8, background: SINTOMAS[i].color, display: "inline-block" }} />{SINTOMAS[i].txt}
              </div>
            </div>
          );
        });
      })}
      <Fuente texto="Síntomas de hipoxia descritos por la FAA. Escena ilustrativa, no corresponde a ningún vuelo real." y={1500} delay={S.chips[0]} />
      <Cap e={e} />
    </Estudio>
  );
};

/* ───────────── jet-descenso ───────────── */

export const JetDescenso: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const D = TJET.descenso;
  const kD = easeInOut((t - a(D.desc)) / a(D.descDur));
  const ft = lerp(35000, 10000, kD);
  const spo2 = lerp(72, 98, easeOut((t - a(D.desc + 0.4)) / a(D.descDur)));
  const bpm = lerp(118, 76, kD);
  const caida = spr(f, a(D.mascara), { damping: 9, stiffness: 70, mass: 1.1 });
  const abre = clamp((t - a(D.techo)) / a(0.35));
  const mece = 9 * Math.sin((t - a(D.mascara)) * 4.4) * Math.exp(-Math.max(0, t - a(D.mascara)) * 0.7);
  const bolsa = easeOut((t - a(D.bolsa)) / a(1.4)) * (0.92 + 0.08 * Math.sin(t * 2.1 + 1));
  const apertura = easeInOut((t - a(D.abre)) / a(D.descDur + 0.4));
  const radio = lerp(210, 1500, apertura);
  return (
    <Cielo t={t} oscuridad={lerp(0.85, 0.12, kD)} sol={kD} horizonte={lerp(1900, 1180, kD)} deriva={0.6 + 1.2 * kD} nubes={clamp(kD * 2)}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <PanelTecho x={290} y={298} w={300} abre={abre} />
        <Mascara x={290} y={296} largo={lerp(30, 250, clamp(caida))} giro={mece} bolsa={bolsa} s={0.95} />
        <Altimetro x={770} y={560} r={168} ft={ft} resalte={mezclar(JK.rojo, JK.verde, kD)} />
        <Oximetro x={770} y={920} w={360} spo2={spo2} bpm={bpm} t={t} />
      </svg>
      <Tunel radio={radio} cx={540} cy={700} suavidad={220} opacidad={1 - clamp(apertura * 1.05)} />
      <Frases frases={[{ t: 0.3, texto: "LOS PILOTOS\nENTRENAN", px: 80, color: "#fff" }, { t: 3.2, texto: "OXÍGENO PURO\nY DESCENDER", px: 76, color: JK.verde }, { t: D.frase, texto: "TU CUERPO\nNO AVISA.\nLA MÁSCARA, SÍ.", px: 82, color: JK.ambar }]} y={1285} x={104} id="titular-descenso" />
      <Fuente texto="Información educativa. Los valores del oxímetro son ilustrativos. Sin relación comprobada con el accidente (causa en investigación)." y={1500} delay={D.frase} />
    </Cielo>
  );
};
