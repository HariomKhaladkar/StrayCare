from pydantic import BaseModel, EmailStr, conint
from datetime import datetime
from typing import List, Optional

# ---------------- Case Updates ----------------

class CaseUpdateBase(BaseModel):
    notes: str

class CaseUpdateCreate(CaseUpdateBase):
    pass

class CaseUpdate(CaseUpdateBase):
    id: int
    photo_url: Optional[str] = None
    created_at: datetime
    ngo_id: int

    class Config:
        orm_mode = True


# ---------------- Case ----------------

class CaseBase(BaseModel):
    description: str
    latitude: float
    longitude: float

class CaseCreate(CaseBase):
    pass

class Case(CaseBase):
    id: int
    owner_id: int
    photo_url: str
    status: str
    created_at: datetime
    updates: List[CaseUpdate] = []

    accepted_by_ngo_id: Optional[int] = None
    pet_name: Optional[str] = None
    is_adoptable: bool
    adoption_story: Optional[str] = None
    temperament: Optional[str] = None

    class Config:
        orm_mode = True


# ---------------- Users ----------------

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_admin: bool
    cases: List[Case] = []

    class Config:
        orm_mode = True


# ---------------- NGO ----------------

class NGOBase(BaseModel):
    name: str
    email: EmailStr

class NGOCreate(NGOBase):
    password: str

class NGO(NGOBase):
    id: int
    is_verified: bool
    verification_document_url: Optional[str] = None
    razorpay_account_id: Optional[str] = None  # ✅ NEW FIELD

    class Config:
        orm_mode = True


# ---------------- Deregister Request ----------------

class DeregisterRequest(BaseModel):
    reason: str


# ---------------- Auth & Chat ----------------

class Token(BaseModel):
    access_token: str
    token_type: str

class ChatQuery(BaseModel):
    query: str

class ChatResponse(BaseModel):
    response: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

class NGOLoginResponse(BaseModel):
    access_token: str
    token_type: str
    ngo: NGO


# ---------------- Pet ----------------

class PetBase(BaseModel):
    name: str
    species: str
    breed: str
    age: str
    gender: str
    size: str
    location: str
    is_vaccinated: bool

class PetCreate(PetBase):
    pass

class Pet(PetBase):
    id: int
    status: str
    ngo_id: int
    image_url: str

    class Config:
        orm_mode = True


# ---------------- Adoption Requests ----------------

class AdoptionRequestCreate(BaseModel):
    pet_id: int
    adopter_name: str
    adopter_email: EmailStr
    adopter_phone: str
    adopter_address: str
    experience: str
    reason: str

class AdoptionRequest(AdoptionRequestCreate):
    id: int
    pet_name: str
    status: str
    request_date: datetime
    ngo_id: int

    class Config:
        orm_mode = True


# ---------------- Feedback ----------------

class FeedbackBase(BaseModel):
    rating: conint(ge=1, le=5)
    comment: Optional[str] = None
    ngo_id: int
    case_id: int

class FeedbackCreate(FeedbackBase):
    pass

class Feedback(FeedbackBase):
    id: int
    created_at: datetime
    user_id: int

    class Config:
        orm_mode = True

class FeedbackSummary(BaseModel):
    average_rating: Optional[float] = None
    total_reviews: int
    reviews: List[Feedback] = []


# ---------------- Donations ----------------

class DonationBase(BaseModel):
    amount: float
    donor_name: str
    ngo_id: int

class DonationCreate(DonationBase):
    pass

class Donation(DonationBase):
    id: int
    order_id: str                  # ✅ NEW FIELD
    payment_id: Optional[str] = None
    status: str
    timestamp: datetime

    class Config:
        orm_mode = True


# ---------------- Smart NGO List ----------------

class NGODonationStats(BaseModel):
    id: int
    name: str
    email: str
    verification_document_url: Optional[str]
    total_donations_last_30_days: float

    class Config:
        orm_mode = True
