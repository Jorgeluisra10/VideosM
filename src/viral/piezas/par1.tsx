/**
 * «La regla del 37 %» (parada óptima · IMNOBA) · escenas 1/2
 *   par-gancho   dos filas: decidir por impulso (te quedas con la primera) y esperar la perfecta (las buenas se van)
 *   par-fila     100 cápsulas con valor oculto desfilan frente a un visor técnico
 *   par-impulso  frenar pronto atrapa una opción mediocre (azul) por no tener con qué compararla; la mejor llegaba después
 *   par-espera   esperar hasta el final: la mejor pasa de largo y el visor queda vacío
 */
import React, { useMemo } from "react";
import { PAR, TPA, secEspera, secImpulso } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Odometro, Titular } from "./anom-ui";
import { Etq, Fila, IM, LienzoIM, VisorFila, barrido, xCap } from "./par-ui";
import { Fuente } from "./real1";

type P = { e: EscenaViralGuardada };

/* ───────────── par-gancho ───────────── */

export const ParGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const vI = useMemo(secImpulso, []), vE = useMemo(secEspera, []);
  const YA = 960, YB = 1390, ALTO = 240;
  const idxA = barrido(t, a(TPA.gancho.a0), a(TPA.gancho.a1 - TPA.gancho.a0), 0, 5);
  const lockA = t >= a(TPA.gancho.a1);
  const idxB = barrido(t, a(TPA.gancho.b0), a(TPA.gancho.b1 - TPA.gancho.b0), 0, 99);
  const aparece = (i: number): number => clamp((t - 0.25 - i * 0.004) / 0.35);
  const sA = spr(f, a(TPA.gancho.a0 - 0.3), { damping: 14, stiffness: 150, mass: 0.7 });
  const sB = spr(f, a(TPA.gancho.b0 - 0.3), { damping: 14, stiffness: 150, mass: 0.7 });
  return (
    <LienzoIM>
      <svg width={W} height={1920} viewBox={`0 0 ${W} 1920`} style={{ position: "absolute", inset: 0 }}>
        <Fila valores={vI} yBase={YA} alto={ALTO} est={(i) => ({ rev: clamp(idxA - i + 1), op: aparece(i), color: i === 5 && lockA ? IM.azul : undefined, brillo: i === 5 && lockA ? 1 : 0 })} />
        <VisorFila idx={idxA} n={100} yBase={YA} alto={ALTO} progreso={sA} color={lockA ? IM.azul : IM.tele} />
        <Fila valores={vE} yBase={YB} alto={ALTO} est={(i) => {
          const pasada = t >= a(TPA.gancho.b0) && i < idxB;
          return { rev: clamp(idxB - i + 1), op: aparece(i) * (pasada ? lerp(1, 0.16, clamp((idxB - i) / 26)) : 1), color: i === 21 && idxB >= 21 ? IM.amarillo : undefined, brillo: i === 21 && idxB >= 21 && idxB < 40 ? 1 : 0 };
        }} />
        {t >= a(TPA.gancho.b0 - 0.3) && <VisorFila idx={idxB} n={100} yBase={YB} alto={ALTO} progreso={sB} color={IM.tele} />}
      </svg>
      <Titular lineas={[{ texto: "¿IMPULSO", color: IM.blanco, delay: 0.1 }, { texto: "O PARÁLISIS?", color: IM.amarillo, delay: 0.35 }]} y={470} maxPx={128} minPx={72} id="par-titulo" color={IM.blanco} />
      <Etq texto="A · DECIDES POR IMPULSO" x={100} y={YA - ALTO - 78} px={28} alinear="left" op={clamp((t - 0.6) / 0.4)} id="par-a" />
      <Etq texto="TE QUEDAS CON LA PRIMERA" x={W / 2} y={YA + 66} px={30} color={IM.azul} op={lockA ? clamp((t - a(TPA.gancho.a1)) / 0.3) : 0} peso={800} id="par-a2" />
      <Etq texto="B · ESPERAS LA PERFECTA" x={100} y={YB - ALTO - 78} px={28} alinear="left" op={clamp((t - a(TPA.gancho.b0 - 0.8)) / 0.4)} id="par-b" />
      <Etq texto="SE VAN LAS BUENAS" x={W / 2} y={YB + 66} px={30} color={IM.rojo} op={clamp((t - a(TPA.gancho.b0 + 1.6)) / 0.4)} peso={800} id="par-b2" />
    </LienzoIM>
  );
};

