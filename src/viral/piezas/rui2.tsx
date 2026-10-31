/**
 * «La física de los ruidos nocturnos» (SINAPSIS · física cotidiana) · escenas 2/2 — SOLO abstracción (nodos, osciloscopio, barras, celdas de Voronoi)
 *   rui-friccion  Rayos X alámbrico: nodos rojos (melamina) tirados por resortes sobre una rejilla de acero; la fricción acumula tensión y resbalan; ondas a 343 m/s
 *   rui-remate    corte a papel: osciloscopio verde que compara un paso y un cajón que se enfría (esquemático; tono clínico, humor seco)
 *   rui-tally     caja de datos con marcas de conteo y µs > µk: un fallo de diseño, no un fantasma
 *   rui-micro     zoom hasta la unión tornillo-madera: celdas de fibra raspando metal que colapsan en un punto rojo que late
 */
import React, { useMemo } from "react";
import { RUI, TRUI } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { H, LineaCap, MONO, W, clamp, easeInOut, easeOut, lerp, mezclar, spr, useReloj } from "../comun";
import { AN, Lienzo, PuntosSemitono, Visor, voronoi } from "./anom-ui";
import { Garabato, Nota, Pie, Tally, Texto, ovaloMano } from "./dig-kit";
import { suave } from "./pte-kit";
import { Frases } from "./real-kit";

type P = { e: EscenaViralGuardada };

const Cap: React.FC<{ e: EscenaViralGuardada; color?: string }> = ({ e, color }) => (e.cap ? <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={color ?? AN.papel} /> : null);

/* ───────────── rui-friccion ───────────── */

const NODOS = Array.from({ length: 15 }, (_, i) => ({ c: i % 5, r: Math.floor(i / 5) }));
const BX = (c: number): number => 430 + c * 100, BY = (r: number): number => 850 + r * 100;
const SALTO = 20;

const resorte = (x0: number, x1: number, y: number, zig = 9): string => {
  const n = 9;
  let d = `M ${x0} ${y} `;
  for (let i = 1; i < n; i++) d += `L ${x0 + ((x1 - x0) * i) / n} ${y + (i % 2 ? -zig : zig)} `;
  return d + `L ${x1} ${y}`;
};

