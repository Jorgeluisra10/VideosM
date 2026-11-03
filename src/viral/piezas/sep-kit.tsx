/**
 * Kit de «El laboratorio bacteriano bajo tu terreno» (IMNOBA · carril B). Un MUNDO en corte transversal, como los explicativos de plano continuo:
 * el mismo dibujo (casa, tierra, tanque de dos cámaras, lecho de grava, napa y pozo de agua) se va construyendo y la cámara viaja de un detalle a otro.
 * Todo con formas geométricas simples (rombos, cuadros, triángulos y hexágonos). Sin imágenes externas.
 *   Mundo     dibuja el corte completo según un `Estado` (cada variable de 0 a 1) y una cámara (x, y, zoom)
 *   Bicho     bacteria geométrica (rombo con ojos y brazos) que se mueve
 *   camT, proy   interpolación de cámara y proyección mundo → pantalla (para poner rótulos HTML)
 */
import React, { useMemo } from "react";
import { azar } from "../../lib/anim";
import { H, W, clamp, easeInOut, easeOut, lerp, mezclar, useReloj } from "../comun";
import { Mosaico, TC, fac, type Faceta, type Pt } from "./tmd-kit";

/* ───────────── medidas del mundo (px a zoom 1) ───────────── */

export const G = {
  GY: 600, // línea del suelo
  CH1: [490, 700] as const, // interior de la cámara 1
  CH2: [724, 934] as const, // interior de la cámara 2
  FONDO: 990, // fondo del tanque (interior)
  AGUA: 700, // nivel del agua
  NAPA0: 1300, NAPA1: 1480,
  POZO_X: 2000,
  GRAVA: [1040, 1560] as const, // x del lecho de grava
  VENT_X: 712,
};

export type Cam = { x: number; y: number; z: number };
/** punto del mundo → pantalla */
export const proy = (c: Cam, wx: number, wy: number): [number, number] => [540 + (wx - c.x) * c.z, 960 + (wy - c.y) * c.z];
/** cámara entre `a` y `b` (zoom geométrico) desde `ini` hasta `ini + dur` s */
export const camT = (t: number, ini: number, dur: number, a: Cam, b: Cam): Cam => {
  const k = easeInOut((t - ini) / Math.max(0.0001, dur));
  return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: a.z * Math.pow(b.z / a.z, k) };
};

export type Estado = {
  /** pozo ciego sin tratamiento: mancha que baja a la napa y llega al pozo de agua */
  fuga: number;
  /** olores (ondas verdes) que salen del pozo */
  olor: number;
  /** paredes de hormigón de las dos cámaras */
  muros: number;
  /** separación en capas: nata arriba, agua clara en medio y lodo abajo */
  capas: number;
  /** bacterias anaerobias y burbujas de gas */
  bact: number;
  /** segunda cámara con agua clara */
  cam2: number;
  /** tubo de ventilación */
  vent: number;
  /** trampa de agua bajo el inodoro */
  trampa: number;
  /** lecho de grava */
  grava: number;
  /** agua que atraviesa la grava y la tierra */
  filtra: number;
  /** el agua llega limpia a la napa */
  napa: number;
  /** el pozo de agua se ve limpio */
  limpio: number;
  /** camión que vacía los lodos */
  camion: number;
  /** letrero «se vende» */
  lote: number;
  /** agua usada que sale de la casa */
  uso: number;
};
export const E0: Estado = { fuga: 0, olor: 0, muros: 0, capas: 0, bact: 0, cam2: 0, vent: 0, trampa: 0, grava: 0, filtra: 0, napa: 0, limpio: 0, camion: 0, lote: 0, uso: 0 };
export const est = (p: Partial<Estado>): Estado => ({ ...E0, ...p });

const C = {
  agua: ["#2FA6D0", "#1F83B4", "#3DB8E6"],
  sucia: "#5E4326",
  lodo: "#2A1C13",
  nata: "#EBDDA6",
  claro: "#58A9D6",
  hormigon: ["#7D8794", "#9AA4B0", "#656F7C", "#8A94A1"],
  gas: "#8DFF7A",
  lima: "#B6FF3D",
};

const diam = (cx: number, cy: number, w: number, h: number): Pt[] => [[cx, cy - h], [cx + w, cy], [cx, cy + h], [cx - w, cy]];
const poly = (p: Pt[]): string => p.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ");

/* ───────────── geometría fija (se calcula una vez) ───────────── */


