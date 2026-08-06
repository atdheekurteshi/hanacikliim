export interface PeriodDay {
  dateString: string; // "YYYY-MM-DD"
  flow: number;       // 0 = none, 1 = light, 2 = medium, 3 = heavy
  pain: number;       // 0 = none, 1 = mild, 2 = moderate, 3 = severe
  mood: string;       // e.g. "🌸 E qetë", "😊 E lumtur", etc.
  symptoms: string;   // comma-separated list
  notes: string;
  bbtTemp?: string;        // Basal Body Temperature e.g. "36.6"
  cervicalMucus?: string;  // Texture
  sexualActivity?: string; // "ASNJË", "I_MBROJTUR", "I_PAMBROJTUR"
  ovulationTest?: string;  // "NETESTUAR", "POZITIV", "NEGATIV"
}

export interface CyclePeriod {
  id: number;
  startDateString: string; // "YYYY-MM-DD"
  endDateString: string | null; // "YYYY-MM-DD" or null if ongoing
}

export interface AppSettings {
  username: string;
  cycleLength: number;
  periodLength: number;
  lastPeriodStart: string; // "YYYY-MM-DD"
  isPinEnabled: boolean;
  pinCode: string;
  remindPeriod: boolean;
  remindFertile: boolean;
  remindDaily: boolean;
  remindWater: boolean;
  remindPill?: boolean;
  pillTime?: string;
  discreetNotifications?: boolean;
  discreetText?: string;
  appGoal?: 'CYCLE' | 'PREGNANCY' | 'MENOPAUSE';
  baselineSymptoms?: string[];
  isOnboardingCompleted?: boolean;
  [key: string]: any; // Allow custom keys like water_ml_YYYY-MM-DD
}

export interface CycleState {
  cycleDay: number;
  phaseName: string;
  phaseDescription: string;
  nextPeriodDaysLeft: number;
  nextPeriodDateFormatted: string;
  ovulationDayLeft: number;
  isFertile: boolean;
  colorHex: string;
}

export type HenaTab = 'SOT' | 'KALENDARI' | 'DITARI' | 'KESHILLA' | 'HENA_AI';
export type DitariSubTab = 'LISTA' | 'STATISTIKAT';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imageUrl?: string;
  timestamp: string;
}

export interface DailyInsightData {
  title: string;
  hormoneStatus: string;
  dailyTip: string;
  energyLevel: string;
  affirmation: string;
}

export interface AiRecipe {
  name: string;
  prepTime: string;
  benefits: string;
  ingredients: string[];
  instructions: string;
}

export interface AiExercise {
  title: string;
  duration: string;
  intensity: string;
  description: string;
}

export interface AiRecommendationData {
  recipes: AiRecipe[];
  exercises: AiExercise[];
}

export interface AiSymptomAnalysisData {
  summary: string;
  patternObserved: string;
  recommendations: string[];
  medicalAlert?: string;
}
