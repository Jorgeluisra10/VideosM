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
};

export const IDS_PIEZA = Object.keys(PIEZAS);
export const piezaPorId = (id: unknown): DefPieza | null => (typeof id === "string" && Object.prototype.hasOwnProperty.call(PIEZAS, id) ? PIEZAS[id] : null);
