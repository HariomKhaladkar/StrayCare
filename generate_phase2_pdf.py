
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, HRFlowable, KeepTogether, Image
)
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import Frame, PageTemplate
from reportlab.platypus.doctemplate import BaseDocTemplate

UML_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uml_diagrams")

def UML_IMG(filename, max_width=None, max_height=None):
    """Insert a UML diagram PNG, scaled to fit the page width."""
    path = os.path.join(UML_DIR, filename)
    avail_w = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN
    img = Image(path)
    iw, ih = img.imageWidth, img.imageHeight
    mw = max_width or avail_w
    mh = max_height or (10 * cm)
    scale = min(mw / iw, mh / ih, 1.0)
    img.drawWidth  = iw * scale
    img.drawHeight = ih * scale
    img.hAlign = 'CENTER'
    return img

PAGE_WIDTH, PAGE_HEIGHT = A4
LEFT_MARGIN  = 2.5 * cm
RIGHT_MARGIN = 2.5 * cm
TOP_MARGIN   = 2.5 * cm
BOTTOM_MARGIN = 2.0 * cm

# ─── Page numbering ────────────────────────────────────────────────────────────
page_counter = [0]

def on_page(canvas, doc):
    page_counter[0] += 1
    canvas.saveState()
    canvas.setFont("Helvetica-Bold", 9)
    header_text = "StrayCare: A Community-Driven Platform for Animal Rescue and Adoption"
    canvas.drawString(LEFT_MARGIN, PAGE_HEIGHT - 1.4 * cm, header_text)
    canvas.drawRightString(PAGE_WIDTH - RIGHT_MARGIN, PAGE_HEIGHT - 1.4 * cm, str(page_counter[0]))
    canvas.setStrokeColor(colors.HexColor("#1a1a6e"))
    canvas.setLineWidth(0.8)
    canvas.line(LEFT_MARGIN, PAGE_HEIGHT - 1.65 * cm, PAGE_WIDTH - RIGHT_MARGIN, PAGE_HEIGHT - 1.65 * cm)
    canvas.restoreState()

# ─── Styles ───────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "TitleStyle", parent=styles["Heading1"],
    fontSize=22, leading=28, spaceAfter=14, spaceBefore=10,
    textColor=colors.HexColor("#1a1a6e"), fontName="Helvetica-Bold",
    alignment=TA_CENTER
)
subtitle_style = ParagraphStyle(
    "SubtitleStyle", parent=styles["Normal"],
    fontSize=14, leading=20, spaceAfter=8,
    textColor=colors.HexColor("#1a1a6e"), fontName="Helvetica-Bold",
    alignment=TA_CENTER
)
chapter_style = ParagraphStyle(
    "Chapter", parent=styles["Heading1"],
    fontSize=14, leading=20, spaceAfter=10, spaceBefore=18,
    textColor=colors.HexColor("#1a1a6e"), fontName="Helvetica-Bold",
    alignment=TA_LEFT
)
section_style = ParagraphStyle(
    "Section", parent=styles["Heading2"],
    fontSize=12, leading=17, spaceAfter=6, spaceBefore=12,
    textColor=colors.HexColor("#0d0d5c"), fontName="Helvetica-Bold",
    alignment=TA_LEFT
)
subsection_style = ParagraphStyle(
    "SubSection", parent=styles["Heading3"],
    fontSize=11, leading=16, spaceAfter=4, spaceBefore=8,
    textColor=colors.HexColor("#1a1a6e"), fontName="Helvetica-Bold",
    alignment=TA_LEFT
)
body_style = ParagraphStyle(
    "Body", parent=styles["Normal"],
    fontSize=10.5, leading=16, spaceAfter=5, spaceBefore=2,
    fontName="Helvetica", alignment=TA_JUSTIFY
)
bullet_style = ParagraphStyle(
    "Bullet", parent=styles["Normal"],
    fontSize=10.5, leading=15, spaceAfter=2, spaceBefore=1,
    fontName="Helvetica", leftIndent=18, bulletIndent=6,
    alignment=TA_LEFT
)
sub_heading_style = ParagraphStyle(
    "SubHeading", parent=styles["Normal"],
    fontSize=10.5, leading=15, spaceAfter=3, spaceBefore=6,
    fontName="Helvetica-Bold"
)
center_style = ParagraphStyle(
    "Center", parent=styles["Normal"],
    fontSize=11, leading=16, spaceAfter=4,
    fontName="Helvetica", alignment=TA_CENTER
)
label_style = ParagraphStyle(
    "Label", parent=styles["Normal"],
    fontSize=10, leading=14, spaceAfter=2,
    fontName="Helvetica-Bold", textColor=colors.HexColor("#1a1a6e")
)
caption_style = ParagraphStyle(
    "Caption", parent=styles["Normal"],
    fontSize=9.5, leading=13, spaceAfter=8, spaceBefore=4,
    fontName="Helvetica", alignment=TA_CENTER, textColor=colors.grey
)

def CH(text): return Paragraph(text, chapter_style)
def SEC(text): return Paragraph(text, section_style)
def SSEC(text): return Paragraph(text, subsection_style)
def P(text): return Paragraph(text, body_style)
def B(text): return Paragraph(u"\u2022  " + text, bullet_style)
def SH(text): return Paragraph(text, sub_heading_style)
def C(text): return Paragraph(text, center_style)
def CAP(text): return Paragraph(text, caption_style)
def SP(n=6): return Spacer(1, n)
def HR(): return HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#1a1a6e"), spaceAfter=6, spaceBefore=6)
def THINHR(): return HRFlowable(width="100%", thickness=0.4, color=colors.lightgrey, spaceAfter=4, spaceBefore=4)

def IMG_PLACEHOLDER(label, height=5*cm):
    """Creates a styled image/diagram placeholder box."""
    ph_style = ParagraphStyle(
        "PlaceholderText", parent=styles["Normal"],
        fontSize=9.5, leading=15, alignment=TA_CENTER,
        textColor=colors.HexColor("#3a3a8e"), fontName="Helvetica-Oblique"
    )
    content = Paragraph(f"<b>[ IMAGE / DIAGRAM PLACEHOLDER ]</b><br/><br/>{label}", ph_style)
    t = Table([[content]],
              colWidths=[PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN],
              rowHeights=[height])
    t.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1.5, colors.HexColor("#1a1a6e")),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eef2ff")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
    ]))
    return t

# ─── Table Style Helper ───────────────────────────────────────────────────────
def make_table(data, col_widths, header_color="#1a1a6e"):
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(header_color)),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9.5),
    ]))
    return t

# ══════════════════════════════════════════════════════════════════════════════
#  BUILD STORY
# ══════════════════════════════════════════════════════════════════════════════
story = []

# ─────────────────────────────────────────────────────────────────────────────
# TITLE PAGE
# ─────────────────────────────────────────────────────────────────────────────
story.append(SP(30))
story.append(C("A PROJECT REPORT ON"))
story.append(SP(20))
story.append(Paragraph('"StrayCare: A Community-Driven Platform for Animal Rescue and Adoption"', title_style))
story.append(SP(40))
story.append(C("SUBMITTED BY"))
story.append(SP(10))
story.append(C("<b>BIB04 Sanath Bhat</b>"))
story.append(C("<b>BIB21 Karttikey Chavali</b>"))
story.append(C("<b>BIB23 Hariom Khaladkar</b>"))
story.append(C("<b>BIB26 Rajat Kulkarni</b>"))
story.append(SP(40))
story.append(C("GUIDED BY"))
story.append(SP(10))
story.append(C("<b>Dr. Bhavana Kanawade</b>"))
story.append(SP(40))
story.append(C("<b>DEPARTMENT OF INFORMATION TECHNOLOGY</b>"))
story.append(C("<b>INTERNATIONAL INSTITUTE OF INFORMATION TECHNOLOGY, PUNE - 411057</b>"))
story.append(C("<b>SAVITRIBAI PHULE PUNE UNIVERSITY</b>"))
story.append(C("<b>2025 – 2026</b>"))
story.append(PageBreak())

# ─────────────────────────────────────────────────────────────────────────────
# CERTIFICATE PAGE
# ─────────────────────────────────────────────────────────────────────────────
story.append(SP(20))
story.append(C("<b>INTERNATIONAL INSTITUTE OF INFORMATION TECHNOLOGY</b>"))
story.append(C("<b>HINJEWADI, PUNE-57</b>"))
story.append(SP(8))
story.append(C("<b>DEPARTMENT OF INFORMATION TECHNOLOGY</b>"))
story.append(SP(20))
story.append(Paragraph("Certificate", ParagraphStyle("CertTitle", parent=styles["Heading1"],
    fontSize=18, leading=24, spaceAfter=20, spaceBefore=10,
    textColor=colors.HexColor("#1a1a6e"), fontName="Helvetica-Bold", alignment=TA_CENTER)))
story.append(HR())
story.append(SP(10))
story.append(P('This is to certify that the project report entitled <b>"StrayCare: A Community-Driven Platform for Animal Rescue and Adoption"</b> which is being submitted by:'))
story.append(SP(8))
story.append(B("<b>BIB04 Sanath Bhat</b>"))
story.append(B("<b>BIB21 Karttikey Chavali</b>"))
story.append(B("<b>BIB23 Hariom Khaladkar</b>"))
story.append(B("<b>BIB26 Rajat Kulkarni</b>"))
story.append(SP(10))
story.append(P('have completed Phase II of the Project entitled <b>"StrayCare: A Community-Driven Platform for Animal Rescue and Adoption"</b>, under my guidance in partial fulfillment of the requirement for the award of the Bachelor of Engineering in Information Technology of International Institute of Information Technology, Hinjawadi, by Savitribai Phule Pune University for the academic year 2025 – 2026.'))
story.append(SP(40))
sig_data = [
    [Paragraph("<b>Dr. Bhavana Kanawade</b><br/>Guide", body_style), "", Paragraph("Internal Examiner: ___________________", body_style)],
    [Paragraph("<b>Dr. Jyoti Surve</b><br/>Head of the Department", body_style), "", Paragraph("External Examiner: ___________________", body_style)],
]
sig_table = Table(sig_data, colWidths=[6.5*cm, 2.5*cm, 7*cm])
sig_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("GRID", (0, 0), (-1, -1), 0, colors.white),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 20),
]))
story.append(sig_table)
story.append(SP(20))
story.append(C("<b>Dr. Vaishali Patil</b>"))
story.append(C("Principal"))
story.append(C("Date: ______________________"))
story.append(PageBreak())

# ─────────────────────────────────────────────────────────────────────────────
# ACKNOWLEDGEMENT
# ─────────────────────────────────────────────────────────────────────────────
story.append(CH("Acknowledgement"))
story.append(HR())
story.append(P("With immense pleasure, we are presenting this Phase II project report on \"StrayCare: A Community-Driven Platform for Animal Rescue and Adoption\" as a part of the curriculum of B.E. Information Technology at International Institute of Information Technology, Hinjewadi, Pune."))
story.append(SP(8))
story.append(P("It gives us the privilege to complete this report work under the valuable mentorship of <b>Dr. Bhavana Kanawade</b>. Her guidance, co-operation, and encouragement have made a significant headway in the project. We are also extremely grateful to <b>Dr. Vaishali Patil</b>, Principal, and <b>Dr. Jyoti Surve</b>, Head of Department of Information Technology, for providing all facilities and help for smooth progress of work. We would also like to thank all the Staff Members of the Information Technology Department, Management, friends, and our family members, who have directly or indirectly guided and helped us for the preparation of this report and gave us unending support right from the stage the idea was conceived."))
story.append(SP(8))
story.append(P("Phase II represents a major evolution of the StrayCare platform, introducing advanced capabilities including AI-powered chatbot integration, Razorpay payment gateway for NGO donations, Google OAuth 2.0 single sign-on, comprehensive analytics dashboards for all user roles, an interactive Zone Red Hotspot Map powered by K-Means clustering, a Smart NGO Dispatch system using the Haversine distance formula, and a Donor Transparency Dashboard. We are grateful to all who supported this extended development effort."))
story.append(SP(30))
story.append(Paragraph("<b>BIB04 Sanath Bhat</b>", ParagraphStyle("RightAlign", parent=body_style, alignment=1)))
story.append(Paragraph("<b>BIB21 Karttikey Chavali</b>", ParagraphStyle("RightAlign", parent=body_style, alignment=1)))
story.append(Paragraph("<b>BIB23 Hariom Khaladkar</b>", ParagraphStyle("RightAlign", parent=body_style, alignment=1)))
story.append(Paragraph("<b>BIB26 Rajat Kulkarni</b>", ParagraphStyle("RightAlign", parent=body_style, alignment=1)))
story.append(PageBreak())

