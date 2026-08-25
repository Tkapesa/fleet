from pydantic import BaseModel, EmailStr

from app.models.user import AccountType


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    account_type: AccountType = AccountType.individual
    company_name: str | None = None


class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    account_type: AccountType
    company_name: str | None
    is_active: bool
    is_admin: bool

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    id_token: str


class VerifyLoginCodeRequest(BaseModel):
    email: EmailStr
    code: str


class VerifyRegistrationCodeRequest(BaseModel):
    email: EmailStr
    code: str
