# «La regla del 37 %» · guion técnico (IMNOBA, ensayo abstracto, 9:16, ≈ 84 s)

**Estilo:** ensayo visual abstracto (sin ilustración literal): cápsulas con valor oculto, un visor técnico ┌ ┐ └ ┘, odómetros y una curva, con los colores de IMNOBA: navy `#02224E` (fondo), amarillo `#FFC500` (la mejor opción), azul `#4C7DFF` (la opción mediocre que se atrapa por frenar pronto), azul claro `#8EB8FF` (telemetría) y rojo suave (lo que se pierde). Cierre con el logo de IMNOBA.
**Cómo se carga:** `node scripts/anim/ejemplo.mjs --tema=parada-optima` (o el botón «🧮 Ensayo «La regla del 37 %»» del Estudio, marca IMNOBA) → Renderizar. Voz con IA: tarjeta «🎙️ Voz en off». Código: `src/viral/piezas/par-ui.tsx` (kit), `par1.tsx`, `par2.tsx` (escenas); matemática y tiempos en `src/anim/piezas.ts` (`probParada`, `kOptimo`, `aplicarRegla`, `simularParada`, `construirSecuencia`, `PAR`, `TPA`).

| # | Pieza | Voz en off | Dato (cómo se obtiene) | Imagen |
|---|---|---|---|---|
| 1 | `par-gancho` | «Cuando buscas casa, hay dos formas de equivocarte: decidir por impulso, o esperar tanto la perfecta que otro se la lleve.» | Planteamiento del dilema | Dos filas de cápsulas: A, el visor frena en la primera (azul); B, las buenas se desvanecen |
| 2 | `par-fila` | «Las matemáticas lo llaman parada óptima. Imagina cien opciones que ves una por una, sin conocer su valor hasta que pasan frente a ti.» | Problema de la parada óptima o «de la secretaria» | 100 cápsulas con valor oculto; el visor revela su valor al pasar |
| 3 | `par-impulso` | «Si frenas muy pronto, te quedas con una opción mediocre: no tenías con qué compararla. Y la mejor llegaba después.» | Caso ilustrativo (una fila fija): frenas en la 6.ª con un 55 y la mejor (100) llega en la 71.ª | La cápsula 55 en azul; el resto se revela y la mejor se enciende en amarillo |
| 4 | `par-espera` | «Si esperas hasta el final, pasa lo contrario: la mejor ya se fue, y te quedas con el visor vacío.» | Caso ilustrativo: la mejor pasa en la 22.ª | El visor recorre las 100 y termina en rojo, «0 opciones elegidas» |
| 5 | `par-regla` | «La regla del treinta y siete por ciento: rechaza por completo el primer treinta y siete. Sirve para calibrar el mercado. Después, elige la primera opción que supere a todas las anteriores.» | Regla: rechazar las primeras k = 37 de n = 100 y elegir la primera mejor que todas las vistas (en el ejemplo: estándar 88 en la 29.ª; la primera que lo supera es la mejor, la 61.ª) | El estándar sube hasta el mejor visto; al cruzarlo, la elegida se ilumina |
| 6 | `par-curva` | «La curva sube, llega a su máximo justo en el treinta y siete, y vuelve a caer. Ahí tienes cerca de treinta y siete por ciento de acertar con la mejor.» | **Cálculo exacto:** P(k) = (k/n)·Σ_{j=k}^{n-1} 1/j. Con n = 100: máximo en k = 37 con 37,1 %; elegir la primera o esperar al final = 1 % | Curva que se dibuja con un marcador y odómetro de probabilidad |
| 7 | `par-simula` | «Lo comprobamos con diez mil búsquedas simuladas de cien opciones: la regla acertó cerca del treinta y siete por ciento. Elegir a ciegas acierta una de cada cien.» | **Simulación propia** (Monte Carlo, 10.000 intentos, semilla fija 2024): 36,2 %; valor teórico 37,1 % | Cuadrícula de 100 búsquedas (amarillo = acierto) y contadores |
| 8 | `par-aplica` | «Con diez opciones, mira las primeras tres. Con veinte, las primeras siete. Con cien, las primeras treinta y siete. Y luego decide, sin mirar atrás.» | k óptimo calculado: n = 10 → 3 (39,9 %), n = 20 → 7 (38,4 %), n = 100 → 37 (37,1 %) | Tres filas con las primeras k en azul claro |
| 9 | `CTA` | «Tu decisión más grande no se resuelve con corazonadas ni con parálisis: se resuelve con método. Empieza a buscar en IMNOBA.» | — | Cierre con el logo de IMNOBA e `imnoba.com` |

## Precauciones antes de publicar
- **Es un modelo, no una garantía.** La probabilidad de 37,1 % vale para el problema clásico: las opciones llegan en orden aleatorio, no puedes volver a una ya rechazada, y solo cuenta quedarte con **la** mejor. Al comprar casa puedes volver, negociar y comparar más criterios; por eso el video habla de «método» y no de «certeza» (el texto base decía «con certeza»: se cambió a propósito). Con n → ∞ la fracción óptima tiende a 1/e ≈ 36,8 %.
- Las filas de las escenas 3, 4 y 5 son **casos ilustrativos** (una secuencia fija), no estadísticas; la estadística está en la curva (exacta) y en la simulación.
- La simulación usa semilla fija (2024) y da 36,2 %; con otra semilla oscila alrededor del 37 % (±0,5 puntos). El video lo declara en pantalla.
- No es asesoría financiera ni inmobiliaria: no insinúa que haya que comprar o esperar un número de días. La frase «la decisión financiera más importante de tu vida» no se usa.
- Cita: Gilbert y Mosteller, «Recognizing the Maximum of a Sequence», *Journal of the American Statistical Association* 61 (1966) 35–73 (el problema se conoce como «de la secretaria» o «de las bodas»). Verifica el título y las páginas en la fuente antes de publicar.

## Fuentes consultadas (búsqueda web)
- Gilbert J., Mosteller F. (1966), *JASA* 61: 35–73 · Wikipedia, «Secretary problem» · Ferguson, «Who solved the secretary problem?» (resumen histórico y cálculo de P(k)).
- Cálculo propio y verificado en pruebas automáticas: `probParada`, `kOptimo` y `simularParada` en `src/anim/piezas.ts`.
