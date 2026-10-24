/**
 * Piloto «Metro de Bogotá» · escenas a medida 1/4 (acto 1: el cuello de botella en un solo plano)
 *   metro-plano     ocho millones de personas caen sobre una sola capa; las otras dos capas de la ciudad, vacías
 *   metro-friccion  buses articulados que se frenan con cada semáforo, el dial que cae a 12 km/h y las 100 horas perdidas (≈ 4 días)
 *   metro-rieles    comparativa de kilómetros de metro: rieles que crecen con su tren, y el vacío de Bogotá
 * Rojo = el sistema de superficie (la anomalía), lima = datos, azul = lo que cambia (el metro).
 */
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { azar } from "../../lib/anim";
import { METRO_DATOS, METRO_KM, TP } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { Etiqueta, FUENTE, H, LineaCap, MONO, TextoCinetico, W, clamp, easeInOut, easeOut, fmtNum, lerp, mezclar, oscurecer, polarXY, spr, useReloj, useViral } from "../comun";

type P = { e: EscenaViralGuardada };

/** Cabecera común: línea mono que se escribe sola y titular pesado. */
export const Cabecera: React.FC<{ e: EscenaViralGuardada; maxPx?: number; lineas?: number; yTitulo?: number }> = ({ e, maxPx = 96, lineas = 2, yTitulo = 400 }) => (
  <>
    {e.cap && <LineaCap texto={e.cap} y={292} px={30} delay={0.1} id="cap-pieza" />}
    {e.h && <TextoCinetico texto={e.h} destacada={e.w} y={yTitulo} maxPx={maxPx} minPx={48} maxLineas={lineas} caja={false} delay={0.2} id="titulo-pieza" />}
  </>
);

/* ───────────── metro-plano ───────────── */

export const MetroPlano: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const N = 1100;
  const capas = [
    { l: "elevado", y: 640, n: "0 líneas" },
    { l: "superficie", y: 930, n: "TODO" },
    { l: "subterráneo", y: 1220, n: "0 líneas" },
  ];
  const BH = 250;
  const puntos = useMemo(() => Array.from({ length: N }, (_, i) => ({
    x0: 160 + azar(i * 3.1 + 1) * 760, y0: -40 - azar(i * 5.7 + 2) * 420,
    x1: 165 + azar(i * 7.3 + 3) * 750, y1: 930 + 36 + Math.pow(azar(i * 2.9 + 4), 0.7) * (BH - 60),
    o: Math.pow(i / N, 0.85),
  })), []);
  const k = easeOut((t - a(TP.plano.cuenta)) / a(TP.plano.cuentaDur));
  const sello = spr(f, a(TP.plano.sello), { damping: 9, stiffness: 210, mass: 0.6 });
  const neon = T.neon ?? T.acento;
  const rojo = T.acento;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {capas.map((c, i) => {
          const principal = i === 1;
          return (
            <g key={c.l} opacity={clamp((t - a(0.3 + 0.12 * i)) / 0.4)}>
              <rect x={150} y={c.y} width={780} height={BH} rx={22} fill={principal ? "rgba(230,57,38,0.07)" : "none"} stroke={principal ? rojo : T.suave} strokeOpacity={principal ? 0.9 : 0.5} strokeWidth={principal ? 4 : 2.5} strokeDasharray={principal ? undefined : "10 9"} />
            </g>
          );
        })}
        {puntos.map((d, i) => {
          const tl = a(TP.plano.caida + d.o * TP.plano.caidaDur);
          const kk = clamp((t - tl) / 0.85);
          if (kk <= 0) return null;
          const y = lerp(d.y0, d.y1, kk * kk);
          if (y < 150) return null;
          const jit = kk >= 1 ? Math.sin(f / 5 + i) * 1.6 : 0;
          return <circle key={i} cx={lerp(d.x0, d.x1, kk) + jit} cy={y} r={4.4} fill={rojo} opacity={0.92} />;
        })}
      </svg>
      <Cabecera e={e} maxPx={92} yTitulo={415} />
      <div data-texto="plano-cifra" style={{ position: "absolute", left: 120, top: 574, width: 840, textAlign: "center", transform: "translateY(-50%)", fontFamily: FUENTE, fontWeight: 900, fontSize: 112, letterSpacing: "-0.03em", lineHeight: 1, color: neon, whiteSpace: "nowrap", textShadow: T.oscuro ? "0 10px 40px rgba(0,0,0,0.5)" : "none" }}>{fmtNum(METRO_DATOS.habitantes * k, 0)}</div>
      {capas.map((c, i) => (
        <React.Fragment key={c.l}>
          <Etiqueta texto={c.l} x={180} y={c.y + 36} px={26} ancho={300} alinear="left" mono color={T.suave} peso={400} mayus={false} delay={0.5 + 0.12 * i} id="plano-capa" />
          <Etiqueta texto={c.n} x={900} y={c.y + 36} px={i === 1 ? 30 : 26} ancho={300} alinear="right" mono color={i === 1 ? rojo : T.suave} peso={700} mayus={false} delay={0.7 + 0.12 * i} id="plano-cuenta" />
        </React.Fragment>
      ))}
      <div data-texto="plano-sello" style={{ position: "absolute", left: 120, top: 1545, width: 840, textAlign: "center", transform: `translateY(-50%) scale(${lerp(2.2, 1, clamp(sello))})`, opacity: clamp(sello * 3), fontFamily: FUENTE, fontWeight: 900, fontSize: 92, letterSpacing: "-0.02em", lineHeight: 1, color: rojo, whiteSpace: "nowrap" }}>UN SOLO PLANO</div>
    </AbsoluteFill>
  );
};

