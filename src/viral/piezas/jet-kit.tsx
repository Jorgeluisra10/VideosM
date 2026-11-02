/**
 * Kit del video «El aire que no avisa» (SINAPSIS · medicina de altura): figuras tipo render, todo en vectores (SVG) y deterministas.
 *   Cielo        cielo al atardecer con mar de nubes en paralaje, sol rasante y estrellas cuando se oscurece
 *   Jet          jet de negocios visto de lado (fuselaje cilíndrico, ala con winglet, motores traseros, cola en T, ventanas, luces y estela)
 *   Altimetro    altímetro de avión (agujas de 10.000 y 100.000 pies, ventanilla digital)
 *   Oximetro     pulsioxímetro con onda de pulso y SpO2 que cambia de color (ILUSTRACIÓN)
 *   Camara       cámara de gas de vidrio con moléculas de N₂ y O2 que rebotan
 *   Tunel        viñeta de visión en túnel (se cierra / se abre)
 *   Mascara      máscara de oxígeno con bolsa reservorio y tubo, que cae del techo y se mece
 * Color: cian = oxígeno · ámbar = luz cálida / precaución · rojo = alerta · verde = oxímetro sano · azul acero = nitrógeno y metal.
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeOut, lerp, mezclar, oscurecer, aclarar } from "../comun";
import { FONT, MONOF } from "./real-kit";

export const JK = {
  cian: "#3DE0FF",
  ambar: "#FFB547",
  rojo: "#FF4B4B",
  verde: "#3CFF8F",
  acero: "#8FA6C4",
  marino: "#0A1730",
  blanco: "#F5F8FC",
  hielo: "#BFE0FF",
  sinapsis: "#4C9DFF",
} as const;

/** rebote en una caja de lado L: convierte una posición libre en una que va y viene (movimiento de un gas) */
export const rebote = (p: number, L: number): number => {
  const m = ((p % (2 * L)) + 2 * L) % (2 * L);
  return m < L ? m : 2 * L - m;
};
export const sua = (v: number, a: number, b: number): number => {
  const k = clamp((v - a) / (b - a));
  return k * k * (3 - 2 * k);
};

/* ───────────── cielo ───────────── */

