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
    <div className="bg-white border-4 border-slate-950 p-5 shadow-arcade">
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-slate-950">
        <h4 className="font-arcade text-xs sm:text-sm text-slate-950 flex items-center gap-2">
          <Scale className="w-5 h-5 text-emerald-600" />
          <span>ROUTE SAFETY COMPARISON TABLE</span>
        </h4>
        <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 border border-slate-950">
          ★ RANKED BY PREFERENCE: FEWEST SEVERE ➜ HIGH ➜ AVG RISK ➜ TIME ★
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-2 border-slate-950">
          <thead>
            <tr className="bg-slate-950 text-white font-arcade text-xs">
              <th className="py-3 px-3.5">ROUTE</th>
              <th className="py-3 px-3.5">TRAVEL TIME</th>
              <th className="py-3 px-3.5">DISTANCE</th>
              <th className="py-3 px-3.5 text-red-400">NO TRAVEL</th>
              <th className="py-3 px-3.5 text-orange-400">SEVERE MI</th>
              <th className="py-3 px-3.5 text-amber-300">HIGH MI</th>
              <th className="py-3 px-3.5 text-yellow-300">MODERATE</th>
              <th className="py-3 px-3.5 text-emerald-400">LOW MI</th>
              <th className="py-3 px-3.5">AVG RISK</th>
              <th className="py-3 px-3.5 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-950 font-bold">
            {routes.map((r) => {
              const isSelected = r.id === selectedRouteId;
              const isRec = r.is_recommended;
              const risk = r.risk_summary;

              return (
                <tr
                  key={r.id}
                  className={`transition-colors ${
                    isRec
                      ? 'bg-emerald-50 text-slate-950'
                      : isSelected
                      ? 'bg-orange-50 text-slate-950'
                      : 'hover:bg-slate-50 text-slate-900'
                  }`}
                >
                  <td className="py-3.5 px-3.5 font-arcade text-xs flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 border-2 border-slate-950 shrink-0"
                      style={{ backgroundColor: r.color }}
                    />
                    <span>{r.name}</span>
                    {isRec && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-600 text-white border border-slate-950 shadow-arcade-press font-arcade">
                        REC
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3.5 font-extrabold text-slate-950">
                    {r.duration_formatted}
                  </td>
                  <td className="py-3.5 px-3.5 font-extrabold text-slate-950">
                    {r.distance_miles.toFixed(1)} MI
                  </td>
                  <td className="py-3.5 px-3.5 font-extrabold text-red-700">
                    {risk.no_travel_miles > 0 ? `${risk.no_travel_miles} MI` : '0 MI'}
                  </td>
                  <td className="py-3.5 px-3.5 font-extrabold text-orange-700">
                    {risk.severe_miles > 0 ? `${risk.severe_miles} MI` : '0 MI'}
                  </td>
                  <td className="py-3.5 px-3.5 font-bold text-amber-700">
                    {risk.high_miles > 0 ? `${risk.high_miles} MI` : '0 MI'}
                  </td>
                  <td className="py-3.5 px-3.5 text-slate-800">
                    {risk.moderate_miles.toFixed(1)} MI
                  </td>
                  <td className="py-3.5 px-3.5 text-emerald-800 font-bold">
                    {risk.low_miles.toFixed(1)} MI
                  </td>
                  <td className="py-3.5 px-3.5">
                    <span
                      className={`px-2.5 py-1 font-arcade text-[10px] font-bold border border-slate-950 ${
                        risk.average_risk_score <= 1.5
                          ? 'bg-emerald-600 text-white'
                          : risk.average_risk_score <= 2.5
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : risk.average_risk_score <= 3.5
                          ? 'bg-orange-500 text-white font-bold'
                          : 'bg-red-600 text-white font-bold'
                      }`}
                    >
                      {risk.average_risk_score.toFixed(2)} ({risk.average_risk_level})
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5 text-right">
                    <button
                      onClick={() => onSelectRoute(r.id)}
                      className={`px-3 py-1.5 font-arcade text-[10px] font-bold border-2 border-slate-950 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-orange-500 text-white shadow-arcade-press translate-x-0.5 translate-y-0.5'
                          : 'bg-white hover:bg-slate-100 text-slate-950 shadow-arcade'
                      }`}
                    >
                      {isSelected ? 'VIEWING' : 'SELECT'}
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
