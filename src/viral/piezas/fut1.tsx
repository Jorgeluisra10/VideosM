/**
 * Paro cardíaco de un futbolista (SINAPSIS · medicina y actualidad) · escenas 1/2
 *   fut-gancho       en memoria: nombre, líneas de cancha y un ECG que se apaga con calma
 *   fut-causa        sello «causa médica no informada» y el término commotio cordis
 *   fut-ventana      un latido de ECG con su ventana vulnerable: el mismo golpe no hace nada fuera de ella y desencadena fibrilación dentro (esquema)
 *   fut-fibrilacion  un corazón que late con ritmo y de pronto solo tiembla: no bombea sangre
 * No se muestra el lance ni a ninguna persona implicada: solo esquemas médicos. La causa exacta del caso no se ha informado.
 */
import React from "react";
import { FUT, TFUT, ecgFibrilacion, ecgOnda } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, LineaCap, clamp, easeOut, lerp, mezclar, spr, useReloj } from "../comun";
import { Lectura } from "./jet-kit";
import { Frases, FONT, MONOF } from "./real-kit";
import { Fuente } from "./real1";
import { Corazon, Ecg, FU, Sala, Torso, sua } from "./fut-kit";

type P = { e: EscenaViralGuardada };

const Cap: React.FC<{ e: EscenaViralGuardada }> = ({ e }) => (e.cap ? <LineaCap texto={e.cap} y={290} px={28} delay={0.12} id="cap-pieza" color={FU.hielo} /> : null);
/** contracción del corazón (0–1) durante el latido: sube tras el QRS y baja hacia la onda T */
const contraccion = (fase: number): number => Math.exp(-Math.pow((((fase % 1) + 1) % 1 - 0.42) / 0.09, 2));

/* ───────────── fut-gancho ───────────── */

export const FutGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TFUT.gancho;
  const kn = spr(f, a(G.nombre), { damping: 14, stiffness: 110, mass: 0.9 });
  const kc = spr(f, a(G.chip), { damping: 14, stiffness: 140, mass: 0.7 });
  const tApaga = a(G.apaga);
  const valor = (tt: number): number => (tt < tApaga ? ecgOnda(tt / 0.8) : ecgOnda(tt / 0.8) * Math.max(0, 1 - (tt - tApaga) / 0.9));
  return (
    <Sala t={t}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        {/* líneas de cancha (solo contexto, sin personas) */}
        <g opacity={0.16} fill="none" stroke="#fff" strokeWidth={4}>
          <rect x={150} y={1180} width={780} height={290} rx={4} />
          <line x1={150} y1={1325} x2={930} y2={1325} />
          <circle cx={540} cy={1325} r={96} />
          <rect x={340} y={1180} width={400} height={84} /><rect x={430} y={1180} width={220} height={36} />
          <rect x={340} y={1386} width={400} height={84} /><rect x={430} y={1434} width={220} height={36} />
        </g>
        <g opacity={clamp(kc * 2)} transform={`translate(0 ${(1 - clamp(kc)) * 30})`}>
          <rect x={360} y={266} width={360} height={60} rx={30} fill="rgba(8,18,31,0.82)" stroke={FU.llama} strokeWidth={2.5} />
          <circle cx={402} cy={296} r={9} fill={FU.llama} />
          <text x={428} y={307} fontFamily={MONOF} fontWeight={700} fontSize={27} letterSpacing="0.12em" fill="#fff">EN MEMORIA</text>
        </g>
        <Ecg x={100} y={1000} w={880} h={230} t={t} valor={valor} span={3.4} color={FU.verde} opacidad={clamp((t - a(G.ecg)) / 0.5)} />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "UN GOLPE EN\nEL PECHO", px: 100 }, { t: G.frase2, texto: "UN PARO\nCARDÍACO", px: 100, color: FU.rojo }, { t: G.frase3, texto: "¿CÓMO PUEDE\nPASAR?", px: 96, color: FU.ambar }]} y={450} x={104} id="titular-fut-gancho" />
      <div data-texto="fut-nombre" style={{ position: "absolute", left: 80, top: 690, width: 920, textAlign: "center", opacity: clamp(kn * 2), transform: `translateY(${(1 - clamp(kn)) * 20}px)` }}>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 78, letterSpacing: "-0.01em", color: "#fff", textShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>JESÚS DE MIGUEL</div>
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 34, color: FU.hielo, marginTop: 6 }}>delantero del CD Tenerife · {FUT.edad} años</div>
      </div>
      <Fuente texto="Datos de la noticia: comunicados del CD Tenerife y medios (2–3 nov 2026). Este video no muestra el lance ni atribuye culpas; la causa médica exacta no se ha informado." y={1495} delay={G.nombre} />
      <Cap e={e} />
    </Sala>
  );
};

