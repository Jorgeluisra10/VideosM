/**
 * «¿Por qué se te duerme el pie?» (SINAPSIS · cuerpo cotidiano · voz de CapCut) · escenas 2/2
 *   pie-senal      el nervio apretado deja de enviar señales al cerebro
 *   pie-hormigueo  al soltar, las fibras despiertan y disparan señales sueltas: el hormigueo
 *   pie-consejo    qué hacer: moverse despacio y esperar a sentirlo antes de pararse (y cuándo consultar)
 *   pie-cierre     el pie no se durmió: estuvo desconectado
 */
import React from "react";
import { PIE, TPI } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeInOut, easeOut, spr, useReloj } from "../comun";
import { Estudio, Frases, MONOF, RE } from "./real-kit";
import { Fuente } from "./real1";
import { Chip } from "./med1";
import { Cerebro } from "./glf-kit";
import { Cable, Chispas, PC, PieMini, Pierna, Traza, llegada } from "./pie-kit";

type P = { e: EscenaViralGuardada };

const X0 = 215, X1 = 705, YC = 930;

/* ───────────── pie-senal ───────────── */

export const PieSenal: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const S = TPI.senal;
  const ent = spr(f, a(S.cable), { damping: 16, stiffness: 90, mass: 1 });
  const aprieta = easeInOut((t - a(S.aprieta)) / 0.6);
  const XP = 460;
  const lleg = llegada(t, X0, X1, "bloqueo", aprieta, XP, a(S.pulsos));
  const sin = clamp((t - a(S.corte)) / 0.5);
  return (
    <Estudio piso={1560} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <PieMini x={140} y={YC + 10} s={0.42} opacidad={ent} />
        <Cable x0={X0} x1={X1} y={YC} t={t} modo="bloqueo" aprieta={aprieta} xp={XP} t0={a(S.pulsos)} opacidad={ent} />
        <Cerebro x={850} y={YC} s={0.4 * ent} luz={0.15 + 0.7 * lleg * (1 - sin)} />
        <Traza x={150} y={1170} w={780} h={150} t={t} ventana={3.4} opacidad={ent} valorEn={(tt) => llegada(tt, X0, X1, "bloqueo", easeInOut((tt - a(S.aprieta)) / 0.6), XP, a(S.pulsos))} />
        <g opacity={sin}>
          <circle cx={850} cy={YC - 150} r={34} fill="#06101C" fillOpacity={0.92} stroke={PC.rojo} strokeWidth={5} />
          <path d="M 837 780 L 863 806 M 863 780 L 837 806" stroke={PC.rojo} strokeWidth={6} strokeLinecap="round" />
        </g>
      </svg>
      <div data-texto="pie-sen-l1" style={{ position: "absolute", left: 85, top: 1010, width: 130, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: PC.hielo, opacity: ent }}>pie</div>
      <div data-texto="pie-sen-l2" style={{ position: "absolute", left: 770, top: 1075, width: 160, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: PC.hielo, opacity: ent }}>cerebro</div>
      <Frases frases={[{ t: 0.3, texto: "el nervio\nmanda señales", px: 88 }, { t: S.aprieta, texto: "apretado,\nse corta", color: PC.rojo, px: 92 }]} y={440} id="pie-sen-t" />
      <Chip texto="sin señal, no sientes el pie" x={W / 2} y={1420} color={PC.rojo} opacidad={clamp((t - a(S.chip)) / 0.5)} ancho={700} id="pie-sen-chip" />
    </Estudio>
  );
};

/* ───────────── pie-hormigueo ───────────── */