/** Cielo al atardecer. `oscuridad` 0–1 = cuánto se oscurece la parte alta (más altura); `sol` 0–1 = intensidad del sol rasante; `horizonte` = y de la línea de nubes. */
export const Cielo: React.FC<{ t: number; oscuridad?: number; sol?: number; horizonte?: number; nubes?: number; deriva?: number; children?: React.ReactNode }> = ({ t, oscuridad = 0.15, sol = 1, horizonte = 1020, nubes = 1, deriva = 1, children }) => {
  const uid = useUid();
  const hz = horizonte / H;
  const top = mezclar("#16316F", "#050A1E", oscuridad);
  const mid = mezclar("#3D5DA8", "#0B1B4A", oscuridad);
  const bajo = mezclar("#8C86BE", "#25306E", oscuridad * 0.8);
  const hor = mezclar("#F6B374", "#5A5E9F", oscuridad * 0.7);
  const filas = [0, 1, 2, 3, 4, 5];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: top }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`${uid}c`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={top} />
            <stop offset={hz * 0.45} stopColor={mid} />
            <stop offset={hz * 0.82} stopColor={bajo} />
            <stop offset={hz} stopColor={hor} />
            <stop offset={Math.min(1, hz + 0.02)} stopColor={mezclar("#E7A98F", "#3F4584", oscuridad * 0.7)} />
            <stop offset="1" stopColor={mezclar("#2C3170", "#101440", oscuridad)} />
          </linearGradient>
          <linearGradient id={`${uid}x`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#050A1A" stopOpacity="0" /><stop offset="1" stopColor="#050A1A" stopOpacity="0.72" /></linearGradient>
          <radialGradient id={`${uid}s`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFF1CF" stopOpacity="0.95" /><stop offset="0.18" stopColor="#FFC27A" stopOpacity="0.6" /><stop offset="1" stopColor="#FF8F5A" stopOpacity="0" /></radialGradient>
          <radialGradient id={`${uid}n`} cx="50%" cy="22%" r="75%"><stop offset="0" stopColor="#FFF3DC" /><stop offset="0.45" stopColor={mezclar("#E4C6D6", "#6C73B8", oscuridad * 0.6)} /><stop offset="1" stopColor={mezclar("#6A6AA6", "#232A64", oscuridad * 0.7)} /></radialGradient>
          <filter id={`${uid}b`} x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="9" /></filter>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}c)`} />
        {oscuridad > 0.3 && Array.from({ length: 70 }, (_, i) => <circle key={i} cx={azar(i * 2.1) * W} cy={azar(i * 5.3 + 1) * horizonte * 0.8} r={0.7 + azar(i * 8.1) * 1.4} fill="#fff" opacity={(oscuridad - 0.3) * (0.3 + 0.7 * azar(i * 3.3)) * (0.7 + 0.3 * Math.sin(t * 2 + i))} />)}
        {/* sol rasante */}
        <ellipse cx={800} cy={horizonte - 30} rx={560} ry={420} fill={`url(#${uid}s)`} opacity={sol * 0.9} />
        <ellipse cx={800} cy={horizonte - 6} rx={460} ry={9} fill="#FFF3D6" opacity={0.5 * sol} />
        {/* cirros */}
        {[0, 1, 2, 3].map((i) => <ellipse key={i} cx={((azar(i * 4.4) * W + t * (3 + i) * deriva * -1) % (W + 600) + W + 600) % (W + 600) - 300} cy={horizonte - 150 - i * 120} rx={300 + i * 40} ry={6 + i * 2} fill="#FFE6C8" opacity={0.1 + 0.03 * i} />)}
        {/* mar de nubes en paralaje: filas lejanas pequeñas y lentas, cercanas grandes y rápidas */}
        {nubes > 0 && filas.map((r) => {
          const prof = r / (filas.length - 1);
          const esc = lerp(0.5, 2.1, prof);
          const y = horizonte + 6 + Math.pow(prof, 1.35) * 560;
          const n = Math.round(lerp(12, 5, prof));
          const vel = lerp(10, 90, prof) * deriva;
          return (
            <g key={r} opacity={nubes} filter={r < 2 ? `url(#${uid}b)` : undefined}>
              {Array.from({ length: n }, (_, i) => {
                const paso = (W + 700) / n;
                const x = ((((i + azar(r * 9.1 + i) * 0.6) * paso - t * vel) % (W + 700)) + W + 700) % (W + 700) - 350;
                const s = esc * (0.8 + azar(r * 3.7 + i * 1.3) * 0.7);
                return (
                  <g key={i} transform={`translate(${x} ${y + azar(r * 6.1 + i) * 26 * esc}) scale(${s})`}>
                    <ellipse cx={0} cy={0} rx={150} ry={42} fill={`url(#${uid}n)`} />
                    <ellipse cx={-85} cy={12} rx={100} ry={32} fill={`url(#${uid}n)`} />
                    <ellipse cx={95} cy={14} rx={108} ry={34} fill={`url(#${uid}n)`} />
                    <ellipse cx={12} cy={-24} rx={86} ry={34} fill={`url(#${uid}n)`} />
                  </g>
                );
              })}
            </g>
          );
        })}
        <rect x={0} y={1080} width={W} height={H - 1080} fill={`url(#${uid}x)`} />
      </svg>
      {children}
    </div>
  );
};

/* ───────────── jet ───────────── */

/**
 * Jet de negocios visto de lado, mirando a la derecha. Origen = centro del fuselaje (longitud ≈ 640 px a escala 1).
 * `t` = segundos (parpadeo de luces), `estela` = longitud de la estela de condensación (px), `empuje` 0–1 = brillo del escape, `luz` 0–1 = luz cálida del atardecer en la nariz.
 */
