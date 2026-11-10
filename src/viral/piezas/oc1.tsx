/**
 * «El par craneal III: la pupila que avisa» (SINAPSIS · pares craneales) · escenas 1/2
 *   oc-gancho     una pupila dilatada tras un golpe en la cabeza puede ser una emergencia: el oculomotor pide ayuda
 *   oc-musculos   mueve cuatro de los seis músculos de cada ojo y levanta el párpado
 *   oc-reflejo    la luz en un ojo cierra las dos pupilas: el óptico avisa y el oculomotor responde
 *   oc-recorrido  nace en el mesencéfalo, pasa entre dos arterias y cruza el seno cavernoso hasta la órbita
 * Dibujos esquemáticos de anatomía; no son imágenes médicas reales.
 */
import React from "react";
import { OC, TOC } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Ambiente, Aviso, Chip, Cerebro, ME, OCC, OjoP, PC, polyPt } from "./oc-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── oc-gancho ───────────── */

export const OcGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TOC.gancho;
  const kGo = spr(f, a(G.golpe), { damping: 9, stiffness: 200, mass: 0.8 });
  const kDi = easeOut((t - a(G.golpe) - 0.1) / 0.7), kLuz = clamp((t - a(G.emergencia)) / 0.4), kCi = easeOut((t - a(G.emergencia) - 0.15) / 0.5);
  const pDer = lerp(0.5, 0.95, kDi), pIzq = lerp(0.5, 0.28, kCi);
  const kPar = clamp((t - a(G.par)) / 0.4);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={kLuz > 0.3 ? "#FFE38A" : OCC.rojo} intensidad={0.5 + 0.5 * kDi} />
        {kLuz > 0 && <polygon points="540,1330 190,1100 890,1100" fill="#FFE38A" opacity={0.16 * kLuz} />}
        <OjoP x={330} y={1030} r={130} pupila={pIzq} t={t} brillo={kCi * 0.6} />
        <OjoP x={750} y={1030} r={130} pupila={pDer} iris="#4FA3FF" t={t} brillo={kDi * 0.5} />
        {kGo > 0.05 && <g transform={`translate(160 760) scale(${kGo})`} opacity={clamp(kGo * 2) * (1 - clamp((t - a(G.golpe) - 0.8) / 0.6))}><polygon points="0,-60 14,-22 52,-34 28,-2 60,20 20,22 16,60 -6,26 -42,48 -26,10 -62,-8 -22,-14" fill="#FF9E3D" stroke="#fff" strokeWidth={3} /></g>}
        <Aviso x={900} y={780} s={0.8} t={t} opacidad={kPar} />
        <rect x={500} y={1330} width={80} height={14} rx={7} fill="#C8D2E8" opacity={kLuz} />
      </svg>
      <Chip x={104} y={700} texto={"TRAS UN GOLPE\nEN LA CABEZA"} color={"#FF9E3D"} px={24} id="oc-g-golpe" opacidad={clamp((t - a(G.golpe)) / 0.4)} />
      <Chip x={330} y={1215} texto={"REACCIONA"} color={OCC.pupila} px={24} anchor="center" id="oc-g-ok" opacidad={clamp(kCi * 2)} />
      <Chip x={750} y={1215} texto={"NO REACCIONA"} color={OCC.rojo} px={24} anchor="center" id="oc-g-no" opacidad={clamp(kCi * 2)} />
      <Chip x={750} y={870} texto={"PUPILA DILATADA"} color={"#FFB347"} px={22} anchor="center" id="oc-g-dil" opacidad={clamp(kDi * 2)} />
      <Frases frases={[{ t: 0.2, texto: "UNA PUPILA\nDILATADA", px: 96 }, { t: G.golpe - 0.1, texto: "TRAS UN GOLPE\nEN LA CABEZA", px: 84, color: "#FF9E3D" }, { t: G.emergencia - 0.1, texto: "PUEDE SER UNA\nEMERGENCIA", px: 80, color: OCC.rojo }, { t: G.par - 0.1, texto: "PAR CRANEAL III", px: 90, color: OCC.oculo }]} y={450} x={104} id="titular-oc-gancho" />
      <Fuente texto="Una pupila dilatada y sin respuesta a la luz tras un traumatismo craneal puede indicar compresión del nervio oculomotor; hay otras causas (por ejemplo, un golpe directo al ojo). Esquema; no es consejo médico." y={1510} delay={G.emergencia} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── oc-musculos ───────────── */

