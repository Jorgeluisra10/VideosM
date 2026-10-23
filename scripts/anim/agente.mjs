/**
 * Generación de la animación con OpenAI (Chat Completions + JSON Schema estricto) y costo real en USD.
 *
 *   1. El guion en bloques se interpreta LOCALMENTE (parser TypeScript, sin IA): tiempos, modos, duraciones.
 *   2. UNA llamada a la IA devuelve las instrucciones geométricas de todas las escenas (SVG y 3D).
 *   3. Saneado + validación local; solo si queda algo irreparable se hace una llamada de reparación acotada a esas escenas.
 *   4. El costo se calcula con response.usage.prompt_tokens / completion_tokens × el precio del modelo elegido.
 * No hay TTS ni subtítulos: la locución se graba fuera.
 */
import { Cliente } from "../ia/cliente.mjs";
import { configuracion } from "../ia/entorno.mjs";
import { cargarNucleoAnim } from "./nucleo.mjs";
import { ensamblarLibre } from "./libre.mjs";

export class ErrorGuion extends Error {
  constructor(errores) {
    super(errores.join("\n"));
    this.name = "ErrorGuion";
    this.errores = errores;
  }
}

const MAX_REPARACIONES = 2;

/**
 * @param {{guion:string, modelo?:string, sfx?:boolean, paleta?:string, log?:(s:string)=>void, cfg?:object}} o
 * @returns {Promise<{anim:object, correcciones:string[], uso:{modelo:string,prompt_tokens:number,completion_tokens:number,costo_usd:number,llamadas:number}}>}
 */
