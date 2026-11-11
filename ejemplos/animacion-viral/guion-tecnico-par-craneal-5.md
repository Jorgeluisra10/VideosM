# El par craneal V: el picante no es un sabor · guion técnico (SINAPSIS, 9:16, ≈ 62 s)

**Serie:** pares craneales en SINAPSIS (par V; el 0, I, II, III y IV salieron antes) · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** ilustración vectorial esquemática sobre fondo oscuro: círculos de los cinco sabores básicos con un chile que no está en la lista, canal TRPV1 en la membrana que se abre con la capsaicina, medalla del Nobel, termómetro que no cambia con el mentol, cara con tres zonas V1/V2/V3, helado y dolor en la frente, rayo de dolor y tarjeta de votación picante contra helado con globo de comentarios. Color: rojo-naranja = calor y picante · azul hielo = frío · dorado = nervio trigémino y datos · rojo = dolor · verde = receptor.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-par-craneal-5.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-par-craneal-5.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-13-par-craneal-5/`. Código: `src/viral/piezas/tg-kit.tsx`, `tg1.tsx` y `tg2.tsx` (reusa `Cerebro` de `me-kit.tsx`, `polyPt` de `op-kit.tsx` y `Flecha` de `tr-kit.tsx`); datos y tiempos en `src/anim/piezas.ts` (`TG`, `TTG`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-13-par-craneal-5/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-5.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos usan el ritmo real de cada escena.
| Sonido | Cuándo | Cómo |
|---|---|---|
| Colchón | 0–65 s | acordes en La menor, Fa, Sol, Do, Re menor, Mi menor y La mayor (pregunta abierta) |
| Gancho y capsaicina | escenas 1–2 | pop del chile, golpe del «no es un sabor», apertura del canal TRPV1 y quemadura que sube al cerebro |
| Nobel y mentol | escenas 3–4 | campanas de la medalla y destello de hielo del receptor del frío |
| Ramas y congelamiento | escenas 5–6 | pops de V1, V2 y V3, masticación, barrido del frío y chispa en la frente |
| Neuralgia y comentarios | escenas 7–8 | golpes de las descargas y pops de las dos opciones de la pregunta |
Sin voz, el nivel total es ≈ −27 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `tg-gancho` | «El picante no es un sabor: es dolor y calor que detecta el nervio trigémino, el par craneal cinco.» | No es uno de los cinco sabores básicos (dulce, salado, ácido, amargo, umami); es quimiestesia: sensación de calor y dolor de terminaciones nerviosas, sobre todo del trigémino (marco estándar; no hallé una fuente específica en la búsqueda) | Cinco sabores con un chile fuera de la lista |
| 2 | `tg-capsaicina` | «En el chile, la capsaicina activa el receptor de calor TRPV1 y tu cerebro cree que te estás quemando, aunque no hay fuego.» | La capsaicina activa TRPV1, que responde al calor doloroso (≈ 43 °C; algunas fuentes dicen > 40 °C) (comunicado del Nobel y resúmenes) | Canal TRPV1 que se abre y señal al cerebro |
| 3 | `tg-nobel` | «Por descubrir ese receptor, David Julius compartió el Nobel de Medicina de dos mil veintiuno.» | Nobel de Fisiología o Medicina 2021: David Julius y Ardem Patapoutian, «por sus descubrimientos de receptores de temperatura y tacto» (nobelprize.org) | Medalla y tarjetas de los dos premiados |
| 4 | `tg-mentol` | «Con el mentol pasa lo contrario: activa el receptor del frío y sientes fresco sin bajar la temperatura.» | El mentol activa TRPM8 (receptor del frío); sensación de frescor sin cambio real de temperatura (resúmenes; estructura 2026); TRPM8 no es el único sensor de frío | Termómetro quieto y canal TRPM8 |
| 5 | `tg-ramas` | «El trigémino, el nervio craneal más grande, tiene tres ramas y también mueve los músculos de la masticación.» | El mayor de los pares craneales; V1 oftálmica, V2 maxilar y V3 mandibular (solo V3 con fibras motoras) (StatPearls, textos de anatomía) | Cara con tres zonas y masticación |
| 6 | `tg-helado` | «Y se cree que explica el congelamiento cerebral: cuando el frío toca el paladar, el dolor aparece en la frente.» | Dolor referido de corta duración; se atribuye a respuestas vasculares y nerviosas por el frío; el trigémino lo transmite; el mecanismo exacto no está cerrado (divulgación; fuentes de calidad mixta) | Helado, paladar frío y dolor en la frente |
| 7 | `tg-neuralgia` | «A veces el nervio se irrita: en la neuralgia del trigémino, un roce o el viento pueden desencadenar descargas de dolor.» | Neuralgia del trigémino: dolor facial unilateral (sobre todo V2 y V3); desencadenantes: tocar la cara, cepillarse los dientes, aire frío o viento (StatPearls, eMedicine) | Cara con rayo de dolor y dos desencadenantes |
| 8 | `tg-comenta` | «Ahora dime en los comentarios: ¿aguantas el picante, o el congelamiento cerebral te vence primero?» | Pregunta de participación (sin dato científico) | Tarjeta picante contra helado, globo y escala 1–10 |
| 9 | `CTA` | «Compártelo con alguien que ame el cerebro. Síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Dibujos esquemáticos, no son imágenes médicas.** El canal TRPV1, la cara y los recorridos son simplificaciones; no a escala.
- **«El picante no es un sabor»:** es el marco estándar (no es uno de los cinco sabores básicos; es quimiestesia). La búsqueda no me dio una fuente específica, así que confírmalo en tu libro de fisiología. El video dice «es dolor y calor que detecta el nervio trigémino» como simplificación: otras fibras sensitivas también participan.
- **Calor doloroso de TRPV1:** la cifra (≈ 43 °C; otras fuentes > 40 °C) aparece solo en la fuente al pie, no en la voz.
- **Congelamiento cerebral:** el mecanismo no está cerrado; por eso el video dice «se cree». No se da prevalencia ni duración.
- **Neuralgia del trigémino:** es una condición dolorosa seria; se menciona de forma informativa y sin diagnosticar. En pantalla se avisa: si tienes dolor facial intenso, consulta con un médico. No es consejo médico. No uses expresiones alarmistas ni apodos de la enfermedad.
- **Comentarios:** responde con curiosidad, no diagnostiques dolores ajenos ni recomiendes tratamientos; si alguien describe dolor facial intenso, sugiere consultar a un médico.
- **No pude abrir** los artículos originales; trabajé con resúmenes de búsqueda (nobelprize.org, StatPearls, eMedicine, divulgación). Confirma antes de usarlo en un trabajo.
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-par-craneal-5.txt`. Sin voz el audio sale a ≈ −27 LUFS: no lo publiques así.
