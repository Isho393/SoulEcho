from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class EmotionalCheckinCreate(BaseModel):
    score: int = Field(..., ge=1, le=10)
    note: Optional[str] = Field(None, max_length=200)


class EmotionalCheckinResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    score: int
    note: Optional[str] = None
    created_at: datetime


class EmotionalStats(BaseModel):
    avg_7d: Optional[float] = None
    avg_30d: Optional[float] = None
    min_30d: Optional[int] = None
    max_30d: Optional[int] = None
    trend: Literal["improving", "stable", "declining", "insufficient_data"] = "insufficient_data"
