/**
 * Kit de figuras MÉDICAS realistas (carril B, v4): radiografía de tórax con sonda, estómago anatómico con úlcera, bacteria helicoidal (H. pylori),
 * vaso con caldo, medalla Nobel, vista de endoscopia, cápsulas, instrumental (bisturí, pinzas, jeringa, espejo, lámpara) y la base polar con ventisca.
 * Se apoya en el estudio de real-kit.tsx (Estudio, Reflejo, Sombra, Frases…). Todo en vectores (SVG), sin imágenes externas; los tamaños nunca son negativos.
 * Origen de cada figura: su centro (o el centro de su base si se apoya en el piso).
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { aclarar, clamp, easeOut, lerp, mezclar, oscurecer, useReloj } from "../comun";
import { H, W } from "../comun";
import { FONT, MONOF, RE, Sombra } from "./real-kit";
import { muestrear, ruido } from "./anom-ui";

export const MC = {
  rx: "#7FD8FF",
  carne: "#E8918F",
  sangre: "#B3263B",
  oroMed: "#F5C84A",
  verdeBac: "#A9D65A",
  hielo: "#CFE8FF",
  polar: "#0B2A38",
} as const;

const mx = (a: number, b = 0): number => Math.max(b, a);

/* ───────────── radiografía de tórax con sonda (Forssmann, 1929) ───────────── */

/** Puntos (coordenadas locales de la película 820×900) por donde viaja la sonda: brazo → hombro → vena subclavia → cava superior → aurícula derecha. */
export const RUTA_SONDA = [{ x: 56, y: 600 }, { x: 78, y: 430 }, { x: 150, y: 285 }, { x: 270, y: 252 }, { x: 372, y: 292 }, { x: 402, y: 380 }, { x: 410, y: 480 }, { x: 418, y: 590 }];

