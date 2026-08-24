from app.schemas.hazard import HazardAssessmentRead
from app.services.route_providers import get_providers


HIGH_RISK_KEYWORDS = {
    "mountain": "Mountain roads ahead",
    "ice": "Potential icy conditions",
    "storm": "Storm risk on planned route",
    "construction": "Construction delay risk",
    "flood": "Flood-prone segment detected",
}


def assess_route_hazards(origin: str, destination: str) -> HazardAssessmentRead:
    text = f"{origin} {destination}".lower()
    hazards: list[str] = []
    provider_details: dict = {}

    for keyword, message in HIGH_RISK_KEYWORDS.items():
        if keyword in text:
            hazards.append(message)

    # Query external providers
    providers = get_providers()
    for p in providers:
        try:
            result = p.assess(origin, destination)
            ph = result.get("hazards", [])
            if ph:
                hazards.extend(ph)
            provider_details[p.name] = result.get("details", {})
        except Exception:
            provider_details[p.name] = {"error": "provider_failed"}

    # Deduplicate hazards
    hazards = list(dict.fromkeys(hazards))

    if len(hazards) >= 2:
        level = "high"
    elif len(hazards) == 1:
        level = "medium"
    else:
        level = "low"

    summary = "; ".join(hazards) if hazards else "No known hazards from configured checks"
    return HazardAssessmentRead(risk_level=level, summary=summary, hazards=hazards, provider_details=provider_details or None)
