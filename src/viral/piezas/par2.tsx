/**
 * «La regla del 37 %» (parada óptima · IMNOBA) · escenas 2/2
 *   par-regla   observa el 37 % sin elegir (el estándar sube hasta el mejor visto) y elige la primera que lo supere
 *   par-curva   probabilidad exacta de elegir a la mejor según cuántas rechazas: pico de 37,1 % en el 37 %
 *   par-simula  10.000 búsquedas simuladas de 100 opciones: ≈ 37 % de aciertos frente al 1 % de elegir a ciegas
 *   par-aplica  cuántas observar con 10, 20 y 100 opciones (3, 7 y 37)
 */
import React, { useMemo } from "react";
import { PAR, TPA, kOptimo, mulberry32, probParada, secRegla, simularParada } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Odometro, Titular } from "./anom-ui";
import { Etq, Fila, GEO, IM, LienzoIM, VisorFila, barrido, xCap } from "./par-ui";
import { Fuente } from "./real1";

type P = { e: EscenaViralGuardada };

/* ───────────── par-regla ───────────── */

export const ParRegla: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const v = useMemo(secRegla, []);
  const YB = 1090, ALTO = 380, K = PAR.k, iM = PAR.regla.mejorEn;
  const fase2 = t >= a(TPA.regla.sigue);
  const idx = fase2 ? barrido(t, a(TPA.regla.sigue), a(TPA.regla.sigueDur), K - 1, iM, true) : barrido(t, a(TPA.regla.obs), a(TPA.regla.obsDur), 0, K - 1);
  const elegida = t >= a(TPA.regla.elige);
  const iV = Math.min(99, Math.floor(idx));
  // estándar = el mejor de lo visto en la fase de observación
  let M = 0;
  for (let i = 0; i <= Math.min(K - 1, iV); i++) M = Math.max(M, v[i]);
  const yL = YB - (ALTO * M) / 100;
  const zonas = clamp((t - a(TPA.regla.zonas)) / 0.5);
  const xK = GEO.x0 + (GEO.ancho * K) / 100;
  const sElige = spr(f, a(TPA.regla.elige), { damping: 11, stiffness: 190, mass: 0.6 });
  const empezo = t >= a(TPA.regla.obs);
  return (
    <LienzoIM>
      <svg width={W} height={1920} viewBox={`0 0 ${W} 1920`} style={{ position: "absolute", inset: 0 }}>
        <Fila valores={v} yBase={YB} alto={ALTO} ejes est={(i) => {
          const rev = empezo ? clamp(idx - i + 1) : 0;
          if (i === iM && elegida) return { rev: 1, color: IM.amarillo, brillo: sElige };
          return { rev, op: i < K ? 0.75 : 0.5 };
        }} />
        {M > 0 && <line x1={GEO.x0 - 10} x2={GEO.x0 + GEO.ancho + 10} y1={yL} y2={yL} stroke={IM.luz} strokeWidth={3} strokeDasharray="14 10" strokeDashoffset={-t * 36} opacity={0.8 + 0.15 * Math.sin(t * 5)} />}
        {empezo && <VisorFila idx={Math.min(idx, 99)} n={100} yBase={YB} alto={ALTO} color={elegida ? IM.amarillo : IM.tele} />}
        {/* zonas: observar (azul claro) y elegir (amarillo) */}
        <g opacity={zonas}>
          <line x1={GEO.x0} x2={xK - 4} y1={YB + 92} y2={YB + 92} stroke={IM.tele} strokeWidth={10} strokeLinecap="round" />
          <line x1={xK + 4} x2={GEO.x0 + GEO.ancho} y1={YB + 92} y2={YB + 92} stroke={IM.amarillo} strokeWidth={10} strokeLinecap="round" />
          <line x1={xK} x2={xK} y1={YB - ALTO - 30} y2={YB + 110} stroke="#fff" strokeOpacity={0.55} strokeWidth={2} strokeDasharray="6 8" />
        </g>
      </svg>
      <Titular lineas={[{ texto: "PRIMERO, CALIBRA", color: IM.blanco, delay: 0.1 }, { texto: "LUEGO, ELIGE", color: IM.amarillo, delay: 0.35 }]} y={450} maxPx={110} minPx={66} id="par-titulo" color={IM.blanco} />
      <Etq texto="estándar = el mejor de lo que ya viste" x={W / 2} y={612} px={26} op={clamp((t - 1.2) / 0.5)} id="par-sub" />
      <Etq texto="OBSERVAS · NO ELIGES" x={GEO.x0} y={YB + 138} px={24} alinear="left" op={zonas} id="par-z1" />
      <Etq texto="ELIGE LA 1.ª MEJOR" x={GEO.x0 + GEO.ancho} y={YB + 138} px={24} color={IM.amarillo} alinear="right" op={zonas} id="par-z2" />
      {M > 0 && <Etq texto={`ESTÁNDAR ${M}`} x={GEO.x0 + GEO.ancho} y={yL - 28} px={24} color={IM.luz} alinear="right" op={0.95} id="par-std" />}
      <Odometro valor={empezo ? K * easeOut((t - a(TPA.regla.obs)) / a(1.4)) : 0} x={100} y={1370} px={104} digitos={2} color={IM.tele} sufijo="%" alinear="left" id="par-37" opacidad={empezo ? 1 : 0.2} />
      <Etq texto="RECHAZAS SIN MIRAR ATRÁS" x={100} y={1462} px={24} alinear="left" op={empezo ? 1 : 0} id="par-37-etq" />
      <Odometro valor={elegida ? 100 * easeOut((t - a(TPA.regla.elige)) / a(0.7)) : 0} x={980} y={1370} px={104} digitos={3} color={IM.amarillo} alinear="right" id="par-elegida" opacidad={elegida ? 1 : 0.2} />
      <Etq texto={`ELEGIDA · #${iM + 1}`} x={980} y={1462} px={24} color={IM.amarillo} alinear="right" op={elegida ? 1 : 0} id="par-elegida-etq" />
    </LienzoIM>
  );
};

