"""
EmotionalTracker — CRUD + statistiques sur les scores de bien-être émotionnel.
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.emotional_score import EmotionalScore
from schemas.emotional_checkin import EmotionalStats

logger = logging.getLogger(__name__)


class EmotionalTracker:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_checkin(self, user_id: str, score: int, note: Optional[str] = None) -> EmotionalScore:
        """Crée un nouveau check-in émotionnel. Score doit être dans [1, 10]."""
        if score < 1 or score > 10:
            raise ValueError(f"Score must be between 1 and 10, got {score}")

        obj = EmotionalScore(user_id=user_id, score=score, note=note)
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        logger.info(f"Created emotional check-in for user_id={user_id}, score={score}")
        return obj

    async def list_checkins(
        self,
        user_id: str,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        limit: int = 365,
    ) -> list[EmotionalScore]:
        """Liste les check-ins d'un utilisateur, filtrés par dates, triés chronologiquement."""
        query = (
            select(EmotionalScore)
            .where(EmotionalScore.user_id == user_id)
            .order_by(EmotionalScore.created_at.asc())
            .limit(min(limit, 365))
        )
        if from_date:
            query = query.where(EmotionalScore.created_at >= from_date)
        if to_date:
            query = query.where(EmotionalScore.created_at <= to_date)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_stats(self, user_id: str) -> EmotionalStats:
        """Calcule les statistiques émotionnelles : avg 7j/30j, min/max 30j, tendance."""
        now = datetime.now(timezone.utc)
        cutoff_7d = now - timedelta(days=7)
        cutoff_30d = now - timedelta(days=30)

        # Scores 30 derniers jours
        result_30d = await self.db.execute(
            select(EmotionalScore.score)
            .where(EmotionalScore.user_id == user_id)
            .where(EmotionalScore.created_at >= cutoff_30d)
        )
        scores_30d = [row[0] for row in result_30d.fetchall()]

        if not scores_30d:
            return EmotionalStats(trend="insufficient_data")

        # Scores 7 derniers jours
        result_7d = await self.db.execute(
            select(EmotionalScore.score)
            .where(EmotionalScore.user_id == user_id)
            .where(EmotionalScore.created_at >= cutoff_7d)
        )
        scores_7d = [row[0] for row in result_7d.fetchall()]

        avg_30d = sum(scores_30d) / len(scores_30d)
        avg_7d = sum(scores_7d) / len(scores_7d) if scores_7d else None
        min_30d = min(scores_30d)
        max_30d = max(scores_30d)

        # Calcul de la tendance
        if avg_7d is None:
            trend = "insufficient_data"
        elif avg_7d > avg_30d + 0.5:
            trend = "improving"
        elif avg_7d < avg_30d - 0.5:
            trend = "declining"
        else:
            trend = "stable"

        return EmotionalStats(
            avg_7d=round(avg_7d, 2) if avg_7d is not None else None,
            avg_30d=round(avg_30d, 2),
            min_30d=min_30d,
            max_30d=max_30d,
            trend=trend,
        )

    async def delete_all_for_user(self, user_id: str) -> int:
        """Supprime tous les scores d'un utilisateur. Retourne le nombre supprimé."""
        result = await self.db.execute(
            delete(EmotionalScore).where(EmotionalScore.user_id == user_id)
        )
        await self.db.commit()
        count = result.rowcount
        logger.info(f"Deleted {count} emotional scores for user_id={user_id}")
        return count
