/**
 * «Los 4 tejidos» (SINAPSIS · estudio azul marino, figuras tipo render) · escenas 1/2
 *   tej-gancho     las cuatro baldosas (epitelial, conectivo, muscular, nervioso); la del conectivo ondea: es líquida
 *   tej-epitelial  ácido que burbujea sobre un metal y un revestimiento de células que se dañan y se reemplazan cada pocos días
 *   tej-sangre     la sangre fluye por la aorta y un velocímetro marca que el pico pasa de 2 km/h
 * Los colores identifican cada tejido en todo el video (TJ).
 */
import React from "react";
import { TEJ, TTJ } from "../../anim/piezas";
import { useUid } from "../../estudio/util";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, mezclar, spr, useReloj } from "../comun";
import { Estudio, Frases, FONT, MONOF, RE } from "./real-kit";
import { Fuente } from "./real1";
import { Chip } from "./med1";

type P = { e: EscenaViralGuardada };

/** Colores de los cuatro tejidos. */
export const TJ = {
  epi: "#2DD4BF",
  epiClaro: "#A7F3E8",
  epiOsc: "#0F766E",
  con: "#FFC500",
  conClaro: "#FFE58A",
  sangre: "#E5392B",
  sangreOsc: "#8E1B12",
  mus: "#FF6B57",
  musOsc: "#9B2A1C",
  ner: "#4C7DFF",
  nerClaro: "#9EC0FF",
  panel: "#0C1A2A",
} as const;

/** Pulso cardíaco 0–1 a 1,1 latidos por segundo (campana angosta al inicio de cada ciclo). */
export const latido = (t: number): number => Math.pow(Math.max(0, Math.sin(2 * Math.PI * 1.1 * t)), 3);

/* ───────────── tej-gancho ───────────── */

const NOMBRES = ["EPITELIAL", "CONECTIVO", "MUSCULAR", "NERVIOSO"] as const;
const COLORES = [TJ.epi, TJ.con, TJ.mus, TJ.ner] as const;

/** Iconos de cada baldosa (centro en 0,0; caben en ≈ 300 × 150). */
const IconoTejido: React.FC<{ i: number; t: number; uid: string }> = ({ i, t, uid }) => {
  if (i === 0) {
    return (
      <g>
        <rect x={-146} y={-62} width={292} height={14} rx={7} fill={TJ.epiClaro} opacity={0.35} />
        {Array.from({ length: 6 }, (_, k) => {
          const dy = 3 * Math.sin(t * 2 + k);
          return (
            <g key={k} transform={`translate(${-125 + k * 50} ${dy})`}>
              <rect x={-21} y={-44} width={42} height={104} rx={14} fill={`url(#${uid}ep)`} stroke={TJ.epiClaro} strokeOpacity={0.7} strokeWidth={2} />
              <ellipse cx={0} cy={34} rx={11} ry={13} fill={TJ.epiOsc} opacity={0.8} />
            </g>
          );
        })}
      </g>
    );
  }
  if (i === 1) {
    const onda = (x: number, f: number): number => 9 * Math.sin(x / 26 + t * 3.2 + f);
    const pts = Array.from({ length: 31 }, (_, k) => -150 + k * 10);
    const sup = pts.map((x, k) => `${k ? "L" : "M"} ${x} ${-16 + onda(x, 0)}`).join(" ");
    return (
      <g>
        <path d={`${sup} L 150 62 L -150 62 Z`} fill={`url(#${uid}li)`} opacity={0.95} />
        <path d={sup} fill="none" stroke="#FFF1B0" strokeWidth={3} strokeOpacity={0.9} />
        {[0, 1, 2, 3, 4].map((k) => {
          const x = -110 + k * 55 + 10 * Math.sin(t * 2 + k * 2);
          const y = 18 + 14 * Math.sin(t * 2.6 + k * 1.7);
          return <ellipse key={k} cx={x} cy={y} rx={14} ry={9} fill={TJ.sangre} stroke="#FF9A8E" strokeWidth={1.6} />;
        })}
      </g>
    );
  }
  if (i === 2) {
    const c = 0.5 + 0.5 * Math.sin(t * 6.8);
    return (
      <g>
        {Array.from({ length: 4 }, (_, k) => (
          <g key={k} transform={`translate(0 ${-54 + k * 36})`}>
            <rect x={-146 + 8 * c} y={-14} width={292 - 16 * c} height={28} rx={14} fill={`url(#${uid}mu)`} stroke="#FFB0A4" strokeOpacity={0.6} strokeWidth={2} />
            {Array.from({ length: 11 }, (_, j) => <line key={j} x1={-120 + j * 24 + 4 * c} y1={-12} x2={-120 + j * 24 + 4 * c} y2={12} stroke={TJ.musOsc} strokeOpacity={0.5} strokeWidth={2.4} />)}
          </g>
        ))}
      </g>
    );
  }
  const luz = 0.5 + 0.5 * Math.sin(t * 5);
  const ramas = [[-140, -60], [-120, 30], [-60, 62], [70, 56], [128, 24], [136, -52], [30, -70]];
  return (
    <g>
      {ramas.map(([x, y], k) => <path key={k} d={`M 0 0 Q ${x * 0.35} ${y * 0.8 - 8} ${x} ${y}`} fill="none" stroke={TJ.ner} strokeWidth={5.5} strokeLinecap="round" opacity={0.9} />)}
      <circle r={30 + 4 * luz} fill={TJ.ner} opacity={0.22} />
      <circle r={24} fill={`url(#${uid}ne)`} stroke={TJ.nerClaro} strokeWidth={2.5} />
      <circle r={9} fill="#25409A" />
      {ramas.map(([x, y], k) => <circle key={`p${k}`} cx={x} cy={y} r={5} fill={TJ.nerClaro} opacity={0.5 + 0.5 * Math.sin(t * 4 + k)} />)}
    </g>
  );
};

