/**
 * «El par craneal V: el picante no es un sabor» (SINAPSIS · pares craneales) · escenas 2/2
 *   tg-ramas      el trigémino, el nervio craneal más grande, tiene tres ramas y mueve los músculos de la masticación
 *   tg-helado     se cree que explica el congelamiento cerebral: el frío en el paladar duele en la frente
 *   tg-neuralgia  en la neuralgia del trigémino, un roce o el viento pueden desencadenar descargas de dolor
 *   tg-comenta    dime en los comentarios: ¿aguantas el picante o te vence el congelamiento cerebral? (cierre)
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { TG, TTG } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Ambiente, Burbuja, Cara, Chile, Chip, Cono, Copo, FONT, MONOF, PC, Rayo, TGC, polyPt } from "./tg-kit";

type P = { e: EscenaViralGuardada };
const path = (pts: [number, number][]): string => pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");

/* ───────────── tg-ramas ───────────── */

export const TgRamas: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const R = TTG.ramas;
  const kNo = clamp((t - a(R.nombre)) / 0.5), kGr = clamp((t - a(R.grande)) / 0.5), k1 = clamp((t - a(R.ramas)) / 0.4), k2 = clamp((t - a(R.ramas) - 0.35) / 0.4), k3 = clamp((t - a(R.ramas) - 0.7) / 0.4), kMa = clamp((t - a(R.mastica)) / 0.5);
  const boca = kMa * (0.5 + 0.5 * Math.sin((t - a(R.mastica)) * 7));
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1040} color={TGC.nervio} intensidad={0.6} />
        <Cara x={540} y={1040} s={0.95} zonas={[k1, k2, k3]} boca={boca * 0.8} opacidad={clamp(kNo * 2)} />
        {kMa > 0 && [-1, 1].map((sd) => <ellipse key={sd} cx={540 + sd * 150} cy={1150} rx={34} ry={52 + 8 * boca} fill={TGC.v3} opacity={0.35 + 0.5 * boca} stroke="#fff" strokeOpacity={0.5} strokeWidth={3} />)}
      </svg>
      <Chip x={104} y={690} texto={"EL NERVIO CRANEAL\nMÁS GRANDE"} color={TGC.nervio} px={22} id="tg-r-gr" opacidad={kGr} />
      <Chip x={104} y={840} texto={"V1 · OFTÁLMICA\nfrente y ojos"} color={TGC.v1} px={20} id="tg-r-v1" opacidad={k1} />
      <Chip x={976} y={1000} texto={"V2 · MAXILAR\nmejillas y\nlabio superior"} color={TGC.v2} px={20} anchor="right" id="tg-r-v2" opacidad={k2} />
      <Chip x={104} y={1200} texto={"V3 · MANDIBULAR\nmandíbula"} color={TGC.v3} px={20} id="tg-r-v3" opacidad={k3} />
      <Chip x={540} y={1338} texto={"MOTOR: músculos de la masticación (solo V3)"} color={TGC.v3} px={18} anchor="center" id="tg-r-mo" opacidad={kMa} />
      <Frases frases={[{ t: 0.2, texto: "EL TRIGÉMINO", px: 100 }, { t: R.grande - 0.1, texto: "EL NERVIO CRANEAL\nMÁS GRANDE", px: 80, color: TGC.nervio }, { t: R.ramas - 0.1, texto: "TRES RAMAS", px: 110, color: TGC.v2 }, { t: R.mastica - 0.1, texto: "Y MUEVE LA\nMASTICACIÓN", px: 88, color: TGC.v3 }]} y={450} x={104} id="titular-tg-ramas" />
      <Fuente texto={`El trigémino (V) es el mayor de los nervios craneales: ${TG.ramas} ramas sensitivas (V1 oftálmica, V2 maxilar, V3 mandibular); solo V3 lleva fibras motoras a los músculos de la masticación. Esquema.`} y={1510} delay={R.ramas} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── tg-helado ───────────── */

