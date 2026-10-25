/**
 * Ensayo «Anomalía» · escenas a medida 4/4-b
 *   anom-laboratorio  sobre papel: un potenciómetro de DISTANCIA barre 0–1.500 m y va dibujando la curva de valorización (nube de registros + curva + banda de 500–800 m),
 *                     con tarjeta académica (fuente editable por props), tríada «distancia · tiempo · valor» y lectura en odómetro
 *   anom-compresion   metaballs viscosas: el tiempo (azul) se contrae de 63 a 27 min y el suelo (rojo) crece ×1,35; se atraen y se funden en un solo cuerpo
 */
import React, { useMemo } from "react";
import { METRO_DATOS, TA, valorSuelo } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { Etiqueta, H, LineaCap, MONO, W, clamp, easeInOut, easeOut, lerp, mezclar, useReloj } from "../comun";
import { AN, Knob, Lienzo, Odometro, Titular, Visor, ruido } from "./anom-ui";
import { useUid } from "../../estudio/util";

type P = { e: EscenaViralGuardada };

/* ───────────── anom-laboratorio ───────────── */

const X0 = 170, X1 = 920, Y0 = 905, Y1 = 1290;
const D_MAX = 1500, V_MAX = 40;
const gx = (d: number): number => lerp(X0, X1, d / D_MAX);
const gy = (v: number): number => lerp(Y1, Y0, v / V_MAX);

export const AnomLaboratorio: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const uid = useUid();
  const pts = useMemo(() => Array.from({ length: 46 }, (_, i) => { const d = (i / 45) * D_MAX; return { d, v: Math.max(0, valorSuelo(d) + (azar(i * 3.7 + 1) - 0.5) * 7) }; }), []);
  const curva = useMemo(() => Array.from({ length: 121 }, (_, i) => { const d = (i / 120) * D_MAX; return { d, v: valorSuelo(d) }; }), []);
  const barrido = easeInOut((t - a(TA.lab.knob)) / a(TA.lab.knobDur));
  const d = barrido * D_MAX;
  const v = valorSuelo(d);
  const banda = easeOut((t - 0.5) / 0.6);
  const visibles = curva.filter((p) => p.d <= d);
  const polilinea = visibles.map((p) => `${gx(p.d)},${gy(p.v)}`).join(" ");
  const card = clamp((t - 0.7) / 0.5);
  const fuente = (e.pieza?.props?.fuente as string) ?? "BID y estudios de desarrollo urbano";
  const anio = e.pieza?.props?.anio ? ` · ${e.pieza.props.anio}` : "";
  return (
    <Lienzo modo="papel">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id={`${uid}h`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="12" stroke={AN.azul} strokeWidth="3" opacity="0.5" /></pattern>
        </defs>
        {/* tarjeta académica */}
        <g opacity={card}>
          <rect x={120} y={650} width={W - 240} height={150} fill="none" stroke={AN.tinta} strokeWidth={3} />
          <rect x={120} y={650} width={190} height={34} fill={AN.tinta} />
        </g>
        {/* ejes y rejilla */}
        {[0, 10, 20, 30, 40].map((val) => <line key={val} x1={X0} x2={X1} y1={gy(val)} y2={gy(val)} stroke={AN.tinta} strokeOpacity={0.13} strokeWidth={2} />)}
        <rect x={gx(500)} y={Y0} width={gx(800) - gx(500)} height={Y1 - Y0} fill={`url(#${uid}h)`} opacity={banda} />
        <line x1={gx(500)} x2={gx(500)} y1={Y0} y2={Y1} stroke={AN.azul} strokeWidth={2.5} strokeDasharray="6 7" opacity={banda} />
        <line x1={gx(800)} x2={gx(800)} y1={Y0} y2={Y1} stroke={AN.azul} strokeWidth={2.5} strokeDasharray="6 7" opacity={banda} />
        <path d={`M ${X0} ${Y0 - 12} L ${X0} ${Y1} L ${X1 + 12} ${Y1}`} fill="none" stroke={AN.tinta} strokeWidth={4} />
        {/* registros (nube de puntos): aparecen al pasar el cursor */}
        {pts.map((p, i) => p.d <= d && <circle key={i} cx={gx(p.d)} cy={gy(p.v)} r={6.5} fill={AN.tinta} opacity={0.72} />)}
        {visibles.length > 1 && <polyline points={polilinea} fill="none" stroke={AN.rojo} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />}
        {/* cursor: guía vertical + punto sobre la curva */}
        <line x1={gx(d)} x2={gx(d)} y1={Y0 - 12} y2={Y1} stroke={AN.tinta} strokeWidth={2.5} strokeDasharray="3 6" opacity={clamp(barrido * 20)} />
        <circle cx={gx(d)} cy={gy(v)} r={13 + 2.5 * Math.sin(t * 5)} fill={AN.lima} stroke={AN.tinta} strokeWidth={5} opacity={clamp(barrido * 20)} />
        {/* perilla de distancia */}
        <Knob cx={260} cy={1475} r={72} valor={d / D_MAX} etiqueta="DISTANCIA" lectura={`${Math.round(d / 10) * 10} m`} color={AN.rojo} ink={AN.tinta} aparece={clamp((t - 0.6) / 0.5)} />
        <Visor x={96} y={590} w={W - 192} h={770} color={AN.tinta} progreso={easeOut((t - 0.2) / 0.7)} />
      </svg>
      {e.cap && <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={AN.tinta} />}
      <Titular y={445} maxPx={86} color={AN.tinta} lineas={[{ texto: "DISTANCIA", delay: 0.15 }, { texto: "TIEMPO", delay: 0.45 }, { texto: "VALOR", color: AN.rojo, delay: 0.75 }]} id="titular-lab" />
      <div data-texto="lab-card" style={{ position: "absolute", left: 138, top: 660, width: W - 276, fontFamily: MONO, color: AN.tinta, opacity: card, lineHeight: 1.45 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: AN.papel, marginBottom: 14, letterSpacing: "0.08em" }}>FUENTE</div>
        <div style={{ fontSize: 25, fontWeight: 700 }}>{fuente}{anio}</div>
        <div style={{ fontSize: 22, opacity: 0.7 }}>valor del suelo a 500–800 m de una estación</div>
      </div>
      {[0, 10, 20, 30, 40].map((val) => <Etiqueta key={val} texto={`${val} %`} x={X0 - 14} y={gy(val)} px={22} ancho={110} alinear="right" mono color={AN.tinta} peso={400} mayus={false} delay={0.5} id="lab-y" />)}
      {[0, 500, 800, 1500].map((m) => <Etiqueta key={m} texto={`${m}`} x={gx(m)} y={Y1 + 38} px={22} ancho={110} mono color={AN.tinta} peso={400} mayus={false} delay={0.6} id="lab-x" />)}
      <Odometro valor={Math.round(v)} x={W - 150} y={1450} px={118} digitos={2} prefijo="+" sufijo="%" alinear="right" color={AN.rojo} id="lab-valor" />
      <Etiqueta texto="valor del suelo a esa distancia" x={W - 150} y={1555} px={24} ancho={560} alinear="right" mono color={AN.tinta} peso={400} mayus={false} delay={0.8} id="lab-valor-etq" />
    </Lienzo>
  );
};

