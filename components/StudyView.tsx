
import React, { useState } from 'react';
import { Plus, BookOpen, Brain, Loader2, Play, Check, X, CalendarClock, Link as LinkIcon, FileText, MessageCircle, Send, ExternalLink, Lock } from 'lucide-react';
import { StudyEvent, Flashcard, Task, StudySource } from '../types';
import { generateStudyPlan, generateFlashcards, askStudySource } from '../services/geminiService';

interface StudyViewProps {
  events: StudyEvent[];
  flashcards: Flashcard[];
  onAddEvent: (e: StudyEvent) => void;
  onUpdateEvent: (e: StudyEvent) => void;
  onDeleteEvent: (id: string) => void;
  onAddFlashcards: (cards: Flashcard[]) => void;
  onUpdateFlashcard: (card: Flashcard) => void;
  onAddTaskToDaily: (task: Task) => void;
  onDeductCredits: (amount: number) => boolean;
  userLevel: number;
}

const StudyView: React.FC<StudyViewProps> = ({ 
  events, flashcards, onAddEvent, onUpdateEvent, onDeleteEvent, onAddFlashcards, onUpdateFlashcard, onAddTaskToDaily, onDeductCredits, userLevel
}) => {
  const [activeTab, setActiveTab] = useState<'events' | 'flashcards'>('events');
  
  // Event Creation State
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTopic, setNewEventTopic] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // NotebookLM State
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeSourceTab, setActiveSourceTab] = useState<'sources' | 'chat'>('sources');
  const [newSourceContent, setNewSourceContent] = useState('');
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [notebookUrl, setNotebookUrl] = useState(''); 
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  // Flashcard Generation State
  const [showDeckForm, setShowDeckForm] = useState(false);
  const [newDeckTopic, setNewDeckTopic] = useState('');
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);

  // Flashcard Play Mode State
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const activeEvent = events.find(e => e.id === activeEventId);

  // --- LOGIC: EVENTS ---
  const handleCreateEvent = async () => {
    if (!newEventTitle || !newEventDate || !newEventTopic) return;
    
    if (!onDeductCredits(10)) return; // Cost for Study Plan

    setIsGeneratingPlan(true);
    try {
        const plan = await generateStudyPlan(newEventTopic, newEventDate);
        const newEvent: StudyEvent = {
            id: crypto.randomUUID(),
            title: newEventTitle,
            date: newEventDate,
            topic: newEventTopic,
            generatedPlan: plan,
            sources: []
        };
        onAddEvent(newEvent);
        setShowEventForm(false);
        setNewEventTitle(''); setNewEventDate(''); setNewEventTopic('');
    } finally {
        setIsGeneratingPlan(false);
    }
  };

  const handleAddToDaily = (event: StudyEvent, taskIndex: number) => {
    const task = event.generatedPlan[taskIndex];
    if (task.addedToDaily) return;

    onAddTaskToDaily({
        id: crypto.randomUUID(),
        text: `Estudio: ${task.description}`,
        completed: false,
        createdAt: Date.now(),
        isStudyTask: true,
        difficulty: 'medium',
        rewardValue: 10
    });

    const updatedEvent = { ...event };
    updatedEvent.generatedPlan[taskIndex].addedToDaily = true;
    onUpdateEvent(updatedEvent);
  };

  // --- LOGIC: NOTEBOOKLM ---
  const handleAddSource = () => {
      if (!activeEvent || !newSourceContent) return;
      const newSource: StudySource = {
          id: crypto.randomUUID(),
          title: newSourceTitle || 'Fuente sin título',
          type: newSourceContent.startsWith('http') ? 'url' : 'text',
          content: newSourceContent,
          dateAdded: Date.now()
      };
      onUpdateEvent({
          ...activeEvent,
          sources: [...(activeEvent.sources || []), newSource]
      });
      setNewSourceContent(''); setNewSourceTitle('');
  };

  const handleSaveNotebookUrl = () => {
      if (!activeEvent) return;
      onUpdateEvent({ ...activeEvent, notebookLmUrl: notebookUrl });
      alert("Enlace a NotebookLM guardado.");
  };

  const handleAskSource = async () => {
      if (!activeEvent || !chatQuery || isChatting) return;
      const combinedSourceText = (activeEvent.sources || []).map(s => `Fuente: ${s.title}\n${s.content}`).join('\n\n');
      
      if (!combinedSourceText) {
          alert("Primero añade fuentes de información.");
          return;
      }

      setIsChatting(true);
      const userMsg = { role: 'user' as const, text: chatQuery };
      setChatHistory(prev => [...prev, userMsg]);
      setChatQuery('');

      try {
          // Chat with sources is currently free or included in "context"
          const response = await askStudySource(userMsg.text, combinedSourceText);
          setChatHistory(prev => [...prev, { role: 'model', text: response }]);
      } catch (e) {
          setChatHistory(prev => [...prev, { role: 'model', text: 'Error procesando la fuente.' }]);
      } finally {
          setIsChatting(false);
      }
  };

  // --- LOGIC: FLASHCARDS ---
  const handleCreateDeck = async () => {
    if (!newDeckTopic) return;
    
    if (!onDeductCredits(10)) return; // Cost for Flashcards

    setIsGeneratingCards(true);
    try {
        const rawCards = await generateFlashcards(newDeckTopic, 10);
        const newCards: Flashcard[] = rawCards.map(c => ({
            ...c,
            id: crypto.randomUUID(),
            deckId: newDeckTopic,
            nextReview: Date.now(),
            interval: 0,
            easeFactor: 2.5
        }));
        onAddFlashcards(newCards);
        setShowDeckForm(false);
        setNewDeckTopic('');
    } finally {
        setIsGeneratingCards(false);
    }
  };

  const startSession = (deckId: string) => {
    const due = flashcards.filter(c => c.deckId === deckId && c.nextReview <= Date.now());
    if (due.length === 0) {
        alert("¡Todo al día! No hay cartas pendientes para este mazo.");
        return;
    }
    setStudyQueue(due);
    setActiveDeckId(deckId);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const handleRateCard = (rating: 'hard' | 'good' | 'easy') => {
    const card = studyQueue[currentCardIndex];
    let interval = card.interval;
    let ease = card.easeFactor;

    if (rating === 'hard') {
        interval = 0;
        ease = Math.max(1.3, ease - 0.2);
    } else if (rating === 'good') {
        interval = interval === 0 ? 1 : interval * ease;
    } else if (rating === 'easy') {
        interval = interval === 0 ? 4 : interval * ease * 1.3;
        ease += 0.15;
    }

    const nextReviewDate = Date.now() + (interval * 24 * 60 * 60 * 1000);

    onUpdateFlashcard({
        ...card,
        interval: Math.round(interval),
        easeFactor: ease,
        nextReview: nextReviewDate
    });

    if (currentCardIndex < studyQueue.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setIsFlipped(false);
    } else {
        alert("¡Sesión completada!");
        setActiveDeckId(null);
    }
  };

  const decks = Array.from(new Set(flashcards.map(c => c.deckId))).map((id) => {
      const deckId = id as string;
      return {
        id: deckId,
        count: flashcards.filter(c => c.deckId === deckId).length,
        due: flashcards.filter(c => c.deckId === deckId && c.nextReview <= Date.now()).length
      };
  });

  // --- RENDER FLASHCARD SESSION ---
  if (activeDeckId && studyQueue.length > 0) {
      const card = studyQueue[currentCardIndex];
      return (
          <div className="h-full flex flex-col bg-slate-900 text-white p-6">
              <div className="flex justify-between items-center mb-6">
                  <span className="text-slate-400 text-sm">Carta {currentCardIndex + 1} de {studyQueue.length}</span>
                  <button onClick={() => setActiveDeckId(null)}><X size={24}/></button>
              </div>
              <div 
                className="flex-1 flex items-center justify-center perspective-1000 cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                  <div className={`w-full h-96 relative transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                      <div className="absolute inset-0 bg-white text-slate-900 rounded-2xl p-8 flex items-center justify-center text-center shadow-xl backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
                          <p className="text-xl font-medium">{card.front}</p>
                          <span className="absolute bottom-4 text-xs text-slate-400 uppercase">Pregunta (Toca para voltear)</span>
                      </div>
                      <div className="absolute inset-0 bg-indigo-600 text-white rounded-2xl p-8 flex items-center justify-center text-center shadow-xl backface-hidden" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                          <p className="text-xl font-medium">{card.back}</p>
                          <span className="absolute bottom-4 text-xs text-indigo-200 uppercase">Respuesta</span>
                      </div>
                  </div>
              </div>
              
              {isFlipped && (
                  <div className="flex flex-wrap gap-2 mt-8 justify-center w-full">
                      <button onClick={(e) => { e.stopPropagation(); handleRateCard('hard'); }} className="flex-1 min-w-[80px] py-4 bg-red-500 rounded-xl font-bold hover:bg-red-600 transition-colors">Difícil</button>
                      <button onClick={(e) => { e.stopPropagation(); handleRateCard('good'); }} className="flex-1 min-w-[80px] py-4 bg-yellow-500 rounded-xl font-bold hover:bg-yellow-600 transition-colors">Bien</button>
                      <button onClick={(e) => { e.stopPropagation(); handleRateCard('easy'); }} className="flex-1 min-w-[80px] py-4 bg-emerald-500 rounded-xl font-bold hover:bg-emerald-600 transition-colors">Fácil</button>
                  </div>
              )}
          </div>
      );
  }

  // --- RENDER EVENT DETAILS (NotebookLM Interface) ---
  if (activeEvent) {
      return (
        <div className="flex flex-col h-full bg-slate-50">
           {/* ... (Existing Active Event UI - Shortened for brevity, logic unchanged) ... */}
           <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-3 shadow-sm">
               <button onClick={() => setActiveEventId(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
               <div>
                   <h2 className="font-bold text-slate-800 leading-tight">{activeEvent.title}</h2>
                   <p className="text-xs text-slate-500">{activeEvent.topic}</p>
               </div>
           </div>
           
           <div className="flex bg-white border-b border-slate-200">
               <button onClick={() => setActiveSourceTab('sources')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 ${activeSourceTab === 'sources' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Fuentes & Plan</button>
               <button onClick={() => setActiveSourceTab('chat')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 ${activeSourceTab === 'chat' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Asistente</button>
           </div>

           <div className="flex-1 overflow-y-auto p-4">
               {activeSourceTab === 'sources' ? (
                   <div className="space-y-6">
                       {/* NotebookLM & Sources Input */}
                       <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                           <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2"><BookOpen size={16}/> NotebookLM</h3>
                           {activeEvent.notebookLmUrl ? (
                               <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-blue-100">
                                   <a href={activeEvent.notebookLmUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline flex-1 truncate">{activeEvent.notebookLmUrl}</a>
                                   <button onClick={() => setNotebookUrl('')} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                                   <a href={activeEvent.notebookLmUrl} target="_blank" rel="noreferrer" className="p-1 bg-blue-600 text-white rounded"><ExternalLink size={12}/></a>
                               </div>
                           ) : (
                               <div className="flex gap-2">
                                   <input className="flex-1 p-2 rounded border text-xs" placeholder="Enlace NotebookLM..." value={notebookUrl} onChange={e => setNotebookUrl(e.target.value)} />
                                   <button onClick={handleSaveNotebookUrl} className="bg-indigo-600 text-white px-3 rounded text-xs font-bold">Vincular</button>
                               </div>
                           )}
                       </div>
                       
                       <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                           <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><LinkIcon size={16}/> Añadir Material</h3>
                           <input className="w-full p-2 border rounded mb-2 text-sm" placeholder="Título" value={newSourceTitle} onChange={e => setNewSourceTitle(e.target.value)} />
                           <textarea className="w-full p-2 border rounded mb-2 text-sm" rows={3} placeholder="Texto o URL..." value={newSourceContent} onChange={e => setNewSourceContent(e.target.value)} />
                           <button onClick={handleAddSource} disabled={!newSourceContent} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold">Guardar Fuente</button>
                       </div>

                       {/* Existing Plan */}
                       <div>
                           <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Plan de Estudio</h3>
                           {activeEvent.generatedPlan.map((task, idx) => (
                               <div key={task.id} className="flex gap-3 mb-2 bg-white p-3 rounded-lg border border-slate-100">
                                   <div className={`w-2 h-2 rounded-full mt-2 ${task.addedToDaily ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                   <div className="flex-1">
                                       <p className="text-sm text-slate-700">{task.description}</p>
                                       {!task.addedToDaily && (
                                           <button onClick={() => handleAddToDaily(activeEvent, idx)} className="text-[10px] mt-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                               + Tareas
                                           </button>
                                       )}
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               ) : (
                   /* Chat UI */
                   <div className="flex flex-col h-full">
                       <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                           {chatHistory.map((m, i) => (
                               <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                   <div className={`max-w-[85%] p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                                       {m.text}
                                   </div>
                               </div>
                           ))}
                           {isChatting && <div className="text-xs text-slate-400 animate-pulse">Analizando...</div>}
                       </div>
                       <div className="relative">
                           <input 
                              className="w-full p-3 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                              placeholder="Pregunta a tus documentos..."
                              value={chatQuery}
                              onChange={e => setChatQuery(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleAskSource()}
                           />
                           <button onClick={handleAskSource} disabled={!chatQuery || isChatting} className="absolute right-2 top-2 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                               <Send size={18}/>
                           </button>
                       </div>
                   </div>
               )}
           </div>
        </div>
      );
  }

  // --- MAIN RENDER ---
  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-28">
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
            <BookOpen className="text-indigo-600" /> Zona de Estudio
          </h2>
          <div className="flex bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setActiveTab('events')} className={`flex-1 py-2 text-sm font-medium rounded-md ${activeTab === 'events' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Eventos</button>
              
              <button 
                onClick={() => userLevel >= 3 ? setActiveTab('flashcards') : alert("Flashcards se desbloquean en Nivel 3")} 
                className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-1 ${activeTab === 'flashcards' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'} ${userLevel < 3 ? 'opacity-50' : ''}`}
              >
                  {userLevel < 3 && <Lock size={12}/>} Flashcards
              </button>
          </div>
      </div>

      {activeTab === 'events' && (
          <div className="p-4 space-y-4">
              {showEventForm ? (
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm space-y-3">
                      <h3 className="font-bold text-slate-700">Nuevo Evento (10 Créd)</h3>
                      <input className="w-full p-2 border rounded" placeholder="Título" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} />
                      <input className="w-full p-2 border rounded" type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} />
                      <textarea className="w-full p-2 border rounded" placeholder="Temario..." value={newEventTopic} onChange={e => setNewEventTopic(e.target.value)} />
                      <div className="flex gap-2">
                          <button onClick={() => setShowEventForm(false)} className="flex-1 py-2 text-slate-500">Cancelar</button>
                          <button onClick={handleCreateEvent} disabled={isGeneratingPlan} className="flex-1 py-2 bg-indigo-600 text-white rounded flex items-center justify-center gap-2">
                              {isGeneratingPlan ? <Loader2 className="animate-spin" /> : 'Crear'}
                          </button>
                      </div>
                  </div>
              ) : (
                  <button onClick={() => setShowEventForm(true)} className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-400 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50">
                      <Plus size={20} /> Agregar Examen
                  </button>
              )}

              {events.map(event => (
                  <div key={event.id} onClick={() => setActiveEventId(event.id)} className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 cursor-pointer active:scale-[0.99] transition-transform">
                      <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex justify-between items-start">
                          <div>
                              <h3 className="font-bold text-indigo-900 text-lg">{event.title}</h3>
                              <div className="flex items-center gap-2 text-indigo-600 text-sm">
                                  <CalendarClock size={14} /> 
                                  {new Date(event.date).toLocaleDateString()}
                              </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); onDeleteEvent(event.id); }} className="text-indigo-300 hover:text-red-400"><X size={18}/></button>
                      </div>
                      <div className="p-4 flex items-center justify-between text-sm text-slate-600">
                          <span>{(event.sources || []).length} Fuentes añadidas</span>
                          <span className="text-indigo-600 font-bold flex items-center gap-1">Ver Detalles <Play size={10}/></span>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {activeTab === 'flashcards' && (
          <div className="p-4 space-y-4">
               {showDeckForm ? (
                  <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm space-y-3">
                      <h3 className="font-bold text-slate-700">Crear Mazo IA (10 Créd)</h3>
                      <input className="w-full p-2 border rounded" placeholder="Tema" value={newDeckTopic} onChange={e => setNewDeckTopic(e.target.value)} />
                      <div className="flex gap-2">
                          <button onClick={() => setShowDeckForm(false)} className="flex-1 py-2 text-slate-500">Cancelar</button>
                          <button onClick={handleCreateDeck} disabled={isGeneratingCards} className="flex-1 py-2 bg-indigo-600 text-white rounded flex items-center justify-center gap-2">
                              {isGeneratingCards ? <Loader2 className="animate-spin" /> : 'Generar'}
                          </button>
                      </div>
                  </div>
              ) : (
                  <button onClick={() => setShowDeckForm(true)} className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-400 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50">
                      <Brain size={20} /> Generar Flashcards
                  </button>
              )}

              <div className="grid grid-cols-1 gap-3">
                  {decks.map(deck => (
                      <div key={deck.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                          <div>
                              <h3 className="font-bold text-slate-800">{deck.id}</h3>
                              <div className="text-xs text-slate-500">{deck.count} cartas • {deck.due} hoy</div>
                          </div>
                          <button onClick={() => startSession(deck.id)} className={`p-3 rounded-full shadow-lg ${deck.due > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300'}`} disabled={deck.due === 0}>
                              <Play size={20} fill="currentColor" />
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default StudyView;
