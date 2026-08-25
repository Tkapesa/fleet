import logging
from typing import Any
import smtplib
from email.message import EmailMessage

import httpx

from app.core.config import settings

logger = logging.getLogger("notifications")


def notify_webhook(payload: dict[str, Any]) -> None:
    url = settings.NOTIFIER_WEBHOOK_URL
    if not url:
        return
    try:
        resp = httpx.post(url, json=payload, timeout=5.0)
        resp.raise_for_status()
    except Exception:
        logger.exception("Failed to send webhook notification")


def send_verification_email(email: str, full_name: str, token: str) -> bool:
    """Send verification email using SMTP if configured. Returns True on success."""
    # require SMTP configured
    if not settings.SMTP_HOST or not settings.MAIL_FROM or not settings.SMTP_PORT:
        return False

    verify_url = f"http://127.0.0.1:8000/auth/verify-email?token={token}"
    subject = "Verify your account"
    body = f"Hi {full_name},\n\nPlease verify your account by visiting the link below:\n\n{verify_url}\n\nIf you didn't create an account, ignore this message.\n"

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = settings.MAIL_FROM
    msg['To'] = email
    msg.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                smtp.starttls()
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(msg)
        return True
    except Exception:
        logger.exception("Failed to send verification email")
        return False


def send_login_code_email(email: str, full_name: str, code: str) -> bool:
    """Send a short-lived login code to the user's email via SMTP if configured."""
    if not settings.SMTP_HOST or not settings.MAIL_FROM or not settings.SMTP_PORT:
        return False

    subject = "Your login code"
    body = f"Hi {full_name},\n\nUse the following code to complete your sign-in: {code}\n\nIf you did not request this, ignore this message.\n"

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = settings.MAIL_FROM
    msg['To'] = email
    msg.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                smtp.starttls()
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(msg)
        return True
    except Exception:
        logger.exception("Failed to send login code email")
        return False


def send_registration_code_email(email: str, full_name: str, code: str) -> bool:
    """Send registration verification code via SMTP if configured."""
    if not settings.SMTP_HOST or not settings.MAIL_FROM or not settings.SMTP_PORT:
        return False

    subject = "Complete your registration"
    body = (
        f"Hi {full_name},\n\n"
        f"Use this verification code to complete your registration: {code}\n\n"
        "If you did not create this account, ignore this message.\n"
    )

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = settings.MAIL_FROM
    msg['To'] = email
    msg.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                smtp.starttls()
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(msg)
        return True
    except Exception:
        logger.exception("Failed to send registration code email")
        return False