# ─────────────────────────────────────────────────────────────────────────────
# ABSTRACT
# ─────────────────────────────────────────────────────────────────────────────
story.append(CH("Abstract"))
story.append(HR())
story.append(P("StrayCare is an innovative, full-stack web platform developed to connect compassionate citizens with verified animal welfare organizations, creating a seamless and transparent channel for reporting, managing, and resolving stray animal rescue cases. In Phase I, the platform established a robust foundation: a citizen case reporting module with GPS tagging, an NGO case management dashboard, a pet adoption gallery, an admin verification panel, and a feedback system — all secured with JWT-based role-based access control."))
story.append(SP(6))
story.append(P("Phase II marks a significant expansion of the platform's intelligence, financial infrastructure, and analytical capabilities. The platform now integrates a Groq-powered AI chatbot (Llama 3.3 70B model) for multi-turn animal first-aid and rescue conversations, replacing the earlier rule-based system. A full payment gateway powered by Razorpay has been implemented, enabling citizens to make NGO-specific donations via UPI, cards, and net banking, with complete order creation, webhook verification, and idempotent status tracking. Google OAuth 2.0 has been integrated to allow frictionless single sign-on for citizens."))
story.append(SP(6))
story.append(P("Advanced analytics dashboards have been introduced for all three user roles. The NGO Analytics Dashboard visualizes case trends (month-wise and year-wise), species distribution, adoption rates, and donation history using interactive charts. The Admin Analytics Dashboard provides a platform-wide bird's-eye view of case volumes, donation totals, and adoption statistics. The Donor Transparency Dashboard is a public-facing portal that builds public trust by displaying aggregated impact metrics, month-wise donation charts, and total animals rescued."))
story.append(SP(6))
story.append(P("Two new ML-powered features have been deployed: the Zone Red Hotspot Map, which uses a custom K-Means clustering algorithm to identify geographical danger zones from reported case coordinates and renders them as color-coded risk overlays on an interactive Leaflet.js map; and the Smart NGO Dispatch system, which uses the Haversine great-circle distance formula combined with a weighted scoring matrix (proximity, active caseload, and base score) to present administrators with a ranked list of NGOs for any given emergency. Citizens can now also list their own pets for adoption, subject to NGO verification and approval. NGOs can respond directly to citizen feedback, completing the accountability loop."))
story.append(SP(6))
story.append(P("The platform's AI animal species recognition (TensorFlow.js + MobileNet V2) and Rule-Based NLP severity triaging from Phase I continue to operate, now augmented by the Groq LLM backend for richer conversational support. Built on React.js (frontend), FastAPI/Python (backend), SQLite with SQLAlchemy ORM, and deployed with Uvicorn, StrayCare is a comprehensive, production-ready civic technology platform that demonstrates how thoughtful software engineering can transform community compassion into real-world animal welfare impact."))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
#  CHAPTER 1: INTRODUCTION
# ══════════════════════════════════════════════════════════════════════════════
story.append(CH("Chapter 1: Introduction to Project Topic"))
story.append(HR())

story.append(SEC("1.1 Overview"))
story.append(SSEC("1.1.1 Project Overview"))
story.append(P("Across India's cities and towns, countless stray animals suffer from injuries, illness, and neglect, often in plain sight of residents who feel powerless to help. While social media and local chat groups have become informal channels for reporting such incidents, these methods are fragmented, unreliable, and lack a structured response mechanism. Compassionate citizens who witness an animal in distress often feel helpless — unsure of whom to contact or how to provide effective aid. This communication gap between the public and animal welfare organizations leads to delayed rescues, wasted resources, and preventable suffering."))
story.append(SP(6))
story.append(P("StrayCare was envisioned in Phase I as a transformative digital solution to bridge this gap, democratizing the process of animal rescue. Phase II deepens this vision by adding a comprehensive financial layer (Razorpay donations), AI conversational support (Groq LLM chatbot), advanced analytics for all stakeholders, geospatial intelligence (K-Means hotspot mapping, Haversine dispatch), and citizen pet listing capabilities. The platform now represents a complete, production-grade civic technology ecosystem for animal welfare."))

story.append(SEC("1.2 Brief Description"))
story.append(P("StrayCare is a comprehensive animal rescue, adoption, and fundraising portal developed using modern web technologies. It is built on a role-based access control system for three primary user types: <b>Citizens</b>, <b>NGOs</b>, and <b>Administrators</b>. Citizens can create geo-tagged case reports with photos, track the status of their reports in real time, browse adoptable pets with AI-powered lifestyle matching, list their own pets for adoption, donate to NGOs via integrated payment gateways, and interact with an AI-powered first-aid chatbot."))
story.append(SP(5))
story.append(P("NGOs receive notifications for cases in their operational area, manage their entire rescue caseload through a dedicated dashboard, post progress updates with photos, list rescued animals for adoption, manage adoption requests, respond to citizen feedback, view their own analytics dashboard, and track incoming donations. Administrators oversee the entire ecosystem: verifying new NGOs, managing platform users, viewing all feedback, dispatching NGOs to emergencies using the Smart Dispatch tool, and monitoring platform-wide analytics."))

story.append(SEC("1.3 Problem Definition"))
story.append(P("This project directly addresses systemic inefficiencies in the current, informal stray animal rescue process. The key problems are:"))
story.append(B("<b>Fragmented and Unreliable Reporting:</b> Citizens rely on scattered social media posts or unverified contact numbers, with no guarantee that their report will reach the right people in time."))
story.append(B("<b>Lack of Actionable Information for NGOs:</b> Rescuers are often inundated with duplicate reports, calls from outside their service area, or messages lacking critical details like a precise location or photo, leading to wasted time and resources."))
story.append(B("<b>No Feedback Loop for Citizens:</b> Individuals who report a case rarely receive updates on the animal's condition, leading to a sense of futility and discouraging future reporting."))
story.append(B("<b>Absence of a Transparent Donation Mechanism:</b> Animal welfare NGOs lack a credible, integrated platform to receive and acknowledge public donations, while donors have no visibility into the impact of their contributions."))
story.append(B("<b>Inefficient NGO Dispatching:</b> When multiple NGOs operate in an area, there is no intelligent system to route emergencies to the most suitable organization based on proximity and current caseload."))
story.append(B("<b>No Consolidated Analytics:</b> NGOs and administrators lack data-driven insights into case trends, geographic hotspots, species distributions, and fundraising performance, hindering effective resource planning."))

story.append(SEC("1.4 Applying Software Engineering Approach"))
story.append(P("StrayCare is developed using a structured Agile software engineering methodology:"))
story.append(B("<b>Requirements Engineering:</b> A thorough analysis of all three key actors' needs produced clear functional and non-functional requirements spanning both Phase I and Phase II features."))
story.append(B("<b>API-First Architectural Design:</b> The three-tier architecture (React frontend, FastAPI backend, SQLite data layer) ensures modularity and extensibility. All Phase II features were implemented as new FastAPI router modules, keeping existing functionality intact."))
story.append(B("<b>Database Migration Safety:</b> Phase II added multiple new columns to existing tables (e.g., severity_score, upi_id, video_url) using safe ALTER TABLE migrations executed at application startup, ensuring zero downtime for existing data."))
story.append(B("<b>Technology Stack Evolution:</b> Phase II introduced Razorpay SDK, google-auth library, Groq SDK, and Recharts (React charting library) to the stack without disrupting existing dependencies."))
story.append(B("<b>Quality Assurance:</b> All Phase II features underwent unit testing (algorithm accuracy), API endpoint testing via FastAPI Swagger UI and Postman, and end-to-end manual testing across multiple browsers and device types."))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
#  CHAPTER 2: LITERATURE SURVEY
# ══════════════════════════════════════════════════════════════════════════════
story.append(CH("Chapter 2: Literature Survey"))
story.append(HR())
story.append(P("During the requirement gathering phase for StrayCare Phase II, a comprehensive review of existing digital animal welfare solutions, civic technology platforms, and AI-powered emergency response systems was conducted. This review analyzed research papers and deployed applications to understand current advancements, persistent challenges, and technological gaps."))

story.append(SEC("2.1 Incident Reporting and Alert Systems"))
story.append(P("Current methods for reporting animals in distress are often disconnected from actual, verified rescue operations. While a significant body of research focuses on mobile reporting apps, these systems often function as \"alert\" mechanisms without a clear case management backend. Advanced systems are now integrating location-based technology and AI for real-time assistance. The work by Rajwani et al. on using AI for real-time reporting, Sengan et al. on deep learning for roadway animal detection, and Chen, Liu & Liao on tracking stray animals shows a clear evolution toward intelligent, multi-modal platforms. StrayCare's Phase II Smart NGO Dispatch system directly responds to this need by intelligently routing emergencies to the optimal responder."))

story.append(SEC("2.2 Case Management and Citizen Tracking"))
story.append(P("A major gap identified in the literature is the lack of transparency for the citizen after a report is made. Many organizations manage cases using internal-only tools, leaving the reporter uninformed. The work by Wu et al. emphasized the need for a unified rescue system that formally connects the citizen's report to the NGO's workflow. StrayCare solves this through real-time case status tracking, progress update timelines, and after-resolution feedback — all accessible directly from the citizen's dashboard."))

story.append(SEC("2.3 Adoption and Rehoming Processes"))
story.append(P("Many platforms focus on building better adoption storefronts, but treat adoption as completely separate from rescue. Advanced systems by Jha et al. (AI-based adoption matching), Lu (machine learning for adoption status prediction), and Torres et al. (content-based filtering) demonstrate the move toward intelligent matching. StrayCare Phase II goes further by integrating a citizen pet listing portal — enabling not just NGO-driven but also community-driven pet rehoming, subject to NGO verification, creating a comprehensive adoption ecosystem."))

story.append(SEC("2.4 Donation Transparency and Accountability"))
story.append(P("The literature reveals a critical gap in digital civic platforms: the absence of transparent, verifiable donation mechanisms. Most NGO platforms rely on offline fund collection or generic donation links with no impact reporting. StrayCare Phase II addresses this through an end-to-end Razorpay payment integration with NGO-specific order creation, webhook-verified status updates, UPI fallback support, and a public Donor Transparency Dashboard that aggregates month-wise and year-wise donation statistics alongside case resolution and adoption impact metrics."))

story.append(SEC("2.5 AI-Powered Conversational Interfaces for Emergency Response"))
story.append(P("Studies on Large Language Model (LLM) integration in emergency response platforms show that domain-specific AI assistants significantly improve citizen engagement and first-response outcomes. The work on Llama-series models demonstrates that open-weight LLMs can match proprietary model performance for focused tasks at a fraction of the cost. StrayCare Phase II integrates the Groq API (Llama 3.3 70B) specifically for multi-turn animal rescue and first-aid conversations, replacing the earlier rule-based chatbot with one that handles nuanced, context-aware queries while maintaining conversation history."))

