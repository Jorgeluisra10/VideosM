/**
 * «La cena en que tres médicos se durmieron» (SINAPSIS · historia de la anestesia) · escenas 1/2
 *   an-gancho   4 nov 1847: tres médicos se desmayan en una cena, a propósito; han pasado 179 años
 *   an-carrera  antes de la anestesia operar era una carrera: Robert Liston, según se cuenta, amputaba una pierna en ≈ 30 s
 *   an-eter     16 oct 1846, Boston: el éter funciona, pero irrita y huele muy fuerte
 *   an-busca    Edimburgo: Simpson y sus ayudantes prueban sustancias hasta dar con el cloroformo
 * Dibujos esquemáticos; no son imágenes de la época. Los detalles de la cena son los del relato más difundido (hay versiones embellecidas).
 */
import React from "react";
import { ANE, TAN, aniversarioAnios } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases, FONT, MONOF } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { AN, Botella, Cena, Chip, Crono, LineaT, Persona, Sala, azar } from "./an-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── an-gancho ───────────── */

export const AnGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TAN.gancho;
  const n = Math.round(aniversarioAnios(ANE.hoyAnio, ANE.cena.a) * easeOut((t - a(G.anios)) / a(G.aniosDur)));
  const est = [0, 1, 2].map((i) => clamp(spr(f, a(G.cae + i * 0.45), { damping: 14, stiffness: 70, mass: 1.1 }))) as [number, number, number];
  const kc = clamp((t - a(G.cae)) / 0.5);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Sala t={t} y={900} />
        <Cena t={t} est={est} brilloBotella={0.3 + 0.7 * kc} ojos={1} zzz={clamp((t - a(G.cae) - 1) / 0.6)} />
        <LineaT pos={2} y={1420} />
      </svg>
      <Chip x={104} y={612} texto="EDIMBURGO · 4 NOV 1847" px={30} id="an-gancho-chip" opacidad={clamp((t - a(G.fecha)) / 0.5)} />
      <Frases frases={[{ t: 0.2, texto: "UN 4 DE NOVIEMBRE\nDE 1847", px: 84 }, { t: G.anios, texto: `HACE ${n} AÑOS`, px: 112, color: AN.oro }, { t: G.cae - 0.2, texto: "TRES MÉDICOS\nSE DESMAYAN", px: 100 }, { t: G.proposito - 0.1, texto: "…Y FUE\nA PROPÓSITO", px: 104, color: AN.cloro }]} y={450} x={104} id="titular-an-gancho" />
      <Fuente texto="Cena en casa del obstetra James Y. Simpson (Edimburgo, 4 nov 1847), según el relato más difundido. Dibujo esquemático, no es una imagen de la época." y={1500} delay={G.anios} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── an-carrera ───────────── */

