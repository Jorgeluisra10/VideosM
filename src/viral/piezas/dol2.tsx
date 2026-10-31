/**
 * «Tu cerebro no siente dolor» (SINAPSIS · sin voz) · escenas 2/2
 *   dol-homunculo  el cuerpo se deforma según el espacio que ocupa en la corteza (esquema de Penfield)
 *   dol-musica     un violín suena en plena operación: se protegen las manos del músico
 *   dol-cabeza     los dolores de cabeza: la banda de músculos y los vasos de las meninges
 *   dol-cierre     el cerebro recibe el dolor del cuerpo pero no tiene sensores propios
 */
import React from "react";
import { DOL, TDO } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, lerp, spr, useReloj } from "../comun";
import { Estudio, Frases, MONOF, RE } from "./real-kit";
import { Fuente } from "./real1";
import { Chip } from "./med1";
import { Cerebro, GL, ptCerebro } from "./glf-kit";
import { Capas, DK, bandaPath, puntoPoli } from "./dol-kit";

type P = { e: EscenaViralGuardada };
const pulso = (t: number, t0: number, dur = 0.5): number => { const u = (t - t0) / dur; return u > 0 && u < 1 ? Math.sin(u * Math.PI) : 0; };

/* ───────────── dol-homunculo ───────────── */

