/**
 * «La regla del 37 %» (IMNOBA · figuras realistas) · escenas 2/2
 *   par-curva      probabilidad exacta de elegir a la mejor según cuántas rechazas: pico de 37,1 % en el 37
 *   par-simula     10.000 búsquedas simuladas de 100 casas: ≈ 36–37 % de aciertos frente al 1 % de elegir a ciegas
 *   par-aplica     cuántas casas mirar con 10 y 20, y por tiempo: 37 % de 90 días = 33
 *   par-supuestos  los tres supuestos del modelo: orden al azar (dado), sin volver atrás (señal) y buscas la mejor (copa)
 */
import React, { useMemo } from "react";
import { PAR, TPA, kOptimo, probParada, simularParada } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Estudio, FONT, Frases, MONOF, RE, Reflejo } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { Copa, Dado, MiniCasa, SenalUnica } from "./par-kit";

type P = { e: EscenaViralGuardada };

const barrido = (t: number, ini: number, dur: number, desde: number, hasta: number): number => desde + (hasta - desde) * clamp((t - ini) / Math.max(0.0001, dur));

/* ───────────── par-curva ───────────── */

export const ParCurva: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const X0 = 170, GW = 780, YB = 1180, GH = 520, YMAX = 0.4;
  const px = (k: number): number => X0 + (GW * k) / 100;
  const py = (p: number): number => YB - (GH * p) / YMAX;
  const pts = useMemo(() => Array.from({ length: 100 }, (_, k) => probParada(PAR.n, k)), []);
  const kBarrido = barrido(t, a(TPA.curva.ini), a(TPA.curva.dur), 0, 99);
  const vuelve = t >= a(TPA.curva.vuelve);
  const kMarca = vuelve ? lerp(99, PAR.k, easeInOut((t - a(TPA.curva.vuelve)) / a(TPA.curva.vuelveDur))) : kBarrido;
  const kCurva = vuelve ? 99 : kBarrido;
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
  const fin = clamp((t - a(TPA.curva.vuelve - 0.4)) / 0.5);
  return (
    <Estudio piso={1330} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <rect x={X0 - 70} y={py(YMAX) - 40} width={GW + 110} height={GH + 150} rx={26} fill="#0C1A2A" fillOpacity={0.55} stroke="#BFE0FF" strokeOpacity={0.2} strokeWidth={2} />
        {[0, 0.1, 0.2, 0.3, 0.4].map((p) => (
          <g key={p}>
            <line x1={X0} x2={X0 + GW} y1={py(p)} y2={py(p)} stroke="#fff" strokeOpacity={p === 0 ? 0.55 : 0.12} strokeWidth={p === 0 ? 2.5 : 1.5} />
            <text x={X0 - 14} y={py(p) + 8} textAnchor="end" fontFamily={MONOF} fontWeight={700} fontSize={24} fill={RE.hielo} fillOpacity={0.85}>{Math.round(p * 100)}%</text>
          </g>
        ))}
        {[0, 25, 50, 75, 100].map((k) => (
          <g key={k}>
            <line x1={px(k)} x2={px(k)} y1={YB} y2={YB + 12} stroke={RE.hielo} strokeWidth={2} />
            <text x={px(k)} y={YB + 44} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={24} fill={RE.hielo} fillOpacity={0.85}>{k}</text>
          </g>
        ))}
        {empezo && <path d={`${trazo(kCurva)} L ${px(Math.min(99, kCurva)).toFixed(1)} ${YB} L ${px(0)} ${YB} Z`} fill={RE.oro} opacity={0.12} />}
        {empezo && <path d={trazo(kCurva)} fill="none" stroke={RE.oro} strokeOpacity={0.3} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />}
        {empezo && <path d={trazo(kCurva)} fill="none" stroke={RE.oro} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />}
        {empezo && <line x1={px(kI)} x2={px(kI)} y1={py(pMarca)} y2={YB} stroke="#FFE27A" strokeWidth={2.5} strokeDasharray="8 8" opacity={0.8} />}
        {empezo && <circle cx={px(kI)} cy={py(pMarca)} r={14} fill={RE.oro} stroke="#0B1828" strokeWidth={4} />}
        {pico && <circle cx={px(PAR.k)} cy={py(pts[PAR.k])} r={14 + ring * 70} fill="none" stroke={RE.oro} strokeWidth={4} opacity={1 - ring / 1.2} />}
        {/* extremos: elegir la primera o esperar al final */}
        <g opacity={fin}>
          <MiniCasa x={px(0) + 40} y={YB - 8} s={0.45} color={RE.rojo} />
          <MiniCasa x={px(99) - 40} y={YB - 8} s={0.45} color={RE.rojo} />
        </g>
      </svg>
      <Frases frases={[{ t: 0.3, texto: "¿por qué 37?", px: 124, color: RE.oro }, { t: TPA.curva.vuelve, texto: "el punto más alto", px: 92 }]} y={420} />
      <div data-texto="curva-y" style={{ position: "absolute", left: X0, top: py(YMAX) - 18, fontFamily: MONOF, fontWeight: 700, fontSize: 24, color: RE.hielo, opacity: 0.9 }}>probabilidad de elegir la mejor</div>
      <div data-texto="curva-x" style={{ position: "absolute", left: X0, width: GW, top: YB + 76, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 24, color: RE.hielo, opacity: 0.9 }}>% de casas que miras antes de elegir</div>
      <div data-texto="curva-ini" style={{ position: "absolute", left: X0 + 16, top: YB + 124, fontFamily: MONOF, fontWeight: 700, fontSize: 24, color: RE.rojo, opacity: fin }}>1.ª casa = 1 %</div>
      <div data-texto="curva-fin" style={{ position: "absolute", left: X0, width: GW, top: YB + 124, textAlign: "right", fontFamily: MONOF, fontWeight: 700, fontSize: 24, color: RE.rojo, opacity: fin }}>esperar al final ≈ 1 %</div>
      {pico && <Chip texto={`PICO · ${PAR.k}`} x={px(PAR.k) + 300} y={py(pts[PAR.k]) - 6} color="#FFE27A" opacidad={clamp((t - a(TPA.curva.pico)) / 0.3)} id="curva-pico" ancho={260} />}
      <Dato valor={empezo ? Math.round(pMarca * 1000) / 10 : 0} x={W / 2} y={1500} px={116} digitos={3} decimales={1} sufijo="%" id="curva-prob" opacidad={empezo ? 1 : 0.2} />
      <Fuente texto={`Cálculo exacto: P(k) = (k/n)·Σ 1/j, con n = ${PAR.n} · ${PAR.fuente}`} y={1618} delay={TPA.curva.vuelve} />
    </Estudio>
  );
};