export const TejGancho: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const uid = useUid();
  const G = TTJ.gancho;
  const liq = clamp((t - a(G.liquido)) / a(0.45));
  return (
    <Estudio piso={1600} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`${uid}ep`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={TJ.epiClaro} /><stop offset="1" stopColor={TJ.epi} /></linearGradient>
          <linearGradient id={`${uid}li`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD84A" stopOpacity="0.95" /><stop offset="1" stopColor="#E0A500" stopOpacity="0.9" /></linearGradient>
          <linearGradient id={`${uid}mu`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF9A8A" /><stop offset="1" stopColor={TJ.musOsc} /></linearGradient>
          <radialGradient id={`${uid}ne`} cx="38%" cy="32%" r="80%"><stop offset="0" stopColor={TJ.nerClaro} /><stop offset="1" stopColor="#1B2F7A" /></radialGradient>
        </defs>
        {NOMBRES.map((n, i) => {
          const x = i % 2 ? 560 : 120, y = i < 2 ? 600 : 940;
          const s = spr(f, a(G.tile(i)), { damping: 12, stiffness: 170, mass: 0.7 });
          const esLiq = i === 1;
          return (
            <g key={n} transform={`translate(${x + 200} ${y + 150}) scale(${0.6 + 0.4 * s})`} opacity={clamp(s * 1.6)}>
              {esLiq && liq > 0 && <rect x={-214} y={-164} width={428} height={328} rx={40} fill={TJ.con} opacity={0.22 * liq} />}
              <rect x={-200} y={-150} width={400} height={300} rx={32} fill={TJ.panel} stroke={COLORES[i]} strokeWidth={esLiq && liq > 0 ? 6 : 3.5} />
              <g transform="translate(0 -14)"><IconoTejido i={i} t={t} uid={uid} /></g>
              <text x={-176} y={-112} fontFamily={MONOF} fontWeight={700} fontSize={30} fill={COLORES[i]}>{i + 1}</text>
              <text x={0} y={122} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={30} letterSpacing="0.06em" fill={RE.blanco}>{n}</text>
            </g>
          );
        })}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "todo tu cuerpo", px: 100 }, { t: 1.4, texto: "solo 4 tejidos", color: RE.oro, px: 104 }, { t: 2.6, texto: "uno es líquido", color: RE.hielo, px: 100 }]} y={400} id="tej-gancho-t" />
      <Chip texto="líquido" x={760} y={556} color={TJ.con} ancho={240} id="gancho-liquido" opacidad={liq} />
    </Estudio>
  );
};

/* ───────────── tej-epitelial ───────────── */

const N_CEL = 10;
const CEL_X0 = 120, CEL_W = 80, CEL_PASO = 84, CEL_Y = 900, CEL_H = 150;

