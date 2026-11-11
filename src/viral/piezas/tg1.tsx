/**
 * «El par craneal V: el picante no es un sabor» (SINAPSIS · pares craneales) · escenas 1/2
 *   tg-gancho      el picante no es un sabor: es dolor y calor que detecta el nervio trigémino
 *   tg-capsaicina  la capsaicina del chile activa el receptor de calor TRPV1 y el cerebro cree que te estás quemando
 *   tg-nobel       por descubrir ese receptor, David Julius compartió el Nobel de Medicina de 2021
 *   tg-mentol      el mentol activa el receptor del frío y sientes fresco sin bajar la temperatura
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { TG, TTG } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Cerebro } from "./me-kit";
import { Ambiente, Chile, Chip, Copo, FONT, Llama, MONOF, Molecula, PC, Rayo, TGC, mezclar, polyPt } from "./tg-kit";

type P = { e: EscenaViralGuardada };
const path = (pts: [number, number][]): string => pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");

/* ───────────── tg-gancho ───────────── */

export const TgGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TTG.gancho;
  const kPi = spr(f, a(G.picante), { damping: 10, stiffness: 170, mass: 0.9 }), kSa = clamp((t - a(G.sabor)) / 0.4), kDC = clamp((t - a(G.dolorCalor)) / 0.5), kTr = spr(f, a(G.trigemino), { damping: 10, stiffness: 180, mass: 0.8 });
  const sabores = ["DULCE", "SALADO", "ÁCIDO", "AMARGO", "UMAMI"];
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={TGC.picante} intensidad={0.6 + 0.8 * kPi} />
        {sabores.map((n, i) => {
          const k = easeOut((t - a(0.15) - i * 0.12) / 0.4);
          return <g key={n} opacity={clamp(k * 2)} transform={`translate(${170 + i * 185} 800) scale(${0.6 + 0.4 * k})`}><circle r={52} fill="#0F1730" stroke="#8B97B8" strokeWidth={5} /><text y={8} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={17} fill="#C8D2E8">{n}</text></g>;
        })}
        <Chile x={540} y={1110} s={1.45} brillo={kPi} t={t} opacidad={clamp(kPi * 1.5)} />
        {kSa > 0 && <g opacity={kSa}><path d="M 540 1000 L 540 880" stroke="#8B97B8" strokeWidth={6} strokeDasharray="10 10" /><circle cx={540} cy={930} r={36} fill="#3A0A14" stroke={TGC.dolor} strokeWidth={7} /><path d="M 524 914 L 556 946 M 556 914 L 524 946" stroke="#fff" strokeWidth={7} strokeLinecap="round" /></g>}
        {kDC > 0 && <><Llama x={250} y={1130} s={0.9} t={t} opacidad={kDC} /><Rayo x={830} y={1130} s={1.0} opacidad={kDC} /></>}
        {kTr > 0.05 && (
          <g opacity={clamp(kTr * 2)}>
            <path d="M 300 1230 C 380 1300 460 1300 500 1296" stroke={TGC.nervio} strokeWidth={8} fill="none" strokeLinecap="round" /><path d="M 780 1230 C 700 1300 620 1300 580 1296" stroke={TGC.nervio} strokeWidth={8} fill="none" strokeLinecap="round" />
            <g transform={`translate(540 1296) scale(${kTr})`}><circle r={52} fill="#2A2108" stroke={TGC.nervio} strokeWidth={8} /><text y={20} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={60} fill={TGC.nervio}>V</text></g>
          </g>
        )}
      </svg>
      <Chip x={104} y={690} texto={`LOS ${TG.saboresBasicos} SABORES BÁSICOS`} color="#BFE0FF" px={22} id="tg-g-sab" opacidad={clamp((t - a(0.3)) / 0.5)} />
      <Chip x={540} y={985} texto={"NO ESTÁ EN LA LISTA"} color={TGC.dolor} px={20} anchor="center" id="tg-g-no" opacidad={kSa} />
      <Chip x={250} y={1230} texto={"CALOR"} color={TGC.calor} px={22} anchor="center" id="tg-g-cal" opacidad={kDC} />
      <Chip x={830} y={1230} texto={"DOLOR"} color={TGC.dolor} px={22} anchor="center" id="tg-g-dol" opacidad={kDC} />
      <Chip x={540} y={1345} texto={"NERVIO TRIGÉMINO · PAR V"} color={TGC.nervio} px={26} anchor="center" id="tg-g-tri" opacidad={clamp(kTr * 1.5)} />
      <Frases frases={[{ t: 0.2, texto: "EL PICANTE", px: 110 }, { t: G.sabor - 0.1, texto: "NO ES\nUN SABOR", px: 110, color: TGC.dolor }, { t: G.dolorCalor - 0.1, texto: "ES DOLOR\nY CALOR", px: 100, color: TGC.calor }, { t: G.trigemino - 0.1, texto: "LO DETECTA EL\nPAR CRANEAL V", px: 80, color: TGC.nervio }]} y={450} x={104} id="titular-tg-gancho" />
      <Fuente texto="El picante no es uno de los cinco sabores básicos: es una sensación de calor y dolor (quimiestesia) que detectan sobre todo las terminaciones del nervio trigémino. Esquema." y={1510} delay={G.sabor} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── canal de membrana (compartido por capsaicina y mentol) ───────────── */

