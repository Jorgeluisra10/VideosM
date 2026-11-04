/**
 * Kit del video «El viaje de una gota de sangre» (SINAPSIS · anatomía humana): cámara dentro del vaso con perspectiva real, todo en vectores y determinista.
 *   Tubo           vuelo por el interior de un vaso: anillos y estrías en perspectiva, paredes que laten, glóbulos rojos que se acercan girando, leucocitos, plaquetas y ramas que se abren
 *   GlobuloRojo    disco bicóncavo con degradado (oscuro en el centro hundido), brillo de borde y giro; rojo brillante (oxigenado) u oscuro (sin oxígeno)
 *   GlobuloBala    glóbulo deformado en «bala» o «paracaídas» como cuando pasa por un capilar
 *   Gota           gota de sangre con volumen, brillo, reflejo y resplandor
 *   Ruta           barra de ruta (corazón → aorta → arterias → capilares → venas → pulmones) con el punto del viaje
 *   RelojViaje     «VIAJE · t ≈ 0:12» en la esquina
 * Color: rojo brillante = sangre con oxígeno · granate/violeta = sin oxígeno · cian = oxígeno · ámbar = CO2 · dorado = datos.
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeOut, lerp, mezclar } from "../comun";
import { FONT, MONOF } from "./real-kit";
import { rebote, sua } from "./jet-kit";
import { avancePulsatil, sistole } from "../../anim/piezas";

export const SA = {
  fondo: "#0A0206",
  sangre: "#C8102E",
  clara: "#FF3B4A",
  oscura: "#5B1236",
  pared: "#8A2A3C",
  plasma: "#FF9AA2",
  cian: "#3DE0FF",
  ambar: "#FFB547",
  oro: "#FFD166",
  hielo: "#BFE0FF",
  blanco: "#F5F8FC",
} as const;
export { rebote, sua, clamp, lerp, mezclar, easeOut };

/** colores del degradado de un glóbulo según su oxigenación (1 = brillante, 0 = oscuro) */
const coloresGlobulo = (oxi: number): [string, string, string, string] => [
  mezclar("#7A2A4A", "#FF8A8F", oxi), mezclar("#4A1A3C", "#E0243A", oxi), mezclar("#2A0A26", "#A0102A", oxi), mezclar("#12040F", "#4E0614", oxi),
];

/* ───────────── glóbulos ───────────── */

/** Define el degradado de un glóbulo con id propio (úsalo una vez por escena y reutiliza el id). */
export const DefGlobulo: React.FC<{ id: string; oxi: number }> = ({ id, oxi }) => {
  const [a, b, c, d] = coloresGlobulo(oxi);
  return (
    <defs>
      <radialGradient id={id} cx="50%" cy="50%" r="62%">
        <stop offset="0" stopColor={d} /><stop offset="0.3" stopColor={c} /><stop offset="0.62" stopColor={b} /><stop offset="0.9" stopColor={a} /><stop offset="1" stopColor={c} />
      </radialGradient>
    </defs>
  );
};

/** Disco bicóncavo de radio `r`. `tilt` en radianes: 0 = de frente, π/2 = de canto. */
export const GlobuloRojo: React.FC<{ x: number; y: number; r: number; rot?: number; tilt?: number; grad: string; opacidad?: number; borde?: string }> = ({ x, y, r, rot = 0, tilt = 0, grad, opacidad = 1, borde }) => {
  const k = 0.28 + 0.72 * Math.abs(Math.cos(tilt));
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${((rot * 180) / Math.PI).toFixed(1)})`} opacity={opacidad}>
      <ellipse cx={0} cy={0} rx={r} ry={r * k} fill={`url(#${grad})`} stroke={borde ?? "rgba(40,0,10,0.55)"} strokeWidth={Math.max(1, r * 0.05)} />
      <ellipse cx={-r * 0.22} cy={-r * k * 0.34} rx={r * 0.36} ry={r * k * 0.16} fill="#fff" opacity={0.2} />
      <ellipse cx={0} cy={0} rx={r * 0.46} ry={r * k * 0.46} fill="#000" opacity={0.14} />
    </g>
  );
};

