/**
 * «Los 3 códigos escondidos en tu vehículo» (IMNOBA · figuras realistas) · escenas 1/2
 *   aut-gancho  el medidor de gasolina y su flechita dorada: «no es de adorno»
 *   aut-tanque  la flecha indica el lado de la tapa del tanque: vehículo desde arriba con la manguera (izquierda y luego derecha)
 *   aut-llanta  código DOT: los cuatro últimos dígitos son la semana y el año de fabricación (zoom a la placa y calendario de 52 semanas)
 */
import React from "react";
import { AUT, TAT } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { Estudio, FONT, Frases, MONOF, RE } from "./real-kit";
import { Fuente } from "./real1";
import { Chip } from "./med1";
import { AU, AutoPlanta, Isla, Llanta, Medidor } from "./aut-kit";

type P = { e: EscenaViralGuardada };
const rp = (t: number, a: (x: number) => number, ini: number, dur: number): number => clamp((t - a(ini)) / a(dur));

/* ───────────── aut-gancho ───────────── */

export const AutGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TAT.gancho;
  const s = spr(f, a(T.medidor), { damping: 14, stiffness: 120, mass: 0.8 });
  const nivel = lerp(0.04, 0.6, easeInOut((t - a(0.3)) / a(1.7)));
  const pulso = rp(t, a, T.flecha, 0.5);
  return (
    <Estudio piso={1480} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(s * 2)} transform={`translate(0 ${(1 - s) * 60})`}>
          <Medidor x={540} y={900} r={390} nivel={nivel} lado="izq" pulso={pulso} t={t} />
        </g>
      </svg>
      <Frases frases={[{ t: 0.02, texto: "esa flechita", px: 92 }, { t: 2.2, texto: "no es de adorno", color: RE.oro, px: 84 }, { t: T.dos, texto: "+ 2 códigos escondidos", color: RE.hielo, px: 64 }]} y={352} ancho={860} />
      <Fuente texto="Tablero: la flecha junto al icono de la bomba de gasolina indica el lado de la tapa del tanque" delay={0.8} />
    </Estudio>
  );
};

/* ───────────── aut-tanque ───────────── */

export const AutTanque: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TAT.tanque;
  const segunda = t >= a(T.cambia);
  const lado: "izq" | "der" = segunda ? "der" : "izq";
  const dip = clamp(1 - Math.abs(t - a(T.cambia)) / 0.18);
  const sCar = spr(f, a(T.auto), { damping: 15, stiffness: 110, mass: 0.9 });
  const t0 = segunda ? T.cambia : 0;
  const puerta = segunda ? easeOut((t - a(T.puerta2)) / a(0.6)) : easeOut((t - a(T.puerta)) / a(0.6));
  const con = segunda ? easeInOut((t - a(T.manguera2)) / a(T.mangueraDur)) : easeInOut((t - a(T.manguera)) / a(T.mangueraDur));
  const pulso = rp(t, a, segunda ? T.cambia + 0.1 : T.flecha, 0.5);
  void t0;
  const sg = lado === "izq" ? -1 : 1;
  const CX = 540, CY = 1060, SC = 0.8;
  const dx = CX + sg * (126 * SC + 10), dy = CY + 158 * SC;
  return (
    <Estudio piso={1500} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={1 - dip * 0.9}>
          <g opacity={clamp(sCar * 2)} transform={`translate(0 ${(1 - sCar) * 160})`}>
            <AutoPlanta x={CX} y={CY} s={SC} color={segunda ? "#2E6BFF" : "#D9302A"} lado={lado} puerta={puerta} />
            <Isla x={CX + sg * 270} y={CY + 90} px={dx} py={dy} lado={lado} conectada={con} t={t} />
          </g>
          <Medidor x={540} y={600} r={170} nivel={0.6} lado={lado} pulso={Math.max(pulso, 0.4)} t={t} />
          {pulso > 0.3 && <polyline points={`${540 + sg * 70},690 ${540 + sg * 70},760 ${dx},${dy - 40}`} fill="none" stroke={AU.oro} strokeWidth={4} strokeDasharray="10 12" opacity={0.7 * pulso} />}
        </g>
      </svg>
      <Frases frases={[{ t: 0.02, texto: "mira la flecha", px: 84 }, { t: 1.6, texto: "ahí está la tapa", color: RE.oro, px: 80 }, { t: T.cambia + 0.2, texto: "o a la derecha", color: RE.hielo, px: 80 }]} y={352} ancho={860} />
      <Chip texto="tapa a la izquierda" x={W / 2} y={1420} color={RE.oro} id="aut-izq" ancho={560} opacidad={segunda ? 0 : rp(t, a, T.chip, 0.4)} />
      <Chip texto="tapa a la derecha" x={W / 2} y={1420} color={RE.hielo} id="aut-der" ancho={540} opacidad={segunda ? rp(t, a, T.chip2, 0.4) : 0} />
      <Fuente texto="La flecha junto al icono de la bomba marca el lado de la tapa · algunos modelos antiguos no la traen" delay={0.8} />
    </Estudio>
  );
};

