/**
 * «La piscina que cuelga entre dos edificios» (SINAPSIS · ingeniería extrema) · escenas 2/2
 *   pis-tinas   Rayos X alámbrico: dos tinas de acero, dos tensores de 38 mm bajo la piscina y el diagrama de la presión hidrostática sobre la pared
 *   pis-viento  torres que se mecen en sentidos opuestos: la unión rígida falla (azul, ILUSTRACIÓN) y los apoyos que deslizan dejan la viga estable (bermellón + Rayos X)
 *   pis-carga   llenado con odómetro de 0 a 150 t, nivel, presión y marcas de conteo (ilustración)
 *   pis-zoom    zoom logarítmico de 1 µm a 100 m: cadenas del polímero → sección de la pared → la piscina entre los edificios con una silueta nadando
 */
import React, { useMemo } from "react";
import { PIS, TPIS, dilatacionMm, presionKPa } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { H, LineaCap, MONO, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { useUid } from "../../estudio/util";
import { AN, Knob, Lienzo, Odometro, PuntosSemitono, Visor } from "./anom-ui";
import { Garabato, Nota, Pie, Tally, Texto, ovaloMano } from "./dig-kit";
import { CajaIso, CaraHT, Grietas, PS, mkIso } from "./pis-kit";
import { Flecha, suave } from "./pte-kit";
import { Frases } from "./real-kit";

type P = { e: EscenaViralGuardada };

const Cap: React.FC<{ e: EscenaViralGuardada; color?: string }> = ({ e, color }) => (e.cap ? <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={color ?? AN.papel} /> : null);

/* ───────────── pis-tinas ───────────── */

export const PisTinas: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TPIS.tinas;
  const iso = useMemo(() => mkIso(396, 745, 64), []);
  const kt = spr(f, a(T.tinas), { damping: 13, stiffness: 120, mass: 0.9 });
  const kv = spr(f, a(T.viga), { damping: 14, stiffness: 110, mass: 0.9 });
  const kd = clamp((t - a(T.tensores)) / a(1.0));
  const kp = easeOut((t - a(T.presion)) / a(1.2));
  const tubA = { x0: 0, y0: 0, z0: 0, dx: 1.6, dy: 1.6, dz: 1.4 }, tubB = { x0: 5.2, y0: 0, z0: 0, dx: 1.6, dy: 1.6, dz: 1.4 };
  const rod = (y: number): [[number, number], [number, number]] => [iso(1.6, y, 0.12), iso(5.2, y, 0.12)];
  const filas = Array.from({ length: 7 }, (_, i) => ({ y: 1085 + i * 24, l: (i / 6) * 150 }));
  const p31 = presionKPa(PIS.profundidadM);
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(kt * 2)}>
          <CajaIso iso={iso} {...tubA} dz={tubA.dz * kt} color={PS.acero} alambre grosor={4} />
        </g>
        {kv > 0.02 && <g opacity={clamp(kv * 2)} transform={`translate(0 ${(1 - kv) * -60})`}><CajaIso iso={iso} x0={1.6} y0={0.25} z0={0.2} dx={3.6} dy={1.1} dz={1.0} color={PS.acrilico} ht={{ x: 0.5, y: 0.6, top: 0.3 }} fill={0.2} paso={13} /></g>}
        <g opacity={clamp(kt * 2)}>
          <CajaIso iso={iso} {...tubB} dz={tubB.dz * kt} color={PS.acero} alambre grosor={4} />
        </g>
        {/* tensores bajo la piscina */}
        {[0.45, 1.15].map((y, i) => { const [p, q] = rod(y); return <line key={i} x1={p[0]} y1={p[1]} x2={p[0] + (q[0] - p[0]) * kd} y2={p[1] + (q[1] - p[1]) * kd} stroke={PS.acero} strokeWidth={7} strokeLinecap="round" />; })}
        {kd > 0.9 && (() => { const [p] = rod(0.8), [, q] = rod(0.8); return (<g><Flecha x0={p[0] + 4} y0={p[1] - 6} x1={p[0] + 70} y1={p[1] + 28} color={AN.rojo} k={1} grosor={6} cabeza={20} brillo={false} /><Flecha x0={q[0] - 4} y0={q[1] - 6} x1={q[0] - 70} y1={q[1] - 38} color={AN.rojo} k={1} grosor={6} cabeza={20} brillo={false} /></g>); })()}
        {/* presión hidrostática sobre la pared */}
        <g opacity={kp}>
          <PuntosSemitono x0={170} y0={1075} w={300} h={170} paso={14} rMax={7} color={PS.agua} opacidad={0.75} campo={() => 0.5} />
          <line x1={470} y1={1070} x2={470} y2={1250} stroke={PS.acrilico} strokeWidth={14} />
          <line x1={170} y1={1250} x2={470} y2={1250} stroke={AN.papel} strokeOpacity={0.4} strokeWidth={3} />
          {filas.map((r, i) => i > 0 && <Flecha key={i} x0={478} y0={r.y} x1={478 + r.l * kp} y1={r.y} color={PS.agua} k={1} grosor={5} cabeza={14} brillo={false} />)}
          <polyline points={`478,1085 ${478 + 150 * kp},1229 478,1229`} fill="none" stroke={AN.lima} strokeWidth={3} strokeDasharray="6 8" />
        </g>
      </svg>
      <Cap e={e} />
      <Frases id="titular-tinas" y={430} frases={[{ px: 84, t: 0.2, texto: "RAYOS X:\nTINAS Y TENSORES" }]} />
      <Texto texto="tina de acero" x={190} y={700} px={22} color={PS.acero} delay={T.tinas} peso={800} id="tinas-ta" />
      <Texto texto="tina de acero" x={885} y={960} px={22} color={PS.acero} delay={T.tinas + 0.1} peso={800} id="tinas-tb" />
      <Texto texto={`2 tensores de ${PIS.tensorMm} mm`} x={420} y={1010} px={22} color={PS.acero} delay={T.tensores} peso={800} id="tinas-t" />
      <Texto texto={`≈ ${Math.round(p31)} kPa`} x={700} y={1215} px={34} color={PS.agua} delay={T.presion + 0.6} peso={800} id="tinas-p" />
      <Texto texto="presión en el fondo" x={700} y={1262} px={21} color={AN.papel} delay={T.presion + 0.6} peso={500} id="tinas-pe" />
      <Nota texto="sin perforar el acrílico · tensores pre o postensados" x={540} y={1350} color={AN.lima} delay={T.chip} px={20} id="tinas-nota" />
      <Pie texto={"Ballymore, RIBA J · p = ρ·g·h con 3,2 m de agua · esquema"} y={1500} delay={T.chip} />
    </Lienzo>
  );
};