export const PieHormigueo: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const Hq = TPI.hormigueo;
  const ent = spr(f, a(Hq.cable), { damping: 16, stiffness: 90, mass: 1 });
  const suelta = 1 - easeInOut((t - a(Hq.cable + 0.3)) / 0.6);
  const caos = t >= a(Hq.suelta + 0.4);
  const XP = 460;
  const lleg = caos ? llegada(t, X0, X1, "caos", 0, XP, 0) : 0.1;
  const ch = clamp((t - a(Hq.rafagas)) / 0.8);
  return (
    <Estudio piso={1560} resplandor={0.4}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <PieMini x={140} y={YC + 10} s={0.42} opacidad={ent} />
        <g transform="translate(-230 -200)"><Chispas t={t} cantidad={ch} zona={[330, 1050, 140, 50]} semilla={5} /></g>
        <Cable x0={X0} x1={X1} y={YC} t={t} modo={caos ? "caos" : "bloqueo"} aprieta={suelta} xp={XP} t0={a(Hq.suelta + 0.4) + 0.2} opacidad={ent} semilla={11} />
        <Cerebro x={850} y={YC} s={0.4 * ent} luz={0.15 + 0.75 * clamp(lleg)} />
        <Traza x={150} y={1170} w={780} h={150} t={t} ventana={3.4} opacidad={ent} color={PC.magenta} valorEn={(tt) => (tt >= a(Hq.suelta + 0.4) ? llegada(tt, X0, X1, "caos", 0, XP, 0) : 0.06)} />
      </svg>
      <div data-texto="pie-hor-l1" style={{ position: "absolute", left: 85, top: 1010, width: 130, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: PC.hielo, opacity: ent }}>pie</div>
      <div data-texto="pie-hor-l2" style={{ position: "absolute", left: 770, top: 1075, width: 160, textAlign: "center", fontFamily: MONOF, fontWeight: 700, fontSize: 26, color: PC.hielo, opacity: ent }}>cerebro</div>
      <Frases frases={[{ t: 0.3, texto: "al soltarlo,", px: 96 }, { t: Hq.suelta + 0.5, texto: "despierta\ny dispara", color: PC.magenta, px: 96 }]} y={440} id="pie-hor-t" />
      <Chip texto="hormigueo = nervio despertando" x={W / 2} y={1420} color={PC.magenta} opacidad={clamp((t - a(Hq.chip)) / 0.5)} ancho={760} id="pie-hor-chip" />
      <Fuente texto={`Ochoa y Torebjörk, Brain ${PIE.ochoaAnio} · microneurografía en humanos · esquema`} y={1486} delay={Hq.chip} />
    </Estudio>
  );
};

/* ───────────── pie-consejo ───────────── */

const Paso: React.FC<{ y: number; texto: string; k: number; check: number; icono: React.ReactNode; id: string }> = ({ y, texto, k, check, icono, id }) => (
  <>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <g opacity={k} transform={`translate(0 ${(1 - k) * 24})`}>
        <rect x={110} y={y} width={860} height={140} rx={30} fill="#08101E" stroke={PC.hielo} strokeOpacity={0.35} strokeWidth={2} />
        <g transform={`translate(190 ${y + 70})`}>{icono}</g>
        <g transform={`translate(890 ${y + 70}) scale(${check})`} opacity={clamp(check * 1.5)}>
          <circle r={30} fill={PC.verde} opacity={0.2} stroke={PC.verde} strokeWidth={4} />
          <path d="M -13 1 L -3 11 L 14 -10" fill="none" stroke={PC.verde} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
    <div data-texto={id} style={{ position: "absolute", left: 270, top: y + 34, width: 560, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 38, lineHeight: 1.15, color: RE.blanco, opacity: k }}>{texto}</div>
  </>
);

