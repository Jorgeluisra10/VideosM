/**
 * Sonido automático de un plan de la IA (sin React: también lo lee scripts/audio.mjs vía esbuild).
 * Reglas fijas: whoosh en cada cambio de escena, pop al aparecer rótulos/etiquetas/moléculas/datos/iconos,
 * golpe grave en los elementos con "impacto": true y en el trombo, chispa en impulsos, campana al final.
 */
import plan from "../../data/plan.json";
import { PALABRAS } from "../../lib/voz";
import { tiemposDePlan, tiemposElemento } from "../../dsl/tiempos";
import type { Plan } from "../../dsl/tipos";
import type { SfxDef } from "../tipos";

const P = plan as unknown as Plan;
const CON_POP = new Set(["etiqueta", "rotulo", "molecula", "dato", "icono", "pasos", "comparacion"]);

export const impactosDePlan = (): number[] => {
  const { inicios, fines } = tiemposDePlan(P, PALABRAS);
  const out: number[] = [];
  P.escenas.forEach((e, i) => {
    for (const el of e.elementos) {
      if (el.impacto === true || el.trombo === true || el.confusion === true) out.push(tiemposElemento(el, inicios[i], fines[i], PALABRAS).t0 + (el.trombo === true ? 1.0 : 0));
    }
  });
  return out.sort((a, b) => a - b);
};

export const sfx: SfxDef[] = (() => {
  const { inicios, fines } = tiemposDePlan(P, PALABRAS);
  const lista: SfxDef[] = [];
  inicios.forEach((t, i) => {
    if (i > 0) lista.push({ t: t - 0.12, tipo: "whoosh", vol: 0.28 });
  });
  let ultimoPop = -9;
  P.escenas.forEach((e, i) => {
    for (const el of e.elementos) {
      const { t0 } = tiemposElemento(el, inicios[i], fines[i], PALABRAS);
      if (CON_POP.has(el.tipo) && t0 - ultimoPop >= 0.22) {
        lista.push({ t: t0, tipo: "pop", vol: 0.3 });
        ultimoPop = t0;
      }
      if (el.impacto === true || el.confusion === true) lista.push({ t: t0, tipo: "thud", vol: 0.5 });
      if (el.trombo === true) lista.push({ t: t0 + 1.0, tipo: "thud", vol: 0.6 });
      if (el.tipo === "impulso" || (el.tipo === "neurona" && el.impulso === true)) lista.push({ t: t0 + (el.tipo === "neurona" ? 1.6 : 0), tipo: "zap", vol: 0.25 });
      if (el.tipo === "corazon" && el.latir !== false && el.dolor !== true) {
        const fin = Math.min(fines[i], t0 + 6);
        const bpm = typeof el.bpm === "number" ? el.bpm : 74;
        for (let tt = t0 + 0.4; tt < fin; tt += 60 / bpm) lista.push({ t: tt, tipo: "latido", vol: 0.14 });
      }
    }
  });
  if (PALABRAS.length) lista.push({ t: PALABRAS[PALABRAS.length - 1].start, tipo: "ding", vol: 0.35 });
  return lista;
})();
