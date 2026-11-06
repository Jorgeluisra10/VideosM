/**
 * Kit de «Los 3 códigos escondidos en tu vehículo» (IMNOBA · figuras realistas · carril B). Objetos dibujados como renders (degradados de volumen,
 * metal con reflejos, vidrio, luces con resplandor) sobre el estudio azul marino de `real-kit.tsx`. Todo en vectores, sin imágenes externas.
 *   Medidor      tablero: medidor de gasolina con aguja, bomba y la flechita dorada (lado de la tapa)
 *   AutoPlanta   vehículo visto desde arriba con la tapa del tanque abierta en un lado
 *   Isla         surtidor visto desde arriba con su manguera y pistola
 *   Llanta       llanta de frente: caucho, flanco con medida, rin y placa con el código DOT; envejece y se agrieta
 *   PlacaVIN     placa metálica con los 17 caracteres del VIN estampados
 *   Parabrisas   esquina inferior del parabrisas con la placa del VIN y su resplandor
 *   Tarjeta      tarjeta de propiedad con la fila del VIN resaltada
 */
import React from "react";
import { useUid } from "../../estudio/util";
import { azar } from "../../lib/anim";
import { H, W, clamp, easeOut, lerp, mezclar, aclarar, oscurecer } from "../comun";
import { FONT, MONOF, RE, Sombra } from "./real-kit";

export const AU = { oro: "#FFC500", rojo: "#E23B2E", azul: "#2E6BFF", metal: "#B8C4D0", verde: "#3DDC84" } as const;

/* ───────────── medidor de gasolina ───────────── */

