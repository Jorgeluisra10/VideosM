/**
 * «Puentes colgantes» (SINAPSIS · física estructural) · escenas 1/2
 *   pte-gancho    el puente en alzado: la gravedad baja por los tirantes, pero los cables TIRAN hacia las orillas
 *   pte-parabola  cable en halftone con tres potenciómetros (1 · peso, 2 · flecha, 3 · tensión horizontal H = w·L²/(8·f)); H es el resultado de los otros dos
 *   pte-duelo     Rayos X alámbrico: el tirón de los cables (rojo) se vuelve compresión en la torre (azul) y los anclajes resisten
 */
import React from "react";
import { PTE, TPTE } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, LineaCap, MONO, W, clamp, easeInOut, easeOut, lerp, useReloj } from "../comun";
import { AN, Knob, Lienzo } from "./anom-ui";
import { Nota, Pie, Texto } from "./dig-kit";
import { CajaAlambre, Flecha, PT, TuboHalftone, puntosParabola, suave, yParabola } from "./pte-kit";
import { Frases } from "./real-kit";

type P = { e: EscenaViralGuardada };

const Cap: React.FC<{ e: EscenaViralGuardada }> = ({ e }) => (e.cap ? <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={AN.papel} /> : null);

/* ───────────── pte-gancho ───────────── */

const TA = 300, TB = 780, TOP = 700, DECK = 1090, BASE = 1260;

