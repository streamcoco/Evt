
import React, { useState, useEffect } from 'react';
import { Play, X, TreePine, AlertTriangle, Wind, Leaf, CheckCircle2, Target } from 'lucide-react';
import { ForestSession, TreeType, Task } from '../types';
import { sendNotification } from '../services/notificationService';

interface FocusGardenViewProps {
  forestHistory: ForestSession[];
  unlockedTrees: TreeType[];
  tasks: Task[]; // Received for linking focus to tasks
  onSessionComplete: (session: ForestSession, reward: number) => void;
  onSessionFailed: (penalty: number) => void;
  onExit: () => void;
}

const FocusGardenView: React.FC<FocusGardenViewProps> = ({ forestHistory, unlockedTrees, tasks, onSessionComplete, onSessionFailed, onExit }) => {
  const [selectedTreeId, setSelectedTreeId] = useState<string>(unlockedTrees[0]?.id || 'tree_pine');
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  // Derived
  const selectedTree = unlockedTrees.find(t => t.id === selectedTreeId) || unlockedTrees[0];
  const focusTask = tasks.find(t => t.id === selectedTaskId);

  // Filter only incomplete tasks for focus
  const pendingTasks = tasks.filter(t => !t.completed);

  useEffect(() => {
    let interval: any;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      completeSession();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const startSession = () => {
    setTimeLeft(duration * 60);
    setIsRunning(true);
    setIsLocked(true);
  };

  const completeSession = () => {
    setIsRunning(false);
    setIsLocked(false);
    // Base reward: 2 credits per minute
    let reward = duration * 2;
    
    // Bonus for linking a task
    if (selectedTaskId) {
        reward += 10; // Bonus for specific intention
    }

    const newSession: ForestSession = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        durationMinutes: duration,
        treeId: selectedTree.id,
        status: 'completed'
    };
    onSessionComplete(newSession, reward);
    sendNotification("¡Árbol Cultivado!", `Sesión completada. Has ganado ${reward} créditos.`);
  };

  const giveUp = () => {
      const penalty = duration;
      if (confirm(`¿Rendirse? Tu árbol morirá y perderás ${penalty} créditos.`)) {
          setIsRunning(false);
          setIsLocked(false);
          onSessionFailed(penalty);
      }
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- LOCKED STATE (Deep Focus UI) ---
  if (isLocked) {
      return (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white p-6 bg-slate-900 overflow-hidden">
              {/* Subtle Animated Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-slate-900 to-indigo-900/40 animate-pulse" style={{ animationDuration: '10s' }}></div>
              
              <div className="z-10 flex flex-col items-center w-full max-w-md relative">
                  
                  {/* Focus Intention */}
                  {focusTask ? (
                      <div className="absolute -top-32 w-full text-center animate-in slide-in-from-top-10 duration-1000">
                          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-2 block">Tu Objetivo</span>
                          <h2 className="text-xl font-medium text-white leading-relaxed px-4">"{focusTask.text}"</h2>
                      </div>
                  ) : (
                      <div className="absolute -top-24 w-full text-center text-slate-400 text-sm tracking-widest uppercase">Enfoque Libre</div>
                  )}

                  {/* Breathing Tree Animation */}
                  <div className="mb-12 text-center relative mt-10">
                       <div className="absolute inset-0 bg-emerald-500/10 blur-[60px] rounded-full animate-pulse"></div>
                       <div className="text-9xl animate-bounce drop-shadow-2xl relative z-10 filter brightness-110 duration-[3000ms]">
                           {selectedTree?.emoji}
                       </div>
                  </div>
                  
                  <div className="text-center mb-16">
                      <div className="text-8xl font-thin font-mono tracking-tighter drop-shadow-lg text-white">
                          {formatTime(timeLeft)}
                      </div>
                      <div className="text-sm text-slate-400 mt-4 flex items-center justify-center gap-2">
                          <Leaf size={14} className="text-emerald-500"/> Creciendo...
                      </div>
                  </div>

                  <button 
                    onClick={giveUp} 
                    className="group flex items-center gap-2 px-6 py-2 rounded-full border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all text-xs font-medium text-slate-500 hover:text-red-300"
                  >
                      <AlertTriangle size={14}/> Rendirse
                  </button>
              </div>
          </div>
      );
  }

  // --- CONFIG STATE (Setup UI) ---
  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative">
       {/* Header */}
       <div className="p-4 flex justify-between items-center bg-white shadow-sm z-10">
           <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800">
               <TreePine className="text-emerald-600" size={20}/> Vivero Mental
           </h2>
           <button onClick={onExit} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"><X size={20}/></button>
       </div>

       <div className="flex-1 overflow-y-auto w-full px-4 pb-28 pt-4">
           
           {/* Main Configuration Card */}
           <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 mb-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
               
               {/* 1. Tree Selection */}
               <div className="mb-8">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block px-1">1. Elige tu semilla</label>
                   <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                       {unlockedTrees.map(tree => (
                           <button 
                             key={tree.id} 
                             onClick={() => { setSelectedTreeId(tree.id); }}
                             className={`flex-shrink-0 flex flex-col items-center justify-center w-20 h-24 rounded-2xl transition-all border-2 ${selectedTreeId === tree.id ? 'bg-emerald-50 border-emerald-500 shadow-md transform -translate-y-1' : 'bg-slate-50 border-transparent opacity-60 hover:opacity-80'}`}
                           >
                               <span className="text-3xl mb-1">{tree.emoji}</span>
                               <span className="text-[9px] font-bold text-slate-600 truncate w-full text-center px-1">{tree.name}</span>
                           </button>
                       ))}
                   </div>
               </div>

               {/* 2. Task Linking */}
               <div className="mb-8">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block px-1">2. Define tu intención</label>
                   <div className="relative">
                       <select 
                           value={selectedTaskId} 
                           onChange={(e) => setSelectedTaskId(e.target.value)}
                           className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none"
                       >
                           <option value="">🌱 Enfoque Libre (Sin tarea específica)</option>
                           {pendingTasks.map(t => (
                               <option key={t.id} value={t.id}>📝 {t.text}</option>
                           ))}
                       </select>
                       <Target className="absolute left-3 top-4 text-emerald-500" size={16}/>
                       <div className="absolute right-3 top-4 pointer-events-none text-slate-400">▼</div>
                   </div>
               </div>

               {/* 3. Duration */}
               <div className="mb-6">
                   <div className="flex justify-between items-end mb-4 px-1">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">3. Tiempo de Cultivo</label>
                       <div className="text-right">
                           <span className="text-4xl font-bold text-slate-800">{duration}</span>
                           <span className="text-sm text-slate-400 font-medium ml-1">min</span>
                       </div>
                   </div>
                   
                   <input 
                     type="range" 
                     min="10" 
                     max="45" 
                     step="5" 
                     value={duration} 
                     onChange={e => setDuration(parseInt(e.target.value))}
                     className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                   />
                   <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium uppercase">
                       <span>10 min</span>
                       <span>45 min (Máx)</span>
                   </div>
               </div>

               <div className="bg-emerald-50/50 rounded-xl p-3 mb-6 flex justify-between items-center text-xs text-emerald-800 border border-emerald-100">
                   <span className="flex items-center gap-1"><Wind size={14}/> Recompensa estimada:</span>
                   <span className="font-bold">+{duration * 2 + (selectedTaskId ? 10 : 0)} Créditos</span>
               </div>

               <button 
                 onClick={startSession}
                 className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
               >
                   <Play size={20} fill="currentColor"/> Plantar Ahora
               </button>
           </div>

           {/* Recent Garden */}
           <div className="mb-4">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 px-2">Historial Reciente</h3>
               <div className="grid grid-cols-6 gap-2">
                   {forestHistory.slice(-12).reverse().map((session, i) => {
                       const tree = unlockedTrees.find(t => t.id === session.treeId);
                       if (session.status === 'failed') {
                           return (
                               <div key={i} className="aspect-square flex items-center justify-center bg-red-50 rounded-xl text-lg opacity-50 grayscale border border-red-100" title="Árbol muerto">🥀</div>
                           );
                       }
                       return (
                           <div key={i} className="aspect-square flex items-center justify-center bg-white rounded-xl text-lg shadow-sm border border-slate-100 animate-in zoom-in" style={{ animationDelay: `${i*50}ms` }}>
                               {tree?.emoji || '🌲'}
                           </div>
                       );
                   })}
                   {Array.from({ length: Math.max(0, 12 - forestHistory.length) }).map((_, i) => (
                       <div key={`empty-${i}`} className="aspect-square bg-slate-100/30 rounded-xl border border-slate-100 border-dashed"></div>
                   ))}
               </div>
           </div>
       </div>
    </div>
  );
};

export default FocusGardenView;