/* ───────────── fut-causa ───────────── */

export const FutCausa: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const C = TFUT.causa;
  const sello = spr(f, a(C.sello), { damping: 9, stiffness: 220, mass: 0.6 });
  const selloOp = (1 - sua(t, a(C.sale), a(C.sale + 0.4))) * clamp(sello * 2);
  const term = "COMMOTIO CORDIS";
  const letras = Math.max(0, Math.floor((t - a(C.term)) * 14));
  const [l1, l2] = [term.slice(0, 8), term.slice(9)];
  const v1 = term.slice(0, Math.min(8, letras)), v2 = letras > 9 ? l2.slice(0, letras - 9) : "";
  const kg = clamp((t - a(C.gloss)) / 0.5);
  return (
    <Sala t={t}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={selloOp} transform={`translate(540 800) rotate(-4) scale(${0.7 + 0.3 * sello})`}>
          <rect x={-410} y={-120} width={820} height={240} rx={22} fill="rgba(10,16,30,0.78)" stroke={FU.ambar} strokeWidth={7} />
          <rect x={-392} y={-102} width={784} height={204} rx={12} fill="none" stroke={FU.ambar} strokeWidth={2.5} />
          <text x={0} y={-52} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={30} letterSpacing="0.1em" fill="#fff">CAUSA MÉDICA EXACTA</text>
          <text x={0} y={26} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={86} letterSpacing="0.02em" fill={FU.ambar}>NO INFORMADA</text>
          <text x={0} y={76} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={27} letterSpacing="0.08em" fill="#fff">LA INVESTIGACIÓN SIGUE EN CURSO</text>
        </g>
        <g opacity={clamp((t - a(C.term - 0.2)) / 0.4)} transform="translate(540 1310)"><Corazon x={0} y={0} s={0.5} t={t} latido={0.5 + 0.5 * Math.sin(t * 7.8)} /></g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "NO SE SABE\nLA CAUSA", px: 104 }, { t: C.term - 0.1, texto: "PERO EXISTE UN\nMECANISMO", px: 90, color: FU.cian }]} y={450} x={104} id="titular-fut-causa" />
      <div data-texto="fut-term" style={{ position: "absolute", left: 60, top: 640, width: 960, textAlign: "center", opacity: clamp((t - a(C.term)) / 0.2), fontFamily: FONT, fontWeight: 900, fontSize: 132, lineHeight: 1.02, letterSpacing: "-0.02em", color: FU.cian, textShadow: "0 0 50px rgba(61,224,255,0.45)" }}>
        <div>{v1}</div><div>{v2}</div>
      </div>
      <Lectura x={540} y={1010} ancho={880} alinear="center" valor="«agitación del corazón»" sub="del latín · mecanismo conocido en medicina del deporte" px={46} color={FU.blanco} opacidad={kg} id="causa-gloss" />
      <Fuente texto="Otras causas posibles tras un traumatismo torácico: contusión cardíaca, lesión de grandes vasos o una enfermedad cardíaca previa. Diagnóstico oficial: no informado." y={1495} delay={C.fuente} />
      <Cap e={e} />
    </Sala>
  );
};

