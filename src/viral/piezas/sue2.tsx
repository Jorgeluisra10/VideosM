/**
 * «Un día sin dormir» (SINAPSIS · medicina cotidiana) · escenas 2/2
 *   sue-cafe      un receptor de membrana: la cafeína ocupa el hueco de la adenosina, que sigue acumulándose
 *   sue-micro     carretera nocturna vista por el conductor: los párpados se cierran, 4 s = 111 m a ciegas
 *   sue-hospital  pasillo de hospital: internos con turnos de más de 24 h, +36 % de errores graves y ×2,3 de choques
 *   sue-dormir    luna y ondas lentas: durmiendo, el rendimiento vuelve a 0; 7 h o más (cierre)
 */
import React from "react";
import { SUE, TSUE, metrosEn } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { H, W, LineaCap, clamp, easeInOut, easeOut, lerp, mezclar, spr, useReloj } from "../comun";
import { Odometro } from "./anom-ui";
import { Lectura } from "./jet-kit";
import { Auto, FONT, Frases, MONOF } from "./real-kit";
import { Fuente } from "./real1";
import { Adenosina, Cafeina, Carretera, DialBAC, Eeg, Noche, Parpados, Pasillo, SU, colorBAC, pct2, rebote, sua } from "./sue-kit";

type P = { e: EscenaViralGuardada };

const Cap: React.FC<{ e: EscenaViralGuardada }> = ({ e }) => (e.cap ? <LineaCap texto={e.cap} y={290} px={28} delay={0.12} id="cap-pieza" color={SU.hielo} /> : null);
const Chip: React.FC<{ texto: string; x: number; y: number; color: string; opacidad?: number; id: string; ancho?: number }> = ({ texto, x, y, color, opacidad = 1, id, ancho = 520 }) => (
  <div data-texto={id} style={{ position: "absolute", left: x - ancho / 2, top: y, width: ancho, textAlign: "center", opacity: opacidad }}>
    <span style={{ display: "inline-block", padding: "9px 22px", borderRadius: 999, border: `2.5px solid ${color}`, background: "rgba(6,10,30,0.8)", fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: "#fff", letterSpacing: "0.04em" }}>{texto}</span>
  </div>
);

/* ───────────── sue-cafe ───────────── */

const RECEPTOR = "M -120,-20 C -120,-70 -90,-110 -60,-125 L -50,-125 C -45,-90 -30,-70 0,-70 C 30,-70 45,-90 50,-125 L 60,-125 C 90,-110 120,-70 120,-20 L 120,60 C 120,110 80,160 0,160 C -80,160 -120,110 -120,60 Z";
const MEMB_Y = 1030, REC_X = 540, BOLSILLO: [number, number] = [540, 935];

