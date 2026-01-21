
import React, { useState, useEffect, useRef } from 'react';
import { Timer, Zap, Play, Pause, RotateCcw, Activity, Loader2, Sparkles, Clock, Dumbbell, Lock, FileText, CheckCircle, Info, Trash2, Coins } from 'lucide-react';
import { generateWorkoutRoutine } from '../services/geminiService';
import { loadActiveRoutine, saveActiveRoutine } from '../services/storageService';
import { playSound } from '../services/soundService';
import { WorkoutRoutine } from '../types';

interface TrainerViewProps {
  level: number;
  onCompleteSession: (minutes: number, type: string) => void;
  godMode: boolean; 
  userCredits: number;
  onBuy: (cost: number) => void;
}

const TrainerView: React.FC<TrainerViewProps> = ({ onCompleteSession, userCredits, onBuy }) => {
  const [activeTab, setActiveTab] = useState<'timer' | 'tabata' | 'ai'>('ai'); // Default to AI
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- AI GENERATOR STATE ---
  const [goal, setGoal] = useState('Hipertrofia');
  const [equip, setEquip] = useState('Gimnasio');
  const [exp, setExp] = useState('Intermedio');
  const [time, setTime] = useState('60 min');
  
  const [activeRoutine, setActiveRoutine] = useState<WorkoutRoutine | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load routine on mount
  useEffect(() => {
      const saved = loadActiveRoutine();
      if (saved) setActiveRoutine(saved);
  }, []);

  // Save routine whenever it changes
  useEffect(() => {
      saveActiveRoutine(activeRoutine);
  }, [activeRoutine]);

  // --- TIMER STATE ---
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
      let interval: any;
      if (isTimerRunning) {
          interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
      }
      return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
      if (activeTab === 'ai' && activeRoutine && scrollRef.current) {
          scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
  }, [activeRoutine]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => { setIsTimerRunning(false); setTimerSeconds(0); };
  const finishTimer = () => {
      if (timerSeconds > 60) {
          const mins = Math.floor(timerSeconds / 60);
          onCompleteSession(mins, 'Sesión Libre');
          resetTimer();
      } else {
          alert("Sesión muy corta para registrar.");
      }
  };

  // UNIFIED GENERATION FLOW
  const handleGenerateRoutine = async () => {
      if (userCredits < 10) {
          alert("Necesitas 10 Monedas para generar una rutina completa.");
          return;
      }
      
      onBuy(10); 
      
      setIsGenerating(true);
      setActiveRoutine(null);
      
      try {
          const routine = await generateWorkoutRoutine(goal, equip, exp, time);
          setActiveRoutine(routine);
      } catch (e) {
          alert("El entrenador está ocupado. Intenta de nuevo.");
      } finally {
          setIsGenerating(false);
      }
  };

  const toggleSet = (exerciseId: string, setIndex: number) => {
      if (!activeRoutine) return;
      
      const updatedExercises = activeRoutine.exercises.map(ex => {
          if (ex.id === exerciseId) {
              const currentSets = ex.completedSets;
              // Logic: Click to complete next set. If clicking set 3 and 2 is not done, marks 1, 2, 3 done.
              // Simpler logic: Just increment count based on click or toggle.
              // Let's do: clicking bubbles fills up to that number. Clicking filled one clears it.
              
              const newCount = (setIndex + 1 === currentSets) ? setIndex : setIndex + 1;
              if (newCount > currentSets) playSound('click');
              return { ...ex, completedSets: newCount };
          }
          return ex;
      });

      setActiveRoutine({ ...activeRoutine, exercises: updatedExercises });
  };

  const handleFinishRoutine = () => {
      if (!confirm("¿Finalizar entrenamiento y borrar rutina?")) return;
      // Calculate completion %
      if (activeRoutine) {
          const totalSets = activeRoutine.exercises.reduce((acc, ex) => acc + ex.sets, 0);
          const doneSets = activeRoutine.exercises.reduce((acc, ex) => acc + ex.completedSets, 0);
          const completion = doneSets / totalSets;
          
          if (completion > 0.5) {
             const mins = parseInt(time) || 45;
             onCompleteSession(mins, activeRoutine.title);
             playSound('success');
          }
      }
      setActiveRoutine(null);
  };

  // --- TABATA STATE ---
  const [tState, setTState] = useState<'idle'|'work'|'rest'>('idle');
  const [tRounds, setTRounds] = useState(8);
  const [tWork, setTWork] = useState(20);
  const [tRest, setTRest] = useState(10);
  const [tCurrentRound, setTCurrentRound] = useState(1);
  const [tTime, setTTime] = useState(0);

  useEffect(() => {
      let interval: any;
      if (tState !== 'idle' && tTime > 0) {
          interval = setInterval(() => {
              setTTime(prev => {
                  if (prev <= 4 && prev > 1) playSound('beep');
                  return prev - 1;
              });
          }, 1000);
      } else if (tState !== 'idle' && tTime === 0) {
          nextTabataPhase();
      }
      return () => clearInterval(interval);
  }, [tState, tTime]);

  const startTabata = () => {
      setTCurrentRound(1);
      setTState('work');
      setTTime(tWork);
      playSound('whistle');
  };

  const nextTabataPhase = () => {
      if (tState === 'work') {
          if (tCurrentRound >= tRounds) {
              setTState('idle');
              onCompleteSession(Math.ceil((tRounds * (tWork + tRest)) / 60), 'Tabata');
              playSound('success');
              alert("¡Tabata Completado!");
          } else {
              setTState('rest');
              setTTime(tRest);
              playSound('beep');
          }
      } else if (tState === 'rest') {
          setTCurrentRound(c => c + 1);
          setTState('work');
          setTTime(tWork);
          playSound('whistle');
      }
  };

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-32 p-4">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
             <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Activity className="text-blue-600"/> Entrenador
            </h2>
            <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
                 <Coins size={14} className="text-yellow-500 fill-yellow-500"/>
                 <strong className="text-slate-900">{userCredits}</strong>
            </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm mb-6 border border-slate-100">
            <button onClick={() => setActiveTab('ai')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${activeTab === 'ai' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}>Rutina IA</button>
            <button onClick={() => setActiveTab('timer')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${activeTab === 'timer' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}>Libre</button>
            <button onClick={() => setActiveTab('tabata')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${activeTab === 'tabata' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}>Tabata</button>
        </div>

        {/* --- TIMER UI --- */}
        {activeTab === 'timer' && (
            <div className="flex flex-col items-center justify-center flex-1 py-10 bg-white rounded-3xl shadow-sm border border-slate-100 animate-in fade-in">
                <div className="text-7xl font-mono font-bold text-slate-800 mb-10 tabular-nums">
                    {formatTime(timerSeconds)}
                </div>
                <div className="flex gap-4 mb-8">
                    <button onClick={toggleTimer} className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${isTimerRunning ? 'bg-orange-400' : 'bg-blue-600'}`}>
                        {isTimerRunning ? <Pause size={32} fill="currentColor"/> : <Play size={32} fill="currentColor"/>}
                    </button>
                    <button onClick={resetTimer} className="w-20 h-20 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center">
                        <RotateCcw size={28}/>
                    </button>
                </div>
                {timerSeconds > 0 && !isTimerRunning && (
                    <button onClick={finishTimer} className="px-6 py-2 bg-emerald-100 text-emerald-700 rounded-full font-bold text-sm">
                        Terminar y Guardar
                    </button>
                )}
            </div>
        )}

        {/* --- TABATA UI --- */}
        {activeTab === 'tabata' && (
            <div className={`flex flex-col items-center justify-center flex-1 py-6 rounded-3xl shadow-lg border transition-colors duration-300 animate-in fade-in ${tState === 'work' ? 'bg-orange-600 text-white border-orange-600' : tState === 'rest' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-800 border-slate-100'}`}>
                {tState === 'idle' ? (
                    <div className="w-full max-w-xs px-6">
                        <h3 className="text-center font-bold text-lg mb-6">Configuración HIIT</h3>
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-500">Trabajo (s)</span>
                                <input type="number" className="w-20 p-2 border rounded-lg text-center font-bold" value={tWork} onChange={e=>setTWork(parseInt(e.target.value))}/>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-500">Descanso (s)</span>
                                <input type="number" className="w-20 p-2 border rounded-lg text-center font-bold" value={tRest} onChange={e=>setTRest(parseInt(e.target.value))}/>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-500">Rondas</span>
                                <input type="number" className="w-20 p-2 border rounded-lg text-center font-bold" value={tRounds} onChange={e=>setTRounds(parseInt(e.target.value))}/>
                            </div>
                        </div>
                        <button onClick={startTabata} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                            <Play size={20} fill="currentColor"/> Iniciar
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="text-xl font-bold uppercase tracking-widest mb-2 opacity-80">{tState === 'work' ? '¡Dale Duro!' : 'Descansa'}</div>
                        <div className="text-8xl font-mono font-bold mb-4">{tTime}</div>
                        <div className="text-sm font-medium opacity-70">Ronda {tCurrentRound} / {tRounds}</div>
                        <button onClick={() => setTState('idle')} className="mt-8 px-6 py-2 bg-white/20 rounded-full font-bold text-sm hover:bg-white/30">Cancelar</button>
                    </>
                )}
            </div>
        )}

        {/* --- AI COACH UI --- */}
        {activeTab === 'ai' && (
             <div className="flex-1 space-y-6 animate-in fade-in" ref={scrollRef}>
                
                {/* GENERATOR FORM */}
                {!activeRoutine && (
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                                <Sparkles size={24}/>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Diseñador de Rutinas</h3>
                                <p className="text-xs text-slate-400">Basado en biomecánica</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3 mb-6">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Objetivo</label>
                                <select className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-500" value={goal} onChange={e=>setGoal(e.target.value)}>
                                    <option>Hipertrofia</option>
                                    <option>Fuerza</option>
                                    <option>Pérdida de Grasa</option>
                                    <option>Resistencia</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Equipamiento</label>
                                <select className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-500" value={equip} onChange={e=>setEquip(e.target.value)}>
                                    <option>Gimnasio Completo</option>
                                    <option>Mancuernas</option>
                                    <option>Peso Corporal</option>
                                    <option>Casa (Básico)</option>
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nivel</label>
                                    <select className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-500" value={exp} onChange={e=>setExp(e.target.value)}>
                                        <option>Principiante</option>
                                        <option>Intermedio</option>
                                        <option>Avanzado</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Tiempo</label>
                                    <select className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:border-blue-500" value={time} onChange={e=>setTime(e.target.value)}>
                                        <option>30 min</option>
                                        <option>45 min</option>
                                        <option>60 min</option>
                                        <option>90 min</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerateRoutine} 
                            disabled={isGenerating}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 transition-all active:scale-95"
                        >
                            {isGenerating ? <Loader2 className="animate-spin"/> : <Zap className="text-yellow-400" fill="currentColor"/>}
                            {isGenerating ? 'Diseñando Plan...' : 'Generar Plan Completo (10 Monedas)'}
                        </button>
                    </div>
                )}

                {/* ACTIVE ROUTINE DASHBOARD */}
                {activeRoutine && (
                    <div className="animate-in slide-in-from-bottom-5 fade-in space-y-4">
                        
                        {/* Summary Card */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 rounded-3xl text-white shadow-lg relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="font-bold text-xl flex items-center gap-2 mb-1"><Dumbbell size={20}/> {activeRoutine.title}</h3>
                                <p className="text-blue-100 text-xs leading-relaxed italic opacity-90 pr-8">"{activeRoutine.scientificSummary}"</p>
                            </div>
                            <button onClick={() => setActiveRoutine(null)} className="absolute top-4 right-4 text-blue-200 hover:text-white bg-white/10 p-1.5 rounded-full"><Trash2 size={16}/></button>
                        </div>

                        {/* Warmup */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                             <h4 className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-3 flex items-center gap-1"><Activity size={12}/> Calentamiento</h4>
                             <div className="flex flex-wrap gap-2">
                                 {activeRoutine.warmup.map((w, i) => (
                                     <span key={i} className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">{w}</span>
                                 ))}
                             </div>
                        </div>

                        {/* Exercises List */}
                        <div className="space-y-3">
                             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Bloque Principal</h4>
                             {activeRoutine.exercises.map((ex) => (
                                 <div key={ex.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                                     <div className="flex justify-between items-start">
                                         <div>
                                             <h5 className="font-bold text-slate-800">{ex.name}</h5>
                                             <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                                 <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">{ex.sets} Series</span>
                                                 <span>x</span>
                                                 <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">{ex.reps} Reps</span>
                                             </div>
                                         </div>
                                         {ex.notes && (
                                            <div className="text-slate-400" title={ex.notes}><Info size={16}/></div>
                                         )}
                                     </div>
                                     
                                     {/* Note */}
                                     {ex.notes && <p className="text-[10px] text-slate-400 italic leading-tight bg-slate-50 p-2 rounded-lg border border-slate-100">{ex.notes}</p>}

                                     {/* Interactive Sets Bubbles */}
                                     <div className="flex gap-2 mt-1">
                                         {Array.from({ length: ex.sets }).map((_, i) => (
                                             <button 
                                                key={i} 
                                                onClick={() => toggleSet(ex.id, i)}
                                                className={`h-10 flex-1 rounded-xl border-2 flex items-center justify-center transition-all active:scale-95 ${
                                                    i < ex.completedSets 
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' 
                                                    : 'bg-white border-slate-200 text-slate-300 hover:border-blue-300'
                                                }`}
                                             >
                                                 <span className="text-xs font-bold">{i + 1}</span>
                                             </button>
                                         ))}
                                     </div>
                                 </div>
                             ))}
                        </div>

                         {/* Cooldown */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                             <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-3 flex items-center gap-1"><Clock size={12}/> Enfriamiento</h4>
                             <div className="flex flex-wrap gap-2">
                                 {activeRoutine.cooldown.map((w, i) => (
                                     <span key={i} className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">{w}</span>
                                 ))}
                             </div>
                        </div>

                        <button onClick={handleFinishRoutine} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-xl shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all mb-10">
                            Finalizar Entrenamiento
                        </button>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default TrainerView;