export const Jet: React.FC<{ x: number; y: number; s?: number; rot?: number; t?: number; estela?: number; empuje?: number; luz?: number; opacidad?: number }> = ({ x, y, s = 1, rot = 0, t = 0, estela = 0, empuje = 0.7, luz = 1, opacidad = 1 }) => {
  const uid = useUid();
  const fus = "M -312,-6 C -262,-26 -200,-44 -110,-47 L 130,-47 C 205,-46 262,-30 330,2 C 336,6 333,12 322,15 C 262,34 196,45 126,47 L -110,47 C -200,45 -262,26 -312,8 Z";
  const baliza = Math.max(0, Math.sin((t / 1.15) * Math.PI * 2)) ** 6;
  const estrobo = (t % 1.7) < 0.09 ? 1 : 0;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={opacidad}>
      <defs>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" /><stop offset="0.3" stopColor="#E3EBF5" /><stop offset="0.68" stopColor="#A5B5CB" /><stop offset="1" stopColor="#56677F" />
        </linearGradient>
        <linearGradient id={`${uid}w`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E9F0F8" /><stop offset="1" stopColor="#6C7D95" /></linearGradient>
        <linearGradient id={`${uid}t`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8DA0B8" /><stop offset="0.6" stopColor="#F3F7FB" /><stop offset="1" stopColor="#B5C4D6" /></linearGradient>
        <linearGradient id={`${uid}m`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F5F8FC" /><stop offset="0.5" stopColor="#9DADC2" /><stop offset="1" stopColor="#4C5B72" /></linearGradient>
        <linearGradient id={`${uid}l`} x1="1" y1="0" x2="0" y2="0"><stop offset="0" stopColor="#FFB45E" stopOpacity={0.75 * luz} /><stop offset="0.35" stopColor="#FF9A5A" stopOpacity={0.25 * luz} /><stop offset="0.7" stopColor="#FF9A5A" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${uid}e`} gradientUnits="userSpaceOnUse" x1={-262} y1={0} x2={-262 - Math.max(40, estela)} y2={0}><stop offset="0" stopColor="#fff" stopOpacity="0.85" /><stop offset="0.5" stopColor="#F6EFF8" stopOpacity="0.4" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <radialGradient id={`${uid}g`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#fff" stopOpacity="0.95" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <clipPath id={`${uid}k`}><path d={fus} /></clipPath>
        <filter id={`${uid}b`} x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="7" /></filter>
      </defs>
      {/* estela de condensación de los dos motores */}
      {estela > 8 && (
        <g>
          <path d={`M -262 6 L ${-262 - estela} ${-6 - estela * 0.012} L ${-262 - estela} ${24 + estela * 0.02} L -262 18 Z`} fill={`url(#${uid}e)`} filter={`url(#${uid}b)`} />
          <path d={`M -262 9 L ${-262 - estela} ${-3} L ${-262 - estela} ${10} L -262 14 Z`} fill={`url(#${uid}e)`} opacity={0.9} />
        </g>
      )}
      {/* ala lejana (detrás del fuselaje) */}
      <polygon points="70,26 -20,26 -120,80 -88,82" fill="#7C8CA3" opacity={0.85} />
      {/* cola en T */}
      <polygon points="-222,-42 -320,-172 -278,-172 -158,-47" fill={`url(#${uid}t)`} stroke="#6C7D95" strokeWidth={1.2} />
      <polygon points="-300,-150 -278,-172 -262,-172 -282,-134" fill="#1F4E9C" opacity={0.9} />
      <path d="M -344,-180 L -236,-180 L -246,-168 L -334,-168 Z" fill={`url(#${uid}m)`} stroke="#6C7D95" strokeWidth={1.2} />
      {/* fuselaje */}
      <path d={fus} fill={`url(#${uid}f)`} />
      <g clipPath={`url(#${uid}k)`}>
        <rect x={-320} y={-60} width={660} height={120} fill={`url(#${uid}l)`} />
        {/* franja de color */}
        <path d="M 330,12 L -320,2 L -320,12 L 330,24 Z" fill="#1F4E9C" />
        <path d="M 330,26 L -320,14 L -320,17 L 330,29 Z" fill="#3DE0FF" opacity={0.9} />
        {/* brillo especular superior */}
        <path d="M -150,-44 L 150,-44" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.65} />
        <path d="M -230,-30 L -150,-40" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.4} />
        {/* ventanillas con luz cálida */}
        {Array.from({ length: 8 }, (_, i) => <rect key={i} x={-90 + i * 36} y={-26} width={19} height={14} rx={7} fill="#FFE2A6" stroke="#2D3A4F" strokeWidth={2} />)}
        {/* parabrisas */}
        <path d="M 262,-26 C 286,-20 302,-12 312,-4 L 266,-6 Z" fill="#0E1A2C" stroke="#2D3A4F" strokeWidth={1.5} />
        <path d="M 268,-22 L 292,-14" stroke="#8FD0FF" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
        {/* línea de la puerta */}
        <rect x={150} y={-40} width={52} height={70} rx={8} fill="none" stroke="#7B8CA3" strokeWidth={1.6} opacity={0.7} />
      </g>
      <path d={fus} fill="none" stroke="#51627A" strokeWidth={1.6} />
      <path d="M 322,15 C 262,34 196,45 126,47 L -110,47" fill="none" stroke="#fff" strokeWidth={1.4} opacity={0.35} />
      {/* motor trasero (cercano) con pilón */}
      <polygon points="-196,-26 -128,-28 -118,-4 -204,0" fill="#8697AE" />
      <path d="M -262 -16 C -262 -26 -246 -32 -214 -32 L -120 -32 C -108 -32 -102 -22 -102 -8 C -102 8 -108 22 -120 22 L -214 22 C -246 22 -262 14 -262 4 Z" fill={`url(#${uid}m)`} stroke="#53637A" strokeWidth={1.4} />
      <ellipse cx={-105} cy={-5} rx={9} ry={25} fill="#0A1018" />
      <ellipse cx={-107} cy={-5} rx={5} ry={18} fill="#30425A" />
      <ellipse cx={-263} cy={-6} rx={12} ry={17} fill="#1A2330" />
      {empuje > 0 && <ellipse cx={-272} cy={-6} rx={34 * empuje} ry={13} fill="#FFB36A" opacity={0.55 * empuje} filter={`url(#${uid}b)`} />}
      {/* ala cercana con winglet */}
      <polygon points="96,26 -34,26 -176,96 -132,100" fill={`url(#${uid}w)`} stroke="#51627A" strokeWidth={1.4} />
      <polygon points="-176,96 -190,44 -172,46 -150,96" fill="#DCE5F0" stroke="#51627A" strokeWidth={1.2} />
      <path d="M 90,28 L -30,28" stroke="#fff" strokeWidth={2.5} opacity={0.55} strokeLinecap="round" />
      {/* luces de navegación y baliza */}
      <g>
        <circle cx={-180} cy={96} r={5} fill="#FF4B4B" />
        <circle cx={-180} cy={96} r={26} fill={`url(#${uid}g)`} style={{ mixBlendMode: "screen" }} opacity={0.5} />
        <circle cx={-300} cy={-176} r={5} fill="#FF5A5A" opacity={0.3 + 0.7 * baliza} />
        <circle cx={-300} cy={-176} r={34} fill="#FF5A5A" opacity={0.55 * baliza} filter={`url(#${uid}b)`} />
        {estrobo > 0 && <circle cx={-314} cy={1} r={34} fill={`url(#${uid}g)`} />}
      </g>
    </g>
  );
};

