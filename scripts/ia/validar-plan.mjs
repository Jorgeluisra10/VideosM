/**
 * Validador determinista de un plan de escenas (lo que escribe la IA).
 * Devuelve errores (el plan NO debe renderizarse así) y avisos (conviene corregir), cada uno con una
 * descripción y un arreglo concreto, listos para devolvérselos al modelo en el bucle de reparación.
 *
 *   const { errores, avisos } = await validarPlan(plan, palabras)
 */
import { cargarCatalogo, cargarNucleo } from "./puente.mjs";

const COLORES = ["rojo", "azul", "amarillo", "hueso"];
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const FUERA_DE_FUENTE = /[→←↔⇒⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻₀₁₂₃₄₅₆₇₈₉≥≤≈∆αβγδμΩ✓✗★•]/u;

/** Rangos razonables por tipo y propiedad (más allá se considera un error de escala). */
const RANGOS = {
  corazon: { tam: [8, 80] },
  cerebro: { tam: [15, 70] },
  cuerpo: { tam: [30, 80] },
  brazo: { tam: [10, 60] },
  columna: { tam: [30, 90] },
  "corte-medula": { tam: [25, 80] },
  organo: { tam: [15, 80] },
  celula: { tam: [10, 80] },
  membrana: { ancho: [30, 100] },
  neurona: { tam: [30, 100] },
  grafica: { ancho: [40, 96], alto: [20, 70] },
  pasos: { ancho: [25, 96], alto: [14, 90] },
  comparacion: { ancho: [60, 96], alto: [30, 75] },
  dato: { tam: [6, 22] },
  rotulo: { tam: [5, 24] },
  icono: { tam: [4, 30] },
  "svg-libre": { tam: [8, 60] },
  forma: { ancho: [1, 100], alto: [1, 100] },
  aros: { radio: [2, 40] },
  rayos: { radio: [2, 30] },
  halo: { radio: [4, 60] },
  foto: { ancho: [30, 96], alto: [20, 80] },
  logo: { tam: [8, 50] },
  lista: { ancho: [40, 92] },
  cta: { ancho: [50, 94] },
  cinta: { tam: [3, 14] },
  ficha: { ancho: [50, 94] },
  precio: { tam: [8, 22] },
  mapa: { ancho: [50, 94], alto: [30, 70] },
  casa: { tam: [20, 80] },
};
const FONDO_MODOS = ["cubrir", "marco"];
const FONDO_MOVS = ["zoom-in", "zoom-out", "izquierda", "derecha", "arriba", "abajo", "fijo"];
const SIN_LIMITE_POSICION = new Set(["halo", "aros", "rayos", "vaso", "linea", "particulas", "impulso", "forma"]);

const esNum = (v) => typeof v === "number" && Number.isFinite(v);
const esPunto = (p, lo = -15, hi = 115) => Array.isArray(p) && p.length === 2 && p.every((n) => esNum(n) && n >= lo && n <= hi);

