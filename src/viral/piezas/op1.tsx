/**
 * «El nervio óptico: la parte del cerebro que sale a mirar» (SINAPSIS · pares craneales) · escenas 1/2
 *   op-gancho   el nervio óptico no es un nervio común: es una extensión del cerebro
 *   op-origen   nace del diencéfalo, lo envuelven las meninges y lleva cerca de un millón de fibras
 *   op-ciego    donde el nervio sale del ojo no hay fotorreceptores: el punto ciego que el cerebro rellena
 *   op-quiasma  en el quiasma se cruzan las fibras nasales: lo que ves a la izquierda lo procesa el hemisferio derecho
 * Dibujos esquemáticos de anatomía; no son imágenes médicas reales.
 */
import React from "react";
import { OP, TOP } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Ambiente, Cerebro, Chip, FONT, ME, OPC, Ojo, PC, azar, polyPt } from "./op-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── op-gancho ───────────── */

const TAL_L: [number, number][] = [[505, 905], [480, 975], [430, 1035], [352, 1098]];
const TAL_R: [number, number][] = [[575, 905], [600, 975], [650, 1035], [728, 1098]];
export const OpGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TOP.gancho;
  const kBr = clamp((t - a(G.par)) / 0.5), kTa = easeOut((t - a(G.optico)) / a(1.6)), kOj = clamp((kTa - 0.55) * 2.2);
  const kEx = spr(f, a(G.extension), { damping: 10, stiffness: 180, mass: 0.8 });
  const pts = (arr: [number, number][]): string => arr.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
  const pulso = (off: number): number => ((t * 0.55 + off) % 1);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={950} color={OPC.cereb} intensidad={0.8 + 0.6 * kEx} />
        <g opacity={kBr}><Cerebro x={540} y={830} s={1.3} brillo={0.6 + 0.4 * kEx} t={t} /></g>
        {[TAL_L, TAL_R].map((tal, i) => (
          <g key={i}>
            <path d={pts(tal)} pathLength={1} stroke={OPC.cereb} strokeWidth={30} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${kTa} 2`} opacity={0.35} />
            <path d={pts(tal)} pathLength={1} stroke={OPC.cereb} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${kTa} 2`} />
            {kTa > 0.4 && [0, 0.5].map((o) => { const [px, py] = polyPt(tal, pulso(o + i * 0.25)); return <circle key={o} cx={px} cy={py} r={8} fill="#fff" opacity={0.9} />; })}
          </g>
        ))}
        <Ojo x={330} y={1160} r={74} iris="#4FA3FF" brillo={kEx} t={t} opacidad={kOj} />
        <Ojo x={750} y={1160} r={74} iris="#4FA3FF" brillo={kEx} t={t} opacidad={kOj} />
      </svg>
      <Chip x={104} y={1010} texto={"TEJIDO\nCEREBRAL"} color={OPC.cereb} px={22} id="op-g-tej" opacidad={clamp(kTa * 2)} />
      <Chip x={976} y={1010} texto={"NERVIO ÓPTICO\npar craneal II"} color={"#BFE0FF"} px={22} anchor="right" id="op-g-op" opacidad={clamp(kTa * 2)} />
      <Chip x={540} y={1300} texto={"EXTENSIÓN DEL CEREBRO"} color={OPC.dato} px={30} anchor="center" id="op-g-ext" opacidad={clamp(kEx * 1.5)} />
      <Frases frases={[{ t: 0.2, texto: "EL PAR\nCRANEAL II", px: 100 }, { t: G.comun - 0.1, texto: "NO ES UN\nNERVIO COMÚN", px: 90, color: "#BFE0FF" }, { t: G.extension - 0.1, texto: "ES PARTE\nDE TU CEREBRO", px: 90, color: OPC.cereb }]} y={450} x={104} id="titular-op-gancho" />
      <Fuente texto="El nervio óptico se forma como una prolongación del diencéfalo embrionario; por eso se considera parte del sistema nervioso central. Esquema, no a escala." y={1510} delay={G.comun} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── op-origen ───────────── */

