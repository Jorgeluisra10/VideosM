/**
 * «Bogotá, la ciudad sin metro» (v3 · figuras realistas) · escenas 1/3
 *   real-historia  una ciudad que crece de 400.000 a 7,9 millones de habitantes mientras espera un metro (77 años)
 *   real-trancon   191 horas perdidas en 2019 (INRIX): cronómetro, trancón con luces de freno, semáforo en rojo y 8 días
 *   real-bus       TransMilenio: 43.000 personas por hora y sentido, 150 por bus… pero por la misma calle (22–24 km/h)
 */
import React, { useMemo } from "react";
import { TR, TR as T_ } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { clamp, easeInOut, easeOut, fmtNum, lerp, mezclar, useReloj } from "../comun";
import { Odometro } from "./anom-ui";
import { Auto, BusArticulado, Cronometro, Estudio, FONT, Frases, MONOF, RE, Reflejo, Semaforo, Torre } from "./real-kit";
import { H, W } from "../comun";

type P = { e: EscenaViralGuardada };

/** Texto pequeño de fuente (mono) al pie, dentro de la zona segura. */
export const Fuente: React.FC<{ texto: string; y?: number; delay?: number }> = ({ texto, y = 1618, delay = 1 }) => {
  const { t, a } = useReloj();
  return <div data-texto="fuente" style={{ position: "absolute", left: 104, top: y, width: W - 208, textAlign: "left", fontFamily: MONOF, fontSize: 22, lineHeight: 1.35, color: RE.hielo, opacity: 0.62 * clamp((t - a(delay)) / 0.6) }}>{texto}</div>;
};

/** Rótulo de dato: cifra grande (odómetro) y su explicación. */
export const Dato: React.FC<{ valor: number; x: number; y: number; px: number; digitos: number; color?: string; sufijo?: string; prefijo?: string; etiqueta?: string; etiquetaY?: number; decimales?: number; alinear?: "center" | "left" | "right"; opacidad?: number; id?: string; sinSep?: boolean }> = ({ valor, x, y, px, digitos, color = RE.oro, sufijo, prefijo, etiqueta, etiquetaY, decimales = 0, alinear = "center", opacidad = 1, id = "dato", sinSep }) => (
  <>
    <Odometro valor={valor} x={x} y={y} px={px} digitos={digitos} color={color} sufijo={sufijo} prefijo={prefijo} decimales={decimales} alinear={alinear} id={id} opacidad={opacidad} separador={sinSep ? "" : "."} />
    {etiqueta && <div data-texto={`${id}-etq`} style={{ position: "absolute", left: alinear === "center" ? x - 420 : alinear === "left" ? x : x - 840, width: alinear === "center" ? 840 : 840, top: etiquetaY ?? y + px * 0.78, textAlign: alinear, fontFamily: FONT, fontWeight: 600, fontSize: 36, lineHeight: 1.2, color: RE.blanco, opacity: opacidad * 0.92 }}>{etiqueta}</div>}
  </>
);

/* ───────────── real-historia ───────────── */

type TorreDef = { x: number; w: number; h: number; tono: string; semilla: number };
const construirSkyline = (n: number, xMin: number, xMax: number, hMin: number, hMax: number, semilla: number, apagado = 0): TorreDef[] =>
  Array.from({ length: n }, (_, i) => {
    const u = (i + 0.5) / n;
    const campana = Math.exp(-Math.pow((u - 0.52) / 0.3, 2));
    return {
      x: lerp(xMin, xMax, u),
      w: 54 + azar(i * 3.3 + semilla) * 44,
      h: lerp(hMin, hMax, 0.2 + 0.8 * campana * (0.55 + 0.45 * azar(i * 7.1 + semilla))),
      tono: mezclar(["#2B5C86", "#2F7A8E", "#3C5C9A", "#4B6E86", "#2A4F7A"][i % 5], "#0B1828", apagado),
      semilla: i + semilla,
    };
  });

