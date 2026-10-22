/**
 * Paletas del motor de animación. La IA NUNCA escribe colores hexadecimales: elige TOKENS (primario, acento…) y el
 * motor los traduce a la paleta elegida y al tema de cada escena (oscuro / claro). Así toda animación respeta la marca.
 */
export const TOKENS = ["primario", "acento", "blanco", "tinta", "suave", "ok", "alerta"] as const;
export type Token = (typeof TOKENS)[number];
export type TemaEscena = "oscuro" | "claro";

type ColoresTema = Record<Token, string> & { fondoCentro: string; fondoBorde: string };

export type Paleta = {
  id: string;
  nombre: string;
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

export const PALETA_DEFECTO = "imnoba";
export const paletaPorId = (id: string | undefined): Paleta => PALETAS[id ?? PALETA_DEFECTO] ?? PALETAS[PALETA_DEFECTO];

export const color = (p: Paleta, token: string, tema: TemaEscena): string => {
  const c = (tema === "claro" ? p.claro : p.oscuro) as Record<string, string>;
  return c[token] ?? c.tinta;
};
