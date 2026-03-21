from fastapi import APIRouter, Depends
from datetime import datetime
import uuid
from db import db
from services.dependencies import get_current_user

router = APIRouter(prefix="/emergency", tags=["Emergency"])


@router.post("/trigger")
async def trigger_emergency(current_user=Depends(get_current_user)):
    """
    Records an emergency event, reads user's GPS + emergency contacts,
    and attempts to notify contacts via Twilio (gracefully skips if
    Twilio is not configured).
    """

    user = await db.users.find_one(
        {"id": current_user["id"]},
        {"_id": 0, "password_hash": 0}
    )

    location = user.get("last_location", {})
    contacts = user.get("emergency_contacts", [])
    maps_url = location.get("maps_url", "Location unavailable")
    now = datetime.utcnow().isoformat()

    # Record the emergency event
    event = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user.get("name", "Patient"),
        "user_phone": user.get("phone"),
        "location": location,
        "contacts_notified": [],
        "timestamp": now,
    }

    # Try to notify each emergency contact via SMS
    sms_results = []
    for contact in contacts:
        phone = contact.get("phone")
        name = contact.get("name", "Contact")
        if not phone:
            continue

        message = (
            f"🚨 SMARTCARE EMERGENCY ALERT\n\n"
            f"Patient {user.get('name', 'Unknown')} has triggered an emergency.\n\n"
            f"📍 Location: {maps_url}\n"
            f"📞 Patient phone: {user.get('phone', 'N/A')}\n"
            f"⏰ Time: {now}"
        )

        sent = False
        try:
            from services.twilio_service import send_sms
            send_sms(phone, message)
            sent = True
        except Exception as e:
            print(f"[Emergency] SMS to {name} ({phone}) failed: {e}")

        sms_results.append({
            "name": name,
            "phone": phone,
            "sms_sent": sent,
        })

    event["contacts_notified"] = sms_results
    await db.emergencies.insert_one(event)

    return {
        "status": "emergency_triggered",
        "event_id": event["id"],
        "timestamp": now,
        "location": location if location else None,
        "contacts_notified": sms_results,
        "total_contacts": len(contacts),
        "message": (
            "Emergency protocol activated. "
            f"{len(sms_results)} contact(s) were processed."
        ),
    }
