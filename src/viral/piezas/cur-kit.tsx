/**
 * Kit del video «¿Real o mito?» (SINAPSIS · curiosidades médicas con humor): estilo concurso de TV caricaturesco, todo en vectores (SVG/HTML) y determinista.
 *   Escenario   escenario azul con reflectores que barren, puntos de semitono, destellos y confeti; sacude lo que lleva dentro cuando cae un sello
 *   Mascota     «Cerebrito»: cerebro con cara (neutral, sorpresa, risa, duda, guiño, triunfo, mareo, enojo) que parpadea y respira
 *   Sello       sello gigante REAL (verde) o MITO (rojo) que cae con golpe, ondas y rayas de impacto
 *   Globo       globo de diálogo con cola que aparece con rebote
 *   Rostro      cara caricaturesca de persona (hombre con bigote o mujer con moño) con emociones y rebote
 *   Cerdo       cara de cerdo caricaturesca
 *   Pluma       pluma para hacer cosquillas
 * Color: azul y amarillo de SINAPSIS · verde = REAL · rojo = MITO · rosa = Cerebrito.
 */
import React from "react";
import { azar } from "../../lib/anim";
import { useUid } from "../../estudio/util";
import { H, W, clamp, easeOut, lerp, mezclar, spr, useReloj } from "../comun";
import { FONT, MONOF } from "./real-kit";
import { CerebroSue } from "./sue-kit";
import { rebote, sua } from "./jet-kit";

export const CU = {
  azul: "#3B82F6",
  azulClaro: "#8EC5FF",
  oscuro: "#0A1033",
  amarillo: "#FACC15",
  rojo: "#EF4444",
  verde: "#22C55E",
  rosa: "#FF8FB1",
  blanco: "#FFFFFF",
  tinta: "#0B1230",
  piel: "#F2C9A0",
} as const;
export { rebote, sua, clamp, lerp, mezclar, easeOut };

/* ───────────── escenario ───────────── */

