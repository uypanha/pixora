import React from 'react';
import { Layers, PlusCircle, Paintbrush } from 'lucide-react';
import { useEditor } from '../editor/editorContext';

export const MobileBottomNav: React.FC = () => {
  const { mobileActiveTab, setMobileActiveTab } = useEditor();

  const toggleTab = (tab: 'layers' | 'add' | 'properties') => {
    setMobileActiveTab(mobileActiveTab === tab ? null : tab);
  };

  return (
    <nav className="h-16 bg-[#111827] border-t border-[#1F2937] grid grid-cols-3 z-30 shrink-0 select-none pb-safe">
      {/* Layers */}
      <button
        onClick={() => toggleTab('layers')}
        className={`flex flex-col items-center justify-center space-y-1 text-[11px] font-medium transition-colors ${
          mobileActiveTab === 'layers'
            ? 'text-indigo-400 font-semibold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Layers size={20} />
        <span>Layers</span>
      </button>

      {/* Add */}
      <button
        onClick={() => toggleTab('add')}
        className={`flex flex-col items-center justify-center space-y-1 text-[11px] font-medium transition-colors ${
          mobileActiveTab === 'add'
            ? 'text-indigo-400 font-semibold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <PlusCircle size={20} />
        <span>Add</span>
      </button>

      {/* Design */}
      <button
        onClick={() => toggleTab('properties')}
        className={`flex flex-col items-center justify-center space-y-1 text-[11px] font-medium transition-colors relative ${
          mobileActiveTab === 'properties'
            ? 'text-indigo-400 font-semibold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Paintbrush size={20} />
        <span>Design</span>
      </button>
    </nav>
  );
};