export const RuiFriccion: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const F = TRUI.friccion;
  const rej = easeOut((t - a(F.rejilla)) / a(0.8));
  const k = easeInOut((t - a(F.acumula)) / a(F.acumulaDur));
  const dtS = t - a(F.salto);
  const slip = easeOut(dtS / 0.07);
  const D = 30 * k;
  const tens = clamp(k * 0.95 * (1 - 0.7 * slip));
  const dt = t - a(F.ondas);
  const flash = Math.max(0, 1 - dtS / 0.14) * (dtS >= 0 ? 1 : 0);
  void f;
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* rejilla de acero (casi fija) */}
        <g opacity={rej} stroke={AN.papel} strokeOpacity={0.35} strokeWidth={2}>
          {Array.from({ length: 13 }, (_, i) => <line key={`v${i}`} x1={150 + i * 65} y1={760} x2={150 + i * 65} y2={1130} />)}
          {Array.from({ length: 6 }, (_, i) => <line key={`h${i}`} x1={150} y1={760 + i * 74} x2={930} y2={760 + i * 74} />)}
        </g>
        {/* resortes: se estiran mientras el nodo no resbala */}
        {NODOS.filter((n) => n.c === 0).map((n) => {
          const xn = BX(0) - SALTO * slip;
          const xa = 220 - D;
          return <path key={n.r} d={resorte(xa, xn - 12, BY(n.r), 11 - 5 * tens)} fill="none" stroke={mezclar(AN.lima, AN.rojo, clamp(tens * 1.4))} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />;
        })}
        {/* nodos rojos (melamina), en alambre */}
        {NODOS.map((n, i) => {
          const x = BX(n.c) - SALTO * slip, y = BY(n.r);
          return (
            <g key={i} opacity={rej}>
              <circle cx={x} cy={y} r={17} fill="none" stroke={AN.rojo} strokeWidth={4} />
              <line x1={x - 10} y1={y} x2={x + 10} y2={y} stroke={AN.rojo} strokeWidth={2.5} /><line x1={x} y1={y - 10} x2={x} y2={y + 10} stroke={AN.rojo} strokeWidth={2.5} />
              {n.c < 4 && <line x1={x + 17} y1={y} x2={BX(n.c + 1) - SALTO * slip - 17} y2={y} stroke={AN.rojo} strokeOpacity={0.6} strokeWidth={2.5} />}
              {n.r < 2 && <line x1={x} y1={y + 17} x2={x} y2={BY(n.r + 1) - 17} stroke={AN.rojo} strokeOpacity={0.6} strokeWidth={2.5} />}
            </g>
          );
        })}
        {/* medidor de tensión elástica */}
        <rect x={150} y={1195} width={780} height={16} rx={8} fill="none" stroke={AN.papel} strokeOpacity={0.4} strokeWidth={2} />
        <rect x={150} y={1195} width={Math.max(0.1, 780 * tens)} height={16} rx={8} fill={mezclar(AN.lima, AN.rojo, clamp(tens * 1.4))} />
        {/* onda de choque */}
        {dt > 0 && [0, 0.2, 0.4].map((d, i) => <circle key={i} cx={640} cy={950} r={Math.max(1, (dt - d) * 620)} fill="none" stroke={AN.rojo} strokeWidth={6 - 2 * i} opacity={clamp(1 - (dt - d) / 1.5) * (dt - d > 0 ? 1 : 0)} />)}
        {flash > 0 && <circle cx={640} cy={950} r={110} fill={AN.papel} opacity={0.35 * flash} />}
      </svg>
      <Cap e={e} />
      <Frases id="titular-friccion" y={430} frases={[{ px: 90, t: 0.2, texto: "LA FRICCIÓN\nACUMULA" }, { px: 90, t: 4.3, texto: "Y DE GOLPE\nRESBALA", color: AN.rojo }]} />
      <Texto texto="ACERO · casi fijo" x={150} y={1150} px={20} color={AN.papel} alinear="left" delay={F.rejilla} peso={500} id="friccion-acero" />
      <Texto texto="MELAMINA" x={640} y={800} px={22} color={AN.rojo} delay={F.rejilla + 0.2} peso={800} id="friccion-mel" interletra={0.1} />
      <Texto texto="TENSIÓN ELÁSTICA" x={150} y={1245} px={20} color={AN.papel} alinear="left" delay={F.acumula} peso={700} id="friccion-ten" />
      <Texto texto="343 m/s" x={880} y={1010} px={30} color={AN.rojo} delay={F.ondas + 0.35} peso={800} id="friccion-v" />
      <Nota texto={`${RUI.tableroM.toString().replace(".", ",")} m · ${RUI.tableroK} °C menos · madera a lo ancho ≈ ${RUI.tableroMicras} µm`} x={540} y={1330} color={AN.lima} delay={F.chip} px={21} id="friccion-nota" />
      <Nota texto="a 5 m el sonido tarda ≈ 15 ms" x={540} y={1390} color={AN.papel} delay={F.tof} px={21} id="friccion-tof" />
      <Pie texto="esquema · los saltos reales son de micrómetros · a 20 °C" y={1512} delay={F.chip} />
    </Lienzo>
  );
};

/* ───────────── rui-remate (papel) ───────────── */

const SC = { x: 110, y: 650, w: 860, h: 480 };
const traza = (x: number, base: number, amp: number, x0: number, tau: number, om: number): number => {
  const d = x - x0;
  const r = (azar(Math.floor(x / 2) * 1.3 + base) - 0.5) * 2.2;
  return base - (d >= 0 ? amp * Math.exp(-d / tau) * Math.sin(d / om) : 0) + r;
};

