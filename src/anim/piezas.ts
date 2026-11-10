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

/** Datos del video «Tus cables se enredan solos» (SINAPSIS · física cotidiana). Fuente: Raymer D. M. y Smith D. E., «Spontaneous knotting of an agitated string», PNAS 2007;104(42):16432–16437. */
export const CAB = {
  anio: 2007,
  /** una caja con una cuerda, girada a 1 vuelta por segundo durante 10 segundos */
  tumbleSeg: 10, rps: 1,
  /** por debajo de 0,46 m (≈ 1,5 ft) no se formaron nudos; entre 0,46 y ≈ 1,5 m la probabilidad sube con rapidez y luego se estanca por debajo del 100 % */
  umbralCm: 46, mesetaCm: 150,
  /** casi todos los nudos eran primos, con 3 a 11 cruces mínimos; la probabilidad relativa decae de forma exponencial con el número de cruces */
  crucesMin: 3, crucesMax: 11,
  /** una cuerda más flexible se anuda más que una rígida */
  masFlexibleMasNudos: true,
} as const;

/** Tiempos del video «Tus cables se enredan solos» (segundos a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TCAB = {
  gancho: { coil: 0.2, nudo: 2.0, nudoDur: 2.2, chip: 3.6 },
  caja: { caja: 0.2, gira: 0.9, giraDur: 5.0, cruces: 1.6, chip: 5.9 },
  largo: { ejes: 0.2, curva: 0.9, curvaDur: 3.4, umbral: 1.6, meseta: 4.4, chip: 5.8 },
  flexible: { cajas: 0.2, gira: 0.8, giraDur: 3.6, compara: 4.0, chip: 4.4 },
  nudos: { papel: 0.2, trebol: 0.8, quinto: 1.9, barras: 3.1, chip: 5.0 },
  receta: { lista: 0.2, i1: 0.8, i2: 1.8, i3: 2.8, igual: 3.9, chip: 5.2 },
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

/** Datos del video «Así se construye una piscina a 35 m» (IMNOBA · ingeniería extrema; Sky Pool de Embassy Gardens, Londres). Reusan `PIS`; fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-piscina-35m.md. */
export const SKY = {
  alturaM: PIS.alturaM, longitudM: PIS.longitudM, vanoM: PIS.vanoM, profundidadM: PIS.profundidadM, aguaTon: PIS.aguaTon,
  /** espesores (cm): paredes ≈ 18 y fondo ≈ 36 (356 mm); una regla escolar mide 30 */
  paredCm: 18, fondoCm: 36, reglaCm: 30,
  /** estructura completa de acrílico ≈ 50 t (fuentes: 50 a 55 t) y margen de colocación ≈ 30 cm durante el izado (prensa del izado) */
  estructuraTon: 50, margenCm: 30,
  /** dilatación de 25 m de acrílico con +20 °C (cálculo propio: α·L·ΔT) */
  dT: 20,
} as const;

/** Tiempos de «Así se construye una piscina a 35 m» (s a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TSK = {
  gancho: { torres: 0.0, piscina: 0.6, agua: 1.1, aguaDur: 2.3, cota: 3.0, nada: 3.9, chip: 5.0 },
  espesor: { seccion: 0.2, agua: 0.6, aguaDur: 1.0, presion: 1.6, presionDur: 1.2, kpa: 2.9, pared: 3.3, fondo: 3.9, barras: 4.3, chip: 6.3 },
  union: { bloques: 0.15, cierra: 0.9, cierraDur: 0.6, junta: 1.6, borra: 2.4, viga: 2.4, peso: 3.0, pesoDur: 1.0, chip: 4.2 },
  izado: { grua: 0.15, eleva: 0.7, elevaDur: 2.9, llega: 3.6, margen: 3.9, asienta: 4.9, chip: 5.1 },
  apoyos: { torres: 0.15, vaiven: 0.6, apoyo: 1.2, desliza: 2.1, gira: 4.2, dilata: 5.6, chip: 6.2 },
  llenado: { piscina: 0.15, grifo: 0.8, sube: 1.0, subeDur: 2.6, ding: 3.6, nada: 3.7, pregunta: 4.7 },
} as const;

/** Datos del video «La bola de 660 toneladas» (IMNOBA · ingeniería extrema; amortiguador de masa sintonizado del Taipei 101, Taiwán). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-bola-660.md. */
export const TMD = {
  masaTon: 660, discos: 41, grosorCm: 12.5, diametroM: 5.5,
  /** colgada del piso 92 hasta el 87 */
  pisoAlto: 92, pisoBajo: 87,
  /** tifón Soudelor (8-ago-2015): la bola se movió cerca de 1 m; «hasta 40 %» de reducción es la cifra del edificio (un máximo) */
  tifonAnio: 2015, tifonCm: 100, reduccionMaxPct: 40,
} as const;

/** Tiempos de «La bola de 660 toneladas» (s a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TTM = {
  gancho: { torre: 0.0, torreDur: 1.5, lupa: 1.7, cuenta: 2.2, cuentaDur: 2.0, para: 4.2 },
  viento: { viento: 0.4, sway: 0.8, bola: 2.8, flechas: 3.4, chip: 4.6 },
  discos: { ini: 0.6, paso: 0.11, listo: 5.2, chip: 5.45 },
  bola: { ensDur: 1.6, inset: 0.7, cota: 3.0, peso: 3.9, chip: 4.8 },
  cuelga: { muros: 0.1, cables: 0.8, pisos: 2.0, pisosDur: 1.9, chip: 4.2 },
  tifon: { espiral: 0.2, balanceo: 0.8, cota: 3.0, barras: 4.5, chip: 5.8 },
} as const;

/** Datos del video «El laboratorio bacteriano bajo tu terreno» (IMNOBA · sistema séptico con lecho de grava). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-laboratorio-septico.md. */
export const SEP = {
  /** etapas: 1 cámaras (decantación + bacterias anaerobias), 2 lecho de grava, 3 el suelo */
  etapas: 3, camaras: 2,
  /** frecuencia habitual de vaciado de lodos para una familia (años), según resúmenes de la EPA: depende del tamaño del tanque y del uso */
  lodosAniosMin: 3, lodosAniosMax: 5,
} as const;

