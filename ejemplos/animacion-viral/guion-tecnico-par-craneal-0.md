# El par craneal 0: el nervio que casi nadie te enseñó · guion técnico (SINAPSIS, 9:16, ≈ 65 s)

**Serie:** neuroanatomía en SINAPSIS · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** anatomía vectorial esquemática sobre fondo oscuro: lista de pares con un hueco «0», tiburón, corte sagital de la cabeza (zoom a nariz, lámina cribosa y septo), vista inferior del cerebro, neuronas doradas que migran, síndrome de Kallmann, signo de interrogación y línea de tiempo 1878 → años 80 → 1998 → hoy. Color: menta = nervio terminal (par 0) · azul = nervio olfatorio (par I) · dorado = GnRH · rosa = hipotálamo · violeta = cerebro · rojo = fallo.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-par-craneal-0.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-par-craneal-0.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-08-par-craneal-0/`. Código: `src/viral/piezas/pc-kit.tsx`, `pc1.tsx` y `pc2.tsx`; datos y tiempos en `src/anim/piezas.ts` (`PC0`, `TPC`, `totalCraneales`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-08-par-craneal-0/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-0.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos usan el ritmo real de cada escena.
| Sonido | Cuándo | Cómo |
|---|---|---|
| Colchón | 0–66 s | acordes en La menor, Fa, Re menor, Do, Sol menor y La mayor (el interrogante abierto) |
| Gancho | escena 1 | tics de los 12 pares, hueco del cero y chispa menta cuando aparece el 0 |
| Fritsch | escena 2 | contador hasta 1878, golpe del «no en personas» y barrido del tiburón |
| Recorrido y número | escenas 3–4 | fibras que se tejen, campana de la lámina cribosa y pops de los bulbos |
| GnRH | escena 5 | saltos de las neuronas doradas hasta el hipotálamo |
| Kallmann | escena 6 | golpe de la ruta cortada y disonancia |
| Misterio y libro | escenas 7–8 | interrogante, sellos de «sin demostrar» y línea de tiempo con golpe final |
Sin voz, el nivel total es ≈ −27 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `pc0-gancho` | «Te enseñaron doce pares craneales, pero hay uno más, y viene antes del primero: el par craneal cero.» | La mayoría de los textos enseña 12 pares; el nervio terminal se llama par craneal 0 | Pares I–XII y hueco del 0 que se llena en menta |
| 2 | `pc0-fritsch` | «En mil ochocientos setenta y ocho, Gustav Fritsch lo describió por primera vez, no en personas, sino en tiburones.» | Fritsch 1878, elasmobranquios; lo llamó «nervio supernumerario» (reseñas de la literatura) | Contador 1878, cabeza humana tachada y tiburón con el nervio |
| 3 | `pc0-recorrido` | «Es una red de fibras finísimas, sin mielina, junto al nervio olfatorio, que atraviesa la lámina cribosa y llega al cerebro.» | Plexo de fibras amielínicas junto al nervio olfatorio, cruza la lámina cribosa (StatPearls, Radiopaedia, reseñas) | Corte sagital ampliado de la cabeza |
| 4 | `pc0-numero` | «Lo bautizaron cero a finales de los años ochenta, porque está por delante del par uno, el olfatorio.» | Nombre «par craneal cero» propuesto a finales de los años 80 (Demsky y Schwanzel-Fukuda, 1987, según reseñas) | Vista inferior esquemática del cerebro |
| 5 | `pc0-gnrh` | «En el embrión, neuronas con GnRH, la hormona que activa la pubertad, viajan de la nariz al cerebro siguiendo este nervio.» | Las neuronas GnRH nacen en la placoda olfatoria y migran al hipotálamo acompañando fibras del nervio terminal / vomeronasal (estudios en embriones; Nature 1989 en ratón) | Neuronas doradas que recorren la ruta |
| 6 | `pc0-kallmann` | «Si esa ruta falla, puede aparecer el síndrome de Kallmann: sin olfato y con una pubertad que no llega o se retrasa.» | Síndrome de Kallmann: hipogonadismo hipogonadotrópico con anosmia; se asocia a fallos de migración GnRH (suele ser genético) | Ruta cortada, neuronas atascadas, flor tachada y barra de hormona |
| 7 | `pc0-misterio` | «¿Y en adultos? Aún no se sabe: se ha propuesto que modula la reproducción o detecta feromonas, pero nada está demostrado.» | Función no establecida en adultos; hipótesis neuromoduladora y de feromonas sin demostrar (StatPearls, reseñas) | Dos hipótesis con sello «sin demostrar» y signo de interrogación |
| 8 | `pc0-libro` | «La nomenclatura anatómica internacional lo incluye desde mil novecientos noventa y ocho, pero muchos libros siguen enseñando solo doce.» | Terminologia Anatomica 1998 incluye el nervio terminal (reseñas; no abrí el texto original) | Línea de tiempo y libro con 12 pares |
| 9 | `CTA` | «Compártelo con alguien que ame el cerebro. Síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Dibujos esquemáticos, no son imágenes médicas.** La cabeza, la lámina cribosa, el nervio terminal y la vista inferior del cerebro son una simplificación; no a escala.
- **La función del par 0 en adultos no está demostrada.** El video dice «se ha propuesto» y «nada está demostrado»: no lo cambies a «detecta feromonas». El órgano vomeronasal humano no se ha asociado con feromonas de forma clara.
- **Fechas y nombres sin verificar en la fuente primaria:** 1878 (Fritsch), «nervio supernumerario», nombre «cero» a finales de los años 80 y 1998 (Terminologia Anatomica) salen de reseñas y resúmenes; las fuentes difieren en el año de la primera observación en humanos, por eso el video no la da. No pude abrir los artículos originales.
- **Fritsch:** el video solo dice «Gustav Fritsch»; la reseña lo describe en tiburones y rayas (elasmobranquios).
- **«Siguiendo este nervio»:** las neuronas GnRH migran acompañando fibras del nervio terminal / vomeronasal; en humanos se sabe sobre todo por casos fetales y estudios en animales.
- **Síndrome de Kallmann:** es una condición genética; se menciona solo para explicar la ruta; no es consejo médico ni orienta diagnóstico.
- **«Muchos libros»:** no se afirma cuántos textos lo omiten; se dice «muchos».
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-par-craneal-0.txt`. Sin voz el audio sale a ≈ −27 LUFS: no lo publiques así.
