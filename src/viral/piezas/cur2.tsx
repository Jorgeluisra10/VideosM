/**
 * «¿Real o mito?» (SINAPSIS · curiosidades médicas con humor) · escenas 2/2
 *   cur-pastilla  #4 La pastilla de azúcar cara (US$ 2,50) alivia más que la barata (US$ 0,10): 85 % vs 61 % → REAL
 *   cur-violin    #5 Un violinista tocó mientras le implantaban electrodos: el tejido cerebral no siente dolor → REAL
 *   cur-acento    #6 Síndrome del acento extranjero: una noruega empieza a sonar alemana tras una lesión cerebral → REAL
 *   cur-marcador  el marcador: 5 reales y 1 mito, trofeo y «¿cuántos acertaste?» (cierre)
 */
import React from "react";
import { CUR, TCUR } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Lectura } from "./jet-kit";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { CerebroSue } from "./sue-kit";
import { CU, Escenario, FONT, Globo, MONOF, Mascota, Num, Rostro, Sello } from "./cur-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── cur-pastilla ───────────── */

const Tableta: React.FC<{ x: number; y: number; dorada?: boolean; t: number }> = ({ x, y, dorada = false, t }) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={72} rx={120} ry={22} fill="#000" opacity={0.35} />
    {dorada && <g><rect x={-104} y={20} width={208} height={64} rx={14} fill="#5B1B8F" stroke={CU.amarillo} strokeWidth={5} /><rect x={-104} y={20} width={208} height={18} rx={9} fill="#7E2BBF" /></g>}
    <ellipse cx={0} cy={dorada ? 14 : 22} rx={86} ry={32} fill={dorada ? "#B8860B" : "#9AA5B8"} />
    <ellipse cx={0} cy={dorada ? 0 : 8} rx={86} ry={32} fill={dorada ? "#FFD34D" : "#E6ECF5"} stroke={dorada ? "#8A6508" : "#7C8798"} strokeWidth={5} />
    <path d={`M -62 ${dorada ? 0 : 8} L 62 ${dorada ? 0 : 8}`} stroke={dorada ? "#B8860B" : "#9AA5B8"} strokeWidth={6} strokeLinecap="round" />
    <ellipse cx={-26} cy={dorada ? -10 : -2} rx={34} ry={9} fill="#fff" opacity={0.6} />
    {dorada && [[-80, -36], [86, -30], [20, -58]].map(([sx, sy], i) => <polygon key={i} points="0,-14 4,-4 14,0 4,4 0,14 -4,4 -14,0 -4,-4" fill="#fff" transform={`translate(${sx} ${sy}) scale(${0.8 + 0.4 * Math.sin(t * 5 + i * 2)})`} />)}
  </g>
);

