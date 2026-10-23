/**
 * <GeometricPrimitive/>: catálogo de figuras de estudio (SPHERE, CAPSULE, CELLULAR_OVAL, RING_GAUGE, PILL_TOWER) con sus detalles
 * (orejas de perro/gato, abeja, células de Voronoi, aguja de velocímetro, núcleo luminoso). Se dibuja con el origen en el punto de contacto con el suelo.
 * Cada figura lleva degradado de volumen, capa halftone en la zona de sombra y brillo especular blanco.
 */
import React from "react";
import { spring, useCurrentFrame } from "remotion";
import { azar } from "../lib/anim";
import { aclarar, oscurecer, mezclar, type DetalleEstudio, type FormaEstudio } from "../anim/estudio";
import { SpecularHighlight, useEstudio } from "./efectos";
import { FPS, TINTA, arco, caminoAnillo, caminoCirculo, caminoHuevo, caminoPildora, clamp, dimensiones, grados, polar, useUid } from "./util";

const OSCURO = "#0B1020";

export type PropsPrimitiva = {
  forma: FormaEstudio;
  detalle: DetalleEstudio;
  /** color base de la figura (#RRGGBB) */
  color: string;
  /** tamaño de referencia en px (diámetro de la esfera; las demás figuras derivan sus proporciones de él) */
  size: number;
  /** segundo de la escena en que la figura entra (los crecimientos internos arrancan ahí) */
  t0?: number;
  /** estelas y reflejos: solo silueta con degradado, sin capas costosas */
  ligero?: boolean;
};

/** Capa halftone: puntos densos que solo se ven en la zona de sombra (abajo-derecha) de la figura que tiene `d` como contorno. */
const Semitono: React.FC<{ d: string; fuerte?: boolean; mascara?: string }> = ({ d, fuerte = true, mascara = "halftone-shadow" }) => (
  <>
    <path d={d} fill="url(#halftone-dots-m)" mask={`url(#${mascara})`} />
    {fuerte && <path d={d} fill="url(#halftone-dots-l)" mask="url(#halftone-shadow-strong)" />}
  </>
);

const Volumen: React.FC<{ id: string; color: string; cx?: string; cy?: string }> = ({ id, color, cx = "34%", cy = "28%" }) => (
  <radialGradient id={id} cx={cx} cy={cy} r="82%">
    <stop offset="0" stopColor={aclarar(color, 0.4)} />
    <stop offset="0.5" stopColor={color} />
    <stop offset="1" stopColor={oscurecer(color, 0.45)} />
  </radialGradient>
);

/* ───────────── cara y orejas (perro / gato) ───────────── */

type Cabeza = { hx: number; hy: number; hr: number };

const Orejas: React.FC<{ tipo: "dog_ears" | "cat_ears"; c: Cabeza; color: string; ligero: boolean }> = ({ tipo, c, color, ligero }) => {
  const { hx, hy, hr } = c;
  const oscuro = oscurecer(color, 0.22);
  if (tipo === "dog_ears") {
    return (
      <g>
        {[-1, 1].map((s) => {
          const cx = hx + s * hr * 0.9, cy = hy + hr * 0.12;
          return (
            <g key={s} transform={`rotate(${s * -17} ${cx} ${cy - hr * 0.4})`}>
              <ellipse cx={cx} cy={cy} rx={hr * 0.27} ry={hr * 0.56} fill={oscuro} />
              {!ligero && <ellipse cx={cx} cy={cy} rx={hr * 0.27} ry={hr * 0.56} fill="url(#halftone-dots-m)" mask="url(#halftone-shadow)" />}
            </g>
          );
        })}
      </g>
    );
  }
  return (
    <g>
      {[-1, 1].map((s) => {
        const [ax, ay] = polar(hx, hy, hr * 0.97, hr * 0.97, s < 0 ? 203 : 337);
        const [bx, by] = polar(hx, hy, hr * 0.97, hr * 0.97, s < 0 ? 252 : 288);
        const [tx, ty] = polar(hx, hy, hr * 1.46, hr * 1.46, s < 0 ? 230 : 310);
        const d = `M ${ax} ${ay} L ${tx} ${ty} L ${bx} ${by} Z`;
        const mx = (ax + bx + tx) / 3, my = (ay + by + ty) / 3;
        const dentro = `M ${mx + (ax - mx) * 0.55} ${my + (ay - my) * 0.55} L ${mx + (tx - mx) * 0.5} ${my + (ty - my) * 0.5} L ${mx + (bx - mx) * 0.55} ${my + (by - my) * 0.55} Z`;
        return (
          <g key={s}>
            <path d={d} fill={oscuro} stroke={oscuro} strokeWidth={hr * 0.07} strokeLinejoin="round" />
            <path d={dentro} fill={aclarar(color, 0.5)} opacity={0.75} stroke={aclarar(color, 0.5)} strokeWidth={hr * 0.05} strokeLinejoin="round" />
            {!ligero && <path d={d} fill="url(#halftone-dots-m)" mask="url(#halftone-shadow)" />}
          </g>
        );
      })}
    </g>
  );
};

