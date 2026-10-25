/**
 * Ensayo «Anomalía» · escenas a medida 1/4 (abstracto, sin ilustración literal)
 *   anom-disco   el gancho: la ciudad como un disco de filotaxis en semitono rojo (8 millones = 2.400 puntos); «TRÁFICO» tachado, «DIMENSIONES»
 *   anom-cierre  el bucle: del blob fundido los puntos se abren hasta la MISMA geometría del primer fotograma, y queda la pregunta abierta
 * La geometría del disco (DISCO, puntosDisco) es compartida: el último fotograma de anom-cierre es el fotograma 0 de anom-disco.
 */
import React, { useMemo } from "react";
import { TA } from "../../anim/piezas";
import type { EscenaViralGuardada } from "../../anim/viral";
import { FUENTE, H, LineaCap, MONO, W, clamp, easeInOut, easeOut, fmtNum, lerp, mezclar, spr, useReloj } from "../comun";
import { AN, Blancos, DISCO, Lienzo, Odometro, Titular, Visor, puntosDisco, ruido } from "./anom-ui";

type P = { e: EscenaViralGuardada };

/** El disco: `giro` (rad) y `amp` (0–1) agitan la filotaxis; con giro 0 y amp 0 es exactamente la geometría de referencia. `abre` (0–1) lo despliega desde el centro. */
export const DiscoSvg: React.FC<{ t: number; giro: number; amp: number; abre?: number; tinte?: (i: number, r: number, a: number) => string; luz?: number }> = ({ t, giro, amp, abre = 1, tinte, luz = 0 }) => {
  const pts = useMemo(() => puntosDisco(), []);
  const cs = Math.cos(giro), sn = Math.sin(giro);
  return (
    <g>
      {pts.map((p) => {
        const rx = p.x0 - DISCO.cx, ry = p.y0 - DISCO.cy;
        let x = DISCO.cx + rx * cs - ry * sn;
        let y = DISCO.cy + rx * sn + ry * cs;
        let rad = p.rad;
        if (amp > 0) {
          const n1 = ruido(p.x0 / 78 + t * 0.32, p.y0 / 78, 1), n2 = ruido(p.x0 / 78 + 17, p.y0 / 78 + t * 0.32, 2);
          x += (n1 - 0.5) * amp * 74;
          y += (n2 - 0.5) * amp * 74;
          rad *= 1 + (ruido(p.x0 / 40, p.y0 / 40 + t * 0.5, 3) - 0.5) * amp * 0.5;
        }
        if (abre < 1) {
          const k = easeInOut(clamp(abre * 1.7 - p.r * 0.7));
          // al principio los puntos forman un cuerpo elíptico denso (el blob fundido de la escena anterior)
          x = lerp(DISCO.cx + Math.cos(p.a) * 190 * p.r, x, k);
          y = lerp(DISCO.cy + Math.sin(p.a) * 128 * p.r, y, k);
          rad = lerp(10.5, rad, k);
        }
        const encendido = luz > 0 && ruido(p.x0 / 60, p.y0 / 60, 9) > 1 - luz * 0.5;
        const color = encendido ? AN.lima : tinte ? tinte(p.i, p.r, p.a) : AN.rojo;
        return <circle key={p.i} cx={x} cy={y} r={rad} fill={color} />;
      })}
    </g>
  );
};

/* ───────────── anom-disco ───────────── */

