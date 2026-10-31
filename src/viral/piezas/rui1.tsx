/**
 * «La física de los ruidos nocturnos» (SINAPSIS · física cotidiana) · escenas 1/2 — SOLO abstracción: señales, mallas isométricas, columnas y nodos (sin muebles ni fantasmas)
 *   rui-gancho  telemetría a las 03:14: la señal es plana y de pronto aparece un pico; ondas de choque en halftone
 *   rui-dia     malla isométrica azul que absorbe fotones y se expande en silencio (potenciómetros: temperatura, humedad y expansión = resultado)
 *   rui-noche   la temperatura cae: la malla se encoge DESIGUAL (dos regiones con distinto α) y la costura se pone roja (tensión)
 *   rui-ritmos  columnas isométricas: cuánto se contrae cada material (α) y cuántos milímetros por metro con 10 °C menos
 */
import React from "react";
import { RUI, TRUI } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { H, LineaCap, MONO, W, clamp, easeInOut, easeOut, lerp, mezclar, spr, useReloj } from "../comun";
import { AN, Knob, Lienzo, PuntosSemitono } from "./anom-ui";
import { Garabato, Nota, Pie, Texto, ovaloMano } from "./dig-kit";
import { CajaAlambre, suave } from "./pte-kit";
import { Frases } from "./real-kit";

type P = { e: EscenaViralGuardada };

const Cap: React.FC<{ e: EscenaViralGuardada }> = ({ e }) => (e.cap ? <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={AN.papel} /> : null);
const AZ = "#6C78FF";

/* ───────────── rui-gancho ───────────── */

const GX0 = 100, GX1 = 980, GYC = 1050, XS = 700;
const trazaY = (x: number): number => {
  if (x < XS) return GYC + (azar(Math.floor(x / 3) * 1.7) - 0.5) * 5;
  const d = x - XS;
  return GYC - 330 * Math.exp(-d / 85) * Math.cos(d / 9) + (azar(Math.floor(x / 3) * 2.3) - 0.5) * 3;
};

export const RuiGancho: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const G = TRUI.gancho;
  const k1 = clamp((t - a(G.traza)) / (a(G.pico) - a(G.traza)));
  const k2 = clamp((t - a(G.pico)) / a(0.75));
  const cx = t < a(G.pico) ? GX0 + k1 * (XS - GX0) : XS + k2 * (GX1 - XS);
  const pts: string[] = [];
  for (let x = GX0; x <= cx; x += 3) pts.push(`${x},${trazaY(x).toFixed(1)}`);
  const dt = t - a(G.ondas);
  const R = (d: number): number => Math.max(0, d) * 760;
  const seg = Math.min(59, Math.floor(t * 3.3));
  const ruido = (x: number, y: number, r: number, w: number): number => clamp(1 - Math.abs(Math.hypot(x - XS, y - (GYC - 120)) - r) / w);
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {dt > 0 && <PuntosSemitono x0={0} y0={560} w={W} h={1000} paso={24} rMax={11} color={AN.rojo} opacidad={0.9} campo={(x, y) => Math.max(ruido(x, y, R(dt), 46), 0.7 * ruido(x, y, R(dt - 0.22), 40), 0.45 * ruido(x, y, R(dt - 0.44), 34)) * clamp(1 - dt / 1.6)} />}
        <line x1={GX0} y1={GYC} x2={GX1} y2={GYC} stroke={AN.papel} strokeOpacity={0.25} strokeWidth={2} strokeDasharray="4 10" />
        {Array.from({ length: 12 }, (_, i) => <line key={i} x1={GX0 + i * 80} y1={GYC + 40} x2={GX0 + i * 80} y2={GYC + 56} stroke={AN.papel} strokeOpacity={0.35} strokeWidth={2} />)}
        <polyline points={pts.join(" ")} fill="none" stroke={t > a(G.pico) ? AN.rojo : AN.papel} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        {t > a(0.2) && <line x1={cx} y1={GYC - 360} x2={cx} y2={GYC + 70} stroke={AN.lima} strokeWidth={3} opacity={0.8} />}
      </svg>
      <Cap e={e} />
      <Frases id="titular-gancho" y={430} frases={[{ px: 150, t: 0.2, texto: "03:14" }, { px: 100, t: 2.6, texto: "¿UN\nDEMONIO?", color: AN.rojo }, { px: 104, t: 3.8, texto: "NO:\nFÍSICA", color: AN.lima }]} />
      <Texto texto={`03:14:${String(seg).padStart(2, "0")}`} x={100} y={640} px={28} color={AN.lima} alinear="left" delay={0.1} peso={800} id="gancho-tc" />
      <Texto texto="CANAL 1 · MICRÓFONO" x={980} y={640} px={22} color={AN.papel} alinear="right" delay={0.3} peso={500} id="gancho-canal" />
      <Nota texto="dramatización · señal esquemática" x={540} y={1330} color={AN.papel} delay={G.chip} px={22} id="gancho-nota" />
    </Lienzo>
  );
};

