/**
 * «El par craneal I: el nervio que renace» (SINAPSIS · pares craneales) · escenas 1/2
 *   ol-gancho    la mayoría de las neuronas no se reemplaza, pero las del olfato se renuevan toda la vida
 *   ol-mucosa    están en el techo de la nariz, expuestas al aire que respiras
 *   ol-ciclo     en ratones la mayoría vive 1–3 meses y células madre fabrican neuronas nuevas sin parar
 *   ol-receptor  cada neurona fabrica un solo tipo de receptor (≈ 400 funcionales en humanos) y cada olor activa varios
 * Dibujos esquemáticos de anatomía; no son imágenes médicas reales.
 */
import React from "react";
import { OL, TOL } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Ambiente, Chip, Epitelio, ME, Neurona, OLC, PC, NUEVA, mezclar, pEp, sua } from "./ol-kit";

type P = { e: EscenaViralGuardada };
const EX = 540, EY = 939, ES = 0.95;

/* ───────────── ol-gancho ───────────── */

export const OlGancho: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const G = TOL.gancho;
  const kA = clamp((t - a(G.mayoria)) / 0.6), kB = clamp((t - a(G.pero)) / 0.6), kC = clamp((t - a(G.par)) / 0.5), kR = clamp((t - a(G.renuevan)) / 0.5);
  const fase = (i: number): { muerta: number; nace: number } => {
    if (t < a(G.par)) return { muerta: 0, nace: 1 };
    const p = (((t - a(G.par)) * 0.42 + i * 0.17) % 1 + 1) % 1;
    return p < 0.5 ? { muerta: sua(p, 0.15, 0.45), nace: 1 } : { muerta: 0, nace: clamp((p - 0.5) / 0.4) };
  };
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={kR > 0.2 ? NUEVA : ME.cereb} intensidad={0.8 + 0.6 * kR} />
        {Array.from({ length: 6 }, (_, i) => <Neurona key={i} x={190 + i * 140} y={830} s={0.95} color="#8B97B8" t={t} brillo={0} muerta={0} nace={easeOut(kA * 1.4 - i * 0.06)} />)}
        <g opacity={kA * 0.9}><rect x={96} y={706} width={888} height={4} rx={2} fill="#8B97B8" opacity={0.35} /></g>
        {Array.from({ length: 6 }, (_, i) => { const f = fase(i); return <Neurona key={i} x={190 + i * 140} y={1150} s={0.95} color={OLC[5]} t={t} brillo={kC * 0.8} muerta={f.muerta} nace={kB > 0 ? f.nace * easeOut(kB * 1.4 - i * 0.06) : 0} />; })}
        <g opacity={kB * 0.9}><rect x={96} y={1006} width={888} height={4} rx={2} fill={PC.olfat} opacity={0.5} /></g>
      </svg>
      <Chip x={104} y={720} texto={"LA MAYORÍA · no se reemplaza"} color="#BFE0FF" px={26} id="ol-g-may" opacidad={kA} />
      <Chip x={104} y={1020} texto={kR > 0.3 ? "OLFATO · par I · se renuevan" : "OLFATO · par craneal I"} color={kR > 0.3 ? NUEVA : PC.olfat} px={26} id="ol-g-ol" opacidad={kB} />
      <Frases frases={[{ t: 0.2, texto: "NEURONAS QUE\nNO SE REEMPLAZAN", px: 78 }, { t: G.pero - 0.1, texto: "PERO LAS DEL\nOLFATO SÍ", px: 90, color: PC.olfat }, { t: G.renuevan - 0.1, texto: "SE RENUEVAN\nTODA LA VIDA", px: 90, color: NUEVA }]} y={450} x={104} id="titular-ol-gancho" />
      <Fuente texto="La mayoría de las neuronas del cerebro adulto no se reemplaza; las neuronas receptoras del epitelio olfatorio se renuevan durante toda la vida (con menos capacidad al envejecer). Esquema." y={1510} delay={G.par} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── ol-mucosa ───────────── */

