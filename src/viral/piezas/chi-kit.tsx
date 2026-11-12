/**
 * Kit de «La ciudad que subió con gatos» (IMNOBA · Chicago, década de 1850 · steampunk industrial · carril B). Todo en vectores, sin imágenes externas.
 * Estilo: grabado de época teñido de sepia, latón, cobre y ladrillo, con engranajes que giran al fondo y vapor que sube; humor de caricatura.
 *   FondoVapor   fondo de taller: degradado café-azul, engranajes lentos, vapor, viñeta y marco de latón
 *   Engranaje    rueda dentada que gira · Humo: bocanada de vapor
 *   Edificio     fachada de ladrillo con ventanas (con personajes y tazas), cornisa, rótulo y puerta; origen = centro de la base
 *   Gato         gato de tornillo (jackscrew): base, rosca que se estira, cabeza y manivela que gira
 *   Obrero       obrero con gorra que gira una manivela · Caballero: figura de sombrero de copa (con bastón, paquete o taza)
 *   Taza         taza de té con vapor (el líquido siempre queda plano)
 *   Globo        globo de diálogo de cómic
 *   Plano        hoja de plano azul con cuadrícula · Pantano: corte de terreno con lago, barro y juncos
 *   Tubo         tubo de cloaca con remaches y gotas que fluyen · Miasma: nube verde de cólera con ojos enojados · Llamas
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeOut, lerp, mezclar, aclarar, oscurecer, useReloj } from "../comun";
import { FONT, MONOF } from "./real-kit";

export const CH = {
  tinta: "#1A1008", cafe: "#2A1B10", cafe2: "#3B2716", crema: "#F3E3C0", papel: "#E9D3A3",
  laton: "#E8B94F", bronce: "#B98A3A", cobre: "#C0642F", ladrillo: "#A9432C", ladrillo2: "#7E2F20",
  verde: "#8FD14F", verdeOsc: "#2F5B22", agua: "#3E8FA3", aguaOsc: "#1F5668", rojo: "#E5432D", azulPlano: "#1D4A7A", hielo: "#CFE8F2",
} as const;

/** Golpe de cámara: escala que cae a 1 con rebote y un temblor (para los «clunk» de cada gato). */
export function sacudida(t: number, ini: number, dur = 0.3, fuerza = 1): { dx: number; dy: number } {
  const k = clamp((t - ini) / dur);
  const tr = (1 - k) * (1 - k) * 7 * fuerza;
  return k >= 1 ? { dx: 0, dy: 0 } : { dx: Math.sin(t * 95) * tr, dy: Math.cos(t * 83) * tr };
}

/** Sacudida de la escalonada `i` más reciente (`n` escalones cada `paso` s desde `t0`). */
export function sacudidaPasos(t: number, t0: number, paso: number, n: number, dur = 0.3, fuerza = 1): { dx: number; dy: number } {
  const i = Math.floor((t - t0) / paso);
  if (i < 0 || i >= n) return { dx: 0, dy: 0 };
  return sacudida(t, t0 + i * paso, dur, fuerza);
}

/** Subida «a golpes»: 0→1 repartido en `n` escalones; cada escalón sube suave en `dur` s a partir de los instantes `t0 + i·paso`. */
export function escalones(t: number, t0: number, paso: number, n: number, dur = 0.45): number {
  let s = 0;
  for (let i = 0; i < n; i++) s += easeOut((t - (t0 + i * paso)) / dur) / n;
  return clamp(s);
}

/* ───────────── fondo de taller ───────────── */

export const Engranaje: React.FC<{ x: number; y: number; r: number; dientes?: number; ang?: number; color?: string; opacidad?: number }> = ({ x, y, r, dientes = 12, ang = 0, color = CH.bronce, opacidad = 1 }) => {
  const pts: string[] = [];
  const n = dientes * 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const alto = i % 4 === 1 || i % 4 === 2;
    const rr = alto ? r : r * 0.82;
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`);
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang})`} opacity={opacidad}>
      <polygon points={pts.join(" ")} fill={color} stroke={oscurecer(color, 0.4)} strokeWidth={3} />
      <circle r={r * 0.55} fill="none" stroke={oscurecer(color, 0.4)} strokeWidth={3} />
      {[0, 60, 120, 180, 240, 300].map((g) => <line key={g} x1={0} y1={0} x2={Math.cos((g * Math.PI) / 180) * r * 0.55} y2={Math.sin((g * Math.PI) / 180) * r * 0.55} stroke={oscurecer(color, 0.4)} strokeWidth={6} />)}
      <circle r={r * 0.14} fill={oscurecer(color, 0.45)} />
    </g>
  );
};

