/**
 * «La noche que Röntgen vio a través de la piel» (SINAPSIS · historia de la medicina) · escenas 1/2
 *   rx-gancho  una pantalla verde brilla en la oscuridad, aparecen huesos y el contador llega a 131 años (8 nov 1895 → 8 nov 2026)
 *   rx-tubo    Würzburg, 1895: el tubo cubierto con cartón negro, la luz se apaga y una pantalla cercana brilla
 *   rx-huesos  rayos invisibles atraviesan el cartón; al interponer la mano aparecen sus huesos en la pantalla
 *   rx-x       no sabía qué eran: «X», la letra de la incógnita
 * Dibujos esquemáticos; no son imágenes históricas. Los detalles del relato (p. ej. cuándo vio sus huesos) son los más difundidos y no se pueden comprobar: sus cuadernos se quemaron.
 */
import React from "react";
import { RXH, TRX, aniversarioAnios } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, mezclar, spr, useReloj } from "../comun";
import { Frases, FONT, MONOF } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Linea, Mano, Pantalla, RX, Rayos, TuboCrookes, azar, sua } from "./rx-kit";

type P = { e: EscenaViralGuardada };
const Polvo: React.FC<{ t: number; n?: number; color?: string }> = ({ t, n = 18, color = RX.verde }) => (
  <>{Array.from({ length: n }, (_, i) => {
    const x = azar(i * 3.1) * W + Math.sin(t * 0.3 + i) * 30, y = ((azar(i * 5.7) * H - t * (10 + azar(i) * 22)) % H + H) % H;
    return <circle key={i} cx={x} cy={y} r={2 + azar(i * 2.9) * 4} fill={color} opacity={0.08 + 0.12 * azar(i * 7.7)} />;
  })}</>
);
const Chip: React.FC<{ x: number; y: number; texto: string; color?: string; px?: number; opacidad?: number; id: string; anchor?: "left" | "center" }> = ({ x, y, texto, color = RX.oro, px = 28, opacidad = 1, id, anchor = "left" }) => (
  <div data-texto={id} style={{ position: "absolute", left: anchor === "left" ? x : x - 450, top: y, width: anchor === "left" ? undefined : 900, textAlign: anchor, opacity: opacidad, fontFamily: MONOF, fontWeight: 800, fontSize: px, letterSpacing: "0.06em", color, textShadow: "0 4px 18px rgba(0,0,0,0.85)", whiteSpace: "pre" }}>{texto}</div>
);

/* ───────────── rx-gancho ───────────── */

export const RxGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TRX.gancho;
  const kP = clamp((t - a(G.pantalla)) / 0.7);
  const kH = easeOut((t - a(G.huesos)) / 0.9);
  const pc = easeOut((t - a(G.anios)) / a(G.aniosDur));
  const n = Math.round(aniversarioAnios(RXH.hoyAnio, RXH.descubrimiento.a) * pc);
  const ks = spr(f, a(G.titulo), { damping: 14, stiffness: 100, mass: 0.9 });
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Polvo t={t} />
        <g opacity={clamp(ks * 2)}>
          <Pantalla x={240} y={630} w={600} h={600} brillo={0.06 + 0.94 * kP} t={t}>
            <Mano x={300} y={440} s={0.8} modo="pantalla" huesos={kH} carne={clamp(kH * 1.6)} opacidad={clamp(kH * 2)} />
          </Pantalla>
        </g>
        <Linea pos={5 * pc} y={1420} />
      </svg>
      <Chip x={540} y={1290} texto="8 NOV 1895  →  8 NOV 2026" color={RX.hielo} px={32} anchor="center" id="rx-gancho-fechas" opacidad={clamp((t - a(G.anios)) / 0.4)} />
      <Frases frases={[{ t: 0.2, texto: "ESTE DOMINGO\nSE CUMPLEN", px: 92 }, { t: G.anios, texto: `${n} AÑOS`, px: 140, color: RX.oro }, { t: G.huesos - 0.4, texto: "UN FÍSICO VIO\nSUS PROPIOS HUESOS", px: 84, color: RX.verde }]} y={450} x={104} id="titular-rx-gancho" />
      <Fuente texto="Descubrimiento de los rayos X: Wilhelm Röntgen, Würzburg, 8 de noviembre de 1895. Dibujo esquemático, no es una imagen histórica." y={1500} delay={G.anios} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── rx-tubo ───────────── */

