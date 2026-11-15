/**
 * «Derinkuyu» (IMNOBA · ciudad subterránea) · escenas 2/2. Casi sin texto: todo el cuadro es dibujo y se explica solo.
 *   der-puerta     una puerta de piedra de media tonelada rueda y se cierra desde dentro
 *   der-gente      hasta 20.000 personas con sus animales llenan los pisos
 *   der-tunel      túneles que, se cree, unían ciudades vecinas
 *   der-invasores  arriba los invasores no encuentran a nadie; abajo, silencio
 *   der-hoy        hoy solo se visita una parte (luces, cascos, valla)
 *   der-cierre     ¿y si derribas otra pared?
 */
import React from "react";
import { DER, TDR } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, lerp, useReloj } from "../comun";
import { azar } from "../../lib/anim";
import { FONT } from "./real-kit";
import { Dato } from "./real1";
import { Aldeano, Animal, Antorcha, Camara, Ciudad, CasaCorte, DR, Galerias, NIV, Polvo, PuertaPiedra, RocaFondo, Soldado, Superficie, Vineta, pisoY } from "./der-kit";
import { Medidor } from "./der1";

type P = { e: EscenaViralGuardada };

/* ───────────── der-puerta ───────────── */

export const DerPuerta: React.FC<P> = () => {
  const { t, a } = useReloj();
  const T = TDR.puerta;
  const rueda = easeInOut((t - a(T.rueda)) / a(T.ruedaDur));
  const golpe = clamp(1 - (t - a(T.golpe)) / 0.5) * (t >= a(T.golpe) ? 1 : 0);
  const sh = golpe * 14;
  const vienen = clamp((t - a(T.vienen)) / a(1.6));
  const rebote = easeOut((t - a(T.golpe)) / a(0.9));
  const huyen = clamp((t - a(T.huyen)) / a(1.6));
  const lanza = clamp((t - a(T.lanza)) / a(0.5)) * (1 - clamp((t - a(T.lanza) - 0.7) / 0.3));
  const dx = lerp(-260, 600, rueda);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, background: "#150D07" }}>
      <g transform={`translate(${Math.sin(t * 90) * sh} ${Math.cos(t * 77) * sh})`}>
        <RocaFondo y0={0} y1={1920} x0={-200} x1={1300} />
        {/* túnel con arco y piso */}
        <path d="M -40 1180 L -40 760 Q 540 520 1120 760 L 1120 1180 Z" fill="#1C1209" stroke="#0A0603" strokeWidth={8} />
        <rect x={-40} y={1150} width={1160} height={60} fill="#3A2818" />
        <rect x={-40} y={1150} width={1160} height={10} fill="#6A4A2A" opacity={0.6} />
        {/* marco de la puerta (el vano) */}
        <path d="M 520 1150 L 520 800 Q 600 770 680 800 L 680 1150 Z" fill="#0A0603" opacity={0.0} />
        {/* antorchas en el muro */}
        {[90, 300, 840, 1000].map((x, i) => <Antorcha key={i} x={x} y={900} t={t} sem={i} s={1.6} />)}
        {/* defensores que empujan la piedra desde la izquierda */}
        {[0, 1, 2, 3].map((i) => <Aldeano key={i} x={dx - 190 - i * 56} y={1150} s={2.3} t={t} sem={i * 1.3} pose="empuja" />)}
        {/* invasores: llegan corriendo a la derecha */}
        {[0, 1, 2].map((i) => {
          const x0 = 1260 + i * 120, xf = 840 + i * 90;
          const x = lerp(x0, xf, easeOut(vienen)) + rebote * (70 + i * 40) + huyen * 480;
          const caido = rebote > 0.05 && huyen < 0.2;
          return (
            <g key={i} transform={`rotate(${caido ? -70 * Math.min(1, rebote * 2) : 0} ${x} 1150)`}>
              <Soldado x={x} y={1150} s={2.6} t={t * (huyen > 0 ? 2 : 1)} sem={i * 2} espejo busca={t > a(T.golpe) + 0.4 && huyen < 0.1} duda={clamp((t - a(T.golpe) - 0.4) * 2)} />
              <Antorcha x={x - 30} y={1060} t={t} sem={i} s={0.9} glow={0.6} />
            </g>
          );
        })}
        {/* la gran piedra */}
        <g transform={`translate(0 0)`}>
          <PuertaPiedra x={dx} y={1030} r={150} rot={rueda * 300} />
          {/* lanza que asoma por el orificio */}
          <g transform={`translate(${dx + 80} 1030)`} opacity={lanza}><line x1={-20} y1={0} x2={240 * lanza} y2={0} stroke="#5A3A1E" strokeWidth={9} /><path d={`M ${240 * lanza} -14 L ${240 * lanza + 44} 0 L ${240 * lanza} 14 Z`} fill="#C9CED6" /></g>
        </g>
        {Array.from({ length: 12 }, (_, i) => { const q = clamp((t - a(T.golpe) - i * 0.03) / 0.9); return q > 0 && q < 1 ? <circle key={i} cx={dx + 130 + Math.sin(i * 3) * 80 * q} cy={1130 - q * 160 * (0.4 + azar(i)) } r={14 + q * 30} fill="#CDB68A" opacity={0.6 * (1 - q)} /> : null; })}
      </g>
      <Polvo t={t} n={36} />
      <Vineta t={t} fuerza={0.6} />
    </svg>
  );
};

