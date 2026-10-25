/**
 * «Bogotá, la ciudad sin metro» (v3 · figuras realistas) · escenas 2/3
 *   real-redes      km de metro por ciudad: rieles de acero con su tren; en Bogotá, un bus articulado donde otros tienen metro
 *   real-tiempo     Medellín abrió en 1995, Bogotá abre en 2028: la brecha de 33 años en una línea de tiempo con dos trenes
 *   real-viaducto   la Línea 1 a 14 m de altura pasa por encima de cada semáforo (cota, pilares, trancón abajo)
 *   real-untren     un tren = 1.800 pasajeros = 12 buses articulados; uno cada 90 s
 */
import React, { useMemo } from "react";
import { BOG, REDES_KM, TR } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Odometro } from "./anom-ui";
import { Auto, BusArticulado, Cota, Estudio, FONT, Frases, MONOF, Persona, RE, Reflejo, Riel, Semaforo, Torre, TrenMetro } from "./real-kit";
import { Dato, Fuente } from "./real1";

type P = { e: EscenaViralGuardada };

/* ───────────── real-redes ───────────── */

export const RealRedes: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const X0 = 340, ESC = 3.0, Y0 = 740, DY = 114;
  const pulso = 0.6 + 0.4 * Math.sin(t * 5);
  return (
    <Estudio piso={1720} resplandor={0.35}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {REDES_KM.map((c, i) => {
          const y = Y0 + i * DY;
          const ini = TR.redes.fila(i);
          const k = easeOut((t - a(ini)) / a(TR.redes.filaDur));
          if (k <= 0) return null;
          if (c.km === 0) {
            return (
              <g key={c.ciudad} opacity={clamp(k * 2)}>
                <line x1={X0} x2={X0 + 330} y1={y - 2} y2={y - 2} stroke={RE.rojo} strokeWidth={4} strokeDasharray="3 14" strokeLinecap="round" opacity={0.7} />
                <BusArticulado x={X0 + 130} y={y} s={0.27} pasajeros={3} freno={pulso} />
                <g transform={`translate(${X0 + 330} ${y - 36})`}><line x1={0} y1={36} x2={0} y2={-16} stroke="#9AA7B4" strokeWidth={4} /><rect x={-4} y={-30} width={150} height={40} rx={6} fill={RE.rojo} /></g>
                <text x={X0 + 334} y={y - 38} fontFamily={FONT} fontWeight={800} fontSize={26} fill="#fff">SIN METRO</text>
              </g>
            );
          }
          const L = c.km * ESC;
          const carros = L > 230 ? 3 : L > 120 ? 2 : 1;
          const s = Math.min(0.44, (L * 0.92) / (carros * 308));
          const ancho = carros * 308 * s;
          const xc = X0 + ancho / 2 + (((t * 120) % Math.max(1, L - ancho)) + 0);
          return (
            <g key={c.ciudad}>
              <g opacity={clamp(k * 2)}><Riel x0={X0} x1={X0 + L * k} y={y - 3} grosor={0.9} /></g>
              {k > 0.95 && <TrenMetro x={xc} y={y - 5} s={s} carros={carros} />}
            </g>
          );
        })}
      </svg>
      {REDES_KM.map((c, i) => {
        const y = Y0 + i * DY;
        const ini = TR.redes.fila(i);
        const k = easeOut((t - a(ini)) / a(TR.redes.filaDur));
        const bog = c.km === 0;
        return (
          <React.Fragment key={c.ciudad}>
            <div data-texto="redes-ciudad" style={{ position: "absolute", left: 104, top: y - 30, fontFamily: FONT, fontWeight: 700, fontSize: 32, color: bog ? RE.rojo : RE.blanco, opacity: clamp(k * 3) }}>{c.ciudad}</div>
            <Odometro valor={c.km * k} x={976} y={y - 24} px={46} digitos={3} sufijo="km" alinear="right" color={bog ? RE.rojo : RE.oro} id="redes-km" opacidad={clamp(k * 4)} />
          </React.Fragment>
        );
      })}
      <Frases frases={[{ t: 0.3, texto: "Sudamérica" }, { t: 2.4, texto: "km de metro", color: RE.oro }, { t: TR.redes.cero, texto: "Bogotá: cero", color: RE.rojo, px: 118 }]} y={400} />
      <Fuente texto="Metro de Santiago (jun. 2025) · operadoras y listado de sistemas de América Latina (2023–2025) · cifras redondeadas" y={1600} delay={5} />
    </Estudio>
  );
};

