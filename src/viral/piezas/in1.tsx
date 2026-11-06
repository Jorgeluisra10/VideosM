/**
 * «La inyección que cambió todo» (SINAPSIS · historia de la insulina) · escenas 1/2
 *   ins-gancho  calendario del 14 de noviembre: Banting cumpliría 135 años, su cumpleaños es el Día Mundial de la Diabetes y vendió su patente por un dólar
 *   ins-hambre  antes de 1922 la diabetes tipo 1 era mortal y el tratamiento era una dieta de hambre
 *   ins-perros  Toronto 1921: Banting y Best prueban un extracto de páncreas en perros y el azúcar en sangre baja
 *   ins-primera 11 ene 1922: un niño de 29 kg recibe la primera inyección; el extracto impuro apenas funciona
 * Dibujos esquemáticos; no son imágenes de la época.
 */
import React from "react";
import { INS, TIN, aniversarioAnios, librasAKg } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases, FONT, MONOF } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Persona } from "./an-kit";
import { Ambiente, Bascula, Calendario, Cama, CirculoAzul, Chip, Frasco, Grafico, IN, Jeringa, LineaI, Nino, Perro, SERIF } from "./in-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── ins-gancho ───────────── */

export const InsGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TIN.gancho;
  const kCa = spr(f, a(G.calendario), { damping: 13, stiffness: 120, mass: 0.9 });
  const kBa = spr(f, a(G.banting), { damping: 12, stiffness: 150, mass: 0.8 });
  const n = Math.round(aniversarioAnios(INS.hoyAnio, INS.banting.a) * easeOut((t - a(G.banting)) / a(G.aniosDur)));
  const kDia = spr(f, a(G.dia), { damping: 10, stiffness: 190, mass: 0.8 });
  const kDol = spr(f, a(G.dolar), { damping: 9, stiffness: 200, mass: 0.8 });
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={900} />
        <g opacity={clamp(kCa * 2)} transform={`translate(0 ${(1 - clamp(kCa)) * 40})`}><Calendario x={90} y={650} s={1.1} dia="14" mes="NOVIEMBRE" sub="SÁBADO" /></g>
        {/* retrato de Banting */}
        <g opacity={clamp(kBa * 2)} transform={`translate(0 ${(1 - clamp(kBa)) * 30})`}>
          <circle cx={800} cy={790} r={130} fill="#0B1424" stroke={IN.oro} strokeWidth={8} />
          <clipPath id="insg-k"><circle cx={800} cy={790} r={122} /></clipPath>
          <g clipPath="url(#insg-k)"><Persona x={800} y={760} s={0.8} tipo="pelo" abrigo="#2A3040" /></g>
        </g>
        {/* círculo azul y moneda de un dólar */}
        <g opacity={clamp(kDia * 2)} transform={`translate(0 ${(1 - clamp(kDia)) * 20})`}><CirculoAzul x={300} y={1290} r={56} t={t} /></g>
        <g opacity={clamp(kDol * 2)} transform={`translate(780 1290) scale(${0.5 + 0.5 * clamp(kDol)})`}>
          <circle r={86} fill={IN.oro} opacity={0.25} /><circle r={62} fill="#FFD166" stroke="#8A5A10" strokeWidth={6} /><circle r={48} fill="none" stroke="#8A5A10" strokeWidth={3} strokeOpacity={0.6} />
          <text x={0} y={20} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={56} fill="#5A3A08">$1</text>
        </g>
        <LineaI pos={4} y={1430} />
      </svg>
      <Chip x={620} y={930} texto={`${n} AÑOS`} color={IN.oro} px={46} id="ins-gancho-anios" opacidad={clamp(kBa * 2)} />
      <Chip x={620} y={984} texto={"Frederick Banting\nnació en 1891"} color={IN.hielo} px={22} id="ins-gancho-banting" opacidad={clamp(kBa * 2)} />
      <Chip x={300} y={1180} texto={"Día Mundial\nde la Diabetes"} color={IN.claro} px={22} anchor="center" id="ins-gancho-dia" opacidad={clamp(kDia * 2)} />
      <Chip x={780} y={1180} texto={"su patente\nse vendió por 1 $"} color={IN.oro} px={22} anchor="center" id="ins-gancho-dolar" opacidad={clamp(kDol * 2)} />
      <Frases frases={[{ t: 0.2, texto: "BANTING\nCUMPLIRÍA", px: 104 }, { t: G.banting - 0.1, texto: `${n} AÑOS`, px: 130, color: IN.oro }, { t: G.sabado - 0.1, texto: "ESTE SÁBADO", px: 108 }, { t: G.dia - 0.1, texto: "SU CUMPLEAÑOS:\nDÍA DE LA DIABETES", px: 76, color: IN.claro }, { t: G.dolar - 0.1, texto: "VENDIÓ SU\nPATENTE POR $1", px: 88, color: IN.oro }]} y={450} x={104} id="titular-ins-gancho" />
      <Fuente texto="El Día Mundial de la Diabetes (14 nov) se eligió por el cumpleaños de Frederick Banting (1891); lo crearon la FID y la OMS en 1991. Dibujo esquemático." y={1510} delay={G.dia} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── ins-hambre ───────────── */

