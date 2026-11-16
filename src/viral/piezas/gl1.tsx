/**
 * «El par craneal IX: el nervio de la arcada y la presión» (SINAPSIS · pares craneales) · escenas 1/2
 *   gl-gancho  el mismo nervio que da la arcada con el cepillo de dientes también vigila la presión arterial
 *   gl-sigue   aviso rápido: síguenos en SINAPSIS y no te pierdas ningún par craneal (fila de pares con el IX en dorado)
 *   gl-par     el glosofaríngeo: sabor del fondo de la lengua, sensibilidad y saliva
 *   gl-arcada  si algo toca el fondo de la garganta, el IX avisa y el vago (X) ordena la arcada
 *   gl-sin     en un estudio, más de un tercio de adultos sanos no tenía arcada
 * Dibujos esquemáticos; no son imágenes médicas reales.
 */
import React from "react";
import { GL, TGL } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { H, W, clamp, easeOut, lerp, spr, useReloj } from "../comun";
import { Frases } from "./real-kit";
import { Fuente } from "./real1";
import { Cap, Fondo } from "./san1";
import { SigueActual } from "./va1";
import { Ambiente, Chip, FONT, GLC, Manometro, MONOF, Perfil, Persona, RUTA, polyPt } from "./gl-kit";

type P = { e: EscenaViralGuardada };
const PX = 470, PY = 1045, PS = 0.9;

export const GlSigue: React.FC<P> = ({ e }) => <SigueActual e={e} actual={9} />;

/* ───────────── gl-gancho ───────────── */

export const GlGancho: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const G = TGL.gancho;
  const kN = clamp((t - a(G.nervio)) / a(1.4)), toque = clamp((t - a(G.arcada - 0.4)) / a(1.0)), kAr = clamp((t - a(G.arcada + 0.7)) / a(0.9)), kPr = spr(f, a(G.presion), { damping: 10, stiffness: 180, mass: 0.8 });
  const val = 0.1 + 0.7 * easeOut((t - a(G.presion)) / 1.2) * (0.6 + 0.4 * Math.sin(t * 5));
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={kAr > 0.1 && kAr < 1 ? GLC.rojo : GLC.ix} intensidad={0.55} />
        <Perfil x={PX} y={PY} s={PS} t={t} ix={kN} rl={kN} rf={kN} rs={kN} toque={t >= a(G.arcada - 0.4) ? toque : -1} arcada={kAr} seno={kPr} />
        <g opacity={kPr}>
          <path d="M 540 1250 C 620 1285 700 1275 770 1265" stroke={GLC.ix} strokeWidth={6} fill="none" strokeDasharray="10 9" strokeLinecap="round" />
          <Manometro x={850} y={1262} s={0.62} valor={val} />
        </g>
      </svg>
      <Chip x={976} y={1030} texto={"CEPILLO\nDE DIENTES"} color={"#6AD0E6"} px={20} anchor="right" id="gl-g-ce" opacidad={toque} />
      <Chip x={700} y={930} texto={"ARCADA"} color={GLC.rojo} px={28} id="gl-g-ar" opacidad={clamp(kAr * 3)} />
      <Chip x={976} y={1330} texto={"PRESIÓN ARTERIAL"} color={GLC.oro} px={20} anchor="right" id="gl-g-pr" opacidad={kPr} />
      <Chip x={104} y={1190} texto={"NERVIO IX"} color={GLC.ix} px={22} id="gl-g-ix" opacidad={kN} />
      <Frases frases={[{ t: 0.2, texto: "EL MISMO NERVIO…", px: 92 }, { t: G.arcada - 0.1, texto: "ARCADA CON\nEL CEPILLO…", px: 92, color: GLC.rojo }, { t: G.presion - 0.1, texto: "…Y VIGILA TU\nPRESIÓN", px: 94, color: GLC.oro }]} y={450} x={104} id="titular-gl-gancho" />
      <Fuente texto="El glosofaríngeo (IX) lleva la sensibilidad de la garganta (parte aferente de la arcada) y, por el nervio del seno carotídeo, la información de presión arterial. Esquema." y={1510} delay={G.nervio} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── gl-par ───────────── */

