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
  { id: "locutora", etiqueta: "🎙️ Locutora joven bogotana · alegre y cercana (por defecto)", voz: "coral", acento: "neutro colombiano de Bogotá, claro y amable" },
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

export const ESTILO_POR_DEFECTO = "locutora";
export const RITMO_POR_DEFECTO = "agil";

export const estiloPorId = (id: unknown): EstiloVoz | null => ESTILOS_VOZ.find((e) => e.id === id) ?? null;
export const vozPorId = (id: unknown): VozOpenAI | null => VOCES_OPENAI.find((v) => v.id === id) ?? null;

/** Las instrucciones por defecto de la locutora (se pueden cambiar en voz.config.json o desde el laboratorio de voz). */
export const INSTRUCCIONES_LOCUTORA = [
  "Eres una locutora colombiana de 24 años, de Bogotá. Hablas con acento neutro colombiano, claro y amable.",
  "Tu energía es alegre y positiva, con una sonrisa que se nota en la voz.",
  "Cuentas las cosas como si se las contaras a una amiga: natural, cercana, sin sonar a anuncio.",
  "Ritmo: ágil al inicio (el gancho) y más pausado en el dato importante. Haz pausas cortas entre ideas.",
  "Enfatiza las palabras clave con suavidad, sin gritar ni exagerar.",
  'Pronuncia "Imnoba" como "im-NO-ba". Nunca suenes robótica, monótona ni de noticiero.',
  "No uses acento de España, de México ni de Argentina.",
].join(" ");

export type ConfigVoz = { voz: string; modelo: string; instrucciones: string; velocidad: number; formato: string };
export const FORMATOS_VOZ = ["mp3", "wav", "aac", "flac", "opus"];
export const CONFIG_VOZ_POR_DEFECTO: ConfigVoz = { voz: "coral", modelo: MODELO_TTS, instrucciones: INSTRUCCIONES_LOCUTORA, velocidad: 1, formato: "mp3" };

/** Valida lo que llegue (archivo o panel): voz del catálogo, instrucciones acotadas, velocidad 0,5–1,5, formato conocido; lo que falle cae al valor por defecto. */
export function normalizarConfigVoz(x: unknown): ConfigVoz {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const d = CONFIG_VOZ_POR_DEFECTO;
  const vel = Number(o.velocidad);
  const ins = typeof o.instrucciones === "string" ? o.instrucciones.replace(/\s+/g, " ").trim().slice(0, 2000) : "";
  return {
    voz: vozPorId(o.voz)?.id ?? d.voz,
    modelo: d.modelo,
    instrucciones: ins || d.instrucciones,
    velocidad: Number.isFinite(vel) && vel >= 0.5 && vel <= 1.5 ? Math.round(vel * 100) / 100 : d.velocidad,
    formato: FORMATOS_VOZ.includes(String(o.formato)) ? String(o.formato) : d.formato,
  };
}

export type OpcionesVoz = { estilo?: string; voz?: string; ritmo?: string; extra?: string; instruccionesBase?: string; instrucciones?: string; vozPorDefecto?: string };

/**
 * Las `instructions` que se mandan a gpt-4o-mini-tts: acento colombiano, tono alegre, ritmo, claridad con las cifras y, si el usuario quiere, un texto propio.
 * Si hay `extra`, va al final y manda sobre lo demás.
 */
