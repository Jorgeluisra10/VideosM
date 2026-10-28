/**
 * «El pegamento que no era pegamento» (SINAPSIS · figuras de microscopía) · escenas 2/2
 *   astro-estrella  el astrocito crece como estrella, sus puntas se iluminan una a una y el contador llega a 2 millones de sinapsis (estimación)
 *   astro-dialogo   la sinapsis tripartita: la neurona libera señal, el astrocito la «escucha» (onda de calcio) y la conexión se ajusta
 *   astro-memoria   en ratones, reactivar los astrocitos que se activaron al aprender estimuló el recuerdo
 */
import React from "react";
import { AST, TAS } from "../../anim/piezas";
import { useUid } from "../../estudio/util";
import type { EscenaViralGuardada } from "../../anim/viral";
import { W, H, clamp, easeOut, mezclar, useReloj } from "../comun";
import { Estudio, Frases, RE } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { AC, Astrocito, Neurona, geoCelula, OPC_ASTRO } from "./astro-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── astro-estrella ───────────── */

export const AstroEstrella: React.FC<P> = () => {
  const { t, a } = useReloj();
  const E = TAS.estrella;
  const k = easeOut((t - a(E.crece)) / a(E.creceDur));
  const n = geoCelula(OPC_ASTRO).puntas.length;
  const cuenta = easeOut((t - a(E.cuenta)) / a(E.cuentaDur));
  const sinapsis = Math.round(AST.sinapsisMax * cuenta);
  return (
    <Estudio piso={1600} resplandor={0.45}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><radialGradient id="astro-est-halo"><stop offset="0" stopColor={AC.oro} stopOpacity="0.2" /><stop offset="0.6" stopColor={AC.oro} stopOpacity="0.08" /><stop offset="1" stopColor={AC.oro} stopOpacity="0" /></radialGradient></defs>
        <circle cx={540} cy={880} r={440} fill="url(#astro-est-halo)" opacity={k} />
        <Astrocito
          x={540} y={880} s={0.98 * (0.5 + 0.5 * k)} k={k} t={t} luz={clamp((t - a(E.sinapsis)) / a(1))} opacidad={clamp(k * 3)}
          puntasLuz={(i) => clamp((t - a(E.sinapsis + (((i * 7) % n) / n) * 1.6)) / a(0.35))}
        />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "un solo astrocito", px: 88 }, { t: 1.5, texto: "forma de estrella", color: RE.oro, px: 88 }, { t: 3.2, texto: "abraza sinapsis", color: RE.hielo, px: 96 }]} y={340} id="astro-estrella-t" />
      <Dato valor={sinapsis} x={W / 2} y={1290} px={100} digitos={7} color={AC.oroClaro} id="estrella-n" etiqueta="sinapsis: estimación máxima en humanos" opacidad={clamp((t - a(E.cuenta - 0.1)) / 0.4)} />
      <Fuente texto="Oberheim et al., J Neurosci 2009 · estimación: 270.000 a 2 millones en humanos (20.000–120.000 en roedores)" y={1476} delay={3.4} />
    </Estudio>
  );
};

/* ───────────── astro-dialogo ───────────── */

const PRE = "M 468 470 L 468 620 C 468 650 400 690 396 770 C 392 850 470 890 540 890 C 610 890 688 850 684 770 C 680 690 612 650 612 620 L 612 470 Z";
const POST = "M 396 960 C 440 940 640 940 684 960 C 700 1040 650 1090 630 1160 L 630 1250 L 450 1250 L 450 1160 C 430 1090 380 1040 396 960 Z";
const PROC_D = "M 1120 560 C 960 640 850 760 760 880 C 722 930 720 975 748 1008 C 790 1056 860 1130 960 1210";
const RAMITAS = ["M 836 800 C 880 780 900 740 940 730", "M 790 850 C 850 850 880 830 930 850", "M 800 1090 C 850 1070 900 1080 940 1050", "M 740 1010 C 700 1040 690 1080 650 1100"];
const VESICULAS = [{ x: 500, y: 818 }, { x: 540, y: 842 }, { x: 580, y: 818 }];

