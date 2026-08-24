import argparse
from app.database import SessionLocal
from app.models.user import User

parser = argparse.ArgumentParser(description='Force verify a user by email (dev only)')
parser.add_argument('--email', required=True, help='Email address to verify')
args = parser.parse_args()

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == args.email).first()
    if not user:
        print('User not found')
    else:
        user.email_verified = True
        user.is_active = True
        user.email_verification_token = None
        db.add(user)
        db.commit()
        print('User verified:', user.email)
finally:
    db.close()
