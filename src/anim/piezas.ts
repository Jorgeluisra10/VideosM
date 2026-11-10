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

/**
 * Datos del video «El truco de los préstamos DSCR» (IMNOBA · serie «secretos de inversión en USA»). Cada dato tiene su fuente en pantalla y en
 * ejemplos/animacion-viral/guion-tecnico-dscr.md. Lo que NO se afirma: rentabilidades, que el préstamo esté garantizado ni que no pidan NINGÚN documento
 * (piden pasaporte, prueba de fondos y reservas). 70/30 es la estructura que el pedido fija; los prestamistas varían (≈ 25–30 % de pago inicial).
 */
export const DSC = {
  /** el mito: «medio millón en efectivo» (dólares) */
  mito: 500_000,
  /** el banco financia hasta este % del valor; el comprador aporta el resto (≈ 30 %) */
  banco: 70,
  inicial: 30,
} as const;

/** Tiempos del video DSCR, compartidos entre el dibujo y el sonido (segundos a ritmo normal). */
export const TDS = {
  gancho: { casa: 0.2, cifra: 0.7, cifraDur: 1.7, mito: 2.7 },
  hack: { casa: 0.2, flujo: 1.3, cuota: 3.2, nombre: 3.7 },
  docs: { c: (i: number) => 0.6 + i * 1.0, tacha: 0.45, balanza: 3.9 },
  split: { barra: 0.4, banco: 1.0, tu: 2.5, notas: 3.5 },
  catalogo: { tel: 0.2, tarjetas: 0.9, url: 2.2 },
} as const;

/**
 * Datos del video «Los 4 tejidos» (SINAPSIS · serie anatomía humana / curiosidades médicas). Cada cifra tiene su fuente en pantalla y en
 * ejemplos/animacion-viral/guion-tecnico-tejidos.md. Matices que se respetan: el ácido gástrico solo ataca ALGUNOS metales y muy despacio; «más de 2 km/h»
 * es la velocidad PICO de la sangre en la aorta (no la media); los huesos se renuevan «casi por completo» en ≈ 10 años (aproximación); las neuronas de la
 * corteza tienen la edad de la persona (la neurogénesis del hipocampo adulto sigue en debate).
 */
export const TEJ = {
  /** renovación del epitelio digestivo (Sender y Milo, Nat Med 2021: 3–5 d en el intestino; cifras populares dan 3–4 d para el estómago) */
  epitelioDias: [3, 5],
  /** pH del jugo gástrico en ayunas (fuentes: 1,5–3,5) */
  phGastrico: [1.5, 3.5],
  /** velocidad pico de la sangre en la aorta ≈ 0,5–1,7 m/s según el punto de medida: el video dice «más de 2 km/h» (0,56 m/s) */
  sangreKmhMin: 2,
  /** renovación esquelética aproximada del adulto */
  huesoAnios: 10,
  /** vida media de células: glóbulo rojo ≈ 120 días; epidermis ≈ 2–4 semanas; epitelio intestinal 3–5 días; neurona corticales: toda la vida */
  globuloRojoDias: 120,
  epidermisSemanas: [2, 4],
} as const;

/** Tiempos del video de los 4 tejidos, compartidos entre el dibujo y el sonido (segundos a ritmo normal). */
export const TTJ = {
  gancho: { tile: (i: number) => 0.35 + i * 0.42, liquido: 2.5 },
  epitelial: { acido: 0.25, metal: 0.7, dia: (i: number) => 1.9 + i * 0.7, cifra: 4.2 },
  sangre: { tubo: 0.25, flujo: 0.6, aguja: 1.3, marca: 3.2 },
  hueso: { hueso: 0.25, barrido: 1.1, barridoDur: 2.7, chip: 3.9 },
  muscular: { corazon: 0.25, corte: 1.9, nodo: 2.7, chip: 3.6 },
  nervioso: { fila: (i: number) => 0.45 + i * 0.5, neurona: 2.7, chip: 3.7 },
} as const;

/**
 * Datos del video «Los dueños del cerebro» (SINAPSIS · serie neuroanatomía): barrera hematoencefálica, sinapsis tripartita y el estudio de Einstein.
 * Cifras con su fuente en ejemplos/animacion-viral/guion-tecnico-astrocitos-einstein.md. Matices que se respetan: la barrera la sella sobre todo el endotelio con sus
 * uniones estrechas (los astrocitos y los pericitos la inducen y mantienen); Diamond et al. 1985 contaron «glía» sin separar astrocitos y solo 1 de 4 áreas fue
 * significativa (A39 izquierda, p < 0,05, contra 11 controles); es UN cerebro: pista, no prueba. Chung et al. 2013 es en ratones.
 */
export const EIN = {
  diamondAnio: 1985,
  controles: 11,
  areasEstudiadas: 4,
  areasSignificativas: 1,
  /** p < 0,05 (t = 2,62; gl 9) en el área 39 izquierda */
  pMax: 0.05,
  chungAnio: 2013,
} as const;

/** Tiempos del video «Los dueños del cerebro» (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TEIN = {
  gancho: { vaso: 0.2, toxinas: 0.6, escudo: 2.0, estrella: 3.0 },
  barrera: { campo: 0.2, astro: 0.9, pies: 1.8, nutri: 3.0, toxi: 3.3, chip: 4.5 },
  tripartita: { dos: 0.2, falso: 1.6, astro: 2.1, chip: 3.4 },
  esculpe: { red: 0.2, poda: 1.2, podaDur: 1.9, refuerza: 3.0, constelacion: 4.1 },
  diamond: { placa: 0.2, campo: 1.1, cuenta: 1.7, cuentaDur: 2.4, pregunta: 4.3 },
  hallazgo: { campos: 0.2, esquema: 0.9, barra: 2.2, p: 3.2 },
  cautela: { ficha: (i: number) => 0.25 + i * 0.55, final: 2.6 },
  gfap: { campo: 0.2, zoom: 0.4, zoomDur: 3.6, rotulo: 0.8, fugaz: 4.4 },
} as const;

/** Datos verificados del video «El efecto del dígito izquierdo» (SINAPSIS · neuroeconomía). Fuentes en ejemplos/animacion-viral/guion-tecnico-digito-izquierdo.md. */
export const DIG = {
  /** Thomas y Morwitz, J Consumer Research 32(1), 2005: 5 experimentos; el efecto aparece solo si cambia el dígito de más a la izquierda */
  thomasAnio: 2005, thomasExperimentos: 5,
  /** Lacetera, Pope y Sydnor, Am Econ Rev 2012: > 22 millones de ventas mayoristas de autos usados; caída ≈ US$ 150–200 en cada umbral de 10.000 millas; 79.900–79.999 vs 80.000–80.100 ≈ US$ 210, y vs 79.800–79.899 ≈ US$ 10 */
  autosVentas: 22_000_000, autosSaltoMin: 150, autosSaltoMax: 200, autosUmbralMillas: 10_000, autosSalto80k: 210, autosSaltoVecino: 10,
  /** Strulov-Shlain, Review of Economic Studies 2023: ≈ 3.500 productos de 25 cadenas; +1 centavo desde un precio en 99 se vive como > 20 centavos; los minoristas pierden 1–4 % de la ganancia bruta por subestimarlo; 1/4–1/3 de los precios termina en 99 */
  escalaProductos: 3500, escalaCadenas: 25, escalaCentavos: 20, escalaPerdidaMin: 1, escalaPerdidaMax: 4,
  /** Laurent, Vanhuele et al., J Consumer Research 50(3), 2023: seguimiento ocular; la 1.ª fijación cae entre el primer tercio y el centro del precio */
  laurentAnio: 2023,
} as const;

/** Tiempos del video «El efecto del dígito izquierdo» (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TDIG = {
  gancho: { tags: 0.2, cota: 1.0, abismo: 1.9, barraReal: 2.3, barraPercibida: 2.8, chip: 3.8 },
  lectura: { precio: 0.2, cursor: 0.8, cursorDur: 2.1, ancla: 1.5, descuento: 2.7, chip: 4.1 },
  abismo: { a: 0.2, b: 1.2, mas: 2.5, cambio: 3.3, chip: 4.1 },
  autos: { ejes: 0.2, curva: 0.7, curvaDur: 2.4, cruce: 3.3, tabla: 4.1, fuente: 4.9 },
  thomas: { ficha: 0.2, filaA: 1.0, circulo: 2.1, barraA: 2.5, filaB: 3.6, igual: 4.6, barraB: 5.0, sello: 5.8 },
  escala: { balanza: 0.2, centavo: 1.0, monedas: 1.8, monedasDur: 1.5, inclina: 3.1, inclinaDur: 0.9, chip1: 4.3, chip2: 5.0 },
  ojo: { etiqueta: 0.2, calor: 0.9, calorDur: 1.4, fijaciones: 2.4, fijDur: 1.8, nota: 4.3, debate: 5.0 },
} as const;

/** Datos verificados del video «Puentes colgantes» (SINAPSIS · física estructural). Fuentes en ejemplos/animacion-viral/guion-tecnico-puentes.md. */
export const PTE = {
  /** Golden Gate (Golden Gate Bridge District): vano principal 1.280 m, torres de 227 m sobre el agua, cable de ≈ 0,92 m con 61 hebras y 27.572 alambres de 0,192 in; 61.500 t de carga de los cables sobre cada torre; anclajes de ≈ 60.000 t */
  ggVanoM: 1280, ggTorreM: 227, ggCableM: 0.92, ggHebras: 61, ggAlambres: 27_572, ggCargaTorreTon: 61_500, ggAnclajeTon: 60_000,
  /** Brooklyn (1883, diseño de J. A. Roebling): cable de ≈ 15¾ in (≈ 40 cm), 19 hebras, más de 5.000 alambres por cable (las fuentes dicen 5.434 o 5.282) y factor de seguridad de diseño 6 */
  brooklynAnio: 1883, brooklynAlambresMin: 5000, brooklynHebras: 19, brooklynFactor: 6,
  /** cable de carga uniforme: parábola con H = w·L²/(8·f) y V = w·L/2 en cada torre */
  formula: "H = w·L² / (8·f)",
} as const;

/** Tiempos del video «Puentes colgantes» (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TPTE = {
  gancho: { puente: 0.2, gravedad: 0.9, vectores: 1.7, chip: 3.2 },
  parabola: { puente: 0.2, knobs: 0.6, w: 1.0, wDur: 1.5, f: 2.9, fDur: 1.8, formula: 4.9 },
  duelo: { alambre: 0.2, xray: 1.0, cables: 1.7, vectores: 2.6, compresion: 3.8, chip1: 5.0, chip2: 5.7 },
  roebling: { ficha: 0.2, corte: 0.8, hebras: 1.6, odometro: 2.6, odometroDur: 1.6, tally: 3.2, chip: 4.8 },
  bloque: { barra: 0.2, haz: 0.9, graficas: 1.9, chip: 3.5 },
  cubo: { cubo: 0.2, puntos: 0.9, puntosDur: 2.2, margen: 3.8, formula: 5.0, chip: 5.8 },
  zoom: { ini: 0.3, dur: 4.3, chip: 5.0 },
} as const;

/** Datos del video «La física de los ruidos nocturnos» (SINAPSIS · física cotidiana). Fuentes en ejemplos/animacion-viral/guion-tecnico-ruidos.md. */
export const RUI = {
  /** coeficiente de dilatación lineal típico, 10⁻⁶ por kelvin (EngineeringToolbox, Misumi; varía según la fuente): aluminio 23; acero 12; hormigón 10–14; madera a lo largo de la fibra 3–5; madera a través de la fibra 30–70 */
  alfa: { aluminio: 23, acero: 12, hormigon: 12, maderaLargo: 4, maderaAncho: 30 },
  /** ΔL = α·L·ΔT para 1 m y una caída de 10 K, en mm */
  dl1m10K: { aluminio: 0.23, acero: 0.12, hormigon: 0.12, maderaLargo: 0.04, maderaAncho: 0.3 },
  /** velocidad del sonido en el aire a 20 °C (m/s) y distancia de ejemplo (m): tarda ≈ 14,6 ms */
  sonidoMs: 343, distanciaM: 5,
  /** un tablero de 0,5 m que se enfría 2 K con α = 30·10⁻⁶/K se acorta ≈ 30 µm */
  tableroM: 0.5, tableroK: 2, tableroMicras: 30,
} as const;

/** Tiempos del video «Ruidos nocturnos» (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TRUI = {
  gancho: { traza: 0.3, trazaDur: 2.1, pico: 2.5, ondas: 2.6, fisica: 3.8, chip: 4.2 },
  dia: { malla: 0.2, fotones: 0.8, knobs: 0.6, subida: 0.9, subidaDur: 2.8, formula: 3.5 },
  noche: { malla: 0.2, baja: 0.8, bajaDur: 2.8, tension: 2.2, formula: 3.9 },
  ritmos: { cols: 0.3, vals: 2.3, mm: 3.3, diez: 4.5, chip: 5.3 },
  friccion: { rejilla: 0.2, acumula: 0.9, acumulaDur: 3.2, salto: 4.35, ondas: 4.4, chip: 5.5, tof: 6.0 },
  remate: { panel: 0.2, trazas: 0.7, trazasDur: 2.2, nota: 3.3, ast: 4.1 },
  tally: { ficha: 0.2, tally: 0.8, barras: 2.1, sello: 3.7 },
  micro: { zoom: 0.2, zoomDur: 4.8, colapso: 5.0, colapsoDur: 0.9, pregunta: 5.9 },
} as const;

/** Datos del video «La piscina que cuelga entre dos edificios» (SINAPSIS · ingeniería extrema; Sky Pool de Embassy Gardens, Londres). Fuentes en ejemplos/animacion-viral/guion-tecnico-piscina.md. */
export const PIS = {
  /** altura de la piscina sobre el suelo (≈ 10 plantas), longitud, vano libre entre los edificios (Eckersley O'Callaghan: ≈ 15 m; otras fuentes 14 m) y profundidad, en metros */
  alturaM: 35, longitudM: 25, vanoM: 15, profundidadM: 3.2,
  /** masa del agua (t; IStructE, ≈ 148 m³) y del acrílico (t; Architectural Digest) */
  aguaTon: 150, acrilicoTon: 50,
  /** espesores según fuentes: paredes ≈ 180 mm (200 mm en el anuncio de 2015) y fondo ≈ 356 mm (14 in) */
  paredMm: 180, fondoMm: 356,
  /** dos tensores de acero inoxidable de 38 mm bajo la piscina que unen las dos tinas de acero (pretensados o postensados según la fuente) */
  tensoresN: 2, tensorMm: 38,
  /** densidades (g/cm³): acrílico ≈ 1,18 y vidrio ≈ 2,4–2,8; índices de refracción: acrílico ≈ 1,49 y agua ≈ 1,33; acrílico ≈ ¼ de la resistencia y ≈ 20× más flecha que el vidrio (Eckersley O'Callaghan, vía RIBA J) */
  densAcrilico: 1.18, densVidrio: 2.6, nAcrilico: 1.49, nAgua: 1.33, resistRel: 0.25, flechaRel: 20,
  /** izado con una grúa móvil de 500 t en ≈ 2 horas; abrió a los residentes el 19 de mayo de 2021 */
  gruaTon: 500, izadoHoras: 2, anioApertura: 2021,
  /** coeficiente de dilatación del acrílico ≈ 70–80·10⁻⁶ /K (se usa 70) */
  alfaAcrilico: 70,
} as const;
/** presión hidrostática en el fondo (kPa) con el agua a `h` metros: ρ·g·h */
export const presionKPa = (h: number): number => (1000 * 9.81 * h) / 1000;
/** dilatación (mm) de `L` metros de acrílico con `dT` grados de cambio: α·L·ΔT */
export const dilatacionMm = (L: number, dT: number): number => PIS.alfaAcrilico * 1e-6 * L * dT * 1000;
/** segundo momento de área (m⁴) de una canaleta en U (ancho exterior B, alto exterior H, pared tw y fondo tb): sirve para el esquema cualitativo de la flecha (δ ∝ 1/I) */
export function inerciaU(tw: number, tb: number, B = 3.4, H = 3.4): number {
  const A1 = B * tb, y1 = tb / 2, A2 = 2 * tw * (H - tb), y2 = tb + (H - tb) / 2;
  const yc = (A1 * y1 + A2 * y2) / (A1 + A2);
  return (B * tb ** 3) / 12 + A1 * (y1 - yc) ** 2 + (2 * tw * (H - tb) ** 3) / 12 + A2 * (y2 - yc) ** 2;
}

/** Tiempos del video «Piscina suspendida» (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TPIS = {
  gancho: { torres: 0.2, hueco: 1.1, cota: 1.9, rect: 2.5, rectDur: 1.4, agua: 3.9, aguaDur: 1.1, chip: 4.4 },
  vidrio: { viga: 0.2, carga: 0.9, cargaDur: 1.7, rompe: 2.8, acril: 4.0, dens: 4.9, chip: 5.6 },
  acrilico: { corte: 0.2, knobs: 0.6, lat: 1.0, latDur: 1.7, fondo: 2.7, fondoDur: 1.7, flecha: 4.4, chip: 5.5 },
  union: { bloques: 0.2, junta: 1.0, inyecta: 1.7, borra: 2.7, rayos: 3.5, chip: 5.2 },
  tinas: { tinas: 0.2, viga: 1.0, tensores: 1.9, presion: 3.3, chip: 5.4 },
  viento: { torres: 0.2, rigido: 0.9, rafaga: 1.5, falla: 3.1, rayosx: 4.0, apoyos: 4.4, flota: 5.4, chip: 6.2 },
  carga: { tanque: 0.2, grifo: 0.8, sube: 1.0, subeDur: 3.2, chip: 4.6 },
  zoom: { ini: 0.2, dur: 5.0, nada: 5.5, pregunta: 6.0 },
} as const;

/** Datos del video «El aire que no avisa» (SINAPSIS · medicina de altura; noticia: Learjet 60 en Greenacres, Florida, 1 nov 2026). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-jet.md.
 *  La CAUSA del accidente sigue en investigación (NTSB): el video NO la afirma ni sugiere que la hipoxia la provocara; los gráficos fisiológicos son educativos. */
