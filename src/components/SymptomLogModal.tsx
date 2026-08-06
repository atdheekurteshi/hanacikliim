import React, { useState } from 'react';
import { X, Thermometer, Activity, Heart, Check, Sparkles } from 'lucide-react';
import { PeriodDay } from '../types';
import { formatToAlbanianDate } from '../utils/cycle';

interface SymptomLogModalProps {
  selectedDateStr: string;
  existingLog?: PeriodDay;
  onSaveLog: (log: PeriodDay) => void;
  onClose: () => void;
}

const MOOD_OPTIONS = [
  '🌸 E qetë',
  '😊 E lumtur',
  '😴 E lodhur',
  '⚡ Nën tension',
  '🩹 Me dhimbje',
  '🥺 E ndjeshme',
  '🔥 Energjike',
  '🌧️ E pikëlluar'
];

const PHYSICAL_SYMPTOMS = [
  'Dhimbje koke',
  'Fryrje barku',
  'Dhimbje menstruale (Cramps)',
  'Puchrra (Acne)',
  'Dhimbje shpine',
  'Përzierje',
  'Lodhje fizike',
  'Dëshirë për ëmbëlsira',
  'Dhimbje gjoksi',
  'Pagjumësi'
];

const CERVICAL_MUCUS_OPTIONS = [
  'Nuk ka',
  'Me lëng (Watery)',
  'Krem (Creamy)',
  'E bardhë veze (Egg white / Fertile)',
  'E trashë (Sticky)'
];