export const OcMusculos: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const M = TOC.musculos;
  const kGl = clamp((t - a(M.mueve)) / 0.5), kCu = clamp((t - a(M.cuatro)) / 0.4), kGi = clamp((t - a(M.giran)) / 0.4), kPa = clamp((t - a(M.parpado)) / 0.5);
  const nVis = Math.min(4, Math.floor((t - a(M.cuatro)) / 0.3) + 1);
  const muestra = (i: number): boolean => t >= a(M.cuatro) && i < nVis;
  const col = (on: boolean): string => (on ? OCC.oculo : "#4A5470");
  const sh = Math.sin(t * 3) * 0.12;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1040} color={OCC.oculo} intensidad={0.5 + 0.4 * kCu} />
        <g opacity={kGl}>
          {/* músculos que NO mueve el III (grises) */}
          <rect x={670} y={1000} width={150} height={80} rx={34} fill="#4A5470" opacity={0.55 * kGi} /><path d="M 400 930 C 440 900 480 910 500 930" stroke="#4A5470" strokeWidth={26} fill="none" strokeLinecap="round" opacity={0.55 * kGi} />
          {/* músculos del III */}
          <rect x={496} y={862} width={88} height={78} rx={34} fill={col(muestra(0))} opacity={muestra(0) ? 0.95 : 0.35} />
          <rect x={496} y={1150} width={88} height={160} rx={36} fill={col(muestra(1))} opacity={muestra(1) ? 0.95 : 0.35} />
          <rect x={260} y={1000} width={160} height={80} rx={34} fill={col(muestra(2))} opacity={muestra(2) ? 0.95 : 0.35} />
          <path d="M 620 1250 C 660 1170 640 1130 610 1110" stroke={col(muestra(3))} strokeWidth={34} fill="none" strokeLinecap="round" opacity={muestra(3) ? 0.95 : 0.35} />
          <OjoP x={540} y={1040} r={120} pupila={0.5} mira={[sh, 0]} t={t} />
        </g>
        {/* párpado y elevador */}
        <g opacity={kPa}>
          <path d="M 370 940 C 430 820 650 820 710 940" stroke="#5A4A6A" strokeWidth={14} fill="none" strokeLinecap="round" />
          <rect x={496} y={700} width={88} height={130} rx={36} fill="#FFD27A" opacity={0.95} />
          <circle cx={540} cy={820 + 6 * Math.sin(t * 5)} r={12} fill="#fff" />
        </g>
      </svg>
      <Chip x={104} y={1090} texto={"RECTO\nMEDIAL"} color={OCC.oculo} px={20} id="oc-m-med" opacidad={clamp(muestra(2) ? 1 : 0)} />
      <Chip x={604} y={872} texto={"RECTO\nSUPERIOR"} color={OCC.oculo} px={20} id="oc-m-sup" opacidad={muestra(0) ? 1 : 0} />
      <Chip x={604} y={1280} texto={"RECTO\nINFERIOR"} color={OCC.oculo} px={20} id="oc-m-inf" opacidad={muestra(1) ? 1 : 0} />
      <Chip x={690} y={1150} texto={"OBLICUO\nINFERIOR"} color={OCC.oculo} px={20} id="oc-m-obl" opacidad={muestra(3) ? 1 : 0} />
      <Chip x={604} y={720} texto={"ELEVADOR\nDEL PÁRPADO"} color={"#FFD27A"} px={20} id="oc-m-ele" opacidad={kPa} />
      <Chip x={976} y={1342} texto={"no los mueve el III: oblicuo sup. (IV) y recto lateral (VI)"} color="#8B97B8" px={16} anchor="right" id="oc-m-otros" opacidad={kGi} />
      <Chip x={104} y={720} texto={`${OC.musculos.inervados} DE ${OC.musculos.totales}`} color={OCC.oculo} px={48} id="oc-m-4de6" opacidad={kCu} />
      <Frases frases={[{ t: 0.2, texto: "EL OCULOMOTOR", px: 96 }, { t: M.cuatro - 0.1, texto: "4 DE LOS 6\nMÚSCULOS", px: 96, color: OCC.oculo }, { t: M.parpado - 0.1, texto: "Y EL PÁRPADO", px: 96, color: "#FFD27A" }]} y={450} x={104} id="titular-oc-musculos" />
      <Fuente texto="El nervio oculomotor (III) inerva los rectos superior, inferior y medial, el oblicuo inferior y el elevador del párpado; el oblicuo superior lo inerva el IV y el recto lateral, el VI. Esquema." y={1510} delay={M.cuatro} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── oc-reflejo ───────────── */

