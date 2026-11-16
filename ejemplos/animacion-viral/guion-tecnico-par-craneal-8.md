# El par craneal VIII: el nervio que oye y equilibra · guion técnico (SINAPSIS, 9:16, ≈ 68 s)

**Serie:** pares craneales en SINAPSIS (par VIII; del 0 al VII salieron antes) · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** ilustración vectorial esquemática sobre fondo oscuro: cóclea en espiral ámbar que se desenrolla, tres canales semicirculares turquesa, célula ciliada azul con su pelito comparado con un átomo, filas de células que se aplastan con el ruido y se regeneran en el ave, membrana con piedritas, nivel de burbuja, copa y cama que gira, cabeza con ojos que compensan frente a un celular que se borra. Color: ámbar = coclear (oír) · turquesa = vestibular (equilibrio) · lavanda = nervio VIII · azul = células ciliadas · rojo = daño · dorado = datos.
**Estructura pedida:** gancho (0–6,5 s) → **aviso rápido de «síguenos en Sinapsis» (6,5–11 s, antes de desarrollar el tema)** → desarrollo → cierre con CTA completo.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-par-craneal-8.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-par-craneal-8.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-16-par-craneal-8/`. Código: `src/viral/piezas/va-kit.tsx` (`Coclea`, `Cilio`, `Atomo`, `Canales`, `Nivel`, `Piedritas`, `Cabeza`), `va1.tsx` y `va2.tsx` (reusa `Ambiente`/`Chip`/`Cerebro` de `me-kit.tsx` vía `fa-kit.tsx` e `InsigniaSinapsis` de `plantillas1.tsx`); datos y tiempos en `src/anim/piezas.ts` (`VA`, `TVA`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-16-par-craneal-8/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-8.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos usan el ritmo real de cada escena.
| Sonido | Cuándo | Cómo |
|---|---|---|
| Colchón | 0–70 s | acordes en Do, Sol, Mi menor, Fa, Re menor, La menor sobrio (el ruido), Do, Mi menor y Sol |
| Gancho y aviso | escenas 1–2 | pops de las dos ramas, destello del átomo, campanas del aviso y tics de los 13 pares |
| Ramas y cóclea | escenas 3–4 | pops coclear/vestibular, subida del desenrollado y contador hasta quince mil |
| Átomo y ruido | escenas 5–6 | tics de los pelitos, golpe del ruido fuerte y renacer de las aves |
| Equilibrio, alcohol y reflejo | escenas 7–9 | burbuja del nivel, clics de piedritas, vaivén del mareo y de la cama, tics del reflejo y campana de la pregunta |
Sin voz, el nivel total es ≈ −27 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `va-gancho` | «Un nervio te deja oír y no caerte. Sus células sienten movimientos del tamaño de un átomo.» | Las dos ramas del VIII (coclear y vestibular); el «átomo» es el desplazamiento del pelito de las células ciliadas en el umbral de audición (≈ 0,3 nm; Gillespie, NCBI Bookshelf, Collège de France) | Cóclea, canales, nervio y célula vs átomo |
| 2 | `va-sigue` | «Antes de seguir: síguenos en Sinapsis. No te pierdas ningún par.» | — (aviso de suscripción) | Insignia SINAPSIS, botón seguir y fila de los 13 pares |
| 3 | `va-par` | «Es el par craneal ocho: una rama para oír, la coclear, y otra para el equilibrio, la vestibular.» | El VIII (vestibulococlear) lleva audición y equilibrio | Tronco y dos ramas |
| 4 | `va-coclea` | «Dentro del oído hay un caracol del tamaño de un guisante, la cóclea, con unas quince mil células ciliadas.» | ≈ 3 500 internas + ≈ 11 000–12 500 externas por cóclea (BioNumbers, Britannica, Amplifon); el tamaño de guisante es una comparación habitual que no pude confirmar en la búsqueda | Espiral frente a guisante y tubo desenrollado con puntos |
| 5 | `va-atomo` | «Con el sonido más débil que oyes, sus pelitos se mueven apenas el ancho de un átomo.» | Haz de estereocilios ≈ 0,3 nm en el umbral (≈ diámetro de un átomo de oro; en otras revisiones < 1 nm); NO es el desplazamiento del tímpano; un átomo de hidrógeno mide ≈ 0,1 nm, por eso se dice «un átomo» sin precisar cuál | Célula ciliada grande y átomo |
| 6 | `va-ruido` | «En humanos no se regeneran: el ruido fuerte puede dañarlas de forma permanente. Las aves sí las renuevan.» | En la cóclea de mamíferos adultos las células ciliadas no se regeneran; aves y peces sí (revisiones en PMC y cochlea.eu); en el vestíbulo de roedores hay regeneración parcial | Dos filas: humano y ave |
| 7 | `va-equilibrio` | «El equilibrio: tres canales con líquido, como niveles de burbuja, y piedritas diminutas que sienten la gravedad.» | Tres canales semicirculares (rotación) y órganos otolíticos con cristales de carbonato de calcio, las otoconias (aceleración lineal e inclinación) | Canales, nivel y membrana con piedritas |
| 8 | `va-alcohol` | «Si una piedrita se suelta, el mundo gira. Y el alcohol puede alterar el sistema: por eso la cama da vueltas.» | Vértigo posicional por otoconias desplazadas; nistagmo posicional alcohólico por la «hipótesis de la cúpula ligera» (etanol cambia la densidad de la cúpula respecto de la endolinfa); el orden de difusión no está del todo aclarado | Canal con piedrita, copa, cabeza mareada y cama |
| 9 | `va-reflejo` | «Mueve la cabeza leyendo esto: tus ojos se compensan solos. ¿Te mareas leyendo en el coche? Cuéntame en comentarios.» | Reflejo vestíbulo-ocular con latencia ≈ 7–15 ms (Collewijn y Smeets 2000, revisiones); mareo en el coche como conflicto visual-vestibular (explicación habitual) | Cabeza que lee vs celular que se borra |
| 10 | `CTA` | «Compártelo con alguien que ame el cerebro. Síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Dibujos esquemáticos, no son imágenes médicas.** La cóclea, los canales (trébol) y las células están simplificados y fuera de escala.
- **El «átomo» es del pelito, no del tímpano:** ≈ 0,3 nm es el desplazamiento del haz de estereocilios en el umbral de audición; no digas que «el tímpano se mueve menos que un átomo» (esa cifra viene de otras mediciones). La comparación con un átomo de hidrógeno (≈ 0,1 nm) no aplica a 0,3 nm.
- **Guisante:** comparación habitual del tamaño de la cóclea; no la pude confirmar en la búsqueda.
- **Quince mil células:** cifra redondeada (≈ 3 500 internas + 11 000–12 500 externas; las fuentes difieren).
- **Regeneración:** vale para la cóclea de mamíferos adultos; en roedores se observa regeneración parcial en el vestíbulo.
- **Alcohol:** es una hipótesis (cúpula ligera) y el mecanismo exacto no está cerrado; el video dice «puede».
- **Seguridad:** el video no diagnostica. Un mareo intenso con debilidad, dificultad para hablar, visión doble o dolor de cabeza fuerte requiere atención médica urgente (pudiera ser un ictus). Protege tus oídos: baja el volumen de los auriculares.
- **No sirve para autodiagnóstico** ni es consejo médico. No respondas casos en los comentarios.
- **No pude abrir** los artículos originales; trabajé con resúmenes de búsqueda. Confirma antes de usarlo en un trabajo.
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-par-craneal-8.txt`. Sin voz el audio sale a ≈ −27 LUFS: no lo publiques así.
