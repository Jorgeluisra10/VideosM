/**
 * «El ascensor espacial» (IMNOBA · NASA NIAC / Obayashi · plano secuencia vertical) · escenas 2/2. Texto en pantalla mínimo: se explica dibujando.
 *   esp-vanallen    cruza los cinturones de radiación de Van Allen
 *   esp-fisica      gravedad contra rotación: se igualan a 35.786 km
 *   esp-contrapeso  el contrapeso, como la piedra de una honda, mantiene tensa la cinta
 *   esp-viaje       un viaje lento de una semana con pasajeros aburridos y música de ascensor
 *   esp-acero       un cable de acero se rompe por su propio peso y la cinta aguanta
 *   esp-lab         el obstáculo real: nanotubos de centímetros y un defecto que lo debilita
 *   esp-cierre      del contrapeso a una obra con bases verificadas
 */
import React from "react";
import { ASC, TSP } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, spr, useReloj } from "../comun";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { Globo, Onoma } from "./chi-kit";
import { Sello } from "./rom-kit";
import { Cielo, Cinta, Cinturon, Contrapeso, Estacion, Flecha, Hexa, Nanotubo, Persona, Tierra, Trepador, ES } from "./esp-kit";
import { FONT, MONOF } from "./real-kit";
import { Dato } from "./real1";

type P = { e: EscenaViralGuardada };
const rp = (t: number, a: (x: number) => number, ini: number, dur: number): number => clamp((t - a(ini)) / a(dur));
const Marco: React.FC<{ children: React.ReactNode; fondo?: string }> = ({ children, fondo = "#0f1c46" }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, background: fondo }}>{children}</svg>
);
const Viñeta: React.FC<{ f?: number }> = ({ f = 0.55 }) => {
  const uid = useUid();
  return <g><defs><radialGradient id={`${uid}v`} cx="50%" cy="50%" r="75%"><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity={f} /></radialGradient></defs><rect width={W} height={H} fill={`url(#${uid}v)`} /></g>;
};

/* ───────────── esp-vanallen ───────────── */

export const EspVanAllen: React.FC<P> = () => {
  const { t, a } = useReloj();
  const T = TSP.vanallen;
  const ent = easeOut((t - a(T.tierra)) / a(1.4));
  const cr = rp(t, a, T.cruza, 3.4);
  const part = rp(t, a, T.parti, 0.8);
  const gafas = t > a(T.gafas);
  const au = rp(t, a, T.aurora, 1.2);
  const ty = lerp(2200, 1500, ent);
  return (
    <Marco>
      <Cielo u={0.9} t={t} sc={t * 140} />
      <g transform={`translate(0 ${ty - 1500})`}>
        <Tierra cx={540} cy={1500} r={640} t={t} luces={0.8} />
        <Cinturon cx={540} cy={1500} r={640} t={t} k={rp(t, a, T.anillos, 1.0)} />
        {/* auroras en el borde */}
        <g opacity={au}>{Array.from({ length: 9 }, (_, i) => <path key={i} d={`M ${300 + i * 55} 920 Q ${280 + i * 55 + Math.sin(t * 2 + i) * 30} 800 ${320 + i * 55} 700`} stroke={i % 2 ? "#7CFFB0" : "#4FE3FF"} strokeWidth={26} opacity={0.5} strokeLinecap="round" fill="none" />)}</g>
      </g>
      {/* partículas de radiación que rebotan */}
      {Array.from({ length: 40 }, (_, i) => { const q = (t * 0.9 + azar(i * 3.3)) % 1; return <circle key={i} cx={azar(i * 5.7) * W + Math.sin(q * 20 + i) * 40} cy={H * (1 - q)} r={5 + azar(i) * 6} fill={i % 2 ? "#FFD39A" : "#BFF3FF"} opacity={0.9 * part * Math.sin(q * Math.PI)} />; })}
      <Cinta x={540} y0={0} y1={H} ancho={26} t={t} brillo={1 + part * 0.5} />
      <Trepador x={540} y={lerp(1200, 640, easeInOut(cr))} t={t} s={0.8} cara={gafas ? "gafas" : "normal"} laser={0.4} />
      {gafas && <Onoma x={790} y={560} texto="¡Rebota!" k={rp(t, a, T.gafas, 0.4)} color="#fdc300" px={68} rot={7} id="esp-rebota" />}
      <Viñeta />
    </Marco>
  );
};

/* ───────────── esp-fisica ───────────── */

