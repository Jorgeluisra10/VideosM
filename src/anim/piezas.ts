/**
 * PIEZAS A MEDIDA (carril B): escenas diseñadas y programadas a mano para UN video concreto, con su propia idea visual (no son plantillas genéricas).
 * Una escena de tipo "PIEZA" dice `{"t":"PIEZA","pieza":{"id":"metro-rieles"}}` y el motor dibuja el componente registrado con ese id
 * (src/viral/piezas/). Aquí vive lo PURO de cada pieza: su duración ideal, el fondo que pide (oscuro o papel), los tiempos que comparten el dibujo y
 * el sonido, los datos que usa y sus efectos de sonido. Se mezclan con las plantillas normales (HOOK, PUNCH, PAPEL…) en el mismo video.
 *
 * Piloto incluido: «Metro de Bogotá» (ensayo visual de periodismo de datos) — ejemplos/animacion-viral/*metro-bogota*.
 */
import type { EventoSfx } from "./tipos";

export type DefPieza = {
  id: string;
  nombre: string;
  /** segundos que necesita para mostrar todo con calma */
  ideal: number;
  /** "light" = papel (estudio analítico); "dark" = negro mate */
  fondo: "dark" | "light";
  /** efectos de sonido (tiempos escalados por `ritmo`) */
  sfx: (dur: number, ritmo: number) => EventoSfx[];
  /** cómo entra esta pieza: «semitono» (cortinilla de puntos), «zoom» (la cámara viaja en Z) o «corte» (match-cut seco). Sin valor, lo que decida el estilo. */
  entra?: "semitono" | "zoom" | "corte";
};

/* ───────────── datos del piloto «Metro de Bogotá» (los que dio el brief; los marcados «≈» son aproximados y hay que verificarlos antes de publicar) ───────────── */

/** Kilómetros de metro en operación por ciudad (Bogotá = 0: la Línea 1 aún no opera). */
export const METRO_KM: { ciudad: string; km: number; aprox?: boolean }[] = [
  { ciudad: "Santiago", km: 140 },
  { ciudad: "São Paulo", km: 104 },
  { ciudad: "Buenos Aires", km: 56 },
  { ciudad: "Lima", km: 35, aprox: true },
  { ciudad: "Medellín", km: 31, aprox: true },
  { ciudad: "Quito", km: 23, aprox: true },
  { ciudad: "Bogotá", km: 0 },
];

/** Datos de la Línea 1 y del sistema de superficie. */
export const METRO_DATOS = { habitantes: 8_000_000, kmLinea: 24, velSuperficie: 12, velMetro: 43, minMetro: 27, pasajerosHora: 72_000, horasPerdidas: 100, carrilesEquivalentes: 25 } as const;

/**
 * Valorización del suelo (%) a `d` metros de una estación: +35 % hasta los 500 m, baja a +20 % a los 800 m y se apaga hacia los 1.500 m
 * (rango de 20–35 % en el radio de 500–800 m que dio el brief; la forma de la caída más allá es ilustrativa).
 */
export function valorSuelo(d: number): number {
  if (d <= 500) return 35;
  if (d <= 800) return 35 - (15 * (d - 500)) / 300;
  if (d <= 1500) return 20 * (1 - (d - 800) / 700);
  return 0;
}

/* ───────────── tiempos compartidos entre el dibujo y el sonido (segundos a ritmo normal) ───────────── */

export const TP = {
  plano: { cuenta: 0.5, cuentaDur: 1.9, caida: 1.0, caidaDur: 2.2, sello: 3.8 },
  friccion: { dial: 0.6, dialDur: 2.6, reloj: 2.4, relojDur: 4.0, cuatro: 6.9 },
  rieles: { fila: (i: number): number => 0.7 + 0.42 * i, filaDur: 1.4, vacio: 4.4 },
  /** la carrera: τ (min) = 68 · (t − ini) / dur; el tren llega a los 27 min */
  carrera: { ini: 1.5, dur: 8.2, minTotal: 68 },
  capacidad: { ini: 0.8, dur: 3.8, lineas: 5.2 },
  suelo: { onda: 1.2, ondaDur: 3.6, cifra: 1.4, cifraDur: 3.4 },
  curva: { puntos: 0.6, puntosDur: 1.6, curva: 2.4, curvaDur: 2.4 },
  silueta: { barrido: 1.8, barridoDur: 5.2 },
  balanza: { ini: 1.0, dur: 4.2 },
} as const;

/** Instante (s, a ritmo normal) en que el tren llega al final de la carrera (27 de los 68 min simulados). */
export const tTrenLlega = (): number => TP.carrera.ini + (TP.carrera.dur * METRO_DATOS.minMetro) / TP.carrera.minTotal;

const ev = (t: number, tipo: EventoSfx["tipo"], vol = 0.14): EventoSfx => ({ t, tipo, vol });
/** clics mecánicos (cada ≈ 0,13 s) mientras un contador cuenta */
const clics = (t0: number, dur: number, vol = 0.06): EventoSfx[] => Array.from({ length: Math.max(0, Math.floor(dur / 0.13)) }, (_, k) => ev(t0 + k * 0.13, "clic", vol));

/**
 * Tiempos del ensayo «Anomalía» (v2 abstracto), compartidos entre el dibujo y el sonido (s a ritmo normal).
 */
export const TA = {
  disco: { tacha: 1.3, cuenta: 0.4, cuentaDur: 2.4, dim: 5.2 },
  friccion: { ini: 0.8, dial: 6.0, knob: [0.8, 2.8, 4.8] as readonly number[], horas: 1.5, horasDur: 7.0 },
  continente: { fila: (i: number): number => 0.6 + 0.5 * i, filaDur: 1.6, vacio: 4.6 },
  vertical: { tacha: 1.1, alza: 2.8, alzaDur: 2.2 },
  carrera: { ini: 0.9, dur: 7.4, minTotal: 68, tacha: 3.6, flujo: 5.8, flujoDur: 3.6 },
  escala: { zoomIni: 0.3, zoomDur: 6.3 },
  suelo: { onda: 1.0, ondaDur: 4.4, cifra: 1.6, cifraDur: 4.2 },
  lab: { knob: 0.9, knobDur: 6.4 },
  compresion: { ini: 0.8, dur: 3.8, fusion: 4.8, fusionDur: 1.8 },
  cierre: { abre: 0.25, abreDur: 3.4, pregunta: 3.5 },
} as const;