/* ───────────── der-gente ───────────── */

export const DerGente: React.FC<P> = () => {
  const { t, a } = useReloj();
  const T = TDR.gente;
  const zoom = 0.46 + 0.02 * Math.sin(t * 0.8);
  const yc = 1950 + Math.sin(t * 0.5) * 40;
  const h = (H / 2) / zoom;
  const gente = Array.from({ length: NIV }, (_, k) => clamp((t - a(T.llena + k * (T.llenaDur / NIV))) / a(0.9)));
  const num = easeOut((t - a(T.dato)) / a(T.datoDur));
  return (
    <>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, background: "#150D07" }}>
        <Camara yc={yc} zoom={zoom}>
          <RocaFondo y0={-100} y1={4700} />
          <Superficie t={t} vacia />
          <Galerias t={t} yMin={yc - h} yMax={yc + h} />
          <Ciudad t={t} yMin={yc - h} yMax={yc + h} gente={gente} />
          {gente.map((g, k) => g > 0 && g < 1 ? <rect key={k} x={0} y={pisoY(k) - 200} width={1080} height={220} fill="#FFE2B0" opacity={0.18 * Math.sin(g * Math.PI)} /> : null)}
        </Camara>
        <Polvo t={t} n={24} />
        <Vineta t={t} fuerza={0.5} />
        <rect x={0} y={1580} width={W} height={340} fill="#150D07" opacity={0.7} />
      </svg>
      <Dato valor={DER.personas * num} x={W / 2} y={1620} px={170} digitos={5} color="#FFC500" id="der-personas" opacidad={clamp(num * 4)} />
    </>
  );
};

/* ───────────── der-tunel ───────────── */

const MiniCiudad: React.FC<{ x: number; t: number; luz?: number }> = ({ x, t, luz = 1 }) => (
  <g transform={`translate(${x} 240) scale(0.5)`}><Ciudad t={t} yMin={-200} yMax={3500} luz={luz} /></g>
);