export const EspFisica: React.FC<P> = () => {
  const { t, a } = useReloj();
  const T = TSP.fisica;
  const kg = rp(t, a, T.grav, 1.6), kc = rp(t, a, T.cent, 1.6), kgeo = rp(t, a, T.geo, 0.8), kh = rp(t, a, T.honda, 0.8);
  const niveles = 9;
  const geoY = 560;
  const yN = (i: number) => 1750 - i * ((1750 - 200) / (niveles - 1));
  const u = (i: number) => i / (niveles - 1);
  return (
    <Marco>
      <Cielo u={0.95} t={t} sc={t * 40} />
      <Tierra cx={540} cy={2150} r={520} t={t} />
      <Cinta x={540} y0={0} y1={1700} ancho={22} t={t} brillo={1} />
      {/* ejes: gravedad a la izquierda (azul, hacia abajo), fuerza centrífuga a la derecha (naranja, hacia arriba) */}
      {Array.from({ length: niveles }, (_, i) => {
        const L = (200 - 170 * u(i)) * kg, C = (30 + 170 * u(i)) * kc;
        return (
          <g key={i}>
            <Flecha x={380} y={yN(i) - 10} L={Math.max(0, L)} abajo color="#4FE3FF" ancho={12} />
            <Flecha x={700} y={yN(i) + 10} L={Math.max(0, C)} color="#FF8A3D" ancho={12} />
          </g>
        );
      })}
      {/* franja de equilibrio a la altura GEO */}
      <g opacity={kgeo}>
        <rect x={0} y={geoY - 70} width={W} height={140} fill="#fdc300" opacity={0.14 + 0.06 * Math.sin(t * 6)} />
        <ellipse cx={540} cy={geoY} rx={300} ry={60} fill="none" stroke="#fdc300" strokeWidth={8} />
        <Flecha x={540} y={geoY - 6} L={90} abajo color="#4FE3FF" ancho={10} /><Flecha x={540} y={geoY + 6} L={90} color="#FF8A3D" ancho={10} />
        <Onoma x={820} y={geoY - 100} texto="¡Empate!" k={kgeo} color="#fdc300" px={72} rot={-7} id="esp-empate" />
      </g>
      {/* la Tierra gira como el brazo que hace girar una honda */}
      <g opacity={kh} transform={`translate(190 1500)`}>
        <circle r={110} fill="#0f1c46" stroke="#4FE3FF" strokeWidth={5} opacity={0.85} />
        <g transform={`rotate(${t * 240})`}><line x1={0} y1={0} x2={90} y2={0} stroke="#fdc300" strokeWidth={6} /><circle cx={90} cy={0} r={16} fill="#6B5E52" stroke="#2E2822" strokeWidth={4} /></g>
      </g>
      <Trepador x={540} y={yN(Math.min(niveles - 1, Math.floor(clamp(t / a(7)) * niveles)))} t={t} s={0.42} laser={0.4} />
      <Viñeta />
    </Marco>
  );
};

/* ───────────── esp-contrapeso ───────────── */

export const EspContrapeso: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TSP.contrapeso;
  const gira = rp(t, a, T.gira, 1.0);
  const ang = t * 200;
  const sA = spr(f, a(T.asteroide), { damping: 11, stiffness: 120, mass: 0.9 });
  const tenso = rp(t, a, T.tenso, 0.8);
  const km = rp(t, a, T.km, 0.5);
  return (
    <>
    <Marco>
      <Cielo u={1} t={t} sc={t * 60} />
      {/* honda gigante: la piedra gira en el extremo de una cuerda */}
      <g transform="translate(540 1300)" opacity={gira}>
        <circle r={380} fill="none" stroke="#4FE3FF" strokeWidth={4} strokeDasharray="14 18" opacity={0.5} transform={`rotate(${-t * 20})`} />
        <g transform={`rotate(${ang})`}><line x1={0} y1={0} x2={380} y2={0} stroke="#fdc300" strokeWidth={8} /><g transform="translate(380 0) scale(0.28)"><Contrapeso x={0} y={0} t={t} /></g></g>
        <circle r={36} fill="#1D6FA8" stroke="#F8FAFC" strokeWidth={5} />
      </g>
      {/* cinta tensa con el contrapeso en lo alto */}
      <Cinta x={540} y0={300} y1={H} ancho={24} t={t} brillo={tenso} />
      <g opacity={clamp(sA * 2)} transform={`translate(0 ${(1 - sA) * -200})`}><Contrapeso x={540} y={240} t={t} s={0.85} /></g>
      {/* flechas de tensión */}
      <g opacity={tenso}><Flecha x={420} y={900} L={160} color="#fdc300" ancho={12} /><Flecha x={660} y={900} L={160} color="#fdc300" ancho={12} /></g>
      {Array.from({ length: 30 }, (_, i) => { const q = (t * 0.2 + azar(i * 3.1)) % 1; return <circle key={i} cx={azar(i * 5.3) * W} cy={H * q} r={2.5} fill="#FFFFFF" opacity={0.5} />; })}
      <Trepador x={540} y={lerp(1700, 900, easeInOut(t / a(8)))} t={t} s={0.5} laser={0.3} />
      <Viñeta />
    </Marco>
      <Dato valor={ASC.obayashiExtremoKm * km} x={W / 2} y={1600} px={96} digitos={5} color="#fdc300" sufijo=" km" id="esp-km" opacidad={clamp(km * 3)} />
    </>
  );
};

