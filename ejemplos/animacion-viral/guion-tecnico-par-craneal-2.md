# El nervio óptico: la parte del cerebro que sale a mirar · guion técnico (SINAPSIS, 9:16, ≈ 66 s)

**Serie:** pares craneales en SINAPSIS (par II; el par 0 y el par I salieron antes) · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** anatomía vectorial esquemática sobre fondo oscuro: cerebro con dos tallos violeta hasta los ojos, corte del nervio con meninges y axones, ojo con el punto ciego y demostración de Mariotte, vista cenital del quiasma con fibras azules (campo izquierdo) y naranjas (campo derecho), fibras que mueren en el glaucoma frente al olfatorio que renace, hélice de ADN con marcas que se borran con OSK, línea de tiempo del ensayo y escalera de fases con sello rojo. Color: violeta = tejido cerebral · azul = campo izquierdo · naranja = campo derecho · verde = renacer · ámbar = datos · rojo = daño o aviso.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-par-craneal-2.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-par-craneal-2.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-10-par-craneal-2/`. Código: `src/viral/piezas/op-kit.tsx`, `op1.tsx` y `op2.tsx` (reusa `Neurona` de `ol-kit.tsx`, `Cerebro` de `me-kit.tsx`); datos y tiempos en `src/anim/piezas.ts` (`OP`, `TOP`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-10-par-craneal-2/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-2.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos usan el ritmo real de cada escena.
| Sonido | Cuándo | Cómo |
|---|---|---|
| Colchón | 0–68 s | acordes en Mi menor, Do, La menor, Sol, Re menor y Mi menor sobrio (la cautela final) |
| Gancho y origen | escenas 1–2 | pulsos de los tallos, tics de los axones y campana de las meninges |
| Punto ciego y quiasma | escenas 3–4 | chispa del punto ciego, barrido de «lo rellena» y whoosh del cruce de fibras |
| Regeneración | escena 5 | golpe grave de «no se regenera», burbujeo del olfatorio y tics de las fibras perdidas |
| Reprogramación | escena 6 | tres notas OSK, burbujeo del borrado de marcas y acorde de la fibra que crece |
| Ensayo y cautela | escenas 7–8 | pops de la línea de tiempo y de los participantes, golpe del sello rojo y cierre sobrio |
Sin voz, el nivel total es ≈ −27 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `op-gancho` | «El par craneal dos, el nervio óptico, no es un nervio común: es una extensión de tu cerebro.» | Se forma como una evaginación del diencéfalo; se considera parte del sistema nervioso central (referencias de anatomía; algunas fuentes lo agrupan con los pares craneales periféricos) | Cerebro con dos tallos violeta hasta los ojos |
| 2 | `op-origen` | «Nace del diencéfalo, lo envuelven las meninges y lleva cerca de un millón de fibras desde la retina.» | Mielina de oligodendrocitos y vainas meníngeas; entre 770 000 y 1 700 000 axones por nervio (rango de las referencias) | Corte del nervio con meninges y axones |
| 3 | `op-ciego` | «Donde el nervio sale del ojo no hay fotorreceptores: todos tenemos un punto ciego, y tu cerebro lo rellena sin que lo notes.» | Disco óptico sin conos ni bastones; relleno perceptivo (Mariotte, siglo XVII) | Ojo en corte y demostración de la cruz y el punto |
| 4 | `op-quiasma` | «En el quiasma óptico se cruzan las fibras nasales: lo que ves a la izquierda lo procesa tu hemisferio derecho.» | Las fibras de la retina nasal se cruzan y las temporales no; el campo visual izquierdo de ambos ojos va al hemisferio derecho (StatPearls y textos de neuroanatomía) | Vista desde arriba con fibras azules y naranjas |
| 5 | `op-regenera` | «Pero, al ser parte del cerebro, no se regenera, a diferencia del olfatorio: en el glaucoma, las fibras perdidas no vuelven.» | Los axones del SNC adulto casi no se regeneran; en el glaucoma las células ganglionares perdidas no se reemplazan | Fibras que mueren frente al olfatorio que renace |
| 6 | `op-genes` | «En dos mil veinte, un estudio en ratones usó tres genes para rejuvenecer las células del nervio óptico y mejoró su visión.» | Lu y cols., Nature, diciembre de 2020: OSK (OCT4, SOX2, KLF4) por AAV en ratones; regeneración axonal tras lesión por aplastamiento y mejora de la visión en glaucoma murino y en ratones viejos | Hélice de ADN con marcas que se borran y fibra que crece |
| 7 | `op-ensayo` | «Hoy, un ensayo de fase uno ya prueba esa idea en personas con glaucoma: en octubre informaron que fue bien tolerada.» | ER-100 (Life Biosciences), NCT07290244: inyección intravítrea única + doxiciclina 8 semanas; primer paciente en junio de 2026; datos intermedios del 8 de octubre de 2026 en 3 personas con glaucoma de ángulo abierto: bien tolerado hasta el día 56, sin toxicidad limitante | Línea de tiempo, ojo con jeringa y tres participantes |
| 8 | `op-temprano` | «Es muy temprano: el objetivo es la seguridad, con tres personas, y aún no demuestra que devuelva la vista.» | Objetivo principal: seguridad; la eficacia no está demostrada | Escalera de fases con sello «aún no demuestra» |
| 9 | `CTA` | «Compártelo con alguien que ame el cerebro. Síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Dibujos esquemáticos, no son imágenes médicas.** Los colores de las fibras del quiasma y las marcas de la hélice son ilustrativos.
- **«No es un nervio común»:** el nervio óptico se considera parte del SNC por su origen embrionario, su mielina (oligodendrocitos) y sus meninges; algunas fuentes lo agrupan igual con los pares craneales periféricos. El video dice «no es un nervio común», no «no es un nervio».
- **«Cerca de un millón»:** las referencias dan un rango de 770 000 a 1 700 000 fibras por nervio; la cifra del contador es ilustrativa.
- **Estudio de 2020: SOLO en ratones.** El video lo dice dos veces («en ratones» y «solo en ratones»); no prometas que funcionará igual en humanos.
- **Ensayo de fase 1:** los datos del 8 de octubre de 2026 vienen de un comunicado de prensa de la empresa (resúmenes de prensa especializada); son preliminares, de 3 personas, y el objetivo es la seguridad. El comunicado menciona señales visuales tempranas, que **el video no usa** porque la propia empresa dice que no establecen eficacia. No pude abrir el comunicado original ni la ficha de ClinicalTrials.gov (sin acceso de red a esos sitios): confirma las cifras antes de publicar.
- **No prometas cura ni vista:** el video cierra diciendo que aún no demuestra que devuelva la vista. El glaucoma se trata con indicación médica; esto no es consejo médico.
- **No pude abrir** los artículos originales (Lu y cols., 2020; ficha del ensayo): trabajé con resúmenes de búsqueda. Fechas y cifras: confirma.
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-par-craneal-2.txt`. Sin voz el audio sale a ≈ −27 LUFS: no lo publiques así.