export const DerTunel: React.FC<P> = () => {
  const { t, a } = useReloj();
  const T = TDR.tunel;
  const pan = easeInOut((t - a(T.pan)) / a(T.panDur));
  const xc = lerp(540, 3140, pan);
  const murc = clamp((t - a(T.murcielago)) / 0.4) * (1 - clamp((t - a(T.murcielago) - 2.4) / 0.4));
  const ojos = clamp((t - a(T.ojos)) / 0.4);
  const ciudad = clamp((t - a(T.ciudad)) / a(1.2));
  // trazado ondulado del túnel
  const ty = (x: number): number => 1000 + Math.sin(x / 260) * 120;
  const pts = Array.from({ length: 42 }, (_, i) => [i * 100, ty(i * 100)] as [number, number]);
  const arriba = pts.map(([x, y]) => `${x},${y - 70}`).join(" L ");
  const abajo = [...pts].reverse().map(([x, y]) => `${x},${y + 70}`).join(" L ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, background: "#150D07" }}>
      <Camara yc={960} zoom={1.0} xc={xc}>
        <RocaFondo y0={0} y1={1920} x0={-1000} x1={4600} />
        <MiniCiudad x={-200} t={t} />
        <MiniCiudad x={3200} t={t} luz={0.6 + 0.4 * ciudad} />
        <path d={`M ${arriba} L ${abajo} Z`} fill="#140B05" stroke="#0A0603" strokeWidth={6} />
        {/* antorchas en el túnel */}
        {Array.from({ length: 14 }, (_, i) => <Antorcha key={i} x={300 + i * 260} y={ty(300 + i * 260) - 60} t={t} sem={i} s={0.8} glow={0.8} />)}
        {/* fila de gente agachada con antorchas y un burro con carga */}
        {Array.from({ length: 9 }, (_, i) => { const x = lerp(150, 3000, ((t * 0.045 + i * 0.1) % 1)); return <g key={i} transform={`rotate(10 ${x} ${ty(x) + 60})`}><Aldeano x={x} y={ty(x) + 60} s={1.3} t={t} sem={i * 1.7} pose="camina" antorcha={i % 3 === 0} /></g>; })}
        {Array.from({ length: 2 }, (_, i) => { const x = lerp(250, 3000, ((t * 0.04 + i * 0.5) % 1)); return <Animal key={i} x={x} y={ty(x) + 60} s={0.85} t={t} sem={i} tipo="burro" camina />; })}
        {/* gotas del techo y telarañas */}
        {Array.from({ length: 10 }, (_, i) => { const x = 200 + i * 330, q = (t * 0.8 + i * 0.3) % 1; return <circle key={i} cx={x} cy={ty(x) - 66 + q * 120} r={4} fill="#6FD6FF" opacity={0.7 * (1 - q)} />; })}
        {/* ojos que miran desde un hueco */}
        <g opacity={ojos} transform={`translate(${xc + 230} ${ty(xc + 230) - 130})`}><ellipse cx={0} cy={0} rx={60} ry={34} fill="#050302" /><circle cx={-18} cy={0} r={7} fill="#FFE27A" /><circle cx={18} cy={0} r={7} fill="#FFE27A" /><circle cx={-18} cy={0} r={2.5} fill="#000" /><circle cx={18} cy={0} r={2.5} fill="#000" /></g>
      </Camara>
      <g opacity={murc}>{[0, 1, 2, 3, 4].map((i) => { const x = lerp(1200, -200, clamp((t - a(T.murcielago)) / 2.8) + i * 0.0) + i * 90, y = 500 + Math.sin(t * 3 + i) * 80 + i * 90; const ala = Math.sin(t * 24 + i) * 14; return <path key={i} transform={`translate(${x} ${y})`} d={`M 0 0 Q -24 ${-20 + ala} -50 ${-4 + ala} Q -28 4 -10 6 Q 0 16 10 6 Q 28 4 50 ${-4 + ala} Q 24 ${-20 + ala} 0 0 Z`} fill="#1A1020" />; })}</g>
      <Polvo t={t} n={40} />
      <Vineta t={t} fuerza={0.7} />
    </svg>
  );
};

/* ───────────── der-invasores ───────────── */

