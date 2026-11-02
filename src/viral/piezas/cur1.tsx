/**
 * «¿Real o mito?» (SINAPSIS · curiosidades médicas con humor) · escenas 1/2
 *   cur-gancho      Cerebrito presenta el concurso: seis cartas con signo de pregunta
 *   cur-hipo        #1 Charles Osborne: 68 años de hipo (1922–1990), con un cerdo y hics que lo hacen saltar → REAL
 *   cur-cosquillas  #2 No puedes hacerte cosquillas: tu cerebelo predice tu propia mano → REAL
 *   cur-chicle      #3 El chicle tragado tarda 7 años: MITO; recorre el tubo digestivo en unos días
 * Cada dato lleva su sello REAL/MITO que cae con golpe y un chiste de Cerebrito.
 */
import React from "react";
import { CUR, TCUR } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { H, W, clamp, easeInOut, easeOut, lerp, mezclar, spr, useReloj } from "../comun";
import { Odometro } from "./anom-ui";
import { Lectura } from "./jet-kit";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { CEREBELO } from "./sue-kit";
import { CU, Cerdo, Escenario, FONT, Globo, MONOF, Mascota, Num, Pluma, Rostro, Sello, rebote, sua } from "./cur-kit";
import { CerebroSue } from "./sue-kit";

type P = { e: EscenaViralGuardada };

/** punto sobre una polilínea a la fracción u (0–1) de su largo */
function enRuta(pts: [number, number][], u: number): [number, number] {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = seg.reduce((s, v) => s + v, 0);
  let d = clamp(u) * total;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) { const k = seg[i] ? Math.min(1, d / seg[i]) : 0; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; }
    d -= seg[i];
  }
  return pts[pts.length - 1];
}

/* ───────────── cur-gancho ───────────── */

export const CurGancho: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const G = TCUR.gancho;
  const km = spr(f, a(G.mascota), { damping: 9, stiffness: 150, mass: 0.8 });
  const emo = t < a(2.6) ? "duda" : "guino";
  return (
    <Escenario t={t}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 9 }, (_, i) => {
          const x = 120 + azar(i * 3.7) * 840, y = 640 + azar(i * 5.3) * 420;
          const k = spr(f, a(0.6 + i * 0.15), { damping: 10, stiffness: 200, mass: 0.6 });
          return <text key={i} x={x} y={y + Math.sin(t * 2 + i) * 10} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={70 + azar(i * 2.3) * 60} fill={CU.amarillo} opacity={0.35 * clamp(k)} transform={`rotate(${-20 + azar(i * 8.1) * 40} ${x} ${y})`}>?</text>;
        })}
        <Mascota x={540} y={900} s={0.6 * (0.5 + 0.5 * km)} emocion={emo} t={t} mira={[Math.sin(t * 1.3), Math.cos(t * 1.1) * 0.5]} opacidad={clamp(km * 2)} giro={Math.sin(t * 2.2) * 3} />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const k = spr(f, a(G.cartas + G.cartaPaso * i), { damping: 11, stiffness: 220, mass: 0.6 });
          const cx = 225 + (i % 3) * 315, cy = 1255 + Math.floor(i / 3) * 170;
          return (
            <g key={i} transform={`translate(${cx} ${cy}) scale(${clamp(k)}) rotate(${(1 - clamp(k)) * 12})`}>
              <rect x={-130} y={-70} width={260} height={140} rx={26} fill="#1D4ED8" stroke={CU.amarillo} strokeWidth={6} />
              <rect x={-130} y={-70} width={260} height={70} rx={26} fill="#fff" opacity={0.1} />
              <text x={0} y={34} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={104} fill="#fff">?</text>
              <circle cx={-96} cy={-38} r={26} fill={CU.amarillo} stroke={CU.tinta} strokeWidth={4} /><text x={-96} y={-28} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={CU.tinta}>{i + 1}</text>
            </g>
          );
        })}
      </svg>
      <Frases frases={[{ t: 0.2, texto: "¿REAL\nO MITO?", px: 132, color: CU.amarillo }, { t: 2.8, texto: "6 DATOS LOCOS\nDE MEDICINA", px: 84 }]} y={450} x={104} id="titular-cur-gancho" />
    </Escenario>
  );
};