export const JET = {
  /** altitud de crucero típica de un jet de negocios (FL350 = 35.000 pies), cabina presurizada: límite regulatorio ≈ 8.000 pies (14 CFR 25.841), cima del Everest */
  fl350M: 10668, fl350Ft: 35000, cabinaM: 2438, cabinaFt: 8000, everestM: 8849,
  /** fracción de O₂ del aire seco y presión de vapor de agua en la vía aérea (mmHg) para la presión inspirada de O₂ */
  fO2: 0.2095, pH2O: 47,
  /** el cerebro: ≈ 2 % del peso del cuerpo y ≈ 20 % del oxígeno que consume en reposo (Raichle y Gusnard 2002) */
  cerebroPesoPct: 2, cerebroO2Pct: 20,
  /** tiempo de conciencia útil sin oxígeno suplementario (FAA, AIM 8-1-2): altitud en pies, texto, segundos mínimos y máximos */
  tuc: [
    { ft: 18000, txt: "20–30 min", min: 1200, max: 1800 },
    { ft: 25000, txt: "3–5 min", min: 180, max: 300 },
    { ft: 30000, txt: "1–2 min", min: 60, max: 120 },
    { ft: 35000, txt: "30–60 s", min: 30, max: 60 },
    { ft: 40000, txt: "15–20 s", min: 15, max: 20 },
  ],
} as const;
/** presión atmosférica estándar (kPa) a `h` metros (troposfera, ISA): 101,325·(1 − 2,25577·10⁻⁵·h)^5,25588 */
export const isaKPa = (h: number): number => 101.325 * Math.pow(1 - 2.25577e-5 * h, 5.25588);
/** temperatura estándar (°C) a `h` metros en la troposfera */
export const isaC = (h: number): number => 15 - 6.5 * (h / 1000);
/** presión inspirada de O₂ (mmHg) a `h` metros: fO₂·(P − 47 mmHg) */
export const pio2MmHg = (h: number): number => JET.fO2 * (isaKPa(h) * 7.50062 - JET.pH2O);

/** Tiempos del video «El aire que no avisa» (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TJET = {
  gancho: { jet: 0.2, chip: 0.4, alt: 0.8, altDur: 2.6, estela: 1.2, frase2: 2.7, fuente: 1.4 },
  ascenso: { sello: 0.4, sale: 3.1, asc: 3.3, ascDur: 4.4, cuarta: 7.8 },
  aire: { camaras: 0.3, mol: 0.5, o2: 1.9, sube: 2.6, subeDur: 1.6, pio: 3.5, pioDur: 1.5, barras: 5.4, barrasDur: 2.0, ever: 6.9 },
  cabina: { casco: 0.2, interior: 0.9, aire: 1.9, gauge: 3.4, fuga: 5.3, chip: 6.1 },
  cerebro: { cerebro: 0.2, flujo: 0.8, col2: 1.3, col20: 2.9, apaga: 4.5 },
  reloj: { cron: 0.2, aguja: 0.9, agujaDur: 3.0, tabla: 1.0, tablaPaso: 0.42, luz: 3.9, tunel: 4.6 },
  silencio: { panel: 0.2, tunel: 1.2, tunelDur: 4.8, chips: [2.0, 3.0, 3.95, 4.9, 5.8] },
  descenso: { techo: 0.2, mascara: 0.5, bolsa: 1.6, desc: 2.2, descDur: 3.4, abre: 2.6, frase: 5.7 },
} as const;

/** Datos del video «Un día sin dormir» (SINAPSIS · medicina cotidiana). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-sueno.md. */
export const SUE = {
  /** hora a la que te despiertas en el ejemplo (7:00) */
  despiertaH: 7,
  /** rendimiento equivalente a alcohol en sangre (%): ≈ 0,05 tras 17 h despierto (Dawson y Reid 1997; Williamson y Feyer 2000) y ≈ 0,10 hacia las 20–25 h según la tarea (Lamond y Dawson 1999); límite legal de EE. UU. = 0,08 */
  h17: 17, bac17: 0.05, h24: 24, bac24: 0.1, limiteUSA: 0.08,
  /** microsueño de 4 s a 100 km/h: 100/3,6 · 4 = 111 m */
  microSeg: 4, kmh: 100,
  /** internos con turnos de más de 24 h: +35,9 % de errores graves en UCI (Landrigan 2004, NEJM) y odds de choque ×2,3 al volver a casa (Barger 2005, NEJM) */
  erroresMas: 35.9, choqueOR: 2.3,
  /** adultos: 7 horas o más de sueño (consenso AASM/SRS 2015) */
  sueñoMinH: 7,
} as const;
/** rendimiento equivalente a alcohol (% en sangre) tras `h` horas despierto: esquema lineal entre los puntos de la literatura (0 h → 0; 17 h → 0,05; 24 h → 0,10) y sigue la misma pendiente después, con tope 0,12 */
export const bacPorHoras = (h: number): number => {
  if (h <= 0) return 0;
  if (h <= SUE.h17) return (SUE.bac17 * h) / SUE.h17;
  const pend = (SUE.bac24 - SUE.bac17) / (SUE.h24 - SUE.h17);
  return Math.min(0.12, SUE.bac17 + pend * (h - SUE.h17));
};
/** metros recorridos por un vehículo a `kmh` durante `seg` segundos */
export const metrosEn = (kmh: number, seg: number): number => (kmh / 3.6) * seg;

/** Tiempos del video «Un día sin dormir» (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TSUE = {
  gancho: { reloj: 0.2, alcohol: 0.5, sube: 0.9, subeDur: 3.4, lectura: 4.5 },
  horas: { reloj: 0.2, sube: 0.8, subeDur: 3.6, marca: 4.6, nota: 5.6 },
  limite: { dial: 0.2, sube: 0.6, subeDur: 2.0, cruza: 1.9, alerta: 2.5, nota: 4.4 },
  adenosina: { cerebro: 0.2, moleculas: 0.8, sube: 1.0, subeDur: 3.6, chip: 4.8 },
  cafe: { receptor: 0.2, adeno: 0.6, une: 1.5, cafe: 2.3, bloquea: 3.3, sigue: 4.4 },
  micro: { carretera: 0.2, cabecea: 1.5, cierra: 2.1, cierraDur: 0.5, ciego: 2.6, ciegoDur: 2.8, abre: 5.4, chip: 5.8 },
  hospital: { pasillo: 0.0, panel1: 0.6, barraA: 1.0, barraB: 2.0, mas36: 3.8, panel2: 5.0, choque: 6.0, x23: 6.4 },
  dormir: { luna: 0.2, eeg: 0.6, sube: 1.0, subeDur: 4.2, siete: 5.2, frase: 6.0 },
} as const;

/** Datos del video «¿Real o mito?» (SINAPSIS · curiosidades médicas con humor). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-real-o-mito.md. */
export const CUR = {
  /** Charles Osborne: hipo de 1922 a 1990 (Guinness: el ataque más largo confirmado); ≈ 430 millones de hipos = estimado de una sola fuente */
  hipo: { desde: 1922, hasta: 1990, anios: 68, hipos: 430_000_000 },
  /** cosquillas: Blakemore, Wolpert y Frith 1998 (Nature Neuroscience): el cerebelo predice el toque propio y lo cancela */
  /** chicle: el mito de los 7 años; sale con el tránsito normal (días) */
  chicle: { mitoAnios: 7 },
  /** Waber, Shiv, Carmon y Ariely 2008 (JAMA, carta de investigación, 82 voluntarios, descargas en la muñeca): placebo de US$ 2,50 → 85,4 % de alivio; de US$ 0,10 → 61,0 % */
  pastilla: { caro: 2.5, barato: 0.1, aliviaCaro: 85.4, aliviaBarato: 61.0, n: 82 },
  /** Roger Frisch (Minnesota Orchestra) tocó el violín durante la implantación de electrodos (estimulación cerebral profunda por temblor esencial, Mayo Clinic, cirugía de 2010) */
  violin: { anio: 2010 },
  /** síndrome del acento extranjero: Monrad-Krohn 1947 (Astrid L., noruega que sonaba alemana tras una lesión); descrito ya en 1907 (Pierre Marie); ≈ 100–200 casos documentados */
  acento: { anio: 1947 },
  /** resultado final: 5 reales y 1 mito (el 3.º es el mito) */
  veredictos: ["real", "real", "mito", "real", "real", "real"] as ("real" | "mito")[],
} as const;

/** Tiempos del video «¿Real o mito?» (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TCUR = {
  gancho: { titulo: 0.2, mascota: 0.3, cartas: 2.6, cartaPaso: 0.32, pregunta: 4.4 },
  hipo: { cerdo: 0.5, hombre: 0.9, anios: 1.5, aniosDur: 2.8, hic: [1.7, 2.6, 3.5, 4.4, 5.3], sello: 5.7 },
  cosquillas: { cara: 0.2, otro: 0.9, serio: 3.0, cerebelo: 3.8, sello: 5.6 },
  chicle: { boca: 0.2, siete: 1.0, tacha: 2.6, sello: 3.7, viaje: 4.1, viajeDur: 1.9, dias: 4.6 },
  pastilla: { barata: 0.5, cara: 1.4, barras: 3.3, barrasDur: 2.2, mas: 5.5, sello: 6.6 },
  violin: { cabeza: 0.3, violin: 0.9, electrodo: 2.2, dolor: 4.8, sello: 6.2 },
  acento: { persona: 0.3, antes: 1.0, golpe: 2.3, despues: 2.9, banderas: 4.1, sello: 5.6 },
  marcador: { luces: 0.5, luzPaso: 0.38, copa: 3.0, comentar: 3.6 },
} as const;

/** Datos del video sobre el paro cardíaco de un futbolista (SINAPSIS · medicina y actualidad; 3 nov 2026). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-futbolista.md.
 *  La causa médica exacta NO se ha informado y hay una investigación policial: el video no la afirma, no culpa a nadie y explica fisiología y primeros auxilios en general. */
export const FUT = {
  /** ventana vulnerable de la commotio cordis (Link y cols., NEJM 1998, modelo en cerdos): impactos 15–30 ms antes del pico de la onda T producen fibrilación ventricular */
  ventanaMsMin: 15, ventanaMsMax: 30,
  /** registro de EE. UU. de commotio cordis (Heart Rhythm 2013): 31 de 53 sobrevivieron en los 6 años más recientes */
  regSobrevivieron: 31, regTotal: 53,
  /** sin RCP ni desfibrilación la supervivencia cae ≈ 7–10 % por minuto (marco de la cadena de supervivencia de la AHA) */
  caidaPorMinMin: 7, caidaPorMinMax: 10,
  /** RCP de adultos (AHA): 100–120 compresiones por minuto, 5–6 cm de profundidad */
  rcpRitmoMin: 100, rcpRitmoMax: 120, rcpProfCmMin: 5, rcpProfCmMax: 6,
  /** el jugador: Jesús de Miguel, delantero del CD Tenerife, 30 años; el club comunicó su fallecimiento el martes 3 nov 2026 a las 8:00 */
  edad: 30,
} as const;
/** supervivencia ilustrativa (%) tras `min` minutos sin RCP ni desfibrilación: −10 % por minuto (orden de magnitud de la AHA, 7–10 %), desde 100 % */
export const supervivenciaSinDescarga = (min: number): number => Math.max(0, 100 - 10 * min);
const gauss = (x: number, mu: number, sg: number): number => Math.exp(-0.5 * Math.pow((x - mu) / sg, 2));
/** onda de un electrocardiograma normal en la fase `f` (0–1 por latido): P, complejo QRS y onda T (pico de la T en 0,60) */
export const ecgOnda = (f: number): number => {
  const u = ((f % 1) + 1) % 1;
  return 0.12 * gauss(u, 0.12, 0.025) - 0.1 * gauss(u, 0.295, 0.008) + 1.0 * gauss(u, 0.32, 0.009) - 0.22 * gauss(u, 0.345, 0.01) + 0.3 * gauss(u, 0.6, 0.045);
};
/** fibrilación ventricular: oscilación caótica de 4–8 Hz con amplitud irregular, en el instante `t` s */
export const ecgFibrilacion = (t: number): number => 0.55 * Math.sin(t * 38 + 1.3 * Math.sin(t * 7.1)) * (0.6 + 0.4 * Math.sin(t * 3.3 + 0.7)) + 0.35 * Math.sin(t * 25.7 + 2) * (0.5 + 0.5 * Math.sin(t * 5.1)) + 0.15 * Math.sin(t * 61 + t * t);

/** Tiempos del video del futbolista (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TFUT = {
  gancho: { chip: 0.3, nombre: 0.6, ecg: 0.8, frase2: 3.8, frase3: 5.9, apaga: 6.0 },
  causa: { sello: 0.4, sale: 3.0, term: 3.1, gloss: 4.4, fuente: 4.8 },
  ventana: { ecg: 0.3, banda: 1.0, periodo: 0.8, golpe1: 2.48, golpe2: 4.448, nota: 6.4 },
  fibrilacion: { corazon: 0.2, golpe: 1.4, rotulo: 2.6, sangre: 4.0 },
  cerebro: { cerebro: 0.2, reloj: 0.8, relojDur: 4.2, marca10s: 1.4, marca4min: 3.0, cae: 5.0 },
  descarga: { dea: 0.4, parches: 1.6, analiza: 2.6, carga: 3.6, cargaDur: 1.0, shock: 4.6, normal: 4.9, cifra: 5.8, nota: 7.2 },
  rcp: { paso1: 2.6, paso2: 4.2, paso3: 6.6, ritmo: 110 },
  cierre: { vela: 0.2, frase1: 0.3, frase2: 3.6, chip: 5.0 },
} as const;

/** Datos del video «El viaje de una gota de sangre» (SINAPSIS · anatomía humana). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-sangre.md. */
export const SAN = {
  /** latido en reposo: período del dibujo (0,8 s = 75 lpm) y frecuencia de referencia para los litros por día (72 lpm) */
  periodo: 0.8, lpm: 72,
  /** volumen sistólico ≈ 70 mL y gasto cardíaco en reposo ≈ 5 L/min (fuentes de fisiología); volumen de sangre ≈ 5 L */
  mlLatido: 70, gastoLMin: 5, volumenSangreL: 5,
  /** diámetros: aorta ascendente ≈ 3 cm (2,9–3,3), capilar ≈ 8 µm (5–10), glóbulo rojo ≈ 7,5–8,5 µm, cabello ≈ 70 µm */
  aortaCm: 3, capilarUm: 8, globuloUm: 8, cabelloUm: 70,
  /** hemoglobina ≈ 270 millones de moléculas por glóbulo rojo; cada una puede unir 4 O2 */
  hbMillones: 270, o2PorHb: 4,
  /** tránsito del glóbulo por el capilar pulmonar en reposo ≈ 0,75 s (el O2 se equilibra en ≈ 0,25 s) */
  transitoPulmonS: 0.75,
  /** vida del glóbulo rojo ≈ 120 días; la médula produce ≈ 2–3 millones por segundo (estimado) */
  vidaDias: 120, medulaMillonesPorS: [2, 3] as const,
  /** una vuelta completa ≈ volumen de sangre ÷ gasto cardíaco = 1 min (cálculo propio) */
  vueltaS: 60,
} as const;
/** litros que bombea el corazón en un día: mL por latido × latidos por minuto × 1.440 min ÷ 1.000 */
export const litrosPorDia = (mlLatido: number, lpm: number): number => (mlLatido * lpm * 1440) / 1000;
/** vueltas de un glóbulo en su vida: días × 1.440 min ÷ (minutos por vuelta) */
export const vueltasEnVida = (dias: number, vueltaS: number): number => Math.round((dias * 1440 * 60) / vueltaS);
/** latidos en una vida de `anios` años a `lpm` latidos por minuto */
export const latidosEnVida = (anios: number, lpm: number): number => anios * 365 * 1440 * lpm;
/** fase del latido (0–1) en el instante t */
export const fasePulso = (t: number, periodo: number = SAN.periodo): number => (((t / periodo) % 1) + 1) % 1;
/** sístole (0–1): sube y baja durante el primer 38 % del latido */
export const sistole = (t: number, periodo: number = SAN.periodo): number => { const f = fasePulso(t, periodo); return f < 0.38 ? Math.pow(Math.sin((Math.PI * f) / 0.38), 1.5) : 0; };
/** avance acumulado del flujo: cada latido aporta una unidad en forma de empuje (flujo pulsátil) más un avance lento continuo */
export const avancePulsatil = (t: number, periodo: number = SAN.periodo): number => {
  const n = Math.floor(t / periodo), f = fasePulso(t, periodo), k = Math.min(1, f / 0.38);
  return n + k * k * (3 - 2 * k) + 0.15 * t;
};

