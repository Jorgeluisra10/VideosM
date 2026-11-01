/**
 * «¿Tu intestino es un segundo cerebro?» (SINAPSIS · sin voz) · escenas 1/2
 *   int-gancho      un tubo con su propia red de neuronas se ilumina y empuja el alimento solo
 *   int-escala      ≈ 168 millones de neuronas contra ≈ 86.000 millones: no es un segundo cerebro
 *   int-autonomo    se corta el nervio vago y el intestino sigue moviéndose
 *   int-peristalsis la onda peristáltica: el sensor detecta el bolo, detrás aprieta y delante se relaja
 */
import React from "react";
import { INT, TIN } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Estudio, Frases, MONOF, RE } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { Cerebro } from "./glf-kit";
import { IC, Intestino, cxTubo } from "./int-kit";

type P = { e: EscenaViralGuardada };
const gauss = (x: number, s: number): number => Math.exp(-(x * x) / (2 * s * s));

/* ───────────── int-gancho ───────────── */

export const IntGancho: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const G = TIN.gancho;
  const ent = spr(f, a(G.tubo), { damping: 16, stiffness: 90, mass: 1 });
  const u = clamp((t - a(0.9)) / a(3.2));
  const bolo = lerp(600, 1300, easeInOut(u));
  const luz = (y: number): number => {
    const ign = clamp((t - a(G.red) - ((y - 560) / 780) * G.redDur) / 0.45);
    return ign * (0.45 + 0.55 * gauss(y - bolo, 110));
  };
  return (
    <Estudio piso={1560} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Intestino y0={560} y1={1340} R0={84} bolo={bolo} onda k={ent} luzNeuronas={luz} />
      </svg>
      <Frases frases={[{ t: G.t1, texto: "tu intestino", px: 100 }, { t: G.t2, texto: "se maneja\nsolo", color: IC.neurona, px: 108 }]} y={440} id="int-gancho-t" />
      <Chip texto="sistema nervioso entérico" x={W / 2} y={1440} color={IC.neuronaClara} opacidad={clamp((t - a(G.chip)) / 0.5)} ancho={560} id="int-gancho-chip" />
    </Estudio>
  );
};

/* ───────────── int-escala ───────────── */

