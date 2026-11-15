/**
 * «El par craneal VII: el nervio de los gestos» (SINAPSIS · pares craneales) · escenas 1/2
 *   fa-gancho  si la mitad de la cara se cae: ¿parálisis de Bell o ictus? La frente da una pista
 *   fa-gestos  el facial es el nervio de los gestos: sonreír, guiñar, fruncir el ceño o soplar una vela
 *   fa-extras  también da el gusto de la punta de la lengua y manda a producir lágrimas y saliva
 *   fa-tunel   viaja por un túnel estrecho en el hueso del oído y sale junto a la oreja, abriéndose en ramas por la cara
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { FA, TFA } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Ambiente, CaraGesto, Chip, FAC, FONT, Gota, Lengua, MONOF, PC, polyPt } from "./fa-kit";

type P = { e: EscenaViralGuardada };
const path = (pts: [number, number][]): string => pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");

/* ───────────── fa-gancho ───────────── */

export const FaGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TFA.gancho;
  const kCa = easeOut((t - a(G.cae)) / 1.2), kBe = spr(f, a(G.bell), { damping: 10, stiffness: 190, mass: 0.8 }), kIc = spr(f, a(G.ictus), { damping: 10, stiffness: 190, mass: 0.8 }), kPi = clamp((t - a(G.pista)) / 0.5);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1010} color={kPi > 0.3 ? FAC.oro : FAC.rojo} intensidad={0.5 + 0.5 * kCa} />
        <CaraGesto x={540} y={1000} s={0.74} lado={-1} caida={kCa} frenteCae={1} />
        {kPi > 0 && <g opacity={kPi}><rect x={376} y={806} width={328} height={76} rx={30} fill="none" stroke={FAC.oro} strokeWidth={7} strokeDasharray={kPi < 1 ? "14 10" : "0"} /><path d="M 820 800 L 720 830" stroke={FAC.oro} strokeWidth={7} strokeLinecap="round" /><path d="M 744 804 L 718 832 L 750 840" stroke={FAC.oro} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
        {[[200, kBe, FAC.facial, "PARÁLISIS DE BELL", "tg"], [880, kIc, FAC.rojo, "ICTUS", "ic"]].map(([cx, k, c, tx, id], i) => (
          <g key={i} transform={`translate(${cx as number} 1300) scale(${k as number})`} opacity={clamp((k as number) * 2)}><rect x={-165} y={-44} width={330} height={88} rx={22} fill="rgba(11,18,40,0.92)" stroke={c as string} strokeWidth={6} /><text y={10} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={24} fill="#E6EDFF" data-texto={`fa-g-${id}`}>{tx as string}</text></g>
        ))}
        {kIc > 0.1 && <text x={540} y={1318} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={70} fill={FAC.oro} opacity={kIc}>?</text>}
      </svg>
      <Chip x={976} y={706} texto={"LA FRENTE\nDA LA PISTA"} color={FAC.oro} px={26} anchor="right" id="fa-g-pista" opacidad={kPi} />
      <Frases frases={[{ t: 0.2, texto: "SI LA MITAD DE\nLA CARA SE CAE…", px: 82 }, { t: G.bell - 0.1, texto: "¿PARÁLISIS DE\nBELL O ICTUS?", px: 84, color: FAC.facial }, { t: G.pista - 0.1, texto: "LA FRENTE\nDA UNA PISTA", px: 92, color: FAC.oro }]} y={450} x={104} id="titular-fa-gancho" />
      <Fuente texto="Una caída brusca de la mitad de la cara es una urgencia médica: tanto la parálisis de Bell como un ictus requieren valoración inmediata. La frente es solo una pista clínica, no un diagnóstico. Esquema; no es consejo médico." y={1510} delay={G.bell} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── fa-gestos ───────────── */

export const FaGestos: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const G = TFA.gestos;
  const kPar = clamp((t - a(G.par)) / 0.5), kGe = clamp((t - a(G.gestos)) / 0.5);
  const g = (t0: number): number => easeOut((t - a(t0)) / 0.5) * (1 - 0.15 * clamp((t - a(t0) - 1.4) / 0.6));
  const kSo = g(G.sonreir), kGu = g(G.guinar), kCe = g(G.ceno), kVe = g(G.vela);
  const celdas: [number, number, string, string][] = [[300, 880, "SONREÍR", "fa-ge-so"], [780, 880, "GUIÑAR", "fa-ge-gu"], [300, 1150, "FRUNCIR EL CEÑO", "fa-ge-ce"], [780, 1150, "SOPLAR UNA VELA", "fa-ge-ve"]];
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1030} color={FAC.facial} intensidad={0.7} />
        <g opacity={kGe}>
          <CaraGesto x={300} y={880} s={0.4} sonrisa={kSo} />
          <CaraGesto x={780} y={880} s={0.4} guino={kGu} sonrisa={0.4 * kGu} />
          <CaraGesto x={300} y={1150} s={0.4} ceno={kCe} />
          <CaraGesto x={780} y={1150} s={0.4} soplo={kVe} />
        </g>
        {/* vela */}
        <g opacity={kGe} transform="translate(930 1170)"><rect x={-9} y={0} width={18} height={70} rx={4} fill="#F4E9D0" /><path d={`M 0 -6 C ${10 + 24 * kVe} -26 ${6 + 30 * kVe} -46 ${-4 + 26 * kVe} -58 C ${-10 + 20 * kVe} -38 ${-16} -22 0 -6 Z`} fill="#FFB347" opacity={1 - 0.7 * kVe} /></g>
      </svg>
      {celdas.map(([cx, cy, tx, id], i) => <Chip key={id} x={cx} y={cy + 140} texto={tx} color={[kSo, kGu, kCe, kVe][i] > 0.4 ? FAC.oro : "#BFE0FF"} px={20} anchor="center" id={id} opacidad={kGe} />)}
      <Chip x={104} y={690} texto={"PAR CRANEAL VII · EL FACIAL"} color={FAC.facial} px={26} id="fa-ge-par" opacidad={kPar} />
      <Chip x={540} y={1340} texto={"el nervio de los gestos"} color={FAC.oro} px={26} anchor="center" id="fa-ge-ges" opacidad={kGe} />
      <Frases frases={[{ t: 0.2, texto: "EL PAR\nCRANEAL VII", px: 100 }, { t: G.gestos - 0.1, texto: "EL NERVIO DE\nLOS GESTOS", px: 92, color: FAC.facial }, { t: G.sonreir - 0.1, texto: "SONREÍR · GUIÑAR\nFRUNCIR · SOPLAR", px: 72, color: FAC.oro }]} y={450} x={104} id="titular-fa-gestos" />
      <Fuente texto={`El nervio facial (VII) inerva los músculos de la expresión facial: ${FA.gestos.join(", ")}. Esquema.`} y={1510} delay={G.gestos} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── fa-extras ───────────── */

