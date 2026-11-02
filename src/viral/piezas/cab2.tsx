/**
 * «Tus cables se enredan solos» (SINAPSIS · física cotidiana) · escenas 2/2
 *   cab-flexible  dos cajas: la cuerda rígida y la flexible (SIMULACIÓN 2D ilustrativa) con su contador de cruces
 *   cab-nudos     cuaderno: trébol (3 cruces) y cinquefoil (5) dibujados con arriba y abajo, y barras que decaen con el número de cruces (esquema)
 *   cab-receta    la receta del nudo: largo, flexible y agitado → nudo (con la salvedad de que el estudio usó una sola cuerda)
 */
import React, { useMemo } from "react";
import { CAB, TCAB } from "../../anim/piezas";
import { FPS_CUERDA, probRelativaCruces, simularCuerda } from "../../anim/cuerda";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, LineaCap, MONO, W, clamp, easeOut, spr, useReloj } from "../comun";
import { AN, Lienzo } from "./anom-ui";
import { CB, CajaGiro, CuerdaSim, CuerdaZ, curvaToro } from "./cab-kit";
import { Garabato, Nota, Texto } from "./dig-kit";
import { Frases } from "./real-kit";
import { Flecha } from "./pte-kit";

type P = { e: EscenaViralGuardada };

const Cap: React.FC<{ e: EscenaViralGuardada; color?: string }> = ({ e, color }) => (e.cap ? <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={color ?? AN.papel} /> : null);

/* ───────────── cab-flexible ───────────── */

export const CabFlexible: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const F = TCAB.flexible;
  const rigida = useMemo(() => simularCuerda({ n: 64, largo: 6, rigidez: 0.92, rps: CAB.rps, seg: CAB.tumbleSeg }), []);
  const flexible = useMemo(() => simularCuerda({ n: 64, largo: 6, rigidez: 0.15, rps: CAB.rps, seg: CAB.tumbleSeg }), []);
  const kg = clamp((t - a(F.gira)) / a(F.giraDur));
  const idx = Math.min(rigida.frames.length - 1, Math.round(kg * CAB.tumbleSeg * FPS_CUERDA));
  const kc = clamp((t - a(F.cajas)) / a(0.6));
  const s = 148, cy = 1020, xr = 312, xf = 768;
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <CajaGiro cx={xr} cy={cy} s={s} ang={rigida.angulos[idx]} k={kc} color={CB.rigida} grosor={4} />
        <CajaGiro cx={xf} cy={cy} s={s} ang={flexible.angulos[idx]} k={kc} color={CB.cuerda} grosor={4} />
        <g opacity={clamp(kc * 2)}>
          <CuerdaSim p={rigida.frames[idx]} cx={xr} cy={cy} s={s} color={CB.rigida} fondo={AN.oscuro} grosor={8} />
          <CuerdaSim p={flexible.frames[idx]} cx={xf} cy={cy} s={s} color={CB.cuerda} fondo={AN.oscuro} grosor={8} />
        </g>
        <Flecha x0={445} y0={1270} x1={635} y1={1270} color={AN.lima} k={clamp((t - a(F.compara)) / a(0.5))} grosor={7} cabeza={26} />
      </svg>
      <Cap e={e} />
      <Frases id="titular-flexible" y={430} frases={[{ px: 84, t: 0.2, texto: "RÍGIDA vs\nFLEXIBLE", color: AN.papel }, { px: 84, t: F.compara, texto: "MÁS FLEXIBLE:\nMÁS NUDOS", color: AN.lima }]} />
      <Texto texto="RÍGIDA" x={xr} y={760} px={32} color={CB.rigida} delay={F.cajas} peso={800} id="flex-rigida" />
      <Texto texto="FLEXIBLE" x={xf} y={760} px={32} color={AN.rojo} delay={F.cajas} peso={800} id="flex-flexible" />
      <Texto texto={String(rigida.cruces[idx])} x={xr} y={1270} px={110} color={CB.rigida} delay={F.gira} peso={900} id="flex-n-rigida" />
      <Texto texto={String(flexible.cruces[idx])} x={xf} y={1270} px={110} color={AN.rojo} delay={F.gira} peso={900} id="flex-n-flexible" />
      <Texto texto="CRUCES EN 2D" x={540} y={1390} px={24} color={AN.papel} delay={F.gira} peso={700} opacidad={0.7} id="flex-etq" />
      <Nota texto="SIMULACIÓN 2D · ILUSTRATIVA" x={540} y={1500} px={26} delay={F.chip} id="flex-chip" />
    </Lienzo>
  );
};