function validarValor(spec, v, nombre) {
  switch (spec.t) {
    case "num":
      return esNum(v) ? null : `${nombre} debe ser un número`;
    case "int":
      return Number.isInteger(v) ? null : `${nombre} debe ser un entero`;
    case "bool":
      return typeof v === "boolean" ? null : `${nombre} debe ser true/false`;
    case "str":
      return typeof v === "string" ? null : `${nombre} debe ser texto`;
    case "color":
      return COLORES.includes(v) ? null : `${nombre} debe ser uno de ${COLORES.join(", ")}`;
    case "enum":
      return spec.valores.includes(v) ? null : `${nombre} debe ser uno de: ${spec.valores.join(", ")}`;
    case "punto":
      return esPunto(v) ? null : `${nombre} debe ser [x,y] con valores 0–100`;
    case "puntos": {
      if (!Array.isArray(v) || v.length < 2 || v.length > 8) return `${nombre} debe tener entre 2 y 8 puntos [x,y]`;
      return v.every((p) => esPunto(p)) ? null : `${nombre}: cada punto debe ser [x,y] con valores 0–100`;
    }
    case "puntos01": {
      if (!Array.isArray(v) || v.length < 2 || v.length > 30) return `${nombre} debe tener entre 2 y 30 puntos [x,y]`;
      return v.every((p) => esPunto(p, 0, 1)) ? null : `${nombre}: cada punto debe ser [x,y] con x,y entre 0 y 1`;
    }
    case "lineasH":
      return Array.isArray(v) && v.length <= 4 && v.every((l) => l && esNum(l.y) && l.y >= 0 && l.y <= 1 && typeof l.texto === "string")
        ? null
        : `${nombre} debe ser una lista (máx. 4) de {y 0–1, texto, color}`;
    case "marcadores":
      return Array.isArray(v) && v.length <= 5 && v.every((m) => m && esNum(m.x) && m.x >= 0 && m.x <= 1 && typeof m.texto === "string")
        ? null
        : `${nombre} debe ser una lista (máx. 5) de {x 0–1, texto, cuando}`;
    case "nodos":
      return Array.isArray(v) && v.length >= 2 && v.length <= 6 && v.every((n) => n && typeof n.texto === "string" && n.texto.length > 0)
        ? null
        : `${nombre} debe tener entre 2 y 6 nodos {texto, color, cuando}`;
    case "contactos":
      return Array.isArray(v) && v.length <= 4 && v.every((c) => c && typeof c.texto === "string" && c.texto.length > 0)
        ? null
        : `${nombre} debe ser una lista (máx. 4) de {icono, texto}`;
    case "fichas":
      return Array.isArray(v) && v.length >= 2 && v.length <= 6 && v.every((c) => c && typeof c.valor === "string" && c.valor.length > 0 && typeof c.etiqueta === "string")
        ? null
        : `${nombre} debe tener entre 2 y 6 items {icono, valor, etiqueta}`;
    case "pois":
      return Array.isArray(v) && v.length <= 4 && v.every((c) => c && typeof c.texto === "string" && esNum(c.x) && c.x >= 0 && c.x <= 1 && esNum(c.y) && c.y >= 0 && c.y <= 1)
        ? null
        : `${nombre} debe ser una lista (máx. 4) de {texto, x 0–1, y 0–1}`;
    case "panel":
      return v && typeof v.titulo === "string" && Array.isArray(v.items) && v.items.length >= 1 && v.items.length <= 5 && v.items.every((i) => typeof i === "string")
        ? null
        : `${nombre} debe ser {titulo, color, items[1–5 textos]}`;
    default:
      return null;
  }
}

/** Para mostrar cajas en unidades 0–100 (lo que ve la IA). */
const unidades = (N, c) => ({
  x0: Math.round((c.x0 - N.X0) / N.U),
  y0: Math.round((c.y0 - N.Y0) / N.U),
  x1: Math.round((c.x1 - N.X0) / N.U),
  y1: Math.round((c.y1 - N.Y0) / N.U),
});
const fmt = (u) => `x ${u.x0}–${u.x1}, y ${u.y0}–${u.y1}`;

function etiquetaCorta(el) {
  const t = el.texto ?? el.simbolo ?? el.valor ?? el.titulo ?? "";
  return `${el.tipo}${t ? ` "${String(t).replace(/\n/g, " ").slice(0, 24)}"` : ""} (x=${el.x ?? "—"}, y=${el.y ?? "—"})`;
}

/**
 * @param plan      plan de escenas
 * @param palabras  timestamps.json
 * @param opciones  { perfil?: objeto de perfil (limita los elementos a sus paquetes), media?: lista de src/data/media.json }
 *                  Con `media` se comprueba que cada foto/logo nombrado exista; sin ella no se comprueba.
 */
