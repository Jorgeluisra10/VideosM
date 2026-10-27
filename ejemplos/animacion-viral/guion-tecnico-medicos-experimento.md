# «Médicos que se probaron a sí mismos» · guion técnico (v4, figuras médicas realistas, 9:16, ≈ 122 s)

**Estilo:** estudio azul marino con piso y reflejo (el mismo de «Bogotá, la ciudad sin metro»), figuras dibujadas como renders (radiografía de tórax con sonda, estómago con úlcera, bacteria en espiral, vaso con caldo, endoscopia, medalla Nobel, instrumental, cronómetro y una base antártica con ventisca) y rótulos grandes que cambian de frase. Cada escena trae su fuente en pantalla.
**Cómo se carga:** `node scripts/anim/ejemplo.mjs --tema=medicos-experimento` (o el botón «🩺 Video médico «Médicos que se probaron a sí mismos»» del Estudio) → Renderizar. Voz con IA: tarjeta «🎙️ Voz en off». La locución con tiempos está en `locucion-medicos-experimento.txt`. Código: `src/viral/piezas/med-kit.tsx` (figuras) y `med1…3.tsx` (escenas); datos y tiempos en `src/anim/piezas.ts` (`MED`, `TM`, `PIEZAS`).

| # | Pieza | Voz en off | Dato (fuente) | Imagen |
|---|---|---|---|---|
| 1 | `med-gancho` | «Tres médicos usaron su propio cuerpo como laboratorio…» | Forssmann 1929, Marshall 1984, Rogozov 1961; dos de los tres ganaron el Nobel (1956, 2005) | Lámpara quirúrgica sobre una sonda, un vaso con bacterias, un espejo y un bisturí |
| 2 | `med-sonda1` | «Alemania, 1929. Forssmann cree que se puede llegar al corazón por una vena. Su jefe dice que no.» | Autocateterismo de Forssmann (1929), NobelPrize.org (biografía) | Radiografía de tórax con la ruta imaginada (brazo → vena → corazón) |
| 3 | `med-sonda2` | «Se anestesió el brazo, se abrió una vena… La radiografía lo confirmó.» | Forssmann, *Klin. Wochenschr.* 1929; NobelPrize.org | La sonda avanza sobre la radiografía hasta la aurícula derecha y destella |
| 4 | `med-nobel1` | «Lo criticaron… En 1956 ganó el Nobel.» | Nobel de Fisiología o Medicina 1956: Cournand, Forssmann y Richards (cateterismo cardíaco) | Medalla dorada con brillo |
| 5 | `med-pylori1` | «Creían que las úlceras eran por estrés… Warren y Marshall sospechaban de una bacteria en espiral.» | Nobel 2005: Warren y Marshall, *Helicobacter pylori* en gastritis y úlcera péptica | Estómago con úlcera y lupa con bacterias helicoidales |
| 6 | `med-vaso` | «Nadie les creía… En 1984, Marshall se bebió un caldo lleno de esas bacterias.» | Marshall et al., *Med J Aust* 1985; el pH del estómago en ayunas es ácido (≈ 1–3) | Vaso con caldo que se inclina y se vacía |
| 7 | `med-gastritis` | «A los pocos días, náuseas, vómitos y mal aliento… se curó con antibióticos.» | Marshall et al. 1985 (gastritis; resolvió con tratamiento) | Endoscopia que se enrojece y cápsulas |
| 8 | `med-nobel2` | «Hoy se sabe que causa la mayoría de las úlceras y que infecta a cerca de la mitad del mundo. En 2005… el Nobel.» | Meta-análisis de 73 países: 44,3 % (IC 95 % 40,9–47,7), Zamani et al., *Aliment Pharmacol Ther* 2018 | Pictograma de 10 personas, odómetro y medalla 2005 |
| 9 | `med-polar1` | «Abril de 1961, Antártida. Rogozov, el único médico de la base, tiene apendicitis…» | Rogozov y Bermel, BMJ 2009;339:b4965; base Novolazarévskaya | Base roja en plena ventisca, viñeta de dolor |
| 10 | `med-cirugia` | «Medio sentado, con un espejo y anestesia local, se abrió el abdomen… Tardó casi dos horas.» | Anestesia local (procaína/novocaína) y ayudantes: Rogozov y Bermel 2009; duración ≈ 1 h 45 min (Wikipedia, «Self-surgery»), otros relatos ≈ 2 h | Lámpara, cronómetro que corre hasta 1 h 45 y el instrumental |
| 11 | `med-polar2` | «Terminó agotado… En dos semanas ya estaba trabajando otra vez.» | Relatos divulgativos (≈ 2 semanas); sin fuente primaria confirmada | Amanece sobre la base; 14 casillas que se llenan |
| 12 | `med-cierre` | «Tres médicos, tres apuestas… No lo imites… ¿hasta dónde llegarías por una idea?» | — | Tres tarjetas (1956 · 2005 · 1961), «NO LO IMITES» y la pregunta final |

