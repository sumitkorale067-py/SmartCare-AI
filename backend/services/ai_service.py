import os
import logging
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# GEMINI CLIENT (lazy init)
# ─────────────────────────────────────────────

_gemini_model = None


def _get_gemini():
    """Initialize Gemini on first call. Returns None if key is missing."""
    global _gemini_model
    if _gemini_model is not None:
        return _gemini_model

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY missing — using rule-based predictor only")
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        _gemini_model = genai.GenerativeModel("gemini-2.0-flash")
        logger.info("✅ Gemini AI initialized")
        return _gemini_model
    except Exception as e:
        logger.error(f"Gemini init failed: {e}")
        return None


# ─────────────────────────────────────────────
# RULE-BASED PREDICTOR (always-available fallback)
# ─────────────────────────────────────────────

def _rule_based_prediction(missed_doses: int):
    severity_score = min(100, missed_doses * 25)

    if missed_doses == 0:
        risk_level, intervention, rec = "Low", False, "Patient adherence stable. Continue monitoring."
    elif missed_doses == 1:
        risk_level, intervention, rec = "Mild", False, "Minor deviation detected. Encourage consistency."
    elif missed_doses == 2:
        risk_level, intervention, rec = "Moderate", True, "Repeated misses detected. Recommend reminder reinforcement."
    elif missed_doses == 3:
        risk_level, intervention, rec = "Elevated", True, "Escalation risk rising. Monitor closely."
    else:
        risk_level, intervention, rec = "High", True, "Critical adherence drop. Emergency escalation advised."

    return {
        "risk_level": risk_level,
        "severity_score": severity_score,
        "intervention_required": intervention,
        "recommendation": rec,
    }


# ─────────────────────────────────────────────
# GEMINI-ENHANCED PREDICTION
# ─────────────────────────────────────────────

async def _gemini_recommendation(missed_doses: int, rule_result: dict):
    """Ask Gemini for a personalized, empathetic recommendation."""
    model = _get_gemini()
    if not model:
        return None

    prompt = (
        f"You are SmartCare AI, a compassionate medication adherence assistant. "
        f"A patient has missed {missed_doses} dose(s) in the last 7 days. "
        f"Their current risk level is '{rule_result['risk_level']}' "
        f"with severity score {rule_result['severity_score']}/100.\n\n"
        f"Give a short (2-3 sentence) personalized, empathetic recommendation. "
        f"Be encouraging but clear about the health importance. "
        f"Do NOT use bullet points or headers. Just plain sentences."
    )

    try:
        response = await model.generate_content_async(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini call failed: {e}")
        return None


# ─────────────────────────────────────────────
# PUBLIC API
# ─────────────────────────────────────────────

def predict_adherence(missed_doses: int):
    """
    Synchronous rule-based prediction.
    Used by the GET /ai/adherence/{missed} endpoint.
    """
    result = _rule_based_prediction(missed_doses)
    result["timestamp"] = datetime.utcnow().isoformat()
    result["missed_doses"] = missed_doses
    result["ai_provider"] = "rule-based"
    return result


async def predict_adherence_ai(missed_doses: int):
    """
    Enhanced prediction: rule-based + Gemini AI recommendation.
    Falls back gracefully if Gemini is unavailable.
    """
    result = _rule_based_prediction(missed_doses)
    result["timestamp"] = datetime.utcnow().isoformat()
    result["missed_doses"] = missed_doses

    ai_rec = await _gemini_recommendation(missed_doses, result)
    if ai_rec:
        result["recommendation"] = ai_rec
        result["ai_provider"] = "google-gemini"
    else:
        result["ai_provider"] = "rule-based"

    return result