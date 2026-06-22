"""
email_utils.py — StrayCare Email Notification System
Uses Gmail SMTP with TLS (port 587) via environment variables.
All sends are fire-and-forget using FastAPI BackgroundTasks.
"""

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

# ── Config from environment ────────────────────────────────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")

# Email enabled only if all 4 vars are set
EMAIL_ENABLED = all([SMTP_HOST, SMTP_USER, SMTP_PASS])

if EMAIL_ENABLED:
    print(f"[Email] ✅ SMTP configured: {SMTP_USER} via {SMTP_HOST}:{SMTP_PORT}")
else:
    print("[Email] ⚠️  SMTP not configured — emails will be skipped. Set SMTP_HOST, SMTP_USER, SMTP_PASS.")


# ── Core send function ─────────────────────────────────────────────────────────
def send_email(to: str, subject: str, html_body: str) -> bool:
    """Send a single HTML email. Returns True on success, False on failure."""
    if not EMAIL_ENABLED:
        logger.info(f"[Email] Skipped (SMTP not configured): {subject} → {to}")
        return False
    if not to or "@" not in to:
        logger.warning(f"[Email] Invalid recipient address: {to!r}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"StrayCare 🐾 <{SMTP_USER}>"
        msg["To"]      = to
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, [to], msg.as_string())

        logger.info(f"[Email] ✅ Sent: {subject!r} → {to}")
        return True

    except smtplib.SMTPAuthenticationError:
        logger.error("[Email] ❌ Authentication failed — check SMTP_USER and SMTP_PASS (use App Password for Gmail)")
    except smtplib.SMTPException as e:
        logger.error(f"[Email] ❌ SMTP error: {e}")
    except Exception as e:
        logger.error(f"[Email] ❌ Unexpected error: {e}")
    return False


# ── HTML Email Templates ───────────────────────────────────────────────────────

def _base_template(title: str, content: str) -> str:
    """Shared branded HTML wrapper for all emails."""
    return f"""
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8">
    <style>
      body {{ font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }}
      .container {{ max-width: 600px; margin: 30px auto; background: #fff;
                    border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }}
      .header {{ background: linear-gradient(135deg, #6366F1, #8B5CF6);
                 padding: 28px 32px; text-align: center; }}
      .header h1 {{ color: #fff; margin: 0; font-size: 22px; }}
      .header p {{ color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px; }}
      .body {{ padding: 28px 32px; color: #333; line-height: 1.6; }}
      .body h2 {{ color: #1A1A2E; margin-top: 0; }}
      .badge {{ display: inline-block; padding: 6px 14px; border-radius: 20px;
                font-weight: bold; font-size: 13px; margin: 8px 0; }}
      .badge-green  {{ background: #D1FAE5; color: #065F46; }}
      .badge-red    {{ background: #FEE2E2; color: #991B1B; }}
      .badge-blue   {{ background: #DBEAFE; color: #1E40AF; }}
      .badge-orange {{ background: #FEF3C7; color: #92400E; }}
      .cta {{ display: block; width: fit-content; margin: 20px auto;
              background: #6366F1; color: #fff !important; padding: 12px 28px;
              border-radius: 8px; text-decoration: none; font-weight: bold; }}
      .footer {{ background: #F9FAFB; padding: 16px 32px; text-align: center;
                 font-size: 11px; color: #9CA3AF; }}
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🐾 StrayCare</h1>
          <p>Helping strays, one step at a time</p>
        </div>
        <div class="body">
          <h2>{title}</h2>
          {content}
        </div>
        <div class="footer">
          You received this email because you have an account on StrayCare.<br>
          © 2024 StrayCare. All rights reserved.
        </div>
      </div>
    </body></html>
    """


# ── 1. Welcome Email (on registration) ────────────────────────────────────────
def send_welcome_email(to: str, name: str):
    content = f"""
    <p>Hi <strong>{name}</strong>! 👋</p>
    <p>Welcome to <strong>StrayCare</strong> — your community platform for helping stray animals.</p>
    <p>Here's what you can do:</p>
    <ul>
      <li>📸 <strong>Report</strong> injured or stray animals near you</li>
      <li>🏠 <strong>Adopt</strong> rescued pets from verified NGOs</li>
      <li>💙 <strong>Donate</strong> to support rescue operations</li>
      <li>🛒 <strong>Shop</strong> pet care products</li>
    </ul>
    <p>Thank you for being part of the solution!</p>
    """
    send_email(to, "Welcome to StrayCare! 🐾", _base_template("Welcome aboard!", content))


# ── 2. Case Submitted Confirmation ────────────────────────────────────────────
def send_case_submitted_email(to: str, name: str, case_id: int, description: str):
    content = f"""
    <p>Hi <strong>{name}</strong>,</p>
    <p>Your stray animal report has been successfully submitted.</p>
    <table style="width:100%; border-collapse:collapse; margin:16px 0;">
      <tr><td style="padding:8px; color:#666;">Case ID</td>
          <td style="padding:8px; font-weight:bold;">#{case_id}</td></tr>
      <tr style="background:#f9f9f9;"><td style="padding:8px; color:#666;">Description</td>
          <td style="padding:8px;">{description[:120]}{"..." if len(description) > 120 else ""}</td></tr>
      <tr><td style="padding:8px; color:#666;">Status</td>
          <td style="padding:8px;"><span class="badge badge-orange">Pending Review</span></td></tr>
    </table>
    <p>An NGO in your area will review and respond to your case shortly.</p>
    <p>You can track your case status anytime in the <strong>My Cases</strong> section of the app.</p>
    """
    send_email(to, f"Case #{case_id} Submitted — StrayCare", _base_template("Case Reported Successfully ✅", content))


