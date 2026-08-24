from pydantic import BaseModel
from typing import Any


class HazardAssessmentRead(BaseModel):
    risk_level: str
    summary: str
    hazards: list[str]
    provider_details: dict[str, Any] | None = None