export const TejEpitelial: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const uid = useUid();
  const E = TTJ.epitelial;
  const entra = easeOut((t - a(E.acido)) / a(0.6));
  const corr = clamp((t - a(E.metal)) / a(3.4));
  const anillo = clamp((t - a(E.dia(0) - 0.3)) / a(E.dia(3) + 0.6 - (E.dia(0) - 0.3)));
  const cifra = clamp((t - a(E.cifra)) / a(0.4));
  const aR = 74, cx = 300, cy = 1290;
  const ang = (anillo * 360 - 90) * (Math.PI / 180);
  const arco = anillo > 0.001 ? `M ${cx} ${cy - aR} A ${aR} ${aR} 0 ${anillo > 0.5 ? 1 : 0} 1 ${cx + aR * Math.cos(ang)} ${cy + aR * Math.sin(ang)}` : "";
  const AC0 = 610, AC1 = 830;
  return (
    <Estudio piso={1600} resplandor={0.42}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`${uid}ac`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C7F36B" stopOpacity="0.55" /><stop offset="1" stopColor="#6FBF2A" stopOpacity="0.28" /></linearGradient>
          <linearGradient id={`${uid}me`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E3EAF2" /><stop offset="0.5" stopColor="#9FB0C2" /><stop offset="1" stopColor="#5E6D7E" /></linearGradient>
          <linearGradient id={`${uid}ce`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={TJ.epiClaro} /><stop offset="1" stopColor={TJ.epi} /></linearGradient>
        </defs>
        <g opacity={entra}>
          {/* ácido */}
          <rect x={120} y={AC0} width={840} height={AC1 - AC0} rx={22} fill={`url(#${uid}ac)`} stroke="#C7F36B" strokeOpacity={0.55} strokeWidth={2.5} />
          <path d={`M 120 ${AC0 + 10} ${Array.from({ length: 22 }, (_, k) => `L ${120 + k * 40} ${AC0 + 8 + 7 * Math.sin(t * 3 + k * 0.9)}`).join(" ")}`} fill="none" stroke="#E9FFB8" strokeOpacity={0.7} strokeWidth={3} />
          {Array.from({ length: 16 }, (_, k) => {
            const ciclo = (t * (40 + (k % 4) * 14) + k * 61) % 190;
            const x = 160 + ((k * 137) % 780);
            return <circle key={k} cx={x + 6 * Math.sin(t * 3 + k)} cy={AC1 - 16 - ciclo} r={4 + (k % 3) * 2.4} fill="#F4FFD0" opacity={0.65 * (1 - ciclo / 190)} />;
          })}
          {/* metal que se corroe */}
          <g transform="translate(210 722)">
            <rect x={0} y={0} width={320 * (1 - 0.55 * corr)} height={38} rx={8} fill={`url(#${uid}me)`} stroke="#fff" strokeOpacity={0.5} strokeWidth={1.6} />
            {[0, 1, 2, 3, 4].map((k) => corr > 0.12 * (k + 1) && <circle key={k} cx={30 + k * 56} cy={12 + (k % 2) * 14} r={3 + 6 * corr} fill="#0B1828" opacity={0.7} />)}
          </g>
          {/* moco */}
          <rect x={120} y={846} width={840} height={42} rx={12} fill={TJ.epiClaro} opacity={0.3} />
          <text x={540} y={875} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={22} fill={TJ.epiClaro} letterSpacing="0.06em">moco protector</text>
        </g>
        {/* revestimiento: cada célula se daña y es reemplazada */}
        {Array.from({ length: N_CEL }, (_, i) => {
          const k = i % 4;
          const tk = a(E.dia(k));
          const p = clamp((t - tk) / a(0.55));
          const dano = clamp((t - a(0.9)) / Math.max(0.1, tk - a(0.9))) * 0.75;
          const x = CEL_X0 + i * CEL_PASO;
          const color = TJ.epi;
          return (
            <g key={i} opacity={entra}>
              {p < 1 && (
                <g transform={`translate(0 ${-44 * p})`} opacity={1 - p}>
                  <rect x={x} y={CEL_Y} width={CEL_W} height={CEL_H} rx={22} fill={color} stroke={TJ.epiClaro} strokeOpacity={0.6} strokeWidth={2} />
                  <rect x={x} y={CEL_Y} width={CEL_W} height={CEL_H} rx={22} fill="#F2415C" opacity={Math.max(dano, p > 0 ? 0.85 : 0) * 0.85} />
                  <ellipse cx={x + CEL_W / 2} cy={CEL_Y + CEL_H - 38} rx={14} ry={17} fill="#0B3F3A" opacity={0.7} />
                </g>
              )}
              {p > 0 && (
                <g transform={`translate(${x} ${CEL_Y + CEL_H}) scale(1 ${p}) translate(${-x} ${-(CEL_Y + CEL_H)})`}>
                  <rect x={x} y={CEL_Y} width={CEL_W} height={CEL_H} rx={22} fill={`url(#${uid}ce)`} stroke="#E6FFFA" strokeOpacity={0.9} strokeWidth={2.4} />
                  <ellipse cx={x + CEL_W / 2} cy={CEL_Y + CEL_H - 38} rx={14} ry={17} fill={TJ.epiOsc} opacity={0.85} />
                </g>
              )}
              <circle cx={x + CEL_W / 2} cy={CEL_Y + CEL_H + 24} r={9 + 4 * Math.sin(Math.PI * clamp(p))} fill={TJ.con} opacity={0.45 + 0.5 * Math.sin(Math.PI * clamp(p))} />
            </g>
          );
        })}
        {/* reloj de días */}
        <g opacity={clamp(anillo * 6)}>
          <circle cx={cx} cy={cy} r={aR} fill="none" stroke="#1B3550" strokeWidth={12} />
          {arco && <path d={arco} fill="none" stroke={TJ.con} strokeWidth={12} strokeLinecap="round" />}
          {[0, 1, 2, 3].map((k) => {
            const th = (k / 4) * 2 * Math.PI - Math.PI / 2;
            return <line key={k} x1={cx + (aR - 18) * Math.cos(th)} y1={cy + (aR - 18) * Math.sin(th)} x2={cx + (aR + 12) * Math.cos(th)} y2={cy + (aR + 12) * Math.sin(th)} stroke={RE.blanco} strokeOpacity={0.5} strokeWidth={3} />;
          })}
          <text x={cx} y={cy + 14} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={42} fill={RE.blanco}>{Math.min(4, 1 + Math.floor(anillo * 4))}</text>
        </g>
      </svg>
      <Chip texto="ácido · pH ≈ 1,5–3,5" x={690} y={560} color="#D9FF8A" ancho={420} id="epi-acido" opacidad={entra} />
      <Chip texto="metal" x={270} y={560} color={RE.hielo} ancho={170} id="epi-metal" opacidad={entra} />
      <div data-texto="epi-cifra" style={{ position: "absolute", left: 440, top: 1226, width: 520, opacity: cifra, transform: `translateX(${(1 - cifra) * 30}px)` }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 112, lineHeight: 1, color: TJ.con }}>{TEJ.epitelioDias[0]}–{TEJ.epitelioDias[1]}</div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: RE.blanco, marginTop: 4 }}>días y se renueva</div>
      </div>
      <Frases frases={[{ t: 0.2, texto: "epitelial", color: TJ.epi, px: 108 }, { t: 1.5, texto: "ácido que\ncorroe metales", px: 92 }, { t: 3.1, texto: "¡pero se\nrenueva!", color: RE.oro, px: 100 }]} y={385} id="tej-epitelial-t" />
      <Fuente texto="Sender y Milo, Nat Med 2021 (epitelio digestivo: 3–5 días) · el ácido ataca algunos metales, muy despacio" y={1462} delay={3.6} />
    </Estudio>
  );
};

