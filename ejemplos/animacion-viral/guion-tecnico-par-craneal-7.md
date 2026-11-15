# El par craneal VII: el nervio de los gestos · guion técnico (SINAPSIS, 9:16, ≈ 66 s)

**Serie:** pares craneales en SINAPSIS (par VII; el 0, I, II, III, IV, V y VI salieron antes) · **Paleta:** `medicina` (marca SINAPSIS) · **Estilo:** ilustración vectorial esquemática sobre fondo oscuro: caras de frente que sonríen, guiñan, fruncen el ceño y soplan una vela, lengua con la punta resaltada, ojo con lágrima y cebolla, limón con saliva, corte lateral del hueso con túnel y nervio rosa, nervio inflamado en rojo, dos caras comparadas (ictus y Bell), cables cruzados y cruz de emergencias. Color: rosa = nervio facial (VII) · rojo = parálisis, inflamación y urgencia · dorado = pista y datos · azul = lágrimas · verde = saliva y confirmación.
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-par-craneal-7.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-par-craneal-7.json --paleta=medicina`. Carpeta de trabajo: `videos/2026-11-15-par-craneal-7/`. Código: `src/viral/piezas/fa-kit.tsx` (`CaraGesto`, `Gota`, `Lengua`), `fa1.tsx` y `fa2.tsx` (reusa `Cerebro`/`Chip`/`Ambiente` de `me-kit.tsx` y `PC` de `pc-kit.tsx`); datos y tiempos en `src/anim/piezas.ts` (`FA`, `TFA`).

## Diseño sonoro
Pista propia por síntesis, sin muestras ni licencias: `videos/2026-11-15-par-craneal-7/componer-musica.mjs`. Se activa con `node scripts/anim/musica.mjs --usar=assets/musica/par-craneal-7.wav` y se retira con `--restaurar` (el WAV no va a git). Los eventos usan el ritmo real de cada escena.
| Sonido | Cuándo | Cómo |
|---|---|---|
| Colchón | 0–68 s | acordes en Sol mayor, Mi menor, Do, Re, La menor, Sol y Mi menor sobrio (la urgencia) |
| Gancho y gestos | escenas 1–2 | tic de la caída, pops de las tarjetas, pops de sonreír y guiñar, ceño grave y soplo de la vela |
| Extras y túnel | escenas 3–4 | gotas de lágrima y saliva, eco del túnel, chispa que viaja y abanico de ramas |
| Bell y frente | escenas 5–6 | golpe de la inflamación, chispas que se cortan y pops de ictus y Bell |
| Cocodrilo y urgencia | escenas 7–8 | masticar, gotas, cables que se cruzan, latido de alerta y pregunta final |
Sin voz, el nivel total es ≈ −27 LUFS; con voz, el render normaliza a −14 LUFS.

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `fa-gancho` | «Si la mitad de la cara se cae, ¿es parálisis de Bell o un ictus? La frente da una pista.» | Una caída brusca de un lado de la cara es una urgencia; la frente es una pista clínica orientativa, no un diagnóstico | Cara con un lado caído y dos tarjetas |
| 2 | `fa-gestos` | «Es el par craneal siete, el facial: el nervio de los gestos. Sonreír, guiñar, fruncir el ceño o soplar una vela.» | El facial (VII) inerva los músculos de la expresión facial | Cuatro caras con gestos |
| 3 | `fa-extras` | «No solo mueve: da el gusto de la punta de la lengua y ordena producir lágrimas y saliva.» | Gusto de los 2/3 anteriores de la lengua (cuerda del tímpano) y fibras parasimpáticas a glándulas lagrimal, submandibular y sublingual | Tres tarjetas: lengua, cebolla, limón |
| 4 | `fa-tunel` | «Viaja por un túnel estrecho, como un cable en un tubo, y sale junto a la oreja abriéndose en ramas.» | Recorre el canal facial del hueso temporal y sale por el agujero estilomastoideo; en la parótida se reparte en ramas | Vista lateral esquemática |
| 5 | `fa-bell` | «Se cree que en Bell el nervio se inflama, se aprieta en su túnel y media cara se queda sin órdenes.» | Mecanismo propuesto (inflamación/compresión en el conducto, con posible relación viral); la causa exacta no está aclarada | Corte del túnel con inflamación |
| 6 | `fa-frente` | «La pista: la frente recibe órdenes de dos lados del cerebro. En el ictus suele salvarse; en Bell, no.» | Lesión central (neurona motora superior): la frente suele conservarse por inervación bilateral; lesión periférica: la afecta | Dos caras comparadas |
| 7 | `fa-cocodrilo` | «Dato curioso, poco frecuente: tras recuperarse, algunos lloran al comer. Son las lágrimas de cocodrilo: cables mal reconectados.» | Síndrome de lágrimas de cocodrilo (regeneración aberrante) tras parálisis facial; poco frecuente (≈ 3 %, no se dice en el video) | Cara que come y llora; cables cruzados |
| 8 | `fa-urgencia` | «Si la cara se cae de golpe, llama a emergencias. Dime en comentarios: ¿puedes subir solo una ceja?» | Mensaje de seguridad general + pregunta de interacción | Cruz de emergencias y burbuja |
| 9 | `CTA` | «Compártelo con alguien que ame el cerebro. Síguenos en Sinapsis.» | — | Cierre de SINAPSIS |

## Precauciones antes de publicar
- **Dibujos esquemáticos, no son imágenes médicas.** Las caras, el túnel y los cables son simplificaciones; no a escala.
- **La pista de la frente es general, con excepciones:** un ictus de tronco puede afectar la frente y otras causas periféricas (por ejemplo enfermedad de Lyme, herpes zóster ótico o tumores) también producen parálisis facial. Por eso el video dice «suele» y recuerda que solo un médico lo valora.
- **Bell «puede parecer un ictus»:** toda caída brusca de un lado de la cara se trata como emergencia hasta que un médico la valore; el video cierra con «llama a emergencias» (sin número, que cambia por país).
- **Parálisis de Bell:** el mecanismo se dice con «se cree»; la causa exacta no está aclarada.
- **Lágrimas de cocodrilo:** poco frecuentes (cifras publicadas ≈ 3 %, que NO se dicen en el video por no haber abierto la fuente).
- **No sirve para autodiagnóstico** ni sustituye la consulta: no es consejo médico. No respondas casos en los comentarios ni digas «tienes Bell/ictus».
- **No pude abrir** los artículos originales; trabajé con resúmenes de búsqueda. Confirma antes de usarlo en un trabajo.
- **Sin voz:** no hay `OPENAI_API_KEY`; la locución está en `ejemplos/animacion-viral/locucion-par-craneal-7.txt`. Sin voz el audio sale a ≈ −27 LUFS: no lo publiques así.
