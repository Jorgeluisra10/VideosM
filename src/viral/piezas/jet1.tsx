/**
 * «El aire que no avisa» (SINAPSIS · medicina de altura) · escenas 1/2
 *   jet-gancho   un jet de negocios cruza un mar de nubes al atardecer; el altímetro sube a 35.000 pies (la noticia: Florida, 1 nov 2026)
 *   jet-ascenso  sello «causa en investigación» y ascenso de 0 a 10.668 m: la presión cae a casi una cuarta parte (cálculo ISA)
 *   jet-aire     dos cámaras de gas con el mismo 21 % de oxígeno: a 10.668 m llega 5,4 veces menos O2 al pulmón (comparado con cabina y Everest)
 *   jet-cabina   corte transversal de la cabina presurizada: aire denso adentro, delgado y helado afuera
 * La CAUSA del accidente no se afirma: la NTSB investiga. Los gráficos fisiológicos son educativos.
 */
import React from "react";
import { JET, TJET, isaC, isaKPa, pio2MmHg } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeInOut, easeOut, fmtNum, lerp, mezclar, spr, useReloj } from "../comun";
import { Odometro } from "./anom-ui";
import { Altimetro, Camara, Cielo, JK, Jet, Lectura, rebote, sua } from "./jet-kit";
import { Chip } from "./med1";
import { Estudio, FONT, Frases, MONOF, RE } from "./real-kit";
import { Fuente } from "./real1";
import { LineaCap } from "../comun";

type P = { e: EscenaViralGuardada };

const Cap: React.FC<{ e: EscenaViralGuardada }> = ({ e }) => (e.cap ? <LineaCap texto={e.cap} y={290} px={28} delay={0.12} id="cap-pieza" color={JK.hielo} /> : null);

/** Texto SVG con subíndice dibujado (Inter no trae «₂»): O + 2 pequeño. */
export const O2: React.FC<{ x: number; y: number; px: number; color: string; anchor?: "start" | "middle" | "end"; pre?: string; weight?: number }> = ({ x, y, px, color, anchor = "start", pre = "", weight = 700 }) => (
  <text x={x} y={y} textAnchor={anchor} fontFamily={MONOF} fontWeight={weight} fontSize={px} fill={color}>{pre}O<tspan fontSize={px * 0.66} dy={px * 0.16}>2</tspan></text>
);

/* ───────────── jet-gancho ───────────── */

export const JetGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TJET.gancho;
  const kj = easeOut((t - a(G.jet)) / a(1.8));
  const ka = easeInOut((t - a(G.alt)) / a(G.altDur));
  const ft = JET.fl350Ft * ka;
  const x = lerp(-300, 560, kj) + t * 7;
  const y = 900 + Math.sin(t * 1.2) * 9 - 26 * ka;
  const rot = -5 * (1 - ka) + Math.sin(t * 0.9) * 0.8;
  const estela = 560 * clamp((t - a(G.estela)) / a(1.8));
  const chip = spr(f, a(G.chip), { damping: 14, stiffness: 140, mass: 0.7 });
  const blink = 0.55 + 0.45 * Math.sin(t * 5.2);
  return (
    <Cielo t={t} oscuridad={0.12 + 0.2 * ka} sol={1} horizonte={1130} deriva={1 + 0.8 * ka}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Jet x={x} y={y} s={0.98} rot={rot} t={t} estela={estela} empuje={0.6 + 0.4 * ka} luz={1} />
        <g transform={`translate(0 ${(1 - kj) * 40})`} opacity={clamp(chip)}>
          <rect x={196} y={268} width={688} height={64} rx={32} fill="rgba(8,18,31,0.78)" stroke={JK.rojo} strokeWidth={2.5} />
          <circle cx={244} cy={300} r={9} fill={JK.rojo} opacity={blink} />
          <circle cx={244} cy={300} r={20} fill={JK.rojo} opacity={0.25 * blink} />
          <text x={276} y={310} fontFamily={MONOF} fontWeight={700} fontSize={27} letterSpacing="0.05em" fill="#fff">NOTICIA · FLORIDA · 1 NOV 2026</text>
        </g>
        <Altimetro x={300} y={1262} r={178} ft={ft} />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "UN JET CAYÓ\nEN FLORIDA", px: 104 }, { t: G.frase2, texto: "A 10.000 m\nno avisa", color: JK.ambar, px: 104 }]} y={470} x={104} id="titular-gancho" />
      <Lectura x={520} y={1170} ancho={440} titulo="CRUCERO TÍPICO" valor="10.668 m" sub="jet de negocios · 35.000 pies" color={JK.ambar} px={78} opacidad={clamp((t - a(G.alt + 0.4)) / 0.6)} id="gancho-alt" />
      <Fuente texto="Learjet 60 · Greenacres (Florida) · 1 nov 2026 · causa: en investigación (NTSB). Este video no la afirma." y={1500} delay={G.fuente} />
    </Cielo>
  );
};

