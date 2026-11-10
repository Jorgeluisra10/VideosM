/**
 * «El par craneal IV: el nervio que rompe las reglas» (SINAPSIS · pares craneales) · escenas 2/2
 *   tr-accion     el oblicuo superior baja el ojo cuando mira hacia la nariz y lo rota hacia adentro, como al leer o bajar escaleras
 *   tr-paralisis  si falla: visión doble vertical, peor al mirar hacia abajo, y cabeza inclinada para compensar
 *   tr-causas     un golpe en la cabeza puede lesionarlo; otras veces es una parálisis congénita que se nota años después
 *   tr-consulta   si de repente ves doble, sobre todo al mirar hacia abajo, consulta con un médico: tiene muchas causas (cierre)
 * Dibujos esquemáticos de anatomía; no son imágenes médicas reales.
 */
import React from "react";
import { TRO, TTR } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Ambiente, Chip, Doble, Estallido, FONT, Flecha, MONOF, OjoP, PC, TRC } from "./tr-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── tr-accion ───────────── */

export const TrAccion: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const A = TTR.accion;
  const kBa = easeOut((t - a(A.baja)) / 0.8), kNa = easeOut((t - a(A.nariz)) / 0.8), kGi = clamp((t - a(A.gira)) / 0.5), kLe = spr(f, a(A.leer), { damping: 10, stiffness: 180, mass: 0.8 });
  const dy = 0.34 * kBa;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={TRC.troclear} intensidad={0.6 + 0.4 * kGi} />
        <OjoP x={320} y={960} r={110} pupila={0.5} mira={[0.3 * kNa, dy]} t={t} brillo={kGi * 0.5} />
        <OjoP x={760} y={960} r={110} pupila={0.5} mira={[-0.3 * kNa, dy]} t={t} brillo={kGi * 0.5} />
        {kBa > 0.05 && [320, 760].map((x) => <Flecha key={x} x0={x} y0={810} x1={x} y1={870} color={TRC.troclear} k={kBa} />)}
        {kGi > 0 && [[320, 960], [760, 960]].map(([x, y], i) => (
          <g key={i} opacity={kGi}><path d={`M ${x - 130} ${y - 20} A 135 135 0 0 ${i === 0 ? 1 : 0} ${x - 70} ${y - 112}`} stroke={TRC.polea} strokeWidth={7} fill="none" strokeLinecap="round" transform={i === 1 ? `translate(${2 * x} 0) scale(-1 1)` : ""} /></g>
        ))}
        {/* leer y bajar escaleras */}
        <g transform={`translate(0 0) scale(${kLe})`} style={{ transformOrigin: "540px 1230px" }} opacity={clamp(kLe * 2)}>
          <rect x={250} y={1170} width={250} height={120} rx={12} fill="#141C3C" stroke="#8B97B8" strokeWidth={5} /><line x1={375} y1={1170} x2={375} y2={1290} stroke="#8B97B8" strokeWidth={4} />
          {[0, 1, 2].map((i) => <g key={i}><line x1={275} y1={1200 + i * 28} x2={350} y2={1200 + i * 28} stroke="#C8D2E8" strokeWidth={5} strokeLinecap="round" /><line x1={400} y1={1200 + i * 28} x2={475} y2={1200 + i * 28} stroke="#C8D2E8" strokeWidth={5} strokeLinecap="round" /></g>)}
          <path d="M 600 1180 L 700 1180 L 700 1220 L 760 1220 L 760 1260 L 820 1260 L 820 1300 L 600 1300 Z" fill="#141C3C" stroke="#8B97B8" strokeWidth={5} strokeLinejoin="round" />
        </g>
      </svg>
      <Chip x={104} y={690} texto={"BAJA EL OJO"} color={TRC.troclear} px={26} id="tr-a-baja" opacidad={clamp(kBa * 2)} />
      <Chip x={976} y={690} texto={"MIRA HACIA LA NARIZ"} color="#BFE0FF" px={22} anchor="right" id="tr-a-nar" opacidad={clamp(kNa * 2)} />
      <Chip x={540} y={1110} texto={"ROTA HACIA ADENTRO (intorsión)"} color={TRC.polea} px={22} anchor="center" id="tr-a-rot" opacidad={kGi} />
      <Chip x={540} y={1330} texto={"LEER · BAJAR ESCALERAS"} color="#BFE0FF" px={24} anchor="center" id="tr-a-leer" opacidad={clamp(kLe * 1.5)} />
      <Frases frases={[{ t: 0.2, texto: "BAJA EL OJO", px: 100 }, { t: A.nariz - 0.1, texto: "CUANDO MIRA\nHACIA LA NARIZ", px: 84, color: "#BFE0FF" }, { t: A.gira - 0.1, texto: "Y LO ROTA\nHACIA ADENTRO", px: 90, color: TRC.polea }, { t: A.leer - 0.1, texto: "LEER · BAJAR\nESCALERAS", px: 84, color: TRC.troclear }]} y={450} x={104} id="titular-tr-accion" />
      <Fuente texto={`El ${TRO.musculo} produce ${TRO.accion[0]} (baja el ojo, sobre todo si está en aducción) e ${TRO.accion[1]} (rotación hacia adentro): interviene al mirar hacia abajo cerca. Esquema.`} y={1510} delay={A.nariz} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── tr-paralisis ───────────── */