/** Medidor de gasolina con aguja y bomba; `lado` = hacia dónde apunta la flechita junto a la bomba. `pulso` (0–1) enciende la flechita. */
export const Medidor: React.FC<{ x: number; y: number; r: number; nivel: number; lado: "izq" | "der"; pulso?: number; t?: number }> = ({ x, y, r, nivel, lado, pulso = 0, t = 0 }) => {
  const uid = useUid();
  const ang = (n: number): number => (180 + 180 * clamp(n)) * (Math.PI / 180);
  const P = (n: number, k: number): [number, number] => [x + Math.cos(ang(n)) * r * k, y + 0.12 * r + Math.sin(ang(n)) * r * k];
  const ticks = Array.from({ length: 21 }, (_, i) => i / 20);
  const sg = lado === "izq" ? -1 : 1;
  const cx = x, cy = y + 0.62 * r;
  const glow = 0.45 + 0.55 * pulso;
  const [nx, ny] = P(nivel, 0.74);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}bz`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E8EEF4" /><stop offset="0.35" stopColor="#8E9BA9" /><stop offset="0.7" stopColor="#3B4552" /><stop offset="1" stopColor="#C9D3DE" /></linearGradient>
        <radialGradient id={`${uid}dl`} cx="50%" cy="40%" r="70%"><stop offset="0" stopColor="#1B2233" /><stop offset="1" stopColor="#06080E" /></radialGradient>
        <radialGradient id={`${uid}fg`}><stop offset="0" stopColor={AU.oro} stopOpacity="0.9" /><stop offset="1" stopColor={AU.oro} stopOpacity="0" /></radialGradient>
        <linearGradient id={`${uid}gl`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.28" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.04" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
      </defs>
      <Sombra x={x} y={y + r * 1.02} rx={r * 0.9} ry={r * 0.07} opacidad={0.5} />
      <circle cx={x} cy={y} r={r} fill={`url(#${uid}bz)`} />
      <circle cx={x} cy={y} r={r * 0.93} fill="#0B0E15" />
      <circle cx={x} cy={y} r={r * 0.9} fill={`url(#${uid}dl)`} />
      {/* zona roja cerca de «E» */}
      <path d={`M ${P(0, 0.86)[0]} ${P(0, 0.86)[1]} A ${r * 0.86} ${r * 0.86} 0 0 1 ${P(0.16, 0.86)[0]} ${P(0.16, 0.86)[1]}`} fill="none" stroke={AU.rojo} strokeWidth={r * 0.05} strokeLinecap="round" opacity={0.9} />
      {ticks.map((n, i) => { const [x0, y0] = P(n, 0.8), [x1, y1] = P(n, i % 5 === 0 ? 0.68 : 0.74); return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={i < 3 ? AU.rojo : "#E6EEF7"} strokeWidth={i % 5 === 0 ? r * 0.018 : r * 0.009} strokeLinecap="round" />; })}
      <text x={P(0, 0.56)[0]} y={P(0, 0.56)[1] + r * 0.06} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={r * 0.17} fill={AU.rojo}>E</text>
      <text x={P(1, 0.56)[0]} y={P(1, 0.56)[1] + r * 0.06} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={r * 0.17} fill="#E6EEF7">F</text>
      {/* aguja con sombra */}
      <line x1={x + 3} y1={y + 0.12 * r + 4} x2={nx + 3} y2={ny + 4} stroke="#000" strokeOpacity={0.45} strokeWidth={r * 0.035} strokeLinecap="round" />
      <line x1={x} y1={y + 0.12 * r} x2={nx} y2={ny} stroke="#FF7A2E" strokeWidth={r * 0.032} strokeLinecap="round" />
      <circle cx={x} cy={y + 0.12 * r} r={r * 0.07} fill="#2A3140" stroke="#9FB0C8" strokeWidth={2} />
      {/* bomba de gasolina y flechita */}
      <g transform={`translate(${cx} ${cy})`} opacity={0.95}>
        <rect x={-r * 0.1} y={-r * 0.14} width={r * 0.17} height={r * 0.28} rx={r * 0.02} fill="#E6EEF7" />
        <rect x={-r * 0.075} y={-r * 0.115} width={r * 0.12} height={r * 0.1} rx={r * 0.01} fill="#0B0E15" />
        <path d={`M ${r * 0.07} ${-r * 0.06} q ${r * 0.1} ${-r * 0.02} ${r * 0.1} ${r * 0.08} v ${r * 0.1}`} fill="none" stroke="#E6EEF7" strokeWidth={r * 0.028} strokeLinecap="round" />
        <rect x={-r * 0.12} y={r * 0.14} width={r * 0.21} height={r * 0.025} rx={r * 0.01} fill="#E6EEF7" />
        {/* flechita dorada */}
        <g transform={`translate(${sg * r * 0.24} ${-r * 0.01})`}>
          <circle r={r * (0.2 + 0.08 * pulso)} fill={`url(#${uid}fg)`} opacity={glow} />
          <polygon points={`${sg * r * 0.07},0 ${-sg * r * 0.05},${-r * 0.075} ${-sg * r * 0.05},${r * 0.075}`} fill={AU.oro} stroke="#FFF6C9" strokeWidth={2} strokeLinejoin="round" />
        </g>
      </g>
      {pulso > 0.01 && [0, 1].map((k) => { const q = ((t * 0.9 + k * 0.5) % 1); return <circle key={k} cx={cx + sg * r * 0.24} cy={cy - r * 0.01} r={r * (0.1 + 0.3 * q)} fill="none" stroke={AU.oro} strokeWidth={3} opacity={(1 - q) * 0.7 * pulso} />; })}
      <ellipse cx={x} cy={y - r * 0.28} rx={r * 0.8} ry={r * 0.5} fill={`url(#${uid}gl)`} />
    </g>
  );
};

/* ───────────── vehículo desde arriba y surtidor ───────────── */