/* ───────────── jet-ascenso ───────────── */

export const JetAscenso: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const A = TJET.ascenso;
  const k = easeInOut((t - a(A.asc)) / a(A.ascDur));
  const h = JET.fl350M * k;
  const pct = (isaKPa(h) / isaKPa(0)) * 100;
  const sello = spr(f, a(A.sello), { damping: 9, stiffness: 220, mass: 0.6 });
  const selloOp = (1 - sua(t, a(A.sale), a(A.sale + 0.5))) * clamp(sello * 2);
  const anillo = easeOut((t - a(A.asc - 0.4)) / a(0.7));
  const R = 186, C = 2 * Math.PI * R;
  const cuarta = sua(t, a(A.cuarta - 0.2), a(A.cuarta + 0.5));
  const uid = useUid();
  return (
    <Cielo t={t} oscuridad={0.2 + 0.7 * k} sol={1 - 0.8 * k} horizonte={1040 + 760 * k} deriva={1 + 2.2 * k}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><filter id={`${uid}g`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter></defs>
        <Jet x={540 + Math.sin(t * 1.1) * 8} y={760 - 40 * k} s={0.5} rot={-7 - 3 * k} t={t} estela={260 * clamp((t - a(A.asc - 0.6)) / a(1.5))} empuje={0.85} luz={1 - k} />
        {/* sello «causa en investigación» */}
        <g opacity={selloOp} transform={`translate(540 1180) rotate(-7) scale(${0.7 + 0.3 * sello})`}>
          <rect x={-380} y={-112} width={760} height={224} rx={22} fill="rgba(10,16,30,0.72)" stroke={JK.ambar} strokeWidth={7} />
          <rect x={-362} y={-94} width={724} height={188} rx={12} fill="none" stroke={JK.ambar} strokeWidth={2.5} />
          <text x={0} y={-52} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={29} letterSpacing="0.1em" fill="#fff">CAUSA DEL ACCIDENTE</text>
          <text x={0} y={22} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={60} letterSpacing="0.02em" fill={JK.ambar}>EN INVESTIGACIÓN</text>
          <text x={0} y={70} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={27} letterSpacing="0.08em" fill="#fff">NTSB · FAA · SIN CONCLUSIONES</text>
        </g>
        {/* anillo de presión */}
        <g opacity={anillo} transform="translate(540 1252)">
          <circle r={R} fill="rgba(5,12,26,0.55)" />
          <circle r={R} fill="none" stroke="rgba(190,224,255,0.18)" strokeWidth={30} />
          <circle r={R} fill="none" stroke={mezclar(JK.cian, JK.rojo, 1 - pct / 100)} strokeWidth={30} strokeLinecap="round" strokeDasharray={`${(C * pct) / 100} ${C}`} transform="rotate(-90)" />
          <circle r={R} fill="none" stroke={mezclar(JK.cian, JK.rojo, 1 - pct / 100)} strokeWidth={30} strokeDasharray={`${(C * pct) / 100} ${C}`} transform="rotate(-90)" opacity={0.4} filter={`url(#${uid}g)`} />
          <text x={0} y={22} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={104} fill="#fff">{Math.round(pct)}<tspan fontSize={52}>%</tspan></text>
          <text x={0} y={76} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={26} fill={JK.hielo}>de la presión del mar</text>
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "LA CAUSA:\nEN INVESTIGACIÓN", px: 92 }, { t: A.sale, texto: "PERO EL AIRE\nSÍ SE MIDE", px: 96, color: JK.cian }, { t: A.cuarta, texto: "CASI ¼ DE\nLA PRESIÓN", px: 100, color: JK.ambar }]} y={470} x={104} id="titular-ascenso" />
      <Odometro valor={h} x={540} y={986} px={104} digitos={5} sufijo="m" color="#fff" id="ascenso-m" opacidad={anillo} />
      <Lectura x={540} y={1462} ancho={880} alinear="center" valor={`${fmtNum(isaKPa(h), 1)} kPa · ${Math.round(isaC(h))} °C`} px={42} color={JK.hielo} opacidad={anillo} id="ascenso-kpa" />
      <Fuente texto="Atmósfera estándar ISA (cálculo propio): 101,3 kPa al nivel del mar → 23,8 kPa a 10.668 m (23,5 %)." y={1546} delay={A.asc} />
      <Cap e={e} />
    </Cielo>
  );
};

