#!/usr/bin/env node
/**
 * Batería de pruebas del agente de IA SIN gastar nada: usa el servidor simulado de OpenAI.
 *   npm run ia:prueba                 (≈ 30 s, no abre Chrome)
 *   npm run ia:prueba -- --con-vision (añade una ronda real de capturas + crítica; ≈ 2 min, necesita memoria libre)
 *
 * Comprueba: esquemas estrictos, validador, elección de modelo, y el agente completo ante guion corto,
 * revisor que corrige, plan defectuoso que se repara, servidor sin /responses, errores 429, falta de visto
 * bueno, plan imposible (código 4), plan de emergencia, guion propio, --solo-plan y --reanudar.
 * Además: perfiles (medicina-ar / inmobiliario-co), iconos pro, alineación de voz, voz de producción (OpenAI y
 * ElevenLabs simulados), plantilla colombiana, agente con brief y la API del panel (seguridad incluida).
 * Al terminar restaura el proyecto que tenías activo.
 */
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { request } from "node:http";
import { join } from "node:path";
import { ordenarCandidatos } from "./cliente.mjs";
import { construirEsquemaPlan, esquemaCritica, esquemaGuion, esquemaPost, esquemaRevision } from "./esquemas.mjs";
import { comprobarEstricto, validarEsquema } from "./mock-server.mjs";
import { limpiarNulos } from "./plan-util.mjs";
import { RAIZ } from "./puente.mjs";
import { validarPlan } from "./validar-plan.mjs";

const conVision = process.argv.includes("--con-vision");
const p = (...x) => join(RAIZ, ...x);
let pasadas = 0;
const falladas = [];
const prueba = (nombre, cond, detalle = "") => {
  if (cond) { pasadas++; console.log(`  ✅ ${nombre}`); }
  else { falladas.push(nombre); console.log(`  ❌ ${nombre}${detalle ? `\n       ${detalle}` : ""}`); }
};