export const Humo: React.FC<{ x: number; y: number; t: number; s?: number; color?: string; n?: number; vel?: number }> = ({ x, y, t, s = 1, color = "#F3EAD8", n = 5, vel = 0.5 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({ length: n }, (_, i) => {
      const q = (t * vel + i / n) % 1;
      return <circle key={i} cx={Math.sin(q * 6 + i * 2) * 14 * q} cy={-q * 120} r={10 + q * 30} fill={color} opacity={0.5 * (1 - q) * clamp(q * 6)} />;
    })}
  </g>
);

export const FondoVapor: React.FC<{ tono?: "cafe" | "verde" | "azul" | "fuego"; children?: React.ReactNode; vel?: number }> = ({ tono = "cafe", children, vel = 1 }) => {
  const { t } = useReloj();
  const uid = useUid();
  const c = { cafe: ["#4A301B", "#2A1A0E", "#120A05"], verde: ["#2C3B1D", "#1A2412", "#0A0F07"], azul: ["#1E3A4A", "#12232E", "#060E14"], fuego: ["#5A2A12", "#33150A", "#120604"] }[tono];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: c[2] }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id={`${uid}b`} cx="50%" cy="42%" r="85%"><stop offset="0" stopColor={c[0]} /><stop offset="0.6" stopColor={c[1]} /><stop offset="1" stopColor={c[2]} /></radialGradient>
          <radialGradient id={`${uid}v`} cx="50%" cy="50%" r="78%"><stop offset="0.5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.7" /></radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}b)`} />
        {/* engranajes lentos de fondo */}
        <Engranaje x={-30} y={300} r={260} dientes={14} ang={t * 6 * vel} color="#6E5126" opacidad={0.22} />
        <Engranaje x={1110} y={420} r={200} dientes={11} ang={-t * 8 * vel + 10} color="#6E5126" opacidad={0.22} />
        <Engranaje x={-20} y={1560} r={210} dientes={12} ang={-t * 7 * vel} color="#6E5126" opacidad={0.2} />
        <Engranaje x={1120} y={1640} r={300} dientes={16} ang={t * 5 * vel} color="#6E5126" opacidad={0.2} />
        {/* vapor que sube */}
        {Array.from({ length: 14 }, (_, i) => {
          const q = (t * 0.045 * vel + azar(i * 3.3)) % 1;
          return <circle key={i} cx={azar(i * 5.1) * W + Math.sin(t * 0.7 + i) * 30} cy={H * (1.1 - q * 1.3)} r={50 + azar(i * 7.7) * 90} fill="#EAD9B5" opacity={0.045 * Math.sin(q * Math.PI)} />;
        })}
        {/* chispas / ceniza */}
        {Array.from({ length: 24 }, (_, i) => {
          const q = (t * (0.05 + azar(i) * 0.06) * vel + azar(i * 9.1)) % 1;
          return <circle key={i} cx={azar(i * 3.7) * W + Math.sin(t + i) * 16} cy={H * (1 - q)} r={1.5 + azar(i * 4.1) * 2.2} fill="#FFD98A" opacity={0.25 * Math.sin(q * Math.PI)} />;
        })}
        <rect width={W} height={H} fill={`url(#${uid}v)`} />
        {/* marco de latón */}
        <rect x={26} y={26} width={W - 52} height={H - 52} rx={18} fill="none" stroke={CH.bronce} strokeWidth={4} opacity={0.55} />
        <rect x={40} y={40} width={W - 80} height={H - 80} rx={12} fill="none" stroke={CH.laton} strokeWidth={1.5} opacity={0.35} />
      </svg>
      {children}
      <div style={{ position: "absolute", inset: 0, background: "#0A0603", opacity: clamp(1 - t / 0.18) * 0.9, pointerEvents: "none" }} />
    </div>
  );
};

/* ───────────── personajes ───────────── */