export const AnomDisco: React.FC<P> = ({ e }) => {
  const { f, t, a, dur } = useReloj();
  const k = clamp(t / Math.max(1, dur));
  const amp = 0.62 * easeInOut(clamp((t - a(0.6)) / a(6.0)));
  const giro = 0.075 * t * (0.4 + k);
  const cuenta = easeOut((t - a(TA.disco.cuenta)) / a(TA.disco.cuentaDur));
  const visor = 1; // visor y leyenda ya están en el fotograma 0 (es el mismo cuadro con el que cierra el bucle)
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <DiscoSvg t={t} giro={giro} amp={amp} />
        <Visor x={96} y={DISCO.cy - DISCO.R - 44} w={W - 192} h={DISCO.R * 2 + 88} progreso={visor} cruz />
        <text x={W / 2} y={DISCO.cy + DISCO.R + 92} textAnchor="middle" fontFamily={MONO} fontWeight={400} fontSize={26} fill={AN.blanco} fillOpacity={0.7}>1 punto = 3.333 personas</text>
      </svg>
      {e.cap && <LineaCap texto={e.cap} y={290} px={30} delay={0.12} id="cap-pieza" color={AN.blanco} />}
      <Titular y={470} maxPx={118} lineas={[{ texto: "TRÁFICO", tachado: TA.disco.tacha, delay: 0.1 }, { texto: "DIMENSIONES", color: AN.lima, delay: TA.disco.tacha + 0.2 }]} id="titular-disco" />
      <Odometro valor={DISCO_HAB * cuenta} x={W / 2} y={725} px={72} digitos={7} id="disco-cuenta" opacidad={clamp(cuenta * 6)} />
      <Blancos x={W / 2} y={DISCO.cy + DISCO.R + 150} px={34} antes="DIM = " valor="2" resuelve={TA.disco.dim} delay={0.9} id="disco-dim" color={AN.lima} />
    </Lienzo>
  );
};
const DISCO_HAB = 8_000_000;

/* ───────────── anom-cierre ───────────── */

export const AnomCierre: React.FC<P> = ({ e }) => {
  const { f, t, a } = useReloj();
  const abre = easeInOut((t - a(TA.cierre.abre)) / a(TA.cierre.abreDur));
  // los puntos nacen azules (el tiempo comprimido) y se asientan en el rojo del primer fotograma; algunos nodos lima se apagan al final
  const mezcla = easeInOut((t - a(TA.cierre.abre + 0.4)) / a(TA.cierre.abreDur));
  const tinte = (_i: number, r: number, ang: number): string => mezclar(mezclar(AN.azul, AN.rojo, (Math.cos(ang) + 1) / 2), AN.rojo, clamp(mezcla * 1.4 - (1 - r) * 0.35));
  const luz = abre < 0.15 ? 0 : 0.9 * (1 - easeOut((t - a(TA.cierre.abre + 0.8)) / a(TA.cierre.abreDur)));
  const amp = 0.62 * (1 - easeInOut((t - a(TA.cierre.abre)) / a(TA.cierre.abreDur)));
  const giro = (1 - abre) * 0.9;
  const visor = easeOut((t - a(TA.cierre.abre + 1.2)) / 0.7);
  const pregunta = spr(f, a(TA.cierre.pregunta), { damping: 14 });
  return (
    <Lienzo modo="oscuro">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <DiscoSvg t={t} giro={giro} amp={amp} abre={abre} tinte={tinte} luz={luz} />
        <Visor x={96} y={DISCO.cy - DISCO.R - 44} w={W - 192} h={DISCO.R * 2 + 88} progreso={visor} cruz />
        <text x={W / 2} y={DISCO.cy + DISCO.R + 92} textAnchor="middle" fontFamily={MONO} fontWeight={400} fontSize={26} fill={AN.blanco} fillOpacity={0.7}>1 punto = 3.333 personas</text>
      </svg>
      <Titular y={470} maxPx={118} lineas={[{ texto: "¿QUÉ CIUDAD", delay: TA.cierre.pregunta }, { texto: "APARECE?", color: AN.lima, delay: TA.cierre.pregunta + 0.25 }]} id="titular-cierre" />
      <LineaCap texto="cuando la red esté *completa*" y={290} px={30} delay={TA.cierre.pregunta - 0.3} id="cap-pieza" color={AN.blanco} />
      <Odometro valor={DISCO_HAB} x={W / 2} y={725} px={72} digitos={7} id="cierre-cuenta" opacidad={clamp(pregunta * 2)} />
      <Blancos x={W / 2} y={DISCO.cy + DISCO.R + 150} px={34} antes="DIM = " valor="3" resuelve={TA.cierre.pregunta + 0.8} delay={TA.cierre.abre + 1.4} id="cierre-dim" color={AN.lima} />
    </Lienzo>
  );
};
