/**
 * «Puentes colgantes» (SINAPSIS · física estructural) · escenas 2/2
 *   pte-roebling  cuaderno de campo sobre papel: corte del cable de Brooklyn (19 hebras), más de 5.000 alambres y marcas de conteo (卌 = 5 × 1.000)
 *   pte-bloque    barra maciza contra un haz de alambres delgados del mismo grosor (comparación cualitativa)
 *   pte-cubo      cubo isométrico del espacio de parámetros (carga, área, límite elástico): resiste en rojo, colapsa en azul y margen de seguridad 6 (modelo simplificado)
 *   pte-zoom      zoom logarítmico de 1.000 m a 1 mm: puente → cable → 61 hebras → panal de alambres
 */
import React from "react";
import { PTE, TPTE } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, LineaCap, MONO, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { useUid } from "../../estudio/util";
import { AN, Lienzo, Odometro, PuntosSemitono, Visor } from "./anom-ui";
import { Garabato, Nota, Pie, Tally, Texto, ovaloMano } from "./dig-kit";
import { CajaAlambre, PT, puntosParabola, redHexagonal, suave, yParabola } from "./pte-kit";
import { Frases } from "./real-kit";

type P = { e: EscenaViralGuardada };

const Cap: React.FC<{ e: EscenaViralGuardada; color?: string }> = ({ e, color }) => (e.cap ? <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={color ?? AN.papel} /> : null);

/* ───────────── pte-roebling ───────────── */

export const PteRoebling: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const R = TPTE.roebling;
  const ficha = easeOut((t - a(R.ficha)) / a(0.5));
  const corte = easeOut((t - a(R.corte)) / a(0.7));
  const hex = redHexagonal(2, 66);
  const CX = 330, CY = 950;
  const n = Math.round(PTE.brooklynAlambresMin * easeInOut((t - a(R.odometro)) / a(R.odometroDur)));
  return (
    <Lienzo modo="papel">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={ficha}>
          <rect x={100} y={600} width={880} height={800} fill="none" stroke={AN.tinta} strokeWidth={4} />
          <rect x={100} y={600} width={880} height={78} fill={AN.tinta} />
        </g>
        <Garabato d={ovaloMano(CX, CY, 182, 182, 1)} k={corte} color={AN.tinta} grosor={6} />
        {hex.map((p, i) => {
          const k = spr(f, a(R.hebras + i * 0.06), { damping: 14, stiffness: 150, mass: 0.7 });
          return (
            <g key={i} transform={`translate(${CX + p.x} ${CY + p.y}) scale(${k})`} opacity={clamp(k * 2)}>
              <circle r={31} fill={p.anillo % 2 === 0 ? AN.rojo : AN.tinta} />
              <circle r={31} fill="none" stroke={AN.papel} strokeWidth={3} strokeOpacity={0.55} />
            </g>
          );
        })}
        <Tally x={620} y={1030} n={5} k={easeOut((t - a(R.tally)) / a(0.9))} color={AN.tinta} alto={64} grosor={6} />
      </svg>
      <Cap e={e} color={AN.tinta} />
      <Frases id="titular-roebling" y={430} frases={[{ px: 100, t: 0.2, texto: "BROOKLYN,\n1883", color: AN.tinta }, { px: 100, t: 3.0, texto: "MÁS DE 5.000\nALAMBRES", color: AN.rojo }]} />
      <Texto texto="CUADERNO DE CAMPO · BROOKLYN, 1883" x={126} y={639} px={25} color={AN.papel} alinear="left" delay={0.3} peso={800} id="roebling-head" />
      <Texto texto="19 hebras" x={CX} y={1170} px={30} color={AN.tinta} delay={R.hebras + 1.2} peso={800} id="roebling-hebras" />
      <Texto texto="corte · ≈ 40 cm (15¾ in)" x={CX} y={1216} px={22} color={AN.tinta} delay={R.hebras + 1.5} peso={500} id="roebling-diam" />
      <Odometro valor={n} x={780} y={860} px={92} digitos={4} prefijo="" sufijo="+" color={AN.rojo} id="roebling-odo" />
      <Texto texto="alambres por cable" x={780} y={945} px={26} color={AN.tinta} delay={R.odometro} peso={600} id="roebling-etq" />
      <Texto texto="× 1.000" x={850} y={1062} px={32} color={AN.tinta} alinear="center" delay={R.tally + 0.5} peso={800} id="roebling-tally" />
      <Texto texto="diseño de J. A. Roebling · abierto en 1883" x={540} y={1330} px={24} color={AN.tinta} delay={R.chip} peso={700} id="roebling-nota" />
      <Pie texto={"AISC y Structure: 5.434 alambres por cable (otras fuentes: 5.282)\nesquema, no a escala"} y={1478} delay={R.chip} color={AN.tinta} />
    </Lienzo>
  );
};