export const FaExtras: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const X = TFA.extras;
  const kGu = clamp((t - a(X.gusto)) / 0.5), kLa = clamp((t - a(X.lagrimas)) / 0.5), kSa = clamp((t - a(X.saliva)) / 0.5);
  const tarjeta = (cx: number, k: number, c: string, id: string, tx: string, sub: string): React.ReactNode => (
    <g key={id} opacity={clamp(k * 2)} transform={`translate(${cx} ${lerp(1010, 980, easeOut(k))})`}><rect x={-140} y={-230} width={280} height={440} rx={28} fill="rgba(11,18,40,0.9)" stroke={c} strokeWidth={6} /><text y={150} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={c} data-texto={id}>{tx}</text><text y={186} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={17} fill="#BFE0FF">{sub}</text></g>
  );
  const gotas = (i: number): number => ((t * 0.7 + i / 3) % 1);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={FAC.facial} intensidad={0.6} />
        {tarjeta(220, kGu, FAC.oro, "fa-ex-gu", "GUSTO", "punta de la lengua")}
        {tarjeta(540, kLa, FAC.azul, "fa-ex-la", "LÁGRIMAS", "como con la cebolla")}
        {tarjeta(860, kSa, FAC.verde, "fa-ex-sa", "SALIVA", "como con un limón")}
        <Lengua x={220} y={900} s={1.0} punta={kGu} opacidad={kGu} />
        <g opacity={kLa}>
          <ellipse cx={540} cy={800} rx={72} ry={34} fill="#E4EAF8" stroke="#5C6A90" strokeWidth={4} /><circle cx={540} cy={800} r={22} fill="#4FA3FF" /><circle cx={540} cy={800} r={9} fill="#0A0F1F" />
          {[0, 1, 2].map((i) => <Gota key={i} x={512 + i * 28} y={836 + 60 * gotas(i)} s={0.4} opacidad={1 - gotas(i)} />)}
          <circle cx={540} cy={990} r={50} fill="#E8C27A" stroke="#8A6A22" strokeWidth={5} /><path d="M 520 950 C 510 990 520 1030 540 1040 M 560 950 C 570 990 560 1030 540 1040" stroke="#8A6A22" strokeWidth={4} fill="none" /><path d="M 540 940 L 548 910" stroke="#7BB04A" strokeWidth={8} strokeLinecap="round" />
        </g>
        <g opacity={kSa}>
          <circle cx={860} cy={880} r={64} fill="#F2E24A" stroke="#A89A12" strokeWidth={6} />{[0, 60, 120].map((an) => <line key={an} x1={860 - 56 * Math.cos((an * Math.PI) / 180)} y1={880 - 56 * Math.sin((an * Math.PI) / 180)} x2={860 + 56 * Math.cos((an * Math.PI) / 180)} y2={880 + 56 * Math.sin((an * Math.PI) / 180)} stroke="#A89A12" strokeWidth={4} />)}
          {[0, 1].map((i) => <Gota key={i} x={820 + i * 80} y={960 + 40 * gotas(i + 1)} s={0.45} color={FAC.verde} opacidad={1 - gotas(i + 1)} />)}
          <path d="M 806 1040 Q 860 1090 914 1040" stroke="#E4EAF8" strokeWidth={8} fill="none" strokeLinecap="round" />
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "TAMBIÉN DA EL\nGUSTO…", px: 90 }, { t: X.lagrimas - 0.1, texto: "…LÁGRIMAS", px: 110, color: FAC.azul }, { t: X.saliva - 0.1, texto: "…Y SALIVA", px: 110, color: FAC.verde }]} y={450} x={104} id="titular-fa-extras" />
      <Fuente texto={`Además de mover los músculos, el facial lleva el gusto de ${FA.funciones.gusto} y fibras parasimpáticas que activan las glándulas ${FA.funciones.glandulas.join(", ")}. Esquema.`} y={1510} delay={X.gusto} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── fa-tunel ───────────── */