export const Radiografia: React.FC<{ x: number; y: number; s?: number; pulso?: number; progreso?: number; ruta?: number; destello?: number; marca?: string }> = ({ x, y, s = 1, pulso = 0, progreso = 0, ruta = 0, destello = 0, marca }) => {
  const uid = useUid();
  const m = React.useMemo(() => muestrear(RUTA_SONDA, 160), []);
  const cuerpo = m.slice(0, Math.max(2, Math.round(clamp(progreso) * (m.length - 1)) + 1));
  const punta = cuerpo[cuerpo.length - 1];
  const latido = 1 + 0.028 * pulso;
  const costillas = Array.from({ length: 8 }, (_, i) => 205 + i * 62);
  const trazo = (pts: { x: number; y: number }[]): string => pts.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0A2236" /><stop offset="1" stopColor="#04111D" /></linearGradient>
        <radialGradient id={`${uid}p`} cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="#10324B" /><stop offset="1" stopColor="#01080F" /></radialGradient>
        <radialGradient id={`${uid}c`} cx="45%" cy="40%" r="65%"><stop offset="0" stopColor="#E6F4FF" stopOpacity="0.78" /><stop offset="0.7" stopColor="#8FC4E4" stopOpacity="0.42" /><stop offset="1" stopColor="#5C98BF" stopOpacity="0.12" /></radialGradient>
        <linearGradient id={`${uid}r`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#CFE6F5" stopOpacity="0" /><stop offset="0.5" stopColor="#CFE6F5" stopOpacity="0.46" /><stop offset="1" stopColor="#CFE6F5" stopOpacity="0" /></linearGradient>
        <filter id={`${uid}b`}><feGaussianBlur stdDeviation="7" /></filter>
        <filter id={`${uid}g`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" /></filter>
        <clipPath id={`${uid}k`}><rect x={20} y={20} width={780} height={860} rx={18} /></clipPath>
      </defs>
      <rect x={0} y={0} width={820} height={900} rx={26} fill="#16222C" stroke="#7C93A5" strokeWidth={5} />
      <rect x={20} y={20} width={780} height={860} rx={18} fill={`url(#${uid}f)`} />
      <g clipPath={`url(#${uid}k)`}>
        {/* pulmones */}
        <ellipse cx={235} cy={470} rx={185} ry={310} fill={`url(#${uid}p)`} />
        <ellipse cx={600} cy={470} rx={165} ry={300} fill={`url(#${uid}p)`} />
        {/* vasos de los pulmones */}
        {Array.from({ length: 22 }, (_, i) => {
          const lado = i % 2 ? 1 : -1;
          const y0 = 330 + azar(i * 2.1) * 260;
          return <path key={i} d={`M ${410 + lado * 40} ${y0} C ${410 + lado * 120} ${y0 - 30 + azar(i) * 60}, ${410 + lado * 190} ${y0 + 10 + azar(i * 3) * 80}, ${410 + lado * (240 + azar(i * 5) * 90)} ${y0 + 40 + azar(i * 7) * 110}`} fill="none" stroke="#A8D0E8" strokeOpacity={0.1} strokeWidth={2 + azar(i * 9) * 2} strokeLinecap="round" />;
        })}
        {/* costillas */}
        {costillas.map((yy, i) => (
          <g key={i} stroke={`url(#${uid}r)`} strokeLinecap="round" fill="none" strokeWidth={20 - i * 0.7}>
            <path d={`M 392 ${yy} C 320 ${yy - 36}, 200 ${yy - 40}, 78 ${yy + 70 + i * 6}`} />
            <path d={`M 428 ${yy} C 500 ${yy - 36}, 620 ${yy - 40}, 742 ${yy + 70 + i * 6}`} />
          </g>
        ))}
        {/* clavículas y columna */}
        <path d="M 400 168 C 300 150, 200 170, 90 232" fill="none" stroke="#DCEBF5" strokeOpacity={0.42} strokeWidth={20} strokeLinecap="round" />
        <path d="M 420 168 C 520 150, 620 170, 730 232" fill="none" stroke="#DCEBF5" strokeOpacity={0.42} strokeWidth={20} strokeLinecap="round" />
        <rect x={394} y={120} width={32} height={230} fill="#031019" opacity={0.55} />
        {Array.from({ length: 17 }, (_, i) => <rect key={i} x={391} y={146 + i * 43} width={38} height={33} rx={9} fill="#BFD6E6" fillOpacity={0.3 + (i > 7 ? 0.08 : 0)} />)}
        {/* brazo (húmero) fuera del tórax */}
        <path d="M 52 640 L 86 240" stroke="#CFE2EF" strokeOpacity={0.38} strokeWidth={30} strokeLinecap="round" fill="none" />
        <circle cx={96} cy={225} r={38} fill="#CFE2EF" fillOpacity={0.3} />
        {/* diafragma */}
        <ellipse cx={240} cy={790} rx={230} ry={70} fill="#9CC5DE" fillOpacity={0.2} />
        <ellipse cx={600} cy={770} rx={190} ry={60} fill="#9CC5DE" fillOpacity={0.24} />
        {/* corazón y cayado aórtico (laten) */}
        <g transform={`translate(540 590) scale(${latido}) translate(-540 -590)`} filter={`url(#${uid}b)`}>
          <path d="M 430 420 C 376 432 356 524 378 614 C 398 704 480 766 562 744 C 654 722 704 642 694 540 C 684 450 604 402 520 402 Z" fill={`url(#${uid}c)`} />
          <path d="M 470 410 C 460 360 520 330 560 372 C 590 404 560 430 540 420" fill="none" stroke="#DDEFFB" strokeOpacity={0.4} strokeWidth={34} strokeLinecap="round" />
        </g>
        {/* ruta imaginada (la idea) */}
        {ruta > 0 && <path d={trazo(m)} fill="none" stroke={MC.rx} strokeWidth={4} strokeDasharray="4 14" strokeLinecap="round" opacity={0.75 * ruta} />}
        {/* sonda: brillo + hilo blanco */}
        {cuerpo.length > 1 && (
          <>
            <path d={trazo(cuerpo)} fill="none" stroke={MC.rx} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} filter={`url(#${uid}g)`} />
            <path d={trazo(cuerpo)} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {progreso > 0.02 && <circle cx={punta.x} cy={punta.y} r={9 + 2 * pulso} fill="#fff" stroke={MC.rx} strokeWidth={4} />}
        {destello > 0 && <rect x={0} y={0} width={820} height={900} fill="#fff" opacity={destello} />}
        <rect x={0} y={0} width={820} height={900} fill="#9FD6FF" opacity={0.04} />
      </g>
      <text x={52} y={78} fontFamily={MONOF} fontWeight={800} fontSize={40} fill="#E6F4FF" fillOpacity={0.85}>D</text>
      {marca && <text x={768} y={858} textAnchor="end" fontFamily={MONOF} fontWeight={600} fontSize={24} fill="#E6F4FF" fillOpacity={0.7}>{marca}</text>}
    </g>
  );
};

/* ───────────── estómago anatómico con úlcera ───────────── */

export const CONTORNO_ESTOMAGO = "M 150,10 C 150,70 140,120 120,180 C 80,300 70,430 130,540 C 190,650 330,700 450,660 C 560,622 620,540 600,450 C 585,380 520,340 470,330 C 430,322 410,290 400,240 C 385,160 360,90 330,20 Z";

export const Estomago: React.FC<{ x: number; y: number; s?: number; inflamacion?: number; ulcera?: number; latido?: number }> = ({ x, y, s = 1, inflamacion = 0, ulcera = 1, latido = 0 }) => {
  const uid = useUid();
  const folds = Array.from({ length: 15 }, (_, i) => ({ x: 130 + azar(i * 3.7) * 380, y: 90 + azar(i * 5.3) * 520, l: 90 + azar(i * 7.9) * 120, a: -30 + azar(i * 2.3) * 60 }));
  return (
    <g transform={`translate(${x - 320} ${y - 360}) scale(${s}) translate(0 ${0})`}>
      <defs>
        <linearGradient id={`${uid}t`} x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0" stopColor="#F6B7B0" /><stop offset="0.45" stopColor="#D0707A" /><stop offset="1" stopColor="#8E3548" /></linearGradient>
        <linearGradient id={`${uid}e`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8E3548" /><stop offset="0.5" stopColor="#E99A9A" /><stop offset="1" stopColor="#8E3548" /></linearGradient>
        <radialGradient id={`${uid}u`}><stop offset="0" stopColor="#E9D9A6" stopOpacity="0.95" /><stop offset="0.28" stopColor="#7B1428" /><stop offset="0.7" stopColor="#C23049" stopOpacity="0.85" /><stop offset="1" stopColor="#C23049" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${uid}h`} cx="30%" cy="22%" r="60%"><stop offset="0" stopColor="#fff" stopOpacity="0.55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${uid}i`}><stop offset="0" stopColor="#FF4A5C" stopOpacity="0.8" /><stop offset="1" stopColor="#FF4A5C" stopOpacity="0" /></radialGradient>
        <clipPath id={`${uid}c`}><path d={CONTORNO_ESTOMAGO} /></clipPath>
        <filter id={`${uid}b`}><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <Sombra x={320} y={700} rx={290} ry={22} opacidad={0.5} />
      {/* esófago y duodeno */}
      <path d="M 240 -110 L 240 40" stroke={`url(#${uid}e)`} strokeWidth={92} strokeLinecap="round" fill="none" />
      <path d="M 596 470 C 646 470 688 438 706 372" stroke={`url(#${uid}e)`} strokeWidth={66} strokeLinecap="round" fill="none" />
      <g transform={`translate(320 360) scale(${1 + 0.012 * latido}) translate(-320 -360)`}>
        <path d={CONTORNO_ESTOMAGO} fill={`url(#${uid}t)`} />
        <g clipPath={`url(#${uid}c)`}>
          {folds.map((f, i) => (
            <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${f.a})`}>
              <path d={`M 0 0 q ${f.l / 2} -34 ${f.l} -8`} fill="none" stroke="#5E1B2C" strokeOpacity={0.3} strokeWidth={14} strokeLinecap="round" />
              <path d={`M 0 -6 q ${f.l / 2} -34 ${f.l} -8`} fill="none" stroke="#FFE2DD" strokeOpacity={0.22} strokeWidth={3.5} strokeLinecap="round" />
            </g>
          ))}
          <ellipse cx={380} cy={300} rx={260} ry={330} fill={`url(#${uid}h)`} />
          {/* zonas inflamadas */}
          {inflamacion > 0 && [[220, 430, 120], [330, 560, 110], [470, 500, 90], [200, 300, 80]].map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill={`url(#${uid}i)`} opacity={inflamacion * (0.6 + 0.4 * Math.sin(i * 2.1))} />)}
          {ulcera > 0 && (
            <g opacity={ulcera}>
              <circle cx={218} cy={462} r={74 * ulcera} fill={`url(#${uid}i)`} opacity={0.8} />
              <ellipse cx={218} cy={462} rx={50 * ulcera} ry={36 * ulcera} fill={`url(#${uid}u)`} />
            </g>
          )}
        </g>
        <path d={CONTORNO_ESTOMAGO} fill="none" stroke="#FFD9D2" strokeOpacity={0.35} strokeWidth={3} />
      </g>
    </g>
  );
};

/* ───────────── bacteria helicoidal (Helicobacter pylori) ───────────── */

export const Bacteria: React.FC<{ x: number; y: number; s?: number; rot?: number; fase?: number; opacidad?: number }> = ({ x, y, s = 1, rot = 0, fase = 0, opacidad = 1 }) => {
  const uid = useUid();
  const N = 22;
  const cuerpo = Array.from({ length: N }, (_, k) => ({ x: -66 + k * 6, y: Math.sin(k * 0.82 + fase) * 10 }));
  const d = cuerpo.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y.toFixed(2)}`).join(" ");
  const cabeza = cuerpo[N - 1];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={opacidad}>
      <defs><linearGradient id={`${uid}g`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6C9A2F" /><stop offset="1" stopColor="#C4E27A" /></linearGradient></defs>
      {/* flagelos */}
      {[-14, -6, 2, 10, 18].map((dy, i) => (
        <path key={i} d={`M ${cabeza.x + 6} ${cabeza.y + dy / 3} q 16 ${dy + Math.sin(fase * 2 + i) * 6} 34 ${dy * 0.5 + Math.cos(fase * 2 + i) * 8} t 26 ${Math.sin(fase * 3 + i) * 6}`} fill="none" stroke="#9BC84C" strokeOpacity={0.75} strokeWidth={2} strokeLinecap="round" />
      ))}
      <path d={d} fill="none" stroke="#2E4A12" strokeOpacity={0.5} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={`url(#${uid}g)`} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#fff" strokeOpacity={0.38} strokeWidth={4} strokeLinecap="round" transform="translate(0 -4)" />
    </g>
  );
};

/** Campo de microscopio/endoscopio circular con enjambre de bacterias que se desplazan. */
export const CampoBacterias: React.FC<{ x: number; y: number; r: number; n?: number; t: number; lupa?: number }> = ({ x, y, r, n = 26, t, lupa = 1 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y})`} opacity={clamp(lupa * 2)}>
      <defs>
        <radialGradient id={`${uid}f`}><stop offset="0" stopColor="#F4B8B2" /><stop offset="0.6" stopColor="#D5707E" /><stop offset="1" stopColor="#7A2A3E" /></radialGradient>
        <clipPath id={`${uid}k`}><circle r={r} /></clipPath>
        <radialGradient id={`${uid}v`}><stop offset="0.66" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.8" /></radialGradient>
      </defs>
      <circle r={r + 18} fill="#10161C" stroke="#C7D2DB" strokeWidth={8} />
      <g clipPath={`url(#${uid}k)`}>
        <circle r={r} fill={`url(#${uid}f)`} />
        {Array.from({ length: 16 }, (_, i) => <ellipse key={i} cx={(azar(i * 2.3) - 0.5) * r * 1.7} cy={(azar(i * 4.1) - 0.5) * r * 1.7} rx={30 + azar(i) * 50} ry={14 + azar(i * 3) * 22} transform={`rotate(${azar(i * 5) * 180})`} fill="#fff" opacity={0.07} />)}
        {Array.from({ length: n }, (_, i) => {
          const a0 = azar(i * 1.7) * Math.PI * 2, rr = Math.sqrt(azar(i * 2.9)) * r * 0.86;
          const bx = Math.cos(a0 + t * (0.05 + azar(i) * 0.08)) * rr + Math.sin(t * 0.9 + i) * 10;
          const by = Math.sin(a0 + t * (0.05 + azar(i) * 0.08)) * rr + Math.cos(t * 0.8 + i * 1.3) * 10;
          return <Bacteria key={i} x={bx} y={by} s={0.62 + azar(i * 8.1) * 0.36} rot={(azar(i * 6.7) * 360 + t * 22 * (azar(i) - 0.5)) % 360} fase={t * 3 + i} />;
        })}
        <circle r={r} fill={`url(#${uid}v)`} />
        <ellipse cx={-r * 0.35} cy={-r * 0.45} rx={r * 0.3} ry={r * 0.12} fill="#fff" opacity={0.18} transform={`rotate(-30 ${-r * 0.35} ${-r * 0.45})`} />
      </g>
    </g>
  );
};

/* ───────────── vaso con caldo ───────────── */

export const Vaso: React.FC<{ x: number; y: number; s?: number; nivel?: number; giro?: number; t?: number; bacterias?: boolean; color?: string }> = ({ x, y, s = 1, nivel = 0.7, giro = 0, t = 0, bacterias = true, color = "#C9A25A" }) => {
  const uid = useUid();
  const cuerpo = "M -92 -270 L 92 -270 L 72 0 L -72 0 Z";
  const hLiq = 262 * clamp(nivel);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}v`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#E8F4FF" stopOpacity="0.38" /><stop offset="0.15" stopColor="#E8F4FF" stopOpacity="0.1" /><stop offset="0.85" stopColor="#E8F4FF" stopOpacity="0.08" /><stop offset="1" stopColor="#E8F4FF" stopOpacity="0.4" /></linearGradient>
        <linearGradient id={`${uid}l`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={aclarar(color, 0.2)} stopOpacity="0.92" /><stop offset="1" stopColor={oscurecer(color, 0.45)} stopOpacity="0.95" /></linearGradient>
        <clipPath id={`${uid}c`}><path d={cuerpo} /></clipPath>
      </defs>
      <Sombra x={0} y={4} rx={118} ry={11} opacidad={0.55} />
      <g transform={`rotate(${giro} 0 0)`}>
        <g clipPath={`url(#${uid}c)`}>
          {/* el líquido se mantiene horizontal aunque el vaso se incline */}
          <g transform={`rotate(${-giro})`}>
            <rect x={-200} y={-hLiq} width={400} height={500} fill={`url(#${uid}l)`} />
            <ellipse cx={0} cy={-hLiq} rx={110} ry={11} fill={aclarar(color, 0.35)} opacity={0.9} />
            {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={(azar(i * 3.3) - 0.5) * 120} cy={-((t * (16 + azar(i) * 18) + azar(i * 7) * 200) % mx(hLiq, 10))} r={2.4 + azar(i * 9) * 3.6} fill="#fff" opacity={0.35} />)}
            {bacterias && Array.from({ length: 18 }, (_, i) => {
              const bx = (azar(i * 2.1) - 0.5) * 120 + Math.sin(t * 1.2 + i) * 8;
              const by = -azar(i * 4.7) * mx(hLiq - 16, 10) + Math.cos(t + i * 1.7) * 7;
              return <Bacteria key={i} x={bx} y={by} s={0.22} rot={(t * 40 * (azar(i) - 0.5) + azar(i * 6) * 360) % 360} fase={t * 3 + i} opacidad={hLiq > 30 ? 0.95 : 0} />;
            })}
          </g>
        </g>
        <path d={cuerpo} fill={`url(#${uid}v)`} stroke="#E8F4FF" strokeOpacity={0.6} strokeWidth={3} />
        <ellipse cx={0} cy={-270} rx={92} ry={12} fill="none" stroke="#E8F4FF" strokeOpacity={0.75} strokeWidth={3} />
        <path d="M -70 -250 L -56 -20" stroke="#fff" strokeOpacity={0.55} strokeWidth={9} strokeLinecap="round" />
        <path d="M 66 -250 L 56 -60" stroke="#fff" strokeOpacity={0.3} strokeWidth={4} strokeLinecap="round" />
      </g>
    </g>
  );
};

