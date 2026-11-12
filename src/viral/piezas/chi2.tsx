/**
 * «La ciudad que subió con gatos» (IMNOBA · Chicago · steampunk) · escenas 2/2
 *   chi-gato      el gato mecánico: un tornillo es una rampa enrollada
 *   chi-ejercito  una cuadra sobre miles de gatos y cientos de obreros que giran a una señal
 *   chi-te        el hotel sigue abierto mientras sube: té, un mozo y un cliente que sale al vacío
 *   chi-calle     calles en desnivel: edificios arriba, otros abajo, escaleras y un tropiezo
 *   chi-nivel     calles firmes a nivel nuevo y cloacas que drenan hacia el río
 *   chi-fuego     giro: el gran incendio de 1871… «continuará»
 */
import React from "react";
import { CHI, TCH } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { azar } from "../../lib/anim";
import { FONT, Frases } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { CH, Caballero, Edificio, FondoVapor, Gato, Globo, Humo, Llamas, Obrero, Onoma, Tubo, Viga, escalones, sacudidaPasos, type VentanaDef } from "./chi-kit";

type P = { e: EscenaViralGuardada };
const rp = (t: number, a: (x: number) => number, ini: number, dur: number): number => clamp((t - a(ini)) / a(dur));
const suave = (k: number): number => { const x = clamp(k); return x * x * (3 - 2 * x); };

/* ───────────── chi-gato ───────────── */

export const ChiGato: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TCH.gato;
  const s = spr(f, a(T.gato), { damping: 13, stiffness: 110, mass: 0.9 });
  const kG = clamp((t - a(T.giro)) / a(3.4));
  const ext = 90 * easeInOut(kG);
  const giro = Math.max(0, t - a(T.giro)) * 270;
  const G = 1400;
  const sc = 2.5;
  const topY = G - sc * (98 + ext);
  const kR = rp(t, a, T.rampa, 0.6);
  const u = easeInOut((t - a(T.carga)) / a(2.6));
  const rx0 = 650, ry0 = 1400, rx1 = 990, ry1 = 1180;
  const bx = lerp(rx0 + 40, rx1 - 40, u), by = lerp(ry0 - 38, ry1 - 38, u);
  const ang = (Math.atan2(ry1 - ry0, rx1 - rx0) * 180) / Math.PI;
  return (
    <FondoVapor tono="cafe">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <rect x={0} y={G} width={W} height={H - G} fill="#2B1D10" />
        <line x1={0} y1={G} x2={W} y2={G} stroke={CH.bronce} strokeWidth={4} />
        <g opacity={clamp(s * 2)} transform={`translate(0 ${(1 - s) * 80})`}>
          <Gato x={340} y={G} s={sc} ext={ext} giro={giro} />
          {/* el peso que sube */}
          <g transform={`translate(340 ${topY - 18})`}>
            <rect x={-130} y={-96} width={260} height={96} rx={8} fill="#7B7364" stroke="#2A241B" strokeWidth={5} />
            {Array.from({ length: 5 }, (_, i) => <line key={i} x1={-130 + i * 52} y1={-96} x2={-130 + i * 52} y2={0} stroke="#2A241B" strokeWidth={2} opacity={0.5} />)}
            <text x={0} y={-30} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={46} fill={CH.crema} data-texto="chi-peso">¡PESO!</text>
          </g>
          <Obrero x={110} y={G + 90} s={1.8} giro={giro} esfuerzo={1} />
        </g>
        {/* tornillo = rampa enrollada */}
        <g opacity={kR}>
          <text x={570} y={1260} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={90} fill={CH.laton} data-texto="chi-igual">=</text>
          <polygon points={`${rx0},${ry0} ${rx1},${ry0} ${rx1},${ry1}`} fill="#8A6234" stroke="#3B2512" strokeWidth={5} />
          <line x1={rx0} y1={ry0} x2={rx1} y2={ry1} stroke={CH.laton} strokeWidth={6} />
          <g transform={`translate(${bx} ${by}) rotate(${ang})`}>
            <rect x={-40} y={-38} width={80} height={38} rx={5} fill="#7B7364" stroke="#2A241B" strokeWidth={4} />
          </g>
          <text x={820} y={1456} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={38} fill={CH.crema} data-texto="chi-rampa">una rampa</text>
        </g>
      </svg>
      <Frases frases={[{ t: 0.02, texto: "el gato mecánico", px: 88 }, { t: T.f2, texto: "un tornillo es una rampa enrollada", color: CH.laton, px: 62 }]} y={352} ancho={860} />
      <Chip texto="muchas vueltas = poco avance" x={W / 2} y={1520} color={CH.hielo} id="chi-vueltas" ancho={700} opacidad={rp(t, a, T.chip, 0.4)} />
      <Chip texto="…y muchísima fuerza" x={W / 2} y={1572} color={CH.laton} id="chi-fuerza" ancho={560} opacidad={rp(t, a, T.chip2, 0.4)} />
      <Fuente texto="Gato de tornillo: la rosca convierte muchas vueltas en poco avance vertical y por eso multiplica la fuerza · esquema" delay={1.0} y={1632} />
    </FondoVapor>
  );
};

