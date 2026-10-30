/**
 * «El efecto del dígito izquierdo» (SINAPSIS · neuroeconomía) · escenas 1/2
 *   dig-gancho   dos etiquetas, $9.999 y $10.000: un peso real contra un abismo percibido (barras de distancia, semitono bermellón)
 *   dig-lectura  el modelo clásico de lectura: un cursor salta de izquierda a derecha; el primer dígito fija la cantidad y los demás entran con descuento
 *   dig-abismo   columnas isométricas: 4 cifras contra 5; el primer dígito cambia de 9 a 1 (analogía visual)
 *   dig-autos    gráfico esquemático: el precio de los autos usados cae en cada umbral de 10.000 millas (Lacetera, Pope y Sydnor 2012)
 */
import React from "react";
import { TDIG } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, LineaCap, MONO, W, clamp, easeInOut, easeOut, lerp, mezclar, spr, useReloj } from "../comun";
import { AN, Lienzo, PuntosSemitono, Visor } from "./anom-ui";
import { Garabato, Nota, Pie, TagPrecio, Texto, ovaloMano } from "./dig-kit";
import { Frases } from "./real-kit";

type P = { e: EscenaViralGuardada };

const Cap: React.FC<{ e: EscenaViralGuardada; color?: string }> = ({ e, color }) => (e.cap ? <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={color ?? AN.papel} /> : null);

/* ───────────── dig-gancho ───────────── */

export const DigGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TDIG.gancho;
  const tags = spr(f, a(G.tags), { damping: 13, stiffness: 140, mass: 0.8 });
  const ab = easeInOut((t - a(G.abismo)) / a(0.7));
  const sep = lerp(12, 150, ab);
  const WT = 372;
  const xa = 540 - sep / 2 - WT, xb = 540 + sep / 2;
  const real = easeOut((t - a(G.barraReal)) / a(0.4));
  const perc = easeOut((t - a(G.barraPercibida)) / a(0.9));
  const cota = clamp((t - a(G.cota)) / a(0.4));
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {ab > 0.02 && (
          <PuntosSemitono x0={540 - sep / 2} y0={640} w={sep} h={280} paso={15} rMax={9} color={AN.rojo} opacidad={0.95} campo={(x, y) => clamp(1 - Math.abs(x - 540) / (sep / 2 + 4)) * clamp(1 - Math.abs(y - 780) / 150) * 1.6 * ab} />
        )}
        <TagPrecio x={xa} y={700} w={WT} h={160} texto="$9.999" px={80} k={tags} rot={-1.2 * (1 - ab)} />
        <TagPrecio x={xb} y={700} w={WT} h={160} texto="$10.000" px={80} k={tags} rot={1.2 * (1 - ab)} borde={ab > 0.5 ? AN.rojo : undefined} />
        {/* un peso de verdad */}
        <g opacity={cota}>
          <line x1={540} y1={880} x2={540} y2={925} stroke={AN.lima} strokeWidth={5} strokeLinecap="round" />
          <line x1={525} y1={880} x2={555} y2={880} stroke={AN.lima} strokeWidth={5} strokeLinecap="round" />
        </g>
        {/* barras: distancia real y distancia percibida */}
        <rect x={120} y={1115} width={Math.max(0.1, 28 * real)} height={26} rx={4} fill={AN.lima} />
        <rect x={120} y={1255} width={Math.max(0.1, 840 * perc)} height={26} rx={4} fill={AN.rojo} />
      </svg>
      <Cap e={e} />
      <Frases id="titular-gancho" y={430} frases={[{ px: 118, t: 0.2, texto: "UN PESO", color: AN.blanco }, { px: 118, t: 2.0, texto: "UN ABISMO", color: AN.rojo }]} />
      <Texto texto="1 PESO" x={540} y={955} px={30} color={AN.lima} delay={G.cota} id="gancho-cota" />
      <Texto texto="DISTANCIA REAL · $1" x={120} y={1085} px={26} color={AN.lima} alinear="left" delay={G.barraReal} id="gancho-real" />
      <Texto texto="DISTANCIA QUE SIENTE TU CEREBRO" x={120} y={1225} px={26} color={AN.rojo} alinear="left" delay={G.barraPercibida} id="gancho-perc" />
      <Nota texto="analogía visual, no una medición" x={540} y={1440} color={AN.papel} delay={G.chip} id="gancho-nota" />
    </Lienzo>
  );
};

