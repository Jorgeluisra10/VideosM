/**
 * Ensayo «Anomalía» · escenas a medida 3/4
 *   anom-vertical  isométrico: una malla de Voronoi (el plano) con carriles Bézier y nudos de conflicto en semitono rojo; una línea azul se eleva por el eje Z
 *                  sobre pilares-vector y los nudos se apagan: de N cruces a 0
 *   anom-carrera   duelo estroboscópico: dos cápsulas sobre los mismos 24 km (superficie a 12 km/h vs. línea elevada, 27 min), reloj en odómetro,
 *                  y el flujo de 72.000 pasajeros por hora y sentido como corriente de partículas que cruza una puerta
 */
import React, { useMemo } from "react";
import { METRO_DATOS, TA, tLlegaCarrera } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { Etiqueta, H, LineaCap, MONO, W, clamp, easeInOut, easeOut, lerp, mezclar, useReloj } from "../comun";
import { AN, Blancos, Capsula, Lienzo, Odometro, PuntosSemitono, Titular, Visor, bezierPor, cruceSegmentos, muestrear, proyectar, voronoi } from "./anom-ui";

type P = { e: EscenaViralGuardada };

/* ───────────── anom-vertical ───────────── */

const ISO = { cx: 540, cy: 735, sc: 52, zs: 62 };
const NV = 10; // el plano es un cuadrado de 10 × 10 unidades

const construirVertical = () => {
  // semillas en rejilla irregular + relajación de Lloyd → celdas parejas (la malla poligonal del suelo)
  const semillas: [number, number][] = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) semillas.push([0.8 + i * 1.7 + (azar(i * 7 + j) - 0.5) * 1.1, 0.8 + j * 1.7 + (azar(i * 3 + j * 11 + 4) - 0.5) * 1.1]);
  const celdas = voronoi(semillas, NV, NV, 2);
  // carriles de superficie (3 en cada sentido), curvos
  const lanes = [] as { m: { x: number; y: number; a: number; s: number }[]; total: number }[];
  for (let k = 0; k < 3; k++) {
    const c = 2.2 + k * 2.8;
    const v = [0.1, 2.6, 5.2, 7.8, 9.9].map((y, i) => ({ x: c + (azar(k * 5 + i + 1) - 0.5) * 1.5, y }));
    const h = [0.1, 2.6, 5.2, 7.8, 9.9].map((x, i) => ({ x, y: c + (azar(k * 5 + i + 21) - 0.5) * 1.5 }));
    for (const pts of [v, h]) { const m = muestrear(pts, 200); lanes.push({ m, total: m[m.length - 1].s }); }
  }
  // la línea elevada: diagonal suave
  const linea = muestrear([{ x: 0.3, y: 6.4 }, { x: 3.2, y: 5.6 }, { x: 6.4, y: 4.3 }, { x: 9.7, y: 3.2 }], 220);
  const cruces: { x: number; y: number }[] = [];
  for (const L of lanes) for (let i = 0; i < L.m.length - 1; i++) for (let j = 0; j < linea.length - 1; j++) {
    const p = cruceSegmentos(L.m[i], L.m[i + 1], linea[j], linea[j + 1]);
    if (p && !cruces.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 0.8)) cruces.push(p);
  }
  return { celdas, lanes, linea, cruces };
};

