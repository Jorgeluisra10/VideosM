/**
 * «El par craneal VIII: el nervio que oye y equilibra» (SINAPSIS · pares craneales) · escenas 2/2
 *   va-ruido      las células ciliadas humanas no se regeneran: el ruido fuerte puede dañarlas; las aves sí las renuevan
 *   va-equilibrio el equilibrio: tres canales con líquido, como niveles de burbuja, y piedritas que sienten la gravedad
 *   va-alcohol    si una piedrita se suelta el mundo gira; el alcohol puede alterar el sistema y la cama da vueltas
 *   va-reflejo    mueve la cabeza leyendo: tus ojos se compensan solos; ¿te mareas leyendo en el coche? (comentarios)
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { TVA, VA } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Ambiente, Cabeza, Canales, Chip, Cilio, FONT, MONOF, Nivel, Piedritas, VAC } from "./va-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── va-ruido ───────────── */

export const VaRuido: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const R = TVA.ruido;
  const kHu = clamp((t - a(R.humanos)) / 0.5), kRu = clamp((t - a(R.ruido)) / a(1.2)), kDa = easeOut((t - a(R.dano)) / 0.7), kAv = clamp((t - a(R.aves)) / 0.5), kRe = easeOut((t - a(R.renuevan)) / a(1.4));
  const danoH = easeOut((t - a(R.ruido + 0.6)) / 0.8), danoA = danoH * (1 - kRe);
  const xs = Array.from({ length: 6 }, (_, i) => 180 + i * 144);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1040} color={kRu > 0.2 && kRe < 0.3 ? VAC.rojo : VAC.celClaro} intensidad={0.5} />
        {/* ruido fuerte: ondas rojas que cruzan ambas filas */}
        {kRu > 0 && kRu < 1 && [0, 1, 2].map((i) => { const x = 120 + 780 * clamp(kRu * 1.1 - i * 0.08); return <path key={i} d={`M ${x} 800 Q ${x - 50} 1010 ${x} 1260`} stroke={VAC.rojo} strokeWidth={10 - 2 * i} fill="none" strokeLinecap="round" opacity={0.85 - 0.2 * i} />; })}
        <g opacity={kHu}>{xs.map((x, i) => <Cilio key={i} x={x} y={930} s={0.95} dano={danoH} opacidad={1} />)}</g>
        <g opacity={kAv}>{xs.map((x, i) => <Cilio key={i} x={x} y={1170} s={0.95} dano={danoA} color={kRe > 0.1 ? VAC.verde : VAC.cel} opacidad={1} />)}</g>
      </svg>
      <Chip x={104} y={826} texto={"HUMANO"} color={VAC.celClaro} px={26} id="va-r-hu" opacidad={kHu} />
      <Chip x={976} y={826} texto={"NO SE REGENERAN"} color={VAC.rojo} px={24} anchor="right" id="va-r-no" opacidad={clamp(kDa * 2)} />
      <Chip x={104} y={1066} texto={"AVE"} color={VAC.verde} px={26} id="va-r-av" opacidad={kAv} />
      <Chip x={976} y={1066} texto={"SE RENUEVAN"} color={VAC.verde} px={24} anchor="right" id="va-r-re" opacidad={clamp(kRe * 2)} />
      <Chip x={540} y={1300} texto={"RUIDO FUERTE"} color={VAC.rojo} px={28} anchor="center" id="va-r-ru" opacidad={clamp(kRu * 3) * (1 - clamp(kRe * 2))} />
      <Frases frases={[{ t: 0.2, texto: "EN HUMANOS\nNO SE REGENERAN", px: 88 }, { t: R.dano - 0.1, texto: "EL RUIDO PUEDE\nDAÑARLAS", px: 92, color: VAC.rojo }, { t: R.aves - 0.1, texto: "LAS AVES SÍ\nLAS RENUEVAN", px: 92, color: VAC.verde }]} y={450} x={104} id="titular-va-ruido" />
      <Fuente texto={`En la cóclea de los mamíferos adultos las células ciliadas no se regeneran; en aves y peces sí. Protege tus oídos: baja el volumen de los auriculares y descansa del ruido fuerte. Esquema.`} y={1510} delay={R.dano} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── va-equilibrio ───────────── */

