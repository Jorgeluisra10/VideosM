/**
 * «El par craneal X: el vago, el nervio errante» (SINAPSIS · pares craneales) · escenas 2/2
 *   vg-intestino  habla con el intestino: se estima que la mayoría de sus fibras llevan información del cuerpo al cerebro
 *   vg-jirafa     su rama de la voz, el laríngeo recurrente, baja y vuelve a subir: en la jirafa mide varios metros
 *   vg-implante   un implante que estimula el vago ayuda a algunos pacientes con epilepsia que no responden a los fármacos
 *   vg-prueba     si te desmayas sin explicación, consulta a un médico; ¿te desmayas al ver sangre? (comentarios)
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { TVG, VG } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Gota } from "./fa-kit";
import { Ambiente, Cerebro, Chip, FONT, GLC, Intestino, Lazo, MONOF, Torso, VGC, VR, pT, polyPt, rutaLazo } from "./vg-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── vg-intestino ───────────── */

export const VgIntestino: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const I = TVG.intestino;
  const kHa = clamp((t - a(I.habla)) / 0.6), kEs = clamp((t - a(I.estima)) / 0.5), kMa = clamp((t - a(I.mayoria)) / a(1.0)), kCe = spr(f, a(I.cerebro), { damping: 10, stiffness: 190, mass: 0.8 });
  const xs = Array.from({ length: 10 }, (_, i) => 440 + i * 22);
  const sube = (i: number): boolean => ![2, 7].includes(i);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1040} color={VGC.vago} intensidad={0.5} />
        <g opacity={kHa}><Cerebro x={540} y={830} s={0.8} brillo={0.3 + 0.7 * kCe} t={t} /></g>
        <g opacity={kHa}><Intestino x={540} y={1225} s={0.9} luz={kMa} /></g>
        {xs.map((x, i) => {
          const up = sube(i), k = clamp(kMa * 1.2 - i * 0.03), u = ((t * 0.5 + i * 0.13) % 1);
          const py = up ? lerp(1150, 930, u) : lerp(930, 1150, u);
          return <g key={i} opacity={k}><line x1={x} y1={930} x2={x} y2={1150} stroke={up ? VGC.vago : VGC.gut} strokeWidth={up ? 6 : 6} strokeLinecap="round" opacity={0.75} /><circle cx={x} cy={py} r={6} fill="#fff" /></g>;
        })}
      </svg>
      <Chip x={104} y={950} texto={"DEL CUERPO\nAL CEREBRO"} color={VGC.vago} px={20} id="vg-i-su" opacidad={clamp(kMa * 2)} />
      <Chip x={976} y={1090} texto={"DEL CEREBRO\nAL CUERPO"} color={VGC.gut} px={20} anchor="right" id="vg-i-ba" opacidad={clamp(kMa * 2)} />
      <Chip x={540} y={1315} texto={"SE ESTIMA: LA MAYORÍA"} color={VGC.oro} px={24} anchor="center" id="vg-i-es" opacidad={kEs} />
      <Frases frases={[{ t: 0.2, texto: "HABLA CON\nEL INTESTINO", px: 96 }, { t: I.estima - 0.1, texto: "SE ESTIMA: LA MAYORÍA\nVA AL CEREBRO", px: 72, color: VGC.vago }]} y={450} x={104} id="titular-vg-intestino" />
      <Fuente texto={`Se suele citar que ${VG.fibras.aferentes} de las fibras del vago son aferentes (del cuerpo al cerebro); es una ${VG.fibras.nota}. Esquema.`} y={1510} delay={I.estima} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── vg-jirafa ───────────── */

