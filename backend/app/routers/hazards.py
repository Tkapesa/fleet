from fastapi import APIRouter, Query
import httpx

from app.services.route_providers import get_providers, OpenWeatherProvider

router = APIRouter(prefix="/hazards", tags=["hazards"])


def _open_meteo_fallback(lat: float, lon: float) -> dict:
    """Fetch current weather from Open-Meteo (no API key required)."""
    try:
        resp = httpx.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,cloud_cover,weather_code",
            },
            timeout=6.0,
        )
        resp.raise_for_status()
        current = resp.json().get("current", {})
        return {
            "fetched": True,
            "main": "Current conditions",
            "description": f"Code {current.get('weather_code', 'n/a')}",
            "temp_c": current.get("temperature_2m"),
            "feels_like_c": current.get("apparent_temperature"),
            "humidity_pct": current.get("relative_humidity_2m"),
            "precip_mm": current.get("precipitation"),
            "wind_m_s": current.get("wind_speed_10m"),
            "cloud_cover_pct": current.get("cloud_cover"),
            "source": "open-meteo",
        }
    except Exception as e:
        return {"fetched": False, "error": str(e), "source": "open-meteo"}


@router.get("/at")
def assess_point(lat: float = Query(...), lon: float = Query(...)):
    """Assess hazards for a single geographic point (lat, lon)."""
    providers = get_providers()
    hazards: list[str] = []
    details: dict = {}

    for p in providers:
        try:
            if isinstance(p, OpenWeatherProvider):
                ph = p._assess_point(float(lat), float(lon))
                if ph:
                    hazards.extend(ph)
                details[p.name] = p.get_point_details(float(lat), float(lon))
            else:
                result = p.assess(str(lat), str(lon))
                ph = result.get("hazards", [])
                if ph:
                    hazards.extend(ph)
                details[p.name] = result.get("details", {})
        except Exception:
            details[p.name] = {"error": "provider_failed"}

    # If OpenWeather is unavailable/unauthorized, provide a no-key fallback.
    ow = details.get("openweather")
    if ow is None or not ow.get("fetched", False):
        details["openmeteo"] = _open_meteo_fallback(float(lat), float(lon))

    hazards = list(dict.fromkeys(hazards))
    if len(hazards) >= 2:
        level = "high"
    elif len(hazards) == 1:
        level = "medium"
    else:
        level = "low"

    summary = "; ".join(hazards) if hazards else "No known hazards from configured checks"
    return {"risk_level": level, "summary": summary, "hazards": hazards, "provider_details": details}
