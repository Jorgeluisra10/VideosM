/**
 * Kit del video «La cena en que tres médicos se durmieron» (SINAPSIS · historia de la anestesia): salón victoriano a la luz de las velas, todo en vectores y determinista.
 *   Persona    busto de un hombre del siglo XIX (pelo, barba o sombrero); se desploma (`estado` 0–1), cierra los ojos y puede llevarse un pañuelo a la cara
 *   Cena       mesa con tres personas, velas y la botella de cloroformo (la usan «gancho» y «noche»)
 *   Botella    frasco de vidrio con etiqueta, nivel de líquido y resplandor
 *   Vela       vela con llama que parpadea y halo
 *   Crono      cronómetro de bolsillo con arco de progreso
 *   LineaT     línea de tiempo (antes · oct 1846 · nov 1847 · abr 1853 · hoy)
 *   Chip       rótulo mono con sombra
 * Color: ámbar = velas · verde agua = cloroformo · vino = telas · oro = fechas y datos.
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeOut, lerp, mezclar } from "../comun";
import { FONT, MONOF } from "./real-kit";
import { sua } from "./jet-kit";

export const AN = {
  fondo: "#0B0806",
  vela: "#FFB347",
  cloro: "#7FE0C8",
  vino: "#7A2A36",
  papel: "#E8DDC0",
  madera: "#5A3A22",
  blanco: "#F5EFE6",
  oro: "#FFD166",
  hielo: "#BFE0FF",
  rojo: "#FF5A5F",
} as const;
export { sua, clamp, lerp, mezclar, easeOut, FONT, MONOF, azar };
export const SERIF = "Georgia, 'Times New Roman', serif";

/* ───────────── rótulos ───────────── */

export const Chip: React.FC<{ x: number; y: number; texto: string; color?: string; px?: number; opacidad?: number; id: string; anchor?: "left" | "center" }> = ({ x, y, texto, color = AN.oro, px = 28, opacidad = 1, id, anchor = "left" }) => (
  <div data-texto={id} style={{ position: "absolute", left: anchor === "left" ? x : x - 450, top: y, width: anchor === "left" ? undefined : 900, textAlign: anchor, opacity: opacidad, fontFamily: MONOF, fontWeight: 800, fontSize: px, letterSpacing: "0.06em", color, textShadow: "0 4px 18px rgba(0,0,0,0.85)", whiteSpace: "pre" }}>{texto}</div>
);

/* ───────────── luz y ambiente ───────────── */

/** Fondo de salón oscuro con resplandor cálido en (`x`,`y`) y polvo flotando. */
export const Sala: React.FC<{ t: number; x?: number; y?: number; intensidad?: number }> = ({ t, x = 540, y = 900, intensidad = 1 }) => {
  const uid = useUid();
  return (
    <>
      <defs>
        <radialGradient id={`${uid}g`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFB347" stopOpacity={0.3 * intensidad} /><stop offset="0.6" stopColor="#7A3A18" stopOpacity={0.12 * intensidad} /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx={x} cy={y} r={680} fill={`url(#${uid}g)`} opacity={0.85 + 0.15 * Math.sin(t * 7)} />
      {Array.from({ length: 16 }, (_, i) => {
        const px = azar(i * 3.1) * W + Math.sin(t * 0.3 + i) * 30, py = ((azar(i * 5.7) * H - t * (8 + azar(i) * 16)) % H + H) % H;
        return <circle key={i} cx={px} cy={py} r={2 + azar(i * 2.9) * 3} fill={AN.vela} opacity={0.07 + 0.1 * azar(i * 7.7)} />;
      })}
    </>
  );
};

/** Vela: base en (x,y), alto `h`. */
export const Vela: React.FC<{ x: number; y: number; h?: number; t: number; llama?: number }> = ({ x, y, h = 90, t, llama = 1 }) => {
  const fl = 1 + 0.12 * Math.sin(t * 13 + x) + 0.08 * Math.sin(t * 29 + x * 2);
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={0} rx={34} ry={8} fill="#8A6A3A" /><rect x={-5} y={-18} width={10} height={18} fill="#8A6A3A" />
      <rect x={-12} y={-h - 18} width={24} height={h} rx={4} fill="#F2E6C8" /><rect x={-12} y={-h - 18} width={8} height={h} rx={4} fill="#fff" opacity={0.25} />
      <circle cx={0} cy={-h - 52} r={60 * fl} fill={AN.vela} opacity={0.18 * llama} />
      <path d={`M 0 ${-h - 18} C -15 ${-h - 36} -8 ${-h - 54} 0 ${-h - 74 * fl} C 8 ${-h - 54} 15 ${-h - 36} 0 ${-h - 18} Z`} fill="#FFD27A" opacity={llama} />
      <path d={`M 0 ${-h - 20} C -7 ${-h - 32} -3 ${-h - 44} 0 ${-h - 54} C 3 ${-h - 44} 7 ${-h - 32} 0 ${-h - 20} Z`} fill="#fff" opacity={0.85 * llama} />
    </g>
  );
};

