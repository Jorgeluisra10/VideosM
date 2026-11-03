/**
 * «El laboratorio bacteriano bajo tu terreno» (IMNOBA · corte geométrico en plano continuo) · escenas 2/2
 *   sep-olores  trampa de agua bajo el inodoro y tubo de ventilación: sin olores
 *   sep-grava   etapa 2 · el agua sale a un lecho de grava donde otras bacterias siguen limpiándola
 *   sep-suelo   etapa 3 · la tierra termina el trabajo y el agua llega a la napa mucho más limpia (el pozo de agua sigue limpio)
 *   sep-mant    no es magia: camión que vacía los lodos cada 3 a 5 años; sin cloro ni aceite
 *   sep-lote    si compras un terreno sin alcantarillado, pregunta por su sistema y revisa la norma (cierre)
 */
import React from "react";
import { TSE } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { W, clamp, useReloj } from "../comun";
import { RE } from "./real-kit";
import { Fuente } from "./real1";
import { Chip } from "./med1";
import { TC } from "./tmd-kit";
import { Cielo, Mundo, camT, est, type Estado } from "./sep-kit";
import { ChipW, Titulos, rp } from "./sep1";

type P = { e: EscenaViralGuardada };
const LLENO: Partial<Estado> = { muros: 1, capas: 1, bact: 1, cam2: 1, vent: 1, trampa: 1, grava: 1, filtra: 1, napa: 1, limpio: 1, uso: 1 };

/* ───────────── sep-olores ───────────── */

export const SepOlores: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const T = TSE.olores;
  const cam = camT(t, a(1.8), a(3.2), { x: 340, y: 570, z: 2.4 }, { x: 700, y: 470, z: 1.55 });
  const es = est({ uso: 1, muros: 1, capas: 1, bact: 1, cam2: 1, trampa: rp(t, a, T.trampa, 0.8), vent: rp(t, a, T.vent, 0.8) });
  return (
    <Cielo>
      <Mundo t={t} cam={cam} e={es} />
      <Titulos frases={[{ t: 0.1, texto: "sin olores" }, { t: 1.4, texto: "trampa de agua", color: TC.cian }, { t: 3.4, texto: "ventilación", color: "#8DFF7A" }]} />
      <ChipW cam={cam} wx={340} wy={668} texto="trampa de agua" color={TC.cian} op={rp(t, a, T.chip1, 0.4) * (1 - rp(t, a, 1.9, 0.3))} id="sep-o-trampa" />
      <ChipW cam={cam} wx={G_VENT} wy={252} texto="el gas sale por aquí" color="#8DFF7A" op={rp(t, a, T.chip2, 0.4)} id="sep-o-vent" />
      <Fuente texto="Trampa de agua (sifón) y ventilación: el gas sale por el techo y no por la casa · esquema" delay={0.8} />
    </Cielo>
  );
};
const G_VENT = 712;

/* ───────────── sep-grava ───────────── */

export const SepGrava: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const T = TSE.grava;
  const cam = camT(t, a(0.2), a(5.2), { x: 1290, y: 840, z: 1.5 }, { x: 1300, y: 880, z: 1.8 });
  const es = est({ uso: 1, muros: 1, capas: 1, bact: 1, cam2: 1, vent: 1, trampa: 1, grava: rp(t, a, T.grava, T.gravaDur), filtra: rp(t, a, T.filtra, 0.8) });
  return (
    <Cielo>
      <Mundo t={t} cam={cam} e={es} />
      <Titulos frases={[{ t: 0.1, texto: "etapa 2" }, { t: 1.4, texto: "lecho de grava", color: "#C6CCD4" }, { t: 3.6, texto: "más bacterias", color: "#B6FF3D" }]} />
      <ChipW cam={cam} wx={1300} wy={788} texto="bacterias sobre las piedras" color="#B6FF3D" op={rp(t, a, T.chip, 0.4)} id="sep-g-bact" />
      <Fuente texto="Zanja de infiltración con grava: el agua se reparte y una película de bacterias la sigue tratando · esquema" delay={0.8} />
    </Cielo>
  );
};

/* ───────────── sep-suelo ───────────── */

export const SepSuelo: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const T = TSE.suelo;
  const cam = camT(t, a(0.4), a(5.4), { x: 1300, y: 1010, z: 1.05 }, { x: 1620, y: 1160, z: 0.64 });
  const es = est({ ...LLENO, napa: rp(t, a, T.napa, T.napaDur) });
  return (
    <Cielo>
      <Mundo t={t} cam={cam} e={es} />
      <Titulos frases={[{ t: 0.1, texto: "etapa 3" }, { t: 1.4, texto: "la tierra" }, { t: 3.0, texto: "termina el trabajo", color: RE.oro, px: 70 }, { t: 4.8, texto: "mucho más limpia", color: TC.cian, px: 72 }]} />
      <ChipW cam={cam} wx={1300} wy={1262} texto="arena y tierra filtran" color="#C9A66B" op={rp(t, a, 1.6, 0.4) * (1 - rp(t, a, 3.6, 0.3))} id="sep-s-tierra" />
      <ChipW cam={cam} wx={1500} wy={1420} texto="napa" color={RE.hielo} op={rp(t, a, T.napa + 0.8, 0.4)} id="sep-s-napa" />
      <ChipW cam={cam} wx={2000} wy={536} texto="pozo de agua limpio" color={TC.cian} op={rp(t, a, T.pozo, 0.4)} id="sep-s-pozo" />
      <Fuente texto="Bien diseñado, lejos de pozos y de la napa y con mantenimiento, reduce mucho el riesgo · no elimina todo" delay={0.8} />
    </Cielo>
  );
};