export const AnCarrera: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TAN.carrera;
  const kL = spr(f, a(C.liston), { damping: 13, stiffness: 140, mass: 0.8 });
  const kT = clamp((t - a(C.treinta)) / 1.0);
  const prog = t < a(C.treinta) ? ((t * 0.9) % 1) : kT;
  const seg = Math.round(ANE.listonSeg * kT);
  const kCr = clamp((t - a(C.carrera)) / 0.5);
  const ojos = clamp((t - a(0.4)) / 0.3);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Sala t={t} x={400} y={950} intensidad={0.8} />
        {/* mesa de operaciones y paciente despierto */}
        <g opacity={clamp(ojos * 2)}>
          <rect x={70} y={1050} width={520} height={30} rx={6} fill={AN.madera} stroke="#2A1A0E" strokeWidth={3} />
          <rect x={110} y={1080} width={26} height={150} fill="#3A2412" /><rect x={520} y={1080} width={26} height={150} fill="#3A2412" />
          <rect x={120} y={992} width={430} height={58} rx={26} fill="#D8CDB4" stroke="#8A7C5A" strokeWidth={3} />
          <ellipse cx={170} cy={980} rx={52} ry={26} fill="#C9BEA0" />
          <circle cx={190} cy={940} r={50} fill="#E6B898" stroke="#7A5A44" strokeWidth={2} />
          <ellipse cx={176} cy={934} rx={11} ry={13} fill="#fff" /><ellipse cx={206} cy={934} rx={11} ry={13} fill="#fff" />
          <circle cx={178} cy={936} r={5} fill="#241A14" /><circle cx={208} cy={936} r={5} fill="#241A14" />
          <path d="M 170 970 Q 190 962 210 970" stroke="#7A3A3A" strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
        {/* público */}
        {Array.from({ length: 11 }, (_, i) => (
          <g key={i} opacity={clamp(kCr * 2)}><circle cx={110 + i * 86} cy={1262 + (i % 2) * 20} r={30} fill="#2A2230" /><ellipse cx={110 + i * 86} cy={1330 + (i % 2) * 20} rx={46} ry={34} fill="#201A28" />
            <ellipse cx={100 + i * 86} cy={1260 + (i % 2) * 20} rx={5} ry={7} fill="#fff" /><ellipse cx={120 + i * 86} cy={1260 + (i % 2) * 20} rx={5} ry={7} fill="#fff" /></g>
        ))}
        {/* cronómetro */}
        <g opacity={clamp(kCr * 2)}><Crono x={800} y={880} r={150} prog={prog} color={t < a(C.treinta) ? AN.oro : AN.rojo} texto={kT > 0 ? `≈ ${seg} s` : undefined} /></g>
        <LineaT pos={0} y={1420} />
      </svg>
      <Chip x={104} y={610} texto="PACIENTE DESPIERTO" color={AN.hielo} px={26} id="an-carrera-despierto" opacidad={ojos} />
      <div data-texto="an-carrera-liston" style={{ position: "absolute", left: 90, top: 1130, width: 900, textAlign: "center", opacity: clamp(kL * 2), transform: `translateY(${(1 - clamp(kL)) * 20}px)` }}>
        <span style={{ display: "inline-block", padding: "12px 30px", borderRadius: 40, background: "rgba(232,221,192,0.12)", border: "3px solid rgba(255,209,102,0.7)", fontFamily: SERIFF, fontWeight: 700, fontSize: 44, color: "#fff" }}>Robert Liston <span style={{ fontFamily: MONOF, fontSize: 24, color: AN.oro }}>· cirujano</span></span>
      </div>
      <Chip x={620} y={610} texto="«según se cuenta»" color={AN.oro} px={28} anchor="left" id="an-carrera-cuenta" opacidad={clamp((t - a(C.cuenta)) / 0.4)} />
      <Frases frases={[{ t: 0.2, texto: "ANTES DE LA\nANESTESIA", px: 100 }, { t: C.carrera - 0.2, texto: "OPERAR ERA\nUNA CARRERA", px: 100, color: AN.oro }, { t: C.liston - 0.1, texto: "ROBERT\nLISTON", px: 104 }, { t: C.pierna - 0.1, texto: "UNA PIERNA\nEN ≈ 30 s", px: 100, color: AN.rojo }]} y={450} x={104} id="titular-an-carrera" />
      <Fuente texto="Sin anestesia, la velocidad del cirujano importaba. Liston: las fuentes dan 25, 28 o ≈ 30 s por amputación (relato de la época). Dibujo esquemático." y={1520} delay={C.liston} />
      <Cap e={e} />
    </Fondo>
  );
};
const SERIFF = "Georgia, 'Times New Roman', serif";

/* ───────────── an-eter ───────────── */

