import logging
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from routing.services.geocoding_service import geocode_place, search_places, POPULAR_HUBS
from routing.services.routing_service import generate_3_routes
from routing.services.weather_service import enrich_routes_with_weather_and_risk, build_corridor_heatmap_data
from routing.services.risk_calculator import aggregate_route_risk, rank_and_recommend_routes

logger = logging.getLogger(__name__)

PRESET_TRIPS = [
    {
        "id": "nyc-chi",
        "title": "New York, NY → Chicago, IL",
        "description": "790 mi across the Appalachian Mountains and Midwest plains (I-80 / I-76 corridors)",
        "origin": "New York, NY",
        "destination": "Chicago, IL",
        "default_weight": 42000,
        "sample_interval": 25,
    },
    {
        "id": "dal-den",
        "title": "Dallas, TX → Denver, CO",
        "description": "790 mi across High Plains wind corridors prone to severe crosswinds",
        "origin": "Dallas, TX",
        "destination": "Denver, CO",
        "default_weight": 45000,
        "sample_interval": 25,
    },
    {
        "id": "chi-atl",
        "title": "Chicago, IL → Atlanta, GA",
        "description": "715 mi through Midwest transition zone and Ohio Valley",
        "origin": "Chicago, IL",
        "destination": "Atlanta, GA",
        "default_weight": 35000,
        "sample_interval": 25,
    },
    {
        "id": "sea-la",
        "title": "Seattle, WA → Los Angeles, CA",
        "description": "1,135 mi Pacific Coast Corridor via I-5 with mountain pass weather variations",
        "origin": "Seattle, WA",
        "destination": "Los Angeles, CA",
        "default_weight": 32000,
        "sample_interval": 50,
    },
]


class HealthCheckView(APIView):
    def get(self, request):
        return Response({
            "status": "healthy",
            "service": "Weather-Aware Truck Routing API",
            "version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat(),
        })


class PresetsView(APIView):
    def get(self, request):
        return Response({
            "presets": PRESET_TRIPS,
            "hubs": POPULAR_HUBS,
        })


class GeocodeSearchView(APIView):
    def get(self, request):
        query = request.query_params.get("q", "").strip()
        limit = int(request.query_params.get("limit", 5))
        results = search_places(query, limit=limit)
        return Response({"results": results})


class RouteCalculateView(APIView):
    def post(self, request):
        data = request.data or {}

        origin_input = data.get("origin")
        dest_input = data.get("destination")
        departure_str = data.get("departure_time")
        load_weight_lb = float(data.get("load_weight_lb", 35000.0))
        sample_interval = float(data.get("sample_interval_miles", 25.0))

        # Validate sample interval
        if sample_interval not in [10.0, 25.0, 50.0]:
            sample_interval = 25.0

        # Validate and parse departure time
        try:
            if departure_str:
                # Replace trailing 'Z' if present for ISO parsing
                cleaned_dep = departure_str.replace("Z", "+00:00")
                departure_dt = datetime.fromisoformat(cleaned_dep)
            else:
                departure_dt = datetime.utcnow()
        except Exception:
            departure_dt = datetime.utcnow()

        # Resolve Origin
        origin_geo = None
        if isinstance(origin_input, dict) and "lat" in origin_input and "lon" in origin_input:
            origin_geo = origin_input
        elif isinstance(origin_input, str) and origin_input.strip():
            origin_geo = geocode_place(origin_input)

        if not origin_geo:
            return Response(
                {"error": "Could not geocode origin. Please check the spelling or choose from suggested cities."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Resolve Destination
        dest_geo = None
        if isinstance(dest_input, dict) and "lat" in dest_input and "lon" in dest_input:
            dest_geo = dest_input
        elif isinstance(dest_input, str) and dest_input.strip():
            dest_geo = geocode_place(dest_input)

        if not dest_geo:
            return Response(
                {"error": "Could not geocode destination. Please check the spelling or choose from suggested cities."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # 1. Generate 3 routes with sampled checkpoints
            routes = generate_3_routes(
                origin_lat=float(origin_geo["lat"]),
                origin_lon=float(origin_geo["lon"]),
                dest_lat=float(dest_geo["lat"]),
                dest_lon=float(dest_geo["lon"]),
                departure_dt=departure_dt,
                sample_interval_miles=sample_interval,
            )

            if not routes:
                return Response(
                    {"error": "Routing engine could not find valid routes between specified endpoints."},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            # 2. Sample weather along all checkpoints at arrival ETA and apply risk rules
            enrich_routes_with_weather_and_risk(
                routes=routes,
                load_weight_lb=load_weight_lb,
                departure_dt=departure_dt,
            )

            # 3. Aggregate risk summaries for each route
            for r in routes:
                r["risk_summary"] = aggregate_route_risk(
                    checkpoints=r["checkpoints"],
                    total_distance_miles=r["distance_miles"],
                )

            # 4. Rank and recommend the best route according to safety rules
            ranked_routes = rank_and_recommend_routes(routes)

            # 5. Build 0-48 hour corridor weather heatmap matrix
            heatmap_data = build_corridor_heatmap_data(
                routes=ranked_routes,
                load_weight_lb=load_weight_lb,
                departure_dt=departure_dt,
                max_forecast_hours=48,
            )

            recommended_route_id = ranked_routes[0]["id"] if ranked_routes else 1

            return Response({
                "origin": origin_geo,
                "destination": dest_geo,
                "departure_time": departure_dt.isoformat(),
                "load_weight_lb": load_weight_lb,
                "sample_interval_miles": sample_interval,
                "routes": ranked_routes,
                "recommended_route_id": recommended_route_id,
                "heatmap": heatmap_data,
            })

        except Exception as e:
            logger.exception("Failed to compute weather-aware routes")
            return Response(
                {"error": f"An error occurred while calculating routes: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
