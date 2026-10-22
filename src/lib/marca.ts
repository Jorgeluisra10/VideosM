import marcaJson from "../data/marca.json";

/**
 * Marca del video activo (src/data/marca.json: la escribe el agente/asistente a partir del perfil y del brief).
 * Cambia los colores, el logo, la música y el estilo del fondo SIN tocar el código de las escenas.
 * Los nombres de color del plan (rojo/azul/amarillo/hueso) son SEMÁNTICOS: aquí se les asigna el tono de la marca.
 */
export type Paleta = { fondo: string; rojo: string; azul: string; amarillo: string; hueso: string; panel: string; panelClaro: string };

export type Marca = {
  colores: Paleta;
  nombre: string;
  etiqueta: string;
  logo: string | null;
  telefono: string;
  web: string;
  musica: string | null;
  volumenMusica: number;
  ambiente: boolean;
  /** transición entre escenas: zoom (por defecto) | fade | slide | wipe | flip | reloj */
  transicion?: string;
  fondo: { rejilla: number; particulas: boolean };
};

export const PALETA_BASE: Paleta = {
  fondo: "#0B0F19",
  rojo: "#EF4444",
  azul: "#3B82F6",
  amarillo: "#FACC15",
  hueso: "#F8FAFC",
  panel: "#121A2B",
  panelClaro: "#1B2740",
};

const j = marcaJson as Partial<Marca>;

export const MARCA: Marca = {
  nombre: "",
  etiqueta: "",
  logo: null,
  telefono: "",
  web: "",
  musica: null,
  volumenMusica: 0.14,
  ambiente: true,
  ...j,
  colores: { ...PALETA_BASE, ...(j.colores ?? {}) },
  fondo: { rejilla: 0.05, particulas: true, ...(j.fondo ?? {}) },
};
