import httpx
from typing import Dict as _dict

from app.core.config import settings


class RouteRiskProvider:
    name = "base"

    def assess(self, origin: str, destination: str) -> dict:
        """Return dict with keys: hazards: list[str], details: dict"""
        return {"hazards": [], "details": {}}


class OpenWeatherProvider(RouteRiskProvider):
    name = "openweather"

    GEOCODE_URL = "http://api.openweathermap.org/geo/1.0/direct"
    ONECALL_URL = "https://api.openweathermap.org/data/2.5/onecall"

    def _geocode(self, place: str) -> tuple[float, float] | None:
        key = settings.OPENWEATHER_API_KEY
        if not key:
            return None
        try:
            resp = httpx.get(self.GEOCODE_URL, params={"q": place, "limit": 1, "appid": key}, timeout=5.0)
            resp.raise_for_status()
            data = resp.json()
            if not data:
                return None
            return data[0]["lat"], data[0]["lon"]
        except Exception:
            return None

    def _assess_point(self, lat: float, lon: float) -> list[str]:
        key = settings.OPENWEATHER_API_KEY
        if not key:
            return []
        try:
            resp = httpx.get(self.ONECALL_URL, params={"lat": lat, "lon": lon, "exclude": "minutely,hourly,alerts", "appid": key, "units": "metric"}, timeout=5.0)
            resp.raise_for_status()
            data = resp.json()
            hazards: list[str] = []
            current = data.get("current", {})
            weather = current.get("weather", [])
            if weather:
                main = weather[0].get("main", "").lower()
                desc = weather[0].get("description", "")
                if "storm" in main or "thunder" in desc:
                    hazards.append("Stormy weather expected")
                if "snow" in main:
                    hazards.append("Snow/icy conditions expected")
                if "rain" in main:
                    hazards.append("Rain expected; reduced traction")
            wind = current.get("wind_speed") or current.get("wind", {}).get("speed")
            if wind and wind > 15:
                hazards.append("High wind speeds may impact stability")
            temp = current.get("temp")
            if temp is not None and temp < -5:
                hazards.append("Very low temperatures; icy risk")
            return hazards
        except Exception:
            return []

    def assess(self, origin: str, destination: str) -> dict:
        details: dict = {"provider": self.name, "fetched": False}
        if not settings.OPENWEATHER_API_KEY:
            return {"hazards": [], "details": details}

        o_coords = self._geocode(origin)
        d_coords = self._geocode(destination)
        hazards: list[str] = []
        if o_coords:
            hazards.extend(self._assess_point(*o_coords))
        if d_coords:
            hazards.extend(self._assess_point(*d_coords))

        details["fetched"] = True
        details["origin_geocoded"] = bool(o_coords)
        details["destination_geocoded"] = bool(d_coords)
        return {"hazards": hazards, "details": details}


def get_providers() -> list[RouteRiskProvider]:
    providers: list[RouteRiskProvider] = []
    # Instantiate providers based on available config
    if settings.OPENWEATHER_API_KEY:
        providers.append(OpenWeatherProvider())
    return providers
