/**
 * Cliente mínimo (sin dependencias) de la API de OpenAI para el agente de VideMed.
 *
 *  - Usa la Responses API (POST /responses) con Structured Outputs (`text.format` json_schema estricto).
 *    Si el servidor no la tiene (404/405) cae solo a Chat Completions (`response_format`).
 *  - Reintenta con espera creciente los errores transitorios (429, 5xx, red, timeout).
 *  - Degrada el esquema si el servidor lo rechaza: estricto → no estricto → JSON libre con el esquema en el prompt.
 *  - Quita parámetros que el modelo no admite (reasoning, etc.) y reintenta.
 *  - Elige el modelo por ti con GET /models si no fijaste OPENAI_MODEL*.
 */
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import { join } from "node:path";
import { RAIZ } from "./puente.mjs";

export class ErrorApi extends Error {
  constructor(mensaje, { status = 0, codigo = "", tipo = "", param = "", reintentarEn = 0, fatal = false } = {}) {
    super(mensaje);
    this.name = "ErrorApi";
    Object.assign(this, { status, codigo, tipo, param, reintentarEn, fatal });
  }
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Elección automática de modelo
// ---------------------------------------------------------------------------
const EXCLUIR = /(audio|realtime|tts|transcribe|live|image|embed|moderation|search|whisper|dall|sora|davinci|babbage|instruct|computer|codex|deep-research|oss|chat-latest|cyber|preview|pro$|-pro-|diagnostic)/i;
/** Nivel de capacidad por sufijo de familia: astra (máximo) > sol (equilibrado) > terra > luna/mini > nano. */
const NIVEL = { astra: 5, sol: 4, "": 4, terra: 3.5, luna: 2, mini: 2, nano: 1 };

export function ordenarCandidatos(ids, objetivo = 4) {
  const lista = [];
  for (const id of ids) {
    if (EXCLUIR.test(id)) continue;
    const m = id.match(/^gpt-(\d+)(?:\.(\d+))?(?:-([a-z]+))?(-\d{4}-\d{2}-\d{2})?$/);
    if (!m) continue;
    const version = Number(m[1]) + Number(m[2] ?? 0) / 10;
    const nivel = NIVEL[m[3] ?? ""] ?? 3;
    lista.push({ id, version, nivel, snapshot: Boolean(m[4]) });
  }
  lista.sort((a, b) => Math.abs(a.nivel - objetivo) - Math.abs(b.nivel - objetivo) || b.version - a.version || Number(a.snapshot) - Number(b.snapshot));
  return lista.map((x) => x.id);
}

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------
export class Cliente {
  constructor(cfg, { log = () => {} } = {}) {
    this.cfg = cfg;
    this.log = log;
    this.uso = { llamadas: 0, entrada: 0, salida: 0 };
    this.estilo = "responses"; // o "chat"
    this._modelos = null;
    this._elegidos = new Map();
    this._modo = new Map(); // nombre del esquema → "estricto" | "laxo" | "json"
    this._sinParametro = new Set();
    this._n = 0;
  }

  get cabeceras() {
    return { "Content-Type": "application/json", Authorization: `Bearer ${this.cfg.clave}` };
  }

  /**
   * HTTP con node:http(s) y no con fetch: el fetch de Node corta a los 300 s sin recibir cabeceras (undici),
   * y un plan grande con razonamiento alto puede tardar más. Aquí el único límite es `timeoutS`.
   */
  _http(ruta, { metodo = "POST", cuerpo, timeoutS } = {}) {
    const limite = timeoutS ?? this.cfg.timeoutS;
    return new Promise((resolver, rechazar) => {
      const url = new URL(this.cfg.url + ruta);
      const datos = cuerpo ? Buffer.from(JSON.stringify(cuerpo)) : null;
      const cabeceras = { ...this.cabeceras, Accept: "application/json", ...(datos ? { "Content-Length": datos.length } : {}) };
      let terminado = false;
      const fin = (fn, valor) => {
        if (terminado) return;
        terminado = true;
        clearTimeout(reloj);
        fn(valor);
      };
      const req = (url.protocol === "http:" ? http : https).request(url, { method: metodo, headers: cabeceras, agent: false }, (res) => {
        const trozos = [];
        res.on("data", (c) => trozos.push(c));
        res.on("error", (e) => fin(rechazar, new ErrorApi(`Conexión cortada: ${e.code ?? e.message}`, { codigo: "red" })));
        res.on("end", () => {
          const texto = Buffer.concat(trozos).toString("utf8");
          let json = null;
          try { json = JSON.parse(texto); } catch { /* respuesta no JSON */ }
          if (res.statusCode >= 200 && res.statusCode < 300) return fin(resolver, json ?? {});
          const e = json?.error ?? {};
          const ra = Number(res.headers["retry-after-ms"]) || (Number(res.headers["retry-after"]) || 0) * 1000;
          fin(rechazar, new ErrorApi(e.message || texto.slice(0, 300) || `HTTP ${res.statusCode}`, { status: res.statusCode, codigo: e.code ?? "", tipo: e.type ?? "", param: e.param ?? "", reintentarEn: ra }));
        });
      });
      const reloj = setTimeout(() => {
        fin(rechazar, new ErrorApi(`Tiempo agotado (${limite} s) esperando a la API.`, { codigo: "timeout" }));
        req.destroy();
      }, limite * 1000);
      req.on("error", (e) => fin(rechazar, new ErrorApi(`No se pudo conectar con ${this.cfg.url}: ${e.code ?? e.message}`, { codigo: "red" })));
      req.end(datos);
    });
  }