/** Tiempos del video «El viaje de una gota de sangre» (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TSAN = {
  gancho: { gota: 0.3, anillo: 1.0, anilloDur: 5.0, frase2: 3.2, cae: 6.3 },
  corazon: { camara: 0.2, ml: 2.2, minuto: 3.7, dia: 5.4 },
  aorta: { tubo: 0.0, ancho: 2.7, ramas: 5.3 },
  ramas: { arbol: 0.3, genDur: 0.9, escala: 4.2, cabello: 6.0 },
  capilar: { tubo: 0.2, entra: 1.2, o2: 2.7, hb: 4.5, lento: 6.2 },
  venas: { vena: 0.3, valvulas: 1.7, musculo: 4.0, sube: 5.4 },
  pulmon: { alveolo: 0.3, pasa: 1.6, pasaDur: 2.4, co2: 3.0, bola: 5.6 },
  vida: { anillo: 0.4, vueltas: 1.4, vueltasDur: 4.0, medula: 5.6, fin: 7.4 },
} as const;

/** Datos del video «La noche que Röntgen vio a través de la piel» (SINAPSIS · historia de la medicina). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-rayos-x.md. */
export const RXH = {
  /** descubrimiento: Würzburg, 8 nov 1895; primera radiografía de la mano de Anna Bertha: 22 dic 1895 (exposición ≈ 15 min); artículo: 28 dic 1895 */
  descubrimiento: { a: 1895, m: 11, d: 8 }, mano: { a: 1895, m: 12, d: 22 }, articulo: { a: 1895, m: 12, d: 28 }, expoManoMin: 15,
  /** primer uso clínico documentado: John Hall-Edwards, 11 ene 1896 (una aguja clavada en una mano) */
  aguja: { a: 1896, m: 1, d: 11 },
  /** primer Premio Nobel de Física: 1901; rechazó patentar el descubrimiento */
  nobelAnio: 1901,
  /** Día Internacional de la Radiología: 8 de noviembre (primera edición en 2012) */
  diaRadiologia: { m: 11, d: 8 },
  /** año del «hoy» del video */
  hoyAnio: 2026,
} as const;
/** años cumplidos entre dos años */
export const aniversarioAnios = (anioHoy: number, anioBase: number): number => anioHoy - anioBase;
/** días entre dos fechas (UTC, sin horario de verano) */
export const diasEntreFechas = (a: { a: number; m: number; d: number }, b: { a: number; m: number; d: number }): number => Math.round((Date.UTC(b.a, b.m - 1, b.d) - Date.UTC(a.a, a.m - 1, a.d)) / 86400000);
/** día de la semana en español de una fecha */
export const diaSemana = (a: number, m: number, d: number): string => ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
/** Tiempos del video de los rayos X (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TRX = {
  gancho: { titulo: 0.2, anios: 1.4, aniosDur: 1.8, pantalla: 3.0, huesos: 5.0 },
  tubo: { chip: 0.2, bobina: 0.6, carton: 1.2, luz: 3.6, brilla: 5.7 },
  huesos: { rayos: 1.0, mano: 2.6, manoDur: 1.0, cuenta: 4.0, huesos: 5.0 },
  x: { pregunta: 0.2, x: 1.8, incognita: 3.6 },
  anna: { semanas: 0.2, fecha: 1.2, placa: 2.6, anillo: 5.0, tiempo: 6.0, cita: 6.4 },
  mundo: { papel: 0.2, fecha: 1.2, enero: 2.6, aguja: 4.7 },
  nobel: { patente: 0.2, sello: 0.8, medalla: 1.2, primer: 2.6, dinero: 4.0 },
  cierre: { riesgo: 0.2, quema: 2.2, hoy: 3.3, dia: 4.4 },
} as const;

/** Datos del video «La cena en que tres médicos se durmieron» (SINAPSIS · historia de la anestesia). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-anestesia.md. */
export const ANE = {
  /** cena de Simpson con Keith y Duncan en Edimburgo: 4 nov 1847; «Día del éter» en Boston: 16 oct 1846; parto de la reina Victoria (Leopoldo) con John Snow: 7 abr 1853 */
  cena: { a: 1847, m: 11, d: 4 }, eter: { a: 1846, m: 10, d: 16 }, reina: { a: 1853, m: 4, d: 7 },
  /** amputación de Liston: ≈ 30 s según se cuenta (las fuentes dan 25, 28 o 30) */
  listonSeg: 30,
  hoyAnio: 2026,
} as const;
/** Tiempos del video de la anestesia (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TAN = {
  gancho: { fecha: 0.2, anios: 1.6, aniosDur: 1.6, cae: 3.8, cena: 5.0, proposito: 6.1 },
  carrera: { titulo: 0.2, carrera: 1.6, liston: 3.0, cuenta: 4.3, pierna: 5.4, treinta: 6.4 },
  eter: { fecha: 0.2, funciona: 3.0, boston: 4.0, irrita: 5.7, olor: 6.4 },
  busca: { edimburgo: 0.2, simpson: 0.9, mejor: 2.3, prueba: 3.3, ayudantes: 4.3, cloro: 5.0 },
  noche: { inhalan: 0.9, charla: 2.6, caen: 4.3, silencio: 5.2 },
  despierta: { ojos: 0.2, idea: 0.9, busca: 2.3, dias: 3.3, partos: 4.3 },
  reina: { critica: 0.2, fecha: 1.9, reina: 4.3, parto: 6.4 },
  cierre: { ya: 0.9, camino: 2.3, moderna: 4.7 },
} as const;

/** Datos del video «Los cuadernos radiactivos de Marie Curie» (SINAPSIS · historia de la medicina). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-curie.md. */
export const MCU = {
  /** nacimiento: Varsovia, 7 nov 1867; a París en 1891; polonio (jul 1898) y radio (dic 1898); Nobel de Física 1903 y de Química 1911; guerra 1914–1918; muerte: jul 1934 (probablemente por la radiación) */
  nace: { a: 1867, m: 11, d: 7 }, paris: 1891, elementos: 1898, nobelFisica: 1903, nobelQuimica: 1911, guerra: 1914, muerte: 1934,
  /** números atómicos: polonio 84, radio 88; en 1902 aisló ≈ 0,1 g de cloruro de radio (de toneladas de residuo de pecblenda, según las fuentes) */
  zPolonio: 84, zRadio: 88, radioGramos: 0.1,
  /** «pequeñas Curies»: ≈ 20 vehículos y ≈ 200 instalaciones fijas; heridos examinados: ≈ 900.000 según la propia Curie y «más de un millón» según otras estimaciones */
  vehiculos: 20, instalaciones: 200, heridosCurie: 900000,
  /** radio-226: semivida ≈ 1.600 años; los cuadernos tardarán ≈ 1.500 años en perder la MITAD de su radiactividad (no en dejar de serlo) */
  semividaAnios: 1500,
  hoyAnio: 2026,
} as const;
/** fracción de radiactividad que queda tras `anios` años con semivida `semivida` (decaimiento exponencial) */
export const fraccionRestante = (anios: number, semivida: number): number => Math.pow(0.5, anios / semivida);
/** Tiempos del video de Marie Curie (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TMC = {
  gancho: { geiger: 0.2, caja: 0.9, fecha: 3.0, anios: 4.3, aniosDur: 1.6 },
  paris: { varsovia: 0.2, puerta: 1.2, viaje: 4.3, viajeDur: 1.4, paris: 5.7 },
  elementos: { anio: 0.2, pierre: 2.3, polonio: 3.0, pais: 4.0, radio: 5.7 },
  toneladas: { gramo: 0.2, mineral: 3.0, anios: 4.3 },
  nobel: { medalla1: 1.0, medalla2: 2.0, mujer: 3.0, unica: 5.0 },
  guerra: { fecha: 0.2, furgon: 1.9, rayos: 3.6, apodo: 5.7, cifras: 6.3 },
  riesgo: { tubo: 0.2, sin: 1.0, muerte: 3.0, prob: 5.4 },
  cuadernos: { caja: 0.2, vida: 2.3, mitad: 4.3, permiso: 5.6 },
} as const;

/** Datos del video «La inyección que cambió todo» (SINAPSIS · historia de la insulina). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-insulina.md. */
export const INS = {
  /** Frederick Banting nació el 14 nov 1891 (Día Mundial de la Diabetes, IDF y OMS 1991; ONU 2006); trabajo con Best en Toronto 1921; primera inyección a Leonard Thompson 11 ene 1922 (extracto impuro: apenas funcionó y dio reacción alérgica); segunda, con el extracto purificado por Collip, 23 ene 1922; Nobel 1923 (Banting y Macleod); patente cedida a la Universidad de Toronto por 1 dólar */
  banting: { a: 1891, m: 11, d: 14 }, perros: 1921, primera: { a: 1922, m: 1, d: 11 }, segunda: { a: 1922, m: 1, d: 23 }, nobel: 1923,
  /** Leonard Thompson pesaba ≈ 65 libras ≈ 29 kg (la edad varía por fuente: 13 o 14 años) */
  libras: 65, patenteUsd: 1, hoyAnio: 2026,
} as const;
/** libras → kilogramos (1 lb = 0,45359237 kg) */
export const librasAKg = (lb: number): number => lb * 0.45359237;
/** Tiempos del video de la insulina (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TIN = {
  gancho: { calendario: 0.2, banting: 0.9, aniosDur: 1.6, sabado: 2.6, dia: 3.3, dolar: 6.0 },
  hambre: { sala: 0.2, mortal: 1.6, dieta: 3.6 },
  perros: { toronto: 0.2, doctores: 2.3, extracto: 4.3, baja: 5.3 },
  primera: { fecha: 0.2, nino: 3.0, inyeccion: 4.7, fallo: 6.1 },
  segunda: { collip: 0.2, filtro: 0.6, fecha: 1.9, inyeccion: 3.3, reloj: 4.7, mejora: 5.7 },
  nobel: { medalla: 0.2, nombres: 1.6, comparten: 3.3 },
  patente: { doc: 0.2, dolar: 3.0, fabrica: 4.3 },
  hoy: { mundo: 0.2, dia: 3.0, circulo: 4.2 },
} as const;

/** Datos del video «La médula espinal: el atajo del cuerpo» (SINAPSIS · neuroanatomía). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-medula.md. */
export const MDE = {
  /** longitud de la médula del adulto ≈ 42–45 cm (anatomía clásica); termina en L1–L2 en la mayoría (rango T12–L3); la punción lumbar se hace por debajo (L3–L4 o L4–L5) */
  longitudCm: 45, conoNivel: "L1–L2", puncionNivel: "L3–L4",
  /** vértebras móviles: 7 cervicales, 12 torácicas, 5 lumbares; pares de nervios espinales: 8 cervicales, 12 torácicos, 5 lumbares, 5 sacros, 1 coccígeo */
  vertebras: { c: 7, t: 12, l: 5 }, pares: { c: 8, t: 12, l: 5, s: 5, co: 1 },
  /** el reflejo rotuliano es monosináptico y pasa por los segmentos L2–L4 de la médula, sin pasar por el cerebro */
  reflejoRotuliano: "L2–L4",
  /** velocidad máxima de conducción de los axones mielinizados más rápidos ≈ 120 m/s (≈ 430 km/h) */
  velocidadMaxMs: 120,
  /** interfaz cerebro–médula (Lorach et al., Nature, 24 mayo 2023): un participante con lesión crónica por un accidente en 2011; camina con muletas */
  bsi: { anio: 2023, lesion: 2011, participantes: 1 },
} as const;
/** total de pares de nervios espinales */
export const totalPares = (p: { c: number; t: number; l: number; s: number; co: number }): number => p.c + p.t + p.l + p.s + p.co;
/** m/s → km/h */
export const msAKmh = (ms: number): number => ms * 3.6;
/** Tiempos del video de la médula (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TME = {
  gancho: { golpe: 1.9, arco: 0.7, cerebro: 2.5, medula: 4.7 },
  columna: { medula: 0.2, regla: 0.6, columna: 2.6, nervios: 4.3, conteo: 5.0 },
  cola: { arriba: 0.2, lumbar: 1.6, nervios: 4.7, caballo: 6.1, puncion: 6.6 },
  mariposa: { forma: 0.2, gris: 2.3, procesa: 3.3, blanca: 5.0, autopistas: 6.4 },
  velocidad: { axon: 0.2, mielina: 1.2, cifra: 3.0, cifraDur: 1.4, kmh: 5.0 },
  reflejo: { toca: 2.4, aparta: 2.6, cerebro: 4.0, dolor: 5.6 },
  lesion: { rotura: 0.2, desconecta: 1.9, sube: 4.7, funciones: 5.7 },
  puente: { anio: 0.2, hombre: 1.6, camina: 3.6, puente: 5.4, entre: 7.1 },
} as const;

/** Datos del video «El par craneal 0» (SINAPSIS · neuroanatomía). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-par-craneal-0.md. */
export const PC0 = {
  /** Gustav Fritsch lo describió en 1878 en elasmobranquios (tiburones y rayas): lo llamó «nervio supernumerario» */
  fritsch: 1878,
  /** el nombre «par craneal cero» se propuso a finales de los años 80 (por delante del I, el olfatorio) */
  nombreCero: "finales de los años 80",
  /** la Terminologia Anatomica de 1998 lo incluye como nervio terminal */
  terminologia: 1998,
  /** pares craneales que enseña la mayoría de los textos */
  paresClasicos: 12,
  /** es un plexo de fibras sin mielina que cruza la lámina cribosa; las neuronas GnRH migran por su ruta en el embrión; su relación con el síndrome de Kallmann es clínica; su función en adultos no está demostrada */
  amielinico: true, funcionDemostrada: false,
} as const;
/** total de pares craneales contando el cero */
export const totalCraneales = (clasicos: number): number => clasicos + 1;
/** Tiempos del video del par craneal 0 (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TPC = {
  gancho: { doce: 0.4, uno: 2.8, antes: 3.9, cero: 5.6 },
  fritsch: { anio: 0.2, nombre: 2.3, personas: 4.9, tiburon: 5.7 },
  recorrido: { red: 0.2, mielina: 2.4, olfatorio: 3.3, placa: 5.0, cerebro: 6.5 },
  numero: { bautizo: 0.6, ochenta: 2.0, delante: 3.9, olfatorio: 5.6 },
  gnrh: { embrion: 0.2, gnrh: 1.3, hormona: 2.4, viaja: 4.6, nervio: 6.2 },
  kallmann: { falla: 0.2, sindrome: 1.8, olfato: 3.8, pubertad: 4.9 },
  misterio: { adultos: 0.2, nose: 1.4, repro: 3.0, feromonas: 5.2, nada: 6.7 },
  libro: { nomenclatura: 0.2, anio: 2.3, libros: 5.2 },
} as const;

/** Datos del video «El par craneal I: el nervio que renace» (SINAPSIS · pares craneales). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-par-craneal-1.md. */
export const OL = {
  /** receptores olfativos funcionales en humanos ≈ 350–400 (la familia génica ronda 1000; Axel y Buck, Nobel 2004) */
  receptoresFuncionales: 400,
  /** en ratones, la mayoría de las neuronas olfatorias vive 1–3 meses (no hay cifra humana validada) */
  ratonMeses: { min: 1, max: 3 },
  /** entrenamiento olfativo clásico (Hummel y cols., 2009): 4 aromas (rosa, limón, clavo, eucalipto), 2 veces al día, 12 semanas; estudios pequeños */
  entrenamiento: { aromas: 4, vecesDia: 2, semanas: 12 },
  /** cada neurona olfatoria expresa un solo receptor; cada olor activa varios receptores a la vez (código combinatorio) */
  receptoresPorNeurona: 1,
  /** la mayoría de las neuronas olfatorias no se reemplazan en el cerebro; las del epitelio olfatorio se renuevan durante toda la vida (disminuye con la edad) */
  funcionDemostradaCovid: false,
} as const;
/** Tiempos del video del par craneal I (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TOL = {
  gancho: { mayoria: 0.3, pero: 3.3, par: 4.6, renuevan: 6.0 },
  mucosa: { techo: 0.2, aire: 2.4, dano: 4.8 },
  ciclo: { ratones: 0.2, meses: 1.1, madre: 4.0, nuevas: 5.7 },
  receptor: { uno: 0.2, cuatro: 3.0, olor: 5.8 },
  axones: { cruzan: 0.2, nuevas: 3.0, bulbo: 5.4 },
  memoria: { bulbo: 0.2, amigdala: 1.6, hipocampo: 3.3, recuerdo: 5.4 },
  dano: { golpe: 0.2, covid: 3.6, soporte: 5.4, noneuronas: 6.6 },
  recupera: { recuperan: 0.2, entrena: 3.9, cuatro: 5.0, estudios: 6.3 },
} as const;

/** Datos del video «El nervio óptico: la parte del cerebro que sale a mirar» (SINAPSIS · pares craneales). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-par-craneal-2.md. */
export const OP = {
  /** cada nervio óptico lleva entre ≈ 770 000 y 1 700 000 axones de células ganglionares de la retina («cerca de un millón») */
  fibras: { min: 770_000, tipico: 1_000_000, max: 1_700_000 },
  /** el campo visual izquierdo de AMBOS ojos se procesa en el hemisferio derecho (las fibras de la retina nasal se cruzan en el quiasma) */
  campoIzquierdoVa: "derecho",
  /** Lu y cols., Nature, dic. 2020: OSK (OCT4, SOX2, KLF4) por AAV en ratones; regeneración axonal tras lesión y mejora de la visión en glaucoma murino y ratones viejos */
  reprogramacion: { anio: 2020, genes: 3, ratones: true },
  /** ensayo de fase 1 de ER-100 (Life Biosciences, NCT07290244): inyección intravítrea única + doxiciclina 8 semanas; primer paciente junio de 2026; primeros datos intermedios el 8 de octubre de 2026 en 3 personas con glaucoma de ángulo abierto, bien tolerado hasta el día 56 */
  ensayo: { fase: 1, participantes: 3, diasSeguimiento: 56, objetivoPrincipal: "seguridad", eficaciaDemostrada: false },
} as const;
/** Tiempos del video del par craneal II (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TOP = {
  gancho: { par: 0.2, optico: 1.7, comun: 3.1, extension: 4.6 },
  origen: { diencefalo: 0.2, meninges: 2.2, millon: 4.2 },
  ciego: { sale: 0.2, sinFoto: 2.3, punto: 4.2, rellena: 6.0 },
  quiasma: { quiasma: 0.2, cruzan: 2.0, izquierda: 4.0, derecho: 5.6 },
  regenera: { parte: 0.2, noRegenera: 2.1, olfatorio: 3.5, glaucoma: 5.2 },
  genes: { anio: 0.2, ratones: 1.7, tres: 3.3, rejuvenece: 4.4, mejora: 6.3 },
  ensayo: { hoy: 0.2, personas: 2.6, octubre: 5.2, tolerada: 6.5 },
  temprano: { temprano: 0.2, seguridad: 1.8, tres: 3.4, noDemuestra: 4.9 },
} as const;

/** Datos del video «El par craneal III: la pupila que avisa» (SINAPSIS · pares craneales). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-par-craneal-3.md. */
export const OC = {
  /** el oculomotor inerva 4 de los 6 músculos extrínsecos del ojo (recto superior, inferior y medial; oblicuo inferior) y el elevador del párpado; los otros dos: oblicuo superior (IV) y recto lateral (VI) */
  musculos: { inervados: 4, totales: 6 },
  /** nace en el mesencéfalo, sale en la fosa interpeduncular entre las arterias cerebral posterior y cerebelosa superior, cruza el seno cavernoso y entra por la fisura orbitaria superior */
  nace: "mesencéfalo",
  /** las fibras parasimpáticas (pupila y acomodación) van por la superficie del nervio y suelen ser las primeras en sufrir por compresión (herniación del uncus, aneurisma de la comunicante posterior); en la parálisis isquémica (diabetes, hipertensión) suele respetarse la pupila; la explicación es la clásica y hay matices (a veces hay miosis inicial; algunos aneurismas respetan la pupila) */
  pupilaPrimero: "suele",
  /** la luz en un ojo cierra las dos pupilas: aferencia por el nervio óptico (II), eferencia por el oculomotor (III) vía Edinger-Westphal */
  reflejo: { aferente: "II", eferente: "III" },
  /** parálisis completa: ptosis, ojo «hacia abajo y afuera» y pupila dilatada */
  paralisis: ["ptosis", "abajo y afuera", "midriasis"],
} as const;
/** Tiempos del video del par craneal III (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TOC = {
  gancho: { pupila: 0.2, golpe: 1.8, emergencia: 3.6, par: 5.2 },
  musculos: { mueve: 0.2, cuatro: 1.7, giran: 3.6, parpado: 5.0 },
  reflejo: { luz: 0.2, optico: 2.4, oculo: 4.0, dos: 5.5 },
  recorrido: { nace: 0.2, arterias: 2.2, seno: 4.6, orbita: 6.0 },
  fibras: { superficie: 0.2, primeras: 4.0, comprime: 5.9 },
  herniacion: { presion: 0.2, lobulo: 2.4, aplasta: 4.4, dilata: 5.6 },
  aneurisma: { aneurisma: 0.2, parpado: 3.0, ojo: 4.4, pupila: 6.8 },
  urgencia: { parpado: 0.2, doble: 2.4, dolor: 3.7, urgente: 5.1 },
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
  /* ───────────── «El truco de los préstamos DSCR» (IMNOBA) ───────────── */
  "dscr-gancho": {
    id: "dscr-gancho", nombre: "DSCR · el mito de los 500.000 dólares en efectivo (gancho)", ideal: 3.95, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ev(TDS.gancho.casa * r + 0.2, "pop", 0.1), ...clics(TDS.gancho.cifra * r, TDS.gancho.cifraDur * r, 0.05), ev(TDS.gancho.mito * r, "golpe", 0.2)],
  },
  "dscr-hack": {
    id: "dscr-hack", nombre: "DSCR · el alquiler paga la cuota: la propiedad se paga sola", ideal: 4.55, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TDS.hack.casa * r + 0.2, "pop", 0.1), ...[0, 1, 2, 3].map((i) => ev((TDS.hack.flujo + i * 0.5) * r, "cash", 0.08)), ev(TDS.hack.cuota * r, "ding", 0.18)],
  },
  "dscr-docs": {
    id: "dscr-docs", nombre: "DSCR · sin recibo de sueldo, historial ni visa: solo importa el alquiler", ideal: 4.95, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...[0, 1, 2].map((i) => ev((TDS.docs.c(i) + TDS.docs.tacha) * r, "thud", 0.14)), ev(TDS.docs.balanza * r, "ding", 0.18)],
  },
  "dscr-split": {
    id: "dscr-split", nombre: "DSCR · el banco financia hasta 70 % y tú pones ≈ 30 %", ideal: 4.95, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TDS.split.banco * r, "zap", 0.12), ev(TDS.split.tu * r, "pop", 0.14), ev((TDS.split.tu + 0.2) * r, "ding", 0.16), ...[0, 1, 2].map((i) => ev((TDS.split.notas + i * 0.3) * r, "tick", 0.08))],
  },
  "dscr-catalogo": {
    id: "dscr-catalogo", nombre: "DSCR · el catálogo de imnoba.com/usa (proyectos y propiedades)", ideal: 3.75, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TDS.catalogo.tel * r + 0.2, "pop", 0.1), ...[0, 1, 2].map((i) => ev((TDS.catalogo.tarjetas + i * 0.3) * r, "tick", 0.08)), ev(TDS.catalogo.url * r, "ding", 0.16)],
  },
  /* ───────────── «Los 4 tejidos» (SINAPSIS) ───────────── */
  "tej-gancho": {
    id: "tej-gancho", nombre: "4 tejidos · las cuatro piezas del cuerpo, una es líquida (gancho)", ideal: 3.75, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ...[0, 1, 2, 3].map((i) => ev(TTJ.gancho.tile(i) * r + 0.1, "pop", 0.1)), ev(TTJ.gancho.liquido * r, "ding", 0.16)],
  },
  "tej-epitelial": {
    id: "tej-epitelial", nombre: "4 tejidos · epitelial: el ácido ataca y el revestimiento se renueva", ideal: 5.25, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TTJ.epitelial.acido * r, "pop", 0.1), ...[0, 1, 2, 3].map((i) => ev(TTJ.epitelial.dia(i) * r, "tick", 0.12)), ev(TTJ.epitelial.cifra * r, "ding", 0.16)],
  },
  "tej-sangre": {
    id: "tej-sangre", nombre: "4 tejidos · conectivo: la sangre, tejido líquido que pasa de 2 km/h", ideal: 4.95, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TTJ.sangre.tubo * r, "pop", 0.1), ...[0, 1, 2].map((i) => ev((TTJ.sangre.aguja + i * 0.9) * r, "heartbeat", 0.14)), ev(TTJ.sangre.marca * r, "ding", 0.16)],
  },
  "tej-hueso": {
    id: "tej-hueso", nombre: "4 tejidos · conectivo: el hueso se renueva casi por completo en ≈ 10 años", ideal: 4.55, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TTJ.hueso.hueso * r, "pop", 0.1), ...clics(TTJ.hueso.barrido * r, TTJ.hueso.barridoDur * r, 0.05), ev((TTJ.hueso.barrido + TTJ.hueso.barridoDur) * r, "ding", 0.18)],
  },
  "tej-muscular": {
    id: "tej-muscular", nombre: "4 tejidos · muscular: el corazón sigue latiendo solo, con su marcapasos", ideal: 4.95, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...[0, 1].map((i) => ev((TTJ.muscular.corazon + 0.5 + i * 0.8) * r, "heartbeat", 0.14)), ev(TTJ.muscular.corte * r, "zap", 0.16), ...[0, 1, 2].map((i) => ev((TTJ.muscular.nodo + i * 0.8) * r, "heartbeat", 0.14)), ev(TTJ.muscular.chip * r, "ding", 0.16)],
  },
  "tej-nervioso": {
    id: "tej-nervioso", nombre: "4 tejidos · nervioso: tus neuronas corticales tienen tu misma edad", ideal: 4.55, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...[0, 1, 2].map((i) => ev(TTJ.nervioso.fila(i) * r, "tick", 0.1)), ev(TTJ.nervioso.neurona * r, "zap", 0.14), ev(TTJ.nervioso.chip * r, "ding", 0.18)],
  },
  /* ───────────── «Los dueños del cerebro» (astrocitos v2 · SINAPSIS) ───────────── */
  "ein-gancho": {
    id: "ein-gancho", nombre: "Astrocitos v2 · toxinas contra el capilar: algo las frena (gancho)", ideal: 3.95, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ev(TEIN.gancho.vaso * r + 0.2, "pop", 0.1), ...[0, 1, 2].map((i) => ev((TEIN.gancho.toxinas + 0.5 + i * 0.4) * r, "tick", 0.1)), ev(TEIN.gancho.escudo * r, "zap", 0.16), ev(TEIN.gancho.estrella * r, "ding", 0.18)],
  },
  "ein-barrera": {
    id: "ein-barrera", nombre: "Astrocitos v2 · pies perivasculares y barrera hematoencefálica (corte H&E esquemático)", ideal: 5.35, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TEIN.barrera.campo * r + 0.2, "pop", 0.1), ev(TEIN.barrera.pies * r, "zap", 0.12), ev(TEIN.barrera.nutri * r, "pop", 0.1), ev(TEIN.barrera.toxi * r, "thud", 0.16), ev(TEIN.barrera.chip * r, "ding", 0.16)],
  },
  "ein-tripartita": {
    id: "ein-tripartita", nombre: "Astrocitos v2 · lo que dibujan los libros (2 neuronas) y el tercer participante", ideal: 4.35, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TEIN.tripartita.dos * r + 0.3, "tick", 0.1), ev(TEIN.tripartita.falso * r, "thud", 0.2), ev(TEIN.tripartita.astro * r, "zap", 0.14), ev(TEIN.tripartita.chip * r, "ding", 0.18)],
  },
  "ein-esculpe": {
    id: "ein-esculpe", nombre: "Astrocitos v2 · poda lo débil, refuerza lo importante y esculpe una constelación", ideal: 4.95, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TEIN.esculpe.poda * r, TEIN.esculpe.podaDur * r, 0.05), ev(TEIN.esculpe.refuerza * r, "zap", 0.14), ev(TEIN.esculpe.constelacion * r, "ding", 0.2)],
  },
  "ein-diamond": {
    id: "ein-diamond", nombre: "Astrocitos v2 · 1985: Marian Diamond cuenta células en el cerebro de Einstein", ideal: 5.35, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TEIN.diamond.placa * r + 0.2, "pop", 0.1), ...clics(TEIN.diamond.cuenta * r, TEIN.diamond.cuentaDur * r, 0.05), ev(TEIN.diamond.pregunta * r, "radar", 0.12)],
  },
  "ein-hallazgo": {
    id: "ein-hallazgo", nombre: "Astrocitos v2 · el hallazgo: más glía por neurona en el área 39 izquierda", ideal: 3.95, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TEIN.hallazgo.campos * r + 0.2, "pop", 0.1), ev(TEIN.hallazgo.barra * r, "zap", 0.14), ev(TEIN.hallazgo.p * r, "ding", 0.18)],
  },
  "ein-cautela": {
    id: "ein-cautela", nombre: "Astrocitos v2 · una pista, no una prueba (1 cerebro, 1 de 4 áreas)", ideal: 3.35, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...[0, 1, 2, 3].map((i) => ev(TEIN.cautela.ficha(i) * r + 0.1, "thud", 0.12)), ev(TEIN.cautela.final * r, "ding", 0.18)],
  },
  "ein-gfap": {
    id: "ein-gfap", nombre: "Astrocitos v2 · campo de microscopio a 40x con GFAP: un cielo nocturno (cierre)", ideal: 5.75, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ...clics(TEIN.gfap.zoom * r, TEIN.gfap.zoomDur * r, 0.04), ev(TEIN.gfap.rotulo * r, "pop", 0.1), ev((TEIN.gfap.zoom + TEIN.gfap.zoomDur) * r, "ding", 0.2), ev(TEIN.gfap.fugaz * r, "whoosh", 0.12)],
  },
  /* ───────────── «El efecto del dígito izquierdo» (SINAPSIS · neuroeconomía) ───────────── */
  "dig-gancho": {
    id: "dig-gancho", nombre: "Dígito izquierdo · $9.999 y $10.000: un peso real contra un abismo percibido (gancho)", ideal: 4.35, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ev(TDIG.gancho.tags * r + 0.1, "pop", 0.1), ev(TDIG.gancho.cota * r, "tick", 0.1), ev(TDIG.gancho.abismo * r, "thud", 0.18), ev(TDIG.gancho.barraPercibida * r, "zap", 0.14), ev(TDIG.gancho.chip * r, "ding", 0.14)],
  },
  "dig-lectura": {
    id: "dig-lectura", nombre: "Dígito izquierdo · el modelo clásico: el primer dígito fija la cantidad y los demás entran con descuento", ideal: 4.95, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TDIG.lectura.precio * r + 0.1, "pop", 0.1), ...clics(TDIG.lectura.cursor * r, 0.6, 0.04), ev(TDIG.lectura.ancla * r, "zap", 0.14), ev(TDIG.lectura.descuento * r, "tick", 0.1), ev(TDIG.lectura.chip * r, "ding", 0.14)],
  },
  "dig-abismo": {
    id: "dig-abismo", nombre: "Dígito izquierdo · cuatro cifras contra cinco: columnas isométricas y el primer dígito que cambia (analogía visual)", ideal: 4.95, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TDIG.abismo.a * r + 0.15, "pop", 0.1), ev(TDIG.abismo.b * r + 0.15, "pop", 0.1), ev(TDIG.abismo.mas * r, "thud", 0.16), ev(TDIG.abismo.cambio * r, "zap", 0.14), ev(TDIG.abismo.chip * r, "ding", 0.14)],
  },
  "dig-autos": {
    id: "dig-autos", nombre: "Dígito izquierdo · 22 millones de ventas de autos: el precio cae en cada umbral de 10.000 millas (esquema)", ideal: 5.75, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TDIG.autos.curva * r, TDIG.autos.curvaDur * r * 0.6, 0.04), ev(TDIG.autos.cruce * r, "thud", 0.18), ev(TDIG.autos.tabla * r, "pop", 0.1), ev(TDIG.autos.fuente * r, "ding", 0.14)],
  },
  "dig-thomas": {
    id: "dig-thomas", nombre: "Dígito izquierdo · ficha de laboratorio (papel): el mismo centavo pesa distinto si cambia el primer dígito (Thomas y Morwitz 2005)", ideal: 6.55, fondo: "light", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TDIG.thomas.ficha * r + 0.1, "pop", 0.1), ev(TDIG.thomas.filaA * r, "tick", 0.1), ev(TDIG.thomas.circulo * r, "zap", 0.12), ev(TDIG.thomas.barraA * r, "thud", 0.16), ev(TDIG.thomas.filaB * r, "tick", 0.1), ev(TDIG.thomas.barraB * r, "pop", 0.1), ev(TDIG.thomas.sello * r, "ding", 0.2)],
  },
  "dig-escala": {
    id: "dig-escala", nombre: "Dígito izquierdo · una balanza: un centavo sobre un 99 se siente como más de veinte (Strulov-Shlain 2023)", ideal: 5.95, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TDIG.escala.centavo * r, "tick", 0.1), ...clics(TDIG.escala.monedas * r, TDIG.escala.monedasDur * r, 0.05), ev(TDIG.escala.inclina * r, "thud", 0.2), ev(TDIG.escala.chip1 * r, "pop", 0.1), ev(TDIG.escala.chip2 * r, "ding", 0.14)],
  },
  "dig-ojo": {
    id: "dig-ojo", nombre: "Dígito izquierdo · mapa de calor esquemático de seguimiento ocular: la primera mirada cae hacia el centro del precio (cierre)", ideal: 5.75, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ev(TDIG.ojo.etiqueta * r + 0.1, "pop", 0.1), ev(TDIG.ojo.calor * r, "radar", 0.1), ...[0, 1, 2, 3].map((i) => ev((TDIG.ojo.fijaciones + i * 0.42) * r, "tick", 0.1)), ev(TDIG.ojo.nota * r, "pop", 0.1), ev(TDIG.ojo.debate * r, "ding", 0.2)],
  },
  /* ───────────── «Puentes colgantes» (SINAPSIS · física estructural) ───────────── */
  "pte-gancho": {
    id: "pte-gancho", nombre: "Puentes · el cable no cuelga: tira (gravedad hacia abajo, tracción hacia las orillas)", ideal: 3.95, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ev(TPTE.gancho.puente * r + 0.1, "pop", 0.1), ev(TPTE.gancho.gravedad * r, "tick", 0.1), ev(TPTE.gancho.vectores * r, "zap", 0.16), ev(TPTE.gancho.chip * r, "ding", 0.14)],
  },
  "pte-parabola": {
    id: "pte-parabola", nombre: "Puentes · cable parabólico en halftone con tres potenciómetros (peso, flecha y tensión horizontal H = wL²/8f)", ideal: 5.75, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TPTE.parabola.knobs * r, "pop", 0.1), ...clics(TPTE.parabola.w * r, TPTE.parabola.wDur * r * 0.6, 0.04), ...clics(TPTE.parabola.f * r, TPTE.parabola.fDur * r * 0.6, 0.04), ev(TPTE.parabola.formula * r, "ding", 0.16)],
  },
  "pte-duelo": {
    id: "pte-duelo", nombre: "Puentes · Rayos X alámbrico: tracción roja en los cables, compresión azul en la torre, anclaje que resiste", ideal: 6.45, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TPTE.duelo.xray * r, "radar", 0.12), ev(TPTE.duelo.vectores * r, "zap", 0.14), ev(TPTE.duelo.compresion * r, "thud", 0.2), ev(TPTE.duelo.chip1 * r, "pop", 0.1), ev(TPTE.duelo.chip2 * r, "ding", 0.14)],
  },
  "pte-roebling": {
    id: "pte-roebling", nombre: "Puentes · cuaderno de campo sobre papel: Brooklyn, más de 5.000 alambres por cable, 19 hebras y marcas de conteo", ideal: 5.75, fondo: "light", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TPTE.roebling.ficha * r + 0.1, "pop", 0.1), ev(TPTE.roebling.hebras * r, "tick", 0.1), ...clics(TPTE.roebling.odometro * r, TPTE.roebling.odometroDur * r, 0.04), ev(TPTE.roebling.tally * r, "thud", 0.14), ev(TPTE.roebling.chip * r, "ding", 0.16)],
  },
  "pte-bloque": {
    id: "pte-bloque", nombre: "Puentes · barra maciza contra haz de alambres delgados (comparación cualitativa)", ideal: 4.75, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TPTE.bloque.barra * r + 0.1, "pop", 0.1), ev(TPTE.bloque.haz * r, "pop", 0.1), ev(TPTE.bloque.graficas * r, "thud", 0.16), ev(TPTE.bloque.chip * r, "ding", 0.14)],
  },
  "pte-cubo": {
    id: "pte-cubo", nombre: "Puentes · cubo isométrico del espacio de parámetros (carga, área, límite elástico): resiste en rojo, colapsa en azul, margen 6", ideal: 6.75, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TPTE.cubo.cubo * r + 0.1, "pop", 0.1), ...clics(TPTE.cubo.puntos * r, TPTE.cubo.puntosDur * r * 0.7, 0.04), ev(TPTE.cubo.margen * r, "zap", 0.14), ev(TPTE.cubo.formula * r, "pop", 0.1), ev(TPTE.cubo.chip * r, "ding", 0.16)],
  },
  "pte-zoom": {
    id: "pte-zoom", nombre: "Puentes · zoom logarítmico de 1.000 m a 1 mm: del puente al cable, a las hebras y al panal de alambres (cierre)", ideal: 6.35, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ...clics(TPTE.zoom.ini * r, TPTE.zoom.dur * r, 0.04), ev((TPTE.zoom.ini + TPTE.zoom.dur) * r, "ding", 0.2), ev(TPTE.zoom.chip * r, "pop", 0.1)],
  },
  /* ───────────── «La física de los ruidos nocturnos» (SINAPSIS · física cotidiana) ───────────── */
  "rui-gancho": {
    id: "rui-gancho", nombre: "Ruidos · telemetría 03:14: un pico en la señal y ondas de choque (gancho de terror)", ideal: 4.75, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "estatica", 0.1), ...clics(TRUI.gancho.traza * r, TRUI.gancho.trazaDur * r * 0.7, 0.03), ev(TRUI.gancho.pico * r, "golpe", 0.3), ev(TRUI.gancho.pico * r + 0.05, "heartbeat", 0.22), ev(TRUI.gancho.fisica * r, "tick", 0.12)],
  },
  "rui-dia": {
    id: "rui-dia", nombre: "Ruidos · de día: malla isométrica azul que absorbe fotones y se expande en silencio, con tres potenciómetros", ideal: 4.75, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.08), ev(TRUI.dia.knobs * r, "pop", 0.08), ...clics(TRUI.dia.subida * r, TRUI.dia.subidaDur * r * 0.5, 0.03), ev(TRUI.dia.formula * r, "tick", 0.1)],
  },
  "rui-noche": {
    id: "rui-noche", nombre: "Ruidos · de noche: la temperatura cae, la malla se encoge desigual y aparece la tensión (rojo)", ideal: 4.75, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "estatica", 0.1), ...clics(TRUI.noche.baja * r, TRUI.noche.bajaDur * r * 0.5, 0.04), ev(TRUI.noche.tension * r, "thud", 0.18), ev(TRUI.noche.formula * r, "heartbeat", 0.16)],
  },
  "rui-ritmos": {
    id: "rui-ritmos", nombre: "Ruidos · columnas isométricas: cuánto se contrae cada material (α) y cuántos mm por metro con 10 °C menos", ideal: 5.95, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.08), ...[0, 1, 2, 3, 4].map((i) => ev((TRUI.ritmos.cols + i * 0.3) * r, "pop", 0.08)), ev(TRUI.ritmos.mm * r, "tick", 0.1), ev(TRUI.ritmos.diez * r, "zap", 0.14), ev(TRUI.ritmos.chip * r, "ding", 0.1)],
  },
  "rui-friccion": {
    id: "rui-friccion", nombre: "Ruidos · Rayos X alámbrico: nodos rojos tirados por resortes, la fricción acumula tensión y resbalan; onda de choque a 343 m/s", ideal: 6.45, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "estatica", 0.1), ...clics(TRUI.friccion.acumula * r, TRUI.friccion.acumulaDur * r * 0.8, 0.05), ev(TRUI.friccion.salto * r, "golpe", 0.34), ev(TRUI.friccion.salto * r + 0.04, "thud", 0.26), ev(TRUI.friccion.chip * r, "tick", 0.1), ev(TRUI.friccion.tof * r, "tick", 0.1)],
  },
  "rui-remate": {
    id: "rui-remate", nombre: "Ruidos · corte a papel: osciloscopio verde que compara un paso y un cajón que se enfría (esquemático, tono clínico)", ideal: 4.75, fondo: "light", entra: "corte",
    sfx: (_d, r) => [ev(0.02, "clic", 0.14), ev(TRUI.remate.panel * r, "tick", 0.12), ...clics(TRUI.remate.trazas * r, TRUI.remate.trazasDur * r, 0.07), ev(TRUI.remate.nota * r, "ding", 0.14), ev(TRUI.remate.ast * r, "clic", 0.12)],
  },
  "rui-tally": {
    id: "rui-tally", nombre: "Ruidos · caja de datos con marcas de conteo y μs > μk: fallo de diseño, no un fantasma (papel)", ideal: 4.95, fondo: "light", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "clic", 0.12), ...[0, 1, 2, 3, 4].map((i) => ev((TRUI.tally.tally + i * 0.22) * r, "clic", 0.1)), ev(TRUI.tally.barras * r, "tick", 0.12), ev(TRUI.tally.sello * r, "thud", 0.16), ev(TRUI.tally.sello * r + 0.1, "ding", 0.12)],
  },
  "rui-micro": {
    id: "rui-micro", nombre: "Ruidos · zoom hasta la unión tornillo-madera: celdas de fibra raspando metal que colapsan en un punto rojo (cierre)", ideal: 6.95, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "estatica", 0.12), ...clics(TRUI.micro.zoom * r, TRUI.micro.zoomDur * r * 0.8, 0.05), ev(TRUI.micro.colapso * r, "golpe", 0.26), ev((TRUI.micro.colapso + TRUI.micro.colapsoDur) * r, "heartbeat", 0.22), ev((TRUI.micro.colapso + TRUI.micro.colapsoDur + 0.9) * r, "heartbeat", 0.18)],
  },
  /* ───────────── «La piscina que cuelga entre dos edificios» (SINAPSIS · ingeniería extrema) ───────────── */
  "pis-gancho": {
    id: "pis-gancho", nombre: "Piscina · dos torres isométricas, un hueco de ≈ 15 m a 35 m de altura y 150 t de agua (gancho)", ideal: 5.25, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ev(TPIS.gancho.torres * r + 0.1, "thud", 0.1), ev(TPIS.gancho.cota * r, "tick", 0.1), ...clics(TPIS.gancho.rect * r, TPIS.gancho.rectDur * r * 0.7, 0.04), ev(TPIS.gancho.agua * r, "gota", 0.14), ev(TPIS.gancho.chip * r, "ding", 0.14)],
  },
  "pis-vidrio": {
    id: "pis-vidrio", nombre: "Piscina · viga de vidrio que cede (ilustración) y el acrílico que la reemplaza", ideal: 6.2, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TPIS.vidrio.carga * r, "gota", 0.1), ev(TPIS.vidrio.rompe * r, "golpe", 0.3), ev(TPIS.vidrio.rompe * r + 0.05, "estatica", 0.2), ev(TPIS.vidrio.acril * r, "thud", 0.16), ev(TPIS.vidrio.dens * r, "tick", 0.1), ev(TPIS.vidrio.chip * r, "ding", 0.14)],
  },
  "pis-acrilico": {
    id: "pis-acrilico", nombre: "Piscina · sección en U con tres potenciómetros: espesor de la pared, del fondo y flecha (esquema)", ideal: 6.45, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TPIS.acrilico.knobs * r, "pop", 0.1), ...clics(TPIS.acrilico.lat * r, TPIS.acrilico.latDur * r * 0.6, 0.04), ...clics(TPIS.acrilico.fondo * r, TPIS.acrilico.fondoDur * r * 0.6, 0.04), ev(TPIS.acrilico.flecha * r, "thud", 0.14), ev(TPIS.acrilico.chip * r, "ding", 0.14)],
  },
  "pis-union": {
    id: "pis-union", nombre: "Piscina · juntas adhesivas transparentes y refracción acrílico/agua (papel)", ideal: 6.2, fondo: "light", entra: "corte",
    sfx: (_d, r) => [ev(0.02, "clic", 0.14), ev(TPIS.union.bloques * r, "thud", 0.12), ev(TPIS.union.inyecta * r, "gota", 0.12), ev(TPIS.union.borra * r, "ding", 0.12), ev(TPIS.union.rayos * r, "tick", 0.12), ev(TPIS.union.chip * r, "clic", 0.12)],
  },
  "pis-tinas": {
    id: "pis-tinas", nombre: "Piscina · Rayos X: tinas de acero, dos tensores de 38 mm y la presión del agua sobre las paredes", ideal: 6.7, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TPIS.tinas.tinas * r, "golpe", 0.2), ev(TPIS.tinas.viga * r, "thud", 0.14), ev(TPIS.tinas.tensores * r, "zap", 0.14), ev(TPIS.tinas.presion * r, "radar", 0.1), ev(TPIS.tinas.chip * r, "ding", 0.14)],
  },
  "pis-viento": {
    id: "pis-viento", nombre: "Piscina · torres que se mecen con el viento: unión rígida que falla (ilustración) y apoyos que deslizan", ideal: 7.0, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "estatica", 0.12), ev(TPIS.viento.rafaga * r, "whoosh", 0.18), ev(TPIS.viento.falla * r, "golpe", 0.26), ev(TPIS.viento.rayosx * r, "radar", 0.12), ev(TPIS.viento.apoyos * r, "thud", 0.18), ev(TPIS.viento.flota * r, "ding", 0.14), ev(TPIS.viento.chip * r, "tick", 0.1)],
  },
  "pis-carga": {
    id: "pis-carga", nombre: "Piscina · llenado con odómetro de 0 a 150 t y marcas de conteo (ilustración)", ideal: 5.2, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TPIS.carga.grifo * r, "pop", 0.12), ...clics(TPIS.carga.sube * r, TPIS.carga.subeDur * r, 0.04), ev((TPIS.carga.sube + TPIS.carga.subeDur) * r, "ding", 0.18), ev(TPIS.carga.chip * r, "tick", 0.1)],
  },
  "pis-zoom": {
    id: "pis-zoom", nombre: "Piscina · zoom logarítmico de 1 µm a 100 m: del polímero a la ciudad, con una silueta nadando (cierre)", ideal: 6.9, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ...clics(TPIS.zoom.ini * r, TPIS.zoom.dur * r * 0.8, 0.04), ev((TPIS.zoom.ini + TPIS.zoom.dur) * r, "ding", 0.2), ev(TPIS.zoom.nada * r, "gota", 0.16), ev(TPIS.zoom.pregunta * r, "pop", 0.1)],
  },
  /* ───────────── «El aire que no avisa» (SINAPSIS · medicina de altura) ───────────── */
  "jet-gancho": {
    id: "jet-gancho", nombre: "Jet · un jet de negocios cruza un mar de nubes al atardecer con su altímetro subiendo a 35.000 pies (gancho de la noticia)", ideal: 6.6, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.14), ev(TJET.gancho.chip * r, "ding", 0.1), ...clics(TJET.gancho.alt * r, TJET.gancho.altDur * r * 0.8, 0.04), ev((TJET.gancho.alt + TJET.gancho.altDur) * r, "ding", 0.16), ev(TJET.gancho.frase2 * r, "thud", 0.2), ev((TJET.gancho.frase2 + 0.5) * r, "heartbeat", 0.16)],
  },
  "jet-ascenso": {
    id: "jet-ascenso", nombre: "Jet · causa en investigación (sello) y ascenso de 0 a 10.668 m con la presión cayendo a casi una cuarta parte (cálculo ISA)", ideal: 8.4, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TJET.ascenso.sello * r, "golpe", 0.24), ev(TJET.ascenso.sale * r, "whoosh", 0.12), ...clics(TJET.ascenso.asc * r, TJET.ascenso.ascDur * r * 0.8, 0.04), ev((TJET.ascenso.asc + TJET.ascenso.ascDur) * r, "ding", 0.18), ev(TJET.ascenso.cuarta * r, "thud", 0.16)],
  },
  "jet-aire": {
    id: "jet-aire", nombre: "Jet · dos cámaras de gas con el mismo 21 % de oxígeno pero 5,4 veces menos presión de O₂ inspirado, comparadas con la cabina y el Everest", ideal: 8.0, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TJET.aire.camaras * r, "thud", 0.12), ev(TJET.aire.o2 * r, "pop", 0.12), ev(TJET.aire.sube * r, "whoosh", 0.12), ...clics(TJET.aire.pio * r, TJET.aire.pioDur * r * 0.8, 0.04), ev((TJET.aire.pio + TJET.aire.pioDur) * r, "tick", 0.14), ...clics(TJET.aire.barras * r, TJET.aire.barrasDur * r * 0.6, 0.04), ev(TJET.aire.ever * r, "ding", 0.16)],
  },
  "jet-cabina": {
    id: "jet-cabina", nombre: "Jet · corte transversal de la cabina presurizada con pasajeros: aire denso adentro, delgado y helado afuera (≈ 2.400 m equivalentes)", ideal: 6.4, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "estatica", 0.08), ev(TJET.cabina.casco * r, "thud", 0.14), ev(TJET.cabina.interior * r, "pop", 0.12), ev(TJET.cabina.aire * r, "whoosh", 0.12), ev(TJET.cabina.gauge * r, "ding", 0.14), ev(TJET.cabina.fuga * r, "radar", 0.14), ev(TJET.cabina.chip * r, "tick", 0.1)],
  },
  "jet-cerebro": {
    id: "jet-cerebro", nombre: "Jet · el cerebro iluminado: 2 % del peso del cuerpo, 20 % del oxígeno (columnas comparadas, flujo de sangre y neuronas)", ideal: 5.4, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "heartbeat", 0.18), ev(TJET.cerebro.flujo * r, "zap", 0.1), ev(TJET.cerebro.col2 * r, "pop", 0.1), ev(TJET.cerebro.col20 * r, "golpe", 0.2), ev((TJET.cerebro.col20 + 0.3) * r, "ding", 0.14), ev(TJET.cerebro.apaga * r, "heartbeat", 0.16)],
  },
  "jet-reloj": {
    id: "jet-reloj", nombre: "Jet · cronómetro de conciencia útil a 35.000 pies (30–60 s) y la tabla de la FAA por altitud", ideal: 5.8, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TJET.reloj.aguja * r, TJET.reloj.agujaDur * r * 0.8, 0.05), ...[0, 1, 2, 3, 4].map((i) => ev((TJET.reloj.tabla + TJET.reloj.tablaPaso * i) * r, "tick", 0.1)), ev(TJET.reloj.luz * r, "ding", 0.18), ev(TJET.reloj.tunel * r, "heartbeat", 0.2)],
  },
  "jet-silencio": {
    id: "jet-silencio", nombre: "Jet · tablero de instrumentos visto en primera persona: la visión en túnel se cierra mientras aparecen los síntomas silenciosos de la hipoxia", ideal: 6.7, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "estatica", 0.1), ...TJET.silencio.chips.map((c, i) => ev(c * r, i === 4 ? "golpe" : "pop", i === 4 ? 0.22 : 0.12)), ev(TJET.silencio.tunel * r, "heartbeat", 0.16), ev((TJET.silencio.tunel + 1.6) * r, "heartbeat", 0.2), ev((TJET.silencio.tunel + 3.0) * r, "heartbeat", 0.24)],
  },
  "jet-descenso": {
    id: "jet-descenso", nombre: "Jet · la máscara de oxígeno cae, el avión desciende de 35.000 a 10.000 pies y la visión se abre de nuevo (cierre)", ideal: 6.4, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(TJET.descenso.techo * r, "clic", 0.16), ev(TJET.descenso.mascara * r, "thud", 0.2), ev(TJET.descenso.bolsa * r, "whoosh", 0.14), ...clics(TJET.descenso.desc * r, TJET.descenso.descDur * r * 0.8, 0.04), ev(TJET.descenso.abre * r, "pop", 0.14), ev((TJET.descenso.desc + TJET.descenso.descDur) * r, "ding", 0.2), ev(TJET.descenso.frase * r, "heartbeat", 0.14)],
  },
  /* ───────────── «Un día sin dormir» (SINAPSIS · medicina cotidiana) ───────────── */
  "sue-gancho": {
    id: "sue-gancho", nombre: "Sueño · un reloj de pared avanza 24 h mientras un alcoholímetro sube a 0,10 % (gancho)", ideal: 5.7, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ...clics(TSUE.gancho.sube * r, TSUE.gancho.subeDur * r * 0.9, 0.05), ev(TSUE.gancho.alcohol * r, "pop", 0.12), ev((TSUE.gancho.sube + TSUE.gancho.subeDur) * r, "ding", 0.18), ev(TSUE.gancho.lectura * r, "thud", 0.18)],
  },
  "sue-horas": {
    id: "sue-horas", nombre: "Sueño · 7:00 → medianoche: 17 h despierto y el dial de rendimiento llega a 0,05 %", ideal: 6.8, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TSUE.horas.sube * r, TSUE.horas.subeDur * r * 0.9, 0.05), ev((TSUE.horas.sube + TSUE.horas.subeDur) * r, "ding", 0.18), ev(TSUE.horas.marca * r, "radar", 0.1), ev(TSUE.horas.nota * r, "tick", 0.1)],
  },
  "sue-limite": {
    id: "sue-limite", nombre: "Sueño · el dial cruza el límite legal de 0,08 % y llega a 0,10 % (alerta roja)", ideal: 6.7, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TSUE.limite.sube * r, TSUE.limite.subeDur * r * 0.8, 0.05), ev(TSUE.limite.cruza * r, "zap", 0.2), ev(TSUE.limite.alerta * r, "golpe", 0.24), ev((TSUE.limite.alerta + 0.5) * r, "radar", 0.14), ev(TSUE.limite.nota * r, "tick", 0.1)],
  },
  "sue-adenosina": {
    id: "sue-adenosina", nombre: "Sueño · el cerebro acumula adenosina (moléculas violeta) y sube la presión de sueño", ideal: 5.9, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "heartbeat", 0.14), ev(TSUE.adenosina.moleculas * r, "pop", 0.1), ...clics(TSUE.adenosina.sube * r, TSUE.adenosina.subeDur * r * 0.8, 0.04), ev(TSUE.adenosina.chip * r, "ding", 0.16)],
  },
  "sue-cafe": {
    id: "sue-cafe", nombre: "Sueño · un receptor de membrana: la cafeína ocupa el hueco de la adenosina, que sigue acumulándose", ideal: 5.9, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TSUE.cafe.une * r, "clic", 0.16), ev(TSUE.cafe.cafe * r, "gota", 0.14), ev(TSUE.cafe.bloquea * r, "golpe", 0.2), ev(TSUE.cafe.sigue * r, "pop", 0.1)],
  },
  "sue-micro": {
    id: "sue-micro", nombre: "Sueño · carretera de noche vista por el conductor: los párpados se cierran 4 s = 111 m a ciegas", ideal: 6.4, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "estatica", 0.1), ev(TSUE.micro.cierra * r, "thud", 0.24), ...clics(TSUE.micro.ciego * r, TSUE.micro.ciegoDur * r * 0.9, 0.05), ev(TSUE.micro.abre * r, "golpe", 0.3), ev((TSUE.micro.abre + 0.1) * r, "heartbeat", 0.26), ev(TSUE.micro.chip * r, "ding", 0.12)],
  },
  "sue-hospital": {
    id: "sue-hospital", nombre: "Sueño · pasillo de hospital: internos con turnos de más de 24 h, +36 % de errores graves y ×2,3 de choques", ideal: 8.4, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "radar", 0.1), ev(TSUE.hospital.barraA * r, "pop", 0.1), ev(TSUE.hospital.barraB * r, "pop", 0.12), ev(TSUE.hospital.mas36 * r, "golpe", 0.2), ev(TSUE.hospital.panel2 * r, "whoosh", 0.12), ev(TSUE.hospital.choque * r, "thud", 0.22), ev(TSUE.hospital.x23 * r, "ding", 0.16)],
  },
  "sue-dormir": {
    id: "sue-dormir", nombre: "Sueño · luna y ondas lentas: durmiendo, el rendimiento vuelve a cero; 7 h o más (cierre)", ideal: 7.4, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TSUE.dormir.eeg * r, "pop", 0.08), ...clics(TSUE.dormir.sube * r, TSUE.dormir.subeDur * r * 0.7, 0.03), ev((TSUE.dormir.sube + TSUE.dormir.subeDur) * r, "ding", 0.18), ev(TSUE.dormir.siete * r, "pop", 0.12), ev(TSUE.dormir.frase * r, "heartbeat", 0.12)],
  },
  /* ───────────── «¿Real o mito?» (SINAPSIS · curiosidades médicas con humor) ───────────── */
  "cur-gancho": {
    id: "cur-gancho", nombre: "Real o mito · Cerebrito presenta el concurso: seis cartas con signo de pregunta (gancho)", ideal: 4.8, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.14), ev(TCUR.gancho.mascota * r, "pop", 0.16), ...[0, 1, 2, 3, 4, 5].map((i) => ev((TCUR.gancho.cartas + TCUR.gancho.cartaPaso * i) * r, "pop", 0.1)), ev(TCUR.gancho.pregunta * r, "ding", 0.14)],
  },
  "cur-hipo": {
    id: "cur-hipo", nombre: "Real o mito · #1 Charles Osborne: 68 años de hipo (1922–1990), con un cerdo y hics que lo hacen saltar → REAL", ideal: 6.2, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TCUR.hipo.cerdo * r, "pop", 0.14), ...TCUR.hipo.hic.map((h) => ev(h * r, "pop", 0.16)), ...clics(TCUR.hipo.anios * r, TCUR.hipo.aniosDur * r * 0.9, 0.04), ev(TCUR.hipo.sello * r, "golpe", 0.3), ev((TCUR.hipo.sello + 0.1) * r, "ding", 0.2)],
  },
  "cur-cosquillas": {
    id: "cur-cosquillas", nombre: "Real o mito · #2 No puedes hacerte cosquillas: tu cerebelo predice tu propia mano → REAL", ideal: 6.4, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TCUR.cosquillas.otro * r, "pop", 0.12), ev((TCUR.cosquillas.otro + 0.5) * r, "pop", 0.12), ev((TCUR.cosquillas.otro + 1.0) * r, "pop", 0.12), ev(TCUR.cosquillas.serio * r, "thud", 0.14), ev(TCUR.cosquillas.cerebelo * r, "zap", 0.14), ev(TCUR.cosquillas.sello * r, "golpe", 0.3), ev((TCUR.cosquillas.sello + 0.1) * r, "ding", 0.2)],
  },
  "cur-chicle": {
    id: "cur-chicle", nombre: "Real o mito · #3 El chicle tragado tarda 7 años: MITO, recorre el tubo digestivo en unos días", ideal: 5.9, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TCUR.chicle.boca * r, "pop", 0.12), ev(TCUR.chicle.siete * r, "tick", 0.12), ev(TCUR.chicle.tacha * r, "zap", 0.16), ev(TCUR.chicle.sello * r, "golpe", 0.3), ev(TCUR.chicle.sello * r, "estatica", 0.18), ...clics(TCUR.chicle.viaje * r, TCUR.chicle.viajeDur * r * 0.9, 0.04), ev(TCUR.chicle.dias * r, "ding", 0.14)],
  },
  "cur-pastilla": {
    id: "cur-pastilla", nombre: "Real o mito · #4 La pastilla de azúcar cara (US$ 2,50) alivia más que la barata (US$ 0,10): 85 % vs 61 % → REAL", ideal: 7.4, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TCUR.pastilla.barata * r, "pop", 0.12), ev(TCUR.pastilla.cara * r, "cash", 0.16), ...clics(TCUR.pastilla.barras * r, TCUR.pastilla.barrasDur * r * 0.8, 0.04), ev(TCUR.pastilla.mas * r, "zap", 0.14), ev(TCUR.pastilla.sello * r, "golpe", 0.3), ev((TCUR.pastilla.sello + 0.1) * r, "ding", 0.2)],
  },
  "cur-violin": {
    id: "cur-violin", nombre: "Real o mito · #5 Un violinista tocó mientras le implantaban electrodos: el tejido cerebral no siente dolor → REAL", ideal: 7.1, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TCUR.violin.cabeza * r, "pop", 0.12), ev(TCUR.violin.violin * r, "pop", 0.14), ev(TCUR.violin.electrodo * r, "zap", 0.16), ev(TCUR.violin.dolor * r, "tick", 0.14), ev(TCUR.violin.sello * r, "golpe", 0.3), ev((TCUR.violin.sello + 0.1) * r, "ding", 0.2)],
  },
  "cur-acento": {
    id: "cur-acento", nombre: "Real o mito · #6 Síndrome del acento extranjero: una noruega empieza a sonar alemana tras una lesión cerebral (1947) → REAL", ideal: 6.4, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TCUR.acento.persona * r, "pop", 0.12), ev(TCUR.acento.antes * r, "pop", 0.12), ev(TCUR.acento.golpe * r, "golpe", 0.22), ev(TCUR.acento.despues * r, "pop", 0.14), ev(TCUR.acento.banderas * r, "ding", 0.14), ev(TCUR.acento.sello * r, "golpe", 0.3), ev((TCUR.acento.sello + 0.1) * r, "ding", 0.2)],
  },
  "cur-marcador": {
    id: "cur-marcador", nombre: "Real o mito · el marcador: 5 reales y 1 mito, trofeo y pregunta «¿cuántos acertaste?» (cierre)", ideal: 4.8, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...[0, 1, 2, 3, 4, 5].map((i) => ev((TCUR.marcador.luces + TCUR.marcador.luzPaso * i) * r, i === 2 ? "golpe" : "ding", i === 2 ? 0.2 : 0.12)), ev(TCUR.marcador.copa * r, "cash", 0.18), ev(TCUR.marcador.comentar * r, "pop", 0.14)],
  },
  /* ───────────── Futbolista: paro cardíaco tras un golpe en el pecho (SINAPSIS · medicina y actualidad) ───────────── */
  "fut-gancho": {
    id: "fut-gancho", nombre: "Futbolista · en memoria: tarjeta con el nombre, líneas de cancha y un ECG que se apaga con calma (gancho)", ideal: 7.4, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TFUT.gancho.chip * r, "ding", 0.1), ...[0, 1, 2, 3, 4].map((i) => ev((TFUT.gancho.ecg + 0.8 * i) * r, "tick", 0.12)), ev(TFUT.gancho.frase2 * r, "thud", 0.2), ev(TFUT.gancho.frase3 * r, "radar", 0.12)],
  },
  "fut-causa": {
    id: "fut-causa", nombre: "Futbolista · sello «causa médica no informada» y el término commotio cordis («agitación del corazón»)", ideal: 6.0, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "estatica", 0.08), ev(TFUT.causa.sello * r, "golpe", 0.24), ev(TFUT.causa.sale * r, "whoosh", 0.1), ...clics(TFUT.causa.term * r, 1.2 * r, 0.05), ev(TFUT.causa.gloss * r, "ding", 0.14)],
  },
  "fut-ventana": {
    id: "fut-ventana", nombre: "Futbolista · un latido de ECG con su ventana vulnerable: el mismo golpe no hace nada fuera de ella y desencadena fibrilación dentro (esquema)", ideal: 7.7, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TFUT.ventana.banda * r, "radar", 0.12), ev(TFUT.ventana.golpe1 * r, "thud", 0.16), ev(TFUT.ventana.golpe2 * r, "golpe", 0.3), ev((TFUT.ventana.golpe2 + 0.1) * r, "estatica", 0.18), ev(TFUT.ventana.nota * r, "tick", 0.1)],
  },
  "fut-fibrilacion": {
    id: "fut-fibrilacion", nombre: "Futbolista · un corazón que latía con ritmo y de pronto solo tiembla: fibrilación ventricular, no bombea sangre", ideal: 6.0, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "heartbeat", 0.2), ev(0.9 * r, "heartbeat", 0.2), ev(TFUT.fibrilacion.golpe * r, "golpe", 0.3), ev(TFUT.fibrilacion.golpe * r, "estatica", 0.2), ev(TFUT.fibrilacion.rotulo * r, "radar", 0.14), ev(TFUT.fibrilacion.sangre * r, "tick", 0.12)],
  },
  "fut-cerebro": {
    id: "fut-cerebro", nombre: "Futbolista · el cerebro sin oxígeno y la curva de supervivencia que cae ≈ 10 % por minuto sin descarga (ilustración)", ideal: 6.7, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TFUT.cerebro.reloj * r, TFUT.cerebro.relojDur * r * 0.9, 0.04), ev(TFUT.cerebro.marca10s * r, "tick", 0.14), ev(TFUT.cerebro.marca4min * r, "radar", 0.14), ev(TFUT.cerebro.cae * r, "thud", 0.18)],
  },
  "fut-descarga": {
    id: "fut-descarga", nombre: "Futbolista · un desfibrilador (DEA): analiza, carga, descarga y el ritmo vuelve; 58 % de supervivencia en el registro de EE. UU.", ideal: 8.4, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TFUT.descarga.dea * r, "pop", 0.14), ev(TFUT.descarga.parches * r, "clic", 0.16), ev(TFUT.descarga.analiza * r, "radar", 0.14), ev(TFUT.descarga.shock * r, "zap", 0.3), ev(TFUT.descarga.shock * r, "golpe", 0.3), ev(TFUT.descarga.normal * r, "heartbeat", 0.2), ev(TFUT.descarga.cifra * r, "ding", 0.18)],
  },
  "fut-rcp": {
    id: "fut-rcp", nombre: "Futbolista · tres pasos: llama a emergencias, comprime el centro del pecho (100–120/min, 5–6 cm) y busca un DEA", ideal: 8.1, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TFUT.rcp.paso1 * r, "pop", 0.14), ev(TFUT.rcp.paso2 * r, "pop", 0.14), ev(TFUT.rcp.paso3 * r, "pop", 0.14), ...clics(TFUT.rcp.paso2 * r + 0.3, 4.8 * r, 0.05)],
  },
  "fut-cierre": {
    id: "fut-cierre", nombre: "Futbolista · una vela, «aprende RCP» y descanse en paz (cierre)", ideal: 6.4, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.08), ev(TFUT.cierre.frase1 * r, "pop", 0.1), ev(TFUT.cierre.frase2 * r, "ding", 0.14), ev(TFUT.cierre.chip * r, "tick", 0.1)],
  },
  /* ───────────── «El viaje de una gota de sangre» (SINAPSIS · anatomía humana) ───────────── */
  "san-gancho": {
    id: "san-gancho", nombre: "Sangre · una gota brillante late en la oscuridad y un anillo marca la vuelta de ≈ 1 minuto; la cámara cae dentro (gancho)", ideal: 6.7, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ev(TSAN.gancho.gota * r, "pop", 0.16), ev(TSAN.gancho.gota * r + 0.2, "heartbeat", 0.24), ev((TSAN.gancho.gota + 0.8) * r, "heartbeat", 0.24), ev(TSAN.gancho.frase2 * r, "ding", 0.12), ev(TSAN.gancho.cae * r, "whoosh", 0.2)],
  },
  "san-corazon": {
    id: "san-corazon", nombre: "Sangre · corte del ventrículo izquierdo: el músculo se contrae, la válvula se abre y 70 mL salen por la aorta (7.000 L al día)", ideal: 7.4, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "heartbeat", 0.3), ev(TSAN.corazon.ml * r, "pop", 0.12), ev(TSAN.corazon.minuto * r, "pop", 0.12), ev(TSAN.corazon.dia * r, "ding", 0.18), ev((TSAN.corazon.dia + 0.1) * r, "thud", 0.2)],
  },
  "san-aorta": {
    id: "san-aorta", nombre: "Sangre · vuelo dentro de la aorta (≈ 3 cm): paredes que laten, glóbulos que pasan y ramas que se abren", ideal: 7.4, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.16), ev(0.4 * r, "heartbeat", 0.26), ev(TSAN.aorta.ancho * r, "pop", 0.12), ev(TSAN.aorta.ramas * r, "whoosh", 0.14), ev((TSAN.aorta.ramas + 1.2) * r, "ding", 0.14)],
  },
  "san-ramas": {
    id: "san-ramas", nombre: "Sangre · árbol arterial que se ramifica de ≈ 3 cm a ≈ 8 µm, comparado con un cabello (≈ 70 µm)", ideal: 7.4, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...[0, 1, 2, 3].map((i) => ev((TSAN.ramas.arbol + TSAN.ramas.genDur * i) * r, "pop", 0.12)), ev(TSAN.ramas.escala * r, "ding", 0.14), ev(TSAN.ramas.cabello * r, "tick", 0.14)],
  },
  "san-capilar": {
    id: "san-capilar", nombre: "Sangre · el capilar: los glóbulos rojos se deforman, avanzan en fila de a uno y entregan oxígeno a las células (≈ 270 millones de hemoglobinas)", ideal: 7.4, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TSAN.capilar.entra * r, "pop", 0.14), ev(TSAN.capilar.o2 * r, "zap", 0.12), ...clics(TSAN.capilar.o2 * r + 0.2, 1.4 * r, 0.04), ev(TSAN.capilar.hb * r, "ding", 0.14), ev(TSAN.capilar.lento * r, "tick", 0.12)],
  },
  "san-venas": {
    id: "san-venas", nombre: "Sangre · una vena con válvulas y el músculo de la pantorrilla que empuja la sangre oscura hacia arriba", ideal: 6.4, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TSAN.venas.valvulas * r, "clic", 0.16), ev((TSAN.venas.valvulas + 0.4) * r, "clic", 0.16), ev(TSAN.venas.musculo * r, "thud", 0.2), ev((TSAN.venas.musculo + 0.9) * r, "thud", 0.2), ev(TSAN.venas.sube * r, "ding", 0.12)],
  },
  "san-pulmon": {
    id: "san-pulmon", nombre: "Sangre · el alvéolo: en ≈ 0,75 s el glóbulo suelta CO2 y recoge O2 y se vuelve rojo brillante", ideal: 7.1, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ev(TSAN.pulmon.alveolo * r, "pop", 0.12), ev(TSAN.pulmon.pasa * r, "zap", 0.16), ...clics(TSAN.pulmon.co2 * r, 1.2 * r, 0.04), ev(TSAN.pulmon.bola * r, "ding", 0.18)],
  },
  "san-vida": {
    id: "san-vida", nombre: "Sangre · un glóbulo vive ≈ 120 días y da ≈ 172.000 vueltas; la médula fabrica ≈ 2–3 millones por segundo; el viaje cierra el círculo (cierre)", ideal: 8.4, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TSAN.vida.anillo * r, "pop", 0.12), ...clics(TSAN.vida.vueltas * r, TSAN.vida.vueltasDur * r * 0.9, 0.05), ev((TSAN.vida.vueltas + TSAN.vida.vueltasDur) * r, "ding", 0.18), ev(TSAN.vida.medula * r, "pop", 0.14), ev(TSAN.vida.fin * r, "heartbeat", 0.24)],
  },
  /* ───────────── «La noche que Röntgen vio a través de la piel» (SINAPSIS · historia de la medicina) ───────────── */
  "rx-gancho": {
    id: "rx-gancho", nombre: "Rayos X · una pantalla verde brilla en la oscuridad y aparecen huesos; han pasado 131 años del 8 de noviembre de 1895 (gancho)", ideal: 7.1, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ev(TRX.gancho.anios * r, "tick", 0.12), ev(TRX.gancho.pantalla * r, "zap", 0.14), ev(TRX.gancho.huesos * r, "ding", 0.2), ev(TRX.gancho.huesos * r + 0.1, "pop", 0.14)],
  },
  "rx-tubo": {
    id: "rx-tubo", nombre: "Rayos X · Würzburg, 1895: el tubo cubierto con cartón negro, la luz se apaga y una pantalla cercana brilla", ideal: 7.3, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TRX.tubo.bobina * r, "zap", 0.12), ev(TRX.tubo.carton * r, "thud", 0.18), ev(TRX.tubo.luz * r, "clic", 0.2), ev(TRX.tubo.brilla * r, "ding", 0.16), ev(TRX.tubo.brilla * r + 0.05, "zap", 0.1)],
  },
  "rx-huesos": {
    id: "rx-huesos", nombre: "Rayos X · rayos invisibles atraviesan el cartón; al interponer la mano aparecen sus huesos en la pantalla", ideal: 6.6, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TRX.huesos.rayos * r, "zap", 0.14), ev(TRX.huesos.mano * r, "whoosh", 0.14), ev(TRX.huesos.cuenta * r, "tick", 0.1), ev(TRX.huesos.huesos * r, "ding", 0.2), ev(TRX.huesos.huesos * r + 0.1, "pop", 0.14)],
  },
  "rx-x": {
    id: "rx-x", nombre: "Rayos X · no sabía qué eran, así que los llamó «X», la letra de la incógnita", ideal: 5.5, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TRX.x.pregunta * r, "pop", 0.1), ev(TRX.x.x * r, "thud", 0.2), ev(TRX.x.x * r + 0.05, "ding", 0.16), ev(TRX.x.incognita * r, "tick", 0.12)],
  },
  "rx-anna": {
    id: "rx-anna", nombre: "Rayos X · 22 dic 1895: la radiografía de la mano de su esposa Anna Bertha, con su anillo (≈ 15 min de exposición)", ideal: 7.1, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TRX.anna.fecha * r, "tick", 0.12), ev(TRX.anna.placa * r, "pop", 0.16), ev(TRX.anna.placa * r + 0.2, "zap", 0.12), ev(TRX.anna.anillo * r, "ding", 0.2), ev(TRX.anna.tiempo * r, "tick", 0.12), ev(TRX.anna.cita * r, "thud", 0.16)],
  },
  "rx-mundo": {
    id: "rx-mundo", nombre: "Rayos X · 28 dic 1895 el artículo; en enero de 1896 la noticia da la vuelta al mundo y se radiografía una aguja clavada en una mano", ideal: 7.3, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TRX.mundo.fecha * r, "pop", 0.14), ev(TRX.mundo.enero * r, "whoosh", 0.16), ...clics(TRX.mundo.enero * r + 0.2, 1.6 * r, 0.04), ev(TRX.mundo.aguja * r, "zap", 0.14), ev((TRX.mundo.aguja + 0.3) * r, "ding", 0.18)],
  },
  "rx-nobel": {
    id: "rx-nobel", nombre: "Rayos X · rechazó patentarlo; 1901: primer Nobel de Física, y el dinero fue a su universidad", ideal: 6.5, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TRX.nobel.sello * r, "thud", 0.24), ev(TRX.nobel.medalla * r, "pop", 0.16), ev((TRX.nobel.medalla + 0.1) * r, "ding", 0.2), ev(TRX.nobel.primer * r, "tick", 0.12), ...clics(TRX.nobel.dinero * r, 1.6 * r, 0.05)],
  },
  "rx-cierre": {
    id: "rx-cierre", nombre: "Rayos X · los pioneros sin protección vs hoy con dosis medida; el 8 de noviembre es el Día Internacional de la Radiología (cierre)", ideal: 8.1, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TRX.cierre.quema * r, "thud", 0.18), ev(TRX.cierre.hoy * r, "pop", 0.16), ev((TRX.cierre.hoy + 0.1) * r, "ding", 0.16), ev(TRX.cierre.dia * r, "ding", 0.22), ev((TRX.cierre.dia + 0.15) * r, "pop", 0.14)],
  },
  /* ───────────── «La cena en que tres médicos se durmieron» (SINAPSIS · historia de la anestesia) ───────────── */
  "an-gancho": {
    id: "an-gancho", nombre: "Anestesia · 4 nov 1847: tres médicos se desmayan en una cena, a propósito; han pasado 179 años (gancho)", ideal: 7.3, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TAN.gancho.anios * r, "tick", 0.1), ev(TAN.gancho.cae * r, "thud", 0.2), ev((TAN.gancho.cae + 0.45) * r, "thud", 0.2), ev((TAN.gancho.cae + 0.9) * r, "thud", 0.2), ev(TAN.gancho.proposito * r, "ding", 0.16)],
  },
  "an-carrera": {
    id: "an-carrera", nombre: "Anestesia · antes, operar era una carrera: Robert Liston, según se cuenta, amputaba una pierna en ≈ 30 s", ideal: 7.8, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TAN.carrera.carrera * r, 1.2 * r, 0.05), ev(TAN.carrera.liston * r, "pop", 0.14), ev(TAN.carrera.cuenta * r, "tick", 0.1), ev(TAN.carrera.pierna * r, "thud", 0.2), ...clics(TAN.carrera.treinta * r, 1.0 * r, 0.05)],
  },
  "an-eter": {
    id: "an-eter", nombre: "Anestesia · 16 oct 1846, Boston: el éter funciona, pero irrita y huele muy fuerte", ideal: 7.8, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TAN.eter.fecha * r + 0.3, "pop", 0.12), ev(TAN.eter.funciona * r, "ding", 0.2), ev(TAN.eter.boston * r, "tick", 0.1), ev(TAN.eter.irrita * r, "thud", 0.16), ev(TAN.eter.olor * r, "whoosh", 0.12)],
  },
  "an-busca": {
    id: "an-busca", nombre: "Anestesia · Edimburgo: Simpson y sus ayudantes prueban sustancias hasta dar con el cloroformo", ideal: 5.6, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TAN.busca.simpson * r, "pop", 0.12), ...[0, 1, 2, 3, 4].map((i) => ev((TAN.busca.prueba - 0.8 + i * 0.5) * r, "clic", 0.12)), ev(TAN.busca.ayudantes * r, "tick", 0.1), ev(TAN.busca.cloro * r, "ding", 0.2)],
  },
  "an-noche": {
    id: "an-noche", nombre: "Anestesia · la noche del 4 nov 1847: inhalan cloroformo, conversan animados y pierden el conocimiento", ideal: 6.0, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TAN.noche.inhalan * r, "whoosh", 0.14), ev(TAN.noche.charla * r, "pop", 0.12), ev((TAN.noche.charla + 0.5) * r, "pop", 0.1), ev(TAN.noche.caen * r, "thud", 0.2), ev((TAN.noche.caen + 0.35) * r, "thud", 0.2), ev((TAN.noche.caen + 0.7) * r, "thud", 0.2)],
  },
  "an-despierta": {
    id: "an-despierta", nombre: "Anestesia · Simpson despierta y comprende que ha encontrado lo que buscaba; pocos días después, el primer parto con cloroformo", ideal: 6.2, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TAN.despierta.ojos * r + 0.2, "pop", 0.12), ev(TAN.despierta.idea * r, "ding", 0.2), ...clics(TAN.despierta.dias * r, 0.9 * r, 0.05), ev(TAN.despierta.partos * r, "ding", 0.18)],
  },
  "an-reina": {
    id: "an-reina", nombre: "Anestesia · críticas religiosas y 7 abr 1853: la reina Victoria usa cloroformo en un parto, administrado por John Snow", ideal: 7.3, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TAN.reina.critica * r + 0.3, "thud", 0.14), ev(TAN.reina.fecha * r, "tick", 0.12), ev(TAN.reina.reina * r, "ding", 0.2), ev(TAN.reina.parto * r, "pop", 0.14)],
  },
  "an-cierre": {
    id: "an-cierre", nombre: "Anestesia · el cloroformo ya no se usa, pero esa cena abrió el camino de la anestesia moderna (cierre)", ideal: 5.9, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TAN.cierre.ya * r, "thud", 0.22), ev(TAN.cierre.camino * r, "whoosh", 0.14), ev(TAN.cierre.moderna * r, "ding", 0.2), ev((TAN.cierre.moderna + 0.3) * r, "heartbeat", 0.2)],
  },
  /* ───────────── «Los cuadernos radiactivos de Marie Curie» (SINAPSIS · historia de la medicina) ───────────── */
  "mc-gancho": {
    id: "mc-gancho", nombre: "Curie · una caja de plomo con el cuaderno que aún brilla y un contador Geiger que chasquea; 159 años de su nacimiento (gancho)", ideal: 7.1, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TMC.gancho.geiger * r, 2.6 * r, 0.05), ev(TMC.gancho.caja * r, "thud", 0.18), ev(TMC.gancho.fecha * r, "tick", 0.12), ev(TMC.gancho.anios * r, "tick", 0.1), ev((TMC.gancho.anios + TMC.gancho.aniosDur) * r, "ding", 0.18)],
  },
  "mc-paris": {
    id: "mc-paris", nombre: "Curie · nació en Varsovia, donde las mujeres no podían estudiar en la universidad, y se fue a París (1891)", ideal: 6.1, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TMC.paris.varsovia * r + 0.2, "pop", 0.12), ev(TMC.paris.puerta * r, "thud", 0.2), ev(TMC.paris.viaje * r, "whoosh", 0.16), ev(TMC.paris.paris * r, "ding", 0.18)],
  },
  "mc-elementos": {
    id: "mc-elementos", nombre: "Curie · 1898: con Pierre descubre el polonio (nombrado por su país) y el radio", ideal: 6.8, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TMC.elementos.anio * r + 0.2, "tick", 0.1), ev(TMC.elementos.polonio * r, "pop", 0.16), ev((TMC.elementos.polonio + 0.1) * r, "ding", 0.18), ev(TMC.elementos.pais * r, "tick", 0.1), ev(TMC.elementos.radio * r, "pop", 0.16), ev((TMC.elementos.radio + 0.1) * r, "ding", 0.2)],
  },
  "mc-toneladas": {
    id: "mc-toneladas", nombre: "Curie · para obtener una décima de gramo de radio procesó toneladas de mineral durante años", ideal: 5.1, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TMC.toneladas.gramo * r + 0.2, "pop", 0.12), ...clics(TMC.toneladas.mineral * r, 1.2 * r, 0.05), ev(TMC.toneladas.mineral * r, "thud", 0.2), ev(TMC.toneladas.anios * r, "tick", 0.12)],
  },
  "mc-nobel": {
    id: "mc-nobel", nombre: "Curie · dos Nobel (Física 1903, Química 1911): primera mujer y única persona premiada en dos ciencias", ideal: 7.8, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TMC.nobel.medalla1 * r, "pop", 0.16), ev((TMC.nobel.medalla1 + 0.1) * r, "ding", 0.2), ev(TMC.nobel.medalla2 * r, "pop", 0.16), ev((TMC.nobel.medalla2 + 0.1) * r, "ding", 0.2), ev(TMC.nobel.mujer * r, "tick", 0.12), ev(TMC.nobel.unica * r, "ding", 0.18)],
  },
  "mc-guerra": {
    id: "mc-guerra", nombre: "Curie · Primera Guerra Mundial: ambulancias con rayos X («pequeñas Curies») para localizar balas y fracturas", ideal: 7.1, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TMC.guerra.fecha * r + 0.2, "tick", 0.12), ev(TMC.guerra.furgon * r, "whoosh", 0.18), ev(TMC.guerra.rayos * r, "zap", 0.16), ev((TMC.guerra.rayos + 0.3) * r, "ding", 0.18), ev(TMC.guerra.apodo * r, "pop", 0.14), ev(TMC.guerra.cifras * r, "tick", 0.12)],
  },
  "mc-riesgo": {
    id: "mc-riesgo", nombre: "Curie · manejaba tubos y sales de radio sin protección; murió en 1934, probablemente por la radiación", ideal: 6.8, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TMC.riesgo.tubo * r, 2.4 * r, 0.04), ev(TMC.riesgo.sin * r, "thud", 0.16), ev(TMC.riesgo.muerte * r, "thud", 0.22), ev(TMC.riesgo.prob * r, "tick", 0.1)],
  },
  "mc-cuadernos": {
    id: "mc-cuadernos", nombre: "Curie · sus cuadernos están en cajas de plomo y tardarán ≈ 1.500 años en perder la mitad de su radiactividad (cierre)", ideal: 6.8, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TMC.cuadernos.caja * r + 0.2, "thud", 0.2), ...clics(TMC.cuadernos.vida * r, 2.0 * r, 0.04), ev(TMC.cuadernos.mitad * r, "ding", 0.2), ev(TMC.cuadernos.permiso * r, "tick", 0.12)],
  },
  /* ───────────── «La inyección que cambió todo» (SINAPSIS · historia de la insulina) ───────────── */
  "ins-gancho": {
    id: "ins-gancho", nombre: "Insulina · el calendario del 14 de noviembre: Banting cumpliría 135 años, su cumpleaños es el Día Mundial de la Diabetes y vendió su patente por un dólar (gancho)", ideal: 7.8, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TIN.gancho.calendario * r + 0.1, "pop", 0.12), ...clics(TIN.gancho.banting * r, TIN.gancho.aniosDur * r, 0.04), ev(TIN.gancho.dia * r, "ding", 0.2), ev(TIN.gancho.dolar * r, "pop", 0.16), ev((TIN.gancho.dolar + 0.1) * r, "ding", 0.18)],
  },
  "ins-hambre": {
    id: "ins-hambre", nombre: "Insulina · antes de 1922 la diabetes tipo 1 era mortal y el tratamiento era una dieta de hambre", ideal: 6.1, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TIN.hambre.sala * r + 0.2, "heartbeat", 0.2), ev(TIN.hambre.mortal * r, "thud", 0.2), ev(TIN.hambre.dieta * r, "tick", 0.12), ev((TIN.hambre.dieta + 0.4) * r, "tick", 0.1)],
  },
  "ins-perros": {
    id: "ins-perros", nombre: "Insulina · Toronto 1921: Banting y Best prueban un extracto de páncreas en perros y el azúcar en sangre baja", ideal: 6.8, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TIN.perros.toronto * r + 0.2, "pop", 0.1), ev(TIN.perros.doctores * r, "pop", 0.12), ev(TIN.perros.extracto * r, "zap", 0.12), ...clics(TIN.perros.baja * r, 1.2 * r, 0.04), ev((TIN.perros.baja + 1.2) * r, "ding", 0.18)],
  },
  "ins-primera": {
    id: "ins-primera", nombre: "Insulina · 11 ene 1922: un niño de 29 kg recibe la primera inyección; el extracto impuro apenas funciona", ideal: 6.8, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TIN.primera.fecha * r + 0.2, "tick", 0.12), ev(TIN.primera.nino * r, "pop", 0.14), ev(TIN.primera.inyeccion * r, "zap", 0.14), ev(TIN.primera.fallo * r, "thud", 0.2)],
  },
  "ins-segunda": {
    id: "ins-segunda", nombre: "Insulina · Collip purifica el extracto; el 23 ene 1922 lo inyectan de nuevo y en un día los síntomas casi desaparecen", ideal: 6.8, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TIN.segunda.filtro * r, "pop", 0.12), ev(TIN.segunda.fecha * r, "tick", 0.12), ev(TIN.segunda.inyeccion * r, "zap", 0.14), ...clics(TIN.segunda.reloj * r, 1.0 * r, 0.05), ev(TIN.segunda.mejora * r, "ding", 0.22)],
  },
  "ins-nobel": {
    id: "ins-nobel", nombre: "Insulina · Nobel de Medicina 1923 para Banting y Macleod, que comparten el dinero con Best y Collip", ideal: 5.9, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TIN.nobel.medalla * r + 0.2, "pop", 0.16), ev((TIN.nobel.medalla + 0.3) * r, "ding", 0.2), ev(TIN.nobel.nombres * r, "tick", 0.12), ev(TIN.nobel.comparten * r, "pop", 0.14), ev((TIN.nobel.comparten + 0.4) * r, "pop", 0.14)],
  },
  "ins-patente": {
    id: "ins-patente", nombre: "Insulina · la patente se vende a la Universidad de Toronto por un dólar para que la insulina se fabrique sin trabas", ideal: 6.8, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TIN.patente.doc * r + 0.2, "pop", 0.12), ev(TIN.patente.dolar * r, "thud", 0.22), ev((TIN.patente.dolar + 0.1) * r, "ding", 0.2), ...clics(TIN.patente.fabrica * r, 1.8 * r, 0.05)],
  },
  "ins-hoy": {
    id: "ins-hoy", nombre: "Insulina · hoy millones de personas con diabetes usan insulina; cada 14 de noviembre se recuerda esta historia (cierre)", ideal: 5.9, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TIN.hoy.mundo * r + 0.4, 2.2 * r, 0.04), ev(TIN.hoy.dia * r, "ding", 0.2), ev(TIN.hoy.circulo * r, "pop", 0.16), ev((TIN.hoy.circulo + 0.1) * r, "heartbeat", 0.2)],
  },
  /* ───────────── «La médula espinal: el atajo del cuerpo» (SINAPSIS · neuroanatomía) ───────────── */
  "me-gancho": {
    id: "me-gancho", nombre: "Médula · el reflejo rotuliano: el martillo golpea la rodilla y la orden sale de la médula, no del cerebro (gancho)", ideal: 6.5, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TME.gancho.golpe * r, "thud", 0.24), ev((TME.gancho.golpe + 0.1) * r, "zap", 0.14), ev((TME.gancho.golpe + 0.35) * r, "pop", 0.14), ev(TME.gancho.cerebro * r, "tick", 0.12), ev(TME.gancho.medula * r, "ding", 0.2)],
  },
  "me-columna": {
    id: "me-columna", nombre: "Médula · ≈ 45 cm dentro de la columna vertebral y 31 pares de nervios", ideal: 7.3, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TME.columna.regla * r, "pop", 0.12), ev(TME.columna.columna * r, "tick", 0.12), ...clics(TME.columna.nervios * r, 2.0 * r, 0.04), ev(TME.columna.conteo * r + 1.8, "ding", 0.2)],
  },
  "me-cola": {
    id: "me-cola", nombre: "Médula · termina a la altura de L1–L2; debajo solo hay raíces nerviosas: la cola de caballo", ideal: 7.3, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TME.cola.lumbar * r, "pop", 0.14), ev(TME.cola.nervios * r, "whoosh", 0.12), ev(TME.cola.caballo * r, "ding", 0.18), ev(TME.cola.puncion * r, "tick", 0.14)],
  },
  "me-mariposa": {
    id: "me-mariposa", nombre: "Médula · corte transversal: mariposa de sustancia gris rodeada de sustancia blanca", ideal: 7.1, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TME.mariposa.forma * r + 0.2, "pop", 0.14), ev(TME.mariposa.gris * r, "pop", 0.12), ...clics(TME.mariposa.procesa * r, 1.4 * r, 0.04), ev(TME.mariposa.blanca * r, "pop", 0.12), ev(TME.mariposa.autopistas * r, "whoosh", 0.16)],
  },
  "me-velocidad": {
    id: "me-velocidad", nombre: "Médula · axones con mielina: la señal salta de nodo en nodo hasta ≈ 120 m/s (≈ 430 km/h)", ideal: 7.1, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TME.velocidad.mielina * r, "pop", 0.12), ...clics(TME.velocidad.cifra * r, TME.velocidad.cifraDur * r, 0.05), ev((TME.velocidad.cifra + TME.velocidad.cifraDur) * r, "ding", 0.18), ev(TME.velocidad.kmh * r, "whoosh", 0.18)],
  },
  "me-reflejo": {
    id: "me-reflejo", nombre: "Médula · reflejo de retirada: la mano se aparta por un arco espinal corto, casi antes de sentir el dolor", ideal: 6.4, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TME.reflejo.toca * r, "zap", 0.16), ev(TME.reflejo.aparta * r, "whoosh", 0.2), ev((TME.reflejo.aparta + 0.2) * r, "pop", 0.14), ev(TME.reflejo.cerebro * r, "tick", 0.12), ev(TME.reflejo.dolor * r, "thud", 0.22)],
  },
  "me-lesion": {
    id: "me-lesion", nombre: "Médula · si se lesiona, cerebro y cuerpo se desconectan: cuanto más arriba, más funciones se afectan", ideal: 7.1, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TME.lesion.rotura * r + 0.2, "thud", 0.24), ev(TME.lesion.desconecta * r, "zap", 0.12), ev(TME.lesion.sube * r, "whoosh", 0.16), ev(TME.lesion.funciones * r, "tick", 0.14)],
  },
  "me-puente": {
    id: "me-puente", nombre: "Médula · 2023: un hombre paralizado vuelve a caminar con muletas gracias a un puente digital cerebro–médula (cierre)", ideal: 8.1, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TME.puente.anio * r + 0.2, "tick", 0.12), ev(TME.puente.camina * r, "pop", 0.14), ...clics(TME.puente.camina * r, 1.4 * r, 0.04), ev(TME.puente.puente * r, "zap", 0.16), ev(TME.puente.entre * r, "ding", 0.22)],
  },
  "pc0-gancho": {
    id: "pc0-gancho", nombre: "Par craneal 0 · te enseñaron 12 pares craneales, pero hay uno más: el cero (gancho)", ideal: 6.5, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TPC.gancho.doce * r, 2.0 * r, 0.04), ev(TPC.gancho.uno * r, "pop", 0.14), ev(TPC.gancho.antes * r, "tick", 0.12), ev(TPC.gancho.cero * r, "zap", 0.16), ev((TPC.gancho.cero + 0.2) * r, "ding", 0.2)],
  },
  "pc0-fritsch": {
    id: "pc0-fritsch", nombre: "Par craneal 0 · 1878: Gustav Fritsch lo describió por primera vez, no en personas sino en tiburones", ideal: 6.6, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ...clics(TPC.fritsch.anio * r + 0.2, 1.6 * r, 0.04), ev(TPC.fritsch.nombre * r, "pop", 0.12), ev(TPC.fritsch.personas * r, "thud", 0.16), ev(TPC.fritsch.tiburon * r, "whoosh", 0.14), ev((TPC.fritsch.tiburon + 0.5) * r, "ding", 0.18)],
  },
  "pc0-recorrido": {
    id: "pc0-recorrido", nombre: "Par craneal 0 · red de fibras finas sin mielina, junto al nervio olfatorio, que cruza la lámina cribosa y llega al cerebro", ideal: 7.3, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TPC.recorrido.red * r + 0.2, "pop", 0.12), ev(TPC.recorrido.mielina * r, "tick", 0.12), ev(TPC.recorrido.olfatorio * r, "pop", 0.12), ev(TPC.recorrido.placa * r, "ding", 0.16), ...clics(TPC.recorrido.cerebro * r, 1.0 * r, 0.04), ev((TPC.recorrido.cerebro + 1.0) * r, "ding", 0.18)],
  },
  "pc0-numero": {
    id: "pc0-numero", nombre: "Par craneal 0 · se llama cero porque está por delante del par I, el olfatorio (vista inferior esquemática del cerebro)", ideal: 6.5, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TPC.numero.bautizo * r, "pop", 0.14), ev(TPC.numero.ochenta * r, "tick", 0.12), ev(TPC.numero.delante * r, "whoosh", 0.14), ev(TPC.numero.olfatorio * r, "ding", 0.18)],
  },
  "pc0-gnrh": {
    id: "pc0-gnrh", nombre: "Par craneal 0 · en el embrión, neuronas con GnRH viajan de la nariz al cerebro siguiendo este nervio", ideal: 7.6, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TPC.gnrh.embrion * r + 0.2, "pop", 0.12), ev(TPC.gnrh.gnrh * r, "ding", 0.16), ev(TPC.gnrh.hormona * r, "pop", 0.12), ...clics(TPC.gnrh.viaja * r, 1.8 * r, 0.04), ev((TPC.gnrh.viaja + 1.8) * r, "ding", 0.2)],
  },
  "pc0-kallmann": {
    id: "pc0-kallmann", nombre: "Par craneal 0 · si esa ruta falla puede aparecer el síndrome de Kallmann: sin olfato y pubertad ausente o retrasada", ideal: 7.6, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TPC.kallmann.falla * r + 0.3, "thud", 0.18), ev((TPC.kallmann.falla + 0.1) * r + 0.3, "zap", 0.12), ev(TPC.kallmann.sindrome * r, "pop", 0.14), ev(TPC.kallmann.olfato * r, "thud", 0.14), ev(TPC.kallmann.pubertad * r, "tick", 0.14)],
  },
  "pc0-misterio": {
    id: "pc0-misterio", nombre: "Par craneal 0 · en adultos su función no se conoce: se propone que modula la reproducción o detecta feromonas, sin demostrar", ideal: 7.3, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TPC.misterio.adultos * r + 0.2, "pop", 0.12), ev(TPC.misterio.nose * r, "tick", 0.12), ev(TPC.misterio.repro * r, "pop", 0.12), ev(TPC.misterio.feromonas * r, "pop", 0.12), ev(TPC.misterio.nada * r, "thud", 0.2)],
  },
  "pc0-libro": {
    id: "pc0-libro", nombre: "Par craneal 0 · incluido en la nomenclatura anatómica internacional desde 1998, pero muchos libros siguen enseñando solo 12 pares (cierre)", ideal: 7.3, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TPC.libro.nomenclatura * r + 0.2, "pop", 0.12), ev(TPC.libro.anio * r, "tick", 0.12), ev(TPC.libro.libros * r, "thud", 0.16), ev((TPC.libro.libros + 1.2) * r, "ding", 0.2)],
  },
  "ol-gancho": {
    id: "ol-gancho", nombre: "Par I · la mayoría de las neuronas no se reemplaza, pero las del olfato se renuevan toda la vida (gancho)", ideal: 7.3, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOL.gancho.mayoria * r + 0.2, "pop", 0.12), ev(TOL.gancho.pero * r, "tick", 0.12), ev(TOL.gancho.par * r, "pop", 0.14), ...clics(TOL.gancho.renuevan * r, 1.4 * r, 0.04), ev((TOL.gancho.renuevan + 0.2) * r, "ding", 0.2)],
  },
  "ol-mucosa": {
    id: "ol-mucosa", nombre: "Par I · las neuronas olfatorias están en el techo de la nariz, expuestas al aire que respiras", ideal: 7.3, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOL.mucosa.techo * r + 0.2, "pop", 0.12), ev(TOL.mucosa.aire * r, "whoosh", 0.12), ev(TOL.mucosa.dano * r, "thud", 0.16), ev((TOL.mucosa.dano + 0.4) * r, "zap", 0.12)],
  },
  "ol-ciclo": {
    id: "ol-ciclo", nombre: "Par I · en ratones la mayoría vive 1–3 meses y células madre fabrican neuronas nuevas sin parar", ideal: 7.3, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOL.ciclo.ratones * r + 0.2, "pop", 0.12), ...clics(TOL.ciclo.meses * r, 1.6 * r, 0.04), ev(TOL.ciclo.madre * r, "pop", 0.14), ev(TOL.ciclo.nuevas * r, "ding", 0.18)],
  },
  "ol-receptor": {
    id: "ol-receptor", nombre: "Par I · cada neurona fabrica un solo tipo de receptor (≈ 400 funcionales en humanos) y cada olor activa varios", ideal: 8.0, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOL.receptor.uno * r + 0.2, "pop", 0.12), ...clics(TOL.receptor.cuatro * r, 1.6 * r, 0.04), ev((TOL.receptor.cuatro + 1.7) * r, "ding", 0.16), ev(TOL.receptor.olor * r, "zap", 0.14), ev((TOL.receptor.olor + 1.1) * r, "zap", 0.12)],
  },
  "ol-axones": {
    id: "ol-axones", nombre: "Par I · los axones cruzan la lámina cribosa y las neuronas nuevas deben reconectarse con el bulbo olfatorio", ideal: 6.6, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOL.axones.cruzan * r + 0.2, "pop", 0.12), ev(TOL.axones.nuevas * r, "tick", 0.12), ...clics(TOL.axones.nuevas * r + 0.2, 1.6 * r, 0.04), ev(TOL.axones.bulbo * r, "ding", 0.18)],
  },
  "ol-memoria": {
    id: "ol-memoria", nombre: "Par I · desde el bulbo las señales llegan a la amígdala y al hipocampo: un olor puede traer un recuerdo", ideal: 7.6, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOL.memoria.bulbo * r + 0.2, "pop", 0.12), ev(TOL.memoria.amigdala * r, "pop", 0.14), ev(TOL.memoria.hipocampo * r, "pop", 0.14), ev(TOL.memoria.recuerdo * r, "zap", 0.14), ev((TOL.memoria.recuerdo + 0.3) * r, "ding", 0.2)],
  },
  "ol-dano": {
    id: "ol-dano", nombre: "Par I · un golpe en la cabeza puede cortar sus fibras; en el COVID-19 el virus parece dañar sobre todo las células de soporte", ideal: 7.3, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOL.dano.golpe * r + 0.5, "thud", 0.22), ev(TOL.dano.golpe * r + 0.6, "zap", 0.14), ev(TOL.dano.covid * r, "whoosh", 0.12), ev(TOL.dano.soporte * r, "pop", 0.14), ev(TOL.dano.noneuronas * r, "ding", 0.16)],
  },
  "ol-recupera": {
    id: "ol-recupera", nombre: "Par I · muchas personas recuperan el olfato y el entrenamiento olfativo con 4 aromas ayudó en estudios pequeños (cierre)", ideal: 7.0, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOL.recupera.recuperan * r + 0.2, "pop", 0.12), ev(TOL.recupera.entrena * r, "tick", 0.12), ...[0, 1, 2, 3].map((k) => ev((TOL.recupera.cuatro + k * 0.28) * r, "pop", 0.12)), ev(TOL.recupera.estudios * r, "ding", 0.2)],
  },
  "op-gancho": {
    id: "op-gancho", nombre: "Par II · el nervio óptico no es un nervio común: es una extensión del cerebro (gancho)", ideal: 6.5, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOP.gancho.par * r + 0.2, "pop", 0.12), ev(TOP.gancho.optico * r, "pop", 0.14), ev(TOP.gancho.comun * r, "tick", 0.12), ev(TOP.gancho.extension * r, "zap", 0.14), ev((TOP.gancho.extension + 0.3) * r, "ding", 0.2)],
  },
  "op-origen": {
    id: "op-origen", nombre: "Par II · nace del diencéfalo, lo envuelven las meninges y lleva cerca de un millón de fibras desde la retina", ideal: 6.5, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOP.origen.diencefalo * r + 0.2, "pop", 0.12), ev(TOP.origen.meninges * r, "pop", 0.14), ...clics(TOP.origen.millon * r, 1.8 * r, 0.04), ev((TOP.origen.millon + 1.9) * r, "ding", 0.18)],
  },
  "op-ciego": {
    id: "op-ciego", nombre: "Par II · donde el nervio sale del ojo no hay fotorreceptores: el punto ciego que el cerebro rellena", ideal: 8.0, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOP.ciego.sale * r + 0.2, "pop", 0.12), ev(TOP.ciego.sinFoto * r, "tick", 0.14), ev(TOP.ciego.punto * r, "pop", 0.14), ev(TOP.ciego.rellena * r, "zap", 0.16), ev((TOP.ciego.rellena + 0.3) * r, "ding", 0.18)],
  },
  "op-quiasma": {
    id: "op-quiasma", nombre: "Par II · en el quiasma se cruzan las fibras nasales: lo que ves a la izquierda lo procesa el hemisferio derecho", ideal: 7.0, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOP.quiasma.quiasma * r + 0.2, "pop", 0.12), ev(TOP.quiasma.cruzan * r, "whoosh", 0.14), ...clics(TOP.quiasma.cruzan * r + 0.2, 1.4 * r, 0.04), ev(TOP.quiasma.izquierda * r, "pop", 0.14), ev(TOP.quiasma.derecho * r, "ding", 0.18)],
  },
  "op-regenera": {
    id: "op-regenera", nombre: "Par II · al ser parte del cerebro no se regenera, a diferencia del olfatorio: en el glaucoma las fibras perdidas no vuelven", ideal: 7.3, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOP.regenera.parte * r + 0.2, "pop", 0.12), ev(TOP.regenera.noRegenera * r, "thud", 0.18), ev(TOP.regenera.olfatorio * r, "pop", 0.14), ...clics(TOP.regenera.glaucoma * r, 1.6 * r, 0.04), ev((TOP.regenera.glaucoma + 1.8) * r, "thud", 0.16)],
  },
  "op-genes": {
    id: "op-genes", nombre: "Par II · 2020: tres genes reprograman las células del nervio óptico en ratones y mejoran su visión", ideal: 7.0, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOP.genes.anio * r + 0.2, "tick", 0.12), ev(TOP.genes.ratones * r, "pop", 0.12), ev(TOP.genes.tres * r, "zap", 0.14), ...clics(TOP.genes.rejuvenece * r, 1.6 * r, 0.04), ev(TOP.genes.mejora * r, "ding", 0.2)],
  },
  "op-ensayo": {
    id: "op-ensayo", nombre: "Par II · hoy un ensayo de fase 1 prueba esa idea en personas con glaucoma: primeros datos de octubre de 2026, bien tolerada", ideal: 7.3, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOP.ensayo.hoy * r + 0.2, "pop", 0.12), ev(TOP.ensayo.personas * r, "tick", 0.12), ...[0, 1, 2].map((k) => ev((TOP.ensayo.personas + 0.4 * k) * r, "pop", 0.12)), ev(TOP.ensayo.octubre * r, "pop", 0.14), ev(TOP.ensayo.tolerada * r, "ding", 0.2)],
  },
  "op-temprano": {
    id: "op-temprano", nombre: "Par II · es muy temprano: el objetivo es la seguridad, con tres personas, y aún no demuestra que devuelva la vista (cierre)", ideal: 6.6, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOP.temprano.temprano * r + 0.2, "thud", 0.16), ev(TOP.temprano.seguridad * r, "pop", 0.12), ev(TOP.temprano.tres * r, "tick", 0.12), ev(TOP.temprano.noDemuestra * r, "thud", 0.2), ev((TOP.temprano.noDemuestra + 0.8) * r, "ding", 0.18)],
  },
  "oc-gancho": {
    id: "oc-gancho", nombre: "Par III · una pupila dilatada tras un golpe en la cabeza puede ser una emergencia: el oculomotor pide ayuda (gancho)", ideal: 7.0, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOC.gancho.pupila * r + 0.2, "pop", 0.12), ev(TOC.gancho.golpe * r, "thud", 0.2), ev((TOC.gancho.golpe + 0.1) * r, "zap", 0.12), ev(TOC.gancho.emergencia * r, "zap", 0.16), ev(TOC.gancho.par * r, "ding", 0.2)],
  },
  "oc-musculos": {
    id: "oc-musculos", nombre: "Par III · mueve cuatro de los seis músculos de cada ojo y levanta el párpado", ideal: 6.1, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOC.musculos.mueve * r + 0.2, "pop", 0.12), ev(TOC.musculos.cuatro * r, "tick", 0.14), ...[0, 1, 2, 3].map((k) => ev((TOC.musculos.cuatro + 0.3 * k) * r, "pop", 0.12)), ev(TOC.musculos.parpado * r, "ding", 0.18)],
  },
  "oc-reflejo": {
    id: "oc-reflejo", nombre: "Par III · la luz en un ojo cierra las dos pupilas: el óptico avisa y el oculomotor responde", ideal: 7.3, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOC.reflejo.luz * r + 0.2, "zap", 0.14), ev(TOC.reflejo.optico * r, "pop", 0.12), ...clics(TOC.reflejo.optico * r, 1.4 * r, 0.04), ev(TOC.reflejo.oculo * r, "pop", 0.14), ev(TOC.reflejo.dos * r, "ding", 0.18)],
  },
  "oc-recorrido": {
    id: "oc-recorrido", nombre: "Par III · nace en el mesencéfalo, pasa entre dos arterias del cerebro y cruza el seno cavernoso hasta la órbita", ideal: 6.6, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOC.recorrido.nace * r + 0.2, "pop", 0.12), ev(TOC.recorrido.arterias * r, "pop", 0.14), ev(TOC.recorrido.seno * r, "whoosh", 0.12), ev(TOC.recorrido.orbita * r, "ding", 0.18)],
  },
  "oc-fibras": {
    id: "oc-fibras", nombre: "Par III · las fibras de la pupila van por la superficie del nervio y suelen ser las primeras en sufrir al comprimirlo", ideal: 7.3, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOC.fibras.superficie * r + 0.2, "pop", 0.12), ev(TOC.fibras.primeras * r, "tick", 0.14), ev(TOC.fibras.comprime * r, "thud", 0.2), ev((TOC.fibras.comprime + 0.4) * r, "zap", 0.12)],
  },
  "oc-herniacion": {
    id: "oc-herniacion", nombre: "Par III · si sube la presión dentro del cráneo, el lóbulo temporal puede aplastar el nervio y dilatar la pupila", ideal: 6.6, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOC.herniacion.presion * r + 0.2, "pop", 0.12), ev(TOC.herniacion.lobulo * r, "whoosh", 0.12), ev(TOC.herniacion.aplasta * r, "thud", 0.22), ev(TOC.herniacion.dilata * r, "zap", 0.16)],
  },
  "oc-aneurisma": {
    id: "oc-aneurisma", nombre: "Par III · un aneurisma cercano también puede comprimirlo: párpado caído, ojo hacia abajo y afuera y pupila dilatada", ideal: 7.7, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOC.aneurisma.aneurisma * r + 0.2, "pop", 0.12), ev(TOC.aneurisma.parpado * r, "thud", 0.16), ev(TOC.aneurisma.ojo * r, "whoosh", 0.12), ev(TOC.aneurisma.pupila * r, "zap", 0.16)],
  },
  "oc-urgencia": {
    id: "oc-urgencia", nombre: "Par III · un párpado caído de golpe, con visión doble o dolor de cabeza intenso, merece atención médica urgente (cierre)", ideal: 6.1, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TOC.urgencia.parpado * r + 0.2, "thud", 0.16), ev(TOC.urgencia.doble * r, "tick", 0.14), ev(TOC.urgencia.dolor * r, "tick", 0.14), ev(TOC.urgencia.urgente * r, "zap", 0.16), ev((TOC.urgencia.urgente + 0.3) * r, "ding", 0.2)],
  },
  "astro-memoria": {
    id: "astro-memoria", nombre: "Astrocitos · en ratones, reactivarlos estimuló el recuerdo", ideal: 4.15, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TAS.memoria.activa * r, "zap", 0.12), ev(TAS.memoria.enlaces * r, "radar", 0.1), ev(TAS.memoria.recuerdo * r, "golpe", 0.18), ev((TAS.memoria.recuerdo + 0.15) * r, "ding", 0.18)],
  },
};

export const IDS_PIEZA = Object.keys(PIEZAS);
export const piezaPorId = (id: unknown): DefPieza | null => (typeof id === "string" && Object.prototype.hasOwnProperty.call(PIEZAS, id) ? PIEZAS[id] : null);
