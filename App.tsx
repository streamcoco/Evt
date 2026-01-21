
import React, { useState, useEffect, useRef } from 'react';
import { Note, Category, Task, Habit, HealthData, UserProfile, Reward, DailyStats, StudyEvent, Flashcard, Difficulty, Challenge, ForestSession, TreeType, FinanceData, AgentSuggestion, Skill } from './types';
import { 
  loadNotes, saveNotes, createInitialNote, 
  loadTasks, saveTasks, 
  loadHabits, saveHabits,
  loadHealth, saveHealth,
  loadProfile, saveProfile,
  loadRewards, saveRewards,
  loadStats, saveStats,
  loadStudyEvents, saveStudyEvents,
  loadFlashcards, saveFlashcards,
  loadChallenges, saveChallenges,
  loadForest, saveForest,
  loadFinance, saveFinance,
  loadSkills, saveSkills,
  saveToCloud, loadFromCloud, triggerHaptic
} from './services/storageService';
import { playSound } from './services/soundService';
import { auth } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { autoCategorizeNote, checkSpecialOffers } from './services/geminiService';
import { requestNotificationPermission, sendNotification } from './services/notificationService';

// Views
import AuthView from './components/AuthView';
import MobileNav from './components/MobileNav';
import NoteEditor from './components/NoteEditor';
import TaskView from './components/TaskView';
import HabitView from './components/HabitView';
import HealthView from './components/HealthView';
import ShopView from './components/ShopView';
import StudyView from './components/StudyView';
import StatsView from './components/StatsView';
import FocusGardenView from './components/FocusGardenView';
import FinanceView from './components/FinanceView';
import HomeDashboardView, { LEVEL_UNLOCKS } from './components/HomeDashboardView'; 
import LevelUpModal from './components/LevelUpModal';
import SkillsView from './components/SkillsView';
import AIChat from './components/AIChat';
import TrainerView from './components/TrainerView';
import OnboardingOverlay from './components/OnboardingOverlay';
import { Search, Plus, ArrowLeft, Cloud, Check, Book } from 'lucide-react';

