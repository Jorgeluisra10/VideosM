/**
 * «El par craneal I: el nervio que renace» (SINAPSIS · pares craneales) · escenas 2/2
 *   ol-axones    los axones cruzan la lámina cribosa y las neuronas nuevas deben reconectarse con el bulbo olfatorio
 *   ol-memoria   desde el bulbo las señales llegan a la amígdala y al hipocampo: un olor puede traer un recuerdo
 *   ol-dano      un golpe en la cabeza puede cortar sus fibras; en el COVID-19 el virus parece dañar sobre todo las células de soporte
 *   ol-recupera  muchas personas recuperan el olfato; el entrenamiento olfativo con 4 aromas ayudó en estudios pequeños (cierre)
 * Dibujos esquemáticos de anatomía; no son imágenes médicas reales.
 */
import React from "react";
import { OL, TOL } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Cabeza } from "./pc-kit";
import { Ambiente, Chip, DAN, Epitelio, Frasco, ME, MONOF, NUEVA, OLC, PC, VIRUS, pEp } from "./ol-kit";

type P = { e: EscenaViralGuardada };
const EX = 540, EY = 939, ES = 0.95;

/* ───────────── ol-axones ───────────── */

export const OlAxones: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const X = TOL.axones;
  const kCr = clamp((t - a(X.cruzan)) / 0.5), renace = clamp((t - a(X.nuevas)) / a(2.2)), kBu = clamp((t - a(X.bulbo)) / 0.5);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={PC.olfat} intensidad={0.7} />
        <Epitelio x={EX} y={EY} s={ES} t={t} axones={1} bulbo={1} dano={renace > 0 ? 1 : 0} renace={renace} colores={1} />
        {kBu > 0 && (DAN as readonly number[]).map((i) => { const [px, py] = pEp(EX, EY, ES, [-270, -180, -90, 0, 90, 180, 270][i], 302); return <circle key={i} cx={px} cy={py} r={(24 + 10 * Math.sin(t * 7)) * ES} fill="none" stroke={NUEVA} strokeWidth={4} opacity={kBu} />; })}
      </svg>
      <Chip x={104} y={1090} texto={"LÁMINA\nCRIBOSA"} color={ME.oro} px={20} id="ol-a-lam" opacidad={kCr} />
      <Chip x={104} y={1205} texto={"BULBO"} color={PC.olfat} px={20} id="ol-a-bul" opacidad={kCr} />
      <Chip x={976} y={1335} texto={"axón nuevo en camino al glomérulo"} color={NUEVA} px={22} anchor="right" id="ol-a-nuevo" opacidad={clamp(renace * 3)} />
      <Chip x={976} y={690} texto={"glomérulos"} color="#BFE0FF" px={22} anchor="right" id="ol-a-glo" opacidad={kBu} />
      <Frases frases={[{ t: 0.2, texto: "CRUZAN LA\nLÁMINA CRIBOSA", px: 80 }, { t: X.nuevas - 0.1, texto: "LAS NUEVAS\nSE RECONECTAN", px: 84, color: NUEVA }, { t: X.bulbo - 0.1, texto: "CON EL BULBO\nOLFATORIO", px: 84, color: PC.olfat }]} y={450} x={104} id="titular-ol-axones" />
      <Fuente texto="Los axones de las neuronas olfatorias atraviesan los orificios de la lámina cribosa y hacen sinapsis en los glomérulos del bulbo olfatorio; las neuronas nuevas deben volver a conectarse. Esquema." y={1510} delay={X.nuevas} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── ol-memoria ───────────── */