export const TrParalisis: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const P2 = TTR.paralisis;
  const kFa = spr(f, a(P2.falla), { damping: 10, stiffness: 190, mass: 0.8 }), kDo = clamp((t - a(P2.doble)) / 0.8), kAb = clamp((t - a(P2.abajo)) / 0.8), kIn = easeOut((t - a(P2.inclina)) / 0.9);
  const sep = 100 * kDo * (0.55 + 0.45 * kAb) * (1 - 0.8 * kIn), giro = 5 * kDo * (1 - kIn);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={TRC.rojo} intensidad={0.3 + 0.5 * kFa} />
        <g transform={`rotate(${-14 * kIn} 330 1030)`}>
          <circle cx={330} cy={1030} r={170} fill="#1B2448" stroke="#4A5C92" strokeWidth={6} />
          <OjoP x={260} y={990} r={58} pupila={0.5} t={t} />
          <OjoP x={405} y={990 - 16 * kFa * (1 - 0.7 * kIn)} r={58} pupila={0.5} mira={[0.05, -0.04]} t={t} brillo={kFa * 0.5} />
          <path d="M 330 1010 L 322 1070 L 345 1070" stroke="#8B97B8" strokeWidth={5} fill="none" strokeLinecap="round" /><path d="M 280 1130 Q 330 1160 385 1130" stroke="#8B97B8" strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
        <rect x={600} y={760} width={376} height={340} rx={20} fill="#0F1730" stroke="#4A5C92" strokeWidth={4} />
        <Doble x={788} y={990} px={200} sep={sep} giro={giro} />
        {kAb > 0 && <Flecha x0={600} y0={840} x1={600} y1={1050} color={TRC.troclear} k={kAb} />}
      </svg>
      <Chip x={104} y={720} texto={"OJO AFECTADO\n(un poco más alto)"} color={TRC.troclear} px={20} id="tr-p-afe" opacidad={clamp(kFa * 2)} />
      <Chip x={620} y={720} texto={"LO QUE VE"} color="#BFE0FF" px={22} id="tr-p-ve" opacidad={kDo} />
      <Chip x={976} y={1130} texto={"VISIÓN DOBLE VERTICAL"} color={TRC.rojo} px={20} anchor="right" id="tr-p-dob" opacidad={kDo} />
      <Chip x={976} y={1180} texto={"PEOR AL MIRAR HACIA ABAJO"} color={TRC.troclear} px={20} anchor="right" id="tr-p-aba" opacidad={kAb} />
      <Chip x={330} y={1260} texto={"CABEZA INCLINADA hacia el lado contrario"} color={TRC.polea} px={20} anchor="center" id="tr-p-inc" opacidad={clamp(kIn * 2)} />
      <Frases frases={[{ t: 0.2, texto: "SI FALLA…", px: 110 }, { t: P2.doble - 0.1, texto: "VISIÓN DOBLE\nVERTICAL", px: 90, color: TRC.rojo }, { t: P2.abajo - 0.1, texto: "PEOR AL MIRAR\nHACIA ABAJO", px: 80, color: TRC.troclear }, { t: P2.inclina - 0.1, texto: "INCLINA LA\nCABEZA", px: 96, color: TRC.polea }]} y={450} x={104} id="titular-tr-paralisis" />
      <Fuente texto={`En la parálisis del IV hay diplopía vertical o torsional, a menudo peor en la mirada hacia abajo, y se suele inclinar la cabeza hacia el ${TRO.inclinacion} (hay excepciones). Esquema; no es consejo médico.`} y={1510} delay={P2.doble} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── tr-causas ───────────── */

