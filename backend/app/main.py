# backend/app/main.py

# --- Standard Library Imports ---
from dotenv import load_dotenv
load_dotenv()

import os
import json
import shutil
import uuid
from datetime import datetime, timezone
from fastapi import Request, BackgroundTasks

# --- Third-party Imports ---
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import razorpay  
# Use env vars; if not set or blank, fall back to hardcoded test keys
_rzp_key = os.getenv("RAZORPAY_KEY_ID", "").strip()
_rzp_sec = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
RAZORPAY_KEY_ID     = _rzp_key if _rzp_key else "rzp_test_Sc28etyyVCB7jl"
RAZORPAY_KEY_SECRET = _rzp_sec if _rzp_sec else "yUGuodHEDNpl4gmf7lRD1mFA"
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "x8Ch_TaqZSie27e").strip() or "x8Ch_TaqZSie27e"
RAZORPAY_MODE = os.getenv("RAZORPAY_MODE", "TEST")

print(f"[Razorpay] Mode={RAZORPAY_MODE} KeyID={RAZORPAY_KEY_ID[:16]}...")
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


from . import crud, models, schemas, security
from . import email_utils
from . import fcm_utils
from .database import SessionLocal, engine
from .first_aid_data import ARTICLES
from . import chatbot_logic
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "YOUR_GOOGLE_CLIENT_ID")

# Tell SQLAlchemy to create all the database tables based on our models
models.Base.metadata.create_all(bind=engine)

# Create the main FastAPI application instance
app = FastAPI(title="StrayCare")