export const IntEscala: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const E = TIN.escala;
  const kC = easeOut((t - a(E.cerebro)) / a(E.barraDur));
  const kI = easeOut((t - a(E.intest)) / a(0.6));
  const cuenta = easeOut((t - a(E.cuenta)) / a(E.cuentaDur));
  const sello = spr(f, a(E.chip), { damping: 11, stiffness: 190, mass: 0.6 });
  const wInt = Math.max(5, 840 * (INT.neuronasEnt / INT.neuronasCer));
  return (
    <Estudio piso={1560} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="int-bar-c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#C58BFF" /><stop offset="1" stopColor="#FF9AD0" /></linearGradient>
        </defs>
        <rect x={120} y={700} width={840} height={64} rx={20} fill="#0C1428" stroke={IC.hielo} strokeOpacity={0.25} strokeWidth={2} />
        <rect x={124} y={704} width={Math.max(0, 832 * kC)} height={56} rx={16} fill="url(#int-bar-c)" />
        <rect x={124} y={708} width={Math.max(0, 832 * kC)} height={12} rx={6} fill="#fff" opacity={0.3} />
        <rect x={120} y={1040} width={840} height={64} rx={20} fill="#0C1428" stroke={IC.hielo} strokeOpacity={0.25} strokeWidth={2} />
        <g opacity={kI}>
          <rect x={124} y={1044} width={wInt} height={56} rx={3} fill={IC.neurona} />
          <circle cx={124 + wInt / 2} cy={1072} r={30 + 6 * Math.sin(t * 5)} fill={IC.neurona} opacity={0.25} />
          <path d={`M ${124 + wInt + 30} ${1072} L ${124 + wInt + 90} ${1072}`} stroke={IC.neuronaClara} strokeWidth={4} strokeLinecap="round" />
          <text x={124 + wInt + 104} y={1082} fontFamily={MONOF} fontWeight={700} fontSize={30} fill={IC.neuronaClara}>← esta rayita</text>
        </g>
      </svg>
      <div data-texto="int-esc-l1" style={{ position: "absolute", left: 120, top: 656, fontFamily: MONOF, fontWeight: 700, fontSize: 28, color: "#EBD3FF", opacity: kC }}>CEREBRO · neuronas</div>
      <div data-texto="int-esc-l2" style={{ position: "absolute", left: 120, top: 996, fontFamily: MONOF, fontWeight: 700, fontSize: 28, color: IC.neuronaClara, opacity: kI }}>INTESTINO · neuronas entéricas</div>
      <Dato valor={Math.round(INT.neuronasCer * easeOut((t - a(E.cerebro + 0.2)) / a(1.6)))} x={120} y={850} px={76} digitos={5} alinear="left" sufijo=" millones" color="#EBD3FF" id="int-esc-d1" opacidad={kC} />
      <Dato valor={Math.round(INT.neuronasEnt * cuenta)} x={120} y={1190} px={76} digitos={3} alinear="left" sufijo=" millones" color={IC.neuronaClara} id="int-esc-d2" opacidad={kI} />
      <Frases frases={[{ t: 0.2, texto: "¿un segundo\ncerebro?", px: 100 }, { t: E.chip - 0.4, texto: "no: es una red", color: IC.neurona, px: 100 }]} y={430} id="int-esc-t" />
      <Chip texto="≈ 0,2 % de las neuronas del cerebro" x={W / 2} y={1340} color={IC.oro} opacidad={sello} ancho={760} id="int-esc-c1" />
      <Chip texto="similar a la médula espinal" x={W / 2} y={1410} color={IC.hielo} opacidad={clamp((t - a(E.chip + 0.3)) / 0.5)} ancho={520} id="int-esc-c2" />
      <Fuente texto={`Michel et al., Neurogastroenterol Motil ${INT.michelAnio} (≈ 168 M, humanos; estimación) · Azevedo et al., J Comp Neurol ${INT.azevedoAnio}`} y={1486} delay={1.5} />
    </Estudio>
  );
};

/* ───────────── int-autonomo ───────────── */

