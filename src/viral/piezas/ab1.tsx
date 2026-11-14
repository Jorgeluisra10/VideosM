/**
 * «El par craneal VI: el chivato de la presión» (SINAPSIS · pares craneales) · escenas 1/2
 *   ab-gancho   cuando miras de reojo trabaja el abducens, que mueve un solo músculo: el recto lateral
 *   ab-regla    regla LR6 SO4 y el resto 3
 *   ab-nucleo   su núcleo, en el puente, coordina los dos ojos: uno hacia afuera y el otro hacia adentro
 *   ab-dorello  sube pegado al clivus y entra por el canal de Dorello, anclado bajo un ligamento
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { AB, TAB } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { ABC, Ambiente, Chip, FONT, MONOF, OjoP, PC, polyPt } from "./ab-kit";

type P = { e: EscenaViralGuardada };
const path = (pts: [number, number][]): string => pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");

/* ───────────── ab-gancho ───────────── */

export const AbGancho: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const G = TAB.gancho;
  const kRe = clamp((t - a(G.reojo)) / 0.5), kPa = clamp((t - a(G.par)) / 0.4), kAb = clamp((t - a(G.abducens)) / 0.4), kMu = clamp((t - a(G.musculo)) / 0.4);
  const dir = kRe > 0 ? Math.sin((t - a(G.reojo)) * 1.5) : 0;
  const d = Math.max(0, dir), i = Math.max(0, -dir);
  const banda = (x: number, y: number, lit: number, color: string, w = 100): React.ReactNode => <rect x={x - w / 2} y={y - 26} width={w} height={52} rx={24} fill={color} opacity={0.25 + 0.7 * lit} />;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1030} color={ABC.abd} intensidad={0.5 + 0.7 * kMu} />
        <g opacity={kRe}>
          {banda(160, 1030, i, ABC.abd)}{banda(500, 1030, d, ABC.oculo)}{banda(580, 1030, i, ABC.oculo)}{banda(920, 1030, d, ABC.abd)}
          <OjoP x={330} y={1030} r={110} pupila={0.5} mira={[0.3 * dir, 0]} t={t} />
          <OjoP x={750} y={1030} r={110} pupila={0.5} mira={[0.3 * dir, 0]} t={t} />
        </g>
      </svg>
      <Chip x={104} y={690} texto={"PRUEBA: MIRA DE\nREOJO → ←"} color={ABC.oro} px={26} id="ab-g-prueba" opacidad={kRe} />
      <Chip x={160} y={1100} texto={"RECTO\nLATERAL"} color={ABC.abd} px={18} anchor="center" id="ab-g-rl1" opacidad={kMu} />
      <Chip x={920} y={1100} texto={"RECTO\nLATERAL"} color={ABC.abd} px={18} anchor="center" id="ab-g-rl2" opacidad={kMu} />
      <Chip x={540} y={1210} texto={"par craneal VI · abducens"} color={ABC.abd} px={28} anchor="center" id="ab-g-vi" opacidad={kAb} />
      <Chip x={540} y={1280} texto={"MUEVE UN SOLO MÚSCULO"} color="#fff" px={24} anchor="center" id="ab-g-uno" opacidad={kMu} />
      <Frases frases={[{ t: 0.2, texto: "CUANDO MIRAS\nDE REOJO…", px: 92 }, { t: G.par - 0.1, texto: "TRABAJA EL\nPAR CRANEAL VI", px: 84, color: ABC.abd }, { t: G.musculo - 0.1, texto: "UN SOLO\nMÚSCULO", px: 100, color: "#fff" }]} y={450} x={104} id="titular-ab-gancho" />
      <Fuente texto={`El abducens (VI) inerva únicamente el ${AB.musculo}, que lleva el ojo hacia afuera (abducción); el recto medial del otro ojo lo acompaña (mirada conjugada). Esquema.`} y={1510} delay={G.musculo} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── ab-regla ───────────── */

