from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT

W, H = A4
doc = SimpleDocTemplate(
    "StrayCare_Technical_Overview.pdf",
    pagesize=A4,
    leftMargin=2*cm, rightMargin=2*cm,
    topMargin=2*cm, bottomMargin=2*cm
)

styles = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, **kw)

title_style   = S("T", fontSize=18, fontName="Helvetica-Bold", alignment=TA_CENTER, spaceAfter=4)
sub_style     = S("S", fontSize=10, fontName="Helvetica", alignment=TA_CENTER, textColor=colors.grey, spaceAfter=2)
sec_style     = S("SE", fontSize=11, fontName="Helvetica-Bold", spaceBefore=12, spaceAfter=4, textColor=colors.HexColor("#1a1a2e"))
body_style    = S("B", fontSize=9, fontName="Helvetica", spaceAfter=3, leading=13)
bullet_style  = S("BL", fontSize=9, fontName="Helvetica", leftIndent=12, spaceAfter=2, leading=12)
small_style   = S("SM", fontSize=8, fontName="Helvetica", textColor=colors.grey, alignment=TA_CENTER)

HR = HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey, spaceAfter=6, spaceBefore=6)

story = []

# ── TITLE ──────────────────────────────────────────────────────────
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("StrayCare Platform", title_style))
story.append(Paragraph("Technical Details & System Usability Overview — Draft", sub_style))
story.append(Paragraph("AI-Powered Stray Animal Welfare System", sub_style))
story.append(HR)

# ── 1. TECHNOLOGY STACK ────────────────────────────────────────────
story.append(Paragraph("1. Technology Stack", sec_style))
story.append(HR)

stack_data = [
    ["Layer", "Technology", "Details"],
    ["Backend Framework",   "FastAPI (Python 3.11)",          "RESTful API, async routes, auto Swagger docs, CORS middleware"],
    ["Frontend Framework",  "React.js 18",                    "SPA with CSS Modules, React Router, custom hooks"],
    ["Database",            "SQLite + SQLAlchemy ORM",        "Relational DB, auto-migration on startup, relationship mapping"],
    ["Authentication",      "JWT (OAuth2 Bearer Tokens)",     "Scoped tokens: user / ngo / admin; bcrypt via passlib"],
    ["Google Login",        "Google OAuth 2.0",               "ID token server-side verification, auto user creation"],
    ["AI Chatbot",          "Groq API – LLaMA 3.3-70B",       "Multi-turn conversation, domain-scoped system prompt"],
    ["Animal Recognition",  "TensorFlow.js + MobileNetV2",   "In-browser inference, no API key, offline after first load"],
    ["Payment Gateway",     "Razorpay",                       "Order creation, webhook verification, NGO-linked donations"],
    ["Geospatial",          "Haversine Formula",              "Great-circle distance for smart NGO dispatch scoring"],
    ["Clustering",          "Custom K-Means (Python)",        "Hotspot detection from GPS case coordinates, k=5"],
    ["Server",              "Uvicorn (ASGI)",                 "Production-grade async server for FastAPI"],
    ["File Storage",        "Local uploads/ directory",       "Static file serving via FastAPI StaticFiles mount"],
]

