import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { HeatmapMetric } from './HeatmapControl';

interface RiskLegendProps {
  activeMetric: HeatmapMetric;
}

export const RiskLegend: React.FC<RiskLegendProps> = ({ activeMetric }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="absolute top-4 right-4 z-[400] max-w-xs bg-slate-900/90 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-md text-xs overflow-hidden transition-all">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3 py-2 bg-slate-800/80 flex items-center justify-between cursor-pointer select-none border-b border-slate-700/60"
      >
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <Shield className="w-3.5 h-3.5 text-teal-400" />
          <span>Risk & Heatmap Legend</span>
        </div>
        <button className="text-slate-400 hover:text-white">
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-2.5">
          {/* Risk Level Tiers */}
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">
              Checkpoint Risk Tiers
            </span>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-300">Low</span>
                </div>
                <span className="text-slate-400 text-[10px]">&lt;25 mph | &lt;0.10" | &lt;0.5"</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-slate-300">Moderate</span>
                </div>
                <span className="text-slate-400 text-[10px]">25–34 mph | 0.10–0.25" | 0.5–1.0"</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="text-slate-300">High</span>
                </div>
                <span className="text-slate-400 text-[10px]">35–44 mph | 0.25–0.50" | 1.0–2.0"</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-300 font-semibold">Severe</span>
                </div>
                <span className="text-rose-400 text-[10px]">45–54 mph | 0.50–1.00" | 2.0–3.0"</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-900 border border-rose-500" />
                  <span className="text-rose-300 font-bold">No Travel</span>
                </div>
                <span className="text-rose-400 font-semibold text-[10px]">≥55 mph | &gt;1.00" | &gt;3.0"</span>
              </div>
            </div>
          </div>

          {/* Load Rule Callout */}
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200 leading-tight flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Load Escalation:</strong> Winds 45–54 mph with &gt;30k lb escalate to <strong>No Travel</strong>; 35–44 mph with &gt;40k lb escalate to <strong>Severe</strong>.
            </span>
          </div>

          {/* Active Metric Gradient */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Heatmap: {activeMetric.toUpperCase()}</span>
              <span>Low → Severe</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 via-rose-500 to-rose-950" />
          </div>
        </div>
      )}
    </div>
  );
};