/* ───────────── cur-hipo ───────────── */

export const CurHipo: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const H1 = TCUR.hipo;
  const kh = spr(f, a(H1.hombre), { damping: 10, stiffness: 160, mass: 0.8 });
  const kc = spr(f, a(H1.cerdo), { damping: 9, stiffness: 180, mass: 0.7 });
  const ka = easeInOut((t - a(H1.anios)) / a(H1.aniosDur));
  const anio = lerp(CUR.hipo.desde, CUR.hipo.hasta, ka);
  const hs = H1.hic.map((h) => t - a(h));
  const activo = hs.some((d) => d >= 0 && d < 0.3);
  const bote = hs.reduce((s, d) => (d >= 0 && d < 0.4 ? s + 60 * Math.pow(1 - d / 0.4, 2) : s), 0);
  const fin = t >= a(H1.sello);
  return (
    <Escenario t={t} golpe={H1.sello}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(kh * 2)}><Rostro x={300} y={990} r={175} gesto={fin ? "sorpresa" : activo ? "hic" : "neutral"} t={t} bigote bote={bote} inclina={Math.sin(t * 9) * (activo ? 4 : 0)} /></g>
        {H1.hic.map((h, i) => {
          const d = t - a(h);
          if (d < 0 || d > 0.9) return null;
          const k = easeOut(d / 0.25);
          return <text key={i} x={470 + (i % 2) * 40} y={800 - i * 6 - d * 40} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={68 * (0.6 + 0.4 * k)} fill={CU.amarillo} stroke={CU.tinta} strokeWidth={9} paintOrder="stroke" opacity={1 - clamp((d - 0.5) / 0.4)} transform={`rotate(${-12 + i * 7} 470 800)`}>¡HIC!</text>;
        })}
        {/* calendario */}
        <g opacity={clamp((t - a(H1.anios - 0.3)) / 0.4)}>
          <rect x={590} y={650} width={400} height={176} rx={26} fill="#fff" stroke={CU.tinta} strokeWidth={7} />
          <rect x={590} y={650} width={400} height={52} rx={26} fill={CU.rojo} /><rect x={590} y={680} width={400} height={22} fill={CU.rojo} />
          <text x={790} y={690} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={28} fill="#fff" letterSpacing="0.2em">AÑO</text>
        </g>
        <g opacity={clamp(kc * 2)}><Cerdo x={800} y={1115} r={112} t={t} bote={kc < 1 ? (1 - kc) * 80 : 0} /></g>
        <Mascota x={150} y={1395} s={0.25} emocion={fin ? "risa" : "sorpresa"} t={t} mira={[0.6, 0]} />
        <Num n={1} x={110} y={520} t0={0.1} r={50} />
      </svg>
      <Odometro valor={anio} x={790} y={770} px={88} digitos={4} separador="" color={CU.tinta} id="hipo-anio" opacidad={clamp((t - a(H1.anios - 0.3)) / 0.4)} />
      <Lectura x={790} y={850} ancho={420} alinear="center" valor={`${Math.round(ka * CUR.hipo.anios)} años`} px={72} color={CU.amarillo} opacidad={clamp((t - a(H1.anios)) / 0.5)} id="hipo-anios" />
      <Lectura x={540} y={1245} ancho={900} alinear="center" valor="≈ 430 millones de hipos (estimado)" px={40} color="#fff" opacidad={clamp((t - a(4.2)) / 0.5)} id="hipo-hipos" />
      <Frases frases={[{ t: 0.2, texto: "EL HIPO\nMÁS LARGO", px: 104 }]} y={450} x={190} id="titular-cur-hipo" />
      <Globo texto="Todo empezó en una granja, con un cerdo." x={290} y={1318} w={690} t0={H1.cerdo + 0.4} cola="izq" px={30} id="hipo-globo" />
      <Sello tipo="real" t0={H1.sello} x={600} y={1030} s={0.82} />
      <Fuente texto="Charles Osborne (1922–1990), récord Guinness del ataque de hipo más largo confirmado. Los 430 millones son un estimado." y={1505} delay={H1.anios} />
    </Escenario>
  );
};

