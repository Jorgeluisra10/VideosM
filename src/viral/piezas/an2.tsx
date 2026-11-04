/**
 * «La cena en que tres médicos se durmieron» (SINAPSIS · historia de la anestesia) · escenas 2/2
 *   an-noche     la noche del 4 nov 1847: inhalan cloroformo, conversan animados y pierden el conocimiento
 *   an-despierta Simpson despierta y comprende que ha encontrado lo que buscaba; pocos días después, el primer parto con cloroformo
 *   an-reina     críticas religiosas y 7 abr 1853: la reina Victoria usa cloroformo en un parto, administrado por John Snow
 *   an-cierre    el cloroformo ya no se usa, pero esa cena abrió el camino de la anestesia moderna
 * Dibujos esquemáticos; no son imágenes de la época.
 */
import React from "react";
import { TAN } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases, FONT, MONOF } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { AN, Botella, Cena, Chip, LineaT, Persona, SERIF, Sala } from "./an-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── an-noche ───────────── */

export const AnNoche: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const N = TAN.noche;
  const est = [0, 1, 2].map((i) => clamp(spr(f, a(N.caen + i * 0.35), { damping: 14, stiffness: 70, mass: 1.1 }))) as [number, number, number];
  const inhala = clamp((t - a(N.inhalan)) / 0.5) * (1 - clamp((t - a(N.charla) + 0.2) / 0.4));
  const charla = clamp((t - a(N.charla)) / 0.4);
  const fase = t < a(N.charla) ? 0 : t < a(N.caen) ? 1 : 2;
  const pasos = ["1 · INHALAN", "2 · CONVERSAN", "3 · PIERDEN EL CONOCIMIENTO"];
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Sala t={t} y={900} />
        <Cena t={t} est={est} inhala={inhala} charla={charla} brilloBotella={0.6 + 0.3 * Math.sin(t * 2)} zzz={clamp((t - a(N.silencio)) / 0.6)} />
        <LineaT pos={2} y={1430} />
      </svg>
      <div data-texto="an-noche-pasos" style={{ position: "absolute", left: 60, top: 1296, width: 960, display: "flex", justifyContent: "space-between" }}>
        {pasos.map((p, i) => <span key={i} style={{ fontFamily: MONOF, fontWeight: 800, fontSize: 22, letterSpacing: "0.04em", color: i === fase ? AN.oro : "#E8DDC0", opacity: i <= fase ? 1 : 0.3, textShadow: "0 3px 12px #000" }}>{p}</span>)}
      </div>
      <Frases frases={[{ t: 0.2, texto: "LA NOCHE DEL\n4 DE NOVIEMBRE", px: 88 }, { t: N.inhalan - 0.1, texto: "INHALAN\nCLOROFORMO", px: 100, color: AN.cloro }, { t: N.charla - 0.1, texto: "CONVERSAN\nANIMADOS", px: 100, color: AN.oro }, { t: N.caen - 0.1, texto: "…Y PIERDEN EL\nCONOCIMIENTO", px: 84, color: AN.rojo }]} y={450} x={104} id="titular-an-noche" />
      <Fuente texto="Relato más difundido de la cena de Simpson con Keith y Duncan; algunos detalles se han embellecido con los años. Dibujo esquemático." y={1510} delay={N.charla} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── an-despierta ───────────── */

