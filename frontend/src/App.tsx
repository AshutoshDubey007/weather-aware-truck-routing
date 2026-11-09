import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { RouteInputForm } from './components/RouteInputForm';
import { RouteCards } from './components/RouteCards';
import { MapView } from './components/MapView';
import { HeatmapControl, HeatmapMetric } from './components/HeatmapControl';
import { CheckpointTimeline } from './components/CheckpointTimeline';
import { RouteComparisonTable } from './components/RouteComparisonTable';
import { RiskLegend } from './components/RiskLegend';
import { RiskRulesModal } from './components/RiskRulesModal';
import { RouteCalculationResponse, PresetTrip } from './types';
import { calculateRoutes, fetchPresets } from './services/api';
import { AlertCircle, BarChart3, ListFilter, Gamepad2 } from 'lucide-react';

export const App: React.FC = () => {
  const [routeData, setRouteData] = useState<RouteCalculationResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<PresetTrip[]>([]);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);

  // Heatmap state
  const [currentHourIndex, setCurrentHourIndex] = useState<number>(0);
  const [activeMetric, setActiveMetric] = useState<HeatmapMetric>('risk');
  const [isHeatmapVisible, setIsHeatmapVisible] = useState<boolean>(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.65);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison'>('overview');

  // Load presets on mount
  useEffect(() => {
    fetchPresets()
      .then((data) => {
        if (data.presets) setPresets(data.presets);
      })
      .catch((err) => console.warn('Could not load presets:', err));
  }, []);

  // Initial calculation on mount (NYC to Chicago, standard 42,000 lb haul)
  useEffect(() => {
    const initialRun = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const now = new Date();
        const data = await calculateRoutes({
          origin: 'New York, NY',
          destination: 'Chicago, IL',
          departure_time: now.toISOString(),
          load_weight_lb: 42000,
          sample_interval_miles: 25,
        });
        setRouteData(data);
        setSelectedRouteId(data.recommended_route_id || 1);
      } catch (err: any) {
        setError(err.message || 'Failed to load initial routing data');
      } finally {
        setIsLoading(false);
      }
    };
    initialRun();
  }, []);

  const handleCalculate = async (params: {
    origin: string;
    destination: string;
    departure_time: string;
    load_weight_lb: number;
    sample_interval_miles: number;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await calculateRoutes(params);
      setRouteData(data);
      setSelectedRouteId(data.recommended_route_id || 1);
      setCurrentHourIndex(0); // Reset simulation hour
    } catch (err: any) {
      setError(err.message || 'Error calculating routes');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRoute = routeData?.routes.find((r) => r.id === selectedRouteId) || routeData?.routes[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-pixel selection:bg-orange-500 selection:text-white">
      <Navbar onOpenRules={() => setIsRulesModalOpen(true)} />

      <main className="flex-1 max-w-[1680px] w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-red-50 border-4 border-red-600 text-red-900 shadow-arcade flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-arcade text-xs uppercase text-red-800">SYSTEM ERROR // CALCULATION HALTED</p>
                <p className="text-xs text-red-900 mt-1 font-bold">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="px-3 py-1 font-arcade text-[10px] bg-red-600 hover:bg-red-500 text-white border-2 border-slate-950 shadow-arcade-press"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Input Parameters Form */}
        <RouteInputForm
          onCalculate={handleCalculate}
          isLoading={isLoading}
          presets={presets}
        />

        {/* Evaluated Route Cards */}
        {routeData && (
          <RouteCards
            routes={routeData.routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => setSelectedRouteId(id)}
          />
        )}

        {/* Main Map, Heatmap and Details Layout */}
        {routeData && (
          <div className="space-y-6">
            {/* Map with Floating Legend */}
            <div className="relative">
              <MapView
                routes={routeData.routes}
                selectedRouteId={selectedRouteId}
                onSelectRoute={(id) => setSelectedRouteId(id)}
                heatmapData={routeData.heatmap}
                currentHourIndex={currentHourIndex}
                activeMetric={activeMetric}
                isHeatmapVisible={isHeatmapVisible}
                heatmapOpacity={heatmapOpacity}
              />
              <RiskLegend activeMetric={activeMetric} />
            </div>

            {/* 0-48h Heatmap Forecast Slider & Metric Selector */}
            {routeData.heatmap && (
              <HeatmapControl
                hours={routeData.heatmap.hours}
                currentHourIndex={currentHourIndex}
                onHourChange={setCurrentHourIndex}
                activeMetric={activeMetric}
                onMetricChange={setActiveMetric}
                isVisible={isHeatmapVisible}
                onToggleVisible={() => setIsHeatmapVisible(!isHeatmapVisible)}
                opacity={heatmapOpacity}
                onOpacityChange={setHeatmapOpacity}
              />
            )}

            {/* View Switching Tabs */}
            <div className="flex items-center gap-3 pb-2 border-b-2 border-slate-950">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 font-arcade text-xs border-2 border-slate-950 transition-all flex items-center gap-2 ${
                  activeTab === 'overview'
                    ? 'bg-emerald-600 text-white shadow-arcade-press translate-x-0.5 translate-y-0.5'
                    : 'bg-white text-slate-900 hover:bg-emerald-50 shadow-arcade'
                }`}
              >
                <ListFilter className="w-4 h-4 stroke-[2.5]" />
                <span>CHECKPOINT SCHEDULE</span>
              </button>

              <button
                onClick={() => setActiveTab('comparison')}
                className={`px-4 py-2 font-arcade text-xs border-2 border-slate-950 transition-all flex items-center gap-2 ${
                  activeTab === 'comparison'
                    ? 'bg-orange-500 text-white shadow-arcade-press translate-x-0.5 translate-y-0.5'
                    : 'bg-white text-slate-900 hover:bg-orange-50 shadow-arcade'
                }`}
              >
                <BarChart3 className="w-4 h-4 stroke-[2.5]" />
                <span>LEADERBOARD TABLE</span>
              </button>
            </div>

            {/* Tab 1: Checkpoint Timeline for Selected Route */}
            {activeTab === 'overview' && selectedRoute && (
              <CheckpointTimeline
                checkpoints={selectedRoute.checkpoints}
                sampleIntervalMiles={selectedRoute.sample_interval_miles}
              />
            )}

            {/* Tab 2: Full Comparison Table */}
            {activeTab === 'comparison' && (
              <RouteComparisonTable
                routes={routeData.routes}
                selectedRouteId={selectedRouteId}
                onSelectRoute={(id) => setSelectedRouteId(id)}
              />
            )}
          </div>
        )}
      </main>

      {/* Rules Modal */}
      <RiskRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t-4 border-slate-950 bg-white py-4 px-4 text-xs font-arcade text-slate-700 shadow-arcade">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-950">SPOTTER WEATHER ROUTER 1984 // HIGH-SCORE ENGINE</span>
          </div>
          <span className="text-orange-600 text-[10px]">
            OSRM ROUTING + OPEN-METEO WEATHER RADAR
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
