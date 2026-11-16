/**
 * «El par craneal VIII: el nervio que oye y equilibra» (SINAPSIS · pares craneales) · escenas 1/2
 *   va-gancho  un nervio te deja oír y no caerte; sus células sienten movimientos del tamaño de un átomo
 *   va-sigue   aviso rápido: síguenos en SINAPSIS y no te pierdas ningún par craneal
 *   va-par     el vestibulococlear: una rama para oír (coclear) y otra para el equilibrio (vestibular)
 *   va-coclea  la cóclea, un caracol del tamaño de un guisante, con unas quince mil células ciliadas
 *   va-atomo   con el sonido más débil que oyes, los pelitos de las células se mueven apenas el ancho de un átomo
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { TVA, VA } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { InsigniaSinapsis } from "../plantillas1";
import { Ambiente, Atomo, Canales, Chip, Cilio, Coclea, FONT, MONOF, VAC } from "./va-kit";

type P = { e: EscenaViralGuardada };
const path = (pts: [number, number][]): string => pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
const miles = (v: number): string => `${Math.floor(v / 1000)} ${String(Math.round(v) % 1000).padStart(3, "0")}`;

/* ───────────── va-gancho ───────────── */

export const VaGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TVA.gancho;
  const kN = clamp((t - a(G.nervio)) / 0.6), kO = clamp((t - a(G.oir)) / 0.4), kC = clamp((t - a(G.caer)) / 0.4), kCe = easeOut((t - a(G.celulas)) / 0.8), kAt = spr(f, a(G.atomo), { damping: 10, stiffness: 190, mass: 0.8 });
  const inc = 7 * Math.sin(t * 7) * kCe;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={VAC.nervio} intensidad={0.6} />
        <g opacity={kN}>
          <Coclea cx={320} cy={870} r={104} grosor={26} />
          <Canales x={770} y={870} s={0.62} brillo={0.4 + 0.4 * Math.sin(t * 3)} />
        </g>
        {/* los dos ramales convergen en un solo nervio */}
        <path d="M 320 1050 L 320 1080 L 540 1112" pathLength={1} stroke={VAC.coclear} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${kO} 2`} />
        <path d="M 770 1050 L 770 1080 L 540 1112" pathLength={1} stroke={VAC.vest} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${kC} 2`} />
        <circle cx={540} cy={1112} r={14} fill={VAC.nervio} opacity={clamp(kO + kC)} />
        {/* comparación con el átomo */}
        <g opacity={kCe}>
          <rect x={150} y={1190} width={780} height={150} rx={30} fill="rgba(11,18,40,0.88)" stroke={VAC.trazo} strokeWidth={4} />
          <Cilio x={270} y={1240} s={0.9} inclina={inc} />
          <path d="M 360 1265 L 520 1265" stroke={VAC.oro} strokeWidth={6} strokeLinecap="round" strokeDasharray="12 10" />
          <Atomo x={620} y={1265} r={36} t={t} />
        </g>
        <g opacity={kAt} transform={`translate(0 ${lerp(10, 0, easeOut(kAt))})`}><text x={730} y={1284} fontFamily={FONT} fontWeight={900} fontSize={54} fill={VAC.oro} data-texto="va-g-nm">0,3 nm</text></g>
      </svg>
      <Chip x={320} y={1004} texto={"OÍR"} color={VAC.coclear} px={28} anchor="center" id="va-g-oir" opacidad={kO} />
      <Chip x={770} y={1004} texto={"EQUILIBRIO"} color={VAC.vest} px={28} anchor="center" id="va-g-eq" opacidad={kC} />
      <Chip x={540} y={1134} texto={"UN SOLO NERVIO"} color={VAC.nervio} px={22} anchor="center" id="va-g-ne" opacidad={clamp(kO + kC)} />
      <Frases frases={[{ t: 0.2, texto: "UN NERVIO TE DEJA\nOÍR…", px: 82, color: VAC.coclear }, { t: G.caer - 0.1, texto: "…Y NO CAERTE", px: 96, color: VAC.vest }, { t: G.celulas - 0.1, texto: "SUS CÉLULAS SIENTEN\nUN ÁTOMO", px: 80, color: VAC.oro }]} y={450} x={104} id="titular-va-gancho" />
      <Fuente texto={`En el umbral de audición, el «pelito» de las células ciliadas se desplaza ≈ ${VA.umbralNm} nm (escala atómica). Esquema, escala exagerada.`} y={1510} delay={G.celulas} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── va-sigue ───────────── */

