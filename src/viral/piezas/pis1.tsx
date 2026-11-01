/**
 * «La piscina que cuelga entre dos edificios» (SINAPSIS · ingeniería extrema) · escenas 1/2
 *   pis-gancho   dos torres isométricas con halftone, el hueco de ≈ 15 m a 35 m y 150 t de agua que llenan el rectángulo trazado a mano
 *   pis-vidrio   viga de vidrio que cede y se fractura (azul eléctrico, ILUSTRACIÓN) y el acrílico que la reemplaza (bermellón con halftone); barras de densidad
 *   pis-acrilico sección en U con tres potenciómetros: espesor de la pared, espesor del fondo y flecha relativa (δ ∝ 1/I, esquema cualitativo)
 *   pis-union    papel: dos bloques que se unen con una junta adhesiva transparente y rayos que se doblan menos entre agua y acrílico (Snell)
 */
import React, { useMemo } from "react";
import { PIS, TPIS, inerciaU } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, LineaCap, MONO, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { AN, Knob, Lienzo, PuntosSemitono } from "./anom-ui";
import { Garabato, Nota, Pie, Texto, ovaloMano } from "./dig-kit";
import { CajaIso, CaraHT, Cota, Grietas, PS, mkIso } from "./pis-kit";
import { suave } from "./pte-kit";
import { Frases } from "./real-kit";

type P = { e: EscenaViralGuardada };

const Cap: React.FC<{ e: EscenaViralGuardada; color?: string }> = ({ e, color }) => (e.cap ? <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={color ?? AN.papel} /> : null);

/* ───────────── pis-gancho ───────────── */

export const PisGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TPIS.gancho;
  const iso = useMemo(() => mkIso(390, 1030, 54), []);
  const kt = spr(f, a(G.torres), { damping: 15, stiffness: 90, mass: 1 });
  const kc = clamp((t - a(G.cota)) / a(0.5));
  const kr = clamp((t - a(G.rect)) / a(G.rectDur));
  const ka = easeOut((t - a(G.agua)) / a(G.aguaDur));
  const ZT = 7.2 * kt;
  const pool = { x0: 2.4, y0: 0.5, dx: 3.6, dy: 1.0, z0: 5.6, dz: 1.0 };
  const lazo = (z: number): string => { const q = [iso(pool.x0, pool.y0, z), iso(pool.x0 + pool.dx, pool.y0, z), iso(pool.x0 + pool.dx, pool.y0 + pool.dy, z), iso(pool.x0, pool.y0 + pool.dy, z), iso(pool.x0, pool.y0, z)]; return q.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" "); };
  const sp = (x: number, y: number, z: number) => iso(x, y, z);
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <CajaIso iso={iso} x0={0} y0={0} z0={0} dx={2.4} dy={2} dz={Math.max(0.01, ZT)} color={AN.papel} ht={{ x: 0.22, y: 0.4, top: 0.06 }} />
        {/* el rectángulo trazado en el vacío */}
        <g opacity={kt}>
          <Garabato d={lazo(pool.z0)} k={kr} color={AN.lima} grosor={5} />
          <Garabato d={lazo(pool.z0 + pool.dz)} k={kr} color={AN.lima} grosor={5} />
          {[[pool.x0, pool.y0], [pool.x0 + pool.dx, pool.y0], [pool.x0 + pool.dx, pool.y0 + pool.dy], [pool.x0, pool.y0 + pool.dy]].map(([x, y], i) => {
            const a1 = sp(x, y, pool.z0), b1 = sp(x, y, pool.z0 + pool.dz);
            return <line key={i} x1={a1[0]} y1={a1[1]} x2={b1[0]} y2={b1[1]} stroke={AN.lima} strokeWidth={4.5} strokeDasharray="8 8" opacity={clamp(kr * 3)} />;
          })}
        </g>
        {ka > 0.02 && <CajaIso iso={iso} x0={pool.x0 + 0.06} y0={pool.y0 + 0.06} z0={pool.z0 + 0.06} dx={pool.dx - 0.12} dy={pool.dy - 0.12} dz={Math.max(0.01, (pool.dz - 0.2) * ka)} color={PS.agua} ht={{ x: 0.5, y: 0.7, top: 0.35 }} fill={0.25} paso={14} />}
        <CajaIso iso={iso} x0={6} y0={0} z0={0} dx={2.4} dy={2} dz={Math.max(0.01, ZT)} color={AN.papel} ht={{ x: 0.22, y: 0.4, top: 0.06 }} />
        {/* cotas */}
        <g opacity={kc}>
          <Cota a={[250, 1084]} b={[250, 695]} k={kc} />
          <Cota a={sp(2.4, 2.0, 4.9)} b={sp(6, 2.0, 4.9)} k={kc} />
        </g>
      </svg>
      <Cap e={e} />
      <Frases id="titular-gancho" y={430} frases={[{ px: 96, t: 0.2, texto: "35 METROS\nDE ALTURA" }, { px: 92, t: 2.5, texto: "150 TONELADAS\nDE AGUA", color: PS.agua }]} />
      <Texto texto="35 m" x={184} y={890} px={36} color={AN.lima} delay={G.cota} peso={800} id="gancho-h" />
      <Texto texto="≈ 15 m de aire" x={560} y={1020} px={30} color={AN.lima} delay={G.cota + 0.2} peso={800} id="gancho-span" rot={11} />
      <Nota texto="≈ 150 t de agua · 25 m de largo" x={540} y={1395} color={PS.agua} delay={G.chip} px={23} id="gancho-nota" />
      <Pie texto={"Sky Pool, Embassy Gardens (Londres) · esquema, no a escala"} y={1500} delay={G.chip} />
    </Lienzo>
  );
};