export const OlMucosa: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const M = TOL.mucosa;
  const kTe = clamp((t - a(M.techo)) / 0.5), kAi = clamp((t - a(M.aire)) / 0.8), kDa = clamp((t - a(M.dano)) / a(1.6));
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={PC.olfat} intensidad={0.7} />
        <Epitelio x={EX} y={EY} s={ES} t={t} aire={kAi} dano={kDa} axones={1} bulbo={1} />
      </svg>
      <Chip x={104} y={757} texto="MUCOSA" color="#6AD0E6" px={22} id="ol-m-muc" opacidad={kTe} />
      <Chip x={104} y={830} texto={"NEURONAS\nOLFATORIAS"} color={PC.olfat} px={20} id="ol-m-neu" opacidad={kTe} />
      <Chip x={104} y={1090} texto={"LÁMINA\nCRIBOSA"} color={ME.oro} px={20} id="ol-m-lam" opacidad={kTe} />
      <Chip x={104} y={1205} texto={"BULBO"} color={PC.olfat} px={20} id="ol-m-bul" opacidad={kTe} />
      <Chip x={976} y={690} texto={"AIRE + TÓXICOS"} color={"#FF8A9B"} px={24} anchor="right" id="ol-m-aire" opacidad={kAi} />
      <Chip x={976} y={1335} texto={"las neuronas dañadas se apagan"} color={PC.rojo} px={22} anchor="right" id="ol-m-dano" opacidad={clamp(kDa * 2)} />
      <Frases frases={[{ t: 0.2, texto: "EN EL TECHO\nDE LA NARIZ", px: 84 }, { t: M.aire - 0.1, texto: "EXPUESTAS\nAL AIRE", px: 96, color: "#6AD0E6" }, { t: M.dano - 0.1, texto: "SE DAÑAN\nY MUEREN", px: 96, color: PC.rojo }]} y={450} x={104} id="titular-ol-mucosa" />
      <Fuente texto="Las neuronas receptoras olfatorias asoman sus cilios a la mucosa nasal y están más expuestas al ambiente que casi cualquier otra neurona. Corte esquemático, no a escala." y={1510} delay={M.aire} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── ol-ciclo ───────────── */

export const OlCiclo: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const C = TOL.ciclo;
  const kRa = clamp((t - a(C.ratones)) / 0.4), kMe = clamp((t - a(C.meses)) / a(2.7));
  const dano = clamp((t - a(C.meses + 1.8)) / a(1.6)), madre = clamp((t - a(C.madre)) / 0.6), renace = clamp((t - a(C.madre + 0.5)) / a(2.4));
  const R = 46, C2 = 2 * Math.PI * R;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={NUEVA} intensidad={0.5 + 0.8 * renace} />
        <Epitelio x={EX} y={EY} s={ES} t={t} dano={dano} madre={madre} renace={renace} axones={1} bulbo={1} />
        <g transform="translate(170 712)" opacity={kRa}>
          <circle r={R} fill="none" stroke="#BFE0FF" strokeOpacity={0.25} strokeWidth={9} />
          <circle r={R} fill="none" stroke={ME.oro} strokeWidth={9} strokeLinecap="round" strokeDasharray={`${C2 * kMe} ${C2}`} transform="rotate(-90)" />
          <text y={12} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={34} fill="#fff">{kMe < 0.5 ? "1" : kMe < 0.99 ? "2" : "3"}</text>
        </g>
      </svg>
      <Chip x={250} y={695} texto={"1–3 MESES · en ratones"} color={ME.oro} px={28} id="ol-c-meses" opacidad={kRa} />
      <Chip x={104} y={1090} texto={"CÉLULAS\nMADRE"} color={NUEVA} px={20} id="ol-c-madre" opacidad={madre} />
      <Chip x={976} y={1335} texto={"neurona nueva que crece"} color={NUEVA} px={22} anchor="right" id="ol-c-nueva" opacidad={clamp(renace * 2)} />
      <Frases frases={[{ t: 0.2, texto: "EN RATONES", px: 96 }, { t: C.meses - 0.1, texto: "1 A 3 MESES\nDE VIDA", px: 90, color: ME.oro }, { t: C.madre - 0.1, texto: "CÉLULAS MADRE\nLAS REEMPLAZAN", px: 72, color: NUEVA }]} y={450} x={104} id="titular-ol-ciclo" />
      <Fuente texto={`En ratones, la mayoría de las neuronas olfatorias vive de ${OL.ratonMeses.min} a ${OL.ratonMeses.max} meses; no hay una cifra humana validada. Esquema, no a escala.`} y={1510} delay={C.meses} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── ol-receptor ───────────── */