/* ───────────── esp-viaje ───────────── */

export const EspViaje: React.FC<P> = () => {
  const { t, a } = useReloj();
  const T = TSP.viaje;
  const sc = t * 160;
  const cal = clamp((t - a(T.calendario)) / a(3.2));
  const dia = Math.floor(cal * 7) + 1;
  const llega = rp(t, a, T.estacion, 1.2);
  const pr = rp(t, a, T.pregunta, 0.4) * (1 - rp(t, a, T.pregunta + 1.6, 0.3));
  const nota = (i: number) => { const q = (t * 0.6 + i / 6) % 1; return <text key={i} x={780 + Math.sin(q * 8 + i) * 40} y={900 - q * 300} fontFamily={FONT} fontWeight={900} fontSize={54} fill="#fdc300" opacity={0.9 * Math.sin(q * Math.PI) * rp(t, a, T.musica, 0.4)}>♪</text>; };
  return (
    <Marco>
      <Cielo u={0.92} t={t} sc={sc} />
      <Tierra cx={540} cy={2350 + cal * 300} r={820} t={t} luces={0.5} />
      <Cinta x={540} y0={0} y1={H} ancho={24} t={t} brillo={1} />
      {/* estación GEO que llega desde arriba */}
      <g transform={`translate(0 ${lerp(-500, 520, easeOut(llega))})`}><Estacion x={540} y={0} t={t} s={1.25} /></g>
      {/* trepador con ventana y pasajeros aburridos */}
      <g transform={`translate(0 ${Math.sin(t * 5) * 2})`}><Trepador x={540} y={lerp(1000, 1400, llega)} t={t} s={1.3} cara="aburrido" ventana laser={0.3} /></g>
      {t > a(T.cartas) && <g transform="translate(300 1180)"><rect x={-26} y={-32} width={44} height={60} rx={5} fill="#fff" stroke="#222" strokeWidth={3} transform="rotate(-14)" /><rect x={-6} y={-30} width={44} height={60} rx={5} fill="#fff" stroke="#222" strokeWidth={3} transform="rotate(8)" /><path d="M 12 -6 q 8 -12 0 -18 q -8 6 0 18 Z" fill="#E5432D" /></g>}
      {[0, 1, 2, 3, 4, 5].map(nota)}
      {pr > 0 && <Globo x={600} y={1020} texto="¿Ya llegamos?" ancho={330} k={pr} lado="izq" id="esp-llegamos" />}
      {/* calendario que avanza */}
      <g transform="translate(160 260)" opacity={clamp(cal * 6)}>
        <rect x={-90} y={-70} width={180} height={150} rx={16} fill="#F4F1E8" stroke="#0f1c46" strokeWidth={6} />
        <rect x={-90} y={-70} width={180} height={46} rx={16} fill="#E5432D" />
        <text x={0} y={54} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={84} fill="#0f1c46" data-texto="esp-dia">{dia}</text>
      </g>
      <Viñeta />
    </Marco>
  );
};

/* ───────────── esp-acero ───────────── */

