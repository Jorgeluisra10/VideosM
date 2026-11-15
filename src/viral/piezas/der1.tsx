/**
 * «Derinkuyu» (IMNOBA · ciudad subterránea) · escenas 1/2. Casi sin texto: todo el cuadro es dibujo y se explica solo.
 *   der-gancho     un hombre derriba la pared del sótano y descubre una ciudad (la cámara se lanza por el agujero)
 *   der-roca       la toba volcánica es blanda: se talla con picos y se endurece al aire
 *   der-niveles-a  descenso por los pisos 1–6: establos y casas
 *   der-niveles-b  descenso por los pisos 7–12: bodegas, cocinas y escuelas
 *   der-niveles-c  descenso por los pisos 13–18: la iglesia y el fondo
 *   der-aire       el aire frío baja por el pozo central y el caliente sube por los laterales
 */
import React from "react";
import { TDR } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, useReloj } from "../comun";
import { azar } from "../../lib/anim";
import { FONT } from "./real-kit";
import { Aldeano, Aire, Animal, Camara, Ciudad, CasaCorte, DR, Galerias, PPM, Polvo, RocaFondo, Superficie, Vineta, metros, pisoY } from "./der-kit";

type P = { e: EscenaViralGuardada };

/** Regla de profundidad (marcas cada 5 m en el borde izquierdo) y, si `pastilla`, el contador de metros. Coordenadas de pantalla. */
export const Medidor: React.FC<{ yc: number; zoom: number; pastilla?: boolean }> = ({ yc, zoom, pastilla = true }) => {
  const m = metros(yc);
  return (
    <g>
      {Array.from({ length: 19 }, (_, i) => {
        const d = i * 5, y = H / 2 + (d * PPM - yc) * zoom;
        if (y < 0 || y > H) return null;
        return <g key={i}><line x1={0} y1={y} x2={i % 2 ? 26 : 46} y2={y} stroke="#FFE2B0" strokeWidth={i % 2 ? 3 : 5} opacity={0.75} />{i % 2 === 0 && <text x={54} y={y + 8} fontFamily="'JetBrains Mono', monospace" fontWeight={700} fontSize={24} fill="#FFE2B0" opacity={0.7}>{d}</text>}</g>;
      })}
      {pastilla && yc > 0 && (
        <g transform="translate(850 270)">
          <rect x={-95} y={-34} width={190} height={68} rx={34} fill="#150D07" stroke="#FFB347" strokeWidth={4} opacity={0.92} />
          <text x={0} y={11} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={38} fill="#FFD98A" data-texto="der-metros">{`-${m} m`}</text>
        </g>
      )}
    </g>
  );
};

const Murcielago: React.FC<{ t: number; i: number }> = ({ t, i }) => {
  const q = (t * 0.12 + i * 0.37) % 1;
  const x = lerp(-80, W + 80, q), y = 300 + azar(i * 5.1) * 1300 + Math.sin(q * 14 + i) * 60;
  const ala = Math.sin(t * 22 + i) * 12;
  return <g transform={`translate(${x} ${y})`} opacity={0.85}><path d={`M 0 0 Q -20 ${-18 + ala} -44 ${-4 + ala} Q -24 4 -8 6 Q 0 14 8 6 Q 24 4 44 ${-4 + ala} Q 20 ${-18 + ala} 0 0 Z`} fill="#1A1020" /></g>;
};

/* ───────────── der-gancho ───────────── */

export const DerGancho: React.FC<P> = () => {
  const { t, a } = useReloj();
  const T = TDR.gancho;
  const dive = easeInOut((t - a(T.dive)) / a(T.diveDur));
  const yc = lerp(-150, 330, dive);
  const zoom = lerp(1.38, 1.05, dive) + 0.02 * Math.sin(t * 1.5);
  const rotura = clamp((t - a(T.rompe)) / a(0.7));
  const gol = (t0: number) => clamp(1 - Math.abs(t - a(t0)) / 0.18);
  const sh = (gol(T.golpe1) + gol(T.golpe2) + (t >= a(T.rompe) && t < a(T.rompe) + 0.4 ? 1 : 0)) * 8;
  const gk = clamp((t - a(T.gallina)) / a(2.8));
  const gx = lerp(380, 860, easeInOut(gk));
  const asoma = clamp((t - a(T.asoma)) / 0.3);
  const hombre = t < a(T.rompe) ? (Math.floor(t * 3.6) % 2 === 0 ? "pica" : "pica") : "quieto";
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, background: "#150D07" }}>
      <Camara yc={yc} zoom={zoom} dx={Math.sin(t * 90) * sh} dy={Math.cos(t * 77) * sh}>
        <RocaFondo y0={0} y1={4700} />
        <Superficie t={t} />
        <path d="M 722 56 L 800 56 L 840 130 L 850 250 L 790 250 L 760 140 L 722 140 Z" fill="#0C0704" />
        <Ciudad t={t} yMin={-200} yMax={1400} />
        <CasaCorte x={540} t={t} rotura={rotura} />
        {/* el hombre y su gallina */}
        <Aldeano x={rotura > 0 ? 600 : 612} y={136} s={2.3} t={t} sem={2.4} pose={hombre} color="#3E6E8E" cabeza="#2A2A2A" />
        {asoma > 0 && <text x={604} y={20 - Math.sin(t * 10) * 4} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={80} fill="#FFE27A" stroke="#1A1008" strokeWidth={8} paintOrder="stroke" opacity={asoma}>!</text>}
        <Animal x={gx} y={136} s={1.8} t={t} sem={1.2} tipo="gallina" camina />
      </Camara>
      <Polvo t={t} n={34} />
      <Vineta t={t} fuerza={0.6} cy={H * 0.55} />
      <Medidor yc={yc} zoom={zoom} pastilla={dive > 0.12} />
    </svg>
  );
};