const Rostro: React.FC<{ tipo: "dog_ears" | "cat_ears"; c: Cabeza }> = ({ tipo, c }) => {
  const { hx, hy, hr } = c;
  const f = useCurrentFrame();
  // parpadeo cada ~3 s
  const parpadeo = f % 190 > 184 ? 0.15 : 1;
  if (tipo === "dog_ears") {
    return (
      <g fill={OSCURO}>
        {[-1, 1].map((s) => <ellipse key={s} cx={hx + s * hr * 0.3} cy={hy - hr * 0.05} rx={hr * 0.085} ry={hr * 0.085 * parpadeo} />)}
        <ellipse cx={hx} cy={hy + hr * 0.22} rx={hr * 0.15} ry={hr * 0.1} />
        <ellipse cx={hx - hr * 0.04} cy={hy + hr * 0.19} rx={hr * 0.04} ry={hr * 0.025} fill="#FFFFFF" opacity={0.8} />
        <path d={`M ${hx} ${hy + hr * 0.32} q ${-hr * 0.1} ${hr * 0.12} ${-hr * 0.2} ${hr * 0.07} M ${hx} ${hy + hr * 0.32} q ${hr * 0.1} ${hr * 0.12} ${hr * 0.2} ${hr * 0.07}`} fill="none" stroke={OSCURO} strokeWidth={hr * 0.035} strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g fill={OSCURO}>
      {[-1, 1].map((s) => <ellipse key={s} cx={hx + s * hr * 0.32} cy={hy - hr * 0.04} rx={hr * 0.07} ry={hr * 0.12 * parpadeo} />)}
      <path d={`M ${hx - hr * 0.09} ${hy + hr * 0.14} L ${hx + hr * 0.09} ${hy + hr * 0.14} L ${hx} ${hy + hr * 0.25} Z`} strokeLinejoin="round" stroke={OSCURO} strokeWidth={hr * 0.03} />
      <g stroke={OSCURO} strokeWidth={hr * 0.025} strokeLinecap="round" opacity={0.55} fill="none">
        {[-1, 1].flatMap((s) => [0, 1, 2].map((i) => <path key={`${s}${i}`} d={`M ${hx + s * hr * 0.26} ${hy + hr * (0.18 + i * 0.06)} L ${hx + s * hr * 0.66} ${hy + hr * (0.1 + i * 0.12)}`} />))}
      </g>
    </g>
  );
};

/* ───────────── núcleo luminoso ───────────── */

const NucleoLuminoso: React.FC<{ cx: number; cy: number; r: number; color: string }> = ({ cx, cy, r, color }) => {
  const f = useCurrentFrame();
  const uid = useUid();
  const p = 1 + 0.12 * Math.sin(f / 14);
  return (
    <g>
      <radialGradient id={`${uid}n`}>
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="0.35" stopColor={aclarar(color, 0.55)} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
      <circle cx={cx} cy={cy} r={r * 2.3 * p} fill={`url(#${uid}n)`} opacity={0.75} />
      <circle cx={cx} cy={cy} r={r * 0.62 * p} fill="#FFFFFF" opacity={0.95} />
    </g>
  );
};

/* ───────────── células de Voronoi (huevo / esfera) ───────────── */

const Celulas: React.FC<{ m: number; cy: number; kY: number; frames: number; color: string }> = ({ m, cy, kY, frames, color }) => {
  const C = useEstudio();
  const f = useCurrentFrame();
  const uid = useUid();
  const c1 = C.roles.danger, c2 = mezclar(C.roles.danger, C.roles.accent, 0.55);
  type Cel = { x: number; y: number; r: number; k: number };
  const lista: Cel[] = [];
  for (let i = 0; i < 6; i++) { const [x, y] = polar(0, 0, 0.4 * m, 0.4 * m * Math.min(kY, 1.08), 30 + i * 60); lista.push({ x, y, r: 0.19 * m, k: i }); }
  for (let i = 0; i < 9; i++) { const [x, y] = polar(0, 0, 0.745 * m, 0.745 * m * kY, i * 40 + 10); lista.push({ x, y, r: 0.108 * m, k: 6 + i }); }
  return (
    <g>
      <radialGradient id={`${uid}a`} cx="35%" cy="30%"><stop offset="0" stopColor={aclarar(c1, 0.35)} /><stop offset="0.6" stopColor={c1} /><stop offset="1" stopColor={oscurecer(c1, 0.35)} /></radialGradient>
      <radialGradient id={`${uid}b`} cx="35%" cy="30%"><stop offset="0" stopColor={aclarar(c2, 0.4)} /><stop offset="0.6" stopColor={c2} /><stop offset="1" stopColor={oscurecer(c2, 0.35)} /></radialGradient>
      {lista.map((c, i) => {
        const s = frames <= 14 + c.k * 5 ? 0 : spring({ frame: frames - 14 - c.k * 5, fps: FPS, config: { damping: 11, stiffness: 120, mass: 0.7 } });
        if (s <= 0.01) return null;
        const r = c.r * s * (1 + 0.03 * Math.sin(f / 18 + i));
        const d = caminoCirculo(c.x, cy + c.y, r);
        return (
          <g key={i}>
            <circle cx={c.x} cy={cy + c.y} r={r} fill={`url(#${uid}${i % 2 ? "b" : "a"})`} stroke={C.neon} strokeWidth={2.4} />
            <path d={d} fill="url(#halftone-dots-s)" mask="url(#halftone-shadow)" />
          </g>
        );
      })}
      <NucleoLuminoso cx={0} cy={cy} r={0.15 * m * clamp(frames / 24)} color={color} />
    </g>
  );
};

/* ───────────── esfera ───────────── */

const Esfera: React.FC<PropsPrimitiva & { uid: string }> = ({ detalle, color, size, ligero, uid, t0 = 0 }) => {
  const f = useCurrentFrame();
  const R = size / 2;
  const cy = -R;
  const d = caminoCirculo(0, cy, R);
  const abeja = detalle === "bee_stripes";
  const celulas = detalle === "inner_voronoi_cells";
  const orejas = detalle === "dog_ears" || detalle === "cat_ears" ? detalle : null;
  const cabeza: Cabeza = { hx: 0, hy: cy, hr: R };
  const base = celulas ? oscurecer(color, 0.7) : color;
  return (
    <g>
      <defs>
        <Volumen id={`${uid}v`} color={base} />
        <clipPath id={`${uid}c`}><path d={d} /></clipPath>
      </defs>
      {orejas && <Orejas tipo={orejas} c={cabeza} color={color} ligero={!!ligero} />}
      {abeja && !ligero && <Alas R={R} cy={cy} frame={f} />}
      <path d={d} fill={`url(#${uid}v)`} />
      {abeja && (
        <g clipPath={`url(#${uid}c)`}>
          {[-0.5, -0.08, 0.34].map((x, i) => <path key={i} d={`M ${(x - 0.13) * R} ${cy - R} Q ${(x - 0.03) * R} ${cy} ${(x - 0.13) * R} ${cy + R} L ${(x + 0.13) * R} ${cy + R} Q ${(x + 0.23) * R} ${cy} ${(x + 0.13) * R} ${cy - R} Z`} fill="#15110D" />)}
          {[-0.29, 0.13, 0.55].map((x, i) => <path key={i} d={`M ${(x - 0.025) * R} ${cy - R} Q ${(x + 0.07) * R} ${cy} ${(x - 0.025) * R} ${cy + R}`} stroke="#FFFFFF" strokeWidth={R * 0.05} fill="none" opacity={0.9} />)}
        </g>
      )}
      {abeja && !ligero && <Pelusa R={R} cy={cy} color={color} />}
      {celulas && !ligero && <g clipPath={`url(#${uid}c)`}><Celulas m={R} cy={cy} kY={1} frames={f - t0 * FPS} color={color} /></g>}
      {detalle === "glowing_core" && !ligero && <NucleoLuminoso cx={0} cy={cy} r={R * 0.3} color={color} />}
      {!ligero && <Semitono d={d} />}
      {!ligero && <SpecularHighlight cx={0} cy={cy} rx={R * 0.78} ry={R * 0.78} />}
      {orejas && !ligero && <Rostro tipo={orejas} c={cabeza} />}
      {abeja && !ligero && <Ojos R={R} cy={cy} />}
    </g>
  );
};

const Alas: React.FC<{ R: number; cy: number; frame: number }> = ({ R, cy, frame }) => {
  const aleteo = 1 + 0.22 * Math.sin(frame / 1.6);
  return (
    <g fill="#FFFFFF" fillOpacity={0.6} stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={3}>
      {[-1, 1].map((s) => <ellipse key={s} cx={s * R * 0.34} cy={cy - R * 1.02} rx={R * 0.3} ry={R * 0.5 * aleteo} transform={`rotate(${s * 24} ${s * R * 0.34} ${cy - R * 0.6})`} />)}
    </g>
  );
};

const Pelusa: React.FC<{ R: number; cy: number; color: string }> = ({ R, cy, color }) => (
  <g>
    {Array.from({ length: 30 }, (_, i) => {
      const a = (i / 30) * 360 + azar(i) * 6;
      const [x, y] = polar(0, cy, R * (0.995 + azar(i + 9) * 0.03), R * (0.995 + azar(i + 9) * 0.03), a);
      const x01 = (x / R + 1) / 2;
      const negra = (x01 > 0.17 && x01 < 0.37) || (x01 > 0.46 && x01 < 0.66) || (x01 > 0.78 && x01 < 0.98);
      return <circle key={i} cx={x} cy={y} r={R * (0.05 + azar(i + 3) * 0.03)} fill={negra ? "#15110D" : color} />;
    })}
  </g>
);

const Ojos: React.FC<{ R: number; cy: number }> = ({ R, cy }) => (
  <g>
    <circle cx={R * 0.56} cy={cy - R * 0.1} r={R * 0.12} fill="#FFFFFF" />
    <circle cx={R * 0.59} cy={cy - R * 0.09} r={R * 0.062} fill={OSCURO} />
    <circle cx={R * 0.77} cy={cy + R * 0.14} r={R * 0.1} fill="#FFFFFF" opacity={0.95} />
    <path d={`M ${R * 0.5} ${cy - R * 0.28} q ${R * 0.1} ${-R * 0.35} ${R * 0.34} ${-R * 0.42} M ${R * 0.38} ${cy - R * 0.3} q ${R * 0.02} ${-R * 0.38} ${R * 0.2} ${-R * 0.5}`} stroke={OSCURO} strokeWidth={4} fill="none" strokeLinecap="round" />
  </g>
);

/* ───────────── cápsula ───────────── */

const Capsula: React.FC<PropsPrimitiva & { uid: string }> = ({ detalle, color, size, ligero, uid }) => {
  const { w, h } = dimensiones("CAPSULE", size);
  const d = caminoPildora(w, h);
  const r = h / 2;
  const orejas = detalle === "dog_ears" || detalle === "cat_ears" ? detalle : null;
  const cabeza: Cabeza = { hx: w / 2 - r * 0.95, hy: -h / 2, hr: r * 0.95 };
  return (
    <g>
      <defs><Volumen id={`${uid}v`} color={color} cx="28%" cy="22%" /></defs>
      {orejas && <Orejas tipo={orejas} c={cabeza} color={color} ligero={!!ligero} />}
      <path d={d} fill={`url(#${uid}v)`} />
      {detalle === "glowing_core" && !ligero && <NucleoLuminoso cx={0} cy={-h / 2} r={h * 0.2} color={color} />}
      {!ligero && <Semitono d={d} mascara="halftone-belly" />}
      {!ligero && (
        <>
          <SpecularHighlight cx={-w / 2 + r} cy={-h / 2} rx={r * 0.78} ry={r * 0.78} a0={196} a1={254} extra={w * 0.22} />
          <g fill="#FFFFFF" opacity={0.75}><circle cx={w * 0.2} cy={-h * 0.84} r={5} /><circle cx={w * 0.2 + 20} cy={-h * 0.86} r={3} /><circle cx={w * 0.2 + 36} cy={-h * 0.87} r={2} /></g>
        </>
      )}
      {orejas && !ligero && <Rostro tipo={orejas} c={cabeza} />}
    </g>
  );
};

/* ───────────── huevo celular ───────────── */

const HuevoCelular: React.FC<PropsPrimitiva & { uid: string }> = ({ color, size, ligero, uid, t0 = 0 }) => {
  const f = useCurrentFrame();
  const { w, h } = dimensiones("CELLULAR_OVAL", size);
  const d = caminoHuevo(w, h);
  const C = useEstudio();
  const cy = -h * 0.46;
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}v`} cx="38%" cy="30%" r="85%">
          <stop offset="0" stopColor={mezclar(oscurecer(color, 0.62), "#2A1440", 0.35)} />
          <stop offset="1" stopColor={oscurecer(color, 0.9)} />
        </radialGradient>
        <pattern id={`${uid}p`} width="13" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="6.5" cy="6.5" r="1.7" fill={aclarar(color, 0.2)} fillOpacity={0.42} /></pattern>
        <clipPath id={`${uid}c`}><path d={d} /></clipPath>
      </defs>
      <path d={d} fill={color} opacity={0.22} stroke={color} strokeWidth={22} strokeLinejoin="round" />
      <path d={d} fill={`url(#${uid}v)`} />
      <path d={d} fill={`url(#${uid}p)`} />
      {!ligero && <g clipPath={`url(#${uid}c)`}><Celulas m={w / 2} cy={cy} kY={Math.min(1.22, (h / 2) / (w / 2) * 0.94)} frames={f - t0 * FPS} color={color} /></g>}
      <path d={d} fill="none" stroke={mezclar(color, C.neon, 0.4)} strokeWidth={5} strokeLinejoin="round" />
      {!ligero && <Semitono d={d} fuerte={false} />}
      {!ligero && <SpecularHighlight cx={0} cy={-h * 0.5} rx={w * 0.42} ry={h * 0.42} a0={196} a1={246} />}
    </g>
  );
};

