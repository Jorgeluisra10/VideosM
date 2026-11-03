/**
 * «La bola de 660 toneladas» (IMNOBA · formas geométricas) · escenas 2/2
 *   tmd-bola    cada disco mide 12,5 cm; juntos forman una esfera de 5,5 m (con una persona para dar escala)
 *   tmd-cuelga  la bola cuelga de cables de acero entre los pisos 87 y 92 (corte del edificio con sus pisos)
 *   tmd-tifon   tifón Soudelor (2015): la bola se movió cerca de 1 m y frenó el vaivén (hasta −40 %, cifra del edificio)
 */
import React, { useMemo } from "react";
import { TMD, TTM } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { FONT, Frases, MONOF, RE } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { CotaH } from "./sky-kit";
import { Espiral, FondoPsico, Mosaico, PersonaG, TC, facetasEsfera, tonoOro } from "./tmd-kit";

type P = { e: EscenaViralGuardada };
const poli = (p: [number, number][]): string => p.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ");

/* ───────────── tmd-bola ───────────── */

export const TmdBola: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TTM.bola;
  const CX = 540, CY = 930, R = 330;
  const prog = clamp(t / a(T.ensDur));
  const rot = Math.max(0, t - a(T.ensDur)) * 0.35;
  const esfera = facetasEsfera(CX, CY, R, 14, 24, rot);
  const inset = easeOut((t - a(T.inset)) / a(0.6));
  const cota = easeOut((t - a(T.cota)) / a(0.7));
  const peso = easeInOut((t - a(T.peso)) / a(1.2));
  const sP = spr(f, a(T.cota + 0.3));
  return (
    <FondoPsico cy={930}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <circle cx={CX} cy={CY} r={R * 1.35} fill={TC.oro} opacity={0.1 * prog} />
        <Mosaico facetas={esfera} prog={prog} dispersion={720} semilla={11} />
        <line x1={110} y1={1330} x2={1000} y2={1330} stroke="#8FA2C8" strokeOpacity={0.4} strokeWidth={3} strokeDasharray="10 12" />
        <g opacity={sP}><PersonaG x={935} y={1330} s={1.2} /></g>
        <CotaH x0={CX - R} x1={CX + R} y={566} texto="5,5 m" px={46} k={cota} />
        {/* lupa: corte de tres discos con su soldadura */}
        {inset > 0.01 && (
          <g opacity={clamp(inset * 1.6)} transform={`translate(0 ${(1 - inset) * 40})`}>
            <circle cx={230} cy={1390} r={124} fill="#070C2A" stroke={TC.oro} strokeWidth={6} />
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <polygon points={poli([[130, 1330 + i * 44], [330, 1330 + i * 44], [330, 1370 + i * 44], [130, 1370 + i * 44]])} fill={tonoOro(0.55 + 0.12 * (i % 2))} stroke="#FFF2B0" strokeOpacity={0.5} />
                <line x1={130} y1={1370 + i * 44} x2={330} y2={1370 + i * 44} stroke="#FFFFFF" strokeOpacity={0.8} strokeWidth={3} />
              </g>
            ))}
            <line x1={346} y1={1330} x2={346} y2={1414} stroke={RE.oro} strokeWidth={4} /><line x1={334} y1={1330} x2={358} y2={1330} stroke={RE.oro} strokeWidth={4} /><line x1={334} y1={1414} x2={358} y2={1414} stroke={RE.oro} strokeWidth={4} />
          </g>
        )}
      </svg>
      <Frases frases={[{ t: 0.15, texto: "cada disco:\n12,5 cm", px: 88 }, { t: T.cota - 0.3, texto: "juntos: una\nesfera de 5,5 m", color: RE.oro, px: 72 }]} y={352} ancho={800} />
      <Chip texto="12,5 cm" x={500} y={1388} color={RE.oro} id="tmd-12" ancho={220} opacidad={clamp(inset * 1.4)} />
      <Dato valor={TMD.masaTon * peso} x={700} y={1500} px={110} digitos={3} sufijo=" t" id="tmd-peso" opacidad={clamp((t - a(T.peso)) / 0.4)} />
      <Fuente texto="41 placas de 125 mm · esfera de ≈ 5,5 m y ≈ 660 t (Guinness, A+H Tuned) · persona = escala" delay={0.8} />
    </FondoPsico>
  );
};

/* ───────────── tmd-cuelga ───────────── */

const PISOS = [87, 88, 89, 90, 91, 92];

