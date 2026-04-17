from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String


class Token_balances(Base):
    __tablename__ = "token_balances"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    balance = Column(Integer, nullable=False)
    total_purchased = Column(Integer, nullable=True)
    total_used = Column(Integer, nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)