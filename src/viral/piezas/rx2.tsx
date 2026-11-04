/**
 * «La noche que Röntgen vio a través de la piel» (SINAPSIS · historia de la medicina) · escenas 2/2
 *   rx-anna    22 dic 1895: radiografía de la mano de su esposa Anna Bertha, con su anillo (≈ 15 min de exposición); la frase «he visto mi muerte» es un relato atribuido
 *   rx-mundo   28 dic 1895 el artículo; en enero de 1896 la noticia se propaga y se radiografía una aguja clavada en una mano (John Hall-Edwards, 11 ene)
 *   rx-nobel   rechazó patentarlo; 1901: primer Nobel de Física; el dinero fue a su universidad
 *   rx-cierre  los pioneros sin protección vs hoy con dosis medida; 8 de noviembre = Día Internacional de la Radiología
 * Dibujos esquemáticos; no son imágenes históricas.
 */
import React from "react";
import { RXH, TRX } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases, FONT, MONOF } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Linea, Mano, RX, TuboCrookes, azar, sua } from "./rx-kit";

type P = { e: EscenaViralGuardada };
const Chip: React.FC<{ x: number; y: number; texto: string; color?: string; px?: number; opacidad?: number; id: string; anchor?: "left" | "center" }> = ({ x, y, texto, color = RX.oro, px = 28, opacidad = 1, id, anchor = "left" }) => (
  <div data-texto={id} style={{ position: "absolute", left: anchor === "left" ? x : x - 450, top: y, width: anchor === "left" ? undefined : 900, textAlign: anchor, opacity: opacidad, fontFamily: MONOF, fontWeight: 800, fontSize: px, letterSpacing: "0.06em", color, textShadow: "0 4px 18px rgba(0,0,0,0.85)", whiteSpace: "pre" }}>{texto}</div>
);
const SERIF = "Georgia, 'Times New Roman', serif";

/** Placa fotográfica: fondo negro con grano y esquinas; el contenido va recortado dentro. Origen = esquina superior izquierda. */
const Placa: React.FC<{ id: string; x: number; y: number; w: number; h: number; k: number; children?: React.ReactNode }> = ({ id, x, y, w, h, k, children }) => (
  <g transform={`translate(${x} ${y})`} opacity={clamp(k * 3)}>
    <defs>
      <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0B1018" /><stop offset="1" stopColor="#04070C" /></linearGradient>
      <clipPath id={`${id}-k`}><rect x={0} y={0} width={w} height={h} rx={10} /></clipPath>
    </defs>
    <rect x={-12} y={-12} width={w + 24} height={h + 24} rx={20} fill="#1A1E26" stroke="#3A404C" strokeWidth={4} />
    <rect x={0} y={0} width={w} height={h} rx={10} fill={`url(#${id}-g)`} />
    <g clipPath={`url(#${id}-k)`}>
      <g opacity={clamp(k * 1.4)}>{children}</g>
      <rect x={0} y={0} width={w} height={h} fill="#0A1626" opacity={0.65 * (1 - clamp(k))} />
      {Array.from({ length: 60 }, (_, i) => <circle key={i} cx={azar(i * 3.3) * w} cy={azar(i * 7.1) * h} r={1.5} fill="#9EC8FF" opacity={0.18} />)}
    </g>
  </g>
);

/* ───────────── rx-anna ───────────── */

