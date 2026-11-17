/**
 * «El par craneal X: el vago, el nervio errante» (SINAPSIS · pares craneales) · escenas 1/2
 *   vg-gancho  el vago, «el errante»: baja de la cabeza al abdomen y toca corazón, pulmones e intestino
 *   vg-sigue   aviso rápido: síguenos en SINAPSIS y no te pierdas ningún par craneal (fila de pares con el X en dorado)
 *   vg-loewi   Otto Loewi frenó el corazón de una rana con el vago y halló el primer mensajero químico nervioso (1921)
 *   vg-desmayo ver sangre o estar mucho de pie puede frenar el corazón y provocar un desmayo vasovagal
 *   vg-oido    una rama del vago llega al conducto del oído: tocarlo provoca tos en algunas personas
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { TVG, VG } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { SigueActual } from "./va1";
import { Gota } from "./fa-kit";
import { Persona } from "./gl-kit";
import { Ambiente, Cerebro, Chip, Corazon, FONT, GLC, Manometro, MONOF, Oreja, Torso, VGC, VR, pT, polyPt } from "./vg-kit";

type P = { e: EscenaViralGuardada };

export const VgSigue: React.FC<P> = ({ e }) => <SigueActual e={e} actual={10} />;

/* ───────────── vg-gancho ───────────── */

export const VgGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TVG.gancho;
  const kV = clamp((t - a(G.vago)) / a(2.6)), kC = clamp((t - a(G.toca)) / a(0.8)), kP = clamp((t - a(G.toca + 0.5)) / a(0.8)), kI = clamp((t - a(G.toca + 1.0)) / a(0.8));
  const X = 540, Y = 1045, S = 0.95;
  const [ax, ay] = polyPt(VR.izq, (t * 0.4) % 1), [bx, by] = polyPt(VR.der, (t * 0.4 + 0.25) % 1);
  const [ix, iy] = pT(X, Y, S, ax, ay), [dx, dy] = pT(X, Y, S, bx, by);
  const corazon = pT(X, Y, S, 222, 372), pul = pT(X, Y, S, 150, 335), intes = pT(X, Y, S, 270, 560), cuello = pT(X, Y, S, 238, 190);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={VGC.vago} intensidad={0.5} />
        <Torso x={X} y={Y} s={S} t={t} v={kV} rc={kC} rp={kP} ri={kI} luzC={kC} luzP={kP} luzI={kI} />
        {kV > 0.1 && kV < 1 && <><circle cx={ix} cy={iy} r={9} fill="#fff" /><circle cx={dx} cy={dy} r={9} fill="#fff" /></>}
        <g stroke={VGC.hueso} strokeWidth={3} strokeDasharray="8 8" strokeLinecap="round" fill="none">
          <path d={`M 690 1030 L ${corazon[0] + 20} ${corazon[1]}`} opacity={kC} />
          <path d={`M 440 975 L ${pul[0] - 10} ${pul[1] - 8}`} opacity={kP} />
          <path d={`M 690 1218 L ${intes[0] + 10} ${intes[1] + 20}`} opacity={kI} />
          <path d={`M 690 790 L ${cuello[0] + 10} ${cuello[1]}`} opacity={clamp(kV * 4)} />
        </g>
      </svg>
      <Chip x={694} y={1010} texto={"CORAZÓN"} color={GLC.rojo} px={24} id="vg-g-co" opacidad={kC} />
      <Chip x={104} y={950} texto={"PULMONES"} color={VGC.pulm} px={24} id="vg-g-pu" opacidad={kP} />
      <Chip x={694} y={1200} texto={"INTESTINO"} color={VGC.gut} px={24} id="vg-g-in" opacidad={kI} />
      <Chip x={694} y={760} texto={"X · VAGO\n«EL ERRANTE»"} color={VGC.vago} px={22} id="vg-g-va" opacidad={clamp(kV * 4)} />
      <Frases frases={[{ t: 0.2, texto: "EL PAR\nCRANEAL X", px: 100 }, { t: G.errante - 0.1, texto: "EL VAGO:\n«EL ERRANTE»", px: 96, color: VGC.vago }, { t: G.toca - 0.1, texto: "CORAZÓN, PULMONES\nE INTESTINO", px: 76, color: VGC.oro }]} y={450} x={104} id="titular-vg-gancho" />
      <Fuente texto={`«Vagus» significa «errante» en latín: el nervio vago (X) recorre cabeza, cuello, tórax y abdomen, con ramas al corazón, los pulmones y el intestino. Esquema.`} y={1510} delay={G.vago} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── vg-loewi ───────────── */

