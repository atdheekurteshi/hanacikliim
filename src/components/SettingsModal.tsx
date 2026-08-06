import React, { useState } from 'react';
import { X, Lock, Bell, User, Calendar as CalendarIcon, Check, ShieldAlert, Sparkles, EyeOff, Pill } from 'lucide-react';
import { AppSettings } from '../types';
import { getTodayISO } from '../utils/cycle';

interface SettingsModalProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onReopenOnboarding?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
  onShowToast,
  onReopenOnboarding
}) => {
  const [username, setUsername] = useState(settings.username || 'Vajzë');
  const [cycleLength, setCycleLength] = useState(settings.cycleLength || 28);
  const [periodLength, setPeriodLength] = useState(settings.periodLength || 5);
  const [lastPeriodStart, setLastPeriodStart] = useState(settings.lastPeriodStart || getTodayISO());

  // Security Lock state
  const [isPinEnabled, setIsPinEnabled] = useState(settings.isPinEnabled || false);
  const [pinCode, setPinCode] = useState(settings.pinCode || '');
  const [pinInputTemp, setPinInputTemp] = useState('');
  const [isSettingPinStep, setIsSettingPinStep] = useState(false);

  // Reminders & Discreet Mode
  const [remindPeriod, setRemindPeriod] = useState(settings.remindPeriod ?? true);
  const [remindFertile, setRemindFertile] = useState(settings.remindFertile ?? true);
  const [remindDaily, setRemindDaily] = useState(settings.remindDaily ?? true);
  const [remindWater, setRemindWater] = useState(settings.remindWater ?? false);
  const [remindPill, setRemindPill] = useState(settings.remindPill ?? false);
  const [pillTime, setPillTime] = useState(settings.pillTime || '21:00');

  const [discreetNotifications, setDiscreetNotifications] = useState(
    settings.discreetNotifications ?? true
  );
  const [discreetText, setDiscreetText] = useState(
    settings.discreetText || 'Pakoja juaj po arrin! 📦'
  );

  const handleTogglePin = (enabled: boolean) => {
    if (enabled) {
      setIsSettingPinStep(true);
      setPinInputTemp('');
    } else {
      setIsPinEnabled(false);
      setPinCode('');
      setIsSettingPinStep(false);
    }
  };

  const handleConfirmPinCode = () => {
    if (pinInputTemp.length !== 4) {
      onShowToast('Kodi PIN duhet të ketë saktësisht 4 shifra! 🔒');
      return;
    }
    setPinCode(pinInputTemp);
    setIsPinEnabled(true);
    setIsSettingPinStep(false);
    onShowToast('Mbrojtja me PIN u aktivizua me sukses! 🔐');
  };

  const handleTestNotification = async () => {
    const textToShow = discreetNotifications
      ? discreetText
      : 'Hëna: Mos harroni të regjistroni simptomat sot! 🌸';

    onShowToast(`Njoftim diskret provë: "${textToShow}" 🔔`);

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Hëna', {
          body: textToShow,
          icon: '/icon.png'
        });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification('Hëna', {
            body: textToShow
          });
        }
      }
    }
  };

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      username: username.trim() || 'Vajzë',
      cycleLength,
      periodLength,
      lastPeriodStart,
      isPinEnabled,
      pinCode,
      remindPeriod,
      remindFertile,
      remindDaily,
      remindWater,
      remindPill,
      pillTime,
      discreetNotifications,
      discreetText
    });
    onShowToast('Cilësimet u ruajtën me sukses! ✨');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card rounded-3xl p-6 shadow-2xl border border-white/15 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 className="font-bold text-lg text-white">Cilësimet e Hënës</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[#AFA7CD] hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* User Profile */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#AFA7CD] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#FF3366]" />
              Emri Juaj
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Shkruani emrin tuaj..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF3366]"
            />
          </div>

          {/* Re-run onboarding option */}
          {onReopenOnboarding && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-[#A88BFF]/20 to-[#FF3366]/20 border border-[#A88BFF]/30 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-white">Rikrijo Profilin nga E Para</h4>
                <p className="text-[10px] text-[#AFA7CD]">Ndrysho objektivat ose pyetësorin bazë</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReopenOnboarding();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#A88BFF] text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Hap Onboarding
              </button>
            </div>
          )}

          {/* Cycle Parameters */}
          <div className="space-y-4 pt-2 border-t border-white/10">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-[#FFB800]" />
              Parametrat e Ciklit
            </h3>

            {/* Cycle Length */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-[#AFA7CD]">Gjatësia e ciklit:</span>
                <span className="font-bold text-[#FF3366]">{cycleLength} Ditë</span>
              </div>
              <input
                type="range"
                min={18}
                max={45}
                value={cycleLength}
                onChange={e => setCycleLength(Number(e.target.value))}
                className="w-full accent-[#FF3366] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#AFA7CD] mt-0.5">
                <span>18 ditë</span>
                <span>28 ditë (Normale)</span>
                <span>45 ditë</span>
              </div>
            </div>

            {/* Period Length */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-[#AFA7CD]">Kohëzgjatja e periodave:</span>
                <span className="font-bold text-[#FF3366]">{periodLength} Ditë</span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                value={periodLength}
                onChange={e => setPeriodLength(Number(e.target.value))}
                className="w-full accent-[#FF3366] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#AFA7CD] mt-0.5">
                <span>2 ditë</span>
                <span>5 ditë (Normale)</span>
                <span>10 ditë</span>
              </div>
            </div>

            {/* Last Period Start */}
            <div>
              <label className="block text-xs font-bold text-[#AFA7CD] mb-1">
                Data e fillimit të ciklit të fundit:
              </label>
              <input
                type="date"
                value={lastPeriodStart}
                onChange={e => setLastPeriodStart(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF3366]"
              />
            </div>
          </div>

          {/* PIN Security */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#A88BFF]" />
                  Mbrojtja me PIN Code
                </h3>
                <p className="text-[11px] text-[#AFA7CD]">
                  Bllokoni aplikacionin me një kod 4-shifror për privatësi
                </p>
              </div>

              <input
                type="checkbox"
                checked={isPinEnabled}
                onChange={e => handleTogglePin(e.target.checked)}
                className="w-4 h-4 accent-[#A88BFF] cursor-pointer"
              />
            </div>

            {isSettingPinStep && (
              <div className="p-3 rounded-2xl bg-white/5 border border-[#A88BFF]/30 space-y-2">
                <label className="block text-xs font-bold text-[#A88BFF]">
                  Vendosni PIN-in e ri (4 shifra):
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={pinInputTemp}
                    onChange={e => setPinInputTemp(e.target.value.replace(/\D/g, ''))}
                    placeholder="****"
                    className="flex-1 px-3 py-2 rounded-xl bg-white/10 text-center font-bold text-lg text-white tracking-widest focus:outline-none focus:border-[#A88BFF]"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmPinCode}
                    className="px-4 py-2 rounded-xl bg-[#A88BFF] text-white font-bold text-xs cursor-pointer"
                  >
                    Konfirmo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications & Discreet Mode */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[#00D2FF]" />
              Kujtesat & Njoftimet Diskrete
            </h3>

            {/* Discreet Mode */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
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

              {discreetNotifications && (
                <div className="pt-1">
                  <label className="text-[10px] text-[#FFB800] block mb-1">
                    Teksti diskret në lockscreen:
                  </label>
                  <input
                    type="text"
                    value={discreetText}
                    onChange={e => setDiscreetText(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-white text-xs focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center justify-between text-xs text-[#F3F0FF] cursor-pointer">
                <span>Kujtesë për fillimin e periodave</span>
                <input
                  type="checkbox"
                  checked={remindPeriod}
                  onChange={e => setRemindPeriod(e.target.checked)}
                  className="w-4 h-4 accent-[#FF3366]"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-[#F3F0FF] cursor-pointer">
                <span>Kujtesë për ditët pjellore (Ovulimin)</span>
                <input
                  type="checkbox"
                  checked={remindFertile}
                  onChange={e => setRemindFertile(e.target.checked)}
                  className="w-4 h-4 accent-[#FFB800]"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-[#F3F0FF] cursor-pointer">
                <span>Kujtesë ditore për të regjistruar simptomat</span>
                <input
                  type="checkbox"
                  checked={remindDaily}
                  onChange={e => setRemindDaily(e.target.checked)}
                  className="w-4 h-4 accent-[#A88BFF]"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-[#F3F0FF] cursor-pointer">
                <span>Kujtesë për pirjen e kontraceptivit / pilulës 💊</span>
                <input
                  type="checkbox"
                  checked={remindPill}
                  onChange={e => setRemindPill(e.target.checked)}
                  className="w-4 h-4 accent-emerald-400"
                />
              </label>

              {remindPill && (
                <div className="flex items-center justify-between pl-4 text-xs text-[#AFA7CD]">
                  <span>Ora e pilulës:</span>
                  <input
                    type="time"
                    value={pillTime}
                    onChange={e => setPillTime(e.target.value)}
                    className="bg-white/10 px-2 py-1 rounded-lg text-white focus:outline-none"
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleTestNotification}
              className="w-full mt-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[#00D2FF] border border-[#00D2FF]/30 transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Testo njoftimin diskret 🔔</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition cursor-pointer"
            >
              Anulo
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl bg-[#FF3366] hover:bg-[#FF3366]/90 text-white font-bold text-xs shadow-lg transition cursor-pointer"
            >
              Ruaj Cilësimet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