/* ───────────── par-curva ───────────── */

export const ParCurva: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const X0 = 170, GW = 780, YB = 1180, GH = 520, YMAX = 0.4;
  const px = (k: number): number => X0 + (GW * k) / 100;
  const py = (p: number): number => YB - (GH * p) / YMAX;
  const pts = useMemo(() => Array.from({ length: 100 }, (_, k) => probParada(PAR.n, k)), []);
  const kBarrido = barrido(t, a(TPA.curva.ini), a(TPA.curva.dur), 0, 99);
  const kVuelve = t >= a(TPA.curva.vuelve) ? lerp(99, PAR.k, easeInOut((t - a(TPA.curva.vuelve)) / a(TPA.curva.vuelveDur))) : kBarrido;
  const kMarca = kVuelve;
  const kCurva = t >= a(TPA.curva.vuelve) ? 99 : kBarrido;
  const trazo = (hasta: number): string => {
    const n = Math.floor(hasta);
    let d = "";
    for (let k = 0; k <= n; k++) d += `${k ? "L" : "M"} ${px(k).toFixed(1)} ${py(pts[k]).toFixed(1)} `;
    if (hasta > n && n < 99) d += `L ${px(hasta).toFixed(1)} ${py(lerp(pts[n], pts[n + 1], hasta - n)).toFixed(1)}`;
    return d;
  };
  const kI = Math.min(99, Math.max(0, kMarca));
  const pMarca = lerp(pts[Math.floor(kI)], pts[Math.min(99, Math.floor(kI) + 1)], kI - Math.floor(kI));
  const pico = t >= a(TPA.curva.pico);
  const ring = pico ? (t - a(TPA.curva.pico)) % 1.2 : 0;
  const empezo = t >= a(TPA.curva.ini);
  return (
    <LienzoIM>
      <svg width={W} height={1920} viewBox={`0 0 ${W} 1920`} style={{ position: "absolute", inset: 0 }}>
        {/* ejes y retícula */}
        {[0, 0.1, 0.2, 0.3, 0.4].map((p) => (
          <g key={p}>
            <line x1={X0} x2={X0 + GW} y1={py(p)} y2={py(p)} stroke="#fff" strokeOpacity={p === 0 ? 0.55 : 0.12} strokeWidth={p === 0 ? 2.5 : 1.5} />
            <text x={X0 - 18} y={py(p) + 8} textAnchor="end" fontFamily="'JetBrains Mono', monospace" fontWeight={700} fontSize={24} fill={IM.tele} fillOpacity={0.85}>{Math.round(p * 100)}%</text>
          </g>
        ))}
        {[0, 25, 50, 75, 100].map((k) => (
          <g key={k}>
            <line x1={px(k)} x2={px(k)} y1={YB} y2={YB + 12} stroke={IM.tele} strokeWidth={2} />
            <text x={px(k)} y={YB + 44} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={700} fontSize={24} fill={IM.tele} fillOpacity={0.85}>{k}</text>
          </g>
        ))}
        {empezo && <path d={`${trazo(kCurva)} L ${px(Math.min(99, kCurva)).toFixed(1)} ${YB} L ${px(0)} ${YB} Z`} fill={IM.amarillo} opacity={0.1} />}
        {empezo && <path d={trazo(kCurva)} fill="none" stroke={IM.amarillo} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />}
        {empezo && <line x1={px(kI)} x2={px(kI)} y1={py(pMarca)} y2={YB} stroke={IM.luz} strokeWidth={2.5} strokeDasharray="8 8" opacity={0.8} />}
        {empezo && <circle cx={px(kI)} cy={py(pMarca)} r={13} fill={IM.amarillo} stroke={IM.profundo} strokeWidth={4} />}
        {pico && <circle cx={px(PAR.k)} cy={py(pts[PAR.k])} r={13 + ring * 70} fill="none" stroke={IM.amarillo} strokeWidth={4} opacity={1 - ring / 1.2} />}
      </svg>
      <Titular lineas={[{ texto: "LA CURVA", color: IM.blanco, delay: 0.1 }, { texto: "TIENE UN PICO", color: IM.amarillo, delay: 0.35 }]} y={450} maxPx={112} minPx={66} id="par-titulo" color={IM.blanco} />
      <Etq texto="% de opciones que observas antes de elegir" x={W / 2} y={YB + 100} px={24} id="par-x" />
      <Etq texto="probabilidad de elegir a la mejor" x={X0} y={YB - GH - 76} px={24} alinear="left" id="par-y" />
      <Etq texto="ELEGIR LA 1.ª = 1 %" x={X0} y={YB + 160} px={24} color={IM.rojo} alinear="left" op={clamp((t - a(TPA.curva.vuelve - 0.4)) / 0.5)} id="par-ini" />
      <Etq texto="ESPERAR AL FINAL ≈ 1 %" x={X0 + GW} y={YB + 160} px={24} color={IM.rojo} alinear="right" op={clamp((t - a(TPA.curva.vuelve - 0.4)) / 0.5)} id="par-fin" />
      {pico && <Etq texto={`PICO · ${PAR.k}`} x={px(PAR.k) + 26} y={py(pts[PAR.k]) - 46} px={28} alinear="left" color={IM.luz} op={clamp((t - a(TPA.curva.pico)) / 0.3)} peso={800} id="par-pico" />}
      <Odometro valor={empezo ? Math.round(pMarca * 1000) / 10 : 0} x={W / 2} y={1470} px={112} digitos={3} decimales={1} color={IM.amarillo} sufijo="%" id="par-prob" opacidad={empezo ? 1 : 0.2} />
      <Etq texto="PROBABILIDAD DE ACERTAR" x={W / 2} y={1562} px={24} op={empezo ? 1 : 0} id="par-prob-etq" />
      <Fuente texto={`Cálculo exacto: P(k) = (k/n)·Σ 1/j, con n = ${PAR.n} · ${PAR.fuente}`} y={1625} delay={TPA.curva.vuelve} />
    </LienzoIM>
  );
};

