/**
 * MARCAS DEL PANEL (puro): IMNOBA (inmobiliario y vehículos) y SINAPSIS (medicina y ciencia).
 * Cada marca tiene SUS paletas, SUS ejemplos, SU idea de muestra, SU línea de marca para la IA y SUS colores de interfaz.
 * El panel (navegador), los scripts y el render usan este mismo módulo, así que lo que se ve como «IMNOBA» o «SINAPSIS» en el Estudio es
 * exactamente lo que se genera y se dibuja. Regla: un video de una marca nunca lleva la identidad de la otra (colores, logo, nombre en la IA).
 */
import { IMNOBA } from "./paletas";

export type MarcaId = "imnoba" | "sinapsis";

export type EjemploMarca = {
  /** id del botón */
  id: string;
  /** valor de `--tema` de scripts/anim/ejemplo.mjs (vacío = el ejemplo base de IMNOBA) */
  tema: string;
  etiqueta: string;
  ayuda: string;
  /** paleta con la que se carga (siempre una de las de su marca) */
  paleta: string;
  principal?: boolean;
};

export type Marca = {
  id: MarcaId;
  nombre: string;
  /** a qué se dedica (una línea) */
  rubro: string;
  icono: string;
  descripcion: string;
  /** colores de la interfaz (no son los del video: esos viven en las paletas) */
  ui: { color: string; fondo: string; texto: string; acento: string };
  /** paletas de video que pertenecen a la marca; la primera es la clásica y la segunda la documental */
  paletas: string[];
  paletaPorDefecto: string;
  /** perfiles del modo clásico que pertenecen a la marca */
  perfiles: string[];
  /** texto de muestra del cuadro de idea */
  placeholder: string;
  /** ejemplo corto de idea (para la ayuda bajo el cuadro de texto) */
  ideaCorta: string;
  /** archivo (en ejemplos/animacion-viral) con la idea de muestra del botón «Cargar ejemplo» */
  ideaEjemplo: string;
  /** línea que se le manda a la IA para que el CTA y el tono sean de ESTA marca */
  promptMarca: string;
  ejemplos: EjemploMarca[];
};

