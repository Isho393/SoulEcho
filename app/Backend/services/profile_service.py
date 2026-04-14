"""
ProfileService — CRUD sur UserProfile + opérations RGPD (suppression cascade, export).
"""
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.conversations import Conversations
from models.emotional_score import EmotionalScore
from models.messages import Messages
from models.user_profile import UserProfile
from schemas.profile import UserProfileUpdate

logger = logging.getLogger(__name__)


class ProfileService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create(self, user_id: str) -> UserProfile:
        """Retourne le profil existant ou en crée un avec les valeurs par défaut."""
        result = await self.db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        if profile:
            return profile

        profile = UserProfile(user_id=user_id, language="fr")
        self.db.add(profile)
        await self.db.commit()
        await self.db.refresh(profile)
        logger.info(f"Created default UserProfile for user_id={user_id}")
        return profile

    async def update(self, user_id: str, data: UserProfileUpdate) -> UserProfile:
        """Upsert du profil utilisateur."""
        profile = await self.get_or_create(user_id)
        update_dict = data.model_dump(exclude_none=True)
        for key, value in update_dict.items():
            setattr(profile, key, value)
        await self.db.commit()
        await self.db.refresh(profile)
        logger.info(f"Updated UserProfile for user_id={user_id}")
        return profile

    async def delete_user_data(self, user_id: str) -> Dict[str, Any]:
        """
        Suppression RGPD en cascade atomique :
        UserProfile, EmotionalScores, Messages, Conversations.
        """
        try:
            # Supprimer les messages
            await self.db.execute(delete(Messages).where(Messages.user_id == user_id))
            # Supprimer les conversations
            await self.db.execute(delete(Conversations).where(Conversations.user_id == user_id))
            # Supprimer les scores émotionnels
            await self.db.execute(delete(EmotionalScore).where(EmotionalScore.user_id == user_id))
            # Supprimer le profil
            await self.db.execute(delete(UserProfile).where(UserProfile.user_id == user_id))

            await self.db.commit()
            deleted_at = datetime.now(timezone.utc).isoformat()
            logger.info(f"RGPD deletion completed for user_id={user_id} at {deleted_at}")
            return {"deleted_at": deleted_at, "user_id": user_id}
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error during RGPD deletion for user_id={user_id}: {e}")
            raise

    async def export_user_data(self, user_id: str) -> Dict[str, Any]:
        """Export RGPD — retourne toutes les données de l'utilisateur en JSON structuré."""
        # Profil
        profile_result = await self.db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        profile = profile_result.scalar_one_or_none()

        # Scores émotionnels
        scores_result = await self.db.execute(
            select(EmotionalScore).where(EmotionalScore.user_id == user_id)
            .order_by(EmotionalScore.created_at.asc())
        )
        scores = scores_result.scalars().all()

        # Conversations
        convs_result = await self.db.execute(
            select(Conversations).where(Conversations.user_id == user_id)
        )
        conversations = convs_result.scalars().all()

        # Messages
        msgs_result = await self.db.execute(
            select(Messages).where(Messages.user_id == user_id)
            .order_by(Messages.created_at.asc())
        )
        messages = msgs_result.scalars().all()

        return {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id,
            "profile": {
                "personality_type": profile.personality_type if profile else None,
                "life_context": profile.life_context if profile else None,
                "goals": profile.goals if profile else None,
                "communication_preference": profile.communication_preference if profile else None,
                "language": profile.language if profile else "fr",
            },
            "emotional_scores": [
                {"score": s.score, "note": s.note, "created_at": s.created_at.isoformat() if s.created_at else None}
                for s in scores
            ],
            "conversations": [
                {"id": c.id, "title": c.title, "created_at": c.created_at.isoformat() if c.created_at else None}
                for c in conversations
            ],
            "messages": [
                {
                    "conversation_id": m.conversation_id,
                    "role": m.role,
                    "content": m.content,
                    "created_at": m.created_at.isoformat() if m.created_at else None,
                }
                for m in messages
            ],
        }
