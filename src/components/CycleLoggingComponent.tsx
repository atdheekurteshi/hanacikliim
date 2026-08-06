import React, { useState } from 'react';
import { Calendar as CalendarIcon, Check, Edit3, Trash2 } from 'lucide-react';
import { CyclePeriod } from '../types';
import { getTodayISO, parseISODate, formatISODate, formatToAlbanianDate } from '../utils/cycle';

interface CycleLoggingComponentProps {
  cyclePeriods: CyclePeriod[];
  onSaveCyclePeriod: (startDate: string, endDate: string | null, id?: number) => void;
  onDeleteCyclePeriod: (id: number) => void;
}

export const CycleLoggingComponent: React.FC<CycleLoggingComponentProps> = ({
  cyclePeriods,
  onSaveCyclePeriod,
  onDeleteCyclePeriod
}) => {
  const [startDateInput, setStartDateInput] = useState(getTodayISO());
  const [endDateInput, setEndDateInput] = useState('');
  const [editingCycleId, setEditingCycleId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const activeOngoingCycle = cyclePeriods.find(c => c.endDateString === null);

  const handleStartToday = () => {
    try {
      const today = getTodayISO();
      onSaveCyclePeriod(today, null);
      setSuccessMessage('U regjistrua një cikël i ri sot! 🩸');
      setErrorMessage('');
    } catch (e: any) {
      setErrorMessage(e.message || 'Gabim gjatë fillimit të ciklit.');
      setSuccessMessage('');
    }
  };

  const handleCloseToday = () => {
    if (!activeOngoingCycle) return;
    try {
      const today = getTodayISO();
      if (today < activeOngoingCycle.startDateString) {
        throw new Error('Data e sotme është para datës së fillimit të ciklit.');
      }
      onSaveCyclePeriod(activeOngoingCycle.startDateString, today, activeOngoingCycle.id);
      setSuccessMessage('Cikli u mbyll me sukses sot! 🏁');
      setErrorMessage('');
    } catch (e: any) {
      setErrorMessage(e.message || 'Gabim gjatë mbylljes së ciklit.');
      setSuccessMessage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDateInput) {
      setErrorMessage('Ju lutemi vendosni datën e fillimit.');
      return;
    }

    try {
      // Validate date formats
      parseISODate(startDateInput);
      if (endDateInput) {
        parseISODate(endDateInput);
        if (endDateInput < startDateInput) {
          setErrorMessage('Data e mbarimit s\'mund të jetë para datës së fillimit.');
          return;
        }
      }

      onSaveCyclePeriod(
        startDateInput,
        endDateInput ? endDateInput : null,
        editingCycleId ?? undefined
      );

      setSuccessMessage(editingCycleId ? 'Cikli u përditësua me sukses! ✨' : 'Cikli u regjistrua me sukses! 🩸');
      setErrorMessage('');
      setEditingCycleId(null);
      setStartDateInput(getTodayISO());
      setEndDateInput('');
    } catch {
      setErrorMessage('Formati i datës duhet të jetë VVVV-MM-DD.');
      setSuccessMessage('');
    }
  };

  const handleStartEdit = (cycle: CyclePeriod) => {
    setEditingCycleId(cycle.id);
    setStartDateInput(cycle.startDateString);
    setEndDateInput(cycle.endDateString || '');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleCancelEdit = () => {
    setEditingCycleId(null);
    setStartDateInput(getTodayISO());
    setEndDateInput('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div className="w-full glass-card rounded-3xl p-5 shadow-lg my-3 border border-rose-500/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[#FF3366]" />
          <h3 className="font-bold text-[#F3F0FF] text-base">
            {editingCycleId !== null ? 'Redaktimi i Ciklit ✍️' : 'Regjistrimi i Ciklit 🩸'}
          </h3>
        </div>

        {editingCycleId !== null && (
          <span className="px-2 py-1 rounded-md bg-[#FF3366]/20 text-[#FF3366] text-xs font-bold">
            Në redaktim
          </span>
        )}
      </div>

      <p className="text-xs text-[#AFA7CD] mb-4">
        {editingCycleId !== null
          ? 'Përditësoni datat e fillimit dhe mbarimit të ciklit të përzgjedhur.'
          : 'Regjistroni datat e fillimit dhe mbarimit të ciklit tuaj menstrual.'}
      </p>

      {/* Quick Actions */}
      {editingCycleId === null && (
        <div className="flex gap-2 mb-4">
          {activeOngoingCycle ? (
            <button
              type="button"
              onClick={handleCloseToday}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#FF3366]/15 hover:bg-[#FF3366]/25 text-[#FF3366] font-bold text-xs transition cursor-pointer"
            >
              Mbyll ciklin sot 🏁
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartToday}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#FF3366]/15 hover:bg-[#FF3366]/25 text-[#FF3366] font-bold text-xs transition cursor-pointer"
            >
              Më filloi cikli sot 🩸
            </button>
          )}
        </div>
      )}

      {/* Inputs Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-[#AFA7CD] mb-1">
            Data e fillimit (VVVV-MM-DD)
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDateInput}
              onChange={e => {
                setStartDateInput(e.target.value);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF3366]"
            />
            <button
              type="button"
              onClick={() => setStartDateInput(getTodayISO())}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
            >
              Sot
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#AFA7CD] mb-1">
            Data e mbarimit (opsionale, lini bosh nëse vazhdon)
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={endDateInput}
              onChange={e => {
                setEndDateInput(e.target.value);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF3366]"
            />
            {endDateInput && (
              <button
                type="button"
                onClick={() => setEndDateInput('')}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-rose-300 font-semibold"
              >
                Pastro
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <p className="text-xs font-semibold text-rose-400">{errorMessage}</p>
        )}
        {successMessage && (
          <p className="text-xs font-semibold text-emerald-400">{successMessage}</p>
        )}

        <div className="flex gap-2 pt-2">
          {editingCycleId !== null && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition"
            >
              Anulo
            </button>
          )}

          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl bg-[#FF3366] hover:bg-[#FF3366]/90 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            {editingCycleId !== null ? 'Ruaj Përditësimin' : 'Ruaj Ciklin'}
          </button>
        </div>
      </form>

      {/* Logged Periods History List */}
      {cyclePeriods.length > 0 && (
        <div className="mt-5 pt-4 border-t border-white/10">
          <h4 className="text-xs font-bold text-[#AFA7CD] mb-2">Ciklet e Regjistruara</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
            {cyclePeriods.map(c => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs"
              >
                <div>
                  <span className="font-bold text-white">
                    {formatToAlbanianDate(c.startDateString)}
                  </span>
                  <span className="text-[#AFA7CD] ml-1">
                    {c.endDateString ? `— ${formatToAlbanianDate(c.endDateString)}` : '(Në vazhdim)'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(c)}
                    className="p-1 text-slate-300 hover:text-white transition"
                    title="Ndrysho"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteCyclePeriod(c.id)}
                    className="p-1 text-rose-400 hover:text-rose-300 transition"
                    title="Fshij"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
