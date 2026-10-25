/**
 * Kit de «figuras realistas» (carril B, v3): objetos dibujados como renders —degradados de volumen, vidrios con reflejos, luces con resplandor,
 * sombra de contacto y reflejo en el piso— sobre un estudio azul marino como el de los videos de «¿sabías que?».
 * Todo en vectores (SVG), sin imágenes externas. Origen de cada objeto: centro de su base, apoyado en el piso (y negativa = hacia arriba).
 * Piezas: Estudio (fondo + piso + partículas), Reflejo, Frases (rótulos grandes que cambian palabra a palabra), BusArticulado, TrenMetro, Auto,
 * Torre, Cronometro, Semaforo, Persona, Monedas, Riel, Viaducto, Cota.
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeOut, lerp, mezclar, oscurecer, aclarar, spr, useReloj } from "../comun";

export const RE = {
  navy0: "#050A12",
  navy1: "#0B1828",
  navy2: "#14344F",
  suelo: "#1D4260",
  blanco: "#F5F7FA",
  rojo: "#F04124",
  oro: "#FFC500",
  esmeralda: "#10B981",
  azul: "#4C7DFF",
  hielo: "#BFE0FF",
} as const;
export const FONT = "Inter, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
export const MONOF = "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace";

/* ───────────── escenario ───────────── */

/** Estudio: degradado azul marino, resplandor detrás del objeto, línea de piso, partículas que flotan y arcos de luz tenues. Cubre todo el cuadro. */
export const Estudio: React.FC<{ piso?: number; resplandor?: number; centroX?: number; children?: React.ReactNode; particulas?: number }> = ({ piso = 1240, resplandor = 0.4, centroX = W / 2, children, particulas = 70 }) => {
  const { t } = useReloj();
  const uid = useUid();
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: RE.navy1 }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`${uid}bg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={RE.navy0} />
            <stop offset={0.3} stopColor="#08121F" />
            <stop offset={Math.max(0.35, piso / H - 0.02)} stopColor="#0F2338" />
            <stop offset={piso / H} stopColor={RE.suelo} />
            <stop offset={Math.min(1, piso / H + 0.12)} stopColor="#102A40" />
            <stop offset="1" stopColor="#07101B" />
          </linearGradient>
          <radialGradient id={`${uid}gl`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#3B7FB5" stopOpacity={resplandor} /><stop offset="1" stopColor="#3B7FB5" stopOpacity="0" /></radialGradient>
          <linearGradient id={`${uid}hz`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.5" stopColor="#CFE8FF" stopOpacity="0.42" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
          <radialGradient id={`${uid}vg`} cx="50%" cy="46%" r="78%"><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.5" /></radialGradient>
          <filter id={`${uid}bl`} x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="22" /></filter>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}bg)`} />
        <ellipse cx={centroX} cy={piso - 260} rx={620} ry={420} fill={`url(#${uid}gl)`} />
        {/* arcos de luz */}
        {[430, 540, 660].map((r, i) => <ellipse key={i} cx={centroX} cy={piso - 230} rx={r} ry={r * 0.62} fill="none" stroke="#9CCBFF" strokeOpacity={0.05 + 0.02 * i} strokeWidth={2} strokeDasharray={i === 1 ? "2 22" : "none"} />)}
        <rect x={0} y={piso} width={W} height={2.5} fill={`url(#${uid}hz)`} />
        <ellipse cx={centroX} cy={piso + 70} rx={640} ry={46} fill="#9CCBFF" opacity={0.07} filter={`url(#${uid}bl)`} />
        {Array.from({ length: particulas }, (_, i) => {
          const x = (azar(i * 3.1) * W + t * (6 + azar(i) * 10)) % W;
          const y = (azar(i * 5.7 + 1) * H - t * (3 + azar(i * 2) * 8) + H * 4) % H;
          return <circle key={i} cx={x} cy={y} r={0.8 + azar(i * 9.3) * 1.8} fill="#DDEBFF" opacity={0.08 + 0.3 * azar(i * 7.7) * (0.6 + 0.4 * Math.sin(t * 1.4 + i))} />;
        })}
        <rect width={W} height={H} fill={`url(#${uid}vg)`} />
      </svg>
      {children}
      {/* entrada suave: un fundido desde el negro de 0,25 s en cada corte */}
      <div style={{ position: "absolute", inset: 0, background: "#02060C", opacity: clamp(1 - t / 0.25) * 0.85, pointerEvents: "none" }} />
    </div>
  );
};

