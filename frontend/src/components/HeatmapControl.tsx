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

  useEffect(() => {
    if (!isPlaying || !hours || hours.length === 0) return;

    const interval = setInterval(() => {
      onHourChange((currentHourIndex + 1) % hours.length);
    }, 400);

    return () => clearInterval(interval);
  }, [isPlaying, currentHourIndex, hours, onHourChange]);

  const currentHour = hours[currentHourIndex] || hours[0];

  return (
    <div className="bg-white border-4 border-slate-950 p-5 shadow-arcade">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b-2 border-slate-950">
        {/* Title and Forecast time */}
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-emerald-600" />
          <span className="font-arcade text-xs sm:text-sm text-slate-950">
            CORRIDOR WEATHER RADAR
          </span>
          <span className="font-arcade text-xs font-bold px-2.5 py-0.5 bg-emerald-600 text-white border-2 border-slate-950 shadow-arcade-press">
            {currentHour?.label || '+0H'}
          </span>
        </div>

        {/* Visibility Toggle and Opacity Slider */}
        <div className="flex items-center gap-4 text-xs sm:text-sm font-bold">
          <div className="flex items-center gap-2">
            <span className="text-slate-900">OPACITY:</span>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={opacity}
              onChange={(e) => onOpacityChange(Number(e.target.value))}
              className="w-24 h-2.5 bg-slate-200 border border-slate-950 appearance-none cursor-pointer accent-orange-500"
            />
            <span className="font-arcade text-xs w-10 text-right">
              {Math.round(opacity * 100)}%
            </span>
          </div>

          <button
            onClick={onToggleVisible}
            className={`px-3.5 py-1.5 font-arcade text-xs font-bold border-2 border-slate-950 shadow-arcade-press flex items-center gap-1.5 transition-all cursor-pointer ${
              isVisible
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            {isVisible ? (
              <>
                <Eye className="w-4 h-4 stroke-[2.5]" />
                <span>RADAR ON</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 stroke-[2.5]" />
                <span>RADAR OFF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4">
        {[
          { key: 'risk', label: 'COMPOSITE RISK', icon: ShieldAlert },
          { key: 'wind', label: 'WIND SPEED', icon: Wind },
          { key: 'rain', label: 'RAIN / PRECIP', icon: CloudRain },
          { key: 'snow', label: 'SNOWFALL', icon: Snowflake },
          { key: 'temp', label: 'TEMPERATURE', icon: Thermometer },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onMetricChange(key as HeatmapMetric)}
            className={`py-2.5 px-3 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border-2 border-slate-950 transition-all cursor-pointer ${
              activeMetric === key
                ? 'bg-orange-500 text-white shadow-arcade-press translate-x-0.5 translate-y-0.5 font-extrabold'
                : 'bg-white text-slate-900 hover:bg-orange-50 shadow-arcade'
            }`}
          >
            <Icon className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* 0-48 Hour Slider and Playback Controls */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-3.5 border-2 border-slate-950 shadow-arcade transition-all active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer ${
            isPlaying
              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
          title={isPlaying ? 'Pause 48h simulation' : 'Play 48h weather simulation'}
        >
          {isPlaying ? <Pause className="w-5 h-5 stroke-[3]" /> : <Play className="w-5 h-5 fill-current" />}
        </button>

        {/* Reset Button */}
        <button
          onClick={() => {
            setIsPlaying(false);
            onHourChange(0);
          }}
          className="p-3.5 bg-white hover:bg-slate-100 text-slate-950 border-2 border-slate-950 shadow-arcade transition-all active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer"
          title="Reset to Departure Time (+0h)"
        >
          <RotateCcw className="w-5 h-5 stroke-[2.5]" />
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
            className="w-full h-3 bg-slate-200 border-2 border-slate-950 appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-xs text-slate-800 font-bold mt-1.5">
            <span>+0H (DEPARTURE)</span>
            <span>+12H</span>
            <span>+24H</span>
            <span>+36H</span>
            <span>+48H (FORECAST HORIZON)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
