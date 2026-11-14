/**
 * «El secreto perdido del hormigón romano» (IMNOBA · forense/microscópico) · escenas 1/2
 *   rom-gancho    un puente moderno se pudre y un puerto romano mejora con los siglos
 *   rom-oxido     la sal oxida el acero del hormigón moderno y el óxido hincha y rompe
 *   rom-ceniza    cal y ceniza volcánica de Pozzuoli que viaja en barco
 *   rom-receta    cal, ceniza, agua y roca vertidas en moldes dentro del mar, sin acero
 *   rom-zoom      zoom hasta lo microscópico
 *   rom-reaccion  el agua de mar disuelve ceniza y cal y nacen cristales
 */
import React from "react";
import { TRM } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { FONT, Frases, MONOF } from "./real-kit";
import { Fuente } from "./real1";
import { Chip } from "./med1";
import { Globo, Onoma } from "./chi-kit";
import { Barco, Bloque, Cristales, Evidencia, FondoLab, Gota, Inspector, Ion, Mar, MuelleRomano, PuenteModerno, Reticula, RO, Volcan } from "./rom-kit";

type P = { e: EscenaViralGuardada };
const rp = (t: number, a: (x: number) => number, ini: number, dur: number): number => clamp((t - a(ini)) / a(dur));

/* ───────────── rom-gancho ───────────── */

export const RomGancho: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TRM.gancho;
  const sP = spr(f, a(T.puente), { damping: 13, stiffness: 110, mass: 0.9 });
  const deg = easeInOut((t - a(T.oxida)) / a(2.4)) * 0.95;
  const sM = spr(f, a(T.muelle), { damping: 13, stiffness: 110, mass: 0.9 });
  const brillo = easeOut((t - a(T.brillo)) / a(2.0));
  const gk = rp(t, a, T.insp, 0.4);
  return (
    <FondoLab>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* mitad de arriba: puente moderno */}
        <g opacity={clamp(sP * 2)} transform={`translate(0 ${(1 - sP) * 60})`}>
          <PuenteModerno x={540} y={600} w={940} deg={deg} t={t} pila={290} />
          <Mar y={870} t={t} alto={150} />
        </g>
        <line x1={0} y1={1022} x2={W} y2={1022} stroke={RO.cian} strokeWidth={3} strokeDasharray="14 10" opacity={0.7} />
        {/* mitad de abajo: puerto romano bajo el agua */}
        <rect x={0} y={1024} width={W} height={540} fill={RO.marOsc} opacity={0.9} />
        <g opacity={clamp(sM * 2)} transform={`translate(0 ${(1 - sM) * 60})`}>
          <MuelleRomano x={540} y={1510} w={880} t={t} brillo={brillo} />
        </g>
        {Array.from({ length: 12 }, (_, i) => { const q = (t * 0.2 + azar(i * 3.3)) % 1; return <circle key={i} cx={azar(i * 7.1) * W} cy={1540 - q * 500} r={3 + azar(i * 5.3) * 5} fill="#CFF4FF" opacity={0.35 * Math.sin(q * Math.PI)} />; })}
        <g opacity={gk}><Inspector x={900} y={1018} s={0.7} fase={t * 2} /></g>
        {gk > 0 && <Globo x={880} y={800} texto="¡Caso abierto!" ancho={320} k={gk} lado="der" id="rom-abierto" />}
      </svg>
      <Frases frases={[{ t: 0.02, texto: "un puente moderno", px: 82 }, { t: T.f2, texto: "se pudre en décadas", color: "#FF8A6A", px: 72 }, { t: T.f3, texto: "un puerto romano", px: 82 }, { t: T.f4, texto: "mejora con los siglos", color: RO.oro, px: 72 }, { t: T.f5, texto: "¿cómo?", color: RO.cian, px: 120 }]} y={352} ancho={860} />
      <Chip texto="hormigón armado moderno" x={W / 2} y={985} color="#FF8A6A" id="rom-moderno" ancho={620} opacidad={rp(t, a, T.chip1, 0.4)} />
      <Chip texto="hormigón romano marino" x={W / 2} y={1552} color={RO.oro} id="rom-romano" ancho={560} opacidad={rp(t, a, T.chip2, 0.4)} />
      <Fuente texto="Esquema: el puente es genérico; el puerto romano es una reconstrucción simplificada · Mediterráneo" delay={1.0} />
    </FondoLab>
  );
};

