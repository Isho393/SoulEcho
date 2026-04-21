"""
Test de la pipeline STT complète.
Simule ce que le frontend envoie : un webm fragmenté (timeslice=1000ms).

Étapes :
1. Génère un fichier WAV de test avec du vrai signal audio (sinus + bruit)
2. Convertit en webm fragmenté via PyAV (simule MediaRecorder)
3. Envoie à STTService.transcribe() et vérifie le résultat
4. Teste aussi la conversion PyAV directement

Usage : python test_stt.py
"""
import asyncio
import io
import logging
import os
import struct
import sys
import tempfile
import wave

import numpy as np

logging.basicConfig(level=logging.INFO, format="%(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("test_stt")


# ─── 1. Générer un WAV de test avec signal audio réaliste ───────────────────

def generate_test_wav(duration_s: float = 3.0, sample_rate: int = 16000) -> bytes:
    """
    Génère un WAV avec un signal qui ressemble à de la parole :
    - Plusieurs fréquences (formants vocaux typiques)
    - Amplitude modulée (comme une voix)
    - Bruit de fond léger
    """
    t = np.linspace(0, duration_s, int(sample_rate * duration_s))

    # Formants vocaux typiques (Hz)
    signal = (
        0.4 * np.sin(2 * np.pi * 200 * t) +   # fondamentale
        0.3 * np.sin(2 * np.pi * 800 * t) +   # 1er formant
        0.2 * np.sin(2 * np.pi * 1200 * t) +  # 2e formant
        0.1 * np.sin(2 * np.pi * 2400 * t)    # 3e formant
    )

    # Modulation d'amplitude (syllabe ~3Hz)
    envelope = 0.5 + 0.5 * np.sin(2 * np.pi * 3 * t)
    signal = signal * envelope

    # Bruit léger
    signal += 0.02 * np.random.randn(len(t))

    # Normaliser et convertir en int16
    signal = signal / np.max(np.abs(signal)) * 0.8
    samples = (signal * 32767).astype(np.int16)

    buf = io.BytesIO()
    with wave.open(buf, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(samples.tobytes())
    return buf.getvalue()


# ─── 2. Convertir WAV → WebM fragmenté via PyAV (simule MediaRecorder) ──────

def wav_to_webm_fragmented(wav_bytes: bytes) -> bytes:
    """
    Convertit un WAV en WebM Opus fragmenté.
    Simule ce que MediaRecorder(timeslice=1000) produit dans Chrome.
    """
    import av

    wav_buf = io.BytesIO(wav_bytes)
    out_buf = io.BytesIO()

    with av.open(wav_buf, 'r', format='wav') as in_container:
        in_stream = in_container.streams.audio[0]

        with av.open(out_buf, 'w', format='webm') as out_container:
            out_stream = out_container.add_stream('libopus', rate=16000)
            out_stream.layout = 'mono'

            for frame in in_container.decode(in_stream):
                frame.pts = None
                for packet in out_stream.encode(frame):
                    out_container.mux(packet)

            # Flush
            for packet in out_stream.encode(None):
                out_container.mux(packet)

    return out_buf.getvalue()


# ─── 3. Tester la conversion PyAV (webm → wav) ───────────────────────────────

def test_pyav_conversion(webm_bytes: bytes) -> bool:
    """Teste que _convert_to_wav_pyav fonctionne sur le webm généré."""
    sys.path.insert(0, os.path.dirname(__file__))
    from services.stt_service import _convert_to_wav_pyav

    with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as f:
        f.write(webm_bytes)
        webm_path = f.name

    wav_path = webm_path + "_out.wav"
    try:
        ok = _convert_to_wav_pyav(webm_path, wav_path)
        if ok:
            size = os.path.getsize(wav_path)
            logger.info(f"✅ Conversion PyAV OK — WAV: {size} bytes")
            return True
        else:
            logger.error("❌ Conversion PyAV a retourné False")
            return False
    finally:
        os.unlink(webm_path)
        if os.path.exists(wav_path):
            os.unlink(wav_path)


# ─── 4. Tester la transcription complète ─────────────────────────────────────

async def test_transcription(webm_bytes: bytes) -> str:
    """Teste STTService.transcribe() avec le webm fragmenté."""
    sys.path.insert(0, os.path.dirname(__file__))
    from services.stt_service import STTService

    stt = STTService()
    text = await stt.transcribe(
        audio_bytes=webm_bytes,
        language="fr",
        audio_format="webm",
    )
    return text


# ─── 5. Tester avec un vrai fichier WAV (baseline) ───────────────────────────

async def test_transcription_wav(wav_bytes: bytes) -> str:
    """Teste STTService.transcribe() directement avec un WAV — baseline."""
    sys.path.insert(0, os.path.dirname(__file__))
    from services.stt_service import STTService

    stt = STTService()
    text = await stt.transcribe(
        audio_bytes=wav_bytes,
        language=None,   # auto-détection
        audio_format="wav",
    )
    return text


# ─── Main ─────────────────────────────────────────────────────────────────────

async def main():
    print("\n" + "="*60)
    print("TEST PIPELINE STT — SoulEcho")
    print("="*60 + "\n")

    # 1. Générer le WAV de test
    print("1. Génération du signal audio de test...")
    wav_bytes = generate_test_wav(duration_s=3.0)
    print(f"   WAV généré: {len(wav_bytes)} bytes, 3s à 16kHz\n")

    # 2. Convertir en WebM
    print("2. Conversion WAV → WebM (simulation MediaRecorder)...")
    try:
        webm_bytes = wav_to_webm_fragmented(wav_bytes)
        print(f"   WebM généré: {len(webm_bytes)} bytes\n")
    except Exception as e:
        print(f"   ❌ Erreur conversion WebM: {e}")
        print("   → Test avec WAV directement\n")
        webm_bytes = None

    # 3. Tester la conversion PyAV
    if webm_bytes:
        print("3. Test conversion PyAV (webm → wav)...")
        ok = test_pyav_conversion(webm_bytes)
        print()

    # 4. Test transcription WAV (baseline)
    print("4. Test transcription WAV (baseline — signal synthétique)...")
    print("   Note: Whisper ne peut pas transcrire un signal synthétique,")
    print("   mais il doit retourner '' sans erreur (pas de crash).")
    try:
        text_wav = await test_transcription_wav(wav_bytes)
        print(f"   Résultat WAV: '{text_wav}' (vide attendu pour signal synthétique)")
        print(f"   ✅ Pipeline WAV fonctionnelle (pas de crash)\n")
    except Exception as e:
        print(f"   ❌ Erreur pipeline WAV: {e}\n")

    # 5. Test transcription WebM
    if webm_bytes:
        print("5. Test transcription WebM (simulation frontend)...")
        try:
            text_webm = await test_transcription(webm_bytes)
            print(f"   Résultat WebM: '{text_webm}' (vide attendu pour signal synthétique)")
            print(f"   ✅ Pipeline WebM fonctionnelle (pas de crash)\n")
        except Exception as e:
            print(f"   ❌ Erreur pipeline WebM: {e}\n")

    # 6. Test avec un vrai fichier audio si disponible
    real_audio = None
    for path in ["test_audio.wav", "test_audio.webm", "test_audio.mp3"]:
        if os.path.exists(path):
            real_audio = path
            break

    if real_audio:
        print(f"6. Test avec fichier audio réel: {real_audio}")
        with open(real_audio, 'rb') as f:
            audio_bytes = f.read()
        ext = real_audio.split('.')[-1]
        try:
            from services.stt_service import STTService
            stt = STTService()
            text = await stt.transcribe(audio_bytes=audio_bytes, language="fr", audio_format=ext)
            print(f"   ✅ Transcription: '{text}'\n")
        except Exception as e:
            print(f"   ❌ Erreur: {e}\n")
    else:
        print("6. Pas de fichier audio réel trouvé.")
        print("   → Pour tester avec ta voix, enregistre un fichier 'test_audio.wav'")
        print("   → et relance ce script.\n")

    print("="*60)
    print("RÉSUMÉ")
    print("="*60)
    print("Si les étapes 4 et 5 n'ont pas crashé → la pipeline est fonctionnelle.")
    print("La transcription vide sur signal synthétique est NORMALE.")
    print("Whisper ne peut transcrire que de la vraie parole humaine.")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
