/**
 * «La dopamina NO es la molécula del placer» (SINAPSIS · voz de CapCut) · escenas 2/2
 *   dop-querer  querer no es disfrutar: menos dopamina apaga el querer y deja el agrado
 *   dop-rutas   tres vías desde el mesencéfalo: mueve, desea y decide
 *   dop-debate  la balanza: ¿enseña o motiva?
 *   dop-cierre  no es placer: es la chispa de querer
 */
import React from "react";
import { DOP, TDP } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Estudio, Frases, MONOF, RE } from "./real-kit";
import { Fuente } from "./real1";
import { Chip } from "./med1";
import { Cerebro } from "./glf-kit";
import { DP, Molecula } from "./dop-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── dop-querer ───────────── */

const Barra: React.FC<{ x: number; y: number; w: number; v: number; color: string; titulo: string; icono: "flecha" | "corazon" }> = ({ x, y, w, v, color, titulo, icono }) => (
  <g>
    <text x={x + 62} y={y - 14} fontFamily={MONOF} fontWeight={700} fontSize={26} fill={color}>{titulo}</text>
    {icono === "flecha" ? (
      <path d={`M ${x + 4} ${y + 18} L ${x + 46} ${y + 18} M ${x + 30} ${y + 2} L ${x + 46} ${y + 18} L ${x + 30} ${y + 34}`} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d={`M ${x + 26} ${y + 36} C ${x - 8} ${y + 12} ${x + 8} ${y - 8} ${x + 26} ${y + 8} C ${x + 44} ${y - 8} ${x + 60} ${y + 12} ${x + 26} ${y + 36} Z`} fill={color} />
    )}
    <rect x={x + 62} y={y} width={w} height={34} rx={17} fill="#0C1428" stroke={color} strokeOpacity={0.4} strokeWidth={2} />
    <rect x={x + 66} y={y + 4} width={Math.max(0, (w - 8) * clamp(v))} height={26} rx={13} fill={color} />
    <rect x={x + 66} y={y + 7} width={Math.max(0, (w - 8) * clamp(v))} height={7} rx={3.5} fill="#fff" opacity={0.3} />
  </g>
);

const Vial: React.FC<{ x: number; y: number; nivel: number; etiqueta: string }> = ({ x, y, nivel, etiqueta }) => (
  <g>
    <rect x={x - 38} y={y} width={76} height={210} rx={22} fill="#0C1428" stroke={DP.hielo} strokeOpacity={0.5} strokeWidth={3} />
    <rect x={x - 32} y={y + 6 + 198 * (1 - clamp(nivel))} width={64} height={198 * clamp(nivel)} rx={16} fill={DP.ambar} opacity={0.92} />
    <rect x={x - 28} y={y + 10} width={12} height={190} rx={6} fill="#fff" opacity={0.15} />
    <text x={x} y={y + 246} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={22} fill={DP.ambarClaro}>{etiqueta}</text>
  </g>
);

export const DopQuerer: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const Q = TDP.querer;
  const ent = spr(f, a(Q.menos - 0.2), { damping: 15, stiffness: 110, mass: 0.8 });
  const ent2 = spr(f, a(Q.mas - 0.2), { damping: 15, stiffness: 110, mass: 0.8 });
  const kMenos = easeInOut((t - a(Q.menos)) / a(Q.menosDur));
  const kMas = easeInOut((t - a(Q.mas)) / a(Q.masDur));
  const nivA = lerp(0.62, 0.05, kMenos), nivB = lerp(0.62, 1, kMas);
  const querA = nivA, querB = nivB;
  const gustoA = 0.82 - 0.02 * kMenos, gustoB = 0.82 + 0.02 * kMas;
  return (
    <Estudio piso={1560} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(ent * 1.4)}>
          <rect x={110} y={590} width={860} height={330} rx={30} fill="#08101E" stroke={DP.rojo} strokeOpacity={0.45} strokeWidth={2} />
          <text x={140} y={632} fontFamily={MONOF} fontWeight={700} fontSize={28} fill={DP.rojo}>MENOS dopamina · ratas</text>
          <Vial x={210} y={660} nivel={nivA} etiqueta="" />
          <Barra x={330} y={700} w={540} v={querA} color={DP.ambar} titulo="QUERER" icono="flecha" />
          <Barra x={330} y={820} w={540} v={gustoA} color={DP.rosa} titulo="DISFRUTAR" icono="corazon" />
        </g>
        <g opacity={clamp(ent2 * 1.4)}>
          <rect x={110} y={960} width={860} height={330} rx={30} fill="#08101E" stroke={DP.verde} strokeOpacity={0.45} strokeWidth={2} />
          <text x={140} y={1002} fontFamily={MONOF} fontWeight={700} fontSize={28} fill={DP.verde}>MÁS dopamina · ratones</text>
          <Vial x={210} y={1030} nivel={nivB} etiqueta="" />
          <Barra x={330} y={1070} w={540} v={querB} color={DP.ambar} titulo="QUERER" icono="flecha" />
          <Barra x={330} y={1190} w={540} v={gustoB} color={DP.rosa} titulo="DISFRUTAR" icono="corazon" />
        </g>
      </svg>
      <Frases frases={[{ t: 0.3, texto: "menos dopamina:\nmenos querer", px: 74 }, { t: Q.mas, texto: "más dopamina:\nmás querer", px: 74, color: DP.ambar }]} y={440} id="dop-que-t" />
      <Chip texto="el disfrute casi no cambia" x={W / 2} y={1385} color={DP.rosa} opacidad={clamp((t - a(Q.chip)) / 0.5)} ancho={640} id="dop-que-chip" />
      <Fuente texto={`Berridge y Robinson, Am Psychol ${DOP.berridgeAnio} · Pecina et al., ${DOP.pecinaAnio} · esquema simplificado`} y={1486} delay={Q.chip} />
    </Estudio>
  );
};