/* ───────────── pis-vidrio ───────────── */

const XA = 300, XB = 780, YT = 800, GR = 70;
const sagY = (x: number, s: number): number => { const u = (x - XA) / (XB - XA); return s * 4 * u * (1 - u); };
const vigaPoly = (s: number, rot = 0, lado: "izq" | "der" | "todo" = "todo"): [number, number][] => {
  const xs = lado === "izq" ? [XA, (XA + XB) / 2] : lado === "der" ? [(XA + XB) / 2, XB] : [XA, XB];
  const n = 12, arriba: [number, number][] = [], abajo: [number, number][] = [];
  for (let i = 0; i <= n; i++) { const x = lerp(xs[0], xs[1], i / n); arriba.push([x, YT + sagY(x, s)]); abajo.push([x, YT + GR + sagY(x, s)]); }
  const poli = [...arriba, ...abajo.reverse()];
  if (!rot) return poli;
  const px = lado === "izq" ? XA : XB, py = YT + GR, c = Math.cos(rot), sn = Math.sin(rot);
  return poli.map(([x, y]) => [px + (x - px) * c - (y - py) * sn, py + (x - px) * sn + (y - py) * c] as [number, number]);
};
const SHARDS = Array.from({ length: 12 }, (_, i) => ({ x: XA + 40 + ((i * 97) % 400), vx: ((i * 53) % 90) - 45, vy: -60 + ((i * 37) % 80), rot: ((i * 61) % 360) * 0.017, vr: ((i * 29) % 11) - 5, tam: 18 + ((i * 13) % 26) }));

