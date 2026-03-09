# backend/app/main.py

# --- Standard Library Imports ---
from dotenv import load_dotenv
load_dotenv()

import os
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
import razorpay  
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")
RAZORPAY_MODE = os.getenv("RAZORPAY_MODE", "TEST")

if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
    print("Warning: Razorpay keys not configured. Donations with real Razorpay will fail.")
    
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


# --- Local Application Imports ---
from . import crud, models, schemas, security
from .database import SessionLocal, engine
from .first_aid_data import ARTICLES
from . import chatbot_logic

# Tell SQLAlchemy to create all the database tables based on our models
models.Base.metadata.create_all(bind=engine)

# Create the main FastAPI application instance
app = FastAPI(title="StrayCare")

# --- CORS (Cross-Origin Resource Sharing) Middleware ---
origins = [
    "http://localhost:3000",
    "https://straycare-frontend.vercel.app"
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
    from sqlalchemy import inspect
    db = SessionLocal()

    inspector = inspect(engine)

    # --- Check if tables exist ---
    required_tables = ["ngos", "users", "pets", "donations", "cases"]
    existing_tables = inspector.get_table_names()

    missing = [t for t in required_tables if t not in existing_tables]

    # --- Create tables if missing ---
    if missing:
        print(f"⚠️ Missing tables detected: {missing}")
        print("➡ Creating all tables...")
        models.Base.metadata.create_all(bind=engine)
    else:
        print("✅ All tables already exist.")

    # --- Safe Seeding Logic ---
    try:
        # Create TEST NGO only if does NOT exist
        if not crud.get_ngo_by_email(db, "testngo@example.com"):
            crud.create_test_ngo(db)
            print("✅ Test NGO seeded.")

        # Create TEST ADMIN only if does NOT exist
        if not crud.get_user_by_email(db, "admin@straycare.com"):
            crud.create_test_admin(db)
            print("✅ Test Admin seeded.")

        # Seed pets only if no pets exist
        if db.query(models.Pet).count() == 0:
            crud.seed_pets(db)
            print("🐶 Pet data seeded.")

    except Exception as e:
        print("❌ Startup seeding failed:", e)

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
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/token", response_model=schemas.LoginResponse)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token = security.create_access_token(data={"sub": user.email, "scope": "user"})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

# --- NGO AUTH ROUTES ---

@app.post("/ngos/register", response_model=schemas.NGO)
async def register_ngo(name: str = Form(...), email: str = Form(...), password: str = Form(...), document: UploadFile = File(...), db: Session = Depends(get_db)):
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
    return crud.create_ngo(db=db, ngo=ngo_data, verification_document_url=doc_url)

@app.post("/ngo/token", response_model=schemas.NGOLoginResponse)
def login_ngo(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    ngo = crud.get_ngo_by_email(db, email=form_data.username)
    if not ngo or not security.verify_password(form_data.password, ngo.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect NGO email or password")
    if not ngo.is_verified:
        raise HTTPException(status_code=403, detail="NGO not verified")
    access_token = security.create_access_token(data={"sub": ngo.email, "scope": "ngo"})
    return {"access_token": access_token, "token_type": "bearer", "ngo": ngo}

# --- CASE ROUTES ---

@app.post("/report", response_model=schemas.Case)
async def report_case(description: str = Form(...), latitude: float = Form(...), longitude: float = Form(...), photo: UploadFile = File(...), db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    case_id = uuid.uuid4()
    filename = f"{case_id}_{os.path.basename(photo.filename)}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)
    photo_url = f"uploads/{filename}"
    
    case_data = schemas.CaseCreate(description=description, latitude=latitude, longitude=longitude)
    
    return crud.create_user_case(db=db, case=case_data, user_id=current_user.id, photo_url=photo_url)

@app.get("/ngo/me/cases", response_model=List[schemas.Case])
def get_ngo_cases(db: Session = Depends(get_db), current_ngo: schemas.NGO = Depends(get_current_ngo)):
    return crud.get_ngo_cases(db=db, ngo_id=current_ngo.id)

@app.get("/users/me/cases", response_model=List[schemas.Case])
def read_user_cases(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    return db.query(models.Case).filter(models.Case.owner_id == current_user.id).all()

@app.get("/cases/{case_id}", response_model=schemas.Case)
def read_case_details(case_id: int, db: Session = Depends(get_db)):
    db_case = crud.get_case_by_id(db, case_id=case_id)
    if db_case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return db_case

@app.put("/case/{case_id}/accept", response_model=schemas.Case)
def accept_case(case_id: int, db: Session = Depends(get_db), current_ngo: schemas.NGO = Depends(get_current_ngo)):
    return crud.update_case_status(db=db, case_id=case_id, status="Accepted", ngo_id=current_ngo.id)

@app.put("/case/{case_id}/reject", response_model=schemas.Case)
def reject_case(case_id: int, db: Session = Depends(get_db), current_ngo: schemas.NGO = Depends(get_current_ngo)):
    return crud.update_case_status(db=db, case_id=case_id, status="Rejected", ngo_id=current_ngo.id)

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
    return crud.create_case_update(db=db, notes=notes, case_id=case_id, ngo_id=current_ngo.id, photo_url=photo_url)

# --- SUPPORT ROUTES ---

@app.get("/first-aid/articles")
def get_first_aid_articles():
    return [{"id": a["id"], "title": a["title"], "category": a["category"], "summary": a["summary"]} for a in ARTICLES]

@app.get("/first-aid/articles/{article_id}")
def get_first_aid_article_detail(article_id: int):
    article = next((a for a in ARTICLES if a["id"] == article_id), None)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@app.post("/chatbot/query", response_model=schemas.ChatResponse)
async def chatbot_query(request: schemas.ChatQuery):
    response_text = chatbot_logic.get_chatbot_response(request.query)
    return {"response": response_text}

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
    image: UploadFile = File(...)
):
    file_id = uuid.uuid4()
    filename = f"pet_{file_id}_{os.path.basename(image.filename)}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    image_url = f"uploads/{filename}"

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

    return crud.create_pet(db=db, pet=pet_data, image_url=image_url, ngo_id=current_ngo.id)

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


@app.get("/feedback/summary/{ngo_id}", response_model=schemas.FeedbackSummary)
def get_ngo_feedback_summary(ngo_id: int, db: Session = Depends(get_db)):
    return crud.get_feedback_for_ngo(db=db, ngo_id=ngo_id)


@app.get("/admin/feedback", response_model=List[schemas.Feedback])
def get_all_platform_feedback(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin_user)
):
    return crud.get_all_feedback(db=db)


# -----------------------------------------
# DONATION ENDPOINTS (Option 2 - No Route)
# -----------------------------------------

@app.get("/donations/ngos", response_model=List[schemas.NGODonationStats])
def get_ngos_for_donation(db: Session = Depends(get_db)):
    """
    Returns verified NGOs with donation stats (last 30 days).
    """
    return crud.get_ngos_with_donation_stats(db)


# ---------- CREATE ORDER (Platform account only, NO transfers) ----------
@app.post("/donations/create-order")
def create_payment_order(
    amount: float = Body(...),
    ngo_id: int = Body(...),
    db: Session = Depends(get_db)
):
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
            status="Pending"
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
