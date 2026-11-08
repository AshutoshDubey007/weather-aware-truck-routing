"""
Geocoding service using Photon / OpenStreetMap Nominatim with built-in cache and offline presets.
"""
import requests
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Predefined key logistics hubs for instant offline resolution and suggestions
POPULAR_HUBS = [
    {"name": "New York, NY", "lat": 40.7128, "lon": -74.0060, "state": "New York", "country": "USA"},
    {"name": "Chicago, IL", "lat": 41.8781, "lon": -87.6298, "state": "Illinois", "country": "USA"},
    {"name": "Los Angeles, CA", "lat": 34.0522, "lon": -118.2437, "state": "California", "country": "USA"},
    {"name": "Dallas, TX", "lat": 32.7767, "lon": -96.7970, "state": "Texas", "country": "USA"},
    {"name": "Atlanta, GA", "lat": 33.7490, "lon": -84.3880, "state": "Georgia", "country": "USA"},
    {"name": "Denver, CO", "lat": 39.7392, "lon": -104.9903, "state": "Colorado", "country": "USA"},
    {"name": "Seattle, WA", "lat": 47.6062, "lon": -122.3321, "state": "Washington", "country": "USA"},
    {"name": "Miami, FL", "lat": 25.7617, "lon": -80.1918, "state": "Florida", "country": "USA"},
    {"name": "Kansas City, MO", "lat": 39.0997, "lon": -94.5786, "state": "Missouri", "country": "USA"},
    {"name": "Houston, TX", "lat": 29.7604, "lon": -95.3698, "state": "Texas", "country": "USA"},
    {"name": "Philadelphia, PA", "lat": 39.9526, "lon": -75.1652, "state": "Pennsylvania", "country": "USA"},
    {"name": "Phoenix, AZ", "lat": 33.4484, "lon": -112.0740, "state": "Arizona", "country": "USA"},
    {"name": "Boston, MA", "lat": 42.3601, "lon": -71.0589, "state": "Massachusetts", "country": "USA"},
    {"name": "Minneapolis, MN", "lat": 44.9778, "lon": -93.2650, "state": "Minnesota", "country": "USA"},
    {"name": "Detroit, MI", "lat": 42.3314, "lon": -83.0458, "state": "Michigan", "country": "USA"},
]

_GEOCODE_CACHE = {}


def geocode_place(query: str) -> Optional[Dict[str, Any]]:
    """
    Geocodes a place name or address into {name, lat, lon}.
    Checks popular hubs first, then in-memory cache, then Photon / Nominatim.
    """
    clean_query = query.strip()
    if not clean_query:
        return None

    # Check cache
    cache_key = clean_query.lower()
    if cache_key in _GEOCODE_CACHE:
        return _GEOCODE_CACHE[cache_key]

    # Check popular hubs
    for hub in POPULAR_HUBS:
        if clean_query.lower() in hub["name"].lower() or hub["name"].lower() in clean_query.lower():
            result = {"name": hub["name"], "lat": hub["lat"], "lon": hub["lon"]}
            _GEOCODE_CACHE[cache_key] = result
            return result

    # Try Photon API (Komoot OpenStreetMap geocoder)
    try:
        url = "https://photon.komoot.io/api/"
        params = {"q": clean_query, "limit": 1}
        headers = {"User-Agent": "WeatherTruckRouter/1.0"}
        resp = requests.get(url, params=params, headers=headers, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            features = data.get("features", [])
            if features:
                f = features[0]
                coords = f.get("geometry", {}).get("coordinates", [])
                props = f.get("properties", {})
                parts = [props.get("name"), props.get("city"), props.get("state"), props.get("country")]
                formatted_name = ", ".join([p for p in parts if p]) or clean_query
                result = {
                    "name": formatted_name,
                    "lat": coords[1],
                    "lon": coords[0],
                }
                _GEOCODE_CACHE[cache_key] = result
                return result
    except Exception as e:
        logger.warning(f"Photon geocode failed for '{clean_query}': {e}")

    # Fallback to Nominatim
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": clean_query, "format": "json", "limit": 1}
        headers = {"User-Agent": "WeatherTruckRouter/1.0 (contact@weathertruckrouter.local)"}
        resp = requests.get(url, params=params, headers=headers, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            if data:
                res = data[0]
                result = {
                    "name": res.get("display_name", clean_query),
                    "lat": float(res["lat"]),
                    "lon": float(res["lon"]),
                }
                _GEOCODE_CACHE[cache_key] = result
                return result
    except Exception as e:
        logger.warning(f"Nominatim geocode failed for '{clean_query}': {e}")

    return None


def search_places(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Autocomplete search returning up to `limit` place candidates.
    """
    clean_query = query.strip().lower()
    if not clean_query:
        return POPULAR_HUBS[:limit]

    matches = []
    # Match hubs first
    for hub in POPULAR_HUBS:
        if clean_query in hub["name"].lower():
            matches.append({"name": hub["name"], "lat": hub["lat"], "lon": hub["lon"]})

    if len(matches) >= limit:
        return matches[:limit]

    # Try Photon
    try:
        url = "https://photon.komoot.io/api/"
        params = {"q": clean_query, "limit": limit}
        headers = {"User-Agent": "WeatherTruckRouter/1.0"}
        resp = requests.get(url, params=params, headers=headers, timeout=4)
        if resp.status_code == 200:
            data = resp.json()
            for f in data.get("features", []):
                coords = f.get("geometry", {}).get("coordinates", [])
                props = f.get("properties", {})
                parts = [props.get("name"), props.get("city"), props.get("state"), props.get("country")]
                formatted_name = ", ".join([p for p in parts if p]) or "Unknown"
                item = {"name": formatted_name, "lat": coords[1], "lon": coords[0]}
                if not any(m["name"] == item["name"] for m in matches):
                    matches.append(item)
    except Exception as e:
        logger.warning(f"Photon search failed: {e}")

    return matches[:limit]
