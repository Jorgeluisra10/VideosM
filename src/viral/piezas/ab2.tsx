/**
 * «El par craneal VI: el chivato de la presión» (SINAPSIS · pares craneales) · escenas 2/2
 *   ab-presion   si sube la presión dentro del cráneo, el nervio anclado puede estirarse y el ojo se desvía hacia adentro
 *   ab-falso     es un falso signo localizador: el nervio falla aunque el problema esté lejos, como una masa en otra parte del cerebro
 *   ab-duane     síndrome de Duane: algunas personas nacen sin él; el oculomotor inerva ese músculo y el ojo se retrae
 *   ab-consulta  si ves doble al mirar hacia los lados, consulta con un médico: este nervio puede ser el primero en avisar (cierre)
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { AB, TAB } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { ABC, Ambiente, Cabeza, Cerebro, Chip, DobleH, FONT, Flecha, MONOF, OjoP, PC } from "./ab-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── ab-presion ───────────── */

export const AbPresion: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const R = TAB.presion;
  const kPr = clamp((t - a(R.presion)) / a(1.8)), kAn = clamp((t - a(R.anclado)) / 0.5), kEs = easeOut((t - a(R.estira)) / a(1.0)), kOj = easeOut((t - a(R.ojo)) / 0.9);
  const bajo = 70 * kEs;
  const bx = 260, by = 1010 + bajo, ax = 600, ay = 900;
  const holgura = 70 * (1 - kEs);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1010} color={kEs > 0.3 ? ABC.rojo : ABC.abd} intensidad={0.5 + 0.6 * kEs} />
        <g opacity={clamp(kPr * 3)}>
          <Cerebro x={bx} y={by - 150} s={0.9} brillo={0.4 + 0.4 * kEs} t={t} />
          <rect x={bx - 70} y={by - 40} width={140} height={150} rx={46} fill="#251C44" stroke={PC.cereb} strokeWidth={5} />
          {kPr > 0.2 && [0, 1, 2].map((i) => <path key={i} d={`M ${bx - 90 + i * 90} ${by - 330 + 10 * Math.sin(t * 8 + i)} V ${by - 270}`} stroke={ABC.rojo} strokeWidth={9} strokeLinecap="round" opacity={clamp(kPr * 2)} />)}
        </g>
        {/* nervio como goma entre el tronco y el ancla */}
        <path d={`M ${bx + 70} ${by} Q ${(bx + ax) / 2} ${(by + ay) / 2 + holgura} ${ax} ${ay}`} stroke={kEs > 0.4 ? ABC.rojo : ABC.abd} strokeWidth={12 - 6 * kEs} fill="none" strokeLinecap="round" strokeDasharray={kEs > 0.8 ? "14 8" : "0"} />
        <g opacity={kAn} transform={`translate(${ax} ${ay})`}><circle r={26} fill="#2A2108" stroke={ABC.oro} strokeWidth={6} /><path d="M 0 -12 V 10 M -10 -2 H 10 M -14 6 Q 0 20 14 6" stroke={ABC.oro} strokeWidth={5} fill="none" strokeLinecap="round" /></g>
        <OjoP x={830} y={1100} r={95} pupila={0.5} mira={[-0.3 * kOj, 0]} t={t} brillo={kOj * 0.4} />
        {kOj > 0.1 && <g opacity={kOj}><path d="M 860 1000 L 940 1000" stroke="#8B97B8" strokeWidth={7} strokeDasharray="10 8" strokeLinecap="round" /><circle cx={946} cy={1000} r={22} fill="#3A0A14" stroke={ABC.rojo} strokeWidth={5} /><path d="M 936 990 L 956 1010 M 956 990 L 936 1010" stroke="#fff" strokeWidth={5} strokeLinecap="round" /></g>}
      </svg>
      <Chip x={104} y={690} texto={"PRESIÓN ↑"} color={ABC.rojo} px={28} id="ab-p-pre" opacidad={clamp(kPr * 2)} />
      <Chip x={440} y={800} texto={"ANCLADO"} color={ABC.oro} px={22} id="ab-p-anc" opacidad={kAn} />
      <Chip x={330} y={1130} texto={"SE ESTIRA"} color={ABC.rojo} px={24} id="ab-p-est" opacidad={clamp(kEs * 2)} />
      <Chip x={830} y={1235} texto={"OJO HACIA ADENTRO"} color={ABC.abd} px={20} anchor="center" id="ab-p-oj" opacidad={clamp(kOj * 2)} />
      <Frases frases={[{ t: 0.2, texto: "SUBE LA PRESIÓN\nEN EL CRÁNEO", px: 82 }, { t: R.anclado - 0.1, texto: "EL NERVIO\nANCLADO…", px: 96, color: ABC.oro }, { t: R.estira - 0.1, texto: "PUEDE\nESTIRARSE", px: 100, color: ABC.rojo }, { t: R.ojo - 0.1, texto: "OJO HACIA\nADENTRO", px: 96, color: ABC.abd }]} y={450} x={104} id="titular-ab-presion" />
      <Fuente texto="Con la presión intracraneal alta, el cerebro se desplaza y estira el abducens, fijo en el canal de Dorello: el ojo no puede ir hacia afuera y se desvía hacia adentro (esotropía). Esquema." y={1510} delay={R.estira} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── ab-falso ───────────── */

