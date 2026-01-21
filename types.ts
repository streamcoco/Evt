
export enum Category {
  INBOX = 'Bandeja de Entrada',
  PROJECTS = 'Proyectos',
  AREAS = 'Áreas',
  RESOURCES = 'Recursos',
  ARCHIVES = 'Archivos'
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: Category;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  difficulty: Difficulty;
  rewardValue: number;
  createdAt: number;
  isStudyTask?: boolean;
}

export interface Habit {
  id: string;
  label: string;
  completed: boolean;
  type: 'good' | 'bad';
  difficulty: Difficulty;
  rewardValue: number;
  icon?: string;
  streak: number;
  lastCompletedDate?: string; // YYYY-MM-DD
  // Atomic Habit Laws
  cue?: string;
  craving?: string;
  response?: string;
  reward?: string;
  createdAt: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'health' | 'learning' | 'general';
  durationDays: number;
  rewardCredits: number;
  completed: boolean;
  deadline: number;
}

export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodEntry {
  id: string;
  name: string;
  timestamp: number;
  macros: MacroNutrients;
  imageUrl?: string;
}

export interface ActivityEntry {
  id: string;
  type: string;
  durationMinutes: number;
  caloriesBurned: number;
  avgHeartRate?: number; // Added for scientific calc
  timestamp: number;
}

export interface BodyMetrics {
  waist?: number;
  hips?: number;
  neck?: number;
  bodyFatPercentage?: number;
  muscleMassPercentage?: number;
  waterPercentage?: number;
  bmi: number;
}

export interface HealthData {
  steps: number;
  stepGoal: number;
  waterMl: number;
  waterGoal: number;
  foodLog: FoodEntry[];
  activityLog: ActivityEntry[];
  bodyMetrics: BodyMetrics;
}

export interface EconomyStats {
    inflationMultiplier: number;
    lastPurchaseDate: number;
    purchaseStreak: number;
    activeDiscounts: string[]; // List of Reward IDs on sale
}

export interface UserProfile {
  name: string;
  age: number; // Mandatory
  sex: 'male' | 'female';
  weight: number; // Mandatory
  height: number; // Mandatory
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
  goalType: 'lose' | 'maintain' | 'gain';
  goals: string;
  credits: number;
  totalXp: number; // Cumulative XP for leveling
  streakFreezes: number;
  inventory: Record<string, number>; // Item ID -> Count
  economyStats: EconomyStats; // NEW: Dynamic pricing tracking
  hasOnboarded?: boolean; 
  lastLoginDate?: string; 
  hasMetrics?: boolean; // If mandatory metrics are set
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  weight: number;
  taskCompletionRate: number;
  habitCompletionRate: number;
  caloriesConsumed: number;
  caloriesBurned: number;
  disciplineScore: number; // 0-100 aggregated score
}

export interface TreeType {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  unlocked: boolean;
  minMinutes: number;
}

export interface ForestSession {
  id: string;
  timestamp: number;
  durationMinutes: number;
  treeId: string;
  status: 'completed' | 'failed';
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  icon: string;
  isSystemItem?: boolean;
  type?: 'general' | 'tree' | 'consumable'; 
  treeData?: TreeType;
  consumableEffect?: string; 
  unlockLevel?: number; // Level required to buy
  durationMinutes?: number; // For non-cumulative logic
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deckId: string;
  nextReview: number;
  interval: number;
  easeFactor: number;
}

export interface StudyTask {
  id: string;
  description: string;
  suggestedDate: string;
  addedToDaily: boolean;
}

export interface StudySource {
    id: string;
    title: string;
    type: 'text' | 'url';
    content: string; // The raw text or the URL
    dateAdded: number;
}

export interface StudyEvent {
  id: string;
  title: string;
  date: string;
  topic: string;
  generatedPlan: StudyTask[];
  sources?: StudySource[]; // NotebookLM integration
  notebookLmUrl?: string; // NEW: Link to NotebookLM
}

// --- FINANCE TYPES ---
export type FinanceContext = 'personal' | 'couple' | 'housing';
export type TransactionType = 'income' | 'expense' | 'savings';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  context: FinanceContext;
  category: string; // Comida, Alquiler, Servicios...
  date: number;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'forex';
  price: number;
  change24h: number; // Percentage
  isFavorite: boolean;
}

export interface FinanceData {
  transactions: Transaction[];
  savingsGoal: number; // Monthly Goal
  assets: Asset[];
}

export interface AgentSuggestion {
    id: string;
    type: 'alert' | 'insight' | 'motivation';
    text: string;
}

// --- SKILL TYPES ---
export interface SkillMilestone {
    id: string;
    label: string;
    completed: boolean;
    xpValue: number;
}

export interface Skill {
    id: string;
    name: string;
    level: number; // Skill specific level
    currentXp: number;
    nextLevelXp: number;
    milestones: SkillMilestone[];
    aiChallenge?: string; // Daily challenge generated by AI
    createdAt: number;
}

// --- TRAINER TYPES ---
export type TrainingMode = 'stopwatch' | 'tabata' | 'routine';

export interface TrainingSession {
    id: string;
    mode: TrainingMode;
    durationSeconds: number;
    timestamp: number;
    caloriesBurned: number;
}

// NEW: Structured Workout Routine
export interface WorkoutExercise {
    id: string;
    name: string;
    sets: number;
    reps: string;
    notes: string;
    completedSets: number; // Tracks how many bubbles are clicked
}

export interface WorkoutRoutine {
    title: string;
    scientificSummary: string;
    warmup: string[];
    exercises: WorkoutExercise[];
    cooldown: string[];
    createdAt: number;
}
