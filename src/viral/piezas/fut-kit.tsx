/**
 * Kit del video sobre el paro cardíaco de un futbolista (SINAPSIS · medicina y actualidad): estética sobria de monitor clínico, todo en vectores y determinista.
 *   Sala         fondo oscuro con papel milimetrado de ECG y viñeta; puede teñirse de alerta
 *   Ecg          trazo de electrocardiograma que se desplaza (normal, fibrilación o plano)
 *   Corazon      corazón anatómico (ventrículos, aurículas, aorta, arteria pulmonar, cava y coronarias) que late, tiembla o se detiene
 *   Torso        corte transversal del tórax con el corazón y un impacto
 *   Dea          desfibrilador externo automático con pantalla, luces, botón de descarga y cables
 *   Vela         vela encendida con llama que parpadea y resplandor
 *   Compresion   manos apilándose sobre el esternón a 110 por minuto
 *   Telefono     teléfono con el número de emergencias
 * Color: verde monitor = ritmo normal · rojo = alerta y fibrilación · ámbar = precaución · cian = datos · llama = homenaje.
 * Sin imágenes del lance, sin personas reales dibujadas: solo esquemas médicos.
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeOut, lerp, mezclar } from "../comun";
import { FONT, MONOF } from "./real-kit";
import { rebote, sua } from "./jet-kit";

export const FU = {
  fondo: "#04080F",
  panel: "#0A1522",
  verde: "#3CFF8F",
  cian: "#3DE0FF",
  rojo: "#FF4B4B",
  ambar: "#FFB547",
  hielo: "#BFE0FF",
  blanco: "#F5F8FC",
  llama: "#FFC46B",
} as const;
export { rebote, sua, clamp, lerp, mezclar, easeOut };

/* ───────────── sala ───────────── */

/** Fondo de monitor clínico. `alerta` 0–1 tiñe los bordes de rojo; `latido` 0–1 hace respirar el resplandor central. */
export const Sala: React.FC<{ t: number; alerta?: number; latido?: number; children?: React.ReactNode }> = ({ t, alerta = 0, latido = 0, children }) => {
  const uid = useUid();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: FU.fondo }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id={`${uid}g`} cx="50%" cy="42%" r="70%"><stop offset="0" stopColor="#0E2236" /><stop offset="0.6" stopColor="#07121E" /><stop offset="1" stopColor="#03060B" /></radialGradient>
          <pattern id={`${uid}p`} width="25" height="25" patternUnits="userSpaceOnUse"><path d="M 25 0 L 0 0 0 25" fill="none" stroke={FU.verde} strokeOpacity="0.05" strokeWidth="1" /></pattern>
          <pattern id={`${uid}P`} width="125" height="125" patternUnits="userSpaceOnUse"><path d="M 125 0 L 0 0 0 125" fill="none" stroke={FU.verde} strokeOpacity="0.1" strokeWidth="1.6" /></pattern>
          <radialGradient id={`${uid}a`} cx="50%" cy="46%" r="78%"><stop offset="0.5" stopColor={FU.rojo} stopOpacity="0" /><stop offset="1" stopColor={FU.rojo} stopOpacity="0.85" /></radialGradient>
          <radialGradient id={`${uid}v`} cx="50%" cy="46%" r="78%"><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.6" /></radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}g)`} />
        <rect width={W} height={H} fill={`url(#${uid}p)`} />
        <rect width={W} height={H} fill={`url(#${uid}P)`} />
        <ellipse cx={540} cy={900} rx={520} ry={420} fill={FU.cian} opacity={0.03 + 0.03 * latido} />
        {alerta > 0 && <rect width={W} height={H} fill={`url(#${uid}a)`} opacity={alerta * (0.35 + 0.25 * Math.sin(t * 6))} />}
        <rect width={W} height={H} fill={`url(#${uid}v)`} />
      </svg>
      {children}
    </div>
  );
};

/* ───────────── ECG ───────────── */

