/**
 * «La dopamina NO es la molécula del placer» (SINAPSIS · voz de CapCut) · escenas 1/2
 *   dop-gancho       la molécula en 3D gira y se tacha «placer»
 *   dop-experimento  jugo inesperado: la neurona dispara una ráfaga (esquema de Schultz)
 *   dop-prediccion   tres casos: inesperado dispara, ya previsto no, y si no llega lo esperado, cae
 */
import React from "react";
import { DOP, TDP } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Estudio, Frases, MONOF, RE } from "./real-kit";
import { Fuente } from "./real1";
import { Chip } from "./med1";
import { DP, FilaPicos, Molecula } from "./dop-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── dop-gancho ───────────── */

export const DopGancho: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const G = TDP.gancho;
  const ent = spr(f, a(G.mol), { damping: 15, stiffness: 90, mass: 1 });
  const giro = -20 + 55 * Math.sin(t * 0.9);
  const sello = spr(f, a(G.sello), { damping: 11, stiffness: 200, mass: 0.6 });
  const tacha = clamp((t - a(G.sello)) / 0.35);
  return (
    <Estudio piso={1560} resplandor={0.55}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={540} cy={1030} rx={360} ry={300} fill={DP.ambar} opacity={0.08 + 0.05 * Math.sin(t * 2)} />
        <Molecula x={540} y={1030} s={1.38 * ent} giro={giro} inclina={-14} halo={0.5 + 0.5 * Math.sin(t * 2.4)} />
        <g opacity={clamp((t - a(1.2)) / 0.5)}>
          <text x={540} y={1420} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={130} fill="#E8EEF6" letterSpacing="0.04em">PLACER</text>
          <line x1={540 - 290 * tacha} y1={1380} x2={540 + 290 * tacha} y2={1380} stroke={DP.rojo} strokeWidth={14} strokeLinecap="round" />
          <g transform={`translate(860 1330) scale(${sello})`} opacity={clamp(sello * 1.5)}>
            <circle r={44} fill="#06101C" fillOpacity={0.9} stroke={DP.rojo} strokeWidth={6} />
            <path d="M -16 -16 L 16 16 M 16 -16 L -16 16" stroke={DP.rojo} strokeWidth={8} strokeLinecap="round" />
          </g>
        </g>
      </svg>
      <Frases frases={[{ t: G.t1, texto: "la dopamina", px: 104 }, { t: G.t2, texto: "NO es la\nmolécula\ndel placer", color: DP.ambar, px: 86 }]} y={440} id="dop-gancho-t" />
    </Estudio>
  );
};

/* ───────────── dop-experimento ───────────── */

