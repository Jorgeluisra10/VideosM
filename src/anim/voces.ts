/**
 * VOZ EN OFF CON IA (puro): catálogo de voces de OpenAI, estilos colombianos y alegres (acento + tono + ritmo que se le piden al modelo con `instructions`),
 * costo estimado, textos por escena y la «firma» que dice si la voz generada sigue siendo válida para la animación actual.
 * El mismo código lo usan el panel (navegador), el generador (scripts/anim/voz.mjs) y el render.
 *
 * Nota: gpt-4o-mini-tts no tiene voces «por país»: las voces son las mismas para todos los idiomas y el acento (paisa, rolo, costeño…) se logra pidiéndoselo
 * en `instructions`. El resultado depende del modelo; por eso hay «Probar voz» y un campo de instrucciones propias.
 */

export const MODELO_TTS = "gpt-4o-mini-tts";
/** ≈ US$ 0,015 por minuto de audio (precio publicado de gpt-4o-mini-tts; verifica en tu cuenta). */
export const USD_POR_MINUTO_TTS = 0.015;
/** caracteres por segundo de una locución en español a ritmo normal (para estimar la duración antes de generar) */
export const CARACTERES_POR_SEGUNDO = 15;

export type VozOpenAI = { id: string; nombre: string; suena: "femenina" | "masculina" | "neutra"; nota: string };

/** Las 11 voces clásicas que acepta gpt-4o-mini-tts. */
export const VOCES_OPENAI: VozOpenAI[] = [
  { id: "coral", nombre: "Coral", suena: "femenina", nota: "cálida, expresiva y sonriente" },
  { id: "nova", nombre: "Nova", suena: "femenina", nota: "enérgica y juvenil" },
  { id: "shimmer", nombre: "Shimmer", suena: "femenina", nota: "clara, luminosa y alegre" },
  { id: "sage", nombre: "Sage", suena: "femenina", nota: "serena y cercana" },
  { id: "ash", nombre: "Ash", suena: "masculina", nota: "firme, amistosa y natural" },
  { id: "echo", nombre: "Echo", suena: "masculina", nota: "joven y clara" },
  { id: "ballad", nombre: "Ballad", suena: "masculina", nota: "narrativa y expresiva" },
  { id: "verse", nombre: "Verse", suena: "masculina", nota: "dinámica, de locutor" },
  { id: "onyx", nombre: "Onyx", suena: "masculina", nota: "grave y segura" },
  { id: "alloy", nombre: "Alloy", suena: "neutra", nota: "neutra y versátil" },
  { id: "fable", nombre: "Fable", suena: "neutra", nota: "narradora, de cuento" },
];

export type EstiloVoz = {
  id: string;
  etiqueta: string;
  /** voz base recomendada para este estilo */
  voz: string;
  /** cómo suena el acento (se pasa a `instructions`) */
  acento: string;
};

