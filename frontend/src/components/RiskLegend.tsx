import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { HeatmapMetric } from './HeatmapControl';

interface RiskLegendProps {
  activeMetric: HeatmapMetric;
}

export const RiskLegend: React.FC<RiskLegendProps> = ({ activeMetric }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="absolute top-4 right-4 z-[400] max-w-xs bg-white border-3 border-slate-950 shadow-arcade text-xs overflow-hidden transition-all font-pixel">
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3 py-2 bg-emerald-600 text-white flex items-center justify-between cursor-pointer select-none border-b-2 border-slate-950"
      >
        <div className="flex items-center gap-1.5 font-arcade text-[10px]">
          <Shield className="w-3.5 h-3.5 text-white stroke-[2.5]" />
          <span>RISK // LEGEND</span>
        </div>
        <button className="text-white hover:text-amber-200">
          {isExpanded ? <ChevronUp className="w-4 h-4 stroke-[3]" /> : <ChevronDown className="w-4 h-4 stroke-[3]" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-2.5 bg-white text-slate-950">
          {/* Risk Level Tiers */}
          <div>
            <span className="text-[9px] uppercase font-arcade text-slate-950 block mb-1.5">
              HAZARD TIERS:
            </span>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-emerald-600 border border-slate-950" />
                  <span className="font-bold text-emerald-800">LOW</span>
                </div>
                <span className="text-[10px] text-slate-600">&lt;25 mph | &lt;0.10" | &lt;0.5"</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-amber-400 border border-slate-950" />
                  <span className="font-bold text-amber-800">MODERATE</span>
                </div>
                <span className="text-[10px] text-slate-600">25–34 mph | 0.10–0.25"</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-orange-500 border border-slate-950" />
                  <span className="font-bold text-orange-800">HIGH</span>
                </div>
                <span className="text-[10px] text-slate-600">35–44 mph | 0.25–0.50"</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-red-600 border border-slate-950" />
                  <span className="font-bold text-red-700">SEVERE</span>
                </div>
                <span className="text-[10px] text-red-600 font-bold">45–54 mph | 0.50–1.00"</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-red-950 border border-slate-950" />
                  <span className="font-bold text-red-950">NO TRAVEL</span>
                </div>
                <span className="text-[10px] text-red-800 font-bold">≥55 mph | &gt;1.00"</span>
              </div>
            </div>
          </div>

          {/* Load Escalation Notice */}
          <div className="p-2 bg-orange-50 border-2 border-orange-500 text-[10px] leading-tight flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
            <span className="text-slate-900">
              <strong className="text-orange-700">&gt;30K LB:</strong> 45-54 mph = <strong>NO TRAVEL</strong><br/>
              <strong className="text-orange-700">&gt;40K LB:</strong> 35-44 mph = <strong>SEVERE</strong>
            </span>
          </div>

          {/* Heatmap Gradient Bar */}
          <div>
            <div className="flex items-center justify-between text-[9px] font-arcade text-slate-800 mb-1">
              <span>HEATMAP: {activeMetric.toUpperCase()}</span>
              <span>LOW ➜ SEVERE</span>
            </div>
            <div className="h-2 w-full border border-slate-950 bg-gradient-to-r from-emerald-600 via-amber-400 via-orange-500 to-red-700" />
          </div>
        </div>
      )}
    </div>
  );
};
