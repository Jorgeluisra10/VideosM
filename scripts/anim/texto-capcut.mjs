#!/usr/bin/env node
/**
 * TEXTO PARA CAPCUT: genera, desde la animación activa (src/data/animacion.json), el archivo listo para pegar en CapCut → «Texto a voz».
 * Lleva: los 3 pasos MUY simples, la tabla por escena (segundo de inicio, duración, frase), el texto corrido para pegar de una vez,
 * la pronunciación ya aplicada (pronunciacion.json + --fonetica) y un chequeo de que cada frase cabe en su escena con una voz lenta (2,4 palabras/s).
 *
 *   node scripts/anim/texto-capcut.mjs --salida=videos/AAAA-MM-DD-slug/texto-capcut.txt [--titulo="..."] [--fonetica="Schultz=Shults,Wolfram=Volfram"]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { cargarNucleoAnim, RAIZ } from "./nucleo.mjs";

const args = process.argv.slice(2);
const valor = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const abs = (p) => (isAbsolute(p) ? p : resolve(RAIZ, p));
const N = await cargarNucleoAnim();
const anim = JSON.parse(readFileSync(join(RAIZ, "src", "data", "animacion.json"), "utf8"));
const textos = N.textosVoz(anim);
if (!textos.length) { console.error("❌ La animación activa no trae texto de locución."); process.exit(1); }

let dic = {};
try { dic = Object.fromEntries(Object.entries(JSON.parse(readFileSync(join(RAIZ, "pronunciacion.json"), "utf8"))).filter(([k]) => !k.startsWith("_"))); } catch { /* sin diccionario */ }
const extra = (valor("fonetica") ?? "").split(",").map((s) => s.split("=")).filter((p) => p.length === 2);
for (const [k, v] of extra) dic[k.trim()] = v.trim();
const aplicar = (t) => Object.keys(dic).sort((a, b) => b.length - a.length).reduce((s, k) => s.split(k).join(dic[k]), t);

const f1 = (x) => x.toFixed(1).replace(".", ",");
const filas = textos.map((e) => {
  const texto = aplicar(e.texto);
  const palabras = texto.split(/\s+/).filter(Boolean).length;
  const lenta = palabras / 2.4 + 0.5; // segundos que ocupa con una voz lenta (2,4 palabras por segundo)
  return { ...e, texto, palabras, lenta, justo: lenta > e.dur + 0.05 };
});
const titulo = valor("titulo") ?? anim.titulo ?? "video";
const lineas = [];
lineas.push(`TEXTO PARA CAPCUT (Texto a voz) · ${titulo} · SINAPSIS`);
lineas.push("=".repeat(78), "");
lineas.push("LA FORMA MÁS FÁCIL (3 pasos, sin calibrar nada)");
lineas.push("  1. En CapCut: Texto → «Texto a voz». Pega TODO el bloque «TEXTO CORRIDO» de abajo en UN solo texto y elige la voz que más te guste (velocidad 1.0x; no la cambies).");
lineas.push("  2. Genera la voz y expórtala como AUDIO (mp3 o wav) o simplemente como el video con voz.");
lineas.push("  3. Mándame ese audio: yo cuento las pausas, ajusto la duración de cada escena a TU voz, mezclo todo a −14 LUFS y te devuelvo el video final con la voz ya puesta.");
lineas.push("     (Si prefieres hacerlo tú en tu computador: panel → Estudio → «Voz en off» → «Mi voz» → subes el audio y el video se ajusta solo.)");
lineas.push("");
lineas.push("SI NO PUEDES MANDARME EL AUDIO (opción manual)");
lineas.push("  • Crea un texto por escena en CapCut (la tabla de abajo) y colócalo en su segundo de inicio; genera la voz de cada uno con la MISMA voz.");
lineas.push("  • Las escenas están pensadas con holgura: con una voz normal (≥ 2,4 palabras por segundo) cada frase termina antes de que acabe su escena.");
lineas.push("  • Si una frase se pasa un poco, aumenta la velocidad de ESE clip a 1.1x o 1.2x.");
lineas.push("");
lineas.push("-".repeat(78));
lineas.push("TABLA POR ESCENA (inicio · duración · palabras · frase para pegar)");
lineas.push("-".repeat(78));
filas.forEach((e, i) => {
  lineas.push(`ESCENA ${i + 1} · ${f1(e.inicio)} s · ${f1(e.dur)} s · ${e.palabras} palabras${e.justo ? "  ⚠️ justa si tu voz es lenta" : ""}`);
  lineas.push(e.texto, "");
});
lineas.push("-".repeat(78));
lineas.push("TEXTO CORRIDO (pégalo entero en un solo texto de CapCut)");
lineas.push("-".repeat(78));
lineas.push(filas.map((e) => e.texto).join("\n\n"), "");
lineas.push("-".repeat(78));
lineas.push("NOTAS");
lineas.push("  • No hay cifras, siglas ni símbolos en el texto: cualquier voz lo lee igual.");
if (extra.length) lineas.push(`  • Pronunciación aplicada: ${extra.map(([k, v]) => `«${k.trim()}» → «${v.trim()}»`).join(" · ")} (en pantalla sí se ve el nombre correcto).`);
lineas.push("  • Si una voz lee raro una palabra (p. ej. un nombre), prueba otra voz de la lista (las latinas suelen salir mejor) o escríbela como suena.");
lineas.push("  • Música: va como cama suave (≈ −23 LUFS). Si tapa tu voz en CapCut, bájala a ~40 %.");
const salida = abs(valor("salida") ?? "texto-capcut.txt");
mkdirSync(dirname(salida), { recursive: true });
writeFileSync(salida, lineas.join("\n") + "\n");
console.log(`✅ ${salida} · ${filas.length} escenas${filas.some((e) => e.justo) ? " · ⚠️ alguna frase queda justa con voz lenta" : " · todas caben con voz lenta"}`);
