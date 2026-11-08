import { PresetTrip, Place, RouteCalculationResponse } from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<{ status: string }> {
  const resp = await fetch(`${API_BASE}/health/`);
  if (!resp.ok) throw new Error('API health check failed');
  return resp.json();
}

export async function fetchPresets(): Promise<{ presets: PresetTrip[]; hubs: Place[] }> {
  const resp = await fetch(`${API_BASE}/presets/`);
  if (!resp.ok) throw new Error('Failed to load preset trips');
  return resp.json();
}

export async function searchPlaces(query: string): Promise<Place[]> {
  if (!query || query.trim().length < 2) return [];
  const resp = await fetch(`${API_BASE}/geocode/?q=${encodeURIComponent(query)}`);
  if (!resp.ok) return [];
  const data = await resp.json();
  return data.results || [];
}

export interface CalculateRoutesParams {
  origin: string | Place;
  destination: string | Place;
  departure_time: string;
  load_weight_lb: number;
  sample_interval_miles: number;
}

export async function calculateRoutes(params: CalculateRoutesParams): Promise<RouteCalculationResponse> {
  const resp = await fetch(`${API_BASE}/routes/calculate/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!resp.ok) {
    let errorMsg = 'Failed to calculate routes';
    try {
      const errData = await resp.json();
      if (errData.error) errorMsg = errData.error;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return resp.json();
}
