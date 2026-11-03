/**
 * Paro cardíaco de un futbolista (SINAPSIS · medicina y actualidad) · escenas 2/2
 *   fut-cerebro   el cerebro sin oxígeno y la curva de supervivencia que cae ≈ 10 % por minuto sin descarga (ilustración)
 *   fut-descarga  un desfibrilador (DEA): analiza, carga, descarga y el ritmo vuelve; 58 % de supervivencia en el registro de EE. UU.
 *   fut-rcp       tres pasos: llama a emergencias, comprime el centro del pecho (100–120/min, 5–6 cm) y busca un DEA
 *   fut-cierre    una vela, «aprende RCP» y descanse en paz (cierre)
 */
import React from "react";
import { FUT, TFUT, ecgFibrilacion, ecgOnda, supervivenciaSinDescarga } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, LineaCap, clamp, easeInOut, easeOut, lerp, mezclar, spr, useReloj } from "../comun";
import { Lectura } from "./jet-kit";
import { Frases, FONT, MONOF } from "./real-kit";
import { Fuente } from "./real1";
import { CEREBRO, CerebroSue } from "./sue-kit";
import { Compresion, Dea, Ecg, FU, Sala, Telefono, Vela, sua } from "./fut-kit";

type P = { e: EscenaViralGuardada };

const Cap: React.FC<{ e: EscenaViralGuardada }> = ({ e }) => (e.cap ? <LineaCap texto={e.cap} y={290} px={28} delay={0.12} id="cap-pieza" color={FU.hielo} /> : null);

/* ───────────── fut-cerebro ───────────── */