/* ───────────── metro-friccion ───────────── */

const LARGO_BUS = 168;
const LUCES = [650, 850, 1050, 1250];
/** Simulación determinista del tráfico (los buses se frenan en cada semáforo en rojo y no se pisan): devuelve el frente de cada bus en el instante t. */
function simularBuses(t: number): { y: number[]; rojo: boolean[] } {
  const rojoEn = (i: number, tt: number): boolean => ((tt + 1.15 * i) % 6) < 3.5;
  const y = [610, 410, 210, 10, -190];
  const V = 175, dt = 1 / 30;
  for (let s = 0; s < Math.floor(t / dt); s++) {
    const tt = s * dt;
    for (let j = 0; j < y.length; j++) {
      let ny = y[j] + V * dt;
      for (let i = 0; i < LUCES.length; i++) {
        const stop = LUCES[i] - 46;
        if (y[j] <= stop && ny > stop && rojoEn(i, tt)) ny = stop;
      }
      if (j > 0) ny = Math.min(ny, y[j - 1] - LARGO_BUS - 26);
      y[j] = ny;
    }
  }
  return { y, rojo: LUCES.map((_, i) => rojoEn(i, t)) };
}

export const MetroFriccion: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const { T } = useViral();
  const sim = simularBuses(t);
  const rojo = T.acento, neon = T.neon ?? T.acento;
  const vShow = lerp(28, METRO_DATOS.velSuperficie, easeOut((t - a(TP.friccion.dial)) / a(TP.friccion.dialDur))) + (t > a(TP.friccion.dial + TP.friccion.dialDur) ? Math.sin(t * 5) * 0.35 : 0);
  const horas = Math.floor(METRO_DATOS.horasPerdidas * easeInOut((t - a(TP.friccion.reloj)) / a(TP.friccion.relojDur)));
  const sCuatro = spr(f, a(TP.friccion.cuatro), { damping: 9, stiffness: 210, mass: 0.6 });
  const DX = 790, DY = 690, R = 128;
  const arco = (g0: number, g1: number): string => { const [x0, y0] = polarXY(DX, DY, R, g0), [x1, y1] = polarXY(DX, DY, R, g1); return `M ${x0} ${y0} A ${R} ${R} 0 ${g1 - g0 > 180 ? 1 : 0} 1 ${x1} ${y1}`; };
  const gAguja = 135 + 270 * clamp(vShow / 40);
  const [ax, ay] = polarXY(DX, DY, R * 0.82, gAguja);
  const entra = clamp(t / 0.5);
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><clipPath id="calle"><rect x={110} y={520} width={470} height={910} /></clipPath></defs>
        <g opacity={entra}>
          {/* la calle, las bocacalles y los semáforos */}
          <rect x={240} y={520} width={200} height={910} fill="rgba(255,255,255,0.05)" stroke={T.suave} strokeOpacity={0.45} strokeWidth={2.5} />
          {Array.from({ length: 22 }, (_, i) => <rect key={i} x={338} y={530 + i * 42 + ((f * 1.2) % 42)} width={4} height={20} fill={T.suave} opacity={0.4} />)}
          {LUCES.map((yl, i) => (
            <g key={yl}>
              <rect x={120} y={yl - 24} width={450} height={52} fill="rgba(255,255,255,0.08)" />
              <line x1={240} x2={440} y1={yl - 46} y2={yl - 46} stroke={sim.rojo[i] ? rojo : T.suave} strokeWidth={4} opacity={0.8} />
              <circle cx={218} cy={yl - 46} r={13} fill={sim.rojo[i] ? rojo : "#38D97A"} />
              {sim.rojo[i] && <circle cx={218} cy={yl - 46} r={24} fill={rojo} opacity={0.22} />}
            </g>
          ))}
          <g clipPath="url(#calle)">
            {sim.y.map((yb, j) => (
              <g key={j} transform={`translate(340 ${yb})`}>
                <rect x={-34} y={-LARGO_BUS} width={68} height={92} rx={12} fill={rojo} stroke={oscurecer(rojo, 0.5)} strokeWidth={3} />
                <rect x={-34} y={-LARGO_BUS + 98} width={68} height={70} rx={12} fill={mezclar(rojo, "#000000", 0.12)} stroke={oscurecer(rojo, 0.5)} strokeWidth={3} />
                <rect x={-22} y={-LARGO_BUS + 94} width={44} height={8} fill={oscurecer(rojo, 0.55)} />
                {[0, 1, 2, 3].map((k) => <rect key={k} x={-24} y={-LARGO_BUS + 10 + k * 22} width={48} height={12} rx={3} fill="#FFFFFF" opacity={0.7} />)}
              </g>
            ))}
          </g>
        </g>
        {/* dial de velocidad */}
        <g opacity={clamp((t - a(0.3)) / 0.4)}>
          <circle cx={DX} cy={DY} r={R + 16} fill="rgba(255,255,255,0.03)" />
          <path d={arco(135, 405)} fill="none" stroke={T.suave} strokeOpacity={0.35} strokeWidth={10} strokeLinecap="round" />
          <path d={arco(135, Math.max(135.5, gAguja))} fill="none" stroke={vShow < 20 ? rojo : neon} strokeWidth={12} strokeLinecap="round" />
          <line x1={DX} y1={DY} x2={ax} y2={ay} stroke={T.texto} strokeWidth={6} strokeLinecap="round" />
          <circle cx={DX} cy={DY} r={11} fill={T.texto} />
        </g>
        {/* 100 horas: una casilla por hora */}
        {Array.from({ length: 100 }, (_, i) => {
          const col = i % 10, fila = Math.floor(i / 10);
          const lleno = i < horas;
          return <rect key={i} x={640 + col * 31} y={920 + fila * 31} width={25} height={25} rx={4} fill={lleno ? rojo : "none"} stroke={lleno ? rojo : T.suave} strokeOpacity={lleno ? 1 : 0.45} strokeWidth={2} opacity={clamp((t - a(1.2 + i * 0.006)) / 0.3)} />;
        })}
      </svg>
      <Cabecera e={e} maxPx={104} lineas={1} yTitulo={405} />
      <div data-texto="friccion-vel" style={{ position: "absolute", left: DX - 110, top: DY + 18, width: 220, textAlign: "center", transform: "translateY(-50%)", fontFamily: FUENTE, fontWeight: 900, fontSize: 92, lineHeight: 1, color: vShow < 20 ? rojo : T.texto, whiteSpace: "nowrap" }}>{Math.round(vShow)}</div>
      <Etiqueta texto="km/h" x={DX} y={DY + 92} px={28} ancho={200} mono color={T.suave} peso={700} mayus={false} delay={0.6} id="friccion-unidad" />
      <Etiqueta texto="velocidad promedio" x={DX} y={DY + 158} px={24} ancho={330} mono color={T.suave} peso={400} mayus={false} delay={0.7} id="friccion-etq" />
      <div data-texto="friccion-horas" style={{ position: "absolute", left: 630, top: 884, width: 330, fontFamily: MONO, fontWeight: 700, fontSize: 28, color: T.texto, whiteSpace: "nowrap" }}>{`${horas} h al año`}</div>
      <div data-texto="friccion-cuatro" style={{ position: "absolute", left: 120, top: 1500, width: 840, textAlign: "center", transform: `translateY(-50%) scale(${lerp(2, 1, clamp(sCuatro))})`, opacity: clamp(sCuatro * 3), fontFamily: FUENTE, fontWeight: 900, fontSize: 78, letterSpacing: "-0.02em", lineHeight: 1, color: neon, whiteSpace: "nowrap" }}>≈ 4 DÍAS ENTEROS</div>
      <Etiqueta texto="atrapado en fricción pura, por pasajero y por año" x={W / 2} y={1590} px={26} ancho={800} mono color={T.suave} peso={400} mayus={false} delay={TP.friccion.cuatro + 0.5} id="friccion-nota" />
    </AbsoluteFill>
  );
};

