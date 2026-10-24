/**
 * Paletas del motor de animación. La IA NUNCA escribe colores hexadecimales: elige TOKENS (primario, acento…) y el
 * motor los traduce a la paleta elegida y al tema de cada escena (oscuro / claro). Así toda animación respeta la marca.
 */
import { THEME } from "../theme/retroScientific";

export const TOKENS = ["primario", "acento", "blanco", "tinta", "suave", "ok", "alerta"] as const;
export type Token = (typeof TOKENS)[number];
export type TemaEscena = "oscuro" | "claro";

/** `luz` y `sombra` solo los usa el estilo retro: luz = cara iluminada del cel-shading; sombra = contornos y puntos de semitono. */
type ColoresTema = Record<Token, string> & { fondoCentro: string; fondoBorde: string; luz?: string; sombra?: string };

export type EstiloVisual = "clasico" | "retro";

export type Paleta = {
  id: string;
  nombre: string;
  /** "retro" = Retro-Científica (infografía técnica años 60 + telemetría): título H1, terminal, medidores, cel-shading, halftone */
  estilo?: EstiloVisual;
  /** frase para el prompt: qué significa cada color */
  uso: string;
  oscuro: ColoresTema;
  claro: ColoresTema;
};

/**
 * IMNOBA — colores oficiales sacados del logo (navy #02224E, amarillo #FFC500, blanco #FFFFFF).
 * Sobre fondo oscuro (navy) el «primario» se aclara un poco para que no desaparezca; sobre fondo claro (blanco) es el navy tal cual.
 */
export const IMNOBA = { navy: "#02224E", amarillo: "#FFC500", blanco: "#FFFFFF" } as const;

export const PALETAS: Record<string, Paleta> = {
  imnoba: {
    id: "imnoba",
    nombre: "IMNOBA (Colores oficiales de marca)",
    uso: "primario = azul navy de la marca (estructura, edificios, trazos principales); acento = amarillo IMNOBA (precios, cifras clave, llamadas a la acción, ventanas encendidas); blanco = texto y líneas sobre fondo oscuro; tinta = el color de texto que se lee sobre el fondo de la escena (blanco en oscuro, navy en claro); suave = líneas secundarias y cuadrículas; ok = verde de valorización o rentabilidad; alerta = rojo de riesgo o descuento.",
    oscuro: { primario: "#2F66B8", acento: IMNOBA.amarillo, blanco: IMNOBA.blanco, tinta: IMNOBA.blanco, suave: "#8EA6CC", ok: "#2BD48D", alerta: "#FF5A5F", fondoCentro: "#08336F", fondoBorde: IMNOBA.navy },
    claro: { primario: IMNOBA.navy, acento: IMNOBA.amarillo, blanco: IMNOBA.blanco, tinta: IMNOBA.navy, suave: "#6A7FA6", ok: "#12A56B", alerta: "#E5383B", fondoCentro: "#FFFFFF", fondoBorde: "#E9EEF7" },
  },
  medicina: {
    id: "medicina",
    nombre: "Medicina Clínica",
    uso: "primario = azul de venas, receptores y membranas; acento = amarillo de nervios, potencial de acción y ATP; blanco = tejidos y estructura base; tinta = el color de texto que se lee sobre el fondo; suave = líneas secundarias; ok = flujo normal; alerta = rojo coral de arterias, dolor, inflamación o bloqueo.",
    oscuro: { primario: "#3B82F6", acento: "#FACC15", blanco: "#F8FAFC", tinta: "#F8FAFC", suave: "#94A3B8", ok: "#10B981", alerta: "#EF4444", fondoCentro: "#141C2E", fondoBorde: "#0B0F19" },
    claro: { primario: "#2563EB", acento: "#D4A106", blanco: "#FFFFFF", tinta: "#0B0F19", suave: "#64748B", ok: "#059669", alerta: "#DC2626", fondoCentro: "#FFFFFF", fondoBorde: "#EEF2F8" },
  },
};

/**
 * RETRO-CIENTÍFICA — hexadecimales EXACTOS del brief (no se cambian):
 * fondo #0B0C10 · papel #F4F1EA · rojo bermellón #E63926 (objeto de estudio) · luz #FF9E8A · lima #D4FF33 (telemetría) · cobalto #2B44FF (contraste).
 * Sobre papel el énfasis es el rojo; el HUD de medidores siempre va sobre panel oscuro (el lima no se leería sobre papel).
 */