/* ───────────── chi-ejercito ───────────── */

const CUADRA: { pisos: number; ladrillo: string; ventanas: VentanaDef[] }[] = [
  { pisos: 3, ladrillo: CH.ladrillo, ventanas: [{}, {}, {}, { luz: true, quien: "dama" }, { luz: true }, { luz: true, quien: "caballero" }, { luz: true }, { luz: true, quien: "mozo" }, { luz: true }] },
  { pisos: 4, ladrillo: "#8B5A3A", ventanas: [{}, {}, {}, { luz: true }, { luz: true, quien: "caballero" }, { luz: true }, { luz: true, quien: "dama" }, { luz: true }, { luz: true }, { luz: true }, { luz: true, quien: "gato" }, { luz: true }] },
  { pisos: 3, ladrillo: "#A9432C", ventanas: [{}, {}, {}, { luz: true }, { luz: true, quien: "dama" }, { luz: true }, { luz: true, quien: "caballero" }, { luz: true }, { luz: true }] },
  { pisos: 3, ladrillo: "#7E4A33", ventanas: [{}, {}, {}, { luz: true, quien: "mozo" }, { luz: true }, { luz: true, quien: "dama" }, { luz: true }, { luz: true }, { luz: true, quien: "caballero" }] },
];
const TEXTOS_SILBATO = ["¡Un cuarto de vuelta!", "¡Otro!", "¡Otro más!", "¡Y otro!"];