const SX = 590, SY = 1060, SR = 205;
const AXONES = Array.from({ length: 380 }, (_, i) => { const ang = azar(i * 1.7) * Math.PI * 2, rad = Math.sqrt(azar(i * 3.1 + 0.5)) * (SR - 40); return [SX + Math.cos(ang) * rad, SY + Math.sin(ang) * rad] as [number, number]; });
export const OpOrigen: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const O = TOP.origen;
  const kDi = clamp((t - a(O.diencefalo)) / 0.6), kMe = clamp((t - a(O.meninges)) / 0.6), kMi = clamp((t - a(O.millon)) / a(1.8));
  const nVis = Math.floor(70 + 310 * easeOut(kMi)), n = Math.round(OP.fibras.tipico * easeOut(kMi));
  const fmt = (v: number): string => v.toLocaleString("es-CO").replace(/\./g, " ").replace(/,/g, " ");
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={OPC.cereb} intensidad={0.7} />
        <g opacity={kDi}>
          <Cerebro x={190} y={850} s={0.62} brillo={0.4} t={t} />
          <circle cx={198} cy={878} r={18 + 3 * Math.sin(t * 6)} fill="none" stroke={OPC.dato} strokeWidth={4} />
          <path d="M 236 900 C 300 930 330 980 372 1010" stroke={OPC.dato} strokeWidth={5} fill="none" strokeDasharray="10 8" strokeLinecap="round" />
          <path d="M 352 1012 L 376 1014 L 366 992" stroke={OPC.dato} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <circle cx={SX} cy={SY} r={SR} fill="#141C3C" stroke="#8B6B4A" strokeWidth={14} />
        <g opacity={kMe}>
          <circle cx={SX} cy={SY} r={SR - 14} fill="none" stroke="#C9B79A" strokeWidth={6} /><circle cx={SX} cy={SY} r={SR - 24} fill="none" stroke="#E8B4B8" strokeWidth={6} />
        </g>
        {AXONES.slice(0, nVis).map(([px, py], i) => <g key={i}><circle cx={px} cy={py} r={7} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={1.5} /><circle cx={px} cy={py} r={4} fill={OPC.dato} /></g>)}
        {kMe > 0.5 && [[530, 1000], [640, 1110]].map(([cx, cy], i) => (
          <g key={i} opacity={clamp((kMe - 0.5) * 2)}>
            {[0, 1, 2, 3].map((k) => { const an = (k / 4) * Math.PI * 2 + i; return <line key={k} x1={cx} y1={cy} x2={cx + Math.cos(an) * 44} y2={cy + Math.sin(an) * 44} stroke="#7BE08A" strokeWidth={4} strokeLinecap="round" />; })}
            <circle cx={cx} cy={cy} r={13} fill="#7BE08A" stroke="#fff" strokeWidth={2} />
          </g>
        ))}
      </svg>
      <Chip x={104} y={960} texto="DIENCÉFALO" color={OPC.dato} px={24} id="op-o-di" opacidad={kDi} />
      <Chip x={976} y={1060} texto={"MENINGES"} color={"#E8B4B8"} px={24} anchor="right" id="op-o-me" opacidad={kMe} />
      <Chip x={976} y={1275} texto={"oligodendrocito: mielina\ndel cerebro (no células de Schwann)"} color={"#7BE08A"} px={18} anchor="right" id="op-o-oli" opacidad={clamp((kMe - 0.5) * 2)} />
      <Chip x={104} y={1290} texto={`≈ ${fmt(n)}\nFIBRAS`} color={OPC.dato} px={30} id="op-o-mil" opacidad={clamp(kMi * 3)} />
      <Frases frases={[{ t: 0.2, texto: "NACE DEL\nDIENCÉFALO", px: 96 }, { t: O.meninges - 0.1, texto: "LO ENVUELVEN\nLAS MENINGES", px: 84, color: "#E8B4B8" }, { t: O.millon - 0.1, texto: "≈ 1 MILLÓN\nDE FIBRAS", px: 96, color: OPC.dato }]} y={450} x={104} id="titular-op-origen" />
      <Fuente texto={`Cada nervio óptico contiene entre ${fmt(OP.fibras.min)} y ${fmt(OP.fibras.max)} axones de células ganglionares de la retina («cerca de un millón»). Corte esquemático, no a escala.`} y={1510} delay={O.millon} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── op-ciego ───────────── */