  /** Llama con reintentos ante errores transitorios. */
  async _conReintentos(ruta, opciones, etiqueta) {
    const MAX = 5;
    for (let intento = 1; ; intento++) {
      try {
        return await this._http(ruta, opciones);
      } catch (e) {
        if (!(e instanceof ErrorApi)) throw e;
        if (e.status === 401) throw new ErrorApi("La API rechazó la clave (401). Revisa OPENAI_API_KEY en el archivo .env.", { ...e, fatal: true });
        if (e.status === 403 && /country|region|territory|not supported/i.test(e.message)) throw new ErrorApi(`Acceso denegado (403): ${e.message}`, { ...e, fatal: true });
        if (e.status === 429 && /quota|billing|credit|insufficient/i.test(`${e.codigo} ${e.message}`)) {
          throw new ErrorApi("Sin saldo o cuota en la cuenta de OpenAI (insufficient_quota). Añade crédito en https://platform.openai.com/settings/organization/billing", { ...e, fatal: true });
        }
        const transitorio = [408, 409, 429, 500, 502, 503, 504, 529].includes(e.status) || ["timeout", "red"].includes(e.codigo);
        if (!transitorio || intento >= MAX) throw e;
        const espera = Math.max(e.reintentarEn, Math.min(60000, 1500 * 2 ** (intento - 1))) + Math.random() * 500;
        this.log(`   ↻ ${etiqueta}: ${e.status || e.codigo} (${e.message.slice(0, 80)}) — reintento ${intento}/${MAX - 1} en ${(espera / 1000).toFixed(1)} s`);
        await dormir(espera);
      }
    }
  }

  async listarModelos() {
    if (this._modelos) return this._modelos;
    const r = await this._conReintentos("/models", { metodo: "GET", timeoutS: 30 }, "listar modelos");
    this._modelos = (r.data ?? []).map((m) => m.id).sort();
    return this._modelos;
  }

  /** Modelo para un rol: general | plan | vision | revisor. Devuelve la lista de candidatos (el primero es el preferido). */
  async candidatos(rol) {
    const c = this.cfg;
    const fijado = { general: c.modelo, plan: c.modeloPlan || c.modelo, vision: c.modeloVision || c.modelo, revisor: c.modeloRevisor || c.modelo }[rol] ?? c.modelo;
    if (fijado) return [fijado];
    if (this._elegidos.has("auto")) return this._elegidos.get("auto");
    let lista = [];
    try {
      lista = ordenarCandidatos(await this.listarModelos());
    } catch (e) {
      if (e.fatal) throw e;
      this.log(`   ⚠ No pude listar los modelos (${e.message.slice(0, 80)}).`);
    }
    if (!lista.length) lista = ["gpt-6.1-sol", "gpt-6-astra", "gpt-5.6-sol", "gpt-5.5"];
    this._elegidos.set("auto", lista);
    return lista;
  }

