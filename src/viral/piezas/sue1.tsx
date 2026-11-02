/**
 * «Un día sin dormir» (SINAPSIS · medicina cotidiana) · escenas 1/2
 *   sue-gancho     reloj de pared que avanza 24 h junto a un alcoholímetro que sube a 0,10 % (gancho)
 *   sue-horas      7:00 → medianoche: 17 h despierto y el dial de rendimiento llega a 0,05 %
 *   sue-limite     el dial cruza el límite legal de EE. UU. (0,08 %) y llega a 0,10 % con alerta roja
 *   sue-adenosina  el cerebro acumula adenosina (moléculas violeta) y sube la presión de sueño
 * Las cifras de «alcohol» son el RENDIMIENTO equivalente en pruebas de laboratorio, no alcohol real.
 */
import React from "react";
import { SUE, TSUE, bacPorHoras } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { H, W, LineaCap, clamp, easeInOut, easeOut, lerp, mezclar, spr, useReloj } from "../comun";
import { Lectura } from "./jet-kit";
import { Adenosina, Alcoholimetro, CerebroSue, DialBAC, Noche, RelojPared, SU, colorBAC, pct2, rebote, sua } from "./sue-kit";
import { Frases, FONT, MONOF } from "./real-kit";
import { Fuente } from "./real1";

type P = { e: EscenaViralGuardada };

