from app.database import SessionLocal
from app.models.user import User

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == 'demo@truckappdemo.com').first()
    if not user:
        print('demo user not found')
    else:
        print('demo user:')
        print(' id:', user.id)
        print(' email:', user.email)
        print(' is_active:', user.is_active)
        print(' email_verified:', getattr(user, 'email_verified', None))
        print(' role:', user.role)
        print(' company_id:', user.company_id)
finally:
    db.close()
