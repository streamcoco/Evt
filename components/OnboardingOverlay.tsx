
import React, { useState } from 'react';
import { Book, CheckSquare, Activity, TreePine, ChevronRight, Brain, DollarSign, Dumbbell, Zap, Utensils } from 'lucide-react';

interface OnboardingOverlayProps {
  onComplete: () => void;
}

const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Cerebro Digital v2.5",
      desc: "Bienvenido a tu sistema operativo vital. Una fusión de productividad, biología y gamificación.",
      icon: <Brain size={80} className="text-white"/>,
      color: "bg-slate-900"
    },
    {
      title: "Nutrición Científica",
      desc: "Usa la IA para analizar fotos de tu comida, contar macros y monitorear tu % de grasa y músculo.",
      icon: <Utensils size={80} className="text-white"/>,
      color: "bg-orange-600"
    },
    {
      title: "Economía de Dopamina",
      desc: "Todo tiene un precio. Gana créditos trabajando. La IA evaluará tus deseos y les pondrá un precio según qué tan alineados estén con tus metas.",
      icon: <CheckSquare size={80} className="text-white"/>,
      color: "bg-emerald-600"
    },
    {
      title: "Finanzas & Mercados",
      desc: "Gestiona gastos personales, de pareja y vivienda. Recibe resúmenes de mercado IA y simula activos en tiempo real.",
      icon: <DollarSign size={80} className="text-white"/>,
      color: "bg-amber-600"
    },
    {
      title: "Entrenador Personal IA",
      desc: "Genera rutinas basadas en ciencia (hipertrofia, fuerza) y usa el cronómetro Tabata integrado.",
      icon: <Dumbbell size={80} className="text-white"/>,
      color: "bg-blue-600"
    },
    {
      title: "Estudio & Focus",
      desc: "Planifica exámenes, crea Flashcards (Nivel 3) y cultiva tu bosque de concentración usando la técnica Pomodoro.",
      icon: <TreePine size={80} className="text-white"/>,
      color: "bg-indigo-600"
    },
    {
      title: "Árbol de Habilidades",
      desc: "Gamifica tu aprendizaje. Genera planes de estudio y gana XP para subir de nivel en la vida real.",
      icon: <Zap size={80} className="text-white"/>,
      color: "bg-purple-600"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center text-white transition-colors duration-500 ${steps[step].color}`}>
       <div className="w-full max-w-md p-8 flex flex-col items-center text-center">
           <div className="mb-8 animate-bounce drop-shadow-lg">{steps[step].icon}</div>
           <h2 className="text-3xl font-bold mb-4">{steps[step].title}</h2>
           <p className="text-lg opacity-90 leading-relaxed mb-12 font-medium">{steps[step].desc}</p>
           
           <div className="flex gap-2 mb-8">
             {steps.map((_, i) => (
               <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-white w-6' : 'bg-white/30'}`}></div>
             ))}
           </div>

           <button 
             onClick={handleNext}
             className="bg-white text-slate-900 px-10 py-4 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl"
           >
             {step === steps.length - 1 ? 'Iniciar Sistema' : 'Siguiente'} <ChevronRight size={20}/>
           </button>
       </div>
    </div>
  );
};

export default OnboardingOverlay;
