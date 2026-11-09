# El par craneal I: el nervio que renace · guion técnico (SINAPSIS, 9:16, ≈ 67 s)

**Serie:** pares craneales en SINAPSIS (primer video de la colección «un dato wow por cada par»: el par 0 salió antes, en neuroanatomía) · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** anatomía vectorial esquemática sobre fondo oscuro: neuronas grises que no se reemplazan frente a neuronas azules que mueren y renacen en verde, corte del epitelio olfatorio (aire, mucosa, cilios, células de soporte, células madre basales, lámina cribosa y bulbo con glomérulos), cuadrícula de 400 receptores, corte sagital con amígdala e hipocampo, golpe y virus, frascos de aroma. Color: azul = neurona olfatoria · verde = neurona nueva o célula madre · ámbar = célula de soporte · rojo = daño o virus · 7 matices = tipos de receptor.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-par-craneal-1.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-par-craneal-1.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-09-par-craneal-1/`. Código: `src/viral/piezas/ol-kit.tsx`, `ol1.tsx` y `ol2.tsx` (reusa `Cabeza` de `pc-kit.tsx`); datos y tiempos en `src/anim/piezas.ts` (`OL`, `TOL`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-09-par-craneal-1/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-1.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos usan el ritmo real de cada escena.
| Sonido | Cuándo | Cómo |
|---|---|---|
| Colchón | 0–70 s | acordes en Re menor, Si bemol, Sol menor, Do, La menor y Re mayor (la recuperación) |
| Gancho | escena 1 | tics de las neuronas grises y pops verdes cuando las del olfato renacen |
| Mucosa y ciclo | escenas 2–3 | barrido del aire, golpe de las neuronas dañadas, reloj de 1–3 meses y pops de las células madre |
| Receptores | escena 4 | tics de la cuadrícula de 400 y chispas de cada olor |
| Axones y memoria | escenas 5–6 | campana de la lámina cribosa, axones nuevos y destello del recuerdo |
| Daño y recuperación | escenas 7–8 | golpe del trauma, barrido del virus, pops de los cuatro frascos y acorde final |
Sin voz, el nivel total es ≈ −27 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `ol-gancho` | «La mayoría de tus neuronas no se reemplaza, pero las del olfato, el par craneal uno, se renuevan toda la vida.» | Las neuronas receptoras del epitelio olfatorio se renuevan durante toda la vida desde células madre basales (reseñas en PMC); en el cerebro adulto humano casi no hay neurogénesis | Neuronas grises fijas frente a neuronas azules que mueren y renacen |
| 2 | `ol-mucosa` | «Están en el techo de la nariz, expuestas al aire que respiras, y por eso se dañan y mueren con facilidad.» | Las neuronas olfatorias están más expuestas al ambiente que casi cualquier otra neurona (reseña en Frontiers in Aging Neuroscience, 2020) | Corte del epitelio con aire y tóxicos |
| 3 | `ol-ciclo` | «En ratones, la mayoría vive de uno a tres meses y células madre de la mucosa fabrican neuronas nuevas sin parar.» | Ratones: la mayoría vive 1–3 meses, con cola de más de un año (misma reseña); NO hay cifra humana validada | Reloj de 1–3 meses y neuronas verdes nuevas |
| 4 | `ol-receptor` | «Cada neurona fabrica un solo tipo de receptor, de unos cuatrocientos que funcionan en humanos, y cada olor activa varios a la vez.» | Axel y Buck (Nobel 2004): familia de ≈ 1000 genes; en humanos funcionan ≈ 350–400 (NIDCD); un receptor por neurona; los olores activan combinaciones | Cuadrícula de 400 puntos con dos olores |
| 5 | `ol-axones` | «Sus axones cruzan la lámina cribosa y las neuronas nuevas deben volver a conectarse con el bulbo olfatorio.» | Anatomía clásica; las neuronas nuevas deben reconectar con los glomérulos (datos sobre todo de roedores) | Lámina cribosa, axones y glomérulos |
| 6 | `ol-memoria` | «Desde el bulbo, las señales llegan a la amígdala y al hipocampo: por eso un olor puede traerte un recuerdo de golpe.» | Proyecciones del bulbo a la corteza olfatoria y a estructuras límbicas (libros de texto y divulgación); simplificado | Corte sagital con amígdala, hipocampo y burbuja de recuerdo |
| 7 | `ol-dano` | «Un golpe en la cabeza puede cortar sus fibras, y el COVID-19 parece dañar sobre todo células de soporte, no neuronas.» | Traumatismo: el cizallamiento de las fibras en la lámina cribosa es uno de varios mecanismos; COVID-19: el receptor ACE2 está en las células de soporte y no en las neuronas (el mecanismo se sigue estudiando) | Golpe sobre las fibras y virus sobre las células de soporte |
| 8 | `ol-recupera` | «Muchas personas recuperan el olfato en semanas o meses, y el entrenamiento olfativo, con cuatro aromas, ayudó en estudios pequeños.» | Entrenamiento olfativo clásico (Hummel y cols., 2009): rosa, limón, clavo y eucalipto, dos veces al día durante 12 semanas; estudios pequeños | Frascos de los cuatro aromas |
| 9 | `CTA` | «Compártelo con alguien que ame el cerebro. Síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Dibujos esquemáticos, no son imágenes médicas.** El epitelio, la lámina cribosa y el bulbo son una simplificación; los siete colores de receptor son ilustrativos.
- **La cifra de uno a tres meses es de ratones.** No hay una vida media humana validada; el video lo dice («en ratones») y no debe leerse como dato humano. La renovación disminuye con la edad.
- **«La mayoría de tus neuronas no se reemplaza»** es una generalización: la neurogénesis adulta en el hipocampo humano sigue en debate; por eso el video dice «la mayoría».
- **«Unos cuatrocientos»** es un orden de magnitud: las fuentes dan ≈ 350–400 receptores funcionales según el recuento. No se dice que «distingas un billón de olores» (cifra muy discutida).
- **Memoria:** la conexión con la amígdala y el hipocampo es real pero simplificada (pasa por la corteza olfatoria); el video NO dice que el olfato se salte el tálamo, porque esa afirmación absoluta no es del todo exacta.
- **COVID-19:** el mecanismo se sigue estudiando; el video dice «parece dañar sobre todo células de soporte». No se da un porcentaje de recuperación.
- **Entrenamiento olfativo:** la evidencia viene de estudios pequeños; no es consejo médico. Quien pierda el olfato debe consultar a su médico (puede ser señal de otras condiciones).
- **No pude abrir** los artículos originales (Hummel 2009, Bergmann 2012, Axel y Buck 1991): trabajé con resúmenes y reseñas de búsqueda. Confirma las cifras antes de usarlas en un trabajo.
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-par-craneal-1.txt`. Sin voz el audio sale a ≈ −27 LUFS: no lo publiques así.
