"""
fcm_utils.py — StrayCare Firebase Cloud Messaging
Initializes the Firebase Admin SDK and provides a utility to send push notifications.
"""

import os
import logging
import firebase_admin
from firebase_admin import credentials, messaging

logger = logging.getLogger(__name__)

import json

# Initialize Firebase App
try:
    firebase_creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if firebase_creds_json:
        cred_dict = json.loads(firebase_creds_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        logger.info("[FCM] ✅ Firebase Admin SDK initialized successfully via Environment Variable.")
    else:
        logger.warning("[FCM] ⚠️  FIREBASE_CREDENTIALS_JSON env var not set. Push notifications disabled.")
except Exception as e:
    logger.error(f"[FCM] ❌ Error initializing Firebase Admin SDK: {e}")



def send_push_notification(token: str, title: str, body: str, data: dict = None) -> bool:
    """
    Sends a push notification to a specific device token.
    Returns True if successful, False otherwise.
    """
    if not token:
        logger.warning("[FCM] Skipped sending push notification: No token provided.")
        return False
        
    if not firebase_admin._apps:
        logger.warning("[FCM] Skipped sending push notification: Firebase Admin SDK not initialized.")
        return False

    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
        )
        response = messaging.send(message)
        logger.info(f"[FCM] ✅ Successfully sent message to {token[:10]}... Response: {response}")
        return True
    except Exception as e:
        logger.error(f"[FCM] ❌ Failed to send message to {token[:10]}... Error: {e}")
        return False