/* ───────────── pis-viento ───────────── */

const TY0 = 1270, TY1 = 700, TA0 = 150, TA1 = 330, TB0 = 750, TB1 = 930, YR = 880;
export const PisViento: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const V = TPIS.viento;
  const torres = spr(f, a(V.torres), { damping: 15, stiffness: 100, mass: 1 });
  const ent = clamp((t - a(V.torres)) / a(0.6));
  const viento = clamp((t - a(V.rafaga)) / a(1.0));
  const amp = 40 * suave(t, a(V.rafaga - 0.1), a(V.rafaga + 1.0));
  const sw = Math.sin(t * 2.4);
  const dxA = amp * sw, dxB = -amp * sw;
  const alt = (TY0 - YR) / (TY0 - TY1);
  const poly = (x0: number, x1: number, d: number): [number, number][] => [[x0, TY0], [x1, TY0], [x1 + d, TY1], [x0 + d, TY1]];
  const apoyo = t > a(V.apoyos);
  const falla = t > a(V.falla);
  const tf = Math.max(0, t - a(V.falla));
  const xAr = TA1 + dxA * alt, xBl = TB0 + dxB * alt;
  const rigido = !apoyo;
  const xL = rigido ? xAr : TA1 + 6, xR = rigido ? xBl : TB0 - 6;
  const col = apoyo ? PS.acrilico : PS.fallo;
  const beam: [number, number][] = [[xL - 24, YR - 60], [xR + 24, YR - 60], [xR + 24, YR], [xL - 24, YR]];
  const rx = clamp((t - a(V.rayosx)) / a(0.6));
  const flota = clamp((t - a(V.flota)) / a(0.8));
  const alfa = dilatacionMm(PIS.longitudM, 20);
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* ráfagas de viento */}
        {viento > 0 && Array.from({ length: 7 }, (_, i) => { const p = (t * 0.45 + i / 7) % 1; const y = 760 + i * 70, x = -80 + p * 1240; return <path key={i} d={`M ${x} ${y} q 40 -16 80 0 t 80 0 t 80 0`} fill="none" stroke={AN.papel} strokeOpacity={0.5 * viento} strokeWidth={4} strokeLinecap="round" />; })}
        <line x1={0} y1={TY0} x2={W} y2={TY0} stroke={AN.papel} strokeOpacity={0.35} strokeWidth={3} />
        <g opacity={ent}>
          <CaraHT p={poly(TA0, TA1, dxA)} color={AN.papel} k={0.3} fill={0.08} paso={15} grosor={4} />
          <CaraHT p={poly(TB0, TB1, dxB)} color={AN.papel} k={0.3} fill={0.08} paso={15} grosor={4} />
        </g>
        {/* viga */}
        {(!falla || apoyo) && <CaraHT p={beam} color={col} k={0.5} fill={0.22} paso={13} rMax={7} grosor={6} />}
        {falla && !apoyo && (
          <g opacity={clamp(1 - tf / 1.2)} transform={`translate(0 ${Math.min(1, tf * tf * 2) * 220})`}>
            <CaraHT p={[[xL - 24, YR - 60], [540, YR - 60 + 10], [540, YR + 10], [xL - 24, YR]]} color={PS.fallo} k={0.5} fill={0.22} paso={13} rMax={7} grosor={6} />
            <CaraHT p={[[540, YR - 50], [xR + 24, YR - 60], [xR + 24, YR], [540, YR + 10]]} color={PS.fallo} k={0.5} fill={0.22} paso={13} rMax={7} grosor={6} />
          </g>
        )}
        {rigido && !falla && viento > 0.2 && (
          <g>
            <Flecha x0={xAr + 20} y0={YR - 90} x1={xAr + 20 - 70} y1={YR - 90} color={PS.falloTexto} k={clamp(Math.abs(sw))} grosor={6} cabeza={18} brillo={false} />
            <Flecha x0={xBl - 20} y0={YR - 90} x1={xBl - 20 + 70} y1={YR - 90} color={PS.falloTexto} k={clamp(Math.abs(sw))} grosor={6} cabeza={18} brillo={false} />
          </g>
        )}
        {rigido && !falla && t > a(V.falla - 1.0) && <Grietas x={540} y={YR - 30} k={suave(t, a(V.falla - 1.0), a(V.falla))} color={PS.falloTexto} n={6} largo={90} grosor={4} semilla={3} />}
        {falla && !apoyo && tf < 0.4 && <rect x={TA1} y={YR - 100} width={TB0 - TA1} height={140} fill={PS.falloTexto} opacity={0.35 * (1 - tf / 0.4)} />}
        {/* apoyos que deslizan (Rayos X) */}
        {apoyo && (
          <g opacity={rx}>
            {[[TA1 + dxA * alt - 40, 1], [TB0 + dxB * alt + 10, -1]].map(([x, d], i) => (
              <g key={i}>
                <rect x={x - 10} y={YR + 6} width={70} height={16} fill="none" stroke={AN.lima} strokeWidth={4} />
                <rect x={x - 22 + (d as number) * 0} y={YR + 22} width={94} height={12} fill="none" stroke={AN.lima} strokeWidth={4} />
                <Flecha x0={x + 25} y0={YR + 52} x1={x + 25 + 38 * (d as number)} y1={YR + 52} color={AN.lima} k={1} grosor={5} cabeza={14} brillo={false} />
              </g>
            ))}
          </g>
        )}
        
      </svg>
      <Cap e={e} />
      <Frases id="titular-viento" y={430} frases={[{ px: 84, t: 0.2, texto: "LOS EDIFICIOS\nSE MUEVEN" }, { px: 84, t: 4.2, texto: "LA PISCINA\nDESLIZA", color: PS.acrilico }]} />
      <Texto texto="unión rígida (ilustración)" x={540} y={1330} px={22} color={PS.falloTexto} delay={V.rigido} peso={800} id="viento-r" opacidad={apoyo ? 0 : 1} />
      <Texto texto="apoyos que deslizan y giran" x={540} y={1330} px={24} color={AN.lima} delay={V.apoyos} peso={800} id="viento-a" opacidad={apoyo ? 1 : 0} />
      <Nota texto={`el acrílico también se dilata: ≈ ${Math.round(alfa)} mm en 25 m con +20 °C`} x={540} y={1400} color={AN.papel} delay={V.chip} px={20} id="viento-nota" />
      <Pie texto={"Eckersley O'Callaghan · apoyos que permiten el movimiento diferencial · esquema"} y={1500} delay={V.chip} />
    </Lienzo>
  );
};

