
import React, { useState } from 'react';
import { DailyStats, Habit, Task, Challenge } from '../types';
import { TrendingUp, AlertTriangle, Award, Target, Loader2, Check, X, Plus, Coins } from 'lucide-react';
import { generateChallenges } from '../services/geminiService';

interface StatsViewProps {
  stats: DailyStats[];
  habits: Habit[];
  tasks: Task[];
  challenges: Challenge[];
  userGoals: string;
  onAddChallenges: (challenges: Challenge[]) => void;
  onCompleteChallenge: (id: string) => void;
  onDeductCredits: (amount: number) => boolean;
}

const StatsView: React.FC<StatsViewProps> = ({ stats, habits, tasks, challenges, userGoals, onAddChallenges, onCompleteChallenge, onDeductCredits }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposedChallenges, setProposedChallenges] = useState<Challenge[]>([]);

  // Calculations
  const averageDiscipline = stats.length > 0 
    ? Math.round(stats.reduce((acc, s) => acc + s.disciplineScore, 0) / stats.length) 
    : 0;

  const weeklyStats = stats.slice(-7);
  const chartData = [...weeklyStats];
  while (chartData.length < 7) {
      chartData.unshift({ date: '', weight: 0, taskCompletionRate: 0, habitCompletionRate: 0, caloriesConsumed: 0, caloriesBurned: 0, disciplineScore: 0 });
  }

  const handleGenerate = async () => {
      if (!onDeductCredits(5)) return;
      setIsGenerating(true);
      try {
          const newChallengesData = await generateChallenges(userGoals || "Mejorar salud y productividad");
          const newChallenges: Challenge[] = newChallengesData.map(c => ({
              ...c,
              id: crypto.randomUUID(),
              completed: false,
              deadline: Date.now() + (c.durationDays * 24 * 60 * 60 * 1000)
          }));
          setProposedChallenges(newChallenges);
      } finally {
          setIsGenerating(false);
      }
  };

  const acceptChallenge = (challenge: Challenge) => {
      onAddChallenges([challenge]);
      setProposedChallenges(prev => prev.filter(c => c.id !== challenge.id));
  };

  const discardChallenge = (id: string) => {
      setProposedChallenges(prev => prev.filter(c => c.id !== id));
  };

  const activeChallenges = challenges.filter(c => !c.completed && c.deadline > Date.now());

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-28 p-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Award className="text-indigo-600"/> Resumen Estadístico
      </h2>

      {/* Main Score Card */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
          <div className="relative z-10">
              <div className="text-slate-400 text-sm uppercase tracking-wider mb-1">Índice de Disciplina</div>
              <div className="text-5xl font-bold flex items-baseline gap-2">
                  {averageDiscipline}<span className="text-2xl text-slate-500">/100</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Basado en cumplimiento de tareas y hábitos.</p>
          </div>
      </div>

      {/* Challenges Section */}
      <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-slate-700 flex items-center gap-2"><Target size={18}/> Desafíos IA</h3>
             <button 
                onClick={handleGenerate} 
                disabled={isGenerating} 
                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-full font-bold disabled:opacity-50 flex items-center gap-1 shadow-sm"
             >
                 {isGenerating ? <Loader2 className="animate-spin" size={12}/> : <Plus size={12}/>} Generar (-5)
             </button>
          </div>

          {/* PROPOSED CHALLENGES UI */}
          {proposedChallenges.length > 0 && (
              <div className="mb-4 space-y-3">
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Propuestas (Elige las que quieras)</div>
                  {proposedChallenges.map(c => (
                      <div key={c.id} className="bg-white p-4 rounded-xl border-2 border-dashed border-indigo-200 shadow-sm relative animate-in zoom-in">
                           <h4 className="font-bold text-slate-800 text-sm">{c.title}</h4>
                           <p className="text-xs text-slate-500 mt-1 mb-3">{c.description}</p>
                           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-3">
                               <span>{c.durationDays} días</span> • <span>+{c.rewardCredits} Monedas</span>
                           </div>
                           <div className="flex gap-2">
                               <button onClick={() => acceptChallenge(c)} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-700">Aceptar</button>
                               <button onClick={() => discardChallenge(c.id)} className="px-3 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200"><X size={14}/></button>
                           </div>
                      </div>
                  ))}
              </div>
          )}

          <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Activos</div>
              {activeChallenges.length > 0 ? activeChallenges.map(c => (
                  <div key={c.id} className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.type === 'health' ? 'bg-emerald-500' : c.type === 'learning' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                      <div className="flex justify-between items-start">
                          <div className="pl-2">
                              <h4 className="font-bold text-slate-800 text-sm">{c.title}</h4>
                              <p className="text-xs text-slate-500 mt-1">{c.description}</p>
                              <div className="flex gap-2 mt-2">
                                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                                      {Math.ceil((c.deadline - Date.now()) / (1000 * 60 * 60 * 24))} días restantes
                                  </span>
                                  <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                      <Coins size={10} className="fill-yellow-500"/> +{c.rewardCredits}
                                  </span>
                              </div>
                          </div>
                          <button onClick={() => onCompleteChallenge(c.id)} className="bg-emerald-100 text-emerald-600 p-2 rounded-full hover:bg-emerald-200">
                              <Check size={16} strokeWidth={3} />
                          </button>
                      </div>
                  </div>
              )) : (
                  <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                      No tienes desafíos activos.
                  </div>
              )}
          </div>
      </div>

      {/* Discipline Trend Chart */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 mb-6">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><TrendingUp size={18}/> Tendencia Semanal</h3>
          <div className="h-40 flex items-end justify-between gap-2">
              {chartData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden" style={{ height: '120px' }}>
                          <div 
                              className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-700 ${d.disciplineScore > 80 ? 'bg-emerald-500' : d.disciplineScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                              style={{ height: `${d.disciplineScore}%` }}
                          ></div>
                      </div>
                      <span className="text-[9px] text-slate-400">{d.date ? d.date.slice(5) : '-'}</span>
                  </div>
              ))}
          </div>
      </div>

      {/* Failure Analysis */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 mb-6">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-orange-500"/> Análisis de Fallos</h3>
          <div className="space-y-3">
              {habits.filter(h => h.streak === 0).length > 0 ? (
                  habits.filter(h => h.streak === 0).map(h => (
                      <div key={h.id} className="flex items-center justify-between text-sm p-2 bg-red-50 rounded-lg text-red-700">
                          <span className="flex items-center gap-2">{h.icon} {h.label}</span>
                          <span className="font-bold text-xs">Atención</span>
                      </div>
                  ))
              ) : (
                  <div className="text-center text-emerald-600 text-sm py-2">¡Excelente! Mantienes la racha en todos tus hábitos.</div>
              )}
          </div>
      </div>
    </div>
  );
};

export default StatsView;
