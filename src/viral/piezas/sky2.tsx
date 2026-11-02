/**
 * «Así se construye una piscina a 35 m» (IMNOBA · figuras realistas) · escenas 2/2
 *   sky-izado    paso 3: una grúa móvil sube toda la estructura (≈ 50 t) hasta los 35 m con un margen de ≈ 30 cm
 *   sky-apoyos   paso 4: los edificios se mueven distinto (ilustración exagerada) y la piscina descansa sobre apoyos que deslizan y giran
 *   sky-llenado  cierre: se llena de 0 a 150 t y alguien nada sobre el vacío
 */
import React from "react";
import { SKY, TSK, dilatacionMm } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Estudio, FONT, Frases, MONOF, RE, Torre } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { Apoyo, Grua, Piscina, SK, puntaGrua } from "./sky-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── sky-izado ───────────── */

export const SkyIzado: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TSK.izado;
  const ESC = 18, PISO = 1330;
  const xi = 405, xd = 675; // caras de los edificios (hueco de 15 m)
  const largo = SKY.longitudM * ESC;
  const alto = 3.4 * ESC;
  const sGrua = spr(f, a(T.grua), { damping: 17, stiffness: 110, mass: 0.9 });
  const sube = easeInOut((t - a(T.eleva)) / a(T.elevaDur));
  const asienta = easeInOut((t - a(T.asienta)) / a(0.35));
  const yReposo = PISO - 6, yMeta = PISO - SKY.alturaM * ESC;
  const yFondo = lerp(yReposo, yMeta - 1 * ESC, sube) + asienta * ESC; // se detiene 1 m antes y baja a su apoyo
  const balanceo = t < a(T.asienta) ? Math.sin(t * 2.4) * 16 * (1 - sube * 0.85) * clamp((t - a(T.eleva)) / 0.6) + Math.sin(t * 7) * 3 * (1 - asienta) * sube : 0;
  const xc = 540 + balanceo;
  const x0 = xc - largo / 2, x1 = xc + largo / 2;
  const yTope = yFondo - alto;
  // la punta de la pluma queda siempre sobre el centro de la estructura (x = 540, y = 466)
  const CX = 205, SG = 0.85;
  const rx = 540 - (CX + 60 * SG), ry = PISO - 150 * SG - 466;
  const ANG = (Math.atan2(ry, rx) * 180) / Math.PI, LP = Math.hypot(rx, ry) / SG;
  const [px, py] = puntaGrua(CX, PISO, SG, ANG, LP);
  const yGancho = yTope - 82;
  const alturaM = Math.max(0, (PISO - yFondo) / ESC);
  const margen = easeOut((t - a(T.margen)) / a(0.6));
  const llega = clamp((t - a(T.llega)) / a(0.3));
  // detalle del apoyo: el extremo de la estructura entra entre dos topes de acero con ≈ 30 cm de holgura
  const IX = 730, IY = 850, IW = 300, IH = 260;
  const oscila = t < a(T.asienta) ? 26 * Math.sin((t - a(T.margen)) * 3.1) * Math.exp(-(t - a(T.margen)) * 0.55) : 0;
  const yBajada = lerp(-34, 0, asienta);
  return (
    <Estudio piso={PISO} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Torre x={xi - 210} y={PISO} w={420} h={40 * ESC} semilla={4} luz={0.5} tono="#3A6FA0" lado={0.06} />
        <Torre x={xd + 210} y={PISO} w={420} h={40 * ESC} semilla={9} luz={0.42} tono="#2F5F8A" lado={0.06} />
        <g opacity={clamp(sGrua * 2)} transform={`translate(${(1 - sGrua) * -80} 0)`}><Grua x={CX} y={PISO} s={SG} ang={ANG} largo={LP} /></g>
        {/* cables: de la punta de la pluma al gancho y de ahí a la estructura */}
        <line x1={px} y1={py} x2={xc} y2={yGancho} stroke="#D7E3EE" strokeWidth={4} />
        <line x1={xc} y1={yGancho} x2={x0 + 70} y2={yTope} stroke="#D7E3EE" strokeWidth={3} />
        <line x1={xc} y1={yGancho} x2={x1 - 70} y2={yTope} stroke="#D7E3EE" strokeWidth={3} />
        <rect x={xc - 16} y={yGancho - 6} width={32} height={40} rx={6} fill={SK.amarillo} stroke="#7A5600" strokeWidth={2} />
        <Piscina x0={x0} x1={x1} yFondo={yFondo} alto={alto} fondo={14} pared={9} nivel={0} t={t} />
        {/* repisas de apoyo en los edificios */}
        <rect x={xi - 120} y={yMeta + 0} width={120} height={9} fill={RE.oro} opacity={0.85} />
        <rect x={xd} y={yMeta + 0} width={120} height={9} fill={RE.oro} opacity={0.85} />
        {/* detalle: holgura de ≈ 30 cm */}
        {margen > 0.01 && (
          <g opacity={clamp(margen * 1.6)} transform={`translate(${IX} ${IY + (1 - margen) * 30})`}>
            <rect x={0} y={0} width={IW} height={IH} rx={22} fill="#050A12" fillOpacity={0.9} stroke={RE.oro} strokeWidth={3} />
            <rect x={36} y={40} width={16} height={176} fill="#8FA2B5" stroke="#2A323B" strokeWidth={2} /><rect x={248} y={40} width={16} height={176} fill="#8FA2B5" stroke="#2A323B" strokeWidth={2} />
            <rect x={36} y={216} width={228} height={14} fill={RE.oro} opacity={0.85} />
            <g transform={`translate(${oscila} ${yBajada})`}>
              <rect x={85} y={150} width={130} height={66} rx={4} fill={SK.acrilico} fillOpacity={0.3} stroke={SK.borde} strokeWidth={3} />
              <rect x={85} y={150} width={130} height={66} rx={4} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={1.5} />
            </g>
            <g opacity={llega}>
              <line x1={52} y1={120} x2={85 + oscila * 0} y2={120} stroke={RE.oro} strokeWidth={4} /><line x1={52} y1={108} x2={52} y2={132} stroke={RE.oro} strokeWidth={4} /><line x1={85} y1={108} x2={85} y2={132} stroke={RE.oro} strokeWidth={4} />
            </g>
          </g>
        )}
        {margen > 0.2 && <line x1={x1} y1={yTope + alto * 0.5} x2={IX + 60} y2={IY + 60} stroke={RE.oro} strokeOpacity={0.6} strokeWidth={2.5} strokeDasharray="8 8" />}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "paso 3:\nla grúa", px: 86 }, { t: T.eleva + 0.5, texto: "≈ 50 t\nen el aire", color: RE.oro, px: 78 }, { t: T.margen, texto: "margen de error:\n≈ 30 cm", color: RE.oro, px: 62 }]} y={352} ancho={800} />
      {margen > 0.4 && <Chip texto={`margen ≈ ${SKY.margenCm} cm`} x={IX + IW / 2 - 10} y={IY + IH + 38} color={RE.oro} id="sky-margen" ancho={300} opacidad={clamp((margen - 0.4) * 2)} />}
      <Dato valor={Math.min(alturaM, SKY.alturaM)} x={W / 2} y={1450} px={130} digitos={2} sufijo=" m" etiqueta="de altura" etiquetaY={1535} id="sky-alt" opacidad={clamp((t - a(T.eleva)) / 0.4)} />
      <Fuente texto="Izado con grúa móvil de la estructura completa: Ballymore, Ainscough · margen ≈ 30 cm: prensa del izado" delay={1} />
    </Estudio>
  );
};