const TUNEL: [number, number][] = [[250, 1000], [330, 1000], [380, 940], [470, 940], [520, 1000], [600, 1040], [680, 1060]];
const RAMAS: [number, number][][] = [[[700, 1070], [780, 960], [840, 880]], [[700, 1070], [800, 1000], [900, 960]], [[700, 1070], [820, 1060], [930, 1070]], [[700, 1070], [790, 1120], [880, 1170]], [[700, 1070], [770, 1160], [820, 1240]]];
export const FaTunel: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const T2 = TFA.tunel;
  const kTu = clamp((t - a(T2.tunel)) / a(3.2)), kSa = clamp((t - a(T2.sale)) / 0.5), kRa = easeOut((t - a(T2.ramas)) / a(1.6));
  const [px, py] = polyPt(TUNEL, kTu);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1020} color={FAC.facial} intensidad={0.6} />
        <rect x={110} y={900} width={150} height={200} rx={50} fill="#251C44" stroke={PC.cereb} strokeWidth={5} />
        <rect x={300} y={880} width={400} height={210} rx={60} fill="#3A4258" stroke="#8B97B8" strokeWidth={5} opacity={0.9} />
        <path d={path(TUNEL)} stroke="#0B1220" strokeWidth={30} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={path(TUNEL)} pathLength={1} stroke={FAC.facial} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${kTu} 2`} />
        {kTu > 0 && kTu < 1 && <circle cx={px} cy={py} r={9} fill="#fff" />}
        <g opacity={kSa}><path d="M 700 1030 C 740 1000 780 1040 750 1110 C 730 1150 700 1110 706 1090" stroke={FAC.hueso} strokeWidth={9} fill="none" strokeLinecap="round" /></g>
        <ellipse cx={870} cy={1060} rx={120} ry={210} fill="none" stroke="#4A5C92" strokeWidth={6} opacity={clamp(kRa * 2)} />
        {RAMAS.map((r, i) => <path key={i} d={path(r)} pathLength={1} stroke={FAC.facial} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${kRa} 2`} />)}
      </svg>
      <Chip x={104} y={1130} texto={"TRONCO"} color={"#D9C6FF"} px={18} id="fa-t-tr" opacidad={clamp(kTu * 3)} />
      <Chip x={300} y={800} texto={"TÚNEL ESTRECHO EN EL HUESO"} color={FAC.hueso} px={20} id="fa-t-tu" opacidad={clamp(kTu * 2)} />
      <Chip x={540} y={1160} texto={"como un cable\ndentro de un tubo"} color={FAC.oro} px={20} id="fa-t-ca" opacidad={clamp(kTu * 1.5)} />
      <Chip x={650} y={1260} texto={"OREJA"} color={FAC.hueso} px={20} id="fa-t-or" opacidad={kSa} />
      <Chip x={976} y={780} texto={"RAMAS POR\nLA CARA"} color={FAC.facial} px={22} anchor="right" id="fa-t-ra" opacidad={clamp(kRa * 2)} />
      <Frases frases={[{ t: 0.2, texto: "VIAJA POR UN\nTÚNEL ESTRECHO", px: 82 }, { t: T2.sale - 0.1, texto: "SALE JUNTO\nA LA OREJA", px: 92, color: FAC.hueso }, { t: T2.ramas - 0.1, texto: "SE ABRE EN\nRAMAS", px: 100, color: FAC.facial }]} y={450} x={104} id="titular-fa-tunel" />
      <Fuente texto={`El facial recorre el ${FA.tunel} (un conducto estrecho del hueso temporal), sale cerca de la oreja por el agujero estilomastoideo y se reparte en ramas por la cara. Vista lateral esquemática.`} y={1510} delay={T2.tunel} />
      <Cap e={e} />
    </Fondo>
  );
};