export const TmdCuelga: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TTM.cuelga;
  const muros = useMemo(() => {
    const out = [];
    for (const cx of [190, 890]) {
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 3; c++) {
          const y0 = 1330 - r * 67.5, y1 = y0 - 67.5, x0 = cx - 70 + c * (140 / 3), x1 = x0 + 140 / 3;
          const tono = ["#2FA6D0", "#1F83B4", "#18699B", "#115083"][(r + c + (cx > 500 ? 1 : 0)) % 4];
          const p: [number, number][] = (r + c) % 2 ? [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] : [[x0, y0], [x1, y0], [x1, y1]];
          out.push({ p, c: tono, k: (1330 - y0) / 810 * 0.7, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 });
          if ((r + c) % 2 === 0) out.push({ p: [[x0, y0], [x1, y1], [x0, y1]] as [number, number][], c: "#0F4C78", k: (1330 - y0) / 810 * 0.7, cx: (x0 + x1) / 3, cy: (y0 + y1) / 2 });
        }
      }
    }
    return out;
  }, []);
  const prog = clamp((t - a(T.muros)) / a(1.1));
  const cab = easeOut((t - a(T.cables)) / a(0.8));
  const amp = 0.055 * clamp((t - a(T.cables)) / 1.0);
  const th = amp * Math.sin(t * 1.9);
  const PX = 540, PY = 536, LL = 480, RR = 170;
  const sx = PX + LL * Math.sin(th), sy = PY + LL * Math.cos(th);
  const esfera = facetasEsfera(sx, sy, RR, 10, 18, t * 0.3);
  const ancl: [number, number][] = [[-46, -20], [-18, -8], [18, -8], [46, -20]];
  const lit = (i: number): boolean => t >= a(T.pisos + (i * T.pisosDur) / 6);
  return (
    <FondoPsico cy={930} mandala={0.7}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Mosaico facetas={muros} prog={prog} dispersion={500} semilla={7} />
        {/* pisos */}
        {PISOS.map((n, i) => {
          const y = 1330 - i * 162;
          const on = lit(i);
          return (
            <g key={n} opacity={clamp(prog * 2 - 0.4)}>
              <polygon points={poli([[260, y], [820, y], [820, y + 16], [260, y + 16]])} fill={on ? TC.oro : "#3C4F8F"} opacity={on ? 0.95 : 0.8} />
              <polygon points={poli([[260, y], [820, y], [820, y + 4], [260, y + 4]])} fill="#FFFFFF" opacity={0.4} />
            </g>
          );
        })}
        {/* pistones que frenan a los lados */}
        {[-1, 1].map((d) => {
          const bx = d < 0 ? 260 : 750, ex = d < 0 ? sx - RR - 2 : sx + RR + 2;
          const x0 = d < 0 ? 330 : 750, x1 = ex;
          return (
            <g key={d} opacity={cab}>
              <polygon points={poli([[bx, sy - 26], [bx + 70, sy - 26], [bx + 70, sy + 26], [bx, sy + 26]])} fill="#2A3350" stroke="#8FA2C8" strokeOpacity={0.6} strokeWidth={2} />
              <polygon points={poli(d < 0 ? [[x0, sy - 9], [Math.max(x0, x1), sy - 9], [Math.max(x0, x1), sy + 9], [x0, sy + 9]] : [[Math.min(x0, x1), sy - 9], [x0 + 70, sy - 9], [x0 + 70, sy + 9], [Math.min(x0, x1), sy + 9]])} fill="#C9D3DE" />
            </g>
          );
        })}
        {/* cables de acero */}
        {ancl.map(([dx, dy], i) => <line key={i} x1={PX + dx * 1.7} y1={PY} x2={lerp(PX + dx * 1.7, sx + dx * 2.2, cab)} y2={lerp(PY, sy - RR * 0.92 - dy, cab)} stroke="#D7E3EE" strokeWidth={5.5} strokeLinecap="round" />)}
        <circle cx={sx} cy={sy} r={RR * 1.4} fill={TC.oro} opacity={0.1 * cab} />
        <g opacity={clamp(cab * 2)}>{esfera.map((fc, i) => <polygon key={i} points={poli(fc.p)} fill={fc.c} stroke="#FFF2B0" strokeOpacity={0.3} strokeWidth={1} strokeLinejoin="round" />)}</g>
      </svg>
      {PISOS.map((n, i) => {
        const on = lit(i);
        return <div key={n} data-texto={`tmd-piso${n}`} style={{ position: "absolute", left: 190 - 56, top: (i === 5 ? 1330 - i * 162 + 46 : 1330 - i * 162 - 44) - 26, width: 112, textAlign: "center", fontFamily: MONOF, fontWeight: 800, fontSize: 44, color: on ? RE.oro : "#CFE3FF", textShadow: "0 3px 14px rgba(0,0,0,0.8)", opacity: clamp(prog * 2 - 0.5) }}>{n}</div>;
      })}
      <Frases frases={[{ t: 0.2, texto: "entre los\npisos 87 y 92", px: 82 }]} y={352} ancho={800} />
      <Chip texto="colgada de cables de acero" x={W / 2} y={1478} color={RE.oro} id="tmd-cable" ancho={640} opacidad={clamp((t - a(T.chip)) / 0.4)} />
      <Fuente texto="Cuelga del piso 92 hasta el 87 · cables de acero (Guinness, A+H Tuned) · esquema, no a escala" delay={0.8} />
    </FondoPsico>
  );
};

/* ───────────── tmd-tifon ───────────── */

