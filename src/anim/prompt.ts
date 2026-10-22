/**
 * Prompts del motor de animación:
 *  - sistemaAnimacion: instrucciones fijas para la IA (prefijo estático → OpenAI lo cachea y cobra menos).
 *  - promptUsuario: los bloques de escena ya interpretados por el parser local.
 *  - promptFormateador: el texto que el usuario copia para ordenar su guion con cualquier chat externo.
 */
import { esquemaAnimacion, type OpcionesEsquema } from "./esquema";
import { paletaPorId } from "./paletas";
import { tokensDeTexto } from "./costos";
import type { EscenaBloque } from "./parser";

export const LIENZO = { w: 1080, h: 1920, margen: 90, arriba: 150, abajo: 1770 };

const REGLAS_2D = `ESCENAS «SVG» (animación vectorial 2D, lienzo 1080×1920 px, origen arriba-izquierda):
- Zona segura: x entre ${LIENZO.margen} y ${LIENZO.w - LIENZO.margen}; y entre ${LIENZO.arriba} y ${LIENZO.abajo}. No hay subtítulos ni encabezados: el lienzo está limpio, úsalo completo y compón con jerarquía (un elemento protagonista grande, apoyos pequeños).
- Cada elemento tiene t (segundo, desde el inicio de la escena, en que entra), hasta (segundo en que sale, o null = se queda) y entrada.
- Elementos: trazo (path SVG «d» que se dibuja solo, en coordenadas del lienzo; úsalo para siluetas, fachadas, curvas), linea (polilínea de puntos que se dibuja; flecha/curva opcionales), forma (x,y = CENTRO; w,h), texto (x,y = punto de anclaje según «alinear»; tam 40–120; texto corto, máx. 5–6 palabras por línea), icono (x,y = centro; tam 80–220; fondo=true lo pone sobre un círculo), plano (plano arquitectónico que se dibuja solo; x,y = CENTRO; habitaciones con coordenadas 0–100 relativas al plano), grafica (barras|lineas|pastel|dona; x,y = CENTRO; 3–6 datos), contador (número que sube de «desde» a «valor»), anillo (progreso circular 0–100), ondas (pulsos concéntricos), lista (items que entran uno a uno; x,y = esquina SUPERIOR-izquierda), tarjeta (panel de cristal con título + valor; x,y = CENTRO).
- ambiente: fondo animado sutil (cuadricula, particulas, aros, lineas) o ninguno.
- Una escena buena tiene 6–14 elementos escalonados en el tiempo (cada ~0.4–0.8 s algo nuevo), siempre algo en movimiento, y el último elemento clave entra antes de que termine el 80 % de la escena.`;

const REGLAS_3D = `ESCENAS «3D» (Three.js; unidades ≈ metros; el suelo es y = 0; se ve en vertical 1080×1920):
- Objetos: edificio (x,z = centro de la base; w,d; pisos 1–40; remate; ventanas), caja, cilindro, esfera, piramide, extrusion (polígono de puntos x,z extruido h; para plantas de terreno o perfiles), barras3d (datos numéricos → barras 3D financieras; hmax = alto de la barra mayor), ciudad (bloques de ciudad procedurales; resaltar = índice de la manzana que se ilumina en el color de acento, o null), casa (volumen con techo a dos aguas), anillo.
- «y» es la altura de la BASE del objeto (en esfera y anillo es el centro). El cuadro es VERTICAL y estrecho: a distancia «radio» caben ≈ 0.43×radio unidades de ancho y ≈ 0.77×radio de alto (radio 14 → 6 de ancho × 10 de alto; radio 26 → 11 × 20). Dimensiona la composición para eso: columnas verticales y profundidad en z, o un radio mayor para vistas anchas.
- t (segundo de entrada) y dur (duración de la entrada); entrada: crecer | caer | aparecer | ninguna; giro = grados por segundo sobre su eje (0 = quieto).
- camara: órbita alrededor de (mirarX, mirarY, mirarZ): radio→radioFin, altura→alturaFin y anguloInicio→anguloFin en GRADOS. Un movimiento suave de 25–90° durante la escena (el motor interpola con spring). fov 35–55. radio típico 14–32.
- luces: ambiente 0.3–0.8, direccional 0.8–2.2 (dirX/dirY/dirZ = posición de la luz), puntoAcento 0–2 (luz del color de acento).
- overlay: textos, cifras, tarjetas, iconos 2D encima del 3D (mismas reglas de coordenadas y zona segura que las escenas SVG; úsalos con moderación: 2–5).
- Una escena buena tiene 4–12 objetos con entradas escalonadas y la cámara siempre en movimiento.`;

