/**
 * Esquemas JSON (modo estricto de OpenAI Structured Outputs) para cada etapa del agente.
 * Reglas del modo estricto que se respetan aquí: todo objeto con additionalProperties:false,
 * TODAS las propiedades en "required" (lo opcional se declara como "tipo o null") y sin palabras
 * clave no soportadas (minLength, pattern, minItems...): esas validaciones las hace validar-plan.mjs.
 */
import { cargarCatalogo } from "./puente.mjs";

const COLORES = ["rojo", "azul", "amarillo", "hueso"];
/** Iconos que admiten las fichas (los de propiedades y datos; el resto de iconos sigue disponible en el elemento "icono"). */
const ICONOS_FICHA = ["casa", "cama", "bano", "auto", "medida", "pin", "llave", "estrella", "calendario", "dinero", "arbol", "piscina", "escudo", "sol", "reloj", "check", "telefono", "mail", "web"];

/**
 * Valor opcional: "tipo o null". Los escalares usan la unión de tipos (type:["string","null"]), que no añade un nivel
 * de anidación (la API admite 10); las listas y objetos usan anyOf.
 */
const nulable = (s) => {
  if (typeof s.type === "string" && ["string", "number", "integer", "boolean"].includes(s.type)) {
    const o = { ...s, type: [s.type, "null"] };
    if (s.enum) o.enum = [...s.enum, null];
    return o;
  }
  return { anyOf: [s, { type: "null" }] };
};
const texto = (d) => (d ? { type: "string", description: d } : { type: "string" });
const numero = (d) => (d ? { type: "number", description: d } : { type: "number" });

/** Convierte un objeto { clave: esquema } en un objeto estricto (todo requerido). */
export function objeto(props, descripcion) {
  const o = { type: "object", properties: props, required: Object.keys(props), additionalProperties: false };
  if (descripcion) o.description = descripcion;
  return o;
}

// ---------------------------------------------------------------------------
// Guion
// ---------------------------------------------------------------------------
export const esquemaGuion = objeto({
  proyectoId: texto("slug en kebab-case sin tildes, p. ej. 'insulina-glucosa'"),
  etiqueta: texto("texto corto en MAYÚSCULAS para la pastilla superior (especialidad, marca o categoría), p. ej. 'CARDIOLOGÍA'"),
  titulo: texto("pregunta-gancho completa del video"),
  guion: texto("texto locutado completo (el rango de palabras lo indican las instrucciones), SOLO texto (sin acotaciones, sin viñetas, sin emojis)"),
  verificacion: {
    type: "array",
    description: "afirmaciones o datos clave del guion con su nivel de certeza",
    items: objeto({
      afirmacion: texto(),
      certeza: { type: "string", enum: ["alta", "media", "baja"] },
      nota: texto("de dónde sale: campo del brief, guía clínica o texto de referencia, en una frase"),
    }),
  },
  simplificaciones: { type: "array", items: texto(), description: "simplificaciones o recursos de redacción que no son datos y que un especialista matizaría" },
});

export const esquemaRevision = objeto({
  aprobado: { type: "boolean", description: "true solo si NO hay errores factuales, datos inventados ni terminología incorrecta" },
  problemas: {
    type: "array",
    items: objeto({
      tipo: { type: "string", enum: ["error-factual", "impreciso", "terminologia", "ambiguo", "estilo"] },
      fragmento: texto("cita literal del guion"),
      explicacion: texto(),
      correccion: texto("cómo debería decir"),
    }),
  },
  guionCorregido: nulable(texto("guion completo corregido (mismo rango de palabras) si hubo problemas; null si está aprobado")),
});

export const esquemaPost = objeto({
  descripcion: texto("texto del post para Instagram/TikTok: gancho, 2–3 frases claras y llamada a la acción, con los avisos que pidan las instrucciones"),
  hashtags: { type: "array", items: texto("hashtag con # y sin espacios"), description: "exactamente 5 hashtags relevantes al tema" },
});

// ---------------------------------------------------------------------------
// Crítica visual (modelo con visión)
// ---------------------------------------------------------------------------
export const esquemaCritica = objeto({
  aprobado: { type: "boolean", description: "true solo si no hay problemas de gravedad alta" },
  problemas: {
    type: "array",
    items: objeto({
      escena: texto("id de la escena"),
      gravedad: { type: "string", enum: ["alta", "media", "baja"] },
      tipo: { type: "string", enum: ["solape", "ilegible", "fuera-de-lugar", "metafora-confusa", "error-medico", "dato-incorrecto", "sincronia", "vacio", "estetica"] },
      descripcion: texto("qué se ve mal, indicando los elementos y su posición aproximada"),
      arreglo: texto("cambio concreto en el plan (qué elemento mover/quitar/añadir y a dónde)"),
    }),
  },
});