/** Frasco de vidrio. Origen = base centrada; alto ≈ 190·s. */
export const Botella: React.FC<{ x: number; y: number; s?: number; etiqueta?: string; nivel?: number; brillo?: number; color?: string; tapon?: boolean }> = ({ x, y, s = 1, etiqueta = "", nivel = 0.7, brillo = 0, color = AN.cloro, tapon = true }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}v`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#CFE9FF" stopOpacity="0.5" /><stop offset="0.4" stopColor="#CFE9FF" stopOpacity="0.12" /><stop offset="1" stopColor="#CFE9FF" stopOpacity="0.4" /></linearGradient>
        <radialGradient id={`${uid}r`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={color} stopOpacity="0.55" /><stop offset="1" stopColor={color} stopOpacity="0" /></radialGradient>
        <clipPath id={`${uid}c`}><path d="M -44 0 L -44 -120 C -44 -140 -16 -144 -16 -166 L -16 -186 L 16 -186 L 16 -166 C 16 -144 44 -140 44 -120 L 44 0 Z" /></clipPath>
      </defs>
      <circle cx={0} cy={-90} r={150} fill={`url(#${uid}r)`} opacity={brillo} />
      <g clipPath={`url(#${uid}c)`}><rect x={-44} y={-150 * nivel} width={88} height={150 * nivel} fill={color} opacity={0.55 + 0.25 * brillo} /></g>
      <path d="M -44 0 L -44 -120 C -44 -140 -16 -144 -16 -166 L -16 -186 L 16 -186 L 16 -166 C 16 -144 44 -140 44 -120 L 44 0 Z" fill={`url(#${uid}v)`} stroke="#BFE0FF" strokeOpacity={0.6} strokeWidth={3} />
      {tapon && <rect x={-14} y={-206} width={28} height={24} rx={4} fill="#8A5A32" />}
      {etiqueta && <g><rect x={-34} y={-98} width={68} height={52} rx={4} fill={AN.papel} /><text x={0} y={-68} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={12} fill="#2A2418" letterSpacing="-0.3">{etiqueta}</text></g>}
      <path d="M -34 -110 L -34 -20" stroke="#fff" strokeOpacity={0.35} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

/* ───────────── personas ───────────── */

/**
 * Busto de hombre del siglo XIX. Origen = centro de la cabeza (radio ≈ 46). `estado` 0 = erguido · 1 = desplomado sobre la mesa; `ojos` 1 = abiertos · 0 = cerrados;
 * `habla` 0–1 = boca abierta; `panuelo` 0–1 = pañuelo contra la cara.
 */
export const Persona: React.FC<{ x: number; y: number; s?: number; estado?: number; ojos?: number; habla?: number; panuelo?: number; tipo?: "pelo" | "barba" | "calvo"; abrigo?: string }> = ({ x, y, s = 1, estado = 0, ojos = 1, habla = 0, panuelo = 0, tipo = "pelo", abrigo = "#2A2230" }) => {
  const e = easeOut(estado);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* cuerpo */}
      <g transform={`translate(0 ${e * 22})`}>
        <path d="M -110 230 C -110 140 -80 96 -26 78 L 26 78 C 80 96 110 140 110 230 Z" fill={abrigo} stroke="#000" strokeOpacity={0.4} strokeWidth={3} />
        <path d="M -24 78 L 0 138 L 24 78 Z" fill="#F2EDE4" /><path d="M -10 96 L 0 130 L 10 96 L 0 104 Z" fill="#1A1620" />
      </g>
      {/* cabeza */}
      <g transform={`rotate(${e * 34} 0 70) translate(${e * 12} ${e * 30})`}>
        <rect x={-15} y={34} width={30} height={46} rx={10} fill="#D9A98A" />
        {tipo === "barba" && <path d="M -44 8 C -44 70 -22 84 0 84 C 22 84 44 70 44 8 C 30 30 -30 30 -44 8 Z" fill="#3A2A20" />}
        <ellipse cx={0} cy={0} rx={44} ry={50} fill="#E6B898" stroke="#7A5A44" strokeWidth={2} />
        {tipo !== "calvo" && <path d="M -46 -8 C -50 -64 50 -64 46 -8 C 34 -36 -34 -36 -46 -8 Z" fill="#3A2A20" />}
        {tipo === "calvo" && <path d="M -46 4 C -52 -30 -40 -40 -36 -26 L -40 4 Z M 46 4 C 52 -30 40 -40 36 -26 L 40 4 Z" fill="#8A7A6A" />}
        {ojos > 0.5 ? (
          <g><ellipse cx={-17} cy={-2} rx={8} ry={6} fill="#fff" /><ellipse cx={17} cy={-2} rx={8} ry={6} fill="#fff" /><circle cx={-17} cy={-2} r={3.6} fill="#241A14" /><circle cx={17} cy={-2} r={3.6} fill="#241A14" /></g>
        ) : (
          <g stroke="#3A2A20" strokeWidth={3.5} fill="none" strokeLinecap="round"><path d="M -26 -2 Q -17 4 -8 -2" /><path d="M 8 -2 Q 17 4 26 -2" /></g>
        )}
        <path d="M -26 -14 Q -17 -20 -9 -15 M 9 -15 Q 17 -20 26 -14" stroke="#3A2A20" strokeWidth={3.5} fill="none" strokeLinecap="round" />
        {habla > 0.05 ? <ellipse cx={0} cy={26} rx={10} ry={4 + 8 * habla} fill="#5A2A2A" /> : <path d="M -10 26 Q 0 30 10 26" stroke="#7A3A3A" strokeWidth={3.5} fill="none" strokeLinecap="round" />}
        {panuelo > 0.02 && <g opacity={clamp(panuelo * 2)} transform={`translate(${lerp(60, 0, easeOut(panuelo))} ${lerp(40, 14, easeOut(panuelo))}) rotate(-8)`}><rect x={-40} y={-4} width={80} height={36} rx={8} fill="#fff" stroke="#BFC8D6" strokeWidth={2} /><path d="M -30 8 L 30 8 M -30 18 L 24 18" stroke="#BFC8D6" strokeWidth={2} /></g>}
      </g>
    </g>
  );
};