/* ───────────── medalla Nobel ───────────── */

export const Medalla: React.FC<{ x: number; y: number; r?: number; anio: string; brillo?: number; entrada?: number }> = ({ x, y, r = 170, anio, brillo = 0, entrada = 1 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) scale(${0.6 + 0.4 * clamp(entrada)})`} opacity={clamp(entrada * 2)}>
      <defs>
        <linearGradient id={`${uid}a`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF0A8" /><stop offset="0.3" stopColor="#E7B83A" /><stop offset="0.6" stopColor="#B98419" /><stop offset="1" stopColor="#F6D86C" /></linearGradient>
        <radialGradient id={`${uid}d`} cx="38%" cy="30%" r="80%"><stop offset="0" stopColor="#FFF3B8" /><stop offset="0.5" stopColor="#E3B13A" /><stop offset="1" stopColor="#A87413" /></radialGradient>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.5" stopColor="#fff" stopOpacity="0.75" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <clipPath id={`${uid}c`}><circle r={r} /></clipPath>
        <path id={`${uid}arc`} d={`M ${-r * 0.74} 0 A ${r * 0.74} ${r * 0.74} 0 0 1 ${r * 0.74} 0`} />
      </defs>
      <Sombra x={0} y={r + 30} rx={r * 0.9} ry={r * 0.08} opacidad={0.55} />
      <rect x={-18} y={-r - 52} width={36} height={60} rx={14} fill="none" stroke="#D9A82E" strokeWidth={9} />
      <circle r={r} fill={`url(#${uid}a)`} />
      <circle r={r * 0.93} fill="none" stroke="#7A520C" strokeOpacity={0.55} strokeWidth={4} />
      <circle r={r * 0.86} fill={`url(#${uid}d)`} />
      <circle r={r * 0.7} fill="none" stroke="#7A520C" strokeOpacity={0.35} strokeWidth={3} />
      <text fontFamily={FONT} fontWeight={800} fontSize={r * 0.11} fill="#6B4607" fillOpacity={0.8} letterSpacing="0.14em"><textPath href={`#${uid}arc`} startOffset="50%" textAnchor="middle">NOBEL · MEDICINA</textPath></text>
      <text y={r * 0.2} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={r * 0.42} fill="#7A520C" fillOpacity={0.9}>{anio}</text>
      <text y={r * 0.2 - 2} x={-2} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={r * 0.42} fill="#FFF3B8" fillOpacity={0.55}>{anio}</text>
      <g clipPath={`url(#${uid}c)`}><rect x={lerp(-r * 1.6, r * 1.2, brillo)} y={-r * 1.2} width={r * 0.5} height={r * 2.4} fill={`url(#${uid}s)`} transform={`rotate(24)`} opacity={brillo > 0 && brillo < 1 ? 1 : 0} /></g>
    </g>
  );
};

