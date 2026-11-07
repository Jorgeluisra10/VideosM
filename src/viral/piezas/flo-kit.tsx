/**
 * Kit de «El piso que no existe» (IMNOBA · figuras realistas · carril B). Objetos dibujados como renders sobre el estudio azul marino de `real-kit.tsx`.
 *   PanelAscensor   panel de acero cepillado con botones cromados que se iluminan; un hueco (el piso que falta) pulsa como un fantasma
 *   Indicador       pantalla de ascensor con el número del piso en ámbar
 *   Edificio        corte lateral de un edificio con sus losas, ventanas y la columna de números de piso (reales y rotulados)
 *   Cuadricula      cuadrícula de edificios (cuadritos) donde se marcan en dorado los que muestran un piso 13
 */
import React from "react";
import { useUid } from "../../estudio/util";
import { azar } from "../../lib/anim";
import { H, W, clamp, easeOut, lerp, mezclar, aclarar, oscurecer } from "../comun";
import { FONT, MONOF, RE, Sombra } from "./real-kit";

export const FL = { oro: "#FFC500", ambar: "#FFB020", rojo: "#E23B2E", verde: "#3DDC84", acero: "#B8C4D0" } as const;

/* ───────────── panel de ascensor ───────────── */

export type Boton = { n: string | null; luz?: number; oro?: boolean; rojo?: boolean };

/** Panel de acero con botones en columna (de arriba abajo). `n = null` es un hueco: se dibuja un anillo fantasma con «?» que pulsa (`fantasma` 0–1). */
export const PanelAscensor: React.FC<{ x: number; y: number; botones: Boton[]; paso?: number; r?: number; fantasma?: number; t?: number; titulo?: string }> = ({ x, y, botones, paso = 122, r = 46, fantasma = 0, t = 0, titulo }) => {
  const uid = useUid();
  const h = botones.length * paso + 90, w = 2 * r + 120;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id={`${uid}a`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6F7B88" /><stop offset="0.25" stopColor="#D8E0E8" /><stop offset="0.5" stopColor="#9FADBA" /><stop offset="0.8" stopColor="#E6ECF2" /><stop offset="1" stopColor="#66727F" /></linearGradient>
        <radialGradient id={`${uid}b`} cx="40%" cy="35%" r="75%"><stop offset="0" stopColor="#F7FAFC" /><stop offset="0.6" stopColor="#B8C4D0" /><stop offset="1" stopColor="#59646F" /></radialGradient>
        <radialGradient id={`${uid}g`}><stop offset="0" stopColor="#FFE9A8" stopOpacity="0.95" /><stop offset="1" stopColor="#FFB020" stopOpacity="0" /></radialGradient>
      </defs>
      <rect x={-w / 2 + 10} y={14} width={w} height={h} rx={34} fill="#000" opacity={0.45} />
      <rect x={-w / 2} y={0} width={w} height={h} rx={34} fill={`url(#${uid}a)`} stroke="#F4F7FA" strokeWidth={4} />
      {Array.from({ length: Math.floor(h / 6) }, (_, i) => <line key={i} x1={-w / 2 + 10} y1={10 + i * 6} x2={w / 2 - 10} y2={10 + i * 6} stroke="#fff" strokeOpacity={0.05 + 0.05 * azar(i * 3.3)} strokeWidth={1} />)}
      {[[-w / 2 + 24, 24], [w / 2 - 24, 24], [-w / 2 + 24, h - 24], [w / 2 - 24, h - 24]].map(([sx, sy], i) => <g key={i}><circle cx={sx} cy={sy} r={8} fill="#5E6A77" /><circle cx={sx - 2} cy={sy - 2} r={3.5} fill="#F4F7FA" opacity={0.7} /></g>)}
      {botones.map((b, i) => {
        const cy = 90 + i * paso;
        if (b.n === null) {
          const p = 0.5 + 0.5 * Math.sin(t * 5);
          return (
            <g key={i} opacity={0.35 + 0.65 * fantasma}>
              <circle cx={0} cy={cy} r={r + 8} fill="none" stroke={FL.rojo} strokeOpacity={0.35 + 0.5 * p * fantasma} strokeWidth={5} strokeDasharray="10 9" />
              <circle cx={0} cy={cy} r={r - 6} fill="#0D1118" opacity={0.7} />
              <text x={0} y={cy + 18} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={54} fill={FL.rojo} opacity={0.4 + 0.6 * fantasma}>?</text>
            </g>
          );
        }
        const luz = b.luz ?? 0;
        const col = b.oro ? FL.oro : b.rojo ? FL.rojo : FL.ambar;
        return (
          <g key={i}>
            <circle cx={0} cy={cy + 6} r={r + 8} fill="#000" opacity={0.35} />
            <circle cx={0} cy={cy} r={r + 8} fill={`url(#${uid}b)`} stroke="#4A5560" strokeWidth={3} />
            <circle cx={0} cy={cy} r={r - 2} fill={mezclar("#1B222C", col, luz * 0.5)} stroke={mezclar("#2A3340", col, luz)} strokeWidth={4} />
            {luz > 0.02 && <circle cx={0} cy={cy} r={r * 2.2} fill={`url(#${uid}g)`} opacity={0.55 * luz} />}
            <text x={0} y={cy + 17} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={b.n.length > 1 ? 46 : 54} fill={mezclar("#C9D3DE", "#FFFFFF", luz)}>{b.n}</text>
          </g>
        );
      })}
      {titulo && <text x={0} y={h + 52} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={26} fill={RE.hielo}>{titulo}</text>}
    </g>
  );
};

