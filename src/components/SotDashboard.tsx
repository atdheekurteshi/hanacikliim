import React, { useState } from 'react';
import { Settings, Calendar as CalendarIcon, Info, Plus } from 'lucide-react';
import { AppSettings, CyclePeriod, PeriodDay } from '../types';
import {
  formatISODate,
  formatToAlbanianDate,
  getCycleState,
  getTodayISO,
  parseISODate,
  ALBANIAN_DAYS_SHORT
} from '../utils/cycle';
import { IFMoonPhaseCanvas } from './IFMoonPhaseCanvas';
import { WaterTrackerCard } from './WaterTrackerCard';
import { CycleLoggingComponent } from './CycleLoggingComponent';

interface SotDashboardProps {
  settings: AppSettings;
  cyclePeriods: CyclePeriod[];
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  onOpenSettings: () => void;
  onSaveCyclePeriod: (startDate: string, endDate: string | null, id?: number) => void;
  onDeleteCyclePeriod: (id: number) => void;
  onUpdateWater: (waterKey: string, ml: number) => void;
  onTogglePeriodStartToday: () => void;
  onOpenAiTab?: () => void;
}

export const SotDashboard: React.FC<SotDashboardProps> = ({
  settings,
  cyclePeriods,
  selectedDateStr,
  onSelectDate,
  onOpenSettings,
  onSaveCyclePeriod,
  onDeleteCyclePeriod,
  onUpdateWater,
  onTogglePeriodStartToday,
  onOpenAiTab
}) => {
  const todayISO = getTodayISO();
  const selectedDate = parseISODate(selectedDateStr);
  const cycleState = getCycleState(selectedDateStr, settings);

  // Generate 11 dates strip (-4..+6 days around today)
  const dateStrip = React.useMemo(() => {
    const dates: string[] = [];
    const base = parseISODate(todayISO);
    for (let i = -4; i <= 6; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      dates.push(formatISODate(d));
    }
    return dates;
  }, [todayISO]);

  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-4 pb-24 flex flex-col items-center">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full p-[2px] flex items-center justify-center transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${cycleState.colorHex}, ${cycleState.colorHex}66)`
            }}
          >
            <div className="w-full h-full rounded-full bg-[#18122B] flex items-center justify-center text-xl">
              🌙
            </div>
          </div>

          <div>
            <h1 className="font-bold text-lg text-white">
              Përshëndetje, {settings.username || 'Vajzë'}! ✨
            </h1>
            <p className="text-xs font-medium text-[#AFA7CD]">
              {selectedDateStr === todayISO
                ? `Sot • ${formatToAlbanianDate(selectedDateStr)}`
                : formatToAlbanianDate(selectedDateStr)}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="w-11 h-11 rounded-full glass-card flex items-center justify-center text-rose-400 hover:text-white hover:border-rose-400/40 transition shadow-lg cursor-pointer"
          aria-label="Cilësimet"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Horizontal Date Strip */}
      <div className="w-full flex gap-2 overflow-x-auto no-scrollbar py-2 px-1">
        {dateStrip.map(dStr => {
          const isSelected = dStr === selectedDateStr;
          const isToday = dStr === todayISO;
          const stateForDate = getCycleState(dStr, settings);
          const dObj = parseISODate(dStr);
          const dayName = ALBANIAN_DAYS_SHORT[dObj.getDay()];

          return (
            <button
              key={dStr}
              onClick={() => onSelectDate(dStr)}
              className={`min-w-[56px] py-2.5 px-1 rounded-2xl flex flex-col items-center justify-center border transition cursor-pointer ${
                isSelected
                  ? 'border-transparent text-white shadow-md'
                  : isToday
                  ? 'bg-[#FF3366]/10 border-[#FF3366]/40 text-[#F3F0FF]'
                  : 'glass-card border-white/10 text-[#AFA7CD]'
              }`}
              style={{
                backgroundColor: isSelected ? stateForDate.colorHex : undefined
              }}
            >
              <span className={`text-[10px] font-medium ${isSelected ? 'text-white' : 'text-[#AFA7CD]'}`}>
                {dayName}
              </span>
              <span className="font-bold text-base my-0.5">
                {dObj.getDate()}
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: isSelected ? '#FFFFFF' : stateForDate.colorHex
                }}
              />
            </button>
          );
        })}
      </div>

      {selectedDateStr !== todayISO && (
        <button
          onClick={() => onSelectDate(todayISO)}
          className="text-xs font-bold text-[#FF3366] hover:underline mt-1 mb-2 cursor-pointer"
        >
          Kthehu te e sotmja 🔄
        </button>
      )}

      {/* Central Luminous Moon Ring */}
      <div className="my-6 relative flex flex-col items-center">
        <div
          className="w-64 h-64 rounded-full glass-card p-6 flex flex-col items-center justify-center shadow-2xl relative transition-all duration-500"
          style={{
            borderColor: `${cycleState.colorHex}66`,
            boxShadow: `0 0 40px ${cycleState.colorHex}25`
          }}
        >
          <IFMoonPhaseCanvas
            cycleDay={cycleState.cycleDay}
            cycleLength={settings.cycleLength}
            phaseColor={cycleState.colorHex}
          />

          <h2 className="font-black text-2xl text-white mt-2">
            {cycleState.cycleDay > 0 ? `Dita ${cycleState.cycleDay}` : "S'ka të dhëna"}
          </h2>

          <div
            className="mt-1 px-3 py-1 rounded-xl text-xs font-bold border transition-all"
            style={{
              backgroundColor: `${cycleState.colorHex}20`,
              borderColor: `${cycleState.colorHex}50`,
              color: cycleState.colorHex
            }}
          >
            {cycleState.phaseName}
          </div>
        </div>
      </div>

      {/* Cycle State Card */}
      <div className="w-full glass-card rounded-3xl p-5 shadow-lg border border-white/10 my-2">
        <h3 className="font-bold text-sm text-white mb-2">Gjendja e Ciklit</h3>
        <p className="text-xs text-[#AFA7CD] leading-relaxed mb-4">
          {cycleState.phaseDescription}
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 flex flex-col">
            <span className="text-[11px] text-[#AFA7CD] font-medium flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5 text-[#FF3366]" />
              Periodat tjetër
            </span>
            <span className="font-bold text-sm text-white mt-1">
              Pas {cycleState.nextPeriodDaysLeft} ditësh
            </span>
            <span className="text-[10px] text-[#AFA7CD] mt-0.5">
              Më {cycleState.nextPeriodDateFormatted.split(', ')[1] || cycleState.nextPeriodDateFormatted}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 flex flex-col">
            <span className="text-[11px] text-[#AFA7CD] font-medium flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-[#FFB800]" />
              Dritarja e Ovulimit
            </span>
            <span className="font-bold text-sm text-white mt-1">
              {cycleState.isFertile ? 'Sot: Pjellore' : `Pas ${cycleState.ovulationDayLeft} ditëve`}
            </span>
            <span className="text-[10px] text-[#AFA7CD] mt-0.5">
              {cycleState.isFertile ? 'Dritare e lartë' : 'Gjurmo ditët'}
            </span>
          </div>
        </div>
      </div>

      {/* AI Assistant Quick Banner */}
      {onOpenAiTab && (
        <div
          onClick={onOpenAiTab}
          className="w-full glass-card rounded-3xl p-4 my-2 border border-[#A88BFF]/40 bg-gradient-to-r from-[#A88BFF]/15 via-[#FF3366]/10 to-transparent shadow-xl flex items-center justify-between cursor-pointer group hover:border-[#A88BFF] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#A88BFF] flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-xs text-white">Hëna AI • Asistentja e Mendshme</h4>
                <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-[#FF3366] text-white rounded-full">
                  SOT
                </span>
              </div>
              <p className="text-[11px] text-[#AFA7CD] mt-0.5">
                Këshilla ushqimi, ushtrime & përgjigje për fazën {cycleState.phaseName}
              </p>
            </div>
          </div>

          <div className="text-xs font-bold text-[#A88BFF] group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
            <span>Hap</span>
            <span>→</span>
          </div>
        </div>
      )}

      {/* Water Hydration Tracker */}
      <WaterTrackerCard
        selectedDateStr={selectedDateStr}
        settings={settings}
        onUpdateWater={onUpdateWater}
        phaseName={cycleState.phaseName}
      />

      {/* Cycle Period Logging Form */}
      <CycleLoggingComponent
        cyclePeriods={cyclePeriods}
        onSaveCyclePeriod={onSaveCyclePeriod}
        onDeleteCyclePeriod={onDeleteCyclePeriod}
      />

      {/* Toggle Period Start Button */}
      <button
        onClick={onTogglePeriodStartToday}
        className="w-full mt-4 py-4 px-6 rounded-2xl bg-[#FF3366] hover:bg-[#FF3366]/90 text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl luminous-glow-rose transition-all transform active:scale-98 cursor-pointer"
      >
        <Plus className="w-5 h-5" />
        <span>Filluan periodat sot! 🩸</span>
      </button>
    </div>
  );
};
