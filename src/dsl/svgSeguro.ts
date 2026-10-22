/**
 * Sanitizador del SVG libre que puede escribir la IA (elemento "svg-libre").
 * Solo deja pasar una lista blanca de etiquetas y atributos geométricos, colores de la paleta y
 * transformaciones numéricas. Nada de scripts, eventos, enlaces, url(), estilos ni imágenes.
 * Lógica pura: se usa en el render (defensa) y en el validador de Node (para avisar a la IA).
 */
export const ETIQUETAS_SVG = ["g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon", "text", "tspan"] as const;
const TAGS = new Set<string>(ETIQUETAS_SVG);
const ATRIBUTOS = new Set([
  "d", "cx", "cy", "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2", "width", "height", "points",
  "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-dasharray",
  "opacity", "fill-opacity", "stroke-opacity", "transform", "font-size", "font-weight", "text-anchor", "dx", "dy",
]);
const TOKENS_COLOR: Record<string, string> = {
  rojo: "#EF4444",
  azul: "#3B82F6",
  amarillo: "#FACC15",
  hueso: "#F8FAFC",
  panel: "#121A2B",
  fondo: "#0B0F19",
  ninguno: "none",
};
const MAX_CARACTERES = 8000;
const MAX_NODOS = 120;

export type ResultadoSvg = { markup: string; avisos: string[] };

function valorSeguro(attr: string, valor: string): string | null {
  const v = valor.trim();
  if (/url\s*\(|javascript:|data:|expression|&|<|>/i.test(v)) return null;
  if (attr === "fill" || attr === "stroke") {
    const t = v.toLowerCase();
    if (TOKENS_COLOR[t] !== undefined) return TOKENS_COLOR[t];
    if (t === "none") return "none";
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/.test(t)) return t;
    if (/^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(,\s*[\d.]+\s*)?\)$/.test(t)) return t;
    return null;
  }
  if (attr === "transform") {
    return /^(\s*(translate|rotate|scale|skewX|skewY|matrix)\([-\d.,\s]+\)\s*)+$/.test(v) ? v : null;
  }
  if (attr === "text-anchor") return ["start", "middle", "end"].includes(v) ? v : null;
  if (attr === "stroke-linecap") return ["butt", "round", "square"].includes(v) ? v : null;
  if (attr === "stroke-linejoin") return ["miter", "round", "bevel"].includes(v) ? v : null;
  if (attr === "d") return /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s-]+$/.test(v) ? v : null;
  if (attr === "points") return /^[-\d.,\s]+$/.test(v) ? v : null;
  if (attr === "stroke-dasharray") return /^[\d.,\s]+$/.test(v) ? v : null;
  if (attr === "font-weight") return /^(normal|bold|[1-9]00)$/.test(v) ? v : null;
  // numéricos (con o sin unidad %)
  return /^-?[\d.]+%?$/.test(v) ? v : null;
}

const escapar = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function sanitizarSvg(entrada: string): ResultadoSvg {
  const avisos: string[] = [];
  let src = String(entrada ?? "");
  if (src.length > MAX_CARACTERES) {
    avisos.push(`svg-libre recortado: más de ${MAX_CARACTERES} caracteres`);
    src = src.slice(0, MAX_CARACTERES);
  }
  const re = /<\s*(\/?)\s*([a-zA-Z][\w-]*)([^>]*?)(\/?)\s*>|([^<]+)/g;
  const pila: string[] = [];
  let out = "";
  let nodos = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m[5] !== undefined) {
      // texto: solo dentro de <text>/<tspan>
      if (pila.some((t) => t === "text" || t === "tspan") && m[5].trim()) out += escapar(m[5]);
      continue;
    }
    const cierre = m[1] === "/";
    const tag = m[2].toLowerCase();
    if (!TAGS.has(tag)) {
      if (!cierre) avisos.push(`etiqueta no permitida <${tag}> eliminada`);
      continue;
    }
    if (cierre) {
      const i = pila.lastIndexOf(tag);
      if (i >= 0) {
        while (pila.length > i + 1) out += `</${pila.pop()}>`;
        pila.pop();
        out += `</${tag}>`;
      }
      continue;
    }
    if (++nodos > MAX_NODOS) {
      avisos.push(`svg-libre recortado: más de ${MAX_NODOS} elementos`);
      break;
    }
    let attrs = "";
    const reA = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let a: RegExpExecArray | null;
    while ((a = reA.exec(m[3]))) {
      const nombre = a[1].toLowerCase();
      if (!ATRIBUTOS.has(nombre)) {
        avisos.push(`atributo no permitido "${nombre}" eliminado`);
        continue;
      }
      const v = valorSeguro(nombre, a[2] ?? a[3] ?? "");
      if (v === null) {
        avisos.push(`valor no permitido en ${nombre}="${(a[2] ?? a[3] ?? "").slice(0, 30)}" eliminado`);
        continue;
      }
      attrs += ` ${nombre}="${v}"`;
    }
    const autocierre = m[4] === "/";
    out += `<${tag}${attrs}${autocierre ? "/" : ""}>`;
    if (!autocierre) pila.push(tag);
  }
  while (pila.length) out += `</${pila.pop()}>`;
  return { markup: out, avisos };
}
