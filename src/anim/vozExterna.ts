/**
 * VOZ EXTERNA (puro): usar una voz que ya existe (CapCut, ElevenLabs, un locutor, tu propia grabación) y hacer que el VIDEO se ajuste a ella.
 * En vez de estirar la voz para que quepa en cada escena, se mide la voz: se buscan las pausas entre frases, se eligen las que separan las escenas
 * (las que mejor encajan con el largo del texto de cada una) y cada escena pasa a durar lo que dura su locución. Así voz y video quedan alineados sin editar nada a mano.
 */
import { duracionIdeal, sfxViral } from "./viral";
import type { EscenaViralGuardada } from "./viral";
import type { Animacion } from "./tipos";
import { textosVoz } from "./voces";

export type Silencio = { ini: number; fin: number };

export type ResultadoCortes = { cortes: number[]; aproximado: boolean; avisos: string[] };

/**
 * Elige los `pesos.length − 1` cortes entre escenas. `silencios` = pausas detectadas (s) dentro del habla; `desde`/`hasta` = dónde empieza y termina el habla;
 * `pesos` = tamaño del texto de cada escena (palabras o caracteres). Un corte ideal está en una pausa larga, cerca de donde «tocaría» según el reparto del texto.
 * Programación dinámica: cada corte es el centro de una pausa, en orden creciente. Si hay menos pausas que escenas, reparte lo que falte en proporción al texto (aproximado = true).
 */
export function elegirCortes(o: { silencios: Silencio[]; desde: number; hasta: number; pesos: number[] }): ResultadoCortes {
  const { desde, hasta } = o;
  const n = o.pesos.length;
  const avisos: string[] = [];
  if (n <= 1) return { cortes: [], aproximado: false, avisos };
  const total = Math.max(1e-6, o.pesos.reduce((a, b) => a + Math.max(1, b), 0));
  const habla = Math.max(0.5, hasta - desde);
  const esperado: number[] = [];
  let acum = 0;
  for (let k = 0; k < n - 1; k++) { acum += Math.max(1, o.pesos[k]); esperado.push(desde + (habla * acum) / total); }
  const prop = (): number[] => esperado.slice();
  const cand = o.silencios.filter((s) => s.fin > desde && s.ini < hasta).map((s) => ({ m: (Math.max(s.ini, desde) + Math.min(s.fin, hasta)) / 2, len: Math.min(s.fin, hasta) - Math.max(s.ini, desde) })).sort((a, b) => a.m - b.m);
  if (cand.length < n - 1) {
    avisos.push(`Solo encontré ${cand.length} pausas para ${n} escenas: repartí los tiempos según el largo de cada texto. Revisa y, si hace falta, escribe las duraciones a mano.`);
    return { cortes: prop(), aproximado: true, avisos };
  }
  const escala = Math.max(0.5, habla / n / 2);
  const coste = (k: number, j: number): number => Math.abs(cand[j].m - esperado[k]) / escala + 0.8 * Math.max(0, 0.7 - cand[j].len) / 0.7;
  const S = cand.length;
  const INF = 1e18;
  const dp: number[][] = Array.from({ length: n - 1 }, () => new Array(S).fill(INF));
  const prev: number[][] = Array.from({ length: n - 1 }, () => new Array(S).fill(-1));
  for (let j = 0; j < S; j++) dp[0][j] = coste(0, j);
  for (let k = 1; k < n - 1; k++) {
    let mejor = INF, mj = -1;
    for (let j = 0; j < S; j++) {
      // el mejor predecesor con índice < j
      if (j > 0 && dp[k - 1][j - 1] < mejor) { mejor = dp[k - 1][j - 1]; mj = j - 1; }
      if (mj >= 0) { dp[k][j] = mejor + coste(k, j); prev[k][j] = mj; }
    }
  }
  let fin = -1, mc = INF;
  for (let j = 0; j < S; j++) if (dp[n - 2][j] < mc) { mc = dp[n - 2][j]; fin = j; }
  if (fin < 0) return { cortes: prop(), aproximado: true, avisos: ["No pude elegir las pausas: repartí los tiempos según el largo de cada texto."] };
  const idx: number[] = new Array(n - 1);
  for (let k = n - 2, j = fin; k >= 0; k--) { idx[k] = j; j = prev[k][j]; }
  const cortes = idx.map((j) => Math.round(cand[j].m * 1000) / 1000);
  // aviso si algún corte quedó muy lejos de lo esperado (la voz y el texto no se parecen)
  cortes.forEach((c, k) => { if (Math.abs(c - esperado[k]) > Math.max(2.5, habla / n)) avisos.push(`El corte entre las escenas ${k + 1} y ${k + 2} (${c.toFixed(1)} s) queda lejos de lo esperado: confirma que el audio dice el mismo texto, en el mismo orden.`); });
  return { cortes, aproximado: false, avisos };
}

/** De los cortes a duraciones: la primera escena arranca en 0, la última se alarga hasta el final del audio más una `cola` de aire. */
export function duracionesDesdeCortes(cortes: number[], duracionAudio: number, cola = 0.5): number[] {
  const lim = [0, ...cortes, duracionAudio + cola];
  return lim.slice(1).map((x, i) => Math.round((x - lim[i]) * 100) / 100);
}

/**
 * Reajusta la animación (motor viral) a unas duraciones: `durs[i]` es la de la i-ésima escena CON locución; las que no tienen locución conservan la suya.
 * Recalcula inicios, fines, ritmo de cada escena y sus efectos de sonido. No cambia nada más.
 */
export function reajustarAnimacion(anim: Animacion, durs: number[]): Animacion {
  const copia: Animacion = JSON.parse(JSON.stringify(anim));
  let t = 0, k = 0;
  const escenas = copia.escenas as EscenaViralGuardada[];
  for (const e of escenas) {
    const conVoz = textosVoz({ escenas: [e as any] }).length > 0;
    const dur = Math.round(Math.max(1.2, conVoz && k < durs.length ? durs[k++] : e.dur) * 100) / 100;
    const ideal = duracionIdeal(e);
    e.inicio = Math.round(t * 100) / 100;
    e.fin = Math.round((t + dur) * 100) / 100;
    e.dur = dur;
    e.ritmo = Math.min(1, Math.max(0.55, (dur - 0.45) / ideal));
    t = e.fin;
  }
  copia.duracion = Math.round(t * 100) / 100;
  for (const e of escenas) { e.total = copia.duracion; if (copia.sfx) e.sfx = sfxViral(e, e.ritmo); }
  return copia;
}
