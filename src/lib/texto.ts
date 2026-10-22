/**
 * Medición de texto SIN React: la usan los componentes SVG y también el validador de Node
 * (scripts/ia/validar-plan.mjs, empaquetado con esbuild) para que ambos midan igual.
 */
export type Marcado = { texto: string; modo: "n" | "sub" | "sup" };

/** Soporta O_{2} y H^{+} para subíndices/superíndices sin depender de glifos Unicode raros. */
export function analizar(s: string): Marcado[] {
  const out: Marcado[] = [];
  const re = /([_^])\{([^}]*)\}/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > ultimo) out.push({ texto: s.slice(ultimo, m.index), modo: "n" });
    out.push({ texto: m[2], modo: m[1] === "_" ? "sub" : "sup" });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < s.length) out.push({ texto: s.slice(ultimo), modo: "n" });
  return out;
}

const FACTOR_PESO: Record<number, number> = { 500: 0.97, 600: 0.99, 700: 1, 800: 1.03, 900: 1.06 };

/** Ancho aproximado del texto en Inter, en px. Se contrasta con el QA que mide el DOM real. */
export function anchoEstimado(s: string, tam: number, peso = 700): number {
  let em = 0;
  for (const m of analizar(s)) {
    const esc = m.modo === "n" ? 1 : 0.65;
    for (const ch of m.texto) {
      let w = 0.575;
      if (ch === " ") w = 0.27;
      else if ("iljtfI.,:;'|!¡".includes(ch)) w = 0.3;
      else if ("rJ()-–·".includes(ch)) w = 0.4;
      else if ("mwMW@%".includes(ch)) w = 0.9;
      else if (/[A-ZÁÉÍÓÚÑ]/.test(ch)) w = 0.7;
      else if (/[0-9]/.test(ch)) w = 0.62;
      em += w * esc;
    }
  }
  return em * tam * (FACTOR_PESO[peso] ?? 1);
}
