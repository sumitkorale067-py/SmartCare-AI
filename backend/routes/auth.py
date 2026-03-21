from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from services.auth_service import hash_password, verify_password, create_access_token
from db import db
import uuid
import re

router = APIRouter(prefix="/auth", tags=["Auth"])


# ---------------- MODELS ---------------- #

class RegisterRequest(BaseModel):
    phone: str = Field(..., min_length=8)
    password: str = Field(..., min_length=6)
    name: str | None = None
    timezone: str = "UTC"


# ---------------- REGISTER ---------------- #

@router.post("/register")
async def register(data: RegisterRequest):

    phone = data.phone.strip()

    # Basic phone validation
    if not re.match(r"^\+?[0-9]{8,15}$", phone):
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    existing = await db.users.find_one({"phone": phone})
    if existing:
        raise HTTPException(status_code=400, detail="Phone already registered")

    user = {
        "id": str(uuid.uuid4()),
        "phone": phone,
        "password_hash": hash_password(data.password),
        "name": data.name.strip() if data.name else None,
        "timezone": data.timezone.strip() if data.timezone else "UTC",
        "emergency_contacts": [],
        "profile_completed": bool(data.name),
        "created_at": uuid.uuid4().hex  # simple unique marker
    }

    await db.users.insert_one(user)

    return {"message": "Account created successfully"}


# ---------------- LOGIN ---------------- #

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Accepts application/x-www-form-urlencoded with 'username' and 'password' fields.
    The frontend sends the phone number in the 'username' field.
    """

    phone = form_data.username.strip()

    user = await db.users.find_one({"phone": phone})

    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"sub": user["id"]})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "phone": user["phone"],
            "profile_completed": user.get("profile_completed", False)
        }
    }