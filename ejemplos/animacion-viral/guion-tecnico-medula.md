# La médula espinal: el atajo del cuerpo · guion técnico (SINAPSIS, 9:16, ≈ 67 s)

**Serie:** neuroanatomía en SINAPSIS · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** anatomía vectorial esquemática sobre fondo oscuro: martillo de reflejos y arco reflejo, columna vertebral de perfil con la médula y los 31 pares de nervios, cono medular y cola de caballo, corte transversal en mariposa, axón con mielina y nodos de Ranvier, sartén caliente, silueta con niveles de lesión y cadena cerebro → decodificador → estimulador. Color: cian = señal nerviosa · ámbar = reflejo / estimulación · rojo = dolor o lesión.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-medula.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-medula.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-07-medula-espinal/`. Código: `src/viral/piezas/me-kit.tsx`, `me1.tsx` y `me2.tsx`; datos y tiempos en `src/anim/piezas.ts` (`MDE`, `TME`, `totalPares`, `msAKmh`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-07-medula-espinal/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/medula-espinal.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos usan el ritmo real de cada escena.
| Sonido | Cuándo | Cómo |
|---|---|---|
| Colchón | 0–67 s | acordes en Re menor, Sol menor, La menor, Fa, Do y Re mayor (el puente digital) |
| Gancho | escena 1 | golpe del martillo, chispa del arco reflejo y tics del cerebro tachado |
| Columna y cola | escenas 2–3 | tics de la regla de 45 cm, cuenta de 31 pares, golpe del cono y silbido de la aguja |
| Mariposa | escena 4 | pops de la sustancia gris y barrido de las autopistas |
| Velocidad | escena 5 | saltos de nodo en nodo, contador hasta 120 y campana de los 432 km/h |
| Reflejo y lesión | escenas 6–7 | chispa de la sartén, whoosh de la mano, golpe tardío del dolor, rotura y subida del nivel |
| Puente | escena 8 | pasos con muletas, pulsos del decodificador y acorde final |
Sin voz, el nivel total es ≈ −27 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `me-gancho` | «Cuando el médico golpea tu rodilla, la orden no sale de tu cerebro: sale de tu médula espinal.» | Reflejo rotuliano (segmentos L2–L4): arco reflejo espinal | Paciente sentado, martillo, arco reflejo y cerebro tachado |
| 2 | `me-columna` | «La médula mide unos cuarenta y cinco centímetros, baja por la columna y de ella salen treinta y un pares de nervios.» | ≈ 45 cm (valor de texto); 31 pares: 8 cervicales, 12 torácicos, 5 lumbares, 5 sacros, 1 coccígeo | Columna de perfil, regla y lista de pares |
| 3 | `me-cola` | «Pero termina muy arriba: a la altura de la primera o segunda vértebra lumbar; debajo solo hay nervios, la cola de caballo.» | Cono medular a nivel L1–L2; punción lumbar en L3–L4 por debajo de la médula | Zona lumbar ampliada, cola de caballo y aguja |
| 4 | `me-mariposa` | «Por dentro tiene forma de mariposa: la sustancia gris, donde se procesan las señales, rodeada de sustancia blanca, las autopistas.» | Anatomía clásica del corte transversal | Corte en mariposa con vías |
| 5 | `me-velocidad` | «Las señales más rápidas viajan por axones con mielina hasta a ciento veinte metros por segundo: más de cuatrocientos kilómetros por hora.» | Hasta ≈ 120 m/s en fibras mielínicas gruesas; 120 × 3,6 = 432 km/h | Axón con mielina y contador |
| 6 | `me-reflejo` | «Por eso, al tocar algo muy caliente, tu mano se aparta casi antes de que sientas el dolor.» | Reflejo de retirada; las barras de tiempo son esquemáticas | Sartén, mano y barras médula vs cerebro |
| 7 | `me-lesion` | «Si la médula se lesiona, el cerebro y el cuerpo dejan de comunicarse; cuanto más arriba, más funciones se afectan.» | Depende del nivel y de si la lesión es completa o incompleta | Silueta con niveles |
| 8 | `me-puente` | «En dos mil veintitrés, un hombre paralizado desde hacía años volvió a caminar con muletas gracias a un puente digital entre cerebro y médula.» | Lorach y cols., Nature, mayo 2023; lesión desde 2011; un solo participante | Cadena cerebro → decodificador → estimulador y hombre con muletas |
| 9 | `CTA` | «Compártelo con alguien que ame el cerebro. Síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Dibujos esquemáticos, no son imágenes médicas.** La columna, la médula y los nervios son una simplificación; no usar para estudiar anatomía clínica.
- **Cifras de texto sin verificar en la fuente primaria:** 45 cm, 31 pares de nervios, 120 m/s y el reflejo de retirada vienen de manuales y resúmenes; confírmalas en tu libro antes de usarlas en un trabajo.
- **Reflejo:** las barras de tiempo del reflejo frente al cerebro son esquemáticas (sin milisegundos).
- **Lesión medular:** se explica de forma general; los efectos dependen del nivel y de si la lesión es completa o incompleta.
- **El caso de 2023 (Lorach y cols., Nature)** fue **un solo participante** (lesión desde 2011): **no es una cura**, es una interfaz experimental; no prometas resultados a nadie.
- **No es consejo médico.** La punción lumbar se menciona solo para ubicar la anatomía.
- **No pude abrir** el artículo original de Nature: trabajé con resúmenes de búsqueda. Confirma fechas y cifras antes de publicar.
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-medula.txt`. Sin voz el audio sale a ≈ −27 LUFS: no lo publiques así.
