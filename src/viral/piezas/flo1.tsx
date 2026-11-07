/**
 * «El piso que no existe» (IMNOBA · figuras realistas) · escenas 1/2
 *   flo-gancho  panel de ascensor que salta del 12 al 14: ¿adónde se fue el piso 13?
 *   flo-torre   el piso 13 sí existe en el edificio: solo lo rotulan 14
 *   flo-conteo  conteo de Manhattan: solo 55 de 629 edificios altos muestran un piso 13
 */
import React, { useMemo } from "react";
import { FLO, TFL, rotuloPiso } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { H, W, clamp, easeInOut, easeOut, spr, useReloj } from "../comun";
import { Estudio, Frases, MONOF, RE } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { Cuadricula, Edificio, FL, Indicador, PanelAscensor, type Boton } from "./flo-kit";

type P = { e: EscenaViralGuardada };
const rp = (t: number, a: (x: number) => number, ini: number, dur: number): number => clamp((t - a(ini)) / a(dur));

/* ───────────── flo-gancho ───────────── */

export const FloGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TFL.gancho;
  const s = spr(f, a(T.panel), { damping: 15, stiffness: 120, mass: 0.8 });
  const catorce = t >= a(T.catorce), doce = t >= a(T.doce);
  const piso = catorce ? "14" : doce ? "12" : "11";
  const l = (k: number, ini: number): number => clamp(1 - (t - a(ini + k)) * 0.9);
  const botones: Boton[] = [
    { n: "15" }, { n: "14", luz: catorce ? 1 : 0 }, { n: null }, { n: "12", luz: doce ? (catorce ? 0.2 : 1) : 0 }, { n: "11", luz: t < a(T.doce) ? 1 : 0.15 }, { n: "10" }, { n: "9" },
  ];
  return (
    <Estudio piso={1580} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(s * 2)} transform={`translate(0 ${(1 - s) * 60})`}>
          <Indicador x={540} y={440} texto={piso} dir={catorce || doce ? 1 : 0} t={t} />
          <PanelAscensor x={540} y={640} botones={botones} paso={110} r={42} fantasma={rp(t, a, T.fantasma, 0.5)} t={t} />
        </g>
        {void l}
      </svg>
      <Frases frases={[{ t: 0.02, texto: "mira este ascensor", px: 80 }, { t: 2.0, texto: "salta del 12 al 14", color: RE.oro, px: 78 }, { t: T.pregunta, texto: "¿dónde está el 13?", color: FL.rojo, px: 88 }]} y={352} ancho={860} />
      <Fuente texto="Ascensor sin botón 13: ocurre en muchos edificios del mundo · ilustración" delay={0.8} />
    </Estudio>
  );
};

/* ───────────── flo-torre ───────────── */

export const FloTorre: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TFL.torre;
  const N = 16;
  const hasta = easeInOut((t - a(T.sube)) / a(T.subeDur)) * N;
  const rot = rp(t, a, T.rotulos, 0.4);
  const rotulos = Array.from({ length: N }, (_, i) => (rot > 0.5 ? String(rotuloPiso(i + 1)) : ""));
  const trece = rp(t, a, T.trece, 0.5);
  const s = spr(f, a(T.torre), { damping: 15, stiffness: 110, mass: 0.9 });
  return (
    <Estudio piso={1500} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(s * 2)}>
          <Edificio x={330} y={1420} w={330} alto={880} n={N} rotulos={rotulos} resalta={trece > 0.1 ? 12 : -1} hasta={hasta} brillo={trece} reales />
        </g>
      </svg>
      <div data-texto="flo-real" style={{ position: "absolute", left: 130, top: 470, width: 200, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: RE.hielo, opacity: rp(t, a, T.trece, 0.3) }}>piso real</div>
      <div data-texto="flo-boton" style={{ position: "absolute", left: 700, top: 470, width: 260, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: RE.oro, opacity: rot }}>en el botón</div>
      <Frases frases={[{ t: 0.02, texto: "sí existe", px: 96 }, { t: 1.8, texto: "solo lo llaman 14", color: RE.oro, px: 80 }, { t: 3.6, texto: "evitan el 13", color: FL.rojo, px: 84 }]} y={352} ancho={860} />
      <Chip texto="el piso 13 está ahí" x={W / 2} y={1520} color={RE.oro} id="flo-existe" ancho={560} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Muchos edificios rotulan 14 el piso que físicamente es el 13 (superstición) · esquema" delay={0.8} />
    </Estudio>
  );
};

/* ───────────── flo-conteo ───────────── */

export const FloConteo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TFL.conteo;
  const COLS = 37, FILAS = 17, LADO = 25;
  const dorados = useMemo(() => {
    const orden = Array.from({ length: COLS * FILAS }, (_, i) => i).sort((p, q) => azar(p * 3.1 + 7) - azar(q * 3.1 + 7));
    return new Set(orden.slice(0, FLO.manhattan.conTrece));
  }, []);
  const ap = rp(t, a, T.cuadros, T.cuadrosDur);
  const marca = rp(t, a, T.dorados, T.doradosDur);
  const cuenta = Math.round(FLO.manhattan.conTrece * marca);
  return (
    <Estudio piso={1500} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Cuadricula x={(W - COLS * LADO) / 2} y={640} cols={COLS} filas={FILAS} lado={LADO} aparece={ap} dorados={dorados} marca={marca} />
      </svg>
      <Frases frases={[{ t: 0.02, texto: "un conteo en Manhattan", px: 70 }, { t: 1.8, texto: "629 edificios altos", px: 76 }, { t: 3.4, texto: "solo 55 muestran un 13", color: RE.oro, px: 64 }]} y={352} ancho={860} />
      <Dato valor={cuenta} x={W / 2} y={1210} px={150} digitos={2} sufijo={` de ${FLO.manhattan.total}`} id="flo-55" opacidad={clamp((t - a(T.dorados)) / 0.4)} />
      <Chip texto="menos del 9 %" x={W / 2} y={1400} color={RE.oro} id="flo-9" ancho={440} opacidad={rp(t, a, T.chip, 0.4)} />
      <Fuente texto="Conteo de City Realty citado por 99 % Invisible: 55 de 629 edificios de Manhattan con 13 o más pisos rotulan un piso 13" delay={0.8} />
    </Estudio>
  );
};