/** Instante (s, ritmo normal) en que la línea elevada llega al final de la carrera de «Anomalía» (27 de los 68 min simulados). */
export const tLlegaCarrera = (): number => TA.carrera.ini + (TA.carrera.dur * METRO_DATOS.minMetro) / TA.carrera.minTotal;

/** instante (s) en que el zoom logarítmico de «anom-escala» cruza la potencia de diez `lw` (búsqueda numérica sobre easeInOut) */
const tCruceZoom = (lw: number): number => {
  const ease = (k: number): number => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  let lo = 0, hi = 1;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; (4.5 + (-0.3 - 4.5) * ease(m) > lw ? (lo = m) : (hi = m)); }
  return TA.escala.zoomIni + ((lo + hi) / 2) * TA.escala.zoomDur;
};

/** Km de metro en operación (video «Bogotá, la ciudad sin metro»): cifras redondeadas de las operadoras y de la lista de sistemas de transporte ferroviario de América Latina (2023–2025); Quito 22,5 km. */
export const REDES_KM: { ciudad: string; km: number }[] = [
  { ciudad: "Santiago", km: 149 },
  { ciudad: "São Paulo", km: 110 },
  { ciudad: "Buenos Aires", km: 57 },
  { ciudad: "Lima", km: 40 },
  { ciudad: "Medellín", km: 31 },
  { ciudad: "Quito", km: 23 },
  { ciudad: "Bogotá", km: 0 },
];

/** Datos verificados con fuente (búsqueda web; ver ejemplos/animacion-viral/guion-tecnico-bogota-real.md). */
export const BOG = {
  habitantes1942: 400_000,
  habitantes2025: 7_942_867,
  anioEstudio: 1942,
  anioAdjudicacion: 2019,
  horasInrix2019: 191,
  pasHoraTM: 43_000,
  pasBusTM: 150,
  velTM: "22–24",
  km: 24,
  estaciones: 16,
  alturaM: 14,
  pasTren: 1800,
  intervaloS: 90,
  pasHoraMetro: 72_000,
  velMetro: 43,
  minMetro: 27,
  horasHoy: 2,
  plusvalia800: 11.7,
  plusvalia2023: 8.8,
  rentaMin: 6.8,
  rentaMax: 9.3,
  avance: 83.7,
  anioMedellin: 1995,
  anioApertura: 2028,
} as const;

/**
 * Tiempos del video «Bogotá, la ciudad sin metro» (v3, figuras realistas): compartidos entre el dibujo y el sonido (s a ritmo normal).
 */
export const TR = {
  historia: { ini: 0.9, dur: 6.6, num: [0.9, 7.2] as readonly number[] },
  trancon: { ini: 1.2, dur: 6.4, cuatro: 8.2 },
  bus: { llega: 0.3, llegaDur: 3.2, cifra: 3.4, cifraDur: 3.2 },
  redes: { fila: (i: number): number => 0.8 + 0.55 * i, filaDur: 1.2, cero: 5.6 },
  tiempo: { ini: 1.0, dur: 4.6, cota: 5.6 },
  viaducto: { pasa: 1.6, cota: 3.0, cifras: 4.6 },
  untren: { ini: 1.6, paso: 0.34, cifra: 1.0, ciclo: 6.0 },
  resultado: { ini: 1.2, dur: 5.0, barras: 6.6, barrasDur: 2.8 },
  plusvalia: { onda: 1.2, ondaDur: 4.2, cifra: 3.0, cifraDur: 3.6 },
  caminata: { ini: 1.4, dur: 4.2, tag: 5.8 },
  cierre: { tren: 1.2, pregunta: 6.4 },
} as const;

/**
 * Datos del video «Médicos que se probaron a sí mismos» (v4). Cada cifra tiene su fuente en pantalla y en ejemplos/animacion-viral/guion-tecnico-medicos-experimento.md.
 * Lo que NO se afirma porque no está confirmado: longitud del catéter de Forssmann, mililitros/UFC exactos del caldo de Marshall, día exacto de sus síntomas, fecha exacta de la cirugía de Rogozov y quién sostenía qué.
 */
export const MED = {
  forssmann: { anio: 1929, nobel: 1956 },
  marshall: { anio: 1984, nobel: 2005 },
  rogozov: { anio: 1961, minutos: 105 },
  /** prevalencia mundial de H. pylori (%): meta-análisis de 73 países (Zamani et al., Aliment Pharmacol Ther 2018; IC 95 % 40,9–47,7). Otros estudios dan cifras más altas (Hooi 2017: ≈ 4.400 millones de personas en 2015) */
  pylori: { prevalencia: 44.3 },
} as const;

/** Tiempos del video médico, compartidos entre el dibujo y el sonido (segundos a ritmo normal). */
export const TM = {
  gancho: { sonda: 3.0, vaso: 5.6, bisturi: 7.3 },
  sonda1: { ruta: 2.6, rutaDur: 3.6 },
  sonda2: { ini: 3.3, dur: 2.9, flash: 8.7 },
  nobel1: { medalla: 3.3, anio: 6.8 },
  pylori1: { lupa: 5.2 },
  vaso: { beber: 6.6, beberDur: 3.0, anio: 5.8 },
  gastritis: { endo: 3.1, rojo: 3.6, rojoDur: 3.4, caps: 8.4 },
  nobel2: { picto: 3.7, pictoDur: 3.0, medalla: 7.1 },
  polar1: { viento: 6.8, dolor: 5.5 },
  cirugia: { reloj: 4.7, relojDur: 4.4 },
  polar2: { sol: 0.6, solDur: 6.6, dias: 2.6, diasDur: 3.2 },
  cierre: { tarjetas: 0.5, noImites: 4.4, pregunta: 7.4 },
} as const;

