/**
 * «¿Tu intestino es un segundo cerebro?» (SINAPSIS · sin voz) · escenas 2/2
 *   int-hirsch  Hirschsprung: sin neuronas en un tramo del colon, el alimento no avanza
 *   int-sero    ≈ 90 % de la serotonina se fabrica en el intestino, pero no cruza la barrera del cerebro
 *   int-vago    el nervio vago: ≈ 80 % de las fibras llevan información hacia el cerebro
 *   int-cierre  no es un segundo cerebro: es una red que habla con el primero
 */
import React from "react";
import { INT, TIN, mulberry32 } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Estudio, Frases, MONOF, RE } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { Cerebro } from "./glf-kit";
import { Chevron, IC, Intestino, cxTubo } from "./int-kit";

type P = { e: EscenaViralGuardada };
const gauss = (x: number, s: number): number => Math.exp(-(x * x) / (2 * s * s));

/* ───────────── int-hirsch ───────────── */

export const IntHirsch: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const Hh = TIN.hirsch;
  const ent = spr(f, a(Hh.tubo), { damping: 16, stiffness: 90, mass: 1 });
  const neu = clamp((t - a(Hh.neuronas)) / a(1.2));
  const pila = clamp((t - a(Hh.pila)) / a(1.8));
  const YA = 1010;
  const luz = (y: number): number => neu * (0.5 + 0.5 * Math.sin(t * 4 - y / 40));
  // bolos que se acumulan sobre el tramo estrecho
  const bolos = [0, 1, 2].map((i) => ({ y: lerp(700 + i * 60, YA - 90 - i * 70, easeOut(pila)), r: 54 - i * 6 }));
  const cx = (y: number): number => cxTubo(y);
  return (
    <Estudio piso={1560} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Intestino y0={560} y1={1340} R0={72} agangDesde={YA} dilata={pila} k={ent} neuronas luzNeuronas={luz} />
        {bolos.map((b, i) => (
          <g key={i} opacity={clamp(pila * 3 - i * 0.4)}>
            <ellipse cx={cx(b.y)} cy={b.y} rx={b.r * (1 + 0.5 * pila)} ry={b.r * 0.75} fill="#B07A3A" stroke="#F6D79B" strokeOpacity={0.6} strokeWidth={2} />
            <ellipse cx={cx(b.y) - b.r * 0.3} cy={b.y - b.r * 0.25} rx={b.r * 0.3} ry={b.r * 0.14} fill="#fff" opacity={0.35} />
          </g>
        ))}
        <g opacity={clamp((t - a(Hh.neuronas)) / 0.5)}>
          <line x1={120} y1={YA - 18} x2={960} y2={YA - 18} stroke={IC.rojo} strokeWidth={3} strokeDasharray="12 10" opacity={0.8} />
        </g>
      </svg>
      <Chip texto="con neuronas ▲" x={800} y={800} color={IC.neuronaClara} opacidad={neu} ancho={300} id="int-hir-c1" />
      <Chip texto="sin neuronas ▼" x={800} y={1180} color={IC.rojo} opacidad={clamp((t - a(Hh.pila)) / 0.5)} ancho={300} id="int-hir-c2" />
      <Frases frases={[{ t: 0.2, texto: "sin neuronas,", px: 96 }, { t: 2.0, texto: "no hay avance", color: IC.rojo, px: 100 }]} y={430} id="int-hir-t" />
      <Chip texto="enfermedad de Hirschsprung" x={W / 2} y={1440} color={IC.oro} opacidad={clamp((t - a(Hh.chip)) / 0.5)} ancho={640} id="int-hir-c3" />
      <Fuente texto="Hirschsprung: faltan neuronas entéricas en un tramo del intestino; en la mayoría de los casos, el último tramo del colon" y={1486} delay={Hh.chip} />
    </Estudio>
  );
};

/* ───────────── int-sero ───────────── */

