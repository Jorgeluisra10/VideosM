/**
 * «Tu cerebro se lava mientras duermes» (SINAPSIS · sin voz) · escenas 1/2
 *   glf-gancho    el cerebro de noche, cargado de motas ámbar, con las «Z» del sueño; una ola cian lo barre
 *   glf-basura    despierto: las neuronas disparan y sueltan residuos entre las células
 *   glf-tuberias  el líquido entra por la arteria, cruza el tejido por los astrocitos y sale por la vena (esquema)
 */
import React from "react";
import { GLF, TGL } from "../../anim/piezas";
import { mulberry32 } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, mezclar, spr, useReloj } from "../comun";
import { Estudio, Frases, MONOF, RE } from "./real-kit";
import { Fuente } from "./real1";
import { Chip } from "./med1";
import { Neurona } from "./astro-kit";
import { Cerebro, GL, OlaLCR, Residuos, RelojDigital, Zs, motitasCerebro } from "./glf-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── glf-gancho ───────────── */

export const GlfGancho: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const G = TGL.gancho;
  const sC = spr(f, a(G.cerebro), { damping: 16, stiffness: 80, mass: 1 });
  const ola = clamp((t - a(G.ola)) / a(G.olaDur));
  const respira = 1 + 0.012 * Math.sin(t * 2.2);
  const mot = motitasCerebro(70);
  const luz = 0.25 + 0.55 * easeOut((t - a(G.ola)) / a(1.2));
  return (
    <Estudio piso={1560} resplandor={0.55}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Zs x={760} y={700} t={t} opacidad={clamp((t - a(0.6)) / 0.5)} />
        <Cerebro x={W / 2} y={1010} s={1.5 * sC * respira} luz={luz} sucio={1 - 0.9 * ola}>
          <Residuos motitas={mot} t={t} ola={ola > 0 ? lerp(-300, 330, easeOut(ola)) : null} />
          {ola > 0 && ola < 1 && <OlaLCR x={lerp(-300, 330, easeOut(ola))} />}
        </Cerebro>
        <RelojDigital x={W / 2} y={1400} hora={t < a(G.ola) ? "03:00" : "03:00"} px={46} opacidad={clamp((t - a(0.5)) / 0.4)} />
      </svg>
      <Frases frases={[{ t: G.t1, texto: "tu cerebro", px: 108 }, { t: G.t2, texto: "se lava", color: GL.lcr, px: 128 }, { t: G.t3, texto: "mientras\nduermes", color: RE.blanco, px: 100 }]} y={470} id="glf-gancho-t" />
    </Estudio>
  );
};

/* ───────────── glf-basura ───────────── */

const NEU = [
  { x: 300, y: 690, s: 0.62, fase: 0 },
  { x: 780, y: 650, s: 0.62, fase: 1 },
  { x: 560, y: 960, s: 0.62, fase: 2 },
  { x: 250, y: 1050, s: 0.52, fase: 3 },
] as const;

