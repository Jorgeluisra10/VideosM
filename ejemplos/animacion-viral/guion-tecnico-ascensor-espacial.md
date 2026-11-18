# «El ascensor espacial» · guion técnico (IMNOBA, 9:16, ≈ 117 s)

**Marca:** IMNOBA · paleta de marca dorado **#fdc300** y azul marino **#0f1c46** · **Serie:** ingeniería extrema · **Estilo:** animación cinematográfica de escala colosal en plano secuencia vertical continuo (de la plataforma oceánica al contrapeso), con zoom out de la red hexagonal de carbono, vectores luminosos de fuerzas, luz y atmósfera (nubes de tormenta, estratosfera, cinturones de Van Allen, auroras) y humor ligero. Texto en pantalla mínimo (solo el «¡PFFF!», «¡PLING!», «¡CRAC!», el calendario, «VERIFICADO» y las cifras de 96.000 km y 100.000 km); el guion es descriptivo.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-ascensor-espacial.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-ascensor-espacial.json --paleta=imnoba`. Carpeta de trabajo: `videos/2026-11-18-ascensor-espacial/`. Código: `src/viral/piezas/esp-kit.tsx` (`Cielo`, `Nubes`, `Tormenta`, `Cinta`, `Trepador`, `Laser`, `Plataforma`, `Cohete`, `Hexa`, `Nanotubo`, `Tierra`, `Cinturon`, `Estacion`, `Contrapeso`, `Flecha`, `Persona`, `Gaviota`), `esp1.tsx`, `esp2.tsx` (y `Globo`/`Onoma` de `chi-kit.tsx`, `Mar`/`Sello` de `rom-kit.tsx`); datos y tiempos en `src/anim/piezas.ts` (`ASC`, `TSP`).
**Voz:** descriptiva, ajustada a «Lively DJ» de CapCut (≈ 2,3 palabras por segundo): cada frase cabe en su escena (`npm run capcut`; mejor un audio por escena).
**Música y sonidos:** `videos/2026-11-18-ascensor-espacial/componer-musica.mjs` → `assets/musica/ascensor-espacial.wav` → `node scripts/anim/musica.mjs --usar=assets/musica/ascensor-espacial.wav` (y `--restaurar` al terminar; el WAV no va a git).

## Diseño sonoro (distinto en cada escena)
Cama: épica cinematográfica espacial en re menor a 84 bpm (dron grave, cuerdas, coro, arpegio de órgano, timbales y cornos), música de ascensor (vibráfono) en el viaje y resolución en re mayor con fanfarria.
| Escena | Sonidos propios |
|---|---|
| 1 · gancho | rugido del cohete · «pfff» sin combustible · silbato de émbolo al caer · trombón triste · «ding» de ascensor |
| 2 · nanotubo | campanas de cristal de los átomos · zumbido eléctrico · barridos de zoom · tics de la regla |
| 3 · cinta | aleteo de la cinta · crujido de papel · ping de la ampliación · viento |
| 4 · plataforma | olas · bocina de barco · graznido de gaviota · motor y clank de la grúa |
| 5 · trepador | zumbido del láser (zap) · motor de rodillos · chirrido · «ding» de carga |
| 6 · clima | trueno · lluvia · viento · rayo |
| 7 · Van Allen | contador geiger · destellos de aurora · coro misterioso · barrido de radiación |
| 8 · física | latido grave de la gravedad · remolino centrífugo · «ding» del empate · giro de honda |
| 9 · contrapeso | honda que gira · golpe del asteroide · tensión que sube |
| 10 · viaje | música de ascensor · barajar cartas · pasos del calendario · acople de la estación (clunk) |
| 11 · acero | quejido del metal · «pling» y latigazo del cable · «ding» de la cinta |
| 12 · laboratorio | clic de pinza · tics de regla · «crac» de la grieta · barrido hasta el cielo |
| 13 · cierre | barrido de bajada · golpe de obra · tres «ding» de verificación · sello y fanfarria |
| 14 · CTA | fanfarria de cornos |