/** Caballero de sombrero de copa. `pose`: "quieto" | "camina" | "taza" | "bolsa" | "susto". `fase` mueve las piernas y los brazos. Origen: centro de los pies. */
export const Caballero: React.FC<{ x: number; y: number; s?: number; fase?: number; pose?: "quieto" | "camina" | "taza" | "bolsa" | "susto"; abrigo?: string; espejo?: boolean; sombrero?: boolean }> = ({ x, y, s = 1, fase = 0, pose = "quieto", abrigo = "#4B3524", espejo, sombrero = true }) => {
  const paso = pose === "camina" ? Math.sin(fase) * 12 : 0;
  const brazoAng = pose === "susto" ? -150 : pose === "taza" ? -70 : pose === "camina" ? Math.sin(fase) * 22 : 6;
  return (
    <g transform={`translate(${x} ${y}) scale(${(espejo ? -1 : 1) * s} ${s})`}>
      <ellipse cx={0} cy={2} rx={30} ry={6} fill="#000" opacity={0.3} />
      <line x1={-8} y1={-52} x2={-8 - paso} y2={-2} stroke="#1B120B" strokeWidth={11} strokeLinecap="round" />
      <line x1={8} y1={-52} x2={8 + paso} y2={-2} stroke="#1B120B" strokeWidth={11} strokeLinecap="round" />
      <rect x={-22} y={-120} width={44} height={74} rx={14} fill={abrigo} stroke={oscurecer(abrigo, 0.4)} strokeWidth={3} />
      <polygon points="0,-120 8,-100 0,-84 -8,-100" fill="#F3E3C0" />
      <g transform={`translate(20 -108) rotate(${brazoAng})`}>
        <line x1={0} y1={0} x2={0} y2={44} stroke={abrigo} strokeWidth={11} strokeLinecap="round" />
        <circle cx={0} cy={46} r={6} fill="#E9C9A0" />
        {pose === "taza" && <g transform="translate(0 40)"><ellipse cx={0} cy={0} rx={13} ry={4} fill="#F3E3C0" /><path d="M -11 0 L -8 14 L 8 14 L 11 0 Z" fill="#F3E3C0" stroke="#B98A3A" strokeWidth={2} /></g>}
        {pose === "bolsa" && <rect x={-14} y={42} width={28} height={30} rx={4} fill="#8B5E34" stroke="#4D3219" strokeWidth={2} />}
      </g>
      <line x1={-20} y1={-108} x2={-26} y2={-62} stroke={abrigo} strokeWidth={11} strokeLinecap="round" />
      <circle cx={0} cy={-142} r={22} fill="#EBCDA6" stroke="#8B6A44" strokeWidth={2} />
      <path d="M -8 -134 Q 0 -128 8 -134" fill="none" stroke="#3B2716" strokeWidth={5} strokeLinecap="round" />
      <circle cx={-8} cy={-146} r={2.6} fill="#1A1008" /><circle cx={8} cy={-146} r={2.6} fill="#1A1008" />
      {sombrero && <g><rect x={-30} y={-162} width={60} height={9} rx={3} fill="#15100B" /><rect x={-19} y={-204} width={38} height={46} rx={4} fill="#15100B" /><rect x={-19} y={-172} width={38} height={7} fill={CH.laton} /></g>}
    </g>
  );
};

/** Obrero con gorra y manivela: gira la manivela con `giro` (grados). Origen: centro de los pies; la manivela queda delante (a la derecha). */
export const Obrero: React.FC<{ x: number; y: number; s?: number; giro?: number; camisa?: string; espejo?: boolean; esfuerzo?: number }> = ({ x, y, s = 1, giro = 0, camisa = "#7B8F9C", espejo, esfuerzo = 0 }) => {
  const rad = (giro * Math.PI) / 180;
  const mx = 40 + Math.cos(rad) * 18, my = -70 + Math.sin(rad) * 18;
  return (
    <g transform={`translate(${x} ${y}) scale(${(espejo ? -1 : 1) * s} ${s})`}>
      <ellipse cx={0} cy={2} rx={30} ry={6} fill="#000" opacity={0.3} />
      <line x1={-8} y1={-46} x2={-14} y2={-2} stroke="#2B2118" strokeWidth={11} strokeLinecap="round" />
      <line x1={8} y1={-46} x2={14} y2={-2} stroke="#2B2118" strokeWidth={11} strokeLinecap="round" />
      <g transform={`rotate(${12 + esfuerzo * 6} 0 -46)`}>
        <rect x={-20} y={-112} width={40} height={68} rx={13} fill={camisa} stroke={oscurecer(camisa, 0.4)} strokeWidth={3} />
        <rect x={-20} y={-72} width={40} height={8} fill="#5A3B22" />
        <line x1={14} y1={-100} x2={mx} y2={my} stroke={camisa} strokeWidth={10} strokeLinecap="round" />
        <circle cx={mx} cy={my} r={6} fill="#E9C9A0" />
        <circle cx={0} cy={-132} r={20} fill="#EBCDA6" stroke="#8B6A44" strokeWidth={2} />
        <circle cx={7} cy={-134} r={2.6} fill="#1A1008" />
        <path d="M -10 -146 Q 0 -160 14 -146 L 22 -146 L 22 -140 L -14 -140 Z" fill="#35404A" stroke="#1B2128" strokeWidth={2} />
        {esfuerzo > 0.4 && <path d={`M 22 -150 q 6 8 0 14`} fill="none" stroke="#9AD8F2" strokeWidth={3} strokeLinecap="round" opacity={0.8} />}
      </g>
    </g>
  );
};

/* ───────────── gato de tornillo ───────────── */

