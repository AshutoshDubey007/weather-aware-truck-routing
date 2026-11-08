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

const RISK_BADGE_STYLES: Record<RiskLevelType, string> = {
  Low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  Moderate: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  High: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  Severe: 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold',
  'No Travel': 'bg-rose-900/60 text-rose-200 border-rose-700 font-extrabold animate-pulse',
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
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-teal-400" />
            <span>Checkpoint Weather & ETA Schedule ({checkpoints.length} Samples @ {sampleIntervalMiles} mi)</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Calculated at the truck's exact estimated arrival time at each milepost
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Checkpoints ({checkpoints.length})
          </button>
          <button
            onClick={() => setFilter('hazards')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              filter === 'hazards'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Hazards Only ({hazardCount})</span>
          </button>
        </div>
      </div>

      {displayedCheckpoints.length === 0 ? (
        <div className="py-8 text-center text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-emerald-300">Zero Severe Hazards Found Along This Route</p>
          <p className="text-[11px] text-slate-500 mt-1">All checkpoints meet safety operating criteria.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {displayedCheckpoints.map((cp) => {
            const w = cp.weather;
            const badgeClass = RISK_BADGE_STYLES[cp.overall_risk] || RISK_BADGE_STYLES.Low;
            const isNoTravel = cp.overall_risk === 'No Travel';
            const isSevere = cp.overall_risk === 'Severe';

            return (
              <div
                key={cp.index}
                className={`p-3 rounded-xl border transition-all ${
                  isNoTravel
                    ? 'bg-rose-950/30 border-rose-800/80'
                    : isSevere
                    ? 'bg-rose-900/10 border-rose-500/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-slate-200">
                      #{cp.index + 1}
                    </span>
                    <div>
                      <span className="font-bold text-xs text-slate-200">
                        Mile {cp.distance_from_start_miles.toFixed(1)}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2 font-mono">
                        ({cp.latitude.toFixed(3)}, {cp.longitude.toFixed(3)})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* ETA */}
                    <div className="flex items-center gap-1 text-xs text-slate-300 font-mono">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>{cp.eta_formatted}</span>
                    </div>

                    {/* Overall Risk Badge */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] border ${badgeClass}`}>
                      {cp.overall_risk}
                    </span>
                  </div>
                </div>

                {/* Weather Data Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 font-mono">
                  {/* Wind */}
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Wind / Gusts</span>
                      <span className={cp.wind_risk === 'No Travel' || cp.wind_risk === 'Severe' ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                        {w.wind_speed_mph} / {w.wind_gusts_mph} mph
                      </span>
                    </div>
                  </div>

                  {/* Rain */}
                  <div className="flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Rain Rate</span>
                      <span className={cp.rain_risk === 'Severe' || cp.rain_risk === 'No Travel' ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                        {w.rain_in_hr.toFixed(2)} in/hr
                      </span>
                    </div>
                  </div>

                  {/* Snow */}
                  <div className="flex items-center gap-1.5">
                    <Snowflake className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Snowfall</span>
                      <span className={cp.snow_risk === 'Severe' || cp.snow_risk === 'No Travel' ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                        {w.snow_in_hr.toFixed(2)} in/hr
                      </span>
                    </div>
                  </div>

                  {/* Condition & Temp */}
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Condition</span>
                    <span className="text-slate-200 font-sans truncate block" title={w.condition}>
                      {w.condition} ({w.temperature_f}°F)
                    </span>
                  </div>
                </div>

                {/* Load Advisories if present */}
                {cp.advisories && cp.advisories.length > 0 && (
                  <div className="mt-2 p-2 rounded bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 flex items-start gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      {cp.advisories.map((adv, aIdx) => (
                        <p key={aIdx}>{adv}</p>
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