export const ChiEjercito: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TCH.ejercito;
  const sB = spr(f, a(T.bloque), { damping: 13, stiffness: 110, mass: 0.9 });
  const sG = spr(f, a(T.gatos), { damping: 12, stiffness: 130, mass: 0.7 });
  const sO = spr(f, a(T.obreros), { damping: 12, stiffness: 130, mass: 0.7 });
  const esc = escalones(t, a(T.silbato), a(T.paso), 4, a(0.5));
  const alza = esc * 90;
  const sh = sacudidaPasos(t, a(T.silbato), a(T.paso), 4, 0.28, 0.8);
  const G = 1330;
  const base = G - 116 * 0.55 - alza - 8;
  const N = 14;
  const kDato = easeOut((t - a(T.dato)) / a(2.2));
  const gatoExt = alza / 0.55;
  const silbatoK = (k: number) => rp(t, a, T.silbato + k * T.paso, 0.8);
  const gk = Array.from({ length: 4 }, (_, k) => silbatoK(k));
  const kIdx = TEXTOS_SILBATO.findIndex((_, k) => t >= a(T.silbato + k * T.paso) && t < a(T.silbato + k * T.paso) + 1.0);
  return (
    <FondoVapor tono="cafe">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${sh.dx} ${sh.dy})`}>
          <rect x={0} y={G} width={W} height={H - G} fill="#2B1D10" />
          <line x1={0} y1={G} x2={W} y2={G} stroke={CH.bronce} strokeWidth={4} />
          {/* fila de gatos */}
          <g opacity={clamp(sG * 2)}>
            {Array.from({ length: N }, (_, i) => <Gato key={i} x={96 + i * 68} y={G} s={0.55} ext={gatoExt} giro={esc * 360 * 2 + i * 20} manivela={false} />)}
          </g>
          {/* la cuadra */}
          <g opacity={clamp(sB * 2)} transform={`translate(0 ${(1 - sB) * 80})`}>
            <Viga x={485} y={G - 116 * 0.55 + 18 - alza - 8 + 0} w={900} />
            {CUADRA.map((c, i) => <g key={i} transform={`translate(${150 + i * 222} ${base}) scale(0.5)`}><Edificio x={0} y={0} w={440} pisos={c.pisos} pisoH={150} ladrillo={c.ladrillo} ventanas={c.ventanas} t={t} sinPuerta={false} /></g>)}
            {/* un gato (el animal) mirando desde la azotea */}
            <g transform={`translate(${150 + 3 * 222 + 40} ${base - (3 * 150 + 36 + 18) * 0.5 - 4})`}>
              <ellipse cx={0} cy={-10} rx={20} ry={13} fill="#C68642" /><circle cx={-13} cy={-22} r={10} fill="#C68642" /><polygon points="-21,-28 -18,-39 -12,-29" fill="#C68642" /><polygon points="-12,-29 -8,-38 -4,-27" fill="#C68642" />
              <circle cx={-16} cy={-23} r={2} fill="#1A1008" />
              <path d={`M 16 -8 q 16 ${-6 + Math.sin(t * 3) * 6} 10 -24`} stroke="#C68642" strokeWidth={5} fill="none" strokeLinecap="round" />
            </g>
          </g>
          {/* obreros */}
          <g opacity={clamp(sO * 2)} transform={`translate(0 ${(1 - sO) * 60})`}>
            {Array.from({ length: N }, (_, i) => <Obrero key={i} x={96 + i * 68} y={G + 90} s={0.55} giro={esc * 360 * 2 + i * 20} esfuerzo={Math.sin(t * 6 + i) > 0 ? 1 : 0.4} camisa={["#7B8F9C", "#9C7B6A", "#6A8F7B"][i % 3]} />)}
          </g>
          {/* capataz con silbato */}
          <Caballero x={160} y={G + 210} s={0.95} fase={t * 2} pose="susto" abrigo="#2B4A6B" />
          {gk.map((k, i) => k > 0 && k < 1 && <Onoma key={i} x={330 + (i % 2) * 40} y={G + 160} texto="¡FIUUU!" k={Math.min(1, k * 2)} color={CH.laton} px={54} rot={-6 + (i % 2) * 12} id={`chi-fiu${i}`} />)}
        </g>
      </svg>
      <Dato valor={CHI.lakeStreet.gatos * kDato} x={W / 2} y={560} px={104} digitos={4} color={CH.laton} prefijo="≈ " sufijo=" gatos" id="chi-gatos" opacidad={clamp(kDato * 4)} />
      <Chip texto={`≈ ${CHI.lakeStreet.hombres} hombres a una señal`} x={W / 2} y={720} color={CH.hielo} id="chi-hombres" ancho={720} opacidad={rp(t, a, T.chip - 3.2, 0.4)} />
      <Frases frases={[{ t: 0.02, texto: "una cuadra entera", px: 84 }, { t: T.f2, texto: "sobre miles de gatos", color: CH.laton, px: 78 }, { t: T.f3, texto: "milímetro a milímetro", color: CH.crema, px: 78 }]} y={352} ancho={860} />
      {kIdx >= 0 && <div data-texto="chi-capataz" style={{ position: "absolute", left: 250, top: 1565, width: 700, fontFamily: FONT, fontWeight: 900, fontSize: 40, color: CH.crema, opacity: 0.95 }}>— {TEXTOS_SILBATO[kIdx]}</div>}
      <Fuente texto="Lake Street, 1860: las fuentes citan unos 600 hombres y unos 6.000 gatos (las cifras varían de un relato a otro) · ilustración" delay={1.4} y={1632} />
    </FondoVapor>
  );
};

/* ───────────── chi-te ───────────── */

const HOTEL_TE: VentanaDef[] = [
  { quien: "nadie", luz: true }, {}, { quien: "caballero", luz: true },
  { quien: "dama", luz: true }, { quien: "mozo", luz: true }, { quien: "caballero", luz: true },
  { quien: "dama", luz: true }, { quien: "dama", luz: true }, { quien: "gato", luz: true },
];

export const ChiTe: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TCH.te;
  const sH = spr(f, a(T.hotel), { damping: 13, stiffness: 110, mass: 0.9 });
  const sube = escalones(t, a(T.sube0), a(T.paso), 5, a(0.4));
  const alza = sube * 130;
  const sh = sacudidaPasos(t, a(T.sube0), a(T.paso), 5, 0.3);
  const G = 1400;
  const base = G - 116 - alza;
  const g1 = rp(t, a, T.globo1, 0.4) * (1 - rp(t, a, T.globo1 + 1.4, 0.3));
  const g2 = rp(t, a, T.globo2, 0.4) * (1 - rp(t, a, T.globo2 + 1.4, 0.3));
  // el cliente que sale por la puerta
  const sal = easeInOut((t - a(T.puerta)) / a(0.6));
  const caida = Math.pow(clamp((t - a(T.plof) + 0.45) / 0.45), 2);
  const doorY = base - 14;
  const cx = lerp(540, 650, sal) + 12 * caida;
  const cy = lerp(doorY, G + 40, caida);
  const plof = rp(t, a, T.plof, 0.7);
  const visible = t >= a(T.puerta);
  return (
    <FondoVapor tono="cafe">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${sh.dx} ${sh.dy})`}>
          <rect x={0} y={G} width={W} height={H - G} fill="#2B1D10" />
          <line x1={0} y1={G} x2={W} y2={G} stroke={CH.bronce} strokeWidth={4} />
          {[-240, -120, 0, 120, 240].map((dx) => <Gato key={dx} x={540 + dx} y={G} ext={alza} giro={sube * 1800 + dx} />)}
          <g transform={`translate(0 ${(1 - sH) * 90})`} opacity={clamp(sH * 2)}>
            <Viga x={540} y={G - 98 - alza} w={720} />
            <Edificio x={540} y={base} w={620} pisos={3} pisoH={170} vs={1.5} rotulo="GRAN HOTEL" abierto ventanas={HOTEL_TE} t={t} />
          </g>
          {g1 > 0.02 && <Globo x={560} y={base - 294 - 70} texto="Enseguida le traigo más té." ancho={340} k={g1} lado="izq" id="chi-globo1" />}
          {g2 > 0.02 && <Globo x={540} y={base - 464 - 70} texto="¿Este hotel siempre fue tan alto?" ancho={380} k={g2} lado="der" id="chi-globo2" />}
          {visible && (
            <g transform={`rotate(${caida * 160} ${cx} ${cy - 60})`}>
              <Caballero x={cx} y={cy} s={0.85} fase={t * 7} pose={caida > 0.02 ? "susto" : sal < 0.99 ? "camina" : "bolsa"} abrigo="#5C3B2A" />
            </g>
          )}
          <Onoma x={700} y={G - 60} texto="¡PLOF!" k={plof} color={CH.laton} px={80} rot={-8} id="chi-plof" />
        </g>
      </svg>
      <Frases frases={[{ t: 0.02, texto: "nadie se mudó", px: 90 }, { t: T.f2, texto: "el té seguía servido", color: CH.laton, px: 78 }, { t: T.puerta - 0.2, texto: "¡cuidado con el escalón!", color: "#FF9A7A", px: 74 }]} y={352} ancho={860} />
      <Chip texto="hotel abierto durante la subida" x={W / 2} y={1556} color={CH.hielo} id="chi-abierto" ancho={700} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Se cuenta que varios edificios, hoteles incluidos, siguieron funcionando mientras los levantaban; la escena es una dramatización" delay={1.2} />
    </FondoVapor>
  );
};

