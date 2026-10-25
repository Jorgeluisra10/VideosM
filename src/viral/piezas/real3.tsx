/**
 * «Bogotá, la ciudad sin metro» (v3 · figuras realistas) · escenas 3/3
 *   real-resultado  dos cronómetros (hasta 2 h vs 27 min) y dos barras en relieve (43.000 vs 72.000 pasajeros por hora y sentido)
 *   real-plusvalia  torres que suben alrededor de una estación: +11,7 % de valor del suelo a menos de 800 m antes de que ruede el primer tren
 *   real-caminata   5 minutos a pie = −6,8 a −9,3 % de arriendo (Rodríguez y Targa, 2004): persona que camina, edificios y tarjeta académica
 *   real-cierre     marzo de 2028: el skyline, el viaducto con el tren y la pregunta final
 */
import React, { useMemo } from "react";
import { BOG, TR } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { azar } from "../../lib/anim";
import { H, W, clamp, easeInOut, easeOut, lerp, mezclar, spr, useReloj } from "../comun";
import { Odometro } from "./anom-ui";
import { Cronometro, Estudio, FONT, Frases, MONOF, Monedas, Persona, RE, Reflejo, Riel, Sombra, Torre, TrenMetro } from "./real-kit";
import { Dato, Fuente } from "./real1";

type P = { e: EscenaViralGuardada };

/* ───────────── real-resultado ───────────── */

const Barra: React.FC<{ x: number; y: number; w: number; h?: number; color: string; texto: string; valor: string; k: number; colorValor?: string }> = ({ x, y, w, h = 74, color, texto, valor, k, colorValor }) => {
  const ww = w * k, off = 22;
  return (
    <g opacity={clamp(k * 5)}>
      <text x={x} y={y - 18} fontFamily={FONT} fontWeight={700} fontSize={32} fill={RE.blanco}>{texto}</text>
      <polygon points={`${x + ww},${y} ${x + ww + off},${y - off * 0.7} ${x + ww + off},${y + h - off * 0.7} ${x + ww},${y + h}`} fill={mezclar(color, "#000", 0.45)} />
      <polygon points={`${x},${y} ${x + off},${y - off * 0.7} ${x + ww + off},${y - off * 0.7} ${x + ww},${y}`} fill={mezclar(color, "#fff", 0.35)} />
      <rect x={x} y={y} width={ww} height={h} fill={color} />
      <rect x={x} y={y} width={ww} height={h * 0.34} fill="#fff" opacity={0.2} />
      <text x={x + ww + off + 18} y={y + h * 0.7} fontFamily={FONT} fontWeight={800} fontSize={52} fill={colorValor ?? RE.blanco}>{valor}</text>
    </g>
  );
};

export const RealResultado: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const k = easeInOut((t - a(TR.resultado.ini)) / a(TR.resultado.dur));
  const min = 120 * k;
  const kb = easeOut((t - a(TR.resultado.barras)) / a(TR.resultado.barrasDur));
  const llega = spr(f, a(TR.resultado.ini + TR.resultado.dur * 0.225 * 1.25), { damping: 10, stiffness: 190, mass: 0.6 });
  const nums = ["120", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100", "110"];
  return (
    <Estudio piso={1100} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Cronometro x={300} y={760} r={185} valor={min / 120} arco={min / 120} color={RE.rojo} etiqueta="MIN" numeros={nums} />
        <Cronometro x={780} y={760} r={185} valor={Math.min(min, 27) / 120} arco={Math.min(min, 27) / 120} color={RE.oro} etiqueta="MIN" numeros={nums} />
        <Barra x={104} y={1240} w={560} color="#7C97B3" texto="TransMilenio (medido)" valor="43.000" k={kb * (43 / 72)} />
        <Barra x={104} y={1415} w={560} color={RE.oro} texto="Metro (capacidad)" valor="72.000" k={kb} colorValor={RE.oro} />
      </svg>
      <Frases frases={[{ t: 0.3, texto: "resultado" }, { t: 1.6, texto: "43 km/h", color: RE.oro, px: 128 }, { t: 4.2, texto: "2 h → 27 min", px: 100 }, { t: 8.0, texto: "+ 72.000 por hora", color: RE.oro, px: 90 }]} y={400} />
      <div data-texto="res-hoy" style={{ position: "absolute", left: 120, width: 360, top: 990, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 50, color: RE.rojo, opacity: clamp(k * 5) }}>hasta 2 h</div>
      <div data-texto="res-metro" style={{ position: "absolute", left: 600, width: 360, top: 990, textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: 50, color: RE.oro, opacity: clamp(llega * 2), transform: `scale(${0.8 + 0.2 * llega})` }}>27 min</div>
      <div data-texto="res-hoy-etq" style={{ position: "absolute", left: 120, width: 360, top: 1052, textAlign: "center", fontFamily: MONOF, fontSize: 24, color: RE.hielo, opacity: 0.7 * clamp(k * 5) }}>hoy · en hora pico</div>
      <div data-texto="res-metro-etq" style={{ position: "absolute", left: 600, width: 360, top: 1052, textAlign: "center", fontFamily: MONOF, fontSize: 24, color: RE.hielo, opacity: 0.7 * clamp(llega * 2) }}>Línea 1 · estimado</div>
      <Fuente texto="Empresa Metro de Bogotá (27 min; 43 km/h; 72.000 pas/h·sentido) · TransMilenio medido: Univ. Javeriana · «hasta 2 h»: reportes de prensa" y={1610} delay={7} />
    </Estudio>
  );
};