/** Vehículo desde arriba (frente hacia arriba). `lado` = lado de la tapa del tanque; `puerta` (0–1) la abre. (x, y) = centro. */
export const AutoPlanta: React.FC<{ x: number; y: number; s?: number; color?: string; lado: "izq" | "der"; puerta?: number }> = ({ x, y, s = 1, color = "#D9302A", lado, puerta = 0 }) => {
  const uid = useUid();
  const sg = lado === "izq" ? -1 : 1;
  const clar = aclarar(color, 0.35), osc = oscurecer(color, 0.45);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={osc} /><stop offset="0.28" stopColor={clar} /><stop offset="0.6" stopColor={color} /><stop offset="1" stopColor={osc} /></linearGradient>
        <linearGradient id={`${uid}v`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2C4A66" /><stop offset="1" stopColor="#0A1522" /></linearGradient>
        <radialGradient id={`${uid}h`}><stop offset="0" stopColor="#FFF3C8" stopOpacity="1" /><stop offset="1" stopColor="#FFF3C8" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx={0} cy={10} rx={150} ry={290} fill="#000" opacity={0.35} />
      {/* ruedas */}
      {[[-128, -170], [128, -170], [-128, 170], [128, 170]].map(([wx, wy], i) => <rect key={i} x={wx - 17} y={wy - 42} width={34} height={84} rx={12} fill="#0A0B0F" stroke="#3A3F4A" strokeWidth={3} />)}
      {/* espejos */}
      {[-1, 1].map((q) => <path key={q} d={`M ${q * 118} -118 q ${q * 36} -6 ${q * 38} 16 q ${-q * 20} 8 ${-q * 38} 2 z`} fill={color} stroke={osc} strokeWidth={2} />)}
      {/* carrocería */}
      <path d="M -118 -230 C -118 -262 -80 -282 0 -282 C 80 -282 118 -262 118 -230 L 128 -110 L 128 150 C 128 230 108 270 70 282 L -70 282 C -108 270 -128 230 -128 150 L -128 -110 Z" fill={`url(#${uid}c)`} />
      <path d="M -112 -226 C -108 -260 -70 -274 0 -274 C 70 -274 108 -260 112 -226" fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={3} />
      {/* parabrisas, techo y luneta */}
      <path d="M -94 -118 L 94 -118 L 80 -52 L -80 -52 Z" fill={`url(#${uid}v)`} />
      <rect x={-88} y={-52} width={176} height={150} fill={mezclar(color, "#FFFFFF", 0.12)} stroke={osc} strokeWidth={2} />
      <path d="M -78 98 L 78 98 L 90 150 L -90 150 Z" fill={`url(#${uid}v)`} />
      <polygon points="-70,-110 -22,-110 -36,-60 -76,-60" fill="#fff" opacity={0.14} />
      {/* faros y pilotos */}
      {[-1, 1].map((q) => <g key={q}><rect x={q * 84 - 24} y={-278} width={48} height={11} rx={5} fill="#FFF3C8" /><circle cx={q * 84} cy={-270} r={30} fill={`url(#${uid}h)`} opacity={0.6} /><rect x={q * 90 - 20} y={272} width={40} height={9} rx={4} fill="#FF4A3B" /></g>)}
      {/* tapa del tanque: pequeña puerta en el costado trasero que se abre */}
      <g transform={`translate(${sg * 126} 158)`}>
        <rect x={sg > 0 ? -2 : -12} y={-26} width={14} height={52} rx={3} fill={osc} />
        <g transform={`rotate(${sg * 70 * puerta} 0 -24)`}>
          <rect x={sg > 0 ? -1 : -14} y={-26} width={15} height={50} rx={3} fill={mezclar(color, "#FFFFFF", 0.1)} stroke="#fff" strokeOpacity={0.4} />
        </g>
        {puerta > 0.2 && <circle cx={sg * 4} cy={0} r={7} fill="#1A1D24" stroke="#9FB0C8" strokeWidth={2} />}
      </g>
    </g>
  );
};

