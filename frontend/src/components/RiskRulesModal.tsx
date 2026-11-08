import React from 'react';
import { X, ShieldAlert, AlertTriangle, Wind, CloudRain, Snowflake, Scale } from 'lucide-react';

interface RiskRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiskRulesModal: React.FC<RiskRulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Weather Risk & Load Weight Rules</h2>
            <p className="text-xs text-slate-400">Spotter Safety Thresholds and Load Escalation Matrix</p>
          </div>
        </div>

        {/* Thresholds Table */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Checkpoint Weather Classification Thresholds
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3">Condition</th>
                  <th className="p-3 text-emerald-400">Low</th>
                  <th className="p-3 text-amber-400">Moderate</th>
                  <th className="p-3 text-orange-400">High</th>
                  <th className="p-3 text-rose-400">Severe</th>
                  <th className="p-3 text-rose-600">No Travel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 font-medium flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-cyan-400" /> Wind
                  </td>
                  <td className="p-3">&lt; 25 mph</td>
                  <td className="p-3">25 – 34 mph</td>
                  <td className="p-3">35 – 44 mph</td>
                  <td className="p-3">45 – 54 mph</td>
                  <td className="p-3 font-semibold text-rose-500">≥ 55 mph</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 font-medium flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-blue-400" /> Rain
                  </td>
                  <td className="p-3">&lt; 0.10 in/hr</td>
                  <td className="p-3">0.10 – 0.25</td>
                  <td className="p-3">0.25 – 0.50</td>
                  <td className="p-3">0.50 – 1.00</td>
                  <td className="p-3 font-semibold text-rose-500">&gt; 1.00 in/hr</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 font-medium flex items-center gap-1.5">
                    <Snowflake className="w-3.5 h-3.5 text-indigo-300" /> Snow
                  </td>
                  <td className="p-3">&lt; 0.5 in/hr</td>
                  <td className="p-3">0.5 – 1.0</td>
                  <td className="p-3">1.0 – 2.0</td>
                  <td className="p-3">2.0 – 3.0</td>
                  <td className="p-3 font-semibold text-rose-500">&gt; 3.0 in/hr</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Load Rules */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-amber-400" /> Truck Load Weight Escalation Rules
          </h3>
          <div className="grid gap-2.5">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white mt-0.5">
                NO TRAVEL
              </span>
              <div>
                <p className="text-xs font-semibold text-rose-300">≥ 55 mph wind speed</p>
                <p className="text-[11px] text-slate-400">
                  Mandatory No Travel restriction for <strong>any load weight</strong> (severe rollover and jackknife hazard).
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white mt-0.5">
                NO TRAVEL
              </span>
              <div>
                <p className="text-xs font-semibold text-rose-300">45 – 54 mph wind + Load &gt; 30,000 lb</p>
                <p className="text-[11px] text-slate-400">
                  Normally classified as Severe; automatically escalated to <strong>No Travel</strong> when truck weight exceeds 30,000 lbs.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500 text-white mt-0.5">
                SEVERE
              </span>
              <div>
                <p className="text-xs font-semibold text-orange-300">35 – 44 mph wind + Load &gt; 40,000 lb</p>
                <p className="text-[11px] text-slate-400">
                  Normally classified as High; automatically escalated to <strong>Severe</strong> when heavy haul load exceeds 40,000 lbs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation Priority */}
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
          <h3 className="text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-teal-400" /> Route Recommendation Hierarchy
          </h3>
          <p className="text-xs text-slate-400 mb-2">
            The engine evaluates all 3 route options and selects the optimal path by strictly preferring:
          </p>
          <ol className="list-decimal list-inside text-xs space-y-1 text-slate-300 font-medium">
            <li><strong>Fewest Severe miles</strong> (0 No Travel miles strictly prioritized)</li>
            <li><strong>Fewest High miles</strong></li>
            <li><strong>Lowest average risk</strong> score</li>
            <li><strong>Shortest travel times</strong></li>
          </ol>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition-colors"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
};