export async function generarAnimacion({ guion, modelo = "gpt-4.1-mini", sfx = true, paleta = "imnoba", log = () => {}, cfg = configuracion(), verificar = true, motor = process.env.VIDEMED_MOTOR || "viral" }) {
  const N = await cargarNucleoAnim();
  // formato estructurado ([CONFIG], FONDO, GEO, HUD…): la IA solo dibuja el escenario central; todo lo demás se resuelve aquí
  if (N.detectarFormato(guion) === "estructurado") return generarEstructurado({ N, guion, modelo, sfx, paleta, log, cfg });
  // MOTOR VIRAL (por defecto): una frase de idea → reel completo (la IA escribe la locución y elige las plantillas); los guiones en bloques también pasan por aquí
  if (motor === "viral") return generarViral({ N, guion, modelo, sfx, paleta, log, cfg });
  if (N.esIdea(guion)) throw new ErrorGuion([`Con el motor «${motor}» el texto tiene que ir en bloques [ESCENA 1 | 0s-7s | MODO: SVG]. Para escribir solo una frase de idea usa el motor viral (el de siempre).`]);
  // MOTOR DE ESTUDIO ([ESCENA 1 | 0s-7s | MODO: SVG]): la IA solo devuelve un JSON ultraligero de decisiones de diseño con figuras halftone
  if (motor === "estudio") return generarEstudio({ N, guion, modelo, sfx, paleta, log, cfg });
  // motor clásico (VIDEMED_MOTOR=clasico): lienzo libre = la IA escribe cada escena como código; simple = geometría SVG/3D completa
  if (N.detectarFormato(guion) === "libre") return generarLibre({ N, guion, modelo, sfx, paleta, log, cfg, verificar });
  const parsed = N.parsearGuion(guion);
  if (parsed.errores.length) throw new ErrorGuion(parsed.errores);
  for (const a of parsed.avisos) log(`   ⚠ ${a}`);

  const m = N.modeloPorId(modelo);
  const opciones = { paleta, sfx, svg: parsed.escenas.some((e) => e.modo === "SVG"), tres: parsed.escenas.some((e) => e.modo === "3D") };
  const esquema = N.esquemaAnimacion(opciones);
  const sistema = N.sistemaAnimacion(opciones);

  // Solo los modelos «o» razonan; para el resto no se envía reasoning_effort.
  const cliente = new Cliente({ ...cfg, modelo, modeloPlan: "", modeloVision: "", modeloRevisor: "", esfuerzo: m.razonador ? "medium" : "" }, { log });
  cliente.estilo = "chat";

  const uso = { modelo, prompt_tokens: 0, completion_tokens: 0, costo_usd: 0, llamadas: 0 };
  const llamar = async (entrada, etiqueta) => {
    log(`🤖 ${etiqueta} (${modelo})…`);
    const r = await cliente.pedir({ nombre: esquema.name, esquema: esquema.schema, instrucciones: sistema, entrada, maxSalida: m.maxSalida });
    uso.prompt_tokens += r.entrada;
    uso.completion_tokens += r.salida;
    uso.llamadas++;
    uso.costo_usd = N.costoUSD(modelo, uso.prompt_tokens, uso.completion_tokens);
    log(`   ✔ ${r.entrada} tokens de entrada · ${r.salida} de salida · ${(r.ms / 1000).toFixed(1)} s · acumulado ${N.formatoUSD(uso.costo_usd, 5)}`);
    return r.datos;
  };

  let raw = await llamar(N.promptUsuario(parsed.escenas), `Dibujando ${parsed.escenas.length} escenas`);
  let r = N.ensamblar(raw, parsed.escenas, { paleta, sfx });
  for (let ronda = 1; !r.anim && ronda <= MAX_REPARACIONES; ronda++) {
    const malas = new Set(r.errores.map((e) => Number(e.match(/^Escena (\d+)/)?.[1])).filter(Boolean));
    if (!malas.size) break;
    log(`🔧 Reparación ${ronda}/${MAX_REPARACIONES}: ${r.errores.slice(0, 3).join(" | ")}`);
    const pendientes = parsed.escenas.filter((e) => malas.has(e.n));
    const previas = (raw.escenas ?? []).filter((e) => malas.has(Number(e?.n)));
    const entrada = `${N.promptUsuario(pendientes)}\n\nTu respuesta anterior para estas escenas tuvo errores:\n${r.errores.map((e) => `- ${e}`).join("\n")}\n\nRespuesta anterior (corrígela):\n${JSON.stringify(previas)}\n\nDevuelve SOLO estas escenas (${[...malas].join(", ")}), completas y corregidas.`;
    const arreglo = await llamar(entrada, `Reparando ${malas.size} escena(s)`);
    const porN = new Map((arreglo.escenas ?? []).map((e) => [Number(e?.n), e]));
    raw = { ...raw, escenas: (raw.escenas ?? []).map((e) => porN.get(Number(e?.n)) ?? e).concat([...porN.values()].filter((e) => !(raw.escenas ?? []).some((x) => Number(x?.n) === Number(e?.n)))) };
    r = N.ensamblar(raw, parsed.escenas, { paleta, sfx });
  }
  if (!r.anim) throw new Error(`La IA no logró una animación válida tras ${MAX_REPARACIONES} reparaciones:\n${r.errores.join("\n")}`);
  r.anim.uso = uso;
  for (const c of r.correcciones) log(`   ~ ${c}`);
  return { anim: r.anim, correcciones: r.correcciones, uso };
}


/**
 * MOTOR VIRAL: de UNA FRASE a un reel completo. Una llamada barata con `response_format: json_object` (prompt de sistema estático y cacheable): la IA escribe la locución de cada
 * escena, decide su duración y elige una de las 10 plantillas de reel; el motor de Remotion (src/viral/) las dibuja. No hay reparaciones costosas: lo que venga mal se sanea
 * en local. Si la IA devuelve muy pocas escenas se vuelve a pedir UNA vez. También acepta guiones en bloques (la locución y los tiempos son los del guion).
 */