/** Isla del surtidor vista desde arriba: base, columna con pantalla, manguera y pistola hasta (px, py). `lado` = a qué lado queda respecto del vehículo. */
export const Isla: React.FC<{ x: number; y: number; px: number; py: number; lado: "izq" | "der"; conectada?: number; t?: number }> = ({ x, y, px, py, lado, conectada = 0, t = 0 }) => {
  const uid = useUid();
  const sg = lado === "izq" ? 1 : -1; // hacia el vehículo
  const hx = x + sg * 34, hy = y - 40;
  const ex = lerp(x + sg * 80, px, conectada), ey = lerp(y + 90, py, conectada);
  const c1x = hx + sg * 60, c1y = hy + 120, c2x = ex - sg * 40, c2y = ey - 90;
  return (
    <g>
      <defs><linearGradient id={`${uid}p`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2A2F3A" /><stop offset="0.5" stopColor="#4A5160" /><stop offset="1" stopColor="#222730" /></linearGradient></defs>
      <rect x={x - 70} y={y - 190} width={140} height={380} rx={26} fill="#2A2418" opacity={0.0} />
      <rect x={x - 56} y={y - 130} width={112} height={260} rx={18} fill={`url(#${uid}p)`} stroke="#6B7684" strokeWidth={3} />
      <rect x={x - 56} y={y - 130} width={112} height={34} rx={14} fill={AU.rojo} />
      <rect x={x - 40} y={y - 82} width={80} height={46} rx={6} fill="#0B1620" stroke="#9FB0C8" strokeWidth={2} />
      <text x={x} y={y - 48} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={26} fill={AU.verde}>{`${(Math.min(1, conectada) * 38.4).toFixed(1)}`}</text>
      {[0, 1, 2].map((i) => <rect key={i} x={x - 40 + i * 28} y={y - 18} width={24} height={24} rx={4} fill="#9FB0C8" opacity={0.7} />)}
      <path d={`M ${hx} ${hy} C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`} fill="none" stroke="#0A0B0F" strokeWidth={14} strokeLinecap="round" />
      <path d={`M ${hx} ${hy} C ${c1x} ${c1y} ${c2x} ${c2y} ${ex} ${ey}`} fill="none" stroke="#3A404C" strokeWidth={6} strokeLinecap="round" />
      <rect x={ex - 10} y={ey - 10} width={20} height={20} rx={6} fill="#C9D3DE" stroke="#FFFFFF" strokeWidth={2} />
      {conectada > 0.95 && Array.from({ length: 4 }, (_, i) => <circle key={i} cx={ex + sg * -22} cy={ey - 8 + ((t * 40 + i * 12) % 36)} r={3} fill="#FFD45A" opacity={0.7} />)}
    </g>
  );
};

/* ───────────── llanta ───────────── */

/** Llanta de frente. `env` (0–1) la envejece: gris y grietas en el flanco. `dot` = texto de la placa; `fecha` = los cuatro dígitos, que se resaltan en dorado con `luz`. */
export const Llanta: React.FC<{ x: number; y: number; R: number; env?: number; luz?: number; fecha?: string; rot?: number }> = ({ x, y, R, env = 0, luz = 0, fecha = "3624", rot = 0 }) => {
  const uid = useUid();
  const goma = mezclar("#0F1013", "#4A4C52", env * 0.85);
  const cr = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2 + azar(i * 3.7) * 0.3;
    const r0 = R * (0.7 + azar(i * 5.1) * 0.22);
    const len = R * (0.08 + azar(i * 7.7) * 0.1);
    return { x0: x + Math.cos(a) * r0, y0: y + Math.sin(a) * r0, x1: x + Math.cos(a + 0.05) * (r0 + len), y1: y + Math.sin(a + 0.05) * (r0 + len), k: i / 14 };
  });
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}t`} cx="50%" cy="45%" r="55%"><stop offset="0.62" stopColor={mezclar(goma, "#000", 0.1)} /><stop offset="0.84" stopColor={goma} /><stop offset="0.96" stopColor="#050506" /><stop offset="1" stopColor="#1B1C20" /></radialGradient>
        <radialGradient id={`${uid}r`} cx="40%" cy="35%" r="75%"><stop offset="0" stopColor="#F4F7FA" /><stop offset="0.5" stopColor="#A9B4C0" /><stop offset="1" stopColor="#4A5460" /></radialGradient>
        <path id={`${uid}arc`} d={`M ${x - R * 0.78} ${y + R * 0.05} A ${R * 0.78} ${R * 0.78} 0 0 1 ${x + R * 0.78} ${y + R * 0.05}`} />
      </defs>
      <Sombra x={x} y={y + R * 1.0} rx={R * 0.85} ry={R * 0.05} opacidad={0.55} />
      <circle cx={x} cy={y} r={R} fill={`url(#${uid}t)`} />
      {/* dibujo (banda de rodadura) como aro de bloques en el borde */}
      {Array.from({ length: 72 }, (_, i) => { const a = (i / 72) * Math.PI * 2 + (rot * Math.PI) / 180; return <line key={i} x1={x + Math.cos(a) * R * 0.955} y1={y + Math.sin(a) * R * 0.955} x2={x + Math.cos(a) * R * 0.995} y2={y + Math.sin(a) * R * 0.995} stroke="#000" strokeWidth={R * 0.014} opacity={0.8} />; })}
      <circle cx={x} cy={y} r={R * 0.87} fill="none" stroke="#fff" strokeOpacity={0.06} strokeWidth={2} />
      {/* texto del flanco */}
      <text fontFamily={MONOF} fontWeight={700} fontSize={R * 0.062} letterSpacing={R * 0.012} fill={mezclar("#C8CDD6", "#6E727A", env * 0.7)} opacity={0.8}><textPath href={`#${uid}arc`} startOffset="50%" textAnchor="middle">215/60 R16 95H · TUBELESS</textPath></text>
      {/* rin */}
      <circle cx={x} cy={y} r={R * 0.55} fill={`url(#${uid}r)`} />
      <circle cx={x} cy={y} r={R * 0.55} fill="none" stroke="#1B2027" strokeWidth={R * 0.02} />
      {Array.from({ length: 5 }, (_, i) => { const a = (i / 5) * Math.PI * 2 + (rot * Math.PI) / 180 + 0.3; return <path key={i} d={`M ${x + Math.cos(a - 0.2) * R * 0.16} ${y + Math.sin(a - 0.2) * R * 0.16} L ${x + Math.cos(a - 0.1) * R * 0.5} ${y + Math.sin(a - 0.1) * R * 0.5} L ${x + Math.cos(a + 0.1) * R * 0.5} ${y + Math.sin(a + 0.1) * R * 0.5} L ${x + Math.cos(a + 0.2) * R * 0.16} ${y + Math.sin(a + 0.2) * R * 0.16} Z`} fill="#0F1318" opacity={0.85} />; })}
      <circle cx={x} cy={y} r={R * 0.14} fill="#2A3038" stroke="#C9D3DE" strokeWidth={3} />
      {/* grietas del flanco */}
      <g stroke="#0A0A0C" strokeWidth={Math.max(2, R * 0.008)} strokeLinecap="round">
        {cr.map((c, i) => (c.k < env ? <polyline key={i} points={`${c.x0},${c.y0} ${(c.x0 + c.x1) / 2 + 5},${(c.y0 + c.y1) / 2 - 4} ${c.x1},${c.y1}`} fill="none" /> : null))}
      </g>
      {/* placa del DOT: zona lisa en el flanco, abajo a la derecha */}
      <g transform={`translate(${x + R * 0.5} ${y + R * 0.62}) rotate(-38)`}>
        <rect x={-R * 0.33} y={-R * 0.075} width={R * 0.66} height={R * 0.15} rx={R * 0.02} fill="#15161A" stroke="#2C2E35" strokeWidth={2} />
        <text x={-R * 0.3} y={R * 0.03} fontFamily={MONOF} fontWeight={800} fontSize={R * 0.07} fill="#8E939C">DOT 7MR3</text>
        <rect x={R * 0.08} y={-R * 0.06} width={R * 0.22} height={R * 0.12} rx={R * 0.015} fill={AU.oro} opacity={0.28 * luz} />
        <text x={R * 0.095} y={R * 0.032} fontFamily={MONOF} fontWeight={800} fontSize={R * 0.07} fill={mezclar("#8E939C", AU.oro, luz)}>{fecha}</text>
      </g>
    </g>
  );
};

