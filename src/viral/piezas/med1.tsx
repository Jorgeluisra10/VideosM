/**
 * «Médicos que se probaron a sí mismos» (v4 · figuras médicas realistas) · escenas 1/3
 *   med-gancho  tres médicos, su propio cuerpo como laboratorio: sonda, caldo con bacterias, bisturí y espejo bajo una lámpara
 *   med-sonda1  Alemania 1929: Forssmann cree que se llega al corazón por una vena (radiografía con la ruta imaginada)
 *   med-sonda2  la sonda avanza por la vena hasta la aurícula derecha y la radiografía lo confirma
 *   med-nobel1  1956: la medalla Nobel de Medicina por el cateterismo cardíaco
 */
import React from "react";
import { MED, TM } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Estudio, FONT, Frases, MONOF, RE, Reflejo } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Bisturi, Espejo, Lampara, MC, Medalla, Radiografia, Vaso } from "./med-kit";

type P = { e: EscenaViralGuardada };

/** Etiqueta mono en cápsula (rótulo corto de una figura). */
export const Chip: React.FC<{ texto: string; x: number; y: number; color?: string; opacidad?: number; ancho?: number; id?: string }> = ({ texto, x, y, color = RE.hielo, opacidad = 1, ancho = 360, id = "chip" }) => (
  <div data-texto={id} style={{ position: "absolute", left: x - ancho / 2, top: y, width: ancho, transform: "translateY(-50%)", textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 26, letterSpacing: "0.04em", color, opacity: opacidad, whiteSpace: "nowrap" }}>
    <span style={{ display: "inline-block", padding: "8px 22px", borderRadius: 999, border: `2px solid ${color}`, background: "rgba(8,18,31,0.72)" }}>{texto}</span>
  </div>
);

