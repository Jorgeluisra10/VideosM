/**
 * Ensayo «Anomalía» · escenas a medida 4/4-a
 *   anom-escala  zoom continuo en el eje Z de 10^4,5 m (la ciudad y su línea) a 10^-0,3 m (UN metro cuadrado de suelo) con el módulo «ANCHO DEL CUADRO»,
 *                visor de esquinas, barra de escala y la malla de Voronoi de 100 m; el último metro cuadrado se llena de papel (match-cut al estudio económico)
 *   anom-suelo   sobre papel: parcelas de Voronoi extruidas en isométrico, con la altura = valorización (semitono rojo cerca de la estación, azul pálido lejos)
 */
import React, { useMemo } from "react";
import { TA, valorSuelo } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { Etiqueta, H, LineaCap, MONO, W, clamp, easeInOut, easeOut, lerp, mezclar, oscurecer, useReloj } from "../comun";
import { AN, Lienzo, Odometro, Titular, Visor, proyectar, voronoi } from "./anom-ui";
import { useUid } from "../../estudio/util";

type P = { e: EscenaViralGuardada };

/* ───────────── anom-escala ───────────── */

const LW0 = 4.5, LW1 = -0.3; // log10 del ancho del cuadro (m)
const CX = W / 2, CY = 1010;

const construirEscala = () => {
  // parcelas de ≈ 100 m alrededor de la estación (15×15 semillas → ± 750 m)
  const semillas: [number, number][] = [];
  const N = 15;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) semillas.push([(i + 0.5 + (azar(i * 7 + j * 3) - 0.5) * 0.8) * 100, (j + 0.5 + (azar(i * 5 + j * 11 + 3) - 0.5) * 0.8) * 100]);
  const celdas = voronoi(semillas, N * 100, N * 100, 2).map((c) => ({ ...c, poli: c.poli.map(([x, y]) => [x - (N * 100) / 2, y - (N * 100) / 2] as [number, number]) }));
  return { celdas };
};

const nivel = (lw: number): string => (lw > 3.6 ? "CIUDAD" : lw > 2.4 ? "ESTACIÓN" : lw > 0.9 ? "PARCELA" : "1 m²");

