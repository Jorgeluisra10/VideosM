/**
 * «Los cuadernos radiactivos de Marie Curie» (SINAPSIS · historia de la medicina) · escenas 2/2
 *   mc-nobel     dos Nobel (Física 1903 y Química 1911): primera mujer y única persona premiada en dos ciencias
 *   mc-guerra    Primera Guerra Mundial: ambulancias con rayos X («pequeñas Curies») para localizar balas y fracturas
 *   mc-riesgo    manejaba tubos y sales de radio sin protección; murió en 1934, probablemente por la radiación
 *   mc-cuadernos sus cuadernos están en cajas de plomo y tardarán ≈ 1.500 años en perder la mitad de su radiactividad
 * Dibujos esquemáticos; no son imágenes de la época.
 */
import React from "react";
import { MCU, TMC, fraccionRestante } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases, FONT, MONOF } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Mano } from "./rx-kit";
import { Ambiente, CajaPlomo, Chip, Cuaderno, Geiger, LineaH, MC, Mujer, SERIF, Trebol, Vial } from "./mc-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── mc-nobel ───────────── */

const Medalla: React.FC<{ x: number; y: number; k: number; anio: number; campo: string }> = ({ x, y, k, anio, campo }) => (
  <g opacity={clamp(k * 2)} transform={`translate(${x} ${y}) scale(${0.6 + 0.4 * clamp(k)}) translate(${-x} ${-y})`}>
    <circle cx={x} cy={y} r={230} fill={MC.oro} opacity={0.16} />
    <circle cx={x} cy={y} r={170} fill="url(#mcn-oro)" stroke="#8A5A10" strokeWidth={8} />
    <circle cx={x} cy={y} r={138} fill="none" stroke="#8A5A10" strokeWidth={4} strokeOpacity={0.6} />
    <text x={x} y={y - 36} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={36} fill="#5A3A08">NOBEL</text>
    <text x={x} y={y + 40} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={84} fill="#5A3A08">{anio}</text>
    <text x={x} y={y + 90} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={28} fill="#5A3A08" letterSpacing="0.12em">{campo}</text>
    <ellipse cx={x - 52} cy={y - 100} rx={52} ry={20} fill="#fff" opacity={0.35} transform={`rotate(-28 ${x - 52} ${y - 100})`} />
  </g>
);

export const McNobel: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const N = TMC.nobel;
  const k1 = spr(f, a(N.medalla1), { damping: 11, stiffness: 150, mass: 0.9 });
  const k2 = spr(f, a(N.medalla2), { damping: 11, stiffness: 150, mass: 0.9 });
  const kM = spr(f, a(N.mujer), { damping: 12, stiffness: 160, mass: 0.8 });
  const kU = spr(f, a(N.unica), { damping: 12, stiffness: 160, mass: 0.8 });
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><radialGradient id="mcn-oro" cx="38%" cy="32%" r="80%"><stop offset="0" stopColor="#FFF3B8" /><stop offset="0.45" stopColor="#FFD166" /><stop offset="1" stopColor="#B07A1E" /></radialGradient></defs>
        <Ambiente t={t} y={880} intensidad={0.5} />
        <Medalla x={290} y={880} k={k1} anio={MCU.nobelFisica} campo="FÍSICA" />
        <Medalla x={790} y={880} k={k2} anio={MCU.nobelQuimica} campo="QUÍMICA" />
        <LineaH pos={3} y={1430} />
      </svg>
      <div data-texto="mc-nobel-mujer" style={{ position: "absolute", left: 90, top: 1130, width: 900, textAlign: "center", opacity: clamp(kM * 2), transform: `scale(${0.85 + 0.15 * clamp(kM)})`, fontFamily: FONT, fontWeight: 900, fontSize: 52, color: MC.rad, textShadow: "0 4px 20px #000" }}>1.ª MUJER EN GANARLO</div>
      <div data-texto="mc-nobel-unica" style={{ position: "absolute", left: 90, top: 1204, width: 900, textAlign: "center", opacity: clamp(kU * 2), transform: `scale(${0.85 + 0.15 * clamp(kU)})`, fontFamily: FONT, fontWeight: 800, fontSize: 38, lineHeight: 1.15, color: "#fff", textShadow: "0 4px 20px #000" }}>ÚNICA PERSONA PREMIADA<br />EN <span style={{ color: MC.oro }}>DOS CIENCIAS</span> DISTINTAS</div>
      <Frases frases={[{ t: 0.2, texto: "DOS NOBEL", px: 124 }, { t: N.medalla1, texto: "FÍSICA Y\nQUÍMICA", px: 104, color: MC.oro }, { t: N.mujer - 0.1, texto: "LA PRIMERA\nMUJER", px: 100, color: MC.rad }, { t: N.unica - 0.1, texto: "ÚNICA EN\nDOS CIENCIAS", px: 96, color: MC.oro }]} y={450} x={104} id="titular-mc-nobel" />
      <Fuente texto="Nobel de Física 1903 (junto a Pierre Curie y Henri Becquerel) y de Química 1911 (en solitario, por el aislamiento del radio). Dibujo esquemático." y={1510} delay={N.mujer} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── mc-guerra ───────────── */

