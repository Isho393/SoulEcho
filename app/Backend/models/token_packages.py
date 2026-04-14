from core.database import Base
from sqlalchemy import Boolean, Column, Integer, String


class Token_packages(Base):
    __tablename__ = "token_packages"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    name = Column(String, nullable=False)
    token_amount = Column(Integer, nullable=False)
    price_cents = Column(Integer, nullable=False)
    description = Column(String, nullable=True)
    popular = Column(Boolean, nullable=True)