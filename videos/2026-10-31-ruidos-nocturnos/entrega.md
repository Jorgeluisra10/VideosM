# Entrega · «La física de los ruidos nocturnos» (SINAPSIS · serie física cotidiana en SINAPSIS)

**Elegí:** marca SINAPSIS · paleta `medicina` (con la paleta de laboratorio del pedido dentro de las piezas) · serie `fisica_cotidiana` (nueva en el panel: «Física cotidiana en SINAPSIS») · gancho «A las tres y catorce, un paso en el pasillo. ¿Demonio? No: física.»

## 1 · Video final
`trabajo/archivo/2026-10-31-ruidos-nocturnos/video-final.mp4` (1080×1920 · 60 fps · H.264 (master CRF 17) · AAC · 51,3 s · **sin voz**: solo música y efectos). Pista de música y efectos sola: `trabajo/archivo/2026-10-31-ruidos-nocturnos/stems/musica-y-efectos.wav`. Copia ligera de revisión en esta carpeta (`revision.mp4`).
**Música propia** (no hay pistas libres en `assets/musica/`): la compuse por síntesis con `videos/2026-10-31-ruidos-nocturnos/componer-musica.mjs` (se puede regenerar; libre de derechos). Drones y ecos de terror hasta el segundo 28,9; **corte brusco** (fundido de 5 ms) justo cuando entra el papel; después, zumbido de red de 60 Hz, clics de laboratorio y bips de 1 kHz; al final vuelve un swell grave con latido. Medido en el MP4: la música cae de ≈ 0,023 a ≈ 0,003 de RMS (≈ −18 dB) en el corte; los efectos del motor (un clic a los 28,92 s y un tick a los 29,1 s) quedan en el silencio como «clics de laboratorio».

## 2 · Guion final (locución)
1. A las tres y catorce, un paso en el pasillo. ¿Demonio? No: física.
2. De día el sol calienta tu casa y todo se expande, en silencio.
3. De noche la temperatura cae y todo se encoge, pero no por igual.
4. Aluminio, acero y madera se contraen distinto, y la madera varía hasta diez veces según su fibra.
5. La fricción frena el movimiento y acumula tensión, hasta que resbala de golpe. Ese salto es el crujido.
6. Tu cerebro oye un asesino. La física oye un cajón enfriándose dos grados.
7. El culpable: fricción estática mayor que cinética. Un fallo de diseño, no un fantasma.
8. Si te acercas, no hay espíritus: solo fibras de madera raspando metal. ¿Qué más está por crujir?
9. Guárdalo para tu próxima noche en vela y síguenos en Sinapsis.

**Dirección de voz:** escenas 1–5 en susurro tenso y lento; **desde la 6 (28,9 s) tono seco y clínico**, como informe de laboratorio (ahí está el humor); escena 8 otra vez baja y lenta. Detalle en `ejemplos/animacion-viral/locucion-ruidos.txt`. Guion técnico con fuentes y precauciones: `ejemplos/animacion-viral/guion-tecnico-ruidos.md`.

## 3 · Ganchos
- A) «A las tres y catorce, un paso en el pasillo. ¿Demonio? No: física.» ← **elegido** (versión corta del «histórico/viral»): abre con terror y promete la vuelta de tuerca; sin «estafado por un placard», que no se puede afirmar.
- B) «Tu casa se encoge de noche, y no todo se encoge igual.» (del «supervivencia» y del «neurociencia/física», sin «el silencio no existe» ni «latigazos acústicos a tu sistema de alerta»).
- C) «Todo el terror paranormal cabe en una tabla de coeficientes.» (del «neurociencia/física»).

## 4 · Texto para publicar
A las 3:14 oyes un paso en el pasillo 👻… y la física te lo explica: de noche tu casa se enfría y todo se encoge, pero el aluminio, el acero, el hormigón y la madera se contraen a ritmos distintos. Cuando la fricción cede de golpe, ¡crac! Guárdalo para tu próxima noche en vela y síguenos en Sinapsis. (Información educativa; los gráficos son esquemas y la escena inicial es una dramatización.)
#fisica #termodinamica #acustica #curiosidades #sinapsis

## 5 · Nota
Espero que el público lo comparta por el giro de terror a humor seco (el corte a papel en el segundo 29) y por entender por qué cruje su casa de noche. Métrica: compartidos y guardados por cada 1.000 alcanzados, y retención al pasar el corte a modo claro (≈ 29 s).

## 6 · Registro
Registrado en el Panel de Videos con estado «grabado» y serie «Física cotidiana en SINAPSIS» (`videos/2026-10-31-ruidos-nocturnos/registro.json`: tu panel lo trae solo al hacer git pull).

