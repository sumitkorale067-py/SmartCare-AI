from fastapi import APIRouter, Response, Query
from twilio.twiml.voice_response import VoiceResponse

router = APIRouter(prefix="/voice", tags=["Voice"])


@router.post("/message")
async def voice_message(
    user_name: str = Query("User"),
    med_name: str = Query("your medication")
):

    response = VoiceResponse()

    response.say(
        f"Hello {user_name}. "
        f"This is your SmartCare health assistant. "
        f"You may have missed your medication {med_name}. "
        f"Please take your medicine immediately. "
        f"If you do not confirm, emergency contacts will be alerted.",
        voice="alice",
        language="en-IN"
    )

    return Response(content=str(response), media_type="application/xml")