/* ───────────── rom-oxido ───────────── */

export const RomOxido: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TRM.oxido;
  const uid = useUid();
  const sP = spr(f, a(T.pilar), { damping: 13, stiffness: 110, mass: 0.9 });
  const ox = easeInOut((t - a(T.oxida)) / a(2.6));
  const gr = rp(t, a, T.grietas, 0.8);
  const gk = rp(t, a, T.globo, 0.4);
  const barras = [430, 520, 620, 710];
  const iones = t >= a(T.iones);
  return (
    <FondoLab tono="rojo">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><clipPath id={`${uid}c`}><rect x={340} y={560} width={440} height={860} rx={10} /></clipPath></defs>
        <Mar y={760} t={t} alto={700} />
        <g opacity={clamp(sP * 2)} transform={`translate(0 ${(1 - sP) * 70})`}>
          <g>
            <rect x={340} y={560} width={440} height={860} rx={10} fill="#9A9C98" stroke="#2E3236" strokeWidth={6} />
            <g clipPath={`url(#${uid}c)`}>
              {Array.from({ length: 50 }, (_, i) => <circle key={i} cx={340 + azar(i * 3.3) * 440} cy={560 + azar(i * 5.1) * 860} r={2 + azar(i * 7.7) * 4} fill="#7A7C78" opacity={0.7} />)}
              {barras.map((bx, i) => (
                <g key={i}>
                  <rect x={bx - 14 - 22 * ox} y={560} width={28 + 44 * ox} height={860} fill={RO.herrumbre} opacity={0.65 * ox} />
                  <rect x={bx - 7} y={560} width={14} height={860} fill={mezcl(ox)} />
                </g>
              ))}
              {[700, 860, 1020, 1180, 1340].map((yy) => <line key={yy} x1={410} y1={yy} x2={720} y2={yy} stroke={mezcl(ox)} strokeWidth={8} />)}
              {gr > 0 && barras.map((bx, i) => <path key={i} d={`M ${bx} ${760 + i * 60} l ${(i % 2 ? 1 : -1) * 90 * gr} ${-30 * gr} l ${(i % 2 ? 1 : -1) * 70 * gr} ${40 * gr}`} fill="none" stroke="#14110D" strokeWidth={7} strokeLinecap="round" />)}
            </g>
          </g>
          {/* iones de cloruro que viajan del mar al acero */}
          {iones && Array.from({ length: 9 }, (_, i) => {
            const q = (t * 0.35 + i / 9) % 1;
            const bx = barras[i % 4];
            return <Ion key={i} x={lerp(300, bx, q)} y={620 + (i % 5) * 150 + Math.sin(q * 8 + i) * 18} texto="Cl" color={RO.cian} r={22} id={`rom-cl${i}`} k={clamp(q * 4) * (1 - clamp((q - 0.9) * 10))} />;
          })}
          {/* trozo que se desprende */}
          {gr > 0.7 && <rect x={790 + (t * 40) % 60} y={1000 + ((t * 120) % 300)} width={26} height={22} fill="#7A7C78" transform={`rotate(${t * 200} 800 1100)`} opacity={0.9} />}
        </g>
        {gk > 0 && <Globo x={620} y={900} texto="¡Auxilio, me oxido!" ancho={340} k={gk} lado="izq" id="rom-auxilio" />}
        {gr > 0.3 && <Onoma x={540} y={1480} texto="¡CRAC!" k={gr} color={RO.rojo} px={78} rot={-6} id="rom-crac" />}
      </svg>
      <Frases frases={[{ t: 0.02, texto: "el agua salada", px: 84 }, { t: T.f2, texto: "oxida el acero", color: "#FF8A6A", px: 88 }, { t: T.f3, texto: "el óxido hincha y rompe", color: RO.ambar, px: 70 }]} y={352} ancho={860} />
      <Chip texto="la sal (cloruros) llega al acero" x={W / 2} y={520} color={RO.cian} id="rom-sal" ancho={640} opacidad={rp(t, a, T.chip1, 0.4)} />
      <Chip texto="el óxido ocupa más lugar que el acero" x={W / 2} y={1560} color={RO.ambar} id="rom-oxvol" ancho={760} opacidad={rp(t, a, T.chip2, 0.4)} />
      <Fuente texto="Corrosión por cloruros en hormigón armado marino: el óxido ocupa más volumen que el acero y agrieta el recubrimiento · esquema" delay={1.2} y={1620} />
    </FondoLab>
  );
};
const mezcl = (k: number): string => {
  const r = Math.round(lerp(0xC9, 0xB5, k)), g = Math.round(lerp(0x30, 0x53, k)), b = Math.round(lerp(0x2A, 0x2A, k));
  return k < 0.01 ? "#C9C2B4" : `rgb(${Math.round(lerp(0xC9, r, 1))},${Math.round(lerp(0xC2, g, k))},${Math.round(lerp(0xB4, b, k))})`;
};