const NG = 20;
const hue = (i: number): string => `hsl(${(i * 137.5) % 360} 78% 62%)`;
const ODOR1 = [37, 112, 150, 241, 303, 355], ODOR2 = [12, 88, 199, 266, 320, 391];
export const OlReceptor: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const R = TOL.receptor;
  const kUno = clamp((t - a(R.uno)) / 0.5), kGrid = clamp((t - a(R.cuatro)) / a(1.6));
  const n = Math.floor(OL.receptoresFuncionales * easeOut(kGrid));
  const o1 = clamp((t - a(R.olor)) / 0.6) * (1 - clamp((t - a(R.olor) - 1.0) / 0.4)), o2 = clamp((t - a(R.olor) - 1.1) / 0.6);
  const GX = 540 - ((NG - 1) * 28) / 2, GY = 760;
  const dotPos = (i: number): [number, number] => [GX + (i % NG) * 28, GY + Math.floor(i / NG) * 28];
  const activo = (i: number): number => (ODOR1.includes(i) ? o1 : ODOR2.includes(i) ? o2 : 0);
  const mol = (x: number, y: number, k: number, color: string): React.ReactNode => (
    <g transform={`translate(${x} ${y})`} opacity={k}>
      <polygon points="0,-34 30,-17 30,17 0,34 -30,17 -30,-17" fill="none" stroke={color} strokeWidth={6} strokeLinejoin="round" />
      <circle cx={0} cy={-34} r={8} fill={color} /><circle cx={30} cy={17} r={8} fill={color} /><circle cx={-30} cy={17} r={8} fill={color} />
    </g>
  );
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={ME.cereb} intensidad={0.8} />
        {/* una neurona, un receptor */}
        <g opacity={kUno * (1 - clamp(kGrid * 1.6))}>
          <Neurona x={540} y={1000} s={2.0} color={OLC[3]} t={t} brillo={0.6} />
          <g transform="translate(540 872)"><path d="M -12 -14 L 0 6 L 12 -14" stroke={OLC[3]} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" /><circle cy={-22} r={7} fill={OLC[3]} /></g>
        </g>
        {/* ≈ 400 tipos */}
        {Array.from({ length: n }, (_, i) => { const [px, py] = dotPos(i), ac = activo(i); return <circle key={i} cx={px} cy={py} r={9 + 6 * ac} fill={hue(i)} opacity={0.35 + 0.65 * Math.max(ac, kGrid > 0.99 ? (o1 + o2 > 0 ? 0.0 : 0.6) : 0.9)} stroke="#fff" strokeOpacity={ac * 0.9} strokeWidth={3 * ac} />; })}
        {o1 > 0 && ODOR1.map((i) => { const [px, py] = dotPos(i); return <line key={i} x1={150} y1={930} x2={px} y2={py} stroke="#fff" strokeOpacity={0.35 * o1} strokeWidth={2} />; })}
        {o2 > 0 && ODOR2.map((i) => { const [px, py] = dotPos(i); return <line key={i} x1={150} y1={930} x2={px} y2={py} stroke="#fff" strokeOpacity={0.35 * o2} strokeWidth={2} />; })}
        {mol(150, 930, clamp(Math.max(o1, o2) * 1.5), o1 > 0.2 ? "#FFD166" : "#FF9BD0")}
      </svg>
      <Chip x={540} y={1180} texto={"1 NEURONA = 1 TIPO DE RECEPTOR"} color={OLC[3]} px={26} anchor="center" id="ol-r-uno" opacidad={kUno * (1 - clamp(kGrid * 1.6))} />
      <Chip x={540} y={690} texto={`≈ ${n} TIPOS FUNCIONALES EN HUMANOS`} color={ME.oro} px={26} anchor="center" id="ol-r-400" opacidad={clamp(kGrid * 2)} />
      <Chip x={540} y={1345} texto={"un olor = varios receptores a la vez"} color="#fff" px={24} anchor="center" id="ol-r-olor" opacidad={clamp((t - a(R.olor)) / 0.4)} />
      <Frases frases={[{ t: 0.2, texto: "UN RECEPTOR\nPOR NEURONA", px: 84 }, { t: R.cuatro - 0.1, texto: "≈ 400 TIPOS", px: 100, color: ME.oro }, { t: R.olor - 0.1, texto: "CADA OLOR:\nVARIOS A LA VEZ", px: 84, color: "#fff" }]} y={450} x={104} id="titular-ol-receptor" />
      <Fuente texto={`Cada neurona olfatoria expresa un solo gen de receptor; los humanos tenemos unos ${OL.receptoresFuncionales} receptores funcionales (la familia génica ronda los 1000; Axel y Buck, Nobel 2004). Esquema.`} y={1510} delay={R.cuatro} />
      <Cap e={e} />
    </Fondo>
  );
};
