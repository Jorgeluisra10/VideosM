/**
 * «El efecto del dígito izquierdo» (SINAPSIS · neuroeconomía) · escenas 2/2
 *   dig-thomas  ficha de laboratorio sobre papel crema: $3,00 → $2,99 (cambia el 1.er dígito) contra $2,80 → $2,79 (no cambia): el mismo centavo pesa distinto
 *   dig-escala  una balanza: un centavo más sobre un precio en 99 se vive como más de veinte (Strulov-Shlain 2023)
 *   dig-ojo     mapa de calor esquemático de seguimiento ocular: la primera fijación cae hacia el centro del precio (Laurent, Vanhuele et al. 2023); sesgo real, mecanismo en debate
 */
import React from "react";
import { TDIG } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, LineaCap, MONO, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { AN, Lienzo, PuntosSemitono } from "./anom-ui";
import { Garabato, Nota, Pie, Tally, Texto, ovaloMano } from "./dig-kit";
import { Frases } from "./real-kit";

type P = { e: EscenaViralGuardada };

const Cap: React.FC<{ e: EscenaViralGuardada; color?: string }> = ({ e, color }) => (e.cap ? <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={color ?? AN.papel} /> : null);

/* ───────────── dig-thomas ───────────── */

export const DigThomas: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TDIG.thomas;
  const ficha = easeOut((t - a(T.ficha)) / a(0.5));
  const circ = easeOut((t - a(T.circulo)) / a(0.55));
  const barA = easeOut((t - a(T.barraA)) / a(0.7));
  const igual = easeOut((t - a(T.igual)) / a(0.55));
  const barB = easeOut((t - a(T.barraB)) / a(0.5));
  const sello = spr(f, a(T.sello), { damping: 9, stiffness: 200, mass: 0.6 });
  const yA = 800, yB = 1100;
  const PX = 64, CWm = PX * 0.6;
  const fila = (y: number, a1: string, b1: string, delay: number, flecha: string) => (
    <>
      <Texto texto={a1} x={130} y={y} px={PX} color={AN.tinta} alinear="left" delay={delay} peso={800} id={`thomas-a-${y}`} interletra={0} />
      <Texto texto={b1} x={430} y={y} px={PX} color={AN.tinta} alinear="left" delay={delay + 0.25} peso={800} id={`thomas-b-${y}`} interletra={0} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <g opacity={clamp((t - a(delay + 0.1)) / 0.3)} stroke={AN.tinta} strokeWidth={5} strokeLinecap="round" fill="none">
          <line x1={348} y1={y} x2={402} y2={y} />
          <path d={`M ${390} ${y - 12} L ${404} ${y} L ${390} ${y + 12}`} />
        </g>
      </svg>
      <Texto texto={flecha} x={130} y={y + 72} px={24} color={AN.tinta} alinear="left" delay={delay + 0.5} peso={600} id={`thomas-cap-${y}`} />
    </>
  );
  return (
    <Lienzo modo="papel">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* ficha técnica */}
        <g opacity={ficha}>
          <rect x={100} y={600} width={880} height={800} fill="none" stroke={AN.tinta} strokeWidth={4} />
          <rect x={100} y={600} width={880} height={78} fill={AN.tinta} />
          <line x1={100} x2={980} y1={950} y2={950} stroke={AN.tinta} strokeOpacity={0.25} strokeWidth={2} strokeDasharray="7 9" />
        </g>
        <Tally x={790} y={617} n={5} k={easeOut((t - a(0.5)) / a(1.2))} color={AN.papel} alto={44} grosor={5} />
        {/* círculos a mano sobre el primer dígito */}
        <Garabato d={ovaloMano(130 + CWm * 1.5, yA, 34, 48, 1)} k={circ} color={AN.rojo} grosor={7} />
        <Garabato d={ovaloMano(430 + CWm * 1.5, yA, 34, 48, 2)} k={circ} color={AN.rojo} grosor={7} />
        <Garabato d={ovaloMano(130 + CWm * 1.5, yB, 34, 48, 3)} k={igual} color={AN.azul} grosor={7} />
        <Garabato d={ovaloMano(430 + CWm * 1.5, yB, 34, 48, 4)} k={igual} color={AN.azul} grosor={7} />
        {/* barras de diferencia percibida */}
        <rect x={660} y={yA + 6} width={Math.max(0.1, 280 * barA)} height={36} fill={AN.rojo} />
        <rect x={660} y={yB + 6} width={Math.max(0.1, 28 * barB)} height={36} fill={AN.azul} />
        <line x1={660} x2={660} y1={yA - 14} y2={yA + 60} stroke={AN.tinta} strokeWidth={3} />
        <line x1={660} x2={660} y1={yB - 14} y2={yB + 60} stroke={AN.tinta} strokeWidth={3} />
      </svg>
      <Cap e={e} color={AN.tinta} />
      <Frases id="titular-thomas" y={430} frases={[{ px: 100, t: 0.2, texto: "EL MISMO\nCENTAVO", color: AN.tinta }, { px: 100, t: 3.5, texto: "PESA\nDISTINTO", color: AN.rojo }]} />
      <Texto texto="THOMAS Y MORWITZ · 2005" x={126} y={639} px={26} color={AN.papel} alinear="left" delay={0.3} peso={800} id="thomas-head" />
      {fila(yA, "$3,00", "$2,99", T.filaA, "cambia el 1.er dígito: 3 → 2")}
      {fila(yB, "$2,80", "$2,79", T.filaB, "mismo 1.er dígito: 2 = 2")}
      <Texto texto="diferencia percibida" x={660} y={yA - 36} px={22} color={AN.tinta} alinear="left" delay={T.filaA + 0.4} peso={600} id="thomas-dif1" />
      <Texto texto="MAYOR" x={660} y={yA + 82} px={32} color={AN.rojo} alinear="left" delay={T.barraA} peso={800} id="thomas-mayor" />
      <Texto texto="diferencia percibida" x={660} y={yB - 36} px={22} color={AN.tinta} alinear="left" delay={T.filaB + 0.4} peso={600} id="thomas-dif2" />
      <Texto texto="casi nada" x={660} y={yB + 82} px={32} color={AN.azul} alinear="left" delay={T.barraB} peso={800} id="thomas-nada" />
      <div data-texto="thomas-sello" style={{ position: "absolute", left: 540, top: 1300, transform: `translate(-50%, -50%) rotate(-2.5deg) scale(${1.5 - 0.5 * sello})`, opacity: clamp(sello * 2), fontFamily: MONO, fontWeight: 800, fontSize: 34, color: AN.rojo, border: `5px solid ${AN.rojo}`, padding: "12px 26px", whiteSpace: "nowrap", letterSpacing: "0.02em" }}>
        SOLO SI CAMBIA EL PRIMER DÍGITO
      </div>
      <Pie texto={"Thomas y Morwitz · J. Consumer Research 32(1): 54–64\nesquema de sus resultados, no son los datos reales"} y={1480} delay={T.sello} color={AN.tinta} />
    </Lienzo>
  );
};

