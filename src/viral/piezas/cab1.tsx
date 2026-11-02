/**
 * «Tus cables se enredan solos» (SINAPSIS · física cotidiana) · escenas 1/2
 *   cab-gancho  la cuerda bien enrollada se desordena hasta ser un nudo (halftone + borde, cruces con arriba y abajo)
 *   cab-caja    una cuerda dentro de una caja que gira 1 vuelta por segundo durante 10 s (SIMULACIÓN 2D ilustrativa del experimento de 2007)
 *   cab-largo   cuaderno: curva ESQUEMÁTICA de la probabilidad de nudo según la longitud (nada bajo 46 cm, sube hasta ≈ 1,5 m y se estanca)
 */
import React, { useMemo } from "react";
import { CAB, TCAB } from "../../anim/piezas";
import { FPS_CUERDA, cuerdaEnrollada, probNudoEsquema, simularCuerda } from "../../anim/cuerda";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, LineaCap, MONO, W, clamp, easeInOut, easeOut, lerp, useReloj } from "../comun";
import { AN, Lienzo } from "./anom-ui";
import { CB, CajaGiro, CuerdaSim, CuerdaZ, curvaToro, remuestrear, type P3 } from "./cab-kit";
import { Garabato, Nota, Texto, ovaloMano } from "./dig-kit";
import { Frases } from "./real-kit";

type P = { e: EscenaViralGuardada };

const Cap: React.FC<{ e: EscenaViralGuardada; color?: string }> = ({ e, color }) => (e.cap ? <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={color ?? AN.papel} /> : null);

/* ───────────── cab-gancho ───────────── */

export const CabGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TCAB.gancho;
  const M = 160;
  const { espiral, nudo } = useMemo(() => {
    const sp = remuestrear(cuerdaEnrollada(48, 4), M).map((p) => ({ x: 540 + p.x * 400, y: 1010 + (p.y - 0.3) * 400 }));
    const kn = curvaToro(2, 5, M, true).map((p) => ({ x: 540 + p.x * 345, y: 1010 + p.y * 345, z: p.z }));
    return { espiral: sp, nudo: kn };
  }, []);
  const dibuja = easeOut((t - a(G.coil)) / a(0.9));
  const k = easeInOut((t - a(G.nudo)) / a(G.nudoDur));
  const w = Math.sin(Math.PI * k) * 34;
  const pts: P3[] = espiral.map((p, i) => ({
    x: lerp(p.x, nudo[i].x, k) + w * Math.sin(i * 0.21 + f * 0.15),
    y: lerp(p.y, nudo[i].y, k) + w * Math.cos(i * 0.17 + f * 0.13),
    z: lerp(i * 0.004, nudo[i].z, k),
  }));
  const nVis = Math.max(2, Math.floor(M * clamp(dibuja)));
  const ring = clamp((t - a(G.nudo + G.nudoDur - 0.2)) / a(0.45));
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <CuerdaZ pts={pts} color={CB.cuerda} fondo={AN.oscuro} grosor={15} avance={dibuja} />
        {dibuja > 0.02 && [pts[0], pts[nVis - 1]].map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={19} fill={AN.papel} stroke={AN.oscuro} strokeWidth={5} />)}
        <Garabato d={ovaloMano(540, 1010, 405, 385, 3)} k={ring} color={AN.lima} grosor={6} />
      </svg>
      <Cap e={e} />
      <Frases id="titular-gancho" y={430} frases={[{ px: 96, t: 0.2, texto: "BIEN\nENROLLADOS", color: AN.papel }, { px: 96, t: 2.0, texto: "AL SACARLOS:\nNUDO", color: AN.rojo }]} />
      <Nota texto="¡NUDO!" x={800} y={650} px={30} delay={G.nudo + G.nudoDur} id="gancho-nudo" />
      <Nota texto="¿POR QUÉ PASA?" x={540} y={1490} px={30} delay={G.chip} id="gancho-chip" />
    </Lienzo>
  );
};

/* ───────────── cab-caja ───────────── */

export const CabCaja: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const C = TCAB.caja;
  const sim = useMemo(() => simularCuerda({ n: 64, largo: 6, rigidez: 0.15, rps: CAB.rps, seg: CAB.tumbleSeg }), []);
  const kg = clamp((t - a(C.gira)) / a(C.giraDur));
  const idx = Math.min(sim.frames.length - 1, Math.round(kg * CAB.tumbleSeg * FPS_CUERDA));
  const kc = clamp((t - a(C.caja)) / a(0.6));
  const seg = kg * CAB.tumbleSeg;
  const cx = 540, cy = 1010, s = 285;
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <CajaGiro cx={cx} cy={cy} s={s} ang={sim.angulos[idx]} k={kc} />
        <g opacity={clamp(kc * 2)}>
          <CuerdaSim p={sim.frames[idx]} cx={cx} cy={cy} s={s} color={CB.cuerda} fondo={AN.oscuro} grosor={12} />
        </g>
      </svg>
      <Cap e={e} />
      <Frases id="titular-caja" y={425} frases={[{ px: 84, t: 0.2, texto: "UNA CUERDA.\nUNA CAJA.", color: AN.papel }, { px: 84, t: C.gira + 2.1, texto: "10 SEGUNDOS\nGIRANDO", color: AN.lima }]} />
      <Texto texto={`t = ${seg.toFixed(1).replace(".", ",")} s`} x={130} y={1475} px={42} color={AN.lima} alinear="left" delay={C.gira} peso={800} id="caja-tiempo" />
      <Texto texto={`CRUCES EN 2D: ${sim.cruces[idx]}`} x={950} y={1475} px={36} color={AN.lima} alinear="right" delay={C.cruces} peso={800} id="caja-cruces" />
      <Nota texto="ILUSTRACIÓN 2D · Raymer y Smith, PNAS 2007" x={540} y={1560} px={24} delay={C.chip} id="caja-chip" />
    </Lienzo>
  );
};