/** Mesa de comedor con tres comensales, velas y botella. `est` = desplome de cada uno (0–1); `inhala` = pañuelo; `charla` = 0–1 globos de conversación. */
export const Cena: React.FC<{ t: number; est: [number, number, number]; ojos?: number; inhala?: number; charla?: number; brilloBotella?: number; zzz?: number }> = ({ t, est, ojos = 1, inhala = 0, charla = 0, brilloBotella = 0.4, zzz = 0 }) => {
  const xs = [250, 540, 830], tipos: ("pelo" | "barba" | "calvo")[] = ["barba", "pelo", "calvo"], abrigos = ["#2A2230", "#2A3040", "#302A24"];
  return (
    <g>
      {xs.map((px, i) => {
        const habla = charla > 0 ? clamp(Math.sin(t * 9 + i * 2) * 0.5 + 0.5) * charla * (est[i] > 0.3 ? 0 : 1) : 0;
        return <Persona key={i} x={px} y={800} s={1.12} estado={est[i]} ojos={est[i] > 0.4 ? 0 : ojos} habla={habla} panuelo={inhala * (est[i] > 0.2 ? 0 : 1)} tipo={tipos[i]} abrigo={abrigos[i]} />;
      })}
      {/* globos de conversación */}
      {charla > 0 && xs.map((px, i) => est[i] > 0.2 ? null : (
        <g key={i} opacity={clamp(charla * 2) * (0.6 + 0.4 * Math.sin(t * 6 + i))} transform={`translate(${px + 70} ${650 - 8 * Math.sin(t * 3 + i)})`}>
          <rect x={-46} y={-34} width={92} height={50} rx={22} fill="#fff" /><path d="M -20 14 L -34 36 L 0 14 Z" fill="#fff" />
          <text x={0} y={2} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="#2A2230">{["¡ja!", "…", "¿?"][i]}</text>
        </g>
      ))}
      {/* Z z z */}
      {zzz > 0 && xs.map((px, i) => (
        <text key={i} x={px + 60} y={690 - ((t * 40 + i * 20) % 80)} fontFamily={FONT} fontWeight={900} fontSize={44} fill={AN.hielo} opacity={clamp(zzz) * (0.7 - ((t * 40 + i * 20) % 80) / 140)}>z</text>
      ))}
      {/* mesa y mantel */}
      <rect x={50} y={1010} width={980} height={34} rx={6} fill={AN.madera} stroke="#2A1A0E" strokeWidth={3} />
      <rect x={90} y={1044} width={900} height={230} fill="#E9DFC8" />
      {Array.from({ length: 9 }, (_, i) => <line key={i} x1={90 + i * 112} y1={1048} x2={90 + i * 112 + (i % 2 ? 6 : -6)} y2={1274} stroke="#B7A67C" strokeWidth={4} opacity={0.5} />)}
      <rect x={90} y={1044} width={900} height={230} fill="#000" opacity={0.28} />
      <Vela x={180} y={1010} t={t} /><Vela x={900} y={1010} t={t + 1.3} />
      <Botella x={395} y={1010} s={0.8} etiqueta="CHLORO-FORM" brillo={brilloBotella} />
      {[660, 705, 750].map((gx, i) => <g key={i} transform={`translate(${gx} 1010)`}><path d={`M -17 0 L -13 -${44 + (i % 2) * 8} L 13 -${44 + (i % 2) * 8} L 17 0 Z`} fill="rgba(207,233,255,0.22)" stroke="#BFE0FF" strokeOpacity={0.6} strokeWidth={3} /></g>)}
    </g>
  );
};