const EC: [number, number] = [440, 900], ER = 125;
export const OpCiego: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TOP.ciego;
  const kSa = clamp((t - a(C.sale)) / 0.6), kSf = clamp((t - a(C.sinFoto)) / 0.5), kPa = clamp((t - a(C.punto)) / 0.5), kRe = clamp((t - a(C.rellena)) / 0.8);
  const kPop = spr(f, a(C.punto), { damping: 10, stiffness: 180, mass: 0.8 });
  const ang = (deg: number): [number, number] => [EC[0] + (ER - 12) * Math.cos((deg * Math.PI) / 180), EC[1] + (ER - 12) * Math.sin((deg * Math.PI) / 180)];
  const ticks = Array.from({ length: 31 }, (_, i) => -75 + i * 5).filter((d) => d < 8 || d > 22);
  const disco = ang(15);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={950} color={OPC.rojo} intensidad={0.3 + 0.6 * kRe} />
        <g opacity={kSa}>
          <circle cx={EC[0]} cy={EC[1]} r={ER} fill="#0F1730" stroke="#8B97B8" strokeWidth={6} />
          <ellipse cx={EC[0] - ER + 8} cy={EC[1]} rx={16} ry={60} fill="none" stroke="#BFE0FF" strokeWidth={5} /><ellipse cx={EC[0] - ER + 52} cy={EC[1]} rx={13} ry={44} fill="#BFE0FF" opacity={0.5} stroke="#BFE0FF" strokeWidth={3} />
          {[[-34, -30], [0, 0], [34, 30]].map(([y0, y1], i) => <path key={i} d={`M 200 ${EC[1] + y0 * 1.2} L ${EC[0] - ER + 52} ${EC[1] + y0 * 0.6} L ${i === 1 ? disco[0] - 6 : ang(-30 + i * 38)[0]} ${i === 1 ? disco[1] - 2 : ang(-30 + i * 38)[1]}`} stroke={i === 1 && kSf > 0.5 ? OPC.rojo : "#FFE38A"} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.75} />)}
          {ticks.map((d) => { const p0 = ang(d), p1 = [EC[0] + (ER - 28) * Math.cos((d * Math.PI) / 180), EC[1] + (ER - 28) * Math.sin((d * Math.PI) / 180)]; return <line key={d} x1={p0[0]} y1={p0[1]} x2={p1[0]} y2={p1[1]} stroke={d % 10 === 0 ? "#FFB347" : "#8FA3C8"} strokeWidth={5} strokeLinecap="round" />; })}
          <path d={`M ${disco[0]} ${disco[1]} C 600 930 650 950 700 960 L 860 990`} stroke={OPC.cereb} strokeWidth={30} fill="none" strokeLinecap="round" opacity={0.9} />
          {kSf > 0 && <circle cx={disco[0]} cy={disco[1]} r={(26 + 6 * Math.sin(t * 6)) * kSf} fill="none" stroke={OPC.rojo} strokeWidth={5} />}
        </g>
        {/* demostración del punto ciego (Mariotte) */}
        <g opacity={kPa}>
          <rect x={104} y={1110} width={872} height={190} rx={18} fill="#0F1730" stroke="#4A5C92" strokeWidth={4} />
          {Array.from({ length: 24 }, (_, i) => <line key={i} x1={110 + i * 36} y1={1112} x2={Math.min(970, 110 + i * 36 + 60)} y2={1298} stroke="#6C7BB0" strokeOpacity={0.22} strokeWidth={6} />)}
          <path d="M 250 1175 L 250 1235 M 220 1205 L 280 1205" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
          <circle cx={790} cy={1205} r={30 * kPop} fill={OPC.dato} opacity={1 - kRe} />
          {kRe > 0 && <circle cx={790} cy={1205} r={48} fill="none" stroke={OPC.verde} strokeWidth={4} strokeDasharray="8 8" opacity={kRe} />}
        </g>
      </svg>
      <Chip x={600} y={790} texto={"PAPILA ÓPTICA\nsin fotorreceptores"} color={OPC.rojo} px={22} id="op-c-papila" opacidad={kSf} />
      <Chip x={128} y={1124} texto={"TAPA UN OJO · MIRA EL +"} color="#BFE0FF" px={20} id="op-c-mira" opacidad={kPa} />
      <Chip x={956} y={1262} texto={"el ● desaparece: tu cerebro rellena"} color={OPC.verde} px={20} anchor="right" id="op-c-rell" opacidad={kRe} />
      <Frases frases={[{ t: 0.2, texto: "DONDE SALE\nEL NERVIO", px: 90 }, { t: C.sinFoto - 0.1, texto: "SIN FOTO-\nRRECEPTORES", px: 90, color: OPC.rojo }, { t: C.punto - 0.1, texto: "UN PUNTO\nCIEGO", px: 100, color: OPC.dato }, { t: C.rellena - 0.1, texto: "TU CEREBRO\nLO RELLENA", px: 92, color: OPC.verde }]} y={450} x={104} id="titular-op-ciego" />
      <Fuente texto="El disco óptico no tiene conos ni bastones: es el punto ciego fisiológico de cada ojo, que el cerebro rellena (Mariotte, siglo XVII). Esquema, no a escala." y={1510} delay={C.punto} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── op-quiasma ───────────── */