async function generarViral({ N, guion, modelo, sfx, paleta, log, cfg }) {
  const idea = N.esIdea(guion);
  const parsedIdea = idea ? N.parsearIdea(guion) : null;
  const parsedBloques = idea ? null : N.parsearEstudio(guion);
  const errores = idea ? parsedIdea.errores : parsedBloques.errores;
  if (errores.length) throw new ErrorGuion(errores);
  for (const a of idea ? parsedIdea.avisos : parsedBloques.avisos) log(`   ⚠ ${a}`);
  const m = N.modeloPorId(modelo);
  const cliente = new Cliente({ ...cfg, modelo, modeloPlan: "", modeloVision: "", modeloRevisor: "", esfuerzo: m.razonador ? "low" : "" }, { log });
  cliente.estilo = "chat";
  const sistema = N.sistemaViral();

  const uso = { modelo, prompt_tokens: 0, completion_tokens: 0, costo_usd: 0, llamadas: 0 };
  const llamar = async (entrada, escenas, etiqueta) => {
    log(`🤖 ${etiqueta} (${modelo})…`);
    const maxSalida = Math.min(m.maxSalida, (m.razonador ? 6000 : 0) + 900 + 280 * escenas);
    const r = await cliente.pedir({ nombre: "viral_json", modoInicial: "objeto", esquema: null, instrucciones: sistema, entrada, maxSalida });
    uso.prompt_tokens += r.entrada;
    uso.completion_tokens += r.salida;
    uso.llamadas++;
    uso.costo_usd = N.costoUSD(modelo, uso.prompt_tokens, uso.completion_tokens);
    log(`   ✔ ${r.entrada} tokens de entrada · ${r.salida} de salida · ${(r.ms / 1000).toFixed(1)} s · acumulado ${N.formatoUSD(uso.costo_usd, 5)}`);
    return r.datos;
  };
  const lista = (d) => (Array.isArray(d?.scenes) ? d.scenes : Array.isArray(d?.escenas) ? d.escenas : []);

  let r;
  if (idea) {
    log(`   Idea: «${parsedIdea.idea.slice(0, 110)}${parsedIdea.idea.length > 110 ? "…" : ""}» · ≈ ${parsedIdea.duracion} s · ≈ ${parsedIdea.escenasObjetivo} escenas`);
    const pedido = N.promptUsuarioIdea({ ...parsedIdea, paleta });
    let raw = await llamar(pedido, parsedIdea.escenasObjetivo, `Escribiendo el guion y diseñando ${parsedIdea.escenasObjetivo} escenas (JSON compacto)`);
    if (lista(raw).length < 4) {
      log(`🔧 La IA devolvió solo ${lista(raw).length} escena(s): se pide de nuevo.`);
      raw = await llamar(`${pedido}\n\nTu respuesta anterior tuvo muy pocas escenas. Devuelve el video completo con ${parsedIdea.escenasObjetivo} escenas en "scenes".`, parsedIdea.escenasObjetivo, "Reintentando el guion completo");
      if (lista(raw).length < 3) throw new Error("La IA no devolvió un guion con escenas suficientes. Prueba con otro modelo o reformula la idea.");
    }
    r = N.ensamblarViral(raw, { modo: "idea", paleta, sfx });
  } else {
    log(`   Bloques: la locución y los tiempos son los de tu guion; la IA solo elige la plantilla de cada una de las ${parsedBloques.escenas.length} escenas.`);
    const escenas = parsedBloques.escenas;
    const raw = await llamar(N.promptUsuarioBloques(escenas, paleta), escenas.length, `Diseñando ${escenas.length} escenas (JSON compacto)`);
    r = N.ensamblarViral(raw, { modo: "bloques", escenas, paleta, sfx });
    if (r.sinRespuesta.length) {
      const faltan = escenas.filter((e) => r.sinRespuesta.includes(e.n));
      log(`🔧 La IA no devolvió ${faltan.length} escena(s) (${r.sinRespuesta.join(", ")}): se piden de nuevo.`);
      const extra = await llamar(N.promptUsuarioBloques(faltan, paleta), faltan.length, `Completando ${faltan.length} escena(s)`);
      r = N.ensamblarViral({ scenes: [...lista(raw), ...lista(extra)] }, { modo: "bloques", escenas, paleta, sfx });
    }
  }
  r.anim.uso = uso;
  for (const c of r.correcciones) log(`   ~ ${c}`);
  log(`   🎬 «${r.titulo}» · ${r.anim.escenas.length} escenas · ${r.anim.duracion} s (${[...new Set(r.anim.escenas.map((e) => e.t))].join(", ")})`);
  return { anim: r.anim, correcciones: r.correcciones, uso, locucion: r.locucion, formato: "viral", rescatadas: [] };
}