/* ───────────── rom-ceniza ───────────── */

export const RomCeniza: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TRM.ceniza;
  const sV = spr(f, a(T.volcan), { damping: 12, stiffness: 100, mass: 1 });
  const barco = easeInOut((t - a(T.barco)) / a(3.8));
  const gk = rp(t, a, T.gaviota, 0.4);
  return (
    <FondoLab tono="ambar">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <rect x={0} y={1180} width={W} height={400} fill="#0B2A3A" />
        <g opacity={clamp(sV * 2)} transform={`translate(0 ${(1 - sV) * 80})`}><Volcan x={330} y={1190} s={0.95} t={t} /></g>
        <Mar y={1180} t={t} alto={380} />
        {/* sacos de ceniza que vuelan al barco */}
        {Array.from({ length: 6 }, (_, i) => {
          const q = clamp((t - a(T.sacos + i * 0.3)) / a(1.0));
          if (q <= 0 || q >= 1) return null;
          const x = lerp(420, lerp(640, 760, barco), q), y = lerp(960, 1170, q) - Math.sin(q * Math.PI) * 220;
          return <g key={i} transform={`translate(${x} ${y}) rotate(${q * 200})`}><rect x={-22} y={-18} width={44} height={36} rx={10} fill="#8A8F96" stroke="#3B3F44" strokeWidth={3} /><text x={0} y={7} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={17} fill="#1A1D20">ceniza</text></g>;
        })}
        {t >= a(T.barco) && <Barco x={lerp(700, 800, barco)} y={1180} s={0.78} t={t} />}
        <Evidencia x={330} y={430 + 0} texto="Pozzuoli · cerca de Nápoles" k={rp(t, a, T.volcan + 0.6, 0.5)} ancho={520} id="rom-pozzuoli" />
        {/* gaviota */}
        <g transform={`translate(${860 + Math.sin(t * 2) * 12} ${760 + Math.sin(t * 3) * 10})`} opacity={gk}>
          <path d="M -40 0 Q -20 -26 0 0 Q 20 -26 40 0" fill="none" stroke={RO.marmol} strokeWidth={7} strokeLinecap="round" />
        </g>
        {gk > 0 && <Globo x={850} y={750} texto="¿Eso se come?" ancho={300} k={gk} lado="der" id="rom-gaviota" />}
      </svg>
      <Frases frases={[{ t: 0.02, texto: "cal + ceniza volcánica", px: 74, color: RO.ambar }, { t: T.f2, texto: "enviada en barco", px: 88 }]} y={352} ancho={860} />
      <Chip texto="pulvis puteolanus (Vitruvio)" x={W / 2} y={1500} color={RO.oro} id="rom-pulvis" ancho={680} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Vitruvio llamó «pulvis puteolanus» a la ceniza volcánica de la zona de Pozzuoli (bahía de Nápoles) · ilustración" delay={1.2} />
    </FondoLab>
  );
};