export const AbRegla: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const R = TAB.regla;
  const kTr = clamp((t - a(R.truco)) / 0.4), k6 = clamp((t - a(R.seis)) / 0.4), k4 = clamp((t - a(R.cuatro)) / 0.4), k3 = clamp((t - a(R.tres)) / 0.4);
  const luz = (k: number, c: string): string => (k > 0 ? c : "#4A5470");
  const op = (k: number): number => 0.35 + 0.65 * k;
  const tarjeta = (x: number, k: number, c: string, g: string, n: string, id: string): React.ReactNode => (
    <g key={id} opacity={clamp(k * 2)} transform={`translate(${x} ${lerp(1330, 1290, easeOut(k))})`}>
      <rect x={-150} y={-60} width={300} height={120} rx={22} fill="rgba(11,18,40,0.92)" stroke={c} strokeWidth={6} />
      <text y={4} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={54} fill={c} data-texto={id}>{g}</text>
      <text y={40} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={19} fill="#E6EDFF">{n}</text>
    </g>
  );
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={k6 > 0 ? ABC.abd : ABC.oculo} intensidad={0.6} />
        <g opacity={kTr}>
          <rect x={496} y={790} width={88} height={110} rx={34} fill={luz(k3, ABC.oculo)} opacity={op(k3)} />
          <rect x={496} y={1090} width={88} height={110} rx={34} fill={luz(k3, ABC.oculo)} opacity={op(k3)} />
          <rect x={290} y={960} width={140} height={74} rx={32} fill={luz(k3, ABC.oculo)} opacity={op(k3)} />
          <rect x={650} y={960} width={140} height={74} rx={32} fill={luz(k6, ABC.abd)} opacity={op(k6)} />
          <path d="M 400 830 C 440 800 500 830 520 880" stroke={luz(k4, ABC.troc)} strokeWidth={30} fill="none" strokeLinecap="round" opacity={op(k4)} />
          <path d="M 680 1180 C 640 1170 610 1130 600 1090" stroke={luz(k3, ABC.oculo)} strokeWidth={30} fill="none" strokeLinecap="round" opacity={op(k3)} />
          <OjoP x={540} y={997} r={110} pupila={0.5} t={t} />
        </g>
        {tarjeta(200, k6, ABC.abd, "LR6", "recto lateral", "ab-r-lr6")}
        {tarjeta(540, k4, ABC.troc, "SO4", "oblicuo superior", "ab-r-so4")}
        {tarjeta(880, k3, ABC.oculo, "…3", "todos los demás", "ab-r-3")}
      </svg>
      <Chip x={104} y={690} texto={"UN TRUCO CLÁSICO"} color={ABC.oro} px={26} id="ab-r-truco" opacidad={kTr} />
      <Chip x={976} y={960} texto={"VI"} color={ABC.abd} px={34} anchor="right" id="ab-r-vi" opacidad={k6} />
      <Chip x={104} y={760} texto={"IV"} color={ABC.troc} px={34} id="ab-r-iv" opacidad={k4} />
      <Chip x={104} y={1090} texto={"III"} color={ABC.oculo} px={34} id="ab-r-iii" opacidad={k3} />
      <Frases frases={[{ t: 0.2, texto: "UN TRUCO\nCLÁSICO", px: 100 }, { t: R.seis - 0.1, texto: "RECTO LATERAL:\nVI", px: 90, color: ABC.abd }, { t: R.cuatro - 0.1, texto: "OBLICUO\nSUPERIOR: IV", px: 90, color: ABC.troc }, { t: R.tres - 0.1, texto: "EL RESTO: III", px: 100, color: ABC.oculo }]} y={450} x={104} id="titular-ab-regla" />
      <Fuente texto={`Regla mnemotécnica «LR6 SO4 y el resto 3»: recto lateral (${AB.regla.lr}), oblicuo superior (${AB.regla.so}) y los demás músculos extraoculares (${AB.regla.resto}). Esquema.`} y={1510} delay={R.seis} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── ab-nucleo ───────────── */

