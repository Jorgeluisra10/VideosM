/**
 * Plantillas «documentales» 2/2:
 *   IMPACTO  objeto que cae con estela de copias, se estrella soltando fragmentos poligonales, polvo y ondas de choque
 *   RED      nodos que se conectan con líneas geométricas y pulsos (proteínas, ecosistemas, conexiones)
 *   TERMO    termómetro que barre un rango mientras una cuadrícula de seres cambia de verde a rojo a gris al «morir»
 *   SPLIT    pantalla dividida a todo color (rojo vs. azul) con semitono y el sujeto en el centro
 */
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { azar } from "../lib/anim";
import { TV, type EscenaViralGuardada } from "../anim/viral";
import { StudioSvgDefs } from "../estudio/efectos";
import { useUid } from "../estudio/util";
import { Banda } from "./ciencia1";
import { HORIZONTE_LUNA, Puntos } from "./escenarios";
import { Etiqueta, EsferaIcono, FUENTE, H, IconoSvg, MONO, TextoCinetico, W, clamp, easeInOut, easeOut, fmtNum, leerNumero, lerp, mezclar, oscurecer, polarXY, spr, useReloj, useViral } from "./comun";

type P = { e: EscenaViralGuardada };

const FONDO_BANDA = "rgba(1,10,31,0.74)";
const frac = (x: number): number => x - Math.floor(x);

/* ───────────── IMPACTO ───────────── */

