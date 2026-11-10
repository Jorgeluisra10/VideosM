/**
 * «El par craneal IV: el nervio que rompe las reglas» (SINAPSIS · pares craneales) · escenas 1/2
 *   tr-gancho     el troclear es el más pequeño y el único que sale por detrás del tronco encefálico
 *   tr-cruce      todas sus fibras se cruzan: el núcleo izquierdo mueve un músculo del ojo derecho
 *   tr-recorrido  da la vuelta alrededor del tronco encefálico, tiene el recorrido más largo y llega a la órbita
 *   tr-troclea    mueve un solo músculo, el oblicuo superior, cuyo tendón pasa por una polea: la tróclea
 * Dibujos esquemáticos de anatomía; no son imágenes médicas reales.
 */
import React from "react";
import { TRO, TTR } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Ambiente, Chip, Flecha, OCC, OjoP, PC, TRC, polyPt } from "./tr-kit";

type P = { e: EscenaViralGuardada };
const path = (pts: [number, number][]): string => pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");

/* ───────────── tr-gancho ───────────── */

export const TrGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TTR.gancho;
  const kTr = clamp((t - a(G.par)) / 0.6), kPe = clamp((t - a(G.pequeno)) / 0.8), kDe = spr(f, a(G.detras), { damping: 10, stiffness: 190, mass: 0.8 });
  const stubs = Array.from({ length: 9 }, (_, i) => 830 + i * 40);
  const barra = 640 * (TRO.axonesOrden.troclear / TRO.axonesOrden.optico);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={kDe > 0.3 ? TRC.troclear : TRC.tronco} intensidad={0.7 + 0.5 * kDe} />
        <g opacity={kTr}>
          <ellipse cx={720} cy={1120} rx={92} ry={118} fill="#1B2448" stroke="#4A5C92" strokeWidth={4} />
          <path d="M 430 800 C 400 900 420 1050 470 1180 L 560 1180 C 600 1060 640 950 620 840 C 590 780 470 760 430 800 Z" fill="#251C44" stroke={PC.cereb} strokeWidth={5} strokeLinejoin="round" />
          <circle cx={640} cy={855} r={34} fill="#3A2A5A" stroke={PC.cereb} strokeWidth={3} /><circle cx={652} cy={925} r={30} fill="#3A2A5A" stroke={PC.cereb} strokeWidth={3} />
          {stubs.map((y, i) => <g key={i}><line x1={470 - 0.12 * (y - 830)} y1={y} x2={470 - 0.12 * (y - 830) - 58} y2={y - 6} stroke="#8B97B8" strokeWidth={7} strokeLinecap="round" opacity={0.75} /></g>)}
          {kDe > 0 && <path d="M 668 975 C 700 968 724 978 742 998" pathLength={1} stroke={TRC.troclear} strokeWidth={13} fill="none" strokeLinecap="round" strokeDasharray={`${clamp(kDe * 1.4)} 2`} />}
          {kDe > 0 && <circle cx={668} cy={975} r={14 + 6 * Math.sin(t * 6)} fill="none" stroke={TRC.troclear} strokeWidth={4} opacity={kDe} />}
        </g>
        <g opacity={kPe}>
          <rect x={160} y={1240} width={640} height={22} rx={11} fill="#4FA3FF" opacity={0.75} /><rect x={160} y={1290} width={Math.max(5, barra)} height={22} rx={6} fill={TRC.troclear} /><circle cx={165} cy={1301} r={16} fill={TRC.troclear} opacity={0.25 + 0.2 * Math.sin(t * 6)} />
        </g>
      </svg>
      <Chip x={104} y={950} texto={"LOS DEMÁS\nSALEN POR\nDELANTE"} color="#8B97B8" px={20} id="tr-g-dem" opacidad={kTr} />
      <Chip x={976} y={880} texto={"SALE POR DETRÁS\n(cara dorsal)"} color={TRC.troclear} px={22} anchor="right" id="tr-g-det" opacidad={clamp(kDe * 2)} />
      <Chip x={820} y={1226} texto={"II: ≈ 1 000 000 fibras"} color="#4FA3FF" px={18} id="tr-g-ii" opacidad={kPe} />
      <Chip x={820} y={1292} texto={"IV: unos pocos miles"} color={TRC.troclear} px={18} id="tr-g-iv" opacidad={kPe} />
      <Frases frases={[{ t: 0.2, texto: "EL PAR\nCRANEAL IV", px: 100 }, { t: G.pequeno - 0.1, texto: "EL MÁS\nPEQUEÑO", px: 100, color: TRC.troclear }, { t: G.detras - 0.1, texto: "SALE POR\nDETRÁS", px: 100, color: TRC.troclear }]} y={450} x={104} id="titular-tr-gancho" />
      <Fuente texto="El troclear es el nervio craneal con menos axones (unos pocos miles) y el único que emerge de la cara dorsal del tronco encefálico, bajo el colículo inferior. Vista lateral esquemática; barras a escala." y={1510} delay={G.pequeno} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── tr-cruce ───────────── */

