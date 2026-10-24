/**
 * Escenarios ilustrados de las plantillas «documentales» (siempre sobre el tema oscuro) y texturas de lápiz:
 *   espacio  cielo estrellado con parallax, nebulosas y un planeta en semitono
 *   luna     superficie lunar: horizonte, cráteres, rocas poligonales con sombra dura y trama cruzada
 *   bio      entorno biológico: musgo, gotas de agua que caen y ondas
 *   celula   interior de una célula: membrana punteada, orgánulos y vesículas flotantes
 * Nada de filtros de pantalla completa (degradados radiales y formas): el render es rápido.
 * También exporta <Trama/> (rayado y cross-hatching para dar volumen) y <Puntos/> (semitono de un color).
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { azar } from "../lib/anim";
import type { EscenarioViral } from "../anim/viral";
import { StudioSvgDefs } from "../estudio/efectos";
import { useUid } from "../estudio/util";
import { H, W, mezclar, useViral } from "./comun";

/* ───────────── texturas de lápiz ───────────── */

/** Rayado a lápiz; `cruzada` añade la diagonal contraria (cross-hatching). Va dentro de <defs>; úsalo con fill="url(#id)". */
export const Trama: React.FC<{ id: string; color: string; paso?: number; grosor?: number; cruzada?: boolean; angulo?: number; opacidad?: number }> = ({ id, color, paso = 12, grosor = 2.2, cruzada = false, angulo = 45, opacidad = 0.85 }) => (
  <pattern id={id} width={paso} height={paso} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angulo})`}>
    <line x1={0} y1={0} x2={0} y2={paso} stroke={color} strokeWidth={grosor} opacity={opacidad} />
    {cruzada && <line x1={0} y1={0} x2={paso} y2={0} stroke={color} strokeWidth={grosor} opacity={opacidad} />}
  </pattern>
);

/** Semitono de puntos de un color cualquiera (las tramas globales de StudioSvgDefs son de tinta oscura). */
export const Puntos: React.FC<{ id: string; color: string; paso?: number; radio?: number; opacidad?: number }> = ({ id, color, paso = 14, radio = 3.2, opacidad = 0.8 }) => (
  <pattern id={id} width={paso} height={paso} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <circle cx={paso / 2} cy={paso / 2} r={radio} fill={color} fillOpacity={opacidad} />
  </pattern>
);

/* ───────────── estrellas ───────────── */

const Estrellas: React.FC<{ n: number; yMax?: number; semilla?: number; f: number; acento: string }> = ({ n, yMax = H, semilla = 0, f, acento }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const r = 0.8 + azar(i * 7.3 + semilla) * 2.3;
      const x = azar(i * 3.1 + semilla) * W;
      const y = (azar(i * 5.7 + 1 + semilla) * yMax + f * 0.05 * r) % yMax;
      const brillo = 0.4 + 0.6 * Math.abs(Math.sin(f / (26 + (i % 17) * 5) + i));
      return <circle key={i} cx={x} cy={y} r={r} fill={i % 11 === 0 ? acento : "#FFFFFF"} opacity={brillo * (r > 2.4 ? 1 : 0.8)} />;
    })}
  </g>
);

/* ───────────── espacio ───────────── */

const Espacio: React.FC<{ f: number; uid: string }> = ({ f, uid }) => {
  const { T } = useViral();
  return (
    <>
      <defs>
        <radialGradient id={`${uid}sp`} cx="50%" cy="34%" r="90%"><stop offset="0" stopColor="#0B1F4A" /><stop offset="0.6" stopColor="#040C24" /><stop offset="1" stopColor="#01040E" /></radialGradient>
        <radialGradient id={`${uid}n1`}><stop offset="0" stopColor={T.acento2} stopOpacity={0.26} /><stop offset="1" stopColor={T.acento2} stopOpacity={0} /></radialGradient>
        <radialGradient id={`${uid}n2`}><stop offset="0" stopColor={T.acento} stopOpacity={0.14} /><stop offset="1" stopColor={T.acento} stopOpacity={0} /></radialGradient>
        <radialGradient id={`${uid}pl`} cx="30%" cy="26%" r="80%"><stop offset="0" stopColor="#6C8CD6" /><stop offset="0.55" stopColor="#2B4A93" /><stop offset="1" stopColor="#0B1B45" /></radialGradient>
        <Puntos id={`${uid}pd`} color="#02081C" paso={13} radio={3.4} opacidad={0.75} />
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}sp)`} />
      <circle cx={W * 0.2 + 30 * Math.sin(f / 220)} cy={H * 0.3} r={520} fill={`url(#${uid}n1)`} />
      <circle cx={W * 0.86} cy={H * 0.72 + 30 * Math.sin(f / 260)} r={560} fill={`url(#${uid}n2)`} />
      <Estrellas n={120} f={f} semilla={2} acento={T.acento} />
      {/* planeta en semitono, parcialmente fuera del cuadro */}
      <g transform={`translate(${W * 0.9} ${H * 0.2 + 8 * Math.sin(f / 150)})`}>
        <circle r={190} fill={`url(#${uid}pl)`} />
        <path d="M 40,-186 A 190 190 0 0 1 150,118 A 230 230 0 0 0 40,-186 Z" fill={`url(#${uid}pd)`} />
        <ellipse rx={290} ry={52} transform="rotate(-18)" fill="none" stroke="#9CB4EA" strokeOpacity={0.4} strokeWidth={6} />
      </g>
    </>
  );
};