/* ───────────── par-simula ───────────── */

export const ParSimula: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const sim = useMemo(() => simularParada(PAR.n, PAR.k, PAR.sim.intentos, PAR.sim.semilla), []);
  const m = PAR.sim.intentos * clamp((t - a(TPA.simula.cuenta)) / a(TPA.simula.cuentaDur));
  const j = Math.min(100, Math.floor(m / 100));
  const pct = j === 0 ? 0 : (sim.acum[j] / (100 * j)) * 100;
  const final = t >= a(TPA.simula.cuenta + TPA.simula.cuentaDur);
  const R = 19, PASO = 56, X0 = W / 2 - (PASO * 9) / 2, Y0 = 740;
  return (
    <LienzoIM>
      <svg width={W} height={1920} viewBox={`0 0 ${W} 1920`} style={{ position: "absolute", inset: 0 }}>
        {sim.primeros.map((ok, i) => {
          const s = clamp((t - a(TPA.simula.puntos) - i * 0.024) / 0.3);
          return <circle key={i} cx={X0 + (i % 10) * PASO} cy={Y0 + Math.floor(i / 10) * PASO} r={Math.max(1, R * easeOut(s) * (1 + (ok ? 0.07 : 0.03) * Math.sin(t * 4 + i * 0.7)))} fill={ok ? IM.amarillo : IM.oculta} opacity={ok ? 1 : 0.85} />;
        })}
      </svg>
      <Titular lineas={[{ texto: "10.000 BÚSQUEDAS", color: IM.blanco, delay: 0.1 }]} y={440} maxPx={112} minPx={64} id="par-titulo" color={IM.blanco} />
      <Odometro valor={m} x={W / 2} y={590} px={60} digitos={5} color={IM.tele} sufijo="intentos" id="par-m" opacidad={clamp((t - a(TPA.simula.cuenta - 0.4)) / 0.4)} />
      <Etq texto="cada punto = una búsqueda de 100 opciones" x={W / 2} y={1318} px={24} op={clamp((t - 1.5) / 0.5)} id="par-leyenda" />
      <Odometro valor={pct} x={100} y={1430} px={104} digitos={3} decimales={1} color={IM.amarillo} sufijo="%" alinear="left" id="par-regla" opacidad={t >= a(TPA.simula.cuenta) ? 1 : 0.2} />
      <Etq texto="CON LA REGLA DEL 37 %" x={100} y={1522} px={24} color={IM.amarillo} alinear="left" op={t >= a(TPA.simula.cuenta) ? 1 : 0} id="par-regla-etq" />
      <Odometro valor={final ? 1 : 0} x={980} y={1430} px={104} digitos={1} color={IM.blanco} sufijo="%" alinear="right" id="par-azar" opacidad={final ? 1 : 0.2} />
      <Etq texto="A CIEGAS (1 DE 100)" x={980} y={1522} px={24} alinear="right" op={final ? 1 : 0} id="par-azar-etq" />
      <Fuente texto={`Simulación propia: ${PAR.sim.intentos.toLocaleString("es-CO")} intentos, semilla fija ${PAR.sim.semilla} · valor teórico ${(probParada(PAR.n, PAR.k) * 100).toFixed(1).replace(".", ",")} %`} y={1596} delay={TPA.simula.final} />
    </LienzoIM>
  );
};