story.append(SEC("2.6 Comparative Analysis of Existing Systems"))
story.append(SP(4))
table2_data = [
    ["System/Paper", "Technology", "Key Feature", "Gap Addressed in StrayCare"],
    ["Pet Adoption &\nRescue Center\n(Prajapati et al.)", "Node.js, MongoDB,\nGoogle Maps API", "Proximity search,\nAI image recognition", "Unified rescue-to-adoption\nworkflow, analytics"],
    ["CareForPaws\n(Blancaflor et al.)", "React Native,\nGPS, SUS-tested", "Location-based matching,\nSUS score: 85", "Donation gateway, groq\nAI chatbot, hotspot map"],
    ["FurRescue\n(Jean & Wahid)", "Mobile app,\nAI breed detection", "Geo-fencing,\npush notifications", "NGO dispatch ranking,\nK-Means clustering"],
    ["SRMS\n(Subramaniam et al.)", "Web app, DB-driven", "Structured rescue\nmanagement", "Donor dashboard,\nNGO analytics, Google OAuth"],
    ["PetHub\n(prior work)", "PHP, MySQL", "Streamlined adoption\n& donations", "Real-time case updates,\nLLM chatbot, feedback responses"],
]
t2 = make_table(table2_data, [3.0*cm, 3.2*cm, 3.8*cm, 5.0*cm])
story.append(t2)
story.append(CAP("Table 2.1: Comparative Analysis of Existing Systems and StrayCare Phase II Contributions"))
story.append(SP(8))
story.append(P("The comparative analysis confirms that while individual platforms have solved specific aspects of the problem, no existing system integrates the complete set of features: structured reporting, NGO case management, AI-powered severity triaging, intelligent dispatch, geospatial hotspot visualization, transparent donation management, AI conversational support, and comprehensive analytics. StrayCare Phase II bridges all these gaps within a single, cohesive platform."))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
#  CHAPTER 3: SOFTWARE REQUIREMENTS SPECIFICATION
# ══════════════════════════════════════════════════════════════════════════════
story.append(CH("Chapter 3: Software Requirements Specification"))
story.append(HR())

story.append(SEC("3.1 Introduction"))
story.append(SSEC("3.1.1 Purpose"))
story.append(P("The primary purpose of StrayCare Phase II is to transform the Phase I prototype into a fully production-capable civic technology platform. This phase adds financial infrastructure (Razorpay donations), enterprise-grade authentication (Google OAuth 2.0), AI/ML-powered intelligence (Groq LLM chatbot, advanced dispatch, hotspot mapping), and rich analytics for all stakeholders. The system continues to bridge the gap between compassionate citizens and verified NGOs while now also providing transparent resource allocation, donor accountability, and data-driven operational insights."))

story.append(SSEC("3.1.2 Intended Audience and Reading Suggestion"))
story.append(P("This document is intended for software developers, UI/UX designers, quality assurance testers, project managers, academic reviewers, animal welfare organizations, and potential government or municipal partners. Readers should begin with the project scope and system features before exploring technical constraints, security, and evaluation criteria."))

story.append(SSEC("3.1.3 Project Scope — Phase II Additions"))
story.append(P("Building upon the Phase I scope (case reporting, NGO dashboard, adoption gallery, admin panel, feedback system), Phase II adds the following modules:"))
story.append(B("<b>Razorpay Donation Gateway:</b> End-to-end payment processing with order creation, Razorpay checkout integration, webhook-based status verification, and UPI deep-link fallback."))
story.append(B("<b>Google OAuth 2.0:</b> Single sign-on authentication for citizens using their Google accounts, with automatic account creation for new users."))
story.append(B("<b>Groq AI Chatbot:</b> Multi-turn conversational AI using the Llama 3.3 70B model via the Groq API, replacing the rule-based chatbot for richer, context-aware animal rescue guidance."))
story.append(B("<b>NGO Analytics Dashboard:</b> Visual charts showing case trends (month-wise, year-wise), species distribution, monthly adoptions, and monthly donations."))
story.append(B("<b>Admin Analytics Dashboard:</b> Platform-wide analytics showing total cases by status, total donations, and adoption statistics with interactive charts."))
story.append(B("<b>Donor Transparency Dashboard:</b> Public-facing portal showing aggregate donation impact, month-wise donation charts, cases supported, and adoptions facilitated."))
story.append(B("<b>Zone Red Hotspot Map:</b> Interactive Leaflet.js map with color-coded risk overlays computed from K-Means clustering of reported case GPS coordinates."))
story.append(B("<b>Smart NGO Dispatch:</b> Admin tool that ranks NGOs for a selected case using Haversine distance, active caseload, and base score to produce a weighted recommendation list."))
story.append(B("<b>Citizen Pet Listing:</b> Citizens can submit their own pets for adoption, subject to NGO verification and approval, broadening the adoption marketplace."))
story.append(B("<b>NGO Feedback Response:</b> NGOs can publicly respond to citizen reviews, completing the accountability and trust-building loop."))
story.append(B("<b>Pet Video Upload:</b> NGOs can attach short video clips to pet adoption listings, providing richer adoption profiles."))
story.append(B("<b>Donor KYC Verification:</b> A two-step OTP-based email and phone verification flow before high-value donations."))

story.append(SSEC("3.1.4 Design and Implementation Constraints"))
story.append(P("The Phase II system continues to use React (frontend) and FastAPI/Python (backend). All new Phase II database columns were added using safe SQLite ALTER TABLE migrations to preserve existing data. Razorpay API keys are loaded via environment variables for security. The Groq API key is stored server-side and never exposed to the client. The UPI payment deep-link fallback works on Android/iOS devices with a UPI app installed. All chart components use Recharts, a React-native charting library that requires no additional server-side dependencies. The Leaflet.js map runs entirely in the browser with map tiles fetched from OpenStreetMap."))

story.append(SSEC("3.1.5 Assumptions and Dependencies"))
story.append(P("The system assumes that users have internet access and a modern browser (Chrome, Firefox, Edge, Safari). Google OAuth requires a valid GOOGLE_CLIENT_ID environment variable. Razorpay integration requires RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_WEBHOOK_SECRET. The Groq chatbot requires a valid GROQ_API_KEY. For production deployment, HTTPS is mandatory for Google OAuth callbacks and Razorpay webhooks."))

story.append(SEC("3.2 System Features — Phase II"))

story.append(SSEC("3.2.1 Razorpay Donation Payment System"))
story.append(P("The donation module enables secure, verifiable monetary contributions to specific NGOs:"))
story.append(B("Citizens browse the donation page, which lists all verified NGOs with their 30-day donation totals and case statistics via GET /donations/ngos."))
story.append(B("After selecting an NGO and amount, the frontend calls POST /donations/create-order, which creates a Razorpay order server-side and returns the order ID to the client."))
story.append(B("The Razorpay Checkout SDK is loaded client-side to handle card, UPI, net banking, and wallet payments."))
story.append(B("Upon payment completion, Razorpay sends a webhook to POST /donations/webhook; the backend verifies the HMAC-SHA256 signature and updates the donation status to 'Completed' idempotently."))
story.append(B("If no Razorpay keys are configured, the frontend displays a UPI deep-link fallback using the NGO's registered UPI ID, enabling offline UPI payments."))

story.append(SSEC("3.2.2 Google OAuth 2.0 Authentication"))
story.append(P("Citizens can sign in using their Google account via the POST /auth/google endpoint. The backend verifies the Google ID token using the google-auth library, extracts the user's email and name, creates a new account if one does not exist, and returns a JWT access token. This eliminates the need for citizens to remember a separate password while maintaining full compatibility with the existing JWT-based session system."))

story.append(SSEC("3.2.3 Groq AI Chatbot (LLM)"))
story.append(P("The chatbot at POST /chatbot/query now routes requests to the Groq API using the Llama 3.3 70B model (llama-3.3-70b-versatile). The complete conversation history is passed to the model on every request, enabling rich multi-turn conversations. The system prompt configures the model as a specialized StrayCare Animal Rescue Assistant, directing it to provide expert first-aid guidance for injured and distressed animals. On API failure, the system gracefully falls back to the local rule-based engine in chatbot_logic.py, ensuring zero downtime for users."))

story.append(SSEC("3.2.4 Analytics Dashboards"))
story.append(P("Three new analytics interfaces have been added using Recharts:"))
story.append(B("<b>NGO Analytics Dashboard (/ngo/dashboard/analytics):</b> Displays line charts for monthly case trends, bar charts for species distribution, adoption trends, and monthly donation amounts — all powered by dedicated FastAPI endpoints consuming NGO-scoped database queries."))
story.append(B("<b>Admin Analytics Dashboard (/admin/dashboard/analytics):</b> Provides platform-wide totals for cases by status (Pending, Accepted, Resolved), total donation amounts, and adoption counts with interactive pie and bar charts."))
story.append(B("<b>Donor Transparency Dashboard (/donor-dashboard):</b> A public page (no authentication required) showing month-wise donation charts, total amount raised, cases supported, and adoption statistics to build donor confidence."))

story.append(SSEC("3.2.5 Zone Red Hotspot Map"))
story.append(P("An interactive Leaflet.js map visualizes animal rescue emergency hotspots. The backend endpoint GET /admin/hotspots fetches all reported cases with GPS coordinates, runs the K-Means clustering algorithm (k=5 by default), and returns colored cluster centroids with ring radius values. The frontend renders these as color-coded semi-transparent circles (red = Critical ≥10 cases, orange = High ≥5 cases, yellow = Moderate ≥2, green = Low). Clicking a cluster displays its case count and risk level. This tool enables NGOs and administrators to proactively allocate resources and plan shelter placement."))

story.append(SSEC("3.2.6 Smart NGO Dispatch"))
story.append(P("The Smart Dispatch page (GET /admin/smart-dispatch/{case_id}) allows administrators to intelligently route a specific emergency case to the most suitable NGO. The Haversine formula computes the great-circle distance between the case coordinates and each registered NGO's location. A weighted scoring matrix then ranks NGOs: 50 points for proximity (closer = higher), 30 points for low active caseload (fewer current cases = higher), and a 20-point base score for all verified NGOs. The ranked list is displayed with distance, active case count, and total dispatch score — enabling one-click case assignment."))

story.append(SEC("3.3 External Interface Requirements"))

story.append(SSEC("3.3.1 User Interface"))
story.append(P("StrayCare maintains its mobile-first, glassmorphism-inspired design throughout Phase II. New pages follow the same design system: the Analytics dashboards use a consistent card-and-chart layout with color-coded data series; the Hotspot Map fills the viewport with a sidebar statistics panel; the Smart Dispatch page uses a ranking table with a sticky action column; the Donor Dashboard is public-facing with high-contrast impact statistics. All new forms (Pet Listing, Feedback Response) are modals with inline validation and loading states."))

story.append(SSEC("3.3.2 Software Interface"))
story.append(P("Phase II introduces the following external service integrations:"))
story.append(B("<b>Razorpay API:</b> Creates orders with razorpay.Client.order.create(), verifies webhooks using HMAC-SHA256 with the Razorpay webhook secret."))
story.append(B("<b>Google Auth Library:</b> google.oauth2.id_token.verify_oauth2_token() validates Google ID tokens server-side against the GOOGLE_CLIENT_ID."))
story.append(B("<b>Groq API:</b> groq.Groq().chat.completions.create() sends conversation history to the Llama 3.3 70B model with a system-configured persona."))
story.append(B("<b>Leaflet.js:</b> Browser-native map rendering with OpenStreetMap tiles; no server-side mapping dependencies required."))
story.append(B("<b>Recharts:</b> All charts are pure React components using SVG rendering, requiring no additional backend services."))

story.append(SSEC("3.3.3 Communication Interface"))
story.append(P("All client-server communication remains HTTPS-secured RESTful JSON APIs. New Phase II webhook endpoints (POST /donations/webhook) verify request authenticity using HMAC-SHA256 signature validation before processing payment status updates. The Groq API calls are made server-to-server (backend to Groq), ensuring the API key is never exposed to browser clients."))

story.append(SEC("3.4 Non-Functional Requirements"))

story.append(SSEC("3.4.1 Performance Requirements"))
story.append(P("Phase II maintains all Phase I performance targets: API response time under 500ms for standard data retrieval, FCP under 2 seconds on 3G. The Groq AI chatbot endpoint has a target response time of under 3 seconds for typical queries. The K-Means clustering algorithm processes up to 500 case coordinates in under 100ms using pure Python with no dependency on external ML libraries. Analytics dashboard pages use parallel API calls (Promise.all) to minimize total page load time."))