const Etiqueta: React.FC<{ x: number; y: number; texto: string; color: string; tinta?: string; giro?: number }> = ({ x, y, texto, color, tinta = CU.tinta, giro = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${giro})`}>
    <line x1={0} y1={44} x2={0} y2={96} stroke="#fff" strokeWidth={4} opacity={0.8} />
    <polygon points="-92,-34 80,-34 104,0 80,34 -92,34" fill={color} stroke={CU.tinta} strokeWidth={6} strokeLinejoin="round" />
    <circle cx={80} cy={0} r={8} fill={CU.oscuro} stroke={CU.tinta} strokeWidth={3} />
    <text x={-6} y={18} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={52} fill={tinta}>{texto}</text>
  </g>
);

export const CurPastilla: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const Pp = TCUR.pastilla;
  const k1 = spr(f, a(Pp.barata), { damping: 10, stiffness: 170, mass: 0.7 });
  const k2 = spr(f, a(Pp.cara), { damping: 8, stiffness: 190, mass: 0.7 });
  const kb = easeOut((t - a(Pp.barras)) / a(Pp.barrasDur));
  const mas = spr(f, a(Pp.mas), { damping: 9, stiffness: 240, mass: 0.6 });
  const base = 1300, esc = 3.2;
  const hB = CUR.pastilla.aliviaBarato * esc * kb, hC = CUR.pastilla.aliviaCaro * esc * kb;
  const fin = t >= a(Pp.sello);
  return (
    <Escenario t={t} golpe={Pp.sello}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(k1 * 2)} transform={`translate(0 ${(1 - clamp(k1)) * -60})`}>
          <Tableta x={270} y={800} t={t} />
          <Etiqueta x={270} y={685} texto="$0,10" color="#CBD5E1" giro={-6} />
        </g>
        <g opacity={clamp(k2 * 2)} transform={`translate(0 ${(1 - clamp(k2)) * -60})`}>
          <Tableta x={810} y={790} dorada t={t} />
          <Etiqueta x={810} y={675} texto="$2,50" color={CU.amarillo} giro={6} />
        </g>
        {/* barras de alivio del dolor */}
        <g opacity={clamp(kb * 3)}>
          <line x1={110} y1={base} x2={970} y2={base} stroke="#fff" strokeWidth={4} opacity={0.6} />
          <rect x={195} y={base - hB} width={150} height={hB} rx={14} fill="#94A3B8" stroke={CU.tinta} strokeWidth={6} />
          <rect x={735} y={base - hC} width={150} height={hC} rx={14} fill={CU.verde} stroke={CU.tinta} strokeWidth={6} />
          <text x={270} y={base - hB - 18} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={64} fill="#fff" stroke={CU.tinta} strokeWidth={9} paintOrder="stroke">{Math.round(CUR.pastilla.aliviaBarato * kb)} %</text>
          <text x={810} y={base - hC - 18} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={64} fill={CU.amarillo} stroke={CU.tinta} strokeWidth={9} paintOrder="stroke">{Math.round(CUR.pastilla.aliviaCaro * kb)} %</text>
        </g>
        <g opacity={clamp(mas * 2)} transform={`translate(540 ${1130}) scale(${0.6 + 0.4 * clamp(mas)})`}>
          <rect x={-150} y={-40} width={300} height={80} rx={40} fill={CU.rojo} stroke={CU.tinta} strokeWidth={6} />
          <text x={0} y={18} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={46} fill="#fff">+24 puntos</text>
        </g>
        <Mascota x={150} y={1395} s={0.25} emocion={fin ? "risa" : "guino"} t={t} mira={[0.6, 0]} />
        <Num n={4} x={110} y={520} t0={0.1} r={50} />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "LA PASTILLA\nDE AZÚCAR CARA", px: 84 }]} y={450} x={190} id="titular-cur-pastilla" />
      <div data-texto="pastilla-etq" style={{ position: "absolute", left: 104, top: 1318, width: 872, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 24, letterSpacing: "0.06em", color: "#BFDBFE", opacity: clamp(kb * 3) }} />
      <Globo texto="Yo cobro más… y curo más." x={290} y={1330} w={620} t0={Pp.mas + 0.5} cola="izq" px={30} id="pastilla-globo" />
      <Sello tipo="real" t0={Pp.sello} x={540} y={850} s={0.62} rot={-6} />
      <Fuente texto="Waber, Shiv, Carmon y Ariely, JAMA 2008: ambas eran placebo (azúcar); alivio de 85,4 % vs 61,0 % en 82 voluntarios con descargas en la muñeca." y={1505} delay={Pp.barras} />
    </Escenario>
  );
};

/* ───────────── cur-violin ───────────── */

const Violin: React.FC<{ x: number; y: number; rot: number; arco: number }> = ({ x, y, rot, arco }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path d="M -34 -120 L 34 -120 L 28 -40 C 70 -26 78 34 40 54 C 70 82 56 150 0 150 C -56 150 -70 82 -40 54 C -78 34 -70 -26 -28 -40 Z" fill="#A5521F" stroke="#4A2108" strokeWidth={6} strokeLinejoin="round" />
    <path d="M -24 -10 C -10 -30 10 -30 24 -10" fill="none" stroke="#4A2108" strokeWidth={4} opacity={0.6} />
    <path d="M -30 60 C -50 90 -36 126 0 126" fill="none" stroke="#FFC38A" strokeWidth={6} strokeLinecap="round" opacity={0.6} />
    <path d="M -22 40 L -22 76 M 22 40 L 22 76" stroke="#2A1208" strokeWidth={7} strokeLinecap="round" />
    <rect x={-10} y={-210} width={20} height={96} rx={6} fill="#2A1208" /><circle cx={0} cy={-218} r={16} fill="#2A1208" />
    <line x1={-4} y1={-180} x2={-4} y2={130} stroke="#E8E8E8" strokeWidth={2.5} opacity={0.8} /><line x1={6} y1={-180} x2={6} y2={130} stroke="#E8E8E8" strokeWidth={2.5} opacity={0.8} />
    <g transform={`translate(${arco} 0)`}><line x1={-150} y1={90} x2={150} y2={10} stroke="#C99A5B" strokeWidth={9} strokeLinecap="round" /><line x1={-150} y1={90} x2={150} y2={10} stroke="#fff" strokeWidth={2.5} opacity={0.8} /></g>
  </g>
);

export const CurViolin: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const V = TCUR.violin;
  const kc = spr(f, a(V.cabeza), { damping: 11, stiffness: 160, mass: 0.8 });
  const kv = spr(f, a(V.violin), { damping: 9, stiffness: 160, mass: 0.7 });
  const ke = easeOut((t - a(V.electrodo)) / a(0.7));
  const kd = spr(f, a(V.dolor), { damping: 9, stiffness: 240, mass: 0.6 });
  const fin = t >= a(V.sello);
  const arco = Math.sin(t * 5) * 40;
  const pulso = 0.5 + 0.5 * Math.sin(t * 8);
  return (
    <Escenario t={t} golpe={V.sello}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(kc * 2)} transform={`translate(0 ${(1 - clamp(kc)) * 40})`}>
          <Rostro x={430} y={930} r={176} gesto={fin ? "sorpresa" : "neutral"} t={t} piel="#E3B48A" pelo="#2B1B12" inclina={-8} />
          {/* cerebro «de rayos X» dentro de la cabeza */}
          <g opacity={0.9}><CerebroSue x={430} y={850} s={0.27} tono={0.15} brillo={0.7} /></g>
        </g>
        {/* electrodo */}
        <g opacity={clamp(ke * 2)}>
          <line x1={470} y1={640} x2={470} y2={640 + 210 * ke} stroke="#FFD34D" strokeWidth={9} strokeLinecap="round" />
          <circle cx={470} cy={640 + 210 * ke} r={14 + 5 * pulso} fill={CU.amarillo} />
          {[0, 1, 2].map((i) => { const u = (((t * 1.4 + i / 3) % 1) + 1) % 1; return <circle key={i} cx={470} cy={850} r={20 + u * 80} fill="none" stroke={CU.amarillo} strokeWidth={5} opacity={ke * (1 - u) * 0.8} />; })}
        </g>
        <g opacity={clamp(kv * 2)} transform={`translate(0 ${(1 - clamp(kv)) * 70})`}><Violin x={470} y={1120} rot={-62} arco={arco} /></g>
        {/* notas musicales */}
        {t > a(V.violin + 0.5) && [0, 1, 2, 3].map((i) => {
          const u = ((t * 0.5 + i * 0.27) % 1);
          const x = 700 + (i % 2) * 90 + Math.sin(u * 8 + i) * 30, y = 1000 - u * 380;
          return <g key={i} transform={`translate(${x} ${y})`} opacity={Math.sin(Math.PI * u)}><ellipse cx={0} cy={0} rx={17} ry={12} fill={CU.amarillo} transform="rotate(-20)" stroke={CU.tinta} strokeWidth={4} /><line x1={14} y1={-4} x2={14} y2={-54} stroke={CU.amarillo} strokeWidth={6} strokeLinecap="round" /><path d="M 14 -54 Q 40 -44 34 -22" fill="none" stroke={CU.amarillo} strokeWidth={6} strokeLinecap="round" /></g>;
        })}
        {/* sin sensores de dolor: rayo tachado */}
        <g opacity={clamp(kd * 2)} transform={`translate(820 720) scale(${0.6 + 0.4 * clamp(kd)})`}>
          <rect x={-150} y={-90} width={300} height={180} rx={30} fill="rgba(6,12,40,0.85)" stroke={CU.rojo} strokeWidth={6} />
          <polygon points="-10,-70 -50,10 -8,10 -24,70 40,-16 -4,-16 22,-70" fill={CU.amarillo} stroke={CU.tinta} strokeWidth={4} strokeLinejoin="round" />
          <line x1={-80} y1={-60} x2={80} y2={60} stroke={CU.rojo} strokeWidth={16} strokeLinecap="round" />
        </g>
        <Mascota x={150} y={1395} s={0.25} emocion={fin ? "risa" : "sorpresa"} t={t} mira={[0.6, 0]} />
        <Num n={5} x={110} y={520} t0={0.1} r={50} />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "VIOLÍN CON\nELECTRODOS", px: 100 }]} y={450} x={190} id="titular-cur-violin" />
      <Lectura x={820} y={820} ancho={320} alinear="center" valor="sin sensores de dolor" px={30} color="#fff" opacidad={clamp((t - a(V.dolor)) / 0.4)} id="violin-dolor" />
      <Globo texto="Yo ni me enteré. Soy el cerebro." x={290} y={1318} w={640} t0={V.dolor + 0.6} cola="izq" px={30} id="violin-globo" />
      <Sello tipo="real" t0={V.sello} x={600} y={1010} s={0.82} />
      <Fuente texto="Roger Frisch (Minnesota Orchestra), Mayo Clinic: estimulación cerebral profunda por temblor esencial, con el paciente despierto. El tejido cerebral no tiene receptores de dolor; el cuero cabelludo se anestesia." y={1495} delay={V.electrodo} />
    </Escenario>
  );
};

/* ───────────── cur-acento ───────────── */

const Noruega: React.FC<{ x: number; y: number; w?: number }> = ({ x, y, w = 220 }) => {
  const h = w * 0.7;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill="#BA0C2F" stroke={CU.tinta} strokeWidth={5} />
      <rect x={-w / 2 + w * 0.24} y={-h / 2} width={w * 0.2} height={h} fill="#fff" /><rect x={-w / 2} y={-h * 0.1} width={w} height={h * 0.2} fill="#fff" />
      <rect x={-w / 2 + w * 0.29} y={-h / 2} width={w * 0.1} height={h} fill="#00205B" /><rect x={-w / 2} y={-h * 0.05} width={w} height={h * 0.1} fill="#00205B" />
    </g>
  );
};
const Alemania: React.FC<{ x: number; y: number; w?: number }> = ({ x, y, w = 220 }) => {
  const h = w * 0.7;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h / 3} fill="#111" /><rect x={-w / 2} y={-h / 2 + h / 3} width={w} height={h / 3} fill="#DD0000" /><rect x={-w / 2} y={-h / 2 + (2 * h) / 3} width={w} height={h / 3} fill="#FFCE00" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill="none" stroke={CU.tinta} strokeWidth={5} />
    </g>
  );
};

export const CurAcento: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const A = TCUR.acento;
  const kp = spr(f, a(A.persona), { damping: 11, stiffness: 160, mass: 0.8 });
  const golpe = t >= a(A.golpe) && t < a(A.despues);
  const fin = t >= a(A.sello);
  const kb = spr(f, a(A.banderas), { damping: 9, stiffness: 200, mass: 0.7 });
  const kg = spr(f, a(A.golpe), { damping: 8, stiffness: 260, mass: 0.6 });
  return (
    <Escenario t={t} golpe={A.sello}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(kp * 2)}><Rostro x={310} y={1000} r={165} gesto={golpe || fin ? "sorpresa" : "neutral"} t={t} mono piel="#EBC09A" pelo="#C79A3B" mira={[t > a(A.despues) ? 0.8 : 0, 0]} inclina={golpe ? Math.sin(t * 30) * 6 : 0} /></g>
        {golpe && (
          <g transform={`translate(290 770) scale(${clamp(kg) * 1.1})`}>
            <polygon points="0,-90 26,-34 84,-52 54,0 96,44 36,40 20,98 -10,48 -70,70 -48,10 -100,-30 -40,-30 -30,-86" fill={CU.amarillo} stroke={CU.tinta} strokeWidth={6} strokeLinejoin="round" />
            <text x={0} y={14} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={42} fill={CU.rojo}>¡PUM!</text>
          </g>
        )}
        {/* cerebro del lado izquierdo (habla) */}
        <g opacity={clamp((t - a(A.golpe)) / 0.5)}>
          <rect x={660} y={620} width={330} height={190} rx={28} fill="rgba(6,12,40,0.8)" stroke={CU.amarillo} strokeWidth={5} />
          <CerebroSue x={790} y={720} s={0.24} tono={0} brillo={0.2}><circle cx={-170} cy={-30} r={78} fill={CU.rojo} opacity={0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t * 7))} /></CerebroSue>
        </g>
        {/* banderas */}
        <g opacity={clamp(kb * 2)} transform={`translate(0 ${(1 - clamp(kb)) * 40})`}>
          <Noruega x={800} y={900} w={210} />
          <g stroke={CU.amarillo} strokeWidth={10} strokeLinecap="round" fill="none"><path d="M 800 986 L 800 1038" /><path d="M 776 1018 L 800 1044 L 824 1018" /></g>
          <Alemania x={800} y={1120} w={210} />
        </g>
        <Mascota x={150} y={1395} s={0.25} emocion={fin ? "risa" : "sorpresa"} t={t} mira={[0.6, 0]} />
        <Num n={6} x={110} y={520} t0={0.1} r={50} />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "ACENTO\nEXTRANJERO", px: 104 }]} y={450} x={190} id="titular-cur-acento" />
      <Globo texto="Hola, ¿qué tal?" x={140} y={690} w={360} t0={A.antes} cola="izq" px={34} id="acento-antes" />
      {t > a(A.despues) && <Globo texto="Hola, ¿qué tal? (pero suena alemana)" x={110} y={1180} w={470} t0={A.despues} cola="izq" color={CU.amarillo} px={30} id="acento-despues" />}
      <Lectura x={800} y={1210} ancho={330} alinear="center" valor="1947 · noruega" px={32} color="#fff" opacidad={clamp((t - a(A.banderas)) / 0.5)} id="acento-anio" />
      <Globo texto="¿Y mi pasaporte?" x={290} y={1318} w={500} t0={A.banderas + 0.6} cola="izq" px={30} id="acento-globo" />
      <Sello tipo="real" t0={A.sello} x={560} y={1000} s={0.82} />
      <Fuente texto="Síndrome del acento extranjero: tras una lesión cerebral el habla suena a otro acento (disprosodia). Caso de Monrad-Krohn, 1947; hay ≈ 100–200 casos documentados." y={1505} delay={A.banderas} />
    </Escenario>
  );
};

/* ───────────── cur-marcador ───────────── */

const NOMBRES = ["hipo", "cosquillas", "chicle", "pastilla", "violín", "acento"];

export const CurMarcador: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const M = TCUR.marcador;
  const kt = spr(f, a(M.copa), { damping: 8, stiffness: 160, mass: 0.8 });
  const reales = CUR.veredictos.filter((v) => v === "real").length;
  return (
    <Escenario t={t} confeti={clamp((t - a(M.copa)) / 0.5)}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {CUR.veredictos.map((v, i) => {
          const k = spr(f, a(M.luces + M.luzPaso * i), { damping: 9, stiffness: 240, mass: 0.6 });
          const col = v === "real" ? CU.verde : CU.rojo;
          const cx = 165 + i * 150;
          return (
            <g key={i} transform={`translate(${cx} 800) scale(${clamp(k)})`}>
              <circle r={70} fill={col} opacity={0.3 + 0.2 * Math.sin(t * 5 + i)} />
              <circle r={58} fill={col} stroke={CU.tinta} strokeWidth={7} />
              <ellipse cx={-14} cy={-22} rx={26} ry={14} fill="#fff" opacity={0.45} />
              {v === "real" ? <path d="M -28 4 L -8 26 L 30 -20" fill="none" stroke="#fff" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" /> : <path d="M -24 -24 L 24 24 M 24 -24 L -24 24" fill="none" stroke="#fff" strokeWidth={14} strokeLinecap="round" />}
              <text x={0} y={104} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={CU.amarillo} stroke={CU.tinta} strokeWidth={7} paintOrder="stroke">{i + 1}</text>
              <text x={0} y={140} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={21} fill="#fff">{NOMBRES[i]}</text>
            </g>
          );
        })}
        <g opacity={clamp(kt * 2)} transform={`translate(790 1150) scale(${0.7 + 0.3 * clamp(kt)})`}>
          <ellipse cx={0} cy={150} rx={110} ry={20} fill="#000" opacity={0.35} />
          <rect x={-70} y={116} width={140} height={34} rx={10} fill="#7A4A12" stroke={CU.tinta} strokeWidth={5} />
          <rect x={-18} y={50} width={36} height={70} fill="#E0A81B" stroke={CU.tinta} strokeWidth={5} />
          <path d="M -100 -100 L 100 -100 C 100 20 70 60 0 70 C -70 60 -100 20 -100 -100 Z" fill="#FFD34D" stroke={CU.tinta} strokeWidth={7} strokeLinejoin="round" />
          <path d="M -100 -80 C -170 -80 -150 10 -84 20 M 100 -80 C 170 -80 150 10 84 20" fill="none" stroke="#E0A81B" strokeWidth={16} strokeLinecap="round" />
          <path d="M -60 -80 C -62 -20 -40 20 -10 40" fill="none" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.6} />
          <polygon points="0,-72 12,-44 42,-42 18,-24 26,6 0,-10 -26,6 -18,-24 -42,-42 -12,-44" fill="#fff" opacity={0.85} />
        </g>
        <Mascota x={290} y={1170} s={0.4} emocion="triunfo" t={t} mira={[0.3, -0.3]} salto={Math.abs(Math.sin(t * 5)) * 14} />
      </svg>
      <Frases frases={[{ t: 0.2, texto: `${reales} REALES,\n1 MITO`, px: 112, color: CU.amarillo }, { t: M.comentar - 0.3, texto: "¿CUÁNTOS\nACERTASTE?", px: 104 }]} y={450} x={104} id="titular-cur-marcador" />
      <Globo texto="Cuéntame en los comentarios" x={140} y={1360} w={800} t0={M.comentar} cola="der" px={36} id="marcador-globo" />
    </Escenario>
  );
};
