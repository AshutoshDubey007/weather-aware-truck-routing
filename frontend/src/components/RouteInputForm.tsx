import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  MapPin, 
  Calendar, 
  Scale, 
  Sliders, 
  ArrowRightLeft, 
  Search, 
  Sparkles,
  Info,
  Zap
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
    <div className="bg-white border-4 border-slate-950 p-6 shadow-arcade-lg relative">
      {/* Top Arcade Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b-2 border-slate-950">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-600 fill-orange-500" />
          <h2 className="font-arcade text-sm sm:text-base text-slate-950 uppercase tracking-tight">
            TRIP PARAMETERS & VEHICLE STATS
          </h2>
        </div>

        {/* Arcade Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-arcade text-xs text-emerald-800 font-bold">PRESETS:</span>
          {presets.slice(0, 3).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetSelect(p)}
              className="text-xs font-bold px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-2 border-slate-950 shadow-arcade-press transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
            >
              {p.title.split('→')[0].split(',')[0]} ➜ {p.title.split('→')[1]?.split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Origin & Destination Inputs with Swap */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-3 items-center">
          {/* Origin */}
          <div ref={originRef} className="relative">
            <label className="block text-xs sm:text-sm font-bold text-emerald-800 mb-1.5 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              ORIGIN (CITY OR ADDRESS)
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
                placeholder="Enter city or address (e.g. New York, NY)"
                required
                className="w-full bg-white border-2 border-slate-950 focus:border-orange-500 px-4 py-3 text-sm sm:text-base font-bold text-slate-950 placeholder-slate-400 focus:outline-none"
              />
              <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>

            {/* Dropdown Suggestions */}
            {showOriginDropdown && originSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-slate-950 shadow-arcade z-50 max-h-56 overflow-y-auto">
                {originSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setOrigin(s.name);
                      setShowOriginDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 hover:bg-emerald-100 flex items-center gap-2 border-b border-slate-200 last:border-0"
                  >
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center md:pt-6">
            <button
              type="button"
              onClick={handleSwap}
              className="p-3 bg-orange-500 hover:bg-orange-400 text-white border-2 border-slate-950 shadow-arcade transition-all active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer"
              title="Swap Origin and Destination"
            >
              <ArrowRightLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Destination */}
          <div ref={destRef} className="relative">
            <label className="block text-xs sm:text-sm font-bold text-orange-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-orange-600 fill-orange-600" />
              DESTINATION (CITY OR ADDRESS)
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
                placeholder="Enter destination (e.g. Chicago, IL)"
                required
                className="w-full bg-white border-2 border-slate-950 focus:border-orange-500 px-4 py-3 text-sm sm:text-base font-bold text-slate-950 placeholder-slate-400 focus:outline-none"
              />
              <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>

            {/* Dropdown Suggestions */}
            {showDestDropdown && destSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-slate-950 shadow-arcade z-50 max-h-56 overflow-y-auto">
                {destSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDestination(s.name);
                      setShowDestDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 hover:bg-orange-100 flex items-center gap-2 border-b border-slate-200 last:border-0"
                  >
                    <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
                    <span className="truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Departure, Load Weight, and Interval */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Departure Date/Time */}
          <div className="p-3.5 bg-slate-50 border-2 border-slate-950">
            <label className="block text-xs font-bold text-slate-950 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-700" />
              DEPARTURE DATE & TIME
            </label>
            <input
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              required
              className="w-full bg-white border-2 border-slate-950 px-3 py-2 text-sm font-bold text-slate-950 focus:outline-none"
            />
            <div className="flex gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => setDepartureTime(getInitialDeparture())}
                className="text-xs font-bold flex-1 py-1.5 bg-white hover:bg-emerald-100 text-slate-950 border border-slate-950 shadow-arcade-press"
              >
                NOW
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setHours(d.getHours() + 2);
                  const tzOffset = d.getTimezoneOffset() * 60000;
                  setDepartureTime(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
                }}
                className="text-xs font-bold flex-1 py-1.5 bg-white hover:bg-emerald-100 text-slate-950 border border-slate-950 shadow-arcade-press"
              >
                +2 HRS
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
                className="text-xs font-bold flex-1 py-1.5 bg-white hover:bg-emerald-100 text-slate-950 border border-slate-950 shadow-arcade-press"
              >
                TOMORROW
              </button>
            </div>
          </div>

          {/* Load Weight */}
          <div className="p-3.5 bg-slate-50 border-2 border-slate-950">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-950 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-orange-600" />
                LOAD WEIGHT
              </label>
              <span className="text-xs font-arcade font-bold text-orange-700 bg-orange-100 px-2 py-0.5 border border-slate-950">
                {loadWeight.toLocaleString()} LB
              </span>
            </div>
            <input
              type="range"
              min={10000}
              max={80000}
              step={1000}
              value={loadWeight}
              onChange={(e) => setLoadWeight(Number(e.target.value))}
              className="w-full h-3 bg-slate-200 appearance-none cursor-pointer accent-orange-500 border border-slate-950"
            />
            {/* Weight presets */}
            <div className="flex gap-1.5 mt-2.5">
              {[
                { label: 'EMPTY', wt: 15000 },
                { label: '30K LB', wt: 30000 },
                { label: '42K LB', wt: 42000 },
                { label: 'HEAVY', wt: 55000 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setLoadWeight(p.wt)}
                  className={`text-xs font-bold flex-1 py-1 border border-slate-950 transition-colors ${
                    loadWeight === p.wt
                      ? 'bg-orange-500 text-white font-extrabold shadow-arcade-press'
                      : 'bg-white hover:bg-orange-50 text-slate-900 shadow-arcade-press'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sample Interval */}
          <div className="p-3.5 bg-slate-50 border-2 border-slate-950">
            <label className="block text-xs font-bold text-slate-950 mb-1.5 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-700" />
              SAMPLE INTERVAL
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[10, 25, 50].map((interval) => (
                <button
                  key={interval}
                  type="button"
                  onClick={() => setSampleInterval(interval)}
                  className={`py-2 text-xs sm:text-sm font-arcade font-bold border-2 border-slate-950 transition-all cursor-pointer ${
                    sampleInterval === interval
                      ? 'bg-emerald-600 text-white shadow-arcade-press translate-x-0.5 translate-y-0.5'
                      : 'bg-white text-slate-900 hover:bg-emerald-50 shadow-arcade'
                  }`}
                >
                  {interval} MI
                </button>
              ))}
            </div>
            {/* Advisory note */}
            <div className="mt-2.5 text-xs text-slate-800 flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 text-orange-600 shrink-0" />
              <span>
                {loadWeight > 40000 ? (
                  <strong className="text-orange-700">&gt;40K LB: 35-44 MPH WINDS = SEVERE</strong>
                ) : loadWeight > 30000 ? (
                  <strong className="text-red-700">&gt;30K LB: 45-54 MPH WINDS = NO TRAVEL</strong>
                ) : (
                  <span>STANDARD LOAD (&lt;30,000 LB)</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Big Arcade Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 font-arcade text-xs sm:text-sm uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white border-4 border-slate-950 shadow-arcade-lg transition-all active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span>EVALUATING 3 ROUTES & SAMPLING WEATHER MATRIX...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300" />
                <span>ANALYZE WEATHER SAFETY & RECOMMEND SAFEST ROUTE</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