export const TmdTifon: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TTM.tifon;
  const PX = 540, PY = 520, LL = 560, R = 125;
  const A = 0.31;
  const ramp = easeOut((t - a(T.balanceo)) / a(1.0));
  const th = A * ramp * Math.sin(((t - a(T.balanceo)) / a(2.3)) * 2 * Math.PI);
  const sx = PX + LL * Math.sin(th), sy = PY + LL * Math.cos(th);
  const esfera = facetasEsfera(sx, sy, R, 9, 16, t * 0.8);
  const cota = easeOut((t - a(T.cota)) / a(0.7));
  const barras = easeOut((t - a(T.barras)) / a(0.7));
  const xe = PX + LL * Math.sin(A);
  const arco = Array.from({ length: 21 }, (_, i) => { const q = -A + (2 * A * i) / 20; return `${PX + LL * Math.sin(q)},${PY + LL * Math.cos(q)}`; }).join(" ");
  const BX = 330, BW = 500;
  return (
    <FondoPsico cy={1000}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Espiral cx={215} cy={620} R={140} t={t} op={clamp((t - a(T.espiral)) / 0.5)} />
        {Array.from({ length: 22 }, (_, i) => {
          const x = ((i * 97 + t * 260) % 1300) - 120, y = ((i * 131 + t * 640) % 1500) + 330;
          return <polygon key={i} points={`${x},${y} ${x + 3},${y - 2} ${x - 22},${y + 52} ${x - 25},${y + 50}`} fill="#9CC9FF" opacity={0.3} />;
        })}
        <polygon points={poli([[300, 492], [780, 492], [780, 520], [300, 520]])} fill="#3C4F8F" /><polygon points={poli([[300, 492], [780, 492], [780, 497], [300, 497]])} fill="#BFD4FF" opacity={0.5} />
        <polyline points={arco} fill="none" stroke={TC.oro} strokeOpacity={0.4} strokeWidth={3} strokeDasharray="8 10" />
        <line x1={PX} y1={PY} x2={sx} y2={sy - R * 0.95} stroke="#D7E3EE" strokeWidth={6} />
        <line x1={PX} y1={PY} x2={PX} y2={PY + LL + R} stroke="#FFFFFF" strokeOpacity={0.18} strokeWidth={2} strokeDasharray="4 12" />
        <circle cx={sx} cy={sy} r={R * 1.5} fill={TC.oro} opacity={0.1} />
        {esfera.map((fc, i) => <polygon key={i} points={poli(fc.p)} fill={fc.c} stroke="#FFF2B0" strokeOpacity={0.3} strokeWidth={1} strokeLinejoin="round" />)}
        <CotaH x0={PX} x1={xe} y={1312} texto="≈ 1 m" px={44} k={cota} />
        {barras > 0.01 && (
          <g opacity={clamp(barras * 2)}>
            <polygon points={poli([[BX, 1418], [BX + BW, 1418], [BX + BW, 1458], [BX, 1458]])} fill={TC.cian} opacity={0.85} />
            <polygon points={poli([[BX, 1480], [BX + BW * 0.6 * barras, 1480], [BX + BW * 0.6 * barras, 1520], [BX, 1520]])} fill={TC.oro} />
          </g>
        )}
      </svg>
      <Frases frases={[{ t: 0.15, texto: "tifón de 2015:\nla bola se mueve", px: 68 }, { t: T.barras - 0.3, texto: "hasta −40 %\nde vaivén", color: RE.oro, px: 88 }]} y={352} ancho={800} />
      <Chip texto="tifón Soudelor" x={290} y={800} color="#9CC9FF" id="tmd-tifon" ancho={380} opacidad={clamp((t - a(T.espiral + 0.4)) / 0.4)} />
      {[{ y: 1438, tx: "sin bola" }, { y: 1500, tx: "con bola" }].map((r, i) => <div key={i} data-texto={`tmd-b${i}`} style={{ position: "absolute", left: 104, top: r.y, transform: "translateY(-50%)", fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: RE.hielo, opacity: clamp(barras * 2) }}>{r.tx}</div>)}
      <div data-texto="tmd-v1" style={{ position: "absolute", left: BX + BW + 14, top: 1438, transform: "translateY(-50%)", fontFamily: FONT, fontWeight: 800, fontSize: 36, color: RE.blanco, opacity: clamp(barras * 2) }}>100 %</div>
      <div data-texto="tmd-v2" style={{ position: "absolute", left: BX + BW * 0.6 * barras + 14, top: 1500, transform: "translateY(-50%)", fontFamily: FONT, fontWeight: 800, fontSize: 36, color: RE.oro, opacity: clamp(barras * 2), whiteSpace: "nowrap" }}>{`−${Math.round(40 * barras)} %`}</div>
      <Fuente texto="Tifón Soudelor, 8-ago-2015: la bola se movió ≈ 1 m · «hasta 40 %» es la cifra del edificio, un máximo" delay={0.8} />
    </FondoPsico>
  );
};
