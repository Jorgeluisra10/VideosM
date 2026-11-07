/**
 * «La médula espinal: el atajo del cuerpo» (SINAPSIS · neuroanatomía) · escenas 1/2
 *   me-gancho    el reflejo rotuliano: el martillo golpea la rodilla y la orden sale de la médula, no del cerebro
 *   me-columna   ≈ 45 cm dentro de la columna vertebral y 31 pares de nervios
 *   me-cola      termina a la altura de L1–L2; debajo solo hay raíces nerviosas: la cola de caballo
 *   me-mariposa  corte transversal: mariposa de sustancia gris rodeada de sustancia blanca
 * Dibujos esquemáticos de anatomía; no son imágenes médicas reales.
 */
import React from "react";
import { MDE, TME, totalPares } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases, FONT, MONOF } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { Ambiente, Cerebro, Chip, Columna, Corte, LineaN, ME, geoColumna } from "./me-kit";

type P = { e: EscenaViralGuardada };
const bez = (p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number], u: number): [number, number] => {
  const m = 1 - u;
  return [m * m * m * p0[0] + 3 * m * m * u * p1[0] + 3 * m * u * u * p2[0] + u * u * u * p3[0], m * m * m * p0[1] + 3 * m * m * u * p1[1] + 3 * m * u * u * p2[1] + u * u * u * p3[1]];
};

/* ───────────── me-gancho ───────────── */

