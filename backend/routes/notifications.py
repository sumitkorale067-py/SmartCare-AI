from fastapi import APIRouter, Depends
from db import db
from services.dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/")
async def get_notifications(current_user=Depends(get_current_user)):
    """
    Returns unacknowledged notifications for the current user.
    The frontend polls this every 30 seconds to show toast popups.
    """
    notifs = await db.notifications.find(
        {"user_id": current_user["id"], "acknowledged": False},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)

    return notifs


@router.put("/{notification_id}/acknowledge")
async def acknowledge_notification(
    notification_id: str,
    current_user=Depends(get_current_user)
):
    """Mark a notification as acknowledged so it won't show again."""
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"acknowledged": True}}
    )

    if result.matched_count == 0:
        return {"status": "not found"}

    return {"status": "acknowledged"}