/* ───────────── real-plusvalia ───────────── */

export const RealPlusvalia: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const PISO = 1240;
  const defs = useMemo(() => Array.from({ length: 13 }, (_, i) => {
    const x = 96 + i * 74.5;
    const d = Math.abs(x - 540) / 450;
    return { x, w: 58 + azar(i * 3.7) * 22, hf: 150 + 430 * Math.exp(-3.2 * d * d) * (0.8 + 0.2 * azar(i * 5.3)), d, sem: i + 11 };
  }), []);
  const valor = BOG.plusvalia800 * easeOut((t - a(TR.plusvalia.cifra)) / a(TR.plusvalia.cifraDur));
  const monedas = Math.round(1 + 6 * easeOut((t - a(TR.plusvalia.cifra)) / a(TR.plusvalia.cifraDur)));
  const onda = (t * 0.45) % 1;
  return (
    <Estudio piso={PISO} resplandor={0.55}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Reflejo piso={PISO} intensidad={0.2}>
          {defs.map((d, i) => {
            const k = easeOut((t - a(TR.plusvalia.onda) - d.d * 1.6) / a(1.4));
            return <Torre key={i} x={d.x} y={PISO} w={d.w} h={lerp(70, d.hf, k)} semilla={d.sem} luz={0.15 + 0.6 * k * (1 - d.d)} tono={mezclar("#2B5C86", "#3F8FD0", 1 - d.d)} />;
          })}
        </Reflejo>
        {/* ondas de valor que salen de la estación */}
        {[0, 0.5].map((o) => { const q = (onda + o) % 1; return <ellipse key={o} cx={540} cy={PISO + 24} rx={30 + 410 * q} ry={(30 + 410 * q) * 0.1} fill="none" stroke={RE.oro} strokeWidth={4} opacity={(1 - q) * 0.7 * clamp((t - 1) / 0.6)} />; })}
        {/* estación: marquesina de acero y baliza dorada */}
        <g opacity={clamp((t - 0.5) / 0.6)}>
          <Sombra x={540} y={PISO + 26} rx={130} ry={9} />
          <rect x={532} y={PISO - 150} width={16} height={176} fill="#9AA7B4" /><rect x={532} y={PISO - 150} width={6} height={176} fill="#fff" opacity={0.4} />
          <rect x={420} y={PISO - 172} width={240} height={26} rx={9} fill="#C9D3DD" /><rect x={420} y={PISO - 172} width={240} height={9} rx={4} fill="#fff" opacity={0.7} />
          <circle cx={540} cy={PISO - 230} r={20 + 3 * Math.sin(t * 5)} fill={RE.oro} /><circle cx={540} cy={PISO - 230} r={52} fill={RE.oro} opacity={0.2 + 0.1 * Math.sin(t * 5)} />
          <line x1={540} y1={PISO - 210} x2={540} y2={PISO - 172} stroke={RE.oro} strokeWidth={4} />
        </g>
        {/* cota de 800 m a cada lado */}
        <g opacity={clamp((t - a(TR.plusvalia.onda + 0.6)) / 0.6)}>
          <line x1={130} x2={950} y1={PISO + 84} y2={PISO + 84} stroke={RE.oro} strokeWidth={4} strokeDasharray="12 10" />
          {[130, 540, 950].map((x) => <line key={x} x1={x} x2={x} y1={PISO + 68} y2={PISO + 100} stroke={RE.oro} strokeWidth={5} />)}
          <text x={335} y={PISO + 138} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={28} fill={RE.oro}>800 m</text>
          <text x={745} y={PISO + 138} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={28} fill={RE.oro}>800 m</text>
        </g>
        <Monedas x={930} y={PISO + 150} n={monedas} s={0.5} />
      </svg>
      <Frases frases={[{ t: 0.3, texto: "el efecto oculto" }, { t: 3.2, texto: "+11,7 %", color: RE.esmeralda, px: 132 }, { t: 5.6, texto: "antes del primer tren", px: 74 }]} y={400} />
      <Dato valor={valor} x={W / 2} y={1470} px={150} digitos={3} decimales={1} prefijo="+" sufijo="%" color={RE.esmeralda} id="plus-cifra" opacidad={clamp((t - a(TR.plusvalia.cifra)) / 0.4)} />
      <div data-texto="plus-etq" style={{ position: "absolute", left: 104, width: W - 208, top: 1544, textAlign: "left", fontFamily: FONT, fontWeight: 600, fontSize: 32, lineHeight: 1.2, color: RE.blanco, opacity: clamp((t - a(TR.plusvalia.cifra + 0.8)) / 0.5) }}>valor del suelo a menos de 800 m de las estaciones (2019, al anunciarse). En 2023, ya en obras: +8,8 %.</div>
      <Fuente texto="Análisis con datos catastrales de Bogotá · reseñado por Noticias RCN (verificar el estudio original antes de publicar)" y={1636} delay={6.4} />
    </Estudio>
  );
};

