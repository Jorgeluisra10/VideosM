/**
 * «Los dueños del cerebro» (SINAPSIS · astrocitos v2) · escenas 2/2
 *   ein-diamond   1985: placa de Einstein y campo de microscopio donde se cuentan neuronas y glía (esquema del método, no los datos); el «¿qué encontró?»
 *   ein-hallazgo  dos campos (11 controles / Einstein, A39 izquierda) y la barra «glía por neurona»: más, con p < 0,05 en 1 de 4 áreas
 *   ein-cautela   una pista, no una prueba: 1 cerebro, 11 controles, 1 de 4 áreas, glía ≠ solo astrocitos
 *   ein-gfap      campo de microscopio a 40x con GFAP: el zoom revela un cielo nocturno de estrellas gliales (cierre)
 */
import React from "react";
import { EIN, mulberry32, TEIN } from "../../anim/piezas";
import { useUid } from "../../estudio/util";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, spr, useReloj } from "../comun";
import { Estudio, FONT, Frases, MONOF, RE } from "./real-kit";
import { Fuente } from "./real1";
import { Chip } from "./med1";
import { AC } from "./astro-kit";
import { CampoMicroscopio, EstrellaGFAP, HE, TejidoHE, rayosGFAP } from "./ein-kit";

type P = { e: EscenaViralGuardada };

type Celula = { x: number; y: number; neurona: boolean; rot: number };
/** Células de un campo (determinista): `nNeuro` neuronas grandes y `nGlia` células gliales pequeñas, dentro de un círculo de radio `rad`. */
function celulasDeCampo(semilla: number, nNeuro: number, nGlia: number, rad: number): Celula[] {
  const r = mulberry32(semilla);
  const l: Celula[] = [];
  const poner = (neurona: boolean, sep: number): void => {
    for (let intento = 0; intento < 200; intento++) {
      const ang = r() * Math.PI * 2, rr = Math.sqrt(r()) * rad;
      const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr;
      if (l.every((c) => Math.hypot(c.x - x, c.y - y) > sep)) { l.push({ x, y, neurona, rot: r() * 360 }); return; }
    }
  };
  for (let i = 0; i < nNeuro; i++) poner(true, 62);
  for (let i = 0; i < nGlia; i++) poner(false, 40);
  return l;
}