export const AnEter: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const E = TAN.eter;
  const kOk = spr(f, a(E.funciona), { damping: 10, stiffness: 190, mass: 0.8 });
  const kIr = clamp((t - a(E.irrita)) / 0.4), kOl = clamp((t - a(E.olor)) / 0.4);
  const kBo = clamp((t - a(E.boston)) / 0.5);
  const publico = React.useMemo(() => Array.from({ length: 70 }, (_, i) => { const an = azar(i * 2.3) * Math.PI * 2, r = 270 + azar(i * 5.1) * 190; return { x: 540 + Math.cos(an) * r, y: 960 + Math.sin(an) * r * 0.42, c: i % 3 }; }), []);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Sala t={t} y={960} intensidad={0.9} />
        {/* anfiteatro quirúrgico */}
        {[470, 390, 310].map((rx, i) => <ellipse key={i} cx={540} cy={960} rx={rx} ry={rx * 0.42} fill={["#1B1410", "#241A12", "#2E2218"][i]} stroke="#6A4A2A" strokeWidth={4} />)}
        {publico.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={9} fill={["#E8DDC0", "#C9BEA0", "#A89870"][p.c]} opacity={0.75} />)}
        <ellipse cx={540} cy={968} rx={230} ry={96} fill="#3A2A1C" stroke="#8A5A32" strokeWidth={4} />
        {/* mesa y paciente */}
        <rect x={400} y={940} width={280} height={26} rx={6} fill="#5A3A22" />
        <rect x={420} y={906} width={240} height={40} rx={18} fill="#D8CDB4" stroke="#8A7C5A" strokeWidth={3} />
        <circle cx={436} cy={880} r={34} fill="#E6B898" stroke="#7A5A44" strokeWidth={2} />
        <path d="M 422 876 Q 436 884 450 876" stroke="#3A2A20" strokeWidth={3} fill="none" strokeLinecap="round" />
        {/* inhalador de vidrio */}
        <g>
          <path d="M 470 826 C 520 800 560 800 592 770" stroke="#BFE0FF" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.6} />
          <circle cx={600} cy={690} r={86} fill={AN.cloro} opacity={0.12 + 0.2 * clamp(kOk)} /><circle cx={600} cy={690} r={86} fill="rgba(207,233,255,0.14)" stroke="#BFE0FF" strokeWidth={5} />
          <ellipse cx={572} cy={662} rx={22} ry={12} fill="#fff" opacity={0.4} transform="rotate(-30 572 662)" />
          <circle cx={600} cy={700} r={34} fill="#E8DDC0" opacity={0.6} />
          {Array.from({ length: 5 }, (_, i) => { const u = ((t * 0.35 + i / 5) % 1); return <path key={i} d={`M ${560 + i * 20} ${660 - u * 120} q 10 -16 0 -32 q -10 -16 0 -32`} stroke={AN.cloro} strokeWidth={4} fill="none" strokeLinecap="round" opacity={(1 - u) * 0.6 * clamp(kOk)} />; })}
        </g>
        {/* funciona */}
        <g opacity={clamp(kOk * 2)} transform={`translate(860 720) scale(${0.6 + 0.4 * clamp(kOk)})`}>
          <circle r={64} fill="#1B6A4A" stroke={AN.cloro} strokeWidth={8} /><path d="M -28 2 L -8 24 L 32 -22" stroke="#fff" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {/* irrita: líneas rojas alrededor de la cara; huele: ondas */}
        <g opacity={kIr}>{[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M ${392 + i * 12} ${838 - i * 6} l 8 -10 l 8 10 l 8 -10`} stroke={AN.rojo} strokeWidth={5} fill="none" strokeLinecap="round" />)}</g>
        <g opacity={kOl}>{[0, 1, 2].map((i) => <path key={i} d={`M ${700 + i * 36} ${770 - ((t * 20 + i * 14) % 40)} q 10 -20 0 -40 q -10 -20 0 -40`} stroke={AN.vela} strokeWidth={5} fill="none" strokeLinecap="round" />)}</g>
        <LineaT pos={1} y={1420} />
      </svg>
      <Chip x={104} y={612} texto="16 OCT 1846 · BOSTON" px={30} id="an-eter-chip" opacidad={clamp((t - a(E.fecha)) / 0.5)} />
      <Chip x={540} y={1262} texto="HOSPITAL GENERAL DE MASSACHUSETTS" color={AN.hielo} px={24} anchor="center" id="an-eter-hosp" opacidad={kBo} />
      <Chip x={130} y={1130} texto="irrita" color={AN.rojo} px={34} id="an-eter-irrita" opacidad={kIr} />
      <Chip x={780} y={1130} texto="olor fuerte" color={AN.vela} px={34} id="an-eter-olor" opacidad={kOl} />
      <Frases frases={[{ t: 0.2, texto: "OCTUBRE\nDE 1846", px: 108 }, { t: E.funciona - 0.1, texto: "EL ÉTER\nFUNCIONA", px: 104, color: AN.cloro }, { t: E.irrita - 0.1, texto: "PERO IRRITA…", px: 100, color: AN.rojo }, { t: E.olor - 0.1, texto: "…Y HUELE\nMUY FUERTE", px: 96, color: AN.vela }]} y={450} x={104} id="titular-an-eter" />
      <Fuente texto="Demostración del éter en Boston (16 oct 1846) por William Morton y el cirujano John C. Warren. Anfiteatro esquemático, no es una imagen de la época." y={1500} delay={E.boston} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── an-busca ───────────── */

export const AnBusca: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const B = TAN.busca;
  const kS = spr(f, a(B.simpson), { damping: 14, stiffness: 120, mass: 0.8 });
  const kA = spr(f, a(B.ayudantes), { damping: 14, stiffness: 120, mass: 0.8 });
  const kCl = clamp((t - a(B.cloro)) / 0.5);
  const xs = [150, 290, 430, 650, 790, 930];
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Sala t={t} y={880} intensidad={0.9} />
        <g opacity={clamp(kA * 2)}>
          <Persona x={150} y={850} s={0.85} tipo="barba" abrigo="#2A3040" estado={0} /><Persona x={930} y={850} s={0.85} tipo="calvo" abrigo="#302A24" estado={0} />
        </g>
        <g opacity={clamp(kS * 2)} transform={`translate(0 ${(1 - clamp(kS)) * 30})`}><Persona x={540} y={780} s={1.25} tipo="pelo" abrigo="#2A2230" ojos={1} habla={t > a(B.mejor) && t < a(B.cloro) ? 0.3 : 0} /></g>
        {/* mesa de laboratorio */}
        <rect x={50} y={1010} width={980} height={34} rx={6} fill={AN.madera} stroke="#2A1A0E" strokeWidth={3} />
        <rect x={90} y={1044} width={900} height={200} fill="#1B120B" /><rect x={90} y={1044} width={900} height={200} fill="#000" opacity={0.25} />
        {xs.map((x, i) => {
          const ultima = i === xs.length - 1;
          const kx = clamp((t - a(B.prueba - 0.5 + i * 0.42)) / 0.3);
          return (
            <g key={i}>
              <Botella x={x} y={1010} s={ultima ? 0.78 + 0.1 * kCl : 0.7} etiqueta={ultima && kCl > 0 ? "CHLORO-FORM" : "?"} brillo={ultima ? kCl : 0} color={ultima ? AN.cloro : "#9A8A6A"} nivel={0.4 + 0.4 * azar(i * 3.1)} />
              {!ultima && kx > 0 && <g opacity={kx} transform={`translate(${x} ${940 - 18 * (1 - kx)})`}><circle r={32} fill="#5A1A1A" stroke={AN.rojo} strokeWidth={5} /><path d="M -14 -14 L 14 14 M 14 -14 L -14 14" stroke="#fff" strokeWidth={8} strokeLinecap="round" /></g>}
            </g>
          );
        })}
        {kCl > 0 && <g opacity={kCl} transform={`translate(${xs[5]} 790)`}><circle r={38} fill="#1B6A4A" stroke={AN.cloro} strokeWidth={6} /><path d="M -16 2 L -4 14 L 18 -12" stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
        <LineaT pos={2} y={1420} />
      </svg>
      <Chip x={104} y={612} texto="J. Y. SIMPSON · OBSTETRA" px={28} id="an-busca-simpson" opacidad={clamp(kS * 2)} />
      <Chip x={540} y={1280} texto="ayudantes: George Keith y J. Matthews Duncan" color={AN.hielo} px={22} anchor="center" id="an-busca-ayud" opacidad={clamp(kA * 2)} />
      <Frases frases={[{ t: 0.2, texto: "EN EDIMBURGO,\nJAMES SIMPSON", px: 84 }, { t: B.mejor - 0.1, texto: "BUSCA ALGO\nMEJOR", px: 104, color: AN.oro }, { t: B.prueba - 0.1, texto: "PRUEBA CON\nSUS AYUDANTES", px: 84 }, { t: B.cloro - 0.1, texto: "¡CLOROFORMO!", px: 100, color: AN.cloro }]} y={450} x={104} id="titular-an-busca" />
      <Fuente texto="James Y. Simpson (obstetra, Edimburgo) probó varias sustancias con George Keith y J. Matthews Duncan antes de llegar al cloroformo. Dibujo esquemático." y={1500} delay={B.simpson} />
      <Cap e={e} />
    </Fondo>
  );
};