export const GlPar: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const R = TGL.par;
  const kP = clamp((t - a(R.par)) / a(1.0)), kG = clamp((t - a(R.glosofaringeo)) / 0.5), kS = clamp((t - a(R.sabor)) / a(0.8)), kSe = clamp((t - a(R.sensibilidad)) / a(0.8)), kSa = clamp((t - a(R.saliva)) / a(0.8));
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1070} color={GLC.ix} intensidad={0.5} />
        <Perfil x={PX} y={PY + 20} s={PS} t={t} ix={kP} rl={kS} rf={kSe} rp={kSa} />
      </svg>
      <Chip x={976} y={1215} texto={"SABOR · FONDO\nDE LA LENGUA"} color={GLC.lengua} px={20} anchor="right" id="gl-p-sa" opacidad={kS} />
      <Chip x={104} y={1260} texto={"SENSIBILIDAD\nDE LA GARGANTA"} color={GLC.ix} px={20} id="gl-p-se" opacidad={kSe} />
      <Chip x={104} y={1040} texto={"SALIVA\n(PARÓTIDA)"} color={"#9BF0D8"} px={20} id="gl-p-sl" opacidad={kSa} />
      <Chip x={976} y={780} texto={"IX · GLOSOFARÍNGEO"} color={GLC.ix} px={22} anchor="right" id="gl-p-ix" opacidad={kG} />
      <Frases frases={[{ t: 0.2, texto: "EL PAR\nCRANEAL IX", px: 100 }, { t: R.sabor - 0.1, texto: "SABOR, SENSIBILIDAD\nY SALIVA", px: 76, color: GLC.ix }]} y={450} x={104} id="titular-gl-par" />
      <Fuente texto={`El glosofaríngeo (IX) lleva el gusto del ${GL.tercioLengua}, la sensibilidad de la faringe y fibras para la glándula ${GL.glandula}. Esquema.`} y={1510} delay={R.par} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── gl-arcada ───────────── */

export const GlArcada: React.FC<P> = ({ e }) => {
  const { t, a } = useReloj();
  const A = TGL.arcada;
  const toque = clamp((t - a(A.toca)) / a(1.4)), kAv = clamp((t - a(A.aviso)) / a(1.2)), kVa = clamp((t - a(A.vago)) / a(0.9)), kAr = clamp((t - a(A.arcada)) / a(0.9));
  const inv = RUTA.ix.slice().reverse() as [number, number][];
  const [dx, dy] = polyPt(inv, clamp(kAv * 1.1));
  const [vx, vy] = polyPt(RUTA.vago, clamp(kVa * 1.1));
  const sx = (lx: number): number => PX + (lx - 320) * PS, sy = (ly: number): number => PY + (ly - 420) * PS;
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={kAr > 0.1 && kAr < 1 ? GLC.rojo : GLC.ix} intensidad={0.55} />
        <Perfil x={PX} y={PY} s={PS} t={t} ix={clamp(toque * 3)} cerebro={0.3 + 0.7 * kAv} vago={kVa} toque={toque} arcada={kAr} />
        {kAv > 0 && kAv < 1 && <circle cx={sx(dx)} cy={sy(dy)} r={10} fill="#fff" />}
        {kVa > 0 && kVa < 1 && <circle cx={sx(vx)} cy={sy(vy)} r={10} fill="#fff" />}
      </svg>
      <Chip x={700} y={900} texto={"IX · AVISA\nAL CEREBRO"} color={GLC.ix} px={22} id="gl-a-ix" opacidad={kAv} />
      <Chip x={104} y={1180} texto={"X · VAGO\nORDENA"} color={GLC.vago} px={22} id="gl-a-x" opacidad={kVa} />
      <Chip x={976} y={1215} texto={"ARCADA"} color={GLC.rojo} px={30} anchor="right" id="gl-a-ar" opacidad={clamp(kAr * 3)} />
      <Frases frases={[{ t: 0.2, texto: "ALGO TOCA EL\nFONDO…", px: 94 }, { t: A.aviso - 0.1, texto: "EL IX AVISA", px: 100, color: GLC.ix }, { t: A.vago - 0.1, texto: "EL VAGO\nORDENA LA ARCADA", px: 84, color: GLC.vago }]} y={450} x={104} id="titular-gl-arcada" />
      <Fuente texto={`En el reflejo nauseoso la vía aferente es el glosofaríngeo (${GL.arcada.aferente}) y la eferente el vago (${GL.arcada.eferente}). Esquema.`} y={1510} delay={A.garganta} />
      <Cap e={e} />
    </Fondo>
  );
};

