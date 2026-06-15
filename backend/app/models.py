# app/models.py
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)
    cases = relationship("Case", back_populates="owner")

class NGO(Base):
    __tablename__ = "ngos"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_verified = Column(Boolean, default=False)
    verification_document_url = Column(String, nullable=True)
    donations = relationship("Donation", back_populates="ngo")
    razorpay_account_id = Column(String, nullable=True)
    upi_id = Column(String, nullable=True)  # e.g. "testngo@upi" for direct UPI fallback
    
class Case(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    photo_url = Column(String)
    status = Column(String, default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"))
    accepted_by_ngo_id = Column(Integer, ForeignKey("ngos.id"), nullable=True)

    pet_name = Column(String, nullable=True)
    is_adoptable = Column(Boolean, default=False) # Add a default value
    adoption_story = Column(String, nullable=True)
    temperament = Column(String, nullable=True)

    # Feature 3: Severity Triaging
    severity_score = Column(Integer, default=0)
    severity_label = Column(String, default="Low")  # Critical, High, Moderate, Low

    owner = relationship("User", back_populates="cases")
    updates = relationship("CaseUpdate", back_populates="case", cascade="all, delete-orphan")

class CaseUpdate(Base):
    __tablename__ = "case_updates"
    id = Column(Integer, primary_key=True, index=True)
    notes = Column(String, nullable=False)
    photo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    case_id = Column(Integer, ForeignKey("cases.id"))
    ngo_id = Column(Integer, ForeignKey("ngos.id"))

    case = relationship("Case", back_populates="updates")

class Pet(Base):
    __tablename__ = "pets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    species = Column(String)
    breed = Column(String)
    age = Column(String)
    gender = Column(String)
    size = Column(String)
    is_vaccinated = Column(Boolean, default=False)
    location = Column(String)
    image_url = Column(String)
    video_url = Column(String, nullable=True)  # Optional video for adoption listing
    status = Column(String, default="Available") # e.g., Available, Adopted
    # Link to the NGO that is handling the adoption
    ngo_id = Column(Integer, ForeignKey("ngos.id"))


class AdoptionRequest(Base):
    __tablename__ = "adoption_requests"
    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"))
    pet_name = Column(String)
    adopter_name = Column(String)
    adopter_email = Column(String)
    adopter_phone = Column(String)
    adopter_address = Column(String)
    status = Column(String, default="Pending") # e.g., Pending, Approved, Rejected
    request_date = Column(DateTime, default=datetime.utcnow)
    # Link to the NGO that received the request
    ngo_id = Column(Integer, ForeignKey("ngos.id"))
    experience = Column(String)
    reason = Column(String)

    
# class Donation(Base):
#     __tablename__ = "donations"
#     id = Column(Integer, primary_key=True, index=True)
#     amount = Column(Float, nullable=False)
#     donor_name = Column(String)
#     donor_email = Column(String)
#     donation_type = Column(String)  # e.g., general, medical
#     is_anonymous = Column(Boolean, default=False)
#     timestamp = Column(DateTime, default=datetime.utcnow)


class Donation(Base):
    __tablename__ = "donations"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False) # Amount in INR
    donor_name = Column(String)
    donor_email = Column(String)
    
    # Payment Gateway Details
    payment_id = Column(String, nullable=True) # from Razorpay
    order_id = Column(String, nullable=True)   # from Razorpay
    status = Column(String, default="Pending") # Pending, Success, Failed
    
    # Link to the NGO receiving the funds
    ngo_id = Column(Integer, ForeignKey("ngos.id"))
    
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationship
    ngo = relationship("NGO", back_populates="donations")

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    rating = Column(Integer, nullable=False) # 1 to 5 stars
    comment = Column(Text, nullable=True)
    category = Column(String, nullable=True)  # e.g., Response Time, Treatment Quality
    ngo_response = Column(Text, nullable=True)  # NGO's reply to the review
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # --- Contextual Links ---
    # The user who left the feedback
    user_id = Column(Integer, ForeignKey("users.id")) 
    # The NGO being reviewed
    ngo_id = Column(Integer, ForeignKey("ngos.id"))
    # The specific case the feedback is about
    case_id = Column(Integer, ForeignKey("cases.id"))

    # Relationships (optional but good practice)
    user = relationship("User")
    ngo = relationship("NGO")
    case = relationship("Case")


class UserPetListing(Base):
    __tablename__ = "user_pet_listings"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    species = Column(String, nullable=False)
    age = Column(String, nullable=False)
    location = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=False)
    status = Column(String, default="Pending")  # Pending, Approved, Rejected
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User")


class DonorVerification(Base):
    __tablename__ = "donor_verifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    email_verified = Column(Boolean, default=False)
    phone_verified  = Column(Boolean, default=False)

    email_code  = Column(String, nullable=True)   # in-app OTP
    phone_code  = Column(String, nullable=True)

    phone_number = Column(String, nullable=True)

    # "Unverified" | "Partial" | "Verified"
    verification_status = Column(String, default="Unverified")
    verified_at = Column(DateTime, nullable=True)

    user = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"
    id         = Column(Integer, primary_key=True, index=True)
    message    = Column(String, nullable=False)
    type       = Column(String, default="info")    # "new_case" | "case_update" | "case_accepted" | "case_rejected"
    is_read    = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Target: either a citizen user OR an NGO (one will be None)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=True)
    ngo_id     = Column(Integer, ForeignKey("ngos.id"),  nullable=True)
    case_id    = Column(Integer, ForeignKey("cases.id"), nullable=True)


class FoodProduct(Base):
    __tablename__ = "food_products"
    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String, nullable=False)
    description  = Column(Text, nullable=True)
    price        = Column(Float, nullable=False)        # in INR
    image_url    = Column(String, nullable=True)
    category     = Column(String, default="Dry Food")   # Dry Food, Wet Food, Treats, Supplements
    seller_name  = Column(String, default="StrayCare Shop")
    stock        = Column(Integer, default=100)
    is_available = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)


class FoodOrder(Base):
    __tablename__ = "food_orders"
    id            = Column(Integer, primary_key=True, index=True)
    product_id    = Column(Integer, ForeignKey("food_products.id"), nullable=False)
    product_name  = Column(String, nullable=False)   # snapshot at time of order
    quantity      = Column(Integer, nullable=False, default=1)
    total_price   = Column(Float, nullable=False)
    buyer_name    = Column(String, nullable=False)
    buyer_email   = Column(String, nullable=False)
    buyer_phone   = Column(String, nullable=True)
    delivery_address = Column(Text, nullable=False)
    status        = Column(String, default="Pending")  # Pending, Confirmed, Delivered
    ordered_at    = Column(DateTime, default=datetime.utcnow)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=True)

    product = relationship("FoodProduct")