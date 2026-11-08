"""
Weather and Load Risk Calculation Engine.
Strictly implements the safety rules specified in the Weather-Aware Truck Routing specification.
"""
from typing import Dict, Any, List, Tuple
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    SEVERE = "Severe"
    NO_TRAVEL = "No Travel"


# Numeric mapping for risk calculation and averaging
RISK_SCORES: Dict[RiskLevel, int] = {
    RiskLevel.LOW: 1,
    RiskLevel.MODERATE: 2,
    RiskLevel.HIGH: 3,
    RiskLevel.SEVERE: 4,
    RiskLevel.NO_TRAVEL: 5,
}

# Inverted mapping to retrieve risk level by rank
SCORE_TO_RISK = {v: k for k, v in RISK_SCORES.items()}


def classify_wind_base(wind_mph: float) -> RiskLevel:
    """
    Base wind thresholds:
    - Low: < 25 mph
    - Moderate: 25 - 34 mph
    - High: 35 - 44 mph
    - Severe: 45 - 54 mph
    - No Travel: >= 55 mph
    """
    if wind_mph < 25.0:
        return RiskLevel.LOW
    elif wind_mph < 35.0:  # 25 - 34
        return RiskLevel.MODERATE
    elif wind_mph < 45.0:  # 35 - 44
        return RiskLevel.HIGH
    elif wind_mph < 55.0:  # 45 - 54
        return RiskLevel.SEVERE
    else:  # >= 55 mph
        return RiskLevel.NO_TRAVEL


def classify_rain(rain_in_hr: float) -> RiskLevel:
    """
    Rain thresholds (in/hr):
    - Low: < 0.10 in/hr
    - Moderate: 0.10 - 0.25 in/hr
    - High: 0.25 - 0.50 in/hr
    - Severe: 0.50 - 1.00 in/hr
    - No Travel: > 1.00 in/hr
    """
    if rain_in_hr < 0.10:
        return RiskLevel.LOW
    elif rain_in_hr <= 0.25:
        return RiskLevel.MODERATE
    elif rain_in_hr <= 0.50:
        return RiskLevel.HIGH
    elif rain_in_hr <= 1.00:
        return RiskLevel.SEVERE
    else:
        return RiskLevel.NO_TRAVEL


def classify_snow(snow_in_hr: float) -> RiskLevel:
    """
    Snow thresholds (in/hr):
    - Low: < 0.5 in/hr
    - Moderate: 0.5 - 1.0 in/hr
    - High: 1.0 - 2.0 in/hr
    - Severe: 2.0 - 3.0 in/hr
    - No Travel: > 3.0 in/hr
    """
    if snow_in_hr < 0.5:
        return RiskLevel.LOW
    elif snow_in_hr <= 1.0:
        return RiskLevel.MODERATE
    elif snow_in_hr <= 2.0:
        return RiskLevel.HIGH
    elif snow_in_hr <= 3.0:
        return RiskLevel.SEVERE
    else:
        return RiskLevel.NO_TRAVEL


def apply_load_rules(wind_mph: float, load_weight_lb: float, base_wind_risk: RiskLevel) -> Tuple[RiskLevel, List[str]]:
    """
    Load rules:
    - >= 55 mph -> No Travel for any load
    - 45–54 mph + >30,000 lb -> No Travel (escalated from Severe)
    - 35–44 mph + >40,000 lb -> Severe (escalated from High)

    Returns (effective_wind_risk, trigger_advisories)
    """
    triggers = []
    effective_wind = base_wind_risk

    if wind_mph >= 55.0:
        effective_wind = RiskLevel.NO_TRAVEL
        triggers.append(f"Wind speed {wind_mph:.1f} mph exceeds 55 mph (No Travel mandatory for any load weight)")
    elif 45.0 <= wind_mph < 55.0:
        if load_weight_lb > 30000.0:
            effective_wind = RiskLevel.NO_TRAVEL
            triggers.append(
                f"Wind speed {wind_mph:.1f} mph with load weight {load_weight_lb:,.0f} lb (> 30,000 lb) triggers NO TRAVEL restriction"
            )
        else:
            effective_wind = RiskLevel.SEVERE
            triggers.append(f"Wind speed {wind_mph:.1f} mph classified as Severe (load {load_weight_lb:,.0f} lb <= 30,000 lb)")
    elif 35.0 <= wind_mph < 45.0:
        if load_weight_lb > 40000.0:
            effective_wind = RiskLevel.SEVERE
            triggers.append(
                f"Wind speed {wind_mph:.1f} mph with load weight {load_weight_lb:,.0f} lb (> 40,000 lb) escalated to SEVERE"
            )
        else:
            effective_wind = RiskLevel.HIGH
            triggers.append(f"Wind speed {wind_mph:.1f} mph classified as High")

    return effective_wind, triggers


