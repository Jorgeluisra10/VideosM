/**
 * Plantilla de INMOBILIARIA sin IA: convierte un brief + tus fotos en guion, plan de escenas, portada y post.
 * Es determinista (mismo brief → mismo video), no inventa nada que no esté en el brief y deja el plan listo
 * para validar y renderizar. Con IA (npm run ia) el resultado es más variado; esto es la red de seguridad
 * gratuita y también un punto de partida que puedes retocar a mano.
 *
 * Localización (locale): "ar" = español rioplatense (voseo, departamento, alquiler); "co" = español colombiano
 * (tuteo, apartamento, arriendo, parqueadero, precios en «millones de pesos», estrato) e incluye VEHÍCULOS
 * (carro, camioneta, moto) y una escena de INVERSIÓN (rentabilidad y valorización estimadas, solo si el brief las trae).
 */

// ---------------------------------------------------------------------------
// Utilidades de lenguaje
// ---------------------------------------------------------------------------
const UNIDADES = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
const DECENAS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

function menosDeMil(n) {
  if (n === 100) return "cien";
  const c = Math.floor(n / 100);
  const r = n % 100;
  const partes = [];
  if (c) partes.push(CENTENAS[c]);
  if (r) {
    if (r < 30) partes.push(UNIDADES[r]);
    else {
      const d = Math.floor(r / 10);
      const u = r % 10;
      partes.push(u ? `${DECENAS[d]} y ${UNIDADES[u]}` : DECENAS[d]);
    }
  }
  return partes.join(" ");
}

/** 185000 → "ciento ochenta y cinco mil". Para cifras de hasta 999.999.999. */
export function numeroALetras(n) {
  n = Math.round(Number(n));
  if (!Number.isFinite(n) || n < 0) return String(n);
  if (n === 0) return "cero";
  const millones = Math.floor(n / 1e6);
  const miles = Math.floor((n % 1e6) / 1000);
  const resto = n % 1000;
  const partes = [];
  if (millones) partes.push(millones === 1 ? "un millón" : `${numeroALetras(millones).replace(/uno$/, "ún")} millones`);
  if (miles) partes.push(miles === 1 ? "mil" : `${menosDeMil(miles).replace(/uno$/, "ún")} mil`);
  if (resto) partes.push(menosDeMil(resto));
  return partes.join(" ");
}

const MONEDAS = {
  USD: ["dólar", "dólares"],
  ARS: ["peso", "pesos"],
  MXN: ["peso mexicano", "pesos mexicanos"],
  EUR: ["euro", "euros"],
  CLP: ["peso chileno", "pesos chilenos"],
  COP: ["peso colombiano", "pesos colombianos"],
  UYU: ["peso uruguayo", "pesos uruguayos"],
  PEN: ["sol", "soles"],
  BRL: ["real", "reales"],
};