const CX = 470, CY = 1010, CS = 1.08;
const AMI: [number, number] = [52, -2], HIP: [number, number] = [-28, 10], BUL: [number, number] = [205, 28];
export const OlMemoria: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const M = TOL.memoria;
  const kBu = clamp((t - a(M.bulbo)) / 0.5), kAm = clamp((t - a(M.amigdala)) / 0.7), kHi = clamp((t - a(M.hipocampo)) / 0.7);
  const kRe = spr(f, a(M.recuerdo), { damping: 9, stiffness: 180, mass: 0.8 });
  const pulso = (u: number, p0: [number, number], p1: [number, number]): [number, number] => [lerp(p0[0], p1[0], easeOut(u)), lerp(p0[1], p1[1], easeOut(u))];
  const pa = pulso(clamp((t - a(M.amigdala) + 0.7) / 0.7), BUL, AMI), ph = pulso(clamp((t - a(M.hipocampo) + 0.7) / 0.7), AMI, HIP);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={ME.cereb} intensidad={0.8} />
        <Cabeza x={CX} y={CY} s={CS} nervio={1} olfat={kBu} pulso={0.3} t={t} />
        <g transform={`translate(${CX} ${CY}) scale(${CS})`}>
          <path d={`M ${BUL[0]} ${BUL[1]} C 150 20 100 4 ${AMI[0]} ${AMI[1]}`} stroke={PC.rojo} strokeWidth={8} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${kAm} 2`} opacity={0.9} />
          <path d={`M ${AMI[0]} ${AMI[1]} C 30 14 0 20 ${HIP[0]} ${HIP[1]}`} stroke={PC.olfat} strokeWidth={8} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${kHi} 2`} opacity={0.9} />
          <ellipse cx={AMI[0]} cy={AMI[1]} rx={22} ry={16} fill={PC.rojo} opacity={0.3 + 0.5 * kAm} stroke="#fff" strokeOpacity={0.6 * kAm} strokeWidth={3} />
          <path d={`M ${HIP[0] + 26} ${HIP[1] - 12} C ${HIP[0] + 4} ${HIP[1] - 20} ${HIP[0] - 24} ${HIP[1] - 6} ${HIP[0] - 22} ${HIP[1] + 14}`} stroke={PC.olfat} strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.3 + 0.7 * kHi} />
          {kAm > 0 && kAm < 1 && <circle cx={pa[0]} cy={pa[1]} r={8} fill="#fff" />}
          {kHi > 0 && kHi < 1 && <circle cx={ph[0]} cy={ph[1]} r={8} fill="#fff" />}
        </g>
        {/* recuerdo */}
        <g transform={`translate(${790} ${770}) scale(${kRe})`} opacity={clamp(kRe * 2)}>
          <ellipse rx={150} ry={74} fill="#0F1A38" stroke={ME.oro} strokeWidth={5} />
          <circle cx={-90} cy={80} r={14} fill="#0F1A38" stroke={ME.oro} strokeWidth={4} /><circle cx={-60} cy={112} r={8} fill="#0F1A38" stroke={ME.oro} strokeWidth={4} />
          <path d="M 0 22 C -34 -4 -50 -30 -28 -44 C -12 -54 0 -42 0 -34 C 0 -42 12 -54 28 -44 C 50 -30 34 -4 0 22 Z" fill={PC.rojo} />
        </g>
      </svg>
      <Chip x={104} y={690} texto={"BULBO OLFATORIO"} color={PC.olfat} px={24} id="ol-me-bul" opacidad={kBu} />
      <Chip x={104} y={1345} texto={"AMÍGDALA · emoción"} color={PC.rojo} px={22} id="ol-me-ami" opacidad={kAm} />
      <Chip x={976} y={1345} texto={"HIPOCAMPO · memoria"} color={PC.olfat} px={22} anchor="right" id="ol-me-hip" opacidad={kHi} />
      <Chip x={790} y={890} texto={"¡un recuerdo!"} color={ME.oro} px={26} anchor="center" id="ol-me-rec" opacidad={clamp(kRe * 2 - 0.4)} />
      <Frases frases={[{ t: 0.2, texto: "DEL BULBO A LA…", px: 84 }, { t: M.amigdala - 0.1, texto: "AMÍGDALA Y AL\nHIPOCAMPO", px: 84, color: PC.rojo }, { t: M.recuerdo - 0.1, texto: "UN OLOR,\nUN RECUERDO", px: 96, color: ME.oro }]} y={450} x={104} id="titular-ol-memoria" />
      <Fuente texto="Las señales del bulbo olfatorio llegan a la corteza olfatoria y a estructuras límbicas como la amígdala y el hipocampo, ligadas a la emoción y la memoria. Esquema simplificado." y={1510} delay={M.amigdala} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── ol-dano ───────────── */

