
import React, { useState } from 'react';
import { Skill, SkillMilestone } from '../types';
import { generateSkillPlan, generateSkillChallenge } from '../services/geminiService';
import { Plus, Zap, CheckCircle2, ChevronRight, Trophy, Loader2, Brain } from 'lucide-react';

interface SkillsViewProps {
  skills: Skill[];
  onAddSkill: (skill: Skill) => void;
  onUpdateSkill: (skill: Skill) => void;
  onGainXp: (amount: number) => void;
  onDeductCredits: (amount: number) => boolean;
}

const SkillsView: React.FC<SkillsViewProps> = ({ skills, onAddSkill, onUpdateSkill, onGainXp, onDeductCredits }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);

  const activeSkill = skills.find(s => s.id === activeSkillId);

  const handleCreateSkill = async () => {
    if (!newSkillName) return;
    
    if (!onDeductCredits(15)) return; // Cost for Skill Plan

    setIsAiLoading(true);
    try {
        const milestones = await generateSkillPlan(newSkillName, 1);
        const newSkill: Skill = {
            id: crypto.randomUUID(),
            name: newSkillName,
            level: 1,
            currentXp: 0,
            nextLevelXp: 500,
            milestones: milestones,
            createdAt: Date.now()
        };
        onAddSkill(newSkill);
        setNewSkillName('');
        setIsCreating(false);
    } finally {
        setIsAiLoading(false);
    }
  };

  const handleGenerateNewMilestones = async () => {
    if(!activeSkill) return;
    if (!onDeductCredits(10)) return;
    setIsAiLoading(true);
    try {
        const newMilestones = await generateSkillPlan(activeSkill.name, activeSkill.level);
        onUpdateSkill({ ...activeSkill, milestones: [...activeSkill.milestones, ...newMilestones] });
    } finally {
        setIsAiLoading(false);
    }
  };

  const handleCompleteMilestone = (milestoneId: string) => {
    if (!activeSkill) return;
    const milestone = activeSkill.milestones.find(m => m.id === milestoneId);
    if (!milestone || milestone.completed) return;

    const updatedMilestones = activeSkill.milestones.map(m => m.id === milestoneId ? { ...m, completed: true } : m);
    
    const xpGained = milestone.xpValue;
    let newXp = activeSkill.currentXp + xpGained;
    let newLevel = activeSkill.level;
    let nextXp = activeSkill.nextLevelXp;

    if (newXp >= nextXp) {
        newLevel++;
        newXp = newXp - nextXp;
        nextXp = Math.round(nextXp * 1.5); // Increase difficulty
    }

    onUpdateSkill({
        ...activeSkill,
        currentXp: newXp,
        level: newLevel,
        nextLevelXp: nextXp,
        milestones: updatedMilestones
    });
    
    onGainXp(xpGained);
  };

  const generateDailyChallenge = async () => {
      if (!activeSkill) return;
      if (!onDeductCredits(2)) return;
      setIsAiLoading(true);
      try {
          const challenge = await generateSkillChallenge(activeSkill.name, activeSkill.level);
          onUpdateSkill({ ...activeSkill, aiChallenge: challenge });
      } finally {
          setIsAiLoading(false);
      }
  };

  // --- RENDER LIST ---
  if (!activeSkill) {
      return (
        <div className="flex flex-col h-full bg-slate-50 p-4 pb-28 overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Brain className="text-purple-600"/> Árbol de Habilidades
            </h2>

            {isCreating ? (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100 mb-4 animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-bold text-slate-700 mb-2">Nueva Habilidad (15 Créd)</h3>
                    <input 
                        className="w-full p-3 border rounded-xl mb-3" 
                        placeholder="Ej: Tocar Guitarra, Python..." 
                        value={newSkillName}
                        onChange={e => setNewSkillName(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setIsCreating(false)} className="flex-1 py-3 text-slate-500 font-bold bg-slate-100 rounded-xl">Cancelar</button>
                        <button onClick={handleCreateSkill} disabled={isAiLoading} className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                            {isAiLoading ? <Loader2 className="animate-spin"/> : 'Generar Plan IA'}
                        </button>
                    </div>
                </div>
            ) : (
                <button onClick={() => setIsCreating(true)} className="w-full bg-white border-2 border-dashed border-purple-200 text-purple-600 font-bold py-4 rounded-xl mb-6 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2">
                    <Plus size={20}/> Aprender Nueva Habilidad
                </button>
            )}

            <div className="space-y-4">
                {skills.map(skill => (
                    <div key={skill.id} onClick={() => setActiveSkillId(skill.id)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group cursor-pointer active:scale-[0.99] transition-transform">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">{skill.name}</h3>
                                <div className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded inline-block">Nivel {skill.level}</div>
                            </div>
                            <ChevronRight className="text-slate-300 group-hover:text-purple-500 transition-colors"/>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full rounded-full transition-all duration-700" style={{ width: `${(skill.currentXp / skill.nextLevelXp) * 100}%` }}></div>
                        </div>
                        <div className="text-right text-[10px] text-slate-400 mt-1">{skill.currentXp} / {skill.nextLevelXp} XP</div>
                    </div>
                ))}
            </div>
        </div>
      );
  }

  // --- RENDER DETAIL ---
  const activeMilestones = activeSkill.milestones.filter(m => !m.completed);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
        <div className="bg-white p-4 border-b flex items-center gap-2">
            <button onClick={() => setActiveSkillId(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><ChevronRight className="rotate-180" size={20}/></button>
            <h2 className="font-bold text-lg text-slate-800">{activeSkill.name}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-28">
            {/* Header Card */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="text-sm text-slate-400 uppercase tracking-wider">Nivel Actual</div>
                        <div className="text-5xl font-bold">{activeSkill.level}</div>
                    </div>
                    <Trophy size={48} className="text-yellow-400"/>
                </div>
                <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1 text-slate-300">
                        <span>Progreso</span>
                        <span>{activeSkill.currentXp}/{activeSkill.nextLevelXp} XP</span>
                    </div>
                    <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-400 h-full transition-all duration-700" style={{ width: `${(activeSkill.currentXp / activeSkill.nextLevelXp) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            {/* AI Challenge */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-xl text-white shadow-md mb-6">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold flex items-center gap-2"><Zap size={18} className="text-yellow-300"/> Desafío IA</h3>
                    <button onClick={generateDailyChallenge} disabled={isAiLoading} className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30">
                        {isAiLoading ? <Loader2 size={12} className="animate-spin"/> : 'Generar (-2)'}
                    </button>
                </div>
                <p className="text-sm font-medium leading-relaxed opacity-90">
                    {activeSkill.aiChallenge || "Genera un desafío para practicar hoy."}
                </p>
            </div>

            {/* Milestones Plan */}
            <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Tareas Nivel {activeSkill.level}</h3>
                <button onClick={handleGenerateNewMilestones} disabled={isAiLoading} className="text-xs text-purple-600 font-bold flex items-center gap-1">
                    {isAiLoading ? <Loader2 size={12} className="animate-spin"/> : <Plus size={12}/>} Tareas (-10)
                </button>
            </div>

            <div className="space-y-3">
                {activeSkill.milestones.sort((a,b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1)).map((m, idx) => (
                    <div key={m.id} className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${m.completed ? 'bg-emerald-50 border-emerald-100 opacity-60' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <button 
                            onClick={() => handleCompleteMilestone(m.id)}
                            disabled={m.completed}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${m.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-emerald-400'}`}
                        >
                            <CheckCircle2 size={14} fill={m.completed ? "currentColor" : "none"}/>
                        </button>
                        <div className="flex-1">
                            <div className={`text-sm font-medium ${m.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{m.label}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-1">+{m.xpValue} XP</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default SkillsView;