export const AnomEscala: React.FC<P> = ({ e }) => {
  const { f, t, a, dur } = useReloj();
  const { celdas } = useMemo(construirEscala, []);
  const u = easeInOut((t - a(TA.escala.zoomIni)) / a(TA.escala.zoomDur));
  const lw = lerp(LW0, LW1, u);
  const Wm = Math.pow(10, lw);
  const z = W / Wm; // px por metro
  const sx = (x: number): number => CX + x * z;
  const sy = (y: number): number => CY + y * z;
  const papel = clamp((0.95 - lw) / 0.95);
  const hud = 1 - clamp(papel * 1.5);
  const visor = easeOut((t - 0.1) / 0.7);
  // barra de escala: una potencia de diez que mida ≈ 15–35 % del ancho
  const kBar = Math.floor(Math.log10(Wm * 0.32));
  const barPx = Math.pow(10, kBar) * z;
  const lineaX0 = sx(-12000), lineaX1 = sx(12000);
  const estaciones = Array.from({ length: 13 }, (_, i) => (i - 6) * 2000);
  const grilla = (D: number): React.ReactNode => {
    const px = D * z;
    if (px < 14 || px > 1100) return null;
    const op = clamp((px - 14) / 30) * clamp((1100 - px) / 400) * 0.7;
    const n0 = Math.floor((-CX / z) / D) - 1, n1 = Math.ceil((CX / z) / D) + 1;
    const m0 = Math.floor((-CY / z) / D) - 1, m1 = Math.ceil(((H - CY) / z) / D) + 1;
    return (
      <g stroke={AN.blanco} strokeOpacity={op} strokeWidth={1.4}>
        {Array.from({ length: Math.min(120, n1 - n0 + 1) }, (_, i) => { const x = sx((n0 + i) * D); return <line key={`v${i}`} x1={x} x2={x} y1={0} y2={H} />; })}
        {Array.from({ length: Math.min(200, m1 - m0 + 1) }, (_, i) => { const y = sy((m0 + i) * D); return <line key={`h${i}`} x1={0} x2={W} y1={y} y2={y} />; })}
      </g>
    );
  };
  const pxCelda = 100 * z;
  const opV = clamp((pxCelda - 7) / 22) * clamp((900 - pxCelda) / 300);
  return (
    <Lienzo modo="oscuro" rejilla={false}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* parcelas de Voronoi (100 m) */}
        {opV > 0.01 && celdas.map((c) => {
          const pts = c.poli.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ");
          const xs = c.poli.map(([x]) => sx(x)), ys = c.poli.map(([, y]) => sy(y));
          if (Math.max(...xs) < -50 || Math.min(...xs) > W + 50 || Math.max(...ys) < -50 || Math.min(...ys) > H + 50) return null;
          const d = Math.hypot(c.sx, c.sy);
          const v = valorSuelo(d) / 35;
          return <polygon key={c.i} points={pts} fill={AN.rojo} fillOpacity={v * 0.2 * opV} stroke={AN.blanco} strokeOpacity={0.3 * opV} strokeWidth={1.4} />;
        })}
        {grilla(10)}
        {grilla(1)}
        {/* la línea de 24 km y sus estaciones (nodos) */}
        <line x1={lineaX0} x2={lineaX1} y1={CY} y2={CY} stroke={AN.azul} strokeWidth={9} strokeLinecap="round" opacity={clamp(1 - (3.9 - lw) * 1.2)} />
        {estaciones.map((x, i) => { const xx = sx(x); return xx > -30 && xx < W + 30 && lw > 3.3 ? <circle key={i} cx={xx} cy={CY} r={i === 6 ? 12 : 7} fill={i === 6 ? AN.lima : AN.oscuro} stroke={AN.lima} strokeWidth={3} opacity={clamp(1 - (3.9 - lw) * 1.2)} /> : null; })}
        {/* anillos de 800 y 500 m alrededor de la estación */}
        {[800, 500].map((R, i) => { const r = R * z; return r < 5000 && r > 3 ? <circle key={R} cx={CX} cy={CY} r={r} fill="none" stroke={i === 0 ? AN.blanco : AN.rojo} strokeWidth={i === 0 ? 2.6 : 4} strokeDasharray={i === 0 ? "4 10" : "10 9"} strokeLinecap="round" strokeOpacity={0.9} /> : null; })}
        {/* la estación y la cruz de puntería */}
        <circle cx={CX} cy={CY} r={clamp(14 + z * 6, 14, 30)} fill="none" stroke={AN.lima} strokeWidth={3} opacity={lw > 0.9 ? 1 : clamp(lw / 0.9)} />
        {/* el metro cuadrado final se llena de papel: match-cut con la escena siguiente */}
        {lw < 2.2 && <rect x={sx(-0.5)} y={sy(-0.5)} width={z} height={z} fill="none" stroke={AN.lima} strokeWidth={5} opacity={clamp((2.2 - lw) / 0.6) * (1 - clamp(papel * 1.3))} />}
        {papel > 0 && <rect x={sx(-0.5)} y={sy(-0.5)} width={z} height={z} fill={AN.papel} opacity={clamp(papel * 1.3)} />}
        <g opacity={hud}>
          <Visor x={96} y={560} w={W - 192} h={900} progreso={visor} cruz />
          {/* barra de escala */}
          <line x1={120} x2={120 + clamp(barPx, 40, 440)} y1={1556} y2={1556} stroke={AN.lima} strokeWidth={6} />
          <line x1={120} x2={120} y1={1544} y2={1568} stroke={AN.lima} strokeWidth={4} />
          <line x1={120 + clamp(barPx, 40, 440)} x2={120 + clamp(barPx, 40, 440)} y1={1544} y2={1568} stroke={AN.lima} strokeWidth={4} />
        </g>
      </svg>
      <div style={{ opacity: hud }}>
        {e.cap && <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={AN.blanco} />}
        <Etiqueta texto="ANCHO DEL CUADRO" x={120} y={395} px={26} ancho={500} alinear="left" mono color={AN.blanco} peso={700} mayus delay={0.3} id="escala-etq" />
        <div data-texto="escala-ancho" style={{ position: "absolute", left: 120, top: 470, transform: "translateY(-50%)", fontFamily: MONO, fontWeight: 800, fontSize: 92, color: AN.lima, whiteSpace: "nowrap", letterSpacing: "-0.03em", lineHeight: 1 }}>10<span style={{ fontSize: 46, position: "relative", top: -42, marginLeft: 4 }}>{lw.toFixed(1).replace(".", ",")}</span><span style={{ fontSize: 40, marginLeft: 12, fontWeight: 600 }}>m</span></div>
        <Etiqueta texto={nivel(lw)} x={W - 120} y={430} px={46} ancho={420} alinear="right" mono color={AN.blanco} peso={800} mayus={false} delay={0.4} id="escala-nivel" />
        <Etiqueta texto={`10^${kBar} m`} x={120} y={1612} px={28} ancho={300} alinear="left" mono color={AN.lima} peso={700} mayus={false} delay={0.6} id="escala-barra" />
      </div>
    </Lienzo>
  );
};

