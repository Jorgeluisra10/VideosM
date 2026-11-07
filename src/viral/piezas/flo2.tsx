/**
 * «El piso que no existe» (IMNOBA · figuras realistas) · escenas 2/2
 *   flo-asia     en China, Japón y Corea el 4 suena parecido a muerte: muchos edificios se lo saltan
 *   flo-precio   el 8 suena a prosperidad; estudios: el 4 se vende más barato y el 8, a veces, más caro
 *   flo-consejo  si compras, cuenta los pisos reales y mira el plano: el botón puede esconder uno
 */
import React from "react";
import { FLO, TFL, rotuloPiso } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Estudio, FONT, Frases, MONOF, RE } from "./real-kit";
import { Fuente } from "./real1";
import { Chip } from "./med1";
import { Edificio, FL, PanelAscensor, type Boton } from "./flo-kit";

type P = { e: EscenaViralGuardada };
const rp = (t: number, a: (x: number) => number, ini: number, dur: number): number => clamp((t - a(ini)) / a(dur));
const fmt = (v: number): string => `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(1).replace(".", ",")} %`;

/* ───────────── flo-asia ───────────── */

export const FloAsia: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TFL.asia;
  const s = spr(f, a(T.panel), { damping: 15, stiffness: 120, mass: 0.8 });
  const hueco = rp(t, a, T.hueco, 0.5);
  const botones: Boton[] = [{ n: "8" }, { n: "7" }, { n: "6" }, { n: "5" }, { n: null }, { n: "3" }, { n: "2" }, { n: "1" }];
  return (
    <Estudio piso={1580} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(s * 2)} transform={`translate(0 ${(1 - s) * 60})`}>
          <PanelAscensor x={540} y={560} botones={botones} paso={102} r={38} fantasma={hueco} t={t} />
        </g>
      </svg>
      <Frases frases={[{ t: 0.02, texto: "China, Japón y Corea", px: 76 }, { t: T.muerte - 0.2, texto: "el 4 suena a muerte", color: FL.rojo, px: 78 }, { t: T.saltan, texto: "se lo saltan", color: RE.oro, px: 92 }]} y={352} ancho={860} />
      <Chip texto="4 ≈ «muerte»" x={250} y={1020} color={FL.rojo} id="flo-cuatro" ancho={330} opacidad={rp(t, a, T.muerte, 0.4)} />
      <Chip texto="sin piso 4" x={830} y={1020} color={RE.oro} id="flo-sin4" ancho={300} opacidad={rp(t, a, T.saltan, 0.4)} />
      <Fuente texto="En chino, el 4 suena parecido a «muerte»; muchos edificios de Asia omiten el 4 · ilustración" delay={0.8} />
    </Estudio>
  );
};

/* ───────────── flo-precio ───────────── */

