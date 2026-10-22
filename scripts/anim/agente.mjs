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
export async function generarAnimacion({ guion, modelo = "gpt-4.1-mini", sfx = true, paleta = "imnoba", log = () => {}, cfg = configuracion() }) {
  const N = await cargarNucleoAnim();
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