/** Estilos colombianos y alegres. Cada uno = voz base + acento; el tono alegre y el ritmo se añaden en `construirInstrucciones`. */
export const ESTILOS_VOZ: EstiloVoz[] = [
  { id: "rolo-f", etiqueta: "🏙️ Bogotana (rola) alegre · mujer", voz: "nova", acento: "bogotano (rolo): dicción clara y amable, entonación suave y cortés, sin dejos de otros países" },
  { id: "rolo-m", etiqueta: "🏙️ Bogotano (rolo) alegre · hombre", voz: "echo", acento: "bogotano (rolo): dicción clara y amable, entonación suave y cortés, sin dejos de otros países" },
  { id: "paisa-f", etiqueta: "⛰️ Paisa alegre · mujer (Medellín)", voz: "coral", acento: "paisa (Antioquia/Medellín): entonación cantadita y cálida, vocales abiertas, 's' suave, cercana y simpática" },
  { id: "paisa-m", etiqueta: "⛰️ Paisa alegre · hombre (Medellín)", voz: "ash", acento: "paisa (Antioquia/Medellín): entonación cantadita y cálida, vocales abiertas, 's' suave, cercano y simpático" },
  { id: "costena-f", etiqueta: "🌴 Costeña alegre · mujer (Caribe)", voz: "shimmer", acento: "costeño (Caribe colombiano): ritmo ligero y musical, 's' final aspirada, desparpajo y alegría contagiosa" },
  { id: "costeno-m", etiqueta: "🌴 Costeño alegre · hombre (Caribe)", voz: "ballad", acento: "costeño (Caribe colombiano): ritmo ligero y musical, 's' final aspirada, desparpajo y alegría contagiosa" },
  { id: "valluna-f", etiqueta: "💃 Caleña alegre · mujer (Valle)", voz: "nova", acento: "vallecaucano (Cali): ritmo vivo, melódico y enérgico, mucha chispa" },
  { id: "viral-m", etiqueta: "🎬 Locutor viral · hombre (neutro colombiano)", voz: "verse", acento: "neutro colombiano, con energía de creador de contenido" },
  { id: "viral-f", etiqueta: "🎬 Narradora viral · mujer (neutro colombiano)", voz: "sage", acento: "neutro colombiano, con energía de creadora de contenido" },
];

export type RitmoVoz = { id: string; etiqueta: string; frase: string };
export const RITMOS_VOZ: RitmoVoz[] = [
  { id: "pausado", etiqueta: "Pausado", frase: "Ritmo tranquilo, con pausas naturales entre frases." },
  { id: "normal", etiqueta: "Normal", frase: "Ritmo natural y fluido, como una conversación animada." },
  { id: "agil", etiqueta: "Ágil (reel)", frase: "Ritmo ágil y dinámico de reel, casi sin pausas largas, pero siempre claro." },
  { id: "muy-agil", etiqueta: "Muy ágil", frase: "Ritmo rápido y enérgico, claro en cada cifra, sin atropellarte." },
];

export const ESTILO_POR_DEFECTO = "rolo-f";
export const RITMO_POR_DEFECTO = "agil";

export const estiloPorId = (id: unknown): EstiloVoz | null => ESTILOS_VOZ.find((e) => e.id === id) ?? null;
export const vozPorId = (id: unknown): VozOpenAI | null => VOCES_OPENAI.find((v) => v.id === id) ?? null;

export type OpcionesVoz = { estilo?: string; voz?: string; ritmo?: string; extra?: string };

/**
 * Las `instructions` que se mandan a gpt-4o-mini-tts: acento colombiano, tono alegre, ritmo, claridad con las cifras y, si el usuario quiere, un texto propio.
 * Si hay `extra`, va al final y manda sobre lo demás.
 */
export function construirInstrucciones(o: OpcionesVoz = {}): string {
  const estilo = estiloPorId(o.estilo) ?? estiloPorId(ESTILO_POR_DEFECTO)!;
  const ritmo = RITMOS_VOZ.find((r) => r.id === o.ritmo) ?? RITMOS_VOZ.find((r) => r.id === RITMO_POR_DEFECTO)!;
  const extra = String(o.extra ?? "").trim().slice(0, 600);
  return [
    `Habla en español de Colombia con acento ${estilo.acento}. No uses acento de España, de México ni de Argentina.`,
    "Tono alegre, cálido y entusiasta: sonríe al hablar, como un creador de contenido joven que cuenta datos curiosos en un reel. Que se note la curiosidad y la sorpresa, sin exagerar ni sonar publicitario.",
    ritmo.frase,
    "Pronuncia las cifras, los años y los nombres propios con total claridad. Marca con énfasis el dato más importante de cada frase y deja caer la voz al final de las afirmaciones. Usa el tuteo. No suenes robótico ni de noticiero.",
    extra ? `Indicación extra del usuario (tiene prioridad): ${extra}` : "",
  ].filter(Boolean).join(" ");
}