export const MeGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TME.gancho;
  const tg = a(G.golpe), arco = a(G.arco);
  const kMa = clamp((t - (tg - 0.5)) / 0.5);                       // martillo baja
  const rebote = clamp((t - tg) / 0.4);
  const kApag = clamp((t - a(G.cerebro)) / 0.5);
  const kMed = spr(f, a(G.medula), { damping: 11, stiffness: 170, mass: 0.8 });
  const kick = clamp((t - tg - arco) / 0.25) * (1 - clamp((t - tg - arco - 0.5) / 0.7));
  const hx = lerp(660, 508, easeOut(kMa)) + 90 * easeOut(rebote), hy = lerp(740, 930, easeOut(kMa)) - 130 * easeOut(rebote);
  const sens: [[number, number], [number, number], [number, number], [number, number]] = [[505, 935], [600, 850], [720, 880], [800, 1010]];
  const mot: [[number, number], [number, number], [number, number], [number, number]] = [[860, 1050], [700, 1140], [440, 1110], [360, 972]];
  const us = clamp((t - tg) / (arco * 0.5)), um = clamp((t - tg - arco * 0.5) / (arco * 0.5));
  const [sx, sy] = bez(...sens, us), [mx, my] = bez(...mot, um);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={900} />
        {/* paciente sentado */}
        <g>
          <rect x={60} y={1010} width={330} height={26} rx={10} fill="#3A4458" />
          <rect x={120} y={1036} width={22} height={220} fill="#3A4458" /><rect x={300} y={1036} width={22} height={220} fill="#3A4458" />
          <rect x={150} y={720} width={90} height={250} rx={44} fill={ME.gris} />
          <circle cx={196} cy={668} r={48} fill={ME.gris} />
          <rect x={170} y={920} width={330} height={74} rx={36} fill={ME.gris} />
          <g transform={`translate(495 958) rotate(${-38 * kick})`}><rect x={-34} y={-8} width={70} height={250} rx={34} fill={ME.gris} transform="rotate(0)" /><rect x={-34} y={210} width={130} height={46} rx={22} fill={ME.gris} /></g>
          <circle cx={495} cy={958} r={10} fill="#fff" opacity={0.5} />
        </g>
        {/* martillo de reflejos */}
        <g opacity={clamp(kMa * 3)}>
          <line x1={hx} y1={hy} x2={hx + 120} y2={hy - 90} stroke="#C8D2E0" strokeWidth={14} strokeLinecap="round" />
          <polygon points={`${hx - 30},${hy - 22} ${hx + 6},${hy - 36} ${hx + 20},${hy + 14} ${hx - 14},${hy + 28}`} fill="#E04A3F" stroke="#7A1A14" strokeWidth={4} />
        </g>
        {t > tg && t < tg + 0.5 && <g opacity={1 - (t - tg) / 0.5}><circle cx={505} cy={935} r={20 + 120 * (t - tg)} fill="none" stroke={ME.oro} strokeWidth={6} /></g>}
        {/* arco reflejo */}
        <path d={`M ${sens[0][0]} ${sens[0][1]} C ${sens[1][0]} ${sens[1][1]} ${sens[2][0]} ${sens[2][1]} ${sens[3][0]} ${sens[3][1]}`} stroke={ME.sens} strokeWidth={7} fill="none" strokeLinecap="round" strokeDasharray="14 12" opacity={0.7} />
        <path d={`M ${mot[0][0]} ${mot[0][1]} C ${mot[1][0]} ${mot[1][1]} ${mot[2][0]} ${mot[2][1]} ${mot[3][0]} ${mot[3][1]}`} stroke={ME.mot} strokeWidth={7} fill="none" strokeLinecap="round" strokeDasharray="14 12" opacity={0.7} />
        {us > 0 && us < 1 && <circle cx={sx} cy={sy} r={14} fill={ME.sens} stroke="#fff" strokeWidth={4} />}
        {um > 0 && um < 1 && <circle cx={mx} cy={my} r={14} fill={ME.mot} stroke="#fff" strokeWidth={4} />}
        {/* médula y cerebro */}
        <rect x={812} y={800} width={36} height={420} rx={18} fill={ME.blanca} opacity={0.95} />
        <ellipse cx={830} cy={1030} rx={42} ry={44} fill={ME.gris} stroke={ME.sens} strokeWidth={4 + 8 * kMed} />
        <circle cx={830} cy={1030} r={clamp(kMed) * 90} fill={ME.sens} opacity={0.14 * clamp(kMed)} />
        <Cerebro x={830} y={700} s={0.55} brillo={0.5} apagado={kApag} t={t} />
        <LineaN activo={1} prog={clamp((t - tg) / 1.0)} y={1430} />
      </svg>
      <Chip x={830} y={1270} texto={"MÉDULA ESPINAL\nsegmentos L2–L4"} color={ME.sens} px={26} anchor="center" id="me-gancho-med" opacidad={clamp(kMed * 2)} />
      <Chip x={830} y={780} texto="NO PARTICIPA" color={ME.rojo} px={24} anchor="center" id="me-gancho-no" opacidad={kApag} />
      <Frases frases={[{ t: 0.2, texto: "EL MARTILLO\nGOLPEA", px: 100 }, { t: G.cerebro - 0.1, texto: "NO SALE DEL\nCEREBRO", px: 96, color: ME.cereb }, { t: G.medula - 0.1, texto: "SALE DE LA\nMÉDULA ESPINAL", px: 80, color: ME.sens }]} y={450} x={104} id="titular-me-gancho" />
      <Fuente texto={`Reflejo rotuliano: arco monosináptico a través de los segmentos ${MDE.reflejoRotuliano} de la médula, sin pasar por el cerebro. Esquema, no a escala.`} y={1510} delay={G.cerebro} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── me-columna ───────────── */

