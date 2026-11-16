# El par craneal IX: el nervio de la arcada y la presión · guion técnico (SINAPSIS, 9:16, ≈ 68 s)

**Serie:** pares craneales en SINAPSIS (par IX; del 0 al VIII salieron antes) · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** ilustración vectorial esquemática sobre fondo oscuro: corte de cabeza y cuello de perfil con cerebro, tronco, lengua, garganta, arteria carótida y glándula parótida; nervio IX naranja con sus ramas, vago verde, cepillo de dientes, reloj de presión, figuras humanas en cuadrícula con las que no tienen arcada resaltadas, arteria con seno carotídeo que late, electrocardiograma con pausa, rayo de dolor, vaso (tragar), cara que bosteza y cruz médica. Color: naranja = glosofaríngeo (IX) · verde = vago (X) · rojo = arcada, dolor y arteria · violeta = cerebro · rosa = lengua · dorado = datos.
**Estructura pedida:** gancho (0–7 s) → **aviso rápido de «síguenos en Sinapsis» (7–11,5 s, antes de desarrollar el tema)** → desarrollo → cierre con CTA completo.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-par-craneal-9.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-par-craneal-9.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-16-par-craneal-9/`. Código: `src/viral/piezas/gl-kit.tsx` (`Perfil`, `Persona`, `Manometro`, `Corazon`), `gl1.tsx` y `gl2.tsx` (el aviso `gl-sigue` reusa `SigueActual` de `va1.tsx`, ahora parametrizable con el par actual); datos y tiempos en `src/anim/piezas.ts` (`GL`, `TGL`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-16-par-craneal-9/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-9.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos usan el ritmo real de cada escena.
| Sonido | Cuándo | Cómo |
|---|---|---|
| Colchón | 0–70 s | acordes en Do, Sol, La menor, Re menor, Fa, Mi menor, Si menor sobrio, Mi menor y Sol |
| Gancho y aviso | escenas 1–2 | campana del nervio, golpe de la arcada con el cepillo, destello de la presión, campanas del aviso y tics de los 13 pares |
| Par y arcada | escenas 3–4 | pops de sabor/sensibilidad/saliva, subida del aviso del IX y golpe de la arcada |
| Dato wow y presión | escenas 5–6 | tics de las 10 personas y latido del seno carotídeo |
| Dolor, desmayo y pregunta | escenas 7–9 | rayo del dolor, burbuja de tragar, latidos que se detienen y campana de la pregunta |
Sin voz, el nivel total es ≈ −27 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `gl-gancho` | «El mismo nervio que te da una arcada con el cepillo de dientes también vigila tu presión arterial.» | El IX es la vía aferente del reflejo nauseoso y, por el nervio del seno carotídeo (de Hering), lleva la señal de los barorreceptores (TeachMeAnatomy, StatPearls NCBI, Osmosis, Radiopaedia) | Perfil con cepillo, arcada y reloj de presión |
| 2 | `gl-sigue` | «Antes de seguir: síguenos en Sinapsis. No te pierdas ningún par.» | — (aviso de suscripción) | Insignia SINAPSIS, botón seguir y fila de los 13 pares con el IX en dorado |
| 3 | `gl-par` | «Es el par craneal nueve, el glosofaríngeo: sabor del fondo de la lengua, sensibilidad y saliva.» | Gusto del tercio posterior de la lengua, sensibilidad de faringe/amígdalas/oído medio y fibras parasimpáticas a la glándula parótida (vía ganglio ótico) | Perfil con las ramas del IX |
| 4 | `gl-arcada` | «Si algo toca el fondo de tu garganta, este nervio da el aviso y el vago ordena la arcada.» | Aferente: glosofaríngeo; eferente: vago (fuentes educativas; una arcada ausente puede sugerir daño del IX en el examen neurológico, pero no es concluyente) | Cepillo, señal al cerebro y respuesta del vago |
| 5 | `gl-sin` | «Dato wow: en un estudio, más de un tercio de adultos sanos no tenía arcada, y estaban bien.» | Davies y cols., *Lancet* 1995: 140 adultos sanos, reflejo nauseoso ausente en ≈ 37 %, mientras la sensibilidad faríngea solo faltaba en 1 persona; es un único estudio (otro estudio mayor, NCT04866251, sin resultados publicados) | 10 personas, 4 resaltadas |
| 6 | `gl-presion` | «Y en el cuello tiene un sensor de presión, el seno carotídeo: vigila la presión y avisa al cerebro.» | El nervio del seno carotídeo (de Hering) es rama del IX y lleva barorreceptores del seno y quimiorreceptores del cuerpo carotídeo (O₂ y CO₂) al núcleo del tracto solitario (StatPearls NCBI) | Arteria con seno que late, reloj y cerebro |
| 7 | `gl-neuralgia` | «Rara vez se irrita: la neuralgia del glosofaríngeo da un dolor muy fuerte en la garganta al tragar o bostezar.» | Neuralgia del glosofaríngeo: ≈ 0,2–1,3 % de las neuralgias craneales, ≈ 0,2–0,7 por 100 000 al año; dolor desencadenado por tragar, masticar, toser o bostezar (revisiones en PMC) | Perfil con nervio irritado, vaso y bostezo |
| 8 | `gl-sincope` | «En muy pocos casos, ese dolor viene con desmayos: se cree que el nervio también frena el corazón.» | Síncope cardíaco asociado: ≈ 4 de ≈ 216 casos; se propone un arco reflejo vagoglosofaríngeo con bradicardia/asistolia; evidencia sobre todo de informes de casos | Corazón, ECG con pausa y figura que cae |
| 9 | `gl-prueba` | «Dolor fuerte al tragar o un desmayo: consulta a un médico. ¿Qué te da más arcadas? Cuéntame en comentarios.» | Mensaje de seguridad + pregunta de interacción | Cruz médica, iconos y burbuja |
| 10 | `CTA` | «Compártelo con alguien que ame el cerebro. Síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Dibujos esquemáticos, no son imágenes médicas.** La cabeza, la garganta y las ramas del IX están simplificadas y fuera de escala.
- **«Más de un tercio sin arcada»** viene de **un solo estudio** (Davies y cols., 1995, 140 adultos); es una estimación y el video dice «en un estudio». **Una arcada ausente no equivale a enfermedad:** no sugieras que quien no tiene arcada «tiene algo».
- **Arcada = IX aferente + X eferente:** es la descripción habitual de los textos educativos; no pude abrir libros de referencia (revisa Netter/Costanzo si lo vas a citar).
- **Seno carotídeo:** el nervio del seno es rama del IX; los barorreceptores también tienen aferencias vagales en otros puntos (arco aórtico por el X). El video habla solo del seno.
- **Neuralgia y síncope:** son **muy raros**; las cifras salen de revisiones y pequeñas series (síncope ≈ 4 de ≈ 216 casos); el mecanismo del desmayo es una propuesta («se cree»). Las cifras no se dicen en la voz.
- **Seguridad:** el video no diagnostica. Dolor intenso al tragar, desmayos, mareo con debilidad, dificultad para hablar o dolor de cabeza fuerte requieren atención médica.
- **No sirve para autodiagnóstico** ni es consejo médico. No respondas casos en los comentarios.
- **No pude abrir** los artículos originales; trabajé con resúmenes de búsqueda. Confirma antes de usarlo en un trabajo.
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-par-craneal-9.txt`. Sin voz el audio sale a ≈ −27 LUFS: no lo publiques así.
