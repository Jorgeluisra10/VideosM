/**
 * «El pegamento que no era pegamento» (SINAPSIS · figuras de microscopía) · escenas 1/2
 *   astro-gancho  el frasco de «pegamento» se agrieta, se rompe y de él sale una célula con forma de estrella
 *   astro-glia    «glía» = pegamento: la neurona rodeada de manchas de pegamento y el año del término (1856)
 *   astro-mitad   100 células cerebrales: ≈ la mitad son neuronas y ≈ la otra mitad no lo son
 */
import React from "react";
import { AST, TAS } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, mezclar, spr, useReloj } from "../comun";
import { mulberry32 } from "../../anim/piezas";
import { Estudio, Frases, MONOF, RE } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { AC, Astrocito, Frasco, Neurona, Pegote } from "./astro-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── astro-gancho ───────────── */

export const AstroGancho: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const entra = spr(f, a(TAS.gancho.frasco), { damping: 13, stiffness: 130, mass: 0.8 });
  const grieta = clamp((t - a(TAS.gancho.grieta)) / a(0.7));
  const rotura = easeOut((t - a(TAS.gancho.rotura)) / a(0.55));
  const brota = easeOut((t - a(TAS.gancho.estrella)) / a(0.95));
  const halo = clamp((t - a(TAS.gancho.rotura)) / a(0.4)) * clamp(1 - (t - a(TAS.gancho.rotura) - 0.4) / a(1.4));
  const temblor = grieta > 0 && rotura < 0.05 ? Math.sin(t * 90) * 2.2 * grieta : 0;
  return (
    <Estudio piso={1600} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><radialGradient id="astro-gan-halo"><stop offset="0" stopColor={AC.oro} stopOpacity="0.5" /><stop offset="0.6" stopColor={AC.oro} stopOpacity="0.16" /><stop offset="1" stopColor={AC.oro} stopOpacity="0" /></radialGradient></defs>
        <circle cx={540} cy={1060} r={440} fill="url(#astro-gan-halo)" opacity={halo} />
        <g transform={`translate(${temblor} ${(1 - entra) * 60})`} opacity={clamp(entra * 1.6)}>
          <Frasco x={540} y={1330} s={1.2} grieta={grieta} rotura={rotura} />
        </g>
        <Astrocito x={540} y={1050} s={0.92 * (0.55 + 0.45 * brota)} k={brota} t={t} opacidad={clamp(brota * 2.4)} luz={brota} />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "TE MINTIERON", color: RE.rojo, px: 118 }, { t: 1.15, texto: "la mitad de\ntu cerebro", px: 104 }, { t: 2.35, texto: "no es\npegamento", color: RE.oro, px: 116 }]} y={500} id="astro-gancho-t" />
    </Estudio>
  );
};

/* ───────────── astro-glia ───────────── */

/** Posiciones de las manchas de pegamento alrededor de la neurona (ángulo en grados, radio relativo). */
const PEGOTES = [{ g: 18, r: 150 }, { g: 76, r: 190 }, { g: 138, r: 160 }, { g: 202, r: 176 }, { g: 262, r: 150 }, { g: 326, r: 184 }];

export const AstroGlia: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const k = easeOut((t - a(TAS.glia.neurona)) / a(1.1));
  const anio = Math.round(1800 + (AST.anioGlia - 1800) * easeOut((t - a(TAS.glia.anio)) / a(TAS.glia.anioDur)));
  const NX = 540, NY = 960, S = 0.95;
  const etq = clamp((t - a(TAS.glia.etq)) / a(0.4));
  return (
    <Estudio piso={1600} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Neurona x={NX} y={NY} s={S} k={k} t={t} axon={clamp((t - a(0.6)) / a(1.2))} largoAxon={300} luz={0.5} />
        {PEGOTES.map((p, i) => {
          const ap = spr(f, a(TAS.glia.pegotes + i * 0.17), { damping: 11, stiffness: 160, mass: 0.7 });
          const ang = (p.g * Math.PI) / 180;
          return <Pegote key={i} x={NX + Math.cos(ang) * p.r * S} y={NY + Math.sin(ang) * p.r * S} r={36 + (i % 3) * 5} aparece={ap} gota={clamp((t - a(TAS.glia.pegotes + i * 0.17 + 0.3)) / a(1.2)) * 0.9} rot={i % 2 ? 10 : -10} />;
        })}
        {etq > 0 && <g opacity={etq}><path d={`M ${NX + 175} ${NY + 205} L ${NX + 260} ${NY + 285}`} stroke={RE.hielo} strokeOpacity={0.7} strokeWidth={2.5} fill="none" /></g>}
      </svg>
      <Chip texto="«pegamento»" x={NX + 290} y={NY + 305} color={RE.hielo} opacidad={etq} id="glia-chip" ancho={300} />
      <Frases frases={[{ t: 0.2, texto: "hace siglo\ny medio", px: 100 }, { t: 2.2, texto: "las llamaron\n«glía»", color: RE.oro, px: 104 }, { t: 3.2, texto: "= PEGAMENTO", color: RE.rojo, px: 100 }]} y={470} id="astro-glia-t" />
      <Dato valor={anio} x={W / 2} y={1330} px={118} digitos={4} sinSep id="glia-anio" color={AC.oro} etiqueta="primer uso del término «neuroglia»" opacidad={clamp((t - a(0.3)) / 0.5)} />
      <Fuente texto="Virchow, «Nervenkitt» (pegamento nervioso) · primer uso documentado de «neuroglia» (otras fuentes: 1858)" y={1486} delay={2.6} />
    </Estudio>
  );
};

