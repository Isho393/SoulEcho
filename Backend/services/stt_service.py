"""
STT Service — Speech-to-Text via faster-whisper (local, gratuit).

Le webm produit par MediaRecorder (Chrome/Firefox) est un conteneur Matroska
fragmenté. La concaténation des chunks peut produire un fichier que ffmpeg
ne décode pas toujours correctement.

Solution : conversion en WAV 16kHz mono via PyAV (inclus avec faster-whisper)
avant de passer à Whisper — pas besoin de ffmpeg système.
"""
import asyncio
import logging
import os
import tempfile
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

logger = logging.getLogger(__name__)

WHISPER_MODEL_SIZE = os.environ.get("WHISPER_MODEL_SIZE", "tiny")
WHISPER_DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")

LANG_MAP: dict[str, str] = {
    "fr": "fr",
    "en": "en",
    "es": "es",
    "de": "de",
    "pt": "pt",
    "ar": "ar",
}

_model = None
_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="whisper")


def _get_model():
    global _model
    if _model is None:
        try:
            from faster_whisper import WhisperModel
            logger.info(f"[STT] Chargement modele '{WHISPER_MODEL_SIZE}' sur {WHISPER_DEVICE} ({WHISPER_COMPUTE_TYPE})...")
            _model = WhisperModel(
                WHISPER_MODEL_SIZE,
                device=WHISPER_DEVICE,
                compute_type=WHISPER_COMPUTE_TYPE,
                num_workers=1,
            )
            logger.info("[STT] Modele charge.")
        except ImportError:
            raise RuntimeError("faster-whisper non installe. Executez : pip install faster-whisper")
    return _model


def _convert_to_wav_pyav(input_path: str, output_path: str) -> bool:
    """
    Convertit un fichier audio en WAV 16kHz mono via PyAV (pas besoin de ffmpeg système).
    PyAV est installé automatiquement avec faster-whisper.
    Retourne True si succès, False sinon.
    """
    try:
        import av
        import numpy as np

        with av.open(input_path) as container:
            audio_stream = next((s for s in container.streams if s.type == 'audio'), None)
            if audio_stream is None:
                logger.error("[STT] Aucun flux audio trouvé dans le fichier")
                return False

            # Rééchantillonner en 16kHz mono PCM
            resampler = av.AudioResampler(
                format='s16',
                layout='mono',
                rate=16000,
            )

            pcm_frames = []
            for frame in container.decode(audio_stream):
                resampled = resampler.resample(frame)
                for r in resampled:
                    pcm_frames.append(r.to_ndarray())

            if not pcm_frames:
                logger.error("[STT] Aucune frame audio décodée")
                return False

            # Concaténer et écrire en WAV
            import wave, struct
            samples = np.concatenate(pcm_frames, axis=1).flatten()

            with wave.open(output_path, 'wb') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)  # 16-bit = 2 bytes
                wav_file.setframerate(16000)
                wav_file.writeframes(samples.tobytes())

            size = os.path.getsize(output_path)
            logger.info(f"[STT] Conversion WAV OK via PyAV: {size} bytes")
            return True

    except ImportError:
        logger.warning("[STT] PyAV non disponible, tentative directe")
        return False
    except Exception as e:
        logger.warning(f"[STT] Conversion PyAV echouee: {e}")
        return False


def _transcribe_sync(audio_path: str, whisper_lang: Optional[str]) -> str:
    """Transcription synchrone dans le thread pool dedie."""
    file_size = os.path.getsize(audio_path)
    logger.info(f"[STT] Fichier entrant: taille={file_size} bytes, langue={whisper_lang}")

    # Convertir en WAV propre avant transcription
    wav_path = audio_path + "_converted.wav"
    converted = _convert_to_wav_pyav(audio_path, wav_path)
    transcribe_path = wav_path if converted else audio_path

    model = _get_model()

    try:
        # Essai avec VAD — seuils assouplis pour accepter la parole courte
        segments, info = model.transcribe(
            transcribe_path,
            language=whisper_lang,
            beam_size=1,
            best_of=1,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 200, "speech_pad_ms": 200},
            condition_on_previous_text=False,
            log_prob_threshold=-2.0,   # défaut -1.0 — moins strict
            no_speech_threshold=0.95,  # défaut 0.6 — accepte plus de parole
        )
        all_segments = list(segments)
        text = " ".join(seg.text.strip() for seg in all_segments).strip()
        detected = info.language if info else "?"
        logger.info(f"[STT] Avec VAD — langue={detected}, segments={len(all_segments)}, texte='{text}'")

        # Si vide → réessayer sans VAD
        if not text:
            logger.warning("[STT] VAD a tout filtre, nouvel essai sans VAD...")
            segments2, info2 = model.transcribe(
                transcribe_path,
                language=whisper_lang,
                beam_size=1,
                best_of=1,
                vad_filter=False,
                condition_on_previous_text=False,
                log_prob_threshold=-2.0,
                no_speech_threshold=0.95,
            )
            all_segments2 = list(segments2)
            text = " ".join(seg.text.strip() for seg in all_segments2).strip()
            detected2 = info2.language if info2 else "?"
            logger.info(f"[STT] Sans VAD — langue={detected2}, segments={len(all_segments2)}, texte='{text}'")

        return text

    finally:
        if converted and os.path.exists(wav_path):
            try:
                os.unlink(wav_path)
            except OSError:
                pass


class STTService:
    """
    Service de transcription audio -> texte.
    Route vers Kaggle GPU si KAGGLE_GPU_URL est configuré,
    sinon utilise faster-whisper local.
    """

    async def transcribe(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None,
        audio_format: str = "webm",
    ) -> str:
        if not audio_bytes:
            return ""

        # ── Kaggle GPU (prioritaire si configuré) ──────────────────────
        from services.kaggle_client import is_kaggle_available, KaggleClient
        if is_kaggle_available():
            try:
                client = KaggleClient()
                text = await client.transcribe(
                    audio_bytes=audio_bytes,
                    language=language or "fr",
                    audio_format=audio_format,
                )
                logger.info(f"[STT] Kaggle GPU → '{text[:80]}'")
                return text
            except Exception as e:
                logger.warning(f"[STT] Kaggle indisponible ({e}), fallback local...")

        # ── Fallback : faster-whisper local ────────────────────────────
        whisper_lang = LANG_MAP.get(language or "", None) if language else None

        suffix = f".{audio_format}"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            loop = asyncio.get_event_loop()
            text = await loop.run_in_executor(_executor, _transcribe_sync, tmp_path, whisper_lang)
            return text
        except Exception as e:
            logger.error(f"[STT] Erreur transcription locale: {e}")
            raise
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


def preload_model() -> None:
    try:
        _get_model()
    except Exception as e:
        logger.warning(f"[STT] Pre-chargement echoue (non bloquant): {e}")
