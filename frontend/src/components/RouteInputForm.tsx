import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  MapPin, 
  Calendar, 
  Scale, 
  Sliders, 
  ArrowRightLeft, 
  Search, 
  Route, 
  Sparkles,
  Info
} from 'lucide-react';
import { Place, PresetTrip } from '../types';
import { searchPlaces } from '../services/api';

interface RouteInputFormProps {
  onCalculate: (params: {
    origin: string;
    destination: string;
    departure_time: string;
    load_weight_lb: number;
    sample_interval_miles: number;
  }) => void;
  isLoading: boolean;
  presets: PresetTrip[];
}

export const RouteInputForm: React.FC<RouteInputFormProps> = ({
  onCalculate,
  isLoading,
  presets,
}) => {
  const [origin, setOrigin] = useState<string>('New York, NY');
  const [destination, setDestination] = useState<string>('Chicago, IL');
  const [originSuggestions, setOriginSuggestions] = useState<Place[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Place[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState<boolean>(false);
  const [showDestDropdown, setShowDestDropdown] = useState<boolean>(false);

  // Default to today at current hour
  const getInitialDeparture = () => {
    const now = new Date();
    now.setMinutes(0);
    now.setSeconds(0);
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [departureTime, setDepartureTime] = useState<string>(getInitialDeparture());
  const [loadWeight, setLoadWeight] = useState<number>(42000);
  const [sampleInterval, setSampleInterval] = useState<number>(25);

  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(e.target as Node)) {
        setShowOriginDropdown(false);
      }
      if (destRef.current && !destRef.current.contains(e.target as Node)) {
        setShowDestDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autocomplete debounce for origin
  useEffect(() => {
    if (!origin || origin.length < 2) {
      setOriginSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchPlaces(origin);
      setOriginSuggestions(results);
    }, 250);
    return () => clearTimeout(timer);
  }, [origin]);

  // Autocomplete debounce for destination
  useEffect(() => {
    if (!destination || destination.length < 2) {
      setDestSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchPlaces(destination);
      setDestSuggestions(results);
    }, 250);
    return () => clearTimeout(timer);
  }, [destination]);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handlePresetSelect = (preset: PresetTrip) => {
    setOrigin(preset.origin);
    setDestination(preset.destination);
    setLoadWeight(preset.default_weight);
    setSampleInterval(preset.sample_interval);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;

    onCalculate({
      origin: origin.trim(),
      destination: destination.trim(),
      departure_time: new Date(departureTime).toISOString(),
      load_weight_lb: loadWeight,
      sample_interval_miles: sampleInterval,
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      {/* Header and Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Route className="w-5 h-5 text-teal-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Trip Parameters</h2>
        </div>

        {/* Quick presets pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium">Presets:</span>
          {presets.slice(0, 3).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetSelect(p)}
              className="text-[11px] px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              {p.title.split('→')[0].split(',')[0]} → {p.title.split('→')[1]?.split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Origin & Destination Inputs with Swap */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-2 items-center">
          {/* Origin */}
          <div ref={originRef} className="relative">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-emerald-400" />
              Origin City or Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={origin}
                onChange={(e) => {
                  setOrigin(e.target.value);
                  setShowOriginDropdown(true);
                }}
                onFocus={() => setShowOriginDropdown(true)}
                placeholder="e.g. New York, NY"
                required
                className="w-full bg-slate-950 border border-slate-700 focus:border-teal-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>

            {/* Dropdown Suggestions */}
            {showOriginDropdown && originSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                {originSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setOrigin(s.name);
                      setShowOriginDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2 border-b border-slate-700/40 last:border-0"
                  >
                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center md:pt-4">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-transform active:scale-90"
              title="Swap Origin and Destination"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Destination */}
          <div ref={destRef} className="relative">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-400" />
              Destination City or Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setShowDestDropdown(true);
                }}
                onFocus={() => setShowDestDropdown(true)}
                placeholder="e.g. Chicago, IL"
                required
                className="w-full bg-slate-950 border border-slate-700 focus:border-teal-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>

            {/* Dropdown Suggestions */}
            {showDestDropdown && destSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                {destSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDestination(s.name);
                      setShowDestDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2 border-b border-slate-700/40 last:border-0"
                  >
                    <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                    <span className="truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Departure, Load Weight, and Interval */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {/* Departure Date/Time */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-400" />
              Departure Date & Time
            </label>
            <input
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 focus:border-teal-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors"
            />
            <div className="flex gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => setDepartureTime(getInitialDeparture())}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
              >
                Now
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setHours(d.getHours() + 2);
                  const tzOffset = d.getTimezoneOffset() * 60000;
                  setDepartureTime(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
              >
                +2 Hours
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(6, 0, 0, 0);
                  const tzOffset = d.getTimezoneOffset() * 60000;
                  setDepartureTime(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
              >
                Tomorrow 6 AM
              </button>
            </div>
          </div>

          {/* Load Weight */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Scale className="w-3 h-3 text-amber-400" />
                Load Weight
              </label>
              <span className="text-xs font-mono font-bold text-amber-400">
                {loadWeight.toLocaleString()} lb
              </span>
            </div>
            <input
              type="range"
              min={10000}
              max={80000}
              step={1000}
              value={loadWeight}
              onChange={(e) => setLoadWeight(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            {/* Weight presets */}
            <div className="flex gap-1 mt-1.5">
              {[
                { label: 'Empty', wt: 15000 },
                { label: '30k lb', wt: 30000 },
                { label: '42k lb', wt: 42000 },
                { label: 'Heavy', wt: 55000 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setLoadWeight(p.wt)}
                  className={`text-[10px] flex-1 py-0.5 rounded border transition-colors ${
                    loadWeight === p.wt
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700/60'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sample Interval */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-purple-400" />
              Sample Weather Interval
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[10, 25, 50].map((interval) => (
                <button
                  key={interval}
                  type="button"
                  onClick={() => setSampleInterval(interval)}
                  className={`py-2 text-xs rounded-xl font-semibold border transition-all ${
                    sampleInterval === interval
                      ? 'bg-purple-600/20 text-purple-300 border-purple-500/50 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {interval} mi
                </button>
              ))}
            </div>
            {/* Advisory note */}
            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
              <Info className="w-3 h-3 text-slate-500 shrink-0" />
              <span>
                {loadWeight > 40000 ? (
                  <span className="text-orange-400">&gt;40k lb load: 35-44 mph wind triggers Severe</span>
                ) : loadWeight > 30000 ? (
                  <span className="text-rose-400">&gt;30k lb load: 45-54 mph wind triggers No Travel</span>
                ) : (
                  <span>Standard wind rules apply (&lt;30,000 lb)</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Evaluating 3 Routes & Sampling 48h Weather Matrix...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Weather Safety & Recommend Best Route</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