export const SueCafe: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TSUE.cafe;
  const kr = spr(f, a(C.receptor), { damping: 14, stiffness: 120, mass: 0.8 });
  const une = easeOut((t - a(C.une)) / a(0.5));
  const sale = easeInOut((t - a(C.cafe + 0.2)) / a(0.8));
  const bloq = easeOut((t - a(C.bloquea)) / a(0.45));
  const ocupaAd = une * (1 - sale);                // la adenosina «encaja» solo antes de que llegue la cafeína
  const taza = spr(f, a(C.cafe - 0.3), { damping: 12, stiffness: 120, mass: 0.8 });
  const n = Math.round(9 + 12 * clamp((t - a(C.adeno)) / a(5.0)));
  const color = bloq > 0.5 ? SU.ambar : ocupaAd > 0.5 ? SU.violeta : "#5FD1C3";
  const senal = ocupaAd;
  const adN = React.useMemo(() => Array.from({ length: 26 }, (_, i) => ({ x: 120 + azar(i * 3.1) * 860, y: 590 + azar(i * 5.7) * 270, rot: azar(i * 7.1) * 360, s: 0.8 + azar(i * 2.3) * 0.5, vx: 14 + azar(i * 1.7) * 26, vy: 12 + azar(i * 4.3) * 22 })), []);
  const cafeinas = [[780, 760], [700, 830], [850, 840]];
  const lerpPos = (a0: [number, number], b0: [number, number], k: number): [number, number] => [lerp(a0[0], b0[0], k), lerp(a0[1], b0[1], k)];
  const adUne: [number, number] = lerpPos([330, 780], BOLSILLO, une);
  const adVa: [number, number] = lerpPos(adUne, [250, 700], sale);
  const kc = easeInOut((t - a(C.cafe + 0.4)) / a(0.7));
  return (
    <Noche t={t} luna={0} bruma={0.2} tinte="#1B1650">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="sue-mem" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7A66D8" stopOpacity="0.9" /><stop offset="1" stopColor="#3B2D9A" stopOpacity="0.9" /></linearGradient>
          <linearGradient id="sue-rec" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={mezclar(color, "#FFFFFF", 0.25)} /><stop offset="1" stopColor={mezclar(color, "#10203A", 0.55)} /></linearGradient>
          <filter id="sue-bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14" /></filter>
        </defs>
        {/* membrana: dos capas de lípidos */}
        <g opacity={clamp(kr * 1.6)}>
          <rect x={0} y={MEMB_Y - 36} width={W} height={72} fill="rgba(80,60,190,0.18)" />
          {Array.from({ length: 24 }, (_, i) => {
            const x = 25 + i * 45;
            if (Math.abs(x - REC_X) < 140) return null;
            return (
              <g key={i}>
                <line x1={x} y1={MEMB_Y - 30} x2={x} y2={MEMB_Y - 2} stroke="#A99BFF" strokeWidth={3} opacity={0.6} /><line x1={x + 10} y1={MEMB_Y - 30} x2={x + 10} y2={MEMB_Y - 2} stroke="#A99BFF" strokeWidth={3} opacity={0.6} />
                <line x1={x} y1={MEMB_Y + 30} x2={x} y2={MEMB_Y + 2} stroke="#A99BFF" strokeWidth={3} opacity={0.6} /><line x1={x + 10} y1={MEMB_Y + 30} x2={x + 10} y2={MEMB_Y + 2} stroke="#A99BFF" strokeWidth={3} opacity={0.6} />
                <circle cx={x + 5} cy={MEMB_Y - 36} r={11} fill="url(#sue-mem)" /><circle cx={x + 5} cy={MEMB_Y + 36} r={11} fill="url(#sue-mem)" />
              </g>
            );
          })}
          {/* receptor */}
          <g transform={`translate(${REC_X} ${MEMB_Y + 40})`}>
            <path d={RECEPTOR} fill={color} opacity={0.35 * (0.6 + 0.4 * (une + bloq))} filter="url(#sue-bl)" />
            <path d={RECEPTOR} fill="url(#sue-rec)" stroke="#E8F4FF" strokeWidth={4} strokeLinejoin="round" />
            <path d="M -90 -40 C -90 -80 -70 -100 -50 -112" fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={6} strokeLinecap="round" />
          </g>
          {/* señal dentro de la célula: solo cuando la adenosina está encajada */}
          {senal > 0.05 && [0, 1, 2].map((i) => { const u = (((t * 1.1 + i / 3) % 1) + 1) % 1; return <ellipse key={i} cx={REC_X} cy={MEMB_Y + 205} rx={40 + u * 140} ry={10 + u * 34} fill="none" stroke={SU.violeta} strokeWidth={5} opacity={senal * (1 - u) * 0.9} />; })}
        </g>
        {/* adenosinas flotando afuera */}
        {adN.slice(0, n).map((m, i) => {
          const x = m.x + (rebote(m.vx * t + i * 23, 70) - 35), y = m.y + (rebote(m.vy * t + i * 31, 60) - 30);
          return <Adenosina key={i} x={x} y={y} s={m.s} rot={m.rot + t * 18} opacidad={clamp((t - a(C.adeno)) / 0.5) * (i === 0 ? 0 : 0.95)} brillo={0.5} />;
        })}
        {/* la adenosina que encaja y luego se va */}
        <Adenosina x={adVa[0]} y={adVa[1]} s={lerp(0.9, 1.15, une) * (1 - 0.1 * sale)} rot={lerp(20, 0, une)} opacidad={clamp((t - a(C.adeno)) / 0.4)} brillo={1} />
        {/* cafeínas */}
        {cafeinas.map(([x, y], i) => {
          const cx = x + (rebote(18 * t + i * 40, 40) - 20), cy = y + (rebote(14 * t + i * 57, 30) - 15);
          const llega = clamp((t - a(C.cafe)) / a(0.8));
          const from: [number, number] = [860, 650];
          const p0 = lerpPos(from, [cx, cy], easeOut(llega));
          const p1 = i === 0 ? lerpPos(p0, BOLSILLO, kc) : p0;
          return <Cafeina key={i} x={p1[0]} y={p1[1]} s={i === 0 ? lerp(0.9, 1.15, kc) : 0.9} rot={i * 40 + t * 22 * (1 - (i === 0 ? kc : 0))} opacidad={clamp(llega * 2) * (i === 0 ? 1 : 0.9)} />;
        })}
        {/* taza */}
        <g transform="translate(880 600)" opacity={clamp(taza * 1.6)}>
          <path d="M -60 0 L 60 0 L 46 80 C 44 92 -44 92 -46 80 Z" fill="#F4EBDD" stroke="#CDBFA7" strokeWidth={3} />
          <path d="M 58 12 C 100 8 100 62 50 60" fill="none" stroke="#F4EBDD" strokeWidth={9} strokeLinecap="round" />
          <ellipse cx={0} cy={0} rx={60} ry={12} fill="#4A2B1B" stroke="#CDBFA7" strokeWidth={3} />
          {[-20, 0, 20].map((x, i) => <path key={i} d={`M ${x} -14 C ${x + 14} -40 ${x - 14} -56 ${x} -84`} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.35 + 0.25 * Math.sin(t * 3 + i)} transform={`translate(${Math.sin(t * 2 + i) * 6} ${-((t * 30 + i * 20) % 26)})`} />)}
        </g>
        {/* bloqueado */}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "EL CAFÉ\nNO LA ELIMINA", px: 92 }, { t: C.bloquea - 0.1, texto: "SOLO TAPA\nSUS RECEPTORES", px: 90, color: SU.ambar }]} y={450} x={104} id="titular-sueno-cafe" />
      <Chip texto="receptor de adenosina" x={300} y={1318} color="#5FD1C3" opacidad={clamp(kr * 2)} id="cafe-receptor" ancho={440} />
      <Chip texto={bloq > 0.5 ? "BLOQUEADO" : ocupaAd > 0.5 ? "SEÑAL: SUEÑO" : "libre"} x={780} y={1318} color={color} opacidad={clamp(kr * 2)} id="cafe-estado" ancho={380} />
      <Chip texto="adenosina ▲ sigue acumulándose" x={540} y={1395} color={SU.violeta} opacidad={sua(t, a(C.sigue), a(C.sigue + 0.5))} id="cafe-sigue" ancho={780} />
      <Fuente texto="Cafeína: antagonista competitivo de los receptores A1 y A2A de adenosina; la adenosina no desaparece. Esquema molecular." y={1500} delay={C.sigue} />
      <Cap e={e} />
    </Noche>
  );
};

