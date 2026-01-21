
import React, { useState } from 'react';
import { UserProfile, Reward } from '../types';
import { ShoppingBag, Box, Check, Plus, Sparkles, Loader2, Package, TrendingUp, TrendingDown, ArrowRight, Trash2, Coins } from 'lucide-react';
import { calculateRewardCost } from '../services/geminiService';

interface ShopViewProps {
  profile: UserProfile;
  rewards: Reward[];
  onBuyReward: (reward: Reward) => void;
  onUpdateRewards: (rewards: Reward[]) => void;
  onDeductCredits: (amount: number) => boolean;
  onUseItem: (itemName: string) => void;
  onDeleteReward: (id: string) => void;
}

const ShopView: React.FC<ShopViewProps> = ({ profile, rewards, onBuyReward, onUpdateRewards, onDeductCredits, onUseItem, onDeleteReward }) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory'>('shop');
  const [newRewardName, setNewRewardName] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

  // --- AI EVALUATOR LOGIC ---
  const handleAnalyzeReward = async () => {
    if (!newRewardName.trim()) return;
    if (!onDeductCredits(2)) return; // Cost for AI usage

    setIsCalculating(true);
    try {
        const result = await calculateRewardCost(newRewardName, profile.goals || "Bienestar General");
        
        const newReward: Reward = {
            id: crypto.randomUUID(),
            name: newRewardName,
            cost: result.cost,
            icon: result.icon,
            type: 'general',
            consumableEffect: result.rationale
        };

        onUpdateRewards([...rewards, newReward]);
        setNewRewardName('');
    } catch (e) {
        alert("La IA está descansando. Intenta de nuevo.");
    } finally {
        setIsCalculating(false);
    }
  };

  const inflation = profile.economyStats?.inflationMultiplier || 1.0;
  const discounts = profile.economyStats?.activeDiscounts || [];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-32 p-4">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <ShoppingBag className="text-blue-600"/> Tienda
            </h1>
            {inflation > 1.05 && (
                <div className="text-[10px] text-red-500 flex items-center gap-1 font-bold animate-pulse mt-1">
                    <TrendingUp size={12}/> Inflación Alta ({(inflation * 100 - 100).toFixed(0)}%)
                </div>
            )}
            {discounts.length > 0 && (
                <div className="text-[10px] text-emerald-500 flex items-center gap-1 font-bold animate-pulse mt-1">
                    <TrendingDown size={12}/> Ofertas Activas
                </div>
            )}
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Saldo</span>
            <div className="flex items-center gap-1">
                <Coins size={16} className="text-yellow-500 fill-yellow-500"/>
                <strong className="text-xl text-slate-900">{profile.credits}</strong>
            </div>
          </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm mb-6 border border-slate-100">
          <button onClick={() => setActiveTab('shop')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${activeTab === 'shop' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}>Catálogo</button>
          <button onClick={() => setActiveTab('inventory')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${activeTab === 'inventory' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}>Inventario</button>
      </div>

      {activeTab === 'shop' && (
          <div className="animate-in slide-in-from-left-2 fade-in">
              {/* AI WISH EVALUATOR */}
              <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm mb-6">
                <h3 className="font-bold text-slate-700 text-xs uppercase flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-indigo-500"/> Evaluador de Deseos (-2)
                </h3>
                <div className="flex gap-2">
                    <input 
                        className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ej: Pizza, Videojuego..."
                        value={newRewardName}
                        onChange={e => setNewRewardName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAnalyzeReward()}
                    />
                    <button 
                        onClick={handleAnalyzeReward}
                        disabled={isCalculating || !newRewardName}
                        className="bg-indigo-600 text-white w-12 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 disabled:opacity-50"
                    >
                        {isCalculating ? <Loader2 className="animate-spin" size={20}/> : <Plus size={24}/>}
                    </button>
                </div>
              </div>

              {/* GRID - Filter out unlocked trees */}
              <div className="grid grid-cols-2 gap-4">
                {rewards.filter(r => !(r.type === 'tree' && r.treeData?.unlocked)).map((reward) => {
                  const inventoryCount = profile.inventory?.[capitalize(reward.name || reward.id)] || 0;
                  
                  // Dynamic Pricing Logic
                  let currentCost = Math.round(reward.cost * inflation);
                  const isDiscounted = discounts.includes(reward.id);
                  if (isDiscounted) {
                      currentCost = Math.round(currentCost * 0.7);
                  }

                  const canAfford = profile.credits >= currentCost;

                  return (
                    <div key={reward.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden transition-transform active:scale-98 group">
                        
                        {/* DELETE BUTTON */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteReward(reward.id); }}
                            className="absolute top-2 left-2 p-1.5 bg-white/80 rounded-full text-slate-300 hover:text-red-500 z-20 opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100"
                        >
                            <Trash2 size={12}/>
                        </button>

                        {/* Discount Badge */}
                        {isDiscounted && <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded-br-lg z-10">OFERTA</div>}

                        {/* Inventory Badge */}
                        {inventoryCount > 0 && (
                            <div className="absolute top-2 right-2 bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-slate-200 z-10">
                                <Box size={10}/> x{inventoryCount}
                            </div>
                        )}
                        
                        <div className="text-5xl mb-3 mt-2">{reward.icon}</div>
                        <h3 className="text-sm font-bold text-slate-800 mb-1 leading-tight">{capitalize(reward.name)}</h3>
                        {/* Removed line-clamp to show full description */}
                        {reward.consumableEffect && <p className="text-[10px] text-slate-400 mb-2 leading-tight">{reward.consumableEffect}</p>}
                        
                        <div className="flex items-center gap-1 mb-4">
                             {inflation > 1.05 && !isDiscounted && <TrendingUp size={10} className="text-red-400"/>}
                             {isDiscounted && <TrendingDown size={10} className="text-emerald-500"/>}
                             <p className={`text-xs font-bold flex items-center gap-1 ${canAfford ? (isDiscounted ? 'text-emerald-600' : 'text-slate-600') : 'text-red-400'}`}>
                                <Coins size={10} className={canAfford ? 'text-yellow-500 fill-yellow-500' : 'text-red-400'}/> {currentCost}
                             </p>
                        </div>
                        
                        <button 
                          onClick={() => onBuyReward(reward)}
                          disabled={!canAfford}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 ${
                            canAfford 
                                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-200' 
                                : 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-60'
                          }`}
                        >
                          Comprar
                        </button>
                    </div>
                  );
                })}
              </div>
          </div>
      )}

      {activeTab === 'inventory' && (
          <div className="animate-in slide-in-from-right-2 fade-in">
              {Object.keys(profile.inventory || {}).length === 0 && profile.streakFreezes === 0 ? (
                  <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-h-[50vh]">
                     <Package size={40} className="mb-4 text-slate-300"/>
                     <p className="text-sm font-bold text-slate-500">Tu inventario está vacío.</p>
                     <p className="text-xs text-slate-400 mt-2">¡Completa tareas para ganar créditos!</p>
                  </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                    {/* Render Streak Freezes First */}
                    {profile.streakFreezes > 0 && (
                         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
                            <div className="absolute top-2 right-2 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                                x{profile.streakFreezes}
                            </div>
                            <div className="text-5xl mb-3 mt-2">❄️</div>
                            <h3 className="text-sm font-bold text-slate-800 mb-1 leading-tight">Congelador</h3>
                            <p className="text-[10px] text-slate-400 mb-4 leading-tight">Protege tu racha diaria si fallas.</p>
                            <div className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 cursor-default border border-slate-200">
                                Automático
                            </div>
                         </div>
                    )}

                    {/* Render Inventory Items (Filter out things that might look like trees if any slipped in) */}
                    {Object.entries(profile.inventory || {}).map(([key, count]) => {
                        // Find original reward data to get icon
                        const originalReward = rewards.find(r => capitalize(r.name) === key);
                        
                        // Fallback icon and text
                        const icon = originalReward?.icon || '📦';
                        const effect = originalReward?.consumableEffect || 'Consumible';

                        return (
                            <div key={key} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
                                <div className="absolute top-2 right-2 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                                    x{count}
                                </div>
                                <div className="text-5xl mb-3 mt-2">{icon}</div>
                                <h3 className="text-sm font-bold text-slate-800 mb-1 leading-tight">{key}</h3>
                                <p className="text-[10px] text-slate-400 mb-4 leading-tight">{effect}</p>
                                
                                <button 
                                    onClick={() => onUseItem(key)}
                                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-200 shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-transform"
                                >
                                    Usar <ArrowRight size={10}/>
                                </button>
                            </div>
                        );
                    })}
                </div>
              )}
          </div>
      )}
    </div>
  );
};

export default ShopView;
