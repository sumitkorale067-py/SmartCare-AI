import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# -------------------------
# LAZY TWILIO CLIENT
# -------------------------

_client = None
_twilio_phone = None
_public_url = None


def _get_client():
    """Initialize the Twilio client on first use, not at import time."""
    global _client, _twilio_phone, _public_url

    if _client is not None:
        return _client

    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    _twilio_phone = os.getenv("TWILIO_PHONE_NUMBER")
    _public_url = os.getenv("PUBLIC_URL")

    if not sid or not token:
        logger.warning("Twilio credentials missing — SMS/call features disabled")
        return None

    if not _public_url:
        logger.warning("PUBLIC_URL missing — voice callback features disabled")

    from twilio.rest import Client
    _client = Client(sid, token)
    return _client


def send_sms(to: str, message: str):
    client = _get_client()
    if not client:
        logger.warning(f"Twilio not configured — skipping SMS to {to}")
        return None

    msg = client.messages.create(
        body=message,
        from_=_twilio_phone,
        to=str(to)
    )
    print(f"SMS sent: {msg.sid}")
    return msg.sid


def make_smart_medical_call(
    phone: str,
    user_name: str,
    med_name: str,
    reminder_id: str
):
    client = _get_client()
    if not client:
        logger.warning(f"Twilio not configured — skipping call to {phone}")
        return None

    if not _public_url:
        logger.warning("PUBLIC_URL not set — cannot make voice call")
        return None

    call = client.calls.create(
        to=str(phone),
        from_=_twilio_phone,
        url=f"{_public_url}/api/voice/message?user_name={user_name}&med_name={med_name}",
        status_callback=f"{_public_url}/api/twilio/call-status/{reminder_id}",
        status_callback_event=["completed", "no-answer", "busy", "failed"],
        status_callback_method="POST"
    )
    print("Call triggered:", call.sid)
    return call.sid