def calculate_checkpoint_risk(
    wind_mph: float,
    rain_in_hr: float,
    snow_in_hr: float,
    load_weight_lb: float
) -> Dict[str, Any]:
    """
    Computes overall and per-factor risk for a checkpoint.
    """
    base_wind_risk = classify_wind_base(wind_mph)
    effective_wind_risk, load_advisories = apply_load_rules(wind_mph, load_weight_lb, base_wind_risk)
    rain_risk = classify_rain(rain_in_hr)
    snow_risk = classify_snow(snow_in_hr)

    # Checkpoint overall risk is the maximum severity among conditions
    all_risks = [effective_wind_risk, rain_risk, snow_risk]
    max_score = max(RISK_SCORES[r] for r in all_risks)
    overall_risk = SCORE_TO_RISK[max_score]

    reasons = list(load_advisories)
    if rain_risk in (RiskLevel.HIGH, RiskLevel.SEVERE, RiskLevel.NO_TRAVEL):
        reasons.append(f"Rain precipitation {rain_in_hr:.2f} in/hr classified as {rain_risk.value}")
    if snow_risk in (RiskLevel.HIGH, RiskLevel.SEVERE, RiskLevel.NO_TRAVEL):
        reasons.append(f"Snowfall rate {snow_in_hr:.2f} in/hr classified as {snow_risk.value}")

    return {
        "overall_risk": overall_risk.value,
        "risk_score": max_score,
        "wind_risk": effective_wind_risk.value,
        "base_wind_risk": base_wind_risk.value,
        "rain_risk": rain_risk.value,
        "snow_risk": snow_risk.value,
        "advisories": reasons,
    }


def aggregate_route_risk(checkpoints: List[Dict[str, Any]], total_distance_miles: float) -> Dict[str, Any]:
    """
    Aggregates risk metrics along a route's sampled checkpoints and segments.
    Computes exact miles spent in Low, Moderate, High, Severe, and No Travel conditions.
    """
    if not checkpoints:
        return {
            "no_travel_miles": 0.0,
            "severe_miles": 0.0,
            "high_miles": 0.0,
            "moderate_miles": 0.0,
            "low_miles": 0.0,
            "average_risk_score": 1.0,
            "average_risk_level": RiskLevel.LOW.value,
            "worst_risk_level": RiskLevel.LOW.value,
        }

    # Each checkpoint represents a segment distance
    # For N checkpoints, segment i covers distance between checkpoint i and i+1,
    # or each checkpoint carries its segment_miles.
    miles_by_risk = {
        RiskLevel.LOW.value: 0.0,
        RiskLevel.MODERATE.value: 0.0,
        RiskLevel.HIGH.value: 0.0,
        RiskLevel.SEVERE.value: 0.0,
        RiskLevel.NO_TRAVEL.value: 0.0,
    }

    weighted_risk_sum = 0.0
    accumulated_distance = 0.0
    worst_score = 1

    for cp in checkpoints:
        seg_dist = cp.get("segment_miles", 0.0)
        risk_val = cp.get("overall_risk", RiskLevel.LOW.value)
        score = RISK_SCORES.get(RiskLevel(risk_val), 1)

        miles_by_risk[risk_val] += seg_dist
        weighted_risk_sum += score * seg_dist
        accumulated_distance += seg_dist
        if score > worst_score:
            worst_score = score

    # Normalize if total segment miles differs slightly from total_distance_miles
    denom = accumulated_distance if accumulated_distance > 0 else (total_distance_miles or 1.0)
    avg_score = weighted_risk_sum / denom if denom > 0 else 1.0

    # Determine average risk level label
    if avg_score <= 1.5:
        avg_level = RiskLevel.LOW.value
    elif avg_score <= 2.5:
        avg_level = RiskLevel.MODERATE.value
    elif avg_score <= 3.5:
        avg_level = RiskLevel.HIGH.value
    elif avg_score <= 4.5:
        avg_level = RiskLevel.SEVERE.value
    else:
        avg_level = RiskLevel.NO_TRAVEL.value

    return {
        "no_travel_miles": round(miles_by_risk[RiskLevel.NO_TRAVEL.value], 1),
        "severe_miles": round(miles_by_risk[RiskLevel.SEVERE.value], 1),
        "high_miles": round(miles_by_risk[RiskLevel.HIGH.value], 1),
        "moderate_miles": round(miles_by_risk[RiskLevel.MODERATE.value], 1),
        "low_miles": round(miles_by_risk[RiskLevel.LOW.value], 1),
        "average_risk_score": round(avg_score, 2),
        "average_risk_level": avg_level,
        "worst_risk_level": SCORE_TO_RISK[worst_score].value,
    }