/* ───────────── par-aplica ───────────── */

const FILAS = [10, 20, 100] as const;

export const ParAplica: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const filas = useMemo(() => FILAS.map((n, j) => {
    const r = mulberry32(31 + j);
    const v = Array.from({ length: n }, (_, i) => i + 1);
    for (let i = n - 1; i > 0; i--) { const q = Math.floor(r() * (i + 1)); const x = v[i]; v[i] = v[q]; v[q] = x; }
    return { n, k: kOptimo(n), v };
  }), []);
  const YS = [800, 1050, 1300], ALTO = 150;
  return (
    <LienzoIM>
      <svg width={W} height={1920} viewBox={`0 0 ${W} 1920`} style={{ position: "absolute", inset: 0 }}>
        {filas.map((fl, j) => {
          const t0 = TPA.aplica.fila(j);
          const s = spr(f, a(t0), { damping: 14, stiffness: 130, mass: 0.7 });
          const marca = clamp((t - a(t0 + 1.0)) / 0.5);
          const xk = GEO.x0 + (GEO.ancho * fl.k) / fl.n;
          return (
            <g key={fl.n} opacity={clamp(s * 2)}>
              <Fila valores={fl.v} yBase={YS[j]} alto={ALTO} est={(i) => (i < fl.k ? { rev: 1, color: IM.tele, op: 0.55 + 0.45 * marca } : { rev: 1, color: IM.amarillo, op: 0.9 })} />
              <line x1={GEO.x0} x2={xk} y1={YS[j] + 34} y2={YS[j] + 34} stroke={IM.tele} strokeWidth={6} strokeLinecap="round" opacity={marca} />
            </g>
          );
        })}
      </svg>
      <Titular lineas={[{ texto: "¿CUÁNTAS", color: IM.blanco, delay: 0.1 }, { texto: "MIRAR ANTES?", color: IM.amarillo, delay: 0.35 }]} y={450} maxPx={116} minPx={66} id="par-titulo" color={IM.blanco} />
      {filas.map((fl, j) => (
        <React.Fragment key={fl.n}>
          <Etq texto={`${fl.n} OPCIONES`} x={GEO.x0} y={YS[j] - ALTO - 40} px={26} color={IM.blanco} alinear="left" op={clamp((t - a(TPA.aplica.fila(j))) / 0.4)} id={`par-n${j}`} />
          <Etq texto={`MIRA LAS PRIMERAS ${fl.k}`} x={GEO.x0 + GEO.ancho} y={YS[j] - ALTO - 40} px={26} color={IM.tele} alinear="right" peso={800} op={clamp((t - a(TPA.aplica.fila(j) + 1.0)) / 0.4)} id={`par-k${j}`} />
        </React.Fragment>
      ))}
      <Etq texto="después, decide sin mirar atrás" x={W / 2} y={1490} px={38} color={IM.amarillo} peso={800} op={clamp((t - a(TPA.aplica.decide)) / 0.4)} id="par-decide" />
      <Etq texto="supuestos: orden al azar · sin volver atrás · buscas LA mejor" x={W / 2} y={1570} px={22} ancho={840} op={clamp((t - a(TPA.aplica.decide + 0.4)) / 0.5) * 0.85} id="par-supuestos" />
    </LienzoIM>
  );
};