/**
 * MOTOR DE ESTUDIO. Una sola llamada con `response_format: json_object` y un prompt de sistema compacto (reglas y vocabulario al principio, idénticos en cada
 * llamada → prompt caching automático). La IA devuelve ~120 tokens por escena: layout, titular, figura principal/secundaria y datos de comparación.
 * El motor de Remotion dibuja todo; lo que falte o esté fuera del vocabulario se completa con las reglas locales, así que no hay reparaciones costosas.
 * Solo viajan la DIRECCION_VISUAL y la VOZ_OFF de cada escena (como contexto para el titular y los datos); tiempos, SFX y paleta se quedan en tu equipo.
 */
async function generarEstudio({ N, guion, modelo, sfx, paleta, log, cfg }) {
  const parsed = N.parsearEstudio(guion);
  if (parsed.errores.length) throw new ErrorGuion(parsed.errores);
  for (const a of parsed.avisos) log(`   ⚠ ${a}`);
  const m = N.modeloPorId(modelo);
  const cliente = new Cliente({ ...cfg, modelo, modeloPlan: "", modeloVision: "", modeloRevisor: "", esfuerzo: m.razonador ? "low" : "" }, { log });
  cliente.estilo = "chat";
  const sistema = N.sistemaEstudio();

  const uso = { modelo, prompt_tokens: 0, completion_tokens: 0, costo_usd: 0, llamadas: 0 };
  const llamar = async (escenas, etiqueta) => {
    log(`🤖 ${etiqueta} (${modelo})…`);
    const maxSalida = Math.min(m.maxSalida, (m.razonador ? 6000 : 0) + 800 + 300 * escenas.length);
    const r = await cliente.pedir({ nombre: "estudio_json", modoInicial: "objeto", esquema: null, instrucciones: sistema, entrada: N.promptUsuarioEstudio(escenas), maxSalida });
    uso.prompt_tokens += r.entrada;
    uso.completion_tokens += r.salida;
    uso.llamadas++;
    uso.costo_usd = N.costoUSD(modelo, uso.prompt_tokens, uso.completion_tokens);
    log(`   ✔ ${r.entrada} tokens de entrada · ${r.salida} de salida · ${(r.ms / 1000).toFixed(1)} s · acumulado ${N.formatoUSD(uso.costo_usd, 5)}`);
    return r.datos;
  };

  log(`   Motor de estudio: a la IA solo viajan la DIRECCION_VISUAL y la VOZ de ${parsed.escenas.length} escenas (${parsed.caracteresIA} caracteres); tiempos, SFX y paleta se resuelven aquí.`);
  const raw = await llamar(parsed.escenas, `Diseñando ${parsed.escenas.length} escenas (JSON compacto)`);
  let r = N.ensamblarEstudio(raw, parsed.escenas, { paleta, sfx });
  // si la IA se dejó escenas sin devolver, se las pide UNA vez (solo esas); si aun así faltan, las diseñan las reglas locales
  if (r.sinRespuesta.length) {
    const faltan = parsed.escenas.filter((e) => r.sinRespuesta.includes(e.n));
    log(`🔧 La IA no devolvió ${faltan.length} escena(s) (${r.sinRespuesta.join(", ")}): se piden de nuevo.`);
    const extra = await llamar(faltan, `Completando ${faltan.length} escena(s)`);
    const unidas = [...(raw.scenes ?? raw.escenas ?? []), ...(extra.scenes ?? extra.escenas ?? [])];
    r = N.ensamblarEstudio({ scenes: unidas }, parsed.escenas, { paleta, sfx });
    if (r.sinRespuesta.length) log(`   ⚠ Escenas diseñadas con las reglas locales: ${r.sinRespuesta.join(", ")}`);
  }
  r.anim.uso = uso;
  for (const c of r.correcciones) log(`   ~ ${c}`);
  log(`   🎬 ${r.anim.escenas.length} escenas de estudio listas (${[...new Set(r.anim.escenas.map((e) => e.layout))].join(", ")})`);
  return { anim: r.anim, correcciones: r.correcciones, uso, locucion: N.textoLocucion(parsed.escenas.map((e) => ({ ...e, vozOff: e.voz })), r.anim.titulo), formato: "estudio", rescatadas: [] };
}


