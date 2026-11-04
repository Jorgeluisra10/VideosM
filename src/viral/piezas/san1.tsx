/**
 * «El viaje de una gota de sangre» (SINAPSIS · anatomía humana) · escenas 1/2
 *   san-gancho   una gota brillante late en la oscuridad y un anillo marca la vuelta de ≈ 1 minuto; la cámara cae dentro (gancho)
 *   san-corazon  corte del ventrículo izquierdo: el músculo se contrae, la válvula se abre y 70 mL salen por la aorta (≈ 7.000 L al día)
 *   san-aorta    vuelo dentro de la aorta (≈ 3 cm): paredes que laten, glóbulos que pasan y ramas que se abren
 *   san-ramas    árbol arterial que se ramifica de ≈ 3 cm a ≈ 8 µm, comparado con un cabello (≈ 70 µm)
 * Esquemas de fisiología en reposo; el tiempo del viaje (≈ 1 min) es un cálculo propio (volumen de sangre ÷ gasto cardíaco).
 */
import React from "react";
import { SAN, TSAN, avancePulsatil, litrosPorDia, sistole } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { H, W, LineaCap, clamp, easeInOut, easeOut, lerp, mezclar, spr, useReloj } from "../comun";
import { Lectura } from "./jet-kit";
import { Frases, FONT, MONOF } from "./real-kit";
import { Fuente } from "./real1";
import { DefGlobulo, Gota, GlobuloRojo, Ruta, RelojViaje, SA, Tubo, sua } from "./san-kit";

type P = { e: EscenaViralGuardada };

export const Cap: React.FC<{ e: EscenaViralGuardada }> = ({ e }) => (e.cap ? <LineaCap texto={e.cap} y={290} px={28} delay={0.12} id="cap-pieza" color={SA.hielo} x={400} ancho={560} /> : null);
export const Fondo: React.FC<{ children?: React.ReactNode }> = ({ children }) => <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: SA.fondo }}>{children}</div>;

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

/* ───────────── san-gancho ───────────── */

export const SanGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TSAN.gancho;
  const kg = spr(f, a(G.gota), { damping: 12, stiffness: 90, mass: 1 });
  const ka = clamp((t - a(G.anillo)) / a(G.anilloDur));
  const caer = clamp((t - a(G.cae)) / a(0.9));
  const R = 330, C = 2 * Math.PI * R, an = ka * Math.PI * 2 - Math.PI / 2;
  const sis = sistole(t);
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><filter id="san-bk" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter></defs>
        {Array.from({ length: 16 }, (_, i) => {
          const x = azar(i * 3.1) * W + Math.sin(t * 0.3 + i) * 40, y = ((azar(i * 5.7) * H - t * (14 + azar(i) * 24)) % H + H) % H;
          return <circle key={i} cx={x} cy={y} r={30 + azar(i * 2.9) * 70} fill={SA.sangre} opacity={0.06 + 0.06 * azar(i * 7.7)} filter="url(#san-bk)" />;
        })}
        <g transform={`translate(0 ${caer * caer * 900}) scale(${1}) `} opacity={1 - clamp((caer - 0.55) * 2.2)}>
          <g opacity={clamp(ka * 6)}>
            <circle cx={540} cy={930} r={R} fill="none" stroke="#BFE0FF" strokeOpacity={0.18} strokeWidth={8} />
            <circle cx={540} cy={930} r={R} fill="none" stroke={SA.clara} strokeWidth={9} strokeLinecap="round" strokeDasharray={`${C * ka} ${C}`} transform="rotate(-90 540 930)" />
            <circle cx={540 + Math.cos(an) * R} cy={930 + Math.sin(an) * R} r={16} fill="#fff" stroke={SA.clara} strokeWidth={6} />
          </g>
          <Gota x={540} y={930} s={1.0 * (0.55 + 0.45 * clamp(kg))} t={t} latido={sis} opacidad={clamp(kg * 2)} />
        </g>
        <g transform={`translate(540 930) scale(${1 + caer * 9}) translate(-540 -930)`} opacity={clamp(caer * 2) * (1 - clamp((caer - 0.8) * 5))}>
          <circle cx={540} cy={930} r={120} fill={SA.clara} opacity={0.5} />
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "UNA GOTA DE\nTU SANGRE", px: 104 }, { t: G.frase2, texto: "DA LA VUELTA\nEN ≈ 1 MINUTO", px: 92, color: SA.oro }]} y={450} x={104} id="titular-san-gancho" />
      <Lectura x={540} y={1318} ancho={880} alinear="center" titulo="UNA VUELTA COMPLETA" valor={`≈ ${Math.max(0, Math.round(ka * SAN.vueltaS))} s`} px={72} color="#fff" opacidad={clamp(ka * 5) * (1 - caer)} id="gancho-vuelta" colorTitulo={SA.hielo} />
      <Fuente texto="Una vuelta ≈ volumen de sangre (≈ 5 L) ÷ gasto cardíaco en reposo (≈ 5 L/min): cálculo propio." y={1495} delay={G.anillo} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── san-corazon ───────────── */