export const VgLoewi: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const L = TVG.loewi;
  const kRana = clamp((t - a(L.loewi)) / 0.6), kFr = clamp((t - a(L.freno)) / 0.5), kVa = clamp((t - a(L.vago)) / a(0.8)), kHa = clamp((t - a(L.hallo)) / 0.5), kMe = spr(f, a(L.mensajero), { damping: 10, stiffness: 190, mass: 0.8 });
  const fA = t > a(L.freno + 0.6) ? 4 : 9, fB = t > a(L.hallo) ? 4 : 9;
  const gotas = (i: number): number => ((t * 0.45 + i / 4) % 1);
  const flujo = kVa;
  const pt = (u: number): [number, number] => { const k = clamp(u); const x = lerp(350, 730, k), y = 1040 + 62 * Math.sin(Math.PI * k); return [x, y]; };
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1040} color={VGC.vago} intensidad={0.5} />
        <g opacity={kRana}>
          <Corazon x={290} y={990} s={0.95} t={t} freq={fA} />
          <Corazon x={790} y={990} s={0.95} t={t} freq={fB} />
          <path d="M 350 1030 C 450 1110 630 1110 730 1030" stroke="#2B3A66" strokeWidth={22} fill="none" strokeLinecap="round" />
          <path d="M 350 1030 C 450 1110 630 1110 730 1030" stroke="#6AD0E6" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.5} />
          {flujo > 0 && [0, 1, 2, 3].map((i) => { const [gx, gy] = pt(gotas(i) * Math.min(1, flujo * 1.2)); return <circle key={i} cx={gx} cy={gy} r={9} fill={VGC.oro} opacity={0.95} />; })}
        </g>
        {kFr > 0 && <g opacity={kFr}>
          <path d="M 140 850 C 170 900 215 925 250 955" pathLength={1} stroke={VGC.vago} strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray={`${clamp(kFr * 1.2)} 2`} />
          <g transform="translate(120 830)"><path d="M 14 -34 L -14 4 L 4 4 L -10 34 L 20 -8 L 2 -8 Z" fill={GLC.oro} stroke="#fff" strokeWidth={3} strokeLinejoin="round" /></g>
        </g>}
      </svg>
      <Chip x={290} y={1100} texto={"RANA 1"} color={VGC.hueso} px={22} anchor="center" id="vg-l-r1" opacidad={kRana} />
      <Chip x={790} y={1100} texto={"RANA 2"} color={VGC.hueso} px={22} anchor="center" id="vg-l-r2" opacidad={kRana} />
      <Chip x={104} y={735} texto={"ESTIMULA\nEL VAGO"} color={VGC.vago} px={22} id="vg-l-es" opacidad={kFr} />
      <Chip x={540} y={1170} texto={"LÍQUIDO"} color={VGC.oro} px={22} anchor="center" id="vg-l-li" opacidad={kVa} />
      <Chip x={540} y={1250} texto={"VAGUSSTOFF → ACETILCOLINA"} color={VGC.oro} px={26} anchor="center" id="vg-l-ac" opacidad={kMe} />
      <Chip x={976} y={780} texto={"1921"} color={VGC.hueso} px={30} anchor="right" id="vg-l-ano" opacidad={clamp(kRana * 2)} />
      <Frases frases={[{ t: 0.2, texto: "1921:\nOTTO LOEWI", px: 100 }, { t: L.freno - 0.1, texto: "FRENÓ EL CORAZÓN\nDE UNA RANA", px: 78, color: VGC.vago }, { t: L.hallo - 0.1, texto: "EL PRIMER MENSAJERO\nQUÍMICO NERVIOSO", px: 70, color: VGC.oro }]} y={450} x={104} id="titular-vg-loewi" />
      <Fuente texto={`Loewi estimuló el vago de un corazón de rana (se frenó) y el líquido de ese corazón frenó un segundo corazón: la sustancia (Vagusstoff) era ${VG.loewi.sustancia}, el ${VG.loewi.primero}; Nobel ${VG.loewi.premio}. La anécdota del sueño es discutida. Esquema.`} y={1510} delay={L.loewi} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── vg-desmayo ───────────── */