const RUTAS: { pts: [number, number][]; col: string }[] = [
  { pts: [[362, 880], [470, 950], [540, 1000], [620, 1070], [690, 1160], [702, 1290]], col: OPC.izq },
  { pts: [[338, 880], [430, 960], [520, 1010], [450, 1090], [380, 1160], [378, 1290]], col: OPC.der },
  { pts: [[742, 880], [650, 960], [560, 1010], [630, 1090], [678, 1160], [678, 1290]], col: OPC.izq },
  { pts: [[718, 880], [610, 950], [540, 1000], [460, 1070], [402, 1160], [402, 1290]], col: OPC.der },
];
export const OpQuiasma: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const Q = TOP.quiasma;
  const kQ = clamp((t - a(Q.quiasma)) / 0.5), kF = easeOut((t - a(Q.quiasma)) / a(1.6)), kIz = clamp((t - a(Q.izquierda)) / 0.5), kDe = spr(f, a(Q.derecho), { damping: 10, stiffness: 180, mass: 0.8 });
  const path = (pts: [number, number][]): string => pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={kDe > 0.3 ? OPC.izq : OPC.cereb} intensidad={0.7} />
        <ellipse cx={390} cy={1215} rx={140} ry={120} fill={OPC.cereb} opacity={0.14} stroke={OPC.cereb} strokeWidth={4} />
        <ellipse cx={690} cy={1215} rx={140} ry={120} fill={kDe > 0.3 ? OPC.izq : OPC.cereb} opacity={0.14 + 0.2 * kDe} stroke={kDe > 0.3 ? OPC.izq : OPC.cereb} strokeWidth={4 + 4 * kDe} />
        {[350, 730].map((cx) => (
          <g key={cx}><circle cx={cx} cy={820} r={62} fill="#E4EAF8" stroke="#5C6A90" strokeWidth={5} /><circle cx={cx} cy={780} r={24} fill="#4FA3FF" stroke="#1B2A55" strokeWidth={3} /><circle cx={cx} cy={780} r={9} fill="#0A0F1F" /></g>
        ))}
        {RUTAS.map((r, i) => (
          <g key={i}>
            <path d={path(r.pts)} pathLength={1} stroke={r.col} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${kF} 2`} opacity={0.9} />
            {kF > 0.95 && [0, 0.5].map((o) => { const [px, py] = polyPt(r.pts, (t * 0.35 + o + i * 0.2) % 1); return <circle key={o} cx={px} cy={py} r={9} fill="#fff" />; })}
          </g>
        ))}
        <circle cx={540} cy={1000} r={14 + 3 * Math.sin(t * 6)} fill={OPC.dato} opacity={kQ} />
      </svg>
      <Chip x={104} y={690} texto={"CAMPO\nIZQUIERDO"} color={OPC.izq} px={24} id="op-q-izq" opacidad={clamp(kIz * 2)} />
      <Chip x={976} y={690} texto={"CAMPO\nDERECHO"} color={OPC.der} px={24} anchor="right" id="op-q-der" opacidad={clamp(kIz * 2)} />
      <Chip x={540} y={905} texto="QUIASMA" color={OPC.dato} px={22} anchor="center" id="op-q-qui" opacidad={kQ} />
      <Chip x={690} y={1190} texto={"HEMISFERIO\nDERECHO"} color={OPC.izq} px={20} anchor="center" id="op-q-hd" opacidad={clamp(kDe * 2)} />
      <Chip x={390} y={1190} texto={"HEMISFERIO\nIZQUIERDO"} color={OPC.der} px={20} anchor="center" id="op-q-hi" opacidad={clamp(kDe * 2)} />
      <Frases frases={[{ t: 0.2, texto: "EL QUIASMA\nÓPTICO", px: 96 }, { t: Q.cruzan - 0.1, texto: "SE CRUZAN LAS\nFIBRAS NASALES", px: 80, color: OPC.dato }, { t: Q.izquierda - 0.1, texto: "LO IZQUIERDO\nVA A LA DERECHA", px: 80, color: OPC.izq }]} y={450} x={104} id="titular-op-quiasma" />
      <Fuente texto={`Las fibras de la retina nasal de cada ojo se cruzan en el quiasma: el campo visual izquierdo de ambos ojos llega al hemisferio ${OP.campoIzquierdoVa}. Vista desde arriba, esquema.`} y={1510} delay={Q.cruzan} />
      <Cap e={e} />
    </Fondo>
  );
};
