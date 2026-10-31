/**
 * «Tu cerebro no siente dolor» (SINAPSIS · sin voz) · escenas 1/2
 *   dol-gancho     una sonda pincha el cerebro y el medidor de dolor se queda en cero
 *   dol-capas      cuero cabelludo, cráneo y meninges duelen; el tejido cerebral, no
 *   dol-quirofano  craneotomía despierto: el paciente cuenta mientras la sonda estimula la corteza
 *   dol-mapa       se prueba cada punto de la corteza; en uno se detiene el habla
 */
import React from "react";
import { TDO } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, mezclar, spr, useReloj } from "../comun";
import { Estudio, Frases, MONOF, RE } from "./real-kit";
import { Fuente } from "./real1";
import { Chip } from "./med1";
import { Cerebro, GL, ptCerebro } from "./glf-kit";
import { Burbuja, Capas, DK, Sonda } from "./dol-kit";

type P = { e: EscenaViralGuardada };

const mundo = (cx: number, cy: number, s: number, l: [number, number]): [number, number] => [cx + s * l[0], cy + s * l[1]];
/** 0→1→0 durante `dur` segundos a partir de `t0` */
const pulso = (t: number, t0: number, dur = 0.5): number => { const u = (t - t0) / dur; return u > 0 && u < 1 ? Math.sin(u * Math.PI) : 0; };

/* ───────────── dol-gancho ───────────── */

export const DolGancho: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const G = TDO.gancho;
  const sC = spr(f, a(G.cerebro), { damping: 16, stiffness: 80, mass: 1 });
  const CX = 540, CY = 1010, S = 1.45;
  const objetivo = mundo(CX, CY, S, ptCerebro(-1.75, 1));
  const ang = 105;
  const dir: [number, number] = [Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)];
  let poke = 0, ultimo = -1;
  for (let i = 0; i < 5; i++) { const p = pulso(t, a(G.pincha + i * G.pinchaCada), 0.36); if (p > poke) poke = p; if (t > a(G.pincha + i * G.pinchaCada)) ultimo = i; }
  const aparece = clamp((t - a(G.pincha - 0.5)) / 0.5);
  const dist = 90 - 100 * poke;
  const punta: [number, number] = [objetivo[0] - dir[0] * dist, objetivo[1] - dir[1] * dist - (1 - aparece) * 220];
  const ripple = ultimo >= 0 ? clamp((t - a(G.pincha + ultimo * G.pinchaCada)) / 0.7) : 0;
  const cero = spr(f, a(G.cero), { damping: 11, stiffness: 190, mass: 0.6 });
  const aguja = Math.PI + 0.03 * Math.sin(t * 40) * (poke > 0 ? 1 : 0.3);
  const DX = 540, DY = 1440, DR = 170;
  return (
    <Estudio piso={1560} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Cerebro x={CX} y={CY} s={S * sC} luz={0.35}>
          {ripple > 0 && ripple < 1 && <circle cx={ptCerebro(-1.75, 1)[0]} cy={ptCerebro(-1.75, 1)[1]} r={14 + 80 * ripple} fill="none" stroke={DK.amarillo} strokeWidth={5 * (1 - ripple)} opacity={1 - ripple} />}
        </Cerebro>
        <Sonda x={punta[0]} y={punta[1]} ang={ang} largo={430} luz={poke} opacidad={aparece} />
        {/* medidor de dolor */}
        <g opacity={clamp((t - a(G.cero - 0.8)) / 0.5)}>
          <path d={`M ${DX - DR} ${DY} A ${DR} ${DR} 0 0 1 ${DX + DR} ${DY}`} fill="none" stroke="#10243A" strokeWidth={26} strokeLinecap="round" />
          <path d={`M ${DX - DR} ${DY} A ${DR} ${DR} 0 0 1 ${DX + DR} ${DY}`} fill="none" stroke="url(#dol-dial)" strokeWidth={14} strokeLinecap="round" />
          <defs><linearGradient id="dol-dial" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={DK.verde} /><stop offset="0.55" stopColor={DK.amarillo} /><stop offset="1" stopColor={DK.rojo} /></linearGradient></defs>
          <line x1={DX} y1={DY} x2={DX + Math.cos(aguja) * (DR - 24)} y2={DY + Math.sin(aguja) * (DR - 24)} stroke="#fff" strokeWidth={7} strokeLinecap="round" />
          <circle cx={DX} cy={DY} r={15} fill="#fff" />
        </g>
      </svg>
      <div data-texto="dol-dial-et" style={{ position: "absolute", left: 120, width: 840, top: 1465, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 30, color: GL.lcrClaro, opacity: clamp((t - a(G.cero - 0.8)) / 0.5) }}>DOLOR EN EL TEJIDO CEREBRAL</div>
      <div data-texto="dol-cero" style={{ position: "absolute", left: DX - 120, top: 1330, width: 240, textAlign: "center", fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: 120, lineHeight: 1, color: DK.verde, opacity: clamp(cero * 1.5), transform: `scale(${0.6 + 0.4 * cero})` }}>0</div>
      <Frases frases={[{ t: G.t1, texto: "tu cerebro", px: 108 }, { t: G.t2, texto: "no siente", color: RE.blanco, px: 118 }, { t: G.t3, texto: "dolor", color: DK.rojo, px: 150 }]} y={470} id="dol-gancho-t" />
    </Estudio>
  );
};

