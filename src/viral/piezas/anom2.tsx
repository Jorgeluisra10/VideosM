/**
 * Ensayo «Anomalía» · escenas a medida 2/4
 *   anom-friccion    simulación multiagente (cápsulas con estelas estroboscópicas) sobre una malla de curvas de Bézier con nudos-semáforo;
 *                    tres potenciómetros (densidad, cruces, semáforos) que bajan la velocidad a 12 km/h y un mapa de calor de semitono rojo en cada nudo
 *   anom-continente  el duelo: flujos continuos (partículas lima sobre curvas azules, longitud ∝ km de metro) frente al vacío estructural de Bogotá (0 km)
 */
import React, { useMemo } from "react";
import { METRO_DATOS, METRO_KM, TA } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { Etiqueta, FUENTE, H, LineaCap, MONO, W, clamp, easeInOut, easeOut, lerp, mezclar, useReloj } from "../comun";
import { AN, Blancos, Capsula, Knob, Lienzo, Odometro, PuntosSemitono, Titular, bezierPor, muestrear } from "./anom-ui";

type P = { e: EscenaViralGuardada };

/* ───────────── anom-friccion ───────────── */

const COLS = 5, FILAS = 4;
type Muestra = { x: number; y: number; a: number; s: number };
type Carril = { dir: "H" | "V"; m: Muestra[]; total: number; nodos: { id: number; s: number }[]; d: string };

/** La malla: nudos con una leve irregularidad y carriles Bézier que pasan exactamente por ellos. */
function construirMalla(): { nodos: { x: number; y: number }[]; carriles: Carril[] } {
  const nodos = Array.from({ length: COLS * FILAS }, (_, i) => {
    const r = Math.floor(i / COLS), c = i % COLS;
    return { x: 185 + c * 177 + (azar(i * 3.1) - 0.5) * 34, y: 655 + r * 190 + (azar(i * 5.3 + 1) - 0.5) * 40 };
  });
  const carriles: Carril[] = [];
  const nodoEn = (r: number, c: number) => nodos[r * COLS + c];
  for (let r = 0; r < FILAS; r++) {
    const pts = [{ x: 104, y: nodoEn(r, 0).y + (azar(r + 9) - 0.5) * 30 }, ...Array.from({ length: COLS }, (_, c) => nodoEn(r, c)), { x: 976, y: nodoEn(r, COLS - 1).y + (azar(r + 19) - 0.5) * 30 }];
    carriles.push(crearCarril("H", pts, Array.from({ length: COLS }, (_, c) => ({ id: r * COLS + c, p: nodoEn(r, c) }))));
  }
  for (let c = 0; c < COLS; c++) {
    const pts = [{ x: nodoEn(0, c).x + (azar(c + 29) - 0.5) * 30, y: 580 }, ...Array.from({ length: FILAS }, (_, r) => nodoEn(r, c)), { x: nodoEn(FILAS - 1, c).x + (azar(c + 39) - 0.5) * 30, y: 1290 }];
    carriles.push(crearCarril("V", pts, Array.from({ length: FILAS }, (_, r) => ({ id: r * COLS + c, p: nodoEn(r, c) }))));
  }
  return { nodos, carriles };
}
function crearCarril(dir: "H" | "V", pts: { x: number; y: number }[], nodos: { id: number; p: { x: number; y: number } }[]): Carril {
  const m = muestrear(pts, 260);
  const ns = nodos.map((n) => {
    let mejor = 0, dmin = 1e9;
    m.forEach((q, i) => { const d = Math.hypot(q.x - n.p.x, q.y - n.p.y); if (d < dmin) { dmin = d; mejor = i; } });
    return { id: n.id, s: m[mejor].s };
  });
  return { dir, m, total: m[m.length - 1].s, nodos: ns, d: bezierPor(pts) };
}
const posEn = (c: Carril, s: number): Muestra => {
  const k = clamp(s / c.total) * (c.m.length - 1);
  const i = Math.min(c.m.length - 2, Math.floor(k));
  const u = k - i;
  const A = c.m[i], B = c.m[i + 1];
  return { x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u), a: A.a, s };
};

const AGENTES_POR_CARRIL = 5;
const SEG_SIM = 12;
const factorVel = (t: number): number => lerp(1, METRO_DATOS.velSuperficie / 28, easeInOut((t - TA.friccion.ini) / TA.friccion.dial));

