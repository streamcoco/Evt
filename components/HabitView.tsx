
import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Flame, Zap, CircleDollarSign, CheckSquare } from 'lucide-react';
import { Habit, Difficulty } from '../types';
import { suggestEmoji } from '../services/geminiService';

interface HabitViewProps {
  habits: Habit[];
  onAddHabit: (habit: Habit) => void;
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
}

const HabitView: React.FC<HabitViewProps> = ({ habits, onAddHabit, onToggleHabit, onDeleteHabit }) => {
  const [showForm, setShowForm] = useState(false);
  
  // Wizard State
  const [step, setStep] = useState(0);
  const [type, setType] = useState<'good' | 'bad'>('good');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  
  // Atomic Laws
  const [cue, setCue] = useState('');
  const [craving, setCraving] = useState('');
  const [response, setResponse] = useState('');
  const [reward, setReward] = useState('');

  const handleNameBlur = async () => {
    if (name && !icon) {
        const emoji = await suggestEmoji(name);
        setIcon(emoji);
    }
  };

  const createHabit = () => {
      const rewardVal = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 20;
      const newHabit: Habit = {
          id: crypto.randomUUID(),
          label: name,
          completed: false,
          type,
          difficulty,
          rewardValue: rewardVal,
          icon: icon || (type === 'good' ? '🌱' : '🛑'),
          cue, craving, response, reward,
          streak: 0,
          createdAt: Date.now()
      };
      onAddHabit(newHabit);
      resetForm();
  };

  const resetForm = () => {
      setShowForm(false); setStep(0); setName(''); setIcon(''); setCue(''); setCraving(''); setResponse(''); setReward('');
  };

  // Helper to calculate multiplier based on streak
  const getMultiplier = (streak: number) => Math.min(1.5, 1 + (streak * 0.05));

  const renderWizard = () => (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-3xl w-full max-w-sm flex flex-col max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg">Nuevo Hábito</h3>
                {step > 0 && <button onClick={() => setStep(s => s-1)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700"><ArrowLeft size={18}/></button>}
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
                {step === 0 && (
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase mb-2">Tipo de Hábito</p>
                            <div className="flex gap-3">
                                <button onClick={() => setType('good')} className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${type === 'good' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-100 text-slate-400'}`}>Bueno</button>
                                <button onClick={() => setType('bad')} className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${type === 'bad' ? 'bg-red-50 border-red-500 text-red-700' : 'border-slate-100 text-slate-400'}`}>Malo</button>
                            </div>
                        </div>
                        <input className="w-full border-b-2 border-slate-200 p-3 text-xl outline-none focus:border-indigo-500 bg-transparent placeholder-slate-300 font-medium" placeholder="Nombre (Ej: Leer)" value={name} onChange={e => setName(e.target.value)} onBlur={handleNameBlur} />
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase mb-2">Dificultad</p>
                            <div className="flex gap-2">
                                {(['easy','medium','hard'] as Difficulty[]).map(d => (
                                    <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-2 text-xs uppercase font-bold rounded-lg border transition-all ${difficulty === d ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'border-slate-200 text-slate-400'}`}>
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => setStep(1)} disabled={!name} className="w-full bg-indigo-600 text-white py-4 rounded-xl mt-4 font-bold shadow-lg shadow-indigo-200 disabled:opacity-50">Siguiente</button>
                    </div>
                )}
                {step === 1 && (
                    <div className="space-y-4">
                        <h4 className="font-bold text-indigo-600 text-lg">1. Señal</h4>
                        <p className="text-sm text-slate-500">¿Cuándo y dónde lo harás? Hazlo obvio.</p>
                        <textarea className="w-full border p-4 rounded-xl bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-indigo-500" rows={4} value={cue} onChange={e => setCue(e.target.value)} placeholder="Ej: Después de cepillarme los dientes..." />
                        <button onClick={() => setStep(2)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">Siguiente</button>
                    </div>
                )}
                {step === 2 && (
                    <div className="space-y-4">
                        <h4 className="font-bold text-indigo-600 text-lg">2. Anhelo</h4>
                        <p className="text-sm text-slate-500">¿Cómo hacerlo atractivo?</p>
                        <textarea className="w-full border p-4 rounded-xl bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-indigo-500" rows={4} value={craving} onChange={e => setCraving(e.target.value)} />
                        <button onClick={() => setStep(3)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">Siguiente</button>
                    </div>
                )}
                {step === 3 && (
                    <div className="space-y-4">
                        <h4 className="font-bold text-indigo-600 text-lg">3. Respuesta</h4>
                        <p className="text-sm text-slate-500">¿Cómo hacerlo sencillo? (Regla de los 2 minutos)</p>
                        <textarea className="w-full border p-4 rounded-xl bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-indigo-500" rows={4} value={response} onChange={e => setResponse(e.target.value)} />
                        <button onClick={() => setStep(4)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">Siguiente</button>
                    </div>
                )}
                {step === 4 && (
                    <div className="space-y-4">
                        <h4 className="font-bold text-indigo-600 text-lg">4. Recompensa</h4>
                        <p className="text-sm text-slate-500">¿Cómo hacerlo satisfactorio?</p>
                        <textarea className="w-full border p-4 rounded-xl bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-indigo-500" rows={4} value={reward} onChange={e => setReward(e.target.value)} />
                        <button onClick={createHabit} className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold mt-4 shadow-lg shadow-emerald-200">Crear Hábito</button>
                    </div>
                )}
            </div>
            <button onClick={resetForm} className="w-full py-4 text-slate-400 border-t font-medium text-sm hover:bg-slate-50">Cancelar</button>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-28">
      {showForm && renderWizard()}
      
      {/* HEADER */}
      <div className="bg-slate-900 text-white p-6 rounded-b-3xl shadow-lg mb-6 relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full blur-3xl opacity-20"></div>
          <div className="flex justify-between items-center relative z-10">
              <h2 className="text-2xl font-bold flex items-center gap-2"><CheckSquare size={24} className="text-orange-400"/> Hábitos</h2>
              <button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full shadow-lg transition-transform active:scale-95 border border-indigo-400/50">
                  <Plus size={24}/>
              </button>
          </div>
      </div>

      <div className="px-4 space-y-4">
          {habits.map(h => {
              const multiplier = getMultiplier(h.streak);
              return (
                <div key={h.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="text-4xl bg-slate-50 p-2 rounded-xl">{h.icon}</div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">{h.label}</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className={`text-[10px] px-2 py-1 rounded-md flex items-center gap-1 font-bold ${h.streak > 0 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                                        <Flame size={12} className={h.streak > 0 ? 'fill-orange-500' : ''}/> {h.streak} días
                                    </span>
                                    <span className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-1 rounded-md flex items-center gap-1 font-bold">
                                        <CircleDollarSign size={12}/> +{Math.round(h.rewardValue * multiplier)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => onDeleteHabit(h.id)} className="text-slate-300 hover:text-red-400 p-2"><Trash2 size={18}/></button>
                    </div>
                    
                    {/* Laws Hint */}
                    {h.cue && (
                        <div className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                            "{h.cue}"
                        </div>
                    )}

                    <button 
                        onClick={() => onToggleHabit(h.id)}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 ${
                            h.completed 
                                ? 'bg-emerald-100 text-emerald-700 cursor-default shadow-none border border-emerald-200' 
                                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-300'
                        }`}
                    >
                        {h.completed ? '¡Completado Hoy!' : 'Marcar Completado'}
                    </button>
                </div>
            )
          })}
          {habits.length === 0 && (
              <div className="text-center text-slate-400 py-10">
                  <p>Sin hábitos definidos.</p>
                  <p className="text-xs mt-2 opacity-70">"La calidad de tu vida depende de la calidad de tus hábitos."</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default HabitView;