/* ───────────── cur-cosquillas ───────────── */

const Brazo: React.FC<{ x0: number; y0: number; x1: number; y1: number; manga: string }> = ({ x0, y0, x1, y1, manga }) => (
  <g strokeLinecap="round">
    <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#000" strokeOpacity={0.25} strokeWidth={84} transform="translate(5 8)" />
    <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={manga} strokeWidth={80} />
    <line x1={lerp(x0, x1, 0.62)} y1={lerp(y0, y1, 0.62)} x2={x1} y2={y1} stroke={CU.piel} strokeWidth={70} />
    <circle cx={x1} cy={y1} r={38} fill={CU.piel} stroke="#6B3E22" strokeWidth={5} />
  </g>
);

export const CurCosquillas: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const Q = TCUR.cosquillas;
  const kc = spr(f, a(Q.cara), { damping: 12, stiffness: 150, mass: 0.8 });
  const otro = t >= a(Q.otro) && t < a(Q.serio);
  const propio = t >= a(Q.serio);
  const fin = t >= a(Q.sello);
  const gesto = fin ? "sorpresa" : otro ? "risa" : propio ? "serio" : "neutral";
  const circ = (cx: number, cy: number, rr: number, v: number): [number, number] => [cx + Math.cos(t * v) * rr, cy + Math.sin(t * v) * rr * 0.6];
  const [px, py] = circ(700, 1010, 26, 9);
  const [qx, qy] = circ(385, 1010, 26, 9);
  const kce = spr(f, a(Q.cerebelo), { damping: 12, stiffness: 160, mass: 0.7 });
  const pulso = 0.5 + 0.5 * Math.sin(t * 7);
  return (
    <Escenario t={t} golpe={Q.sello}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(kc * 2)}><Rostro x={540} y={960} r={190} gesto={gesto} t={t} bote={otro ? Math.abs(Math.sin(t * 14)) * 18 : 0} inclina={otro ? Math.sin(t * 12) * 5 : 0} piel="#E9B98C" pelo="#2B1B12" mono /></g>
        {otro && (<g><Brazo x0={1120} y0={1150} x1={px + 60} y1={py + 30} manga="#1E3A8A" /><Pluma x={px} y={py} rot={-35} s={0.8} /></g>)}
        {propio && (<g><Brazo x0={-40} y0={1150} x1={qx - 60} y1={qy + 30} manga={CU.azul} /><Pluma x={qx} y={qy} rot={35} s={0.8} /></g>)}
        {/* cerebelo */}
        <g opacity={clamp(kce * 2)} transform={`translate(0 ${(1 - clamp(kce)) * 30})`}>
          <rect x={650} y={610} width={340} height={230} rx={30} fill="rgba(6,12,40,0.78)" stroke={CU.amarillo} strokeWidth={5} />
          <CerebroSue x={800} y={730} s={0.26} tono={0} brillo={0.2}>
            <path d={CEREBELO} fill={CU.amarillo} opacity={0.4 + 0.45 * pulso} />
          </CerebroSue>
        </g>
        <Mascota x={150} y={1395} s={0.25} emocion={fin ? "risa" : propio ? "duda" : "neutral"} t={t} mira={[0.7, 0]} />
        <Num n={2} x={110} y={520} t0={0.1} r={50} />
      </svg>
      {otro && [0, 1, 2].map((i) => {
        const d = (t - a(Q.otro) - i * 0.45) % 1.4;
        return d > 0 ? <div key={i} data-texto={`cosq-jaja-${i}`} style={{ position: "absolute", left: 130 + i * 50, top: 700 + i * 70 - d * 30, fontFamily: FONT, fontWeight: 900, fontSize: 54, color: CU.amarillo, WebkitTextStroke: `6px ${CU.tinta}`, paintOrder: "stroke fill", opacity: 1 - d / 1.4, transform: `rotate(${-14 + i * 12}deg)` }}>JAJA</div> : null;
      })}
      {propio && <div data-texto="cosq-nada" style={{ position: "absolute", left: 180, top: 760, fontFamily: FONT, fontWeight: 900, fontSize: 64, color: "#fff", WebkitTextStroke: `6px ${CU.tinta}`, paintOrder: "stroke fill", opacity: clamp((t - a(Q.serio)) / 0.4) }}>...</div>}
      <div data-texto="cosq-chip" style={{ position: "absolute", left: 140, top: 1180, width: 800, textAlign: "center", opacity: clamp((t - a(Q.otro)) / 0.5) }}>
        <span style={{ display: "inline-block", padding: "10px 28px", borderRadius: 999, background: propio ? CU.azul : "#1E3A8A", border: `4px solid ${CU.amarillo}`, fontFamily: FONT, fontWeight: 900, fontSize: 40, color: "#fff" }}>{propio ? "tú mismo: cero risa" : "otra persona: ¡ja ja ja!"}</span>
      </div>
      <Lectura x={820} y={862} ancho={340} alinear="center" valor="cerebelo: «¡eres tú!»" px={30} color="#fff" opacidad={clamp((t - a(Q.cerebelo)) / 0.5)} id="cosq-cerebelo" />
      <Frases frases={[{ t: 0.2, texto: "COSQUILLAS\nA TI MISMO", px: 100 }]} y={450} x={190} id="titular-cur-cosquillas" />
      <Globo texto="Yo lo intenté. Cero risas." x={290} y={1318} w={600} t0={Q.serio + 0.5} cola="izq" px={30} id="cosq-globo" />
      <Sello tipo="real" t0={Q.sello} x={560} y={1030} s={0.82} />
      <Fuente texto="Blakemore, Wolpert y Frith 1998 (Nature Neuroscience): el cerebelo predice y cancela el toque que tú mismo produces." y={1505} delay={Q.cerebelo} />
    </Escenario>
  );
};