/**
 * Formato estructurado: a OpenAI viajan ÚNICAMENTE el MODO, la duración, el fondo y las líneas GEO de cada escena (más un prompt de sistema
 * compacto y el esquema estricto). Título, subtítulo, HUD, sonido y locución (VOZ_OFF) nunca salen de tu equipo.
 */
async function generarEstructurado({ N, guion, modelo, sfx, paleta, log, cfg }) {
  const parsed = N.parsearEstructurado(guion);
  if (parsed.errores.length) throw new ErrorGuion(parsed.errores);
  for (const a of parsed.avisos) log(`   ⚠ ${a}`);
  const paletaEf = N.paletaRetroDe(paleta);
  if (paletaEf !== paleta) log(`   ℹ El formato estructurado usa el diseño Retro-Científico: la paleta «${paleta}» pasa a «${paletaEf}».`);

  const m = N.modeloPorId(modelo);
  const opciones = { paleta: paletaEf, svg: parsed.escenas.some((e) => e.modo === "SVG"), tres: parsed.escenas.some((e) => e.modo === "3D"), mixto: parsed.escenas.some((e) => e.mixto), hud: parsed.config.hud };
  const esquema = N.esquemaGeometria(opciones);
  const sistema = N.sistemaGeo(opciones);
  const cliente = new Cliente({ ...cfg, modelo, modeloPlan: "", modeloVision: "", modeloRevisor: "", esfuerzo: m.razonador ? "medium" : "" }, { log });
  cliente.estilo = "chat";

  const uso = { modelo, prompt_tokens: 0, completion_tokens: 0, costo_usd: 0, llamadas: 0 };
  const llamar = async (entrada, etiqueta) => {
    log(`🤖 ${etiqueta} (${modelo})…`);
    const r = await cliente.pedir({ nombre: esquema.name, esquema: esquema.schema, instrucciones: sistema, entrada, maxSalida: m.maxSalida });
    uso.prompt_tokens += r.entrada;
    uso.completion_tokens += r.salida;
    uso.llamadas++;
    uso.costo_usd = N.costoUSD(modelo, uso.prompt_tokens, uso.completion_tokens);
    log(`   ✔ ${r.entrada} tokens de entrada · ${r.salida} de salida · ${(r.ms / 1000).toFixed(1)} s · acumulado ${N.formatoUSD(uso.costo_usd, 5)}`);
    return r.datos;
  };

  log(`   Se envían solo ${parsed.lineasGeo} línea(s) GEO (${parsed.caracteresGeo} caracteres); título, HUD, sonido y VOZ_OFF se quedan en tu equipo.`);
  let raw = await llamar(N.promptUsuarioGeo(parsed.escenas), `Dibujando el escenario de ${parsed.escenas.length} escenas`);
  let r = N.ensamblarGeo(raw, parsed.escenas, parsed.config, { paleta: paletaEf, sfx });
  for (let ronda = 1; !r.anim && ronda <= MAX_REPARACIONES; ronda++) {
    const malas = new Set(r.errores.map((e) => Number(e.match(/^Escena (\d+)/)?.[1])).filter(Boolean));
    if (!malas.size) break;
    log(`🔧 Reparación ${ronda}/${MAX_REPARACIONES}: ${r.errores.slice(0, 3).join(" | ")}`);
    const pendientes = parsed.escenas.filter((e) => malas.has(e.n));
    const previas = (raw.escenas ?? []).filter((e) => malas.has(Number(e?.n)));
    const entrada = `${N.promptUsuarioGeo(pendientes)}\n\nTu respuesta anterior para estas escenas tuvo errores:\n${r.errores.map((e) => `- ${e}`).join("\n")}\n\nRespuesta anterior (corrígela):\n${JSON.stringify(previas)}\n\nDevuelve SOLO estas escenas (${[...malas].join(", ")}), completas y corregidas.`;
    const arreglo = await llamar(entrada, `Reparando ${malas.size} escena(s)`);
    const porN = new Map((arreglo.escenas ?? []).map((e) => [Number(e?.n), e]));
    raw = { ...raw, escenas: (raw.escenas ?? []).map((e) => porN.get(Number(e?.n)) ?? e) };
    r = N.ensamblarGeo(raw, parsed.escenas, parsed.config, { paleta: paletaEf, sfx });
  }
  if (!r.anim) throw new Error(`La IA no logró una geometría válida tras ${MAX_REPARACIONES} reparaciones:\n${r.errores.join("\n")}`);
  r.anim.uso = uso;
  for (const c of r.correcciones) log(`   ~ ${c}`);
  return { anim: r.anim, correcciones: r.correcciones, uso, locucion: N.textoLocucion(parsed.escenas, r.anim.titulo), formato: "estructurado" };
}