/* ───────────── vista de endoscopia ───────────── */

export const Endoscopia: React.FC<{ x: number; y: number; r: number; t: number; inflamacion?: number; etiqueta?: string }> = ({ x, y, r, t, inflamacion = 0, etiqueta }) => {
  const uid = useUid();
  const bx = Math.sin(t * 0.8) * 6, by = Math.cos(t * 0.65) * 5;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${uid}f`} cx="50%" cy="46%" r="62%"><stop offset="0" stopColor="#F6B0A6" /><stop offset="0.45" stopColor="#D26B78" /><stop offset="0.85" stopColor="#7E2A3D" /><stop offset="1" stopColor="#2A0A14" /></radialGradient>
        <radialGradient id={`${uid}i`}><stop offset="0" stopColor="#E02A47" stopOpacity="0.85" /><stop offset="1" stopColor="#E02A47" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${uid}v`}><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.92" /></radialGradient>
        <clipPath id={`${uid}k`}><circle r={r} /></clipPath>
        <filter id={`${uid}b`}><feGaussianBlur stdDeviation="9" /></filter>
      </defs>
      <circle r={r + 22} fill="#0C1116" stroke="#B9C6D0" strokeWidth={10} />
      <g clipPath={`url(#${uid}k)`}>
        <g transform={`translate(${bx} ${by})`}>
          <circle r={r * 1.1} fill={`url(#${uid}f)`} />
          {/* pliegues radiales de la mucosa */}
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2 + 0.2 * Math.sin(i * 2.3);
            const r0 = r * (0.12 + 0.05 * azar(i)), r1 = r * (0.95 + 0.1 * azar(i * 3));
            return <path key={i} d={`M ${Math.cos(a) * r0} ${Math.sin(a) * r0} Q ${Math.cos(a + 0.35) * r * 0.55} ${Math.sin(a + 0.35) * r * 0.55} ${Math.cos(a + 0.18) * r1} ${Math.sin(a + 0.18) * r1}`} fill="none" stroke="#5B1626" strokeOpacity={0.35} strokeWidth={r * 0.07} strokeLinecap="round" />;
          })}
          {Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2 + 0.2 * Math.sin(i * 2.3);
            return <path key={`h${i}`} d={`M ${Math.cos(a) * r * 0.2} ${Math.sin(a) * r * 0.2} Q ${Math.cos(a + 0.35) * r * 0.55} ${Math.sin(a + 0.35) * r * 0.55} ${Math.cos(a + 0.18) * r * 0.92} ${Math.sin(a + 0.18) * r * 0.92}`} fill="none" stroke="#FFD9D0" strokeOpacity={0.2} strokeWidth={r * 0.012} transform={`translate(${r * 0.012} ${-r * 0.02})`} />;
          })}
          {/* inflamación (enrojecimiento) */}
          {inflamacion > 0 && Array.from({ length: 9 }, (_, i) => <circle key={i} cx={(azar(i * 2.7) - 0.5) * r * 1.4} cy={(azar(i * 4.3) - 0.5) * r * 1.4} r={r * (0.18 + azar(i * 5) * 0.2)} fill={`url(#${uid}i)`} opacity={inflamacion * (0.65 + 0.35 * Math.sin(t * 1.6 + i))} />)}
          {/* brillos húmedos */}
          {Array.from({ length: 6 }, (_, i) => <ellipse key={i} cx={(azar(i * 9.1) - 0.5) * r * 1.2} cy={(azar(i * 3.1) - 0.5) * r * 1.2} rx={r * 0.07 + azar(i) * r * 0.05} ry={r * 0.03} fill="#fff" opacity={0.5 + 0.2 * Math.sin(t * 2 + i)} transform={`rotate(${azar(i * 2) * 60 - 30})`} />)}
        </g>
        <circle r={r} fill={`url(#${uid}v)`} />
      </g>
      {etiqueta && <text x={0} y={-r * 0.8} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={26} fill="#fff" fillOpacity={0.85} letterSpacing="0.1em">{etiqueta}</text>}
    </g>
  );
};