/** Voz base efectiva: la elegida a mano, o la recomendada del estilo, o la del estilo por defecto. */
export function vozEfectiva(o: OpcionesVoz = {}): string {
  return vozPorId(o.voz)?.id ?? (estiloPorId(o.estilo) ?? estiloPorId(ESTILO_POR_DEFECTO)!).voz;
}

/** Limpia el texto de una escena para decirlo (sin asteriscos de énfasis ni espacios dobles). */
export const textoParaVoz = (s: unknown): string => String(s ?? "").replace(/\*/g, "").replace(/\s+/g, " ").trim();

export type TextoEscena = { n: number; inicio: number; dur: number; texto: string };

/** Lo que dice cada escena: `voz` (motor viral / estudio) o `vozOff`; las escenas sin texto de voz se omiten. */
export function textosVoz(anim: { escenas: { n: number; inicio?: number; dur?: number; voz?: string; vozOff?: string }[] } | null | undefined): TextoEscena[] {
  if (!anim?.escenas) return [];
  return anim.escenas
    .map((e) => ({ n: e.n, inicio: Number(e.inicio ?? 0), dur: Number(e.dur ?? 0), texto: textoParaVoz(e.voz ?? e.vozOff ?? "") }))
    .filter((e) => e.texto.length > 0 && e.dur > 0);
}

/** hash FNV-1a de 53 bits (hex de 14), sin dependencias: sirve en Node y en el navegador */
export function huella(s: string): string {
  let h1 = 0xdeadbeef ^ s.length, h2 = 0x41c6ce57 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, "0");
}

/** Firma de la animación para la voz: textos + tiempos de cada escena. Si cambia algo de eso, la voz generada ya no corresponde. */
export const firmaVoz = (anim: Parameters<typeof textosVoz>[0]): string => huella(JSON.stringify(textosVoz(anim).map((e) => [e.n, Math.round(e.inicio * 100), Math.round(e.dur * 100), e.texto])));

export type EstimacionVoz = { escenas: number; caracteres: number; segundos: number; usd: number };

/** Cuánto costaría y cuánto duraría la voz de la animación actual (estimado; el real lo da la API). */
export function estimarVoz(anim: Parameters<typeof textosVoz>[0]): EstimacionVoz {
  const t = textosVoz(anim);
  const caracteres = t.reduce((a, e) => a + e.texto.length, 0);
  const segundos = caracteres / CARACTERES_POR_SEGUNDO;
  return { escenas: t.length, caracteres, segundos, usd: Math.round((segundos / 60) * USD_POR_MINUTO_TTS * 10000) / 10000 };
}

/** Ajuste de una frase a su escena: si la voz dura más que el espacio disponible se acelera (hasta ×1,35); si aun así no cabe se avisa. */
export const TEMPO_MAX = 1.35;
export const COLA_ESCENA = 0.35; // s de silencio que se deja al final de cada escena
export const ENTRADA_VOZ = 0.2; // s que tarda en arrancar la voz dentro de la escena
export function ajusteTempo(durVoz: number, durEscena: number): { tempo: number; cabe: boolean; sobra: number } {
  const disp = Math.max(0.5, durEscena - COLA_ESCENA - ENTRADA_VOZ);
  if (durVoz <= disp) return { tempo: 1, cabe: true, sobra: 0 };
  const necesario = durVoz / disp;
  const tempo = Math.min(TEMPO_MAX, necesario);
  return { tempo, cabe: necesario <= TEMPO_MAX + 1e-9, sobra: Math.max(0, durVoz / tempo - disp) };
}

/** Clave de caché de una frase: misma voz + instrucciones + modelo + texto → mismo audio (no se paga dos veces). */
export const claveCacheVoz = (modelo: string, voz: string, instrucciones: string, texto: string): string => huella([modelo, voz, instrucciones, texto].join("\u0001"));
