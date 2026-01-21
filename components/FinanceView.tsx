
import React, { useState, useEffect } from 'react';
import { FinanceData, FinanceContext, TransactionType, Transaction, Asset } from '../types';
import { DollarSign, Users, Home, Plus, ArrowUpRight, ArrowDownRight, PieChart, TrendingUp, Globe, Loader2, Star, RefreshCw } from 'lucide-react';
import { getFinancialBriefing } from '../services/geminiService';

interface FinanceViewProps {
  data: FinanceData;
  onUpdateData: (d: FinanceData) => void;
}

const FinanceView: React.FC<FinanceViewProps> = ({ data, onUpdateData }) => {
  const [context, setContext] = useState<FinanceContext>('personal');
  const [activeTab, setActiveTab] = useState<'budget' | 'market'>('budget');
  
  // Transaction Form
  const [showTransForm, setShowTransForm] = useState(false);
  const [transDesc, setTransDesc] = useState('');
  const [transAmount, setTransAmount] = useState('');
  const [transType, setTransType] = useState<TransactionType>('expense');
  const [transCategory, setTransCategory] = useState('General');

  // AI News
  const [news, setNews] = useState<{summary: string, sentiment: string} | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  // Market Simulation
  const [liveAssets, setLiveAssets] = useState<Asset[]>(data.assets);

  // --- LOGIC: MARKET SIMULATION ---
  useEffect(() => {
    const interval = setInterval(() => {
        setLiveAssets(prev => prev.map(asset => {
            // Simulate realistic small volatility
            const volatility = asset.type === 'crypto' ? 0.002 : 0.0005; 
            const change = 1 + (Math.random() * volatility * 2 - volatility);
            const newPrice = asset.price * change;
            return {
                ...asset,
                price: newPrice,
                change24h: asset.change24h + ((Math.random() * 0.1) - 0.05) // Drift change slightly
            };
        }));
    }, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNews = async () => {
      setIsLoadingNews(true);
      const favorites = liveAssets.filter(a => a.isFavorite).map(a => a.name).join(", ");
      const result = await getFinancialBriefing(favorites || "Mercados Globales");
      setNews(result);
      setIsLoadingNews(false);
  };

  const toggleFavorite = (id: string) => {
      const updated = liveAssets.map(a => a.id === id ? { ...a, isFavorite: !a.isFavorite } : a);
      setLiveAssets(updated);
      onUpdateData({ ...data, assets: updated });
  };

  // --- LOGIC: TRANSACTIONS ---
  const handleAddTransaction = () => {
      if (!transDesc || !transAmount) return;
      const newTrans: Transaction = {
          id: crypto.randomUUID(),
          description: transDesc,
          amount: parseFloat(transAmount),
          type: transType,
          context: context,
          category: transCategory,
          date: Date.now()
      };
      onUpdateData({ ...data, transactions: [newTrans, ...data.transactions] });
      setShowTransForm(false);
      setTransDesc(''); setTransAmount('');
  };

  const getFilteredTransactions = () => data.transactions.filter(t => t.context === context);
  
  const calculateTotals = () => {
      const filtered = getFilteredTransactions();
      const income = filtered.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = filtered.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const savings = filtered.filter(t => t.type === 'savings').reduce((acc, t) => acc + t.amount, 0);
      return { income, expense, savings, net: income - expense - savings };
  };

  const totals = calculateTotals();

  // 50/30/20 Rule Logic
  const needsGoal = totals.income * 0.5;
  const wantsGoal = totals.income * 0.3;
  const savingsGoal = totals.income * 0.2;

  const renderBudget = () => (
      <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase mb-1">
                      <ArrowUpRight size={14}/> Ingresos
                  </div>
                  <div className="text-2xl font-bold text-emerald-900">${totals.income.toLocaleString()}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                  <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase mb-1">
                      <ArrowDownRight size={14}/> Gastos
                  </div>
                  <div className="text-2xl font-bold text-red-900">${totals.expense.toLocaleString()}</div>
              </div>
          </div>

          {/* 50/30/20 Analysis */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <PieChart size={18} className="text-indigo-600"/> Análisis 50/30/20
              </h3>
              
              <div className="space-y-4">
                  <div>
                      <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">Ahorro Real vs Ideal (20%)</span>
                          <span className="font-bold text-indigo-600">${totals.savings} / ${savingsGoal.toFixed(0)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (totals.savings/Math.max(1, savingsGoal))*100)}%` }}></div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 italic">"Págate a ti mismo primero."</p>
                  </div>
              </div>
          </div>

          {/* Transaction List */}
          <div>
              <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-700">Movimientos Recientes</h3>
                  <button onClick={() => setShowTransForm(true)} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                      <Plus size={12}/> Añadir
                  </button>
              </div>
              
              {showTransForm && (
                  <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-200 animate-in fade-in slide-in-from-top-2">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                          <select className="p-2 rounded border text-sm" value={transType} onChange={e => setTransType(e.target.value as any)}>
                              <option value="expense">Gasto</option>
                              <option value="income">Ingreso</option>
                              <option value="savings">Ahorro</option>
                          </select>
                          <input className="p-2 rounded border text-sm" placeholder="Monto" type="number" value={transAmount} onChange={e => setTransAmount(e.target.value)} />
                      </div>
                      <input className="w-full p-2 rounded border text-sm mb-2" placeholder="Descripción (ej: Supermercado)" value={transDesc} onChange={e => setTransDesc(e.target.value)} />
                      <div className="flex gap-2">
                          <button onClick={() => setShowTransForm(false)} className="flex-1 py-2 text-xs text-slate-500">Cancelar</button>
                          <button onClick={handleAddTransaction} className="flex-1 py-2 bg-indigo-600 text-white rounded text-xs font-bold">Guardar</button>
                      </div>
                  </div>
              )}

              <div className="space-y-2">
                  {getFilteredTransactions().slice(0, 5).map(t => (
                      <div key={t.id} className="bg-white p-3 rounded-xl border border-slate-50 flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : t.type === 'savings' ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600'}`}>
                                  {t.type === 'income' ? <ArrowUpRight size={14}/> : t.type === 'savings' ? <DollarSign size={14}/> : <ArrowDownRight size={14}/>}
                              </div>
                              <div>
                                  <div className="text-sm font-bold text-slate-800">{t.description}</div>
                                  <div className="text-[10px] text-slate-400">{new Date(t.date).toLocaleDateString()} • {t.category}</div>
                              </div>
                          </div>
                          <div className={`font-mono text-sm font-bold ${t.type === 'expense' ? 'text-slate-800' : 'text-emerald-600'}`}>
                              {t.type === 'expense' ? '-' : '+'}${t.amount}
                          </div>
                      </div>
                  ))}
                  {getFilteredTransactions().length === 0 && <p className="text-center text-slate-400 text-xs py-4">Sin movimientos aún.</p>}
              </div>
          </div>
      </div>
  );

  const renderMarket = () => (
      <div className="space-y-6">
          {/* AI Briefing */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold flex items-center gap-2 text-indigo-400"><Globe size={18}/> Contexto Global</h3>
                  <button onClick={fetchNews} disabled={isLoadingNews} className="text-slate-400 hover:text-white transition-colors">
                      {isLoadingNews ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>}
                  </button>
              </div>
              {news ? (
                  <div>
                      <p className="text-sm text-slate-300 leading-relaxed mb-3">{news.summary}</p>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase ${news.sentiment === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' : news.sentiment === 'bearish' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'}`}>
                          Sentimiento: {news.sentiment}
                      </div>
                  </div>
              ) : (
                  <div className="text-center py-4 text-slate-500 text-xs">
                      Pulsa recargar para obtener un resumen de mercado IA.
                  </div>
              )}
          </div>

          {/* Assets Ticker */}
          <div>
              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><TrendingUp size={18}/> Activos en Vivo</h3>
              <div className="grid grid-cols-1 gap-2">
                  {liveAssets.map(asset => (
                      <div key={asset.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center group">
                          <div className="flex items-center gap-3">
                              <button onClick={() => toggleFavorite(asset.id)}>
                                  <Star size={16} className={`${asset.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 group-hover:text-slate-400'}`} />
                              </button>
                              <div>
                                  <div className="font-bold text-slate-800">{asset.symbol}</div>
                                  <div className="text-[10px] text-slate-500">{asset.name}</div>
                              </div>
                          </div>
                          <div className="text-right">
                              <div className="font-mono font-bold text-slate-800">${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              <div className={`text-xs font-bold ${asset.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {asset.change24h > 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-28 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="text-emerald-600"/> Finanzas
          </h2>
          <div className="flex bg-slate-200 p-0.5 rounded-lg">
              <button onClick={() => setActiveTab('budget')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'budget' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Presupuesto</button>
              <button onClick={() => setActiveTab('market')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'market' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Mercados</button>
          </div>
      </div>

      {/* Context Tabs (Only for Budget) */}
      {activeTab === 'budget' && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              <button onClick={() => setContext('personal')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${context === 'personal' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-500'}`}>
                  <Users size={14}/> Personal
              </button>
              <button onClick={() => setContext('couple')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${context === 'couple' ? 'bg-pink-600 text-white border-pink-600' : 'bg-white border-slate-200 text-slate-500'}`}>
                  <Users size={14}/> Pareja
              </button>
              <button onClick={() => setContext('housing')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${context === 'housing' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-500'}`}>
                  <Home size={14}/> Vivienda
              </button>
          </div>
      )}

      {activeTab === 'budget' ? renderBudget() : renderMarket()}

    </div>
  );
};

export default FinanceView;