/* ───────────── malla isométrica (rui-dia y rui-noche) ───────────── */

const SL = 78, CXL = 540, CYL = 930, N = 7;
const isoP = (dx: number, dy: number, z = 0): [number, number] => [CXL + (dx - dy) * 0.866 * SL, CYL + (dx + dy) * 0.5 * SL - z * SL];

const Malla: React.FC<{ eps: (i: number) => number; tension: (i: number) => number; luz?: number; boundary?: boolean }> = ({ eps, tension, luz = 1, boundary = false }) => {
  const pos = (i: number, j: number): [number, number] => isoP((i - 3) * (1 + eps(i)), (j - 3) * (1 + eps(i)));
  const lineas: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const [x, y] = pos(i, j);
    if (i + 1 < N) { const [x2, y2] = pos(i + 1, j); const ts = Math.max(tension(i), tension(i + 1) * 0.0) ; lineas.push(<line key={`a${i}-${j}`} x1={x} y1={y} x2={x2} y2={y2} stroke={mezclar(AZ, AN.rojo, clamp(ts))} strokeWidth={3.5 + 2.5 * clamp(ts)} opacity={0.9 * luz} strokeLinecap="round" />); }
    if (j + 1 < N) { const [x2, y2] = pos(i, j + 1); lineas.push(<line key={`b${i}-${j}`} x1={x} y1={y} x2={x2} y2={y2} stroke={mezclar(AZ, AN.rojo, clamp(tension(i) * 0.6))} strokeWidth={3.5} opacity={0.75 * luz} strokeLinecap="round" />); }
  }
  const nodos: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const [x, y] = pos(i, j); nodos.push(<circle key={`n${i}-${j}`} cx={x} cy={y} r={7} fill={mezclar("#9AA4FF", AN.rojo, clamp(tension(i)))} opacity={luz} />); }
  const cil = [[0, 0], [6, 0], [0, 6], [6, 6]].map(([i, j], k) => {
    const [x, y] = pos(i, j);
    return (
      <g key={`c${k}`} opacity={luz}>
        <line x1={x - 24} y1={y} x2={x - 24} y2={y - 112} stroke={AZ} strokeWidth={4} /><line x1={x + 24} y1={y} x2={x + 24} y2={y - 112} stroke={AZ} strokeWidth={4} />
        <ellipse cx={x} cy={y - 112} rx={24} ry={13} fill="#10153A" stroke={AZ} strokeWidth={4} /><ellipse cx={x} cy={y} rx={24} ry={13} fill="none" stroke={AZ} strokeWidth={3} strokeOpacity={0.6} />
      </g>
    );
  });
  const [sx0, sy0] = pos(3, 0), [sx1, sy1] = pos(3, 6);
  return <g>{lineas}{nodos}{cil}{boundary && <line x1={sx0} y1={sy0} x2={sx1} y2={sy1} stroke={AN.rojo} strokeWidth={5} strokeDasharray="12 10" opacity={0.85} />}</g>;
};

/* ───────────── rui-dia ───────────── */