/* ───────────── anillo medidor ───────────── */

const AnilloMedidor: React.FC<PropsPrimitiva & { uid: string }> = ({ detalle, color, size, ligero, uid, t0 = 0 }) => {
  const f = useCurrentFrame();
  const C = useEstudio();
  const R = size / 2;
  const cy = -R;
  const grosor = R * 0.2;
  const rm = R - grosor / 2;
  const fr = f - t0 * FPS;
  const llenado = fr <= 0 ? 0 : 0.82 * spring({ frame: fr, fps: FPS, config: { damping: 17, stiffness: 55, mass: 1 } });
  const a0 = 135, span = 270;
  const aguja = a0 + span * llenado + 1.6 * Math.sin(f / 5) * (llenado > 0.5 ? 1 : 0);
  const aro = caminoAnillo(0, cy, R, R - grosor);
  const aguja_ = detalle === "speedometer_needle";
  return (
    <g>
      <defs><Volumen id={`${uid}v`} color={color} /></defs>
      <path d={aro} fillRule="evenodd" fill={oscurecer(color, 0.62)} opacity={0.55} />
      <circle cx={0} cy={cy} r={R - grosor - 4} fill={TINTA} opacity={0.38} />
      {!ligero && <circle cx={0} cy={cy} r={R - grosor - 4} fill="url(#halftone-dots-s)" mask="url(#halftone-shadow)" />}
      {llenado > 0.005 && <path d={arco(0, cy, rm, rm, a0, a0 + span * llenado)} stroke={`url(#${uid}v)`} strokeWidth={grosor} fill="none" strokeLinecap="round" />}
      {!ligero && llenado > 0.005 && <path d={arco(0, cy, rm, rm, a0, a0 + span * llenado)} stroke="url(#halftone-dots-m)" strokeWidth={grosor} fill="none" strokeLinecap="round" opacity={0.55} />}
      {!ligero && Array.from({ length: 11 }, (_, i) => {
        const a = a0 + (span * i) / 10;
        const [x0, y0] = polar(0, cy, R - grosor - 14, R - grosor - 14, a);
        const [x1, y1] = polar(0, cy, R - grosor - 34, R - grosor - 34, a);
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke="#FFFFFF" strokeWidth={i % 5 === 0 ? 5 : 3} opacity={i / 10 <= llenado ? 0.9 : 0.3} strokeLinecap="round" />;
      })}
      {!ligero && !aguja_ && Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * 360;
        const [x, y] = polar(0, cy, R * 0.5, R * 0.5, a);
        const encendida = ((a - 135 + 360) % 360) / span <= llenado;
        return <circle key={i} cx={x} cy={y} r={R * 0.045} fill={encendida ? C.neon : "#FFFFFF"} opacity={encendida ? 0.95 : 0.18} />;
      })}
      {!ligero && aguja_ && (
        <g>
          <line x1={0} y1={cy} x2={polar(0, cy, R * 0.66, R * 0.66, aguja)[0]} y2={polar(0, cy, R * 0.66, R * 0.66, aguja)[1]} stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round" />
          <circle cx={0} cy={cy} r={R * 0.09} fill={color} stroke="#FFFFFF" strokeWidth={5} />
        </g>
      )}
      {detalle === "glowing_core" && !ligero && <NucleoLuminoso cx={0} cy={cy} r={R * 0.22} color={color} />}
      {!ligero && <Semitono d={aro} fuerte={false} />}
      {!ligero && <SpecularHighlight cx={0} cy={cy} rx={R - 8} ry={R - 8} a0={204} a1={246} />}
    </g>
  );
};

