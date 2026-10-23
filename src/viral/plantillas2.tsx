/** Plantillas virales 2/3: BARS (barras que crecen), LINE (tendencia), STEPS (causa → efecto) y LIST (beneficios con check). */
import React from "react";
import { AbsoluteFill } from "remotion";
import { evolvePath, getLength } from "@remotion/paths";
import { TV, type EscenaViralGuardada } from "../anim/viral";
import { StudioSvgDefs } from "../estudio/efectos";
import { useUid } from "../estudio/util";
import { Etiqueta, EsferaIcono, puntoEn, FUENTE, H, IconoSvg, Panel, W, clamp, easeOut, fmtNum, lerp, prog, spr, useReloj, useViral } from "./comun";
import { Encabezado } from "./plantillas1";

type P = { e: EscenaViralGuardada };

/* ───────────── BARS ───────────── */

export const Bars: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const uid = useUid();
  const N = e.bars.length;
  const max = Math.max(...e.bars.map((b) => b.v), 1);
  const BASE = 1440, ALTO = 700, GAP = 34;
  const bw = Math.min(N <= 3 ? 230 : 190, Math.floor((780 - GAP * (N - 1)) / N));
  const total = N * bw + GAP * (N - 1);
  const x0 = 540 - total / 2;
  const xs = e.bars.map((_, i) => x0 + i * (bw + GAP) + bw / 2);
  const alturas = e.bars.map((b, i) => (ALTO * (b.v / max)) * easeOut((t - a(TV.barra(i))) / a(TV.barraDur)));
  const fin = a(TV.barra(N - 1) + TV.barraDur);
  const pFlecha = prog(t, fin - 0.1, 0.7);
  // la flecha de tendencia va por ENCIMA de los valores (nunca los cruza): de la primera a la última barra
  const ax = xs[0], ay = BASE - ALTO * (e.bars[0].v / max) - 130, bx = xs[N - 1], by = BASE - ALTO * (e.bars[N - 1].v / max) - 170;
  const dFlecha = `M ${ax} ${ay} C ${ax + (bx - ax) * 0.3} ${ay - 110}, ${ax + (bx - ax) * 0.72} ${by - 90}, ${bx - 30} ${by}`;
  const ev = evolvePath(pFlecha, dFlecha);
  const sube = e.bars[N - 1].v >= e.bars[0].v;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <defs>
          {e.bars.map((_, i) => {
            const hi = i === e.hi;
            const c = hi ? T.acento : T.acento2;
            return <linearGradient key={i} id={`${uid}b${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c} /><stop offset="1" stopColor={c} stopOpacity={0.55} /></linearGradient>;
          })}
        </defs>
        {[0.25, 0.5, 0.75, 1].map((k) => <line key={k} x1={90} x2={990} y1={BASE - ALTO * k} y2={BASE - ALTO * k} stroke={T.texto} strokeOpacity={0.1} strokeWidth={2.5} strokeDasharray="4 14" strokeLinecap="round" />)}
        {e.bars.map((b, i) => {
          const h = Math.max(0, alturas[i]);
          const hi = i === e.hi;
          const r = Math.min(26, bw / 2.4);
          return (
            <g key={i}>
              {hi && h > 2 && [0, 1, 2].map((q) => <rect key={q} x={xs[i] - bw / 2 - q * 9} y={BASE - h - q * 9} width={bw + q * 18} height={h + q * 9} rx={r + q * 9} fill={T.acento} opacity={0.12 - q * 0.03} />)}
              {h > 2 && <path d={`M ${xs[i] - bw / 2} ${BASE} L ${xs[i] - bw / 2} ${BASE - h + r} Q ${xs[i] - bw / 2} ${BASE - h} ${xs[i] - bw / 2 + r} ${BASE - h} L ${xs[i] + bw / 2 - r} ${BASE - h} Q ${xs[i] + bw / 2} ${BASE - h} ${xs[i] + bw / 2} ${BASE - h + r} L ${xs[i] + bw / 2} ${BASE} Z`} fill={`url(#${uid}b${i})`} />}
              {h > 2 && <rect x={xs[i] - bw / 2} y={BASE - h} width={bw} height={h} rx={r} fill="url(#halftone-dots-s)" mask="url(#halftone-shadow)" opacity={0.7} style={{ clipPath: `inset(0 0 ${0}px 0)` }} />}
            </g>
          );
        })}
        <line x1={90} x2={990} y1={BASE} y2={BASE} stroke={T.texto} strokeWidth={7} strokeLinecap="round" opacity={0.85} />
        {pFlecha > 0 && (
          <g>
            <path d={dFlecha} fill="none" stroke={sube ? T.exito : T.peligro} strokeWidth={12} strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
            {pFlecha > 0.92 && <path d={`M ${bx - 54} ${by - 34} L ${bx - 12} ${by} L ${bx - 56} ${by + 30}`} fill="none" stroke={sube ? T.exito : T.peligro} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />}
          </g>
        )}
      </svg>
      <Encabezado texto={e.h} destacada={e.w} />
      {e.bars.map((b, i) => {
        const k = easeOut((t - a(TV.barra(i))) / a(TV.barraDur));
        const txt = `${fmtNum(b.v * k, Number.isInteger(b.v) ? 0 : 1)}${e.barsU}`;
        const hi = i === e.hi;
        return (
          <React.Fragment key={i}>
            <Etiqueta texto={txt} x={xs[i]} y={BASE - alturas[i] - 46} px={Math.min(60, Math.floor((bw + 30) / 3.4) + 16)} ancho={bw + GAP} color={hi ? T.acento : T.texto} delay={TV.barra(i)} peso={900} mayus={false} id="valor-barra" />
            <Etiqueta texto={b.l} x={xs[i]} y={BASE + 62} px={42} ancho={bw + GAP - 4} color={T.texto} delay={TV.barra(i) + 0.1} peso={800} id="etiqueta-barra" />
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

/* ───────────── LINE ───────────── */

/** Curva suave (Catmull-Rom → Bézier) por los puntos. */
function curva(p: [number, number][]): string {
  let d = `M ${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] ?? p2;
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export const Line: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const uid = useUid();
  const L = e.line!;
  const X0 = 150, X1 = 930, Y0 = 660, Y1 = 1190;
  const mn = Math.min(...L.pts), mx = Math.max(...L.pts);
  const rango = mx - mn || 1;
  const puntos: [number, number][] = L.pts.map((v, i) => [X0 + ((X1 - X0) * i) / (L.pts.length - 1), Y1 - ((v - mn) / rango) * (Y1 - Y0) * 0.86 - (Y1 - Y0) * 0.07]);
  const d = curva(puntos);
  const largo = getLength(d);
  const p = easeOut((t - a(TV.linea)) / a(TV.lineaDur));
  const ev = evolvePath(p, d);
  const cabeza = puntoEn(d, largo * p);
  const sube = L.pts[L.pts.length - 1] >= L.pts[0];
  const color = sube ? T.acento : T.peligro;
  const pct = Math.round(((L.pts[L.pts.length - 1] - L.pts[0]) / (Math.abs(L.pts[0]) || 1)) * 100);
  const end = L.end || `${pct > 0 ? "+" : ""}${pct} %`;
  const fin = puntos[puntos.length - 1];
  const sB = spr(f, a(TV.linea + TV.lineaDur - 0.15), { damping: 9, stiffness: 160, mass: 0.7 });
  const bw = 270, bx = Math.min(fin[0] - bw / 2 - 20, 930 - bw / 2), by = sube ? fin[1] - 130 : Math.min(fin[1] + 105, 1205);
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <defs>
          <linearGradient id={`${uid}a`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity={0.4} /><stop offset="1" stopColor={color} stopOpacity={0} /></linearGradient>
          <clipPath id={`${uid}c`}><rect x={X0 - 30} y={Y0 - 80} width={Math.max(0, cabeza.x - X0 + 30)} height={Y1 - Y0 + 160} /></clipPath>
        </defs>
        <Panel x={80} y={560} w={920} h={780} r={56} />
        {[0, 1, 2, 3].map((k) => <line key={k} x1={X0 - 30} x2={X1 + 20} y1={Y0 + ((Y1 - Y0) * k) / 3} y2={Y0 + ((Y1 - Y0) * k) / 3} stroke={T.texto} strokeOpacity={0.12} strokeWidth={2.5} strokeDasharray="4 14" strokeLinecap="round" />)}
        <g clipPath={`url(#${uid}c)`}><path d={`${d} L ${fin[0]} ${Y1 + 40} L ${X0} ${Y1 + 40} Z`} fill={`url(#${uid}a)`} /></g>
        <path d={d} fill="none" stroke={color} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} opacity={0.22} />
        <path d={d} fill="none" stroke={color} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
        {p > 0.01 && (
          <g>
            <circle cx={cabeza.x} cy={cabeza.y} r={30 + 8 * Math.sin(f / 6)} fill={color} opacity={0.25} />
            <circle cx={cabeza.x} cy={cabeza.y} r={17} fill={T.oscuro ? "#fff" : T.bg0} stroke={color} strokeWidth={9} />
          </g>
        )}
        {sB > 0.01 && (
          <g transform={`translate(${bx} ${by}) scale(${Math.max(0.0001, sB)})`} opacity={clamp(sB * 2)}>
            <rect x={-bw / 2} y={-52} width={bw} height={104} rx={52} fill={color} />
            <path d={`M 40 ${sube ? 50 : -50} L ${fin[0] - bx} ${Math.max(-96, Math.min(98, (fin[1] - by) * 0.8))} L 96 ${sube ? 50 : -50} Z`} fill={color} />
          </g>
        )}
      </svg>
      <Encabezado texto={e.h} destacada={e.w} />
      {sB > 0.01 && (
        <div data-texto="valor-linea" style={{ position: "absolute", left: bx - bw / 2, top: by - 52, width: bw, height: 104, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FUENTE, fontWeight: 900, fontSize: Math.min(60, Math.floor(230 / (Math.max(3, end.length) * 0.62))), color: sube ? (T.oscuro ? T.sobreAcento : T.sobreAcento) : "#fff", letterSpacing: "-0.02em", transform: `scale(${Math.max(0.0001, sB)})`, opacity: clamp(sB * 2), whiteSpace: "nowrap" }}>{end}</div>
      )}
      {L.l0 && <Etiqueta texto={L.l0} x={X0 + 10} y={1300} px={42} ancho={200} alinear="left" color={T.suave} delay={0.5} id="eje" />}
      {L.l1 && <Etiqueta texto={L.l1} x={X1 + 10} y={1300} px={42} ancho={200} alinear="right" color={T.suave} delay={0.5} id="eje" />}
    </AbsoluteFill>
  );
};

/* ───────────── STEPS ───────────── */

export const Steps: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const n = e.items.length;
  const ys = n === 2 ? [780, 1180] : n === 3 ? [720, 1050, 1380] : [650, 910, 1170, 1430];
  const D = n === 4 ? 150 : 180;
  const colores = [T.acento, T.acento2, T.exito, T.acento];
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        {e.items.map((it, i) => {
          const s = spr(f, a(TV.item(i)), { damping: 13, stiffness: 140, mass: 0.8 });
          const ultimo = i === n - 1;
          return (
            <g key={i}>
              {i < n - 1 && (() => {
                const p = prog(t, a(TV.item(i + 1) - 0.4), 0.4);
                const y0 = ys[i] + D / 2 + 12, y1 = ys[i + 1] - D / 2 - 12;
                const yy = lerp(y0, y1, p);
                return (
                  <g>
                    <line x1={250} x2={250} y1={y0} y2={yy} stroke={T.texto} strokeOpacity={0.35} strokeWidth={9} strokeLinecap="round" strokeDasharray="2 20" />
                    {p > 0.95 && <path d={`M 226 ${y1 - 26} L 250 ${y1} L 274 ${y1 - 26}`} fill="none" stroke={T.acento} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />}
                  </g>
                );
              })()}
              <g transform={`translate(${330 + (1 - s) * 180} ${ys[i] - 78})`} opacity={clamp(s * 2)}>
                <Panel x={0} y={0} w={650} h={156} r={46} relleno={ultimo ? T.acento : undefined} borde={ultimo ? T.acento : undefined} />
              </g>
              <EsferaIcono nombre={it.ic} x={250} y={ys[i]} d={D} color={colores[i % colores.length]} delay={TV.item(i)} flota={ultimo ? 8 : 0} colorIcono="#FFFFFF" />
              {ultimo && s > 0.5 && <circle cx={250} cy={ys[i]} r={D / 2 + 22 + 10 * Math.sin(f / 8)} fill="none" stroke={T.acento} strokeWidth={6} opacity={0.5} />}
            </g>
          );
        })}
      </svg>
      <Encabezado texto={e.h} destacada={e.w} />
      {e.items.map((it, i) => {
        const ultimo = i === n - 1;
        const s = spr(f, a(TV.item(i)), { damping: 13, stiffness: 140, mass: 0.8 });
        return <Etiqueta key={i} texto={it.l} x={372 + (1 - s) * 180} y={ys[i]} px={62} ancho={570} alinear="left" color={ultimo ? T.sobreAcento : T.texto} delay={TV.item(i) + 0.05} peso={900} id="paso" />;
      })}
    </AbsoluteFill>
  );
};

/* ───────────── LIST ───────────── */

export const Lista: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const n = e.items.length;
  const Y0 = n >= 4 ? 590 : 640, PASO = n >= 4 ? 232 : 262, ALTO = 190;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        {e.items.map((it, i) => {
          const s = spr(f, a(TV.item(i)), { damping: 14, stiffness: 130, mass: 0.8 });
          const ultimo = i === n - 1;
          const y = Y0 + i * PASO;
          return (
            <g key={i} transform={`translate(${(1 - s) * 420} 0)`} opacity={clamp(s * 2)}>
              <Panel x={90} y={y} w={900} h={ALTO} r={56} relleno={ultimo ? T.acento : undefined} borde={ultimo ? T.acento : undefined} />
              <EsferaIcono nombre="check" x={200} y={y + ALTO / 2} d={118} color={ultimo ? T.bg1 : T.exito} delay={TV.item(i) + 0.08} colorIcono="#FFFFFF" />
            </g>
          );
        })}
      </svg>
      <Encabezado texto={e.h} destacada={e.w} />
      {e.items.map((it, i) => {
        const s = spr(f, a(TV.item(i)), { damping: 14, stiffness: 130, mass: 0.8 });
        const ultimo = i === n - 1;
        return <Etiqueta key={i} texto={it.l} x={290 + (1 - s) * 420} y={Y0 + i * PASO + ALTO / 2} px={58} ancho={650} alinear="left" color={ultimo ? T.sobreAcento : T.texto} delay={TV.item(i) + 0.05} peso={800} mayus={false} id="item" />;
      })}
    </AbsoluteFill>
  );
};