export const RuiDia: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const D = TRUI.dia;
  const malla = spr(f, a(D.malla), { damping: 14, stiffness: 110, mass: 0.9 });
  const knobs = easeOut((t - a(D.knobs)) / a(0.6));
  const k = easeInOut((t - a(D.subida)) / a(D.subidaDur));
  const T = lerp(15, 30, k), HR = lerp(70, 45, k);
  const dL = (RUI.alfa.aluminio * (T - 15)) / 1000; // mm por metro de aluminio (α·ΔT)
  const e0 = 0.06 * k;
  const fot = Array.from({ length: 18 }, (_, n) => {
    const p = ((t * 0.5 + n / 18) % 1);
    const i = 1 + (n % 5), j = 1 + ((n * 3) % 5);
    const [tx, ty] = isoP((i - 3) * (1 + e0), (j - 3) * (1 + e0));
    return { x: lerp(60, tx, p), y: lerp(520 + (n % 6) * 24, ty, p), p };
  });
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(malla * 2)}><Malla eps={() => e0} tension={() => 0} /></g>
        {t > a(D.fotones) && fot.map((p, n) => <circle key={n} cx={p.x} cy={p.y} r={6 - 3 * p.p} fill={AN.lima} opacity={clamp((1 - p.p) * 3) * 0.9} />)}
        <Knob cx={210} cy={1385} r={62} valor={(T - 5) / 40} etiqueta="TEMPERATURA" lectura={`${Math.round(T)} °C`} aparece={knobs} />
        <Knob cx={540} cy={1385} r={62} valor={HR / 100} etiqueta="HUMEDAD" lectura={`${Math.round(HR)} %`} aparece={knobs} />
        <Knob cx={870} cy={1385} r={62} valor={0.1 + dL * 1.4} etiqueta="EXPANSIÓN" lectura={`+${dL.toFixed(2).replace(".", ",")} mm`} aparece={knobs} color={AZ} />
      </svg>
      <Cap e={e} />
      <Frases id="titular-dia" y={430} frases={[{ px: 90, t: 0.2, texto: "DE DÍA\nTODO SE EXPANDE" }]} />
      <Nota texto="ΔL = α · L · ΔT" x={540} y={1260} color={AN.lima} delay={D.formula} px={28} id="dia-formula" />
      <Texto texto="EXPANSIÓN = resultado · 1 m de aluminio" x={540} y={1308} px={21} color={AN.papel} delay={D.formula + 0.3} peso={500} id="dia-nota" />
      <Pie texto="esquema · la expansión del dibujo está exagerada" y={1512} delay={D.formula} />
    </Lienzo>
  );
};

/* ───────────── rui-noche ───────────── */

export const RuiNoche: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const D = TRUI.noche;
  const malla = spr(f, a(D.malla), { damping: 14, stiffness: 110, mass: 0.9 });
  const k = easeInOut((t - a(D.baja)) / a(D.bajaDur));
  const T = lerp(30, 12, k), HR = lerp(45, 72, k);
  const dL = (RUI.alfa.aluminio * (30 - T)) / 1000;
  const E = 0.0026;
  const eps = (i: number): number => 0.06 - E * (i <= 3 ? RUI.alfa.aluminio : RUI.alfa.acero) * (30 - T) * (1 + 0 * i);
  const ten = easeOut((t - a(D.tension)) / a(1.4));
  const tension = (i: number): number => ten * k * (i === 3 || i === 4 ? 1 : i === 2 || i === 5 ? 0.45 : 0.08);
  const knobs = clamp(malla * 2);
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(malla * 2)}><Malla eps={eps} tension={tension} boundary={ten > 0.2} /></g>
        <rect x={120} y={1190} width={840} height={16} rx={8} fill="none" stroke={AN.papel} strokeOpacity={0.4} strokeWidth={2} />
        <rect x={120} y={1190} width={Math.max(0.1, 840 * ten * k)} height={16} rx={8} fill={AN.rojo} />
        <Knob cx={210} cy={1385} r={62} valor={(T - 5) / 40} etiqueta="TEMPERATURA" lectura={`${Math.round(T)} °C`} aparece={knobs} />
        <Knob cx={540} cy={1385} r={62} valor={HR / 100} etiqueta="HUMEDAD" lectura={`${Math.round(HR)} %`} aparece={knobs} />
        <Knob cx={870} cy={1385} r={62} valor={0.5 - dL * 1.3} etiqueta="EXPANSIÓN" lectura={`−${dL.toFixed(2).replace(".", ",")} mm`} aparece={knobs} color={AN.rojo} />
      </svg>
      <Cap e={e} />
      <Frases id="titular-noche" y={430} frases={[{ px: 90, t: 0.2, texto: "DE NOCHE\nTODO SE ENCOGE" }, { px: 100, t: 3.0, texto: "PERO NO\nIGUAL", color: AN.rojo }]} />
      <Texto texto="TENSIÓN ACUMULADA" x={120} y={1165} px={21} color={AN.rojo} alinear="left" delay={D.tension} peso={800} id="noche-ten" />
      <Texto texto="la humedad relativa sube al enfriarse" x={540} y={1262} px={21} color={AN.papel} delay={D.formula} peso={500} id="noche-hr" />
      <Pie texto="dos regiones con distinto α · esquema · contracción exagerada" y={1512} delay={D.formula} />
    </Lienzo>
  );
};

