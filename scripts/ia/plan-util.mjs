/**
 * Utilidades puras sobre planes de escena: limpieza de lo que devuelve el modelo, puntuación,
 * saneado automático y plan de emergencia (sencillo pero siempre válido).
 */
import { cargarNucleo } from "./puente.mjs";

/** Quita recursivamente las claves con null (el esquema estricto obliga al modelo a enviarlas). */
export function limpiarNulos(x) {
  if (Array.isArray(x)) return x.map(limpiarNulos);
  if (x && typeof x === "object") {
    const o = {};
    for (const [k, v] of Object.entries(x)) if (v !== null && v !== undefined) o[k] = limpiarNulos(v);
    return o;
  }
  return x;
}

/** Deja el plan listo: proyecto coherente con el guion aprobado, textos recortados, sin nulos. */
export function normalizarPlan(plan, proyecto) {
  const p = limpiarNulos(plan);
  p.proyecto = { id: proyecto.id, etiqueta: String(proyecto.etiqueta).toUpperCase(), titulo: proyecto.titulo };
  for (const e of p.escenas ?? []) {
    e.titulo = String(e.titulo ?? "").trim();
    for (const el of e.elementos ?? []) {
      if (typeof el.cuando === "string") el.cuando = el.cuando.replace(/[¿?¡!.,;:"«»()]/g, "").replace(/\s+/g, " ").trim();
      if (typeof el.hasta === "string") el.hasta = el.hasta.replace(/[¿?¡!.,;:"«»()]/g, "").replace(/\s+/g, " ").trim();
    }
    if (typeof e.desde === "string") e.desde = e.desde.replace(/[¿?¡!.,;:"«»()]/g, "").replace(/\s+/g, " ").trim();
  }
  return p;
}

/** Puntuación del plan: menos es mejor (un error pesa como 10 avisos). */
export const puntuacion = (r) => r.errores.length * 10 + r.avisos.length;

/** Elimina los elementos señalados por errores "de elemento" (su referencia es `escena#k …`). Devuelve cuántos quitó. */
export function sanear(plan, resultado) {
  const quitar = new Map();
  for (const e of resultado.errores) {
    const m = String(e.elemento ?? "").match(/^(.+?)#(\d+) /);
    if (!m) continue;
    if (!quitar.has(m[1])) quitar.set(m[1], new Set());
    quitar.get(m[1]).add(Number(m[2]) - 1);
  }
  let n = 0;
  const copia = JSON.parse(JSON.stringify(plan));
  for (const esc of copia.escenas) {
    const idx = quitar.get(esc.id);
    if (!idx) continue;
    const antes = esc.elementos.length;
    esc.elementos = esc.elementos.filter((_, k) => !idx.has(k));
    n += antes - esc.elementos.length;
  }
  return { plan: copia, quitados: n };
}

// ---------------------------------------------------------------------------
// Plan de emergencia
// ---------------------------------------------------------------------------
const STOP = new Set("para como pero porque cuando donde entre sobre hasta desde esta este esto esas esos estas estos esa ese aqui allí tiene tienen puede pueden cada otro otra todo toda todos todas siempre mismo misma mucho mucha menos hacia segun cuyo cual cuales sino también tambien solo solamente".split(" "));
const limpia = (w) => String(w).replace(/[¿?¡!.,;:"«»()]/g, "").trim();

export async function planDeEmergencia(palabras, proyecto) {
  const N = await cargarNucleo();
  const colores = ["amarillo", "azul", "rojo", "hueso"];

  // 1. frases
  const frases = [];
  let ini = 0;
  palabras.forEach((w, i) => {
    if (/[.?!]["')\]]?$/.test(w.word) || i === palabras.length - 1) {
      frases.push({ a: ini, b: i });
      ini = i + 1;
    }
  });
  // 2. agrupa frases en escenas de ≥ 3.4 s (la última puede absorber un resto corto)
  const grupos = [];
  let g = null;
  for (const f of frases) {
    if (!g) g = { a: f.a, b: f.b };
    else g.b = f.b;
    if (palabras[g.b].end - palabras[g.a].start >= 3.4) {
      grupos.push(g);
      g = null;
    }
  }
  if (g) {
    if (grupos.length && palabras[g.b].end - palabras[g.a].start < 2.2) grupos[grupos.length - 1].b = g.b;
    else grupos.push(g);
  }

  const nDeAparicion = (i, largo) => {
    const frase = palabras.slice(i, i + largo).map((w) => limpia(w.word)).join(" ");
    for (let n = 1; n <= 12; n++) {
      const r = N.resolverAncla(palabras, frase, n);
      if (r && r.indice === i) return { frase, n };
    }
    return { frase, n: 1 };
  };

  /** Frase de inicio de escena: la más corta (2–8 palabras) cuya PRIMERA aparición en el guion es la de la escena. */
  const fraseUnica = (i) => {
    for (let largo = 2; largo <= 8 && i + largo <= palabras.length; largo++) {
      const frase = palabras.slice(i, i + largo).map((w) => limpia(w.word)).join(" ");
      const r = N.resolverAncla(palabras, frase, 1);
      if (r && r.exacto && r.indice === i) return frase;
    }
    return palabras.slice(i, i + 3).map((w) => limpia(w.word)).join(" ");
  };

  const escenas = grupos.slice(0, 9).map((gr, k) => {
    const frase = fraseUnica(gr.a);
    const n = 1;
    const acento = colores[k % colores.length];
    const clave = [];
    for (let i = gr.a; i <= gr.b; i++) {
      const w = limpia(palabras[i].word);
      if (w.length >= 6 && w.length <= 12 && !STOP.has(w.toLowerCase()) && !clave.some((c) => c.w.toLowerCase() === w.toLowerCase())) clave.push({ w, i });
    }
    clave.sort((x, y) => y.w.length - x.w.length);
    const principal = clave[0] ?? { w: limpia(palabras[gr.a].word), i: gr.a };
    const secundaria = clave.find((c) => c !== principal);
    const ancla = (c) => {
      const r = nDeAparicion(c.i, 1);
      return { cuando: r.frase, ...(r.n > 1 ? { n: r.n } : {}) };
    };
    const elementos = [
      { tipo: "halo", cuando: frase, ...(n > 1 ? { n } : {}), x: 50, y: 42, radio: 30, color: acento },
      { tipo: "aros", cuando: frase, ...(n > 1 ? { n } : {}), x: 50, y: 42, radio: 24, color: acento },
      { tipo: "rotulo", ...ancla(principal), x: 50, y: 42, texto: principal.w.toUpperCase().slice(0, 14), color: acento === "hueso" ? "amarillo" : acento, tam: principal.w.length > 9 ? 9 : 12 },
    ];
    if (secundaria) elementos.push({ tipo: "etiqueta", ...ancla(secundaria), x: 50, y: 76, texto: secundaria.w, color: "hueso" });
    const titulo = `${k + 1} · ${principal.w.charAt(0).toUpperCase()}${principal.w.slice(1).toLowerCase()}`;
    return { id: `escena-${k + 1}`, titulo: k === 0 ? limpia(proyecto.titulo).slice(0, 34) : titulo, acento, desde: frase, elementos };
  });

  // 3. portada: título en líneas de ≤ 13 caracteres
  const lineas = [];
  let l = "";
  for (const w of limpia(proyecto.titulo).toUpperCase().split(/\s+/)) {
    if ((l + " " + w).trim().length > 13 && l) {
      lineas.push(l);
      l = w;
    } else l = (l + " " + w).trim();
  }
  if (l) lineas.push(l);
  const { inicios, fines } = N.tiemposDePlan({ escenas }, palabras);
  const k0 = 0;
  return {
    proyecto,
    escenas,
    portada: { lineas: lineas.slice(0, 4), resaltar: Math.min(lineas.length, 4) - 1, escena: escenas[k0].id, segundo: Math.round((inicios[k0] + Math.min(1.8, (fines[k0] - inicios[k0]) * 0.7)) * 10) / 10 },
  };
}
