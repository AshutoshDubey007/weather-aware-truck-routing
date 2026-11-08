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
import { AlertCircle, BarChart3, ListFilter } from 'lucide-react';

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

  // Active view tab on mobile/desktop
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'checkpoints'>('overview');

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      <Navbar onOpenRules={() => setIsRulesModalOpen(true)} />

      <main className="flex-1 max-w-[1680px] w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start justify-between gap-3 shadow-lg animate-shake">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Calculation Error</p>
                <p className="text-xs text-rose-200 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold transition-colors"
            >
              Dismiss
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
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Checkpoint Weather Timeline</span>
              </button>

              <button
                onClick={() => setActiveTab('comparison')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'comparison'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>3-Route Multi-Factor Table</span>
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
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Weather-Aware Truck Routing Engine &bull; Spotter Full Stack Challenge</span>
          <span className="font-mono text-[11px] text-slate-400">
            OSRM Engine &bull; Open-Meteo High-Resolution Forecasting &bull; React + Django
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