story.append(SSEC("3.4.2 Security Requirements"))
story.append(P("Phase II introduces additional security measures:"))
story.append(B("<b>Webhook Signature Verification:</b> All Razorpay webhook requests are verified using HMAC-SHA256 with the RAZORPAY_WEBHOOK_SECRET before processing, preventing fraudulent payment status updates."))
story.append(B("<b>Environment Variable Isolation:</b> All API keys (Razorpay, Groq, Google OAuth) are stored exclusively in server-side environment variables and never included in client-side code bundles."))
story.append(B("<b>Idempotent Donation Processing:</b> The webhook handler checks existing donation status before updating, preventing double-counting from duplicate webhook deliveries."))
story.append(B("<b>OAuth Token Validation:</b> Google ID tokens are validated server-side using the official Google Auth library, not just decoded, ensuring token freshness and authenticity."))

story.append(SSEC("3.4.3 Software Quality Attributes"))
story.append(P("All Phase I quality attributes (Maintainability, Scalability, Reusability, Portability) are preserved. Phase II adds:"))
story.append(B("<b>Resilience:</b> The Groq chatbot falls back to the local rule-based engine on API failure, and the donation system degrades gracefully to UPI deep-links if Razorpay keys are absent."))
story.append(B("<b>Observability:</b> The startup event logs all database migration outcomes and seeding status, enabling rapid diagnosis of deployment issues."))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
#  CHAPTER 4: SYSTEM DESIGN
# ══════════════════════════════════════════════════════════════════════════════
story.append(CH("Chapter 4: System Design"))
story.append(HR())

story.append(SEC("4.1 System Architecture — Phase II"))
story.append(P("The Phase II architecture maintains the three-tier client-server structure of Phase I while introducing new external service integrations at the application logic layer. The system now consists of five logical layers:"))
story.append(B("<b>1. Presentation Layer (React SPA):</b> Extended with new pages — AdminAnalyticsDashboard, NGOAnalyticsDashboard, DonorDashboard, HotspotMap, SmartDispatch, DonatePage, DonorVerification, UserPetListingForm — all using CSS Modules and Recharts for consistent, responsive UI."))
story.append(B("<b>2. Client-Side Intelligence Layer:</b> TensorFlow.js + MobileNet V2 (animal species recognition) and Leaflet.js (hotspot map rendering) continue to run in-browser, protecting user privacy and reducing server load."))
story.append(B("<b>3. API Gateway (FastAPI):</b> All business logic, algorithm execution, and third-party API orchestration. New Phase II router groups: /donations (Razorpay), /auth/google (OAuth), /chatbot (Groq LLM), /admin/hotspots (K-Means), /admin/smart-dispatch (Haversine), /ngo/dashboard and /admin/dashboard (analytics), /donor/dashboard (public stats), /donor/verify (KYC)."))
story.append(B("<b>4. External Services Layer:</b> Razorpay Payment Gateway (order API + webhook), Groq AI API (LLM inference), Google Auth servers (OAuth 2.0 token verification)."))
story.append(B("<b>5. Data & Storage Layer:</b> SQLite database (straycare.db) extended with new columns and tables: donations, user_pet_listings, feedback enhancements (category, ngo_response), NGO UPI ID; uploads/ directory for case photos, pet images, verification documents, and pet videos."))

story.append(SP(8))
story.append(IMG_PLACEHOLDER(
    "Figure 4.1: StrayCare Phase II — System Architecture Diagram\n"
    "(Presentation Layer → Client Intelligence → FastAPI Gateway → External Services → Data & Storage Layer)",
    height=6*cm
))
story.append(CAP("Figure 4.1: StrayCare Phase II — Three-Tier System Architecture Diagram"))
story.append(SP(10))
story.append(SEC("4.2 Database Schema — Phase II Extensions"))
story.append(SP(4))
schema_data = [
    ["Table", "New Column(s) Added in Phase II", "Purpose"],
    ["cases", "severity_score (INT), severity_label (TEXT),\npet_name (TEXT), is_adoptable (INT),\nadoption_story (TEXT), temperament (TEXT)", "NLP severity triaging, adoptability workflow"],
    ["pets", "ngo_id (INT), video_url (TEXT)", "NGO ownership tracking, video adoption profiles"],
    ["ngos", "upi_id (TEXT)", "Direct UPI payment fallback for donations"],
    ["feedback", "category (TEXT), ngo_response (TEXT)", "Feedback categorization, NGO reply capability"],
    ["donations", "id, amount, currency, status, order_id,\nrazorpay_payment_id, ngo_id, user_id, created_at", "Full donation lifecycle tracking (NEW TABLE)"],
    ["user_pet_listings", "id, name, species, age, location,\ndescription, image_url, status, user_id, created_at", "Citizen pet rehoming portal (NEW TABLE)"],
]
t_schema = make_table(schema_data, [3.0*cm, 5.5*cm, 5.5*cm])
story.append(t_schema)
story.append(CAP("Table 4.1: Phase II Database Schema Extensions"))

story.append(SEC("4.3 UML Diagrams — Phase II"))
story.append(P("This section presents all UML diagrams for StrayCare Phase II: Class Diagram, Use Case Diagram, Sequence Diagrams for key workflows, Activity Diagrams for the case lifecycle and adoption process, the Component Diagram, the Entity-Relationship (ER) Diagram, and the Case State Machine."))

# ── 4.3.1 Class Diagram ────────────────────────────────────────────────────────
story.append(SSEC("4.3.1 Class Diagram"))
story.append(P("The Class Diagram captures all ten database entity classes — User, NGO, Case, CaseUpdate, Pet, AdoptionRequest, Donation, Feedback, UserPetListing, and DonorVerification — together with their attributes and inter-class relationships. Key Phase II additions include the <b>Donation</b> class (linked to NGO and User) and the <b>UserPetListing</b> class (linked to User). The <b>Feedback</b> and <b>Pet</b> classes were extended with new Phase II columns."))
story.append(SP(6))
story.append(UML_IMG("01_class_diagram.png", max_height=14*cm))
story.append(CAP("Figure 4.2: StrayCare Phase II — Class Diagram showing all entity classes, attributes, and relationships"))
story.append(SP(10))

# ── 4.3.2 Use Case Diagram ─────────────────────────────────────────────────────
story.append(SSEC("4.3.2 Use Case Diagram"))
story.append(P("The Use Case Diagram defines all system actors — Citizen, NGO, Admin, and Guest — and maps each to their respective system features. Citizens report cases, track status, donate, and adopt pets. NGOs manage cases, pets, and adoption requests. Admins verify NGOs, use Smart Dispatch, and view the Hotspot Map. Guests can browse pets, view the donor dashboard, and use the AI chatbot without authentication."))
story.append(SP(6))
story.append(UML_IMG("02_use_case.png", max_height=12*cm))
story.append(CAP("Figure 4.3: StrayCare Phase II — Use Case Diagram (Citizen, NGO, Admin, Guest actors)"))
story.append(SP(10))

# ── 4.3.3 Sequence Diagram: Report Case ───────────────────────────────────────
story.append(SSEC("4.3.3 Sequence Diagram — Report Stray Case"))
story.append(P("This sequence diagram shows the complete flow when a citizen reports a stray case. After JWT verification, the photo is saved to the uploads directory. The NLP severity algorithm analyses the description text and returns a label (Critical / High / Moderate / Low). The severity score is persisted with the case record before the response is returned to the frontend."))
story.append(SP(6))
story.append(UML_IMG("03_seq_report_case.png", max_height=10*cm))
story.append(CAP("Figure 4.4: Sequence Diagram — Report Stray Case with NLP Severity Scoring"))
story.append(SP(10))

# ── 4.3.4 Sequence Diagram: Donation ──────────────────────────────────────────
story.append(SSEC("4.3.4 Sequence Diagram — Razorpay Donation Flow"))
story.append(P("The donation sequence diagram covers the full Razorpay payment lifecycle: order creation, checkout widget, payment capture, and HMAC-SHA256 webhook verification. The donation record is created in the database at order creation (status=Pending) and updated to Success only after the signature is verified, ensuring idempotent, fraud-proof processing."))
story.append(SP(6))
story.append(UML_IMG("04_seq_donation.png", max_height=11*cm))
story.append(CAP("Figure 4.5: Sequence Diagram — Razorpay Donation (Order → Payment → Webhook Verification)"))
story.append(SP(10))

# ── 4.3.5 Sequence Diagram: Smart Dispatch ────────────────────────────────────
story.append(SSEC("4.3.5 Sequence Diagram — Smart NGO Dispatch"))
story.append(P("The Smart Dispatch sequence shows how an admin selects a pending case and receives an NGO ranking list. The backend computes Haversine distances to each verified NGO, queries their active case counts, and runs the weighted scoring algorithm (proximity 50pts + caseload 30pts + base 20pts) to produce a sorted recommendation list."))
story.append(SP(6))
story.append(UML_IMG("05_seq_dispatch.png", max_height=11*cm))
story.append(CAP("Figure 4.6: Sequence Diagram — Smart NGO Dispatch (Haversine + Weighted Scoring)"))
story.append(SP(10))
story.append(PageBreak())

# ── 4.3.6 Sequence Diagram: AI Chatbot ────────────────────────────────────────
story.append(SSEC("4.3.6 Sequence Diagram — AI Chatbot (Groq Llama 3.3)"))
story.append(P("The chatbot sequence diagram illustrates multi-turn conversation handling. The full conversation history is passed to the Groq API on every request, enabling contextually-aware responses. On any API failure or timeout, the backend falls back to the local rule-based engine, ensuring zero-downtime chat support."))
story.append(SP(6))
story.append(UML_IMG("06_seq_chatbot.png", max_height=11*cm))
story.append(CAP("Figure 4.7: Sequence Diagram — Groq AI Chatbot with Graceful Fallback to Rule-Based Engine"))
story.append(SP(10))

# ── 4.3.7 Activity Diagram: Case Lifecycle ────────────────────────────────────
story.append(SSEC("4.3.7 Activity Diagram — Case Lifecycle"))
story.append(P("The case lifecycle activity diagram follows a rescue case from citizen report through NLP severity scoring, NGO acceptance or rejection, iterative progress updates, and final resolution. After resolution, the citizen submits star-rating feedback and the NGO can post a public response, completing the accountability loop."))
story.append(SP(6))
story.append(UML_IMG("07_activity_case_lifecycle.png", max_height=12*cm))
story.append(CAP("Figure 4.8: Activity Diagram — Case Lifecycle (Report → Triage → Accept → Update → Resolve → Feedback)"))
story.append(SP(10))

# ── 4.3.8 Activity Diagram: Adoption ──────────────────────────────────────────
story.append(SSEC("4.3.8 Activity Diagram — Pet Adoption Process"))
story.append(P("The adoption activity diagram shows two parallel entry paths: manual pet gallery browsing and the AI Pet Matchmaker, which scores each pet against the adopter's lifestyle profile (living space, activity level, has_kids). Both paths converge at the adoption request submission, followed by NGO review and approval or rejection."))
story.append(SP(6))
story.append(UML_IMG("08_activity_adoption.png", max_height=12*cm))
story.append(CAP("Figure 4.9: Activity Diagram — Pet Adoption Process (Manual Browse + AI Matchmaker paths)"))
story.append(SP(10))
story.append(PageBreak())

# ── 4.3.9 Component Diagram ───────────────────────────────────────────────────
story.append(SSEC("4.3.9 Component Diagram — System Architecture"))
story.append(P("The component diagram shows the full three-tier architecture: React.js SPA and Android Capacitor app as clients; FastAPI backend with discrete modules (Auth, Cases, Pets, Donations, Analytics, Chatbot); SQLite database and file system for storage; and three external cloud services — Google OAuth2, Razorpay Payment Gateway, and Groq Llama 3.3 — each interfaced via dedicated backend modules."))
story.append(SP(6))
story.append(UML_IMG("09_component_diagram.png", max_height=12*cm))
story.append(CAP("Figure 4.10: Component Diagram — StrayCare Three-Tier Architecture with External Service Integrations"))
story.append(SP(10))

