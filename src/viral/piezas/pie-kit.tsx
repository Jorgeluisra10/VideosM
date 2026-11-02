/**
 * Kit del video «¿Por qué se te duerme el pie?» (carril B · SINAPSIS · cuerpo cotidiano): pierna de cristal con huesos y el nervio peroneo, y un nervio en primer plano.
 *   Pierna   vista lateral (mirando a la izquierda): contorno de cristal, fémur, rótula, tibia, peroné, pie, nervio amarillo, presión sobre la cabeza del peroné, estados del pie
 *   Cable    nervio en primer plano (axón con vaina de mielina): impulsos, pinza que lo aprieta y descargas espontáneas
 *   Chispas  destellos de hormigueo
 * Esquemas, no ilustraciones médicas exactas.
 */
import React from "react";
import { getLength, getPointAtLength } from "@remotion/paths";
import { mulberry32 } from "../../anim/piezas";
import { useUid } from "../../estudio/util";
import { clamp } from "../comun";
import { MONOF } from "./real-kit";

export const PC = {
  cristal: "#6FA3D8",
  borde: "#A9D0F5",
  hueso: "#EFE7D2",
  huesoOsc: "#A89C80",
  nervio: "#FFD84A",
  nervioClaro: "#FFF3B0",
  apagado: "#6B7686",
  rojo: "#FF4A3D",
  verde: "#34D399",
  hielo: "#BFE0FF",
  azul: "#4C7DFF",
  magenta: "#FF7AD9",
} as const;

/** curva suave (Catmull-Rom → Bézier) por los puntos dados */
export const suave = (p: [number, number][], cerrar = false, tension = 0.5): string => {
  const n = p.length;
  const g = (i: number): [number, number] => p[(i + n) % n];
  let d = `M ${p[0][0]} ${p[0][1]}`;
  const fin = cerrar ? n : n - 1;
  for (let i = 0; i < fin; i++) {
    const p0 = cerrar ? g(i - 1) : p[Math.max(0, i - 1)], p1 = g(i), p2 = g(i + 1), p3 = cerrar ? g(i + 2) : p[Math.min(n - 1, i + 2)];
    const k = tension / 3;
    const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return cerrar ? d + " Z" : d;
};

const CONTORNO: [number, number][] = [
  [470, 560], [466, 700], [474, 830], [472, 880], [478, 980], [484, 1110], [490, 1205],
  [440, 1245], [360, 1268], [300, 1288], [296, 1308], [330, 1322], [480, 1326], [600, 1326],
  [622, 1290], [620, 1230], [610, 1150], [640, 1040], [648, 980], [626, 900], [624, 830], [622, 700], [620, 560],
];
const D_CONTORNO = suave(CONTORNO, true);
/** nervio peroneo: de la parte posterior del muslo, rodea la cabeza del peroné y baja por delante de la pierna hasta el dorso del pie */
const D_NERVIO_ALTO = "M 600 560 C 604 700 606 800 598 880 C 590 915 584 930 576 940";
const D_NERVIO_BAJO = "M 576 940 C 560 960 545 990 538 1030 C 528 1100 524 1170 512 1230 C 480 1262 420 1280 350 1292";
export const PUNTO_PRESION: [number, number] = [580, 936];
const LARGO_BAJO = getLength(D_NERVIO_BAJO);

/** Destellos de hormigueo: pequeñas estrellas de 4 puntas que parpadean alrededor de una zona (en coordenadas locales de la pierna). */
export const Chispas: React.FC<{ t: number; cantidad: number; zona: [number, number, number, number]; semilla?: number; color?: string }> = ({ t, cantidad, zona, semilla = 3, color = PC.magenta }) => {
  const r = mulberry32(semilla);
  const n = Math.round(24 * clamp(cantidad));
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const x = zona[0] + r() * zona[2], y = zona[1] + r() * zona[3], fase = r() * 6.28, v = 3 + r() * 5, tam = 6 + r() * 10;
        const k = Math.max(0, Math.sin(t * v + fase));
        if (k < 0.15) return null;
        return <path key={i} d={`M 0 ${-tam} L ${tam * 0.22} ${-tam * 0.22} L ${tam} 0 L ${tam * 0.22} ${tam * 0.22} L 0 ${tam} L ${-tam * 0.22} ${tam * 0.22} L ${-tam} 0 L ${-tam * 0.22} ${-tam * 0.22} Z`} transform={`translate(${x} ${y}) scale(${k})`} fill={color} opacity={0.9} />;
      })}
    </g>
  );
};