/* ───────────── par-simula ───────────── */

export const ParSimula: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const sim = useMemo(() => simularParada(PAR.n, PAR.k, PAR.sim.intentos, PAR.sim.semilla), []);
  const m = PAR.sim.intentos * clamp((t - a(TPA.simula.cuenta)) / a(TPA.simula.cuentaDur));
  const j = Math.min(100, Math.floor(m / 100));
  const pct = j === 0 ? 0 : (sim.acum[j] / (100 * j)) * 100;
  const final = t >= a(TPA.simula.cuenta + TPA.simula.cuentaDur);
  return (
    <Estudio piso={1330} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {sim.primeros.map((ok, i) => {
          const s = spr(f, a(TPA.simula.puntos + i * 0.026), { damping: 13, stiffness: 150, mass: 0.7 });
          const pulso = 1 + (ok ? 0.05 : 0.02) * Math.sin(t * 4 + i * 0.7);
          return <MiniCasa key={i} x={260 + (i % 10) * 70} y={760 + Math.floor(i / 10) * 64} s={0.62 * clamp(s) * pulso} color={ok ? RE.oro : "#3E629C"} op={ok ? 1 : 0.8} brillo={ok ? 1 : 0} />;
        })}
      </svg>
      <Frases frases={[{ t: 0.3, texto: "10.000 búsquedas", px: 104 }, { t: TPA.simula.cuenta, texto: "de 100 casas", px: 96, color: RE.oro }]} y={420} />
      <Dato valor={m} x={W / 2} y={590} px={60} digitos={5} sufijo="búsquedas" color={RE.hielo} id="sim-m" opacidad={clamp((t - a(TPA.simula.cuenta - 0.4)) / 0.4)} />
      <Dato valor={pct} x={W / 2 - 230} y={1440} px={104} digitos={3} decimales={1} sufijo="%" id="sim-regla" opacidad={t >= a(TPA.simula.cuenta) ? 1 : 0.2} />
      <Dato valor={final ? 1 : 0} x={W / 2 + 290} y={1440} px={104} digitos={1} sufijo="%" color={RE.blanco} id="sim-azar" opacidad={final ? 1 : 0.2} />
      <div data-texto="sim-regla-etq" style={{ position: "absolute", left: 100, width: 420, top: 1520, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 30, color: RE.oro, opacity: t >= a(TPA.simula.cuenta) ? 1 : 0 }}>con la regla del 37 %</div>
      <div data-texto="sim-azar-etq" style={{ position: "absolute", left: 600, width: 380, top: 1520, textAlign: "center", fontFamily: FONT, fontWeight: 700, fontSize: 30, color: RE.blanco, opacity: final ? 1 : 0 }}>a ciegas (1 de 100)</div>
      <Fuente texto={`Simulación propia: ${PAR.sim.intentos.toLocaleString("es-CO")} intentos, semilla fija ${PAR.sim.semilla} (cada casa = una búsqueda; dorada = acierto) · valor teórico ${(probParada(PAR.n, PAR.k) * 100).toFixed(1).replace(".", ",")} %`} y={1596} delay={TPA.simula.final} />
    </Estudio>
  );
};

