/**
 * «El par craneal IX: el nervio de la arcada y la presión» (SINAPSIS · pares craneales) · escenas 2/2
 *   gl-presion    el seno carotídeo es un sensor de presión que avisa al cerebro (nervio del seno de Hering, rama del IX)
 *   gl-neuralgia  la neuralgia del glosofaríngeo: dolor muy fuerte en la garganta al tragar o bostezar
 *   gl-sincope    en muy pocos casos el dolor viene con desmayos; se cree que el nervio también frena el corazón
 *   gl-prueba     dolor fuerte al tragar o un desmayo: consulta a un médico; ¿qué te da arcadas? (comentarios)
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { GL, TGL } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Ambiente, Cerebro, Chip, Corazon, FONT, GLC, Manometro, MONOF, Perfil, polyPt } from "./gl-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── gl-presion ───────────── */

const NERVIO: [number, number][] = [[572, 1090], [640, 1040], [720, 975], [780, 935]];
export const GlPresion: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const R = TGL.presion;
  const kCu = clamp((t - a(R.cuello)) / 0.6), kSe = clamp((t - a(R.sensor)) / 0.5), kSn = spr(f, a(R.seno), { damping: 10, stiffness: 190, mass: 0.8 }), kVi = clamp((t - a(R.vigila)) / 0.6), kAv = clamp((t - a(R.avisa)) / a(1.0));
  const pul = Math.sin(t * 6), latido = kSn * pul;
  const [dx, dy] = polyPt(NERVIO, ((t * 0.7) % 1));
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={GLC.rojo} intensidad={0.4 + 0.2 * kSn} />
        {/* arteria carótida con su bifurcación y el seno */}
        <g opacity={kCu} strokeLinecap="round" fill="none">
          <path d="M 540 1340 L 540 1130" stroke="#2B1420" strokeWidth={50} /><path d="M 540 1340 L 540 1130" stroke={GLC.rojo} strokeWidth={36} opacity={0.9} />
          <path d="M 540 1130 C 540 1080 520 1040 500 980" stroke="#2B1420" strokeWidth={42} /><path d="M 540 1130 C 540 1080 520 1040 500 980" stroke={GLC.rojo} strokeWidth={28} opacity={0.75} />
          <path d="M 540 1130 C 540 1070 580 1020 610 960" stroke="#2B1420" strokeWidth={42} /><path d="M 540 1130 C 540 1070 580 1020 610 960" stroke={GLC.rojo} strokeWidth={28} opacity={0.75} />
        </g>
        <ellipse cx={540} cy={1112} rx={52 + 7 * latido} ry={62 + 8 * latido} fill={GLC.rojo} opacity={0.45 + 0.5 * kSn} stroke="#fff" strokeOpacity={0.7} strokeWidth={5} />
        {/* nervio del seno hacia el cerebro */}
        <path d="M 572 1090 C 640 1040 720 975 780 935" pathLength={1} stroke={GLC.ix} strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray={`${kVi} 2`} />
        {kAv > 0 && <circle cx={dx} cy={dy} r={10} fill="#fff" />}
        <g opacity={kCu}><Cerebro x={800} y={880} s={0.8} brillo={0.3 + 0.7 * kAv} t={t} /></g>
        <g opacity={kSe}><Manometro x={250} y={1010} s={0.85} valor={0.15 + 0.65 * Math.abs(Math.sin(t * 2.2)) * kSe} /></g>
      </svg>
      <Chip x={104} y={1130} texto={"SENSOR DE\nPRESIÓN"} color={GLC.oro} px={22} id="gl-r-se" opacidad={kSe} />
      <Chip x={600} y={1260} texto={"SENO CAROTÍDEO"} color={GLC.rojo} px={22} id="gl-r-sn" opacidad={clamp(kSn * 2)} />
      <Chip x={640} y={1110} texto={"NERVIO DEL SENO\n(RAMA DEL IX)"} color={GLC.ix} px={18} id="gl-r-ne" opacidad={kVi} />
      <Chip x={976} y={780} texto={"CEREBRO"} color={GLC.cereb} px={22} anchor="right" id="gl-r-ce" opacidad={kAv} />
      <Frases frases={[{ t: 0.2, texto: "Y EN EL CUELLO,\nUN SENSOR", px: 88 }, { t: R.seno - 0.1, texto: "EL SENO\nCAROTÍDEO", px: 100, color: GLC.rojo }, { t: R.avisa - 0.1, texto: "AVISA AL\nCEREBRO", px: 100, color: GLC.ix }]} y={450} x={104} id="titular-gl-presion" />
      <Fuente texto={`El ${GL.seno.nombre} tiene barorreceptores; su señal viaja por el ${GL.seno.nervio}, rama del IX, hasta el tronco encefálico. El ${GL.seno.quimio} mide oxígeno y CO₂. Esquema.`} y={1510} delay={R.cuello} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── gl-neuralgia ───────────── */

