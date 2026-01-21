
import React, { useState } from 'react';
import { UserProfile, AgentSuggestion, Challenge } from '../types';
import { Sparkles, Book, ListTodo, CheckSquare, DollarSign, GraduationCap, Brain, Lock, Trophy, X, ShoppingBag as ShopIcon, Dumbbell, MessageSquare, Award, TreePine, Target, Utensils, Coins } from 'lucide-react';
import { playSound } from '../services/soundService';

interface HomeDashboardViewProps {
  profile: UserProfile;
  suggestions: AgentSuggestion[];
  onNavigate: (tab: string) => void;
  godMode: boolean; // Kept in interface for TS compatibility but ignored
  toggleGodMode: () => void;
  activeChallenges: Challenge[]; 
}

// Export for App.tsx to use in Level Up Modal
export const LEVEL_UNLOCKS = [
    { level: 1, label: 'Sistema Básico & Entrenador' },
    { level: 2, label: 'Habilidades & Finanzas' },
    { level: 3, label: 'Flashcards & Gestor Neural' },
    { level: 4, label: 'Consumibles & Entreno Pro' },
    { level: 5, label: 'Vivero Avanzado' },
];

const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({ profile, suggestions, onNavigate, activeChallenges }) => {
  const [showLevelMenu, setShowLevelMenu] = useState(false);

  // --- RPG CALCS ---
  const level = Math.floor(profile.totalXp / 1000) + 1;
  const currentLevelXp = profile.totalXp % 1000;
  const nextLevelXp = 1000;
  const progressPercent = (currentLevelXp / nextLevelXp) * 100;

  const isUnlocked = (reqLevel: number) => level >= reqLevel;

  const handleNavigation = (id: string, reqLevel: number) => {
      playSound('click');
      if (isUnlocked(reqLevel)) {
          onNavigate(id);
      } else {
          alert(`🔒 OPCIÓN BLOQUEADA\n\nNecesitas alcanzar el Nivel ${reqLevel} para acceder a esta función.\n\nSigue completando tareas y hábitos para ganar XP.`);
      }
  };

  const MenuButton = ({ id, icon: Icon, label, reqLevel, colorClass, bgClass }: any) => {
      const unlocked = isUnlocked(reqLevel);
      return (
        <button 
            onClick={() => handleNavigation(id, reqLevel)} 
            className={`rounded-2xl border shadow-sm transition-all duration-200 flex flex-col items-center justify-center gap-2 group relative h-28 w-full ${unlocked ? 'bg-white hover:scale-[1.02] hover:shadow-md cursor-pointer' : 'bg-slate-50 opacity-70 cursor-not-allowed'}`}
        >
            {!unlocked && <div className="absolute top-2 right-2 text-slate-400"><Lock size={14}/></div>}
            <div className={`p-4 rounded-full transition-transform ${unlocked ? bgClass + ' ' + colorClass + ' group-hover:scale-110' : 'bg-slate-200 text-slate-400'}`}>
                <Icon size={28}/>
            </div>
            <span className={`font-bold text-sm ${unlocked ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
            {!unlocked && <span className="absolute bottom-2 text-[9px] font-bold text-slate-400 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded-full">Nivel {reqLevel}</span>}
        </button>
      );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
        
        {/* MODAL: LEVEL PROGRESSION */}
        {showLevelMenu && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6 animate-in fade-in backdrop-blur-sm">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-8 text-white relative shadow-2xl">
                    <button onClick={() => setShowLevelMenu(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"><X size={20}/></button>
                    <div className="text-center mb-8">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-5xl font-bold mx-auto mb-4 shadow-[0_0_30px_rgba(99,102,241,0.6)] ring-4 ring-slate-800">
                            {level}
                        </div>
                        <h2 className="text-2xl font-bold">Nivel de Usuario</h2>
                        <div className="text-slate-400 text-sm mt-1 font-mono">{profile.totalXp} XP Totales</div>
                    </div>
                    
                    <div className="mb-8">
                        <div className="flex justify-between text-xs font-bold text-indigo-300 mb-2 uppercase tracking-wider">
                            <span>Progreso Nivel {level}</span>
                            <span>{currentLevelXp} / {nextLevelXp} XP</span>
                        </div>
                        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Sistema de Desbloqueos</h3>
                        {LEVEL_UNLOCKS.map((u, i) => (
                            <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${level >= u.level ? 'bg-indigo-900/30 border-indigo-500/50' : 'bg-slate-800/50 border-slate-700/50 opacity-60'}`}>
                                {level >= u.level ? <Trophy size={20} className="text-yellow-400"/> : <Lock size={20} className="text-slate-500"/>}
                                <div className="text-sm font-medium text-white">{u.label}</div>
                                <div className="ml-auto text-xs font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded">Lv {u.level}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* TOP BAR: BIGGER & MORE AESTHETIC LEVEL BAR */}
        <div className="bg-white/95 backdrop-blur-md px-6 py-6 border-b border-slate-100 shadow-sm flex justify-between items-center z-20 sticky top-0">
             <button onClick={() => setShowLevelMenu(true)} className="flex-1 mr-6 active:scale-95 transition-transform group">
                 <div className="flex justify-between items-end mb-2">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-slate-100">{level}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nivel Actual</div>
                     </div>
                     <div className="text-[10px] font-bold text-indigo-600">{currentLevelXp} / {nextLevelXp} XP</div>
                 </div>
                 
                 <div className="w-full h-6 bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative shadow-inner">
                     <div 
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-1000 flex items-center justify-end px-2" 
                        style={{ width: `${progressPercent}%` }}
                     >
                         {/* Shine effect */}
                         <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/30 blur-[2px]"></div>
                         {progressPercent > 10 && <span className="text-[9px] font-bold text-white drop-shadow-md">{Math.floor(progressPercent)}%</span>}
                     </div>
                 </div>
             </button>
             
             {/* Shop Link Enabled - Clean Balance View */}
             <button onClick={() => onNavigate('shop')} className="flex items-center gap-2 active:scale-95 transition-transform">
                 <span className="text-3xl font-black text-slate-800 tracking-tight">{profile.credits}</span>
                 <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-200 border-2 border-white ring-2 ring-yellow-100">
                    <Coins size={20} className="text-white fill-white"/>
                 </div>
             </button>
        </div>

        {/* MAIN LAYOUT: SCROLLABLE GRID */}
        <div className="flex-1 overflow-y-auto p-5 pb-28">
            
            {/* 1. AGENT ALERT (Dismissable) */}
            {suggestions.length > 0 && (
                <div className="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-200 flex items-start gap-3 animate-in slide-in-from-top-4">
                    <Sparkles size={20} className="text-yellow-300 shrink-0 mt-0.5"/>
                    <div className="text-sm font-medium leading-snug">{suggestions[0].text}</div>
                </div>
            )}

             {/* 2. ACTIVE CHALLENGES */}
             {activeChallenges.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-wider px-1"><Target size={14}/> Desafíos Activos</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
                        {activeChallenges.map(c => (
                             <div key={c.id} className="min-w-[220px] bg-white p-4 rounded-2xl border border-slate-100 shadow-md relative overflow-hidden flex-shrink-0">
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${c.type === 'health' ? 'bg-emerald-500' : c.type === 'learning' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                                <div className="pl-2">
                                    <h4 className="font-bold text-slate-800 text-sm line-clamp-1 mb-1">{c.title}</h4>
                                    <p className="text-xs text-slate-500 mb-3 line-clamp-2 h-8 leading-relaxed">{c.description}</p>
                                    <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-fit flex items-center gap-1">
                                        <Coins size={10} className="text-yellow-500 fill-yellow-500"/> +{c.rewardCredits}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             )}

            {/* 3. COMMAND GRID */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <MenuButton id="tasks" icon={ListTodo} label="Tareas" reqLevel={1} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
                <MenuButton id="habits" icon={CheckSquare} label="Hábitos" reqLevel={1} colorClass="text-orange-600" bgClass="bg-orange-100" />
                <MenuButton id="health" icon={Utensils} label="Nutrición" reqLevel={1} colorClass="text-red-600" bgClass="bg-red-100" />
                <MenuButton id="trainer" icon={Dumbbell} label="Entrenador" reqLevel={1} colorClass="text-blue-600" bgClass="bg-blue-100" />
                <MenuButton id="study" icon={GraduationCap} label="Estudio" reqLevel={1} colorClass="text-indigo-600" bgClass="bg-indigo-100" />
                <MenuButton id="notes" icon={Book} label="Notas" reqLevel={1} colorClass="text-slate-600" bgClass="bg-slate-100" />
                
                {/* Level 2+ */}
                <MenuButton id="skills" icon={Brain} label="Habilidades" reqLevel={2} colorClass="text-purple-600" bgClass="bg-purple-100" />
                <MenuButton id="finance" icon={DollarSign} label="Finanzas" reqLevel={2} colorClass="text-amber-600" bgClass="bg-amber-100" />
                <MenuButton id="focus" icon={TreePine} label="Focus" reqLevel={2} colorClass="text-emerald-700" bgClass="bg-emerald-200" />
                <MenuButton id="stats" icon={Award} label="Estadísticas" reqLevel={2} colorClass="text-cyan-600" bgClass="bg-cyan-100" />
                
                {/* Level 3+ */}
                <MenuButton id="chat" icon={MessageSquare} label="Gestor Neural" reqLevel={3} colorClass="text-pink-600" bgClass="bg-pink-100" />
                
                {/* Shop Button Restored */}
                <MenuButton id="shop" icon={ShopIcon} label="Tienda" reqLevel={1} colorClass="text-yellow-600" bgClass="bg-yellow-100" />
            </div>
            
            <div className="text-center text-xs text-slate-300 mt-8 pb-4 font-medium">
                Cerebro Digital v2.5 • PWA
            </div>
        </div>
    </div>
  );
};

export default HomeDashboardView;
