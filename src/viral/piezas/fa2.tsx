/**
 * «El par craneal VII: el nervio de los gestos» (SINAPSIS · pares craneales) · escenas 2/2
 *   fa-bell      en la parálisis de Bell el nervio se inflama dentro de su túnel estrecho y la mitad de la cara deja de recibir órdenes
 *   fa-frente    la pista: la frente. Dos órdenes llegan a la frente: en el ictus suele salvarse; en Bell, no
 *   fa-cocodrilo curiosidad: tras recuperarse, algunas personas lloran al comer («lágrimas de cocodrilo»): cables mal reconectados
 *   fa-urgencia  si la cara se cae de golpe: emergencias. Y ahora tú: ¿puedes levantar solo una ceja?
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { FA, TFA } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Ambiente, CaraGesto, Cerebro, Chip, FAC, FONT, Gota, MONOF } from "./fa-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── fa-bell ───────────── */

export const FaBell: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const B = TFA.bell;
  const kBe = clamp((t - a(B.bell)) / 0.5), kIn = easeOut((t - a(B.inflama)) / a(1.8)), kMe = easeOut((t - a(B.media)) / a(1.4));
  const latido = 1 + 0.03 * Math.sin(t * 7) * kIn;
  const grosorN = lerp(16, 5, kIn);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={kIn > 0.4 ? FAC.rojo : FAC.facial} intensidad={0.55 + 0.4 * kIn} />
        {/* túnel (corte) */}
        <g opacity={kBe}>
          <rect x={140} y={760} width={800} height={190} rx={30} fill="#3A4258" stroke="#8B97B8" strokeWidth={5} />
          <rect x={160} y={800} width={760} height={110} rx={26} fill="#0B1220" />
          <line x1={150} y1={855} x2={930} y2={855} stroke={FAC.facial} strokeWidth={grosorN} strokeLinecap="round" />
          {kIn > 0 && <g transform={`translate(540 855) scale(${latido})`}><ellipse rx={150 * kIn + 10} ry={46 * kIn + 2} fill={FAC.rojo} opacity={0.82} /></g>}
          {kIn > 0.5 && <line x1={150} y1={855} x2={930} y2={855} stroke={FAC.facial} strokeWidth={grosorN} strokeLinecap="round" opacity={0.0} />}
        </g>
        {/* chispas viajando por el nervio hasta que se corta */}
        {[0, 1, 2].map((i) => { const k = ((t * 0.6 + i / 3) % 1); const bloqueado = k > 0.42 && kIn > 0.7; return <circle key={i} cx={170 + 760 * k} cy={855} r={bloqueado ? 0 : 7} fill="#fff" opacity={kBe * (1 - 0.6 * kIn)} />; })}
        <path d="M 930 870 L 930 960 L 880 1000" stroke={FAC.facial} strokeWidth={Math.max(4, grosorN * 0.6)} fill="none" strokeLinecap="round" opacity={kBe * (1 - 0.7 * kMe)} />
        <CaraGesto x={540} y={1190} s={0.6} lado={-1} caida={kMe} frenteCae={1} />
      </svg>
      <Chip x={160} y={706} texto={"TÚNEL ESTRECHO"} color={FAC.hueso} px={22} id="fa-b-tu" opacidad={kBe} />
      <Chip x={976} y={706} texto={"NERVIO FACIAL"} color={FAC.facial} px={22} anchor="right" id="fa-b-ne" opacidad={kBe} />
      <Chip x={540} y={968} texto={"se INFLAMA y se aprieta"} color={FAC.rojo} px={24} anchor="center" id="fa-b-in" opacidad={clamp(kIn * 2)} />
      <Chip x={976} y={1360} texto={"UN LADO SIN ÓRDENES"} color={FAC.oro} px={24} anchor="right" id="fa-b-lado" opacidad={kMe} />
      <Frases frases={[{ t: 0.2, texto: "PARÁLISIS DE BELL", px: 92, color: FAC.facial }, { t: B.inflama - 0.1, texto: "EL NERVIO SE\nINFLAMA", px: 92, color: FAC.rojo }, { t: B.media - 0.1, texto: "MEDIA CARA\nSIN ÓRDENES", px: 92, color: FAC.oro }]} y={450} x={104} id="titular-fa-bell" />
      <Fuente texto="Se cree que en la parálisis de Bell el nervio facial se inflama y se comprime dentro del conducto estrecho del hueso; la causa exacta no está del todo aclarada. Esquema, no es consejo médico." y={1510} delay={B.inflama} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── fa-frente ───────────── */

