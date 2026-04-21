"""
TTS Service — Text-to-Speech via Piper TTS (local, gratuit, rapide).
Synthétise du texte en audio WAV dans la langue du profil utilisateur.

Optimisations temps réel :
- Modèle Piper chargé une seule fois par langue (cache singleton)
- Exécution dans un thread pool (non-bloquant pour l'event loop FastAPI)
- Texte tronqué à 500 chars pour la voix (le reste est coupé naturellement)

Installation :
    pip install piper-tts huggingface_hub
"""
import asyncio
import io
import logging
import os
import re
import wave
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Répertoire de cache des modèles Piper
PIPER_MODELS_DIR = Path(
    os.environ.get("PIPER_MODELS_DIR", str(Path(__file__).parent.parent / "piper_models"))
)

# Mapping langue → (nom_modèle, qualité)
# "low" = plus rapide, "medium" = meilleure qualité
PIPER_VOICE_MAP: dict[str, tuple[str, str]] = {
    "fr": ("fr_FR-upmc-medium", "medium"),
    "en": ("en_US-lessac-medium", "medium"),
    "es": ("es_ES-davefx-medium", "medium"),
    "de": ("de_DE-thorsten-medium", "medium"),
    "pt": ("pt_BR-faber-medium", "medium"),
    "ar": ("ar_JO-kareem-medium", "medium"),
}

DEFAULT_LANG = "fr"

# Cache des modèles Piper chargés — évite le rechargement à chaque requête
_voice_cache: dict[str, object] = {}
_piper_available: Optional[bool] = None

# Thread pool dédié TTS
_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="piper")


def _check_piper() -> bool:
    global _piper_available
    if _piper_available is not None:
        return _piper_available
    try:
        import piper  # noqa: F401
        _piper_available = True
        logger.info("[TTS] Piper TTS disponible.")
    except ImportError:
        _piper_available = False
        logger.warning("[TTS] Piper TTS non installé. Exécutez : pip install piper-tts")
    return _piper_available


def _get_model_path(lang: str) -> Optional[Path]:
    """Retourne le chemin .onnx du modèle Piper, télécharge si absent."""
    voice_key, quality = PIPER_VOICE_MAP.get(lang, PIPER_VOICE_MAP[DEFAULT_LANG])
    model_dir = PIPER_MODELS_DIR / voice_key
    onnx_path = model_dir / f"{voice_key}.onnx"
    json_path = model_dir / f"{voice_key}.onnx.json"

    if onnx_path.exists() and json_path.exists():
        return onnx_path

    try:
        from huggingface_hub import hf_hub_download
        model_dir.mkdir(parents=True, exist_ok=True)

        logger.info(f"[TTS] Téléchargement du modèle Piper '{voice_key}'...")
        lang_code = voice_key.split("-")[0]  # ex: "fr_FR"
        hf_path_prefix = f"{lang_code.split('_')[0]}/{lang_code}/{quality}"

        for filename in [f"{voice_key}.onnx", f"{voice_key}.onnx.json"]:
            downloaded = hf_hub_download(
                repo_id="rhasspy/piper-voices",
                filename=f"{hf_path_prefix}/{filename}",
                local_dir=str(model_dir),
                local_dir_use_symlinks=False,
            )
            dest = model_dir / filename
            if not dest.exists():
                Path(downloaded).rename(dest)

        logger.info(f"[TTS] Modèle '{voice_key}' téléchargé.")
        return onnx_path if onnx_path.exists() else None

    except Exception as e:
        logger.error(f"[TTS] Impossible de télécharger '{voice_key}': {e}")
        return None


def _get_voice(lang: str):
    """
    Retourne le PiperVoice pour la langue donnée.
    Cache en mémoire — chargé une seule fois par langue.
    """
    if lang not in _voice_cache:
        from piper import PiperVoice
        model_path = _get_model_path(lang)
        if model_path is None:
            raise RuntimeError(f"Modèle Piper introuvable pour la langue '{lang}'.")
        logger.info(f"[TTS] Chargement du modèle '{lang}' en mémoire...")
        _voice_cache[lang] = PiperVoice.load(str(model_path))
        logger.info(f"[TTS] Modèle '{lang}' chargé et mis en cache.")
    return _voice_cache[lang]


def _clean_text(text: str) -> str:
    """Nettoie le texte pour une synthèse naturelle et rapide."""
    # Supprimer les marqueurs markdown
    text = re.sub(r"[*_~`#>]", "", text)
    # Sauts de ligne → pause naturelle
    text = re.sub(r"\n{2,}", ". ", text)
    text = re.sub(r"\n", " ", text)
    # Espaces multiples
    text = re.sub(r" {2,}", " ", text)
    # Limiter à 500 chars pour la voix — au-delà c'est trop long à synthétiser
    # et l'utilisateur n'écoute pas tout de toute façon
    if len(text) > 500:
        # Couper à la dernière phrase complète avant 500 chars
        cut = text[:500]
        last_punct = max(cut.rfind('.'), cut.rfind('!'), cut.rfind('?'))
        text = cut[:last_punct + 1] if last_punct > 200 else cut + "…"
    return text.strip()


def _synthesize_sync(text: str, lang: str) -> bytes:
    """
    Synthèse synchrone — exécutée dans le thread pool dédié.
    Isolée pour ne pas bloquer l'event loop FastAPI.
    """
    voice = _get_voice(lang)
    clean = _clean_text(text)

    wav_buffer = io.BytesIO()
    with wave.open(wav_buffer, "wb") as wav_file:
        voice.synthesize(clean, wav_file)

    wav_bytes = wav_buffer.getvalue()
    logger.info(f"[TTS] OK — langue: {lang}, {len(clean)} chars → {len(wav_bytes)} bytes WAV")
    return wav_bytes


class TTSService:
    """Service de synthèse vocale texte → audio WAV via Piper TTS."""

    async def synthesize(
        self,
        text: str,
        language: Optional[str] = None,
    ) -> bytes:
        """
        Synthétise du texte en audio WAV (non-bloquant).

        Args:
            text: Texte à synthétiser
            language: Code langue ISO (fr, en, es…)

        Returns:
            Bytes du fichier WAV
        """
        if not text.strip():
            return b""

        if not _check_piper():
            raise RuntimeError(
                "Piper TTS n'est pas installé. "
                "Exécutez : pip install piper-tts huggingface_hub"
            )

        lang = language if language in PIPER_VOICE_MAP else DEFAULT_LANG

        try:
            loop = asyncio.get_event_loop()
            wav_bytes = await loop.run_in_executor(
                _executor,
                _synthesize_sync,
                text,
                lang,
            )
            return wav_bytes
        except Exception as e:
            logger.error(f"[TTS] Erreur synthèse: {e}")
            raise RuntimeError(f"Erreur de synthèse vocale: {e}") from e


def preload_model(language: str = DEFAULT_LANG) -> None:
    """
    Pré-charge le modèle Piper au démarrage de l'application.
    Appeler depuis le lifespan FastAPI pour éviter la latence au premier appel.
    """
    if not _check_piper():
        return
    try:
        _get_voice(language)
    except Exception as e:
        logger.warning(f"[TTS] Pré-chargement échoué (non bloquant): {e}")
