# La cena en que tres médicos se durmieron · guion técnico (SINAPSIS, 9:16, ≈ 62 s)

**Serie:** historia de la medicina en SINAPSIS · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** salón victoriano a la luz de las velas, mesa con tres comensales, frascos de vidrio, cronómetro de bolsillo, anfiteatro quirúrgico, calendario y monitor moderno; línea de tiempo (antes · oct 1846 · nov 1847 · abr 1853 · hoy). Color: ámbar = velas · verde agua = cloroformo · oro = fechas.
**Gancho de actualidad:** el **4 de noviembre de 2026** se cumplen **179 años** de la noche de 1847 en que James Young Simpson y dos ayudantes probaron el cloroformo en su casa de Edimburgo (2026 − 1847 = 179).
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-anestesia.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-anestesia.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-04-cena-cloroformo/`. Código: `src/viral/piezas/an-kit.tsx`, `an1.tsx` y `an2.tsx`; datos y tiempos en `src/anim/piezas.ts` (`ANE`, `TAN`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-04-cena-cloroformo/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/cena-cloroformo.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos usan el ritmo real de cada escena.
| Sonido | Cuándo | Cómo |
|---|---|---|
| Colchón | 0–66 s | acordes suaves en Re menor, Si bemol, Sol menor y Fa que se abren a Re mayor en la anestesia moderna |
| Velas | toda la pista | crepitar suave de llamas y madera |
| Contador y golpes | escena 1 | tics del 179, golpes sordos al desplomarse los tres y campana de «a propósito» |
| Cronómetro | escena 2 | tictac que acelera, golpe grave de la amputación y cuenta de los 30 s |
| Anfiteatro | escena 3 | murmullo de público, campanas del éter, chasquido de vidrio, disonancia breve y siseo del olor |
| Frascos | escena 4 | choque de vidrio y golpecito grave por cada sustancia descartada; burbujeo y destello del cloroformo |
| Noche | escena 5 | respiraciones, murmullo de charla, golpes sordos y silencio grave |
| Despertar y reina | escenas 6–7 | campana de la idea, tics del calendario, nana de campanitas, órgano grave y fanfarria suave |
| Cierre | escena 8 | golpe del sello, barrido del camino y pitidos del monitor a 75 lpm |
Sin voz, el nivel total es ≈ −27 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `an-gancho` | «Un cuatro de noviembre, hace ciento setenta y nueve años, tres médicos se desmayaron en una cena. Y fue a propósito.» | 4 nov 1847, Edimburgo, casa de Simpson (52 Queen Street) con George Keith y J. Matthews Duncan (Scotsman; Universidad de Edimburgo; Scottish Medical Timeline) | Salón con tres médicos que se desploman y contador de 179 años |
| 2 | `an-carrera` | «Antes de la anestesia operar era una carrera: el cirujano Robert Liston, según se cuenta, amputaba una pierna en unos treinta segundos.» | Liston: las fuentes dan 25, 28 o ≈ 30 s (relato de la época) | Paciente despierto, público y cronómetro de bolsillo |
| 3 | `an-eter` | «En octubre de mil ochocientos cuarenta y seis, el éter funcionó en un hospital de Boston. Pero irritaba y olía muy fuerte.» | 16 oct 1846, Massachusetts General Hospital: Morton administra éter y Warren opera a Edward Gilbert Abbott | Anfiteatro con inhalador de vidrio, ✓, líneas de irritación y olor |
| 4 | `an-busca` | «En Edimburgo, el obstetra James Simpson buscaba algo mejor, y probaba sustancias con sus ayudantes.» | Simpson probó varias sustancias con Keith y Duncan | Mesa con frascos «?» que se descartan y el cloroformo que brilla |
| 5 | `an-noche` | «Aquella noche inhalaron cloroformo en el comedor, empezaron a conversar animados y todos perdieron el conocimiento.» | Relato más difundido (Scotsman, Universidad de Edimburgo); carta de Simpson del 3 dic 1847; **hay detalles embellecidos** | Los tres inhalan, conversan y se desploman |
| 6 | `an-despierta` | «Al despertar, Simpson comprendió que tenía lo que buscaba. Pocos días después ya lo usaba en partos.» | Primer uso obstétrico: las fuentes dan 8 o 11 nov 1847 (por eso «pocos días») | Simpson despierta, bombilla, calendario de noviembre y parto |
| 7 | `an-reina` | «Algunos lo criticaron por religión, pero en mil ochocientos cincuenta y tres lo usó hasta la reina Victoria, en su parto.» | 7 abr 1853, nacimiento del príncipe Leopoldo, cloroformo administrado por John Snow; diario de la reina: «that blessed chloroform»; Simpson respondió con el «sueño profundo» de Adán (Génesis) | Vitral, flecha, corona y cita del diario |
| 8 | `an-cierre` | «El cloroformo ya no se usa, pero esa cena abrió el camino de la anestesia moderna.» | Se abandonó por su estrecho margen de seguridad y el riesgo cardíaco (Chemistry World; general-anaesthesia.com) | Sello «ya no se usa», camino 1846 → hoy y monitor |
| 9 | `CTA` | «Compártelo con alguien que estudie salud. Síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Dibujos esquemáticos, no son imágenes de la época.** Las personas son siluetas genéricas; no se pretende retratar a nadie.
- **La cena tiene versiones:** los detalles de la noche (quién estaba, qué hicieron) son el relato más difundido y se han embellecido con los años; es muy probable que Simpson ya hubiera probado el cloroformo antes. Por eso el video dice «según el relato más difundido» en pantalla.
- **Liston:** el tiempo de la amputación se repite con variaciones (25, 28 o ≈ 30 s) y es una anécdota; sale «según se cuenta».
- **Primer parto con cloroformo:** las fuentes dan fechas distintas (8 o 11 nov 1847); el video dice solo «pocos días después».
- **El éter y la cita de Warren** («this is no humbug») varían según la fuente: no se cita.
- **Reina Victoria:** la cita del diario está traducida; algunas fuentes cuentan a Leopoldo como el séptimo hijo y otras como el octavo: no se dice el orden.
- **El cloroformo ya no se usa**; el video **no invita a probar ni inhalar ninguna sustancia** y no es consejo médico.
- **No pude abrir** los artículos originales (carta de Simpson, Lancet, diario de la reina): trabajé con resúmenes de búsqueda. Confirma fechas antes de usarlas en un trabajo.
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-anestesia.txt`. Sin voz el audio sale a ≈ −27 LUFS: no lo publiques así.