export const DopExperimento: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const E = TDP.experimento;
  const ent = spr(f, a(E.setup), { damping: 15, stiffness: 100, mass: 0.9 });
  const caida = clamp((t - a(E.gota)) / 0.7);
  const gotaY = lerp(600, 905, caida * caida);
  const llego = t >= a(E.gota) + 0.7;
  const nivel = 0.3 + 0.42 * easeOut((t - a(E.gota) - 0.7) / 0.9);
  const flash = clamp((t - a(E.rafaga)) / 0.2) * clamp(1 - (t - a(E.rafaga) - 0.2) / 0.9);
  const revela = clamp((t - a(E.rafaga) + 0.9) / a(2.4));
  const CUP = { x: 770, y0: 780, y1: 1010 };
  const fillY = CUP.y1 - (CUP.y1 - CUP.y0) * nivel;
  return (
    <Estudio piso={1560} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="dop-jugo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFC28A" /><stop offset="1" stopColor="#E0651B" /></linearGradient>
          <linearGradient id="dop-vidrio" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0.35" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.06" /><stop offset="1" stopColor="#fff" stopOpacity="0.2" /></linearGradient>
          <clipPath id="dop-vaso"><path d={`M ${CUP.x - 85} ${CUP.y0} L ${CUP.x + 85} ${CUP.y0} L ${CUP.x + 62} ${CUP.y1} L ${CUP.x - 62} ${CUP.y1} Z`} /></clipPath>
        </defs>
        {/* neurona dopaminérgica */}
        <g opacity={ent} transform="translate(290 880)">
          <circle r={110 + 40 * flash} fill={DP.neurona} opacity={0.1 + 0.4 * flash} />
          <circle r={64} fill="#2A3E9E" stroke={DP.neuronaClara} strokeWidth={4} />
          <circle r={64} fill="url(#dop-vidrio)" />
          <circle r={24} fill="#0B1534" />
          <ellipse cx={-20} cy={-26} rx={22} ry={12} fill="#fff" opacity={0.5} transform="rotate(-30 -20 -26)" />
          {[200, 245, 300, 340, 20, 70, 120, 160].map((g, i) => <path key={i} d={`M ${Math.cos((g * Math.PI) / 180) * 60} ${Math.sin((g * Math.PI) / 180) * 60} q ${Math.cos(((g + 20) * Math.PI) / 180) * 50} ${Math.sin(((g + 20) * Math.PI) / 180) * 50} ${Math.cos((g * Math.PI) / 180) * 110} ${Math.sin((g * Math.PI) / 180) * 110}`} stroke={DP.neurona} strokeWidth={5} fill="none" strokeLinecap="round" />)}
        </g>
        {/* grifo, gota y vaso */}
        <g opacity={ent}>
          <rect x={CUP.x - 12} y={560} width={24} height={60} rx={6} fill="#C3CEDA" />
          <path d={`M ${CUP.x - 85} ${CUP.y0} L ${CUP.x - 62} ${CUP.y1} L ${CUP.x + 62} ${CUP.y1} L ${CUP.x + 85} ${CUP.y0}`} fill="none" stroke="#DDE8F4" strokeOpacity={0.7} strokeWidth={5} strokeLinejoin="round" />
          <g clipPath="url(#dop-vaso)">
            <rect x={CUP.x - 90} y={fillY} width={180} height={CUP.y1 - fillY + 4} fill="url(#dop-jugo)" opacity={0.95} />
            <ellipse cx={CUP.x} cy={fillY} rx={80} ry={8} fill="#FFD9B0" opacity={0.9} />
            <rect x={CUP.x - 80} y={CUP.y0} width={34} height={CUP.y1 - CUP.y0} fill="url(#dop-vidrio)" />
          </g>
          {!llego && caida > 0 && <path d={`M ${CUP.x} ${gotaY - 24} C ${CUP.x + 16} ${gotaY} ${CUP.x + 16} ${gotaY + 18} ${CUP.x} ${gotaY + 18} C ${CUP.x - 16} ${gotaY + 18} ${CUP.x - 16} ${gotaY} ${CUP.x} ${gotaY - 24} Z`} fill={DP.jugo} stroke={DP.jugoClaro} strokeWidth={2} />}
          {llego && t < a(E.gota) + 1.2 && <ellipse cx={CUP.x} cy={fillY} rx={30 + 80 * ((t - a(E.gota) - 0.7) / 0.5)} ry={6} fill="none" stroke={DP.jugoClaro} strokeWidth={3} opacity={1 - (t - a(E.gota) - 0.7) / 0.5} />}
        </g>
        <g transform="translate(0 0)" opacity={ent}>
          <FilaPicos x={160} y={1160} w={760} h={190} modo="A" revela={revela} titulo="disparos de la neurona" />
        </g>
      </svg>
      <Frases frases={[{ t: 0.3, texto: "jugo\ninesperado", px: 96 }, { t: E.rafaga - 0.1, texto: "la neurona\ndispara", color: DP.neurona, px: 96 }]} y={410} id="dop-exp-t" />
      <div data-texto="dop-exp-et" style={{ position: "absolute", left: 140, top: 1048, width: 300, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 24, color: DP.neuronaClara, opacity: ent }}>neurona de<br />dopamina</div>
      <Chip texto="el premio llega por sorpresa" x={W / 2} y={1420} color={DP.jugoClaro} opacidad={clamp((t - a(E.chip)) / 0.5)} ancho={640} id="dop-exp-chip" />
      <Fuente texto={`Esquema basado en Schultz, Dayan y Montague, Science ${DOP.schultzAnio} (monos) · trazos ilustrativos`} y={1486} delay={E.chip} />
    </Estudio>
  );
};

/* ───────────── dop-prediccion ───────────── */

export const DopPrediccion: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const Pq = TDP.prediccion;
  const rev = (t0: number): number => clamp((t - a(t0)) / a(Pq.dur));
  const ent = (t0: number): number => spr(f, a(t0 - 0.2), { damping: 15, stiffness: 120, mass: 0.8 });
  return (
    <Estudio piso={1560} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(ent(Pq.A) * 1.4)}><FilaPicos x={160} y={660} w={760} h={160} modo="A" revela={rev(Pq.A)} titulo="1 · el jugo llega por sorpresa" semilla={4} /></g>
        <g opacity={clamp(ent(Pq.B) * 1.4)}><FilaPicos x={160} y={900} w={760} h={160} modo="B" revela={rev(Pq.B)} titulo="2 · ya aprendió: la luz lo anuncia" semilla={9} /></g>
        <g opacity={clamp(ent(Pq.C) * 1.4)}><FilaPicos x={160} y={1140} w={760} h={160} modo="C" revela={rev(Pq.C)} titulo="3 · hay luz, pero no llega el jugo" semilla={15} color="#9B7CFF" /></g>
      </svg>
      <Frases frases={[{ t: 0.3, texto: "lo inesperado\ndispara", px: 80 }, { t: Pq.B, texto: "lo previsto\nno", px: 80, color: DP.neuronaClara }, { t: Pq.C, texto: "si falla,\ncae", px: 80, color: DP.rojo }]} y={440} id="dop-pre-t" />
      <Chip texto="error de predicción de la recompensa" x={W / 2} y={1410} color={DP.ambarClaro} opacidad={clamp((t - a(Pq.chip)) / 0.5)} ancho={780} id="dop-pre-chip" />
      <Fuente texto={`Schultz, Dayan y Montague, Science ${DOP.schultzAnio} · esquema ilustrativo, no datos reales`} y={1486} delay={Pq.chip} />
    </Estudio>
  );
};
