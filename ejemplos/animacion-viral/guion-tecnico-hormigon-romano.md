# «El secreto perdido del hormigón romano» · guion técnico (IMNOBA, 9:16, ≈ 106 s)

**Marca:** IMNOBA · paleta `imnoba` · **Serie:** ingeniería extrema · **Estilo:** investigación forense visual y microscópica de misterio arqueológico: laboratorio azul petróleo con rejilla, línea de escaneo, retícula de microscopio, barras de escala, etiquetas de evidencia, un inspector con lupa y sello de «caso resuelto»; humor ligero (globos de diálogo, curitas automáticas, cartel de «garantía 50 años*», botiquín, tos del cemento).
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-hormigon-romano.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-hormigon-romano.json --paleta=imnoba`. Carpeta de trabajo: `videos/2026-11-14-hormigon-romano/`. Código: `src/viral/piezas/rom-kit.tsx` (`FondoLab`, `Reticula`, `Mar`, `Inspector`, `PuenteModerno`, `Viaducto`, `MuelleRomano`, `Bloque`, `Cristales`, `Ion`, `Gota`, `Barco`, `Volcan`, `Panteon`, `Fabrica`, `Sello`, `Evidencia`), `rom1.tsx`, `rom2.tsx` (y `Globo`/`Onoma` de `chi-kit.tsx`); datos y tiempos en `src/anim/piezas.ts` (`ROM`, `TRM`).
**Voz:** pensada para «Lively DJ» de CapCut (≈ 2,3 palabras por segundo): cada frase cabe en su escena con holgura. `npm run capcut` deja el texto listo; mejor un audio por escena.
**Música y sonidos:** `videos/2026-11-14-hormigon-romano/componer-musica.mjs` → `assets/musica/hormigon-romano.wav` → `node scripts/anim/musica.mjs --usar=assets/musica/hormigon-romano.wav` (y `--restaurar` al terminar; el WAV no va a git).

## Diseño sonoro (distinto en cada escena)
Cama: misterio forense en re menor a 100 bpm (bajo con sidechain, cuerdas, vibráfono, chasquidos y hi-hat), con coro en el Panteón, pizzicato cómico en el sesgo, maquinaria en el cemento y resolución en re mayor con fanfarria.
| Escena | Sonidos propios |
|---|---|
| 1 · gancho | ping de sonar · barrido de escaneo · crujido de metal oxidado · bocina de barco · destellos de cristal · boing de «¡caso abierto!» |
| 2 · óxido | gotas de agua salada · quejido de metal · «crac» del hormigón · trozo que cae · boing de «¡auxilio, me oxido!» |
| 3 · ceniza | retumbar del volcán · «fump» de los sacos · bocina de barco · graznido de gaviota · chapoteo de olas |
| 4 · receta | chapoteo de cada ingrediente · vertido de la mezcla · crujido de madera · buzzer de «sin acero» |
| 5 · zoom | tres barridos de zoom · tics de contador geiger · burbujas · ping de retícula |
| 6 · reacción | gotas que entran · fizz de la disolución · tics de iones · campanas de vidrio de los cristales que nacen |
| 7 · cristal | obturador de cámara rápida · tic-tac que acelera · campanas de cristal que suben · «ding» de los 2.000 años |
| 8 · curita | «crac» de la grieta · goteo · cristales que sellan · rasgado de curita (velcro) · boing de «¡curita!» |
| 9 · grumos | fizz de disolución · tics de calcio · calcita que tapa · tapa del botiquín |
| 10 · panteón | cartel · derrumbe del viaducto (estruendo y polvo) · silbato de émbolo · coro de la cúpula · «ding» de luz |
| 11 · sesgo | pizzicato cómico de ruinas que caen · foco (thunk) · trombón triste |
| 12 · cemento | horno que ruge · tics del termómetro · maquinaria · tos «cof, cof» |
| 13 · caso | olas y destellos · máquina de escribir · sello (thump) · fanfarria resolutiva |
| 14 · cierre | arpegio de vibráfono y ta-da |

| # | Pieza | Voz en off | Dato | Imagen |
|---|---|---|---|---|
| 1 | `rom-gancho` | «Un puente moderno se pudre en décadas. Un puerto romano, bajo el mar, mejora con los siglos. ¿Cómo?» | Contraste puente costero vs. puerto romano | Mitad de arriba: puente con óxido; mitad de abajo: muelle romano con destellos; inspector: «¡Caso abierto!» |
| 2 | `rom-oxido` | «El agua salada oxida el acero del hormigón moderno. El óxido se hincha y rompe todo desde adentro.» | Cloruros → corrosión del acero; el óxido ocupa más volumen que el acero | Pilar de hormigón armado con iones Cl, óxido que crece, grietas y «¡Auxilio, me oxido!» |
| 3 | `rom-ceniza` | «Los romanos mezclaban cal con ceniza volcánica de Pozzuoli, cerca de Nápoles, y la enviaban en barco.» | «Pulvis puteolanus» (Vitruvio) | Volcán, sacos de ceniza que vuelan al barco y una gaviota («¿Eso se come?») |
| 4 | `rom-receta` | «Cal, ceniza, agua y roca volcánica, vertidas en moldes dentro del mar. Sin acero, nada que oxidar.» | Moldes de madera dentro del agua; sin armadura de acero | Cuatro ingredientes que caen a un molde en el mar y símbolo de «sin hierro» |
| 5 | `rom-zoom` | «El secreto está en lo diminuto. Hagamos zoom: granos de ceniza, poros y agua de mar.» | Escalas 1 m → 1 cm → 50 µm (aproximadas) | Retícula de microscopio y zoom de muelle a bloque a granos; inspector: «Más zoom… ¡más!» |
| 6 | `rom-reaccion` | «El agua de mar se cuela, disuelve ceniza y cal, y de ese caldo nacen cristales nuevos.» | Reacción puzolánica y cristalización posterior (Jackson 2017) | Gotas que entran, iones Ca/Si/Al y cristales que nacen entre granos |
| 7 | `rom-cristal` | «El protagonista: la tobermorita, un cristal raro que casi siempre exige mucho calor. Aquí crece en el mar.» | Al-tobermorita a temperatura del mar (Jackson 2013, 2017) | Cámara rápida de cristales dorados y contador de 0 a 2.000 años |
| 8 | `rom-curita` | «Si aparece una grieta, el agua entra, los cristales crecen y la sellan. Un hormigón con curitas automáticas.» | Cristales que refuerzan y rellenan poros y fisuras | Bloque con grieta, cristales que la sellan y una curita |
| 9 | `rom-grumos` | «Además, la mezcla tiene grumos de cal. Si aparece una fisura, se disuelven y la tapan.» | Seymour, Masic et al. (Science Advances, 2023): mezcla en caliente y grumos de cal | Grumos que se disuelven, calcio que fluye y calcita blanca que tapa; botiquín incluido |
| 10 | `rom-panteon` | «En Roma, la cúpula del Panteón, de hormigón sin acero, lleva casi dos mil años en pie.» | Panteón ≈ 126 d. C.; cúpula sin armar de ≈ 43,3 m | Viaducto moderno que se parte («GARANTÍA: 50 AÑOS*») y Panteón intacto |
| 11 | `rom-sesgo` | «Ojo: lo romano malo se cayó hace siglos y nadie lo recuerda. Se llama sesgo del sobreviviente.» | Sesgo del sobreviviente | Fila de ruinas con X y «chapuza», un edificio en pie bajo un foco |
| 12 | `rom-co2` | «El cemento moderno se cocina a más de mil cuatrocientos grados. Y emite cerca del siete por ciento del CO2.» | Clínker a ≈ 1.450 °C; ≈ 6–8 % del CO2 mundial | Fábrica con nubes de CO₂, termómetro y «¡Cof, cof!» |
| 13 | `rom-caso` | «Caso resuelto: no era magia, era química paciente. El mar no destruyó el puerto: lo terminó de construir.» | Resumen | Muelle romano al atardecer y sello «CASO RESUELTO» |
| 14 | `CTA` | «Guárdalo y síguenos en IMNOBA: propiedades y vehículos.» | — | Cierre con el logo |

## Precauciones antes de publicar (lo que NO se afirma o se matiza)
- **«Colapsan en 50 años» es una simplificación:** las estructuras modernas se diseñan para ≈ 50 a 100 años y muchas duran más; lo real y bien documentado es la corrosión del acero por cloruros en ambientes marinos. La voz dice «un puente moderno se pudre en décadas» (un puente costero), no que todo lo moderno colapse.
- **«Más fuerte con cada siglo» se matiza:** los estudios muestran que el agua de mar y la ceniza forman cristales (Al-tobermorita y filipsita) que refuerzan y dan estabilidad, no que el hormigón romano sea indestructible; hay puertos romanos erosionados y muchas obras que se perdieron. La voz dice «mejora con los siglos» en un puerto sumergido, no «indestructible» ni «eterno».
- **Estudios citados:** Jackson y colaboradores (2013, *Journal of the American Ceramic Society*; 2017, *American Mineralogist*) sobre la Al-tobermorita y la filipsita en el hormigón de puertos romanos; Seymour, Masic y colaboradores (2023, *Science Advances*) sobre la «mezcla en caliente» y los grumos de cal. Los resúmenes de prensa del estudio de 2023 repiten el mismo comunicado del MIT y no hay réplicas independientes en lo que se consultó.
- **Autocuración:** la prueba de laboratorio de 2023 fue con mezclas modernas con grumos de cal; la «curita automática» es una analogía y el dibujo de la grieta que se sella es esquemático.
- **Tobermorita:** se dice que «casi siempre exige calor» (es un mineral que suele formarse con calor en procesos geológicos o industriales) y que en el hormigón romano cristalizó a temperatura del mar; la cámara rápida de 2.000 años es ilustrativa, no una observación.
- **Panteón:** no está sumergido; usa un hormigón con ceniza puzolánica parecido, pero la química marina se estudió en puertos. Fecha y medidas varían según la fuente (≈ 113–128 d. C.; ≈ 43,3 m de diámetro, la cúpula de hormigón sin armar más grande del mundo).
- **Ceniza de Pozzuoli:** Vitruvio la llama «pulvis puteolanus»; que se enviaba por mar a otros puertos está documentado, pero el dibujo del barco es una reconstrucción libre. No se dan cantidades.
- **CO2 del cemento:** las estimaciones van de ≈ 6 a ≈ 8 % del CO2 mundial según la fuente y el año; la voz dice «cerca del siete por ciento». El clínker se cuece a ≈ 1.450 °C (valor técnico habitual que no se verificó con una fuente en esta sesión).
- **Humor:** el cartel de «garantía 50 años*» es una parodia; el sesgo del sobreviviente es una advertencia honesta (lo mal hecho se cayó y no lo vemos).
- **Esquemas:** no son micrografías ni fotos reales; las escalas son aproximadas.
- **Sin voz** (no hay `OPENAI_API_KEY`) y **duración 106 s** (la norma es 20–35 s «salvo que el pedido diga otra»: el pedido pide explicar todo).
- **Información general:** divulgación histórica y científica, sin asesoría de ingeniería ni de construcción; no promete valorización ni ganancia.