export const DolHomunculo: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const H_ = TDO.homunculo;
  const ent = spr(f, a(H_.cuerpo), { damping: 15, stiffness: 100, mass: 0.9 });
  const m = easeInOut((t - a(H_.morph)) / a(H_.morphDur));
  const cx = 540;
  const hw = 78 * (1 - 0.3 * m);
  const torsoH = 250 * (1 - 0.4 * m);
  const yLegs = 790 + torsoH;
  const lenLeg = 250 * (1 - 0.25 * m);
  const rHead = 66 * (1 + 0.25 * m);
  const k = 1 + 1.9 * m, kl = 1 + 1.5 * m;
  const hand = (d: number): [number, number] => [cx + d * 215, 985];
  const resp = 1 + 0.01 * Math.sin(t * 2);
  return (
    <Estudio piso={1560} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="dol-cuerpo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFE3A3" /><stop offset="0.55" stopColor="#E9A94A" /><stop offset="1" stopColor="#A66C1E" /></linearGradient>
          <radialGradient id="dol-mano" cx="40%" cy="35%" r="75%"><stop offset="0" stopColor="#FFF3CC" /><stop offset="0.6" stopColor="#FFC24D" /><stop offset="1" stopColor="#B7730F" /></radialGradient>
        </defs>
        <g opacity={ent} transform={`translate(${cx} 960) scale(${resp}) translate(${-cx} -960)`}>
          {/* piernas y pies */}
          {[-1, 1].map((d) => (
            <g key={d}>
              <line x1={cx + d * 38} y1={yLegs - 10} x2={cx + d * 50} y2={yLegs + lenLeg} stroke="url(#dol-cuerpo)" strokeWidth={40 * (1 - 0.45 * m)} strokeLinecap="round" />
              <ellipse cx={cx + d * 56} cy={yLegs + lenLeg + 8} rx={34} ry={15 * (1 + 0.1 * m)} fill="url(#dol-cuerpo)" />
            </g>
          ))}
          {/* brazos */}
          {[-1, 1].map((d) => <line key={d} x1={cx + d * hw} y1={815} x2={hand(d)[0]} y2={hand(d)[1] - 20} stroke="url(#dol-cuerpo)" strokeWidth={30 * (1 - 0.15 * m)} strokeLinecap="round" />)}
          {/* torso */}
          <rect x={cx - hw} y={790} width={hw * 2} height={torsoH} rx={38} fill="url(#dol-cuerpo)" stroke="#FFE9B8" strokeOpacity={0.5} strokeWidth={2} />
          <ellipse cx={cx - hw * 0.35} cy={850} rx={hw * 0.3} ry={30} fill="#fff" opacity={0.2} />
          {/* manos con dedos */}
          {[-1, 1].map((d) => {
            const [hx, hy] = hand(d);
            return (
              <g key={d}>
                <ellipse cx={hx} cy={hy} rx={26 * k} ry={34 * k} fill="url(#dol-mano)" stroke="#FFF3CC" strokeOpacity={0.7} strokeWidth={2} />
                {[-1.5, -0.5, 0.5, 1.5].map((q) => <ellipse key={q} cx={hx + q * 9 * k} cy={hy - 34 * k - 6 * k * (1 - Math.abs(q) * 0.2)} rx={5.5 * k} ry={14 * k} fill="url(#dol-mano)" stroke="#FFF3CC" strokeOpacity={0.5} />)}
                <ellipse cx={hx - 10 * k} cy={hy - 8 * k} rx={7 * k} ry={14 * k} fill="#fff" opacity={0.25} />
              </g>
            );
          })}
          {/* cabeza y labios */}
          <circle cx={cx} cy={700} r={rHead} fill="url(#dol-cuerpo)" stroke="#FFE9B8" strokeOpacity={0.6} strokeWidth={2} />
          <ellipse cx={cx - rHead * 0.3} cy={680} rx={rHead * 0.3} ry={rHead * 0.18} fill="#fff" opacity={0.25} />
          <circle cx={cx - 22} cy={690} r={6} fill="#4A2A08" /><circle cx={cx + 22} cy={690} r={6} fill="#4A2A08" />
          <ellipse cx={cx} cy={724} rx={24 * kl} ry={9 * kl} fill={DK.rojo} stroke="#FFB4AB" strokeWidth={2} />
          <ellipse cx={cx} cy={720} rx={14 * kl} ry={3 * kl} fill="#fff" opacity={0.35} />
          {m > 0.6 && <ellipse cx={cx} cy={735 + 12 * kl} rx={14 * kl * 0.7} ry={20 * kl * 0.6} fill="#FF7A8A" opacity={clamp((m - 0.6) * 2.5) * 0.9} />}
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "el cuerpo\nen tu cerebro", px: 88 }, { t: H_.morph + 0.3, texto: "no tiene\ntu tamaño", color: DK.amarillo, px: 96 }]} y={400} id="dol-homu-t" />
      <Chip texto="MANOS" x={cx - 215} y={1120 + 40 * m} color={DK.amarillo} opacidad={clamp((m - 0.4) * 2.5)} ancho={190} id="dol-homu-m1" />
      <Chip texto="LABIOS" x={cx + 215} y={700} color="#FF9A8E" opacidad={clamp((m - 0.4) * 2.5)} ancho={210} id="dol-homu-m2" />
      <Chip texto="TRONCO" x={cx} y={1010} color={GL.lcrClaro} opacidad={clamp((m - 0.6) * 2.5)} ancho={190} id="dol-homu-m3" />
      <Chip texto="tamaño = espacio en la corteza" x={W / 2} y={1425} color={RE.hielo} opacidad={clamp((t - a(H_.chip - 0.3)) / 0.5)} ancho={700} id="dol-homu-chip" />
      <Fuente texto={`Wilder Penfield (Montreal, ${DOL.penfieldDecadas}) · Penfield y Boldrey, Brain ${DOL.penfieldAnio} · esquema simplificado`} y={1486} delay={0.8} />
    </Estudio>
  );
};

/* ───────────── dol-musica ───────────── */

const Nota: React.FC<{ x: number; y: number; r: number; color: string; op: number }> = ({ x, y, r, color, op }) => (
  <g transform={`translate(${x} ${y}) rotate(${-10 + r})`} opacity={op}>
    <ellipse cx={0} cy={0} rx={15} ry={11} fill={color} transform="rotate(-22)" />
    <rect x={11} y={-52} width={4} height={52} fill={color} />
    <path d="M 15 -52 C 34 -44 38 -30 28 -16 C 36 -30 26 -38 15 -38 Z" fill={color} />
  </g>
);