export const TrCausas: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TTR.causas;
  const kGo = spr(f, a(C.golpe) + 0.3, { damping: 9, stiffness: 200, mass: 0.8 }), kRo = clamp((t - a(C.golpe) - 0.6) / 0.4), kOt = clamp((t - a(C.otras)) / 0.4), kCo = clamp((t - a(C.congenita)) / 0.5), kAn = easeOut((t - a(C.anios)) / 1.0);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={kOt > 0.2 ? TRC.polea : TRC.rojo} intensidad={0.6} />
        {/* nervio largo y fino sobre el borde de la tienda */}
        <path d="M 120 880 C 300 880 420 860 540 835 C 680 860 800 880 960 880" stroke="#C9B79A" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.7} />
        <path d="M 120 850 C 300 850 420 830 530 805" stroke={TRC.troclear} strokeWidth={8} fill="none" strokeLinecap="round" />
        <path d="M 560 805 C 680 830 800 850 960 850" stroke={TRC.troclear} strokeWidth={8} fill="none" strokeLinecap="round" opacity={1 - 0.75 * kRo} strokeDasharray={kRo > 0.5 ? "4 12" : "0"} />
        {kRo > 0.3 && <g transform="translate(545 805)" opacity={kRo}><circle r={20} fill="#3A0A14" stroke={PC.rojo} strokeWidth={5} /><path d="M -8 -8 L 8 8 M 8 -8 L -8 8" stroke="#fff" strokeWidth={5} strokeLinecap="round" /></g>}
        {kGo > 0.05 && t < a(C.otras) + 0.5 && <Estallido x={545} y={730} s={kGo * 0.9} opacidad={clamp(kGo * 2) * (1 - clamp((t - a(C.golpe) - 1.2) / 0.8))} />}
        {/* línea del tiempo: nacimiento → años después */}
        <g opacity={kOt}>
          <line x1={190} y1={1140} x2={890} y2={1140} stroke="#BFE0FF" strokeOpacity={0.3} strokeWidth={6} strokeLinecap="round" />
          <circle cx={190} cy={1060} r={34} fill="#C8D2E8" /><rect x={160} y={1095} width={60} height={34} rx={14} fill="#C8D2E8" />
          <circle cx={190} cy={1140} r={10} fill={TRC.polea} />
        </g>
        <g opacity={kAn} transform={`rotate(${-14 * kAn} 890 1060)`}>
          <circle cx={890} cy={1050} r={58} fill="#C8D2E8" /><circle cx={870} cy={1042} r={7} fill="#0A0F1F" /><circle cx={910} cy={1038} r={7} fill="#0A0F1F" />
          <rect x={850} y={1112} width={80} height={30} rx={14} fill="#C8D2E8" />
        </g>
      </svg>
      <Chip x={104} y={690} texto={"UN GOLPE EN LA CABEZA"} color={"#FF9E3D"} px={24} id="tr-ca-golpe" opacidad={clamp(kGo * 2)} />
      <Chip x={104} y={930} texto={"largo y fino: vulnerable"} color={TRC.troclear} px={20} id="tr-ca-fin" opacidad={kRo} />
      <Chip x={190} y={1180} texto={"AL NACER"} color={TRC.polea} px={20} anchor="center" id="tr-ca-nac" opacidad={kCo} />
      <Chip x={540} y={1090} texto={"PARÁLISIS CONGÉNITA"} color={TRC.polea} px={24} anchor="center" id="tr-ca-con" opacidad={kCo} />
      <Chip x={890} y={1180} texto={"AÑOS DESPUÉS\nSE NOTA"} color={TRC.polea} px={20} anchor="center" id="tr-ca-anios" opacidad={kAn} />
      <Frases frases={[{ t: 0.2, texto: "UN GOLPE\nPUEDE LESIONARLO", px: 84 }, { t: C.otras - 0.1, texto: "OTRAS VECES:\nCONGÉNITA", px: 90, color: TRC.polea }, { t: C.anios - 0.1, texto: "SE NOTA AÑOS\nDESPUÉS", px: 84, color: TRC.polea }]} y={450} x={104} id="titular-tr-causas" />
      <Fuente texto="Un traumatismo puede lesionar el troclear por su recorrido largo y fino; los golpes leves a veces solo destapan una parálisis congénita que ya existía. Esquema; no es consejo médico." y={1510} delay={C.golpe} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── tr-consulta ───────────── */