const CX = 540, CY = 1030, CS = 1.0;
const loc = (lx: number, ly: number): [number, number] => [CX + CS * lx, CY + CS * ly];
export const AbFalso: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const F = TAB.falso;
  const kFa = clamp((t - a(F.falso)) / 0.5), kLe = clamp((t - a(F.lejos)) / a(1.4)), kMa = spr(f, a(F.masa), { damping: 9, stiffness: 180, mass: 0.8 });
  const masa = loc(180, -110), nervio = loc(-70, 130);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1030} color={ABC.rojo} intensidad={0.4 + 0.5 * kMa} />
        <g opacity={kFa}><Cabeza x={CX} y={CY} s={CS} nervio={0} olfat={0} t={t} /></g>
        <circle cx={masa[0]} cy={masa[1]} r={46 * kMa} fill={ABC.rojo} opacity={0.8} stroke="#fff" strokeOpacity={0.5} strokeWidth={4} />
        {kLe > 0 && (
          <g opacity={kLe}>
            <path d={`M ${masa[0] - 40} ${masa[1] + 30} C ${masa[0] - 160} ${masa[1] + 90} ${nervio[0] + 120} ${nervio[1] - 40} ${nervio[0] + 18} ${nervio[1] - 14}`} stroke={ABC.rojo} strokeWidth={6} fill="none" strokeDasharray="12 10" strokeLinecap="round" />
            {[0, 1, 2].map((i) => <circle key={i} cx={masa[0]} cy={masa[1]} r={60 + 40 * ((t * 0.6 + i / 3) % 1)} fill="none" stroke={ABC.rojo} strokeWidth={4} opacity={0.5 * (1 - ((t * 0.6 + i / 3) % 1))} />)}
            <path d={`M ${nervio[0] - 16} ${nervio[1] - 30} C ${nervio[0] - 6} ${nervio[1] + 4} ${nervio[0] + 4} ${nervio[1] + 30} ${nervio[0] + 20} ${nervio[1] + 60}`} stroke={ABC.abd} strokeWidth={12} fill="none" strokeLinecap="round" />
            <circle cx={nervio[0]} cy={nervio[1]} r={34 + 6 * Math.sin(t * 7)} fill="none" stroke={ABC.abd} strokeWidth={5} />
          </g>
        )}
      </svg>
      <Chip x={104} y={690} texto={"FALSO SIGNO\nLOCALIZADOR"} color={ABC.oro} px={26} id="ab-f-fal" opacidad={kFa} />
      <Chip x={976} y={820} texto={"LA MASA ESTÁ AQUÍ"} color={ABC.rojo} px={22} anchor="right" id="ab-f-mas" opacidad={clamp(kMa * 2)} />
      <Chip x={104} y={1260} texto={"EL NERVIO\nFALLA AQUÍ"} color={ABC.abd} px={22} id="ab-f-ner" opacidad={kLe} />
      <Chip x={540} y={1345} texto={"el problema está lejos del nervio"} color="#BFE0FF" px={22} anchor="center" id="ab-f-lej" opacidad={kLe} />
      <Frases frases={[{ t: 0.2, texto: "UN FALSO SIGNO\nLOCALIZADOR", px: 82 }, { t: F.lejos - 0.1, texto: "EL NERVIO FALLA…\nPERO EL PROBLEMA\nESTÁ LEJOS", px: 70, color: ABC.abd }, { t: F.masa - 0.1, texto: "UNA MASA EN\nOTRA PARTE", px: 92, color: ABC.rojo }]} y={450} x={104} id="titular-ab-falso" />
      <Fuente texto="La parálisis del VI es el ejemplo clásico de falso signo localizador: no indica dónde está la lesión; una masa lejana, o una presión intracraneal alta o baja, pueden producirla. Esquema; no es consejo médico." y={1510} delay={F.falso} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── ab-duane ───────────── */