export const MARCAS: Record<MarcaId, Marca> = {
  imnoba: {
    id: "imnoba",
    nombre: "IMNOBA",
    rubro: "Inmobiliario y vehículos",
    icono: "🏠",
    descripcion: "Plataforma colombiana para publicar y encontrar inmuebles y vehículos (imnoba.com). Videos de valorización, movilidad, consejos para vender y comprar, con los colores oficiales de la marca: azul navy y amarillo.",
    ui: { color: IMNOBA.amarillo, fondo: IMNOBA.navy, texto: "#FFFFFF", acento: "#8EB8FF" },
    paletas: ["imnoba", "retro-imnoba"],
    paletaPorDefecto: "imnoba",
    perfiles: ["inmobiliario-co", "inmobiliaria"],
    placeholder: "Escribe aquí lo que quieres del video de IMNOBA: una frase basta, pero puedes dar todo el detalle que quieras (puntos, cifras, nombres, tono, llamada a la acción). Ejemplo: Un video de 30 segundos para IMNOBA sobre por qué el metro de Bogotá valoriza las propiedades cerca de las estaciones y que publiquen gratis su inmueble.",
    ideaCorta: "Un video de 30 segundos para IMNOBA sobre por qué el metro de Bogotá valoriza las propiedades",
    ideaEjemplo: "idea.txt",
    promptMarca: "MARCA: IMNOBA (plataforma colombiana para publicar y encontrar inmuebles y vehículos; web imnoba.com). El CTA es de IMNOBA.",
    ejemplos: [
      { id: "base", tema: "", etiqueta: "🏠 Reel IMNOBA (metro y valorización)", ayuda: "Reel de 35 s con el estilo IMNOBA (azul navy y amarillo): por qué el metro de Bogotá valoriza las propiedades y que publiquen gratis. Se carga sin IA y sin coste; luego pulsa Renderizar.", paleta: "imnoba" },
      { id: "carros", tema: "carros", etiqueta: "🚗 Reel de vehículos (3 errores al vender tu carro)", ayuda: "Reel de 30 s para IMNOBA sobre los errores al vender un carro usado. Se carga sin IA y sin coste; luego pulsa Renderizar.", paleta: "imnoba" },
      { id: "metro-bogota", tema: "metro-bogota", etiqueta: "🎬 Piezas a medida (piloto: Metro de Bogotá)", ayuda: "Ensayo visual de periodismo de datos con escenas diseñadas a mano (carril B). Se carga sin IA y sin coste; luego pulsa Renderizar.", paleta: "retro-imnoba" },
      { id: "anomalia", tema: "anomalia", etiqueta: "🎬 Ensayo abstracto «Anomalía» (Bogotá)", ayuda: "Ensayo visual abstracto (sin trenes, buses ni edificios): disco de filotaxis, simulación multiagente, Voronoi isométrico, metaballs, potenciómetros, odómetros y zoom en el eje Z, con cierre en bucle. Se carga sin IA y sin coste; luego pulsa Renderizar.", paleta: "retro-imnoba" },
      { id: "parada-optima", tema: "parada-optima", etiqueta: "🧮 Video «La regla del 37 %» (buscar casa)", ayuda: "Video «¿sabías que?» con figuras realistas (casas, candidatas de Kepler, señales) sobre la regla del 37 %: el caso de Kepler, la demostración con 3 casas, la regla con 100, su curva exacta, una simulación de 10.000 búsquedas y los supuestos del modelo, con los colores de IMNOBA. Se carga sin IA y sin coste; luego pulsa Renderizar.", paleta: "retro-imnoba", principal: true },
      { id: "bogota-real", tema: "bogota-real", etiqueta: "🎬 Video realista «Bogotá, la ciudad sin metro»", ayuda: "Video «¿sabías que?» con figuras realistas (bus articulado, metro, autos, torres, cronómetros) sobre un estudio azul marino con piso y reflejo, y datos verificados con fuente. Se carga sin IA y sin coste; luego pulsa Renderizar.", paleta: "retro-imnoba", principal: true },
    ],
  },
  sinapsis: {
    id: "sinapsis",
    nombre: "SINAPSIS",
    rubro: "Medicina y ciencia",
    icono: "🧠",
    descripcion: "Divulgación de medicina y ciencia: anatomía, fisiología, farmacología, historia de la medicina y datos curiosos, con figuras vectoriales y datos con fuente. Colores clínicos: fondo oscuro, azul de venas y amarillo de nervios.",
    ui: { color: "#3B82F6", fondo: "#0B0F19", texto: "#F8FAFC", acento: "#FACC15" },
    paletas: ["medicina", "retro"],
    paletaPorDefecto: "medicina",
    perfiles: ["medicina-ar", "medicina"],
    placeholder: "Escribe aquí lo que quieres del video de SINAPSIS: una frase basta, pero puedes dar todo el detalle que quieras (mecanismo, cifras, estudios con autor y año, tono, llamada a la acción). Ejemplo: Un reel de 35 segundos para SINAPSIS sobre por qué un infarto duele en el brazo izquierdo y no solo en el corazón, y que guarden y compartan el video.",
    ideaCorta: "Un reel de 35 segundos para SINAPSIS sobre por qué un infarto duele en el brazo izquierdo",
    ideaEjemplo: "idea-sinapsis.txt",
    promptMarca: "MARCA: SINAPSIS (divulgación de medicina y ciencia con datos verificables). El CTA es de SINAPSIS; no menciones a IMNOBA ni hables de inmuebles o vehículos. No des consejos médicos personales: solo divulgación.",
    ejemplos: [
      { id: "medicos-experimento", tema: "medicos-experimento", etiqueta: "🩺 Video médico «Médicos que se probaron a sí mismos»", ayuda: "Video médico «¿sabías que?»: tres médicos que se probaron a sí mismos (sonda al corazón, bacteria, apendicectomía en la Antártida) con radiografía, estómago, endoscopia, medalla Nobel e instrumental dibujados como renders, y la fuente de cada dato en pantalla. Se carga sin IA y sin coste; luego pulsa Renderizar (y, si quieres, ponle voz con IA).", paleta: "retro", principal: true },
      { id: "ciencia", tema: "ciencia", etiqueta: "🧬 Reel de ciencia (el tardígrado)", ayuda: "Reel de 38 s sobre el animal más resistente del planeta, con zoom de escala, fichas de cita y escenarios ilustrados. Se carga sin IA y sin coste; luego pulsa Renderizar.", paleta: "medicina" },
      { id: "documental", tema: "documental", etiqueta: "🎞️ Documental (jueces y fatiga de decisión)", ayuda: "Explicativo de 1 minuto en estilo documental sobre el estudio de Danziger (2011): ficha de papel, pilares, ciclo y pregunta final. Se carga sin IA y sin coste; luego pulsa Renderizar.", paleta: "retro" },
      { id: "conchas", tema: "conchas", etiqueta: "🐚 Documental (todas las conchas son la misma)", ayuda: "Explicativo de 1 minuto en estilo documental sobre los tres números de Raup (1966): diales, cubo de conchas posibles y oscilómetro. Se carga sin IA y sin coste; luego pulsa Renderizar.", paleta: "retro" },
    ],
  },
};