export const VgDesmayo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const D = TVG.desmayo;
  const kSa = spr(f, a(D.sangre), { damping: 10, stiffness: 190, mass: 0.8 }), kPie = clamp((t - a(D.pie)) / 0.5), kFr = clamp((t - a(D.frenar)) / 0.8), kDe = easeOut((t - a(D.desmayo)) / 0.8), kVa = clamp((t - a(D.vasovagal)) / 0.4);
  const freq = kFr > 0.2 ? 3.5 : 9;
  const valor = lerp(0.7, -0.8, easeOut(kFr));
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={kDe > 0.2 ? GLC.rojo : VGC.vago} intensidad={0.55} />
        <g opacity={clamp(kSa * 2)} transform={`translate(0 ${lerp(16, 0, easeOut(kSa))})`}><Gota x={180} y={890} s={1.3} color={GLC.rojo} /></g>
        <g opacity={kPie}><g transform={`translate(470 1092) rotate(${-82 * kDe})`}><g transform="translate(0 -112)"><Persona x={0} y={0} s={2.0} color="#8FA3C8" /></g></g></g>
        <g opacity={clamp(kFr * 2 + 0.0)}><Corazon x={800} y={960} s={0.95} t={t} freq={freq} ritmo={kFr > 0.9 ? 0.5 : 1} color={GLC.rojo} /></g>
        <g opacity={kFr}><Manometro x={800} y={1190} s={0.8} valor={valor} /></g>
      </svg>
      <Chip x={180} y={1010} texto={"VER SANGRE"} color={GLC.rojo} px={22} anchor="center" id="vg-d-sa" opacidad={kSa} />
      <Chip x={470} y={1180} texto={"MUCHO RATO\nDE PIE"} color={VGC.hueso} px={22} anchor="center" id="vg-d-pi" opacidad={kPie} />
      <Chip x={800} y={1050} texto={"CORAZÓN\nMÁS LENTO"} color={GLC.rojo} px={22} anchor="center" id="vg-d-co" opacidad={kFr} />
      <Chip x={800} y={1290} texto={"PRESIÓN BAJA"} color={VGC.vago} px={22} anchor="center" id="vg-d-pr" opacidad={kFr} />
      <Chip x={540} y={1330} texto={"DESMAYO VASOVAGAL"} color={VGC.oro} px={30} anchor="center" id="vg-d-va" opacidad={kVa} />
      <Frases frases={[{ t: 0.2, texto: "VER SANGRE O\nESTAR DE PIE…", px: 84 }, { t: D.frenar - 0.1, texto: "…PUEDE FRENAR\nEL CORAZÓN", px: 86, color: GLC.rojo }, { t: D.desmayo - 0.1, texto: "DESMAYO\nVASOVAGAL", px: 100, color: VGC.oro }]} y={450} x={104} id="titular-vg-desmayo" />
      <Fuente texto={`En el desmayo ${VG.desmayo} se activa de golpe el vago (el corazón se frena) y baja la presión; el mecanismo exacto sigue en estudio. Si te desmayas sin explicación, consulta a un médico. Esquema.`} y={1510} delay={D.frenar} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── vg-oido ───────────── */

export const VgOido: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const O = TVG.oido;
  const kRa = clamp((t - a(O.rama)) / a(2.0)), kCo = clamp((t - a(O.conducto)) / 0.5), kHi = clamp((t - a(O.personas)) / a(1.1)), kTo = spr(f, a(O.tos), { damping: 8, stiffness: 220, mass: 0.7 });
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={VGC.vago} intensidad={0.5} />
        <Oreja x={470} y={1070} s={1.3} hisopo={t >= a(O.personas) ? kHi : -1} rama={kRa} t={t} />
        <g opacity={kRa}><Cerebro x={820} y={850} s={0.7} brillo={0.3 + 0.7 * kTo} t={t} /></g>
        {kTo > 0 && <path d="M 820 930 L 820 1110" pathLength={1} stroke={VGC.vago} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray={`${clamp(kTo)} 2`} />}
        <g opacity={clamp(kTo * 2)} transform={`translate(820 ${lerp(1190, 1170, easeOut(kTo))}) scale(${0.7 + 0.3 * kTo})`}>
          <rect x={-120} y={-44} width={240} height={88} rx={30} fill="rgba(11,18,40,0.94)" stroke={VGC.oro} strokeWidth={6} />
          <text y={14} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={46} fill={VGC.oro} data-texto="vg-o-tos">¡COF, COF!</text>
        </g>
      </svg>
      <Chip x={104} y={1220} texto={"CONDUCTO\nDEL OÍDO"} color={VGC.hueso} px={22} id="vg-o-co" opacidad={kCo} />
      <Chip x={640} y={712} texto={"RAMA AURICULAR\nDEL VAGO"} color={VGC.vago} px={20} id="vg-o-ra" opacidad={kRa} />
      <Chip x={540} y={1345} texto={"NO METAS OBJETOS EN EL OÍDO"} color={GLC.rojo} px={20} anchor="center" id="vg-o-se" opacidad={kHi} />
      <Frases frases={[{ t: 0.2, texto: "UNA RAMA DEL VAGO\nLLEGA AL OÍDO", px: 74, color: VGC.vago }, { t: O.personas - 0.1, texto: "TOCARLO PUEDE\nDAR TOS", px: 94, color: VGC.oro }]} y={450} x={104} id="titular-vg-oido" />
      <Fuente texto={`La rama auricular del vago (nervio de Arnold) inerva parte del conducto auditivo; el reflejo oído-tos aparece en ≈ 2–4 % de las personas (más en quienes tienen tos crónica). No introduzcas objetos en el oído. Esquema.`} y={1510} delay={O.conducto} />
      <Cap e={e} />
    </Fondo>
  );
};