export const AstroDialogo: React.FC<P> = () => {
  const { t, a } = useReloj();
  const uid = useUid();
  const D = TAS.dialogo;
  const entra = easeOut((t - a(0.05)) / a(0.7));
  const ves = [0, 1, 2].map((i) => clamp((t - a(D.vesiculas + i * 0.45)) / a(0.75)));
  const onda = clamp((t - a(D.calcio)) / a(1.1));
  const forta = clamp((t - a(D.fortalece)) / a(0.5));
  const pulso = forta > 0 ? 0.5 + 0.5 * Math.sin((t - a(D.fortalece)) * 7) : 0;
  const luzFlujo = (d: string, lado: number) => (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={AC.oroOscuro} strokeOpacity={0.35} strokeWidth={46} />
      <path d={d} stroke={AC.oro} strokeWidth={30} />
      <path d={d} stroke={AC.oroClaro} strokeOpacity={0.8} strokeWidth={9} />
      {onda > 0 && onda < 1 && <path d={d} pathLength={1} stroke="#fff" strokeWidth={15} strokeOpacity={0.85} strokeDasharray="0.12 2" strokeDashoffset={0.12 - onda * 1.12} />}
      {onda > 0 && onda < 1 && (
        <circle cx={lado} cy={950} r={26 + onda * 96} stroke={AC.azulClaro} strokeWidth={4} strokeOpacity={0.9 * (1 - onda)} />
      )}
    </g>
  );
  return (
    <Estudio piso={1600} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`${uid}n1`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={AC.azulClaro} /><stop offset="0.55" stopColor={AC.azul} /><stop offset="1" stopColor={AC.azulOscuro} /></linearGradient>
        </defs>
        <g transform={`translate(0 ${110 + (1 - entra) * 40})`} opacity={clamp(entra * 1.6)}>
          {luzFlujo(PROC_D, 735)}
          <g fill="none" strokeLinecap="round" stroke={AC.oro}>{RAMITAS.map((d, i) => <path key={i} d={d} strokeWidth={13 - i * 2} />)}</g>
          <path d={PRE} fill={`url(#${uid}n1)`} stroke={AC.azulClaro} strokeOpacity={0.8} strokeWidth={4} />
          <path d={POST} fill={`url(#${uid}n1)`} stroke={AC.azulClaro} strokeOpacity={0.8} strokeWidth={4 + 3 * forta} />
          <ellipse cx={500} cy={720} rx={46} ry={20} fill="#fff" opacity={0.14} transform="rotate(-20 500 720)" />
          {[[500, 790], [580, 790], [520, 760], [566, 762], [540, 815]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={10} fill={AC.azulOscuro} stroke={AC.azulClaro} strokeOpacity={0.6} strokeWidth={2} opacity={0.75} />)}
          {forta > 0 && <ellipse cx={540} cy={925} rx={150 + 40 * pulso} ry={34 + 10 * pulso} fill={AC.hielo} opacity={0.3 * forta * (0.5 + 0.5 * pulso)} />}
          {VESICULAS.map((v, i) => {
            const p = ves[i];
            if (p <= 0 || p >= 1) return null;
            const y = v.y + p * (1020 - v.y);
            const sal = clamp((p - 0.7) / 0.3);
            return (
              <g key={i} opacity={1 - sal}>
                <circle cx={v.x} cy={y} r={20} fill={AC.hielo} opacity={0.3} />
                <circle cx={v.x} cy={y} r={9} fill="#fff" stroke={AC.azulClaro} strokeWidth={2} />
                {[-16, 16].map((d, j) => <circle key={j} cx={v.x + d} cy={y - 22 - j * 8} r={4} fill={AC.hielo} opacity={0.7 * (1 - p)} />)}
              </g>
            );
          })}
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "no son\nespectadoras", px: 88 }, { t: 1.7, texto: "escuchan a\nlas neuronas", color: RE.oro, px: 88 }, { t: 3.0, texto: "y ayudan a\nregular", color: RE.hielo, px: 88 }]} y={330} id="astro-dialogo-t" />
      <Chip texto="neurona emisora" x={240} y={880} color={AC.azulClaro} ancho={300} id="dialogo-emisora" opacidad={entra} />
      <Chip texto="neurona receptora" x={240} y={1250} color={AC.azulClaro} ancho={300} id="dialogo-receptora" opacidad={entra} />
      <Chip texto="astrocito" x={850} y={590} color={AC.oroClaro} ancho={240} id="dialogo-astro" opacidad={entra} />
      <Chip texto="la señal se ajusta" x={W / 2} y={1440} color={AC.oroClaro} ancho={420} id="dialogo-ajusta" opacidad={forta} />
      <Fuente texto="Araque et al., Trends Neurosci 1999: «sinapsis tripartita» (neurona emisora + receptora + astrocito)" y={1486} delay={3.2} />
    </Estudio>
  );
};

/* ───────────── astro-memoria ───────────── */

const ASTROS_ACTIVOS = [{ x: 300, y: 880 }, { x: 790, y: 840 }];
const BURBUJA = { x: 540, y: 1010 };