const NeuronaHE: React.FC<{ x: number; y: number; rot: number; s?: number }> = ({ x, y, rot, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -34 0 C -30 -22 -10 -28 6 -24 C 22 -30 36 -12 34 4 C 36 22 14 30 -2 26 C -20 30 -36 18 -34 0 Z" fill="#F5CFE0" stroke="#B35C8A" strokeWidth={2.5} />
    <path d="M 34 4 L 62 -8 M -34 0 L -58 10 M 6 -24 L 14 -50" stroke="#B35C8A" strokeWidth={3} strokeLinecap="round" />
    <circle cx={2} cy={0} r={11} fill="#6B4BA3" stroke="#3B2765" strokeWidth={2} /><circle cx={4} cy={-1} r={4} fill="#2A1B45" />
  </g>
);
const GliaHE: React.FC<{ x: number; y: number; rot: number; s?: number }> = ({ x, y, rot, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {Array.from({ length: 6 }, (_, k) => <line key={k} x1={0} y1={0} x2={Math.cos(k * 1.047) * 20} y2={Math.sin(k * 1.047) * 20} stroke="#7A4F00" strokeWidth={3} strokeLinecap="round" />)}
    <circle r={9} fill={AC.oro} stroke="#7A4F00" strokeWidth={2.5} />
  </g>
);

/* ───────────── ein-diamond ───────────── */

export const EinDiamond: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const D = TEIN.diamond;
  const placa = spr(f, a(D.placa), { damping: 13, stiffness: 120, mass: 0.8 });
  const campo = spr(f, a(D.campo), { damping: 14, stiffness: 120, mass: 0.9 });
  const pregunta = spr(f, a(D.pregunta), { damping: 9, stiffness: 200, mass: 0.7 });
  const cel = React.useMemo(() => celulasDeCampo(21, 9, 14, 255), []);
  const orden = (i: number): number => a(D.cuenta + (i / cel.length) * D.cuentaDur);
  const hechas = cel.filter((_, i) => t >= orden(i));
  const nN = hechas.filter((c) => c.neurona).length, nG = hechas.length - nN;
  const CX = 540, CY = 1010, R = 320;
  return (
    <Estudio piso={1600} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* la placa de vidrio */}
        <g transform={`translate(${830 + (1 - placa) * 300} 612) rotate(-6)`} opacity={clamp(placa * 1.6)}>
          <rect x={-150} y={-44} width={300} height={88} rx={8} fill="#CFE6F7" fillOpacity={0.28} stroke="#E9F4FF" strokeOpacity={0.8} strokeWidth={3} />
          <rect x={-146} y={-40} width={110} height={80} rx={4} fill="#F6F1E3" />
          <text x={-91} y={-12} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={15} fill="#6B6552">EINSTEIN</text>
          <text x={-91} y={10} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={15} fill="#142033">A39 izq.</text>
          <rect x={-18} y={-34} width={154} height={68} rx={6} fill={HE.fondo} opacity={0.85} />
          {[[0, -6], [40, 8], [78, -12], [110, 10]].map(([x, y], k) => <circle key={k} cx={x + 8} cy={y} r={6} fill={HE.nucleo} opacity={0.7} />)}
        </g>
        <g opacity={clamp(campo * 1.6)} transform={`translate(0 ${(1 - campo) * 70})`}>
          <CampoMicroscopio cx={CX} cy={CY} r={R} etiqueta="corte · corteza" escala="20 µm" colorTexto={HE.tinta} cruz>
            <g transform={`translate(${CX} ${CY})`}>
              <TejidoHE ancho={700} alto={700} n={120} semilla={4} deriva={-4 * t} />
              {cel.map((c, i) => (c.neurona ? <NeuronaHE key={i} x={c.x - 4 * t} y={c.y} rot={c.rot} s={1.05} /> : <GliaHE key={i} x={c.x - 4 * t} y={c.y} rot={c.rot} />))}
              {cel.map((c, i) => {
                const p = clamp((t - orden(i)) / 0.25);
                if (p <= 0) return null;
                return <circle key={`m${i}`} cx={c.x - 4 * t} cy={c.y} r={(c.neurona ? 52 : 28) * (1.4 - 0.4 * p)} fill="none" stroke={c.neurona ? "#1D4ED8" : "#B45309"} strokeWidth={4.5} opacity={p} />;
              })}
            </g>
          </CampoMicroscopio>
          {pregunta > 0.02 && (
            <g transform={`translate(${CX} ${CY}) scale(${0.4 + 0.6 * clamp(pregunta)})`} opacity={clamp(pregunta * 1.4)}>
              <circle r={150} fill="#0B1828" opacity={0.7} />
              <circle r={150} fill="none" stroke={AC.oro} strokeWidth={8} />
              <text y={78} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={230} fill={AC.oro}>?</text>
            </g>
          )}
        </g>
      </svg>
      <div data-texto="dia-cuenta-n" style={{ position: "absolute", left: 120, top: 1398, fontFamily: MONOF, fontWeight: 700, fontSize: 30, color: AC.azulClaro, opacity: clamp((t - a(D.cuenta)) / 0.4) }}>● neuronas {nN}</div>
      <div data-texto="dia-cuenta-g" style={{ position: "absolute", left: 640, top: 1398, fontFamily: MONOF, fontWeight: 700, fontSize: 30, color: AC.oroClaro, opacity: clamp((t - a(D.cuenta)) / 0.4) }}>★ glía {nG}</div>
      <Frases frases={[{ t: 0.2, texto: "1985", color: RE.oro, px: 124 }, { t: 1.1, texto: "Marian Diamond", px: 100 }, { t: 2.9, texto: "Einstein contra\n11 hombres", px: 88 }, { t: 4.3, texto: "¿qué encontró?", color: RE.oro, px: 100 }]} y={385} id="ein-diamond-t" />
      <Fuente texto="Esquema del método de conteo (no son los datos del estudio) · Diamond et al., Exp Neurol 1985;88:198–204" y={1462} delay={3.6} />
    </Estudio>
  );
};

/* ───────────── ein-hallazgo ───────────── */

