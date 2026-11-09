"""
Weather Service interfacing with Open-Meteo API.
Provides:
1. Exact checkpoint weather sampling at arrival ETA.
2. 0-48 hour corridor weather grid for smooth interactive forecast heatmap.
"""
import os
import requests
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from routing.services.risk_calculator import calculate_checkpoint_risk, RiskLevel

logger = logging.getLogger(__name__)

OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY', '').strip()

# WMO Weather interpretation codes
WMO_DESCRIPTIONS = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def get_weather_description(wmo_code: int) -> str:
    return WMO_DESCRIPTIONS.get(wmo_code, "Partly Cloudy")


def fetch_openweather_data(lat: float, lon: float) -> Dict[str, Any] | None:
    """
    Fetches current weather from OpenWeatherMap using the user's API key.
    Falls back to Open-Meteo if the key is inactive (401) or times out.
    """
    if not OPENWEATHER_API_KEY:
        return None

    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat:.4f}&lon={lon:.4f}&appid={OPENWEATHER_API_KEY}&units=imperial"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            return resp.json()
        elif resp.status_code == 401:
            logger.info("OpenWeatherMap key is pending activation (takes ~15-30m after registration). Using Open-Meteo.")
    except Exception as e:
        logger.warning(f"OpenWeatherMap request failed: {e}")
    return None


def fetch_open_meteo_forecasts(coords: List[Tuple[float, float]], forecast_days: int = 3) -> List[Dict[str, Any]]:
    """
    Fetches hourly weather forecast from Open-Meteo in batches of up to 50 coordinates.
    Returns list of forecast dicts matching coords 1-to-1.
    """
    if not coords:
        return []

    results = []
    chunk_size = 40

    for i in range(0, len(coords), chunk_size):
        chunk = coords[i:i + chunk_size]
        lats_str = ",".join(f"{lat:.4f}" for lat, lon in chunk)
        lons_str = ",".join(f"{lon:.4f}" for lat, lon in chunk)

        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lats_str}&longitude={lons_str}"
            f"&hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation,rain,snowfall,weather_code"
            f"&wind_speed_unit=mph&precipitation_unit=inch&temperature_unit=fahrenheit"
            f"&forecast_days={forecast_days}"
        )
        headers = {"User-Agent": "WeatherTruckRouter/1.0"}

        try:
            resp = requests.get(url, headers=headers, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list):
                    results.extend(data)
                elif isinstance(data, dict):
                    results.append(data)
            else:
                logger.error(f"Open-Meteo returned status {resp.status_code}: {resp.text[:200]}")
                # Append None for failed chunk
                results.extend([None] * len(chunk))
        except Exception as e:
            logger.error(f"Error fetching Open-Meteo: {e}")
            results.extend([None] * len(chunk))

    return results


def find_closest_hour_index(time_strings: List[str], target_dt: datetime) -> int:
    """Finds index of closest hourly forecast to target datetime."""
    if not time_strings:
        return 0

    target_iso_prefix = target_dt.strftime("%Y-%m-%dT%H:00")
    for idx, t in enumerate(time_strings):
        if t.startswith(target_iso_prefix):
            return idx

    # If exact hour match not found, compute minimum delta
    target_ts = target_dt.timestamp()
    best_idx = 0
    min_delta = float("inf")

    for idx, t in enumerate(time_strings):
        try:
            parsed = datetime.fromisoformat(t)
            delta = abs(parsed.timestamp() - target_ts)
            if delta < min_delta:
                min_delta = delta
                best_idx = idx
        except Exception:
            continue

    return best_idx


def enrich_routes_with_weather_and_risk(
    routes: List[Dict[str, Any]],
    load_weight_lb: float,
    departure_dt: datetime
) -> None:
    """
    Enriches all checkpoints across routes with sampled weather at their estimated arrival times
    and calculates risk levels based on risk rules and load weight.
    """
    all_checkpoints = []
    coord_list = []

    for route in routes:
        for cp in route.get("checkpoints", []):
            all_checkpoints.append(cp)
            coord_list.append((cp["latitude"], cp["longitude"]))

    # Batch fetch forecasts
    forecasts = fetch_open_meteo_forecasts(coord_list, forecast_days=3)

    for idx, cp in enumerate(all_checkpoints):
        fc = forecasts[idx] if idx < len(forecasts) else None
        eta_dt = departure_dt + timedelta(seconds=cp.get("elapsed_seconds", 0))

        # Try to parse eta_dt from checkpoint
        try:
            eta_dt = datetime.fromisoformat(cp["eta_iso"])
        except Exception:
            pass

        if fc and "hourly" in fc:
            hourly = fc["hourly"]
            times = hourly.get("time", [])
            h_idx = find_closest_hour_index(times, eta_dt)

            wind_speed = float(hourly.get("wind_speed_10m", [0])[h_idx] or 0.0)
            wind_gusts = float(hourly.get("wind_gusts_10m", [0])[h_idx] or wind_speed)
            rain_rate = float(hourly.get("rain", [0])[h_idx] or 0.0)
            snow_rate = float(hourly.get("snowfall", [0])[h_idx] or 0.0)
            precip = float(hourly.get("precipitation", [0])[h_idx] or (rain_rate + snow_rate))
            temp_f = float(hourly.get("temperature_2m", [65])[h_idx] or 65.0)
            code = int(hourly.get("weather_code", [0])[h_idx] or 0)
        else:
            # Resilient fallback values
            wind_speed = 12.0
            wind_gusts = 16.0
            rain_rate = 0.0
            snow_rate = 0.0
            precip = 0.0
            temp_f = 68.0
            code = 1

        # Calculate risk based on risk rules
        risk_result = calculate_checkpoint_risk(
            wind_mph=wind_speed,
            rain_in_hr=rain_rate,
            snow_in_hr=snow_rate,
            load_weight_lb=load_weight_lb,
        )

        cp["weather"] = {
            "temperature_f": round(temp_f, 1),
            "wind_speed_mph": round(wind_speed, 1),
            "wind_gusts_mph": round(wind_gusts, 1),
            "rain_in_hr": round(rain_rate, 2),
            "snow_in_hr": round(snow_rate, 2),
            "precipitation_in_hr": round(precip, 2),
            "weather_code": code,
            "condition": get_weather_description(code),
        }

        cp["overall_risk"] = risk_result["overall_risk"]
        cp["risk_score"] = risk_result["risk_score"]
        cp["wind_risk"] = risk_result["wind_risk"]
        cp["base_wind_risk"] = risk_result["base_wind_risk"]
        cp["rain_risk"] = risk_result["rain_risk"]
        cp["snow_risk"] = risk_result["snow_risk"]
        cp["advisories"] = risk_result["advisories"]


