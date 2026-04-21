"""
Test STT avec enregistrement micro réel — 3 secondes.
Usage : python test_stt_mic.py
"""
import asyncio
import io
import logging
import os
import sys
import wave
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(name)s - %(levelname)s - %(message)s")

DURATION = 3      # secondes
SAMPLE_RATE = 16000

async def main():
    print("\n=== TEST STT AVEC MICRO ===\n")

    # Enregistrement
    try:
        import sounddevice as sd
        print(f"Parle pendant {DURATION} secondes... (démarre dans 1s)")
        await asyncio.sleep(1)
        print("🎙 ENREGISTREMENT...")
        audio = sd.rec(int(DURATION * SAMPLE_RATE), samplerate=SAMPLE_RATE, channels=1, dtype='int16')
        sd.wait()
        print("✅ Enregistrement terminé\n")
    except Exception as e:
        print(f"❌ Erreur micro: {e}")
        return

    # Sauvegarder en WAV
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(audio.tobytes())
    wav_bytes = buf.getvalue()
    print(f"WAV: {len(wav_bytes)} bytes")

    # Sauvegarder pour réutilisation
    with open("test_audio.wav", "wb") as f:
        f.write(wav_bytes)
    print("Sauvegardé dans test_audio.wav\n")

    # Transcrire
    sys.path.insert(0, os.path.dirname(__file__))
    from services.stt_service import STTService
    stt = STTService()

    print("Transcription en cours...")
    text = await stt.transcribe(audio_bytes=wav_bytes, language="fr", audio_format="wav")

    print(f"\n{'='*40}")
    print(f"RÉSULTAT : '{text}'")
    print(f"{'='*40}\n")

    if text:
        print("✅ STT fonctionne correctement !")
    else:
        print("⚠️  Transcription vide — vérifie que tu as bien parlé")

if __name__ == "__main__":
    asyncio.run(main())
