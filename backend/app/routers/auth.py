from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import AccountType, User, UserRole
from app.models.company import Company
from app.schemas.user import (
    UserCreate,
    UserRead,
    Token,
    LoginRequest,
    GoogleLoginRequest,
    VerifyLoginCodeRequest,
    VerifyRegistrationCodeRequest,
)
from app.core.security import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user
from app.notifications import notify_webhook
from app.notifications import send_login_code_email
from app.notifications import send_registration_code_email
from secrets import token_urlsafe
import secrets
import httpx
import re
import time
from typing import Optional
from pydantic import BaseModel

# simple in-memory rate limiter for resend endpoint: email -> last_sent_timestamp
_resend_last_sent: dict[str, float] = {}
_RESEND_WINDOW_SECONDS = 60

router = APIRouter(prefix="/auth", tags=["auth"])


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: str


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    if payload.account_type == AccountType.company and not payload.company_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="company_name is required for company accounts",
        )

    # basic password strength check
    if len(payload.password) < 8 or not re.search(r"[A-Za-z]", payload.password) or not re.search(r"[0-9]", payload.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be >=8 chars and include letters and digits")

    verification_code = f"{secrets.randbelow(900000) + 100000}"
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        account_type=payload.account_type,
        company_name=payload.company_name,
        is_active=False,
        email_verification_token=verification_code,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if payload.account_type == AccountType.company:
        company_name = payload.company_name or user.company_name or f"company-{user.id}"
        company = Company(name=company_name, owner_user_id=user.id)
        db.add(company)
        db.commit()
        db.refresh(company)

        user.company_id = company.id
        user.role = UserRole.owner
        db.add(user)
        db.commit()
        db.refresh(user)

    # attempt to send a verification code via SMTP; fall back to webhook
    try:
        sent = send_registration_code_email(user.email, user.full_name, verification_code)
        if not sent:
            notify_webhook({
                "type": "registration_code",
                "email": user.email,
                "full_name": user.full_name,
                "code": verification_code,
            })
    except Exception:
        try:
            notify_webhook({
                "type": "registration_code",
                "email": user.email,
                "full_name": user.full_name,
                "code": verification_code,
            })
        except Exception:
            pass

    return user


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Verify your email first, then try again.",
        )
    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user



@router.api_route("/verify-email", methods=["GET", "POST"])
def verify_email(
    token: Optional[str] = None,
    payload: Optional[VerifyEmailRequest] = None,
    db: Session = Depends(get_db),
):
    verification_token = token or (payload.token if payload else None)
    if not verification_token:
        raise HTTPException(status_code=400, detail="token is required")

    user = db.query(User).filter(User.email_verification_token == verification_token).first()
    if not user:
        raise HTTPException(status_code=404, detail="Invalid verification token")
    user.email_verified = True
    user.is_active = True
    user.email_verification_token = None
    db.add(user)
    db.commit()
    return {"status": "verified"}


@router.api_route("/resend-verification", methods=["POST", "GET"])
def resend_verification(
    email: Optional[str] = None,
    payload: Optional[ResendVerificationRequest] = None,
    db: Session = Depends(get_db),
):
    target_email = email or (payload.email if payload else None)
    if not target_email:
        raise HTTPException(status_code=400, detail="email is required")

    now = time.time()
    last = _resend_last_sent.get(target_email)
    if last and now - last < _RESEND_WINDOW_SECONDS:
        raise HTTPException(status_code=429, detail="Please wait before requesting another verification email")

    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        # do not reveal if email exists
        return {"status": "ok"}

    if user.email_verified and user.is_active:
        return {"status": "already_verified"}

    # ensure verification code exists
    if not user.email_verification_token:
        user.email_verification_token = f"{secrets.randbelow(900000) + 100000}"
        db.add(user)
        db.commit()
        db.refresh(user)

    try:
        sent = send_registration_code_email(user.email, user.full_name, user.email_verification_token)
        if not sent:
            notify_webhook({
                "type": "registration_code",
                "email": user.email,
                "full_name": user.full_name,
                "code": user.email_verification_token,
            })
    except Exception:
        pass

    _resend_last_sent[target_email] = now
    return {"status": "sent"}


@router.post("/verify-registration-code")
def verify_registration_code(payload: VerifyRegistrationCodeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.email_verification_token:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    if user.email_verification_token != payload.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    user.email_verified = True
    user.is_active = True
    user.email_verification_token = None
    db.add(user)
    db.commit()
    return {"status": "verified"}




@router.post("/google-login")
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    # Verify Google ID token via Google's tokeninfo endpoint
    token = payload.id_token
    try:
        resp = httpx.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}", timeout=5.0)
        resp.raise_for_status()
        info = resp.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Google ID token")

    email = info.get("email")
    email_verified = info.get("email_verified") in ("true", True)
    sub = info.get("sub")
    name = info.get("name") or email.split("@")[0]

    if not email or not email_verified:
        raise HTTPException(status_code=400, detail="Google account email not verified")

    user = db.query(User).filter(User.email == email).first()
    created = False
    if not user:
        # create a local user placeholder for Google account
        user = User(
            email=email,
            full_name=name,
            hashed_password=hash_password(token_urlsafe(16)),
            account_type=AccountType.individual,
            is_active=True,
            email_verified=True,
            google_id=sub,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        created = True
    else:
        user.google_id = sub
        user.is_active = True
        user.email_verified = True
        db.add(user)
        db.commit()

    # generate one-time code and send via email for stronger verification
    code = f"{secrets.randbelow(900000) + 100000}"
    user.login_code = code
    user.login_code_expires = int(time.time()) + 600
    db.add(user)
    db.commit()

    try:
        sent = send_login_code_email(user.email, user.full_name, code)
        if not sent:
            notify_webhook({"type": "login_code", "email": user.email, "code": code})
    except Exception:
        try:
            notify_webhook({"type": "login_code", "email": user.email, "code": code})
        except Exception:
            pass

    return {"status": "code_sent", "created": created, "email": user.email}



@router.post("/verify-login-code", response_model=Token)
def verify_login_code(payload: VerifyLoginCodeRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.login_code:
        raise HTTPException(status_code=400, detail="Invalid code")
    if user.login_code != payload.code:
        raise HTTPException(status_code=400, detail="Invalid code")
    if not user.login_code_expires or int(time.time()) > int(user.login_code_expires):
        raise HTTPException(status_code=400, detail="Code expired")

    token = create_access_token(subject=user.id)
    # clear code
    user.login_code = None
    user.login_code_expires = None
    db.add(user)
    db.commit()
    return {"access_token": token, "token_type": "bearer"}