/* ───────────── altímetro ───────────── */

/** Altímetro de avión: números 0–9 (miles de pies), aguja larga = 10.000 pies por vuelta, aguja corta = 100.000, ventanilla digital. */
export const Altimetro: React.FC<{ x: number; y: number; r: number; ft: number; resalte?: string; unidad?: string }> = ({ x, y, r, ft, resalte = JK.ambar, unidad = "FT" }) => {
  const uid = useUid();
  const pol = (g: number, rr: number): [number, number] => [Math.cos(((g - 90) * Math.PI) / 180) * rr, Math.sin(((g - 90) * Math.PI) / 180) * rr];
  const largo = ((ft % 10000) / 10000) * 360;
  const corto = (ft / 100000) * 360;
  const txt = Math.round(ft).toLocaleString("en-US").replace(/,/g, " ");
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id={`${uid}m`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E9EEF4" /><stop offset="0.4" stopColor="#7C8A9A" /><stop offset="0.75" stopColor="#CBD3DC" /><stop offset="1" stopColor="#3E4854" /></linearGradient>
        <radialGradient id={`${uid}f`} cx="45%" cy="38%" r="75%"><stop offset="0" stopColor="#1B2430" /><stop offset="1" stopColor="#06090E" /></radialGradient>
      </defs>
      <ellipse cx={0} cy={r + 24} rx={r * 0.92} ry={r * 0.08} fill="#000" opacity={0.45} />
      <circle r={r} fill={`url(#${uid}m)`} />
      <circle r={r * 0.94} fill="#0B0F14" />
      <circle r={r * 0.9} fill={`url(#${uid}f)`} />
      {Array.from({ length: 50 }, (_, i) => { const [x1, y1] = pol(i * 7.2, r * 0.86), [x2, y2] = pol(i * 7.2, r * (i % 5 === 0 ? 0.74 : 0.8)); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F2F5F8" strokeWidth={i % 5 === 0 ? r * 0.026 : r * 0.012} />; })}
      {Array.from({ length: 10 }, (_, i) => { const [nx, ny] = pol(i * 36, r * 0.6); return <text key={i} x={nx} y={ny + r * 0.075} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={r * 0.21} fill="#F2F5F8">{i}</text>; })}
      {/* ventanilla digital */}
      <rect x={-r * 0.46} y={r * 0.2} width={r * 0.92} height={r * 0.26} rx={6} fill="#020406" stroke="#3A4654" strokeWidth={2} />
      <text x={0} y={r * 0.405} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={r * 0.2} fill={resalte}>{txt}</text>
      <text x={0} y={-r * 0.3} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={r * 0.09} fill="#AEBBCB" letterSpacing="0.14em">ALT · {unidad}</text>
      {/* aguja corta (100.000) */}
      <g transform={`rotate(${corto})`}><polygon points={`0,${-r * 0.42} ${r * 0.045},0 ${-r * 0.045},0`} fill="#EDF1F5" /></g>
      {/* aguja larga (10.000) */}
      <g transform={`rotate(${largo})`}>
        <polygon points={`0,${-r * 0.8} ${r * 0.032},${r * 0.1} ${-r * 0.032},${r * 0.1}`} fill="#fff" stroke="#000" strokeOpacity={0.4} strokeWidth={1.2} />
        <polygon points={`0,${-r * 0.8} ${r * 0.032},${-r * 0.55} ${-r * 0.032},${-r * 0.55}`} fill={resalte} />
      </g>
      <circle r={r * 0.07} fill="#2B343E" stroke="#AEBBCB" strokeWidth={2} />
      <path d={`M ${-r * 0.78} ${-r * 0.22} A ${r * 0.82} ${r * 0.82} 0 0 1 ${-r * 0.12} ${-r * 0.8}`} fill="none" stroke="#fff" strokeOpacity={0.28} strokeWidth={r * 0.05} strokeLinecap="round" />
    </g>
  );
};

/* ───────────── pulsioxímetro ───────────── */

/** onda de pulso (pletismografía): sube rápido, baja con una muesca dicrótica; `fase` en vueltas */
const pleth = (fase: number): number => {
  const u = ((fase % 1) + 1) % 1;
  return Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, u / 0.55))), 1.7) * (u < 0.55 ? 1 : 0) + 0.22 * Math.pow(Math.max(0, Math.sin(Math.PI * clamp((u - 0.55) / 0.3))), 2);
};