def rank_and_recommend_routes(routes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Ranks routes according to specification requirements:
    Prefer:
    1. Fewest Severe miles (and routes with 0 No Travel miles prioritized)
    2. Fewest High miles
    3. Lowest average risk
    4. Shortest travel times

    Returns sorted list with recommendation metadata and comparative rationale.
    """
    if not routes:
        return []

    def sort_key(route: Dict[str, Any]):
        risk_summary = route.get("risk_summary", {})
        no_travel_miles = risk_summary.get("no_travel_miles", 0.0)
        severe_miles = risk_summary.get("severe_miles", 0.0)
        high_miles = risk_summary.get("high_miles", 0.0)
        avg_score = risk_summary.get("average_risk_score", 1.0)
        duration_seconds = route.get("duration_seconds", 0)

        # Multi-factor priority tuple:
        # 1. No Travel miles (critical safety boundary)
        # 2. Severe miles
        # 3. High miles
        # 4. Average risk
        # 5. Travel duration
        return (no_travel_miles, severe_miles, high_miles, avg_score, duration_seconds)

    sorted_routes = sorted(routes, key=sort_key)

    # Annotate recommendation rationale
    recommended = sorted_routes[0]
    for idx, r in enumerate(sorted_routes):
        r["rank"] = idx + 1
        r["is_recommended"] = (idx == 0)
        r_risk = r.get("risk_summary", {})

        if idx == 0:
            reasons = []
            if r_risk.get("no_travel_miles", 0) == 0:
                reasons.append("Zero 'No Travel' hazard miles")
            if r_risk.get("severe_miles", 0) == 0:
                reasons.append("Zero Severe weather miles")
            else:
                reasons.append(f"Lowest Severe exposure ({r_risk.get('severe_miles')} mi)")
            reasons.append(f"Lowest composite risk ({r_risk.get('average_risk_score')}/5.0)")
            reasons.append(f"ETA: {r.get('duration_formatted')}")
            r["recommendation_badge"] = "SAFEST & RECOMMENDED"
            r["recommendation_rationale"] = "Optimal route balancing weather risk and travel time: " + ", ".join(reasons) + "."
        else:
            rec_risk = recommended.get("risk_summary", {})
            diff_severe = r_risk.get("severe_miles", 0) - rec_risk.get("severe_miles", 0)
            diff_high = r_risk.get("high_miles", 0) - rec_risk.get("high_miles", 0)
            diff_time = (r.get("duration_seconds", 0) - recommended.get("duration_seconds", 0)) / 60.0

            contrast = []
            if r_risk.get("no_travel_miles", 0) > 0:
                contrast.append(f"Contains {r_risk.get('no_travel_miles')} mi of dangerous NO TRAVEL conditions")
            if diff_severe > 0:
                contrast.append(f"{diff_severe:.1f} more severe miles than recommended route")
            if diff_high > 0:
                contrast.append(f"{diff_high:.1f} more high risk miles")
            if diff_time > 0:
                contrast.append(f"{diff_time:.0f} mins slower")
            elif diff_time < 0:
                contrast.append(f"{abs(diff_time):.0f} mins faster but with significantly higher weather risk")

            r["recommendation_badge"] = f"Option #{idx+1}"
            r["recommendation_rationale"] = "; ".join(contrast) if contrast else "Alternative viable route option."

    return sorted_routes
