"""
Weather service — fetches live conditions from OpenWeatherMap and converts
them into the short descriptive string the outfit generator expects
(e.g. "Cool Autumn", "Hot & Humid").
Falls back to a neutral simulated reading when no API key is configured
or the request fails, so the rest of the app keeps working offline.
"""

import httpx
from app.config import settings

_BASE_URL = "https://api.openweathermap.org/data/2.5/weather"


def _describe(temp_c: float, condition: str, humidity: int) -> str:
    condition = condition.lower()

    if temp_c >= 32:
        band = "Hot"
    elif temp_c >= 24:
        band = "Warm"
    elif temp_c >= 15:
        band = "Mild"
    elif temp_c >= 5:
        band = "Cool"
    else:
        band = "Cold"

    if "rain" in condition or "drizzle" in condition or "thunderstorm" in condition:
        qualifier = "Rainy"
    elif "snow" in condition:
        qualifier = "Snowy"
    elif humidity >= 70:
        qualifier = "Humid"
    elif "clear" in condition:
        qualifier = "Clear"
    elif "cloud" in condition:
        qualifier = "Overcast"
    else:
        qualifier = condition.title()

    return f"{band} & {qualifier}"


async def get_weather(city: str) -> dict:
    fallback = {
        "city": city,
        "temp_c": 22.0,
        "condition": "Clear",
        "humidity": 45,
        "description": "Mild & Clear",
        "source": "simulated",
    }

    if not settings.WEATHER_API_KEY:
        return fallback

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                _BASE_URL,
                params={
                    "q": city,
                    "appid": settings.WEATHER_API_KEY,
                    "units": "metric",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        temp_c = data["main"]["temp"]
        humidity = data["main"]["humidity"]
        condition = data["weather"][0]["main"] if data.get("weather") else "Clear"

        return {
            "city": data.get("name", city),
            "temp_c": temp_c,
            "condition": condition,
            "humidity": humidity,
            "description": _describe(temp_c, condition, humidity),
            "source": "live",
        }
    except Exception as exc:
        print(f"[Weather] Error fetching '{city}': {exc}")
        return fallback