const miles = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const limpia = (w) => String(w).replace(/[¿?¡!.,;:"«»()]/g, "").trim();
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const lista = (v) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : []).map((x) => String(x).trim()).filter(Boolean);
const tiene = (v) => v !== undefined && v !== null && String(v).trim() !== "" && !(typeof v === "number" && !Number.isFinite(v));
const num = (v) => (tiene(v) ? Number(String(v).replace(/[^\d.,-]/g, "").replace(",", ".")) : NaN);
/** Parte un texto en líneas de ≤ max caracteres (máx. 3) unidas con salto de línea, sin cortar palabras. */
const envolver = (t, max = 22) => {
  const lineas = [];
  let actual = "";
  for (const w of String(t).trim().split(/\s+/)) {
    if (actual && (actual + " " + w).length > max) {
      lineas.push(actual);
      actual = w;
    } else actual = actual ? `${actual} ${w}` : w;
  }
  if (actual) lineas.push(actual);
  return lineas.slice(0, 3).join("\n");
};
/** Recorta por palabras hasta max caracteres (para títulos). */
const corto = (t, max = 30) => {
  const s = String(t).trim();
  if (s.length <= max) return s;
  let r = s.slice(0, max).replace(/\s+\S*$/, "");
  // no terminar en artículo, preposición o conjunción («Terraza con vista a los» → «Terraza con vista»)
  while (/\s+(a|al|de|del|la|las|el|los|un|una|con|en|y|e|o|u|para|por|sin|que|su|sus)$/i.test(r)) r = r.replace(/\s+\S+$/, "");
  return r;
};
const enumera = (xs) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs.at(-1)}`);

const ARTICULO = {
  casa: ["una casa", "casa"],
  apartamento: ["un apartamento", "apartamento"],
  apartaestudio: ["un apartaestudio", "apartaestudio"],
  lote: ["un lote", "lote"],
  bodega: ["una bodega", "bodega"],
  finca: ["una finca", "finca"],
  carro: ["un carro", "carro"],
  camioneta: ["una camioneta", "camioneta"],
  moto: ["una moto", "moto"],
  departamento: ["un departamento", "departamento"],
  ph: ["un PH", "PH"],
  "casa quinta": ["una casa quinta", "casa quinta"],
  terreno: ["un terreno", "terreno"],
  "local comercial": ["un local comercial", "local comercial"],
  oficina: ["una oficina", "oficina"],
  cochera: ["una cochera", "cochera"],
};
const ES_VEHICULO = /^(carro|camioneta|moto|auto|vehículo|vehiculo)$/i;
const VARIANTE_CASA = { casa: "casa", apartamento: "departamento", apartaestudio: "departamento", lote: "terreno", bodega: "edificio", finca: "casa", carro: "casa", camioneta: "casa", moto: "casa", departamento: "departamento", ph: "departamento", "casa quinta": "casa", terreno: "terreno", "local comercial": "local", oficina: "edificio", cochera: "edificio" };

// ---------------------------------------------------------------------------
// Generador
// ---------------------------------------------------------------------------
export function generarInmobiliaria({ brief, medios = [], locale = null }) {
  const d = brief.datos ?? {};
  const co = locale === "co" || ["co", "co-f"].includes(String(brief.voz)) || /es-CO/i.test(String(brief.voz));
  const voseo = !co && (["ar", "ar-f", "uy"].includes(brief.voz ?? "ar") || /es-AR/i.test(String(brief.voz)));
  const v = (vo, tu) => (voseo ? vo : tu);
  const tono = String(brief.tono ?? "cercano").toLowerCase();
  const tipoKey = String(d.tipo ?? "Casa").toLowerCase();
  const esVehiculo = ES_VEHICULO.test(tipoKey);
  const tipoNorm = co && tipoKey === "departamento" ? "apartamento" : tipoKey;
  const [art, tipoTxt] = ARTICULO[tipoNorm] ?? [`una ${tipoNorm}`, tipoNorm];
  const barrio = String(d.ubicacion ?? "").split(",")[0].trim() || (esVehiculo ? "tu ciudad" : "tu zona");
  const operacion = String(d.operacion ?? "Venta");
  const esAlquiler = /alquiler|arriendo/i.test(operacion);
  const esPreventa = /preventa|sobre planos/i.test(operacion);
  const etqOperacion = esAlquiler ? (co ? "EN ARRIENDO" : "EN ALQUILER") : esPreventa ? "PREVENTA" : "EN VENTA";
  const modeloVeh = [d.marca, d.modelo].filter(tiene).map(String).join(" ");
  const anioVeh = num(d.anio);
  const nombreVeh = [modeloVeh, Number.isFinite(anioVeh) ? String(anioVeh) : ""].filter(Boolean).join(" ");
  const fotos = medios.filter((m) => m.tipo === "foto");
  const logo = medios.find((m) => m.tipo === "logo");
  const puntos = lista(d.puntosFuertes);
  const amenities = lista(d.amenities);
  const cercanias = lista(d.cercanias);

  // ---- foto: elegir sin repetir mientras haya ----
  const usadas = new Set();
  const esFachada = (m) => /fachada|frente|exterior|front/i.test(`${m.archivo} ${m.original ?? ""} ${m.descripcion ?? ""}`);
  const ganchoFoto = fotos.find(esFachada) ?? fotos[0] ?? null;
  const recorrido = fotos.filter((m) => m !== ganchoFoto && tiene(m.descripcion)).slice(0, 2);
  const reservadas = new Set([ganchoFoto?.archivo, ...recorrido.map((m) => m.archivo)].filter(Boolean));
  /** Siguiente foto sin usar y no reservada para el gancho/recorrido; si no queda ninguna, recicla. */
  const tomar = () => {
    if (!fotos.length) return null;
    return fotos.find((m) => !usadas.has(m.archivo) && !reservadas.has(m.archivo)) ?? fotos.find((m) => !usadas.has(m.archivo)) ?? fotos[usadas.size % fotos.length];
  };
  const MOVS = ["zoom-in", "izquierda", "zoom-out", "derecha", "abajo"];
  let nMov = 0;
  const fondoDe = (m, oscurecer = 0.3) => (m ? { foto: m.archivo, modo: m.ancho && m.alto && m.ancho / m.alto > 1.2 && fotos.length <= 2 ? "marco" : "cubrir", mov: MOVS[nMov++ % MOVS.length], oscurecer } : null);

  // ---- segmentos: cada uno es una frase y una escena ----
  const segs = [];
  const mk = (id, titulo, texto, prioridad, construir, necesitaFoto = false, foto = null) => ({ id, titulo, texto, prioridad, construir, necesitaFoto, foto });
  const S = (...args) => {
    const s = mk(...args);
    segs.push(s);
    return s;
  };

  // 1. gancho
  const gancho = esVehiculo
    ? {
        cercano: `Ojo a este ${nombreVeh || tipoTxt} en ${barrio}. ${v("Mirá", "Mira")} lo que tiene.`,
        premium: `${v("Descubrí", "Descubre")} ${art} que combina estilo y confianza${nombreVeh ? `: ${nombreVeh}` : ""}.`,
        urgente: `¡Atención! ${cap(art)}${nombreVeh ? ` ${nombreVeh}` : ""} que no vas a querer perder.`,
        profesional: `Presentamos ${art}${nombreVeh ? ` ${nombreVeh}` : ""} disponible en ${barrio}.`,
        divertido: `¿Te imaginas manejando esto en ${barrio}? ${v("Mirá", "Mira")}.`,
      }
    : co
      ? {
          cercano: `Ojo a este dato si ${esAlquiler ? "buscas" : "vas a comprar"} ${art} en ${barrio}.`,
          premium: `Descubre ${art} en ${barrio}. Un espacio pensado para vivir mejor.`,
          urgente: `¡Atención! ${cap(art)} en ${barrio} que no vas a querer perder.`,
          profesional: `Presentamos ${art} en ${barrio}${esAlquiler ? ", disponible en arriendo" : ""}.`,
          divertido: `¿Te imaginas viviendo en ${barrio}? Mira esto.`,
        }
      : {
          cercano: `¿${v("Buscás", "Buscas")} ${art} en ${barrio}? ${v("Mirá", "Mira")} lo que encontramos.`,
          premium: `${v("Descubrí", "Descubre")} ${art} en ${barrio}. Un espacio pensado para vivir mejor.`,
          urgente: `¡Atención! ${cap(art)} en ${barrio} que no ${v("vas", "vas")} a querer perderte.`,
          profesional: `Presentamos ${art} en ${barrio}${esAlquiler ? ", disponible para alquilar" : ""}.`,
          divertido: `¿${v("Te imaginás", "Te imaginas")} viviendo en ${barrio}? ${v("Mirá", "Mira")} esto.`,
        };
  const textoGancho = Object.entries(gancho).find(([k]) => tono.includes(k.slice(0, 5)))?.[1] ?? gancho.cercano;
  S("gancho", (esVehiculo && nombreVeh ? nombreVeh : `${cap(tipoTxt)} en ${barrio}`).slice(0, 34), textoGancho, 10, (a, f) => ({
    fondo: fondoDe(f ?? null, 0.28),
    elementos: [
      { tipo: "rotulo", cuando: a(barrio.split(" ")[0]), x: 50, y: 22, texto: barrio.toUpperCase().slice(0, 16), color: "amarillo", tam: barrio.length > 9 ? 9 : 12 },
      { tipo: "cinta", cuando: a(textoGancho.split(/[?.!]\s/)[0].split(" ").slice(-1)[0]), desfase: 0.2, x: 50, y: 80, texto: etqOperacion, color: "rojo", estilo: "pastilla", tam: 6 },
    ],
  }), false, ganchoFoto);

  // 2. presentación con los puntos fuertes
  if (puntos.length) {
    const estado = esVehiculo ? "" : tiene(d.antiguedad) ? (/estrenar|sobre planos/i.test(d.antiguedad) ? (/planos/i.test(d.antiguedad) ? "sobre planos" : "a estrenar") : `de ${String(d.antiguedad).toLowerCase()}`) : "";
    const estrato = !esVehiculo && tiene(d.estrato) ? `, estrato ${numeroALetras(num(d.estrato))}` : "";
    const t = `${estado || estrato ? `Es ${art} ${estado}${estrato}. `.replace(/ ,/, ",").replace(/  +/g, " ") : ""}Lo mejor: ${puntos[0]}.`;
    S("presentacion", cap(corto(puntos[0], 30)), t, 9, (a, f) => ({
      fondo: fondoDe(f, 0.3),
      elementos: [
        { tipo: "etiqueta", cuando: a(puntos[0].split(" ")[0]), x: 50, y: 78, texto: envolver(cap(puntos[0]), 22), color: "amarillo" },
        { tipo: "icono", cuando: a("mejor"), x: 50, y: 24, icono: "estrella", color: "amarillo", tam: 13 },
      ],
    }), true);
  }

  // 3. recorrido: una frase por foto con descripción (máx. 2)
  recorrido.forEach((m, i) => {
    // frase de ≥ 7 palabras (≈ 2,5 s de voz): las descripciones muy cortas llevan un enlace natural delante
    const desc = m.descripcion.trim().replace(/[.!]+$/, "");
    const lista = desc.split(/\s+/).length;
    const enlace = i === 0 ? v("Mirá", "Mira") : "Y también";
    const t = lista >= 6 ? `${cap(desc)}.` : lista >= 4 ? `${enlace}: ${desc.charAt(0).toLowerCase() + desc.slice(1)}.` : `${enlace} esto: ${desc.charAt(0).toLowerCase() + desc.slice(1)}.`;
    S(`recorrido-${i + 1}`, cap(corto(m.descripcion, 30)), t, 7 - i, (a) => ({
      fondo: fondoDe(m, 0.25),
      elementos: [{ tipo: "etiqueta", cuando: a(limpia(t.split(" ")[0])), x: 50, y: 80, texto: envolver(m.descripcion, 22), color: "hueso" }],
    }), false, m);
  });

  // 4. ficha técnica
  const dorm = num(d.dormitorios);
  const ban = num(d.banos);
  const coch = num(d.cocheras);
  const sup = num(d.supTotal) || num(d.supCubierta);
  const amb = num(d.ambientes);
  const items = [];
  const nDorm = co ? ["Habitación", "Habitaciones", "habitación", "habitaciones"] : ["Dormitorio", "Dormitorios", "dormitorio", "dormitorios"];
  const nCoch = co ? ["Parqueadero", "Parqueaderos", "parqueadero", "parqueaderos"] : ["Cochera", "Cocheras", "cochera", "cocheras"];
  if (esVehiculo) {
    // ficha de vehículo: año, kilometraje, combustible y transmisión (solo los que vengan en el brief)
    const km = num(d.kilometraje);
    if (Number.isFinite(anioVeh) && anioVeh > 1950) items.push({ icono: "calendario", valor: String(anioVeh), etiqueta: "Modelo", frase: `del ${numeroALetras(anioVeh)}`, clave: numeroALetras(anioVeh).split(" ")[0] });
    if (Number.isFinite(km) && km >= 0) items.push({ icono: "lu-velocimetro", valor: miles(km), etiqueta: "Kilómetros", frase: km === 0 ? "cero kilómetros" : `${numeroALetras(km)} kilómetros`, clave: "kilómetros" });
    if (tiene(d.combustible)) items.push({ icono: "lu-combustible", valor: cap(String(d.combustible)).slice(0, 10), etiqueta: "Combustible", frase: `motor a ${String(d.combustible).toLowerCase()}`, clave: limpia(String(d.combustible).toLowerCase()) });
    if (tiene(d.transmision)) items.push({ icono: "llave", valor: cap(String(d.transmision)).slice(0, 10), etiqueta: "Transmisión", frase: `transmisión ${String(d.transmision).toLowerCase()}`, clave: "transmisión" });
  }
  if (!esVehiculo && Number.isFinite(dorm) && dorm > 0) items.push({ icono: "cama", valor: String(dorm), etiqueta: dorm === 1 ? nDorm[0] : nDorm[1], frase: `${numeroALetras(dorm).replace(/^uno$/, "un")} ${dorm === 1 ? nDorm[2] : nDorm[3]}`, clave: dorm === 1 ? nDorm[2] : nDorm[3] });
  if (!esVehiculo && Number.isFinite(ban) && ban > 0) items.push({ icono: "bano", valor: String(ban), etiqueta: ban === 1 ? "Baño" : "Baños", frase: `${numeroALetras(ban).replace(/^uno$/, "un")} ${ban === 1 ? "baño" : "baños"}`, clave: ban === 1 ? "baño" : "baños" });
  if (!esVehiculo && Number.isFinite(sup) && sup > 0) items.push({ icono: "medida", valor: `${sup} m^{2}`, etiqueta: co ? (tiene(d.supTotal) ? "Área total" : "Área construida") : tiene(d.supTotal) ? "Superficie total" : "Cubiertos", frase: `${numeroALetras(sup)} metros cuadrados`, clave: "cuadrados" });
  if (!esVehiculo && Number.isFinite(coch) && coch > 0) items.push({ icono: "auto", valor: String(coch), etiqueta: coch === 1 ? nCoch[0] : nCoch[1], frase: coch === 1 ? nCoch[2] : `${numeroALetras(coch)} ${nCoch[3]}`, clave: coch === 1 ? nCoch[2] : nCoch[3] });
  if (!esVehiculo && !items.length && Number.isFinite(amb) && amb > 0) items.push({ icono: "casa", valor: String(amb), etiqueta: "Ambientes", frase: `${numeroALetras(amb)} ambientes`, clave: "ambientes" });
  if (items.length >= 2) {
    const frase = esVehiculo ? `Es ${enumera(items.map((i) => i.frase))}.`.replace(/^Es (?=del )/, "Es un modelo ").replace(/ y transmisión/, ", con transmisión") : `Tiene ${enumera(items.map((i) => i.frase))}.`;
    S("ficha", "Lo que tiene", frase, 9, (a, f) => ({
      fondo: fondoDe(f, 0.5),
      elementos: [{ tipo: "ficha", cuando: a(esVehiculo ? "Es" : "Tiene"), x: 50, y: 50, ancho: 86, items: items.map((i) => ({ icono: i.icono, valor: i.valor, etiqueta: i.etiqueta, cuando: a(i.clave), color: null })), color: "amarillo" }],
    }), true);
  }

  // 5. comodidades
  if (amenities.length >= 2) {
    const sel = amenities.slice(0, 4);
    const frase = `Además suma ${enumera(sel.map((x) => x.toLowerCase()))}.`;
    S("comodidades", "Comodidades", frase, 6, (a, f) => ({
      fondo: fondoDe(f, 0.5),
      elementos: [{ tipo: "lista", cuando: a("Además"), x: 50, y: 50, ancho: 74, titulo: "Comodidades", items: sel.map((x) => ({ texto: cap(x), cuando: a(limpia(x.split(" ")[0])) })), color: "amarillo" }],
    }), true);
  }

  // 6. ubicación
  if (tiene(d.ubicacion)) {
    const posiciones = [[0.2, 0.13], [0.8, 0.13], [0.5, 0.9]]; // esquinas: lejos del pin y de su etiqueta
    /** Escena de ubicación con n cercanías; si el guion se pasa de largo, se REDUCE (n−1) antes de quitar la escena. */
    const ubicacion = (n) => {
      const cerca = cercanias.slice(0, n);
      const frase = cerca.length ? `Está en ${barrio}, con ${enumera(cerca)} cerca.` : `Está en ${d.ubicacion}.`;
      const seg = mk("ubicacion", "Ubicación", frase, 8, (a) => ({
        elementos: [
          { tipo: "mapa", cuando: a("Está"), x: 50, y: 50, ancho: 86, alto: 60, texto: barrio.slice(0, 22), color: "rojo", radio: 14, pinY: cerca.length >= 3 ? 0.5 : 0.62, puntos: cerca.map((c, i) => ({ texto: envolver(cap(c), 22), x: posiciones[i][0], y: posiciones[i][1], cuando: a(limpia(c.split(" ")[0])) })) },
        ],
      }));
      if (n > 1 && cercanias.length >= n) seg.reducir = () => ubicacion(n - 1);
      return seg;
    };
    segs.push(ubicacion(3));
  }

  // 6b. inversión (solo con datos del brief; siempre como cifra ESTIMADA)
  const rent = num(d.rentabilidad);
  const valor = num(d.valorizacion);
  const hayRent = Number.isFinite(rent) && rent > 0;
  const hayVal = Number.isFinite(valor) && valor > 0;
  if (co && !esVehiculo && (hayRent || hayVal)) {
    const aLetras = (n) => {
      const [ent, dec] = String(n).split(".");
      return dec ? `${numeroALetras(Number(ent))} coma ${dec.split("").map((x) => UNIDADES[Number(x)]).join(" ")}` : numeroALetras(Number(ent));
    };
    const coma = (n) => String(n).replace(".", ",");
    const partes = [];
    if (hayRent) partes.push(`La rentabilidad estimada por arriendo es de ${aLetras(rent)} por ciento anual`);
    if (hayVal) partes.push(`${hayRent ? "y" : "La zona"} se valoriza unos ${aLetras(valor)} por ciento al año, según estimaciones`);
    const frase = `${partes.join(" ")}.`;
    S("inversion", "Retorno de inversión", frase, 8, (a, f) => ({
      fondo: fondoDe(f, 0.6),
      elementos: [
        { tipo: "icono", cuando: a(hayRent ? "rentabilidad" : "zona"), x: 50, y: 20, icono: "lu-tendencia-alza", color: "azul", tam: 12 },
        ...(hayRent ? [{ tipo: "dato", cuando: a("rentabilidad"), x: 50, y: hayVal ? 42 : 50, valor: coma(rent), unidad: "% anual", etiqueta: "Rentabilidad estimada", color: "azul", tam: hayVal ? 13 : 16 }] : []),
        ...(hayVal ? [{ tipo: "dato", cuando: a(hayRent ? "valoriza" : "zona"), x: 50, y: hayRent ? 66 : 50, valor: coma(valor), unidad: "% anual", etiqueta: "Valorización estimada", color: "azul", tam: hayRent ? 13 : 16 }] : []),
      ],
    }), true);
  }

  // 7. precio
  const precio = num(d.precio);
  const moneda = String(d.moneda ?? (co ? "COP" : "USD")).toUpperCase();
  if (Number.isFinite(precio) && precio > 0) {
    const [uno, varios] = co && moneda === "COP" ? ["peso", "pesos"] : (MONEDAS[moneda] ?? [moneda, moneda]);
    const cifra = `${numeroALetras(precio)} ${precio % 1e6 === 0 && precio >= 1e6 ? "de " : ""}${precio === 1 ? uno : varios}`;
    const verbo = esAlquiler ? (co ? "Se arrienda" : "Se alquila") : esPreventa ? "Preventa desde" : "Se vende";
    const frase = esAlquiler ? `${verbo} por ${cifra} por mes.` : esPreventa ? `${verbo} ${cifra}.` : `${verbo} por ${cifra}.`;
    // pesos colombianos redondos a millones: «450 millones» en vez de «450.000.000» (cabe en pantalla y se lee de un vistazo)
    const enMillones = co && moneda === "COP" && precio >= 1e6 && precio % 1e6 === 0;
    // valor por m² (dato derivado del brief: precio ÷ área), solo si no hay detalle propio
    const porM2 = !esVehiculo && !esAlquiler && Number.isFinite(sup) && sup > 0 && precio >= 1e6 ? precio / sup : NaN;
    const detalle = tiene(d.detallePrecio) ? String(d.detallePrecio).slice(0, 34) : co && Number.isFinite(porM2) && moneda === "COP" ? `Unos ${(Math.round(porM2 / 1e5) / 10).toLocaleString("es-CO")} millones por m^{2}` : null;
    const verboPrecio = esAlquiler ? (co ? "Se arrienda" : "Se alquila") : esPreventa ? "Preventa" : "Se vende";
    S("precio", esAlquiler ? (co ? "Arriendo" : "Alquiler") : "Precio", frase, 10, (a, f) => ({
      fondo: fondoDe(f, 0.55),
      elementos: [
        { tipo: "precio", cuando: a(verboPrecio), x: 50, y: 48, valor: enMillones ? String(precio / 1e6) : String(precio), ...(enMillones ? { sufijo: "millones" } : {}), moneda: moneda === "USD" ? "USD" : moneda, operacion: etqOperacion, detalle, color: "amarillo", tam: co && !enMillones && precio >= 1e7 ? 11 : 14 },
        ...(co ? [{ tipo: "icono", cuando: a(verboPrecio), desfase: 0.2, x: 50, y: 24, icono: "lu-dolar", color: "amarillo", tam: 12 }] : []),
      ],
    }), true);
  } else {
    S("precio", v("Consultá el precio", "Consulta el precio"), `${v("Consultá", "Consulta")} el precio y las condiciones.`, 5, (a) => ({ elementos: [{ tipo: "rotulo", cuando: a(v("Consultá", "Consulta")), x: 50, y: 50, texto: "CONSULTAR", color: "amarillo", tam: 13 }, { tipo: "cinta", cuando: a("precio"), x: 50, y: 70, texto: etqOperacion, color: "rojo", estilo: "pastilla", tam: 6 }] }));
  }

  // 8. cierre con contacto
  const wa = tiene(d.whatsapp) ? String(d.whatsapp) : "";
  const tel = tiene(d.telefono) ? String(d.telefono) : tiene(brief.marca?.telefono) ? String(brief.marca.telefono) : "";
  const web = tiene(d.web) ? String(d.web) : tiene(brief.marca?.web) ? String(brief.marca.web) : "";
  const medio = wa || tel ? v(wa ? "Escribinos por WhatsApp" : "Llamanos", wa ? "Escríbenos por WhatsApp" : "Llámanos") : web ? v("Visitá nuestra web", "Visita nuestra web") : v("Escribinos", "Escríbenos");
  const quePide = esVehiculo ? "prueba de manejo" : "visita";
  const cierre = `${medio} y ${v("agendá", "agenda")} tu ${quePide}.`;
  const contactos = [];
  if (wa) contactos.push({ icono: "whatsapp", texto: wa });
  if (tel && tel !== wa) contactos.push({ icono: "telefono", texto: tel });
  if (web) contactos.push({ icono: "web", texto: web });
  S("cierre", v(`Agendá tu ${quePide}`, `Agenda tu ${quePide}`), cierre, 10, (a, f) => ({
    fondo: fondoDe(f, 0.6),
    elementos: [
      ...(logo ? [{ tipo: "logo", cuando: a(medio.split(" ")[0]), x: 50, y: 7, tam: 17 }] : []),
      { tipo: "cta", cuando: a(medio.split(" ")[0]), x: 50, y: logo ? 55 : 48, ancho: 84, titulo: v(`Agendá tu ${quePide}`, `Agenda tu ${quePide}`), subtitulo: tiene(d.agente) ? `Te atiende ${d.agente}` : null, contactos, boton: wa ? v("Escribinos", "Escríbenos") : tel ? v("Llamanos", "Llámanos") : v("Contactanos", "Contáctanos"), color: "amarillo" },
    ],
  }), true);

  // ---- recorte por longitud (≈ 2,6 palabras/s) ----
  const [minP, maxP] = [70, 100].map((x) => Math.round((x * (Number(brief.duracion) || 35)) / 35));
  const palabrasDe = (t) => t.trim().split(/\s+/).length;
  let elegidos = [...segs];
  while (elegidos.reduce((s, x) => s + palabrasDe(x.texto), 0) > maxP) {
    // se actúa sobre la escena de MENOR prioridad: si admite versión reducida se acorta; si no, se quita
    const candidata = elegidos.filter((x) => x.reducir || x.prioridad < 9).sort((a, b) => a.prioridad - b.prioridad)[0];
    if (!candidata) break;
    if (candidata.reducir) elegidos[elegidos.indexOf(candidata)] = candidata.reducir();
    else elegidos = elegidos.filter((x) => x !== candidata);
  }
  void minP;

  // ---- guion y anclas ----
  const guion = elegidos.map((x) => x.texto).join(" ");
  const tokens = guion.split(/\s+/).map((t) => ({ w: limpia(t), n: norm(limpia(t)) }));
  const rangos = [];
  let pos = 0;
  for (const x of elegidos) {
    const n = x.texto.trim().split(/\s+/).length;
    rangos.push([pos, pos + n]);
    pos += n;
  }
  const normFrase = (f) => String(f).split(/\s+/).map(norm).filter(Boolean);
  const ocurrencias = (frase) => {
    const p = normFrase(frase);
    const out = [];
    for (let i = 0; i + p.length <= tokens.length; i++) if (p.every((q, k) => tokens[i + k].n === q)) out.push(i);
    return out;
  };

  const escenas = elegidos.map((x, i) => {
    const [a0, a1] = rangos[i];
    /** ancla de un elemento: la palabra/frase `clave` (dentro de la frase de esta escena) con su nº de aparición */
    const a = (clave) => {
      const frase = limpia(clave);
      const oc = ocurrencias(frase);
      const dentro = oc.find((p) => p >= a0 && p < a1);
      if (dentro === undefined) return limpia(tokens[a0].w);
      return { __frase: frase, __n: oc.indexOf(dentro) + 1 };
    };
    // frase de inicio de la escena: la más corta cuya PRIMERA aparición en el guion es la de esta escena
    let desde = limpia(tokens[a0].w);
    for (let largo = 1; largo <= 8 && a0 + largo <= tokens.length; largo++) {
      const frase = tokens.slice(a0, a0 + largo).map((t) => t.w).join(" ");
      if (ocurrencias(frase)[0] === a0 && largo >= 2) {
        desde = frase;
        break;
      }
    }
    const foto = x.foto ?? (x.necesitaFoto ? tomar() : null);
    if (foto) usadas.add(foto.archivo);
    const cuerpo = x.construir(a, foto);
    const elementos = cuerpo.elementos.map((el) => {
      const { cuando } = el;
      const resolver = (c) => (c && typeof c === "object" ? { cuando: c.__frase, n: c.__n > 1 ? c.__n : null } : { cuando: c, n: null });
      const r = resolver(cuando);
      const out = { ...el, cuando: r.cuando };
      if (r.n) out.n = r.n;
      for (const lista of ["items", "puntos"]) {
        if (Array.isArray(el[lista]) && el.tipo !== "linea") {
          out[lista] = el[lista].map((it) => {
            if (!it || typeof it !== "object" || !("cuando" in it)) return it;
            const rr = resolver(it.cuando);
            return { ...it, cuando: rr.cuando };
          });
        }
      }
      return out;
    });
    return { id: x.id, titulo: x.titulo, acento: ["amarillo", "azul", "rojo"][i % 3], desde, elementos, ...(cuerpo.fondo ? { fondo: cuerpo.fondo } : {}) };
  });

  // ---- portada ----
  const lineasPortada = [];
  let l = "";
  for (const w of `${tipoTxt} en ${barrio}`.toUpperCase().split(/\s+/)) {
    if ((l + " " + w).trim().length > 13 && l) {
      lineasPortada.push(l);
      l = w;
    } else l = (l + " " + w).trim();
  }
  if (l) lineasPortada.push(l);
  lineasPortada.push(etqOperacion);
  const portada = { lineas: lineasPortada.slice(0, 4), resaltar: Math.min(lineasPortada.length, 4) - 1, escena: escenas[0].id, segundo: 0, foto: fotos.length ? (fotos.find(esFachada) ?? fotos[0]).archivo : null };

  const etiqueta = String(brief.marca?.etiqueta || brief.marca?.nombre || "INMOBILIARIA").toUpperCase().slice(0, 28);
  const id = slug(brief.id || `${tipoTxt}-${barrio}`);
  const titulo = `${esVehiculo && nombreVeh ? nombreVeh : cap(tipoTxt)} ${esAlquiler ? (co ? "en arriendo" : "en alquiler") : esPreventa ? "en preventa" : "en venta"} en ${barrio}`;

  // ---- post ----
  const sufOp = esAlquiler ? (co ? "enarriendo" : "enalquiler") : "enventa";
  const hashtags = (esVehiculo
    ? ["#vehiculoscolombia", `#${slug(barrio).replace(/-/g, "")}`, `#${slug(tipoTxt).replace(/-/g, "")}${sufOp}`, "#carrosusados", "#autos"]
    : co
      ? ["#bienesraicescolombia", `#${slug(barrio).replace(/-/g, "")}`, `#${slug(tipoTxt).replace(/-/g, "")}${sufOp}`, hayRent || hayVal ? "#inversioninmobiliaria" : "#inmobiliaria", "#propiedades"]
      : ["#inmobiliaria", `#${slug(barrio).replace(/-/g, "")}`, `#${slug(tipoTxt).replace(/-/g, "")}${sufOp}`, "#bienesraices", "#propiedades"]
  ).filter((h, i, arr) => h.length > 2 && arr.indexOf(h) === i);
  const lineasPost = [`${titulo} ${esVehiculo ? "🚗" : "🏠"}`, ""];
  const datos = items.map((i) => `${i.valor.replace(/\^\{2\}/, "²")} ${i.etiqueta.toLowerCase()}`);
  if (datos.length) lineasPost.push(datos.join(" · "));
  if (puntos.length) lineasPost.push(puntos.slice(0, 2).map(cap).join(" · "));
  if (Number.isFinite(precio) && precio > 0) lineasPost.push(`${etqOperacion === "EN ALQUILER" ? "Alquiler" : "Precio"}: ${moneda} ${precio.toLocaleString(co ? "es-CO" : "es-AR")}${tiene(d.detallePrecio) ? ` · ${d.detallePrecio}` : ""}`);
  lineasPost.push("");
  lineasPost.push(contactos.length ? `${v("Escribinos", "Escríbenos")}: ${contactos.map((c) => c.texto).join(" · ")}` : v("Escribinos para coordinar tu visita.", "Escríbenos para coordinar tu visita."));
  lineasPost.push("Consultá disponibilidad y condiciones.".replace("Consultá", v("Consultá", "Consulta")));
  lineasPost.push("");
  lineasPost.push(hashtags.slice(0, 5).join(" "));
  const post = lineasPost.join("\n") + "\n";

  const plan = {
    proyecto: { id, etiqueta, titulo },
    escenas,
    portada,
  };
  return { guion, plan, post, proyecto: { id, etiqueta, titulo }, imagenes: { variante: VARIANTE_CASA[tipoKey] ?? "casa" } };
}