const ROMANOS = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
export const SigueActual: React.FC<P & { actual: number }> = ({ e, actual }) => {
  const { f, t, a } = useReloj();
  const S = TVA.sigue;
  const kI = spr(f, a(S.antes + 0.1), { damping: 11, stiffness: 150, mass: 0.8 }), kB = spr(f, a(S.sigue), { damping: 9, stiffness: 200, mass: 0.7 }), kPa = clamp((t - a(S.pares)) / 0.4);
  const pulso = 1 + 0.04 * Math.sin(t * 9) * clamp(kB);
  const toque = clamp((t - a(S.sigue + 0.35)) / 0.5);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1020} color="#3B82F6" intensidad={0.8} />
        {/* botón seguir */}
        <g opacity={clamp(kB * 2)} transform={`translate(540 1190) scale(${kB * pulso})`}>
          {toque > 0 && toque < 1 && <circle r={70 + 160 * toque} fill="none" stroke="#FACC15" strokeWidth={6} opacity={1 - toque} />}
          <rect x={-200} y={-46} width={400} height={92} rx={46} fill="#3B82F6" stroke="#fff" strokeWidth={4} />
          <text y={14} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill="#fff" data-texto="va-s-seguir">+ SEGUIR</text>
        </g>
        {/* fila de los 13 pares */}
        {ROMANOS.map((r, i) => {
          const k = clamp((t - a(S.pares + i * 0.05)) / 0.3), esActual = i === actual, hecho = i < actual;
          const cx = 130 + i * 68.3, col = esActual ? VAC.oro : hecho ? VAC.verde : "#4A5C92";
          return <g key={r} opacity={k} transform={`translate(${cx} 1325) scale(${esActual ? 1 + 0.12 * Math.sin(t * 8) : 1})`}><circle r={25} fill="rgba(11,18,40,0.95)" stroke={col} strokeWidth={esActual ? 6 : 4} /><text y={7} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={r.length > 2 ? 15 : 19} fill={col} data-texto={`va-s-${i}`}>{r}</text></g>;
        })}
      </svg>
      <InsigniaSinapsis y={900} k={kI} />
      <Chip x={540} y={1252} texto={"UN PAR CRANEAL A LA VEZ"} color={VAC.hueso} px={22} anchor="center" id="va-s-uno" opacidad={kPa} />
      <Frases frases={[{ t: 0.2, texto: "ANTES DE SEGUIR…", px: 84 }, { t: S.sigue - 0.1, texto: "SÍGUENOS EN\nSINAPSIS", px: 100, color: VAC.oro }]} y={450} x={104} id="titular-va-sigue" />
      <Cap e={e} />
    </Fondo>
  );
};

export const VaSigue: React.FC<P> = ({ e }) => <SigueActual e={e} actual={8} />;

/* ───────────── va-par ───────────── */

export const VaPar: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const R = TVA.par;
  const kP = clamp((t - a(R.par)) / a(1.2)), kC = clamp((t - a(R.oir)) / a(1.0)), kV = clamp((t - a(R.equilibrio)) / a(1.0));
  const kIc = clamp((t - a(R.coclear)) / 0.4), kIv = clamp((t - a(R.vestibular)) / 0.4);
  const onda = (i: number): number => ((t * 0.9 + i / 3) % 1);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1010} color={VAC.nervio} intensidad={0.55} />
        <rect x={104} y={900} width={110} height={220} rx={36} fill="#251C44" stroke="#B78CFF" strokeWidth={5} opacity={clamp(kP * 3)} />
        <path d="M 214 1010 L 400 1010" pathLength={1} stroke={VAC.nervio} strokeWidth={12} fill="none" strokeLinecap="round" strokeDasharray={`${kP} 2`} />
        <path d="M 400 1010 C 470 1010 500 880 600 880 L 690 880" pathLength={1} stroke={VAC.coclear} strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={`${kC} 2`} />
        <path d="M 400 1010 C 470 1010 500 1140 600 1140 L 690 1140" pathLength={1} stroke={VAC.vest} strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={`${kV} 2`} />
        <g opacity={kIc}>
          <Coclea cx={810} cy={880} r={72} grosor={20} />
          {[0, 1, 2].map((i) => <path key={i} d={`M ${700 - 30 * onda(i)} ${850 - 10 * onda(i)} Q ${690 - 30 * onda(i)} 880 ${700 - 30 * onda(i)} ${910 + 10 * onda(i)}`} stroke={VAC.coclear} strokeWidth={5} fill="none" strokeLinecap="round" opacity={1 - onda(i)} transform="translate(-30 0)" />)}
        </g>
        <g opacity={kIv}><Canales x={820} y={1140} s={0.46} brillo={0.5 + 0.5 * Math.sin(t * 3)} /></g>
      </svg>
      <Chip x={104} y={1135} texto={"TRONCO"} color={"#D9C6FF"} px={18} id="va-p-tr" opacidad={clamp(kP * 3)} />
      <Chip x={440} y={790} texto={"COCLEAR\n→ OÍR"} color={VAC.coclear} px={26} id="va-p-co" opacidad={kC} />
      <Chip x={420} y={1196} texto={"VESTIBULAR\n→ EQUILIBRIO"} color={VAC.vest} px={26} id="va-p-ve" opacidad={kV} />
      <Chip x={976} y={1270} texto={"VIII · VESTIBULOCOCLEAR"} color={VAC.nervio} px={22} anchor="right" id="va-p-nom" opacidad={kP} />
      <Frases frases={[{ t: 0.2, texto: "EL PAR\nCRANEAL VIII", px: 100 }, { t: R.oir - 0.1, texto: "UNA RAMA\nPARA OÍR", px: 100, color: VAC.coclear }, { t: R.equilibrio - 0.1, texto: "OTRA PARA EL\nEQUILIBRIO", px: 90, color: VAC.vest }]} y={450} x={104} id="titular-va-par" />
      <Fuente texto={`El nervio vestibulococlear (VIII) tiene dos ramas: la ${VA.ramas[0]} (audición) y la ${VA.ramas[1]} (equilibrio). Esquema.`} y={1510} delay={R.par} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── va-coclea ───────────── */