/**
 * Pierna de cristal. `x, y` = traslación (el diagrama ocupa x 296–648, y 560–1326 en su origen); `s` = escala.
 * `presion` 0–1: la otra rodilla aprieta la cabeza del peroné · `apagado` 0–1: el tramo bajo del nervio y el pie se apagan · `pulsos`: señales que suben por el nervio ·
 * `chispas` 0–1: hormigueo en el pie · `conectado` 0–1: brillo verde de «conectado».
 */
export const Pierna: React.FC<{ x?: number; y?: number; s?: number; t: number; presion?: number; apagado?: number; pulsos?: boolean; chispas?: number; conectado?: number; opacidad?: number; etiquetas?: number }> = ({ x = 0, y = 0, s = 1, t, presion = 0, apagado = 0, pulsos = false, chispas = 0, conectado = 0, opacidad = 1, etiquetas = 0 }) => {
  const uid = useUid();
  const colNervio = apagado > 0.5 ? PC.apagado : PC.nervio;
  const lat = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 0.9 * t)), 3);
  const pasan = pulsos && presion < 0.7;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
      <defs>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={PC.cristal} stopOpacity="0.34" /><stop offset="0.5" stopColor={PC.cristal} stopOpacity="0.14" /><stop offset="1" stopColor={PC.cristal} stopOpacity="0.3" /></linearGradient>
        <linearGradient id={`${uid}h`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={PC.huesoOsc} /><stop offset="0.4" stopColor={PC.hueso} /><stop offset="1" stopColor={PC.huesoOsc} /></linearGradient>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.18" stopColor="#fff" stopOpacity="1" /><stop offset="1" stopColor="#fff" stopOpacity="1" /></linearGradient>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={250} y={520} width={460} height={840}><rect x={250} y={540} width={460} height={800} fill={`url(#${uid}f)`} /></mask>
        <clipPath id={`${uid}k`}><path d={D_CONTORNO} /></clipPath>
        <filter id={`${uid}g`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" /></filter>
        <radialGradient id={`${uid}p`}><stop offset="0" stopColor={PC.rojo} stopOpacity="0.9" /><stop offset="1" stopColor={PC.rojo} stopOpacity="0" /></radialGradient>
      </defs>
      <g mask={`url(#${uid}m)`}>
        {/* contorno de cristal */}
        <path d={D_CONTORNO} fill={`url(#${uid}c)`} stroke={PC.borde} strokeOpacity={0.7} strokeWidth={3} />
        <g clipPath={`url(#${uid}k)`}>
          {/* brillo de «conectado» o apagado en el pie */}
          <ellipse cx={440} cy={1290} rx={190} ry={60} fill={conectado > 0 ? PC.verde : apagado > 0.5 ? "#000" : PC.azul} opacity={conectado > 0 ? 0.3 * conectado : apagado > 0.5 ? 0.35 * apagado : 0.18} />
          {/* huesos */}
          <rect x={519} y={540} width={54} height={320} rx={26} fill={`url(#${uid}h)`} opacity={0.9} />
          <ellipse cx={546} cy={862} rx={54} ry={34} fill={`url(#${uid}h)`} opacity={0.95} />
          <ellipse cx={488} cy={872} rx={17} ry={23} fill={PC.hueso} opacity={0.85} />
          <rect x={508} y={896} width={40} height={318} rx={18} fill={`url(#${uid}h)`} opacity={0.92} />
          <ellipse cx={528} cy={1222} rx={26} ry={20} fill={PC.hueso} opacity={0.9} />
          <rect x={574} y={912} width={22} height={300} rx={11} fill={`url(#${uid}h)`} opacity={0.92} />
          <ellipse cx={586} cy={920} rx={23} ry={20} fill={PC.hueso} stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />
          <ellipse cx={585} cy={1222} rx={16} ry={16} fill={PC.hueso} opacity={0.9} />
          <ellipse cx={575} cy={1290} rx={48} ry={30} fill={`url(#${uid}h)`} opacity={0.92} />
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M 530 ${1268 + i * 5} L ${350 + i * 4} ${1292 + i * 3}`} stroke={PC.hueso} strokeWidth={9} strokeLinecap="round" opacity={0.85} />)}
          {/* nervio peroneo */}
          <path d={D_NERVIO_ALTO} fill="none" stroke={PC.nervio} strokeWidth={14} strokeLinecap="round" opacity={0.25} filter={`url(#${uid}g)`} />
          <path d={D_NERVIO_ALTO} fill="none" stroke={PC.nervio} strokeWidth={9} strokeLinecap="round" />
          <path d={D_NERVIO_BAJO} fill="none" stroke={colNervio} strokeWidth={14} strokeLinecap="round" opacity={0.25} filter={`url(#${uid}g)`} />
          <path d={D_NERVIO_BAJO} fill="none" stroke={colNervio} strokeWidth={9} strokeLinecap="round" />
          <path d={D_NERVIO_BAJO} fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" opacity={0.5} transform="translate(-2 -2)" />
          {/* impulsos que suben hacia el cerebro */}
          {pasan && Array.from({ length: 4 }, (_, i) => {
            const u = ((t * 0.5 + i / 4) % 1);
            const p = getPointAtLength(D_NERVIO_BAJO, (1 - u) * LARGO_BAJO) ?? { x: 0, y: 0 };
            return <circle key={i} cx={p.x} cy={p.y} r={7} fill={PC.nervioClaro} stroke="#fff" strokeWidth={2} opacity={Math.sin(u * Math.PI) * (1 - apagado)} />;
          })}
        </g>
      </g>
      {/* presión sobre la cabeza del peroné */}
      {presion > 0 && (
        <g opacity={clamp(presion * 1.5)}>
          <circle cx={PUNTO_PRESION[0]} cy={PUNTO_PRESION[1]} r={64 + 8 * lat} fill={`url(#${uid}p)`} />
          <g transform={`translate(${PUNTO_PRESION[0] + 150 - 70 * presion} ${PUNTO_PRESION[1]})`}>
            <ellipse cx={0} cy={0} rx={96} ry={62} fill="#9AB3CC" fillOpacity={0.55} stroke={PC.borde} strokeWidth={4} />
            <text x={14} y={10} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={20} fill="#fff">otra rodilla</text>
          </g>
          {[-26, 0, 26].map((d, i) => <path key={i} d={`M ${PUNTO_PRESION[0] + 74 - 40 * presion} ${PUNTO_PRESION[1] + d} L ${PUNTO_PRESION[0] + 22} ${PUNTO_PRESION[1] + d}`} stroke={PC.rojo} strokeWidth={6} strokeLinecap="round" markerEnd="none" />)}
          <circle cx={PUNTO_PRESION[0]} cy={PUNTO_PRESION[1]} r={11} fill={PC.rojo} stroke="#fff" strokeWidth={3} />
        </g>
      )}
      {chispas > 0 && <Chispas t={t} cantidad={chispas} zona={[300, 1180, 320, 150]} />}
      {etiquetas > 0 && (
        <g opacity={clamp(etiquetas)}>
          <path d="M 640 930 L 760 880" stroke={PC.nervioClaro} strokeWidth={3} />
          <text x={766} y={880} fontFamily={MONOF} fontWeight={700} fontSize={26} fill={PC.nervioClaro}>nervio</text>
          <text x={766} y={910} fontFamily={MONOF} fontWeight={700} fontSize={26} fill={PC.nervioClaro}>peroneo</text>
        </g>
      )}
    </g>
  );
};

/* ───────────── nervio en primer plano ───────────── */

export type ModoCable = "normal" | "bloqueo" | "caos";

/**
 * Nervio horizontal de `x0` (pie) a `x1` (cerebro). Pulsos viajan hacia la derecha.
 *  · "normal": pulsos constantes · "bloqueo": una pinza (en `xp`) se cierra con `aprieta` 0–1 y, cerrada, detiene los pulsos · "caos": sin pinza, descargas espontáneas por todo el cable.
 * Devuelve (por `onLlega`) cuántos pulsos llegan al final en ese fotograma para que el cerebro brille.
 */
export const Cable: React.FC<{ x0: number; x1: number; y: number; t: number; modo: ModoCable; aprieta?: number; xp?: number; t0?: number; opacidad?: number; semilla?: number }> = ({ x0, x1, y, t, modo, aprieta = 0, xp = (x0 + x1) / 2, t0 = 0, opacidad = 1, semilla = 7 }) => {
  const uid = useUid();
  const largo = x1 - x0;
  const vel = 380;
  const anchoV = 52;
  const nSeg = Math.floor(largo / 96);
  const cerrada = aprieta > 0.75;
  const pulsos: { x: number; op: number; r: number; color: string }[] = [];
  const r = mulberry32(semilla);
  if (modo !== "caos") {
    for (let k = 0; k < 14; k++) {
      const ts = t0 + k * 0.62;
      const x = x0 + (t - ts) * vel;
      if (x < x0 || x > x1) continue;
      const bloqueado = modo === "bloqueo" && cerrada && x > xp - 8;
      if (bloqueado) continue;
      pulsos.push({ x, op: modo === "bloqueo" && x > xp ? 0.5 : 1, r: 13, color: "#FFF3B0" });
    }
  } else {
    for (let k = 0; k < 28; k++) {
      const ts = t0 + r() * 3.5, xs = x0 + 40 + r() * (largo - 80);
      const x = xs + (t - ts) * (vel * 0.9);
      if (t < ts || x > x1) continue;
      pulsos.push({ x, op: 1, r: 8 + r() * 6, color: r() > 0.5 ? PC.magenta : "#FFE66B" });
    }
  }
  return (
    <g opacity={opacidad}>
      <defs>
        <linearGradient id={`${uid}t`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.35" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.05" /><stop offset="1" stopColor="#fff" stopOpacity="0.2" /></linearGradient>
        <linearGradient id={`${uid}m`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F6F1E6" /><stop offset="0.5" stopColor="#CFC6B0" /><stop offset="1" stopColor="#8E866F" /></linearGradient>
        <filter id={`${uid}b`} x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation="8" /></filter>
      </defs>
      {/* tubo de cristal */}
      <rect x={x0} y={y - anchoV / 2 - 12} width={largo} height={anchoV + 24} rx={(anchoV + 24) / 2} fill="#0B1830" stroke={PC.borde} strokeOpacity={0.5} strokeWidth={3} />
      {/* axón */}
      <rect x={x0 + 10} y={y - 5} width={largo - 20} height={10} rx={5} fill={PC.nervio} opacity={0.9} />
      {/* vaina de mielina por segmentos (nodos entre ellos) */}
      {Array.from({ length: nSeg }, (_, i) => {
        const sx = x0 + 16 + i * (largo - 32) / nSeg;
        const w = (largo - 32) / nSeg - 14;
        const comprimido = modo === "bloqueo" && Math.abs(sx + w / 2 - xp) < 60 ? aprieta * 0.45 : 0;
        const h = (anchoV - 6) * (1 - comprimido);
        return <rect key={i} x={sx} y={y - h / 2} width={w} height={h} rx={h * 0.4} fill={`url(#${uid}m)`} opacity={0.95} />;
      })}
      {/* pinza */}
      {modo === "bloqueo" && aprieta > 0 && (
        <g>
          <path d={`M ${xp - 40} ${y - 120 + 70 * aprieta} L ${xp + 40} ${y - 120 + 70 * aprieta} L ${xp + 24} ${y - 30 * (1 - 0.6 * aprieta) - 6} L ${xp - 24} ${y - 30 * (1 - 0.6 * aprieta) - 6} Z`} fill="#8FA3B8" stroke="#E8F0F8" strokeWidth={3} />
          <path d={`M ${xp - 40} ${y + 120 - 70 * aprieta} L ${xp + 40} ${y + 120 - 70 * aprieta} L ${xp + 24} ${y + 30 * (1 - 0.6 * aprieta) + 6} L ${xp - 24} ${y + 30 * (1 - 0.6 * aprieta) + 6} Z`} fill="#8FA3B8" stroke="#E8F0F8" strokeWidth={3} />
          {cerrada && <circle cx={xp} cy={y} r={40} fill={PC.rojo} opacity={0.22 + 0.12 * Math.sin(t * 8)} />}
        </g>
      )}
      {/* pulsos */}
      {pulsos.map((p, i) => (
        <g key={i} opacity={p.op}>
          <circle cx={p.x} cy={y} r={p.r * 2.6} fill={p.color} opacity={0.3} filter={`url(#${uid}b)`} />
          <circle cx={p.x} cy={y} r={p.r} fill={p.color} stroke="#fff" strokeWidth={2.5} />
        </g>
      ))}
    </g>
  );
};

/** ¿cuántos pulsos llegan al extremo en este instante? (0–1) para hacer brillar el cerebro */
export const llegada = (t: number, x0: number, x1: number, modo: ModoCable, aprieta: number, xp: number, t0: number): number => {
  const vel = 380;
  let m = 0;
  if (modo === "caos") return 0.5 + 0.5 * Math.sin(t * 17) * Math.sin(t * 5.3);
  for (let k = 0; k < 14; k++) {
    const x = x0 + (t - (t0 + k * 0.62)) * vel;
    if (modo === "bloqueo" && aprieta > 0.75 && x > xp - 8) continue;
    const d = Math.abs(x - x1);
    m = Math.max(m, Math.max(0, 1 - d / 60));
  }
  return m;
};

/** Mini pie de perfil (silueta) para iconos; mira a la izquierda. */
export const PieMini: React.FC<{ x: number; y: number; s?: number; color?: string; relleno?: string; opacidad?: number }> = ({ x, y, s = 1, color = PC.borde, relleno = "#0B1830", opacidad = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacidad}>
    <path d="M 490 1205 L 440 1245 L 360 1268 L 300 1288 L 296 1308 L 330 1322 L 480 1326 L 600 1326 L 622 1290 L 620 1230 Z" transform="translate(-460 -1270)" fill={relleno} stroke={color} strokeWidth={5} strokeLinejoin="round" />
  </g>
);

/** Registro de lo que recibe el cerebro en los últimos `ventana` segundos (como un electro): `valorEn(tt)` da 0–1 en el instante tt. */
export const Traza: React.FC<{ x: number; y: number; w: number; h: number; t: number; valorEn: (tt: number) => number; ventana?: number; color?: string; etiqueta?: string; opacidad?: number }> = ({ x, y, w, h, t, valorEn, ventana = 3.4, color = PC.nervioClaro, etiqueta = "lo que recibe el cerebro", opacidad = 1 }) => {
  const n = 160;
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const tt = t - ventana + (i / n) * ventana;
    const v = tt < 0 ? 0 : valorEn(tt);
    return `${i ? "L" : "M"} ${(x + (i / n) * w).toFixed(1)} ${(y + h - 10 - v * (h - 24)).toFixed(1)}`;
  }).join(" ");
  return (
    <g opacity={opacidad}>
      <rect x={x - 16} y={y - 40} width={w + 32} height={h + 56} rx={22} fill="#08101E" stroke={color} strokeOpacity={0.35} strokeWidth={2} />
      <text x={x} y={y - 12} fontFamily={MONOF} fontWeight={700} fontSize={22} fill={color}>{etiqueta}</text>
      <line x1={x} y1={y + h - 10} x2={x + w} y2={y + h - 10} stroke={PC.hielo} strokeOpacity={0.2} strokeWidth={2} />
      <path d={pts} fill="none" stroke={color} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
};