/** Trazo de ECG que se desplaza hacia la izquierda: `valor(tt)` da la amplitud (−1…1) en el instante absoluto `tt`; `span` = segundos visibles. */
export const Ecg: React.FC<{ x: number; y: number; w: number; h: number; t: number; valor: (tt: number) => number; span?: number; color?: string; grosor?: number; n?: number; cabeza?: boolean; opacidad?: number }> = ({ x, y, w, h, t, valor, span = 3.2, color = FU.verde, grosor = 5, n = 260, cabeza = true, opacidad = 1 }) => {
  const uid = useUid();
  const pts: string[] = [];
  let ult: [number, number] = [x, y];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const v = valor(t - (1 - u) * span);
    const px = x + u * w, py = y - v * h * 0.5;
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    ult = [px, py];
  }
  const d = pts.join(" ");
  return (
    <g opacity={opacidad}>
      <defs><filter id={`${uid}b`} x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="5" /></filter></defs>
      <polyline points={d} fill="none" stroke={color} strokeWidth={grosor + 8} strokeLinejoin="round" strokeLinecap="round" opacity={0.35} filter={`url(#${uid}b)`} />
      <polyline points={d} fill="none" stroke={color} strokeWidth={grosor} strokeLinejoin="round" strokeLinecap="round" />
      {cabeza && <circle cx={ult[0]} cy={ult[1]} r={grosor * 1.8} fill="#fff" stroke={color} strokeWidth={3} />}
    </g>
  );
};

/* ───────────── corazón ───────────── */