# ── 4.3.10 ER Diagram ─────────────────────────────────────────────────────────
story.append(SSEC("4.3.10 Entity-Relationship (ER) Diagram"))
story.append(P("The ER diagram maps all ten database tables and their foreign-key relationships. Users report many Cases; Cases have many CaseUpdates; NGOs receive many Donations, manage many Pets, and handle many AdoptionRequests; Feedback links a User, NGO, and Case; UserPetListings belong to a User; DonorVerification is a one-to-one extension of User."))
story.append(SP(6))
story.append(UML_IMG("10_er_diagram.png", max_height=13*cm))
story.append(CAP("Figure 4.11: Entity-Relationship (ER) Diagram — All 10 database tables and foreign-key relationships"))
story.append(SP(10))

# ── 4.3.11 State Machine: Case Status ────────────────────────────────────────
story.append(SSEC("4.3.11 State Machine — Case Status"))
story.append(P("The state machine for a rescue case starts at Pending (after citizen submission with auto-assigned NLP severity). An NGO transitions it to Accepted (allowing iterative update posts) or Rejected. Accepted cases move to Resolved when the animal is treated or rehomed. Both terminal states end the case workflow."))
story.append(SP(6))
story.append(UML_IMG("11_state_case.png", max_height=10*cm))
story.append(CAP("Figure 4.12: State Machine — Case Status Transitions (Pending → Accepted / Rejected → Resolved)"))
story.append(SP(6))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
#  CHAPTER 5: LITERATURE SURVEY ON NLP — RULE-BASED + LLM HYBRID APPROACH
# ══════════════════════════════════════════════════════════════════════════════
story.append(CH("Chapter 5: Technical Specifications"))
story.append(HR())
story.append(SP(6))
story.append(SEC("5.1 NLP and LLM Hybrid Architecture"))

story.append(SSEC("5.1.1 Introduction"))
story.append(P("Natural Language Processing (NLP) enables systems to understand and interpret human language. In emergency response platforms like StrayCare, two complementary NLP paradigms are employed: (1) rule-based keyword matching for real-time, latency-critical case severity triaging, and (2) large language model (LLM) inference for nuanced, multi-turn first-aid conversational support. StrayCare Phase II implements both, assigning each to the task it is best suited for."))

story.append(SSEC("5.1.2 Rule-Based NLP for Emergency Severity Triaging"))
story.append(P("Historically, automated dispatch systems utilized simple keyword matching. Research on urban emergency response confirms that rule-based NLP provides the lowest latency — a critical metric when handling trauma cases. StrayCare's custom Rule-Based NLP engine in algorithms.py tokenizes the citizen's case description and applies a weighted scoring system:"))
story.append(B("<b>Critical (+100 pts):</b> Keywords such as 'bleeding', 'unconscious', 'hit by car', 'paralyzed', 'seizure', 'not breathing', 'maggots', 'mauled', 'fractured', 'road accident'."))
story.append(B("<b>High (+60 pts):</b> Keywords such as 'injured', 'poisoned', 'trapped', 'bitten', 'attacked', 'infection', 'vomiting blood', 'convulsing'."))
story.append(B("<b>Moderate (+30 pts):</b> Keywords such as 'limping', 'malnourished', 'abandoned', 'mange', 'lethargic', 'scared'."))
story.append(P("Score thresholds determine the severity label (Critical ≥100, High ≥60, Moderate ≥30, Low <30). Color-coded priority badges (red, orange, yellow, green) are then displayed on the NGO dashboard. This deterministic approach delivers instant classification without external API calls, ensuring sub-millisecond triaging even under high load."))

story.append(SSEC("5.1.3 LLM-Based Conversational Support (Phase II)"))
story.append(P("While rule-based systems excel at deterministic, real-time triaging, they fail to handle the nuanced, open-ended queries that concerned citizens and NGO workers ask in an emergency. \"What should I do if my dog is in shock?\" or \"Can I give paracetamol to an injured cat?\" require contextual reasoning that keyword matching cannot provide."))
story.append(SP(5))
story.append(P("Phase II replaces the rule-based chatbot responses with the Groq API (Llama 3.3 70B model). Groq's hardware acceleration ensures sub-2-second response times for typical queries — faster than most hosted LLM APIs. The complete conversation history is passed to the model on every turn, enabling context-aware multi-turn dialogue. The system prompt configures the model as a specialized veterinary first-aid assistant, directing it to provide practical, safe, and actionable guidance while recommending professional veterinary care for serious injuries."))

story.append(SSEC("5.1.4 Hybrid Architecture: The Best of Both Worlds"))
story.append(SP(4))
hybrid_data = [
    ["Criterion", "Rule-Based NLP\n(algorithms.py)", "Groq LLM\n(Llama 3.3 70B)"],
    ["Latency", "< 1 ms", "1–3 seconds"],
    ["Use Case", "Case severity triage at report\nsubmission", "Multi-turn first-aid\nconversations"],
    ["API Dependency", "None — pure Python", "Groq API (fallback: local)"],
    ["Context Awareness", "None — keyword only", "Full conversation history"],
    ["Cost", "Zero", "Groq API tokens (very low)"],
    ["Determinism", "Fully deterministic", "Probabilistic (generative)"],
    ["Maintainability", "Manual keyword updates", "System prompt tuning"],
]
t_hybrid = make_table(hybrid_data, [3.5*cm, 4.5*cm, 6.0*cm])
story.append(t_hybrid)
story.append(CAP("Table 5.1: Comparison of Rule-Based NLP vs. Groq LLM in StrayCare Phase II"))
story.append(SP(8))
story.append(P("StrayCare's hybrid approach uses rule-based NLP where determinism and latency are paramount (automatic severity badge at case submission) and LLM where expressiveness and context-awareness matter (chatbot conversations). The LLM chatbot also includes a graceful fallback to the local rule-based engine in the event of Groq API unavailability, ensuring zero downtime for users."))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
#  CHAPTER 6: MACHINE LEARNING CONCEPTS AND IMPLEMENTATION
# ══════════════════════════════════════════════════════════════════════════════
story.append(SP(6))
story.append(SEC("5.2 Machine Learning Algorithms and Implementation"))

story.append(SSEC("5.2.1 Overview of ML Mechanisms in StrayCare"))
story.append(P("StrayCare employs four distinct machine learning and mathematical mechanisms, all implemented natively without reliance on large external ML frameworks (except TensorFlow.js which runs in-browser):"))
story.append(B("<b>Feature 1:</b> Haversine Distance Formula — Smart NGO Dispatch (geospatial algorithm)"))
story.append(B("<b>Feature 2:</b> Pet Lifestyle Matchmaker — Compatibility scoring algorithm"))
story.append(B("<b>Feature 3:</b> Rule-Based NLP Severity Triaging — Weighted keyword scoring with emergency classification"))
story.append(B("<b>Feature 4:</b> K-Means Clustering — Zone Red Hotspot Map (unsupervised spatial ML)"))
story.append(B("<b>Feature 5 (Phase II):</b> MobileNet V2 via TensorFlow.js — Animal species recognition (pre-trained CNN in-browser)"))
story.append(B("<b>Feature 6 (Phase II):</b> Groq Llama 3.3 70B — Conversational AI for first-aid guidance (large language model, cloud inference)"))

story.append(SSEC("5.2.2 Feature 1: Haversine Formula — Smart NGO Dispatch"))
story.append(P("The Haversine formula calculates the great-circle distance between two points on Earth's surface given their latitude and longitude coordinates. It is the geographically accurate alternative to the Euclidean distance formula, which fails on a spherical surface. In StrayCare, this algorithm is used to compute the distance between a reported emergency case and each registered NGO in the system:"))
story.append(SP(4))
story.append(P("<b>Formula:</b> d = 2R · arctan2(√a, √(1−a)), where a = sin²(Δφ/2) + cos φ₁ · cos φ₂ · sin²(Δλ/2), R = 6371 km (Earth radius)."))
story.append(SP(4))
story.append(P("The dispatch scoring matrix then ranks NGOs by combining: Distance Score (0–50 pts, linearly decreasing over 200 km), Caseload Score (0–30 pts, linearly decreasing with active cases, max at 10), and Base Score (20 pts for all verified NGOs). The ranked list helps administrators dispatch emergencies to the most available, closest NGO in a single click."))

story.append(SSEC("5.2.3 Feature 2: Pet Lifestyle Matchmaker"))
story.append(P("This algorithm calculates a compatibility match percentage (15–99%) between an adoptable pet's profile and a prospective adopter's lifestyle. Starting from a base score of 60, adjustments are made based on:"))
story.append(B("<b>Living Space:</b> Cats gain +15 pts in apartments; large dogs lose −30 pts in apartments; large dogs gain +15 pts in houses."))
story.append(B("<b>Activity Level:</b> Senior pets gain +20 pts for low-activity adopters; young/puppy/kitten pets lose −20 pts for low-activity adopters; adult dogs gain +15 pts for high-activity adopters."))
story.append(B("<b>Kids:</b> Large dogs near kids lose −10 pts (safety); medium/large dogs gain +5 pts (playmates for children)."))
story.append(B("<b>Organic Variance:</b> A small deterministic perturbation based on pet ID prevents unrealistic ties and makes percentages feel natural."))
story.append(P("The adoption gallery renders the match percentage as a colored badge (green = high match, yellow = moderate, red = low) for each pet, enabling data-driven adoption decisions."))

story.append(SSEC("5.2.4 Feature 3: Rule-Based NLP Severity Triaging"))
story.append(P("Covered in detail in Chapter 5. In summary: weighted keyword scoring produces a severity score (0 to potentially 500+), which maps to Critical/High/Moderate/Low labels and corresponding color badges. This runs entirely in Python server-side with no external dependencies, ensuring sub-millisecond performance even at high query rates."))

story.append(SSEC("5.2.5 Feature 4: K-Means Clustering — Zone Red Hotspot Map"))
story.append(P("K-Means Clustering is an unsupervised machine learning algorithm that partitions a set of data points into K clusters based on spatial proximity. StrayCare uses it to group GPS coordinates of all reported cases into geographic hotspot zones, identifying areas with concentrated animal rescue emergencies."))
story.append(SP(4))
story.append(P("The implementation in algorithms.py runs the full K-Means iteration loop in pure Python: (1) Initialize K centroids by randomly sampling K points from the dataset (fixed seed=42 for reproducibility). (2) Assign each case point to its nearest centroid using Euclidean distance on lat/lon coordinates. (3) Recompute each centroid as the mean of all points assigned to it. (4) Repeat steps 2–3 until assignments do not change (convergence) or max_iterations (20) is reached. (5) Map each cluster's case count to a risk level: ≥10 cases = Critical Zone (red, 800m radius), ≥5 = High Zone (orange, 500m), ≥2 = Moderate Zone (yellow, 300m), 1 = Low Zone (green, 150m)."))
story.append(SP(4))
story.append(P("The Leaflet.js frontend renders cluster centroids as semi-transparent colored circles on an OpenStreetMap base layer, providing an immediate geographic overview of where emergency resources are most needed."))

story.append(SSEC("5.2.6 Feature 5: MobileNet V2 — In-Browser Species Recognition"))
story.append(P("A Convolutional Neural Network (CNN) deployed entirely in the citizen's browser via TensorFlow.js. When a citizen uploads a photo to the case report form, the AnimalRecognitionBadge component loads the pre-trained MobileNet V2 model (trained on ImageNet, 1000 categories). It classifies the photo and extracts animal-relevant predictions (dog, cat, bird, etc.), displaying a confidence badge (e.g., \"Dog detected — 82% confidence\") and auto-filling the case description. Key advantages: zero server roundtrips (privacy-preserving), instant inference, and works offline. MobileNet V2 achieves approximately 71.8% top-1 accuracy on ImageNet."))