const MOTOR: [number, number][] = [[630, 890], [700, 980], [780, 1100], [812, 1190]];
const CRUCE: [number, number][] = [[630, 890], [540, 842], [450, 790]];
const A_MR: [number, number][] = [[450, 790], [390, 900], [345, 1040], [372, 1196]];
export const AbNucleo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const N = TAB.nucleo;
  const kPu = clamp((t - a(N.puente)) / 0.5), kCo = easeOut((t - a(N.coordina)) / a(1.6)), kAf = spr(f, a(N.afuera), { damping: 10, stiffness: 160, mass: 0.9 }), kAd = clamp((t - a(N.adentro)) / 0.5);
  const mira = 0.3 * kAf;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1020} color={ABC.abd} intensidad={0.6} />
        <g opacity={kPu}>
          <rect x={390} y={740} width={300} height={200} rx={54} fill="#251C44" stroke={PC.cereb} strokeWidth={5} />
          <circle cx={450} cy={790} r={22} fill={ABC.oculo} stroke="#fff" strokeWidth={3} /><circle cx={630} cy={790} r={22} fill={ABC.oculo} stroke="#fff" strokeWidth={3} />
          <circle cx={450} cy={890} r={22} fill={ABC.abd} stroke="#fff" strokeWidth={3} /><circle cx={630} cy={890} r={22} fill={ABC.abd} stroke="#fff" strokeWidth={3} />
        </g>
        {[[MOTOR, ABC.abd], [CRUCE, ABC.abd], [A_MR, ABC.oculo]].map(([p, c], i) => (
          <g key={i}>
            <path d={path(p as [number, number][])} pathLength={1} stroke={c as string} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${i === 1 ? clamp(kCo * 2) : i === 2 ? clamp(kCo * 2 - 1) : clamp(kCo * 2)} 2`} />
            {kCo > 0.02 && kCo < 1 && (() => { const u = i === 2 ? clamp(kCo * 2 - 1) : clamp(kCo * 2); if (u <= 0 || u >= 1) return null; const [px, py] = polyPt(p as [number, number][], u); return <circle cx={px} cy={py} r={9} fill="#fff" />; })()}
          </g>
        ))}
        <rect x={768} y={1196} width={90} height={26} rx={13} fill={ABC.abd} opacity={0.3 + 0.7 * kAf} /><rect x={286} y={1196} width={90} height={26} rx={13} fill={ABC.oculo} opacity={0.3 + 0.7 * kAd} />
        <OjoP x={330} y={1250} r={72} pupila={0.5} mira={[mira, 0]} t={t} /><OjoP x={750} y={1250} r={72} pupila={0.5} mira={[mira, 0]} t={t} />
      </svg>
      <Chip x={976} y={760} texto={"OCULOMOTOR (III)"} color={ABC.oculo} px={18} anchor="right" id="ab-n-iii" opacidad={clamp(kCo * 2)} />
      <Chip x={976} y={880} texto={"ABDUCENS (VI)"} color={ABC.abd} px={18} anchor="right" id="ab-n-vi" opacidad={kPu} />
      <Chip x={104} y={960} texto={"FLM: cruza\nal otro lado"} color={ABC.oro} px={16} id="ab-n-flm" opacidad={clamp(kCo * 2)} />
      <Chip x={540} y={1345} texto={"JUNTOS: UNO AFUERA, EL OTRO ADENTRO"} color="#fff" px={22} anchor="center" id="ab-n-jun" opacidad={kAd} />
      <Frases frases={[{ t: 0.2, texto: "SU NÚCLEO\nESTÁ EN EL PUENTE", px: 82 }, { t: N.coordina - 0.1, texto: "COORDINA\nLOS DOS OJOS", px: 92, color: ABC.abd }, { t: N.afuera - 0.1, texto: "UNO AFUERA,\nOTRO ADENTRO", px: 86, color: "#fff" }]} y={450} x={104} id="titular-ab-nucleo" />
      <Fuente texto="El núcleo del abducens tiene motoneuronas para el recto lateral del mismo lado e interneuronas que cruzan por el fascículo longitudinal medial al núcleo oculomotor opuesto (recto medial). Vista dorsal esquemática." y={1510} delay={N.coordina} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── ab-dorello ───────────── */

const NERV: [number, number][] = [[260, 1150], [330, 1100], [420, 1010], [520, 935], [570, 910], [650, 905], [750, 885], [850, 862]];
export const AbDorello: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const D = TAB.dorello;
  const kSu = clamp((t - a(D.sube)) / a(1.9)), kCa = clamp((t - a(D.canal)) / 0.5), kAn = spr(f, a(D.anclado), { damping: 9, stiffness: 190, mass: 0.8 });
  const [px, py] = polyPt(NERV, kSu);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1010} color={ABC.abd} intensidad={0.6} />
        <rect x={110} y={960} width={190} height={240} rx={54} fill="#251C44" stroke={PC.cereb} strokeWidth={5} />
        <rect x={170} y={1190} width={90} height={110} rx={28} fill="#251C44" stroke={PC.cereb} strokeWidth={5} />
        <path d="M 300 1240 L 596 930" stroke={ABC.hueso} strokeWidth={34} strokeLinecap="round" opacity={0.85} />
        <rect x={680} y={820} width={120} height={120} rx={36} fill="#4FA3FF" opacity={0.2} stroke="#4FA3FF" strokeWidth={4} />
        <circle cx={850} cy={862} r={62} fill="#E4EAF8" stroke="#5C6A90" strokeWidth={5} /><circle cx={878} cy={862} r={24} fill="#4FA3FF" /><circle cx={884} cy={862} r={10} fill="#0A0F1F" />
        <path d={path(NERV)} pathLength={1} stroke={ABC.abd} strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${kSu} 2`} />
        {kSu > 0 && kSu < 1 && <circle cx={px} cy={py} r={9} fill="#fff" />}
        <g opacity={kCa}>
          <path d="M 530 944 Q 570 862 616 940" stroke={ABC.oro} strokeWidth={9} fill="none" strokeLinecap="round" />
          <circle cx={570} cy={907} r={30 + 6 * Math.sin(t * 7) * kAn} fill="none" stroke={ABC.oro} strokeWidth={4} opacity={0.6} />
        </g>
        {kAn > 0.05 && <g transform={`translate(570 990) scale(${kAn})`}><circle r={26} fill="#2A2108" stroke={ABC.oro} strokeWidth={6} /><path d="M 0 -12 V 10 M -10 -2 H 10 M -14 6 Q 0 20 14 6" stroke={ABC.oro} strokeWidth={5} fill="none" strokeLinecap="round" /></g>}
      </svg>
      <Chip x={330} y={1250} texto={"CLIVUS"} color={ABC.hueso} px={22} id="ab-d-cli" opacidad={clamp(kSu * 2)} />
      <Chip x={104} y={1230} texto={"puente"} color={"#D9C6FF"} px={18} id="ab-d-pue" opacidad={kSu} />
      <Chip x={420} y={780} texto={"CANAL DE DORELLO"} color={ABC.oro} px={24} id="ab-d-can" opacidad={kCa} />
      <Chip x={600} y={1030} texto={"ANCLADO bajo\nun ligamento"} color={ABC.oro} px={20} id="ab-d-anc" opacidad={clamp(kAn * 2)} />
      <Frases frases={[{ t: 0.2, texto: "SUBE PEGADO\nAL CLIVUS", px: 90 }, { t: D.canal - 0.1, texto: "CANAL DE\nDORELLO", px: 100, color: ABC.oro }, { t: D.anclado - 0.1, texto: "ANCLADO BAJO\nUN LIGAMENTO", px: 80, color: ABC.oro }]} y={450} x={104} id="titular-ab-dorello" />
      <Fuente texto={`El abducens asciende por el clivus y entra en el ${AB.ancla}, donde queda sujeto bajo el ligamento petroclinoideo (de Gruber); sigue por el seno cavernoso hasta la órbita. Vista lateral esquemática.`} y={1510} delay={D.canal} />
      <Cap e={e} />
    </Fondo>
  );
};
