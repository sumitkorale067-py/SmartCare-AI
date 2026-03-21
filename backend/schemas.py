from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import date
import re


# ---------------- CONTACT ---------------- #

class Contact(BaseModel):
    name: str = Field(..., min_length=1)
    phone: str = Field(..., min_length=8)


# ---------------- USER RESPONSE ---------------- #

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    phone: Optional[str] = None
    timezone: Optional[str] = "UTC"
    emergency_contacts: List[Contact] = []


# ---------------- PROFILE UPDATE ---------------- #

class ProfileUpdate(BaseModel):
    name: str = Field(..., min_length=1)
    emergency_contacts: List[Contact]
    timezone: str = Field(..., min_length=1)


class TimezoneUpdate(BaseModel):
    timezone: str = Field(..., min_length=1)


# ---------------- MEDICATION ---------------- #

class MedicationCreate(BaseModel):
    name: str = Field(..., min_length=1)
    times: List[str]                     # ["08:00", "20:00"]
    total_stock: int = Field(..., gt=0)
    dosage_per_intake: int = Field(..., gt=0)
    start_date: date
    end_date: date

    @validator("times", each_item=True)
    def validate_time_format(cls, v):
        if not re.match(r"^\d{2}:\d{2}$", v):
            raise ValueError("Time must be in HH:MM format")
        return v


class MedicationUpdate(BaseModel):
    name: Optional[str]
    times: Optional[List[str]]
    total_stock: Optional[int]
    dosage_per_intake: Optional[int]
    start_date: Optional[date]
    end_date: Optional[date]


class StockUpdate(BaseModel):
    additional_stock: int = Field(..., gt=0)


class MedicationResponse(BaseModel):
    id: str
    name: str
    times: List[str]
    total_stock: int
    remaining_stock: int
    dosage_per_intake: int
    start_date: date
    end_date: date


# ---------------- REMINDER ---------------- #

class ReminderResponse(BaseModel):
    id: str
    medication_name: str
    scheduled_time: str
    status: str