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