export const PisVidrio: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const V = TPIS.vidrio;
  const viga = easeOut((t - a(V.viga)) / a(0.6));
  const carga = easeInOut((t - a(V.carga)) / a(V.cargaDur));
  const tr = t - a(V.rompe);
  const rompio = tr > 0;
  const acril = spr(f, a(V.acril), { damping: 13, stiffness: 120, mass: 0.9 });
  const dens = easeOut((t - a(V.dens)) / a(0.8));
  const sagV = 46 * carga;
  const caer = Math.max(0, tr);
  const flash = rompio ? Math.max(0, 1 - tr / 0.25) : 0;
  const sagA = 9 * clamp(acril * 1.2);
  const polyV = (lado: "izq" | "der") => vigaPoly(sagV, lado === "izq" ? Math.min(1.1, caer * caer * 2.2) : -Math.min(1.1, caer * caer * 2.2), lado);
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={viga}>
          <rect x={120} y={YT} width={180} height={330} fill={AN.papel} fillOpacity={0.08} stroke={AN.papel} strokeWidth={3.5} />
          <rect x={780} y={YT} width={180} height={330} fill={AN.papel} fillOpacity={0.08} stroke={AN.papel} strokeWidth={3.5} />
          <PuntosSemitono x0={120} y0={YT} w={180} h={330} paso={16} rMax={6} color={AN.papel} opacidad={0.6} campo={() => 0.35} />
          <PuntosSemitono x0={780} y0={YT} w={180} h={330} paso={16} rMax={6} color={AN.papel} opacidad={0.6} campo={() => 0.35} />
        </g>
        {/* agua */}
        {!rompio && viga > 0.02 && (
          <g>
            <PuntosSemitono x0={XA + 20} y0={YT - 100 - 4} w={XB - XA - 40} h={110 + sagV} paso={14} rMax={8} color={PS.agua} opacidad={0.8 * viga} campo={() => 0.6} recorte={(x, y) => y > YT - 98 + sagY(x, sagV) - 2 && y < YT + sagY(x, sagV) + 2} />
          </g>
        )}
        {/* vidrio */}
        {!rompio && viga > 0.02 && <CaraHT p={vigaPoly(sagV)} color={PS.fallo} k={0.12} fill={0.16} paso={18} grosor={5} opacidad={viga} />}
        {!rompio && viga > 0.02 && <CaraHT p={[[XA, YT - 100], [XA + 20, YT - 100], [XA + 20, YT], [XA, YT]]} color={PS.fallo} k={0} fill={0.2} grosor={4} opacidad={viga} />}
        {!rompio && viga > 0.02 && <CaraHT p={[[XB - 20, YT - 100], [XB, YT - 100], [XB, YT], [XB - 20, YT]]} color={PS.fallo} k={0} fill={0.2} grosor={4} opacidad={viga} />}
        {!rompio && carga > 0.7 && <Grietas x={540} y={YT + GR / 2 + sagV} k={suave(carga, 0.7, 1)} color={PS.falloTexto} n={5} largo={60} grosor={3} semilla={2} />}
        {/* fractura */}
        {rompio && (
          <g opacity={clamp(1 - caer / 1.4)}>
            <CaraHT p={polyV("izq")} color={PS.fallo} k={0.12} fill={0.16} paso={18} grosor={5} />
            <CaraHT p={polyV("der")} color={PS.fallo} k={0.12} fill={0.16} paso={18} grosor={5} />
            {SHARDS.map((s, i) => {
              const x = s.x + s.vx * caer, y = YT + 40 + s.vy * caer + 520 * caer * caer, r = s.rot + s.vr * caer;
              return <polygon key={i} points={`0,${-s.tam} ${s.tam * 0.8},${s.tam * 0.6} ${-s.tam * 0.7},${s.tam * 0.5}`} transform={`translate(${x} ${y}) rotate(${(r * 180) / Math.PI})`} fill={PS.fallo} fillOpacity={0.25} stroke={PS.falloTexto} strokeWidth={3} />;
            })}
          </g>
        )}
        {flash > 0 && <rect x={XA} y={YT - 20} width={XB - XA} height={GR + 60} fill={PS.falloTexto} opacity={0.3 * flash} />}
        {rompio && <Grietas x={540} y={YT + 40} k={clamp(tr / 0.4)} color={PS.falloTexto} n={9} largo={200} grosor={5} semilla={5} />}
        {/* acrílico: la pieza correcta */}
        {acril > 0.02 && (
          <g opacity={clamp(acril * 2)} transform={`translate(0 ${(1 - acril) * -120})`}>
            <PuntosSemitono x0={XA + 20} y0={YT - 100} w={XB - XA - 40} h={110 + sagA} paso={14} rMax={8} color={PS.agua} opacidad={0.8} campo={() => 0.6} recorte={(x, y) => y > YT - 98 + sagY(x, sagA) - 2 && y < YT + sagY(x, sagA) + 2} />
            <CaraHT p={vigaPoly(sagA)} color={PS.acrilico} k={0.5} fill={0.2} paso={13} rMax={7} grosor={6} />
            <CaraHT p={[[XA, YT - 100], [XA + 24, YT - 100], [XA + 24, YT], [XA, YT]]} color={PS.acrilico} k={0.4} fill={0.25} paso={13} grosor={5} />
            <CaraHT p={[[XB - 24, YT - 100], [XB, YT - 100], [XB, YT], [XB - 24, YT]]} color={PS.acrilico} k={0.4} fill={0.25} paso={13} grosor={5} />
          </g>
        )}
        {/* barras de densidad */}
        <rect x={120} y={1236} width={Math.max(0.1, 780 * dens * 1)} height={26} rx={4} fill={PS.falloTexto} opacity={0.9} />
        <rect x={120} y={1308} width={Math.max(0.1, 780 * dens * (PIS.densAcrilico / PIS.densVidrio))} height={26} rx={4} fill={PS.acrilico} />
      </svg>
      <Cap e={e} />
      <Frases id="titular-vidrio" y={430} frases={[{ px: 90, t: 0.2, texto: "¿Y SI FUERA\nDE VIDRIO?", color: PS.falloTexto }, { px: 90, t: 4.0, texto: "ACRÍLICO", color: PS.acrilico }]} />
      <Texto texto="vidrio ≈ 2,6 g/cm³" x={120} y={1212} px={21} color={PS.falloTexto} alinear="left" delay={V.dens} peso={700} id="vidrio-dv" />
      <Texto texto="acrílico ≈ 1,2 g/cm³: menos de la mitad" x={120} y={1282} px={21} color={PS.acrilico} alinear="left" delay={V.dens + 0.2} peso={700} id="vidrio-da" />
      <Nota texto="ilustración: más pesado, más frágil, menos claro" x={540} y={1380} color={AN.papel} delay={V.chip} px={21} id="vidrio-nota" />
      <Pie texto={"Eckersley O'Callaghan (vía RIBA J) · esquema, no una simulación"} y={1490} delay={V.chip} />
    </Lienzo>
  );
};