/* ───────────── aut-llanta ───────────── */

export const AutLlanta: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TAT.llanta;
  const s = spr(f, a(T.llanta), { damping: 15, stiffness: 120, mass: 0.8 });
  const z = easeInOut((t - a(T.zoom)) / a(T.zoomDur));
  const zoom = lerp(1, 2.4, z), giro = lerp(0, 38, z);
  const luz = rp(t, a, T.luz, 0.5);
  const R = 400, X = 540, Y = 900;
  const fx = X + R * 0.5, fy = Y + R * 0.62;
  const cal = rp(t, a, T.calendario, 0.5);
  return (
    <Estudio piso={1500} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(s * 2)} transform={`translate(540 ${lerp(900, 1000, z)}) scale(${zoom}) rotate(${giro}) translate(${-fx} ${-lerp(Y, fy, z)})`}>
          <Llanta x={X} y={Y} R={R} luz={luz} fecha={AUT.dotEjemplo} rot={t * 4 * (1 - z)} />
        </g>
        {/* calendario de 52 semanas */}
        {cal > 0.01 && (
          <g opacity={cal} transform={`translate(${(W - 832) / 2} 1470)`}>
            {Array.from({ length: 52 }, (_, i) => <rect key={i} x={i * 16} y={0} width={12} height={i + 1 === AUT.semana ? 52 : 36} rx={3} fill={i + 1 === AUT.semana ? AU.oro : "#3C4F6B"} opacity={i + 1 === AUT.semana ? 1 : 0.85} />)}
          </g>
        )}
      </svg>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 520, background: "linear-gradient(to bottom, rgba(4,8,20,0.9) 0%, rgba(4,8,20,0.6) 60%, rgba(4,8,20,0) 100%)", pointerEvents: "none", opacity: z }} />
      <Frases frases={[{ t: 0.02, texto: "segundo código", px: 84 }, { t: 1.4, texto: "el DOT", color: RE.oro, px: 92 }, { t: 3.2, texto: "semana + año", color: RE.hielo, px: 84 }]} y={352} ancho={860} />
      <Chip texto="36 · semana 36" x={300} y={1300} color={AU.oro} id="aut-sem" ancho={430} opacidad={rp(t, a, T.chip1, 0.4)} />
      <Chip texto="24 · año 2024" x={780} y={1300} color={RE.hielo} id="aut-anio" ancho={420} opacidad={rp(t, a, T.chip2, 0.4)} />
      <div data-texto="aut-cal" style={{ position: "absolute", left: (W - 832) / 2, top: 1540, width: 832, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 24, color: RE.hielo, opacity: cal * 0.9 }}>las 52 semanas del año</div>
      <Fuente texto="Código DOT: los 4 últimos dígitos son semana y año de fabricación (llantas desde el 2000) · ejemplo ilustrativo" delay={0.8} />
    </Estudio>
  );
};