export const RuiRemate: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const R = TRUI.remate;
  const panel = easeOut((t - a(R.panel)) / a(0.4));
  const barr = easeOut((t - a(R.trazas)) / a(R.trazasDur));
  const nota = easeOut((t - a(R.nota)) / a(0.6));
  const x1 = SC.x + 20 + barr * (SC.w - 40);
  const mk = (base: number, amp: number, xb: number, tau: number): string => {
    const p: string[] = [];
    for (let x = SC.x + 20; x <= x1; x += 3) p.push(`${x},${traza(x, base, amp, xb, tau, 7).toFixed(1)}`);
    return p.join(" ");
  };
  const VERDE = "#3DFF7A";
  return (
    <Lienzo modo="papel">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <PuntosSemitono x0={640} y0={240} w={400} h={330} paso={18} rMax={9} color={AN.tinta} opacidad={0.8} campo={(x, y) => clamp(((x - 640) / 400) * 0.9 + ((570 - y) / 330) * 0.1 - 0.35) * 1.4} />
        <g opacity={panel}>
          <rect x={SC.x} y={SC.y} width={SC.w} height={SC.h} rx={14} fill="#0A120C" stroke={AN.tinta} strokeWidth={6} />
          {Array.from({ length: 9 }, (_, i) => <line key={`gv${i}`} x1={SC.x + (SC.w * i) / 8} y1={SC.y} x2={SC.x + (SC.w * i) / 8} y2={SC.y + SC.h} stroke="#1F5A33" strokeWidth={1.8} />)}
          {Array.from({ length: 7 }, (_, i) => <line key={`gh${i}`} x1={SC.x} y1={SC.y + (SC.h * i) / 6} x2={SC.x + SC.w} y2={SC.y + (SC.h * i) / 6} stroke="#1F5A33" strokeWidth={1.8} />)}
        </g>
        <polyline points={mk(SC.y + 140, 105, 330, 70)} fill="none" stroke={VERDE} strokeWidth={3.5} strokeLinejoin="round" />
        <polyline points={mk(SC.y + 370, 70, 330, 60)} fill="none" stroke={VERDE} strokeWidth={3.5} strokeLinejoin="round" />
        {barr < 1 && barr > 0 && <line x1={x1} y1={SC.y} x2={x1} y2={SC.y + SC.h} stroke={VERDE} strokeOpacity={0.5} strokeWidth={2} />}
        <Garabato d={ovaloMano(SC.x + 330 + 70, SC.y + 255, 190, 215, 4)} k={nota} color={AN.rojo} grosor={6} />
      </svg>
      <Cap e={e} color={AN.tinta} />
      <Frases id="titular-remate" y={430} frases={[{ px: 84, t: 0.2, texto: "TU CEREBRO:\nASESINO", color: AN.tinta }, { px: 84, t: 2.7, texto: "LA FÍSICA:\nUN CAJÓN", color: AN.rojo }]} />
      <Texto texto="CH1 · PASO · 90 kg" x={SC.x + 24} y={SC.y + 30} px={19} color="#3DFF7A" alinear="left" delay={R.panel} peso={700} id="remate-ch1" />
      <Texto texto="CH2 · CAJÓN · −2 °C" x={SC.x + 24} y={SC.y + 262} px={19} color="#3DFF7A" alinear="left" delay={R.panel + 0.1} peso={700} id="remate-ch2" />
      <Texto texto="¡igual de seco!" x={540} y={1215} px={44} color={AN.rojo} delay={R.nota} peso={800} id="remate-seco" rot={-3} />
      <Texto texto="* igual de brusco, no de fuerte: el paso es mucho más intenso" x={540} y={1290} px={19} color={AN.tinta} delay={R.ast} peso={600} id="remate-ast" />
      <Pie texto="esquemático · no son grabaciones" y={1380} delay={R.ast} color={AN.tinta} />
    </Lienzo>
  );
};