/* ───────────── anom-compresion ───────────── */

export const AnomCompresion: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const uid = useUid();
  const k = easeInOut((t - a(TA.compresion.ini)) / a(TA.compresion.dur));
  const fus = easeInOut((t - a(TA.compresion.fusion)) / a(TA.compresion.fusionDur));
  const minutos = lerp(63, METRO_DATOS.minMetro, k);
  const area = lerp(1, 1.35, k);
  const Rt = lerp(205, 205 * Math.sqrt(METRO_DATOS.minMetro / 63), k) * 1.0;
  const Rs = lerp(112, 112 * Math.sqrt(1.35), k);
  const cy = lerp(930, 1135, fus);
  const xt = lerp(300, 540 - 58, fus), xs = lerp(790, 540 + 58, fus);
  const gotas = 14;
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id={`${uid}g`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="17" result="b" />
            <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -10" />
          </filter>
        </defs>
        <g filter={`url(#${uid}g)`}>
          <circle cx={xt} cy={cy} r={Rt} fill={AN.azul} />
          <circle cx={xs} cy={cy} r={Rs} fill={AN.rojo} />
          {/* gotas viscosas: unas orbitan el tiempo, otras el suelo, y se estiran hacia el otro cuerpo al acercarse */}
          {Array.from({ length: gotas }, (_, i) => {
            const delTiempo = i % 2 === 0;
            const R = delTiempo ? Rt : Rs;
            const cx0 = delTiempo ? xt : xs;
            const ang = t * (0.55 + azar(i) * 0.5) * (delTiempo ? 1 : -1) + i * 2.4;
            const rr = R * (1.12 + 0.25 * Math.sin(t * 1.3 + i) * 0.5 + 0.12) + 14 * azar(i * 2);
            const tira = (fus + 0.15 * k) * (delTiempo ? 1 : -1);
            return <circle key={i} cx={cx0 + Math.cos(ang) * rr + tira * 70} cy={cy + Math.sin(ang) * rr} r={8 + azar(i * 5) * 12} fill={delTiempo ? AN.azul : AN.rojo} />;
          })}
        </g>
        {/* contornos finos y semitono sobre el cuerpo rojo (volumen) */}
        {Array.from({ length: 36 }, (_, i) => { const ang = (i / 36) * Math.PI * 2; return <circle key={i} cx={xs + Math.cos(ang) * Rs * 0.62} cy={cy + Math.sin(ang) * Rs * 0.62} r={3.2 + 3 * Math.abs(Math.sin(ang * 2))} fill={AN.oscuro} opacity={0.5} />; })}
        <Visor x={96} y={560} w={W - 192} h={800 + fus * 0} progreso={easeOut((t - 0.2) / 0.7)} cruz />
      </svg>
      {e.cap && <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={AN.blanco} />}
      <Titular y={440} maxPx={104} lineas={[{ texto: "MENOS TIEMPO", delay: 0.15 }, { texto: "MÁS SUELO", color: AN.rojo, delay: 0.5 }]} id="titular-compresion" />
      <Etiqueta texto="tiempo de viaje" x={150} y={1370} px={24} ancho={380} alinear="left" mono color={AN.blanco} peso={400} mayus={false} delay={0.8} id="compresion-etq1" />
      <Odometro valor={minutos} x={150} y={1460} px={96} digitos={2} sufijo="min" color={AN.lima} alinear="left" id="compresion-min" />
      <Etiqueta texto="valor del suelo" x={W - 150} y={1370} px={24} ancho={380} alinear="right" mono color={AN.blanco} peso={400} mayus={false} delay={1.0} id="compresion-etq2" />
      <Odometro valor={Math.round((area - 1) * 100)} x={W - 150} y={1460} px={96} digitos={2} prefijo="+" sufijo="%" color={AN.rojo} alinear="right" id="compresion-pct" />
    </Lienzo>
  );
};