/** Color de la lectura de SpO2: verde sano, ámbar bajo, rojo peligroso. */
export const colorSpO2 = (v: number): string => (v >= 94 ? JK.verde : v >= 88 ? JK.ambar : JK.rojo);

/** Pulsioxímetro (ILUSTRACIÓN, no es un registro real): pantalla con SpO2, pulso y onda desplazándose. */
export const Oximetro: React.FC<{ x: number; y: number; w?: number; spo2: number; bpm?: number; t: number; opacidad?: number }> = ({ x, y, w = 360, spo2, bpm = 76, t, opacidad = 1 }) => {
  const uid = useUid();
  const h = w * 0.64;
  const col = colorSpO2(spo2);
  const pw = w * 0.86, ph = h * 0.3, px0 = -pw / 2, py0 = h * 0.08;
  const n = 90;
  const frec = bpm / 60;
  const pts = Array.from({ length: n }, (_, i) => {
    const u = i / (n - 1);
    const fase = u * 2.2 * 1 - t * frec;
    return `${(px0 + u * pw).toFixed(1)},${(py0 + ph - pleth(fase) * ph * (0.9 - 0.25 * clamp((97 - spo2) / 30))).toFixed(1)}`;
  }).join(" ");
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacidad}>
      <defs>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3B4656" /><stop offset="1" stopColor="#12171F" /></linearGradient>
        <filter id={`${uid}b`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      <ellipse cx={0} cy={h / 2 + 24} rx={w * 0.46} ry={14} fill="#000" opacity={0.45} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={34} fill={`url(#${uid}c)`} stroke="#6C7A8C" strokeWidth={2.5} />
      <rect x={-w / 2 + 14} y={-h / 2 + 14} width={w - 28} height={h - 28} rx={22} fill="#04070B" />
      <rect x={-w / 2 + 14} y={-h / 2 + 14} width={w - 28} height={h - 28} rx={22} fill={col} opacity={0.06} />
      <g transform={`translate(0 ${-h / 2 + 30})`}>
        <text x={-w / 2 + 40} y={30} fontFamily={FONT} fontWeight={800} fontSize={w * 0.07} fill="#9FB2C8">SpO<tspan fontSize={w * 0.048} dy={w * 0.012}>2</tspan></text>
        <text x={w / 2 - 40} y={30} textAnchor="end" fontFamily={MONOF} fontWeight={700} fontSize={w * 0.065} fill="#9FB2C8">♥ {Math.round(bpm)}</text>
        <text x={0} y={h * 0.5} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={w * 0.27} fill={col} filter={`url(#${uid}b)`} opacity={0.6}>{Math.round(spo2)}</text>
        <text x={0} y={h * 0.5} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={w * 0.27} fill={col}>{Math.round(spo2)}<tspan fontSize={w * 0.1}>%</tspan></text>
        <g transform={`translate(0 ${h * 0.5 + 16})`}><polyline points={pts} fill="none" stroke={col} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" /></g>
      </g>
      <text x={0} y={h / 2 + 52} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={22} fill="#D6E6F7" opacity={0.85} letterSpacing="0.1em">ILUSTRACIÓN</text>
    </g>
  );
};