export const Impacto: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const m = e.impacto!;
  const ti = a(TV.impacto);
  const t0 = a(0.15);
  const IX = 600, IY = HORIZONTE_LUNA + 44;
  const origen = { x: 190, y: 540 };
  const pos = (u: number): { x: number; y: number } => ({ x: lerp(origen.x, IX, u), y: lerp(origen.y, IY - 74, u * u) });
  const u = clamp((t - t0) / Math.max(0.2, ti - t0));
  const cae = t < ti;
  const p = pos(u);
  const dt = Math.max(0, t - ti);
  const sacudida = dt > 0 ? Math.exp(-dt * 7) * 15 : 0;
  const dx = Math.sin(f * 2.1) * sacudida, dy = Math.cos(f * 2.7) * sacudida * 0.8;
  const fragmentos = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    vx: (azar(i * 3.1 + 1) - 0.5) * 980, vy: -(260 + azar(i * 5.3 + 2) * 800), tam: 12 + azar(i * 7.9 + 3) * 26, giro: (azar(i * 2.9 + 4) - 0.5) * 1000,
    suelo: IY + 14 + azar(i * 11.3 + 5) * 90, forma: Array.from({ length: 4 }, (_, k) => [Math.cos(k * 1.7 + i) * (0.6 + azar(i * 13 + k) * 0.6), Math.sin(k * 1.7 + i) * (0.6 + azar(i * 17 + k) * 0.6)] as const), propio: i % 3 === 0,
  })), [IY]);
  const polvo = useMemo(() => Array.from({ length: 11 }, (_, i) => ({ x: IX + (azar(i * 4.7 + 1) - 0.5) * 140, vx: (azar(i * 6.1 + 2) - 0.5) * 220, r: 20 + azar(i * 8.3 + 3) * 38 })), []);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${dx}px, ${dy}px)` }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
          <StudioSvgDefs />
          {/* estela: copias semitransparentes de la posición anterior (efecto «eco») y puntos de la trayectoria */}
          {cae && u > 0.04 && Array.from({ length: 24 }, (_, i) => {
            const uu = u * (i / 24);
            const q = pos(uu);
            return <circle key={`s${i}`} cx={q.x} cy={q.y} r={3.5} fill={T.texto} opacity={0.5 * (i / 24)} />;
          })}
          {cae && u > 0.04 && Array.from({ length: 7 }, (_, j) => {
            const q = pos(clamp(u - (j + 1) * 0.05));
            return <circle key={`e${j}`} cx={q.x} cy={q.y} r={68 * (1 - j * 0.045)} fill={T.acento} opacity={(1 - (j + 1) / 8) * 0.34} />;
          })}
          {cae && (
            <g transform={`rotate(${u * 560} ${p.x} ${p.y})`}>
              <EsferaIcono nombre={m.ic} x={p.x} y={p.y} d={142} color={T.acento} colorIcono={T.sobreAcento} delay={0.05} />
            </g>
          )}
          {/* choque */}
          {dt > 0 && (
            <g>
              <ellipse cx={IX} cy={IY + 36} rx={lerp(0, 120, easeOut(dt / 0.35))} ry={lerp(0, 120, easeOut(dt / 0.35)) * 0.26} fill="#070A15" opacity={0.85} />
              <circle cx={IX} cy={IY - 20} r={230 * (1 - clamp(dt / 0.28))} fill="#FFFFFF" opacity={0.85 * (1 - clamp(dt / 0.28))} />
              {[0, 1, 2].map((j) => {
                const k = clamp((dt - j * 0.12) / 0.95);
                const rx = 40 + 540 * easeOut(k);
                return k > 0 && k < 1 ? <ellipse key={j} cx={IX} cy={IY + 40} rx={rx} ry={rx * 0.2} fill="none" stroke="#FFFFFF" strokeOpacity={(1 - k) * 0.85} strokeWidth={5 * (1 - k) + 1.5} /> : null;
              })}
              {polvo.map((d, i) => {
                const k = clamp(dt / 1.6);
                const r = d.r + 90 * easeOut(dt / 1.3);
                return <circle key={`p${i}`} cx={d.x + d.vx * dt * 0.6} cy={IY + 28 - 54 * easeOut(dt / 1.3) - i * 3} r={r} fill="#9AA3BD" opacity={0.5 * (1 - k)} />;
              })}
              {fragmentos.map((g, i) => {
                const G = 1700;
                let y = IY - 30 + g.vy * dt + 0.5 * G * dt * dt;
                const enSuelo = y >= g.suelo;
                if (enSuelo) y = g.suelo;
                const x = IX + g.vx * Math.min(dt, enSuelo ? 1.1 : dt);
                const ang = enSuelo ? g.giro * 1.1 : g.giro * dt;
                const fade = 1 - clamp((dt - 2.4) / 0.8);
                const pts = g.forma.map(([px, py]) => `${px * g.tam},${py * g.tam}`).join(" ");
                return <polygon key={`f${i}`} points={pts} transform={`translate(${x} ${y}) rotate(${ang})`} fill={g.propio ? T.acento : "#AEB8D6"} stroke="#05070F" strokeWidth={3} strokeLinejoin="round" opacity={fade} />;
              })}
            </g>
          )}
        </svg>
        {cae && m.v && <Etiqueta texto={m.v} x={Math.min(p.x + 110, 700)} y={p.y - 36} px={32} ancho={250} alinear="left" mono color="#FFFFFF" peso={800} fondo={FONDO_BANDA} relleno={26} delay={0.35} id="impacto-velocidad" />}
        <Etiqueta texto={m.l} x={W / 2} y={1520} px={56} ancho={780} color="#FFFFFF" peso={900} fondo={FONDO_BANDA} relleno={40} delay={TV.impacto + 0.3} id="impacto-nombre" />
      </div>
      <Banda texto={e.h} destacada={e.w} tag="IMPACTO" />
    </AbsoluteFill>
  );
};

/* ───────────── RED ───────────── */

export const Red: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const uid = useUid();
  const red = e.red!;
  const n = red.nodes.length;
  const CX = 540, CY = 960, RR = n >= 5 ? 270 : 290;
  const colores = [T.acento, T.acento2, T.peligro, T.exito];
  const nodos = red.nodes.map((l, i) => { const [x, y] = polarXY(CX, CY, RR, -90 + (360 / n) * i); return { l, i, x, y }; });
  const decor = useMemo(() => Array.from({ length: 10 }, (_, i) => ({ ang: azar(i * 7.1 + 1) * 360, rad: 370 + azar(i * 3.7 + 2) * 80, cerca: i % n, r: 6 + azar(i * 5.9) * 8 })), [n]);
  const tCruces = a(TV.redNodo(n));
  const pCruces = easeOut((t - tCruces) / 0.6);
  const sCentro = spr(f, a(0.15), { damping: 10, stiffness: 150, mass: 0.7 });
  const trazo = "#05010F";
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <defs><Puntos id={`${uid}pn`} color="#05010F" paso={12} radio={3.2} opacidad={0.55} /></defs>
        {/* enlaces cruzados entre nodos vecinos (y alguna cuerda) */}
        {nodos.map((p, i) => {
          const q = nodos[(i + 1) % n];
          const cuerda = n >= 5 ? nodos[(i + 2) % n] : null;
          return (
            <g key={`x${i}`}>
              {n > 2 && <line x1={p.x} y1={p.y} x2={lerp(p.x, q.x, pCruces)} y2={lerp(p.y, q.y, pCruces)} stroke={T.texto} strokeOpacity={0.55} strokeWidth={4} strokeLinecap="round" />}
              {cuerda && <line x1={p.x} y1={p.y} x2={lerp(p.x, cuerda.x, pCruces)} y2={lerp(p.y, cuerda.y, pCruces)} stroke={T.texto} strokeOpacity={0.22} strokeWidth={3} strokeDasharray="3 10" strokeLinecap="round" />}
            </g>
          );
        })}
        {/* enlaces desde el centro y pulsos que viajan por ellos */}
        {nodos.map((p) => {
          const k = easeOut((t - a(TV.redNodo(p.i) - 0.3)) / 0.4);
          if (k <= 0) return null;
          const fase = frac(t * 0.6 + p.i * 0.23);
          return (
            <g key={`c${p.i}`}>
              <line x1={CX} y1={CY} x2={lerp(CX, p.x, k)} y2={lerp(CY, p.y, k)} stroke={colores[p.i % 4]} strokeWidth={6} strokeLinecap="round" />
              {k >= 1 && <circle cx={lerp(CX, p.x, fase)} cy={lerp(CY, p.y, fase)} r={8} fill="#FFFFFF" />}
            </g>
          );
        })}
        {/* nodos decorativos (la red sigue más allá) */}
        {decor.map((d, i) => {
          const [x, y] = polarXY(CX, CY, d.rad, d.ang);
          const k = clamp((pCruces - 0.2) / 0.8);
          const objetivo = nodos[d.cerca];
          return k > 0 ? <g key={`d${i}`} opacity={k}><line x1={x} y1={y} x2={objetivo.x} y2={objetivo.y} stroke={T.texto} strokeOpacity={0.2} strokeWidth={2.5} strokeDasharray="2 9" /><circle cx={x + Math.sin(f / 60 + i) * 6} cy={y + Math.cos(f / 70 + i) * 6} r={d.r} fill={colores[i % 4]} opacity={0.7} /></g> : null;
        })}
        {nodos.map((p) => {
          const s = spr(f, a(TV.redNodo(p.i)), { damping: 9, stiffness: 160, mass: 0.7 });
          const col = colores[p.i % 4];
          return (
            <g key={`n${p.i}`} transform={`translate(${p.x} ${p.y}) scale(${Math.max(0.0001, s)})`} opacity={clamp(s * 2)}>
              <circle r={50} fill={col} stroke={trazo} strokeWidth={4} />
              <circle r={50} fill="url(#halftone-dots-m)" mask="url(#halftone-shadow)" opacity={0.8} />
              <circle r={22} fill="none" stroke="#FFFFFF" strokeOpacity={0.8} strokeWidth={4} />
              <circle r={8} fill="#FFFFFF" />
            </g>
          );
        })}
        <g transform={`translate(${CX} ${CY}) scale(${Math.max(0.0001, sCentro) * (1 + 0.03 * Math.sin(f / 14))})`} opacity={clamp(sCentro * 2)}>
          <circle r={104} fill={T.acento} opacity={0.22} />
          <circle r={90} fill={T.acento} stroke={trazo} strokeWidth={5} />
          <circle r={90} fill={`url(#${uid}pn)`} mask="url(#halftone-shadow)" />
        </g>
      </svg>
      <Etiqueta texto={red.c} x={CX} y={CY} px={34} ancho={150} mono color={T.sobreAcento} peso={800} delay={0.3} id="red-centro" />
      {nodos.map((p) => (
        <Etiqueta key={p.i} texto={p.l} x={p.x} y={p.y + 88} px={34} ancho={n >= 5 ? 250 : 300} mono color="#FFFFFF" peso={800} fondo={FONDO_BANDA} relleno={24} delay={TV.redNodo(p.i) + 0.1} id="red-nodo" />
      ))}
      <Banda texto={e.h} destacada={e.w} tag="RED" />
    </AbsoluteFill>
  );
};