export const GlNeuralgia: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const N = TGL.neuralgia;
  const kRa = clamp((t - a(N.rara)) / a(1.2)), kIr = clamp((t - a(N.neuralgia)) / a(0.8)), kDo = spr(f, a(N.dolor), { damping: 9, stiffness: 200, mass: 0.7 }), kTr = clamp((t - a(N.tragar)) / 0.5), kBo = clamp((t - a(N.bostezar)) / 0.5);
  const traga = (Math.sin(t * 6) + 1) / 2;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1060} color={kIr > 0.3 ? GLC.rojo : GLC.ix} intensidad={0.55} />
        <Perfil x={420} y={1050} s={0.78} t={t} ix={kRa} rl={kRa} rf={kRa} irrita={kIr} arcada={kDo > 0.05 ? clamp(kDo - 0.1) * 0.6 : 0} />
        {/* rayo de dolor */}
        {kDo > 0.05 && <g opacity={clamp(kDo * 2) * (0.6 + 0.4 * Math.sin(t * 22))} transform={`translate(${420 - 10 * 0.78} ${1050 + 125 * 0.78}) scale(${0.9 + 0.2 * kDo})`}><path d="M 14 -60 L -20 6 L 4 6 L -14 60 L 26 -12 L 2 -12 Z" fill={GLC.oro} stroke="#fff" strokeWidth={3} strokeLinejoin="round" /></g>}
        {/* disparadores: tragar y bostezar */}
        <g opacity={kTr} transform="translate(840 1010)">
          <path d="M -44 -50 L 44 -50 L 32 40 L -32 40 Z" fill="rgba(106,208,230,0.25)" stroke="#6AD0E6" strokeWidth={6} strokeLinejoin="round" />
          <path d={`M -40 ${-8 - 14 * traga} L 40 ${-8 - 14 * traga} L 30 40 L -30 40 Z`} fill="#6AD0E6" opacity={0.6} />
        </g>
        <g opacity={kBo} transform="translate(840 1210)">
          <circle r={56} fill={GLC.piel} stroke={GLC.trazo} strokeWidth={5} />
          <ellipse cx={-20} cy={-14} rx={9} ry={4} fill="#E4EAF8" /><ellipse cx={20} cy={-14} rx={9} ry={4} fill="#E4EAF8" />
          <ellipse cy={22} rx={20} ry={10 + 16 * (0.5 + 0.5 * Math.sin(t * 3))} fill="#3A0A14" stroke="#E4EAF8" strokeWidth={5} />
        </g>
      </svg>
      <Chip x={840} y={1068} texto={"TRAGAR"} color={"#6AD0E6"} px={22} anchor="center" id="gl-n-tr" opacidad={kTr} />
      <Chip x={840} y={1280} texto={"BOSTEZAR"} color={GLC.oro} px={22} anchor="center" id="gl-n-bo" opacidad={kBo} />
      <Chip x={104} y={1240} texto={"NERVIO\nIRRITADO"} color={GLC.rojo} px={22} id="gl-n-ir" opacidad={kIr} />
      <Chip x={976} y={780} texto={"MUY POCO FRECUENTE"} color={GLC.hueso} px={22} anchor="right" id="gl-n-ra" opacidad={kRa} />
      <Frases frases={[{ t: 0.2, texto: "RARA VEZ SE\nIRRITA…", px: 96 }, { t: N.neuralgia - 0.1, texto: "NEURALGIA DEL\nGLOSOFARÍNGEO", px: 84, color: GLC.rojo }, { t: N.tragar - 0.1, texto: "DOLOR AL TRAGAR\nO BOSTEZAR", px: 84, color: GLC.oro }]} y={450} x={104} id="titular-gl-neuralgia" />
      <Fuente texto={`La neuralgia del glosofaríngeo es poco frecuente (≈ ${GL.neuralgia.por100mil} por 100 000 personas al año según las fuentes): dolor intenso en garganta, amígdala u oído, desencadenado por ${GL.neuralgia.disparadores.join(" o ")}. Solo un médico la valora. Esquema.`} y={1510} delay={N.neuralgia} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── gl-sincope ───────────── */

