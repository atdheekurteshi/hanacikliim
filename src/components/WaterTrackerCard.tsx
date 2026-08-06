import React from 'react';
import { Droplet, Trash2 } from 'lucide-react';
import { AppSettings } from '../types';

interface WaterTrackerCardProps {
  selectedDateStr: string;
  settings: AppSettings;
  onUpdateWater: (waterKey: string, ml: number) => void;
  phaseName: string;
}

export const WaterTrackerCard: React.FC<WaterTrackerCardProps> = ({
  selectedDateStr,
  settings,
  onUpdateWater,
  phaseName
}) => {
  const waterKey = `water_ml_${selectedDateStr}`;
  const loggedWater = Number(settings[waterKey]) || 0;
  const targetWater = 2000;
  const progress = Math.min(1, Math.max(0, loggedWater / targetWater));

  return (
    <div className="w-full glass-card rounded-3xl p-5 shadow-lg border border-[#00D2FF]/20 my-3 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#00D2FF]/15 flex items-center justify-center text-lg">
            💧
          </div>
          <h3 className="font-bold text-base text-[#F3F0FF]">Gjurmuesi i Hidratimit</h3>
        </div>

        <div className="px-3 py-1 rounded-xl bg-[#00D2FF]/15 border border-[#00D2FF]/30 text-[#00D2FF] font-bold text-xs">
          {loggedWater} / {targetWater} ml
        </div>
      </div>

      <p className="text-xs text-[#AFA7CD] leading-snug mb-3">
        Pini mjaftueshëm ujë sot për të ndihmuar trupin gjatë {phaseName.toLowerCase()}.
      </p>

      {/* Progress bar */}
      <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#00D2FF] to-[#0088FF] transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateWater(waterKey, loggedWater + 250)}
          className="flex-1 py-2 rounded-xl bg-[#3B82F6]/15 hover:bg-[#3B82F6]/25 text-[#3B82F6] font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
        >
          +250 ml 🥛
        </button>

        <button
          onClick={() => onUpdateWater(waterKey, loggedWater + 500)}
          className="flex-1 py-2 rounded-xl bg-[#3B82F6]/15 hover:bg-[#3B82F6]/25 text-[#3B82F6] font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
        >
          +500 ml 🥤
        </button>

        {loggedWater > 0 && (
          <button
            onClick={() => onUpdateWater(waterKey, Math.max(0, loggedWater - 250))}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-rose-400 transition cursor-pointer"
            title="Hiq"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