/* ───────────── TERMO ───────────── */

/** Orden (determinista) en que «mueren» los seres de la cuadrícula: recorre los índices con un paso coprimo con n. */
function ordenMuerte(n: number): number[] {
  const gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : x);
  const paso = [5, 7, 3, 11, 1].find((p) => gcd(p, n) === 1) ?? 1;
  return Array.from({ length: n }, (_, i) => (i * paso + 2) % n);
}

export const Termo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const m = e.termo!;
  const p = easeInOut((t - a(TV.termo)) / a(TV.termoDur));
  const valor = lerp(m.lo, m.hi, p);
  const muertes = m.n - m.k;
  const orden = useMemo(() => ordenMuerte(m.n), [m.n]);
  // rango de cada ser en la lista de muertes (los últimos k sobreviven)
  const umbral = (idx: number): number => {
    const rango = orden.indexOf(idx);
    return rango < muertes ? 0.1 + (0.8 * (rango + 0.5)) / Math.max(1, muertes) : Infinity;
  };
  const TUBO = { x: 190, top: 560, base: 1300, ancho: 56 };
  const alto = (TUBO.base - TUBO.top) * p;
  const frio = T.acento2, calor = T.peligro;
  const color = mezclar(frio, calor, p);
  const rows = Math.ceil(m.n / 2);
  const paso = Math.min(170, Math.floor(800 / rows));
  const celda = paso - 24;
  const gx = 725, gy = 620;
  const textoValor = `${valor < 0 ? "−" : ""}${fmtNum(Math.abs(Math.round(valor)))} ${m.u}`;
  const pxValor = Math.min(56, Math.floor(300 / (textoValor.length * 0.62)));
  const fin = p >= 0.999;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        {/* termómetro */}
        <rect x={TUBO.x - TUBO.ancho / 2} y={TUBO.top} width={TUBO.ancho} height={TUBO.base - TUBO.top + 30} rx={TUBO.ancho / 2} fill={T.panel} stroke={T.texto} strokeOpacity={0.8} strokeWidth={5} />
        <circle cx={TUBO.x} cy={TUBO.base + 62} r={66} fill={T.panel} stroke={T.texto} strokeOpacity={0.8} strokeWidth={5} />
        <rect x={TUBO.x - 15} y={TUBO.base - alto} width={30} height={alto + 70} rx={15} fill={color} />
        <circle cx={TUBO.x} cy={TUBO.base + 62} r={48} fill={color} />
        <circle cx={TUBO.x} cy={TUBO.base + 62} r={48} fill="url(#halftone-dots-m)" mask="url(#halftone-shadow)" opacity={0.7} />
        {[0, 1, 2, 3, 4].map((j) => (
          <line key={j} x1={TUBO.x + TUBO.ancho / 2 + 6} x2={TUBO.x + TUBO.ancho / 2 + (j % 2 ? 22 : 34)} y1={TUBO.base - (TUBO.base - TUBO.top) * (j / 4)} y2={TUBO.base - (TUBO.base - TUBO.top) * (j / 4)} stroke={T.texto} strokeWidth={4} strokeLinecap="round" />
        ))}
        {/* cuadrícula de seres */}
        {Array.from({ length: m.n }, (_, i) => {
          const col = i % 2, fila = Math.floor(i / 2);
          const cx = gx + (col - 0.5) * paso, cy = gy + fila * paso + paso / 2 - 14;
          const th = umbral(i);
          const muerto = p >= th;
          const aviso = muerto && p - th < 0.045;
          const sobrevive = th === Infinity;
          const entra = spr(f, a(0.1 + i * 0.05), { damping: 12, stiffness: 150, mass: 0.7 });
          const latido = sobrevive && fin ? 1 + 0.07 * Math.sin(f / 7) : 1;
          const colIcono = aviso ? calor : muerto ? "#6F82AA" : T.exito;
          return (
            <g key={i} transform={`translate(${cx} ${cy}) scale(${Math.max(0.0001, entra) * (muerto && !aviso ? 0.9 : latido)})`} opacity={clamp(entra * 2) * (muerto && !aviso ? 0.45 : 1)}>
              <rect x={-celda / 2} y={-celda / 2} width={celda} height={celda} rx={celda * 0.22} fill={T.panel} stroke={aviso ? calor : sobrevive && fin ? T.exito : T.borde} strokeWidth={aviso || (sobrevive && fin) ? 6 : 3} />
              <IconoSvg nombre={m.ic} x={0} y={0} tam={celda * 0.74} color={colIcono} />
              {muerto && !aviso && <path d={`M ${-celda * 0.3} ${-celda * 0.3} L ${celda * 0.3} ${celda * 0.3} M ${celda * 0.3} ${-celda * 0.3} L ${-celda * 0.3} ${celda * 0.3}`} stroke={calor} strokeWidth={6} strokeLinecap="round" opacity={0.8} />}
            </g>
          );
        })}
      </svg>
      <div data-texto="termo-valor" style={{ position: "absolute", left: 270 - 160, top: 482, width: 320, transform: "translateY(-50%)", textAlign: "center", fontFamily: MONO, fontWeight: 800, fontSize: pxValor, lineHeight: 1, color, whiteSpace: "nowrap", textShadow: T.oscuro ? `0 0 28px ${color}88` : "none" }}>{textoValor}</div>
      {[0, 1, 2, 3, 4].map((j) => {
        const v = Math.round(lerp(m.lo, m.hi, j / 4));
        return <Etiqueta key={j} texto={`${v < 0 ? "−" : ""}${fmtNum(Math.abs(v))}`} x={TUBO.x + TUBO.ancho / 2 + 46} y={TUBO.base - (TUBO.base - TUBO.top) * (j / 4)} px={22} ancho={110} alinear="left" mono color={T.suave} peso={700} delay={0.3 + j * 0.05} id="termo-escala" />;
      })}
      <Etiqueta texto={`${m.k} DE ${m.n}${m.l ? " " + m.l.toUpperCase() : ""}`} x={W / 2} y={1500} px={46} ancho={800} mono color={T.sobreAcento} peso={800} fondo={T.acento} relleno={36} delay={TV.termo + TV.termoDur - 0.1} id="termo-resumen" />
      <Banda texto={e.h} destacada={e.w} tag="LÍMITE" />
    </AbsoluteFill>
  );
};

