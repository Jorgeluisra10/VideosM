import { useLayoutEffect } from "react";
import { useCurrentFrame } from "remotion";

/**
 * Solo se monta en modo QA (scripts/qa.mjs). En cada fotograma mide en el DOM real todo
 * elemento con data-texto y lo escribe en consola como "[QA] {json}" para que el script
 * detecte textos fuera del margen horizontal (≥ 80 px) sin depender de estimaciones.
 */
export const SondaQA: React.FC = () => {
  const frame = useCurrentFrame();
  useLayoutEffect(() => {
    const items: Record<string, unknown>[] = [];
    document.querySelectorAll("[data-texto]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      let op = 1;
      let n: Element | null = el;
      while (n) {
        const o = parseFloat(getComputedStyle(n).opacity);
        if (!Number.isNaN(o)) op *= o;
        n = n.parentElement;
      }
      if (op < 0.4) return;
      items.push({
        k: el.getAttribute("data-texto"),
        x0: Math.round(r.left),
        x1: Math.round(r.right),
        y0: Math.round(r.top),
        y1: Math.round(r.bottom),
        op: Math.round(op * 100) / 100,
        txt: (el.textContent ?? "").slice(0, 48),
      });
    });
    console.log("[QA] " + JSON.stringify({ frame, items }));
  });
  return null;
};
