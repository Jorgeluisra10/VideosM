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

export type SfxTipo = "pop" | "tick" | "whoosh" | "thud" | "latido" | "zap" | "ding";
export type SfxDef = { t: number; tipo: SfxTipo; vol?: number };

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
export const DUR_SFX: Record<SfxTipo, number> = { pop: 0.25, tick: 0.1, whoosh: 0.65, thud: 0.75, latido: 0.95, zap: 0.3, ding: 1.7 };