/* ───────────── anom-suelo ───────────── */

const ISO_S = { cx: 540, cy: 800, sc: 43, zs: 74 };
const NS = 12; // 12 × 12 unidades de 150 m
const M_UNIDAD = 150;

const construirSuelo = () => {
  const semillas: [number, number][] = [];
  for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) semillas.push([0.5 + i + (azar(i * 9 + j * 2) - 0.5) * 0.85, 0.5 + j + (azar(i * 4 + j * 13 + 6) - 0.5) * 0.85]);
  return voronoi(semillas, NS, NS, 3)
    .map((c) => ({ ...c, d: Math.hypot(c.sx - NS / 2, c.sy - NS / 2) * M_UNIDAD }))
    .sort((p, q) => p.sx + p.sy - (q.sx + q.sy));
};

export const AnomSuelo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const uid = useUid();
  const celdas = useMemo(construirSuelo, []);
  const P3 = (x: number, y: number, z = 0): [number, number] => proyectar(x, y, z, ISO_S);
  const onda = a(TA.suelo.onda), ondaDur = a(TA.suelo.ondaDur);
  const cifra = easeOut((t - a(TA.suelo.cifra)) / a(TA.suelo.cifraDur));
  const sufijo = (k: number): string => `${uid}p${k}`;
  const anillo = (R: number): string => Array.from({ length: 73 }, (_, i) => { const g = (i / 72) * Math.PI * 2; return P3(NS / 2 + Math.cos(g) * (R / M_UNIDAD), NS / 2 + Math.sin(g) * (R / M_UNIDAD), 0.02).join(","); }).join(" ");
  const [ex, ey] = P3(NS / 2, NS / 2, 0);
  return (
    <Lienzo modo="papel">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          {[0.18, 0.3, 0.45, 0.62].map((r, k) => (
            <pattern key={k} id={sufijo(k)} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="5" cy="5" r={r * 5} fill={AN.rojo} /></pattern>
          ))}
        </defs>
        <polygon points={[[0, 0], [NS, 0], [NS, NS], [0, NS]].map(([x, y]) => P3(x, y).join(",")).join(" ")} fill="none" stroke={AN.tinta} strokeOpacity={0.5} strokeWidth={2.5} />
        {celdas.map((c) => {
          const v = valorSuelo(c.d) / 35;
          const k = easeOut((t - onda - (c.d / 1300) * ondaDur) / 0.9);
          const h = 0.1 + 3.4 * v * k;
          const clase = v > 0.9 ? 3 : v > 0.7 ? 2 : v > 0.4 ? 1 : 0;
          const base = mezclar(mezclar(AN.papel, AN.azul, 0.16 * (1 - v)), AN.rojo, v * 0.2);
          const colorLado = mezclar(oscurecer(AN.rojo, 0.15), AN.azul, 1 - v);
          const poli = c.poli;
          const arriba = poli.map(([x, y]) => P3(x, y, h).join(",")).join(" ");
          return (
            <g key={c.i}>
              {poli.map(([x, y], i) => {
                const [x2, y2] = poli[(i + 1) % poli.length];
                // solo las aristas que miran hacia la cámara (normal con componente +x o +y)
                const nx = y2 - y, ny = -(x2 - x);
                if (nx + ny < 0) return null;
                return <polygon key={i} points={[P3(x, y, 0), P3(x2, y2, 0), P3(x2, y2, h), P3(x, y, h)].map((p) => p.join(",")).join(" ")} fill={mezclar(colorLado, AN.tinta, nx > ny ? 0.28 : 0.1)} fillOpacity={0.5 + 0.5 * v} stroke={AN.tinta} strokeOpacity={0.35} strokeWidth={1} />;
              })}
              <polygon points={arriba} fill={base} stroke={AN.tinta} strokeOpacity={0.55} strokeWidth={1.4} />
              {v > 0.3 && k > 0.05 && <polygon points={arriba} fill={`url(#${sufijo(clase)})`} opacity={clamp(k * 1.5)} />}
            </g>
          );
        })}
        {/* anillos de 500 y 800 m y la estación (vector vertical) */}
        <polyline points={anillo(500)} fill="none" stroke={AN.rojo} strokeWidth={4} strokeDasharray="10 9" strokeDashoffset={-t * 26} strokeLinecap="round" opacity={clamp((t - 0.6) / 0.5)} />
        <polyline points={anillo(800)} fill="none" stroke={AN.tinta} strokeWidth={3} strokeDasharray="4 10" strokeDashoffset={t * 16} strokeLinecap="round" opacity={clamp((t - 0.8) / 0.5)} />
        <line x1={ex} x2={ex} y1={ey} y2={ey - 3.9 * ISO_S.zs} stroke={AN.tinta} strokeWidth={4} opacity={clamp((t - 0.5) / 0.5)} />
        <circle cx={ex} cy={ey - 3.9 * ISO_S.zs} r={17 + 3 * Math.sin(t * 4.2)} fill={AN.lima} stroke={AN.tinta} strokeWidth={5} opacity={clamp((t - 0.5) / 0.5)} />
        <Visor x={96} y={560} w={W - 192} h={800} color={AN.tinta} progreso={easeOut((t - 0.2) / 0.7)} />
      </svg>
      {e.cap && <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={AN.tinta} />}
      <Titular y={440} maxPx={96} color={AN.tinta} lineas={[{ texto: "CENTRO DE GRAVEDAD", delay: 0.15 }, { texto: "FINANCIERO", color: AN.rojo, delay: 0.45 }]} id="titular-suelo" />
      <Etiqueta texto="estación" x={ex + 28} y={ey - 3.9 * ISO_S.zs - 30} px={24} ancho={240} alinear="left" mono color={AN.tinta} peso={700} mayus={false} delay={0.8} id="suelo-estacion" />
      <Etiqueta texto="500 m" x={120} y={1330} px={26} ancho={300} alinear="left" mono color={AN.rojo} peso={700} mayus={false} delay={TA.suelo.onda + 0.8} id="suelo-r500" />
      <Etiqueta texto="800 m" x={W - 120} y={1330} px={26} ancho={300} alinear="right" mono color={AN.tinta} peso={700} mayus={false} delay={TA.suelo.onda + 1.6} id="suelo-r800" />
      <Odometro valor={Math.round(35 * cifra)} x={W / 2} y={1470} px={150} digitos={2} prefijo="+" sufijo="%" color={AN.rojo} id="suelo-cifra" opacidad={clamp(cifra * 5)} />
      <div data-texto="suelo-ref" style={{ position: "absolute", left: 120, top: 1590, width: W - 240, textAlign: "center", fontFamily: MONO, fontSize: 24, lineHeight: 1.5, color: AN.tinta, opacity: 0.62 * clamp((t - a(TA.suelo.cifra + 1.2)) / 0.6) }}>{`${(e.pieza?.props?.fuente as string) ?? "BID y estudios de desarrollo urbano"}${e.pieza?.props?.anio ? ` · ${e.pieza.props.anio}` : ""} · rango de 20 a 35 % a 500–800 m · alturas ilustrativas`}</div>
    </Lienzo>
  );
};