/* ───────────── sue-micro ───────────── */

export const SueMicro: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const M = TSUE.micro;
  const v = SUE.kmh / 3.6;
  const cab = sua(t, a(M.cabecea), a(M.cierra)) * 0.22 * (0.65 + 0.35 * Math.sin(t * 9));
  const cierra = easeOut((t - a(M.cierra)) / a(M.cierraDur));
  const abre = easeOut((t - a(M.abre)) / a(0.2));
  const k = t < a(M.abre) ? Math.max(cab * (1 - cierra), cierra) : Math.max(0, 1 - abre);
  const deriva = 2.4 * sua(t, a(M.cierra), a(M.abre)) * (t < a(M.abre) ? 1 : 1 - sua(t, a(M.abre) + 0.1, a(M.abre) + 0.9));
  const p = clamp((t - a(M.ciego)) / a(M.ciegoDur));
  const metros = metrosEn(SUE.kmh, SUE.microSeg) * p;
  const seg = SUE.microSeg * p;
  const vis = sua(t, a(M.ciego - 0.1), a(M.ciego + 0.3));
  const visC = vis * (1 - sua(t, a(M.abre + 0.15), a(M.abre + 0.6)));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#02030A" }}>
      <Carretera dist={v * t} deriva={deriva} t={t} />
      <Parpados k={k} />
      <Lectura x={540} y={625} ancho={600} alinear="center" valor={`${SUE.kmh} km/h`} px={58} color={SU.verde} opacidad={clamp(t / 0.4) * (1 - 0.6 * k)} id="micro-vel" />
      <div data-texto="micro-ciegas" style={{ position: "absolute", left: 140, top: 870, width: 800, textAlign: "center", opacity: visC, fontFamily: MONOF, fontWeight: 800, fontSize: 34, letterSpacing: "0.2em", color: SU.rojo, textShadow: "0 4px 24px rgba(0,0,0,0.9)" }}>A CIEGAS</div>
      <Odometro valor={metros} x={540} y={1010} px={170} digitos={3} sufijo="m" color={SU.ambar} id="micro-m" opacidad={vis} />
      <Lectura x={540} y={1130} ancho={700} alinear="center" valor={`${seg.toFixed(1).replace(".", ",")} s con los ojos cerrados`} px={40} color="#fff" opacidad={visC} id="micro-s" />
      <Frases frases={[{ t: 0.2, texto: "LLEGAN LOS\nMICROSUEÑOS", px: 94 }, { t: M.ciego - 0.1, texto: "4 SEGUNDOS =\n111 METROS", px: 96, color: SU.ambar }]} y={470} x={104} id="titular-sueno-micro" />
      <Fuente texto="100 km/h = 27,8 m/s; 27,8 × 4 s ≈ 111 m. Un microsueño es un episodio involuntario de segundos. Esquema." y={1500} delay={M.chip} />
      <Cap e={e} />
    </div>
  );
};