const Canal: React.FC<{ x: number; y: number; abierto: number; color: string; t: number; iones?: number }> = ({ x, y, abierto, color, t, iones = 0 }) => {
  const g = 12 + 34 * clamp(abierto);
  return (
    <g>
      {Array.from({ length: 22 }, (_, i) => { const px = 110 + i * 40; return Math.abs(px - x) > 60 ? <g key={i}><circle cx={px} cy={y - 18} r={15} fill="#3A4A7C" /><circle cx={px} cy={y + 18} r={15} fill="#3A4A7C" /></g> : null; })}
      <rect x={x - 26 - g / 2} y={y - 62} width={26} height={124} rx={12} fill={color} opacity={0.95} /><rect x={x + g / 2} y={y - 62} width={26} height={124} rx={12} fill={color} opacity={0.95} />
      {iones > 0 && Array.from({ length: 8 }, (_, i) => { const u = (t * 0.8 + i / 8) % 1; return <circle key={i} cx={x + Math.sin(i * 2.1) * (g / 2 - 4)} cy={lerp(y - 60, y + 90, u)} r={5} fill="#fff" opacity={iones * (1 - Math.abs(u - 0.5) * 1.2)} />; })}
    </g>
  );
};

/* ───────────── tg-capsaicina ───────────── */