/* ───────────── dop-rutas ───────────── */

const CX = 540, CY = 940, S = 1.3;
const mundo = (l: [number, number]): [number, number] => [CX + S * l[0], CY + S * l[1]];
const ORIGEN = mundo([55, 75]);
const VIAS = [
  { n: "nigroestriatal · mueve (párkinson)", c: "#4FD1FF", fin: mundo([-20, -10]), ctrl: [mundo([50, 20]), mundo([20, -30])] as [number, number][] },
  { n: "mesolímbica · desea", c: DP.ambar, fin: mundo([-125, 40]), ctrl: [mundo([10, 110]), mundo([-80, 90])] as [number, number][] },
  { n: "mesocortical · decide", c: "#C58BFF", fin: mundo([-200, -50]), ctrl: [mundo([0, -60]), mundo([-120, -120])] as [number, number][] },
];
const bez = (p0: [number, number], c1: [number, number], c2: [number, number], p3: [number, number], u: number): [number, number] => {
  const m = 1 - u;
  return [m ** 3 * p0[0] + 3 * m * m * u * c1[0] + 3 * m * u * u * c2[0] + u ** 3 * p3[0], m ** 3 * p0[1] + 3 * m * m * u * c1[1] + 3 * m * u * u * c2[1] + u ** 3 * p3[1]];
};

export const DopRutas: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const R = TDP.rutas;
  const ent = spr(f, a(R.cerebro), { damping: 16, stiffness: 90, mass: 1 });
  return (
    <Estudio piso={1560} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Cerebro x={CX} y={CY} s={S * ent} luz={0.3} />
        {VIAS.map((v, i) => {
          const k = clamp((t - a(R.via(i))) / 0.8);
          const d = `M ${ORIGEN[0]} ${ORIGEN[1]} C ${v.ctrl[0][0]} ${v.ctrl[0][1]} ${v.ctrl[1][0]} ${v.ctrl[1][1]} ${v.fin[0]} ${v.fin[1]}`;
          const u = ((t - a(R.via(i))) * 0.6) % 1;
          const [px, py] = bez(ORIGEN, v.ctrl[0], v.ctrl[1], v.fin, clamp(u));
          return (
            <g key={i} opacity={k}>
              <path d={d} fill="none" stroke={v.c} strokeWidth={7} strokeLinecap="round" strokeDasharray="1 16" strokeDashoffset={-t * 60} opacity={0.5} />
              <path d={d} fill="none" stroke={v.c} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
              <circle cx={v.fin[0]} cy={v.fin[1]} r={20 + 5 * Math.sin(t * 4 + i)} fill={v.c} opacity={0.3} />
              <circle cx={v.fin[0]} cy={v.fin[1]} r={9} fill={v.c} stroke="#fff" strokeWidth={2.5} />
              {k >= 0.99 && <circle cx={px} cy={py} r={11} fill="#fff" stroke={v.c} strokeWidth={4} />}
            </g>
          );
        })}
        <g opacity={ent}>
          <circle cx={ORIGEN[0]} cy={ORIGEN[1]} r={26 + 5 * Math.sin(t * 3)} fill={DP.ambar} opacity={0.3} />
          <circle cx={ORIGEN[0]} cy={ORIGEN[1]} r={13} fill={DP.ambarClaro} stroke="#fff" strokeWidth={3} />
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "una señal,", px: 100 }, { t: 1.4, texto: "tres caminos", color: DP.ambar, px: 100 }]} y={430} id="dop-rut-t" />
      {VIAS.map((v, i) => <Chip key={i} texto={v.n} x={W / 2} y={1340 + i * 70} color={v.c} opacidad={clamp((t - a(R.via(i) + 0.4)) / 0.5)} ancho={780} id={`dop-rut-c${i}`} />)}
    </Estudio>
  );
};