/* ───────────── cab-nudos ───────────── */

export const CabNudos: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const N = TCAB.nudos;
  const trebol = useMemo(() => curvaToro(2, 3, 200).map((p) => ({ x: 310 + p.x * 150, y: 840 + p.y * 150, z: p.z })), []);
  const quinto = useMemo(() => curvaToro(2, 5, 240).map((p) => ({ x: 770 + p.x * 150, y: 840 + p.y * 150, z: p.z })), []);
  const k3 = easeOut((t - a(N.trebol)) / a(1.0));
  const k5 = easeOut((t - a(N.quinto)) / a(1.0));
  const YB = 1440, X0 = 150, SLOT = 780 / 9;
  const cs = [3, 4, 5, 6, 7, 8, 9, 10, 11];
  return (
    <Lienzo modo="papel">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <CuerdaZ pts={trebol} color={CB.cuerda} fondo={AN.papel} borde={AN.tinta} grosor={15} avance={k3} cerrada />
        <CuerdaZ pts={quinto} color={CB.cuerda} fondo={AN.papel} borde={AN.tinta} grosor={15} avance={k5} cerrada />
        <line x1={X0 - 10} x2={X0 + 780 + 10} y1={YB} y2={YB} stroke={AN.tinta} strokeWidth={5} strokeLinecap="round" />
        {cs.map((c, i) => {
          const kb = easeOut((t - a(N.barras + i * 0.18)) / a(0.5));
          const h = 250 * probRelativaCruces(c, 0.45) * kb;
          const x = X0 + i * SLOT + (SLOT - 56) / 2;
          return (
            <g key={c}>
              <rect x={x} y={YB - Math.max(h, kb > 0.02 ? 3 : 0)} width={56} height={Math.max(h, kb > 0.02 ? 3 : 0)} fill={CB.cuerda} stroke={AN.tinta} strokeWidth={4} rx={4} />
              <text x={x + 28} y={YB + 36} textAnchor="middle" fontFamily={MONO} fontSize={26} fontWeight={800} fill={AN.tinta}>{c}</text>
            </g>
          );
        })}
      </svg>
      <Cap e={e} color={AN.tinta} />
      <Frases id="titular-nudos" y={430} frases={[{ px: 80, t: 0.2, texto: "NUDOS DE 3\nA 11 CRUCES", color: AN.tinta }, { px: 80, t: N.barras - 0.1, texto: "MÁS CRUCES,\nMENOS NUDOS", color: AN.rojo }]} />
      <Texto texto="3 CRUCES" x={310} y={1040} px={32} color={AN.tinta} delay={N.trebol + 0.9} peso={800} id="nudos-3" />
      <Texto texto="5 CRUCES" x={770} y={1040} px={32} color={AN.tinta} delay={N.quinto + 0.9} peso={800} id="nudos-5" />
      <Texto texto="PROBABILIDAD RELATIVA DEL NUDO" x={540} y={1150} px={22} color={AN.tinta} delay={N.barras} peso={700} opacidad={0.75} id="nudos-eje" />
      <Texto texto="NÚMERO DE CRUCES" x={540} y={1512} px={22} color={AN.tinta} delay={N.barras} peso={700} opacidad={0.75} id="nudos-x" />
      <Nota texto="ESQUEMA · DECAE DE FORMA EXPONENCIAL" x={540} y={1585} px={24} color={AN.tinta} fondo="rgba(244,241,234,0.96)" delay={N.chip} id="nudos-chip" />
    </Lienzo>
  );
};

/* ───────────── cab-receta ───────────── */

