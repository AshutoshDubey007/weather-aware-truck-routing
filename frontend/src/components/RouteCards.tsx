import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Award,
  ChevronRight
} from 'lucide-react';
import { RouteOption } from '../types';

interface RouteCardsProps {
  routes: RouteOption[];
  selectedRouteId: number;
  onSelectRoute: (id: number) => void;
}

export const RouteCards: React.FC<RouteCardsProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
}) => {
  if (!routes || routes.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-teal-400" />
          <span>Evaluated Route Options ({routes.length})</span>
        </h3>
        <span className="text-[11px] text-slate-500">Sorted by Safety Priority</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const isRec = route.is_recommended;
          const risk = route.risk_summary;

          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={`relative rounded-2xl p-4 cursor-pointer transition-all border text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-teal-400 shadow-xl shadow-teal-500/10 ring-1 ring-teal-400'
                  : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Recommended Badge / Rank Badge */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: route.color }}
                  />
                  <span className="font-bold text-xs text-white">
                    {route.name}
                  </span>
                </div>

                {isRec ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3 h-3 text-teal-400" />
                    RECOMMENDED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                    Option #{route.rank}
                  </span>
                )}
              </div>

              {/* Highway summary */}
              <p className="text-[11px] text-slate-400 line-clamp-1 mb-3">
                {route.summary}
              </p>

              {/* Key Route Stats */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-3">
                <div>
                  <span className="text-[10px] text-slate-400 block">Distance</span>
                  <span className="text-xs font-mono font-bold text-slate-100">
                    {route.distance_miles.toLocaleString()} mi
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Travel Time</span>
                  <span className="text-xs font-mono font-bold text-slate-100 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-400" />
                    {route.duration_formatted}
                  </span>
                </div>
              </div>

              {/* Miles in Risk Categories Breakdown */}
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Average Risk Score</span>
                  <span className={`font-mono font-bold text-xs ${
                    risk.average_risk_score <= 1.5 ? 'text-emerald-400' :
                    risk.average_risk_score <= 2.5 ? 'text-amber-400' :
                    risk.average_risk_score <= 3.5 ? 'text-orange-400' : 'text-rose-400'
                  }`}>
                    {risk.average_risk_score.toFixed(2)} / 5.0 ({risk.average_risk_level})
                  </span>
                </div>

                {/* Risk Distribution Bar */}
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  {risk.low_miles > 0 && (
                    <div
                      style={{ width: `${(risk.low_miles / route.distance_miles) * 100}%` }}
                      className="bg-emerald-500 h-full"
                      title={`Low: ${risk.low_miles} mi`}
                    />
                  )}
                  {risk.moderate_miles > 0 && (
                    <div
                      style={{ width: `${(risk.moderate_miles / route.distance_miles) * 100}%` }}
                      className="bg-amber-400 h-full"
                      title={`Moderate: ${risk.moderate_miles} mi`}
                    />
                  )}
                  {risk.high_miles > 0 && (
                    <div
                      style={{ width: `${(risk.high_miles / route.distance_miles) * 100}%` }}
                      className="bg-orange-500 h-full"
                      title={`High: ${risk.high_miles} mi`}
                    />
                  )}
                  {risk.severe_miles > 0 && (
                    <div
                      style={{ width: `${(risk.severe_miles / route.distance_miles) * 100}%` }}
                      className="bg-rose-500 h-full"
                      title={`Severe: ${risk.severe_miles} mi`}
                    />
                  )}
                  {risk.no_travel_miles > 0 && (
                    <div
                      style={{ width: `${(risk.no_travel_miles / route.distance_miles) * 100}%` }}
                      className="bg-rose-900 h-full animate-pulse"
                      title={`No Travel: ${risk.no_travel_miles} mi`}
                    />
                  )}
                </div>

                {/* Risk details tags */}
                <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                  {risk.no_travel_miles > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-300 font-bold border border-rose-800">
                      ⛔ {risk.no_travel_miles} mi No Travel
                    </span>
                  )}
                  {risk.severe_miles > 0 ? (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
                      ⚠️ {risk.severe_miles} mi Severe
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      0 mi Severe
                    </span>
                  )}
                  {risk.high_miles > 0 ? (
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-semibold border border-orange-500/30">
                      {risk.high_miles} mi High
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      0 mi High
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {risk.low_miles} mi Low
                  </span>
                </div>
              </div>

              {/* Recommendation Rationale */}
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed">
                  {route.recommendation_rationale}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
