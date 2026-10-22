"""
Ayudante de voz para VideMed (lo llama scripts/generar-voz.mjs).

Usa la API de edge-tts (100% gratis, sin API key) con boundary="WordBoundary"
para obtener el instante exacto de CADA palabra. El CLI `edge-tts --write-subtitles`
solo entrega frases enteras en las versiones nuevas, y eso no sirve para
resaltar palabra por palabra.

Salida:
  --mp3  audio de la voz
  --vtt  WebVTT con UNA palabra por cue (HH:MM:SS.mmm)
"""
import argparse
import asyncio
import sys

try:
    import edge_tts
except ImportError:
    sys.stderr.write("Falta edge-tts. Ejecuta: python -m pip install edge-tts\n")
    sys.exit(3)


def fmt(seg: float) -> str:
    ms_total = max(0, int(round(seg * 1000)))
    h, resto = divmod(ms_total, 3600_000)
    m, resto = divmod(resto, 60_000)
    s, ms = divmod(resto, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


async def sintetizar(texto, voz, velocidad, tono, volumen, boundary):
    kwargs = dict(rate=velocidad, pitch=tono, volume=volumen)
    try:
        com = edge_tts.Communicate(texto, voz, boundary=boundary, **kwargs)
    except TypeError:
        # edge-tts antiguo: no tiene el parámetro boundary (siempre WordBoundary)
        com = edge_tts.Communicate(texto, voz, **kwargs)
    audio = bytearray()
    marcas = []
    async for ch in com.stream():
        if ch["type"] == "audio":
            audio.extend(ch["data"])
        elif ch["type"] in ("WordBoundary", "SentenceBoundary"):
            marcas.append(
                (ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"])
            )
    return bytes(audio), marcas


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--texto-archivo", required=True)
    ap.add_argument("--voz", default="es-AR-TomasNeural")
    ap.add_argument("--velocidad", default="+0%")
    ap.add_argument("--tono", default="+0Hz")
    ap.add_argument("--volumen", default="+0%")
    ap.add_argument("--mp3", required=True)
    ap.add_argument("--vtt", required=True)
    a = ap.parse_args()

    with open(a.texto_archivo, "r", encoding="utf-8") as f:
        texto = f.read().strip()
    if not texto:
        sys.stderr.write("El guion está vacío.\n")
        sys.exit(2)

    audio, marcas = b"", []
    for intento in range(1, 4):
        try:
            audio, marcas = await sintetizar(
                texto, a.voz, a.velocidad, a.tono, a.volumen, "WordBoundary"
            )
            if audio and marcas:
                break
            sys.stderr.write(f"Intento {intento}: sin audio o sin marcas, reintentando...\n")
        except Exception as e:  # red caída, servicio ocupado, etc.
            sys.stderr.write(f"Intento {intento} falló: {type(e).__name__}: {e}\n")
            await asyncio.sleep(1.5 * intento)

    if not audio:
        sys.stderr.write("No se pudo generar el audio (¿hay internet?).\n")
        sys.exit(4)

    if not marcas:
        # Último recurso: repartir el tiempo por longitud de palabra.
        sys.stderr.write("Aviso: el servicio no devolvió marcas por palabra; se estiman.\n")
        dur = len(audio) * 8 / 48000.0  # edge-tts => mp3 mono 48 kbps
        palabras = texto.split()
        total = sum(len(p) + 2 for p in palabras)
        t = 0.1
        util = max(0.5, dur - 0.2)
        for p in palabras:
            d = util * (len(p) + 2) / total
            marcas.append((t, t + d, p))
            t += d

    with open(a.mp3, "wb") as f:
        f.write(audio)

    lineas = ["WEBVTT", ""]
    for i, (ini, fin, palabra) in enumerate(marcas, 1):
        lineas += [str(i), f"{fmt(ini)} --> {fmt(fin)}", palabra, ""]
    with open(a.vtt, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lineas))

    print(f"OK mp3={len(audio)} bytes, palabras={len(marcas)}, voz={a.voz}")


if __name__ == "__main__":
    asyncio.run(main())
