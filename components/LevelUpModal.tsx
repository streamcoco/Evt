
import React, { useEffect } from 'react';
import { Trophy, Lock, Star, X } from 'lucide-react';
import { playSound } from '../services/soundService';

interface LevelUpModalProps {
  newLevel: number;
  onClose: () => void;
  unlocks: { level: number; label: string }[];
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ newLevel, onClose, unlocks }) => {
  useEffect(() => {
    playSound('levelUp');
  }, []);

  const newUnlocks = unlocks.filter(u => u.level === newLevel);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="relative bg-slate-900 border-2 border-yellow-500/50 w-full max-w-sm rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(234,179,8,0.3)] overflow-hidden">
            
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent animate-pulse"></div>
            
            <div className="relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
                    <Trophy size={48} className="text-white drop-shadow-md"/>
                </div>
                
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 mb-2 uppercase tracking-wider">
                    ¡Nivel {newLevel}!
                </h2>
                <p className="text-slate-400 text-sm mb-8">Has superado tus límites.</p>

                {newUnlocks.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-8">
                        <h3 className="text-xs font-bold text-yellow-500 uppercase mb-3 flex items-center justify-center gap-2">
                            <Lock size={12} className="text-yellow-500"/> Desbloqueado
                        </h3>
                        <div className="space-y-2">
                            {newUnlocks.map((u, i) => (
                                <div key={i} className="flex items-center gap-2 text-white text-sm">
                                    <Star size={14} className="text-yellow-400 fill-yellow-400"/> {u.label}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button 
                    onClick={onClose}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-yellow-500/20 transition-all active:scale-95"
                >
                    Continuar
                </button>
            </div>
        </div>
    </div>
  );
};

export default LevelUpModal;
