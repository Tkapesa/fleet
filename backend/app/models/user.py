import enum

from sqlalchemy import Boolean, Column, Enum, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class AccountType(str, enum.Enum):
    individual = "individual"
    company = "company"


class UserRole(str, enum.Enum):
    owner = "owner"
    admin = "admin"
    manager = "manager"
    user = "user"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    account_type = Column(Enum(AccountType), default=AccountType.individual, nullable=False)
    company_name = Column(String, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    role = Column(Enum(UserRole), default=UserRole.user, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String, nullable=True, index=True)
    # Google OAuth subject id if user signs in with Google
    google_id = Column(String, nullable=True, index=True)
    # One-time login code (sent via email) and expiry as epoch seconds
    login_code = Column(String, nullable=True, index=True)
    login_code_expires = Column(Integer, nullable=True, index=True)

    company = relationship("Company", back_populates="users", foreign_keys=[company_id])