/* ───────────── sep-mant ───────────── */

const Prohibido: React.FC<{ x: number; y: number; k: number; tipo: "botella" | "gota" }> = ({ x, y, k, tipo }) => (
  <g opacity={clamp(k * 2)} transform={`translate(${x} ${y}) scale(${0.8 + 0.2 * k})`}>
    <circle r={78} fill="#0B1030" stroke="#FF4D5E" strokeWidth={8} opacity={0.9} />
    {tipo === "botella" ? (
      <g><polygon points="-18,-40 18,-40 18,-18 30,-4 30,40 -30,40 -30,-4 -18,-18" fill="#E6EEF7" stroke="#9FB0C8" strokeWidth={3} /><polygon points="-30,6 30,6 30,30 -30,30" fill="#3DB8E6" opacity={0.7} /><rect x={-14} y={-52} width={28} height={12} fill={TC.oro} /></g>
    ) : (
      <g><polygon points="0,-44 30,6 22,34 0,44 -22,34 -30,6" fill="#E0A400" stroke="#FFE27A" strokeWidth={3} /><polygon points="-8,-10 4,-10 -2,24 -14,24" fill="#FFFFFF" opacity={0.35} /></g>
    )}
    <line x1={-58} y1={-58} x2={58} y2={58} stroke="#FF4D5E" strokeWidth={10} strokeLinecap="round" />
  </g>
);

export const SepMant: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const T = TSE.mant;
  const cam = camT(t, a(0.2), a(7.0), { x: 660, y: 520, z: 1.5 }, { x: 700, y: 740, z: 1.2 });
  const es = est({ ...LLENO, camion: rp(t, a, T.camion, T.camionDur) });
  const k = rp(t, a, T.prohibido, 0.5);
  return (
    <Cielo>
      <Mundo t={t} cam={cam} e={es} />
      {k > 0.01 && (
        <svg width={W} height={1920} viewBox={`0 0 ${W} 1920`} style={{ position: "absolute", inset: 0 }}>
          <Prohibido x={350} y={1440} k={k} tipo="botella" />
          <Prohibido x={730} y={1440} k={clamp(k * 1.4 - 0.2)} tipo="gota" />
        </svg>
      )}
      <Titulos frases={[{ t: 0.1, texto: "no es magia" }, { t: 1.8, texto: "vacía los lodos", color: "#C9A66B" }, { t: 3.8, texto: "cada 3 a 5 años", color: RE.oro }, { t: 5.5, texto: "sin cloro ni aceite", color: "#FF4D5E", px: 70 }]} />
      <Chip texto="cloro" x={350} y={1550} color="#FF8A93" id="sep-m-cloro" ancho={220} opacidad={rp(t, a, T.prohibido + 0.1, 0.4)} />
      <Chip texto="aceite" x={730} y={1550} color="#FF8A93" id="sep-m-aceite" ancho={240} opacidad={rp(t, a, T.prohibido + 0.3, 0.4)} />
      <Fuente texto="Vaciar lodos cada 3 a 5 años es lo habitual para una familia (EPA); depende del tamaño y del uso" delay={0.8} />
    </Cielo>
  );
};

/* ───────────── sep-lote ───────────── */

export const SepLote: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const T = TSE.lote;
  const cam = camT(t, a(0.2), a(6.8), { x: 880, y: 800, z: 0.6 }, { x: 760, y: 740, z: 0.68 });
  const es = est({ ...LLENO, lote: rp(t, a, T.letrero, 0.9) });
  return (
    <Cielo>
      <Mundo t={t} cam={cam} e={es} />
      <Titulos frases={[{ t: 0.1, texto: "¿compras un lote?" }, { t: 2.4, texto: "pregunta por su sistema", color: RE.oro, px: 68 }, { t: 4.8, texto: "y revisa la norma", color: TC.cian }]} />
      <Chip texto="✓ qué sistema tiene" x={W / 2} y={1400} color={RE.oro} id="sep-l1" ancho={620} opacidad={rp(t, a, T.c1, 0.4)} />
      <Chip texto="✓ distancia a la napa y a pozos" x={W / 2} y={1470} color={TC.cian} id="sep-l2" ancho={720} opacidad={rp(t, a, T.c2, 0.4)} />
      <Chip texto="✓ mantenimiento y norma local" x={W / 2} y={1540} color={TC.magenta} id="sep-l3" ancho={700} opacidad={rp(t, a, T.c3, 0.4)} />
      <Fuente texto="Información general, no asesoría: consulta la norma y a un profesional de tu zona" delay={0.8} />
    </Cielo>
  );
};