story.append(SSEC("5.2.7 Performance Evaluation Metrics"))
story.append(SP(4))
metrics_data = [
    ["Algorithm", "Evaluation Metric", "Target / Result"],
    ["K-Means Clustering", "Silhouette Score, Cluster Stability", "Stable clusters on 10–500 case GPS coordinates; tested on synthetic grids"],
    ["Haversine Dispatch", "Distance Accuracy (km)", "< 0.1 km error verified against known Pune city coordinates"],
    ["NLP Severity Triage", "Label Accuracy", "> 95% correct label on 50 manually pre-classified test descriptions"],
    ["Pet Matchmaker", "Score Range Validity", "All scores between 15–99%, no out-of-range values on 200 random pet profiles"],
    ["MobileNet V2", "Top-1 Accuracy (ImageNet)", "~71.8% (published benchmark), 82%+ on indoor animal photos"],
    ["Groq Llama 3.3 70B", "Response Latency, Coherence", "< 2s p95 latency; domain-appropriate first-aid answers verified by team"],
]
t_metrics = make_table(metrics_data, [3.8*cm, 4.2*cm, 6.0*cm])
story.append(t_metrics)
story.append(CAP("Table 6.1: Machine Learning Algorithm Performance Metrics"))

story.append(SSEC("5.2.8 Enhancements and Future Work"))
story.append(B("Transition rule-based NLP triaging to a fine-tuned DistilBERT or BERT-tiny model trained on verified animal rescue case descriptions for higher semantic accuracy."))
story.append(B("Integrate ARIMA or Prophet time-series forecasting with K-Means clusters to predict future accident hotspots based on historical seasonal trends (e.g., monsoon impact on stray animal injury rates)."))
story.append(B("Replace MobileNet V2 with a custom-trained species classifier fine-tuned on Indian street animal images for higher domain-specific accuracy."))
story.append(B("Explore federated learning for training the severity classifier on NGO-submitted case data without centralizing sensitive incident descriptions."))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
#  CHAPTER 7: SOFTWARE TESTING AND QUALITY ASSURANCE
# ══════════════════════════════════════════════════════════════════════════════
story.append(SP(6))
story.append(SEC("5.3 Software Testing and Quality Assurance"))

story.append(SSEC("5.3.1 Introduction to Testing"))
story.append(P("To ensure the StrayCare platform is robust, secure, and capable of handling critical emergency data reliably, a comprehensive multi-layer testing strategy was implemented for Phase II. This strategy builds on the Phase I testing framework (unit testing, API endpoint testing, RBAC testing, E2E rescue lifecycle testing, cross-browser testing) and extends it with new test suites for the Razorpay payment gateway, Groq AI chatbot, analytics endpoints, and K-Means/Haversine algorithms."))

story.append(SSEC("5.3.2 Automated Testing — Phase II Additions"))

story.append(SSEC("5.3.2.1 Algorithm Unit Testing (Phase II)"))
story.append(P("The following new functions in algorithms.py were unit tested:"))
story.append(B("haversine_distance(lat1, lon1, lat2, lon2) — Tested with known city-pair coordinates: Mumbai-Pune (≈148 km), Pune-Delhi (≈1,413 km), verified within 0.1 km tolerance."))
story.append(B("rank_ngos_for_case(case_lat, case_lon, ngos, active_case_counts) — Verified that NGOs closer to the case always score higher in isolation; verified that high caseload correctly reduces score; verified consistent ranking across 10 random case locations."))
story.append(B("cluster_case_hotspots(cases, k) — Tested with input of 1, 5, 10, and 50 synthetic GPS points; verified convergence in ≤20 iterations; verified k is automatically capped to len(points); verified risk level assignment by case count."))
story.append(B("calculate_pet_match(pet, profile) — Verified score bounds [15, 99] across 50 random profile combinations; verified apartment+large_dog penalty; verified senior_pet+low_activity bonus."))

story.append(SSEC("5.3.2.2 API Endpoint Testing (Phase II)"))
story.append(SP(4))
api_test_data = [
    ["Endpoint", "Method", "Expected Status", "Test Scenario"],
    ["/auth/google", "POST", "200 OK + JWT", "Valid Google ID token"],
    ["/auth/google", "POST", "401 Unauthorized", "Tampered / expired token"],
    ["/donations/create-order", "POST", "200 OK + order_id", "Valid amount, valid NGO ID"],
    ["/donations/create-order", "POST", "422", "Missing amount field"],
    ["/donations/webhook", "POST", "200 OK", "Valid Razorpay webhook + correct HMAC"],
    ["/donations/webhook", "POST", "400 Bad Request", "Invalid HMAC signature"],
    ["/admin/hotspots", "GET", "200 OK + clusters", "Admin token + ≥1 case in DB"],
    ["/admin/smart-dispatch/{id}", "GET", "200 OK + ranking", "Valid case ID, NGOs in DB"],
    ["/ngo/dashboard/cases/monthwise", "GET", "200 OK", "NGO token, verified NGO"],
    ["/admin/dashboard/cases", "GET", "200 OK", "Admin token"],
    ["/donor/verify/email/request", "POST", "200 + code", "Authenticated citizen"],
    ["/users/pets/list", "POST", "201 Created", "Valid pet listing with image"],
    ["/ngo/pets/listings", "GET", "200 OK", "NGO token, pending listings exist"],
]
t_api = make_table(api_test_data, [4.5*cm, 1.8*cm, 3.2*cm, 4.5*cm])
story.append(t_api)
story.append(CAP("Table 7.1: Phase II API Endpoint Test Cases and Expected Outcomes"))

story.append(SSEC("5.3.2.3 Payment Gateway Sandbox Testing"))
story.append(P("Manual testing in Razorpay's sandbox environment simulated the following scenarios:"))
story.append(B("<b>Successful UPI Transaction:</b> Donation record created with status 'Created'; webhook delivered; status updated to 'Completed'; verified no duplicate record created on second webhook with same order_id."))
story.append(B("<b>Failed Card Transaction:</b> Webhook with event 'payment.failed' received; donation status updated to 'Failed' without corrupting existing records; frontend displayed appropriate failure message."))
story.append(B("<b>UPI Fallback Mode:</b> With RAZORPAY_KEY_ID unset, Donate button switched to deep-link UPI URL; verified link format: upi://pay?pa={upi_id}&am={amount}&tn=Donation."))
story.append(B("<b>Duplicate Webhook Idempotency:</b> Sent the same 'payment.captured' webhook twice for the same payment_id; verified database status updated only once (idempotency check via order_id lookup)."))

story.append(SSEC("5.3.3 Manual Testing — Phase II"))

story.append(SSEC("5.3.3.1 Groq AI Chatbot Testing"))
story.append(P("End-to-end chatbot testing covered:"))
story.append(B("Multi-turn conversation: Verified conversation history is correctly passed to Groq API on each subsequent message, confirmed by contextually appropriate responses that referenced earlier turns."))
story.append(B("Boundary queries: Tested off-topic queries (weather, politics) — verified the chatbot politely redirected to animal rescue topics per the system prompt."))
story.append(B("Fallback behavior: Temporarily removed GROQ_API_KEY, sent a query — verified the backend caught the exception and returned a rule-based response with no 500 error exposed to the user."))
story.append(B("Response quality: Team veterinary consultation confirmed that first-aid advice for shock, bleeding, fractures, and poisoning cases was clinically appropriate."))

story.append(SSEC("5.3.3.2 Analytics Dashboard Testing"))
story.append(P("All three analytics dashboards were manually verified:"))
story.append(B("NGO Analytics: Verified chart data updates correctly after accepting a new case, completing an adoption, and receiving a donation — all chart endpoints tested with 0, 1, and multiple records."))
story.append(B("Admin Analytics: Verified platform-wide totals reflect newly registered NGOs, new cases, and new donations in real time."))
story.append(B("Donor Dashboard: Verified public access (no authentication token required); confirmed month-wise donation chart correctly groups amounts by month; confirmed case stats reflect all cases regardless of status."))

story.append(SSEC("5.3.3.3 Zone Red Hotspot Map Testing"))
story.append(P("Tested with 0, 1, 5, and 20 case records with varying GPS coordinates. Verified: (1) empty state displays appropriate message with no map errors; (2) single point creates one 'Low Zone' cluster; (3) multiple points cluster correctly with risk levels matched to case counts; (4) map renders correctly on Chrome, Edge, Firefox, and Mobile Safari at 320px, 768px, and 1280px viewports."))

story.append(SSEC("5.3.3.4 End-to-End Phase II Workflow Testing"))
story.append(P("Evaluators tested the complete Phase II workflow:"))
story.append(B("Citizen signs in via Google OAuth → directed to citizen dashboard → reports a case with animal photo → TensorFlow.js returns species badge → NLP assigns severity badge."))
story.append(B("Admin views Zone Red Hotspot Map → identifies high-risk cluster → opens Smart Dispatch for case → reviews NGO ranking list → assigns case to highest-ranked NGO."))
story.append(B("Citizen visits donation page → selects NGO → enters amount → Razorpay checkout opens → completes UPI payment → donation status shown as 'Completed'."))
story.append(B("Citizen views Donor Transparency Dashboard → verifies their donation appears in month-wise chart → sees total cases supported and adoptions facilitated."))
story.append(B("Citizen lists a pet for adoption → NGO reviews pending listing → approves listing → pet appears in adoption gallery."))
story.append(B("After case resolved, citizen leaves feedback → NGO views feedback → NGO submits a public response → citizen sees NGO response on case detail page."))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
#  CHAPTER 8: APPLICATIONS OF ML & AI IN ANIMAL WELFARE PLATFORMS
# ══════════════════════════════════════════════════════════════════════════════
story.append(SP(6))
story.append(SEC("5.4 Applications of AI and ML in StrayCare"))
story.append(P("The combination of Rule-Based NLP, Haversine geospatial algorithms, K-Means clustering, TensorFlow.js in-browser CNN, and the Groq LLM within StrayCare demonstrates a multi-paradigm AI approach to civic technology:"))

story.append(B("<b>1. Emergency Prioritization:</b> The Rule-Based NLP severity triager instantly classifies high-trauma cases (Critical, High) and elevates them to the top of every NGO's dashboard queue — without any manual review or external API calls. A description like 'dog hit by car, bleeding from head' is automatically scored as Critical (red badge) and given priority in the Smart Dispatch ranking."))
story.append(SP(4))
story.append(B("<b>2. Intelligent Resource Allocation:</b> The Haversine-based Smart Dispatch system prevents NGO burnout by routing emergencies to the organization with the best combination of proximity and available capacity. A 'Low' severity case far from all NGOs will not displace a nearby 'Critical' case in the dispatch ranking."))
story.append(SP(4))
story.append(B("<b>3. Proactive Civic Planning:</b> The K-Means Zone Red Hotspot Map enables municipalities and NGO networks to identify where to build new animal shelters, install road-crossing warning signs, or deploy mobile veterinary units based on statistically validated geographic cluster centroids — rather than anecdotal evidence."))
story.append(SP(4))
story.append(B("<b>4. Adoption Optimization:</b> The lifestyle-matching algorithm increases the probability of successful, lasting adoptions by quantifying the mathematical compatibility between a pet's characteristics and an adopter's living situation. Improving adoption outcomes directly reduces shelter overcrowding and animal return rates."))
story.append(SP(4))
story.append(B("<b>5. Citizen Empowerment through Conversational AI:</b> The Groq LLM chatbot provides evidence-based first-aid guidance to citizens in the critical window before professional help arrives. By handling open-ended, context-rich queries (\"My cat is vomiting green fluid and shaking — what do I do?\"), it goes far beyond what a rule-based system can achieve, potentially saving animal lives in the pre-rescue window."))
story.append(SP(4))
story.append(B("<b>6. Privacy-Preserving In-Browser Inference:</b> By running MobileNet V2 entirely in the citizen's browser via TensorFlow.js, animal photos are classified locally without being sent to any server for AI processing. This design choice protects user privacy while still delivering instant species detection and description auto-fill — a key user experience enhancement."))
story.append(SP(4))
story.append(B("<b>7. Data-Driven NGO Performance Monitoring:</b> The Admin Analytics Dashboard aggregates case acceptance rates, resolution times, adoption counts, and donation totals for every NGO. This enables evidence-based decisions about which organizations to prioritize for resource grants, partnership programs, or verification renewals."))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
#  CHAPTER 9: METHODOLOGY AND RESULTS
# ══════════════════════════════════════════════════════════════════════════════
story.append(CH("Chapter 6: Results and Evaluation"))
story.append(HR())

