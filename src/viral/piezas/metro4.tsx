/**
 * Piloto «Metro de Bogotá» · escenas a medida 4/4 (acto 5: la transformación urbana y el cierre)
 *   metro-silueta  una barra de luz recorre la ciudad y cambia «antes» (lotes bajos, grises) por «después» (torres con ventanas encendidas) alrededor de las estaciones
 *   metro-balanza  un resorte que se comprime (el tiempo) y un metro cuadrado que se estira (el valor), unidos por un flujo de partículas
 */
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { TP } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { Etiqueta, FUENTE, H, LineaCap, MONO, W, clamp, easeInOut, easeOut, lerp, mezclar, oscurecer, spr, useReloj, useViral } from "../comun";
import { Cabecera } from "./metro1";

type P = { e: EscenaViralGuardada };

/* ───────────── metro-silueta ───────────── */

const NE = 22, ANCHO_E = 30, PASO_E = 36, X_INI = 144, SUELO = 1340, VIA = 1262;
const ESTACIONES = [300, 540, 780];

export const MetroSilueta: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const azul = T.acento2, neon = T.neon ?? T.acento;
  const edificios = useMemo(() => Array.from({ length: NE }, (_, i) => {
    const x = X_INI + i * PASO_E;
    const cerca = Math.max(...ESTACIONES.map((ex) => Math.exp(-Math.pow((x + ANCHO_E / 2 - ex) / 85, 2))));
    return { i, x, antes: 26 + azar(i * 3.1 + 1) * 70, despues: 34 + azar(i * 5.3 + 2) * 60 + cerca * (200 + azar(i * 7.9 + 3) * 170), cerca };
  }), []);
  const xB = 120 + 840 * clamp((t - a(TP.silueta.barrido)) / a(TP.silueta.barridoDur));
  const etiquetas = [
    { x: 300, y: 790, l: "torres", d: 0.2 },
    { x: 540, y: 720, l: "comercio formal", d: 0.45 },
    { x: 780, y: 800, l: "inversión privada", d: 0.7 },
  ];
  const sPin = clamp((t - a(0.5)) / 0.5);
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id="despues"><rect x={0} y={400} width={xB} height={1100} /></clipPath>
          <clipPath id="antes"><rect x={xB} y={400} width={1100} height={1100} /></clipPath>
          <linearGradient id="luz" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={neon} stopOpacity="0" /><stop offset="1" stopColor={neon} stopOpacity="0.35" /></linearGradient>
        </defs>
        <line x1={110} x2={970} y1={SUELO} y2={SUELO} stroke={T.suave} strokeWidth={3} />
        {/* ANTES: lotes bajos y grises */}
        <g clipPath="url(#antes)">
          {edificios.map((b) => <rect key={b.i} x={b.x} y={SUELO - b.antes} width={ANCHO_E} height={b.antes} fill={mezclar(T.suave, T.bg0, 0.55)} stroke={T.suave} strokeOpacity={0.5} strokeWidth={2} />)}
        </g>
        {/* DESPUÉS: torres con ventanas encendidas */}
        <g clipPath="url(#despues)">
          {edificios.map((b) => {
            const alto = lerp(b.antes, b.despues, 1);
            const filas = Math.floor(alto / 17);
            return (
              <g key={b.i}>
                <rect x={b.x} y={SUELO - alto} width={ANCHO_E} height={alto} fill={mezclar(azul, T.bg0, 0.45 - b.cerca * 0.25)} stroke={mezclar(azul, "#FFFFFF", 0.35)} strokeOpacity={0.7} strokeWidth={2} />
                {Array.from({ length: filas }, (_, r) => [0, 1].map((cc) => {
                  const enc = azar(b.i * 17 + r * 3 + cc) > 0.35;
                  const brillo = clamp((t - a(TP.silueta.barrido + 0.4) - r * 0.015) / 0.3);
                  return enc ? <rect key={`${r}-${cc}`} x={b.x + 5 + cc * 13} y={SUELO - alto + 8 + r * 17} width={8} height={9} fill={neon} opacity={0.85 * brillo} /> : null;
                }))}
              </g>
            );
          })}
        </g>
        {/* viaducto con sus estaciones */}
        <g opacity={clamp((t - a(0.3)) / 0.5)}>
          <rect x={110} y={VIA - 7} width={860} height={14} rx={6} fill={azul} />
          {Array.from({ length: 9 }, (_, k) => <rect key={k} x={140 + k * 100} y={VIA + 7} width={12} height={SUELO - VIA - 7} fill={azul} opacity={0.55} />)}
        </g>
        {ESTACIONES.map((ex) => (
          <g key={ex} transform={`translate(${ex} ${VIA - 22}) scale(${Math.max(0.0001, sPin)})`}>
            <circle r={17} fill={azul} stroke="#FFFFFF" strokeWidth={4} />
            <circle r={6} fill="#FFFFFF" />
          </g>
        ))}
        {/* barra de luz que recorre la ciudad */}
        {t >= a(TP.silueta.barrido) && xB < 960 && (
          <g>
            <rect x={xB - 90} y={430} width={90} height={SUELO - 430} fill="url(#luz)" />
            <line x1={xB} x2={xB} y1={430} y2={SUELO} stroke={neon} strokeWidth={5} />
          </g>
        )}
      </svg>
      <Cabecera e={e} maxPx={90} yTitulo={415} />
      {etiquetas.map((q) => (
        <Etiqueta key={q.l} texto={q.l} x={q.x} y={q.y} px={26} ancho={250} mono color={neon} peso={700} mayus={false} delay={TP.silueta.barrido + TP.silueta.barridoDur * q.d + 0.5} id="silueta-etiqueta" />
      ))}
      <Etiqueta texto="antes" x={X_INI} y={1420} px={30} ancho={200} alinear="left" mono color={T.suave} peso={700} mayus={false} delay={0.6} id="silueta-antes" />
      <Etiqueta texto="después" x={930} y={1420} px={30} ancho={200} alinear="right" mono color={neon} peso={700} mayus={false} delay={0.8} id="silueta-despues" />
      <Etiqueta texto="donde había estancamiento, hoy hay altura" x={W / 2} y={1510} px={28} ancho={840} mono color={T.texto} peso={400} mayus={false} delay={TP.silueta.barrido + TP.silueta.barridoDur - 0.6} id="silueta-nota" />
    </AbsoluteFill>
  );
};