export const McGuerra: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TMC.guerra;
  const kF = easeOut((t - a(G.furgon)) / 1.0);
  const kR = clamp((t - a(G.rayos)) / 0.6);
  const kAp = spr(f, a(G.apodo), { damping: 11, stiffness: 170, mass: 0.8 });
  const kCi = clamp((t - a(G.cifras)) / 0.5);
  const kFe = clamp((t - a(G.fecha)) / 0.4);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={900} intensidad={0.45} />
        {/* furgón */}
        <g transform={`translate(${lerp(-300, 330, kF)} 960)`} opacity={clamp(kF * 3)}>
          <rect x={-190} y={-130} width={380} height={190} rx={18} fill="#5A6A52" stroke="#2A3224" strokeWidth={6} />
          <rect x={120} y={-100} width={100} height={150} rx={14} fill="#5A6A52" stroke="#2A3224" strokeWidth={6} /><rect x={140} y={-84} width={64} height={52} rx={6} fill="#9EC8E0" />
          <rect x={-150} y={-100} width={110} height={70} rx={6} fill="#2A3224" /><Trebol x={-95} y={-65} r={26} />
          <circle cx={-110} cy={64} r={46} fill="#1B1B22" stroke="#4A4A56" strokeWidth={8} /><circle cx={130} cy={64} r={46} fill="#1B1B22" stroke="#4A4A56" strokeWidth={8} />
          <circle cx={-110} cy={64} r={16} fill="#8A8A96" /><circle cx={130} cy={64} r={16} fill="#8A8A96" />
          <circle cx={20} cy={-62} r={34} fill="#F4EEE4" /><path d="M 20 -82 L 20 -42 M 0 -62 L 40 -62" stroke="#C2362F" strokeWidth={12} />
          <rect x={-30} y={-130} width={30} height={-30} fill="#2A3224" />
        </g>
        {/* rayos y placa con el brazo */}
        <g opacity={kR}>
          {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={560} y1={860 + i * 12} x2={700} y2={800 + i * 36} stroke={MC.rad} strokeWidth={4} strokeDasharray="4 14" strokeDashoffset={-t * 80} strokeLinecap="round" opacity={0.7} />)}
        </g>
        <g opacity={clamp(kR * 2)}>
          <rect x={690} y={690} width={290} height={400} rx={18} fill="#0A0F16" stroke="#3A404C" strokeWidth={6} />
          <g transform="translate(0 0)"><Mano x={835} y={940} s={0.42} modo="placa" /></g>
          <circle cx={845} cy={800} r={11} fill="#fff" /><circle cx={845} cy={800} r={26} fill="#fff" opacity={0.2} />
          <path d="M 805 880 l 22 -8 l -6 14 l 20 -6" stroke={MC.rojo} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.9} />
        </g>
        <LineaH pos={4} y={1430} />
      </svg>
      <Chip x={104} y={606} texto="1914 · PRIMERA GUERRA MUNDIAL" color={MC.oro} px={26} id="mc-guerra-fecha" opacidad={kFe} />
      <div data-texto="mc-guerra-apodo" style={{ position: "absolute", left: 90, top: 1090, width: 480, textAlign: "center", opacity: clamp(kAp * 2), transform: `scale(${0.8 + 0.2 * clamp(kAp)})`, fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 46, color: "#fff", textShadow: "0 4px 18px #000" }}>«petites Curies»</div>
      <Chip x={104} y={1190} texto={"≈ 20 vehículos · ≈ 200 salas fijas\n≈ 1 millón de heridos (estimación)"} color={MC.rad} px={26} id="mc-guerra-cifras" opacidad={kCi} />
      <Frases frases={[{ t: 0.2, texto: "1914: LA\nGUERRA", px: 100 }, { t: G.furgon - 0.1, texto: "AMBULANCIAS\nCON RAYOS X", px: 92, color: MC.rad }, { t: G.rayos - 0.1, texto: "BALAS Y\nHUESOS ROTOS", px: 92 }, { t: G.apodo - 0.1, texto: "«PEQUEÑAS\nCURIES»", px: 100, color: MC.oro }]} y={450} x={104} id="titular-mc-guerra" />
      <Fuente texto="≈ 20 vehículos radiológicos y ≈ 200 instalaciones fijas; Curie habló de ≈ 900.000 heridos examinados, otras fuentes de más de un millón (estimaciones). Esquema." y={1510} delay={G.cifras} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── mc-riesgo ───────────── */