export const AstroMemoria: React.FC<P> = () => {
  const { t, a } = useReloj();
  const uid = useUid();
  const M = TAS.memoria;
  const entra = easeOut((t - a(0.05)) / a(0.8));
  const flash = clamp((t - a(M.activa)) / a(0.45));
  const brilla = flash > 0 ? 0.55 + 0.45 * Math.sin(Math.min(1, flash) * Math.PI) : 0;
  const enlaces = clamp((t - a(M.enlaces)) / a(0.8));
  const burbuja = easeOut((t - a(M.recuerdo)) / a(0.6));
  const base = 0.2 + 0.3 * entra;
  return (
    <Estudio piso={1600} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id={`${uid}ha`}><stop offset="0" stopColor={AC.oro} stopOpacity="0.42" /><stop offset="0.55" stopColor={AC.oro} stopOpacity="0.16" /><stop offset="1" stopColor={AC.oro} stopOpacity="0" /></radialGradient>
          <radialGradient id={`${uid}bu`} cx="40%" cy="35%" r="80%"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.5" stopColor={AC.oroClaro} /><stop offset="1" stopColor={AC.oro} /></radialGradient>
        </defs>
        <Neurona x={540} y={740} s={0.36} k={entra} t={t} axon={0} opacidad={0.9 * entra} luz={0.3} />
        <Neurona x={540} y={1320} s={0.38} k={entra} t={t} axon={0} opacidad={0.9 * entra} luz={0.3} giro={20} />
        <Astrocito x={210} y={1230} s={0.4} k={entra} t={t + 1} opacidad={0.5 * entra} />
        <Astrocito x={870} y={1250} s={0.4} k={entra} t={t + 2} opacidad={0.5 * entra} giro={40} />
        {ASTROS_ACTIVOS.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={250 + 60 * brilla} fill={`url(#${uid}ha)`} opacity={clamp(base + 0.7 * brilla)} />
            {flash > 0 && flash < 1 && <circle cx={p.x} cy={p.y} r={120 + flash * 260} fill="none" stroke={AC.oroClaro} strokeWidth={5} strokeOpacity={0.9 * (1 - flash)} />}
            <Astrocito x={p.x} y={p.y} s={0.5} k={entra} t={t + i * 0.7} luz={brilla} opacidad={entra} giro={i * 25} />
          </g>
        ))}
        {ASTROS_ACTIVOS.map((p, i) => {
          const d = `M ${p.x} ${p.y} Q ${(p.x + BURBUJA.x) / 2 + (i ? 60 : -60)} ${(p.y + BURBUJA.y) / 2 - 20} ${BURBUJA.x} ${BURBUJA.y}`;
          return (
            <g key={`l${i}`} fill="none" strokeLinecap="round">
              <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - enlaces} stroke={AC.oroOscuro} strokeOpacity={0.4} strokeWidth={18} />
              <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - enlaces} stroke={AC.oroClaro} strokeWidth={6} />
            </g>
          );
        })}
        {burbuja > 0 && (
          <g transform={`translate(${BURBUJA.x} ${BURBUJA.y}) scale(${burbuja})`}>
            <circle r={150} fill={AC.oro} opacity={0.14} />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <line key={i} x1={Math.cos((i * Math.PI) / 4) * 98} y1={Math.sin((i * Math.PI) / 4) * 98} x2={Math.cos((i * Math.PI) / 4) * (112 + 22 * Math.sin(t * 5 + i))} y2={Math.sin((i * Math.PI) / 4) * (112 + 22 * Math.sin(t * 5 + i))} stroke={AC.oroClaro} strokeWidth={5} strokeLinecap="round" />)}
            <circle r={84} fill={`url(#${uid}bu)`} stroke="#fff" strokeOpacity={0.8} strokeWidth={3} />
            <path d="M 0 -52 L 13 -13 L 52 0 L 13 13 L 0 52 L -13 13 L -52 0 L -13 -13 Z" fill={mezclar(AC.oroOscuro, "#fff", 0.1)} opacity={0.9} />
          </g>
        )}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "en ratones", color: RE.hielo, px: 96 }, { t: 1.2, texto: "reactivar\nastrocitos", color: RE.oro, px: 92 }, { t: 3.0, texto: "estimuló\nel recuerdo", px: 92 }]} y={340} id="astro-memoria-t" />
      <Chip texto="recuerdo" x={BURBUJA.x} y={BURBUJA.y + 180} color={AC.oroClaro} ancho={240} id="memoria-recuerdo" opacidad={burbuja} />
      <Chip texto="estudio en ratones" x={W / 2} y={1450} color={AC.hielo} ancho={380} id="memoria-raton" opacidad={entra} />
      <Fuente texto="Williamson et al., Nature 2025 (637:478–486) · en ratones; no está demostrado igual en personas" y={1490} delay={3.2} />
    </Estudio>
  );
};
