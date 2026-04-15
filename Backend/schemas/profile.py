from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime

VALID_MBTI = {
    "INTJ", "INTP", "ENTJ", "ENTP",
    "INFJ", "INFP", "ENFJ", "ENFP",
    "ISTJ", "ISFJ", "ESTJ", "ESFJ",
    "ISTP", "ISFP", "ESTP", "ESFP",
}
VALID_DISC = {"D", "I", "S", "C"}
VALID_PERSONALITY_TYPES = VALID_MBTI | VALID_DISC


class UserProfileUpdate(BaseModel):
    personality_type: Optional[str] = None
    life_context: Optional[str] = Field(None, max_length=500)
    goals: Optional[List[str]] = Field(None, max_length=5)
    communication_preference: Optional[Literal["direct", "narrative", "socratic"]] = None
    language: Optional[str] = Field(None, min_length=2, max_length=5)

    @field_validator("personality_type")
    @classmethod
    def validate_personality_type(cls, v):
        if v is None:
            return v
        if v.upper() not in VALID_PERSONALITY_TYPES:
            raise ValueError(
                f"personality_type must be a valid MBTI type (e.g. INTJ, ENFP) "
                f"or DISC value (D, I, S, C). Got: '{v}'"
            )
        return v.upper()


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    personality_type: Optional[str] = None
    life_context: Optional[str] = None
    goals: Optional[List[str]] = None
    communication_preference: Optional[str] = None
    language: Optional[str] = "fr"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