/* ───────────── cur-chicle ───────────── */

const TUBO: [number, number][] = [[280, 715], [280, 800], [300, 880], [380, 955], [520, 985], [660, 960], [750, 1010], [680, 1065], [540, 1085], [430, 1125], [540, 1165], [700, 1165], [830, 1205]];

export const CurChicle: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TCUR.chicle;
  const kb = spr(f, a(C.boca), { damping: 10, stiffness: 180, mass: 0.7 });
  const kcal = spr(f, a(C.siete), { damping: 10, stiffness: 220, mass: 0.6 });
  const tacha = easeOut((t - a(C.tacha)) / a(0.35));
  const mito = t >= a(C.sello);
  const u1 = easeInOut((t - a(0.3)) / a(0.8)) * 0.27;
  const u2 = easeInOut((t - a(C.viaje)) / a(C.viajeDur)) * 0.73;
  const u = u1 + u2;
  const [gx, gy] = enRuta(TUBO, u);
  const d = TUBO.map((p) => p.join(",")).join(" ");
  const dias = ["día 1", "día 2", "día 3"];
  return (
    <Escenario t={t} golpe={C.sello}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* labios */}
        <g opacity={clamp(kb * 2)} transform={`translate(280 668) scale(${0.6 + 0.4 * kb})`}>
          <ellipse cx={0} cy={0} rx={78} ry={44} fill="#C2213E" stroke={CU.tinta} strokeWidth={6} />
          <ellipse cx={0} cy={4} rx={56} ry={20} fill="#4A0A1A" />
          <rect x={-40} y={-14} width={80} height={14} rx={5} fill="#fff" />
        </g>
        {/* tubo digestivo */}
        <g opacity={clamp(kb * 2)}>
          <polyline points={d} fill="none" stroke={CU.tinta} strokeWidth={62} strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={d} fill="none" stroke="#FF9DB2" strokeWidth={50} strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={d} fill="none" stroke="#FFD3DC" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
          <ellipse cx={380} cy={940} rx={120} ry={78} fill="#FF8FA5" stroke={CU.tinta} strokeWidth={6} transform="rotate(-18 380 940)" />
          <ellipse cx={370} cy={925} rx={80} ry={44} fill="#FFC1CF" opacity={0.6} transform="rotate(-18 380 940)" />
        </g>
        {/* chicle */}
        <g transform={`translate(${gx} ${gy}) rotate(${u * 600})`} opacity={clamp(kb * 2)}>
          <rect x={-30} y={-20} width={60} height={40} rx={12} fill="#FF5C9A" stroke={CU.tinta} strokeWidth={5} />
          <rect x={-22} y={-12} width={44} height={10} rx={5} fill="#fff" opacity={0.55} />
        </g>
        {/* calendario de 7 años */}
        <g opacity={clamp(kcal * 2)} transform={`translate(${790} ${760}) scale(${0.6 + 0.4 * clamp(kcal)})`}>
          <rect x={-190} y={-110} width={380} height={220} rx={26} fill="#fff" stroke={CU.tinta} strokeWidth={7} />
          <rect x={-190} y={-110} width={380} height={52} rx={26} fill={CU.rojo} /><rect x={-190} y={-84} width={380} height={26} fill={CU.rojo} />
          <text x={0} y={-72} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={26} fill="#fff" letterSpacing="0.2em">{mito ? "EN REALIDAD" : "SE DICE"}</text>
          <text x={0} y={52} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={mito ? 58 : 92} fill={mito ? CU.verde : CU.tinta}>{mito ? "UNOS DÍAS" : `${CUR.chicle.mitoAnios} AÑOS`}</text>
          {!mito && tacha > 0.02 && <g stroke={CU.rojo} strokeWidth={22} strokeLinecap="round"><line x1={-160} y1={-30} x2={-160 + 320 * tacha} y2={-30 + 120 * tacha} /><line x1={160} y1={-30} x2={160 - 320 * clamp(tacha * 1.1)} y2={-30 + 120 * clamp(tacha * 1.1)} /></g>}
        </g>
        {/* días de viaje */}
        {dias.map((txt, i) => {
          const k = clamp((t - a(C.dias + i * 0.45)) / 0.3);
          const [dx, dy] = enRuta(TUBO, 0.2 + i * 0.36);
          return k > 0 ? <g key={i} transform={`translate(${dx + (i === 1 ? 20 : 0)} ${dy + (i === 1 ? 70 : -62)})`} opacity={k}><rect x={-52} y={-26} width={104} height={44} rx={22} fill={CU.amarillo} stroke={CU.tinta} strokeWidth={4} /><text x={0} y={6} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={26} fill={CU.tinta}>{txt}</text></g> : null;
        })}
        <Mascota x={150} y={1395} s={0.25} emocion={mito ? "risa" : "duda"} t={t} mira={[0.6, 0]} />
        <Num n={3} x={110} y={520} t0={0.1} r={50} />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "EL CHICLE\nDE 7 AÑOS", px: 100 }]} y={450} x={190} id="titular-cur-chicle" />
      <Globo texto="Tranquilo: no se queda a vivir ahí." x={290} y={1318} w={640} t0={C.dias + 0.4} cola="izq" px={30} id="chicle-globo" />
      <Sello tipo="mito" t0={C.sello} x={560} y={1010} s={0.82} rot={7} />
      <Fuente texto="Mito: el chicle no se digiere, pero sale con el tránsito normal en unos días. Tragar mucho de forma habitual sí puede causar obstrucciones." y={1505} delay={C.siete} />
    </Escenario>
  );
};