export function construirInstrucciones(o: OpcionesVoz = {}): string {
  // texto completo escrito a mano (laboratorio de voz): se usa tal cual
  const propias = String(o.instrucciones ?? "").replace(/\s+/g, " ").trim().slice(0, 2000);
  if (propias) return propias;
  const estilo = estiloPorId(o.estilo) ?? estiloPorId(ESTILO_POR_DEFECTO)!;
  const ritmo = RITMOS_VOZ.find((r) => r.id === o.ritmo) ?? RITMOS_VOZ.find((r) => r.id === RITMO_POR_DEFECTO)!;
  const extra = String(o.extra ?? "").trim().slice(0, 600);
  // la locutora por defecto: sus instrucciones (voz.config.json) ya traen el ritmo, el tono y la pronunciación de «Imnoba»
  if (estilo.id === "locutora") return [String(o.instruccionesBase ?? "").replace(/\s+/g, " ").trim().slice(0, 2000) || INSTRUCCIONES_LOCUTORA, extra ? `Indicación extra del usuario (tiene prioridad): ${extra}` : ""].filter(Boolean).join(" ");
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
  const estilo = estiloPorId(o.estilo) ?? estiloPorId(ESTILO_POR_DEFECTO)!;
  // la locutora por defecto usa la voz guardada en voz.config.json (la que elegiste en el laboratorio)
  return vozPorId(o.voz)?.id ?? (estilo.id === "locutora" ? vozPorId(o.vozPorDefecto)?.id : undefined) ?? estilo.voz;
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
export function ajusteTempo(durVoz: number, durEscena: number, tempoMax = TEMPO_MAX): { tempo: number; cabe: boolean; sobra: number } {
  const disp = Math.max(0.5, durEscena - COLA_ESCENA - ENTRADA_VOZ);
  if (durVoz <= disp) return { tempo: 1, cabe: true, sobra: 0 };
  const necesario = durVoz / disp;
  const tempo = Math.min(tempoMax, necesario);
  return { tempo, cabe: necesario <= tempoMax + 1e-9, sobra: Math.max(0, durVoz / tempo - disp) };
}

/** Clave de caché de una frase: misma voz + instrucciones + modelo + texto → mismo audio (no se paga dos veces). */
export const claveCacheVoz = (modelo: string, voz: string, instrucciones: string, texto: string): string => huella([modelo, voz, instrucciones, texto].join("\u0001"));

// ───────────────────────────── ElevenLabs (voz de estudio) ─────────────────────────────
// Los precios y los planes de ElevenLabs cambian: las cifras de abajo son una referencia para estimar ANTES de generar (verifícalas en elevenlabs.io/pricing).

export type MotorVoz = "openai" | "eleven";
export const MOTORES_VOZ: { id: MotorVoz; etiqueta: string }[] = [
  { id: "eleven", etiqueta: "ElevenLabs · voz de estudio (la más natural)" },
  { id: "openai", etiqueta: "OpenAI · gpt-4o-mini-tts (barata, con estilos colombianos)" },
];

export type ModeloEleven = { id: string; etiqueta: string; /** créditos que gasta cada carácter */ credito: number; /** US$ por 1.000 caracteres si se paga por uso de la API (referencia) */ usdPor1000Api: number };
export const MODELOS_ELEVEN: ModeloEleven[] = [
  { id: "eleven_multilingual_v2", etiqueta: "Multilingual v2 · la más natural y estable", credito: 1, usdPor1000Api: 0.1 },
  { id: "eleven_flash_v2_5", etiqueta: "Flash v2.5 · rápida y la mitad de costo", credito: 0.5, usdPor1000Api: 0.05 },
];
export const MODELO_ELEVEN_POR_DEFECTO = "eleven_multilingual_v2";

export type PerfilEleven = { id: string; etiqueta: string; estabilidad: number; similitud: number; estilo: number };
export const PERFILES_ELEVEN: PerfilEleven[] = [
  { id: "serena", etiqueta: "Serena y estable", estabilidad: 0.6, similitud: 0.8, estilo: 0.1 },
  { id: "equilibrada", etiqueta: "Equilibrada (recomendada)", estabilidad: 0.45, similitud: 0.8, estilo: 0.3 },
  { id: "expresiva", etiqueta: "Muy expresiva y alegre", estabilidad: 0.3, similitud: 0.8, estilo: 0.55 },
];
export const PERFIL_ELEVEN_POR_DEFECTO = "equilibrada";
/** velocidad nativa de ElevenLabs (0,7–1,2) según el ritmo elegido: así la voz no pierde calidad por acelerarla después */
export const VELOCIDAD_ELEVEN: Record<string, number> = { pausado: 0.92, normal: 1, agil: 1.06, "muy-agil": 1.12 };
/** hasta cuánto se acelera una frase de ElevenLabs para que quepa (más suena apurada) */
export const TEMPO_MAX_ELEVEN = 1.25;

export type PlanEleven = { id: string; nombre: string; usdMes: number; creditos: number; comercial: boolean };
export const PLANES_ELEVEN: PlanEleven[] = [
  { id: "free", nombre: "Free", usdMes: 0, creditos: 10000, comercial: false },
  { id: "starter", nombre: "Starter", usdMes: 6, creditos: 30000, comercial: true },
  { id: "creator", nombre: "Creator", usdMes: 22, creditos: 121000, comercial: true },
  { id: "pro", nombre: "Pro", usdMes: 99, creditos: 600000, comercial: true },
];

export const perfilElevenPorId = (id: unknown): PerfilEleven => PERFILES_ELEVEN.find((p) => p.id === id) ?? PERFILES_ELEVEN.find((p) => p.id === PERFIL_ELEVEN_POR_DEFECTO)!;
export const modeloElevenPorId = (id: unknown): ModeloEleven => MODELOS_ELEVEN.find((m) => m.id === id) ?? MODELOS_ELEVEN.find((m) => m.id === MODELO_ELEVEN_POR_DEFECTO)!;
/** El ID de una voz de ElevenLabs es alfanumérico (≈20 caracteres): cualquier otra cosa se descarta. */
export const sanearVoiceId = (x: unknown): string => { const s = String(x ?? "").trim(); return /^[A-Za-z0-9]{10,40}$/.test(s) ? s : ""; };
export const velocidadEleven = (ritmo: unknown): number => VELOCIDAD_ELEVEN[String(ritmo)] ?? VELOCIDAD_ELEVEN[RITMO_POR_DEFECTO];

export type EstimacionEleven = {
  escenas: number; caracteres: number; creditos: number; segundos: number;
  /** US$ si se paga por uso de la API */
  usdApi: number;
  /** por plan: cuántos videos como este caben en sus créditos de un mes y cuánto cuesta cada uno (prorrateado) */
  porPlan: { plan: PlanEleven; videos: number; usdPorVideo: number }[];
};

/** Cuánto gastaría la voz de la animación actual en ElevenLabs (créditos = caracteres × créditos por carácter del modelo). */
export function estimarVozEleven(anim: Parameters<typeof textosVoz>[0], modeloId?: string): EstimacionEleven {
  const m = modeloElevenPorId(modeloId);
  const t = textosVoz(anim);
  const caracteres = t.reduce((a, e) => a + e.texto.length, 0);
  const creditos = Math.round(caracteres * m.credito);
  return {
    escenas: t.length, caracteres, creditos, segundos: caracteres / CARACTERES_POR_SEGUNDO,
    usdApi: Math.round((caracteres / 1000) * m.usdPor1000Api * 10000) / 10000,
    porPlan: PLANES_ELEVEN.map((plan) => ({ plan, videos: creditos > 0 ? Math.floor(plan.creditos / creditos) : 0, usdPorVideo: Math.round((plan.usdMes / plan.creditos) * creditos * 1000) / 1000 })),
  };
}

export type AjustesEleven = { estabilidad: number; similitud: number; estilo: number; velocidad: number };
export const ajustesEleven = (perfil: unknown, ritmo: unknown): AjustesEleven => { const p = perfilElevenPorId(perfil); return { estabilidad: p.estabilidad, similitud: p.similitud, estilo: p.estilo, velocidad: velocidadEleven(ritmo) }; };

/** Clave de caché de una frase de ElevenLabs: misma voz + modelo + ajustes + texto (y vecinas, que cambian la entonación) → mismo audio (no se paga dos veces). */
export const claveCacheEleven = (modelo: string, voiceId: string, a: AjustesEleven, texto: string, previo = "", siguiente = ""): string =>
  huella(["eleven", modelo, voiceId, a.estabilidad, a.similitud, a.estilo, a.velocidad, texto, previo, siguiente].join("\u0001"));

/** Las frases vecinas que se mandan como contexto para que la entonación continúe de una escena a la siguiente. */
export function contextoFrases(textos: { texto: string }[], i: number): { previo: string; siguiente: string } {
  return { previo: i > 0 ? textos[i - 1].texto.slice(-280) : "", siguiente: i < textos.length - 1 ? textos[i + 1].texto.slice(0, 280) : "" };
}
