import React from 'react';
import { Folder, Inbox, Briefcase, Layers, BookOpen, Archive, Plus } from 'lucide-react';
import { Category, Note } from '../types';

interface SidebarProps {
  currentCategory: Category | 'ALL';
  onSelectCategory: (cat: Category | 'ALL') => void;
  onCreateNote: () => void;
  notes: Note[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentCategory, onSelectCategory, onCreateNote, notes }) => {
  
  const getCount = (cat: Category) => notes.filter(n => n.category === cat).length;

  const categories = [
    { id: Category.INBOX, label: 'Bandeja de Entrada', icon: Inbox },
    { id: Category.PROJECTS, label: 'Proyectos', icon: Briefcase },
    { id: Category.AREAS, label: 'Áreas', icon: Layers },
    { id: Category.RESOURCES, label: 'Recursos', icon: BookOpen },
    { id: Category.ARCHIVES, label: 'Archivos', icon: Archive },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800">
      <div className="p-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="bg-indigo-600 p-1 rounded">CD</span> Cerebro Digital
        </h1>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={onCreateNote}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={18} />
          <span>Nueva Nota</span>
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        <button
          onClick={() => onSelectCategory('ALL')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
            currentCategory === 'ALL' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Folder size={18} />
            <span>Todas las notas</span>
          </div>
          <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">{notes.length}</span>
        </button>

        <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Método PARA
        </div>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
              currentCategory === cat.id ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <cat.icon size={18} className={
                cat.id === Category.PROJECTS ? 'text-emerald-400' :
                cat.id === Category.AREAS ? 'text-blue-400' :
                cat.id === Category.RESOURCES ? 'text-amber-400' :
                cat.id === Category.INBOX ? 'text-purple-400' :
                'text-slate-400'
              } />
              <span>{cat.label}</span>
            </div>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
              {getCount(cat.id)}
            </span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        <p>Almacenamiento Local Activo</p>
      </div>
    </div>
  );
};

export default Sidebar;