const REGLAS_SFX = `SONIDO: para cada escena devuelve «sfx»: 2–6 eventos {t, tipo, vol} sincronizados con lo que aparece (pop = aparece un elemento; whoosh = transición/movimiento amplio; cash = precio o dinero; ding = logro/cifra clave; thud = impacto; tick = conteo; zap; heartbeat). vol 0.05–0.25.`;

export type OpcionesPrompt = OpcionesEsquema;

export function sistemaAnimacion(o: OpcionesPrompt): string {
  const p = paletaPorId(o.paleta);
  const partes = [
    `Eres el director de arte de un estudio de motion graphics. Conviertes un guion dividido en escenas en INSTRUCCIONES GEOMÉTRICAS DECLARATIVAS que un motor (Remotion + Three.js) dibuja y anima. No escribes código ni colores hexadecimales: solo eliges tokens de color y rellenas el esquema JSON.`,
    `Devuelve UNA escena por cada bloque recibido, en el mismo orden y con el mismo número «n». El «modo» de cada escena es el que indica el bloque (SVG o 3D); no lo cambies. La duración de la escena (en segundos) ya viene dada: todos los tiempos (t, hasta, dur, sfx.t) deben caber en ella.`,
    `PALETA «${p.nombre}» (tokens de color): ${p.uso}. Usa SOLO estos tokens: primario, acento, blanco, tinta, suave, ok, alerta. Cada escena elige tema «oscuro» (fondo azul profundo) o «claro» (fondo blanco); alterna para dar ritmo y usa el que mejor sirva al contenido. Usa «acento» con moderación para lo que el espectador debe recordar.`,
    `Lee en cada bloque la locución y los requerimientos visuales: dibuja lo que se dice (cifras exactas, nombres, lugares) y respeta lo que el bloque pida explícitamente. Textos cortos, en el idioma del guion, sin faltas. Nunca inventes datos que el bloque no dé.`,
  ];
  if (o.svg) partes.push(REGLAS_2D);
  if (o.tres) partes.push(REGLAS_3D);
  partes.push(o.sfx ? REGLAS_SFX : "NO incluyas sonido: el esquema no tiene campo de efectos.");
  partes.push(`Responde SOLO con el JSON del esquema.`);
  return partes.join("\n\n");
}

export function promptUsuario(escenas: EscenaBloque[]): string {
  const bloques = escenas.map((e) => `[ESCENA ${e.n} | duración ${e.dur.toFixed(2)} s | MODO: ${e.modo}]\n${e.texto}`);
  return `Guion (${escenas.length} escenas):\n\n${bloques.join("\n\n")}`;
}

/** Tokens de entrada que NO dependen del guion (sistema + esquema) para esta configuración. */
export function tokensFijos(o: OpcionesPrompt): number {
  return tokensDeTexto(sistemaAnimacion(o).length, 3.4) + tokensDeTexto(JSON.stringify(esquemaAnimacion(o).schema).length, 3.0);
}

export const PROMPT_FORMATEADOR = `Actúa como editor de guiones para videos verticales cortos (Reels/TikTok, 1080×1920). Voy a pegarte mi guion y mis ideas. Devuélvelo ESTRUCTURADO en bloques con EXACTAMENTE este formato, uno por escena, sin nada más:

[ESCENA 1 | 0s-4s | MODO: SVG]
Locución: lo que se dice en esta escena (frase corta y clara).
Visual: qué debe verse (elementos, cifras exactas, textos en pantalla, colores de marca si aplica, movimiento).

[ESCENA 2 | 4s-9s | MODO: 3D]
Locución: …
Visual: …

Reglas:
1. El encabezado es SIEMPRE «[ESCENA N | inicio-fin | MODO: X]» con segundos (por ejemplo 0s-4s, 4s-9s). Las escenas son consecutivas: el fin de una es el inicio de la siguiente. La primera empieza en 0s.
2. MODO: SVG = animación vectorial 2D (planos arquitectónicos que se dibujan solos, gráficas dinámicas, iconos animados, textos y cifras). MODO: 3D = Three.js (edificios 3D, bloques isométricos, barras financieras 3D, maquetas, giros de cámara). Elige el modo que mejor cuente cada idea; alterna para dar ritmo.
3. Cada escena dura entre 2 y 10 segundos; calcula los tiempos según el ritmo de lectura (≈ 2,5 palabras por segundo en la locución).
4. En «Visual» describe elementos concretos (qué aparece, dónde, en qué orden) y los datos exactos (precios, metros, porcentajes, nombres). No inventes cifras que yo no haya dado.
5. No uses subtítulos: no se mostrarán. La voz la grabo yo aparte.
6. Máximo 30 escenas. Responde solo con los bloques, sin explicaciones.

Mi guion e ideas:
`;
