/**
 * «La bola de 660 toneladas» (IMNOBA · formas geométricas) · escenas 1/2
 *   tmd-gancho  el rascacielos (Taipei 101) se arma con cuadros, triángulos y rombos y, dentro, cuelga una bola dorada de 660 t
 *   tmd-viento  el viento mece el edificio y la bola se mueve al revés
 *   tmd-discos  41 discos de acero soldados plancha por plancha (con soldador y chispas)
 */
import React, { useMemo } from "react";
import { TMD, TTM } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { FONT, Frases, RE } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { Chispas, FondoPsico, Mosaico, Pila, Soldador, TC, Espiral, facetasEsfera, facetasTorre } from "./tmd-kit";
import { useUid } from "../../estudio/util";

type P = { e: EscenaViralGuardada };

/* ───────────── tmd-gancho ───────────── */

export const TmdGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TTM.gancho;
  const uid = useUid();
  const torre = useMemo(() => facetasTorre(540, 1420, 960, 380), []);
  const prog = clamp((t - a(T.torre)) / a(T.torreDur));
  const lupa = easeOut((t - a(T.lupa)) / a(0.7));
  const RL = 262 * lupa;
  const th = 0.17 * Math.sin(t * 2.0) * clamp((t - a(T.lupa)) / 0.6);
  const L = 300;
  const sx = 540 + L * Math.sin(th), sy = 548 + L * Math.cos(th);
  const esfera = facetasEsfera(sx, sy, 118, 9, 16, t * 0.9);
  const cuenta = easeInOut((t - a(T.cuenta)) / a(T.cuentaDur));
  const sT = spr(f, a(T.lupa), { damping: 12, stiffness: 150, mass: 0.7 });
  return (
    <FondoPsico cy={820}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Mosaico facetas={torre} prog={prog} dispersion={640} semilla={3} />
        {RL > 2 && (
          <g>
            <defs><clipPath id={`${uid}lp`}><circle cx={540} cy={780} r={RL} /></clipPath></defs>
            <circle cx={540} cy={780} r={RL + 26} fill="none" stroke={TC.cian} strokeOpacity={0.35} strokeWidth={4} strokeDasharray="4 14" />
            <g clipPath={`url(#${uid}lp)`}>
              <rect x={240} y={500} width={600} height={560} fill="#070C2A" />
              {[0, 1, 2, 3, 4, 5, 6].map((i) => <polygon key={i} points={`${280 + i * 90},1040 ${330 + i * 90},1040 ${300 + i * 90},500 ${260 + i * 90},500`} fill="#12206A" opacity={0.35} />)}
              <rect x={240} y={528} width={600} height={22} fill="#3C4F8F" />
              <rect x={240} y={528} width={600} height={5} fill="#BFD4FF" opacity={0.5} />
              {[-60, -22, 22, 60].map((dx, i) => <line key={i} x1={540 + dx * 0.6} y1={550} x2={sx + dx * 0.9} y2={sy - 108} stroke="#D7E3EE" strokeWidth={5} />)}
              <circle cx={sx} cy={sy} r={150} fill={TC.oro} opacity={0.14} />
              <g>{esfera.map((fc, i) => <polygon key={i} points={fc.p.map((q) => q.join(",")).join(" ")} fill={fc.c} stroke="#FFF2B0" strokeOpacity={0.3} strokeWidth={1} strokeLinejoin="round" />)}</g>
            </g>
            <circle cx={540} cy={780} r={RL} fill="none" stroke={TC.oro} strokeWidth={8 * Math.min(1, sT)} />
          </g>
        )}
      </svg>
      <Frases frases={[{ t: 0.02, texto: "una bola de\n660 toneladas", px: 84 }, { t: T.para, texto: "¿para qué?", color: RE.oro, px: 118 }]} y={352} ancho={800} />
      <Dato valor={TMD.masaTon * cuenta} x={W / 2} y={1500} px={150} digitos={3} sufijo=" t" id="tmd-masa" opacidad={clamp((t - a(T.cuenta)) / 0.4)} />
      <Fuente texto="Taipei 101 (Taiwán): amortiguador de masa sintonizado de ≈ 660 t · figura geométrica, no es una foto" delay={0.8} />
    </FondoPsico>
  );
};

