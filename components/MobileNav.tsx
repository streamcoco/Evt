
import React from 'react';
import { Home } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  userLevel: number;
  godMode: boolean; // Kept in interface but ignored
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange }) => {
  // Navigation is now centralized in Home. This bar just provides a way back.
  if (activeTab === 'home') return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
      <button 
        onClick={() => onTabChange('home')}
        className="pointer-events-auto bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center border-4 border-slate-100"
      >
        <Home size={24} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default MobileNav;