const SW = 38, SH = 27; // medio ancho y medio alto del rombo del suelo
/** estratos: pasto, tierra, arcilla, arena, napa y roca (y0, y1, color) */
const ESTRATOS: [number, number, string][] = [[G.GY, G.GY + SH, "#2F6B3A"], [G.GY + SH, 800, "#4A3629"], [800, 1050, "#6B4E32"], [1050, G.NAPA0, "#A88A5B"], [G.NAPA0, G.NAPA1, "#1F6FA3"], [G.NAPA1, 1900, "#2B2F3A"]];
/** patrón repetible (16 × 8 rombos con tonos claros y oscuros) que da la textura de rombos sobre cada estrato */
/** tono (translúcido) del rombo de la columna `ii` (0–7) y la fila `jj` (0–15) del patrón */
const tonoRombo = (ii: number, jj: number): string => {
  const r = azar(jj * 91.7 + ii * 13.3);
  return r < 0.34 ? `rgba(255,255,255,${(0.04 + r * 0.3).toFixed(3)})` : r < 0.67 ? "rgba(0,0,0,0)" : `rgba(0,0,0,${(0.08 + (r - 0.67) * 0.5).toFixed(3)})`;
};
const PATRON: { p: Pt[]; c: string }[] = (() => {
  const out: { p: Pt[]; c: string }[] = [];
  for (let j = 0; j <= 16; j++) for (let i = 0; i <= 8; i++) out.push({ p: diam(i * 2 * SW + (j % 2) * SW, j * SH, SW, SH), c: tonoRombo(i % 8, j % 16) });
  return out;
})();

function casa(): Faceta[] {
  const out: Faceta[] = [];
  // paredes: cuadros crema
  for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) {
    const x = 20 + c * 47.5, y = 390 + r * 52.5;
    if (c > 0 && c < 7) continue; // el centro queda abierto (corte de la casa)
    out.push(fac([[x, y], [x + 47.5, y], [x + 47.5, y + 52.5], [x, y + 52.5]], ["#E6DCC8", "#D5C9B0", "#CFC3AA"][(r + c) % 3], 0));
  }
  // techo: abanico de triángulos azules con filete dorado
  const ap: Pt = [210, 262];
  for (let i = 0; i < 8; i++) {
    const x0 = 0 + i * 52.5, x1 = x0 + 52.5;
    out.push(fac([[x0, 392], [x1, 392], ap], ["#2C3E91", "#3F55B5", "#27368A", "#364CA8"][i % 4], 0));
  }
  out.push(fac([[0, 392], [420, 392], [420, 380], [0, 380]], TC.oro, 0));
  return out;
}

function sueloFac(): Faceta[] { return []; }

const FUGA: { x: number; y: number; k: number; s: number }[] = (() => {
  const out: { x: number; y: number; k: number; s: number }[] = [];
  // sale del fondo del pozo y baja hasta la napa
  for (let i = 0; i < 22; i++) out.push({ x: 600 + (azar(i * 3.3) - 0.5) * 70, y: 1000 + i * 14, k: i / 22 * 0.35, s: 18 + azar(i) * 14 });
  // y viaja con el agua subterránea hacia el pozo
  for (let i = 0; i < 40; i++) out.push({ x: 640 + i * 36, y: 1340 + Math.sin(i * 0.8) * 22 + (azar(i * 7.1) - 0.5) * 40, k: 0.35 + (i / 40) * 0.65, s: 22 + azar(i * 2.2) * 16 });
  // fuga lateral en las paredes del pozo
  for (let i = 0; i < 8; i++) out.push({ x: i % 2 ? 735 + (i % 4) * 14 : 455 - (i % 4) * 14, y: 800 + i * 25, k: 0.05 + i * 0.02, s: 14 });
  return out;
})();

/** paredes de hormigón del tanque de dos cámaras (cuadros) con su orden de llegada */
function murosFac(): Faceta[] {
  const out: Faceta[] = [];
  const cuadro = (x: number, y: number, w: number, h: number, k: number, i: number): void => { out.push(fac([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], C.hormigon[i % 4], k)); };
  let i = 0;
  const S = 30;
  // paredes verticales: izquierda (466–490), medio (700–724) y derecha (934–958)
  for (const [x, k0] of [[466, 0], [700, 0.35], [934, 0.55]] as [number, number][]) {
    for (let y = 600; y < 1014; y += S) { cuadro(x, y, 24, Math.min(S, 1014 - y), k0 + ((y - 600) / 414) * 0.3, i++); }
  }
  // fondo y tapa
  for (let x = 466; x < 958; x += S) { cuadro(x, 990, Math.min(S, 958 - x), 24, 0.1 + ((x - 466) / 492) * 0.6, i++); cuadro(x, 600, Math.min(S, 958 - x), 30, 0.55 + ((x - 466) / 492) * 0.4, i++); }
  return out;
}