/* ───────────── luna ───────────── */

/** Altura del horizonte lunar: las plantillas que «caen» sobre la superficie (IMPACTO) usan el mismo valor. */
export const HORIZONTE_LUNA = 1290;

const Luna: React.FC<{ f: number; uid: string }> = ({ f, uid }) => {
  const { T } = useViral();
  const rocas = Array.from({ length: 7 }, (_, i) => {
    const cx = 110 + azar(i * 9.1 + 4) * 860;
    const cy = HORIZONTE_LUNA + 120 + azar(i * 4.3 + 7) * 420;
    const r = 34 + azar(i * 6.7 + 2) * 56 + (cy - HORIZONTE_LUNA) * 0.05;
    const pts = Array.from({ length: 7 }, (_, k) => {
      const a = (k / 7) * Math.PI * 2 + azar(i * 3 + k) * 0.5;
      const rr = r * (0.7 + azar(i * 11 + k * 2.3) * 0.45);
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.62] as const;
    });
    return { cx, cy, r, pts };
  }).sort((a, b) => a.cy - b.cy);
  const crateres = Array.from({ length: 5 }, (_, i) => ({ cx: 90 + azar(i * 13.7 + 1) * 900, cy: HORIZONTE_LUNA + 70 + azar(i * 8.9 + 5) * 480, rx: 70 + azar(i * 5.1) * 120 }));
  return (
    <>
      <defs>
        <linearGradient id={`${uid}cielo`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#01040E" /><stop offset="1" stopColor="#0A1633" /></linearGradient>
        <linearGradient id={`${uid}suelo`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7C86A3" /><stop offset="0.12" stopColor="#4C556F" /><stop offset="1" stopColor="#151B2E" /></linearGradient>
        <radialGradient id={`${uid}tierra`} cx="32%" cy="30%" r="80%"><stop offset="0" stopColor="#7FB6FF" /><stop offset="0.6" stopColor="#2E6FD6" /><stop offset="1" stopColor="#0C2A63" /></radialGradient>
        <Trama id={`${uid}hx`} color="#05070F" paso={9} grosor={2.4} cruzada opacidad={0.9} />
        <Puntos id={`${uid}pd`} color="#05070F" paso={12} radio={3} opacidad={0.6} />
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}cielo)`} />
      <Estrellas n={70} yMax={HORIZONTE_LUNA - 20} f={f} semilla={9} acento={T.acento} />
      {/* la Tierra, lejos */}
      <g transform={`translate(${W * 0.82} ${330})`}>
        <circle r={78} fill={`url(#${uid}tierra)`} />
        <path d="M 14,-76 A 78 78 0 0 1 60,50 A 100 100 0 0 0 14,-76 Z" fill={`url(#${uid}pd)`} />
        <path d="M -40,-20 q 20,-30 44,-8 q 8,24 -16,34 q -22,0 -28,-26 Z" fill="#7BE0A8" opacity={0.55} />
      </g>
      {/* superficie */}
      <path d={`M 0,${HORIZONTE_LUNA + 34} Q ${W * 0.3},${HORIZONTE_LUNA - 16} ${W * 0.62},${HORIZONTE_LUNA + 4} T ${W},${HORIZONTE_LUNA - 6} L ${W},${H} L 0,${H} Z`} fill={`url(#${uid}suelo)`} />
      <path d={`M 0,${HORIZONTE_LUNA + 34} Q ${W * 0.3},${HORIZONTE_LUNA - 16} ${W * 0.62},${HORIZONTE_LUNA + 4} T ${W},${HORIZONTE_LUNA - 6}`} fill="none" stroke="#AEB8D6" strokeOpacity={0.55} strokeWidth={4} />
      <rect x={0} y={HORIZONTE_LUNA - 10} width={W} height={H - HORIZONTE_LUNA + 10} fill={`url(#${uid}pd)`} opacity={0.18} />
      {crateres.map((c, i) => (
        <g key={i}>
          <ellipse cx={c.cx} cy={c.cy} rx={c.rx} ry={c.rx * 0.28} fill="#0F1426" opacity={0.7} />
          <ellipse cx={c.cx} cy={c.cy} rx={c.rx} ry={c.rx * 0.28} fill={`url(#${uid}hx)`} opacity={0.5} />
          <path d={`M ${c.cx - c.rx} ${c.cy} A ${c.rx} ${c.rx * 0.28} 0 0 1 ${c.cx + c.rx} ${c.cy}`} fill="none" stroke="#B8C2DF" strokeOpacity={0.5} strokeWidth={4} />
        </g>
      ))}
      {rocas.map((ro, i) => {
        const largo = ro.r * 1.5;
        const sombra = ro.pts.map(([x, y]) => `${x + largo * 0.85},${y + (y - ro.cy) * 0.1 + ro.r * 0.34}`).join(" ");
        const cuerpo = ro.pts.map(([x, y]) => `${x},${y}`).join(" ");
        const luz = ro.pts.slice(0, 4).map(([x, y]) => `${x},${y}`).join(" ") + ` ${ro.cx},${ro.cy}`;
        return (
          <g key={i}>
            <polygon points={sombra} fill="#070A15" opacity={0.72} />
            <polygon points={cuerpo} fill="#8D97B5" stroke="#CDD5EC" strokeOpacity={0.45} strokeWidth={3} strokeLinejoin="round" />
            <polygon points={cuerpo} fill={`url(#${uid}hx)`} opacity={0.55} />
            <polygon points={luz} fill="#C4CCE4" opacity={0.5} />
          </g>
        );
      })}
    </>
  );
};