/* ───────────── real-tiempo ───────────── */

export const RealTiempo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const xA = (y: number): number => 130 + ((y - 1995) / 33) * 820;
  const YM = 860, YB = 1190;
  const cota = easeInOut((t - a(TR.tiempo.ini)) / a(TR.tiempo.dur));
  const anios = Math.round(33 * cota);
  const enciende = clamp((t - a(TR.tiempo.cota)) / 0.8);
  const xTren = 130 + 230 + (((t * 170) % 480) + 0);
  return (
    <Estudio piso={1620} resplandor={0.35}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* Medellín: el tren ya corre */}
        <Riel x0={110} x1={970} y={YM - 3} />
        <TrenMetro x={xTren} y={YM - 5} s={0.5} carros={3} />
        {/* Bogotá: el tren espera al final de la línea de tiempo */}
        <Riel x0={110} x1={970} y={YB - 3} />
        <TrenMetro x={xA(2028) - 232} y={YB - 5} s={0.5} carros={3} luces={enciende} />
        {/* banderas de año */}
        {[[1995, YM], [2028, YB]].map(([an, y]) => (
          <g key={an}>
            <line x1={xA(an as number)} y1={(y as number) - 120} x2={xA(an as number)} y2={y as number} stroke="#C9D3DD" strokeWidth={4} />
            <rect x={xA(an as number) - (an === 2028 ? 112 : 0)} y={(y as number) - 124} width={112} height={44} rx={6} fill={an === 1995 ? RE.oro : RE.rojo} />
            <text x={xA(an as number) + (an === 2028 ? -56 : 56)} y={(y as number) - 92} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={an === 1995 ? "#1B1400" : "#fff"}>{an as number}</text>
          </g>
        ))}
        {/* brecha de 33 años */}
        <g opacity={clamp(cota * 4)}>
          <line x1={xA(1995)} y1={1025} x2={lerp(xA(1995), xA(2028), cota)} y2={1025} stroke={RE.oro} strokeWidth={5} />
          <line x1={xA(1995)} y1={1007} x2={xA(1995)} y2={1043} stroke={RE.oro} strokeWidth={5} />
          <line x1={lerp(xA(1995), xA(2028), cota)} y1={1007} x2={lerp(xA(1995), xA(2028), cota)} y2={1043} stroke={RE.oro} strokeWidth={5} />
          <polygon points={`${lerp(xA(1995), xA(2028), cota)},1025 ${lerp(xA(1995), xA(2028), cota) - 20},1015 ${lerp(xA(1995), xA(2028), cota) - 20},1035`} fill={RE.oro} />
        </g>
        {/* eje de años */}
        <line x1={130} x2={950} y1={1330} y2={1330} stroke="#9CCBFF" strokeOpacity={0.5} strokeWidth={3} />
        {[1995, 2000, 2005, 2010, 2015, 2020, 2025, 2028].map((an) => <g key={an}><line x1={xA(an)} x2={xA(an)} y1={1318} y2={1342} stroke="#9CCBFF" strokeOpacity={0.7} strokeWidth={3} /><text x={xA(an)} y={1384} textAnchor="middle" fontFamily={MONOF} fontSize={24} fill="#DDEBFF" fillOpacity={0.75}>{an}</text></g>)}
      </svg>
      <div data-texto="tiempo-med" style={{ position: "absolute", left: 104, top: YM - 205, fontFamily: FONT, fontWeight: 800, fontSize: 40, color: RE.blanco }}>Medellín</div>
      <div data-texto="tiempo-bog" style={{ position: "absolute", left: 104, top: YB - 82, fontFamily: FONT, fontWeight: 800, fontSize: 40, color: RE.rojo }}>Bogotá</div>
      <Dato valor={anios} x={W / 2} y={1500} px={150} digitos={2} sufijo="años" id="tiempo-anios" opacidad={clamp(cota * 5)} />
      <Frases frases={[{ t: 0.3, texto: "Medellín" }, { t: 1.5, texto: "1995", color: RE.oro, px: 130 }, { t: 3.4, texto: "Bogotá" }, { t: 4.4, texto: "2028", color: RE.rojo, px: 130 }, { t: 6.0, texto: "33 años después", px: 84 }]} y={400} />
    </Estudio>
  );
};