/** Gato de tornillo (jackscrew) en vista lateral. Origen = centro de la base; `ext` = px que sube el tornillo; `giro` = grados de la manivela. La cabeza queda a `98 + h0 + ext` px sobre la base. */
export const Gato: React.FC<{ x: number; y: number; s?: number; ext?: number; giro?: number; color?: string; manivela?: boolean; h0?: number }> = ({ x, y, s = 1, ext = 0, giro = 0, color = CH.laton, manivela = true, h0 = 0 }) => {
  const rad = (giro * Math.PI) / 180;
  const L = h0 + ext;
  const off = ((giro / 360) * 9) % 9;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-46} y={-14} width={92} height={14} rx={3} fill="#4E3B27" stroke="#241810" strokeWidth={2} />
      <rect x={-24} y={-70} width={48} height={58} rx={6} fill={mezclar(color, "#2A1A0E", 0.25)} stroke="#2A1A0E" strokeWidth={3} />
      {L > 0 && <rect x={-12} y={-84 - L} width={24} height={L} fill="#B9B3A6" stroke="#2A1A0E" strokeWidth={2.5} />}
      {Array.from({ length: Math.floor(L / 9) + 1 }, (_, i) => {
        const yy = -84 - i * 9 - off;
        if (yy < -84 - L + 1 || yy > -84) return null;
        return <line key={i} x1={-12} y1={yy} x2={12} y2={yy - 4.5} stroke="#5E584D" strokeWidth={2.2} />;
      })}
      <rect x={-34} y={-84} width={68} height={18} rx={5} fill={color} stroke="#2A1A0E" strokeWidth={3} />
      <rect x={-30} y={-84 - L - 14} width={60} height={14} rx={4} fill={color} stroke="#2A1A0E" strokeWidth={3} />
      {manivela && (
        <g transform="translate(0 -40)">
          <circle cx={0} cy={0} r={11} fill="#7C5A2A" stroke="#2A1A0E" strokeWidth={2.5} />
          <line x1={0} y1={0} x2={Math.cos(rad) * 54} y2={Math.sin(rad) * 18} stroke="#6B4A24" strokeWidth={9} strokeLinecap="round" />
          <circle cx={Math.cos(rad) * 54} cy={Math.sin(rad) * 18} r={7} fill={CH.laton} stroke="#2A1A0E" strokeWidth={2} />
        </g>
      )}
    </g>
  );
};

/* ───────────── objetos ───────────── */

/** Taza de té con plato y vapor; el líquido siempre queda plano (aunque el edificio suba). Origen = centro de la base del plato. */
export const Taza: React.FC<{ x: number; y: number; s?: number; t?: number; vapor?: boolean; color?: string }> = ({ x, y, s = 1, t = 0, vapor = true, color = CH.crema }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={-2} rx={30} ry={6} fill={color} stroke="#7A5C2E" strokeWidth={2} />
    <path d="M -20 -4 L -16 -34 L 16 -34 L 20 -4 Z" fill={color} stroke="#7A5C2E" strokeWidth={2} />
    <ellipse cx={0} cy={-34} rx={16} ry={4.5} fill="#7B4B22" stroke="#7A5C2E" strokeWidth={1.5} />
    <path d="M 17 -28 q 14 0 12 10 q -2 8 -12 6" fill="none" stroke="#7A5C2E" strokeWidth={3} />
    {vapor && Array.from({ length: 3 }, (_, i) => {
      const q = (t * 0.7 + i / 3) % 1;
      return <path key={i} d={`M ${-6 + i * 6} ${-40 - q * 34} q 5 -8 0 -14`} fill="none" stroke="#FFF" strokeWidth={3} strokeLinecap="round" opacity={0.7 * (1 - q)} />;
    })}
  </g>
);

/** Globo de diálogo de cómic. (x, y) = punta de la cola; el globo se abre hacia arriba. */
export const Globo: React.FC<{ x: number; y: number; texto: string; ancho?: number; k?: number; lado?: "izq" | "der"; px?: number; id?: string }> = ({ x, y, texto, ancho = 360, k = 1, lado = "izq", px = 30, id = "globo" }) => {
  const alto = px * 1.35 * Math.ceil((texto.length * px * 0.55) / (ancho - 40)) + 36;
  const bx = lado === "izq" ? x - 40 : x - ancho + 40;
  const by = y - 40 - alto;
  return (
    <g opacity={clamp(k * 2)} transform={`translate(${x} ${y}) scale(${0.85 + 0.15 * easeOut(k)}) translate(${-x} ${-y})`}>
      <path d={`M ${x} ${y} L ${x + (lado === "izq" ? 10 : -10)} ${by + alto - 6} L ${x + (lado === "izq" ? 44 : -44)} ${by + alto - 6} Z`} fill={CH.crema} stroke={CH.tinta} strokeWidth={4} strokeLinejoin="round" />
      <rect x={bx} y={by} width={ancho} height={alto} rx={22} fill={CH.crema} stroke={CH.tinta} strokeWidth={4} />
      <rect x={x + (lado === "izq" ? 12 : -42)} y={by + alto - 8} width={28} height={10} fill={CH.crema} />
      <foreignObject x={bx + 12} y={by + 4} width={ancho - 24} height={alto - 8}>
        <div data-texto={id} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: px, lineHeight: 1.15, color: CH.tinta }}>{texto}</div>
      </foreignObject>
    </g>
  );
};