/** Catéter enrollado (sonda) con la punta luminosa. */
const Sonda: React.FC<{ x: number; y: number; s?: number; k?: number }> = ({ x, y, s = 1, k = 1 }) => {
  const largo = 700 * clamp(k);
  const d = "M -120 60 C -190 20 -150 -90 -60 -80 C 40 -70 40 40 -30 52 C -80 60 -90 0 -50 -14 C -20 -24 0 8 -26 18 L 70 70 L 150 10";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={d} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={22} strokeLinecap="round" transform="translate(5 9)" strokeDasharray={`${largo} 2000`} />
      <path d={d} fill="none" stroke="#E7F2FA" strokeWidth={18} strokeLinecap="round" strokeDasharray={`${largo} 2000`} />
      <path d={d} fill="none" stroke="#fff" strokeOpacity={0.85} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${largo} 2000`} transform="translate(-3 -4)" />
      <circle cx={150} cy={10} r={10} fill={MC.rx} opacity={clamp(k * 3) * 0.9} />
    </g>
  );
};

/* ───────────── med-gancho ───────────── */

export const MedGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const PISO = 1300;
  const sSonda = spr(f, a(TM.gancho.sonda), { damping: 14, stiffness: 120, mass: 0.8 });
  const sVaso = spr(f, a(TM.gancho.vaso), { damping: 14, stiffness: 120, mass: 0.8 });
  const sBis = spr(f, a(TM.gancho.bisturi), { damping: 14, stiffness: 120, mass: 0.8 });
  const kSonda = easeOut((t - a(TM.gancho.sonda)) / a(1.6));
  const flicker = 0.85 + 0.15 * Math.sin(t * 7) * Math.sin(t * 2.3);
  const luz = (s: number): number => clamp(s * 2);
  return (
    <Estudio piso={PISO} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Lampara x={540} y={700} alto={PISO - 700} ancho={900} intensidad={0.55 * flicker} cable={110} />
        <Reflejo piso={PISO} intensidad={0.18}>
          <g opacity={luz(sSonda)} transform={`translate(0 ${(1 - sSonda) * -40})`}><Sonda x={270} y={PISO - 110} s={1.1} k={kSonda} /></g>
          <g opacity={luz(sVaso)} transform={`translate(0 ${(1 - sVaso) * -40})`}><Vaso x={545} y={PISO} s={1.05} nivel={0.78} t={t} /></g>
          <g opacity={luz(sBis)} transform={`translate(0 ${(1 - sBis) * -40})`}>
            <Espejo x={800} y={PISO - 200} s={0.82} rot={-8} />
            <Bisturi x={940} y={PISO - 190} s={0.7} rot={18} />
          </g>
        </Reflejo>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "3 médicos", px: 128 }, { t: 1.5, texto: "su propio cuerpo", color: RE.oro, px: 100 }, { t: 2.7, texto: "como laboratorio", px: 96 }, { t: 8.9, texto: "2 ganaron\nun Nobel", color: MC.oroMed, px: 100 }]} y={400} />
      <Chip texto="1 · un tubo" x={240} y={1410} opacidad={luz(sSonda)} id="gancho-1" ancho={290} />
      <Chip texto="2 · una bacteria" x={545} y={1410} opacidad={luz(sVaso)} id="gancho-2" ancho={320} color={MC.verdeBac} />
      <Chip texto="3 · un apéndice" x={880} y={1410} opacidad={luz(sBis)} id="gancho-3" ancho={320} color={RE.rojo} />
      <Fuente texto="Forssmann (1929) · Marshall (1984) · Rogozov (1961) — relatos publicados; ver fuentes en cada escena" delay={2} />
    </Estudio>
  );
};

/* ───────────── med-sonda1 ───────────── */

export const MedSonda1: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const S = 0.88;
  const ruta = easeInOut((t - a(TM.sonda1.ruta)) / a(TM.sonda1.rutaDur));
  const pulso = Math.sin(t * 7.2) > 0.6 ? 1 : 0;
  const anio = 1900 + 29 * easeOut((t - a(0.4)) / a(1.8));
  return (
    <Estudio piso={1360} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp((t - 0.2) / 0.5)}><Radiografia x={(W - 820 * S) / 2} y={535} s={S} pulso={pulso} progreso={0} ruta={ruta} marca="D" /></g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "Alemania", px: 112 }, { t: 2.4, texto: "llegar al corazón\npor una vena", color: RE.oro, px: 84 }, { t: 6.9, texto: "su jefe dijo:\n«no»", color: RE.rojo, px: 100 }, { t: 8.3, texto: "lo hizo igual", px: 96 }]} y={405} />
      <Dato valor={anio} x={W / 2} y={1470} px={150} digitos={4} sinSep id="sonda1-anio" opacidad={clamp((t - 0.3) / 0.5)} />
      <Fuente texto="NobelPrize.org · Werner Forssmann, biografía (autocateterismo cardíaco, 1929)" y={1626} delay={3.4} />
    </Estudio>
  );
};

/* ───────────── med-sonda2 ───────────── */

export const MedSonda2: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const S = 0.88;
  const k = easeInOut((t - a(TM.sonda2.ini)) / a(TM.sonda2.dur));
  const pulso = Math.sin(t * 7.2) > 0.6 ? 1 : 0;
  const flash = clamp(1 - Math.abs(t - a(TM.sonda2.flash)) / a(0.45)) * (t > a(TM.sonda2.flash) - a(0.45) ? 1 : 0);
  const llego = spr(f, a(TM.sonda2.flash), { damping: 11, stiffness: 180, mass: 0.6 });
  const caminar = clamp((t - a(6.1)) / a(2.4));
  return (
    <Estudio piso={1360} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Radiografia x={(W - 820 * S) / 2} y={535} s={S} pulso={pulso} progreso={k} ruta={0.25 * (1 - k)} destello={flash} marca="D" />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "se anestesió\nel brazo", px: 92 }, { t: 1.9, texto: "abrió una vena", color: RE.rojo, px: 100 }, { t: 3.3, texto: "sonda → corazón", color: RE.oro, px: 98 }, { t: 6.2, texto: "caminó hasta\nrayos X", px: 92 }, { t: 8.7, texto: "¡llegó!", color: RE.esmeralda, px: 134 }]} y={405} />
      <Chip texto="aurícula derecha" x={W / 2} y={1470} color={RE.oro} opacidad={clamp((t - a(TM.sonda2.ini + TM.sonda2.dur)) / 0.5)} id="sonda2-aur" ancho={420} />
      <div data-texto="sonda2-paso" style={{ position: "absolute", left: 104, width: W - 208, top: 1520, textAlign: "left", fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: RE.hielo, opacity: 0.8 * clamp(caminar * 3) * (1 - clamp((t - a(8.6)) / 0.3)) }}>… caminando hacia el departamento de radiología con la sonda dentro</div>
      <div data-texto="sonda2-ok" style={{ position: "absolute", left: 104, width: W - 208, top: 1520, textAlign: "left", fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: RE.esmeralda, opacity: clamp(llego * 2) }}>RADIOGRAFÍA: sonda en la aurícula derecha ✔</div>
      <Fuente texto="Forssmann, Klin. Wochenschr. 1929 · NobelPrize.org (biografía de Forssmann)" y={1626} delay={4} />
    </Estudio>
  );
};

/* ───────────── med-nobel1 ───────────── */

export const MedNobel1: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const entrada = spr(f, a(TM.nobel1.medalla), { damping: 12, stiffness: 120, mass: 0.9 });
  const brillo = clamp((t - a(TM.nobel1.medalla + 0.8)) / a(1.6));
  const anio = 1900 + 56 * easeOut((t - a(TM.nobel1.anio)) / a(1.6));
  return (
    <Estudio piso={1250} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Reflejo piso={1250} intensidad={0.2}>
          <Medalla x={W / 2} y={1010} r={215} anio="1956" brillo={brillo} entrada={entrada} />
        </Reflejo>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "lo criticaron", color: RE.rojo, px: 112 }, { t: 1.6, texto: "y terminó\nde urólogo", px: 92 }, { t: 3.3, texto: "pero nació el\ncateterismo cardíaco", color: RE.oro, px: 78 }, { t: 6.9, texto: "Nobel de Medicina", color: MC.oroMed, px: 100 }]} y={405} />
      <Dato valor={anio} x={W / 2} y={1440} px={130} digitos={4} sinSep id="nobel1-anio" color={MC.oroMed} opacidad={clamp((t - a(TM.nobel1.anio)) / 0.4)} />
      <div data-texto="nobel1-comp" style={{ position: "absolute", left: 104, width: W - 208, top: 1536, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: RE.hielo, opacity: 0.85 * clamp((t - a(TM.nobel1.anio + 1)) / 0.5) }}>compartido con Cournand y Richards</div>
      <Fuente texto="NobelPrize.org · Premio Nobel de Fisiología o Medicina 1956 (Cournand, Forssmann, Richards: cateterismo cardíaco)" y={1610} delay={7} />
    </Estudio>
  );
};
