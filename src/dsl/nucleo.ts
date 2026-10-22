/**
 * Punto de entrada ÚNICO de la lógica pura del motor de planes, para Node.
 * scripts/ia/puente.mjs lo empaqueta con esbuild; así el validador, los esquemas y las pruebas
 * usan exactamente el mismo código que el render (anclas, tiempos, cajas, medidas de texto, sanitizador SVG).
 */
export { norm, resolverAncla, tiempoAncla, finAncla } from "./anclas";
export type { PalabraT, ResultadoAncla } from "./anclas";
export { inicioEscenas, tiemposElemento, tiemposDePlan, duracionTotal } from "./tiempos";
export { cajasDe, area, interseccion, TIPOS_CON_MOVIMIENTO, MARGEN_LOCAL } from "./cajas";
export type { Caja, Pieza, Clase } from "./cajas";
export { sanitizarSvg } from "./svgSeguro";
export { anchoEstimado } from "../lib/texto";
export { px, py, pu, U, X0, Y0, SLOTS } from "./medidas";
export { curvaPreset } from "./curvas";