export const VaEquilibrio: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const Q = TVA.equilibrio;
  const kEq = clamp((t - a(Q.equilibrio)) / 0.5), kCa = clamp((t - a(Q.canales)) / 0.5), kBu = clamp((t - a(Q.burbuja)) / 0.5), kPi = clamp((t - a(Q.piedritas)) / 0.5), kGr = easeOut((t - a(Q.gravedad)) / 0.6);
  const bal = Math.sin(t * 2.2);
  const ang = 14 * Math.sin(t * 2.2) * kGr;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1030} color={VAC.vest} intensidad={0.55} />
        <g opacity={kCa}><Canales x={300} y={990} s={0.72} brillo={0.5 + 0.5 * Math.sin(t * 3)} girar={4 * Math.sin(t * 1.5) * kBu} /></g>
        <g opacity={kBu}><Nivel x={300} y={1190} s={0.8} inclina={bal * kBu} /></g>
        <g opacity={kPi}><Piedritas x={770} y={1010} s={0.92} ang={ang} desp={Math.sin(t * 2.2 - 0.4) * kGr} /></g>
        {kGr > 0.2 && <path d="M 640 1180 Q 770 1230 900 1180" stroke={VAC.gris} strokeWidth={5} fill="none" strokeDasharray="8 8" opacity={0.5 * kGr} />}
        {kGr > 0.2 && <g opacity={kGr} transform="translate(770 1250)"><path d="M 0 -26 L 0 26 M -14 12 L 0 28 L 14 12" stroke={VAC.oro} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
      </svg>
      <Chip x={300} y={770} texto={"3 CANALES\nCON LÍQUIDO"} color={VAC.vest} px={22} anchor="center" id="va-q-ca" opacidad={kCa} />
      <Chip x={300} y={1260} texto={"COMO UN NIVEL\nDE BURBUJA"} color={"#9BF0D8"} px={22} anchor="center" id="va-q-bu" opacidad={kBu} />
      <Chip x={770} y={770} texto={"PIEDRITAS"} color={"#F4F1E6"} px={26} anchor="center" id="va-q-pi" opacidad={kPi} />
      <Chip x={770} y={1296} texto={"SIENTEN LA GRAVEDAD"} color={VAC.oro} px={20} anchor="center" id="va-q-gr" opacidad={kGr} />
      <Frases frases={[{ t: 0.2, texto: "EL EQUILIBRIO", px: 100, color: VAC.vest }, { t: Q.canales - 0.1, texto: "3 CANALES CON\nLÍQUIDO", px: 94 }, { t: Q.piedritas - 0.1, texto: "Y PIEDRITAS\nQUE SIENTEN", px: 94, color: "#F4F1E6" }]} y={450} x={104} id="titular-va-equilibrio" />
      <Fuente texto={`El sistema vestibular tiene ${VA.canales} canales semicirculares (rotación) y los órganos otolíticos con cristales de carbonato de calcio, las ${VA.piedritas} (inclinación y aceleración lineal). Esquema.`} y={1510} delay={Q.canales} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── va-alcohol ───────────── */

const Espiral: React.FC<{ x: number; y: number; r: number; giro: number }> = ({ x, y, r, giro }) => {
  const pts = Array.from({ length: 36 }, (_, i) => { const u = i / 35, th = u * Math.PI * 4; return `${i ? "L" : "M"} ${(r * u * Math.cos(th)).toFixed(1)} ${(r * u * Math.sin(th)).toFixed(1)}`; }).join(" ");
  return <g transform={`translate(${x} ${y}) rotate(${giro})`}><circle r={r * 1.05} fill="#E4EAF8" /><path d={pts} stroke="#0A0F1F" strokeWidth={r / 6} fill="none" strokeLinecap="round" /></g>;
};

export const VaAlcohol: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const L = TVA.alcohol;
  const kSu = clamp((t - a(L.suelta)) / 0.5), kGi = clamp((t - a(L.gira)) / 0.6), kAl = spr(f, a(L.alcohol), { damping: 11, stiffness: 170, mass: 0.8 }), kSi = clamp((t - a(L.sistema)) / a(1.0)), kCa = clamp((t - a(L.cama)) / 0.5);
  const th = -Math.PI / 2 + Math.max(0, t - a(L.suelta + 0.4)) * 2.2 * (kSu > 0.9 ? 1 : 0);
  const cx = 300, cy = 960, rr = 118;
  const px = kSu < 0.5 ? cx : cx + rr * Math.cos(th) * 0.0 + rr * Math.cos(th), py = kSu < 0.5 ? cy - 30 : cy + rr * Math.sin(th);
  const caer = easeOut((t - a(L.suelta)) / 0.5);
  const cx2 = lerp(cx, px, caer), cy2 = lerp(cy - 40, py, caer);
  const bed = 10 * Math.sin(t * 3.2) * kCa;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1040} color={kAl > 0.3 ? VAC.coclear : VAC.vest} intensidad={0.55} />
        {/* canal con líquido y piedrita suelta */}
        <circle cx={cx} cy={cy} r={rr} fill="rgba(77,227,193,0.12)" stroke={VAC.tubo} strokeWidth={30} opacity={clamp(kSu * 3)} />
        <circle cx={cx} cy={cy} r={rr} fill="none" stroke={VAC.vest} strokeWidth={14} opacity={clamp(kSu * 3) * 0.85} />
        <g opacity={kSu}><polygon points={`${cx2 - 13},${cy2 + 8} ${cx2 - 4},${cy2 - 12} ${cx2 + 11},${cy2 - 8} ${cx2 + 14},${cy2 + 8} ${cx2},${cy2 + 13}`} fill="#F4F1E6" stroke="#B9B39B" strokeWidth={3} /></g>
        {/* cúpula: más pesada → más ligera con el alcohol */}
        <g opacity={kSu}><ellipse cx={cx} cy={cy + rr} rx={30} ry={14 + 4 * kAl} fill={kAl > 0.5 ? "#EAFFF8" : "#3A7BD5"} opacity={0.95} stroke="#fff" strokeOpacity={0.5} strokeWidth={3} transform={`translate(0 ${-18 * kSi})`} /></g>
        {/* copa */}
        <g opacity={clamp(kAl * 2)} transform={`translate(300 ${lerp(1270, 1236, easeOut(kAl))})`}>
          <path d="M -50 -60 L 50 -60 L 30 10 L -30 10 Z" fill="rgba(255,179,71,0.35)" stroke={VAC.coclear} strokeWidth={6} strokeLinejoin="round" />
          <path d="M -44 -48 L 44 -48 L 30 10 L -30 10 Z" fill={VAC.coclear} opacity={0.6} />
          <line x1={0} y1={10} x2={0} y2={52} stroke={VAC.coclear} strokeWidth={6} /><line x1={-32} y1={54} x2={32} y2={54} stroke={VAC.coclear} strokeWidth={6} strokeLinecap="round" />
        </g>
        {kAl > 0.1 && <path d={`M 300 1168 L 300 ${lerp(1116, 1096, kSi)}`} pathLength={1} stroke={VAC.coclear} strokeWidth={6} strokeDasharray="10 8" fill="none" strokeLinecap="round" opacity={kAl} />}
        {/* cabeza mareada y cama que gira */}
        <g opacity={kGi}><Cabeza x={770} y={960} s={0.78} />{[-1, 1].map((sd) => <Espiral key={sd} x={770 + sd * 36 * 0.78} y={960 - 22 * 0.78} r={15} giro={t * 420 * (sd === 1 ? 1 : -1)} />)}</g>
        <g opacity={clamp(kCa * 2)} transform={`translate(770 1230) rotate(${bed})`}>
          <rect x={-130} y={-26} width={260} height={52} rx={14} fill="#2B3A66" stroke={VAC.hueso} strokeWidth={5} />
          <rect x={-120} y={-44} width={92} height={30} rx={14} fill="#E4EAF8" opacity={0.9} />
          <rect x={-136} y={26} width={14} height={36} rx={5} fill={VAC.hueso} /><rect x={122} y={26} width={14} height={36} rx={5} fill={VAC.hueso} />
        </g>
      </svg>
      <Chip x={300} y={806} texto={"PIEDRITA SUELTA"} color={"#F4F1E6"} px={22} anchor="center" id="va-l-pi" opacidad={kSu} />
      <Chip x={770} y={806} texto={"EL MUNDO GIRA"} color={VAC.oro} px={22} anchor="center" id="va-l-gi" opacidad={kGi} />
      <Chip x={300} y={1304} texto={"ALCOHOL: LA CÚPULA\nSE VUELVE MÁS LIGERA\n(se cree)"} color={VAC.coclear} px={18} anchor="center" id="va-l-al" opacidad={kAl} />
      <Chip x={770} y={1322} texto={"¿LA CAMA DA VUELTAS?"} color={VAC.coclear} px={20} anchor="center" id="va-l-ca" opacidad={kCa} />
      <Frases frases={[{ t: 0.2, texto: "SI UNA PIEDRITA\nSE SUELTA…", px: 86, color: "#F4F1E6" }, { t: L.gira - 0.1, texto: "…EL MUNDO GIRA", px: 96, color: VAC.oro }, { t: L.alcohol - 0.1, texto: "EL ALCOHOL PUEDE\nALTERAR EL SISTEMA", px: 78, color: VAC.coclear }, { t: L.cama - 0.1, texto: "Y LA CAMA\nDA VUELTAS", px: 98 }]} y={450} x={104} id="titular-va-alcohol" />
      <Fuente texto={`Mareo intenso con debilidad, dificultad para hablar, visión doble o dolor de cabeza fuerte: atención médica urgente. Vértigo posicional: cristales (${VA.piedritas}) fuera de lugar. Alcohol: ${VA.alcohol} (mecanismo no cerrado). Esquema.`} y={1510} delay={L.alcohol} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── va-reflejo ───────────── */