export const FutCerebro: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TFUT.cerebro;
  const kc = spr(f, a(C.cerebro), { damping: 14, stiffness: 110, mass: 0.9 });
  const p = easeInOut((t - a(C.reloj)) / a(C.relojDur));                       // 0–1 del recorrido de 10 min
  const min = 10 * p;
  const mm = Math.floor(min), ss = Math.floor((min - mm) * 60);
  const X0 = 130, X1 = 950, Y0 = 1390, Y1 = 1080;
  const px = (m: number): number => X0 + (m / 10) * (X1 - X0), py = (s: number): number => Y0 - (s / 100) * (Y0 - Y1);
  const ideal = `${px(0)},${py(100)} ${px(10)},${py(0)}`;
  const real = Array.from({ length: Math.max(2, Math.round(min * 12) + 1) }, (_, i) => { const m = Math.min(min, i / 12); return `${px(m).toFixed(1)},${py(supervivenciaSinDescarga(m)).toFixed(1)}`; }).join(" ");
  const k10 = clamp((t - a(C.marca10s)) / 0.4), k4 = clamp((t - a(C.marca4min)) / 0.4), kd = clamp((t - a(C.cae)) / 0.5);
  return (
    <Sala t={t}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(kc * 2)}>
          <CerebroSue x={290} y={800} s={0.5} tono={0} brillo={0.6 * (1 - p)} />
          <g transform="translate(290 800) scale(0.5)"><path d={CEREBRO} fill="#030812" opacity={0.78 * p} /></g>
        </g>
        {/* gráfica de supervivencia */}
        <g opacity={clamp(kc * 2)}>
          <rect x={X0 - 40} y={Y1 - 90} width={X1 - X0 + 80} height={Y0 - Y1 + 150} rx={24} fill="rgba(6,16,28,0.7)" stroke="rgba(61,224,255,0.35)" strokeWidth={3} />
          <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke="#BFE0FF" strokeWidth={3} opacity={0.7} /><line x1={X0} y1={Y0} x2={X0} y2={Y1 - 20} stroke="#BFE0FF" strokeWidth={3} opacity={0.7} />
          <polyline points={ideal} fill="none" stroke="#BFE0FF" strokeWidth={3} strokeDasharray="10 10" opacity={0.35} />
          <rect x={px(4)} y={Y1 - 20} width={px(6) - px(4)} height={Y0 - Y1 + 20} fill={FU.ambar} opacity={0.2 * k4} />
          <line x1={px(0.17)} y1={Y1 - 20} x2={px(0.17)} y2={Y0} stroke={FU.rojo} strokeWidth={3} opacity={k10} />
          <polyline points={real} fill="none" stroke={mezclar(FU.verde, FU.rojo, p)} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={px(min)} cy={py(supervivenciaSinDescarga(min))} r={13} fill="#fff" stroke={FU.rojo} strokeWidth={5} />
          {[0, 5, 10].map((m) => <text key={m} x={px(m)} y={Y0 + 38} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={26} fill={FU.hielo}>{m} min</text>)}
          <text x={X0 - 12} y={py(100) + 8} textAnchor="end" fontFamily={MONOF} fontWeight={700} fontSize={24} fill={FU.hielo}>100 %</text>
          <text x={X0 - 12} y={py(0) + 4} textAnchor="end" fontFamily={MONOF} fontWeight={700} fontSize={24} fill={FU.hielo}>0 %</text>
        </g>
      </svg>
      <Lectura x={690} y={680} ancho={340} alinear="left" titulo="SIN CIRCULACIÓN" valor={`${mm}:${String(ss).padStart(2, "0")}`} sub="(tiempo acelerado)" px={84} color={mezclar(FU.verde, FU.rojo, p)} opacidad={clamp(kc * 2)} id="cerebro-reloj" />
      <Lectura x={px(0.17) + 8} y={Y1 - 74} ancho={420} alinear="left" valor="≈ 10 s: pierde el conocimiento" px={26} color={FU.rojo} opacidad={k10} id="cerebro-10s" />
      <Lectura x={px(5)} y={Y1 - 4} ancho={420} alinear="center" valor="4–6 min: puede empezar el daño cerebral" px={24} color={FU.ambar} opacidad={k4} id="cerebro-4min" />
      <Lectura x={px(7.4)} y={py(34) - 50} ancho={340} alinear="left" valor="≈ −10 % por minuto" px={30} color={FU.rojo} opacidad={kd} id="cerebro-caida" />
      <Frases frases={[{ t: 0.2, texto: "SIN SANGRE,\nSIN OXÍGENO", px: 96 }, { t: 4.4, texto: "CADA MINUTO\nCUENTA", px: 98, color: FU.ambar }]} y={450} x={104} id="titular-fut-cerebro" />
      <Fuente texto={`Sin RCP ni desfibrilación la supervivencia cae ≈ ${FUT.caidaPorMinMin}–${FUT.caidaPorMinMax} % por minuto (AHA). Curva ilustrativa; el daño cerebral depende de cada caso.`} y={1500} delay={C.cae} />
      <Cap e={e} />
    </Sala>
  );
};

/* ───────────── fut-descarga ───────────── */

