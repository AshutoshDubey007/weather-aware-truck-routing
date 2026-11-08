import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RouteOption, HeatmapData, HeatmapPoint } from '../types';
import { HeatmapMetric } from './HeatmapControl';

interface MapViewProps {
  routes: RouteOption[];
  selectedRouteId: number;
  onSelectRoute: (id: number) => void;
  heatmapData: HeatmapData | null;
  currentHourIndex: number;
  activeMetric: HeatmapMetric;
  isHeatmapVisible: boolean;
  heatmapOpacity: number;
}

const RISK_COLORS: Record<string, string> = {
  Low: '#10b981',
  Moderate: '#f59e0b',
  High: '#f97316',
  Severe: '#ef4444',
  'No Travel': '#881337',
};

export const MapView: React.FC<MapViewProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  heatmapData,
  currentHourIndex,
  activeMetric,
  isHeatmapVisible,
  heatmapOpacity,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayersRef = useRef<L.LayerGroup | null>(null);
  const checkpointLayersRef = useRef<L.LayerGroup | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [39.8283, -98.5795], // Geographic center of US
      zoom: 4,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Dark sleek map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Create custom canvas overlay for heatmap
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '350';
    map.getPanes().overlayPane.appendChild(canvas);
    canvasRef.current = canvas;

    routeLayersRef.current = L.layerGroup().addTo(map);
    checkpointLayersRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update canvas size on resize or zoom
  const updateCanvasBounds = () => {
    const map = mapInstanceRef.current;
    const canvas = canvasRef.current;
    if (!map || !canvas) return;

    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;

    const topLeft = map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(canvas, topLeft);
  };

  // Render Routes and Checkpoints
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeLayers = routeLayersRef.current;
    const cpLayers = checkpointLayersRef.current;
    if (!map || !routeLayers || !cpLayers) return;

    routeLayers.clearLayers();
    cpLayers.clearLayers();

    if (!routes || routes.length === 0) return;

    const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
    const allBounds = L.latLngBounds([]);

    // 1. Render all 3 route polylines
    routes.forEach((route) => {
      const isSelected = route.id === selectedRoute.id;
      const latLngs = route.coordinates.map((c) => L.latLng(c[0], c[1]));
      latLngs.forEach((ll) => allBounds.extend(ll));

      if (!isSelected) {
        // Background alternate routes
        const polyline = L.polyline(latLngs, {
          color: route.color,
          weight: 4,
          opacity: 0.5,
          dashArray: '6, 8',
        });
        polyline.on('click', () => onSelectRoute(route.id));
        polyline.bindTooltip(`<b>${route.name}</b><br>${route.duration_formatted} • ${route.distance_miles} mi`, {
          sticky: true,
          className: 'bg-slate-900 text-slate-100 border border-slate-700 px-2 py-1 rounded text-xs',
        });
        routeLayers.addLayer(polyline);
      }
    });

    // 2. Render Selected Route on top with glow and risk-colored segments
    const selectedLatLngs = selectedRoute.coordinates.map((c) => L.latLng(c[0], c[1]));

    // Underlying glow
    const glowLine = L.polyline(selectedLatLngs, {
      color: '#38bdf8',
      weight: 8,
      opacity: 0.35,
    });
    routeLayers.addLayer(glowLine);

    // Primary vibrant line
    const mainLine = L.polyline(selectedLatLngs, {
      color: selectedRoute.color,
      weight: 5,
      opacity: 0.95,
    });
    routeLayers.addLayer(mainLine);

    // 3. Render Origin & Destination Pins
    if (selectedRoute.coordinates.length > 0) {
      const startCoord = selectedRoute.coordinates[0];
      const endCoord = selectedRoute.coordinates[selectedRoute.coordinates.length - 1];

      // Origin Pin
      const originIcon = L.divIcon({
        className: 'custom-pin',
        html: `
          <div style="
            background: #10b981;
            color: #022c22;
            font-weight: 800;
            font-size: 11px;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          ">A</div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const originMarker = L.marker([startCoord[0], startCoord[1]], { icon: originIcon });
      originMarker.bindPopup(`
        <div style="padding: 10px;">
          <h4 style="font-weight: bold; color: #10b981; margin: 0 0 4px 0; font-size: 13px;">Trip Origin</h4>
          <p style="margin: 0; font-size: 11px; color: #cbd5e1;">Departure: ${selectedRoute.checkpoints[0]?.eta_formatted || 'Scheduled'}</p>
        </div>
      `);
      cpLayers.addLayer(originMarker);

      // Destination Pin
      const destIcon = L.divIcon({
        className: 'custom-pin',
        html: `
          <div style="
            background: #ef4444;
            color: #ffffff;
            font-weight: 800;
            font-size: 11px;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          ">B</div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const destMarker = L.marker([endCoord[0], endCoord[1]], { icon: destIcon });
      const lastCp = selectedRoute.checkpoints[selectedRoute.checkpoints.length - 1];
      destMarker.bindPopup(`
        <div style="padding: 10px;">
          <h4 style="font-weight: bold; color: #ef4444; margin: 0 0 4px 0; font-size: 13px;">Trip Destination</h4>
          <p style="margin: 0; font-size: 11px; color: #cbd5e1;">Final ETA: ${lastCp?.eta_formatted || selectedRoute.duration_formatted}</p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #cbd5e1;">Total Distance: ${selectedRoute.distance_miles} miles</p>
        </div>
      `);
      cpLayers.addLayer(destMarker);
    }

    // 4. Render Checkpoints for Selected Route
    selectedRoute.checkpoints.forEach((cp, idx) => {
      // Skip very first and very last point to not overlap with pins
      if (idx === 0 || idx === selectedRoute.checkpoints.length - 1) return;

      const riskColor = RISK_COLORS[cp.overall_risk] || '#10b981';
      const isSevereOrNoTravel = cp.overall_risk === 'Severe' || cp.overall_risk === 'No Travel';

      const cpIcon = L.divIcon({
        className: 'custom-cp',
        html: `
          <div style="
            position: relative;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${isSevereOrNoTravel ? `
              <div style="
                position: absolute;
                inset: -4px;
                border-radius: 50%;
                background: ${riskColor};
                opacity: 0.4;
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>
            ` : ''}
            <div style="
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: ${riskColor};
              border: 2px solid #ffffff;
              box-shadow: 0 2px 6px rgba(0,0,0,0.6);
            "></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([cp.latitude, cp.longitude], { icon: cpIcon });

      const w = cp.weather;
      const popupHtml = `
        <div style="padding: 12px; min-width: 230px; font-family: sans-serif;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: 700; font-size: 13px; color: #ffffff;">Checkpoint #${idx + 1}</span>
            <span style="
              background: ${riskColor}22;
              color: ${riskColor};
              border: 1px solid ${riskColor}66;
              padding: 2px 6px;
              border-radius: 9999px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
            ">${cp.overall_risk}</span>
          </div>

          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            <div>📍 Mile ${cp.distance_from_start_miles.toFixed(1)}</div>
            <div>⏱️ Arrival ETA: <strong style="color: #e2e8f0;">${cp.eta_formatted}</strong></div>
          </div>

          <div style="background: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 8px; margin-bottom: 8px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #94a3b8;">Condition:</span>
              <span style="color: #ffffff; font-weight: 600;">${w.condition} (${w.temperature_f}°F)</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #94a3b8;">Wind Speed:</span>
              <span style="color: ${cp.wind_risk === 'No Travel' || cp.wind_risk === 'Severe' ? '#ef4444' : '#ffffff'}; font-weight: 600;">
                ${w.wind_speed_mph} mph (gusts ${w.wind_gusts_mph} mph)
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #94a3b8;">Rain Rate:</span>
              <span style="color: #ffffff; font-weight: 600;">${w.rain_in_hr} in/hr</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Snowfall:</span>
              <span style="color: #ffffff; font-weight: 600;">${w.snow_in_hr} in/hr</span>
            </div>
          </div>

          ${cp.advisories && cp.advisories.length > 0 ? `
            <div style="background: #ef444415; border: 1px solid #ef444440; border-radius: 6px; padding: 6px 8px; font-size: 10px; color: #fca5a5; line-height: 1.3;">
              ⚠️ ${cp.advisories.join('<br>')}
            </div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml);
      cpLayers.addLayer(marker);
    });

    if (allBounds.isValid()) {
      map.fitBounds(allBounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [routes, selectedRouteId, onSelectRoute]);

  // Render HTML5 Canvas Weather Heatmap along the corridor
  useEffect(() => {
    const map = mapInstanceRef.current;
    const canvas = canvasRef.current;
    if (!map || !canvas) return;

    updateCanvasBounds();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isHeatmapVisible || !heatmapData || !heatmapData.hours || heatmapData.hours.length === 0) {
      return;
    }

    const hourData = heatmapData.hours[currentHourIndex] || heatmapData.hours[0];
    if (!hourData || !hourData.points) return;

    ctx.save();
    ctx.globalAlpha = heatmapOpacity;

    const zoom = map.getZoom();
    // Dynamically scale heat spot radius based on map zoom
    const baseRadius = Math.max(35, Math.min(160, Math.pow(2, zoom - 2) * 12));

    hourData.points.forEach((pt: HeatmapPoint) => {
      const containerPoint = map.latLngToContainerPoint([pt.lat, pt.lon]);

      // Calculate metric intensity and color
      let colorStop0 = 'rgba(16, 185, 129, 0.7)'; // Low Green
      let colorStop1 = 'rgba(16, 185, 129, 0)';

      if (activeMetric === 'risk') {
        const score = pt.risk_score;
        if (score === 5) {
          colorStop0 = 'rgba(136, 19, 55, 0.85)'; // No Travel burgundy
        } else if (score === 4) {
          colorStop0 = 'rgba(239, 68, 68, 0.8)'; // Severe red
        } else if (score === 3) {
          colorStop0 = 'rgba(249, 115, 22, 0.75)'; // High orange
        } else if (score === 2) {
          colorStop0 = 'rgba(245, 158, 11, 0.7)'; // Moderate amber
        } else {
          colorStop0 = 'rgba(16, 185, 129, 0.6)'; // Low green
        }
      } else if (activeMetric === 'wind') {
        const w = pt.wind_mph;
        if (w >= 55) colorStop0 = 'rgba(136, 19, 55, 0.85)';
        else if (w >= 45) colorStop0 = 'rgba(239, 68, 68, 0.8)';
        else if (w >= 35) colorStop0 = 'rgba(249, 115, 22, 0.75)';
        else if (w >= 25) colorStop0 = 'rgba(245, 158, 11, 0.7)';
        else colorStop0 = 'rgba(16, 185, 129, 0.5)';
      } else if (activeMetric === 'rain') {
        const r = pt.rain_in_hr;
        if (r > 1.0) colorStop0 = 'rgba(136, 19, 55, 0.85)';
        else if (r >= 0.5) colorStop0 = 'rgba(239, 68, 68, 0.8)';
        else if (r >= 0.25) colorStop0 = 'rgba(249, 115, 22, 0.75)';
        else if (r >= 0.10) colorStop0 = 'rgba(59, 130, 246, 0.7)';
        else colorStop0 = 'rgba(16, 185, 129, 0.4)';
      } else if (activeMetric === 'snow') {
        const s = pt.snow_in_hr;
        if (s > 3.0) colorStop0 = 'rgba(136, 19, 55, 0.85)';
        else if (s >= 2.0) colorStop0 = 'rgba(239, 68, 68, 0.8)';
        else if (s >= 1.0) colorStop0 = 'rgba(249, 115, 22, 0.75)';
        else if (s >= 0.5) colorStop0 = 'rgba(147, 197, 253, 0.7)';
        else colorStop0 = 'rgba(16, 185, 129, 0.3)';
      } else if (activeMetric === 'temp') {
        const t = pt.temp_f;
        if (t <= 32) colorStop0 = 'rgba(147, 197, 253, 0.8)'; // Freezing blue
        else if (t < 50) colorStop0 = 'rgba(45, 212, 191, 0.7)'; // Cool teal
        else if (t < 75) colorStop0 = 'rgba(16, 185, 129, 0.6)'; // Mild green
        else if (t < 90) colorStop0 = 'rgba(245, 158, 11, 0.7)'; // Warm amber
        else colorStop0 = 'rgba(239, 68, 68, 0.8)'; // Hot red
      }

      // Draw smooth radial gradient heat circle
      const grad = ctx.createRadialGradient(
        containerPoint.x,
        containerPoint.y,
        0,
        containerPoint.x,
        containerPoint.y,
        baseRadius
      );
      grad.addColorStop(0, colorStop0);
      grad.addColorStop(0.5, colorStop0.replace(/[\d\.]+\)$/, '0.35)'));
      grad.addColorStop(1, colorStop1);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(containerPoint.x, containerPoint.y, baseRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }, [heatmapData, currentHourIndex, activeMetric, isHeatmapVisible, heatmapOpacity]);

  // Hook map events to redraw canvas on pan and zoom
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapMove = () => {
      updateCanvasBounds();
      // Trigger canvas re-render
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx || !isHeatmapVisible || !heatmapData || !heatmapData.hours) return;

      const hourData = heatmapData.hours[currentHourIndex] || heatmapData.hours[0];
      if (!hourData || !hourData.points) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.globalAlpha = heatmapOpacity;

      const zoom = map.getZoom();
      const baseRadius = Math.max(35, Math.min(160, Math.pow(2, zoom - 2) * 12));

      hourData.points.forEach((pt: HeatmapPoint) => {
        const containerPoint = map.latLngToContainerPoint([pt.lat, pt.lon]);

        let colorStop0 = 'rgba(16, 185, 129, 0.7)';
        if (activeMetric === 'risk') {
          const score = pt.risk_score;
          if (score === 5) colorStop0 = 'rgba(136, 19, 55, 0.85)';
          else if (score === 4) colorStop0 = 'rgba(239, 68, 68, 0.8)';
          else if (score === 3) colorStop0 = 'rgba(249, 115, 22, 0.75)';
          else if (score === 2) colorStop0 = 'rgba(245, 158, 11, 0.7)';
          else colorStop0 = 'rgba(16, 185, 129, 0.6)';
        } else if (activeMetric === 'wind') {
          const w = pt.wind_mph;
          if (w >= 55) colorStop0 = 'rgba(136, 19, 55, 0.85)';
          else if (w >= 45) colorStop0 = 'rgba(239, 68, 68, 0.8)';
          else if (w >= 35) colorStop0 = 'rgba(249, 115, 22, 0.75)';
          else if (w >= 25) colorStop0 = 'rgba(245, 158, 11, 0.7)';
          else colorStop0 = 'rgba(16, 185, 129, 0.5)';
        }

        const grad = ctx.createRadialGradient(
          containerPoint.x,
          containerPoint.y,
          0,
          containerPoint.x,
          containerPoint.y,
          baseRadius
        );
        grad.addColorStop(0, colorStop0);
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(containerPoint.x, containerPoint.y, baseRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    };

    map.on('move', handleMapMove);
    map.on('zoom', handleMapMove);
    map.on('resize', handleMapMove);

    return () => {
      map.off('move', handleMapMove);
      map.off('zoom', handleMapMove);
      map.off('resize', handleMapMove);
    };
  }, [heatmapData, currentHourIndex, activeMetric, isHeatmapVisible, heatmapOpacity]);

  // Truck position indicator during 48h simulation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !routes || routes.length === 0) return;

    const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
    const totalDurationHours = selectedRoute.duration_seconds / 3600.0;
    const coords = selectedRoute.coordinates;

    if (!coords || coords.length === 0) return;

    if (currentHourIndex === 0) {
      if (truckMarkerRef.current) {
        map.removeLayer(truckMarkerRef.current);
        truckMarkerRef.current = null;
      }
      return;
    }

    // Fraction along route
    const fraction = Math.min(1.0, currentHourIndex / Math.max(1.0, totalDurationHours));
    const targetIdx = Math.floor(fraction * (coords.length - 1));
    const truckCoord = coords[targetIdx];

    const truckIcon = L.divIcon({
      className: 'truck-sim-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #0284c7;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          animation: pulse 1s infinite;
        ">🚚</div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (truckMarkerRef.current) {
      truckMarkerRef.current.setLatLng([truckCoord[0], truckCoord[1]]);
    } else {
      truckMarkerRef.current = L.marker([truckCoord[0], truckCoord[1]], {
        icon: truckIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    }

    const arrived = fraction >= 1.0;
    truckMarkerRef.current.bindTooltip(
      `<b>Truck Position at +${currentHourIndex}h</b><br>${
        arrived ? 'Arrived at Destination' : `Traveled ~${(fraction * selectedRoute.distance_miles).toFixed(0)} mi`
      }`,
      { permanent: false, direction: 'top' }
    );
  }, [currentHourIndex, routes, selectedRouteId]);

  return (
    <div className="relative w-full h-[520px] lg:h-[600px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