/* ───────────── chi-calle ───────────── */

const ALT = [0, 110, 210, 80, 160];
const BX = [130, 330, 530, 730, 930];
const CGY = 1400;
/** Altura (y) de la acera en la posición x: cada edificio tiene su losa y los escalones se suavizan entre losas. */
const yAcera = (x: number): number => {
  const i = Math.max(0, Math.min(4, Math.round((x - 130) / 200)));
  const borde = (i < 4 ? BX[i] + 100 : 9999), bordeL = (i > 0 ? BX[i] - 100 : -9999);
  let y = CGY - ALT[i];
  if (i < 4 && x > borde - 22) y = lerp(CGY - ALT[i], CGY - ALT[i + 1], suave((x - (borde - 22)) / 44));
  if (i > 0 && x < bordeL + 22) y = lerp(CGY - ALT[i - 1], CGY - ALT[i], suave((x - (bordeL - 22)) / 44));
  return y;
};

export const ChiCalle: React.FC<P> = () => {
  const { f, t, a, dur } = useReloj();
  const T = TCH.calle;
  const sC = spr(f, a(T.calle), { damping: 13, stiffness: 110, mass: 0.9 });
  const camino = (u: number, ini: number, fin: number) => lerp(ini, fin, ((u % 1) + 1) % 1);
  const w1 = camino(t / (dur * 0.9), 60, 1000), w2 = camino(t / (dur * 1.1) + 0.45, 1000, 60), w3 = camino(t / (dur * 1.4) + 0.2, 60, 1000);
  const kCaida = clamp((t - a(T.caida)) / 0.7);
  const vx = 585 + kCaida * 55, vy = lerp(CGY - ALT[2] - 0, CGY - ALT[3], easeOut(kCaida * 1.4)) + 0;
  const hatY = -kCaida * 140 + 200 * kCaida * kCaida;
  const caidaOk = t >= a(T.caida);
  const onoma = rp(t, a, T.caida + 0.5, 0.6);
  return (
    <FondoVapor tono="cafe">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(sC * 2)} transform={`translate(0 ${(1 - sC) * 70})`}>
          <rect x={0} y={CGY} width={W} height={H - CGY} fill="#2B1D10" />
          {BX.map((x, i) => (
            <g key={i}>
              <g transform={`translate(${x} ${CGY - ALT[i] - 14}) scale(0.6)`}><Edificio x={0} y={0} w={340} pisos={i % 2 ? 4 : 3} pisoH={150} ladrillo={["#A9432C", "#8B5A3A", "#7E4A33", "#9B3D2A", "#8B5A3A"][i]} ventanas={[{}, {}, {}, { luz: true, quien: "dama" }, { luz: true }, { luz: true, quien: "caballero" }, { luz: true }, { luz: true, quien: i === 3 ? "gato" : "nadie" }, { luz: true }]} t={t} /></g>
              {/* losa de acera y apoyo */}
              <rect x={x - 100} y={CGY - ALT[i] - 14} width={200} height={14} fill="#8A6234" stroke="#3B2512" strokeWidth={3} />
              {ALT[i] > 0 && Array.from({ length: Math.floor(ALT[i] / 40) }, (_, k) => <rect key={k} x={x - 84} y={CGY - ALT[i] + k * 40} width={168} height={30} fill="#5A3F20" opacity={0.9} />)}
              {ALT[i] > 0 && <rect x={x - 100} y={CGY - ALT[i]} width={4} height={ALT[i]} fill="#3B2512" />}
            </g>
          ))}
          {/* escaleras entre losas */}
          {[0, 1, 2, 3].map((i) => {
            const xb = BX[i] + 100, y0 = CGY - Math.min(ALT[i], ALT[i + 1]), y1 = CGY - Math.max(ALT[i], ALT[i + 1]);
            return (
              <g key={i}>
                <line x1={xb - 12} y1={y0 - 14} x2={xb + 12} y2={y1 - 14} stroke="#C9A06A" strokeWidth={6} />
                <line x1={xb + 4} y1={y0 - 14} x2={xb + 28} y2={y1 - 14} stroke="#C9A06A" strokeWidth={6} />
                {Array.from({ length: Math.max(2, Math.floor((y0 - y1) / 22)) }, (_, k) => {
                  const nn = Math.max(2, Math.floor((y0 - y1) / 22));
                  return <line key={k} x1={xb - 10 + (k / nn) * 20} y1={lerp(y0, y1, (k + 0.5) / nn) - 14} x2={xb + 6 + (k / nn) * 20} y2={lerp(y0, y1, (k + 0.5) / nn) - 14} stroke="#C9A06A" strokeWidth={4} />;
                })}
              </g>
            );
          })}
          {/* cartel */}
          <g transform="translate(540 600)"><rect x={-150} y={-30} width={300} height={60} rx={8} fill={CH.crema} stroke={CH.tinta} strokeWidth={4} /><text x={0} y={10} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={CH.tinta} data-texto="chi-obras">ACERAS EN OBRAS</text><line x1={-60} y1={30} x2={-60} y2={140} stroke="#6B4A24" strokeWidth={8} /><line x1={60} y1={30} x2={60} y2={140} stroke="#6B4A24" strokeWidth={8} /></g>
          {/* peatones */}
          {t >= a(T.gente) && <>
            <Caballero x={w1} y={yAcera(w1) - 14} s={0.8} fase={t * 8} pose="camina" abrigo="#5C3B2A" />
            <Caballero x={w2} y={yAcera(w2) - 14} s={0.78} fase={t * 8 + 1} pose="bolsa" abrigo="#2F4A3A" espejo />
            <Caballero x={w3} y={yAcera(w3) - 14} s={0.78} fase={t * 7 + 3} pose="camina" abrigo="#4B3A5C" />
          </>}
          {/* el tropiezo */}
          {caidaOk && (
            <g>
              <g transform={`rotate(${kCaida * 360} ${vx} ${vy - 60})`}><Caballero x={vx} y={vy - 14} s={0.85} pose="susto" abrigo="#2B4A6B" sombrero={false} /></g>
              <g transform={`translate(${vx + 20} ${vy - 200 + hatY}) rotate(${kCaida * 500})`}><rect x={-22} y={-4} width={44} height={7} rx={2} fill="#15100B" /><rect x={-14} y={-34} width={28} height={32} rx={3} fill="#15100B" /></g>
            </g>
          )}
          <Onoma x={720} y={1100} texto="¡AY!" k={onoma} color="#FF9A7A" px={78} rot={-10} id="chi-ay" />
        </g>
      </svg>
      <Frases frases={[{ t: 0.02, texto: "la calle: un caos", px: 84 }, { t: T.f2, texto: "arriba, abajo, escaleras", color: CH.laton, px: 70 }, { t: T.f3, texto: "deporte extremo", color: "#FF9A7A", px: 90 }]} y={352} ancho={860} />
      <Chip texto="aceras a distintas alturas" x={W / 2} y={1556} color={CH.hielo} id="chi-aceras" ancho={640} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Mientras se levantaba cada edificio, las aceras quedaban a distintas alturas, con escalones y escaleras · ilustración" delay={1.2} />
    </FondoVapor>
  );
};

