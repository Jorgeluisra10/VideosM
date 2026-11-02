/**
 * «¿Por qué se te duerme el pie?» (SINAPSIS · cuerpo cotidiano · voz de CapCut) · escenas 1/2
 *   pie-gancho   la pierna de cristal se apaga y salen chispas de hormigueo
 *   pie-mito     no es solo la sangre: es un nervio aplastado
 *   pie-nervio   cruzar las piernas presiona el nervio peroneo bajo la rodilla
 */
import React from "react";
import { PIE, TPI } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Estudio, Frases, MONOF, RE } from "./real-kit";
import { Fuente } from "./real1";
import { Chip } from "./med1";
import { PC, Pierna } from "./pie-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── pie-gancho ───────────── */

export const PieGancho: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const G = TPI.gancho;
  const ent = spr(f, a(G.pierna), { damping: 16, stiffness: 90, mass: 1 });
  const apaga = clamp((t - a(G.chispas - 0.2)) / 0.5);
  const chispas = clamp((t - a(G.chispas)) / 0.8);
  return (
    <Estudio piso={1560} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Pierna x={68} y={40} s={1} t={t} opacidad={ent} apagado={apaga} chispas={chispas} pulsos={apaga < 0.5} />
        {[0, 1, 2].map((i) => {
          const u = ((t * 0.5 + i / 3) % 1);
          return <text key={i} x={720 + u * 70 + i * 14} y={1180 - u * 150} fontFamily="Inter, sans-serif" fontWeight={800} fontSize={54 * (0.6 + 0.6 * u)} fill={PC.hielo} opacity={Math.sin(u * Math.PI) * apaga} stroke="#0B1830" strokeWidth={1.5}>Z</text>;
        })}
      </svg>
      <Frases frases={[{ t: G.t1, texto: "¿por qué se te\nduerme el pie?", px: 94 }]} y={440} id="pie-gancho-t" />
      <Chip texto="parestesia" x={W / 2} y={1440} color={PC.magenta} opacidad={clamp((t - a(G.chip)) / 0.5)} ancho={340} id="pie-gancho-chip" />
    </Estudio>
  );
};

/* ───────────── pie-mito ───────────── */

export const PieMito: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const M = TPI.mito;
  const ent = spr(f, a(M.paneles), { damping: 15, stiffness: 100, mass: 0.9 });
  const aprieta = easeInOut((t - a(M.nervio)) / 0.9);
  const sangre = clamp((t - a(M.sangre)) / 0.5);
  const mito = clamp((t - a(M.sangre + 0.9)) / 0.4);
  const real = clamp((t - a(M.nervio + 0.8)) / 0.4);
  const flujo = (i: number): number => ((t * 0.55 + i / 6) % 1);
  return (
    <Estudio piso={1560} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={ent}>
          <rect x={90} y={610} width={410} height={650} rx={32} fill="#08101E" stroke={PC.rojo} strokeOpacity={0.45} strokeWidth={2} />
          <rect x={580} y={610} width={410} height={650} rx={32} fill="#08101E" stroke={PC.nervio} strokeOpacity={0.5} strokeWidth={2} />
          <text x={295} y={660} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={30} fill="#FF9A8E">SANGRE</text>
          <text x={785} y={660} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={30} fill={PC.nervioClaro}>NERVIO</text>
        </g>
        {/* vaso con glóbulos */}
        <g opacity={sangre * ent}>
          <rect x={250} y={700} width={90} height={480} rx={45} fill="#5A0F0A" stroke="#FF9A8E" strokeOpacity={0.6} strokeWidth={3} />
          {Array.from({ length: 6 }, (_, i) => {
            const u = flujo(i);
            return <ellipse key={i} cx={295 + 10 * Math.sin(u * 9 + i)} cy={1160 - u * 440} rx={24} ry={14} fill="#E5392B" stroke="#FF9A8E" strokeWidth={2} opacity={Math.sin(u * Math.PI)} />;
          })}
        </g>
        {/* nervio comprimido */}
        <g opacity={ent}>
          <rect x={740} y={700} width={90} height={480} rx={45} fill="#2B2410" stroke={PC.nervio} strokeOpacity={0.6} strokeWidth={3} />
          <rect x={780} y={720} width={10} height={440} rx={5} fill={PC.nervio} opacity={0.9} />
          {Array.from({ length: 5 }, (_, i) => <rect key={i} x={752} y={722 + i * 90} width={66} height={72} rx={26} fill="#E9E1CC" opacity={0.9} transform={`translate(${aprieta * (i === 2 ? 0 : 0)} 0)`} />)}
          {/* pinzas laterales */}
          <path d={`M ${640 + 70 * aprieta} 900 L 740 930 L 740 970 L ${640 + 70 * aprieta} 1000 Z`} fill="#8FA3B8" stroke="#E8F0F8" strokeWidth={3} />
          <path d={`M ${930 - 70 * aprieta} 900 L 830 930 L 830 970 L ${930 - 70 * aprieta} 1000 Z`} fill="#8FA3B8" stroke="#E8F0F8" strokeWidth={3} />
        </g>
        {mito > 0 && (
          <g transform={`translate(295 1230) scale(${mito})`}>
            <circle r={36} fill="#06101C" fillOpacity={0.92} stroke={PC.rojo} strokeWidth={5} />
            <path d="M -13 -13 L 13 13 M 13 -13 L -13 13" stroke={PC.rojo} strokeWidth={7} strokeLinecap="round" />
          </g>
        )}
        {real > 0 && (
          <g transform={`translate(785 1230) scale(${real})`}>
            <circle r={36} fill="#06101C" fillOpacity={0.92} stroke={PC.verde} strokeWidth={5} />
            <path d="M -15 2 L -4 13 L 16 -12" fill="none" stroke={PC.verde} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </svg>
      <Frases frases={[{ t: 0.3, texto: "no es solo\nla sangre", px: 92 }, { t: M.nervio, texto: "es un nervio\naplastado", color: PC.nervio, px: 92 }]} y={440} id="pie-mito-t" />
      <Chip texto="la sangre influye, pero no explica todo" x={W / 2} y={1400} color={PC.hielo} opacidad={clamp((t - a(M.chip)) / 0.5)} ancho={830} id="pie-mito-chip" />
    </Estudio>
  );
};

/* ───────────── pie-nervio ───────────── */

export const PieNervio: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const N = TPI.nervio;
  const ent = spr(f, a(N.pierna), { damping: 16, stiffness: 90, mass: 1 });
  const etq = clamp((t - a(N.nervio)) / 0.5);
  const presion = easeInOut((t - a(N.presion)) / 1.0);
  const apaga = clamp((t - a(N.apaga)) / 0.6);
  return (
    <Estudio piso={1560} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Pierna x={-10} y={40} s={1} t={t} opacidad={ent} etiquetas={etq} presion={presion} apagado={apaga} pulsos />
      </svg>
      <Frases frases={[{ t: 0.3, texto: "cruzas\nlas piernas", px: 90 }, { t: N.presion - 0.1, texto: "y aprietas\nun nervio", color: PC.nervio, px: 90 }]} y={430} id="pie-ner-t" />
      <Chip texto="justo debajo de la rodilla" x={W / 2} y={1445} color={PC.nervioClaro} opacidad={clamp((t - a(N.chip)) / 0.5)} ancho={640} id="pie-ner-chip" />
      <Fuente texto="Esquema: nervio peroneo común (fibular) a la altura de la cabeza del peroné" y={1490} delay={N.chip} />
    </Estudio>
  );
};
