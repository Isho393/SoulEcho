"""
Router /api/v1/emotional-checkin — suivi émotionnel SoulEcho.
"""
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from schemas.emotional_checkin import EmotionalCheckinCreate, EmotionalCheckinResponse, EmotionalStats
from services.emotional_tracker import EmotionalTracker

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/emotional-checkin", tags=["emotional-checkin"])


@router.post("", response_model=EmotionalCheckinResponse, status_code=201)
async def create_checkin(
    data: EmotionalCheckinCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Enregistre un check-in émotionnel (score 1-10 + note optionnelle)."""
    tracker = EmotionalTracker(db)
    try:
        return await tracker.create_checkin(
            user_id=str(current_user.id),
            score=data.score,
            note=data.note,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("", response_model=List[EmotionalCheckinResponse])
async def list_checkins(
    from_date: Optional[datetime] = Query(None, description="Date de début (ISO 8601)"),
    to_date: Optional[datetime] = Query(None, description="Date de fin (ISO 8601)"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Liste les check-ins émotionnels de l'utilisateur, filtrés par période."""
    tracker = EmotionalTracker(db)
    return await tracker.list_checkins(
        user_id=str(current_user.id),
        from_date=from_date,
        to_date=to_date,
    )


@router.get("/stats", response_model=EmotionalStats)
async def get_stats(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Statistiques émotionnelles : moyenne 7j/30j, min/max 30j, tendance
    (improving / stable / declining / insufficient_data).
    """
    tracker = EmotionalTracker(db)
    return await tracker.get_stats(user_id=str(current_user.id))