/** Glóbulo deformado al pasar por un capilar: `largo` y `alto` en px; la parte de atrás se hunde como un paracaídas. Avanza hacia +x. */
export const GlobuloBala: React.FC<{ x: number; y: number; largo: number; alto: number; grad: string; hundido?: number; opacidad?: number }> = ({ x, y, largo, alto, grad, hundido = 0.5, opacidad = 1 }) => {
  const L = largo / 2, A = alto / 2, h = hundido * L * 0.7;
  const d = `M ${L} 0 C ${L} ${-A * 0.95} ${L * 0.2} ${-A} ${-L * 0.5} ${-A * 0.9} C ${-L * 0.9} ${-A * 0.7} ${-L} ${-A * 0.3} ${-L + h} 0 C ${-L} ${A * 0.3} ${-L * 0.9} ${A * 0.7} ${-L * 0.5} ${A * 0.9} C ${L * 0.2} ${A} ${L} ${A * 0.95} ${L} 0 Z`;
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} opacity={opacidad}>
      <path d={d} fill={`url(#${grad})`} stroke="rgba(40,0,10,0.6)" strokeWidth={2.5} strokeLinejoin="round" />
      <path d={`M ${L * 0.55} ${-A * 0.55} C ${L * 0.1} ${-A * 0.85} ${-L * 0.4} ${-A * 0.7} ${-L * 0.7} ${-A * 0.35}`} fill="none" stroke="#fff" strokeOpacity={0.28} strokeWidth={Math.max(2, A * 0.14)} strokeLinecap="round" />
    </g>
  );
};

/* ───────────── gota ───────────── */

