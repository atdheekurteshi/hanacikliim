import React, { useState } from 'react';
import {
  X,
  FileText,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Activity,
  User,
  Heart
} from 'lucide-react';
import { AppSettings, PeriodDay, CyclePeriod } from '../types';
import { formatToAlbanianDate } from '../utils/cycle';

interface DoctorReportModalProps {
  settings: AppSettings;
  periodDays: PeriodDay[];
  cyclePeriods: CyclePeriod[];
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const DoctorReportModal: React.FC<DoctorReportModalProps> = ({
  settings,
  periodDays,
  cyclePeriods,
  onClose,
  onShowToast
}) => {
  // Metric Filters
  const [includeFlow, setIncludeFlow] = useState(true);
  const [includePain, setIncludePain] = useState(true);
  const [includeSymptoms, setIncludeSymptoms] = useState(true);
  const [includeBbt, setIncludeBbt] = useState(true);
  const [hideSexualActivity, setHideSexualActivity] = useState(true);
  const [monthsCount, setMonthsCount] = useState(6);

  // Statistics calculations
  const totalLoggedDays = periodDays.length;
  const bleedingDays = periodDays.filter(d => d.flow > 0).length;
  const avgPainScore = (
    periodDays.reduce((acc, d) => acc + d.pain, 0) / (totalLoggedDays || 1)
  ).toFixed(1);

  // Top Symptoms
  const symptomCounts: Record<string, number> = {};
  periodDays.forEach(d => {
    if (d.symptoms) {
      d.symptoms.split(',').forEach(s => {
        const trimmed = s.trim();
        if (trimmed) symptomCounts[trimmed] = (symptomCounts[trimmed] || 0) + 1;
      });
    }
  });
  const topSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyReportText = () => {
    const reportText = `
==============================================
RAPORT SHËNDETËSOR I CIKLIT MENSTRUAL - HËNA AI
Përgatitur për konsultim me Mjekun / Ginekologun
==============================================
Pacientja: ${settings.username || 'Vajzë'}
Gjatësia mesatare e ciklit: ${settings.cycleLength || 28} Ditë
Kohëzgjatja e menstruacioneve: ${settings.periodLength || 5} Ditë
Data e ciklit të fundit: ${settings.lastPeriodStart || '-'}

PËRMBLEDHJE STATISTIKORE:
- Ditë të regjistruara gjithsej: ${totalLoggedDays}
- Ditë me rrjedhje (bleeding): ${bleedingDays}
- Mesatarja e dhimbjes: ${avgPainScore} / 3
- Simptomat më të shpeshta: ${topSymptoms.map(([s, c]) => `${s} (${c}x)`).join(', ')}

==============================================
    `;

    navigator.clipboard.writeText(reportText.trim());
    onShowToast('Teksti i raportit u kopjua në clipboard! 📋');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl glass-card rounded-3xl p-6 shadow-2xl border border-white/20 max-h-[92vh] overflow-y-auto no-scrollbar flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#A88BFF] to-[#FF3366] flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">Eksporto Raportin për Mjekun</h2>
              <p className="text-xs text-[#AFA7CD]">
                Raport i strukturuar mjekësor për ginekologun apo mjekun tuaj
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#AFA7CD] hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Metric Selectors */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 mb-4">
          <span className="text-xs font-bold text-[#A88BFF] uppercase tracking-wider block">
            ⚙️ Zgjidhni të dhënat që dëshironi të përfshini:
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs text-[#F3F0FF]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeFlow}
                onChange={e => setIncludeFlow(e.target.checked)}
                className="accent-[#FF3366]"
              />
              <span>Intensitetin e Fluksit</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePain}
                onChange={e => setIncludePain(e.target.checked)}
                className="accent-[#A88BFF]"
              />
              <span>Nivelin e Dhimbjes</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSymptoms}
                onChange={e => setIncludeSymptoms(e.target.checked)}
                className="accent-[#FFB800]"
              />
              <span>Simptomat Fizike</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeBbt}
                onChange={e => setIncludeBbt(e.target.checked)}
                className="accent-[#00D2FF]"
              />
              <span>Mundësisht BBT & Mukusin</span>
            </label>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-[#AFA7CD]">Privatësia:</span>
            <label className="flex items-center gap-2 cursor-pointer text-emerald-400 font-semibold">
              <input
                type="checkbox"
                checked={hideSexualActivity}
                onChange={e => setHideSexualActivity(e.target.checked)}
                className="accent-emerald-400"
              />
              <span>Fsheh aktivitetin seksual nga raporti</span>
            </label>
          </div>
        </div>

        {/* Report Preview Document */}
        <div className="p-5 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 space-y-4 print:p-0">
          <div className="flex items-center justify-between border-b pb-3 border-slate-200">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
                HËNA MEDICAL REPORT
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Përmbledhje e Ciklit Menstrual & Simptomave Gjinore
              </p>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Verifikuar nga Hëna AI Engine</span>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">EMRI I PACIENTES:</span>
              <span className="font-bold text-slate-800">{settings.username || 'Vajzë'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">GJATËSIA MESATARE:</span>
              <span className="font-bold text-slate-800">{settings.cycleLength || 28} Ditë</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">MENSTRUACIONET:</span>
              <span className="font-bold text-slate-800">{settings.periodLength || 5} Ditë</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">CIKLI I FUNDIT:</span>
              <span className="font-bold text-slate-800">{settings.lastPeriodStart || '-'}</span>
            </div>
          </div>

          {/* Summary Highlights */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              📊 Statistikat e Përgjithshme
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
                <span className="block text-rose-800 font-black text-sm">{bleedingDays} ditë</span>
                <span className="text-[10px] text-rose-600">Bleeding Days</span>
              </div>
              <div className="p-2 rounded-xl bg-purple-50 border border-purple-100">
                <span className="block text-purple-800 font-black text-sm">{avgPainScore}/3</span>
                <span className="text-[10px] text-purple-600">Mesatare Dhimbje</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
                <span className="block text-amber-800 font-black text-sm">{totalLoggedDays} ditë</span>
                <span className="text-[10px] text-amber-600">Gjithsej të Dhëna</span>
              </div>
            </div>
          </div>

          {/* Top Symptoms */}
          {topSymptoms.length > 0 && includeSymptoms && (
            <div>
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-1.5">
                🩺 Simptomat Më të Shpeshta të Raportuara
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {topSymptoms.map(([sym, cnt]) => (
                  <span
                    key={sym}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200"
                  >
                    {sym} ({cnt}x)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-[#AFA7CD] italic text-center mt-3">
          * Ky raport gjenerohet automatikisht bazuar në regjistrimet personale të përdorueses. Nuk zëvendëson diagnozën profesionale mjekësore.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-4 mt-2 border-t border-white/10">
          <button
            onClick={handleCopyReportText}
            className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Kopjo Tekstin</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-[#A88BFF] hover:bg-[#A88BFF]/90 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Printo / Ruaj PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