export const AnDespierta: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const D = TAN.despierta;
  const kW = easeOut((t - a(D.ojos)) / 0.8);
  const kId = spr(f, a(D.idea), { damping: 9, stiffness: 200, mass: 0.8 });
  const kBu = clamp((t - a(D.busca)) / 0.5);
  const kDi = clamp((t - a(D.dias)) / 0.4);
  const kPa = spr(f, a(D.partos), { damping: 11, stiffness: 160, mass: 0.8 });
  const dia = Math.min(7, Math.floor(clamp((t - a(D.dias)) / a(0.9)) * 5));
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Sala t={t} y={880} />
        <Persona x={540} y={790} s={1.3} tipo="pelo" abrigo="#2A2230" estado={0.85 * (1 - kW)} ojos={kW > 0.5 ? 1 : 0} habla={kId > 0.5 ? 0.25 : 0} />
        {/* idea */}
        <g opacity={clamp(kId * 2)} transform={`translate(840 690) scale(${0.5 + 0.5 * clamp(kId)})`}>
          {Array.from({ length: 10 }, (_, i) => <line key={i} x1={Math.cos((i / 10) * 6.283) * 84} y1={Math.sin((i / 10) * 6.283) * 84} x2={Math.cos((i / 10) * 6.283) * 118} y2={Math.sin((i / 10) * 6.283) * 118} stroke={AN.oro} strokeWidth={7} strokeLinecap="round" />)}
          <circle r={64} fill={AN.oro} /><circle r={64} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={6} /><rect x={-24} y={60} width={48} height={30} rx={6} fill="#8A7A5A" />
          <path d="M -22 20 Q 0 -30 22 20" stroke="#8A5A10" strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
        {/* mesa con el frasco */}
        <rect x={50} y={1010} width={980} height={34} rx={6} fill={AN.madera} stroke="#2A1A0E" strokeWidth={3} />
        <Botella x={230} y={1010} s={0.9} etiqueta="CHLORO-FORM" brillo={kBu} />
        {/* calendario: pocos días después */}
        <g opacity={kDi}>
          <rect x={90} y={1070} width={900} height={170} rx={22} fill="#F4EEDD" stroke="#B7A67C" strokeWidth={4} />
          <rect x={90} y={1070} width={900} height={42} rx={22} fill="#C2362F" /><rect x={90} y={1090} width={900} height={22} fill="#C2362F" />
          <text x={540} y={1100} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={26} fill="#fff" letterSpacing="0.1em">NOVIEMBRE 1847</text>
          {Array.from({ length: 8 }, (_, i) => {
            const x = 150 + i * 96, activo = i <= dia && t > a(D.dias);
            return <g key={i}><rect x={x - 38} y={1128} width={76} height={92} rx={12} fill={i === 0 ? AN.oro : activo ? "#E8DDC0" : "#F4EEDD"} stroke={activo || i === 0 ? "#8A5A10" : "#CFC4A4"} strokeWidth={3} /><text x={x} y={1190} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={46} fill="#2A2418">{4 + i}</text></g>;
          })}
        </g>
        {/* parto */}
        <g opacity={clamp(kPa * 2)} transform={`translate(900 1150) scale(${0.6 + 0.4 * clamp(kPa)})`}>
          <ellipse cx={0} cy={24} rx={64} ry={34} fill="#E8DDC0" stroke="#8A7C5A" strokeWidth={4} /><circle cx={-14} cy={-12} r={26} fill="#F0C8A8" stroke="#7A5A44" strokeWidth={3} /><circle cx={-22} cy={-14} r={3.5} fill="#3A2A20" /><circle cx={-6} cy={-14} r={3.5} fill="#3A2A20" />
          <path d="M 28 -22 C 28 -40 54 -40 54 -22 C 54 -8 28 8 28 8 C 28 8 2 -8 2 -22 Z" fill="#E0507A" transform="translate(10 -30) scale(0.6)" />
        </g>
        <LineaT pos={2.2} y={1430} />
      </svg>
      <Chip x={540} y={1262} texto="PRIMER PARTO CON CLOROFORMO · POCOS DÍAS DESPUÉS" color={AN.oro} px={21} anchor="center" id="an-despierta-parto" opacidad={clamp(kPa * 2)} />
      <Frases frases={[{ t: 0.2, texto: "AL DESPERTAR…", px: 104 }, { t: D.idea - 0.1, texto: "SIMPSON\nCOMPRENDE", px: 104, color: AN.oro }, { t: D.busca - 0.1, texto: "LO QUE\nBUSCABA", px: 104, color: AN.cloro }, { t: D.dias - 0.1, texto: "POCOS DÍAS\nDESPUÉS", px: 100 }, { t: D.partos - 0.1, texto: "YA LO USA\nEN PARTOS", px: 100, color: AN.vela }]} y={450} x={104} id="titular-an-despierta" />
      <Fuente texto="Simpson hizo públicas sus pruebas con cloroformo en noviembre de 1847; las fuentes difieren en el día exacto de su primer uso en un parto. Dibujo esquemático." y={1510} delay={D.dias} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── an-reina ───────────── */

