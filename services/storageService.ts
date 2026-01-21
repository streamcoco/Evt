
import { Note, Category, Task, Habit, HealthData, UserProfile, Reward, DailyStats, StudyEvent, Flashcard, Challenge, ForestSession, TreeType, FinanceData, Skill, WorkoutRoutine } from '../types';
import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const NOTES_KEY = 'sb_notes_v2';
const TASKS_KEY = 'sb_tasks_v2';
const HABITS_KEY = 'sb_habits_v2';
const HEALTH_KEY = 'sb_health_v3'; 
const PROFILE_KEY = 'sb_profile_v6'; // Bumped version for economy
const REWARDS_KEY = 'sb_rewards_v6'; // Bumped for new user requested items
const STATS_KEY = 'sb_stats_v2';
const STUDY_KEY = 'sb_study_v2';
const FLASHCARDS_KEY = 'sb_flashcards_v2';
const CHALLENGES_KEY = 'sb_challenges_v2';
const FOREST_KEY = 'sb_forest_v1';
const FINANCE_KEY = 'sb_finance_v1';
const SKILLS_KEY = 'sb_skills_v1';
const ROUTINE_KEY = 'sb_active_routine_v1';

// --- Generic Helper ---
function save<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.error(e); }
}
function load<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) { return fallback; }
}

