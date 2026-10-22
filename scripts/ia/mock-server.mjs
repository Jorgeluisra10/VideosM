#!/usr/bin/env node
/**
 * Servidor de pruebas que imita la API de OpenAI (GET /v1/models, POST /v1/responses y /v1/chat/completions).
 * Sirve para probar TODO el agente sin clave ni gasto: responde con los guiones y planes de /ejemplos
 * (con la forma exacta que exige el esquema estricto) y sabe simular fallos.
 *
 *   node scripts/ia/mock-server.mjs [puerto]       (por defecto 8787)
 *
 * Simulación de fallos (variables de entorno):
 *   MOCK_GUION_CORTO=1     la 1.ª respuesta de guion trae pocas palabras (prueba el bucle de longitud)
 *   MOCK_REVISION_FALLA=1  la revisión médica rechaza el guion una vez
 *   MOCK_PLAN_ERRORES=1    el 1.º plan sale con anclas inventadas y textos pisados (prueba la reparación)
 *   MOCK_PLAN_SIEMPRE_MAL=1  todos los planes salen defectuosos (prueba --emergencia y el código de salida 4)
 *   MOCK_CRITICA=1         la 1.ª crítica visual marca un problema grave
 *   MOCK_ERRORES=429:2     las 2 primeras peticiones fallan con ese código (prueba los reintentos)
 *   MOCK_SIN_RESPONSES=1   /responses devuelve 404 (prueba la caída a chat/completions)
 *   MOCK_WHISPER_ERRORES=1 la transcripción de /audio/transcriptions trae una palabra menos, una errata y una de más
 *
 * También simula la VOZ de producción:
 *   POST /v1/audio/speech            → un mp3 de ejemplo (gpt-4o-mini-tts)
 *   POST /v1/audio/transcriptions    → verbose_json con `words` (whisper-1), tiempos inventados a ≈ 0,34 s por palabra
 *   POST /v1/text-to-speech/:voz/with-timestamps → { audio_base64, alignment } de ElevenLabs (cabecera xi-api-key)
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { RAIZ, cargarCatalogo } from "./puente.mjs";

// ---------------------------------------------------------------------------
// Mini-validador de JSON Schema (solo lo que usan nuestros esquemas estrictos)
// ---------------------------------------------------------------------------
export function validarEsquema(v, s, ruta = "$", errores = []) {
  if (s.anyOf) {
    const intentos = s.anyOf.map((alt) => validarEsquema(v, alt, ruta, []));
    if (!intentos.some((e) => e.length === 0)) {
      // mensaje de la alternativa más cercana
      errores.push(`${ruta}: no cumple ninguna alternativa (${intentos.sort((a, b) => a.length - b.length)[0]?.[0] ?? "?"})`);
    }
    return errores;
  }
  if (Array.isArray(s.type)) {
    // unión de tipos, p. ej. ["string","null"] (valor opcional)
    if (v === null) return s.type.includes("null") ? errores : (errores.push(`${ruta}: no puede ser null`), errores);
    return validarEsquema(v, { ...s, type: s.type.find((t) => t !== "null") }, ruta, errores);
  }
  switch (s.type) {
    case "object": {
      if (v === null || typeof v !== "object" || Array.isArray(v)) return errores.push(`${ruta}: debería ser objeto`), errores;
      for (const k of s.required ?? []) if (!(k in v)) errores.push(`${ruta}.${k}: falta (el modo estricto exige todas las propiedades)`);
      for (const k of Object.keys(v)) {
        if (!s.properties[k]) errores.push(`${ruta}.${k}: propiedad no declarada`);
        else validarEsquema(v[k], s.properties[k], `${ruta}.${k}`, errores);
      }
      return errores;
    }
    case "array":
      if (!Array.isArray(v)) return errores.push(`${ruta}: debería ser lista`), errores;
      v.forEach((x, i) => validarEsquema(x, s.items, `${ruta}[${i}]`, errores));
      return errores;
    case "string":
      if (typeof v !== "string") errores.push(`${ruta}: debería ser texto`);
      else if (s.enum && !s.enum.includes(v)) errores.push(`${ruta}: "${v}" no está en ${JSON.stringify(s.enum)}`);
      return errores;
    case "number":
      if (typeof v !== "number") errores.push(`${ruta}: debería ser número`);
      return errores;
    case "integer":
      if (!Number.isInteger(v)) errores.push(`${ruta}: debería ser entero`);
      return errores;
    case "boolean":
      if (typeof v !== "boolean") errores.push(`${ruta}: debería ser true/false`);
      return errores;
    case "null":
      if (v !== null) errores.push(`${ruta}: debería ser null`);
      return errores;
    default:
      return errores;
  }
}

/** Comprobación de que un esquema cumple las reglas del modo estricto de OpenAI. */
export function comprobarEstricto(s, ruta = "esquema", errores = []) {
  if (!s || typeof s !== "object") return errores;
  if (s.type === "object") {
    const claves = Object.keys(s.properties ?? {});
    if (s.additionalProperties !== false) errores.push(`${ruta}: falta additionalProperties:false`);
    if (JSON.stringify([...(s.required ?? [])].sort()) !== JSON.stringify([...claves].sort())) errores.push(`${ruta}: "required" debe listar todas las propiedades`);
    claves.forEach((k) => comprobarEstricto(s.properties[k], `${ruta}.${k}`, errores));
  }
  if (s.items) comprobarEstricto(s.items, `${ruta}[]`, errores);
  (s.anyOf ?? []).forEach((a, i) => comprobarEstricto(a, `${ruta}|${i}`, errores));
  for (const prohibida of ["minLength", "maxLength", "pattern", "minItems", "maxItems", "minimum", "maximum", "format", "default"]) {
    if (prohibida in s) errores.push(`${ruta}: la palabra clave "${prohibida}" no está soportada en modo estricto`);
  }
  return errores;
}