export const DolMusica: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const Mu = TDO.musica;
  const ent = spr(f, a(Mu.violin), { damping: 15, stiffness: 100, mass: 0.9 });
  const arcoK = clamp((t - a(Mu.arco)) / 0.4);
  const bx = 120 * Math.sin(t * 5.2) * arcoK;
  const luz = clamp((t - a(Mu.cerebro)) / 0.5);
  const BX = 790, BY = 880, BS = 0.66;
  const manoL: [number, number] = [0, -150];
  const mano: [number, number] = [BX + BS * manoL[0], BY + BS * manoL[1]];
  const mitad = "M 0 -135 C 45 -135 78 -110 76 -70 C 75 -40 52 -25 52 -2 C 52 22 82 40 86 85 C 92 140 50 175 0 175";
  const cuerpo = `${mitad} L 0 175 C -50 175 -92 140 -86 85 C -82 40 -52 22 -52 -2 C -52 -25 -75 -40 -76 -70 C -78 -110 -45 -135 0 -135 Z`;
  const ondas = [0, 1, 2].map((i) => ((t * 0.9 + i / 3) % 1));
  return (
    <Estudio piso={1560} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="dol-madera" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#D98B3F" /><stop offset="0.5" stopColor="#9C4F1B" /><stop offset="1" stopColor="#5B2A0C" /></linearGradient>
        </defs>
        {/* ondas de sonido desde el violín */}
        {ondas.map((u, i) => <circle key={i} cx={370} cy={1060} r={120 + u * 260} fill="none" stroke={GL.lcr} strokeWidth={3} opacity={(1 - u) * 0.35 * arcoK} />)}
        <g opacity={ent} transform="translate(370 1070) rotate(-16) scale(1.25)">
          {/* mástil y voluta */}
          <rect x={-10} y={-340} width={20} height={215} rx={6} fill="#2A1608" />
          <circle cx={0} cy={-350} r={20} fill="#7C3A12" stroke="#C9783A" strokeWidth={3} />
          {[-12, -4, 4, 12].map((d) => <line key={d} x1={d * 0.7} y1={-335} x2={d * 1.2} y2={150} stroke="#EDE6D4" strokeOpacity={0.8} strokeWidth={1.6} />)}
          <path d={cuerpo} fill="url(#dol-madera)" stroke="#E7A25A" strokeOpacity={0.7} strokeWidth={3} />
          <path d="M -38 -105 C -30 -125 10 -125 24 -112" fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={5} strokeLinecap="round" />
          {[-1, 1].map((d) => <path key={d} d={`M ${d * 38} 5 C ${d * 50} 25 ${d * 30} 40 ${d * 44} 65`} fill="none" stroke="#1A0A02" strokeWidth={5} strokeLinecap="round" />)}
          <rect x={-26} y={44} width={52} height={6} rx={2} fill="#EDE6D4" />
          <path d="M -14 168 L 14 168 L 8 120 L -8 120 Z" fill="#150A03" />
          {/* arco */}
          <g transform={`translate(${bx} 0) rotate(-6 0 60)`}>
            <line x1={-170} y1={60} x2={170} y2={60} stroke="#3B1D0C" strokeWidth={7} strokeLinecap="round" />
            <line x1={-162} y1={66} x2={162} y2={66} stroke="#F4F0E6" strokeWidth={3} strokeOpacity={0.9} />
            <rect x={-180} y={52} width={26} height={18} rx={5} fill="#111" />
          </g>
        </g>
        {[0, 1, 2].map((i) => {
          const u = ((t * 0.5 + i / 3) % 1);
          return <Nota key={i} x={470 + u * 150 + i * 40} y={780 - u * 230} r={i * 8} color={[GL.lcr, DK.amarillo, "#C4A0FF"][i]} op={Math.sin(u * Math.PI) * arcoK} />;
        })}
        {/* cerebro con el área de la mano */}
        <Cerebro x={BX} y={BY} s={BS * ent} luz={0.3}>
          <circle cx={manoL[0]} cy={manoL[1]} r={46} fill={DK.amarillo} opacity={0.35 * luz * (0.7 + 0.3 * Math.sin(t * 8))} />
          <circle cx={manoL[0]} cy={manoL[1]} r={20} fill={DK.amarillo} opacity={0.9 * luz} />
        </Cerebro>
        <path d={`M ${mano[0]} ${mano[1] + 10} C ${mano[0] - 40} 600 ${mano[0] - 200} 700 460 800`} fill="none" stroke={DK.amarillo} strokeWidth={3} strokeDasharray="10 12" strokeDashoffset={-t * 40} opacity={0.7 * luz} />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "pacientes que\ntocaron música\nen plena cirugía", px: 80 }]} y={430} id="dol-musica-t" />
      <Chip texto="el equipo protege sus manos" x={W / 2} y={1400} color={DK.amarillo} opacidad={clamp((t - a(Mu.chip - 0.3)) / 0.5)} ancho={640} id="dol-musica-c1" />
      <Fuente texto="Hay casos documentados de músicos que tocaron durante una craneotomía despierto" y={1486} delay={1.2} />
    </Estudio>
  );
};