/* ───────────── dig-lectura ───────────── */

const PXL = 230, CW = PXL * 0.6;
const XL0 = (W - 6 * CW) / 2;
const CHARS = ["$", "9", ".", "9", "9", "9"];

export const DigLectura: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const L = TDIG.lectura;
  const precio = spr(f, a(L.precio), { damping: 14, stiffness: 120, mass: 0.8 });
  const kc = clamp((t - a(L.cursor)) / a(L.cursorDur));
  const paso = Math.min(4, Math.floor(kc * 5));
  const fr = kc * 5 - paso;
  const stepK = kc >= 1 ? 1 : (paso + easeOut(clamp(fr * 2.4))) / 5;
  const cx = XL0 + stepK * 6 * CW;
  const ancla = easeOut((t - a(L.ancla)) / a(0.5));
  const desc = easeOut((t - a(L.descuento)) / a(0.9));
  const yP = 950;
  const sup = (i: number): boolean => cx > XL0 + (i + 0.5) * CW;
  return (
    <Lienzo modo="marino">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {ancla > 0.02 && (
          <PuntosSemitono x0={XL0 + CW - 40} y0={yP - 160} w={CW + 80} h={320} paso={18} rMax={11} color={AN.rojo} opacidad={0.8 * ancla} campo={(x, y) => clamp(1 - Math.hypot((x - (XL0 + 1.5 * CW)) / (CW * 0.9), (y - yP) / 150)) * 1.3} />
        )}
        <Visor x={100} y={780} w={880} h={340} color={AN.lima} progreso={easeOut((t - a(0.15)) / a(0.6))} />
        {kc > 0 && kc < 1.0001 && <line x1={cx} x2={cx} y1={795} y2={1105} stroke={AN.lima} strokeWidth={5} opacity={0.95} />}
        {/* flecha al primer dígito */}
        <g opacity={ancla} stroke={AN.lima} strokeWidth={4} strokeLinecap="round" fill="none">
          <line x1={XL0 + 1.5 * CW} y1={1148} x2={XL0 + 1.5 * CW} y2={1175} />
          <path d={`M ${XL0 + 1.5 * CW - 11} ${1160} L ${XL0 + 1.5 * CW} ${1146} L ${XL0 + 1.5 * CW + 11} ${1160}`} />
        </g>
        {/* llave bajo los tres nueves finales */}
        <path d={`M ${XL0 + 3 * CW + 8} 1135 L ${XL0 + 3 * CW + 8} 1152 L ${XL0 + 6 * CW - 8} 1152 L ${XL0 + 6 * CW - 8} 1135`} fill="none" stroke={AN.papel} strokeWidth={3.5} strokeLinecap="round" opacity={0.7 * desc} />
      </svg>
      <div style={{ position: "absolute", left: XL0, top: yP, transform: `translateY(-50%) scale(${0.94 + 0.06 * precio})`, display: "flex", fontFamily: MONO, fontWeight: 800, fontSize: PXL, lineHeight: 1, opacity: clamp(precio * 2) }} data-texto="lectura-precio">
        {CHARS.map((c, i) => {
          const primero = i === 1;
          const cola = i >= 3;
          const color = primero && sup(i) ? AN.rojo : AN.papel;
          const op = cola ? lerp(1, 0.22, desc) : 1;
          return <span key={i} style={{ display: "inline-block", width: CW, textAlign: "center", color, opacity: op }}>{c}</span>;
        })}
      </div>
      <Cap e={e} />
      <Frases id="titular-lectura" y={415} frases={[{ px: 84, t: 0.2, texto: "EFECTO DEL\nDÍGITO IZQUIERDO" }, { px: 84, t: 2.7, texto: "LOS DEMÁS ENTRAN\nCON DESCUENTO", color: AN.lima }]} />
      <Texto texto="≈ 9 MIL" x={XL0 + 1.5 * CW} y={1208} px={40} color={AN.lima} delay={L.ancla} peso={800} id="lectura-ancla" />
      <Texto texto="la cantidad se fija aquí" x={XL0 + 1.5 * CW} y={1256} px={24} color={AN.papel} delay={L.ancla + 0.2} peso={500} id="lectura-ancla2" />
      <Texto texto="DESCUENTO COGNITIVO" x={XL0 + 4.5 * CW} y={1195} px={28} color={AN.papel} delay={L.descuento} id="lectura-desc" />
      <Nota texto="modelo clásico: se lee de izquierda a derecha" x={540} y={1420} color={AN.lima} delay={L.chip} id="lectura-nota" />
    </Lienzo>
  );
};