export const IDS_MARCA = Object.keys(MARCAS) as MarcaId[];
export const MARCA_POR_DEFECTO: MarcaId = "imnoba";

export const marcaPorId = (id: unknown): Marca | null => (typeof id === "string" && Object.prototype.hasOwnProperty.call(MARCAS, id) ? MARCAS[id as MarcaId] : null);

/** Marca a la que pertenece una paleta de video (sin paleta = IMNOBA, como siempre). */
export function marcaDePaleta(paleta: unknown): Marca {
  if (paleta === undefined || paleta === null || paleta === "") return MARCAS[MARCA_POR_DEFECTO];
  return IDS_MARCA.map((i) => MARCAS[i]).find((m) => m.paletas.includes(String(paleta))) ?? MARCAS[MARCA_POR_DEFECTO];
}

/** Marca de un perfil del modo clásico (null = genérico, de ninguna marca). */
export const marcaDePerfil = (perfil: unknown): Marca | null => IDS_MARCA.map((i) => MARCAS[i]).find((m) => m.perfiles.includes(String(perfil))) ?? null;

/** Marca de un tema de ejemplo (`--tema=`); el ejemplo base (sin tema) es de IMNOBA. */
export const marcaDeTema = (tema: unknown): Marca | null => {
  const t = String(tema ?? "");
  return IDS_MARCA.map((i) => MARCAS[i]).find((m) => m.ejemplos.some((e) => e.tema === t)) ?? null;
};

/** Paleta con la que se carga un ejemplo (la de su ficha); si el tema no existe, la de la marca por defecto. */
export const paletaDeTema = (tema: unknown): string => {
  const t = String(tema ?? "");
  for (const i of IDS_MARCA) { const e = MARCAS[i].ejemplos.find((x) => x.tema === t); if (e) return e.paleta; }
  return MARCAS[MARCA_POR_DEFECTO].paletaPorDefecto;
};

/** Paleta válida para la marca: la pedida si es suya y, si no, la de la marca por defecto. */
export const paletaValidaParaMarca = (marca: MarcaId, paleta: unknown): string => (MARCAS[marca].paletas.includes(String(paleta)) ? String(paleta) : MARCAS[marca].paletaPorDefecto);

/** Línea de marca para el mensaje de usuario de la IA (según la paleta). */
export const lineaMarcaPrompt = (paleta?: string): string => marcaDePaleta(paleta).promptMarca;

/** «Prompt Formateador» de la idea, con los ejemplos y el cierre de la marca elegida. */
export function promptFormateadorIdea(marca: MarcaId): string {
  const m = MARCAS[marca];
  const ejemplos = marca === "imnoba"
    ? ["Un video de 30 segundos para IMNOBA: por qué el metro de Bogotá valoriza las propiedades cerca de las estaciones, y que publiquen gratis su inmueble.", "Reel de 25 segundos: 3 errores al vender tu carro usado y cómo evitarlos publicando en IMNOBA."]
    : ["Un reel de 35 segundos para SINAPSIS: por qué un infarto duele en el brazo izquierdo y no solo en el corazón, y que guarden y compartan el video.", "Un video de 40 segundos para SINAPSIS sobre cómo Barry Marshall demostró que las úlceras las causa una bacteria, con las fuentes de cada dato."];
  const extra = marca === "imnoba"
    ? "Marca: IMNOBA (inmuebles y vehículos en Colombia). El cierre invita a publicar o buscar en IMNOBA."
    : "Marca: SINAPSIS (divulgación de medicina y ciencia). Pide datos con fuente (autor y año); no des consejos médicos personales. El cierre invita a guardar y compartir.";
  return `Ayúdame a escribir la IDEA de un reel de ${m.nombre} en UNA sola frase (máximo dos). Una buena idea dice: de qué trata, para quién es y qué quiero que la gente haga al final. Puedes incluir la duración («de 30 segundos»).

${extra}

Ejemplos:
${ejemplos.map((e) => `· ${e}`).join("\n")}

Devuélveme SOLO la frase final (sin comillas ni explicaciones), con los datos reales que yo te dé y sin inventar cifras. Mis notas:
`;
}
