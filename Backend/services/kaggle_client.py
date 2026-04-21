"""
KaggleClient — client HTTP vers le serveur GPU Kaggle (Whisper + LLM).

Quand KAGGLE_GPU_URL est défini dans .env, les appels STT et LLM
sont routés vers Kaggle au lieu du backend local.

Fallback automatique vers le service local si Kaggle est indisponible.
"""
import logging
import os
from typing import AsyncGenerator, Optional

import httpx

logger = logging.getLogger(__name__)

# Lus depuis .env
KAGGLE_GPU_URL = os.environ.get("KAGGLE_GPU_URL", "").rstrip("/")
KAGGLE_API_KEY = os.environ.get("KAGGLE_API_KEY", "")

# Timeout généreux — le GPU peut prendre quelques secondes à démarrer
TRANSCRIBE_TIMEOUT = 60.0
CHAT_TIMEOUT       = 120.0


def is_kaggle_available() -> bool:
    """Retourne True si Kaggle GPU est configuré."""
    return bool(KAGGLE_GPU_URL and KAGGLE_API_KEY)


class KaggleClient:
    """Client vers le serveur FastAPI Kaggle GPU."""

    def __init__(self):
        if not is_kaggle_available():
            raise RuntimeError(
                "Kaggle GPU non configuré. "
                "Ajoute KAGGLE_GPU_URL et KAGGLE_API_KEY dans ton .env"
            )
        self._base = KAGGLE_GPU_URL
        self._headers = {"x-api-key": KAGGLE_API_KEY}

    # ── STT ──────────────────────────────────────────────────────────────

    async def transcribe(
        self,
        audio_bytes: bytes,
        language: str = "fr",
        audio_format: str = "webm",
    ) -> str:
        """
        Transcrit de l'audio via Whisper large-v3 sur GPU Kaggle.

        Args:
            audio_bytes: Contenu binaire du fichier audio
            language: Code langue ISO
            audio_format: Extension du fichier (webm, wav, ogg…)

        Returns:
            Texte transcrit
        """
        mime_map = {
            "webm": "audio/webm",
            "ogg":  "audio/ogg",
            "wav":  "audio/wav",
            "mp3":  "audio/mpeg",
            "mp4":  "audio/mp4",
        }
        mime = mime_map.get(audio_format, "audio/webm")

        async with httpx.AsyncClient(timeout=TRANSCRIBE_TIMEOUT) as client:
            response = await client.post(
                f"{self._base}/transcribe",
                headers=self._headers,
                files={"file": (f"recording.{audio_format}", audio_bytes, mime)},
                data={"language": language},
            )

        if response.status_code != 200:
            raise RuntimeError(
                f"Kaggle STT error {response.status_code}: {response.text[:200]}"
            )

        data = response.json()
        text = (data.get("text") or "").strip()
        logger.info(f"[KAGGLE/STT] '{text[:80]}'")
        return text

    # ── LLM Chat ─────────────────────────────────────────────────────────

    async def chat_stream(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> AsyncGenerator[str, None]:
        """
        Génère une réponse LLM en streaming depuis Kaggle GPU.

        Args:
            messages: Liste de dicts {"role": ..., "content": ...}
            temperature: Température de sampling
            max_tokens: Nombre max de tokens générés

        Yields:
            Chunks de texte (str)
        """
        import json

        payload = {
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        async with httpx.AsyncClient(timeout=CHAT_TIMEOUT) as client:
            async with client.stream(
                "POST",
                f"{self._base}/chat",
                headers={**self._headers, "Content-Type": "application/json"},
                json=payload,
            ) as response:
                if response.status_code != 200:
                    body = await response.aread()
                    raise RuntimeError(
                        f"Kaggle LLM error {response.status_code}: {body[:200]}"
                    )

                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    raw = line[6:].strip()
                    if not raw or raw == "[DONE]":
                        continue
                    try:
                        event = json.loads(raw)
                        if event.get("type") == "chunk" and event.get("content"):
                            yield event["content"]
                        elif event.get("type") == "error":
                            raise RuntimeError(f"Kaggle LLM stream error: {event.get('content')}")
                    except json.JSONDecodeError:
                        continue

    # ── Health check ─────────────────────────────────────────────────────

    async def health(self) -> dict:
        """Vérifie que le serveur Kaggle est en ligne."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self._base}/health",
                headers=self._headers,
            )
        return response.json()
