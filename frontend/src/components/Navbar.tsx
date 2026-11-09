import React from 'react';
import { Truck, ShieldAlert, Sparkles, Gamepad2 } from 'lucide-react';

interface NavbarProps {
  onOpenRules: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenRules }) => {
  return (
    <header className="border-b-4 border-slate-950 bg-white sticky top-0 z-40 px-4 lg:px-8 py-3.5 shadow-arcade flex items-center justify-between">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-emerald-600 border-2 border-slate-950 flex items-center justify-center shadow-arcade-orange transform -rotate-1">
          <Truck className="w-6 h-6 text-white stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-arcade text-base sm:text-lg text-slate-950 tracking-wider">
              SPOTTER
            </span>
            <span className="text-[10px] font-arcade px-2 py-0.5 bg-orange-500 text-white border-2 border-slate-950 shadow-arcade-press">
              WEATHER-ROUTER
            </span>
          </div>
          <p className="text-[11px] font-pixel text-emerald-700 hidden sm:block mt-0.5">
            ★ MISSION: CALCULATE SAFEST HIGHWAY CORRIDOR ★
          </p>
        </div>
      </div>

      {/* Arcade Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Weather Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 border-2 border-slate-950 font-pixel text-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 arcade-blink" />
          <span>48H FORECAST ONLINE</span>
        </div>

        {/* Safety Rules Button */}
        <button
          onClick={onOpenRules}
          className="flex items-center gap-2 px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-white font-arcade text-[10px] sm:text-xs border-2 border-slate-950 shadow-arcade transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          <ShieldAlert className="w-4 h-4 text-white" />
          <span>RULES [!]</span>
        </button>

        {/* 1P Ready Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 text-white font-arcade text-[10px]">
          <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-400">1P READY</span>
        </div>
      </div>
    </header>
  );
};
