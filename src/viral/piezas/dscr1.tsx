/**
 * «El truco de los préstamos DSCR» (IMNOBA · estudio azul marino y dorado, figuras tipo render)
 *   dscr-gancho    medio millón en efectivo para invertir en EE. UU.: cifra que sube y sello «MITO»
 *   dscr-hack      el alquiler (monedas) paga la cuota del préstamo: la propiedad se paga sola
 *   dscr-docs      lo que NO piden (recibo de sueldo, historial, visa) y la balanza alquiler ≥ cuota
 *   dscr-split     el banco financia hasta 70 %, tú pones ≈ 30 % (y lo que sí te piden)
 *   dscr-catalogo  imnoba.com/usa: proyectos y propiedades (teléfono con tarjetas genéricas, sin fotos ni precios inventados)
 */
import React from "react";
import { DSC, TDS } from "../../anim/piezas";
import { useUid } from "../../estudio/util";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, spr, useReloj } from "../comun";
import { Estudio, Frases, FONT, MONOF, Monedas, RE } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { Casa, MiniCasa } from "./par-kit";

type P = { e: EscenaViralGuardada };

const PANEL = "#0C1A2A";

/** Moneda dorada plana con relieve (para el flujo de alquiler). */
const Moneda: React.FC<{ x: number; y: number; r?: number; op?: number }> = ({ x, y, r = 22, op = 1 }) => (
  <g transform={`translate(${x} ${y})`} opacity={op}>
    <circle r={r * 1.7} fill={RE.oro} opacity={0.16} />
    <circle r={r} fill={RE.oro} stroke="#FFF1B0" strokeWidth={2.5} />
    <circle r={r * 0.68} fill="none" stroke="#B98A00" strokeWidth={2.4} />
    <text y={r * 0.34} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={r * 0.95} fill="#8A6400">$</text>
    <ellipse cx={-r * 0.35} cy={-r * 0.4} rx={r * 0.3} ry={r * 0.14} fill="#fff" opacity={0.55} transform={`rotate(-30 ${-r * 0.35} ${-r * 0.4})`} />
  </g>
);

/* ───────────── dscr-gancho ───────────── */