/* ───────────── real-viaducto ───────────── */

export const RealViaducto: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const PISO = 1230, DECK = 900, GROSOR = 56;
  const torres = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ x: 40 + i * 92, w: 70 + azar(i * 3.3) * 40, h: 220 + azar(i * 7.7) * 420, sem: i + 5 })), []);
  const pasa = a(TR.viaducto.pasa);
  const xTren = -560 + ((((t - pasa) * 900) % 2800) + 2800) % 2800;
  const cota = easeOut((t - a(TR.viaducto.cota)) / 1.0);
  const pulso = 0.6 + 0.4 * Math.sin(t * 5);
  return (
    <Estudio piso={PISO} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="vd-deck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D5DBE2" /><stop offset="0.3" stopColor="#A9B2BC" /><stop offset="1" stopColor="#566270" /></linearGradient>
          <linearGradient id="vd-pil" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#566270" /><stop offset="0.45" stopColor="#B8C0C9" /><stop offset="1" stopColor="#4B5663" /></linearGradient>
          <linearGradient id="vd-calle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1A222C" /><stop offset="1" stopColor="#0A0F15" /></linearGradient>
        </defs>
        <g opacity={0.5}>{torres.map((d, i) => <Torre key={i} x={d.x} y={PISO} w={d.w} h={d.h} semilla={d.sem} luz={0.3} tono="#244a6e" lado={0.15} />)}</g>
        {/* calle */}
        <rect x={0} y={PISO} width={W} height={110} fill="url(#vd-calle)" />
        <line x1={0} x2={W} y1={PISO + 56} y2={PISO + 56} stroke="#fff" strokeOpacity={0.45} strokeWidth={4} strokeDasharray="46 36" />
        {/* pilares y tablero */}
        {[150, 930].map((px) => <polygon key={px} points={`${px - 52},${DECK + GROSOR} ${px + 52},${DECK + GROSOR} ${px + 34},${PISO} ${px - 34},${PISO}`} fill="url(#vd-pil)" />)}
        <rect x={0} y={DECK} width={W} height={GROSOR} fill="url(#vd-deck)" />
        <rect x={0} y={DECK - 8} width={W} height={10} fill="#E9EEF3" opacity={0.85} />
        <rect x={0} y={DECK + GROSOR - 5} width={W} height={5} fill="#000" opacity={0.3} />
        <Riel x0={0} x1={W} y={DECK - 10} grosor={0.8} />
        {/* tren a toda velocidad con estela */}
        {[3, 2, 1].map((g) => <TrenMetro key={g} x={xTren - g * 46} y={DECK - 12} s={0.62} carros={3} luces={0} />).map((el, i) => <g key={i} opacity={0.12 + i * 0.06}>{el}</g>)}
        <TrenMetro x={xTren} y={DECK - 12} s={0.62} carros={3} />
        {/* abajo: el trancón en el cruce */}
        <Auto x={250} y={PISO + 52} s={0.5} taxi freno={pulso} />
        <Auto x={420} y={PISO + 52} s={0.5} color="#C8281E" freno={1} />
        <BusArticulado x={760} y={PISO + 52} s={0.5} pasajeros={5} freno={pulso} />
        <Semaforo x={560} y={PISO + 28} s={0.62} luz="rojo" />
        <Cota x={92} y0={DECK + GROSOR} y1={PISO} texto="14 m" progreso={cota} />
      </svg>
      <Frases frases={[{ t: 0.3, texto: "Línea 1" }, { t: 1.8, texto: "a 14 metros", color: RE.oro, px: 110 }, { t: 4.2, texto: "sin semáforos", color: RE.blanco, px: 100 }]} y={400} />
      {[[24, "km", "de línea", 250], [16, "", "estaciones", 540], [0, "", "semáforos", 850]].map(([v, suf, et, cx], i) => {
        const op = clamp((t - a(TR.viaducto.cifras + i * 0.5)) / 0.6);
        return (
          <React.Fragment key={et as string}>
            <Odometro valor={(v as number) * easeOut((t - a(TR.viaducto.cifras + i * 0.5)) / 1.0)} x={cx as number} y={1480} px={92} digitos={2} sufijo={suf as string} color={i === 2 ? RE.esmeralda : RE.oro} id="viaducto-cifra" opacidad={op} />
            <div data-texto="viaducto-etq" style={{ position: "absolute", left: (cx as number) - 140, width: 280, top: 1538, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 32, color: RE.blanco, opacity: op * 0.9 }}>{et as string}</div>
          </React.Fragment>
        );
      })}
      <Fuente texto="Empresa Metro de Bogotá · Línea 1: 23,96 km, 16 estaciones, viaducto elevado (≈ 13,5–14 m)" y={1610} delay={5.4} />
    </Estudio>
  );
};

