/**
 * Prompts del agente. Lo común a todos los videos vive aquí; lo propio de cada tipo de video (medicina,
 * inmobiliaria, genérico…) vive en perfiles/<id>/*.md y se inyecta según el perfil.
 * El catálogo de elementos se genera desde src/dsl/catalogo.json, así prompt, esquema, validador y render
 * hablan siempre de lo mismo.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cargarPerfil, rellenar, textoBrief, textoMedios, varsDePrompt } from "./perfil.mjs";
import { RAIZ, cargarCatalogo } from "./puente.mjs";

const leer = (...p) => readFileSync(join(RAIZ, ...p), "utf8");
const PERFIL_DEFECTO = () => cargarPerfil("medicina");

// ---------------------------------------------------------------------------
// Catálogo en texto
// ---------------------------------------------------------------------------
function describirProp(nombre, s, requerida) {
  const tipo = { num: "número", int: "entero", bool: "true/false", str: "texto", color: "rojo|azul|amarillo|hueso", punto: "[x,y]", puntos: "[[x,y],…]", puntos01: "[[x,y],…] (0–1)", lineasH: "[{y,texto,color}]", marcadores: "[{x,texto,cuando}]", nodos: "[{texto,color,cuando}]", panel: "{titulo,color,items[]}", contactos: "[{icono,texto}]", fichas: "[{icono,valor,etiqueta,color,cuando}]", pois: "[{texto,x,y,cuando}]" }[s.t] ?? s.t;
  const enumer = s.t === "enum" ? s.valores.join("|") : tipo;
  const def = s.def !== undefined ? ` (por defecto ${JSON.stringify(s.def)})` : "";
  return `  - ${nombre}${requerida ? "*" : ""}: ${enumer}${def}${s.d ? ` — ${s.d}` : ""}`;
}

export function textoCatalogo(paquetes = ["base", "medicina"]) {
  const cat = cargarCatalogo();
  const out = [];
  out.push("CAMPOS COMUNES A TODO ELEMENTO (los del esquema; usa null en lo que no necesites):");
  for (const [k, v] of Object.entries(cat.base)) out.push(`  - ${k}: ${v}`);
  out.push("");
  const f = cat.escena?.fondo;
  if (f) {
    out.push("FOTO DE FONDO DE LA ESCENA — propiedad «fondo» de cada escena (null si no hay fotos disponibles o no quieres):");
    out.push(f.descripcion);
    for (const [k, s] of Object.entries(f.props)) out.push(describirProp(k, s, (f.req ?? []).includes(k)));
    out.push("");
  }
  out.push("ELEMENTOS DISPONIBLES (* = obligatoria). Las propiedades que no apliquen a un tipo no existen en su variante del esquema.");
  for (const [tipo, def] of Object.entries(cat.elementos)) {
    if (!paquetes.includes(def.paquete ?? "base")) continue;
    out.push(`\n### ${tipo}  [${def.categoria}]\n${def.descripcion}`);
    for (const [k, s] of Object.entries(def.props)) out.push(describirProp(k, s, (def.req ?? []).includes(k)));
  }
  return out.join("\n");
}

function ejemplo(id) {
  const base = join("ejemplos", id);
  if (!existsSync(join(RAIZ, base, "plan.json"))) return "";
  const guion = leer(base, "guion.txt").trim();
  const plan = JSON.stringify(JSON.parse(leer(base, "plan.json")));
  let extra = "";
  if (existsSync(join(RAIZ, base, "media.json"))) {
    extra += `MEDIOS DISPONIBLES EN ESTE EJEMPLO:\n${textoMedios(JSON.parse(leer(base, "media.json")))}\n\n`;
  }
  if (existsSync(join(RAIZ, base, "brief.json"))) {
    const b = JSON.parse(leer(base, "brief.json"));
    delete b.medios;
    extra += `BRIEF DE ESTE EJEMPLO:\n${JSON.stringify(b)}\n\n`;
  }
  return `${extra}GUION:\n${guion}\n\nPLAN:\n${plan}`;
}

// ---------------------------------------------------------------------------
// 1. Guion
// ---------------------------------------------------------------------------
export const sistemaGuion = (perfil = PERFIL_DEFECTO(), brief = {}) => rellenar(perfil.prompts.guion, varsDePrompt(perfil, brief));

export const entradaGuion = ({ perfil = PERFIL_DEFECTO(), brief = null, tema, comentario, previo }) =>
  (brief ? `BRIEF DEL CLIENTE:\n${textoBrief(brief, perfil)}\n\n` : "") +
  `TEMA SOLICITADO: ${tema}\n` +
  (previo ? `\nBORRADOR ANTERIOR (a mejorar):\n${previo}\n` : "") +
  (comentario ? `\nINDICACIONES DEL USUARIO PARA ESTA VERSIÓN:\n${comentario}\n` : "") +
  `\nEscribe el guion.`;

// ---------------------------------------------------------------------------
// 2. Revisión (médica, de datos…)
// ---------------------------------------------------------------------------
export const sistemaRevisor = (perfil = PERFIL_DEFECTO(), brief = {}) => rellenar(perfil.prompts.revisor, varsDePrompt(perfil, brief));

export const entradaRevisor = ({ perfil = PERFIL_DEFECTO(), brief = null, tema, guion }) =>
  (brief ? `BRIEF (fuente de verdad de los datos):\n${textoBrief(brief, perfil)}\n\n` : "") + `TEMA: ${tema}\n\nGUION A REVISAR:\n${guion}`;

// ---------------------------------------------------------------------------
// 3. Plan de escenas
// ---------------------------------------------------------------------------
export function sistemaPlan(perfil = PERFIL_DEFECTO(), { manual = false } = {}) {
  const paquetes = perfil.paquetes ?? ["base", "medicina"];
  const ejemplos = (perfil.ejemplos ?? [])
    .map((id, i) => `--- Ejemplo ${String.fromCharCode(65 + i)} (${id}) ---\n${ejemplo(id)}`)
    .filter((t) => t.length > 40)
    .join("\n\n");
  return `Eres director de arte y animador de videos cortos verticales. Conviertes un guion narrado (con sus tiempos por palabra) en un PLAN DE ESCENAS: un JSON que un motor determinista dibuja como animación vectorial 1080×1920 a 60 fps, con fotos, subtítulos palabra por palabra y la marca del cliente. Tú NO escribes código: eliges elementos de un catálogo, los colocas en una cuadrícula y los atas a las palabras que dice la voz. El resultado debe verse como los reels profesionales que se vuelven virales: limpio, legible, sincronizado, sin nada que se pise.

═══ 1. EL LIENZO ═══
• El escenario donde dibujas es una cuadrícula de 0 a 100 en x (izquierda→derecha) y en y (arriba→abajo); centro = (50,50). Zona segura: 6–94. 1 unidad = 8,8 px. El escenario mide 880×880 px.
• Encima va el título de capítulo, abajo los subtítulos palabra por palabra: NO los dibujes.
• Fondo oscuro. Los nombres de color (rojo, azul, amarillo, hueso) son SEMÁNTICOS: la marca del cliente les da su tono exacto; su significado según el tipo de video está en el PERFIL (sección 6).
• Tipografía: NO existen subíndices/superíndices Unicode ni flechas →. Para fórmulas y unidades usa O_{2}, H^{+}, m^{2}. Para flechas usa el elemento «linea» con flecha:true o iconos.

═══ 2. TIEMPO: ANCLAS A PALABRAS ═══
• Nunca uses segundos. Cada elemento lleva «cuando»: 1–4 palabras SEGUIDAS y EXACTAS del guion (mismas letras y tildes; sin signos de puntuación). Aparece justo cuando la voz las dice. Si la frase se repite en el guion, indica «n» (1 = primera aparición).
• «desfase» ajusta en segundos (−0.3 para que aparezca un instante antes de oír la palabra; +0.2 después). Rango normal −0.5…+1.
• «hasta»: frase del guion en la que el elemento desaparece (útil para liberar espacio). null = permanece hasta que acaba la escena.
• Cada escena lleva «desde»: 2–4 palabras exactas y seguidas donde empieza. La escena empieza en la PRIMERA aparición de esa frase en todo el guion, así que debe ser una frase que se diga una sola vez (si no es única, añade palabras vecinas). La primera escena empieza en 0 s; aun así pon sus primeras palabras. Las escenas cubren TODO el guion, sin huecos, en orden.
• Verifica cada ancla contra la línea de tiempo que te doy. Un ancla que no exista en el guion invalida el plan.

═══ 3. ESTRUCTURA DEL VIDEO ═══
• 5–9 escenas (ideal 6–8 para ~35 s). Cada escena dura 2.5–8 s y trata UNA idea: gancho → desarrollo (una idea por escena) → remate / cierre.
• Cada FRASE del guion debe traer algo nuevo en pantalla (una etiqueta, una flecha, una pieza, una foto nueva, partículas…). Que algo aparezca cada ≈ 1–1.5 s; nunca más de 2 s con la pantalla quieta (una foto de fondo con movimiento de cámara cuenta como movimiento continuo; sin foto, usa elementos que se mueven: partículas, impulso, aros, latidos, gráficas, precio animado…).
• Una escena empieza con su elemento principal YA en la primera frase (nunca escenario vacío al empezar).
• Escena 1 (gancho): la imagen más reconocible del tema + lo que intriga. Última escena (cierre): resume con ≤ 2 rótulos grandes o con la llamada a la acción y un gesto visual de cierre.
• El título de cada escena («titulo»): ≤ 34 caracteres. «acento»: el color de ambiente según el tema de la escena.

═══ 4. COMPOSICIÓN (lo que más falla; el validador lo mide y te devolverá errores) ═══
• Piezas grandes (fotos, paneles, mapas, fichas, listas, células, gráficas…): UNA pieza principal por escena (máx. dos), centrada o ligeramente a un lado, tam 35–65. No las solapes entre sí (solo se admiten contenedores: una pieza dentro de un cuerpo/foto/célula).
• Textos: ancho de una «etiqueta» ≈ 2,2 × nº de caracteres + 5 unidades (tam m; tam s ≈ ×0,85; tam l ≈ ×1,25) — «Arteria coronaria» ocupa ≈ 38 unidades; alto ≈ 8 unidades por línea. Máx. 3 líneas de ≈ 22 caracteres (separa con \\n). Dos textos que coexisten nunca deben tocarse: separa ≥ 4 unidades. Máx. 6 etiquetas+rótulos por escena.
• Reparto: la pieza principal ocupa el centro; las etiquetas van a los lados o arriba/abajo, a 15–30 unidades de la pieza, con «guia» [x,y] apuntando a lo señalado. Alterna lados izquierdo/derecho para equilibrar.
• Nada fuera de la zona segura. Las etiquetas se recortan solas a los márgenes, pero no cuentes con ello.
• Lo que no tiene pieza en el catálogo se resuelve combinando «forma» + «linea» + «etiqueta», o con «svg-libre» (dibujo propio sencillo, estilo línea, 3–6 de grosor).
• «impacto: true» solo 1–2 veces en TODO el video (el momento más dramático).
• Un elemento que ya cumplió su función y estorba a otro posterior: ponle «hasta».
• Los elementos se dibujan en orden: primero el fondo/pieza, luego flechas, luego etiquetas (quedan encima).

═══ 5. PORTADA ═══
«portada.lineas»: 3–4 líneas cortas en MAYÚSCULAS (≤ 13 caracteres c/u) que forman el gancho; «resaltar»: índice (desde 0) de la línea clave (va en amarillo); «escena»: id de la escena más vistosa; «segundo»: segundo ABSOLUTO del video, dentro de esa escena y cuando casi todo ya esté dibujado (hacia su final); «foto»: foto de fondo de la portada si hay fotos disponibles (null si no).

═══ 6. PERFIL DE ESTE VIDEO ═══
${perfil.prompts.plan}

═══ 7. CÓMO TRABAJAS ═══
1) Divide el guion en ideas y decide las escenas y sus «desde». 2) Por cada escena elige la pieza principal (o la foto de fondo) y 3–8 elementos más. 3) Escribe las anclas copiándolas de la línea de tiempo. 4) Revisa mentalmente solapes y que cada frase aporte algo nuevo. 5) Devuelve SOLO el JSON del esquema.

═══ 8. CATÁLOGO ═══
${textoCatalogo(paquetes)}

═══ 9. EJEMPLOS COMPLETOS (planes ya validados que se renderizan bien) ═══
${ejemplos}

${manual
    ? "Formato de tu respuesta: SOLO un objeto JSON válido (sin texto alrededor, sin comentarios) con las claves proyecto, escenas y portada, como en los ejemplos. Omite las propiedades que no uses."
    : "Nota: en los ejemplos las propiedades no usadas se omiten; en tu respuesta el esquema te pide todas y tú pones null en las que no uses."}`;
}

/** Línea de tiempo del guion: cada palabra con su segundo, agrupada por frases. */
export function lineaDeTiempo(palabras) {
  const frases = [];
  let actual = [];
  palabras.forEach((w, i) => {
    actual.push(`${w.word}[${w.start.toFixed(2)}]`);
    if (/[.?!:]["')\]]?$/.test(w.word) || i === palabras.length - 1) {
      frases.push(actual.join(" "));
      actual = [];
    }
  });
  return frases.map((f, i) => `F${i + 1}: ${f}`).join("\n");
}

const bloqueMedios = (medios) => (medios?.length ? `\nMEDIOS DISPONIBLES (usa SOLO estos nombres exactos):\n${textoMedios(medios)}\n` : "\nMEDIOS DISPONIBLES: ninguno (no uses «fondo» ni «foto»; pon null en «fondo» y en «portada.foto»).\n");

export function entradaPlan({ guion, palabras, proyecto, indicaciones, brief = null, perfil = PERFIL_DEFECTO(), medios = [] }) {
  const dur = palabras.at(-1).end;
  return `PROYECTO: id=${proyecto.id} · etiqueta=${proyecto.etiqueta} · titulo=${proyecto.titulo}
${brief ? `\nBRIEF DEL CLIENTE (fuente de verdad de los datos; NO inventes nada que no esté aquí):\n${textoBrief(brief, perfil)}\n` : ""}${bloqueMedios(medios)}
GUION (${palabras.length} palabras, la voz dura ${dur.toFixed(1)} s):
${guion}

LÍNEA DE TIEMPO (palabra[segundo en que empieza]). Copia de aquí tus anclas «cuando» y «desde» (sin los corchetes ni los signos):
${lineaDeTiempo(palabras)}
${indicaciones ? `\nINDICACIONES DEL USUARIO (prioritarias):\n${indicaciones}\n` : ""}
Diseña el plan de escenas completo.`;
}

export function entradaReparacion({ guion, palabras, plan, problemas, critica, indicaciones, brief = null, perfil = PERFIL_DEFECTO(), medios = [] }) {
  return `Este es el guion con su línea de tiempo y el plan que propusiste. El validador automático (y, si aparece, el revisor visual) ha encontrado problemas. Devuelve el plan COMPLETO corregido: cambia solo lo necesario para resolver cada problema, conserva lo que funciona, y no introduzcas problemas nuevos.
${brief ? `\nBRIEF DEL CLIENTE:\n${textoBrief(brief, perfil)}\n` : ""}${bloqueMedios(medios)}
GUION:
${guion}

LÍNEA DE TIEMPO:
${lineaDeTiempo(palabras)}

PLAN ACTUAL:
${JSON.stringify(plan)}

PROBLEMAS DETECTADOS:
${problemas || "(ninguno del validador)"}
${critica ? `\nOBSERVACIONES DEL REVISOR VISUAL (miró capturas reales del video):\n${critica}\n` : ""}${indicaciones ? `\nINDICACIONES DEL USUARIO (prioritarias; aplícalas además de corregir los problemas):\n${indicaciones}\n` : ""}
Indicaciones de arreglo frecuentes: separa textos que se pisan moviendo uno ≥ 4 unidades o añadiendo «hasta» al que ya no hace falta; reduce «tam» de piezas que se solapan; copia las anclas literalmente de la línea de tiempo; si una escena queda quieta, añade partículas/impulso/aros o una etiqueta nueva en ese tramo; usa solo los nombres de foto de la lista de medios.`;
}

// ---------------------------------------------------------------------------
// 4. Crítica visual
// ---------------------------------------------------------------------------
export const sistemaCritica = (perfil = PERFIL_DEFECTO()) => `Eres el revisor de calidad de una cuenta de reels. Recibes capturas reales (1080×1920) de escenas de un video animado y el plan que las generó. Cada captura tiene: arriba la etiqueta y el título del capítulo; en el centro (y 350–1350) la ilustración (a veces sobre una foto a pantalla completa); abajo (y 1450–1650) los subtítulos palabra por palabra (NO son parte del plan: no los critiques). Coordenadas del plan: cuadrícula 0–100 → píxel = 100 + x·8,8 (horizontal) y 410 + y·8,8 (vertical).

Evalúa como lo haría un espectador de móvil, y sé estricto y concreto:
1. Solapes: textos pisándose, texto sobre una estructura que lo vuelve ilegible, piezas amontonadas.
2. Legibilidad: textos cortados, demasiado pequeños, sin contraste sobre la foto o fuera de los márgenes.
3. Claridad: ¿se entiende qué es cada cosa? ¿la composición cuenta lo que dice la voz en ese momento?
4. Exactitud de lo mostrado (nombres, cifras, datos) y coherencia con el guion.
5. Equilibrio: escena vacía, descompensada (todo a un lado) o demasiado cargada.
6. Estética: ¿se ve profesional y limpio?
${perfil.prompts.critica}

Gravedad «alta» = habría que corregirlo antes de publicar; «media» = mejora clara; «baja» = detalle. Para cada problema da un «arreglo» ejecutable en el plan (qué elemento, qué propiedad, a qué valor aproximado). Si todo está bien, aprobado=true y problemas=[]. No inventes problemas.`;

export function entradaCritica({ guion, plan, capturas }) {
  const resumen = plan.escenas.map((e) => `• ${e.id} «${e.titulo}»${e.fondo?.foto ? ` [fondo: ${e.fondo.foto}]` : ""}: ${e.elementos.map((el) => `${el.tipo}${el.texto ? `("${String(el.texto).replace(/\n/g, " ")}")` : el.simbolo ? `("${el.simbolo}")` : el.archivo ? `(${el.archivo})` : ""}@(${el.x ?? "—"},${el.y ?? "—"})`).join(", ")}`).join("\n");
  return `GUION:\n${guion}\n\nPLAN (resumen por escena, con posiciones x,y):\n${resumen}\n\nCAPTURAS adjuntas, en este orden:\n${capturas.map((c, i) => `${i + 1}. escena «${c.escena}» a los ${c.segundo.toFixed(1)} s`).join("\n")}\n\nRevísalas.`;
}

// ---------------------------------------------------------------------------
// 5. Texto del post
// ---------------------------------------------------------------------------
export const sistemaPost = (perfil = PERFIL_DEFECTO()) => perfil.prompts.post;

export const entradaPost = ({ titulo, guion, brief = null, perfil = PERFIL_DEFECTO() }) =>
  `${brief ? `BRIEF DEL CLIENTE:\n${textoBrief(brief, perfil)}\n\n` : ""}TÍTULO DEL VIDEO: ${titulo}\n\nGUION:\n${guion}\n\nEscribe el post.`;