/* ───────────── cápsula e instrumental ───────────── */

export const Capsula: React.FC<{ x: number; y: number; s?: number; rot?: number; a?: string; b?: string }> = ({ x, y, s = 1, rot = 0, a = "#E23B2E", b = "#F4F7FA" }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}a`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={aclarar(a, 0.35)} /><stop offset="0.5" stopColor={a} /><stop offset="1" stopColor={oscurecer(a, 0.45)} /></linearGradient>
        <linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="0.6" stopColor={b} /><stop offset="1" stopColor="#B7C2CC" /></linearGradient>
      </defs>
      <Sombra x={4} y={46} rx={86} ry={9} opacidad={0.45} />
      <path d="M -80 -34 L 0 -34 L 0 34 L -80 34 A 34 34 0 0 1 -80 -34 Z" fill={`url(#${uid}a)`} />
      <path d="M 0 -34 L 80 -34 A 34 34 0 0 1 80 34 L 0 34 Z" fill={`url(#${uid}b)`} />
      <rect x={-84} y={-28} width={166} height={9} rx={4.5} fill="#fff" opacity={0.5} />
      <line x1={0} y1={-34} x2={0} y2={34} stroke="#000" strokeOpacity={0.18} strokeWidth={2} />
    </g>
  );
};

export const Bisturi: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = -20 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}m`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F4F8FB" /><stop offset="0.5" stopColor="#8E9CA9" /><stop offset="1" stopColor="#CBD6DF" /></linearGradient>
        <linearGradient id={`${uid}b`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#9EB0BE" /></linearGradient>
      </defs>
      <Sombra x={0} y={150} rx={30} ry={5} opacidad={0.45} />
      <path d="M -11 -130 L 11 -130 L 14 60 L -14 60 Z" fill={`url(#${uid}m)`} />
      {Array.from({ length: 9 }, (_, i) => <line key={i} x1={-11} y1={-100 + i * 14} x2={11} y2={-100 + i * 14} stroke="#44515C" strokeOpacity={0.5} strokeWidth={2} />)}
      <path d="M -9 -130 L 9 -130 L 9 -150 L -9 -150 Z" fill="#6F7E8B" />
      <path d="M -8 60 L 8 60 L 4 100 C 2 140 -3 160 -14 175 C -2 120 -8 100 -8 60 Z" fill={`url(#${uid}b)`} />
      <path d="M 0 62 L 3 100" stroke="#fff" strokeWidth={2} strokeOpacity={0.9} />
    </g>
  );
};