export const RxTubo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TRX.tubo;
  const kCar = clamp((t - a(T.carton)) / 0.7);
  const luz = 1 - sua(t, a(T.luz), a(T.luz) + 0.12);
  const kBr = sua(t, a(T.brilla), a(T.brilla) + 0.8);
  const kChip = spr(f, a(T.chip), { damping: 14, stiffness: 140, mass: 0.7 });
  const kBob = clamp((t - a(T.bobina)) / 0.4);
  const chispa = kBob * (0.5 + 0.5 * Math.sin(t * 43) * Math.sin(t * 17));
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="rxt-cono" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD9A0" stopOpacity="0.55" /><stop offset="1" stopColor="#FFD9A0" stopOpacity="0.02" /></linearGradient>
        </defs>
        <Polvo t={t} n={12} color="#BFE0FF" />
        {/* lámpara de la sala: se apaga */}
        <g opacity={luz}>
          <polygon points="840,690 700,1060 990,1060" fill="url(#rxt-cono)" />
          <rect x={832} y={600} width={16} height={92} fill="#6A5A48" />
          <ellipse cx={840} cy={694} rx={44} ry={16} fill="#FFE2A8" />
        </g>
        {/* mesa */}
        <rect x={60} y={1060} width={960} height={14} rx={7} fill="#2A2F38" />
        <rect x={60} y={1074} width={960} height={160} fill="#0D1016" />
        {/* bobina de inducción */}
        <g opacity={clamp(kBob * 2)}>
          <rect x={190} y={1110} width={230} height={100} rx={14} fill="#3A2A1C" stroke="#8A5A32" strokeWidth={4} />
          {Array.from({ length: 11 }, (_, i) => <line key={i} x1={210 + i * 18} y1={1120} x2={210 + i * 18} y2={1200} stroke="#C98A4A" strokeWidth={5} opacity={0.8} />)}
          <path d="M 300 1110 L 300 1060" stroke="#C98A4A" strokeWidth={5} />
          <path d={`M 300 1060 L ${288 + chispa * 14} 1030 L ${312 - chispa * 10} 1006 L 300 984`} stroke={RX.azul} strokeWidth={4} fill="none" strokeLinecap="round" opacity={chispa} />
        </g>
        <TuboCrookes x={300} y={900} s={0.9} t={t} energia={kBob * 0.95} carton={kCar} />
        {/* rayos invisibles y pantalla */}
        <Rayos x1={466} y1={900} x2={715} y2={890} t={t} opacidad={kBr * 0.9} n={5} abierto={110} />
        <Pantalla x={720} y={770} w={200} h={290} brillo={kBr * 0.95 + 0.04} t={t} />
        <circle cx={820} cy={915} r={150} fill={RX.verde} opacity={0.1 * kBr} />
      </svg>
      <Chip x={104} y={600} texto="8 NOV 1895 · WÜRZBURG" px={30} id="rx-tubo-chip" opacidad={clamp(kChip * 2)} />
      <Chip x={300} y={1256} texto={"tubo cubierto con\ncartón negro"} color={RX.hielo} px={25} anchor="center" id="rx-tubo-carton" opacidad={clamp((t - a(T.carton) - 0.4) / 0.5)} />
      <Chip x={820} y={1256} texto={"pantalla con\nplatinocianuro de bario"} color={RX.verde} px={22} anchor="center" id="rx-tubo-pantalla" opacidad={clamp((t - a(T.brilla)) / 0.5)} />
      <Frases frases={[{ t: 0.2, texto: "EN WÜRZBURG,\nUN EXPERIMENTO", px: 88 }, { t: T.carton, texto: "CUBRE EL TUBO\nCON CARTÓN NEGRO", px: 84, color: RX.hielo }, { t: T.luz, texto: "APAGA\nLA LUZ…", px: 110 }, { t: T.brilla, texto: "…Y LA PANTALLA\nBRILLA", px: 92, color: RX.verde }]} y={450} x={104} id="titular-rx-tubo" />
      <Fuente texto="Tubo de rayos catódicos y pantalla con platinocianuro de bario (fluorescente). Dibujo esquemático, no es una imagen histórica." y={1500} delay={T.carton} />
      <Linea pos={0} y={1420} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── rx-huesos ───────────── */

