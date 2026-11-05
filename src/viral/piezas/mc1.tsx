/**
 * «Los cuadernos radiactivos de Marie Curie» (SINAPSIS · historia de la medicina) · escenas 1/2
 *   mc-gancho     caja de plomo con el cuaderno que aún emite radiación y un Geiger que chasquea; 159 años de su nacimiento
 *   mc-paris      nació en Varsovia, donde las mujeres no podían estudiar en la universidad, y se fue a París (1891)
 *   mc-elementos  1898: con Pierre descubre el polonio (nombrado por su país) y el radio
 *   mc-toneladas  para obtener una décima de gramo de radio procesó toneladas de mineral durante años
 * Dibujos esquemáticos; no son imágenes de la época.
 */
import React from "react";
import { MCU, TMC, aniversarioAnios } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases, FONT, MONOF } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { CajaPlomo, Chip, Cuaderno, Geiger, LineaH, MC, Mujer, SERIF, Trebol, Vial, Ambiente, azar } from "./mc-kit";

type P = { e: EscenaViralGuardada };

/* ───────────── mc-gancho ───────────── */

export const McGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TMC.gancho;
  const kCaja = clamp((t - a(G.caja)) / 0.9);
  const kAb = clamp((t - a(G.caja) - 1.0) / 1.0);
  const pc = easeOut((t - a(G.anios)) / a(G.aniosDur));
  const n = Math.round(aniversarioAnios(MCU.hoyAnio, MCU.nace.a) * pc);
  const nivel = clamp((t - a(G.geiger)) / 1.2) * (0.35 + 0.5 * kCaja);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={880} intensidad={0.6 + 0.8 * kCaja} />
        <CajaPlomo x={540} y={1090} s={1.5} tapa={kCaja} />
        <Cuaderno x={540} y={lerp(1000, 800, easeOut(kCaja))} s={lerp(0.5, 0.95, easeOut(kCaja))} abierto={kAb} brillo={0.2 + 0.8 * kCaja} t={t} />
        <Geiger x={150} y={1300} s={0.62} nivel={nivel} t={t} />
        <g opacity={clamp(kCaja * 2)}><Trebol x={930} y={1310} r={56} /></g>
        <LineaH pos={5 * pc} y={1430} />
      </svg>
      <Chip x={540} y={606} texto="7 NOV 1867  →  7 NOV 2026" color={MC.hielo} px={30} anchor="center" id="mc-gancho-fechas" opacidad={clamp((t - a(G.fecha)) / 0.4)} />
      <Frases frases={[{ t: 0.2, texto: "SUS CUADERNOS\nSIGUEN SIENDO\nRADIACTIVOS", px: 84, color: MC.rad }, { t: G.fecha, texto: "ESTE SÁBADO:", px: 92 }, { t: G.anios, texto: `${n} AÑOS`, px: 130, color: MC.oro }]} y={450} x={104} id="titular-mc-gancho" />
      <Fuente texto="Marie Curie nació en Varsovia el 7 de noviembre de 1867. Sus cuadernos se conservan en cajas forradas de plomo. Dibujo esquemático." y={1510} delay={G.anios} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── mc-paris ───────────── */