export const GlfBasura: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const B = TGL.basura;
  const r = mulberry32(8);
  const luces = NEU.map((_, i) => {
    const d = (t - a(B.disparo(i))) / 0.45;
    return d > 0 && d < 1 ? Math.sin(d * Math.PI) : 0;
  });
  // residuos: cada disparo suelta 9 motas que derivan y se quedan entre las células
  const motas = NEU.flatMap((n, i) => Array.from({ length: 9 }, (_, k) => {
    const ang = r() * 6.28, dist = 80 + r() * 190, rad = 4 + r() * 5, v = 0.5 + r() * 0.7;
    return { i, k, ang, dist, rad, v, x0: n.x + (r() - 0.5) * 60, y0: n.y + 40 + (r() - 0.5) * 60 };
  }));
  const medidor = easeOut((t - a(B.medidor)) / a(B.medidorDur));
  const sello = spr(f, a(B.sello), { damping: 11, stiffness: 190, mass: 0.6 });
  return (
    <Estudio piso={1560} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><clipPath id="glf-b-clip"><rect x={120} y={560} width={840} height={650} rx={36} /></clipPath></defs>
        <rect x={120} y={560} width={840} height={650} rx={36} fill="#140E26" stroke={RE.hielo} strokeOpacity={0.18} strokeWidth={2} />
        <g clipPath="url(#glf-b-clip)">
        {NEU.map((n, i) => (
          <Neurona key={i} x={n.x} y={n.y} s={n.s * spr(f, a(0.15 + i * 0.1), { damping: 14, stiffness: 120, mass: 0.8 })} t={t} luz={luces[i]} largoAxon={260} />
        ))}
        {motas.map((m, i) => {
          const t0 = a(B.disparo(m.i)) + 0.25;
          const u = clamp((t - t0) / 2.4);
          if (u <= 0) return null;
          const e = easeOut(u);
          const x = m.x0 + Math.cos(m.ang) * m.dist * e * 0.8 + Math.sin(t * m.v + i) * 6;
          const y = m.y0 + Math.sin(m.ang) * m.dist * e * 0.6 + Math.cos(t * m.v * 0.8 + i) * 6;
          const cx = clamp(x, 160, 920), cy = clamp(y, 600, 1170);
          return (
            <g key={i} transform={`translate(${cx} ${cy})`} opacity={clamp(u * 5)}>
              <circle r={m.rad * 3} fill={GL.ambar} opacity={0.16} />
              <circle r={m.rad} fill={GL.ambarClaro} stroke={GL.ambar} strokeWidth={1.4} />
            </g>
          );
        })}
        </g>
        {/* medidor de residuos */}
        <g transform="translate(120 1290)">
          <rect x={0} y={0} width={840} height={36} rx={18} fill="#0A1222" stroke={RE.hielo} strokeOpacity={0.35} strokeWidth={2} />
          <rect x={4} y={4} width={Math.max(0, 832 * medidor)} height={28} rx={14} fill={GL.ambar} />
          <rect x={4} y={6} width={Math.max(0, 832 * medidor)} height={8} rx={4} fill="#fff" opacity={0.35} />
        </g>
      </svg>
      <div data-texto="basura-med" style={{ position: "absolute", left: 120, top: 1352, fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: GL.ambarClaro, opacity: clamp((t - a(0.9)) / 0.4) }}>residuos entre las células ▸</div>
      <Frases frases={[{ t: 0.2, texto: "despierto,", px: 100 }, { t: 1.5, texto: "pensar\nensucia", color: GL.ambar, px: 112 }]} y={380} id="glf-basura-t" />
      <Chip texto="β-amiloide y otros desechos" x={W / 2} y={1440} color={GL.ambarClaro} opacidad={sello} ancho={520} id="glf-basura-chip" />
    </Estudio>
  );
};

/* ───────────── glf-tuberias ───────────── */

/** Residuos ámbar del tejido: puntos fijos entre los dos vasos. */
const RES_TEJ = (() => {
  const r = mulberry32(14);
  return Array.from({ length: 26 }, () => ({ x: 400 + r() * 280, y: 640 + r() * 520, v: 0.6 + r() * 0.8, rad: 4 + r() * 4, fase: r() * 6.28 }));
})();