const MIO = "M 330 820 C 296 1000 400 1230 560 1296 C 744 1232 830 1030 796 836 C 706 758 456 748 330 820 Z";
const AORTA = "M 690 850 C 690 740 700 660 780 640 C 880 616 960 680 952 790";
const RUTA_CORAZON: [number, number][] = [[360, 730], [420, 790], [430, 860], [470, 950], [560, 990], [650, 920], [690, 850], [700, 760], [760, 690], [860, 660], [930, 720], [950, 800]];

export const SanCorazon: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TSAN.corazon;
  const kc = spr(f, a(C.camara), { damping: 14, stiffness: 100, mass: 0.9 });
  const sis = sistole(t);
  const av = avancePulsatil(t);
  const fac = 0.7 - 0.12 * sis;
  const abM = 1 - Math.pow(sis, 0.5), abA = clamp(sis * 1.5);
  const celdas = React.useMemo(() => Array.from({ length: 26 }, (_, i) => ({ off: i / 26 + azar(i * 3.1) * 0.02, dx: (azar(i * 5.1) - 0.5) * 22, dy: (azar(i * 7.3) - 0.5) * 22, ph: azar(i * 9.9) * 6.28, w: (azar(i * 2.2) - 0.5) * 4 })), []);
  const stat = (t0: number): number => spr(f, a(t0), { damping: 11, stiffness: 200, mass: 0.7 });
  const k1 = stat(C.ml), k2 = stat(C.minuto), k3 = stat(C.dia);
  const litros = litrosPorDia(SAN.mlLatido, SAN.lpm);
  const cnt = (t0: number, dur: number): number => easeOut((t - a(t0)) / a(dur));
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="san-mio" cx="40%" cy="30%" r="85%"><stop offset="0" stopColor="#B3465A" /><stop offset="0.55" stopColor="#7A1F32" /><stop offset="1" stopColor="#3A0A16" /></radialGradient>
          <radialGradient id="san-cam" cx="45%" cy="35%" r="80%"><stop offset="0" stopColor="#7A0F26" /><stop offset="0.6" stopColor="#4A0716" /><stop offset="1" stopColor="#25030B" /></radialGradient>
          <radialGradient id="san-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FF2A45" stopOpacity="0.4" /><stop offset="1" stopColor="#FF2A45" stopOpacity="0" /></radialGradient>
        </defs>
        <DefGlobulo id="san-gr" oxi={1} />
        <g opacity={clamp(kc * 2)} transform={`translate(540 950) scale(${0.85 * (1 + 0.012 * sis)}) translate(-540 -950)`}>
          <ellipse cx={560} cy={1010} rx={420} ry={360} fill="url(#san-glow)" opacity={0.6 + 0.4 * sis} />
          {/* aorta */}
          <path d={AORTA} fill="none" stroke="#2A0610" strokeWidth={112} strokeLinecap="round" />
          <path d={AORTA} fill="none" stroke="#A33A4E" strokeWidth={100} strokeLinecap="round" />
          <path d={AORTA} fill="none" stroke="url(#san-cam)" strokeWidth={72} strokeLinecap="round" />
          {/* aurícula */}
          <ellipse cx={400} cy={738} rx={122} ry={84} fill="#2A0610" /><ellipse cx={400} cy={738} rx={112} ry={74} fill="#8A2A3C" /><ellipse cx={400} cy={738} rx={92} ry={56} fill="url(#san-cam)" />
          {/* miocardio y cámara que se contrae */}
          <path d={MIO} fill="url(#san-mio)" stroke="#2A0610" strokeWidth={8} />
          {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M ${350 + i * 52} ${790 + Math.abs(i - 4) * 6} C ${330 + i * 56} 960 ${420 + i * 40} 1180 ${540 + (i - 4) * 14} 1280`} fill="none" stroke="#E08A97" strokeOpacity={0.1} strokeWidth={5} />)}
          <g transform={`translate(560 850) scale(${fac}) translate(-560 -850)`}>
            <path d={MIO} fill="url(#san-cam)" stroke="#12020A" strokeWidth={6 / fac} />
            {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M ${400 + i * 60} 1180 C ${420 + i * 50} 1100 ${450 + i * 40} 1020 ${480 + i * 30} 960`} fill="none" stroke="#12020A" strokeOpacity={0.4} strokeWidth={6} />)}
          </g>
          {/* válvulas */}
          <g stroke="#F0CFCF" strokeWidth={10} strokeLinecap="round" fill="none">
            <path d={`M 392 836 L ${429 - 14 * (1 - abM)} ${836 + 46 * abM}`} /><path d={`M 466 836 L ${429 + 14 * (1 - abM)} ${836 + 46 * abM}`} />
            <path d={`M 654 846 C 660 ${846 + 30 * (1 - abA)} 676 ${846 + 36 * (1 - abA) - 34 * abA} 690 ${846 + 36 * (1 - abA) - 34 * abA}`} /><path d={`M 726 846 C 720 ${846 + 30 * (1 - abA)} 704 ${846 + 36 * (1 - abA) - 34 * abA} 690 ${846 + 36 * (1 - abA) - 34 * abA}`} />
          </g>
          {/* glóbulos en el recorrido */}
          {celdas.map((c, i) => {
            const u = (av * 0.1 + c.off) % 1;
            const [x, y] = enRuta(RUTA_CORAZON, u);
            const op = clamp(u * 12) * clamp((1 - u) * 12);
            return <GlobuloRojo key={i} x={x + c.dx * (u > 0.28 && u < 0.62 ? 1.4 : 0.3)} y={y + c.dy * (u > 0.28 && u < 0.62 ? 1.4 : 0.3)} r={16} rot={c.ph + t * c.w} tilt={t * 1.6 + c.ph} grad="san-gr" opacidad={op} />;
          })}
          <text x={400} y={744} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={26} fill="#fff" opacity={0.75}>aurícula</text>
          <text x={560} y={1120} textAnchor="middle" fontFamily={MONOF} fontWeight={800} fontSize={28} fill="#fff" opacity={0.8}>VENTRÍCULO IZQUIERDO</text>
          <text x={900} y={860} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={26} fill="#fff" opacity={0.75}>aorta</text>
        </g>
        <Ruta paso={0} prog={0.3} y={1405} opacidad={clamp(kc * 2)} />
      </svg>
      <RelojViaje seg={clamp((t - a(0.2)) / a(5)) * 2} opacidad={clamp(kc * 2)} />
      <Frases frases={[{ t: 0.2, texto: "EL VENTRÍCULO\nIZQUIERDO", px: 90 }, { t: C.ml, texto: "70 mL POR\nLATIDO", px: 100, color: SA.clara }, { t: C.dia - 0.2, texto: "≈ 7.000 L\nAL DÍA", px: 104, color: SA.oro }]} y={450} x={104} id="titular-san-corazon" />
      <div data-texto="corazon-stats" style={{ position: "absolute", left: 90, top: 1262, width: 900, display: "flex", justifyContent: "space-between", fontFamily: FONT }}>
        {[{ k: k1, n: `${Math.round(SAN.mlLatido * cnt(C.ml, 1.2))}`, u: "mL por latido", c: SA.clara }, { k: k2, n: `≈ ${(SAN.gastoLMin * cnt(C.minuto, 1.4)).toFixed(1).replace(".", ",")}`, u: "L por minuto", c: SA.cian }, { k: k3, n: `≈ ${Math.round(litros * cnt(C.dia, 1.6) / 100) * 100 || 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, "."), u: "L por día", c: SA.oro }].map((s, i) => (
          <div key={i} style={{ width: 280, textAlign: "center", opacity: clamp(s.k * 2), transform: `scale(${0.8 + 0.2 * clamp(s.k)})` }}>
            <div style={{ fontWeight: 900, fontSize: 64, lineHeight: 1, color: s.c, textShadow: "0 4px 24px rgba(0,0,0,0.7)" }}>{s.n}</div>
            <div style={{ fontWeight: 600, fontSize: 26, color: SA.hielo, marginTop: 6 }}>{s.u}</div>
          </div>
        ))}
      </div>
      <Fuente texto="Reposo: ≈ 70 mL por latido × 72 latidos/min × 1.440 min ≈ 7.260 L por día (cálculo propio). Esquema del ventrículo izquierdo." y={1500} delay={C.dia} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── san-aorta ───────────── */

export const SanAorta: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const A = TSAN.aorta;
  const sis = sistole(t);
  const kd = clamp((t - a(A.ancho)) / 0.6);
  const kr = clamp((t - a(A.ramas)) / 0.6);
  return (
    <Fondo>
      <Tubo t={t} R={600} cy={900} vel={1.25} pulso={sis} celulas={70} aberturas={6} blancos={2} semilla={4} anillos={24} oxi={1} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={kd * (1 - 0.5 * kr)}>
          <circle cx={540} cy={900} r={300} fill="none" stroke={SA.oro} strokeWidth={5} strokeDasharray="16 12" opacity={0.85} />
          <line x1={240} y1={900} x2={840} y2={900} stroke={SA.oro} strokeWidth={5} />
          <path d="M 240 900 L 270 884 M 240 900 L 270 916 M 840 900 L 810 884 M 840 900 L 810 916" stroke={SA.oro} strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>
        <g opacity={kd}>
          <rect x={430} y={866} width={220} height={68} rx={16} fill="#12030A" stroke={SA.oro} strokeWidth={4} />
          <text x={540} y={914} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={46} fill={SA.oro}>≈ 3 cm</text>
        </g>
        <Ruta paso={1} prog={clamp((t - a(1.0)) / a(6))} y={1405} />
      </svg>
      <RelojViaje seg={2 + clamp(t / a(7)) * 7} />
      <Frases frases={[{ t: 0.2, texto: "SALE POR\nLA AORTA", px: 108 }, { t: A.ancho + 0.2, texto: "≈ 3 cm\nDE ANCHO", px: 104, color: SA.oro }, { t: A.ramas, texto: "Y SE RAMIFICA\nSIN PARAR", px: 92, color: SA.clara }]} y={450} x={104} id="titular-san-aorta" />
      <Fuente texto="Aorta ascendente normal ≈ 2,9–3,3 cm de diámetro. Vista en primera persona: esquema, no a escala." y={1495} delay={A.ancho} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── san-ramas ───────────── */

type Seg = { x0: number; y0: number; x1: number; y1: number; w: number; g: number; i: number };
function generar(x: number, y: number, ang: number, len: number, w: number, g: number, lista: Seg[]): void {
  const x1 = x + Math.sin(ang) * len, y1 = y - Math.cos(ang) * len;
  lista.push({ x0: x, y0: y, x1, y1, w, g, i: lista.length });
  if (g >= 4) return;
  for (const k of [-1, 1]) generar(x1, y1, ang + k * (0.5 + 0.18 * azar(lista.length * 3.7 + k)), len * 0.7, w * 0.56, g + 1, lista);
}

export const SanRamas: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const Rm = TSAN.ramas;
  const segs = React.useMemo(() => { const l: Seg[] = []; generar(640, 1205, 0, 190, 46, 0, l); return l; }, []);
  const nombres = [
    { g: 0, n: "aorta", v: "≈ 3 cm", c: "#FF5A6A" },
    { g: 1, n: "arterias", v: "≈ 4 mm", c: "#FF7A86" },
    { g: 3, n: "arteriolas", v: "≈ 30 µm", c: "#FF9AA2" },
    { g: 4, n: "capilares", v: "≈ 8 µm", c: SA.cian },
  ];
  const kcab = spr(f, a(Rm.cabello), { damping: 12, stiffness: 160, mass: 0.7 });
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs><filter id="san-glo" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" /></filter></defs>
        {segs.map((s) => {
          const ini = Rm.arbol + Rm.genDur * s.g * 0.8;
          const k = easeOut((t - a(ini)) / a(Rm.genDur));
          if (k <= 0.01) return null;
          const col = mezclar("#E0243A", s.g >= 4 ? "#3DE0FF" : "#FF9AA2", clamp(s.g / 4));
          const x1 = lerp(s.x0, s.x1, k), y1 = lerp(s.y0, s.y1, k);
          const u = (t * 0.7 + s.i * 0.137) % 1;
          return (
            <g key={s.i}>
              <line x1={s.x0} y1={s.y0} x2={x1} y2={y1} stroke={col} strokeWidth={Math.max(2, s.w) + 8} strokeLinecap="round" opacity={0.22} filter="url(#san-glo)" />
              <line x1={s.x0} y1={s.y0} x2={x1} y2={y1} stroke={col} strokeWidth={Math.max(2.5, s.w)} strokeLinecap="round" />
              {k > 0.98 && <circle cx={lerp(s.x0, s.x1, u)} cy={lerp(s.y0, s.y1, u)} r={Math.max(2.5, s.w * 0.28)} fill="#fff" opacity={0.85} />}
            </g>
          );
        })}
        {/* nombres y diámetros */}
        {nombres.map((n, i) => {
          const k = clamp((t - a(Rm.arbol + Rm.genDur * n.g * 0.8 + 0.3)) / 0.4);
          return (
            <g key={i} opacity={k} transform={`translate(${90} ${660 + i * 92})`}>
              <circle cx={14} cy={-8} r={Math.max(5, 22 - i * 5)} fill={n.c} />
              <text x={52} y={0} fontFamily={MONOF} fontWeight={700} fontSize={25} fill={SA.hielo}>{n.n}</text>
              <text x={52} y={36} fontFamily={FONT} fontWeight={900} fontSize={36} fill="#fff">{n.v}</text>
            </g>
          );
        })}
        {/* comparación con un cabello */}
        <g opacity={clamp(kcab * 2)} transform={`translate(0 ${(1 - clamp(kcab)) * 30})`}>
          <rect x={90} y={1236} width={900} height={92} rx={22} fill="rgba(10,2,6,0.8)" stroke="rgba(255,154,162,0.4)" strokeWidth={3} />
          <rect x={120} y={1256} width={SAN.cabelloUm * 4.6 * clamp(kcab)} height={14} rx={7} fill="#C9A27A" />
          <rect x={120} y={1286} width={SAN.capilarUm * 4.6 * clamp(kcab)} height={14} rx={7} fill={SA.cian} />
          <text x={470} y={1270} fontFamily={FONT} fontWeight={700} fontSize={26} fill="#E8D0B0">cabello ≈ 70 µm</text>
          <text x={470} y={1302} fontFamily={FONT} fontWeight={700} fontSize={26} fill={SA.cian}>capilar ≈ 8 µm</text>
          <text x={790} y={1288} fontFamily={FONT} fontWeight={900} fontSize={34} fill={SA.oro}>≈ 9 ×</text>
        </g>
        <Ruta paso={2} prog={clamp((t - a(0.3)) / a(6))} y={1405} />
      </svg>
      <RelojViaje seg={9 + clamp(t / a(7)) * 6} />
      <Frases frases={[{ t: 0.2, texto: "CADA RAMA\nES MÁS FINA", px: 100 }, { t: Rm.escala, texto: "CASI 10 VECES\nMÁS FINO QUE\nUN CABELLO", px: 76, color: SA.oro }]} y={450} x={104} id="titular-san-ramas" />
      <Fuente texto="Diámetros aproximados: aorta ≈ 3 cm, arterias ≈ mm, arteriolas ≈ 10–100 µm, capilares ≈ 5–10 µm; cabello ≈ 50–100 µm. Árbol esquemático." y={1495} delay={Rm.escala} />
      <Cap e={e} />
    </Fondo>
  );
};