export const MeColumna: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TME.columna;
  const kMed = clamp((t - a(C.medula)) / a(1.4));
  const kReg = easeOut((t - a(C.regla)) / 0.8);
  const kCol = clamp((t - a(C.columna)) / 0.4);
  const kPar = clamp((t - a(C.nervios)) / a(2.0));
  const reg = t < a(C.columna) ? null : (["c", "t", "l", "s"] as const)[Math.min(3, Math.floor((t - a(C.columna)) / a(0.5)))];
  const g = React.useMemo(() => geoColumna(620), []);
  const yTop = 660 + g.v[0].y, yCono = 660 + g.yDe(19.75);
  const lista: [string, number, string, number][] = [["C", 8, ME.sens, 0], ["T", 12, ME.verde, 0.2], ["L", 5, ME.oro, 0.4], ["S", 5, ME.mot, 0.6], ["Co", 1, ME.cereb, 0.8]];
  const kTot = spr(f, a(C.conteo + 1.8), { damping: 11, stiffness: 170, mass: 0.8 });
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={950} />
        <Columna x={290} y={660} alto={620} medula={kMed} pares={kPar} resalta={reg} t={t} etiquetas />
        {/* regla de ≈ 45 cm */}
        <g opacity={kReg}>
          <line x1={600} y1={yTop} x2={600} y2={yTop + (yCono - yTop) * kReg} stroke={ME.oro} strokeWidth={6} />
          <path d={`M 580 ${yTop} L 620 ${yTop} M 580 ${yTop + (yCono - yTop) * kReg} L 620 ${yTop + (yCono - yTop) * kReg}`} stroke={ME.oro} strokeWidth={6} strokeLinecap="round" />
          <rect x={632} y={(yTop + yCono) / 2 - 40} width={170} height={64} rx={16} fill="rgba(5,9,19,0.85)" stroke={ME.oro} strokeWidth={4} /><text x={717} y={(yTop + yCono) / 2 + 6} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={42} fill={ME.oro}>≈ {MDE.longitudCm} cm</text>
        </g>
        <LineaN activo={1} prog={clamp(t / a(7))} y={1430} />
      </svg>
      {lista.map(([n, k, c, d], i) => {
        const op = clamp((t - a(C.nervios) - d * 2) / 0.4);
        return <div key={n} data-texto={`me-col-${n}`} style={{ position: "absolute", left: 640, top: 1000 + i * 54, opacity: op, fontFamily: MONOF, fontWeight: 800, fontSize: 32, color: c, textShadow: "0 3px 14px #000" }}>{n}  <span style={{ color: "#fff" }}>{k}</span> <span style={{ fontSize: 22, color: ME.hielo }}>pares</span></div>;
      })}
      <div data-texto="me-col-total" style={{ position: "absolute", left: 620, top: 1280, width: 380, textAlign: "left", opacity: clamp(kTot * 2), transform: `scale(${0.85 + 0.15 * clamp(kTot)})`, transformOrigin: "0% 50%", fontFamily: FONT, fontWeight: 900, fontSize: 52, color: ME.oro, textShadow: "0 4px 20px #000" }}>= {totalPares(MDE.pares)} pares</div>
      <Frases frases={[{ t: 0.2, texto: "≈ 45 cm\nDE MÉDULA", px: 100 }, { t: C.columna - 0.1, texto: "PROTEGIDA POR\nLA COLUMNA", px: 84, color: ME.hielo }, { t: C.nervios - 0.1, texto: "31 PARES\nDE NERVIOS", px: 100, color: ME.sens }]} y={450} x={104} id="titular-me-columna" />
      <Fuente texto="Médula del adulto ≈ 42–45 cm; 31 pares de nervios espinales (8 cervicales, 12 torácicos, 5 lumbares, 5 sacros, 1 coccígeo) con 7 vértebras cervicales. Esquema." y={1510} delay={C.nervios} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── me-cola ───────────── */