/* ───────────── rui-ritmos ───────────── */

const COLS = [
  { n: "ALUMINIO", a: RUI.alfa.aluminio, mm: RUI.dl1m10K.aluminio, rojo: false },
  { n: "ACERO", a: RUI.alfa.acero, mm: RUI.dl1m10K.acero, rojo: false },
  { n: "HORMIGÓN", a: RUI.alfa.hormigon, mm: RUI.dl1m10K.hormigon, rojo: false },
  { n: "MADERA\nA LO LARGO", a: RUI.alfa.maderaLargo, mm: RUI.dl1m10K.maderaLargo, rojo: true },
  { n: "MADERA\nA LO ANCHO", a: RUI.alfa.maderaAncho, mm: RUI.dl1m10K.maderaAncho, rojo: true },
];

export const RuiRitmos: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const R = TRUI.ritmos;
  const diez = easeOut((t - a(R.diez)) / a(0.6));
  const WC = 118, GAP = 26, D = 44, BASE = 1170, U = 13;
  const x0 = (W - (5 * WC + 4 * GAP + D)) / 2;
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <line x1={90} y1={BASE} x2={990} y2={BASE} stroke={AN.papel} strokeOpacity={0.35} strokeWidth={3} />
        {COLS.map((c, i) => {
          const k = spr(f, a(R.cols + i * 0.3), { damping: 14, stiffness: 120, mass: 0.8 });
          const h = c.a * U * clamp(k);
          const col = c.rojo ? AN.rojo : AZ;
          return (
            <g key={i} opacity={clamp(k * 2)}>
              <CajaAlambre x={x0 + i * (WC + GAP)} y={BASE - h} w={WC} h={Math.max(1, h)} d={D} color={col} relleno={0.85} grosor={4} />
            </g>
          );
        })}
        <Garabato d={ovaloMano(x0 + 3.5 * (WC + GAP) + 20, BASE - 230, 200, 235, 3)} k={diez} color={AN.lima} grosor={6} />
      </svg>
      <Cap e={e} />
      <Frases id="titular-ritmos" y={430} frases={[{ px: 84, t: 0.2, texto: "NO TODO SE ENCOGE\nIGUAL" }]} />
      {COLS.map((c, i) => <Texto key={`v${i}`} texto={String(c.a)} x={x0 + i * (WC + GAP) + WC / 2 + 10} y={BASE - c.a * U - 74} px={34} color={c.rojo ? AN.rojo : AN.lima} delay={R.vals + i * 0.12} peso={800} id={`ritmos-v${i}`} />)}
      {COLS.map((c, i) => <Texto key={`n${i}`} texto={c.n} x={x0 + i * (WC + GAP) + WC / 2 + 10} y={BASE + 46} px={17} color={AN.papel} delay={R.cols + i * 0.3} peso={700} id={`ritmos-n${i}`} interletra={0} />)}
      {COLS.map((c, i) => <Texto key={`m${i}`} texto={c.mm.toFixed(2).replace(".", ",")} x={x0 + i * (WC + GAP) + WC / 2 + 10} y={BASE + 116} px={26} color={AN.papel} delay={R.mm + i * 0.1} peso={800} id={`ritmos-m${i}`} />)}
      <Texto texto="α: millonésimas por °C (sobre cada columna)" x={540} y={BASE - 560} px={20} color={AN.papel} delay={R.cols} peso={500} id="ritmos-a" />
      <Texto texto="mm por metro con 10 °C menos" x={540} y={BASE + 168} px={22} color={AN.lima} delay={R.mm} peso={700} id="ritmos-mm" />
      <Texto texto="×10" x={860} y={BASE - 500} px={64} color={AN.lima} delay={R.diez} peso={800} id="ritmos-diez" />
      <Nota texto="valores típicos: varían según la fuente" x={540} y={1450} color={AN.papel} delay={R.chip} px={21} id="ritmos-nota" />
      <Pie texto="EngineeringToolbox · Misumi · esquema" y={1500} delay={R.chip} />
    </Lienzo>
  );
};