/* ───────────── cronómetro y línea de tiempo ───────────── */

/** Cronómetro de bolsillo: `prog` 0–1 llena el arco. */
export const Crono: React.FC<{ x: number; y: number; r?: number; prog: number; color?: string; texto?: string }> = ({ x, y, r = 150, prog, color = AN.oro, texto }) => {
  const C = 2 * Math.PI * (r - 18), an = clamp(prog) * Math.PI * 2 - Math.PI / 2;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-18} y={-r - 40} width={36} height={34} rx={8} fill="#B8923A" /><rect x={-9} y={-r - 56} width={18} height={20} rx={5} fill="#8A6A22" />
      <circle r={r} fill="#16120C" stroke="#D9B04A" strokeWidth={12} /><circle r={r - 14} fill="#F2EAD6" />
      <circle r={r - 18} fill="none" stroke="#C9BEA0" strokeWidth={10} />
      <circle r={r - 18} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${C * clamp(prog)} ${C}`} transform="rotate(-90)" />
      {Array.from({ length: 12 }, (_, i) => <line key={i} x1={Math.cos((i / 12) * 6.283) * (r - 50)} y1={Math.sin((i / 12) * 6.283) * (r - 50)} x2={Math.cos((i / 12) * 6.283) * (r - 66)} y2={Math.sin((i / 12) * 6.283) * (r - 66)} stroke="#2A2418" strokeWidth={5} />)}
      <line x1={0} y1={0} x2={Math.cos(an) * (r - 60)} y2={Math.sin(an) * (r - 60)} stroke="#B23A2A" strokeWidth={7} strokeLinecap="round" /><circle r={9} fill="#B23A2A" />
      {texto && <text x={0} y={r * 0.5} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={r * 0.36} fill="#2A2418">{texto}</text>}
    </g>
  );
};

const HITOS = ["ANTES", "OCT 1846", "NOV 1847", "ABR 1853", "HOY"];
/** Línea de tiempo del video: `pos` 0–4 (parte entera = hito actual). */
export const LineaT: React.FC<{ y?: number; pos: number; opacidad?: number }> = ({ y = 1420, pos, opacidad = 1 }) => {
  const X0 = 150, X1 = 930, dx = (X1 - X0) / (HITOS.length - 1), p = clamp(pos / (HITOS.length - 1)) * (X1 - X0) + X0;
  const act = Math.min(HITOS.length - 1, Math.floor(pos + 0.001));
  return (
    <g opacity={opacidad}>
      <line x1={X0} y1={y} x2={X1} y2={y} stroke="#E8DDC0" strokeOpacity={0.25} strokeWidth={6} strokeLinecap="round" />
      <line x1={X0} y1={y} x2={p} y2={y} stroke={AN.vela} strokeWidth={6} strokeLinecap="round" />
      {HITOS.map((n, i) => {
        const a = i === act, h = i < act;
        return (
          <g key={n} transform={`translate(${X0 + i * dx} ${y})`}>
            <circle r={a ? 17 : 11} fill={a ? AN.vela : h ? "#8A5A22" : "#14100B"} stroke={a ? "#fff" : "#E8DDC0"} strokeOpacity={a ? 1 : 0.5} strokeWidth={a ? 4 : 3} />
            {a && <circle r={30} fill="none" stroke={AN.vela} strokeWidth={3} opacity={0.4} />}
            <text x={0} y={52} textAnchor="middle" fontFamily={MONOF} fontWeight={a ? 800 : 600} fontSize={19} fill={a ? "#fff" : "#E8DDC0"} opacity={a ? 1 : 0.65}>{n}</text>
          </g>
        );
      })}
      <circle cx={p} cy={y} r={9} fill="#fff" />
    </g>
  );
};