export const McRiesgo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const R = TMC.riesgo;
  const kTu = clamp((t - a(R.tubo)) / 0.5);
  const kSin = spr(f, a(R.sin), { damping: 12, stiffness: 150, mass: 0.8 });
  const kMu = clamp((t - a(R.muerte)) / 0.8);
  const kPr = clamp((t - a(R.prob)) / 0.4);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={950} intensidad={1 - 0.7 * kMu} />
        <Mujer x={540} y={790} s={1.3} mira={0} />
        {/* mesa con tubos */}
        <rect x={50} y={1010} width={980} height={34} rx={6} fill="#3A2A1C" stroke="#1A100A" strokeWidth={3} />
        <rect x={90} y={1044} width={900} height={170} fill="#1B120B" />
        {[140, 290, 430, 650, 790, 930].map((vx, i) => <g key={i} opacity={clamp(kTu * 3 - i * 0.3)}><Vial x={vx} y={1010} s={0.8 + (i % 2) * 0.1} brillo={(1 - 0.75 * kMu)} t={t + i} /></g>)}
        <g opacity={clamp(kSin * 2)}><Trebol x={900} y={760} r={60} /></g>
        {/* oscurece al llegar a 1934 */}
        <rect x={0} y={0} width={W} height={H} fill="#000" opacity={0.45 * kMu} />
        <LineaH pos={4.35} y={1430} />
      </svg>
      <Chip x={104} y={606} texto="SIN GUANTES NI PANTALLAS DE PLOMO" color={MC.rojo} px={24} id="mc-riesgo-sin" opacidad={clamp(kSin * 2)} />
      <div data-texto="mc-riesgo-1934" style={{ position: "absolute", left: 90, top: 1250, width: 900, textAlign: "center", opacity: kMu, transform: `scale(${0.85 + 0.15 * kMu})`, fontFamily: FONT, fontWeight: 900, fontSize: 96, color: "#fff", textShadow: "0 6px 30px #000" }}>1934</div>
      <Chip x={540} y={1176} texto="probablemente por la radiación" color={MC.oro} px={30} anchor="center" id="mc-riesgo-prob" opacidad={kPr} />
      <Frases frases={[{ t: 0.2, texto: "TUBOS DE RADIO", px: 100 }, { t: R.sin - 0.1, texto: "SIN\nPROTECCIÓN", px: 108, color: MC.rojo }, { t: R.muerte - 0.1, texto: "MURIÓ\nEN 1934", px: 108 }, { t: R.prob - 0.1, texto: "PROBABLEMENTE\nPOR LA RADIACIÓN", px: 80, color: MC.oro }]} y={450} x={104} id="titular-mc-riesgo" />
      <Fuente texto="Murió en julio de 1934; se atribuye probablemente a su exposición prolongada a la radiación (no hay un diagnóstico único). Dibujo esquemático." y={1510} delay={R.muerte} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── mc-cuadernos ───────────── */