export const McParis: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const V = TMC.paris;
  const kV = spr(f, a(V.varsovia), { damping: 13, stiffness: 140, mass: 0.8 });
  const kPu = spr(f, a(V.puerta), { damping: 9, stiffness: 200, mass: 0.8 });
  const kVia = easeOut((t - a(V.viaje)) / a(V.viajeDur));
  const kPa = spr(f, a(V.paris), { damping: 11, stiffness: 150, mass: 0.8 });
  const A = { x: 800, y: 800 }, B = { x: 260, y: 960 }, C = { x: 540, y: 640 };
  const pt = (u: number): [number, number] => { const m = 1 - u; return [m * m * A.x + 2 * m * u * C.x + u * u * B.x, m * m * A.y + 2 * m * u * C.y + u * u * B.y]; };
  const [mx, my] = pt(kVia);
  const trayecto = Array.from({ length: 30 }, (_, i) => pt((i / 29) * kVia));
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={880} intensidad={0.5} />
        {/* cuadrícula de mapa */}
        {Array.from({ length: 6 }, (_, i) => <line key={i} x1={80} y1={620 + i * 120} x2={1000} y2={620 + i * 120} stroke={MC.hielo} strokeOpacity={0.07} strokeWidth={2} />)}
        {Array.from({ length: 8 }, (_, i) => <line key={i} x1={100 + i * 120} y1={600} x2={100 + i * 120} y2={1240} stroke={MC.hielo} strokeOpacity={0.07} strokeWidth={2} />)}
        {/* trayecto */}
        <path d={`M ${A.x} ${A.y} Q ${C.x} ${C.y} ${B.x} ${B.y}`} stroke={MC.hielo} strokeOpacity={0.18} strokeWidth={5} strokeDasharray="12 14" fill="none" />
        <polyline points={trayecto.map(([x, y]) => `${x},${y}`).join(" ")} stroke={MC.rad} strokeWidth={7} strokeLinecap="round" fill="none" opacity={kVia > 0 ? 1 : 0} />
        {/* Varsovia + universidad cerrada */}
        <g opacity={clamp(kV * 2)}>
          <circle cx={A.x} cy={A.y} r={16} fill={MC.oro} stroke="#fff" strokeWidth={5} /><circle cx={A.x} cy={A.y} r={34 + 6 * Math.sin(t * 4)} fill="none" stroke={MC.oro} strokeOpacity={0.4} strokeWidth={4} />
          <g transform={`translate(${A.x} ${A.y + 150})`}>
            <polygon points="-120,-20 0,-80 120,-20" fill="#8A7A5A" stroke="#4A3E26" strokeWidth={4} /><rect x={-104} y={-20} width={208} height={110} fill="#C9BEA0" stroke="#4A3E26" strokeWidth={4} />
            <rect x={-30} y={20} width={60} height={70} rx={4} fill="#3A2412" />{[-80, 80].map((wx) => <rect key={wx} x={wx - 14} y={0} width={28} height={40} fill="#5A6A7A" />)}
          </g>
        </g>
        <g opacity={clamp(kPu * 2)} transform={`translate(${A.x} ${A.y + 100}) scale(${0.5 + 0.5 * clamp(kPu)})`}><circle r={54} fill="#5A1A1A" stroke={MC.rojo} strokeWidth={8} /><path d="M -22 -22 L 22 22 M 22 -22 L -22 22" stroke="#fff" strokeWidth={11} strokeLinecap="round" /></g>
        {/* París + Sorbona */}
        <g opacity={clamp(kPa * 2)}>
          <circle cx={B.x} cy={B.y} r={16} fill={MC.rad} stroke="#fff" strokeWidth={5} /><circle cx={B.x} cy={B.y} r={34 + 6 * Math.sin(t * 4)} fill="none" stroke={MC.rad} strokeOpacity={0.4} strokeWidth={4} />
          <g transform={`translate(${B.x} ${B.y + 150})`}>
            <path d="M -50 -60 A 50 50 0 0 1 50 -60 Z" fill="#8A7A5A" stroke="#4A3E26" strokeWidth={4} transform="translate(0 -20)" /><rect x={-120} y={-30} width={240} height={110} fill="#C9BEA0" stroke="#4A3E26" strokeWidth={4} />
            {[-80, -30, 30, 80].map((wx) => <rect key={wx} x={wx - 10} y={-10} width={20} height={36} fill="#5A6A7A" />)}<rect x={-24} y={30} width={48} height={50} rx={4} fill="#3A2412" />
          </g>
        </g>
        {/* ella viaja */}
        {kVia > 0 && kVia < 1 && <Mujer x={mx} y={my - 40} s={0.36} bata={false} />}
        <LineaH pos={1} y={1430} />
      </svg>
      <Chip x={620} y={600} texto={"VARSOVIA\n1867"} color={MC.oro} px={28} id="mc-paris-v" opacidad={clamp(kV * 2)} />
      <Chip x={100} y={600} texto={"PARÍS\n1891 · SORBONA"} color={MC.rad} px={28} id="mc-paris-p" opacidad={clamp(kPa * 2)} />
      <Chip x={800} y={1076} texto={"universidad\nsin mujeres"} color={MC.rojo} px={22} anchor="center" id="mc-paris-sin" opacidad={clamp(kPu * 2)} />
      <Frases frases={[{ t: 0.2, texto: "NACIÓ EN\nVARSOVIA", px: 100 }, { t: V.puerta - 0.1, texto: "MUJERES SIN\nUNIVERSIDAD", px: 92, color: MC.rojo }, { t: V.viaje - 0.1, texto: "SE FUE\nA PARÍS", px: 104, color: MC.rad }]} y={450} x={104} id="titular-mc-paris" />
      <Fuente texto="Varsovia no admitía mujeres en su universidad; Maria Skłodowska se instaló en París en 1891 para estudiar en la Sorbona. Mapa esquemático." y={1510} delay={V.puerta} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── mc-elementos ───────────── */