export const RxAnna: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const A = TRX.anna;
  const kPl = clamp((t - a(A.placa)) / a(1.6));
  const kAn = clamp((t - a(A.anillo)) / 0.8);
  const kFe = spr(f, a(A.fecha), { damping: 14, stiffness: 140, mass: 0.7 });
  const kCi = spr(f, a(A.cita), { damping: 12, stiffness: 150, mass: 0.8 });
  const kBar = clamp((t - a(A.tiempo)) / a(1.2));
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Placa id="rxa" x={280} y={600} w={520} h={620} k={kPl}>
          <Mano x={260} y={530} s={0.74} modo="placa" anillo={kAn} />
        </Placa>
        {/* indicador del anillo */}
        <g opacity={clamp(kAn * 2)}>
          <line x1={566} y1={940} x2={836} y2={902} stroke={RX.oro} strokeWidth={4} strokeDasharray="8 8" />
          <circle cx={566} cy={940} r={9} fill={RX.oro} />
        </g>
        <Linea pos={1} y={1420} />
      </svg>
      <Chip x={850} y={858} texto={"anillo\nde oro"} color={RX.oro} px={26} id="rx-anna-anillo" opacidad={clamp(kAn * 2)} />
      <Chip x={104} y={1240} texto="22 DIC 1895" color={RX.oro} px={32} id="rx-anna-fecha" opacidad={clamp(kFe * 2)} />
      <div data-texto="rx-anna-tiempo" style={{ position: "absolute", left: 560, top: 1236, width: 420, opacity: clamp(kBar * 3), fontFamily: MONOF, fontWeight: 800, fontSize: 26, letterSpacing: "0.05em", color: RX.hielo, textAlign: "right" }}>
        ≈ {RXH.expoManoMin} MIN DE EXPOSICIÓN
        <div style={{ marginTop: 8, height: 10, borderRadius: 5, background: "rgba(191,224,255,0.2)" }}><div style={{ width: `${100 * kBar}%`, height: "100%", borderRadius: 5, background: RX.oro, marginLeft: "auto" }} /></div>
      </div>
      <div data-texto="rx-anna-cita" style={{ position: "absolute", left: 90, top: 1296, width: 900, textAlign: "center", opacity: clamp(kCi * 2), transform: `translateY(${(1 - clamp(kCi)) * 20}px)`, fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 46, color: "#fff", textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>
        «He visto mi muerte» <span style={{ fontFamily: MONOF, fontStyle: "normal", fontWeight: 700, fontSize: 24, color: RX.oro, letterSpacing: "0.04em" }}>· según se cuenta</span>
      </div>
      <Frases frases={[{ t: 0.2, texto: "6 SEMANAS\nDESPUÉS", px: 104 }, { t: A.placa - 0.2, texto: "LA MANO DE\nSU ESPOSA", px: 100, color: RX.hielo }, { t: A.anillo - 0.2, texto: "CON SU ANILLO", px: 96, color: RX.oro }, { t: A.tiempo - 0.1, texto: "QUINCE MINUTOS\nDE EXPOSICIÓN", px: 80 }]} y={450} x={104} id="titular-rx-anna" />
      <Fuente texto="Radiografía de la mano de Anna Bertha Röntgen, 22 dic 1895 (≈ 15 min). La frase es un relato atribuido, no verificado. Dibujo esquemático." y={1500} delay={A.fecha} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── rx-mundo ───────────── */

export const RxMundo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const M = TRX.mundo;
  const ent = (t0: number, d = 0.5): number => clamp((t - a(t0)) / d);
  const kPapel = ent(M.papel) * (1 - ent(M.enero - 0.1, 0.4));
  const kRed = ent(M.enero, 0.5) * (1 - ent(M.aguja - 0.1, 0.4));
  const kAg = ent(M.aguja, 0.6);
  const kSello = spr(f, a(M.fecha), { damping: 10, stiffness: 200, mass: 0.8 });
  const nodos = React.useMemo(() => Array.from({ length: 34 }, (_, i) => { const an = azar(i * 2.7) * Math.PI * 2, r = 120 + Math.sqrt(azar(i * 5.1)) * 330; return { x: 540 + Math.cos(an) * r, y: 900 + Math.sin(an) * r * 0.8, ini: azar(i * 8.3) * 1.5 + r / 330 * 0.6 }; }), []);
  const pos = t < a(M.enero) ? 2 : t < a(M.aguja) ? lerp(2, 3, clamp((t - a(M.enero)) / a(2))) : 3;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* el artículo */}
        <g opacity={kPapel} transform={`translate(540 880) rotate(${-2 + kPapel * 0}) scale(${0.94 + 0.06 * kPapel}) translate(-540 -880)`}>
          <rect x={190} y={640} width={700} height={480} rx={10} fill={RX.papel} stroke="#B7A67C" strokeWidth={4} />
          <text x={540} y={730} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={40} fill="#2A2418">Ueber eine neue Art</text>
          <text x={540} y={782} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={40} fill="#2A2418">von Strahlen</text>
          <text x={540} y={828} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={28} fill="#5A4E36">W. C. Röntgen · Würzburg</text>
          {Array.from({ length: 6 }, (_, i) => <rect key={i} x={250} y={868 + i * 34} width={i % 3 === 2 ? 380 : 580} height={9} rx={4} fill="#8A7C5A" opacity={0.5} />)}
          <g transform={`translate(790 1040) rotate(-12) scale(${0.6 + 0.4 * clamp(kSello)})`} opacity={clamp(kSello * 2)}>
            <rect x={-130} y={-34} width={260} height={68} rx={10} fill="none" stroke="#C2362F" strokeWidth={6} />
            <text x={0} y={14} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={36} fill="#C2362F">28 DIC 1895</text>
          </g>
        </g>
        {/* la noticia se propaga */}
        <g opacity={kRed}>
          {[0, 1, 2].map((k) => { const p = ((t * 0.5 + k / 3) % 1); return <ellipse key={k} cx={540} cy={900} rx={40 + p * 440} ry={32 + p * 360} fill="none" stroke={RX.verde} strokeWidth={4} opacity={0.5 * (1 - p)} />; })}
          {nodos.map((n, i) => { const k = clamp((t - a(M.enero) - n.ini * 0.5) / 0.4); return k > 0 ? (
            <g key={i} opacity={k}><line x1={540} y1={900} x2={n.x} y2={n.y} stroke={RX.verde} strokeOpacity={0.18} strokeWidth={2} /><circle cx={n.x} cy={n.y} r={9 * k} fill={RX.verde} /><circle cx={n.x} cy={n.y} r={20} fill={RX.verde} opacity={0.15} /></g>
          ) : null; })}
          <circle cx={540} cy={900} r={22} fill={RX.oro} stroke="#fff" strokeWidth={5} />
          <text x={540} y={952} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={24} fill={RX.oro}>Würzburg</text>
        </g>
        {/* la aguja */}
        <g opacity={kAg} transform={`translate(0 ${(1 - kAg) * 30})`}>
          <Placa id="rxm" x={300} y={620} w={480} h={620} k={1}>
            <Mano x={240} y={430} s={0.82} modo="placa" aguja={clamp((t - a(M.aguja) - 0.5) / 0.9)} />
          </Placa>
        </g>
        <Linea pos={pos} y={1420} />
      </svg>
      <Chip x={540} y={1262} texto="11 ENE 1896 · UNA AGUJA CLAVADA EN UNA MANO" color={RX.oro} px={24} anchor="center" id="rx-mundo-aguja" opacidad={clamp(kAg * 1.6)} />
      <Frases frases={[{ t: 0.2, texto: "PUBLICA\nEL HALLAZGO", px: 100 }, { t: M.enero - 0.1, texto: "EN ENERO,\nEL MUNDO LO USA", px: 88, color: RX.verde }, { t: M.aguja - 0.1, texto: "VEN UNA AGUJA\nDENTRO DE LA MANO", px: 76, color: RX.oro }]} y={450} x={104} id="titular-rx-mundo" />
      <Fuente texto="Artículo de Röntgen: 28 dic 1895. Primer uso clínico documentado: John Hall-Edwards, 11 ene 1896 (aguja en una mano). Dibujos esquemáticos." y={1500} delay={M.fecha} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── rx-nobel ───────────── */

export const RxNobel: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const N = TRX.nobel;
  const kPat = spr(f, a(N.patente), { damping: 14, stiffness: 120, mass: 0.8 });
  const kSe = spr(f, a(N.sello), { damping: 9, stiffness: 220, mass: 0.8 });
  const kMe = spr(f, a(N.medalla), { damping: 11, stiffness: 140, mass: 0.9 });
  const kPr = clamp((t - a(N.primer)) / 0.5);
  const kUni = clamp((t - a(N.dinero) + 0.3) / 0.5);
  const monedas = React.useMemo(() => Array.from({ length: 10 }, (_, i) => ({ off: i * 0.16, dx: (azar(i * 3.3) - 0.5) * 40 })), []);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="rxn-oro" cx="38%" cy="32%" r="80%"><stop offset="0" stopColor="#FFF3B8" /><stop offset="0.45" stopColor="#FFD166" /><stop offset="1" stopColor="#B07A1E" /></radialGradient>
          <filter id="rxn-glo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16" /></filter>
        </defs>
        {/* patente rechazada */}
        <g opacity={clamp(kPat * 2)} transform={`translate(300 850) rotate(-4) scale(${0.9 + 0.1 * clamp(kPat)}) translate(-300 -850)`}>
          <rect x={110} y={640} width={380} height={420} rx={8} fill={RX.papel} stroke="#B7A67C" strokeWidth={4} />
          <text x={300} y={712} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={44} fill="#2A2418">PATENTE</text>
          {Array.from({ length: 8 }, (_, i) => <rect key={i} x={150} y={750 + i * 34} width={i % 3 === 2 ? 190 : 300} height={9} rx={4} fill="#8A7C5A" opacity={0.5} />)}
          <g transform={`translate(300 880) rotate(-14) scale(${0.5 + 0.5 * clamp(kSe)})`} opacity={clamp(kSe * 2)}>
            <rect x={-160} y={-52} width={320} height={104} rx={12} fill="rgba(194,54,47,0.12)" stroke="#C2362F" strokeWidth={8} />
            <text x={0} y={-4} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={34} fill="#C2362F">RECHAZÓ</text>
            <text x={0} y={34} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={34} fill="#C2362F">PATENTARLO</text>
          </g>
        </g>
        {/* medalla */}
        <g opacity={clamp(kMe * 2)} transform={`translate(740 840) scale(${0.6 + 0.4 * clamp(kMe)}) translate(-740 -840)`}>
          <circle cx={740} cy={840} r={190} fill={RX.oro} opacity={0.28} filter="url(#rxn-glo)" />
          <circle cx={740} cy={840} r={150} fill="url(#rxn-oro)" stroke="#8A5A10" strokeWidth={8} />
          <circle cx={740} cy={840} r={118} fill="none" stroke="#8A5A10" strokeWidth={4} strokeOpacity={0.6} />
          <text x={740} y={822} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={38} fill="#5A3A08">NOBEL</text>
          <text x={740} y={880} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={72} fill="#5A3A08">{RXH.nobelAnio}</text>
          <ellipse cx={690} cy={760} rx={46} ry={18} fill="#fff" opacity={0.35} transform="rotate(-28 690 760)" />
        </g>
        {/* universidad y monedas */}
        <g opacity={clamp(kUni * 2)}>
          <polygon points="360,1200 540,1124 720,1200" fill="#C9D4E4" stroke="#8A97AC" strokeWidth={4} />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={384 + i * 62} y={1206} width={28} height={70} fill="#E2EAF5" stroke="#8A97AC" strokeWidth={3} />)}
          <rect x={348} y={1276} width={384} height={18} fill="#C9D4E4" stroke="#8A97AC" strokeWidth={3} />
        </g>
        {monedas.map((m, i) => {
          const u = clamp((t - a(N.dinero) - m.off) / 0.9);
          if (u <= 0 || u >= 1) return null;
          const x = lerp(740, 540, u) + m.dx * Math.sin(u * Math.PI), y = lerp(990, 1140, u) - 120 * Math.sin(u * Math.PI);
          return <g key={i} opacity={Math.sin(u * Math.PI)}><circle cx={x} cy={y} r={20} fill="url(#rxn-oro)" stroke="#8A5A10" strokeWidth={3} /><text x={x} y={y + 8} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={22} fill="#5A3A08">$</text></g>;
        })}
        <Linea pos={4} y={1420} />
      </svg>
      <Chip x={740} y={1010} texto={"1.º PREMIO NOBEL\nDE FÍSICA"} color={RX.oro} px={26} anchor="center" id="rx-nobel-primer" opacidad={kPr * (1 - clamp((t - a(N.dinero) + 0.3) / 0.4))} />
      <Chip x={540} y={1312} texto="UNIVERSIDAD DE WÜRZBURG" color={RX.hielo} px={24} anchor="center" id="rx-nobel-uni" opacidad={clamp(kUni * 1.6)} />
      <Frases frases={[{ t: 0.2, texto: "NO PATENTÓ\nLOS RAYOS X", px: 100 }, { t: N.medalla, texto: "1901: PRIMER\nNOBEL DE FÍSICA", px: 88, color: RX.oro }, { t: N.dinero - 0.2, texto: "EL DINERO FUE\nA SU UNIVERSIDAD", px: 80, color: RX.verde }]} y={450} x={104} id="titular-rx-nobel" />
      <Fuente texto="Röntgen rechazó patentar el descubrimiento y recibió el primer Nobel de Física (1901); según algunas fuentes, entregó el dinero a su universidad." y={1500} delay={N.primer} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── rx-cierre ───────────── */