/**
 * Con la voz real, una frase corta («Cocina integrada con isla.») puede durar menos de 2 s y el validador exige
 * ≥ 2 s por escena. Aquí se FUSIONA cada escena demasiado corta con su vecina (la fusionada conserva el inicio y el
 * título de la primera, los elementos de ambas —siguen atados a sus palabras— y la foto de fondo de la primera que tenga).
 * `tiempos(plan)` debe devolver { inicios, fines } en segundos. Devuelve cuántas fusiones hizo.
 */
export function fusionarEscenasCortas(plan, tiempos, minimo = 2.05) {
  let fusiones = 0;
  for (let vuelta = 0; vuelta < 8 && plan.escenas.length > 1; vuelta++) {
    const { inicios, fines } = tiempos(plan);
    const k = plan.escenas.findIndex((_, i) => fines[i] - inicios[i] < minimo);
    if (k < 0) break;
    const i0 = k < plan.escenas.length - 1 ? k : k - 1; // se une con la siguiente; la última, con la anterior
    const [a, b] = [plan.escenas[i0], plan.escenas[i0 + 1]];
    // lo de la primera se retira cuando empieza la segunda (si no, los textos se pisarían), y la foto de la
    // segunda —si es otra— entra como foto enmarcada en ese momento
    const CON_SALIDA = new Set(["etiqueta", "rotulo", "cinta", "lista", "ficha", "cta", "precio", "dato", "mapa", "foto"]);
    const deA = a.elementos.map((el) => (CON_SALIDA.has(el.tipo) && !el.hasta ? { ...el, hasta: b.desde } : el));
    const fotoB = b.fondo?.foto && b.fondo.foto !== a.fondo?.foto ? [{ tipo: "foto", cuando: b.desde, x: 50, y: 42, archivo: b.fondo.foto, ancho: 80, alto: 52, mov: "zoom-in" }] : [];
    const fusion = { ...a, elementos: [...deA, ...fotoB, ...b.elementos] };
    if (!fusion.fondo && b.fondo && !fotoB.length) fusion.fondo = b.fondo;
    if (!fusion.fondo && fotoB.length) fusion.fondo = { ...b.fondo };
    if (plan.portada?.escena === b.id) plan.portada.escena = a.id;
    plan.escenas.splice(i0, 2, fusion);
    fusiones++;
  }
  return fusiones;
}

/** Ajusta portada.segundo cuando ya se conocen los tiempos de las escenas (segundos de inicio y fin de la primera). */
export function ajustarPortada(plan, inicios, fines) {
  const k = plan.escenas.findIndex((e) => e.id === plan.portada.escena);
  const i = Math.max(0, k);
  plan.portada.segundo = Math.round((inicios[i] + Math.max(1.2, (fines[i] - inicios[i]) * 0.8)) * 10) / 10;
  return plan;
}
