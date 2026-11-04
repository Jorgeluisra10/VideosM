# El viaje de una gota de sangre · guion técnico (SINAPSIS, 9:16, ≈ 65 s)

**Serie:** anatomía humana en SINAPSIS · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** cámara en primera persona dentro de los vasos (túnel con perspectiva, paredes que laten, glóbulos 3D), corte del ventrículo, árbol arterial, capilar, vena con válvulas, alvéolo, anillo de la vuelta, barra de ruta y reloj del viaje. Color: rojo brillante = con oxígeno · granate = sin oxígeno · cian = O2 · ámbar = CO2.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-sangre.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-sangre.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-04-viaje-gota-sangre/`. Código: `src/viral/piezas/san-kit.tsx`, `san1.tsx` y `san2.tsx`; datos y tiempos en `src/anim/piezas.ts` (`SAN`, `TSAN`, `litrosPorDia`, `vueltasEnVida`, `sistole`, `avancePulsatil`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-04-viaje-gota-sangre/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/viaje-gota-sangre.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos usan el ritmo real de cada escena.
| Sonido | Cuándo | Cómo |
|---|---|---|
| Colchón | 0–66 s | acordes suaves Re menor → Si bemol → Sol menor → La menor → Re mayor al volver al corazón |
| Latido | escenas 1–4, 7 (final) y 8 (final) | «lub-dub» a 75 lpm, el mismo periodo (0,8 s) del dibujo |
| Flujo | aorta y árbol; capilar y venas | soplo de ruido en cada latido; fluir continuo y bajo (el capilar no pulsa) |
| Contadores | 70 mL, 5 L, 7.000 L, 270 millones, 172.800 vueltas | tics suaves mientras corre la cifra y campana al cerrarla |
| Árbol | escena 4 | campanas pentatónicas que suben por generación y «boing» del cabello |
| Capilar | escena 5 | chasquido al deformarse el glóbulo, destellos del O2 y tono que baja al frenarse |
| Venas | escena 6 | clics de válvula, golpe sordo del músculo en cada apretón, barrido hacia arriba |
| Pulmón | escena 7 | respiración, burbujeo de O2 y CO2, destello brillante al volver a rojo |
| Final | escenas 8–9 | tics que aceleran y frenan, golpecitos de la médula, latido y acorde de Re mayor |
Sin voz, el nivel total es ≈ −27 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `san-gancho` | «Una gota de tu sangre da la vuelta a todo tu cuerpo en solo un minuto. Acompáñala.» | Vuelta ≈ volumen de sangre (≈ 5 L) ÷ gasto cardíaco en reposo (≈ 5 L/min) = ≈ 1 min: **cálculo propio** | Gota con anillo que se llena (contador de segundos) y caída hacia dentro |
| 2 | `san-corazon` | «Todo empieza en el ventrículo izquierdo: setenta mililitros por latido, casi cinco litros por minuto, siete mil al día.» | Volumen sistólico ≈ 70 mL, 72 lpm, 1.440 min: ≈ 7.260 L/día (**cálculo propio**; fisiología básica) | Corte del ventrículo que se contrae, válvulas, glóbulos y tres cifras |
| 3 | `san-aorta` | «Sale por la aorta, un tubo de unos tres centímetros de ancho, y desde ahí se ramifica sin parar.» | Aorta ascendente normal ≈ 2,9–3,3 cm | Vuelo por el interior de la aorta, medida ≈ 3 cm, ramas laterales |
| 4 | `san-ramas` | «Cada rama es más fina que la anterior, hasta llegar a vasos casi diez veces más delgados que un cabello.» | Arterias ≈ mm, arteriolas ≈ 10–100 µm, capilares ≈ 5–10 µm; cabello ≈ 50–100 µm (≈ 70 µm usado): 70 ÷ 8 ≈ 9 | Árbol de 5 generaciones y barras cabello vs capilar |
| 5 | `san-capilar` | «En el capilar pasan de a uno y entregan el oxígeno. Cada glóbulo lleva unos doscientos setenta millones de hemoglobinas.» | Capilar ≈ 8 µm, glóbulo ≈ 8 µm; ≈ 270 millones de hemoglobinas por glóbulo (4 O2 cada una) | Capilar con glóbulos en «bala», O2 que sale a las células y tarjeta de hemoglobina |
| 6 | `san-venas` | «Vuelve por las venas. Sus válvulas solo la dejan subir, y el músculo la empuja contra la gravedad.» | Venas sistémicas ≈ 64 % del volumen de sangre (Guyton; fuente secundaria) | Vena con válvulas y músculo de la pantorrilla que aprieta |
| 7 | `san-pulmon` | «En los pulmones, en menos de un segundo, suelta el dióxido de carbono, recoge oxígeno y vuelve a ser rojo brillante.» | Tránsito por el capilar pulmonar en reposo ≈ 0,75 s (se muestra en cámara lenta) | Alvéolo rodeado por el capilar, intercambio de O2 y CO2 |
| 8 | `san-vida` | «Un glóbulo vive unos ciento veinte días y da unas ciento setenta y dos mil vueltas. La médula lo repone, millones por segundo.» | Vida ≈ 120 días; 172.800 = 120 × 1.440 ÷ 1 (**cálculo propio**); médula ≈ 2–3 millones/s (estimación) | Anillo con contador, médula ósea que fabrica glóbulos y la gota que vuelve |
| 9 | `CTA` | «Tu sangre no se detiene nunca. Compártelo y síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Esquemas, no a escala:** el túnel, el árbol, el alvéolo y la vena son dibujos de fisiología en reposo; en una persona real los valores varían.
- **Cálculos propios:** el minuto por vuelta (5 L ÷ 5 L/min), los ≈ 7.000 L al día y las 172.800 vueltas salen de multiplicar y dividir cifras de fisiología; no son una medición. En la pantalla aparecen con «≈» y «cálculo propio».
- **El reloj del viaje es ilustrativo:** el tiempo por tramo (p. ej. las venas ocupan la mayor parte) sigue la distribución del volumen de sangre, no un cronómetro real.
- **Cámara lenta:** el paso por el capilar pulmonar (≈ 0,75 s) se muestra más lento y lo dice la pantalla.
- **Cifras de libros de texto:** ≈ 64 % en las venas (Guyton), 270 millones de hemoglobinas, 2–3 millones de glóbulos por segundo: **no pude abrir** los textos originales en esta sesión (red restringida); trabajé con resúmenes. Confírmalas antes de usarlas en un trabajo académico.
- **No es consejo médico**; es divulgación.