const SENAL: [number, number][] = [[540, 1090], [560, 1190], [760, 1230], [870, 1130], [870, 930]];
export const TgCapsaicina: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TTG.capsaicina;
  const kCh = clamp((t - a(C.chile)) / 0.5), kAc = easeOut((t - a(C.activa)) / a(1.4)), kTr = clamp((t - a(C.trpv1)) / 0.5), kQu = clamp((t - a(C.quemando)) / a(2.0)), kFu = spr(f, a(C.fuego), { damping: 9, stiffness: 190, mass: 0.8 });
  const abierto = clamp((kAc - 0.7) * 3.3) * (kTr > 0 ? 1 : 0.0) + clamp(kAc - 0.7) * 0.4;
  const [sx, sy] = polyPt(SENAL, kQu);
  const mols: [number, number][] = [[250, 800], [300, 780], [210, 850]];
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={kQu > 0.3 ? TGC.calor : TGC.picante} intensidad={0.6 + 0.6 * kQu} />
        <Chile x={230} y={800} s={0.62} brillo={kCh} t={t} opacidad={kCh} />
        {mols.map(([mx, my], i) => { const u = clamp(kAc * 1.3 - i * 0.12), px = lerp(mx, 520 + i * 28, easeOut(u)), py = lerp(my, 960 - i * 14, easeOut(u)); return kAc > 0 ? <Molecula key={i} x={px} y={py} s={0.7} color={TGC.picante} giro={i * 40 + t * 30 * (1 - u)} /> : null; })}
        <Canal x={540} y={1010} abierto={abierto} color={TGC.verde} t={t} iones={clamp(abierto * 2)} />
        {kTr > 0 && <path d={path(SENAL)} pathLength={1} stroke={TGC.nervio} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${kQu} 2`} />}
        {kQu > 0 && kQu < 1 && <circle cx={sx} cy={sy} r={10} fill="#fff" />}
        <g opacity={clamp(kTr * 2)}><Cerebro x={870} y={820} s={0.7} brillo={0.4 + 0.6 * kQu} t={t} /></g>
        {kQu > 0.9 && <><Llama x={870} y={690} s={0.5} t={t} opacidad={clamp((kQu - 0.9) * 10)} tachada={kFu} /></>}
      </svg>
      <Chip x={104} y={900} texto={"CAPSAICINA\n(el compuesto del chile)"} color={TGC.picante} px={20} id="tg-c-cap" opacidad={kCh} />
      <Chip x={104} y={1090} texto={"TRPV1 · receptor de calor\n(terminación del trigémino)"} color={TGC.verde} px={22} id="tg-c-trp" opacidad={kTr} />
      <Chip x={540} y={1320} texto={"¡me quemo!  …pero no hay fuego"} color={TGC.calor} px={24} anchor="center" id="tg-c-fue" opacidad={clamp(kFu * 1.5)} />
      <Frases frases={[{ t: 0.2, texto: "LA CAPSAICINA\nDEL CHILE…", px: 88 }, { t: C.trpv1 - 0.1, texto: "ACTIVA EL\nRECEPTOR TRPV1", px: 86, color: TGC.verde }, { t: C.quemando - 0.1, texto: "TU CEREBRO CREE\nQUE TE QUEMAS", px: 78, color: TGC.calor }, { t: C.fuego - 0.1, texto: "PERO NO HAY\nFUEGO", px: 92, color: TGC.dolor }]} y={450} x={104} id="titular-tg-capsaicina" />
      <Fuente texto="La capsaicina abre el canal TRPV1, que normalmente responde al calor doloroso (≈ 43 °C), y las neuronas envían una señal de «quemadura» aunque no haya daño térmico. Esquema, no a escala." y={1510} delay={C.activa} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── tg-nobel ───────────── */

export const TgNobel: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const N = TTG.nobel;
  const kDe = clamp((t - a(N.descubrir)) / 0.5), kJu = clamp((t - a(N.julius)) / 0.4), kNo = spr(f, a(N.nobel), { damping: 9, stiffness: 180, mass: 0.9 }), kAn = clamp((t - a(N.anio)) / 0.4);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1000} color={TGC.nervio} intensidad={0.5 + 0.9 * kNo} />
        <g opacity={kDe}>
          <Chile x={260} y={790} s={0.5} t={t} /><path d="M 360 790 L 470 790" stroke="#fff" strokeWidth={6} strokeLinecap="round" /><path d="M 452 774 L 472 790 L 452 806" stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x={500} y={750} width={200} height={80} rx={40} fill="#0F2A1C" stroke={TGC.verde} strokeWidth={5} /><text x={600} y={803} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={42} fill={TGC.verde}>{TG.nobel.julius}</text>
        </g>
        <g transform={`translate(540 1030) scale(${kNo})`} opacity={clamp(kNo * 2)}>
          <path d="M -50 -170 L -20 -120 L 20 -120 L 50 -170 L 30 -170 L 0 -130 L -30 -170 Z" fill="#B5342B" />
          <circle r={140} fill="#E2B94A" stroke="#8A6A12" strokeWidth={8} /><circle r={112} fill="none" stroke="#8A6A12" strokeWidth={4} />
          <text y={-10} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill="#5A430A">NOBEL</text>
          <text y={40} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={20} fill="#5A430A">MEDICINA</text>
        </g>
        <text x={540} y={1250} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={110} fill={TGC.nervio} opacity={kAn} style={{ letterSpacing: "0.02em" }}>{TG.nobel.anio}</text>
      </svg>
      <Chip x={104} y={1290} texto={"DAVID JULIUS\nreceptor del calor (TRPV1)"} color={TGC.nervio} px={20} id="tg-n-jul" opacidad={kJu} />
      <Chip x={976} y={1290} texto={"ARDEM PATAPOUTIAN\nreceptores del tacto (Piezo)"} color="#BFE0FF" px={20} anchor="right" id="tg-n-pat" opacidad={kNo} />
      <Frases frases={[{ t: 0.2, texto: "POR DESCUBRIR\nESE RECEPTOR", px: 84 }, { t: N.julius - 0.1, texto: "DAVID JULIUS", px: 100, color: TGC.nervio }, { t: N.nobel - 0.1, texto: "NOBEL DE\nMEDICINA 2021", px: 90, color: "#E2B94A" }]} y={450} x={104} id="titular-tg-nobel" />
      <Fuente texto="Premio Nobel de Fisiología o Medicina 2021: David Julius (capsaicina y TRPV1) y Ardem Patapoutian (Piezo), «por sus descubrimientos de receptores de temperatura y tacto». Esquema." y={1510} delay={N.julius} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── tg-mentol ───────────── */

const SENAL_F: [number, number][] = [[560, 1090], [580, 1190], [770, 1230], [870, 1130], [870, 930]];
export const TgMentol: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const M = TTG.mentol;
  const kCo = clamp((t - a(M.contrario)) / 0.5), kFr = easeOut((t - a(M.frio)) / a(1.4)), kFe = clamp((t - a(M.fresco)) / a(1.4)), kTe = spr(f, a(M.temperatura), { damping: 10, stiffness: 180, mass: 0.8 });
  const abierto = clamp((kFr - 0.6) * 2.5);
  const [sx, sy] = polyPt(SENAL_F, kFe);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={TGC.frio} intensidad={0.5 + 0.9 * kFe} />
        <g opacity={kCo}>
          <rect x={160} y={730} width={36} height={170} rx={18} fill="#0F1730" stroke="#8B97B8" strokeWidth={5} /><rect x={169} y={800} width={18} height={100} rx={9} fill={TGC.calor} /><circle cx={178} cy={922} r={30} fill={TGC.calor} stroke="#8B97B8" strokeWidth={5} />
          <g transform="translate(290 800)"><path d="M 0 0 C 50 -40 110 -30 130 20 C 80 40 20 36 0 0 Z" fill="#3E9E4E" stroke="#1E5A2A" strokeWidth={5} /><path d="M 4 4 L 118 12" stroke="#1E5A2A" strokeWidth={4} /></g>
        </g>
        {[0, 1, 2].map((i) => { const u = clamp(kFr * 1.3 - i * 0.12), px = lerp(330 + i * 40, 560 + i * 24, easeOut(u)), py = lerp(840, 960 - i * 12, easeOut(u)); return kFr > 0 ? <Molecula key={i} x={px} y={py} s={0.7} color="#3E9E4E" giro={i * 40 + t * 30 * (1 - u)} /> : null; })}
        <Canal x={580} y={1010} abierto={abierto} color={TGC.frio} t={t} iones={clamp(abierto * 2)} />
        {kFr > 0.7 && <path d={path(SENAL_F)} pathLength={1} stroke={TGC.nervio} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${kFe} 2`} />}
        {kFe > 0 && kFe < 1 && <circle cx={sx} cy={sy} r={10} fill="#fff" />}
        <g opacity={clamp(kFr * 2)}><Cerebro x={870} y={820} s={0.7} brillo={0.4 + 0.6 * kFe} t={t} /></g>
        {kFe > 0.9 && <Copo x={870} y={690} s={0.5} opacidad={clamp((kFe - 0.9) * 10)} giro={t * 20} />}
      </svg>
      <Chip x={104} y={1090} texto={"TEMPERATURA:\nIGUAL"} color={TGC.calor} px={20} id="tg-m-tem" opacidad={kTe} />
      <Chip x={290} y={870} texto={"MENTOL"} color="#7BE08A" px={22} id="tg-m-men" opacidad={kCo} />
      <Chip x={104} y={1200} texto={`${TG.mentol} · receptor del frío`} color={TGC.frio} px={22} id="tg-m-trp" opacidad={clamp(kFr * 2)} />
      <Chip x={540} y={1320} texto={"frescor sin frío real"} color={TGC.frio} px={26} anchor="center" id="tg-m-fre" opacidad={clamp(kFe * 1.5)} />
      <Frases frases={[{ t: 0.2, texto: "EL MENTOL:\nLO CONTRARIO", px: 92 }, { t: M.frio - 0.1, texto: "ACTIVA EL\nRECEPTOR DEL FRÍO", px: 80, color: TGC.frio }, { t: M.fresco - 0.1, texto: "SIENTES\nFRESCO", px: 100, color: TGC.frio }, { t: M.temperatura - 0.1, texto: "SIN BAJAR LA\nTEMPERATURA", px: 84, color: TGC.calor }]} y={450} x={104} id="titular-tg-mentol" />
      <Fuente texto="El mentol activa TRPM8, el receptor del frío en terminaciones nerviosas de la boca y la piel: el cerebro percibe frescor aunque no cambie la temperatura. Esquema, no a escala." y={1510} delay={M.frio} />
      <Cap e={e} />
    </Fondo>
  );
};
