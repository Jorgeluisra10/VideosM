/**
 * «El ascensor espacial» (IMNOBA · NASA NIAC / Obayashi · plano secuencia vertical) · escenas 1/2. Texto en pantalla mínimo: se explica dibujando.
 *   esp-gancho      un cohete gasta su combustible y cae mientras un trepador sube tranquilo
 *   esp-nanotubo    zoom out: de la red hexagonal de carbono al nanotubo y a la cinta
 *   esp-cinta       una cinta ancha como una puerta y más fina que una hoja de papel
 *   esp-plataforma  plataforma oceánica móvil en el ecuador
 *   esp-trepador    el trepador robótico y el láser que lo alimenta
 *   esp-clima       tormenta, estratosfera y cielo que oscurece
 */
import React from "react";
import { TSP } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { Globo, Onoma } from "./chi-kit";
import { Mar } from "./rom-kit";
import { Cielo, Cinta, Cohete, Gaviota, Hexa, Laser, Nanotubo, Nubes, Persona, Plataforma, Tormenta, Trepador, ES } from "./esp-kit";
import { FONT } from "./real-kit";

type P = { e: EscenaViralGuardada };
const rp = (t: number, a: (x: number) => number, ini: number, dur: number): number => clamp((t - a(ini)) / a(dur));
const Marco: React.FC<{ children: React.ReactNode; fondo?: string }> = ({ children, fondo = "#0f1c46" }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, background: fondo }}>{children}</svg>
);
const Viñeta: React.FC<{ f?: number }> = ({ f = 0.55 }) => {
  const uid = useUid();
  return <g><defs><radialGradient id={`${uid}v`} cx="50%" cy="50%" r="75%"><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity={f} /></radialGradient></defs><rect width={W} height={H} fill={`url(#${uid}v)`} /></g>;
};

/* ───────────── esp-gancho ───────────── */

export const EspGancho: React.FC<P> = () => {
  const { t, a } = useReloj();
  const T = TSP.gancho;
  const sube = clamp((t - a(T.lanza)) / a(T.apaga - T.lanza));
  const eS = sube * sube;
  const comb = 1 - 0.92 * clamp((t - a(T.lanza)) / a(T.apaga - T.lanza));
  const fuego = t < a(T.lanza) ? 0.25 : t < a(T.apaga) ? 1 : 0;
  const cae = clamp((t - a(T.cae)) / a(2.0));
  const ry = lerp(1180, 760, eS) + cae * cae * 1700;
  const rot = cae * 150;
  const rx = 330 - cae * 90;
  const sh = t < a(T.apaga) && t > a(T.lanza) ? 5 : 0;
  const cl = clamp((t - a(T.trepa)) / a(3.4));
  const cy = lerp(2150, 880, easeOut(cl));
  const puff = rp(t, a, T.apaga, 1.2);
  const flash = clamp(1 - Math.abs(t - a(T.ding)) / 0.18);
  const gk = rp(t, a, T.apaga + 0.2, 0.4) * (1 - rp(t, a, T.apaga + 1.8, 0.3));
  return (
    <Marco>
      <g transform={`translate(${Math.sin(t * 90) * sh} ${Math.cos(t * 77) * sh})`}>
        <Cielo u={0.04 + 0.18 * clamp(t / a(T.apaga + 3))} t={t} sc={t * 120} />
        <Nubes sc={t * 240} t={t} n={14} />
        <rect x={0} y={1400 + clamp(t / a(3)) * 500} width={W} height={600} fill="#4A5A3A" />
        <rect x={0} y={1400 + clamp(t / a(3)) * 500} width={W} height={14} fill="#7A8A5A" />
        <rect x={180} y={1250 + clamp(t / a(3)) * 500} width={30} height={160} fill="#9FB0C4" /><rect x={450} y={1250 + clamp(t / a(3)) * 500} width={30} height={160} fill="#9FB0C4" />
        {/* humo de la salida y de la falla */}
        {t > a(T.lanza) && Array.from({ length: 12 }, (_, i) => { const q = (t * 0.6 + i / 12) % 1; return <circle key={i} cx={rx + Math.sin(i * 3) * 80 * q} cy={Math.min(1400, ry + 120 + q * 360)} r={40 + q * 90} fill="#F0F3F7" opacity={0.55 * (1 - q) * (fuego > 0 ? 1 : 0.4)} />; })}
        <Cohete x={rx} y={ry} t={t} s={0.8} fuego={fuego} comb={comb} rot={rot} />
        {puff > 0 && puff < 1 && <g>{Array.from({ length: 7 }, (_, i) => <circle key={i} cx={rx + (i - 3) * 26} cy={ry + 60 - puff * 140} r={34 + puff * 40} fill="#8A929C" opacity={0.7 * (1 - puff)} />)}</g>}
        <Onoma x={rx + 40} y={ry - 380} texto="¡PFFF!" k={rp(t, a, T.onoma, 0.5) * (1 - cae)} color="#FF8A3D" px={86} rot={-8} id="esp-pfff" />
        {gk > 0 && <Globo x={rx} y={ry - 300} texto="¿Y mi combustible?" ancho={380} k={gk} lado="izq" id="esp-comb" />}
        {/* cinta y trepador (llegan por la derecha) */}
        <Cinta x={780} y0={0} y1={H} ancho={30} t={t} brillo={clamp(cl * 3)} />
        {cl > 0 && <Trepador x={780} y={cy} t={t} s={0.62} cara={cl > 0.7 ? "feliz" : "normal"} laser={0.4} />}
        {flash > 0 && <g><circle cx={780} cy={cy} r={220 * flash} fill="none" stroke="#fdc300" strokeWidth={10} opacity={flash} /><Onoma x={780} y={cy - 280} texto="¡DING!" k={0.9} color="#fdc300" px={80} rot={6} id="esp-ding" /></g>}
      </g>
      <Viñeta />
    </Marco>
  );
};