export const RealHistoria: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const PISO = 1180;
  const delante = useMemo(() => construirSkyline(22, 70, 1010, 190, 700, 1), []);
  const detras = useMemo(() => construirSkyline(26, 40, 1040, 130, 470, 40, 0.55), []);
  const k = easeInOut((t - a(TR.historia.ini)) / a(TR.historia.dur));
  const alto = (d: TorreDef, i: number, h0: number): number => lerp(h0, d.h, easeOut(clamp((t - a(TR.historia.ini) - i * 0.07) / a(TR.historia.dur * 0.7))));
  const anio = 1942 + 83 * k;
  const pob = 400000 + (7942867 - 400000) * k;
  return (
    <Estudio piso={PISO} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Reflejo piso={PISO} intensidad={0.2}>
          {detras.map((d, i) => <Torre key={`b${i}`} x={d.x} y={PISO} w={d.w * 0.9} h={alto(d, i, 16)} semilla={d.semilla} luz={0.35} tono={d.tono} lado={0.16} />)}
          {delante.map((d, i) => <Torre key={`f${i}`} x={d.x} y={PISO} w={d.w} h={alto(d, i, 26 + azar(i) * 26)} semilla={d.semilla} luz={0.18 + 0.5 * k} tono={d.tono} />)}
        </Reflejo>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "¿sabías que" }, { t: 1.7, texto: "77 años", color: RE.oro, px: 130 }, { t: 3.6, texto: "esperando" }, { t: 5.0, texto: "un metro?", color: RE.rojo }]} y={400} />
      <Dato valor={anio} x={W / 2} y={1400} px={150} digitos={4} sinSep id="historia-anio" opacidad={clamp((t - 0.4) / 0.5)} />
      <Dato valor={pob} x={W / 2} y={1536} px={74} digitos={7} color={RE.blanco} etiqueta="habitantes (hoy ≈ 7,9 millones)" etiquetaY={1604} id="historia-pob" opacidad={clamp((t - 0.6) / 0.5)} />
    </Estudio>
  );
};

/* ───────────── real-trancon ───────────── */

export const RealTrancon: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const PISO = 1250;
  const k = easeInOut((t - a(TR.trancon.ini)) / a(TR.trancon.dur));
  const horas = 191 * k;
  const vueltas = (horas / 24) % 1;
  const arrastre = (t * 7) % 40;
  const pulso = 0.7 + 0.3 * Math.sin(t * 5);
  const dias = horas / 24;
  return (
    <Estudio piso={PISO} resplandor={0.5} centroX={W / 2}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Cronometro x={W / 2} y={790} r={220} valor={vueltas} arco={vueltas} etiqueta="HORAS" numeros={["24", "2", "4", "6", "8", "10", "12", "14", "16", "18", "20", "22"]} color={RE.rojo} />
        <Reflejo piso={PISO} intensidad={0.22}>
          <Auto x={230 + arrastre * 0.2} y={PISO} s={1.0} taxi color="#F2B705" freno={pulso} />
          <Auto x={560 + arrastre * 0.12} y={PISO} s={1.0} color="#C8281E" freno={pulso} />
          <Auto x={850} y={PISO} s={0.95} color="#E8EDF2" freno={1} />
          <Semaforo x={1000} y={PISO} s={1.0} luz="rojo" />
        </Reflejo>
      </svg>
      <Frases frases={[{ t: 0.3, texto: "2019" }, { t: 1.6, texto: "191 horas", color: RE.oro, px: 124 }, { t: 4.6, texto: "perdidas" }, { t: 6.4, texto: "en el trancón", color: RE.rojo }, { t: 8.6, texto: "el peor del mundo", px: 84 }]} y={400} />
      <Dato valor={horas} x={W / 2} y={1420} px={170} digitos={3} sufijo="h" id="trancon-horas" opacidad={clamp((t - 1) / 0.5)} />
      {/* ocho días: siete llenos y uno casi lleno */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 8 }, (_, i) => {
          const lleno = clamp(dias - i);
          return (
            <g key={i}>
              <rect x={108 + i * 112} y={1520} width={96} height={34} rx={9} fill="#0C1A2A" stroke={RE.hielo} strokeOpacity={0.4} strokeWidth={2} />
              <rect x={108 + i * 112} y={1520} width={96 * lleno} height={34} rx={9} fill={RE.rojo} />
            </g>
          );
        })}
      </svg>
      <div data-texto="trancon-dias" style={{ position: "absolute", left: 104, top: 1566, width: W - 208, textAlign: "left", fontFamily: FONT, fontWeight: 700, fontSize: 38, color: RE.blanco, opacity: clamp((t - a(5.8)) / 0.5) }}>casi 8 días enteros al año, por conductor</div>
      <Fuente texto="INRIX · Global Traffic Scorecard 2019 (191 h; 1.º del mundo)" delay={6.5} />
    </Estudio>
  );
};