/* ───────────── chi-nivel ───────────── */

export const ChiNivel: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TCH.nivel;
  const sC = spr(f, a(T.calle), { damping: 13, stiffness: 110, mass: 0.9 });
  const sT = spr(f, a(T.tubo), { damping: 13, stiffness: 120, mass: 0.8 });
  const sI = spr(f, a(T.ing), { damping: 11, stiffness: 140, mass: 0.7 });
  const kP = rp(t, a, T.placa, 0.5);
  const calle = 980;
  return (
    <FondoVapor tono="azul" vel={0.8}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(sC * 2)} transform={`translate(0 ${(1 - sC) * 70})`}>
          {/* banderines */}
          <path d={`M 160 640 Q 540 ${730 + Math.sin(t * 2) * 10} 920 640`} stroke="#E8D9B0" strokeWidth={3} fill="none" />
          {Array.from({ length: 11 }, (_, i) => {
            const u = (i + 0.5) / 11, x = lerp(160, 920, u), y = 640 + 4 * 45 * u * (1 - u) + Math.sin(t * 2) * 10 * 4 * u * (1 - u);
            return <polygon key={i} points={`${x - 16},${y} ${x + 16},${y} ${x},${y + 40}`} fill={["#E5432D", "#E8B94F", "#3E8FA3"][i % 3]} stroke={CH.tinta} strokeWidth={2} />;
          })}
          <text x={540} y={776} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill={CH.laton} stroke={CH.tinta} strokeWidth={8} paintOrder="stroke" data-texto="chi-nuevo-nivel">¡NUEVO NIVEL!</text>
          {/* calle y edificios al mismo nivel */}
          {[390, 610, 830].map((x, i) => <g key={i} transform={`translate(${x} ${calle}) scale(0.54)`}><Edificio x={0} y={0} w={400} pisos={3} pisoH={150} ladrillo={["#A9432C", "#8B5A3A", "#9B3D2A", "#7E4A33"][i]} ventanas={[{}, {}, {}, { luz: true, quien: "dama" }, { luz: true }, { luz: true, quien: "caballero" }, { luz: true }, { luz: true }, { luz: true, quien: i === 1 ? "gato" : "nadie" }]} t={t} /></g>)}
          <rect x={0} y={calle} width={W} height={26} fill="#8A6234" stroke="#3B2512" strokeWidth={3} />
          {Array.from({ length: 18 }, (_, i) => <line key={i} x1={i * 60 + 20} y1={calle + 4} x2={i * 60 + 20} y2={calle + 22} stroke="#5A3F20" strokeWidth={3} />)}
          {/* tierra y cloaca con pendiente */}
          <rect x={0} y={calle + 26} width={W} height={1560 - calle - 26} fill="#4A3720" />
          <rect x={800} y={1250} width={280} height={310} fill="#3E8FA3" />
          <path d={`M 800 1250 ${Array.from({ length: 8 }, (_, i) => `L ${800 + (i + 1) * 35} ${1250 + Math.sin(t * 2 + i) * 4}`).join(" ")}`} stroke="#CFEFF7" strokeWidth={4} fill="none" />
          <text x={940} y={1400} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={CH.hielo} data-texto="chi-rio">río</text>
          <g opacity={clamp(sT * 2)}><Tubo x1={40} y1={1150} x2={860} y2={1290} grosor={58} t={t} fluye /></g>
          {/* placa de bronce */}
          <g opacity={kP} transform={`translate(540 1470) scale(${0.85 + 0.15 * easeOut(kP)})`}>
            <rect x={-360} y={-42} width={720} height={84} rx={12} fill={CH.laton} stroke={CH.tinta} strokeWidth={5} />
            <text x={0} y={11} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={CH.tinta} data-texto="chi-placa">CLOACAS PLANIFICADAS · 1855</text>
          </g>
          {/* ingeniero satisfecho */}
          <g opacity={clamp(sI * 2)} transform={`translate(0 ${(1 - sI) * 50})`}>
            <Caballero x={130} y={calle - 14} s={1.25} fase={t * 3} pose="quieto" abrigo="#2B4A6B" />
            <Globo x={150} y={calle - 290} texto="¡Funcionó!" ancho={300} k={sI} lado="izq" id="chi-funciono" />
          </g>
        </g>
      </svg>
      <Frases frases={[{ t: 0.02, texto: "calles firmes", px: 90 }, { t: T.f2, texto: "cloacas que drenan", color: CH.laton, px: 82 }]} y={352} ancho={860} />
      <Chip texto="uno de los primeros sistemas planificados de EE. UU." x={W / 2} y={1556} color={CH.hielo} id="chi-primero" ancho={900} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="El plan de Chesbrough (1855) fue de los primeros sistemas integrales de alcantarillado de EE. UU.; las cloacas vertían al río y el agua potable se resolvió después · esquema" delay={1.2} />
    </FondoVapor>
  );
};