/* ───────────── pis-carga ───────────── */

export const PisCarga: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TPIS.carga;
  const tanque = spr(f, a(C.tanque), { damping: 14, stiffness: 110, mass: 0.9 });
  const k = easeInOut((t - a(C.sube)) / a(C.subeDur));
  const ton = Math.round(PIS.aguaTon * k);
  const X0 = 150, X1 = 930, YB = 1150, YH = 300 * (PIS.profundidadM / PIS.profundidadM);
  const lleno = 230 * k;
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(tanque * 2)}>
          <PuntosSemitono x0={X0} y0={YB - lleno} w={X1 - X0} h={lleno + 1} paso={14} rMax={7} color={PS.agua} opacidad={0.85} campo={() => 0.62} />
          <rect x={X0 - 20} y={YB - 250} width={20} height={270} fill={PS.acrilico} fillOpacity={0.3} stroke={PS.acrilico} strokeWidth={5} />
          <rect x={X1} y={YB - 250} width={20} height={270} fill={PS.acrilico} fillOpacity={0.3} stroke={PS.acrilico} strokeWidth={5} />
          <rect x={X0 - 20} y={YB} width={X1 - X0 + 40} height={32} fill={PS.acrilico} fillOpacity={0.3} stroke={PS.acrilico} strokeWidth={5} />
          <line x1={X0} y1={YB - 230} x2={X1} y2={YB - 230} stroke={AN.papel} strokeOpacity={0.3} strokeWidth={2} strokeDasharray="6 10" />
        </g>
        {k > 0.02 && k < 0.98 && Array.from({ length: 6 }, (_, i) => <circle key={i} cx={X0 + 60 + ((i * 139 + t * 40) % (X1 - X0 - 120))} cy={YB - lleno + 10 + ((t * 70 + i * 37) % 40)} r={3 + (i % 3)} fill="none" stroke={AN.papel} strokeWidth={2} opacity={0.6} />)}
        <Tally x={150} y={1232} n={15} k={k} color={AN.papel} alto={42} grosor={4} />
        <Knob cx={210} cy={1385} r={50} valor={clamp(k)} etiqueta="NIVEL" lectura={`${(PIS.profundidadM * k).toFixed(1).replace(".", ",")} m`} aparece={tanque} />
        <Knob cx={870} cy={1385} r={50} valor={clamp(k)} etiqueta="PRESIÓN" lectura={`${Math.round(presionKPa(PIS.profundidadM) * k)} kPa`} aparece={tanque} color={PS.agua} />
      </svg>
      <Cap e={e} />
      <Frases id="titular-carga" y={430} frases={[{ px: 90, t: 0.2, texto: "SE ABRE\nEL GRIFO", color: PS.agua }]} />
      <Odometro valor={ton} x={540} y={760} px={150} digitos={3} sufijo="t" color={PS.agua} id="carga-odo" />
      <Texto texto="toneladas de agua" x={540} y={880} px={26} color={AN.papel} delay={C.grifo} peso={600} id="carga-etq" />
      <Nota texto="llenado por etapas: ilustración, no el protocolo real" x={540} y={1290} color={AN.papel} delay={C.chip} px={20} id="carga-nota" />
      <Pie texto="IStructE: ≈ 150 t de agua · 15 marcas = 15 etapas de 10 t (esquema)" y={1520} delay={C.chip} />
    </Lienzo>
  );
};