export const VgJirafa: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const J = TVG.jirafa;
  const kVoz = clamp((t - a(J.voz)) / 0.5), kHu = clamp((t - a(J.recurrente)) / a(1.4)), kJi = clamp((t - a(J.jirafa - 0.6)) / a(2.4)), kMe = clamp((t - a(J.metros)) / 0.5);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={VGC.vago} intensidad={0.5} />
        <g opacity={kVoz}>
          <rect x={240} y={800} width={120} height={150} rx={40} fill="none" stroke={VGC.trazo} strokeWidth={4} opacity={0.5} />
          <rect x={705} y={800} width={150} height={470} rx={50} fill="none" stroke={VGC.trazo} strokeWidth={4} opacity={0.5} />
        </g>
        <Lazo x={300} y0={820} largo={60} prog={kHu} t={t} opacidad={kVoz} />
        <Lazo x={780} y0={820} largo={360} prog={kJi} t={t} opacidad={kVoz} />
      </svg>
      <Chip x={300} y={770} texto={"HUMANO"} color={VGC.hueso} px={24} anchor="center" id="vg-j-hu" opacidad={kVoz} />
      <Chip x={780} y={770} texto={"JIRAFA"} color={VGC.oro} px={24} anchor="center" id="vg-j-ji" opacidad={kVoz} />
      <Chip x={300} y={1010} texto={"UNOS\nCENTÍMETROS"} color={VGC.hueso} px={22} anchor="center" id="vg-j-cm" opacidad={kHu} />
      <Chip x={780} y={1325} texto={"VARIOS METROS"} color={VGC.oro} px={26} anchor="center" id="vg-j-me" opacidad={kMe} />
      <Chip x={104} y={1160} texto={"LARINGE (VOZ)\nAORTA (ROJO)"} color={VGC.hueso} px={18} id="vg-j-la" opacidad={kHu} />
      <Frases frases={[{ t: 0.2, texto: "SU RAMA DE\nLA VOZ", px: 100 }, { t: J.recurrente - 0.1, texto: "BAJA Y VUELVE\nA SUBIR", px: 92, color: VGC.vago }, { t: J.jirafa - 0.1, texto: "EN LA JIRAFA:\nVARIOS METROS", px: 84, color: VGC.oro }]} y={450} x={104} id="titular-vg-jirafa" />
      <Fuente texto={`El nervio laríngeo recurrente (rama del vago) baja hasta el cayado de la aorta y sube a la laringe; en la jirafa el recorrido se estima en ${VG.recurrente.jirafaMetros}. Esquema, sin escala.`} y={1510} delay={J.recurrente} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── vg-implante ───────────── */

const eeg = (t: number, calmo: number, x0: number, x1: number, y: number): string => {
  const n = 90;
  return Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n, x = lerp(x0, x1, u), ph = u * 22 - t * 6;
    const crisis = 46 * (Math.sin(ph * 1.3) * Math.sin(ph * 0.37 + 1) + 0.6 * Math.sin(ph * 3.1)), tranq = 9 * Math.sin(ph * 0.7);
    return `${i ? "L" : "M"} ${x.toFixed(1)} ${(y + lerp(crisis, tranq, calmo)).toFixed(1)}`;
  }).join(" ");
};
export const VgImplante: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const M = TVG.implante;
  const kTo = clamp((t - a(M.hoy)) / 0.6), kIm = clamp((t - a(M.implante)) / 0.6), kEs = clamp((t - a(M.estimula)) / a(1.0)), kEp = clamp((t - a(M.epilepsia)) / 0.5), kFa = spr(f, a(M.farmacos), { damping: 10, stiffness: 190, mass: 0.8 });
  const X = 330, Y = 1040, S = 0.7;
  const disp = pT(X, Y, S, 252, 280), cuello = pT(X, Y, S, 232, 196);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1040} color={kEs > 0.5 ? VGC.vago : GLC.oro} intensidad={0.5} />
        <g opacity={kTo}><Torso x={X} y={Y} s={S} t={t} v={kEs} luzC={0} cerebro={0.3 + 0.7 * kEs} /></g>
        <g opacity={kIm}>
          <path d={`M ${disp[0]} ${disp[1] - 14} C ${disp[0]} ${disp[1] - 60} ${cuello[0] + 6} ${cuello[1] + 40} ${cuello[0]} ${cuello[1]}`} stroke={GLC.oro} strokeWidth={5} fill="none" strokeLinecap="round" />
          <rect x={disp[0] - 28} y={disp[1] - 16} width={56} height={34} rx={12} fill="#2B3A66" stroke={GLC.oro} strokeWidth={4} />
          {kEs > 0 && <circle cx={disp[0]} cy={disp[1]} r={8 + 4 * Math.sin(t * 12)} fill={GLC.oro} />}
        </g>
        {/* EEG */}
        <g opacity={kEp}>
          <rect x={540} y={880} width={436} height={170} rx={22} fill="rgba(11,18,40,0.7)" stroke={VGC.trazo} strokeWidth={4} />
          <path d={eeg(t, easeOut((t - a(M.estimula + 0.8)) / 1.2), 560, 956, 965)} stroke={kEs > 0.9 ? VGC.vago : VGC.rojo} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
      <Chip x={500} y={1130} texto={"ESTIMULADOR\nEN EL PECHO"} color={GLC.oro} px={20} id="vg-m-es" opacidad={kIm} />
      <Chip x={540} y={830} texto={"ACTIVIDAD DEL CEREBRO (EEG)"} color={VGC.hueso} px={18} id="vg-m-eeg" opacidad={kEp} />
      <Chip x={976} y={1100} texto={"ALGUNOS PACIENTES\nCON EPILEPSIA"} color={VGC.vago} px={22} anchor="right" id="vg-m-pa" opacidad={kEp} />
      <Chip x={976} y={1200} texto={"SIN RESPUESTA A\nLOS FÁRMACOS"} color={GLC.oro} px={22} anchor="right" id="vg-m-fa" opacidad={kFa} />
      <Frases frases={[{ t: 0.2, texto: "HOY: UN\nIMPLANTE", px: 100 }, { t: M.estimula - 0.1, texto: "ESTIMULA\nEL VAGO", px: 100, color: VGC.vago }, { t: M.epilepsia - 0.1, texto: "AYUDA EN\nALGUNOS CASOS", px: 92, color: GLC.oro }]} y={450} x={104} id="titular-vg-implante" />
      <Fuente texto={`La estimulación del nervio vago está aprobada para epilepsia refractaria (${VG.vns.epilepsia}) y, con evidencia más discutida, para depresión resistente (${VG.vns.depresion}). Se hace bajo control médico. Esquema.`} y={1510} delay={M.implante} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── vg-prueba ───────────── */