/* ───────────── tmd-viento ───────────── */

export const TmdViento: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TTM.viento;
  const torre = useMemo(() => facetasTorre(540, 1420, 1000, 380), []);
  const entra = spr(f, 0, { damping: 18, stiffness: 120, mass: 0.9 });
  const ramp = easeOut((t - a(T.sway)) / a(1.0));
  const th = 3.2 * ramp * Math.sin(((t - a(T.sway)) / a(2.4)) * 2 * Math.PI);
  const sh = (1420 - 700) * Math.sin((th * Math.PI) / 180);
  const bola = easeOut((t - a(T.bola)) / a(0.6));
  const bx = 540 - 1.25 * sh, by = 700;
  const esfera = facetasEsfera(bx, by, 62, 8, 14, t * 1.2);
  const flechas = easeOut((t - a(T.flechas)) / a(0.5));
  const viento = clamp((t - a(T.viento)) / 0.5);
  return (
    <FondoPsico cy={860}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Espiral cx={200} cy={600} R={125} t={t} op={clamp((t - a(0.2)) / 0.5) * 0.9} />
        <g opacity={clamp(entra * 1.6)} transform={`rotate(${th.toFixed(3)} 540 1420)`}>
          {torre.map((fc, i) => <polygon key={i} points={fc.p.map((q) => q.join(",")).join(" ")} fill={fc.c} stroke="#FFFFFF" strokeOpacity={0.2} strokeWidth={1.2} strokeLinejoin="round" />)}
        </g>
        {Array.from({ length: 16 }, (_, i) => {
          const y = 470 + ((i * 53) % 760) + Math.sin(i) * 20;
          const v = 520 + (i % 5) * 120;
          const x = ((t * v + i * 211) % 1900) - 500;
          const len = 150 + (i % 4) * 70;
          return <polygon key={i} points={`${x},${y} ${x + len * 0.5},${y - 3.5} ${x + len},${y} ${x + len * 0.5},${y + 3.5}`} fill={TC.cian} opacity={viento * (0.28 + 0.3 * ramp)} />;
        })}
        {bola > 0.01 && (
          <g opacity={clamp(bola * 1.6)}>
            <circle cx={bx} cy={by} r={96 * bola} fill="#060B22" opacity={0.85} />
            <circle cx={bx} cy={by} r={96 * bola} fill="none" stroke={TC.oro} strokeWidth={4} strokeDasharray="10 8" />
            <circle cx={bx} cy={by} r={120 * bola} fill={TC.oro} opacity={0.12} />
            {esfera.map((fc, i) => <polygon key={i} points={fc.p.map((q) => q.join(",")).join(" ")} fill={fc.c} stroke="#FFF2B0" strokeOpacity={0.3} strokeWidth={1} strokeLinejoin="round" />)}
          </g>
        )}
        {flechas > 0.01 && (
          <g opacity={flechas}>
            <polygon points="196,1010 316,1010 316,986 372,1030 316,1074 316,1050 196,1050" fill="#6FB6FF" opacity={0.9} />
            <polygon points="884,1010 764,1010 764,986 708,1030 764,1074 764,1050 884,1050" fill={TC.oro} opacity={0.95} />
          </g>
        )}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "el viento mece\nlos rascacielos", px: 72 }, { t: T.bola, texto: "la bola va\nal revés", color: RE.oro, px: 88 }]} y={352} ancho={800} />
      <Chip texto="edificio" x={300} y={1118} color="#6FB6FF" id="tmd-edif" ancho={240} opacidad={flechas} />
      <Chip texto="bola" x={780} y={1118} color={TC.oro} id="tmd-bola" ancho={240} opacidad={flechas} />
      <Fuente texto="Los rascacielos se balancean con el viento · el movimiento está exagerado (ilustración)" delay={0.8} />
    </FondoPsico>
  );
};

/* ───────────── tmd-discos ───────────── */