// ---------------------------------------------------------------- copia de seguridad del proyecto activo
const ACTIVOS = ["src/data/guion.txt", "src/data/timestamps.json", "src/data/meta.json", "src/data/tema.json", "src/data/post.txt", "src/data/plan.json", "src/data/marca.json", "src/data/brief.json", "src/data/media.json", "public/audios/voz.mp3", "public/audios/tiempos.vtt", "src/tema.ts", "src/sonido.ts"];
const copia = p("trabajo", "tmp", "probar-respaldo");
rmSync(copia, { recursive: true, force: true });
mkdirSync(copia, { recursive: true });
const existian = new Set();
for (const f of ACTIVOS) if (existsSync(p(f))) { copyFileSync(p(f), join(copia, f.replace(/\//g, "__"))); existian.add(f); }
if (existsSync(p("public", "media"))) cpSync(p("public", "media"), join(copia, "media"), { recursive: true });
const restaurar = () => {
  for (const f of ACTIVOS) {
    const c = join(copia, f.replace(/\//g, "__"));
    if (existsSync(c)) copyFileSync(c, p(f));
    else if (!existian.has(f)) rmSync(p(f), { force: true });
  }
  rmSync(p("public", "media"), { recursive: true, force: true });
  if (existsSync(join(copia, "media"))) cpSync(join(copia, "media"), p("public", "media"), { recursive: true });
  rmSync(p("proyectos", "prueba-panel"), { recursive: true, force: true });
  for (const d of readdirSync(p("trabajo", "archivo"), { withFileTypes: true })) if (d.isDirectory() && d.name.startsWith("prueba")) rmSync(p("trabajo", "archivo", d.name), { recursive: true, force: true });
  for (const d of readdirSync(p("trabajo", "ia"), { withFileTypes: true })) if (d.isDirectory() && d.name.startsWith("prueba-")) rmSync(p("trabajo", "ia", d.name), { recursive: true, force: true });
};

try {
  // ------------------------------------------------------------ unitarias
  console.log("\nUnitarias");
  for (const [n, s] of Object.entries({ guion: esquemaGuion, revision: esquemaRevision, post: esquemaPost, critica: esquemaCritica, plan: construirEsquemaPlan() })) {
    const e = comprobarEstricto(s, n);
    prueba(`esquema ${n} cumple el modo estricto`, e.length === 0, e[0]);
  }
  for (const ej of ["infarto-dolor-referido", "insulina-glucosa", "potencial-accion"]) {
    const d = p("ejemplos", ej);
    const r = await validarPlan(JSON.parse(readFileSync(join(d, "plan.json"), "utf8")), JSON.parse(readFileSync(join(d, "timestamps.json"), "utf8")));
    prueba(`ejemplo ${ej} pasa el validador sin errores ni avisos`, r.ok && r.avisos.length === 0, r.errores[0]?.mensaje ?? r.avisos[0]?.mensaje);
  }
  const roto = JSON.parse(readFileSync(p("ejemplos", "insulina-glucosa", "plan.json"), "utf8"));
  roto.escenas[2].elementos[0].cuando = "frase que nadie dice";
  roto.escenas[3].elementos.push({ tipo: "etiqueta", cuando: "receptor", x: 50, y: 50, texto: "A" }, { tipo: "etiqueta", cuando: "receptor", x: 50, y: 50, texto: "B" });
  const rr = await validarPlan(roto, JSON.parse(readFileSync(p("ejemplos", "insulina-glucosa", "timestamps.json"), "utf8")));
  prueba("el validador detecta un ancla inventada", rr.errores.some((e) => /no está en el guion|no coincide/.test(e.mensaje)));
  prueba("el validador detecta dos textos pisados", rr.errores.some((e) => /se pisan dos textos/i.test(e.mensaje)));
  prueba("limpiarNulos quita los null anidados", JSON.stringify(limpiarNulos({ a: 1, b: null, c: [{ d: null, e: 2 }] })) === '{"a":1,"c":[{"e":2}]}');
  const orden = ordenarCandidatos(["gpt-realtime-mini", "gpt-6-transcribe", "gpt-6-luna", "gpt-6-astra", "gpt-6.1-sol", "gpt-5.6-sol", "text-embedding-3-large", "gpt-4o", "gpt-6.1-sol-2026-09-29", "gpt-6-pro"]);
  prueba("la elección automática prefiere el modelo equilibrado más reciente", orden[0] === "gpt-6.1-sol", orden.join(", "));
  prueba("la elección automática descarta audio, embeddings y pro", !orden.some((m) => /realtime|transcribe|embedding|pro$/.test(m)), orden.join(", "));
  const ok1 = { type: "object", properties: { a: { type: "string", enum: ["x"] } }, required: ["a"], additionalProperties: false };
  prueba("el mini-validador de esquemas rechaza valores fuera del enum", validarEsquema({ a: "y" }, ok1).length === 1);

  // ------------------------------------------------------------ nichos, iconos, voz y plantilla colombiana
  console.log("\nNichos, iconos, voz y plantilla");
  const { cargarPerfil, listarPerfiles, paletas, validarBrief, leerBrief } = await import("./perfil.mjs");
  const { cargarCatalogo } = await import("./puente.mjs");
  const ids = listarPerfiles().map((x) => x.id);
  prueba("existen los perfiles medicina-ar e inmobiliario-co", ids.includes("medicina-ar") && ids.includes("inmobiliario-co"), ids.join(", "));
  prueba("el nombre antiguo «medicina» sigue funcionando (alias)", cargarPerfil("medicina").id === "medicina-ar");
  for (const id of ["medicina-ar", "inmobiliario-co"]) {
    const pf = cargarPerfil(id);
    prueba(`perfil ${id}: prompts completos, paleta existente y voz de desarrollo y producción`, ["guion", "revisor", "plan", "critica", "post"].every((k) => pf.prompts[k].length > 200) && Boolean(paletas()[pf.paleta]) && Boolean(pf.voces?.dev?.voz) && Boolean(pf.voces?.prod?.openai?.instrucciones));
  }
  prueba("medicina-ar pide voseo y voz es-AR; inmobiliario-co pide tuteo colombiano y voz es-CO", /voseo/i.test(cargarPerfil("medicina-ar").prompts.guion) && cargarPerfil("medicina-ar").voces.dev.voz === "es-AR-TomasNeural" && /colombian/i.test(cargarPerfil("inmobiliario-co").prompts.guion) && cargarPerfil("inmobiliario-co").voces.dev.voz.startsWith("es-CO"));
  const pal = paletas().colombia.colores;
  prueba("paleta colombia: fondo #0F172A, esmeralda #10B981 y ámbar #F59E0B", pal.fondo === "#0F172A" && pal.azul === "#10B981" && pal.amarillo === "#F59E0B");
  const cat = cargarCatalogo();
  const iconosPro = JSON.parse(readFileSync(p("src", "dsl", "iconos-pro.json"), "utf8"));
  const enumIconos = cat.elementos.icono.props.icono.valores;
  const esperados = [...Object.keys(iconosPro.hi).map((k) => `hi-${k}`), ...Object.keys(iconosPro.lu).map((k) => `lu-${k}`)];
  prueba("el catálogo ofrece exactamente los iconos de healthicons y lucide de iconos-pro.json", esperados.every((n) => enumIconos.includes(n)) && enumIconos.filter((n) => /^(hi|lu)-/.test(n)).length === esperados.length);
  const generado = readFileSync(p("src", "dsl", "elementos", "iconosPro.generated.tsx"), "utf8");
  prueba("iconosPro.generated.tsx está sincronizado (npm run iconos)", esperados.every((n) => generado.includes(`"${n.slice(3)}":`)));
  prueba("catálogo: forma admite estrella/hexagono/triangulo/pastel y precio admite sufijo", ["estrella", "hexagono", "triangulo", "pastel"].every((f) => cat.elementos.forma.props.forma.valores.includes(f)) && Boolean(cat.elementos.precio.props.sufijo));
  prueba("los 8 efectos de sonido existen en public/sfx (incluye cash y heartbeat)", ["pop", "whoosh", "heartbeat", "cash", "tick", "thud", "zap", "ding"].every((n) => existsSync(p("public", "sfx", `${n}.wav`))));

  // alineación de palabras de la voz con el guion
  const { alinearConGuion } = await import("../voz/comun.mjs");
  const { parsearVtt } = await import("../voz/edge.mjs");
  const ar = p("trabajo", "archivo", "dolor-referido-infarto", "datos");
  if (existsSync(join(ar, "tiempos.vtt"))) {
    const tokens = readFileSync(join(ar, "guion.txt"), "utf8").trim().split(/\s+/);
    const marcas = parsearVtt(readFileSync(join(ar, "tiempos.vtt"), "utf8"));
    const ref = JSON.parse(readFileSync(join(ar, "timestamps.json"), "utf8"));
    const al = alinearConGuion(tokens, marcas);
    prueba("el alineador reproduce exactamente los tiempos de un video ya entregado", al.palabras.length === ref.length && al.palabras.every((w, i) => w.word === ref[i].word && Math.abs(w.start - ref[i].start) < 0.002), `cobertura ${al.cobertura}`);
    const roto = marcas.filter((_, i) => i !== 9).map((m, i) => (i === 20 ? { ...m, word: m.word.slice(0, -1) + "x" } : m));
    roto.splice(30, 0, { word: "eh", start: roto[29].end, end: roto[29].end + 0.05 });
    const al2 = alinearConGuion(tokens, roto);
    prueba("el alineador tolera una palabra perdida, una errata y una palabra de más", al2.palabras.length === tokens.length && al2.cobertura > 0.95 && al2.palabras.every((w, i) => i === 0 || w.start >= al2.palabras[i - 1].start), `cobertura ${al2.cobertura}`);
  }

  // voz de producción (OpenAI y ElevenLabs simulados)
  {
    const { iniciarMock } = await import("./mock-server.mjs");
    const m = await iniciarMock(0);
    const correr = (args, env) => new Promise((res) => {
      const c = spawn(process.execPath, [p("scripts", "generar-voz.mjs"), ...args], { cwd: RAIZ, env: { ...process.env, ...env } });
      let o = "";
      c.stdout.on("data", (d) => (o += d));
      c.stderr.on("data", (d) => (o += d));
      c.on("close", (codigo) => res({ codigo, salida: o }));
    });
    const texto = "¿Alguna vez te preguntaste por qué un infarto duele en el brazo izquierdo? Fijate lo que pasa en tu cuerpo: el corazón envía señales por los nervios sensitivos hacia la médula espinal, y el cerebro las confunde con el brazo.";
    const nPal = texto.split(/\s+/).length;
    let rv = await correr(["--mode=prod", "--proveedor", "openai", "--texto", texto, "--perfil", "medicina-ar"], { OPENAI_API_KEY: "x", OPENAI_BASE_URL: m.url });
    const tsv = () => JSON.parse(readFileSync(p("src", "data", "timestamps.json"), "utf8"));
    prueba("voz prod OpenAI: gpt-4o-mini-tts + whisper-1 (verbose_json, word) → timestamps.json con las palabras del guion", rv.codigo === 0 && tsv().length === nPal && m.estado.ultimaVoz?.modelo === "gpt-4o-mini-tts" && m.estado.ultimaTranscripcion?.modelo === "whisper-1" && m.estado.ultimaTranscripcion?.formato === "verbose_json" && m.estado.ultimaTranscripcion?.granularidad === "word", rv.salida.slice(-300));
    prueba("voz prod OpenAI: envía la entonación del perfil en «instructions»", /argentino/i.test(m.estado.ultimaVoz?.instrucciones ?? ""), String(m.estado.ultimaVoz?.instrucciones));
    prueba("voz prod OpenAI: meta.json recoge modo, proveedor y duración", (() => { const mt = JSON.parse(readFileSync(p("src", "data", "meta.json"), "utf8")); return mt.modo === "prod" && mt.proveedor === "openai" && mt.duracionAudio > 5; })());
    process.env.MOCK_WHISPER_ERRORES = "1";
    rv = await correr(["--mode=prod", "--proveedor", "openai", "--texto", texto], { OPENAI_API_KEY: "x", OPENAI_BASE_URL: m.url, MOCK_WHISPER_ERRORES: "1" });
    delete process.env.MOCK_WHISPER_ERRORES;
    prueba("voz prod OpenAI con transcripción imperfecta: sigue alineando todas las palabras", rv.codigo === 0 && tsv().length === nPal && /sin pareja/i.test(rv.salida), rv.salida.slice(-300));
    rv = await correr(["--mode=prod", "--proveedor", "elevenlabs", "--texto", texto], { ELEVENLABS_API_KEY: "x", ELEVENLABS_BASE_URL: m.url.replace(/\/v1$/, "") });
    prueba("voz prod ElevenLabs: /with-timestamps → palabras del guion con tiempos", rv.codigo === 0 && tsv().length === nPal && m.estado.voz.elevenlabs === 1, rv.salida.slice(-300));
    rv = await correr(["--mode=prod", "--proveedor", "openai", "--texto", texto], { OPENAI_API_KEY: "", OPENAI_BASE_URL: m.url });
    prueba("voz prod sin clave: falla con un mensaje claro (no inventa audio)", rv.codigo === 1 && /Falta OPENAI_API_KEY/.test(rv.salida), rv.salida.slice(-200));
    await m.cerrar();
  }

  // plantilla colombiana (sin IA) con los datos del ejemplo
  {
    const ex = p("ejemplos", "inmobiliario-co-apartamento");
    const { generarInmobiliaria, fusionarEscenasCortas } = await import("../plantillas/inmobiliaria.mjs");
    const brief = leerBrief(join(ex, "brief.json"));
    const pfCo = cargarPerfil("inmobiliario-co");
    prueba("el brief de ejemplo inmobiliario-co valida (defaults COP/Venta aplicados)", validarBrief(brief, pfCo).ok);
    const medios = brief.fotos.map((f) => ({ archivo: f.archivo, tipo: "foto", ancho: 1280, alto: 960, descripcion: f.descripcion })).concat([{ archivo: "logo.png", tipo: "logo" }]);
    const gen = generarInmobiliaria({ brief, medios, locale: "co" });
    prueba("plantilla CO: tuteo, léxico colombiano, millones de pesos y rentabilidad ESTIMADA", /Ojo a este dato/.test(gen.guion) && /parqueaderos/.test(gen.guion) && /quinientos veinte millones de pesos/.test(gen.guion) && /estimada/.test(gen.guion) && !/Mirá|Escribinos|departamento/.test(gen.guion), gen.guion);
    prueba("plantilla CO: el precio sale como «520 millones» en COP", gen.plan.escenas.flatMap((e) => e.elementos).some((el) => el.tipo === "precio" && el.valor === "520" && el.sufijo === "millones" && el.moneda === "COP"));
    const exTs = JSON.parse(readFileSync(join(ex, "timestamps.json"), "utf8"));
    // las fotos se importan como .jpg (reducidas): los nombres del plan son los importados
    const importados = medios.map((x) => ({ ...x, archivo: x.tipo === "foto" ? x.archivo.replace(/\.png$/, ".jpg") : x.archivo }));
    const rco = await validarPlan(JSON.parse(readFileSync(join(ex, "plan.json"), "utf8")), exTs, { perfil: pfCo, media: importados });
    prueba("el plan de ejemplo inmobiliario-co pasa el validador sin errores", rco.ok, rco.errores[0]?.mensaje);
    const planCorto = { proyecto: { id: "x" }, portada: { escena: "b" }, escenas: [{ id: "a", desde: "uno", elementos: [{ tipo: "etiqueta", cuando: "uno" }] }, { id: "b", desde: "dos", elementos: [], fondo: { foto: "f.jpg" } }, { id: "c", desde: "tres", elementos: [] }] };
    const n = fusionarEscenasCortas(planCorto, (pl) => ({ inicios: pl.escenas.map((_, i) => i * (pl.escenas.length > 2 ? 1 : 5)), fines: pl.escenas.map((_, i) => i * (pl.escenas.length > 2 ? 1 : 5) + (pl.escenas.length > 2 ? 1 : 5)) }));
    prueba("las escenas de menos de 2 s se fusionan con su vecina (y lo anterior se retira al empezar la siguiente)", n >= 1 && planCorto.escenas.length < 3 && planCorto.escenas[0].elementos[0].hasta === "dos", JSON.stringify(planCorto.escenas.map((e) => e.id)));
  }

  // ------------------------------------------------------------ agente con nicho y brief (servidor simulado)
  console.log("\nAgente con nicho y brief");
  {
    const ex = p("ejemplos", "inmobiliario-co-apartamento");
    for (const f of ["guion.txt", "timestamps.json", "meta.json"]) copyFileSync(join(ex, f), p("src", "data", f));
    const rn = spawnSync(process.execPath, [p("scripts", "ia", "agente.mjs"), "--prueba", "--nicho", "inmobiliario-co", "--brief", ex, "--si", "--sin-vision", "--sin-voz", "--id", "prueba-co"], { cwd: RAIZ, encoding: "utf8", timeout: 180000 });
    const salida = `${rn.stdout}\n${rn.stderr}`;
    prueba("agente con --nicho inmobiliario-co --brief: termina bien y valida el plan con las fotos del brief", rn.status === 0 && /0 error\(es\), 0 aviso\(s\)/.test(salida), salida.slice(-500));
    const t = JSON.parse(readFileSync(p("src", "data", "tema.json"), "utf8"));
    const marca = JSON.parse(readFileSync(p("src", "data", "marca.json"), "utf8"));
    prueba("el proyecto activo queda con su nicho, la paleta colombia y el logo importado", t.perfil === "inmobiliario-co" && marca.colores.fondo === "#0F172A" && marca.logo === "logo.png");
    prueba("las fotos del brief se importan a public/media y a media.json", existsSync(p("public", "media", "sala.jpg")) && JSON.parse(readFileSync(p("src", "data", "media.json"), "utf8")).filter((x) => x.tipo === "foto").length === 5);
    const rm = spawnSync(process.execPath, [p("scripts", "ia", "agente.mjs"), "--prueba", "--nicho", "inmobiliario-co", "--brief", ex, "--si", "--sin-vision", "--sin-voz", "--solo-guion", "--id", "prueba-co2"], { cwd: RAIZ, encoding: "utf8", timeout: 180000 });
    prueba("agente --solo-guion con brief deja guion.json para aprobarlo en el panel", rm.status === 0 && existsSync(p("trabajo", "ia", "prueba-co2", "guion.json")));
    rmSync(p("trabajo", "ia", "prueba-co"), { recursive: true, force: true });
    rmSync(p("trabajo", "ia", "prueba-co2"), { recursive: true, force: true });
  }

  // ------------------------------------------------------------ panel (API y seguridad)
  console.log("\nPanel web (API y seguridad)");
  {
    const { iniciarPanel } = await import("../panel/servidor.mjs");
    const panel = await iniciarPanel({ puerto: 4390 });
    const llamar = (metodo, ruta, { cuerpo, cabeceras = {}, raw } = {}) => new Promise((res, rej) => {
      const u = new URL(panel.url + ruta);
      const datos = raw ?? (cuerpo === undefined ? null : Buffer.from(JSON.stringify(cuerpo)));
      const rq = request({ host: "127.0.0.1", port: u.port, path: u.pathname + u.search, method: metodo, headers: { ...(metodo !== "GET" ? { "X-VideMed": "panel" } : {}), ...(datos ? { "Content-Length": datos.length, "Content-Type": raw ? "application/octet-stream" : "application/json" } : {}), ...cabeceras } }, (r) => {
        const t = [];
        r.on("data", (c) => t.push(c));
        r.on("end", () => { const txt = Buffer.concat(t).toString("utf8"); let j = null; try { j = JSON.parse(txt); } catch { /* no JSON */ } res({ codigo: r.statusCode, json: j, texto: txt }); });
      });
      rq.on("error", rej);
      if (datos) rq.write(datos);
      rq.end();
    });
    try {
      let r = await llamar("GET", "/");
      prueba("el panel sirve la interfaz", r.codigo === 200 && /VideMed/.test(r.texto));
      r = await llamar("GET", "/api/perfiles");
      prueba("API /perfiles lista los dos nichos principales con sus campos", r.codigo === 200 && r.json.perfiles.filter((x) => x.principal).map((x) => x.id).sort().join() === "inmobiliario-co,medicina-ar" && r.json.perfiles.find((x) => x.id === "inmobiliario-co").campos.length > 20);
      r = await llamar("POST", "/api/cancelar", { cabeceras: { "X-VideMed": "" } });
      prueba("seguridad: un POST sin la cabecera del panel se rechaza (403)", r.codigo === 403);
      r = await llamar("GET", "/api/estado", { cabeceras: { Host: "evil.example.com" } });
      prueba("seguridad: un Host que no es localhost se rechaza (anti DNS-rebinding)", r.codigo === 403);
      r = await llamar("GET", "/salida/..%2F..%2Fpackage.json");
      prueba("seguridad: no se puede salir de la carpeta de resultados con ../", r.codigo === 403 || r.codigo === 404, String(r.codigo));
      r = await llamar("GET", "/api/ajustes");
      prueba("seguridad: las claves nunca salen del servidor (solo «configurada» y 4 últimos)", r.codigo === 200 && typeof r.json.OPENAI_API_KEY === "object" && !JSON.stringify(r.json).includes("sk-"));
      r = await llamar("POST", "/api/proyectos", { cuerpo: { perfil: "inmobiliario-co", id: "prueba-panel", tema: "", datos: { ubicacion: "Chapinero, Bogotá", tipo: "Apartamento", puntosFuertes: ["terraza"] }, marca: {}, fotos: [] } });
      prueba("crear proyecto: guarda el brief y aplica los valores por defecto (Venta, COP)", r.codigo === 200 && r.json.id === "prueba-panel" && leerBrief(p("proyectos", "prueba-panel", "brief.json")).datos.moneda === "COP", r.texto.slice(0, 200));
      const png = readFileSync(p("ejemplos", "inmobiliario-co-apartamento", "media", "sala.png"));
      r = await llamar("PUT", "/api/proyectos/prueba-panel/media/Sala%20Principal.PNG", { raw: png });
      prueba("subir foto: se guarda con nombre seguro", r.codigo === 200 && r.json.medios.some((x) => x.archivo === "sala-principal.png" && x.tipo === "foto"), r.texto.slice(0, 200));
      r = await llamar("PUT", "/api/proyectos/prueba-panel/media/virus.exe", { raw: Buffer.from("MZ") });
      prueba("subir archivo no permitido (.exe): se rechaza", r.codigo === 415);
      r = await llamar("POST", "/api/proyectos/prueba-panel/guion", { cuerpo: { guion: "Ojo a este dato si vas a comprar un apartamento en Chapinero. Tiene tres habitaciones y dos baños.", aprobado: true } });
      prueba("aprobar guion: lo guarda y marca la etapa", r.codigo === 200 && r.json.estado.etapas.guion.ok === true, r.texto.slice(0, 200));
      r = await llamar("POST", "/api/accion", { cuerpo: { nombre: "voz", proyecto: "prueba-panel", opciones: { modo: "prod", proveedor: "openai" } } });
      const ocupadoOk = r.codigo === 200 || r.codigo === 409 || r.codigo === 412;
      prueba("acciones: la API acepta o explica por qué no (nunca se cuelga)", ocupadoOk, r.texto.slice(0, 200));
      // espera a que termine el posible trabajo para no dejar procesos huérfanos
      for (let i = 0; i < 60; i++) { const e = await llamar("GET", "/api/estado"); if (!e.json.trabajo || e.json.trabajo.estado !== "corriendo") break; await new Promise((x) => setTimeout(x, 500)); }
      r = await llamar("POST", "/api/accion", { cuerpo: { nombre: "escenas-ia", proyecto: "prueba-panel", opciones: {} } });
      prueba("acciones: escenas con IA sin clave explican que hace falta la clave (412) o se lanzan", [200, 412].includes(r.codigo), r.texto.slice(0, 200));
      r = await llamar("DELETE", "/api/proyectos/prueba-panel");
      prueba("borrar proyecto", r.codigo === 200 && !existsSync(p("proyectos", "prueba-panel")));
    } finally {
      await panel.cerrar();
    }
  }

  // ------------------------------------------------------------ agente completo
  console.log("\nAgente completo (servidor simulado)");
  const ej = p("ejemplos", "insulina-glucosa");
  for (const f of ["guion.txt", "timestamps.json", "meta.json"]) copyFileSync(join(ej, f), p("src", "data", f));
  const tema = "Por qué la insulina baja el azúcar";
  const base = ["--prueba", "--sin-voz", "--sin-vision"];
  const agente = (extra, env = {}) => {
    const r = spawnSync(process.execPath, [p("scripts", "ia", "agente.mjs"), ...extra], { cwd: RAIZ, encoding: "utf8", env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"], timeout: 180000 });
    return { codigo: r.status, salida: `${r.stdout}\n${r.stderr}` };
  };
  const planActivo = () => JSON.parse(readFileSync(p("src", "data", "plan.json"), "utf8"));

  let r = agente([tema, ...base, "--si", "--id", "prueba-1"]);
  prueba("camino feliz: termina con código 0 y plan sin errores", r.codigo === 0 && /0 error\(es\), 0 aviso\(s\)/.test(r.salida), r.salida.slice(-400));
  prueba("camino feliz: escribe plan.json, tema.json y post.txt", existsSync(p("src", "data", "post.txt")) && planActivo().escenas.length >= 5 && JSON.parse(readFileSync(p("src", "data", "tema.json"), "utf8")).id === "prueba-1");
  prueba("camino feliz: el plan guardado no contiene null", !JSON.stringify(planActivo()).includes("null"));
  prueba("camino feliz: deja el tema dinámico activo", /scenes\/dinamico/.test(readFileSync(p("src", "tema.ts"), "utf8")));
  prueba("camino feliz: genera informe.md", existsSync(p("trabajo", "ia", "prueba-1", "informe.md")));

  r = agente([tema, ...base, "--si", "--id", "prueba-2"], { MOCK_GUION_CORTO: "1", MOCK_REVISION_FALLA: "1", MOCK_PLAN_ERRORES: "1", MOCK_SIN_RESPONSES: "1" });
  prueba("guion corto → pide ajuste de longitud", /pido ajuste/.test(r.salida));
  prueba("el revisor médico puede corregir el guion", /El revisor corrige el guion/.test(r.salida));
  prueba("plan defectuoso → bucle de reparación hasta 0 errores", /reparar plan/.test(r.salida) && /ronda 1: .*0 error\(es\)/.test(r.salida) && r.codigo === 0, r.salida.slice(-500));
  prueba("sin /responses → cae a chat/completions", /uso \/chat\/completions/.test(r.salida));

  r = agente([tema, ...base, "--si", "--id", "prueba-3"], { MOCK_ERRORES: "429:2" });
  prueba("errores 429 → reintenta y termina bien", /reintento 1\/4/.test(r.salida) && r.codigo === 0, r.salida.slice(-300));

  r = agente([tema, ...base, "--id", "prueba-4"]);
  prueba("sin --si y sin terminal: se detiene a pedir visto bueno (código 3)", r.codigo === 3 && /visto bueno/.test(r.salida));

  r = agente([tema, ...base, "--si", "--rondas", "1", "--id", "prueba-5"], { MOCK_PLAN_SIEMPRE_MAL: "1" });
  prueba("plan imposible: sale con código 4 y guarda plan-mejor.json", r.codigo === 4 && existsSync(p("trabajo", "ia", "prueba-5", "plan-mejor.json")), r.salida.slice(-300));

  r = agente([tema, ...base, "--si", "--rondas", "1", "--emergencia", "--id", "prueba-6"], { MOCK_PLAN_SIEMPRE_MAL: "1" });
  prueba("--emergencia: genera un plan sencillo que valida", r.codigo === 0 && /plan de emergencia/.test(r.salida), r.salida.slice(-300));
  const ts = JSON.parse(readFileSync(p("src", "data", "timestamps.json"), "utf8"));
  prueba("el plan de emergencia pasa el validador", (await validarPlan(planActivo(), ts)).ok);

  r = agente(["--guion", p("src", "data", "guion.txt"), ...base, "--id", "prueba-7"]);
  prueba("--guion: usa el guion del usuario sin pedir aprobación", r.codigo === 0 && /no se modificará/.test(r.salida), r.salida.slice(-300));

  r = agente(["--solo-plan", "--prueba", "--sin-vision", "--id", "prueba-8"]);
  prueba("--solo-plan: diseña escenas con el guion y la voz ya existentes", r.codigo === 0 && /Guion de src\/data/.test(r.salida), r.salida.slice(-300));

  r = agente(["--solo-plan", "--prueba", "--sin-vision", "--comentario", "pon la etiqueta más a la izquierda", "--id", "prueba-8b"]);
  prueba("--solo-plan --comentario: retoca el plan existente con tus indicaciones", r.codigo === 0 && /Retoco el plan actual/.test(r.salida) && /reparar plan/.test(r.salida), r.salida.slice(-300));

  agente([tema, ...base, "--si", "--solo-guion", "--id", "prueba-9"]);
  r = agente([tema, ...base, "--si", "--reanudar", "--id", "prueba-9"]);
  prueba("--reanudar reutiliza el guion aprobado", /Reutilizo el guion aprobado/.test(r.salida) && r.codigo === 0, r.salida.slice(-300));

  if (conVision) {
    console.log("\nRevisión visual (renderiza capturas reales; tarda)");
    r = agente([tema, "--prueba", "--sin-voz", "--si", "--id", "prueba-10"], { MOCK_CRITICA: "1" });
    prueba("visión: capturas → crítica grave → reparación → segunda ronda aprobada", /1 grave\(s\)/.test(r.salida) && /plan corregido/.test(r.salida) && /0 grave\(s\)/.test(r.salida) && r.codigo === 0, r.salida.slice(-600));
  }
} finally {
  restaurar();
}

console.log(`\n${falladas.length ? "❌" : "✅"} ${pasadas} pruebas correctas, ${falladas.length} fallidas${falladas.length ? ": " + falladas.join(" · ") : ""}`);
console.log("   (se restauró el proyecto que tenías activo)");
process.exit(falladas.length ? 1 : 0);
