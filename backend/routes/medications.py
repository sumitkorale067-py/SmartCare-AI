from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import uuid
from db import db
from schemas import MedicationCreate, MedicationUpdate, StockUpdate
from services.dependencies import get_current_user

router = APIRouter(prefix="/medications", tags=["Medications"])


# ---------------- ADD MEDICATION ----------------

@router.post("/")
async def add_medication(
    med: MedicationCreate,
    current_user=Depends(get_current_user)
):
    existing = await db.medications.find_one({
        "user_id": current_user["id"],
        "name": med.name
    })

    if existing:
        raise HTTPException(status_code=400, detail="Medication already exists")

    medication_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "name": med.name,
        "times": med.times,
        "total_stock": med.total_stock,
        "remaining_stock": med.total_stock,
        "dosage_per_intake": med.dosage_per_intake,
        "start_date": med.start_date.isoformat(),
        "end_date": med.end_date.isoformat(),
        "created_at": datetime.utcnow().isoformat()
    }

    await db.medications.insert_one(medication_doc)

    return {
        "status": "medication added",
        "medication_id": medication_doc["id"]
    }


# ---------------- GET MY MEDICATIONS ----------------

@router.get("/")
async def get_my_medications(current_user=Depends(get_current_user)):

    meds = await db.medications.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).to_list(1000)

    return meds


# ---------------- UPDATE MEDICATION ----------------

@router.put("/{med_id}")
async def update_medication(
    med_id: str,
    data: MedicationUpdate,
    current_user=Depends(get_current_user)
):

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields provided")

    if "start_date" in update_data:
        update_data["start_date"] = update_data["start_date"].isoformat()

    if "end_date" in update_data:
        update_data["end_date"] = update_data["end_date"].isoformat()

    result = await db.medications.update_one(
        {"id": med_id, "user_id": current_user["id"]},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Medication not found")

    return {"status": "medication updated"}


# ---------------- ADD STOCK ----------------

@router.put("/{med_id}/add-stock")
async def add_stock(
    med_id: str,
    data: StockUpdate,
    current_user=Depends(get_current_user)
):

    medication = await db.medications.find_one({
        "id": med_id,
        "user_id": current_user["id"]
    })

    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")

    new_total = medication["total_stock"] + data.additional_stock
    new_remaining = medication["remaining_stock"] + data.additional_stock

    await db.medications.update_one(
        {"id": med_id},
        {"$set": {
            "total_stock": new_total,
            "remaining_stock": new_remaining
        }}
    )

    return {"status": "stock updated"}


# ---------------- DELETE MEDICATION ----------------

@router.delete("/{med_id}")
async def delete_medication(
    med_id: str,
    current_user=Depends(get_current_user)
):

    result = await db.medications.delete_one({
        "id": med_id,
        "user_id": current_user["id"]
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Medication not found")

    return {"status": "medication deleted"}