/* ───────────── rom-receta ───────────── */

const ING = [{ t: "cal", c: "#F4F1E8" }, { t: "ceniza", c: "#8A8F96" }, { t: "agua", c: "#4FE3FF" }, { t: "roca", c: "#7C6B5B" }];

export const RomReceta: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TRM.receta;
  const sub = easeInOut((t - a(T.sube)) / a(2.2));
  const kAc = spr(f, a(T.acero), { damping: 10, stiffness: 140, mass: 0.7 });
  return (
    <FondoLab>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Mar y={900} t={t} alto={660} />
        {/* molde de madera dentro del agua */}
        <g>
          <rect x={300} y={780} width={480} height={640} fill={RO.marOsc} opacity={0.0} />
          <rect x={314} y={lerp(1400, 960, sub)} width={452} height={lerp(0, 440, sub)} fill="#C9BFA8" />
          {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={324 + azar(i * 3.3) * 432} cy={lerp(1400, 960, sub) + azar(i * 5.1) * lerp(0, 440, sub)} r={2 + azar(i * 7.7) * 3} fill="#8F8670" opacity={0.7} />)}
          <rect x={290} y={780} width={24} height={650} fill="#8A6234" stroke="#3B2512" strokeWidth={4} /><rect x={766} y={780} width={24} height={650} fill="#8A6234" stroke="#3B2512" strokeWidth={4} />
          {Array.from({ length: 6 }, (_, i) => <line key={i} x1={290} y1={820 + i * 100} x2={314} y2={820 + i * 100} stroke="#3B2512" strokeWidth={3} />)}
          <rect x={290} y={1424} width={500} height={24} fill="#6B4A24" stroke="#3B2512" strokeWidth={4} />
        </g>
        {/* ingredientes que caen al molde */}
        {ING.map((g, i) => {
          const s0 = T.iconos + i * T.paso;
          const k = clamp((t - a(s0)) / a(0.5));
          const caer = clamp((t - a(T.vierte + i * 0.35)) / a(0.9));
          const x = lerp(160 + i * 250, 540, easeInOut(caer)), y = lerp(560, 930, easeInOut(caer)) - Math.sin(caer * Math.PI) * 60;
          return (
            <g key={i} opacity={clamp(k * 2) * (1 - clamp((caer - 0.9) * 10))} transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * easeOut(k)})`}>
              <rect x={-66} y={-44} width={132} height={88} rx={18} fill="#0E1F2A" stroke={g.c} strokeWidth={5} />
              <text x={0} y={11} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={36} fill={g.c} data-texto={`rom-ing${i}`}>{g.t}</text>
            </g>
          );
        })}
        {/* sin acero */}
        <g opacity={clamp(kAc * 2)} transform={`translate(830 1200) scale(${0.7 + 0.3 * kAc})`}>
          {[-30, 0, 30].map((dx) => <line key={dx} x1={dx} y1={-80} x2={dx} y2={80} stroke="#B3302A" strokeWidth={14} strokeLinecap="round" />)}
          <circle r={110} fill="none" stroke={RO.rojo} strokeWidth={12} /><line x1={-78} y1={78} x2={78} y2={-78} stroke={RO.rojo} strokeWidth={12} />
        </g>
      </svg>
      <Frases frases={[{ t: 0.02, texto: "cal, ceniza, agua, roca", px: 72 }, { t: T.f2, texto: "moldes dentro del mar", px: 76, color: RO.cian }, { t: T.f3, texto: "sin acero, nada que oxidar", px: 60, color: RO.oro }]} y={352} ancho={860} />
      <Chip texto="¡sin hierro adentro!" x={W / 2} y={1550} color={RO.oro} id="rom-sinacero" ancho={560} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Vitruvio describe verter la mezcla en moldes de madera dentro del agua; el hormigón romano no llevaba armadura de acero · esquema" delay={1.2} />
    </FondoLab>
  );
};

/* ───────────── rom-zoom ───────────── */

export const RomZoom: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TRM.zoom;
  const uid = useUid();
  const k1 = clamp((t - a(T.z1)) / a(1.6)), k2 = clamp((t - a(T.z2)) / a(1.6)), k3 = clamp((t - a(T.z3)) / a(1.4));
  const gk = rp(t, a, T.globo, 0.4);
  const nivel = t < a(T.z2) ? "1 m" : t < a(T.z3) ? "1 cm" : "50 µm";
  const cx = 540, cy = 980, R = 360;
  return (
    <FondoLab>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><clipPath id={`${uid}c`}><circle cx={cx} cy={cy} r={R} /></clipPath></defs>
        <circle cx={cx} cy={cy} r={R} fill="#071C28" />
        <g clipPath={`url(#${uid}c)`}>
          {/* nivel 1: muelle */}
          <g opacity={1 - clamp(k1 * 2)} transform={`translate(${cx} ${cy + 60}) scale(${lerp(0.9, 3.2, easeInOut(k1))}) translate(${-cx} ${-(cy + 60)})`}>
            <rect x={0} y={cy + 80} width={W} height={400} fill={RO.marOsc} />
            <MuelleRomano x={cx} y={cy + 100} w={640} t={t} brillo={0} />
          </g>
          {/* nivel 2: bloque */}
          <g opacity={clamp(k1 * 2 - 0.5) * (1 - clamp(k2 * 2))} transform={`translate(${cx} ${cy}) scale(${lerp(0.9, 3.2, easeInOut(k2))}) translate(${-cx} ${-cy})`}>
            <Bloque x={cx - 330} y={cy - 250} w={660} h={500} poros={10} semilla={3} agua={0.6} />
          </g>
          {/* nivel 3: granos microscópicos */}
          <g opacity={clamp(k2 * 2 - 0.5)}>
            <rect x={cx - R} y={cy - R} width={2 * R} height={2 * R} fill="#1C2A32" />
            {Array.from({ length: 22 }, (_, i) => {
              const gx = cx - R + azar(i * 3.3) * 2 * R, gy = cy - R + azar(i * 5.1) * 2 * R, r = 26 + azar(i * 7.7) * 56;
              const sc = lerp(0.5, 1, easeOut(k3));
              return <circle key={i} cx={cx + (gx - cx) * sc} cy={cy + (gy - cy) * sc} r={r * sc} fill={["#6B5E52", "#7C7C80", "#5A5048", "#8C8570"][i % 4]} stroke="#2E2A26" strokeWidth={3} />;
            })}
            {Array.from({ length: 10 }, (_, i) => <ellipse key={i} cx={cx - R + azar(i * 9.1) * 2 * R} cy={cy - R + azar(i * 4.9) * 2 * R} rx={22} ry={14} fill={RO.cian} opacity={0.6 + 0.3 * Math.sin(t * 3 + i)} />)}
          </g>
        </g>
        <Reticula x={cx} y={cy} r={R} t={t} escala={nivel} k={rp(t, a, T.ret, 0.5)} />
        <g opacity={rp(t, a, T.z1, 0.4)}><Inspector x={170} y={1530} s={1.1} fase={t * 2} lupaGrande={1 + k3 * 0.8} /></g>
        {gk > 0 && <Globo x={250} y={1340} texto="Más zoom… ¡más!" ancho={340} k={gk} lado="izq" id="rom-mas-zoom" />}
      </svg>
      <Frases frases={[{ t: 0.02, texto: "el secreto está en lo diminuto", px: 66 }, { t: T.f2, texto: "hagamos zoom", color: RO.cian, px: 100 }, { t: T.f3, texto: "granos, poros, agua de mar", color: RO.ambar, px: 62 }]} y={352} ancho={860} />
      <Chip texto="de un muelle a un grano de ceniza" x={W / 2 + 80} y={1560} color={RO.cian} id="rom-de-a" ancho={700} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Zoom ilustrativo: las escalas son aproximadas y los granos están dibujados, no son una micrografía real" delay={1.0} y={1625} />
    </FondoLab>
  );
};

/* ───────────── rom-reaccion ───────────── */

export const RomReaccion: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TRM.reaccion;
  const uid = useUid();
  const cx = 540, cy = 960, R = 360;
  const sV = spr(f, a(T.vista), { damping: 13, stiffness: 110, mass: 0.9 });
  const dis = easeInOut((t - a(T.disuelve)) / a(2.2));
  const cris = easeOut((t - a(T.cristal)) / a(2.6));
  const gk = rp(t, a, T.permiso, 0.4) * (1 - rp(t, a, T.permiso + 1.0, 0.3));
  const granos = [[-200, -150, 90], [150, -170, 70], [-40, 20, 110], [200, 130, 80], [-230, 170, 70], [60, 250, 60]];
  return (
    <FondoLab>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><clipPath id={`${uid}c`}><circle cx={cx} cy={cy} r={R} /></clipPath></defs>
        <g opacity={clamp(sV * 2)}>
          <circle cx={cx} cy={cy} r={R} fill="#142631" />
          <g clipPath={`url(#${uid}c)`}>
            {/* grumo de cal y granos de ceniza que se disuelven */}
            {granos.map(([gx, gy, r], i) => <circle key={i} cx={cx + gx} cy={cy + gy} r={r * (1 - 0.45 * dis)} fill={i === 2 ? "#F4F1E8" : ["#6B5E52", "#7C7C80", "#5A5048"][i % 3]} stroke="#2E2A26" strokeWidth={3} />)}
            {/* agua que entra por el poro */}
            {Array.from({ length: 7 }, (_, i) => {
              const q = clamp((t - a(T.gotas + i * 0.25)) / a(1.4));
              if (q <= 0) return null;
              return <Gota key={i} x={lerp(cx - R + 30, cx - 120 + (i % 3) * 60, easeInOut(q))} y={lerp(cy - R + 70, cy - 60 + (i % 4) * 40, easeInOut(q))} s={0.7 * (1 - 0.3 * q)} />;
            })}
            {/* iones liberados */}
            {t >= a(T.iones) && Array.from({ length: 12 }, (_, i) => {
              const lab = ["Ca", "Si", "Al"][i % 3], col = [RO.marmol, RO.ambar, RO.verde][i % 3];
              const ang = t * 0.9 + i * 0.52, rr = 80 + (i % 4) * 55;
              return <Ion key={i} x={cx + Math.cos(ang) * rr} y={cy + Math.sin(ang) * rr * 0.8} texto={lab} color={col} r={20} id={`rom-ion${i}`} k={clamp((t - a(T.iones + i * 0.1)) * 3)} />;
            })}
            {/* cristales que nacen entre los granos */}
            {[[-110, -20], [100, 60], [0, -150], [-30, 170]].map(([x, y], i) => <Cristales key={i} x={cx + x} y={cy + y} r={110} k={cris} t={t} n={16} semilla={i + 2} />)}
          </g>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={RO.cian} strokeWidth={5} opacity={0.85} />
        </g>
        {gk > 0 && <Globo x={cx - 220} y={cy - 210} texto="¡Permiso!" ancho={260} k={gk} lado="izq" id="rom-permiso" />}
      </svg>
      <Frases frases={[{ t: 0.02, texto: "el agua de mar entra", px: 80 }, { t: T.f2, texto: "disuelve ceniza y cal", color: RO.ambar, px: 72 }, { t: T.f3, texto: "nacen cristales", color: RO.oro, px: 96 }]} y={352} ancho={860} />
      <Chip texto="agua de mar + ceniza + cal → cristales" x={W / 2} y={1500} color={RO.oro} id="rom-ecuacion" ancho={860} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Esquema de la reacción puzolánica y de la cristalización posterior (Al-tobermorita y filipsita) descritas por Jackson y colaboradores · no es una micrografía real" delay={1.0} y={1580} />
    </FondoLab>
  );
};