export const GlfTuberias: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TGL.tuberias;
  const vasos = spr(f, a(T.vasos), { damping: 15, stiffness: 100, mass: 0.9 });
  const feet = spr(f, a(T.feet), { damping: 12, stiffness: 160, mass: 0.7 });
  const flujo = clamp((t - a(T.flujo)) / a(0.8));
  const barre = clamp((t - a(T.barre)) / a(1.6));
  const XA = 270, XV = 810, Y0 = 600, Y1 = 1220;
  const latido = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 1.1 * t)), 3);
  const nFeet = 6;
  return (
    <Estudio piso={1560} resplandor={0.35}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="glf-art" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7A140C" /><stop offset="0.45" stopColor={GL.arteria} /><stop offset="1" stopColor="#8E1B12" /></linearGradient>
          <linearGradient id="glf-ven" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1B2F7A" /><stop offset="0.45" stopColor={GL.vena} /><stop offset="1" stopColor="#1B2F7A" /></linearGradient>
          <linearGradient id="glf-man" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={GL.lcr} stopOpacity="0.1" /><stop offset="0.5" stopColor={GL.lcr} stopOpacity="0.32" /><stop offset="1" stopColor={GL.lcr} stopOpacity="0.1" /></linearGradient>
        </defs>
        {/* tejido */}
        <rect x={110} y={Y0 - 40} width={860} height={Y1 - Y0 + 80} rx={40} fill="#150F26" stroke={RE.hielo} strokeOpacity={0.18} strokeWidth={2} />
        {Array.from({ length: 22 }, (_, i) => {
          const rr = mulberry32(i + 40);
          return <ellipse key={i} cx={410 + rr() * 260} cy={650 + rr() * 520} rx={26 + rr() * 22} ry={20 + rr() * 16} fill="#2A1C4A" opacity={0.7} stroke="#4B3680" strokeOpacity={0.6} strokeWidth={1.6} />;
        })}
        {/* manguitos de líquido (espacio perivascular) y vasos */}
        {([[XA, 1], [XV, -1]] as const).map(([x, dir]) => (
          <g key={x} opacity={vasos}>
            <rect x={x - 62} y={Y0} width={124} height={Y1 - Y0} rx={30} fill="url(#glf-man)" stroke={GL.lcrClaro} strokeOpacity={0.45} strokeWidth={2} />
            <rect x={x - 32 - (x === XA ? latido * 3 : 0)} y={Y0 - 20} width={64 + (x === XA ? latido * 6 : 0)} height={Y1 - Y0 + 40} rx={26} fill={x === XA ? "url(#glf-art)" : "url(#glf-ven)"} />
            <rect x={x - 20} y={Y0 - 10} width={10} height={Y1 - Y0 + 20} rx={5} fill="#fff" opacity={0.22} />
            {/* corriente de líquido en el manguito */}
            {Array.from({ length: 9 }, (_, i) => {
              const u = ((t * 0.5 * (flujo > 0 ? 1 : 0) + i / 9) % 1);
              const y = dir === 1 ? Y0 + u * (Y1 - Y0) : Y1 - u * (Y1 - Y0);
              return <g key={i} opacity={flujo * Math.sin(u * Math.PI)}>
                <circle cx={x - 46} cy={y} r={6} fill={GL.lcrClaro} />
                <circle cx={x + 46} cy={y + 40 * dir} r={6} fill={GL.lcrClaro} />
              </g>;
            })}
          </g>
        ))}
        {/* pies de los astrocitos alrededor del manguito de la arteria */}
        {Array.from({ length: nFeet }, (_, i) => {
          const y = Y0 + 50 + i * ((Y1 - Y0 - 100) / (nFeet - 1));
          return (
            <g key={i} opacity={feet} transform={`translate(0 ${(1 - feet) * 14})`}>
              {[-1, 1].map((d) => (
                <g key={d}>
                  <ellipse cx={XA + d * 84} cy={y} rx={22} ry={34} fill={GL.oro} stroke={GL.oroClaro} strokeWidth={2} />
                  <ellipse cx={XA + d * 84 - d * 6} cy={y - 10} rx={7} ry={12} fill="#fff" opacity={0.4} />
                  <circle cx={XA + d * 74} cy={y} r={5} fill={GL.lcr} stroke="#fff" strokeWidth={1.4} />
                </g>
              ))}
            </g>
          );
        })}
        {/* corrientes que cruzan el tejido */}
        {Array.from({ length: 7 }, (_, i) => {
          const y = 680 + i * 80;
          const d = `M ${XA + 100} ${y} C ${XA + 220} ${y - 70} ${XV - 220} ${y + 70} ${XV - 100} ${y}`;
          return <path key={i} d={d} fill="none" stroke={GL.lcr} strokeWidth={4} strokeLinecap="round" strokeDasharray="22 26" strokeDashoffset={-t * 90} opacity={0.75 * flujo} />;
        })}
        {/* residuos ámbar arrastrados hacia la vena */}
        {RES_TEJ.map((m, i) => {
          const k = easeOut(clamp((barre * 1.2 - (i % 6) * 0.04)));
          const x = lerp(m.x, XV - 62, k * m.v * 0.95) + Math.sin(t * 2 + m.fase) * 4;
          const y = m.y + Math.sin(t * 1.4 + m.fase) * 5 - k * 30;
          const op = 1 - clamp((k - 0.85) / 0.15);
          return (
            <g key={i} transform={`translate(${x} ${y})`} opacity={op * vasos}>
              <circle r={m.rad * 3} fill={GL.ambar} opacity={0.16} />
              <circle r={m.rad} fill={GL.ambarClaro} stroke={GL.ambar} strokeWidth={1.4} />
            </g>
          );
        })}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "el sistema\nglinfático", color: GL.lcr, px: 96 }, { t: 2.5, texto: "barre los\nresiduos", color: GL.ambar, px: 96 }]} y={400} id="glf-tub-t" />
      <Chip texto="ARTERIA" x={XA} y={Y1 + 70} color={GL.arteriaClara} opacidad={vasos} ancho={200} id="glf-tub-art" />
      <Chip texto="VENA" x={XV} y={Y1 + 70} color={GL.venaClara} opacidad={vasos} ancho={170} id="glf-tub-ven" />
      <Chip texto="astrocitos · canales de agua AQP4" x={W / 2} y={1370} color={GL.oroClaro} opacidad={feet} ancho={640} id="glf-tub-aqp" />
      <Chip texto="líquido cefalorraquídeo ▸" x={W / 2} y={1440} color={GL.lcrClaro} opacidad={flujo} ancho={440} id="glf-tub-lcr" />
      <Fuente texto={`Iliff et al., Sci Transl Med ${GLF.iliffAnio} · descrito en ratones · esquema simplificado`} y={1486} delay={T.chip - 1} />
    </Estudio>
  );
};
