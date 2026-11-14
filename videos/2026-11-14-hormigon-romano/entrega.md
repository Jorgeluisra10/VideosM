# Entrega · «El secreto perdido del hormigón romano» (IMNOBA · serie ingeniería extrema · investigación forense y microscópica)

**Pedido:** video gracioso y de misterio arqueológico sobre el secreto de ingeniería perdido del Imperio Romano: por qué las estructuras romanas sumergidas en el Mediterráneo no se destruyen con el agua salada y mejoran con los siglos, mientras el hormigón armado moderno se corroe en el mar. Enfoque único: la reacción química antigua que hace que el mar fortalezca el cemento (ceniza volcánica + cal + agua de mar → tobermorita) · estilo de investigación forense visual y microscópica, de los puertos antiguos a los puentes modernos · marca IMNOBA · paleta `imnoba` · objetivo: que lo vean completo, lo **guarden y compartan** y que **sigan a IMNOBA**.

## 1 · Video final
`trabajo/archivo/2026-11-14-hormigon-romano/video-final.mp4` (1080×1920 · 60 fps · H.264 + AAC · 106,5 s · **sin voz**; audio nivelado a ≈ −15 LUFS: solo música y sonidos). Copia ligera de revisión en esta carpeta (`revision.mp4`). Pistas en `trabajo/archivo/2026-11-14-hormigon-romano/stems/` (`musica-y-efectos-normalizado.wav` para escuchar y `musica-y-efectos.wav` para reeditar con voz).

## 2 · Guion final (locución, ajustado a «Lively DJ» de CapCut, ≈ 2,3 palabras por segundo)
1. Un puente moderno se pudre en décadas. Un puerto romano, bajo el mar, mejora con los siglos. ¿Cómo?
2. El agua salada oxida el acero del hormigón moderno. El óxido se hincha y rompe todo desde adentro.
3. Los romanos mezclaban cal con ceniza volcánica de Pozzuoli, cerca de Nápoles, y la enviaban en barco.
4. Cal, ceniza, agua y roca volcánica, vertidas en moldes dentro del mar. Sin acero, nada que oxidar.
5. El secreto está en lo diminuto. Hagamos zoom: granos de ceniza, poros y agua de mar.
6. El agua de mar se cuela, disuelve ceniza y cal, y de ese caldo nacen cristales nuevos.
7. El protagonista: la tobermorita, un cristal raro que casi siempre exige mucho calor. Aquí crece en el mar.
8. Si aparece una grieta, el agua entra, los cristales crecen y la sellan. Un hormigón con curitas automáticas.
9. Además, la mezcla tiene grumos de cal. Si aparece una fisura, se disuelven y la tapan.
10. En Roma, la cúpula del Panteón, de hormigón sin acero, lleva casi dos mil años en pie.
11. Ojo: lo romano malo se cayó hace siglos y nadie lo recuerda. Se llama sesgo del sobreviviente.
12. El cemento moderno se cocina a más de mil cuatrocientos grados. Y emite cerca del siete por ciento del CO2.
13. Caso resuelto: no era magia, era química paciente. El mar no destruyó el puerto: lo terminó de construir.
14. Guárdalo y síguenos en IMNOBA: propiedades y vehículos.

Guion técnico con precauciones: `ejemplos/animacion-viral/guion-tecnico-hormigon-romano.md`.

## 3 · Ganchos
- A) «Un puente moderno se pudre en décadas. Un puerto romano, bajo el mar, mejora con los siglos.» ← **elegido**: un contraste imposible en dos frases, con el puente oxidándose arriba y el puerto brillando abajo desde el segundo 0, y un «¿Cómo?» que abre el misterio.
- B) «Los romanos hicieron un hormigón que se cura solo. Y lleva dos mil años bajo el mar.»
- C) «¿Por qué el mar destruye tu puente y fortalece un puerto romano?»