const AFE_D: [number, number][] = [[750, 910], [690, 990], [600, 1050], [540, 1075]];
const AFE_I: [number, number][] = [[330, 910], [390, 990], [480, 1050], [540, 1075]];
const EFE_I: [number, number][] = [[540, 1140], [380, 1180], [270, 1100], [262, 900]];
const EFE_D: [number, number][] = [[540, 1140], [700, 1180], [810, 1100], [818, 900]];
export const OcReflejo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const R = TOC.reflejo;
  const kLuz = clamp((t - a(R.luz)) / 0.4), kOp = clamp((t - a(R.optico)) / a(1.4)), kOc = clamp((t - a(R.oculo)) / a(1.4)), kDos = spr(f, a(R.dos), { damping: 10, stiffness: 180, mass: 0.8 });
  const pup = (k: number): number => lerp(0.55, 0.28, easeOut(k));
  const path = (pts: [number, number][]): string => pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={kOc > 0.3 ? OCC.oculo : OCC.optico} intensidad={0.7} />
        {kLuz > 0 && <polygon points={`930,690 700,830 800,860`} fill="#FFE38A" opacity={0.5 * kLuz * (1 - 0.6 * clamp(kOp))} />}
        <rect x={430} y={1030} width={220} height={140} rx={28} fill="#251C44" stroke={OCC.cereb} strokeWidth={4} />
        {[AFE_D, AFE_I].map((p, i) => <g key={i}><path d={path(p)} pathLength={1} stroke={OCC.optico} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${i === 0 ? kOp : 0} 2`} />{i === 0 && kOp > 0 && kOp < 1 && (() => { const [px, py] = polyPt(p, kOp); return <circle cx={px} cy={py} r={9} fill="#fff" />; })()}</g>)}
        {[EFE_I, EFE_D].map((p, i) => <g key={i}><path d={path(p)} pathLength={1} stroke={OCC.oculo} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${kOc} 2`} />{kOc > 0 && kOc < 1 && (() => { const [px, py] = polyPt(p, kOc); return <circle cx={px} cy={py} r={9} fill="#fff" />; })()}</g>)}
        <OjoP x={330} y={830} r={78} pupila={pup(kDos)} t={t} brillo={kDos * 0.5} />
        <OjoP x={750} y={830} r={78} pupila={pup(kLuz > 0 ? Math.max(kOc, kDos) : 0)} t={t} brillo={(kLuz * 0.7) as number} />
      </svg>
      <Chip x={540} y={1100} texto={"MESENCÉFALO"} color={"#D9C6FF"} px={18} anchor="center" id="oc-r-mes" opacidad={clamp(kOp * 2)} />
      <Chip x={104} y={1300} texto={"II · avisa (aferente)"} color={OCC.optico} px={22} id="oc-r-aviso" opacidad={clamp(kOp * 3)} />
      <Chip x={976} y={1300} texto={"III · responde (eferente)"} color={OCC.oculo} px={22} anchor="right" id="oc-r-resp" opacidad={clamp(kOc * 3)} />
      <Chip x={540} y={1345} texto={"las DOS pupilas se cierran"} color={OCC.pupila} px={26} anchor="center" id="oc-r-dos" opacidad={clamp(kDos * 1.5)} />
      <Frases frases={[{ t: 0.2, texto: "LUZ EN\nUN OJO…", px: 100 }, { t: R.optico - 0.1, texto: "EL ÓPTICO\nAVISA", px: 100, color: OCC.optico }, { t: R.oculo - 0.1, texto: "EL OCULOMOTOR\nRESPONDE", px: 84, color: OCC.oculo }, { t: R.dos - 0.1, texto: "LAS DOS\nPUPILAS", px: 100, color: OCC.pupila }]} y={450} x={104} id="titular-oc-reflejo" />
      <Fuente texto={`Reflejo fotomotor: la vía aferente es el nervio óptico (${OC.reflejo.aferente}) y la eferente, parasimpática, va con el oculomotor (${OC.reflejo.eferente}); por eso la luz en un ojo cierra ambas pupilas. Esquema.`} y={1510} delay={R.optico} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── oc-recorrido ───────────── */