export const EspAcero: React.FC<P> = () => {
  const { t, a } = useReloj();
  const T = TSP.acero;
  const tensa = rp(t, a, T.tensa, 2.2);
  const rompe = rp(t, a, T.rompe, 0.6);
  const cinta = rp(t, a, T.cinta, 0.8);
  const yRotura = 760;
  return (
    <Marco>
      <Cielo u={0.55} t={t} sc={t * 50} />
      {/* cable de acero (gris) que se estira y se parte por su propio peso */}
      <g opacity={1 - cinta * 0.0}>
        {rompe < 0.02 ? (
          <rect x={440 - 12} y={0} width={24} height={H} fill="#9FB0C4" stroke="#4A5A6A" strokeWidth={4} />
        ) : (
          <g>
            <path d={`M 428 0 L 428 ${yRotura - 50} Q ${428 - 60 * rompe} ${yRotura} ${400 - 160 * rompe} ${yRotura + 200 * rompe} L ${424 - 150 * rompe} ${yRotura + 210 * rompe} Q ${452 - 40 * rompe} ${yRotura + 20} 452 ${yRotura - 50} L 452 0 Z`} fill="#9FB0C4" stroke="#4A5A6A" strokeWidth={4} />
            <path d={`M 428 ${H} L 428 ${yRotura + 100 + 500 * rompe} Q ${560 + 200 * rompe} ${yRotura + 400 * rompe} ${540 + 360 * rompe} ${yRotura + 360 + 500 * rompe}`} fill="none" stroke="#9FB0C4" strokeWidth={22} strokeLinecap="round" opacity={0.0} />
          </g>
        )}
        {Array.from({ length: 22 }, (_, i) => rompe < 0.02 ? <line key={i} x1={428} y1={i * 90} x2={452} y2={i * 90 + 14} stroke="#4A5A6A" strokeWidth={3} /> : null)}
        {/* tensión: líneas que vibran y se calientan */}
        {rompe < 0.02 && tensa > 0 && <rect x={428} y={yRotura - 30} width={24} height={60} fill="#FF5A4A" opacity={0.3 + 0.6 * tensa} />}
        {rompe >= 0.02 && Array.from({ length: 9 }, (_, i) => <circle key={i} cx={440 + Math.sin(i * 3) * 160 * rompe} cy={yRotura + i * 30 * rompe} r={8} fill="#FFD39A" opacity={1 - rompe * 0.6} />)}
        <Onoma x={640} y={yRotura - 110} texto="¡PLING!" k={rp(t, a, T.rompe, 0.4)} color="#FF5A4A" px={92} rot={-9} id="esp-pling" />
      </g>
      {/* la cinta aguanta */}
      <Cinta x={720} y0={0} y1={H} ancho={30 * cinta} t={t} brillo={cinta} />
      <g opacity={cinta}><Trepador x={720} y={1180} t={t} s={0.55} cara="feliz" laser={0.4} /></g>
      {/* pesas que cargan el cable */}
      {Array.from({ length: 8 }, (_, i) => <g key={i} transform={`translate(440 ${200 + i * 200})`} opacity={rompe < 0.02 ? 1 : 0}><rect x={-34} y={-20} width={68} height={40} rx={8} fill="#4A5A6A" stroke="#222" strokeWidth={3} /></g>)}
      <Viñeta />
    </Marco>
  );
};

/* ───────────── esp-lab ───────────── */

export const EspLab: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TSP.lab;
  const sP = spr(f, a(T.pinza), { damping: 12, stiffness: 120, mass: 0.8 });
  const gr = rp(t, a, T.grieta, 0.9);
  const largo = easeInOut((t - a(T.largo)) / a(1.6));
  const km = rp(t, a, T.km, 0.6);
  const defecto = rp(t, a, T.defecto, 0.4);
  const uid = useUid();
  return (
    <>
    <Marco fondo="#0B1530">
      <rect width={W} height={H} fill="#0B1530" />
      {Array.from({ length: 28 }, (_, i) => <line key={i} x1={i * 40} y1={0} x2={i * 40} y2={H} stroke="#4FE3FF" strokeWidth={1} opacity={0.07} />)}
      {/* regla de laboratorio y una pinza con un nanotubo diminuto */}
      <g opacity={clamp(sP * 2)} transform={`translate(0 ${(1 - sP) * -120})`}>
        <rect x={140} y={300} width={800} height={70} fill="#E8D89A" stroke="#7A6A2A" strokeWidth={4} />
        {Array.from({ length: 41 }, (_, i) => <line key={i} x1={160 + i * 19} y1={300} x2={160 + i * 19} y2={i % 5 === 0 ? 346 : 328} stroke="#4A3A10" strokeWidth={i % 5 === 0 ? 4 : 2} />)}
        <path d="M 520 120 L 560 360 M 600 120 L 580 360" stroke="#9FB0C4" strokeWidth={14} strokeLinecap="round" />
        <rect x={552} y={372} width={92} height={10} rx={4} fill="#fdc300" />
      </g>
      {/* ampliación: la red hexagonal con un átomo que falta y una grieta que corre */}
      <g transform="translate(540 960)">
        <circle r={340} fill="#08122F" stroke="#4FE3FF" strokeWidth={8} />
        <clipPath id={`${uid}c`}><circle r={336} /></clipPath>
        <g clipPath={`url(#${uid}c)`} transform="translate(-540 -960)"><Hexa x={200} y={620} w={680} h={680} z={0.9} t={t} /></g>
        {defecto > 0 && <g><circle cx={30} cy={-10} r={34 + 8 * Math.sin(t * 8)} fill="#08122F" stroke="#FF5A4A" strokeWidth={6} /><circle cx={30} cy={-10} r={50} fill="none" stroke="#FF5A4A" strokeWidth={3} strokeDasharray="8 8" opacity={defecto} /></g>}
        {gr > 0 && <path d={`M 30 -10 L ${30 + 300 * gr} ${-10 + 90 * gr} M 30 -10 L ${30 - 300 * gr} ${-10 - 120 * gr}`} stroke="#FF5A4A" strokeWidth={10} strokeLinecap="round" />}
        <Onoma x={0} y={-390} texto="¡CRAC!" k={gr} color="#FF5A4A" px={80} rot={-6} id="esp-crac" />
      </g>
      {/* lo que hace falta: una cinta que se estira hasta el cielo */}
      <g opacity={largo}>
        <Cinta x={540} y0={lerp(1500, 0, largo)} y1={H} ancho={20} t={t} brillo={1} />
        {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={azar(i * 3.3) * W} cy={azar(i * 5.1) * 900} r={2.5} fill="#FFF" opacity={0.7} />)}
      </g>
      <Viñeta />
    </Marco>
      <Dato valor={100000 * km} x={W / 2} y={1620} px={100} digitos={6} color="#fdc300" sufijo=" km" id="esp-faltan" opacidad={clamp(km * 3)} />
    </>
  );
};