export const DerInvasores: React.FC<P> = () => {
  const { t, a } = useReloj();
  const T = TDR.invasores;
  const llegan = easeOut((t - a(T.llegan)) / a(2.2));
  const huyen = clamp((t - a(T.huyen)) / a(1.4));
  const pisa = (t0: number) => clamp(1 - Math.abs(t - a(t0)) / 0.2);
  const sh = (pisa(1.4) + pisa(2.0) + pisa(3.4) + pisa(4.2)) * 5;
  const buscan = clamp((t - a(T.buscan)) / 0.5);
  const olf = clamp((t - a(T.olfatea)) / 0.4);
  const rasca = clamp((t - a(T.rascan)) / 0.4);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, background: "#150D07" }}>
      <Camara yc={170} zoom={1.0} dx={Math.sin(t * 90) * sh} dy={Math.cos(t * 77) * sh}>
        <RocaFondo y0={0} y1={4700} />
        <Superficie t={t} />
        <Ciudad t={t} yMin={-100} yMax={1100} />
        {/* aldeanos callados en cada nivel */}
        {[0, 1, 2, 3].map((k) => [200, 330, 760, 880].map((x, i) => <Aldeano key={`${k}${i}`} x={x} y={pisoY(k) - (k % 2) * 4} s={1.15} t={t} sem={k * 5 + i} pose={(k + i) % 2 ? "silencio" : "quieto"} />))}
        {/* polvo que cae del techo cuando pisan arriba */}
        {Array.from({ length: 24 }, (_, i) => { const q = (t * 1.2 + i / 24) % 1; return <circle key={i} cx={100 + azar(i * 3.3) * 880} cy={30 + q * 220} r={3} fill="#CDB68A" opacity={0.7 * (1 - q) * clamp(sh)} />; })}
        {/* soldados a caballo y a pie */}
        {[0, 1].map((i) => { const x = lerp(-400 - i * 250, 300 + i * 340, llegan) + huyen * 1300; return <g key={i}><Animal x={x} y={-4} s={1.6} t={t} sem={i} tipo="caballo" camina={llegan < 0.98 || huyen > 0} /><Soldado x={x + 8} y={-92} s={1.5} t={t} sem={i} /></g>; })}
        <Soldado x={lerp(1500, 640, llegan) + huyen * 900} y={0} s={2.2} t={t} sem={4} espejo busca duda={buscan} />
        <Soldado x={lerp(1700, 860, llegan) + huyen * 900} y={0} s={2.2} t={t} sem={6} espejo busca={rasca > 0.5} duda={rasca} />
        {/* olfateando el pozo: sale un hilo de vapor caliente y un aldeano se tapa la boca */}
        <g transform="translate(540 0)">{Array.from({ length: 6 }, (_, i) => { const q = (t * 0.5 + i / 6) % 1; return <circle key={i} cx={Math.sin(q * 9 + i) * 14} cy={-q * 160} r={10 + q * 24} fill="#FF9A5A" opacity={0.4 * olf * (1 - q)} />; })}</g>
        <text x={500} y={-300 - Math.sin(t * 6) * 4} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={110} fill="#FFE27A" stroke="#1A1008" strokeWidth={9} paintOrder="stroke" opacity={olf}>?</text>
      </Camara>
      <Polvo t={t} n={34} />
      <Vineta t={t} fuerza={0.45} cy={H * 0.62} />
    </svg>
  );
};

/* ───────────── der-hoy ───────────── */