/* ───────────── dig-abismo ───────────── */

const Col: React.FC<{ x: number; y: number; w: number; h: number; d?: number; color: string; txt: string; k: number; tinta?: string; borde?: string }> = ({ x, y, w, h, d = 46, color, txt, k, tinta = AN.tinta, borde }) => {
  const kk = clamp(k);
  const dy = (1 - kk) * 60;
  const top = mezclar(color, "#FFFFFF", 0.35);
  const lado = mezclar(color, "#000000", 0.38);
  return (
    <g opacity={clamp(kk * 2)} transform={`translate(0 ${dy})`}>
      <polygon points={`${x},${y} ${x + d},${y - d * 0.6} ${x + w + d},${y - d * 0.6} ${x + w},${y}`} fill={top} />
      <polygon points={`${x + w},${y} ${x + w + d},${y - d * 0.6} ${x + w + d},${y + h - d * 0.6} ${x + w},${y + h}`} fill={lado} />
      <rect x={x} y={y} width={w} height={h} fill={color} stroke={borde ?? "none"} strokeWidth={borde ? 6 : 0} />
      <text x={x + w / 2} y={y + h * 0.7} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={h * 0.58} fill={tinta}>{txt}</text>
    </g>
  );
};

export const DigAbismo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const B = TDIG.abismo;
  const WC = 150, GAP = 18, D = 46;
  const xA0 = (W - (4 * WC + 3 * GAP + D)) / 2;
  const xB0 = (W - (5 * WC + 4 * GAP + D)) / 2;
  const digA = ["9", "9", "9", "9"], digB = ["1", "0", "0", "0", "0"];
  const mas = spr(f, a(B.mas), { damping: 10, stiffness: 190, mass: 0.6 });
  const cambio = easeOut((t - a(B.cambio)) / a(0.6));
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {digA.map((d, i) => <Col key={`a${i}`} x={xA0 + i * (WC + GAP)} y={780} w={WC} h={150} color={AN.papel} txt={d} k={spr(f, a(B.a + i * 0.1), { damping: 13, stiffness: 150, mass: 0.7 })} />)}
        {digB.map((d, i) => <Col key={`b${i}`} x={xB0 + i * (WC + GAP)} y={1140} w={WC} h={215} color={i === 0 ? mezclar(AN.papel, AN.lima, cambio * 0.65) : AN.papel} txt={d} k={spr(f, a(B.b + i * 0.1), { damping: 13, stiffness: 150, mass: 0.7 })} />)}
        <g opacity={cambio}>
          <Garabato d={ovaloMano(xA0 + WC / 2 + 22, 850, 100, 98, 2)} k={cambio} color={AN.rojo} grosor={7} />
          <Garabato d={ovaloMano(xB0 + WC / 2 + 22, 1232, 100, 128, 5)} k={cambio} color={AN.rojo} grosor={7} />
        </g>
        <g transform={`translate(540 985) scale(${0.5 + 0.5 * mas})`} opacity={clamp(mas * 2)}>
          <rect x={-170} y={-40} width={340} height={80} rx={40} fill={AN.lima} />
          <text x={0} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={44} fill={AN.tinta}>+1 CIFRA</text>
        </g>
      </svg>
      <Cap e={e} />
      <Frases id="titular-abismo" y={430} frases={[{ px: 104, t: 0.2, texto: "CUATRO CIFRAS" }, { px: 104, t: 1.3, texto: "CINCO CIFRAS", color: AN.rojo }]} />
      <Texto texto="$9.999 · bloque compacto" x={540} y={705} px={28} color={AN.papel} delay={B.a} id="abismo-a" />
      <Texto texto="$10.000 · una muralla" x={540} y={1082} px={28} color={AN.papel} delay={B.b} id="abismo-b2" />
      <Texto texto="primer dígito: 9 → 1" x={540} y={1440} px={44} color={AN.rojo} delay={B.cambio} peso={800} id="abismo-cambio" />
      <Nota texto="analogía visual, no una medición" x={540} y={1510} color={AN.papel} delay={B.chip} id="abismo-nota" />
    </Lienzo>
  );
};

/* ───────────── dig-autos ───────────── */

