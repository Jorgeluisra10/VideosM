import { continueRender, delayRender, staticFile } from "remotion";

const PESOS = [500, 600, 700, 800, 900] as const;
/** JetBrains Mono (estilo Retro-Científica: terminal, medidores y datos). Avance de caracter = 0,6 em. */
const PESOS_MONO = [400, 700] as const;
let iniciada = false;

/**
 * Carga Inter desde public/fonts (sin internet) y bloquea el render hasta que esté lista,
 * así ningún fotograma se captura con la tipografía de reserva.
 */
export function cargarFuentes(): void {
  if (iniciada || typeof document === "undefined") return;
  iniciada = true;
  const handle = delayRender("Cargando tipografía Inter", { timeoutInMilliseconds: 30000 });
  Promise.all([
    ...PESOS_MONO.map(async (peso) => {
      const cara = new FontFace("JetBrains Mono", `url(${staticFile(`fonts/jetbrains-mono-latin-${peso}-normal.woff2`)}) format("woff2")`, { weight: String(peso), style: "normal" });
      await cara.load();
      document.fonts.add(cara);
    }),
    ...PESOS.map(async (peso) => {
      const cara = new FontFace(
        "Inter",
        `url(${staticFile(`fonts/inter-latin-${peso}-normal.woff2`)}) format("woff2")`,
        { weight: String(peso), style: "normal" },
      );
      await cara.load();
      document.fonts.add(cara);
    }),
  ])
    .catch((e) => console.warn("[VideMed] No pude cargar Inter, uso tipografía del sistema:", e))
    .finally(() => continueRender(handle));
}