/* ───────────── rui-tally (papel) ───────────── */

export const RuiTally: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TRUI.tally;
  const ficha = easeOut((t - a(T.ficha)) / a(0.5));
  const barras = easeOut((t - a(T.barras)) / a(0.8));
  const sello = spr(f, a(T.sello), { damping: 9, stiffness: 200, mass: 0.6 });
  return (
    <Lienzo modo="papel">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={ficha}>
          <rect x={100} y={600} width={880} height={790} fill="none" stroke={AN.tinta} strokeWidth={4} />
          <rect x={100} y={600} width={880} height={78} fill={AN.tinta} />
        </g>
        <Tally x={150} y={730} n={17} k={easeOut((t - a(T.tally)) / a(1.1))} color={AN.tinta} alto={64} grosor={6} />
        <rect x={150} y={965} width={Math.max(0.1, 540 * barras)} height={34} fill={AN.rojo} />
        <rect x={150} y={1065} width={Math.max(0.1, 300 * barras)} height={34} fill={AN.tinta} />
      </svg>
      <Cap e={e} color={AN.tinta} />
      <Frases id="titular-tally" y={430} frases={[{ px: 100, t: 0.2, texto: "EL CULPABLE", color: AN.tinta }, { px: 100, t: 2.6, texto: "TIENE NOMBRE", color: AN.rojo }]} />
      <Texto texto="CAJA DE DATOS · FRICCIÓN" x={126} y={639} px={25} color={AN.papel} alinear="left" delay={0.3} peso={800} id="tally-head" />
      <Texto texto="crujidos de una noche (ejemplo)" x={150} y={846} px={22} color={AN.tinta} alinear="left" delay={T.tally} peso={600} id="tally-etq" />
      <Texto texto="µs · fricción estática (pegado)" x={150} y={935} px={22} color={AN.rojo} alinear="left" delay={T.barras} peso={800} id="tally-mus" />
      <Texto texto="µk · fricción cinética (deslizando)" x={150} y={1035} px={22} color={AN.tinta} alinear="left" delay={T.barras + 0.3} peso={800} id="tally-muk" />
      <Texto texto="µs > µk" x={540} y={1190} px={104} color={AN.rojo} delay={T.barras + 0.6} peso={800} id="tally-ec" />
      <div data-texto="tally-sello" style={{ position: "absolute", left: 540, top: 1315, transform: `translate(-50%, -50%) rotate(-2.5deg) scale(${1.5 - 0.5 * sello})`, opacity: clamp(sello * 2), fontFamily: MONO, fontWeight: 800, fontSize: 34, color: AN.rojo, border: `5px solid ${AN.rojo}`, padding: "10px 24px", whiteSpace: "nowrap" }}>FALLO DE DISEÑO · NO FANTASMA</div>
      <Pie texto="esquema · los valores reales dependen de los materiales" y={1450} delay={T.sello} color={AN.tinta} />
    </Lienzo>
  );
};

/* ───────────── rui-micro ───────────── */

const CW = 880, CH = 640;
const lecturaMicro = (m: number): string => (m >= 0.001 ? `${(m * 1000).toFixed(m * 1000 >= 10 ? 0 : 1).replace(".", ",")} mm` : `${(m * 1e6).toFixed(m * 1e6 >= 100 ? 0 : 0)} µm`);

