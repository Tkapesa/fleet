import enum

from sqlalchemy import Boolean, Column, Enum, Integer, String
from app.database import Base


class AccountType(str, enum.Enum):
    individual = "individual"
    company = "company"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    account_type = Column(Enum(AccountType), default=AccountType.individual, nullable=False)
    company_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