/* ───────────── dol-cabeza ───────────── */

export const DolCabeza: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const C = TDO.cabeza;
  const ent = spr(f, a(C.capas), { damping: 15, stiffness: 100, mass: 0.9 });
  const banda = spr(f, a(C.banda), { damping: 12, stiffness: 150, mass: 0.7 });
  const lat = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 1.1 * t)), 3);
  const vasos = clamp((t - a(C.vasos)) / 0.5);
  const apr = 1 - 0.035 * (0.5 + 0.5 * Math.sin(t * 3)) * banda;
  const cero = spr(f, a(C.cero), { damping: 11, stiffness: 190, mass: 0.6 });
  const CX = 540, CY = 930, S = 1.3;
  return (
    <Estudio piso={1560} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Capas x={CX} y={CY} s={S * ent} duele={{ menin: vasos * (0.25 + 0.55 * lat) }} pulso={lat * vasos} />
        <Cerebro x={CX} y={CY} s={S * ent} luz={0.3} />
        {/* banda de tensión muscular */}
        <g transform={`translate(${CX} ${CY}) scale(${S * apr}) translate(0 0)`} opacity={banda}>
          <path d={bandaPath(1.27, 1.36, -170 * Math.PI / 180, -10 * Math.PI / 180)} fill="#FF9A3D" opacity={0.7} stroke="#FFD2A0" strokeWidth={2} />
        </g>
        {[-150, -120, -90, -60, -30].map((g, i) => {
          const [x, y] = ptCerebro((g * Math.PI) / 180, 1.5);
          const [x2, y2] = ptCerebro((g * Math.PI) / 180, 1.4);
          const dx = (x2 - x) * 0.6 * (1 - 0.3 * Math.sin(t * 3 + i));
          return <g key={i} opacity={banda}><path d={`M ${CX + S * x} ${CY + S * y} l ${S * dx} ${S * (y2 - y) * 0.6}`} stroke="#FFB36B" strokeWidth={6} strokeLinecap="round" /><circle cx={CX + S * (x + dx)} cy={CY + S * (y + (y2 - y) * 0.6)} r={7} fill="#FFB36B" /></g>;
        })}
        {cero > 0 && (
          <g transform={`translate(${CX} ${CY - 26}) scale(${0.5 + 0.5 * cero})`} opacity={clamp(cero * 1.5)}>
            <circle r={74} fill="#06101C" fillOpacity={0.82} stroke={DK.verde} strokeWidth={6} />
            <text y={30} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={90} fill={DK.verde}>0</text>
          </g>
        )}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "el dolor de\ncabeza", px: 92 }, { t: 2.4, texto: "se siente en lo\nque lo rodea", color: "#FFB36B", px: 84 }]} y={400} id="dol-cab-t" />
      <Chip texto="tensión: músculos del cuero cabelludo" x={W / 2} y={1330} color="#FFB36B" opacidad={banda} ancho={800} id="dol-cab-c1" />
      <Chip texto="migraña: vasos y nervios de las meninges" x={W / 2} y={1400} color={DK.rojo} opacidad={vasos} ancho={800} id="dol-cab-c2" />
      <Chip texto="el tejido cerebral: sin receptores de dolor" x={W / 2} y={1470} color={DK.verde} opacidad={clamp(cero * 1.5)} ancho={820} id="dol-cab-c3" />
    </Estudio>
  );
};

/* ───────────── dol-cierre ───────────── */