export const AbDuane: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const D = TAB.duane;
  const kNa = clamp((t - a(D.nacen)) / 0.5), kDu = clamp((t - a(D.duane)) / 0.5), kOc = easeOut((t - a(D.oculo)) / a(1.2)), kRe = spr(f, a(D.retrae), { damping: 9, stiffness: 170, mass: 0.9 });
  const sh = 0.86 + 0.14 * (1 - kRe);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1010} color={kOc > 0.3 ? ABC.oculo : ABC.abd} intensidad={0.6} />
        <g opacity={kDu} transform={`translate(540 960) scale(${sh}) translate(-540 -960)`}>
          <OjoP x={540} y={960} r={130} pupila={0.5} mira={[-0.3 * kRe, 0]} parpado={0.32 * kRe} t={t} />
        </g>
        <g opacity={kNa}>
          <rect x={110} y={1190} width={150} height={110} rx={34} fill="#251C44" stroke={PC.cereb} strokeWidth={5} />
          <path d="M 260 1230 L 760 1230" stroke={ABC.abd} strokeWidth={9} strokeDasharray="12 12" strokeLinecap="round" opacity={0.6} />
          <g transform="translate(500 1230)"><circle r={24} fill="#3A0A14" stroke={ABC.rojo} strokeWidth={5} /><path d="M -9 -9 L 9 9 M 9 -9 L -9 9" stroke="#fff" strokeWidth={5} strokeLinecap="round" /></g>
          <rect x={770} y={1200} width={110} height={60} rx={28} fill={ABC.abd} opacity={0.35} />
        </g>
        {kOc > 0 && <path d="M 260 1270 C 400 1350 650 1350 770 1250" pathLength={1} stroke={ABC.oculo} strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray={`${kOc} 2`} />}
      </svg>
      <Chip x={104} y={1160} texto={"TRONCO"} color={"#D9C6FF"} px={18} id="ab-du-tr" opacidad={kNa} />
      <Chip x={500} y={1160} texto={"VI AUSENTE"} color={ABC.rojo} px={20} anchor="center" id="ab-du-vi" opacidad={kNa} />
      <Chip x={820} y={1290} texto={"recto lateral"} color={ABC.abd} px={18} anchor="center" id="ab-du-rl" opacidad={kNa} />
      <Chip x={520} y={1350} texto={"III (oculomotor) lo inerva"} color={ABC.oculo} px={20} anchor="center" id="ab-du-iii" opacidad={clamp(kOc * 2)} />
      <Chip x={104} y={690} texto={"SÍNDROME DE DUANE"} color={ABC.oro} px={26} id="ab-du-sd" opacidad={kDu} />
      <Chip x={976} y={830} texto={"EL OJO SE RETRAE\nAL MIRAR HACIA ADENTRO"} color={ABC.oro} px={18} anchor="right" id="ab-du-ret" opacidad={clamp(kRe * 2)} />
      <Frases frases={[{ t: 0.2, texto: "HAY QUIEN\nNACE SIN ÉL", px: 92 }, { t: D.duane - 0.1, texto: "SÍNDROME\nDE DUANE", px: 100, color: ABC.oro }, { t: D.oculo - 0.1, texto: "EL OCULOMOTOR\nLO REEMPLAZA", px: 80, color: ABC.oculo }, { t: D.retrae - 0.1, texto: "Y EL OJO\nSE RETRAE", px: 96, color: ABC.oro }]} y={450} x={104} id="titular-ab-duane" />
      <Fuente texto={`Síndrome de Duane: ${AB.duane}; fibras del oculomotor inervan el recto lateral y el globo se retrae al aducir (los casos varían). Esquema; no es consejo médico.`} y={1510} delay={D.duane} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── ab-consulta ───────────── */