const Tile: React.FC<{ x: number; y: number; z: number; sim: string; nombre: string; k: number; color: string }> = ({ x, y, z, sim, nombre, k, color }) => (
  <g opacity={clamp(k * 2)} transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * clamp(k)}) translate(${-x} ${-y})`}>
    <circle cx={x} cy={y} r={250} fill={color} opacity={0.14} />
    <rect x={x - 180} y={y - 190} width={360} height={380} rx={26} fill="#0B1614" stroke={color} strokeWidth={8} />
    <text x={x - 150} y={y - 130} fontFamily={MONOF} fontWeight={800} fontSize={48} fill={color}>{z}</text>
    <text x={x} y={y + 50} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={190} fill="#fff">{sim}</text>
    <text x={x} y={y + 140} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={36} fill={color} letterSpacing="0.1em">{nombre}</text>
  </g>
);

export const McElementos: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const E = TMC.elementos;
  const kP = spr(f, a(E.polonio), { damping: 11, stiffness: 160, mass: 0.8 });
  const kR = spr(f, a(E.radio), { damping: 11, stiffness: 160, mass: 0.8 });
  const kPais = clamp((t - a(E.pais)) / 0.4);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={900} intensidad={0.7} />
        <Tile x={300} y={900} z={MCU.zPolonio} sim="Po" nombre="POLONIO" k={kP} color={MC.oro} />
        <Tile x={780} y={900} z={MCU.zRadio} sim="Ra" nombre="RADIO" k={kR} color={MC.rad} />
        {/* bandera de Polonia */}
        <g opacity={kPais} transform="translate(300 1130)"><rect x={-60} y={-20} width={120} height={40} fill="#fff" /><rect x={-60} y={0} width={120} height={20} fill="#DC143C" /><rect x={-60} y={-20} width={120} height={40} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={3} /></g>
        <g opacity={clamp(kR * 2)}><Vial x={780} y={1240} s={0.8} brillo={kR} t={t} /></g>
        <LineaH pos={2} y={1430} />
      </svg>
      <Chip x={104} y={604} texto={t < a(E.pierre) ? "1898" : "1898 · CON PIERRE CURIE"} color={MC.oro} px={30} id="mc-elem-chip" opacidad={clamp((t - a(E.anio)) / 0.4)} />
      <Chip x={300} y={1150} texto={"nombrado por\nsu país"} color={MC.hielo} px={22} anchor="center" id="mc-elem-pais" opacidad={kPais} />
      <Frases frases={[{ t: 0.2, texto: "EN 1898…", px: 116 }, { t: E.polonio - 0.1, texto: "DESCUBRE EL\nPOLONIO", px: 100, color: MC.oro }, { t: E.radio - 0.1, texto: "…Y EL RADIO", px: 108, color: MC.rad }]} y={450} x={104} id="titular-mc-elem" />
      <Fuente texto="Polonio (jul 1898) y radio (dic 1898), descubiertos por Marie y Pierre Curie; el polonio se nombró por Polonia, su país natal. Dibujo esquemático." y={1510} delay={E.polonio} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── mc-toneladas ───────────── */

export const McToneladas: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const T = TMC.toneladas;
  const kG = spr(f, a(T.gramo), { damping: 12, stiffness: 150, mass: 0.8 });
  const kM = clamp((t - a(T.mineral)) / 1.2);
  const kA = spr(f, a(T.anios), { damping: 11, stiffness: 170, mass: 0.8 });
  const sacos = Array.from({ length: 10 }, (_, i) => { const fila = i < 4 ? 0 : i < 7 ? 1 : i < 9 ? 2 : 3, idx = i < 4 ? i : i < 7 ? i - 4 : i < 9 ? i - 7 : 0; const n = [4, 3, 2, 1][fila]; return { x: 210 + (idx - (n - 1) / 2) * 130 + 100, y: 1140 - fila * 74, i }; });
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={950} intensidad={0.6} />
        {/* sacos de mineral */}
        {sacos.map((s) => { const k = clamp((kM * 10 - s.i) / 1); return k > 0 ? (
          <g key={s.i} opacity={k} transform={`translate(${s.x} ${s.y - (1 - k) * 60})`}><ellipse cx={0} cy={0} rx={62} ry={42} fill="#8A6A3A" stroke="#4A3418" strokeWidth={4} /><path d="M -30 -34 Q 0 -52 30 -34" stroke="#4A3418" strokeWidth={5} fill="none" /><text x={0} y={10} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={22} fill="#2A1C0A">U</text></g>
        ) : null; })}
        {/* olla */}
        <g opacity={clamp(kM * 2)} transform="translate(560 1100)">
          <ellipse cx={0} cy={90} rx={150} ry={30} fill="#FF8A2A" opacity={0.25 + 0.15 * Math.sin(t * 9)} />
          <path d="M -120 -90 L -100 70 Q 0 100 100 70 L 120 -90 Z" fill="#1B1B22" stroke="#4A4A56" strokeWidth={6} /><ellipse cx={0} cy={-90} rx={120} ry={26} fill="#0F3A30" stroke="#4A4A56" strokeWidth={6} /><ellipse cx={0} cy={-90} rx={100} ry={18} fill={MC.radOsc} />
          <line x1={20} y1={-90} x2={150 + 24 * Math.sin(t * 2.5)} y2={-250} stroke="#8A6A3A" strokeWidth={10} strokeLinecap="round" />
          {Array.from({ length: 5 }, (_, i) => { const u = ((t * 0.4 + i / 5) % 1); return <circle key={i} cx={-60 + i * 30} cy={-110 - u * 100} r={8 + u * 8} fill="#fff" opacity={0.25 * (1 - u)} />; })}
        </g>
        {/* el gramo */}
        <g opacity={clamp(kG * 2)} transform={`translate(${lerp(540, 880, easeOut(kM))} ${lerp(980, 1100, easeOut(kM))}) scale(${lerp(1.5, 0.9, easeOut(kM))})`}><Vial x={0} y={0} s={1} brillo={kG} t={t} /></g>
        <g opacity={clamp(kA * 2)}><rect x={110} y={650} width={860} height={14} rx={7} fill={MC.hielo} opacity={0.18} /><rect x={110} y={650} width={860 * clamp(kA)} height={14} rx={7} fill={MC.oro} /></g>
        <LineaH pos={2.4} y={1430} />
      </svg>
      <Chip x={540} y={1262} texto={`${String(MCU.radioGramos).replace(".", ",")} g DE RADIO`} color={MC.rad} px={34} anchor="center" id="mc-ton-gramo" opacidad={clamp(kG * 2)} />
      <Chip x={540} y={684} texto="≈ 3–4 AÑOS DE TRABAJO" color={MC.oro} px={26} anchor="center" id="mc-ton-anios" opacidad={clamp(kA * 2)} />
      <Frases frases={[{ t: 0.2, texto: "UNA DÉCIMA\nDE GRAMO", px: 100, color: MC.rad }, { t: T.mineral - 0.1, texto: "TONELADAS\nDE MINERAL", px: 100 }, { t: T.anios - 0.1, texto: "DURANTE\nAÑOS", px: 108, color: MC.oro }]} y={450} x={104} id="titular-mc-ton" />
      <Fuente texto="En 1902 aisló ≈ 0,1 g de cloruro de radio a partir de toneladas de residuo de pecblenda (las fuentes dan entre 1 y varias toneladas y 3–4 años). Esquema." y={1510} delay={T.mineral} />
      <Cap e={e} />
    </Fondo>
  );
};