const RUTA_MANO: [number, number][] = [[230, 1140], [400, 1140], [585, 1200], [585, 960]];
const RUTA_PIE: [number, number][] = [[850, 1330], [720, 1330], [585, 1290], [585, 960]];

export const DolCierre: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const Z = TDO.cierre;
  const ent = spr(f, a(Z.cerebro), { damping: 15, stiffness: 100, mass: 0.9 });
  const cero = spr(f, a(Z.cero), { damping: 11, stiffness: 190, mass: 0.6 });
  const pulsos = [0, 1, 2, 3].map((i) => ({ ruta: i % 2 ? RUTA_PIE : RUTA_MANO, u: (t - a(Z.pulso(i))) / 1.25 }));
  const llegada = pulsos.reduce((m, p) => Math.max(m, p.u > 0.93 && p.u < 1.4 ? Math.sin(clamp((p.u - 0.93) / 0.47) * Math.PI) : 0), 0);
  const nodo = (x: number, y: number, txt: string, activo: number): React.ReactNode => (
    <g transform={`translate(${x} ${y})`} opacity={ent}>
      <circle r={42} fill="#06101C" fillOpacity={0.9} stroke={DK.rojo} strokeWidth={4} opacity={0.5 + 0.5 * activo} />
      <circle r={16 + 6 * activo} fill={DK.rojo} opacity={0.4 + 0.6 * activo} />
      <text y={80} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={26} fill={RE.blanco}>{txt}</text>
    </g>
  );
  const actM = Math.max(0, ...pulsos.filter((p) => p.ruta === RUTA_MANO).map((p) => (p.u > 0 && p.u < 0.2 ? 1 : 0)));
  const actP = Math.max(0, ...pulsos.filter((p) => p.ruta === RUTA_PIE).map((p) => (p.u > 0 && p.u < 0.2 ? 1 : 0)));
  return (
    <Estudio piso={1560} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={ent}>
          {[RUTA_MANO, RUTA_PIE].map((r, i) => <polyline key={i} points={r.map((p) => p.join(",")).join(" ")} fill="none" stroke="#5E7B96" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />)}
          <line x1={585} y1={960} x2={585} y2={1330} stroke="#8FB3D2" strokeWidth={22} strokeLinecap="round" opacity={0.65} />
          <line x1={578} y1={970} x2={578} y2={1320} stroke="#fff" strokeWidth={4} opacity={0.3} />
        </g>
        {nodo(230, 1140, "MANO", actM)}
        {nodo(850, 1330, "PIE", actP)}
        {pulsos.map((p, i) => {
          if (p.u <= 0 || p.u >= 1) return null;
          const [x, y] = puntoPoli(p.ruta, p.u);
          return (
            <g key={i}>
              {[0.06, 0.12, 0.18].map((d, j) => { const [tx, ty] = puntoPoli(p.ruta, Math.max(0, p.u - d)); return <circle key={j} cx={tx} cy={ty} r={14 - j * 3} fill={DK.rojo} opacity={0.35 - j * 0.09} />; })}
              <circle cx={x} cy={y} r={15} fill="#FF8A7A" stroke="#fff" strokeWidth={3} />
            </g>
          );
        })}
        <Cerebro x={540} y={760} s={0.92 * ent} luz={0.3 + 0.6 * llegada} sucio={0}>
          <rect x={-280} y={-220} width={560} height={400} fill={DK.rojo} opacity={0.22 * llegada} />
        </Cerebro>
        {cero > 0 && (
          <g transform={`translate(880 560) scale(${cero})`} opacity={clamp(cero * 1.5)}>
            <circle r={66} fill="#06101C" fillOpacity={0.85} stroke={DK.verde} strokeWidth={6} />
            <text y={28} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={80} fill={DK.verde}>0</text>
          </g>
        )}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "recibe tu dolor", px: 96 }, { t: 2.4, texto: "pero no siente\nel suyo", color: GL.lcr, px: 96 }]} y={420} id="dol-cierre-t" />
      <Chip texto="receptores de dolor en el tejido cerebral" x={W / 2} y={1450} color={DK.verde} opacidad={clamp(cero * 1.5)} ancho={840} id="dol-cierre-chip" />
    </Estudio>
  );
};