## 4 · Texto para publicar
Un puente moderno se pudre en décadas; un puerto romano lleva 2.000 años bajo el mar y mejora. 🏛️🔬 El secreto: ceniza volcánica + cal + agua de mar, y un cristal raro llamado tobermorita que crece solo y sella grietas. Caso resuelto, con curitas automáticas incluidas. 🩹 Guárdalo y síguenos en IMNOBA: propiedades y vehículos.
#hormigon #romanos #ingenieria #ciencia #imnoba

## 5 · Nota
Espero que lo vean completo por el misterio y el humor, y que lo guarden y compartan por el dato de la «curita automática». Métrica: retención a los 3 s, en el segundo 38 (el zoom microscópico) y en el 62 (los grumos de cal), y guardados por cada 1.000 alcanzados.

## 6 · Registro
Registrado en el Panel de Videos con estado «grabado» y serie «ingeniería extrema» (`registro.json`, `miniatura.jpg` y `revision.mp4` en esta carpeta).

## Música y sonidos
`videos/2026-11-14-hormigon-romano/componer-musica.mjs`: misterio forense en re menor a 100 bpm (bajo con sidechain, cuerdas, vibráfono, chasquidos y hi-hat), con campanas de cristal que suben mientras crece la tobermorita, coro en el Panteón, pizzicato cómico en el sesgo del sobreviviente, maquinaria en el cemento y resolución en re mayor con fanfarria. Más de 26 sonidos distintos por escena: sonar, crujido de metal oxidado, bocina de barco, gotas de agua salada, «crac» del hormigón, retumbar del volcán, gaviota, chapoteo, buzzer de «sin acero», barridos de zoom, contador geiger, fizz de disolución, obturador de cámara rápida, rasgado de curita, boing, estruendo del viaducto, coro, trombón triste, tos «cof, cof», sello, máquina de escribir y fanfarria.

## Lo que conviene saber (dicho con claridad)
- **Sin voz:** no hay `OPENAI_API_KEY`. El guion está ajustado a «Lively DJ» de CapCut (≈ 2,3 palabras por segundo, cada frase cabe en su escena con holgura). Genera la voz escena por escena y pega con `npm run capcut -- --escenas=carpeta`, o una sola pista con `npm run capcut -- --audio=mi-voz.mp3`.
- **«Colapsan en 50 años» es una simplificación:** las estructuras modernas se diseñan para ≈ 50 a 100 años y muchas duran más. Lo real y bien documentado es la corrosión del acero por cloruros en el mar; por eso la voz dice «un puente moderno se pudre en décadas», no que todo lo moderno colapse.
- **«Más fuerte con cada siglo» se matiza:** los estudios (Jackson y colaboradores, 2013 y 2017) muestran cristales que refuerzan el hormigón de puertos romanos; no que sea indestructible, y hay puertos erosionados. La voz dice «mejora con los siglos».
- **Autocuración:** el hallazgo de los grumos de cal (Seymour, Masic y colaboradores, *Science Advances*, 2023) se probó en el laboratorio con mezclas modernas; los resúmenes de prensa repiten el comunicado del MIT. La «curita» y el dibujo del sellado son analogías esquemáticas.
- **Panteón:** no está sumergido; usa un hormigón parecido con ceniza volcánica, pero la química marina se estudió en puertos. El cartel de «garantía: 50 años*» es una parodia.
- **CO₂ del cemento:** varía de ≈ 6 a ≈ 8 % según la fuente (la voz dice «cerca del siete por ciento»); los «más de mil cuatrocientos grados» del horno son un valor técnico habitual que no verifiqué con una fuente en esta sesión.
- **Esquemas, no micrografías:** los granos, cristales y escalas están dibujados y son aproximados; la cámara rápida de 2.000 años es ilustrativa.
- **No pude abrir Wikipedia ni los artículos completos** (el entorno los bloquea); usé resúmenes de búsqueda de los estudios. Contrasta con los papers antes de publicar.
- **«Realista»:** dibujo vectorial forense, no fotos. **Duración 106,5 s** (la norma es 20–35 s «salvo que el pedido diga otra»; el pedido pide explicar todo).
- **Información general:** divulgación histórica y científica, sin asesoría de ingeniería ni de construcción y sin promesa de valorización.
