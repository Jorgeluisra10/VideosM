# «Los dueños del cerebro» · guion técnico (SINAPSIS, 9:16, ≈ 45 s)

**Serie:** neuroanatomía en SINAPSIS · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** misterio científico in crescendo; campos de microscopio circulares (corte H&E rosa/violeta y fluorescencia GFAP sobre negro azulado) con dorado para el astrocito.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-astrocitos-einstein.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-astrocitos-einstein.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-10-29-astrocitos-einstein/`. Código: `src/viral/piezas/ein-kit.tsx`, `ein1.tsx` y `ein2.tsx`; datos y tiempos en `src/anim/piezas.ts` (`EIN`, `TEIN`, `PIEZAS`).

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `ein-gancho` | «Ahora mismo, toxinas intentan entrar a tu cerebro. Algo las frena.» | Gancho de supervivencia (barrera hematoencefálica) | Capilar con toxinas que chocan contra un escudo dorado; aparece la estrella |
| 2 | `ein-barrera` | «Son los astrocitos: con sus pies perivasculares envuelven cada capilar y ayudan a mantener la barrera hematoencefálica.» | El sello principal lo forman las uniones estrechas del endotelio; los pies astrocitarios cubren ≈ 90–95 % de la superficie del vaso (una revisión) y, con los pericitos, inducen y mantienen la barrera | Campo de microscopio H&E (esquema): pies perivasculares alrededor del capilar; toxinas rebotan y un nutriente pasa |
| 3 | `ein-tripartita` | «Los libros dibujan dos neuronas. Falso: hay un tercer participante, el astrocito.» | Concepto de sinapsis tripartita: Araque et al., *Trends Neurosci* 1999 (citado de memoria, sin verificar) | Dos neuronas con la hendidura; sello «FALSO» y procesos dorados que llegan |
| 4 | `ein-esculpe` | «Si la conexión es débil, la eliminan; si importa, la refuerzan. Esculpen tus recuerdos.» | Chung et al., *Nature* 2013;504:394–400: los astrocitos fagocitan sinapsis (MEGF10/MERTK) en ratones; su papel en reforzar sigue en estudio | Red de conexiones: las débiles se comen; las fuertes forman una constelación dorada |
| 5 | `ein-diamond` | «En los ochenta, Marian Diamond comparó el cerebro de Einstein con el de once hombres.» | Diamond et al., *Exp Neurol* 1985;88:198–204: 11 controles masculinos (edad media 64), áreas 9 y 39 de ambos hemisferios, tinción Klüver-Barrera | Placa histológica, campo de conteo y signo «?» |
| 6 | `ein-hallazgo` | «En la corteza parietal izquierda, más células gliales por cada neurona.» | Relación neurona:glía menor en las 4 áreas, pero solo el área 39 izquierda fue significativa (t = 2,62, gl = 9, p < 0,05). El estudio contó «glía», no astrocitos en particular | Dos campos (Einstein / controles), esquema y barra con «p < 0,05 · 1 de 4 áreas» |
| 7 | `ein-cautela` | «Una pista, no una prueba: era un solo cerebro.» | Críticas: Hines (28 comparaciones, 1 significativa) y Colombo et al. 2018 (un único cerebro envejecido y fijado en formol) | Cuatro fichas de cautela y rótulo «UNA PISTA, NO UNA PRUEBA» |
| 8 | `ein-gfap` | «Teñidos con GFAP, forman un cielo nocturno: tu cerebro está lleno de estrellas.» | GFAP marca los procesos principales y el citoesqueleto del astrocito, no toda la célula; en corteza son sobre todo astrocitos protoplásmicos con forma estrellada | Campo de fluorescencia con zoom hacia atrás: estrellas doradas sobre un cielo nocturno |
| 9 | `CTA` | «Guárdalo para tus repasos y síguenos en Sinapsis.» | — | Cierre SINAPSIS |

## Precauciones antes de publicar (lo que NO se afirma o se matiza)
- **Einstein / "más astrocitos que…":** NO se dice que tuviera más astrocitos. El estudio (Diamond 1985) contó **células gliales por neurona** (sin distinguir astrocitos), con **11 hombres de control**, y solo el **área 39 izquierda** fue significativa (**p < 0,05**; en 1 de 4 áreas). La neurona:glía fue menor en las cuatro áreas, pero sin significación en las otras tres. Por eso el video dice «una pista, no una prueba: era un solo cerebro».
- **Críticas conocidas** al estudio: Hines (muchas comparaciones, una sola significativa → riesgo de falso positivo) y Colombo et al. 2018 (un solo cerebro envejecido, fijado en formol; no hay forma de saber si la diferencia era previa o reflejo de la edad/ del fijado). El video lo resume en la escena 7.
- **Barrera hematoencefálica:** el video dice «ayudan a mantener», no «forman» ni «deciden quién entra». El sello principal son las **uniones estrechas del endotelio**; los astrocitos y los pericitos las inducen y mantienen. El brief decía «deciden qué entra y qué se queda afuera»: se reformuló por rigor.
- **Sinapsis tripartita:** «eliminan lo débil / refuerzan lo importante» se sostiene con Chung 2013 (**ratones**, fagocitosis de sinapsis); el refuerzo de sinapsis por astrocitos sigue en estudio. «Esculpen tus recuerdos» es una analogía, no un resultado.
- **Cita de memoria:** Araque et al. 1999 (acuñó «sinapsis tripartita») se cita de memoria: verifícala antes de ponerla en un trabajo.
- **GFAP:** tiñe el citoesqueleto/procesos principales, no toda la célula; el «cielo de estrellas» es una ilustración esquemática (color falso), no un dato real. Todas las imágenes de cortes (H&E, GFAP) son **esquemas dibujados**, no fotografías de microscopio.
- **Pies perivasculares «≈ 90–95 %»:** viene de una revisión; es una aproximación y no figura en pantalla como cifra absoluta.

## Fuentes (búsqueda de la sesión del 29-oct-2026 y memoria)
- Diamond MC, Scheibel AB, Murphy GM, Harvey T. *On the brain of a scientist: Albert Einstein.* Exp Neurol 1985;88:198–204.
- Hines T. *Neuromythology of Einstein's brain.* Brain Cogn 1998 (crítica estadística).
- Colombo JA et al. 2018 (estudio de un único cerebro fijado en formol; crítica metodológica).
- Chung WS et al. *Astrocytes mediate synapse elimination through MEGF10 and MERTK pathways.* Nature 2013;504:394–400.
- Araque A et al. *Tripartite synapses: glia, the unacknowledged partner.* Trends Neurosci 1999 (de memoria, sin verificar).
- Revisiones sobre barrera hematoencefálica (endotelio, pericitos y pies astrocitarios).