/* ───────────── esp-cierre ───────────── */

export const EspCierre: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const T = TSP.cierre;
  const baja = easeInOut((t - a(T.apice)) / a(T.obra - T.apice + 0.4));
  const u = lerp(1, 0.02, clamp(baja * 1.1));
  const ch = [rp(t, a, T.check1, 0.4), rp(t, a, T.check2, 0.4), rp(t, a, T.check3, 0.4)];
  const sello = rp(t, a, T.sello, 0.4);
  const obra = rp(t, a, T.obra - 0.6, 1.0);
  const items = ["materiales", "cimientos", "papeles"];
  return (
    <Marco>
      <Cielo u={u} t={t} sc={baja * 2600} />
      {/* arriba: el contrapeso y la cinta */}
      <g transform={`translate(0 ${baja * 2200 - 100})`}><Contrapeso x={540} y={160} t={t} s={0.7} /><Cinta x={540} y0={300} y1={2600} ancho={22} t={t} brillo={1} /></g>
      <g transform={`translate(0 ${baja * 2400 - 140})`} opacity={1 - clamp(baja * 1.6)}><Trepador x={540} y={720} t={t} s={0.5} cara="feliz" laser={0.3} /></g>
      {/* abajo: la obra con bases verificadas */}
      <g opacity={obra} transform={`translate(0 ${(1 - obra) * 220})`}>
        <rect x={0} y={1180} width={W} height={H - 1180} fill="#4A5A3A" />
        <rect x={0} y={1180} width={W} height={14} fill="#7A8A5A" />
        {/* cimientos y estructura */}
        <rect x={190} y={1380} width={700} height={140} fill="#9A9C98" stroke="#4A5156" strokeWidth={6} />
        {Array.from({ length: 8 }, (_, i) => <line key={i} x1={190 + i * 100} y1={1380} x2={190 + i * 100} y2={1520} stroke="#6A7176" strokeWidth={3} />)}
        {[250, 450, 650, 830].map((x, i) => <rect key={i} x={x} y={1180 + (3 - i) * 30} width={24} height={200 - (3 - i) * 30} fill="#6A7176" />)}
        <rect x={200} y={1170} width={680} height={20} fill="#fdc300" />
        {/* lista de verificación */}
        <g transform="translate(540 1650)">
          {items.map((it, i) => <g key={it} transform={`translate(${-250 + i * 250} 0)`}><rect x={-46} y={-46} width={92} height={92} rx={14} fill="#F4F6F9" stroke="#0f1c46" strokeWidth={6} /><path d="M -26 2 L -6 24 L 28 -22" stroke="#2E9B3A" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray="120" strokeDashoffset={120 * (1 - ch[i])} /></g>)}
        </g>
        <Persona x={140} y={1520} s={2.4} t={t} color="#fdc300" />
      </g>
      <Sello x={540} y={700} texto="VERIFICADO" k={sello} color="#fdc300" px={84} rot={-8} id="esp-verificado" />
      <Viñeta f={0.4} />
    </Marco>
  );
};
