# Entrega · «El ascensor espacial» (IMNOBA · serie ingeniería extrema · plano secuencia vertical)

**Pedido:** video gracioso y completamente diferente sobre el ascensor espacial según los estudios de la NASA (NIAC, Bradley C. Edwards) y el concepto de Obayashi: plano secuencia vertical continuo desde una plataforma oceánica en el ecuador hasta un contrapeso más allá de la órbita geoestacionaria, con zoom out de la red hexagonal de carbono a la curvatura de la Tierra, física de fuerzas con vectores, trepador con láser, tormenta, Van Allen y el verdadero cuello de botella (los nanotubos sin defectos) · puente con IMNOBA · paleta de marca dorado **#fdc300** y azul marino **#0f1c46** · objetivo: que lo vean completo, lo **guarden y compartan** y que **sigan a IMNOBA**.

## 1 · Video final
`trabajo/archivo/2026-11-18-ascensor-espacial/video-final.mp4` (1080×1920 · 60 fps · H.264 + AAC · 117 s · 35 MB · **sin voz**; audio nivelado a ≈ −16 LUFS, pico −1,5 dBFS: solo música y sonidos). Copia ligera de revisión en esta carpeta (`revision.mp4`). Pistas en `trabajo/archivo/2026-11-18-ascensor-espacial/stems/` (`musica-y-efectos-normalizado.wav` para escuchar y `musica-y-efectos.wav` para reeditar con voz).

## 2 · Guion final (locución descriptiva, ≈ 244 palabras, ajustada a «Lively DJ» de CapCut)
1. Un cohete quema toneladas de combustible solo para vencer la gravedad. ¿Y si subiéramos en ascensor?
2. Todo empieza en lo diminuto: átomos de carbono en red hexagonal, enrollados en nanotubos más fuertes que el acero.
3. El cable sería una cinta plana: ancha como una puerta, más fina que una hoja de papel y larguísima.
4. Todo se ancla a una plataforma oceánica móvil sobre el ecuador, en aguas tranquilas, lejos de los huracanes.
5. Por la cinta trepa un robot. Un láser desde tierra le envía energía, y sus paneles la convierten en movimiento.
6. Primero atraviesa nubes de tormenta y sube hasta la estratosfera, donde el cielo ya se vuelve oscuro.
7. Más arriba cruza los cinturones de Van Allen, zonas de radiación peligrosas para las personas y la electrónica.
8. Abajo manda la gravedad; arriba, la rotación de la Tierra. A treinta y seis mil kilómetros, se equilibran.
9. Un contrapeso, como la piedra de una honda, mantiene tensa la cinta, a unos noventa y seis mil kilómetros.
10. El viaje es lento: a doscientos kilómetros por hora, llegar a la estación toma una semana.
11. Con acero no se podría: el cable se rompería por su propio peso mucho antes de llegar arriba.
12. El obstáculo real: hoy hacemos nanotubos de centímetros, y un defecto los debilita. Faltan miles de kilómetros sin fallos.
13. Hasta esta obra verifica sus materiales antes de empezar. En IMNOBA igual: bases reales, sin promesas en el aire.
14. Guárdalo y síguenos en IMNOBA: propiedades y vehículos.

Guion técnico con precauciones: `ejemplos/animacion-viral/guion-tecnico-ascensor-espacial.md`.

## 3 · Ganchos
- A) «Un cohete quema toneladas de combustible solo para vencer la gravedad. ¿Y si subiéramos en ascensor?» ← **elegido**: arranca con un gag visual (el cohete se queda sin combustible, hace «¡PFFF!» y cae mientras un robot sube tranquilo con su «ding») y plantea la pregunta.
- B) «Hay un plano para subir al espacio en ascensor. Solo falta un material.»
- C) «Un cable de 100.000 km más fino que el papel: ¿por qué no existe aún?»

