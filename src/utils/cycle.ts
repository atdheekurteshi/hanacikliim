import { AppSettings, CycleState } from '../types';

export const ALBANIAN_DAYS: Record<number, string> = {
  1: 'E Hënë',
  2: 'E Martë',
  3: 'E Mërkurë',
  4: 'E Enjte',
  5: 'E Premte',
  6: 'E Shtunë',
  0: 'E Diel'
};

export const ALBANIAN_DAYS_SHORT: Record<number, string> = {
  1: 'Hën',
  2: 'Mar',
  3: 'Mër',
  4: 'Enj',
  5: 'Pre',
  6: 'Sht',
  0: 'Die'
};

export const ALBANIAN_MONTHS: Record<number, string> = {
  1: 'Janar',
  2: 'Shkurt',
  3: 'Mars',
  4: 'Prill',
  5: 'Maj',
  6: 'Qershor',
  7: 'Korrik',
  8: 'Gusht',
  9: 'Shtator',
  10: 'Tetor',
  11: 'Nëntor',
  12: 'Dhjetor'
};

export function parseISODate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayISO(): string {
  return formatISODate(new Date());
}

export function formatToAlbanianDate(dateStr: string): string {
  try {
    const d = parseISODate(dateStr);
    const dayOfWeek = d.getDay(); // 0 is Sunday
    const dayName = ALBANIAN_DAYS[dayOfWeek] || '';
    const dayOfMonth = d.getDate();
    const monthName = ALBANIAN_MONTHS[d.getMonth() + 1] || '';
    return `${dayName}, ${dayOfMonth} ${monthName}`;
  } catch {
    return dateStr;
  }
}

export function getMonthYearAlbanian(dateStr: string): string {
  try {
    const d = parseISODate(dateStr);
    const monthName = ALBANIAN_MONTHS[d.getMonth() + 1] || '';
    return `${monthName} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export function differenceInDays(dateLeft: Date, dateRight: Date): number {
  const utc1 = Date.UTC(dateLeft.getFullYear(), dateLeft.getMonth(), dateLeft.getDate());
  const utc2 = Date.UTC(dateRight.getFullYear(), dateRight.getMonth(), dateRight.getDate());
  return Math.floor((utc1 - utc2) / (1000 * 60 * 60 * 24));
}

export function getCycleState(selectedDateStr: string, settings: AppSettings): CycleState {
  const lastStartStr = settings.lastPeriodStart;
  const cLen = settings.cycleLength || 28;
  const pLen = settings.periodLength || 5;

  if (!lastStartStr) {
    return {
      cycleDay: 0,
      phaseName: 'E pa konfiguruar',
      phaseDescription: 'Regjistroni datën e fundit të periodave te parametrat.',
      nextPeriodDaysLeft: 0,
      nextPeriodDateFormatted: '-',
      ovulationDayLeft: 0,
      isFertile: false,
      colorHex: '#9CA3AF'
    };
  }

  const selectedDate = parseISODate(selectedDateStr);
  const lastStart = parseISODate(lastStartStr);

  const daysBetween = differenceInDays(selectedDate, lastStart);

  let cycleDay = 1;
  if (daysBetween >= 0) {
    cycleDay = (daysBetween % cLen) + 1;
  } else {
    const absDays = Math.abs(daysBetween);
    const rem = absDays % cLen;
    cycleDay = rem === 0 ? 1 : cLen - rem + 1;
  }

  const ovulationDay = cLen - 14;
  const fertileStart = ovulationDay - 3;
  const fertileEnd = ovulationDay + 1;

  let phaseName = '';
  let phaseDescription = '';
  let colorHex = '';
  let isFertile = false;

  if (cycleDay >= 1 && cycleDay <= pLen) {
    phaseName = 'Faza Menstruale';
    phaseDescription = 'Trupi juaj po pastrohet. Çlodhuni, pini çaj të ngrohtë dhe bëni kujdes për higjenën.';
    colorHex = '#FF3366'; // Crimson Rose
  } else if (cycleDay > pLen && cycleDay < fertileStart) {
    phaseName = 'Faza Folikulare';
    phaseDescription = 'Nivelet e estrogjenit po rriten. Ndjeni më shumë energji, përqendrim dhe kreativitet.';
    colorHex = '#A88BFF'; // Twilight Purple
  } else if (cycleDay >= fertileStart && cycleDay <= fertileEnd) {
    phaseName = 'Faza Ovuluese';
    phaseDescription = 'Ditët tuaja më pjellore! Fertilitet i lartë, lëkurë e shndritshme dhe humor i shkëlqyer.';
    colorHex = '#FFB800'; // Blossom Gold
    isFertile = true;
  } else {
    phaseName = 'Faza Luteale';
    phaseDescription = 'Nis rritja e progesteronit. Mund të keni shenja të PMS. Praktikoni vetëkujdesin dhe ngadalësoni ritmin.';
    colorHex = '#FF66B2'; // Bubblegum Pink
  }

  const daysToNext = cycleDay <= cLen ? cLen - cycleDay + 1 : cLen;

  const nextPeriodDate = new Date(selectedDate);
  nextPeriodDate.setDate(selectedDate.getDate() + daysToNext);
  const nextPeriodDateFormatted = formatToAlbanianDate(formatISODate(nextPeriodDate));

  let daysToOvulation = 0;
  if (cycleDay < ovulationDay) {
    daysToOvulation = ovulationDay - cycleDay;
  } else if (cycleDay === ovulationDay) {
    daysToOvulation = 0;
  } else {
    daysToOvulation = (cLen - cycleDay) + ovulationDay;
  }

  return {
    cycleDay,
    phaseName,
    phaseDescription,
    nextPeriodDaysLeft: daysToNext,
    nextPeriodDateFormatted,
    ovulationDayLeft: daysToOvulation,
    isFertile,
    colorHex
  };
}
