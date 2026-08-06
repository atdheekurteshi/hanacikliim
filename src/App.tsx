import React, { useState, useEffect } from 'react';
import { AppSettings, CyclePeriod, HenaTab, PeriodDay } from './types';
import {
  DEFAULT_SETTINGS,
  deleteCyclePeriod,
  deletePeriodDay,
  loadCyclePeriods,
  loadPeriodDays,
  loadSettings,
  saveCyclePeriod,
  savePeriodDay,
  saveSettings
} from './utils/storage';
import { getTodayISO } from './utils/cycle';
import { SotDashboard } from './components/SotDashboard';
import { KalendariView } from './components/KalendariView';
import { DitariView } from './components/DitariView';
import { KeshillaView } from './components/KeshillaView';
import { HenaAiView } from './components/HenaAiView';
import { HenaBottomNav } from './components/HenaBottomNav';
import { SettingsModal } from './components/SettingsModal';
import { PinLockScreen } from './components/PinLockScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { DoctorReportModal } from './components/DoctorReportModal';

export function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [periodDays, setPeriodDays] = useState<PeriodDay[]>([]);
  const [cyclePeriods, setCyclePeriods] = useState<CyclePeriod[]>([]);

  const [currentTab, setCurrentTab] = useState<HenaTab>('SOT');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayISO());

  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const [showDoctorReportModal, setShowDoctorReportModal] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    const loadedSettings = loadSettings();
    setSettings(loadedSettings);

    if (loadedSettings.isPinEnabled && loadedSettings.pinCode) {
      setIsLocked(true);
    }

    if (!loadedSettings.isOnboardingCompleted) {
      setShowOnboardingModal(true);
    }

    setPeriodDays(loadPeriodDays());
    setCyclePeriods(loadCyclePeriods());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleCompleteOnboarding = (updated: Partial<AppSettings>) => {
    const merged = { ...settings, ...updated, isOnboardingCompleted: true };
    setSettings(merged);
    saveSettings(merged);
    setShowOnboardingModal(false);
    showToast('Profil u ruajt me sukses! Mirë se vini në Hëna ✨');
  };

  const handleSavePeriodDay = (log: PeriodDay) => {
    const updated = savePeriodDay(log);
    setPeriodDays(updated);
    showToast('Ndryshimet te dita u ruajtën me sukses! ✨');
  };

  const handleDeletePeriodDay = (dateStr: string) => {
    const updated = deletePeriodDay(dateStr);
    setPeriodDays(updated);
    showToast('Log-u u fshi me sukses.');
  };

  const handleSaveCyclePeriod = (startDate: string, endDate: string | null, id?: number) => {
    const updated = saveCyclePeriod(startDate, endDate, id);
    setCyclePeriods(updated);
    // Reload settings in case lastPeriodStart updated
    setSettings(loadSettings());
  };

  const handleDeleteCyclePeriod = (id: number) => {
    const updated = deleteCyclePeriod(id);
    setCyclePeriods(updated);
    showToast('Cikli u fshi me sukses.');
  };

  const handleUpdateWater = (waterKey: string, ml: number) => {
    const updated = { ...settings, [waterKey]: ml };
    setSettings(updated);
    saveSettings(updated);
  };

  const handleTogglePeriodStartToday = () => {
    const today = getTodayISO();
    handleSaveCyclePeriod(today, null);
    // Also create a PeriodDay with flow = 2 if not present
    const existing = periodDays.find(d => d.dateString === today);
    if (!existing) {
      handleSavePeriodDay({
        dateString: today,
        flow: 2,
        pain: 1,
        mood: '🌸 E qetë',
        symptoms: 'Dhimbjet e barkut',
        notes: 'Filluan periodat sot'
      });
    }
    showToast('Periodat u shënuan me sukses për sot! 🩸');
  };

  if (isLocked) {
    return (
      <PinLockScreen
        correctPin={settings.pinCode}
        onUnlockSuccess={() => setIsLocked(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0A1A] text-[#F3F0FF] relative font-sans selection:bg-[#FF3366] selection:text-white">
      {/* Toast notification overlay */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl glass-card border border-[#FF3366]/40 text-white font-bold text-xs shadow-2xl animate-fade-in flex items-center gap-2">
          <span>🌙</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Tab Content */}
      <main className="w-full">
        {currentTab === 'SOT' && (
          <SotDashboard
            settings={settings}
            cyclePeriods={cyclePeriods}
            selectedDateStr={selectedDateStr}
            onSelectDate={setSelectedDateStr}
            onOpenSettings={() => setShowSettingsModal(true)}
            onSaveCyclePeriod={handleSaveCyclePeriod}
            onDeleteCyclePeriod={handleDeleteCyclePeriod}
            onUpdateWater={handleUpdateWater}
            onTogglePeriodStartToday={handleTogglePeriodStartToday}
            onOpenAiTab={() => setCurrentTab('HENA_AI')}
          />
        )}

        {currentTab === 'HENA_AI' && (
          <HenaAiView
            settings={settings}
            selectedDateStr={selectedDateStr}
            periodDays={periodDays}
          />
        )}

        {currentTab === 'KALENDARI' && (
          <KalendariView
            settings={settings}
            periodDays={periodDays}
            selectedDateStr={selectedDateStr}
            onSelectDate={setSelectedDateStr}
            onSaveLog={handleSavePeriodDay}
            onDeleteLog={handleDeletePeriodDay}
          />
        )}

        {currentTab === 'DITARI' && (
          <DitariView
            periodDays={periodDays}
            onDeleteLog={handleDeletePeriodDay}
            onOpenDoctorReport={() => setShowDoctorReportModal(true)}
          />
        )}

        {currentTab === 'KESHILLA' && <KeshillaView />}
      </main>

      {/* Bottom Navigation */}
      <HenaBottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />

      {/* Onboarding Flow Modal */}
      {showOnboardingModal && (
        <OnboardingModal
          settings={settings}
          onCompleteOnboarding={handleCompleteOnboarding}
          onClose={() => setShowOnboardingModal(false)}
        />
      )}

      {/* Doctor / Medical PDF Report Modal */}
      {showDoctorReportModal && (
        <DoctorReportModal
          settings={settings}
          periodDays={periodDays}
          cyclePeriods={cyclePeriods}
          onClose={() => setShowDoctorReportModal(false)}
          onShowToast={showToast}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onClose={() => setShowSettingsModal(false)}
          onShowToast={showToast}
          onReopenOnboarding={() => setShowOnboardingModal(true)}
        />
      )}
    </div>
  );
}

export default App;