/* ───────────── dol-capas ───────────── */

export const DolCapas: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const C = TDO.capas;
  const sCu = spr(f, a(C.cuero), { damping: 15, stiffness: 120, mass: 0.8 });
  const sCr = spr(f, a(C.craneo), { damping: 15, stiffness: 120, mass: 0.8 });
  const sMe = spr(f, a(C.menin), { damping: 15, stiffness: 120, mass: 0.8 });
  const fl = [0, 1, 2].map((i) => pulso(t, a(C.prueba(i)), 0.6));
  const cero = spr(f, a(C.cero), { damping: 11, stiffness: 190, mass: 0.6 });
  const CX = 540, CY = 930, S = 1.15;
  const chispas: [number, number, number][] = [
    [...mundo(CX, CY, S, ptCerebro(-2.3, 1.235)), fl[0]],
    [...mundo(CX, CY, S, ptCerebro(-0.6, 1.135)), fl[1]],
    [...mundo(CX, CY, S, ptCerebro(0.3, 1.048)), fl[2]],
  ];
  const lat = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 1.1 * t)), 3);
  const filas = [
    { n: "cuero cabelludo", s: "duele", c: DK.cuero, ok: false, ini: C.prueba(0) },
    { n: "cráneo", s: "duele", c: DK.hueso, ok: false, ini: C.prueba(1) },
    { n: "meninges", s: "duele", c: DK.menin, ok: false, ini: C.prueba(2) },
    { n: "tejido cerebral", s: "0 receptores de dolor", c: GL.carne, ok: true, ini: C.cero },
  ];
  return (
    <Estudio piso={1560} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Capas x={CX} y={CY} s={S} cuero={sCu} craneo={sCr} menin={sMe} duele={{ cuero: fl[0], craneo: fl[1], menin: fl[2] }} pulso={lat} />
        <Cerebro x={CX} y={CY} s={S} luz={0.3} />
        {chispas.map(([x, y, k], i) => k > 0 && (
          <g key={i} transform={`translate(${x} ${y}) scale(${0.6 + 0.8 * k})`} opacity={k}>
            <circle r={44} fill={DK.rojo} opacity={0.3} />
            <path d="M 6 -34 L -14 4 L 2 4 L -6 34 L 18 -8 L 2 -8 Z" fill={DK.amarillo} stroke="#fff" strokeWidth={2} />
          </g>
        ))}
        {cero > 0 && (
          <g transform={`translate(${CX} ${CY - 26}) scale(${0.5 + 0.5 * cero})`} opacity={clamp(cero * 1.5)}>
            <circle r={78} fill="#06101C" fillOpacity={0.82} stroke={DK.verde} strokeWidth={6} />
            <text y={32} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={96} fill={DK.verde}>0</text>
          </g>
        )}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "lo que duele\nlo envuelve", px: 92 }, { t: 3.9, texto: "el tejido\nno siente", color: GL.lcr, px: 96 }]} y={400} id="dol-capas-t" />
      {filas.map((r, i) => {
        const k = clamp((t - a(r.ini - 0.1)) / 0.35);
        const aparece = clamp((t - a(i === 0 ? C.cuero : i === 1 ? C.craneo : i === 2 ? C.menin : C.menin + 0.2)) / 0.4);
        return (
          <div key={i} data-texto={`dol-capas-fila${i}`} style={{ position: "absolute", left: 130, top: 1330 + i * 52, width: 820, display: "flex", alignItems: "center", gap: 18, fontFamily: MONOF, fontWeight: 700, fontSize: 30, opacity: aparece }}>
            <span style={{ width: 26, height: 26, borderRadius: 6, background: r.c, flex: "none", boxShadow: "0 0 12px rgba(255,255,255,0.25)" }} />
            <span style={{ color: RE.blanco, minWidth: 290 }}>{r.n}</span>
            <span style={{ color: r.ok ? DK.verde : DK.rojo, opacity: k }}>{r.ok ? "" : "● "}{r.s}</span>
          </div>
        );
      })}
    </Estudio>
  );
};