export const FaFrente: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const R = TFA.frente;
  const kPi = clamp((t - a(R.pista)) / 0.5), kDos = easeOut((t - a(R.dos)) / a(1.4)), kIc = spr(f, a(R.ictus), { damping: 12, stiffness: 160, mass: 0.9 }), kBe = spr(f, a(R.bell), { damping: 12, stiffness: 160, mass: 0.9 });
  const arrugas = 0.5 + 0.5 * Math.sin(t * 2.4);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1010} color={FAC.oro} intensidad={0.45 + 0.3 * kPi} />
        <Cerebro x={540} y={800} s={0.62} brillo={0.4 + 0.3 * kDos} t={t} />
        {/* dos órdenes hacia la frente (cada lado: una del lado izquierdo y otra del derecho del cerebro) */}
        {[[-1, FAC.oro], [1, FAC.facial]].map(([sd, c], i) => (
          <path key={i} d={`M ${540 + (sd as number) * 60} 890 C ${540 + (sd as number) * 200} 960 ${540 + (sd as number) * 220} 1010 ${540 + (sd as number) * 230} 1060`} pathLength={1} stroke={c as string} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray={`${kDos} 2`} opacity={0.9} />
        ))}
        <g opacity={clamp(kIc * 2)}><CaraGesto x={290} y={1185} s={0.5} lado={1} caida={kIc} frenteCae={0} cejaI={0.7} frente={arrugas} /></g>
        <g opacity={clamp(kBe * 2)}><CaraGesto x={790} y={1185} s={0.5} lado={1} caida={kBe} frenteCae={1} cejaI={0.7} frente={arrugas} /></g>
        {kPi > 0 && kIc < 0.05 && <g opacity={kPi}><rect x={430} y={1000} width={220} height={80} rx={30} fill="none" stroke={FAC.oro} strokeWidth={6} strokeDasharray="12 9" /></g>}
      </svg>
      <Chip x={290} y={1384} texto={"ICTUS"} color={FAC.rojo} px={28} anchor="center" id="fa-f-ic" opacidad={kIc} />
      <Chip x={790} y={1384} texto={"BELL"} color={FAC.facial} px={28} anchor="center" id="fa-f-be" opacidad={kBe} />
      <Chip x={290} y={1420} texto={"la frente suele\nsalvarse"} color={FAC.verde} px={18} anchor="center" id="fa-f-ic2" opacidad={kIc} />
      <Chip x={790} y={1420} texto={"la frente\nse cae también"} color={FAC.rojo} px={18} anchor="center" id="fa-f-be2" opacidad={kBe} />
      <Chip x={976} y={706} texto={"DOS ÓRDENES A\nLA FRENTE"} color={FAC.oro} px={22} anchor="right" id="fa-f-dos" opacidad={clamp(kDos * 2)} />
      <Frases frases={[{ t: 0.2, texto: "LA PISTA:\nLA FRENTE", px: 100, color: FAC.oro }, { t: R.dos - 0.1, texto: "LA FRENTE RECIBE\nDOS ÓRDENES", px: 78 }, { t: R.ictus - 0.1, texto: "ICTUS: LA\nFRENTE SUELE\nSALVARSE", px: 80, color: FAC.rojo }, { t: R.bell - 0.1, texto: "BELL: TAMBIÉN\nSE CAE", px: 90, color: FAC.facial }]} y={450} x={104} id="titular-fa-frente" />
      <Fuente texto={`Pista clínica general (${FA.ictusRespetaFrente} ocurre así): en una lesión central la frente se conserva por recibir órdenes de ambos lados del cerebro; en la periférica (Bell) se afecta también. Hay excepciones: solo un médico lo valora. Esquema.`} y={1510} delay={R.dos} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── fa-cocodrilo ───────────── */

