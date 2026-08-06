import React, { useState } from 'react';
import { BookOpen, BarChart3, Trash2, Activity, Heart, Smile, FileText, Download } from 'lucide-react';
import { DitariSubTab, PeriodDay } from '../types';
import { formatToAlbanianDate } from '../utils/cycle';

interface DitariViewProps {
  periodDays: PeriodDay[];
  onDeleteLog: (dateStr: string) => void;
  onOpenDoctorReport?: () => void;
}

export const DitariView: React.FC<DitariViewProps> = ({
  periodDays,
  onDeleteLog,
  onOpenDoctorReport
}) => {
  const [activeSubTab, setActiveSubTab] = useState<DitariSubTab>('LISTA');

  // Compute analytics
  const totalLoggedDays = periodDays.length;
  const bleedingDays = periodDays.filter(d => d.flow > 0).length;
  const totalPainScore = periodDays.reduce((acc, d) => acc + d.pain, 0);
  const avgPain = totalLoggedDays > 0 ? (totalPainScore / totalLoggedDays).toFixed(1) : '0';

  // Symptom frequency
  const symptomCounts: Record<string, number> = {};
  periodDays.forEach(d => {
    if (d.symptoms) {
      d.symptoms.split(',').forEach(s => {
        const trimmed = s.trim();
        if (trimmed) {
          symptomCounts[trimmed] = (symptomCounts[trimmed] || 0) + 1;
        }
      });
    }
  });

  const sortedSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]);

  // Mood frequency
  const moodCounts: Record<string, number> = {};
  periodDays.forEach(d => {
    if (d.mood) {
      moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1;
    }
  });

  const getFlowName = (flow: number) => ['Mungon', 'Lehtë 🩸', 'Mesatare 🩸🩸', 'Shumë 🩸🩸🩸'][flow] || '';
  const getPainName = (pain: number) => ['S\'kam', 'Lehtë ⚡', 'Mesatare ⚡⚡', 'Shumë ⚡⚡⚡'][pain] || '';

  // 7 Recent logs for chart
  const recentChartLogs = [...periodDays].slice(0, 7).reverse();

  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-4 pb-24 space-y-4">
      {/* Header with Export Action */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Ditari dhe Statistikat</h1>
        {onOpenDoctorReport && (
          <button
            onClick={onOpenDoctorReport}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#A88BFF] to-[#FF3366] text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:opacity-90 transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Raport për Mjekun</span>
          </button>
        )}
      </div>

      {/* Subtabs Selector */}
      <div className="w-full glass-card p-1.5 rounded-2xl flex gap-1 border border-white/10">
        <button
          onClick={() => setActiveSubTab('LISTA')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            activeSubTab === 'LISTA'
              ? 'bg-[#FF3366] text-white shadow-md'
              : 'text-[#AFA7CD] hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Regjistrimet</span>
        </button>

        <button
          onClick={() => setActiveSubTab('STATISTIKAT')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            activeSubTab === 'STATISTIKAT'
              ? 'bg-[#FF3366] text-white shadow-md'
              : 'text-[#AFA7CD] hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Statistikat Inteligjente</span>
        </button>
      </div>

      {activeSubTab === 'LISTA' ? (
        /* List View */
        <div className="space-y-3">
          {periodDays.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center border border-white/10">
              <span className="text-4xl block mb-3">📖</span>
              <h3 className="font-bold text-white text-base mb-1">
                Ditari është bosh
              </h3>
              <p className="text-xs text-[#AFA7CD]">
                Nuk keni regjistruar ende ndonjë të dhënë. Zgjidhni një datë në kalendar për të shtuar simptomat ose fluksin.
              </p>
            </div>
          ) : (
            periodDays.map(log => (
              <div
                key={log.dateString}
                className="glass-card rounded-3xl p-5 border border-white/10 shadow-lg relative group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm text-white">
                    {formatToAlbanianDate(log.dateString)}
                  </span>

                  <button
                    onClick={() => onDeleteLog(log.dateString)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                    title="Fshij"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-2">
                  {log.flow > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-[#FF3366]/15 text-[#FF3366] text-xs font-bold">
                      Fluksi: {getFlowName(log.flow)}
                    </span>
                  )}
                  {log.pain > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-[#A88BFF]/15 text-[#A88BFF] text-xs font-bold">
                      Dhimbja: {getPainName(log.pain)}
                    </span>
                  )}
                  {log.mood && (
                    <span className="px-2.5 py-1 rounded-lg bg-[#FFB800]/15 text-[#FFB800] text-xs font-bold">
                      {log.mood}
                    </span>
                  )}
                  {log.bbtTemp && (
                    <span className="px-2.5 py-1 rounded-lg bg-[#00D2FF]/15 text-[#00D2FF] text-xs font-bold">
                      BBT: {log.bbtTemp} °C
                    </span>
                  )}
                </div>

                {log.symptoms && (
                  <div className="mt-2">
                    <span className="block text-[10px] text-[#AFA7CD] mb-1">Simptomat:</span>
                    <div className="flex flex-wrap gap-1">
                      {log.symptoms.split(',').map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-white/5 text-[#AFA7CD] text-[11px]">
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {log.notes && (
                  <div className="mt-2 text-xs text-white/90 bg-white/5 p-2.5 rounded-xl border border-white/5">
                    "{log.notes}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Analytics View */
        <div className="space-y-4">
          {/* Doctor Report Quick Banner */}
          {onOpenDoctorReport && (
            <div
              onClick={onOpenDoctorReport}
              className="w-full glass-card rounded-3xl p-4 border border-[#A88BFF]/40 bg-gradient-to-r from-[#A88BFF]/20 via-[#FF3366]/15 to-transparent shadow-xl flex items-center justify-between cursor-pointer group hover:border-[#A88BFF] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#A88BFF] to-[#FF3366] flex items-center justify-center text-white shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-white">Gjenero Raportin Mjekësor (PDF)</h4>
                  <p className="text-[11px] text-[#AFA7CD] mt-0.5">
                    Gati për t’ia treguar mjekut apo ginekologut tuaj
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-[#A88BFF] group-hover:translate-x-1 transition-transform">
                Krijo →
              </span>
            </div>
          )}

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <span className="text-xs text-[#AFA7CD] block mb-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-[#FF3366]" />
                Ditë të Regjistruara
              </span>
              <span className="font-black text-2xl text-white">{totalLoggedDays}</span>
              <span className="text-[10px] text-[#AFA7CD] block mt-0.5">gjithsej në ditar</span>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <span className="text-xs text-[#AFA7CD] block mb-1 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Ditë me Bleeding
              </span>
              <span className="font-black text-2xl text-[#FF3366]">{bleedingDays}</span>
              <span className="text-[10px] text-[#AFA7CD] block mt-0.5">fluks i regjistruar</span>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <span className="text-xs text-[#AFA7CD] block mb-1 flex items-center gap-1">
                <Smile className="w-3.5 h-3.5 text-[#FFB800]" />
                Mesatarja e Dhimbjes
              </span>
              <span className="font-black text-2xl text-[#A88BFF]">{avgPain} / 3</span>
              <span className="text-[10px] text-[#AFA7CD] block mt-0.5">intensiteti mesatar</span>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-white/10">
              <span className="text-xs text-[#AFA7CD] block mb-1">Rregullsia e Ciklit</span>
              <span className="font-black text-2xl text-emerald-400">Pikë e Lartë</span>
              <span className="text-[10px] text-[#AFA7CD] block mt-0.5">bazuar në të dhëna</span>
            </div>
          </div>

          {/* 7-Day Flow vs Pain Chart */}
          <div className="glass-card rounded-3xl p-5 border border-white/10">
            <h3 className="font-bold text-sm text-white mb-1">Fluksi kundrejt Dhimbjes</h3>
            <p className="text-xs text-[#AFA7CD] mb-4">
              Përputhshmëria e 7 regjistrimeve të fundit
            </p>

            {recentChartLogs.length === 0 ? (
              <p className="text-xs text-[#AFA7CD] text-center py-6">
                Regjistroni të paktën një ditë për të parë grafikun inteligjent.
              </p>
            ) : (
              <div className="space-y-3 pt-2">
                {recentChartLogs.map(l => (
                  <div key={l.dateString} className="space-y-1">
                    <div className="flex justify-between text-[11px] text-[#AFA7CD]">
                      <span>{formatToAlbanianDate(l.dateString)}</span>
                      <span>Fluksi: {l.flow}/3 | Dhimbja: {l.pain}/3</span>
                    </div>

                    <div className="flex items-center gap-1.5 h-2.5 rounded-full bg-white/5 overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-[#FF3366] transition-all"
                        style={{ width: `${(l.flow / 3) * 100}%` }}
                      />
                      <div
                        className="h-full rounded-full bg-[#A88BFF] transition-all"
                        style={{ width: `${(l.pain / 3) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-center gap-4 text-[10px] text-[#AFA7CD] pt-2">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF3366]" />
                    Fluksi
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#A88BFF]" />
                    Dhimbja
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Top Symptoms Breakdown */}
          {sortedSymptoms.length > 0 && (
            <div className="glass-card rounded-3xl p-5 border border-white/10">
              <h3 className="font-bold text-sm text-white mb-3">Shpeshtësia e Simptomave</h3>
              <div className="space-y-2">
                {sortedSymptoms.map(([sym, count]) => {
                  const pct = Math.round((count / totalLoggedDays) * 100);
                  return (
                    <div key={sym} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white font-medium">{sym}</span>
                        <span className="text-[#AFA7CD] font-bold">{count} herë ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#FF3366] to-[#A88BFF]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mood Distribution */}
          {Object.keys(moodCounts).length > 0 && (
            <div className="glass-card rounded-3xl p-5 border border-white/10">
              <h3 className="font-bold text-sm text-white mb-3">Shpërndarja e Humorit</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(moodCounts).map(([m, cnt]) => (
                  <div
                    key={m}
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs"
                  >
                    <span className="font-bold text-white">{m}</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#FFB800]/20 text-[#FFB800] font-black">
                      {cnt}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