/* ───────────── metro-rieles ───────────── */

export const MetroRieles: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const { T } = useViral();
  const neon = T.neon ?? T.acento;
  const rojo = T.acento;
  const X0 = 360, ESC = 580 / 140;
  const filas = METRO_KM.map((c, i) => ({ ...c, y: 610 + i * 120, i }));
  const parpadeo = Math.floor(t * 2.4) % 2 === 0;
  const kVacio = clamp((t - a(TP.rieles.vacio)) / 0.5);
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {filas.map((r) => {
          if (r.km === 0) {
            return (
              <g key={r.ciudad} opacity={clamp((t - a(TP.rieles.fila(r.i) - 0.2)) / 0.4)}>
                <rect x={X0} y={r.y - 42} width={580} height={84} rx={14} fill="rgba(230,57,38,0.06)" stroke={rojo} strokeOpacity={0.8} strokeWidth={3} strokeDasharray="12 10" />
                <line x1={X0 + 16} x2={X0 + 564} y1={r.y} y2={r.y} stroke={rojo} strokeOpacity={0.35} strokeWidth={3} strokeDasharray="3 14" strokeLinecap="round" />
              </g>
            );
          }
          const largo = r.km * ESC;
          const p = easeOut((t - a(TP.rieles.fila(r.i))) / a(TP.rieles.filaDur));
          const w = largo * p;
          const nTraviesas = Math.floor(w / 15);
          const x = (((t - a(TP.rieles.fila(r.i) + TP.rieles.filaDur)) * (largo / 5.5) + r.i * 61) % Math.max(60, largo));
          return (
            <g key={r.ciudad}>
              <line x1={X0} x2={X0 + w} y1={r.y - 9} y2={r.y - 9} stroke={neon} strokeWidth={4} strokeLinecap="round" />
              <line x1={X0} x2={X0 + w} y1={r.y + 9} y2={r.y + 9} stroke={neon} strokeWidth={4} strokeLinecap="round" />
              {Array.from({ length: nTraviesas }, (_, k) => <line key={k} x1={X0 + k * 15 + 4} x2={X0 + k * 15 + 4} y1={r.y - 16} y2={r.y + 16} stroke={neon} strokeOpacity={0.5} strokeWidth={3} />)}
              {p >= 1 && (
                <g transform={`translate(${X0 + Math.max(0, x)} ${r.y})`}>
                  <rect x={-30} y={-15} width={60} height={30} rx={9} fill="#FFFFFF" />
                  {[-18, -4, 10].map((dx) => <rect key={dx} x={dx} y={-8} width={9} height={11} rx={2} fill="#0B0C10" opacity={0.75} />)}
                </g>
              )}
              {p > 0.02 && <circle cx={X0 + w} cy={r.y} r={7} fill={neon} />}
            </g>
          );
        })}
      </svg>
      <Cabecera e={e} maxPx={90} yTitulo={420} />
      {filas.map((r) => (
        <React.Fragment key={r.ciudad}>
          <Etiqueta texto={r.ciudad} x={120} y={r.y - 17} px={32} ancho={230} alinear="left" mono color={r.km === 0 ? rojo : T.texto} peso={700} mayus={false} delay={TP.rieles.fila(r.i)} id="rieles-ciudad" />
          <Etiqueta texto={r.km === 0 ? "0 km" : `${r.aprox ? "≈ " : ""}${r.km} km`} x={120} y={r.y + 20} px={28} ancho={230} alinear="left" mono color={r.km === 0 ? rojo : neon} peso={400} mayus={false} delay={TP.rieles.fila(r.i) + 0.15} id="rieles-km" />
        </React.Fragment>
      ))}
      <div data-texto="rieles-cero" style={{ position: "absolute", left: X0 + 40, top: filas[6].y, width: 500, textAlign: "center", transform: `translateY(-50%) scale(${lerp(1.6, 1, easeOut(kVacio))})`, opacity: kVacio * (parpadeo ? 1 : 0.55), fontFamily: FUENTE, fontWeight: 900, fontSize: 76, letterSpacing: "-0.02em", lineHeight: 1, color: rojo, whiteSpace: "nowrap" }}>0 KM</div>
      <Etiqueta texto="el vacío estructural en el centro de los Andes" x={W / 2} y={1500} px={30} ancho={820} mono color={T.suave} peso={400} mayus={false} delay={TP.rieles.vacio + 0.8} id="rieles-nota" />
    </AbsoluteFill>
  );
};