/**
 * LIENZO LIBRE. Una llamada a OpenAI devuelve el CÓDIGO de cada escena (React/SVG/Three.js con el Kit de Pinceles). Después:
 *   1. política de seguridad + compilación local (esbuild): lo que falle se repara con una llamada acotada a esas escenas;
 *   2. verificación en Chrome real (errores de ejecución, texto fuera del lienzo, escenas vacías o congeladas) y reparación acotada;
 *   3. lo que aún falle se sustituye por una escena de rescate (el video siempre se puede renderizar).
 * El costo real suma TODAS las llamadas (generación + reparaciones).
 */
async function generarLibre({ N, guion, modelo, sfx, paleta, log, cfg, verificar }) {
  const parsed = N.parsearLibre(guion);
  if (parsed.errores.length) throw new ErrorGuion(parsed.errores);
  for (const a of parsed.avisos) log(`   ⚠ ${a}`);
  const m = N.modeloPorId(modelo);
  const esquema = N.esquemaLibre({ sfx });
  const sistema = N.sistemaLibre({ paleta, sfx });
  const cliente = new Cliente({ ...cfg, modelo, modeloPlan: "", modeloVision: "", modeloRevisor: "", esfuerzo: m.razonador ? "medium" : "" }, { log });
  cliente.estilo = "chat";

  const uso = { modelo, prompt_tokens: 0, completion_tokens: 0, costo_usd: 0, llamadas: 0 };
  const llamar = async (entrada, etiqueta) => {
    log(`🤖 ${etiqueta} (${modelo})…`);
    const r = await cliente.pedir({ nombre: esquema.name, esquema: esquema.schema, instrucciones: sistema, entrada, maxSalida: m.maxSalida });
    uso.prompt_tokens += r.entrada;
    uso.completion_tokens += r.salida;
    uso.llamadas++;
    uso.costo_usd = N.costoUSD(modelo, uso.prompt_tokens, uso.completion_tokens);
    log(`   ✔ ${r.entrada} tokens de entrada · ${r.salida} de salida · ${(r.ms / 1000).toFixed(1)} s · acumulado ${N.formatoUSD(uso.costo_usd, 5)}`);
    return r.datos;
  };
  const numerosDe = (errores) => new Set(errores.map((e) => Number(e.match(/^Escena (\d+)/)?.[1])).filter(Boolean));

  log(`   Dirección de arte libre: la IA recibe la duración, la DIRECCION_VISUAL y la VOZ (solo como contexto) de ${parsed.escenas.length} escenas.`);
  let raw = await llamar(N.promptUsuarioLibre(parsed.escenas), `Escribiendo ${parsed.escenas.length} escenas (React/SVG/3D sobre todo el lienzo)`);

  /** Pide de nuevo SOLO las escenas indicadas, con sus errores y su código anterior (recortado), y las mezcla en `raw`. */
  const reparar = async (malas, errores, etiqueta) => {
    const pendientes = parsed.escenas.filter((e) => malas.has(e.n));
    const previas = (raw.escenas ?? []).filter((e) => malas.has(Number(e?.n))).map((e) => ({ n: e.n, codigo: String(e.codigo ?? "").slice(0, 4500) }));
    const entrada = `${N.promptUsuarioLibre(pendientes)}\n\nTu código anterior para estas escenas tuvo errores:\n${errores.filter((x) => malas.has(Number(x.match(/^Escena (\d+)/)?.[1]))).map((x) => `- ${x}`).join("\n")}\n\nCódigo anterior (corrígelo; mantén la idea visual):\n${JSON.stringify(previas)}\n\nDevuelve SOLO estas escenas (${[...malas].join(", ")}), completas y corregidas.`;
    const arreglo = await llamar(entrada, `${etiqueta} (${malas.size} escena${malas.size > 1 ? "s" : ""})`);
    const porN = new Map((arreglo.escenas ?? []).map((e) => [Number(e?.n), e]));
    raw = { ...raw, escenas: (raw.escenas ?? []).map((e) => porN.get(Number(e?.n)) ?? e) };
  };
  const armar = (rescate) => ensamblarLibre(raw, parsed.escenas, { paleta, sfx, rescate });

  // 1) política + compilación
  let r = await armar(false);
  for (let ronda = 1; !r.anim && ronda <= MAX_REPARACIONES; ronda++) {
    log(`🔧 Reparación ${ronda}/${MAX_REPARACIONES}: ${r.errores.slice(0, 3).join(" | ")}`);
    await reparar(numerosDe(r.errores), r.errores, "Reparando el código");
    r = await armar(false);
  }
  const rescatadas = new Set();
  if (!r.anim) {
    r = await armar(true);
    r.rescatadas.forEach((n) => rescatadas.add(n));
    log(`   ⚠ ${rescatadas.size} escena(s) no se pudieron reparar y se sustituyen por una escena sencilla de rescate: ${[...rescatadas].join(", ")}`);
  }

  // 2) verificación en el navegador
  if (verificar) {
    const { verificarEscenas } = await import("./verificar.mjs");
    for (let ronda = 0; ronda <= MAX_REPARACIONES; ronda++) {
      const v = await verificarEscenas(r.anim, { log });
      const malas = numerosDe(v.errores.filter((e) => !rescatadas.has(Number(e.match(/^Escena (\d+)/)?.[1]))));
      if (!malas.size) {
        log(v.errores.length ? "   ✔ verificación: solo quedan escenas de rescate" : "   ✔ verificación en Chrome: todas las escenas se ejecutan bien");
        break;
      }
      if (ronda === MAX_REPARACIONES) {
        malas.forEach((n) => rescatadas.add(n));
        r = await armar(true);
        const { aplicarRescate } = await import("./libre.mjs");
        await aplicarRescate(r.anim, [...rescatadas], parsed.escenas);
        log(`   ⚠ escenas de rescate tras agotar las reparaciones: ${[...rescatadas].join(", ")}`);
        break;
      }
      log(`🔧 Verificación ${ronda + 1}/${MAX_REPARACIONES}: ${v.errores.slice(0, 3).join(" | ")}`);
      await reparar(malas, v.errores, "Reparando lo que falló en el navegador");
      r = await armar(true);
      for (const n of rescatadas) if (!r.rescatadas.includes(n)) r.rescatadas.push(n);
    }
  }
  r.anim.uso = uso;
  for (const c of r.correcciones) log(`   ~ ${c}`);
  const sufijo = rescatadas.size ? ` (${rescatadas.size} simplificada${rescatadas.size > 1 ? "s" : ""})` : "";
  log(`   🎬 ${r.anim.escenas.length} escenas de lienzo libre listas${sufijo}`);
  return { anim: r.anim, correcciones: r.correcciones, uso, locucion: N.textoLocucion(parsed.escenas.map((e) => ({ ...e, vozOff: e.voz })), r.anim.titulo), formato: "libre", rescatadas: [...rescatadas] };
}
