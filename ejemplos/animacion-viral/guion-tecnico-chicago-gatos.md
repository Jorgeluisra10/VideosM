# «La ciudad que subió con gatos» · guion técnico (IMNOBA, 9:16, ≈ 89 s)

**Marca:** IMNOBA · paleta `imnoba` · **Serie:** ingeniería extrema · **Estilo:** steampunk industrial tipo timelapse de grabado de época: fondo café-sepia con engranajes que giran y vapor, latón, cobre y ladrillo; personajes de caricatura con sombrero de copa, globos de diálogo y onomatopeyas; humor ligero.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-chicago-gatos.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-chicago-gatos.json --paleta=imnoba`. Carpeta de trabajo: `videos/2026-11-11-chicago-gatos/`. Código: `src/viral/piezas/chi-kit.tsx` (`FondoVapor`, `Engranaje`, `Humo`, `Edificio`, `Gato`, `Obrero`, `Caballero`, `Taza`, `Globo`, `Onoma`, `Plano`, `Pantano`, `Tubo`, `Miasma`, `Llamas`, `Viga`, `escalones`, `sacudidaPasos`), `chi1.tsx`, `chi2.tsx`; datos y tiempos en `src/anim/piezas.ts` (`CHI`, `TCH`).
**Música y sonidos:** `videos/2026-11-11-chicago-gatos/componer-musica.mjs` → `assets/musica/chicago-gatos.wav` → `node scripts/anim/musica.mjs --usar=assets/musica/chicago-gatos.wav` (y `--restaurar` al terminar; el WAV no va a git).

## Diseño sonoro (distinto en cada escena)
Cama: marcha-ragtime steampunk a 112 bpm (tuba, banjo, calíope, caja y bloque de madera), sombría con órgano y campana en el cólera, de timbal en el incendio y con trompeta en el cierre.
| Escena | Sonidos propios |
|---|---|
| 1 · gancho | matraca de engranaje · clank y golpe de cada gato · crujido de madera · tintineo de la taza · pop y «ding» del globo |
| 2 · pantano | glub de burbujas · pasos en el barro · silbato de émbolo · slurp · pop y boing |
| 3 · cólera | campana de duelo · zumbido de órgano · tics de contador · gotera sucia · timbal |
| 4 · plan | lápiz sobre el plano · tink de la regla · silbato de émbolo · glub atascado · trombón triste con wah-wah |
| 5 · idea | bombilla («ding» y calíope) · paladas de tierra · barrido de émbolo · boing · fanfarria de trompeta · pop de corcho |
| 6 · gato | matraca de la manivela · engranajes que rechinan · tic-tac de bloque · clank de carga · «ding» |
| 7 · ejército | redoble de caja · cuatro silbatos de vapor · «¡hup!» de obreros · clank de cada subida · murmullo |
| 8 · té | vertido de agua · tintineo de tazas · campanilla de la puerta · boing con silbato · «¡plof!» · trombón triste |
| 9 · calle | pasos en escalones · escalera que rechina · boing y silbato del tropiezo · golpe y tintineo del sombrero |
| 10 · nivel | agua que corre por el tubo · placa de bronce (zap y «ding») · trompetas · aplausos y vivas |
| 11 · incendio | crepitar · rugido de llamas · timbales · sirena · «dun dun duuun» de órgano |
| 12 · cierre | fanfarria de trompeta · glissando de calíope · «ta-da» |

| # | Pieza | Voz en off | Dato | Imagen |
|---|---|---|---|---|
| 1 | `chi-gancho` | «Chicago levantó una ciudad entera, con la gente adentro. Sí, mientras tomaban el té. Ven, te cuento.» | Chicago, década de 1850 | Hotel de ladrillo con inquilinos y tazas que sube a golpes sobre cinco gatos |
| 2 | `chi-pantano` | «Chicago nació sobre un pantano, casi al nivel del lago. Sus calles eran barro puro: se tragaban hasta las botas.» | Terreno bajo y encharcado a pocos pies sobre el lago | Corte con lago, barro, juncos, un caballero que se hunde y «¡SLURP!» |
| 3 | `chi-colera` | «Y esa agua sucia trajo enfermedades. En mil ochocientos cincuenta y cuatro, el cólera mató a más de mil cuatrocientas personas.» | Más de 1.400 muertes en 1854 (Junta de Salud) | Nube verde enojada, contador 1.400+ y el aviso «el cólera no tenía nada de gracia» |
| 4 | `chi-plan` | «El ingeniero Ellis Chesbrough diseñó un sistema de cloacas. Problema: necesitan bajada, y el pantano era plano como una mesa.» | Plan de alcantarillado de 1855; el agua corre solo con pendiente | Plano azul con un tubo inclinado que se aplana y «¡glub!» |
| 5 | `chi-idea` | «La solución fue una locura: si el pantano no baja, subamos la ciudad. Varios metros, edificio por edificio.» | Cloacas casi a ras del suelo, cubiertas de relleno | Corte con tubo, relleno que sube, edificios que suben y carteles ¿CAVAR? ✗ / ¿SUBIR? ✓ |
| 6 | `chi-gato` | «¿Con qué? Con gatos mecánicos: un tornillo es una rampa enrollada. Cada vuelta de manivela sube el peso un poquito.» | Una rosca convierte muchas vueltas en poco avance y multiplica la fuerza | Gato de tornillo con obrero y manivela; al lado, una rampa con un bloque |
| 7 | `chi-ejercito` | «Una cuadra entera se apoyaba en miles de gatos. Cientos de obreros giraban a una señal, y el edificio subía milímetro a milímetro.» | Lake Street, 1860: ≈ 600 hombres y ≈ 6.000 gatos (fuentes que no coinciden) | Cuadra de cuatro edificios sobre 14 gatos, 14 obreros, capataz con silbato y un gato (animal) en la azotea |
| 8 | `chi-te` | «Lo más absurdo: nadie se mudó. Los hoteles seguían abiertos, la gente tomaba su té, y algunos ni notaron que subían.» | Varios edificios siguieron funcionando mientras subían (dramatizado) | Gran Hotel con ventanas con té, globos de diálogo y un cliente que sale al vacío |
| 9 | `chi-calle` | «Mientras tanto, la calle era un chiste: edificios arriba, otros abajo, y escaleras en cada acera. Cruzar era deporte extremo.» | Aceras a distintas alturas con escalones | Cinco edificios en desnivel, escaleras, peatones y un tropiezo con «¡AY!» |
| 10 | `chi-nivel` | «Al terminar, Chicago tenía cloacas que drenaban y calles firmes. Fue de los primeros sistemas de cloacas planificados del país.» | Uno de los primeros sistemas integrales de EE. UU. (1855) | Calle a nuevo nivel con banderines, tubo con pendiente hacia el río, placa de bronce y «¡Funcionó!» |
| 11 | `chi-fuego` | «Años después, el gran incendio de mil ochocientos setenta y uno quemó buena parte del centro. Pero esa ya es otra historia.» | Gran incendio de Chicago, octubre de 1871 | Calendario 1860→1871, edificios en llamas y tarjeta «continuará…» |
| 12 | `CTA` | «Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos.» | — | Cierre con el logo |

## Precauciones antes de publicar (lo que NO se afirma o se matiza)
- **Cifras que no coinciden:** las fuentes consultadas (resúmenes de Wikipedia y divulgación) dan cifras distintas para la subida de Lake Street (≈ 600 hombres y ≈ 6.000 gatos en unas; 1.584 gatos y otra altura en otras) y para los metros subidos (de ≈ 4 a ≈ 14 pies, es decir, de ≈ 1 a ≈ 4 m). La voz solo dice «miles de gatos», «cientos de obreros» y «varios metros»; las cifras salen únicamente en un rótulo y en la nota al pie, marcadas como ≈. Contrástalas con los artículos de 1860 del *Chicago Press and Tribune* o con la Sociedad Histórica de Chicago antes de publicar.
- **Cólera 1854:** «más de 1.400 muertes» sale de los registros de la Junta de Salud que citan las fuentes; otras citan «≈ 6 %» o «uno de cada veinte» de los habitantes, y no coinciden con los registros, por eso el video no da porcentajes. El humor no se burla del cólera ni de sus víctimas: el aviso dice que «no tenía nada de gracia».
- **Quién levantó qué:** los edificios los levantaron varias empresas; a George Pullman se le atribuye parte de las subidas (y después fundó los coches-cama), pero hay fuentes que discrepan en qué hizo exactamente, por eso el video no lo menciona.
- **«Algunos ni notaron que subían» y el cliente que sale al vacío** son dramatizaciones: las fuentes cuentan que hoteles y tiendas siguieron abiertos durante la subida, pero no hay registro del gesto concreto de la escena (el té que no se derrama, el escalón). La nota al pie y el guion lo dicen.
- **«Primeros sistemas planificados»:** el plan de Chesbrough (1855) se cita como uno de los primeros sistemas integrales de alcantarillado de EE. UU.; no se afirma «el primero». Las cloacas vertían al río y el agua potable (el lago) se resolvió después, con otras obras; no es la solución completa del cólera.
- **Subida en etapas:** se levantaron edificios y calles durante las décadas de 1850 y 1860, no «de golpe»; el gran incendio de 1871 se menciona solo como giro («esa ya es otra historia»), sin explicar sus causas.
- **Esquemas:** todos los dibujos son simplificados, fuera de escala y con personajes de caricatura; no son fotos ni retratos de personas reales.
- **Sin voz** (no hay `OPENAI_API_KEY`) y **duración 89 s** (la norma es 20–35 s «salvo que el pedido diga otra»: el pedido pide explicar todo).
- **Información general:** no es asesoría de construcción ni de ingeniería, y no promete valorización ni ganancia.