export async function validarPlan(plan, palabras, opciones = {}) {
  const N = await cargarNucleo();
  const cat = cargarCatalogo();
  const paquetes = opciones.perfil?.paquetes ?? ["base", "medicina"];
  const media = Array.isArray(opciones.media) ? opciones.media : null;
  const nombresMedia = media ? new Set(media.map((m) => m.archivo)) : null;
  const dispMedia = () => (media?.length ? media.filter((m) => m.tipo !== "musica").map((m) => m.archivo).join(", ") : "ninguno (no uses fotos)");
  const comprobarMedia = (nombre, archivo, donde, ref) => {
    if (!nombresMedia || archivo === undefined || archivo === null) return;
    if (typeof archivo !== "string" || !nombresMedia.has(archivo)) E(nombre, `${donde}: la foto "${archivo}" no existe en los medios del proyecto.`, `Usa uno de estos nombres exactos: ${dispMedia()}.`, ref);
  };
  const errores = [];
  const avisos = [];
  function E(escena, mensaje, arreglo, elemento) {
    errores.push({ gravedad: "error", escena, elemento, mensaje, arreglo });
  }
  function A(escena, mensaje, arreglo, elemento) {
    avisos.push({ gravedad: "aviso", escena, elemento, mensaje, arreglo });
  }

  // ---------- estructura general ----------
  if (!plan || typeof plan !== "object") {
    E(null, "El plan no es un objeto JSON.", "Devuelve un objeto con proyecto, escenas y portada.");
    return { ok: false, errores, avisos, metricas: {} };
  }
  const p = plan.proyecto ?? {};
  if (!p.id || !KEBAB.test(p.id)) E(null, `proyecto.id "${p.id}" no es un slug válido.`, "Usa kebab-case sin tildes (p. ej. 'insulina-glucosa').");
  if (!p.etiqueta || p.etiqueta !== String(p.etiqueta).toUpperCase()) A(null, "proyecto.etiqueta debería estar en MAYÚSCULAS (p. ej. 'CARDIOLOGÍA').", "Ponla en mayúsculas.");
  if (!Array.isArray(plan.escenas) || plan.escenas.length < 3) {
    E(null, "El plan necesita entre 4 y 9 escenas.", "Divide el guion en capítulos: gancho, mecanismo (2–6 pasos) y remate.");
    return { ok: false, errores, avisos, metricas: {} };
  }
  if (plan.escenas.length > 10) E(null, `Hay ${plan.escenas.length} escenas; el máximo razonable para un reel es 9.`, "Fusiona escenas contiguas.");

  const total = N.duracionTotal(palabras);
  const { inicios, fines } = N.tiemposDePlan(plan, palabras);
  const ids = new Set();
  const metricas = { escenas: plan.escenas.length, elementos: 0, duracion: Math.round(total * 10) / 10 };
  let impactos = 0;

  // ---------- escenas ----------
  plan.escenas.forEach((e, i) => {
    const nom = e.id ?? `#${i + 1}`;
    if (!e.id || !KEBAB.test(e.id)) E(nom, `id de escena inválido "${e.id}".`, "kebab-case sin tildes.");
    if (ids.has(e.id)) E(nom, `id de escena repetido "${e.id}".`, "Usa ids únicos.");
    ids.add(e.id);
    if (!COLORES.includes(e.acento)) E(nom, `acento "${e.acento}" inválido.`, `Usa ${COLORES.join(", ")}.`);
    if (!e.titulo || e.titulo.length > 46) E(nom, `titulo de escena vacío o demasiado largo (${(e.titulo ?? "").length} caracteres).`, "Máximo ≈ 40 caracteres, estilo '2 · El músculo pide auxilio'.");
    else if (e.titulo.length > 38) A(nom, `titulo largo (${e.titulo.length} caracteres): saldrá en dos líneas.`, "Acórtalo a ≤ 34 si puedes.");
    if (FUERA_DE_FUENTE.test(e.titulo ?? "")) A(nom, "El título usa símbolos que la tipografía no trae (flechas, subíndices, griegas).", "Usa texto plano.");

    const r = i === 0 ? { exacto: true } : N.resolverAncla(palabras, e.desde, 1);
    if (i > 0 && (!r || !r.exacto)) E(nom, `El ancla de inicio "desde: ${e.desde}" no coincide con el guion${r ? " (se aproximó a una parte)" : ""}.`, "Copia 2–3 palabras seguidas EXACTAS del guion donde empieza la escena.");
    if (i > 0 && r?.exacto) {
      const r2 = N.resolverAncla(palabras, e.desde, 2);
      if (r2?.exacto && r2.indice !== r.indice) A(nom, `La frase de inicio "desde: ${e.desde}" se dice varias veces en el guion; la escena empieza en su PRIMERA aparición (${palabras[r.indice].start.toFixed(1)} s).`, "Usa una frase de inicio que aparezca una sola vez (añade palabras vecinas hasta que sea única).");
    }
    const dur = fines[i] - inicios[i];
    if (dur < 1.6) E(nom, `La escena dura solo ${dur.toFixed(1)} s (${inicios[i].toFixed(1)}→${fines[i].toFixed(1)}).`, "Cada escena debe durar ≥ 2 s: fusiona con la vecina o mueve su 'desde'.");
    else if (dur > 9.5) A(nom, `La escena dura ${dur.toFixed(1)} s: es larga para un reel.`, "Divídela en dos escenas o añade más novedades visuales (aparece algo nuevo cada ≈ 1.5 s).");

    const els = Array.isArray(e.elementos) ? e.elementos : [];
    const fondo = e.fondo && typeof e.fondo === "object" ? e.fondo : null;
    if (e.fondo !== undefined && e.fondo !== null && !fondo) E(nom, "fondo debe ser un objeto {foto, modo, mov, oscurecer} o null.", "Corrige el tipo.");
    if (fondo) {
      if (typeof fondo.foto !== "string" || !fondo.foto) E(nom, "fondo.foto falta o no es texto.", "Pon el nombre exacto de una foto de la lista de medios.");
      else comprobarMedia(nom, fondo.foto, "fondo", `${nom}#fondo`);
      if (fondo.modo != null && !FONDO_MODOS.includes(fondo.modo)) E(nom, `fondo.modo "${fondo.modo}" inválido.`, `Usa ${FONDO_MODOS.join(" o ")}.`);
      if (fondo.mov != null && !FONDO_MOVS.includes(fondo.mov)) E(nom, `fondo.mov "${fondo.mov}" inválido.`, `Usa uno de: ${FONDO_MOVS.join(", ")}.`);
      if (fondo.oscurecer != null && !(esNum(fondo.oscurecer) && fondo.oscurecer >= 0 && fondo.oscurecer <= 0.8)) E(nom, "fondo.oscurecer debe estar entre 0 y 0.8.", "Usa 0.25–0.45.");
    }
    // una pieza compuesta (mapa, ficha, lista, cta, precio, gráfica…) ya lleva dentro sus propios textos: cuenta como dos
    const COMPUESTOS = new Set(["mapa", "ficha", "lista", "cta", "precio", "comparacion", "pasos", "grafica", "foto"]);
    if (els.length + (fondo ? 1 : 0) + (els.some((x) => COMPUESTOS.has(x?.tipo)) ? 1 : 0) < 2) E(nom, "La escena tiene menos de 2 elementos.", "Cada escena necesita una ilustración principal + etiquetas (o una foto de fondo + algo encima).");
    if (els.length > 16) E(nom, `La escena tiene ${els.length} elementos (máx. 16).`, "Simplifica.");
    metricas.elementos += els.length;

    // ---------- elementos ----------
    const piezas = []; // para solapes
    const novedades = []; // instantes de aparición
    const movimiento = []; // [t0,t1]
    let textos = 0;
    els.forEach((el, k) => {
      const ref = `${nom}#${k + 1} ${etiquetaCorta(el)}`;
      const def = cat.elementos[el?.tipo];
      const disponibles = Object.entries(cat.elementos).filter(([, d]) => paquetes.includes(d.paquete ?? "base")).map(([n]) => n);
      if (!el || !def) {
        E(nom, `Elemento ${k + 1}: tipo "${el?.tipo}" no existe en el catálogo.`, `Usa uno de: ${disponibles.join(", ")}.`, ref);
        return;
      }
      if (!paquetes.includes(def.paquete ?? "base")) {
        E(nom, `${ref}: el tipo "${el.tipo}" no está disponible en el perfil de este video.`, `Usa uno de: ${disponibles.join(", ")}.`, ref);
        return;
      }
      // props requeridas y tipos
      for (const req of def.req ?? []) {
        if (el[req] === undefined || el[req] === null) E(nom, `${ref}: falta la propiedad obligatoria "${req}".`, `Añade "${req}".`, ref);
      }
      for (const [clave, valor] of Object.entries(el)) {
        if (valor === null || valor === undefined) continue;
        if (clave in cat.base) continue;
        const spec = def.props[clave];
        if (!spec) {
          A(nom, `${ref}: la propiedad "${clave}" no existe en '${el.tipo}' y se ignorará.`, "Quítala o revisa el catálogo.", ref);
          continue;
        }
        const msg = validarValor(spec, valor, clave);
        if (msg) E(nom, `${ref}: ${msg}.`, "Corrige el tipo/valor.", ref);
        else if (clave === "x" || clave === "y") {
          const lim = SIN_LIMITE_POSICION.has(el.tipo) ? [-15, 115] : [-3, 103];
          if (valor < lim[0] || valor > lim[1]) E(nom, `${ref}: ${clave}=${valor} cae fuera del escenario (0–100).`, "Colócalo dentro de 0–100 (zona segura 5–95).", ref);
        } else if (RANGOS[el.tipo]?.[clave] && esNum(valor)) {
          const [lo, hi] = RANGOS[el.tipo][clave];
          if (valor < lo || valor > hi) E(nom, `${ref}: ${clave}=${valor} fuera del rango razonable ${lo}–${hi}.`, `Usa un valor entre ${lo} y ${hi} (unidades de la cuadrícula).`, ref);
        }
        if (spec.t === "puntos" && Array.isArray(valor)) {
          // puntos fuera de escenario
          if (valor.some((q) => esPunto(q) && (q[0] < -5 || q[0] > 105 || q[1] < -5 || q[1] > 105))) A(nom, `${ref}: algún punto de ${clave} queda fuera del escenario.`, "Mantén los puntos dentro de 0–100.", ref);
        }
      }
      if (el.tipo === "mapa" && Array.isArray(el.puntos)) {
        const px0 = esNum(el.pinX) ? el.pinX : 0.5;
        const py0 = esNum(el.pinY) ? el.pinY : 0.56;
        el.puntos.forEach((q, qi) => {
          if (Math.abs(q.x - px0) < 0.28 && Math.abs(q.y - py0) < 0.35) A(nom, `${ref}: el punto "${q.texto}" queda pegado al pin y su etiqueta se pisará con la del lugar.`, "Ponlo en una esquina del mapa (≈ x 0.2 o 0.8, y 0.13) o en la franja inferior (y 0.9), lejos del pin.", ref);
          el.puntos.slice(qi + 1).forEach((r) => {
            if (Math.abs(q.x - r.x) < 0.34 && Math.abs(q.y - r.y) < 0.2) A(nom, `${ref}: los puntos "${q.texto}" y "${r.texto}" están tan cerca que sus etiquetas se pisarán.`, "Sepáralos al menos 0.35 en x o 0.25 en y.", ref);
          });
        });
      }
      if (el.impacto === true) impactos++;

      // textos
      if (el.tipo === "foto" || (el.tipo === "logo" && el.archivo)) comprobarMedia(nom, el.archivo, ref, ref);
      if (el.tipo === "logo" && !el.archivo && nombresMedia && ![...nombresMedia].some((n) => n === "logo.png")) E(nom, `${ref}: no hay logo en los medios del proyecto.`, "Quita el elemento logo o importa un archivo que empiece por «logo».", ref);
      for (const campo of ["texto", "simbolo", "valor", "etiqueta", "unidad", "ladoSuperior", "ladoInferior", "pie", "titulo", "subtitulo", "boton", "operacion", "detalle", "moneda"]) {
        const v = el[campo];
        if (typeof v === "string" && FUERA_DE_FUENTE.test(v)) A(nom, `${ref}: "${v}" usa símbolos que la tipografía no trae (→ ₂ ⁺ ≥ μ …).`, "Para fórmulas usa O_{2}, H^{+}; para flechas usa el elemento 'linea' o 'icono'.", ref);
      }
      if (el.tipo === "etiqueta" || el.tipo === "rotulo" || el.tipo === "cinta") {
        textos++;
        const lineas = String(el.texto ?? "").split(/\\n|\n/);
        if (!String(el.texto ?? "").trim()) E(nom, `${ref}: texto vacío.`, "Escribe el nombre de la estructura.", ref);
        if (lineas.length > 3) E(nom, `${ref}: más de 3 líneas.`, "Reduce a ≤ 3 líneas.", ref);
        if (lineas.some((l) => l.length > 28)) E(nom, `${ref}: una línea supera 28 caracteres.`, "Parte el texto con \\n (≈ 22 caracteres por línea) o acórtalo.", ref);
      }
      if (el.tipo === "svg-libre") {
        const { avisos: av } = N.sanitizarSvg(String(el.svg ?? ""));
        av.forEach((m) => A(nom, `${ref}: ${m}.`, "Usa solo las etiquetas y atributos permitidos.", ref));
        if (!String(el.svg ?? "").trim()) E(nom, `${ref}: svg vacío.`, "Escribe el SVG o usa otro elemento.", ref);
      }

      // anclas
      const rc = N.resolverAncla(palabras, el.cuando, el.n ?? 1);
      if (!el.cuando) E(nom, `${ref}: falta 'cuando'.`, "Indica la frase del guion en que aparece.", ref);
      else if (!rc) E(nom, `${ref}: la frase "cuando: ${el.cuando}" no está en el guion.`, "Copia 1–3 palabras seguidas exactamente como están en el guion (sin signos).", ref);
      else if (!rc.exacto) E(nom, `${ref}: "cuando: ${el.cuando}" no coincide literalmente con el guion (se aproximó a "${rc.usada}").`, "Usa solo palabras que aparezcan seguidas en el guion.", ref);
      if (el.hasta) {
        const rh = N.resolverAncla(palabras, el.hasta, 1);
        if (!rh || !rh.exacto) E(nom, `${ref}: "hasta: ${el.hasta}" no coincide literalmente con el guion.`, "Usa palabras exactas del guion o pon null.", ref);
      }
      for (const sub of [...(el.marcadores ?? []), ...(el.nodos ?? []), ...(el.items ?? []), ...(el.tipo === "mapa" ? el.puntos ?? [] : [])]) {
        if (sub?.cuando) {
          const rs = N.resolverAncla(palabras, sub.cuando, 1);
          if (!rs || !rs.exacto) E(nom, `${ref}: el ancla interna "${sub.cuando}" no coincide con el guion.`, "Usa palabras exactas o null.", ref);
        }
      }

      // tiempos
      const { t0, t1 } = N.tiemposElemento(el, inicios[i], fines[i], palabras);
      const base = rc ? palabras[rc.indice].start + (esNum(el.desfase) ? el.desfase : 0) : inicios[i];
      if (rc && base < inicios[i] - 0.7) E(nom, `${ref}: aparecería en ${base.toFixed(1)} s, ANTES de que empiece su escena (${inicios[i].toFixed(1)} s).`, "Esa frase se dice antes: usa otra frase de esta escena o indica 'n' (nº de aparición).", ref);
      if (rc && base > fines[i] - 0.25) E(nom, `${ref}: aparecería en ${base.toFixed(1)} s, DESPUÉS de que termine su escena (${fines[i].toFixed(1)} s).`, "Usa una frase que se diga dentro de la escena.", ref);
      novedades.push(t0);
      const fin = Math.min(t1, fines[i]);
      if (N.TIPOS_CON_MOVIMIENTO.has(el.tipo)) movimiento.push([t0, fin]);
      N.cajasDe(el).forEach((c) => piezas.push({ ...c, t0, t1: fin, el, ref, tipo: el.tipo, idx: k }));
    });

    if (textos > 7) A(nom, `Demasiado texto en la escena: ${textos} etiquetas/rótulos.`, "Deja ≤ 6; lo demás lo dice la voz.");

    // ---------- escena vacía al empezar ----------
    if (els.length) {
      const primero = Math.min(...novedades);
      if (!fondo && primero > inicios[i] + 0.7) E(nom, `La escena empieza vacía: el primer elemento aparece ${(primero - inicios[i]).toFixed(1)} s después de su inicio.`, "Pon un elemento principal con 'cuando' en la primera frase de la escena (o con desfase negativo).");
      // tramos sin novedad ni movimiento
      let muerto = 0;
      for (let t = inicios[i]; t < fines[i]; t += 0.25) {
        const hayNovedad = novedades.some((n) => n <= t && t - n < 1.7);
        const hayMov = Boolean(fondo) || movimiento.some(([a, b]) => a <= t && t < b);
        muerto = hayNovedad || hayMov ? 0 : muerto + 0.25;
        if (muerto >= 2.2) {
          A(nom, `Tramo sin novedades ni movimiento alrededor de ${t.toFixed(1)} s (≈ 4 s sin nada nuevo).`, "Añade un elemento nuevo en ese tramo (etiqueta, flecha, partículas, impulso…).");
          break;
        }
      }
    }

    // ---------- solapes (solo entre elementos que coexisten en pantalla) ----------
    for (let a = 0; a < piezas.length; a++) {
      for (let b = a + 1; b < piezas.length; b++) {
        const P = piezas[a];
        const Q = piezas[b];
        if (P.idx === Q.idx) continue; // un elemento no choca consigo mismo
        if (P.clase === "trazo" || Q.clase === "trazo" || P.clase === "fondo" || Q.clase === "fondo") continue;
        const coexisten = Math.min(P.t1, Q.t1) - Math.max(P.t0, Q.t0);
        if (coexisten < 0.6) continue;
        const I = N.interseccion(P.caja, Q.caja);
        const aI = N.area(I);
        if (aI <= 0) continue;
        const menor = Math.min(N.area(P.caja), N.area(Q.caja));
        const r = aI / Math.max(1, menor);
        const nom2 = (X) => `${X.ref}${X.nombre !== X.tipo ? ` [${X.nombre}]` : ""}`;
        const par = `${nom2(P)} ↔ ${nom2(Q)}`;
        const ufmt = (c) => fmt(unidades(N, c));
        const detalle = `Ocupan ${P.tipo}: ${ufmt(P.caja)} y ${Q.tipo}: ${ufmt(Q.caja)}.`;
        const tt = P.clase === "texto" && Q.clase === "texto";
        const permitido = (P.tipo === "icono" && Q.tipo === "molecula") || (Q.tipo === "icono" && P.tipo === "molecula");
        if (permitido) continue;
        if (tt) {
          if (r > 0.04) E(nom, `Se pisan dos textos: ${par}. ${detalle}`, "Separa los textos (≥ 4 unidades de distancia) o haz que no coexistan con 'hasta'.");
        } else if (P.clase === "pieza" && Q.clase === "pieza") {
          const contiene = r > 0.9;
          const contenedor = ["cuerpo", "corte-medula", "celula", "organo"].includes(P.tipo) || ["cuerpo", "corte-medula", "celula", "organo"].includes(Q.tipo);
          if (contiene && contenedor) continue;
          if (r > 0.12) E(nom, `Se solapan dos piezas: ${par} (${Math.round(r * 100)} % de la menor). ${detalle}`, "Sepáralas, reduce 'tam', o haz que una desaparezca ('hasta') antes de que aparezca la otra.");
          else if (r > 0.05) A(nom, `Piezas muy juntas: ${par} (${Math.round(r * 100)} %).`, "Sepáralas un poco.");
        } else {
          const texto = P.clase === "texto" ? P : Q;
          const pieza = P.clase === "texto" ? Q : P;
          const grande = texto.tipo === "dato" || texto.tipo === "rotulo";
          if (grande && r > 0.3) E(nom, `Un texto grande tapa una pieza: ${par}. ${detalle}`, "Mueve el texto a una zona libre.");
          void pieza;
        }
      }
    }
    // ---------- composición descompensada ----------
    const grandes = piezas.filter((q) => q.clase === "pieza");
    if (grandes.length) {
      const y0 = Math.min(...grandes.map((q) => q.caja.y0));
      const y1 = Math.max(...grandes.map((q) => q.caja.y1));
      if (y1 > 1330 || y0 < 360) A(nom, `Una pieza se sale del escenario vertical (y ${Math.round((y0 - N.Y0) / N.U)}–${Math.round((y1 - N.Y0) / N.U)}).`, "Mantén las piezas dentro de y 0–100.");
      const xs0 = Math.min(...grandes.map((q) => q.caja.x0));
      const xs1 = Math.max(...grandes.map((q) => q.caja.x1));
      if (xs0 < 60 || xs1 > 1020) A(nom, `Una pieza se sale por los lados (x ${Math.round((xs0 - N.X0) / N.U)}–${Math.round((xs1 - N.X0) / N.U)}).`, "Reduce 'tam' o céntrala.");
    }
  });

  // ---------- cobertura de las frases del guion ----------
  const frases = [];
  let ini = 0;
  palabras.forEach((w, i) => {
    if (/[.?!:]["')\]]?$/.test(w.word) || i === palabras.length - 1) {
      frases.push({ ini: palabras[ini].start, fin: w.end, texto: palabras.slice(ini, i + 1).map((x) => x.word).join(" ") });
      ini = i + 1;
    }
  });
  const todos = [];
  plan.escenas.forEach((e, i) => {
    (e.elementos ?? []).forEach((el) => todos.push(N.tiemposElemento(el, inicios[i], fines[i], palabras).t0));
    if (e.fondo?.foto) {
      // una foto nueva (con su movimiento de cámara) renueva la imagen a lo largo de toda la escena
      for (let t = inicios[i]; t < fines[i]; t += 1.2) todos.push(t);
    }
  });
  for (const f of frases) {
    if (!todos.some((t) => t >= f.ini - 0.6 && t <= f.fin)) A(null, `La frase «${f.texto.slice(0, 60)}${f.texto.length > 60 ? "…" : ""}» (${f.ini.toFixed(1)}–${f.fin.toFixed(1)} s) no tiene ninguna ilustración nueva.`, "Cada frase del guion debe introducir algo visual (etiqueta, flecha, pieza, partículas…).");
  }
  if (impactos > 3) A(null, `Hay ${impactos} elementos con impacto:true; es demasiado.`, "Deja 1–2 para el momento más dramático.");

  // ---------- portada ----------
  const por = plan.portada ?? {};
  if (!Array.isArray(por.lineas) || por.lineas.length < 2 || por.lineas.length > 4) E(null, "portada.lineas debe tener 2–4 líneas.", "Ej.: ['¿POR QUÉ', 'UN INFARTO', 'DUELE EN EL', 'BRAZO?'].");
  else {
    const mayor = Math.max(...por.lineas.map((l) => N.anchoEstimado(String(l).toUpperCase(), 1, 900)));
    const fs = Math.floor(880 / mayor);
    if (fs < 84) E(null, `Una línea de la portada es demasiado larga (letra de ${fs}px).`, "Cada línea ≤ 13 caracteres aprox.");
    if (!Number.isInteger(por.resaltar) || por.resaltar < 0 || por.resaltar >= por.lineas.length) E(null, "portada.resaltar debe ser el índice (desde 0) de una línea.", "Elige la línea clave.");
  }
  if (por.foto) comprobarMedia(null, por.foto, "portada.foto", "portada");
  const ep = plan.escenas.findIndex((e) => e.id === por.escena);
  if (ep < 0) E(null, `portada.escena "${por.escena}" no coincide con ninguna escena.`, "Usa el id de la escena más visual.");
  else if (!esNum(por.segundo) || por.segundo < inicios[ep] || por.segundo > fines[ep]) E(null, `portada.segundo (${por.segundo}) debe caer dentro de la escena "${por.escena}" (${inicios[ep].toFixed(1)}–${fines[ep].toFixed(1)} s), cuando casi todo ya esté dibujado.`, "Elige un segundo hacia el final de esa escena.");

  return { ok: errores.length === 0, errores, avisos, metricas };
}

/** Texto compacto con los problemas, para devolverlo al modelo. */
export function resumirProblemas({ errores, avisos }, max = 40) {
  const l = [];
  errores.slice(0, max).forEach((e, i) => l.push(`ERROR ${i + 1}${e.escena ? ` [escena ${e.escena}]` : ""}: ${e.mensaje}  → ${e.arreglo}`));
  avisos.slice(0, Math.max(0, max - errores.length)).forEach((a, i) => l.push(`AVISO ${i + 1}${a.escena ? ` [escena ${a.escena}]` : ""}: ${a.mensaje}  → ${a.arreglo}`));
  return l.join("\n");
}
