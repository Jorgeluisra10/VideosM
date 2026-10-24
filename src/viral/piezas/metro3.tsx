/**
 * Piloto «Metro de Bogotá» · escenas a medida 3/4 (acto 4: la economía del suelo, en modo papel de estudio analítico)
 *   metro-suelo  isométrico: una manzana de 11×11 bloques cuyo valor sube en una onda que sale de la estación (anillos de 500 y 800 m)
 *   metro-curva  gráfico analítico: nube de puntos, curva ajustada y banda de 500–800 m (valorización vs. distancia a la estación)
 */
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { TP, valorSuelo } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { Etiqueta, FUENTE, H, LineaCap, MONO, W, clamp, easeInOut, easeOut, lerp, mezclar, oscurecer, spr, useReloj, useViral } from "../comun";
import { Cabecera } from "./metro1";

type P = { e: EscenaViralGuardada };

/* ───────────── metro-suelo ───────────── */

const NB = 11, PASO = 44, L_BLOQUE = 36, M_POR_BLOQUE = 220;

export const MetroSuelo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const azul = T.acento2, rojo = T.acento;
  const c = PASO * 0.866, s = PASO * 0.5;
  const CX = 540, CY = 985;
  const bloques = useMemo(() => {
    const L: { i: number; j: number; d: number; v: number }[] = [];
    for (let i = 0; i < NB; i++) for (let j = 0; j < NB; j++) {
      const d = Math.hypot(i - 5, j - 5) * M_POR_BLOQUE;
      L.push({ i, j, d, v: valorSuelo(d) });
    }
    return L.sort((p, q) => p.i + p.j - (q.i + q.j));
  }, []);
  const pos = (i: number, j: number): [number, number] => [CX + (i - j) * c, CY + (i + j - 10) * s];
  const kc = easeOut((t - a(TP.suelo.cifra)) / a(TP.suelo.cifraDur));
  const sPin = spr(f, a(0.5), { damping: 9, stiffness: 190, mass: 0.7 });
  // radios de los anillos en pantalla (elipse isométrica: rx = R·c·√2, ry = R·s·√2 con R en bloques)
  const rx = (m: number): number => (m / M_POR_BLOQUE) * c * Math.SQRT2;
  const ry = (m: number): number => (m / M_POR_BLOQUE) * s * Math.SQRT2;
  const [px, py] = pos(5, 5);
  const onda = (t - a(TP.suelo.onda)) / a(TP.suelo.ondaDur); // 0…1 sobre 0…1.500 m
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* losa del terreno */}
        <polygon points={`${CX},${CY - 10 * s - 34} ${CX + 10 * c + 46},${CY} ${CX},${CY + 10 * s + 34} ${CX - 10 * c - 46},${CY}`} fill="rgba(11,12,16,0.05)" stroke={T.texto} strokeOpacity={0.2} strokeWidth={2} />
        {bloques.map((b) => {
          const [x, yb] = pos(b.i, b.j);
          const lleg = onda * 1500 >= b.d;
          const k = lleg ? easeOut((onda * 1500 - b.d) / 500) : 0;
          const alto = 10 + (b.v / 35) * 175 * Math.min(1.12, k * (1 + 0.12 * Math.sin(k * Math.PI)));
          const calor = clamp(b.v / 35) * clamp(k * 2);
          const base = mezclar("#E4DFD6", azul, calor * 0.85);
          const pt = (px_: number, py_: number): string => `${px_.toFixed(1)},${py_.toFixed(1)}`;
          const cc = (L_BLOQUE / PASO) * c, ss = (L_BLOQUE / PASO) * s;
          const izq = [pt(x - cc, yb - alto), pt(x, yb + ss - alto), pt(x, yb + ss), pt(x - cc, yb)].join(" ");
          const der = [pt(x, yb + ss - alto), pt(x + cc, yb - alto), pt(x + cc, yb), pt(x, yb + ss)].join(" ");
          const sup = [pt(x, yb - ss - alto), pt(x + cc, yb - alto), pt(x, yb + ss - alto), pt(x - cc, yb - alto)].join(" ");
          const es = b.i === 5 && b.j === 5;
          return (
            <g key={`${b.i}-${b.j}`}>
              <polygon points={izq} fill={oscurecer(es ? rojo : base, 0.3)} />
              <polygon points={der} fill={oscurecer(es ? rojo : base, 0.12)} />
              <polygon points={sup} fill={es ? mezclar(rojo, "#FFFFFF", 0.2) : mezclar(base, "#FFFFFF", 0.35)} stroke="rgba(11,12,16,0.18)" strokeWidth={1.2} />
            </g>
          );
        })}
        {/* anillos de 500 y 800 m y la estación */}
        <g opacity={clamp((t - a(0.7)) / 0.5)}>
          <ellipse cx={px} cy={py} rx={rx(500)} ry={ry(500)} fill="none" stroke={rojo} strokeWidth={3.5} strokeDasharray="9 8" />
          <ellipse cx={px} cy={py} rx={rx(800)} ry={ry(800)} fill="none" stroke={T.texto} strokeWidth={3} strokeDasharray="4 10" strokeOpacity={0.7} />
        </g>
        <g opacity={clamp((t - a(0.7)) / 0.5)}>
          <circle cx={134} cy={690} r={9} fill={rojo} stroke="#FFFFFF" strokeWidth={3} />
          <line x1={118} x2={152} y1={742} y2={742} stroke={rojo} strokeWidth={3.5} strokeDasharray="9 6" />
          <line x1={118} x2={152} y1={794} y2={794} stroke={T.texto} strokeWidth={3} strokeDasharray="4 8" strokeOpacity={0.8} />
        </g>
        <g transform={`translate(${px} ${py - 40}) scale(${Math.max(0.0001, sPin)})`}>
          <line x1={0} y1={0} x2={0} y2={-70} stroke={rojo} strokeWidth={6} strokeLinecap="round" />
          <circle cx={0} cy={-84} r={20} fill={rojo} stroke="#FFFFFF" strokeWidth={5} />
          <circle cx={0} cy={-84} r={7} fill="#FFFFFF" />
        </g>
      </svg>
      <Cabecera e={e} maxPx={90} yTitulo={420} />
      <Etiqueta texto="estación" x={176} y={690} px={24} ancho={230} alinear="left" mono color={rojo} peso={700} mayus={false} delay={0.8} id="suelo-estacion" />
      <Etiqueta texto="500 m · +35 %" x={176} y={742} px={24} ancho={230} alinear="left" mono color={rojo} peso={700} mayus={false} delay={TP.suelo.onda + 0.8} id="suelo-r500" />
      <Etiqueta texto="800 m · +20 %" x={176} y={794} px={24} ancho={230} alinear="left" mono color={T.texto} peso={700} mayus={false} delay={TP.suelo.onda + 1.6} id="suelo-r800" />
      <div data-texto="suelo-cifra" style={{ position: "absolute", left: 120, top: 1385, width: 840, textAlign: "center", transform: "translateY(-50%)", fontFamily: FUENTE, fontWeight: 900, fontSize: 150, letterSpacing: "-0.03em", lineHeight: 1, color: azul, whiteSpace: "nowrap", opacity: clamp(kc * 4) }}>{`+${Math.round(35 * kc)} %`}</div>
      <Etiqueta texto="valor del suelo: entre +20 % y +35 % a 500–800 m" x={W / 2} y={1500} px={28} ancho={840} mono color={T.texto} peso={400} mayus={false} delay={TP.suelo.cifra + 1.0} id="suelo-nota" />
      <Etiqueta texto="alturas ilustrativas · cada bloque ≈ 220 m" x={W / 2} y={1570} px={22} ancho={840} mono color={T.suave} peso={400} mayus={false} delay={TP.suelo.cifra + 1.4} id="suelo-escala" />
    </AbsoluteFill>
  );
};

