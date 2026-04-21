"""
Router /api/v1/kaggle — gestion du serveur GPU Kaggle.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from services.kaggle_client import is_kaggle_available, KaggleClient

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/kaggle", tags=["kaggle"])


class KaggleConfig(BaseModel):
    url: str
    key: str


@router.get("/status")
async def kaggle_status(current_user: UserResponse = Depends(get_current_user)):
    """Retourne le statut du serveur Kaggle GPU."""
    if not is_kaggle_available():
        return {"available": False, "reason": "KAGGLE_GPU_URL non configuré"}

    try:
        client = KaggleClient()
        health = await client.health()
        return {"available": True, **health}
    except Exception as e:
        return {"available": False, "reason": str(e)}
