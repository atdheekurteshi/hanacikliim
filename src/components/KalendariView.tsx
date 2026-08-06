import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { AppSettings, PeriodDay } from '../types';
import {
  formatISODate,
  formatToAlbanianDate,
  getMonthYearAlbanian,
  getTodayISO,
  parseISODate,
  differenceInDays
} from '../utils/cycle';
import { SymptomLogModal } from './SymptomLogModal';

interface KalendariViewProps {
  settings: AppSettings;
  periodDays: PeriodDay[];
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  onSaveLog: (log: PeriodDay) => void;
  onDeleteLog: (dateStr: string) => void;
}

export const KalendariView: React.FC<KalendariViewProps> = ({
  settings,
  periodDays,
  selectedDateStr,
  onSelectDate,
  onSaveLog,
  onDeleteLog
}) => {
  const [viewDate, setViewDate] = useState(() => parseISODate(selectedDateStr));
  const [showLogModal, setShowLogModal] = useState(false);

  const selectedLog = periodDays.find(d => d.dateString === selectedDateStr);

  const navigateMonth = (delta: number) => {
    const updated = new Date(viewDate);
    updated.setMonth(updated.getMonth() + delta);
    setViewDate(updated);
  };

  // Calendar Grid Calculations
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Day of week: 0 = Sunday, 1 = Monday. We want Monday = 0, Sunday = 6.
  const rawDay = firstDayOfMonth.getDay();
  const leadingEmptyCells = (rawDay + 6) % 7;

  const totalCells = leadingEmptyCells + daysInMonth;
  const rowsCount = Math.ceil(totalCells / 7);

  const todayISO = getTodayISO();

  const getFlowName = (flow: number) => ['Mungon', 'Lehtë', 'Mesatare', 'Shumë'][flow] || '';
  const getPainName = (pain: number) => ['S\'kam', 'Lehtë', 'Mesatare', 'Mjaftueshëm Fortë'][pain] || '';

  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-4 pb-24">
      <h1 className="text-xl font-bold text-white mb-3">Kalendari i Ciklit</h1>

      {/* Month Card */}
      <div className="w-full glass-card rounded-3xl p-5 shadow-lg border border-white/10 mb-5">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition cursor-pointer"
            aria-label="Muaji i kaluar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="font-bold text-base text-white">
            {getMonthYearAlbanian(formatISODate(viewDate))}
          </h2>

          <button
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition cursor-pointer"
            aria-label="Muaji tjetër"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 text-center font-bold text-xs text-[#AFA7CD] mb-2">
          {['H', 'M', 'M', 'E', 'P', 'S', 'D'].map((day, idx) => (
            <div key={idx} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: rowsCount * 7 }).map((_, cellIdx) => {
            const dayNum = cellIdx - leadingEmptyCells + 1;

            if (cellIdx < leadingEmptyCells || dayNum > daysInMonth) {
              return <div key={cellIdx} className="aspect-square" />;
            }

            const cellDate = new Date(year, month, dayNum);
            const cellDateStr = formatISODate(cellDate);

            const isToday = cellDateStr === todayISO;
            const isSelected = cellDateStr === selectedDateStr;

            const loggedDay = periodDays.find(d => d.dateString === cellDateStr);
            const hasLoggedBleeding = loggedDay && loggedDay.flow > 0;

            // Prediction logic
            let isPredictedPeriod = false;
            let isPredictedFertile = false;

            if (settings.lastPeriodStart) {
              const lastStart = parseISODate(settings.lastPeriodStart);
              const daysDiff = differenceInDays(cellDate, lastStart);
              if (daysDiff >= 0) {
                const cDay = (daysDiff % settings.cycleLength) + 1;
                const ovulationDay = settings.cycleLength - 14;
                if (cDay >= 1 && cDay <= settings.periodLength) {
                  isPredictedPeriod = true;
                } else if (cDay >= ovulationDay - 3 && cDay <= ovulationDay + 1) {
                  isPredictedFertile = true;
                }
              }
            }

            return (
              <button
                key={cellIdx}
                onClick={() => onSelectDate(cellDateStr)}
                className={`aspect-square rounded-full flex flex-col items-center justify-center relative transition cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-[#FF3366] bg-[#FF3366]/25 font-bold text-white'
                    : hasLoggedBleeding
                    ? 'bg-[#FF3366]/20 text-[#FF3366] font-bold'
                    : isPredictedPeriod
                    ? 'bg-[#FF3366]/10 text-[#FF3366]'
                    : isPredictedFertile
                    ? 'bg-[#FFB800]/15 text-[#FFB800] font-semibold'
                    : isToday
                    ? 'bg-white/10 text-white font-bold border border-white/20'
                    : 'hover:bg-white/5 text-[#F3F0FF]'
                }`}
              >
                <span className="text-xs">{dayNum}</span>

                {/* Indicator dots */}
                <div className="flex items-center gap-0.5 mt-0.5">
                  {loggedDay && loggedDay.symptoms && (
                    <span className="w-1 h-1 rounded-full bg-[#A88BFF]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details Card */}
      <div className="w-full glass-card rounded-3xl p-5 shadow-lg border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-sm text-white">
              {formatToAlbanianDate(selectedDateStr)}
            </h3>
            <p className="text-[11px] text-[#AFA7CD]">
              {selectedDateStr === todayISO ? 'Dita e zgjedhur: Sot' : 'Detajet e ditës'}
            </p>
          </div>

          <button
            onClick={() => setShowLogModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#FF3366]/20 hover:bg-[#FF3366]/30 text-[#FF3366] font-bold text-xs flex items-center gap-1 transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{selectedLog ? 'Ndrysho' : 'Regjistro'}</span>
          </button>
        </div>

        {!selectedLog ? (
          <p className="text-xs text-[#AFA7CD] text-center py-6">
            Nuk keni regjistruar simptoma ose fluks për këtë ditë. Klikoni 'Regjistro' më lart.
          </p>
        ) : (
          <div className="space-y-3 pt-2 border-t border-white/10">
            {selectedLog.flow > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#AFA7CD]">Fluksi menstrual:</span>
                <span className="font-bold text-[#FF3366] px-2.5 py-1 rounded-lg bg-[#FF3366]/15">
                  {getFlowName(selectedLog.flow)}
                </span>
              </div>
            )}

            {selectedLog.pain > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#AFA7CD]">Dhimbja:</span>
                <span className="font-bold text-[#A88BFF] px-2.5 py-1 rounded-lg bg-[#A88BFF]/15">
                  {getPainName(selectedLog.pain)}
                </span>
              </div>
            )}

            {selectedLog.mood && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#AFA7CD]">Humori:</span>
                <span className="font-bold text-[#FFB800] px-2.5 py-1 rounded-lg bg-[#FFB800]/15">
                  {selectedLog.mood}
                </span>
              </div>
            )}

            {selectedLog.symptoms && (
              <div>
                <span className="block text-[11px] font-bold text-[#AFA7CD] mb-1.5">
                  Simptomat e regjistruara:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedLog.symptoms.split(',').map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-[#FF3366]/10 text-[#FF3366] text-xs font-medium"
                    >
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedLog.notes && (
              <div>
                <span className="block text-[11px] font-bold text-[#AFA7CD] mb-1">
                  Shënime personale:
                </span>
                <p className="text-xs text-white bg-white/5 p-2.5 rounded-xl">
                  {selectedLog.notes}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => onDeleteLog(selectedDateStr)}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Fshij logun</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Modal */}
      {showLogModal && (
        <SymptomLogModal
          selectedDateStr={selectedDateStr}
          existingLog={selectedLog}
          onSaveLog={log => {
            onSaveLog(log);
            setShowLogModal(false);
          }}
          onClose={() => setShowLogModal(false)}
        />
      )}
    </div>
  );
};