export const VaCoclea: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const C = TVA.coclea;
  const kCa = clamp((t - a(C.caracol)) / 0.6), kGu = clamp((t - a(C.guisante)) / 0.5), kDe = clamp((t - a(C.desenrolla)) / a(1.1)), kN = clamp((t - a(C.celulas)) / a(1.8));
  const v = Math.round(lerp(0, VA.ciliadas.total, easeOut(kN)) / 100) * 100;
  const filas = [0, 1, 2, 3], cols = 60, mostrar = Math.floor(kN * cols);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={VAC.coclear} intensidad={0.55} />
        <g opacity={kCa}><Coclea cx={lerp(330, 540, easeOut(kDe))} cy={lerp(960, 900, easeOut(kDe))} r={120} des={kDe} largo={780} grosor={lerp(28, 34, kDe)} /></g>
        {/* guisante de comparación */}
        <g opacity={kGu * (1 - clamp(kDe * 3))}>
          <circle cx={760} cy={960} r={96} fill="#7BD05A" stroke="#3E8A2E" strokeWidth={6} />
          <ellipse cx={730} cy={930} rx={26} ry={16} fill="#B9F08F" opacity={0.7} transform="rotate(-30 730 930)" />
          <path d="M 700 1040 Q 760 1070 820 1040" stroke="#3E8A2E" strokeWidth={5} fill="none" opacity={0.5} />
        </g>
        {/* células ciliadas a lo largo del tubo desenrollado */}
        <g opacity={clamp(kDe * 2)}>
          {filas.map((r) => Array.from({ length: cols }, (_, c) => c < mostrar ? <circle key={`${r}-${c}`} cx={170 + c * 12} cy={950 + r * 24} r={r === 0 ? 5.5 : 4.2} fill={r === 0 ? VAC.celClaro : VAC.cel} /> : null))}
        </g>
      </svg>
      <Chip x={330} y={1130} texto={"CÓCLEA"} color={VAC.coclear} px={26} anchor="center" id="va-c-co" opacidad={kCa * (1 - clamp(kDe * 3))} />
      <Chip x={760} y={1130} texto={"GUISANTE"} color={"#9BE07F"} px={26} anchor="center" id="va-c-gu" opacidad={kGu * (1 - clamp(kDe * 3))} />
      <div data-texto="va-c-num" style={{ position: "absolute", left: 0, width: W, top: 1130, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 118, color: VAC.oro, opacity: clamp(kDe * 2), textShadow: "0 6px 24px rgba(0,0,0,0.8)" }}>{"≈ " + miles(v)}</div>
      <Chip x={540} y={1262} texto={"CÉLULAS CILIADAS"} color={VAC.celClaro} px={28} anchor="center" id="va-c-ci" opacidad={clamp(kN * 3)} />
      <Frases frases={[{ t: 0.2, texto: "UN CARACOL EN\nTU OÍDO", px: 96, color: VAC.coclear }, { t: C.guisante - 0.1, texto: "DEL TAMAÑO DE\nUN GUISANTE", px: 88, color: "#9BE07F" }, { t: C.celulas - 0.1, texto: "≈ 15 000 CÉLULAS\nCILIADAS", px: 84, color: VAC.oro }]} y={450} x={104} id="titular-va-coclea" />
      <Fuente texto={`Cada cóclea humana tiene ≈ ${miles(VA.ciliadas.internas)} células ciliadas internas y ≈ ${miles(VA.ciliadas.externasMin)}–${miles(VA.ciliadas.externasMax)} externas (≈ 15 000 en total; según la fuente varía). Tamaño de guisante: comparación habitual. Esquema.`} y={1510} delay={C.celulas} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── va-atomo ───────────── */