story.append(SEC("6.1 Technology Stack Details"))
story.append(P("The StrayCare Phase II technology stack is an evolution of the Phase I stack, with new integrations added at each layer:"))

story.append(SH("Frontend Technology Stack:"))
story.append(B("<b>React.js (v18.x):</b> Component-based SPA with useState, useEffect, and useRef hooks for state management."))
story.append(B("<b>CSS Modules:</b> Locally-scoped styles for every component, preventing global conflicts. Extended with new module files for DonatePage, NGOAnalyticsDashboard, CitizenDashboard, and AdminAnalyticsDashboard."))
story.append(B("<b>React Router DOM:</b> Client-side routing extended with new Phase II routes: /donate, /donor-dashboard, /hotspot-map, /smart-dispatch, /admin/analytics, /ngo/analytics, /donor/verify, /list-pet."))
story.append(B("<b>Axios:</b> All API calls use Axios with Authorization headers for JWT-protected endpoints."))
story.append(B("<b>Recharts:</b> SVG-based React charting library for all analytics dashboards. Used components: LineChart, BarChart, PieChart, AreaChart, ResponsiveContainer, Tooltip, Legend."))
story.append(B("<b>TensorFlow.js + MobileNet:</b> In-browser CNN for animal species recognition (Phase I, continued)."))
story.append(B("<b>Leaflet.js + React-Leaflet:</b> Interactive map component for the Zone Red Hotspot Map. Uses OpenStreetMap as the base tile provider."))
story.append(B("<b>Razorpay Checkout.js:</b> Client-side Razorpay SDK loaded dynamically to open the payment checkout modal and handle payment events."))

story.append(SH("Backend Technology Stack:"))
story.append(B("<b>FastAPI (Python):</b> RESTful API framework. Phase II added 25+ new endpoints across donation, analytics, dispatch, chatbot, OAuth, and user pet listing routers."))
story.append(B("<b>Uvicorn (ASGI):</b> Production-grade async server for FastAPI."))
story.append(B("<b>SQLAlchemy ORM + SQLite:</b> Unchanged from Phase I. New Phase II tables (donations, user_pet_listings) and column migrations applied at startup."))
story.append(B("<b>python-jose + passlib + bcrypt:</b> JWT-based authentication and password hashing (Phase I, continued)."))
story.append(B("<b>Razorpay Python SDK:</b> Used for server-side order creation and HMAC-SHA256 webhook signature verification."))
story.append(B("<b>google-auth:</b> Verifies Google OAuth2 ID tokens server-side against the GOOGLE_CLIENT_ID."))
story.append(B("<b>Groq Python SDK:</b> Sends conversation history to the Llama 3.3 70B model via Groq's hosted inference API."))
story.append(B("<b>python-dotenv:</b> Loads all API keys and secrets from .env file at application startup."))

story.append(SEC("6.2 Development Methodology — Phase II"))
story.append(P("Phase II follows the same Agile, iterative approach as Phase I, with work organized into two-week sprints for each major feature set:"))
story.append(B("<b>Sprint 1 — Razorpay Donation Gateway:</b> Backend order creation, webhook handling, idempotent status tracking; Frontend DonatePage with NGO listing, Razorpay checkout integration, UPI fallback."))
story.append(B("<b>Sprint 2 — Google OAuth 2.0 & Groq AI Chatbot:</b> Backend /auth/google endpoint with google-auth token verification; Updated chatbot backend with Groq API call and fallback; Frontend Google Sign-In button in Login page."))
story.append(B("<b>Sprint 3 — Analytics Dashboards:</b> All NGO analytics endpoints (monthwise/yearwise cases, species, adoptions, donations); All Admin analytics endpoints; Donor public dashboard APIs; Frontend dashboards with Recharts."))
story.append(B("<b>Sprint 4 — Geospatial Intelligence:</b> K-Means clustering algorithm in algorithms.py; Haversine dispatch ranking algorithm; Backend /admin/hotspots and /admin/smart-dispatch/{case_id} endpoints; Frontend HotspotMap.jsx with Leaflet.js; Frontend SmartDispatch.jsx with ranking table."))
story.append(B("<b>Sprint 5 — User Pet Listings & NGO Feedback Response:</b> Backend user_pet_listing model, CRUD, and endpoints; NGO listing approval/rejection endpoint; Backend /feedback/{id}/respond endpoint; Frontend UserPetListingForm, NGOPetListings, updated NGOFeedback with reply modal."))
story.append(B("<b>Sprint 6 — Integration, Testing & Documentation:</b> End-to-end integration testing across all Phase II features; Sandbox payment testing; Cross-browser and responsive UI testing; Project report writing."))

story.append(SEC("6.3 Results — Phase II Module Screenshots"))

story.append(SSEC("6.3.1 Donation Module"))

story.append(SH("Figure 9.1 — Animal Verification Case Update Page"))
story.append(P("Figure 9.1 shows the Case Update Page used by NGO workers to post real-time progress updates on accepted rescue cases. The left panel displays the reported animal's photo, case ID, current status badge (Accepted / Resolved), and the original citizen description. The right panel contains the 'Add Update' modal — a form where the NGO enters progress notes and optionally attaches a new photo of the animal. Before the update photo is accepted, the backend calls the Google Gemini Vision API (gemini-1.5-flash) via verification_utils.py to confirm the uploaded image contains a real animal; non-animal images are rejected with an error. Approved updates appear in the chronological Update Timeline, showing the timestamp, progress notes, and the Gemini-verified photo for each milestone in the rescue journey."))
story.append(SP(6))
story.append(IMG_PLACEHOLDER(
    "Figure 9.1: Animal Verification Case Update Page — Case Detail (Photo, Status, Description) +\n"
    "Add Update Modal (Notes + Photo) + Gemini AI Animal Verification + Update Timeline",
    height=5.5*cm
))
story.append(CAP("Figure 9.1: Case Update Page showing the NGO update form with Google Gemini AI animal photo verification and the rescue milestone timeline"))
story.append(SP(10))

story.append(SH("Figure 9.2 — Donor Transparency Dashboard"))
story.append(P("Figure 9.2 shows the public Donor Transparency Dashboard, accessible without authentication. It displays a month-wise donation bar chart, total donation amount raised, total cases supported (all statuses), and total pet adoptions facilitated. This dashboard builds public trust and encourages repeat donations by demonstrating measurable animal welfare impact."))
story.append(SP(6))
story.append(IMG_PLACEHOLDER(
    "Figure 9.2: Donor Transparency Dashboard — Month-wise Donation Bar Chart, Impact KPI Cards",
    height=5.5*cm
))
story.append(CAP("Figure 9.2: Public Donor Transparency Dashboard showing aggregated donation impact and month-wise Recharts bar chart"))
story.append(SP(10))

story.append(SH("Figure 9.3 — Donor KYC Verification Page"))
story.append(P("Figure 9.3 shows the Donor Verification Page, which guides authenticated citizens through a two-step OTP-based verification process: email verification (OTP generated server-side) and phone number verification. Upon successful completion, the user's donor_verified status is updated, enabling higher donation thresholds and priority donor status."))
story.append(SP(6))
story.append(IMG_PLACEHOLDER(
    "Figure 9.3: Donor KYC Verification — Two-Step OTP Flow (Email + Phone Verification)",
    height=5*cm
))
story.append(CAP("Figure 9.3: Donor KYC Verification Page — Step-by-step OTP verification for email and phone"))
story.append(SP(10))

story.append(SSEC("6.3.2 Analytics Dashboards"))

story.append(SH("Figure 9.4 — NGO Analytics Dashboard"))
story.append(P("Figure 9.4 shows the NGO Analytics Dashboard, which provides the NGO with a comprehensive visual overview of their operations. Four key charts are displayed: a line chart of monthly case trends (current year), a bar chart of accepted cases by year, a pie chart of cases by animal species detected via TensorFlow.js, and a bar chart of monthly donations received. Each chart uses a consistent color scheme aligned with the StrayCare brand palette."))
story.append(SP(6))
story.append(IMG_PLACEHOLDER(
    "Figure 9.4: NGO Analytics Dashboard — Monthly Case Trend (Line), Species Distribution (Pie),\n"
    "Yearly Cases (Bar), Monthly Donations (Bar) — Powered by Recharts",
    height=6*cm
))
story.append(CAP("Figure 9.4: NGO Analytics Dashboard showing case trends, species distribution, adoptions, and donation charts"))
story.append(SP(10))

story.append(SH("Figure 9.5 — Admin Analytics Dashboard"))
story.append(P("Figure 9.5 shows the Admin Analytics Dashboard, giving administrators a platform-wide operational view. It displays total cases by status (Pending, Accepted, Rejected, Resolved) in a bar chart, total donations amount over time in an area chart, and platform-wide adoption counts in a pie chart. Summary KPI cards at the top display key totals at a glance."))
story.append(SP(6))
story.append(IMG_PLACEHOLDER(
    "Figure 9.5: Admin Analytics Dashboard — Platform-wide KPI Cards, Cases by Status (Bar),\n"
    "Donation Trends (Area Chart), Adoption Statistics (Pie Chart)",
    height=6*cm
))
story.append(CAP("Figure 9.5: Admin Analytics Dashboard — Platform-wide case, donation, and adoption statistics"))
story.append(SP(10))

story.append(SSEC("6.3.3 Geospatial Intelligence"))

story.append(SH("Figure 9.6 — Zone Red Hotspot Map"))
story.append(P("Figure 9.6 shows the interactive Zone Red Hotspot Map, rendered using Leaflet.js on an OpenStreetMap base layer. Color-coded semi-transparent circles represent K-Means cluster centroids: red circles (Critical Zones, ≥10 cases, 800m radius) appear in areas with the highest emergency density; orange circles (High Zones, ≥5 cases, 500m radius), yellow (Moderate, ≥2, 300m radius), and green (Low, 1 case, 150m radius). Clicking a circle displays the cluster's case count and risk level in a popup."))
story.append(SP(6))
story.append(IMG_PLACEHOLDER(
    "Figure 9.6: Zone Red Hotspot Map — Leaflet.js + OpenStreetMap with K-Means Cluster Overlays\n"
    "(Red = Critical ≥10 cases | Orange = High ≥5 | Yellow = Moderate ≥2 | Green = Low 1 case)",
    height=6*cm
))
story.append(CAP("Figure 9.6: Zone Red Hotspot Map — K-Means cluster risk zones rendered on Leaflet.js/OpenStreetMap"))
story.append(SP(10))

story.append(SH("Figure 9.7 — Smart NGO Dispatch Interface"))
story.append(P("Figure 9.7 shows the Smart NGO Dispatch Interface. On the left, the selected case details (GPS coordinates, description, severity badge) are displayed. On the right, the ranked NGO recommendation table shows each NGO's name, computed distance (km), active case count, proximity score, caseload score, and total dispatch score. The highest-ranked NGO is highlighted and a single \"Assign\" button dispatches the case to that organization."))
story.append(SP(6))
story.append(IMG_PLACEHOLDER(
    "Figure 9.7: Smart NGO Dispatch Interface — Case Detail Panel + Ranked NGO Table\n"
    "(Haversine Distance | Active Caseload Score | Total Dispatch Score | Assign Button)",
    height=5.5*cm
))
story.append(CAP("Figure 9.7: Smart NGO Dispatch Interface showing ranked NGO list with Haversine distance and weighted dispatch scores"))
story.append(SP(10))

story.append(SSEC("6.3.4 AI Chatbot"))

