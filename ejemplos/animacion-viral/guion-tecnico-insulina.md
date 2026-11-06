# La inyección que cambió todo · guion técnico (SINAPSIS, 9:16, ≈ 63 s)

**Serie:** historia de la medicina en SINAPSIS · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** hospital y laboratorio de 1920 en azul y ámbar, calendario del 14 de noviembre, camas de hospital, jeringa, frasco de insulina, báscula, gráfico del azúcar en sangre, medalla Nobel, patente con moneda de un dólar y globo con puntos; línea de tiempo (antes · 1921 · ene 1922 · 1923 · hoy). Color: azul = diabetes · ámbar = insulina · verde = mejoría.
**Gancho de actualidad:** el **sábado 14 de noviembre de 2026** es el **Día Mundial de la Diabetes**, fecha elegida por el cumpleaños de Frederick Banting (nació el 14 nov 1891: cumpliría 135 años; 2026 − 1891 = 135). Lo crearon la Federación Internacional de Diabetes y la OMS en 1991; la ONU lo oficializó en 2006.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-insulina.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-insulina.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-06-insulina-un-dolar/`. Código: `src/viral/piezas/in-kit.tsx`, `in1.tsx` y `in2.tsx` (reusa `Persona` de `an-kit.tsx`); datos y tiempos en `src/anim/piezas.ts` (`INS`, `TIN`, `librasAKg`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-06-insulina-un-dolar/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/insulina-un-dolar.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos usan el ritmo real de cada escena.
| Sonido | Cuándo | Cómo |
|---|---|---|
| Colchón | 0–66 s | acordes suaves en La menor, Fa, Re menor (la primera inyección falla), Do mayor (funciona), Sol y Re mayor (alivio) |
| Latido | escenas 2, 5 y 8 | débil y lento en la sala del hospital; fuerte y firme cuando el niño mejora y al final |
| Gancho | escena 1 | tics del contador de 135 años, campana del Día Mundial y moneda de un dólar |
| Hambre | escena 2 | respiración lenta, golpe grave y choque de cubiertos contra el plato |
| Laboratorio | escena 3 | vidrio, burbujeo del extracto y barrido descendente del azúcar |
| Inyecciones | escenas 4–5 | pitidos de la báscula, jeringa, golpe y disonancia del fallo, burbujeo que aclara el extracto y campanas del éxito |
| Nobel y patente | escenas 6–7 | campanas de la medalla, monedas y pops de los frascos |
| Mundo | escena 8 | pings del mundo que se enciende y acorde de alivio |
Sin voz, el nivel total es ≈ −27 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `ins-gancho` | «Banting cumpliría ciento treinta y cinco años este sábado: su cumpleaños es el Día Mundial de la Diabetes. Vendió su patente por un dólar.» | Banting nació el 14 nov 1891; Día Mundial de la Diabetes: 14 nov, FID y OMS 1991, ONU 2006; patente cedida a la Univ. de Toronto por 1 $ (documento de la universidad) | Calendario, retrato, círculo azul y moneda de $1 |
| 2 | `ins-hambre` | «Antes de la insulina, la diabetes tipo uno era mortal, y el tratamiento era una dieta de hambre.» | Dieta de hambre de Frederick Allen (≈ 1915–1922); en niños podía frenar el crecimiento | Sala con niños en cama y un plato casi vacío |
| 3 | `ins-perros` | «En Toronto, en mil novecientos veintiuno, Frederick Banting y el estudiante Charles Best probaron un extracto de páncreas en perros.» | Laboratorio de John Macleod, Toronto, 1921 | Banting y Best, frasco «páncreas», perro y gráfico que baja |
| 4 | `ins-primera` | «El once de enero de mil novecientos veintidós, un niño de veintinueve kilos recibió la primera inyección. Apenas funcionó.» | Leonard Thompson, Hospital General de Toronto, ≈ 65 lb ≈ 29 kg (la edad varía: 13 o 14 años); extracto impuro, poco efecto y reacción alérgica | Cama, báscula, jeringa y ✗ |
| 5 | `ins-segunda` | «James Collip purificó el extracto. El veintitrés de enero lo inyectaron de nuevo y, en un día, los síntomas casi desaparecieron.» | 23 ene 1922 (12 días después); síntomas casi desaparecieron en 24 h (Univ. de Toronto; fuentes secundarias; el Globe and Mail da otra fecha) | Collip, frasco que se aclara, reloj de 24 h y niño que mejora |
| 6 | `ins-nobel` | «En mil novecientos veintitrés, Banting y Macleod recibieron el Nobel y compartieron el dinero con Best y Collip.» | Nobel de Fisiología o Medicina 1923; Banting dio la mitad a Best y Macleod la mitad a Collip | Medalla y tarjetas con flechas ½ |
| 7 | `ins-patente` | «La patente se vendió a la Universidad de Toronto por un dólar, para que la insulina pudiera fabricarse sin trabas.» | Cesión de derechos por 1 $ (las fuentes difieren: 1 $ total o 1 $ cada uno) | Documento, moneda y frascos que se multiplican |
| 8 | `ins-hoy` | «Hoy millones de personas con diabetes usan insulina, y cada catorce de noviembre se recuerda esta historia.» | Día Mundial de la Diabetes | Globo con puntos (esquemático), calendario y círculo azul |
| 9 | `CTA` | «Compártelo con quien ame la historia de la medicina. Síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Dibujos esquemáticos, no son imágenes de la época.** Las figuras son siluetas genéricas; el globo y sus puntos no son datos reales.
- **La frase «la insulina no me pertenece, pertenece al mundo»** suele atribuirse a Banting y **no está comprobada** (verificadores de datos no la encuentran): el video **no la usa**.
- **Edad de Leonard Thompson:** 13 o 14 años según la fuente; por eso el video solo dice su peso (≈ 29 kg) y lo aclara en la fuente.
- **Segunda dosis:** la mayoría de fuentes dan el 23 ene 1922; el Globe and Mail da otra fecha. Se usa el 23 por consenso.
- **Antes de la insulina:** no se afirma cuánto vivían los pacientes (no encontré una fuente médica sólida); «mortal» describe la diabetes tipo 1 sin tratamiento.
- **Patente:** 1 $ por los derechos cedidos a la Universidad de Toronto; las fuentes difieren en si fue 1 $ total o 1 $ para cada uno de los tres.
- **No es consejo médico ni invita a cambiar tratamientos;** la insulina se usa bajo indicación médica y este video habla de diabetes tipo 1 en su origen histórico (no insinúa que la tipo 2 se trate igual).
- **Respeto a las personas con diabetes:** sin culpa ni burla; el foco es el logro científico.
- **No pude abrir** los artículos originales (Banting y Best, University of Toronto, Michael Bliss): trabajé con resúmenes de búsqueda. Confirma fechas y cifras antes de usarlas en un trabajo.
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-insulina.txt`. Sin voz el audio sale a ≈ −27 LUFS: no lo publiques así.