/**
 * Datos del video «El pegamento que no era pegamento» (SINAPSIS). Cada cifra tiene su fuente en pantalla y en ejemplos/animacion-viral/guion-tecnico-astrocitos.md.
 * Lo que NO se afirma: que los astrocitos «controlen» la memoria (hay evidencia de que participan y de que su reactivación estimuló el recuerdo en ratones), ni cifras en personas.
 */
export const AST = {
  /** Azevedo et al., J Comp Neurol 2009 (cerebro adulto masculino; fraccionador isotrópico): neuronas y células NO neuronales, en unidades */
  neuronas: 86_100_000_000,
  noNeuronales: 84_600_000_000,
  /** Oberheim et al., J Neurosci 2009: sinapsis dentro del dominio de un astrocito humano (estimación: ≈ 270.000 a 2 millones; en roedores ≈ 20.000–120.000) */
  sinapsisMin: 270_000,
  sinapsisMax: 2_000_000,
  /** primer uso documentado del término «neuroglia» por Virchow (hay fuentes que dan 1858 para su presentación pública) */
  anioGlia: 1856,
} as const;

/** Tiempos del video de astrocitos, compartidos entre el dibujo y el sonido (segundos a ritmo normal). */
export const TAS = {
  gancho: { frasco: 0.2, grieta: 2.3, rotura: 2.95, estrella: 3.0 },
  glia: { neurona: 0.3, pegotes: 1.6, anio: 0.3, anioDur: 2.1, etq: 3.3 },
  mitad: { puntos: 0.3, puntosDur: 1.4, neuronas: 1.9, otras: 3.7, cifras: 3.9 },
  estrella: { crece: 0.4, creceDur: 2.2, sinapsis: 3.1, cuenta: 3.2, cuentaDur: 1.7 },
  dialogo: { vesiculas: 0.7, calcio: 1.8, fortalece: 3.0 },
  memoria: { activa: 1.2, enlaces: 2.2, recuerdo: 3.1 },
} as const;

/* ───────────── «La regla del 37 %» (problema de la parada óptima, ensayo abstracto para IMNOBA) ───────────── */

/** Generador pseudoaleatorio determinista (mulberry32): mismos números en el render, en las pruebas y en cada fotograma. */
export function mulberry32(semilla: number): () => number {
  let s = semilla | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Probabilidad EXACTA de quedarte con la mejor de `n` opciones si rechazas las primeras `k` y eliges la primera que supere a todas las anteriores:
 * P(k) = (k/n) · Σ_{j=k}^{n-1} 1/j  (k ≥ 1). Con k = 0 eliges la primera: 1/n. Es el problema de la secretaria (Gilbert y Mosteller, JASA 1966).
 */
export function probParada(n: number, k: number): number {
  if (k <= 0) return 1 / n;
  if (k >= n) return 0;
  let s = 0;
  for (let j = k; j <= n - 1; j++) s += 1 / j;
  return (k / n) * s;
}

/** Cuántas opciones rechazar al principio para maximizar la probabilidad (n = 10 → 3, 20 → 7, 100 → 37). */
export function kOptimo(n: number): number {
  let mejor = 0, pm = probParada(n, 0);
  for (let k = 1; k < n; k++) { const p = probParada(n, k); if (p > pm + 1e-15) { pm = p; mejor = k; } }
  return mejor;
}

/** Aplica la regla a una fila de valores (el mayor es el mejor): rechaza `k`, y elige la primera que supere al mejor visto; si ninguna, la última. Devuelve el índice elegido. */
export function aplicarRegla(vals: number[], k: number): number {
  let ref = 0;
  for (let i = 0; i < Math.min(k, vals.length); i++) ref = Math.max(ref, vals[i]);
  for (let i = k; i < vals.length; i++) if (vals[i] > ref) return i;
  return vals.length - 1;
}

/** Simulación Monte Carlo de la regla (semilla fija): `aciertos` = veces que se eligió a la mejor; `acum[j]` = aciertos tras `100·j` intentos; `primeros` = resultado de los primeros 100 intentos. */
export function simularParada(n: number, k: number, intentos: number, semilla: number): { aciertos: number; acum: number[]; primeros: boolean[] } {
  const rnd = mulberry32(semilla);
  const a = Array.from({ length: n }, (_, i) => i + 1);
  let aciertos = 0;
  const acum = [0], primeros: boolean[] = [];
  for (let t = 0; t < intentos; t++) {
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; }
    const ok = a[aplicarRegla(a, k)] === n;
    if (ok) aciertos++;
    if (t < 100) primeros.push(ok);
    if ((t + 1) % 100 === 0) acum.push(aciertos);
  }
  return { aciertos, acum, primeros };
}

/**
 * Fila de `n` valores (1…n, el mayor es el mejor) con la mejor en la posición `mejorEn` (0-based). Con `previo`, ese valor va en su posición y las posiciones anteriores a `limite`
 * (por defecto `mejorEn`) solo llevan valores menores: así «previo» es el mejor de todo lo visto hasta `limite` y la regla se puede mostrar paso a paso.
 */
export function construirSecuencia(o: { n: number; mejorEn: number; semilla: number; previo?: { pos: number; valor: number }; limite?: number }): number[] {
  const { n } = o;
  const rnd = mulberry32(o.semilla);
  const mezcla = (x: number[]): number[] => { for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = x[i]; x[i] = x[j]; x[j] = t; } return x; };
  const out = new Array<number>(n).fill(0);
  out[o.mejorEn] = n;
  const resto = mezcla(Array.from({ length: n - 1 }, (_, i) => i + 1).filter((v) => v !== o.previo?.valor));
  if (!o.previo) {
    for (let i = 0; i < n; i++) if (i !== o.mejorEn) out[i] = resto.pop() as number;
    return out;
  }
  out[o.previo.pos] = o.previo.valor;
  const limite = o.limite ?? o.mejorEn;
  const bajos = resto.filter((v) => v < o.previo!.valor), otros = resto.filter((v) => v > o.previo!.valor);
  const antes: number[] = [];
  for (let i = 0; i < limite; i++) if (i !== o.previo.pos) antes.push(i);
  for (const i of antes) out[i] = bajos.pop() as number;
  const libres = mezcla([...bajos, ...otros]);
  for (let i = 0; i < n; i++) if (out[i] === 0) out[i] = libres.pop() as number;
  return out;
}