export const AnomVertical: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const mundo = useMemo(construirVertical, []);
  const ap = easeOut((t - 0.1) / 0.8);
  const alza = easeInOut((t - a(TA.vertical.alza)) / a(TA.vertical.alzaDur));
  const Z = 2.7 * alza;
  const P3 = (x: number, y: number, z = 0): [number, number] => proyectar(x, y, z, ISO);
  const nCruces = mundo.cruces.length;
  const conflicto = (1 - alza) * ap;
  const pts = (arr: { x: number; y: number }[], z = 0): string => arr.map((p) => P3(p.x, p.y, z).join(",")).join(" ");
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* el plano: teselación de Voronoi */}
        <g opacity={ap}>
          <polygon points={pts([{ x: 0, y: 0 }, { x: NV, y: 0 }, { x: NV, y: NV }, { x: 0, y: NV }])} fill={AN.oscuro} stroke={AN.blanco} strokeOpacity={0.5} strokeWidth={2.5} />
          {mundo.celdas.map((c) => c.poli.length > 2 && <polygon key={c.i} points={pts(c.poli.map(([x, y]) => ({ x, y })))} fill="none" stroke={AN.blanco} strokeOpacity={0.2} strokeWidth={1.5} />)}
        </g>
        {/* carriles de superficie con su tráfico de cápsulas (arranca y frena) */}
        {mundo.lanes.map((L, i) => <polyline key={i} points={pts(L.m)} fill="none" stroke={AN.blanco} strokeOpacity={0.4 * ap} strokeWidth={3} />)}
        {mundo.lanes.map((L, i) => Array.from({ length: 4 }, (_, k) => {
          const base = ((k + azar(i * 3 + k) * 0.4) / 4) * L.total;
          const s = (base + 55 * t * (0.55 + 0.45 * Math.abs(Math.sin(t * 1.1 + i + k))) + 22 * Math.sin(t * 2 + k)) % L.total;
          const idx = Math.min(L.m.length - 1, Math.floor((s / L.total) * (L.m.length - 1)));
          const q = L.m[idx], q2 = L.m[Math.min(L.m.length - 1, idx + 1)];
          const [x, y] = P3(q.x, q.y);
          const [x2, y2] = P3(q2.x, q2.y);
          return <Capsula key={`${i}-${k}`} x={x} y={y} ang={Math.atan2(y2 - y, x2 - x)} l={24} g={9} color={AN.lima} opacidad={0.9 * ap} />;
        }))}
        {/* nudos de conflicto: donde la línea nueva cruzaría la calzada; el semitono rojo se apaga al elevarla */}
        {mundo.cruces.map((c, i) => {
          const [x, y] = P3(c.x, c.y);
          const R = 14 + 52 * conflicto;
          return conflicto > 0.04 ? <PuntosSemitono key={i} campo={(px, py) => 1 - Math.hypot(px - x, py - y) / R} x0={x - R} y0={y - R} w={R * 2} h={R * 2} paso={11} color={AN.rojo} rMax={6.4} recorte={(px, py) => Math.hypot(px - x, py - y) < R} /> : null;
        })}
        {/* pilares-vector (lima) bajo la línea elevada */}
        {alza > 0.05 && mundo.linea.filter((_, i) => i % 22 === 6).map((q, i) => {
          const [x0, y0] = P3(q.x, q.y, 0), [x1, y1] = P3(q.x, q.y, Z);
          return <g key={i} opacity={clamp((alza - 0.05) * 2)}><line x1={x0} y1={y0} x2={x1} y2={y1} stroke={AN.lima} strokeWidth={2.5} strokeDasharray="5 7" /><circle cx={x0} cy={y0} r={4} fill={AN.lima} /></g>;
        })}
        {/* la línea elevada (azul eléctrico) con su halo y las cápsulas veloces con estela estroboscópica */}
        <polyline points={pts(mundo.linea, Z)} fill="none" stroke={AN.azul} strokeOpacity={0.28} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" opacity={ap} />
        <polyline points={pts(mundo.linea, Z)} fill="none" stroke={AN.azul} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={ap} />
        {alza > 0.9 && [0, 1, 2].map((k) => [0, 1, 2, 3, 4, 5].map((z) => {
          const u = (((t - a(TA.vertical.alza + TA.vertical.alzaDur)) * 0.42 + k / 3 - z * 0.012) % 1 + 1) % 1;
          const q = mundo.linea[Math.floor(u * (mundo.linea.length - 2))], q2 = mundo.linea[Math.floor(u * (mundo.linea.length - 2)) + 1];
          const [x, y] = P3(q.x, q.y, Z), [x2, y2] = P3(q2.x, q2.y, Z);
          return <Capsula key={`${k}-${z}`} x={x} y={y} ang={Math.atan2(y2 - y, x2 - x)} l={z === 0 ? 40 : 34} g={z === 0 ? 14 : 11} color={AN.lima} opacidad={z === 0 ? 1 : 0.55 - z * 0.085} />;
        }))}
        <Visor x={90} y={ISO.cy - 200} w={W - 180} h={640} progreso={easeOut((t - 0.3) / 0.7)} />
      </svg>
      {e.cap && <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={AN.blanco} />}
      <Titular y={455} maxPx={118} lineas={[{ texto: "AVENIDA", tachado: TA.vertical.tacha, delay: 0.1 }, { texto: "EJE Z", color: AN.lima, delay: TA.vertical.tacha + 0.25 }]} id="titular-vertical" />
      <Etiqueta texto="cruces en conflicto" x={120} y={1500} px={26} ancho={420} alinear="left" mono color={AN.blanco} peso={400} mayus={false} delay={0.6} id="vertical-etq1" />
      <Odometro valor={Math.round(nCruces * (1 - alza))} x={120} y={1585} px={84} digitos={1} color={AN.rojo} alinear="left" id="vertical-cruces" />
      <Etiqueta texto="longitud de la línea" x={W - 120} y={1500} px={26} ancho={420} alinear="right" mono color={AN.blanco} peso={400} mayus={false} delay={0.8} id="vertical-etq2" />
      <Odometro valor={METRO_DATOS.kmLinea * clamp((t - a(TA.vertical.alza)) / a(TA.vertical.alzaDur + 0.6))} x={W - 120} y={1585} px={84} digitos={2} sufijo="km" color={AN.lima} alinear="right" id="vertical-km" />
    </Lienzo>
  );
};