/* ───────────── bio ───────────── */

const Bio: React.FC<{ f: number; uid: string }> = ({ f, uid }) => {
  const { T } = useViral();
  const verde = T.exito;
  return (
    <>
      <defs>
        <linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={mezclar("#04201F", verde, 0.12)} /><stop offset="1" stopColor="#020C0B" /></linearGradient>
        <radialGradient id={`${uid}l`} cx="50%" cy="0%" r="90%"><stop offset="0" stopColor={verde} stopOpacity={0.3} /><stop offset="1" stopColor={verde} stopOpacity={0} /></radialGradient>
        <Puntos id={`${uid}pm`} color="#021210" paso={13} radio={3.2} opacidad={0.6} />
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}b)`} />
      <rect width={W} height={H * 0.6} fill={`url(#${uid}l)`} />
      {/* bokeh */}
      {Array.from({ length: 12 }, (_, i) => (
        <circle key={i} cx={azar(i * 4.1 + 3) * W + 24 * Math.sin(f / 80 + i)} cy={(azar(i * 6.3 + 1) * H + f * (0.3 + (i % 4) * 0.15)) % H} r={22 + azar(i + 5) * 60} fill="#FFFFFF" opacity={0.05 + (i % 3) * 0.02} />
      ))}
      {/* gotas: cada una cae y al llegar al agua suelta ondas */}
      {Array.from({ length: 4 }, (_, i) => {
        const ciclo = 150 + i * 23;
        const k = ((f + i * 61) % ciclo) / ciclo;
        const x = 190 + azar(i * 8.3 + 2) * 700;
        const yAgua = 1350 + i * 70;
        const cae = Math.min(1, k / 0.42);
        const onda = Math.max(0, (k - 0.42) / 0.58);
        return (
          <g key={i}>
            {cae < 1 && <path d={`M ${x} ${300 + cae * cae * (yAgua - 300) - 30} q 7,18 0,26 q -7,-8 0,-26 Z`} fill="#BFE9FF" opacity={0.9} />}
            {onda > 0 && [0, 0.25, 0.5].map((d, j) => {
              const kk = Math.max(0, onda - d) / (1 - d);
              return kk > 0 ? <ellipse key={j} cx={x} cy={yAgua} rx={14 + kk * 150} ry={(14 + kk * 150) * 0.28} fill="none" stroke="#BFE9FF" strokeOpacity={(1 - kk) * 0.7} strokeWidth={3.5} /> : null;
            })}
          </g>
        );
      })}
      {/* musgo */}
      {Array.from({ length: 34 }, (_, i) => {
        const x = azar(i * 5.9 + 1) * (W + 120) - 60;
        const r = 52 + azar(i * 3.3 + 2) * 80;
        const y = 1700 + azar(i * 7.7 + 4) * 190;
        const tono = [0.0, 0.18, 0.34][i % 3];
        return (
          <g key={i}>
            <circle cx={x + 3 * Math.sin(f / 120 + i)} cy={y} r={r} fill={mezclar("#0A3B2B", verde, 0.1 + tono)} />
            <circle cx={x + 3 * Math.sin(f / 120 + i)} cy={y} r={r} fill={`url(#${uid}pm)`} opacity={0.5} />
          </g>
        );
      })}
      {Array.from({ length: 28 }, (_, i) => {
        const x = azar(i * 9.7 + 2) * W;
        const alto = 60 + azar(i * 2.9 + 6) * 90;
        const sway = Math.sin(f / 50 + i) * 10;
        return <path key={i} d={`M ${x} 1760 q ${sway} ${-alto / 2} ${sway * 2} ${-alto}`} fill="none" stroke={mezclar("#1B7A55", verde, 0.4)} strokeWidth={5} strokeLinecap="round" opacity={0.7} />;
      })}
    </>
  );
};

