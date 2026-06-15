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

def create_pet(db: Session, pet: schemas.PetCreate, image_url: str, ngo_id: int, video_url: str | None = None):
    """
    Creates a new pet entry in the database.
    """
    db_pet = models.Pet(
        **pet.dict(),
        image_url=image_url,
        video_url=video_url,
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

def respond_to_feedback(db: Session, feedback_id: int, ngo_id: int, response: str):
    """
    Allows an NGO to add a response to a feedback entry they received.
    """
    db_feedback = db.query(models.Feedback).filter(
        models.Feedback.id == feedback_id,
        models.Feedback.ngo_id == ngo_id
    ).first()
    if not db_feedback:
        return None
    db_feedback.ngo_response = response
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def get_feedback_for_ngo(db: Session, ngo_id: int):
    """
    Retrieves all feedback for a specific NGO, calculates average rating and distribution.
    """
    reviews = db.query(models.Feedback).filter(models.Feedback.ngo_id == ngo_id).all()
    
    # Calculate average rating using SQLAlchemy's func.avg
    average_rating = db.query(func.avg(models.Feedback.rating)).filter(models.Feedback.ngo_id == ngo_id).scalar()
    
    # Calculate distribution: count per star (1-5)
    distribution = []
    for star in range(1, 6):
        count = db.query(models.Feedback).filter(
            models.Feedback.ngo_id == ngo_id,
            models.Feedback.rating == star
        ).count()
        distribution.append({"star": star, "count": count})
    
    return {
        "reviews": reviews,
        "total_reviews": len(reviews),
        "average_rating": round(average_rating, 1) if average_rating else None,
        "rating_distribution": distribution,
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
            total_donations_last_30_days=total,
            upi_id=ngo.upi_id  # pass-through for direct UPI deep-link on frontend
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


# --- User Pet Listing CRUD ---

def create_user_pet_listing(db: Session, listing: schemas.UserPetListingCreate, user_id: int, image_url: str):
    """Creates a new user-submitted pet listing."""
    db_listing = models.UserPetListing(
        **listing.dict(),
        user_id=user_id,
        image_url=image_url,
        status="Pending"
    )
    db.add(db_listing)
    db.commit()
    db.refresh(db_listing)
    return db_listing

def get_user_pet_listings(db: Session, user_id: int):
    """Gets all pet listings submitted by a specific user."""
    return db.query(models.UserPetListing).filter(
        models.UserPetListing.user_id == user_id
    ).order_by(models.UserPetListing.created_at.desc()).all()

def get_all_pending_pet_listings(db: Session):
    """Gets all pending user-submitted pet listings for NGO review, enriched with user_name."""
    listings = db.query(models.UserPetListing).filter(
        models.UserPetListing.status == "Pending"
    ).order_by(models.UserPetListing.created_at.desc()).all()

    # Attach user_name dynamically by fetching each submitter's name
    for listing in listings:
        user = db.query(models.User).filter(models.User.id == listing.user_id).first()
        listing.user_name = user.name if user else "Unknown"
    return listings

def update_pet_listing_status(db: Session, listing_id: int, new_status: str):
    """Updates the status of a user pet listing (Approved/Rejected)."""
    db_listing = db.query(models.UserPetListing).filter(
        models.UserPetListing.id == listing_id
    ).first()
    if not db_listing:
        return None
    db_listing.status = new_status
    db.commit()
    db.refresh(db_listing)
    return db_listing


# --- Donor Analytics CRUD ---

def get_donations_monthwise(db: Session):
    """Returns total successful donations grouped by month for the last 12 months."""
    from sqlalchemy import func, text
    rows = (
        db.query(
            func.strftime("%Y-%m", models.Donation.timestamp).label("month_key"),
            func.sum(models.Donation.amount).label("amount")
        )
        .filter(models.Donation.status == "Success")
        .group_by(func.strftime("%Y-%m", models.Donation.timestamp))
        .order_by(func.strftime("%Y-%m", models.Donation.timestamp).asc())
        .limit(12)
        .all()
    )
    result = []
    for row in rows:
        # Convert "2025-03" -> "Mar 2025"
        try:
            from datetime import datetime as dt
            d = dt.strptime(row.month_key, "%Y-%m")
            label = d.strftime("%b %Y")
        except Exception:
            label = row.month_key
        result.append({"month": label, "amount": round(row.amount or 0, 2)})
    return result

def get_donations_yearwise(db: Session):
    """Returns total successful donations grouped by year."""
    from sqlalchemy import func
    rows = (
        db.query(
            func.strftime("%Y", models.Donation.timestamp).label("year"),
            func.sum(models.Donation.amount).label("amount")
        )
        .filter(models.Donation.status == "Success")
        .group_by(func.strftime("%Y", models.Donation.timestamp))
        .order_by(func.strftime("%Y", models.Donation.timestamp).asc())
        .all()
    )
    return [{"year": row.year, "amount": round(row.amount or 0, 2)} for row in rows]

def get_case_stats(db: Session):
    """Returns case statistics for the donor transparency dashboard."""
    total = db.query(models.Case).count()
    resolved = db.query(models.Case).filter(models.Case.status == "Resolved").count()
    active = db.query(models.Case).filter(models.Case.status.in_(["Pending", "Accepted"])).count()
    return {"total_cases": total, "resolved_cases": resolved, "active_cases": active}

def get_adoption_stats(db: Session):
    """Returns adoption statistics for the donor transparency dashboard."""
    total_adopted = db.query(models.Pet).filter(models.Pet.status == "Adopted").count()
    available = db.query(models.Pet).filter(models.Pet.status == "Available").count()
    ngo_count = db.query(models.NGO).filter(models.NGO.is_verified == True).count()
    return {"total_adoptions": total_adopted, "available_pets": available, "ngo_count": ngo_count}


# ════════════════════════════════════════════
# DONOR VERIFICATION
# ════════════════════════════════════════════

def _make_code() -> str:
    import random
    return str(random.randint(100000, 999999))

def _update_verification_status(record: models.DonorVerification):
    from datetime import datetime
    if record.email_verified and record.phone_verified:
        record.verification_status = "Verified"
        record.verified_at = datetime.utcnow()
    elif record.email_verified or record.phone_verified:
        record.verification_status = "Partial"
    else:
        record.verification_status = "Unverified"

def get_or_create_donor_verification(db: Session, user_id: int) -> models.DonorVerification:
    record = db.query(models.DonorVerification).filter(
        models.DonorVerification.user_id == user_id
    ).first()
    if not record:
        record = models.DonorVerification(user_id=user_id)
        db.add(record)
        db.commit()
        db.refresh(record)
    return record

def request_email_verification(db: Session, user_id: int) -> str:
    """Generates an email OTP, stores it, returns it (dev mode — display to user)."""
    record = get_or_create_donor_verification(db, user_id)
    code = _make_code()
    record.email_code = code
    db.commit()
    return code

def confirm_email_verification(db: Session, user_id: int, code: str) -> bool:
    record = get_or_create_donor_verification(db, user_id)
    if record.email_code and record.email_code == code:
        record.email_verified = True
        record.email_code = None
        _update_verification_status(record)
        db.commit()
        db.refresh(record)
        return True
    return False

def request_phone_verification(db: Session, user_id: int, phone: str) -> str:
    """Generates a phone OTP, stores it, returns it (dev mode)."""
    record = get_or_create_donor_verification(db, user_id)
    code = _make_code()
    record.phone_code = code
    record.phone_number = phone
    db.commit()
    return code

def confirm_phone_verification(db: Session, user_id: int, code: str) -> bool:
    record = get_or_create_donor_verification(db, user_id)
    if record.phone_code and record.phone_code == code:
        record.phone_verified = True
        record.phone_code = None
        _update_verification_status(record)
        db.commit()
        db.refresh(record)
        return True
    return False


# ════════════════════════════════════════════
# NGO ANALYTICS
# ════════════════════════════════════════════

def _fmt_month(key: str) -> str:
    """Convert '2025-03' → 'Mar 2025'."""
    try:
        from datetime import datetime as dt
        return dt.strptime(key, "%Y-%m").strftime("%b %Y")
    except Exception:
        return key

def get_ngo_cases_yearwise(db: Session, ngo_id: int):
    from sqlalchemy import func
    rows = (db.query(
            func.strftime("%Y", models.Case.created_at).label("yr"),
            func.count(models.Case.id).label("cnt"))
        .filter(models.Case.accepted_by_ngo_id == ngo_id)
        .group_by(func.strftime("%Y", models.Case.created_at))
        .order_by(func.strftime("%Y", models.Case.created_at).asc())
        .all())
    return [{"label": r.yr, "count": r.cnt} for r in rows]

def get_ngo_cases_monthwise(db: Session, ngo_id: int):
    from sqlalchemy import func
    rows = (db.query(
            func.strftime("%Y-%m", models.Case.created_at).label("mo"),
            func.count(models.Case.id).label("cnt"))
        .filter(models.Case.accepted_by_ngo_id == ngo_id)
        .group_by(func.strftime("%Y-%m", models.Case.created_at))
        .order_by(func.strftime("%Y-%m", models.Case.created_at).asc())
        .limit(12).all())
    return [{"label": _fmt_month(r.mo), "count": r.cnt} for r in rows]

def get_ngo_cases_by_species(db: Session, ngo_id: int):
    """Cases grouped by species via adoptable Pet records owned by NGO."""
    from sqlalchemy import func
    rows = (db.query(
            models.Pet.species.label("species"),
            func.count(models.Pet.id).label("cnt"))
        .filter(models.Pet.ngo_id == ngo_id)
        .group_by(models.Pet.species)
        .order_by(func.count(models.Pet.id).desc())
        .all())
    return [{"species": r.species or "Unknown", "count": r.cnt} for r in rows]

def get_ngo_adoptions_monthwise(db: Session, ngo_id: int):
    from sqlalchemy import func
    rows = (db.query(
            func.strftime("%Y-%m", models.AdoptionRequest.request_date).label("mo"),
            func.count(models.AdoptionRequest.id).label("cnt"))
        .filter(
            models.AdoptionRequest.ngo_id == ngo_id,
            models.AdoptionRequest.status == "Approved")
        .group_by(func.strftime("%Y-%m", models.AdoptionRequest.request_date))
        .order_by(func.strftime("%Y-%m", models.AdoptionRequest.request_date).asc())
        .limit(12).all())
    return [{"label": _fmt_month(r.mo), "count": r.cnt} for r in rows]

def get_ngo_donations_monthwise(db: Session, ngo_id: int):
    from sqlalchemy import func
    rows = (db.query(
            func.strftime("%Y-%m", models.Donation.timestamp).label("mo"),
            func.sum(models.Donation.amount).label("amount"))
        .filter(
            models.Donation.ngo_id == ngo_id,
            models.Donation.status == "Success")
        .group_by(func.strftime("%Y-%m", models.Donation.timestamp))
        .order_by(func.strftime("%Y-%m", models.Donation.timestamp).asc())
        .limit(12).all())
    return [{"label": _fmt_month(r.mo), "amount": round(r.amount or 0, 2)} for r in rows]


# ════════════════════════════════════════════
# ADMIN ANALYTICS
# ════════════════════════════════════════════

def get_admin_case_analytics(db: Session):
    from sqlalchemy import func
    total    = db.query(models.Case).count()
    resolved = db.query(models.Case).filter(models.Case.status == "Resolved").count()
    pending  = db.query(models.Case).filter(models.Case.status == "Pending").count()
    accepted = db.query(models.Case).filter(models.Case.status == "Accepted").count()
    rows = (db.query(
            func.strftime("%Y-%m", models.Case.created_at).label("mo"),
            func.count(models.Case.id).label("cnt"))
        .group_by(func.strftime("%Y-%m", models.Case.created_at))
        .order_by(func.strftime("%Y-%m", models.Case.created_at).asc())
        .limit(12).all())
    monthwise = [{"label": _fmt_month(r.mo), "count": r.cnt} for r in rows]
    return {"total": total, "resolved": resolved, "pending": pending,
            "accepted": accepted, "monthwise": monthwise}

def get_admin_donation_analytics(db: Session):
    from sqlalchemy import func
    total_amount = db.query(func.sum(models.Donation.amount)).filter(
        models.Donation.status == "Success").scalar() or 0.0
    rows = (db.query(
            func.strftime("%Y-%m", models.Donation.timestamp).label("mo"),
            func.sum(models.Donation.amount).label("amount"))
        .filter(models.Donation.status == "Success")
        .group_by(func.strftime("%Y-%m", models.Donation.timestamp))
        .order_by(func.strftime("%Y-%m", models.Donation.timestamp).asc())
        .limit(12).all())
    monthwise = [{"label": _fmt_month(r.mo), "amount": round(r.amount or 0, 2)} for r in rows]
    return {"total_amount": round(total_amount, 2), "monthwise": monthwise}

def get_admin_adoption_analytics(db: Session):
    from sqlalchemy import func
    total_adopted = db.query(models.Pet).filter(models.Pet.status == "Adopted").count()
    available     = db.query(models.Pet).filter(models.Pet.status == "Available").count()
    rows = (db.query(
            func.strftime("%Y-%m", models.AdoptionRequest.request_date).label("mo"),
            func.count(models.AdoptionRequest.id).label("cnt"))
        .filter(models.AdoptionRequest.status == "Approved")
        .group_by(func.strftime("%Y-%m", models.AdoptionRequest.request_date))
        .order_by(func.strftime("%Y-%m", models.AdoptionRequest.request_date).asc())
        .limit(12).all())
    monthwise = [{"label": _fmt_month(r.mo), "count": r.cnt} for r in rows]
    return {"total_adopted": total_adopted, "available": available, "monthwise": monthwise}


# ════════════════════════════════════════════
# NOTIFICATIONS
# ════════════════════════════════════════════

def create_notification(db: Session, message: str, notif_type: str = "info",
                        user_id: int = None, ngo_id: int = None, case_id: int = None):
    """Creates a single notification record for either a user or an NGO."""
    notif = models.Notification(
        message=message,
        type=notif_type,
        user_id=user_id,
        ngo_id=ngo_id,
        case_id=case_id,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def get_user_notifications(db: Session, user_id: int, limit: int = 20):
    """Returns the latest notifications for a citizen user."""
    return (
        db.query(models.Notification)
        .filter(models.Notification.user_id == user_id)
        .order_by(models.Notification.created_at.desc())
        .limit(limit)
        .all()
    )


def get_ngo_notifications(db: Session, ngo_id: int, limit: int = 20):
    """Returns the latest notifications for an NGO."""
    return (
        db.query(models.Notification)
        .filter(models.Notification.ngo_id == ngo_id)
        .order_by(models.Notification.created_at.desc())
        .limit(limit)
        .all()
    )


def mark_user_notifications_read(db: Session, user_id: int):
    """Marks all unread notifications for a user as read."""
    db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.is_read == False
    ).update({"is_read": True})
    db.commit()


def mark_ngo_notifications_read(db: Session, ngo_id: int):
    """Marks all unread notifications for an NGO as read."""
    db.query(models.Notification).filter(
        models.Notification.ngo_id == ngo_id,
        models.Notification.is_read == False
    ).update({"is_read": True})
    db.commit()


# ════════════════════════════════════════════
# FOOD MARKETPLACE
# ════════════════════════════════════════════

def get_all_food_products(db: Session):
    """Returns all available food products."""
    return db.query(models.FoodProduct).filter(models.FoodProduct.is_available == True).order_by(models.FoodProduct.category).all()

def create_food_product(db: Session, name: str, description: str, price: float,
                        image_url: str, category: str, seller_name: str, stock: int):
    product = models.FoodProduct(
        name=name, description=description, price=price, image_url=image_url,
        category=category, seller_name=seller_name, stock=stock,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

def create_food_order(db: Session, product_id: int, quantity: int,
                      buyer_name: str, buyer_email: str, buyer_phone: str,
                      delivery_address: str, user_id: int = None):
    product = db.query(models.FoodProduct).filter(models.FoodProduct.id == product_id).first()
    if not product:
        return None
    order = models.FoodOrder(
        product_id=product_id,
        product_name=product.name,
        quantity=quantity,
        total_price=round(product.price * quantity, 2),
        buyer_name=buyer_name,
        buyer_email=buyer_email,
        buyer_phone=buyer_phone,
        delivery_address=delivery_address,
        user_id=user_id,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

def get_orders_by_email(db: Session, email: str):
    """Returns all orders placed by a buyer email."""
    return (
        db.query(models.FoodOrder)
        .filter(models.FoodOrder.buyer_email == email)
        .order_by(models.FoodOrder.ordered_at.desc())
        .all()
    )

def get_all_food_orders(db: Session):
    """Admin: returns all food orders."""
    return db.query(models.FoodOrder).order_by(models.FoodOrder.ordered_at.desc()).all()

def update_food_order_status(db: Session, order_id: int, new_status: str):
    order = db.query(models.FoodOrder).filter(models.FoodOrder.id == order_id).first()
    if not order:
        return None
    order.status = new_status
    db.commit()
    db.refresh(order)
    return order

def seed_food_products(db: Session):
    """Seeds 8 sample food products if none exist."""
    if db.query(models.FoodProduct).count() > 0:
        return
    products = [
        dict(name="Royal Canin Adult Dog Food", description="Complete nutrition for adult dogs. Supports digestion and skin health.", price=699.0, image_url="https://placehold.co/400x400/F8B400/493829?text=Dog+Food", category="Dry Food", seller_name="PetNutrition India", stock=50),
        dict(name="Whiskas Tuna Wet Cat Food", description="Delicious tuna flavor cats love. High moisture content, great for hydration.", price=85.0, image_url="https://placehold.co/400x400/A0AEC0/FFFFFF?text=Cat+Food", category="Wet Food", seller_name="Mars Petcare", stock=200),
        dict(name="Pedigree Chicken & Vegetables", description="Balanced dry food for stray dogs with chicken, vegetables, and minerals.", price=450.0, image_url="https://placehold.co/400x400/964B00/FFFFFF?text=Pedigree", category="Dry Food", seller_name="Pedigree India", stock=80),
        dict(name="Me-O Tuna & Shrimp Cat Treats", description="Irresistible treats for cats. Perfect as a reward or topping on regular meals.", price=120.0, image_url="https://placehold.co/400x400/E5E7EB/4A5568?text=Cat+Treats", category="Treats", seller_name="Me-O", stock=150),
        dict(name="Drools Puppy Starter", description="Specially formulated dry food for stray puppies aged 2–12 months.", price=320.0, image_url="https://placehold.co/400x400/2D3748/FFFFFF?text=Puppy+Food", category="Dry Food", seller_name="Drools India", stock=60),
        dict(name="Himalaya Erina-EP Dog Supplement", description="Anti-tick and flea supplement with neem and aloe for stray dog skin care.", price=195.0, image_url="https://placehold.co/400x400/6366f1/FFFFFF?text=Supplement", category="Supplements", seller_name="Himalaya", stock=100),
        dict(name="Fresho Dog Biscuits", description="Crunchy biscuits with milk and vegetables. Great as treats during training.", price=75.0, image_url="https://placehold.co/400x400/ec4899/FFFFFF?text=Biscuits", category="Treats", seller_name="FreshoNaturals", stock=300),
        dict(name="Royal Canin Kitten Food", description="Complete nutrition for kittens under 12 months. Supports immune system.", price=550.0, image_url="https://placehold.co/400x400/14b8a6/FFFFFF?text=Kitten+Food", category="Dry Food", seller_name="Royal Canin", stock=40),
    ]
    for p in products:
        db.add(models.FoodProduct(**p))
    db.commit()
    print("[OK] Food product catalog seeded.")
