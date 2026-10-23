/**
 * Los bloques del sistema Retro-Científico con sus nombres «de catálogo». Todos son nativos (cero gasto de IA):
 * la API de OpenAI solo aporta la geometría del escenario central.
 */
export { THEME, LAYOUT } from "../theme/retroScientific";
export { TerminalHeader, TelemetryHUD, CapaRetro, TerminalTexto } from "./motor2d";
export { Escena3DView as GeometryStage, CelHalftoneMaterial } from "./motor3d";
export { Semitono as HalftoneWipeTransition, Contenido as MasterVideoLayout } from "./Animacion";