/* ───────────── PILA (presión: un píxel frente a una columna altísima de puntos, con el sujeto aplastado debajo) ───────────── */

export const Pila: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const pl = e.pila!;
  const COLS = 6, FILAS = 26, PASO = 26, BASE = 1360;
  const p = easeInOut((t - a(TV.pila)) / a(TV.pilaDur));
  const filasVisibles = Math.floor(FILAS * p);
  const aplasta = easeInOut((t - a(TV.pila + 0.2)) / a(TV.pilaDur));
  const { v, dec } = leerNumero(pl.n);
  const valor = v * p;
  const sUno = spr(f, a(0.25), { damping: 12, stiffness: 150, mass: 0.7 });
  const px = Math.min(110, Math.floor(380 / (Math.max(fmtNum(v, dec).length + 1, 3) * 0.62)));
  const xCol = 720 - (COLS * PASO) / 2;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <line x1={150} x2={930} y1={BASE + 12} y2={BASE + 12} stroke={T.texto} strokeOpacity={0.5} strokeWidth={4} strokeLinecap="round" />
        {/* un solo punto: la referencia */}
        <g transform={`translate(260 ${BASE - 14}) scale(${Math.max(0.0001, sUno)})`}>
          <rect x={-14} y={-14} width={28} height={28} fill={T.acento} stroke={T.oscuro ? "#02081C" : "#02224E"} strokeWidth={3} />
        </g>
        {/* columna de puntos que crece */}
        {Array.from({ length: filasVisibles * COLS }, (_, i) => {
          const fila = Math.floor(i / COLS), col = i % COLS;
          return <circle key={i} cx={xCol + col * PASO + PASO / 2} cy={BASE - 40 - fila * PASO} r={9} fill={mezclar(T.acento2, T.peligro, fila / FILAS)} opacity={0.95} />;
        })}
        {/* el sujeto, cada vez más aplastado */}
        <g transform={`translate(720 ${BASE + 62}) scale(${1 + 0.18 * aplasta} ${1 - 0.5 * aplasta})`}>
          <EsferaIcono nombre={pl.ic} x={0} y={0} d={190} color={T.exito} colorIcono="#FFFFFF" delay={0.1} />
        </g>
      </svg>
      <div data-texto="pila-valor" style={{ position: "absolute", left: 720 - 210, top: 520, width: 420, transform: "translateY(-50%)", textAlign: "center", fontFamily: MONO, fontWeight: 800, fontSize: px, lineHeight: 1, color: T.texto, whiteSpace: "nowrap" }}>
        {`× ${fmtNum(valor, dec)}`}
      </div>
      <Etiqueta texto={pl.l1} x={260} y={BASE + 80} px={32} ancho={300} mono color={T.texto} peso={800} delay={0.4} id="pila-uno" />
      <Etiqueta texto={pl.l2} x={720} y={625} px={36} ancho={500} mono color={T.sobreAcento} peso={800} fondo={T.acento} relleno={30} delay={TV.pila + 0.6} id="pila-columna" />
      <Banda texto={e.h} destacada={e.w} tag="PRESIÓN" />
    </AbsoluteFill>
  );
};

