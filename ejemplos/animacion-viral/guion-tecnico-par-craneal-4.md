# El par craneal IV: el nervio que rompe las reglas · guion técnico (SINAPSIS, 9:16, ≈ 65 s)

**Serie:** pares craneales en SINAPSIS (par IV; el 0, I, II y III salieron antes) · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** anatomía vectorial esquemática sobre fondo oscuro: tronco encefálico con los demás pares saliendo por delante y el IV por detrás, barras de fibras II frente a IV, cruce de fibras azules y naranjas, recorrido lateral alrededor del tronco, tendón del oblicuo superior pasando por un anillo dorado (la polea), ojos mirando abajo y hacia la nariz, cara con cabeza inclinada y letra E doble, trauma y línea de tiempo congénita, y cierre con cruz médica. Color: ámbar = troclear (IV) · azul/naranja = los dos lados · dorado = polea y datos · rojo = daño · violeta = tronco encefálico.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-par-craneal-4.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-par-craneal-4.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-12-par-craneal-4/`. Código: `src/viral/piezas/tr-kit.tsx`, `tr1.tsx` y `tr2.tsx` (reusa `OjoP` de `oc-kit.tsx` y `polyPt` de `op-kit.tsx`); datos y tiempos en `src/anim/piezas.ts` (`TRO`, `TTR`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-12-par-craneal-4/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-4.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos usan el ritmo real de cada escena.
| Sonido | Cuándo | Cómo |
|---|---|---|
| Colchón | 0–67 s | acordes en Re menor, Si bemol, Sol menor, Do, La menor y Re menor sobrio (la consulta) |
| Gancho y cruce | escenas 1–2 | pops del par IV, chispa de la salida dorsal y whoosh del cruce de fibras |
| Recorrido y tróclea | escenas 3–4 | tics del nervio que rodea el tronco y de la polea, campana del nombre |
| Acción y parálisis | escenas 5–6 | pops del ojo que baja y gira, golpe de la falla y zap de la visión doble |
| Causas y consulta | escenas 7–8 | golpe del trauma, tic de la línea del tiempo congénita y cierre sobrio |
Sin voz, el nivel total es ≈ −27 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `tr-gancho` | «El par craneal cuatro, el troclear, es el más pequeño y el único que sale por detrás del tronco encefálico.» | El nervio craneal con menos axones (≈ 3 400 según una referencia alemana; las cifras varían) y el único que emerge de la cara dorsal, bajo el colículo inferior (Radiopaedia, GPnotebook, Kenhub) | Tronco encefálico en vista lateral y barras II frente a IV |
| 2 | `tr-cruce` | «Además, todas sus fibras se cruzan al otro lado: el núcleo del lado izquierdo mueve un músculo del ojo derecho.» | Decusación completa en el velo medular superior; inerva el oblicuo superior contralateral (Kenhub, anatomía) | Vista dorsal con fibras azul y naranja |
| 3 | `tr-recorrido` | «Da la vuelta alrededor del tronco encefálico, tiene el recorrido más largo dentro del cráneo y llega a la órbita.» | Rodea el pedúnculo cerebral, pasa por el seno cavernoso y la fisura orbitaria superior; «recorrido intracraneal más largo» según una referencia (no verificado en un segundo texto) | Vista lateral con el nervio dando la vuelta |
| 4 | `tr-troclea` | «Mueve un solo músculo, el oblicuo superior, cuyo tendón pasa por una polea: la tróclea, que le da su nombre.» | Tróclea (del latín «polea»): anillo fibroso por el que pasa el tendón del oblicuo superior | Tendón con anillo dorado |
| 5 | `tr-accion` | «Ese músculo baja el ojo cuando mira hacia la nariz y lo rota hacia adentro, como al leer o al bajar escaleras.» | Depresión (sobre todo en aducción) e intorsión (Iowa EyeRounds); mirar hacia abajo cerca: lectura y escaleras (ejemplos ilustrativos) | Ojos mirando abajo y hacia la nariz |
| 6 | `tr-paralisis` | «Si falla, aparece visión doble vertical, sobre todo al mirar hacia abajo, y la persona inclina la cabeza para compensar.» | Diplopía vertical o torsional, a menudo peor en la mirada hacia abajo; inclinación de la cabeza típicamente hacia el lado contrario, con excepciones (EyeWiki, Iowa) | Cara con cabeza inclinada y letra E doble |
| 7 | `tr-causas` | «Un golpe en la cabeza puede lesionarlo; otras veces es una parálisis congénita que solo se nota años después.» | El traumatismo puede lesionarlo por su recorrido largo y fino; los golpes leves a veces solo revelan una parálisis congénita previa (informes de casos) | Nervio largo que se rompe y línea de tiempo |
| 8 | `tr-consulta` | «Si de repente ves doble, sobre todo al mirar hacia abajo, consulta con un médico: tiene muchas causas.» | La diplopía brusca requiere valoración médica; tiene múltiples causas (traumática, congénita, vascular, compresiva, entre otras) | Letra E doble y cruz médica |
| 9 | `CTA` | «Compártelo con alguien que ame el cerebro. Síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Dibujos esquemáticos, no son imágenes médicas.** El tronco encefálico, el recorrido y el anillo de la tróclea son simplificaciones; no a escala.
- **«El más pequeño»:** es el de menos axones (la cifra varía según la fuente: unos 2 000–3 500); el video dice «el más pequeño» y en pantalla «unos pocos miles». No se compara el diámetro.
- **«Recorrido más largo dentro del cráneo»:** lo afirma una referencia; no lo confirmé en un segundo texto. Si quieres blindarlo, di «uno de los recorridos más largos».
- **Inclinación de la cabeza:** suele ser hacia el lado contrario a la parálisis, pero hay pacientes que la inclinan hacia el mismo lado; el video dice «inclina la cabeza para compensar» y en pantalla «hacia el lado contrario».
- **No sirve para autodiagnóstico.** La visión doble tiene muchas causas; el mensaje final es una advertencia general («consulta con un médico»), no un diagnóstico ni un consejo médico. No digas que la visión doble «es el IV» ni respondas casos.
- **Ejemplos de leer y bajar escaleras:** son ilustrativos de la mirada hacia abajo; no dije que el IV sea el único músculo que interviene.
- **No pude abrir** los artículos originales ni textos de neuroanatomía: trabajé con resúmenes de búsqueda (Radiopaedia, GPnotebook, Kenhub, EyeWiki, Iowa). Confirma antes de usarlo en un trabajo.
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-par-craneal-4.txt`. Sin voz el audio sale a ≈ −27 LUFS: no lo publiques así.
