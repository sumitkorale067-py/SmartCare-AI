import os
import logging
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# ---------------- LOAD ENV ----------------
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://127.0.0.1:27017")
DB_NAME = os.getenv("DB_NAME", "smartcare")

# ---------------- LOGGING ----------------
logging.basicConfig(level=logging.INFO)

# ---------------- CREATE CLIENT ----------------
mongo = AsyncIOMotorClient(
    MONGO_URL,
    serverSelectionTimeoutMS=5000,
    maxPoolSize=20,
    minPoolSize=5,
    retryWrites=True
)

db = mongo[DB_NAME]


# ---------------- HEALTH CHECK ----------------
async def verify_connection():
    try:
        await mongo.admin.command("ping")
        logging.info("✅ MongoDB connection successful")
    except Exception as e:
        logging.error(f"❌ MongoDB connection failed: {e}")


# ---------------- INDEX INITIALIZATION ----------------
async def initialize_indexes():
    """
    Ensures critical indexes exist.
    Prevents duplicate reminders.
    Improves performance.
    """

    # create indexes with error handling to avoid startup failure when duplicates already exist
    try:
        await db.users.create_index("id", unique=True)
    except Exception as e:
        logging.warning(f"Failed to ensure users.id index: {e}")

    try:
        await db.medications.create_index(
            [("user_id", 1), ("name", 1)],
            unique=True
        )
    except Exception as e:
        logging.warning(f"Failed to ensure medications user_id+name index: {e}")

    try:
        await db.reminders.create_index(
            [("user_id", 1), ("scheduled_key", 1)],
            unique=True
        )
    except Exception as e:
        logging.warning(f"Failed to ensure reminders user_id+scheduled_key index: {e}")

    logging.info("📌 MongoDB indexes ensured (attempted)")