/** Gota de sangre con volumen, brillo y reflejo; origen = centro; alto ≈ 360 a escala 1. */
export const Gota: React.FC<{ x: number; y: number; s?: number; t: number; latido?: number; opacidad?: number }> = ({ x, y, s = 1, t, latido = 0, opacidad = 1 }) => {
  const uid = useUid();
  const respira = 1 + 0.045 * latido;
  const cuerpo = "M 0 -190 C 38 -112 134 -44 134 42 C 134 122 72 172 0 172 C -72 172 -134 122 -134 42 C -134 -44 -38 -112 0 -190 Z";
  return (
    <g transform={`translate(${x} ${y + Math.sin(t * 2.2) * 5}) scale(${s * respira})`} opacity={opacidad}>
      <defs>
        <radialGradient id={`${uid}b`} cx="36%" cy="42%" r="78%"><stop offset="0" stopColor="#FF8A95" /><stop offset="0.35" stopColor="#E0243A" /><stop offset="0.8" stopColor="#8A0A22" /><stop offset="1" stopColor="#3A0410" /></radialGradient>
        <radialGradient id={`${uid}g`} cx="50%" cy="55%" r="55%"><stop offset="0" stopColor="#FF2A45" stopOpacity="0.45" /><stop offset="1" stopColor="#FF2A45" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${uid}r`} x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3DE0FF" stopOpacity="0.55" /><stop offset="0.5" stopColor="#3DE0FF" stopOpacity="0" /></linearGradient>
      </defs>
      <circle cx={0} cy={10} r={330} fill={`url(#${uid}g)`} />
      <ellipse cx={0} cy={236} rx={130} ry={20} fill="#000" opacity={0.5} />
      <path d={cuerpo} fill={`url(#${uid}b)`} />
      <path d={cuerpo} fill={`url(#${uid}r)`} />
      <path d={cuerpo} fill="none" stroke="#FFB1B8" strokeOpacity={0.35} strokeWidth={4} />
      <path d="M -62 -42 C -92 -10 -102 40 -86 78" fill="none" stroke="#fff" strokeOpacity={0.75} strokeWidth={18} strokeLinecap="round" />
      <ellipse cx={-50} cy={-70} rx={14} ry={24} fill="#fff" opacity={0.7} transform="rotate(32 -50 -70)" />
      <ellipse cx={30} cy={132} rx={56} ry={14} fill="#FFB1B8" opacity={0.22} />
    </g>
  );
};

/* ───────────── túnel 3D ───────────── */

type CelTubo = { th: number; rho: number; off: number; rad: number; w1: number; w2: number; ph: number; blanco: boolean };
const escala = (u: number): number => 0.22 / (0.22 + 2.6 * u);

/**
 * Vuelo por el interior de un vaso. `R` = radio en píxeles en el plano cercano; `vel` = velocidad del flujo; `oxi` 0–1 = brillo/oxigenación; `pulso` 0–1 = latido que hincha las paredes;
 * `aberturas` = ramas laterales que pasan; `blancos` = leucocitos; `celulas` = cantidad de glóbulos rojos.
 */
export const Tubo: React.FC<{ t: number; R?: number; cx?: number; cy?: number; vel?: number; oxi?: number; pulso?: number; celulas?: number; aberturas?: number; blancos?: number; semilla?: number; anillos?: number; pared?: string }> = ({ t, R = 520, cx = 540, cy = 930, vel = 1, oxi = 1, pulso = 0, celulas = 56, aberturas = 0, blancos = 2, semilla = 1, anillos = 22, pared = SA.pared }) => {
  const uid = useUid();
  const av = avancePulsatil(t) * vel;
  const Rt = R * (1 + 0.05 * pulso);
  const sway = (u: number): [number, number] => [Math.sin(t * 0.45 + u * 2.3) * 110 * u, Math.cos(t * 0.37 + u * 1.9) * 80 * u];
  const cel = React.useMemo<CelTubo[]>(() => Array.from({ length: celulas + blancos }, (_, i) => ({
    th: azar(i * 3.7 + semilla) * Math.PI * 2, rho: Math.sqrt(azar(i * 5.3 + semilla + 1)) * 0.74, off: azar(i * 7.9 + semilla), rad: 0.075 + azar(i * 2.3 + semilla) * 0.05,
    w1: (azar(i * 4.1 + semilla) - 0.5) * 5, w2: 1 + azar(i * 6.7 + semilla) * 3, ph: azar(i * 8.3 + semilla) * 6.28, blanco: i >= celulas,
  })), [celulas, blancos, semilla]);
  const gr = `${uid}rb`;
  const lista = cel.map((c) => ({ c, u: 1 - ((av * 0.2 + c.off) % 1) })).filter((q) => q.u > 0.025).sort((a, b) => b.u - a.u);
  const anil = Array.from({ length: anillos }, (_, i) => 1 - ((i / anillos + av * 0.12) % 1)).sort((a, b) => b - a);
  const [fx, fy] = sway(1);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id={`${uid}bg`} cx="50%" cy="50%" r="75%"><stop offset="0" stopColor="#12030A" /><stop offset="0.35" stopColor={mezclar("#2B0812", pared, 0.2 * oxi)} /><stop offset="0.8" stopColor={mezclar("#3A0F1E", pared, 0.75)} /><stop offset="1" stopColor={mezclar("#2A0A14", "#C05060", 0.5)} /></radialGradient>
        <radialGradient id={`${uid}vg`} cx="50%" cy="50%" r="75%"><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.7" /></radialGradient>
        <radialGradient id={`${uid}wh`} cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.7" stopColor="#E8D6DC" /><stop offset="1" stopColor="#B79AA6" /></radialGradient>
        <radialGradient id={`${uid}ab`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#000" /><stop offset="0.7" stopColor="#1A0309" /><stop offset="1" stopColor="#7A2535" /></radialGradient>
        <filter id={`${uid}bl`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <DefGlobulo id={gr} oxi={oxi} />
      <rect width={W} height={H} fill="#07010A" />
      <circle cx={cx} cy={cy} r={Rt * 1.02} fill={`url(#${uid}bg)`} />
      {/* estrías longitudinales */}
      {Array.from({ length: 18 }, (_, k) => {
        const an = (k / 18) * Math.PI * 2 + 0.2 * Math.sin(t * 0.2 + k);
        const r0 = Rt * escala(1), r1 = Rt * 0.92;
        return <line key={k} x1={cx + fx + Math.cos(an) * r0} y1={cy + fy + Math.sin(an) * r0} x2={cx + Math.cos(an) * r1} y2={cy + Math.sin(an) * r1} stroke="#FFB1B8" strokeOpacity={0.07 + 0.05 * pulso} strokeWidth={5} />;
      })}
      {/* anillos de la pared en perspectiva */}
      {anil.map((u, i) => {
        const s = escala(u), [ox, oy] = sway(u);
        const r = Rt * s;
        return <circle key={i} cx={cx + ox} cy={cy + oy} r={r} fill="none" stroke={mezclar("#FFB1B8", pared, 0.4)} strokeWidth={Math.max(2, r * 0.055)} opacity={0.5 * Math.pow(1 - u, 0.8) + 0.03} />;
      })}
      {/* ramas laterales que se abren en la pared */}
      {Array.from({ length: aberturas }, (_, j) => {
        const u = 1 - ((av * 0.12 + j / Math.max(1, aberturas) * 0.97 + 0.1) % 1);
        if (u < 0.07) return null;
        const s = escala(u), [ox, oy] = sway(u);
        const an = azar(j * 6.1 + semilla) * Math.PI * 2;
        const r = Rt * s * 0.96;
        return (
          <g key={j} transform={`translate(${cx + ox + Math.cos(an) * r} ${cy + oy + Math.sin(an) * r}) rotate(${(an * 180) / Math.PI + 90})`} opacity={clamp((1 - u) * 5)}>
            <ellipse cx={0} cy={0} rx={Rt * s * 0.2} ry={Rt * s * 0.12} fill={`url(#${uid}ab)`} stroke="#E08A97" strokeWidth={Math.max(2, Rt * s * 0.02)} />
          </g>
        );
      })}
      {/* glóbulos, leucocitos y plaquetas */}
      {lista.map(({ c, u }, i) => {
        const s = escala(u), [ox, oy] = sway(u);
        const px = cx + ox + Math.cos(c.th) * c.rho * Rt * s, py = cy + oy + Math.sin(c.th) * c.rho * Rt * s;
        const rr = c.rad * Rt * s * (c.blanco ? 1.55 : 1);
        const op = clamp((1 - u) * 7) * clamp(u * 14);
        if (rr < 1.2) return null;
        const dx = px - cx, dy = py - cy, dl = Math.hypot(dx, dy) || 1;
        return (
          <g key={i} opacity={op}>
            {!c.blanco && <line x1={px} y1={py} x2={px + (dx / dl) * rr * 1.8 * s * 3} y2={py + (dy / dl) * rr * 1.8 * s * 3} stroke={SA.clara} strokeOpacity={0.2} strokeWidth={rr * 0.5} strokeLinecap="round" />}
            {c.blanco ? (
              <g transform={`translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${((c.ph + t * c.w1) * 57.3).toFixed(0)})`}>
                <circle r={rr} fill={`url(#${uid}wh)`} stroke="#6B3A52" strokeWidth={Math.max(1, rr * 0.04)} />
                {[[-0.3, -0.1], [0.2, -0.3], [0.25, 0.25]].map(([a, b], k) => <circle key={k} cx={a * rr} cy={b * rr} r={rr * 0.3} fill="#7B4A9A" opacity={0.85} />)}
              </g>
            ) : (
              <GlobuloRojo x={px} y={py} r={rr} rot={c.ph + t * c.w1} tilt={t * c.w2 + c.ph} grad={gr} />
            )}
          </g>
        );
      })}
      {/* plaquetas */}
      {Array.from({ length: 22 }, (_, k) => {
        const u = 1 - ((av * 0.24 + azar(k * 9.1 + semilla)) % 1);
        if (u < 0.04) return null;
        const s = escala(u), [ox, oy] = sway(u);
        const th = azar(k * 3.3 + semilla) * 6.28, rho = Math.sqrt(azar(k * 4.7 + semilla)) * 0.8;
        return <ellipse key={k} cx={cx + ox + Math.cos(th) * rho * Rt * s} cy={cy + oy + Math.sin(th) * rho * Rt * s} rx={Rt * s * 0.022} ry={Rt * s * 0.014} fill="#D9A6C9" opacity={clamp((1 - u) * 6) * 0.8} transform={`rotate(${(th * 57) | 0})`} />;
      })}
      <rect width={W} height={H} fill={`url(#${uid}vg)`} />
      <rect width={W} height={H} fill="#FF2A45" opacity={0.05 * pulso} />
    </svg>
  );
};

/* ───────────── ruta y reloj ───────────── */

const PARADAS = ["Corazón", "Aorta", "Arterias", "Capilares", "Venas", "Pulmones"];

/** Barra de ruta del viaje: `paso` 0–5 = parada actual, `prog` 0–1 = avance dentro de ella. */
export const Ruta: React.FC<{ y?: number; paso: number; prog?: number; opacidad?: number }> = ({ y = 1405, paso, prog = 0, opacidad = 1 }) => {
  const X0 = 150, X1 = 930, dx = (X1 - X0) / (PARADAS.length - 1);
  const px = X0 + (paso + clamp(prog)) * dx;
  return (
    <g opacity={opacidad}>
      <line x1={X0} y1={y} x2={X1} y2={y} stroke="#BFE0FF" strokeOpacity={0.25} strokeWidth={6} strokeLinecap="round" />
      <line x1={X0} y1={y} x2={Math.min(X1, px)} y2={y} stroke={SA.clara} strokeWidth={6} strokeLinecap="round" />
      {PARADAS.map((n, i) => {
        const act = i === paso, hecho = i < paso;
        return (
          <g key={n} transform={`translate(${X0 + i * dx} ${y})`}>
            <circle r={act ? 17 : 11} fill={act ? SA.clara : hecho ? "#7A1A2E" : "#1B0A12"} stroke={act ? "#fff" : "#BFE0FF"} strokeOpacity={act ? 1 : 0.5} strokeWidth={act ? 4 : 3} />
            {act && <circle r={30} fill="none" stroke={SA.clara} strokeWidth={3} opacity={0.4} />}
            <text x={0} y={52} textAnchor="middle" fontFamily={MONOF} fontWeight={act ? 800 : 600} fontSize={21} fill={act ? "#fff" : "#BFE0FF"} opacity={act ? 1 : 0.65}>{n}</text>
          </g>
        );
      })}
      <circle cx={px} cy={y} r={9} fill="#fff" />
    </g>
  );
};

/** «VIAJE · t ≈ 0:12» en la esquina superior derecha; `seg` = segundos del viaje. */
export const RelojViaje: React.FC<{ seg: number; opacidad?: number }> = ({ seg, opacidad = 1 }) => {
  const m = Math.floor(seg / 60), s = Math.floor(seg % 60);
  return (
    <div data-texto="reloj-viaje" style={{ position: "absolute", right: 104, top: 262, textAlign: "right", opacity: opacidad, fontFamily: MONOF, fontWeight: 800, fontSize: 30, letterSpacing: "0.08em", color: SA.hielo, textShadow: "0 4px 18px rgba(0,0,0,0.8)" }}>
      VIAJE · t ≈ {m}:{String(s).padStart(2, "0")}
    </div>
  );
};

export { FONT, MONOF, azar };
