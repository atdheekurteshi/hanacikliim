import { AppSettings, CyclePeriod, PeriodDay } from '../types';
import { getTodayISO, parseISODate, formatISODate } from './cycle';

const STORAGE_KEYS = {
  PERIOD_DAYS: 'hena_period_days',
  CYCLE_PERIODS: 'hena_cycle_periods',
  SETTINGS: 'hena_settings'
};

export const DEFAULT_SETTINGS: AppSettings = {
  username: 'Vajzë',
  cycleLength: 28,
  periodLength: 5,
  lastPeriodStart: (() => {
    const d = new Date();
    d.setDate(d.getDate() - 10);
    return formatISODate(d);
  })(),
  isPinEnabled: false,
  pinCode: '',
  remindPeriod: true,
  remindFertile: true,
  remindDaily: true,
  remindWater: false
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadPeriodDays(): PeriodDay[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PERIOD_DAYS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function savePeriodDay(log: PeriodDay): PeriodDay[] {
  const current = loadPeriodDays();
  const existingIdx = current.findIndex(item => item.dateString === log.dateString);
  let updated: PeriodDay[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = log;
  } else {
    updated = [log, ...current];
  }
  // Sort descending by dateString
  updated.sort((a, b) => b.dateString.localeCompare(a.dateString));
  localStorage.setItem(STORAGE_KEYS.PERIOD_DAYS, JSON.stringify(updated));
  return updated;
}

export function deletePeriodDay(dateString: string): PeriodDay[] {
  const current = loadPeriodDays();
  const updated = current.filter(item => item.dateString !== dateString);
  localStorage.setItem(STORAGE_KEYS.PERIOD_DAYS, JSON.stringify(updated));
  return updated;
}

export function loadCyclePeriods(): CyclePeriod[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CYCLE_PERIODS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCyclePeriod(startDateString: string, endDateString: string | null, id?: number): CyclePeriod[] {
  const current = loadCyclePeriods();
  let updated: CyclePeriod[];
  if (id !== undefined && id !== null) {
    updated = current.map(item => item.id === id ? { ...item, startDateString, endDateString } : item);
  } else {
    const newId = Date.now();
    updated = [{ id: newId, startDateString, endDateString }, ...current];
  }
  updated.sort((a, b) => b.startDateString.localeCompare(a.startDateString));
  localStorage.setItem(STORAGE_KEYS.CYCLE_PERIODS, JSON.stringify(updated));

  // Also update lastPeriodStart setting if newer
  const settings = loadSettings();
  if (!settings.lastPeriodStart || startDateString > settings.lastPeriodStart) {
    settings.lastPeriodStart = startDateString;
    saveSettings(settings);
  }

  return updated;
}

export function deleteCyclePeriod(id: number): CyclePeriod[] {
  const current = loadCyclePeriods();
  const updated = current.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.CYCLE_PERIODS, JSON.stringify(updated));
  return updated;
}