/** Reflejo en el piso: copia espejada del grupo con un degradado que se desvanece hacia abajo. Va DENTRO de un <svg>. */
export const Reflejo: React.FC<{ piso: number; alto?: number; intensidad?: number; children: React.ReactNode }> = ({ piso, alto = 190, intensidad = 0.26, children }) => {
  const uid = useUid();
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}rg`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity={intensidad} /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <mask id={`${uid}rm`} maskUnits="userSpaceOnUse" x={0} y={piso} width={W} height={alto}><rect x={0} y={piso} width={W} height={alto} fill={`url(#${uid}rg)`} /></mask>
      </defs>
      <g id={`${uid}obj`}>{children}</g>
      <g mask={`url(#${uid}rm)`}><use href={`#${uid}obj`} transform={`translate(0 ${2 * piso}) scale(1 -1)`} /></g>
    </g>
  );
};

/** Sombra de contacto: elipse oscura y borrosa bajo un objeto. */
export const Sombra: React.FC<{ x: number; y: number; rx: number; ry?: number; opacidad?: number }> = ({ x, y, rx, ry = rx * 0.07, opacidad = 0.6 }) => {
  const uid = useUid();
  return (
    <g>
      <defs><filter id={`${uid}s`} x="-30%" y="-300%" width="160%" height="700%"><feGaussianBlur stdDeviation={Math.max(4, ry * 0.7)} /></filter></defs>
      <ellipse cx={x} cy={y + ry * 0.5} rx={rx} ry={ry} fill="#000" opacity={opacidad} filter={`url(#${uid}s)`} />
    </g>
  );
};

/** Rótulo grande que va cambiando de frase (como los de los videos de «¿sabías que?»): cada frase dura hasta la siguiente y entra con un golpe suave. */
export const Frases: React.FC<{ frases: { t: number; texto: string; color?: string; px?: number }[]; y?: number; x?: number; ancho?: number; alinear?: "left" | "center"; id?: string }> = ({ frases, y = 400, x = 104, ancho = 880, alinear = "left", id = "frases" }) => {
  const { f, t, a } = useReloj();
  let i = -1;
  frases.forEach((p, k) => { if (t >= a(p.t)) i = k; });
  if (i < 0) return null;
  const p = frases[i];
  const s = spr(f, a(p.t), { damping: 12, stiffness: 190, mass: 0.6 });
  const px = p.px ?? 104;
  return (
    <div data-texto={id} style={{ position: "absolute", left: alinear === "left" ? x : x - ancho / 2, top: y, width: ancho, transform: `translateY(-50%) translateY(${(1 - s) * 26}px) scale(${0.92 + 0.08 * s})`, transformOrigin: alinear === "left" ? "0% 50%" : "50% 50%", opacity: clamp(s * 2.2), fontFamily: FONT, fontWeight: 800, fontSize: px, lineHeight: 1.04, letterSpacing: "-0.03em", color: p.color ?? RE.blanco, textAlign: alinear, textShadow: "0 8px 40px rgba(0,0,0,0.55)", whiteSpace: "pre" }}>
      {p.texto}
    </div>
  );
};

/* ───────────── figuras ───────────── */

type Tr = { x: number; y: number; s?: number; espejo?: boolean };
const T = ({ x, y, s = 1, espejo }: Tr): string => `translate(${x} ${y}) scale(${espejo ? -s : s} ${s})`;

/** Rueda con neumático, llanta metálica y radios que giran con `rot` (grados). */
const Rueda: React.FC<{ cx: number; cy: number; r: number; rot?: number }> = ({ cx, cy, r, rot = 0 }) => {
  const uid = useUid();
  return (
    <g>
      <defs><radialGradient id={`${uid}r`} cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#E8EEF4" /><stop offset="0.6" stopColor="#7C8995" /><stop offset="1" stopColor="#363E47" /></radialGradient></defs>
      <circle cx={cx} cy={cy} r={r} fill="#08090B" />
      <circle cx={cx} cy={cy} r={r * 0.97} fill="none" stroke="#2A2E34" strokeWidth={r * 0.06} />
      <circle cx={cx} cy={cy} r={r * 0.62} fill={`url(#${uid}r)`} />
      <g transform={`rotate(${rot} ${cx} ${cy})`} stroke="#1B2128" strokeWidth={r * 0.07} strokeLinecap="round">
        {[0, 72, 144, 216, 288].map((g) => <line key={g} x1={cx} y1={cy} x2={cx + Math.cos((g * Math.PI) / 180) * r * 0.55} y2={cy + Math.sin((g * Math.PI) / 180) * r * 0.55} />)}
      </g>
      <circle cx={cx} cy={cy} r={r * 0.14} fill="#1B2128" />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke="#fff" strokeOpacity={0.22} strokeWidth={r * 0.04} />
    </g>
  );
};