PALETAS.retro = {
  id: "retro",
  estilo: "retro",
  nombre: "Retro-Científica · estilo documental (hex del brief: #0B0C10 · #E63926 · #D4FF33)",
  uso: "primario = rojo bermellón #E63926, el OBJETO DE ESTUDIO (el modelo central, la barra o forma protagonista); acento = lima neón #D4FF33, TELEMETRÍA (datos, cifras, cursor, bordes activos; sobre papel pasa a ser el rojo de énfasis); blanco = títulos sobre oscuro; tinta = texto que se lee sobre el fondo (blanco en oscuro, negro mate en papel); suave = ejes, cuadrículas y texto secundario; ok = valor correcto/positivo; alerta = azul cobalto #2B44FF, ANOMALÍAS y destacados de contraste.",
  oscuro: { primario: THEME.red, acento: THEME.yellow, blanco: THEME.white, tinta: THEME.white, suave: "#8B8F98", ok: THEME.yellow, alerta: THEME.blue, fondoCentro: THEME.dark, fondoBorde: THEME.dark, luz: THEME.salmon, sombra: THEME.dark },
  claro: { primario: THEME.red, acento: THEME.red, blanco: THEME.white, tinta: THEME.dark, suave: "#6B6A66", ok: THEME.dark, alerta: THEME.blue, fondoCentro: THEME.paper, fondoBorde: THEME.paper, luz: THEME.salmon, sombra: THEME.dark },
};

/**
 * RETRO-CIENTÍFICA con la ESENCIA IMNOBA: misma estructura, tipografía y shaders, pero el objeto de estudio es el amarillo de marca #FFC500,
 * el fondo oscuro es el navy de marca #02224E y la telemetría es un azul claro derivado del azul de IMNOBA (el lima chocaría con el amarillo).
 */
PALETAS["retro-imnoba"] = {
  id: "retro-imnoba",
  estilo: "retro",
  nombre: "Retro-Científica IMNOBA · estilo documental (esencia de marca: #02224E · #FFC500)",
  uso: "primario = amarillo IMNOBA #FFC500, el OBJETO DE ESTUDIO (modelo central, barra o forma protagonista; sobre papel es el navy #02224E); acento = azul claro de telemetría (datos, cifras, cursor, bordes activos; sobre papel pasa a ser el navy); blanco = títulos sobre oscuro; tinta = texto que se lee sobre el fondo (blanco en el navy de marca, navy en papel); suave = ejes, cuadrículas y texto secundario; ok = valorización o rentabilidad; alerta = rojo de riesgo, anomalías y destacados de contraste.",
  oscuro: { primario: "#FFC500", acento: "#8EB8FF", blanco: "#FFFFFF", tinta: "#FFFFFF", suave: "#8EA6CC", ok: "#2BD48D", alerta: "#FF5A5F", fondoCentro: IMNOBA.navy, fondoBorde: IMNOBA.navy, luz: "#FFE27A", sombra: "#011433" },
  claro: { primario: IMNOBA.navy, acento: IMNOBA.navy, blanco: "#FFFFFF", tinta: IMNOBA.navy, suave: "#6A7FA6", ok: "#12A56B", alerta: "#E5383B", fondoCentro: THEME.paper, fondoBorde: THEME.paper, luz: "#4F7DC9", sombra: "#011433" },
};

export const esRetro = (id: string | undefined): boolean => paletaPorId(id).estilo === "retro";

/** hex «#RRGGBB» → luminancia relativa aproximada 0…1 (para decidir si un texto amarillo necesita contorno sobre fondo claro) */
export const luminancia = (hex: string): number => {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};

export const PALETA_DEFECTO = "imnoba";
export const paletaPorId = (id: string | undefined): Paleta => PALETAS[id ?? PALETA_DEFECTO] ?? PALETAS[PALETA_DEFECTO];

export const color = (p: Paleta, token: string, tema: TemaEscena): string => {
  const c = (tema === "claro" ? p.claro : p.oscuro) as Record<string, string>;
  return c[token] ?? c.tinta;
};