export const PteGancho: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const G = TPTE.gancho;
  const puente = easeOut((t - a(G.puente)) / a(0.9));
  const grav = easeOut((t - a(G.gravedad)) / a(0.7));
  const vect = easeOut((t - a(G.vectores)) / a(0.8));
  const cable = puntosParabola(TA, TB, TOP, 330, 80);
  const dCable = cable.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const hangers = Array.from({ length: 11 }, (_, i) => TA + 40 + i * 40).filter((x) => x < TB - 20);
  // direcciones de las dos tracciones sobre la torre derecha
  const pulso = 1 + 0.07 * Math.sin(t * 7);
  const d1 = (() => { const dx = -(TB - TA) / 2, dy = 2 * 330 * 1; const L = Math.hypot(dx, dy); return [dx / L, dy / L]; })();
  const d2 = (() => { const dx = 190, dy = 360; const L = Math.hypot(dx, dy); return [dx / L, dy / L]; })();
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={puente}>
          <line x1={0} y1={BASE} x2={W} y2={BASE} stroke={AN.papel} strokeOpacity={0.3} strokeWidth={3} />
          {[TA, TB].map((x) => (
            <g key={x} stroke={AN.papel} strokeWidth={9} strokeLinecap="round">
              <line x1={x - 22} y1={TOP} x2={x - 22} y2={BASE} /><line x1={x + 22} y1={TOP} x2={x + 22} y2={BASE} />
              <line x1={x - 22} y1={TOP + 150} x2={x + 22} y2={TOP + 150} strokeWidth={6} /><line x1={x - 22} y1={TOP + 350} x2={x + 22} y2={TOP + 350} strokeWidth={6} />
            </g>
          ))}
          <line x1={110} y1={DECK} x2={970} y2={DECK} stroke={AN.papel} strokeWidth={12} strokeLinecap="round" />
          <rect x={80} y={DECK - 30} width={70} height={140} fill={AN.papel} opacity={0.25} stroke={AN.papel} strokeWidth={3} />
          <rect x={930} y={DECK - 30} width={70} height={140} fill={AN.papel} opacity={0.25} stroke={AN.papel} strokeWidth={3} />
          <path d={`M 150 ${DECK - 20} L ${TA} ${TOP}`} stroke={PT.traccion} strokeWidth={7} fill="none" />
          <path d={`M 930 ${DECK - 20} L ${TB} ${TOP}`} stroke={PT.traccion} strokeWidth={7} fill="none" />
          <path d={dCable} stroke={PT.traccion} strokeWidth={11} fill="none" strokeLinecap="round" />
          <path d={dCable} stroke="#FFD9C9" strokeWidth={4} fill="none" strokeLinecap="round" strokeDasharray="26 150" strokeDashoffset={-t * 210} opacity={0.75 * grav} />
          {hangers.map((x) => <line key={x} x1={x} y1={yParabola(x, TA, TB, TOP, 330)} x2={x} y2={DECK} stroke={AN.papel} strokeOpacity={0.55} strokeWidth={3} />)}
        </g>
        {/* gravedad: hacia abajo */}
        {[220, 380, 540, 700, 860].map((x, i) => <Flecha key={x} x0={x} y0={DECK + 24} x1={x} y1={DECK + 24 + 100 + 8 * Math.sin(t * 5 + i)} color={AN.papel} k={clamp(grav * 1.4 - i * 0.1)} grosor={6} cabeza={22} brillo={false} />)}
        {/* tracciones sobre la torre derecha: hacia las orillas */}
        <Flecha x0={TB} y0={TOP} x1={TB + d1[0] * 230 * pulso} y1={TOP + d1[1] * 230 * pulso} color={PT.traccionSuave} k={vect} grosor={10} cabeza={32} />
        <Flecha x0={TB} y0={TOP} x1={TB + d2[0] * 230 * pulso} y1={TOP + d2[1] * 230 * pulso} color={PT.traccionSuave} k={vect} grosor={10} cabeza={32} />
        <Flecha x0={TA} y0={TOP} x1={TA - d1[0] * 230 * pulso} y1={TOP + d1[1] * 230 * pulso} color={PT.traccionSuave} k={vect} grosor={10} cabeza={32} />
        <Flecha x0={TA} y0={TOP} x1={TA - d2[0] * 230 * pulso} y1={TOP + d2[1] * 230 * pulso} color={PT.traccionSuave} k={vect} grosor={10} cabeza={32} />
      </svg>
      <Cap e={e} />
      <Frases id="titular-gancho" y={430} frases={[{ px: 120, t: 0.2, texto: "NO CUELGA" }, { px: 120, t: 1.8, texto: "TIRA", color: PT.traccion }]} />
      <Texto texto="PESO ↓" x={540} y={DECK + 170} px={28} color={AN.papel} delay={G.gravedad} peso={800} id="gancho-peso" />
      <Texto texto="TRACCIÓN" x={540} y={1330} px={30} color={PT.traccion} delay={G.vectores} peso={800} id="gancho-trac" interletra={0.08} />
      <Nota texto="miles de toneladas" x={540} y={1420} color={AN.lima} delay={G.chip} id="gancho-nota" />
    </Lienzo>
  );
};

/* ───────────── pte-parabola ───────────── */

const PA = 160, PB = 920, PTOP = 700, PDECK = 1130, F0 = 240;