/* ───────────── real-bus ───────────── */

export const RealBus: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const PISO = 1130;
  const llega = easeOut((t - a(TR.bus.llega)) / a(TR.bus.llegaDur));
  const x = lerp(-420, 520, llega);
  const frena = clamp(1 - llega * 1.2);
  const gente = Math.round(lerp(1, 9, easeOut((t - a(TR.bus.llega + 0.6)) / a(2.4))));
  const cifra = easeOut((t - a(TR.bus.cifra)) / a(TR.bus.cifraDur));
  const pulso = 0.6 + 0.4 * Math.sin(t * 6);
  return (
    <Estudio piso={PISO} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Reflejo piso={PISO}>
          <Semaforo x={1000} y={PISO} s={0.95} luz={llega > 0.9 ? "rojo" : "ambar"} />
          <BusArticulado x={x} y={PISO} s={1.16} pasajeros={gente} freno={llega > 0.85 ? pulso : frena} rot={x * 1.6} />
        </Reflejo>
        {/* líneas de velocidad mientras llega */}
        {llega < 0.95 && [0, 1, 2, 3].map((i) => <line key={i} x1={x - 520 - i * 30} x2={x - 380 - i * 60} y1={PISO - 130 - i * 34} y2={PISO - 130 - i * 34} stroke="#fff" strokeOpacity={0.22 * (1 - llega)} strokeWidth={3} strokeLinecap="round" />)}
      </svg>
      <Frases frases={[{ t: 0.3, texto: "TransMilenio" }, { t: 2.6, texto: "43.000", color: RE.oro, px: 132 }, { t: 4.8, texto: "por hora" }, { t: 6.6, texto: "pero va por la calle", color: RE.rojo, px: 80 }]} y={400} />
      <Dato valor={43000 * cifra} x={W / 2} y={1350} px={150} digitos={5} etiqueta="personas por hora y por sentido" etiquetaY={1440} id="bus-cifra" opacidad={clamp(cifra * 6)} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {[[104, "≈ 150 por bus"], [560, "22–24 km/h"]].map(([x, tx], i) => {
          const op = clamp((t - a(5.2 + i * 0.7)) / 0.5);
          return (
            <g key={tx as string} opacity={op}>
              <rect x={x as number} y={1500} width={416} height={70} rx={35} fill="#0C1A2A" fillOpacity={0.7} stroke={i ? RE.rojo : RE.hielo} strokeOpacity={0.8} strokeWidth={3} />
              <text x={(x as number) + 208} y={1546} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={38} fill={i ? RE.rojo : RE.blanco}>{tx as string}</text>
            </g>
          );
        })}
      </svg>
      <Fuente texto="Universidad Javeriana · medición del corredor (43.000 pas/h·sentido; 150 pas/bus; 22–24 km/h)" delay={6} />
    </Estudio>
  );
};