/* ───────────── sue-hospital ───────────── */

const Tarjeta: React.FC<{ x: number; y: number; w: number; h: number; op: number; borde: string }> = ({ x, y, w, h, op, borde }) => (
  <div style={{ position: "absolute", left: x, top: y + (1 - op) * 40, width: w, height: h, borderRadius: 34, border: `3px solid ${borde}`, background: "rgba(4,14,24,0.78)", boxShadow: `0 0 40px ${borde}33`, opacity: op }} />
);

export const SueHospital: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const Hs = TSUE.hospital;
  const c1 = spr(f, a(Hs.panel1), { damping: 14, stiffness: 120, mass: 0.8 });
  const c2 = spr(f, a(Hs.panel2), { damping: 14, stiffness: 120, mass: 0.8 });
  const kA = easeOut((t - a(Hs.barraA)) / a(0.9)), kB = easeOut((t - a(Hs.barraB)) / a(1.2));
  const mas = spr(f, a(Hs.mas36), { damping: 10, stiffness: 200, mass: 0.6 });
  const choque = spr(f, a(Hs.choque), { damping: 8, stiffness: 240, mass: 0.6 });
  const x23 = spr(f, a(Hs.x23), { damping: 9, stiffness: 200, mass: 0.7 });
  const U = 5.2;
  const A = 100, B = 100 + SUE.erroresMas;
  const sacude = choque > 0.05 ? Math.sin(t * 60) * 5 * (1 - clamp((t - a(Hs.choque)) / 0.5)) : 0;
  return (
    <Pasillo t={t}>
      <Tarjeta x={70} y={590} w={940} h={390} op={clamp(c1 * 1.5)} borde={SU.cian} />
      <div data-texto="hosp-t1" style={{ position: "absolute", left: 110, top: 616, fontFamily: MONOF, fontWeight: 700, fontSize: 25, letterSpacing: "0.07em", color: SU.hielo, opacity: clamp(c1 * 2) }}>ERRORES MÉDICOS GRAVES · UCI</div>
      <div data-texto="hosp-la" style={{ position: "absolute", left: 110, top: 668, fontFamily: FONT, fontWeight: 700, fontSize: 30, color: "#fff", opacity: kA }}>turnos habituales</div>
      <div data-texto="hosp-lb" style={{ position: "absolute", left: 110, top: 790, fontFamily: FONT, fontWeight: 700, fontSize: 30, color: "#fff", opacity: kB }}>turnos de más de 24 h</div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g>
          <rect x={110} y={708} width={A * U * kA} height={52} rx={26} fill={SU.hielo} />
          <rect x={110} y={830} width={B * U * kB} height={52} rx={26} fill={SU.rojo} />
          <rect x={110} y={830} width={B * U * kB} height={52} rx={26} fill={SU.rojo} opacity={0.5} style={{ filter: "blur(10px)" }} />
          <text x={110 + A * U * kA + 16} y={748} fontFamily={MONOF} fontWeight={800} fontSize={32} fill="#fff" opacity={kA}>100</text>
          <text x={110 + B * U * kB + 16} y={870} fontFamily={MONOF} fontWeight={800} fontSize={32} fill="#fff" opacity={kB}>{Math.round(B * kB)}</text>
        </g>
        <g opacity={c2}>
          <g transform={`translate(${sacude} 0)`}><Auto x={300} y={1385} s={1.1} color="#D5DAE3" /></g>
        </g>
      </svg>
      <div data-texto="hosp-mas" style={{ position: "absolute", left: 700, top: 700, width: 280, textAlign: "center", opacity: clamp(mas * 2), transform: `scale(${0.7 + 0.3 * mas})` }}>
        <span style={{ display: "inline-block", padding: "8px 24px", borderRadius: 999, background: SU.rojo, fontFamily: FONT, fontWeight: 900, fontSize: 54, color: "#fff", boxShadow: "0 0 30px rgba(255,75,75,0.7)" }}>+36 %</span>
      </div>
      <Tarjeta x={70} y={1010} w={940} h={420} op={clamp(c2 * 1.5)} borde={SU.ambar} />
      <div data-texto="hosp-t2" style={{ position: "absolute", left: 110, top: 1036, fontFamily: MONOF, fontWeight: 700, fontSize: 25, letterSpacing: "0.07em", color: SU.hielo, opacity: clamp(c2 * 2) }}>CHOQUES AL VOLVER A CASA</div>
      <div data-texto="hosp-x23" style={{ position: "absolute", left: 590, top: 1100, width: 380, textAlign: "center", opacity: clamp(x23 * 2), transform: `scale(${0.75 + 0.25 * x23})` }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 160, lineHeight: 1, letterSpacing: "-0.02em", color: SU.ambar, textShadow: "0 0 40px rgba(255,181,71,0.6)" }}>×{String(SUE.choqueOR).replace(".", ",")}</div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, color: "#fff", marginTop: 8 }}>más del doble de probabilidad</div>
      </div>
      <Frases frases={[{ t: 0.2, texto: "EN MEDICINA\nYA SE MIDIÓ", px: 92 }]} y={450} x={104} id="titular-sueno-hospital" />
      <Fuente texto="Landrigan 2004 (NEJM, UCI; +35,9 %, comparación de horarios) · Barger 2005 (NEJM, encuesta a internos; odds ×2,3 tras turnos de más de 24 h)." y={1500} delay={Hs.panel2} />
      <Cap e={e} />
    </Pasillo>
  );
};