const VIA: [number, number][] = [[540, 1160], [540, 1060], [540, 940], [540, 820]];
export const TgHelado: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const H2 = TTG.helado;
  const kCr = clamp((t - a(H2.cree)) / 0.5), kCg = clamp((t - a(H2.congelamiento)) / 0.5), kPa = easeOut((t - a(H2.paladar) + 1.0) / 1.0), kFr = spr(f, a(H2.frente), { damping: 9, stiffness: 190, mass: 0.8 }), kVia = clamp((t - a(H2.paladar) - 0.6) / a(1.4));
  const cx = lerp(880, 585, kPa), cy = lerp(1300, 1210, kPa);
  const [px, py] = polyPt(VIA, kVia);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1040} color={kFr > 0.3 ? TGC.dolor : TGC.frio} intensidad={0.6} />
        <Cara x={540} y={1050} s={0.9} zonas={[0, clamp(kPa), 0]} boca={clamp(kPa) * 0.9} opacidad={clamp(kCr * 2)} />
        {kPa > 0.8 && <circle cx={540} cy={1166} r={34 + 5 * Math.sin(t * 7)} fill={TGC.frio} opacity={0.5} />}
        <g opacity={clamp(kCr * 2)}><Cono x={cx} y={cy} s={0.8} /></g>
        {kPa > 0.6 && [[400, 1120, 0.4], [690, 1100, 0.35]].map(([x, y, s], i) => <Copo key={i} x={x as number} y={y as number} s={s as number} giro={t * 25 + i * 30} opacidad={clamp(kPa * 2 - 1)} />)}
        {kVia > 0 && <path d={path(VIA)} pathLength={1} stroke={TGC.frio} strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray={`${kVia} 2`} />}
        {kVia > 0 && kVia < 1 && <circle cx={px} cy={py} r={10} fill="#fff" />}
        {kFr > 0.05 && <g transform={`translate(540 780) scale(${kFr})`}><polygon points="0,-62 14,-22 54,-36 28,-2 62,22 20,22 16,62 -6,26 -44,50 -26,10 -64,-8 -22,-14" fill="#FF9E3D" stroke="#fff" strokeWidth={4} /></g>}
      </svg>
      <Chip x={104} y={690} texto={"CONGELAMIENTO\nCEREBRAL"} color={TGC.frio} px={24} id="tg-h-cg" opacidad={kCg} />
      <Chip x={104} y={1230} texto={"FRÍO EN\nEL PALADAR"} color={TGC.frio} px={20} id="tg-h-pal" opacidad={clamp(kPa * 2 - 0.8)} />
      <Chip x={976} y={780} texto={"¡DUELE EN\nLA FRENTE!"} color={TGC.dolor} px={22} anchor="right" id="tg-h-fr" opacidad={clamp(kFr * 2)} />
      <Chip x={540} y={1340} texto={"dolor referido: lo lleva el trigémino"} color={TGC.nervio} px={20} anchor="center" id="tg-h-ref" opacidad={clamp(kVia * 2)} />
      <Frases frases={[{ t: 0.2, texto: "SE CREE QUE\nEXPLICA…", px: 90 }, { t: H2.congelamiento - 0.1, texto: "EL CONGELAMIENTO\nCEREBRAL", px: 76, color: TGC.frio }, { t: H2.paladar - 0.1, texto: "FRÍO EN EL\nPALADAR…", px: 90, color: TGC.frio }, { t: H2.frente - 0.1, texto: "DOLOR EN\nLA FRENTE", px: 96, color: TGC.dolor }]} y={450} x={104} id="titular-tg-helado" />
      <Fuente texto="Se cree que el frío en el paladar provoca respuestas vasculares y nerviosas que el trigémino transmite y el cerebro sitúa en la frente (dolor referido); el mecanismo exacto no está cerrado. Esquema." y={1510} delay={H2.paladar} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── tg-neuralgia ───────────── */

export const TgNeuralgia: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const N = TTG.neuralgia;
  const kIr = clamp((t - a(N.irrita)) / 0.5), kNe = spr(f, a(N.neuralgia), { damping: 10, stiffness: 190, mass: 0.8 }), kRo = clamp((t - a(N.roce)) / 0.4), kVi = clamp((t - a(N.viento)) / 0.4), kDe = clamp((t - a(N.descargas)) / 0.4);
  const flash = (t0: number): number => { const d = t - a(t0); return d > 0 && d < 0.6 ? 1 - d / 0.6 : 0; };
  const fl = Math.max(flash(N.roce + 0.3), flash(N.viento + 0.3), kDe > 0 ? 0.6 + 0.4 * Math.sin(t * 14) : 0);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1040} color={TGC.dolor} intensidad={0.3 + 0.7 * Math.max(fl, kNe * 0.4)} />
        <Cara x={650} y={1040} s={0.85} zonas={[0, kNe * 0.6, kNe * 0.6]} boca={0} opacidad={clamp(kIr * 2)} />
        {/* roce */}
        <g opacity={kRo} transform={`translate(${lerp(240, 330, clamp(kRo))} 940)`}><rect x={-14} y={-10} width={28} height={110} rx={14} fill="#E4C9A8" transform="rotate(-25)" /><circle cx={0} cy={-6} r={0} /></g>
        {/* viento */}
        <g opacity={kVi} stroke="#BFE0FF" strokeWidth={7} strokeLinecap="round" fill="none"><path d="M 150 1120 C 220 1100 260 1140 330 1120" /><path d="M 170 1160 C 240 1140 280 1180 350 1160" /><path d="M 150 1200 C 220 1180 260 1220 330 1200" /></g>
        {fl > 0.05 && <Rayo x={720} y={1060} s={1.3 * (0.6 + 0.4 * fl)} opacidad={clamp(fl * 1.3)} />}
        {kNe > 0.1 && <path d="M 690 900 C 760 960 790 1060 740 1180" stroke={TGC.nervio} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray="12 10" opacity={kNe} />}
      </svg>
      <Chip x={104} y={690} texto={"NEURALGIA\nDEL TRIGÉMINO"} color={TGC.dolor} px={26} id="tg-ne-ne" opacidad={kNe} />
      <Chip x={104} y={870} texto={"UN ROCE"} color="#E4C9A8" px={22} id="tg-ne-ro" opacidad={kRo} />
      <Chip x={104} y={1250} texto={"EL VIENTO"} color="#BFE0FF" px={22} id="tg-ne-vi" opacidad={kVi} />
      <Chip x={976} y={1330} texto={"DESCARGAS DE DOLOR"} color={TGC.dolor} px={24} anchor="right" id="tg-ne-de" opacidad={kDe} />
      <Frases frases={[{ t: 0.2, texto: "A VECES EL NERVIO\nSE IRRITA", px: 78 }, { t: N.neuralgia - 0.1, texto: "NEURALGIA DEL\nTRIGÉMINO", px: 88, color: TGC.dolor }, { t: N.roce - 0.1, texto: "UN ROCE O EL\nVIENTO…", px: 88, color: "#BFE0FF" }, { t: N.descargas - 0.1, texto: "DESCARGAS\nDE DOLOR", px: 96, color: TGC.dolor }]} y={450} x={104} id="titular-tg-neuralgia" />
      <Fuente texto={`Neuralgia del trigémino: descargas de dolor facial (sobre todo en V2 y V3) que pueden desencadenar ${TG.neuralgiaDesencadenantes.join(", ")}; si tienes dolor facial intenso, consulta con un médico. Esquema; no es consejo médico.`} y={1510} delay={N.neuralgia} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── tg-comenta ───────────── */

