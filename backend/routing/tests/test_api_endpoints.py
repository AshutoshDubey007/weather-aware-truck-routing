from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch


class ApiEndpointsTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_check_endpoint(self):
        url = reverse('health-check')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('status'), 'healthy')

    def test_presets_endpoint(self):
        url = reverse('presets')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('presets', response.data)
        self.assertIn('hubs', response.data)
        self.assertGreater(len(response.data['presets']), 0)

    def test_geocode_search_endpoint(self):
        url = reverse('geocode-search')
        response = self.client.get(url, {'q': 'Chicago'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        results = response.data['results']
        self.assertGreater(len(results), 0)
        self.assertIn('Chicago', results[0]['name'])

    def test_route_calculate_validation_failure(self):
        url = reverse('route-calculate')
        # Missing destination
        response = self.client.post(url, {'origin': 'New York, NY'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    @patch('routing.views.generate_3_routes')
    @patch('routing.views.enrich_routes_with_weather_and_risk')
    @patch('routing.views.build_corridor_heatmap_data')
    def test_route_calculate_success_flow(self, mock_heatmap, mock_enrich, mock_routes):
        mock_routes.return_value = [
            {
                "id": 1,
                "name": "Corridor A",
                "summary": "via I-80 W",
                "distance_miles": 790.0,
                "duration_seconds": 50000,
                "duration_formatted": "13 hrs 53 mins",
                "coordinates": [[40.71, -74.00], [41.87, -87.62]],
                "checkpoints": [
                    {"index": 0, "latitude": 40.71, "longitude": -74.00, "segment_miles": 400, "overall_risk": "Low"},
                    {"index": 1, "latitude": 41.87, "longitude": -87.62, "segment_miles": 390, "overall_risk": "Low"},
                ],
            },
            {
                "id": 2,
                "name": "Corridor B",
                "summary": "via I-76 W",
                "distance_miles": 820.0,
                "duration_seconds": 53000,
                "duration_formatted": "14 hrs 43 mins",
                "coordinates": [[40.71, -74.00], [41.87, -87.62]],
                "checkpoints": [
                    {"index": 0, "latitude": 40.71, "longitude": -74.00, "segment_miles": 410, "overall_risk": "High"},
                    {"index": 1, "latitude": 41.87, "longitude": -87.62, "segment_miles": 410, "overall_risk": "Moderate"},
                ],
            },
            {
                "id": 3,
                "name": "Corridor C",
                "summary": "via I-90 W",
                "distance_miles": 850.0,
                "duration_seconds": 56000,
                "duration_formatted": "15 hrs 33 mins",
                "coordinates": [[40.71, -74.00], [41.87, -87.62]],
                "checkpoints": [
                    {"index": 0, "latitude": 40.71, "longitude": -74.00, "segment_miles": 425, "overall_risk": "Severe"},
                    {"index": 1, "latitude": 41.87, "longitude": -87.62, "segment_miles": 425, "overall_risk": "Severe"},
                ],
            },
        ]
        mock_heatmap.return_value = {
            "bounds": {"min_lat": 40, "max_lat": 42, "min_lon": -88, "max_lon": -74},
            "points_count": 50,
            "hours": [],
        }

        url = reverse('route-calculate')
        payload = {
            "origin": "New York, NY",
            "destination": "Chicago, IL",
            "departure_time": "2026-11-08T16:00:00",
            "load_weight_lb": 42000,
            "sample_interval_miles": 25,
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['routes']), 3)
        # Verify recommended route
        self.assertEqual(response.data['recommended_route_id'], 1)
        self.assertTrue(response.data['routes'][0]['is_recommended'])
        self.assertIn('heatmap', response.data)
