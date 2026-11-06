/**
 * «La inyección que cambió todo» (SINAPSIS · historia de la insulina) · escenas 2/2
 *   ins-segunda  Collip purifica el extracto; el 23 ene 1922 lo inyectan de nuevo y en un día los síntomas casi desaparecen
 *   ins-nobel    Nobel de Medicina 1923 para Banting y Macleod, que comparten el dinero con Best y Collip
 *   ins-patente  la patente se vende a la Universidad de Toronto por un dólar para que la insulina se fabrique sin trabas
 *   ins-hoy      hoy millones de personas con diabetes usan insulina; cada 14 de noviembre se recuerda esta historia
 * Dibujos esquemáticos; no son imágenes de la época.
 */
import React from "react";
import { INS, TIN } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases, FONT, MONOF } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Persona } from "./an-kit";
import { Ambiente, Calendario, Cama, CirculoAzul, Chip, Frasco, IN, Jeringa, LineaI, Nino, SERIF, azar } from "./in-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── ins-segunda ───────────── */

export const InsSegunda: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const S = TIN.segunda;
  const kCo = spr(f, a(S.collip), { damping: 13, stiffness: 130, mass: 0.8 });
  const turbio = 1 - clamp((t - a(S.filtro)) / a(1.4));
  const kFe = clamp((t - a(S.fecha)) / 0.5);
  const ent = easeOut((t - a(S.inyeccion)) / a(0.9)), emb = clamp((t - a(S.inyeccion) - 0.5) / 0.8);
  const kRe = clamp((t - a(S.reloj)) / a(1.0));
  const mej = easeOut((t - a(S.mejora)) / 0.8);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={900} color={mej > 0.3 ? IN.verde : IN.azul} intensidad={0.8} />
        <g opacity={clamp(kCo * 2)} transform={`translate(0 ${(1 - clamp(kCo)) * 30})`}><Persona x={200} y={810} s={0.95} tipo="calvo" abrigo="#E8EEF4" /></g>
        <rect x={50} y={1010} width={620} height={34} rx={6} fill="#4A5A6A" stroke="#2A3440" strokeWidth={3} /><rect x={90} y={1044} width={540} height={140} fill="#16202C" />
        <Frasco x={430} y={1010} s={0.95} nivel={0.75} brillo={0.3 + 0.6 * (1 - turbio)} turbio={turbio} etiqueta="INSULINA" />
        {/* paciente */}
        <Cama x={840} y={1050} s={0.7} />
        <Nino x={800} y={840} s={0.8} estado={mej} />
        <g opacity={clamp(ent * 3)}><Jeringa x={lerp(640, 760, ent)} y={950} s={0.7} rot={6} embolo={emb} /></g>
        {/* reloj de 24 horas */}
        <g opacity={clamp(kRe * 3)} transform="translate(300 1270)">
          <circle r={84} fill="#F2EAD6" stroke="#D9B04A" strokeWidth={9} />
          <circle r={70} fill="none" stroke={IN.verde} strokeWidth={10} strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 70 * kRe} ${2 * Math.PI * 70}`} transform="rotate(-90)" />
          {Array.from({ length: 12 }, (_, i) => <line key={i} x1={Math.cos((i / 12) * 6.283) * 56} y1={Math.sin((i / 12) * 6.283) * 56} x2={Math.cos((i / 12) * 6.283) * 64} y2={Math.sin((i / 12) * 6.283) * 64} stroke="#2A2418" strokeWidth={4} />)}
          <line x1={0} y1={0} x2={Math.cos(kRe * 6.283 - 1.5708) * 48} y2={Math.sin(kRe * 6.283 - 1.5708) * 48} stroke="#B23A2A" strokeWidth={6} strokeLinecap="round" /><circle r={7} fill="#B23A2A" />
        </g>
        <LineaI pos={2.4} y={1440} />
      </svg>
      <Chip x={104} y={606} texto="23 ENE 1922" color={IN.oro} px={34} id="ins-seg-fecha" opacidad={kFe} />
      <Chip x={200} y={1064} texto={"James Collip\nbioquímico"} color={IN.hielo} px={20} id="ins-seg-collip" opacidad={clamp(kCo * 2)} />
      <Chip x={540} y={1214} texto="24 h" color={IN.verde} px={40} anchor="left" id="ins-seg-24" opacidad={clamp(kRe * 3)} />
      <Chip x={700} y={1262} texto={"síntomas\ncasi desaparecen"} color={IN.verde} px={22} id="ins-seg-sint" opacidad={clamp(mej * 2)} />
      <Frases frases={[{ t: 0.2, texto: "COLLIP\nPURIFICA", px: 108, color: IN.ambar }, { t: S.fecha - 0.1, texto: "23 DE\nENERO", px: 108, color: IN.oro }, { t: S.inyeccion - 0.1, texto: "SEGUNDA\nINYECCIÓN", px: 100 }, { t: S.reloj - 0.1, texto: "EN UN DÍA…", px: 116, color: IN.claro }, { t: S.mejora - 0.1, texto: "…CASI SANO", px: 112, color: IN.verde }]} y={450} x={104} id="titular-ins-segunda" />
      <Fuente texto="El 23 ene 1922, con el extracto purificado por James Collip, los síntomas de Leonard Thompson casi desaparecieron en 24 h (Univ. de Toronto). Dibujo esquemático." y={1520} delay={S.fecha} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── ins-nobel ───────────── */

const Tarjeta: React.FC<{ x: number; y: number; nombre: string; rol: string; nobel?: boolean; k: number }> = ({ x, y, nombre, rol, nobel, k }) => (
  <g opacity={clamp(k * 2)} transform={`translate(${x} ${y}) scale(${0.8 + 0.2 * clamp(k)}) translate(${-x} ${-y})`}>
    <rect x={x - 130} y={y - 50} width={260} height={100} rx={18} fill="#0B1424" stroke={nobel ? IN.oro : IN.azul} strokeWidth={6} />
    <text x={x} y={y - 6} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill="#fff">{nombre}</text>
    <text x={x} y={y + 30} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={20} fill={nobel ? IN.oro : IN.claro}>{rol}</text>
  </g>
);

export const InsNobel: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const N = TIN.nobel;
  const kMe = spr(f, a(N.medalla), { damping: 11, stiffness: 150, mass: 0.9 });
  const kNo = spr(f, a(N.nombres), { damping: 12, stiffness: 160, mass: 0.8 });
  const kCo = clamp((t - a(N.comparten)) / 0.8);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><radialGradient id="insn-oro" cx="38%" cy="32%" r="80%"><stop offset="0" stopColor="#FFF3B8" /><stop offset="0.45" stopColor="#FFD166" /><stop offset="1" stopColor="#B07A1E" /></radialGradient></defs>
        <Ambiente t={t} y={820} intensidad={0.7} />
        <g opacity={clamp(kMe * 2)} transform={`translate(540 800) scale(${0.6 + 0.4 * clamp(kMe)}) translate(-540 -800)`}>
          <circle cx={540} cy={800} r={230} fill={IN.oro} opacity={0.08} />
          <circle cx={540} cy={800} r={160} fill="url(#insn-oro)" stroke="#8A5A10" strokeWidth={8} /><circle cx={540} cy={800} r={130} fill="none" stroke="#8A5A10" strokeWidth={4} strokeOpacity={0.6} />
          <text x={540} y={770} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={34} fill="#5A3A08">NOBEL</text>
          <text x={540} y={846} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={84} fill="#5A3A08">{INS.nobel}</text>
          <text x={540} y={890} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={24} fill="#5A3A08" letterSpacing="0.1em">MEDICINA</text>
        </g>
        {/* flechas: comparten la mitad */}
        <g opacity={kCo}>
          <path d="M 270 1090 L 270 1160" stroke={IN.verde} strokeWidth={8} strokeLinecap="round" /><path d="M 248 1140 L 270 1166 L 292 1140" stroke={IN.verde} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 810 1090 L 810 1160" stroke={IN.verde} strokeWidth={8} strokeLinecap="round" /><path d="M 788 1140 L 810 1166 L 832 1140" stroke={IN.verde} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <LineaI pos={3} y={1440} />
      </svg>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Tarjeta x={270} y={1040} nombre="BANTING" rol="Nobel" nobel k={kNo} />
        <Tarjeta x={810} y={1040} nombre="MACLEOD" rol="Nobel" nobel k={kNo} />
        <Tarjeta x={270} y={1220} nombre="BEST" rol="estudiante" k={kCo} />
        <Tarjeta x={810} y={1220} nombre="COLLIP" rol="bioquímico" k={kCo} />
      </svg>
      <Chip x={300} y={1096} texto="½" color={IN.verde} px={44} id="ins-nobel-m1" opacidad={kCo} />
      <Chip x={840} y={1096} texto="½" color={IN.verde} px={44} id="ins-nobel-m2" opacidad={kCo} />
      <Frases frases={[{ t: 0.2, texto: "1923: NOBEL", px: 112 }, { t: N.nombres - 0.1, texto: "BANTING Y\nMACLEOD", px: 104, color: IN.oro }, { t: N.comparten - 0.1, texto: "COMPARTEN\nEL DINERO", px: 100, color: IN.verde }]} y={450} x={104} id="titular-ins-nobel" />
      <Fuente texto="Nobel de Fisiología o Medicina 1923 a Banting y Macleod; Banting compartió su parte con Best y Macleod la suya con Collip. Dibujo esquemático." y={1520} delay={N.comparten} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── ins-patente ───────────── */

export const InsPatente: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const Pa = TIN.patente;
  const kDoc = spr(f, a(Pa.doc), { damping: 13, stiffness: 130, mass: 0.9 });
  const kDol = spr(f, a(Pa.dolar), { damping: 8, stiffness: 220, mass: 0.9 });
  const kFa = (t - a(Pa.fabrica));
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><radialGradient id="insp-oro" cx="38%" cy="32%" r="80%"><stop offset="0" stopColor="#FFF3B8" /><stop offset="0.5" stopColor="#FFD166" /><stop offset="1" stopColor="#B07A1E" /></radialGradient></defs>
        <Ambiente t={t} y={880} intensidad={0.7} />
        <g opacity={clamp(kDoc * 2)} transform={`translate(300 880) rotate(-4) scale(${0.85 + 0.15 * clamp(kDoc)}) translate(-300 -880)`}>
          <rect x={110} y={640} width={380} height={480} rx={8} fill={IN.papel} stroke="#B7A67C" strokeWidth={4} />
          <text x={300} y={706} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={34} fill="#2A2418">CESIÓN DE</text><text x={300} y={748} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={34} fill="#2A2418">PATENTE</text>
          {Array.from({ length: 7 }, (_, i) => <rect key={i} x={150} y={786 + i * 34} width={i % 3 === 2 ? 190 : 300} height={9} rx={4} fill="#8A7C5A" opacity={0.5} />)}
          <path d="M 160 1060 C 190 1030 210 1080 240 1050 S 290 1060 330 1048" stroke="#1A3A8A" strokeWidth={4} fill="none" strokeLinecap="round" />
          <text x={300} y={1100} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={18} fill="#5A4E36">Universidad de Toronto</text>
        </g>
        <g opacity={clamp(kDol * 2)} transform={`translate(780 860) scale(${0.5 + 0.5 * clamp(kDol)})`}>
          <circle r={190} fill={IN.oro} opacity={0.18} /><circle r={140} fill="url(#insp-oro)" stroke="#8A5A10" strokeWidth={8} /><circle r={112} fill="none" stroke="#8A5A10" strokeWidth={4} strokeOpacity={0.6} />
          <text x={0} y={34} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={110} fill="#5A3A08">$1</text>
        </g>
        {/* fábrica de frascos */}
        {Array.from({ length: 6 }, (_, i) => { const k = clamp((kFa - i * 0.28) / 0.4); return k > 0 ? <g key={i} opacity={k}><Frasco x={150 + i * 156} y={1260 - (1 - k) * 40} s={0.55} nivel={0.7} brillo={0.4} /></g> : null; })}
        <LineaI pos={3.4} y={1440} />
      </svg>
      <Chip x={540} y={1300} texto="sin trabas para fabricarla" color={IN.verde} px={26} anchor="center" id="ins-pat-fab" opacidad={clamp(kFa / 0.6)} />
      <Frases frases={[{ t: 0.2, texto: "LA PATENTE,\nA LA UNIVERSIDAD", px: 76 }, { t: Pa.dolar - 0.1, texto: "POR UN\nDÓLAR", px: 112, color: IN.oro }, { t: Pa.fabrica - 0.1, texto: "PARA FABRICAR\nSIN TRABAS", px: 88, color: IN.verde }]} y={450} x={104} id="titular-ins-patente" />
      <Fuente texto="Los descubridores cedieron los derechos a la Universidad de Toronto por 1 dólar (las fuentes difieren: 1 $ en total o 1 $ cada uno). La frase «pertenece al mundo» no está comprobada. Esquema." y={1510} delay={Pa.dolar} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── ins-hoy ───────────── */

export const InsHoy: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const Hy = TIN.hoy;
  const kD = spr(f, a(Hy.dia), { damping: 12, stiffness: 140, mass: 0.9 });
  const kC = spr(f, a(Hy.circulo), { damping: 10, stiffness: 180, mass: 0.8 });
  const puntos = React.useMemo(() => Array.from({ length: 150 }, (_, i) => { const lat = (azar(i * 3.7) - 0.5) * 2.6, lon = (azar(i * 5.9) - 0.5) * 3.1; return { x: Math.sin(lon) * Math.cos(lat), y: Math.sin(lat), z: Math.cos(lon) * Math.cos(lat), ini: azar(i * 8.1) * 2.2 }; }), []);
  const rot = t * 0.25;
  const R = 280;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><radialGradient id="insh-g" cx="40%" cy="35%" r="75%"><stop offset="0" stopColor="#1B3A6A" /><stop offset="1" stopColor="#08142A" /></radialGradient></defs>
        <Ambiente t={t} y={860} intensidad={0.9} />
        <g opacity={1 - 0.45 * kD}>
          <circle cx={540} cy={860} r={R} fill="url(#insh-g)" stroke={IN.azul} strokeOpacity={0.6} strokeWidth={5} />
          {[-0.6, 0, 0.6].map((la, i) => <ellipse key={i} cx={540} cy={860 - Math.sin(la) * R} rx={Math.cos(la) * R} ry={Math.cos(la) * R * 0.18} fill="none" stroke={IN.hielo} strokeOpacity={0.12} strokeWidth={2} />)}
          {puntos.map((p, i) => {
            const c = Math.cos(rot), s2 = Math.sin(rot), xr = p.x * c + p.z * s2, zr = -p.x * s2 + p.z * c;
            const k = clamp((t - a(Hy.mundo) - p.ini * 0.5) / 0.5);
            return zr > 0 && k > 0 ? <circle key={i} cx={540 + xr * R * 0.94} cy={860 - p.y * R * 0.94} r={7 * k} fill={IN.ambar} opacity={0.9 * k} /> : null;
          })}
        </g>
        <g opacity={clamp(kD * 2)} transform={`translate(0 ${(1 - clamp(kD)) * 30})`}><Calendario x={398} y={1060} s={0.62} dia="14" mes="NOVIEMBRE" /></g>
        <g opacity={clamp(kC * 2)}><CirculoAzul x={800} y={1180} r={58} t={t} /></g>
        <LineaI pos={4} y={1440} />
      </svg>
      <Chip x={540} y={1340} texto="Día Mundial de la Diabetes" color={IN.claro} px={28} anchor="center" id="ins-hoy-dia" opacidad={clamp(kC * 2)} />
      <Frases frases={[{ t: 0.2, texto: "HOY, MILLONES\nUSAN INSULINA", px: 84, color: IN.ambar }, { t: Hy.dia - 0.1, texto: "CADA 14 DE\nNOVIEMBRE", px: 100, color: IN.oro }, { t: Hy.circulo - 0.1, texto: "SE RECUERDA", px: 108, color: IN.claro }]} y={450} x={104} id="titular-ins-hoy" />
      <Fuente texto="Globo esquemático: los puntos no son datos reales. El círculo azul es el símbolo del Día Mundial de la Diabetes." y={1510} delay={Hy.dia} />
      <Cap e={e} />
    </Fondo>
  );
};