export const IntSero: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const S = TIN.sero;
  const ent = spr(f, a(S.intestino), { damping: 16, stiffness: 90, mass: 1 });
  const dato = clamp((t - a(S.dato)) / 0.5);
  const val = Math.round(INT.enterocromafines * easeOut((t - a(S.dato)) / a(1.6)));
  const bloqueo = clamp((t - a(S.bloqueo)) / 0.5);
  const RX = 760, RY0 = 1180, RY1 = 905; // capilar
  // serotonina que sube por el capilar y choca con la barrera
  const puntos = Array.from({ length: 7 }, (_, i) => {
    const u0 = t - a(S.suben) - i * 0.28;
    const u = u0 / 1.5;
    return { u, i };
  });
  const r = mulberry32(5);
  const ec = [0, 1, 2, 3, 4].map((i) => ({ x: 150 + i * 150, fase: r() * 6 }));
  const lat = 0.5 + 0.5 * Math.sin(t * 3);
  return (
    <Estudio piso={1560} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="int-vel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFC2B3" /><stop offset="1" stopColor="#7D2F33" /></linearGradient>
          <radialGradient id="int-ec" cx="40%" cy="30%" r="80%"><stop offset="0" stopColor="#FFF1B0" /><stop offset="0.6" stopColor="#FFC500" /><stop offset="1" stopColor="#B27F00" /></radialGradient>
        </defs>
        {/* cerebro con su barrera */}
        <Cerebro x={540} y={760} s={0.58 * ent} luz={0.3}>
          <circle cx={90} cy={110} r={34 + 8 * lat} fill={IC.serotonina} opacity={0.3 * clamp(bloqueo * 2)} />
          {[0, 1, 2].map((i) => <circle key={i} cx={70 + i * 24} cy={120 - i * 14} r={7} fill={IC.serotoninaClara} stroke={IC.serotonina} strokeWidth={2} opacity={clamp(bloqueo * 2)} />)}
        </Cerebro>
        <ellipse cx={540} cy={745} rx={190} ry={140} fill="none" stroke="#4FD1FF" strokeWidth={6} strokeDasharray="14 10" opacity={0.6 * ent} />
        {/* capilar */}
        <path d={`M ${RX} ${RY0} C ${RX + 50} 1080 ${RX - 40} 980 ${RX - 10} ${RY1 + 40}`} fill="none" stroke="#8E1B12" strokeWidth={22} strokeLinecap="round" opacity={ent} />
        <path d={`M ${RX} ${RY0} C ${RX + 50} 1080 ${RX - 40} 980 ${RX - 10} ${RY1 + 40}`} fill="none" stroke="#E5392B" strokeWidth={14} strokeLinecap="round" opacity={ent} />
        {/* pared del intestino con vellosidades */}
        <g opacity={ent}>
          <rect x={110} y={1230} width={860} height={150} rx={30} fill="url(#int-vel)" stroke="#FFC2B3" strokeOpacity={0.4} strokeWidth={2} />
          {ec.map((c, i) => (
            <g key={i}>
              <path d={`M ${c.x - 40} 1232 Q ${c.x - 34} 1140 ${c.x} 1130 Q ${c.x + 34} 1140 ${c.x + 40} 1232 Z`} fill="#F6A494" stroke="#FFD2C6" strokeOpacity={0.6} strokeWidth={2} />
              <g transform={`translate(${c.x} 1176)`} opacity={clamp((t - a(S.ec + i * 0.1)) / 0.4)}>
                <circle r={22 + 3 * Math.sin(t * 4 + c.fase)} fill="url(#int-ec)" stroke="#FFF1B0" strokeWidth={2} />
              </g>
              {[0, 1, 2].map((j) => {
                const u = ((t * 0.7 + j / 3 + c.fase) % 1);
                const on = clamp((t - a(S.ec + i * 0.1 + 0.3)) / 0.3);
                return <circle key={j} cx={c.x + Math.sin(u * 6 + j) * 16} cy={1176 - 22 - u * 80} r={6} fill={IC.serotoninaClara} stroke={IC.serotonina} strokeWidth={2} opacity={(1 - u) * on} />;
              })}
            </g>
          ))}
        </g>
        {/* serotonina que sube y rebota en la barrera */}
        {puntos.map(({ u, i }) => {
          if (u <= 0) return null;
          const k = Math.min(1, u);
          const y = lerp(RY0, RY1 + 50, k) - (u > 1 ? Math.min(1, u - 1) * 30 * Math.sin(Math.min(1, u - 1) * Math.PI) : 0);
          const x = RX + 14 * Math.sin(k * 5 + i) + (u > 1 ? (u - 1) * 40 * (i % 2 ? 1 : -1) : 0);
          const op = u < 1.5 ? 1 : clamp(1 - (u - 1.5) * 2);
          return <circle key={i} cx={x} cy={y} r={8} fill={IC.serotoninaClara} stroke={IC.serotonina} strokeWidth={3} opacity={op} />;
        })}
        {bloqueo > 0 && (
          <g transform={`translate(${RX - 10} ${RY1}) scale(${bloqueo})`}>
            <circle r={36} fill="#06101C" fillOpacity={0.9} stroke={IC.rojo} strokeWidth={5} />
            <path d="M -13 -13 L 13 13 M 13 -13 L -13 13" stroke={IC.rojo} strokeWidth={7} strokeLinecap="round" />
          </g>
        )}
      </svg>
      <Dato valor={val} x={110} y={955} px={104} digitos={2} alinear="left" sufijo=" %" color={IC.serotoninaClara} id="int-ser-d" opacidad={dato} />
      <div data-texto="int-ser-et" style={{ position: "absolute", left: 110, top: 1030, width: 380, fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 32, lineHeight: 1.2, color: RE.blanco, opacity: dato * 0.92 }}>de la serotonina se fabrica aquí</div>
      <Frases frases={[{ t: 0.2, texto: "casi el 90 %\nde tu serotonina", px: 88 }, { t: S.bloqueo - 0.2, texto: "no llega\nal cerebro", color: IC.rojo, px: 100 }]} y={400} id="int-ser-t" />
      <Chip texto="el cerebro fabrica la suya" x={W / 2} y={1440} color={IC.serotoninaClara} opacidad={bloqueo} ancho={600} id="int-ser-chip" />
    </Estudio>
  );
};