export const DscGancho: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const G = TDS.gancho;
  const casa = spr(f, a(G.casa), { damping: 13, stiffness: 120, mass: 0.8 });
  const k = easeOut((t - a(G.cifra)) / a(G.cifraDur));
  const n = Math.round(DSC.mito * k);
  const sello = spr(f, a(G.mito), { damping: 9, stiffness: 220, mass: 0.6 });
  const apaga = clamp((t - a(G.mito)) / a(0.4));
  return (
    <Estudio piso={1600} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(0 ${(1 - casa) * 90})`} opacity={clamp(casa * 1.6)}>
          <Monedas x={235} y={1290} n={Math.max(1, Math.round(10 * k))} s={0.9} />
          <Casa x={680} y={1290} s={1.3} tono={1} luz={0.85} />
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "invertir en\nEstados Unidos", px: 96 }, { t: 1.6, texto: "no exige\nmedio millón", color: RE.oro, px: 100 }, { t: 3.0, texto: "en efectivo", px: 100 }]} y={400} id="dscr-gancho-t" />
      <Dato valor={n} x={W / 2} y={860} px={132} digitos={6} prefijo="$" color={RE.oro} id="gancho-cifra" opacidad={clamp((t - a(G.cifra - 0.1)) / 0.3) * (1 - 0.55 * apaga)} />
      {sello > 0.02 && (
        <div data-texto="gancho-sello" style={{ position: "absolute", left: W / 2 - 250, top: 800, width: 500, textAlign: "center", transform: `rotate(-9deg) scale(${0.4 + 0.6 * clamp(sello)})`, opacity: clamp(sello * 1.4) }}>
          <span style={{ display: "inline-block", padding: "6px 40px", border: `10px solid ${RE.rojo}`, borderRadius: 18, background: "rgba(8,18,31,0.55)", color: RE.rojo, fontFamily: FONT, fontWeight: 900, fontSize: 132, letterSpacing: "0.04em" }}>MITO</span>
        </div>
      )}
    </Estudio>
  );
};

/* ───────────── dscr-hack ───────────── */

/** Punto de una curva cuadrática (flujo de monedas del alquiler hacia la cuota). */
const bez = (p0: [number, number], p1: [number, number], p2: [number, number], u: number): [number, number] => [
  (1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * p1[0] + u * u * p2[0],
  (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * p1[1] + u * u * p2[1],
];

export const DscHack: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const H1 = TDS.hack;
  const casa = spr(f, a(H1.casa), { damping: 13, stiffness: 120, mass: 0.8 });
  const flujo = clamp((t - a(H1.flujo)) / a(0.5));
  const llena = clamp((t - a(H1.flujo + 0.4)) / a(H1.cuota - H1.flujo - 0.2));
  const ok = spr(f, a(H1.cuota), { damping: 9, stiffness: 220, mass: 0.6 });
  const nombre = clamp((t - a(H1.nombre)) / a(0.4));
  const P0: [number, number] = [380, 1040], P1: [number, number] = [540, 760], P2: [number, number] = [640, 1090];
  return (
    <Estudio piso={1600} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(0 ${(1 - casa) * 90})`} opacity={clamp(casa * 1.6)}>
          <Casa x={285} y={1250} s={1.05} tono={0} luz={0.9} />
        </g>
        {/* tarjeta de la cuota */}
        <g transform="translate(655 960)" opacity={clamp(casa * 1.6)}>
          <rect width={330} height={250} rx={22} fill={PANEL} stroke={RE.hielo} strokeOpacity={0.7} strokeWidth={3} />
          <text x={165} y={50} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={22} fill={RE.hielo} letterSpacing="0.06em">CUOTA MENSUAL</text>
          <rect x={30} y={96} width={270} height={34} rx={17} fill="#16304A" />
          <rect x={30} y={96} width={Math.max(0.01, 270 * llena)} height={34} rx={17} fill={RE.oro} />
          <text x={165} y={176} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={RE.blanco}>cubierta con</text>
          <text x={165} y={216} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={RE.oro}>el alquiler</text>
          {ok > 0.02 && <g transform={`translate(300 22) scale(${clamp(ok)})`}><circle r={30} fill={RE.esmeralda} stroke="#fff" strokeWidth={4} /><path d="M -13 1 L -4 12 L 15 -10" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" /></g>}
        </g>
        {/* monedas del alquiler en movimiento continuo */}
        {flujo > 0 && Array.from({ length: 6 }, (_, i) => {
          const u = (t * 0.45 + i / 6) % 1;
          const [x, y] = bez(P0, P1, P2, u);
          return <Moneda key={i} x={x} y={y} r={20} op={flujo * Math.sin(Math.PI * clamp(u * 1.02)) ** 0.5} />;
        })}
      </svg>
      <Chip texto="alquiler" x={285} y={930} color={RE.oro} ancho={220} id="hack-alquiler" opacidad={clamp((t - a(H1.flujo - 0.3)) / 0.4)} />
      <Frases frases={[{ t: 0.2, texto: "un préstamo que\nmira la propiedad", px: 88 }, { t: 2.1, texto: "no tu sueldo", color: RE.oro, px: 104 }, { t: 3.5, texto: "la propiedad\nse paga sola", color: RE.hielo, px: 92 }]} y={380} id="dscr-hack-t" />
      <Chip texto="préstamo DSCR = se paga sola" x={W / 2} y={1440} color={RE.oro} ancho={660} id="hack-nombre" opacidad={nombre} />
    </Estudio>
  );
};

/* ───────────── dscr-docs ───────────── */

const DOCS = [
  { titulo: "Recibo de sueldo", glifo: "doc" },
  { titulo: "Historial crediticio en EE. UU.", glifo: "grafico" },
  { titulo: "Visa de residente", glifo: "pasaporte" },
] as const;

