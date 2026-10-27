/**
 * «La regla del 37 %» (IMNOBA · figuras realistas) · escenas 1/2
 *   par-gancho  una calle con casas: muy pronto te quedas con la primera, muy tarde otro se lleva la mejor
 *   par-kepler  Kepler (1611) y sus once candidatas: rechaza las primeras ≈ 37 % y elige a la quinta (relato de Ferguson, 1989)
 *   par-n3      demostración con 3 casas: las 6 órdenes posibles y la regla acierta en 3 (50 %)
 *   par-regla   100 casas: observas 37 (el estándar sube a 88) y eliges la primera que lo supera
 */
import React, { useMemo } from "react";
import { PAR, TPA, enumerarOrdenes, secRegla } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Estudio, FONT, Frases, MONOF, Persona, RE, Reflejo } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { Candidata, Cartel, Casa, MiniCasa } from "./par-kit";

type P = { e: EscenaViralGuardada };

/** Índice (fraccionario) que va de `desde` a `hasta` entre `ini` y `ini + dur` s, con aceleración suave opcional. */
const barrido = (t: number, ini: number, dur: number, desde: number, hasta: number, suave = false): number => {
  const k = clamp((t - ini) / Math.max(0.0001, dur));
  return desde + (hasta - desde) * (suave ? k * k * (3 - 2 * k) : k);
};

/* ───────────── par-gancho ───────────── */

export const ParGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const PISO = 1180;
  const xs = [190, 540, 890];
  const camina = easeInOut((t - a(TPA.gancho.camina)) / a(TPA.gancho.caminaDur));
  const sigue = easeInOut((t - a(TPA.gancho.tarde)) / a(1.2));
  const xp = t < a(TPA.gancho.tarde) ? lerp(-90, 190, camina) : lerp(190, 420, sigue);
  const otro = easeOut((t - a(TPA.gancho.tarde - 0.4)) / a(1.4));
  const xo = lerp(1220, 960, otro);
  const pronto = t >= a(TPA.gancho.pronto) && t < a(TPA.gancho.tarde);
  const vendida = t >= a(TPA.gancho.vendida);
  const andando = t < a(TPA.gancho.pronto) || (t >= a(TPA.gancho.tarde) && sigue < 0.98);
  const sCasas = (i: number): number => spr(f, a(0.15 + i * 0.12), { damping: 14, stiffness: 140, mass: 0.7 });
  return (
    <Estudio piso={PISO} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Reflejo piso={PISO} intensidad={0.2}>
          {xs.map((x, i) => (
            <g key={i} opacity={clamp(sCasas(i) * 2)} transform={`translate(0 ${(1 - sCasas(i)) * 30})`}>
              <Casa x={x} y={PISO - 10} s={1.3} tono={[0, 1, 3][i]} luz={0.5 + 0.3 * Math.sin(t * 1.2 + i)} estado={i === 0 && pronto ? "elegida" : i === 2 && vendida ? "vendida" : "normal"} />
            </g>
          ))}
          <Persona x={xp} y={PISO + 120} s={1.55} fase={andando ? t * 9 : 0} />
          {otro > 0.02 && <Persona x={xo} y={PISO + 120} s={1.55} fase={otro < 0.98 ? t * 9 : 0} color="#7A2A1C" brillo="#F2B6A4" espejo />}
        </Reflejo>
      </svg>
      <Frases frases={[{ t: 0.3, texto: "¿cuándo dejas\nde buscar casa?", px: 96 }, { t: TPA.gancho.pronto, texto: "muy pronto:\nte quedas con la 1.ª", color: RE.rojo, px: 78 }, { t: TPA.gancho.tarde, texto: "muy tarde:\notro se lleva la mejor", color: RE.oro, px: 74 }, { t: TPA.gancho.regla, texto: "regla del 37 %", color: RE.oro, px: 118 }]} y={420} />
      {pronto && <Chip texto="te quedas con la primera" x={W / 2} y={1520} color={RE.rojo} id="par-pronto" ancho={520} />}
      {vendida && t < a(TPA.gancho.regla) && <Chip texto="la mejor ya se vendió" x={W / 2} y={1520} color={RE.oro} id="par-vendida" ancho={520} />}
    </Estudio>
  );
};