export const MeCola: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TME.cola;
  const S = 1.9, X = 250, Y = -20;
  const g = React.useMemo(() => geoColumna(620), []);
  const px = (i: number): number => X + (g.xDe(i) + 46) * S;
  const py = (i: number): number => Y + g.yDe(i) * S;
  const kLu = spr(f, a(C.lumbar), { damping: 11, stiffness: 170, mass: 0.8 });
  const kCola = easeOut((t - a(C.nervios)) / a(1.4));
  const kCab = spr(f, a(C.caballo), { damping: 11, stiffness: 160, mass: 0.8 });
  const ent = easeOut((t - a(C.puncion)) / a(0.8));
  const yLP = py(21.5);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={900} />
        <defs><clipPath id="mec-clip"><rect x={0} y={640} width={W} height={760} /></clipPath><linearGradient id="mec-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#050913" stopOpacity="1" /><stop offset="1" stopColor="#050913" stopOpacity="0" /></linearGradient></defs>
        <g clipPath="url(#mec-clip)"><Columna x={X} y={Y} alto={620} s={S} medula={1} cola={kCola} resalta={t > a(C.lumbar) ? "l" : null} t={t} /></g>
        <rect x={0} y={640} width={W} height={90} fill="url(#mec-fade)" />
        {/* marcador del cono medular */}
        <g opacity={clamp(kLu * 2)}>
          <circle cx={px(19.75)} cy={py(19.75)} r={34 + 6 * Math.sin(t * 5)} fill="none" stroke={ME.oro} strokeWidth={5} />
          <line x1={px(19.75) + 40} y1={py(19.75)} x2={640} y2={py(19.75)} stroke={ME.oro} strokeWidth={4} strokeDasharray="10 8" />
        </g>
        {/* aguja de la punción lumbar */}
        <g opacity={clamp(ent * 3)}>
          <line x1={lerp(980, px(21.5) - 8, ent)} y1={lerp(yLP - 30, yLP, ent)} x2={lerp(1180, px(21.5) + 160, ent)} y2={lerp(yLP - 70, yLP - 30, ent)} stroke="#E8EEF6" strokeWidth={9} strokeLinecap="round" />
          <circle cx={px(21.5) - 8} cy={yLP} r={13} fill={ME.verde} />
        </g>
        <LineaN activo={1} prog={clamp(t / a(7))} y={1440} />
      </svg>
      <Chip x={650} y={py(19.75) - 60} texto={"fin de la médula\nL1–L2 (cono medular)"} color={ME.oro} px={24} id="me-cola-cono" opacidad={clamp(kLu * 2)} />
      <Chip x={650} y={1010} texto={"raíces nerviosas:\ncola de caballo"} color={ME.sens} px={26} id="me-cola-cab" opacidad={clamp(kCab * 2)} />
      <Chip x={600} y={920} texto={"punción lumbar: L3–L4,\npor debajo de la médula"} color={ME.verde} px={22} id="me-cola-lp" opacidad={clamp(ent * 2)} />
      <Frases frases={[{ t: 0.2, texto: "PERO TERMINA\nMUY ARRIBA", px: 88 }, { t: C.lumbar - 0.1, texto: "EN L1–L2", px: 124, color: ME.oro }, { t: C.nervios - 0.1, texto: "DEBAJO, SOLO\nNERVIOS", px: 92 }, { t: C.caballo - 0.1, texto: "LA COLA DE\nCABALLO", px: 100, color: ME.sens }]} y={450} x={104} id="titular-me-cola" />
      <Fuente texto={`La médula del adulto suele terminar en ${MDE.conoNivel} (rango T12–L3); la punción lumbar se hace por debajo (${MDE.puncionNivel} o L4–L5). En bebés termina más abajo. Esquema.`} y={1520} delay={C.lumbar} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── me-mariposa ───────────── */

export const MeMariposa: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const M = TME.mariposa;
  const kF = spr(f, a(M.forma), { damping: 13, stiffness: 120, mass: 0.9 });
  const kGris = clamp((t - a(M.gris)) / 0.5), kBl = clamp((t - a(M.blanca)) / 0.5);
  const kPro = clamp((t - a(M.procesa)) / 0.5), kVi = clamp((t - a(M.autopistas)) / 0.6);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={960} />
        <g opacity={clamp(kF * 2)}>
          <Corte x={540} y={960} s={0.6 + 0.65 * clamp(kF)} gris={kGris * (1 - 0.7 * kBl)} blanca={kBl} pulsos={kPro * (1 - 0.8 * kBl)} vias={kVi} t={t} />
        </g>
        <LineaN activo={1} prog={clamp(t / a(7))} y={1440} />
      </svg>
      <Chip x={540} y={606} texto="dorsal (atrás): sensibilidad" color={ME.sens} px={24} anchor="center" id="me-mar-dorsal" opacidad={clamp(kGris * 2)} />
      <Chip x={540} y={1256} texto="ventral (delante): movimiento" color={ME.mot} px={24} anchor="center" id="me-mar-ventral" opacidad={clamp(kGris * 2)} />
      <Chip x={540} y={1304} texto="↑ sube lo que sientes · ↓ baja la orden de moverte" color={ME.hielo} px={20} anchor="center" id="me-mar-vias" opacidad={kVi} />
      <Frases frases={[{ t: 0.2, texto: "POR DENTRO:\nUNA MARIPOSA", px: 92 }, { t: M.gris - 0.1, texto: "SUSTANCIA\nGRIS", px: 108, color: ME.sens }, { t: M.blanca - 0.1, texto: "SUSTANCIA\nBLANCA", px: 108, color: ME.oro }, { t: M.autopistas - 0.1, texto: "LAS\nAUTOPISTAS", px: 108 }]} y={450} x={104} id="titular-me-mariposa" />
      <Fuente texto="Corte transversal esquemático: la sustancia gris (cuerpos de neuronas, procesa señales) y la blanca (axones mielinizados: vías ascendentes y descendentes). No es una imagen médica real." y={1510} delay={M.gris} />
      <Cap e={e} />
    </Fondo>
  );
};