export const PteParabola: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const R = TPTE.parabola;
  const puente = easeOut((t - a(R.puente)) / a(0.8));
  const knobs = easeOut((t - a(R.knobs)) / a(0.6));
  const kw = easeInOut((t - a(R.w)) / a(R.wDur));
  const kf = easeInOut((t - a(R.f)) / a(R.fDur));
  const w = lerp(1, 1.4, kw);
  const fr = lerp(1, 0.7, kf);
  const sag = F0 * fr;
  const Hn = w / fr; // H = w·L²/(8·f) → proporcional a w/f
  const pts = puntosParabola(PA, PB, PTOP, sag, 70);
  const radio = 16 + 9 * (Hn - 1);
  const flechas = Array.from({ length: 9 }, (_, i) => PA + 76 + i * 76);
  const formula = clamp((t - a(R.formula)) / a(0.6));
  void f;
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={puente}>
          {[PA, PB].map((x) => (
            <g key={x} stroke={AN.papel} strokeWidth={9} strokeLinecap="round">
              <line x1={x - 20} y1={PTOP} x2={x - 20} y2={PDECK + 80} /><line x1={x + 20} y1={PTOP} x2={x + 20} y2={PDECK + 80} />
              <line x1={x - 20} y1={PTOP + 120} x2={x + 20} y2={PTOP + 120} strokeWidth={6} />
            </g>
          ))}
          <line x1={PA - 60} y1={PDECK} x2={PB + 60} y2={PDECK} stroke={AN.papel} strokeWidth={12} strokeLinecap="round" />
          {flechas.map((x) => <line key={x} x1={x} y1={yParabola(x, PA, PB, PTOP, sag) + radio} x2={x} y2={PDECK} stroke={AN.papel} strokeOpacity={0.5} strokeWidth={3} />)}
        </g>
        <TuboHalftone pts={pts} radio={radio} luz={t * 1.3} opacidad={puente} avance={puente} />
        {flechas.map((x) => <Flecha key={`g${x}`} x0={x} y0={PDECK + 18} x1={x} y1={PDECK + 18 + 38 * w} color={AN.papel} k={puente} grosor={5} cabeza={16} brillo={false} />)}
        <Knob cx={210} cy={1385} r={62} valor={0.18 + (w - 1) * 1.0} etiqueta="1 · PESO" lectura={`${Math.round(w * 100)} %`} aparece={knobs} />
        <Knob cx={540} cy={1385} r={62} valor={0.2 + (1 - fr) * 1.6} etiqueta="2 · FLECHA" lectura={`${Math.round(fr * 100)} %`} aparece={knobs} />
        <Knob cx={870} cy={1385} r={62} valor={0.1 + (Hn - 1) * 0.55} etiqueta="3 · TENSIÓN H" lectura={`${Math.round(Hn * 100)} %`} aparece={knobs} color={PT.traccion} />
      </svg>
      <Cap e={e} />
      <Frases id="titular-parabola" y={430} frases={[{ px: 84, t: 0.2, texto: "EL PESO SE DESVÍA\nHACIA LAS ORILLAS" }, { px: 84, t: 3.4, texto: "MENOS FLECHA,\nMÁS TENSIÓN", color: PT.traccion }]} />
      <Nota texto={PTE.formula} x={540} y={1250} color={AN.lima} delay={R.formula} px={30} id="parabola-formula" opacidad={formula} />
      <Texto texto="H es el resultado de los otros dos" x={540} y={1300} px={22} color={AN.papel} delay={R.formula + 0.3} peso={500} id="parabola-nota" />
      <Pie texto="w = peso por metro · L = vano · f = flecha · esquema, no a escala" y={1512} delay={R.formula} />
    </Lienzo>
  );
};

/* ───────────── pte-duelo ───────────── */

const TWX = 560, TWY = 650, TWW = 110, ANCX = 140, ANCY = 1050, ENDX = 980;

