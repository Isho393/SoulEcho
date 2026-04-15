from core.database import Base
from sqlalchemy import Column, DateTime, Integer, JSON, String
from sqlalchemy.sql import func


class UserProfile(Base):
    __tablename__ = "user_profiles"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String(255), unique=True, index=True, nullable=False)
    personality_type = Column(String(10), nullable=True)
    life_context = Column(String(500), nullable=True)
    goals = Column(JSON, nullable=True)
    communication_preference = Column(String(20), nullable=True)
    language = Column(String(5), nullable=True, default="fr")
    ai_memory = Column(String(2000), nullable=True)  # résumé psychologique généré par l'IA
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())