/* ───────────── jet-aire ───────────── */

export const JetAire: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const A = TJET.aire;
  const cam = easeOut((t - a(A.camaras)) / a(0.7));
  const sube = easeInOut((t - a(A.sube)) / a(A.subeDur));
  const hRight = JET.fl350M * sube;
  const nRight = 44 * (isaKPa(hRight) / isaKPa(0));
  const kPio = easeOut((t - a(A.pio)) / a(A.pioDur));
  const pioR = lerp(pio2MmHg(0), pio2MmHg(JET.fl350M), kPio);
  const tag21 = easeOut((t - a(A.o2)) / a(0.6));
  const filas = [
    { n: "Nivel del mar", v: pio2MmHg(0), c: JK.cian },
    { n: "Cabina · 2.400 m", v: pio2MmHg(JET.cabinaM), c: "#7CC7FF" },
    { n: "Cima del Everest", v: pio2MmHg(JET.everestM), c: JK.ambar },
    { n: "Jet · 10.668 m", v: pio2MmHg(JET.fl350M), c: JK.rojo },
  ];
  const ever = sua(t, a(A.ever - 0.2), a(A.ever + 0.5));
  return (
    <Estudio piso={1700} resplandor={0.35}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Camara x={110} y={668} w={380} h={360} n={44} t={t} semilla={3} titulo="NIVEL DEL MAR" opacidad={cam} />
        <Camara x={590} y={668} w={380} h={360} n={nRight} t={t} semilla={7} titulo={`${fmtNum(hRight, 0)} m`} color={mezclar(JK.hielo, JK.ambar, sube)} opacidad={cam} />
        {/* etiqueta del 21 % (igual en las dos) */}
        <g opacity={tag21}>
          {[110, 590].map((x0) => (
            <g key={x0} transform={`translate(${x0 + 190} 1070)`}>
              <rect x={-150} y={-24} width={300} height={48} rx={24} fill="rgba(8,24,40,0.82)" stroke={JK.cian} strokeWidth={2.5} />
              <O2 x={0} y={9} px={27} color={JK.cian} anchor="middle" pre="21 % de " />
            </g>
          ))}
        </g>
        {/* barras de comparación */}
        {filas.map((fl, i) => {
          const ki = easeOut((t - a(A.barras + i * 0.36)) / a(0.7));
          const y = 1228 + i * 66;
          const resalta = i === 3;
          return (
            <g key={i} opacity={clamp(ki * 2)}>
              <text x={108} y={y + 31} fontFamily={MONOF} fontWeight={700} fontSize={26} fill={resalta ? "#fff" : JK.hielo}>{fl.n}</text>
              <rect x={440} y={y} width={440} height={44} rx={22} fill="rgba(190,224,255,0.1)" />
              <rect x={440} y={y} width={Math.max(8, (440 * fl.v * ki) / pio2MmHg(0))} height={44} rx={22} fill={fl.c} opacity={resalta ? 1 : 0.88} />
              <text x={902} y={y + 33} fontFamily={MONOF} fontWeight={800} fontSize={30} fill={resalta ? JK.rojo : "#fff"}>{Math.round(fl.v * ki)}</text>
            </g>
          );
        })}
        {ever > 0 && <g opacity={ever}><rect x={96} y={1228 + 2 * 66 - 8} width={888} height={60} rx={30} fill="none" stroke={JK.ambar} strokeWidth={3} /></g>}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "MISMO AIRE:\n21 % OXÍGENO", px: 92 }, { t: 3.2, texto: "5,4 VECES\nMENOS O2", px: 100, color: JK.ambar }]} y={480} x={104} id="titular-aire" />
      <Lectura x={300} y={1100} ancho={380} alinear="center" valor={`${Math.round(pio2MmHg(0))} mmHg`} px={46} color={JK.cian} opacidad={cam} id="aire-izq" />
      <Lectura x={780} y={1100} ancho={380} alinear="center" valor={`${Math.round(pioR)} mmHg`} px={46} color={mezclar(JK.cian, JK.rojo, kPio)} opacidad={cam * clamp((t - a(A.sube)) / 0.5)} id="aire-der" />
      <div data-texto="aire-pie" style={{ position: "absolute", left: 104, top: 1486, width: 872, fontFamily: FONT, fontWeight: 700, fontSize: 30, color: ever > 0 ? JK.ambar : JK.hielo, opacity: clamp((t - a(A.barras)) / 0.6) }}>{ever > 0.5 ? "Menos oxígeno que en la cima del Everest" : "presión de oxígeno que llega a los pulmones (mmHg)"}</div>
      <Fuente texto="PiO2 = 0,2095 × (P − 47 mmHg), atmósfera estándar ISA · cálculo propio. Las moléculas son un esquema." y={1546} delay={A.barras} />
      <Cap e={e} />
    </Estudio>
  );
};

