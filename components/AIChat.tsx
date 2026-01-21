
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BrainCircuit, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, Note, Task, Habit, DailyStats, HealthData, UserProfile } from '../types';
import { chatWithBrain } from '../services/geminiService';

interface AIChatProps {
  notes: Note[];
  tasks: Task[];
  habits: Habit[];
  stats: DailyStats | undefined;
  health: HealthData;
  profile: UserProfile;
}

const AIChat: React.FC<AIChatProps> = ({ notes, tasks, habits, stats, health, profile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hola. Soy el Gestor de tu Segundo Cerebro. Analizo tus tareas, hábitos, salud y rendimiento para optimizar tu día. ¿En qué trabajamos?', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      // Format history for the service
      const historyForService = messages.map(m => ({ role: m.role, text: m.text }));
      
      const responseText = await chatWithBrain(
          userMsg.text, 
          { notes, tasks, habits, stats, health, profile }, // Pass full context
          historyForService
      );
      
      const botMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: 'Error de conexión. Inténtalo de nuevo.', timestamp: Date.now() }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 pb-20">
      <div className="p-4 border-b border-slate-200 bg-white shadow-sm flex items-center justify-between sticky top-0 z-10">
        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
          <BrainCircuit className="text-indigo-600" size={24} />
          Gestor Neural
        </h2>
        <div className="flex flex-col items-end">
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-medium">
            Conectado
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Contexto Completo</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-indigo-600 text-white'}`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`rounded-2xl p-3 text-sm max-w-[85%] shadow-sm ${
              msg.role === 'user' 
                ? 'bg-white border border-slate-200 text-slate-700 rounded-tr-none' 
                : 'bg-indigo-600 text-white rounded-tl-none'
            }`}>
              <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-slate' : 'prose-invert'}`}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex gap-3 animate-pulse">
             <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                <Loader2 className="animate-spin" size={14} />
             </div>
             <div className="text-xs text-slate-400 py-2">Consultando memoria y métricas...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200 sticky bottom-16">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ej: ¿Qué debería comer hoy? ¿Qué tareas tengo?"
            className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