/* ───────────── fut-ventana ───────────── */

export const FutVentana: React.FC<P> = ({ e }) => {
  const { f, t, a, ritmo } = useReloj();
  const V = TFUT.ventana;
  const tn = t / ritmo;                                                            // tiempo en unidades de ritmo normal
  const fase = ((tn / V.periodo) % 1 + 1) % 1;
  const antes = tn < V.golpe2;
  const kp = spr(f, a(V.ecg), { damping: 14, stiffness: 120, mass: 0.8 });
  const kb = clamp((t - a(V.banda)) / a(0.5));
  const k1 = clamp((tn - V.golpe1) / 0.6), k2 = clamp((tn - V.golpe2) / 0.6);
  const fvK = tn >= V.golpe2 ? 1 : 0;
  const X0 = 130, W2 = 820, Y0 = 810, AM = 130;
  const curva = Array.from({ length: 321 }, (_, i) => `${(X0 + (i / 320) * W2).toFixed(1)},${(Y0 - ecgOnda(i / 320) * AM).toFixed(1)}`).join(" ");
  const cx = X0 + fase * W2, cy = Y0 - ecgOnda(fase) * AM;
  const banda0 = X0 + 0.545 * W2, banda1 = X0 + 0.605 * W2;
  const tImp = V.golpe2 * ritmo;
  return (
    <Sala t={t} alerta={fvK ? clamp((tn - V.golpe2) / 0.5) * 0.6 : 0}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(kp * 2)}>
          <rect x={100} y={610} width={880} height={380} rx={26} fill="rgba(6,16,28,0.7)" stroke="rgba(61,224,255,0.4)" strokeWidth={3} />
          {antes ? (
            <g>
              <polyline points={curva} fill="none" stroke={FU.verde} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
              <rect x={banda0} y={650} width={banda1 - banda0} height={300} rx={8} fill={FU.rojo} opacity={0.28 * kb} />
              <rect x={banda0} y={650} width={banda1 - banda0} height={300} rx={8} fill="none" stroke={FU.rojo} strokeWidth={3} strokeDasharray="8 6" opacity={kb} />
              <line x1={cx} y1={640} x2={cx} y2={970} stroke="#fff" strokeWidth={3} opacity={0.7} />
              <circle cx={cx} cy={cy} r={11} fill="#fff" stroke={FU.verde} strokeWidth={4} />
              {[["P", 0.12], ["QRS", 0.32], ["T", 0.6]].map(([n, u]) => <text key={n as string} x={X0 + (u as number) * W2} y={Y0 + 70} textAnchor="middle" fontFamily={MONOF} fontWeight={700} fontSize={26} fill={FU.hielo}>{n as string}</text>)}
            </g>
          ) : (
            <Ecg x={130} y={810} w={820} h={260} t={t} valor={(tt) => (tt < tImp ? ecgOnda(tt / 0.8) : ecgFibrilacion(tt) * 0.8)} span={3.0} color={FU.rojo} />
          )}
        </g>
        <Torso x={540} y={1225} s={0.6} t={t} impacto={k1 > 0 && k1 < 1 ? k1 : k2 > 0 && k2 < 1 ? k2 : 0} impactoTipo={k2 > 0 ? "peligro" : "seguro"} latido={fvK ? 0 : contraccion(fase)} fv={fvK} />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "EL LATIDO\nES ELÉCTRICO", px: 96 }, { t: 3.0, texto: "UNA VENTANA\nDE ≈ 20 ms", px: 92, color: FU.ambar }, { t: 5.4, texto: "UN GOLPE AHÍ\nLO DESORDENA", px: 84, color: FU.rojo }]} y={450} x={104} id="titular-fut-ventana" />
      <div data-texto="ventana-etq" style={{ position: "absolute", left: 100, top: 1010, width: 880, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 25, letterSpacing: "0.06em", color: FU.hielo, opacity: kb * (antes ? 1 : 0) }}>zona roja = ventana vulnerable (no a escala)</div>
      <div data-texto="ventana-chip" style={{ position: "absolute", left: 100, top: 1392, width: 880, textAlign: "center", opacity: clamp((tn - V.golpe1 - 0.3) / 0.4) }}>
        <span style={{ display: "inline-block", padding: "9px 24px", borderRadius: 999, border: `3px solid ${fvK ? FU.rojo : FU.verde}`, background: "rgba(4,10,18,0.85)", fontFamily: FONT, fontWeight: 800, fontSize: 30, color: "#fff" }}>{fvK ? "mismo golpe, en la ventana: fibrilación" : "golpe fuera de la ventana: el corazón sigue"}</span>
      </div>
      <Fuente texto="Link y cols., NEJM 1998 (modelo experimental en cerdos): fibrilación con impactos 15–30 ms antes del pico de la onda T. Esquema." y={1500} delay={V.banda} />
      <Cap e={e} />
    </Sala>
  );
};

