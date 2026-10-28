/**
 * «Los 4 tejidos» (SINAPSIS) · escenas 2/2
 *   tej-hueso     el hueso se renueva de arriba abajo mientras un contador sube hasta 10 años (demolición y construcción)
 *   tej-muscular  un corazón en un plato, con oxígeno: se corta el cable del cerebro y sigue latiendo (marcapasos + ECG)
 *   tej-nervioso  vida de las células: renovaciones sin fin (estómago, piel, glóbulo rojo) frente a una neurona que dura toda la vida
 */
import React from "react";
import { TEJ, TTJ } from "../../anim/piezas";
import { useUid } from "../../estudio/util";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, spr, useReloj } from "../comun";
import { Estudio, Frases, FONT, MONOF, RE } from "./real-kit";
import { Dato, Fuente } from "./real1";
import { Chip } from "./med1";
import { TJ, latido } from "./tej1";

type P = { e: EscenaViralGuardada };

/* ───────────── tej-hueso ───────────── */

/** Silueta de hueso largo en vertical (origen: centro). Se dibuja como unión de formas con un contorno común. */
const FormaHueso: React.FC<{ fill: string; stroke?: string; sw?: number }> = ({ fill, stroke, sw = 0 }) => (
  <g fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
    <rect x={-52} y={-300} width={104} height={600} rx={34} />
    <circle cx={-52} cy={-318} r={50} /><circle cx={50} cy={-338} r={50} />
    <circle cx={-52} cy={318} r={50} /><circle cx={50} cy={338} r={50} />
  </g>
);

export const TejHueso: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const uid = useUid();
  const U = TTJ.hueso;
  const entra = spr(f, a(U.hueso), { damping: 14, stiffness: 130, mass: 0.8 });
  const p = clamp((t - a(U.barrido)) / a(U.barridoDur));
  const anios = Math.round(TEJ.huesoAnios * p);
  const top = -390, alto = 780;
  const yScan = top + alto * p;
  const chip = clamp((t - a(U.chip - 1.1)) / a(0.4));
  return (
    <Estudio piso={1600} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`${uid}vi`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6F7C8A" /><stop offset="0.5" stopColor="#A5B0BC" /><stop offset="1" stopColor="#566371" /></linearGradient>
          <linearGradient id={`${uid}nu`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#E8D3A0" /><stop offset="0.45" stopColor="#FFF4D6" /><stop offset="1" stopColor="#C9A862" /></linearGradient>
          <clipPath id={`${uid}ar`}><rect x={-200} y={top} width={400} height={Math.max(0.01, yScan - top)} /></clipPath>
          <clipPath id={`${uid}ab`}><rect x={-200} y={yScan} width={400} height={alto + 100} /></clipPath>
        </defs>
        <g transform={`translate(330 ${940 + (1 - entra) * 80}) rotate(8)`} opacity={clamp(entra * 1.6)}>
          <FormaHueso fill="#0B1828" stroke="#BFE0FF" sw={7} />
          <g clipPath={`url(#${uid}ab)`}>
            <FormaHueso fill={`url(#${uid}vi)`} />
          </g>
          <g clipPath={`url(#${uid}ar)`}>
            <FormaHueso fill={`url(#${uid}nu)`} />
            {Array.from({ length: 9 }, (_, k) => <path key={k} d={`M -40 ${-280 + k * 70} Q 0 ${-250 + k * 70} 40 ${-280 + k * 70}`} fill="none" stroke="#C9A862" strokeOpacity={0.5} strokeWidth={3} />)}
          </g>
          {p > 0 && p < 1 && (
            <g>
              <rect x={-130} y={yScan - 5} width={260} height={10} rx={5} fill={TJ.con} opacity={0.95} />
              <rect x={-130} y={yScan - 22} width={260} height={44} rx={20} fill={TJ.con} opacity={0.2} />
            </g>
          )}
        </g>
      </svg>
      <Dato valor={anios} x={760} y={800} px={170} digitos={2} color={TJ.con} id="hueso-anios" opacidad={clamp((t - a(U.barrido - 0.1)) / 0.3)} />
      <div data-texto="hueso-anios-lbl" style={{ position: "absolute", left: 600, width: 360, top: 905, fontFamily: FONT, fontWeight: 800, fontSize: 52, color: RE.blanco, textAlign: "center", opacity: clamp((t - a(U.barrido)) / 0.4) }}>años</div>
      <Chip texto="demolición" x={770} y={1100} color={RE.rojo} ancho={300} id="hueso-demo" opacidad={chip} />
      <Chip texto="construcción" x={770} y={1180} color={TJ.con} ancho={300} id="hueso-const" opacidad={chip} />
      <Frases frases={[{ t: 0.2, texto: "tus huesos", color: TJ.con, px: 108 }, { t: 1.3, texto: "también son\nconectivo", px: 92 }, { t: 3.3, texto: "casi un esqueleto\nnuevo", color: RE.hielo, px: 84 }]} y={385} id="tej-hueso-t" />
      <Fuente texto="Remodelado óseo del adulto: el esqueleto se renueva casi por completo en ≈ 10 años (aproximación; varía según hueso y edad)" y={1464} delay={3.8} />
    </Estudio>
  );
};