/** Onomatopeya de cómic (texto grande que rebota). */
export const Onoma: React.FC<{ x: number; y: number; texto: string; k?: number; color?: string; px?: number; rot?: number; id?: string }> = ({ x, y, texto, k = 1, color = CH.laton, px = 64, rot = -8, id = "onoma" }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${0.6 + 0.4 * easeOut(k) + 0.08 * Math.sin(k * 20) * (1 - clamp(k))})`} opacity={clamp(k * 3)}>
    <text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={px} fill={color} stroke={CH.tinta} strokeWidth={10} paintOrder="stroke" strokeLinejoin="round" data-texto={id}>{texto}</text>
  </g>
);

/* ───────────── edificio de ladrillo ───────────── */

export type VentanaDef = { quien?: "dama" | "mozo" | "caballero" | "gato" | "nadie"; luz?: boolean };

/** Fachada de ladrillo. Origen = centro de la base. `pisos` filas de ventanas (3 columnas); `ventanas[i]` describe la ventana i (de abajo arriba, izq. a der., la planta baja es tienda con puerta). */
export const Edificio: React.FC<{ x: number; y: number; w?: number; pisos?: number; pisoH?: number; ladrillo?: string; rotulo?: string; abierto?: boolean; ventanas?: VentanaDef[]; t?: number; sinPuerta?: boolean; cornisa?: string; vs?: number }> = ({ x, y, w = 440, pisos = 3, pisoH = 150, ladrillo = CH.ladrillo, rotulo, abierto, ventanas = [], t = 0, sinPuerta, cornisa = CH.crema, vs = 1 }) => {
  const uid = useUid();
  const h = pisos * pisoH + 36;
  const cols = 3;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <pattern id={`${uid}p`} width="44" height="22" patternUnits="userSpaceOnUse"><rect width="44" height="22" fill={ladrillo} /><path d="M0 0H44M0 11H44M0 22H44M0 0V11M22 11V22" stroke={oscurecer(ladrillo, 0.45)} strokeWidth="1.6" fill="none" /></pattern>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#000" stopOpacity="0.28" /><stop offset="0.35" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.4" /></linearGradient>
      </defs>
      <rect x={-w / 2} y={-h} width={w} height={h} fill={`url(#${uid}p)`} stroke={oscurecer(ladrillo, 0.55)} strokeWidth={4} />
      <rect x={-w / 2} y={-h} width={w} height={h} fill={`url(#${uid}s)`} />
      {/* cornisa y base */}
      <rect x={-w / 2 - 12} y={-h - 18} width={w + 24} height={22} rx={3} fill={cornisa} stroke="#7A5C2E" strokeWidth={3} />
      <rect x={-w / 2 - 8} y={-14} width={w + 16} height={14} fill="#7B6B55" stroke="#3B2E22" strokeWidth={3} />
      {/* pisos */}
      {Array.from({ length: pisos }, (_, p) => {
        const yy = -36 - p * pisoH - pisoH * 0.52;
        return Array.from({ length: cols }, (_, c) => {
          const cx = (c - 1) * (w / 3.4);
          const idx = p * cols + c;
          const v = ventanas[idx];
          const planta = p === 0 && !sinPuerta;
          if (planta && c === 1) {
            return (
              <g key={`${p}${c}`} transform={`translate(${cx} ${-14})`}>
                <rect x={-34} y={-104} width={68} height={104} rx={6} fill="#4A2F18" stroke="#2A1A0E" strokeWidth={3} />
                <rect x={-26} y={-96} width={52} height={50} rx={4} fill="#9CD6E6" opacity={0.55} />
                <circle cx={22} cy={-44} r={4} fill={CH.laton} />
                {abierto && <g transform="translate(0 -122)"><rect x={-44} y={-18} width={88} height={30} rx={5} fill={CH.laton} stroke="#2A1A0E" strokeWidth={3} /><text x={0} y={5} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={21} fill="#2A1A0E" data-texto="abierto">ABIERTO</text></g>}
              </g>
            );
          }
          return <Ventana key={`${p}${c}`} x={cx} y={yy} v={v} t={t} seed={idx} vs={vs} />;
        });
      })}
      {rotulo && (
        <g transform={`translate(0 ${-h - 46})`}>
          <rect x={-w / 2 + 40} y={-28} width={w - 80} height={44} rx={8} fill="#1A1008" stroke={CH.laton} strokeWidth={3} />
          <text x={0} y={5} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} letterSpacing={4} fill={CH.laton} data-texto="rotulo-edificio">{rotulo}</text>
        </g>
      )}
    </g>
  );
};