const Glifo: React.FC<{ tipo: (typeof DOCS)[number]["glifo"]; color: string }> = ({ tipo, color }) => (
  <g fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
    {tipo === "doc" && <><rect x={-22} y={-30} width={44} height={60} rx={6} /><line x1={-12} y1={-14} x2={12} y2={-14} /><line x1={-12} y1={0} x2={12} y2={0} /><line x1={-12} y1={14} x2={2} y2={14} /></>}
    {tipo === "grafico" && <><line x1={-26} y1={28} x2={26} y2={28} /><rect x={-20} y={4} width={10} height={24} rx={2} /><rect x={-5} y={-12} width={10} height={40} rx={2} /><rect x={10} y={-28} width={10} height={56} rx={2} /></>}
    {tipo === "pasaporte" && <><rect x={-24} y={-32} width={48} height={64} rx={7} /><circle cx={0} cy={-8} r={10} /><line x1={-12} y1={16} x2={12} y2={16} /></>}
  </g>
);

export const DscDocs: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const D = TDS.docs;
  const balanza = spr(f, a(D.balanza), { damping: 11, stiffness: 190, mass: 0.7 });
  return (
    <Estudio piso={1600} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {DOCS.map((d, i) => {
          const y = 600 + i * 190;
          const entra = spr(f, a(D.c(i) - 0.35), { damping: 13, stiffness: 150, mass: 0.7 });
          const tacha = clamp((t - a(D.c(i) + D.tacha)) / a(0.3));
          const bruto = easeOut(clamp((t - a(D.c(i) + D.tacha)) / a(0.3)));
          return (
            <g key={i} transform={`translate(${(1 - entra) * 120} 0)`} opacity={clamp(entra * 1.6) * (1 - 0.45 * tacha)}>
              <rect x={120} y={y} width={840} height={150} rx={26} fill={PANEL} stroke={tacha > 0 ? RE.rojo : RE.hielo} strokeOpacity={tacha > 0 ? 0.95 : 0.6} strokeWidth={3} />
              <g transform={`translate(205 ${y + 75})`}><Glifo tipo={d.glifo} color={RE.hielo} /></g>
              <text x={280} y={y + 90} fontFamily={FONT} fontWeight={800} fontSize={40} fill={RE.blanco}>{d.titulo}</text>
              <line x1={270} y1={y + 78} x2={270 + 650 * bruto} y2={y + 78} stroke={RE.rojo} strokeWidth={8} strokeLinecap="round" />
              {tacha > 0 && <g transform={`translate(910 ${y + 40}) scale(${0.5 + 0.5 * tacha})`}><circle r={0} /><g stroke={RE.rojo} strokeWidth={9} strokeLinecap="round"><line x1={-14} y1={-14} x2={14} y2={14} /><line x1={14} y1={-14} x2={-14} y2={14} /></g></g>}
            </g>
          );
        })}
        {/* balanza: alquiler ≥ cuota */}
        {balanza > 0.02 && (
          <g transform={`translate(540 1250) scale(${clamp(balanza)})`}>
            <rect x={-400} y={-64} width={800} height={128} rx={30} fill={PANEL} stroke={RE.esmeralda} strokeWidth={4} />
            <text x={-340} y={16} fontFamily={FONT} fontWeight={900} fontSize={46} fill={RE.oro}>alquiler</text>
            <text x={-100} y={18} fontFamily={FONT} fontWeight={900} fontSize={66} fill={RE.blanco}>≥</text>
            <text x={-40} y={16} fontFamily={FONT} fontWeight={900} fontSize={46} fill={RE.hielo}>cuota</text>
            <g transform="translate(300 0)"><circle r={36} fill={RE.esmeralda} stroke="#fff" strokeWidth={4} /><path d="M -16 1 L -5 14 L 18 -12" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" /></g>
          </g>
        )}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "si el alquiler\ncubre la cuota", px: 92 }, { t: 2.3, texto: "no piden\nesto", color: RE.rojo, px: 100 }, { t: 3.9, texto: "solo importa\nel alquiler", color: RE.oro, px: 90 }]} y={380} id="dscr-docs-t" />
      <Fuente texto="Igual piden pasaporte, prueba de fondos y reservas. Los requisitos cambian según el prestamista." y={1450} delay={4.0} />
    </Estudio>
  );
};