// --- Notes ---
export const saveNotes = (d: Note[]) => save(NOTES_KEY, d);
export const loadNotes = () => load<Note[]>(NOTES_KEY, []);
export const createInitialNote = (): Note => ({
  id: crypto.randomUUID(),
  title: 'Instrucciones Cerebro Digital',
  content: '# Bienvenido\n\nEste es tu sistema de gestión vital.\n\n- **Salud**: Registra comidas y actividad.\n- **Hábitos**: Usa leyes atómicas (Obvio, Atractivo, Sencillo, Satisfactorio).\n- **Estudio**: Crea eventos y genera planes con IA.\n- **Tienda**: Gana créditos cumpliendo tareas y compra recompensas.\n- **Finanzas**: Controla gastos personales, de pareja y vivienda.',
  category: Category.INBOX,
  tags: ['sistema'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// --- Tasks ---
export const saveTasks = (d: Task[]) => save(TASKS_KEY, d);
export const loadTasks = () => load<Task[]>(TASKS_KEY, []);

// --- Habits ---
const DEFAULT_HABITS: Habit[] = [
  { id: 'h1', label: 'Cama hecha', completed: false, icon: '🛏️', type: 'good', streak: 0, createdAt: Date.now(), difficulty: 'easy', rewardValue: 5 },
  { id: 'h2', label: 'Leer 10 min', completed: false, icon: '📚', type: 'good', streak: 0, createdAt: Date.now(), difficulty: 'medium', rewardValue: 10 },
];

export const saveHabits = (d: Habit[]) => save(HABITS_KEY, d);
export const loadHabits = (): Habit[] => {
  const habits = load<Habit[]>(HABITS_KEY, DEFAULT_HABITS);
  return habits;
};

// --- Health ---
const DEFAULT_HEALTH: HealthData = {
  steps: 0, stepGoal: 10000, waterMl: 0, waterGoal: 2500, foodLog: [], activityLog: [],
  bodyMetrics: {
      waist: 0, hips: 0, neck: 0, bodyFatPercentage: 0, muscleMassPercentage: 0, waterPercentage: 0, bmi: 0
  }
};
export const saveHealth = (d: HealthData) => save(HEALTH_KEY, d);
export const loadHealth = () => load<HealthData>(HEALTH_KEY, DEFAULT_HEALTH);

// --- Profile & Economy ---
const DEFAULT_PROFILE: UserProfile = {
  name: 'Usuario', age: 25, sex: 'male', weight: 70, height: 170, 
  activityLevel: 'moderate', goalType: 'maintain',
  goals: 'Mejorar disciplina y salud.', credits: 1000, totalXp: 0, streakFreezes: 0,
  inventory: {},
  economyStats: {
      inflationMultiplier: 1.0,
      lastPurchaseDate: 0,
      purchaseStreak: 0,
      activeDiscounts: []
  }
};
export const saveProfile = (d: UserProfile) => save(PROFILE_KEY, d);
export const loadProfile = () => {
    const p = load<UserProfile>(PROFILE_KEY, DEFAULT_PROFILE);
    if (!p.inventory) p.inventory = {}; 
    if (!p.economyStats) p.economyStats = DEFAULT_PROFILE.economyStats;
    return p;
};

// --- REWARDS (Updated with User's requested items) ---
export const saveRewards = (d: Reward[]) => save(REWARDS_KEY, d);
export const loadRewards = () => load<Reward[]>(REWARDS_KEY, [
  { id: 'pocion_vida', name: 'pocion de vida', cost: 100, type: 'consumable', icon: '🧪', consumableEffect: 'Restaura vitalidad', durationMinutes: 15 },
  { id: 'escudo_oro', name: 'escudo de oro', cost: 250, type: 'general', icon: '🛡️', consumableEffect: 'Protección divina', durationMinutes: 60 },
  { id: 'sys_freeze', name: 'congelador de racha', cost: 150, type: 'consumable', icon: '❄️', isSystemItem: true, consumableEffect: 'Salva tu racha si fallas un día.' },
  
  // Trees need specific treeData structure for FocusGarden
  { id: 'arbol_roble', name: 'roble místico', cost: 500, type: 'tree', icon: '🌳', treeData: { id: 'arbol_roble', name: 'Roble Místico', emoji: '🌳', cost: 500, unlocked: false, minMinutes: 25 } },
  { id: 'tree_pine', name: 'pino básico', cost: 0, type: 'tree', icon: '🌲', treeData: { id: 'tree_pine', name: 'Pino', emoji: '🌲', cost: 0, unlocked: true, minMinutes: 10 } },

  { id: 'espada_fuego', name: 'espada de fuego', cost: 300, type: 'general', icon: '🔥', consumableEffect: '+10 Ataque' },
  { id: 'amuleto_suerte', name: 'amuleto', cost: 120, type: 'general', icon: '🍀', consumableEffect: '+5 Suerte' },
]);

export const saveStats = (d: DailyStats[]) => save(STATS_KEY, d);
export const loadStats = () => load<DailyStats[]>(STATS_KEY, []);

// --- Study ---
export const saveStudyEvents = (d: StudyEvent[]) => save(STUDY_KEY, d);
export const loadStudyEvents = () => load<StudyEvent[]>(STUDY_KEY, []);

export const saveFlashcards = (d: Flashcard[]) => save(FLASHCARDS_KEY, d);
export const loadFlashcards = () => load<Flashcard[]>(FLASHCARDS_KEY, []);

// --- Challenges ---
export const saveChallenges = (d: Challenge[]) => save(CHALLENGES_KEY, d);
export const loadChallenges = () => load<Challenge[]>(CHALLENGES_KEY, []);

// --- Forest ---
export const saveForest = (d: ForestSession[]) => save(FOREST_KEY, d);
export const loadForest = () => load<ForestSession[]>(FOREST_KEY, []);

// --- Finance ---
const DEFAULT_FINANCE: FinanceData = {
    transactions: [],
    savingsGoal: 500, // Default 500 currency units
    assets: [
        { id: 'btc', symbol: 'BTC', name: 'Bitcoin', type: 'crypto', price: 65000, change24h: 1.2, isFavorite: true },
        { id: 'eth', symbol: 'ETH', name: 'Ethereum', type: 'crypto', price: 3500, change24h: -0.5, isFavorite: true },
        { id: 'spy', symbol: 'SPY', name: 'S&P 500', type: 'stock', price: 510, change24h: 0.8, isFavorite: true },
        { id: 'tsla', symbol: 'TSLA', name: 'Tesla', type: 'stock', price: 175, change24h: -2.1, isFavorite: false },
        { id: 'eurusd', symbol: 'EUR/USD', name: 'Euro/Dollar', type: 'forex', price: 1.08, change24h: 0.1, isFavorite: false }
    ]
};
export const saveFinance = (d: FinanceData) => save(FINANCE_KEY, d);
export const loadFinance = () => load<FinanceData>(FINANCE_KEY, DEFAULT_FINANCE);

// --- Skills ---
export const saveSkills = (d: Skill[]) => save(SKILLS_KEY, d);
export const loadSkills = () => load<Skill[]>(SKILLS_KEY, []);

// --- Active Routine (Trainer) ---
export const saveActiveRoutine = (d: WorkoutRoutine | null) => save(ROUTINE_KEY, d);
export const loadActiveRoutine = () => load<WorkoutRoutine | null>(ROUTINE_KEY, null);

// --- Cloud Sync Helpers ---

// Helper function to replace undefined with null recursively
const sanitizeData = (data: any): any => {
    if (data === undefined) return null;
    if (data === null) return null;
    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }
    if (typeof data === 'object') {
        const sanitized: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                sanitized[key] = sanitizeData(data[key]);
            }
        }
        return sanitized;
    }
    return data;
};

export const saveToCloud = async (userId: string, data: any) => {
    try {
        const cleanData = sanitizeData(data);
        await setDoc(doc(db, "users", userId), cleanData, { merge: true });
    } catch (e) {
        console.error("Cloud save failed", e);
    }
}

export const loadFromCloud = async (userId: string) => {
    try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
    } catch (e) {
        console.error("Cloud load failed", e);
    }
    return null;
}

// --- Haptics ---
export const triggerHaptic = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}