/** Tiempos de «El laboratorio bacteriano bajo tu terreno» (s a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TSE = {
  gancho: { cartel: 0.1, lab: 2.2, bact: 3.8 },
  pozo: { huele: 0.8, fuga: 3.8, fugaDur: 4.0, napa: 6.4 },
  idea: { muros: 0.5, murosDur: 3.0, e1: 2.0, e2: 3.0, e3: 4.0 },
  decanta: { capas: 1.2, capasDur: 4.3, chip1: 2.0, chip2: 3.8, chip3: 5.6 },
  bacterias: { bact: 0.6, bactDur: 1.6, gas: 4.4, chip: 5.8 },
  camara2: { paso: 0.8, pasoDur: 1.7, chip: 3.6 },
  olores: { trampa: 0.3, vent: 2.4, chip1: 1.4, chip2: 3.4 },
  grava: { grava: 0.5, gravaDur: 2.3, filtra: 2.8, chip: 3.8 },
  suelo: { baja: 0.4, napa: 3.2, napaDur: 1.4, pozo: 5.0 },
  mant: { camion: 0.3, camionDur: 1.7, succion: 2.3, prohibido: 5.4 },
  lote: { letrero: 0.3, c1: 3.4, c2: 4.4, c3: 5.4 },
} as const;

/** Datos del video «Los 3 códigos escondidos en tu vehículo» (IMNOBA · vehículos). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-codigos-vehiculo.md. */
export const AUT = {
  /** ejemplo de código DOT: «3624» = semana 36 de 2024 (los 4 últimos dígitos: semana y año; llantas fabricadas desde 2000) */
  dotEjemplo: "3624", semana: 36, anio: 2024,
  /** muchos fabricantes recomiendan cambiar las llantas entre 6 y 10 años después de su fabricación, sin importar el dibujo */
  llantaAniosMin: 6, llantaAniosMax: 10,
  /** el 10.º carácter del VIN es el año modelo (en la mayoría de vehículos) */
  vinPosAnio: 10,
} as const;
/** Año modelo que indica el carácter del VIN (posición 10) en el ciclo 2010–2039; null si no es un carácter válido (no se usan I, O, Q, U, Z ni 0). El mismo carácter vale también 30 años antes (S = 1995 o 2025). */
export function vinAnioModelo(c: string): number | null {
  const letras = "ABCDEFGHJKLMNPRSTVWXY";
  const u = c.toUpperCase();
  const i = letras.indexOf(u);
  if (i >= 0) return 2010 + i;
  if (/^[1-9]$/.test(u)) return 2030 + Number(u);
  return null;
}
/** Tiempos de «Los 3 códigos escondidos en tu vehículo» (s a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TAT = {
  gancho: { medidor: 0.2, aguja: 1.6, flecha: 1.6, dos: 4.4 },
  tanque: { auto: 0.3, flecha: 0.9, puerta: 1.8, manguera: 2.4, mangueraDur: 1.2, cambia: 4.0, puerta2: 4.8, manguera2: 5.2, chip: 2.2, chip2: 5.4 },
  llanta: { llanta: 0.2, zoom: 1.2, zoomDur: 1.0, luz: 2.4, chip1: 2.8, chip2: 3.4, calendario: 3.9 },
  edad: { env: 0.4, envDur: 3.6, seis: 2.0, diez: 3.8, chip: 4.4 },
  vin: { placa: 0.2, placaDur: 1.8, resalta: 3.0, tabla: 4.2, chip: 5.6 },
  repaso: { parabrisas: 0.3, tarjeta: 2.4, c1: 3.8, c2: 4.3, c3: 4.8 },
} as const;

/** Datos del video «El piso que no existe» (IMNOBA · pisos 13 y 4). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-piso-que-no-existe.md. */
export const FLO = {
  /** conteo de City Realty (citado por 99 % Invisible): de 629 edificios de Manhattan con 13 o más pisos, solo 55 rotulan un piso 13 */
  manhattan: { conTrece: 55, total: 629 },
  /** estudio de Vancouver (citado por 99 % Invisible): direcciones con 8 ≈ +2,5 % y con 4 ≈ −2,2 % */
  vancouver: { ocho: 2.5, cuatro: -2.2 },
  /** tesis de la Universidad de Hong Kong: unidades en pisos con 4 ≈ −4,2 % frente a unidades similares */
  hongKong: { cuatro: -4.2 },
} as const;
/** Rótulo del botón del piso físico `i` (1 = planta baja) en un edificio que se salta los números de `saltados`. */
export function rotuloPiso(i: number, saltados: number[] = [13]): number {
  let n = i;
  for (const s of [...saltados].sort((a, b) => a - b)) if (n >= s) n++;
  return n;
}
/** Tiempos de «El piso que no existe» (s a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TFL = {
  gancho: { panel: 0.2, doce: 1.2, catorce: 2.2, fantasma: 2.8, pregunta: 3.9 },
  torre: { torre: 0.3, sube: 0.4, subeDur: 2.0, trece: 2.7, rotulos: 3.4, chip: 4.0 },
  conteo: { cuadros: 0.2, cuadrosDur: 1.4, dorados: 2.0, doradosDur: 1.4, chip: 4.6 },
  asia: { panel: 0.2, hueco: 1.4, muerte: 2.6, saltan: 4.8 },
  precio: { ocho: 0.4, cuatro: 2.2, barra1: 4.2, barra2: 5.4, barra3: 6.6, chip: 8.0 },
  consejo: { cuenta: 0.4, cuentaDur: 3.2, rotulos: 3.8, plano: 4.9, chip: 6.0 },
} as const;

/** Datos del video «La casa que vale menos cada año» (IMNOBA · Japón). Fuentes y precauciones en ejemplos/animacion-viral/guion-tecnico-casas-japon.md. */
export const JAP = {
  /** edad promedio de las casas DEMOLIDAS (dato de 2008 del ministerio de transporte, vía resúmenes): Japón 32,1 · EE. UU. 66,6 · Reino Unido 80,6. No es la vida física de las casas. */
  demolida: { japon: 32.1, eeuu: 66.6, reinoUnido: 80.6 },
  /** vida útil legal de una casa de madera para efectos tributarios en Japón (años) */
  depreciacionAnios: 22,
  /** Encuesta de Vivienda y Suelo 2023: ≈ 9 millones de viviendas vacías, 13,8 % de 65,05 millones; solo ≈ 3,6 % están a la venta */
  vacias: { millones: 9, pct: 13.8, total: 65.05, enVentaPct: 3.6 },
} as const;
/** Valor contable (0–1) de una construcción con depreciación lineal a `vida` años; el terreno no se deprecia. */
export const valorContable = (anios: number, vida: number = JAP.depreciacionAnios): number => Math.max(0, 1 - anios / vida);
/** Tiempos de «La casa que vale menos cada año» (s a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TJP = {
  gancho: { casa: 0.2, anios: 1.0, aniosDur: 3.6, tierra: 4.6, chip: 5.0 },
  grafico: { ejes: 0.2, casa: 1.0, casaDur: 2.8, tierra: 1.0, marca22: 4.8, chip: 6.0 },
  demole: { casa: 0.2, golpe: 2.0, caida: 2.3, barra1: 4.0, barra2: 5.0, barra3: 6.0, chip: 7.0 },
  porque: { viejas: 0.3, flecha: 1.6, nueva: 2.2, onda: 2.8, chip1: 3.4, chip2: 4.8 },
  vacias: { grid: 0.2, gridDur: 1.6, vacias: 2.2, vaciasDur: 2.0, dato: 3.2, chip: 5.4 },
  leccion: { casa: 0.3, parte: 1.8, tarjeta: 3.2, filas: 4.0, chip: 5.6 },
} as const;

/** Datos del video «El viaje de la luz» (IMNOBA · centrales eléctricas, POV). Sin cifras de producción: valores típicos y física básica; precauciones en ejemplos/animacion-viral/guion-tecnico-viaje-de-la-luz.md. */
export const CEN = {
  /** frecuencia de la red y tensión residencial típicas en Colombia (sin verificar en esta sesión: la búsqueda web no estaba disponible) */
  hz: 60, voltiosCasa: 120,
  /** la energía puede venir de quemar combustible o del agua que cae; ambas mueven una turbina */
  fuentes: ["combustible", "agua"],
} as const;
/** Frecuencia (Hz) de la red que muestra el medidor: oscila muy poco alrededor de 60 cuando producción y consumo se igualan; `desbalance` (−1…1) la separa. */
export const frecuenciaRed = (desbalance: number, t = 0): number => CEN.hz + 0.35 * desbalance + 0.04 * Math.sin(t * 7);
/** Tiempos de «El viaje de la luz» (s a ritmo normal), compartidos entre el dibujo y el sonido. */
export const TCE = {
  gancho: { interruptor: 0.2, pulsa: 1.0, luz: 1.25, zoom: 2.7, zoomDur: 0.8, tunel: 3.5, chip: 4.2 },
  fuente: { fuego: 0.2, agua: 0.9, paquete: 2.4, chip1: 1.8, chip2: 3.2, entra: 4.8 },
  turbina: { turbina: 0.2, giro: 0.9, chip: 3.4, rapido: 4.8 },
  generador: { gen: 0.2, iman: 1.0, bobinas: 2.4, onda: 3.4, chip: 5.0 },
  transmision: { trafo: 0.2, sube: 1.4, chip: 2.4, torres: 3.4, vuelo: 3.4, chip2: 5.6 },
  barrio: { poste: 0.2, baja: 1.2, chip: 2.0, casa: 3.4, medidor: 4.8, chip2: 5.4 },
  balance: { barras: 0.3, casas: 1.8, hz: 3.4, chip: 5.0, chip2: 5.9 },
  enchufe: { enchufe: 0.2, llega: 1.0, mete: 1.8, luz: 2.1, chip: 3.4 },
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
  /* ───────────── «Tus cables se enredan solos» (SINAPSIS · física cotidiana) ───────────── */
  "cab-gancho": {
    id: "cab-gancho", nombre: "Cables · el cable bien enrollado se desordena hasta ser un nudo (gancho)", ideal: 4.55, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ev(TCAB.gancho.coil * r + 0.1, "pop", 0.1), ...[0, 1, 2, 3, 4].map((i) => ev((TCAB.gancho.nudo + i * 0.4) * r, "clic", 0.08)), ev((TCAB.gancho.nudo + TCAB.gancho.nudoDur) * r, "golpe", 0.2), ev(TCAB.gancho.chip * r, "ding", 0.12)],
  },
  "cab-caja": {
    id: "cab-caja", nombre: "Cables · una cuerda en una caja que gira a 1 vuelta por segundo durante 10 s (simulación 2D ilustrativa)", ideal: 6.35, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TCAB.caja.caja * r + 0.1, "pop", 0.1), ...clics(TCAB.caja.gira * r, TCAB.caja.giraDur * r, 0.05), ev(TCAB.caja.cruces * r, "tick", 0.1), ev((TCAB.caja.gira + TCAB.caja.giraDur) * r, "ding", 0.16), ev(TCAB.caja.chip * r, "pop", 0.1)],
  },
  "cab-largo": {
    id: "cab-largo", nombre: "Cables · curva esquemática: sin nudos por debajo de 46 cm, sube hasta ≈ 1,5 m y se estanca (papel)", ideal: 6.7, fondo: "light", entra: "corte",
    sfx: (_d, r) => [ev(0.02, "clic", 0.14), ev(TCAB.largo.ejes * r + 0.1, "tick", 0.1), ...clics(TCAB.largo.curva * r, TCAB.largo.curvaDur * r, 0.05), ev(TCAB.largo.umbral * r, "pop", 0.12), ev(TCAB.largo.meseta * r, "ding", 0.14), ev(TCAB.largo.chip * r, "clic", 0.1)],
  },
  "cab-flexible": {
    id: "cab-flexible", nombre: "Cables · dos cajas: la cuerda rígida y la flexible (simulación 2D ilustrativa)", ideal: 4.75, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TCAB.flexible.cajas * r + 0.1, "pop", 0.1), ...clics(TCAB.flexible.gira * r, TCAB.flexible.giraDur * r, 0.04), ev(TCAB.flexible.compara * r, "zap", 0.12), ev(TCAB.flexible.chip * r, "ding", 0.12)],
  },
  "cab-nudos": {
    id: "cab-nudos", nombre: "Cables · nudos de 3 y 5 cruces dibujados con arriba y abajo, y la probabilidad que cae con los cruces (papel)", ideal: 5.85, fondo: "light", entra: "corte",
    sfx: (_d, r) => [ev(0.02, "clic", 0.14), ev(TCAB.nudos.trebol * r, "pop", 0.12), ev(TCAB.nudos.quinto * r, "pop", 0.12), ...[0, 1, 2, 3, 4].map((i) => ev((TCAB.nudos.barras + i * 0.2) * r, "tick", 0.1)), ev(TCAB.nudos.chip * r, "ding", 0.12)],
  },
  "cab-receta": {
    id: "cab-receta", nombre: "Cables · la receta del nudo: largo, flexible y agitado (cierre)", ideal: 6.05, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TCAB.receta.i1 * r, "pop", 0.12), ev(TCAB.receta.i2 * r, "pop", 0.12), ev(TCAB.receta.i3 * r, "pop", 0.12), ev(TCAB.receta.igual * r, "golpe", 0.18), ev((TCAB.receta.igual + 0.1) * r, "ding", 0.16), ev(TCAB.receta.chip * r, "tick", 0.1)],
  },
  "astro-memoria": {
    id: "astro-memoria", nombre: "Astrocitos · en ratones, reactivarlos estimuló el recuerdo", ideal: 4.15, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TAS.memoria.activa * r, "zap", 0.12), ev(TAS.memoria.enlaces * r, "radar", 0.1), ev(TAS.memoria.recuerdo * r, "golpe", 0.18), ev((TAS.memoria.recuerdo + 0.15) * r, "ding", 0.18)],
  },
  /* ───────────── «Así se construye una piscina a 35 m» (IMNOBA · ingeniería extrema · figuras realistas) ───────────── */
  "sky-gancho": {
    id: "sky-gancho", nombre: "Piscina a 35 m · 150 t de agua sin nada debajo (gancho)", ideal: 5.75, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.12), ev(TSK.gancho.torres * r + 0.1, "thud", 0.1), ev(TSK.gancho.piscina * r, "golpe", 0.12), ev(TSK.gancho.agua * r, "gota", 0.14), ...clics(TSK.gancho.agua * r, TSK.gancho.aguaDur * r * 0.9, 0.04), ev(TSK.gancho.cota * r, "tick", 0.1), ev(TSK.gancho.nada * r, "radar", 0.1), ev(TSK.gancho.chip * r, "ding", 0.14)],
  },
  "sky-espesor": {
    id: "sky-espesor", nombre: "Piscina a 35 m · paso 1: el acrílico grueso (fondo 36 cm) y la presión del agua", ideal: 6.65, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TSK.espesor.agua * r, "gota", 0.12), ...clics(TSK.espesor.presion * r, TSK.espesor.presionDur * r * 0.8, 0.04), ev(TSK.espesor.kpa * r, "zap", 0.12), ev(TSK.espesor.pared * r, "pop", 0.1), ev(TSK.espesor.fondo * r, "thud", 0.16), ev(TSK.espesor.barras * r, "tick", 0.1), ev(TSK.espesor.chip * r, "ding", 0.14)],
  },
  "sky-union": {
    id: "sky-union", nombre: "Piscina a 35 m · paso 2: secciones unidas con juntas adhesivas transparentes (≈ 50 t)", ideal: 4.55, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TSK.union.cierra * r + TSK.union.cierraDur * r * 0.8, "thud", 0.2), ev(TSK.union.junta * r, "gota", 0.12), ev(TSK.union.borra * r, "ding", 0.1), ev(TSK.union.viga * r, "pop", 0.1), ...clics(TSK.union.peso * r, TSK.union.pesoDur * r * 0.8, 0.04), ev(TSK.union.chip * r, "tick", 0.1)],
  },
  "sky-izado": {
    id: "sky-izado", nombre: "Piscina a 35 m · paso 3: la grúa sube la estructura con ≈ 30 cm de margen", ideal: 5.55, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TSK.izado.grua * r, "thud", 0.12), ev(TSK.izado.eleva * r, "whoosh", 0.12), ...clics(TSK.izado.eleva * r, TSK.izado.elevaDur * r * 0.85, 0.04), ev(TSK.izado.llega * r, "radar", 0.1), ev(TSK.izado.margen * r, "pop", 0.12), ev(TSK.izado.asienta * r, "golpe", 0.22), ev(TSK.izado.asienta * r + 0.05, "thud", 0.18), ev(TSK.izado.chip * r, "ding", 0.14)],
  },
  "sky-apoyos": {
    id: "sky-apoyos", nombre: "Piscina a 35 m · paso 4: apoyos que deslizan y giran (ilustración)", ideal: 6.65, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "estatica", 0.1), ev(TSK.apoyos.vaiven * r, "whoosh", 0.14), ev(TSK.apoyos.apoyo * r, "pop", 0.12), ev(TSK.apoyos.desliza * r, "zap", 0.1), ev(TSK.apoyos.desliza * r + 0.8, "zap", 0.08), ev(TSK.apoyos.gira * r, "radar", 0.1), ev(TSK.apoyos.dilata * r, "tick", 0.12), ev(TSK.apoyos.chip * r, "ding", 0.14)],
  },
  "sky-llenado": {
    id: "sky-llenado", nombre: "Piscina a 35 m · se llena de 0 a 150 t y alguien nada (cierre)", ideal: 5.5, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "whoosh", 0.1), ev(TSK.llenado.piscina * r, "thud", 0.1), ev(TSK.llenado.grifo * r, "gota", 0.14), ...clics(TSK.llenado.sube * r, TSK.llenado.subeDur * r * 0.9, 0.04), ev(TSK.llenado.ding * r, "ding", 0.2), ev(TSK.llenado.nada * r, "gota", 0.14), ev(TSK.llenado.pregunta * r, "pop", 0.1)],
  },
  /* ───────────── «La bola de 660 toneladas» (IMNOBA · amortiguador del Taipei 101 · figuras geométricas) ───────────── */
  "tmd-gancho": {
    id: "tmd-gancho", nombre: "Bola de 660 t · el rascacielos se arma con formas y dentro cuelga una bola dorada (gancho)", ideal: 5.75, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "golpe", 0.2), ev(TTM.gancho.lupa * r, "zap", 0.14), ev(TTM.gancho.cuenta * r, "pop", 0.12), ev(TTM.gancho.para * r, "radar", 0.14)],
  },
  "tmd-viento": {
    id: "tmd-viento", nombre: "Bola de 660 t · el viento mece el edificio y la bola se mueve al revés", ideal: 5.65, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.1, "estatica", 0.1), ev(TTM.viento.sway * r, "whoosh", 0.14), ev(TTM.viento.bola * r, "thud", 0.16), ev(TTM.viento.flechas * r, "pop", 0.12), ev(TTM.viento.chip * r, "ding", 0.12)],
  },
  "tmd-discos": {
    id: "tmd-discos", nombre: "Bola de 660 t · 41 discos de acero soldados plancha por plancha", ideal: 6.55, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TTM.discos.ini * r, "thud", 0.16), ...[1, 2, 3, 4, 5, 6, 7].map((i) => ev((TTM.discos.ini + i * 5 * TTM.discos.paso) * r, i % 2 ? "tick" : "gota", 0.1)), ev(TTM.discos.listo * r, "ding", 0.2), ev(TTM.discos.chip * r, "pop", 0.1)],
  },
  "tmd-bola": {
    id: "tmd-bola", nombre: "Bola de 660 t · cada disco 12,5 cm; juntos una esfera de 5,5 m", ideal: 5.75, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(0.05, "gota", 0.14), ev(TTM.bola.peso * r, "tick", 0.1), ev(TTM.bola.cota * r, "pop", 0.12), ev(TTM.bola.inset * r, "zap", 0.1), ev(TTM.bola.chip * r, "ding", 0.14)],
  },
  "tmd-cuelga": {
    id: "tmd-cuelga", nombre: "Bola de 660 t · cuelga de cables de acero entre los pisos 87 y 92", ideal: 5.35, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TTM.cuelga.muros * r, "pop", 0.1), ev(TTM.cuelga.cables * r, "thud", 0.14), ...[0, 1, 2, 3, 4, 5].map((i) => ev((TTM.cuelga.pisos + (i * TTM.cuelga.pisosDur) / 6) * r, "tick", 0.09)), ev(TTM.cuelga.chip * r, "ding", 0.14)],
  },
  "tmd-tifon": {
    id: "tmd-tifon", nombre: "Bola de 660 t · tifón Soudelor 2015: la bola se movió ≈ 1 m y frenó el vaivén (cierre)", ideal: 6.65, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TTM.tifon.espiral * r, "whoosh", 0.14), ev(TTM.tifon.balanceo * r, "golpe", 0.16), ev(TTM.tifon.cota * r, "zap", 0.12), ev(TTM.tifon.barras * r, "pop", 0.12), ev(TTM.tifon.chip * r, "ding", 0.16)],
  },
  /* ───────────── «El laboratorio bacteriano bajo tu terreno» (IMNOBA · sistema séptico · corte geométrico) ───────────── */
  "sep-gancho": {
    id: "sep-gancho", nombre: "Laboratorio séptico · bajo un terreno aislado hay un laboratorio de bacterias (gancho)", ideal: 5.15, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "estatica", 0.14), ev(0.6, "whoosh", 0.12), ev(TSE.gancho.lab * r, "zap", 0.14), ev(TSE.gancho.bact * r, "pop", 0.12)],
  },
  "sep-pozo": {
    id: "sep-pozo", nombre: "Laboratorio séptico · el pozo cavado sin más: se filtra, huele y llega a la napa", ideal: 8.55, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(0.05, "gota", 0.14), ev(TSE.pozo.huele * r, "estatica", 0.1), ev(TSE.pozo.fuga * r, "thud", 0.14), ev(TSE.pozo.napa * r, "radar", 0.14)],
  },
  "sep-idea": {
    id: "sep-idea", nombre: "Laboratorio séptico · convertir el pozo en una planta de tratamiento con tres etapas", ideal: 5.45, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(TSE.idea.muros * r, "thud", 0.16), ev(TSE.idea.e1 * r, "pop", 0.12), ev(TSE.idea.e2 * r, "pop", 0.12), ev(TSE.idea.e3 * r, "ding", 0.14)],
  },
  "sep-decanta": {
    id: "sep-decanta", nombre: "Laboratorio séptico · cámara de decantación: lo pesado se hunde, la grasa flota", ideal: 7.85, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TSE.decanta.capas * r, "whoosh", 0.1), ev(TSE.decanta.chip1 * r, "gota", 0.12), ev(TSE.decanta.chip2 * r, "pop", 0.1), ev(TSE.decanta.chip3 * r, "ding", 0.12)],
  },
  "sep-bacterias": {
    id: "sep-bacterias", nombre: "Laboratorio séptico · bacterias anaerobias: se comen parte de los sólidos y sueltan gas", ideal: 7.45, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(TSE.bacterias.bact * r, "pop", 0.14), ev(TSE.bacterias.bact * r + 0.5, "tick", 0.1), ev(TSE.bacterias.gas * r, "zap", 0.1), ev(TSE.bacterias.chip * r, "ding", 0.12)],
  },
  "sep-camara2": {
    id: "sep-camara2", nombre: "Laboratorio séptico · segunda cámara: se asienta el resto de las partículas", ideal: 5.45, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TSE.camara2.paso * r, "whoosh", 0.12), ev(TSE.camara2.paso * r + 0.9, "gota", 0.1), ev(TSE.camara2.chip * r, "pop", 0.12)],
  },
  "sep-olores": {
    id: "sep-olores", nombre: "Laboratorio séptico · trampa de agua y ventilación: sin olores", ideal: 5.45, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TSE.olores.trampa * r, "gota", 0.14), ev(TSE.olores.chip1 * r, "tick", 0.1), ev(TSE.olores.vent * r, "radar", 0.12), ev(TSE.olores.chip2 * r, "ding", 0.14)],
  },
  "sep-grava": {
    id: "sep-grava", nombre: "Laboratorio séptico · lecho de grava: otras bacterias siguen limpiando el agua", ideal: 5.45, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TSE.grava.grava * r, "thud", 0.14), ev(TSE.grava.filtra * r, "gota", 0.12), ev(TSE.grava.chip * r, "pop", 0.12)],
  },
  "sep-suelo": {
    id: "sep-suelo", nombre: "Laboratorio séptico · la tierra termina el trabajo y el agua llega a la napa mucho más limpia", ideal: 6.15, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TSE.suelo.baja * r, "whoosh", 0.1), ev(TSE.suelo.napa * r, "radar", 0.14), ev(TSE.suelo.pozo * r, "ding", 0.16)],
  },
  "sep-mant": {
    id: "sep-mant", nombre: "Laboratorio séptico · no es magia: vaciar los lodos cada 3 a 5 años y no echar cloro ni aceite", ideal: 7.45, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TSE.mant.camion * r, "thud", 0.16), ev(TSE.mant.succion * r, "estatica", 0.1), ev(TSE.mant.prohibido * r, "golpe", 0.18)],
  },
  "sep-lote": {
    id: "sep-lote", nombre: "Laboratorio séptico · si compras un terreno sin alcantarillado, pregunta por su sistema (cierre)", ideal: 7.15, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(TSE.lote.letrero * r, "pop", 0.14), ev(TSE.lote.c1 * r, "tick", 0.1), ev(TSE.lote.c2 * r, "tick", 0.1), ev(TSE.lote.c3 * r, "ding", 0.16)],
  },
  /* ───────────── «Los 3 códigos escondidos en tu vehículo» (IMNOBA · vehículos · figuras realistas) ───────────── */
  "aut-gancho": {
    id: "aut-gancho", nombre: "Códigos del vehículo · la flechita del medidor de gasolina no es de adorno (gancho)", ideal: 5.95, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "golpe", 0.2), ev(TAT.gancho.aguja * r, "zap", 0.14), ev(TAT.gancho.flecha * r + 0.3, "ding", 0.18), ev(TAT.gancho.dos * r, "pop", 0.12)],
  },
  "aut-tanque": {
    id: "aut-tanque", nombre: "Códigos del vehículo · la flecha indica el lado de la tapa del tanque (izquierda o derecha)", ideal: 6.45, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TAT.tanque.auto * r, "whoosh", 0.12), ev(TAT.tanque.puerta * r, "pop", 0.14), ev(TAT.tanque.manguera * r + 0.9, "thud", 0.16), ev(TAT.tanque.cambia * r, "tick", 0.12), ev(TAT.tanque.manguera2 * r + 0.9, "gota", 0.14)],
  },
  "aut-llanta": {
    id: "aut-llanta", nombre: "Códigos del vehículo · el código DOT de la llanta: semana y año de fabricación", ideal: 5.65, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TAT.llanta.llanta * r, "thud", 0.14), ev(TAT.llanta.zoom * r, "whoosh", 0.14), ev(TAT.llanta.luz * r, "zap", 0.12), ev(TAT.llanta.calendario * r, "tick", 0.12), ev(TAT.llanta.chip2 * r, "ding", 0.14)],
  },
  "aut-edad": {
    id: "aut-edad", nombre: "Códigos del vehículo · las llantas vencen: muchos fabricantes recomiendan cambiarlas entre 6 y 10 años", ideal: 4.85, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TAT.edad.env * r, "estatica", 0.1), ev(TAT.edad.seis * r, "radar", 0.12), ev(TAT.edad.diez * r, "golpe", 0.16), ev(TAT.edad.chip * r, "ding", 0.12)],
  },
  "aut-vin": {
    id: "aut-vin", nombre: "Códigos del vehículo · el VIN: su décimo carácter es el año modelo (la T = 2026)", ideal: 6.45, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(TAT.vin.placa * r, "whoosh", 0.1), ev(TAT.vin.resalta * r, "zap", 0.14), ev(TAT.vin.resalta * r + 0.15, "ding", 0.18), ev(TAT.vin.tabla * r, "pop", 0.12), ev(TAT.vin.chip * r, "tick", 0.1)],
  },
  "aut-repaso": {
    id: "aut-repaso", nombre: "Códigos del vehículo · dónde mirar el VIN y repaso de los tres códigos (cierre)", ideal: 5.45, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TAT.repaso.parabrisas * r, "radar", 0.12), ev(TAT.repaso.tarjeta * r, "thud", 0.14), ev(TAT.repaso.c1 * r, "pop", 0.12), ev(TAT.repaso.c2 * r, "pop", 0.12), ev(TAT.repaso.c3 * r, "ding", 0.16)],
  },
  /* ───────────── «El piso que no existe» (IMNOBA · pisos 13 y 4 · figuras realistas) ───────────── */
  "flo-gancho": {
    id: "flo-gancho", nombre: "Pisos · el ascensor salta del 12 al 14: ¿dónde está el piso 13? (gancho)", ideal: 5.05, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "golpe", 0.14), ev(TFL.gancho.panel * r, "tick", 0.12), ev(TFL.gancho.doce * r, "pop", 0.14), ev(TFL.gancho.catorce * r, "ding", 0.2), ev(TFL.gancho.fantasma * r, "radar", 0.12)],
  },
  "flo-torre": {
    id: "flo-torre", nombre: "Pisos · el piso 13 sí existe: solo lo rotulan 14", ideal: 4.75, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TFL.torre.sube * r, "whoosh", 0.12), ev(TFL.torre.trece * r, "zap", 0.14), ev(TFL.torre.rotulos * r, "pop", 0.12), ev(TFL.torre.chip * r, "ding", 0.12)],
  },
  "flo-conteo": {
    id: "flo-conteo", nombre: "Pisos · conteo de Manhattan: solo 55 de 629 edificios altos muestran un piso 13", ideal: 5.45, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TFL.conteo.cuadros * r, "pop", 0.1), ev(TFL.conteo.dorados * r, "tick", 0.12), ev(TFL.conteo.dorados * r + 1.2, "zap", 0.12), ev(TFL.conteo.chip * r, "ding", 0.14)],
  },
  "flo-asia": {
    id: "flo-asia", nombre: "Pisos · en China, Japón y Corea el 4 suena parecido a muerte y muchos edificios se lo saltan", ideal: 6.45, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(TFL.asia.panel * r, "whoosh", 0.1), ev(TFL.asia.hueco * r, "thud", 0.16), ev(TFL.asia.muerte * r, "radar", 0.14), ev(TFL.asia.saltan * r, "pop", 0.12)],
  },
  "flo-precio": {
    id: "flo-precio", nombre: "Pisos · el 8 suena a prosperidad; estudios de Vancouver y Hong Kong: el 4 se vende más barato y el 8, a veces, más caro", ideal: 8.85, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TFL.precio.ocho * r, "ding", 0.16), ev(TFL.precio.cuatro * r, "thud", 0.14), ev(TFL.precio.barra1 * r, "pop", 0.12), ev(TFL.precio.barra2 * r, "pop", 0.12), ev(TFL.precio.barra3 * r, "pop", 0.12), ev(TFL.precio.chip * r, "tick", 0.1)],
  },
  "flo-consejo": {
    id: "flo-consejo", nombre: "Pisos · si compras, cuenta los pisos reales y mira el plano: el botón puede esconder uno (cierre)", ideal: 6.75, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(TFL.consejo.cuenta * r, "whoosh", 0.1), ev(TFL.consejo.rotulos * r, "zap", 0.14), ev(TFL.consejo.plano * r, "pop", 0.12), ev(TFL.consejo.chip * r, "ding", 0.16)],
  },
  /* ───────────── «La casa que vale menos cada año» (IMNOBA · Japón · figuras realistas) ───────────── */
  "jap-gancho": {
    id: "jap-gancho", nombre: "Casas de Japón · a los 30 años la casa casi no vale, el terreno sí (gancho)", ideal: 6.15, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "golpe", 0.14), ev(TJP.gancho.anios * r, "tick", 0.12), ...clics(TJP.gancho.anios * r, TJP.gancho.aniosDur * r * 0.8, 0.04), ev(TJP.gancho.tierra * r, "zap", 0.14), ev(TJP.gancho.chip * r, "ding", 0.16)],
  },
  "jap-grafico": {
    id: "jap-grafico", nombre: "Casas de Japón · el terreno conserva su valor, la construcción se deprecia (22 años para impuestos)", ideal: 7.15, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TJP.grafico.ejes * r, "whoosh", 0.1), ev(TJP.grafico.casa * r, "zap", 0.12), ev(TJP.grafico.casa * r + 1.4, "tick", 0.1), ev(TJP.grafico.marca22 * r, "thud", 0.16), ev(TJP.grafico.chip * r, "ding", 0.14)],
  },
  "jap-demole": {
    id: "jap-demole", nombre: "Casas de Japón · las casas demolidas tenían 32 años; en EE. UU., 66 (dato de 2008)", ideal: 7.45, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TJP.demole.golpe * r, "thud", 0.2), ev(TJP.demole.caida * r, "estatica", 0.16), ev(TJP.demole.barra1 * r, "pop", 0.12), ev(TJP.demole.barra2 * r, "pop", 0.12), ev(TJP.demole.barra3 * r, "pop", 0.12), ev(TJP.demole.chip * r, "ding", 0.12)],
  },
  "jap-porque": {
    id: "jap-porque", nombre: "Casas de Japón · no se caen solas: preferencia por lo nuevo y normas antisísmicas que cambian", ideal: 6.15, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TJP.porque.viejas * r, "pop", 0.1), ev(TJP.porque.flecha * r, "whoosh", 0.12), ev(TJP.porque.nueva * r, "ding", 0.16), ev(TJP.porque.onda * r, "radar", 0.12), ev(TJP.porque.chip1 * r, "tick", 0.1), ev(TJP.porque.chip2 * r, "tick", 0.1)],
  },
  "jap-vacias": {
    id: "jap-vacias", nombre: "Casas de Japón · 9 millones de viviendas vacías, casi 14 de cada 100 (2023)", ideal: 6.45, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(TJP.vacias.grid * r, "pop", 0.1), ...[0, 1, 2, 3, 4, 5, 6].map((i) => ev((TJP.vacias.vacias + i * 0.26) * r, "tick", 0.1)), ev(TJP.vacias.dato * r, "zap", 0.14), ev(TJP.vacias.chip * r, "ding", 0.12)],
  },
  "jap-leccion": {
    id: "jap-leccion", nombre: "Casas de Japón · al comprar, pide que separen el valor del terreno y el de la construcción (cierre)", ideal: 6.45, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(TJP.leccion.casa * r, "whoosh", 0.1), ev(TJP.leccion.parte * r, "thud", 0.14), ev(TJP.leccion.tarjeta * r, "pop", 0.12), ev(TJP.leccion.filas * r, "tick", 0.1), ev(TJP.leccion.chip * r, "ding", 0.16)],
  },
  /* ───────────── «El viaje de la luz» (IMNOBA · centrales eléctricas · POV) ───────────── */
  "cen-gancho": {
    id: "cen-gancho", nombre: "Viaje de la luz · aprietas el interruptor: ¿de dónde sale esa energía? (gancho, POV)", ideal: 5.65, fondo: "dark",
    sfx: (_d, r) => [ev(0.05, "golpe", 0.14), ev(TCE.gancho.pulsa * r, "clic", 0.2), ev(TCE.gancho.luz * r, "zap", 0.16), ev(TCE.gancho.zoom * r, "whoosh", 0.18), ...clics(TCE.gancho.tunel * r, 1.2, 0.04), ev(TCE.gancho.chip * r, "ding", 0.14)],
  },
  "cen-fuente": {
    id: "cen-fuente", nombre: "Viaje de la luz · fuego o agua: una caldera que quema o una presa que deja caer el agua", ideal: 6.55, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TCE.fuente.fuego * r, "estatica", 0.14), ev(TCE.fuente.agua * r, "gota", 0.16), ev(TCE.fuente.paquete * r, "zap", 0.14), ev(TCE.fuente.chip1 * r, "pop", 0.1), ev(TCE.fuente.chip2 * r, "pop", 0.1), ev(TCE.fuente.entra * r, "whoosh", 0.14)],
  },
  "cen-turbina": {
    id: "cen-turbina", nombre: "Viaje de la luz · el vapor o el agua empujan las aspas de una turbina que no deja de girar", ideal: 6.75, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(TCE.turbina.turbina * r, "thud", 0.16), ...clics(TCE.turbina.giro * r, 2.4, 0.05), ev(TCE.turbina.chip * r, "pop", 0.1), ev(TCE.turbina.rapido * r, "radar", 0.14)],
  },
  "cen-generador": {
    id: "cen-generador", nombre: "Viaje de la luz · un imán que gira dentro de bobinas de cobre crea la electricidad", ideal: 6.45, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TCE.generador.gen * r, "whoosh", 0.1), ev(TCE.generador.iman * r, "pop", 0.12), ev(TCE.generador.bobinas * r, "zap", 0.16), ev(TCE.generador.onda * r, "ding", 0.14), ev(TCE.generador.chip * r, "tick", 0.1)],
  },
  "cen-transmision": {
    id: "cen-transmision", nombre: "Viaje de la luz · un transformador sube el voltaje y la energía cruza el país por las torres", ideal: 7.95, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TCE.transmision.trafo * r, "thud", 0.16), ev(TCE.transmision.sube * r, "zap", 0.18), ev(TCE.transmision.chip * r, "ding", 0.14), ev(TCE.transmision.torres * r, "whoosh", 0.2), ...clics(TCE.transmision.torres * r + 0.4, 2.8, 0.04), ev(TCE.transmision.chip2 * r, "pop", 0.1)],
  },
  "cen-barrio": {
    id: "cen-barrio", nombre: "Viaje de la luz · otro transformador baja el voltaje a 120 V y llega a tu casa y a tu medidor", ideal: 6.75, fondo: "dark", entra: "corte",
    sfx: (_d, r) => [ev(TCE.barrio.poste * r, "thud", 0.14), ev(TCE.barrio.baja * r, "zap", 0.14), ev(TCE.barrio.chip * r, "ding", 0.14), ev(TCE.barrio.casa * r, "whoosh", 0.12), ...clics(TCE.barrio.medidor * r, 1.6, 0.05), ev(TCE.barrio.chip2 * r, "tick", 0.1)],
  },
  "cen-balance": {
    id: "cen-balance", nombre: "Viaje de la luz · la electricidad casi no se guarda: producción y consumo se igualan cada segundo", ideal: 6.95, fondo: "dark", entra: "semitono",
    sfx: (_d, r) => [ev(TCE.balance.barras * r, "radar", 0.12), ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ev((TCE.balance.casas + i * 0.2) * r, "tick", 0.09)), ev(TCE.balance.hz * r, "zap", 0.14), ev(TCE.balance.chip * r, "ding", 0.14), ev(TCE.balance.chip2 * r, "pop", 0.1)],
  },
  "cen-enchufe": {
    id: "cen-enchufe", nombre: "Viaje de la luz · llega al enchufe y la luz se enciende: un viaje de un instante (cierre, loop)", ideal: 5.25, fondo: "dark", entra: "zoom",
    sfx: (_d, r) => [ev(TCE.enchufe.enchufe * r, "whoosh", 0.12), ev(TCE.enchufe.llega * r, "radar", 0.12), ev(TCE.enchufe.mete * r, "thud", 0.18), ev(TCE.enchufe.luz * r, "zap", 0.2), ev(TCE.enchufe.luz * r + 0.15, "ding", 0.2), ev(TCE.enchufe.chip * r, "pop", 0.1)],
  },
};

export const IDS_PIEZA = Object.keys(PIEZAS);
export const piezaPorId = (id: unknown): DefPieza | null => (typeof id === "string" && Object.prototype.hasOwnProperty.call(PIEZAS, id) ? PIEZAS[id] : null);