/* ───────────── esp-nanotubo ───────────── */

export const EspNanotubo: React.FC<P> = () => {
  const { t, a } = useReloj();
  const T = TSP.nanotubo;
  const e1 = easeInOut((t - a(T.hex)) / a(T.enrolla - T.hex));
  const e2 = easeInOut((t - a(T.enrolla)) / a(T.haz - T.enrolla));
  const e3 = easeInOut((t - a(T.haz)) / a(T.cinta - T.haz));
  const e4 = easeInOut((t - a(T.cinta)) / a(2.4));
  const A = 1 - clamp((t - a(T.enrolla) + 0.4) / a(1.0));
  const Bt = clamp((t - a(T.enrolla) + 0.2) / a(0.8)) * (1 - clamp((t - a(T.haz) + 0.4) / a(1.0)));
  const C = clamp((t - a(T.haz) + 0.2) / a(0.8)) * (1 - clamp((t - a(T.cinta) + 0.4) / a(1.0)));
  const D = clamp((t - a(T.cinta) + 0.2) / a(0.8));
  return (
    <Marco>
      <rect width={W} height={H} fill="#08122F" />
      <g opacity={A}>
        <Hexa x={-400} y={-400} w={W + 800} h={H + 800} z={lerp(1.7, 0.7, e1)} t={t} rot={t * 2} />
        {Array.from({ length: 24 }, (_, i) => { const q = (t * 0.5 + i / 24) % 1; return <circle key={i} cx={azar(i * 3.3) * W} cy={H * (1 - q)} r={10} fill="#FFFFFF" opacity={0.5 * Math.sin(q * Math.PI)} />; })}
      </g>
      <g opacity={Bt}>
        <g transform={`translate(540 960) scale(${lerp(1.8, 1.0, e2)}) translate(-540 -960)`}>
          <Nanotubo x={540} y={960} w={420} h={1900} t={t} z={0.55} />
          <ellipse cx={540} cy={10} rx={210} ry={50} fill="#08122F" stroke="#4FE3FF" strokeWidth={5} />
        </g>
      </g>
      <g opacity={C}>
        <g transform={`translate(540 960) scale(${lerp(1.5, 0.8, e3)}) translate(-540 -960)`}>
          {Array.from({ length: 7 }, (_, i) => <Nanotubo key={i} x={540 + (i - 3) * 125} y={960} w={110} h={2000} t={t + i} z={0.4} />)}
        </g>
      </g>
      <g opacity={D}>
        <g transform={`translate(540 960) scale(${lerp(1.6, 0.6, e4)}) translate(-540 -960)`}>
          <Cinta x={540} y0={-300} y1={H + 300} ancho={150} t={t} brillo={1} />
        </g>
        <Cinta x={540} y0={0} y1={H} ancho={14} t={t} brillo={1.4 * e4} />
      </g>
      {/* regla de escala */}
      <g opacity={0.7}>{Array.from({ length: 22 }, (_, i) => { const y = ((i * 90 - t * 60 * (1 + e1 * 2 + e2 * 2 + e3)) % (H + 90) + H + 90) % (H + 90); return <line key={i} x1={0} y1={y} x2={i % 5 === 0 ? 70 : 34} y2={y} stroke="#4FE3FF" strokeWidth={i % 5 === 0 ? 5 : 3} />; })}</g>
      <Viñeta f={0.6} />
    </Marco>
  );
};