export const SymptomLogModal: React.FC<SymptomLogModalProps> = ({
  selectedDateStr,
  existingLog,
  onSaveLog,
  onClose
}) => {
  const [flow, setFlow] = useState(existingLog?.flow ?? 0);
  const [pain, setPain] = useState(existingLog?.pain ?? 0);
  const [mood, setMood] = useState(existingLog?.mood ?? '');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(() => {
    if (!existingLog?.symptoms) return [];
    return existingLog.symptoms.split(',').map(s => s.trim()).filter(Boolean);
  });
  const [notes, setNotes] = useState(existingLog?.notes ?? '');

  // Biomarkers
  const [bbtTemp, setBbtTemp] = useState<string>(existingLog?.bbtTemp || '36.6');
  const [cervicalMucus, setCervicalMucus] = useState<string>(existingLog?.cervicalMucus || '');
  const [sexualActivity, setSexualActivity] = useState<string>(existingLog?.sexualActivity || 'ASNJË');
  const [ovulationTest, setOvulationTest] = useState<string>(existingLog?.ovulationTest || 'NETESTUAR');

  const [activeTab, setActiveTab] = useState<'BASIC' | 'BIOMARKERS'>('BASIC');

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const handleSave = () => {
    onSaveLog({
      dateString: selectedDateStr,
      flow,
      pain,
      mood,
      symptoms: selectedSymptoms.join(','),
      notes,
      bbtTemp,
      cervicalMucus,
      sexualActivity,
      ovulationTest
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg glass-card rounded-3xl p-6 shadow-2xl border border-white/20 max-h-[92vh] overflow-y-auto no-scrollbar flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
            <div>
              <h2 className="font-extrabold text-base text-white flex items-center gap-2">
                <span>Regjistrimi i Ditës</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF3366]/20 text-[#FF3366]">
                  AUTO-SAVE READY
                </span>
              </h2>
              <p className="text-xs text-[#AFA7CD]">
                {formatToAlbanianDate(selectedDateStr)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#AFA7CD] hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-white/5 p-1 rounded-2xl mb-4 border border-white/10">
            <button
              onClick={() => setActiveTab('BASIC')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'BASIC'
                  ? 'bg-[#FF3366] text-white shadow-md'
                  : 'text-[#AFA7CD] hover:text-white'
              }`}
            >
              Simptomat & Fluksi
            </button>
            <button
              onClick={() => setActiveTab('BIOMARKERS')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'BIOMARKERS'
                  ? 'bg-[#A88BFF] text-white shadow-md'
                  : 'text-[#AFA7CD] hover:text-white'
              }`}
            >
              Biomarkuesit & Temperatura (BBT)
            </button>
          </div>

          {activeTab === 'BASIC' ? (
            <div className="space-y-4 animate-fade-in">
              {/* Flow Intensity Slider / Selector */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <label className="block text-xs font-bold text-white">
                  Fluksi Menstrual
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "S'ka", val: 0 },
                    { label: 'Lehtë 🩸', val: 1 },
                    { label: 'Mesatar 🩸🩸', val: 2 },
                    { label: 'Shumë 🩸🩸🩸', val: 3 }
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setFlow(item.val)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        flow === item.val
                          ? 'bg-[#FF3366] text-white border-transparent shadow-md'
                          : 'bg-white/5 border-white/10 text-[#AFA7CD] hover:bg-white/10'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pain Selector */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <label className="block text-xs font-bold text-white">
                  Niveli i Dhimbjes (Cramps)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "S'kam", val: 0 },
                    { label: 'Lehtë ⚡', val: 1 },
                    { label: 'Mesatar ⚡⚡', val: 2 },
                    { label: 'Shumë ⚡⚡⚡', val: 3 }
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setPain(item.val)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        pain === item.val
                          ? 'bg-[#A88BFF] text-white border-transparent shadow-md'
                          : 'bg-white/5 border-white/10 text-[#AFA7CD] hover:bg-white/10'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood Grid */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <label className="block text-xs font-bold text-white">
                  Humori & Gjendja Emocionale
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MOOD_OPTIONS.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(m === mood ? '' : m)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        mood === m
                          ? 'bg-[#FFB800] text-black border-transparent font-bold shadow-md'
                          : 'bg-white/5 border-white/10 text-[#AFA7CD] hover:bg-white/10'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Physical Symptoms */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <label className="block text-xs font-bold text-white">
                  Simptomat Fizike
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PHYSICAL_SYMPTOMS.map(sym => {
                    const isSel = selectedSymptoms.includes(sym);
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => toggleSymptom(sym)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          isSel
                            ? 'bg-[#FF3366]/20 border-[#FF3366] text-[#FF3366] font-bold'
                            : 'bg-white/5 border-white/10 text-[#AFA7CD] hover:bg-white/10'
                        }`}
                      >
                        {sym}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-[#AFA7CD] mb-1">
                  Shënime Personale
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Shkruani çdo detaj ose ndjesi tjetër..."
                  rows={2}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF3366]"
                />
              </div>
            </div>
          ) : (
            /* BIOMARKERS TAB */
            <div className="space-y-4 animate-fade-in">
              {/* Basal Body Temperature */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-[#00D2FF]" />
                    Temperatura Bazale e Trupit (BBT °C)
                  </label>
                  <span className="font-extrabold text-sm text-[#00D2FF]">{bbtTemp} °C</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="35.0"
                  max="40.0"
                  value={bbtTemp}
                  onChange={e => setBbtTemp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-[#00D2FF]"
                />
              </div>

              {/* Cervical Mucus Texture */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <label className="block text-xs font-bold text-white">
                  Tekstura e Mukusit Cervikal
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CERVICAL_MUCUS_OPTIONS.map(cm => (
                    <button
                      key={cm}
                      type="button"
                      onClick={() => setCervicalMucus(cm === cervicalMucus ? '' : cm)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        cervicalMucus === cm
                          ? 'bg-[#00D2FF] text-black border-transparent font-bold shadow-md'
                          : 'bg-white/5 border-white/10 text-[#AFA7CD] hover:bg-white/10'
                      }`}
                    >
                      {cm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sexual Activity */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <label className="block text-xs font-bold text-white">
                  Aktiviteti Seksual
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ASNJË', label: 'Asnjë' },
                    { id: 'I_MBROJTUR', label: 'I mbrojtur 🛡️' },
                    { id: 'I_PAMBROJTUR', label: 'I pambrojtur ❤️' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSexualActivity(item.id)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        sexualActivity === item.id
                          ? 'bg-[#FF3366] text-white border-transparent shadow-md'
                          : 'bg-white/5 border-white/10 text-[#AFA7CD] hover:bg-white/10'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ovulation Test Kit Result */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <label className="block text-xs font-bold text-white">
                  Testi i Ovulimit (LH Kit)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'NETESTUAR', label: 'S’kam testuar' },
                    { id: 'POZITIV', label: 'Pozitiv ➕ (Ovulim)' },
                    { id: 'NEGATIV', label: 'Negativ ➖' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setOvulationTest(item.id)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        ovulationTest === item.id
                          ? 'bg-[#FFB800] text-black border-transparent shadow-md'
                          : 'bg-white/5 border-white/10 text-[#AFA7CD] hover:bg-white/10'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4 border-t border-white/10 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition cursor-pointer"
          >
            Anulo
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#FF3366] to-[#A88BFF] text-white font-extrabold text-xs shadow-lg transition cursor-pointer"
          >
            Ruaj Logun Ditore ✨
          </button>
        </div>
      </div>
    </div>
  );
};