/* ───────────── dscr-split ───────────── */

export const DscSplit: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const S = TDS.split;
  const BX = 120, BW = 840, BY = 820, BH = 150;
  const uid = useUid();
  const k1 = easeOut((t - a(S.banco)) / a(1.0));
  const k2 = easeOut((t - a(S.tu)) / a(0.7));
  const casa = spr(f, a(S.barra), { damping: 13, stiffness: 130, mass: 0.8 });
  const w1 = BW * (DSC.banco / 100) * k1, w2 = BW * (DSC.inicial / 100) * k2;
  const nota = (i: number): number => clamp((t - a(S.notas + i * 0.3)) / a(0.35));
  const notas = ["pasaporte", "prueba de fondos", "reservas en efectivo"];
  return (
    <Estudio piso={1600} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7FB3E8" /><stop offset="1" stopColor="#2E5E96" /></linearGradient>
          <linearGradient id={`${uid}o`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE27A" /><stop offset="1" stopColor="#D49A00" /></linearGradient>
        </defs>
        <g opacity={clamp(casa * 1.6)} transform={`translate(0 ${(1 - casa) * 60})`}>
          <MiniCasa x={W / 2} y={720} s={1.6} color="#5A7DB8" />
        </g>
        <rect x={BX} y={BY} width={BW} height={BH} rx={30} fill="#10263B" stroke={RE.hielo} strokeOpacity={0.5} strokeWidth={3} />
        {w1 > 1 && <path d={`M ${BX + 30} ${BY} H ${BX + w1} V ${BY + BH} H ${BX + 30} A 30 30 0 0 1 ${BX} ${BY + BH - 30} V ${BY + 30} A 30 30 0 0 1 ${BX + 30} ${BY} Z`} fill={`url(#${uid}b)`} />}
        {w2 > 1 && <path d={`M ${BX + BW * 0.7} ${BY} H ${BX + BW - 30} A 30 30 0 0 1 ${BX + BW} ${BY + 30} V ${BY + BH - 30} A 30 30 0 0 1 ${BX + BW - 30} ${BY + BH} H ${BX + BW * 0.7} Z`} fill={`url(#${uid}o)`} opacity={k2} />}
        {w1 > 40 && <text x={BX + (BW * 0.7) / 2} y={BY + 98} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={84} fill="#fff" opacity={k1}>{Math.round(DSC.banco * k1)} %</text>}
        {w2 > 40 && <text x={BX + BW * 0.85} y={BY + 98} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={84} fill="#2A1C00" opacity={k2}>≈ {DSC.inicial} %</text>}
      </svg>
      <Chip texto="el banco" x={BX + (BW * 0.7) / 2} y={BY + BH + 50} color="#9EC7F2" ancho={260} id="split-banco" opacidad={k1} />
      <Chip texto="tu pago inicial" x={BX + BW * 0.85} y={BY + BH + 50} color={RE.oro} ancho={300} id="split-tu" opacidad={k2} />
      <Frases frases={[{ t: 0.2, texto: "financian hasta", px: 96 }, { t: 1.2, texto: "el 70 %", color: RE.hielo, px: 118 }, { t: 2.6, texto: "tú pones\ncerca del 30 %", color: RE.oro, px: 92 }]} y={400} id="dscr-split-t" />
      <div data-texto="split-lbl" style={{ position: "absolute", left: 120, top: 1150, fontFamily: MONOF, fontWeight: 700, fontSize: 28, color: RE.hielo, opacity: nota(0) }}>lo que sí te piden:</div>
      {notas.map((n, i) => (
        <div key={n} data-texto={`split-nota-${i}`} style={{ position: "absolute", left: 120, top: 1200 + i * 76, fontFamily: FONT, fontWeight: 800, fontSize: 44, color: RE.blanco, opacity: nota(i), transform: `translateX(${(1 - nota(i)) * 40}px)` }}>
          <span style={{ color: RE.oro, marginRight: 16 }}>✓</span>{n}
        </div>
      ))}
      <Fuente texto="Referencia: programas DSCR para extranjeros; el pago inicial suele ir de ≈ 25 % a 30 % según el prestamista." y={1470} delay={3.8} />
    </Estudio>
  );
};

