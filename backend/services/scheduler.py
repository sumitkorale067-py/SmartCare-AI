import uuid
import os
import asyncio
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from db import db

# -------------------------
# LAZY SYNC DB FOR BACKGROUND JOBS
# -------------------------

_sync_db = None

def _get_sync_db():
    global _sync_db
    if _sync_db is None:
        from pymongo import MongoClient
        mongo_sync = MongoClient(os.getenv("MONGO_URL", "mongodb://127.0.0.1:27017"))
        _sync_db = mongo_sync[os.getenv("DB_NAME", "smartcare")]
    return _sync_db

# -------------------------
# JOBS
# -------------------------

async def send_sms_job(phone: str, message: str):
    loop = asyncio.get_event_loop()
    from services.twilio_service import send_sms
    await loop.run_in_executor(None, send_sms, phone, message)


async def make_smart_call_job_delayed(user_id: str, med_name: str, reminder_id: str):
    await asyncio.sleep(10 * 60) # 10 mins 
    loop = asyncio.get_event_loop()
    from services.twilio_service import make_smart_medical_call

    user = _get_sync_db().users.find_one({"id": user_id})
    if not user or not user.get("phone"):
        return

    await loop.run_in_executor(
        None,
        make_smart_medical_call,
        user["phone"],
        user.get("name", "User"),
        med_name,
        reminder_id
    )


async def emergency_sms_job_delayed(user_id: str, med_name: str):
    await asyncio.sleep(12 * 60) # 12 mins
    loop = asyncio.get_event_loop()
    from services.twilio_service import send_sms

    user = _get_sync_db().users.find_one({"id": user_id})
    if not user:
        return

    location = user.get("last_location", {})
    maps_url = location.get("maps_url", "Location unavailable")

    message = (
        f"🚨 MEDICAL ALERT\n\n"
        f"{user.get('name','User')} missed {med_name}.\n\n"
        f"Location:\n{maps_url}"
    )

    for contact in user.get("emergency_contacts", []):
        if contact.get("phone"):
            await loop.run_in_executor(None, send_sms, contact["phone"], message)


def schedule_escalation(user_id: str, med_name: str, reminder_id: str):
    asyncio.create_task(make_smart_call_job_delayed(user_id, med_name, reminder_id))
    asyncio.create_task(emergency_sms_job_delayed(user_id, med_name))

# -------------------------
# SAFE TIMEZONE HANDLER
# -------------------------

def safe_now_for_user(user: dict) -> datetime:
    tz = user.get("timezone")

    if not tz or not isinstance(tz, str) or not tz.strip():
        tz = "UTC"

    try:
        return datetime.now(ZoneInfo(tz))
    except ZoneInfoNotFoundError:
        return datetime.now(ZoneInfo("UTC"))

# -------------------------
# MAIN SCHEDULER LOGIC
# -------------------------

async def check_medication_schedule():
    users = await db.users.find({}, {"_id": 0}).to_list(1000)

    for user in users:

        try:
            now = safe_now_for_user(user)
            current_date = now.date().isoformat()
            current_time = now.strftime("%H:%M")

            meds = await db.medications.find(
                {"user_id": user["id"]},
                {"_id": 0}
            ).to_list(1000)

            for med in meds:

                start_date = med.get("start_date")
                end_date = med.get("end_date")

                # Validate dates
                if not start_date:
                    continue

                if end_date:
                    if not (start_date <= current_date <= end_date):
                        continue
                else:
                    if current_date < start_date:
                        continue

                # Validate schedule time
                if current_time not in med.get("times", []):
                    continue

                scheduled_key = f"{current_date}T{current_time}"

                existing = await db.reminders.find_one({
                    "user_id": user["id"],
                    "scheduled_key": scheduled_key
                })

                if existing:
                    continue

                reminder_id = str(uuid.uuid4())

                reminder = {
                    "id": reminder_id,
                    "user_id": user["id"],
                    "medication_name": med["name"],
                    "scheduled_time": now.isoformat(),
                    "scheduled_key": scheduled_key,
                    "status": "pending",
                    "created_at": now.isoformat()
                }

                await db.reminders.insert_one(reminder)

                # Send SMS
                if user.get("phone"):
                    asyncio.create_task(send_sms_job(
                        user["phone"],
                        f"💊 Reminder: Take {med['name']} now."
                    ))

                # Write browser notification for frontend polling
                await db.notifications.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": user["id"],
                    "type": "reminder",
                    "title": "Medication Reminder",
                    "message": f"Time to take {med['name']}",
                    "reminder_id": reminder_id,
                    "acknowledged": False,
                    "created_at": now.isoformat()
                })

                schedule_escalation(user["id"], med["name"], reminder_id)

        except Exception as e:
            # NEVER crash scheduler because of one user
            print(f"[Scheduler Error] User {user.get('id')}: {e}")

# -------------------------
# LOOP
# -------------------------

async def scheduler_loop():
    while True:
        try:
            await check_medication_schedule()
        except Exception as e:
            print(f"[Scheduler Fatal Error]: {e}")

        await asyncio.sleep(60)

# -------------------------
# STARTER
# -------------------------

async def start_scheduler():
    asyncio.create_task(scheduler_loop())