// ---------------------------------------------------------------------------
// Plan de escenas (generado a partir del catálogo)
// ---------------------------------------------------------------------------
function esquemaProp(spec) {
  switch (spec.t) {
    case "num":
      return numero(spec.d);
    case "int":
      return { type: "integer", ...(spec.d ? { description: spec.d } : {}) };
    case "bool":
      return { type: "boolean", ...(spec.d ? { description: spec.d } : {}) };
    case "str":
      return texto(spec.d);
    case "color":
      return { type: "string", enum: COLORES, ...(spec.d ? { description: spec.d } : {}) };
    case "enum":
      return { type: "string", enum: spec.valores, ...(spec.d ? { description: spec.d } : {}) };
    case "punto":
      return { type: "array", items: { type: "number" }, description: spec.d ?? "[x,y]" };
    case "puntos":
      return { type: "array", items: { type: "array", items: { type: "number" } }, description: spec.d ?? "lista de puntos [x,y]" };
    case "puntos01":
      return { type: "array", items: { type: "array", items: { type: "number" } }, description: spec.d };
    case "lineasH":
      return {
        type: "array",
        description: spec.d,
        items: objeto({ y: numero("0–1"), texto: texto(), color: nulable({ type: "string", enum: COLORES }) }),
      };
    case "marcadores":
      return {
        type: "array",
        description: spec.d,
        items: objeto({ x: numero("0–1 a lo largo del eje horizontal"), texto: texto(), cuando: nulable(texto("frase exacta del guion")) }),
      };
    case "nodos":
      return {
        type: "array",
        description: spec.d,
        items: objeto({ texto: texto(), color: nulable({ type: "string", enum: COLORES }), cuando: nulable(texto("frase exacta del guion")) }),
      };
    case "contactos":
      return {
        type: "array",
        description: spec.d,
        items: objeto({ icono: { type: "string", enum: ["telefono", "whatsapp", "mail", "web", "pin", "calendario"] }, texto: texto() }),
      };
    case "fichas":
      return {
        type: "array",
        description: spec.d,
        items: objeto({ icono: { type: "string", enum: ICONOS_FICHA }, valor: texto(), etiqueta: texto(), color: nulable({ type: "string", enum: COLORES }), cuando: nulable(texto("frase exacta del guion")) }),
      };
    case "pois":
      return {
        type: "array",
        description: spec.d,
        items: objeto({ texto: texto(), x: numero("0–1 dentro del mapa"), y: numero("0–1 dentro del mapa"), cuando: nulable(texto("frase exacta del guion")) }),
      };
    case "panel":
      return objeto({ titulo: texto(), color: nulable({ type: "string", enum: COLORES }), items: { type: "array", items: texto() } }, spec.d);
    default:
      return texto();
  }
}

/**
 * Esquema del plan. `paquetes` limita los elementos a los del perfil (por defecto base + medicina, como siempre).
 * Con menos variantes el modelo se equivoca menos y el esquema pesa menos.
 */
export function construirEsquemaPlan({ paquetes = ["base", "medicina"] } = {}) {
  const cat = cargarCatalogo();
  const permitidos = Object.entries(cat.elementos).filter(([, def]) => paquetes.includes(def.paquete ?? "base"));
  const variantes = permitidos.map(([tipo, def]) => {
    const props = {
      tipo: { type: "string", enum: [tipo] },
      cuando: texto(cat.base.cuando),
      n: nulable({ type: "integer", description: cat.base.n }),
      desfase: nulable(numero(cat.base.desfase)),
      hasta: nulable(texto(cat.base.hasta)),
      impacto: nulable({ type: "boolean", description: cat.base.impacto }),
    };
    for (const [clave, spec] of Object.entries(def.props)) {
      const base = esquemaProp(spec);
      props[clave] = (def.req ?? []).includes(clave) ? base : nulable(base);
    }
    return objeto(props);
  });

  return objeto({
    proyecto: objeto({
      id: texto("slug kebab-case sin tildes"),
      etiqueta: texto("especialidad en MAYÚSCULAS"),
      titulo: texto("pregunta-gancho"),
    }),
    escenas: {
      type: "array",
      description: "5–9 escenas que cubren TODO el guion en orden",
      items: objeto({
        id: texto("slug kebab-case único"),
        titulo: texto("título del capítulo (≤ 38 caracteres), p. ej. '2 · El músculo pide auxilio'"),
        acento: { type: "string", enum: COLORES, description: "color de ambiente de la escena" },
        desde: texto("2–4 palabras EXACTAS y seguidas del guion donde empieza la escena; deben decirse UNA sola vez en todo el guion (la escena empieza en su primera aparición). Primera escena: las primeras palabras"),
        elementos: { type: "array", items: { anyOf: variantes }, description: "elementos en orden de capas (los primeros quedan debajo)" },
        fondo: nulable(
          objeto(
            {
              foto: texto(cat.escena.fondo.props.foto.d),
              modo: nulable({ type: "string", enum: cat.escena.fondo.props.modo.valores, description: cat.escena.fondo.props.modo.d }),
              mov: nulable({ type: "string", enum: cat.escena.fondo.props.mov.valores, description: cat.escena.fondo.props.mov.d }),
              oscurecer: nulable(numero(cat.escena.fondo.props.oscurecer.d)),
            },
            "foto a pantalla completa detrás de la escena (solo si hay fotos disponibles); null = sin foto",
          ),
        ),
      }),
    },
    portada: objeto({
      lineas: { type: "array", items: texto(), description: "3–4 líneas cortas en MAYÚSCULAS (≤ 13 caracteres cada una) que forman el gancho" },
      resaltar: { type: "integer", description: "índice (desde 0) de la línea que va en amarillo" },
      escena: texto("id de la escena más vistosa"),
      segundo: numero("segundo absoluto del video, dentro de esa escena y cuando casi todo ya está dibujado"),
      foto: nulable(texto("foto de fondo de la portada (nombre exacto de la lista de medios); null = sin foto")),
    }),
  });
}

/** Cuenta propiedades totales del esquema (la API admite hasta 5000). */
export function contarPropiedades(s) {
  let n = 0;
  const rec = (x) => {
    if (!x || typeof x !== "object") return;
    if (x.properties) {
      n += Object.keys(x.properties).length;
      Object.values(x.properties).forEach(rec);
    }
    if (x.items) rec(x.items);
    if (x.anyOf) x.anyOf.forEach(rec);
  };
  rec(s);
  return n;
}
