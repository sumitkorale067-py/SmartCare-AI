from fastapi import APIRouter, Request
from datetime import datetime, timedelta
import os

router = APIRouter(prefix="/twilio", tags=["Twilio"])

# ---------------- LAZY CONNECTIONS ----------------
_db_sync = None



def _get_db_sync():
    global _db_sync
    if _db_sync is None:
        from pymongo import MongoClient
        MONGO_URL = os.getenv("MONGO_URL", "mongodb://127.0.0.1:27017")
        mongo = MongoClient(MONGO_URL)
        _db_sync = mongo[os.getenv("DB_NAME", "smartcare")]
    return _db_sync


from fastapi import BackgroundTasks

# ---------------- CALL STATUS WEBHOOK ----------------
@router.post("/call-status/{reminder_id}")
async def call_status(reminder_id: str, request: Request, background_tasks: BackgroundTasks):

    form = await request.form()
    call_status = form.get("CallStatus", "").lower()

    db_sync = _get_db_sync()
    reminder = db_sync.reminders.find_one({"id": reminder_id})

    if not reminder:
        return {"status": "invalid reminder"}

    # ---------------- ANSWERED ----------------
    if call_status == "completed":
        db_sync.reminders.update_one(
            {"id": reminder_id},
            {"$set": {"status": "taken"}}
        )
        return {"status": "user confirmed"}

    # ---------------- NOT ANSWERED ----------------
    if call_status in ["no-answer", "busy", "failed", "canceled"]:
        db_sync.reminders.update_one(
            {"id": reminder_id},
            {"$set": {"status": "missed"}}
        )

        # Count last 24h missed (UUID-based)
        since = datetime.utcnow() - timedelta(hours=24)

        missed_count = db_sync.reminders.count_documents({
            "user_id": reminder["user_id"],  # UUID
            "status": "missed",
            "created_at": {"$gte": since.isoformat()}
        })

        if missed_count >= 3:
            background_tasks.add_task(
                send_emergency_alert,
                reminder["user_id"]
            )

    return {"status": "processed"}


# ---------------- EMERGENCY ALERT ----------------
def send_emergency_alert(user_id: str):
    from services.twilio_service import send_sms

    user = _get_db_sync().users.find_one({"id": user_id})  # UUID lookup

    if not user:
        return

    location = user.get("last_location", {})
    maps_url = location.get("maps_url", "Location unavailable")

    message = (
        f"🚨 MEDICAL ALERT\n\n"
        f"{user.get('name', 'User')} has missed multiple medications.\n\n"
        f"Last Known Location:\n{maps_url}\n\n"
        f"Immediate attention required."
    )

    for contact in user.get("emergency_contacts", []):
        phone = contact.get("phone")
        if phone:
            send_sms(str(phone), message)