/* ───────────── pte-bloque ───────────── */

export const PteBloque: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const B = TPTE.bloque;
  const barra = spr(f, a(B.barra), { damping: 14, stiffness: 120, mass: 0.8 });
  const haz = spr(f, a(B.haz), { damping: 14, stiffness: 120, mass: 0.8 });
  const g = easeOut((t - a(B.graficas)) / a(0.9));
  const topes = redHexagonal(3, 26);
  const luz = Math.sin(t * 1.1) * 0.2;
  return (
    <Lienzo modo="marino">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* barra maciza */}
        <g opacity={clamp(barra * 2)} transform={`translate(0 ${(1 - barra) * 40})`}>
          <PuntosSemitono x0={190} y0={720} w={200} h={310} paso={17} rMax={10} color={AN.rojo} campo={(x) => clamp(1 - Math.pow(Math.abs((x - 190) / 200 - 0.38 - luz) * 1.7, 1.3))} />
          <ellipse cx={290} cy={720} rx={100} ry={26} fill="#2A0F0B" stroke={AN.rojo} strokeWidth={5} />
          <rect x={190} y={720} width={200} height={310} fill="none" stroke={AN.rojo} strokeWidth={4} />
          <ellipse cx={290} cy={1030} rx={100} ry={26} fill="none" stroke={AN.rojo} strokeWidth={4} />
        </g>
        {/* haz de alambres */}
        <g opacity={clamp(haz * 2)} transform={`translate(0 ${(1 - haz) * 40})`}>
          {Array.from({ length: 21 }, (_, i) => <line key={i} x1={694 + i * 9.6} y1={720} x2={694 + i * 9.6} y2={1030} stroke={i % 2 ? PT.traccionSuave : AN.rojo} strokeWidth={4.5} />)}
          <ellipse cx={790} cy={720} rx={100} ry={26} fill="#2A0F0B" stroke={AN.rojo} strokeWidth={5} />
          {topes.map((p, i) => <circle key={i} cx={790 + p.x * 1.15} cy={720 + p.y * 0.3} r={5.5} fill={i % 2 ? PT.traccionSuave : AN.lima} />)}
          <ellipse cx={790} cy={1030} rx={100} ry={26} fill="none" stroke={AN.rojo} strokeWidth={4} />
        </g>
        {/* resistencia (esquema cualitativo) */}
        <rect x={120} y={1212} width={Math.max(0.1, 300 * g)} height={30} rx={4} fill={AN.papel} />
        <rect x={120} y={1272} width={Math.max(0.1, 560 * g)} height={30} rx={4} fill={AN.lima} />
      </svg>
      <Cap e={e} />
      <Frases id="titular-bloque" y={430} frases={[{ px: 96, t: 0.2, texto: "UNA BARRA\nMACIZA" }, { px: 96, t: 2.0, texto: "O MILES DE\nALAMBRES", color: AN.lima }]} />
      <Texto texto="BARRA MACIZA" x={290} y={1090} px={26} color={AN.papel} delay={B.barra} peso={800} id="bloque-barra" />
      <Texto texto="HAZ DE ALAMBRES" x={790} y={1090} px={26} color={AN.lima} delay={B.haz} peso={800} id="bloque-haz" />
      <Texto texto="resistencia · esquema cualitativo" x={120} y={1170} px={22} color={AN.papel} alinear="left" delay={B.graficas} peso={500} id="bloque-etq" />
      <Texto texto="barra" x={444} y={1228} px={22} color={AN.papel} alinear="left" delay={B.graficas + 0.2} peso={700} id="bloque-l1" />
      <Texto texto="haz" x={704} y={1288} px={22} color={AN.lima} alinear="left" delay={B.graficas + 0.5} peso={700} id="bloque-l2" />
      <Nota texto="pueden resistir más por área que una barra" x={540} y={1390} color={AN.lima} delay={B.chip} px={23} id="bloque-nota" />
      <Pie texto={"ETHW «Wire Drawing and Bridges» · mismo grosor\nesquema cualitativo, no son valores"} y={1478} delay={B.chip} />
    </Lienzo>
  );
};