export const DerHoy: React.FC<P> = () => {
  const { t, a } = useReloj();
  const T = TDR.hoy;
  const e = easeInOut((t - a(T.baja)) / a(T.bajaDur));
  const yc = lerp(330, 1260, e);
  const zoom = 1.2;
  const h = (H / 2) / zoom;
  const flash = clamp(1 - Math.abs(t - a(T.flash)) / 0.14);
  const ojos = clamp((t - a(T.ojos)) / 0.4);
  const luces = clamp((t - a(T.luces)) / a(1.4));
  const colores = ["#F2C230", "#E5432D", "#3E9BD9", "#6EC64A", "#E96FA8", "#FFFFFF"];
  const fila = Array.from({ length: 12 }, (_, i) => i);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, background: "#150D07" }}>
      <Camara yc={yc} zoom={zoom}>
        <RocaFondo y0={-100} y1={4700} />
        <Ciudad t={t} yMin={yc - h} yMax={yc + h} apagarDesde={8} luz={1} />
        {/* luces frías de visita en los 8 primeros niveles */}
        {Array.from({ length: 8 }, (_, k) => <rect key={k} x={60} y={pisoY(k) - 190} width={960} height={190} fill="#CFE8FF" opacity={0.1 * luces} />)}
        {/* turistas con casco y linterna bajando por las escaleras y salas */}
        {fila.map((i) => { const x = 160 + ((i * 83 + t * 70) % 760); const k = (i * 2 + Math.floor(t * 0.5)) % 8; const col = colores[i % 6]; return <g key={i}><Aldeano x={x} y={pisoY(k)} s={1.3} t={t} sem={i * 1.9} pose="camina" color={col} cabeza="#F2C230" /><path d={`M ${x + 12} ${pisoY(k) - 52} L ${x + 150} ${pisoY(k) - 80} L ${x + 150} ${pisoY(k) - 20} Z`} fill="#FFFFFF" opacity={0.14 * luces} /></g>; })}
        {/* guía con banderita */}
        <g><Aldeano x={540} y={pisoY(4)} s={1.5} t={t} sem={3} pose="camina" color="#E5432D" cabeza="#FFFFFF" /><g transform={`translate(560 ${pisoY(4) - 76})`}><line x1={0} y1={0} x2={0} y2={-60} stroke="#8A6A3A" strokeWidth={4} /><path d={`M 0 -60 l 40 ${8 + Math.sin(t * 6) * 4} l -40 16 Z`} fill="#E5432D" /></g></g>
        {/* valla y cinta en el nivel 9 */}
        <g transform={`translate(0 ${pisoY(7)})`}><rect x={420} y={-110} width={240} height={8} fill="#E5432D" /><rect x={420} y={-60} width={240} height={8} fill="#F2C230" /><rect x={420} y={-110} width={10} height={110} fill="#6A6A6A" /><rect x={650} y={-110} width={10} height={110} fill="#6A6A6A" /><path d="M 420 -102 L 660 -52 M 660 -102 L 420 -52" stroke="#FFFFFF" strokeWidth={6} opacity={0.7} /></g>
        {/* ojos en la oscuridad */}
        <g opacity={ojos} transform={`translate(780 ${pisoY(9) - 60})`}><circle cx={-18} cy={0} r={9} fill="#FFE27A" /><circle cx={18} cy={0} r={9} fill="#FFE27A" /><circle cx={-18} cy={0} r={3} fill="#000" /><circle cx={18} cy={0} r={3} fill="#000" /></g>
      </Camara>
      {/* indicador de pisos: 8 de 18 encendidos */}
      <g transform="translate(990 360)">{Array.from({ length: NIV }, (_, i) => <rect key={i} x={-18} y={i * 56} width={36} height={44} rx={8} fill={i < 8 ? "#6FD6FF" : "#2A2018"} stroke="#150D07" strokeWidth={3} opacity={i < 8 ? 0.7 + 0.3 * Math.sin(t * 5 + i) : 0.7} />)}</g>
      <Polvo t={t} n={30} />
      <Vineta t={t} fuerza={0.5} />
      <rect width={W} height={H} fill="#FFFFFF" opacity={flash * 0.85} />
      <Medidor yc={yc} zoom={zoom} />
    </svg>
  );
};

/* ───────────── der-cierre ───────────── */

