# «El pegamento que no era pegamento» · guion técnico (SINAPSIS, 9:16, ≈ 35 s)

**Serie:** secretos de la anatomía humana · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** estudio azul marino con figuras de microscopía dibujadas como renders (frasco de pegamento, astrocito dorado, neurona azul, sinapsis tripartita).
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-astrocitos.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-astrocitos.json --paleta=medicina`. La carpeta de trabajo real está en `videos/2026-10-28-astrocitos/`. Código: `src/viral/piezas/astro-kit.tsx` (figuras), `astro1.tsx` y `astro2.tsx` (escenas); datos y tiempos en `src/anim/piezas.ts` (`AST`, `TAS`, `PIEZAS`).

| # | Pieza | Voz en off | Dato (fuente) | Imagen |
|---|---|---|---|---|
| 1 | `astro-gancho` | «Te mintieron: la mitad de tu cerebro no es pegamento.» | — | Frasco «PEGAMENTO · GLÍA» que se agrieta, se rompe y deja salir un astrocito |
| 2 | `astro-glia` | «Hace siglo y medio las llamaron glía, que significa pegamento.» | Virchow acuñó «Nervenkitt» / neuroglia; primer uso documentado 1856 (algunas fuentes dan 1858) | Neurona rodeada de manchas de pegamento y odómetro 1800 → 1856 |
| 3 | `astro-mitad` | «Hoy sabemos que casi la mitad de tus células cerebrales no son neuronas.» | Azevedo et al., *J Comp Neurol* 2009: 86,1 ± 8,1 mil millones de neuronas y 84,6 ± 9,8 mil millones de células no neuronales (cerebro adulto; ≈ 50 % / 50 %) | 100 puntos que se vuelven azules (neuronas) y dorados (las demás) + dos contadores |
| 4 | `astro-estrella` | «Un astrocito, con forma de estrella, puede rodear hasta dos millones de sinapsis.» | Oberheim et al., *J Neurosci* 2009: un astrocito humano abarca ≈ 270.000 a 2 millones de sinapsis (estimación; roedores ≈ 20.000–120.000) | Astrocito que crece y puntas que se iluminan una a una + contador hasta 2.000.000 |
| 5 | `astro-dialogo` | «No son espectadoras: escuchan a las neuronas y ayudan a regular sus conexiones.» | Sinapsis tripartita: Araque et al., *Trends Neurosci* 1999 | Neurona emisora y receptora, vesículas que cruzan la hendidura, onda de calcio en el astrocito |
| 6 | `astro-memoria` | «En ratones, reactivar los astrocitos activos al aprender estimuló el recuerdo.» | Williamson et al., *Nature* 2025 (637:478–486): conjuntos de astrocitos activados al aprender; su reactivación estimuló el recuerdo en ratones | Dos astrocitos que brillan, enlaces dorados y una burbuja de «recuerdo» |
| 7 | `HOOK` | «Tu cerebro no tiene un jefe: la genialidad es un equipo.» | — | Titular «NO HAY JEFE: HAY EQUIPO» |
| 8 | `CTA` | «Guárdalo y compártelo.» | — | Cierre SINAPSIS |

## Precauciones antes de publicar (cosas que NO se afirman o que varían según la fuente)
- **No se afirma** que los astrocitos «controlen» la memoria ni que sean «los jefes»: la evidencia es que **participan** (regulan sinapsis y, en ratones, su reactivación estimuló el recuerdo). Por eso el cierre habla de un **equipo**, no de un jefe.
- **«Casi la mitad»:** la proporción 50/50 es estimación de un cerebro adulto masculino (Azevedo 2009); las células no neuronales incluyen glía **y** otras (endoteliales, etc.). Otras revisiones discuten el cociente exacto; el video dice «casi la mitad», no «la mitad exacta».
- **«Hasta dos millones»:** es el extremo alto de una estimación (270.000–2.000.000) obtenida en tejido humano; el video lo marca como estimación y la pantalla muestra el rango.
- **Año del término «glía»:** el uso documentado más antiguo de «neuroglia» por Virchow es 1856 (otras fuentes dan 1858). La cifra sale en pantalla con esa nota.
- **Gliotransmisión:** que los astrocitos liberen transmisores propios para modular sinapsis sigue en debate; el video usa el verbo neutro «regular».
- **Estudio de ratones (Williamson 2025):** el video dice «en ratones» en la voz, en el rótulo y en la fuente; no hay evidencia equivalente en personas.
- **Sinapsis tripartita (Araque 1999):** citada de memoria (no se pudo verificar en línea en esta sesión); revisa el DOI antes de publicar si quieres la referencia exacta.
