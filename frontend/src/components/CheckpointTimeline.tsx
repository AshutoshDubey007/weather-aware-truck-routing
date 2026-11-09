import React, { useState } from 'react';
import { Checkpoint, RiskLevelType } from '../types';
import { 
  Clock, 
  Wind, 
  CloudRain, 
  Snowflake, 
  AlertTriangle, 
  ShieldCheck, 
  Scale 
} from 'lucide-react';

interface CheckpointTimelineProps {
  checkpoints: Checkpoint[];
  sampleIntervalMiles: number;
}

const ARCADE_RISK_STYLES: Record<RiskLevelType, string> = {
  Low: 'bg-emerald-600 text-white border-2 border-slate-950 font-bold',
  Moderate: 'bg-amber-400 text-slate-950 border-2 border-slate-950 font-bold',
  High: 'bg-orange-500 text-white border-2 border-slate-950 font-bold',
  Severe: 'bg-red-600 text-white border-2 border-slate-950 font-bold',
  'No Travel': 'bg-red-950 text-white border-2 border-slate-950 font-extrabold animate-pulse',
};

export const CheckpointTimeline: React.FC<CheckpointTimelineProps> = ({
  checkpoints,
  sampleIntervalMiles,
}) => {
  const [filter, setFilter] = useState<'all' | 'hazards'>('all');

  if (!checkpoints || checkpoints.length === 0) return null;

  const displayedCheckpoints = filter === 'hazards'
    ? checkpoints.filter((cp) => cp.overall_risk === 'High' || cp.overall_risk === 'Severe' || cp.overall_risk === 'No Travel')
    : checkpoints;

  const hazardCount = checkpoints.filter(
    (cp) => cp.overall_risk === 'Severe' || cp.overall_risk === 'No Travel'
  ).length;

  return (
    <div className="bg-white border-4 border-slate-950 p-5 shadow-arcade">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b-2 border-slate-950">
        <div>
          <h3 className="font-arcade text-xs sm:text-sm text-slate-950 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <span>CHECKPOINT SCHEDULE ({checkpoints.length} SAMPLES @ {sampleIntervalMiles} MI)</span>
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
            Sampled at estimated truck arrival timestamp at each milepost
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold border-2 border-slate-950 transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-emerald-600 text-white shadow-arcade-press translate-x-0.5 translate-y-0.5'
                : 'bg-white text-slate-900 hover:bg-emerald-50 shadow-arcade'
            }`}
          >
            ALL SAMPLES ({checkpoints.length})
          </button>
          <button
            onClick={() => setFilter('hazards')}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold border-2 border-slate-950 flex items-center gap-1.5 transition-all cursor-pointer ${
              filter === 'hazards'
                ? 'bg-orange-500 text-white shadow-arcade-press translate-x-0.5 translate-y-0.5'
                : 'bg-white text-slate-900 hover:bg-orange-50 shadow-arcade'
            }`}
          >
            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            <span>HAZARDS ONLY ({hazardCount})</span>
          </button>
        </div>
      </div>

      {displayedCheckpoints.length === 0 ? (
        <div className="py-8 text-center bg-emerald-50 border-2 border-dashed border-emerald-600">
          <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <p className="font-arcade text-xs text-emerald-800">ZERO SEVERE HAZARDS DETECTED</p>
          <p className="text-sm font-bold text-emerald-700 mt-1">ALL CHECKPOINTS ARE CLEAR FOR SAFE TRANSIT.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
          {displayedCheckpoints.map((cp) => {
            const w = cp.weather;
            const badgeClass = ARCADE_RISK_STYLES[cp.overall_risk] || ARCADE_RISK_STYLES.Low;
            const isNoTravel = cp.overall_risk === 'No Travel';
            const isSevere = cp.overall_risk === 'Severe';

            return (
              <div
                key={cp.index}
                className={`p-3.5 border-2 border-slate-950 transition-all ${
                  isNoTravel
                    ? 'bg-red-50 shadow-arcade-press'
                    : isSevere
                    ? 'bg-orange-50 shadow-arcade-press'
                    : 'bg-white hover:bg-slate-50 shadow-arcade-press'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 bg-slate-950 text-white font-arcade text-xs font-bold flex items-center justify-center shrink-0">
                      #{cp.index + 1}
                    </span>
                    <div>
                      <span className="text-sm font-extrabold text-slate-950">
                        MILE {cp.distance_from_start_miles.toFixed(1)}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 ml-2">
                        ({cp.latitude.toFixed(3)}, {cp.longitude.toFixed(3)})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* ETA */}
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-950 font-bold bg-slate-100 px-2.5 py-1 border border-slate-950">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>{cp.eta_formatted}</span>
                    </div>

                    {/* Risk Badge */}
                    <span className={`px-2.5 py-1 text-xs font-arcade font-bold ${badgeClass}`}>
                      {cp.overall_risk}
                    </span>
                  </div>
                </div>

                {/* Weather stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-2.5 border border-slate-950 text-xs sm:text-sm">
                  {/* Wind */}
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-600 block uppercase font-bold">WIND / GUSTS</span>
                      <span className={cp.wind_risk === 'No Travel' || cp.wind_risk === 'Severe' ? 'text-red-600 font-extrabold' : 'text-slate-950 font-bold'}>
                        {w.wind_speed_mph} / {w.wind_gusts_mph} MPH
                      </span>
                    </div>
                  </div>

                  {/* Rain */}
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-600 block uppercase font-bold">RAIN RATE</span>
                      <span className={cp.rain_risk === 'Severe' || cp.rain_risk === 'No Travel' ? 'text-red-600 font-extrabold' : 'text-slate-950 font-bold'}>
                        {w.rain_in_hr.toFixed(2)} IN/HR
                      </span>
                    </div>
                  </div>

                  {/* Snow */}
                  <div className="flex items-center gap-2">
                    <Snowflake className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-600 block uppercase font-bold">SNOWFALL</span>
                      <span className={cp.snow_risk === 'Severe' || cp.snow_risk === 'No Travel' ? 'text-red-600 font-extrabold' : 'text-slate-950 font-bold'}>
                        {w.snow_in_hr.toFixed(2)} IN/HR
                      </span>
                    </div>
                  </div>

                  {/* Condition & Temp */}
                  <div>
                    <span className="text-[10px] text-slate-600 block uppercase font-bold">CONDITION</span>
                    <span className="text-slate-950 font-bold truncate block">
                      {w.condition} ({w.temperature_f}°F)
                    </span>
                  </div>
                </div>

                {/* Advisories */}
                {cp.advisories && cp.advisories.length > 0 && (
                  <div className="mt-2.5 p-2 bg-red-100 border-2 border-red-600 text-xs text-red-950 font-bold flex items-start gap-2">
                    <Scale className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      {cp.advisories.map((adv, aIdx) => (
                        <p key={aIdx}>⚠️ {adv}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