/* ───────────── sky-apoyos ───────────── */

export const SkyApoyos: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TSK.apoyos;
  const uid = useUid();
  const sT = spr(f, a(T.torres), { damping: 17, stiffness: 110, mass: 0.9 });
  const ramp = easeOut((t - a(T.vaiven)) / a(0.9));
  const fase = Math.sin(((t - a(T.vaiven)) / a(2.4)) * 2 * Math.PI);
  const THETA = 2.6; // grados, exagerado a propósito
  const thL = THETA * ramp * fase, thR = -THETA * ramp * fase;
  const BASE = 1520, HT = 1000;
  const dxLedge = (BASE - 630) * Math.sin((thL * Math.PI) / 180); // desplazamiento de la repisa izquierda
  const apoyoOn = easeOut((t - a(T.apoyo)) / a(0.6));
  const desliza = clamp((t - a(T.desliza)) / a(0.5));
  const gira = easeOut((t - a(T.gira)) / a(0.6));
  const desp = -dxLedge * 1.5 * (gira > 0 ? 0.45 : 1);
  const giro = 3.4 * gira * Math.sin(((t - a(T.gira)) / a(1.6)) * 2 * Math.PI);
  const dil = dilatacionMm(SKY.longitudM, SKY.dT);
  const etq = t >= a(T.gira) ? "apoyo giratorio: absorbe el giro" : "apoyo deslizante: acompaña el vaivén";
  return (
    <Estudio piso={1580} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id={`${uid}cp`}><rect x={0} y={430} width={W} height={470} /></clipPath>
          <linearGradient id={`${uid}fd`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0C1B2D" stopOpacity="0" /><stop offset="1" stopColor="#0A1626" stopOpacity="1" /></linearGradient>
        </defs>
        <g clipPath={`url(#${uid}cp)`} opacity={clamp(sT * 2)}>
          <g transform={`rotate(${thL} 195 ${BASE})`}>
            <Torre x={195} y={BASE} w={360} h={HT} semilla={4} luz={0.5} tono="#3A6FA0" lado={0.05} />
            <rect x={215} y={630} width={160} height={14} fill={RE.oro} opacity={0.9} />
          </g>
          <g transform={`rotate(${thR} 885 ${BASE})`}>
            <Torre x={885} y={BASE} w={360} h={HT} semilla={9} luz={0.42} tono="#2F5F8A" lado={0.05} />
            <rect x={705} y={630} width={160} height={14} fill={RE.oro} opacity={0.9} />
          </g>
          <Piscina x0={265} x1={815} yFondo={630} alto={70} fondo={8} pared={4} nivel={1} t={t} />
          <rect x={0} y={800} width={W} height={100} fill={`url(#${uid}fd)`} />
        </g>
        {/* aro que señala el apoyo izquierdo */}
        {apoyoOn > 0.01 && <circle cx={265} cy={638} r={44 + 6 * Math.sin(t * 5)} fill="none" stroke={RE.oro} strokeWidth={3.5} strokeOpacity={0.9 * apoyoOn} strokeDasharray="10 8" />}
        {apoyoOn > 0.01 && <polyline points="265,684 265,760 540,760 540,930" fill="none" stroke={RE.oro} strokeOpacity={0.5 * apoyoOn} strokeWidth={2.5} strokeDasharray="8 8" />}
        {/* detalle del apoyo en corte */}
        <g opacity={apoyoOn} transform={`translate(0 ${(1 - apoyoOn) * 60})`}>
          <Apoyo x={540} y={1310} s={0.92} desp={desp * 0.92} giro={giro} marca={apoyoOn} />
        </g>
        {desliza > 0.01 && Math.abs(desp) > 6 && (
          <g opacity={desliza * 0.9} fill={RE.oro}>
            {desp > 0 ? <polygon points={`${540 + desp * 0.92 + 150},1250 ${540 + desp * 0.92 + 120},1236 ${540 + desp * 0.92 + 120},1264`} /> : <polygon points={`${540 + desp * 0.92 - 150},1250 ${540 + desp * 0.92 - 120},1236 ${540 + desp * 0.92 - 120},1264`} />}
          </g>
        )}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "paso 4:\napoyos móviles", px: 80 }, { t: T.gira - 0.3, texto: "deslizan\ny giran", color: RE.oro, px: 80 }]} y={352} ancho={800} />
      <Chip texto="los edificios se mueven distinto" x={W / 2} y={872} color={RE.hielo} id="sky-mueven" ancho={640} opacidad={clamp((t - a(T.vaiven + 0.2)) / 0.4)} />
      <Chip texto={etq} x={W / 2} y={1478} color={RE.oro} id="sky-apoyo" ancho={760} opacidad={clamp((t - a(T.desliza)) / 0.4)} />
      <Chip texto={`+${SKY.dT} °C ≈ ${dil.toFixed(0)} mm más de acrílico en ${SKY.longitudM} m`} x={W / 2} y={1550} color={RE.hielo} id="sky-dilata" ancho={860} opacidad={clamp((t - a(T.dilata)) / 0.4)} />
      <Fuente texto="Apoyos de puente deslizantes y giratorios: Ballymore · movimientos exagerados (ilustración) · dilatación = α·L·ΔT (cálculo propio)" delay={1} />
    </Estudio>
  );
};