export const InsHambre: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const Hh = TIN.hambre;
  const kS = spr(f, a(Hh.sala), { damping: 14, stiffness: 100, mass: 0.9 });
  const kMo = clamp((t - a(Hh.mortal)) / 0.6);
  const kD = spr(f, a(Hh.dieta), { damping: 11, stiffness: 160, mass: 0.8 });
  const camas: [number, number][] = [[290, 800], [790, 800], [290, 1040], [790, 1040]];
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={900} color="#3A4A78" intensidad={0.8} />
        {camas.map(([cx, cy], i) => (
          <g key={i} opacity={clamp(kS * 2 - i * 0.2)}>
            <Cama x={cx} y={cy} s={0.62} />
            <Nino x={cx - 70} y={cy - 70} s={0.62} estado={0} />
            {kMo > 0 && [0, 1, 2].map((k) => <text key={k} x={cx + 40 + k * 20} y={cy - 110 - ((t * 24 + k * 22 + i * 9) % 60)} fontFamily={FONT} fontWeight={900} fontSize={34 - k * 4} fill={IN.claro} opacity={kMo * 0.7}>z</text>)}
          </g>
        ))}
        {/* plato casi vacío */}
        <g opacity={clamp(kD * 2)} transform={`translate(540 1260) scale(${0.7 + 0.3 * clamp(kD)})`}>
          <ellipse cx={0} cy={0} rx={190} ry={44} fill="#E8EEF6" stroke="#9AAAC0" strokeWidth={5} /><ellipse cx={0} cy={-4} rx={140} ry={28} fill="#F8FBFF" stroke="#C0CCDA" strokeWidth={3} />
          <circle cx={-14} cy={-6} r={9} fill="#5CB85C" /><circle cx={12} cy={-4} r={9} fill="#5CB85C" /><circle cx={-2} cy={4} r={9} fill="#5CB85C" />
          <rect x={-260} y={-30} width={14} height={60} rx={5} fill="#B8C2CE" /><rect x={246} y={-30} width={14} height={60} rx={5} fill="#B8C2CE" />
        </g>
        <LineaI pos={0} y={1440} />
      </svg>
      <Chip x={104} y={606} texto="HOSPITAL · ANTES DE 1922" color={IN.hielo} px={26} id="ins-hambre-chip" opacidad={clamp(kS * 2)} />
      <Chip x={540} y={920} texto="coma diabético" color={IN.claro} px={28} anchor="center" id="ins-hambre-coma" opacidad={kMo} />
      <Chip x={540} y={1330} texto="«dieta de hambre» (≈ 1915–1922)" color={IN.oro} px={26} anchor="center" id="ins-hambre-dieta" opacidad={clamp(kD * 2)} />
      <Frases frases={[{ t: 0.2, texto: "ANTES DE\nLA INSULINA", px: 100 }, { t: Hh.mortal - 0.1, texto: "LA DIABETES\nTIPO 1 ERA MORTAL", px: 80, color: IN.rojo }, { t: Hh.dieta - 0.1, texto: "TRATAMIENTO:\nDIETA DE HAMBRE", px: 80, color: IN.oro }]} y={450} x={104} id="titular-ins-hambre" />
      <Fuente texto="La dieta de hambre de Frederick Allen (≈ 1915–1922) alargaba la vida de algunos pacientes, a costa de pasar hambre; en niños podía frenar el crecimiento. Dibujo esquemático." y={1520} delay={Hh.dieta} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── ins-perros ───────────── */

