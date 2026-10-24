import type React from "react";

/** Todas las escenas reciben su ventana en segundos; usan useT() para el tiempo absoluto. */
export type EscenaProps = { ini: number; fin: number };

export type EscenaDef = {
  id: string;
  /** Título del capítulo que se muestra arriba */
  titulo: string;
  /** Color de acento del fondo para esta escena */
  acento: string;
  /** Segundo en que empieza (normalmente tiempoDe("palabra clave")) */
  desde: number;
  Componente: React.FC<EscenaProps>;
  /** Capa a pantalla completa DETRÁS de la escena (p. ej. una foto de fondo con movimiento de cámara) */
  Fondo?: React.FC<EscenaProps>;
};

/** Tipos de efecto. "latido" es el nombre antiguo de "heartbeat" (se acepta por compatibilidad). */
export type SfxTipo = "pop" | "tick" | "whoosh" | "thud" | "heartbeat" | "latido" | "zap" | "ding" | "cash" | "gota" | "estatica" | "clic" | "golpe" | "polvo" | "radar";
export type SfxDef = { t: number; tipo: SfxTipo; vol?: number };

/** Volumen por defecto de un efecto: discreto (15 %) para que nunca tape la voz. */
export const VOL_SFX = 0.15;

/** Ruta (dentro de public/) del archivo de un efecto: public/sfx/<tipo>.wav */
export const archivoSfx = (tipo: SfxTipo): string => `sfx/${tipo === "latido" ? "heartbeat" : tipo}.wav`;

export type Tema = {
  id: string;
  /** Especialidad que sale en la pastilla amarilla superior */
  etiqueta: string;
  escenas: EscenaDef[];
  sfx: SfxDef[];
  /** Segundos donde la cámara "golpea" (sacudida) */
  impactos: number[];
  /** Fotograma de la portada (segundo del video) */
  fotogramaPortada: number;
  /** Componente de la portada 1080x1920 (si falta se usa un fondo liso) */
  Portada?: React.ComponentType;
};

/** Duración (s) de cada efecto: acota su <Sequence> en el video y el recorte en la mezcla de audio. */
export const DUR_SFX: Record<SfxTipo, number> = { pop: 0.25, tick: 0.1, whoosh: 0.65, thud: 0.75, heartbeat: 0.95, latido: 0.95, zap: 0.3, ding: 1.7, cash: 1.1, gota: 0.4, estatica: 0.55, clic: 0.06, golpe: 0.45, polvo: 0.9, radar: 1.1 };