/* ───────────── metro-curva ───────────── */

export const MetroCurva: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const azul = T.acento2, rojo = T.acento;
  const X0 = 200, X1 = 930, Y0 = 600, Y1 = 1180; // eje x: 0…1500 m; eje y: 0…40 %
  const px = (d: number): number => X0 + ((X1 - X0) * d) / 1500;
  const py = (v: number): number => Y1 - ((Y1 - Y0) * v) / 40;
  const pts = useMemo(() => Array.from({ length: 44 }, (_, i) => {
    const d = 40 + azar(i * 3.7 + 1) * 1420;
    return { d, v: Math.max(0, valorSuelo(d) + (azar(i * 5.9 + 2) - 0.5) * 9 * (0.4 + (valorSuelo(d) / 35) * 0.9)) };
  }), []);
  const curva = useMemo(() => Array.from({ length: 76 }, (_, k) => { const d = (k / 75) * 1500; return `${px(d).toFixed(1)},${py(valorSuelo(d)).toFixed(1)}`; }).join(" "), []);
  const kc = easeInOut((t - a(TP.curva.curva)) / a(TP.curva.curvaDur));
  const sBanda = clamp((t - a(1.0)) / 0.6);
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id="banda" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="12" stroke={azul} strokeWidth="3" opacity="0.55" /></pattern>
        </defs>
        {/* rejilla y ejes */}
        {[0, 10, 20, 30, 40].map((v) => <line key={v} x1={X0} x2={X1} y1={py(v)} y2={py(v)} stroke={T.texto} strokeOpacity={0.12} strokeWidth={2} />)}
        <rect x={px(500)} y={Y0} width={px(800) - px(500)} height={Y1 - Y0} fill="url(#banda)" opacity={sBanda} />
        <line x1={px(500)} x2={px(500)} y1={Y0} y2={Y1} stroke={azul} strokeWidth={2.5} strokeDasharray="6 7" opacity={sBanda} />
        <line x1={px(800)} x2={px(800)} y1={Y0} y2={Y1} stroke={azul} strokeWidth={2.5} strokeDasharray="6 7" opacity={sBanda} />
        <path d={`M ${X0} ${Y0 - 14} L ${X0} ${Y1} L ${X1 + 14} ${Y1}`} fill="none" stroke={T.texto} strokeWidth={4} />
        {[0, 250, 500, 800, 1100, 1500].map((d) => <line key={d} x1={px(d)} x2={px(d)} y1={Y1} y2={Y1 + 14} stroke={T.texto} strokeWidth={3} />)}
        {/* nube de puntos (los casos) y la curva ajustada */}
        {pts.map((p, i) => <circle key={i} cx={px(p.d)} cy={py(p.v)} r={7} fill={T.texto} opacity={0.75 * clamp((t - a(TP.curva.puntos + (i / pts.length) * TP.curva.puntosDur)) / 0.25)} />)}
        <polyline points={curva} fill="none" stroke={rojo} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - kc} />
        {kc > 0.4 && <circle cx={px(500)} cy={py(35)} r={11} fill={rojo} stroke="#FFFFFF" strokeWidth={4} />}
        {kc > 0.62 && <circle cx={px(800)} cy={py(20)} r={11} fill={rojo} stroke="#FFFFFF" strokeWidth={4} />}
      </svg>
      <Cabecera e={e} maxPx={96} yTitulo={420} />
      {[0, 10, 20, 35].map((v) => <Etiqueta key={v} texto={`${v} %`} x={X0 - 16} y={py(v)} px={24} ancho={110} alinear="right" mono color={T.suave} peso={400} mayus={false} delay={0.5} id="curva-y" />)}
      {[0, 500, 800, 1500].map((d) => <Etiqueta key={d} texto={`${d}`} x={px(d)} y={Y1 + 44} px={24} ancho={110} mono color={T.suave} peso={400} mayus={false} delay={0.6} id="curva-x" />)}
      <Etiqueta texto="valorización del suelo" x={X0} y={Y0 - 52} px={24} ancho={420} alinear="left" mono color={T.texto} peso={700} mayus={false} delay={0.5} id="curva-ytitulo" />
      <Etiqueta texto="distancia a la estación (m)" x={X1} y={Y1 + 96} px={24} ancho={420} alinear="right" mono color={T.texto} peso={700} mayus={false} delay={0.6} id="curva-xtitulo" />
      <Etiqueta texto="500–800 m" x={(px(500) + px(800)) / 2} y={Y1 - 30} px={24} ancho={190} mono color={azul} peso={700} mayus={false} delay={1.0} id="curva-banda" />
      <Etiqueta texto="+35 %" x={px(500) + 70} y={py(35) - 38} px={34} ancho={160} mono color={rojo} peso={700} mayus={false} delay={TP.curva.curva + 0.9} id="curva-35" />
      <Etiqueta texto="+20 %" x={px(800) + 70} y={py(20) - 38} px={34} ancho={160} mono color={rojo} peso={700} mayus={false} delay={TP.curva.curva + 1.5} id="curva-20" />
      <LineaCap texto="la accesibilidad dispara la *demanda*" y={1440} px={30} delay={TP.curva.curva + TP.curva.curvaDur + 0.2} id="curva-linea" />
      <Etiqueta texto="puntos ilustrativos · rango de 20 a 35 % según los estudios citados" x={W / 2} y={1520} px={22} ancho={860} mono color={T.suave} peso={400} mayus={false} delay={TP.curva.curva + TP.curva.curvaDur + 0.6} id="curva-nota" />
    </AbsoluteFill>
  );
};