export const EinHallazgo: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const uid = useUid();
  const Hh = TEIN.hallazgo;
  const campos = spr(f, a(Hh.campos), { damping: 13, stiffness: 120, mass: 0.8 });
  const barra = easeOut((t - a(Hh.barra)) / a(0.8));
  const p = spr(f, a(Hh.p), { damping: 9, stiffness: 200, mass: 0.7 });
  const R = 205;
  const ctr = React.useMemo(() => celulasDeCampo(5, 7, 5, 165), []);
  const ein = React.useMemo(() => celulasDeCampo(5, 7, 13, 165), []);
  const vis = (i: number): number => clamp((t - a(Hh.esquema + i * 0.07)) / 0.3);
  const campo = (cx: number, lista: Celula[], etq: string, key: string) => (
    <CampoMicroscopio cx={cx} cy={920} r={R} etiqueta={etq} colorTexto={HE.tinta}>
      <g transform={`translate(${cx} 920)`}>
        <TejidoHE ancho={460} alto={460} n={60} semilla={key === "c" ? 7 : 8} />
        {lista.map((c, i) => <g key={i} opacity={vis(i)}>{c.neurona ? <NeuronaHE x={c.x} y={c.y} rot={c.rot} s={0.72} /> : <GliaHE x={c.x} y={c.y} rot={c.rot} s={0.9} />}</g>)}
      </g>
    </CampoMicroscopio>
  );
  return (
    <Estudio piso={1600} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><linearGradient id={`${uid}ba`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={AC.oroOscuro} /><stop offset="1" stopColor={AC.oro} /></linearGradient></defs>
        <g opacity={clamp(campos * 1.6)} transform={`translate(0 ${(1 - campos) * 60})`}>
          {campo(300, ctr, "controles", "c")}
          {campo(780, ein, "Einstein", "e")}
        </g>
        {/* barra «glía por neurona» (esquema) */}
        <g opacity={clamp(barra * 3)}>
          <text x={120} y={1272} fontFamily={MONOF} fontWeight={700} fontSize={24} fill={RE.hielo}>glía por neurona</text>
          <rect x={120} y={1288} width={840} height={26} rx={13} fill="#10263B" />
          <rect x={120} y={1288} width={330 * barra} height={26} rx={13} fill="#6F8BA8" />
          <text x={130} y={1308} fontFamily={MONOF} fontWeight={700} fontSize={18} fill="#0B1828" opacity={barra}>controles</text>
          <rect x={120} y={1326} width={840} height={26} rx={13} fill="#10263B" />
          <rect x={120} y={1326} width={560 * barra} height={26} rx={13} fill={`url(#${uid}ba)`} />
          <text x={130} y={1346} fontFamily={MONOF} fontWeight={700} fontSize={18} fill="#0B1828" opacity={barra}>Einstein · A39 izq.</text>
        </g>
      </svg>
      <div data-texto="hall-p" style={{ position: "absolute", left: 120, width: 840, top: 1390, textAlign: "center", opacity: clamp(p * 1.3), transform: `scale(${0.85 + 0.15 * clamp(p)})` }}>
        <span style={{ display: "inline-block", padding: "8px 26px", borderRadius: 999, border: `3px solid ${AC.oro}`, background: "rgba(8,18,31,0.72)", fontFamily: MONOF, fontWeight: 800, fontSize: 30, color: AC.oroClaro }}>p &lt; 0,05 · solo en {EIN.areasSignificativas} de {EIN.areasEstudiadas} áreas</span>
      </div>
      <Frases frases={[{ t: 0.2, texto: "corteza parietal\nizquierda", px: 84 }, { t: 2.3, texto: "más glía\npor neurona", color: RE.oro, px: 96 }]} y={385} id="ein-hallazgo-t" />
      <Fuente texto="Diamond et al., Exp Neurol 1985 · esquema ilustrativo (no son los recuentos reales) · la «glía» no distingue solo astrocitos" y={1480} delay={3.3} />
    </Estudio>
  );
};

/* ───────────── ein-cautela ───────────── */

const FICHAS = [
  { n: "1", t: "un solo cerebro" },
  { n: "11", t: "controles (hombres)" },
  { n: "1 de 4", t: "áreas con diferencia" },
  { n: "≠", t: "glía no es solo astrocitos" },
] as const;

export const EinCautela: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const C = TEIN.cautela;
  const fin = spr(f, a(C.final), { damping: 10, stiffness: 180, mass: 0.7 });
  return (
    <Estudio piso={1600} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {FICHAS.map((fi, i) => {
          const s = spr(f, a(C.ficha(i)), { damping: 11, stiffness: 190, mass: 0.7 });
          const y = 580 + i * 160;
          return (
            <g key={i} transform={`translate(${(1 - s) * 140} 0)`} opacity={clamp(s * 1.6)}>
              <rect x={120} y={y} width={840} height={128} rx={26} fill="#0C1A2A" stroke={RE.hielo} strokeOpacity={0.6} strokeWidth={3} />
              <text x={190} y={y + 84} fontFamily={FONT} fontWeight={900} fontSize={fi.n.length > 2 ? 52 : 70} fill={AC.oro}>{fi.n}</text>
              <text x={fi.n.length > 2 ? 380 : 290} y={y + 80} fontFamily={FONT} fontWeight={800} fontSize={38} fill={RE.blanco}>{fi.t}</text>
            </g>
          );
        })}
      </svg>
      {fin > 0.02 && (
        <div data-texto="cau-final" style={{ position: "absolute", left: 100, width: 880, top: 1290, textAlign: "center", opacity: clamp(fin * 1.4), transform: `scale(${0.8 + 0.2 * clamp(fin)})` }}>
          <span style={{ display: "inline-block", padding: "10px 34px", borderRadius: 22, background: AC.oro, color: "#0B1828", fontFamily: FONT, fontWeight: 900, fontSize: 70, lineHeight: 1.08 }}>UNA PISTA,<br />NO UNA PRUEBA</span>
        </div>
      )}
      <Frases frases={[{ t: 0.2, texto: "pero ojo", color: RE.hielo, px: 112 }, { t: 1.4, texto: "no es una prueba", px: 96 }]} y={385} id="ein-cautela-t" />
    </Estudio>
  );
};