/** piedras del lecho de grava (pentágonos y hexágonos) en el rectángulo de la zanja */
function gravaFac(): Faceta[] {
  const out: Faceta[] = [];
  const [x0, x1] = G.GRAVA;
  let i = 0;
  for (let y = 806; y < 934; y += 22) {
    for (let x = x0 + 10; x < x1 - 8; x += 26) {
      const cx = x + (azar(i * 1.7) - 0.5) * 8 + ((y / 22) % 2) * 9, cy = y + (azar(i * 2.9) - 0.5) * 6;
      const n = 5 + (i % 2), r = 10 + azar(i * 4.1) * 6, rot = azar(i * 5.3) * Math.PI;
      const p: Pt[] = Array.from({ length: n }, (_, q) => [cx + r * Math.cos(rot + (q * 2 * Math.PI) / n), cy + r * 0.82 * Math.sin(rot + (q * 2 * Math.PI) / n)] as Pt);
      out.push(fac(p, ["#9BA3AF", "#B4BBC5", "#7E8794", "#C6CCD4", "#8C95A2"][i % 5], (x - x0) / (x1 - x0) * 0.8 + azar(i) * 0.2));
      i++;
    }
  }
  return out;
}

function camionFac(): Faceta[] {
  const out: Faceta[] = [];
  const gy = G.GY;
  // cisterna: tira de rombos grises-azules
  for (let c = 0; c < 8; c++) {
    const x = 560 + c * 36;
    out.push(fac([[x, gy - 110], [x + 36, gy - 110], [x + 36, gy - 40], [x, gy - 40]], ["#C9D3DE", "#A9B6C4", "#B8C4D1"][c % 3], c / 8));
    out.push(fac([[x, gy - 110], [x + 36, gy - 110], [x + 18, gy - 124]], "#E9F0F7", c / 8));
  }
  // cabina y chasis
  out.push(fac([[510, gy - 96], [556, gy - 96], [556, gy - 40], [500, gy - 40], [500, gy - 70]], TC.oro, 0.7));
  out.push(fac([[512, gy - 90], [542, gy - 90], [542, gy - 66], [508, gy - 66]], "#9CD7F5", 0.8));
  out.push(fac([[496, gy - 40], [850, gy - 40], [850, gy - 26], [496, gy - 26]], "#2B3350", 0.5));
  return out;
}

/* ───────────── bacteria ───────────── */

export const Bicho: React.FC<{ x: number; y: number; s?: number; t: number; color?: string; fase?: number; come?: number }> = ({ x, y, s = 1, t, color = TC.cian, fase = 0, come = 0 }) => {
  const wob = Math.sin(t * 5 + fase) * 2.5 * s;
  const ojo = Math.sin(t * 2 + fase * 1.7) * 1.5 * s;
  const boca = 1 + come * 0.6 * Math.abs(Math.sin(t * 8 + fase));
  return (
    <g transform={`translate(${x} ${y + wob}) rotate(${Math.sin(t * 3 + fase) * 12})`}>
      <polygon points={`0,${-17 * s} ${19 * s},0 0,${15 * s} ${-19 * s},0`} fill={color} stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={1.4 * s} />
      <polygon points={`0,${-17 * s} ${19 * s},0 0,${-2 * s} ${-19 * s},0`} fill="#FFFFFF" opacity={0.18} />
      <polygon points={`${-19 * s},0 ${-30 * s},${-6 * s} ${-26 * s},${6 * s}`} fill={color} />
      <polygon points={`${19 * s},0 ${30 * s},${-6 * s} ${26 * s},${6 * s}`} fill={color} />
      <circle cx={-6 * s} cy={-3 * s} r={4.4 * s} fill="#FFFFFF" /><circle cx={6 * s} cy={-3 * s} r={4.4 * s} fill="#FFFFFF" />
      <circle cx={-6 * s + ojo} cy={-3 * s} r={2 * s} fill="#08102A" /><circle cx={6 * s + ojo} cy={-3 * s} r={2 * s} fill="#08102A" />
      <polygon points={`${-5 * s},${5 * s} ${5 * s},${5 * s} 0,${(5 + 5 * boca) * s}`} fill="#08102A" />
    </g>
  );
};

