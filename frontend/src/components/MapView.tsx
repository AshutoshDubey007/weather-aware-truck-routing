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

const ARCADE_RISK_COLORS: Record<string, string> = {
  Low: '#16a34a',       // Arcade Green
  Moderate: '#f59e0b',  // Yellow / Amber
  High: '#f97316',      // Arcade Orange
  Severe: '#ef4444',    // Bright Red
  'No Travel': '#7f1d1d', // Dark Red
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

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [39.8283, -98.5795],
      zoom: 4,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Bright, crisp CartoDB Voyager tiles (fits the white, green & orange theme!)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO &copy; OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // HTML5 Canvas overlay for 60fps weather heatmap
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
        const polyline = L.polyline(latLngs, {
          color: route.color || '#ea580c',
          weight: 4,
          opacity: 0.5,
          dashArray: '8, 8',
        });
        polyline.on('click', () => onSelectRoute(route.id));
        polyline.bindTooltip(`<b>${route.name}</b><br>${route.duration_formatted} • ${route.distance_miles} mi`, {
          sticky: true,
          className: 'bg-white text-slate-950 border-2 border-slate-950 font-pixel text-xs p-1 shadow-arcade',
        });
        routeLayers.addLayer(polyline);
      }
    });

    // 2. Selected Route (Highlighted with arcade double-border effect)
    const selectedLatLngs = selectedRoute.coordinates.map((c) => L.latLng(c[0], c[1]));

    // Underlying shadow stroke
    const shadowLine = L.polyline(selectedLatLngs, {
      color: '#09090b',
      weight: 8,
      opacity: 0.9,
    });
    routeLayers.addLayer(shadowLine);

    // Primary bright route stroke (Arcade Green)
    const mainLine = L.polyline(selectedLatLngs, {
      color: selectedRoute.color || '#16a34a',
      weight: 5,
      opacity: 1.0,
    });
    routeLayers.addLayer(mainLine);

    // 3. Origin & Destination Arcade Pins
    if (selectedRoute.coordinates.length > 0) {
      const startCoord = selectedRoute.coordinates[0];
      const endCoord = selectedRoute.coordinates[selectedRoute.coordinates.length - 1];

      // Origin Pin (Arcade Green)
      const originIcon = L.divIcon({
        className: 'arcade-pin-origin',
        html: `
          <div style="
            background: #16a34a;
            color: #ffffff;
            font-family: 'Press Start 2P', cursive;
            font-size: 11px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid #09090b;
            box-shadow: 3px 3px 0px #09090b;
          ">A</div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const originMarker = L.marker([startCoord[0], startCoord[1]], { icon: originIcon });
      originMarker.bindPopup(`
        <div style="padding: 10px; font-family: 'Silkscreen', monospace;">
          <h4 style="font-family: 'Press Start 2P', cursive; font-size: 11px; color: #16a34a; margin: 0 0 6px 0;">[START POINT]</h4>
          <p style="margin: 0; font-size: 12px; color: #09090b;">DEPARTURE: ${selectedRoute.checkpoints[0]?.eta_formatted || 'Scheduled'}</p>
        </div>
      `);
      cpLayers.addLayer(originMarker);

      // Destination Pin (Arcade Orange)
      const destIcon = L.divIcon({
        className: 'arcade-pin-dest',
        html: `
          <div style="
            background: #f97316;
            color: #ffffff;
            font-family: 'Press Start 2P', cursive;
            font-size: 11px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid #09090b;
            box-shadow: 3px 3px 0px #09090b;
          ">B</div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const destMarker = L.marker([endCoord[0], endCoord[1]], { icon: destIcon });
      const lastCp = selectedRoute.checkpoints[selectedRoute.checkpoints.length - 1];
      destMarker.bindPopup(`
        <div style="padding: 10px; font-family: 'Silkscreen', monospace;">
          <h4 style="font-family: 'Press Start 2P', cursive; font-size: 11px; color: #ea580c; margin: 0 0 6px 0;">[GOAL / FINISH]</h4>
          <p style="margin: 0; font-size: 12px; color: #09090b;">FINAL ETA: ${lastCp?.eta_formatted || selectedRoute.duration_formatted}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #09090b;">TOTAL: ${selectedRoute.distance_miles} MILES</p>
        </div>
      `);
      cpLayers.addLayer(destMarker);
    }

    // 4. Render Checkpoints
    selectedRoute.checkpoints.forEach((cp, idx) => {
      if (idx === 0 || idx === selectedRoute.checkpoints.length - 1) return;

      const riskColor = ARCADE_RISK_COLORS[cp.overall_risk] || '#16a34a';
      const isSevereOrNoTravel = cp.overall_risk === 'Severe' || cp.overall_risk === 'No Travel';

      const cpIcon = L.divIcon({
        className: 'custom-arcade-cp',
        html: `
          <div style="
            width: 18px;
            height: 18px;
            background: ${riskColor};
            border: 2px solid #09090b;
            box-shadow: 2px 2px 0px #09090b;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-family: 'Press Start 2P', cursive;
            font-size: 8px;
          ">
            ${isSevereOrNoTravel ? '!' : ''}
          </div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([cp.latitude, cp.longitude], { icon: cpIcon });

      const w = cp.weather;
      const popupHtml = `
        <div style="padding: 12px; min-width: 250px; font-family: 'Silkscreen', monospace;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 2px solid #09090b; padding-bottom: 6px;">
            <span style="font-family: 'Press Start 2P', cursive; font-size: 10px; color: #09090b;">CP #${idx + 1}</span>
            <span style="
              background: ${riskColor};
              color: #ffffff;
              border: 1px solid #09090b;
              padding: 2px 6px;
              font-family: 'Press Start 2P', cursive;
              font-size: 8px;
            ">${cp.overall_risk}</span>
          </div>

          <div style="font-size: 11px; color: #334155; margin-bottom: 8px;">
            <div>MILE: <strong>${cp.distance_from_start_miles.toFixed(1)} MI</strong></div>
            <div>ETA: <strong>${cp.eta_formatted}</strong></div>
          </div>

          <div style="background: #f8fafc; border: 2px solid #09090b; padding: 6px 8px; margin-bottom: 8px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>WEATHER:</span>
              <strong>${w.condition} (${w.temperature_f}°F)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>WIND SPEED:</span>
              <strong style="color: ${cp.wind_risk === 'No Travel' || cp.wind_risk === 'Severe' ? '#dc2626' : '#16a34a'};">
                ${w.wind_speed_mph} MPH (GUST ${w.wind_gusts_mph})
              </strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>RAIN RATE:</span>
              <strong>${w.rain_in_hr} IN/HR</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>SNOW RATE:</span>
              <strong>${w.snow_in_hr} IN/HR</strong>
            </div>
          </div>

          ${cp.advisories && cp.advisories.length > 0 ? `
            <div style="background: #fee2e2; border: 2px solid #dc2626; padding: 6px; font-size: 10px; color: #991b1b; font-weight: bold;">
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
    const baseRadius = Math.max(35, Math.min(160, Math.pow(2, zoom - 2) * 12));

    hourData.points.forEach((pt: HeatmapPoint) => {
      const containerPoint = map.latLngToContainerPoint([pt.lat, pt.lon]);

      let colorStop0 = 'rgba(22, 163, 74, 0.7)'; // Arcade Green
      let colorStop1 = 'rgba(22, 163, 74, 0)';

      if (activeMetric === 'risk') {
        const score = pt.risk_score;
        if (score === 5) colorStop0 = 'rgba(127, 29, 29, 0.85)';
        else if (score === 4) colorStop0 = 'rgba(220, 38, 38, 0.8)';
        else if (score === 3) colorStop0 = 'rgba(234, 88, 12, 0.75)'; // Arcade Orange
        else if (score === 2) colorStop0 = 'rgba(245, 158, 11, 0.7)';
        else colorStop0 = 'rgba(22, 163, 74, 0.6)'; // Arcade Green
      } else if (activeMetric === 'wind') {
        const w = pt.wind_mph;
        if (w >= 55) colorStop0 = 'rgba(127, 29, 29, 0.85)';
        else if (w >= 45) colorStop0 = 'rgba(220, 38, 38, 0.8)';
        else if (w >= 35) colorStop0 = 'rgba(234, 88, 12, 0.75)';
        else if (w >= 25) colorStop0 = 'rgba(245, 158, 11, 0.7)';
        else colorStop0 = 'rgba(22, 163, 74, 0.5)';
      } else if (activeMetric === 'rain') {
        const r = pt.rain_in_hr;
        if (r > 1.0) colorStop0 = 'rgba(127, 29, 29, 0.85)';
        else if (r >= 0.5) colorStop0 = 'rgba(220, 38, 38, 0.8)';
        else if (r >= 0.25) colorStop0 = 'rgba(234, 88, 12, 0.75)';
        else if (r >= 0.10) colorStop0 = 'rgba(2, 132, 199, 0.7)';
        else colorStop0 = 'rgba(22, 163, 74, 0.4)';
      } else if (activeMetric === 'snow') {
        const s = pt.snow_in_hr;
        if (s > 3.0) colorStop0 = 'rgba(127, 29, 29, 0.85)';
        else if (s >= 2.0) colorStop0 = 'rgba(220, 38, 38, 0.8)';
        else if (s >= 1.0) colorStop0 = 'rgba(234, 88, 12, 0.75)';
        else if (s >= 0.5) colorStop0 = 'rgba(96, 165, 250, 0.7)';
        else colorStop0 = 'rgba(22, 163, 74, 0.3)';
      } else if (activeMetric === 'temp') {
        const t = pt.temp_f;
        if (t <= 32) colorStop0 = 'rgba(96, 165, 250, 0.8)';
        else if (t < 50) colorStop0 = 'rgba(20, 184, 166, 0.7)';
        else if (t < 75) colorStop0 = 'rgba(22, 163, 74, 0.6)';
        else if (t < 90) colorStop0 = 'rgba(249, 115, 22, 0.7)';
        else colorStop0 = 'rgba(220, 38, 38, 0.8)';
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

        let colorStop0 = 'rgba(22, 163, 74, 0.7)';
        if (activeMetric === 'risk') {
          const score = pt.risk_score;
          if (score === 5) colorStop0 = 'rgba(127, 29, 29, 0.85)';
          else if (score === 4) colorStop0 = 'rgba(220, 38, 38, 0.8)';
          else if (score === 3) colorStop0 = 'rgba(234, 88, 12, 0.75)';
          else if (score === 2) colorStop0 = 'rgba(245, 158, 11, 0.7)';
          else colorStop0 = 'rgba(22, 163, 74, 0.6)';
        } else if (activeMetric === 'wind') {
          const w = pt.wind_mph;
          if (w >= 55) colorStop0 = 'rgba(127, 29, 29, 0.85)';
          else if (w >= 45) colorStop0 = 'rgba(220, 38, 38, 0.8)';
          else if (w >= 35) colorStop0 = 'rgba(234, 88, 12, 0.75)';
          else if (w >= 25) colorStop0 = 'rgba(245, 158, 11, 0.7)';
          else colorStop0 = 'rgba(22, 163, 74, 0.5)';
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

    const fraction = Math.min(1.0, currentHourIndex / Math.max(1.0, totalDurationHours));
    const targetIdx = Math.floor(fraction * (coords.length - 1));
    const truckCoord = coords[targetIdx];

    const truckIcon = L.divIcon({
      className: 'arcade-truck-marker',
      html: `
        <div style="
          width: 36px;
          height: 36px;
          background: #f97316;
          border: 3px solid #09090b;
          box-shadow: 3px 3px 0px #09090b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        ">🚚</div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
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
      `<b>TRUCK SIMULATOR: +${currentHourIndex}H</b><br>${
        arrived ? 'ARRIVED AT DESTINATION' : `TRAVELED ~${(fraction * selectedRoute.distance_miles).toFixed(0)} MI`
      }`,
      { permanent: false, direction: 'top', className: 'bg-white text-slate-950 border-2 border-slate-950 font-pixel text-xs' }
    );
  }, [currentHourIndex, routes, selectedRouteId]);

  return (
    <div className="relative w-full h-[520px] lg:h-[600px] border-4 border-slate-950 shadow-arcade-lg bg-white overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
