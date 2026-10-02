from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from pydantic import BaseModel
import uuid
import asyncio
from db import db
from services.dependencies import get_current_user

router = APIRouter(prefix="/reminders", tags=["Reminders"])


# ---------------- MODELS ----------------

class ReminderCreate(BaseModel):
    medication_name: str
    scheduled_time: str


# ---------------- CREATE REMINDER (Manual) ----------------

@router.post("/")
async def create_reminder(
    data: ReminderCreate,
    current_user=Depends(get_current_user)
):

    scheduled_key = data.scheduled_time[:16]

    # Prevent duplicate manual reminder
    existing = await db.reminders.find_one({
        "user_id": current_user["id"],
        "scheduled_key": scheduled_key,
    "medication_name":data.medication_name
    })

    if existing:
        raise HTTPException(status_code=400, detail="Reminder already exists")

    reminder = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "medication_name": data.medication_name,
        "scheduled_time": data.scheduled_time,
        "scheduled_key": scheduled_key,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    }

    await db.reminders.insert_one(reminder)

    # --- Send SMS notification ---
    phone = current_user.get("phone")
    if phone:
        from services.scheduler import send_sms_job, schedule_escalation
        asyncio.create_task(send_sms_job(
            phone,
            f"💊 Reminder: Take {data.medication_name} now."
        ))
        schedule_escalation(current_user["id"], data.medication_name, reminder["id"])

    return {"status": "reminder created"}


# ---------------- GET MY REMINDERS ----------------

@router.get("/")
async def get_my_reminders(current_user=Depends(get_current_user)):
    reminders = await db.reminders.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).to_list(1000)

    return reminders


# ---------------- MARK AS TAKEN ----------------

@router.put("/{reminder_id}/taken")
async def mark_taken(reminder_id: str, current_user=Depends(get_current_user)):

    reminder = await db.reminders.find_one({
        "id": reminder_id,
        "user_id": current_user["id"]
    })

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    if reminder["status"] == "taken":
        return {"status": "already taken"}

    # Update reminder status
    await db.reminders.update_one(
        {"id": reminder_id},
        {"$set": {"status": "taken"}}
    )

    # Deduct medication stock safely
    medication = await db.medications.find_one({
        "name": reminder["medication_name"],
        "user_id": current_user["id"]
    })

    if medication:
        remaining = medication.get("remaining_stock", 0)
        dosage = medication.get("dosage_per_intake", 1)

        new_stock = max(0, remaining - dosage)

        await db.medications.update_one(
            {"id": medication["id"]},
            {"$set": {"remaining_stock": new_stock}}
        )

    return {"status": "marked taken"}


# ---------------- MARK AS MISSED ----------------

@router.put("/{reminder_id}/missed")
async def mark_missed(reminder_id: str, current_user=Depends(get_current_user)):

    reminder = await db.reminders.find_one({
        "id": reminder_id,
        "user_id": current_user["id"]
    })

    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    await db.reminders.update_one(
        {"id": reminder_id},
        {"$set": {"status": "missed"}}
    )

    return {"status": "marked missed"}


# ---------------- DELETE REMINDER ----------------

@router.delete("/{reminder_id}")
async def delete_reminder(reminder_id: str, current_user=Depends(get_current_user)):

    result = await db.reminders.delete_one({
        "id": reminder_id,
        "user_id": current_user["id"]
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")

    return {"status": "reminder deleted"}