export const FutDescarga: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const D = TFUT.descarga;
  const kd = spr(f, a(D.dea), { damping: 12, stiffness: 140, mass: 0.8 });
  const kpa = clamp((t - a(D.parches)) / a(0.8));
  const tShock = a(D.shock);
  const modo = t < a(D.analiza) ? "apagado" : t < a(D.carga) ? "analiza" : t < tShock ? (t < a(D.carga + D.cargaDur) ? "carga" : "listo") : t < a(D.normal) ? "listo" : "normal";
  const carga = clamp((t - a(D.carga)) / a(D.cargaDur));
  const flash = t >= tShock ? Math.max(0, 1 - (t - tShock) / 0.35) : 0;
  const kcif = spr(f, a(D.cifra), { damping: 10, stiffness: 200, mass: 0.7 });
  const valor = (tt: number): number => (tt < tShock ? ecgFibrilacion(tt) : tt < tShock + 0.4 ? 0.02 * Math.sin(tt * 30) : ecgOnda((tt - tShock - 0.4) / 0.8) * 0.9);
  const ok = t >= a(D.normal);
  return (
    <Sala t={t} alerta={t < tShock ? 0.35 : 0}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ecg x={110} y={760} w={860} h={150} t={t} valor={valor} span={3.2} color={ok ? FU.verde : FU.rojo} opacidad={clamp(kd * 2)} />
        <g opacity={clamp(kd * 2)} transform={`translate(0 ${(1 - clamp(kd)) * 40})`}><Dea x={290} y={1060} s={0.9} t={t} modo={modo as "apagado"} carga={carga} destello={flash} /></g>
        {/* torso y parches */}
        <g opacity={clamp(kd * 2)}>
          <rect x={620} y={880} width={290} height={380} rx={96} fill="#1C2E44" stroke="#3F5F82" strokeWidth={5} />
          <circle cx={765} cy={832} r={44} fill="#1C2E44" stroke="#3F5F82" strokeWidth={5} />
          <g opacity={kpa}>
            <rect x={790} y={930} width={80} height={104} rx={14} fill="#fff" stroke={FU.rojo} strokeWidth={5} transform="rotate(14 830 982)" />
            <rect x={650} y={1090} width={80} height={104} rx={14} fill="#fff" stroke={FU.rojo} strokeWidth={5} transform="rotate(-20 690 1142)" />
          </g>
          <path d={`M 410 1020 C 520 1000 640 920 826 986`} fill="none" stroke="#6F7C8C" strokeWidth={7} strokeLinecap="round" strokeDasharray={`${900 * kpa} 1000`} />
          <path d={`M 410 1070 C 520 1110 600 1180 692 1146`} fill="none" stroke="#6F7C8C" strokeWidth={7} strokeLinecap="round" strokeDasharray={`${700 * kpa} 1000`} />
        </g>
        {flash > 0 && <rect width={W} height={H} fill="#fff" opacity={0.7 * flash} />}
        <g opacity={clamp(kcif * 2)} transform={`translate(540 1380) scale(${0.7 + 0.3 * clamp(kcif)})`}>
          <rect x={-420} y={-100} width={840} height={200} rx={34} fill="rgba(4,24,14,0.88)" stroke={FU.verde} strokeWidth={5} />
          <text x={-246} y={32} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={112} fill={FU.verde}>58 %</text>
          <text x={110} y={-14} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={34} fill="#fff">sobrevivieron (31 de 53)</text>
          <text x={110} y={34} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={28} fill={FU.hielo}>últimos 6 años del registro</text>
          <text x={110} y={74} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={28} fill={FU.hielo}>de EE. UU. (commotio cordis)</text>
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "LA DESCARGA\nREINICIA EL RITMO", px: 84 }]} y={450} x={104} id="titular-fut-descarga" />
      <Fuente texto="Registro de commotio cordis de EE. UU. (Heart Rhythm 2013): 31 de 53 sobrevivieron en los 6 años más recientes, con más desfibriladores y RCP públicos." y={1500} delay={D.nota} />
      <Cap e={e} />
    </Sala>
  );
};

/* ───────────── fut-rcp ───────────── */

const Paso: React.FC<{ n: number; y: number; t0: number; color: string; titulo: string; sub: string; icono: React.ReactNode }> = ({ n, y, t0, color, titulo, sub, icono }) => {
  const { f, a } = useReloj();
  const k = spr(f, a(t0), { damping: 12, stiffness: 190, mass: 0.7 });
  return (
    <div style={{ position: "absolute", left: 90, top: y + (1 - clamp(k)) * 50, width: 900, height: 250, opacity: clamp(k * 2) }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 34, border: `4px solid ${color}`, background: "rgba(4,14,24,0.86)", boxShadow: `0 0 40px ${color}33` }} />
      <div style={{ position: "absolute", left: 28, top: 22, width: 56, height: 56, borderRadius: 28, background: color, color: "#04101C", fontFamily: FONT, fontWeight: 900, fontSize: 36, textAlign: "center", lineHeight: "56px" }}>{n}</div>
      <div style={{ position: "absolute", left: 300, top: 40, right: 30 }}>
        <div data-texto={`rcp-t${n}`} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 44, lineHeight: 1.08, color: "#fff" }}>{titulo}</div>
        <div data-texto={`rcp-s${n}`} style={{ fontFamily: FONT, fontWeight: 600, fontSize: 31, lineHeight: 1.22, color: FU.hielo, marginTop: 12 }}>{sub}</div>
      </div>
      <svg width={280} height={250} viewBox="0 0 280 250" style={{ position: "absolute", left: 0, top: 0 }}>{icono}</svg>
    </div>
  );
};