const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- App State ---
  const [activeTab, setActiveTab] = useState('home');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [healthData, setHealthData] = useState<HealthData>({ 
      steps: 0, stepGoal: 10000, waterMl: 0, waterGoal: 2000, foodLog: [], activityLog: [],
      bodyMetrics: { waist: 0, hips: 0, neck: 0, bodyFatPercentage: 0, muscleMassPercentage: 0, waterPercentage: 0, bmi: 0 }
  });
  const [profile, setProfile] = useState<UserProfile>({ 
      name: '', age: 0, sex: 'male', weight: 0, height: 0, 
      activityLevel: 'moderate', goalType: 'maintain',
      goals: '', credits: 500, totalXp: 0, streakFreezes: 0, inventory: {},
      economyStats: { inflationMultiplier: 1.0, lastPurchaseDate: 0, purchaseStreak: 0, activeDiscounts: [] }
  });
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [studyEvents, setStudyEvents] = useState<StudyEvent[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [forest, setForest] = useState<ForestSession[]>([]);
  const [finance, setFinance] = useState<FinanceData>({ transactions: [], savingsGoal: 500, assets: [] });
  const [skills, setSkills] = useState<Skill[]>([]);

  const [agentSuggestions, setAgentSuggestions] = useState<AgentSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | 'ALL'>('ALL');

  // Swipe State
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);

  // Computed
  const userLevel = Math.floor(profile.totalXp / 1000) + 1;

  // --- Auth & Cloud Sync Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      if (u) {
          setIsSyncing(true);
          // Try to load from cloud first
          const cloudData = await loadFromCloud(u.uid);
          if (cloudData) {
              // Merge Logic or Overwrite (Simplest is overwrite state with cloud if exists)
              if (cloudData.profile) {
                  const safeProfile = { 
                      ...cloudData.profile, 
                      inventory: cloudData.profile.inventory || {},
                      economyStats: cloudData.profile.economyStats || { inflationMultiplier: 1.0, lastPurchaseDate: 0, purchaseStreak: 0, activeDiscounts: [] }
                  };
                  setProfile(safeProfile);
                  checkEconomyStatus(safeProfile); 
              }
              if (cloudData.notes) setNotes(cloudData.notes);
              if (cloudData.tasks) setTasks(cloudData.tasks);
              if (cloudData.habits) setHabits(cloudData.habits);
              if (cloudData.healthData) setHealthData(cloudData.healthData);
              if (cloudData.stats) setStats(cloudData.stats);
              if (cloudData.rewards) setRewards(cloudData.rewards);
              if (cloudData.studyEvents) setStudyEvents(cloudData.studyEvents);
              if (cloudData.flashcards) setFlashcards(cloudData.flashcards);
              if (cloudData.challenges) setChallenges(cloudData.challenges);
              if (cloudData.forest) setForest(cloudData.forest);
              if (cloudData.finance) setFinance(cloudData.finance);
              if (cloudData.skills) setSkills(cloudData.skills);
          } else {
              // If no cloud data, load local (offline mode or first time)
              loadLocalData();
          }
          setIsSyncing(false);
          setShowOnboarding(true);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadLocalData = () => {
    const p = loadProfile();
    setProfile(p);
    checkEconomyStatus(p); // Check local
    setNotes(loadNotes());
    setTasks(loadTasks());
    setHabits(loadHabits());
    setHealthData(loadHealth());
    setStats(loadStats());
    setRewards(loadRewards());
    setStudyEvents(loadStudyEvents());
    setFlashcards(loadFlashcards());
    setChallenges(loadChallenges());
    setForest(loadForest());
    setFinance(loadFinance());
    setSkills(loadSkills());
  };

  // --- ECONOMY CHECK (DEFLATION LOGIC) ---
  const checkEconomyStatus = async (p: UserProfile) => {
      const now = Date.now();
      const daysSincePurchase = (now - (p.economyStats?.lastPurchaseDate || 0)) / (1000 * 60 * 60 * 24);
      
      let newMultiplier = p.economyStats?.inflationMultiplier || 1.0;
      let newDiscounts = p.economyStats?.activeDiscounts || [];

      // Deflation: If > 3 days without purchase, reduce multiplier
      if (daysSincePurchase > 3 && newMultiplier > 1.0) {
          newMultiplier = Math.max(1.0, newMultiplier - 0.2); // Drop inflation
          
          // Generate AI Discounts if inactive
          if (newDiscounts.length === 0) {
             const discounts = await checkSpecialOffers(p, loadRewards());
             newDiscounts = discounts;
          }
      } else if (daysSincePurchase > 1) {
          // Clear old discounts if active recently
          newDiscounts = []; 
      }

      if (newMultiplier !== p.economyStats?.inflationMultiplier || newDiscounts.length !== p.economyStats?.activeDiscounts.length) {
          setProfile(prev => ({
              ...prev,
              economyStats: {
                  ...prev.economyStats,
                  inflationMultiplier: newMultiplier,
                  activeDiscounts: newDiscounts
              }
          }));
      }
  };

  // --- Cloud Save & Sync Logic ---
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Saves to local storage instantly, debounces cloud save
  const triggerCloudSave = () => {
      if (!user) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(() => {
          saveToCloud(user.uid, {
              profile, notes, tasks, habits, healthData, stats, rewards, 
              studyEvents, flashcards, challenges, forest, finance, skills
          });
      }, 2000); // 2 second debounce for cloud
  };

  // Listen for internet reconnection to force sync
  useEffect(() => {
      const handleOnline = () => {
          if (user) {
              console.log("Conexión retomada. Sincronizando con la nube...");
              triggerCloudSave(); // Force push current local state to cloud
              setIsSyncing(true);
              setTimeout(() => setIsSyncing(false), 1500); // visual feedback
          }
      };
      window.addEventListener('online', handleOnline);
      return () => window.removeEventListener('online', handleOnline);
  }, [user, profile, notes, tasks]); // Dependencies ensure we have latest state

  // Persist Local & Trigger Cloud
  useEffect(() => { if (user) { saveProfile(profile); triggerCloudSave(); } }, [profile, user]);
  useEffect(() => { if (user) { saveNotes(notes); triggerCloudSave(); } }, [notes, user]);
  useEffect(() => { if (user) { saveTasks(tasks); triggerCloudSave(); } }, [tasks, user]);
  useEffect(() => { if (user) { saveHabits(habits); triggerCloudSave(); } }, [habits, user]);
  useEffect(() => { if (user) { saveHealth(healthData); triggerCloudSave(); } }, [healthData, user]);
  useEffect(() => { if (user) { saveRewards(rewards); triggerCloudSave(); } }, [rewards, user]);
  useEffect(() => { if (user) { saveStats(stats); triggerCloudSave(); } }, [stats, user]);
  useEffect(() => { if (user) { saveStudyEvents(studyEvents); triggerCloudSave(); } }, [studyEvents, user]);
  useEffect(() => { if (user) { saveFlashcards(flashcards); triggerCloudSave(); } }, [flashcards, user]);
  useEffect(() => { if (user) { saveChallenges(challenges); triggerCloudSave(); } }, [challenges, user]);
  useEffect(() => { if (user) { saveForest(forest); triggerCloudSave(); } }, [forest, user]);
  useEffect(() => { if (user) { saveFinance(finance); triggerCloudSave(); } }, [finance, user]);
  useEffect(() => { if (user) { saveSkills(skills); triggerCloudSave(); } }, [skills, user]);

  // --- Helpers ---
  const gainXpAndCredits = (amount: number) => {
    const oldLevel = Math.floor((profile.totalXp || 0) / 1000) + 1;
    const newTotalXp = (profile.totalXp || 0) + amount;
    const newLevel = Math.floor(newTotalXp / 1000) + 1;

    setProfile(p => ({ 
        ...p, 
        credits: p.credits + amount,
        totalXp: newTotalXp 
    }));

    if (newLevel > oldLevel) {
        setShowLevelUpModal(true);
    }
  };

  const deductCredits = (amount: number): boolean => {
      if (profile.credits >= amount) {
          setProfile(p => ({ ...p, credits: p.credits - amount }));
          playSound('buy');
          return true;
      }
      alert(`Insuficientes monedas. Necesitas ${amount}.`);
      return false;
  };

  const removeCredits = (amount: number) => {
    setProfile(p => ({ ...p, credits: Math.max(0, p.credits - amount) }));
  };

  const handleFinishOnboarding = () => {
      setShowOnboarding(false);
  };

  const navigateTo = (tab: string) => {
      setActiveTab(tab);
      triggerHaptic(20);
  };

  // --- SHOP LOGIC WITH DYNAMIC ECONOMY ---
  const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

  const handleBuyReward = (reward: Reward) => {
    const isSystemItem = reward.id === 'sys_freeze';
    
    // Calculate Dynamic Cost
    let finalCost = reward.cost * (profile.economyStats?.inflationMultiplier || 1.0);
    if (profile.economyStats?.activeDiscounts.includes(reward.id)) {
        finalCost = finalCost * 0.7; // 30% discount
    }
    finalCost = Math.round(finalCost);

    // 1. Check Credits
    if (profile.credits < finalCost) {
      alert(`⚠️ No tienes suficientes monedas. Precio actual: ${finalCost}`);
      playSound('error');
      return;
    }

    // 2. Update Profile (Inventory & Economy)
    setProfile(prev => {
      const newCredits = prev.credits - finalCost;
      const newInventory = { ...prev.inventory };
      let newStreakFreezes = prev.streakFreezes;

      const itemNameKey = capitalize(reward.name || reward.id);

      if (isSystemItem) {
        newStreakFreezes = (prev.streakFreezes || 0) + 1;
      } else if (reward.type !== 'tree') {
        // Incrementamos la cantidad en el inventario SOLO si NO es un árbol
        const currentCount = newInventory[itemNameKey] || 0;
        newInventory[itemNameKey] = currentCount + 1;
      }

      // INFLATION LOGIC: Increase multiplier slightly on purchase
      const newInflation = Math.min(2.0, (prev.economyStats?.inflationMultiplier || 1.0) + 0.05);

      return {
        ...prev,
        credits: newCredits,
        streakFreezes: newStreakFreezes,
        inventory: newInventory,
        economyStats: {
            ...prev.economyStats,
            inflationMultiplier: newInflation,
            lastPurchaseDate: Date.now(),
            purchaseStreak: (prev.economyStats?.purchaseStreak || 0) + 1
        }
      };
    });

    // 3. Tree Unlock
    if (reward.type === 'tree') {
      setRewards(prevRewards =>
        prevRewards.map(r =>
          r.id === reward.id && r.treeData ? { ...r, treeData: { ...r.treeData, unlocked: true } } : r
        )
      );
      alert(`✅ ¡Nuevo árbol desbloqueado!\nEncuéntralo en el Vivero Mental (Focus).`);
    } else {
      alert(`✅ ¡Has comprado ${capitalize(reward.name)}!\nSe añadió a tu Inventario.`);
    }

    triggerHaptic(100);
    playSound('buy');
  };

  // --- NEW: USE ITEM FROM INVENTORY ---
  const handleConsumeItem = (itemName: string) => {
      setProfile(prev => {
          const newInventory = { ...prev.inventory };
          const currentCount = newInventory[itemName] || 0;
          
          if (currentCount > 0) {
              // Decrement count
              newInventory[itemName] = currentCount - 1;
              if (newInventory[itemName] <= 0) {
                  delete newInventory[itemName];
              }
              
              triggerHaptic(50);
              playSound('success');
              
              // Simulate Item Effect (visual feedback)
              alert(`Has utilizado: ${itemName}.\nEfecto aplicado correctamente.`);
              
              return { ...prev, inventory: newInventory };
          }
          return prev;
      });
  };

  // --- DELETE REWARD FROM CATALOG ---
  const handleDeleteReward = (id: string) => {
      if (confirm('¿Eliminar este artículo del catálogo de la tienda?')) {
          setRewards(prev => prev.filter(r => r.id !== id));
      }
  };

  // --- Handlers ---
  const handleCreateNote = () => { const newNote: Note = { id: crypto.randomUUID(), title: '', content: '', category: Category.INBOX, tags: [], createdAt: Date.now(), updatedAt: Date.now() }; setNotes([newNote, ...notes]); setActiveNoteId(newNote.id); };
  const handleUpdateNote = async (updatedNote: Note) => { setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n)); };
  const handleDeleteNote = (id: string) => { if (confirm('¿Borrar?')) { setNotes(notes.filter(n => n.id !== id)); setActiveNoteId(null); } };
  const handleAddTask = (text: string, difficulty: Difficulty) => { setTasks([...tasks, { id: crypto.randomUUID(), text, completed: false, difficulty, rewardValue: difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 20, createdAt: Date.now() }]); };
  const handleToggleTask = (id: string) => { const task = tasks.find(t => t.id === id); if (task && !task.completed) gainXpAndCredits(task.rewardValue); setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)); };
  const handleDeleteTask = (id: string) => { setTasks(tasks.filter(t => t.id !== id)); };
  const handleFocusComplete = (minutes: number) => { gainXpAndCredits(minutes * 2); };
  const handleAddHabit = (h: Habit) => setHabits([...habits, h]);
  const handleToggleHabit = (id: string) => { setHabits(habits.map(h => { if(h.id === id && !h.completed) gainXpAndCredits(h.rewardValue); return h.id === id ? {...h, completed: !h.completed, streak: !h.completed ? h.streak + 1 : h.streak} : h })); };
  const handleDeleteHabit = (id: string) => setHabits(habits.filter(h => h.id !== id));
  const handleTrainingComplete = (minutes: number) => gainXpAndCredits(minutes * 3);
  const handleForestSessionComplete = (session: ForestSession, reward: number) => { setForest([...forest, session]); gainXpAndCredits(reward); };
  const handleForestSessionFailed = (p: number) => { removeCredits(p); };
  const handleSkillsUpdate = (s: Skill) => setSkills(skills.map(sk => sk.id === s.id ? s : sk));
  const handleAddSkill = (s: Skill) => setSkills([...skills, s]);
  const handleAddChallenges = (c: Challenge[]) => setChallenges([...challenges, ...c]);
  const handleCompleteChallenge = (id: string) => { const c = challenges.find(ch => ch.id === id); if(c && !c.completed) { gainXpAndCredits(c.rewardCredits); setChallenges(challenges.map(ch => ch.id === id ? {...ch, completed: true} : ch)); }};

  // --- Swipe Logic ---
  const handleTouchStart = (e: React.TouchEvent) => {
      touchStartRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      touchEndRef.current = e.changedTouches[0].clientX;
      if (!touchStartRef.current || !touchEndRef.current) return;
      const distance = touchStartRef.current - touchEndRef.current;
      if (distance > 60) {
          if (activeTab === 'home') navigateTo('tasks');
          if (activeTab === 'notes') navigateTo('home');
      }
      if (distance < -60) {
          if (activeTab === 'home') navigateTo('notes');
          if (activeTab === 'tasks') navigateTo('home');
      }
      touchStartRef.current = null;
      touchEndRef.current = null;
  };

  // --- Render ---
  if (authLoading) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white">Cargando...</div>;
  if (!user) return <AuthView />;

  const renderContent = () => {
    if (activeNoteId) {
      const note = notes.find(n => n.id === activeNoteId);
      if (!note) return null;
      return <div className="h-full relative z-20 bg-white"><div className="absolute top-4 left-2 z-30"><button onClick={() => setActiveNoteId(null)} className="p-2 bg-slate-100 rounded-full text-slate-600"><ArrowLeft size={20} /></button></div><NoteEditor note={note} onSave={handleUpdateNote} onDelete={handleDeleteNote} onClose={() => setActiveNoteId(null)} onDeductCredits={deductCredits} /></div>;
    }

    switch (activeTab) {
      case 'home': return <HomeDashboardView profile={profile} suggestions={agentSuggestions} onNavigate={navigateTo} godMode={false} toggleGodMode={() => {}} activeChallenges={challenges.filter(c => !c.completed && c.deadline > Date.now())} />;
      case 'notes': return <div className="flex flex-col h-full bg-slate-50 pb-20"><div className="bg-slate-900 text-white p-6 rounded-b-3xl shadow-lg relative overflow-hidden flex-shrink-0 z-10"><div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-3xl opacity-20"></div><div className="relative z-10"><div className="flex justify-between items-center mb-4"><h2 className="font-bold text-lg flex items-center gap-2"><Book size={18} className="text-blue-400"/> Mis Notas</h2><button onClick={handleCreateNote} className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-full shadow-lg transition-transform active:scale-95 border border-blue-400/50"><Plus size={20} /></button></div><div className="relative mb-3"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><input className="w-full bg-slate-800 text-white rounded-xl py-2 pl-10 pr-4 outline-none text-sm border border-slate-700 placeholder-slate-500 focus:border-blue-500" placeholder="Buscar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div><div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"><button onClick={() => setFilterCategory('ALL')} className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${filterCategory === 'ALL' ? 'bg-white text-slate-900 border-white' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>Todos</button>{Object.values(Category).map(c => (<button key={c} onClick={() => setFilterCategory(c)} className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap ${filterCategory === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{c}</button>))}</div></div></div><div className="px-4 py-4 space-y-3 overflow-y-auto">{notes.filter(n => filterCategory === 'ALL' || n.category === filterCategory).filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase())).map(note => (<div key={note.id} onClick={() => setActiveNoteId(note.id)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 active:scale-98 transition-transform"><div className="flex justify-between items-start mb-1"><h3 className="font-bold text-slate-800 line-clamp-1">{note.title || 'Nota sin título'}</h3><span className="text-[10px] text-slate-400">{new Date(note.updatedAt).toLocaleDateString()}</span></div><p className="text-xs text-slate-500 line-clamp-2 mb-2">{note.content || 'Sin contenido...'}</p><div className="flex gap-1"><span className="text-[9px] px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-medium uppercase">{note.category}</span>{note.tags.map(t => <span key={t} className="text-[9px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded font-medium">#{t}</span>)}</div></div>))}</div></div>;
      case 'tasks': return <TaskView tasks={tasks} onAddTask={handleAddTask} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} onFocusComplete={handleFocusComplete} />;
      case 'habits': return <HabitView habits={habits} onAddHabit={handleAddHabit} onToggleHabit={handleToggleHabit} onDeleteHabit={handleDeleteHabit} />;
      case 'health': return <HealthView data={healthData} profile={profile} history={stats} onUpdateHealth={setHealthData} onUpdateProfile={setProfile} onDeductCredits={deductCredits} />;
      
      // SHOP with new USE and DELETE handlers
      case 'shop': return <ShopView profile={profile} rewards={rewards} onBuyReward={handleBuyReward} onUpdateRewards={setRewards} onDeductCredits={deductCredits} onUseItem={handleConsumeItem} onDeleteReward={handleDeleteReward} />;
      
      case 'trainer': return <TrainerView level={userLevel} onCompleteSession={handleTrainingComplete} godMode={false} userCredits={profile.credits} onBuy={removeCredits} />;
      case 'study': return <StudyView events={studyEvents} flashcards={flashcards} onAddEvent={e => setStudyEvents([...studyEvents, e])} onUpdateEvent={e => setStudyEvents(studyEvents.map(ev => ev.id === e.id ? e : ev))} onDeleteEvent={id => setStudyEvents(studyEvents.filter(e => e.id !== id))} onAddFlashcards={c => setFlashcards([...flashcards, ...c])} onUpdateFlashcard={c => setFlashcards(flashcards.map(fc => fc.id === c.id ? c : fc))} onAddTaskToDaily={t => setTasks([...tasks, { ...t, difficulty: 'medium', rewardValue: 10 }])} onDeductCredits={deductCredits} userLevel={userLevel} />;
      case 'focus': const unlockedTrees = rewards.filter(r => r.type === 'tree' && r.treeData?.unlocked).map(r => r.treeData!); return <FocusGardenView forestHistory={forest} unlockedTrees={unlockedTrees.length > 0 ? unlockedTrees : [{ id:'pine', name:'Pino', emoji:'🌲', cost:0, unlocked:true, minMinutes:10 }]} tasks={tasks} onSessionComplete={handleForestSessionComplete} onSessionFailed={handleForestSessionFailed} onExit={() => setActiveTab('home')} />;
      case 'finance': return <FinanceView data={finance} onUpdateData={setFinance} />;
      case 'skills': return <SkillsView skills={skills} onAddSkill={handleAddSkill} onUpdateSkill={handleSkillsUpdate} onGainXp={gainXpAndCredits} onDeductCredits={deductCredits} />;
      case 'chat': return <AIChat notes={notes} tasks={tasks} habits={habits} stats={stats.find(s=>s.date === new Date().toISOString().split('T')[0])} health={healthData} profile={profile} />;
      case 'stats': return <StatsView stats={stats} habits={habits} tasks={tasks} challenges={challenges} userGoals={profile.goals} onAddChallenges={handleAddChallenges} onCompleteChallenge={handleCompleteChallenge} onDeductCredits={deductCredits} />;
      default: return null;
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="flex-1 overflow-hidden relative">{renderContent()}</div>
      
      {/* Cloud Sync Status Indicator */}
      {isSyncing && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[10px] px-3 py-1 rounded-full flex items-center gap-2 z-50 animate-pulse shadow-lg">
             <Cloud size={10}/> Sincronizando...
          </div>
      )}

      {showOnboarding && <OnboardingOverlay onComplete={handleFinishOnboarding} />}
      {showLevelUpModal && <LevelUpModal newLevel={userLevel} onClose={() => setShowLevelUpModal(false)} unlocks={LEVEL_UNLOCKS} />}
      {!activeNoteId && <div className="absolute bottom-0 left-0 w-full z-10 pointer-events-none"><MobileNav activeTab={activeTab} onTabChange={navigateTo} userLevel={userLevel} godMode={false} /></div>}
    </div>
  );
};

export default App;