# ── 3. Case Accepted by NGO ───────────────────────────────────────────────────
def send_case_accepted_email(to: str, name: str, case_id: int, ngo_name: str):
    content = f"""
    <p>Hi <strong>{name}</strong>,</p>
    <p>Great news! Your reported case has been <strong>accepted</strong> by an NGO.</p>
    <table style="width:100%; border-collapse:collapse; margin:16px 0;">
      <tr><td style="padding:8px; color:#666;">Case ID</td>
          <td style="padding:8px; font-weight:bold;">#{case_id}</td></tr>
      <tr style="background:#f9f9f9;"><td style="padding:8px; color:#666;">Assigned NGO</td>
          <td style="padding:8px;">{ngo_name}</td></tr>
      <tr><td style="padding:8px; color:#666;">Status</td>
          <td style="padding:8px;"><span class="badge badge-blue">Accepted</span></td></tr>
    </table>
    <p>The NGO team will reach the location and provide care to the animal. 🙏</p>
    """
    send_email(to, f"Case #{case_id} Accepted by {ngo_name} — StrayCare", _base_template("Your Case Was Accepted! 🎉", content))


# ── 4. Adoption Request Approved ──────────────────────────────────────────────
def send_adoption_approved_email(to: str, name: str, pet_name: str, ngo_name: str):
    content = f"""
    <p>Hi <strong>{name}</strong>,</p>
    <p>Congratulations! 🎉 Your adoption application for <strong>{pet_name}</strong> has been <strong>approved</strong>.</p>
    <p><span class="badge badge-green">✅ Approved</span></p>
    <p>The NGO <strong>{ngo_name}</strong> will contact you shortly to arrange the handover.</p>
    <p>Please keep an eye on your phone for their call. Make sure your contact information in the app is up to date.</p>
    <p>Thank you for giving {pet_name} a loving home! 🐾❤️</p>
    """
    send_email(to, f"Adoption Approved — {pet_name} is yours! 🐾", _base_template(f"Adoption Approved! 🎉", content))


# ── 5. Adoption Request Rejected ──────────────────────────────────────────────
def send_adoption_rejected_email(to: str, name: str, pet_name: str, ngo_name: str):
    content = f"""
    <p>Hi <strong>{name}</strong>,</p>
    <p>We're sorry to inform you that your adoption application for <strong>{pet_name}</strong> was not approved at this time.</p>
    <p><span class="badge badge-red">❌ Not Approved</span></p>
    <p>This could be due to capacity constraints or a better match being found for {pet_name}.</p>
    <p>Don't be discouraged — there are many animals waiting for a loving home. 
       Browse other available pets in the <strong>Adopt</strong> section of the app.</p>
    <p>Thank you for your compassion, <strong>{name}</strong>. Every application helps! 🙏</p>
    """
    send_email(to, f"Adoption Application Update — {pet_name}", _base_template("Adoption Application Update", content))


# ── 6. Donation Receipt ───────────────────────────────────────────────────────
def send_donation_receipt_email(to: str, name: str, amount: float, payment_id: str, ngo_name: str = "StrayCare"):
    content = f"""
    <p>Hi <strong>{name}</strong>,</p>
    <p>Thank you for your generous donation! Your contribution directly supports animal rescue operations.</p>
    <table style="width:100%; border-collapse:collapse; margin:16px 0;">
      <tr><td style="padding:8px; color:#666;">Payment ID</td>
          <td style="padding:8px; font-family:monospace;">{payment_id}</td></tr>
      <tr style="background:#f9f9f9;"><td style="padding:8px; color:#666;">Amount</td>
          <td style="padding:8px; font-weight:bold; font-size:18px;">₹{amount:.2f}</td></tr>
      <tr><td style="padding:8px; color:#666;">Donated To</td>
          <td style="padding:8px;">{ngo_name}</td></tr>
      <tr style="background:#f9f9f9;"><td style="padding:8px; color:#666;">Status</td>
          <td style="padding:8px;"><span class="badge badge-green">✅ Confirmed</span></td></tr>
    </table>
    <p>Please save this email as your donation receipt. 💙</p>
    <p>Together we can make a difference for every stray animal! 🐾</p>
    """
    send_email(to, f"Donation Receipt — ₹{amount:.2f} — StrayCare", _base_template("Donation Received! 💙", content))


# ── 7. NGO Registration Confirmation ─────────────────────────────────────────
def send_ngo_registration_email(to: str, ngo_name: str):
    content = f"""
    <p>Hi <strong>{ngo_name}</strong>,</p>
    <p>Your NGO has been successfully registered on StrayCare!</p>
    <p>Your account is currently under review by our admin team. 
       You will be notified once your account is verified and activated.</p>
    <p><strong>What happens next?</strong></p>
    <ul>
      <li>Admin reviews your registration (usually within 24–48 hours)</li>
      <li>You'll receive an email once your account is activated</li>
      <li>After activation, you can start accepting rescue cases</li>
    </ul>
    <p>Thank you for joining StrayCare's mission! 🙏</p>
    """
    send_email(to, "NGO Registration Received — StrayCare", _base_template("Registration Received! ✅", content))