const Anillo: React.FC<{ x: number; y: number; n: string; color: string; k: number; t: number }> = ({ x, y, n, color, k, t }) => (
  <g opacity={clamp(k * 2)} transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * easeOut(k)})`}>
    <circle r={120} fill="#000" opacity={0.4} cy={10} />
    <circle r={120} fill="#C9D3DE" stroke="#4A5560" strokeWidth={4} />
    <circle r={100} fill="#0D1118" stroke={color} strokeWidth={8} />
    <circle r={190} fill={color} opacity={0.12 + 0.06 * Math.sin(t * 4)} />
    <text x={0} y={42} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={130} fill={color}>{n}</text>
  </g>
);

export const FloPrecio: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TFL.precio;
  const k8 = rp(t, a, T.ocho, 0.6), k4 = rp(t, a, T.cuatro, 0.6);
  const filas = [
    { y: 1000, k: rp(t, a, T.barra1, 0.8), v: FLO.vancouver.ocho, etq: "Vancouver · direcciones con 8" },
    { y: 1150, k: rp(t, a, T.barra2, 0.8), v: FLO.vancouver.cuatro, etq: "Vancouver · direcciones con 4" },
    { y: 1300, k: rp(t, a, T.barra3, 0.8), v: FLO.hongKong.cuatro, etq: "Hong Kong · pisos con 4" },
  ];
  const ESC = 80, X0 = 540;
  return (
    <Estudio piso={1580} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Anillo x={330} y={660} n="8" color={FL.oro} k={k8} t={t} />
        <Anillo x={750} y={660} n="4" color={FL.rojo} k={k4} t={t} />
        <line x1={X0} y1={900} x2={X0} y2={1390} stroke="#E6EEF7" strokeOpacity={0.5} strokeWidth={3} />
        {filas.map((fl, i) => {
          const w = Math.abs(fl.v) * ESC * easeOut(fl.k);
          const pos = fl.v > 0;
          return fl.k > 0.01 ? <rect key={i} x={pos ? X0 : X0 - w} y={fl.y} width={w} height={54} rx={8} fill={pos ? FL.oro : FL.rojo} opacity={0.95} /> : null;
        })}
      </svg>
      <Frases frases={[{ t: 0.02, texto: "el 8 = prosperidad", color: RE.oro, px: 80 }, { t: T.cuatro, texto: "el 4 = mala suerte", color: FL.rojo, px: 80 }, { t: T.barra1 - 0.3, texto: "¿y los precios?", px: 88 }]} y={352} ancho={860} />
      {filas.map((fl, i) => (
        <React.Fragment key={i}>
          <div data-texto={`flo-etq${i}`} style={{ position: "absolute", left: 110, top: fl.y - 40, width: 860, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: RE.hielo, opacity: clamp(fl.k * 3) }}>{fl.etq}</div>
          <div data-texto={`flo-val${i}`} style={{ position: "absolute", left: fl.v > 0 ? X0 + Math.abs(fl.v) * ESC * easeOut(fl.k) + 16 : 110, top: fl.y + 27, transform: "translateY(-50%)", width: fl.v > 0 ? 220 : X0 - 110 - Math.abs(fl.v) * ESC * easeOut(fl.k) - 16, textAlign: fl.v > 0 ? "left" : "right", fontFamily: FONT, fontWeight: 800, fontSize: 44, color: fl.v > 0 ? RE.oro : "#FF8A93", opacity: clamp(fl.k * 3) }}>{fmt(fl.v)}</div>
        </React.Fragment>
      ))}
      <Chip texto="varía según la ciudad y el mercado" x={W / 2} y={1470} color={RE.hielo} id="flo-varia" ancho={800} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Vancouver (99 % Invisible) y tesis de la U. de Hong Kong · en Taipei no hallaron prima para el 8 · efectos indicativos" delay={0.8} />
    </Estudio>
  );
};

/* ───────────── flo-consejo ───────────── */

export const FloConsejo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TFL.consejo;
  const N = 14;
  const cuenta = easeInOut((t - a(T.cuenta)) / a(T.cuentaDur)) * N;
  const rot = rp(t, a, T.rotulos, 0.4);
  const rotulos = Array.from({ length: N }, (_, i) => (rot > 0.5 ? String(rotuloPiso(i + 1)) : ""));
  const plano = rp(t, a, T.plano, 0.6);
  const s = spr(f, 0, { damping: 15, stiffness: 120, mass: 0.8 });
  const enCuenta = Math.min(N, Math.ceil(cuenta));
  return (
    <Estudio piso={1500} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(s * 2)}>
          <Edificio x={270} y={1440} w={280} alto={840} n={N} rotulos={rotulos} resalta={rot > 0.5 ? 12 : enCuenta - 1} hasta={cuenta} brillo={1} reales />
        </g>
        {/* plano */}
        <g opacity={plano} transform={`translate(0 ${(1 - plano) * 50})`}>
          <rect x={660} y={700} width={330} height={420} rx={14} fill="#1B4A9E" stroke="#BFE0FF" strokeWidth={4} />
          {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={680 + i * 36} y1={720} x2={680 + i * 36} y2={1100} stroke="#BFE0FF" strokeOpacity={0.25} />)}
          {Array.from({ length: 11 }, (_, i) => <line key={`h${i}`} x1={680} y1={720 + i * 38} x2={970} y2={720 + i * 38} stroke="#BFE0FF" strokeOpacity={0.25} />)}
          <rect x={720} y={780} width={200} height={260} fill="none" stroke="#fff" strokeWidth={5} />
          <line x1={720} y1={880} x2={920} y2={880} stroke="#fff" strokeWidth={4} /><line x1={820} y1={880} x2={820} y2={1040} stroke="#fff" strokeWidth={4} />
          <text x={825} y={830} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={30} fill={FL.oro}>PLANO</text>
        </g>
      </svg>
      <div data-texto="flo-cont" style={{ position: "absolute", left: 640, top: 440, width: 360, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 130, color: RE.blanco, opacity: clamp(cuenta) }}>{enCuenta}</div>
      <div data-texto="flo-cont-etq" style={{ position: "absolute", left: 640, top: 590, width: 360, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 28, color: RE.hielo, opacity: clamp(cuenta) }}>pisos reales</div>
      <Frases frases={[{ t: 0.02, texto: "cuenta los pisos reales", px: 70 }, { t: T.rotulos, texto: "el botón puede esconder uno", color: RE.oro, px: 58 }, { t: T.plano, texto: "mira el plano", color: RE.hielo, px: 88 }]} y={352} ancho={860} />
      <Chip texto="piso real 13 = botón 14" x={W / 2} y={1520} color={RE.oro} id="flo-igual" ancho={680} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Antes de comprar, confirma en el plano y en el edificio en qué piso queda realmente el apartamento · información general" delay={0.8} />
    </Estudio>
  );
};