export const Pinzas: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 14 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <defs><linearGradient id={`${uid}m`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8E9CA9" /><stop offset="0.45" stopColor="#F4F8FB" /><stop offset="1" stopColor="#7D8B98" /></linearGradient></defs>
      <Sombra x={0} y={150} rx={40} ry={5} opacidad={0.45} />
      <path d="M -26 -150 L -14 -150 L 4 120 L -4 150 L -10 150 L -26 -150 Z" fill={`url(#${uid}m)`} />
      <path d="M 26 -150 L 14 -150 L -4 120 L 4 150 L 10 150 L 26 -150 Z" fill={`url(#${uid}m)`} />
      {Array.from({ length: 6 }, (_, i) => <line key={i} x1={-20 + i * 1} y1={-132 + i * 12} x2={20 - i * 1} y2={-132 + i * 12} stroke="#44515C" strokeOpacity={0.4} strokeWidth={2} />)}
      <circle cx={0} cy={-10} r={7} fill="#5A6773" />
    </g>
  );
};

export const Jeringa: React.FC<{ x: number; y: number; s?: number; rot?: number; liquido?: number }> = ({ x, y, s = 1, rot = 0, liquido = 0.7 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}v`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#E8F4FF" stopOpacity="0.55" /><stop offset="0.5" stopColor="#E8F4FF" stopOpacity="0.12" /><stop offset="1" stopColor="#E8F4FF" stopOpacity="0.5" /></linearGradient>
        <linearGradient id={`${uid}l`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#A5E3FF" /><stop offset="1" stopColor="#4DB3E6" /></linearGradient>
      </defs>
      <Sombra x={0} y={160} rx={44} ry={6} opacidad={0.45} />
      <rect x={-28} y={-120} width={56} height={200} rx={8} fill="#0E1A24" fillOpacity={0.4} />
      <rect x={-24} y={80 - 190 * clamp(liquido)} width={48} height={190 * clamp(liquido)} fill={`url(#${uid}l)`} opacity={0.9} />
      <rect x={-28} y={-120} width={56} height={200} rx={8} fill={`url(#${uid}v)`} stroke="#E8F4FF" strokeOpacity={0.7} strokeWidth={3} />
      {Array.from({ length: 10 }, (_, i) => <line key={i} x1={-28} y1={-100 + i * 18} x2={i % 2 ? -14 : -4} y2={-100 + i * 18} stroke="#fff" strokeOpacity={0.8} strokeWidth={2} />)}
      <rect x={-40} y={72} width={80} height={14} rx={6} fill="#DCE6EE" />
      <rect x={-10} y={-210} width={20} height={92} fill="#D5DEE6" />
      <rect x={-34} y={-228} width={68} height={16} rx={7} fill="#E8EEF3" />
      <rect x={-5} y={86} width={10} height={36} fill="#C9D3DC" />
      <path d="M -2 122 L 2 122 L 0 205 Z" fill="#EEF3F7" />
    </g>
  );
};