/** Pantalla de ascensor: marco negro, número ámbar con resplandor y flecha de dirección (`dir` 1 sube, −1 baja, 0 nada). */
export const Indicador: React.FC<{ x: number; y: number; texto: string; dir?: number; t?: number; w?: number }> = ({ x, y, texto, dir = 0, t = 0, w = 300 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs><linearGradient id={`${uid}d`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1B1F27" /><stop offset="1" stopColor="#05070A" /></linearGradient></defs>
      <rect x={-w / 2 + 8} y={10} width={w} height={150} rx={22} fill="#000" opacity={0.45} />
      <rect x={-w / 2} y={0} width={w} height={150} rx={22} fill={`url(#${uid}d)`} stroke="#6F7B88" strokeWidth={6} />
      <rect x={-w / 2 + 16} y={16} width={w - 32} height={118} rx={12} fill="#0A0604" />
      <text x={20} y={112} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={104} fill={FL.ambar} style={{ filter: "drop-shadow(0 0 14px rgba(255,176,32,0.8))" }}>{texto}</text>
      {dir !== 0 && <polygon points={`${-w / 2 + 62},${dir > 0 ? 54 : 94} ${-w / 2 + 92},${dir > 0 ? 94 : 54} ${-w / 2 + 32},${dir > 0 ? 94 : 54}`} fill={FL.ambar} opacity={0.6 + 0.4 * Math.sin(t * 8)} />}
    </g>
  );
};

/* ───────────── edificio en corte ───────────── */

/**
 * Edificio visto de lado con `n` pisos reales (de abajo hacia arriba, el 1 es la planta baja). `rotulos[i]` es el número que se ve en el botón del piso i+1
 * (o null si no tiene rótulo). `resalta` marca en dorado el piso real que se indica; `hasta` = cuántos pisos están dibujados (admite decimales).
 */
export const Edificio: React.FC<{ x: number; y: number; w: number; alto: number; n: number; rotulos: (string | null)[]; resalta?: number; hasta?: number; brillo?: number; reales?: boolean }> = ({ x, y, w, alto, n, rotulos, resalta = -1, hasta = n, brillo = 1, reales = false }) => {
  const uid = useUid();
  const h = alto / n;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2B5C86" /><stop offset="0.5" stopColor="#3C7DB3" /><stop offset="1" stopColor="#1F4768" /></linearGradient>
        <radialGradient id={`${uid}l`}><stop offset="0" stopColor="#FFC500" stopOpacity="0.8" /><stop offset="1" stopColor="#FFC500" stopOpacity="0" /></radialGradient>
      </defs>
      <Sombra x={x + w / 2} y={y} rx={w * 0.7} ry={14} opacidad={0.5} />
      {Array.from({ length: n }, (_, i) => {
        const vis = clamp(hasta - i);
        if (vis <= 0.01) return null;
        const yy = y - (i + 1) * h;
        const on = i === resalta;
        const cl = on ? mezclar("#3C7DB3", FL.oro, 0.55) : `url(#${uid}f)`;
        return (
          <g key={i} opacity={clamp(vis * 2)} transform={`translate(0 ${(1 - vis) * -30})`}>
            {on && <ellipse cx={x + w / 2} cy={yy + h / 2} rx={w * 0.9} ry={h * 1.1} fill={`url(#${uid}l)`} opacity={brillo} />}
            <rect x={x} y={yy + 2} width={w} height={h - 3} fill={cl} stroke="#0B1A2B" strokeWidth={2} />
            {Array.from({ length: 5 }, (_, k) => <rect key={k} x={x + 14 + k * ((w - 28) / 5)} y={yy + h * 0.22} width={(w - 28) / 5 - 8} height={h * 0.5} fill={on ? "#FFF2B8" : azar(i * 7.1 + k * 3.3) < 0.55 ? "#FFE3A0" : "#10233A"} opacity={on ? 0.95 : 0.75} />)}
            <rect x={x} y={yy + h - 5} width={w} height={5} fill="#C9D3DE" opacity={0.6} />
            {/* número real (izquierda) y rótulo del botón (derecha) */}
            {reales && <text x={x - 18} y={yy + h * 0.68} textAnchor="end" fontFamily={MONOF} fontWeight={700} fontSize={Math.min(34, h * 0.5)} fill={on ? FL.oro : "#8FB4D8"}>{i + 1}</text>}
            <text x={x + w + 22} y={yy + h * 0.68} textAnchor="start" fontFamily={FONT} fontWeight={800} fontSize={Math.min(44, h * 0.62)} fill={rotulos[i] === null ? FL.rojo : on ? FL.oro : "#E6EEF7"}>{rotulos[i] ?? "—"}</text>
          </g>
        );
      })}
      <rect x={x - 10} y={y} width={w + 20} height={18} rx={4} fill="#3A4452" />
    </g>
  );
};

/* ───────────── cuadrícula de edificios ───────────── */

/** `cols` × `filas` cuadritos (edificios) que aparecen de golpe; los índices de `dorados` se pintan en dorado. */
export const Cuadricula: React.FC<{ x: number; y: number; cols: number; filas: number; lado: number; aparece: number; dorados: Set<number>; marca: number }> = ({ x, y, cols, filas, lado, aparece, dorados, marca }) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({ length: cols * filas }, (_, i) => {
      const cx = (i % cols) * lado, cy = Math.floor(i / cols) * lado;
      const k = clamp(aparece * 1.6 - azar(i * 1.7) * 0.6);
      if (k <= 0) return null;
      const d = dorados.has(i);
      const m = d ? clamp(marca * 2 - azar(i * 5.1)) : 0;
      return <rect key={i} x={cx + 1.5} y={cy + 1.5} width={lado - 3} height={lado - 3} rx={3} fill={d ? mezclar("#3C5F87", FL.oro, m) : "#3C5F87"} opacity={clamp(k * 2) * (d ? 1 : 0.75)} />;
    })}
  </g>
);

export { H, W, easeOut, lerp, aclarar, oscurecer };