/* ───────────── par-fila ───────────── */

export const ParFila: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const v = useMemo(secImpulso, []);
  const YB = 1080, ALTO = 380;
  const idx = barrido(t, a(TPA.fila.scan), a(TPA.fila.scanDur), 0, 24, true);
  const n = 100 * easeOut((t - a(0.5)) / a(1.5));
  const valor = v[Math.min(99, Math.max(0, Math.round(idx)))];
  const enCurso = t >= a(TPA.fila.scan);
  return (
    <LienzoIM>
      <svg width={W} height={1920} viewBox={`0 0 ${W} 1920`} style={{ position: "absolute", inset: 0 }}>
        <Fila valores={v} yBase={YB} alto={ALTO} ejes est={(i) => ({ rev: enCurso ? clamp(idx - i + 1) : 0, op: clamp((t - a(TPA.fila.aparece) - i * 0.014) / 0.3) })} />
        {enCurso && <VisorFila idx={idx} n={100} yBase={YB} alto={ALTO} color={IM.tele} />}
      </svg>
      <Titular lineas={[{ texto: "100 OPCIONES", color: IM.blanco, delay: 0.1 }, { texto: "VALOR OCULTO", color: IM.amarillo, delay: 0.35 }]} y={450} maxPx={118} minPx={72} id="par-titulo" color={IM.blanco} />
      <Etq texto="las ves una por una · sin volver atrás" x={W / 2} y={610} px={28} op={clamp((t - 1.4) / 0.5)} id="par-sub" />
      <Odometro valor={n} x={100} y={1290} px={112} digitos={3} color={IM.blanco} alinear="left" id="par-n" opacidad={clamp((t - 0.4) / 0.4)} />
      <Etq texto="OPCIONES (N)" x={100} y={1388} px={26} alinear="left" op={clamp((t - 0.8) / 0.4)} id="par-n-etq" />
      <Odometro valor={enCurso ? valor : 0} x={980} y={1290} px={112} digitos={3} color={IM.amarillo} alinear="right" id="par-v" opacidad={enCurso ? 1 : 0.25} />
      <Etq texto="VALOR (SOLO AL PASAR)" x={980} y={1388} px={26} alinear="right" op={clamp((t - 0.8) / 0.4)} id="par-v-etq" />
    </LienzoIM>
  );
};

/* ───────────── par-impulso ───────────── */

export const ParImpulso: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const v = useMemo(secImpulso, []);
  const YB = 1060, ALTO = 380;
  const lock = t >= a(TPA.impulso.lock);
  const idxS = barrido(t, a(TPA.impulso.scan), a(TPA.impulso.scanDur), 0, PAR.impulso.previo.pos);
  const idxR = t >= a(TPA.impulso.resto) ? barrido(t, a(TPA.impulso.resto), a(TPA.impulso.restoDur), PAR.impulso.previo.pos + 1, 99, true) : PAR.impulso.previo.pos;
  const idx = lock ? PAR.impulso.previo.pos : idxS;
  const iB = PAR.impulso.previo.pos, iM = PAR.impulso.mejorEn;
  const sLock = spr(f, a(TPA.impulso.lock), { damping: 11, stiffness: 190, mass: 0.6 });
  const mejorVista = idxR >= iM;
  const kArco = clamp((t - a(TPA.impulso.mejor)) / a(0.9));
  const x1 = xCap(iB, 100), x2 = xCap(iM, 100);
  const y1 = YB - (ALTO * v[iB]) / 100 - 20, y2 = YB - ALTO - 20;
  return (
    <LienzoIM>
      <svg width={W} height={1920} viewBox={`0 0 ${W} 1920`} style={{ position: "absolute", inset: 0 }}>
        <Fila valores={v} yBase={YB} alto={ALTO} ejes est={(i) => {
          if (i <= iB) return { rev: clamp(idxS - i + 1), color: i === iB && lock ? IM.azul : undefined, brillo: i === iB && lock ? sLock : 0 };
          const rev = clamp(idxR - i + 1);
          return { rev, color: i === iM && mejorVista ? IM.amarillo : undefined, op: i === iM ? 1 : 0.55, brillo: i === iM && mejorVista ? 1 : 0 };
        }} />
        <VisorFila idx={idx} n={100} yBase={YB} alto={ALTO} color={lock ? IM.azul : IM.tele} />
        {kArco > 0 && <path d={`M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.min(y1, y2) - 70} ${x2} ${y2}`} fill="none" stroke={IM.luz} strokeWidth={3} pathLength={1} strokeDasharray={`${kArco} 1`} opacity={0.9} />}
      </svg>
      <Titular lineas={[{ texto: "FRENAS MUY PRONTO:", color: IM.blanco, delay: 0.1 }, { texto: "UNA MEDIOCRE", color: "#7FA2FF", delay: 0.35 }]} y={450} maxPx={104} minPx={64} id="par-titulo" color={IM.blanco} />
      <Etq texto="no tienes con qué compararla" x={W / 2} y={1490} px={30} op={clamp((t - a(TPA.impulso.lock + 0.3)) / 0.5)} id="par-sub" />
      <Odometro valor={lock ? v[iB] * easeOut((t - a(TPA.impulso.lock)) / a(0.8)) : 0} x={100} y={1290} px={112} digitos={2} color="#7FA2FF" sufijo="/100" alinear="left" id="par-elegida" opacidad={lock ? 1 : 0.2} />
      <Etq texto={`TU ELECCIÓN · #${iB + 1}`} x={100} y={1388} px={26} color="#7FA2FF" alinear="left" op={lock ? 1 : 0} id="par-elegida-etq" />
      <Odometro valor={mejorVista ? 100 : 0} x={980} y={1290} px={112} digitos={3} color={IM.amarillo} alinear="right" id="par-mejor" opacidad={mejorVista ? 1 : 0.2} />
      <Etq texto={`LA MEJOR · #${iM + 1}`} x={980} y={1388} px={26} color={IM.amarillo} alinear="right" op={mejorVista ? 1 : 0} id="par-mejor-etq" />
    </LienzoIM>
  );
};

