from django.test import TestCase
from routing.services.risk_calculator import (
    classify_wind_base,
    classify_rain,
    classify_snow,
    apply_load_rules,
    calculate_checkpoint_risk,
    aggregate_route_risk,
    rank_and_recommend_routes,
    RiskLevel,
)


class RiskCalculatorTests(TestCase):
    def test_wind_base_classification(self):
        self.assertEqual(classify_wind_base(15.0), RiskLevel.LOW)
        self.assertEqual(classify_wind_base(24.9), RiskLevel.LOW)
        self.assertEqual(classify_wind_base(25.0), RiskLevel.MODERATE)
        self.assertEqual(classify_wind_base(34.0), RiskLevel.MODERATE)
        self.assertEqual(classify_wind_base(35.0), RiskLevel.HIGH)
        self.assertEqual(classify_wind_base(44.0), RiskLevel.HIGH)
        self.assertEqual(classify_wind_base(45.0), RiskLevel.SEVERE)
        self.assertEqual(classify_wind_base(54.0), RiskLevel.SEVERE)
        self.assertEqual(classify_wind_base(55.0), RiskLevel.NO_TRAVEL)
        self.assertEqual(classify_wind_base(65.0), RiskLevel.NO_TRAVEL)

    def test_rain_classification(self):
        self.assertEqual(classify_rain(0.05), RiskLevel.LOW)
        self.assertEqual(classify_rain(0.099), RiskLevel.LOW)
        self.assertEqual(classify_rain(0.10), RiskLevel.MODERATE)
        self.assertEqual(classify_rain(0.25), RiskLevel.MODERATE)
        self.assertEqual(classify_rain(0.26), RiskLevel.HIGH)
        self.assertEqual(classify_rain(0.50), RiskLevel.HIGH)
        self.assertEqual(classify_rain(0.51), RiskLevel.SEVERE)
        self.assertEqual(classify_rain(1.00), RiskLevel.SEVERE)
        self.assertEqual(classify_rain(1.01), RiskLevel.NO_TRAVEL)
        self.assertEqual(classify_rain(2.50), RiskLevel.NO_TRAVEL)

    def test_snow_classification(self):
        self.assertEqual(classify_snow(0.2), RiskLevel.LOW)
        self.assertEqual(classify_snow(0.49), RiskLevel.LOW)
        self.assertEqual(classify_snow(0.50), RiskLevel.MODERATE)
        self.assertEqual(classify_snow(1.00), RiskLevel.MODERATE)
        self.assertEqual(classify_snow(1.01), RiskLevel.HIGH)
        self.assertEqual(classify_snow(2.00), RiskLevel.HIGH)
        self.assertEqual(classify_snow(2.01), RiskLevel.SEVERE)
        self.assertEqual(classify_snow(3.00), RiskLevel.SEVERE)
        self.assertEqual(classify_snow(3.01), RiskLevel.NO_TRAVEL)
        self.assertEqual(classify_snow(4.50), RiskLevel.NO_TRAVEL)

    def test_load_rules_escalation(self):
        # Rule 1: >= 55 mph -> No Travel for any load
        eff_risk, triggers = apply_load_rules(55.0, 15000.0, RiskLevel.NO_TRAVEL)
        self.assertEqual(eff_risk, RiskLevel.NO_TRAVEL)

        # Rule 2: 45–54 mph + >30,000 lb -> No Travel
        # Below threshold (load 25,000 lb) -> remains Severe
        eff_risk, triggers = apply_load_rules(48.0, 25000.0, RiskLevel.SEVERE)
        self.assertEqual(eff_risk, RiskLevel.SEVERE)
        # Above threshold (load 35,000 lb) -> escalated to No Travel
        eff_risk, triggers = apply_load_rules(48.0, 35000.0, RiskLevel.SEVERE)
        self.assertEqual(eff_risk, RiskLevel.NO_TRAVEL)
        self.assertTrue(any("NO TRAVEL" in t for t in triggers))

        # Rule 3: 35–44 mph + >40,000 lb -> Severe
        # Below threshold (load 38,000 lb) -> remains High
        eff_risk, triggers = apply_load_rules(40.0, 38000.0, RiskLevel.HIGH)
        self.assertEqual(eff_risk, RiskLevel.HIGH)
        # Above threshold (load 42,000 lb) -> escalated to Severe
        eff_risk, triggers = apply_load_rules(40.0, 42000.0, RiskLevel.HIGH)
        self.assertEqual(eff_risk, RiskLevel.SEVERE)
        self.assertTrue(any("SEVERE" in t for t in triggers))

    def test_checkpoint_risk_composite(self):
        # Snow is high, wind is moderate, rain is low -> overall should be High
        cp = calculate_checkpoint_risk(
            wind_mph=28.0,
            rain_in_hr=0.05,
            snow_in_hr=1.5,
            load_weight_lb=35000.0
        )
        self.assertEqual(cp["overall_risk"], RiskLevel.HIGH.value)
        self.assertEqual(cp["wind_risk"], RiskLevel.MODERATE.value)
        self.assertEqual(cp["rain_risk"], RiskLevel.LOW.value)
        self.assertEqual(cp["snow_risk"], RiskLevel.HIGH.value)

        # Heavy wind 48 mph with 35k lb load -> overall should be No Travel
        cp2 = calculate_checkpoint_risk(
            wind_mph=48.0,
            rain_in_hr=0.02,
            snow_in_hr=0.0,
            load_weight_lb=35000.0
        )
        self.assertEqual(cp2["overall_risk"], RiskLevel.NO_TRAVEL.value)

    def test_route_aggregation_and_recommendation(self):
        # Route 1: 100 miles, all low risk, duration 2 hours
        r1_checkpoints = [
            {"segment_miles": 50, "overall_risk": RiskLevel.LOW.value},
            {"segment_miles": 50, "overall_risk": RiskLevel.LOW.value},
        ]
        r1_summary = aggregate_route_risk(r1_checkpoints, 100)
        route1 = {
            "id": 1,
            "name": "Route 1",
            "risk_summary": r1_summary,
            "duration_seconds": 7200,
            "duration_formatted": "2h 0m",
        }

        # Route 2: 100 miles, 30 severe miles, duration 1.8 hours
        r2_checkpoints = [
            {"segment_miles": 70, "overall_risk": RiskLevel.LOW.value},
            {"segment_miles": 30, "overall_risk": RiskLevel.SEVERE.value},
        ]
        r2_summary = aggregate_route_risk(r2_checkpoints, 100)
        route2 = {
            "id": 2,
            "name": "Route 2",
            "risk_summary": r2_summary,
            "duration_seconds": 6480,
            "duration_formatted": "1h 48m",
        }

        # Route 3: 100 miles, 20 high miles, duration 1.9 hours
        r3_checkpoints = [
            {"segment_miles": 80, "overall_risk": RiskLevel.LOW.value},
            {"segment_miles": 20, "overall_risk": RiskLevel.HIGH.value},
        ]
        r3_summary = aggregate_route_risk(r3_checkpoints, 100)
        route3 = {
            "id": 3,
            "name": "Route 3",
            "risk_summary": r3_summary,
            "duration_seconds": 6840,
            "duration_formatted": "1h 54m",
        }

        ranked = rank_and_recommend_routes([route2, route3, route1])

        # Preference 1: Fewest Severe miles.
        # Route 1 has 0 severe, Route 3 has 0 severe, Route 2 has 30 severe.
        # Between Route 1 and 3: Route 1 has 0 high miles, Route 3 has 20 high miles.
        # So Route 1 MUST be rank 1 (recommended)!
        self.assertEqual(ranked[0]["name"], "Route 1")
        self.assertTrue(ranked[0]["is_recommended"])
        self.assertEqual(ranked[1]["name"], "Route 3")
        self.assertEqual(ranked[2]["name"], "Route 2")
