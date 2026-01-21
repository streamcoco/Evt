
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Save, Trash2, Tag, Wand2, Loader2, Maximize2, Minimize2, Mic, MicOff } from 'lucide-react';
import { Note, Category } from '../types';
import { suggestMetadata, summarizeNote } from '../services/geminiService';

interface NoteEditorProps {
  note: Note;
  onSave: (note: Note) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onDeductCredits: (amount: number) => boolean;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onDelete, onClose, onDeductCredits }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [category, setCategory] = useState(note.category);
  const [tags, setTags] = useState<string[]>(note.tags || []);
  const [newTag, setNewTag] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setTags(note.tags || []);
    setAiSummary(null);
    setViewMode('edit');
  }, [note.id]);

  // Voice Logic
  const toggleListening = () => {
      if (isListening) {
          setIsListening(false);
      } else {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (!SpeechRecognition) {
              alert("Tu navegador no soporta dictado por voz.");
              return;
          }
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'es-ES';

          recognition.onstart = () => setIsListening(true);
          recognition.onend = () => setIsListening(false);
          
          recognition.onresult = (event: any) => {
              let interimTranscript = '';
              let finalTranscript = '';

              for (let i = event.resultIndex; i < event.results.length; ++i) {
                  if (event.results[i].isFinal) {
                      finalTranscript += event.results[i][0].transcript;
                  } else {
                      interimTranscript += event.results[i][0].transcript;
                  }
              }
              if (finalTranscript) {
                  setContent(prev => prev + ' ' + finalTranscript);
              }
          };
          recognition.start();
      }
  };

  const handleSave = () => {
    onSave({
      ...note,
      title,
      content,
      category,
      tags,
      updatedAt: Date.now(),
    });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAiAutoTag = async () => {
    if (!content) return;
    if (!onDeductCredits(2)) return;

    setIsAiLoading(true);
    try {
      const result = await suggestMetadata(content);
      if (result.tags && result.tags.length > 0) {
        const mergedTags = [...new Set([...tags, ...result.tags])];
        setTags(mergedTags);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiSummarize = async () => {
    if (!content) return;
    if (!onDeductCredits(2)) return;

    setIsAiLoading(true);
    try {
      const summary = await summarizeNote(content);
      setAiSummary(summary);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header Toolbar */}
      <div className="border-b border-slate-200 p-4 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2 flex-1">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la nota..."
                className="text-lg font-bold bg-transparent border-none focus:ring-0 text-slate-800 w-full"
            />
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={toggleListening}
                className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-600 hover:bg-slate-200'}`}
                title="Dictado por Voz"
            >
                {isListening ? <MicOff size={20}/> : <Mic size={20}/>}
            </button>
            <button 
                onClick={handleAiSummarize}
                disabled={isAiLoading || !content}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full flex flex-col items-center"
                title="Resumen IA (-2)"
            >
                {isAiLoading ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
            </button>
            <button 
                onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                className="p-2 text-slate-600 hover:bg-slate-200 rounded-full"
            >
                {viewMode === 'edit' ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
            </button>
            <button 
                onClick={handleSave}
                className="flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800 text-sm font-medium"
            >
                <Save size={16} />
            </button>
            <button onClick={() => onDelete(note.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                <Trash2 size={20} />
            </button>
        </div>
      </div>

      {/* Metadata Bar */}
      <div className="px-4 py-2 border-b border-slate-100 flex flex-wrap gap-4 items-center bg-white text-sm">
        <div className="flex items-center gap-2">
            <span className="text-slate-400">Carpeta:</span>
            <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value as Category)}
                className="border-slate-200 rounded-md text-slate-700 text-sm py-1 px-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
                {Object.values(Category).map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>
        </div>

        <div className="flex items-center gap-2 flex-1">
            <Tag size={14} className="text-slate-400" />
            <div className="flex flex-wrap gap-1">
                {tags.map(tag => (
                    <span key={tag} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-indigo-900">×</button>
                    </span>
                ))}
                <input 
                    type="text" 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="+ Tag"
                    className="border-none bg-transparent text-xs focus:ring-0 p-0 w-16"
                />
            </div>
            <button onClick={handleAiAutoTag} disabled={isAiLoading} className="text-xs text-indigo-600 hover:underline">
               Autotag IA (-2)
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative flex">
          {viewMode === 'edit' ? (
             <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full p-6 resize-none focus:outline-none text-slate-800 leading-relaxed font-mono text-sm"
                placeholder="Escribe tus pensamientos aquí... (Soporta Markdown)"
             />
          ) : (
             <div className="w-full h-full p-6 overflow-y-auto prose prose-slate max-w-none">
                 <ReactMarkdown>{content}</ReactMarkdown>
             </div>
          )}

          {aiSummary && (
              <div className="absolute bottom-4 right-4 w-80 bg-white border border-indigo-100 shadow-xl rounded-lg p-4 z-10 animate-in slide-in-from-bottom-5">
                  <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wide flex items-center gap-1"><Wand2 size={12}/> Resumen IA</h4>
                      <button onClick={() => setAiSummary(null)} className="text-slate-400 hover:text-slate-600">×</button>
                  </div>
                  <div className="text-sm text-slate-600 max-h-48 overflow-y-auto prose prose-sm prose-indigo">
                    <ReactMarkdown>{aiSummary}</ReactMarkdown>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default NoteEditor;