/** Todas las órdenes posibles de `n` opciones (1 = la peor … n = la mejor) y qué pasa con la regla «rechaza `k` y elige la primera mejor que las vistas»: índice elegido y si fue la mejor. */
export function enumerarOrdenes(n: number, k: number): { orden: number[]; eligio: number; acierta: boolean }[] {
  const out: { orden: number[]; eligio: number; acierta: boolean }[] = [];
  const rec = (pref: number[], libres: number[]): void => {
    if (!libres.length) { const e = aplicarRegla(pref, k); out.push({ orden: pref, eligio: e, acierta: pref[e] === n }); return; }
    libres.forEach((v, q) => rec([...pref, v], libres.filter((_, z) => z !== q)));
  };
  rec([], Array.from({ length: n }, (_, a) => a + 1));
  return out;
}

/** Datos del video «La regla del 37 %». */
export const PAR = {
  n: 100,
  k: 37,
  /** simulación de la escena de comprobación */
  sim: { intentos: 10000, semilla: 2024 },
  /** la regla en acción: el mejor de los primeros 37 vale 88 (posición 29); la primera que lo supera es la mejor, en la 61 */
  regla: { mejorEn: 60, previo: { pos: 28, valor: 88 }, semilla: 23 },
  /** Kepler (relato de Ferguson, 1989): 11 candidatas y se casó con la quinta; 11/e ≈ 4 */
  kepler: { anio: 1611, candidatas: 11, elegida: 5 },
  /** plazo de ejemplo para la versión «por tiempo» (si las opciones llegan a ritmo parejo): 37 % de 90 días */
  plazo: 90,
  fuente: "Gilbert y Mosteller, «Recognizing the Maximum of a Sequence», JASA 61 (1966)",
} as const;

export const secRegla = (): number[] => construirSecuencia({ n: PAR.n, mejorEn: PAR.regla.mejorEn, previo: PAR.regla.previo, semilla: PAR.regla.semilla });