/** ruta con puntos que avanzan (flujo en un tubo): puntos de `a` a `b` en línea recta */
const Flujo: React.FC<{ pts: Pt[]; t: number; color: string; op: number; n?: number; v?: number; r?: number }> = ({ pts, t, color, op, n = 10, v = 0.25, r = 3.6 }) => {
  if (op < 0.02) return null;
  const seg = pts.slice(1).map((q, i) => ({ a: pts[i], b: q, l: Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]) }));
  const L = seg.reduce((s, q) => s + q.l, 0);
  return (
    <g opacity={op}>
      {Array.from({ length: n }, (_, i) => {
        let d = (((t * v + i / n) % 1) * L);
        for (const s of seg) { if (d <= s.l) { const k = d / s.l; return <circle key={i} cx={lerp(s.a[0], s.b[0], k)} cy={lerp(s.a[1], s.b[1], k)} r={r} fill={color} />; } d -= s.l; }
        return null;
      })}
    </g>
  );
};

/* ───────────── el mundo ───────────── */

export const Mundo: React.FC<{ t: number; cam: Cam; e: Estado; reloj?: number }> = ({ t, cam, e, reloj }) => {
  const { a } = useReloj();
  const f_casa = useMemo(casa, []);
  const f_muros = useMemo(murosFac, []);
  const f_grava = useMemo(gravaFac, []);
  const f_camion = useMemo(camionFac, []);
  void sueloFac; void a; void reloj;
  const GY = G.GY;
  const [c1a, c1b] = G.CH1, [c2a, c2b] = G.CH2;
  const wave = (x: number, y: number, amp = 2.2): number => y + Math.sin(x * 0.05 + t * 2.6) * amp + Math.sin(x * 0.11 - t * 1.9) * amp * 0.5;
  const nivel = G.AGUA;
  const ondaPath = (x0: number, x1: number, y: number, abajo: number): string => {
    const pts: string[] = [];
    for (let x = x0; x <= x1; x += 10) pts.push(`${x},${wave(x, y).toFixed(1)}`);
    return `M ${x0},${abajo} L ${pts.join(" L ")} L ${x1},${abajo} Z`;
  };
  // límites de las capas de la cámara 1 (nata arriba, agua clara, lodo abajo)
  const sLodo = lerp(G.FONDO, 905, e.capas) + 14 * e.bact; // el lodo baja un poco porque las bacterias se comen parte
  const sNata = lerp(nivel, nivel + 30, e.capas);
  const tapaOn = e.muros > 0.02;
  const camaraDestino = e.cam2;
  // arreglos de partículas que se separan
  const particulas = Array.from({ length: 26 }, (_, i) => {
    const pesada = i % 3 !== 0;
    const x = c1a + 14 + azar(i * 3.7) * (c1b - c1a - 28);
    const y0 = nivel + 24 + azar(i * 5.1) * 120;
    const k = easeInOut(e.capas * 1.25 - azar(i * 7) * 0.25);
    const y = pesada ? lerp(y0, sLodo - 8 - azar(i) * 24, k) : lerp(y0, sNata + 4, k);
    return { x: x + Math.sin(t * 1.2 + i) * 3 * (1 - e.capas * 0.7), y, pesada };
  });
  const ca = cam;
  // con zoom alto el patrón se vuelve a rasterizar enorme en cada fotograma: ahí se dibujan solo los rombos que ve la cámara (mismos tonos que el patrón)
  const rombosVisibles: { p: Pt[]; c: string }[] = [];
  if (ca.z >= 1.1) {
    const vx0 = ca.x - 540 / ca.z - SW * 2, vx1 = ca.x + 540 / ca.z + SW * 2, vy0 = ca.y - 960 / ca.z - SH * 2, vy1 = ca.y + 960 / ca.z + SH * 2;
    const j0 = Math.max(0, Math.floor((vy0 - GY) / SH)), j1 = Math.min(Math.ceil(1260 / SH), Math.ceil((vy1 - GY) / SH));
    for (let j = j0; j <= j1; j++) {
      const i0 = Math.floor((vx0 + 360 - (j % 2) * SW) / (2 * SW)), i1 = Math.ceil((vx1 + 360 - (j % 2) * SW) / (2 * SW));
      for (let i = i0; i <= i1; i++) rombosVisibles.push({ p: diam(-360 + i * 2 * SW + (j % 2) * SW, GY + j * SH, SW, SH), c: tonoRombo(((i % 8) + 8) % 8, j % 16) });
    }
  }
  const mundo = (
    <g transform={`translate(540 960) scale(${ca.z.toFixed(4)}) translate(${(-ca.x).toFixed(2)} ${(-ca.y).toFixed(2)})`}>
      {/* suelo de rombos */}
      <g>
        <defs>
          <pattern id="sepsuelo" width={SW * 16} height={SH * 16} patternUnits="userSpaceOnUse" x={-360} y={GY}>
            {PATRON.map((q, i) => <polygon key={i} points={poly(q.p)} fill={q.c} stroke="#000000" strokeOpacity={0.14} strokeWidth={1} />)}
          </pattern>
        </defs>
        {ESTRATOS.map(([y0, y1, c], i) => <rect key={i} x={-420} y={y0} width={3300} height={y1 - y0 + 1} fill={c} />)}
        {ca.z < 1.1 ? <rect x={-420} y={GY} width={3300} height={1260} fill="url(#sepsuelo)" /> : rombosVisibles.map((q, i) => <polygon key={i} points={poly(q.p)} fill={q.c} stroke="#000000" strokeOpacity={0.14} strokeWidth={1} />)}
      </g>
      {/* flujo del agua subterránea en la napa */}
      <g opacity={0.5}>
        {Array.from({ length: 18 }, (_, i) => { const x = ((i * 170 + t * 90) % 2800) - 380; return <polygon key={i} points={`${x},1392 ${x + 36},1388 ${x + 72},1392 ${x + 36},1396`} fill="#BFF0FF" />; })}
      </g>
      {/* mancha del pozo ciego */}
      <g opacity={0.82}>
        {FUGA.map((f, i) => { const v = clamp((e.fuga - f.k) / 0.08); if (v <= 0) return null; return <polygon key={i} points={poly(diam(f.x, f.y, f.s * v, f.s * 0.75 * v))} fill={i % 2 ? "#5B3A1E" : "#6E4A28"} />; })}
      </g>
      {/* cielo bajo el pasto: la línea del suelo */}
      <rect x={-400} y={GY - 3} width={3200} height={5} fill="#7FD08A" opacity={0.7} />

      {/* ——— CASA ——— */}
      <g>
        <rect x={40} y={392} width={340} height={208} fill="#121A4A" />
        <polygon points={poly(diam(140, 470, 30, 40))} fill="#FFE27A" opacity={0.75 + 0.2 * Math.sin(t * 1.3)} stroke="#FFFFFF" strokeOpacity={0.5} />
        <rect x={40} y={598} width={340} height={4} fill="#E6DCC8" />
        {f_casa.map((fc, i) => <polygon key={i} points={poly(fc.p)} fill={fc.c} stroke="#FFFFFF" strokeOpacity={0.2} strokeWidth={1} />)}
        {/* inodoro */}
        <polygon points="316,562 366,562 360,592 322,592" fill="#F2F5F9" stroke="#9FB0C8" />
        <polygon points="340,520 366,520 366,560 340,560" fill="#DDE5EE" stroke="#9FB0C8" />
        <polygon points="336,592 344,592 344,628 336,628" fill="#8E9AAB" />
      </g>
      {/* tubo de la casa al tanque */}
      <g>
        <polyline points="340,628 340,690 520,690" fill="none" stroke="#6B7684" strokeWidth={14} strokeLinejoin="round" />
        <polyline points="340,628 340,690 520,690" fill="none" stroke="#2A2F3A" strokeWidth={8} strokeLinejoin="round" />
        <Flujo pts={[[340, 600], [340, 690], [520, 690], [520, 760]]} t={t} color="#A9783F" op={e.uso} n={9} v={0.2} />
      </g>
      {/* trampa de agua bajo el inodoro */}
      {e.trampa > 0.01 && (
        <g opacity={e.trampa}>
          <path d="M 322 600 Q 322 626 340 626 Q 358 626 358 600" fill="none" stroke="#9FB0C8" strokeWidth={9} />
          <path d="M 325 608 Q 325 622 340 622 Q 355 622 355 608" fill="none" stroke="#3DB8E6" strokeWidth={5} />
        </g>
      )}

      {/* ——— POZO / TANQUE ——— */}
      {/* pozo cavado: hueco irregular (antes de las paredes) */}
      <polygon points={`470,${GY} 724,${GY} 730,700 718,860 728,1000 600,1010 470,1000 480,860 466,700`} fill="#150F0B" />
      {/* agua sucia del pozo ciego */}
      <path d={ondaPath(480, 718, nivel + 40, 1000)} fill={C.sucia} opacity={1 - e.capas * 0.2} />
      {/* ondas verdes de olor */}
      {e.olor > 0.01 && (
        <g opacity={e.olor} fill="none" stroke={C.gas} strokeWidth={5} strokeLinecap="round">
          {[520, 596, 672].map((x, i) => <path key={x} d={`M ${x} ${GY - 10} q 14 -30 0 -60 t 0 -60 t 0 -60 t 0 -60`} transform={`translate(${Math.sin(t * 2 + i) * 6} ${-((t * 40 + i * 30) % 60)})`} opacity={0.65} />)}
        </g>
      )}

      {/* paredes de hormigón (se arman con facetas) */}
      <Mosaico facetas={f_muros} prog={e.muros} dispersion={420} semilla={13} borde="#FFFFFF" bordeOp={0.18} />

      {tapaOn && (
        <g opacity={clamp(e.muros * 3 - 1.2)}>
          {/* aire sobre el agua */}
          <rect x={c1a} y={GY + 30} width={c1b - c1a} height={nivel - (GY + 30)} fill="#0B0A12" />
          <rect x={c2a} y={GY + 30} width={c2b - c2a} height={nivel - (GY + 30)} fill="#0B0A12" />
          {/* cámara 1: capas */}
          <path d={ondaPath(c1a, c1b, nivel, G.FONDO)} fill={C.sucia} />
          <rect x={c1a} y={sNata} width={c1b - c1a} height={Math.max(0, sLodo - sNata)} fill={C.claro} opacity={0.9 * e.capas} />
          <rect x={c1a} y={sLodo} width={c1b - c1a} height={G.FONDO - sLodo} fill={C.lodo} opacity={e.capas} />
          <path d={ondaPath(c1a, c1b, nivel, nivel + 30)} fill={C.nata} opacity={e.capas} />
          {/* restos de lodo y nata como rombos */}
          {Array.from({ length: 9 }, (_, i) => <polygon key={i} points={poly(diam(c1a + 12 + i * 22, sLodo + 16 + (i % 3) * 18, 10, 7))} fill="#46301F" opacity={e.capas * 0.9} />)}
          {/* partículas que se hunden o suben */}
          {particulas.map((p, i) => <polygon key={i} points={poly(diam(p.x, p.y, 5.5, 4.2))} fill={p.pesada ? "#2E1E12" : "#F4E9B8"} opacity={0.9 * (1 - 0.4 * e.capas)} />)}
          {/* cámara 2 */}
          <path d={ondaPath(c2a, c2b, nivel, G.FONDO)} fill={C.claro} opacity={camaraDestino} />
          <rect x={c2a} y={G.FONDO - 24} width={c2b - c2a} height={24} fill={C.lodo} opacity={camaraDestino * 0.9} />
          {Array.from({ length: 14 }, (_, i) => { const y = nivel + 30 + ((t * 18 * (1 + (i % 3) * 0.3) + i * 31) % 250); const k = clamp(1 - e.cam2 * 0.9); return <polygon key={i} points={poly(diam(c2a + 16 + azar(i * 3.1) * (c2b - c2a - 32), y, 4.5, 3.4))} fill="#D9C79C" opacity={0.55 * k * camaraDestino} />; })}
        </g>
      )}
      {/* tubo en T de entrada y paso entre cámaras */}
      {tapaOn && (
        <g opacity={clamp(e.muros * 3 - 1.6)}>
          <polyline points="500,690 520,690 520,800" fill="none" stroke="#6B7684" strokeWidth={14} strokeLinejoin="round" />
          <polyline points="500,690 520,690 520,800" fill="none" stroke="#2A2F3A" strokeWidth={8} strokeLinejoin="round" />
          <rect x={700} y={776} width={24} height={34} fill="#0B0A12" />
          <Flujo pts={[[700, 792], [724, 792], [750, 792]]} t={t} color="#BFE6FF" op={e.cam2} n={4} v={0.5} r={3} />
        </g>
      )}
      {/* tapas de inspección */}
      {tapaOn && [590, 830].map((x) => <rect key={x} x={x - 22} y={GY - 8} width={44} height={10} rx={3} fill="#C9D3DE" stroke="#FFFFFF" strokeOpacity={0.5} opacity={e.muros} />)}

      {/* ——— TUBO DE VENTILACIÓN ——— */}
      {e.vent > 0.01 && (
        <g opacity={e.vent}>
          <rect x={G.VENT_X - 7} y={296} width={14} height={GY - 296} fill="#8E9AAB" />
          <rect x={G.VENT_X - 7} y={296} width={5} height={GY - 296} fill="#FFFFFF" opacity={0.3} />
          <polygon points={`${G.VENT_X - 16},296 ${G.VENT_X + 16},296 ${G.VENT_X},278`} fill="#6B7684" />
          {Array.from({ length: 6 }, (_, i) => { const k = ((t * 0.5 + i / 6) % 1); return <polygon key={i} points={poly(hexa(G.VENT_X + Math.sin(t * 3 + i) * 10 + k * 20, 268 - k * 120, 7 + 3 * k))} fill={C.gas} opacity={(1 - k) * 0.85 * e.bact} />; })}
        </g>
      )}
      {/* gas: burbujas hexagonales que suben desde el lodo */}
      {e.bact > 0.02 && tapaOn && (
        <g>
          {Array.from({ length: 12 }, (_, i) => { const k = ((t * 0.22 + i / 12) % 1); const x = c1a + 18 + azar(i * 4.3) * (c1b - c1a - 36) + Math.sin(t * 2 + i) * 4; const y = lerp(sLodo, nivel - 4, k); return <polygon key={i} points={poly(hexa(x, y, 4 + 5 * k))} fill={C.gas} opacity={0.8 * e.bact * (k < 0.95 ? 1 : 0)} stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={0.8} />; })}
        </g>
      )}
      {/* bacterias anaerobias en el lodo */}
      {e.bact > 0.02 && tapaOn && (
        <g>
          {Array.from({ length: 14 }, (_, i) => {
            const x = c1a + 22 + azar(i * 5.3) * (c1b - c1a - 44) + Math.sin(t * 0.8 + i) * 6;
            const y = sLodo + 10 + azar(i * 8.1) * (G.FONDO - sLodo - 24);
            const s = clamp(e.bact * 2 - azar(i) * 0.8) * 0.9;
            if (s <= 0.02) return null;
            return <Bicho key={i} x={x} y={y} s={s} t={t} color={[TC.cian, TC.magenta, TC.oro][i % 3]} fase={i * 1.3} come={1} />;
          })}
        </g>
      )}

      {/* ——— TUBO DE SALIDA, CAJA Y ZANJA DE GRAVA ——— */}
      <g opacity={clamp(e.cam2 * 2)}>
        <polyline points="900,790 1030,790 1030,830 1540,830" fill="none" stroke="#6B7684" strokeWidth={14} strokeLinejoin="round" />
        <polyline points="900,790 1030,790 1030,830 1540,830" fill="none" stroke="#2A2F3A" strokeWidth={8} strokeLinejoin="round" />
        <Flujo pts={[[900, 790], [1030, 790], [1030, 830], [1540, 830]]} t={t} color="#BFE6FF" op={e.cam2} n={14} v={0.12} r={3.4} />
      </g>
      {e.grava > 0.01 && (
        <g>
          <rect x={G.GRAVA[0]} y={800} width={G.GRAVA[1] - G.GRAVA[0]} height={140} fill="#1B1410" opacity={clamp(e.grava * 2)} />
          <Mosaico facetas={f_grava} prog={e.grava} dispersion={260} semilla={21} borde="#FFFFFF" bordeOp={0.2} />
          {/* arena bajo la grava */}
          <g opacity={clamp(e.grava * 2 - 0.8)}>
            {Array.from({ length: 24 }, (_, i) => <polygon key={i} points={poly(diam(G.GRAVA[0] + 14 + i * 22, 950 + (i % 2) * 9, 11, 8))} fill={["#D9BE88", "#C9A66B"][i % 2]} />)}
          </g>
          {/* el tubo perforado */}
          <rect x={1030} y={824} width={G.GRAVA[1] - 1030 - 20} height={13} fill="#C9D3DE" opacity={clamp(e.grava * 2 - 0.6)} />
          {Array.from({ length: 16 }, (_, i) => <circle key={i} cx={1062 + i * 30} cy={837} r={2.6} fill="#0B0A12" opacity={clamp(e.grava * 2 - 0.6)} />)}
        </g>
      )}
      {/* agua que atraviesa la grava, la arena y la tierra: de marrón a azul */}
      {e.filtra > 0.02 && (
        <g>
          {Array.from({ length: 30 }, (_, i) => {
            const x = 1062 + (i % 16) * 30 + (azar(i * 2.1) - 0.5) * 8;
            const k = ((t * 0.18 + i / 30 + azar(i) * 0.3) % 1);
            const y = 838 + k * (G.NAPA0 - 838);
            const color = mezclar("#9A6B35", "#6FD3FF", clamp((k - 0.04) * 3.2));
            return <circle key={i} cx={x} cy={y} r={3 + 1.4 * k} fill={color} opacity={e.filtra * (k > 0.97 ? 0 : 0.9)} />;
          })}
          {/* bacterias aerobias (verde lima) sobre las piedras */}
          {Array.from({ length: 9 }, (_, i) => <Bicho key={i} x={1090 + i * 54 + Math.sin(t + i) * 4} y={866 + (i % 3) * 22} s={0.62 * clamp(e.filtra * 2)} t={t} color={C.lima} fase={i * 1.9} come={0.6} />)}
        </g>
      )}
      {e.napa > 0.02 && <rect x={-400} y={G.NAPA0} width={3200} height={G.NAPA1 - G.NAPA0} fill="#3DB8E6" opacity={0.14 * e.napa} />}

      {/* ——— POZO DE AGUA ——— */}
      <g>
        <rect x={G.POZO_X - 24} y={GY} width={48} height={G.NAPA1 - 90 - GY} fill="#161E3A" opacity={0.85} />
        <rect x={G.POZO_X - 24} y={G.NAPA0 + 20} width={48} height={G.NAPA1 - 90 - G.NAPA0 - 20} fill={mezclar("#6E4A28", "#3DB8E6", e.limpio)} />
        <polygon points={`${G.POZO_X - 60},${GY - 4} ${G.POZO_X + 60},${GY - 4} ${G.POZO_X + 48},${GY - 56} ${G.POZO_X - 48},${GY - 56}`} fill="#9A5A3C" stroke="#FFFFFF" strokeOpacity={0.25} />
        <polygon points={`${G.POZO_X - 64},${GY - 56} ${G.POZO_X + 64},${GY - 56} ${G.POZO_X},${GY - 118}`} fill="#2C3E91" stroke={TC.oro} strokeOpacity={0.7} />
      </g>

      {/* ——— CAMIÓN QUE VACÍA LOS LODOS ——— */}
      {e.camion > 0.01 && (
        <g>
          <Mosaico facetas={f_camion} prog={e.camion} dispersion={380} semilla={31} />
          {[560, 790].map((x) => <g key={x} opacity={clamp(e.camion * 3 - 1.6)}><circle cx={x} cy={GY - 24} r={19} fill="#12141C" stroke="#9FB0C8" strokeWidth={4} /><circle cx={x} cy={GY - 24} r={6} fill="#9FB0C8" /></g>)}
          <g opacity={clamp(e.camion * 3 - 1.8)}>
            <polyline points={`630,${GY - 60} 600,${GY - 60} 596,${GY - 8} 596,780`} fill="none" stroke="#2A2F3A" strokeWidth={11} strokeLinejoin="round" />
            <Flujo pts={[[596, 900], [596, GY - 8], [600, GY - 60], [640, GY - 76]]} t={t} color="#7A5530" op={clamp(e.camion * 3 - 2)} n={14} v={0.35} r={4.5} />
          </g>
        </g>
      )}
      {/* ——— LETRERO ——— */}
      {e.lote > 0.01 && (
        <g opacity={clamp(e.lote * 2)} transform={`translate(0 ${(1 - e.lote) * -30})`}>
          <rect x={436} y={GY - 130} width={10} height={130} fill="#8E9AAB" />
          <polygon points={`396,${GY - 156} 486,${GY - 156} 486,${GY - 96} 396,${GY - 96}`} fill={TC.oro} stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={2} />
          <text x={441} y={GY - 118} textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight={900} fontSize={14} fill="#0A1030">SE VENDE</text>
          <text x={441} y={GY - 102} textAnchor="middle" fontFamily="Inter, Arial, sans-serif" fontWeight={700} fontSize={9} fill="#0A1030">TERRENO</text>
        </g>
      )}
    </g>
  );
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      {mundo}
    </svg>
  );
};