const FIB_I: [number, number][] = [[490, 830], [500, 900], [560, 942], [640, 962], [700, 1040], [750, 1160]];
const FIB_D: [number, number][] = [[590, 830], [580, 900], [520, 942], [440, 962], [380, 1040], [330, 1160]];
export const TrCruce: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TTR.cruce;
  const kNu = clamp((t - a(C.ademas)) / 0.5), kFi = easeOut((t - a(C.cruzan)) / a(1.8)), kIz = clamp((t - a(C.izquierdo)) / 0.4), kDe = spr(f, a(C.derecho), { damping: 10, stiffness: 180, mass: 0.8 });
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1020} color={TRC.troclear} intensidad={0.7} />
        <g opacity={kNu}>
          <rect x={420} y={740} width={240} height={230} rx={70} fill="#251C44" stroke={PC.cereb} strokeWidth={5} />
          <circle cx={490} cy={830} r={20} fill={TRC.izq} stroke="#fff" strokeWidth={3} /><circle cx={590} cy={830} r={20} fill={TRC.der} stroke="#fff" strokeWidth={3} />
        </g>
        {[FIB_I, FIB_D].map((p, i) => (
          <g key={i}>
            <path d={path(p)} pathLength={1} stroke={i === 0 ? TRC.izq : TRC.der} strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${kFi} 2`} />
            {kFi > 0.02 && kFi < 1 && (() => { const [px, py] = polyPt(p, kFi); return <circle cx={px} cy={py} r={9} fill="#fff" />; })()}
          </g>
        ))}
        {kFi > 0.45 && <circle cx={540} cy={942} r={16 + 3 * Math.sin(t * 6)} fill="none" stroke={TRC.polea} strokeWidth={4} opacity={clamp((kFi - 0.45) * 4)} />}
        <OjoP x={330} y={1230} r={68} pupila={0.5} t={t} brillo={kDe * 0.5} />
        <OjoP x={750} y={1230} r={68} pupila={0.5} t={t} brillo={kFi > 0.95 ? 0.6 : 0} />
        <rect x={290} y={1146} width={80} height={22} rx={11} fill={TRC.troclear} opacity={0.3 + 0.7 * kDe} /><rect x={710} y={1146} width={80} height={22} rx={11} fill={TRC.troclear} opacity={0.3 + 0.7 * (kFi > 0.95 ? 1 : 0)} />
      </svg>
      <Chip x={104} y={790} texto={"NÚCLEO\nIZQUIERDO"} color={TRC.izq} px={22} id="tr-c-ni" opacidad={kIz} />
      <Chip x={976} y={790} texto={"NÚCLEO\nDERECHO"} color={TRC.der} px={22} anchor="right" id="tr-c-nd" opacidad={kIz} />
      <Chip x={540} y={985} texto={"SE CRUZAN"} color={TRC.polea} px={22} anchor="center" id="tr-c-cr" opacidad={clamp((kFi - 0.4) * 3)} />
      <Chip x={750} y={1322} texto={"OJO DERECHO"} color={TRC.izq} px={20} anchor="center" id="tr-c-od" opacidad={kDe} />
      <Chip x={330} y={1322} texto={"OJO IZQUIERDO"} color={TRC.der} px={20} anchor="center" id="tr-c-oi" opacidad={clamp(kDe * 1.5)} />
      <Frases frases={[{ t: 0.2, texto: "ADEMÁS…", px: 110 }, { t: C.cruzan - 0.1, texto: "SUS FIBRAS SE\nCRUZAN AL\nOTRO LADO", px: 76, color: TRC.polea }, { t: C.izquierdo - 0.1, texto: "IZQUIERDO →\nOJO DERECHO", px: 90, color: TRC.izq }]} y={450} x={104} id="titular-tr-cruce" />
      <Fuente texto="Todas las fibras del troclear se cruzan (decusación) en el velo medular superior antes de salir: el núcleo de un lado inerva el oblicuo superior del ojo contrario. Vista dorsal esquemática." y={1510} delay={C.cruzan} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── tr-recorrido ───────────── */

const NERVIO: [number, number][] = [[140, 940], [150, 880], [220, 840], [320, 850], [400, 900], [450, 960], [520, 990], [600, 1000], [700, 1000], [790, 1000]];
export const TrRecorrido: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const R = TTR.recorrido;
  const kTr = clamp((t - a(R.vuelta)) / 0.5), kLa = clamp((t - a(R.largo)) / 0.5), kCr = clamp((t - a(R.craneo)) / 0.5), kOr = clamp((t - a(R.orbita)) / 0.5);
  const kRec = clamp((t - a(R.vuelta)) / a(R.orbita + 0.4));
  const [px, py] = polyPt(NERVIO, kRec);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={TRC.troclear} intensidad={0.6} />
        <g opacity={kTr}>
          <rect x={130} y={880} width={190} height={280} rx={56} fill="#251C44" stroke={PC.cereb} strokeWidth={5} />
          <circle cx={270} cy={965} r={58} fill="#3A2A5A" stroke={PC.cereb} strokeWidth={3} />
          <rect x={188} y={1130} width={92} height={150} rx={30} fill="#251C44" stroke={PC.cereb} strokeWidth={5} />
        </g>
        <g opacity={kCr}>
          <rect x={560} y={930} width={150} height={150} rx={40} fill={OCC.optico} opacity={0.2} stroke={OCC.optico} strokeWidth={5} /><circle cx={610} cy={1050} r={22} fill={OCC.rojo} opacity={0.9} />
        </g>
        <g opacity={kOr}><circle cx={850} cy={1000} r={70} fill="#E4EAF8" stroke="#5C6A90" strokeWidth={5} /><circle cx={880} cy={1000} r={28} fill="#4FA3FF" /><circle cx={886} cy={1000} r={12} fill="#0A0F1F" /></g>
        <path d={path(NERVIO)} pathLength={1} stroke={TRC.troclear} strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${kRec} 2`} />
        {kRec > 0 && kRec < 1 && <circle cx={px} cy={py} r={9} fill="#fff" />}
        {kLa > 0 && <g opacity={kLa}><path d="M 150 800 L 800 800" stroke={TRC.polea} strokeWidth={4} strokeDasharray="10 10" /><path d="M 150 786 L 150 814 M 800 786 L 800 814" stroke={TRC.polea} strokeWidth={5} strokeLinecap="round" /></g>}
      </svg>
      <Chip x={104} y={1020} texto={"SALE POR\nDETRÁS"} color={TRC.troclear} px={20} id="tr-r-det" opacidad={kTr} />
      <Chip x={430} y={760} texto={"EL RECORRIDO INTRACRANEAL MÁS LARGO"} color={TRC.polea} px={18} id="tr-r-lar" opacidad={kLa} />
      <Chip x={330} y={1190} texto={"RODEA EL\nTRONCO"} color={"#D9C6FF"} px={20} id="tr-r-rod" opacidad={kTr} />
      <Chip x={560} y={1110} texto={"SENO\nCAVERNOSO"} color={OCC.optico} px={20} id="tr-r-sen" opacidad={kCr} />
      <Chip x={800} y={1100} texto={"ÓRBITA"} color="#BFE0FF" px={22} id="tr-r-orb" opacidad={kOr} />
      <Frases frases={[{ t: 0.2, texto: "RODEA EL\nTRONCO", px: 100 }, { t: R.largo - 0.1, texto: "EL RECORRIDO\nMÁS LARGO", px: 90, color: TRC.polea }, { t: R.orbita - 0.1, texto: "HASTA\nLA ÓRBITA", px: 100, color: "#BFE0FF" }]} y={450} x={104} id="titular-tr-recorrido" />
      <Fuente texto="El troclear rodea el pedúnculo cerebral, cruza el seno cavernoso y entra en la órbita por la fisura orbitaria superior; es el de mayor recorrido intracraneal entre los pares craneales. Vista lateral esquemática." y={1510} delay={R.vuelta} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── tr-troclea ───────────── */

const BELLY: [number, number][] = [[890, 850], [400, 915]];
const TENDON: [number, number][] = [[400, 915], [340, 925], [330, 960], [400, 985], [520, 980], [640, 975]];
export const TrTroclea: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T2 = TTR.troclea;
  const kSo = clamp((t - a(T2.solo)) / 0.6), kOb = clamp((t - a(T2.oblicuo)) / 0.5), kPo = easeOut((t - a(T2.polea)) / a(1.4)), kNo = spr(f, a(T2.nombre), { damping: 10, stiffness: 180, mass: 0.8 });
  const u = (t * 0.5) % 1, [mx, my] = polyPt([...BELLY, ...TENDON.slice(1)], u);
  const baja = clamp((t - a(T2.polea) - 1.0) / 1.0) * 14;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={TRC.polea} intensidad={0.5 + 0.5 * kNo} />
        <g transform="translate(470 1000) scale(1.15) translate(-470 -1000)">
        <g opacity={kSo}>
          <circle cx={600} cy={1110} r={130} fill="#E4EAF8" stroke="#5C6A90" strokeWidth={5} />
          <circle cx={494} cy={1110 + baja} r={46} fill="#4FA3FF" stroke="#1B2A55" strokeWidth={3} /><circle cx={486} cy={1110 + baja} r={20} fill="#0A0F1F" />
          <rect x={264} y={880} width={70} height={30} rx={10} fill="#C8D2E8" stroke="#5C6A90" strokeWidth={3} />
        </g>
        <path d={path(BELLY)} stroke={TRC.troclear} strokeWidth={kOb > 0 ? 38 : 20} fill="none" strokeLinecap="round" opacity={0.4 + 0.6 * kOb} />
        {kPo > 0 && <path d={path(TENDON)} pathLength={1} stroke={TRC.troclear} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${kPo} 2`} />}
        <circle cx={330} cy={935} r={18} fill="none" stroke={TRC.polea} strokeWidth={8} opacity={clamp(kPo * 3)} />
        <line x1={330} y1={917} x2={300} y2={906} stroke={TRC.polea} strokeWidth={5} opacity={clamp(kPo * 3)} />
        {kPo > 0.3 && <circle cx={mx} cy={my} r={9} fill="#fff" opacity={0.9} />}
        </g>
      </svg>
      <Chip x={620} y={770} texto={"OBLICUO SUPERIOR"} color={TRC.troclear} px={22} id="tr-t-ob" opacidad={kOb} />
      <Chip x={104} y={810} texto={"TRÓCLEA\n= polea"} color={TRC.polea} px={24} id="tr-t-tr" opacidad={clamp(kNo * 2)} />
      <Chip x={330} y={1005} texto={"TENDÓN"} color={TRC.troclear} px={18} id="tr-t-te" opacidad={clamp(kPo * 2)} />
      <Chip x={540} y={1330} texto={"trochlea (latín) = polea → «troclear»"} color={TRC.polea} px={22} anchor="center" id="tr-t-lat" opacidad={clamp(kNo * 1.5)} />
      <Frases frases={[{ t: 0.2, texto: "MUEVE UN\nSOLO MÚSCULO", px: 84 }, { t: T2.oblicuo - 0.1, texto: "EL OBLICUO\nSUPERIOR", px: 96, color: TRC.troclear }, { t: T2.polea - 0.1, texto: "SU TENDÓN\nPASA POR UNA\nPOLEA", px: 78, color: TRC.polea }, { t: T2.nombre - 0.1, texto: "LA TRÓCLEA", px: 110, color: TRC.polea }]} y={450} x={104} id="titular-tr-troclea" />
      <Fuente texto={`El troclear inerva solo el ${TRO.musculo}: su tendón pasa por un anillo fibroso, la ${TRO.polea} (del latín «polea»), y se inserta en la parte superior del globo ocular. Vista lateral esquemática.`} y={1510} delay={T2.polea} />
      <Cap e={e} />
    </Fondo>
  );
};