/** Tiempos de «La regla del 37 %» (s a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TPA = {
  gancho: { camina: 0.6, caminaDur: 3.2, pronto: 4.0, tarde: 6.6, vendida: 7.4, regla: 9.4 },
  kepler: { fila: 1.2, paso: 0.26, rechaza: 4.8, elige: 7.0 },
  n3: { fila: (i: number): number => 1.4 + 1.3 * i, filaDur: 1.1, total: 9.8 },
  regla: { obs: 1.0, obsDur: 3.6, fija: 4.8, sigue: 6.6, sigueDur: 2.8, elige: 9.6 },
  curva: { ini: 0.8, dur: 4.4, vuelve: 6.0, vuelveDur: 1.0, pico: 7.2 },
  simula: { puntos: 0.8, cuenta: 2.6, cuentaDur: 3.6, final: 8.2 },
  aplica: { f1: 0.8, f2: 2.6, cal: 6.0, calDur: 2.8, nota: 9.6 },
  supuestos: { c: (i: number): number => 1.2 + 2.3 * i, final: 8.4 },
} as const;

export const PIEZAS: Record<string, DefPieza> = {
  "metro-plano": {
    id: "metro-plano", nombre: "8 millones en un solo plano", ideal: 7.6, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ...clics(TP.plano.cuenta * r, TP.plano.cuentaDur * r), ...[0, 1, 2, 3, 4, 5].map((k) => ev((TP.plano.caida + (TP.plano.caidaDur * k) / 6) * r, "pop", 0.09)), ev(TP.plano.sello * r, "golpe", 0.22), ev(TP.plano.sello * r, "thud", 0.16)],
  },
  "metro-friccion": {
    id: "metro-friccion", nombre: "Fricción pura (buses, semáforos, 12 km/h)", ideal: 8.2, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TP.friccion.dial * r, "zap", 0.1), ...clics(TP.friccion.reloj * r, TP.friccion.relojDur * r, 0.05), ev(TP.friccion.cuatro * r, "golpe", 0.2), ev(TP.friccion.cuatro * r + 0.4, "ding", 0.12)],
  },
  "metro-rieles": {
    id: "metro-rieles", nombre: "Kilómetros de metro: Sudamérica vs. Bogotá", ideal: 7.4, fondo: "dark",
    sfx: (_d, r) => [...METRO_KM.slice(0, 6).map((_, i) => ev(TP.rieles.fila(i) * r, "pop", 0.1)), ev(TP.rieles.vacio * r, "estatica", 0.1), ev(TP.rieles.vacio * r + 0.2, "radar", 0.12), ev(TP.rieles.vacio * r + 1.4, "golpe", 0.2)],
  },
  "metro-carrera": {
    id: "metro-carrera", nombre: "La carrera de 24 km: viaducto vs. superficie", ideal: 10.4, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ev(TP.carrera.ini * r, "whoosh", 0.16), ...clics(TP.carrera.ini * r, 2.6, 0.04), ev(tTrenLlega() * r, "ding", 0.2), ev(tTrenLlega() * r, "golpe", 0.14), ev((TP.carrera.ini + TP.carrera.dur) * r, "thud", 0.12)],
  },
  "metro-capacidad": {
    id: "metro-capacidad", nombre: "72.000 pasajeros por hora y sentido", ideal: 7.2, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TP.capacidad.ini * r, TP.capacidad.dur * r, 0.06), ...[0, 1, 2, 3, 4, 5].map((k) => ev((TP.capacidad.ini + (TP.capacidad.dur * (k + 1)) / 6) * r, "pop", 0.08)), ev(TP.capacidad.lineas * r, "ding", 0.16)],
  },
  "metro-suelo": {
    id: "metro-suelo", nombre: "Centro de gravedad financiero (suelo en 3D)", ideal: 9.4, fondo: "light",
    sfx: (_d, r) => [ev(TP.suelo.onda * r, "radar", 0.14), ev((TP.suelo.onda + 0.3) * r, "whoosh", 0.1), ...clics(TP.suelo.cifra * r, TP.suelo.cifraDur * r, 0.05), ev((TP.suelo.cifra + TP.suelo.cifraDur) * r, "ding", 0.16)],
  },
  "metro-curva": {
    id: "metro-curva", nombre: "Valorización vs. distancia a la estación", ideal: 6.8, fondo: "light",
    sfx: (_d, r) => [...Array.from({ length: 8 }, (_, k) => ev((TP.curva.puntos + (TP.curva.puntosDur * k) / 8) * r, "tick", 0.06)), ev(TP.curva.curva * r, "zap", 0.1), ev((TP.curva.curva + TP.curva.curvaDur) * r, "ding", 0.15)],
  },
  "metro-silueta": {
    id: "metro-silueta", nombre: "La silueta cambia (antes y después)", ideal: 8.4, fondo: "dark",
    sfx: (_d, r) => [ev(TP.silueta.barrido * r, "whoosh", 0.16), ...[0.2, 0.45, 0.7].map((k) => ev((TP.silueta.barrido + TP.silueta.barridoDur * k) * r, "pop", 0.1)), ev((TP.silueta.barrido + TP.silueta.barridoDur) * r, "ding", 0.15)],
  },
  "metro-balanza": {
    id: "metro-balanza", nombre: "Se comprime el tiempo, se multiplica el valor", ideal: 7.4, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TP.balanza.ini * r, "zap", 0.12), ...clics(TP.balanza.ini * r, TP.balanza.dur * r, 0.05), ev((TP.balanza.ini + TP.balanza.dur) * r, "golpe", 0.2), ev((TP.balanza.ini + TP.balanza.dur) * r + 0.3, "ding", 0.14)],
  },

  /* ───────────── ensayo «Anomalía» (v2 abstracto) ───────────── */
  "anom-disco": {
    id: "anom-disco", nombre: "Anomalía · el disco (gancho)", ideal: 7.4, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ...clics(TA.disco.cuenta * r, TA.disco.cuentaDur * r, 0.05), ev(TA.disco.tacha * r, "golpe", 0.24), ev(TA.disco.tacha * r, "thud", 0.16), ev((TA.disco.tacha + 0.25) * r, "polvo", 0.1), ev(TA.disco.dim * r, "ding", 0.15)],
  },
  "anom-friccion": {
    id: "anom-friccion", nombre: "Anomalía · fricción (multiagente)", ideal: 10.4, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(TA.friccion.ini * r, "zap", 0.1), ...TA.friccion.knob.map((k) => ev(k * r, "tick", 0.1)), ...clics(TA.friccion.horas * r, TA.friccion.horasDur * r, 0.045), ev((TA.friccion.horas + TA.friccion.horasDur) * r, "golpe", 0.2), ev((TA.friccion.horas + TA.friccion.horasDur) * r + 0.35, "ding", 0.12)],
  },
  "anom-continente": {
    id: "anom-continente", nombre: "Anomalía · seis redes y un vacío", ideal: 9.4, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [...METRO_KM.slice(0, 6).map((_, i) => ev(TA.continente.fila(i) * r, "pop", 0.1)), ev(TA.continente.vacio * r, "estatica", 0.1), ev(TA.continente.vacio * r + 0.2, "radar", 0.12), ev((TA.continente.vacio + 1) * r, "golpe", 0.2)],
  },
  "anom-vertical": {
    id: "anom-vertical", nombre: "Anomalía · el eje Z (isométrico)", ideal: 9.2, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TA.vertical.tacha * r, "golpe", 0.22), ev(TA.vertical.alza * r, "whoosh", 0.16), ev((TA.vertical.alza + TA.vertical.alzaDur) * r, "thud", 0.16), ev((TA.vertical.alza + TA.vertical.alzaDur) * r + 0.1, "ding", 0.16)],
  },
  "anom-carrera": {
    id: "anom-carrera", nombre: "Anomalía · duelo estroboscópico y flujo", ideal: 10.6, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TA.carrera.ini * r, "whoosh", 0.15), ...clics(TA.carrera.ini * r, 2.4, 0.04), ev(TA.carrera.tacha * r, "golpe", 0.2), ev(tLlegaCarrera() * r, "ding", 0.2), ...clics(TA.carrera.flujo * r, TA.carrera.flujoDur * r, 0.05), ev((TA.carrera.flujo + TA.carrera.flujoDur) * r, "ding", 0.15)],
  },
  "anom-escala": {
    id: "anom-escala", nombre: "Anomalía · ANCHO DEL CUADRO (zoom en Z)", ideal: 6.9, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ...[4, 3, 2, 1, 0].map((k) => ev(tCruceZoom(k) * r, "clic", 0.12)), ev((TA.escala.zoomIni + TA.escala.zoomDur - 0.3) * r, "whoosh", 0.18)],
  },
  "anom-suelo": {
    id: "anom-suelo", nombre: "Anomalía · parcelas extruidas (papel)", ideal: 10.4, fondo: "light", entra: "corte",
    sfx: (_d, r) => [ev(TA.suelo.onda * r, "radar", 0.14), ev((TA.suelo.onda + 0.3) * r, "whoosh", 0.1), ...clics(TA.suelo.cifra * r, TA.suelo.cifraDur * r, 0.05), ev((TA.suelo.cifra + TA.suelo.cifraDur) * r, "ding", 0.16)],
  },
  "anom-laboratorio": {
    id: "anom-laboratorio", nombre: "Anomalía · laboratorio de valorización (papel)", ideal: 8.8, fondo: "light", entra: "corte",
    sfx: (_d, r) => [...Array.from({ length: 12 }, (_, k) => ev((TA.lab.knob + (TA.lab.knobDur * k) / 12) * r, "tick", 0.07)), ev((TA.lab.knob + TA.lab.knobDur * 0.34) * r, "zap", 0.1), ev((TA.lab.knob + TA.lab.knobDur) * r, "ding", 0.15)],
  },
  "anom-compresion": {
    id: "anom-compresion", nombre: "Anomalía · metaballs: tiempo y suelo", ideal: 7.4, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TA.compresion.ini * r, "zap", 0.12), ...clics(TA.compresion.ini * r, TA.compresion.dur * r, 0.05), ev(TA.compresion.fusion * r, "whoosh", 0.14), ev((TA.compresion.fusion + TA.compresion.fusionDur) * r, "golpe", 0.2), ev((TA.compresion.fusion + TA.compresion.fusionDur) * r + 0.25, "ding", 0.14)],
  },
  "anom-cierre": {
    id: "anom-cierre", nombre: "Anomalía · cierre en bucle (la pregunta)", ideal: 6.8, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TA.cierre.abre * r, "whoosh", 0.16), ev((TA.cierre.abre + 1.2) * r, "radar", 0.1), ev(TA.cierre.pregunta * r, "ding", 0.16), ev((TA.cierre.pregunta + 0.4) * r, "golpe", 0.12)],
  },

  /* ───────────── «Bogotá, la ciudad sin metro» (v3 · figuras realistas) ───────────── */
  "real-historia": {
    id: "real-historia", nombre: "Realista · 77 años esperando (la ciudad crece)", ideal: 8.6, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ...clics(TR.historia.num[0] * r, (TR.historia.num[1] - TR.historia.num[0]) * r, 0.05), ev(TR.historia.num[1] * r + 0.1, "ding", 0.16)],
  },
  "real-trancon": {
    id: "real-trancon", nombre: "Realista · 191 horas en el trancón (cronómetro)", ideal: 10.8, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TR.trancon.ini * r, TR.trancon.dur * r, 0.05), ev((TR.trancon.ini + TR.trancon.dur) * r, "golpe", 0.2), ev(TR.trancon.cuatro * r, "thud", 0.14)],
  },
  "real-bus": {
    id: "real-bus", nombre: "Realista · TransMilenio llega al semáforo", ideal: 9.8, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TR.bus.llega * r, "whoosh", 0.16), ev((TR.bus.llega + TR.bus.llegaDur) * r, "thud", 0.18), ...clics(TR.bus.cifra * r, TR.bus.cifraDur * r, 0.05), ev((TR.bus.cifra + TR.bus.cifraDur) * r, "ding", 0.14), ev(6.6 * r, "zap", 0.1)],
  },
  "real-redes": {
    id: "real-redes", nombre: "Realista · km de metro (rieles con su tren)", ideal: 10.0, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [...REDES_KM.slice(0, 6).map((_, i) => ev(TR.redes.fila(i) * r, "pop", 0.1)), ev(TR.redes.cero * r, "estatica", 0.1), ev(TR.redes.cero * r + 0.3, "radar", 0.12), ev((TR.redes.cero + 0.9) * r, "golpe", 0.2)],
  },
  "real-tiempo": {
    id: "real-tiempo", nombre: "Realista · 33 años de diferencia (línea de tiempo)", ideal: 8.0, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TR.tiempo.ini * r, TR.tiempo.dur * r, 0.05), ev((TR.tiempo.ini + TR.tiempo.dur) * r, "golpe", 0.2), ev(TR.tiempo.cota * r, "ding", 0.14)],
  },
  "real-viaducto": {
    id: "real-viaducto", nombre: "Realista · el viaducto a 14 m sobre el trancón", ideal: 8.0, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TR.viaducto.pasa * r, "whoosh", 0.18), ev((TR.viaducto.pasa + 3.1) * r, "whoosh", 0.14), ev(TR.viaducto.cota * r, "ding", 0.14), ...[0, 1, 2].map((i) => ev((TR.viaducto.cifras + i * 0.5) * r, "pop", 0.1))],
  },
  "real-untren": {
    id: "real-untren", nombre: "Realista · un tren = 12 buses articulados", ideal: 8.2, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ...Array.from({ length: 12 }, (_, i) => ev((TR.untren.ini + i * TR.untren.paso) * r, "pop", 0.08)), ev(TR.untren.ciclo * r, "ding", 0.15)],
  },
  "real-resultado": {
    id: "real-resultado", nombre: "Realista · cronómetros y barras (2 h → 27 min; 43.000 vs 72.000)", ideal: 10.4, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TR.resultado.ini * r, TR.resultado.dur * r, 0.045), ev((TR.resultado.ini + TR.resultado.dur * 0.28) * r, "ding", 0.16), ev(TR.resultado.barras * r, "whoosh", 0.14), ev((TR.resultado.barras + TR.resultado.barrasDur) * r, "golpe", 0.2)],
  },
  "real-plusvalia": {
    id: "real-plusvalia", nombre: "Realista · las torres suben alrededor de la estación", ideal: 9.6, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TR.plusvalia.onda * r, "radar", 0.14), ev((TR.plusvalia.onda + 0.2) * r, "whoosh", 0.1), ...clics(TR.plusvalia.cifra * r, TR.plusvalia.cifraDur * r, 0.05), ev((TR.plusvalia.cifra + TR.plusvalia.cifraDur) * r, "ding", 0.16)],
  },
  "real-caminata": {
    id: "real-caminata", nombre: "Realista · 5 minutos a pie = −6,8 a −9,3 % de arriendo", ideal: 10.0, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [...Array.from({ length: Math.floor((TR.caminata.dur * r) / 0.4) }, (_, k) => ev(TR.caminata.ini * r + k * 0.4, "tick", 0.06)), ev(TR.caminata.tag * r, "pop", 0.14), ev(TR.caminata.tag * r + 0.05, "golpe", 0.14), ev(6.8 * r, "ding", 0.14)],
  },
  "real-cierre": {
    id: "real-cierre", nombre: "Realista · marzo de 2028 (cierre con la pregunta)", ideal: 10.4, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ev(TR.cierre.tren * r, "whoosh", 0.12), ev(1.0 * r, "clic", 0.1), ev(TR.cierre.pregunta * r, "golpe", 0.2), ev(TR.cierre.pregunta * r + 0.3, "ding", 0.16)],
  },
  /* ───────────── «Médicos que se probaron a sí mismos» (v4 · figuras médicas realistas) ───────────── */
  "med-gancho": {
    id: "med-gancho", nombre: "Médico · tres experimentos sobre la mesa (gancho)", ideal: 10.4, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ev(TM.gancho.sonda * r, "pop", 0.12), ev(TM.gancho.vaso * r, "pop", 0.12), ev(TM.gancho.bisturi * r, "pop", 0.12), ev(8.9 * r, "ding", 0.16)],
  },
  "med-sonda1": {
    id: "med-sonda1", nombre: "Médico · 1929 la ruta imaginada hasta el corazón", ideal: 10.1, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(0.4 * r, 1.8 * r, 0.05), ev(TM.sonda1.ruta * r, "zap", 0.1), ev(6.9 * r, "golpe", 0.2), ev(8.3 * r, "thud", 0.14)],
  },
  "med-sonda2": {
    id: "med-sonda2", nombre: "Médico · la sonda llega a la aurícula (radiografía)", ideal: 10.8, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "heartbeat", 0.14), ev(1.9 * r, "pop", 0.1), ...clics(TM.sonda2.ini * r, TM.sonda2.dur * r, 0.04), ev(TM.sonda2.flash * r, "zap", 0.16), ev(TM.sonda2.flash * r + 0.12, "ding", 0.18)],
  },
  "med-nobel1": {
    id: "med-nobel1", nombre: "Médico · medalla Nobel 1956", ideal: 10.1, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "golpe", 0.14), ev(TM.nobel1.medalla * r, "whoosh", 0.16), ev((TM.nobel1.medalla + 0.3) * r, "thud", 0.18), ...clics(TM.nobel1.anio * r, 1.6 * r, 0.05), ev((TM.nobel1.anio + 1.7) * r, "ding", 0.2)],
  },
  "med-pylori1": {
    id: "med-pylori1", nombre: "Médico · estómago con úlcera y bacteria en espiral", ideal: 9.4, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "heartbeat", 0.1), ev(TM.pylori1.lupa * r, "whoosh", 0.14), ev((TM.pylori1.lupa + 0.4) * r, "pop", 0.12), ev(7.4 * r, "radar", 0.1)],
  },
  "med-vaso": {
    id: "med-vaso", nombre: "Médico · 1984 el caldo con bacterias (vaso que se inclina)", ideal: 10.4, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(2.2 * r, "tick", 0.1), ev(5.7 * r, "golpe", 0.2), ...clics(TM.vaso.anio * r, 1.6 * r, 0.05), ev(TM.vaso.beber * r, "whoosh", 0.12), ev((TM.vaso.beber + 1.8) * r, "thud", 0.14)],
  },
  "med-gastritis": {
    id: "med-gastritis", nombre: "Médico · endoscopia: la mucosa se inflama", ideal: 10.1, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TM.gastritis.endo * r, "zap", 0.12), ev(TM.gastritis.rojo * r, "heartbeat", 0.14), ev(7.0 * r, "ding", 0.16), ...[0, 1, 2].map((i) => ev((TM.gastritis.caps + i * 0.35) * r, "pop", 0.1))],
  },
  "med-nobel2": {
    id: "med-nobel2", nombre: "Médico · pictograma 44 % y medalla Nobel 2005", ideal: 11.1, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TM.nobel2.picto * r, TM.nobel2.pictoDur * r, 0.05), ev((TM.nobel2.picto + TM.nobel2.pictoDur) * r, "ding", 0.14), ev(TM.nobel2.medalla * r, "thud", 0.18), ev((TM.nobel2.medalla + 0.2) * r, "ding", 0.2)],
  },
  "med-polar1": {
    id: "med-polar1", nombre: "Médico · Antártida 1961, ventisca y apendicitis", ideal: 10.8, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "estatica", 0.1), ev(0.2 * r, "whoosh", 0.14), ev(TM.polar1.dolor * r, "heartbeat", 0.18), ev(5.5 * r, "golpe", 0.2), ev(TM.polar1.viento * r, "whoosh", 0.16)],
  },
  "med-cirugia": {
    id: "med-cirugia", nombre: "Médico · instrumental y cronómetro hasta casi dos horas", ideal: 10.4, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...[0, 1, 2, 3].map((i) => ev((0.3 + i * 0.35) * r, "clic", 0.12)), ...clics(TM.cirugia.reloj * r, TM.cirugia.relojDur * r, 0.04), ev((TM.cirugia.reloj + TM.cirugia.relojDur) * r, "golpe", 0.2), ev(8.7 * r, "ding", 0.14)],
  },
  "med-polar2": {
    id: "med-polar2", nombre: "Médico · amanece: 14 días y de vuelta al trabajo", ideal: 8.0, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ev(0.5 * r, "ding", 0.1), ...clics(TM.polar2.dias * r, TM.polar2.diasDur * r, 0.05), ev((TM.polar2.dias + TM.polar2.diasDur) * r, "ding", 0.16), ev(6.2 * r, "pop", 0.12)],
  },
  "med-cierre": {
    id: "med-cierre", nombre: "Médico · tres tarjetas, «no lo imites» y la pregunta", ideal: 10.4, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ...[0, 1, 2].map((i) => ev((TM.cierre.tarjetas + i * 0.5) * r, "pop", 0.12)), ev(TM.cierre.noImites * r, "golpe", 0.22), ev(TM.cierre.pregunta * r, "ding", 0.16), ev((TM.cierre.pregunta + 0.4) * r, "radar", 0.1)],
  },
  /* ───────────── «La regla del 37 %» (parada óptima · IMNOBA · figuras realistas) ───────────── */
  "par-gancho": {
    id: "par-gancho", nombre: "Regla del 37 % · ¿cuándo dejas de buscar casa? (muy pronto / muy tarde)", ideal: 11.35, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ...clics(TPA.gancho.camina * r, TPA.gancho.caminaDur * r, 0.04), ev(TPA.gancho.pronto * r, "golpe", 0.18), ev(TPA.gancho.vendida * r, "thud", 0.2), ev(TPA.gancho.regla * r, "ding", 0.18)],
  },
  "par-kepler": {
    id: "par-kepler", nombre: "Regla del 37 % · Kepler y las once candidatas (1611)", ideal: 10.95, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...Array.from({ length: 11 }, (_, i) => ev((TPA.kepler.fila + i * TPA.kepler.paso) * r, "pop", 0.07)), ev(TPA.kepler.rechaza * r, "thud", 0.14), ev(TPA.kepler.elige * r, "ding", 0.2)],
  },
  "par-n3": {
    id: "par-n3", nombre: "Regla del 37 % · demostración con 3 casas (6 órdenes, 3 aciertos)", ideal: 10.75, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...Array.from({ length: 6 }, (_, i) => ev(TPA.n3.fila(i) * r, "pop", 0.09)), ...Array.from({ length: 6 }, (_, i) => ev((TPA.n3.fila(i) + 0.8) * r, "tick", 0.1)), ev(TPA.n3.total * r, "ding", 0.18)],
  },
  "par-regla": {
    id: "par-regla", nombre: "Regla del 37 % · 100 casas: observa 37 y elige la primera mejor", ideal: 11.55, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TPA.regla.obs * r, TPA.regla.obsDur * r, 0.05), ev(TPA.regla.fija * r, "thud", 0.16), ...clics(TPA.regla.sigue * r, TPA.regla.sigueDur * r, 0.045), ev(TPA.regla.elige * r, "zap", 0.16), ev(TPA.regla.elige * r + 0.15, "ding", 0.2)],
  },
  "par-curva": {
    id: "par-curva", nombre: "Regla del 37 % · curva exacta de probabilidad (pico 37,1 %)", ideal: 10.75, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TPA.curva.ini * r, TPA.curva.dur * r, 0.045), ev(TPA.curva.vuelve * r, "whoosh", 0.12), ev(TPA.curva.pico * r, "ding", 0.2), ev(TPA.curva.pico * r + 0.2, "golpe", 0.14)],
  },
  "par-simula": {
    id: "par-simula", nombre: "Regla del 37 % · 10.000 búsquedas simuladas (casas)", ideal: 10.95, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...Array.from({ length: 10 }, (_, i) => ev((TPA.simula.puntos + i * 0.2) * r, "pop", 0.06)), ...clics(TPA.simula.cuenta * r, TPA.simula.cuentaDur * r, 0.05), ev(TPA.simula.final * r, "ding", 0.18)],
  },
  "par-aplica": {
    id: "par-aplica", nombre: "Regla del 37 % · cuántas casas mirar (10, 20) y por tiempo (90 días)", ideal: 11.05, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TPA.aplica.f1 * r, "pop", 0.12), ev(TPA.aplica.f2 * r, "pop", 0.12), ...clics(TPA.aplica.cal * r, TPA.aplica.calDur * r, 0.04), ev(TPA.aplica.nota * r, "ding", 0.16)],
  },
  "par-supuestos": {
    id: "par-supuestos", nombre: "Regla del 37 % · los tres supuestos (dado, sentido único, copa)", ideal: 10.15, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...[0, 1, 2].map((i) => ev(TPA.supuestos.c(i) * r, "pop", 0.12)), ...[0, 1, 2].map((i) => ev((TPA.supuestos.c(i) + 0.15) * r, "tick", 0.1)), ev(TPA.supuestos.final * r, "ding", 0.16)],
  },
  /* ───────────── «El pegamento que no era pegamento» (astrocitos · SINAPSIS) ───────────── */
  "astro-gancho": {
    id: "astro-gancho", nombre: "Astrocitos · el frasco de «pegamento» se rompe y sale una estrella (gancho)", ideal: 3.65, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ev(TAS.gancho.frasco * r + 0.2, "pop", 0.1), ev(TAS.gancho.grieta * r, "tick", 0.12), ev(TAS.gancho.rotura * r, "golpe", 0.2), ev((TAS.gancho.estrella + 0.1) * r, "ding", 0.16)],
  },
  "astro-glia": {
    id: "astro-glia", nombre: "Astrocitos · «glía»: la neurona rodeada de pegamento (1856)", ideal: 3.95, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TAS.glia.anio * r, TAS.glia.anioDur * r, 0.05), ...[0, 1, 2, 3, 4, 5].map((i) => ev((TAS.glia.pegotes + i * 0.17) * r, "pop", 0.08)), ev(TAS.glia.etq * r, "golpe", 0.16)],
  },
  "astro-mitad": {
    id: "astro-mitad", nombre: "Astrocitos · 100 células: casi la mitad no son neuronas", ideal: 4.95, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TAS.mitad.puntos * r, TAS.mitad.puntosDur * r, 0.04), ev(TAS.mitad.neuronas * r, "zap", 0.12), ev(TAS.mitad.otras * r, "thud", 0.16), ev((TAS.mitad.otras + 0.15) * r, "ding", 0.14)],
  },
  "astro-estrella": {
    id: "astro-estrella", nombre: "Astrocitos · el astrocito crece como estrella y rodea hasta 2 millones de sinapsis", ideal: 4.95, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TAS.estrella.crece * r, TAS.estrella.creceDur * r, 0.04), ev(TAS.estrella.sinapsis * r, "zap", 0.12), ...clics(TAS.estrella.cuenta * r, TAS.estrella.cuentaDur * r, 0.05), ev((TAS.estrella.cuenta + TAS.estrella.cuentaDur) * r, "ding", 0.18)],
  },
  "astro-dialogo": {
    id: "astro-dialogo", nombre: "Astrocitos · la sinapsis tripartita: escucha y ayuda a fortalecer", ideal: 4.55, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...[0, 1, 2].map((i) => ev((TAS.dialogo.vesiculas + i * 0.45) * r, "tick", 0.1)), ev(TAS.dialogo.calcio * r, "radar", 0.1), ev(TAS.dialogo.fortalece * r, "pop", 0.14), ev((TAS.dialogo.fortalece + 0.15) * r, "ding", 0.16)],
  },
  "astro-memoria": {
    id: "astro-memoria", nombre: "Astrocitos · en ratones, reactivarlos estimuló el recuerdo", ideal: 4.15, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TAS.memoria.activa * r, "zap", 0.12), ev(TAS.memoria.enlaces * r, "radar", 0.1), ev(TAS.memoria.recuerdo * r, "golpe", 0.18), ev((TAS.memoria.recuerdo + 0.15) * r, "ding", 0.18)],
  },
};

export const IDS_PIEZA = Object.keys(PIEZAS);
export const piezaPorId = (id: unknown): DefPieza | null => (typeof id === "string" && Object.prototype.hasOwnProperty.call(PIEZAS, id) ? PIEZAS[id] : null);