/* ───────────── placa del VIN ───────────── */

/** Placa metálica con 17 caracteres estampados. `resalta` (0–1) ilumina el 10.º. */
export const PlacaVIN: React.FC<{ x: number; y: number; chars: string; resalta?: number; k?: number }> = ({ x, y, chars, resalta = 0, k = 1 }) => {
  const uid = useUid();
  const w = 900, h = 190, paso = 50;
  return (
    <g transform={`translate(${x} ${y})`} opacity={clamp(k * 2)}>
      <defs><linearGradient id={`${uid}m`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E8EEF4" /><stop offset="0.5" stopColor="#B5C0CC" /><stop offset="1" stopColor="#7E8A98" /></linearGradient></defs>
      <rect x={-w / 2 + 6} y={-h / 2 + 10} width={w} height={h} rx={22} fill="#000" opacity={0.4} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={22} fill={`url(#${uid}m)`} stroke="#F4F7FA" strokeWidth={3} />
      {[[-w / 2 + 28, -h / 2 + 26], [w / 2 - 28, -h / 2 + 26], [-w / 2 + 28, h / 2 - 26], [w / 2 - 28, h / 2 - 26]].map(([rx, ry], i) => <g key={i}><circle cx={rx} cy={ry} r={9} fill="#6E7A88" /><circle cx={rx - 2} cy={ry - 2} r={4} fill="#F4F7FA" opacity={0.7} /></g>)}
      <text x={0} y={-h / 2 + 52} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={26} fill="#3A4452" letterSpacing={6}>VIN · NÚMERO DE IDENTIFICACIÓN</text>
      {chars.split("").map((c, i) => {
        const cx = -((16 * paso) / 2) + i * paso, on = i === 9;
        return (
          <g key={i}>
            <rect x={cx - 20} y={-26} width={40} height={66} rx={7} fill={on ? mezclar("#9AA6B3", AU.oro, resalta * 0.85) : "#9AA6B3"} stroke="#5A6572" strokeWidth={2} />
            <text x={cx} y={24} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={44} fill={on ? mezclar("#2A323E", "#2A1A00", resalta) : "#2A323E"} opacity={clamp(k * 3 - i * 0.08)}>{c}</text>
            <text x={cx} y={70} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={20} fill={on ? mezclar("#4A5562", "#7A4B00", resalta) : "#4A5562"}>{i + 1}</text>
          </g>
        );
      })}
    </g>
  );
};

/* ───────────── parabrisas y tarjeta ───────────── */

/** Esquina inferior del parabrisas vista por fuera: vidrio, base del capó y la placa del VIN con resplandor. */
export const Parabrisas: React.FC<{ x: number; y: number; w?: number; h?: number; luz?: number; t?: number }> = ({ x, y, w = 860, h = 420, luz = 0, t = 0 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2E4A66" /><stop offset="0.5" stopColor="#16283B" /><stop offset="1" stopColor="#0B1622" /></linearGradient>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D9302A" /><stop offset="1" stopColor="#7A1A16" /></linearGradient>
        <radialGradient id={`${uid}l`}><stop offset="0" stopColor={AU.oro} stopOpacity="0.85" /><stop offset="1" stopColor={AU.oro} stopOpacity="0" /></radialGradient>
      </defs>
      <path d={`M 0 0 L ${w} 0 L ${w} ${h * 0.62} L 0 ${h * 0.7} Z`} fill={`url(#${uid}g)`} stroke="#0A0D12" strokeWidth={10} />
      <polygon points={`40,30 ${w * 0.45},20 ${w * 0.3},${h * 0.4} 40,${h * 0.46}`} fill="#fff" opacity={0.09} />
      <path d={`M 0 ${h * 0.7} L ${w} ${h * 0.62} L ${w} ${h} L 0 ${h} Z`} fill={`url(#${uid}c)`} />
      <path d={`M 0 ${h * 0.7} L ${w} ${h * 0.62}`} stroke="#fff" strokeOpacity={0.4} strokeWidth={4} />
      <ellipse cx={92} cy={h * 0.55} rx={170 + 20 * Math.sin(t * 4) } ry={120} fill={`url(#${uid}l)`} opacity={luz} />
      {/* limpiaparabrisas y marco izquierdo */}
      <path d={`M ${w * 0.1} ${h * 0.66} L ${w * 0.62} ${h * 0.12}`} stroke="#07090D" strokeWidth={10} strokeLinecap="round" opacity={0.85} />
      <path d={`M ${w * 0.34} ${h * 0.65} L ${w * 0.86} ${h * 0.2}`} stroke="#07090D" strokeWidth={10} strokeLinecap="round" opacity={0.85} />
      <polygon points={`0,0 34,0 30,${h * 0.69} 0,${h * 0.7}`} fill="#0A0D12" />
      <rect x={36} y={h * 0.4} width={176} height={50} rx={6} fill="#E8EEF4" stroke="#fff" strokeWidth={2} />
      <text x={124} y={h * 0.4 + 34} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={20} fill="#2A323E" letterSpacing={1}>VIN ·······</text>
    </g>
  );
};

/** Tarjeta de propiedad con campos y la fila del VIN resaltada. */
export const Tarjeta: React.FC<{ x: number; y: number; luz?: number }> = ({ x, y, luz = 0 }) => {
  const uid = useUid();
  const w = 860, h = 420;
  return (
    <g transform={`translate(${x} ${y}) rotate(-2)`}>
      <defs><linearGradient id={`${uid}t`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F4F7FA" /><stop offset="1" stopColor="#C6D2DE" /></linearGradient></defs>
      <rect x={8} y={12} width={w} height={h} rx={26} fill="#000" opacity={0.4} />
      <rect width={w} height={h} rx={26} fill={`url(#${uid}t)`} stroke="#fff" strokeWidth={3} />
      <rect width={w} height={70} rx={26} fill="#1A3C8C" />
      <rect y={44} width={w} height={26} fill="#1A3C8C" />
      <text x={40} y={46} fontFamily={FONT} fontWeight={800} fontSize={32} fill="#fff">TARJETA DE PROPIEDAD</text>
      {[["PLACA", "·· ·· ··"], ["MARCA", "········"], ["MODELO", "····"], ["COLOR", "········"]].map(([a, b], i) => <g key={i}><text x={40} y={120 + i * 52} fontFamily={MONOF} fontWeight={700} fontSize={22} fill="#52606E">{a}</text><text x={250} y={120 + i * 52} fontFamily={MONOF} fontWeight={800} fontSize={26} fill="#8B97A5">{b}</text></g>)}
      <rect x={24} y={322} width={w - 48} height={64} rx={12} fill={AU.oro} opacity={0.22 * luz + 0.04} stroke={AU.oro} strokeOpacity={0.9 * luz} strokeWidth={4} />
      <text x={40} y={364} fontFamily={MONOF} fontWeight={700} fontSize={22} fill="#52606E">VIN</text>
      <text x={250} y={364} fontFamily={MONOF} fontWeight={800} fontSize={26} fill="#1A222C">·················</text>
    </g>
  );
};

export { H, W, easeOut, lerp, RE };
