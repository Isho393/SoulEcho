"""
Router /api/v1/audio — endpoints STT (Whisper) et TTS (Piper).
Conformité AI Act : header X-AI-Generated: true sur les réponses TTS.
"""
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from services.stt_service import STTService
from services.tts_service import TTSService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/audio", tags=["audio"])

# Taille max du fichier audio : 25 Mo
MAX_AUDIO_SIZE = 25 * 1024 * 1024

# Types MIME acceptés pour la transcription
ACCEPTED_AUDIO_TYPES = {
    "audio/webm",
    "audio/ogg",
    "audio/wav",
    "audio/mpeg",
    "audio/mp4",
    "audio/x-m4a",
    "audio/flac",
    "video/webm",  # Chrome enregistre parfois en video/webm
}


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(..., description="Fichier audio à transcrire"),
    language: str = Form(default="fr", description="Code langue ISO (fr, en, es, de, pt, ar)"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Transcrit un fichier audio en texte via faster-whisper (local).

    - Accepte : webm, ogg, wav, mp3, mp4, m4a, flac
    - Taille max : 25 Mo
    - Langue : auto-détectée si non spécifiée, sinon utilise le profil utilisateur

    Returns:
        JSON { "text": "...", "language": "fr" }
    """
    # Vérifier le type MIME
    content_type = file.content_type or ""
    if content_type not in ACCEPTED_AUDIO_TYPES and not content_type.startswith("audio/"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Type de fichier non supporté : {content_type}. Utilisez webm, ogg, wav, mp3 ou mp4.",
        )

    # Lire le contenu
    audio_bytes = await file.read()
    if len(audio_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fichier audio vide.",
        )
    if len(audio_bytes) > MAX_AUDIO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Fichier trop volumineux (max {MAX_AUDIO_SIZE // 1024 // 1024} Mo).",
        )

    # Déterminer l'extension pour le fichier temporaire
    ext_map = {
        "audio/webm": "webm",
        "video/webm": "webm",
        "audio/ogg": "ogg",
        "audio/wav": "wav",
        "audio/mpeg": "mp3",
        "audio/mp4": "mp4",
        "audio/x-m4a": "m4a",
        "audio/flac": "flac",
    }
    audio_format = ext_map.get(content_type, "webm")

    try:
        stt = STTService()
        text = await stt.transcribe(
            audio_bytes=audio_bytes,
            language=language if language else None,
            audio_format=audio_format,
        )
        logger.info(f"[AUDIO/STT] user={current_user.id} lang={language} → {len(text)} chars")
        return {"text": text, "language": language}

    except RuntimeError as e:
        logger.error(f"[AUDIO/STT] RuntimeError: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"[AUDIO/STT] Erreur inattendue: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la transcription audio.",
        )


@router.post("/synthesize")
async def synthesize_speech(
    text: str = Form(..., description="Texte à synthétiser"),
    language: str = Form(default="fr", description="Code langue ISO (fr, en, es, de, pt, ar)"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Synthétise du texte en audio WAV via Piper TTS (local).

    - Retourne un fichier WAV binaire
    - Langue : utilise le profil utilisateur
    - Longueur max : 1000 caractères (tronqué automatiquement)

    Returns:
        audio/wav binary
    """
    if not text or not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le texte ne peut pas être vide.",
        )

    if len(text) > 5000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Texte trop long (max 5000 caractères).",
        )

    try:
        tts = TTSService()
        wav_bytes = await tts.synthesize(text=text, language=language)

        if not wav_bytes:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="La synthèse vocale n'a produit aucun audio.",
            )

        logger.info(f"[AUDIO/TTS] user={current_user.id} lang={language} → {len(wav_bytes)} bytes WAV")

        return Response(
            content=wav_bytes,
            media_type="audio/wav",
            headers={
                "X-AI-Generated": "true",
                "Cache-Control": "no-cache",
                "Content-Disposition": "inline; filename=response.wav",
            },
        )

    except RuntimeError as e:
        logger.error(f"[AUDIO/TTS] RuntimeError: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"[AUDIO/TTS] Erreur inattendue: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la synthèse vocale.",
        )