export const TrConsulta: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const Q = TTR.consulta;
  const kDo = clamp((t - a(Q.doble)) / 0.6), kAb = clamp((t - a(Q.abajo)) / 0.6), kMe = spr(f, a(Q.medico), { damping: 9, stiffness: 190, mass: 0.8 }), kCa = (i: number): number => clamp((t - a(Q.causas) - i * 0.25) / 0.4);
  const sep = kDo * (30 + 40 * kAb) * (1 - 0.0 * kMe);
  const causas = ["TRAUMATISMO", "CONGÉNITA", "Y OTRAS"];
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={kMe > 0.3 ? "#5CE0A0" : TRC.rojo} intensidad={0.5 + 0.5 * kMe} />
        <Doble x={330} y={950} px={230} sep={sep} giro={4 * kDo} />
        {kAb > 0 && <Flecha x0={600} y0={800} x1={600} y1={900} color={TRC.troclear} k={kAb} />}
        <g transform={`translate(780 960) scale(${kMe})`} opacity={clamp(kMe * 2)}>
          <rect x={-100} y={-100} width={200} height={200} rx={34} fill="#0B2A22" stroke="#5CE0A0" strokeWidth={9} />
          <rect x={-20} y={-64} width={40} height={128} rx={8} fill="#fff" /><rect x={-64} y={-20} width={128} height={40} rx={8} fill="#fff" />
        </g>
        {causas.map((c, i) => <g key={c} opacity={kCa(i)}><rect x={104 + i * 290} y={1210} width={270} height={70} rx={16} fill="rgba(11,18,40,0.92)" stroke={TRC.polea} strokeWidth={4} /><text x={104 + i * 290 + 135} y={1255} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={22} fill="#E6EDFF" data-texto={`tr-co-c${i}`}>{c}</text></g>)}
      </svg>
      <Chip x={330} y={1080} texto={"VES DOBLE"} color={TRC.rojo} px={26} anchor="center" id="tr-co-dob" opacidad={kDo} />
      <Chip x={620} y={720} texto={"SOBRE TODO AL MIRAR\nHACIA ABAJO"} color={TRC.troclear} px={20} id="tr-co-aba" opacidad={kAb} />
      <Chip x={780} y={1100} texto={"CONSULTA CON\nUN MÉDICO"} color={"#5CE0A0"} px={24} anchor="center" id="tr-co-med" opacidad={clamp(kMe * 2)} />
      <Chip x={540} y={1330} texto={"tiene muchas causas"} color="#BFE0FF" px={24} anchor="center" id="tr-co-cau" opacidad={kCa(0)} />
      <Frases frases={[{ t: 0.2, texto: "SI DE REPENTE\nVES DOBLE…", px: 88 }, { t: Q.medico - 0.1, texto: "CONSULTA CON\nUN MÉDICO", px: 92, color: "#5CE0A0" }]} y={450} x={104} id="titular-tr-consulta" />
      <Fuente texto="La visión doble de aparición brusca tiene muchas causas (traumatismo, parálisis congénita descompensada, enfermedades vasculares, entre otras) y requiere valoración médica. Información general; no es consejo médico." y={1510} delay={Q.medico} />
      <Cap e={e} />
    </Fondo>
  );
};