/* ───────────── par-aplica ───────────── */

export const ParAplica: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const filas = [{ n: 10, y: 850, t0: TPA.aplica.f1, pitch: 88, s: 1.05 }, { n: 20, y: 1120, t0: TPA.aplica.f2, pitch: 44, s: 0.54 }] as const;
  const sCal = spr(f, a(TPA.aplica.cal), { damping: 14, stiffness: 130, mass: 0.7 });
  const llenado = clamp((t - a(TPA.aplica.cal + 0.4)) / a(TPA.aplica.calDur));
  const observa = Math.round(PAR.plazo * 0.37);
  return (
    <Estudio piso={1380} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {filas.map((fl) => {
          const k = kOptimo(fl.n);
          const s = spr(f, a(fl.t0), { damping: 14, stiffness: 130, mass: 0.7 });
          const marca = clamp((t - a(fl.t0 + 0.9)) / 0.5);
          return (
            <g key={fl.n} opacity={clamp(s * 2)}>
              {Array.from({ length: fl.n }, (_, i) => <MiniCasa key={i} x={100 + fl.pitch * (i + 0.5)} y={fl.y} s={fl.s} color={i < k ? (marca > 0 ? RE.hielo : RE.oro) : RE.oro} op={i < k && marca > 0 ? 0.65 + 0.35 * marca : 1} />)}
              <line x1={100} x2={100 + fl.pitch * k} y1={fl.y + 34} y2={fl.y + 34} stroke={RE.hielo} strokeWidth={8} strokeLinecap="round" opacity={marca} />
            </g>
          );
        })}
        {/* calendario de 90 días: 3 filas de 30 */}
        <g opacity={clamp(sCal * 2)}>
          {Array.from({ length: PAR.plazo }, (_, d) => {
            const fila = Math.floor(d / 30), col = d % 30;
            const lleno = d < llenado * PAR.plazo;
            const col37 = d < observa;
            return <rect key={d} x={106 + col * 29} y={1336 + fila * 36} width={24} height={28} rx={4} fill={lleno ? (col37 ? RE.hielo : RE.oro) : "#1B3A5C"} opacity={lleno ? 1 : 0.7} />;
          })}
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "¿cuántas casas\nmirar antes?", px: 90 }, { t: TPA.aplica.cal - 0.2, texto: "¿o cuántos días?", px: 96, color: RE.oro }]} y={420} />
      {filas.map((fl) => (
        <React.Fragment key={fl.n}>
          <div data-texto={`ap-n${fl.n}`} style={{ position: "absolute", left: 100, top: fl.y - 130, fontFamily: FONT, fontWeight: 800, fontSize: 38, color: RE.blanco, opacity: clamp((t - a(fl.t0)) / 0.4) }}>{fl.n} casas</div>
          <div data-texto={`ap-k${fl.n}`} style={{ position: "absolute", left: 100, width: W - 200, textAlign: "right", top: fl.y - 130, fontFamily: FONT, fontWeight: 800, fontSize: 38, color: RE.hielo, opacity: clamp((t - a(fl.t0 + 0.9)) / 0.4) }}>mira {kOptimo(fl.n)}</div>
        </React.Fragment>
      ))}
      <div data-texto="ap-dias" style={{ position: "absolute", left: 100, top: 1272, fontFamily: FONT, fontWeight: 800, fontSize: 38, color: RE.blanco, opacity: clamp((t - a(TPA.aplica.cal)) / 0.4) }}>{PAR.plazo} días</div>
      <div data-texto="ap-dias-k" style={{ position: "absolute", left: 100, width: W - 200, textAlign: "right", top: 1272, fontFamily: FONT, fontWeight: 800, fontSize: 38, color: RE.hielo, opacity: clamp((t - a(TPA.aplica.cal + 1.2)) / 0.4) }}>observa {observa}</div>
      <div data-texto="ap-nota" style={{ position: "absolute", left: 100, width: W - 200, top: 1480, textAlign: "left", fontFamily: MONOF, fontWeight: 700, fontSize: 24, color: RE.hielo, opacity: 0.85 * clamp((t - a(TPA.aplica.nota)) / 0.5) }}>por tiempo: sirve si las casas aparecen a un ritmo parejo · 37 % de 90 días ≈ 33</div>
    </Estudio>
  );
};