/* ───────────── sue-dormir ───────────── */

export const SueDormir: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const D = TSUE.dormir;
  const ke = spr(f, a(D.eeg), { damping: 14, stiffness: 100, mass: 0.9 });
  const p = easeInOut((t - a(D.sube)) / a(D.subeDur));
  const bac = SUE.bac24 * (1 - p);
  const horas = 8 * p;
  const siete = sua(t, a(D.siete), a(D.siete + 0.4));
  const fin = sua(t, a(D.frase - 0.1), a(D.frase + 0.4));
  return (
    <Noche t={t} luna={1} bruma={0.6} tinte="#2A1F7A">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(ke * 1.8)}>
          <rect x={90} y={620} width={900} height={250} rx={34} fill="rgba(6,10,36,0.55)" stroke="rgba(139,108,255,0.5)" strokeWidth={3} />
          <Eeg x={120} y={745} w={840} t={t} amp={86} frec={0.85} color={mezclar(SU.cian, SU.violeta, p)} grosor={5} />
        </g>
        <g opacity={clamp(ke * 1.8)}><DialBAC x={540} y={1190} r={250} valor={bac} /></g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "NO HAY ATAJO:\nDORMIR", px: 96 }, { t: D.frase, texto: "7 H O MÁS", px: 118, color: SU.ambar }]} y={450} x={104} id="titular-sueno-dormir" />
      <div data-texto="dormir-eeg" style={{ position: "absolute", left: 120, top: 640, fontFamily: MONOF, fontWeight: 700, fontSize: 24, letterSpacing: "0.08em", color: SU.violetaClaro, opacity: clamp(ke * 2) }}>ONDAS LENTAS DEL SUEÑO PROFUNDO</div>
      <Lectura x={540} y={1245} ancho={620} alinear="center" valor={`${Math.round(horas)} h dormidas`} px={54} color={SU.cian} opacidad={clamp(ke * 2)} id="dormir-h" />
      <Lectura x={540} y={1315} ancho={620} alinear="center" valor={`${pct2(bac)} %`} px={70} color={colorBAC(bac)} opacidad={clamp(ke * 2)} id="dormir-bac" />
      <div data-texto="dormir-siete" style={{ position: "absolute", left: 140, top: 1428, width: 800, textAlign: "center", opacity: siete }}>
        <span style={{ display: "inline-block", padding: "10px 26px", borderRadius: 999, border: `3px solid ${SU.ambar}`, background: "rgba(10,12,40,0.82)", fontFamily: MONOF, fontWeight: 800, fontSize: 28, color: "#fff", letterSpacing: "0.04em" }}>adultos: 7 horas o más</span>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fin * 0 }} />
      <Fuente texto="Consenso AASM/SRS 2015: adultos, 7 h o más. Curva de recuperación ilustrativa; el rendimiento se mide en pruebas de laboratorio." y={1500} delay={D.siete} />
      <Cap e={e} />
    </Noche>
  );
};
