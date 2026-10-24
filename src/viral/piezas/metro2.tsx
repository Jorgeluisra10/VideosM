/**
 * Piloto «Metro de Bogotá» · escenas a medida 2/4 (acto 2: cambia la ecuación física)
 *   metro-carrera    los mismos 24 km recorridos a la vez por el tren elevado (azul) y por el bus de superficie (rojo), con reloj
 *   metro-capacidad  72.000 pasajeros por hora y sentido: un flujo de personas cruza la estación y enciende ≈ 25 carriles de carros
 */
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { METRO_DATOS, TP, tTrenLlega } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { Etiqueta, FUENTE, H, LineaCap, MONO, W, clamp, easeInOut, easeOut, fmtNum, lerp, mezclar, oscurecer, spr, useReloj, useViral } from "../comun";
import { Cabecera } from "./metro1";

type P = { e: EscenaViralGuardada };

/* ───────────── metro-carrera ───────────── */

export const MetroCarrera: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const azul = T.acento2, rojo = T.acento, neon = T.neon ?? T.acento;
  const X0 = 120, ANCHO = 840;
  const tau = TP.carrera.minTotal * clamp((t - a(TP.carrera.ini)) / a(TP.carrera.dur));
  const enCarrera = t >= a(TP.carrera.ini);
  const xTren = X0 + ANCHO * Math.min(1, tau / METRO_DATOS.minMetro);
  const xBase = X0 + ANCHO * (tau / 60 * METRO_DATOS.velSuperficie) / METRO_DATOS.kmLinea;
  const xBus = xBase + (enCarrera ? Math.sin(tau * 2.1) * 7 : 0);
  const llega = t >= a(tTrenLlega());
  const sLlega = spr(f, a(tTrenLlega()), { damping: 9, stiffness: 200, mass: 0.6 });
  const pasa1h = tau >= 60;
  const sH = spr(f, a(TP.carrera.ini + TP.carrera.dur * 60 / TP.carrera.minTotal), { damping: 10, stiffness: 190, mass: 0.6 });
  const ENTRA = clamp(t / 0.5);
  const VIA = 735, SUELO = 1050;
  const semaforos = Array.from({ length: 9 }, (_, k) => ({ x: X0 + 84 * (k + 1), rojo: ((t + k * 0.9) % 4.2) < 2.3 }));
  const min = Math.floor(tau);
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={ENTRA}>
          {/* viaducto: pilares, vía y estaciones */}
          {Array.from({ length: 9 }, (_, k) => <rect key={k} x={X0 + 40 + k * 100} y={VIA + 12} width={14} height={SUELO - 60 - VIA} fill={T.suave} opacity={0.5} />)}
          <rect x={X0 - 6} y={VIA - 8} width={ANCHO + 12} height={16} rx={6} fill={azul} opacity={0.35} />
          <line x1={X0} x2={X0 + ANCHO} y1={VIA} y2={VIA} stroke={azul} strokeWidth={6} />
          {Array.from({ length: 16 }, (_, k) => <circle key={k} cx={X0 + (ANCHO * (k + 0.5)) / 16} cy={VIA - 18} r={5} fill={azul} opacity={0.8} />)}
          {/* calle de superficie con bocacalles y semáforos */}
          <rect x={X0 - 6} y={SUELO - 50} width={ANCHO + 12} height={100} rx={8} fill="rgba(255,255,255,0.05)" stroke={T.suave} strokeOpacity={0.4} strokeWidth={2.5} />
          {Array.from({ length: 24 }, (_, k) => <rect key={k} x={X0 + 6 + k * 35} y={SUELO - 3} width={18} height={5} fill={T.suave} opacity={0.45} />)}
          {semaforos.map((s, k) => (
            <g key={k}>
              <rect x={s.x - 13} y={SUELO - 70} width={26} height={140} fill="rgba(255,255,255,0.07)" />
              <circle cx={s.x} cy={SUELO - 84} r={9} fill={s.rojo ? rojo : "#38D97A"} />
            </g>
          ))}
          {/* meta */}
          {Array.from({ length: 10 }, (_, k) => <rect key={k} x={X0 + ANCHO + 6 + (k % 2) * 9} y={VIA - 60 + k * 14} width={9} height={14} fill={k % 2 ? "#FFFFFF" : "#0B0C10"} stroke="#FFFFFF" strokeWidth={0.6} />)}
        </g>
        {/* el tren (azul) en el viaducto */}
        <g transform={`translate(${xTren} ${VIA - 22})`}>
          <rect x={-70} y={-16} width={140} height={32} rx={14} fill={azul} stroke={oscurecer(azul, 0.45)} strokeWidth={3} />
          {[-48, -22, 4, 30].map((dx) => <rect key={dx} x={dx} y={-9} width={18} height={12} rx={3} fill="#FFFFFF" opacity={0.85} />)}
          <rect x={-60} y={-12} width={9} height={5} rx={2.5} fill="#FFFFFF" opacity={0.25} />
        </g>
        {/* el bus (rojo) en la superficie */}
        <g transform={`translate(${xBus} ${SUELO - 22})`}>
          <rect x={-58} y={-17} width={64} height={34} rx={9} fill={rojo} stroke={oscurecer(rojo, 0.5)} strokeWidth={3} />
          <rect x={10} y={-17} width={52} height={34} rx={9} fill={mezclar(rojo, "#000000", 0.12)} stroke={oscurecer(rojo, 0.5)} strokeWidth={3} />
          {[-48, -30, -12].map((dx) => <rect key={dx} x={dx} y={-9} width={12} height={10} rx={2.5} fill="#FFFFFF" opacity={0.7} />)}
        </g>
      </svg>
      <Cabecera e={e} maxPx={90} yTitulo={420} />
      <Etiqueta texto="viaducto · 43 km/h" x={X0} y={VIA - 100} px={30} ancho={500} alinear="left" mono color={azul === T.bg0 ? T.texto : mezclar(azul, "#FFFFFF", 0.3)} peso={700} mayus={false} delay={0.5} id="carrera-via" />
      <Etiqueta texto="superficie · 12 km/h" x={X0} y={SUELO - 126} px={30} ancho={500} alinear="left" mono color={rojo} peso={700} mayus={false} delay={0.7} id="carrera-sup" />
      <Etiqueta texto={`${METRO_DATOS.kmLinea} km`} x={X0 + ANCHO} y={VIA + 110} px={26} ancho={200} alinear="right" mono color={T.suave} peso={400} mayus={false} delay={0.9} id="carrera-km" />
      {/* reloj de la carrera */}
      <div data-texto="carrera-reloj" style={{ position: "absolute", left: 120, top: 1235, width: 840, textAlign: "center", transform: "translateY(-50%)", fontFamily: MONO, fontWeight: 700, fontSize: 112, lineHeight: 1, color: neon, whiteSpace: "nowrap", opacity: clamp((t - a(1.0)) / 0.4) }}>{String(min).padStart(2, "0")}<span style={{ fontSize: 44, marginLeft: 14, color: T.suave }}>min</span></div>
      {llega && (
        <div data-texto="carrera-27" style={{ position: "absolute", left: 120, top: 1420, width: 400, textAlign: "center", transform: `translateY(-50%) scale(${lerp(1.8, 1, clamp(sLlega))})`, opacity: clamp(sLlega * 3), fontFamily: FUENTE, fontWeight: 900, fontSize: 84, letterSpacing: "-0.02em", lineHeight: 1, color: mezclar(azul, "#FFFFFF", 0.25), whiteSpace: "nowrap" }}>27 min</div>
      )}
      {pasa1h && (
        <div data-texto="carrera-1h" style={{ position: "absolute", left: 560, top: 1420, width: 400, textAlign: "center", transform: `translateY(-50%) scale(${lerp(1.8, 1, clamp(sH))})`, opacity: clamp(sH * 3), fontFamily: FUENTE, fontWeight: 900, fontSize: 84, letterSpacing: "-0.02em", lineHeight: 1, color: rojo, whiteSpace: "nowrap" }}>+ 1 h</div>
      )}
      {llega && <Etiqueta texto="el tren ya llegó" x={320} y={1500} px={26} ancho={380} mono color={T.suave} peso={400} mayus={false} delay={tTrenLlega() + 0.3} id="carrera-nota-a" />}
      {pasa1h && <Etiqueta texto="el bus, a mitad de camino" x={760} y={1500} px={26} ancho={380} mono color={T.suave} peso={400} mayus={false} delay={TP.carrera.ini + (TP.carrera.dur * 60) / TP.carrera.minTotal + 0.3} id="carrera-nota-b" />}
    </AbsoluteFill>
  );
};