export const TgComenta: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TTG.comenta;
  const kAh = clamp((t - a(C.ahora)) / 0.5), kPi = spr(f, a(C.picante), { damping: 9, stiffness: 190, mass: 0.8 }), kHe = spr(f, a(C.helado), { damping: 9, stiffness: 190, mass: 0.8 });
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1040} color={TGC.nervio} intensidad={0.6 + 0.4 * kAh} />
        <g transform={`translate(312 850) scale(${kPi})`} opacity={clamp(kPi * 2)}>
          <rect x={-208} y={-130} width={416} height={260} rx={30} fill="rgba(60,12,10,0.9)" stroke={TGC.picante} strokeWidth={8} />
          <Chile x={0} y={-20} s={0.85} t={t} brillo={0.6} />
        </g>
        <g transform={`translate(768 850) scale(${kHe})`} opacity={clamp(kHe * 2)}>
          <rect x={-208} y={-130} width={416} height={260} rx={30} fill="rgba(10,38,52,0.9)" stroke={TGC.frio} strokeWidth={8} />
          <Cono x={0} y={-70} s={0.95} />
        </g>
        {kHe > 0.1 && <g transform="translate(540 850)"><circle r={42} fill="#0B1220" stroke="#fff" strokeWidth={5} /><text y={13} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={36} fill="#fff">VS</text></g>}
        <Burbuja x={540} y={1130} s={1.0} t={t} opacidad={clamp(kAh * 2)} />
        {Array.from({ length: 10 }, (_, i) => <g key={i} opacity={clamp((kHe - 0.2) * 2 - i * 0.05)}><circle cx={150 + i * 86} cy={1345} r={26} fill="#0F1730" stroke={TGC.picante} strokeWidth={4} /><text x={150 + i * 86} y={1355} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={26} fill="#fff">{i + 1}</text></g>)}
      </svg>
      <Chip x={312} y={1000} texto={"PICANTE"} color={TGC.picante} px={28} anchor="center" id="tg-co-pi" opacidad={clamp(kPi * 2)} />
      <Chip x={768} y={1000} texto={"CONGELAMIENTO\nCEREBRAL"} color={TGC.frio} px={24} anchor="center" id="tg-co-he" opacidad={clamp(kHe * 2)} />
      <Chip x={540} y={1268} texto={"¿cuál te vence primero? ↓"} color={TGC.nervio} px={22} anchor="center" id="tg-co-qu" opacidad={clamp(kAh * 2)} />
      <Chip x={540} y={1392} texto={"y tu nivel de picante, del 1 al 10"} color="#BFE0FF" px={20} anchor="center" id="tg-co-ni" opacidad={clamp((kHe - 0.4) * 2)} />
      <Frases frases={[{ t: 0.2, texto: "AHORA DIME EN\nLOS COMENTARIOS", px: 84 }, { t: C.picante - 0.1, texto: "¿AGUANTAS\nEL PICANTE…", px: 90, color: TGC.picante }, { t: C.helado - 0.1, texto: "…O TE VENCE EL\nHELADO?", px: 90, color: TGC.frio }]} y={450} x={104} id="titular-tg-comenta" />
      <Fuente texto="Tu respuesta en los comentarios: picante o congelamiento cerebral, y tu nivel de picante del 1 al 10." y={1510} delay={C.ahora} />
      <Cap e={e} />
    </Fondo>
  );
};