/* ───────────── par-supuestos ───────────── */

const TARJETAS = [
  { titulo: "ORDEN\nAL AZAR" },
  { titulo: "SIN VOLVER\nATRÁS" },
  { titulo: "BUSCAS\nLA MEJOR" },
] as const;

export const ParSupuestos: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const X = [215, 540, 865];
  const final = spr(f, a(TPA.supuestos.final), { damping: 11, stiffness: 190, mass: 0.6 });
  return (
    <Estudio piso={1330} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {TARJETAS.map((c, i) => {
          const s = spr(f, a(TPA.supuestos.c(i)), { damping: 13, stiffness: 140, mass: 0.7 });
          return (
            <g key={i} opacity={clamp(s * 2)} transform={`translate(0 ${(1 - s) * 34})`}>
              <rect x={X[i] - 130} y={600} width={260} height={640} rx={28} fill="#0C1A2A" fillOpacity={0.62} stroke={RE.hielo} strokeOpacity={0.3} strokeWidth={2.5} />
              {i === 0 && <Dado x={X[i] - 24} y={1010} s={1.2} giro={Math.sin(t * 2.4) * 5} />}
              {i === 1 && <SenalUnica x={X[i]} y={1060} s={0.82} />}
              {i === 2 && <Copa x={X[i]} y={1050} s={1.0} />}
            </g>
          );
        })}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "ojo: es un modelo", px: 104, color: RE.oro }]} y={420} />
      {TARJETAS.map((c, i) => (
        <div key={i} data-texto={`sup-${i}`} style={{ position: "absolute", left: X[i] - 120, width: 240, top: 1110, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 34, lineHeight: 1.15, color: RE.blanco, whiteSpace: "pre", opacity: clamp((t - a(TPA.supuestos.c(i) + 0.3)) / 0.4) }}>{c.titulo}</div>
      ))}
      <div data-texto="sup-final" style={{ position: "absolute", left: 0, width: W, top: 1420, display: "flex", justifyContent: "center", opacity: clamp(final * 2), transform: `scale(${0.8 + 0.2 * final})` }}>
        <span style={{ padding: "16px 44px", borderRadius: 999, background: RE.oro, color: "#0B1828", fontFamily: FONT, fontWeight: 900, fontSize: 50, letterSpacing: "-0.01em" }}>MÉTODO, NO GARANTÍA</span>
      </div>
    </Estudio>
  );
};