/** Escenario de concurso. `golpe` = segundo (a ritmo normal) en que cae un sello: sacude el contenido; `confeti` 0–1 = cantidad de confeti. */
export const Escenario: React.FC<{ t: number; golpe?: number; confeti?: number; tono?: string; children?: React.ReactNode }> = ({ t, golpe, confeti = 0, tono = "#1B3A9A", children }) => {
  const { a } = useReloj();
  const uid = useUid();
  const dt = golpe === undefined ? 99 : t - a(golpe);
  const sac = dt >= 0 && dt < 0.5 ? Math.sin(dt * 80) * 12 * (1 - dt / 0.5) : 0;
  const sacY = dt >= 0 && dt < 0.5 ? Math.cos(dt * 70) * 9 * (1 - dt / 0.5) : 0;
  const cols = [CU.amarillo, CU.azulClaro, CU.rosa, CU.verde, "#FFFFFF"];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: CU.oscuro }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#060B26" /><stop offset="0.5" stopColor={tono} /><stop offset="1" stopColor="#0B1650" /></linearGradient>
          <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.28" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
          <pattern id={`${uid}d`} width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="2.6" fill="#fff" opacity="0.09" /></pattern>
          <radialGradient id={`${uid}v`} cx="50%" cy="46%" r="78%"><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.5" /></radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${uid}b)`} />
        <rect width={W} height={H} fill={`url(#${uid}d)`} />
        {[0, 1, 2].map((i) => {
          const ang = Math.sin(t * 0.7 + i * 2.1) * 13 + (i - 1) * 9;
          return <g key={i} transform={`translate(${200 + i * 340} -40) rotate(${ang})`}><polygon points="-26,0 26,0 190,1640 -190,1640" fill={`url(#${uid}s)`} opacity={0.5} /></g>;
        })}
        {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={azar(i * 3.3) * W} cy={azar(i * 5.1 + 1) * H * 0.9} r={1.5 + azar(i * 7.7) * 2.5} fill={CU.amarillo} opacity={0.2 + 0.5 * Math.max(0, Math.sin(t * (1.5 + azar(i) * 2) + i * 2))} />)}
        <rect width={W} height={H} fill={`url(#${uid}v)`} />
      </svg>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${sac}px, ${sacY}px)` }}>{children}</div>
      {confeti > 0 && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {Array.from({ length: Math.round(46 * confeti) }, (_, i) => {
            const v = 0.25 + azar(i * 2.7) * 0.45, y = ((t * v + azar(i * 4.1)) % 1.15) * (H + 160) - 120;
            const x = azar(i * 6.3) * W + Math.sin(t * 2 + i) * 30;
            return <rect key={i} x={-9} y={-5} width={18} height={10} rx={2} fill={cols[i % cols.length]} transform={`translate(${x} ${y}) rotate(${(t * 220 * (0.5 + azar(i)) + i * 40) % 360})`} />;
          })}
        </svg>
      )}
    </div>
  );
};

/* ───────────── Cerebrito ───────────── */

export type Emocion = "neutral" | "sorpresa" | "risa" | "duda" | "guino" | "triunfo" | "mareo" | "enojo";

const Cara: React.FC<{ e: Emocion; t: number; mira: [number, number] }> = ({ e, t, mira }) => {
  const ciclo = t % 3.4;
  const parpadeo = ciclo > 3.25 ? 0.12 : 1;
  const ojo = (cx: number, cerrado: boolean, grande = 1, pupila = 1): React.ReactNode => cerrado
    ? <path d={`M ${cx - 46} -4 Q ${cx} -62 ${cx + 46} -4`} fill="none" stroke="#2A1230" strokeWidth={14} strokeLinecap="round" />
    : (
      <g>
        <ellipse cx={cx} cy={-10} rx={50 * grande} ry={56 * grande * parpadeo} fill="#fff" stroke="#2A1230" strokeWidth={7} />
        <circle cx={cx + mira[0] * 14} cy={-10 + mira[1] * 12} r={(e === "sorpresa" ? 13 : 24) * pupila} fill="#1B1030" />
        <circle cx={cx + mira[0] * 14 + 8} cy={-18 + mira[1] * 12} r={7 * pupila} fill="#fff" />
      </g>
    );
  const espiral = (cx: number): React.ReactNode => {
    let d = `M ${cx} -10`;
    for (let i = 1; i <= 36; i++) { const r = 2 + i * 1.3, an = i * 0.55 + t * 8; d += ` L ${cx + Math.cos(an) * r} ${-10 + Math.sin(an) * r}`; }
    return <g><circle cx={cx} cy={-10} r={52} fill="#fff" stroke="#2A1230" strokeWidth={7} /><path d={d} fill="none" stroke="#2A1230" strokeWidth={6} strokeLinecap="round" /></g>;
  };
  const cejas = (iz: string, de: string): React.ReactNode => <g fill="none" stroke="#2A1230" strokeWidth={13} strokeLinecap="round"><path d={iz} /><path d={de} /></g>;
  const risa = e === "risa" || e === "triunfo";
  return (
    <g>
      {e === "mareo" ? <>{espiral(-95)}{espiral(70)}</> : <>{ojo(-95, risa || e === "guino")}{ojo(70, risa, e === "sorpresa" ? 1.2 : 1)}</>}
      {e === "neutral" && cejas("M -140 -88 Q -95 -104 -50 -88", "M 25 -88 Q 70 -104 115 -88")}
      {e === "sorpresa" && cejas("M -140 -118 Q -95 -150 -50 -118", "M 25 -118 Q 70 -150 115 -118")}
      {e === "duda" && cejas("M -140 -80 Q -95 -92 -50 -100", "M 25 -118 Q 70 -132 115 -108")}
      {e === "guino" && cejas("M -140 -70 Q -95 -84 -50 -76", "M 25 -100 Q 70 -118 115 -100")}
      {e === "enojo" && cejas("M -140 -112 L -50 -76", "M 115 -112 L 25 -76")}
      {(e === "risa" || e === "triunfo") && cejas("M -140 -78 Q -95 -112 -50 -78", "M 25 -78 Q 70 -112 115 -78")}
      {/* mejillas */}
      <circle cx={-165} cy={64} r={30} fill="#FF5C8A" opacity={0.45} /><circle cx={150} cy={64} r={30} fill="#FF5C8A" opacity={0.45} />
      {/* boca */}
      {e === "neutral" && <path d="M -64 100 Q -10 138 44 100" fill="none" stroke="#2A1230" strokeWidth={13} strokeLinecap="round" />}
      {e === "sorpresa" && <ellipse cx={-10} cy={112} rx={30} ry={42} fill="#3A1030" stroke="#2A1230" strokeWidth={8} />}
      {e === "duda" && <path d="M -70 118 Q -45 90 -20 118 T 40 118" fill="none" stroke="#2A1230" strokeWidth={13} strokeLinecap="round" />}
      {e === "guino" && <path d="M -64 106 Q -10 150 56 88" fill="none" stroke="#2A1230" strokeWidth={13} strokeLinecap="round" />}
      {e === "enojo" && <path d="M -64 128 Q -10 98 44 128" fill="none" stroke="#2A1230" strokeWidth={13} strokeLinecap="round" />}
      {e === "mareo" && <path d="M -70 118 Q -45 140 -20 118 T 40 118 T 70 118" fill="none" stroke="#2A1230" strokeWidth={13} strokeLinecap="round" />}
      {risa && <g><path d="M -84 84 Q -10 210 64 84 Z" fill="#3A1030" stroke="#2A1230" strokeWidth={8} strokeLinejoin="round" /><path d="M -50 146 Q -10 190 30 146 Q -10 128 -50 146 Z" fill="#FF6B8B" /></g>}
      {e === "risa" && <g fill="#8EC5FF" opacity={0.9}><ellipse cx={-150} cy={20} rx={9} ry={16} /><ellipse cx={135} cy={20} rx={9} ry={16} /></g>}
      {e === "triunfo" && <g fill={CU.amarillo}>{[[-170, -150], [160, -140], [200, 10]].map(([x, y], i) => <polygon key={i} points="0,-26 8,-8 28,-6 12,6 17,26 0,15 -17,26 -12,6 -28,-6 -8,-8" transform={`translate(${x} ${y}) scale(${0.8 + 0.3 * Math.sin(t * 6 + i)})`} />)}</g>}
    </g>
  );
};

/** Cerebrito, la mascota. `s` = escala (1 ≈ 700 px de ancho); `mira` = hacia dónde mira (−1…1); `salto` = px de rebote. */
export const Mascota: React.FC<{ x: number; y: number; s?: number; emocion?: Emocion; t: number; mira?: [number, number]; salto?: number; opacidad?: number; giro?: number }> = ({ x, y, s = 0.3, emocion = "neutral", t, mira = [0, 0], salto = 0, opacidad = 1, giro = 0 }) => {
  const bob = Math.sin(t * 3.2) * 6 - salto;
  const resp = 1 + Math.sin(t * 3.2) * 0.012;
  return (
    <g transform={`translate(${x} ${y + bob * s * 3}) rotate(${giro}) scale(${s * resp})`} opacity={opacidad}>
      <CerebroSue x={0} y={0} s={1} tono={0} brillo={0.25}>
        <Cara e={emocion} t={t} mira={mira} />
      </CerebroSue>
    </g>
  );
};

/* ───────────── sello REAL / MITO ───────────── */

/** Sello gigante que cae con golpe en el segundo `t0`. */
export const Sello: React.FC<{ tipo: "real" | "mito"; t0: number; x?: number; y?: number; rot?: number; s?: number }> = ({ tipo, t0, x = 540, y = 900, rot = -8, s = 1 }) => {
  const { f, t, a } = useReloj();
  if (t < a(t0)) return null;
  const k = spr(f, a(t0), { damping: 10, stiffness: 320, mass: 0.7 });
  const dt = t - a(t0);
  const col = tipo === "real" ? CU.verde : CU.rojo;
  const texto = tipo === "real" ? "REAL" : "MITO";
  const esc = lerp(2.8, 1, clamp(k)) * s;
  const onda = clamp(dt / 0.5);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {onda < 1 && <circle cx={x} cy={y} r={120 + onda * 520} fill="none" stroke={col} strokeWidth={26 * (1 - onda)} opacity={0.8 * (1 - onda)} />}
      {onda < 1 && Array.from({ length: 14 }, (_, i) => { const an = (i / 14) * Math.PI * 2; return <line key={i} x1={x + Math.cos(an) * (280 + onda * 160)} y1={y + Math.sin(an) * (130 + onda * 90)} x2={x + Math.cos(an) * (360 + onda * 260)} y2={y + Math.sin(an) * (190 + onda * 150)} stroke="#fff" strokeWidth={9} strokeLinecap="round" opacity={0.9 * (1 - onda)} />; })}
      <g transform={`translate(${x} ${y}) rotate(${rot + (1 - clamp(k)) * 10}) scale(${esc})`} opacity={clamp(k * 3)}>
        <rect x={-310} y={-110} width={620} height={220} rx={34} fill={col} opacity={0.96} />
        <rect x={-290} y={-92} width={580} height={184} rx={22} fill="none" stroke="#fff" strokeWidth={7} strokeDasharray="2 0" opacity={0.9} />
        {tipo === "real"
          ? <path d="M -252 6 L -214 46 L -150 -44" fill="none" stroke="#fff" strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M -250 -44 L -158 44 M -158 -44 L -250 44" fill="none" stroke="#fff" strokeWidth={24} strokeLinecap="round" />}
        <text x={86} y={42} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={128} letterSpacing="0.02em" fill="#fff">{texto}</text>
      </g>
    </svg>
  );
};

/* ───────────── globo de diálogo ───────────── */

/** Globo de diálogo (HTML) con cola; (x, y) = esquina superior izquierda. */
export const Globo: React.FC<{ texto: string; x: number; y: number; w: number; t0: number; cola?: "izq" | "der"; color?: string; px?: number; id?: string }> = ({ texto, x, y, w, t0, cola = "izq", color = "#FFFFFF", px = 32, id = "globo" }) => {
  const { f, a } = useReloj();
  const k = spr(f, a(t0), { damping: 11, stiffness: 240, mass: 0.6 });
  if (k <= 0.01) return null;
  return (
    <div data-texto={id} style={{ position: "absolute", left: x, top: y, width: w, opacity: clamp(k * 2.5), transform: `scale(${0.6 + 0.4 * k})`, transformOrigin: cola === "izq" ? "0% 100%" : "100% 100%" }}>
      <div style={{ position: "relative", padding: "16px 24px", borderRadius: 30, background: color, border: `5px solid ${CU.tinta}`, fontFamily: FONT, fontWeight: 800, fontSize: px, lineHeight: 1.18, color: CU.tinta, textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }}>
        {texto}
        <div style={{ position: "absolute", bottom: -20, [cola === "izq" ? "left" : "right"]: 34, width: 34, height: 34, background: color, borderRight: `5px solid ${CU.tinta}`, borderBottom: `5px solid ${CU.tinta}`, transform: "rotate(45deg)" }} />
      </div>
    </div>
  );
};

/* ───────────── personas y animales ───────────── */

export type Gesto = "neutral" | "hic" | "risa" | "serio" | "sorpresa";

/** Cara caricaturesca de persona. `bigote` para el hombre y `mono` para la mujer; `bote` = px que salta; `inclina` = grados. */
export const Rostro: React.FC<{ x: number; y: number; r?: number; gesto?: Gesto; t: number; bigote?: boolean; mono?: boolean; piel?: string; pelo?: string; bote?: number; inclina?: number; mira?: [number, number] }> = ({ x, y, r = 170, gesto = "neutral", t, bigote = false, mono = false, piel = CU.piel, pelo = "#5A3A22", bote = 0, inclina = 0, mira = [0, 0] }) => {
  const uid = useUid();
  const parp = (t % 3.1) > 2.98 ? 0.1 : 1;
  const ojo = (cx: number): React.ReactNode => {
    if (gesto === "risa" || gesto === "hic") return <path d={`M ${cx - 30} 2 Q ${cx} -34 ${cx + 30} 2`} fill="none" stroke="#2A1A12" strokeWidth={9} strokeLinecap="round" />;
    const g = gesto === "sorpresa" ? 1.25 : 1;
    return <g><ellipse cx={cx} cy={-6} rx={30 * g} ry={34 * g * parp} fill="#fff" stroke="#2A1A12" strokeWidth={5} /><circle cx={cx + mira[0] * 8} cy={-6 + mira[1] * 7} r={gesto === "sorpresa" ? 8 : 14} fill="#2A1A12" />{gesto === "serio" && <rect x={cx - 34} y={-44} width={68} height={32} fill={piel} />}</g>;
  };
  return (
    <g transform={`translate(${x} ${y - bote}) rotate(${inclina}) scale(${r / 170})`}>
      <defs><radialGradient id={`${uid}p`} cx="42%" cy="34%" r="75%"><stop offset="0" stopColor={mezclar(piel, "#FFFFFF", 0.35)} /><stop offset="1" stopColor={mezclar(piel, "#B77B52", 0.45)} /></radialGradient></defs>
      <ellipse cx={0} cy={210} rx={110} ry={16} fill="#000" opacity={0.3} />
      {mono && <circle cx={0} cy={-190} r={54} fill={pelo} />}
      <ellipse cx={-168} cy={14} rx={26} ry={40} fill={mezclar(piel, "#B77B52", 0.3)} /><ellipse cx={168} cy={14} rx={26} ry={40} fill={mezclar(piel, "#B77B52", 0.3)} />
      <circle cx={0} cy={0} r={170} fill={`url(#${uid}p)`} stroke="#6B3E22" strokeWidth={6} />
      <path d={mono ? "M -166 -30 C -166 -170 166 -170 166 -30 C 120 -100 -120 -100 -166 -30 Z" : "M -160 -50 C -150 -176 150 -176 160 -50 C 110 -108 -110 -108 -160 -50 Z"} fill={pelo} />
      {ojo(-70)}{ojo(70)}
      <g fill="none" stroke="#3A2416" strokeWidth={11} strokeLinecap="round">
        {gesto === "sorpresa" ? <><path d="M -110 -78 Q -70 -104 -30 -78" /><path d="M 30 -78 Q 70 -104 110 -78" /></> : gesto === "serio" ? <><path d="M -108 -62 L -34 -66" /><path d="M 34 -66 L 108 -62" /></> : <><path d="M -108 -66 Q -70 -86 -32 -66" /><path d="M 32 -66 Q 70 -86 108 -66" /></>}
      </g>
      <circle cx={-110} cy={66} r={24} fill="#FF6B7A" opacity={0.35} /><circle cx={110} cy={66} r={24} fill="#FF6B7A" opacity={0.35} />
      <path d="M -8 20 Q 0 44 14 34" fill="none" stroke="#B77B52" strokeWidth={7} strokeLinecap="round" />
      {bigote && <path d="M -64 84 Q -34 62 0 80 Q 34 62 64 84 Q 34 96 0 90 Q -34 96 -64 84 Z" fill={pelo} />}
      {gesto === "neutral" && <path d="M -44 112 Q 0 128 44 112" fill="none" stroke="#6B2A22" strokeWidth={9} strokeLinecap="round" />}
      {gesto === "serio" && <path d="M -40 118 L 40 118" fill="none" stroke="#6B2A22" strokeWidth={9} strokeLinecap="round" />}
      {gesto === "hic" && <ellipse cx={0} cy={116} rx={20} ry={28} fill="#5A1A1A" stroke="#6B2A22" strokeWidth={6} />}
      {gesto === "sorpresa" && <ellipse cx={0} cy={118} rx={24} ry={32} fill="#5A1A1A" stroke="#6B2A22" strokeWidth={6} />}
      {gesto === "risa" && <g><path d="M -70 96 Q 0 196 70 96 Z" fill="#5A1A1A" stroke="#6B2A22" strokeWidth={7} strokeLinejoin="round" /><path d="M -34 150 Q 0 184 34 150 Q 0 134 -34 150 Z" fill="#FF6B8B" /></g>}
      {gesto === "risa" && <g fill="#8EC5FF"><ellipse cx={-130} cy={20} rx={9} ry={15} /><ellipse cx={130} cy={20} rx={9} ry={15} /></g>}
    </g>
  );
};

