import React from 'react';
import { X, ShieldAlert, AlertTriangle, Wind, CloudRain, Snowflake, Scale } from 'lucide-react';

interface RiskRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiskRulesModal: React.FC<RiskRulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white border-4 border-slate-950 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-arcade-lg p-6 relative text-slate-950">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 bg-slate-100 hover:bg-orange-500 hover:text-white border-2 border-slate-950 shadow-arcade-press transition-colors cursor-pointer"
        >
          <X className="w-5 h-5 stroke-[3]" />
        </button>

        <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-slate-950">
          <div className="w-12 h-12 bg-orange-500 border-2 border-slate-950 flex items-center justify-center text-white shadow-arcade">
            <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-arcade text-sm sm:text-base text-slate-950">SAFETY & LOAD WEIGHT RULES</h2>
            <p className="text-xs sm:text-sm text-emerald-800 font-bold mt-1">SPOTTER THRESHOLDS & HEAVY VEHICLE ESCALATIONS</p>
          </div>
        </div>

        {/* Thresholds Table */}
        <div className="mb-6">
          <h3 className="font-arcade text-xs text-slate-950 mb-2">
            [1] CHECKPOINT WEATHER THRESHOLDS
          </h3>
          <div className="overflow-x-auto border-2 border-slate-950">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950 text-white font-arcade text-[10px] border-b-2 border-slate-950">
                <tr>
                  <th className="p-3">CONDITION</th>
                  <th className="p-3 text-emerald-400">LOW</th>
                  <th className="p-3 text-amber-300">MODERATE</th>
                  <th className="p-3 text-orange-400">HIGH</th>
                  <th className="p-3 text-red-400">SEVERE</th>
                  <th className="p-3 text-red-500">NO TRAVEL</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-200 font-bold">
                <tr className="hover:bg-slate-50">
                  <td className="p-3 flex items-center gap-1.5 font-arcade text-xs">
                    <Wind className="w-4 h-4 text-emerald-600" /> WIND
                  </td>
                  <td className="p-3 text-emerald-700">&lt;25 mph</td>
                  <td className="p-3 text-amber-700">25–34 mph</td>
                  <td className="p-3 text-orange-700">35–44 mph</td>
                  <td className="p-3 text-red-600">45–54 mph</td>
                  <td className="p-3 font-extrabold text-red-800">≥55 mph</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 flex items-center gap-1.5 font-arcade text-xs">
                    <CloudRain className="w-4 h-4 text-blue-600" /> RAIN
                  </td>
                  <td className="p-3 text-emerald-700">&lt;0.10 in/hr</td>
                  <td className="p-3 text-amber-700">0.10–0.25</td>
                  <td className="p-3 text-orange-700">0.25–0.50</td>
                  <td className="p-3 text-red-600">0.50–1.00</td>
                  <td className="p-3 font-extrabold text-red-800">&gt;1.00 in/hr</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 flex items-center gap-1.5 font-arcade text-xs">
                    <Snowflake className="w-4 h-4 text-indigo-500" /> SNOW
                  </td>
                  <td className="p-3 text-emerald-700">&lt;0.5 in/hr</td>
                  <td className="p-3 text-amber-700">0.5–1.0</td>
                  <td className="p-3 text-orange-700">1.0–2.0</td>
                  <td className="p-3 text-red-600">2.0–3.0</td>
                  <td className="p-3 font-extrabold text-red-800">&gt;3.0 in/hr</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Load Rules */}
        <div className="mb-6">
          <h3 className="font-arcade text-xs text-slate-950 mb-2 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-orange-600" /> [2] LOAD WEIGHT ESCALATIONS
          </h3>
          <div className="space-y-2.5">
            <div className="p-3.5 bg-red-50 border-2 border-red-600 flex items-start gap-3">
              <span className="px-2 py-0.5 font-arcade text-[9px] bg-red-600 text-white mt-0.5 border border-slate-950 font-bold shrink-0">
                NO TRAVEL
              </span>
              <div>
                <p className="font-arcade text-xs text-red-900 font-bold">≥ 55 MPH WIND SPEED</p>
                <p className="text-xs sm:text-sm text-slate-900 mt-1 font-semibold">
                  Mandatory No Travel for <strong>ANY LOAD WEIGHT</strong> (extreme rollover and jackknife hazard).
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-red-50 border-2 border-red-600 flex items-start gap-3">
              <span className="px-2 py-0.5 font-arcade text-[9px] bg-red-600 text-white mt-0.5 border border-slate-950 font-bold shrink-0">
                NO TRAVEL
              </span>
              <div>
                <p className="font-arcade text-xs text-red-900 font-bold">45–54 MPH WIND + LOAD &gt; 30,000 LB</p>
                <p className="text-xs sm:text-sm text-slate-900 mt-1 font-semibold">
                  Normally Severe; automatically escalated to <strong>NO TRAVEL</strong> when truck weight exceeds 30,000 lbs.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-orange-50 border-2 border-orange-500 flex items-start gap-3">
              <span className="px-2 py-0.5 font-arcade text-[9px] bg-orange-500 text-white mt-0.5 border border-slate-950 font-bold shrink-0">
                SEVERE
              </span>
              <div>
                <p className="font-arcade text-xs text-orange-900 font-bold">35–44 MPH WIND + LOAD &gt; 40,000 LB</p>
                <p className="text-xs sm:text-sm text-slate-900 mt-1 font-semibold">
                  Normally High; automatically escalated to <strong>SEVERE</strong> when heavy haul load exceeds 40,000 lbs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation Priority */}
        <div className="p-4 bg-emerald-50 border-2 border-emerald-600 mb-5">
          <h3 className="font-arcade text-xs text-emerald-900 mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-emerald-700" /> [3] ROUTE RECOMMENDATION HIERARCHY
          </h3>
          <p className="text-xs sm:text-sm text-slate-900 mb-1.5 font-medium">
            Routes are strictly ranked in order of:
          </p>
          <ol className="list-decimal list-inside text-xs sm:text-sm space-y-1 text-slate-950 font-bold">
            <li><strong>FEWEST SEVERE MILES</strong> (0 No Travel miles strictly prioritized)</li>
            <li><strong>FEWEST HIGH MILES</strong></li>
            <li><strong>LOWEST AVERAGE RISK SCORE</strong></li>
            <li><strong>SHORTEST TRAVEL TIME</strong></li>
          </ol>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-arcade text-xs font-bold border-2 border-slate-950 shadow-arcade transition-all active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer"
          >
            [CLOSE WINDOW]
          </button>
        </div>
      </div>
    </div>
  );
};