/* ───────────── tej-muscular ───────────── */

const g = (m: number, c: number, s: number): number => Math.exp(-((m - c) * (m - c)) / (2 * s * s));
/** Un latido del ECG en m ∈ [0,1): onda P, complejo QRS y onda T (−1…1). */
const ecg = (m: number): number => 0.14 * g(m, 0.15, 0.03) - 0.16 * g(m, 0.38, 0.012) + 1.0 * g(m, 0.42, 0.012) - 0.26 * g(m, 0.46, 0.014) + 0.28 * g(m, 0.7, 0.05);

const CORAZON = "M 0 76 C -128 4 -116 -96 -52 -96 C -26 -96 0 -76 0 -54 C 0 -76 26 -96 52 -96 C 116 -96 128 4 0 76 Z";

export const TejMuscular: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const uid = useUid();
  const M = TTJ.muscular;
  const entra = spr(f, a(M.corazon), { damping: 13, stiffness: 130, mass: 0.8 });
  const corte = clamp((t - a(M.corte)) / a(0.5));
  const nodo = clamp((t - a(M.nodo - 0.3)) / a(0.4));
  const chip = clamp((t - a(M.chip - 1.2)) / a(0.4));
  const lat = latido(t);
  const esc = 2.15 * (1 + 0.075 * lat);
  const HX = 540, HY = 1000;
  // señal del cerebro al corazón: pulsos que viajan por el cable hasta que se corta
  const cable = "M 250 735 C 300 860 400 880 470 930";
  const ndx = HX + 58 * esc, ndy = HY - 62 * esc;
  const burbujas = Array.from({ length: 7 }, (_, k) => {
    const ciclo = (t * (46 + k * 5) + k * 67) % 260;
    return { x: 300 + ((k * 119) % 480) + 8 * Math.sin(t * 2 + k), y: 1160 - ciclo, o: 0.5 * (1 - ciclo / 260) };
  });
  const N = 96, X0 = 120, AN = 840;
  const trazo = Array.from({ length: N + 1 }, (_, k) => {
    const x = X0 + (k / N) * AN;
    const u = (x - X0) / 254 + 1.1 * t + 0.863;
    const m = u - Math.floor(u);
    return `${k ? "L" : "M"} ${x.toFixed(1)} ${(1370 - 88 * ecg(m)).toFixed(1)}`;
  }).join(" ");
  return (
    <Estudio piso={1600} resplandor={0.42}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id={`${uid}co`} cx="38%" cy="30%" r="85%"><stop offset="0" stopColor="#FF8F7E" /><stop offset="0.55" stopColor={TJ.mus} /><stop offset="1" stopColor={TJ.musOsc} /></radialGradient>
          <linearGradient id={`${uid}pl`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D5ECFF" stopOpacity="0.35" /><stop offset="1" stopColor="#7FB3E8" stopOpacity="0.18" /></linearGradient>
        </defs>
        {/* plato de laboratorio: el corazón está fuera del cuerpo */}
        <g opacity={clamp(entra * 1.5)}>
          <ellipse cx={HX} cy={1186} rx={330} ry={46} fill={`url(#${uid}pl)`} stroke={RE.hielo} strokeOpacity={0.6} strokeWidth={3} />
          <ellipse cx={HX} cy={1172} rx={300} ry={34} fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={2} />
          {burbujas.map((b, k) => <circle key={k} cx={b.x} cy={b.y} r={5 + (k % 3) * 2} fill="#E4F4FF" opacity={Math.max(0, b.o) * clamp((t - a(1.0)) / 0.4)} />)}
        </g>
        {/* cerebro y cable */}
        <g opacity={clamp(entra * 1.5)}>
          <g transform="translate(200 690)" opacity={1 - 0.5 * corte}>
            <ellipse cx={-26} cy={0} rx={62} ry={50} fill="#E5A3B8" stroke="#F8D3DF" strokeWidth={3} />
            <ellipse cx={30} cy={-4} rx={58} ry={48} fill="#EDB5C7" stroke="#F8D3DF" strokeWidth={3} />
            <path d="M -62 -10 Q -40 -30 -20 -8 Q 0 16 18 -12 Q 38 -34 60 -8 M -48 18 Q -24 6 -4 22 M 18 24 Q 40 8 58 24" fill="none" stroke="#C57E96" strokeWidth={3.5} strokeLinecap="round" />
          </g>
          {corte < 1 ? (
            <g>
              <path d={cable} fill="none" stroke={TJ.con} strokeWidth={9} strokeLinecap="round" strokeDasharray="14 12" opacity={1 - corte} />
              {[0, 1, 2].map((k) => {
                const u = ((t * 0.9 + k / 3) % 1);
                return <circle key={k} cx={250 + 220 * u} cy={735 + 195 * Math.sin(u * 1.6)} r={9} fill="#FFF1B0" opacity={(1 - corte) * Math.sin(Math.PI * u)} />;
              })}
            </g>
          ) : null}
        </g>
        {/* corazón */}
        <g transform={`translate(${HX} ${HY}) scale(${esc})`} opacity={clamp(entra * 1.6)}>
          <path d="M -30 -80 L -34 -118 Q -34 -134 -20 -134 L -12 -134 L -12 -80 Z M 14 -84 L 20 -126 Q 24 -138 38 -134 L 44 -132 L 34 -84 Z" fill="#C93A2B" stroke="#FF9A8A" strokeWidth={2} />
          <path d={CORAZON} fill={`url(#${uid}co)`} stroke="#FFB4A8" strokeWidth={3} strokeLinejoin="round" />
          <path d="M -70 -62 C -92 -40 -88 -8 -72 12" fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={6} strokeLinecap="round" />
          <path d="M -8 -20 C 10 -30 28 -10 18 10" fill="none" stroke={TJ.musOsc} strokeOpacity={0.55} strokeWidth={4} strokeLinecap="round" />
        </g>
        {corte > 0 && (
          <g transform="translate(300 790)" opacity={Math.min(1, corte * 2)}>
            <g stroke={RE.rojo} strokeWidth={14} strokeLinecap="round"><line x1={-26} y1={-26} x2={26} y2={26} /><line x1={26} y1={-26} x2={-26} y2={26} /></g>
          </g>
        )}
        {/* nodo sinusal: chispa que marca cada latido */}
        <g opacity={nodo}>
          <circle cx={ndx} cy={ndy} r={14 + 10 * lat} fill={TJ.con} opacity={0.35 + 0.4 * lat} />
          <circle cx={ndx} cy={ndy} r={8} fill="#FFF1B0" stroke={TJ.con} strokeWidth={3} />
          {lat > 0.02 && <circle cx={ndx} cy={ndy} r={20 + 70 * (1 - lat)} fill="none" stroke={TJ.con} strokeWidth={4} strokeOpacity={0.6 * lat} />}
          <line x1={ndx + 12} y1={ndy - 10} x2={760} y2={800} stroke={TJ.conClaro} strokeOpacity={0.6} strokeWidth={2.5} />
        </g>
        {/* ECG */}
        <g opacity={clamp((t - a(0.6)) / 0.5)}>
          <line x1={X0} y1={1370} x2={X0 + AN} y2={1370} stroke="#16304A" strokeWidth={2} />
          <path d={trazo} fill="none" stroke={TJ.con} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
      <Chip texto="marcapasos propio" x={800} y={770} color={TJ.conClaro} ancho={360} id="mus-marcapasos" opacidad={nodo} />
      <Chip texto="con oxígeno" x={240} y={1250} color={RE.hielo} ancho={260} id="mus-oxigeno" opacidad={clamp((t - a(1.0)) / 0.4)} />
      <Chip texto="sin cerebro" x={218} y={600} color={RE.rojo} ancho={250} id="mus-sin" opacidad={corte} />
      <div data-texto="mus-ecg" style={{ position: "absolute", left: 120, top: 1400, fontFamily: MONOF, fontWeight: 700, fontSize: 24, color: TJ.conClaro, opacity: chip }}>ECG: su ritmo eléctrico, sin órdenes</div>
      <Frases frases={[{ t: 0.2, texto: "muscular", color: TJ.mus, px: 108 }, { t: 1.7, texto: "sin cerebro", color: RE.rojo, px: 104 }, { t: 3.0, texto: "¡sigue\nlatiendo!", color: RE.oro, px: 100 }]} y={385} id="tej-muscular-t" />
      <Fuente texto="Corazón aislado con perfusión de oxígeno y nutrientes (preparación de Langendorff): el nodo sinusal marca el ritmo" y={1470} delay={3.8} />
    </Estudio>
  );
};