/* ───────────── cab-largo ───────────── */

export const CabLargo: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const L = TCAB.largo;
  const X0 = 170, X1 = 930, YB = 1280, YT = 680;
  const xo = (cm: number): number => X0 + ((X1 - X0) * cm) / 200;
  const yo = (pr: number): number => YB - (YB - YT) * pr;
  const ke = clamp((t - a(L.ejes)) / a(0.6));
  const cmAct = 200 * easeInOut((t - a(L.curva)) / a(L.curvaDur));
  let d = "";
  for (let cm = 0; cm <= cmAct + 0.001; cm += 2) d += `${cm === 0 ? "M" : "L"} ${xo(cm).toFixed(1)} ${yo(probNudoEsquema(cm)).toFixed(1)} `;
  d += `L ${xo(cmAct).toFixed(1)} ${yo(probNudoEsquema(cmAct)).toFixed(1)}`;
  const tip = { x: xo(cmAct), y: yo(probNudoEsquema(cmAct)) };
  const yMeseta = yo(0.55);
  const dash = (x: number, y0: number, y1: number, col: string, k: number): React.ReactNode => (k > 0.01 ? <line x1={x} x2={x} y1={y0} y2={y0 + (y1 - y0) * clamp(k)} stroke={col} strokeWidth={4} strokeDasharray="10 9" strokeLinecap="round" /> : null);
  return (
    <Lienzo modo="papel">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={ke} stroke={CB.tinta} strokeWidth={5} strokeLinecap="round" fill="none">
          <line x1={X0} x2={X1} y1={YB} y2={YB} />
          <line x1={X0} x2={X0} y1={YB} y2={YT - 24} />
          <line x1={X0} x2={X1} y1={YT} y2={YT} strokeWidth={3} strokeDasharray="12 10" strokeOpacity={0.5} />
          {[0, 46, 100, 150, 200].map((cm) => <line key={cm} x1={xo(cm)} x2={xo(cm)} y1={YB} y2={YB + 12} />)}
        </g>
        <g opacity={ke} fontFamily={MONO} fontSize={24} fontWeight={700} fill={CB.tinta}>
          <text x={X0} y={YT - 36} textAnchor="start" fillOpacity={0.7}>100 %</text>
          {[[0, "0"], [46, "46"], [100, "100"], [150, "150"], [200, "200"]].map(([cm, tx]) => <text key={String(cm)} x={xo(Number(cm))} y={YB + 44} textAnchor="middle">{tx}</text>)}
          <text x={(X0 + X1) / 2} y={YB + 88} textAnchor="middle" fillOpacity={0.75}>LONGITUD DE LA CUERDA (cm)</text>
        </g>
        {dash(xo(46), YB, YB - 250, CB.cuerda, (cmAct - 46) / 8)}
        {dash(xo(150), YB, yMeseta, CB.cuerda, (cmAct - 150) / 8)}
        {cmAct > 150 && <line x1={xo(150)} x2={X1} y1={yMeseta} y2={yMeseta} stroke={CB.cuerda} strokeWidth={4} strokeDasharray="4 10" strokeLinecap="round" />}
        <path d={d} fill="none" stroke={CB.cuerda} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        {cmAct > 1 && <circle cx={tip.x} cy={tip.y} r={15} fill={CB.cuerda} stroke={CB.tinta} strokeWidth={5} />}
      </svg>
      <Cap e={e} color={AN.tinta} />
      <Frases id="titular-largo" y={430} frases={[{ px: 80, t: 0.2, texto: "BAJO 46 CM:\nCERO NUDOS", color: AN.tinta }, { px: 80, t: 3.0, texto: "SUBE RÁPIDO\nHASTA 1,5 M", color: AN.rojo }]} />
      <Texto texto="LONGITUD" x={225} y={745} px={22} color={AN.tinta} alinear="left" delay={L.ejes} peso={700} opacidad={0.7} id="largo-etq" />
      <Texto texto={`${Math.round(cmAct)} cm`} x={225} y={815} px={68} color={AN.tinta} alinear="left" delay={L.ejes} peso={800} id="largo-cm" />
      <Texto texto={"SIN\nNUDOS"} x={256} y={1200} px={28} color={AN.tinta} delay={L.umbral} peso={800} id="largo-sin" />
      <Texto texto={"SE ESTANCA POR\nDEBAJO DEL 100 %"} x={730} y={830} px={26} color={AN.rojo} delay={L.meseta} peso={800} id="largo-meseta" />
      <Nota texto="FORMA DE LA CURVA · NO SON SUS DATOS" x={540} y={1500} px={24} color={AN.tinta} fondo="rgba(244,241,234,0.96)" delay={L.chip} id="largo-chip" />
    </Lienzo>
  );
};
