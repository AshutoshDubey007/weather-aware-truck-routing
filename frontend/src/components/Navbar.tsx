import React from 'react';
import { Truck, ShieldAlert, Sparkles } from 'lucide-react';

interface NavbarProps {
  onOpenRules: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenRules }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-blue-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
          <Truck className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-white tracking-tight">spotter</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 font-medium">
              Weather-Aware Routing
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Intelligent route risk optimization for heavy transport
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenRules}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors shadow-sm"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Safety & Load Rules</span>
        </button>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>Live 48h Weather Forecast</span>
        </div>
      </div>
    </header>
  );
};
