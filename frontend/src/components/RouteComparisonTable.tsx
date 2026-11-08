import React from 'react';
import { RouteOption } from '../types';
import { Scale } from 'lucide-react';

interface RouteComparisonTableProps {
  routes: RouteOption[];
  selectedRouteId: number;
  onSelectRoute: (id: number) => void;
}

export const RouteComparisonTable: React.FC<RouteComparisonTableProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
}) => {
  if (!routes || routes.length === 0) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-teal-400" />
          <span>Route Multi-Factor Safety Comparison</span>
        </h4>
        <span className="text-[11px] text-slate-400">
          Ranked by Preference Hierarchy (Fewest Severe → High → Avg Risk → Duration)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
              <th className="py-2.5 px-3">Route Option</th>
              <th className="py-2.5 px-3">Travel Time</th>
              <th className="py-2.5 px-3">Total Distance</th>
              <th className="py-2.5 px-3 text-rose-500">No Travel</th>
              <th className="py-2.5 px-3 text-rose-400">Severe Miles</th>
              <th className="py-2.5 px-3 text-orange-400">High Miles</th>
              <th className="py-2.5 px-3 text-amber-400">Moderate</th>
              <th className="py-2.5 px-3 text-emerald-400">Low Miles</th>
              <th className="py-2.5 px-3">Avg Risk Score</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {routes.map((r) => {
              const isSelected = r.id === selectedRouteId;
              const isRec = r.is_recommended;
              const risk = r.risk_summary;

              return (
                <tr
                  key={r.id}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-teal-500/10 text-white font-medium'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <td className="py-2.5 px-3 font-sans font-bold flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: r.color }}
                    />
                    <span>{r.name}</span>
                    {isRec && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                        REC
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-200">
                    {r.duration_formatted}
                  </td>
                  <td className="py-2.5 px-3">
                    {r.distance_miles.toFixed(1)} mi
                  </td>
                  <td className="py-2.5 px-3 font-bold text-rose-500">
                    {risk.no_travel_miles > 0 ? `${risk.no_travel_miles} mi` : '0 mi'}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-rose-400">
                    {risk.severe_miles > 0 ? `${risk.severe_miles} mi` : '0 mi'}
                  </td>
                  <td className="py-2.5 px-3 text-orange-400">
                    {risk.high_miles > 0 ? `${risk.high_miles} mi` : '0 mi'}
                  </td>
                  <td className="py-2.5 px-3 text-amber-300">
                    {risk.moderate_miles.toFixed(1)} mi
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400">
                    {risk.low_miles.toFixed(1)} mi
                  </td>
                  <td className="py-2.5 px-3 font-bold">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        risk.average_risk_score <= 1.5
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : risk.average_risk_score <= 2.5
                          ? 'bg-amber-500/20 text-amber-300'
                          : risk.average_risk_score <= 3.5
                          ? 'bg-orange-500/20 text-orange-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {risk.average_risk_score.toFixed(2)} ({risk.average_risk_level})
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <button
                      onClick={() => onSelectRoute(r.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        isSelected
                          ? 'bg-teal-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {isSelected ? 'Viewing' : 'Select'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