/* ───────────── esp-cinta ───────────── */

export const EspCinta: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TSP.cinta;
  const sP = spr(f, a(T.persona), { damping: 12, stiffness: 130, mass: 0.7 });
  const papel = rp(t, a, T.papel, 0.8);
  const ond = rp(t, a, T.ondea, 1.0);
  const ondas = (y: number) => Math.sin(y / 140 - t * 4) * 30 * ond;
  return (
    <Marco>
      <Cielo u={0.1} t={t} sc={t * 80} />
      <Nubes sc={t * 160} t={t} n={14} />
      {/* viento */}
      {Array.from({ length: 16 }, (_, i) => { const q = (t * (0.5 + azar(i) * 0.4) + i / 16) % 1; return <path key={i} d={`M ${-100 + q * 1300} ${200 + azar(i * 3.7) * 1500} q 80 -${14 + azar(i) * 20} 160 0`} fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={0.4 * ond * Math.sin(q * Math.PI)} strokeLinecap="round" />; })}
      {/* cinta ondulante a pantalla completa */}
      <g>
        <path d={`M ${540 - 70} -20 ${Array.from({ length: 22 }, (_, i) => `L ${540 - 70 + ondas(i * 90)} ${i * 90}`).join(" ")} L ${540 + 70 + ondas(1980)} 1980 ${Array.from({ length: 22 }, (_, i) => `L ${540 + 70 + ondas((21 - i) * 90)} ${(21 - i) * 90}`).join(" ")} Z`} fill="#fdc300" stroke="#FFF0A0" strokeWidth={5} opacity={rp(t, a, T.cinta, 0.8)} />
        <rect x={540 - 70} y={0} width={140} height={H} fill="#FFFFFF" opacity={0.0} />
        {Array.from({ length: 12 }, (_, i) => { const q = (t * 0.3 + i / 12) % 1; return <rect key={i} x={540 - 66 + ondas(H * (1 - q))} y={H * (1 - q)} width={132} height={80} fill="#FFFFFF" opacity={0.45 * Math.sin(q * Math.PI) * rp(t, a, T.cinta, 0.8)} />; })}
      </g>
      {/* una persona al lado: el ancho de una puerta */}
      <g opacity={clamp(sP * 2)} transform={`translate(0 ${(1 - sP) * 80})`}>
        <Persona x={400} y={1500} s={3.4} t={t} />
        <line x1={470} y1={1330} x2={610} y2={1330} stroke="#FFFFFF" strokeWidth={5} /><line x1={470} y1={1318} x2={470} y2={1342} stroke="#FFFFFF" strokeWidth={5} /><line x1={610} y1={1318} x2={610} y2={1342} stroke="#FFFFFF" strokeWidth={5} />
      </g>
      {/* corte de la cinta frente a una hoja de papel (vista de canto, ampliada) */}
      <g opacity={papel} transform={`translate(0 ${(1 - papel) * 100})`}>
        <circle cx={800} cy={560} r={190} fill="#0f1c46" stroke="#4FE3FF" strokeWidth={8} />
        <rect x={720} y={470} width={44} height={180} fill="#E8EDF3" stroke="#9FB0C4" strokeWidth={3} />
        <rect x={812} y={470} width={7} height={180} fill="#fdc300" />
        <line x1={742} y1={450} x2={742} y2={470} stroke="#FFFFFF" strokeWidth={3} /><line x1={815} y1={450} x2={815} y2={470} stroke="#fdc300" strokeWidth={3} />
        <path d="M 930 700 L 990 790" stroke="#4FE3FF" strokeWidth={14} strokeLinecap="round" />
      </g>
      <Viñeta />
    </Marco>
  );
};

