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

    # Feature 3: Severity Triaging
    severity_score: int = 0
    severity_label: str = "Low"

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
    razorpay_account_id: Optional[str] = None
    upi_id: Optional[str] = None  # e.g. "testngo@upi"

    class Config:
        orm_mode = True


# ---------------- Deregister Request ----------------

class DeregisterRequest(BaseModel):
    reason: str


# ---------------- Auth & Chat ----------------

class Token(BaseModel):
    access_token: str
    token_type: str

class ChatMessage(BaseModel):
    role: str   # "user" or "model"
    text: str

class ChatQuery(BaseModel):
    query: str
    history: List[ChatMessage] = []

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

class GoogleLoginRequest(BaseModel):
    credential: str


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
    video_url: Optional[str] = None

    class Config:
        orm_mode = True

class MatchProfile(BaseModel):
    living_space: str  # "apartment" | "house"
    activity_level: str # "low" | "medium" | "high"
    has_kids: bool

class PetMatchResponse(BaseModel):
    pet: Pet
    match_percentage: int

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

FEEDBACK_CATEGORIES = [
    "Response Time",
    "Treatment Quality",
    "Communication",
    "Adoption Process",
    "Overall Experience",
]

class FeedbackBase(BaseModel):
    rating: conint(ge=1, le=5)
    comment: Optional[str] = None
    category: Optional[str] = None
    ngo_id: int
    case_id: int

class FeedbackCreate(FeedbackBase):
    pass

class Feedback(FeedbackBase):
    id: int
    created_at: datetime
    user_id: int
    ngo_response: Optional[str] = None

    class Config:
        orm_mode = True

class RatingDistribution(BaseModel):
    star: int
    count: int

class FeedbackSummary(BaseModel):
    average_rating: Optional[float] = None
    total_reviews: int
    reviews: List[Feedback] = []
    rating_distribution: List[RatingDistribution] = []

class NGOFeedbackRespond(BaseModel):
    response: str


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
    upi_id: Optional[str] = None  # for direct UPI deep-link fallback

    class Config:
        orm_mode = True


# ---------------- User Pet Listings ----------------

class UserPetListingCreate(BaseModel):
    name: str
    species: str
    age: str
    location: str
    description: Optional[str] = None

class UserPetListing(UserPetListingCreate):
    id: int
    image_url: str
    status: str
    created_at: datetime
    user_id: int
    user_name: Optional[str] = None   # submitting citizen's name

    class Config:
        orm_mode = True


# ---------------- Donor Analytics ----------------

class MonthwiseDonation(BaseModel):
    month: str
    amount: float

class YearwiseDonation(BaseModel):
    year: str
    amount: float

class CaseStats(BaseModel):
    total_cases: int
    resolved_cases: int
    active_cases: int

class AdoptionStats(BaseModel):
    total_adoptions: int
    available_pets: int
    ngo_count: int


# ---------------- Donor Verification ----------------

class DonorVerifyRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None

class DonorCodeConfirm(BaseModel):
    code: str

class DonorVerificationStatus(BaseModel):
    id: int
    user_id: int
    email_verified: bool
    phone_verified: bool
    phone_number: Optional[str] = None
    verification_status: str
    verified_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# ---------------- Analytics Time Series ----------------

class TimeCount(BaseModel):
    label: str
    count: int

class TimeAmount(BaseModel):
    label: str
    amount: float

class SpeciesCount(BaseModel):
    species: str
    count: int

# NGO analytics combined response
class NGOCaseAnalytics(BaseModel):
    yearwise: List[TimeCount]
    monthwise: List[TimeCount]

class AdminCaseAnalytics(BaseModel):
    total: int
    resolved: int
    pending: int
    accepted: int
    monthwise: List[TimeCount]

class AdminDonationAnalytics(BaseModel):
    total_amount: float
    monthwise: List[TimeAmount]

class AdminAdoptionAnalytics(BaseModel):
    total_adopted: int
    available: int
    monthwise: List[TimeCount]
