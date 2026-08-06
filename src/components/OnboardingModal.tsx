import React, { useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  Sparkles,
  Heart,
  Lock,
  ArrowRight,
  Check,
  RotateCcw,
  User,
  Bell,
  EyeOff,
  Baby,
  Activity
} from 'lucide-react';
import { AppSettings } from '../types';
import { getTodayISO } from '../utils/cycle';

interface OnboardingModalProps {
  settings: AppSettings;
  onCompleteOnboarding: (updatedSettings: Partial<AppSettings>) => void;
  onClose?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  settings,
  onCompleteOnboarding,
  onClose
}) => {
  const [step, setStep] = useState<number>(1);

  // Form State
  const [username, setUsername] = useState(settings.username || '');
  const [appGoal, setAppGoal] = useState<'CYCLE' | 'PREGNANCY' | 'MENOPAUSE'>('CYCLE');
  const [cycleLength, setCycleLength] = useState<number>(settings.cycleLength || 28);
  const [periodLength, setPeriodLength] = useState<number>(settings.periodLength || 5);
  const [lastPeriodStart, setLastPeriodStart] = useState<string>(
    settings.lastPeriodStart || getTodayISO()
  );
  const [knowsLastPeriod, setKnowsLastPeriod] = useState<boolean>(true);

  // Symptoms baseline
  const [selectedBaselineSymptoms, setSelectedBaselineSymptoms] = useState<string[]>([
    'Dhimbje menstruale (Cramps)',
    'Luhatje humori'
  ]);

  // Security & Reminders
  const [enablePin, setEnablePin] = useState<boolean>(false);
  const [pinCode, setPinCode] = useState<string>('');
  const [discreetNotifications, setDiscreetNotifications] = useState<boolean>(true);
  const [discreetText, setDiscreetText] = useState<string>('Pakoja juaj po arrin! 📦');

  const baselineOptions = [
    'Dhimbje menstruale (Cramps)',
    'Cikël i parregullt',
    'Akne / Ndryshime lëkure',
    'Luhatje humori & PMS',
    'Lodhje ose mungesë energjie',
    'Fryrje barku / Digjestion',
    'Dhimbje koke ose migrenë',
    'Pagjumësi'
  ];

  const toggleSymptom = (sym: string) => {
    setSelectedBaselineSymptoms(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const handleFinish = () => {
    onCompleteOnboarding({
      username: username.trim() || 'Vajzë',
      appGoal,
      cycleLength,
      periodLength,
      lastPeriodStart: knowsLastPeriod ? lastPeriodStart : getTodayISO(),
      baselineSymptoms: selectedBaselineSymptoms,
      isPinEnabled: enablePin && pinCode.length === 4,
      pinCode: enablePin ? pinCode : '',
      discreetNotifications,
      discreetText,
      isOnboardingCompleted: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 shadow-2xl border border-white/20 relative overflow-hidden max-h-[92vh] flex flex-col justify-between no-scrollbar">
        {/* Background Glowing Aura */}
        <div className="absolute -left-10 -top-10 w-36 h-36 rounded-full bg-[#FF3366]/20 blur-3xl pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-[#A88BFF]/20 blur-3xl pointer-events-none" />

        {/* Step Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#A88BFF]">
              Konfigurimi Personal • Hapi {step} nga 5
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="text-xs text-[#AFA7CD] hover:text-white transition"
              >
                Mbyll ✕
              </button>
            )}
          </div>

          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mb-6">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF3366] via-[#A88BFF] to-[#FFB800] transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>

          {/* STEP 1: WELCOME & PRIVACY */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#FF3366] to-[#A88BFF] flex items-center justify-center text-3xl shadow-xl mx-auto mb-2">
                🌙
              </div>
              <h2 className="text-xl font-extrabold text-white text-center">
                Mirë se vini në Hëna
              </h2>
              <p className="text-xs text-[#AFA7CD] text-center leading-relaxed">
                Asistentja juaj private dhe e mençur për ciklin menstrual, balancën hormonale dhe shëndetin femëror.
              </p>

              {/* Data Privacy & Security Box */}
              <div className="p-4 rounded-2xl bg-white/5 border border-emerald-500/30 space-y-2 mt-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Protokolli i Privatësisë & Mbrojtjes së të Dhënave</span>
                </div>
                <p className="text-[11px] text-[#AFA7CD] leading-relaxed">
                  Të dhënat tuaja shëndetësore ruhen në mënyrë të enkriptuar vetëm në pajisjen tuaj (lokalisht). Ne respektojmë rregullat strikte të konfidencialitetit (HIPAA / GDPR compliant design).
                </p>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-[#AFA7CD] mb-1.5">
                  Si dëshironi t'ju quajmë?
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#A88BFF] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Emri juaj (P.sh. Elena)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#A88BFF]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: GOAL SELECTION */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-extrabold text-white text-center">
                Cili është synimi juaj kryesor?
              </h2>
              <p className="text-xs text-[#AFA7CD] text-center">
                Ne do ta përshtatim ndërfaqen dhe parashikimet inteligjente për nevojat tuaja.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  {
                    id: 'CYCLE',
                    title: 'Monitorimi i Ciklit & Fertilitetit',
                    desc: 'Parashikimi i menstruacioneve, ovulimit dhe menaxhimi i simptomave.',
                    icon: Activity,
                    color: 'from-[#FF3366]/20 to-[#FF3366]/5 border-[#FF3366]'
                  },
                  {
                    id: 'PREGNANCY',
                    title: 'Përcjellja e Shtatzënisë',
                    desc: 'Kthimi i numërimit mbrapsht të javëve dhe zhvillimi i foshnjës.',
                    icon: Baby,
                    color: 'from-[#FFB800]/20 to-[#FFB800]/5 border-[#FFB800]'
                  },
                  {
                    id: 'MENOPAUSE',
                    title: 'Perimenopauza & Hormonet',
                    desc: 'Monitorimi i luhatjeve hormonale, nxehtësisë dhe gjumit.',
                    icon: Heart,
                    color: 'from-[#A88BFF]/20 to-[#A88BFF]/5 border-[#A88BFF]'
                  }
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = appGoal === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setAppGoal(item.id as any)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? `bg-gradient-to-r ${item.color} shadow-lg scale-[1.02]`
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-xs text-white flex items-center justify-between">
                          <span>{item.title}</span>
                          {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                        </h3>
                        <p className="text-[11px] text-[#AFA7CD] mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: HISTORICAL DATA */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-extrabold text-white text-center">
                Të dhënat e Ciklit
              </h2>
              <p className="text-xs text-[#AFA7CD] text-center">
                Përcaktoni kohëzgjatjen mesatare për llogaritje sa më të sakta.
              </p>

              <div className="space-y-4 pt-2">
                {/* Last Period Start */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#FF3366]" />
                      Menstruacionet e fundit:
                    </label>
                    <button
                      type="button"
                      onClick={() => setKnowsLastPeriod(!knowsLastPeriod)}
                      className="text-[10px] text-[#A88BFF] underline"
                    >
                      {knowsLastPeriod ? 'Nuk e mbaj mend' : 'Vendos datën'}
                    </button>
                  </div>

                  {knowsLastPeriod ? (
                    <input
                      type="date"
                      value={lastPeriodStart}
                      onChange={e => setLastPeriodStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF3366]"
                    />
                  ) : (
                    <p className="text-[11px] text-[#FFB800] italic">
                      Mos u shqetësoni! Ne do të përdorim një mesatare standarde prej 28 ditësh që mund ta ndryshoni kurdo.
                    </p>
                  )}
                </div>

                {/* Cycle Length Range Slider */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#AFA7CD]">Gjatësia e ciklit:</span>
                    <span className="font-extrabold text-[#FF3366] text-sm">{cycleLength} Ditë</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={40}
                    value={cycleLength}
                    onChange={e => setCycleLength(Number(e.target.value))}
                    className="w-full accent-[#FF3366] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#AFA7CD]">
                    <span>20d</span>
                    <span>28d (Standarde)</span>
                    <span>40d</span>
                  </div>
                </div>

                {/* Period Duration Range Slider */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#AFA7CD]">Kohëzgjatja e periodave:</span>
                    <span className="font-extrabold text-[#A88BFF] text-sm">{periodLength} Ditë</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={10}
                    value={periodLength}
                    onChange={e => setPeriodLength(Number(e.target.value))}
                    className="w-full accent-[#A88BFF] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#AFA7CD]">
                    <span>2d</span>
                    <span>5d (Mesatare)</span>
                    <span>10d</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SYMPTOM BASELINE */}
          {step === 4 && (
            <div className="space-y-3 animate-fade-in">
              <h2 className="text-lg font-extrabold text-white text-center">
                Simptomat tuaja më të shpeshta
              </h2>
              <p className="text-xs text-[#AFA7CD] text-center">
                Zgjidhni simptomat që përjetoni zakonisht që AI t'ju rekomandojë çajra & ushqime kure.
              </p>

              <div className="grid grid-cols-1 gap-2 pt-2 max-h-60 overflow-y-auto no-scrollbar">
                {baselineOptions.map(sym => {
                  const active = selectedBaselineSymptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      onClick={() => toggleSymptom(sym)}
                      className={`p-3 rounded-2xl border text-xs font-semibold text-left flex items-center justify-between transition cursor-pointer ${
                        active
                          ? 'bg-[#A88BFF]/20 border-[#A88BFF] text-white'
                          : 'bg-white/5 border-white/10 text-[#AFA7CD] hover:bg-white/10'
                      }`}
                    >
                      <span>{sym}</span>
                      {active && <Check className="w-4 h-4 text-[#A88BFF]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: SECURITY & DISCREET NOTIFICATIONS */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-extrabold text-white text-center">
                Siguria & Privatësia e Njoftimeve
              </h2>
              <p className="text-xs text-[#AFA7CD] text-center">
                Mbroni aplikacionin me PIN dhe maskoni njoftimet në ekranin e kyçur.
              </p>

              <div className="space-y-3 pt-2">
                {/* PIN Code Toggle */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#A88BFF]" />
                      PIN Mbrojtës (4 shifra)
                    </span>
                    <input
                      type="checkbox"
                      checked={enablePin}
                      onChange={e => setEnablePin(e.target.checked)}
                      className="w-4 h-4 accent-[#A88BFF] cursor-pointer"
                    />
                  </div>

                  {enablePin && (
                    <input
                      type="password"
                      maxLength={4}
                      value={pinCode}
                      onChange={e => setPinCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="****"
                      className="w-full px-3 py-2 rounded-xl bg-white/10 border border-[#A88BFF]/40 text-center font-bold text-lg text-white tracking-widest focus:outline-none"
                    />
                  )}
                </div>

                {/* Discreet Mode */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <EyeOff className="w-3.5 h-3.5 text-[#FFB800]" />
                      Mënyra Diskrete e Njoftimeve
                    </span>
                    <input
                      type="checkbox"
                      checked={discreetNotifications}
                      onChange={e => setDiscreetNotifications(e.target.checked)}
                      className="w-4 h-4 accent-[#FFB800] cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-[#AFA7CD]">
                    Fsheh fjalët "Perioda" apo "Ovulim" nga ekrani i kyçjes së telefonit tuaj.
                  </p>

                  {discreetNotifications && (
                    <div className="pt-1">
                      <label className="text-[10px] text-[#FFB800] font-bold block mb-1">
                        Teksti diskret në ekran:
                      </label>
                      <input
                        type="text"
                        value={discreetText}
                        onChange={e => setDiscreetText(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-xs focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Actions */}
        <div className="flex gap-3 pt-6 mt-4 border-t border-white/10">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition cursor-pointer"
            >
              Mbrapa
            </button>
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#FF3366] to-[#A88BFF] text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 hover:opacity-95 transition cursor-pointer"
            >
              <span>Vazhdo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#FF3366] via-[#A88BFF] to-[#FFB800] text-white font-extrabold text-xs shadow-xl flex items-center justify-center gap-2 hover:opacity-95 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Përfundo & Hap Hënën</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
