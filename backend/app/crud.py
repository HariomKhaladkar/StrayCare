# app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas, security
from datetime import datetime, timedelta

# User CRUD
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(email=user.email, name=user.name, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# NGO CRUD
def get_ngo_by_email(db: Session, email: str):
    return db.query(models.NGO).filter(models.NGO.email == email).first()

def create_ngo(db: Session, ngo: schemas.NGOCreate, verification_document_url: str | None = None):
    hashed_password = security.get_password_hash(ngo.password)
    db_ngo = models.NGO(email=ngo.email, name=ngo.name, hashed_password=hashed_password, verification_document_url=verification_document_url)
    db.add(db_ngo)
    db.commit()
    db.refresh(db_ngo)
    return db_ngo

def delete_ngo_by_id(db: Session, ngo_id: int):
    db_ngo = db.query(models.NGO).filter(models.NGO.id == ngo_id).first()
    if db_ngo:
        db.delete(db_ngo)
        db.commit()
        return True
    return False
# Case CRUD
def create_user_case(db: Session, case: schemas.CaseCreate, user_id: int, photo_url: str):
    db_case = models.Case(**case.dict(), owner_id=user_id, photo_url=photo_url)
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    return db_case

def get_pending_cases(db: Session):
    return db.query(models.Case).filter(models.Case.status == "Pending").order_by(models.Case.created_at.desc()).all()

def get_case_by_id(db: Session, case_id: int):
    return db.query(models.Case).filter(models.Case.id == case_id).first()

def create_case_update(db: Session, notes: str, case_id: int, ngo_id: int, photo_url: str | None = None):
    db_update = models.CaseUpdate(
        notes=notes,
        case_id=case_id,
        ngo_id=ngo_id,
        photo_url=photo_url
    )
    db.add(db_update)
    db.commit()
    db.refresh(db_update)
    return db_update


def update_case_status(db: Session, case_id: int, status: str, ngo_id: int | None = None):
    db_case = get_case_by_id(db, case_id=case_id)
    if db_case:
        db_case.status = status
        # If the case is being accepted, assign the NGO
        if status == "Accepted":
            db_case.accepted_by_ngo_id = ngo_id
        db.commit()
        db.refresh(db_case)
    return db_case

def create_test_ngo(db: Session):
    """
    Checks for and creates a pre-verified test NGO on startup.
    """
    test_ngo = get_ngo_by_email(db, email="testngo@example.com")
    if not test_ngo:
        ngo_in = schemas.NGOCreate(
            name="Test Rescue NGO",
            email="testngo@example.com",
            password="password"
        )
        db_ngo = create_ngo(db, ngo_in)
        db_ngo.is_verified = True
        db.commit()
        print("--- Created and verified test NGO: testngo@example.com / password ---")

def create_test_admin(db: Session):
    """
    Checks for and creates a test admin user on startup.
    """
    test_admin = get_user_by_email(db, email="admin@straycare.com")
    if not test_admin:
        admin_in = schemas.UserCreate(
            name="Admin User",
            email="admin@straycare.com",
            password="adminpassword"
        )
        db_admin = create_user(db, admin_in)
        db_admin.is_admin = True
        db.commit()
        print("--- Created test admin: admin@straycare.com / adminpassword ---")

def get_ngo_cases(db: Session, ngo_id: int):
    """
    Fetches all cases that are 'Pending' plus all cases that have been
    accepted by the specified NGO.
    """
    # 1. Get all cases that are waiting for any NGO to accept
    pending_cases = db.query(models.Case).filter(models.Case.status == "Pending").all()

    # 2. Get all cases that have already been accepted by this specific NGO
    accepted_cases = db.query(models.Case).filter(models.Case.accepted_by_ngo_id == ngo_id).all()
    
    # 3. Combine the lists and remove any duplicates to create the final list
    all_ngo_cases = {case.id: case for case in pending_cases + accepted_cases}
    
    return list(all_ngo_cases.values())

def seed_pets(db: Session):
    if db.query(models.Pet).count() == 0:
        ngo = db.query(models.NGO).first()
        if not ngo:
            print("--- Cannot seed pets, no NGOs found ---")
            return
        
        print("--- Seeding pets table ---")
        initial_pets = [
            models.Pet(name='Buddy', species='Dog', breed='Golden Retriever', age='2 years', gender='Male', size='Large', is_vaccinated=True, location='Wakad, Pmpri-Chinchwad', image_url='https://placehold.co/400x400/F8B400/493829?text=Buddy', ngo_id=ngo.id),
            models.Pet(name='Luna', species='Cat', breed='Siamese', age='1 year', gender='Female', size='Small', is_vaccinated=True, location='Hinjewadi, Pune', image_url='https://placehold.co/400x400/A0AEC0/FFFFFF?text=Luna', ngo_id=ngo.id),
            models.Pet(name='Max', species='Dog', breed='Beagle', age='8 months', gender='Male', size='Medium', is_vaccinated=False, location='Pimple Saudagar, PCMC', image_url='https://placehold.co/400x400/964B00/FFFFFF?text=Max', ngo_id=ngo.id),
            models.Pet(name='Bella', species='Cat', breed='Persian', age='3 years', gender='Female', size='Medium', is_vaccinated=True, location='Bhosari, Pimpri-Chinchwad', image_url='https://placehold.co/400x400/E5E7EB/4A5568?text=Bella', ngo_id=ngo.id),
            models.Pet(name='Rocky', species='Dog', breed='German Shepherd Mix', age='4 years', gender='Male', size='Large', is_vaccinated=True, location='Nigdi, Pimpri-Chinchwad', image_url='https://placehold.co/400x400/2D3748/FFFFFF?text=Rocky', ngo_id=ngo.id),
        ]
        db.add_all(initial_pets)
        db.commit()

def create_adoption_request(db: Session, request: schemas.AdoptionRequestCreate):
    pet = db.query(models.Pet).filter(models.Pet.id == request.pet_id).first()
    if not pet: 
        raise HTTPException(status_code=404, detail="Pet not found")
    
    db_request = models.AdoptionRequest(
        pet_id=request.pet_id,
        pet_name=pet.name,
        adopter_name=request.adopter_name,
        adopter_email=request.adopter_email,
        adopter_phone=request.adopter_phone,
        adopter_address=request.adopter_address,
        experience=request.experience,
        reason=request.reason,
        ngo_id=pet.ngo_id
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

def create_donation(db: Session, donation: schemas.DonationCreate):
    db_donation = models.Donation(**donation.dict())
    db.add(db_donation)
    db.commit()
    db.refresh(db_donation)
    return db_donation

def create_pet(db: Session, pet: schemas.PetCreate, image_url: str, ngo_id: int):
    """
    Creates a new pet entry in the database.
    """
    db_pet = models.Pet(
        **pet.dict(),
        image_url=image_url,
        ngo_id=ngo_id,
        status="Available"
    )
    db.add(db_pet)
    db.commit()
    db.refresh(db_pet)
    return db_pet

def create_feedback(db: Session, feedback: schemas.FeedbackCreate, user_id: int):
    """
    Creates a new feedback entry in the database.
    """
    db_feedback = models.Feedback(
        **feedback.dict(),
        user_id=user_id
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def get_feedback_for_ngo(db: Session, ngo_id: int):
    """
    Retrieves all feedback for a specific NGO and calculates the average rating.
    """
    reviews = db.query(models.Feedback).filter(models.Feedback.ngo_id == ngo_id).all()
    
    # Calculate average rating using SQLAlchemy's func.avg
    average_rating = db.query(func.avg(models.Feedback.rating)).filter(models.Feedback.ngo_id == ngo_id).scalar()
    
    return {
        "reviews": reviews,
        "total_reviews": len(reviews),
        "average_rating": round(average_rating, 1) if average_rating else None
    }

def get_all_feedback(db: Session):
    """
    Retrieves all feedback entries for the admin dashboard.
    """
    return db.query(models.Feedback).all()

def get_ngos_with_donation_stats(db: Session):
    """
    Fetches all Verified NGOs and calculates their total donations 
    received in the past 30 days.
    """
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # Get all verified NGOs
    ngos = db.query(models.NGO).filter(models.NGO.is_verified == True).all()
    
    results = []
    for ngo in ngos:
        # Calculate total successful donations for this NGO in the last 30 days
        total = db.query(func.sum(models.Donation.amount))\
            .filter(
                models.Donation.ngo_id == ngo.id,
                models.Donation.status == "Success",
                models.Donation.timestamp >= thirty_days_ago
            ).scalar() or 0.0
            
        # Create a response object (converting the SQLAlchemy model to a dict + new field)
        ngo_data = schemas.NGODonationStats(
            id=ngo.id,
            name=ngo.name,
            email=ngo.email,
            verification_document_url=ngo.verification_document_url,
            total_donations_last_30_days=total
        )
        results.append(ngo_data)
        
    return results

def get_all_transactions(db: Session):
    """
    Fetches all donations for the Admin dashboard.
    """
    return db.query(models.Donation).order_by(models.Donation.timestamp.desc()).all()

def get_ngo_by_id(db: Session, ngo_id: int):
    return db.query(models.NGO).filter(models.NGO.id == ngo_id).first()

def set_ngo_razorpay_account_id(db: Session, ngo_id: int, account_id: str):
    ngo = get_ngo_by_id(db, ngo_id)
    if not ngo:
        return None
    ngo.razorpay_account_id = account_id
    db.commit()
    db.refresh(ngo)
    return ngo

def notify_admins_on_donation(donation_id: int, db: Session):
    # Simple fetch + email sending helper; implement email using SMTP below
    donation = db.query(models.Donation).filter(models.Donation.id == donation_id).first()
    if not donation: return
    # build message
    # implement send_email(to_list, subject, body)
    try:
        admin_list = os.getenv("ADMIN_EMAILS", "")
        if not admin_list:
            return
        recipients = [e.strip() for e in admin_list.split(",") if e.strip()]
        subject = f"New Donation: ₹{donation.amount}"
        body = f"Donation ID: {donation.id}\nNGO ID: {donation.ngo_id}\nAmount: ₹{donation.amount}\nOrder ID: {donation.order_id}\nPayment ID: {donation.payment_id}\nStatus: {donation.status}\nTime: {donation.timestamp}"
        from .utils import send_email
        send_email(recipients, subject, body)
    except Exception as e:
        print("Failed to notify admins:", e)