/* ───────────── gl-sin ───────────── */

const GRID: [number, number][] = [[200, 940], [370, 940], [540, 940], [710, 940], [880, 940], [200, 1160], [370, 1160], [540, 1160], [710, 1160], [880, 1160]];
const SIN = new Set([0, 3, 6, 8]);
export const GlSin: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const S = TGL.sin;
  const kEs = clamp((t - a(S.estudio)) / a(1.2)), kSa = clamp((t - a(S.sanos)) / 0.5), kSin = clamp((t - a(S.tercio)) / a(1.0)), kBi = spr(f, a(S.bien), { damping: 10, stiffness: 190, mass: 0.8 });
  return (
    <Fondo>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Ambiente t={t} y={1050} color={GLC.oro} intensidad={0.45} />
        {GRID.map(([x, y], i) => {
          const k = clamp(kEs * 10 - i), res = SIN.has(i) ? clamp(kSin * 2) : 0;
          return <g key={i} opacity={k} transform={`translate(0 ${lerp(14, 0, easeOut(k))})`}><Persona x={x} y={y} s={1.4} resalta={res} />{res > 0.5 && <g transform={`translate(${x} ${y - 98})`}><circle r={18} fill="rgba(11,18,40,0.92)" stroke={GLC.oro} strokeWidth={4} /><path d="M -8 -8 L 8 8 M 8 -8 L -8 8" stroke={GLC.rojo} strokeWidth={5} strokeLinecap="round" /></g>}</g>;
        })}
        <g opacity={kBi} transform={`translate(540 ${lerp(1360, 1348, easeOut(kBi))})`}><rect x={-230} y={-34} width={460} height={68} rx={34} fill="rgba(11,18,40,0.94)" stroke={GLC.vago} strokeWidth={5} /><text y={11} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={GLC.vago} data-texto="gl-s-bien">Y ESTABAN BIEN</text></g>
      </svg>
      <Chip x={104} y={790} texto={"ADULTOS SANOS"} color={GLC.hueso} px={26} id="gl-s-ad" opacidad={kSa} />
      <Chip x={976} y={790} texto={"X = SIN ARCADA"} color={GLC.oro} px={22} anchor="right" id="gl-s-sin" opacidad={clamp(kSin * 2)} />
      <Chip x={540} y={1262} texto={"MÁS DE 1 DE CADA 3"} color={GLC.oro} px={30} anchor="center" id="gl-s-ter" opacidad={clamp(kSin * 2)} />
      <Frases frases={[{ t: 0.2, texto: "DATO WOW", px: 110, color: GLC.oro }, { t: S.tercio - 0.1, texto: "1 DE CADA 3\nSIN ARCADA", px: 98 }]} y={450} x={104} id="titular-gl-sin" />
      <Fuente texto={`Estudio de ${GL.sinArcadaSanos.n} adultos sanos (${GL.sinArcadaSanos.fuente}): ≈ ${GL.sinArcadaSanos.porcentaje} % no tenía reflejo nauseoso. Es un solo estudio (estimación). Una arcada ausente no equivale a enfermedad. Esquema.`} y={1510} delay={S.estudio} />
      <Cap e={e} />
    </Fondo>
  );
};
