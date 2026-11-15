# «Derinkuyu: la ciudad bajo tierra» · guion técnico (IMNOBA, 9:16, ≈ 99 s)

**Marca:** IMNOBA · paleta `imnoba` · **Serie:** ingeniería extrema · **Estilo:** viaje inmersivo y claustrofóbico en corte transversal a pantalla completa, tipo aventura oscura de Indiana Jones: roca ocre con poros y vetas por todo el cuadro, antorchas que parpadean, polvo, murciélagos y personajes de caricatura con vida propia. **Casi sin texto:** solo el contador de profundidad (-NN m), la regla de metros y la cifra de 20.000; todo lo demás se explica dibujando (la voz solo suma ≈ 96 palabras en 99 s).
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-derinkuyu.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-derinkuyu.json --paleta=imnoba`. Carpeta de trabajo: `videos/2026-11-16-derinkuyu/`. Código: `src/viral/piezas/der-kit.tsx` (`Camara`, `RocaFondo`, `Ciudad` con 18 niveles y sus salas, `Galerias`, `Aire`, `Superficie`, `CasaCorte`, `Aldeano`, `Soldado`, `Animal`, `Antorcha`, `PuertaPiedra`, `Polvo`, `Vineta`), `der1.tsx`, `der2.tsx`; datos y tiempos en `src/anim/piezas.ts` (`DER`, `TDR`).
**Voz:** pensada para «Lively DJ» de CapCut (≈ 2,3 palabras por segundo): cada frase es corta y cabe con holgura (el resto de cada escena es música, sonido e imagen). `npm run capcut` deja el texto listo; mejor un audio por escena.
**Música y sonidos:** `videos/2026-11-16-derinkuyu/componer-musica.mjs` → `assets/musica/derinkuyu.wav` → `node scripts/anim/musica.mjs --usar=assets/musica/derinkuyu.wav` (y `--restaurar` al terminar; el WAV no va a git).

## Diseño sonoro (distinto en cada escena)
Cama: aventura oscura en re menor a 104 bpm (dron grave, cuerdas en trémolo, timbales y tambores, motivo de metales y flauta tipo duduk) con eco de cueva, casi silencio con latido en los invasores y fanfarria en el cierre.
| Escena | Sonidos propios |
|---|---|
| 1 · gancho | golpes de mazo · ladrillos que caen · cacareo de la gallina · derrumbe de la pared · «¡!» · caída por el agujero |
| 2 · roca | picos que tintinean en la piedra · desmoronamiento · chillido del topo · polvo |
| 3 · pisos A | ascensor que baja · crujir de cuerda · «ding» por cada piso · relincho · rebuzno · cacareo |
| 4 · pisos B | crepitar del horno · muela de la prensa · tintineo de tinajas · campana de la escuela |
| 5 · pisos C | campanas de iglesia · coro · murciélagos · golpe grave del fondo |
| 6 · aire | aullido del viento por el pozo · respiración · soplo caliente · flauta |
| 7 · puerta | pasos que corren · rodar de la piedra · golpe con polvo · lanza que roza · chillido del soldado · metal |
| 8 · gente | murmullo que crece · pop por cada piso · redoble de tambor · «ding» final |
| 9 · túnel | goteo con eco · pasos · aleteo de murciélagos · destello de ojos |
| 10 · invasores | galope · latido en el silencio · olfateo · kazoo de «¿eh?» · huida al galope |
| 11 · hoy | charla de turistas · obturador y destello · cinta que tintinea · pad misterioso |
| 12 · cierre | subida rápida · martillo que sube · guiño · golpe y luz dorada |
| 13 · CTA | fanfarria de aventura |

| # | Pieza | Voz en off | Qué se ve (casi sin texto) |
|---|---|---|---|
| 1 | `der-gancho` | «Un hombre derribó una pared del sótano… y encontró una ciudad.» | Casa de Capadocia en corte; el hombre rompe la pared con el mazo, una gallina entra al agujero y la cámara se lanza hacia abajo |
| 2 | `der-roca` | «La roca volcánica era blanda: se tallaba con picos.» | Toba pálida que se oscurece, cámaras que crecen con obreros que pican, chispas de roca y topos curiosos |
| 3 | `der-niveles-a` | «Primero, establos y casas.» | Descenso por los pisos 1–6 con caballos, burros, camas, hornos y antorchas |
| 4 | `der-niveles-b` | «Luego, bodegas, cocinas y escuelas.» | Pisos 7–12: tinajas, hornos con humo, prensa de aceite y una clase |
| 5 | `der-niveles-c` | «Y abajo del todo, una iglesia.» | Pisos 13–18: iglesia con cruz y velas, refugios, pozo y murciélagos |
| 6 | `der-aire` | «El aire frío baja. El caliente sube. Así respiraban.» | Vista de toda la ciudad: lazos de partículas azules que bajan por el pozo central y naranjas que suben por los laterales |
| 7 | `der-puerta` | «Una puerta de piedra de media tonelada. Se cerraba solo por dentro.» | Defensores que empujan la piedra de molino, soldados que chocan, lanza por el orificio y huida |
| 8 | `der-gente` | «Hasta veinte mil personas, con sus animales.» | Toda la ciudad se llena de gente piso por piso y un contador que sube a 20.000 |
| 9 | `der-tunel` | «Se cree que túneles unían ciudades vecinas.» | Panorámica de un túnel con gente y burros, murciélagos y unos ojos curiosos hasta otra ciudad |
| 10 | `der-invasores` | «Arriba, los invasores no encontraban a nadie.» | Superficie con soldados a caballo y signos de interrogación; abajo, aldeanos callados |
| 11 | `der-hoy` | «Hoy solo se visita una parte.» | Turistas con casco y linterna, guía con bandera, flash, valla y gran parte a oscuras (indicador de pisos encendidos) |
| 12 | `der-cierre` | «¿Y si derribas otra pared?» | La cámara sube al sótano; el hombre guiña, alza el mazo, golpe y luz dorada |
| 13 | `CTA` | «Guárdalo y síguenos en IMNOBA: propiedades y vehículos.» | Cierre con el logo |

## Precauciones antes de publicar (lo que NO se afirma o se matiza)
- **Cifras que no coinciden entre fuentes:** profundidad (≈ 85 m según la premisa y algunas fuentes; otras dan ≈ 60–76 m u 85 m «según se cree»), número de niveles (≈ 18; solo ≈ 8 se visitan, según la guía), capacidad (hasta ≈ 20.000 personas con sus animales) y fecha de uso o de construcción (Frigios, bizantinos, siglos distintos). La voz no da cifras de profundidad ni de pisos; solo «hasta veinte mil personas» y «media tonelada» (hasta ≈ 500 kg).
- **El hallazgo de 1963** se cuenta de varias formas (un vecino reformaba su casa y derribó una pared; en algunas versiones, gallinas que desaparecían). La escena de la gallina y el mazo es una dramatización humorística.
- **Ventilación por convección:** los pozos de ventilación son un hecho bien descrito (uno de ≈ 55 m servía también de pozo de agua). Que el aire frío bajara por el pozo central y el caliente subiera por los laterales es una interpretación plausible del diseño, no un estudio medido; los lazos de partículas son un esquema, no una simulación de dinámica de fluidos. El número de pozos varía según las fuentes.
- **Puertas de piedra:** discos de piedra de molino de hasta ≈ 500 kg (≈ 1.000 libras) que se cerraban desde dentro y podían aislar cada piso; los orificios para lanzas son una explicación habitual. Los soldados que chocan y la lanza que asoma son humor dramatizado.
- **Túneles a Kaymaklı:** se cree que unos ≈ 8–9 km unían ambas ciudades; la mayoría de las fuentes dice que hoy no son transitables. La voz dice «se cree».
- **Turismo:** el número de niveles visitables (≈ 8, ≈ 7 o «la mitad») varía según la fuente y el año; la voz dice solo «una parte». La valla y los ojos en la oscuridad son humor.
- **Roca:** la toba volcánica se talla con facilidad y se endurece al contacto con el aire; el cambio de color de la escena 2 es esquemático.
- **Esquemas:** la sección es un dibujo simplificado y fuera de escala (las salas se repiten por nivel y los personajes son caricaturas), no un plano ni una reconstrucción arqueológica; no hay fotos.
- **Sin voz** (no hay `OPENAI_API_KEY`) y **duración 99 s** (la norma es 20–35 s «salvo que el pedido diga otra»: el pedido pide explicar todo con casi nada de texto).
- **Información general:** divulgación histórica, sin asesoría de construcción ni de ingeniería; no promete valorización ni ganancia.