/** Corazón anatómico. `latido` 0–1 = contracción actual; `fv` 0–1 = cuánto tiembla (fibrilación); `gris` 0–1 = desaturación (parado). Origen = centro de los ventrículos; ancho ≈ 330 a escala 1. */
export const Corazon: React.FC<{ x: number; y: number; s?: number; t: number; latido?: number; fv?: number; gris?: number; opacidad?: number }> = ({ x, y, s = 1, t, latido = 0, fv = 0, gris = 0, opacidad = 1 }) => {
  const uid = useUid();
  const c = (hex: string): string => mezclar(hex, "#5A6070", gris);
  const parte = (i: number): string => {
    const dx = fv * 9 * Math.sin(t * (29 + i * 6.3) + i * 2.1), dy = fv * 9 * Math.cos(t * (33 + i * 5.1) + i * 1.3);
    const rot = fv * 4 * Math.sin(t * (41 + i * 3.7) + i), esc = 1 + fv * 0.05 * Math.sin(t * (37 + i * 4.9) + i * 0.7);
    return `translate(${dx.toFixed(2)} ${dy.toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${esc.toFixed(3)})`;
  };
  const pulso = 1 + 0.07 * latido * (1 - fv);
  return (
    <g transform={`translate(${x} ${y}) scale(${s * pulso})`} opacity={opacidad}>
      <defs>
        <radialGradient id={`${uid}v`} cx="40%" cy="28%" r="80%"><stop offset="0" stopColor={c("#E9606A")} /><stop offset="0.55" stopColor={c("#B5303A")} /><stop offset="1" stopColor={c("#5A1520")} /></radialGradient>
        <radialGradient id={`${uid}a`} cx="40%" cy="30%" r="80%"><stop offset="0" stopColor={c("#C94A55")} /><stop offset="1" stopColor={c("#6B1B27")} /></radialGradient>
        <filter id={`${uid}g`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      <ellipse cx={0} cy={20} rx={190} ry={200} fill={fv > 0.3 ? FU.rojo : FU.cian} opacity={0.12 + 0.1 * latido} filter={`url(#${uid}g)`} />
      {/* vena cava y arteria pulmonar (azul) */}
      <g transform={parte(1)}>
        <path d="M -118 -110 C -130 -170 -122 -225 -108 -262" fill="none" stroke="#0F2347" strokeWidth={40} strokeLinecap="round" />
        <path d="M -118 -110 C -130 -170 -122 -225 -108 -262" fill="none" stroke={c("#4A6FB8")} strokeWidth={32} strokeLinecap="round" />
        <path d="M -122 -118 C -134 -170 -126 -224 -114 -258" fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={7} strokeLinecap="round" />
      </g>
      <g transform={parte(2)}>
        <path d="M -42 -100 C -62 -168 -24 -204 24 -192" fill="none" stroke="#0F2347" strokeWidth={46} strokeLinecap="round" />
        <path d="M -42 -100 C -62 -168 -24 -204 24 -192" fill="none" stroke={c("#5B82C9")} strokeWidth={38} strokeLinecap="round" />
        <path d="M -46 -108 C -64 -166 -28 -200 14 -190" fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={7} strokeLinecap="round" />
      </g>
      {/* aorta */}
      <g transform={parte(3)}>
        <path d="M 14 -104 C 4 -196 76 -236 124 -194 C 154 -166 146 -132 132 -108" fill="none" stroke="#3A0A12" strokeWidth={56} strokeLinecap="round" />
        <path d="M 14 -104 C 4 -196 76 -236 124 -194 C 154 -166 146 -132 132 -108" fill="none" stroke={c("#D2444F")} strokeWidth={46} strokeLinecap="round" />
        <path d="M 8 -112 C 0 -190 70 -228 118 -192" fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={8} strokeLinecap="round" />
      </g>
      {/* aurículas */}
      <g transform={parte(4)}><ellipse cx={-108} cy={-70} rx={58} ry={76} fill={`url(#${uid}a)`} stroke="#3A0A12" strokeWidth={4} /></g>
      <g transform={parte(5)}><ellipse cx={96} cy={-86} rx={46} ry={52} fill={`url(#${uid}a)`} stroke="#3A0A12" strokeWidth={4} /></g>
      {/* ventrículos */}
      <g transform={parte(0)}>
        <path d="M -122 -40 C -146 62 -62 172 44 196 C 126 174 156 60 134 -32 C 112 -94 22 -112 -42 -98 C -92 -92 -116 -72 -122 -40 Z" fill={`url(#${uid}v)`} stroke="#3A0A12" strokeWidth={6} strokeLinejoin="round" />
        <path d="M -20 -86 C 12 0 30 84 44 168" fill="none" stroke={c("#FF8A8A")} strokeWidth={7} strokeLinecap="round" opacity={0.9} />
        <path d="M 20 -80 C 70 -20 100 40 104 110" fill="none" stroke={c("#FF8A8A")} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
        <path d="M -60 -60 C -80 20 -50 100 -10 150" fill="none" stroke={c("#FF8A8A")} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
        <path d="M -90 -30 C -100 40 -66 110 -20 160" fill="none" stroke="#fff" strokeOpacity={0.22} strokeWidth={16} strokeLinecap="round" />
      </g>
    </g>
  );
};

/* ───────────── corte del tórax ───────────── */

/** Corte transversal del tórax (esquema): pulmones, costillas, esternón, columna y corazón; `impacto` 0–1 dibuja un golpe sobre el esternón. Origen = centro del corte; ancho ≈ 720. */
export const Torso: React.FC<{ x: number; y: number; s?: number; t: number; impacto?: number; impactoTipo?: "seguro" | "peligro"; latido?: number; fv?: number }> = ({ x, y, s = 1, t, impacto = 0, impactoTipo = "peligro", latido = 0, fv = 0 }) => {
  const uid = useUid();
  const col = impactoTipo === "peligro" ? FU.rojo : FU.ambar;
  const k = clamp(impacto);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}t`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#24364C" /><stop offset="1" stopColor="#0F1B2A" /></linearGradient>
        <radialGradient id={`${uid}l`} cx="50%" cy="40%" r="70%"><stop offset="0" stopColor="#3A6E99" /><stop offset="1" stopColor="#1C3A57" /></radialGradient>
      </defs>
      <ellipse cx={0} cy={0} rx={360} ry={225} fill={`url(#${uid}t)`} stroke="#3F5F82" strokeWidth={6} />
      <ellipse cx={-168} cy={14} rx={118} ry={150} fill={`url(#${uid}l)`} opacity={0.85} /><ellipse cx={168} cy={14} rx={118} ry={150} fill={`url(#${uid}l)`} opacity={0.85} />
      {[1, 2, 3].map((i) => <g key={i} fill="none" stroke="#C9D6E6" strokeWidth={9} strokeLinecap="round" opacity={0.7}><path d={`M -28 ${-186 + i * 6} C -${100 + i * 70} ${-176 + i * 12} -${290 - i * 12} ${-100 + i * 20} -${318 - i * 10} ${40 + i * 12}`} /><path d={`M 28 ${-186 + i * 6} C ${100 + i * 70} ${-176 + i * 12} ${290 - i * 12} ${-100 + i * 20} ${318 - i * 10} ${40 + i * 12}`} /></g>)}
      <rect x={-30} y={-204} width={60} height={26} rx={12} fill="#E4ECF6" stroke="#8FA6C4" strokeWidth={4} />
      <circle cx={0} cy={192} r={30} fill="#D5DEEA" stroke="#8FA6C4" strokeWidth={4} />
      <Corazon x={30} y={-20} s={0.3} t={t} latido={latido} fv={fv} />
      {k > 0.01 && (
        <g opacity={1 - clamp((k - 0.6) / 0.4)}>
          <g transform={`translate(0 ${-330 + 120 * Math.min(1, k * 1.6)})`}><polygon points="-40,-70 40,-70 40,0 70,0 0,70 -70,0 -40,0" fill={col} stroke="#fff" strokeWidth={4} strokeLinejoin="round" /></g>
          {k > 0.5 && <circle cx={0} cy={-190} r={30 + 120 * (k - 0.5)} fill="none" stroke={col} strokeWidth={10 * (1.2 - k)} />}
        </g>
      )}
    </g>
  );
};

