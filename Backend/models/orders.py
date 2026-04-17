from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String


class Orders(Base):
    __tablename__ = "orders"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    package_id = Column(Integer, nullable=False)
    token_amount = Column(Integer, nullable=False)
    price_cents = Column(Integer, nullable=False)
    stripe_session_id = Column(String, nullable=True)
    status = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=True)