/* ───────────── anom-carrera ───────────── */

const X0 = 170, X1 = 910, Y_A = 700, Y_B = 818;
const CODA = 0.12;

export const AnomCarrera: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const ini = a(TA.carrera.ini), dur = a(TA.carrera.dur);
  const tau = TA.carrera.minTotal * clamp((t - ini) / dur); // minutos simulados
  const kmB = Math.min(METRO_DATOS.kmLinea, (tau / METRO_DATOS.minMetro) * METRO_DATOS.kmLinea);
  const kmA = Math.min(METRO_DATOS.kmLinea, (METRO_DATOS.velSuperficie * tau) / 60);
  const llegoB = tau >= METRO_DATOS.minMetro;
  const px = (km: number): number => lerp(X0, X1, km / METRO_DATOS.kmLinea);
  const flujo = clamp((t - a(TA.carrera.flujo)) / a(TA.carrera.flujoDur));
  const pax = METRO_DATOS.pasajerosHora * easeOut(flujo);
  const tach = TA.carrera.tacha;
  return (
    <Lienzo modo="marino">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* dos pistas de 24 km con marcas cada 4 km */}
        {[Y_A, Y_B].map((y, i) => (
          <g key={y}>
            <line x1={X0} x2={X1} y1={y} y2={y} stroke={i === 0 ? AN.rojo : AN.azul} strokeWidth={4} strokeOpacity={0.7} />
            {Array.from({ length: 7 }, (_, k) => <line key={k} x1={px(k * 4)} x2={px(k * 4)} y1={y - 12} y2={y + 12} stroke={AN.blanco} strokeOpacity={0.35} strokeWidth={2} />)}
          </g>
        ))}
        <line x1={X1} x2={X1} y1={Y_A - 50} y2={Y_B + 50} stroke={AN.lima} strokeWidth={3} strokeDasharray="6 8" />
        {/* estelas estroboscópicas: la cápsula dejada cada 0,14 s */}
        {Array.from({ length: 9 }, (_, z) => {
          const tz = t - z * 0.14;
          const tauz = TA.carrera.minTotal * clamp((tz - ini) / dur);
          const kA = Math.min(METRO_DATOS.kmLinea, (METRO_DATOS.velSuperficie * tauz) / 60);
          const kB = Math.min(METRO_DATOS.kmLinea, (tauz / METRO_DATOS.minMetro) * METRO_DATOS.kmLinea);
          const o = z === 0 ? 1 : 0.62 - z * 0.065;
          return <g key={z}><Capsula x={px(kA)} y={Y_A} ang={0} l={z === 0 ? 54 : 46} g={z === 0 ? 22 : 18} color={AN.rojo} opacidad={o} /><Capsula x={px(kB)} y={Y_B} ang={0} l={z === 0 ? 54 : 46} g={z === 0 ? 22 : 18} color={AN.lima} opacidad={o} /></g>;
        })}
        {/* la puerta de flujo: una corriente de partículas cruza el vector lima */}
        <g>
          <line x1={X0} x2={X1} y1={1235} y2={1235} stroke={AN.lima} strokeWidth={3} strokeOpacity={0.55} />
          {Array.from({ length: 150 }, (_, i) => {
            const v = 0.55 + azar(i * 1.7) * 0.5;
            const x = X0 + ((((t - a(TA.carrera.flujo)) * 140 * v + azar(i * 3.3) * (X1 - X0)) % (X1 - X0)) + (X1 - X0)) % (X1 - X0);
            const y = 1235 + (azar(i * 5.9) - 0.5) * 120;
            return <circle key={i} cx={x} cy={y} r={2.4 + azar(i * 9.1) * 3} fill={AN.azul} opacity={flujo > 0 ? 0.95 : 0} stroke={AN.lima} strokeOpacity={0.6} strokeWidth={0.8} />;
          })}
          <Visor x={X0 - 40} y={1150} w={X1 - X0 + 80} h={180} progreso={easeOut((t - a(TA.carrera.flujo - 0.5)) / 0.6)} largo={40} grosor={4} />
        </g>
      </svg>
      {e.cap && <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={AN.blanco} />}
      <Titular y={438} maxPx={110} lineas={[{ texto: "12 KM/H", color: AN.rojo, tachado: tach, delay: 0.1 }, { texto: "43 KM/H", color: AN.lima, delay: tach + 0.25 }]} id="titular-carrera" />
      <Etiqueta texto="superficie" x={X0} y={Y_A - 38} px={24} ancho={300} alinear="left" mono color={AN.rojo} peso={700} mayus={false} delay={0.5} id="carrera-etqA" />
      <Etiqueta texto="línea elevada" x={X0} y={Y_B + 40} px={24} ancho={300} alinear="left" mono color={AN.lima} peso={700} mayus={false} delay={0.6} id="carrera-etqB" />
      <Odometro valor={tau} x={W / 2} y={965} px={92} digitos={2} sufijo="min" color={llegoB ? AN.lima : AN.blanco} id="carrera-reloj" opacidad={clamp((t - 0.5) / 0.4)} />
      <Odometro valor={pax} x={W / 2} y={1410} px={88} digitos={5} color={AN.lima} id="carrera-pax" opacidad={clamp(flujo * 6)} />
      <Etiqueta texto="pasajeros por hora y por sentido" x={W / 2} y={1485} px={26} ancho={760} mono color={AN.blanco} peso={400} mayus={false} delay={TA.carrera.flujo + 0.4} id="carrera-pax-etq" />
      <Blancos x={W / 2} y={1580} px={32} antes="VIAJE = " valor="27 min" resuelve={tLlegaCarrera()} delay={TA.carrera.flujo} id="carrera-viaje" color={AN.lima} />
    </Lienzo>
  );
};