/** Simulación determinista: nudos con semáforo (alternan H/V), agentes que se detienen en su línea de parada y hacen cola. Guarda posición por fotograma y calor por nudo. */
function simular(malla: ReturnType<typeof construirMalla>): { s: Float32Array[]; calor: Float32Array[] } {
  const FRAMES = SEG_SIM * 60 + 2;
  const dt = 1 / 60;
  const V0 = 150;
  const P = 2.3;
  const NN = malla.nodos.length;
  const agentes = malla.carriles.flatMap((c, ci) => Array.from({ length: AGENTES_POR_CARRIL }, (_, k) => ({ ci, s: ((k + azar(ci * 7 + k) * 0.5) / AGENTES_POR_CARRIL) * c.total })));
  const fase = Array.from({ length: NN }, (_, i) => azar(i * 4.7 + 2) * P * 2);
  const verde = (id: number, dir: "H" | "V", t: number): boolean => ((Math.floor((t + fase[id]) / P) % 2 === 0) === (dir === "H"));
  const sSalida: Float32Array[] = [];
  const calorSalida: Float32Array[] = [];
  const calor = new Float32Array(NN);
  const LIN = 20, GAP = 34;
  for (let f = 0; f < FRAMES; f++) {
    const t = f * dt;
    const v = V0 * factorVel(t);
    // por carril, de adelante hacia atrás
    for (let ci = 0; ci < malla.carriles.length; ci++) {
      const c = malla.carriles[ci];
      const del = agentes.filter((a) => a.ci === ci).sort((a, b) => b.s - a.s);
      for (let k = 0; k < del.length; k++) {
        const a = del[k];
        let ns = a.s + v * dt;
        let parado = false;
        for (const n of c.nodos) {
          const sp = n.s - LIN;
          if (a.s <= sp + 0.01 && ns > sp && !verde(n.id, c.dir, t)) { ns = sp; parado = true; calor[n.id] += dt; break; }
        }
        const adelante = del[k - 1];
        if (adelante && adelante.s > a.s && a.s + 1 < adelante.s) ns = Math.min(ns, adelante.s - GAP);
        if (ns < a.s) ns = a.s;
        if (parado || ns - a.s < v * dt * 0.5) {
          // en cola: también acumula calor en el nudo que espera
          const n = c.nodos.find((q) => q.s > a.s && q.s - a.s < 200);
          if (n && !parado) calor[n.id] += dt * 0.5;
        }
        a.s = ns;
        if (a.s >= c.total) a.s -= c.total;
      }
    }
    sSalida.push(Float32Array.from(agentes.map((a) => a.s)));
    calorSalida.push(Float32Array.from(calor));
  }
  return { s: sSalida, calor: calorSalida };
}