/* ───────────── jet-cabina ───────────── */

/** Corte transversal de la cabina presurizada de un jet de negocios (esquema). `interior` 0–1 = presión relativa adentro; `t` en s. */
const Seccion: React.FC<{ cx: number; cy: number; t: number; entra: number; interior: number; fuga: number; moleculasIn: number; moleculasOut: number; alerta: number }> = ({ cx, cy, t, entra, interior, fuga, moleculasIn, moleculasOut, alerta }) => {
  const uid = useUid();
  const RX = 350, RY = 335, IX = 312, IY = 297;
  const elipse = (rx: number, ry: number, rev = false): string => (rev ? `M ${-rx} 0 A ${rx} ${ry} 0 1 1 ${rx} 0 A ${rx} ${ry} 0 1 1 ${-rx} 0 Z` : `M ${-rx} 0 A ${rx} ${ry} 0 1 0 ${rx} 0 A ${rx} ${ry} 0 1 0 ${-rx} 0 Z`);
  const calido = mezclar("#FFF2D8", "#BCD8FA", fuga);
  const calidoB = mezclar("#E2BC86", "#6F93C9", fuga);
  const pasajeros = [
    { x: -118, piel: "#D9A47E", cam: "#27456B" },
    { x: 118, piel: "#8A5A3C", cam: "#6B2F3A" },
  ];
  const pulso = (alerta > 0 ? 0.4 + 0.6 * Math.max(0, Math.sin(t * 9)) : 0) * alerta;
  return (
    <g transform={`translate(${cx} ${cy})`} opacity={clamp(entra * 1.5)}>
      <defs>
        <radialGradient id={`${uid}in`} cx="50%" cy="40%" r="70%"><stop offset="0" stopColor={calido} /><stop offset="1" stopColor={calidoB} /></radialGradient>
        <linearGradient id={`${uid}sh`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F4F7FA" /><stop offset="0.3" stopColor="#8E9BAC" /><stop offset="0.65" stopColor="#D6DDE6" /><stop offset="1" stopColor="#3C4756" /></linearGradient>
        <linearGradient id={`${uid}ve`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1C3A78" /><stop offset="0.7" stopColor="#F3A25F" /><stop offset="1" stopColor="#FFD9A0" /></linearGradient>
        <linearGradient id={`${uid}sa`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5C463C" /><stop offset="1" stopColor="#2B1F1B" /></linearGradient>
        <clipPath id={`${uid}ck`}><path d={elipse(IX, IY)} /></clipPath>
        <radialGradient id={`${uid}gl`} cx="50%" cy="50%" r="50%"><stop offset="0.7" stopColor="#FFC27A" stopOpacity={0.35 * (1 - fuga)} /><stop offset="1" stopColor="#FFC27A" stopOpacity="0" /></radialGradient>
        <filter id={`${uid}bl`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="20" /></filter>
      </defs>
      {/* halo cálido */}
      <ellipse cx={0} cy={0} rx={RX + 90} ry={RY + 90} fill={`url(#${uid}gl)`} />
      {/* interior */}
      <path d={elipse(IX, IY)} fill={`url(#${uid}in)`} />
      <g clipPath={`url(#${uid}ck)`}>
        {/* suelo y pasillo */}
        <path d="M -330 118 L 330 118 L 330 320 L -330 320 Z" fill="#232A38" />
        <path d="M -330 118 L 330 118" stroke="#6B7690" strokeWidth={3} />
        <path d="M -52 118 L 52 118 L 86 320 L -86 320 Z" fill="#3A4560" />
        <path d="M -40 126 L -70 320 M 40 126 L 70 320" stroke="#FFE2A6" strokeWidth={3} opacity={0.6} />
        {/* panel del techo y salidas de aire */}
        <path d="M -150 -300 L 150 -300 L 130 -246 L -130 -246 Z" fill="#CFC6B2" stroke="#8A8068" strokeWidth={2} />
        {[-80, -30, 30, 80].map((x) => <circle key={x} cx={x} cy={-266} r={7} fill="#FFF3C9" />)}
        {/* flujo de aire acondicionado (cae desde el techo) */}
        {[-1, 1].map((sg) => [0, 1, 2].map((j) => (
          <path key={`${sg}${j}`} d={`M ${sg * (60 + j * 18)} -240 C ${sg * (170 + j * 30)} -190 ${sg * (190 + j * 24)} -60 ${sg * (150 + j * 14)} 40`} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" strokeDasharray="10 22" strokeDashoffset={-t * 70 - j * 9} opacity={0.5 * (1 - fuga)} />
        )))}
        {/* asientos y pasajeros */}
        {pasajeros.map((p, i) => (
          <g key={i} transform={`translate(${p.x} 0)`}>
            <rect x={-62} y={-8} width={124} height={176} rx={34} fill={`url(#${uid}sa)`} stroke="#8F7B6E" strokeOpacity={0.5} strokeWidth={2} />
            <path d={`M -48 14 C -48 -14 -30 -30 0 -30 C 30 -30 48 -14 48 14 L 52 112 L -52 112 Z`} fill={p.cam} />
            <path d="M -48 14 C -48 -14 -30 -30 0 -30" fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={3} />
            <rect x={-12} y={-46} width={24} height={22} rx={8} fill={p.piel} />
            <circle cx={0} cy={-82} r={36} fill={p.piel} />
            <path d={`M -36 -86 C -34 -122 36 -122 36 -86 C 30 -104 -30 -104 -36 -86 Z`} fill="#22140D" />
            <circle cx={0} cy={-82} r={36} fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={2} />
            <rect x={-72} y={104} width={144} height={22} rx={10} fill="#3C2F28" />
            <rect x={-76} y={44} width={22} height={76} rx={10} fill="#4A3B32" /><rect x={54} y={44} width={22} height={76} rx={10} fill="#4A3B32" />
          </g>
        ))}
        {/* mesita central */}
        <rect x={-46} y={70} width={92} height={10} rx={5} fill="#D9C79D" stroke="#8A7550" strokeWidth={2} />
        <rect x={-6} y={80} width={12} height={40} fill="#8A7550" />
        {/* moléculas de aire dentro (densas) */}
        {Array.from({ length: 80 }, (_, i) => {
          const vis = clamp(moleculasIn - i);
          if (vis <= 0.01) return null;
          const x = -IX + rebote(azar(i * 3.1) * 2 * IX + (40 + azar(i) * 80) * t * (i % 2 ? 1 : -1), 2 * IX);
          const y = -IY + rebote(azar(i * 5.7) * 2 * IY + (40 + azar(i * 2) * 80) * t * (i % 3 ? 1 : -1), 2 * IY);
          return <circle key={i} cx={x} cy={y} r={4.4} fill="#FFFFFF" opacity={0.55 * vis} />;
        })}
        {/* luz de alerta de altitud de cabina */}
        {alerta > 0 && <g><rect x={-84} y={-228} width={168} height={36} rx={8} fill={JK.rojo} opacity={0.25 + 0.75 * pulso} /><text x={0} y={-203} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={24} fill="#fff" opacity={0.6 + 0.4 * pulso}>CABIN ALT</text></g>}
      </g>
      {/* casco metálico (ring con evenodd) */}
      <path d={elipse(RX, RY) + " " + elipse(IX, IY, true)} fill={`url(#${uid}sh)`} fillRule="evenodd" />
      <path d={elipse(RX, RY)} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={2} />
      <path d={elipse(IX + 10, IY + 10)} fill="none" stroke="#0A1018" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="3 9" />
      {/* ventanas cortando la pared */}
      {[-1, 1].map((sg) => <ellipse key={sg} cx={sg * 331} cy={-30} rx={18} ry={44} fill={`url(#${uid}ve)`} stroke="#EFE7D6" strokeWidth={5} />)}
      <ellipse cx={-120} cy={-260} rx={140} ry={30} fill="#fff" opacity={0.08} transform="rotate(-14)" />
    </g>
  );
};

export const JetCabina: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TJET.cabina;
  const entra = easeOut((t - a(C.casco)) / a(0.9));
  const fuga = easeInOut((t - a(C.fuga)) / a(1.2));
  const nIn = lerp(80, 28, fuga);
  const alerta = sua(t, a(C.fuga + 0.2), a(C.fuga + 0.5));
  const gauge = spr(f, a(C.gauge), { damping: 14, stiffness: 140, mass: 0.7 });
  const CX = 540, CY = 905;
  // moléculas de afuera: escasas y frías; rayas de velocidad que salen del casco hacia el espectador
  const afuera = Array.from({ length: 26 }, (_, i) => {
    const x = 40 + rebote(azar(i * 3.9) * 1000 + (30 + azar(i) * 70) * t * (i % 2 ? 1 : -1), 1000);
    const y = 520 + rebote(azar(i * 7.3) * 770 + (30 + azar(i * 2) * 70) * t * (i % 3 ? 1 : -1), 770);
    const dx = (x - CX) / 366, dy = (y - CY) / 351;
    return { x, y, fuera: dx * dx + dy * dy > 1, o2: i % 5 === 2 };
  });
  return (
    <Estudio piso={1720} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* rayas de velocidad radiales */}
        {Array.from({ length: 30 }, (_, i) => {
          const ang = (i / 30) * Math.PI * 2 + azar(i) * 0.2;
          const u = (((t * (0.55 + azar(i * 3.3) * 0.5) + azar(i * 5.5)) % 1) + 1) % 1;
          const r0 = 380 + u * 330, r1 = r0 + 20 + u * 120;
          const x0 = CX + Math.cos(ang) * r0 * 1.02, y0 = CY + Math.sin(ang) * r0 * 0.98, x1 = CX + Math.cos(ang) * r1 * 1.02, y1 = CY + Math.sin(ang) * r1 * 0.98;
          if (y0 < 420 || y1 < 420 || y0 > 1480 || y1 > 1480 || x0 < 20 || x0 > 1060) return null;
          return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke="#CFE8FF" strokeWidth={2 + u * 3} strokeLinecap="round" opacity={0.28 * Math.sin(u * Math.PI) * entra} />;
        })}
        {afuera.map((m, i) => (m.fuera ? <g key={i} transform={`translate(${m.x} ${m.y}) rotate(${(t * 90 + i * 40) % 360})`} opacity={0.85 * entra}><circle cx={-6} r={6} fill={m.o2 ? JK.cian : JK.acero} /><circle cx={6} r={6} fill={m.o2 ? JK.cian : JK.acero} /></g> : null))}
        <Seccion cx={CX} cy={CY} t={t} entra={entra} interior={1 - fuga} fuga={fuga} moleculasIn={nIn} moleculasOut={26} alerta={alerta} />
        {/* resplandor de la ventana */}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "UNA BURBUJA\nDE PRESIÓN", px: 94 }, { t: 3.2, texto: "≈ 2.400 m\nEQUIVALENTES", px: 94, color: JK.ambar }, { t: C.fuga, texto: "¿Y SI LA BURBUJA\nSE PIERDE?", px: 84, color: JK.rojo }]} y={470} x={104} id="titular-cabina" />
      <div style={{ opacity: clamp(gauge * 2) }}>
        <Lectura x={110} y={1342} ancho={420} titulo="AFUERA" valor={`${fmtNum(isaKPa(JET.fl350M), 0)} kPa`} sub={`10.668 m · ${Math.round(isaC(JET.fl350M))} °C`} color={JK.hielo} px={56} colorTitulo={JK.acero} id="cabina-fuera" />
        <Lectura x={970} y={1342} ancho={420} alinear="right" titulo="ADENTRO" valor={`≈ ${fmtNum(isaKPa(JET.cabinaM), 0)} kPa`} sub="≈ 2.400 m (8.000 pies)" color={JK.ambar} px={56} colorTitulo={JK.ambar} id="cabina-dentro" />
      </div>
      <Fuente texto="Límite regulatorio de altitud de cabina ≈ 8.000 pies (14 CFR 25.841). Esquema, no a escala." y={1546} delay={C.gauge} />
      <Cap e={e} />
    </Estudio>
  );
};