/* ───────────── pis-acrilico ───────────── */

const BU = 3.4, HU = 3.4, PXM = 104;
const I0 = inerciaU(0.05, 0.10, BU, HU);

export const PisAcrilico: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const A = TPIS.acrilico;
  const corte = spr(f, a(A.corte), { damping: 14, stiffness: 110, mass: 0.9 });
  const knobs = easeOut((t - a(A.knobs)) / a(0.6));
  const kl = easeInOut((t - a(A.lat)) / a(A.latDur)), kf = easeInOut((t - a(A.fondo)) / a(A.fondoDur));
  const tw = lerp(0.05, PIS.paredMm / 1000, kl), tb = lerp(0.1, PIS.fondoMm / 1000, kf);
  const rel = I0 / inerciaU(tw, tb, BU, HU);
  const cx = 540, cy = 790, ow = BU * PXM, oh = HU * PXM;
  const x0 = cx - ow / 2, y0 = cy - oh / 2;
  const twp = tw * PXM, tbp = tb * PXM;
  const U: [number, number][] = [[x0, y0], [x0 + twp, y0], [x0 + twp, y0 + oh - tbp], [x0 + ow - twp, y0 + oh - tbp], [x0 + ow - twp, y0], [x0 + ow, y0], [x0 + ow, y0 + oh], [x0, y0 + oh]];
  const fl = clamp((t - a(A.flecha)) / a(0.8));
  const BX0 = 190, BX1 = 890, BY = 1135, sag = 64 * rel;
  const viga = Array.from({ length: 29 }, (_, i) => { const u = i / 28; return `${BX0 + (BX1 - BX0) * u},${BY + sag * 4 * u * (1 - u)}`; }).join(" ");
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(corte * 2)}>
          <PuntosSemitono x0={x0 + twp} y0={y0 + oh * 0.12} w={ow - 2 * twp} h={oh * 0.88 - tbp} paso={14} rMax={7} color={PS.agua} opacidad={0.75} campo={() => 0.55} />
          <CaraHT p={U} color={PS.acrilico} k={0.55} fill={0.28} paso={12} rMax={6.5} grosor={5} />
          <Cota a={[x0 + ow + 36, y0 + oh - tbp]} b={[x0 + ow + 36, y0 + oh]} color={AN.lima} k={knobs} />
          <Cota a={[x0, y0 - 34]} b={[x0 + twp, y0 - 34]} color={AN.lima} k={knobs} />
        </g>
        {/* viga: flecha exagerada */}
        <rect x={BX0 - 70} y={BY - 8} width={70} height={110} fill={AN.papel} fillOpacity={0.1} stroke={AN.papel} strokeWidth={3} opacity={fl} />
        <rect x={BX1} y={BY - 8} width={70} height={110} fill={AN.papel} fillOpacity={0.1} stroke={AN.papel} strokeWidth={3} opacity={fl} />
        <polyline points={viga} fill="none" stroke={PS.acrilico} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" opacity={fl} />
        <line x1={BX0} y1={BY} x2={BX1} y2={BY} stroke={AN.papel} strokeOpacity={0.4} strokeWidth={2} strokeDasharray="6 9" opacity={fl} />
        <Knob cx={210} cy={1385} r={62} valor={0.1 + (tw - 0.05) * 5} etiqueta="1 · PARED" lectura={`${Math.round(tw * 100)} cm`} aparece={knobs} />
        <Knob cx={540} cy={1385} r={62} valor={0.1 + (tb - 0.1) * 2.5} etiqueta="2 · FONDO" lectura={`${Math.round(tb * 100)} cm`} aparece={knobs} />
        <Knob cx={870} cy={1385} r={62} valor={clamp(rel)} etiqueta="3 · FLECHA" lectura={`${Math.round(rel * 100)} %`} aparece={knobs} color={PS.acrilico} />
      </svg>
      <Cap e={e} />
      <Frases id="titular-acrilico" y={430} frases={[{ px: 84, t: 0.2, texto: "FLEXIONA MÁS:\nPOR ESO ES GRUESO" }]} />
      <Texto texto="δ ∝ 1 / (E · I)" x={540} y={1270} px={28} color={AN.lima} delay={A.flecha} peso={800} id="acril-formula" />
      <Nota texto="≈ ¼ de la resistencia · ≈ 20× más flecha que el vidrio" x={540} y={1218} color={PS.acrilico} delay={A.chip} px={21} id="acril-nota" />
      <Pie texto="la flecha (3) es el resultado de los espesores (1 y 2) · sección ilustrativa" y={1512} delay={A.chip} />
    </Lienzo>
  );
};