export const RxCierre: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TRX.cierre;
  const kL = spr(f, a(C.riesgo), { damping: 14, stiffness: 120, mass: 0.9 });
  const kQ = clamp((t - a(C.quema)) / 0.5);
  const kR = spr(f, a(C.hoy), { damping: 13, stiffness: 140, mass: 0.8 });
  const kD = spr(f, a(C.dia), { damping: 11, stiffness: 150, mass: 0.9 });
  const fila = (txt: string, y: number, k: number, color: string, id: string, x: number) => <div key={id} data-texto={id} style={{ position: "absolute", left: x, top: y, width: 420, opacity: k, fontFamily: FONT, fontWeight: 700, fontSize: 28, lineHeight: 1.15, color }}>{txt}</div>;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* 1896 */}
        <g opacity={clamp(kL * 2)} transform={`translate(0 ${(1 - clamp(kL)) * 24})`}>
          <rect x={60} y={620} width={460} height={420} rx={26} fill="rgba(255,90,95,0.08)" stroke="#FF5A5F" strokeOpacity={0.6} strokeWidth={4} />
          <text x={96} y={690} fontFamily={FONT} fontWeight={900} fontSize={64} fill={RX.rojo}>1896</text>
          <TuboCrookes x={190} y={780} s={0.26} t={t} energia={0.9} />
          <Mano x={400} y={806} s={0.14} modo="placa" />
          <path d={`M 110 1000 L 130 ${962 - kQ * 4} L 150 1000 Z`} fill={RX.rojo} opacity={kQ} />
        </g>
        {/* hoy */}
        <g opacity={clamp(kR * 2)} transform={`translate(0 ${(1 - clamp(kR)) * 24})`}>
          <rect x={560} y={620} width={460} height={420} rx={26} fill="rgba(124,255,178,0.08)" stroke={RX.verde} strokeOpacity={0.6} strokeWidth={4} />
          <text x={596} y={690} fontFamily={FONT} fontWeight={900} fontSize={64} fill={RX.verde}>HOY</text>
          {/* dosímetro y delantal de plomo */}
          <rect x={620} y={740} width={110} height={70} rx={12} fill="#17202C" stroke={RX.verde} strokeWidth={4} />
          <circle cx={650} cy={775} r={14} fill="none" stroke={RX.verde} strokeWidth={4} /><rect x={676} y={764} width={36} height={8} rx={4} fill={RX.verde} /><rect x={676} y={780} width={24} height={8} rx={4} fill={RX.verde} opacity={0.6} />
          <path d="M 880 724 L 950 724 L 966 788 L 950 848 L 880 848 L 864 788 Z" fill="#33404E" stroke={RX.hielo} strokeWidth={4} />
          <path d="M 898 724 L 915 760 L 932 724" fill="none" stroke={RX.hielo} strokeWidth={4} />
        </g>
        {/* calendario */}
        <g opacity={clamp(kD * 2)} transform={`translate(540 1200) scale(${0.85 + 0.15 * clamp(kD)}) translate(-540 -1200)`}>
          <rect x={90} y={1080} width={900} height={250} rx={30} fill="#F4F7FB" />
          <path d="M 90 1110 Q 90 1080 120 1080 L 960 1080 Q 990 1080 990 1110 L 990 1150 L 90 1150 Z" fill="#C2362F" />
          <text x={140} y={1130} fontFamily={MONOF} fontWeight={800} fontSize={34} fill="#fff" letterSpacing="0.08em">NOVIEMBRE</text>
          <text x={240} y={1300} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={150} fill="#10141C">8</text>
          <text x={730} y={1214} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill="#10141C">DÍA INTERNACIONAL</text>
          <text x={730} y={1266} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill="#C2362F">DE LA RADIOLOGÍA</text>
        </g>
        <Linea pos={5} y={1440} />
      </svg>
      {fila("sin protección", 880, clamp(kQ * 2), "#FFD0D2", "rx-cierre-l1", 100)}
      {fila("exposiciones de minutos", 925, clamp(kQ * 2), "#FFD0D2", "rx-cierre-l2", 100)}
      {fila("quemaduras en la piel", 970, clamp(kQ * 2), RX.rojo, "rx-cierre-l3", 164)}
      {fila("dosis medida", 880, clamp(kR * 2), "#D6FFE8", "rx-cierre-r1", 620)}
      {fila("fracciones de segundo", 925, clamp(kR * 2), "#D6FFE8", "rx-cierre-r2", 620)}
      {fila("protección de plomo", 970, clamp(kR * 2), "#D6FFE8", "rx-cierre-r3", 620)}
      <Frases frases={[{ t: 0.2, texto: "NADIE CONOCÍA\nEL RIESGO", px: 92 }, { t: C.hoy - 0.1, texto: "HOY SE\nDOSIFICAN", px: 104, color: RX.verde }, { t: C.dia - 0.1, texto: "8 DE NOVIEMBRE", px: 100, color: RX.oro }]} y={450} x={104} id="titular-rx-cierre" />
      <Fuente texto="8 de noviembre: Día Internacional de la Radiología (desde 2012). Comparación esquemática: las exposiciones modernas varían según el estudio." y={1520} delay={C.dia} />
      <Cap e={e} />
    </Fondo>
  );
};
