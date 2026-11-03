# «El laboratorio bacteriano bajo tu terreno» · guion técnico (IMNOBA, 9:16, ≈ 81 s)

**Marca:** IMNOBA · paleta `imnoba` · **Serie:** ingeniería extrema · **Estilo:** corte transversal en plano continuo hecho con formas geométricas simples (rombos, cuadros, triángulos y hexágonos), fondo azul marino y violeta, dorado de IMNOBA; música psicodélica propia.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-laboratorio-septico.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-laboratorio-septico.json --paleta=imnoba`. Carpeta de trabajo: `videos/2026-11-03-laboratorio-septico/`. Código: `src/viral/piezas/sep-kit.tsx` (`Mundo`, `Cielo`, `Bicho`, `camT`, `proy`, `est`), `sep1.tsx`, `sep2.tsx`; datos y tiempos en `src/anim/piezas.ts` (`SEP`, `TSE`).
**Música y sonidos:** `videos/2026-11-03-laboratorio-septico/componer-musica.mjs` → `assets/musica/laboratorio-septico-psicodelica.wav` → `node scripts/anim/musica.mjs --usar=assets/musica/laboratorio-septico-psicodelica.wav` (y `--restaurar` al terminar; el WAV no va a git).

## Análisis del video de referencia (lo que se copió y lo que no)
Video vertical de ≈ 121 s, 1080×1920 a 60 fps, sobre un tema doméstico («el tubo que sale del boiler y sube más alto que el tinaco»). **No se pudo transcribir su audio** (no hay herramienta de voz a texto en este entorno): la narrativa se dedujo de los fotogramas, de los rótulos y del título del archivo.
- **Estructura narrativa:** arranca con un objeto cotidiano (una llave de agua), construye el sistema pieza por pieza y encadena **problema → componente → nuevo problema** («se desborda → el flotador → se quema la bomba → un flotador eléctrico → …»), hasta la revelación que contesta el título. Cada ≈ 3–5 s cambia el plano o aparece un componente.
- **Representación gráfica:** un **mismo dibujo en corte transversal** (casa, tierra, tanque) sobre fondo azul noche; el plano se acerca a un detalle y vuelve a abrirse (cámara continua, sin cortes duros entre dibujos distintos); agua azul eléctrico con puntos que fluyen por los tubos, agua caliente en rojo, cableado en verde, objetos grises y blancos planos; el estado cambia de color cuando algo falla (rojo y humo para «se quema»).
- **Rótulos:** una a tres palabras en mayúscula, arriba y centradas, que cambian con la locución («SE DESBORDA», «EL FLOTADOR», «SE QUEMA» en rojo); textura de grano y marca de agua del editor (que **no** se copió).
- **Qué se tomó:** el corte transversal continuo, la cámara que viaja entre detalles, la cadena problema → componente → nuevo problema (pozo ciego → cámaras → ventilación → grava → tierra → mantenimiento), los rótulos cortos en mayúscula con color por significado y el flujo de puntos en los tubos. **Qué se cambió:** la imagen se arma con formas geométricas (rombos, cuadros y triángulos), la paleta es la de IMNOBA con acentos magenta y cian, hay bacterias de caricatura y la música es psicodélica.

## Diseño sonoro (distinto en cada escena; más de 40 sonidos)
| Escena | Sonidos propios |
|---|---|
| 1 · gancho | caída al subsuelo (rumor con barrido) · crujido de tierra al cruzar los estratos · «ping» de sonar · burbujas |
| 2 · pozo | goteo · «glub» grave del agua sucia · hilo de agua que se filtra · bocina que se desinfla (olor) · alarma al llegar a la napa · «dun» grave |
| 3 · idea | golpes de hormigón · raspado de llana · tres campanas de marimba (etapas) |
| 4 · decantación | «plop» descendente · «bloop» ascendente · remolino que se asienta |
| 5 · bacterias | chillidos · mordiscos · burbujas de gas · «pfff» de la ventilación |
| 6 · cámara 2 | agua por la abertura · campanitas suaves |
| 7 · olores | «gloc» de la trampa · silbido del viento en el tubo de ventilación |
| 8 · grava | lluvia de piedras y traqueteo · goteo del tubo perforado · chillidos agudos de bacterias aerobias |
| 9 · suelo | gotas que bajan de tono · «ping» de sonar en la napa · acorde brillante y campana del pozo limpio |
| 10 · mantenimiento | motor del camión · aspiración · dos zumbidos de «prohibido» |
| 11 · lote | martillazo del letrero · tres «tics» de la lista · destello final |
| 12 · cierre | marimba y sitar en arpegio ascendente |
Cama musical: tanpura, sitar, pad con phaser, bajo «wub», tabla, arpegiador burbujeante con filtro (96 bpm, fa♯ frigia dominante, ecos y reverberación); inquietud (pozo) → groove (cámaras) → calma → ascenso (grava y tierra) → pausa tensa (mantenimiento) → cierre.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `sep-gancho` | «Bajo un terreno aislado hay un laboratorio secreto, y lo operan millones de bacterias.» | Idea general (las bacterias del tanque son millones) | Corte del terreno: la cámara baja desde la casa hasta el tanque, la grava y la napa |
| 2 | `sep-pozo` | «Pero un pozo cavado sin más es una bomba de tiempo. El agua sucia se filtra, huele y puede llegar a la napa.» | Un pozo ciego recibe el agua sin tratamiento previo y puede contaminar la napa (manuales y estudios regionales) | Pozo sin paredes, olores verdes, mancha que baja a la napa y viaja hasta un pozo de agua |
| 3 | `sep-idea` | «La solución no es taparlo: es convertirlo en una planta de tratamiento con tres etapas.» | Sistema séptico con infiltración | Las paredes de hormigón se arman con cuadros; chips 1 · 2 · 3 |
| 4 | `sep-decanta` | «Primera etapa, la cámara de decantación: lo pesado se hunde, la grasa flota y en el medio queda el agua más clara.» | El tanque separa sólidos (lodo), grasas (nata) y agua (EPA, resúmenes) | Capas: nata arriba, agua en medio, lodo abajo |
| 5 | `sep-bacterias` | «Abajo no hay oxígeno, y eso les encanta a las bacterias anaerobias: se comen parte de los sólidos y sueltan gas.» | Digestión anaerobia parcial de los sólidos con producción de gas | Bacterias de caricatura en el lodo y burbujas hexagonales |
| 6 | `sep-camara2` | «El agua pasa a una segunda cámara, más tranquila, donde terminan de asentarse las partículas.» | Tanques de dos cámaras | Paso por la abertura y segunda cámara con agua más clara |
| 7 | `sep-olores` | «Un tubo de ventilación saca el gas, y una trampa de agua evita los olores.» | Sifón y ventilación | Trampa en U bajo el inodoro y tubo de ventilación sobre el techo |
| 8 | `sep-grava` | «Segunda etapa: el agua sale a un lecho de grava, donde otras bacterias siguen limpiándola.» | El tanque solo da un tratamiento parcial; el campo de infiltración termina el tratamiento biológico (EPA) | Zanja de piedras con tubo perforado y bacterias verdes |
| 9 | `sep-suelo` | «Tercera etapa: la tierra termina el trabajo y el agua llega a la napa mucho más limpia.» | El suelo sigue tratando el agua; «mucho más limpia», no «limpia» | Gotas que cambian de marrón a azul, napa y pozo de agua limpio |
| 10 | `sep-mant` | «Eso sí, no es magia: hay que vaciar los lodos cada tres a cinco años y no echar cloro ni aceite.» | Vaciar cada 3 a 5 años para una familia (EPA, según resúmenes); depende del tamaño y el uso | Camión que aspira el lodo; iconos de prohibido (cloro y aceite) |
| 11 | `sep-lote` | «Si vas a comprar un terreno sin alcantarillado, pregunta cómo trata sus aguas y revisa la norma de tu zona.» | Información general, no asesoría | Sistema completo, letrero «se vende» y lista de tres puntos |
| 12 | `CTA` | «Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos.» | — | Cierre con el logo de IMNOBA |

## Precauciones antes de publicar (lo que NO se afirma o se matiza)
- **«Agua limpia» y «sin contaminación de napas»:** NO se afirman sin condiciones. El tanque solo da un tratamiento parcial; el lecho de infiltración y el suelo terminan el trabajo, y el resultado depende del diseño, de la distancia a la napa y a los pozos, del tipo de suelo y del mantenimiento. El video dice «mucho más limpia», rotula «no elimina todo» y recomienda revisar la norma local.
- **Distancias y normas:** los manuales de biodigestores coinciden en ≈ 30 m a los pozos de agua, pero la norma local puede exigir más; el video NO da cifras de distancia (dice «distancia a la napa y a pozos»).
- **Pozo ciego vs sistema séptico:** el pozo ciego sin tratamiento previo es el riesgo; cámaras defectuosas o agrietadas también pueden contaminar. El video no dice que el sistema sea infalible.
- **«Millones de bacterias»:** es una cifra cualitativa; las bacterias de caricatura no representan especies reales.
- **Gas:** el gas que sale por la ventilación es una mezcla (incluye metano); no se da composición.
- **Vaciado cada 3 a 5 años:** es lo habitual para una familia según resúmenes de la EPA (no se pudo abrir la página original); depende del tamaño del tanque y del uso.
- **Imágenes:** son figuras geométricas dibujadas a partir de cómo se ven los cortes de un sistema séptico; **no son fotos** (no se pudieron descargar imágenes reales). Las proporciones y las distancias no están a escala.
- **Sin asesoría:** el cierre es información general; no es asesoría técnica ni legal, no promete ganancia ni rentabilidad.

## Fuentes (búsqueda web, sesión del 3-nov-2026; solo resúmenes de búsqueda)
- EPA, «How your septic system works»: separación de lodo, grasa y agua; tratamiento parcial en el tanque y final en el campo de infiltración; vaciado cada 3–5 años como regla habitual.
- Manuales de biodigestores y fosas sépticas (Latinoamérica), estudios regionales y notas de prensa: pozo ciego sin tratamiento y contaminación de napas; zanja filtrante con grava; distancia habitual de 30 m a pozos de agua (no usada en el video).
