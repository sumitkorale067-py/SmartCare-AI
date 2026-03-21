from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List
from db import db
from services.dependencies import get_current_user
from services.auth_service import hash_password, verify_password

router = APIRouter(prefix="/users", tags=["Users"])


# ---------------- MODELS ----------------

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)


# ---------------- CHANGE PASSWORD ----------------

@router.put("/me/password")
async def change_password(
    data: ChangePasswordRequest,
    current_user=Depends(get_current_user)
):
    """Change the authenticated user's password."""
    # Need the password_hash — fetch it explicitly
    user = await db.users.find_one(
        {"id": current_user["id"]},
        {"_id": 0, "password_hash": 1}
    )

    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(data.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"password_hash": new_hash}}
    )

    return {"status": "Password changed successfully"}


# ---------------- UPDATE PROFILE ----------------

@router.put("/me")
async def update_profile(
    data: dict,
    current_user=Depends(get_current_user)
):
    """
    Updates:
    - name
    - emergency_contacts
    - timezone
    """

    allowed_fields = {"name", "emergency_contacts", "timezone"}

    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields provided")

    update_data["profile_completed"] = True

    result = await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"status": "Profile updated successfully"}


# ---------------- GET CURRENT USER ----------------

@router.get("/me")
async def get_my_profile(current_user=Depends(get_current_user)):
    user = await db.users.find_one(
        {"id": current_user["id"]},
        {"_id": 0, "password_hash": 0}
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


# ---------------- UPDATE TIMEZONE ONLY ----------------

@router.put("/me/timezone")
async def update_timezone(
    data: dict,
    current_user=Depends(get_current_user)
):
    timezone = data.get("timezone")

    if not timezone:
        raise HTTPException(status_code=400, detail="Timezone required")

    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"timezone": timezone}}
    )

    return {"status": "Timezone updated"}


# ---------------- UPDATE EMERGENCY CONTACTS ONLY ----------------

@router.put("/me/emergency-contacts")
async def update_emergency_contacts(
    data: dict,
    current_user=Depends(get_current_user)
):
    contacts = data.get("emergency_contacts")

    if not contacts or not isinstance(contacts, list):
        raise HTTPException(status_code=400, detail="Invalid contact list")

    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"emergency_contacts": contacts}}
    )

    return {"status": "Emergency contacts updated"}


# ---------------- GET USER BY ID ----------------

@router.get("/{user_id}")
async def get_user(user_id: str):
    user = await db.users.find_one(
        {"id": user_id},
        {"_id": 0, "password_hash": 0}
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user