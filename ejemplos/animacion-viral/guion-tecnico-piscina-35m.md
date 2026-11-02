# «Así se construye una piscina a 35 metros» · guion técnico (IMNOBA, 9:16, ≈ 42 s)

**Marca:** IMNOBA · paleta `imnoba` · **Serie:** ingeniería extrema · **Estilo:** figuras realistas (estudio azul marino de `real-kit.tsx`, torres con vidrio, grúa, apoyo de puente en corte, acrílico con bordes verdosos y agua con ondas), datos con fuente siempre en pantalla.
**Caso real:** la *Sky Pool* de Embassy Gardens (Nine Elms, Londres), HAL Architects y Eckersley O'Callaghan, acrílico de Reynolds Polymer, abierta a residentes el 19 de mayo de 2021. (Hay otro video del mismo caso para SINAPSIS: `guion-tecnico-piscina.md`; este es el ángulo de MONTAJE paso a paso para IMNOBA.)
**Cómo se carga:** `node scripts/anim/desde-respuesta.mjs --idea=ejemplos/animacion-viral/idea-piscina-35m.txt --respuesta=ejemplos/animacion-viral/respuesta-ia-piscina-35m.json --paleta=imnoba`. Carpeta de trabajo: `videos/2026-11-02-piscina-35m/`. Código: `src/viral/piezas/sky-kit.tsx` (`Piscina`, `Bloque`, `Grua`, `Apoyo`, `Regla`, `CotaH`), `sky1.tsx`, `sky2.tsx`; datos y tiempos en `src/anim/piezas.ts` (`SKY`, `TSK`; reusa `PIS`, `presionKPa`, `dilatacionMm`).

| # | Pieza | Voz en off | Dato / fuente | Imagen |
|---|---|---|---|---|
| 1 | `sky-gancho` | «Ciento cincuenta toneladas de agua, a treinta y cinco metros, sin nada debajo. ¿Cómo se construye?» | 35 m, vano ≈ 15 m, 25 m de largo y 3,2 m de profundidad; ≈ 150 t de agua (IStructE) | Dos edificios, la piscina que se llena entre ellos, cota de 35 m y odómetro 0 → 150 t |
| 2 | `sky-espesor` | «Paso uno: el acrílico se flexiona más que el vidrio, por eso su fondo mide treinta y seis centímetros.» | Paredes ≈ 18 cm y fondo ≈ 36 cm (356 mm); acrílico ≈ ¼ de la resistencia y ≈ 20 × más flecha que el vidrio; p = ρ·g·h = 31 kPa | Corte de la canaleta con flechas de presión y barras a la misma escala: pared 18 cm, regla 30 cm, fondo 36 cm |
| 3 | `sky-union` | «Paso dos: se fabrica en secciones y se une con juntas adhesivas transparentes.» | Secciones con juntas adhesivas transparentes, sin juntas mecánicas (IStructE, RIBA J); estructura de 50 a 55 t | Dos bloques de acrílico que se juntan, junta dorada que se vuelve casi invisible y la viga completa en cuatro secciones con odómetro ≈ 50 t |
| 4 | `sky-izado` | «Paso tres: una grúa sube unas cincuenta toneladas, con un margen de apenas treinta centímetros.» | Izado con grúa móvil de la estructura completa; tolerancia ≈ 30 cm (prensa del izado, Ainscough/Ballymore) | Grúa amarilla, cables y estructura que sube 35 m; recuadro con la holgura de ≈ 30 cm entre los topes |
| 5 | `sky-apoyos` | «Paso cuatro: los edificios se mueven distinto. Por eso la piscina descansa sobre apoyos que deslizan y giran.» | Apoyos de puente deslizantes y giratorios (Ballymore); dilatación α·L·ΔT ≈ 35 mm en 25 m con +20 °C (cálculo propio) | Dos edificios que se mecen en sentidos opuestos (movimiento EXAGERADO) y el apoyo en corte que desliza y gira |
| 6 | `sky-llenado` | «Solo entonces se llena: de cero a ciento cincuenta toneladas. ¿Te animarías a nadar ahí?» | ≈ 150 t de agua (≈ 148 m³, IStructE) | La piscina se llena con odómetro y alguien nada; altura del esquema exagerada |
| 7 | `CTA` | «Guárdalo y síguenos en IMNOBA, tu plataforma de propiedades y vehículos.» | — | Cierre con el logo de IMNOBA |

## Precauciones antes de publicar (lo que NO se afirma o se matiza)
- **«Rascacielos»:** el pedido decía dos rascacielos; los edificios de Embassy Gardens son de unas 10 plantas, así que el video dice «edificios». Una frase dice «35 metros»: es la altura de la piscina sobre el suelo.
- **«Viga de más de 30 cm»:** el fondo mide ≈ 36 cm (356 mm); las paredes ≈ 18 cm. Por eso la escena 2 compara pared, regla de 30 cm y fondo.
- **Montaje paso a paso:** el orden «fabricar y unir → izar → apoyar → llenar» es una simplificación didáctica; no es el protocolo constructivo detallado del proyecto. Las fuentes mencionan que la estructura se fabricó por secciones, se transportó y se izó con grúa móvil; no hay fuente abierta sobre el orden exacto de la fabricación.
- **Peso e izado:** la estructura pesa de 50 a 55 t según la fuente; las fuentes discrepan en la capacidad de la grúa (500 t o 750 t con grúa de apoyo): el video NO da capacidad ni duración. El margen de ≈ 30 cm sale de una nota de prensa del izado: confírmalo antes de publicar.
- **Apoyos:** las fuentes dicen «apoyos de puente»; el video dice «deslizan y giran». No se dan milímetros de movimiento de los edificios (no hay cifra): el vaivén es una **ilustración exagerada** y está rotulada. No se afirma que los apoyos eliminen toda la carga ni «ni un gramo de torsión».
- **Dilatación:** α ≈ 70·10⁻⁶ /K → ≈ 35 mm en 25 m con +20 °C. Es un cálculo propio, no un dato del proyecto.
- **Presión:** p = ρ·g·h con 3,2 m = 31,4 kPa en el fondo (hidrostática elemental, rotulada «cálculo propio»).
- **Llenado:** 0 → 150 t es una ilustración; no se conoce el protocolo real de llenado.
- **Vidrio vs acrílico:** no se afirma que el vidrio «se rompería». Solo que el acrílico flexiona más y por eso se hace grueso.
- **Sin promesas inmobiliarias:** el cierre solo invita a seguir IMNOBA; no promete ganancias ni rentabilidades ni asesoría.
- **Esquemas:** todos los gráficos son esquemas. La escena 1 está a escala (22 px por metro); la 6 exagera la altura de la piscina.

## Fuentes (búsqueda web, sesión del 2-nov-2026; Ballymore y Ainscough no se pudieron abrir: se usaron resúmenes de búsqueda)
- Ainscough Crane Hire / Ballymore: izado de la Sky Pool con grúa móvil, tolerancia de ≈ 30 cm, estructura de 50–55 t.
- Eckersley O'Callaghan, RIBA J, Spa Business, Dezeen: acrílico, 25 m × 3,2 m, comparación con el vidrio.
- IStructE Structural Awards 2022: secciones con juntas adhesivas transparentes y ≈ 150 t de agua.
- Hojas de datos de PMMA: densidad 1,18 g/cm³, α ≈ 70–80·10⁻⁶ /K.
