/**
 * Kit del video «La inyección que cambió todo» (SINAPSIS · historia de la insulina): hospital y laboratorio de 1920 en azul y ámbar, todo en vectores y determinista.
 *   Nino          busto de un niño (enfermo → mejor), Cama        cama de hospital
 *   Jeringa       jeringa con émbolo animado, Frasco      frasco de insulina (turbio → claro)
 *   Bascula       báscula con lectura en kg, Grafico    azúcar en sangre que baja a la zona normal
 *   Perro         perro sentado, Calendario  hoja de calendario, CirculoAzul símbolo del Día Mundial de la Diabetes
 *   LineaI        línea de tiempo (antes · 1921 · ene 1922 · 1923 · hoy)
 * Color: azul = diabetes · ámbar = insulina · verde = mejoría · rojo = alerta · oro = fechas y datos.
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeOut, lerp, mezclar } from "../comun";
import { FONT, MONOF } from "./real-kit";
import { sua } from "./jet-kit";

export const IN = {
  fondo: "#060B14",
  azul: "#2F8CFF",
  claro: "#9CC8FF",
  ambar: "#FFB347",
  verde: "#5CE0A0",
  rojo: "#FF5A5F",
  oro: "#FFD166",
  papel: "#E8DDC0",
  hielo: "#BFE0FF",
} as const;
export { sua, clamp, lerp, mezclar, easeOut, FONT, MONOF, azar };
export const SERIF = "Georgia, 'Times New Roman', serif";

export const Chip: React.FC<{ x: number; y: number; texto: string; color?: string; px?: number; opacidad?: number; id: string; anchor?: "left" | "center" }> = ({ x, y, texto, color = IN.oro, px = 28, opacidad = 1, id, anchor = "left" }) => (
  <div data-texto={id} style={{ position: "absolute", left: anchor === "left" ? x : x - 450, top: y, width: anchor === "left" ? undefined : 900, textAlign: anchor, opacity: opacidad, fontFamily: MONOF, fontWeight: 800, fontSize: px, letterSpacing: "0.06em", color, textShadow: "0 4px 18px rgba(0,0,0,0.85)", whiteSpace: "pre" }}>{texto}</div>
);

export const Ambiente: React.FC<{ t: number; x?: number; y?: number; color?: string; intensidad?: number }> = ({ t, x = 540, y = 900, color = IN.azul, intensidad = 1 }) => {
  const uid = useUid();
  return (
    <>
      <defs><radialGradient id={`${uid}g`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={color} stopOpacity={0.22 * intensidad} /><stop offset="0.6" stopColor={color} stopOpacity={0.07 * intensidad} /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient></defs>
      <circle cx={x} cy={y} r={660} fill={`url(#${uid}g)`} opacity={0.85 + 0.15 * Math.sin(t * 4)} />
      {Array.from({ length: 18 }, (_, i) => {
        const px = azar(i * 3.1) * W + Math.sin(t * 0.3 + i) * 30, py = ((azar(i * 5.7) * H - t * (8 + azar(i) * 16)) % H + H) % H;
        return <circle key={i} cx={px} cy={py} r={2 + azar(i * 2.9) * 3} fill={color} opacity={0.06 + 0.12 * azar(i * 7.7)} />;
      })}
    </>
  );
};

/* ───────────── personas y objetos ───────────── */