// ---------------------------------------------------------------------------
// Datos de ejemplo
// ---------------------------------------------------------------------------
function cargarEjemplos() {
  const dir = join(RAIZ, "ejemplos");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, "plan.json")))
    .map((d) => ({
      id: d.name,
      guion: readFileSync(join(dir, d.name, "guion.txt"), "utf8").trim(),
      plan: JSON.parse(readFileSync(join(dir, d.name, "plan.json"), "utf8")),
      tema: JSON.parse(readFileSync(join(dir, d.name, "tema.json"), "utf8")),
      post: existsSync(join(dir, d.name, "post.txt")) ? readFileSync(join(dir, d.name, "post.txt"), "utf8").trim() : null,
    }));
}

const POR_TEMA = [
  [/apartamento|chapinero|bogot[aá]|inmueble|arriendo|inmobiliari/i, "inmobiliario-co-apartamento"],
  [/infarto|brazo|dolor referido|coraz/i, "infarto-dolor-referido"],
  [/insulina|glucosa|az[uú]car|diabetes/i, "insulina-glucosa"],
  [/potencial|impulso|neurona|nervios/i, "potencial-accion"],
];

/** Adapta un elemento del ejemplo a la variante estricta del catálogo (todas las props; null en las no usadas). */
function aEstricto(plan, cat) {
  const copia = JSON.parse(JSON.stringify(plan));
  for (const esc of copia.escenas) {
    esc.elementos = esc.elementos.map((el) => {
      const def = cat.elementos[el.tipo];
      const salida = { tipo: el.tipo };
      for (const k of Object.keys(cat.base).filter((x) => x !== "tipo")) salida[k] = el[k] ?? (k === "cuando" ? "" : null);
      for (const [k, spec] of Object.entries(def.props)) {
        let val = el[k] ?? null;
        if (spec.t === "marcadores" && Array.isArray(val)) val = val.map((m) => ({ cuando: null, ...m }));
        if (spec.t === "lineasH" && Array.isArray(val)) val = val.map((m) => ({ color: null, ...m }));
        if (spec.t === "nodos" && Array.isArray(val)) val = val.map((m) => ({ color: null, cuando: null, ...m }));
        if (spec.t === "panel" && val) val = { color: null, ...val };
        salida[k] = val;
      }
      return salida;
    });
  }
  return copia;
}

/** Plan con defectos típicos de un modelo: ancla inventada, texto pisado y tipo inexistente. */
function estropear(plan) {
  const p = JSON.parse(JSON.stringify(plan));
  const e = p.escenas[1];
  e.elementos[0].cuando = "palabras que no existen";
  const textos = e.elementos.filter((x) => x.tipo === "etiqueta");
  if (textos.length >= 2) {
    textos[1].x = textos[0].x;
    textos[1].y = textos[0].y;
  }
  return p;
}

// ---------------------------------------------------------------------------
// Voz simulada (OpenAI audio / ElevenLabs)
// ---------------------------------------------------------------------------
function mp3Ejemplo() {
  const dir = join(RAIZ, "ejemplos");
  for (const d of existsSync(dir) ? readdirSync(dir) : []) {
    const f = join(dir, d, "voz.mp3");
    if (existsSync(f)) return readFileSync(f);
  }
  return Buffer.alloc(4000, 1);
}