## Precauciones antes de publicar (cosas que NO se afirman o que varían según la fuente)
- **No se usa** la longitud del catéter de Forssmann (circula «65 cm» sin fuente confirmada), ni su edad exacta, ni la dosis exacta del caldo de Marshall (alguna fuente habla de ≈ 10⁹ UFC, sin confirmar), ni el día exacto de sus síntomas (3, 5 u 8 días según el relato) ni de la endoscopia (≈ 10 días).
- **Fecha del experimento de Marshall:** unas fuentes dicen junio de 1984 y otras finales de julio; el video solo dice «1984».
- **Cirugía de Rogozov:** las fuentes difieren en la fecha (30 de abril o 1 de mayo de 1961), en la duración (1 h 45 min o ≈ 2 h) y en quién hacía qué (un meteorólogo, un mecánico/ingeniero y, según algún relato, un conductor como reserva); el video dice «un meteorólogo y un mecánico» y «casi dos horas». Verifica contra el artículo del *BMJ* (Rogozov y Bermel, 2009) antes de publicar.
- **«Dos semanas» de recuperación:** viene de artículos divulgativos; no está confirmado en una fuente primaria. Si no lo confirmas, cambia la escena 11 a «volvió a trabajar».
- **44,3 %:** es la cifra del meta-análisis de 73 países de Zamani et al. (2018). Otros estudios (Hooi et al., 2017: ≈ 4.400 millones de personas en 2015) dan valores mayores; el video dice «cerca de la mitad».
- **«La mayoría de las úlceras»:** *H. pylori* causa la gran mayoría de las úlceras duodenales y una parte menor pero mayoritaria de las gástricas; el resto se asocia sobre todo a antiinflamatorios.
- **Ética:** es un relato histórico; la descripción debe decir que no se deben repetir estos experimentos y que hoy existen comités de ética y ensayos clínicos.

## Fuentes consultadas (búsqueda web)
- Premios Nobel de Fisiología o Medicina 1956 y 2005 y biografías de Forssmann, Marshall y Warren: NobelPrize.org.
- Forssmann W. «Die Sondierung des rechten Herzens», *Klinische Wochenschrift* 1929.
- Marshall BJ et al., «Attempt to fulfil Koch's postulates for pyloric Campylobacter», *Medical Journal of Australia* 1985; 142: 436–439. Relatos: Lindau Nobel, *Discover*, *The Biomedical Scientist*.
- Rogozov V, Bermel N. «Auto-appendectomy in the Antarctic: case report», BMJ 2009;339:b4965; LITFL; Wikipedia («Leonid Rogozov», «Self-surgery»).
- Zamani M et al., «Systematic review with meta-analysis: the worldwide prevalence of Helicobacter pylori infection», *Aliment Pharmacol Ther* 2018 (PubMed 29430669); Hooi JKY et al., *Gastroenterology* 2017.
