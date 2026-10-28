# «Los 4 tejidos que te construyen» · guion técnico (SINAPSIS, 9:16, ≈ 35 s)

**Serie:** anatomía humana / curiosidades médicas · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** ráfaga de datos sobre estudio azul marino; cada tejido tiene su color (epitelial turquesa, conectivo dorado/rojo, muscular coral, nervioso azul) y entra con una transición distinta (zoom, semitono, corte).
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-tejidos.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-tejidos.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-10-28-cuatro-tejidos/`. Código: `src/viral/piezas/tej1.tsx` y `tej2.tsx`; datos y tiempos en `src/anim/piezas.ts` (`TEJ`, `TTJ`, `PIEZAS`).

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `tej-gancho` | «Todo tu cuerpo son solo cuatro tejidos. Uno es líquido.» | Los cuatro tejidos básicos (epitelial, conectivo, muscular, nervioso); la sangre es tejido conectivo | Cuatro baldosas animadas; la del conectivo ondea y se marca «líquido» |
| 2 | `tej-epitelial` | «Epitelial: tu estómago produce ácido que corroe metales, pero su revestimiento se renueva en días.» | pH gástrico ≈ 1,5–3,5; el ácido puede atacar algunos metales pero muy despacio (verificación de datos de Africa Check); epitelio digestivo se renueva en 3–5 días (Sender y Milo, *Nat Med* 2021) | Ácido que burbujea sobre un metal, moco y diez células que se dañan y son reemplazadas; reloj de 4 días |
| 3 | `tej-sangre` | «Conectivo: la sangre, tejido líquido, pasa de dos kilómetros por hora en la aorta.» | Velocidad pico en la aorta ≈ 0,5–1,7 m/s según el punto de medida (≈ 2–6 km/h); la media es menor | Aorta con glóbulos rojos y blancos que aceleran en cada latido + velocímetro |
| 4 | `tej-hueso` | «Tus huesos también son conectivo: se renuevan casi por completo cada diez años.» | Remodelado óseo del adulto: ≈ 10 años para renovar el esqueleto (aproximación; algunas fuentes hablan de 7–10) | Hueso largo que pasa de gris a nuevo de arriba abajo y contador 0 → 10 años; «demolición / construcción» |
| 5 | `tej-muscular` | «Muscular: fuera del cuerpo, con oxígeno, tu corazón sigue latiendo con su propio marcapasos.» | Corazón aislado con perfusión de oxígeno y nutrientes (preparación de Langendorff): el nodo sinusal sigue marcando el ritmo | Corazón en un plato, cable del cerebro que se corta, chispa del nodo sinusal y ECG |
| 6 | `tej-nervioso` | «Nervioso: la mayoría de tus neuronas no se renueva; tienen tu misma edad.» | Spalding et al., *PNAS* 2006: neuronas de la neocorteza = edad de la persona; Sender y Milo 2021: de 3–5 días (epitelio intestinal) a toda la vida (neuronas y cardiomiocitos); glóbulo rojo ≈ 120 días; epidermis ≈ 2–4 semanas | Cuatro barras de vida celular: relevos sin fin frente a una neurona continua |
| 7 | `CTA` | «El cuerpo es una máquina perfecta. Guarda esto y síguenos en Sinapsis.» | — | Cierre SINAPSIS |

## Precauciones antes de publicar (lo que NO se afirma o se matiza)
- **«Ácido que disuelve metal»:** se dice «corroe metales», no «disuelve»: el ácido gástrico ataca algunos metales (el zinc es el ejemplo habitual), pero mucho más despacio que lo que dura la comida en el estómago. No lo presentes como que se disuelven objetos metálicos tragados: **tragar metal es peligroso**.
- **«Persona nueva por dentro dos veces por semana»** (frase del brief): **no se usa**. Solo el revestimiento digestivo se renueva en 3–5 días; no «eres otra persona».
- **«Más de 2 km/h»:** es la velocidad **pico** en la aorta (≈ 0,5–1,7 m/s según el punto de medida). La velocidad **media** de la sangre es menor y en capilares es de milímetros por segundo. Por eso el video dice «en la aorta» y «en cada latido».
- **Huesos:** «casi por completo cada diez años» es una aproximación; depende del hueso (el hueso trabecular se renueva más rápido que el cortical) y de la edad.
- **Corazón fuera del cuerpo:** la fuente son preparaciones de laboratorio en animales (Langendorff) y, en trasplantes, corazones donantes mantenidos con perfusión; **no se puede «sacar un corazón» y que viva sin soporte**. El video dice «con oxígeno».
- **Neuronas:** «la mayoría… tienen tu misma edad» es lo que muestran las de la neocorteza (Spalding 2006). La neurogénesis en el hipocampo adulto humano sigue en debate; el video no dice «todas». Tampoco dice que las neuronas «no se puedan dañar ni curar».
- **CTA acortada:** el pedido traía «Si quieres seguir descubriendo cómo funcionas por dentro, guarda este video y síguenos en Sinapsis» (≈ 10 s). Se acortó para respetar la duración.

## Fuentes consultadas (búsqueda web, sesión del 28-oct-2026)
- Sender R. y Milo R., *Nature Medicine* 2021 (vida de las células: 3–5 días en el epitelio intestinal hasta toda la vida en neuronas y cardiomiocitos).
- Spalding K. et al., *Cell* 2005 y *PNAS* 2006 («Neocortical neurogenesis in humans is restricted to development»).
- Africa Check, «Yes, our stomach acid can theoretically dissolve some metals» (pH 1,5–3,5; solo algunos metales y despacio).
- Referencias de Doppler aórtico (picos ≈ 0,5–1,75 m/s) y de remodelado óseo (≈ 10 años; Manolagas, *Endocr Rev* 2000, citado por terceros: no se pudo leer el original en la sesión).
- Preparaciones de Langendorff y actividad del nodo sinusal en corazones aislados (revisiones y estudios en rata y perro).