const LAT: [number, number][] = [[0, 0], [20, 0], [30, -14], [40, 0], [55, 0], [62, 24], [72, -70], [84, 34], [92, 0], [110, 0], [124, -18], [138, 0], [160, 0]];
const ecg = (): string => {
  const pts: [number, number][] = [];
  for (let b = 0; b < 5; b++) {
    if (b === 2 || b === 3) { pts.push([130 + b * 160, 0], [130 + (b + 1) * 160, 0]); continue; }
    LAT.forEach(([x, y]) => pts.push([130 + b * 160 + x, y]));
  }
  return pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${1140 + p[1]}`).join(" ");
};
export const GlSincope: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const S = TGL.sincope;
  const kPo = clamp((t - a(S.pocos)) / 0.5), kDo = clamp((t - a(S.dolor)) / 0.5), kDe = easeOut((t - a(S.desmayos)) / 0.8), kCr = clamp((t - a(S.cree)) / 0.5), kFr = clamp((t - a(S.frena)) / 0.5);
  const traza = clamp((t - a(S.pocos + 0.4)) / a(5.4));
  const pausa = t > a(S.cree) && t < a(S.frena + 1.4);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1040} color={pausa ? GLC.rojo : GLC.ix} intensidad={0.55} />
        <g opacity={kPo}><Corazon x={250} y={930} s={1.0} t={t} ritmo={pausa ? 0 : 1} /></g>
        <path d={ecg()} pathLength={1} stroke={pausa ? GLC.rojo : GLC.vago} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${traza} 2`} opacity={kPo} />
        {/* dolor y desmayo */}
        <g opacity={kDo} transform="translate(560 930)"><path d="M 14 -50 L -16 4 L 4 4 L -12 48 L 22 -10 L 2 -10 Z" fill={GLC.oro} stroke="#fff" strokeWidth={3} strokeLinejoin="round" /></g>
        <g opacity={kDe} transform={`translate(880 1290) rotate(${-82 * kDe} 0 0)`}>
          <circle cy={-120} r={22} fill="#E4EAF8" /><line x1={0} y1={-98} x2={0} y2={-30} stroke="#E4EAF8" strokeWidth={10} strokeLinecap="round" />
          <line x1={0} y1={-84} x2={-34} y2={-52} stroke="#E4EAF8" strokeWidth={9} strokeLinecap="round" /><line x1={0} y1={-84} x2={34} y2={-52} stroke="#E4EAF8" strokeWidth={9} strokeLinecap="round" />
          <line x1={0} y1={-30} x2={-24} y2={14} stroke="#E4EAF8" strokeWidth={9} strokeLinecap="round" /><line x1={0} y1={-30} x2={24} y2={14} stroke="#E4EAF8" strokeWidth={9} strokeLinecap="round" />
        </g>
      </svg>
      <Chip x={104} y={780} texto={"MUY POCOS CASOS"} color={GLC.hueso} px={22} id="gl-c-po" opacidad={kPo} />
      <Chip x={560} y={1000} texto={"DOLOR"} color={GLC.oro} px={22} anchor="center" id="gl-c-do" opacidad={kDo} />
      <Chip x={440} y={1230} texto={"¿PAUSA DEL CORAZÓN?\n(se cree)"} color={GLC.rojo} px={22} anchor="center" id="gl-c-pa" opacidad={kFr} />
      <Chip x={760} y={1300} texto={"DESMAYO"} color={GLC.hueso} px={20} anchor="center" id="gl-c-de" opacidad={kDe} />
      <Frases frases={[{ t: 0.2, texto: "EN MUY POCOS\nCASOS…", px: 94 }, { t: S.desmayos - 0.1, texto: "…EL DOLOR VIENE\nCON DESMAYOS", px: 82, color: GLC.oro }, { t: S.cree - 0.1, texto: "SE CREE QUE FRENA\nEL CORAZÓN", px: 80, color: GLC.rojo }]} y={450} x={104} id="titular-gl-sincope" />
      <Fuente texto={`Casos descritos sobre todo en informes y series pequeñas (síncope en ${GL.neuralgia.sincope} de neuralgia del glosofaríngeo); se propone un reflejo con el vago (bradicardia o pausas). Esquema, no es diagnóstico.`} y={1510} delay={S.desmayos} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── gl-prueba ───────────── */