export const FaCocodrilo: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const C = TFA.cocodrilo;
  const kCu = clamp((t - a(C.curioso)) / 0.5), kRe = clamp((t - a(C.recuperarse)) / 0.5), kCo = easeOut((t - a(C.comer)) / 0.6), kCr = clamp((t - a(C.cocodrilo)) / 0.5), kCa = easeOut((t - a(C.cables)) / a(1.6));
  const masticar = kCo * (0.5 + 0.5 * Math.sin(t * 8));
  const gotas = (i: number): number => ((t * 0.8 + i / 3) % 1);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1010} color={kCa > 0.3 ? FAC.oro : FAC.azul} intensidad={0.6} />
        <g opacity={kRe}>
          <CaraGesto x={350} y={930} s={0.6} sonrisa={0.4 + 0.5 * masticar} />
          {/* comida */}
          <g transform={`translate(350 ${1150 - 80 * kCo})`} opacity={kCo}><circle r={42} fill="#E8A33D" stroke="#8A5A12" strokeWidth={5} /><circle cx={-12} cy={-10} r={5} fill="#8A5A12" /><circle cx={14} cy={8} r={5} fill="#8A5A12" /></g>
          {/* lágrimas */}
          {kCr > 0 && [0, 1, 2].map((i) => <Gota key={i} x={298 + (i % 2) * 16} y={880 + 80 * gotas(i)} s={0.55} opacidad={kCr * (1 - gotas(i))} />)}
        </g>
        {/* cables mal reconectados */}
        <g opacity={clamp(kCa * 2)}>
          <rect x={620} y={820} width={150} height={74} rx={18} fill="rgba(11,18,40,0.9)" stroke={FAC.verde} strokeWidth={5} />
          <rect x={620} y={1010} width={150} height={74} rx={18} fill="rgba(11,18,40,0.9)" stroke={FAC.azul} strokeWidth={5} />
          <circle cx={950} cy={952} r={34} fill="rgba(11,18,40,0.9)" stroke={FAC.facial} strokeWidth={5} />
          <path d="M 916 952 L 860 952 C 800 952 820 857 770 857" pathLength={1} stroke={FAC.facial} strokeWidth={7} fill="none" strokeLinecap="round" strokeDasharray="12 10" opacity={0.45} />
          <path d="M 916 952 L 860 952 C 800 952 840 1047 770 1047" pathLength={1} stroke={FAC.oro} strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray={`${kCa} 2`} />
          <line x1={760} y1={862} x2={800} y2={900} stroke={FAC.rojo} strokeWidth={7} strokeLinecap="round" /><line x1={800} y1={862} x2={760} y2={900} stroke={FAC.rojo} strokeWidth={7} strokeLinecap="round" />
        </g>
      </svg>
      <Chip x={695} y={782} texto={"SALIVA"} color={FAC.verde} px={20} anchor="center" id="fa-c-sa" opacidad={clamp(kCa * 2)} />
      <Chip x={695} y={1096} texto={"LÁGRIMAS"} color={FAC.azul} px={20} anchor="center" id="fa-c-la" opacidad={clamp(kCa * 2)} />
      <Chip x={950} y={1000} texto={"ORDEN:\n«a comer»"} color={FAC.facial} px={18} anchor="center" id="fa-c-or" opacidad={clamp(kCa * 2)} />
      <Chip x={350} y={1220} texto={"LÁGRIMAS DE COCODRILO"} color={FAC.azul} px={24} anchor="center" id="fa-c-co" opacidad={kCr} />
      <Chip x={540} y={1300} texto={"cables mal reconectados"} color={FAC.oro} px={26} anchor="center" id="fa-c-ca" opacidad={kCa} />
      <Frases frases={[{ t: 0.2, texto: "UN DATO CURIOSO", px: 96, color: FAC.oro }, { t: C.recuperarse - 0.1, texto: "AL RECUPERARSE…", px: 94 }, { t: C.comer - 0.1, texto: "…LLORAN\nAL COMER", px: 100, color: FAC.azul }, { t: C.cables - 0.1, texto: "CABLES MAL\nRECONECTADOS", px: 88, color: FAC.oro }]} y={450} x={104} id="titular-fa-cocodrilo" />
      <Fuente texto={`Las «lágrimas de cocodrilo» (${FA.cocodrilo}) son poco frecuentes y se cree que ocurren cuando fibras que iban a las glándulas salivales se reconectan con las lágrimas. Esquema simplificado.`} y={1510} delay={C.comer} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── fa-urgencia ───────────── */