story.append(SH("Figure 9.8 — Groq AI-Powered Chatbot Interface"))
story.append(P("Figure 9.8 shows the upgraded AI Chatbot interface. The chat panel displays a conversation history with alternating citizen and AI response bubbles. The chatbot leverages Groq Llama 3.3 70B to provide detailed, multi-turn first-aid guidance — for example, advising a citizen on how to safely transport an injured dog with a suspected spinal injury, referencing the previous turns in the conversation for context. The AI badge in the header indicates the active model and includes a fallback indicator when operating in offline mode."))
story.append(SP(6))
story.append(IMG_PLACEHOLDER(
    "Figure 9.8: Groq AI Chatbot Interface — Multi-turn Conversation with Llama 3.3 70B\n"
    "(System Prompt | Conversation History | AI/Fallback Mode Indicator)",
    height=5.5*cm
))
story.append(CAP("Figure 9.8: Groq AI-Powered Chatbot — Multi-turn animal first-aid conversation interface"))
story.append(SP(10))

story.append(SSEC("6.3.5 Citizen Pet Listing"))

story.append(SH("Figure 9.9 — Citizen Pet Listing Form"))
story.append(P("Figure 9.9 shows the Citizen Pet Listing Form, allowing citizens to submit a pet for community re-homing. Fields include pet name, species, age, location, and a description, along with a photo upload. Upon submission, the listing enters a 'Pending NGO Review' state. Once an NGO approves the listing, the pet appears in the public adoption gallery alongside NGO-listed pets."))
story.append(SP(6))
story.append(IMG_PLACEHOLDER(
    "Figure 9.9: Citizen Pet Listing Form — Name, Species, Age, Location, Description & Photo Upload\n"
    "(Submission → Pending NGO Review → Approved → Public Adoption Gallery)",
    height=5.5*cm
))
story.append(CAP("Figure 9.9: Citizen Pet Listing Form — Community-driven pet rehoming with NGO approval workflow"))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
#  CHAPTER 10: CONCLUSION
# ══════════════════════════════════════════════════════════════════════════════
story.append(CH("Chapter 7: Conclusion"))
story.append(HR())
story.append(P("StrayCare Phase II represents a transformative evolution from a working prototype into a comprehensive, production-ready civic technology platform for animal welfare. By systematically addressing the gaps identified after Phase I — lack of financial infrastructure, limited AI intelligence, absence of analytics, no geospatial tooling — Phase II has delivered a fully integrated ecosystem that serves citizens, NGOs, administrators, and donors with purpose-built, role-specific tools."))
story.append(SP(6))
story.append(P("The integration of the Razorpay payment gateway establishes a trustworthy, verifiable donation channel that creates a direct financial lifeline between compassionate donors and frontline rescue organizations. The Groq LLM chatbot transforms the platform's conversational capability from simple keyword responses into nuanced, contextually aware veterinary guidance that can meaningfully support citizens in the critical pre-rescue window. Google OAuth 2.0 eliminates authentication friction, making it easier for more citizens to engage with the platform."))
story.append(SP(6))
story.append(P("The three analytics dashboards — NGO, Admin, and Donor — transition StrayCare from an operational tool into a data intelligence platform. By visualizing case trends, geographic hotspots, donor impact, and NGO performance, these dashboards enable evidence-based resource allocation and operational planning that was previously impossible. The Zone Red Hotspot Map and Smart NGO Dispatch system embody the platform's mission to apply data science directly to the urgent problem of animal rescue logistics."))
story.append(SP(6))
story.append(P("The citizen pet listing feature broadens the adoption ecosystem beyond NGO-managed animals, enabling community members to directly participate in responsible pet rehoming under NGO oversight. NGO feedback responses complete the accountability loop that Phase I began, creating a transparent review ecosystem that rewards high-performing organizations."))
story.append(SP(6))
story.append(P("From an engineering perspective, Phase II demonstrates best practices in API-first development, safe database migration, graceful degradation (LLM fallback, UPI deep-link fallback), idempotent webhook processing, and privacy-preserving in-browser AI inference. The codebase remains modular, maintainable, and extensible — ready for the future enhancements outlined in the ML chapter, including transformer-based NLP triaging and predictive hotspot forecasting."))
story.append(SP(6))
story.append(P("Ultimately, StrayCare Phase II is a testament to how thoughtful full-stack software engineering, combined with modern AI and financial APIs, can address real-world civic challenges at scale — transforming community empathy into measurable, verifiable animal welfare impact."))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
#  CHAPTER 11: REFERENCES
# ══════════════════════════════════════════════════════════════════════════════
story.append(CH("Chapter 8: References"))
story.append(HR())

refs = [
    "R. Kolandaisamy, K. Subramaniam, I. Kolandaisamy, and L. S. Li, \"Stray Animal Mobile App,\" UCSI University, Kuala Lumpur, Malaysia, 2016.",
    "A. Abdulkarim, M. A. K. B. G. Khan, and E. Aklilu, \"Stray Animal Population Control: Methods, Public Health Concern, Ethics, and Animal Welfare Issues,\" World Veterinary Journal, vol. 11, no. 3, pp. 319–326, 2021.",
    "L. L. A. Walter, \"StandForPaw: Animal Rescue and Pet Adoption Mobile Application,\" Universiti Teknologi PETRONAS, Malaysia, 2021.",
    "C. L. Yi and C. S. C. Dalim, \"Development of Mobile Application for Animal Conservation: Animal Rescue,\" Applied Information Technology and Computer Science, vol. 4, no. 2, pp. 430–449, 2023.",
    "Y. H. Jean and N. Wahid, \"FurRescue: A Mobile Application for Pet and Stray Animal Locator with Geo-Fencing and AI Breed Detection,\" Applied Information Technology and Computer Science, vol. 6, no. 1, pp. 1–20, 2025.",
    "Wu et al., 2022 — \"Widespread of Stray Animals: Design a Technological Solution to Help Build a Rescue System for Stray Animals.\"",
    "Neha Jha et al., 2024 — \"Using Machine Learning and AI to Find Homes for the Voiceless.\"",
    "Sengan et al., 2021 — \"Real-Time Automatic Investigation of Indian Roadway Animals by 3D Reconstruction Detection Using Deep Learning for R-3D-YOLOv3.\"",
    "Rahajeng et al., 2024 — \"Mobile Application to Help Abandoned Pets.\"",
    "Blancaflor et al., 2023 — \"CareForPaws: A Mobile Application for Pet Adoption and Other Services with Location-Based Technology.\"",
    "Bricman & Kozuh, 2024 — \"User Experience and Interface Design for a Digital Pet Adoption Platform (PetScout).\"",
    "Jay Prajapati et al., 2025 — \"Pet Adoption and Rescue Center.\"",
    "Mahak Rajwani et al., 2025 — \"Enhancing Animal Rescue Efficiency Using AI for Real-Time Reporting and Assistance.\"",
    "Honglin Lu, 2025 — \"Pet Adoption Status Prediction Based on Multiple Machine Learning Models.\"",
    "Kalaivani A/P Subramaniam & Hazinah Kutty Mammi, 2025 — \"Stray Rescue Management System (SRMS).\"",
    "Torres et al., 2024 — \"A Web-Based Animal Adoption and Rescue System that uses Content-Based Filtering Algorithm.\"",
    "Jukan, Masip-Bruin & Amla, 2016 — \"Smart Computing and Sensing Technologies for Animal Welfare: A Systematic Review.\"",
    "FastAPI Documentation: https://fastapi.tiangolo.com/",
    "TensorFlow.js Models & MobileNet: https://www.tensorflow.org/js",
    "Razorpay API Documentation: https://razorpay.com/docs/",
    "Groq API Documentation & Llama 3.3 70B: https://console.groq.com/docs/",
    "Google Identity Services (OAuth 2.0): https://developers.google.com/identity",
    "Leaflet.js Interactive Map Library: https://leafletjs.com/",
    "Recharts — Redefined chart library built with React and D3: https://recharts.org/",
    "OpenStreetMap Tile Server: https://www.openstreetmap.org/",
]

for i, ref in enumerate(refs, 1):
    story.append(Paragraph(f"{i}.  {ref}", ParagraphStyle(
        "Ref", parent=body_style,
        fontSize=10, leading=14, spaceAfter=5, spaceBefore=1, leftIndent=20, firstLineIndent=-20
    )))
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════════
#  CHAPTER 12: PROJECT PLAN — PHASE II
# ══════════════════════════════════════════════════════════════════════════════
story.append(CH("Chapter 9: Project Plan — Phase II"))
story.append(HR())
story.append(SP(4))
plan_data = [
    ["Week", "Activity Planned / Module(s) Covered", "Status"],
    ["Week 1", "Phase II Requirements Analysis — Identify Phase I gaps; define Phase II scope: Razorpay donations, Google OAuth, Groq chatbot, analytics dashboards, geospatial tools.", "Completed"],
    ["Week 2", "Database Schema Design (Phase II) — Design Donation and UserPetListing models; plan column migrations for cases, pets, ngos, and feedback tables.", "Completed"],
    ["Week 3", "Razorpay Backend Integration — Implement POST /donations/create-order, POST /donations/webhook; integrate Razorpay SDK with HMAC signature verification; test with sandbox.", "Completed"],
    ["Week 4", "Razorpay Frontend Integration — Build DonatePage.jsx with NGO listing, amount input, Razorpay Checkout SDK, UPI deep-link fallback, and donation confirmation UI.", "Completed"],
    ["Week 5", "Google OAuth 2.0 & Groq AI Chatbot — Backend: /auth/google endpoint; frontend: Google Sign-In button. Backend: Groq API integration in chatbot_logic.py with fallback; frontend: update Chatbot.js.", "Completed"],
    ["Week 6", "Donor Verification & Public Donor Dashboard — Implement OTP-based email/phone verification endpoints. Build DonorVerification.jsx and DonorDashboard.jsx with Recharts.", "Completed"],
    ["Week 7", "NGO Analytics Dashboard — Implement all /ngo/dashboard/* endpoints (monthwise cases, yearwise cases, species, adoptions, donations). Build NGOAnalyticsDashboard.jsx with line/bar/pie charts.", "Completed"],
    ["Week 8", "Admin Analytics Dashboard — Implement all /admin/dashboard/* endpoints. Build AdminAnalyticsDashboard.jsx with platform-wide KPIs and interactive charts.", "Completed"],
    ["Week 9", "K-Means Hotspot Algorithm & Map — Implement cluster_case_hotspots() in algorithms.py. Add GET /admin/hotspots endpoint. Build HotspotMap.jsx with Leaflet.js and risk circle overlays.", "Completed"],
    ["Week 10", "Smart NGO Dispatch Algorithm & UI — Implement haversine_distance() and rank_ngos_for_case() in algorithms.py. Add GET /admin/smart-dispatch/{case_id} endpoint. Build SmartDispatch.jsx with ranked NGO table.", "Completed"],
    ["Week 11", "Citizen Pet Listings & NGO Feedback Response — Implement UserPetListing model, CRUD, and endpoints. Build UserPetListingForm.jsx and NGOPetListings.jsx. Add PUT /feedback/{id}/respond endpoint; update NGOFeedback.jsx with reply modal.", "Completed"],
    ["Week 12", "Integration & Regression Testing — End-to-end testing of all Phase II workflows; Razorpay sandbox testing; Groq chatbot quality evaluation; cross-browser and responsive UI validation; RBAC regression tests.", "Completed"],
    ["Week 13", "Final Documentation — Write complete Phase II project report; prepare Phase II presentation; record application demo video.", "Completed"],
]
t_plan = make_table(plan_data, [1.8*cm, 9.2*cm, 3.0*cm])
story.append(t_plan)
story.append(CAP("Table 12.1: StrayCare Phase II Project Plan and Completion Status"))

# ─── Build PDF ────────────────────────────────────────────────────────────────
output_path = r"C:\Users\Hariom\SC\ProjectReportPhase2_v2.pdf"

doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=LEFT_MARGIN,
    rightMargin=RIGHT_MARGIN,
    topMargin=TOP_MARGIN + 0.5 * cm,
    bottomMargin=BOTTOM_MARGIN,
)

doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
print(f"PDF successfully generated at: {output_path}")
print(f"Total pages: {page_counter[0]}")