/* ───────────── tej-sangre ───────────── */

export const TejSangre: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const uid = useUid();
  const B = TTJ.sangre;
  const tubo = spr(f, a(B.tubo), { damping: 14, stiffness: 140, mass: 0.8 });
  const gauge = clamp((t - a(B.aguja - 0.4)) / a(0.5));
  const marca = clamp((t - a(B.marca)) / a(0.4));
  // desplazamiento acumulado de los glóbulos: avanzan más rápido en cada latido (integral numérica determinista)
  let desp = 0;
  const pasos = Math.max(1, Math.floor(t * 60));
  for (let k = 0; k < pasos; k++) desp += (200 + 380 * latido(k / 60)) / 60;
  const kmh = 0.7 + 3.1 * latido(t);
  const GX = 540, GY = 1250, GR = 200;
  const th = (v: number): number => Math.PI + (Math.PI * Math.min(6, Math.max(0, v))) / 6;
  const pt = (v: number, r: number): [number, number] => [GX + r * Math.cos(th(v)), GY + r * Math.sin(th(v))];
  const arcoD = (v0: number, v1: number, r: number): string => {
    const [x0, y0] = pt(v0, r), [x1, y1] = pt(v1, r);
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  const [nx, ny] = pt(kmh, GR - 30);
  return (
    <Estudio piso={1600} resplandor={0.42}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`${uid}pl`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE9A8" stopOpacity="0.6" /><stop offset="1" stopColor="#E9B94A" stopOpacity="0.45" /></linearGradient>
          <linearGradient id={`${uid}pa`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B5483A" /><stop offset="0.5" stopColor="#6E1E16" /><stop offset="1" stopColor="#B5483A" /></linearGradient>
          <radialGradient id={`${uid}gr`} cx="40%" cy="35%" r="75%"><stop offset="0" stopColor="#FF7A66" /><stop offset="1" stopColor={TJ.sangreOsc} /></radialGradient>
          <clipPath id={`${uid}cp`}><rect x={-10} y={660} width={1100} height={170} /></clipPath>
        </defs>
        <g opacity={clamp(tubo * 1.6)} transform={`translate(0 ${(1 - tubo) * 50})`}>
          <rect x={-20} y={636} width={1120} height={218} rx={30} fill={`url(#${uid}pa)`} />
          <rect x={-10} y={660} width={1100} height={170} fill={`url(#${uid}pl)`} />
          <g clipPath={`url(#${uid}cp)`}>
            {Array.from({ length: 16 }, (_, i) => {
              const x = ((i * 137 + desp) % 1240) - 80;
              const y = 700 + ((i * 53) % 100);
              return (
                <g key={i} transform={`translate(${x} ${y}) rotate(${(i % 5) * 12 - 24})`}>
                  <ellipse rx={30} ry={21} fill={`url(#${uid}gr)`} stroke="#FF9A8E" strokeWidth={1.6} />
                  <ellipse rx={13} ry={8} fill={TJ.sangreOsc} opacity={0.65} />
                </g>
              );
            })}
            {[0, 1].map((i) => {
              const x = ((i * 520 + 180 + desp * 0.9) % 1240) - 80;
              return <circle key={i} cx={x} cy={750 + i * 34} r={25} fill="#EEF3FA" stroke="#fff" strokeWidth={2} opacity={0.92} />;
            })}
          </g>
          <rect x={-10} y={660} width={1100} height={16} fill="#fff" opacity={0.15} />
        </g>
        {/* velocímetro */}
        <g opacity={gauge}>
          <path d={arcoD(0, 6, GR)} fill="none" stroke="#16304A" strokeWidth={34} strokeLinecap="round" />
          <path d={arcoD(0, 2, GR)} fill="none" stroke="#3B6A93" strokeWidth={34} />
          <path d={arcoD(2, 6, GR)} fill="none" stroke={TJ.con} strokeWidth={34} />
          {[0, 1, 2, 3, 4, 5, 6].map((v) => {
            const [x, y] = pt(v, GR + 38);
            return <text key={v} x={x} y={y + 8} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={26} fill={v === 2 ? TJ.con : RE.hielo}>{v}</text>;
          })}
          <line x1={GX} y1={GY} x2={nx} y2={ny} stroke="#fff" strokeWidth={9} strokeLinecap="round" />
          <circle cx={GX} cy={GY} r={20} fill="#fff" stroke="#16304A" strokeWidth={6} />
        </g>
      </svg>
      <Chip texto="plasma: la parte líquida" x={540} y={590} color={TJ.conClaro} ancho={520} id="sangre-plasma" opacidad={clamp((t - a(B.flujo)) / 0.4)} />
      <div data-texto="sangre-km" style={{ position: "absolute", left: 140, width: 800, top: 1286, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 76, color: TJ.con, opacity: marca, transform: `scale(${0.8 + 0.2 * marca})` }}>
        más de {TEJ.sangreKmhMin} km/h
      </div>
      <Chip texto="pico en la aorta, en cada latido" x={540} y={1440} color={RE.hielo} ancho={640} id="sangre-pico" opacidad={marca} />
      <Frases frases={[{ t: 0.2, texto: "conectivo", color: TJ.con, px: 108 }, { t: 1.3, texto: "la sangre es\ntejido líquido", px: 92 }, { t: 3.2, texto: "pasa de\n2 km/h", color: RE.oro, px: 100 }]} y={385} id="tej-sangre-t" />
      <Fuente texto="Velocidad pico en la aorta ≈ 0,5–1,7 m/s (≈ 2–6 km/h) según el punto de medida · la media es menor" y={1484} delay={3.8} />
    </Estudio>
  );
};