const Ventana: React.FC<{ x: number; y: number; v?: VentanaDef; t: number; seed: number; vs?: number }> = ({ x, y, v, t, seed, vs = 1 }) => {
  const luz = v?.luz ?? azar(seed * 3.3) < 0.7;
  const quien = v?.quien ?? "nadie";
  return (
    <g transform={`translate(${x} ${y}) scale(${vs})`}>
      <rect x={-46} y={-52} width={92} height={104} rx={8} fill="#33261A" stroke={CH.crema} strokeWidth={5} />
      <rect x={-40} y={-46} width={80} height={92} rx={5} fill={luz ? "#FFD98A" : "#1D2630"} />
      {luz && <rect x={-40} y={-46} width={80} height={92} rx={5} fill="#FFF2C4" opacity={0.25 + 0.1 * Math.sin(t * 4 + seed)} />}
      {quien === "dama" && (
        <g>
          <circle cx={-8} cy={6} r={12} fill="#EBCDA6" /><path d="M -20 0 Q -8 -22 8 -2 L 8 -10 Q -8 -30 -22 -6 Z" fill="#7A3B2E" /><rect x={-22} y={16} width={30} height={30} rx={10} fill="#A04A55" />
          <Taza x={22} y={44} s={0.55} t={t + seed} />
        </g>
      )}
      {quien === "mozo" && (
        <g>
          <circle cx={0} cy={4} r={12} fill="#EBCDA6" /><rect x={-14} y={16} width={28} height={30} rx={8} fill="#F6F2E8" />
          <rect x={-22 + Math.sin(t * 5 + seed) * 2} y={20} width={44} height={5} rx={2} fill={CH.bronce} />
          <Taza x={-12} y={20} s={0.4} vapor={false} /><Taza x={12} y={20} s={0.4} vapor={false} />
        </g>
      )}
      {quien === "caballero" && (
        <g>
          <circle cx={0} cy={4} r={12} fill="#EBCDA6" /><path d="M -10 14 Q 0 20 10 14" stroke="#3B2716" strokeWidth={4} fill="none" strokeLinecap="round" /><rect x={-16} y={16} width={32} height={30} rx={10} fill="#4B3524" />
          <rect x={-16} y={-4} width={32} height={8} rx={2} fill="#15100B" /><rect x={-10} y={-24} width={20} height={22} fill="#15100B" />
        </g>
      )}
      {quien === "gato" && (
        <g transform="translate(0 40)">
          <ellipse cx={0} cy={-8} rx={20} ry={13} fill="#C68642" /><circle cx={-14} cy={-18} r={9} fill="#C68642" /><polygon points="-21,-24 -18,-33 -13,-25" fill="#C68642" /><polygon points="-13,-25 -9,-32 -6,-23" fill="#C68642" />
          <path d={`M 16 -8 q 14 ${-8 + Math.sin(t * 3) * 4} 10 -22`} stroke="#C68642" strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>
      )}
      <line x1={0} y1={-52} x2={0} y2={52} stroke={CH.crema} strokeWidth={4} /><line x1={-46} y1={0} x2={46} y2={0} stroke={CH.crema} strokeWidth={4} />
    </g>
  );
};

/* ───────────── terreno, plano, tubos ───────────── */