/** Niño: `estado` 0 = muy enfermo (pálido, ojos cerrados a medias) · 1 = recuperado (colores, sonríe). Origen = centro de la cabeza (radio ≈ 40). */
export const Nino: React.FC<{ x: number; y: number; s?: number; estado?: number; rot?: number }> = ({ x, y, s = 1, estado = 0, rot = 0 }) => {
  const k = clamp(estado), piel = mezclar("#CFC4BE", "#F0C4A0", k);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M -70 160 C -70 100 -50 74 -20 64 L 20 64 C 50 74 70 100 70 160 Z" fill="#EAF0F8" stroke="#9CB0C8" strokeWidth={3} /><path d="M -50 150 L -50 100 M 0 150 L 0 80 M 50 150 L 50 100" stroke="#9CC8FF" strokeWidth={4} opacity={0.6} />
      <rect x={-11} y={34} width={22} height={34} rx={8} fill={piel} />
      <circle r={40} fill={piel} stroke="#7A5A44" strokeWidth={2} />
      <path d="M -42 -6 C -46 -52 46 -52 42 -6 C 30 -28 -30 -28 -42 -6 Z" fill="#5A4030" />
      {k < 0.5 ? (
        <g stroke="#3A2A20" strokeWidth={3.5} fill="none" strokeLinecap="round"><path d="M -24 0 Q -14 5 -6 0" /><path d="M 6 0 Q 14 5 24 0" /><path d="M -8 24 Q 0 20 8 24" /></g>
      ) : (
        <g><ellipse cx={-14} cy={0} rx={6} ry={7} fill="#fff" /><ellipse cx={14} cy={0} rx={6} ry={7} fill="#fff" /><circle cx={-14} cy={1} r={3.4} fill="#2A1A14" /><circle cx={14} cy={1} r={3.4} fill="#2A1A14" /><path d="M -12 20 Q 0 32 12 20" stroke="#7A3A3A" strokeWidth={3.4} fill="none" strokeLinecap="round" /><circle cx={-24} cy={14} r={7} fill="#FF8A8A" opacity={0.5 * k} /><circle cx={24} cy={14} r={7} fill="#FF8A8A" opacity={0.5 * k} /></g>
      )}
    </g>
  );
};

/** Cama de hospital (vista frontal): colchón, manta y almohada. Origen = centro del colchón. */
export const Cama: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-210} y={-20} width={20} height={150} rx={6} fill="#6A7A8A" /><rect x={190} y={-20} width={20} height={150} rx={6} fill="#6A7A8A" />
    <rect x={-210} y={-110} width={420} height={36} rx={10} fill="#8A9AAA" stroke="#4A5A6A" strokeWidth={4} />
    <rect x={-200} y={-74} width={400} height={78} rx={18} fill="#DCE6F2" stroke="#8A9AAA" strokeWidth={4} />
    <rect x={-200} y={-14} width={400} height={64} rx={14} fill="#4A78B0" stroke="#2A4A78" strokeWidth={4} /><path d="M -190 12 L 190 12" stroke="#7AA0D0" strokeWidth={4} />
    <rect x={-200} y={46} width={400} height={20} rx={8} fill="#6A7A8A" />
  </g>
);

/** Jeringa horizontal que apunta a +x. `embolo` 0 = lleno · 1 = vaciado. Origen = centro del cuerpo. */
export const Jeringa: React.FC<{ x: number; y: number; s?: number; rot?: number; embolo?: number; color?: string }> = ({ x, y, s = 1, rot = 0, embolo = 0, color = IN.ambar }) => {
  const e = clamp(embolo);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-140 + 150 * e} y={-10} width={150} height={20} rx={6} fill="#C8D2DE" /><rect x={-176 + 150 * e} y={-34} width={26} height={68} rx={8} fill="#C8D2DE" stroke="#6A7A8A" strokeWidth={3} />
      <rect x={-130} y={-34} width={220} height={68} rx={10} fill="rgba(207,233,255,0.18)" stroke="#BFE0FF" strokeWidth={5} />
      <rect x={-124 + 150 * e} y={-28} width={214 - 150 * e} height={56} rx={6} fill={color} opacity={0.85} />
      {Array.from({ length: 8 }, (_, i) => <line key={i} x1={-100 + i * 26} y1={-34} x2={-100 + i * 26} y2={i % 2 ? -22 : -14} stroke="#fff" strokeWidth={3} opacity={0.7} />)}
      <rect x={-136} y={-40} width={12} height={80} rx={4} fill="#8A9AAA" /><rect x={88} y={-14} width={34} height={28} rx={6} fill="#8A9AAA" />
      <path d="M 122 0 L 220 0" stroke="#E8EEF6" strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

