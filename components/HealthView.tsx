
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Droplets, Loader2, Utensils, X, Plus, Bike, Activity, Scale, Footprints, Upload, Trash2, Smartphone, Play, Zap, Save, Search, Coins } from 'lucide-react';
import { HealthData, FoodEntry, ActivityEntry, UserProfile, DailyStats } from '../types';
import { analyzeFoodImage, estimateNutritionFromText, estimateActivityCalories } from '../services/geminiService';

interface HealthViewProps {
  data: HealthData;
  profile: UserProfile;
  history: DailyStats[];
  onUpdateHealth: (data: HealthData) => void;
  onUpdateProfile: (p: UserProfile) => void;
  onDeductCredits: (amount: number) => boolean;
}

const HealthView: React.FC<HealthViewProps> = ({ data, profile, history, onUpdateHealth, onUpdateProfile, onDeductCredits }) => {
  const [mode, setMode] = useState<'view' | 'camera' | 'manual' | 'activity'>('view');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMetricsForm, setShowMetricsForm] = useState(!profile.hasMetrics);
  
  // Metrics State
  const [tempProfile, setTempProfile] = useState(profile);
  const [tempMetrics, setTempMetrics] = useState(data.bodyMetrics);

  // Manual Inputs
  const [manualQuery, setManualQuery] = useState('');
  
  // Activity Inputs
  const [activityQuery, setActivityQuery] = useState('');

  // Pedometer State
  const [isPedometerActive, setIsPedometerActive] = useState(false);

  // Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => { return () => stopCamera(); }, []);

  // --- PEDOMETER LOGIC (Simple Accelerator) ---
  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0;
    let limit = 10; // Sensitivity
    let steps = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
        if (!isPedometerActive) return;
        const acc = event.accelerationIncludingGravity;
        if (!acc) return;
        let delta = Math.abs(acc.x! - lastX) + Math.abs(acc.y! - lastY) + Math.abs(acc.z! - lastZ);
        if (delta > limit) {
             steps++;
             if (steps % 2 === 0) onUpdateHealth({ ...data, steps: data.steps + 1 });
        }
        lastX = acc.x!; lastY = acc.y!; lastZ = acc.z!;
    };
    if (isPedometerActive && window.DeviceMotionEvent) window.addEventListener('devicemotion', handleMotion, true);
    return () => window.removeEventListener('devicemotion', handleMotion, true);
  }, [isPedometerActive, data.steps]);


  // Force metrics if missing
  if (showMetricsForm) {
      return (
          <div className="fixed inset-0 z-50 bg-slate-900 text-white p-6 flex flex-col justify-center items-center overflow-y-auto">
              <div className="w-full max-w-sm mt-10 mb-10">
                  <div className="mb-6 text-center">
                      <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Scale size={32}/>
                      </div>
                      <h2 className="text-2xl font-bold">Calibración Corporal</h2>
                      <p className="text-slate-400 text-sm">Datos para calcular tu metabolismo basal.</p>
                  </div>
                  
                  <div className="space-y-4 bg-slate-800 p-6 rounded-2xl border border-slate-700">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Edad</label>
                          <input type="number" className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl mt-1" value={tempProfile.age || ''} onChange={e => setTempProfile({...tempProfile, age: parseInt(e.target.value)})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase">Peso (kg)</label>
                              <input type="number" className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl mt-1" value={tempProfile.weight || ''} onChange={e => setTempProfile({...tempProfile, weight: parseFloat(e.target.value)})} />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase">Altura (cm)</label>
                              <input type="number" className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl mt-1" value={tempProfile.height || ''} onChange={e => setTempProfile({...tempProfile, height: parseFloat(e.target.value)})} />
                          </div>
                      </div>
                      <button 
                        onClick={() => {
                            if (tempProfile.age && tempProfile.weight && tempProfile.height) {
                                onUpdateProfile({...tempProfile, hasMetrics: true});
                                onUpdateHealth({...data, bodyMetrics: tempMetrics});
                                setShowMetricsForm(false);
                            } else {
                                alert("Por favor completa los campos obligatorios.");
                            }
                        }}
                        className="w-full bg-orange-600 hover:bg-orange-500 py-3 rounded-xl font-bold mt-4 flex items-center justify-center gap-2"
                      >
                          <Save size={18}/> Guardar Datos
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- CALCULATIONS ---
  const calculateBMR = () => {
      const base = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
      return profile.sex === 'male' ? base + 5 : base - 161;
  };
  const calculateTDEE = (bmr: number) => {
      const multipliers = { 'sedentary': 1.2, 'light': 1.375, 'moderate': 1.55, 'active': 1.725, 'athlete': 1.9 };
      return Math.round(bmr * (multipliers[profile.activityLevel] || 1.2));
  };
  const calculateTargets = (tdee: number) => {
      let targetCals = tdee;
      if (profile.goalType === 'lose') targetCals -= 500;
      if (profile.goalType === 'gain') targetCals += 300;
      return {
          calories: targetCals,
          protein: Math.round((targetCals * 0.30) / 4),
          carbs: Math.round((targetCals * 0.35) / 4),
          fat: Math.round((targetCals * 0.35) / 9)
      };
  };

  const bmr = calculateBMR();
  const tdee = calculateTDEE(bmr);
  const targets = calculateTargets(tdee);
  
  const currentMacros = data.foodLog.reduce(
    (acc, item) => ({
      calories: acc.calories + item.macros.calories,
      protein: acc.protein + item.macros.protein,
      carbs: acc.carbs + item.macros.carbs,
      fat: acc.fat + item.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  
  const activityBurn = data.activityLog.reduce((acc, item) => acc + item.caloriesBurned, 0);
  const netCalories = currentMacros.calories - activityBurn;

  // --- ACTIONS ---
  const addWater = (amount: number) => onUpdateHealth({ ...data, waterMl: data.waterMl + amount });
  const handleSyncSteps = () => {
    const stepsStr = prompt("Pasos actuales:", data.steps.toString());
    if (stepsStr && !isNaN(parseInt(stepsStr))) onUpdateHealth({ ...data, steps: parseInt(stepsStr) });
  };
  const deleteFoodEntry = (id: string) => {
    if(confirm("¿Eliminar?")) onUpdateHealth({ ...data, foodLog: data.foodLog.filter(f => f.id !== id) });
  };

  // --- CAMERA & INPUT LOGIC ---
  const startCamera = async () => {
    try {
      setMode('camera');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current?.play();
      }
    } catch (e) { alert("Error cámara."); setMode('view'); }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    if (!onDeductCredits(5)) return; // Cost for image analysis

    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx?.drawImage(videoRef.current, 0, 0);
    const base64 = canvasRef.current.toDataURL('image/jpeg');
    stopCamera(); setMode('view'); await processFoodImage(base64);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (!onDeductCredits(5)) return;
          const reader = new FileReader();
          reader.onloadend = async () => await processFoodImage(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const processFoodImage = async (base64: string) => {
    setIsProcessing(true);
    const analysis = await analyzeFoodImage(base64);
    addFoodLog(analysis);
  };

  const handleManualSubmit = async () => {
    if (!manualQuery) return;
    
    if (!onDeductCredits(2)) return; // Cost for text analysis

    setIsProcessing(true);
    const analysis = await estimateNutritionFromText(manualQuery);
    addFoodLog(analysis);
    setManualQuery(''); setMode('view');
  };

  const addFoodLog = (analysis: any) => {
      const newEntry: FoodEntry = {
          id: crypto.randomUUID(),
          name: analysis.name,
          timestamp: Date.now(),
          macros: analysis.macros,
          imageUrl: analysis.imageUrl 
      };
      onUpdateHealth({ ...data, foodLog: [newEntry, ...data.foodLog] });
      setIsProcessing(false);
  }

  const handleActivitySubmit = async () => {
    if (!activityQuery) return;
    if (!onDeductCredits(2)) return; // Cost for calc

    setIsProcessing(true);
    const result = await estimateActivityCalories(activityQuery, profile.weight);
    
    const act: ActivityEntry = { 
        id: crypto.randomUUID(), 
        type: result.type || activityQuery, 
        durationMinutes: result.duration, 
        caloriesBurned: result.calories, 
        timestamp: Date.now() 
    };
    
    onUpdateHealth({ ...data, activityLog: [act, ...data.activityLog] });
    setIsProcessing(false);
    setMode('view'); 
    setActivityQuery('');
  };

  if (mode === 'camera') {
      return (
        <div className="h-full bg-black relative flex flex-col">
          <video ref={videoRef} className="flex-1 object-cover" autoPlay playsInline muted />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-10 left-0 w-full flex justify-center items-center gap-8">
              <button onClick={() => { stopCamera(); setMode('view'); }} className="p-4 bg-white/20 rounded-full text-white"><X /></button>
              <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 ring-4 ring-indigo-500 flex items-center justify-center">
                  <span className="text-xs text-indigo-500 font-bold bg-white px-1 rounded flex items-center gap-0.5">-5 <Coins size={8}/></span>
              </button>
          </div>
      </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-28">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

      {/* DASHBOARD */}
      <div className="bg-slate-900 text-white rounded-b-3xl shadow-lg mb-4 overflow-hidden relative flex-shrink-0">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
        <div className="p-6 relative z-10">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg flex items-center gap-2"><Utensils size={18} className="text-orange-400"/> Nutrición</h2>
                <button onClick={() => setShowMetricsForm(true)} className="text-xs bg-slate-800 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-slate-700">
                    <Scale size={12}/> Métricas
                </button>
            </div>
            
            <div className="flex items-end justify-between mb-4">
                <div>
                    <div className="text-4xl font-bold">{netCalories} <span className="text-lg text-slate-400 font-normal">/ {targets.calories}</span></div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Kcal (Objetivo)</div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-emerald-400 font-bold">-{activityBurn} kcal</div>
                </div>
            </div>

            <div className="space-y-3">
                {[
                    { label: 'Prot', current: currentMacros.protein, target: targets.protein, color: 'bg-blue-500' },
                    { label: 'Carb', current: currentMacros.carbs, target: targets.carbs, color: 'bg-yellow-500' },
                    { label: 'Gras', current: currentMacros.fat, target: targets.fat, color: 'bg-red-500' },
                ].map(m => (
                    <div key={m.label}>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-300">{m.label}</span>
                            <span>{m.current} / {m.target}g</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${m.color}`} style={{ width: `${Math.min(100, (m.current/m.target)*100)}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-4 flex-shrink-0">
          <button onClick={() => addWater(250)} className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center justify-between active:scale-95 transition-transform">
              <div className="flex items-center gap-2">
                  <Droplets size={20} className="text-blue-500"/>
                  <div className="text-left">
                      <div className="text-sm font-bold text-slate-700">{data.waterMl} ml</div>
                      <div className="text-[10px] text-slate-400">Objetivo {data.waterGoal}</div>
                  </div>
              </div>
              <Plus size={16} className="text-blue-400"/>
          </button>
          
          <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex flex-col relative">
               <div className="flex items-center justify-between mb-1">
                   <div className="flex items-center gap-2">
                      <Footprints size={20} className="text-emerald-500"/>
                      <div className="text-sm font-bold text-slate-700">{data.steps}</div>
                   </div>
                   <button onClick={() => setIsPedometerActive(!isPedometerActive)} className={`p-1.5 rounded-full ${isPedometerActive ? 'bg-emerald-500 text-white animate-pulse' : 'bg-emerald-200 text-emerald-700'}`}>
                       {isPedometerActive ? <Play size={10} fill="currentColor"/> : <Smartphone size={10}/>}
                   </button>
               </div>
               <div className="text-[10px] text-slate-400 flex justify-between items-center">
                   <span>Obj: {data.stepGoal}</span>
                   <button onClick={handleSyncSteps} className="text-emerald-600 font-bold">Editar</button>
               </div>
          </div>
      </div>

      <div className="px-4 space-y-4">
        
        {/* INPUT BUTTONS */}
        <div className="grid grid-cols-4 gap-2">
            <button onClick={startCamera} className="bg-indigo-600 text-white h-14 rounded-xl flex flex-col items-center justify-center shadow-md active:scale-95 transition-transform">
                <Camera size={20} />
                <span className="text-[9px] font-bold opacity-80 mt-1 flex items-center gap-0.5">-5 <Coins size={8}/></span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-100 text-indigo-600 h-14 rounded-xl flex flex-col items-center justify-center shadow-sm active:scale-95 transition-transform">
                <Upload size={20} />
                <span className="text-[9px] font-bold opacity-80 mt-1 flex items-center gap-0.5">-5 <Coins size={8}/></span>
            </button>
            <button onClick={() => setMode('manual')} className="bg-white border border-slate-200 text-slate-600 h-14 rounded-xl flex flex-col items-center justify-center shadow-sm active:scale-95 transition-transform">
                <Utensils size={20} />
                <span className="text-[9px] font-bold opacity-80 mt-1 flex items-center gap-0.5">-2 <Coins size={8}/></span>
            </button>
            <button onClick={() => setMode('activity')} className="bg-orange-500 text-white h-14 rounded-xl flex flex-col items-center justify-center shadow-md active:scale-95 transition-transform">
                <Bike size={20} />
            </button>
        </div>
        
        {isProcessing && (
            <div className="text-center py-4 text-indigo-600 flex justify-center items-center gap-2">
                <Loader2 className="animate-spin" /> Analizando IA...
            </div>
        )}

        {/* MANUAL INPUT */}
        {mode === 'manual' && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 animate-in fade-in">
                <div className="flex gap-2">
                    <input className="flex-1 border p-2 rounded-lg text-sm" placeholder="Ej: 2 huevos con pan" value={manualQuery} onChange={e => setManualQuery(e.target.value)} />
                    <button onClick={handleManualSubmit} className="bg-indigo-600 text-white p-2 rounded-lg"><Plus /></button>
                </div>
            </div>
        )}

        {/* ACTIVITY INPUT */}
        {mode === 'activity' && (
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 animate-in fade-in">
                <h4 className="font-bold text-sm mb-2 text-orange-600">Registrar Actividad</h4>
                <div className="flex gap-2">
                    <input 
                        className="flex-1 border p-2 rounded-lg text-sm" 
                        placeholder="Ej: Correr 30 min, 3 series pesas..." 
                        value={activityQuery} 
                        onChange={e => setActivityQuery(e.target.value)} 
                    />
                    <button onClick={handleActivitySubmit} className="bg-orange-500 text-white p-2 rounded-lg font-bold text-xs shadow-md"><Plus size={20}/></button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1"><Zap size={10}/> La IA calculará el gasto calórico (-2 <Coins size={8}/>)</p>
            </div>
        )}

        {/* FOOD LOG LIST */}
        <div className="space-y-2">
            <h3 className="font-bold text-slate-700 text-sm">Registro de Hoy</h3>
            {data.foodLog.map(f => (
                <div key={f.id} className="bg-white p-3 rounded-xl flex items-center justify-between shadow-sm border border-slate-50">
                    <div className="flex items-center gap-3 overflow-hidden">
                         <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-400 flex-shrink-0">
                             {f.imageUrl ? <img src={f.imageUrl} className="w-full h-full object-cover rounded-lg"/> : <Utensils size={18}/>}
                         </div>
                        <div className="min-w-0">
                            <div className="font-bold text-sm text-slate-800 truncate">{f.name}</div>
                            <div className="text-[10px] text-slate-500 flex gap-2">
                                <span className="text-indigo-600 font-bold">{f.macros.calories} kcal</span>
                                <span>P:{f.macros.protein} C:{f.macros.carbs} F:{f.macros.fat}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => deleteFoodEntry(f.id)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                </div>
            ))}
            {data.foodLog.length === 0 && <p className="text-center text-xs text-slate-400 mt-4">Sin comidas registradas hoy.</p>}
        </div>

      </div>
    </div>
  );
};

export default HealthView;