/* ───────────── real-untren ───────────── */

export const RealUnTren: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const nBus = Math.min(12, Math.max(0, Math.floor((t - a(TR.untren.ini)) / a(TR.untren.paso)) + 1));
  const cifra = easeOut((t - a(TR.untren.cifra)) / 1.6);
  const ciclo = ((t - a(TR.untren.ciclo)) % 6) / 6;
  const anillo = clamp((t - a(TR.untren.ciclo)) / 0.5) * (t >= a(TR.untren.ciclo) ? ciclo : 0);
  return (
    <Estudio piso={1900} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Riel x0={40} x1={1040} y={822} />
        <TrenMetro x={540} y={820} s={0.95} carros={3} />
        {/* 12 buses articulados: la misma gente en la calle */}
        {Array.from({ length: 12 }, (_, i) => {
          const col = i % 4, fila = Math.floor(i / 4);
          const pop = spr(f, a(TR.untren.ini + i * TR.untren.paso), { damping: 12, stiffness: 180, mass: 0.6 });
          if (i >= nBus) return null;
          return <g key={i} opacity={clamp(pop * 2)} transform={`translate(0 ${(1 - pop) * -40})`}><BusArticulado x={216 + col * 232} y={1090 + fila * 124} s={0.3} pasajeros={2} /></g>;
        })}
        {/* anillo de 90 s */}
        <circle cx={540} cy={1560} r={64} fill="none" stroke="#fff" strokeOpacity={0.15} strokeWidth={12} />
        <circle cx={540} cy={1560} r={64} fill="none" stroke={RE.oro} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 64}`} strokeDashoffset={2 * Math.PI * 64 * (1 - anillo)} transform="rotate(-90 540 1560)" />
      </svg>
      <Frases frases={[{ t: 0.3, texto: "1 tren" }, { t: 1.6, texto: "= 12 buses", color: RE.oro, px: 124 }, { t: 5.2, texto: "llenos", px: 100 }]} y={400} />
      <Dato valor={BOG.pasTren * cifra} x={W / 2} y={560} px={110} digitos={4} etiqueta="pasajeros en un solo tren" etiquetaY={634} id="untren-cifra" opacidad={clamp(cifra * 6)} />
      <div data-texto="untren-buses" style={{ position: "absolute", left: 104, width: W - 208, top: 1388, fontFamily: FONT, fontWeight: 800, fontSize: 54, color: RE.blanco, opacity: clamp((t - a(3)) / 0.6) }}><span style={{ color: RE.oro }}>{nBus}</span> buses articulados <span style={{ fontWeight: 500, fontSize: 34, opacity: 0.8 }}>(≈ 150 pasajeros c/u)</span></div>
      <div data-texto="untren-ciclo" style={{ position: "absolute", left: 640, top: 1530, fontFamily: FONT, fontWeight: 800, fontSize: 46, color: RE.oro, opacity: clamp((t - a(TR.untren.ciclo)) / 0.5) }}>uno cada <span style={{ fontSize: 60 }}>90 s</span></div>
      <Fuente texto="Empresa Metro de Bogotá (1.800 pasajeros por tren; intervalo mínimo 90 s) · 150 pas/bus: Univ. Javeriana · 12 buses = 1.800 ÷ 150" y={1630} delay={6} />
    </Estudio>
  );
};
