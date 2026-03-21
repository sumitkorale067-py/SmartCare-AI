from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid

# ---------------- LOAD ENV FIRST ----------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---------------- IMPORT DB + INIT ----------------
from db import db, initialize_indexes

# ---------------- IMPORT SCHEDULER ----------------
from services.scheduler import start_scheduler

# ---------------- IMPORT ROUTERS ----------------
from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.medications import router as meds_router
from routes.reminders import router as reminders_router
from routes.location import router as location_router
from routes.voice import router as voice_router
from routes.twilio_webhook import router as twilio_router
from routes.emergency import router as emergency_router
from routes.notifications import router as notifications_router

# ---------------- AI SERVICE ----------------
from services.ai_service import predict_adherence


# =========================================================
# LIFESPAN
# =========================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    print("🚀 SmartCare API Starting...")

    # Initialize Mongo indexes
    try:
        await initialize_indexes()
        print("📌 MongoDB indexes initialized")
    except Exception as e:
        print("❌ Index initialization failed:", e)

    # Start scheduler (only once)
    if os.getenv("DISABLE_SCHEDULER") != "true":
        try:
            await start_scheduler()
            print("⏰ Scheduler started")
        except Exception as e:
            print("❌ Scheduler failed:", e)

    yield

    print("🛑 SmartCare API Shutting down...")


# =========================================================
# CREATE APP
# =========================================================

app = FastAPI(
    title="SmartCare AI Healthcare API",
    description="AI Medication Reminder + Voice Call + GPS Emergency System",
    version="2.0",
    lifespan=lifespan
)

api_router = APIRouter(prefix="/api")


# =========================================================
# STATUS MODELS
# =========================================================

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


# =========================================================
# ROOT
# =========================================================

@api_router.get("/")
async def root():
    return {
        "message": "SmartCare API running",
        "system": "AI Healthcare Assistant",
    }


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(client_name=input.client_name)
    doc = status_obj.model_dump()
    doc["timestamp"] = doc["timestamp"].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check["timestamp"], str):
            check["timestamp"] = datetime.fromisoformat(check["timestamp"])
    return status_checks


@api_router.get("/ai/adherence/{missed}")
async def adherence(missed: int):
    return predict_adherence(missed)


# =========================================================
# INCLUDE ROUTERS
# =========================================================

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(meds_router)
api_router.include_router(reminders_router)
api_router.include_router(location_router)
api_router.include_router(voice_router)
api_router.include_router(twilio_router)
api_router.include_router(emergency_router)
api_router.include_router(notifications_router)

app.include_router(api_router)


# =========================================================
# CORS
# =========================================================

origins = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# LOGGING
# =========================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)