/* ───────────── dscr-catalogo ───────────── */

export const DscCatalogo: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const C = TDS.catalogo;
  const uid = useUid();
  const tel = spr(f, a(C.tel), { damping: 13, stiffness: 120, mass: 0.8 });
  const url = clamp((t - a(C.url)) / a(0.4));
  const scroll = Math.max(0, t - a(C.tarjetas)) * 46;
  const X0 = 300, Y0 = 560, PW = 480, PH = 840;
  const tarjeta = (i: number): React.ReactNode => {
    return (
      <g key={i} transform={`translate(0 ${i * 190})`}>
        <rect x={X0 + 30} y={820} width={PW - 60} height={166} rx={18} fill="#16304A" stroke={RE.hielo} strokeOpacity={0.25} strokeWidth={2} />
        <rect x={X0 + 44} y={834} width={130} height={138} rx={12} fill="#244B6E" />
        <MiniCasa x={X0 + 109} y={934} s={0.95} color={i % 2 ? "#5A7DB8" : "#C9A24A"} />
        <rect x={X0 + 192} y={846} width={190} height={16} rx={8} fill="#6C87A5" opacity={0.8} />
        <rect x={X0 + 192} y={878} width={140} height={13} rx={6.5} fill="#6C87A5" opacity={0.5} />
        <rect x={X0 + 192} y={930} width={i % 2 ? 108 : 132} height={30} rx={15} fill={RE.oro} opacity={0.92} />
        <text x={X0 + 192 + (i % 2 ? 54 : 66)} y={952} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={20} fill="#2A1C00">{i % 2 ? "Propiedad" : "Proyecto"}</text>
      </g>
    );
  };
  const desfase = scroll % 380;
  return (
    <Estudio piso={1600} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><clipPath id={`${uid}c`}><rect x={X0 + 14} y={Y0 + 130} width={PW - 28} height={PH - 190} rx={14} /></clipPath></defs>
        <g transform={`translate(0 ${(1 - tel) * 120})`} opacity={clamp(tel * 1.6)}>
          <rect x={X0 - 6} y={Y0 - 6} width={PW + 12} height={PH + 12} rx={64} fill="#8FA3B8" opacity={0.35} />
          <rect x={X0} y={Y0} width={PW} height={PH} rx={58} fill="#0A1522" stroke={RE.hielo} strokeOpacity={0.7} strokeWidth={4} />
          <rect x={X0 + 14} y={Y0 + 14} width={PW - 28} height={PH - 28} rx={46} fill="#0F2036" />
          <rect x={X0 + 40} y={Y0 + 40} width={PW - 80} height={56} rx={28} fill="#1B3550" />
          <text x={X0 + PW / 2} y={Y0 + 78} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={28} fill={RE.oro}>imnoba.com/usa</text>
          <rect x={X0 + 40} y={Y0 + 120} width={(PW - 90) / 2} height={52} rx={26} fill={RE.oro} />
          <text x={X0 + 40 + (PW - 90) / 4} y={Y0 + 155} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={24} fill="#2A1C00">Proyectos</text>
          <rect x={X0 + 50 + (PW - 90) / 2} y={Y0 + 120} width={(PW - 90) / 2} height={52} rx={26} fill="#1B3550" />
          <text x={X0 + 50 + (PW - 90) * 0.75} y={Y0 + 155} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={24} fill={RE.hielo}>Propiedades</text>
          <g clipPath={`url(#${uid}c)`}>
            <g transform={`translate(0 ${-130 - desfase})`} opacity={clamp((t - a(C.tarjetas)) / 0.4)}>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => tarjeta(i))}
            </g>
          </g>
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "mira proyectos\ny propiedades", px: 92 }, { t: 2.2, texto: "imnoba.com/usa", color: RE.oro, px: 100 }]} y={380} id="dscr-catalogo-t" />
      <Chip texto="catálogo en imnoba.com/usa" x={W / 2} y={1460} color={RE.oro} ancho={700} id="catalogo-url" opacidad={url} />
    </Estudio>
  );
};