# --- CORS (Cross-Origin Resource Sharing) Middleware ---
origins = [
    "http://localhost:3000",
    "https://straycare-frontend.vercel.app",
    # Capacitor Android app origins
    "capacitor://localhost",
    "https://localhost",
    "http://localhost",
    # Local LAN access (Android device on same Wi-Fi)
    # Update these IPs if your PC's local IP changes
    "http://192.168.1.7:3000",
    "http://192.168.1.7:8000",
    "http://192.168.1.39:3000",
    "http://192.168.1.39:8000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Static File Serving ---
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- RAZORPAY DEMO MODE ---
# We don't initialize the real client to avoid needing keys.
# razorpay_client = razorpay.Client(...) 

# --- Startup Event ---
@app.on_event("startup")
def startup_event():
    from sqlalchemy import inspect, text
    db = SessionLocal()

    inspector = inspect(engine)

    # --- Create any entirely new tables ---
    models.Base.metadata.create_all(bind=engine)

    # --- Safe Column Migration (SQLite ALTER TABLE) ---
    def add_column_if_missing(table: str, column: str, col_type: str):
        try:
            existing_cols = [c["name"] for c in inspector.get_columns(table)]
            if column not in existing_cols:
                with engine.connect() as conn:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
                    conn.commit()
                print(f"✅ Migrated: added '{column}' to '{table}'")
        except Exception as e:
            print(f"⚠️  Migration skipped '{table}.{column}': {e}")

    add_column_if_missing("feedback", "category", "TEXT")
    add_column_if_missing("feedback", "ngo_response", "TEXT")

    # Pets table: add newer columns that may be missing on old DBs
    add_column_if_missing("pets", "ngo_id", "INTEGER")
    add_column_if_missing("pets", "video_url", "TEXT")

    # Cases table: add newer columns
    add_column_if_missing("cases", "pet_name", "TEXT")
    add_column_if_missing("cases", "is_adoptable", "INTEGER DEFAULT 0")
    add_column_if_missing("cases", "adoption_story", "TEXT")
    add_column_if_missing("cases", "temperament", "TEXT")
    add_column_if_missing("cases", "severity_score", "INTEGER DEFAULT 0")
    add_column_if_missing("cases", "severity_label", "TEXT DEFAULT 'Low'")

    # NGOs table: add upi_id for direct UPI fallback
    add_column_if_missing("ngos", "upi_id", "TEXT")
    
    # Add FCM Token columns
    add_column_if_missing("users", "fcm_token", "TEXT")
    add_column_if_missing("ngos", "fcm_token", "TEXT")

    # UserPetListing: add user_name column (was missing, caused 500 on pet listing)
    add_column_if_missing("user_pet_listings", "user_name", "TEXT")

    # --- Check if tables exist (for logging only) ---
    required_tables = ["ngos", "users", "pets", "donations", "cases", "feedback", "user_pet_listings", "notifications"]
    existing_tables = inspector.get_table_names()
    missing = [t for t in required_tables if t not in existing_tables]
    if missing:
        print(f"[WARNING] Still missing tables after create_all: {missing}")
    else:
        print("[OK] All tables and columns ready.")

    # --- Safe Seeding Logic ---
    try:
        # Create TEST NGO only if does NOT exist
        test_ngo = crud.get_ngo_by_email(db, "testngo@example.com")
        if not test_ngo:
            crud.create_test_ngo(db)
            print("[OK] Test NGO seeded.")
        else:
            # Force reset password to ensure it works
            test_ngo.hashed_password = security.get_password_hash("password")
            test_ngo.is_verified = True
            db.commit()

        # Create TEST ADMIN only if does NOT exist
        test_admin = crud.get_user_by_email(db, "admin@straycare.com")
        if not test_admin:
            crud.create_test_admin(db)
            print("[OK] Test Admin seeded.")
        else:
            # Force reset password to ensure it works
            test_admin.hashed_password = security.get_password_hash("adminpassword")
            test_admin.is_admin = True
            db.commit()

        # Seed pets only if no pets exist
        if db.query(models.Pet).count() == 0:
            crud.seed_pets(db)
            print("[OK] Pet data seeded.")

        # Seed food products
        crud.seed_food_products(db)

    except Exception as e:
        print("[ERROR] Startup seeding failed:", e)

    finally:
        db.close()


# --- Database Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Security & Token Setup ---
oauth2_scheme_user = OAuth2PasswordBearer(tokenUrl="token")
oauth2_scheme_ngo = OAuth2PasswordBearer(tokenUrl="ngo/token")

# --- Security Dependency Functions ---
async def get_current_user(token: str = Depends(oauth2_scheme_user), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise credentials_exception
        token_scope = payload.get("scope")
        if token_scope != "user": raise credentials_exception
    except security.JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user

async def get_current_ngo(token: str = Depends(oauth2_scheme_ngo), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate NGO credentials", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise credentials_exception
        token_scope = payload.get("scope")
        if token_scope != "ngo": raise credentials_exception
    except security.JWTError:
        raise credentials_exception
    ngo = crud.get_ngo_by_email(db, email=email)
    if ngo is None:
        raise credentials_exception
    return ngo

async def get_current_admin_user(current_user: schemas.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to perform this action")
    return current_user

# --- USER AUTH ROUTES ---

@app.post("/users/register", response_model=schemas.User)
def register_user(
    user: schemas.UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = crud.create_user(db=db, user=user)
    # Send welcome email in background (non-blocking)
    background_tasks.add_task(email_utils.send_welcome_email, new_user.email, new_user.name)
    return new_user

@app.post("/token", response_model=schemas.LoginResponse)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token = security.create_access_token(data={"sub": user.email, "scope": "user"})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.post("/auth/google", response_model=schemas.LoginResponse)
def google_auth(request: schemas.GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(request.credential, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo['email']
        name = idinfo.get('name', 'Google User')
        
        user = crud.get_user_by_email(db, email=email)
        if not user:
            # Create user automatically if they don't exist
            user_data = schemas.UserCreate(name=name, email=email, password="GOOGLE_OAUTH_DUMMY_PASSWORD")
            user = crud.create_user(db=db, user=user_data)
            
        access_token = security.create_access_token(data={"sub": user.email, "scope": "user"})
        return {"access_token": access_token, "token_type": "bearer", "user": user}
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")

@app.put("/users/me/fcm-token")
def update_user_fcm_token(token_data: dict = Body(...), db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    db_user = crud.get_user_by_email(db, current_user.email)
    db_user.fcm_token = token_data.get("fcm_token")
    db.commit()
    return {"status": "success"}

# --- NGO AUTH ROUTES ---

@app.post("/ngos/register", response_model=schemas.NGO)
async def register_ngo(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    document: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    db_ngo = crud.get_ngo_by_email(db, email=email)
    if db_ngo:
        raise HTTPException(status_code=400, detail="Email already registered")
    file_id = uuid.uuid4()
    filename = f"verify_{file_id}_{os.path.basename(document.filename)}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(document.file, buffer)
    doc_url = f"uploads/{filename}"
    ngo_data = schemas.NGOCreate(name=name, email=email, password=password)
    new_ngo = crud.create_ngo(db=db, ngo=ngo_data, verification_document_url=doc_url)
    # Send registration confirmation email in background
    if background_tasks:
        background_tasks.add_task(email_utils.send_ngo_registration_email, new_ngo.email, new_ngo.name)
    return new_ngo

@app.post("/ngo/token", response_model=schemas.NGOLoginResponse)
def login_ngo(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    ngo = crud.get_ngo_by_email(db, email=form_data.username)
    if not ngo or not security.verify_password(form_data.password, ngo.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect NGO email or password")
    if not ngo.is_verified:
        raise HTTPException(status_code=403, detail="NGO not verified")
    access_token = security.create_access_token(data={"sub": ngo.email, "scope": "ngo"})
    return {"access_token": access_token, "token_type": "bearer", "ngo": ngo}

@app.put("/ngo/me/fcm-token")
def update_ngo_fcm_token(token_data: dict = Body(...), db: Session = Depends(get_db), current_ngo: schemas.NGO = Depends(get_current_ngo)):
    db_ngo = crud.get_ngo_by_email(db, current_ngo.email)
    db_ngo.fcm_token = token_data.get("fcm_token")
    db.commit()
    return {"status": "success"}

# --- CASE ROUTES ---

@app.post("/report", response_model=schemas.Case)
async def report_case(
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    photo: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    case_id = uuid.uuid4()
    filename = f"{case_id}_{os.path.basename(photo.filename)}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)
    photo_url = f"uploads/{filename}"

    # Feature 3: Auto-compute severity from description
    severity = calculate_severity_score(description)

    case_data = schemas.CaseCreate(description=description, latitude=latitude, longitude=longitude)
    db_case = crud.create_user_case(db=db, case=case_data, user_id=current_user.id, photo_url=photo_url)

    # Persist severity into the case record
    db_case.severity_score = severity["score"]
    db_case.severity_label = severity["label"]
    db.commit()
    db.refresh(db_case)

    # 🔔 Notify all verified NGOs about the new case
    all_ngos = db.query(models.NGO).filter(models.NGO.is_verified == True).all()
    for ngo in all_ngos:
        msg = f"🚨 New case reported near ({db_case.latitude:.4f}, {db_case.longitude:.4f}) — {(db_case.description or '')[:60]}"
        crud.create_notification(
            db=db,
            message=msg,
            notif_type="new_case",
            ngo_id=ngo.id,
            case_id=db_case.id,
        )
        if ngo.fcm_token and background_tasks:
            background_tasks.add_task(fcm_utils.send_push_notification, ngo.fcm_token, "New Rescue Case!", msg)

    # 📧 Email citizen: case submitted confirmation
    if background_tasks:
        background_tasks.add_task(
            email_utils.send_case_submitted_email,
            current_user.email,
            current_user.name,
            db_case.id,
            db_case.description or ""
        )
    return db_case

@app.get("/ngo/me/cases", response_model=List[schemas.Case])
def get_ngo_cases(db: Session = Depends(get_db), current_ngo: schemas.NGO = Depends(get_current_ngo)):
    cases = crud.get_ngo_cases(db=db, ngo_id=current_ngo.id)
    # Feature 3: Sort by severity (Critical first) then by date
    severity_order = {"Critical": 0, "High": 1, "Moderate": 2, "Low": 3}
    cases.sort(key=lambda c: (severity_order.get(c.severity_label, 4), -(c.created_at.timestamp() if c.created_at else 0)))
    return cases

@app.get("/users/me/cases", response_model=List[schemas.Case])
def read_user_cases(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    return db.query(models.Case).filter(models.Case.owner_id == current_user.id).all()

@app.get("/users/me")
def get_current_user_info(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    """
    Returns the authenticated user's basic info.
    This is the endpoint Android calls as getCurrentUser().
    """
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": "Admin" if current_user.is_admin else "Citizen",
        "is_admin": current_user.is_admin,
        "points": 0
    }

@app.get("/users/me/adoption-requests")
def get_my_adoption_requests(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    """
    Returns the authenticated citizen's own adoption request history.
    """
    requests = (
        db.query(models.AdoptionRequest)
        .filter(models.AdoptionRequest.adopter_email == current_user.email)
        .order_by(models.AdoptionRequest.request_date.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "pet_id": r.pet_id,
            "pet_name": r.pet_name,
            "status": r.status,
            "request_date": r.request_date.isoformat() if r.request_date else None,
            "adopter_name": r.adopter_name,
            "adopter_email": r.adopter_email,
        }
        for r in requests
    ]

@app.get("/donations/history")
def get_my_donation_history(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    """
    Returns the authenticated citizen's donation history.
    """
    donations = (
        db.query(models.Donation)
        .filter(models.Donation.donor_email == current_user.email)
        .order_by(models.Donation.timestamp.desc())
        .all()
    )
    return [
        {
            "id": d.id,
            "amount": d.amount,
            "ngo_id": d.ngo_id,
            "status": d.status,
            "timestamp": d.timestamp.isoformat() if d.timestamp else None,
        }
        for d in donations
    ]

@app.get("/users/me/profile")
def get_user_profile(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    """
    Returns the authenticated user's full profile summary:
    personal info + case breakdown + donation history + adoption requests.
    """
    cases = db.query(models.Case).filter(models.Case.owner_id == current_user.id).all()
    case_breakdown = {
        "total": len(cases),
        "pending":  sum(1 for c in cases if c.status == "Pending"),
        "accepted": sum(1 for c in cases if c.status == "Accepted"),
        "resolved": sum(1 for c in cases if c.status == "Resolved"),
        "rejected": sum(1 for c in cases if c.status == "Rejected"),
    }

    donations = (
        db.query(models.Donation)
        .filter(models.Donation.donor_email == current_user.email, models.Donation.status == "Success")
        .order_by(models.Donation.timestamp.desc())
        .all()
    )
    donation_history = [
        {
            "id": d.id,
            "amount": d.amount,
            "ngo_id": d.ngo_id,
            "timestamp": d.timestamp.isoformat() if d.timestamp else None,
        }
        for d in donations
    ]

    adoption_requests = (
        db.query(models.AdoptionRequest)
        .filter(models.AdoptionRequest.adopter_email == current_user.email)
        .order_by(models.AdoptionRequest.request_date.desc())
        .all()
    )
    adoption_history = [
        {
            "id": ar.id,
            "pet_name": ar.pet_name,
            "status": ar.status,
            "request_date": ar.request_date.isoformat() if ar.request_date else None,
        }
        for ar in adoption_requests
    ]

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "is_admin": current_user.is_admin,
        "case_breakdown": case_breakdown,
        "donation_history": donation_history,
        "adoption_history": adoption_history,
        "total_donated": sum(d["amount"] for d in donation_history),
    }

@app.get("/cases/{case_id}", response_model=schemas.Case)
def read_case_details(case_id: int, db: Session = Depends(get_db)):
    db_case = crud.get_case_by_id(db, case_id=case_id)
    if db_case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return db_case

@app.put("/case/{case_id}/accept", response_model=schemas.Case)
def accept_case(case_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_ngo: schemas.NGO = Depends(get_current_ngo)):
    db_case = crud.update_case_status(db=db, case_id=case_id, status="Accepted", ngo_id=current_ngo.id)
    # 🔔 Notify the citizen who reported this case
    if db_case and db_case.owner_id:
        msg = f"✅ Your case #{case_id} has been accepted by {current_ngo.name}!"
        crud.create_notification(
            db=db,
            message=msg,
            notif_type="case_accepted",
            user_id=db_case.owner_id,
            case_id=case_id,
        )
        owner = db.query(models.User).filter(models.User.id == db_case.owner_id).first()
        if owner and owner.fcm_token:
            background_tasks.add_task(fcm_utils.send_push_notification, owner.fcm_token, "Case Accepted! 🎉", msg)
    return db_case

@app.put("/case/{case_id}/reject", response_model=schemas.Case)
def reject_case(case_id: int, db: Session = Depends(get_db), current_ngo: schemas.NGO = Depends(get_current_ngo)):
    db_case = crud.update_case_status(db=db, case_id=case_id, status="Rejected", ngo_id=current_ngo.id)
    # 🔔 Notify the citizen
    if db_case and db_case.owner_id:
        crud.create_notification(
            db=db,
            message=f"❌ Case #{case_id} was marked 'Not possible right now' by {current_ngo.name}.",
            notif_type="case_rejected",
            user_id=db_case.owner_id,
            case_id=case_id,
        )
    return db_case

@app.post("/cases/{case_id}/updates", response_model=schemas.CaseUpdate)
async def post_case_update(case_id: int, notes: str = Form(...), photo: UploadFile = File(None), db: Session = Depends(get_db), current_ngo: schemas.NGO = Depends(get_current_ngo)):
    db_case = crud.get_case_by_id(db, case_id=case_id)
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")
    photo_url = None
    if photo:
        filename = f"update_{uuid.uuid4()}_{os.path.basename(photo.filename)}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        photo_url = f"uploads/{filename}"
    result = crud.create_case_update(db=db, notes=notes, case_id=case_id, ngo_id=current_ngo.id, photo_url=photo_url)
    # 🔔 Notify the citizen who reported the case
    if db_case.owner_id:
        crud.create_notification(
            db=db,
            message=f"📋 {current_ngo.name} posted an update on your case #{case_id}: \"{notes[:60]}\"",
            notif_type="case_update",
            user_id=db_case.owner_id,
            case_id=case_id,
        )
    return result

@app.get("/cases/{case_id}/updates", response_model=List[schemas.CaseUpdate])
def get_case_updates(case_id: int, db: Session = Depends(get_db)):
    updates = db.query(models.CaseUpdate).filter(models.CaseUpdate.case_id == case_id).order_by(models.CaseUpdate.created_at.asc()).all()
    return updates


# --- NOTIFICATION ROUTES ---

@app.get("/notifications/me")
def get_my_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Citizen: returns their latest 20 notifications with unread count."""
    notifs = crud.get_user_notifications(db=db, user_id=current_user.id)
    unread = sum(1 for n in notifs if not n.is_read)
    return {
        "unread_count": unread,
        "notifications": [
            {
                "id": n.id,
                "message": n.message,
                "type": n.type,
                "is_read": n.is_read,
                "case_id": n.case_id,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notifs
        ],
    }

@app.put("/notifications/read")
def mark_my_notifications_read(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Citizen: marks all their notifications as read."""
    crud.mark_user_notifications_read(db=db, user_id=current_user.id)
    return {"message": "All notifications marked as read."}

@app.get("/ngo/notifications/me")
def get_ngo_notifications(db: Session = Depends(get_db), current_ngo: models.NGO = Depends(get_current_ngo)):
    """NGO: returns their latest 20 notifications with unread count."""
    notifs = crud.get_ngo_notifications(db=db, ngo_id=current_ngo.id)
    unread = sum(1 for n in notifs if not n.is_read)
    return {
        "unread_count": unread,
        "notifications": [
            {
                "id": n.id,
                "message": n.message,
                "type": n.type,
                "is_read": n.is_read,
                "case_id": n.case_id,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notifs
        ],
    }

@app.put("/ngo/notifications/read")
def mark_ngo_notifications_read(db: Session = Depends(get_db), current_ngo: models.NGO = Depends(get_current_ngo)):
    """NGO: marks all their notifications as read."""
    crud.mark_ngo_notifications_read(db=db, ngo_id=current_ngo.id)
    return {"message": "All notifications marked as read."}


# --- RECOVERY STORIES (Public) ---

@app.get("/stories")
def get_recovery_stories(db: Session = Depends(get_db)):
    """
    Public: Returns all explicit NGO Stories and legacy resolved cases.
    Powers the public Recovery Stories feed.
    """
    stories = []

    # 1. Get explicit NGO Stories
    try:
        ngo_stories = db.query(models.NGOStory).all()
        for s in ngo_stories:
            stories.append({
                "id": s.id + 100000, # prevent id collision
                "description": s.description,
                "photo_url": s.photo_url,
                "video_url": s.video_url, # added video_url here
                "severity_label": "Success",
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "pet_name": s.pet_name or s.title,
                "adoption_story": "",
                "temperament": "",
                "ngo_name": s.ngo_name,
                "updates": []
            })
    except Exception:
        pass

    # 2. Get legacy resolved cases
    try:
        resolved_cases = db.query(models.Case).filter(models.Case.status == "Resolved").all()
        for case in resolved_cases:
            updates = (
                db.query(models.CaseUpdate)
                .filter(models.CaseUpdate.case_id == case.id)
                .order_by(models.CaseUpdate.created_at.asc())
                .all()
            )
            ngo_name = None
            if case.accepted_by_ngo_id:
                ngo = db.query(models.NGO).filter(models.NGO.id == case.accepted_by_ngo_id).first()
                ngo_name = ngo.name if ngo else None
            stories.append({
                "id": case.id,
                "description": case.description,
                "photo_url": case.photo_url,
                "severity_label": case.severity_label or "Low",
                "created_at": case.created_at.isoformat() if case.created_at else None,
                "pet_name": case.pet_name,
                "adoption_story": case.adoption_story,
                "temperament": case.temperament,
                "ngo_name": ngo_name,
                "updates": [
                    {
                        "id": u.id,
                        "notes": u.notes,
                        "photo_url": u.photo_url,
                        "created_at": u.created_at.isoformat() if u.created_at else None,
                    }
                    for u in updates
                ],
            })
    except Exception:
        pass

    # Sort descending by date
    stories.sort(key=lambda x: x["created_at"] or "", reverse=True)
    return stories

@app.post("/ngo/stories")
async def post_ngo_story(
    title: str = Form(...),
    description: str = Form(...),
    pet_name: str = Form(None),
    photo: UploadFile = File(None),
    video: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_ngo: schemas.NGO = Depends(get_current_ngo)
):
    photo_url = None
    if photo and photo.filename:
        filename = f"story_{uuid.uuid4()}_{os.path.basename(photo.filename)}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        photo_url = f"uploads/{filename}"

    video_url = None
    if video and video.filename:
        vid_filename = f"story_vid_{uuid.uuid4()}_{os.path.basename(video.filename)}"
        vid_path = os.path.join(UPLOAD_DIR, vid_filename)
        with open(vid_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        video_url = f"uploads/{vid_filename}"

    # Save to database via Case record marked as NGO story
    # We store NGO stories as a resolved case-update-style entry
    # Using a dedicated story table if it exists, else fall back to dict
    try:
        story_record = models.NGOStory(
            title=title,
            description=description,
            pet_name=pet_name,
            photo_url=photo_url,
            video_url=video_url,
            ngo_id=current_ngo.id,
            ngo_name=current_ngo.name,
            created_at=datetime.now(timezone.utc)
        )
        db.add(story_record)
        db.commit()
        db.refresh(story_record)
        return {
            "id": story_record.id,
            "title": story_record.title,
            "description": story_record.description,
            "pet_name": story_record.pet_name,
            "photo_url": story_record.photo_url,
            "video_url": story_record.video_url,
            "ngo_name": story_record.ngo_name,
            "created_at": story_record.created_at.isoformat() if story_record.created_at else None,
            "type": "ngo_story"
        }
    except Exception:
        # Fallback if NGOStory model doesn't exist yet
        return {
            "id": int(uuid.uuid4().int % 100000),
            "title": title,
            "description": description,
            "pet_name": pet_name,
            "photo_url": photo_url,
            "video_url": video_url,
            "ngo_name": current_ngo.name,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "type": "ngo_story"
        }


# --- SUPPORT ROUTES ---

@app.get("/first-aid/articles")
def get_first_aid_articles():
    return [
        {
            "id": a["id"],
            "title": a["title"],
            "category": a["category"],
            "summary": a["summary"],
            "video_url": a.get("video_url"),
            "thumbnail": a.get("thumbnail"),
        }
        for a in ARTICLES
    ]

@app.get("/first-aid/articles/{article_id}")
def get_first_aid_article_detail(article_id: int):
    article = next((a for a in ARTICLES if a["id"] == article_id), None)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@app.post("/chatbot/query", response_model=schemas.ChatResponse)
async def chatbot_query(request: schemas.ChatQuery):
    history = [msg.dict() for msg in request.history]
    response_text = chatbot_logic.get_chatbot_response(request.query, history=history)
    return {"response": response_text}

@app.get("/ngos/{ngo_id}/profile")
def get_ngo_public_profile(ngo_id: int, db: Session = Depends(get_db)):
    """
    Public: Returns an NGO's public profile including name, verification status,
    case count, pets listed, average rating, and recent reviews.
    """
    ngo = db.query(models.NGO).filter(models.NGO.id == ngo_id, models.NGO.is_verified == True).first()
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found or not verified")

    total_cases   = db.query(models.Case).filter(models.Case.accepted_by_ngo_id == ngo_id).count()
    resolved_cases = db.query(models.Case).filter(
        models.Case.accepted_by_ngo_id == ngo_id,
        models.Case.status == "Resolved"
    ).count()
    pets_listed   = db.query(models.Pet).filter(models.Pet.ngo_id == ngo_id).count()
    pets_adopted  = db.query(models.Pet).filter(
        models.Pet.ngo_id == ngo_id, models.Pet.status == "Adopted"
    ).count()

    feedback_data = crud.get_feedback_for_ngo(db=db, ngo_id=ngo_id)

    recent_pets = (
        db.query(models.Pet)
        .filter(models.Pet.ngo_id == ngo_id, models.Pet.status == "Available")
        .limit(6)
        .all()
    )

    return {
        "id": ngo.id,
        "name": ngo.name,
        "email": ngo.email,
        "is_verified": ngo.is_verified,
        "stats": {
            "total_cases":    total_cases,
            "resolved_cases": resolved_cases,
            "pets_listed":    pets_listed,
            "pets_adopted":   pets_adopted,
        },
        "average_rating":      feedback_data["average_rating"],
        "total_reviews":       feedback_data["total_reviews"],
        "rating_distribution": feedback_data["rating_distribution"],
        "recent_reviews": [
            {
                "id": r.id,
                "rating": r.rating,
                "comment": r.comment,
                "category": r.category,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "ngo_response": r.ngo_response,
            }
            for r in feedback_data["reviews"][-5:]
        ],
        "available_pets": [
            {
                "id": p.id,
                "name": p.name,
                "species": p.species,
                "breed": p.breed,
                "image_url": p.image_url,
                "age": p.age,
                "gender": p.gender,
            }
            for p in recent_pets
        ],
    }


# --- ADMIN ROUTES ---

@app.get("/admin/ngos", response_model=List[schemas.NGO])
def get_all_ngos(db: Session = Depends(get_db), admin_user: schemas.User = Depends(get_current_admin_user)):
    return db.query(models.NGO).all()

@app.get("/admin/ngos/pending", response_model=List[schemas.NGO])
def get_pending_ngos(db: Session = Depends(get_db), admin_user: schemas.User = Depends(get_current_admin_user)):
    return db.query(models.NGO).filter(models.NGO.is_verified == False).all()

@app.put("/admin/ngos/{ngo_id}/verify", response_model=schemas.NGO)
def verify_ngo(ngo_id: int, db: Session = Depends(get_db), admin_user: schemas.User = Depends(get_current_admin_user)):
    db_ngo = db.query(models.NGO).filter(models.NGO.id == ngo_id).first()
    if not db_ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    db_ngo.is_verified = True
    db.commit()
    db.refresh(db_ngo)
    return db_ngo

@app.delete("/admin/ngos/{ngo_id}", status_code=status.HTTP_204_NO_CONTENT)
def deregister_ngo(ngo_id: int, request: schemas.DeregisterRequest, db: Session = Depends(get_db), admin_user: schemas.User = Depends(get_current_admin_user)):
    print(f"Admin {admin_user.email} is de-registering NGO {ngo_id} for reason: {request.reason}")
    success = crud.delete_ngo_by_id(db, ngo_id=ngo_id)
    if not success:
        raise HTTPException(status_code=404, detail="NGO not found")
    return

# --- PET ADOPTION ROUTES ---

@app.get("/pets", response_model=List[schemas.Pet])
def get_all_pets(db: Session = Depends(get_db)):
    """Public endpoint to get a list of all available pets for adoption."""
    available_pets = db.query(models.Pet).filter(models.Pet.status == "Available").all()
    return available_pets

@app.get("/pets/{pet_id}", response_model=schemas.Pet)
def get_pet_detail(pet_id: int, db: Session = Depends(get_db)):
    """Public: Get a single pet's details by ID."""
    pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet

@app.post("/pets/listings")
def submit_pet_listing(
    request: schemas.UserPetListingCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Authenticated citizen: Submit a pet for adoption review by NGOs."""
    listing = models.UserPetListing(
        name=request.name,
        species=request.species,
        age=request.age,
        location=request.location,
        description=request.description,
        image_url="",
        status="Pending",
        user_id=current_user.id,
        user_name=current_user.name
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return {
        "id": listing.id,
        "name": listing.name,
        "species": listing.species,
        "age": listing.age,
        "location": listing.location,
        "status": listing.status,
        "user_name": listing.user_name,
        "created_at": listing.created_at.isoformat() if listing.created_at else None,
    }

from app.algorithms import calculate_pet_match, calculate_severity_score, rank_ngos_for_case, cluster_case_hotspots

@app.post("/pets/match", response_model=List[schemas.PetMatchResponse])
def get_pet_matches(profile: schemas.MatchProfile, db: Session = Depends(get_db)):
    """Endpoint for returning pets ranked by lifestyle match."""
    pets = db.query(models.Pet).filter(models.Pet.status == "Available").all()
    
    results = []
    for p in pets:
        score = calculate_pet_match(p, profile.dict())
        results.append({
            "pet": p,
            "match_percentage": score
        })
        
    results.sort(key=lambda x: x["match_percentage"], reverse=True)
    return results

@app.post("/adoption-requests", response_model=schemas.AdoptionRequest)
def submit_adoption_request(request: schemas.AdoptionRequestCreate, db: Session = Depends(get_db)):
    """Endpoint for users to submit an adoption request."""
    return crud.create_adoption_request(db=db, request=request)

@app.post("/ngo/pets", response_model=schemas.Pet)
async def create_pet_for_adoption(
    db: Session = Depends(get_db),
    current_ngo: schemas.NGO = Depends(get_current_ngo),
    name: str = Form(...),
    species: str = Form(...),
    breed: str = Form(...),
    age: str = Form(...),
    gender: str = Form(...),
    size: str = Form(...),
    location: str = Form(...),
    is_vaccinated: bool = Form(...),
    image: UploadFile = File(...),
    video: UploadFile = File(None)  # Optional video upload
):
    # --- Save image ---
    file_id = uuid.uuid4()
    filename = f"pet_{file_id}_{os.path.basename(image.filename)}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    image_url = f"uploads/{filename}"

    # --- Save video (optional) ---
    video_url = None
    if video and video.filename:
        video_dir = os.path.join(UPLOAD_DIR, "videos")
        os.makedirs(video_dir, exist_ok=True)
        video_id = uuid.uuid4()
        video_filename = f"pet_video_{video_id}_{os.path.basename(video.filename)}"
        video_path = os.path.join(video_dir, video_filename)
        with open(video_path, "wb") as vbuf:
            shutil.copyfileobj(video.file, vbuf)
        video_url = f"uploads/videos/{video_filename}"

    pet_data = schemas.PetCreate(
        name=name,
        species=species,
        breed=breed,
        age=age,
        gender=gender,
        size=size,
        location=location,
        is_vaccinated=is_vaccinated
    )

    return crud.create_pet(db=db, pet=pet_data, image_url=image_url, video_url=video_url, ngo_id=current_ngo.id)

@app.get("/ngo/me/adoption-requests", response_model=List[schemas.AdoptionRequest])
def get_ngo_adoption_requests(db: Session = Depends(get_db), current_ngo: schemas.NGO = Depends(get_current_ngo)):
    requests = db.query(models.AdoptionRequest).filter(
        models.AdoptionRequest.ngo_id == current_ngo.id,
        models.AdoptionRequest.status == "Pending" 
    ).all()
    
    if not requests:
        return []
    
    return requests

@app.get("/ngo/me/adopted-pets", response_model=List[schemas.Pet])
def get_ngo_adopted_pets(db: Session = Depends(get_db), current_ngo: schemas.NGO = Depends(get_current_ngo)):
    adopted_pets = db.query(models.Pet).filter(
        models.Pet.ngo_id == current_ngo.id,
        models.Pet.status == "Adopted" 
    ).all()

    return adopted_pets

@app.put("/ngo/adoption-requests/{request_id}/status", response_model=schemas.AdoptionRequest)
def update_adoption_request_status(
    request_id: int,
    status_update: dict = Body(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_ngo: schemas.NGO = Depends(get_current_ngo)
):
    new_status = status_update.get("status")
    if new_status not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status provided.")

    db_request = db.query(models.AdoptionRequest).filter(
        models.AdoptionRequest.id == request_id
    ).first()

    if not db_request or db_request.ngo_id != current_ngo.id:
        raise HTTPException(status_code=404, detail="Adoption request not found or not authorized.")

    db_request.status = new_status
    db.commit()
    db.refresh(db_request)

    if new_status == "Approved":
        db_pet = db.query(models.Pet).filter(models.Pet.id == db_request.pet_id).first()
        if db_pet:
            db_pet.status = "Adopted"
            db.commit()

    # 📧 Email the adopter about the decision
    adopter = db.query(models.User).filter(models.User.email == db_request.adopter_email).first()
    if adopter and background_tasks:
        pet = db.query(models.Pet).filter(models.Pet.id == db_request.pet_id).first()
        pet_name = pet.name if pet else "the pet"
        if new_status == "Approved":
            background_tasks.add_task(
                email_utils.send_adoption_approved_email,
                db_request.adopter_email,
                db_request.adopter_name,
                pet_name,
                current_ngo.name
            )
        else:
            background_tasks.add_task(
                email_utils.send_adoption_rejected_email,
                db_request.adopter_email,
                db_request.adopter_name,
                pet_name,
                current_ngo.name
            )

    return db_request

# --- FEEDBACK ROUTES ---

@app.post("/feedback", response_model=schemas.Feedback)
def submit_feedback(
    feedback: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    case = db.query(models.Case).filter(models.Case.id == feedback.case_id).first()
    if not case or case.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to leave feedback for this case.")
        
    return crud.create_feedback(db=db, feedback=feedback, user_id=current_user.id)


@app.put("/feedback/{feedback_id}/respond", response_model=schemas.Feedback)
def respond_to_feedback(
    feedback_id: int,
    body: schemas.NGOFeedbackRespond,
    db: Session = Depends(get_db),
    current_ngo: models.NGO = Depends(get_current_ngo)
):
    """NGO-authenticated endpoint to reply to a specific review."""
    result = crud.respond_to_feedback(
        db=db,
        feedback_id=feedback_id,
        ngo_id=current_ngo.id,
        response=body.response
    )
    if not result:
        raise HTTPException(status_code=404, detail="Feedback not found or not authorized.")
    return result


@app.get("/feedback/summary/{ngo_id}", response_model=schemas.FeedbackSummary)
def get_ngo_feedback_summary(ngo_id: int, db: Session = Depends(get_db)):
    return crud.get_feedback_for_ngo(db=db, ngo_id=ngo_id)


@app.get("/admin/feedback", response_model=List[schemas.Feedback])
def get_all_platform_feedback(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    return crud.get_all_feedback(db=db)


# --- USER PET LISTING ROUTES ---

@app.post("/users/pets/list", response_model=schemas.UserPetListing)
async def create_user_pet_listing(
    name: str = Form(...),
    species: str = Form(...),
    age: str = Form(...),
    location: str = Form(...),
    description: str = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """User-authenticated endpoint to list a pet for adoption."""
    file_id = uuid.uuid4()
    filename = f"listing_{file_id}_{os.path.basename(image.filename)}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    image_url = f"uploads/{filename}"

    listing_data = schemas.UserPetListingCreate(
        name=name, species=species, age=age,
        location=location, description=description
    )
    return crud.create_user_pet_listing(
        db=db, listing=listing_data, user_id=current_user.id, image_url=image_url
    )


@app.get("/users/pets", response_model=List[schemas.UserPetListing])
def get_my_pet_listings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Returns the current user's own pet listings."""
    return crud.get_user_pet_listings(db=db, user_id=current_user.id)


@app.get("/ngo/pets/listings", response_model=List[schemas.UserPetListing])
def get_pending_pet_listings(
    db: Session = Depends(get_db),
    current_ngo: models.NGO = Depends(get_current_ngo)
):
    """NGO-authenticated endpoint to view all pending user pet listings."""
    return crud.get_all_pending_pet_listings(db=db)


@app.put("/ngo/pets/listings/{listing_id}/approve", response_model=schemas.UserPetListing)
def approve_pet_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_ngo: models.NGO = Depends(get_current_ngo)
):
    result = crud.update_pet_listing_status(db=db, listing_id=listing_id, new_status="Approved")
    if not result:
        raise HTTPException(status_code=404, detail="Listing not found.")
    return result


@app.put("/ngo/pets/listings/{listing_id}/reject", response_model=schemas.UserPetListing)
def reject_pet_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_ngo: models.NGO = Depends(get_current_ngo)
):
    result = crud.update_pet_listing_status(db=db, listing_id=listing_id, new_status="Rejected")
    if not result:
        raise HTTPException(status_code=404, detail="Listing not found.")
    return result


# --- DONOR ANALYTICS ROUTES ---

@app.get("/donor/dashboard/donations/monthwise", response_model=List[schemas.MonthwiseDonation])
def get_monthwise_donations(db: Session = Depends(get_db)):
    """Public: Month-wise total donations for donor transparency dashboard."""
    return crud.get_donations_monthwise(db=db)

@app.get("/donor/dashboard/donations/yearwise", response_model=List[schemas.YearwiseDonation])
def get_yearwise_donations(db: Session = Depends(get_db)):
    """Public: Year-wise total donations for donor transparency dashboard."""
    return crud.get_donations_yearwise(db=db)

@app.get("/donor/dashboard/cases-supported", response_model=schemas.CaseStats)
def get_cases_supported(db: Session = Depends(get_db)):
    """Public: Case statistics for donor dashboard."""
    return crud.get_case_stats(db=db)

@app.get("/donor/dashboard/adoptions", response_model=schemas.AdoptionStats)
def get_adoption_stats(db: Session = Depends(get_db)):
    """Public: Adoption statistics for donor dashboard."""
    return crud.get_adoption_stats(db=db)


# ───── PLATFORM SUMMARY (Public) ─────────────────────
@app.get("/stats/summary")
def get_platform_summary(db: Session = Depends(get_db)):
    """Public: Single lightweight endpoint with platform-wide KPIs for dashboard and landing page."""
    case_stats    = crud.get_case_stats(db=db)
    adopt_stats   = crud.get_adoption_stats(db=db)
    return {
        "total_cases":      case_stats["total_cases"],
        "resolved_cases":   case_stats["resolved_cases"],
        "active_cases":     case_stats["active_cases"],
        "total_adoptions":  adopt_stats["total_adoptions"],
        "available_pets":   adopt_stats["available_pets"],
        "ngo_count":        adopt_stats["ngo_count"],
    }


# ───── DONOR VERIFICATION ─────────────────────────────

@app.post("/donor/verify/email/request")
def donor_email_verify_request(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """User-auth: generates email OTP, returns code (dev mode — shown to user)."""
    code = crud.request_email_verification(db=db, user_id=current_user.id)
    return {"message": "Verification code generated.", "code": code,
            "note": "In production, this code would be emailed. Use it to confirm."}

@app.post("/donor/verify/email/confirm")
def donor_email_verify_confirm(
    payload: schemas.DonorCodeConfirm,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ok = crud.confirm_email_verification(db=db, user_id=current_user.id, code=payload.code)
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid or expired code.")
    return {"message": "Email verified successfully.", "email_verified": True}

@app.post("/donor/verify/phone/request")
def donor_phone_verify_request(
    payload: schemas.DonorVerifyRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not payload.phone:
        raise HTTPException(status_code=400, detail="Phone number required.")
    code = crud.request_phone_verification(db=db, user_id=current_user.id, phone=payload.phone)
    return {"message": "Verification code generated.", "code": code,
            "note": "In production, this code would be SMSed. Use it to confirm."}

@app.post("/donor/verify/phone/confirm")
def donor_phone_verify_confirm(
    payload: schemas.DonorCodeConfirm,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ok = crud.confirm_phone_verification(db=db, user_id=current_user.id, code=payload.code)
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid or expired code.")
    return {"message": "Phone verified successfully.", "phone_verified": True}

@app.get("/donor/status", response_model=schemas.DonorVerificationStatus)
def donor_verification_status(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return crud.get_or_create_donor_verification(db=db, user_id=current_user.id)


# ───── NGO ANALYTICS ──────────────────────────────────

@app.get("/ngo/dashboard/cases/yearwise", response_model=List[schemas.TimeCount])
def ngo_cases_yearwise(
    db: Session = Depends(get_db),
    current_ngo: models.NGO = Depends(get_current_ngo)
):
    return crud.get_ngo_cases_yearwise(db=db, ngo_id=current_ngo.id)

@app.get("/ngo/dashboard/cases/monthwise", response_model=List[schemas.TimeCount])
def ngo_cases_monthwise(
    db: Session = Depends(get_db),
    current_ngo: models.NGO = Depends(get_current_ngo)
):
    return crud.get_ngo_cases_monthwise(db=db, ngo_id=current_ngo.id)

@app.get("/ngo/dashboard/species", response_model=List[schemas.SpeciesCount])
def ngo_cases_species(
    db: Session = Depends(get_db),
    current_ngo: models.NGO = Depends(get_current_ngo)
):
    return crud.get_ngo_cases_by_species(db=db, ngo_id=current_ngo.id)

@app.get("/ngo/dashboard/adoptions", response_model=List[schemas.TimeCount])
def ngo_adoptions(
    db: Session = Depends(get_db),
    current_ngo: models.NGO = Depends(get_current_ngo)
):
    return crud.get_ngo_adoptions_monthwise(db=db, ngo_id=current_ngo.id)

@app.get("/ngo/dashboard/donations", response_model=List[schemas.TimeAmount])
def ngo_donations(
    db: Session = Depends(get_db),
    current_ngo: models.NGO = Depends(get_current_ngo)
):
    return crud.get_ngo_donations_monthwise(db=db, ngo_id=current_ngo.id)


# ───── ADMIN ANALYTICS ────────────────────────────────

@app.get("/admin/dashboard/cases", response_model=schemas.AdminCaseAnalytics)
def admin_cases(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    return crud.get_admin_case_analytics(db=db)

@app.get("/admin/dashboard/donations", response_model=schemas.AdminDonationAnalytics)
def admin_donations(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    return crud.get_admin_donation_analytics(db=db)

@app.get("/admin/dashboard/adoptions", response_model=schemas.AdminAdoptionAnalytics)
def admin_adoptions(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    return crud.get_admin_adoption_analytics(db=db)


@app.get("/donations/ngos", response_model=List[schemas.NGODonationStats])
def get_ngos_for_donation(db: Session = Depends(get_db)):
    """
    Returns verified NGOs with donation stats (last 30 days).
    """
    return crud.get_ngos_with_donation_stats(db)



@app.put("/ngo/me/upi")
def update_ngo_upi(
    body: dict = Body(...),
    db: Session = Depends(get_db),
    current_ngo: models.NGO = Depends(get_current_ngo)
):
    """NGO-authenticated: save / update their UPI VPA (e.g. testngo@upi)."""
    upi_id = body.get("upi_id", "").strip()
    if not upi_id:
        raise HTTPException(status_code=400, detail="upi_id is required")
    db_ngo = db.query(models.NGO).filter(models.NGO.id == current_ngo.id).first()
    db_ngo.upi_id = upi_id
    db.commit()
    db.refresh(db_ngo)
    return {"message": "UPI ID updated.", "upi_id": db_ngo.upi_id}


# ---------- CREATE ORDER (Platform account only, NO transfers) ----------
class DonationOrderRequest(BaseModel):
    amount: float
    ngo_id: int

@app.post("/donations/create-order")
def create_payment_order(
    payload: DonationOrderRequest,
    db: Session = Depends(get_db)
):
    amount = payload.amount
    ngo_id = payload.ngo_id
    ngo = crud.get_ngo_by_id(db, ngo_id)
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")

    # Razorpay only accepts paise
    paise = int(amount * 100)

    order_data = {
        "amount": paise,
        "currency": "INR",
        "receipt": f"ngo_{ngo_id}_{uuid.uuid4().hex[:6]}"
    }

    try:
        razorpay_order = razorpay_client.order.create(data=order_data)

        donation = models.Donation(
            amount=amount,
            ngo_id=ngo_id,
            order_id=razorpay_order["id"],
            status="Pending",
            donor_email=None,   # Will be set on payment verification
            donor_name=None     # Will be set on payment verification
        )
        db.add(donation)
        db.commit()

        return {
            "order_id": razorpay_order["id"],
            "amount": razorpay_order["amount"],
            "currency": "INR"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")



# ---------- VERIFY PAYMENT FROM FRONTEND CHECKOUT ----------
@app.post("/donations/verify")
def verify_payment(
    payment_id: str = Body(...),
    order_id: str = Body(...),
    signature: str = Body(...),
    db: Session = Depends(get_db)
):
    """
    Verifies the signature returned by Razorpay checkout.
    Marks donation as Success.
    """

    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_payment_id": payment_id,
            "razorpay_order_id": order_id,
            "razorpay_signature": signature,
        })

        donation = db.query(models.Donation).filter(
            models.Donation.order_id == order_id
        ).first()

        if not donation:
            raise HTTPException(status_code=404, detail="Donation not found")

        donation.status = "Success"
        donation.payment_id = payment_id
        donation.timestamp = datetime.utcnow()
        db.commit()

        return {"status": "success"}

    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Razorpay signature")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


# ---------- WEBHOOK HANDLER (source of truth) ----------
@app.post("/razorpay/webhook")
async def razorpay_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Handles Razorpay events like payment.captured to ensure donation records are updated.
    """
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")

    if not signature or not RAZORPAY_WEBHOOK_SECRET:
        return JSONResponse(status_code=400, content={"detail": "Missing webhook signature"})

    try:
        razorpay_client.utility.verify_webhook_signature(body, signature, RAZORPAY_WEBHOOK_SECRET)
    except Exception:
        return JSONResponse(status_code=400, content={"detail": "Webhook signature invalid"})

    payload = json.loads(body)
    event = payload.get("event")
    data = payload.get("payload", {})

    # Payment captured = donation confirmed
    if event == "payment.captured":
        payment = data.get("payment", {}).get("entity", {})
        order_id = payment.get("order_id")
        payment_id = payment.get("id")

        donation = db.query(models.Donation).filter(models.Donation.order_id == order_id).first()
        if donation:
            donation.status = "Success"
            donation.payment_id = payment_id
            donation.timestamp = datetime.utcnow()
            db.commit()

    return {"status": "ok"}


# ═══════════════════════════════════════════════════════════════
#  FEATURE 1: SMART NGO DISPATCH
# ═══════════════════════════════════════════════════════════════

@app.get("/admin/cases/pending-unassigned")
def get_pending_unassigned_cases(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Admin: returns all cases that are still Pending (not yet accepted by any NGO)."""
    cases = db.query(models.Case).filter(models.Case.status == "Pending").order_by(models.Case.created_at.desc()).all()
    severity_order = {"Critical": 0, "High": 1, "Moderate": 2, "Low": 3}
    cases.sort(key=lambda c: severity_order.get(c.severity_label or "Low", 4))
    return [
        {
            "id": c.id,
            "description": c.description,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "photo_url": c.photo_url,
            "status": c.status,
            "severity_label": c.severity_label or "Low",
            "severity_score": c.severity_score or 0,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in cases
    ]


@app.get("/admin/cases/{case_id}/dispatch")
def dispatch_recommendations(
    case_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """
    Feature 1 – Smart Dispatch: returns ranked NGO recommendations for a specific case.
    Uses Haversine distance + caseload to compute each NGO's suitability score.
    """
    db_case = crud.get_case_by_id(db, case_id=case_id)
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Get all verified NGOs
    ngos = db.query(models.NGO).filter(models.NGO.is_verified == True).all()

    # Count active (Accepted) cases per NGO
    active_counts = {}
    for ngo in ngos:
        active_counts[ngo.id] = db.query(models.Case).filter(
            models.Case.accepted_by_ngo_id == ngo.id,
            models.Case.status == "Accepted"
        ).count()

    ranked = rank_ngos_for_case(
        case_lat=db_case.latitude,
        case_lon=db_case.longitude,
        ngos=ngos,
        active_case_counts=active_counts
    )
    return {"case_id": case_id, "recommendations": ranked[:5]}  # top 5


@app.put("/admin/cases/{case_id}/assign/{ngo_id}")
def admin_assign_case_to_ngo(
    case_id: int,
    ngo_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """Admin force-assigns a specific NGO to a pending case."""
    db_case = crud.get_case_by_id(db, case_id=case_id)
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")
    db_ngo = crud.get_ngo_by_id(db, ngo_id=ngo_id)
    if not db_ngo:
        raise HTTPException(status_code=404, detail="NGO not found")

    db_case.status = "Accepted"
    db_case.accepted_by_ngo_id = ngo_id
    db.commit()
    db.refresh(db_case)
    return {"message": f"Case {case_id} assigned to NGO '{db_ngo.name}' successfully.", "case_id": case_id, "ngo_id": ngo_id}


# ═══════════════════════════════════════════════════════════════
#  FEATURE 4: ZONE RED HOTSPOT MAP
# ═══════════════════════════════════════════════════════════════

@app.get("/admin/hotspots")
def get_hotspot_clusters(
    k: int = 5,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    """
    Feature 4 – Zone Red: Runs K-Means on all case GPS coordinates and returns
    danger zone clusters for the admin hotspot map.
    """
    all_cases = db.query(models.Case).filter(
        models.Case.latitude != None,
        models.Case.longitude != None
    ).all()

    case_points = [
        {"id": c.id, "lat": c.latitude, "lon": c.longitude, "severity_label": c.severity_label or "Low"}
        for c in all_cases
        if c.latitude is not None and c.longitude is not None
    ]

    clusters = cluster_case_hotspots(case_points, k=k)

    # Also return individual case markers for the map
    markers = [
        {
            "id": c.id,
            "lat": c.latitude,
            "lon": c.longitude,
            "severity_label": c.severity_label or "Low",
            "description": (c.description or "")[:60] + ("..." if len(c.description or "") > 60 else ""),
            "status": c.status,
        }
        for c in all_cases
    ]

    return {
        "total_cases_mapped": len(case_points),
        "clusters": clusters,
        "markers": markers,
    }


# ═══════════════════════════════════════════════════════════════
#  FOOD MARKETPLACE
# ═══════════════════════════════════════════════════════════════

@app.get("/food/products")
def list_food_products(category: str = None, db: Session = Depends(get_db)):
    """Public: List all available food products, optionally filtered by category."""
    products = crud.get_all_food_products(db=db)
    if category:
        products = [p for p in products if p.category.lower() == category.lower()]
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "image_url": p.image_url,
            "category": p.category,
            "seller_name": p.seller_name,
            "stock": p.stock,
            "is_available": p.is_available,
        }
        for p in products
    ]


@app.post("/food/products")
def add_food_product(
    name: str = Body(...),
    description: str = Body(""),
    price: float = Body(...),
    image_url: str = Body(""),
    category: str = Body("Dry Food"),
    seller_name: str = Body("StrayCare Shop"),
    stock: int = Body(100),
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user),
):
    """Admin-only: Add a new food product to the catalogue."""
    return crud.create_food_product(
        db=db, name=name, description=description, price=price,
        image_url=image_url, category=category, seller_name=seller_name, stock=stock,
    )


@app.post("/food/order")
def place_food_order(
    product_id: int = Body(...),
    quantity: int = Body(...),
    buyer_name: str = Body(...),
    buyer_email: str = Body(...),
    buyer_phone: str = Body(""),
    delivery_address: str = Body(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Authenticated citizen: Place a food order."""
    product = db.query(models.FoodProduct).filter(models.FoodProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if not product.is_available or product.stock < quantity:
        raise HTTPException(status_code=400, detail="Product not available or insufficient stock")

    order = crud.create_food_order(
        db=db,
        product_id=product_id,
        quantity=quantity,
        buyer_name=buyer_name,
        buyer_email=buyer_email,
        buyer_phone=buyer_phone,
        delivery_address=delivery_address,
        user_id=current_user.id,
    )
    # Reduce stock
    product.stock = max(0, product.stock - quantity)
    if product.stock == 0:
        product.is_available = False
    db.commit()

    return {
        "id": order.id,
        "product_name": order.product_name,
        "quantity": order.quantity,
        "total_price": order.total_price,
        "status": order.status,
        "ordered_at": order.ordered_at.isoformat() if order.ordered_at else None,
    }


@app.get("/food/orders/me")
def get_my_food_orders(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Citizen: Get their own food order history."""
    orders = crud.get_orders_by_email(db=db, email=current_user.email)
    return [
        {
            "id": o.id,
            "product_name": o.product_name,
            "quantity": o.quantity,
            "total_price": o.total_price,
            "status": o.status,
            "delivery_address": o.delivery_address,
            "ordered_at": o.ordered_at.isoformat() if o.ordered_at else None,
        }
        for o in orders
    ]


@app.get("/admin/food/orders")
def admin_get_food_orders(db: Session = Depends(get_db), admin_user: models.User = Depends(get_current_admin_user)):
    """Admin: Get all food orders."""
    orders = crud.get_all_food_orders(db=db)
    return [
        {
            "id": o.id,
            "product_name": o.product_name,
            "quantity": o.quantity,
            "total_price": o.total_price,
            "status": o.status,
            "buyer_name": o.buyer_name,
            "buyer_email": o.buyer_email,
            "buyer_phone": o.buyer_phone,
            "delivery_address": o.delivery_address,
            "ordered_at": o.ordered_at.isoformat() if o.ordered_at else None,
        }
        for o in orders
    ]


@app.put("/admin/food/orders/{order_id}/status")
def admin_update_order_status(
    order_id: int,
    body: dict = Body(...),
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user),
):
    """Admin: Update a food order status (Pending → Confirmed → Delivered)."""
    new_status = body.get("status")
    if new_status not in ["Pending", "Confirmed", "Delivered", "Cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    order = crud.update_food_order_status(db=db, order_id=order_id, new_status=new_status)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"id": order.id, "status": order.status}