| # | Pieza | Voz en off | Dato | Imagen |
|---|---|---|---|---|
| 1 | `esp-gancho` | «Un cohete quema toneladas de combustible solo para vencer la gravedad. ¿Y si subiéramos en ascensor?» | Un cohete es sobre todo combustible | El cohete con su tanque que se vacía, «¡PFFF!», cae; un trepador sube con su «ding» |
| 2 | `esp-nanotubo` | «Todo empieza en lo diminuto: átomos de carbono en red hexagonal, enrollados en nanotubos más fuertes que el acero.» | Nanotubos de carbono (20–100 veces más fuertes que el acero según la fuente) | Zoom out: red hexagonal → nanotubo → haz → cinta |
| 3 | `esp-cinta` | «El cable sería una cinta plana: ancha como una puerta, más fina que una hoja de papel y larguísima.» | Edwards: ≈ 1 m de ancho, más fina que el papel | Cinta dorada a pantalla completa, persona de referencia y ampliación del canto frente al papel |
| 4 | `esp-plataforma` | «Todo se ancla a una plataforma oceánica móvil sobre el ecuador, en aguas tranquilas, lejos de los huracanes.» | Anclaje móvil en el Pacífico ecuatorial oriental (propuesta de Edwards) | Plataforma, grúa, barcos, gaviota («¿Dónde me poso?») y globito del ecuador |
| 5 | `esp-trepador` | «Por la cinta trepa un robot. Un láser desde tierra le envía energía, y sus paneles la convierten en movimiento.» | Láser en tierra y paneles fotovoltaicos (Edwards) | Robot con carita, láser, batería que se carga |
| 6 | `esp-clima` | «Primero atraviesa nubes de tormenta y sube hasta la estratosfera, donde el cielo ya se vuelve oscuro.» | Troposfera → estratosfera | Nubes oscuras con rayos, lluvia y cielo que se apaga |
| 7 | `esp-vanallen` | «Más arriba cruza los cinturones de Van Allen, zonas de radiación peligrosas para las personas y la electrónica.» | Cinturones de radiación alrededor de la Tierra | Tierra con anillos luminosos, auroras y robot con gafas |
| 8 | `esp-fisica` | «Abajo manda la gravedad; arriba, la rotación de la Tierra. A treinta y seis mil kilómetros, se equilibran.» | Órbita geoestacionaria ≈ 35.786 km | Flechas azules (gravedad) y naranjas (fuerza centrífuga) y franja dorada de empate |
| 9 | `esp-contrapeso` | «Un contrapeso, como la piedra de una honda, mantiene tensa la cinta, a unos noventa y seis mil kilómetros.» | Obayashi: extremo a ≈ 96.000 km | Honda con asteroide que gira, cinta tensa y contador de km |
| 10 | `esp-viaje` | «El viaje es lento: a doscientos kilómetros por hora, llegar a la estación toma una semana.» | ≈ 200 km/h, ≈ 7,5 días (Obayashi) | Robot con pasajeros aburridos, cartas, música de ascensor, calendario y estación GEO |
| 11 | `esp-acero` | «Con acero no se podría: el cable se rompería por su propio peso mucho antes de llegar arriba.» | Relación resistencia/peso del acero | Cable de acero con pesas que se parte («¡PLING!») y la cinta que aguanta |
| 12 | `esp-lab` | «El obstáculo real: hoy hacemos nanotubos de centímetros, y un defecto los debilita. Faltan miles de kilómetros sin fallos.» | Nanotubos de laboratorio de decenas de centímetros; Edwards: ≈ 100.000 km de cinta | Pinza con regla, red con un átomo que falta y grieta que corre; cinta hasta el cielo |
| 13 | `esp-cierre` | «Hasta esta obra verifica sus materiales antes de empezar. En IMNOBA igual: bases reales, sin promesas en el aire.» | Puente con IMNOBA | Del contrapeso a una obra con tres verificaciones y el sello «VERIFICADO» |
| 14 | `CTA` | «Guárdalo y síguenos en IMNOBA: propiedades y vehículos.» | — | Cierre con el logo |

## Precauciones antes de publicar (lo que NO se afirma o se matiza)
- **«La física está 100 % comprobada» se matiza:** la mecánica orbital del concepto (equilibrio en la órbita geoestacionaria, contrapeso más allá) es sólida, pero hay problemas abiertos: oscilaciones del cable, basura espacial y micrometeoritos, radiación, erosión por oxígeno atómico, tormentas, energía y, sobre todo, el material. La voz no dice «comprobada».
- **Cifras que no coinciden entre fuentes:** cinta de ≈ 100.000 km (Edwards) y extremo a ≈ 96.000 km (Obayashi); algunas fuentes dan los 96.000 km como altura del cable y otras como la distancia del contrapeso. La velocidad de ≈ 200 km/h y los ≈ 7,5 días (Obayashi, 2012) y «una semana» (Edwards) son aproximados; un medio dio ≈ 125 mph. La fuerza de los nanotubos («20 a 100 veces el acero») también varía.
- **Grosor de la cinta:** las fuentes consultadas dicen «más fina que una hoja de papel» (ancho ≈ 1 m; versiones iniciales de ≈ 10–20 cm y micras de espesor). La premisa dice «más fina que un cabello»: no se afirma.
- **Nanotubos de laboratorio:** la voz dice «de centímetros»; los récords citados van de unas decenas de centímetros a ≈ 0,5–0,7 m, y en 2012 Obayashi dijo que solo se lograban ≈ 3 cm. El grafeno monocristalino de gran tamaño no se afirma con cifras.
- **Es un concepto, no existe:** Obayashi apuntaba a 2050 y dijo no poder calcular el costo; no se promete fecha. La plataforma «en aguas tranquilas, lejos de los huracanes» es la propuesta de Edwards para el Pacífico ecuatorial oriental.
- **Acero:** un cable uniforme de acero no podría sostener su propio peso hasta esa altura; es una simplificación (un cable muy ahusado tampoco es práctico).
- **Trepador y láser:** trepador de ≈ 7 t con ≈ 13 t de carga y láser de electrones libres de ≈ 350 kW son datos del informe de 2003; otras fuentes hablan de megavatios. El robot con carita y las gafas son humor.
- **Puente con IMNOBA:** es una analogía (verificar materiales y bases antes de empezar); no promete ganancia, valorización ni rendimiento, ni es asesoría de inversión.
- **Esquemas:** todo está fuera de escala (distancias y tamaños) y simplificado; no son fotos ni planos.
- **Sin voz** (no hay `OPENAI_API_KEY`) y **duración 117 s** (la norma es 20–35 s «salvo que el pedido diga otra»: el pedido pide explicar todo).
- **Fuentes:** resúmenes de búsqueda (NASA NIAC Phase II 2003, The Space Review, NSS, Japan Times, IEEE Spectrum, Gizmodo); Wikipedia estaba bloqueada. Contrasta con el informe de 2003 y la nota de Obayashi de 2012 antes de publicar.