/** Cara de cerdo caricaturesca. */
export const Cerdo: React.FC<{ x: number; y: number; r?: number; t: number; bote?: number }> = ({ x, y, r = 120, t, bote = 0 }) => {
  const uid = useUid();
  const c = "#FFA6B8";
  return (
    <g transform={`translate(${x} ${y - bote + Math.sin(t * 4) * 3}) scale(${r / 120})`}>
      <defs><radialGradient id={`${uid}c`} cx="42%" cy="34%" r="75%"><stop offset="0" stopColor="#FFD0DA" /><stop offset="1" stopColor={c} /></radialGradient></defs>
      <polygon points="-96,-58 -60,-130 -22,-84" fill={c} stroke="#C46B84" strokeWidth={5} strokeLinejoin="round" /><polygon points="96,-58 60,-130 22,-84" fill={c} stroke="#C46B84" strokeWidth={5} strokeLinejoin="round" />
      <circle r={110} fill={`url(#${uid}c)`} stroke="#C46B84" strokeWidth={6} />
      <ellipse cx={0} cy={22} rx={52} ry={38} fill="#FF8FA5" stroke="#C46B84" strokeWidth={5} /><ellipse cx={-18} cy={22} rx={9} ry={14} fill="#8A2E48" /><ellipse cx={18} cy={22} rx={9} ry={14} fill="#8A2E48" />
      {[-44, 44].map((cx, i) => <g key={i}><circle cx={cx} cy={-26} r={16} fill="#fff" stroke="#2A1230" strokeWidth={4} /><circle cx={cx + 2} cy={-24} r={7} fill="#2A1230" /></g>)}
      <path d="M -26 66 Q 0 82 26 66" fill="none" stroke="#8A2E48" strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

/** Pluma para hacer cosquillas; origen = punta de la pluma. */
export const Pluma: React.FC<{ x: number; y: number; rot?: number; s?: number }> = ({ x, y, rot = 30, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M 0 0 C 30 -40 50 -110 30 -200 C 70 -150 100 -70 60 -10 C 40 12 14 12 0 0 Z" fill="#F4F8FF" stroke="#8EA7D8" strokeWidth={4} strokeLinejoin="round" />
    <path d="M 0 0 C 14 -60 24 -130 30 -200" fill="none" stroke="#8EA7D8" strokeWidth={5} strokeLinecap="round" />
    {[-30, -60, -90, -120, -150].map((yy, i) => <path key={i} d={`M ${6 + i * 5} ${yy} L ${44 + i * 3} ${yy - 14}`} stroke="#B9CBEE" strokeWidth={3} strokeLinecap="round" />)}
    <path d="M 0 0 L -26 40" stroke="#C9A26B" strokeWidth={9} strokeLinecap="round" />
  </g>
);

/** Insignia numérica «#n» amarilla. */
export const Num: React.FC<{ n: number; x: number; y: number; r?: number; t0?: number }> = ({ n, x, y, r = 54, t0 = 0 }) => {
  const { f, a } = useReloj();
  const k = spr(f, a(t0), { damping: 10, stiffness: 260, mass: 0.6 });
  return (
    <g transform={`translate(${x} ${y}) rotate(-8) scale(${clamp(k) * (r / 54)})`}>
      <circle r={54} fill={CU.amarillo} stroke={CU.tinta} strokeWidth={7} />
      <text x={0} y={22} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={64} fill={CU.tinta}>{n}</text>
    </g>
  );
};

export { FONT, MONOF };
