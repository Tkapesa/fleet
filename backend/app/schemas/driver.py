from datetime import date
from pydantic import BaseModel, EmailStr
from app.models.driver import LicenseClass


class DriverCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    license_number: str
    license_class: LicenseClass
    license_expiry: date


class DriverUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    license_class: LicenseClass | None = None
    license_expiry: date | None = None
    is_active: bool | None = None


class DriverRead(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str
    license_number: str
    license_class: LicenseClass
    license_expiry: date
    is_active: bool

    model_config = {"from_attributes": True}