/* ───────────── tej-nervioso ───────────── */

const FILAS = [
  { n: "revestimiento del estómago · 3–5 días", color: TJ.epi, paso: 7 },
  { n: "piel (epidermis) · 2–4 semanas", color: "#7DD3C8", paso: 11 },
  { n: "glóbulo rojo · ≈ 120 días", color: TJ.sangre, paso: 26 },
  { n: "neurona de la corteza · toda tu vida", color: TJ.ner, paso: 0 },
] as const;

export const TejNervioso: React.FC<P> = () => {
  const { t, a } = useReloj();
  const uid = useUid();
  const R = TTJ.nervioso;
  const neurona = clamp((t - a(R.neurona)) / a(0.5));
  const chip = clamp((t - a(R.chip - 0.4)) / a(0.4));
  const BX = 120, BW = 840, BH = 58;
  return (
    <Estudio piso={1600} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`${uid}ne`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#9EC0FF" /><stop offset="1" stopColor="#4C7DFF" /></linearGradient>
        </defs>
        {FILAS.map((fi, i) => {
          const y = 600 + i * 170;
          const k = easeOut((t - a(R.fila(i))) / a(i === 3 ? 1.4 : 0.8));
          const esN = i === 3;
          return (
            <g key={i} opacity={clamp(k * 3)}>
              {esN && neurona > 0 && <rect x={BX - 14} y={y + 16} width={BW + 28} height={BH + 28} rx={28} fill={TJ.ner} opacity={0.28 * neurona * (0.7 + 0.3 * Math.sin(t * 5))} />}
              <rect x={BX} y={y + 30} width={BW} height={BH} rx={20} fill="#10263B" stroke={fi.color} strokeOpacity={0.35} strokeWidth={2} />
              <rect x={BX} y={y + 30} width={Math.max(2, BW * k)} height={BH} rx={20} fill={esN ? `url(#${uid}ne)` : fi.color} opacity={esN ? 1 : 0.9} />
              {!esN && Array.from({ length: Math.floor(BW / fi.paso) }, (_, j) => {
                const x = BX + (j + 1) * fi.paso;
                return x < BX + BW * k ? <line key={j} x1={x} y1={y + 30} x2={x} y2={y + 30 + BH} stroke="#0B1828" strokeOpacity={0.7} strokeWidth={fi.paso > 12 ? 3 : 1.6} /> : null;
              })}
              <text x={BX} y={y + 16} fontFamily={MONOF} fontWeight={700} fontSize={25} fill={esN ? TJ.nerClaro : RE.hielo} letterSpacing="0.03em">{fi.n}</text>
            </g>
          );
        })}
        <g opacity={neurona}>
          <text x={BX} y={1350} fontFamily={MONOF} fontWeight={700} fontSize={24} fill={RE.hielo}>● nacimiento</text>
          <text x={BX + BW} y={1350} textAnchor="end" fontFamily={MONOF} fontWeight={700} fontSize={24} fill={TJ.nerClaro}>hoy ▶</text>
        </g>
      </svg>
      <Chip texto="la misma edad que tú" x={W / 2} y={1420} color={TJ.nerClaro} ancho={560} id="ner-edad" opacidad={chip} />
      <Frases frases={[{ t: 0.2, texto: "nervioso", color: TJ.ner, px: 108 }, { t: 1.5, texto: "no se renueva", px: 100 }, { t: 3.0, texto: "tu misma edad", color: RE.oro, px: 100 }]} y={385} id="tej-nervioso-t" />
      <Fuente texto="Spalding, PNAS 2006 (neocorteza: neuronas = edad de la persona) · Sender y Milo, Nat Med 2021 · hipocampo adulto: en debate" y={1462} delay={3.9} />
    </Estudio>
  );
};