export const AnomFriccion: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { malla, sim } = useMemo(() => { const m = construirMalla(); return { malla: m, sim: simular(m) }; }, []);
  const fr = Math.min(sim.s.length - 1, f);
  const kmh = lerp(28, METRO_DATOS.velSuperficie, easeInOut((t - TA.friccion.ini) / TA.friccion.dial));
  const kn = (i: number): number => easeInOut((t - TA.friccion.knob[i]) / 2.0);
  const horas = METRO_DATOS.horasPerdidas * easeOut((t - TA.friccion.horas) / TA.friccion.horasDur);
  const apar = clamp((t - 0.2) / 0.6);
  const calorMax = 16;
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* mapa de calor en semitono rojo: crece en cada nudo con la espera acumulada */}
        {malla.nodos.map((n, i) => {
          const h = clamp(sim.calor[fr][i] / calorMax);
          if (h < 0.03) return null;
          const R = 20 + 52 * Math.sqrt(h);
          return <PuntosSemitono key={i} campo={(x, y) => 1 - Math.hypot(x - n.x, y - n.y) / R} x0={n.x - R} y0={n.y - R} w={R * 2} h={R * 2} paso={13} color={AN.rojo} rMax={7.2} opacidad={0.95} recorte={(x, y) => Math.hypot(x - n.x, y - n.y) < R} />;
        })}
        {/* carriles Bézier */}
        {malla.carriles.map((c, i) => <path key={i} d={c.d} fill="none" stroke={AN.azul} strokeWidth={3.2} strokeOpacity={0.85 * apar} />)}
        {/* nudos */}
        {malla.nodos.map((n, i) => <g key={i} opacity={apar}><circle cx={n.x} cy={n.y} r={9} fill={AN.marinoFondo} stroke={AN.azul} strokeWidth={3} /><circle cx={n.x} cy={n.y} r={3.4} fill={AN.blanco} /></g>)}
        {/* agentes: cápsulas lima con estela estroboscópica (copias de instantes anteriores) */}
        {malla.carriles.map((c, ci) =>
          Array.from({ length: AGENTES_POR_CARRIL }, (_, k) => {
            const idx = ci * AGENTES_POR_CARRIL + k;
            return [0, 1, 2, 3, 4].map((z) => {
              const ff = Math.max(0, fr - z * 5);
              const p = posEn(c, sim.s[ff][idx]);
              return <Capsula key={`${idx}-${z}`} x={p.x} y={p.y} ang={p.a} l={z === 0 ? 30 : 26} g={z === 0 ? 11 : 9} color={AN.lima} opacidad={apar * (z === 0 ? 1 : 0.5 - z * 0.09)} />;
            });
          }),
        )}
        {/* los tres potenciómetros: la tríada de variables */}
        <Knob cx={230} cy={1400} r={66} valor={0.12 + 0.8 * kn(0)} etiqueta="DENSIDAD" lectura={`${Math.round((0.12 + 0.8 * kn(0)) * 100)}`} aparece={clamp((t - 0.5) / 0.5)} />
        <Knob cx={540} cy={1400} r={66} valor={0.12 + 0.76 * kn(1)} etiqueta="CRUCES" lectura={`${Math.round((0.12 + 0.76 * kn(1)) * 100)}`} aparece={clamp((t - 0.7) / 0.5)} />
        <Knob cx={850} cy={1400} r={66} valor={0.12 + 0.82 * kn(2)} etiqueta="SEMÁFOROS" lectura={`${Math.round((0.12 + 0.82 * kn(2)) * 100)}`} aparece={clamp((t - 0.9) / 0.5)} />
      </svg>
      {e.cap && <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={AN.blanco} />}
      <Titular y={425} maxPx={96} lineas={[{ texto: "FRICCIÓN PURA", delay: 0.2 }]} id="titular-friccion" />
      <Odometro valor={kmh} x={300} y={1612} px={70} digitos={2} sufijo="km/h" id="friccion-vel" />
      <Odometro valor={horas} x={790} y={1612} px={70} digitos={3} sufijo="h/año" color={AN.rojo} id="friccion-horas" />
    </Lienzo>
  );
};

/* ───────────── anom-continente ───────────── */

const ESCALA_KM = 3.1;
const X_INI = 332;

