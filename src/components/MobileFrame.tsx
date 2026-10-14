import React from 'react';
import { Wifi, Battery, Signal, Maximize2, Minimize2 } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  isExpanded,
  onToggleExpand,
}) => {
  return (
    <div className={`relative transition-all duration-300 ${isExpanded ? 'w-full max-w-xl mx-auto' : 'w-[400px] h-[820px] max-h-[92vh]'}`}>
      <div className="relative w-full h-full bg-slate-900 rounded-[44px] p-3 shadow-2xl ring-1 ring-slate-800/80 shadow-teal-950/20 flex flex-col overflow-hidden border-4 border-slate-700/60">
        
        {/* Dynamic Island / Speaker Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center">
          <div className="w-28 h-6 bg-slate-950 rounded-full flex items-center justify-between px-3.5 shadow-inner border border-slate-800/60">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500/80 animate-pulse"></div>
            <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/60"></div>
            </div>
          </div>
        </div>

        {/* Screen Bezel Content */}
        <div className="relative w-full h-full bg-slate-50 text-slate-800 rounded-[34px] overflow-hidden flex flex-col font-sans select-none">
          
          {/* iOS / Flutter Status Bar */}
          <div className="h-11 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between text-xs font-semibold text-slate-700 border-b border-slate-100 z-40 shrink-0">
            <span className="tracking-tight text-slate-900 font-bold">9:41</span>
            <div className="flex items-center gap-1.5 text-slate-700">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4 fill-slate-700" />
            </div>
          </div>

          {/* Screen Content Container */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col scrollbar-thin scrollbar-thumb-slate-200">
            {children}
          </div>

          {/* Home Indicator Bar */}
          <div className="h-5 bg-white flex items-center justify-center shrink-0 border-t border-slate-100">
            <div className="w-32 h-1 bg-slate-300 rounded-full"></div>
          </div>
        </div>

        {/* Expand toggle on phone frame top-right corner */}
        <button
          onClick={onToggleExpand}
          title={isExpanded ? "Collapse frame" : "Expand mobile frame"}
          className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors z-50"
        >
          {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