/* ───────────── metro-capacidad ───────────── */

export const MetroCapacidad: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const azul = T.acento2, rojo = T.acento, neon = T.neon ?? T.acento;
  const k = easeInOut((t - a(TP.capacidad.ini)) / a(TP.capacidad.dur));
  const cuenta = METRO_DATOS.pasajerosHora * k;
  const N = 150;
  const gente = useMemo(() => Array.from({ length: N }, (_, i) => ({ fila: i % 6, off: azar(i * 3.3 + 1), v: 150 + azar(i * 5.1 + 2) * 70, r: 6 + azar(i * 7.7) * 2 })), []);
  const CARR = METRO_DATOS.carrilesEquivalentes;
  const encendidos = Math.floor(CARR * k + 0.001);
  const sFin = spr(f, a(TP.capacidad.lineas), { damping: 10, stiffness: 190, mass: 0.6 });
  const GX = 540;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* la estación (puerta) y el flujo de personas que la cruza */}
        <g opacity={clamp((t - a(0.3)) / 0.5)}>
          <rect x={GX - 9} y={640} width={18} height={250} rx={6} fill={azul} opacity={0.9} />
          <rect x={GX - 28} y={632} width={56} height={14} rx={7} fill={azul} />
          <rect x={GX - 28} y={884} width={56} height={14} rx={7} fill={azul} />
          {[0, 1, 2, 3, 4, 5].map((r) => <line key={r} x1={120} x2={960} y1={676 + r * 38} y2={676 + r * 38} stroke={T.suave} strokeOpacity={0.14} strokeWidth={2} strokeDasharray="4 10" />)}
        </g>
        {gente.map((g, i) => {
          const activa = clamp((t - a(TP.capacidad.ini - 0.2 + (i / N) * 1.6)) / 0.3);
          if (activa <= 0) return null;
          const x = 120 + ((t * g.v + g.off * 840) % 840);
          return <circle key={i} cx={x} cy={676 + g.fila * 38} r={g.r} fill={x > GX ? mezclar(azul, "#FFFFFF", 0.35) : "#FFFFFF"} opacity={0.9 * activa} />;
        })}
        {/* ≈ 25 carriles de carros que se encienden */}
        {Array.from({ length: CARR }, (_, i) => {
          const x = 120 + i * 33.6;
          const lit = i < encendidos;
          return (
            <g key={i} opacity={clamp((t - a(0.8 + i * 0.02)) / 0.3)}>
              <rect x={x} y={1010} width={25} height={230} rx={5} fill={lit ? "rgba(230,57,38,0.16)" : "none"} stroke={lit ? rojo : T.suave} strokeOpacity={lit ? 1 : 0.45} strokeWidth={2.5} />
              {[0, 1, 2].map((c) => <rect key={c} x={x + 5} y={1024 + c * 70} width={15} height={42} rx={4} fill={lit ? rojo : T.suave} opacity={lit ? 0.95 : 0.3} />)}
            </g>
          );
        })}
      </svg>
      {e.cap && <LineaCap texto={e.cap} y={292} px={30} delay={0.1} id="cap-pieza" />}
      <div data-texto="capacidad-cifra" style={{ position: "absolute", left: 120, top: 450, width: 840, textAlign: "center", transform: "translateY(-50%)", fontFamily: FUENTE, fontWeight: 900, fontSize: 168, letterSpacing: "-0.03em", lineHeight: 1, color: neon, whiteSpace: "nowrap", textShadow: T.oscuro ? "0 10px 40px rgba(0,0,0,0.5)" : "none" }}>{fmtNum(cuenta, 0)}</div>
      <Etiqueta texto="pasajeros por hora y por sentido" x={W / 2} y={565} px={34} ancho={820} mono color={T.texto} peso={700} mayus={false} delay={0.5} id="capacidad-unidad" />
      <Etiqueta texto="estación" x={GX} y={612} px={22} ancho={200} mono color={T.suave} peso={400} mayus={false} delay={0.6} id="capacidad-estacion" />
      <Etiqueta texto="equivale a ≈ 25 carriles llenos de carros" x={W / 2} y={960} px={32} ancho={840} mono color={rojo} peso={700} mayus={false} delay={0.9} id="capacidad-eq" />
      <Etiqueta texto="con 1,5 personas por carro · orden de magnitud" x={W / 2} y={1290} px={24} ancho={840} mono color={T.suave} peso={400} mayus={false} delay={TP.capacidad.lineas} id="capacidad-nota" />
      <div data-texto="capacidad-sello" style={{ position: "absolute", left: 120, top: 1430, width: 840, textAlign: "center", transform: `translateY(-50%) scale(${lerp(2, 1, clamp(sFin))})`, opacity: clamp(sFin * 3), fontFamily: FUENTE, fontWeight: 900, fontSize: 80, letterSpacing: "-0.02em", lineHeight: 1, color: T.texto, whiteSpace: "nowrap" }}>UN SOLO TREN</div>
    </AbsoluteFill>
  );
};