/* ───────────── dop-debate ───────────── */

export const DopDebate: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const D = TDP.debate;
  const ent = spr(f, a(D.balanza), { damping: 15, stiffness: 100, mass: 0.9 });
  const th = 7 * Math.sin(Math.max(0, t - a(D.oscila)) * 1.9) * Math.exp(-0.05 * Math.max(0, t - a(D.oscila))) * clamp((t - a(D.oscila)) / 0.4);
  const PX = 540, PY = 960, L = 330;
  const r = (th * Math.PI) / 180;
  const izq: [number, number] = [PX - L * Math.cos(r), PY - L * Math.sin(r)];
  const der: [number, number] = [PX + L * Math.cos(r), PY + L * Math.sin(r)];
  const pan = (p: [number, number], c: string, claro: string, txt: string): React.ReactNode => (
    <g>
      <line x1={p[0] - 90} y1={p[1]} x2={p[0] - 70} y2={p[1] + 190} stroke="#9FB0C3" strokeWidth={3} />
      <line x1={p[0] + 90} y1={p[1]} x2={p[0] + 70} y2={p[1] + 190} stroke="#9FB0C3" strokeWidth={3} />
      <path d={`M ${p[0] - 100} ${p[1] + 190} L ${p[0] + 100} ${p[1] + 190} C ${p[0] + 90} ${p[1] + 230} ${p[0] - 90} ${p[1] + 230} ${p[0] - 100} ${p[1] + 190} Z`} fill="#C3CEDA" stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />
      <circle cx={p[0]} cy={p[1] + 150} r={40} fill={c} opacity={0.3} />
      <circle cx={p[0]} cy={p[1] + 158} r={26} fill={claro} stroke="#fff" strokeWidth={3} />
      <text x={p[0]} y={p[1] + 290} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={26} fill={claro}>{txt}</text>
    </g>
  );
  return (
    <Estudio piso={1560} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={ent}>
          <rect x={PX - 14} y={PY} width={28} height={330} rx={10} fill="#8FA3B8" />
          <rect x={PX - 90} y={PY + 320} width={180} height={26} rx={10} fill="#6B7F94" />
          <g transform={`rotate(${th} ${PX} ${PY})`}>
            <rect x={PX - L - 20} y={PY - 12} width={2 * L + 40} height={24} rx={12} fill="#DCE6F1" stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />
          </g>
          <circle cx={PX} cy={PY} r={22} fill="#EAF1F8" stroke="#8FA3B8" strokeWidth={4} />
          {pan(izq, DP.neurona, DP.neuronaClara, "aprender")}
          {pan(der, DP.ambar, DP.ambarClaro, "querer")}
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "¿enseña\no motiva?", px: 104 }]} y={430} id="dop-deb-t" />
      <Chip texto="los científicos aún lo discuten" x={W / 2} y={1440} color={RE.hielo} opacidad={clamp((t - a(D.chip)) / 0.5)} ancho={700} id="dop-deb-chip" />
      <Fuente texto={`Schultz et al. ${DOP.schultzAnio} (error de predicción) · Berridge y Robinson ${DOP.berridgeAnio} (querer)`} y={1490} delay={D.chip} />
    </Estudio>
  );
};

/* ───────────── dop-cierre ───────────── */

export const DopCierre: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const C = TDP.cierre;
  const ent = spr(f, a(C.mol), { damping: 15, stiffness: 90, mass: 1 });
  const giro = 15 + 55 * Math.sin(t * 0.8 + 1);
  const chip = clamp((t - a(C.chip)) / 0.5);
  return (
    <Estudio piso={1560} resplandor={0.55}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {[0, 1, 2].map((i) => {
          const u = ((t - a(C.aros) - i * 0.5) * 0.7) % 1;
          return u > 0 && t > a(C.aros) ? <circle key={i} cx={540} cy={980} r={140 + u * 330} fill="none" stroke={DP.ambar} strokeWidth={4} opacity={(1 - u) * 0.55} /> : null;
        })}
        <Molecula x={540} y={980} s={1.15 * ent} giro={giro} inclina={-14} halo={0.6 + 0.4 * Math.sin(t * 3)} />
        <g transform="translate(860 740)" opacity={chip}>
          <path d="M 0 40 L 0 -30 M -26 -6 L 0 -34 L 26 -6" fill="none" stroke={DP.ambar} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" transform={`translate(0 ${-8 * Math.sin(t * 5)})`} />
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "no es placer:", px: 100 }, { t: C.chip - 0.6, texto: "es la chispa\nde querer", color: DP.ambar, px: 104 }]} y={430} id="dop-cie-t" />
      <Chip texto="la señal de «ve por ello»" x={W / 2} y={1420} color={DP.ambarClaro} opacidad={chip} ancho={680} id="dop-cie-chip" />
    </Estudio>
  );
};