ts = TableStyle([
    ("BACKGROUND",  (0,0), (-1,0), colors.HexColor("#2d3748")),
    ("TEXTCOLOR",   (0,0), (-1,0), colors.white),
    ("FONTNAME",    (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE",    (0,0), (-1,0), 8),
    ("FONTNAME",    (0,1), (-1,-1), "Helvetica"),
    ("FONTSIZE",    (0,1), (-1,-1), 8),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#f8f9fa")]),
    ("GRID",        (0,0), (-1,-1), 0.3, colors.HexColor("#dee2e6")),
    ("PADDING",     (0,0), (-1,-1), 4),
    ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
    ("TEXTCOLOR",   (0,1), (0,-1), colors.HexColor("#2d3748")),
    ("FONTNAME",    (0,1), (0,-1), "Helvetica-Bold"),
])

t = Table(stack_data, colWidths=[3.8*cm, 4.2*cm, 9.2*cm])
t.setStyle(ts)
story.append(t)
story.append(Spacer(1, 0.4*cm))

# ── 2. CORE FEATURES ───────────────────────────────────────────────
story.append(Paragraph("2. Core System Features", sec_style))
story.append(HR)

features = [
    ("Smart NGO Dispatch",
     "Uses the Haversine formula to calculate real-world GPS distance (km) between a reported case "
     "and every verified NGO. Weighted scoring: Proximity 50 pts + Caseload 30 pts + Base 20 pts. "
     "Returns a sorted NGO recommendation list for fastest dispatch."),
    ("AI Pet Matchmaker",
     "Rule-based compatibility engine scores each available pet against an adopter's lifestyle profile "
     "(living space, activity level, presence of children). Score range: 15–99%. Results sorted by "
     "compatibility percentage to suggest the best match."),
    ("Case Severity Triaging",
     "NLP keyword scoring of case descriptions. Critical keywords (bleeding, seizure, unconscious) "
     "add 100 pts; High keywords (injured, poisoned, trapped) add 60 pts; Moderate (limping, sick, "
     "malnourished) add 30 pts. Labels: Critical / High / Moderate / Low. NGO queue sorted by severity."),
    ("Zone Red Hotspot Map",
     "Custom K-Means clustering (k=5, max 20 iterations) applied to GPS coordinates of reported cases. "
     "Cluster radius and risk level mapped to case count: >=10 Critical (800m), >=5 High (500m), "
     ">=2 Moderate (300m), 1 Low Zone (150m). Displayed as a color-coded map overlay."),
    ("AI Animal Recognition",
     "TensorFlow.js MobileNetV2 runs entirely client-side in the browser. No external API call or key "
     "required. Classifies animal species from an uploaded photo using ImageNet-1000 labels mapped to "
     "StrayCare categories (Dog, Cat, Bird, Cow, Goat, Other). Model lazy-loads and is cached offline."),
    ("Groq AI Chatbot",
     "LLaMA 3.3-70B model served via Groq's OpenAI-compatible API. Supports multi-turn conversation "
     "history. Domain-scoped system prompt covers animal first aid, safe rescue guidance, StrayCare app "
     "help, and general animal welfare. Graceful fallback on rate-limit, invalid key, or timeout."),
    ("Donor Transparency Dashboard",
     "Public endpoint (/donor/dashboard) exposes month-wise and year-wise donation totals, case stats, "
     "and adoption figures without requiring authentication. Builds donor trust through open data."),
    ("Donor KYC Verification",
     "OTP-based email and phone verification for donors (dev mode returns code inline; production would "
     "send via email/SMS). Verification status tracked: Unverified / Partial / Verified."),
]

for title, desc in features:
    story.append(Paragraph(f"<b>{title}</b>", body_style))
    story.append(Paragraph(desc, bullet_style))
    story.append(Spacer(1, 0.15*cm))

story.append(Spacer(1, 0.2*cm))

# ── 3. SYSTEM USABILITY — ROLE MATRIX ─────────────────────────────
story.append(Paragraph("3. System Usability — Role-Based Access Matrix", sec_style))
story.append(HR)

role_data = [
    ["Feature / Capability",       "Guest", "Citizen", "NGO", "Admin", "Donor"],
    ["Register / Login",           "✓",     "✓",       "✓",   "✓",    "✓"],
    ["Google OAuth Login",         "✓",     "✓",       "—",   "—",    "✓"],
    ["View Pet Listings",          "✓",     "✓",       "✓",   "✓",    "✓"],
    ["Report Stray Case",          "—",     "✓",       "—",   "—",    "—"],
    ["Track Own Cases",            "—",     "✓",       "—",   "—",    "—"],
    ["Accept / Reject Cases",      "—",     "—",       "✓",   "—",    "—"],
    ["Post Case Updates",          "—",     "—",       "✓",   "—",    "—"],
    ["List Pet for Adoption",      "—",     "✓",       "✓",   "—",    "—"],
    ["Submit Adoption Request",    "—",     "✓",       "—",   "—",    "✓"],
    ["Approve Adoption Request",   "—",     "—",       "✓",   "—",    "—"],
    ["Donate to NGO",              "—",     "✓",       "—",   "—",    "✓"],
    ["Donor Verification (KYC)",   "—",     "✓",       "—",   "—",    "✓"],
    ["Leave Feedback / Rating",    "—",     "✓",       "—",   "—",    "—"],
    ["Respond to Feedback",        "—",     "—",       "✓",   "—",    "—"],
    ["NGO Analytics Dashboard",    "—",     "—",       "✓",   "—",    "—"],
    ["Approve / Reject Pet Listings","—",   "—",       "✓",   "—",    "—"],
    ["Verify / Deregister NGO",    "—",     "—",       "—",   "✓",    "—"],
    ["View All Platform Feedback", "—",     "—",       "—",   "✓",    "—"],
    ["Platform Analytics",         "—",     "—",       "—",   "✓",    "—"],
    ["AI Chatbot Access",          "✓",     "✓",       "✓",   "✓",    "✓"],
    ["Animal Recognition (AI)",    "—",     "✓",       "—",   "—",    "—"],
    ["View Hotspot Map",           "✓",     "✓",       "✓",   "✓",    "✓"],
    ["Pet Matchmaker",             "✓",     "✓",       "—",   "—",    "—"],
    ["First Aid Articles",         "✓",     "✓",       "✓",   "✓",    "✓"],
]

col_w = [5.5*cm, 1.5*cm, 1.7*cm, 1.5*cm, 1.5*cm, 1.5*cm]
rt = Table(role_data, colWidths=col_w)
rt.setStyle(TableStyle([
    ("BACKGROUND",  (0,0), (-1,0), colors.HexColor("#2d3748")),
    ("TEXTCOLOR",   (0,0), (-1,0), colors.white),
    ("FONTNAME",    (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE",    (0,0), (-1,-1), 8),
    ("FONTNAME",    (0,1), (-1,-1), "Helvetica"),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#f8f9fa")]),
    ("GRID",        (0,0), (-1,-1), 0.3, colors.HexColor("#dee2e6")),
    ("PADDING",     (0,0), (-1,-1), 3),
    ("ALIGN",       (1,0), (-1,-1), "CENTER"),
    ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
    ("FONTNAME",    (0,1), (0,-1), "Helvetica-Bold"),
    ("TEXTCOLOR",   (0,1), (0,-1), colors.HexColor("#2d3748")),
]))
story.append(rt)
story.append(Spacer(1, 0.4*cm))

# ── 4. DATABASE SCHEMA ─────────────────────────────────────────────
story.append(Paragraph("4. Database Schema — Key Tables", sec_style))
story.append(HR)

db_tables = [
    ("users",              "id, name, email, hashed_password, is_admin"),
    ("ngos",               "id, name, email, hashed_password, is_verified, verification_document_url, razorpay_account_id, upi_id"),
    ("cases",              "id, description, latitude, longitude, photo_url, status, severity_score, severity_label, owner_id, accepted_by_ngo_id, created_at"),
    ("case_updates",       "id, notes, photo_url, created_at, case_id, ngo_id"),
    ("pets",               "id, name, species, breed, age, gender, size, is_vaccinated, location, image_url, video_url, status, ngo_id"),
    ("adoption_requests",  "id, pet_id, pet_name, adopter_name, adopter_email, adopter_phone, adopter_address, status, experience, reason, ngo_id, request_date"),
    ("donations",          "id, amount, donor_name, donor_email, payment_id, order_id, status, ngo_id, timestamp"),
    ("feedback",           "id, rating, comment, category, ngo_response, user_id, ngo_id, case_id, created_at"),
    ("user_pet_listings",  "id, name, species, age, location, description, image_url, status, user_id, created_at"),
    ("donor_verifications","id, user_id, email_verified, phone_verified, email_code, phone_code, phone_number, verification_status, verified_at"),
]

db_data = [["Table Name", "Columns"]] + [[t, c] for t, c in db_tables]
dbt = Table(db_data, colWidths=[4.2*cm, 12.8*cm])
dbt.setStyle(TableStyle([
    ("BACKGROUND",  (0,0), (-1,0), colors.HexColor("#2d3748")),
    ("TEXTCOLOR",   (0,0), (-1,0), colors.white),
    ("FONTNAME",    (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE",    (0,0), (-1,-1), 8),
    ("FONTNAME",    (0,1), (-1,-1), "Helvetica"),
    ("FONTNAME",    (0,1), (0,-1), "Helvetica-Bold"),
    ("TEXTCOLOR",   (0,1), (0,-1), colors.HexColor("#2d3748")),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#f8f9fa")]),
    ("GRID",        (0,0), (-1,-1), 0.3, colors.HexColor("#dee2e6")),
    ("PADDING",     (0,0), (-1,-1), 4),
    ("VALIGN",      (0,0), (-1,-1), "TOP"),
]))
story.append(dbt)
story.append(Spacer(1, 0.4*cm))

# ── 5. KEY API ENDPOINTS ───────────────────────────────────────────
story.append(Paragraph("5. Key API Endpoints", sec_style))
story.append(HR)

api_data = [
    ["Method", "Route", "Auth", "Description"],
    ["POST", "/users/register",              "—",        "Citizen registration"],
    ["POST", "/token",                       "—",        "Citizen login → JWT"],
    ["POST", "/auth/google",                 "—",        "Google OAuth login, auto-creates user"],
    ["POST", "/ngos/register",               "—",        "NGO registration with document upload"],
    ["POST", "/ngo/token",                   "—",        "NGO login → scoped JWT"],
    ["POST", "/report",                      "Citizen",  "Report stray case with GPS + photo"],
    ["GET",  "/ngo/me/cases",                "NGO",      "Severity-sorted case queue for NGO"],
    ["PUT",  "/case/{id}/accept",            "NGO",      "Accept case and assign to NGO"],
    ["POST", "/cases/{id}/updates",          "NGO",      "Post case progress update with photo"],
    ["GET",  "/pets",                        "—",        "List all available pets for adoption"],
    ["POST", "/pets/match",                  "—",        "AI Pet Matchmaker — scored suggestions"],
    ["POST", "/adoption-requests",           "—",        "Submit adoption request for a pet"],
    ["POST", "/chatbot/query",               "—",        "Multi-turn Groq AI chatbot"],
    ["GET",  "/hotspots",                    "—",        "K-Means clustered danger zones map"],
    ["GET",  "/stats/summary",               "—",        "Platform KPIs (cases, adoptions, NGOs)"],
    ["GET",  "/donor/dashboard/donations/monthwise","—", "Month-wise donation totals"],
    ["PUT",  "/admin/ngos/{id}/verify",      "Admin",    "Verify NGO and grant platform access"],
    ["DELETE","/admin/ngos/{id}",            "Admin",    "Deregister NGO with reason"],
    ["POST", "/donations/create-order",      "Citizen",  "Create Razorpay order for donation"],
    ["POST", "/donations/verify",            "Citizen",  "Verify Razorpay payment signature"],
    ["POST", "/feedback",                    "Citizen",  "Submit star rating + comment for case"],
    ["PUT",  "/feedback/{id}/respond",       "NGO",      "NGO reply to a citizen review"],
]

api_col_w = [1.5*cm, 5.5*cm, 2*cm, 8.2*cm]
at = Table(api_data, colWidths=api_col_w)
at.setStyle(TableStyle([
    ("BACKGROUND",  (0,0), (-1,0), colors.HexColor("#2d3748")),
    ("TEXTCOLOR",   (0,0), (-1,0), colors.white),
    ("FONTNAME",    (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE",    (0,0), (-1,-1), 7.5),
    ("FONTNAME",    (0,1), (-1,-1), "Helvetica"),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#f8f9fa")]),
    ("GRID",        (0,0), (-1,-1), 0.3, colors.HexColor("#dee2e6")),
    ("PADDING",     (0,0), (-1,-1), 3),
    ("ALIGN",       (0,0), (0,-1), "CENTER"),
    ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
    ("FONTNAME",    (0,1), (0,-1), "Helvetica-Bold"),
]))
story.append(at)
story.append(Spacer(1, 0.4*cm))

# ── FOOTER ────────────────────────────────────────────────────────
story.append(HR)
story.append(Paragraph(
    "StrayCare Platform  |  Technical Overview Draft  |  2026  |  "
    "Backend: Python · FastAPI · SQLAlchemy · Uvicorn  |  "
    "Frontend: React.js · CSS Modules  |  AI: TensorFlow.js · Groq · LLaMA 3.3",
    small_style
))

doc.build(story)
print("PDF generated: StrayCare_Technical_Overview.pdf")