## Lo que cambié del pedido y lo que no se pudo cumplir (dicho con claridad)
- **«Las ondas son idénticas»:** no lo afirmo. No existe esa medición. El osciloscopio es **esquemático** («no son grabaciones») y la nota dice «igual de brusco, no de fuerte: el paso es mucho más intenso». Lo único que se compara es el arranque brusco con decaimiento.
- **«Demonio ancestral», «estafado por un placard de melamina», «el silencio nocturno no existe» y «latigazos acústicos a tu sistema de alerta»:** no se usan (sin base o exagerados). La escena inicial se rotula «dramatización».
- **Acero «inamovible»:** el acero **también** se contrae (α ≈ 12); la pantalla dice «casi fijo» en sentido relativo. El α de los tableros de melamina/MDF **no lo verifiqué**, así que los nodos «MELAMINA» son una **analogía** y no llevan valor. El «fallo de diseño» es una licencia de humor.
- **Stick-slip como causa de los crujidos:** las fuentes de divulgación que encontré (de calidad mixta) hablan de contracción térmica, materiales que se contraen distinto y roce en fijaciones; el término «stick-slip» no aparece en ellas. Es la explicación física estándar de ese roce, pero aquí es una **inferencia**. Los crujidos dependen también de la **humedad** de la madera.
- **Coeficientes α:** valores típicos que varían según fuente, aleación y especie (hormigón 10–14; madera 3–5 a lo largo y 30–70 a lo ancho). **No leí tablas completas**; trabajé con resúmenes de EngineeringToolbox y Misumi. «Hasta diez veces» es conservador.
- **Cálculos del video:** ΔL = α·L·ΔT: 1 m de aluminio con +15 °C → +0,34 mm; con −18 °C → −0,41 mm; un tablero de 0,5 m a lo ancho de la fibra con −2 °C → ≈ 30 µm. 343 m/s a 20 °C (a 5 m, ≈ 15 ms).
- **No es una guía de seguridad:** no todos los ruidos nocturnos son inofensivos; el último fotograma avisa que grietas nuevas o puertas que no cierran las debe revisar un profesional.
- **«Cero ilustraciones literales»:** cumplido. Todo es señal, malla isométrica, columnas, nodos, osciloscopio y celdas; el «punto rojo que late» cierra el video. El zoom final es una **ilustración** (las células de la madera real no tienen esa forma).
- **Sin voz:** no hay `OPENAI_API_KEY`. Sin voz el audio sale a ≈ −30 LUFS: **no lo publiques así**; ponle voz desde el Estudio → «Voz en off» (idealmente con el cambio de tono de la escena 6). **Subtítulos palabra por palabra:** no existen; el texto grande de cada escena los reemplaza. **Fotos:** no se usaron.
- **Duración 51,3 s:** sobre los 35 s habituales; el pedido daba libertad de duración. **60 fps** en lugar de 30. **Zona segura:** el botón del cierre toca el borde del 20 % inferior (plantilla fija del motor). La pista de música se ajusta al nivel de la mezcla del motor (≈ −24 dB bajo la voz): el contraste terror/clínico se nota más en la pista sola y al subir el volumen.
- **Estructura:** «Demonio térmico» = escenas 2–3 (con los tres potenciómetros: temperatura, humedad y expansión, que es el **resultado**); «Hacker de la acústica» = escenas 4–5 (Rayos X); «Remate del MDF» = escenas 6–7 (papel, osciloscopio y caja de datos); «Vista al microscopio» = escena 8.

## Audio extra (pedido después): «fantasmal y gracioso»
Un solo archivo, alineado al video: `trabajo/archivo/2026-10-31-ruidos-nocturnos/audio-fantasmal-comico.wav` (51,3 s · estéreo · 48 kHz · 16 bits). Lo genera `videos/2026-10-31-ruidos-nocturnos/componer-audio-fantasmal.mjs` (todo sintetizado, sin muestras ni licencias). Lleva crujidos de madera, pasos, campanadas, un chasquido, gemidos de fantasma, un grito de dibujos animados, cadenas, susurros y viento, y una música de fantasma divertida (theremin tembloroso, pizzicato «de puntillas», caja de música, clavicordio, fagot, «ba-dum-tss» y trombón triste). Los golpes caen en los eventos visuales: 2,5 s (pico), 26,35 s (salto de la fricción), 28,9 s (**corte brusco**, 0,35 s de silencio total), 32,3 s («¡igual de seco!»), 37,8 s (sello) y 44,5 s (colapso del zoom). Los gags de voz caen en el momento **aproximado** de cada palabra (el video aún no lleva voz): al poner la voz pueden desplazarse unas décimas.