/* ───────────── der-roca ───────────── */

/** Cámara excavada que crece con obreros que pican en su borde. (x, y) = centro. */
const Excavacion: React.FC<{ x: number; y: number; w: number; h: number; k: number; t: number; sem: number; obreros?: number }> = ({ x, y, w, h, k, t, sem, obreros = 5 }) => {
  const ww = w * (0.1 + 0.9 * k), hh = h * (0.1 + 0.9 * k);
  return (
    <g>
      <ellipse cx={x} cy={y} rx={ww / 2} ry={hh / 2} fill="#140B05" stroke="#EADBB8" strokeWidth={10} />
      <ellipse cx={x} cy={y} rx={Math.max(0, ww / 2 - 14)} ry={Math.max(0, hh / 2 - 14)} fill="#25160C" />
      <circle cx={x} cy={y} r={Math.min(ww, hh) * 0.3} fill="#FF9A3C" opacity={0.1 + 0.05 * Math.sin(t * 9)} />
      {Array.from({ length: obreros }, (_, i) => {
        const an = (i / obreros) * Math.PI * 2 + sem, ex = x + Math.cos(an) * (ww / 2 - 30), ey = y + Math.sin(an) * (hh / 2 - 30) * 0.8;
        return <Aldeano key={i} x={ex} y={ey + 30} s={1.5} t={t} sem={sem + i * 1.3} pose="pica" espejo={Math.cos(an) > 0} />;
      })}
      {Array.from({ length: 14 }, (_, i) => { const q = (t * 1.4 + i / 14 + sem) % 1; const an = i * 2.3 + sem; return <rect key={i} x={x + Math.cos(an) * ww * 0.45 + Math.cos(an) * q * 60} y={y + Math.sin(an) * hh * 0.4 + q * q * 90} width={9} height={7} fill="#EADBB8" opacity={1 - q} transform={`rotate(${q * 400} ${x} ${y})`} />; })}
    </g>
  );
};

export const DerRoca: React.FC<P> = () => {
  const { t, a } = useReloj();
  const T = TDR.roca;
  const k = easeOut((t - a(T.crece)) / a(T.creceDur));
  const seca = easeInOut((t - a(T.seca)) / a(3.2));
  const top = (t0: number) => clamp((t - a(t0)) / 0.4) * (1 - clamp((t - a(t0) - 1.6) / 0.4));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, background: "#150D07" }}>
      <Camara yc={620} zoom={1.0}>
        <RocaFondo y0={-400} y1={1700} x0={-200} x1={1300} fresca={1 - seca} />
        <Excavacion x={540} y={640} w={960} h={520} k={k} t={t} sem={0.5} obreros={6} />
        <Excavacion x={200} y={160} w={420} h={260} k={clamp(k * 1.2 - 0.1)} t={t} sem={1.7} obreros={3} />
        <Excavacion x={880} y={1180} w={460} h={280} k={clamp(k * 1.2 - 0.15)} t={t} sem={2.9} obreros={3} />
        <Excavacion x={170} y={1180} w={300} h={220} k={clamp(k * 1.3 - 0.3)} t={t} sem={4.1} obreros={2} />
        <Excavacion x={900} y={170} w={340} h={220} k={clamp(k * 1.3 - 0.25)} t={t} sem={5.3} obreros={2} />
        {/* un topo curioso */}
        <g transform="translate(1000 560)" opacity={top(T.topo)}><ellipse cx={0} cy={0} rx={34} ry={22} fill="#4A3A30" /><circle cx={-26} cy={-4} r={4} fill="#fff" /><circle cx={-27} cy={-4} r={1.8} fill="#111" /><ellipse cx={-38} cy={2} rx={8} ry={6} fill="#E8A0A0" /></g>
        <g transform="translate(100 760)" opacity={top(T.topo2)}><ellipse cx={0} cy={0} rx={34} ry={22} fill="#4A3A30" /><circle cx={26} cy={-4} r={4} fill="#fff" /><circle cx={27} cy={-4} r={1.8} fill="#111" /><ellipse cx={38} cy={2} rx={8} ry={6} fill="#E8A0A0" /></g>
      </Camara>
      <Polvo t={t} n={60} color="#EADBB8" vel={1.6} />
      <Vineta t={t} fuerza={0.55} />
    </svg>
  );
};