/* ───────────── pte-cubo ───────────── */

const GR = 6;
const AZUL_CLARO = "#4F5CFF";

export const PteCubo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TPTE.cubo;
  const cubo = spr(f, a(C.cubo), { damping: 14, stiffness: 120, mass: 0.8 });
  const prog = clamp((t - a(C.puntos)) / a(C.puntosDur));
  const margen = easeOut((t - a(C.margen)) / a(0.8));
  const S = 300, CX = 540, CY = 940;
  const phi = 0.62 + t * 0.32;
  const proy = (x: number, y: number, z: number): { sx: number; sy: number; d: number } => {
    const X = x - 0.5, Y = y - 0.5, Z = z - 0.5;
    const xr = X * Math.cos(phi) - Y * Math.sin(phi), yr = X * Math.sin(phi) + Y * Math.cos(phi);
    return { sx: CX + (xr - yr) * 0.866 * S, sy: CY + (xr + yr) * 0.5 * S - Z * S * 1.05, d: xr + yr };
  };
  const pts: { sx: number; sy: number; d: number; ok: boolean; marg: boolean; orden: number }[] = [];
  for (let i = 0; i < GR; i++) for (let j = 0; j < GR; j++) for (let k = 0; k < GR; k++) {
    const c = i / (GR - 1), ar = j / (GR - 1), s = k / (GR - 1);
    const p = proy(c, ar, s);
    pts.push({ ...p, ok: c <= ar * s + 1e-9, marg: c <= (ar * s) / PTE.brooklynFactor + 1e-9, orden: i + j + k });
  }
  pts.sort((p, q) => p.d - q.d);
  const verts: [number, number, number][] = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
  const V = verts.map(([x, y, z]) => proy(x, y, z));
  const aristas: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(cubo * 2)}>
          {aristas.map(([p, q], i) => <line key={i} x1={V[p].sx} y1={V[p].sy} x2={V[q].sx} y2={V[q].sy} stroke={AN.lima} strokeWidth={3.5} strokeOpacity={0.8} strokeLinecap="round" />)}
        </g>
        {pts.filter((p) => p.orden / (3 * (GR - 1)) <= prog).map((p, i) => {
          const r = 6.5 + 3.5 * clamp((p.d + 1) / 2);
          return (
            <g key={i}>
              <circle cx={p.sx} cy={p.sy} r={r} fill={p.ok ? PT.traccion : AZUL_CLARO} opacity={p.ok ? 0.95 : 0.8} />
              {p.ok && p.marg && margen > 0.02 && <circle cx={p.sx} cy={p.sy} r={r + 5 * margen} fill="none" stroke={AN.lima} strokeWidth={3} opacity={margen} />}
            </g>
          );
        })}
        <circle cx={150} cy={1260} r={9} fill={PT.traccion} />
        <circle cx={150} cy={1310} r={9} fill={AZUL_CLARO} />
        <circle cx={150} cy={1360} r={9} fill="none" stroke={AN.lima} strokeWidth={3} />
      </svg>
      <Cap e={e} />
      <Frases id="titular-cubo" y={430} frases={[{ px: 84, t: 0.2, texto: "CADA DISEÑO\nTIENE UN LÍMITE" }, { px: 96, t: 3.9, texto: "MARGEN\nDE SEIS", color: AN.lima }]} />
      <Texto texto="resiste" x={182} y={1260} px={24} color={PT.traccionSuave} alinear="left" delay={C.puntos} peso={700} id="cubo-ok" />
      <Texto texto="colapsa" x={182} y={1310} px={24} color={"#8E98FF"} alinear="left" delay={C.puntos + 0.2} peso={700} id="cubo-no" />
      <Texto texto="con margen de seguridad 6" x={182} y={1360} px={24} color={AN.lima} alinear="left" delay={C.margen} peso={700} id="cubo-m" />
      <Texto texto="ejes: carga · área · límite elástico" x={940} y={1260} px={22} color={AN.papel} alinear="right" delay={C.cubo + 0.4} peso={500} id="cubo-ejes" />
      <Nota texto="resiste si: carga ≤ área × límite elástico" x={540} y={1430} color={AN.lima} delay={C.formula} px={23} id="cubo-formula" />
      <Nota texto="Brooklyn: factor de seguridad de diseño ≈ 6" x={540} y={1488} color={AN.papel} delay={C.chip} px={23} id="cubo-nota" />
    </Lienzo>
  );
};