/** Cabezas y hombros de pasajeros vistos por la ventana (siluetas con luz de borde). */
const Pasajeros: React.FC<{ x0: number; x1: number; y: number; n: number; semilla?: number; escala?: number }> = ({ x0, x1, y, n, semilla = 1, escala = 1 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const x = lerp(x0, x1, (i + 0.5 + (azar(i * 3.3 + semilla) - 0.5) * 0.5) / n);
      const alto = (azar(i * 5.1 + semilla) * 6 - 3) * escala;
      const tono = azar(i * 7.9 + semilla);
      return (
        <g key={i} transform={`translate(${x} ${y + alto}) scale(${escala})`}>
          <path d="M -15,26 C -15,6 -9,0 0,0 C 9,0 15,6 15,26 Z" fill={mezclar("#14283C", "#3A546E", tono * 0.5)} stroke="#9CC3E8" strokeOpacity={0.55} strokeWidth={1.2} />
          <circle cx={0} cy={-9} r={9} fill={mezclar("#182E44", "#43607C", tono * 0.45)} stroke="#9CC3E8" strokeOpacity={0.6} strokeWidth={1.2} />
        </g>
      );
    })}
  </g>
);

/**
 * Bus articulado rojo (módulo trasero + fuelle + módulo delantero), visto de lado y mirando a la derecha.
 * `pasajeros` = cuántas siluetas asoman por las ventanas; `freno` 0–1 = luz de freno; `rot` = giro de las ruedas.
 */