export const TmdDiscos: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TTM.discos;
  const N = TMD.discos;
  const R = 290, CX = 470, YB = 1400, BH = (2 * R) / N, CYS = YB - R;
  const nB = clamp((t - a(T.ini)) / a(T.paso * N), 0, 1) * N;
  const hechos = Math.floor(nB);
  const frac = nB - hechos;
  const completo = nB >= N - 0.001;
  const topY = YB - Math.min(N, hechos) * BH;
  const hw = (y: number): number => Math.sqrt(Math.max(0, R * R - (y - CYS) * (y - CYS)));
  const yPlat = Math.max(topY + 62, 900);
  const tx = CX + Math.min(R, hw(topY - 2) + 8), ty = topY - 4;
  const sold = completo ? 0 : clamp(1 - frac * 1.4);
  const halo = easeOut((t - a(T.listo)) / a(0.5));
  const bandaY = YB - (hechos + 0.5) * BH - (1 - easeOut(frac)) * 190;
  const entra = spr(f, 0, { damping: 18, stiffness: 120, mass: 0.9 });
  const trabajando = t >= a(T.ini) && !completo;
  return (
    <FondoPsico cy={1000}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* grúa pórtico y cable */}
        <g opacity={clamp(entra * 2)}>
          <line x1={110} y1={476} x2={830} y2={476} stroke={TC.oro} strokeWidth={8} />
          <line x1={110} y1={476} x2={110} y2={1400} stroke="#3C4F8F" strokeWidth={6} opacity={0.5} />
          <polygon points={`${CX - 24},466 ${CX + 24},466 ${CX + 24},492 ${CX - 24},492`} fill={TC.oro2} stroke="#FFF2B0" strokeOpacity={0.5} />
          {trabajando && (
            <g>
              <line x1={CX} y1={492} x2={CX} y2={bandaY - 24} stroke="#D7E3EE" strokeWidth={3.5} />
              <polygon points={`${CX - 14},${bandaY - 38} ${CX + 14},${bandaY - 38} ${CX},${bandaY - 14}`} fill={TC.oro} />
            </g>
          )}
        </g>
        {/* andamio que sube con la pila */}
        {[810, 990].map((x) => <line key={x} x1={x} y1={yPlat} x2={x} y2={1400} stroke="#8FA2C8" strokeWidth={5} opacity={0.75} />)}
        {Array.from({ length: Math.max(0, Math.floor((1400 - yPlat) / 130)) }, (_, i) => <polyline key={i} points={`810,${1400 - i * 130} 990,${1400 - (i + 1) * 130} 810,${1400 - (i + 1) * 130}`} fill="none" stroke="#8FA2C8" strokeWidth={3} opacity={0.5} />)}
        <polygon points={`790,${yPlat} 1010,${yPlat} 1010,${yPlat + 14} 790,${yPlat + 14}`} fill={TC.oro2} stroke="#FFF2B0" strokeOpacity={0.4} />
        <Pila cx={CX} yBot={YB} R={R} n={N} hasta={nB} soldadura={sold} halo={halo * 0.9} />
        <Soldador x={880} y={yPlat} s={1.25} punta={[tx, ty]} fase={t} />
        {trabajando && <Chispas x={tx} y={ty} t={t} n={16} ritmo={4} semilla={5} />}
      </svg>
      <Frases frases={[{ t: 0.15, texto: "plancha\npor plancha", px: 90 }, { t: T.listo - 0.4, texto: "41 discos\nsoldados", color: RE.oro, px: 84 }]} y={352} ancho={800} />
      <Dato valor={Math.min(N, hechos)} x={W / 2} y={1500} px={140} digitos={2} sufijo={` / ${N}`} id="tmd-n" opacidad={clamp((t - a(T.ini)) / 0.3)} />
      <Chip texto="12,5 cm de acero cada uno" x={W / 2} y={700} color={RE.oro} id="tmd-grosor" ancho={600} opacidad={clamp((t - a(T.chip)) / 0.4)} />
      <Fuente texto="41 placas de acero de 12,5 cm soldadas entre sí · Taipei 101 (Guinness, A+H Tuned) · esquema" delay={0.8} />
    </FondoPsico>
  );
};