/* ───────────── par-kepler ───────────── */

export const ParKepler: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const PISO = 1380;
  const n = PAR.kepler.candidatas;
  const X = (i: number): number => (i < 6 ? 180 + i * 144 : 252 + (i - 6) * 144);
  const Y = (i: number): number => (i < 6 ? 1010 : 1290);
  const rechaza = t >= a(TPA.kepler.rechaza);
  const elige = t >= a(TPA.kepler.elige);
  const sEl = spr(f, a(TPA.kepler.elige), { damping: 11, stiffness: 190, mass: 0.6 });
  const anio = 1500 + 111 * easeOut((t - a(0.4)) / a(1.4));
  return (
    <Estudio piso={PISO} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Reflejo piso={PISO} intensidad={0.18}>
          {Array.from({ length: n }, (_, i) => {
            const s = spr(f, a(TPA.kepler.fila + i * TPA.kepler.paso), { damping: 13, stiffness: 150, mass: 0.7 });
            const estado = i === PAR.kepler.elegida - 1 && elige ? "elegida" : i < 4 && rechaza ? "rechazada" : "normal";
            return <Candidata key={i} x={X(i)} y={Y(i) - (1 - s) * 40 - 3.5 * Math.sin(t * 2.6 + i * 0.8)} s={1.4} op={clamp(s * 2)} estado={estado} brillo={estado === "elegida" ? sEl : 0} />;
          })}
        </Reflejo>
        {Array.from({ length: n }, (_, i) => <text key={i} x={X(i)} y={Y(i) + 50} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={36} fill={i === PAR.kepler.elegida - 1 && elige ? RE.oro : "#fff"} fillOpacity={clamp((t - a(TPA.kepler.fila + i * TPA.kepler.paso)) / 0.4) * (i < 4 && rechaza ? 0.5 : 0.95)}>{i + 1}</text>)}
        {rechaza && <g opacity={clamp((t - a(TPA.kepler.rechaza)) / 0.5)}><line x1={X(0) - 40} x2={X(3) + 40} y1={Y(0) + 80} y2={Y(0) + 80} stroke={RE.rojo} strokeWidth={9} strokeLinecap="round" /></g>}
      </svg>
      <Frases frases={[{ t: 0.3, texto: "Kepler", px: 130, color: RE.oro }, { t: 1.4, texto: "11 candidatas", px: 104 }, { t: TPA.kepler.rechaza, texto: "rechaza las\nprimeras 4", color: RE.rojo, px: 92 }, { t: TPA.kepler.elige, texto: "se casa con\nla 5.ª", color: RE.esmeralda, px: 96 }]} y={420} />
      <Chip texto="11 ÷ e ≈ 4  ·  ≈ 37 %" x={W / 2} y={1425} color={RE.hielo} opacidad={clamp((t - a(TPA.kepler.rechaza + 0.4)) / 0.5)} id="par-k-f" ancho={560} />
      <Dato valor={anio} x={W / 2} y={1525} px={100} digitos={4} sinSep id="kepler-anio" opacidad={clamp((t - 0.4) / 0.5)} />
      <Fuente texto="Ferguson, «Who Solved the Secretary Problem?», Statistical Science 4 (1989) · el relato viene de una carta de Kepler; los detalles varían según la fuente" y={1640} delay={4.4} />
    </Estudio>
  );
};

/* ───────────── par-n3 ───────────── */