/** Corte de terreno: lago a la derecha, tierra con barro y juncos a la izquierda. `nivel` = y de la superficie del lago (y de la calle = nivel − `alto`). */
export const Pantano: React.FC<{ x0?: number; x1?: number; nivel: number; alto?: number; t?: number; fondo?: number }> = ({ x0 = 0, x1 = W, nivel, alto = 22, t = 0, fondo = H }) => {
  const uid = useUid();
  const xl = lerp(x0, x1, 0.62);
  const ys = nivel - alto;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}a`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4BA6BA" /><stop offset="1" stopColor={CH.aguaOsc} /></linearGradient>
        <linearGradient id={`${uid}m`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6B5230" /><stop offset="0.35" stopColor="#4A3720" /><stop offset="1" stopColor="#24180D" /></linearGradient>
      </defs>
      <rect x={xl} y={nivel} width={x1 - xl} height={fondo - nivel} fill={`url(#${uid}a)`} />
      <path d={`M ${xl} ${nivel} ${Array.from({ length: 12 }, (_, i) => `L ${xl + (i + 1) * ((x1 - xl) / 12)} ${nivel + Math.sin(t * 2 + i) * 4}`).join(" ")}`} fill="none" stroke="#CFEFF7" strokeWidth={4} opacity={0.8} />
      <path d={`M ${x0} ${ys} L ${xl - 40} ${ys} Q ${xl} ${ys} ${xl + 10} ${nivel + 16} L ${xl + 20} ${fondo} L ${x0} ${fondo} Z`} fill={`url(#${uid}m)`} stroke="#1A1008" strokeWidth={3} />
      {/* charcos y burbujas */}
      {[0.12, 0.32, 0.5].map((u, i) => <ellipse key={i} cx={lerp(x0, xl, u)} cy={ys + 6} rx={60 + i * 16} ry={8} fill="#5C7F66" opacity={0.8} />)}
      {Array.from({ length: 9 }, (_, i) => {
        const q = (t * 0.4 + azar(i * 3.3)) % 1;
        return <circle key={i} cx={lerp(x0 + 40, xl - 60, azar(i * 7.1))} cy={ys + 70 + azar(i * 5.3) * 200 - q * 30} r={3 + q * 6} fill="#9AB89A" opacity={0.5 * (1 - q)} />;
      })}
      {/* juncos */}
      {Array.from({ length: 7 }, (_, i) => {
        const cx = lerp(x0 + 60, xl - 20, i / 6);
        const sw = Math.sin(t * 1.5 + i * 1.7) * 8;
        return <g key={i}><path d={`M ${cx} ${ys + 4} q ${sw} -50 ${sw * 1.4} -90`} stroke="#5E7A2C" strokeWidth={5} fill="none" /><ellipse cx={cx + sw * 1.4} cy={ys - 98} rx={6} ry={17} fill="#7B4A22" /></g>;
      })}
    </g>
  );
};