export const FutRcp: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const R = TFUT.rcp;
  const act2 = clamp((t - a(R.paso2)) / 0.5);
  return (
    <Sala t={t}>
      <Frases frases={[{ t: 0.2, texto: "SI NO RESPONDE\nY NO RESPIRA", px: 88, color: FU.ambar }]} y={450} x={104} id="titular-fut-rcp" />
      <Paso n={1} y={610} t0={R.paso1} color={FU.cian} titulo="LLAMA A EMERGENCIAS" sub="112 · 123 · 911, según tu país" icono={<g transform="translate(170 126)"><Telefono x={0} y={0} s={0.7} t={t} llamando={t > a(R.paso1) && t < a(R.paso2) ? 1 : 0} /></g>} />
      <Paso n={2} y={895} t0={R.paso2} color={FU.rojo} titulo="COMPRIME EL CENTRO DEL PECHO" sub={`fuerte y rápido: ${FUT.rcpRitmoMin}–${FUT.rcpRitmoMax} por minuto, ${FUT.rcpProfCmMin}–${FUT.rcpProfCmMax} cm`} icono={<g transform="translate(170 150)"><Compresion x={0} y={0} s={0.7} t={t} bpm={R.ritmo} activo={act2} /></g>} />
      <Paso n={3} y={1180} t0={R.paso3} color={FU.verde} titulo="BUSCA UN DESFIBRILADOR (DEA)" sub="te guía con voz: úsalo en cuanto llegue" icono={<g transform="translate(160 128)"><Dea x={0} y={0} s={0.33} t={t} modo="analiza" /></g>} />
      <Fuente texto="Pautas de RCP de adultos (AHA). Esto no reemplaza un curso de primeros auxilios: busca uno cerca de ti." y={1500} delay={R.paso3} />
      <Cap e={e} />
    </Sala>
  );
};

/* ───────────── fut-cierre ───────────── */

export const FutCierre: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const Z = TFUT.cierre;
  const kv = spr(f, a(Z.vela), { damping: 16, stiffness: 70, mass: 1.2 });
  const kchip = clamp((t - a(Z.chip)) / 0.5);
  return (
    <Sala t={t} latido={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Vela x={540} y={1230} s={1.25} t={t} luz={kv} />
      </svg>
      <Frases frases={[{ t: Z.frase1, texto: "APRENDE\nRCP", px: 126 }, { t: Z.frase2, texto: "DESCANSE EN PAZ\nJESÚS DE MIGUEL", px: 76, color: FU.llama }]} y={450} x={104} id="titular-fut-cierre" />
      <div data-texto="cierre-chip" style={{ position: "absolute", left: 100, top: 1400, width: 880, textAlign: "center", opacity: kchip }}>
        <span style={{ display: "inline-block", padding: "10px 28px", borderRadius: 999, border: `3px solid ${FU.llama}`, background: "rgba(10,8,4,0.82)", fontFamily: FONT, fontWeight: 800, fontSize: 32, color: "#fff" }}>pregunta por cursos de RCP en tu ciudad</span>
      </div>
      <Fuente texto="Información educativa; no sustituye un curso de primeros auxilios. Datos de la noticia: comunicados del CD Tenerife y medios." y={1490} delay={Z.chip} />
      <Cap e={e} />
    </Sala>
  );
};
