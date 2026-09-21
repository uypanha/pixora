import React from 'react';
import { Layers, PlusCircle, Sliders } from 'lucide-react';
import { useEditor } from '../editor/editorContext';

export const MobileBottomNav: React.FC = () => {
  const { mobileActiveTab, setMobileActiveTab, selectedIds } = useEditor();

  const toggleTab = (tab: 'layers' | 'add' | 'properties') => {
    setMobileActiveTab(mobileActiveTab === tab ? null : tab);
  };

  return (
    <nav className="h-14 bg-pixora-surface border-t border-pixora-border grid grid-cols-3 z-30 shrink-0 select-none">
      {/* Layers */}
      <button
        onClick={() => toggleTab('layers')}
        className={`flex flex-col items-center justify-center space-y-0.5 text-[11px] font-medium transition-colors ${
          mobileActiveTab === 'layers'
            ? 'text-pixora-selection'
            : 'text-pixora-text-muted hover:text-white'
        }`}
      >
        <Layers size={18} />
        <span>Layers</span>
      </button>

      {/* Add */}
      <button
        onClick={() => toggleTab('add')}
        className={`flex flex-col items-center justify-center space-y-0.5 text-[11px] font-medium transition-colors ${
          mobileActiveTab === 'add'
            ? 'text-pixora-accent'
            : 'text-pixora-text-muted hover:text-white'
        }`}
      >
        <PlusCircle size={20} />
        <span>Add</span>
      </button>

      {/* Design / Properties */}
      <button
        onClick={() => toggleTab('properties')}
        className={`flex flex-col items-center justify-center space-y-0.5 text-[11px] font-medium transition-colors relative ${
          mobileActiveTab === 'properties'
            ? 'text-pixora-selection'
            : 'text-pixora-text-muted hover:text-white'
        }`}
      >
        <Sliders size={18} />
        <span>Design</span>
        {selectedIds.length > 0 && (
          <span className="absolute top-2 right-10 w-2 h-2 rounded-full bg-pixora-selection"></span>
        )}
      </button>
    </nav>
  );
};