/* ───────────── fut-fibrilacion ───────────── */

export const FutFibrilacion: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const B = TFUT.fibrilacion;
  const kc = spr(f, a(B.corazon), { damping: 12, stiffness: 140, mass: 0.8 });
  const tg = a(B.golpe);
  const fv = clamp((t - tg) / 0.15);
  const fase = ((t / 0.8) % 1 + 1) % 1;
  const flash = t >= tg ? Math.max(0, 1 - (t - tg) / 0.3) : 0;
  const alerta = clamp((t - tg) / 0.6);
  const sangre = clamp((t - a(B.sangre)) / 0.5);
  return (
    <Sala t={t} alerta={alerta}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <g opacity={clamp(kc * 2)} transform={`translate(0 ${(1 - clamp(kc)) * 40})`}>
          <Corazon x={540} y={930} s={1.05} t={t} latido={fv > 0.5 ? 0 : contraccion(fase)} fv={fv} />
        </g>
        {flash > 0 && <rect width={W} height={H} fill="#fff" opacity={0.35 * flash} />}
        <Ecg x={110} y={1290} w={860} h={190} t={t} valor={(tt) => (tt < tg ? ecgOnda(tt / 0.8) * 0.9 : ecgFibrilacion(tt))} span={3.2} color={fv > 0.5 ? FU.rojo : FU.verde} opacidad={clamp(kc * 2)} />
      </svg>
      <Frases frases={[{ t: 0.2, texto: "SI COINCIDE…", px: 108, color: FU.ambar }, { t: 1.9, texto: "EL CORAZÓN\nSOLO TIEMBLA", px: 96, color: FU.rojo }]} y={450} x={104} id="titular-fut-fibrilacion" />
      <div data-texto="fib-rotulo" style={{ position: "absolute", left: 60, top: 1156, width: 960, textAlign: "center", fontFamily: MONOF, fontWeight: 800, fontSize: 40, letterSpacing: "0.1em", color: FU.rojo, opacity: clamp((t - a(B.rotulo)) / 0.3) * (0.7 + 0.3 * Math.sin(t * 8)) }}>FIBRILACIÓN VENTRICULAR</div>
      <div data-texto="fib-chip" style={{ position: "absolute", left: 100, top: 1426, width: 880, textAlign: "center", opacity: sangre }}>
        <span style={{ display: "inline-block", padding: "9px 26px", borderRadius: 999, border: `3px solid ${FU.rojo}`, background: "rgba(40,6,10,0.85)", fontFamily: FONT, fontWeight: 800, fontSize: 32, color: "#fff" }}>no bombea sangre</span>
      </div>
      <Fuente texto="Esquema: la fibrilación ventricular es una actividad eléctrica caótica que impide al corazón bombear; es una emergencia que se trata con RCP y desfibrilación." y={1500} delay={B.rotulo} />
      <Cap e={e} />
    </Sala>
  );
};
