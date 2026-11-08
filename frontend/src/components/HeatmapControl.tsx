import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Layers, 
  Wind, 
  CloudRain, 
  Snowflake, 
  ShieldAlert, 
  Thermometer, 
  Eye,
  EyeOff
} from 'lucide-react';
import { HeatmapHour } from '../types';

export type HeatmapMetric = 'risk' | 'wind' | 'rain' | 'snow' | 'temp';

interface HeatmapControlProps {
  hours: HeatmapHour[];
  currentHourIndex: number;
  onHourChange: (index: number) => void;
  activeMetric: HeatmapMetric;
  onMetricChange: (metric: HeatmapMetric) => void;
  isVisible: boolean;
  onToggleVisible: () => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
}

export const HeatmapControl: React.FC<HeatmapControlProps> = ({
  hours,
  currentHourIndex,
  onHourChange,
  activeMetric,
  onMetricChange,
  isVisible,
  onToggleVisible,
  opacity,
  onOpacityChange,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Playback loop
  useEffect(() => {
    if (!isPlaying || !hours || hours.length === 0) return;

    const interval = setInterval(() => {
      onHourChange((currentHourIndex + 1) % hours.length);
    }, 400);

    return () => clearInterval(interval);
  }, [isPlaying, currentHourIndex, hours, onHourChange]);

  const currentHour = hours[currentHourIndex] || hours[0];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        {/* Title and Forecast time */}
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Corridor Weather Heatmap
          </span>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
            {currentHour?.label || '+0h'}
          </span>
        </div>

        {/* Visibility Toggle and Opacity Slider */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-[10px]">Opacity:</span>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={opacity}
              onChange={(e) => onOpacityChange(Number(e.target.value))}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
            <span className="font-mono text-[10px] w-7 text-right">
              {Math.round(opacity * 100)}%
            </span>
          </div>

          <button
            onClick={onToggleVisible}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              isVisible
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
            }`}
          >
            {isVisible ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Active</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hidden</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-3">
        {[
          { key: 'risk', label: 'Composite Risk', icon: ShieldAlert, color: 'text-amber-400' },
          { key: 'wind', label: 'Wind Speed', icon: Wind, color: 'text-cyan-400' },
          { key: 'rain', label: 'Precip / Rain', icon: CloudRain, color: 'text-blue-400' },
          { key: 'snow', label: 'Snowfall', icon: Snowflake, color: 'text-indigo-300' },
          { key: 'temp', label: 'Temperature', icon: Thermometer, color: 'text-emerald-400' },
        ].map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => onMetricChange(key as HeatmapMetric)}
            className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
              activeMetric === key
                ? 'bg-slate-800 text-white border-teal-500/60 shadow-md shadow-teal-500/10'
                : 'bg-slate-950/60 text-slate-400 border-slate-800/80 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${color}`} />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* 0-48 Hour Slider and Playback Controls */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-2 rounded-xl font-bold transition-all shadow-md ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
          }`}
          title={isPlaying ? 'Pause 48h simulation' : 'Play 48h weather simulation'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
        </button>

        {/* Reset Button */}
        <button
          onClick={() => {
            setIsPlaying(false);
            onHourChange(0);
          }}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          title="Reset to Departure Time (+0h)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Slider */}
        <div className="flex-1 relative flex flex-col justify-center">
          <input
            type="range"
            min={0}
            max={Math.max(0, hours.length - 1)}
            value={currentHourIndex}
            onChange={(e) => {
              setIsPlaying(false);
              onHourChange(Number(e.target.value));
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>+0h (Departure)</span>
            <span>+12h</span>
            <span>+24h</span>
            <span>+36h</span>
            <span>+48h (Forecast Horizon)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