export const ParN3: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const filas = useMemo(() => enumerarOrdenes(3, 1), []);
  const RX = [340, 540, 740], Y0 = 650, PASO = 130;
  const color = (rango: number): string => (rango === 3 ? RE.oro : rango === 2 ? "#6C93D6" : "#4A6AA0");
  const hecho = (i: number): boolean => t >= a(TPA.n3.fila(i) + 0.8);
  const aciertos = filas.reduce((n, fl, i) => n + (hecho(i) && fl.acierta ? 1 : 0), 0);
  const total = t >= a(TPA.n3.total);
  return (
    <Estudio piso={1330} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {filas.map((fl, i) => {
          const s = spr(f, a(TPA.n3.fila(i)), { damping: 14, stiffness: 140, mass: 0.7 });
          const y = Y0 + i * PASO;
          const res = clamp((t - a(TPA.n3.fila(i) + 0.8)) / 0.35);
          return (
            <g key={i} opacity={clamp(s * 2)} transform={`translate(0 ${(1 - s) * 24})`}>
              <rect x={216} y={y - 108} width={648} height={124} rx={20} fill="#0C1A2A" fillOpacity={0.5} stroke="#BFE0FF" strokeOpacity={0.18} strokeWidth={2} />
              {fl.orden.map((r, c) => (
                <g key={c}>
                  <MiniCasa x={RX[c]} y={y} s={0.7 + 0.26 * r} color={color(r)} op={c === 0 && res > 0 ? 0.45 : 1} brillo={res > 0 && c === fl.eligio ? 1 : 0} />
                  <text x={RX[c]} y={y + 8} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={22} fill="#BFE0FF" fillOpacity={0.8}>{r}</text>
                </g>
              ))}
              {res > 0 && <g opacity={res}><line x1={RX[0] - 40} x2={RX[0] + 40} y1={y - 76} y2={y - 8} stroke={RE.rojo} strokeWidth={7} strokeLinecap="round" /><line x1={RX[0] + 40} x2={RX[0] - 40} y1={y - 76} y2={y - 8} stroke={RE.rojo} strokeWidth={7} strokeLinecap="round" /></g>}
              {res > 0 && <circle cx={RX[fl.eligio]} cy={y - 48} r={62 + (1 - res) * 20} fill="none" stroke={fl.acierta ? RE.esmeralda : RE.rojo} strokeWidth={5} opacity={res} />}
              {res > 0 && (
                <g transform={`translate(918 ${y - 46}) scale(${0.6 + 0.4 * res})`} opacity={res}>
                  <circle r={30} fill={fl.acierta ? RE.esmeralda : RE.rojo} stroke="#fff" strokeWidth={4} />
                  {fl.acierta ? <path d="M -14 1 L -4 12 L 15 -10" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" /> : <g stroke="#fff" strokeWidth={7} strokeLinecap="round"><line x1={-12} y1={-12} x2={12} y2={12} /><line x1={12} y1={-12} x2={-12} y2={12} /></g>}
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <Frases frases={[{ t: 0.3, texto: "3 casas", px: 128 }, { t: 1.3, texto: "6 órdenes posibles", px: 82, color: RE.oro }, { t: 4.6, texto: "rechazas la 1.ª,\nelige la primera mejor", px: 66 }, { t: TPA.n3.total, texto: "3 de 6 = 50 %", px: 112, color: RE.esmeralda }]} y={420} />
      <Dato valor={aciertos} x={W / 2 - 140} y={1500} px={110} digitos={1} sufijo="de 6" id="n3-ac" opacidad={clamp((t - 1.4) / 0.5)} color={RE.esmeralda} />
      <Dato valor={total ? 50 * easeOut((t - a(TPA.n3.total)) / a(0.8)) : 0} x={W / 2 + 250} y={1500} px={110} digitos={2} sufijo="%" id="n3-pct" opacidad={total ? 1 : 0.2} />
      <Fuente texto="Rango de cada casa: 1 = la peor, 3 = la mejor · 3 de 6 órdenes aciertan (cálculo exacto)" y={1610} delay={2} />
    </Estudio>
  );
};

/* ───────────── par-regla ───────────── */

export const ParRegla: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const v = useMemo(secRegla, []);
  const PISO = 1130, K = PAR.k, iM = PAR.regla.mejorEn;
  const fase2 = t >= a(TPA.regla.sigue);
  const idx = fase2 ? barrido(t, a(TPA.regla.sigue), a(TPA.regla.sigueDur), K - 1, iM, true) : barrido(t, a(TPA.regla.obs), a(TPA.regla.obsDur), 0, K - 1);
  const i = Math.min(99, Math.floor(idx));
  const elegida = t >= a(TPA.regla.elige);
  const empezo = t >= a(TPA.regla.obs);
  let M = 0;
  for (let q = 0; q <= Math.min(K - 1, i); q++) M = Math.max(M, v[q]);
  const val = v[i];
  const supera = i >= K && val > M;
  const sEl = spr(f, a(TPA.regla.elige), { damping: 11, stiffness: 190, mass: 0.6 });
  const X0 = 100, AN = 880, tick = AN / 100;
  return (
    <Estudio piso={PISO} resplandor={0.55}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Reflejo piso={PISO} intensidad={0.16}>
          <Casa x={540} y={PISO - 24} s={1.55} tono={i % 5} luz={0.25 + 0.75 * (val / 100)} estado={elegida ? "elegida" : "normal"} />
          <Cartel x={185} y={PISO - 24} s={1.12} texto={`${val}`} sub="ESTA CASA" color={elegida || supera ? RE.esmeralda : RE.hielo} />
          <Cartel x={895} y={PISO - 24} s={1.12} texto={M > 0 ? `${M}` : "—"} sub="MEJOR VISTA" color={RE.oro} />
        </Reflejo>
        {/* barra de las 100 casas */}
        <g opacity={clamp((t - 0.3) / 0.5)}>
          {Array.from({ length: 100 }, (_, q) => {
            const visto = empezo && q <= idx;
            const col = q === iM && elegida ? RE.esmeralda : q < K ? (visto ? RE.hielo : "#2D4C86") : (visto ? RE.oro : "#5A4A1A");
            return <rect key={q} x={X0 + q * tick + 1} y={1312} width={Math.max(2, tick - 2)} height={q === i && empezo ? 40 : 26} rx={2} fill={col} opacity={visto || q === i ? 1 : 0.55} />;
          })}
          <line x1={X0 + K * tick} x2={X0 + K * tick} y1={1294} y2={1372} stroke="#fff" strokeOpacity={0.7} strokeWidth={2} strokeDasharray="6 6" />
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "casa por casa", px: 104 }, { t: TPA.regla.obs, texto: "rechazas las\nprimeras 37", color: RE.hielo, px: 92 }, { t: TPA.regla.fija, texto: "tu estándar: 88", color: RE.oro, px: 100 }, { t: TPA.regla.sigue, texto: "elige la primera\nque lo supere", px: 86 }, { t: TPA.regla.elige, texto: "¡esa es!", color: RE.esmeralda, px: 140 }]} y={420} />
      <Dato valor={empezo ? i + 1 : 0} x={W / 2} y={1500} px={96} digitos={3} sufijo="/ 100" id="regla-idx" opacidad={empezo ? 1 : 0.2} color={RE.blanco} />
      <Chip texto={i < K ? "OBSERVAS · NO ELIGES" : "ELIGE LA 1.ª MEJOR"} x={W / 2} y={1415} color={i < K ? RE.hielo : RE.oro} id="regla-fase" ancho={500} opacidad={empezo ? 1 : 0} />
      <Fuente texto="Casos de ejemplo: la 29.ª casa vale 88 (el mejor de las 37 primeras) y la 61.ª vale 100, la primera que lo supera" y={1612} delay={2.4} />
    </Estudio>
  );
};
