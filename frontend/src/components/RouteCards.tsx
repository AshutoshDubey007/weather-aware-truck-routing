import React from 'react';
import { 
  Clock, 
  Award, 
  ChevronRight, 
  Check 
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
        <h3 className="font-arcade text-xs sm:text-sm text-slate-950 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-600" />
          <span>EVALUATED ROUTE OPTIONS ({routes.length})</span>
        </h3>
        <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 border border-slate-950">
          ★ RANKED BY SAFETY PRIORITY ★
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const isRec = route.is_recommended;
          const risk = route.risk_summary;

          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={`p-5 cursor-pointer transition-all border-4 border-slate-950 flex flex-col justify-between ${
                isRec
                  ? 'bg-emerald-50/70 shadow-arcade-green'
                  : 'bg-white shadow-arcade hover:bg-slate-50'
              } ${
                isSelected
                  ? 'ring-4 ring-orange-500 translate-x-0.5 translate-y-0.5'
                  : ''
              }`}
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 border-2 border-slate-950 shrink-0"
                    style={{ backgroundColor: route.color }}
                  />
                  <span className="font-arcade text-xs sm:text-sm text-slate-950 font-bold">
                    {route.name}
                  </span>
                </div>

                {isRec ? (
                  <span className="px-2.5 py-1 text-xs font-arcade font-bold bg-emerald-600 text-white border-2 border-slate-950 shadow-arcade-press flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    SAFEST #1
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs font-arcade font-bold bg-orange-100 text-orange-900 border-2 border-slate-950">
                    OPTION #{route.rank}
                  </span>
                )}
              </div>

              {/* Highway Corridor Name */}
              <p className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1 mb-3">
                {route.summary}
              </p>

              {/* Key Stats Block */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-white border-2 border-slate-950 mb-3">
                <div>
                  <span className="text-xs font-bold text-slate-600 block uppercase">DISTANCE</span>
                  <span className="text-base sm:text-lg font-black text-slate-950">
                    {route.distance_miles.toLocaleString()} MI
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-600 block uppercase">TRAVEL TIME</span>
                  <span className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    {route.duration_formatted}
                  </span>
                </div>
              </div>

              {/* Risk Distribution Breakdown */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-800 font-bold">AVG RISK SCORE:</span>
                  <span className={`font-arcade text-xs font-bold ${
                    risk.average_risk_score <= 1.5 ? 'text-emerald-700' :
                    risk.average_risk_score <= 2.5 ? 'text-amber-700' :
                    risk.average_risk_score <= 3.5 ? 'text-orange-700' : 'text-red-700'
                  }`}>
                    {risk.average_risk_score.toFixed(2)}/5.0 ({risk.average_risk_level})
                  </span>
                </div>

                {/* Risk Distribution Bar */}
                <div className="h-3.5 w-full bg-slate-200 border-2 border-slate-950 flex overflow-hidden">
                  {risk.low_miles > 0 && (
                    <div
                      style={{ width: `${(risk.low_miles / route.distance_miles) * 100}%` }}
                      className="bg-emerald-600 h-full border-r border-slate-950"
                      title={`Low: ${risk.low_miles} mi`}
                    />
                  )}
                  {risk.moderate_miles > 0 && (
                    <div
                      style={{ width: `${(risk.moderate_miles / route.distance_miles) * 100}%` }}
                      className="bg-amber-400 h-full border-r border-slate-950"
                      title={`Moderate: ${risk.moderate_miles} mi`}
                    />
                  )}
                  {risk.high_miles > 0 && (
                    <div
                      style={{ width: `${(risk.high_miles / route.distance_miles) * 100}%` }}
                      className="bg-orange-500 h-full border-r border-slate-950"
                      title={`High: ${risk.high_miles} mi`}
                    />
                  )}
                  {risk.severe_miles > 0 && (
                    <div
                      style={{ width: `${(risk.severe_miles / route.distance_miles) * 100}%` }}
                      className="bg-red-600 h-full border-r border-slate-950"
                      title={`Severe: ${risk.severe_miles} mi`}
                    />
                  )}
                  {risk.no_travel_miles > 0 && (
                    <div
                      style={{ width: `${(risk.no_travel_miles / route.distance_miles) * 100}%` }}
                      className="bg-red-950 h-full animate-pulse"
                      title={`No Travel: ${risk.no_travel_miles} mi`}
                    />
                  )}
                </div>

                {/* Hazard tags */}
                <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
                  {risk.no_travel_miles > 0 && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-900 border border-red-700 font-bold">
                      ⛔ {risk.no_travel_miles} MI NO TRAVEL
                    </span>
                  )}
                  {risk.severe_miles > 0 ? (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-900 border border-orange-600 font-bold">
                      ⚠️ {risk.severe_miles} MI SEVERE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-600 font-bold">
                      ✓ 0 MI SEVERE
                    </span>
                  )}
                  {risk.high_miles > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-600 font-bold">
                      {risk.high_miles} MI HIGH
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-400 font-bold">
                    {risk.low_miles} MI LOW
                  </span>
                </div>
              </div>

              {/* Rationale note */}
              <div className="pt-3 border-t-2 border-slate-950 text-xs sm:text-sm font-semibold text-slate-900 flex items-start gap-1.5">
                <ChevronRight className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
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
