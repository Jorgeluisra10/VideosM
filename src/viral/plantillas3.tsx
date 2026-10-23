/** Plantillas virales 3/3: ROUTE (ruta de metro con tren) y SKYLINE (ciudad que crece con flecha de valorización). */
import React from "react";
import { AbsoluteFill } from "remotion";
import { evolvePath, getLength } from "@remotion/paths";
import { azar } from "../lib/anim";
import { TV, type EscenaViralGuardada } from "../anim/viral";
import { StudioSvgDefs } from "../estudio/efectos";
import { useUid } from "../estudio/util";
import { Etiqueta, FUENTE, puntoEn, H, IconoSvg, W, aclarar, clamp, easeInOut, easeOut, lerp, mezclar, oscurecer, prog, spr, useReloj, useViral } from "./comun";
import { Encabezado } from "./plantillas1";

type P = { e: EscenaViralGuardada };

function curva(p: [number, number][]): string {
  let d = `M ${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] ?? p2;
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/* ───────────── ROUTE ───────────── */

const RUTA: [number, number][] = [[270, 1490], [570, 1460], [840, 1330], [770, 1090], [410, 990], [300, 790], [540, 660]];

/** Para cada estación elige dónde poner su etiqueta (arriba, abajo, izquierda, derecha): el sitio más lejos del trazado y dentro de la zona segura. */
function colocarEtiquetas(d: string, largo: number, est: { x: number; y: number; s: string }[], px: number): { x: number; y: number; alinear: "left" | "right" | "center" }[] {
  const muestras = Array.from({ length: 90 }, (_, i) => puntoEn(d, (largo * i) / 89));
  const distRect = (cx: number, cy: number, w: number, h: number, q: { x: number; y: number }): number => {
    const dx = Math.max(Math.abs(q.x - cx) - w / 2, 0), dy = Math.max(Math.abs(q.y - cy) - h / 2, 0);
    return Math.hypot(dx, dy);
  };
  const ocupados: { cx: number; cy: number; w: number; h: number }[] = [];
  return est.map((s) => {
    const w = Math.min(380, s.s.length * px * 0.66 + 56), h = px * 1.5;
    const cx0 = Math.min(Math.max(s.x, 110 + w / 2), 970 - w / 2);
    const cand: { x: number; y: number; alinear: "left" | "right" | "center"; cx: number; cy: number }[] = [
      { x: cx0, y: s.y + 78 + h / 2, alinear: "center", cx: cx0, cy: s.y + 78 + h / 2 },
      { x: cx0, y: s.y - 78 - h / 2, alinear: "center", cx: cx0, cy: s.y - 78 - h / 2 },
      { x: s.x + 62, y: s.y, alinear: "left", cx: s.x + 62 + w / 2, cy: s.y },
      { x: s.x - 62, y: s.y, alinear: "right", cx: s.x - 62 - w / 2, cy: s.y },
    ];
    let mejor = cand[0], mejorPuntos = -Infinity;
    for (const c of cand) {
      const dentro = c.cx - w / 2 >= 100 && c.cx + w / 2 <= 980 && c.cy >= 560 && c.cy <= 1620;
      const lejos = Math.min(...muestras.map((q) => distRect(c.cx, c.cy, w, h, q)), 400);
      const choque = ocupados.some((o) => Math.abs(o.cx - c.cx) < (o.w + w) / 2 && Math.abs(o.cy - c.cy) < (o.h + h) / 2);
      const puntos = lejos - (dentro ? 0 : 500) - (choque ? 500 : 0);
      if (puntos > mejorPuntos) { mejorPuntos = puntos; mejor = c; }
    }
    ocupados.push({ cx: mejor.cx, cy: mejor.cy, w, h });
    return { x: mejor.x, y: mejor.y, alinear: mejor.alinear };
  });
}

export const Ruta: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const d = curva(RUTA);
  const largo = getLength(d);
  const N = e.stops.length;
  const p = easeInOut((t - a(TV.ruta)) / a(TV.rutaDur));
  const ev = evolvePath(p, d);
  const punto = (frac: number) => puntoEn(d, largo * clamp(frac));
  const estaciones = e.stops.map((s, i) => ({ s, ...punto(i / (N - 1)), frac: i / (N - 1) }));
  const vagones = [0, 1, 2].map((k) => {
    const frac = clamp(p - (k * 118) / largo);
    const a1 = puntoEn(d, largo * clamp(frac - 4 / largo)), b1 = puntoEn(d, largo * clamp(frac + 4 / largo));
    const c = puntoEn(d, largo * frac);
    return { x: c.x, y: c.y, ang: (Math.atan2(b1.y - a1.y, b1.x - a1.x) * 180) / Math.PI, k };
  });
  const fin = estaciones[N - 1];
  const sitios = React.useMemo(() => colocarEtiquetas(d, largo, estaciones.map(({ x, y, s }) => ({ x, y, s })), 44), [d]);
  const sTag = spr(f, a(TV.ruta + TV.rutaDur), { damping: 9, stiffness: 170, mass: 0.7 });
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <path d={d} fill="none" stroke={T.texto} strokeOpacity={0.16} strokeWidth={34} strokeLinecap="round" />
        <path d={d} fill="none" stroke={T.texto} strokeOpacity={0.5} strokeWidth={4} strokeDasharray="2 22" strokeLinecap="round" />
        <path d={d} fill="none" stroke={T.acento} strokeWidth={34} strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} opacity={0.9} />
        {estaciones.map((s, i) => {
          const encendida = p >= s.frac - 0.015 && t > a(TV.ruta);
          const k = encendida ? spr(f, a(TV.ruta + TV.rutaDur * s.frac * 0.98), { damping: 8, stiffness: 190, mass: 0.6 }) : 0;
          return (
            <g key={i}>
              <circle cx={s.x} cy={s.y} r={34 + 14 * k} fill={encendida ? T.acento : T.bg0} stroke={encendida ? (T.oscuro ? "#fff" : T.bg0) : T.texto} strokeWidth={9} strokeOpacity={encendida ? 1 : 0.5} />
              {encendida && <circle cx={s.x} cy={s.y} r={34 + 30 * k} fill="none" stroke={T.acento} strokeWidth={5} opacity={clamp(1.2 - k)} />}
            </g>
          );
        })}
        {vagones.reverse().map(({ x, y, ang, k }) => (
          p > 0.002 && (
            <g key={k} transform={`translate(${x} ${y}) rotate(${ang})`}>
              <rect x={k === 0 ? -64 : -48} y={-28} width={k === 0 ? 128 : 96} height={56} rx={22} fill={k === 0 ? T.acento : T.acento2} stroke={T.oscuro ? "#fff" : T.bg0} strokeWidth={5} />
              {k === 0 && <rect x={14} y={-17} width={36} height={22} rx={8} fill={T.sobreAcento} opacity={0.85} />}
              {k !== 0 && <rect x={-30} y={-14} width={60} height={20} rx={8} fill="#fff" opacity={0.8} />}
            </g>
          )
        ))}
        {sTag > 0.01 && e.end && (
          <g transform={`translate(${fin.x} ${fin.y - 150}) scale(${Math.max(0.0001, sTag)})`} opacity={clamp(sTag * 2)}>
            <rect x={-180} y={-48} width={360} height={96} rx={48} fill={T.exito} />
            <path d="M -22 46 L 0 78 L 22 46 Z" fill={T.exito} />
          </g>
        )}
      </svg>
      <Encabezado texto={e.h} destacada={e.w} />
      {estaciones.map((s, i) => {
        const k = prog(t, a(TV.ruta + TV.rutaDur * s.frac * 0.9 - 0.2), 0.3);
        const sitio = sitios[i];
        return <Etiqueta key={i} texto={s.s} x={sitio.x} y={sitio.y} px={44} ancho={380} alinear={sitio.alinear} color={T.texto} delay={0} opacidad={k} peso={900} id="estacion" fondo={T.oscuro ? "rgba(2,20,50,0.55)" : "rgba(255,255,255,0.7)"} relleno={24} />;
      })}
      {sTag > 0.01 && e.end && <Etiqueta texto={e.end} x={fin.x} y={fin.y - 150} px={46} ancho={330} color="#fff" delay={TV.ruta + TV.rutaDur} peso={900} id="meta-ruta" />}
    </AbsoluteFill>
  );
};

/* ───────────── SKYLINE ───────────── */

const ANCHOS = [96, 128, 92, 150, 112, 130, 92];
const ALTOS = [360, 480, 320, 700, 440, 560, 340];

export const Ciudad: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const uid = useUid();
  const SUELO = 1440, GAP = 16;
  const total = ANCHOS.reduce((s, w) => s + w, 0) + GAP * (ANCHOS.length - 1);
  let x = 540 - total / 2;
  const edificios = ANCHOS.map((w, i) => { const e0 = { x, w, h: ALTOS[i], i }; x += w + GAP; return e0; });
  const alto = edificios[3];
  const color = T.oscuro ? mezclar(T.acento2, T.bg1, 0.45) : T.texto;
  const topes = edificios.map((b) => SUELO - b.h * easeOut((t - a(TV.ciudad + b.i * 0.1)) / 0.9));
  // flecha de valorización que sube por encima de la ciudad
  const pF = prog(t, a(TV.ciudad + 0.7), 1.1);
  const dF = `M 120 1330 C 330 1300, 420 1050, 560 ${SUELO - ALTOS[3] - 60} S 760 ${SUELO - ALTOS[3] - 90}, ${alto.x + alto.w / 2 + 30} ${SUELO - ALTOS[3] - 110}`;
  const ev = evolvePath(pF, dF);
  const punta = puntoEn(dF, getLength(dF) * clamp(pF));
  const sTag = spr(f, a(TV.etiqueta), { damping: 9, stiffness: 170, mass: 0.7 });
  const tx = Math.min(Math.max(alto.x + alto.w / 2, 300), 780), ty = SUELO - ALTOS[3] - 215;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <defs>
          <linearGradient id={`${uid}e`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={aclarar(color, T.oscuro ? 0.25 : 0.28)} /><stop offset="1" stopColor={oscurecer(color, 0.35)} /></linearGradient>
          <radialGradient id={`${uid}s`}><stop offset="0" stopColor={T.oscuro ? T.acento : "#FFFFFF"} stopOpacity={0.9} /><stop offset="1" stopColor={T.oscuro ? T.acento : "#FFFFFF"} stopOpacity={0} /></radialGradient>
        </defs>
        <circle cx={800} cy={880} r={330} fill={`url(#${uid}s)`} opacity={0.5} />
        {edificios.map((b) => {
          const top = topes[b.i];
          const h = SUELO - top;
          if (h < 2) return null;
          const filas = Math.max(1, Math.floor((b.h - 50) / 56)), cols = Math.max(1, Math.floor((b.w - 20) / 40));
          return (
            <g key={b.i}>
              <rect x={b.x} y={top} width={b.w} height={h} rx={10} fill={`url(#${uid}e)`} />
              <rect x={b.x} y={top} width={b.w} height={h} rx={10} fill="url(#halftone-dots-m)" mask="url(#halftone-shadow)" opacity={0.55} />
              {b.i === 3 && h > b.h * 0.9 && <><rect x={b.x + b.w / 2 - 5} y={top - 60} width={10} height={60} fill={color} /><circle cx={b.x + b.w / 2} cy={top - 64} r={11} fill={T.peligro} opacity={0.6 + 0.4 * Math.sin(f / 8)} /></>}
              {Array.from({ length: filas * cols }, (_, k) => {
                const r = Math.floor(k / cols), c = k % cols;
                const wy = SUELO - 70 - r * 56;
                if (wy < top + 24) return null;
                const enciende = azar(b.i * 17 + k * 1.3) > 0.42;
                const encendida = enciende && t > a(TV.ciudad + 0.7 + azar(k + b.i) * 1.1);
                return <rect key={k} x={b.x + 14 + c * 40 + (b.w - 20 - cols * 40) / 2} y={wy} width={24} height={34} rx={5} fill={encendida ? T.acento : "#fff"} opacity={encendida ? 0.95 : T.oscuro ? 0.1 : 0.16} />;
              })}
            </g>
          );
        })}
        <rect x={60} y={SUELO} width={960} height={14} rx={7} fill={T.texto} opacity={0.85} />
        <path d={dF} fill="none" stroke={T.exito} strokeWidth={26} strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} opacity={0.28} />
        <path d={dF} fill="none" stroke={T.exito} strokeWidth={14} strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
        {pF > 0.04 && <circle cx={punta.x} cy={punta.y} r={20} fill={T.exito} stroke={T.oscuro ? "#fff" : T.bg0} strokeWidth={7} />}
        {sTag > 0.01 && e.end && (
          <g transform={`translate(${tx} ${ty}) scale(${Math.max(0.0001, sTag)})`} opacity={clamp(sTag * 2)}>
            <rect x={-170} y={-56} width={340} height={112} rx={56} fill={T.exito} />
            <path d="M -24 54 L 0 90 L 24 54 Z" fill={T.exito} />
          </g>
        )}
      </svg>
      <Encabezado texto={e.h} destacada={e.w} />
      {sTag > 0.01 && e.end && <Etiqueta texto={e.end} x={tx} y={ty} px={68} ancho={300} color="#FFFFFF" delay={TV.etiqueta} peso={900} mayus={false} id="valor-ciudad" />}
      {e.sub && <Etiqueta texto={e.sub} x={W / 2} y={1540} px={46} ancho={840} color={T.texto} delay={1.2} peso={700} mayus={false} id="sub-ciudad" />}
    </AbsoluteFill>
  );
};