/* ───────────── esp-plataforma ───────────── */

export const EspPlataforma: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TSP.plataforma;
  const sPl = spr(f, a(T.plat), { damping: 13, stiffness: 100, mass: 1 });
  const grua = easeInOut((t - a(T.grua)) / a(1.6));
  const cinta = easeOut((t - a(T.cinta)) / a(2.0));
  const gk = rp(t, a, T.globo, 0.4);
  const horizonte = 980;
  return (
    <Marco>
      <Cielo u={0} t={t} />
      <circle cx={820} cy={horizonte - 120} r={150} fill="#FFF1B8" opacity={0.85} /><circle cx={820} cy={horizonte - 120} r={260} fill="#FFE27A" opacity={0.2} />
      <Nubes sc={t * 50} t={t} n={9} opacidad={0.8} />
      <rect x={0} y={horizonte} width={W} height={H - horizonte} fill="#1D6FA8" />
      <Mar y={horizonte} t={t} alto={H - horizonte} claro="#2C8AC8" oscuro="#0B3550" opacidad={0.95} />
      {/* cinta que sube desde la plataforma */}
      <Cinta x={540} y0={-20} y1={horizonte - 130} ancho={22 * cinta} t={t} brillo={cinta} />
      <g opacity={clamp(sPl * 2)} transform={`translate(0 ${(1 - sPl) * 120})`}><Plataforma x={540} y={horizonte + 70} t={t} s={1.35} grua={grua} /></g>
      {/* trepador colgado de la grúa */}
      {t > a(T.grua - 0.4) && <g transform={`translate(${lerp(800, 540, grua)} ${lerp(700, horizonte - 300, grua)})`}><Trepador x={0} y={0} t={t} s={0.26} cara="feliz" /></g>}
      {/* barcos y gaviota */}
      {[[130, 1250, 0.5], [960, 1450, 0.7]].map(([x, y, s], i) => <g key={i} transform={`translate(${x + Math.sin(t * 0.5 + i) * 20} ${y}) scale(${s})`}><path d="M -80 0 L 80 0 L 56 36 L -56 36 Z" fill="#F4F6F9" stroke="#3A4A5A" strokeWidth={5} /><rect x={-24} y={-40} width={48} height={40} fill="#E5432D" stroke="#3A4A5A" strokeWidth={4} /></g>)}
      <Gaviota x={300 + Math.sin(t * 1.2) * 60} y={560 + Math.sin(t * 2) * 20} t={t} s={1.2} />
      <Gaviota x={880} y={420} t={t + 1} s={0.9} />
      {gk > 0 && <Globo x={640} y={760} texto="¿Dónde me poso?" ancho={360} k={gk} lado="izq" id="esp-poso" />}
      {/* globito del ecuador */}
      <g transform="translate(900 1620)"><circle r={120} fill="#1D6FA8" stroke="#F8FAFC" strokeWidth={6} /><ellipse cx={0} cy={0} rx={120} ry={20} fill="none" stroke="#fdc300" strokeWidth={8} /><circle cx={-30} cy={0} r={11} fill="#E5432D" stroke="#fff" strokeWidth={3} /><ellipse cx={-30} cy={-36} rx={46} ry={26} fill="#3E8A4E" opacity={0.8} /><ellipse cx={46} cy={40} rx={38} ry={22} fill="#3E8A4E" opacity={0.8} /></g>
      <Viñeta f={0.4} />
    </Marco>
  );
};

/* ───────────── esp-trepador ───────────── */