export const AbConsulta: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TAB.consulta;
  const kDo = clamp((t - a(C.doble)) / 0.8), kMe = spr(f, a(C.medico), { damping: 9, stiffness: 190, mass: 0.8 }), kAv = clamp((t - a(C.avisar)) / 0.5);
  const sep = 130 * kDo * (0.75 + 0.25 * Math.sin(t * 2));
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1030} color={kMe > 0.3 ? "#5CE0A0" : ABC.abd} intensidad={0.5 + 0.5 * kMe} />
        <DobleH x={330} y={1010} px={240} sep={sep} />
        {kDo > 0 && <><Flecha x0={150} y0={830} x1={90} y1={830} color={ABC.abd} k={kDo} /><Flecha x0={510} y0={830} x1={570} y1={830} color={ABC.abd} k={kDo} /></>}
        <g transform={`translate(800 1000) scale(${kMe})`} opacity={clamp(kMe * 2)}>
          <rect x={-100} y={-100} width={200} height={200} rx={34} fill="#0B2A22" stroke="#5CE0A0" strokeWidth={9} />
          <rect x={-20} y={-64} width={40} height={128} rx={8} fill="#fff" /><rect x={-64} y={-20} width={128} height={40} rx={8} fill="#fff" />
        </g>
      </svg>
      <Chip x={330} y={1120} texto={"VES DOBLE AL MIRAR\nHACIA LOS LADOS"} color={ABC.abd} px={22} anchor="center" id="ab-co-dob" opacidad={kDo} />
      <Chip x={800} y={1140} texto={"CONSULTA CON\nUN MÉDICO"} color={"#5CE0A0"} px={24} anchor="center" id="ab-co-med" opacidad={clamp(kMe * 2)} />
      <Chip x={540} y={1300} texto={"este nervio puede ser el primero en avisar"} color={ABC.oro} px={22} anchor="center" id="ab-co-av" opacidad={kAv} />
      <Frases frases={[{ t: 0.2, texto: "SI VES DOBLE AL\nMIRAR A LOS LADOS", px: 78 }, { t: C.medico - 0.1, texto: "CONSULTA CON\nUN MÉDICO", px: 92, color: "#5CE0A0" }, { t: C.avisar - 0.1, texto: "PUEDE SER EL\nPRIMERO EN AVISAR", px: 74, color: ABC.oro }]} y={450} x={104} id="titular-ab-consulta" />
      <Fuente texto="La visión doble horizontal que empeora al mirar hacia un lado puede deberse a una parálisis del VI, que tiene muchas causas y requiere valoración médica. Información general; no es consejo médico." y={1510} delay={C.medico} />
      <Cap e={e} />
    </Fondo>
  );
};