export const RuiMicro: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const M = TRUI.micro;
  const celdas = useMemo(() => {
    const semillas: [number, number][] = [];
    for (let i = 0; i < 9; i++) for (let j = 0; j < 8; j++) semillas.push([(i + 0.5 + (azar(i * 7 + j * 3) - 0.5) * 0.7) * (CW / 2 / 9), (j + 0.5 + (azar(i * 5 + j * 11 + 3) - 0.5) * 0.7) * (CH / 8)]);
    return voronoi(semillas, CW / 2, CH, 2);
  }, []);
  const k = easeInOut((t - a(M.zoom)) / a(M.zoomDur));
  const col = suave(t, a(M.colapso), a(M.colapso + M.colapsoDur));
  const s = lerp(0.3, 2.5, k) * (1 - col * col) + 0.0001;
  const vib = (0.4 + 4.5 * k * k) * (1 - col);
  const m = Math.pow(10, lerp(-2, -4.5, k));
  const punto = clamp((t - a(M.colapso + M.colapsoDur * 0.85)) / a(0.4));
  const latido = 1 + 0.35 * Math.pow(Math.max(0, Math.sin(t * 6.8)), 3);
  const dientes = Array.from({ length: 17 }, (_, i) => `${i ? "L" : "M"} ${(i % 2 ? 44 : -44) + CW / 2 / 1} ${-CH / 2 + i * (CH / 16)}`).join(" ");
  void dientes;
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><clipPath id="rm"><rect x={110} y={650} width={860} height={620} /></clipPath></defs>
        <g clipPath="url(#rm)" opacity={1 - col}>
          <g transform={`translate(540 960) scale(${s})`}>
            {/* celdas de fibra (lado izquierdo de la unión) */}
            <g transform={`translate(${-CW / 2} ${-CH / 2})`}>
              {celdas.map((c, i) => {
                const prox = clamp(1 - (CW / 2 - c.sx) / 160);
                const dx = Math.sin(t * 61 + i * 1.7) * vib * prox;
                return <polygon key={i} points={c.poli.map(([x, y]) => `${(x + dx).toFixed(1)},${y.toFixed(1)}`).join(" ")} fill={mezclar("#1D0F0D", AN.rojo, prox * 0.6)} stroke={AN.papel} strokeOpacity={0.55} strokeWidth={2 / Math.max(0.3, s) + 1} />;
              })}
            </g>
            {/* surco de metal galvanizado (rosca): dientes en zigzag */}
            <path d={Array.from({ length: 17 }, (_, i) => `${i ? "L" : "M"} ${CW / 2 - CW / 2 + 4 + (i % 2 ? 40 : 0)} ${-CH / 2 + i * (CH / 16)}`).join(" ")} fill="none" stroke={AN.lima} strokeWidth={6} strokeLinejoin="miter" />
            <rect x={44} y={-CH / 2} width={CW / 2 - 44} height={CH} fill="#12161C" stroke={AN.lima} strokeOpacity={0.4} strokeWidth={2} />
          </g>
        </g>
        {punto > 0 && (
          <g>
            <circle cx={540} cy={960} r={10 * latido} fill={AN.rojo} opacity={punto} />
            <circle cx={540} cy={960} r={34 * latido} fill="none" stroke={AN.rojo} strokeWidth={3} opacity={0.5 * punto} />
          </g>
        )}
        <Visor x={110} y={650} w={860} h={620} color={AN.lima} progreso={easeOut((t - a(0.1)) / a(0.6))} />
      </svg>
      <Cap e={e} />
      <Frases id="titular-micro" y={440} frases={[{ px: 90, t: 0.2, texto: "SIN ESPÍRITUS" }, { px: 84, t: 5.9, texto: "¿QUÉ MÁS ESTÁ\nPOR CRUJIR?", color: AN.rojo }]} />
      <Texto texto="ANCHO DEL CUADRO" x={540} y={1325} px={21} color={AN.papel} delay={0.3} peso={600} id="micro-etq" interletra={0.1} opacidad={1 - col} />
      <Texto texto={lecturaMicro(m)} x={540} y={1382} px={50} color={AN.lima} delay={0.3} peso={800} id="micro-lectura" opacidad={1 - col} />
      <Pie texto={"ruidos nuevos con grietas o puertas que no cierran:\nque lo revise un profesional"} y={1480} delay={M.pregunta} />
    </Lienzo>
  );
};
