import type { Modo } from "./parser";
import type { TemaEscena } from "./paletas";
import type { EscenaEstudioGuardada } from "./estudio";
import type { EscenaViralGuardada } from "./viral";

export type Entrada2D = "aparecer" | "pop" | "deslizar-arriba" | "deslizar-abajo" | "deslizar-izq" | "deslizar-der" | "crecer";
export type Entrada3D = "crecer" | "caer" | "aparecer" | "ninguna";
export type Ambiente = "cuadricula" | "particulas" | "aros" | "lineas" | "ninguno";
export type SfxTipoAnim = "pop" | "whoosh" | "heartbeat" | "cash" | "tick" | "thud" | "zap" | "ding";

/** Campos comunes a todo elemento 2D. Los tiempos son segundos desde el inicio de la escena. */
export type Base2D = { tipo: string; t: number; hasta: number | null; entrada: Entrada2D };

export type Elemento2D = Base2D & Record<string, any>;

/** Medidor del HUD (estilo retro): su valor va de `inicio` a `fin` a partir de `t` (s) durante `dur` (s), y mueve aguja, número, borde y modelo a la vez. */
export type Medidor = {
  etiqueta: string; unidad: string; min: number; max: number; inicio: number; fin: number; t: number; dur: number; decimales: number;
  /** varios tramos consecutivos (formato estructurado: líneas HUD): de cada valor al siguiente. Sin claves vale el tramo único inicio→fin. */
  claves?: { t: number; dur: number; valor: number }[];
};

/** Campos extra de una escena en estilo retro. */
export type CamposRetro = { titulo?: string; tituloTam?: number; subtitulo?: string | null; medidores?: Medidor[] };

export type EventoSfx = { t: number; tipo: SfxTipoAnim; vol: number };

export type EscenaSVG = { modo: "SVG"; n: number; tema: TemaEscena; ambiente: Ambiente; elementos: Elemento2D[]; sfx?: EventoSfx[] } & CamposRetro;

export type Camara = { radio: number; radioFin: number; altura: number; alturaFin: number; anguloInicio: number; anguloFin: number; mirarX: number; mirarY: number; mirarZ: number; fov: number };
export type Luces = { ambiente: number; direccional: number; dirX: number; dirY: number; dirZ: number; puntoAcento: number };
export type Objeto3D = { tipo: string; t: number; dur: number; entrada: Entrada3D; giro: number; color: string; emisivo: boolean } & Record<string, any>;

export type Escena3D = { modo: "3D"; n: number; tema: TemaEscena; camara: Camara; luces: Luces; suelo: "ninguno" | "plano" | "cuadricula"; niebla: boolean; objetos: Objeto3D[]; overlay: Elemento2D[]; sfx?: EventoSfx[] } & CamposRetro;

/** Lienzo libre: la escena es código (JSX transpilado a `js`) que ocupa todo el lienzo 1080×1920. */
export type EscenaLibreGuardada = { modo: "LIBRE"; n: number; tema: TemaEscena; codigo: string; js: string; sfx?: EventoSfx[]; fallback?: boolean; inicio: number; fin: number; dur: number; texto: string };

/** Escena tal como se guarda en animacion.json: lo que devuelve la IA + lo que se sabe localmente (tiempos y texto). */
export type EscenaGuardada = ((EscenaSVG | Escena3D) & { inicio: number; fin: number; dur: number; texto: string }) | EscenaLibreGuardada | EscenaEstudioGuardada | EscenaViralGuardada;

export type Uso = { modelo: string; prompt_tokens: number; completion_tokens: number; costo_usd: number; llamadas: number };

export type Animacion = {
  version: 1;
  titulo: string;
  paleta: string;
  sfx: boolean;
  fps: number;
  duracion: number;
  escenas: EscenaGuardada[];
  uso: Uso | null;
  /** formato estructurado: false = «HUD: OFF» (sin medidores; el escenario llega hasta y 1800) */
  hud?: boolean;
  formato?: "simple" | "estructurado" | "libre" | "estudio" | "viral";
};

export type { Modo };