export const VgPrueba: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const U = TVG.prueba;
  const kDe = clamp((t - a(U.desmayas)) / 0.5), kCo = spr(f, a(U.consulta), { damping: 10, stiffness: 190, mass: 0.8 }), kSa = spr(f, a(U.sangre), { damping: 10, stiffness: 190, mass: 0.8 }), kCm = clamp((t - a(U.comenta)) / 0.4);
  const pulso = 1 + 0.05 * Math.sin(t * 6) * kCo;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={kCo > 0.3 && kSa < 0.2 ? "#3B82F6" : GLC.oro} intensidad={0.6} />
        <g opacity={clamp(kCo * 2)} transform={`translate(250 960) scale(${kCo * pulso})`}>
          <circle r={130} fill="rgba(11,18,40,0.92)" stroke="#3B82F6" strokeWidth={8} />
          <rect x={-22} y={-78} width={44} height={156} rx={8} fill="#3B82F6" /><rect x={-78} y={-22} width={156} height={44} rx={8} fill="#3B82F6" />
        </g>
        <g opacity={clamp(kSa * 2)} transform={`translate(0 ${lerp(16, 0, easeOut(kSa))})`}><Gota x={720} y={880} s={1.8} color={GLC.rojo} /></g>
        <g opacity={clamp(kCm * 2)} transform={`translate(540 ${lerp(1330, 1308, easeOut(kCm))})`}>
          <rect x={-400} y={-46} width={800} height={92} rx={34} fill="rgba(11,18,40,0.95)" stroke={GLC.oro} strokeWidth={6} />
          <text y={14} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={40} fill="#E6EDFF" data-texto="vg-u-pre">¿Te desmayas al ver sangre?</text>
        </g>
      </svg>
      <Chip x={250} y={1110} texto={"DESMAYO SIN\nEXPLICACIÓN:\nCONSULTA"} color={"#7FB2FF"} px={20} anchor="center" id="vg-u-me" opacidad={kCo} />
      <Chip x={720} y={1035} texto={"¿Y A TI?"} color={GLC.rojo} px={26} anchor="center" id="vg-u-ti" opacidad={kSa} />
      <Chip x={540} y={1388} texto={"CUÉNTAME EN COMENTARIOS"} color={GLC.oro} px={22} anchor="center" id="vg-u-co" opacidad={kCm * (0.75 + 0.25 * Math.sin(t * 7))} />
      <Frases frases={[{ t: 0.2, texto: "¿TE DESMAYAS\nSIN EXPLICACIÓN?", px: 86, color: "#7FB2FF" }, { t: U.consulta - 0.1, texto: "CONSULTA A\nUN MÉDICO", px: 100, color: "#7FB2FF" }, { t: U.sangre - 0.1, texto: "¿TE DESMAYAS AL\nVER SANGRE?", px: 84, color: GLC.oro }]} y={450} x={104} id="titular-vg-prueba" />
      <Fuente texto="Un desmayo sin explicación, con dolor en el pecho, palpitaciones o tras un golpe en la cabeza requiere valoración médica. Este video es divulgativo; no diagnostica. Esquema." y={1510} delay={U.consulta} />
      <Cap e={e} />
    </Fondo>
  );
};