/* ───────────── astro-mitad ───────────── */

const N_PUNTOS = 100;
const ESP = 64;

/** Qué puntos son neuronas: 50 de 100 (86,1 / 170,7 = 50,4 %), elegidos con una barajada determinista. */
const ES_NEURONA: boolean[] = (() => {
  const r = mulberry32(5);
  const idx = Array.from({ length: N_PUNTOS }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  const es = new Array(N_PUNTOS).fill(false);
  idx.slice(0, 50).forEach((i) => (es[i] = true));
  return es;
})();

export const AstroMitad: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const x0 = (W - ESP * 9) / 2, y0 = 600;
  const cNeu = clamp((t - a(TAS.mitad.cifras)) / a(1.4));
  const nNeu = Math.round(AST.neuronas * easeOut((t - a(TAS.mitad.cifras)) / a(1.5)));
  const nOtr = Math.round(AST.noNeuronales * easeOut((t - a(TAS.mitad.cifras + 0.2)) / a(1.5)));
  return (
    <Estudio piso={1600} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: N_PUNTOS }, (_, i) => {
          const col = i % 10, fila = Math.floor(i / 10);
          const nac = spr(f, a(TAS.mitad.puntos + (i / N_PUNTOS) * TAS.mitad.puntosDur), { damping: 12, stiffness: 190, mass: 0.6 });
          const neu = ES_NEURONA[i];
          const tNeu = a(TAS.mitad.neuronas + col * 0.04 + fila * 0.03), tOtr = a(TAS.mitad.otras + col * 0.035 + fila * 0.03);
          const pn = neu ? clamp((t - tNeu) / 0.3) : 0, po = !neu ? clamp((t - tOtr) / 0.3) : 0;
          const relleno = neu ? mezclar("#6F8BA8", AC.azul, pn) : mezclar("#6F8BA8", AC.oro, po);
          const brillo = neu ? mezclar("#B7C6D6", AC.azulClaro, pn) : mezclar("#B7C6D6", AC.oroClaro, po);
          const cx = x0 + col * ESP, cy = y0 + fila * ESP;
          const pop = 1 + 0.25 * (neu ? Math.sin(clamp((t - tNeu) / 0.3) * Math.PI) : Math.sin(clamp((t - tOtr) / 0.3) * Math.PI));
          return (
            <g key={i} transform={`translate(${cx} ${cy}) scale(${nac * pop})`}>
              <circle r={27} fill={neu ? AC.azul : AC.oro} opacity={0.14 * (neu ? pn : po)} />
              <circle r={21} fill={relleno} stroke={brillo} strokeWidth={2} />
              <ellipse cx={-6} cy={-7} rx={7} ry={4} fill="#fff" opacity={0.5} transform="rotate(-30 -6 -7)" />
            </g>
          );
        })}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "hoy sabemos", px: 96 }, { t: 1.4, texto: "casi la mitad", color: RE.oro, px: 112 }, { t: 3.7, texto: "NO son neuronas", color: RE.hielo, px: 96 }]} y={420} id="astro-mitad-t" />
      <div data-texto="mitad-lbl-a" style={{ position: "absolute", left: 104, top: 1232, fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: AC.azulClaro, opacity: cNeu }}>● neuronas</div>
      <Dato valor={nNeu} x={104} y={1312} px={58} digitos={11} alinear="left" color={AC.azulClaro} id="mitad-neu" opacidad={cNeu} />
      <div data-texto="mitad-lbl-b" style={{ position: "absolute", left: 104, top: 1370, fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: AC.oroClaro, opacity: cNeu }}>● células que no son neuronas (glía y otras)</div>
      <Dato valor={nOtr} x={104} y={1450} px={58} digitos={11} alinear="left" color={AC.oroClaro} id="mitad-otras" opacidad={cNeu} />
      <Fuente texto="Azevedo et al., J Comp Neurol 2009 · cerebro adulto (estimación)" y={1508} delay={3.4} />
    </Estudio>
  );
};
