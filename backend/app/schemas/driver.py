from datetime import date, datetime
from pydantic import BaseModel, EmailStr
from app.models.driver import LicenseClass


class DriverCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    license_number: str
    license_class: LicenseClass
    license_state: str | None = None
    license_issue_date: date | None = None
    license_expiry: date
    date_of_birth: date | None = None
    address: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    notes: str | None = None
    assigned_truck_id: int | None = None
    license_document_url: str | None = None
    medical_card_document_url: str | None = None
    additional_document_notes: str | None = None


class DriverUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    license_number: str | None = None
    license_class: LicenseClass | None = None
    license_state: str | None = None
    license_issue_date: date | None = None
    license_expiry: date | None = None
    date_of_birth: date | None = None
    address: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    notes: str | None = None
    assigned_truck_id: int | None = None
    license_document_url: str | None = None
    medical_card_document_url: str | None = None
    additional_document_notes: str | None = None
    is_active: bool | None = None


class DriverRead(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str
    license_number: str
    license_class: LicenseClass
    license_state: str | None
    license_issue_date: date | None
    license_expiry: date
    license_days_until_expiry: int | None
    license_status: str
    date_of_birth: date | None
    address: str | None
    emergency_contact_name: str | None
    emergency_contact_phone: str | None
    notes: str | None
    assigned_truck_id: int | None
    assigned_truck_label: str | None
    license_document_url: str | None
    medical_card_document_url: str | None
    additional_document_notes: str | None
    is_active: bool

    model_config = {"from_attributes": True}


class DriverDocumentRead(BaseModel):
    id: int
    driver_id: int
    doc_type: str
    original_filename: str
    stored_filename: str
    file_url: str
    content_type: str
    uploaded_at: datetime | None

    model_config = {"from_attributes": True}
