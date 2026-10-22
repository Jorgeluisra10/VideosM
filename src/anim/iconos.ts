import iconosPro from "../dsl/iconos-pro.json";

/** Iconos que la IA puede pedir, según la paleta (el esquema estricto solo admite estos nombres). */
const GENERALES = ["rayo", "reloj", "check", "cruz", "alerta", "interrogacion", "mas", "menos", "flecha-arriba", "flecha-abajo", "estrella", "calendario", "dinero", "sol"];
const INMOBILIARIA = ["casa", "cama", "bano", "auto", "medida", "pin", "llave", "piscina", "arbol", "escudo", "telefono", "whatsapp", "mail", "web"];
const MEDICOS = ["pildora", "jeringa", "gota", "bacteria", "virus"];
const LU_GENERALES = ["reloj", "calendario-ok", "telefono", "chat", "correo", "estrella", "verificado", "brillo", "diana", "idea", "premio", "porcentaje", "calculadora"];

export function iconosPermitidos(paleta: string): string[] {
  const lu = Object.keys(iconosPro.lu).map((k) => `lu-${k}`);
  if (paleta === "medicina") return [...GENERALES, ...MEDICOS, ...Object.keys(iconosPro.hi).map((k) => `hi-${k}`), ...LU_GENERALES.map((k) => `lu-${k}`)];
  return [...GENERALES, ...INMOBILIARIA, ...lu];
}

/** Todos los nombres válidos (para validar sin importar la paleta). */
export const todosLosIconos = (): string[] => [...new Set([...GENERALES, ...INMOBILIARIA, ...MEDICOS, ...Object.keys(iconosPro.hi).map((k) => `hi-${k}`), ...Object.keys(iconosPro.lu).map((k) => `lu-${k}`)])];