/** Frasco de insulina. `turbio` 1 = extracto impuro (marrón turbio) · 0 = purificado (ámbar claro). Origen = base centrada; alto ≈ 190·s. */
export const Frasco: React.FC<{ x: number; y: number; s?: number; nivel?: number; brillo?: number; turbio?: number; etiqueta?: string }> = ({ x, y, s = 1, nivel = 0.7, brillo = 0, turbio = 0, etiqueta = "INSULINA" }) => {
  const uid = useUid();
  const liquido = mezclar("#FFC24A", "#7A5A32", clamp(turbio));
  const contorno = "M -50 0 L -50 -110 C -50 -130 -26 -134 -26 -152 L -26 -168 L 26 -168 L 26 -152 C 26 -134 50 -130 50 -110 L 50 0 Z";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <radialGradient id={`${uid}r`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={IN.ambar} stopOpacity="0.6" /><stop offset="1" stopColor={IN.ambar} stopOpacity="0" /></radialGradient>
        <clipPath id={`${uid}c`}><path d={contorno} /></clipPath>
      </defs>
      <circle cx={0} cy={-90} r={150} fill={`url(#${uid}r)`} opacity={brillo} />
      <g clipPath={`url(#${uid}c)`}>
        <rect x={-50} y={-140 * nivel} width={100} height={140 * nivel} fill={liquido} opacity={0.88} />
        {turbio > 0.2 && Array.from({ length: 10 }, (_, i) => <circle key={i} cx={-36 + azar(i * 3.1) * 72} cy={-azar(i * 5.3) * 120 * nivel} r={3 + azar(i) * 4} fill="#3A2A18" opacity={0.5 * turbio} />)}
      </g>
      <path d={contorno} fill="rgba(207,233,255,0.12)" stroke="#BFE0FF" strokeOpacity={0.75} strokeWidth={4} />
      <rect x={-30} y={-186} width={60} height={22} rx={5} fill="#B8C2CE" stroke="#6A7A8A" strokeWidth={3} /><rect x={-20} y={-196} width={40} height={14} rx={5} fill="#5A6A7A" />
      <rect x={-40} y={-100} width={80} height={52} rx={4} fill={IN.papel} /><text x={0} y={-68} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={14} fill="#2A2418">{etiqueta}</text><path d="M -30 -56 L 30 -56" stroke="#8A7C5A" strokeWidth={2} />
      <path d="M -40 -20 L -40 -100" stroke="#fff" strokeOpacity={0.3} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

/** Báscula con la lectura en kg (`k` 0–1 = cuánto se ha «medido»). Origen = centro. */
export const Bascula: React.FC<{ x: number; y: number; s?: number; kg: number; k: number }> = ({ x, y, s = 1, kg, k }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-150} y={-24} width={300} height={60} rx={14} fill="#8A97A8" stroke="#4A5668" strokeWidth={5} />
    <rect x={-120} y={-100} width={240} height={86} rx={14} fill="#1B2430" stroke="#4A5668" strokeWidth={5} />
    <text x={0} y={-36} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={58} fill={IN.verde} opacity={clamp(k * 2)}>{(kg * easeOut(k)).toFixed(0)} kg</text>
  </g>
);

/** Gráfico de azúcar en sangre: la línea baja hasta la franja normal. `prog` 0–1 dibuja la línea; `baja` 0–1 = cuánto desciende. */
export const Grafico: React.FC<{ x: number; y: number; w: number; h: number; prog: number; baja: number; t: number }> = ({ x, y, w, h, prog, baja, t }) => {
  const pts = Array.from({ length: 41 }, (_, i) => { const u = i / 40; const base = 0.9 - 0.62 * easeOut(clamp((u - 0.45) / 0.4)) * baja; return [x + u * w, y + h * (1 - base) + 4 * Math.sin(u * 40 + t * 3) * (1 - 0.7 * baja * u)] as const; });
  const n = Math.max(2, Math.round(41 * clamp(prog)));
  return (
    <g>
      <rect x={x} y={y + h * 0.62} width={w} height={h * 0.24} fill={IN.verde} opacity={0.14} /><text x={x + 10} y={y + h * 0.62 + 24} textAnchor="start" fontFamily={MONOF} fontWeight={700} fontSize={20} fill={IN.verde}>normal</text>
      <line x1={x} y1={y + h} x2={x + w} y2={y + h} stroke={IN.hielo} strokeOpacity={0.5} strokeWidth={4} /><line x1={x} y1={y - 10} x2={x} y2={y + h} stroke={IN.hielo} strokeOpacity={0.5} strokeWidth={4} />
      <text x={x + 12} y={y - 14} fontFamily={MONOF} fontWeight={700} fontSize={22} fill={IN.hielo}>azúcar en sangre</text>
      <polyline points={pts.slice(0, n).map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(" ")} fill="none" stroke={baja > 0.5 ? IN.verde : IN.rojo} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** Perro sentado mirando a la derecha. Origen = base. */
export const Perro: React.FC<{ x: number; y: number; s?: number; t?: number }> = ({ x, y, s = 1, t = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d={`M -110 -30 C -150 -40 -170 ${-70 + 12 * Math.sin(t * 6)} -160 ${-110 + 8 * Math.sin(t * 6)}`} stroke="#9A7A58" strokeWidth={22} fill="none" strokeLinecap="round" />
    <ellipse cx={-30} cy={-70} rx={100} ry={64} fill="#B08A62" /><rect x={-60} y={-60} width={34} height={64} rx={14} fill="#9A7A58" /><rect x={20} y={-60} width={34} height={64} rx={14} fill="#9A7A58" />
    <ellipse cx={70} cy={-150} rx={50} ry={44} fill="#B08A62" /><ellipse cx={116} cy={-134} rx={34} ry={22} fill="#C8A47A" /><circle cx={140} cy={-140} r={9} fill="#2A1A14" />
    <path d="M 40 -180 C 20 -190 12 -140 30 -128 Z" fill="#7A5A3C" /><circle cx={78} cy={-158} r={7} fill="#2A1A14" />
  </g>
);

/** Hoja de calendario con el día en grande. Origen = esquina superior izquierda (460×420). */
export const Calendario: React.FC<{ x: number; y: number; s?: number; dia: string; mes: string; sub?: string }> = ({ x, y, s = 1, dia, mes, sub }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={0} y={0} width={460} height={420} rx={30} fill="#F4F7FB" stroke="#C0CCDA" strokeWidth={5} />
    <path d="M 0 30 Q 0 0 30 0 L 430 0 Q 460 0 460 30 L 460 100 L 0 100 Z" fill="#2F8CFF" />
    <text x={230} y={70} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={44} fill="#fff" letterSpacing="0.12em">{mes}</text>
    <text x={230} y={290} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={190} fill="#10141C">{dia}</text>
    {sub && <text x={230} y={376} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={26} fill="#2F5AA0">{sub}</text>}
    <circle cx={110} cy={0} r={14} fill="#10141C" /><circle cx={350} cy={0} r={14} fill="#10141C" />
  </g>
);

/** Círculo azul del Día Mundial de la Diabetes. */
export const CirculoAzul: React.FC<{ x: number; y: number; r: number; t?: number }> = ({ x, y, r, t = 0 }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r * 1.25} fill={IN.azul} opacity={0.14 + 0.06 * Math.sin(t * 3)} />
    <circle r={r} fill="none" stroke={IN.azul} strokeWidth={r * 0.2} /><circle r={r * 0.74} fill="none" stroke="#fff" strokeOpacity={0.2} strokeWidth={3} />
  </g>
);

/* ───────────── línea de tiempo ───────────── */

const HITOS = ["ANTES", "1921", "ENE 1922", "1923", "HOY"];
export const LineaI: React.FC<{ y?: number; pos: number; opacidad?: number }> = ({ y = 1420, pos, opacidad = 1 }) => {
  const X0 = 150, X1 = 930, dx = (X1 - X0) / (HITOS.length - 1), p = clamp(pos / (HITOS.length - 1)) * (X1 - X0) + X0;
  const act = Math.min(HITOS.length - 1, Math.floor(pos + 0.001));
  return (
    <g opacity={opacidad}>
      <line x1={X0} y1={y} x2={X1} y2={y} stroke="#BFE0FF" strokeOpacity={0.25} strokeWidth={6} strokeLinecap="round" />
      <line x1={X0} y1={y} x2={p} y2={y} stroke={IN.azul} strokeWidth={6} strokeLinecap="round" />
      {HITOS.map((n, i) => {
        const a = i === act, h = i < act;
        return (
          <g key={n} transform={`translate(${X0 + i * dx} ${y})`}>
            <circle r={a ? 17 : 11} fill={a ? IN.azul : h ? "#1F5AA8" : "#0B1220"} stroke={a ? "#fff" : "#BFE0FF"} strokeOpacity={a ? 1 : 0.5} strokeWidth={a ? 4 : 3} />
            {a && <circle r={30} fill="none" stroke={IN.azul} strokeWidth={3} opacity={0.4} />}
            <text x={0} y={52} textAnchor="middle" fontFamily={MONOF} fontWeight={a ? 800 : 600} fontSize={19} fill={a ? "#fff" : "#BFE0FF"} opacity={a ? 1 : 0.65}>{n}</text>
          </g>
        );
      })}
      <circle cx={p} cy={y} r={9} fill="#fff" />
    </g>
  );
};