/* ───────────── sky-llenado ───────────── */

export const SkyLlenado: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TSK.llenado;
  const sP = spr(f, a(T.piscina), { damping: 16, stiffness: 115, mass: 0.85 });
  const nivel = easeInOut((t - a(T.sube)) / a(T.subeDur));
  const ton = SKY.aguaTon * nivel;
  const nada = clamp((t - a(T.nada)) / a(0.5));
  const sx = lerp(300, 790, clamp((t - a(T.nada)) / Math.max(0.5, a(1.9))));
  const PISO = 1520;
  const X0 = 130, X1 = 950, YF = 980, ALTO = 300, FONDO = 40, PARED = 22;
  const brazo = (ph: number): { x: number; y: number } => ({ x: 34 + Math.cos(t * 5.4 + ph) * 62, y: -4 + Math.sin(t * 5.4 + ph) * 62 });
  const a1 = brazo(0), a2 = brazo(Math.PI);
  return (
    <Estudio piso={PISO} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Torre x={-30} y={PISO} w={360} h={1000} semilla={4} luz={0.5} tono="#3A6FA0" lado={0.05} />
        <Torre x={1110} y={PISO} w={360} h={1000} semilla={9} luz={0.42} tono="#2F5F8A" lado={0.05} />
        <g opacity={clamp(sP * 2)} transform={`translate(0 ${(1 - sP) * -40})`}>
          {/* apoyos bajo los extremos */}
          {[X0 - 10, X1 - 150].map((bx, i) => <g key={i}><rect x={bx} y={YF} width={160} height={26} fill="#4C5762" stroke="#222B34" strokeWidth={2} /><rect x={bx + 10} y={YF + 2} width={140} height={5} rx={2} fill="#EAF4FA" /></g>)}
          <Piscina x0={X0} x1={X1} yFondo={YF} alto={ALTO} fondo={FONDO} pared={PARED} nivel={nivel} t={t} />
          {nivel > 0.4 && (
            <g transform={`translate(${sx} ${820 + Math.sin(t * 3) * 5})`} opacity={nada}>
              <ellipse cx={0} cy={0} rx={64} ry={14} fill="#0B2A44" stroke={RE.hielo} strokeWidth={2.4} />
              <circle cx={74} cy={-4} r={14} fill="#0B2A44" stroke={RE.hielo} strokeWidth={2.4} />
              <line x1={34} y1={-4} x2={a1.x} y2={a1.y} stroke={RE.hielo} strokeWidth={10} strokeLinecap="round" />
              <line x1={34} y1={-4} x2={a2.x} y2={a2.y} stroke="#7FA9D0" strokeWidth={10} strokeLinecap="round" />
              <line x1={-60} y1={2} x2={-100} y2={2 + Math.sin(t * 11) * 12} stroke={RE.hielo} strokeWidth={8} strokeLinecap="round" />
              <line x1={-60} y1={2} x2={-100} y2={2 - Math.sin(t * 11) * 12} stroke="#7FA9D0" strokeWidth={8} strokeLinecap="round" />
            </g>
          )}
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "recién ahora\nse llena", px: 80 }, { t: T.nada, texto: "¿te animarías?", color: RE.oro, px: 92 }]} y={352} ancho={800} />
      <Dato valor={ton} x={W / 2} y={1235} px={170} digitos={3} sufijo=" t" etiqueta="de agua sobre el vacío" etiquetaY={1348} id="sky-llena" opacidad={clamp((t - a(T.grifo)) / 0.4)} />
      <Chip texto="esquema: altura exagerada" x={W / 2} y={1500} color={RE.hielo} id="sky-esq" ancho={520} opacidad={clamp((t - a(T.pregunta)) / 0.4) * 0.8} />
      <Fuente texto="≈ 150 t de agua (≈ 148 m³): IStructE · Sky Pool, Embassy Gardens (Londres) · el llenado es una ilustración" delay={1} />
    </Estudio>
  );
};