const NERVIO: [number, number][] = [[262, 965], [330, 1005], [420, 1008], [510, 1005], [590, 1005], [700, 1000], [790, 1000]];
export const OcRecorrido: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const R = TOC.recorrido;
  const kNa = clamp((t - a(R.nace)) / 0.5), kAr = clamp((t - a(R.arterias)) / 0.5), kSe = clamp((t - a(R.seno)) / 0.5), kOr = clamp((t - a(R.orbita)) / 0.5);
  const kRec = clamp((t - a(R.nace)) / a(R.orbita + 0.6));
  const path = NERVIO.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
  const [px, py] = polyPt(NERVIO, kRec);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1010} color={OCC.oculo} intensidad={0.6} />
        {/* mesencéfalo */}
        <g opacity={kNa}>
          <rect x={150} y={870} width={180} height={260} rx={50} fill="#251C44" stroke={OCC.cereb} strokeWidth={5} />
          <rect x={196} y={1100} width={88} height={150} rx={30} fill="#251C44" stroke={OCC.cereb} strokeWidth={5} />
          <circle cx={262} cy={965} r={16 + 3 * Math.sin(t * 6)} fill={OCC.oculo} stroke="#fff" strokeWidth={3} />
        </g>
        {/* arterias */}
        <g opacity={kAr}>
          <path d="M 330 950 C 400 925 470 935 540 985" stroke={OCC.rojo} strokeWidth={22} fill="none" strokeLinecap="round" opacity={0.9} />
          <path d="M 330 1062 C 400 1085 470 1080 540 1030" stroke={OCC.rojo} strokeWidth={22} fill="none" strokeLinecap="round" opacity={0.9} />
        </g>
        {/* seno cavernoso */}
        <g opacity={kSe}>
          <rect x={560} y={930} width={150} height={150} rx={40} fill={OCC.optico} opacity={0.2} stroke={OCC.optico} strokeWidth={5} />
          <circle cx={610} cy={1050} r={22} fill={OCC.rojo} opacity={0.9} /><circle cx={670} cy={950} r={8} fill="#8B97B8" /><circle cx={650} cy={975} r={8} fill="#8B97B8" />
        </g>
        {/* órbita */}
        <g opacity={kOr}><circle cx={850} cy={1000} r={70} fill="#E4EAF8" stroke="#5C6A90" strokeWidth={5} /><circle cx={880} cy={1000} r={28} fill="#4FA3FF" /><circle cx={886} cy={1000} r={12} fill="#0A0F1F" /></g>
        {/* nervio */}
        <path d={path} pathLength={1} stroke={OCC.oculo} strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${kRec} 2`} />
        {kRec > 0 && kRec < 1 && <circle cx={px} cy={py} r={9} fill="#fff" />}
      </svg>
      <Chip x={104} y={1150} texto={"MESENCÉFALO"} color={"#D9C6FF"} px={20} id="oc-rc-mes" opacidad={kNa} />
      <Chip x={340} y={860} texto={"ENTRE DOS ARTERIAS"} color={OCC.rojo} px={20} id="oc-rc-art" opacidad={kAr} />
      <Chip x={560} y={1110} texto={"SENO\nCAVERNOSO"} color={OCC.optico} px={20} id="oc-rc-sen" opacidad={kSe} />
      <Chip x={800} y={1100} texto={"ÓRBITA"} color="#BFE0FF" px={22} id="oc-rc-orb" opacidad={kOr} />
      <Frases frases={[{ t: 0.2, texto: "NACE EN EL\nMESENCÉFALO", px: 90 }, { t: R.arterias - 0.1, texto: "ENTRE DOS\nARTERIAS", px: 96, color: OCC.rojo }, { t: R.seno - 0.1, texto: "SENO CAVERNOSO\nY ÓRBITA", px: 80, color: OCC.optico }]} y={450} x={104} id="titular-oc-recorrido" />
      <Fuente texto={`Sale del ${OC.nace} entre las arterias cerebral posterior y cerebelosa superior, cruza el seno cavernoso y entra en la órbita por la fisura orbitaria superior. Vista lateral esquemática.`} y={1510} delay={R.arterias} />
      <Cap e={e} />
    </Fondo>
  );
};