## 4 · Texto para publicar
¿Y si en vez de volar al espacio subiéramos en ascensor? 🚀🛗 Los estudios de la NASA y de Obayashi imaginan una cinta anclada en el ecuador que la rotación de la Tierra mantiene tensa, con un robot que trepa con energía láser. La física orbital es sólida; lo que falta es el material: nanotubos de carbono sin defectos y larguísimos. 🔬 Hasta la obra más ambiciosa verifica sus materiales antes de empezar; en IMNOBA, igual: bases reales, sin promesas en el aire. Guárdalo y síguenos: propiedades y vehículos.
#ascensorespacial #NASA #ingenieria #espacio #imnoba

## 5 · Nota
Espero que lo vean completo por lo épico y lo gracioso (el cohete sin combustible, el robot con carita, el «¿ya llegamos?») y que lo guarden y compartan. Métrica: retención a los 3 s, en el segundo 8 (el zoom a los átomos) y en el 86 (el cable de acero que hace «¡pling!»), y guardados por cada 1.000 alcanzados.

## 6 · Registro
Registrado en el Panel de Videos con estado «grabado» y serie «ingeniería extrema» (`registro.json`, `miniatura.jpg` y `revision.mp4` en esta carpeta).

## Música y sonidos
`videos/2026-11-18-ascensor-espacial/componer-musica.mjs`: épica cinematográfica espacial en re menor a 84 bpm (dron grave, cuerdas, coro, arpegio de órgano, timbales y cornos), música de ascensor con vibráfono en el viaje y resolución en re mayor con fanfarria. Más de 28 sonidos distintos: rugido del cohete, «pfff», silbato de émbolo, campanas de cristal de los átomos, olas, bocina y gaviota, láser y motor, trueno y lluvia, contador geiger y aurora, latido de la gravedad, remolino centrífugo, honda que gira, barajar cartas, acople de la estación, quejido del metal y «pling», clic de pinza y «crac», sello y fanfarria.

## Lo que conviene saber (dicho con claridad)
- **Sin voz:** no hay `OPENAI_API_KEY`. El guion es descriptivo y está ajustado a «Lively DJ» de CapCut (≈ 2,3 palabras por segundo). Genera la voz escena por escena y pega con `npm run capcut -- --escenas=carpeta`, o una sola pista con `--audio=`.
- **«La física está 100 % comprobada» se matiza:** la mecánica orbital del concepto es sólida, pero hay problemas abiertos (oscilaciones, basura espacial, radiación, tormentas, energía y, sobre todo, el material). La voz no dice «comprobada».
- **Cifras que no coinciden entre fuentes:** cinta de ≈ 100.000 km (Edwards) y extremo a ≈ 96.000 km (Obayashi; algunas fuentes lo dan como altura del cable y otras como la distancia del contrapeso); ≈ 200 km/h y ≈ 7,5 días (Obayashi, 2012) o «una semana» (Edwards), con una fuente que da ≈ 125 mph.
- **«Más fina que un cabello» no se afirma:** las fuentes dicen «más fina que una hoja de papel» (ancho ≈ 1 m).
- **Nanotubos de laboratorio:** «de centímetros» en la voz; los récords citados van de decenas de centímetros a ≈ 0,5–0,7 m; en 2012 Obayashi decía que solo lograban ≈ 3 cm. El grafeno monocristalino de gran tamaño no lo afirmo con cifras (no encontré fuente).
- **Es un concepto, no existe:** Obayashi apuntaba a 2050 y dijo no poder calcular el costo; no prometo fecha.
- **El puente con IMNOBA** es una analogía (verificar materiales y bases antes de empezar): no promete ganancia, valorización ni rendimiento, ni es asesoría de inversión.
- **Esquemas:** todo está fuera de escala y simplificado; el robot con carita, las gafas, la gaviota y el «¡pling!» son humor.
- **Duración 117 s** (la norma es 20–35 s «salvo que el pedido diga otra»; el pedido pide explicar todo). **No pude abrir Wikipedia ni los informes completos** (usé resúmenes de búsqueda: NASA NIAC 2003, The Space Review, NSS, Japan Times, IEEE Spectrum, Gizmodo). Contrasta antes de publicar.
- **Render:** se cortó a mitad por un reinicio del entorno y lo reanudé; el resultado no cambia.