/* ───────────── desfibrilador ───────────── */

/** DEA: `luz` 0–1 parpadea el indicador, `carga` 0–1 llena la barra de carga, `descarga` 0–1 = destello del botón; origen = centro. */
export const Dea: React.FC<{ x: number; y: number; s?: number; t: number; modo?: "apagado" | "analiza" | "carga" | "listo" | "normal"; carga?: number; destello?: number }> = ({ x, y, s = 1, t, modo = "apagado", carga = 0, destello = 0 }) => {
  const uid = useUid();
  const parp = 0.5 + 0.5 * Math.sin(t * 9);
  const col = modo === "normal" ? FU.verde : modo === "listo" ? FU.rojo : modo === "carga" ? FU.ambar : FU.cian;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFE066" /><stop offset="0.5" stopColor="#F2B705" /><stop offset="1" stopColor="#B88500" /></linearGradient>
        <filter id={`${uid}g`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9" /></filter>
      </defs>
      <ellipse cx={0} cy={236} rx={150} ry={16} fill="#000" opacity={0.5} />
      <rect x={-150} y={-210} width={300} height={440} rx={44} fill={`url(#${uid}c)`} stroke="#5A4300" strokeWidth={6} />
      <rect x={-140} y={-200} width={280} height={50} rx={26} fill="#fff" opacity={0.18} />
      <text x={0} y={-168} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill="#3A2A00" letterSpacing="0.12em">DEA</text>
      <rect x={-110} y={-130} width={220} height={130} rx={18} fill="#03070B" stroke="#3A2A00" strokeWidth={5} />
      <path d="M -70 -62 L -38 -62 L -26 -92 L -6 -36 L 8 -84 L 22 -62 L 70 -62" fill="none" stroke={col} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={modo === "apagado" ? 0.25 : 0.95} />
      <text x={0} y={-18} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={20} fill={col} opacity={modo === "apagado" ? 0.3 : 1}>{modo === "analiza" ? "ANALIZANDO…" : modo === "carga" ? "CARGANDO" : modo === "listo" ? "¡DESCARGA!" : modo === "normal" ? "RITMO OK" : "COLOCAR PARCHES"}</text>
      <rect x={-100} y={10} width={200} height={16} rx={8} fill="#1B1400" />
      <rect x={-100} y={10} width={Math.max(0, 200 * clamp(carga))} height={16} rx={8} fill={FU.ambar} />
      <circle cx={-90} cy={62} r={9} fill={modo === "analiza" ? FU.cian : "#33415C"} opacity={modo === "analiza" ? 0.4 + 0.6 * parp : 1} /><circle cx={-60} cy={62} r={9} fill={modo === "carga" ? FU.ambar : "#33415C"} opacity={modo === "carga" ? 0.4 + 0.6 * parp : 1} />
      {destello > 0 && <circle cx={0} cy={140} r={90} fill="#fff" opacity={0.7 * destello} filter={`url(#${uid}g)`} />}
      <circle cx={0} cy={140} r={62} fill={modo === "listo" ? FU.rojo : "#C2410C"} stroke="#3A2A00" strokeWidth={6} opacity={modo === "listo" ? 0.7 + 0.3 * parp : 0.9} />
      <polygon points="-6,98 -30,148 -6,148 -16,184 30,128 6,128 18,98" fill="#fff" stroke="#3A2A00" strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
};

/* ───────────── vela ───────────── */

/** Vela encendida con llama que parpadea y resplandor; origen = base de la vela. */
export const Vela: React.FC<{ x: number; y: number; s?: number; t: number; luz?: number }> = ({ x, y, s = 1, t, luz = 1 }) => {
  const uid = useUid();
  const f1 = Math.sin(t * 7.3) * 0.5 + Math.sin(t * 13.1) * 0.3, f2 = Math.sin(t * 9.7 + 1) * 0.4;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={clamp(luz * 1.4)}>
      <defs>
        <radialGradient id={`${uid}r`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={FU.llama} stopOpacity="0.55" /><stop offset="0.4" stopColor="#FF9A3C" stopOpacity="0.18" /><stop offset="1" stopColor="#FF9A3C" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#D8C9A8" /><stop offset="0.5" stopColor="#FFF4DA" /><stop offset="1" stopColor="#B7A882" /></linearGradient>
        <radialGradient id={`${uid}f`} cx="50%" cy="70%" r="60%"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.35" stopColor="#FFE9A0" /><stop offset="1" stopColor="#FF8A2A" /></radialGradient>
      </defs>
      <circle cx={0} cy={-190} r={420 + 20 * f1} fill={`url(#${uid}r)`} />
      <ellipse cx={0} cy={10} rx={90} ry={16} fill="#000" opacity={0.5} />
      <rect x={-52} y={-170} width={104} height={178} rx={10} fill={`url(#${uid}c)`} />
      <ellipse cx={0} cy={-170} rx={52} ry={12} fill="#FFF8E6" stroke="#CDBE98" strokeWidth={3} />
      <path d="M -6 -172 C -6 -182 6 -182 6 -194" fill="none" stroke="#2A1D10" strokeWidth={5} strokeLinecap="round" />
      <g transform={`translate(${f1 * 5} -194) skewX(${f2 * 6})`}>
        <path d={`M 0 ${-130 - 8 * f1} C 34 -86 40 -40 0 -10 C -40 -40 -34 -86 0 ${-130 - 8 * f1} Z`} fill={`url(#${uid}f)`} />
        <path d="M 0 -64 C 12 -46 14 -24 0 -8 C -14 -24 -12 -46 0 -64 Z" fill="#7AB8FF" opacity={0.75} />
      </g>
    </g>
  );
};

/* ───────────── compresiones y teléfono ───────────── */

/** Manos apiladas sobre el esternón que comprimen al ritmo `bpm`; `t` en s; `activo` 0–1. */
export const Compresion: React.FC<{ x: number; y: number; s?: number; t: number; bpm?: number; activo?: number }> = ({ x, y, s = 1, t, bpm = 110, activo = 1 }) => {
  const fase = ((t * bpm) / 60) % 1;
  const p = activo * Math.pow(Math.sin(Math.PI * fase), 2);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={70} rx={130} ry={16} fill="#000" opacity={0.4} />
      <rect x={-130} y={10} width={260} height={64} rx={28} fill="#24364C" stroke="#3F5F82" strokeWidth={5} />
      <rect x={-18} y={10 + 14 * p} width={36} height={52 - 14 * p} rx={10} fill="#E4ECF6" opacity={0.9} />
      <g transform={`translate(0 ${-14 + 22 * p})`}>
        <rect x={-62} y={-72} width={124} height={62} rx={26} fill="#F2C9A0" stroke="#8A5A3C" strokeWidth={5} />
        {[-36, -12, 12, 36].map((fx) => <line key={fx} x1={fx} y1={-66} x2={fx} y2={-46} stroke="#C99A72" strokeWidth={4} strokeLinecap="round" />)}
        <rect x={-48} y={-118} width={96} height={52} rx={24} fill="#EBBE92" stroke="#8A5A3C" strokeWidth={5} />
        <rect x={-30} y={-150} width={60} height={42} rx={18} fill="#F2C9A0" stroke="#8A5A3C" strokeWidth={5} />
      </g>
      <circle cx={0} cy={44} r={30 + 50 * (1 - p)} fill="none" stroke={FU.rojo} strokeWidth={5} opacity={0.5 * (1 - p) * activo} />
    </g>
  );
};

/** Teléfono con pantalla y número; origen = centro. */
export const Telefono: React.FC<{ x: number; y: number; s?: number; t: number; llamando?: number }> = ({ x, y, s = 1, t, llamando = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${llamando * Math.sin(t * 28) * 4})`}>
    <rect x={-66} y={-110} width={132} height={220} rx={26} fill="#1B2A3D" stroke="#8FA6C4" strokeWidth={5} />
    <rect x={-54} y={-92} width={108} height={170} rx={12} fill="#03070B" />
    <text x={0} y={-40} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={24} fill={FU.verde}>SOS</text>
    <circle cx={0} cy={20} r={34} fill={FU.verde} />
    <path d="M -16 -8 C -22 10 -4 32 16 38 L 22 28 L 10 18 C 4 22 -4 14 -6 8 L 4 -2 L -6 -14 Z" fill="#04210F" />
    <circle cx={0} cy={94} r={8} fill="#33415C" />
  </g>
);

export { FONT, MONOF, azar };