/* ───────────── chi-fuego ───────────── */

export const ChiFuego: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TCH.fuego;
  const sS = spr(f, a(T.skyline), { damping: 13, stiffness: 110, mass: 0.9 });
  const flip = clamp((t - a(T.calendario)) / a(0.5));
  const kCal = spr(f, a(T.calendario - 0.2), { damping: 12, stiffness: 130, mass: 0.7 });
  const llam = easeInOut((t - a(T.llamas)) / a(2.6));
  const kC = spr(f, a(T.continuara), { damping: 9, stiffness: 150, mass: 0.7 });
  const G = 1420;
  const hs = [260, 330, 220, 380, 300, 250, 340, 230, 310];
  return (
    <FondoVapor tono="fuego" vel={1.2}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* resplandor del fuego */}
        <ellipse cx={540} cy={G - 120} rx={620} ry={380} fill="#FF7A1A" opacity={0.28 * llam} />
        <g opacity={clamp(sS * 2)} transform={`translate(0 ${(1 - sS) * 80})`}>
          {hs.map((h, i) => {
            const x = 20 + i * 118, ch = mixHeat(llam, i);
            return (
              <g key={i}>
                <rect x={x} y={G - h} width={104} height={h} fill={ch} stroke="#1A0C06" strokeWidth={3} />
                <rect x={x - 6} y={G - h - 14} width={116} height={16} fill="#D9C79A" stroke="#7A5C2E" strokeWidth={2} />
                {Array.from({ length: Math.floor(h / 70) }, (_, k) => <rect key={k} x={x + 18} y={G - h + 22 + k * 62} width={26} height={34} fill={llam > 0.15 + azar(i + k) * 0.5 ? "#FF9A2E" : "#FFD98A"} opacity={0.85} />)}
                {Array.from({ length: Math.floor(h / 70) }, (_, k) => <rect key={k} x={x + 58} y={G - h + 22 + k * 62} width={26} height={34} fill={llam > 0.25 + azar(i * 2 + k) * 0.5 ? "#FF9A2E" : "#FFD98A"} opacity={0.85} />)}
              </g>
            );
          })}
          <rect x={0} y={G} width={W} height={H - G} fill="#1C0E07" />
          {hs.map((h, i) => <Llamas key={i} x={20 + i * 118 + 52} y={G - h * 0.4} w={104} alto={170 + azar(i * 3.3) * 90} t={t + i} k={clamp(llam * 1.4 - azar(i * 5.1) * 0.4)} />)}
          {hs.map((h, i) => <Humo key={i} x={20 + i * 118 + 52} y={G - h - 30} t={t + i} s={2.2} color="#2B1B14" n={5} vel={0.35 * (T.humo > 0 ? clamp(llam * 2 - 0.4) : 0)} />)}
        </g>
        {/* calendario */}
        <g transform={`translate(540 760) scale(${0.7 + 0.3 * kCal})`} opacity={clamp(kCal * 2)}>
          <rect x={-170} y={-130} width={340} height={260} rx={16} fill={CH.crema} stroke={CH.tinta} strokeWidth={6} />
          <rect x={-170} y={-130} width={340} height={56} rx={16} fill={CH.ladrillo} stroke={CH.tinta} strokeWidth={6} />
          <circle cx={-90} cy={-134} r={10} fill={CH.tinta} /><circle cx={90} cy={-134} r={10} fill={CH.tinta} />
          <g transform={`scale(1 ${Math.abs(1 - flip * 2) || 0.001})`}>
            <text x={0} y={52} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={flip < 0.5 ? 96 : 118} fill={flip < 0.5 ? CH.tinta : CH.rojo} data-texto="chi-calendario">{flip < 0.5 ? "1860" : "1871"}</text>
          </g>
        </g>
        {/* tarjeta «continuará» */}
        <g transform={`translate(540 1030) scale(${0.6 + 0.4 * kC})`} opacity={clamp(kC * 2)}>
          <rect x={-380} y={-70} width={760} height={140} rx={8} fill="#120A05" stroke={CH.laton} strokeWidth={6} opacity={0.94} />
          <rect x={-362} y={-54} width={724} height={108} rx={4} fill="none" stroke={CH.laton} strokeWidth={2} />
          <text x={0} y={20} textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic" fontWeight={700} fontSize={78} fill={CH.laton} data-texto="chi-continuara">continuará…</text>
        </g>
      </svg>
      <Frases frases={[{ t: 0.02, texto: "años después", px: 90 }, { t: T.f2, texto: "el gran incendio", color: "#FF9A4A", px: 88 }, { t: T.continuara - 0.4, texto: "pero esa es otra historia", color: CH.crema, px: 70 }]} y={352} ancho={860} />
      <Chip texto="octubre de 1871" x={W / 2} y={1556} color="#FFB07A" id="chi-oct" ancho={480} opacidad={rp(t, a, T.llamas, 0.5)} />
      <Fuente texto="Gran incendio de Chicago, octubre de 1871: destruyó buena parte del centro de la ciudad · ilustración" delay={1.2} />
    </FondoVapor>
  );
};

const mixHeat = (k: number, i: number): string => {
  const r = Math.round(lerp(0xA9, 0x4A, clamp(k * 1.3 - azar(i * 2.9) * 0.3)));
  const g = Math.round(lerp(0x43, 0x1E, clamp(k * 1.3 - azar(i * 2.9) * 0.3)));
  const b = Math.round(lerp(0x2C, 0x14, clamp(k * 1.3 - azar(i * 2.9) * 0.3)));
  return `rgb(${r},${g},${b})`;
};
