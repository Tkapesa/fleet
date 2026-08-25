import time
import sqlite3
import urllib.request
import json

# 1) create a unique email like smoke_<timestamp>@example.com
timestamp = int(time.time())
email = f"smoke_{timestamp}@example.com"
password = "StrongPassword123!"
full_name = "Smoke Test User"

print(f"Unique Email: {email}")

# 2) POST to http://127.0.0.1:8000/auth/register with strong password and individual account_type
register_url = "http://127.0.0.1:8000/auth/register"
register_data = {
    "email": email,
    "full_name": full_name,
    "password": password,
    "account_type": "individual",
    "company_name": None
}

req_data = json.dumps(register_data).encode('utf-8')
req = urllib.request.Request(
    register_url, 
    data=req_data, 
    headers={'Content-Type': 'application/json'}
)

print("Registering...")
try:
    with urllib.request.urlopen(req) as resp:
        reg_status = resp.status
        reg_body = json.loads(resp.read().decode('utf-8'))
        print(f"Register Status Code: {reg_status}")
        print(f"Register Response: {reg_body}")
except Exception as e:
    print(f"Register failed: {e}")
    exit(1)

# 3) open sqlite database truck_app.db and read users.email_verification_token for that email
print("Connecting to DB...")
try:
    conn = sqlite3.connect('truck_app.db')
    cursor = conn.cursor()
    cursor.execute("SELECT email_verification_token FROM users WHERE email = ?;", (email,))
    row = cursor.fetchone()
    if not row:
        print("User not found in database!")
        conn.close()
        exit(1)
    token = row[0]
    print(f"Verification token from DB: {token}")
    conn.close()
except Exception as e:
    print(f"DB Read failed: {e}")
    exit(1)

# 4) POST to /auth/verify-registration-code with email + code
verify_url = "http://127.0.0.1:8000/auth/verify-registration-code"
verify_data = {
    "email": email,
    "code": token
}
verify_req_data = json.dumps(verify_data).encode('utf-8')
verify_req = urllib.request.Request(
    verify_url,
    data=verify_req_data,
    headers={'Content-Type': 'application/json'}
)

print("Verifying registration... ")
try:
    with urllib.request.urlopen(verify_req) as resp:
        verify_status = resp.status
        verify_body = json.loads(resp.read().decode('utf-8'))
        print(f"Verify Status Code: {verify_status}")
        print(f"Verify Response: {verify_body}")
        
    print("Flow passed successfully!")
except Exception as e:
    print(f"Verify failed: {e}")
    exit(1)