/* ───────────── SPLIT ───────────── */

export const Split: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const uid = useUid();
  const vs = e.vs!;
  const gana = vs.op === ">" ? "a" : vs.op === "<" ? "b" : "";
  const sIn = spr(f, a(0.05), { damping: 16, stiffness: 120, mass: 0.8 });
  const sOp = spr(f, a(1.7), { damping: 7, stiffness: 190, mass: 0.6 });
  const rojo = mezclar(T.peligro, "#000000", 0.12), azul = mezclar(T.acento2, "#000000", 0.18);
  const lados = [
    { k: "a" as const, d: vs.a, cx: 300, col: rojo, x0: 0 },
    { k: "b" as const, d: vs.b, cx: 780, col: azul, x0: 540 },
  ];
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <StudioSvgDefs />
        <defs>
          {lados.map((l) => (
            <React.Fragment key={l.k}>
              <linearGradient id={`${uid}${l.k}g`} x1={l.k === "a" ? "0" : "1"} y1="0" x2={l.k === "a" ? "1" : "0"} y2="0"><stop offset="0" stopColor={oscurecer(l.col, 0.35)} /><stop offset="1" stopColor={l.col} /></linearGradient>
              <Puntos id={`${uid}${l.k}p`} color={oscurecer(l.col, 0.5)} paso={20} radio={5.4} opacidad={0.55} />
            </React.Fragment>
          ))}
        </defs>
        {lados.map((l) => {
          const gx = (l.k === "a" ? -1 : 1) * (1 - clamp(sIn)) * 540;
          const atenua = gana && gana !== l.k ? lerp(0, 0.38, clamp((t - a(TV.splitGana)) / 0.4)) : 0;
          return (
            <g key={l.k} transform={`translate(${gx} 0)`}>
              <rect x={l.x0} y={0} width={540} height={H} fill={`url(#${uid}${l.k}g)`} />
              <rect x={l.x0} y={0} width={540} height={H} fill={`url(#${uid}${l.k}p)`} />
              <rect x={l.x0} y={0} width={540} height={H} fill="#010A1F" opacity={atenua} />
            </g>
          );
        })}
        <rect x={528} y={0} width={24} height={H} fill="#FFFFFF" opacity={0.12} />
        <rect x={536} y={0} width={8} height={H} fill="#FFFFFF" opacity={0.9} />
        {lados.map((l, i) => (
          <g key={l.k}>
            {gana === l.k && t > a(TV.splitGana) && <circle cx={l.cx} cy={650} r={125 + 6 * Math.sin(f / 9)} fill="none" stroke="#FFFFFF" strokeWidth={6} strokeDasharray="3 14" strokeLinecap="round" opacity={0.9} />}
            <EsferaIcono nombre={l.d.ic} x={l.cx} y={650} d={210} color="#FFFFFF" colorIcono={l.col} delay={0.3 + i * 0.1} flota={8} />
          </g>
        ))}
        <g transform={`translate(540 1090) scale(${Math.max(0.0001, sOp)}) rotate(${(1 - sOp) * -50})`} opacity={clamp(sOp * 2)}>
          <circle r={58} fill="#FFFFFF" stroke="#010A1F" strokeWidth={6} />
        </g>
        <EsferaIcono nombre={e.ic} x={540} y={1390} d={250} color={T.acento} colorIcono={T.sobreAcento} delay={0.7} flota={10} />
      </svg>
      {lados.map(({ k, d, cx }, i) => {
        const { v, dec } = leerNumero(d.n);
        const kk = easeOut((t - a(TV.splitContar + i * 0.12)) / a(1.2));
        const txt = fmtNum(v * kk, dec);
        const largo = Math.max(txt.length, fmtNum(v, dec).length);
        const px = Math.min(130, Math.floor(330 / (largo * 0.62)));
        return (
          <React.Fragment key={k}>
            <TextoCinetico texto={d.l} destacada="" y={880} x={cx} ancho={340} maxPx={80} minPx={40} maxLineas={2} color="#FFFFFF" delay={0.35 + i * 0.1} id="split-lado" />
            <div data-texto="contador" style={{ position: "absolute", left: cx - 175, top: 1090, width: 350, textAlign: "center", transform: "translateY(-50%)", fontFamily: MONO, fontWeight: 800, fontSize: px, letterSpacing: "-0.02em", lineHeight: 1, color: "#FFFFFF", opacity: clamp((t - a(TV.splitContar - 0.2 + i * 0.12)) / 0.25), whiteSpace: "nowrap", textShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>{txt}</div>
          </React.Fragment>
        );
      })}
      <div data-texto="operador" style={{ position: "absolute", left: 540 - 58, top: 1090 - 58, width: 116, height: 116, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FUENTE, fontWeight: 900, fontSize: 76, lineHeight: 1, color: "#010A1F", transform: `scale(${Math.max(0.0001, sOp)})`, opacity: clamp(sOp * 2) }}>{vs.op}</div>
      <Banda texto={e.h} destacada={e.w} tag="DOS POSTURAS" />
    </AbsoluteFill>
  );
};