const CX0 = 130, CX1 = 945, CY0 = 700, CY1 = 1230;
const gxm = (m: number): number => CX0 + ((m - 60000) / 40000) * (CX1 - CX0);
const precioAuto = (m: number, antes: boolean): number => {
  const u = (m - 60000) / 40000;
  const esc = Math.min(3, Math.max(0, Math.floor(u * 4 - (antes ? 1e-9 : 0))));
  return 0.86 - 0.22 * u - 0.075 * esc;
};
const gyp = (p: number): number => CY1 - ((p - 0.2) / 0.7) * (CY1 - CY0);
const puntosAuto = (hasta: number): string => {
  const pts: string[] = [];
  for (let m = 60000; m <= 100000; m += 250) {
    if (m > hasta) break;
    if (m % 10000 === 0 && m > 60000 && m < 100000) pts.push(`${gxm(m).toFixed(1)},${gyp(precioAuto(m, true)).toFixed(1)}`);
    pts.push(`${gxm(m).toFixed(1)},${gyp(precioAuto(m, false)).toFixed(1)}`);
  }
  return pts.join(" ");
};

export const DigAutos: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const A = TDIG.autos;
  const ejes = clamp((t - a(A.ejes)) / a(0.5));
  const mCur = 60000 + 40000 * easeInOut((t - a(A.curva)) / a(A.curvaDur));
  const cruce = easeOut((t - a(A.cruce)) / a(0.7));
  const yIn = gyp(precioAuto(80000, true)), yOut = gyp(precioAuto(80000, false));
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={ejes}>
          {[70000, 80000, 90000].map((m) => <line key={m} x1={gxm(m)} x2={gxm(m)} y1={CY0} y2={CY1} stroke={AN.papel} strokeOpacity={0.22} strokeWidth={2} strokeDasharray="5 9" />)}
          <path d={`M ${CX0} ${CY0 - 10} L ${CX0} ${CY1} L ${CX1 + 10} ${CY1}`} fill="none" stroke={AN.papel} strokeWidth={4} strokeLinecap="round" />
          {[60000, 70000, 80000, 90000, 100000].map((m) => <text key={m} x={gxm(m)} y={CY1 + 44} textAnchor="middle" fontFamily={MONO} fontSize={22} fill={AN.papel} opacity={0.75}>{m.toLocaleString("es-CO")}</text>)}
          <text x={CX0} y={CY0 - 28} fontFamily={MONO} fontSize={22} fill={AN.papel} opacity={0.75}>precio</text>
          <text x={CX1} y={CY1 + 88} textAnchor="end" fontFamily={MONO} fontSize={22} fill={AN.papel} opacity={0.75}>millas en el odómetro →</text>
        </g>
        <polyline points={puntosAuto(mCur)} fill="none" stroke={AN.lima} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        {mCur < 100000 && <circle cx={gxm(mCur)} cy={gyp(precioAuto(mCur, false))} r={13} fill={AN.lima} stroke={AN.oscuro} strokeWidth={5} />}
        <g opacity={cruce}>
          <Garabato d={ovaloMano(gxm(80000), (yIn + yOut) / 2, 64, Math.abs(yOut - yIn) / 2 + 52, 3)} k={cruce} color={AN.rojo} grosor={7} />
          <line x1={gxm(80000)} x2={gxm(80000)} y1={yIn} y2={yOut} stroke={AN.rojo} strokeWidth={9} strokeLinecap="round" />
        </g>
      </svg>
      <Cap e={e} />
      <Frases id="titular-autos" y={430} frases={[{ px: 92, t: 0.2, texto: "22 MILLONES\nDE VENTAS" }, { px: 92, t: 3.0, texto: "UN SALTO EN\nCADA 10.000", color: AN.rojo }]} />
      <Texto texto="79.999 → 80.000 millas:  ≈ US$ 210 menos" x={120} y={1365} px={25} color={AN.rojo} alinear="left" delay={A.tabla} id="autos-fila1" />
      <Texto texto="79.800 → 79.900 millas:  ≈ US$ 10 menos" x={120} y={1415} px={25} color={AN.papel} alinear="left" delay={A.tabla + 0.4} id="autos-fila2" />
      <Pie texto={"Lacetera, Pope y Sydnor · American Economic Review 2012\ngráfico esquemático, no son los datos reales"} y={1490} delay={A.fuente} />
    </Lienzo>
  );
};

