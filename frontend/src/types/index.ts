export type RiskLevelType = 'Low' | 'Moderate' | 'High' | 'Severe' | 'No Travel';

export interface Place {
  name: string;
  lat: number;
  lon: number;
  state?: string;
  country?: string;
}

export interface PresetTrip {
  id: string;
  title: string;
  description: string;
  origin: string;
  destination: string;
  default_weight: number;
  sample_interval: number;
}

export interface WeatherData {
  temperature_f: number;
  wind_speed_mph: number;
  wind_gusts_mph: number;
  rain_in_hr: number;
  snow_in_hr: number;
  precipitation_in_hr: number;
  weather_code: number;
  condition: string;
}

export interface Checkpoint {
  index: number;
  latitude: number;
  longitude: number;
  distance_from_start_miles: number;
  elapsed_seconds: number;
  eta_iso: string;
  eta_formatted: string;
  segment_miles: number;
  weather: WeatherData;
  overall_risk: RiskLevelType;
  risk_score: number;
  wind_risk: RiskLevelType;
  base_wind_risk: RiskLevelType;
  rain_risk: RiskLevelType;
  snow_risk: RiskLevelType;
  advisories: string[];
}

export interface RiskSummary {
  no_travel_miles: number;
  severe_miles: number;
  high_miles: number;
  moderate_miles: number;
  low_miles: number;
  average_risk_score: number;
  average_risk_level: RiskLevelType;
  worst_risk_level: RiskLevelType;
}

export interface RouteOption {
  id: number;
  name: string;
  color: string;
  summary: string;
  distance_miles: number;
  duration_seconds: number;
  duration_formatted: string;
  coordinates: [number, number][];
  checkpoints: Checkpoint[];
  checkpoint_count: number;
  sample_interval_miles: number;
  risk_summary: RiskSummary;
  rank: number;
  is_recommended: boolean;
  recommendation_badge: string;
  recommendation_rationale: string;
}

export interface HeatmapPoint {
  lat: number;
  lon: number;
  wind_mph: number;
  gusts_mph: number;
  rain_in_hr: number;
  snow_in_hr: number;
  precip_in_hr: number;
  temp_f: number;
  risk_score: number;
  risk_level: RiskLevelType;
}

export interface HeatmapHour {
  hour_offset: number;
  label: string;
  timestamp: string;
  points: HeatmapPoint[];
}

export interface HeatmapData {
  bounds: {
    min_lat: number;
    max_lat: number;
    min_lon: number;
    max_lon: number;
  };
  points_count: number;
  hours: HeatmapHour[];
}

export interface RouteCalculationResponse {
  origin: Place;
  destination: Place;
  departure_time: string;
  load_weight_lb: number;
  sample_interval_miles: number;
  routes: RouteOption[];
  recommended_route_id: number;
  heatmap: HeatmapData;
}