/* ───────────── dol-quirofano ───────────── */

export const DolQuirofano: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const Q = TDO.quirofano;
  const ent = spr(f, a(Q.capas), { damping: 15, stiffness: 100, mass: 0.9 });
  const abierto = t >= a(Q.abre);
  const sacudida = pulso(t, a(Q.abre), 0.4) * 5;
  const CX = 540, CY = 1010, S = 1.3;
  const objetivo = mundo(CX, CY, S, ptCerebro(-1.4, 1));
  const ang = 115;
  const dir: [number, number] = [Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)];
  const sonda = spr(f, a(Q.sonda), { damping: 14, stiffness: 100, mass: 0.9 });
  const n = [0, 1, 2, 3].filter((i) => t >= a(Q.cuenta(i))).length;
  const luz = [0, 1, 2, 3].reduce((m, i) => Math.max(m, pulso(t, a(Q.cuenta(i)), 0.4)), 0);
  const punta: [number, number] = [objetivo[0] - dir[0] * (260 * (1 - sonda)), objetivo[1] - dir[1] * (260 * (1 - sonda))];
  const texto = ["1", "2", "3", "4"].slice(0, Math.max(0, n)).join(" · ") + (n > 0 && n < 4 ? " ·" : "");
  return (
    <Estudio piso={1560} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${Math.sin(t * 90) * sacudida} 0)`}>
          <Capas x={CX} y={CY} s={S * ent} ventana={abierto} />
          <Cerebro x={CX} y={CY} s={S * ent} luz={0.3} />
        </g>
        <Sonda x={punta[0]} y={punta[1]} ang={ang} largo={400} luz={luz} opacidad={clamp(sonda * 2)} />
        {n > 0 && <Burbuja x={140} y={590} w={440} h={96} texto={texto || "…"} cola={[mundo(CX, CY, S, [-215, 40])[0], mundo(CX, CY, S, [-215, 40])[1]]} px={44} id="dol-quiro-burbuja" />}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "te operan\ndespierto", px: 108, color: RE.blanco }]} y={400} id="dol-quiro-t" />
      <Chip texto="anestesia local en el cuero cabelludo" x={W / 2} y={1400} color={DK.cuero} opacidad={clamp((t - a(Q.sonda)) / 0.5)} ancho={760} id="dol-quiro-c1" />
      <Chip texto="el paciente habla mientras se estimula" x={W / 2} y={1470} color={GL.lcrClaro} opacidad={clamp((t - a(Q.chip - 0.4)) / 0.5)} ancho={700} id="dol-quiro-c2" />
    </Estudio>
  );
};

/* ───────────── dol-mapa ───────────── */

const TAGS: { l: [number, number]; ok: boolean }[] = [
  { l: [-120, -120], ok: true },
  { l: [-190, -10], ok: true },
  { l: [-120, 55], ok: false },
  { l: [20, -140], ok: true },
  { l: [110, -50], ok: true },
];

export const DolMapa: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const M = TDO.mapa;
  const CX = 540, CY = 960, S = 1.55;
  const pos = (i: number): [number, number] => mundo(CX, CY, S, TAGS[i].l);
  // probe: llega a cada etiqueta 0,5 s antes de probarla y se queda hasta la siguiente
  let px = pos(0)[0], py = pos(0)[1] - 260;
  const ang = 108;
  const llegada = (i: number): number => a(M.prueba(i)) - 0.55;
  for (let i = 0; i < TAGS.length; i++) {
    const origen: [number, number] = i === 0 ? [pos(0)[0] + 80, pos(0)[1] - 280] : pos(i - 1);
    const k = easeInOut((t - (llegada(i) - 0.5)) / 0.5);
    if (t >= llegada(i) - 0.5) { px = lerp(origen[0], pos(i)[0], k); py = lerp(origen[1], pos(i)[1], k); }
  }
  const dir: [number, number] = [Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)];
  let activa = -1;
  TAGS.forEach((_, i) => { if (t >= a(M.prueba(i)) && t < a(M.prueba(i)) + 0.7) activa = i; });
  const luz = activa >= 0 ? pulso(t, a(M.prueba(activa)), 0.7) : 0;
  const falla = activa === 2;
  const probadas = TAGS.map((_, i) => t >= a(M.prueba(i)) + 0.7);
  const bubTxt = falla ? "1 · 2 · ▮" : "1 · 2 · 3 · 4";
  const bubCol = falla ? DK.rojo : activa >= 0 ? DK.verde : GL.lcrClaro;
  return (
    <Estudio piso={1560} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Cerebro x={CX} y={CY} s={S} luz={0.3} />
        {TAGS.map((tg, i) => {
          const [x, y] = pos(i);
          const ap = spr(f, a(M.tag(i)), { damping: 12, stiffness: 190, mass: 0.6 });
          const hecho = probadas[i];
          const col = hecho ? (tg.ok ? DK.verde : DK.rojo) : "#F4F8FB";
          const lat = !tg.ok && hecho ? 0.5 + 0.5 * Math.sin(t * 7) : 0;
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(${ap})`}>
              {!tg.ok && hecho && <circle r={44 + 10 * lat} fill="none" stroke={DK.rojo} strokeWidth={4} opacity={0.4 + 0.5 * lat} />}
              <rect x={-24} y={-24} width={48} height={48} rx={10} fill={col} stroke="#0A1B2B" strokeWidth={3} />
              <text y={12} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={32} fill="#0A1B2B">{hecho ? (tg.ok ? "✓" : "✕") : String(i + 1)}</text>
            </g>
          );
        })}
        <Sonda x={px - dir[0] * (30 - 22 * luz)} y={py - dir[1] * (30 - 22 * luz)} ang={ang} largo={420} luz={luz} opacidad={clamp((t - a(0.5)) / 0.4)} />
        <Burbuja x={140} y={610} w={470} h={92} texto={bubTxt} cola={[pos(1)[0] - 60, pos(1)[1] - 40]} color={bubCol} px={42} opacidad={clamp((t - a(0.9)) / 0.4)} id="dol-mapa-burbuja" />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "cada punto\nse prueba", px: 92 }, { t: M.prueba(2) + 0.9, texto: "y se evita\nlo vital", color: DK.rojo, px: 100 }]} y={400} id="dol-mapa-t" />
      <Chip texto="● el habla continúa" x={330} y={1440} color={DK.verde} opacidad={clamp((t - a(1.2)) / 0.4)} ancho={440} id="dol-mapa-l1" />
      <Chip texto="● el habla se detiene" x={780} y={1440} color={DK.rojo} opacidad={clamp((t - a(M.prueba(2))) / 0.3)} ancho={440} id="dol-mapa-l2" />
      <Fuente texto="Mapeo cortical con estimulación eléctrica en cirugía despierto · esquema" y={1486} delay={0.5} />
    </Estudio>
  );
};