  _cuerpoResponses({ modelo, nombre, esquema, instrucciones, entrada, imagenes, maxSalida, esfuerzo }, modo) {
    const contenido = [{ type: "input_text", text: entrada }];
    for (const im of imagenes) contenido.push({ type: "input_image", image_url: im.dataUrl, detail: im.detalle ?? "high" });
    let sistema = instrucciones;
    const cuerpo = { model: modelo, instructions: sistema, input: [{ role: "user", content: contenido }], max_output_tokens: maxSalida, store: false };
    if (modo === "json") {
      cuerpo.instructions += `\n\nResponde ÚNICAMENTE con un objeto JSON válido que cumpla este JSON Schema:\n${JSON.stringify(esquema)}`;
      cuerpo.text = { format: { type: "json_object" } };
    } else {
      cuerpo.text = { format: { type: "json_schema", name: nombre, strict: modo === "estricto", schema: esquema } };
    }
    if (esfuerzo && !this._sinParametro.has("reasoning")) cuerpo.reasoning = { effort: esfuerzo };
    return cuerpo;
  }

  _cuerpoChat({ modelo, nombre, esquema, instrucciones, entrada, imagenes, maxSalida, esfuerzo }, modo) {
    const contenido = [{ type: "text", text: entrada }];
    for (const im of imagenes) contenido.push({ type: "image_url", image_url: { url: im.dataUrl, detail: im.detalle ?? "high" } });
    let sistema = instrucciones;
    const cuerpo = { model: modelo, messages: [], max_completion_tokens: maxSalida, store: false };
    if (modo === "json") {
      sistema += `\n\nResponde ÚNICAMENTE con un objeto JSON válido que cumpla este JSON Schema:\n${JSON.stringify(esquema)}`;
      cuerpo.response_format = { type: "json_object" };
    } else {
      cuerpo.response_format = { type: "json_schema", json_schema: { name: nombre, strict: modo === "estricto", schema: esquema } };
    }
    cuerpo.messages.push({ role: "system", content: sistema }, { role: "user", content: contenido });
    if (esfuerzo && !this._sinParametro.has("reasoning")) cuerpo.reasoning_effort = esfuerzo;
    return cuerpo;
  }

  _extraer(resp) {
    if (this.estilo === "responses") {
      if (resp.status === "failed") throw new ErrorApi(`La respuesta falló: ${resp.error?.message ?? "sin detalle"}`, { codigo: resp.error?.code ?? "failed" });
      let texto = "";
      for (const item of resp.output ?? []) {
        if (item.type !== "message") continue;
        for (const c of item.content ?? []) {
          if (c.type === "refusal") throw new ErrorApi(`El modelo se negó: ${c.refusal}`, { codigo: "refusal", fatal: true });
          if (c.type === "output_text") texto += c.text;
        }
      }
      if (!texto && typeof resp.output_text === "string") texto = resp.output_text;
      if (resp.status === "incomplete") {
        const motivo = resp.incomplete_details?.reason ?? "desconocido";
        throw new ErrorApi(`Respuesta incompleta (${motivo}).`, { codigo: motivo === "max_output_tokens" ? "truncada" : "incompleta" });
      }
      const u = resp.usage ?? {};
      return { texto, entrada: u.input_tokens ?? 0, salida: u.output_tokens ?? 0 };
    }
    const ch = resp.choices?.[0];
    if (!ch) throw new ErrorApi("Respuesta sin 'choices'.", { codigo: "vacia" });
    if (ch.message?.refusal) throw new ErrorApi(`El modelo se negó: ${ch.message.refusal}`, { codigo: "refusal", fatal: true });
    if (ch.finish_reason === "length") throw new ErrorApi("Respuesta cortada por longitud.", { codigo: "truncada" });
    const u = resp.usage ?? {};
    return { texto: ch.message?.content ?? "", entrada: u.prompt_tokens ?? 0, salida: u.completion_tokens ?? 0 };
  }

  static parsearJson(texto) {
    const limpio = String(texto).trim();
    try { return JSON.parse(limpio); } catch { /* sigue */ }
    const fence = limpio.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) { try { return JSON.parse(fence[1]); } catch { /* sigue */ } }
    const a = limpio.indexOf("{");
    const b = limpio.lastIndexOf("}");
    if (a >= 0 && b > a) return JSON.parse(limpio.slice(a, b + 1));
    throw new ErrorApi("La respuesta no es JSON.", { codigo: "no-json" });
  }