/* ───────────── ein-gfap ───────────── */

const N_EST = 118;
const CACHE_EST = new Map<number, { x: number; y: number; d: string; s: number; ph: number; luz: number }[]>();
function estrellasDelCampo(rad: number) {
  const g = CACHE_EST.get(rad);
  if (g) return g;
  const r = mulberry32(31);
  const l = Array.from({ length: N_EST }, (_, i) => {
    const u = (i + 0.5) / N_EST, ang = i * 2.39996 + r() * 0.5, rr = Math.sqrt(u) * rad * (0.92 + r() * 0.1);
    return { x: Math.cos(ang) * rr, y: Math.sin(ang) * rr, d: rayosGFAP(100 + i, 6 + Math.floor(r() * 4), 34 + r() * 26), s: 0.8 + r() * 0.6, ph: r() * 6.28, luz: 0.55 + r() * 0.45 };
  });
  CACHE_EST.set(rad, l);
  return l;
}
const NUCLEOS = (() => { const r = mulberry32(77); return Array.from({ length: 90 }, () => { const a = r() * 6.283, rr = Math.sqrt(r()) * 430; return { x: Math.cos(a) * rr, y: Math.sin(a) * rr, rad: 3 + r() * 3, o: 0.25 + r() * 0.4 }; }); })();

export const EinGfap: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const G = TEIN.gfap;
  const entra = spr(f, a(G.campo), { damping: 14, stiffness: 120, mass: 0.9 });
  const z = 3.4 - 2.4 * easeOut((t - a(G.zoom)) / a(G.zoomDur));
  const CX = 540, CY = 990, R = 440;
  const est = estrellasDelCampo(R);
  const hero = React.useMemo(() => rayosGFAP(5, 12, 118), []);
  const fu = clamp((t - a(G.fugaz)) / a(0.9));
  return (
    <Estudio piso={1600} resplandor={0.35}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(entra * 1.6)}>
          <CampoMicroscopio cx={CX} cy={CY} r={R} fondo={HE.noche} etiqueta="GFAP · 40x" escala="50 µm" cruz={false}>
            <g transform={`translate(${CX} ${CY}) scale(${z})`}>
              {NUCLEOS.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r={n.rad} fill={HE.dapi} opacity={n.o * (0.7 + 0.3 * Math.sin(t * 1.5 + i))} />)}
              {est.map((e, i) => <EstrellaGFAP key={i} x={e.x} y={e.y} d={e.d} s={e.s} luz={e.luz * (0.65 + 0.35 * Math.sin(t * 2 + e.ph))} />)}
              <EstrellaGFAP x={0} y={0} d={hero} s={1} soma={11} luz={1} />
            </g>
            {fu > 0 && fu < 1 && (
              <g opacity={Math.sin(Math.PI * fu)}>
                <line x1={CX + 330 - 520 * fu} y1={CY - 380 + 460 * fu} x2={CX + 330 - 520 * fu + 150} y2={CY - 380 + 460 * fu - 175} stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.9} />
                <line x1={CX + 330 - 520 * fu} y1={CY - 380 + 460 * fu} x2={CX + 330 - 520 * fu + 150} y2={CY - 380 + 460 * fu - 175} stroke={AC.oroClaro} strokeWidth={16} strokeLinecap="round" opacity={0.3} />
              </g>
            )}
          </CampoMicroscopio>
        </g>
      </svg>
      <Chip texto="inmunotinción GFAP" x={W / 2} y={1470} color={AC.oroClaro} ancho={470} id="gfap-chip" opacidad={clamp((t - a(G.rotulo)) / 0.4)} />
      <Frases frases={[{ t: 0.2, texto: "teñidos con GFAP", px: 96 }, { t: 2.1, texto: "un cielo nocturno", color: RE.hielo, px: 100 }, { t: 4.0, texto: "tu cerebro está\nlleno de estrellas", color: RE.oro, px: 90 }]} y={385} id="ein-gfap-t" />
      <Fuente texto="Esquema de una inmunotinción para GFAP (color falso): marca el citoesqueleto, no toda la célula" y={1508} delay={4.2} />
    </Estudio>
  );
};