/* ───────────── der-niveles-a/b/c ───────────── */

const Descenso: React.FC<{ yc: number; zoom: number; t: number; extra?: React.ReactNode }> = ({ yc, zoom, t, extra }) => {
  const h = (H / 2) / zoom;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, background: "#150D07" }}>
      <Camara yc={yc} zoom={zoom}>
        <RocaFondo y0={-100} y1={4700} />
        <Ciudad t={t} yMin={yc - h} yMax={yc + h} />
        {extra}
      </Camara>
      {Array.from({ length: 3 }, (_, i) => <Murcielago key={i} t={t} i={i} />)}
      <Polvo t={t} n={40} />
      <Vineta t={t} fuerza={0.62} />
      <rect x={0} y={H / 2 - 3} width={W} height={6} fill="#FFE2B0" opacity={0.06 + 0.03 * Math.sin(t * 6)} />
      <Medidor yc={yc} zoom={zoom} />
    </svg>
  );
};

export const DerNivelesA: React.FC<P> = () => {
  const { t, a, dur } = useReloj();
  const e = easeInOut((t - a(TDR.nivA.baja)) / (dur - a(1.2)));
  return <Descenso yc={lerp(330, 1330, e)} zoom={1.2 + 0.03 * Math.sin(t)} t={t} />;
};

export const DerNivelesB: React.FC<P> = () => {
  const { t, a, dur } = useReloj();
  const e = easeInOut((t - a(TDR.nivB.baja)) / (dur - a(1.2)));
  return <Descenso yc={lerp(1330, 2560, e)} zoom={1.2 + 0.03 * Math.sin(t)} t={t} />;
};

export const DerNivelesC: React.FC<P> = () => {
  const { t, a } = useReloj();
  const T = TDR.nivC;
  const e1 = easeInOut((t - a(T.iglesia)) / a(1.8)), e2 = easeInOut((t - a(T.zoomIglesia + 1.2)) / a(3.8));
  const yc = t < a(T.zoomIglesia + 1.2) ? lerp(2560, pisoY(12) - 95, e1) : lerp(pisoY(12) - 95, 4010, e2);
  const zoom = t < a(T.zoomIglesia + 1.2) ? lerp(1.2, 1.7, e1) : lerp(1.7, 1.15, e2);
  return <Descenso yc={yc} zoom={zoom} t={t} />;
};

/* ───────────── der-aire ───────────── */

export const DerAire: React.FC<P> = () => {
  const { t, a } = useReloj();
  const T = TDR.aire;
  const sal = easeOut((t - a(T.zoomOut)) / a(1.2));
  const push = easeInOut((t - a(T.push)) / a(T.pushDur));
  const zoom = lerp(lerp(0.9, 0.46, sal), 0.86, push);
  const yc = lerp(lerp(1000, 1900, sal), 1350, push);
  const k = clamp((t - a(T.frio)) / a(4.0));
  const calor = clamp((t - a(T.caliente)) / a(T.calorDur));
  const h = (H / 2) / zoom;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, background: "#150D07" }}>
      <Camara yc={yc} zoom={zoom}>
        <RocaFondo y0={-100} y1={4700} />
        <Superficie t={t} />
        <Galerias t={t} yMin={yc - h} yMax={yc + h} />
        <Ciudad t={t} yMin={yc - h} yMax={yc + h} />
        {/* tintes de temperatura: azul junto al pozo central, naranja en los laterales */}
        <rect x={510} y={0} width={60} height={4300} fill="#6FD6FF" opacity={0.22 * clamp(k * 3)} />
        <rect x={46} y={0} width={28} height={3300} fill="#FF8A3D" opacity={0.28 * calor} />
        <rect x={1006} y={0} width={28} height={3400} fill="#FF8A3D" opacity={0.28 * calor} />
        <Aire t={t} k={k} calor={calor} escala={1 / Math.max(0.5, zoom) * 0.9} />
        {/* viento frío que entra por la boca y calor que sale */}
        {Array.from({ length: 8 }, (_, i) => { const q = (t * 0.5 + i / 8) % 1; return <path key={i} d={`M ${540 + Math.sin(i * 5) * 60} ${-300 + q * 300} l 0 40 m -12 -14 l 12 14 l 12 -14`} stroke="#6FD6FF" strokeWidth={9} fill="none" strokeLinecap="round" opacity={clamp(k * 3) * (1 - q)} />; })}
        {[60, 1020].map((x, j) => Array.from({ length: 6 }, (_, i) => { const q = (t * 0.45 + i / 6 + j * 0.2) % 1; return <circle key={`${j}${i}`} cx={x + Math.sin(q * 9 + i) * 24} cy={-q * 280} r={14 + q * 36} fill="#FF9A5A" opacity={0.4 * calor * (1 - q)} />; }))}
      </Camara>
      <Polvo t={t} n={30} color="#CFE8F2" />
      <Vineta t={t} fuerza={0.5} />
      <Medidor yc={yc} zoom={zoom} pastilla={false} />
    </svg>
  );
};