/* ───────────── int-vago ───────────── */

export const IntVago: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const V = TIN.vago;
  const ent = spr(f, a(V.cable), { damping: 16, stiffness: 90, mass: 1 });
  const dato = spr(f, a(V.dato), { damping: 11, stiffness: 190, mass: 0.6 });
  const nPuntos = Math.round(100 * clamp((t - a(V.puntos)) / a(V.puntosDur)));
  const subir = clamp((t - a(V.sube)) / 0.6);
  const CX = 290;
  // 100 fibras: 80 suben (azul), 20 bajan (oro), repartidas con una barajada fija
  const idx = Array.from({ length: 100 }, (_, i) => i);
  const r = mulberry32(12);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  const baja = new Set(idx.slice(0, INT.vagoEfer));
  return (
    <Estudio piso={1560} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Cerebro x={CX} y={700} s={0.5 * ent} luz={0.3} />
        {/* cable del vago con chevrons */}
        <g opacity={ent}>
          <rect x={CX - 36} y={820} width={72} height={380} rx={30} fill="#1C2A3E" stroke="#E7D7A8" strokeOpacity={0.7} strokeWidth={4} />
          {Array.from({ length: 5 }, (_, c) => (
            <line key={c} x1={CX - 24 + c * 12} y1={830} x2={CX - 24 + c * 12} y2={1190} stroke={c === 4 ? IC.oro : IC.azul} strokeOpacity={0.35} strokeWidth={3} />
          ))}
          {Array.from({ length: 5 }, (_, i) => {
            const u = ((t * 0.45 + i / 5) % 1);
            return <Chevron key={`a${i}`} x={CX - 12} y={1180 - u * 340} color={IC.azul} s={1.3} opacidad={Math.sin(u * Math.PI) * subir} />;
          })}
          {Array.from({ length: 5 }, (_, i) => {
            const u = ((t * 0.45 + i / 5 + 0.1) % 1);
            return <Chevron key={`b${i}`} x={CX + 4} y={1180 - u * 340} color={IC.azul} s={1.3} opacidad={Math.sin(u * Math.PI) * subir} />;
          })}
          {Array.from({ length: 2 }, (_, i) => {
            const u = ((t * 0.3 + i / 2) % 1);
            return <Chevron key={`c${i}`} x={CX + 22} y={830 + u * 340} color={IC.oro} s={1.3} abajo opacidad={Math.sin(u * Math.PI) * subir} />;
          })}
        </g>
        {/* intestino (abajo del cable) */}
        <path d={`M ${CX - 70} 1250 C ${CX - 20} 1330 ${CX + 40} 1200 ${CX + 90} 1290 C ${CX + 140} 1380 ${CX - 10} 1400 ${CX - 70} 1330`} fill="none" stroke="#7D2F33" strokeWidth={46} strokeLinecap="round" opacity={ent} />
        <path d={`M ${CX - 70} 1250 C ${CX - 20} 1330 ${CX + 40} 1200 ${CX + 90} 1290 C ${CX + 140} 1380 ${CX - 10} 1400 ${CX - 70} 1330`} fill="none" stroke="#E58C7B" strokeWidth={34} strokeLinecap="round" opacity={ent} />
        {/* sección del nervio: 100 fibras */}
        <g transform="translate(580 790)">
          {Array.from({ length: 100 }, (_, i) => {
            const c = i % 10, fl = Math.floor(i / 10);
            const on = i < nPuntos;
            const sube = !baja.has(i);
            const col = on ? (subir > 0 ? (sube ? IC.azul : IC.oro) : "#9DB3C9") : "#243248";
            return <circle key={i} cx={c * 38} cy={fl * 38} r={13} fill={col} stroke={on ? "#fff" : "none"} strokeOpacity={0.5} strokeWidth={1.6} opacity={on ? 1 : 0.5} />;
          })}
        </g>
      </svg>
      <div data-texto="int-vago-et" style={{ position: "absolute", left: 560, top: 1180, width: 400, fontFamily: MONOF, fontWeight: 700, fontSize: 24, color: IC.hielo, opacity: clamp((t - a(V.puntos)) / 0.4) }}>100 fibras del nervio vago</div>
      <Dato valor={Math.round(INT.vagoAfer * easeOut((t - a(V.dato - 0.1)) / a(1.2)))} x={770} y={1300} px={104} digitos={2} sufijo=" %" color={IC.azul} id="int-vago-d" opacidad={clamp(dato * 1.5)} />
      <Frases frases={[{ t: 0.2, texto: "el nervio vago", px: 92 }, { t: V.sube, texto: "sube más\nde lo que baja", color: IC.azul, px: 92 }]} y={430} id="int-vago-t" />
      <Chip texto="intestino → cerebro" x={770} y={1410} color={IC.azul} opacidad={dato} ancho={420} id="int-vago-chip" />
      <Fuente texto={`Estimación clásica: ≈ 80 % de fibras aferentes y 20 % eferentes · Bonaz et al., Front Neurosci ${INT.bonazAnio}`} y={1486} delay={V.dato} />
    </Estudio>
  );
};