/* ───────────── pis-union (papel) ───────────── */

const AGUA_PAPEL = "#0A8FCC";
const snell = (n1: number, n2: number, th1: number): number => (Math.asin((n1 * Math.sin((th1 * Math.PI) / 180)) / n2) * 180) / Math.PI;

export const PisUnion: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const U = TPIS.union;
  const bl = spr(f, a(U.bloques), { damping: 14, stiffness: 120, mass: 0.9 });
  const junta = easeOut((t - a(U.junta)) / a(0.5));
  const iny = clamp((t - a(U.inyecta)) / a(0.9));
  const borra = easeOut((t - a(U.borra)) / a(0.8));
  const ry = easeOut((t - a(U.rayos)) / a(1.0));
  const th = 40, aireAcr = snell(1, PIS.nAcrilico, th), aguaAcr = snell(PIS.nAgua, PIS.nAcrilico, th);
  const rayo = (x0: number, y0: number, th2: number, k: number, color: string): React.ReactNode => {
    const L = 150, ax = x0 - Math.sin((th * Math.PI) / 180) * L, ay = y0 - Math.cos((th * Math.PI) / 180) * L;
    const bx = x0 + Math.sin((th2 * Math.PI) / 180) * L * k, by = y0 + Math.cos((th2 * Math.PI) / 180) * L * k;
    return <g><line x1={ax} y1={ay} x2={x0} y2={y0} stroke={color} strokeWidth={5} strokeLinecap="round" /><line x1={x0} y1={y0} x2={bx} y2={by} stroke={color} strokeWidth={5} strokeLinecap="round" /></g>;
  };
  return (
    <Lienzo modo="papel">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(bl * 2)} transform={`translate(0 ${(1 - bl) * 40})`}>
          <CaraHT p={[[150, 650], [525 - 8 * (1 - borra), 650], [525 - 8 * (1 - borra), 830], [150, 830]]} color={PS.acrilico} k={0.5} fill={0.22} paso={13} rMax={6.5} grosor={5} />
          <CaraHT p={[[555 + 8 * (1 - borra), 650], [930, 650], [930, 830], [555 + 8 * (1 - borra), 830]]} color={PS.acrilico} k={0.5} fill={0.22} paso={13} rMax={6.5} grosor={5} />
        </g>
        {/* junta adhesiva: línea oscura que se vuelve transparente */}
        <rect x={525 - 8 * (1 - borra)} y={650} width={30 + 16 * (1 - borra)} height={180} fill={AN.tinta} opacity={0.85 * junta * (1 - borra)} />
        {iny > 0 && iny < 1 && Array.from({ length: 4 }, (_, i) => <circle key={i} cx={540} cy={640 - 40 + ((iny * 3 + i * 0.5) % 1) * 150 + i * 4} r={6} fill={AN.lima} stroke={AN.tinta} strokeWidth={2} />)}
        {junta > 0.1 && <Garabato d={ovaloMano(540, 740, 80, 130, 2)} k={borra} color={AN.tinta} grosor={5} />}
        {/* refracción */}
        <line x1={170} y1={1030} x2={470} y2={1030} stroke={AN.tinta} strokeWidth={4} />
        <line x1={610} y1={1030} x2={910} y2={1030} stroke={AN.tinta} strokeWidth={4} />
        <line x1={320} y1={900} x2={320} y2={1160} stroke={AN.tinta} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="5 8" />
        <line x1={760} y1={900} x2={760} y2={1160} stroke={AN.tinta} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="5 8" />
        <rect x={170} y={1030} width={300} height={130} fill={PS.acrilico} fillOpacity={0.12 * ry} />
        <rect x={610} y={1030} width={300} height={130} fill={PS.acrilico} fillOpacity={0.12 * ry} />
        <g opacity={ry}>{rayo(320, 1030, aireAcr, ry, AN.tinta)}{rayo(760, 1030, aguaAcr, ry, AGUA_PAPEL)}</g>
      </svg>
      <Cap e={e} color={AN.tinta} />
      <Frases id="titular-union" y={430} frases={[{ px: 90, t: 0.2, texto: "UNA JUNTA\nTRANSPARENTE", color: AN.tinta }]} />
      <Texto texto="adhesivo en la junta: sin tornillos" x={540} y={880} px={22} color={AN.tinta} delay={U.junta} peso={700} id="union-j" />
      <Texto texto="aire → acrílico" x={320} y={1250} px={22} color={AN.tinta} delay={U.rayos} peso={700} id="union-a" />
      <Texto texto="agua → acrílico" x={760} y={1250} px={22} color={AGUA_PAPEL} delay={U.rayos} peso={700} id="union-b" />
      <Texto texto={`${Math.round(th)}° → ${Math.round(aireAcr)}°  (se dobla más)`} x={320} y={1200} px={21} color={AN.tinta} delay={U.rayos + 0.4} peso={700} id="union-ta" />
      <Texto texto={`${Math.round(th)}° → ${Math.round(aguaAcr)}°  (casi recto)`} x={760} y={1200} px={21} color={AGUA_PAPEL} delay={U.rayos + 0.4} peso={700} id="union-tb" />
      <Texto texto={`n agua ≈ ${String(PIS.nAgua).replace(".", ",")} · n acrílico ≈ ${String(PIS.nAcrilico).replace(".", ",")}`} x={540} y={1330} px={26} color={AN.tinta} delay={U.chip} peso={800} id="union-n" />
      <Pie texto={"juntas adhesivas, no «fusión molecular» · RIBA J · esquema"} y={1440} delay={U.chip} color={AN.tinta} />
    </Lienzo>
  );
};