/* ───────────── célula ───────────── */

const Celula: React.FC<{ f: number; uid: string }> = ({ f, uid }) => {
  const { T } = useViral();
  return (
    <>
      <defs>
        <radialGradient id={`${uid}c`} cx="50%" cy="46%" r="80%"><stop offset="0" stopColor="#2A0F55" /><stop offset="0.7" stopColor="#0E0430" /><stop offset="1" stopColor="#060118" /></radialGradient>
        <radialGradient id={`${uid}g1`}><stop offset="0" stopColor="#FF4FA8" stopOpacity={0.3} /><stop offset="1" stopColor="#FF4FA8" stopOpacity={0} /></radialGradient>
        <radialGradient id={`${uid}g2`}><stop offset="0" stopColor={T.acento2} stopOpacity={0.3} /><stop offset="1" stopColor={T.acento2} stopOpacity={0} /></radialGradient>
        <Puntos id={`${uid}pm`} color="#FF9AD2" paso={20} radio={4.4} opacidad={0.5} />
        <Trama id={`${uid}hx`} color="#05010F" paso={10} grosor={2.2} cruzada opacidad={0.5} />
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}c)`} />
      <circle cx={W * 0.2} cy={H * 0.28} r={480} fill={`url(#${uid}g1)`} />
      <circle cx={W * 0.85} cy={H * 0.8} r={520} fill={`url(#${uid}g2)`} />
      {/* membrana: anillo punteado que respira */}
      <g transform={`translate(${W / 2} ${H * 0.5}) scale(${1 + 0.01 * Math.sin(f / 70)})`}>
        <circle r={800} fill="none" stroke={`url(#${uid}pm)`} strokeWidth={70} />
        <circle r={836} fill="none" stroke="#FF9AD2" strokeOpacity={0.4} strokeWidth={4} />
        <circle r={764} fill="none" stroke="#FF9AD2" strokeOpacity={0.25} strokeWidth={3} />
      </g>
      {/* orgánulos: mitocondrias con crestas */}
      {Array.from({ length: 5 }, (_, i) => {
        const x = 120 + azar(i * 11.3 + 2) * 840 + 18 * Math.sin(f / 90 + i * 2);
        const y = 220 + azar(i * 7.9 + 5) * 1480 + 16 * Math.cos(f / 110 + i);
        const g = azar(i * 3.9) * 180;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${g + f * 0.05})`} opacity={0.5}>
            <ellipse rx={92} ry={42} fill="#7B2B8F" stroke="#FF9AD2" strokeOpacity={0.6} strokeWidth={4} />
            <ellipse rx={92} ry={42} fill={`url(#${uid}hx)`} />
            <path d="M -60,0 q 14,-30 28,0 t 28,0 t 28,0 t 28,0" fill="none" stroke="#FFD0EA" strokeOpacity={0.5} strokeWidth={4} />
          </g>
        );
      })}
      {/* vesículas y ribosomas */}
      {Array.from({ length: 36 }, (_, i) => (
        <circle key={i} cx={azar(i * 5.3 + 1) * W + 26 * Math.sin(f / 70 + i)} cy={(azar(i * 7.1 + 3) * H + f * (0.2 + (i % 5) * 0.1)) % H} r={5 + azar(i * 2.7) * (i % 4 === 0 ? 22 : 8)} fill={i % 3 === 0 ? T.acento2 : "#FF7AC0"} opacity={i % 4 === 0 ? 0.28 : 0.55} />
      ))}
    </>
  );
};

/** Fondo completo de un escenario ilustrado. */
export const FondoEscenario: React.FC<{ sc: EscenarioViral }> = ({ sc }) => {
  const f = useCurrentFrame();
  const uid = useUid();
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <StudioSvgDefs />
        {sc === "espacio" && <Espacio f={f} uid={uid} />}
        {sc === "luna" && <Luna f={f} uid={uid} />}
        {sc === "bio" && <Bio f={f} uid={uid} />}
        {sc === "celula" && <Celula f={f} uid={uid} />}
      </svg>
    </AbsoluteFill>
  );
};