/* ───────────── metro-balanza ───────────── */

export const MetroBalanza: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const azul = T.acento2, rojo = T.acento, neon = T.neon ?? T.acento;
  const k = easeInOut((t - a(TP.balanza.ini)) / a(TP.balanza.dur));
  const BASE = 1190, ALTO0 = 540, ALTO1 = 230;
  const alto = lerp(ALTO0, ALTO1, k);
  const top = BASE - alto;
  const SX = 330;
  const bobinas = 11;
  const resorte = Array.from({ length: bobinas * 2 + 1 }, (_, i) => `${SX + (i % 2 ? 62 : -62) * (i === 0 || i === bobinas * 2 ? 0 : 1)},${top + 22 + ((alto - 44) * i) / (bobinas * 2)}`).join(" ");
  const lado = lerp(250, 250 * Math.sqrt(1.35), k);
  const QX = 735, QY = 900;
  const minutos = Math.round(lerp(63, 27, k));
  const sFin = spr(f, a(TP.balanza.ini + TP.balanza.dur), { damping: 9, stiffness: 190, mass: 0.7 });
  const particulas = Array.from({ length: 14 }, (_, i) => {
    const u = ((t * 0.55 + i / 14) % 1);
    const x = lerp(SX + 70, QX - lado / 2 - 10, u);
    const y = lerp(top + 40, QY, u) - Math.sin(u * Math.PI) * 140;
    return { x, y, o: Math.sin(u * Math.PI) * clamp(k * 4) };
  });
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* resorte: el tiempo */}
        <g opacity={clamp((t - a(0.3)) / 0.4)}>
          <rect x={SX - 100} y={BASE} width={200} height={16} rx={6} fill={T.suave} opacity={0.7} />
          <polyline points={resorte} fill="none" stroke={rojo} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
          <rect x={SX - 100} y={top} width={200} height={16} rx={6} fill={mezclar(rojo, "#FFFFFF", 0.2)} />
        </g>
        {/* el metro cuadrado que se estira: el valor */}
        <g opacity={clamp((t - a(0.5)) / 0.4)}>
          <rect x={QX - lado / 2} y={QY - lado / 2} width={lado} height={lado} fill={mezclar(azul, T.bg0, 0.55 - 0.35 * k)} stroke={azul} strokeWidth={5} />
          {Array.from({ length: 5 }, (_, i) => <line key={`v${i}`} x1={QX - lado / 2 + ((i + 1) * lado) / 6} x2={QX - lado / 2 + ((i + 1) * lado) / 6} y1={QY - lado / 2} y2={QY + lado / 2} stroke={azul} strokeOpacity={0.55} strokeWidth={2} />)}
          {Array.from({ length: 5 }, (_, i) => <line key={`h${i}`} y1={QY - lado / 2 + ((i + 1) * lado) / 6} y2={QY - lado / 2 + ((i + 1) * lado) / 6} x1={QX - lado / 2} x2={QX + lado / 2} stroke={azul} strokeOpacity={0.55} strokeWidth={2} />)}
        </g>
        {particulas.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={7} fill={neon} opacity={p.o * 0.9} />)}
      </svg>
      <Cabecera e={e} maxPx={84} yTitulo={415} />
      <div data-texto="balanza-min" style={{ position: "absolute", left: SX - 130, top: BASE + 80, width: 260, textAlign: "center", transform: "translateY(-50%)", fontFamily: MONO, fontWeight: 700, fontSize: 64, color: rojo, whiteSpace: "nowrap" }}>{minutos}<span style={{ fontSize: 28, color: T.suave, marginLeft: 8 }}>min</span></div>
      <Etiqueta texto="el tiempo se comprime" x={SX} y={BASE + 150} px={26} ancho={330} mono color={T.suave} peso={400} mayus={false} delay={0.6} id="balanza-tiempo" />
      <Etiqueta texto="1 m²" x={QX} y={QY - lado / 2 + 32} px={30} ancho={200} mono color="#FFFFFF" peso={700} mayus={false} delay={0.8} id="balanza-m2" />
      <div data-texto="balanza-valor" style={{ position: "absolute", left: QX - 160, top: QY + 205, width: 320, textAlign: "center", transform: "translateY(-50%)", fontFamily: FUENTE, fontWeight: 900, fontSize: 80, letterSpacing: "-0.03em", color: mezclar(azul, "#FFFFFF", 0.3), whiteSpace: "nowrap", lineHeight: 1 }}>{`+${Math.round(35 * k)} %`}</div>
      <Etiqueta texto="el suelo se multiplica" x={QX} y={QY + 290} px={26} ancho={340} mono color={T.suave} peso={400} mayus={false} delay={0.9} id="balanza-valor-etq" />
      <div data-texto="balanza-sello" style={{ position: "absolute", left: 120, top: 1500, width: 840, textAlign: "center", transform: `translateY(-50%) scale(${lerp(2, 1, clamp(sFin))})`, opacity: clamp(sFin * 3), fontFamily: FUENTE, fontWeight: 900, fontSize: 66, letterSpacing: "-0.02em", lineHeight: 1.05, color: T.texto, whiteSpace: "nowrap" }}>MÁS TIEMPO, MÁS SUELO</div>
    </AbsoluteFill>
  );
};
