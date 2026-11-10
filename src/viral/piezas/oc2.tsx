/**
 * «El par craneal III: la pupila que avisa» (SINAPSIS · pares craneales) · escenas 2/2
 *   oc-fibras       las fibras de la pupila van por la superficie del nervio y suelen ser las primeras en sufrir al comprimirlo
 *   oc-herniacion   si sube la presión dentro del cráneo, el lóbulo temporal puede aplastar el nervio y dilatar la pupila
 *   oc-aneurisma    un aneurisma cercano también puede comprimirlo: párpado caído, ojo hacia abajo y afuera y pupila dilatada
 *   oc-urgencia     un párpado caído de golpe, con visión doble o dolor de cabeza intenso, merece atención médica urgente (cierre)
 * Dibujos esquemáticos de anatomía; no son imágenes médicas reales.
 */
import React from "react";
import { OC, TOC } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Ambiente, Aviso, Chip, FONT, MONOF, ME, OCC, OjoP, PC, azar, mezclar } from "./oc-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── oc-fibras ───────────── */

const CX = 540, CY = 1060, CR = 210;
const NUC = Array.from({ length: 34 }, (_, i) => { const an = azar(i * 2.3) * Math.PI * 2, rad = Math.sqrt(azar(i * 4.7 + 1)) * 125; return [CX + Math.cos(an) * rad, CY + Math.sin(an) * rad] as [number, number]; });
const ANI = Array.from({ length: 46 }, (_, i) => { const an = (i / 46) * Math.PI * 2, rad = 172 + 14 * azar(i * 3.9); return [CX + Math.cos(an) * rad, CY + Math.sin(an) * rad, an] as [number, number, number]; });
export const OcFibras: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const F = TOC.fibras;
  const kSu = clamp((t - a(F.superficie)) / 0.6), kPr = clamp((t - a(F.primeras)) / 0.5), kCo = easeOut((t - a(F.comprime)) / 0.9);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={kCo > 0.2 ? OCC.rojo : OCC.pupila} intensidad={0.7} />
        <g transform={`translate(${CX} ${CY}) scale(${1 - 0.16 * kCo} 1) translate(${-CX} ${-CY})`}>
          <circle cx={CX} cy={CY} r={CR} fill="#141C3C" stroke="#8B6B4A" strokeWidth={12} />
          {NUC.map(([px, py], i) => <circle key={i} cx={px} cy={py} r={12} fill={OCC.oculo} stroke="#fff" strokeOpacity={0.4} strokeWidth={2} />)}
          {ANI.map(([px, py, an], i) => {
            const lado = Math.cos(an) > 0.2, dano = lado ? kCo : 0;
            return <circle key={i} cx={px} cy={py} r={6 + (kPr > 0 ? 1.5 * Math.sin(t * 6 + i) * (1 - dano) : 0)} fill={mezclar(OCC.pupila, OCC.rojo, clamp(dano * 1.4))} opacity={1 - 0.7 * clamp((dano - 0.5) * 2)} />;
          })}
        </g>
        {kCo > 0 && (
          <g transform={`translate(${lerp(960, CX + CR * (1 - 0.16 * kCo) - 6, kCo)} ${CY})`} opacity={clamp(kCo * 3)}>
            <rect x={0} y={-150} width={26} height={300} rx={12} fill={OCC.rojo} opacity={0.9} />
            {[-100, 0, 100].map((y) => <path key={y} d={`M 80 ${y} L 40 ${y} M 56 ${y - 14} L 38 ${y} L 56 ${y + 14}`} stroke={OCC.rojo} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
          </g>
        )}
      </svg>
      <Chip x={104} y={720} texto={"FIBRAS DE LA PUPILA\n(parasimpáticas)"} color={OCC.pupila} px={22} id="oc-f-pup" opacidad={kSu} />
      <Chip x={104} y={1310} texto={"FIBRAS DE LOS MÚSCULOS"} color={OCC.oculo} px={20} id="oc-f-mus" opacidad={kSu} />
      <Chip x={976} y={1310} texto={"primeras en sufrir"} color={OCC.rojo} px={22} anchor="right" id="oc-f-pri" opacidad={clamp(kCo * 2)} />
      <Frases frases={[{ t: 0.2, texto: "LAS FIBRAS DE LA\nPUPILA: EN LA\nSUPERFICIE", px: 76 }, { t: F.primeras - 0.1, texto: "LAS PRIMERAS\nEN SUFRIR", px: 96, color: OCC.rojo }]} y={450} x={104} id="titular-oc-fibras" />
      <Fuente texto="Corte esquemático del nervio oculomotor: las fibras parasimpáticas de la pupila ocupan la superficie y suelen afectarse primero por compresión; es la explicación clásica y tiene matices. Esquema, no a escala." y={1510} delay={F.superficie} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── oc-herniacion ───────────── */

export const OcHerniacion: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const H2 = TOC.herniacion;
  const kPr = clamp((t - a(H2.presion)) / a(1.8)), kLo = easeOut((t - a(H2.lobulo)) / a(1.6)), kAp = spr(f, a(H2.aplasta), { damping: 10, stiffness: 190, mass: 0.8 }), kDi = easeOut((t - a(H2.dilata)) / 0.7);
  const uncus: [number, number] = [lerp(690, 618, kLo), lerp(1150, 1142, kLo)];
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1030} color={kAp > 0.3 ? OCC.rojo : OCC.cereb} intensidad={0.6 + 0.4 * kPr} />
        <g transform="translate(-70 -40) translate(540 1020) scale(0.88) translate(-540 -1020)">
        <ellipse cx={540} cy={1020} rx={330} ry={270} fill="none" stroke={OCC.hueso} strokeWidth={10} opacity={0.85} />
        <ellipse cx={410} cy={1000} rx={150} ry={210} fill="#251C44" stroke={OCC.cereb} strokeWidth={5} />
        <ellipse cx={670} cy={1000} rx={150} ry={210} fill="#251C44" stroke={OCC.cereb} strokeWidth={5} />
        <path d={`M 540 790 C ${540 - 24 * kPr} 900 ${540 - 24 * kPr} 1000 540 1100`} stroke="#8B97B8" strokeWidth={4} fill="none" strokeDasharray="8 8" />
        {/* masa que crece */}
        <circle cx={700} cy={900} r={20 + 54 * kPr} fill={OCC.rojo} opacity={0.75} stroke="#fff" strokeOpacity={0.4} strokeWidth={3} />
        {/* tienda del cerebelo y tronco */}
        <path d="M 250 1150 L 500 1140 M 580 1140 L 830 1150" stroke="#C9B79A" strokeWidth={10} strokeLinecap="round" />
        <rect x={500} y={1100} width={80} height={190} rx={26} fill="#3A2A5A" stroke={OCC.cereb} strokeWidth={4} />
        {/* uncus */}
        <ellipse cx={uncus[0]} cy={uncus[1]} rx={52} ry={34} fill="#6A4FB0" stroke="#fff" strokeOpacity={0.5} strokeWidth={3} />
        {/* nervio III */}
        <path d="M 572 1130 C 590 1150 620 1160 660 1172 L 740 1185" stroke={kAp > 0.3 ? OCC.rojo : OCC.oculo} strokeWidth={9} fill="none" strokeLinecap="round" />
        {kAp > 0.1 && <circle cx={612} cy={1160} r={22 * kAp} fill="none" stroke={OCC.rojo} strokeWidth={5} />}
        {/* flechas de presión */}
        {kPr > 0.1 && [[800, 800], [830, 900], [700, 760]].map(([x, y], i) => <path key={i} d={`M ${x + 40} ${y - 40} L ${x} ${y} M ${x + 4} ${y - 26} L ${x} ${y} L ${x + 26} ${y - 6}`} stroke={OCC.rojo} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={clamp(kPr * 2)} />)}
        </g>
        <OjoP x={880} y={1010} r={56} pupila={lerp(0.4, 0.95, kDi)} t={t} brillo={kDi * 0.5} />
      </svg>
      <Chip x={104} y={720} texto={"PRESIÓN\nINTRACRANEAL ↑"} color={OCC.rojo} px={24} id="oc-h-pres" opacidad={clamp(kPr * 3)} />
      <Chip x={104} y={1290} texto={"UNCUS (lóbulo temporal)"} color={"#D9C6FF"} px={20} id="oc-h-unc" opacidad={clamp(kLo * 3)} />
      <Chip x={976} y={1290} texto={"NERVIO III APLASTADO"} color={OCC.rojo} px={20} anchor="right" id="oc-h-ner" opacidad={clamp(kAp * 2)} />
      <Chip x={880} y={1085} texto={"PUPILA\nDILATADA"} color={"#FFB347"} px={18} anchor="center" id="oc-h-pup" opacidad={clamp(kDi * 2)} />
      <Frases frases={[{ t: 0.2, texto: "SUBE LA PRESIÓN\nEN EL CRÁNEO", px: 80 }, { t: H2.lobulo - 0.1, texto: "SE DESPLAZA EL\nLÓBULO TEMPORAL", px: 72, color: "#D9C6FF" }, { t: H2.aplasta - 0.1, texto: "APLASTA EL\nNERVIO", px: 96, color: OCC.rojo }, { t: H2.dilata - 0.1, texto: "PUPILA\nDILATADA", px: 96, color: "#FFB347" }]} y={450} x={104} id="titular-oc-herniacion" />
      <Fuente texto="Herniación del uncus: con la presión intracraneal elevada, el lóbulo temporal puede comprimir el oculomotor contra el borde de la tienda del cerebelo; la pupila dilatada del mismo lado es un signo clásico. Corte coronal esquemático." y={1510} delay={H2.lobulo} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── oc-aneurisma ───────────── */

export const OcAneurisma: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const A = TOC.aneurisma;
  const kAn = spr(f, a(A.aneurisma) + 0.2, { damping: 9, stiffness: 160, mass: 0.8 }), kPa = easeOut((t - a(A.parpado)) / 0.7), kOj = easeOut((t - a(A.ojo)) / 0.8), kPu = easeOut((t - a(A.pupila)) / 0.6);
  const latido = 1 + 0.06 * Math.sin(t * 6);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={OCC.rojo} intensidad={0.4 + 0.4 * kAn} />
        <OjoP x={300} y={860} r={82} pupila={0.5} t={t} />
        <OjoP x={560} y={860} r={82} pupila={lerp(0.5, 0.95, kPu)} mira={[0.3 * kOj, 0.34 * kOj]} parpado={0.62 * kPa} t={t} brillo={kPu * 0.4} />
        {/* arteria y aneurisma sobre el nervio */}
        <path d="M 120 1150 L 960 1150" stroke={OCC.rojo} strokeWidth={30} strokeLinecap="round" opacity={0.9} />
        <circle cx={560} cy={1108} r={58 * kAn * latido} fill={OCC.rojo} stroke="#fff" strokeOpacity={0.5} strokeWidth={4} opacity={clamp(kAn * 2)} />
        <path d={`M 120 1262 L 440 1262 Q 560 ${1262 - 36 * kAn} 680 1262 L 960 1262`} stroke={OCC.oculo} strokeWidth={14} fill="none" strokeLinecap="round" />
      </svg>
      <Chip x={976} y={780} texto={"PÁRPADO CAÍDO"} color={"#D9C6FF"} px={22} anchor="right" id="oc-a-par" opacidad={clamp(kPa * 2)} />
      <Chip x={976} y={850} texto={"OJO HACIA ABAJO\nY AFUERA"} color={OCC.oculo} px={22} anchor="right" id="oc-a-ojo" opacidad={clamp(kOj * 2)} />
      <Chip x={976} y={940} texto={"PUPILA DILATADA"} color={"#FFB347"} px={22} anchor="right" id="oc-a-pup" opacidad={clamp(kPu * 2)} />
      <Chip x={976} y={1075} texto={"ANEURISMA\n(a. comunicante posterior)"} color={OCC.rojo} px={18} anchor="right" id="oc-a-an" opacidad={clamp(kAn * 2)} />
      <Chip x={104} y={1290} texto={"NERVIO III comprimido"} color={OCC.oculo} px={20} id="oc-a-ner" opacidad={clamp(kAn * 2)} />
      <Frases frases={[{ t: 0.2, texto: "UN ANEURISMA\nCERCANO", px: 88 }, { t: A.parpado - 0.1, texto: "PÁRPADO\nCAÍDO", px: 100, color: "#D9C6FF" }, { t: A.ojo - 0.1, texto: "OJO HACIA\nABAJO Y AFUERA", px: 80, color: OCC.oculo }, { t: A.pupila - 0.1, texto: "PUPILA\nDILATADA", px: 96, color: "#FFB347" }]} y={450} x={104} id="titular-oc-aneurisma" />
      <Fuente texto={`Una parálisis del III con pupila dilatada puede deberse a un aneurisma de la comunicante posterior; a veces el aneurisma respeta la pupila, y en la diabetes suele respetarse. Hay que estudiarla siempre. Esquema; no es consejo médico.`} y={1510} delay={A.parpado} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── oc-urgencia ───────────── */

export const OcUrgencia: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const U = TOC.urgencia;
  const filas: [string, number, string][] = [["PÁRPADO CAÍDO DE GOLPE", U.parpado, "#D9C6FF"], ["VISIÓN DOBLE", U.doble, OCC.oculo], ["DOLOR DE CABEZA INTENSO", U.dolor, OCC.rojo]];
  const kUr = spr(f, a(U.urgente), { damping: 9, stiffness: 190, mass: 0.8 });
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={OCC.rojo} intensidad={0.4 + 0.8 * kUr} />
        {filas.map(([tx, tt, c], i) => {
          const k = easeOut((t - a(tt)) / 0.5), y = 700 + i * 108;
          return (
            <g key={i} opacity={clamp(k * 2)} transform={`translate(${lerp(-60, 0, k)} 0)`}>
              <rect x={104} y={y} width={872} height={86} rx={18} fill="rgba(11,18,40,0.92)" stroke={c} strokeWidth={5} />
              <circle cx={152} cy={y + 43} r={20} fill={c} /><path d={`M 143 ${y + 43} L 150 ${y + 52} L 163 ${y + 34}`} stroke="#0B1220" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <text x={194} y={y + 56} fontFamily={MONOF} fontWeight={800} fontSize={28} fill="#E6EDFF" data-texto={`oc-u-f${i}`}>{tx}</text>
            </g>
          );
        })}
        <g transform={`translate(540 1190) scale(${kUr * (1 + 0.04 * Math.sin(t * 6))})`} opacity={clamp(kUr * 2)}>
          <rect x={-110} y={-110} width={220} height={220} rx={36} fill="#2A0A14" stroke={OCC.rojo} strokeWidth={9} />
          <rect x={-22} y={-70} width={44} height={140} rx={8} fill="#fff" /><rect x={-70} y={-22} width={140} height={44} rx={8} fill="#fff" />
        </g>
      </svg>
      <Chip x={540} y={1335} texto={"ATENCIÓN MÉDICA URGENTE"} color={OCC.rojo} px={30} anchor="center" id="oc-u-ur" opacidad={clamp(kUr * 1.5)} />
      <Frases frases={[{ t: 0.2, texto: "SI APARECE\nDE GOLPE…", px: 90 }, { t: U.urgente - 0.1, texto: "URGENCIAS", px: 110, color: OCC.rojo }]} y={450} x={104} id="titular-oc-urgencia" />
      <Fuente texto="Un párpado caído de aparición brusca, sobre todo con visión doble, pupila grande o dolor de cabeza intenso, requiere valoración médica urgente. Información general; no es consejo médico." y={1510} delay={U.doble} />
      <Cap e={e} />
    </Fondo>
  );
};
