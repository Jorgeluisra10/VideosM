# Los cuadernos radiactivos de Marie Curie · guion técnico (SINAPSIS, 9:16, ≈ 62 s)

**Serie:** historia de la medicina en SINAPSIS · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** laboratorio oscuro con el brillo verde-azulado del radio, caja de plomo, cuaderno con aura, contador Geiger, mapa Varsovia–París, fichas de elementos, medallas Nobel, ambulancia radiológica y gráfico de decaimiento; línea de tiempo (1867 · 1891 · 1898 · 1903 · 1914 · hoy). Color: verde-azul = radio · oro = fechas y datos.
**Gancho de actualidad:** el **sábado 7 de noviembre de 2026** se cumplen **159 años** del nacimiento de Marie Curie (Varsovia, 7 nov 1867; 2026 − 1867 = 159) y sus cuadernos siguen siendo radiactivos.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-curie.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-curie.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-05-curie-cuadernos/`. Código: `src/viral/piezas/mc-kit.tsx`, `mc1.tsx` y `mc2.tsx` (la escena de la guerra reusa la mano de `rx-kit.tsx`); datos y tiempos en `src/anim/piezas.ts` (`MCU`, `TMC`, `fraccionRestante`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-05-curie-cuadernos/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/curie-cuadernos.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos usan el ritmo real de cada escena.
| Sonido | Cuándo | Cómo |
|---|---|---|
| Colchón | 0–66 s | acordes suaves en La menor, Fa, Do mayor (Nobel), Re menor (riesgo) y La menor |
| Geiger | escenas 1, 3, 7 y 8 | chasquidos al azar; la frecuencia sube al abrir la caja y con los tubos de radio, y se calma al final |
| Gancho | escena 1 | clanc de la caja, tics del contador de 159 años y campana |
| Viaje | escena 2 | portazo, traqueteo del tren y campana de París |
| Elementos | escena 3 | pop y campanas del polonio y del radio |
| Toneladas | escena 4 | golpes de los sacos, remover de la olla, crepitar del fuego y reloj |
| Nobel | escena 5 | campanas de las medallas y acorde luminoso |
| Guerra | escena 6 | motor grave, zumbido y chispa de los rayos X y tics de las cifras |
| Riesgo | escena 7 | toque grave de 1934 |
| Cuadernos | escena 8 | barrido descendente del decaimiento, campana de la mitad y rasguño de la pluma |
Sin voz, el nivel total es ≈ −27 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `mc-gancho` | «Los cuadernos de Marie Curie siguen siendo radiactivos. Este sábado se cumplen ciento cincuenta y nueve años de su nacimiento.» | Nació el 7 nov 1867 en Varsovia; cuadernos en cajas forradas de plomo (CSM 2011; Business Insider); 2026 − 1867 = 159 (cálculo propio) | Caja de plomo que se abre, cuaderno con aura, Geiger y contador de años |
| 2 | `mc-paris` | «Nació en Varsovia, donde las mujeres no podían estudiar en la universidad, y se fue a París.» | Varsovia no admitía mujeres; Sorbona, 1891 (Wikipedia-espejos y biografías; fuentes de calidad variable) | Mapa con la universidad cerrada y el viaje a París |
| 3 | `mc-elementos` | «En mil ochocientos noventa y ocho, con Pierre, descubrió el polonio, que nombró por su país, y el radio.» | Polonio (jul 1898), radio (dic 1898; 21 o 26 dic según la fuente); Po 84, Ra 88 | Fichas Po y Ra, bandera de Polonia y tubos |
| 4 | `mc-toneladas` | «Para obtener una décima de gramo de radio, procesó toneladas de mineral durante años.» | 1902: ≈ 0,1 g de cloruro de radio a partir de toneladas de residuo de pecblenda; las fuentes dan de 1 a varias toneladas y 3–4 años | Sacos, olla y tubo de 0,1 g |
| 5 | `mc-nobel` | «Ganó dos Nobel, en Física y en Química: fue la primera mujer en ganarlo y la única persona premiada en dos ciencias.» | Física 1903 (con Pierre Curie y Becquerel), Química 1911 (en solitario); única persona con Nobel en dos ciencias distintas | Dos medallas y rótulos |
| 6 | `mc-guerra` | «En la Primera Guerra Mundial creó ambulancias con rayos X para encontrar balas y huesos rotos, las llamadas pequeñas Curies.» | ≈ 20 vehículos y ≈ 200 instalaciones fijas (IEEE Spectrum); ≈ 900.000 heridos según la propia Curie y «más de un millón» en otras estimaciones | Ambulancia, placa con mano y bala, cifras |
| 7 | `mc-riesgo` | «Manejaba tubos y sales de radio sin protección; murió en mil novecientos treinta y cuatro, probablemente por la radiación.» | Murió en julio de 1934; se atribuye probablemente a la radiación (algunas fuentes citan anemia; no hay diagnóstico único) | Científica con tubos de radio que brillan y 1934 |
| 8 | `mc-cuadernos` | «Hoy están en cajas de plomo, y tardarán unos mil quinientos años en perder la mitad de su radiactividad.» | Radio-226, semivida ≈ 1.600 años; ≈ 1.500 años = tiempo para perder la MITAD (Business Insider; CSM); exención de responsabilidad para leerlos (fuentes secundarias) | Caja de plomo, curva de decaimiento y exención |
| 9 | `CTA` | «Compártelo con alguien que ame la ciencia. Síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Dibujos esquemáticos, no son imágenes de la época.** La figura de la científica es una silueta genérica.
- **1.500 años = perder la MITAD, no dejar de ser radiactivos.** Es un error muy repetido («radiactivos por 1.500 años»); el video lo dice bien y el gráfico muestra la curva.
- **Causa de la muerte:** se dice «probablemente por la radiación»; algunas fuentes hablan de anemia y los diagnósticos de la época no son concluyentes.
- **Cifras de la guerra y de la química del radio** (20 vehículos, 200 salas, ≈ 900.000 – 1 millón de heridos; toneladas de mineral; 3–4 años) son estimaciones que varían por fuente: en pantalla salen con «≈» y «estimación».
- **Radium dates:** 21 o 26 dic 1898 según se tome el hallazgo o el anuncio; el video solo dice «1898».
- **Exención de responsabilidad** para consultar los cuadernos: dato de fuentes secundarias; no pude confirmarlo con la Bibliothèque nationale de France.
- **No banaliza la radiación ni invita a manipular material radiactivo**; no es consejo médico.
- **No pude abrir** biografías originales, el sitio del Nobel ni la BnF: trabajé con resúmenes de búsqueda. Confirma fechas y cifras antes de usarlas en un trabajo.
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-curie.txt`. Sin voz el audio sale a ≈ −27 LUFS: no lo publiques así.