/** Tiempos inventados pero verosímiles: 0,34 s por palabra + pausa tras los signos de puntuación. */
function marcasSimuladas(texto, conDefectos = false) {
  let t = 0.15;
  let palabras = texto.split(/\s+/).filter(Boolean).map((w) => {
    const ini = t;
    t += 0.14 + 0.028 * w.replace(/[^\p{L}\p{N}]/gu, "").length + (/[.?!]$/.test(w) ? 0.28 : /,$/.test(w) ? 0.14 : 0);
    return { word: w.replace(/[¿¡?!.,;:"«»()]/g, ""), start: Math.round(ini * 1000) / 1000, end: Math.round((t - 0.04) * 1000) / 1000 };
  });
  if (conDefectos && palabras.length > 12) {
    palabras.splice(7, 1); // palabra que Whisper "no oyó"
    palabras[3] = { ...palabras[3], word: palabras[3].word.slice(0, -1) + "x" }; // errata
    palabras.splice(10, 0, { word: "eh", start: palabras[9].end, end: palabras[9].end + 0.05 }); // palabra de más
  }
  return palabras;
}

// ---------------------------------------------------------------------------
// Servidor
// ---------------------------------------------------------------------------
export function iniciarMock(puerto = 0) {
  const ejemplos = cargarEjemplos();
  const cat = cargarCatalogo();
  const estado = { peticiones: 0, porEsquema: {}, fallosEmitidos: 0, avisos: [], estilos: { responses: 0, chat: 0 }, voz: { speech: 0, transcriptions: 0, elevenlabs: 0 } };
  const [codigoFallo, cuantosFallos] = (process.env.MOCK_ERRORES ?? "").split(":").map(Number);
  const una = { guion: false, revision: false, plan: false, critica: false };
  let esquemaPlan = null;

  const respuesta = (nombre, entradaTexto, hayImagenes) => {
    const ej = () => {
      const porTexto = ejemplos.find((x) => entradaTexto.includes(x.guion.slice(0, 70)));
      if (porTexto) return porTexto;
      const m = POR_TEMA.find(([re]) => re.test(entradaTexto));
      return ejemplos.find((x) => x.id === m?.[1]) ?? ejemplos[0];
    };
    if (nombre === "guion") {
      const x = ej();
      let g = x.guion;
      if (process.env.MOCK_GUION_CORTO && !una.guion) g = g.split(". ").slice(0, 3).join(". ") + ".";
      una.guion = true;
      return {
        proyectoId: x.tema.id.replace(/-dsl$/, ""),
        etiqueta: x.tema.etiqueta,
        titulo: x.tema.titulo,
        guion: g,
        verificacion: [{ afirmacion: "Afirmación clave del guion (simulada)", certeza: "alta", nota: "Respuesta del servidor de pruebas, no verificada." }],
        simplificaciones: ["(simulado)"],
      };
    }
    if (nombre === "revision") {
      const x = ej();
      if (process.env.MOCK_REVISION_FALLA && !una.revision) {
        una.revision = true;
        return { aprobado: false, problemas: [{ tipo: "impreciso", fragmento: x.guion.slice(0, 30), explicacion: "Simulado", correccion: "Simulado" }], guionCorregido: x.guion };
      }
      return { aprobado: true, problemas: [], guionCorregido: null };
    }
    if (nombre === "plan") {
      const x = ej();
      const reparando = /PROBLEMAS DETECTADOS/.test(entradaTexto);
      let plan = aEstricto(x.plan, cat);
      if ((process.env.MOCK_PLAN_ERRORES && !una.plan && !reparando) || process.env.MOCK_PLAN_SIEMPRE_MAL) plan = estropear(plan);
      una.plan = true;
      const errs = validarEsquema(plan, esquemaPlan);
      if (errs.length) estado.avisos.push(`El plan de ejemplo ${x.id} no cumple el esquema: ${errs.slice(0, 5).join(" | ")}`);
      return plan;
    }
    if (nombre === "critica") {
      if (process.env.MOCK_CRITICA && !una.critica) {
        una.critica = true;
        return { aprobado: false, problemas: [{ escena: "gancho", gravedad: "alta", tipo: "solape", descripcion: "Simulado: dos etiquetas se tocan.", arreglo: "Simulado: mueve la etiqueta 1 diez unidades a la izquierda." }] };
      }
      return { aprobado: true, problemas: [] };
    }
    if (nombre === "post") {
      const x = ej();
      if (x.post) {
        // ejemplos con post.txt (inmobiliario…): la última línea son los hashtags
        const lineas = x.post.split("\n");
        const tags = (lineas.pop() ?? "").split(/\s+/).filter((h) => h.startsWith("#"));
        return { descripcion: lineas.join("\n").trim(), hashtags: tags.slice(0, 5) };
      }
      return { descripcion: `${x.tema.titulo} 🧠\n\nExplicación breve del mecanismo (texto simulado).\n\nGuárdalo para repasar y compártelo. Divulgación: no sustituye una consulta médica.`, hashtags: ["#medicina", "#fisiologia", "#anatomia", "#estudiantesdemedicina", "#saludhumana"] };
    }
    void hayImagenes;
    return { ok: true };
  };

  const servidor = createServer((req, res) => {
    const json = (codigo, obj, cab = {}) => {
      res.writeHead(codigo, { "Content-Type": "application/json", ...cab });
      res.end(JSON.stringify(obj));
    };
    if (req.url === "/_mock/estado") return json(200, estado);
    // ElevenLabs: cabecera xi-api-key en vez de Bearer
    if (req.url.startsWith("/v1/text-to-speech/")) {
      let c = "";
      req.on("data", (x) => (c += x));
      req.on("end", () => {
        estado.peticiones++;
        estado.voz.elevenlabs++;
        if (!req.headers["xi-api-key"]) return json(401, { detail: { status: "invalid_api_key", message: "Falta xi-api-key (simulado)" } });
        const b = JSON.parse(c || "{}");
        const texto = String(b.text ?? "");
        const marcas = marcasSimuladas(texto);
        // tiempo de cada carácter: reparto uniforme dentro de su palabra; el espacio previo cae en el hueco entre palabras
        const ch = [...texto];
        const ini = new Array(ch.length).fill(0);
        const fin = new Array(ch.length).fill(0);
        let cursor = 0;
        texto.split(/\s+/).filter(Boolean).forEach((w, n) => {
          const i0 = texto.indexOf(w, cursor);
          const mk = marcas[n];
          const dur = (mk.end - mk.start) / w.length;
          for (let q = 0; q < w.length; q++) { ini[i0 + q] = mk.start + dur * q; fin[i0 + q] = mk.start + dur * (q + 1); }
          for (let q = cursor; q < i0; q++) { ini[q] = marcas[n - 1]?.end ?? 0; fin[q] = mk.start; }
          cursor = i0 + w.length;
        });
        json(200, { audio_base64: mp3Ejemplo().toString("base64"), alignment: { characters: ch, character_start_times_seconds: ini, character_end_times_seconds: fin }, normalized_alignment: null });
      });
      return;
    }
    if (!(req.headers.authorization ?? "").startsWith("Bearer ")) return json(401, { error: { message: "Falta la clave (simulado)", type: "invalid_request_error", code: "invalid_api_key" } });

    let cuerpo = "";
    req.on("data", (c) => (cuerpo += c));
    req.on("end", () => {
      estado.peticiones++;
      if (codigoFallo && estado.fallosEmitidos < cuantosFallos) {
        estado.fallosEmitidos++;
        return json(codigoFallo, { error: { message: "Fallo simulado", type: "server_error", code: "simulado" } }, { "retry-after": "1" });
      }
      const ruta = req.url.replace(/^\/v1/, "");
      if (req.method === "GET" && ruta === "/models") {
        return json(200, { object: "list", data: ["gpt-6.1-sol", "gpt-6-astra", "gpt-6-luna", "gpt-5.6-sol", "gpt-realtime-mini", "gpt-6-transcribe", "text-embedding-3-large", "dall-e-3", "gpt-4o"].map((id) => ({ id, object: "model" })) });
      }
      if (req.method !== "POST") return json(404, { error: { message: "No existe", code: "not_found" } });
      // voz de OpenAI: texto → mp3 y mp3 → palabras con tiempos
      if (ruta === "/audio/speech") {
        estado.voz.speech++;
        let q = {};
        try { q = JSON.parse(cuerpo); } catch { /* cuerpo no JSON */ }
        if (!q.model || !q.input || !q.voice) return json(400, { error: { message: "Faltan model, input o voice (simulado)" } });
        estado.ultimaVoz = { modelo: q.model, voz: q.voice, instrucciones: q.instructions ?? null, formato: q.response_format ?? null, entrada: String(q.input) };
        res.writeHead(200, { "Content-Type": "audio/mpeg" });
        return res.end(mp3Ejemplo());
      }
      if (ruta === "/audio/transcriptions") {
        estado.voz.transcriptions++;
        const campo = (n) => cuerpo.match(new RegExp(`name="${n.replace(/[\[\]]/g, "\\$&")}"\\r?\\n\\r?\\n([\\s\\S]*?)\\r?\\n--`))?.[1];
        const modelo = campo("model");
        estado.ultimaTranscripcion = { modelo, formato: campo("response_format"), granularidad: campo("timestamp_granularities[]"), idioma: campo("language") };
        if (campo("response_format") !== "verbose_json" || campo("timestamp_granularities[]") !== "word") return json(400, { error: { message: "Se esperaba verbose_json con timestamp_granularities[]=word (simulado)" } });
        const guion = campo("prompt") ?? "";
        const words = marcasSimuladas(guion, Boolean(process.env.MOCK_WHISPER_ERRORES));
        return json(200, { task: "transcribe", language: "spanish", duration: words.at(-1)?.end ?? 0, text: words.map((w) => w.word).join(" "), words });
      }
      let b;
      try { b = JSON.parse(cuerpo); } catch { return json(400, { error: { message: "JSON inválido" } }); }

      const esResponses = ruta === "/responses";
      const esChat = ruta === "/chat/completions";
      if (!esResponses && !esChat) return json(404, { error: { message: `Ruta desconocida ${ruta}`, code: "not_found" } });
      if (esResponses && process.env.MOCK_SIN_RESPONSES) return json(404, { error: { message: "Unknown endpoint /responses", code: "not_found" } });
      estado.estilos[esResponses ? "responses" : "chat"]++;

      const fmt = esResponses ? b.text?.format : b.response_format;
      const nombre = esResponses ? fmt?.name : fmt?.json_schema?.name;
      const esquema = esResponses ? fmt?.schema : fmt?.json_schema?.schema;
      const estricto = esResponses ? fmt?.strict : fmt?.json_schema?.strict;
      if (esquema && estricto) {
        const problemas = comprobarEstricto(esquema);
        if (problemas.length) return json(400, { error: { message: `Invalid schema for response_format '${nombre}': ${problemas[0]}`, type: "invalid_request_error", param: esResponses ? "text.format.schema" : "response_format", code: "invalid_json_schema" } });
      }
      if (nombre === "plan") esquemaPlan = esquema;
      if (!b.model) return json(400, { error: { message: "Falta 'model'", param: "model" } });

      // texto de entrada
      let entradaTexto = "";
      let imagenes = 0;
      const partes = esResponses ? (b.input ?? []).flatMap((m) => (typeof m.content === "string" ? [{ type: "input_text", text: m.content }] : m.content)) : (b.messages ?? []).filter((m) => m.role === "user").flatMap((m) => (typeof m.content === "string" ? [{ type: "text", text: m.content }] : m.content));
      for (const p of partes) {
        if (p.type === "input_text" || p.type === "text") entradaTexto += p.text + "\n";
        if (p.type === "input_image" || p.type === "image_url") imagenes++;
      }
      estado.porEsquema[nombre ?? "?"] = (estado.porEsquema[nombre ?? "?"] ?? 0) + 1;

      const datos = respuesta(nombre, entradaTexto, imagenes);
      if (esquema && estricto && nombre !== "plan") {
        const errs = validarEsquema(datos, esquema);
        if (errs.length) estado.avisos.push(`Respuesta simulada de ${nombre} fuera de esquema: ${errs.slice(0, 3).join(" | ")}`);
      }
      const texto = JSON.stringify(datos);
      const uso = { input: Math.round(entradaTexto.length / 4) + imagenes * 800, output: Math.round(texto.length / 3) };
      if (esResponses) {
        return json(200, { id: "resp_mock", object: "response", status: "completed", model: b.model, output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: texto }] }], usage: { input_tokens: uso.input, output_tokens: uso.output } });
      }
      return json(200, { id: "chat_mock", object: "chat.completion", model: b.model, choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: texto } }], usage: { prompt_tokens: uso.input, completion_tokens: uso.output } });
    });
  });

  return new Promise((resolver) => {
    servidor.listen(puerto, "127.0.0.1", () => {
      const { port } = servidor.address();
      resolver({ url: `http://127.0.0.1:${port}/v1`, puerto: port, estado, cerrar: () => new Promise((r) => servidor.close(() => r())) });
    });
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const m = await iniciarMock(Number(process.argv[2] ?? 8787));
  console.log(`🧪 Servidor de pruebas de OpenAI en ${m.url}\n   Úsalo con:  OPENAI_BASE_URL=${m.url}  OPENAI_API_KEY=prueba  npm run ia -- "tu tema"`);
}