  /**
   * Una petición estructurada.
   * @param {{rol?:string, nombre:string, esquema:object, instrucciones:string, entrada:string, imagenes?:{dataUrl:string,detalle?:string}[], maxSalida?:number, esfuerzo?:string}} p
   * @returns {Promise<{datos:any, modelo:string, entrada:number, salida:number, ms:number}>}
   */
  async pedir(p) {
    const lista = await this.candidatos(p.rol ?? "general");
    let maxSalida = p.maxSalida ?? 32000;
    let ultimoError = null;
    const t0 = Date.now();

    for (const modelo of lista.slice(0, 4)) {
      let modo = this._modo.get(p.nombre) ?? "estricto";
      for (let vuelta = 0; vuelta < 8; vuelta++) {
        const args = { ...p, modelo, imagenes: p.imagenes ?? [], maxSalida, esfuerzo: p.esfuerzo ?? this.cfg.esfuerzo };
        const ruta = this.estilo === "responses" ? "/responses" : "/chat/completions";
        const cuerpo = this.estilo === "responses" ? this._cuerpoResponses(args, modo) : this._cuerpoChat(args, modo);
        this._depurar(p.nombre, "peticion", cuerpo);
        try {
          const resp = await this._conReintentos(ruta, { cuerpo }, `${p.nombre} (${modelo})`);
          this._depurar(p.nombre, "respuesta", resp);
          const { texto, entrada, salida } = this._extraer(resp);
          const datos = Cliente.parsearJson(texto);
          this.uso.llamadas++;
          this.uso.entrada += entrada;
          this.uso.salida += salida;
          this._modo.set(p.nombre, modo);
          return { datos, modelo, entrada, salida, ms: Date.now() - t0 };
        } catch (e) {
          if (!(e instanceof ErrorApi)) throw e;
          ultimoError = e;
          if (e.fatal) throw e;
          const msg = `${e.codigo} ${e.param} ${e.message}`;
          // 1. La Responses API no existe en este servidor → Chat Completions
          if ([404, 405].includes(e.status) && this.estilo === "responses" && !/model/i.test(msg)) {
            this.log("   ↪ El servidor no tiene /responses: uso /chat/completions.");
            this.estilo = "chat";
            continue;
          }
          // 2. Parámetro no admitido por el modelo (reasoning…)
          if (e.status === 400 && /reasoning/i.test(msg) && !this._sinParametro.has("reasoning")) {
            this._sinParametro.add("reasoning");
            this.log("   ↪ Este modelo no admite 'reasoning': lo quito.");
            continue;
          }
          // 3. Respuesta truncada → más margen de salida
          if (e.codigo === "truncada" && maxSalida < 120000) {
            maxSalida = Math.min(120000, Math.round(maxSalida * 1.8));
            this.log(`   ↪ Respuesta cortada: subo el límite de salida a ${maxSalida} tokens.`);
            continue;
          }
          // 4. El esquema no gusta → degradar
          if (e.status === 400 && /schema|strict|response_format|text\.format|json/i.test(msg)) {
            const siguiente = { estricto: "laxo", laxo: "json" }[modo];
            if (siguiente) {
              this.log(`   ↪ El servidor rechazó el esquema (${e.message.slice(0, 120)}). Paso a modo '${siguiente}'.`);
              modo = siguiente;
              continue;
            }
          }
          // 5. JSON inválido (solo ocurre en modos no estrictos): un reintento
          if (e.codigo === "no-json" && vuelta < 2) continue;
          // 6. Modelo inexistente o sin permiso → siguiente candidato
          if ([400, 403, 404].includes(e.status) && /model/i.test(msg)) {
            this.log(`   ↪ Modelo ${modelo} no disponible (${e.message.slice(0, 90)}).`);
            break;
          }
          throw e;
        }
      }
    }
    throw ultimoError ?? new ErrorApi("No hay ningún modelo utilizable.");
  }

  _depurar(nombre, tipo, objeto) {
    if (!process.env.IA_DEBUG) return;
    try {
      const dir = join(RAIZ, "trabajo", "ia", "debug");
      mkdirSync(dir, { recursive: true });
      const copia = JSON.stringify(objeto, (k, v) => (typeof v === "string" && v.startsWith("data:image") ? `[imagen ${Math.round(v.length / 1024)} KB]` : v), 2);
      writeFileSync(join(dir, `${String(++this._n).padStart(3, "0")}-${nombre}-${tipo}.json`), copia);
    } catch { /* la depuración nunca debe romper la llamada */ }
  }
}

/** Registro simple de una línea JSON por llamada (para saber qué se gastó). */
export function anotarUso(archivo, registro) {
  try { appendFileSync(archivo, JSON.stringify({ t: new Date().toISOString(), ...registro }) + "\n"); } catch { /* opcional */ }
}
