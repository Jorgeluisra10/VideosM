# El par craneal VI: el chivato de la presión · guion técnico (SINAPSIS, 9:16, ≈ 63 s)

**Serie:** pares craneales en SINAPSIS (par VI; el 0, I, II, III, IV y V salieron antes) · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** ilustración vectorial esquemática sobre fondo oscuro: dos ojos mirando de reojo con sus músculos laterales en verde azulado, ojo con seis músculos en tres colores (VI, IV y III), puente con núcleos y cruce por el fascículo longitudinal medial, vista lateral del clivus y el canal de Dorello con un ligamento dorado, nervio estirado por la presión, cabeza con una masa lejana, esquema del síndrome de Duane y letra E doble horizontal con cruz médica. Color: verde azulado = abducens (VI) · violeta = troclear (IV) · ámbar = oculomotor (III) · rojo = presión, daño y aviso · dorado = ligamento y datos.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-par-craneal-6.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-par-craneal-6.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-14-par-craneal-6/`. Código: `src/viral/piezas/ab-kit.tsx`, `ab1.tsx` y `ab2.tsx` (reusa `OjoP` de `oc-kit.tsx`, `Cabeza` de `pc-kit.tsx`, `Cerebro` de `me-kit.tsx`, `Flecha` de `tr-kit.tsx` y `polyPt` de `op-kit.tsx`); datos y tiempos en `src/anim/piezas.ts` (`AB`, `TAB`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-14-par-craneal-6/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-6.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos usan el ritmo real de cada escena.
| Sonido | Cuándo | Cómo |
|---|---|---|
| Colchón | 0–66 s | acordes en Re menor, Si bemol, La menor, Fa, Mi menor y Re menor sobrio (la alerta) |
| Gancho y regla | escenas 1–2 | whoosh de reojo a ambos lados y pops de LR6, SO4 y «el resto 3» |
| Núcleo y Dorello | escenas 3–4 | cruce de fibras, los dos ojos que se mueven juntos, tics de la subida y golpe del ligamento |
| Presión y falso signo | escenas 5–6 | golpe grave del estiramiento y ondas de la masa lejana |
| Duane y consulta | escenas 7–8 | tics del nervio ausente, golpe de la retracción y cierre sobrio |
Sin voz, el nivel total es ≈ −27 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `ab-gancho` | «Cuando miras de reojo, trabaja el par craneal seis, el abducens, que mueve un solo músculo: el recto lateral.» | El VI inerva solo el recto lateral (abducción); el recto medial del otro ojo lo acompaña (referencias de anatomía) | Dos ojos mirando de lado con sus músculos |
| 2 | `ab-regla` | «Un truco clásico: el recto lateral es del seis, el oblicuo superior del cuatro, y el resto del tres.» | Regla mnemotécnica «LR6 SO4 y el resto 3» (VI recto lateral, IV oblicuo superior, III los demás) | Ojo con los seis músculos en tres colores |
| 3 | `ab-nucleo` | «En el puente nace su núcleo, que además coordina los dos ojos: mueve uno hacia afuera y el otro hacia adentro.» | Motoneuronas para el recto lateral ipsilateral e interneuronas que cruzan por el FLM al oculomotor contralateral (recto medial); una lesión del núcleo produce parálisis de la mirada horizontal, no una parálisis aislada del VI (Neuroanatomy Online UTH, reseñas) | Puente con núcleos y cruce |
| 4 | `ab-dorello` | «Sube pegado al clivus y entra por el canal de Dorello, donde queda anclado bajo un ligamento.» | Nace en la unión pontobulbar, asciende por el clivus y entra al canal de Dorello bajo el ligamento petroclinoideo (de Gruber) (EyeWiki, Stanford Neuro-ophthalmology); las fuentes difieren en detalles del canal | Vista lateral con clivus, canal y ligamento |
| 5 | `ab-presion` | «Cuando sube la presión dentro del cráneo, el nervio anclado puede estirarse y el ojo se desvía hacia adentro.» | El aumento de la presión intracraneal estira el nervio fijo en el canal de Dorello; la presión baja (punción lumbar, fuga de LCR) también puede causar parálisis (EyeWiki, StatPearls) | Nervio estirado y ojo hacia adentro |
| 6 | `ab-falso` | «Es un falso signo localizador: el nervio falla aunque el problema esté lejos, como una masa en otra parte del cerebro.» | Ejemplo clásico de falso signo localizador: la parálisis no indica dónde está la lesión (EyeWiki, Stanford) | Cabeza con masa lejana y nervio que falla |
| 7 | `ab-duane` | «Algunas personas nacen sin él: en el síndrome de Duane, el oculomotor inerva ese músculo y el ojo se retrae.» | Síndrome de Duane: ausencia del VI y reinervación del recto lateral por fibras del III; el globo se retrae al aducir (Science 2008 sobre CHN1 y revisiones); los casos varían | Esquema del nervio ausente y ojo que se retrae |
| 8 | `ab-consulta` | «Si ves doble al mirar hacia los lados, consulta con un médico: este nervio puede ser el primero en avisar.» | La diplopía horizontal que empeora al mirar hacia un lado puede deberse a una parálisis del VI, que requiere estudio (suele indicarse neuroimagen) | Letra E doble horizontal y cruz médica |
| 9 | `CTA` | «Compártelo con alguien que ame el cerebro. Síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Dibujos esquemáticos, no son imágenes médicas.** El puente, el canal de Dorello y el síndrome de Duane son simplificaciones; no a escala.
- **No se dice que el abducens tenga «el recorrido más largo».** Fuentes de estudio dicen que el troclear tiene el recorrido intracraneal más largo y el abducens el segundo; un estudio de autopsias pediátricas halló el abducens bastante más corto: su fragilidad viene de estar anclado en el canal de Dorello. Esto **confirma lo dicho en el video del IV** («recorrido más largo», varias fuentes), pero deja claro que no conviene decir lo mismo del VI.
- **Presión alta y baja:** el video habla de presión que sube (lo clásico); la presión baja también puede causarla. Está en la fuente al pie.
- **Falso signo localizador:** es un concepto clásico; no implica que cualquier parálisis del VI sea una masa: tiene muchas causas. El video dice «puede» y «como una masa» como ejemplo.
- **Duane:** los casos varían (hay variantes); el video lo presenta de forma general.
- **No sirve para autodiagnóstico.** El mensaje final es una advertencia general («consulta con un médico»); no es consejo médico ni diagnóstico. No digas «si ves doble tienes presión alta» ni respondas casos en los comentarios.
- **Facial colliculus (relación con el VII):** no se usa porque no pude confirmarla en la búsqueda.
- **No pude abrir** los artículos originales; trabajé con resúmenes de búsqueda (EyeWiki, Stanford Neuro-ophthalmology, StatPearls, Neuroanatomy Online UTH, PMC). Confirma antes de usarlo en un trabajo.
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-par-craneal-6.txt`. Sin voz el audio sale a ≈ −27 LUFS: no lo publiques así.