export const McCuadernos: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TMC.cuadernos;
  const kC = clamp((t - a(C.caja)) / 0.8);
  const kV = clamp((t - a(C.vida)) / a(2.0));
  const kMi = spr(f, a(C.mitad), { damping: 11, stiffness: 170, mass: 0.8 });
  const kPe = spr(f, a(C.permiso), { damping: 12, stiffness: 150, mass: 0.8 });
  const X0 = 130, X1 = 950, Y0 = 880, Y1 = 660, ANIOS = 4500;
  const px = (an: number): number => lerp(X0, X1, an / ANIOS);
  const py = (fr: number): number => lerp(Y0, Y1, fr);
  const pts = Array.from({ length: 46 }, (_, i) => { const an = (i / 45) * ANIOS * kV; return `${px(an).toFixed(1)},${py(fraccionRestante(an, MCU.semividaAnios)).toFixed(1)}`; });
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} intensidad={0.7} />
        {/* gráfico de decaimiento */}
        <g opacity={clamp((t - a(C.vida) + 0.3) / 0.4)}>
          <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke={MC.hielo} strokeOpacity={0.5} strokeWidth={4} /><line x1={X0} y1={Y0} x2={X0} y2={Y1 - 30} stroke={MC.hielo} strokeOpacity={0.5} strokeWidth={4} />
          <text x={X0 - 14} y={Y1 + 4} textAnchor="end" fontFamily={MONOF} fontWeight={800} fontSize={22} fill={MC.hielo}>100 %</text>
          <text x={X0 - 14} y={py(0.5) + 6} textAnchor="end" fontFamily={MONOF} fontWeight={800} fontSize={22} fill={MC.oro}>50 %</text>
          <text x={X1} y={Y0 + 34} textAnchor="end" fontFamily={MONOF} fontWeight={700} fontSize={20} fill={MC.hielo}>años desde hoy →</text>
          <polyline points={pts.join(" ")} fill="none" stroke={MC.rad} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          <g opacity={clamp(kMi * 2)}>
            <line x1={X0} y1={py(0.5)} x2={px(MCU.semividaAnios)} y2={py(0.5)} stroke={MC.oro} strokeWidth={4} strokeDasharray="10 10" /><line x1={px(MCU.semividaAnios)} y1={py(0.5)} x2={px(MCU.semividaAnios)} y2={Y0} stroke={MC.oro} strokeWidth={4} strokeDasharray="10 10" />
            <circle cx={px(MCU.semividaAnios)} cy={py(0.5)} r={16} fill={MC.oro} stroke="#fff" strokeWidth={5} />
            <text x={px(MCU.semividaAnios)} y={Y0 + 34} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={24} fill={MC.oro}>≈ 1.500</text>
          </g>
        </g>
        {/* caja de plomo con el cuaderno */}
        <g opacity={clamp(kC * 2)}><CajaPlomo x={330} y={1190} s={0.8} tapa={0} /></g>
        <Geiger x={940} y={1190} s={0.42} nivel={0.55} t={t} />
        {/* exención de responsabilidad */}
        <g opacity={clamp(kPe * 2)} transform={`translate(690 1210) rotate(-4) scale(${0.7 + 0.3 * clamp(kPe)})`}>
          <rect x={-130} y={-70} width={260} height={140} rx={6} fill={MC.papel} stroke="#8A7C5A" strokeWidth={3} />
          <text x={0} y={-36} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={19} fill="#2A2418">EXENCIÓN DE</text><text x={0} y={-14} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={19} fill="#2A2418">RESPONSABILIDAD</text>
          <path d="M -90 28 C -60 4 -40 52 -10 22 S 40 30 80 20" stroke="#1A3A8A" strokeWidth={4} fill="none" strokeLinecap="round" /><line x1={-100} y1={44} x2={100} y2={44} stroke="#8A7C5A" strokeWidth={2} />
        </g>
        <LineaH pos={5} y={1440} />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "HOY, EN CAJAS\nDE PLOMO", px: 92 }, { t: C.vida - 0.1, texto: "≈ 1.500 AÑOS", px: 116, color: MC.rad }, { t: C.mitad - 0.1, texto: "PARA PERDER LA\nMITAD", px: 88, color: MC.oro }]} y={450} x={104} id="titular-mc-cuadernos" />
      <Chip x={540} y={1296} texto="para leerlos hay que firmar una exención de responsabilidad" color={MC.hielo} px={20} anchor="center" id="mc-cuad-permiso" opacidad={clamp(kPe * 2)} />
      <Fuente texto="Radio-226 (semivida ≈ 1.600 años): ≈ 1.500 años es el tiempo para que su radiactividad se reduzca a la MITAD, no a cero. Fuentes secundarias (CSM, Business Insider). Curva esquemática." y={1520} delay={C.mitad} />
      <Cap e={e} />
    </Fondo>
  );
};