export const AnReina: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const R = TAN.reina;
  const kCr = clamp((t - a(R.critica)) / 0.5);
  const kFe = spr(f, a(R.fecha), { damping: 12, stiffness: 150, mass: 0.8 });
  const kRe = spr(f, a(R.reina), { damping: 10, stiffness: 160, mass: 0.9 });
  const kPa = clamp((t - a(R.parto)) / 0.5);
  const flecha = clamp((t - a(R.fecha)) / 0.8);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="anr-vit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3A4A9A" /><stop offset="0.5" stopColor="#7A2A6A" /><stop offset="1" stopColor="#B8502A" /></linearGradient>
          <radialGradient id="anr-oro" cx="40%" cy="30%" r="80%"><stop offset="0" stopColor="#FFF3B8" /><stop offset="0.5" stopColor="#FFD166" /><stop offset="1" stopColor="#B07A1E" /></radialGradient>
        </defs>
        <Sala t={t} y={820} intensidad={0.8} />
        {/* vitral: críticas religiosas */}
        <g opacity={kCr} transform="translate(150 640)">
          <path d="M 0 300 L 0 100 A 100 100 0 0 1 200 100 L 200 300 Z" fill="url(#anr-vit)" stroke="#6A5A4A" strokeWidth={8} />
          <path d="M 100 20 L 100 300 M 0 150 L 200 150 M 0 230 L 200 230" stroke="#1A1410" strokeWidth={6} /><path d="M 82 70 L 118 70 M 100 52 L 100 130" stroke="#FFD166" strokeWidth={12} strokeLinecap="round" />
          <path d="M 100 20 L 100 300" stroke="#1A1410" strokeWidth={6} />
        </g>
        {/* flecha */}
        <g opacity={flecha}><path d="M 410 780 C 480 700 560 700 640 760" stroke={AN.vela} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray="14 12" /><path d="M 614 730 L 646 764 L 604 778" stroke={AN.vela} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>
        {/* corona y frasco */}
        <g opacity={clamp(kRe * 2)} transform={`translate(780 800) scale(${0.7 + 0.3 * clamp(kRe)})`}>
          <circle r={190} fill={AN.oro} opacity={0.16} />
          <path d="M -130 90 L -150 -60 L -70 10 L 0 -100 L 70 10 L 150 -60 L 130 90 Z" fill="url(#anr-oro)" stroke="#8A5A10" strokeWidth={8} strokeLinejoin="round" />
          <rect x={-134} y={90} width={268} height={36} rx={10} fill="url(#anr-oro)" stroke="#8A5A10" strokeWidth={8} />
          {[[-150, -66], [0, -108], [150, -66]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={16} fill="#E8DDC0" stroke="#8A5A10" strokeWidth={5} />)}
          {[-60, 0, 60].map((x, i) => <circle key={i} cx={x} cy={92} r={12} fill={["#C2362F", "#2A6AC2", "#C2362F"][i]} />)}
        </g>
        <LineaT pos={3} y={1430} />
      </svg>
      <Chip x={150} y={960} texto="críticas religiosas" color={AN.hielo} px={24} id="an-reina-crit" opacidad={kCr} />
      <Chip x={690} y={960} texto="7 ABR 1853" color={AN.oro} px={34} anchor="left" id="an-reina-fecha" opacidad={clamp(kFe * 2)} />
      <Chip x={540} y={1056} texto={"Simpson respondió con el «sueño profundo»\nde Adán (Génesis)"} color={AN.hielo} px={22} anchor="center" id="an-reina-adan" opacidad={clamp(kCr * 1.4) * (1 - kPa)} />
      <div data-texto="an-reina-cita" style={{ position: "absolute", left: 90, top: 1050, width: 900, textAlign: "center", opacity: kPa, transform: `translateY(${(1 - kPa) * 18}px)` }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 700, fontSize: 52, color: "#fff", textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>«ese bendito cloroformo»</div>
        <div style={{ marginTop: 10, fontFamily: MONOF, fontWeight: 700, fontSize: 22, color: AN.oro, letterSpacing: "0.04em" }}>diario de la reina Victoria · lo administró el médico John Snow</div>
      </div>
      <Frases frases={[{ t: 0.2, texto: "ALGUNOS LO\nCRITICAN", px: 100 }, { t: R.fecha - 0.1, texto: "1853: LO USA\nLA REINA VICTORIA", px: 80, color: AN.oro }, { t: R.parto - 0.1, texto: "EN SU PARTO", px: 108, color: AN.vela }]} y={450} x={104} id="titular-an-reina" />
      <Fuente texto="Parto del príncipe Leopoldo, 7 abr 1853, con cloroformo administrado por John Snow; cita traducida del diario de la reina. Dibujo esquemático." y={1510} delay={R.fecha} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── an-cierre ───────────── */

const ecg = (u: number): number => { const k = ((u % 1) + 1) % 1; return k < 0.12 ? 0 : k < 0.2 ? 6 * Math.sin(((k - 0.12) / 0.08) * Math.PI) : k < 0.3 ? 0 : k < 0.34 ? -10 * (k - 0.3) / 0.04 : k < 0.4 ? -10 + 90 * ((k - 0.34) / 0.06) : k < 0.46 ? 80 - 100 * ((k - 0.4) / 0.06) : k < 0.5 ? -20 + 20 * ((k - 0.46) / 0.04) : k < 0.66 ? 14 * Math.sin(((k - 0.5) / 0.16) * Math.PI) : 0; };

export const AnCierre: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TAN.cierre;
  const kYa = spr(f, a(C.ya), { damping: 8, stiffness: 220, mass: 0.9 });
  const kCam = clamp((t - a(C.camino)) / a(1.8));
  const kMo = clamp((t - a(C.moderna)) / 0.5);
  const nodos: [number, string, string][] = [[240, "1846", "éter"], [540, "1847", "cloroformo"], [840, "HOY", "moderna"]];
  const pts = Array.from({ length: 60 }, (_, i) => `${i * 10},${(-ecg(i / 12 - t * 0.8)).toFixed(1)}`).join(" ");
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Sala t={t} y={800} intensidad={0.8} />
        <Botella x={280} y={900} s={1.15} etiqueta="CHLORO-FORM" brillo={0.3 * (1 - clamp(kYa))} />
        {/* sello: ya no se usa */}
        <g opacity={clamp(kYa * 2)} transform={`translate(330 770) rotate(-14) scale(${0.4 + 0.6 * clamp(kYa)})`}>
          <rect x={-190} y={-50} width={380} height={100} rx={12} fill="rgba(194,54,47,0.2)" stroke="#E04A3F" strokeWidth={9} />
          <text x={0} y={22} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={50} fill="#FF6A5F">YA NO SE USA</text>
        </g>
        {/* camino */}
        <line x1={240} y1={1030} x2={840} y2={1030} stroke="#E8DDC0" strokeOpacity={0.25} strokeWidth={8} strokeLinecap="round" />
        <line x1={240} y1={1030} x2={lerp(240, 840, easeOut(kCam))} y2={1030} stroke={AN.vela} strokeWidth={8} strokeLinecap="round" />
        {nodos.map(([x, a1, b1], i) => { const on = kCam > i / 2 - 0.01; return (
          <g key={i} transform={`translate(${x} 1030)`}><circle r={on ? 26 : 18} fill={on ? AN.vela : "#14100B"} stroke="#fff" strokeOpacity={on ? 1 : 0.4} strokeWidth={5} />
            <text x={0} y={-44} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={on ? "#fff" : "#E8DDC0"} opacity={on ? 1 : 0.5}>{a1}</text>
            <text x={0} y={62} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={22} fill={AN.hielo} opacity={on ? 1 : 0.5}>{b1}</text></g>
        ); })}
        {/* monitor moderno */}
        <g opacity={kMo} transform={`translate(0 ${(1 - kMo) * 24})`}>
          <rect x={210} y={1130} width={660} height={170} rx={22} fill="#06120E" stroke={AN.cloro} strokeWidth={5} />
          <g transform="translate(250 1228)"><polyline points={pts} fill="none" stroke={AN.cloro} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" /></g>
          <text x={540} y={1160} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={22} fill={AN.cloro} letterSpacing="0.1em">ANESTESIA MODERNA · MONITORIZADA</text>
        </g>
        <LineaT pos={4} y={1440} />
      </svg>
      <Chip x={500} y={846} texto={"riesgo para\nel corazón"} color={AN.rojo} px={28} id="an-cierre-riesgo" opacidad={clamp(kYa * 1.6)} />
      <Frases frases={[{ t: 0.2, texto: "EL CLOROFORMO\nYA NO SE USA", px: 84 }, { t: C.camino - 0.1, texto: "PERO ABRIÓ\nEL CAMINO", px: 100, color: AN.oro }, { t: C.moderna - 0.1, texto: "ANESTESIA\nMODERNA", px: 104, color: AN.cloro }]} y={450} x={104} id="titular-an-cierre" />
      <Fuente texto="El cloroformo se abandonó sobre todo por su estrecho margen de seguridad (riesgo de paro cardíaco). Esquema; los anestésicos actuales se vigilan con monitores." y={1520} delay={C.ya} />
      <Cap e={e} />
    </Fondo>
  );
};