export const DerCierre: React.FC<P> = () => {
  const { t, a } = useReloj();
  const T = TDR.cierre;
  const sube = easeInOut((t - a(T.sube)) / a(T.subeDur));
  const yc = lerp(2700, -110, sube);
  const zoom = lerp(0.5, 1.4, sube);
  const mira = clamp((t - a(T.mira)) / a(0.6));
  const alza = easeInOut((t - a(T.martillo)) / a(0.9));
  const golpe = clamp((t - a(T.golpe)) / a(0.25));
  const luz = clamp((t - a(T.luz)) / a(1.0));
  const sh = golpe > 0 && golpe < 1 ? 10 : 0;
  const guino = clamp((t - a(T.guino)) / 0.2) * (1 - clamp((t - a(T.guino) - 0.5) / 0.2));
  const h = (H / 2) / zoom;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, background: "#150D07" }}>
      <Camara yc={yc} zoom={zoom} dx={Math.sin(t * 90) * sh} dy={Math.cos(t * 77) * sh}>
        <RocaFondo y0={0} y1={4700} />
        <Superficie t={t} />
        <path d="M 722 56 L 800 56 L 840 130 L 850 250 L 790 250 L 760 140 L 722 140 Z" fill="#0C0704" />
        <Ciudad t={t} yMin={yc - h} yMax={yc + h} />
        <CasaCorte x={540} t={t} rotura={1} />
        {/* la otra pared (izquierda) que está a punto de caer */}
        <g><rect x={350} y={14} width={40} height={122} fill="#5A4026" stroke="#2E2014" strokeWidth={3} opacity={1 - luz} />{Array.from({ length: 5 }, (_, i) => <line key={i} x1={350} y1={14 + i * 24} x2={390} y2={14 + i * 24} stroke="#2E2014" strokeWidth={2} opacity={1 - luz} />)}
          {golpe > 0 && <path d="M 370 14 L 360 50 L 382 80 L 362 136" stroke="#FFD98A" strokeWidth={5} fill="none" opacity={golpe} />}
          {luz > 0 && <g><rect x={340} y={14} width={50} height={122} fill="#FFE8B0" opacity={0.85 * luz} />{Array.from({ length: 9 }, (_, i) => <line key={i} x1={365} y1={76} x2={365 + Math.cos(i * 0.7) * 400} y2={76 + Math.sin(i * 0.7 - 1.4) * 300} stroke="#FFE8B0" strokeWidth={10} opacity={0.12 * luz} />)}</g>}
        </g>
        {/* el hombre mira a cámara, guiña y alza el martillo */}
        <g opacity={clamp(mira * 3)}>
          <Aldeano x={470} y={136} s={2.3} t={t} sem={2.4} pose={golpe > 0 ? "pica" : "quieto"} espejo color="#3E6E8E" cabeza="#2A2A2A" />
          <g transform={`translate(${470 - 28} ${136 - 150 + (1 - alza) * 20}) rotate(${-40 + alza * 40})`} opacity={1 - golpe * 0.0}><line x1={0} y1={0} x2={0} y2={-70} stroke="#5A3A1E" strokeWidth={8} /><rect x={-22} y={-96} width={44} height={30} rx={4} fill="#8A8F96" stroke="#2A2A2E" strokeWidth={3} /></g>
          {guino > 0 && <text x={452} y={136 - 120} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={70} fill="#FFE27A" stroke="#1A1008" strokeWidth={7} paintOrder="stroke" opacity={guino}>;)</text>}
        </g>
        {/* un aldeano saluda desde el agujero */}
        <g opacity={clamp((t - a(T.aparece)) / 0.4)}><Aldeano x={790} y={136} s={1.4} t={t} sem={8} pose="baila" color="#B35A3C" /></g>
      </Camara>
      <Polvo t={t} n={28} />
      <Vineta t={t} fuerza={0.5} cy={H * 0.56} />
      <rect width={W} height={H} fill="#FFF0C0" opacity={luz * 0.5 * (1 - clamp((t - a(T.luz) - 1.0) / 0.8))} />
    </svg>
  );
};