const FILAS: { titulo: string; sub: string; glifo: "regla" | "onda" | "zigzag"; clave: "i1" | "i2" | "i3" }[] = [
  { titulo: "LARGO", sub: "más de 46 cm", glifo: "regla", clave: "i1" },
  { titulo: "FLEXIBLE", sub: "no una varilla", glifo: "onda", clave: "i2" },
  { titulo: "AGITADO", sub: "sacudido y girando", glifo: "zigzag", clave: "i3" },
];

export const CabReceta: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const R = TCAB.receta;
  const knot = useMemo(() => curvaToro(2, 5, 240).map((p) => ({ x: 800 + p.x * 100, y: 1300 + p.y * 100, z: p.z })), []);
  const kn = easeOut((t - a(R.igual)) / a(0.9));
  const glifo = (g: "regla" | "onda" | "zigzag", y: number): React.ReactNode => {
    if (g === "regla") return <g stroke={AN.lima} strokeWidth={5} strokeLinecap="round"><line x1={790} x2={920} y1={y} y2={y} />{[0, 1, 2, 3, 4, 5, 6].map((i) => <line key={i} x1={790 + i * 21.6} x2={790 + i * 21.6} y1={y - (i % 2 ? 10 : 18)} y2={y} />)}</g>;
    if (g === "onda") { let d = ""; for (let i = 0; i <= 40; i++) d += `${i ? "L" : "M"} ${790 + i * 3.25} ${y + Math.sin((i / 40) * Math.PI * 4) * 20} `; return <path d={d} fill="none" stroke={AN.lima} strokeWidth={5} strokeLinecap="round" />; }
    return <path d={`M 790 ${y - 20} L 825 ${y + 20} L 855 ${y - 20} L 890 ${y + 20} L 920 ${y - 20}`} fill="none" stroke={AN.lima} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />;
  };
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {FILAS.map((fl, i) => {
          const ts = R[fl.clave];
          const s = spr(f, a(ts), { damping: 14, stiffness: 140, mass: 0.8 });
          const y = 690 + i * 170;
          const kk = clamp((t - a(ts + 0.25)) / a(0.45));
          return (
            <g key={fl.titulo} opacity={clamp(s * 2)} transform={`translate(0 ${(1 - s) * 30})`}>
              <rect x={130} y={y - 70} width={820} height={140} rx={22} fill="rgba(244,241,234,0.06)" stroke={AN.papel} strokeOpacity={0.3} strokeWidth={3} />
              <circle cx={206} cy={y} r={36} fill="none" stroke={AN.lima} strokeWidth={5} />
              <Garabato d={`M ${206 - 16} ${y + 2} L ${206 - 4} ${y + 15} L ${206 + 19} ${y - 14}`} k={kk} color={AN.lima} grosor={8} />
              {glifo(fl.glifo, y)}
            </g>
          );
        })}
        <CuerdaZ pts={knot} color={CB.cuerda} fondo={AN.oscuro} grosor={14} avance={kn} cerrada />
      </svg>
      <Cap e={e} />
      <Frases id="titular-receta" y={430} frases={[{ px: 84, t: 0.2, texto: "LA RECETA\nDEL NUDO", color: AN.papel }]} />
      {FILAS.map((fl, i) => (
        <React.Fragment key={fl.titulo}>
          <Texto texto={fl.titulo} x={290} y={690 + i * 170 - 18} px={40} color={AN.papel} alinear="left" delay={R[fl.clave] + 0.1} peso={800} id={`rec-t${i}`} />
          <Texto texto={fl.sub} x={290} y={690 + i * 170 + 28} px={24} color={AN.papel} alinear="left" delay={R[fl.clave] + 0.2} peso={600} opacidad={0.7} id={`rec-s${i}`} />
        </React.Fragment>
      ))}
      <Frases id="igual-nudo" x={130} y={1300} ancho={560} alinear="left" frases={[{ px: 130, t: R.igual, texto: "= NUDO", color: AN.rojo }]} />
      <Nota texto="ANALOGÍA · EL ESTUDIO USÓ UNA SOLA CUERDA" x={540} y={1530} px={24} delay={R.chip} id="receta-chip" />
    </Lienzo>
  );
};