export const IntAutonomo: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const A = TIN.autonomo;
  const ent = spr(f, a(A.cerebro), { damping: 16, stiffness: 90, mass: 1 });
  const cable = clamp((t - a(A.cable)) / 0.6);
  const corte = t >= a(A.corte);
  const brote = clamp((t - a(A.corte)) / 0.6);
  const tubo = spr(f, a(A.cable), { damping: 16, stiffness: 90, mass: 1 });
  const bolo = 1010 + ((Math.max(0, t - a(1.0)) * 150) % 330);
  const luz = (y: number): number => 0.35 + 0.65 * gauss(y - bolo, 90);
  const X = 573, Y0 = 790, Y1 = 985, YC = 880;
  const lat = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 1.1 * t)), 3);
  return (
    <Estudio piso={1560} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Cerebro x={540} y={690} s={0.5 * ent} luz={corte ? 0.2 : 0.35 + 0.3 * lat} />
        {/* nervio vago: sube del tronco al intestino */}
        <g opacity={cable}>
          <path d={`M ${X} ${Y0} L ${X} ${corte ? YC - 26 : Y1}`} stroke="#E7D7A8" strokeWidth={18} strokeLinecap="round" />
          <path d={`M ${X - 4} ${Y0} L ${X - 4} ${corte ? YC - 26 : Y1}`} stroke="#fff" strokeOpacity={0.45} strokeWidth={4} strokeLinecap="round" />
          {corte && <path d={`M ${X} ${YC + 26} L ${X} ${Y1}`} stroke="#E7D7A8" strokeWidth={18} strokeLinecap="round" opacity={0.85} />}
        </g>
        {corte && (
          <g transform={`translate(${X} ${YC})`}>
            {Array.from({ length: 9 }, (_, i) => { const ang = (i / 9) * Math.PI * 2; const r = 20 + 60 * brote; return <line key={i} x1={Math.cos(ang) * r * 0.5} y1={Math.sin(ang) * r * 0.5} x2={Math.cos(ang) * r} y2={Math.sin(ang) * r} stroke="#FFD84A" strokeWidth={5} strokeLinecap="round" opacity={1 - brote} />; })}
            <g opacity={clamp(brote * 2)}>
              <circle r={34} fill="#06101C" fillOpacity={0.88} stroke={IC.rojo} strokeWidth={5} />
              <path d="M -13 -13 L 13 13 M 13 -13 L -13 13" stroke={IC.rojo} strokeWidth={7} strokeLinecap="round" />
            </g>
          </g>
        )}
        <Intestino y0={990} y1={1390} R0={58} amp={18} cx0={560} bolo={bolo} onda k={tubo} luzNeuronas={luz} />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "corta el nervio", px: 92 }, { t: A.sigue, texto: "y el intestino\nsigue", color: IC.neurona, px: 100 }]} y={430} id="int-aut-t" />
      <Chip texto="reflejo peristáltico: lo coordina su red" x={W / 2} y={1450} color={IC.neuronaClara} opacidad={clamp((t - a(A.chip)) / 0.5)} ancho={800} id="int-aut-chip" />
    </Estudio>
  );
};

/* ───────────── int-peristalsis ───────────── */

export const IntPeristalsis: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const Pq = TIN.peristalsis;
  const ent = spr(f, a(Pq.tubo), { damping: 16, stiffness: 90, mass: 1 });
  const u = clamp((t - a(Pq.bolo)) / a(Pq.boloDur));
  const bolo = lerp(660, 1210, easeInOut(u));
  const luz = (y: number): number => clamp(0.25 + 0.75 * Math.max(gauss(y - bolo, 70), gauss(y - bolo + 110, 70), gauss(y - bolo - 110, 70)));
  const cx = (y: number): number => cxTubo(y);
  const ap = clamp((t - a(Pq.chip)) / 0.5);
  return (
    <Estudio piso={1560} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Intestino y0={560} y1={1300} R0={104} bolo={bolo} onda k={ent} luzNeuronas={luz} cx0={500} />
        {[[bolo - 110, IC.rojo], [bolo, IC.oro], [bolo + 110, IC.azul]].map(([y, c], i) => (
          <g key={i} opacity={ap}>
            <line x1={cx(y as number) - 40 + 0 + (500 - 540)} y1={y as number} x2={686} y2={y as number} stroke={c as string} strokeWidth={3} strokeDasharray="6 8" opacity={0.8} />
            <circle cx={686} cy={y as number} r={8} fill={c as string} />
          </g>
        ))}
      </svg>
      <Chip texto="aprieta" x={830} y={bolo - 110} color={IC.rojo} opacidad={ap} ancho={200} id="int-per-c1" />
      <Chip texto="sensor" x={830} y={bolo} color={IC.oro} opacidad={ap} ancho={200} id="int-per-c2" />
      <Chip texto="se relaja" x={830} y={bolo + 110} color={IC.azul} opacidad={ap} ancho={220} id="int-per-c3" />
      <Frases frases={[{ t: 0.2, texto: "el bolo estira\nla pared", px: 88 }, { t: 2.4, texto: "detrás aprieta,\ndelante afloja", color: IC.oro, px: 88 }]} y={410} id="int-per-t" />
      <Fuente texto="Esquema del reflejo peristáltico del sistema nervioso entérico" y={1486} delay={1.5} />
    </Estudio>
  );
};
