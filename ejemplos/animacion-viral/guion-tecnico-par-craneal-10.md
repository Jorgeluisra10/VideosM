# El par craneal X: el vago, el nervio errante · guion técnico (SINAPSIS, 9:16, ≈ 67 s)

**Serie:** pares craneales en SINAPSIS (par X; del 0 al IX salieron antes) · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** ilustración vectorial esquemática sobre fondo oscuro: cuerpo de frente con el vago verde hacia corazón, pulmones e intestino, dos corazones de rana con un tubo de líquido, persona que se desmaya con gota de sangre y reloj de presión, oreja con hisopo y rama del vago, haz de fibras que suben y bajan entre el cerebro y el intestino, nervio recurrente de un humano y de una jirafa, implante en el pecho con trazado de EEG que se calma, cruz médica. Color: verde = vago (X) · rojo = corazón y aorta · azul = pulmones · naranja = intestino · violeta = cerebro · dorado = datos.
**Estructura pedida:** gancho (0–7,5 s) → **aviso rápido de «síguenos en Sinapsis» (7,5–12 s, antes de desarrollar el tema)** → desarrollo → cierre con CTA completo.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-par-craneal-10.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-par-craneal-10.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-17-par-craneal-10/`. Código: `src/viral/piezas/vg-kit.tsx` (`Torso`, `Oreja`, `Lazo`, `Intestino`), `vg1.tsx` y `vg2.tsx` (el aviso `vg-sigue` reusa `SigueActual` de `va1.tsx` con el X en dorado; `Corazon` de `gl-kit.tsx` ahora admite `freq`); datos y tiempos en `src/anim/piezas.ts` (`VG`, `TVG`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-17-par-craneal-10/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-10.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos usan el ritmo real de cada escena.
| Sonido | Cuándo | Cómo |
|---|---|---|
| Colchón | 0–70 s | acordes en Do, Sol, La menor, Mi menor, Fa, Re menor, Do, La menor y Sol |
| Gancho y aviso | escenas 1–2 | pops de los tres órganos (latido, soplo, burbuja), campanas del aviso y tics de los 13 pares |
| Loewi y desmayo | escenas 3–4 | chispas del estímulo, latidos que se frenan y golpe del desmayo |
| Oído, intestino y jirafa | escenas 5–7 | hisopo y tos, tics de las fibras que suben, vaivén largo del recurrente |
| Implante y pregunta | escenas 8–9 | pulsos del estimulador, calma y campana de la pregunta |
Sin voz, el nivel total es ≈ −27 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `vg-gancho` | «El par craneal diez, el vago, significa errante: baja de la cabeza al abdomen y toca corazón, pulmones e intestino.» | «Vagus» = errante (latín); el vago es el nervio más extenso del cuerpo y une el cerebro con corazón, pulmones e intestino (revisión Frontiers Immunol. 2017) | Cuerpo con el vago y sus ramas |
| 2 | `vg-sigue` | «Antes de seguir: síguenos en Sinapsis. No te pierdas ningún par.» | — (aviso de suscripción) | Insignia SINAPSIS, botón seguir y fila de los 13 pares con el X en dorado |
| 3 | `vg-loewi` | «En 1921, Otto Loewi frenó el corazón de una rana con su vago: halló el primer mensajero químico nervioso.» | Experimento de dos corazones de rana (1921): el líquido del corazón estimulado frenó el segundo; «Vagusstoff» = acetilcolina; Nobel 1936 compartido con Dale; **la anécdota del sueño es discutida** (Nobel Foundation, Wikipedia/Vagusstoff) | Dos corazones, tubo de líquido y chispas |
| 4 | `vg-desmayo` | «Por eso ver sangre o estar mucho de pie puede frenar el corazón y provocar un desmayo: el vasovagal.» | Síncope vasovagal: aumento súbito de la actividad vagal (bradicardia) y caída del tono simpático; el mecanismo exacto sigue en debate (PMC, PubMed) | Persona que cae, corazón lento y reloj de presión |
| 5 | `vg-oido` | «Una rama del vago llega al conducto del oído: en algunas personas, tocarlo provoca tos.» | Reflejo de Arnold (rama auricular del vago): ≈ 2–4 % de la población general (4,2 % y 2,3 % en dos series; ≈ 2 % en sanos); ≈ 23–26 % en adultos con tos crónica (Dicpinigaitis y cols., *Chest* 2018) | Oreja, hisopo y rama |
| 6 | `vg-intestino` | «Y habla con el intestino: se estima que la mayoría de sus fibras llevan información del cuerpo al cerebro.» | Se cita ≈ 80 % aferentes / 20 % eferentes (revisión Frontiers 2018, cifra de un estudio en gatos de 1957; otro estudio en rata discute esa proporción) | Fibras que suben y bajan |
| 7 | `vg-jirafa` | «Su rama de la voz, el laríngeo recurrente, baja y vuelve a subir: en la jirafa mide varios metros.» | El recurrente rodea el cayado de la aorta; en la jirafa se estima ≈ 4,5 m (hasta ≈ 5 m según Wedel 2011) | Lazo humano vs jirafa |
| 8 | `vg-implante` | «Hoy, un implante que estimula el vago ayuda a algunos pacientes con epilepsia que no responden a los fármacos.» | VNS aprobada por la FDA en 1997 para epilepsia refractaria (Europa 1994) y en 2005 para depresión resistente, con **evidencia discutida** | Torso con estimulador y EEG |
| 9 | `vg-prueba` | «Si te desmayas sin explicación, consulta a un médico. ¿Te desmayas al ver sangre? Cuéntame en comentarios.» | Mensaje de seguridad + pregunta de interacción | Cruz médica y gota |
| 10 | `CTA` | «Compártelo con alguien que ame el cerebro. Síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Dibujos esquemáticos, no son imágenes médicas.** El cuerpo, el oído y el recurrente están simplificados y fuera de escala.
- **Loewi:** el experimento es sólido, pero la anécdota de que lo soñó es discutida; el video no la afirma. «Primer mensajero químico nervioso» equivale a «primer neurotransmisor» en el lenguaje habitual.
- **Desmayo vasovagal:** el mecanismo exacto sigue en debate (algunos autores destacan la caída del gasto cardíaco más que la vasodilatación); el video dice «puede».
- **Reflejo del oído:** ≈ 2–4 % es una estimación de series; no es peligroso en sí, pero **no hay que meterse objetos en el oído** (el video lo avisa).
- **Intestino:** la cifra del ≈ 80 % aferente viene de estudios antiguos y se discute; el video dice «se estima que la mayoría». No se hacen promesas sobre «microbiota», «ánimo» ni «trucos para activar el vago»: no pude confirmar su evidencia en la búsqueda.
- **Jirafa:** ≈ 4,5 m es una estimación; el video dice «varios metros».
- **Implante:** la estimulación vagal en epilepsia refractaria es un tratamiento médico establecido; en depresión la evidencia es más discutida y no se menciona en la voz. Se hace bajo control médico.
- **Seguridad:** el video no diagnostica. Un desmayo sin explicación, con dolor de pecho, palpitaciones o tras un golpe en la cabeza requiere valoración médica.
- **No sirve para autodiagnóstico** ni es consejo médico. No respondas casos en los comentarios.
- **No pude abrir** los artículos originales; trabajé con resúmenes de búsqueda. Confirma antes de usarlo en un trabajo.
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-par-craneal-10.txt`. Sin voz el audio sale a ≈ −27 LUFS: no lo publiques así.