export const Espejo: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 0 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F4F8FB" /><stop offset="0.5" stopColor="#8E9CA9" /><stop offset="1" stopColor="#D5DEE6" /></linearGradient>
        <linearGradient id={`${uid}r`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#CFE7F7" /><stop offset="0.45" stopColor="#6F9DBD" /><stop offset="1" stopColor="#1D3C55" /></linearGradient>
      </defs>
      <Sombra x={0} y={170} rx={50} ry={6} opacidad={0.45} />
      <rect x={-12} y={50} width={24} height={130} rx={10} fill={`url(#${uid}c)`} />
      <ellipse cx={0} cy={-40} rx={84} ry={100} fill={`url(#${uid}c)`} />
      <ellipse cx={0} cy={-40} rx={70} ry={86} fill={`url(#${uid}r)`} />
      <path d="M -40 -100 C -10 -120 30 -112 52 -80" fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={8} strokeLinecap="round" />
    </g>
  );
};

/** Lámpara quirúrgica: disco con anillo de luces y cono de luz hacia abajo. */
export const Lampara: React.FC<{ x: number; y: number; alto: number; ancho?: number; intensidad?: number; cable?: number }> = ({ x, y, alto, ancho = 420, intensidad = 1, cable = 300 }) => {
  const uid = useUid();
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF6DA" stopOpacity={0.5 * intensidad} /><stop offset="1" stopColor="#FFF6DA" stopOpacity="0" /></linearGradient>
        <radialGradient id={`${uid}d`}><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.6" stopColor="#DCE4EB" /><stop offset="1" stopColor="#7F8E9B" /></radialGradient>
      </defs>
      <polygon points={`${-95},20 ${95},20 ${ancho / 2},${alto} ${-ancho / 2},${alto}`} fill={`url(#${uid}c)`} />
      <line x1={0} y1={-cable} x2={0} y2={-10} stroke="#9AA7B4" strokeWidth={10} />
      <ellipse cx={0} cy={0} rx={112} ry={26} fill={`url(#${uid}d)`} stroke="#5B6773" strokeWidth={3} />
      {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={-84 + i * 21} cy={10} r={6} fill="#FFFBE6" opacity={0.95} />)}
    </g>
  );
};

/* ───────────── Antártida: base polar con ventisca ───────────── */

