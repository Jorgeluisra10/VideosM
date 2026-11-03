/**
 * «El laboratorio bacteriano bajo tu terreno» (IMNOBA · corte geométrico en plano continuo) · escenas 1/2
 *   sep-gancho     bajo un terreno aislado hay un laboratorio de bacterias (avance del sistema completo)
 *   sep-pozo       el pozo cavado sin más: el agua sucia se filtra, huele y puede llegar a la napa y al pozo de agua
 *   sep-idea       convertirlo en una planta de tratamiento con tres etapas (las paredes se arman con facetas)
 *   sep-decanta    etapa 1 · cámara de decantación: lo pesado se hunde, la grasa flota, en medio queda agua más clara
 *   sep-bacterias  bacterias anaerobias: se comen parte de los sólidos y sueltan gas
 *   sep-camara2    segunda cámara, más tranquila: se asienta el resto de las partículas
 */
import React from "react";
import { TSE } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { W, clamp, useReloj } from "../comun";
import { Frases, RE } from "./real-kit";
import { Fuente } from "./real1";
import { Chip } from "./med1";
import { TC } from "./tmd-kit";
import { Cielo, Mundo, camT, est, proy, type Cam, type Estado } from "./sep-kit";

type P = { e: EscenaViralGuardada };

/** Rótulo pegado a un punto del mundo (solo si cae dentro de la zona segura de la pantalla). */
export const ChipW: React.FC<{ cam: Cam; wx: number; wy: number; texto: string; color?: string; op?: number; id: string }> = ({ cam, wx, wy, texto, color = RE.hielo, op = 1, id }) => {
  const [x, y] = proy(cam, wx, wy);
  const ancho = Math.min(760, texto.length * 17 + 74);
  if (op < 0.03 || x - ancho / 2 < 90 || x + ancho / 2 > 990 || y < 230 || y > 1590) return null;
  return <Chip texto={texto} x={x} y={y} color={color} id={id} ancho={ancho} opacidad={op} />;
};

/** Rótulos grandes en mayúscula, centrados arriba (como los del video de referencia): una a tres palabras que cambian con la narración. */
export const Titulos: React.FC<{ frases: { t: number; texto: string; color?: string; px?: number }[] }> = ({ frases }) => (
  <>
    {/* bandas oscuras arriba y abajo: dan contraste al rótulo y a la fuente sobre el dibujo */}
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 470, background: "linear-gradient(to bottom, rgba(4,6,22,0.88) 0%, rgba(4,6,22,0.55) 55%, rgba(4,6,22,0) 100%)", pointerEvents: "none" }} />
    <div style={{ position: "absolute", left: 0, bottom: 0, width: W, height: 400, background: "linear-gradient(to top, rgba(4,6,22,0.85) 0%, rgba(4,6,22,0.5) 60%, rgba(4,6,22,0) 100%)", pointerEvents: "none" }} />
    <Frases frases={frases.map((f) => ({ ...f, texto: f.texto.toUpperCase(), px: f.px ?? 78 }))} y={340} x={W / 2} ancho={900} alinear="center" id="sep-titulo" />
  </>
);

export const rp = (t: number, a: (x: number) => number, ini: number, dur: number): number => clamp((t - a(ini)) / a(dur));
const LLENO: Partial<Estado> = { muros: 1, capas: 1, bact: 1, cam2: 1, vent: 1, trampa: 1, grava: 1, filtra: 1, napa: 1, limpio: 1, uso: 1 };

/* ───────────── sep-gancho ───────────── */

export const SepGancho: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const T = TSE.gancho;
  const cam = camT(t, a(0.5), a(4.2), { x: 540, y: 440, z: 0.92 }, { x: 640, y: 960, z: 1.0 });
  return (
    <Cielo>
      <Mundo t={t} cam={cam} e={est(LLENO)} />
      <Titulos frases={[{ t: T.cartel, texto: "bajo tu terreno" }, { t: T.lab, texto: "un laboratorio", color: RE.oro }, { t: T.bact, texto: "de bacterias", color: TC.cian }]} />
      <Fuente texto="Esquema geométrico de un sistema séptico con lecho de grava · no es una foto" delay={0.8} />
    </Cielo>
  );
};

/* ───────────── sep-pozo ───────────── */

export const SepPozo: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const T = TSE.pozo;
  const cam = camT(t, a(3.0), a(5.2), { x: 620, y: 860, z: 1.3 }, { x: 1250, y: 1010, z: 0.56 });
  const fuga = rp(t, a, T.fuga, T.fugaDur);
  const es = est({ uso: 1, olor: rp(t, a, T.huele, 0.8), fuga, limpio: 1 - clamp((fuga - 0.88) / 0.12) });
  return (
    <Cielo>
      <Mundo t={t} cam={cam} e={es} />
      <Titulos frases={[{ t: 0.1, texto: "un pozo sin más" }, { t: 2.0, texto: "bomba de tiempo", color: TC.magenta }, { t: 4.2, texto: "se filtra" }, { t: 5.4, texto: "huele", color: "#8DFF7A" }, { t: 6.4, texto: "llega a la napa", color: RE.oro }]} />
      <ChipW cam={cam} wx={900} wy={1388} texto="napa (agua subterránea)" op={rp(t, a, T.napa, 0.5)} id="sep-napa" color={RE.hielo} />
      <Fuente texto="Un pozo ciego recibe el agua sin tratar y puede contaminar la napa · esquema" delay={0.8} />
    </Cielo>
  );
};