/* ───────────── dig-escala ───────────── */

const PIV = { x: 540, y: 880 };

export const DigEscala: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const S = TDIG.escala;
  const bal = spr(f, a(S.balanza), { damping: 14, stiffness: 120, mass: 0.8 });
  const th = lerp(0, 9, easeInOut((t - a(S.inclina)) / a(S.inclinaDur)));
  const rad = (th * Math.PI) / 180;
  const R = 360, HANG = 150;
  const Lx = PIV.x - R * Math.cos(rad), Ly = PIV.y - R * Math.sin(rad);
  const Rx = PIV.x + R * Math.cos(rad), Ry = PIV.y + R * Math.sin(rad);
  const centavo = spr(f, a(S.centavo), { damping: 10, stiffness: 190, mass: 0.6 });
  const nMon = Math.floor(clamp((t - a(S.monedas)) / a(S.monedasDur)) * 22);
  const filas = [6, 6, 5, 5];
  const monedas: { x: number; y: number }[] = [];
  let c = 0;
  filas.forEach((n, r) => { for (let i = 0; i < n; i++) { if (c < nMon) monedas.push({ x: (i - (n - 1) / 2) * 40, y: -r * 30 - 24 }); c++; } });
  const pan = (cx: number, cy: number): string => `M ${cx - 125} ${cy} Q ${cx} ${cy + 80} ${cx + 125} ${cy} Z`;
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(bal * 2)}>
          <polygon points={`${PIV.x},${PIV.y} ${PIV.x - 70},1260 ${PIV.x + 70},1260`} fill={AN.papel} opacity={0.18} stroke={AN.papel} strokeOpacity={0.5} strokeWidth={3} />
          <line x1={PIV.x - 200} x2={PIV.x + 200} y1={1260} y2={1260} stroke={AN.papel} strokeWidth={8} strokeLinecap="round" opacity={0.6} />
          <line x1={Lx} y1={Ly} x2={Rx} y2={Ry} stroke={AN.papel} strokeWidth={14} strokeLinecap="round" />
          <circle cx={PIV.x} cy={PIV.y} r={16} fill={AN.lima} stroke={AN.oscuro} strokeWidth={5} />
          {/* platos */}
          {[{ x: Lx, y: Ly, c: AN.lima }, { x: Rx, y: Ry, c: AN.rojo }].map((p, i) => (
            <g key={i}>
              <line x1={p.x} y1={p.y} x2={p.x - 110} y2={p.y + HANG} stroke={AN.papel} strokeWidth={3} opacity={0.7} />
              <line x1={p.x} y1={p.y} x2={p.x + 110} y2={p.y + HANG} stroke={AN.papel} strokeWidth={3} opacity={0.7} />
              <path d={pan(p.x, p.y + HANG)} fill="#1A1C24" stroke={p.c} strokeWidth={5} />
            </g>
          ))}
          {/* un centavo de verdad */}
          <g transform={`translate(${Lx} ${Ly + HANG - 26}) scale(${centavo})`} opacity={clamp(centavo * 2)}>
            <circle r={26} fill={AN.lima} stroke={AN.oscuro} strokeWidth={4} />
            <text y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={AN.tinta}>1¢</text>
          </g>
          {/* lo que se siente */}
          {monedas.map((m, i) => (
            <g key={i} transform={`translate(${Rx + m.x} ${Ry + HANG + m.y})`}>
              <circle r={19} fill={AN.rojo} stroke={AN.oscuro} strokeWidth={3} />
              <circle r={11} fill="none" stroke={AN.oscuro} strokeOpacity={0.35} strokeWidth={2} />
            </g>
          ))}
        </g>
      </svg>
      <Cap e={e} />
      <Frases id="titular-escala" y={430} frases={[{ px: 84, t: 0.2, texto: "UN CENTAVO MÁS\nSOBRE UN 99" }, { px: 84, t: 3.1, texto: "SE SIENTE COMO\nMÁS DE 20", color: AN.rojo }]} />
      <Texto texto="REAL: +1 ¢" x={130} y={1330} px={34} color={AN.lima} alinear="left" delay={S.centavo + 0.3} peso={800} id="escala-real" />
      <Texto texto="SE SIENTE: > 20 ¢" x={950} y={1330} px={34} color={AN.rojo} alinear="right" delay={S.inclina} peso={800} id="escala-siente" />
      <Nota texto="≈ 3.500 productos · 25 cadenas de tiendas" x={540} y={1410} color={AN.lima} delay={S.chip1} px={23} id="escala-nota1" />
      <Nota texto="subestimarlo les cuesta 1–4 % de ganancia" x={540} y={1470} color={AN.papel} delay={S.chip2} px={23} id="escala-nota2" />
      <Pie texto="Strulov-Shlain · Review of Economic Studies 2023 · balanza esquemática" y={1518} delay={S.chip2} />
    </Lienzo>
  );
};