export const VaAtomo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const X = TVA.atomo;
  const kDe = clamp((t - a(X.debil)) / 0.6), kPe = clamp((t - a(X.pelos)) / 0.5), kMu = clamp((t - a(X.mueven)) / 0.5), kAt = spr(f, a(X.atomo), { damping: 10, stiffness: 190, mass: 0.8 });
  const osc = Math.sin(t * 6), inc = 16 * osc * kMu;
  const xT = 540 + 20 * 2.2 + 0, yT = 1030 - 58 * 2.2;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1010} color={VAC.celClaro} intensidad={0.5} />
        {/* sonido débil que llega */}
        <g opacity={kDe}>{[0, 1, 2].map((i) => { const k = (t * 0.8 + i / 3) % 1; return <path key={i} d={`M ${150 + 160 * k} 940 Q ${130 + 160 * k} 1010 ${150 + 160 * k} 1080`} stroke={VAC.coclear} strokeWidth={4 + 2 * (1 - k)} fill="none" strokeLinecap="round" opacity={0.7 * (1 - k)} />; })}</g>
        <g opacity={kPe}><Cilio x={540} y={1030} s={2.2} inclina={inc} /></g>
        {/* referencia y desplazamiento de la punta */}
        {kMu > 0 && <g opacity={kMu}>
          <line x1={xT} y1={yT - 40} x2={xT} y2={yT + 30} stroke={VAC.oro} strokeWidth={3} strokeDasharray="6 6" />
          <path d={`M ${xT} ${yT - 18} L ${xT + inc * 2.2 * (58 / 58)} ${yT - 18}`} stroke={VAC.oro} strokeWidth={5} strokeLinecap="round" />
        </g>}
        {/* átomo de comparación */}
        <g opacity={kAt} transform={`translate(0 ${lerp(14, 0, easeOut(kAt))})`}>
          <Atomo x={850} y={930} r={58} t={t} />
          <path d="M 800 1000 L 900 1000" stroke={VAC.oro} strokeWidth={6} strokeLinecap="round" /><path d="M 800 988 L 800 1012 M 900 988 L 900 1012" stroke={VAC.oro} strokeWidth={5} strokeLinecap="round" />
        </g>
      </svg>
      <Chip x={104} y={1200} texto={"SONIDO MÁS DÉBIL\nQUE OYES"} color={VAC.coclear} px={22} id="va-a-so" opacidad={kDe} />
      <Chip x={540} y={1250} texto={"PELITO DE UNA CÉLULA CILIADA"} color={VAC.celClaro} px={22} anchor="center" id="va-a-pe" opacidad={kPe} />
      <Chip x={850} y={1030} texto={"≈ 0,3 nm"} color={VAC.oro} px={44} anchor="center" id="va-a-nm" opacidad={kAt} />
      <Chip x={976} y={1100} texto={"EL ANCHO DE\nUN ÁTOMO"} color={VAC.oro} px={22} anchor="right" id="va-a-at" opacidad={kAt} />
      <Chip x={976} y={1330} texto={"(escala exagerada)"} color={VAC.gris} px={18} anchor="right" id="va-a-ex" opacidad={kPe} />
      <Frases frases={[{ t: 0.2, texto: "EL SONIDO MÁS\nDÉBIL QUE OYES", px: 84, color: VAC.coclear }, { t: X.pelos - 0.1, texto: "MUEVE SUS\nPELITOS…", px: 96 }, { t: X.atomo - 0.1, texto: "…APENAS UN\nÁTOMO", px: 100, color: VAC.oro }]} y={450} x={104} id="titular-va-atomo" />
      <Fuente texto={`En el umbral de audición el haz de estereocilios (el «pelito») se desplaza ≈ ${VA.umbralNm} nm, del orden del tamaño de un átomo (no es el desplazamiento del tímpano). Esquema, escala exagerada.`} y={1510} delay={X.pelos} />
      <Cap e={e} />
    </Fondo>
  );
};
