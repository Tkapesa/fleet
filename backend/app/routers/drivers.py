from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.driver import Driver
from app.models.driver_document import DriverDocument
from app.models.truck import Truck
from app.models.user import User
from app.schemas.driver import DriverCreate, DriverDocumentRead, DriverRead, DriverUpdate
from app.dependencies import get_current_user

router = APIRouter(prefix="/drivers", tags=["drivers"])
UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_DOCUMENT_TYPES = {
    "license",
    "passport",
    "medical_report",
    "health_report",
    "drug_test",
    "other",
}


@router.get("/", response_model=list[DriverRead])
def list_drivers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Driver)
        .filter(Driver.owner_user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/", response_model=DriverRead, status_code=status.HTTP_201_CREATED)
def create_driver(
    payload: DriverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if db.query(Driver).filter(Driver.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    if db.query(Driver).filter(Driver.license_number == payload.license_number).first():
        raise HTTPException(status_code=409, detail="License number already registered")

    if payload.assigned_truck_id is not None:
        truck = (
            db.query(Truck)
            .filter(Truck.id == payload.assigned_truck_id, Truck.owner_user_id == current_user.id)
            .first()
        )
        if not truck:
            raise HTTPException(status_code=404, detail="Assigned truck not found")

    driver = Driver(**payload.model_dump(), owner_user_id=current_user.id)
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


@router.get("/{driver_id}", response_model=DriverRead)
def get_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id, Driver.owner_user_id == current_user.id)
        .first()
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver


@router.patch("/{driver_id}", response_model=DriverRead)
def update_driver(
    driver_id: int,
    payload: DriverUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id, Driver.owner_user_id == current_user.id)
        .first()
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    update_data = payload.model_dump(exclude_unset=True)

    if "email" in update_data and update_data["email"] != driver.email:
        existing_email = db.query(Driver).filter(Driver.email == update_data["email"]).first()
        if existing_email and existing_email.id != driver.id:
            raise HTTPException(status_code=409, detail="Email already registered")

    if "license_number" in update_data and update_data["license_number"] != driver.license_number:
        existing_license = (
            db.query(Driver)
            .filter(Driver.license_number == update_data["license_number"])
            .first()
        )
        if existing_license and existing_license.id != driver.id:
            raise HTTPException(status_code=409, detail="License number already registered")

    if "assigned_truck_id" in update_data and update_data["assigned_truck_id"] is not None:
        truck = (
            db.query(Truck)
            .filter(Truck.id == update_data["assigned_truck_id"], Truck.owner_user_id == current_user.id)
            .first()
        )
        if not truck:
            raise HTTPException(status_code=404, detail="Assigned truck not found")

    for field, value in update_data.items():
        setattr(driver, field, value)
    db.commit()
    db.refresh(driver)
    return driver


@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id, Driver.owner_user_id == current_user.id)
        .first()
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    docs = db.query(DriverDocument).filter(DriverDocument.driver_id == driver.id).all()
    for doc in docs:
        file_path = UPLOADS_DIR / doc.stored_filename
        if file_path.exists():
            file_path.unlink()

    db.delete(driver)
    db.commit()


@router.get("/{driver_id}/documents", response_model=list[DriverDocumentRead])
def list_driver_documents(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id, Driver.owner_user_id == current_user.id)
        .first()
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    return (
        db.query(DriverDocument)
        .filter(DriverDocument.driver_id == driver_id)
        .order_by(DriverDocument.uploaded_at.desc())
        .all()
    )


@router.post("/{driver_id}/documents", response_model=DriverDocumentRead, status_code=status.HTTP_201_CREATED)
async def upload_driver_document(
    driver_id: int,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id, Driver.owner_user_id == current_user.id)
        .first()
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    normalized_doc_type = (doc_type or "").strip().lower()
    if normalized_doc_type not in ALLOWED_DOCUMENT_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported document type")

    original_filename = (file.filename or "document.pdf").strip()
    file_ext = Path(original_filename).suffix.lower()
    content_type = (file.content_type or "").lower()
    if content_type != "application/pdf" and file_ext != ".pdf":
        raise HTTPException(status_code=400, detail="Only PDF documents are allowed")

    stored_filename = f"{uuid4().hex}.pdf"
    file_path = UPLOADS_DIR / stored_filename
    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    existing_docs = (
        db.query(DriverDocument)
        .filter(DriverDocument.driver_id == driver.id, DriverDocument.doc_type == normalized_doc_type)
        .all()
    )
    for existing in existing_docs:
        existing_path = UPLOADS_DIR / existing.stored_filename
        if existing_path.exists():
            existing_path.unlink()
        db.delete(existing)

    file_path.write_bytes(payload)

    document = DriverDocument(
        driver_id=driver.id,
        doc_type=normalized_doc_type,
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_url=f"/uploads/{stored_filename}",
        content_type="application/pdf",
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.delete("/{driver_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_driver_document(
    driver_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    driver = (
        db.query(Driver)
        .filter(Driver.id == driver_id, Driver.owner_user_id == current_user.id)
        .first()
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    document = (
        db.query(DriverDocument)
        .filter(DriverDocument.id == document_id, DriverDocument.driver_id == driver_id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = UPLOADS_DIR / document.stored_filename
    if file_path.exists():
        file_path.unlink()

    db.delete(document)
    db.commit()