/* ───────────── dig-ojo ───────────── */

const CARD = { x: 140, y: 650, w: 800, h: 380 };
const FIJ = [{ x: 480, y: 880 }, { x: 372, y: 846 }, { x: 612, y: 866 }, { x: 760, y: 892 }];
const gauss = (x: number, y: number, cx: number, cy: number, sx: number, sy: number): number => Math.exp(-(((x - cx) ** 2) / (2 * sx * sx) + ((y - cy) ** 2) / (2 * sy * sy)));
const calor = (x: number, y: number): number => gauss(x, y, 480, 880, 92, 112) + 0.5 * gauss(x, y, 372, 846, 70, 90) + 0.42 * gauss(x, y, 612, 866, 78, 96) + 0.32 * gauss(x, y, 760, 892, 70, 90);

export const DigOjo: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const O = TDIG.ojo;
  const k = easeOut((t - a(O.calor)) / a(O.calorDur));
  const card = easeOut((t - a(O.etiqueta)) / a(0.5));
  const nFij = (i: number): number => easeOut((t - a(O.fijaciones + i * 0.42)) / a(0.3));
  return (
    <Lienzo modo="marino">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={card}>
          <rect x={CARD.x + 8} y={CARD.y + 12} width={CARD.w} height={CARD.h} rx={20} fill="#000" opacity={0.4} />
          <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={20} fill="#15171F" stroke={AN.papel} strokeOpacity={0.3} strokeWidth={3} />
        </g>
        {k > 0.02 && (
          <>
            <PuntosSemitono x0={CARD.x + 6} y0={CARD.y + 6} w={CARD.w - 12} h={CARD.h - 12} paso={20} rMax={7.5} color={AN.lima} opacidad={0.85} campo={(x, y) => clamp((calor(x, y) - 0.12) * 1.1) * k} />
            <PuntosSemitono x0={CARD.x + 6} y0={CARD.y + 6} w={CARD.w - 12} h={CARD.h - 12} paso={20} rMax={10} color={AN.rojo} opacidad={0.95} campo={(x, y) => clamp((calor(x, y) - 0.6) * 2.6) * k} />
          </>
        )}
        <text x={540} y={955} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={190} fill={AN.papel} opacity={card} letterSpacing="-0.02em">$9.999</text>
        {/* recorrido de la mirada: fijaciones 1 → 4 */}
        {FIJ.slice(1).map((p, i) => {
          const q = FIJ[i];
          return nFij(i + 1) > 0.02 && <line key={`l${i}`} x1={q.x} y1={q.y} x2={lerp(q.x, p.x, nFij(i + 1))} y2={lerp(q.y, p.y, nFij(i + 1))} stroke={AN.papel} strokeWidth={3.5} strokeDasharray="8 8" opacity={0.85} />;
        })}
        {FIJ.map((p, i) => nFij(i) > 0.05 && (
          <g key={i} transform={`translate(${p.x} ${p.y}) scale(${nFij(i)})`}>
            <circle r={24} fill={AN.oscuro} stroke={AN.lima} strokeWidth={5} />
            <text y={9} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={26} fill={AN.lima}>{i + 1}</text>
          </g>
        ))}
        <Tally x={160} y={1075} n={4} k={easeOut((t - a(O.fijaciones)) / a(1.4))} color={AN.papel} alto={44} grosor={5} />
      </svg>
      <Cap e={e} />
      <Frases id="titular-ojo" y={440} frases={[{ px: 84, t: 0.2, texto: "EL OJO LO\nCOMPLICA" }, { px: 84, t: 5.0, texto: "SESGO REAL.\nMECANISMO\nEN DEBATE", color: AN.lima }]} />
      <Texto texto="fijaciones (ejemplo)" x={250} y={1100} px={24} color={AN.papel} alinear="left" delay={O.fijaciones} peso={500} id="ojo-fij" />
      <Nota texto="1.ª fijación: entre el primer tercio y el centro" x={540} y={1210} color={AN.lima} delay={O.nota} px={23} id="ojo-nota" />
      <Pie texto={"Laurent, Vanhuele et al. · J. Consumer Research 2023\nmapa de calor esquemático, no son datos reales"} y={1490} delay={O.nota} />
    </Lienzo>
  );
};