const Cap: React.FC<{ e: EscenaViralGuardada }> = ({ e }) => (e.cap ? <LineaCap texto={e.cap} y={290} px={28} delay={0.12} id="cap-pieza" color={SU.hielo} /> : null);
const hhmm = (horas: number): string => { const tot = ((SUE.despiertaH + horas) % 24 + 24) % 24; const h = Math.floor(tot), m = Math.floor((tot - h) * 60); return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`; };

/* ───────────── sue-gancho ───────────── */

export const SueGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TSUE.gancho;
  const kr = spr(f, a(G.reloj), { damping: 14, stiffness: 120, mass: 0.8 });
  const ka = spr(f, a(G.alcohol), { damping: 14, stiffness: 120, mass: 0.8 });
  const h = 24 * easeInOut((t - a(G.sube)) / a(G.subeDur));
  const bac = bacPorHoras(h);
  const fin = sua(t, a(G.lectura - 0.2), a(G.lectura + 0.4));
  return (
    <Noche t={t} luna={0.9}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(kr * 1.8)} transform={`translate(0 ${(1 - kr) * 50})`}><RelojPared x={285} y={1010} r={172} horas={h} /></g>
        <g opacity={clamp(ka * 1.8)} transform={`translate(0 ${(1 - ka) * 50})`}><Alcoholimetro x={780} y={1000} w={230} valor={bac} t={t} parpadeo={fin} /></g>
        <text x={535} y={1040} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={120} fill={SU.ambar} opacity={clamp(ka * 1.6)}>≈</text>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "1 DÍA\nSIN DORMIR\n= BORRACHO", px: 92 }]} y={520} x={104} id="titular-sueno-gancho" />
      <Lectura x={285} y={1255} ancho={340} alinear="center" titulo="DESPIERTO" valor={`${Math.round(h)} h`} px={56} color={SU.cian} opacidad={clamp(kr * 2)} id="gancho-h" colorTitulo={SU.hielo} />
      <Lectura x={780} y={1365} ancho={400} alinear="center" titulo="RENDIMIENTO EQUIVALENTE" valor={`${pct2(bac)} %`} px={56} color={colorBAC(bac)} opacidad={clamp(ka * 2)} id="gancho-bac" colorTitulo={SU.hielo} />
      <Fuente texto="Dawson y Reid, Nature 1997 · Williamson y Feyer 2000: pruebas de laboratorio; es rendimiento, no alcohol real." y={1500} delay={G.lectura} />
      <Cap e={e} />
    </Noche>
  );
};

/* ───────────── sue-horas ───────────── */

export const SueHoras: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const A = TSUE.horas;
  const kr = spr(f, a(A.reloj), { damping: 14, stiffness: 120, mass: 0.8 });
  const h = SUE.h17 * easeInOut((t - a(A.sube)) / a(A.subeDur));
  const bac = bacPorHoras(h);
  const marca = sua(t, a(A.marca - 0.2), a(A.marca + 0.4));
  const X0 = 110, X1 = 970, paso = (X1 - X0) / 24;
  return (
    <Noche t={t} luna={0.6} bruma={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(kr * 1.8)} transform={`translate(0 ${(1 - kr) * 40})`}>
          <DialBAC x={540} y={1010} r={310} valor={bac} />
        </g>
        {/* regla de horas despierto */}
        <g opacity={clamp(kr * 2)}>
          <rect x={X0} y={1325} width={X1 - X0} height={18} rx={9} fill="rgba(190,224,255,0.12)" />
          <rect x={X0} y={1325} width={Math.max(6, h * paso)} height={18} rx={9} fill={mezclar(SU.cian, SU.ambar, clamp(h / 17))} />
          {Array.from({ length: 25 }, (_, i) => <line key={i} x1={X0 + i * paso} y1={1355} x2={X0 + i * paso} y2={i % 6 === 0 ? 1378 : 1366} stroke="#BFE0FF" strokeWidth={i % 6 === 0 ? 3 : 1.5} opacity={0.7} />)}
          {[0, 12, 17, 24].map((v) => <text key={v} x={X0 + v * paso} y={1410} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={26} fill={v === 17 ? SU.ambar : "#BFE0FF"}>{v} h</text>)}
          <circle cx={X0 + h * paso} cy={1334} r={17} fill="#fff" stroke={SU.ambar} strokeWidth={5} />
        </g>
        {marca > 0 && <g opacity={marca}><rect x={X0 + 17 * paso - 70} y={1294} width={140} height={4} fill={SU.ambar} /></g>}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "17 HORAS\nDESPIERTO", px: 98 }, { t: A.marca - 1.2, texto: "= 0,05 %\nDE ALCOHOL*", px: 98, color: SU.ambar }]} y={470} x={104} id="titular-sueno-horas" />
      <Lectura x={540} y={590} ancho={880} alinear="center" valor={`${hhmm(h)}  ·  ${Math.round(h)} h`} px={60} color="#fff" opacidad={clamp(kr * 2)} id="horas-reloj" />
      <Lectura x={540} y={1110} ancho={620} alinear="center" valor={`${pct2(bac)} %`} px={96} color={colorBAC(bac)} opacidad={clamp(kr * 2)} id="horas-bac" />
      <div data-texto="horas-nota" style={{ position: "absolute", left: 104, top: 1448, width: 872, fontFamily: FONT, fontWeight: 600, fontSize: 27, color: SU.hielo, opacity: clamp((t - a(A.nota)) / 0.6) * 0.95 }}>*rendimiento en pruebas de laboratorio, no alcohol real</div>
      <Fuente texto="Dawson y Reid, Nature 1997 (17 h ≈ 0,05 %); Williamson y Feyer 2000. Curva ilustrativa entre los puntos medidos." y={1520} delay={A.sube} />
      <Cap e={e} />
    </Noche>
  );
};

/* ───────────── sue-limite ───────────── */

export const SueLimite: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const L = TSUE.limite;
  const kd = spr(f, a(L.dial), { damping: 14, stiffness: 120, mass: 0.8 });
  const k = easeInOut((t - a(L.sube)) / a(L.subeDur));
  const bac = lerp(SUE.bac17, SUE.bac24, k);
  const alerta = sua(t, a(L.alerta - 0.1), a(L.alerta + 0.3));
  const pulso = 0.5 + 0.5 * Math.sin(t * 9);
  const cruza = sua(t, a(L.cruza), a(L.cruza + 0.3));
  const nota = sua(t, a(L.nota), a(L.nota + 0.5));
  return (
    <Noche t={t} luna={0.4} bruma={0.3}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="sue-alerta" cx="50%" cy="50%" r="75%"><stop offset="0.45" stopColor={SU.rojo} stopOpacity="0" /><stop offset="1" stopColor={SU.rojo} stopOpacity="0.85" /></radialGradient>
        </defs>
        <g opacity={clamp(kd * 1.8)} transform={`translate(0 ${(1 - kd) * 40})`}><DialBAC x={540} y={1050} r={340} valor={bac} /></g>
        <rect width={W} height={H} fill="url(#sue-alerta)" opacity={alerta * (0.25 + 0.4 * pulso)} />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "A LAS 24 H", px: 110 }, { t: L.cruza - 0.2, texto: "MÁS QUE EL LÍMITE\nPARA CONDUCIR", px: 82, color: SU.rojo }]} y={470} x={104} id="titular-sueno-limite" />
      <Lectura x={540} y={1130} ancho={620} alinear="center" valor={`${pct2(bac)} %`} px={112} color={colorBAC(bac)} opacidad={clamp(kd * 2)} id="limite-bac" />
      <div data-texto="limite-chip" style={{ position: "absolute", left: 540 - 300, top: 1296, width: 600, textAlign: "center", opacity: cruza }}>
        <span style={{ display: "inline-block", padding: "12px 26px", borderRadius: 999, border: `3px solid ${SU.rojo}`, background: "rgba(40,6,10,0.82)", fontFamily: MONOF, fontWeight: 800, fontSize: 30, color: "#fff", letterSpacing: "0.04em" }}>LÍMITE EE. UU. · 0,08 %</span>
      </div>
      <div data-texto="limite-nota" style={{ position: "absolute", left: 104, top: 1400, width: 872, fontFamily: FONT, fontWeight: 600, fontSize: 28, color: SU.hielo, opacity: nota * 0.95 }}>Rendimiento equivalente en pruebas de laboratorio: no hay alcohol en tu sangre.</div>
      <Fuente texto="Dawson y Reid 1997; Lamond y Dawson 1999: ≈ 20–25 h despierto ≈ 0,10 % según la tarea. Límite de 0,08 % en la mayoría de los estados de EE. UU." y={1500} delay={L.nota} />
      <Cap e={e} />
    </Noche>
  );
};

/* ───────────── sue-adenosina ───────────── */

export const SueAdenosina: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const D = TSUE.adenosina;
  const kc = spr(f, a(D.cerebro), { damping: 15, stiffness: 110, mass: 0.9 });
  const p = easeInOut((t - a(D.sube)) / a(D.subeDur));
  const n = Math.round(4 + 34 * p);
  const lat = 1 + 0.01 * Math.sin(t * 5);
  const mols = React.useMemo(() => Array.from({ length: 40 }, (_, i) => {
    const r = Math.sqrt(azar(i * 3.7)), ang = azar(i * 5.9) * Math.PI * 2;
    return { x: 540 + Math.cos(ang) * r * 300, y: 800 + Math.sin(ang) * r * 190 - 10, rot: azar(i * 7.3) * 360, s: 0.8 + azar(i * 2.1) * 0.6, vx: 20 + azar(i * 1.1) * 30, vy: 20 + azar(i * 8.3) * 30 };
  }), []);
  const mostrar = clamp((t - a(D.moleculas)) / a(0.5));
  const X0 = 140, X1 = 940;
  return (
    <Noche t={t} luna={0} bruma={0.3} tinte="#251B63">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(kc * 1.6)}><CerebroSue x={540} y={820} s={0.74 * lat * (0.9 + 0.1 * kc)} tono={0.75 * p} brillo={0.5 + 0.4 * p} /></g>
        {mols.slice(0, n).map((m, i) => {
          const x = m.x + (rebote(m.vx * t + i * 17, 60) - 30), y = m.y + (rebote(m.vy * t + i * 29, 50) - 25);
          const nac = clamp((p * 34 + 4 - i) * 1.2);
          return <Adenosina key={i} x={x} y={y} s={0.5 * m.s * (0.6 + 0.4 * nac)} rot={m.rot + t * 20} opacidad={mostrar * nac} />;
        })}
        {/* presión de sueño */}
        <g opacity={clamp(kc * 2)}>
          <rect x={X0} y={1190} width={X1 - X0} height={38} rx={19} fill="rgba(190,224,255,0.12)" />
          <rect x={X0} y={1190} width={Math.max(10, (X1 - X0) * p)} height={38} rx={19} fill={mezclar(SU.cian, SU.violeta, clamp(p * 1.3))} />
          <text x={X0} y={1170} fontFamily={MONOF} fontWeight={700} fontSize={26} letterSpacing="0.08em" fill={SU.hielo}>PRESIÓN DE SUEÑO</text>
        </g>
        <Adenosina x={170} y={1380} s={1.3} brillo={1} opacidad={clamp((t - a(D.chip)) / 0.5)} />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "MIENTRAS\nESTÁS DESPIERTO", px: 82 }, { t: 2.8, texto: "SE ACUMULA\nADENOSINA", px: 96, color: SU.violetaClaro }]} y={470} x={104} id="titular-sueno-adenosina" />
      <div data-texto="adenosina-chip" style={{ position: "absolute", left: 310, top: 1346, width: 660, fontFamily: FONT, fontWeight: 700, fontSize: 34, lineHeight: 1.25, color: "#fff", opacity: clamp((t - a(D.chip)) / 0.5) }}>adenosina: una de las moléculas que empuja al sueño</div>
      <Fuente texto="La presión de sueño depende también del reloj circadiano, no solo de la adenosina. Moléculas y cerebro: esquema." y={1500} delay={D.chip} />
      <Cap e={e} />
    </Noche>
  );
};