/* ───────────── cámara de gas ───────────── */

/**
 * Cámara de vidrio con moléculas diatómicas que rebotan: cian = O2 (≈ 21 %), azul acero = N₂.
 * `n` = moléculas visibles (puede ser decimal: la última se desvanece, así la presión baja de forma continua); `total` = las que existen a nivel del mar.
 */
export const Camara: React.FC<{ x: number; y: number; w: number; h: number; n: number; total?: number; t: number; semilla?: number; titulo?: string; color?: string; opacidad?: number }> = ({ x, y, w, h, n, total = 44, t, semilla = 1, titulo, color = JK.hielo, opacidad = 1 }) => {
  const uid = useUid();
  const m = 26;
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacidad}>
      <defs>
        <linearGradient id={`${uid}v`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#CFE8FF" stopOpacity="0.2" /><stop offset="0.5" stopColor="#6FA8E0" stopOpacity="0.05" /><stop offset="1" stopColor="#CFE8FF" stopOpacity="0.14" /></linearGradient>
        <radialGradient id={`${uid}o`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={JK.cian} stopOpacity="0.9" /><stop offset="1" stopColor={JK.cian} stopOpacity="0" /></radialGradient>
      </defs>
      <rect x={0} y={0} width={w} height={h} rx={26} fill="#04101F" opacity={0.75} />
      <rect x={0} y={0} width={w} height={h} rx={26} fill={`url(#${uid}v)`} />
      {Array.from({ length: total }, (_, i) => {
        const vis = clamp(n - i);
        if (vis <= 0.01) return null;
        const o2 = i % 5 === 2;
        const vx = (70 + azar(i * 2.9 + semilla) * 110) * (azar(i * 4.1 + semilla) < 0.5 ? -1 : 1);
        const vy = (70 + azar(i * 6.1 + semilla) * 110) * (azar(i * 9.7 + semilla) < 0.5 ? -1 : 1);
        const cx = m + rebote(azar(i * 3.1 + semilla) * (w - 2 * m) + vx * t, w - 2 * m);
        const cy = m + rebote(azar(i * 5.3 + semilla + 2) * (h - 2 * m) + vy * t, h - 2 * m);
        const ang = (t * (80 + azar(i) * 160) + azar(i * 1.7) * 360) % 360;
        const rr = 7.5;
        return (
          <g key={i} transform={`translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${ang.toFixed(0)})`} opacity={vis}>
            {o2 && <circle r={26} fill={`url(#${uid}o)`} opacity={0.7} />}
            <circle cx={-rr} r={rr} fill={o2 ? JK.cian : JK.acero} stroke={o2 ? "#D8FAFF" : "#DCE8F7"} strokeWidth={1.2} />
            <circle cx={rr} r={rr} fill={o2 ? JK.cian : JK.acero} stroke={o2 ? "#D8FAFF" : "#DCE8F7"} strokeWidth={1.2} />
          </g>
        );
      })}
      <rect x={0} y={0} width={w} height={h} rx={26} fill="none" stroke={color} strokeWidth={3.5} opacity={0.9} />
      <path d={`M 20 ${h * 0.5} L 20 24 Q 20 20 26 20 L ${w * 0.55} 20`} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={4} strokeLinecap="round" />
      {titulo && <text x={w / 2} y={-18} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={26} letterSpacing="0.06em" fill={color}>{titulo}</text>}
    </g>
  );
};