/* ───────────── pte-zoom ───────────── */

const PZ = { x: 110, y: 640, w: 860, h: 640 };
const FOCO = { x: 540, y: 1000 };
const CC = { x: 540, y: 960 };
const HEX_FUERTES = redHexagonal(4, 73.4);
const HEX_ALAMBRES = redHexagonal(9, 26);
const AMARILLO = "#FFD23F";

const lecturaEscala = (v: number): string => {
  if (v >= 1) return `${Math.round(v).toLocaleString("es-CO")} m`;
  if (v >= 0.01) return `${(v * 100).toFixed(v * 100 >= 10 ? 0 : 1).replace(".", ",")} cm`;
  return `${(v * 1000).toFixed(v * 1000 >= 10 ? 0 : 1).replace(".", ",")} mm`;
};

export const PteZoom: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const uid = useUid();
  const Z = TPTE.zoom;
  const k = easeInOut((t - a(Z.ini)) / a(Z.dur));
  const valor = Math.pow(10, 3 - 6 * k);
  const oA = 1 - suave(k, 0.26, 0.42);
  const sA = 1 + 42 * Math.pow(Math.min(1, k / 0.42), 2.2);
  const oB = suave(k, 0.3, 0.44) * (1 - suave(k, 0.68, 0.8));
  const sB = k < 0.62 ? 0.06 * Math.pow(1 / 0.06, suave(k, 0.3, 0.62)) : 1 + 13 * Math.pow(suave(k, 0.62, 0.8), 1.6);
  const oC = suave(k, 0.66, 0.82);
  const sC = 0.08 * Math.pow(1 / 0.08, suave(k, 0.64, 0.92));
  const cable = puntosParabola(300, 780, 700, 330, 60).map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const fin = clamp((t - a(Z.ini + Z.dur)) / a(0.5));
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><clipPath id={`${uid}z`}><rect x={PZ.x} y={PZ.y} width={PZ.w} height={PZ.h} /></clipPath></defs>
        <g clipPath={`url(#${uid}z)`}>
          {/* A · el puente */}
          <g opacity={oA} transform={`translate(${FOCO.x} ${FOCO.y}) scale(${sA}) translate(${-FOCO.x} ${-FOCO.y})`}>
            <line x1={0} y1={1260} x2={W} y2={1260} stroke={AN.papel} strokeOpacity={0.3} strokeWidth={3} />
            {[300, 780].map((x) => <g key={x} stroke={AN.papel} strokeWidth={9}><line x1={x - 22} y1={700} x2={x - 22} y2={1260} /><line x1={x + 22} y1={700} x2={x + 22} y2={1260} /></g>)}
            <line x1={110} y1={1090} x2={970} y2={1090} stroke={AN.papel} strokeWidth={12} />
            <path d={`M 150 1070 L 300 700 M 930 1070 L 780 700`} stroke={PT.traccion} strokeWidth={7} fill="none" />
            <path d={cable} stroke={PT.traccion} strokeWidth={11} fill="none" />
            {Array.from({ length: 11 }, (_, i) => 340 + i * 40).filter((x) => x < 760).map((x) => <line key={x} x1={x} y1={yParabola(x, 300, 780, 700, 330)} x2={x} y2={1090} stroke={AN.papel} strokeOpacity={0.5} strokeWidth={3} />)}
          </g>
          {/* B · el corte del cable: 61 hebras */}
          <g opacity={oB} transform={`translate(${CC.x} ${CC.y}) scale(${sB}) translate(${-CC.x} ${-CC.y})`}>
            <circle cx={CC.x} cy={CC.y} r={340} fill="#1A0D0B" stroke={PT.traccion} strokeWidth={6} />
            {HEX_FUERTES.map((p, i) => <circle key={i} cx={CC.x + p.x} cy={CC.y + p.y} r={34} fill={p.anillo % 2 === 0 ? PT.traccion : AMARILLO} opacity={0.9} />)}
          </g>
          {/* C · el panal de alambres */}
          <g opacity={oC} transform={`translate(${CC.x} ${CC.y}) rotate(${t * 3}) scale(${sC}) translate(${-CC.x} ${-CC.y})`}>
            <circle cx={CC.x} cy={CC.y} r={262} fill="#1A0D0B" stroke={AMARILLO} strokeWidth={4} />
            {HEX_ALAMBRES.map((p, i) => <circle key={i} cx={CC.x + p.x} cy={CC.y + p.y} r={10.5} fill={(p.anillo + (i % 2)) % 2 === 0 ? PT.traccion : AMARILLO} />)}
          </g>
        </g>
        <Visor x={PZ.x} y={PZ.y} w={PZ.w} h={PZ.h} color={AN.lima} progreso={easeOut((t - a(0.1)) / a(0.6))} cruz />
      </svg>
      <Cap e={e} />
      <Frases id="titular-zoom" y={430} frases={[{ px: 84, t: 0.2, texto: "MIL METROS\nA UN MILÍMETRO" }, { px: 96, t: 4.6, texto: "UN PANAL\nDE ALAMBRES", color: AN.lima }]} />
      <Texto texto="ANCHO DEL CUADRO" x={540} y={1325} px={22} color={AN.papel} delay={0.3} peso={600} id="zoom-etq" interletra={0.1} />
      <Texto texto={lecturaEscala(valor)} x={540} y={1382} px={54} color={AN.lima} delay={0.3} peso={800} id="zoom-lectura" />
      <Texto texto="61 hebras" x={540} y={1250} px={26} color={AN.papel} delay={0} peso={800} id="zoom-hebras" opacidad={oB * (1 - oC)} />
      <Nota texto={`${PTE.ggHebras} hebras · ${PTE.ggAlambres.toLocaleString("es-CO")} alambres de ≈ 5 mm`} x={540} y={1450} color={AN.lima} delay={Z.chip} px={23} id="zoom-nota" opacidad={fin} />
      <Pie texto="Golden Gate Bridge District · esquema, no a escala" y={1512} delay={Z.chip} />
    </Lienzo>
  );
};