/* ───────────── torre de píldora ───────────── */

const TorrePildora: React.FC<PropsPrimitiva & { uid: string }> = ({ detalle, color, size, ligero, uid, t0 = 0 }) => {
  const f = useCurrentFrame();
  const C = useEstudio();
  const { w, h } = dimensiones("PILL_TOWER", size);
  const d = caminoPildora(w, h);
  const fr = f - t0 * FPS;
  return (
    <g>
      <defs><linearGradient id={`${uid}v`} x1="0" y1="0" x2="1" y2="0.25"><stop offset="0" stopColor={aclarar(color, 0.38)} /><stop offset="0.5" stopColor={color} /><stop offset="1" stopColor={oscurecer(color, 0.45)} /></linearGradient></defs>
      {!ligero && [0, 1, 2].map((i) => {
        const p = ((fr / 90 + i / 3) % 1 + 1) % 1;
        return <ellipse key={i} cx={0} cy={0} rx={w * (0.7 + p * 2.3)} ry={w * (0.7 + p * 2.3) * 0.15} fill="none" stroke={color} strokeWidth={4} opacity={(1 - p) * 0.55} />;
      })}
      <path d={d} fill={`url(#${uid}v)`} />
      {detalle === "glowing_core" && !ligero && <NucleoLuminoso cx={0} cy={-h * 0.5} r={w * 0.26} color={color} />}
      {!ligero && <Semitono d={d} />}
      {!ligero && <SpecularHighlight cx={0} cy={-h + w / 2} rx={w * 0.34} ry={w * 0.34} a0={186} a1={262} extra={0} />}
      {!ligero && <path d={`M ${-w * 0.27} ${-h + w * 0.7} L ${-w * 0.27} ${-h * 0.5}`} stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.7} fill="none" />}
      {!ligero && Array.from({ length: 7 }, (_, i) => {
        const s = ((fr / 24 + i * 0.37) % 1 + 1) % 1;
        const lado = i % 2 ? 1 : -1;
        const y = -h * (0.18 + 0.7 * azar(i + 4));
        const x = lado * (w * 0.5 + 30 + 34 * s);
        return <path key={i} d={`M ${x} ${y} l ${lado * 26 * (1 - s)} ${-8 * (1 - s)}`} stroke={C.neon} strokeWidth={5} strokeLinecap="round" opacity={(1 - s) * 0.9} />;
      })}
    </g>
  );
};

/* ───────────── API pública ───────────── */

export const GeometricPrimitive: React.FC<PropsPrimitiva> = (p) => {
  const uid = useUid();
  switch (p.forma) {
    case "CAPSULE": return <Capsula {...p} uid={uid} />;
    case "CELLULAR_OVAL": return <HuevoCelular {...p} uid={uid} />;
    case "RING_GAUGE": return <AnilloMedidor {...p} uid={uid} />;
    case "PILL_TOWER": return <TorrePildora {...p} uid={uid} />;
    default: return <Esfera {...p} uid={uid} />;
  }
};