export const GlPrueba: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const U = TGL.prueba;
  const kDo = clamp((t - a(U.dolor)) / 0.5), kCo = spr(f, a(U.consulta), { damping: 10, stiffness: 190, mass: 0.8 }), kAr = clamp((t - a(U.arcadas)) / 0.5), kCm = clamp((t - a(U.comenta)) / 0.4);
  const pulso = 1 + 0.05 * Math.sin(t * 6) * kCo;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={kCo > 0.3 && kAr < 0.2 ? "#3B82F6" : GLC.oro} intensidad={0.6} />
        {/* consulta a un médico */}
        <g opacity={clamp(kCo * 2)} transform={`translate(250 960) scale(${kCo * pulso})`}>
          <circle r={130} fill="rgba(11,18,40,0.92)" stroke="#3B82F6" strokeWidth={8} />
          <rect x={-22} y={-78} width={44} height={156} rx={8} fill="#3B82F6" /><rect x={-78} y={-22} width={156} height={44} rx={8} fill="#3B82F6" />
        </g>
        {/* tres iconos de arcada */}
        <g opacity={kAr}>
          <g transform="translate(640 900)"><rect x={-70} y={-6} width={140} height={12} rx={6} fill="#E4EAF8" /><rect x={-96} y={-12} width={40} height={24} rx={7} fill="#6AD0E6" />{Array.from({ length: 5 }, (_, i) => <line key={i} x1={-92 + i * 7} y1={-12} x2={-92 + i * 7} y2={-26} stroke="#fff" strokeWidth={4} strokeLinecap="round" />)}</g>
          <g transform="translate(600 1020)"><circle r={30} fill="#C8D2E8" stroke="#fff" strokeWidth={4} /><circle r={21} fill="#8B97B8" /><rect x={28} y={-5} width={90} height={10} rx={5} fill="#E4EAF8" /></g>
          <g transform="translate(600 1140)"><ellipse rx={40} ry={27} fill="#E4EAF8" stroke="#8B97B8" strokeWidth={4} /><rect x={36} y={-5} width={82} height={10} rx={5} fill="#E4EAF8" /></g>
        </g>
        {/* burbuja para comentar */}
        <g opacity={clamp(kCm * 2)} transform={`translate(540 ${lerp(1330, 1308, easeOut(kCm))})`}>
          <rect x={-380} y={-46} width={760} height={92} rx={34} fill="rgba(11,18,40,0.95)" stroke={GLC.oro} strokeWidth={6} />
          <text y={14} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={42} fill="#E6EDFF" data-texto="gl-u-pre">¿Qué te da más arcadas?</text>
        </g>
      </svg>
      <Chip x={250} y={1110} texto={"CONSULTA A\nUN MÉDICO"} color={"#7FB2FF"} px={22} anchor="center" id="gl-u-me" opacidad={kCo} />
      <Chip x={780} y={884} texto={"CEPILLO"} color={"#6AD0E6"} px={20} id="gl-u-ce" opacidad={kAr} />
      <Chip x={740} y={1004} texto={"ESPEJO DEL\nDENTISTA"} color={GLC.hueso} px={18} id="gl-u-de" opacidad={kAr} />
      <Chip x={740} y={1124} texto={"CUCHARA"} color={GLC.hueso} px={20} id="gl-u-cu" opacidad={kAr} />
      <Chip x={540} y={1388} texto={"CUÉNTAME EN COMENTARIOS"} color={GLC.oro} px={22} anchor="center" id="gl-u-co" opacidad={kCm * (0.75 + 0.25 * Math.sin(t * 7))} />
      <Frases frases={[{ t: 0.2, texto: "DOLOR FUERTE AL\nTRAGAR O UN DESMAYO", px: 76, color: "#7FB2FF" }, { t: U.consulta - 0.1, texto: "CONSULTA A\nUN MÉDICO", px: 100, color: "#7FB2FF" }, { t: U.arcadas - 0.1, texto: "¿QUÉ TE DA\nARCADAS?", px: 100, color: GLC.oro }]} y={450} x={104} id="titular-gl-prueba" />
      <Fuente texto="Dolor intenso al tragar, desmayos o mareo con debilidad, dificultad para hablar o dolor de cabeza fuerte: atención médica. Este video es divulgativo; no diagnostica. Esquema." y={1510} delay={U.consulta} />
      <Cap e={e} />
    </Fondo>
  );
};
