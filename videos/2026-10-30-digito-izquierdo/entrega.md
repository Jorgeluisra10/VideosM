# Entrega · «El efecto del dígito izquierdo» (SINAPSIS · serie neuroeconomía en SINAPSIS)

**Elegí:** marca SINAPSIS · paleta `medicina` (con la paleta de laboratorio del pedido dentro de las piezas) · serie `neuroeconomia` (nueva en el panel: «Neuroeconomía en SINAPSIS») · gancho «Un peso / un abismo».

## 1 · Video final
`trabajo/archivo/2026-10-30-digito-izquierdo/video-final.mp4` (1080×1920 · 60 fps · H.264 (master CRF 17) · AAC · 45,1 s · **sin voz**: solo música sintetizada y efectos). Pista de música y efectos sola: `trabajo/archivo/2026-10-30-digito-izquierdo/stems/musica-y-efectos.wav`. Copia ligera de revisión en esta carpeta (`revision.mp4`).

## 2 · Guion final (locución)
1. Un solo peso. Pero tu cerebro lo siente como un abismo.
2. Se llama efecto del dígito izquierdo: el primer dígito pesa más que los demás.
3. El salto aparece cuando cambia el primer dígito, y el número gana una cifra.
4. En veintidós millones de ventas mayoristas de autos, el precio cae al cruzar cada diez mil millas.
5. En cinco experimentos, Thomas y Morwitz vieron que el mismo centavo pesa distinto si cambia el primer dígito.
6. En tiendas reales, un centavo más sobre un noventa y nueve se siente como más de veinte.
7. Pero el seguimiento ocular lo complica: la primera mirada cae hacia el centro del precio.
8. Guárdalo para repasar sesgos y síguenos en Sinapsis.

Guion técnico con fuentes y precauciones: `ejemplos/animacion-viral/guion-tecnico-digito-izquierdo.md`.

## 3 · Ganchos
- A) «Un solo peso. Pero tu cerebro lo siente como un abismo.» ← **elegido** (versión corta del «histórico/viral»): dice lo esencial en 3 s y se puede defender entero; quité «en 200 milisegundos» y «una falla en tus ojos», que no están respaldados.
- B) «Los precios en nueve no engañan tus ojos: engañan tu cerebro.» (del «supervivencia»: sin «tu cuenta bancaria pierde la batalla», que es exagerado).
- C) «Tu cerebro sabe matemáticas, pero un atajo decide qué es barato.» (del «neurociencia»: sin «corteza prefrontal perezosa», que no es una afirmación de esos estudios).

## 4 · Texto para publicar
Un solo peso separa $9.999 de $10.000… y tu cerebro lo siente como un abismo 🧠💸 Es el efecto del dígito izquierdo: el primer dígito pesa más. Se ha visto en más de 22 millones de ventas de autos, en el laboratorio y en tiendas reales (y ojo: cómo lo hace exactamente sigue en debate). Guárdalo para repasar sesgos y síguenos en Sinapsis. (Información educativa; los gráficos son esquemas.)
#sesgoscognitivos #economiaconductual #neuroeconomia #psicologia #sinapsis

## 5 · Nota
Espero que lo guarden como apunte de sesgos cognitivos y lo compartan por el contraste «un peso = un abismo». Métrica: guardados y compartidos por cada 1.000 alcanzados, y retención al pasar la escena 4 (≈ 15 s, los autos).

## 6 · Registro
Registrado en el Panel de Videos con estado «grabado» y serie «Neuroeconomía en SINAPSIS» (`videos/2026-10-30-digito-izquierdo/registro.json`: tu panel lo trae solo al hacer git pull).

## Lo que cambié del pedido y lo que no se pudo cumplir (dicho con claridad)
- **«200 ms», «sistema límbico», «falla en tus ojos»:** no se usan. No hallé fuentes y el efecto es de codificación de magnitud (cognitivo), no un defecto visual.
- **Eye-tracking (el cierre del pedido):** la evidencia reciente (Laurent, Vanhuele et al., JCR 2023) **contradice** «mancha clavada en el primer dígito y rastro fantasma en los nueves»: la primera fijación cae entre el primer tercio y el centro del precio, el primer movimiento suele ir a la izquierda y se mira tanto a los centavos como a los pesos. Por eso la última escena lo muestra así y cierra con «sesgo real, mecanismo en debate». El mapa de calor es **esquemático**, no datos reales.
- **Thomas y Morwitz 2005 «disparan las ventas»:** no. Fueron 5 experimentos de laboratorio sobre percepción. Y los pares de precios $4,00 → $3,99 / $3,80 → $3,79 los reemplacé por $3,00 → $2,99 / $2,80 → $2,79, los niveles del diseño según las reseñas. **No pude leer el artículo completo (de pago)**: confirma los precios exactos en el original.
- **Autos:** las cifras (≈ US$ 150–200, 210 y 10) vienen de resúmenes y diapositivas de los autores; son ventas mayoristas; el gráfico es un esquema.
- **«Muralla de 5 dígitos en 3D» y «descuento cognitivo»:** son analogías visuales (rotuladas «analogía visual»); el «descuento cognitivo» es el nombre del pedido para el modelo clásico, que hoy se discute.
- **Sin voz:** no hay `OPENAI_API_KEY`. Locución en `ejemplos/animacion-viral/locucion-digito-izquierdo.txt`. Sin voz el audio sale a ≈ −29 LUFS: **no lo publiques así**; ponle voz desde el Estudio → «Voz en off».
- **Música:** `assets/musica/` vacío; se usó la sintetizada (libre de derechos). **Subtítulos palabra por palabra:** no existen; el texto grande de cada escena los reemplaza. **Fotos:** no se usaron; todo es vectorial. **Telemetría cerebral:** no se incluyó (no hay un dato real que mostrar).
- **Duración 45,1 s:** sobre los 35 s habituales (el pedido trae 4 bloques con evidencia). Puedo preparar un corte de ≈ 35 s sin las escenas 2–3. **60 fps** en lugar de 30. **Zona segura:** el botón del cierre toca el borde del 20 % inferior (plantilla fija del motor).
- **Estructura:** «Francotirador» y «Hacker» quedaron en las escenas 2–3; el «Experimento de los centavos» (escena 5) se reforzó con los autos (escena 4) y las tiendas (escena 6) para no apoyarlo en un solo estudio; el «laboratorio» cierra con la nota de que el mecanismo se discute.
