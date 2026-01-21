
import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, Zap, CircleDollarSign, ListTodo, Play, Pause, X, Timer } from 'lucide-react';
import { Task, Difficulty } from '../types';
import { sendNotification } from '../services/notificationService';

interface TaskViewProps {
  tasks: Task[];
  onAddTask: (text: string, difficulty: Difficulty) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onFocusComplete: (minutes: number) => void; // Reward logic
}

const TaskView: React.FC<TaskViewProps> = ({ tasks, onAddTask, onToggleTask, onDeleteTask, onFocusComplete }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  
  // Focus Mode State
  const [focusMode, setFocusMode] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
      let interval: any;
      if (isTimerRunning && timeLeft > 0) {
          interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
      } else if (timeLeft === 0 && isTimerRunning) {
          setIsTimerRunning(false);
          sendNotification("Sesión Focus Terminada", "¡Excelente trabajo! Tómate un descanso.");
          onFocusComplete(25);
          setFocusMode(false); // Exit focus mode
      }
      return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const handleAdd = () => {
    if (!newTaskText.trim()) return;
    onAddTask(newTaskText, difficulty);
    setNewTaskText('');
  };

  const startFocus = (taskId: string) => {
      setActiveTaskId(taskId);
      setTimeLeft(25 * 60); // 25 min Pomodoro
      setFocusMode(true);
      setIsTimerRunning(true);
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- OVERLAY: FOCUS MODE (Neuroscience: Eliminate Visual Clutter) ---
  if (focusMode) {
      const activeTask = tasks.find(t => t.id === activeTaskId);
      return (
          <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center text-white p-6">
              <div className="absolute top-6 right-6">
                  <button onClick={() => setFocusMode(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><X/></button>
              </div>
              
              <div className="mb-8 text-center animate-pulse">
                  <div className="text-xs uppercase tracking-[0.3em] text-indigo-400 mb-2">Modo Flujo</div>
                  <h2 className="text-2xl font-bold max-w-xs mx-auto leading-relaxed">
                      "{activeTask?.text}"
                  </h2>
              </div>

              <div className="relative w-64 h-64 flex items-center justify-center mb-10">
                  {/* Visual Timer Ring */}
                  <svg className="w-full h-full transform -rotate-90">
                      <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                      <circle 
                        cx="128" cy="128" r="120" 
                        stroke="currentColor" strokeWidth="8" fill="transparent" 
                        className="text-indigo-500 transition-all duration-1000 ease-linear"
                        strokeDasharray={2 * Math.PI * 120}
                        strokeDashoffset={2 * Math.PI * 120 * (1 - timeLeft / (25 * 60))}
                      />
                  </svg>
                  <div className="absolute text-6xl font-mono font-bold tracking-tighter">
                      {formatTime(timeLeft)}
                  </div>
              </div>

              <div className="flex gap-6">
                  <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="p-6 bg-white text-slate-900 rounded-full hover:scale-105 transition-transform shadow-lg shadow-indigo-500/20">
                      {isTimerRunning ? <Pause size={32} fill="currentColor"/> : <Play size={32} fill="currentColor"/>}
                  </button>
              </div>
              
              <p className="mt-8 text-slate-500 text-sm italic max-w-xs text-center">
                  "La multitarea es un mito. Una cosa a la vez."
              </p>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-28 p-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <ListTodo className="text-indigo-600"/> Tareas del Día
      </h2>

      {/* Input Area */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
          <input 
            className="w-full p-3 rounded-lg border border-slate-200 mb-3 focus:outline-none focus:border-indigo-500" 
            placeholder="¿Qué necesitas hacer hoy?" 
            value={newTaskText} 
            onChange={e => setNewTaskText(e.target.value)} 
          />
          <div className="flex justify-between items-center">
              <div className="flex gap-2">
                  <button onClick={() => setDifficulty('easy')} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${difficulty === 'easy' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>Fácil</button>
                  <button onClick={() => setDifficulty('medium')} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>Medio</button>
                  <button onClick={() => setDifficulty('hard')} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${difficulty === 'hard' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>Difícil</button>
              </div>
              <button onClick={handleAdd} className="bg-indigo-600 text-white p-2 rounded-lg shadow-md hover:bg-indigo-700">
                  <Plus size={20}/>
              </button>
          </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
          {tasks.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">No hay tareas pendientes. ¡A disfrutar!</p>}
          {tasks.sort((a,b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1)).map(t => (
              <div key={t.id} className={`p-4 rounded-xl shadow-sm border flex items-center gap-3 transition-all ${t.completed ? 'bg-slate-100 border-transparent opacity-60' : 'bg-white border-slate-100'}`}>
                  <button 
                    onClick={() => onToggleTask(t.id)} 
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${t.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 hover:border-indigo-400'}`}
                  >
                      {t.completed && <Check size={14}/>}
                  </button>
                  <div className="flex-1">
                      <div className={`font-medium ${t.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>{t.text}</div>
                      <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              t.difficulty === 'easy' ? 'bg-green-50 text-green-600' :
                              t.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                              'bg-red-50 text-red-600'
                          }`}>
                              {t.difficulty}
                          </span>
                          {!t.completed && <span className="text-[10px] text-yellow-600 flex items-center gap-0.5"><CircleDollarSign size={10}/> +{t.rewardValue}</span>}
                      </div>
                  </div>
                  
                  {!t.completed && (
                      <button onClick={() => startFocus(t.id)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-full" title="Iniciar Modo Focus">
                          <Timer size={20}/>
                      </button>
                  )}

                  <button onClick={() => onDeleteTask(t.id)} className="text-slate-300 hover:text-red-400"><Trash2 size={16}/></button>
              </div>
          ))}
      </div>
    </div>
  );
};

export default TaskView;