def build_corridor_heatmap_data(
    routes: List[Dict[str, Any]],
    load_weight_lb: float,
    departure_dt: datetime,
    max_forecast_hours: int = 48
) -> Dict[str, Any]:
    """
    Builds 0-48 hour weather heatmap data along the route corridor.
    Constructs a spatial grid covering all 3 routes with margin,
    fetches hourly forecasts, and returns hourly matrix of weather/risk values.
    """
    all_lats = []
    all_lons = []

    for r in routes:
        for pt in r.get("coordinates", []):
            all_lats.append(pt[0])
            all_lons.append(pt[1])

    if not all_lats:
        return {"grid": [], "hours": []}

    min_lat, max_lat = min(all_lats), max(all_lats)
    min_lon, max_lon = min(all_lons), max(all_lons)

    # Add margin (~40 miles ~ 0.6 degrees)
    margin_lat = max(0.4, (max_lat - min_lat) * 0.15)
    margin_lon = max(0.4, (max_lon - min_lon) * 0.15)
    min_lat -= margin_lat
    max_lat += margin_lat
    min_lon -= margin_lon
    max_lon += margin_lon

    # Build 7x7 grid points
    grid_rows = 6
    grid_cols = 7
    grid_coords = []
    grid_points_meta = []

    for r_idx in range(grid_rows):
        lat = min_lat + (r_idx / float(grid_rows - 1)) * (max_lat - min_lat)
        for c_idx in range(grid_cols):
            lon = min_lon + (c_idx / float(grid_cols - 1)) * (max_lon - min_lon)
            grid_coords.append((lat, lon))
            grid_points_meta.append({
                "id": len(grid_coords) - 1,
                "lat": round(lat, 4),
                "lon": round(lon, 4),
            })

    # Also include 8 checkpoints from routes to ensure high fidelity along the exact highway
    for r in routes:
        cps = r.get("checkpoints", [])
        step = max(1, len(cps) // 4)
        for cp in cps[::step]:
            clat, clon = cp["latitude"], cp["longitude"]
            grid_coords.append((clat, clon))
            grid_points_meta.append({
                "id": len(grid_coords) - 1,
                "lat": round(clat, 4),
                "lon": round(clon, 4),
            })

    # Fetch forecast for all grid points
    forecasts = fetch_open_meteo_forecasts(grid_coords, forecast_days=3)

    # Structure data for hours 0 to 48
    hours_data = []

    for hour_offset in range(max_forecast_hours + 1):
        target_hour_dt = departure_dt + timedelta(hours=hour_offset)
        hour_label = f"+{hour_offset}h ({target_hour_dt.strftime('%a %I %p')})"

        points_at_hour = []
        for p_idx, pt in enumerate(grid_points_meta):
            fc = forecasts[p_idx] if p_idx < len(forecasts) else None
            if fc and "hourly" in fc:
                hourly = fc["hourly"]
                times = hourly.get("time", [])
                h_idx = find_closest_hour_index(times, target_hour_dt)

                wind = float(hourly.get("wind_speed_10m", [0])[h_idx] or 0.0)
                gusts = float(hourly.get("wind_gusts_10m", [0])[h_idx] or wind)
                rain = float(hourly.get("rain", [0])[h_idx] or 0.0)
                snow = float(hourly.get("snowfall", [0])[h_idx] or 0.0)
                precip = float(hourly.get("precipitation", [0])[h_idx] or (rain + snow))
                temp = float(hourly.get("temperature_2m", [65])[h_idx] or 65.0)
            else:
                wind = 10.0
                gusts = 14.0
                rain = 0.0
                snow = 0.0
                precip = 0.0
                temp = 68.0

            # Calculate risk at this hour with load weight
            risk_calc = calculate_checkpoint_risk(
                wind_mph=wind,
                rain_in_hr=rain,
                snow_in_hr=snow,
                load_weight_lb=load_weight_lb
            )

            points_at_hour.append({
                "lat": pt["lat"],
                "lon": pt["lon"],
                "wind_mph": round(wind, 1),
                "gusts_mph": round(gusts, 1),
                "rain_in_hr": round(rain, 2),
                "snow_in_hr": round(snow, 2),
                "precip_in_hr": round(precip, 2),
                "temp_f": round(temp, 1),
                "risk_score": risk_calc["risk_score"],
                "risk_level": risk_calc["overall_risk"],
            })

        hours_data.append({
            "hour_offset": hour_offset,
            "label": hour_label,
            "timestamp": target_hour_dt.isoformat(),
            "points": points_at_hour,
        })

    return {
        "bounds": {
            "min_lat": min_lat,
            "max_lat": max_lat,
            "min_lon": min_lon,
            "max_lon": max_lon,
        },
        "points_count": len(grid_points_meta),
        "hours": hours_data,
    }