export const PteDuelo: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const D = TPTE.duelo;
  const alambre = easeOut((t - a(D.alambre)) / a(0.8));
  const xray = easeOut((t - a(D.xray)) / a(0.9));
  const cables = easeOut((t - a(D.cables)) / a(0.9));
  const vect = easeOut((t - a(D.vectores)) / a(0.9));
  const comp = easeOut((t - a(D.compresion)) / a(0.8));
  const solido = 1 - xray;
  const L = 190, ux = 0.7236, uy = 0.6902;
  const tx = TWX + TWW / 2 + 23, ty = TWY - 14; // punta de la torre (centro de la cara frontal)
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={alambre}>
          <line x1={0} y1={1262} x2={W} y2={1262} stroke={AN.papel} strokeOpacity={0.35} strokeWidth={3} />
          {Array.from({ length: 27 }, (_, i) => <line key={i} x1={i * 42} y1={1262} x2={i * 42 - 26} y2={1296} stroke={AN.papel} strokeOpacity={0.3} strokeWidth={2.5} />)}
          <CajaAlambre x={90} y={1050} w={170} h={212} d={46} color={AN.papel} relleno={solido * 0.7} grosor={3.5} />
          <CajaAlambre x={TWX} y={TWY} w={TWW} h={612} d={46} color={PT.compresion} relleno={solido} grosor={5} cruz />
        </g>
        {/* cables en tracción */}
        <path d={`M ${tx} ${ty} L ${ENDX} ${ANCY}`} stroke={PT.traccion} strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray={`${cables * 900} 900`} opacity={alambre} />
        <path d={`M ${tx} ${ty} L ${ANCX + 60} ${ANCY}`} stroke={PT.traccion} strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray={`${cables * 900} 900`} opacity={alambre} />
        {/* tirones (rojo) sobre la punta de la torre */}
        <Flecha x0={tx} y0={ty} x1={tx + ux * L} y1={ty + uy * L} color={PT.traccionSuave} k={vect} grosor={9} cabeza={28} />
        <Flecha x0={tx} y0={ty} x1={tx - ux * L} y1={ty + uy * L} color={PT.traccionSuave} k={vect} grosor={9} cabeza={28} />
        {/* componentes horizontales: se anulan */}
        <g opacity={suave(t, a(D.vectores + 0.8), a(D.vectores + 1.4))}>
          <Flecha x0={tx} y0={ty - 22} x1={tx + ux * L} y1={ty - 22} color={AN.papel} grosor={4} cabeza={16} discontinua brillo={false} />
          <Flecha x0={tx} y0={ty - 22} x1={tx - ux * L} y1={ty - 22} color={AN.papel} grosor={4} cabeza={16} discontinua brillo={false} />
        </g>
        {/* compresión (azul): hacia abajo, dentro de la torre */}
        {[0, 1, 2].map((i) => <Flecha key={i} x0={TWX + 28 + i * 27} y0={TWY + 40} x1={TWX + 28 + i * 27} y1={TWY + 40 + 520} color={PT.compresionTexto} k={clamp(comp * 1.5 - i * 0.15)} grosor={7} cabeza={22} />)}
        {/* el anclaje resiste (peso) y la roca empuja de vuelta */}
        <Flecha x0={175} y0={1262} x1={175} y1={1262 - 120} color={PT.compresionTexto} k={comp} grosor={7} cabeza={22} />
      </svg>
      <Cap e={e} />
      <Frases id="titular-duelo" y={440} frases={[{ px: 110, t: 0.2, texto: "RAYOS X" }, { px: 72, t: 2.6, texto: "EL TIRÓN SE VUELVE\nCOMPRESIÓN", color: PT.compresionTexto }]} />
      <Texto texto="TRACCIÓN" x={830} y={830} alinear="left" px={28} color={PT.traccionSuave} delay={D.cables} peso={800} id="duelo-trac" interletra={0.08} rot={-0} />
      <Texto texto="COMPRESIÓN" x={TWX + TWW / 2 + 23} y={1330} px={28} color={PT.compresionTexto} delay={D.compresion} peso={800} id="duelo-comp" interletra={0.08} />
      <Texto texto="los tirones horizontales se anulan" x={ux * L + tx - 60} y={ty - 62} px={20} color={AN.papel} alinear="center" delay={D.vectores + 1} peso={500} id="duelo-anulan" />
      <Nota texto="61.500 t sobre cada torre · Golden Gate" x={540} y={1410} color={PT.compresionTexto} delay={D.chip1} px={23} id="duelo-nota1" />
      <Nota texto="cada anclaje pesa ≈ 60.000 t" x={540} y={1470} color={AN.papel} delay={D.chip2} px={23} id="duelo-nota2" />
      <Pie texto="Golden Gate Bridge District · esquema, no a escala" y={1518} delay={D.chip2} />
    </Lienzo>
  );
};
