from datetime import datetime


def predict_adherence(missed_doses: int):
    """
    SmartCare AI Risk Model
    Lightweight behavioral inference engine.

    Returns structured intelligence:
    - risk_level
    - severity_score
    - intervention_required
    - recommendation
    """

    severity_score = min(100, missed_doses * 25)

    if missed_doses == 0:
        risk_level = "Low"
        intervention_required = False
        recommendation = "Patient adherence stable. Continue monitoring."

    elif missed_doses == 1:
        risk_level = "Mild"
        intervention_required = False
        recommendation = "Minor deviation detected. Encourage consistency."

    elif missed_doses == 2:
        risk_level = "Moderate"
        intervention_required = True
        recommendation = "Repeated misses detected. Recommend reminder reinforcement."

    elif missed_doses == 3:
        risk_level = "Elevated"
        intervention_required = True
        recommendation = "Escalation risk rising. Monitor closely."

    else:
        risk_level = "High"
        intervention_required = True
        recommendation = "Critical adherence drop. Emergency escalation advised."

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "missed_doses": missed_doses,
        "risk_level": risk_level,
        "severity_score": severity_score,
        "intervention_required": intervention_required,
        "recommendation": recommendation
    }