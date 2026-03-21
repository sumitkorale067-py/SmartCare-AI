from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from datetime import datetime
from db import db
from services.dependencies import get_current_user

router = APIRouter(prefix="/location", tags=["Location"])


# ---------------- SCHEMA ---------------- #

class LocationUpdate(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    timestamp: str | None = None


# ---------------- UPDATE LOCATION ---------------- #

async def _do_update_location(payload: LocationUpdate, current_user: dict):
    """Shared logic for location update."""
    maps_url = f"https://www.google.com/maps?q={payload.lat},{payload.lng}"

    location_payload = {
        "lat": payload.lat,
        "lng": payload.lng,
        "maps_url": maps_url,
        "timestamp": payload.timestamp or datetime.utcnow().isoformat()
    }

    result = await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"last_location": location_payload}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "status": "location updated",
        "location": location_payload
    }


@router.post("/")
async def update_location_root(
    payload: LocationUpdate,
    current_user=Depends(get_current_user)
):
    """POST /location/ — primary route used by the frontend."""
    return await _do_update_location(payload, current_user)


@router.post("/update")
async def update_location(
    payload: LocationUpdate,
    current_user=Depends(get_current_user)
):
    """POST /location/update — legacy route kept for backward compatibility."""
    return await _do_update_location(payload, current_user)