export const VaReflejo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const Rf = TVA.reflejo;
  const kMu = clamp((t - a(Rf.mueve)) / 0.5), kCo = clamp((t - a(Rf.compensan)) / 0.5), kCh = spr(f, a(Rf.coche), { damping: 11, stiffness: 170, mass: 0.9 }), kCm = clamp((t - a(Rf.comenta)) / 0.4);
  const s = Math.sin(t * 5.5);
  const giro = 16 * s * kMu;
  const sacudida = 26 * Math.sin(t * 7) * kMu;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1010} color={VAC.oro} intensidad={0.45} />
        {/* panel izquierdo: tú mueves la cabeza y el texto se lee */}
        <g opacity={kMu}>
          <rect x={104} y={800} width={390} height={400} rx={26} fill="rgba(11,18,40,0.55)" stroke={VAC.verde} strokeWidth={4} />
          <Cabeza x={299} y={1040} s={0.9} giro={giro} mira={-s * 1.0 * (kCo > 0.1 ? 1 : 0.2)} />
          <rect x={199} y={846} width={200} height={70} rx={12} fill="#E4EAF8" /><text x={299} y={894} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="#0B0F19" data-texto="va-f-lee">LEES BIEN</text>
          {kCo > 0 && <g opacity={kCo}><path d="M 150 1040 Q 120 1000 150 960" stroke={VAC.oro} strokeWidth={6} fill="none" strokeLinecap="round" /><path d="M 448 1040 Q 478 1000 448 960" stroke={VAC.oro} strokeWidth={6} fill="none" strokeLinecap="round" /></g>}
        </g>
        {/* panel derecho: el celular se mueve y el texto se borra */}
        <g opacity={kMu}>
          <rect x={586} y={800} width={390} height={400} rx={26} fill="rgba(11,18,40,0.55)" stroke={VAC.rojo} strokeWidth={4} />
          <g transform={`translate(${781 + sacudida} 985)`}>
            <rect x={-80} y={-150} width={160} height={300} rx={22} fill="#1B2448" stroke="#8B97B8" strokeWidth={5} />
            {[0, 1, 2, 3].map((i) => [-9, 0, 9].map((dx, k) => <rect key={`${i}-${k}`} x={-58 + dx * 0.4} y={-100 + i * 50} width={116 - 10 * i} height={14} rx={5} fill="#E4EAF8" opacity={k === 1 ? 0.5 : 0.22} />))}
          </g>
          <text x={781} y={1186} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={22} fill={VAC.rojo} data-texto="va-f-borra">SE BORRA</text>
        </g>
        {/* pregunta para comentar */}
        <g opacity={clamp(kCh * 2)} transform={`translate(540 ${lerp(1330, 1300, easeOut(kCh))}) scale(${0.9 + 0.1 * kCh})`}>
          <rect x={-410} y={-48} width={820} height={96} rx={34} fill="rgba(11,18,40,0.95)" stroke={VAC.oro} strokeWidth={6} />
          <text y={14} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={42} fill="#E6EDFF" data-texto="va-f-pre">¿Te mareas leyendo en el coche?</text>
        </g>
      </svg>
      <Chip x={299} y={756} texto={"MUEVES LA CABEZA"} color={VAC.verde} px={20} anchor="center" id="va-f-ca" opacidad={kMu} />
      <Chip x={781} y={756} texto={"MUEVES EL CELULAR"} color={VAC.rojo} px={20} anchor="center" id="va-f-ce" opacidad={kMu} />
      <Chip x={299} y={1210} texto={"LOS OJOS COMPENSAN"} color={VAC.oro} px={18} anchor="center" id="va-f-oj" opacidad={kCo} />
      <Chip x={540} y={1380} texto={"CUÉNTAME EN COMENTARIOS"} color={VAC.oro} px={22} anchor="center" id="va-f-co" opacidad={kCm * (0.75 + 0.25 * Math.sin(t * 7))} />
      <Frases frases={[{ t: 0.2, texto: "MUEVE LA CABEZA\nLEYENDO ESTO", px: 86 }, { t: Rf.compensan - 0.1, texto: "TUS OJOS SE\nCOMPENSAN SOLOS", px: 84, color: VAC.oro }, { t: Rf.coche - 0.1, texto: "¿TE MAREAS EN\nEL COCHE?", px: 92, color: VAC.coclear }]} y={450} x={104} id="titular-va-reflejo" />
      <Fuente texto={`Reflejo vestíbulo-ocular: los ojos se mueven en sentido contrario a la cabeza con una latencia de ≈ ${VA.reflejoMs.min}–${VA.reflejoMs.max} ms. El mareo en el coche se atribuye al conflicto entre lo que ven los ojos y lo que siente el oído interno (explicación habitual). Esquema.`} y={1510} delay={Rf.compensan} />
      <Cap e={e} />
    </Fondo>
  );
};