const hexa = (cx: number, cy: number, r: number): Pt[] => Array.from({ length: 6 }, (_, i) => [cx + r * Math.cos((i * Math.PI) / 3), cy + r * Math.sin((i * Math.PI) / 3)] as Pt);

/** Cielo: degradado azul marino a violeta con estrellas de rombo; va DETRÁS del mundo. */
export const Cielo: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { t } = useReloj();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#0A1030" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><linearGradient id="sepcielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#050818" /><stop offset="0.55" stopColor="#14185A" /><stop offset="1" stopColor="#2A1058" /></linearGradient></defs>
        <rect width={W} height={H} fill="url(#sepcielo)" />
        {Array.from({ length: 36 }, (_, i) => { const x = azar(i * 3.3) * W, y = azar(i * 5.9) * H; const g = 2 + azar(i * 2.2) * 4; return <polygon key={i} points={poly(diam(x, y, g, g * 1.4))} fill={i % 3 === 0 ? TC.magenta : i % 3 === 1 ? TC.cian : TC.oro1} opacity={0.2 + 0.25 * Math.sin(t * 1.5 + i)} />; })}
      </svg>
      {children}
      <div style={{ position: "absolute", inset: 0, background: "#02030C", opacity: clamp(1 - t / 0.25) * 0.85, pointerEvents: "none" }} />
    </div>
  );
};

export { easeOut, clamp };