export const BusArticulado: React.FC<{ x: number; y: number; s?: number; pasajeros?: number; freno?: number; rot?: number; espejo?: boolean; color?: string }> = ({ x, y, s = 1, pasajeros = 0, freno = 0, rot = 0, espejo, color = "#E23B2E" }) => {
  const uid = useUid();
  const clar = aclarar(color, 0.18), osc = oscurecer(color, 0.38), muyOsc = oscurecer(color, 0.62);
  const modulo = (x0: number, w: number, k: number): React.ReactNode => (
    <g key={k}>
      <rect x={x0} y={-150} width={w} height={120} rx={k === 0 ? 20 : 22} fill={`url(#${uid}b)`} />
      <rect x={x0 + 6} y={-148} width={w - 12} height={10} rx={5} fill="#fff" opacity={0.28} />
      {/* ventanas */}
      <rect x={x0 + 14} y={-138} width={w - 28} height={64} rx={8} fill={`url(#${uid}g)`} />
      <clipPath id={`${uid}c${k}`}><rect x={x0 + 14} y={-138} width={w - 28} height={64} rx={8} /></clipPath>
      <g clipPath={`url(#${uid}c${k})`}>
        <Pasajeros x0={x0 + 26} x1={x0 + w - 26} y={-104} n={pasajeros} semilla={k * 11 + 1} />
        <polygon points={`${x0 + 40},-138 ${x0 + 86},-138 ${x0 + 40 + 36},-74 ${x0 - 6},-74`} fill="#fff" opacity={0.1} />
        <polygon points={`${x0 + 150},-138 ${x0 + 172},-138 ${x0 + 130},-74 ${x0 + 108},-74`} fill="#fff" opacity={0.08} />
      </g>
      {/* parantes */}
      {Array.from({ length: Math.floor((w - 28) / 68) }, (_, i) => <rect key={i} x={x0 + 14 + 68 * (i + 1) - 3} y={-138} width={6} height={64} fill={osc} />)}
      {/* puertas */}
      {[0.28, 0.62].map((q, i) => <g key={i}><rect x={x0 + w * q} y={-136} width={50} height={104} rx={5} fill="#16293C" stroke="#D9E3EC" strokeWidth={3} /><rect x={x0 + w * q + 5} y={-130} width={18} height={90} fill="#fff" opacity={0.13} /><line x1={x0 + w * q + 25} y1={-136} x2={x0 + w * q + 25} y2={-32} stroke="#D9E3EC" strokeWidth={2} /></g>)}
      {/* faldón y franja blanca */}
      <rect x={x0} y={-66} width={w} height={5} fill="#fff" opacity={0.85} />
      <rect x={x0} y={-52} width={w} height={22} rx={6} fill={muyOsc} opacity={0.75} />
      {/* equipo del techo */}
      <rect x={x0 + 40} y={-160} width={90} height={12} rx={4} fill="#C9D3DD" /><rect x={x0 + 40} y={-160} width={90} height={4} rx={2} fill="#fff" opacity={0.7} />
    </g>
  );
  return (
    <g transform={T({ x, y, s, espejo })}>
      <defs>
        <linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={clar} /><stop offset="0.35" stopColor={color} /><stop offset="0.8" stopColor={osc} /><stop offset="1" stopColor={muyOsc} /></linearGradient>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1E3B57" /><stop offset="1" stopColor="#060F1A" /></linearGradient>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#0B0E12" /><stop offset="0.5" stopColor="#1B2128" /><stop offset="1" stopColor="#0B0E12" /></linearGradient>
        <radialGradient id={`${uid}hl`}><stop offset="0" stopColor="#FFF6D5" stopOpacity="1" /><stop offset="1" stopColor="#FFF6D5" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${uid}tl`}><stop offset="0" stopColor="#FF3B2D" stopOpacity="1" /><stop offset="1" stopColor="#FF3B2D" stopOpacity="0" /></radialGradient>
      </defs>
      <Sombra x={0} y={2} rx={400} ry={16} opacidad={0.55} />
      {modulo(-360, 330, 0)}
      {/* fuelle */}
      <rect x={-30} y={-146} width={60} height={112} fill={`url(#${uid}f)`} />
      {Array.from({ length: 9 }, (_, i) => <line key={i} x1={-26 + i * 6.5} y1={-146} x2={-26 + i * 6.5} y2={-34} stroke="#3C4650" strokeWidth={2.2} />)}
      <rect x={-30} y={-146} width={60} height={14} fill="#fff" opacity={0.1} />
      {modulo(30, 330, 1)}
      {/* parabrisas y faros del frente */}
      <path d="M 336,-142 C 352,-140 362,-126 362,-108 L 362,-78 L 330,-78 L 330,-142 Z" fill="#0A1624" />
      <path d="M 340,-140 L 356,-122 L 356,-100 L 344,-100 Z" fill="#fff" opacity={0.18} />
      <rect x={356} y={-50} width={8} height={14} rx={3} fill="#FFF3C8" />
      <circle cx={364} cy={-44} r={34} fill={`url(#${uid}hl)`} opacity={0.75} />
      <rect x={350} y={-34} width={16} height={8} rx={3} fill="#0B0E12" />
      {/* luces de freno traseras */}
      <rect x={-364} y={-66} width={7} height={22} rx={3} fill="#FF5C4B" />
      <circle cx={-362} cy={-56} r={26 + freno * 30} fill={`url(#${uid}tl)`} opacity={0.35 + freno * 0.65} />
      {/* ruedas */}
      {[-290, -150, 120, 290].map((cx) => <g key={cx}><circle cx={cx} cy={-30} r={34} fill="#05070A" /><Rueda cx={cx} cy={-26} r={26} rot={rot} /></g>)}
      {/* brillo de la línea de cintura */}
      <rect x={-352} y={-72} width={704} height={3} fill="#fff" opacity={0.18} />
    </g>
  );
};

/**
 * Tren de metro blanco (carros con franja roja y azul), visto de lado y mirando a la derecha. `carros` = cuántos vagones.
 */
export const TrenMetro: React.FC<{ x: number; y: number; s?: number; carros?: number; espejo?: boolean; luces?: number; franja?: string }> = ({ x, y, s = 1, carros = 3, espejo, luces = 1, franja = "#E5372B" }) => {
  const uid = useUid();
  const LC = 300, GAP = 8;
  const total = carros * LC + (carros - 1) * GAP;
  const x0 = -total / 2;
  return (
    <g transform={T({ x, y, s, espejo })}>
      <defs>
        <linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.3" stopColor="#E6ECF3" /><stop offset="0.75" stopColor="#B4C0CF" /><stop offset="1" stopColor="#6F8094" /></linearGradient>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#233F5C" /><stop offset="1" stopColor="#060F1A" /></linearGradient>
        <radialGradient id={`${uid}hl`}><stop offset="0" stopColor="#FFFBE0" stopOpacity="1" /><stop offset="1" stopColor="#FFFBE0" stopOpacity="0" /></radialGradient>
      </defs>
      <Sombra x={0} y={2} rx={total * 0.52} ry={14} opacidad={0.5} />
      {Array.from({ length: carros }, (_, k) => {
        const xa = x0 + k * (LC + GAP), xb = xa + LC;
        const ultimo = k === carros - 1, primero = k === 0;
        const cuerpo = ultimo
          ? `M ${xa},-18 L ${xa},-124 L ${xb - 96},-124 C ${xb - 30},-122 ${xb},-94 ${xb},-52 L ${xb},-18 Z`
          : primero ? `M ${xa + 20},-124 L ${xb},-124 L ${xb},-18 L ${xa},-18 L ${xa},-104 C ${xa},-116 ${xa + 8},-124 ${xa + 20},-124 Z` : `M ${xa},-124 L ${xb},-124 L ${xb},-18 L ${xa},-18 Z`;
        return (
          <g key={k}>
            <path d={cuerpo} fill={`url(#${uid}b)`} />
            <rect x={xa + 4} y={-122} width={LC - 8} height={7} rx={3} fill="#fff" opacity={0.55} />
            {/* ventanas y puertas */}
            {[0, 1, 2].map((i) => <g key={i}><rect x={xa + 22 + i * 92} y={-104} width={44} height={44} rx={7} fill={`url(#${uid}g)`} /><polygon points={`${xa + 28 + i * 92},-104 ${xa + 44 + i * 92},-104 ${xa + 30 + i * 92},-60 ${xa + 22 + i * 92},-60`} fill="#fff" opacity={0.14} /></g>)}
            {[0, 1].map((i) => <g key={i}><rect x={xa + 68 + i * 92 + 2} y={-108} width={20} height={88} rx={3} fill="#17293C" stroke="#CFD8E2" strokeWidth={2.5} /><line x1={xa + 80 + i * 92} y1={-108} x2={xa + 80 + i * 92} y2={-20} stroke="#CFD8E2" strokeWidth={1.5} /></g>)}
            <rect x={xa} y={-54} width={LC} height={9} fill={franja} />
            <rect x={xa} y={-42} width={LC} height={3.5} fill="#4C7DFF" />
            <rect x={xa} y={-22} width={LC} height={9} fill="#2B3440" />
            {/* bogies */}
            {[xa + 52, xb - 52].map((cx) => <g key={cx}><circle cx={cx} cy={-9} r={11} fill="#0C0F13" stroke="#59636E" strokeWidth={2} /><circle cx={cx} cy={-9} r={4} fill="#59636E" /></g>)}
            {k < carros - 1 && <g><rect x={xb} y={-110} width={GAP} height={86} fill="#161B21" />{[0, 1, 2, 3].map((q) => <line key={q} x1={xb} y1={-104 + q * 24} x2={xb + GAP} y2={-104 + q * 24} stroke="#3C4650" strokeWidth={2} />)}</g>}
            {ultimo && (
              <g>
                <path d={`M ${xb - 92},-114 C ${xb - 30},-112 ${xb - 6},-92 ${xb - 6},-64 L ${xb - 6},-60 L ${xb - 92},-60 Z`} fill="#0A1624" />
                <path d={`M ${xb - 80},-112 L ${xb - 46},-112 L ${xb - 66},-62 L ${xb - 92},-62 Z`} fill="#fff" opacity={0.2} />
                <rect x={xb - 8} y={-46} width={8} height={12} rx={3} fill="#FFFBE0" />
                <circle cx={xb} cy={-40} r={44} fill={`url(#${uid}hl)`} opacity={0.85 * luces} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

/** Auto sedán de lado (mirando a la derecha). `taxi` agrega el letrero del techo. */
export const Auto: React.FC<{ x: number; y: number; s?: number; color?: string; freno?: number; taxi?: boolean; espejo?: boolean; rot?: number }> = ({ x, y, s = 1, color = "#F2B705", freno = 0, taxi = false, espejo, rot = 0 }) => {
  const uid = useUid();
  const clar = aclarar(color, 0.25), osc = oscurecer(color, 0.4);
  return (
    <g transform={T({ x, y, s, espejo })}>
      <defs>
        <linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={clar} /><stop offset="0.4" stopColor={color} /><stop offset="1" stopColor={osc} /></linearGradient>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#27435E" /><stop offset="1" stopColor="#08121D" /></linearGradient>
        <radialGradient id={`${uid}hl`}><stop offset="0" stopColor="#FFF6D5" stopOpacity="1" /><stop offset="1" stopColor="#FFF6D5" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${uid}tl`}><stop offset="0" stopColor="#FF3B2D" stopOpacity="1" /><stop offset="1" stopColor="#FF3B2D" stopOpacity="0" /></radialGradient>
      </defs>
      <Sombra x={0} y={2} rx={165} ry={9} opacidad={0.55} />
      <path d="M -152,-22 C -154,-40 -144,-48 -122,-52 L -88,-57 C -72,-82 -50,-95 -12,-97 L 60,-97 C 92,-95 110,-72 120,-57 L 142,-51 C 154,-47 156,-34 156,-22 Z" fill={`url(#${uid}b)`} />
      <path d="M -82,-59 C -68,-80 -48,-90 -12,-92 L 56,-92 C 82,-90 99,-73 108,-59 Z" fill={`url(#${uid}g)`} />
      <line x1={18} y1={-92} x2={18} y2={-59} stroke={osc} strokeWidth={5} />
      <polygon points="-60,-90 -24,-91 -42,-60 -78,-60" fill="#fff" opacity={0.14} />
      <path d="M -146,-44 C -100,-50 60,-50 150,-42" fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={2} />
      <rect x={-156} y={-40} width={9} height={14} rx={3} fill="#FF5C4B" />
      <circle cx={-152} cy={-33} r={20 + freno * 26} fill={`url(#${uid}tl)`} opacity={0.3 + freno * 0.7} />
      <rect x={148} y={-42} width={9} height={10} rx={3} fill="#FFF3C8" />
      <circle cx={156} cy={-38} r={26} fill={`url(#${uid}hl)`} opacity={0.6} />
      {taxi && <g><rect x={-14} y={-108} width={46} height={11} rx={3} fill="#FFE27A" /><rect x={-14} y={-108} width={46} height={4} rx={2} fill="#fff" opacity={0.6} /></g>}
      {[-92, 96].map((cx) => <g key={cx}><path d={`M ${cx - 32},-22 A 32 32 0 0 1 ${cx + 32},-22 Z`} fill="#06080B" /><Rueda cx={cx} cy={-23} r={23} rot={rot} /></g>)}
    </g>
  );
};

/** Torre de oficinas/viviendas: fachada de vidrio con reflejo, cara lateral en sombra, ventanas encendidas al azar y antena. */
export const Torre: React.FC<{ x: number; y: number; w: number; h: number; semilla?: number; luz?: number; tono?: string; lado?: number; ventanas?: boolean }> = ({ x, y, w, h, semilla = 1, luz = 0.55, tono = "#2B5C86", lado = 0.2, ventanas = true }) => {
  const uid = useUid();
  const off = w * lado;
  const fil = Math.max(1, Math.floor(h / 19)), col = Math.max(2, Math.floor(w / 15));
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={aclarar(tono, 0.45)} /><stop offset="0.45" stopColor={tono} /><stop offset="1" stopColor={oscurecer(tono, 0.6)} /></linearGradient>
        <linearGradient id={`${uid}l`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={oscurecer(tono, 0.45)} /><stop offset="1" stopColor={oscurecer(tono, 0.8)} /></linearGradient>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.35" stopColor="#fff" stopOpacity="0.2" /><stop offset="0.5" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0.7" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.55" /></linearGradient>
      </defs>
      <polygon points={`${w / 2},0 ${w / 2 + off},${-off * 0.55} ${w / 2 + off},${-h - off * 0.55} ${w / 2},${-h}`} fill={`url(#${uid}l)`} />
      <rect x={-w / 2} y={-h} width={w} height={h} fill={`url(#${uid}f)`} />
      <rect x={-w / 2} y={-h} width={w} height={h} fill={`url(#${uid}s)`} />
      {ventanas && Array.from({ length: fil }, (_, r) => Array.from({ length: col }, (_, c) => {
        const q = azar(r * 13.1 + c * 7.7 + semilla * 3.3);
        const enc = q < luz;
        return <rect key={`${r}-${c}`} x={-w / 2 + 5 + c * ((w - 10) / col)} y={-h + 7 + r * ((h - 14) / fil)} width={(w - 10) / col - 3} height={(h - 14) / fil - 5} fill={enc ? "#FFD98A" : "#0B1B2C"} opacity={enc ? 0.55 + 0.4 * azar(q * 91) : 0.5} />;
      }))}
      <rect x={-w / 2} y={-h} width={w} height={4} fill="#fff" opacity={0.35} />
      <polygon points={`${-w / 2},${-h} ${w / 2},${-h} ${w / 2 + off},${-h - off * 0.55} ${-w / 2 + off},${-h - off * 0.55}`} fill={aclarar(tono, 0.35)} opacity={0.8} />
      {h > 260 && <line x1={0} y1={-h - 4} x2={0} y2={-h - 40} stroke="#9FB4C8" strokeWidth={2} />}
      <rect x={-w / 2} y={-h} width={w} height={h} fill={`url(#${uid}b)`} />
    </g>
  );
};

/** Cronómetro analógico: caja metálica, corona, esfera crema con marcas y números, aguja roja y reflejo de vidrio. `valor` = fracción de vuelta de la aguja. */
export const Cronometro: React.FC<{ x: number; y: number; r: number; valor: number; color?: string; arco?: number; etiqueta?: string; numeros?: string[] }> = ({ x, y, r, valor, color = RE.rojo, arco = 0, etiqueta, numeros }) => {
  const uid = useUid();
  const pol = (g: number, rr: number): [number, number] => [Math.cos(((g - 90) * Math.PI) / 180) * rr, Math.sin(((g - 90) * Math.PI) / 180) * rr];
  const ang = valor * 360;
  const nums = numeros ?? ["60", "5", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id={`${uid}m`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F4F7FA" /><stop offset="0.35" stopColor="#9AA7B4" /><stop offset="0.7" stopColor="#E3E9EE" /><stop offset="1" stopColor="#4B5560" /></linearGradient>
        <radialGradient id={`${uid}f`} cx="40%" cy="32%" r="80%"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.7" stopColor="#EEF2F6" /><stop offset="1" stopColor="#CBD5DF" /></radialGradient>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6B7681" /><stop offset="0.5" stopColor="#F2F5F8" /><stop offset="1" stopColor="#5B6671" /></linearGradient>
      </defs>
      <Sombra x={0} y={r + 22} rx={r * 0.9} ry={r * 0.09} opacidad={0.5} />
      <rect x={-r * 0.1} y={-r - r * 0.2} width={r * 0.2} height={r * 0.2} rx={4} fill={`url(#${uid}c)`} />
      <rect x={-r * 0.14} y={-r - r * 0.27} width={r * 0.28} height={r * 0.09} rx={4} fill={`url(#${uid}c)`} />
      <circle r={r} fill={`url(#${uid}m)`} />
      <circle r={r * 0.93} fill="#1B242E" />
      <circle r={r * 0.89} fill={`url(#${uid}f)`} />
      {arco > 0 && <path d={`M 0 0 L ${pol(0, r * 0.84)[0]} ${pol(0, r * 0.84)[1]} A ${r * 0.84} ${r * 0.84} 0 ${arco * 360 > 180 ? 1 : 0} 1 ${pol(arco * 360, r * 0.84)[0]} ${pol(arco * 360, r * 0.84)[1]} Z`} fill={color} opacity={0.2} />}
      {Array.from({ length: 60 }, (_, i) => {
        const [x1, y1] = pol(i * 6, r * 0.84), [x2, y2] = pol(i * 6, r * (i % 5 === 0 ? 0.74 : 0.79));
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1F2933" strokeWidth={i % 5 === 0 ? r * 0.022 : r * 0.01} />;
      })}
      {nums.map((n, i) => { const [nx, ny] = pol(i * 30, r * 0.6); return <text key={i} x={nx} y={ny + r * 0.05} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={r * 0.13} fill="#1F2933">{n}</text>; })}
      {etiqueta && <text x={0} y={r * 0.3} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={r * 0.12} fill="#1F2933" letterSpacing="0.08em">{etiqueta}</text>}
      <g transform={`rotate(${ang})`}>
        <line x1={0} y1={r * 0.16} x2={0} y2={-r * 0.78} stroke="#000" strokeOpacity={0.25} strokeWidth={r * 0.035} strokeLinecap="round" transform="translate(3 5)" />
        <line x1={0} y1={r * 0.16} x2={0} y2={-r * 0.78} stroke={color} strokeWidth={r * 0.035} strokeLinecap="round" />
        <circle cx={0} cy={r * 0.16} r={r * 0.05} fill={color} />
      </g>
      <circle r={r * 0.07} fill="#2B343E" /><circle r={r * 0.035} fill="#CFD8E0" />
      <path d={`M ${-r * 0.78} ${-r * 0.2} A ${r * 0.82} ${r * 0.82} 0 0 1 ${-r * 0.1} ${-r * 0.8}`} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={r * 0.05} strokeLinecap="round" />
      <circle r={r * 0.89} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={2} />
    </g>
  );
};

/** Semáforo de poste con la luz activa (`luz`: rojo, ambar o verde) y su resplandor. */
export const Semaforo: React.FC<{ x: number; y: number; s?: number; luz?: "rojo" | "ambar" | "verde" }> = ({ x, y, s = 1, luz = "rojo" }) => {
  const uid = useUid();
  const cols = { rojo: "#FF3B2D", ambar: "#FFC21A", verde: "#27E07A" } as const;
  return (
    <g transform={T({ x, y, s })}>
      <defs>
        <linearGradient id={`${uid}p`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2A323B" /><stop offset="0.4" stopColor="#8A97A4" /><stop offset="1" stopColor="#262D35" /></linearGradient>
        <linearGradient id={`${uid}h`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#14191F" /><stop offset="0.35" stopColor="#3A444F" /><stop offset="1" stopColor="#101419" /></linearGradient>
      </defs>
      <Sombra x={0} y={2} rx={36} ry={5} />
      <rect x={-7} y={-330} width={14} height={330} fill={`url(#${uid}p)`} />
      <rect x={-22} y={-440} width={44} height={120} rx={10} fill={`url(#${uid}h)`} stroke="#59636E" strokeWidth={2} />
      {(["rojo", "ambar", "verde"] as const).map((k, i) => {
        const on = k === luz;
        const cy = -412 + i * 38;
        return (
          <g key={k}>
            {on && <circle cx={0} cy={cy} r={64} fill={cols[k]} opacity={0.28} />}
            <circle cx={0} cy={cy} r={14} fill={on ? cols[k] : "#1B1F25"} />
            {on && <circle cx={-4} cy={cy - 4} r={4.5} fill="#fff" opacity={0.7} />}
          </g>
        );
      })}
    </g>
  );
};

/** Persona de pie o caminando: silueta con luz de borde (cabeza, torso, brazos y piernas); `fase` mueve las piernas y los brazos. */
export const Persona: React.FC<{ x: number; y: number; s?: number; fase?: number; color?: string; espejo?: boolean; brillo?: string }> = ({ x, y, s = 1, fase = 0, color = "#16304A", espejo, brillo = "#A9CBEE" }) => {
  const sw = Math.sin(fase) * 22, sw2 = Math.sin(fase + Math.PI) * 22;
  return (
    <g transform={T({ x, y, s, espejo })}>
      <Sombra x={0} y={1} rx={26} ry={4} opacidad={0.5} />
      <g stroke={brillo} strokeOpacity={0.8} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" fill={color}>
        <path d={`M -7,-88 L ${-7 + sw2 * 0.55},-46 L ${-8 + sw2},-4 L ${4 + sw2},-4 L ${3 + sw2 * 0.55},-46 L 1,-88 Z`} />
        <path d={`M 1,-88 L ${1 + sw * 0.55},-46 L ${sw},-4 L ${12 + sw},-4 L ${11 + sw * 0.55},-46 L 9,-88 Z`} />
        <path d="M -15,-144 C -15,-156 -6,-160 4,-160 C 14,-160 22,-156 22,-144 L 20,-86 L -12,-86 Z" />
        <path d={`M -12,-142 L ${-18 + sw * 0.4},-98 L ${-12 + sw * 0.4},-96 L -4,-136 Z`} />
        <path d={`M 18,-142 L ${22 + sw2 * 0.4},-98 L ${16 + sw2 * 0.4},-96 L 12,-136 Z`} />
        <circle cx={4} cy={-176} r={14} />
      </g>
    </g>
  );
};

/** Pila de monedas doradas (n monedas). */
export const Monedas: React.FC<{ x: number; y: number; n: number; s?: number; color?: string }> = ({ x, y, n, s = 1, color = "#FFC500" }) => {
  const uid = useUid();
  return (
    <g transform={T({ x, y, s })}>
      <defs>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={oscurecer(color, 0.45)} /><stop offset="0.35" stopColor={aclarar(color, 0.35)} /><stop offset="0.7" stopColor={color} /><stop offset="1" stopColor={oscurecer(color, 0.55)} /></linearGradient>
        <radialGradient id={`${uid}t`} cx="40%" cy="35%" r="75%"><stop offset="0" stopColor={aclarar(color, 0.6)} /><stop offset="0.6" stopColor={color} /><stop offset="1" stopColor={oscurecer(color, 0.25)} /></radialGradient>
      </defs>
      <Sombra x={0} y={4} rx={92} ry={12} />
      {Array.from({ length: Math.max(0, Math.round(n)) }, (_, i) => {
        const cy = -i * 15 - 10;
        return (
          <g key={i} transform={`translate(${(azar(i * 3.7) - 0.5) * 6} 0)`}>
            <path d={`M -74,${cy} L -74,${cy - 13} A 74 21 0 0 1 74,${cy - 13} L 74,${cy} A 74 21 0 0 1 -74,${cy} Z`} fill={`url(#${uid}s)`} />
            <ellipse cx={0} cy={cy - 13} rx={74} ry={21} fill={`url(#${uid}t)`} />
            <ellipse cx={0} cy={cy - 13} rx={58} ry={15} fill="none" stroke={oscurecer(color, 0.3)} strokeWidth={2} />
          </g>
        );
      })}
    </g>
  );
};

/** Riel de acero sobre durmientes, de x0 a x1 (a la altura y). */
export const Riel: React.FC<{ x0: number; x1: number; y: number; grosor?: number }> = ({ x0, x1, y, grosor = 1 }) => {
  const uid = useUid();
  const n = Math.max(1, Math.floor((x1 - x0) / (14 * grosor)));
  return (
    <g>
      <defs><linearGradient id={`${uid}r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F2F6FA" /><stop offset="0.5" stopColor="#8E9CAA" /><stop offset="1" stopColor="#3A444E" /></linearGradient></defs>
      {Array.from({ length: n + 1 }, (_, i) => <rect key={i} x={x0 + i * ((x1 - x0) / n) - 2.5 * grosor} y={y + 3 * grosor} width={5 * grosor} height={11 * grosor} fill="#4B3A2C" opacity={0.9} />)}
      <rect x={x0} y={y} width={x1 - x0} height={5 * grosor} rx={2} fill={`url(#${uid}r)`} />
    </g>
  );
};

/** Cota de medición: línea vertical con flechas y su rótulo (para «14 m»). */
export const Cota: React.FC<{ x: number; y0: number; y1: number; texto: string; color?: string; progreso?: number }> = ({ x, y0, y1, texto, color = RE.oro, progreso = 1 }) => {
  const yb = lerp(y0, y1, easeOut(progreso));
  return (
    <g opacity={clamp(progreso * 3)}>
      <line x1={x} y1={y0} x2={x} y2={yb} stroke={color} strokeWidth={4} />
      <line x1={x - 22} y1={y0} x2={x + 22} y2={y0} stroke={color} strokeWidth={4} />
      <line x1={x - 22} y1={yb} x2={x + 22} y2={yb} stroke={color} strokeWidth={4} />
      <polygon points={`${x},${y0} ${x - 8},${y0 + 18} ${x + 8},${y0 + 18}`} fill={color} />
      <polygon points={`${x},${yb} ${x - 8},${yb - 18} ${x + 8},${yb - 18}`} fill={color} />
      <rect x={x + 24} y={(y0 + yb) / 2 - 30} width={texto.length * 30 + 28} height={64} rx={14} fill="#050A12" opacity={0.78} /><text x={x + 38} y={(y0 + yb) / 2 + 16} fontFamily={FONT} fontWeight={800} fontSize={46} fill={color}>{texto}</text>
    </g>
  );
};

export { clamp, easeOut, lerp, mezclar, oscurecer, aclarar, spr, useReloj };