/* ───────────── par-espera ───────────── */

export const ParEspera: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const v = useMemo(secEspera, []);
  const YB = 1060, ALTO = 380;
  const iM = PAR.espera.mejorEn;
  const idx = barrido(t, a(TPA.espera.scan), a(TPA.espera.scanDur), 0, 99);
  const vacio = t >= a(TPA.espera.vacio);
  const fin = clamp((t - a(TPA.espera.vacio)) / a(0.7));
  const topM = YB - ALTO - 20;
  return (
    <LienzoIM>
      <svg width={W} height={1920} viewBox={`0 0 ${W} 1920`} style={{ position: "absolute", inset: 0 }}>
        <Fila valores={v} yBase={YB} alto={ALTO} ejes est={(i) => {
          const pasada = i < idx;
          const lejos = clamp((idx - i) / 18);
          const op = (i === iM ? lerp(1, 0.45, lejos) : lerp(1, 0.28, lejos)) * (vacio ? lerp(1, 0.6, fin) : 1);
          return { rev: clamp(idx - i + 1), op: pasada || i >= idx ? op : 1, color: i === iM && idx >= iM ? IM.amarillo : undefined, brillo: i === iM && idx >= iM && idx < iM + 14 ? 1 : 0 };
        }} />
        <VisorFila idx={Math.min(99, idx)} n={100} yBase={YB} alto={ALTO} color={vacio ? IM.rojo : IM.tele} />
        {idx >= iM && <line x1={xCap(iM, 100)} x2={xCap(iM, 100)} y1={topM} y2={topM - 36} stroke={IM.amarillo} strokeWidth={3} />}
      </svg>
      <Titular lineas={[{ texto: "ESPERAR SIEMPRE:", color: IM.blanco, delay: 0.1 }, { texto: "VISOR VACÍO", color: IM.rojo, delay: 0.35 }]} y={450} maxPx={108} minPx={66} id="par-titulo" color={IM.blanco} />
      <Etq texto="100 · LA MEJOR PASÓ AQUÍ" x={100} y={topM - 66} px={26} color={IM.amarillo} alinear="left" op={clamp((t - a(TPA.espera.mejor)) / 0.4)} id="par-paso" />
      <Etq texto="0 OPCIONES ELEGIDAS" x={W / 2} y={1310} px={42} color={IM.rojo} op={fin} peso={800} id="par-cero" />
      <Etq texto="buscar la perfección también cuesta" x={W / 2} y={1400} px={28} op={fin} id="par-sub" />
    </LienzoIM>
  );
};