export const Polar: React.FC<{ viento?: number; ventana?: number; amanece?: number; children?: React.ReactNode }> = ({ viento = 1, ventana = 1, amanece = 0, children }) => {
  const { t } = useReloj();
  const uid = useUid();
  const piso = 1180;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#030B12" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#020912" /><stop offset="0.5" stopColor={mezclar("#0A2A3C", "#3A5A6E", amanece)} /><stop offset="1" stopColor={mezclar("#1B5560", "#E6B98A", amanece)} /></linearGradient>
          <linearGradient id={`${uid}h`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#DCEAF2" /><stop offset="0.35" stopColor="#8EB0C4" /><stop offset="1" stopColor="#1C3B50" /></linearGradient>
          <linearGradient id={`${uid}a`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#3CFFA6" stopOpacity="0" /><stop offset="0.4" stopColor="#3CFFA6" stopOpacity="0.55" /><stop offset="0.75" stopColor="#5AD6FF" stopOpacity="0.4" /><stop offset="1" stopColor="#B86CFF" stopOpacity="0" /></linearGradient>
          <filter id={`${uid}b`}><feGaussianBlur stdDeviation="26" /></filter>
          <radialGradient id={`${uid}v`} cx="50%" cy="50%" r="75%"><stop offset="0.6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.55" /></radialGradient>
          <radialGradient id={`${uid}w`}><stop offset="0" stopColor="#FFD27A" stopOpacity="0.9" /><stop offset="1" stopColor="#FFD27A" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width={W} height={piso} fill={`url(#${uid}s)`} />
        {Array.from({ length: 60 }, (_, i) => <circle key={i} cx={azar(i * 3.3) * W} cy={azar(i * 7.1) * 700} r={0.8 + azar(i * 2) * 1.6} fill="#fff" opacity={(0.25 + 0.6 * azar(i * 5)) * (1 - amanece) * (0.7 + 0.3 * Math.sin(t * 2 + i))} />)}
        {/* aurora austral */}
        <g filter={`url(#${uid}b)`} opacity={0.85 * (1 - amanece)}>
          {[0, 1, 2].map((k) => <path key={k} d={`M -100 ${420 + k * 70} C 200 ${300 + k * 60 + Math.sin(t * 0.5 + k) * 50}, 520 ${520 + k * 40 + Math.cos(t * 0.4 + k) * 60}, 1180 ${340 + k * 80}`} fill="none" stroke={`url(#${uid}a)`} strokeWidth={110 - k * 20} />)}
        </g>
        {/* montañas lejanas */}
        <path d={`M 0 ${piso} L 0 930 L 140 840 L 260 910 L 420 800 L 560 900 L 700 850 L 860 920 L 1000 820 L ${W} 900 L ${W} ${piso} Z`} fill="#0E2F40" opacity={0.9} />
        <path d={`M 0 ${piso} L 0 1010 L 180 950 L 330 1000 L 520 930 L 700 1000 L 880 950 L ${W} 1000 L ${W} ${piso} Z`} fill="#194B61" />
        {/* hielo */}
        <rect x={0} y={piso} width={W} height={H - piso} fill={`url(#${uid}h)`} />
        {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M 0 ${piso + 40 + i * 70} Q ${W / 2} ${piso + 20 + i * 70 + Math.sin(i) * 20} ${W} ${piso + 50 + i * 70}`} fill="none" stroke="#fff" strokeOpacity={0.12} strokeWidth={3} />)}
        {/* la base: casa roja con ventana encendida, chimenea y mástil con baliza */}
        <g transform={`translate(560 ${piso + 4})`}>
          <ellipse cx={0} cy={6} rx={260} ry={22} fill="#000" opacity={0.35} />
          <rect x={-190} y={-170} width={380} height={170} fill="#B0372C" />
          <rect x={-190} y={-170} width={380} height={18} fill="#D6554A" />
          <polygon points="-210,-170 0,-250 210,-170" fill="#7C2119" />
          <polygon points="-210,-170 0,-250 0,-236 -190,-166" fill="#9C2F25" />
          {[-120, -10].map((wx) => <g key={wx}><rect x={wx} y={-125} width={84} height={70} rx={4} fill="#2A1A14" /><rect x={wx + 5} y={-120} width={74} height={60} rx={3} fill="#FFD27A" opacity={ventana} /><circle cx={wx + 42} cy={-90} r={110} fill={`url(#${uid}w)`} opacity={0.7 * ventana} /><line x1={wx + 42} y1={-120} x2={wx + 42} y2={-60} stroke="#6B3A12" strokeWidth={3} /></g>)}
          <rect x={110} y={-110} width={56} height={110} fill="#5A1A14" /><circle cx={138} cy={-60} r={4} fill="#FFD27A" opacity={ventana} />
          <rect x={120} y={-300} width={26} height={90} fill="#5A1A14" />
          {[0, 1, 2, 3].map((i) => <circle key={i} cx={132 + i * 18 + Math.sin(t + i) * 8} cy={-310 - i * 40} r={14 + i * 9} fill="#fff" opacity={0.18 - i * 0.035} />)}
          <line x1={-240} y1={0} x2={-240} y2={-340} stroke="#C9D3DC" strokeWidth={6} /><circle cx={-240} cy={-346} r={7} fill="#FF3B2D" opacity={Math.sin(t * 5) > 0 ? 1 : 0.15} />
          <path d={`M -238 -330 L -170 ${-318 + Math.sin(t * 6) * 4} L -238 -300 Z`} fill="#E23B2E" />
        </g>
        {/* ventisca */}
        {Array.from({ length: 110 }, (_, i) => {
          const v = (60 + azar(i * 2.3) * 160) * viento;
          const x = ((azar(i * 5.1) * (W + 400) - t * v * 3.2) % (W + 400) + (W + 400)) % (W + 400) - 100;
          const y = (azar(i * 7.7) * H + t * v * 0.35) % H;
          return <line key={i} x1={x} y1={y} x2={x + 30 + 30 * viento * azar(i)} y2={y + 6} stroke="#fff" strokeOpacity={(0.12 + 0.35 * azar(i * 9)) * Math.min(1, viento)} strokeWidth={1.4 + azar(i * 3) * 2.4} strokeLinecap="round" />;
        })}
        <rect width={W} height={H} fill={`url(#${uid}v)`} />
      </svg>
      {children}
    </div>
  );
};

export { aclarar, clamp, easeOut, lerp, mezclar, oscurecer, ruido };
