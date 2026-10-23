/**
 * Sistema de diseño RETRO-CIENTÍFICO: constantes fijas (viven en el código, no viajan en ningún prompt → costo $0 de API).
 * Fuente única de los hexadecimales del brief; `paletas.ts` construye sobre ellos las paletas «retro» y «retro-imnoba».
 */
export const THEME = {
  /** fondo oscuro (negro mate profundo) */
  dark: "#0B0C10",
  /** fondo papel técnico (blanco hueso cálido) */
  paper: "#F4F1EA",
  /** acento principal / objeto de estudio (rojo bermellón) */
  red: "#E63926",
  /** luz direccional / caras iluminadas (rosa salmón) */
  salmon: "#FF9E8A",
  /** telemetría / foco activo (lima neón) */
  yellow: "#D4FF33",
  /** datos comparativos / anomalías (azul cobalto) */
  blue: "#2B44FF",
  white: "#FFFFFF",
} as const;

/** Zonas fijas del lienzo 1080×1920. */
export const LAYOUT = {
  ancho: 1080,
  alto: 1920,
  /** centro (Y) del título H1 */
  tituloY: 180,
  /** centro (Y) del subtítulo de terminal */
  subtituloY: 300,
  /** el escenario central empieza aquí… */
  escenarioY0: 350,
  /** …y con HUD termina aquí (el HUD ocupa 1450–1920)… */
  escenarioY1Hud: 1450,
  /** …y con «HUD: OFF» el escenario se expande hasta aquí */
  escenarioY1SinHud: 1800,
} as const;

/** Tiempos del efecto terminal y de la curva global. */
export const TIEMPOS = { segundosPorCaracter: 0.03, parpadeo: 0.25, bezier: [0.22, 1, 0.36, 1] as const } as const;
