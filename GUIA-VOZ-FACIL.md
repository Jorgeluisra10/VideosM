# Voz fácil con CapCut (sin calibrar nada)

Objetivo: tú pones la voz de CapCut que te gusta y el VIDEO se ajusta a ella. No tienes que medir tiempos ni acelerar clips.

## Los 3 pasos
1. **Abre `texto-capcut.txt`** del video (carpeta `videos/<fecha-tema>/`). Copia todo el bloque **«TEXTO CORRIDO»**.
2. **En CapCut:** Texto → *Texto a voz* → pega el bloque en UN solo texto → elige tu voz favorita (velocidad 1.0x, no la cambies) → genera. Exporta solo el audio (mp3/wav), o el video con voz.
3. **Mándame el audio** en el chat. Yo cuento las pausas, ajusto la duración de cada escena a TU voz, mezclo todo a −14 LUFS y te devuelvo el video final con la voz puesta.

## Si lo quieres hacer tú, en tu computador
`npm run panel` → Estudio → tarjeta «🎙️ Voz en off» → **«Mi voz»** → subes el audio → el video se ajusta solo → «Renderizar».
(Por línea de comandos: `node scripts/anim/voz-externa.mjs --audio=mi-voz.mp3`; para deshacer: `--deshacer`.)

## Si no puedes mandarme el audio (manual)
Crea un texto por escena (la tabla del archivo), colócalo en su segundo de inicio y genera la voz de cada uno con la MISMA voz. Las escenas tienen holgura: con una voz normal (≥ 2,4 palabras por segundo) cada frase termina antes que su escena. Si una se pasa, sube la velocidad de ESE clip a 1.1x–1.2x.

## Consejos para que salga perfecta
- Una sola voz y una sola velocidad para todo el texto.
- No cambies el texto: si lo cambias, la cuenta de pausas deja de coincidir (en ese caso dime y regeneramos el archivo).
- Cada escena es UNA frase terminada en punto: así CapCut deja una pausa natural entre escenas y el corte automático acierta.
- Si una voz lee mal una palabra (nombres propios), escribe cómo suena o prueba otra voz de la lista (las latinas suelen salir mejor).
- La música va como cama suave (≈ −23 LUFS). Con la voz ya mezclada, el video final sale a −14 LUFS.

## Cómo se genera el archivo
`node scripts/anim/texto-capcut.mjs --salida=videos/<carpeta>/texto-capcut.txt [--fonetica="Schultz=Shults"]`