/** Hoja de plano azul con cuadrícula. */
export const Plano: React.FC<{ x: number; y: number; w: number; h: number; k?: number; rot?: number }> = ({ x, y, w, h, k = 1, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${0.9 + 0.1 * easeOut(k)})`} opacity={clamp(k * 2)}>
    <rect x={-w / 2 + 10} y={-h / 2 + 12} width={w} height={h} rx={10} fill="#000" opacity={0.35} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={CH.azulPlano} stroke={CH.hielo} strokeWidth={4} />
    {Array.from({ length: Math.floor(w / 40) }, (_, i) => <line key={`v${i}`} x1={-w / 2 + 20 + i * 40} y1={-h / 2 + 8} x2={-w / 2 + 20 + i * 40} y2={h / 2 - 8} stroke={CH.hielo} strokeWidth={1} opacity={0.18} />)}
    {Array.from({ length: Math.floor(h / 40) }, (_, i) => <line key={`h${i}`} x1={-w / 2 + 8} y1={-h / 2 + 20 + i * 40} x2={w / 2 - 8} y2={-h / 2 + 20 + i * 40} stroke={CH.hielo} strokeWidth={1} opacity={0.18} />)}
  </g>
);

/** Tubo de cloaca de A a B con remaches; las gotas fluyen de A a B (`flujo` 0–1 = cuánto avanza el agua; `fluye` falso = gotas que burbujean en el mismo lugar). */
export const Tubo: React.FC<{ x1: number; y1: number; x2: number; y2: number; grosor?: number; t?: number; fluye?: boolean; color?: string }> = ({ x1, y1, x2, y2, grosor = 54, t = 0, fluye = true, color = CH.cobre }) => {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <g transform={`translate(${x1} ${y1}) rotate(${ang})`}>
      <rect x={-8} y={-grosor / 2} width={L + 16} height={grosor} rx={grosor / 2} fill={color} stroke={oscurecer(color, 0.5)} strokeWidth={4} />
      <rect x={4} y={-grosor / 2 + 6} width={L - 8} height={grosor * 0.22} rx={5} fill={aclarar(color, 0.35)} opacity={0.6} />
      {Array.from({ length: Math.floor(L / 90) + 1 }, (_, i) => <g key={i}><line x1={i * 90} y1={-grosor / 2} x2={i * 90} y2={grosor / 2} stroke={oscurecer(color, 0.5)} strokeWidth={5} /><circle cx={i * 90} cy={-grosor / 2 + 8} r={3.5} fill={aclarar(color, 0.5)} /><circle cx={i * 90} cy={grosor / 2 - 8} r={3.5} fill={aclarar(color, 0.5)} /></g>)}
      {Array.from({ length: Math.floor(L / 60) }, (_, i) => {
        const q = fluye ? (t * 0.5 + i / Math.floor(L / 60)) % 1 : 0;
        const gx = fluye ? 10 + q * (L - 20) : 10 + (i / Math.floor(L / 60)) * (L - 20);
        const gy = fluye ? Math.sin(i * 2.1) * 6 : Math.sin(t * 3 + i * 1.9) * 7;
        return <circle key={i} cx={gx} cy={gy} r={7} fill="#8FD0E0" stroke="#2A6A80" strokeWidth={2} opacity={0.9} />;
      })}
    </g>
  );
};

/** Nube verde del cólera (miasma): lóbulos que ondulan, dos ojos enojados. Origen = centro. */
export const Miasma: React.FC<{ x: number; y: number; s?: number; t?: number; ojos?: boolean }> = ({ x, y, s = 1, t = 0, ojos = true }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2;
      const r = 120 + Math.sin(t * 1.6 + i * 1.3) * 16;
      return <circle key={i} cx={Math.cos(a) * r * 0.85} cy={Math.sin(a) * r * 0.6} r={92 + azar(i * 3.1) * 40 + Math.sin(t * 2 + i) * 6} fill="#6FA83A" opacity={0.62} />;
    })}
    <ellipse cx={0} cy={0} rx={150} ry={100} fill="#4F8A2B" opacity={0.75} />
    {ojos && (
      <g>
        <ellipse cx={-52} cy={-14} rx={26} ry={20} fill="#F5F7E0" /><ellipse cx={52} cy={-14} rx={26} ry={20} fill="#F5F7E0" />
        <circle cx={-46 + Math.sin(t * 2) * 4} cy={-8} r={9} fill="#1A2A0E" /><circle cx={58 + Math.sin(t * 2) * 4} cy={-8} r={9} fill="#1A2A0E" />
        <line x1={-84} y1={-46} x2={-24} y2={-30} stroke="#1A2A0E" strokeWidth={9} strokeLinecap="round" /><line x1={84} y1={-46} x2={24} y2={-30} stroke="#1A2A0E" strokeWidth={9} strokeLinecap="round" />
        <path d="M -44 44 Q 0 22 44 44" stroke="#1A2A0E" strokeWidth={9} fill="none" strokeLinecap="round" />
      </g>
    )}
  </g>
);

/** Llamas animadas que suben desde la línea de base. Origen = centro de la base. */
export const Llamas: React.FC<{ x: number; y: number; w: number; alto?: number; t?: number; k?: number }> = ({ x, y, w, alto = 160, t = 0, k = 1 }) => (
  <g transform={`translate(${x} ${y})`} opacity={clamp(k * 2)}>
    {Array.from({ length: Math.max(3, Math.floor(w / 34)) }, (_, i) => {
      const nn = Math.max(3, Math.floor(w / 34));
      const cx = -w / 2 + (i + 0.5) * (w / nn);
      const hh = alto * k * (0.55 + 0.45 * Math.abs(Math.sin(t * 6 + i * 1.7))) * (0.7 + azar(i * 3.9) * 0.5);
      const ww = (w / nn) * 0.9;
      return (
        <g key={i}>
          <path d={`M ${cx - ww / 2} 0 Q ${cx - ww / 2 - 6} ${-hh * 0.5} ${cx + Math.sin(t * 8 + i) * 8} ${-hh} Q ${cx + ww / 2 + 6} ${-hh * 0.5} ${cx + ww / 2} 0 Z`} fill="#E5432D" />
          <path d={`M ${cx - ww / 3} 0 Q ${cx - ww / 3} ${-hh * 0.4} ${cx + Math.sin(t * 8 + i) * 5} ${-hh * 0.72} Q ${cx + ww / 3} ${-hh * 0.4} ${cx + ww / 3} 0 Z`} fill="#FFB020" />
          <path d={`M ${cx - ww / 6} 0 Q ${cx - ww / 6} ${-hh * 0.25} ${cx} ${-hh * 0.42} Q ${cx + ww / 6} ${-hh * 0.25} ${cx + ww / 6} 0 Z`} fill="#FFF0B0" />
        </g>
      );
    })}
  </g>
);

/** Plataforma de madera (viga) sobre la que se apoya un edificio. */
export const Viga: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-w / 2} y={-18} width={w} height={18} fill="#8A6234" stroke="#3B2512" strokeWidth={3} />
    {Array.from({ length: Math.floor(w / 70) }, (_, i) => <line key={i} x1={-w / 2 + 14 + i * 70} y1={-14} x2={-w / 2 + 40 + i * 70} y2={-14} stroke="#5A3F20" strokeWidth={2.5} />)}
  </g>
);

export { H, W };