/* ───────────── sep-idea ───────────── */

export const SepIdea: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const T = TSE.idea;
  const cam = camT(t, a(0.2), a(5.0), { x: 600, y: 860, z: 1.25 }, { x: 760, y: 850, z: 0.95 });
  const es = est({ uso: 1, muros: rp(t, a, T.muros, T.murosDur), olor: 1 - rp(t, a, 0.3, 1.5) });
  return (
    <Cielo>
      <Mundo t={t} cam={cam} e={es} />
      <Titulos frases={[{ t: 0.1, texto: "no lo tapes" }, { t: 1.9, texto: "conviértelo", color: RE.oro }, { t: 3.5, texto: "en una planta", color: TC.cian }]} />
      <Chip texto="1 · decantar" x={W / 2} y={1400} color={RE.oro} id="sep-e1" ancho={440} opacidad={rp(t, a, T.e1, 0.4)} />
      <Chip texto="2 · lecho de grava" x={W / 2} y={1470} color={TC.cian} id="sep-e2" ancho={500} opacidad={rp(t, a, T.e2, 0.4)} />
      <Chip texto="3 · la tierra" x={W / 2} y={1540} color={TC.magenta} id="sep-e3" ancho={440} opacidad={rp(t, a, T.e3, 0.4)} />
      <Fuente texto="Cámaras sépticas con lecho de infiltración: sistema habitual en terrenos sin alcantarillado" delay={0.8} />
    </Cielo>
  );
};

/* ───────────── sep-decanta ───────────── */

export const SepDecanta: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const T = TSE.decanta;
  const cam = camT(t, a(0.2), a(7.4), { x: 590, y: 860, z: 2.0 }, { x: 590, y: 885, z: 2.35 });
  const es = est({ uso: 1, muros: 1, capas: rp(t, a, T.capas, T.capasDur) });
  return (
    <Cielo>
      <Mundo t={t} cam={cam} e={es} />
      <Titulos frases={[{ t: 0.1, texto: "cámara 1" }, { t: 1.4, texto: "lo pesado se hunde", color: "#C9A66B" }, { t: 3.4, texto: "la grasa flota", color: "#F4E9B8" }, { t: 5.4, texto: "en medio: agua clara", color: TC.cian, px: 70 }]} />
      <ChipW cam={cam} wx={595} wy={716} texto="grasa" color="#F4E9B8" op={rp(t, a, T.chip2, 0.4)} id="sep-c-grasa" />
      <ChipW cam={cam} wx={595} wy={820} texto="agua más clara" color={TC.cian} op={rp(t, a, T.chip3, 0.4)} id="sep-c-clara" />
      <ChipW cam={cam} wx={595} wy={955} texto="lodo" color="#C9A66B" op={rp(t, a, T.chip1, 0.4)} id="sep-c-lodo" />
      <Fuente texto="En el tanque los sólidos se hunden (lodo), las grasas flotan (nata) y el agua queda en medio · EPA" delay={0.8} />
    </Cielo>
  );
};

/* ───────────── sep-bacterias ───────────── */

export const SepBacterias: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const T = TSE.bacterias;
  const cam = camT(t, a(0.2), a(7.0), { x: 590, y: 940, z: 3.5 }, { x: 590, y: 955, z: 3.9 });
  const es = est({ uso: 1, muros: 1, capas: 1, vent: 1, bact: rp(t, a, T.bact, T.bactDur) });
  return (
    <Cielo>
      <Mundo t={t} cam={cam} e={es} />
      <Titulos frases={[{ t: 0.1, texto: "sin oxígeno" }, { t: 1.6, texto: "bacterias anaerobias", color: TC.cian, px: 70 }, { t: 3.8, texto: "se comen los sólidos", color: TC.magenta, px: 68 }, { t: 5.8, texto: "y sueltan gas", color: "#8DFF7A" }]} />
      <Chip texto="gas" x={W / 2} y={1500} color="#8DFF7A" id="sep-gas" ancho={220} opacidad={rp(t, a, T.gas, 0.4)} />
      <Fuente texto="Las bacterias anaerobias digieren parte de los sólidos y producen gas · los bichos son una caricatura" delay={0.8} />
    </Cielo>
  );
};

/* ───────────── sep-camara2 ───────────── */

export const SepCamara2: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const T = TSE.camara2;
  const cam = camT(t, a(0.2), a(5.2), { x: 700, y: 850, z: 1.6 }, { x: 840, y: 840, z: 1.85 });
  const es = est({ uso: 1, muros: 1, capas: 1, vent: 1, bact: 1, cam2: rp(t, a, T.paso, T.pasoDur) });
  return (
    <Cielo>
      <Mundo t={t} cam={cam} e={es} />
      <Titulos frases={[{ t: 0.1, texto: "cámara 2" }, { t: 1.8, texto: "más tranquila", color: TC.cian }, { t: 3.6, texto: "se asienta el resto", color: RE.oro, px: 70 }]} />
      <ChipW cam={cam} wx={830} wy={900} texto="agua más clara" color={TC.cian} op={rp(t, a, T.chip, 0.4)} id="sep-c2-clara" />
      <Fuente texto="Tanques de dos cámaras: la segunda deja asentar más partículas antes de la salida · esquema" delay={0.8} />
    </Cielo>
  );
};