export const OlDano: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const D = TOL.dano;
  const golpe = clamp((t - a(D.golpe) - 0.5) / 0.3) * (1 - clamp((t - a(D.covid) + 0.2) / 0.4));
  const virus = clamp((t - a(D.covid)) / a(1.8)), soporte = clamp((t - a(D.soporte)) / 0.8);
  const kGo = clamp((t - a(D.golpe)) / 0.3), kCo = clamp((t - a(D.covid)) / 0.4), kNo = clamp((t - a(D.noneuronas)) / 0.4);
  const impacto = clamp((t - a(D.golpe) - 0.3) / 0.6);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={PC.rojo} intensidad={0.5 + 0.4 * golpe + 0.4 * soporte} />
        <Epitelio x={EX} y={EY} s={ES} t={t} axones={1} bulbo={1} corte={golpe} virus={virus} soporte={soporte} />
        {kGo > 0 && t < a(D.covid) + 0.3 && (
          <g transform="translate(150 790)" opacity={kGo * (1 - clamp((t - a(D.covid)) / 0.3))}>
            <polygon points="0,-60 14,-22 52,-34 28,-2 60,20 20,22 16,60 -6,26 -42,48 -26,10 -62,-8 -22,-14" fill="#FF9E3D" stroke="#fff" strokeWidth={3} transform={`scale(${0.6 + 0.6 * impacto})`} />
          </g>
        )}
      </svg>
      <Chip x={104} y={1060} texto={"GOLPE:\nFIBRAS\nCORTADAS"} color={PC.rojo} px={20} id="ol-d-golpe" opacidad={golpe} />
      <Chip x={976} y={690} texto={"COVID-19: virus"} color={VIRUS} px={24} anchor="right" id="ol-d-cov" opacidad={kCo} />
      <Chip x={976} y={1335} texto={"parece dañar células de soporte, no neuronas"} color={"#FFB347"} px={20} anchor="right" id="ol-d-sop" opacidad={clamp(soporte * kNo + soporte * 0.6)} />
      <Frases frases={[{ t: 0.2, texto: "UN GOLPE CORTA\nSUS FIBRAS", px: 80 }, { t: D.covid - 0.1, texto: "COVID-19: SOBRE\nTODO CÉLULAS\nDE SOPORTE", px: 64, color: VIRUS }]} y={450} x={104} id="titular-ol-dano" />
      <Fuente texto="Tras un traumatismo craneal pueden romperse las fibras olfatorias al pasar por la lámina cribosa; en el COVID-19 el receptor ACE2 está en las células de soporte, no en las neuronas olfatorias. Esquema; no es consejo médico." y={1510} delay={D.covid} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── ol-recupera ───────────── */

export const OlRecupera: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const R = TOL.recupera;
  const renace = clamp((t - a(R.recuperan)) / a(3.0)), dano = 1 - clamp((t - a(R.recuperan)) / a(1.0)) * 0.0;
  const kEn = clamp((t - a(R.entrena)) / 0.5), kEs = spr(f, a(R.estudios), { damping: 9, stiffness: 190, mass: 0.8 });
  const frascos: [string, string][] = [["#FF7EB6", "ROSA"], ["#F7E26B", "LIMÓN"], ["#B5651D", "CLAVO"], ["#7BE08A", "EUCALIPTO"]];
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={900} color={NUEVA} intensidad={0.6 + 0.6 * renace} />
        <Epitelio x={EX} y={820} s={0.62} t={t} dano={dano} renace={renace} madre={0.6} axones={1} bulbo={1} />
        {frascos.map(([c, tx], i) => <Frasco key={tx} x={190 + i * 233} y={1190} s={0.95} color={c} texto={tx} k={clamp((t - a(R.cuatro + i * 0.28)) / 0.4)} />)}
        {kEs > 0.05 && (
          <g transform={`translate(760 1092) rotate(-5) scale(${kEs})`}>
            <rect x={-170} y={-28} width={340} height={56} rx={10} fill="rgba(11,18,40,0.92)" stroke={ME.oro} strokeWidth={4} />
            <text y={9} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={24} fill={ME.oro}>ESTUDIOS PEQUEÑOS</text>
          </g>
        )}
      </svg>
      <Chip x={540} y={1345} texto={`${OL.entrenamiento.vecesDia} veces al día · ${OL.entrenamiento.semanas} semanas · ${OL.entrenamiento.aromas} aromas`} color="#BFE0FF" px={24} anchor="center" id="ol-r-regimen" opacidad={kEn} />
      <Chip x={104} y={1000} texto={"neuronas nuevas\nreconectándose"} color={NUEVA} px={20} id="ol-rc-nuevas" opacidad={clamp(renace * 2)} />
      <Frases frases={[{ t: 0.2, texto: "MUCHAS PERSONAS\nLO RECUPERAN", px: 72 }, { t: R.entrena - 0.1, texto: "ENTRENAMIENTO\nOLFATIVO", px: 80, color: NUEVA }]} y={450} x={104} id="titular-ol-recupera" />
      <Fuente texto="Entrenamiento olfativo clásico (Hummel y cols., 2009): oler rosa, limón, clavo y eucalipto dos veces al día durante 12 semanas; la evidencia viene de estudios pequeños. No es consejo médico." y={1510} delay={R.entrena} />
      <Cap e={e} />
    </Fondo>
  );
};