export const AnomContinente: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const filas = useMemo(() => METRO_KM.map((c, i) => {
    const L = c.km * ESCALA_KM;
    const nP = Math.max(2, Math.round(L / 34) + 2);
    const pts = Array.from({ length: nP }, (_, k) => ({ x: X_INI + (L * k) / (nP - 1), y: (k % 2 ? -1 : 1) * 15 * (c.km > 0 ? 1 : 0) }));
    return { ...c, i, L, m: c.km > 0 ? muestrear(pts, 160) : [], d: c.km > 0 ? bezierPor(pts) : "", y: 648 + i * 112 };
  }), []);
  return (
    <Lienzo modo="marino">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {filas.map((fila) => {
          const ini = TA.continente.fila(fila.i);
          const k = easeOut((t - a(ini)) / a(TA.continente.filaDur));
          if (fila.km === 0) return <VacioBogota key="bog" y={fila.y} t={t} a={a} ini={ini} />;
          const nP = Math.max(3, Math.round(fila.L / 15));
          return (
            <g key={fila.i} transform={`translate(0 ${fila.y})`} opacity={clamp(k * 3)}>
              <path d={fila.d} fill="none" stroke={AN.azul} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
              <path d={fila.d} fill="none" stroke={AN.azul} strokeWidth={14} strokeOpacity={0.18} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
              {/* flujo continuo: partículas lima con estela que recorren la curva */}
              {k > 0.98 && Array.from({ length: nP }, (_, j) => {
                const ph = (j / nP + t * 0.32) % 1;
                return [0, 1, 2].map((z) => {
                  const q = fila.m[Math.min(fila.m.length - 1, Math.floor(clamp(ph - z * 0.012 / Math.max(0.2, fila.L / 440)) * (fila.m.length - 1)))];
                  return <circle key={`${j}-${z}`} cx={q.x} cy={q.y} r={z === 0 ? 5.4 : 4 - z} fill={AN.lima} opacity={z === 0 ? 1 : 0.45 - z * 0.12} />;
                });
              })}
              <circle cx={X_INI} cy={0} r={8} fill={AN.marinoFondo} stroke={AN.lima} strokeWidth={3} />
              <circle cx={X_INI + fila.L} cy={fila.m.length ? fila.m[fila.m.length - 1].y : 0} r={8} fill={AN.lima} />
            </g>
          );
        })}
      </svg>
      {e.cap && <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={AN.blanco} />}
      <Titular y={440} maxPx={104} lineas={[{ texto: "6 REDES", color: AN.blanco, delay: 0.15 }, { texto: "1 VACÍO", color: AN.rojo, delay: 0.5 }]} id="titular-continente" />
      {filas.map((fila) => {
        const ini = TA.continente.fila(fila.i);
        const k = easeOut((t - a(ini)) / a(TA.continente.filaDur));
        const bog = fila.km === 0;
        return (
          <React.Fragment key={fila.i}>
            <Etiqueta texto={fila.ciudad} x={118} y={fila.y} px={26} ancho={206} alinear="left" mono color={bog ? AN.rojo : AN.blanco} peso={700} mayus delay={ini} id="continente-ciudad" />
            <Odometro valor={fila.km * k} x={962} y={fila.y} px={46} digitos={3} sufijo="km" prefijo={fila.aprox ? "≈" : ""} alinear="right" color={bog ? AN.rojo : AN.lima} id="continente-km" opacidad={clamp(k * 4)} />
          </React.Fragment>
        );
      })}
      <Blancos x={118} y={1505} px={32} alinear="left" antes="RIELES EN BOGOTÁ = " valor="0" resuelve={TA.continente.vacio + 0.9} delay={TA.continente.vacio - 0.3} id="continente-blancos" color={AN.lima} />
      <div data-texto="continente-nota" style={{ position: "absolute", left: 118, top: 1566, width: W - 236, fontFamily: MONO, fontSize: 21, color: AN.blanco, opacity: 0.45 * clamp((t - a(TA.continente.vacio + 1.4)) / 0.6), lineHeight: 1.4 }}>km de metro en operación · ≈ aproximado, verificar cifras</div>
    </Lienzo>
  );
};

/** El vacío estructural: un disco de semitono rojo y un anillo punteado donde no hay red; una sola partícula da vueltas atrapada. */
const VacioBogota: React.FC<{ y: number; t: number; a: (x: number) => number; ini: number }> = ({ y, t, a, ini }) => {
  const k = easeOut((t - a(ini)) / a(1.4));
  const cx = X_INI + 70, R = 54;
  const puls = 1 + Math.sin(t * 3.2) * 0.04;
  return (
    <g transform={`translate(0 ${y})`} opacity={clamp(k * 2)}>
      <PuntosSemitono campo={(x, yy) => 1 - Math.hypot(x - cx, yy - y) / (R * 1.55)} x0={cx - R * 1.6} y0={y - R * 1.6} w={R * 3.2} h={R * 3.2} paso={11} color={AN.rojo} rMax={6} recorte={(x, yy) => Math.hypot(x - cx, yy - y) < R * 1.55 * puls} />
      <circle cx={cx} cy={0} r={R * 1.7} fill="none" stroke={AN.rojo} strokeWidth={3} strokeDasharray="4 11" strokeLinecap="round" />
      <circle cx={cx + Math.cos(t * 2.4) * R * 1.7} cy={Math.sin(t * 2.4) * R * 1.7} r={6} fill={AN.lima} />
      <line x1={cx + R * 2.0} x2={cx + R * 2.0 + 150} y1={0} y2={0} stroke={AN.rojo} strokeWidth={3} strokeDasharray="3 12" strokeLinecap="round" opacity={0.7} />
    </g>
  );
};