export const EspTrepador: React.FC<P> = () => {
  const { t, a } = useReloj();
  const T = TSP.trepador;
  const lz = rp(t, a, T.laser, 0.8);
  const panel = rp(t, a, T.panel, 0.6);
  const sc = t * 300;
  const cara = t > a(T.cara) ? "feliz" : "normal";
  const carga = clamp((t - a(T.panel)) / a(3.2));
  return (
    <Marco>
      <Cielo u={0.12 + 0.1 * clamp(t / 9)} t={t} sc={sc * 0.2} />
      <Nubes sc={sc} t={t} n={16} />
      <Cinta x={540} y0={0} y1={H} ancho={30} t={t} brillo={1} />
      {/* láser desde la plataforma (abajo, a la izquierda) */}
      <Laser x0={160} y0={H + 60} x1={540} y1={1120} t={t} k={lz} ancho={14} />
      <g transform={`translate(0 ${Math.sin(t * 6) * 3})`}><Trepador x={540} y={880} t={t} s={1.5} laser={panel} cara={cara} ventana={t > a(T.cara)} /></g>
      {/* batería que se carga */}
      <g transform="translate(900 360)"><rect x={-40} y={0} width={80} height={220} rx={14} fill="#08122F" stroke="#fdc300" strokeWidth={6} /><rect x={-14} y={-14} width={28} height={14} fill="#fdc300" /><rect x={-30} y={210 - 200 * carga} width={60} height={200 * carga} rx={8} fill="#7CFFB0" opacity={0.9} /></g>
      {/* chispas de energía */}
      {Array.from({ length: 14 }, (_, i) => { const q = (t * 1.3 + i / 14) % 1; return <circle key={i} cx={540 + Math.sin(i * 5) * 150} cy={1130 + q * -240} r={6} fill="#FFF6C4" opacity={panel * Math.sin(q * Math.PI)} />; })}
      {t > a(T.saludo) && <Onoma x={760} y={620} texto="¡Hola!" k={rp(t, a, T.saludo, 0.4)} color="#4FE3FF" px={74} rot={8} id="esp-hola" />}
      <Viñeta />
    </Marco>
  );
};

/* ───────────── esp-clima ───────────── */

export const EspClima: React.FC<P> = () => {
  const { t, a } = useReloj();
  const T = TSP.clima;
  const u = lerp(0.15, 0.58, easeInOut(t / a(7.4)));
  const sc = t * 520;
  const r1 = clamp(1 - Math.abs(t - a(T.rayo1)) / 0.15), r2 = clamp(1 - Math.abs(t - a(T.rayo2)) / 0.15);
  const tor = 1 - clamp((t - a(T.estrat - 0.6)) / a(1.4));
  const lluvia = rp(t, a, T.lluvia, 0.5) * tor;
  const gafas = t > a(T.gafas);
  return (
    <Marco>
      <Cielo u={u} t={t} sc={sc * 0.2} />
      <g opacity={tor}><Tormenta sc={sc} t={t} rayo={r1} x={260} /><Tormenta sc={sc * 0.7} t={t} rayo={r2} x={820} /></g>
      <Nubes sc={sc * 1.2} t={t} n={8} opacidad={1 - tor * 0.5} />
      {Array.from({ length: 70 }, (_, i) => { const q = (t * 2.2 + azar(i * 3.1)) % 1; return <line key={i} x1={azar(i * 5.3) * W} y1={q * H} x2={azar(i * 5.3) * W - 14} y2={q * H + 60} stroke="#BFD8F4" strokeWidth={3} opacity={0.55 * lluvia} />; })}
      <Cinta x={540} y0={0} y1={H} ancho={30} t={t} brillo={1 + (r1 + r2) * 1.5} />
      <Trepador x={540} y={980} t={t} s={1.0} cara={gafas ? "gafas" : "normal"} laser={0.6} />
      {/* limpiaparabrisas gag */}
      <g transform={`translate(540 ${980 - 98})`} opacity={lluvia}><line x1={-40} y1={30} x2={40 * Math.sin(t * 8)} y2={-20} stroke="#fdc300" strokeWidth={5} strokeLinecap="round" /></g>
      {gafas && <Onoma x={780} y={640} texto="¡Qué sol!" k={rp(t, a, T.gafas, 0.4)} color="#fdc300" px={64} rot={7} id="esp-sol" />}
      <Viñeta f={0.5} />
    </Marco>
  );
};