export const RxHuesos: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const Hs = TRX.huesos;
  const kR = sua(t, a(Hs.rayos), a(Hs.rayos) + 0.6);
  const km = easeOut((t - a(Hs.mano)) / a(Hs.manoDur));
  const kSombra = sua(t, a(Hs.mano) + 0.6, a(Hs.mano) + 1.4);
  const kH = sua(t, a(Hs.huesos), a(Hs.huesos) + 0.9);
  const kCuenta = clamp((t - a(Hs.cuenta)) / 0.4);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Polvo t={t} n={12} color="#BFE0FF" />
        <rect x={60} y={1130} width={960} height={14} rx={7} fill="#2A2F38" />
        <TuboCrookes x={250} y={900} s={0.8} t={t} energia={0.95} carton={1} />
        <Rayos x1={398} y1={900} x2={636} y2={880} t={t} opacidad={kR} n={7} abierto={120} />
        <Pantalla x={640} y={650} w={340} h={480} brillo={0.95} t={t}>
          <Mano x={170} y={262} s={0.62} modo="pantalla" huesos={kH} carne={kSombra} />
        </Pantalla>
        {/* la mano real, entre el tubo y la pantalla */}
        <Mano x={520} y={lerp(1520, 975, km)} s={0.7} piel="#C8987A" huesos={0} opacidad={clamp(km * 3) * (1 - 0.35 * kSombra)} />
      </svg>
      <Chip x={104} y={1190} texto="rayos invisibles: atraviesan el cartón" color={RX.azul} px={26} id="rx-huesos-rayos" opacidad={clamp((t - a(Hs.rayos) - 0.2) / 0.5)} />
      <Chip x={104} y={1236} texto="«según se cuenta…»" color={RX.oro} px={30} id="rx-huesos-cuenta" opacidad={kCuenta} />
      <Frases frases={[{ t: 0.2, texto: "RAYOS\nINVISIBLES", px: 108, color: RX.azul }, { t: Hs.mano - 0.2, texto: "INTERPONE\nSU MANO…", px: 100 }, { t: Hs.huesos - 0.3, texto: "…Y VE SUS\nPROPIOS HUESOS", px: 90, color: RX.verde }]} y={450} x={104} id="titular-rx-huesos" />
      <Fuente texto="En la pantalla fluorescente los huesos aparecen como sombra. El relato de ese momento es el más difundido; no se puede comprobar (los cuadernos de Röntgen se quemaron)." y={1500} delay={Hs.cuenta} />
      <Linea pos={0.5} y={1420} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── rx-x ───────────── */

export const RxX: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const X = TRX.x;
  const kx = easeOut((t - a(X.x)) / 0.6);
  const kq = clamp((t - a(X.pregunta)) / 0.5), colapso = easeOut((t - a(X.x) + 0.2) / 0.5);
  const kInc = spr(f, a(X.incognita), { damping: 12, stiffness: 170, mass: 0.7 });
  const pulso = 1 + 0.04 * Math.sin(t * 5) * kx;
  const L = 640;                                         // largo de cada trazo de la X
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><filter id="rxx-glo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14" /></filter></defs>
        {/* símbolos de álgebra que flotan */}
        {Array.from({ length: 14 }, (_, i) => {
          const x = azar(i * 4.1) * (W - 160) + 80, y = ((azar(i * 6.3) * 1400 - t * (14 + 10 * azar(i))) % 1400 + 1400) % 1400 + 300;
          return <text key={i} x={x} y={y} fontFamily={MONOF} fontWeight={700} fontSize={44 + azar(i * 9.1) * 30} fill={RX.hielo} opacity={0.07 + 0.05 * azar(i)}>{["x", "y", "?", "z", "=", "∞"][i % 6]}</text>;
        })}
        {/* la X que se dibuja */}
        <g transform={`translate(540 900) scale(${pulso}) translate(-540 -900)`} opacity={clamp(kx * 3)}>
          {[[0, 0, 1], [1, 0, 1]].map(([k], i) => {
            const x1 = k ? 780 : 300, x2 = k ? 300 : 780;
            return (
              <g key={i}>
                <line x1={x1} y1={620} x2={x2} y2={1180} stroke={RX.verde} strokeWidth={46} strokeLinecap="round" opacity={0.5} filter="url(#rxx-glo)" strokeDasharray={`${L * 1.2 * kx} 2000`} />
                <line x1={x1} y1={620} x2={x2} y2={1180} stroke={mezclar(RX.verde, "#FFFFFF", 0.3)} strokeWidth={30} strokeLinecap="round" strokeDasharray={`${L * 1.2 * kx} 2000`} />
              </g>
            );
          })}
        </g>
        {/* signos de interrogación que giran y se funden con la X */}
        {Array.from({ length: 8 }, (_, i) => {
          const an = (i / 8) * Math.PI * 2 + t * 0.9, r = lerp(360, 40, colapso) + 14 * Math.sin(t * 3 + i);
          return <text key={i} x={540 + Math.cos(an) * r} y={900 + Math.sin(an) * r * 0.8 + 30} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={84} fill={RX.oro} opacity={clamp(kq * 2) * (1 - colapso * 0.85)}>?</text>;
        })}
      </svg>
      <div data-texto="rx-x-ecuacion" style={{ position: "absolute", left: 90, top: 1240, width: 900, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 70, color: RX.oro, opacity: clamp(kInc * 2), transform: `scale(${0.8 + 0.2 * clamp(kInc)})` }}>X = <span style={{ color: "#fff" }}>lo desconocido</span></div>
      <Frases frases={[{ t: 0.2, texto: "NO SABÍA\nQUÉ ERAN", px: 104 }, { t: X.x, texto: "LOS LLAMÓ\nRAYOS X", px: 104, color: RX.verde }, { t: X.incognita, texto: "LA LETRA DE\nLA INCÓGNITA", px: 88, color: RX.oro }]} y={450} x={104} id="titular-rx-x" />
      <Linea pos={0.9} y={1420} />
      <Cap e={e} />
    </Fondo>
  );
};