/* ───────────── real-caminata ───────────── */

export const RealCaminata: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const PISO = 1180;
  const k = easeInOut((t - a(TR.caminata.ini)) / a(TR.caminata.dur));
  const xP = lerp(215, 815, k);
  const camina = k > 0 && k < 1;
  const tag = spr(f, a(TR.caminata.tag), { damping: 10, stiffness: 170, mass: 0.7 });
  const reloj = k * (5 / 60);
  const tarjeta = clamp((t - a(6.8)) / 0.6);
  return (
    <Estudio piso={PISO} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Reflejo piso={PISO} intensidad={0.2}>
          <Torre x={330} y={PISO} w={170} h={520} semilla={3} luz={0.65} tono="#2F6FA6" />
          <Torre x={820} y={PISO} w={170} h={520} semilla={9} luz={0.4} tono="#2B4E73" />
          {/* estación */}
          <rect x={146} y={PISO - 150} width={14} height={150} fill="#9AA7B4" /><rect x={90} y={PISO - 170} width={130} height={22} rx={8} fill="#C9D3DD" /><rect x={90} y={PISO - 170} width={130} height={8} rx={4} fill="#fff" opacity={0.7} />
          <circle cx={153} cy={PISO - 210} r={16} fill={RE.oro} />
          <Persona x={xP} y={PISO + 14} s={1.35} fase={camina ? t * 9 : 0} />
        </Reflejo>
        {/* marcas de tiempo caminando */}
        {[[190, "0 min"], [790, "5 min"]].map(([x, tx]) => <g key={tx as string}><line x1={x as number} x2={x as number} y1={PISO + 18} y2={PISO + 50} stroke={RE.oro} strokeWidth={5} /><text x={x as number} y={PISO + 92} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={30} fill={RE.oro}>{tx as string}</text></g>)}
        <line x1={190} x2={xP - 20} y1={PISO + 34} y2={PISO + 34} stroke={RE.oro} strokeWidth={4} strokeDasharray="10 10" />
        <Cronometro x={820} y={560} r={100} valor={reloj} arco={reloj} color={RE.oro} etiqueta="MIN" />
        {/* etiquetas de precio */}
        <g transform={`translate(330 ${PISO - 580})`} opacity={clamp(k * 20 + 0.3 * (t > a(1) ? 1 : 0))}><rect x={-120} y={-32} width={240} height={64} rx={14} fill={RE.esmeralda} /><text x={0} y={13} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={34} fill="#042014">arriendo 100</text></g>
        <g transform={`translate(820 ${PISO - 580 - 20 * (1 - tag)}) scale(${0.7 + 0.3 * tag})`} opacity={clamp(tag * 2)}><rect x={-150} y={-32} width={300} height={64} rx={14} fill={RE.rojo} /><text x={0} y={14} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={34} fill="#fff">−6,8 a −9,3 %</text></g>
      </svg>
      <Frases frases={[{ t: 0.3, texto: "5 minutos" }, { t: 2.0, texto: "a pie", color: RE.oro }, { t: 4.0, texto: "de más", px: 104 }, { t: 6.4, texto: "−6,8 a −9,3 %", color: RE.rojo, px: 96 }]} y={400} />
      <div data-texto="cam-tarjeta" style={{ position: "absolute", left: 104, top: 1380, width: W - 208, padding: "30px 38px", borderRadius: 20, background: "#F4F1EA", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", opacity: tarjeta, transform: `translateY(${(1 - tarjeta) * 30}px)`, fontFamily: FONT, color: "#0D0E12", boxSizing: "border-box" }}>
        <div style={{ fontWeight: 800, fontSize: 36 }}>Rodríguez y Targa · 2004</div>
        <div style={{ fontFamily: MONOF, fontSize: 24, opacity: 0.7, margin: "6px 0 12px" }}>Transport Reviews 24(5) · TransMilenio, Bogotá</div>
        <div style={{ fontWeight: 600, fontSize: 32, lineHeight: 1.25 }}>Por cada 5 min más lejos a pie de una estación, el arriendo baja entre 6,8 % y 9,3 %.</div>
      </div>
    </Estudio>
  );
};

/* ───────────── real-cierre ───────────── */

export const RealCierre: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const PISO = 1240, DECK = 1000;
  const delante = useMemo(() => Array.from({ length: 22 }, (_, i) => { const u = (i + 0.5) / 22; return { x: lerp(70, 1010, u), w: 54 + azar(i * 3.3 + 1) * 44, h: lerp(190, 640, 0.2 + 0.8 * Math.exp(-Math.pow((u - 0.52) / 0.3, 2)) * (0.55 + 0.45 * azar(i * 7.1 + 1))), tono: ["#2B5C86", "#2F7A8E", "#3C5C9A", "#4B6E86", "#2A4F7A"][i % 5], s: i + 1 }; }), []);
  const detras = useMemo(() => Array.from({ length: 26 }, (_, i) => { const u = (i + 0.5) / 26; return { x: lerp(40, 1040, u), w: 50 + azar(i * 3.3 + 40) * 40, h: lerp(130, 470, 0.2 + 0.8 * Math.exp(-Math.pow((u - 0.52) / 0.3, 2)) * (0.55 + 0.45 * azar(i * 7.1 + 40))), s: i + 40 }; }), []);
  const xTren = -600 + ((((t - a(TR.cierre.tren)) * 520) % 2900) + 2900) % 2900;
  const avance = BOG.avance * easeOut((t - a(1.0)) / 2.4);
  return (
    <Estudio piso={PISO} resplandor={0.55}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="ci-deck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D5DBE2" /><stop offset="0.3" stopColor="#A9B2BC" /><stop offset="1" stopColor="#566270" /></linearGradient>
          <linearGradient id="ci-pil" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#566270" /><stop offset="0.45" stopColor="#B8C0C9" /><stop offset="1" stopColor="#4B5663" /></linearGradient>
        </defs>
        <Reflejo piso={PISO} intensidad={0.2}>
          {detras.map((d, i) => <Torre key={`b${i}`} x={d.x} y={PISO} w={d.w * 0.9} h={d.h} semilla={d.s} luz={0.4} tono="#1F3F5E" lado={0.16} />)}
          {delante.map((d, i) => <Torre key={`f${i}`} x={d.x} y={PISO} w={d.w} h={d.h} semilla={d.s} luz={0.6} tono={d.tono} />)}
          {[180, 540, 900].map((px) => <polygon key={px} points={`${px - 40},${DECK + 40} ${px + 40},${DECK + 40} ${px + 28},${PISO} ${px - 28},${PISO}`} fill="url(#ci-pil)" />)}
          <rect x={0} y={DECK} width={W} height={40} fill="url(#ci-deck)" /><rect x={0} y={DECK - 6} width={W} height={8} fill="#E9EEF3" opacity={0.85} />
          <Riel x0={0} x1={W} y={DECK - 8} grosor={0.8} />
          <TrenMetro x={xTren} y={DECK - 10} s={0.62} carros={3} />
        </Reflejo>
      </svg>
      <Frases frases={[{ t: 0.3, texto: "marzo de 2028", color: RE.oro, px: 112 }, { t: 3.2, texto: "comprime el tiempo,\nmultiplica el suelo", px: 78 }, { t: TR.cierre.pregunta, texto: "¿cuánto vale una hora\nde tu vida?", px: 82 }]} y={420} />
      <Dato valor={avance} x={W / 2} y={1440} px={120} digitos={3} decimales={1} sufijo="%" id="cierre-avance" opacidad={clamp((t - 1) / 0.5)} />
      <div data-texto="cierre-etq" style={{ position: "absolute", left: 104, width: W - 208, top: 1516, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 34, color: RE.blanco, opacity: 0.9 * clamp((t - 1.6) / 0.5) }}>de avance de la Línea 1 (sept. 2026)</div>
      <Fuente texto="Empresa Metro de Bogotá · operación comercial prevista: marzo de 2028" y={1610} delay={2.4} />
    </Estudio>
  );
};