export const InsPerros: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const P = TIN.perros;
  const kTo = clamp((t - a(P.toronto)) / 0.5);
  const kDo = spr(f, a(P.doctores), { damping: 13, stiffness: 130, mass: 0.8 });
  const kEx = spr(f, a(P.extracto), { damping: 12, stiffness: 150, mass: 0.8 });
  const prog = clamp((t - a(P.extracto) + 0.3) / a(1.4));
  const baja = clamp((t - a(P.baja)) / a(1.2));
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={900} color="#2F8CFF" intensidad={0.8} />
        <g opacity={clamp(kDo * 2)} transform={`translate(0 ${(1 - clamp(kDo)) * 30})`}>
          <Persona x={200} y={810} s={0.95} tipo="barba" abrigo="#E8EEF4" /><Persona x={420} y={810} s={0.95} tipo="pelo" abrigo="#E8EEF4" />
        </g>
        {/* mesa de laboratorio */}
        <rect x={50} y={1010} width={980} height={34} rx={6} fill="#4A5A6A" stroke="#2A3440" strokeWidth={3} /><rect x={90} y={1044} width={900} height={140} fill="#16202C" />
        <g opacity={clamp(kEx * 2)}><Frasco x={640} y={1010} s={0.85} nivel={0.7} brillo={kEx * 0.7} turbio={0.8} etiqueta="PÁNCREAS" /></g>
        <g opacity={clamp(kTo * 2)}><Perro x={850} y={1010} s={0.62} t={t} /></g>
        {/* gráfico */}
        <g opacity={clamp(kEx * 2)}><Grafico x={570} y={690} w={420} h={170} prog={prog} baja={baja} t={t} /></g>
        <LineaI pos={1} y={1430} />
      </svg>
      <Chip x={104} y={606} texto="TORONTO · 1921" color={IN.oro} px={30} id="ins-perros-chip" opacidad={kTo} />
      <Chip x={200} y={1064} texto={"Banting\nmédico"} color={IN.hielo} px={20} anchor="left" id="ins-perros-b" opacidad={clamp(kDo * 2)} />
      <Chip x={420} y={1064} texto={"Best\nestudiante"} color={IN.hielo} px={20} anchor="left" id="ins-perros-s" opacidad={clamp(kDo * 2)} />
      <Frases frases={[{ t: 0.2, texto: "TORONTO,\n1921", px: 104 }, { t: P.doctores - 0.1, texto: "BANTING\nY BEST", px: 104, color: IN.claro }, { t: P.extracto - 0.1, texto: "EXTRACTO DE\nPÁNCREAS", px: 92, color: IN.ambar }, { t: P.baja - 0.1, texto: "EL AZÚCAR\nBAJA", px: 100, color: IN.verde }]} y={450} x={104} id="titular-ins-perros" />
      <Fuente texto="Frederick Banting y el estudiante Charles Best probaron en perros un extracto de páncreas en el laboratorio de John Macleod (Toronto, 1921). Gráfico esquemático." y={1520} delay={P.extracto} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── ins-primera ───────────── */

export const InsPrimera: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const Pr = TIN.primera;
  const kFe = clamp((t - a(Pr.fecha)) / 0.5);
  const kNi = spr(f, a(Pr.nino), { damping: 13, stiffness: 120, mass: 0.9 });
  const ent = easeOut((t - a(Pr.inyeccion)) / a(0.9));
  const emb = clamp((t - a(Pr.inyeccion) - 0.5) / 0.8);
  const kFa = spr(f, a(Pr.fallo), { damping: 9, stiffness: 200, mass: 0.8 });
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={920} color="#3A4A78" intensidad={0.9} />
        <Cama x={440} y={1040} s={1.1} />
        <Nino x={400} y={790} s={1.25} estado={0} />
        {/* ronchas de la reacción */}
        {kFa > 0 && Array.from({ length: 9 }, (_, i) => <circle key={i} cx={480 + (i % 3) * 22 + azarX(i)} cy={900 + Math.floor(i / 3) * 18} r={7} fill={IN.rojo} opacity={clamp(kFa) * 0.8} />)}
        {/* báscula */}
        <g opacity={clamp(kNi * 2)}><Bascula x={860} y={1250} s={0.62} kg={Math.round(librasAKg(INS.libras))} k={clamp((t - a(Pr.nino)) / 1.2)} /></g>
        {/* jeringa */}
        <g opacity={clamp(ent * 3)}><Jeringa x={lerp(1000, 640, ent)} y={lerp(930, 930, ent)} s={0.9} rot={-8} embolo={emb} /></g>
        <g opacity={clamp(kFa * 2)} transform={`translate(840 760) scale(${0.5 + 0.5 * clamp(kFa)})`}><circle r={56} fill="#5A1A1A" stroke={IN.rojo} strokeWidth={8} /><path d="M -22 -22 L 22 22 M 22 -22 L -22 22" stroke="#fff" strokeWidth={11} strokeLinecap="round" /></g>
        <LineaI pos={2} y={1430} />
      </svg>
      <Chip x={104} y={606} texto="11 ENE 1922 · HOSPITAL GENERAL DE TORONTO" color={IN.oro} px={24} id="ins-primera-chip" opacidad={kFe} />
      <Chip x={860} y={1330} texto="≈ 65 libras" color={IN.hielo} px={20} anchor="left" id="ins-primera-lb" opacidad={clamp(kNi * 2)} />
      <Chip x={540} y={1190} texto={"extracto impuro:\nreacción alérgica"} color={IN.rojo} px={24} anchor="center" id="ins-primera-fallo" opacidad={clamp(kFa * 2)} />
      <Frases frases={[{ t: 0.2, texto: "11 DE ENERO\nDE 1922", px: 92 }, { t: Pr.nino - 0.1, texto: "UN NIÑO DE\n29 KILOS", px: 100, color: IN.claro }, { t: Pr.inyeccion - 0.1, texto: "LA PRIMERA\nINYECCIÓN", px: 100, color: IN.ambar }, { t: Pr.fallo - 0.1, texto: "APENAS\nFUNCIONÓ", px: 108, color: IN.rojo }]} y={450} x={104} id="titular-ins-primera" />
      <Fuente texto="Leonard Thompson (≈ 65 lb ≈ 29 kg; 13 o 14 años según la fuente): la primera dosis, con un extracto aún impuro, tuvo poco efecto y causó una reacción alérgica. Dibujo esquemático." y={1500} delay={Pr.nino} />
      <Cap e={e} />
    </Fondo>
  );
};
const azarX = (i: number): number => ((i * 37) % 17) - 8;