/* ───────────── int-cierre ───────────── */

export const IntCierre: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const C = TIN.cierre;
  const ent = spr(f, a(C.red), { damping: 16, stiffness: 90, mass: 1 });
  const lat = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 1.1 * t)), 3);
  // tres rutas de comunicación entre el intestino (abajo) y el cerebro (arriba)
  const rutas = [
    { d: "M 330 1160 C 200 1000 220 860 330 780", c: IC.azul, n: "nervios" },
    { d: "M 540 1130 C 560 1000 520 880 540 800", c: IC.rojo, n: "sangre" },
    { d: "M 760 1160 C 890 1000 870 860 760 780", c: IC.serotonina, n: "señales químicas" },
  ];
  const luz = (y: number): number => 0.4 + 0.5 * gauss(y - (1120 + 140 * Math.sin(t * 2)), 100);
  return (
    <Estudio piso={1560} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Cerebro x={540} y={680} s={0.78 * ent} luz={0.3 + 0.4 * lat} />
        {rutas.map((ru, i) => (
          <g key={i} opacity={ent}>
            <path d={ru.d} fill="none" stroke={ru.c} strokeWidth={6} strokeLinecap="round" strokeDasharray="4 14" opacity={0.7} />
            {[0, 1].map((k) => {
              const arriba = i !== 2 ? 1 : 0;
              const u = (((t - a(C.pulso(i))) * 0.5 + k * 0.5) % 1 + 1) % 1;
              const q = arriba ? u : 1 - u;
              const [x, y] = ((): [number, number] => {
                // bezier cúbica
                const m = ru.d.match(/-?\d+(\.\d+)?/g)!.map(Number);
                const [x0, y0, x1, y1, x2, y2, x3, y3] = m;
                const mt = 1 - q;
                return [mt ** 3 * x0 + 3 * mt * mt * q * x1 + 3 * mt * q * q * x2 + q ** 3 * x3, mt ** 3 * y0 + 3 * mt * mt * q * y1 + 3 * mt * q * q * y2 + q ** 3 * y3];
              })();
              return <circle key={k} cx={x} cy={y} r={11} fill={ru.c} stroke="#fff" strokeWidth={2.5} opacity={clamp((t - a(C.pulso(i))) / 0.3)} />;
            })}
          </g>
        ))}
        <Intestino y0={1130} y1={1420} R0={44} amp={0} cx0={540} bolo={1180 + 60 * Math.sin(t * 2)} onda k={ent} luzNeuronas={luz} />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "no es un\nsegundo cerebro", px: 92 }, { t: C.chip - 0.4, texto: "es una red que\nhabla con el primero", color: IC.neurona, px: 80 }]} y={420} id="int-cie-t" />
      <Chip texto="eje intestino–cerebro" x={W / 2} y={1470} color={IC.neuronaClara} opacidad={clamp((t - a(C.chip)) / 0.5)} ancho={560} id="int-cie-chip" />
    </Estudio>
  );
};