/* ───────────── pis-zoom ───────────── */

const PZ = { x: 110, y: 650, w: 860, h: 620 };
const lecturaEscala = (m: number): string => {
  if (m >= 1) return `${m >= 10 ? Math.round(m) : m.toFixed(1).replace(".", ",")} m`;
  if (m >= 0.001) return `${(m * 1000).toFixed(m * 1000 >= 10 ? 0 : 1).replace(".", ",")} mm`;
  return `${(m * 1e6).toFixed(m * 1e6 >= 10 ? 0 : 1).replace(".", ",")} µm`;
};
const cadenas = Array.from({ length: 7 }, (_, c) => { let x = 540 + (azar(c * 3.1) - 0.5) * 500, y = 960 + (azar(c * 5.7) - 0.5) * 380; const pts: [number, number][] = [[x, y]]; for (let i = 0; i < 26; i++) { const ang = azar(c * 11 + i * 2.3) * Math.PI * 2; x += Math.cos(ang) * 48; y += Math.sin(ang) * 48; pts.push([x, y]); } return pts; });

export const PisZoom: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const uid = useUid();
  const Z = TPIS.zoom;
  const k = easeInOut((t - a(Z.ini)) / a(Z.dur));
  const metros = Math.pow(10, lerp(-6, 2, k));
  const oA = 1 - suave(k, 0.2, 0.38), sA = 1 + 22 * Math.pow(Math.min(1, k / 0.38), 2);
  const oB = suave(k, 0.28, 0.42) * (1 - suave(k, 0.62, 0.76)), sB = k < 0.55 ? 0.05 * Math.pow(1 / 0.05, suave(k, 0.28, 0.55)) : 1 + 7 * Math.pow(suave(k, 0.55, 0.76), 1.5);
  const oC = suave(k, 0.6, 0.78), sC = 0.12 * Math.pow(1 / 0.12, suave(k, 0.58, 0.97));
  const nada = easeOut((t - a(Z.nada)) / a(0.7));
  const cx = 540, cy = 960;
  const braz = Math.sin(t * 5) * 0.45;
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><clipPath id={`${uid}pz`}><rect x={PZ.x} y={PZ.y} width={PZ.w} height={PZ.h} /></clipPath></defs>
        <g clipPath={`url(#${uid}pz)`}>
          {/* A · cadenas del polímero (1 µm) */}
          <g opacity={oA} transform={`translate(${cx} ${cy}) scale(${sA}) translate(${-cx} ${-cy})`}>
            {cadenas.map((c, i) => <polyline key={i} points={c.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} fill="none" stroke={i % 2 ? PS.acrilico : AN.lima} strokeWidth={5} strokeLinejoin="round" opacity={0.9} />)}
            {cadenas.flatMap((c, i) => c.filter((_, j) => j % 5 === 0).map(([x, y], j) => <circle key={`${i}-${j}`} cx={x} cy={y} r={9} fill={AN.oscuro} stroke={AN.papel} strokeWidth={3} />))}
          </g>
          {/* B · sección de la pared (1 m) */}
          <g opacity={oB} transform={`translate(${cx} ${cy}) scale(${sB}) translate(${-cx} ${-cy})`}>
            <CaraHT p={[[300, 700], [400, 700], [400, 1150], [780, 1150], [780, 1240], [300, 1240]]} color={PS.acrilico} k={0.5} fill={0.25} paso={14} rMax={7} grosor={6} />
            <PuntosSemitono x0={400} y0={780} w={380} h={370} paso={16} rMax={8} color={PS.agua} opacidad={0.75} campo={() => 0.55} />
          </g>
          {/* C · la ciudad: dos torres, la piscina y una silueta nadando (100 m) */}
          <g opacity={oC} transform={`translate(${cx} ${cy}) scale(${sC}) translate(${-cx} ${-cy})`}>
            <line x1={0} y1={1180} x2={W} y2={1180} stroke={AN.papel} strokeOpacity={0.4} strokeWidth={4} />
            <CaraHT p={[[190, 1180], [390, 1180], [390, 760], [190, 760]]} color={AN.papel} k={0.3} fill={0.08} paso={15} grosor={4} />
            <CaraHT p={[[690, 1180], [890, 1180], [890, 760], [690, 760]]} color={AN.papel} k={0.3} fill={0.08} paso={15} grosor={4} />
            {Array.from({ length: 10 }, (_, i) => <line key={i} x1={190} x2={390} y1={800 + i * 38} y2={800 + i * 38} stroke={AN.papel} strokeOpacity={0.25} strokeWidth={2} />)}
            {Array.from({ length: 10 }, (_, i) => <line key={`b${i}`} x1={690} x2={890} y1={800 + i * 38} y2={800 + i * 38} stroke={AN.papel} strokeOpacity={0.25} strokeWidth={2} />)}
            <PuntosSemitono x0={390} y0={850} w={300} h={50} paso={12} rMax={6} color={PS.agua} opacidad={0.85} campo={() => 0.6} />
            <CaraHT p={[[380, 900], [700, 900], [700, 930], [380, 930]]} color={PS.acrilico} k={0.6} fill={0.3} paso={11} rMax={5.5} grosor={4} />
            <CaraHT p={[[380, 850], [392, 850], [392, 900], [380, 900]]} color={PS.acrilico} k={0.5} fill={0.3} paso={11} grosor={3} />
            <CaraHT p={[[688, 850], [700, 850], [700, 900], [688, 900]]} color={PS.acrilico} k={0.5} fill={0.3} paso={11} grosor={3} />
            <g transform={`translate(${520 + Math.sin(t * 1.1) * 40} 872)`} opacity={nada}>
              <circle cx={30} cy={-6} r={9} fill={AN.papel} />
              <path d={`M 20 -2 q -16 ${12 + braz * 12} -34 ${4 + braz * 16}`} fill="none" stroke={AN.papel} strokeWidth={5} strokeLinecap="round" />
              <path d={`M 20 -2 q 20 ${-6 - braz * 10} 36 ${-14 + braz * 8}`} fill="none" stroke={AN.papel} strokeWidth={5} strokeLinecap="round" />
              <ellipse cx={4} cy={20} rx={44 + braz * 6} ry={5} fill="none" stroke={PS.agua} strokeWidth={3} opacity={0.7} />
            </g>
            <line x1={150} y1={1180} x2={150} y2={760} stroke={AN.lima} strokeWidth={4} /><line x1={140} y1={1180} x2={160} y2={1180} stroke={AN.lima} strokeWidth={4} /><line x1={140} y1={760} x2={160} y2={760} stroke={AN.lima} strokeWidth={4} />
          </g>
        </g>
        <Visor x={PZ.x} y={PZ.y} w={PZ.w} h={PZ.h} color={AN.lima} progreso={easeOut((t - a(0.1)) / a(0.6))} cruz />
      </svg>
      <Cap e={e} />
      <Frases id="titular-zoom" y={430} frases={[{ px: 80, t: 0.2, texto: "DEL POLÍMERO\nA LA CIUDAD" }, { px: 84, t: 6.0, texto: "¿TE ANIMARÍAS\nA NADAR?", color: PS.agua }]} />
      <Texto texto="ANCHO DEL CUADRO" x={540} y={1325} px={21} color={AN.papel} delay={0.3} peso={600} id="zoom-etq" interletra={0.1} />
      <Texto texto={lecturaEscala(metros)} x={540} y={1382} px={50} color={AN.lima} delay={0.3} peso={800} id="zoom-lectura" />
      <Nota texto="silueta ilustrativa: nadar a 35 m de altura" x={540} y={1460} color={PS.agua} delay={Z.nada} px={20} id="zoom-nota" opacidad={nada} />
      <Pie texto="esquema, no a escala · cadenas de polímero dibujadas al azar" y={1512} delay={Z.nada} />
    </Lienzo>
  );
};
