# «¿Real o mito?» · guion técnico (SINAPSIS, 9:16, ≈ 58 s)

**Serie:** curiosidades médicas con humor en SINAPSIS · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** concurso de TV caricaturesco: escenario azul con reflectores, sellos gigantes REAL (verde) y MITO (rojo) que caen con golpe, globos de diálogo y **Cerebrito**, una mascota-cerebro con cara que reacciona con chistes. Cada dato lleva su fuente en pantalla.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-real-o-mito.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-real-o-mito.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-02-real-o-mito/`. Código: `src/viral/piezas/cur-kit.tsx`, `cur1.tsx` y `cur2.tsx` (sobre `sue-kit`, `jet-kit` y `real-kit`); datos y tiempos en `src/anim/piezas.ts` (`CUR`, `TCUR`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-02-real-o-mito/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/real-o-mito.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos se calculan con el ritmo real de cada escena:
| Sonido | Cuándo (s) | Cómo |
|---|---|---|
| Base de concurso | 0,2–58 | bajo con pizzicato (Do–La menor–Fa–Sol, 116 lpm), arpegio de plucks y bloque de madera en los tiempos 2 y 4 |
| Presentación | 0,3–5 | «boing» de Cerebrito, seis clics de cartas y silbido ascendente |
| Sello REAL (×5) | 10,9 · 17,4 · 31,5 · 39,0 · 46,0 | golpe seco + campanilla ascendente de tres notas (Do–Mi–Sol agudos) + ovación breve |
| Sello MITO | 22,4 | golpe + zumbido de error + trombón triste de cuatro notas |
| Hics y cerdo | 5,7 · 6,9–10,5 | gruñido nasal del cerdo; inhalación + «hic» + «boing» en cada hipo |
| Cosquillas | 12,7–15,5 | chillidos agudos rápidos (de otra persona) y un solo grillo (las propias) |
| Caja registradora | 26,3 | «cha-ching» al aparecer la pastilla de US$ 2,50 y tics de las barras |
| Violín | 33,7–39,5 | melodía propia de ocho notas con arco y vibrato |
| ¡PUM! | 42,7 | explosión cómica con platillo |
| Marcador | 47,8–55,5 | campanillas verdes, zumbido en el rojo, fanfarria de trofeo, poppers de confeti y aplausos |
Además suena lo que pone el motor (clics, golpes, ding). Sin voz, el nivel total es ≈ −28 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen / chiste |
|---|---|---|---|---|
| 1 | `cur-gancho` | «¿Real o mito? Seis datos de medicina tan locos que parecen chiste.» | — | Cerebrito presenta el concurso y seis cartas con «?» |
| 2 | `cur-hipo` | «Uno: Charles Osborne tuvo hipo durante sesenta y ocho años. Todo empezó con un cerdo. ¡Real!» | Récord Guinness del ataque de hipo más largo confirmado: 1922–1990 (≈ 68 años). Empezó en una granja al manipular un cerdo. **≈ 430 millones de hipos es un estimado de una sola fuente** | Hombre con bigote que salta con cada «¡HIC!», calendario 1922 → 1990 y un cerdo. «Todo empezó en una granja, con un cerdo.» |
| 3 | `cur-cosquillas` | «Dos: no puedes hacerte cosquillas a ti mismo, porque tu cerebelo ya sabe que eres tú. ¡Real!» | Blakemore, Wolpert y Frith 1998 (Nature Neuroscience): el cerebelo predice las consecuencias sensoriales del movimiento y cancela la respuesta al toque propio; con retraso entre movimiento y toque vuelve a haber cosquillas | Otra persona con la pluma → «JAJA»; tú mismo → «...»; cerebelo iluminado. «Yo lo intenté. Cero risas.» |
| 4 | `cur-chicle` | «Tres: un chicle tragado tarda siete años en salir. ¡Mito! Normalmente sale en unos días.» | **MITO.** El chicle no se digiere pero avanza con el tránsito normal (días). El riesgo real es tragar mucho de forma habitual (informe de 1998 en *Pediatrics* sobre obstrucciones en niños) | Tubo digestivo con el chicle, calendario «7 AÑOS» tachado y «UNOS DÍAS». «Tranquilo: no se queda a vivir ahí.» |
| 5 | `cur-pastilla` | «Cuatro: una pastilla de azúcar de dos dólares con cincuenta calma más el dolor que una de diez centavos. ¡Real!» | Waber, Shiv, Carmon y Ariely, JAMA 2008 (carta de investigación, 82 voluntarios, descargas eléctricas en la muñeca): placebo presentado a US$ 2,50 → 85,4 % de alivio; a US$ 0,10 → 61,0 % (P = 0,02). Ambas eran placebo | Dos pastillas con etiqueta, barras 61 % y 85 % y «+24 puntos». «Yo cobro más… y curo más.» |
| 6 | `cur-violin` | «Cinco: un violinista tocó mientras le implantaban electrodos en el cerebro, y el tejido cerebral no siente dolor. ¡Real!» | Roger Frisch (Minnesota Orchestra) tocó el violín durante la implantación de electrodos de estimulación cerebral profunda por temblor esencial, con el paciente despierto (Mayo Clinic; cirugía de 2010, video republicado en 2014). El tejido cerebral no tiene receptores de dolor; el cuero cabelludo se anestesia | Cabeza con cerebro «de rayos X», electrodo luminoso, violín y notas. «Yo ni me enteré. Soy el cerebro.» |
| 7 | `cur-acento` | «Seis: tras una lesión cerebral, una noruega empezó a sonar alemana. Se llama síndrome del acento extranjero. ¡Real!» | Monrad-Krohn 1947: Astrid L., noruega, tras una herida de metralla en 1941 era percibida como alemana (disprosodia, no un acento «aprendido»). Descrito ya en 1907 (Pierre Marie); ≈ 100–200 casos documentados | Mujer, burbuja «Hola, ¿qué tal?», «¡PUM!», cerebro izquierdo iluminado y banderas Noruega → Alemania. «¿Y mi pasaporte?» |
| 8 | `cur-marcador` | «Cinco eran reales y uno, mito. ¿Cuántos acertaste? Cuéntame en los comentarios.» | — | Seis luces (5 verdes, 1 roja), trofeo, confeti. «Cuéntame en los comentarios» |
| 9 | `CTA` | «Mándaselo a ese amigo que cree que sabe de medicina y síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Osborne:** los medios difieren en detalles (cerdo pesado o a punto de sacrificarse; fecha exacta de 1990 en que paró; año de nacimiento). El video solo afirma lo firme: ≈ 68 años de hipo, récord Guinness, empezó con un cerdo. **Los 430 millones de hipos son un estimado** de una sola fuente y así se rotula.
- **Pastilla cara (Waber 2008):** es una **carta de investigación** pequeña (82 voluntarios, dolor inducido con descargas), no un ensayo clínico; mide dolor autorreportado. Ambas pastillas eran placebo; no significa que «lo caro cure más» en general.
- **Chicle:** el mito se refiere a los «7 años». Tragar chicle ocasionalmente es inocuo; hacerlo de forma habitual (sobre todo en niños) puede causar obstrucciones. **No es consejo médico.**
- **Violín:** la cirugía fue de **estimulación cerebral profunda** (implantar electrodos), con el paciente despierto y anestesia local en el cuero cabelludo; el video lo resume como «le implantaban electrodos en el cerebro». «El tejido cerebral no siente dolor» (no tiene receptores de dolor) es un hecho de neurocirugía que **no pude confirmar con una fuente abierta en esta sesión**: verifícalo.
- **Acento extranjero:** es una disprosodia por lesión cerebral; quienes lo escuchan lo perciben como acento extranjero. El caso de 1947 ocurrió tras una herida de guerra; el video lo cuenta con respeto y sin burlarse del paciente. Las cifras de casos (≈ 100–200) vienen de fuentes divulgativas.
- **Humor:** los chistes los dice Cerebrito sobre sí mismo o sobre el dato; ninguno se burla de pacientes.
- **No pude abrir los artículos originales** en esta sesión (red restringida): trabajé con resúmenes de búsqueda. **Confirma las cifras en los textos completos antes de usarlas en un trabajo.**
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-real-o-mito.txt`. Sin voz el audio sale a ≈ −28 LUFS: no lo publiques así.