export const PieConsejo: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const C = TPI.consejo;
  const k = (i: number): number => spr(f, a(C.paso(i)), { damping: 15, stiffness: 120, mass: 0.8 });
  const ck = (i: number): number => spr(f, a(C.paso(i) + 0.5), { damping: 10, stiffness: 200, mass: 0.6 });
  const av = clamp((t - a(C.aviso)) / 0.5);
  const dedos = (
    <g>{[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={(i - 2) * 24} cy={4 * Math.sin(t * 6 + i)} rx={10} ry={16} fill={PC.cristal} stroke={PC.borde} strokeWidth={2} />)}</g>
  );
  const posturas = (
    <g fill="none" stroke={PC.nervioClaro} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round"><path d="M -34 -10 L 34 -10 M 20 -24 L 34 -10 L 20 4" /><path d="M 34 14 L -34 14 M -20 0 L -34 14 L -20 28" /></g>
  );
  const reloj = (
    <g><circle r={34} fill="none" stroke={PC.hielo} strokeWidth={6} /><path d={`M 0 0 L ${Math.sin(t * 2) * 18} ${-Math.cos(t * 2) * 18}`} stroke={PC.nervioClaro} strokeWidth={6} strokeLinecap="round" /><circle r={5} fill={PC.nervioClaro} /></g>
  );
  return (
    <Estudio piso={1560} resplandor={0.4}>
      <Paso y={640} texto="mueve los dedos, despacio" k={k(0)} check={ck(0)} icono={dedos} id="pie-con-1" />
      <Paso y={820} texto="cambia de postura" k={k(1)} check={ck(1)} icono={posturas} id="pie-con-2" />
      <Paso y={1000} texto="espera a sentirlo antes de pararte" k={k(2)} check={ck(2)} icono={reloj} id="pie-con-3" />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <g opacity={av} transform={`translate(0 ${(1 - av) * 20})`}>
          <rect x={110} y={1210} width={860} height={150} rx={30} fill="#2A1C06" stroke="#FFB020" strokeOpacity={0.7} strokeWidth={3} />
          <g transform="translate(190 1285)"><path d="M 0 -34 L 36 28 L -36 28 Z" fill="none" stroke="#FFB020" strokeWidth={6} strokeLinejoin="round" /><path d="M 0 -12 L 0 8" stroke="#FFB020" strokeWidth={6} strokeLinecap="round" /><circle cx={0} cy={19} r={3.5} fill="#FFB020" /></g>
        </g>
      </svg>
      <div data-texto="pie-con-av" style={{ position: "absolute", left: 270, top: 1236, width: 660, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 32, lineHeight: 1.2, color: "#FFE0A3", opacity: av }}>si pasa seguido o no se quita, consulta a un profesional</div>
      <Frases frases={[{ t: 0.2, texto: "qué hacer", px: 100 }]} y={470} id="pie-con-t" />
    </Estudio>
  );
};

/* ───────────── pie-cierre ───────────── */

export const PieCierre: React.FC<P> = () => {
  const { f, t, a } = useReloj();
  const C = TPI.cierre;
  const ent = spr(f, a(C.pierna), { damping: 16, stiffness: 90, mass: 1 });
  const apagado = 1 - easeOut((t - a(C.conecta)) / 0.9);
  const con = clamp((t - a(C.conecta + 0.7)) / 0.8);
  const chip = clamp((t - a(C.chip)) / 0.5);
  return (
    <Estudio piso={1560} resplandor={0.5}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Pierna x={68} y={40} s={1} t={t} opacidad={ent} apagado={apagado} conectado={con} pulsos />
        <g transform="translate(860 1230)" opacity={chip}>
          <circle r={50} fill="#06101C" fillOpacity={0.9} stroke={PC.verde} strokeWidth={6} />
          <path d="M -20 2 L -6 16 L 22 -14" fill="none" stroke={PC.verde} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
      <Frases frases={[{ t: 0.2, texto: "no se durmió:", px: 98 }, { t: C.conecta + 0.6, texto: "estuvo\ndesconectado", color: PC.hielo, px: 96 }]} y={440} id="pie-cie-t" />
      <Chip texto="vuelve a conectarse" x={W / 2} y={1445} color={PC.verde} opacidad={chip} ancho={560} id="pie-cie-chip" />
    </Estudio>
  );
};