export const FaUrgencia: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const U = TFA.urgencia;
  const kCa = clamp((t - a(U.cae)) / 0.5), kEm = spr(f, a(U.emergencias), { damping: 10, stiffness: 190, mass: 0.8 }), kCo = spr(f, a(U.comentarios), { damping: 11, stiffness: 170, mass: 0.9 }), kCe = easeOut((t - a(U.ceja)) / 0.8);
  const pulso = 1 + 0.05 * Math.sin(t * 6) * kEm;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1010} color={kEm > 0.3 && kCo < 0.2 ? FAC.rojo : FAC.oro} intensidad={0.6} />
        {/* cruz de emergencias */}
        <g opacity={clamp(kEm * 2)} transform={`translate(220 960) scale(${kEm * pulso})`}>
          <circle r={130} fill="rgba(11,18,40,0.92)" stroke={FAC.rojo} strokeWidth={8} />
          <rect x={-22} y={-78} width={44} height={156} rx={8} fill={FAC.rojo} /><rect x={-78} y={-22} width={156} height={44} rx={8} fill={FAC.rojo} />
        </g>
        <g opacity={kCa}><CaraGesto x={700} y={1030} s={0.6} lado={-1} caida={kCa * (1 - kCo)} frenteCae={1} cejaD={kCe} /></g>
        {/* burbuja de comentarios */}
        <g opacity={clamp(kCo * 2)} transform={`translate(540 ${lerp(1300, 1280, easeOut(kCo))}) scale(${0.9 + 0.1 * kCo})`}>
          <rect x={-330} y={-60} width={660} height={120} rx={36} fill="rgba(11,18,40,0.94)" stroke={FAC.oro} strokeWidth={6} />
          <path d="M -60 60 L -30 100 L 0 60" fill="rgba(11,18,40,0.94)" stroke={FAC.oro} strokeWidth={6} strokeLinejoin="round" />
          <text y={12} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={44} fill="#E6EDFF" data-texto="fa-u-pre">¿Puedes subir solo una ceja?</text>
        </g>
      </svg>
      <Chip x={220} y={1118} texto={"LLAMA A\nEMERGENCIAS"} color={FAC.rojo} px={24} anchor="center" id="fa-u-em" opacidad={kEm} />
      <Frases frases={[{ t: 0.2, texto: "SI LA CARA SE\nCAE DE GOLPE…", px: 82, color: FAC.rojo }, { t: U.emergencias - 0.1, texto: "…LLAMA A\nEMERGENCIAS", px: 98, color: FAC.rojo }, { t: U.comentarios - 0.1, texto: "AHORA TÚ,\nEN COMENTARIOS", px: 88, color: FAC.oro }, { t: U.ceja - 0.1, texto: "¿SOLO UNA\nCEJA?", px: 110, color: FAC.facial }]} y={450} x={104} id="titular-fa-urgencia" />
      <Fuente texto="Una caída brusca de un lado de la cara, con o sin otros síntomas, requiere atención médica inmediata. Este video es divulgativo; no sustituye la consulta ni diagnostica. Esquema." y={1510} delay={U.emergencias} />
      <Cap e={e} />
    </Fondo>
  );
};