/* ───────────── visión en túnel ───────────── */

/** Viñeta de visión en túnel: negro fuera de un círculo de `radio` px centrado en (cx, cy); `suavidad` = ancho del borde difuso. */
export const Tunel: React.FC<{ radio: number; cx?: number; cy?: number; suavidad?: number; opacidad?: number }> = ({ radio, cx = W / 2, cy = H / 2, suavidad = 160, opacidad = 1 }) => {
  const uid = useUid();
  const R = radio + suavidad;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: opacidad }}>
      <defs>
        <radialGradient id={`${uid}t`} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={R}>
          <stop offset={Math.max(0, radio / R - 0.02)} stopColor="#000" stopOpacity="0" />
          <stop offset={Math.min(0.98, radio / R + 0.2)} stopColor="#000" stopOpacity="0.82" />
          <stop offset="1" stopColor="#000" stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}t)`} />
    </svg>
  );
};

/* ───────────── máscara de oxígeno ───────────── */

/** Máscara de oxígeno colgando de su tubo: cuelga desde (x, y) (punto de anclaje en el techo), se mece con `giro` grados y la bolsa reservorio se infla con `bolsa` 0–1. */
export const Mascara: React.FC<{ x: number; y: number; largo: number; giro?: number; bolsa?: number; s?: number }> = ({ x, y, largo, giro = 0, bolsa = 0, s = 1 }) => {
  const uid = useUid();
  const L = Math.max(10, largo);
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro})`}>
      <defs>
        <radialGradient id={`${uid}b`} cx="40%" cy="30%" r="80%"><stop offset="0" stopColor="#D9FFE6" stopOpacity="0.95" /><stop offset="0.6" stopColor="#7EE3A6" stopOpacity="0.72" /><stop offset="1" stopColor="#2AA467" stopOpacity="0.8" /></radialGradient>
        <linearGradient id={`${uid}m`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F6FFFB" /><stop offset="0.55" stopColor="#BFE3D2" /><stop offset="1" stopColor="#6FA98D" /></linearGradient>
        <linearGradient id={`${uid}t`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#E7F3EE" /><stop offset="0.5" stopColor="#FFFFFF" /><stop offset="1" stopColor="#9DB8AB" /></linearGradient>
      </defs>
      {/* tubo corrugado */}
      <line x1={0} y1={0} x2={0} y2={L} stroke="#000" strokeOpacity={0.3} strokeWidth={22} strokeLinecap="round" transform="translate(5 3)" />
      <line x1={0} y1={0} x2={0} y2={L} stroke={`url(#${uid}t)`} strokeWidth={20} strokeLinecap="round" />
      <line x1={0} y1={0} x2={0} y2={L} stroke="#7A9488" strokeWidth={20} strokeDasharray="2 10" strokeLinecap="butt" opacity={0.55} />
      <g transform={`translate(0 ${L}) scale(${s})`}>
        {/* bolsa reservorio (cuelga del puerto inferior de la máscara) */}
        <g transform={`translate(0 76) scale(${0.45 + 0.55 * bolsa} ${0.2 + 0.8 * bolsa})`} opacity={clamp(bolsa * 3)}>
          <path d="M -30 0 C -116 60 -108 196 0 218 C 108 196 116 60 30 0 Z" fill={`url(#${uid}b)`} stroke="#E8FFF1" strokeOpacity={0.7} strokeWidth={3} />
          <path d="M -70 50 C -86 100 -76 150 -40 178" fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={7} strokeLinecap="round" />
        </g>
        {/* cuerpo de la máscara */}
        <path d="M -70 -6 C -70 -52 -34 -78 0 -78 C 34 -78 70 -52 70 -6 C 70 36 40 70 0 90 C -40 70 -70 36 -70 -6 Z" fill={`url(#${uid}m)`} stroke="#4C7F68" strokeWidth={4} />
        <path d="M -52 -8 C -52 -40 -28 -60 0 -60 C 28 -60 52 -40 52 -8 C 52 26 30 54 0 72 C -30 54 -52 26 -52 -8 Z" fill="#1E3A2F" opacity={0.25} />
        <circle cx={0} cy={42} r={19} fill="#0F1F18" stroke="#DDEFE6" strokeWidth={4} />
        <circle cx={0} cy={42} r={8} fill="#CFEFDD" opacity={0.45} />
        <path d="M -48 -46 C -26 -64 14 -66 36 -52" fill="none" stroke="#fff" strokeOpacity={0.85} strokeWidth={5} strokeLinecap="round" />
        {/* elástico */}
        <path d="M -70 -10 C -120 -30 -120 -90 -70 -118" fill="none" stroke="#2C3B35" strokeWidth={7} strokeLinecap="round" />
        <path d="M 70 -10 C 120 -30 120 -90 70 -118" fill="none" stroke="#2C3B35" strokeWidth={7} strokeLinecap="round" />
      </g>
    </g>
  );
};

/** panel del techo de cabina con la compuerta abierta (de donde cae la máscara) */
export const PanelTecho: React.FC<{ x: number; y: number; w: number; abre: number }> = ({ x, y, w, abre }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs><linearGradient id={`${uid}p`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#EDE6D8" /><stop offset="1" stopColor="#B5AB97" /></linearGradient></defs>
      <rect x={-w / 2} y={-34} width={w} height={34} rx={8} fill={`url(#${uid}p)`} stroke="#8A8068" strokeWidth={2} />
      <rect x={-w * 0.2} y={-30} width={w * 0.4} height={26} rx={4} fill="#1A1F26" />
      <g transform={`rotate(${-78 * easeOut(abre)} ${-w * 0.2} -4)`}><rect x={-w * 0.2} y={-6} width={w * 0.14} height={5} rx={2} fill="#D8D0BD" stroke="#8A8068" strokeWidth={1.5} /></g>
      <circle cx={-w * 0.38} cy={-17} r={4} fill="#FFE9B0" /><circle cx={w * 0.38} cy={-17} r={4} fill="#FFE9B0" />
    </g>
  );
};

/** Bloque de lectura en HTML (rótulo mono pequeño + cifra grande + línea de apoyo). */
export const Lectura: React.FC<{ x: number; y: number; ancho?: number; titulo?: string; valor: string; sub?: string; color?: string; opacidad?: number; alinear?: "left" | "center" | "right"; px?: number; id?: string; colorTitulo?: string }> = ({ x, y, ancho = 420, titulo, valor, sub, color = JK.blanco, opacidad = 1, alinear = "left", px = 64, id = "lectura", colorTitulo = JK.hielo }) => (
  <div data-texto={id} style={{ position: "absolute", left: alinear === "left" ? x : alinear === "center" ? x - ancho / 2 : x - ancho, top: y, width: ancho, textAlign: alinear, opacity: opacidad, textShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>
    {titulo && <div style={{ fontFamily: MONOF, fontWeight: 700, fontSize: 26, letterSpacing: "0.08em", color: colorTitulo }}>{titulo}</div>}
    <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: px, lineHeight: 1.05, letterSpacing: "-0.02em", color }}>{valor}</div>
    {sub && <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 28, lineHeight: 1.2, color: JK.hielo, opacity: 0.92 }}>{sub}</div>}
  </div>
);

export { aclarar, clamp, easeOut, lerp, mezclar, oscurecer };
