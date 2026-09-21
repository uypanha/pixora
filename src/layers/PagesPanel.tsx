import React, { useState } from 'react';
import { Plus, Copy, Trash2, Edit2, FileText } from 'lucide-react';
import { useDocument } from '../document/documentContext';

export const PagesPanel: React.FC = () => {
  const {
    document,
    activePageId,
    setActivePageId,
    addPage,
    renamePage,
    duplicatePage,
    deletePage,
  } = useDocument();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleStartRename = (pageId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(pageId);
    setEditingName(currentName);
  };

  const handleFinishRename = (pageId: string) => {
    if (editingName.trim()) {
      renamePage(pageId, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col border-b border-pixora-border pb-2 mb-2">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-pixora-text-muted uppercase tracking-wider">
        <span>Pages</span>
        <button
          onClick={() => addPage()}
          title="Add New Page"
          className="p-1 hover:text-white hover:bg-pixora-hover rounded transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Pages List */}
      <div className="space-y-0.5 px-2">
        {document.pages.map(page => {
          const isActive = page.id === activePageId;
          const isEditing = editingId === page.id;

          return (
            <div
              key={page.id}
              onClick={() => setActivePageId(page.id)}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                isActive
                  ? 'bg-pixora-elevated text-white font-medium shadow-sm'
                  : 'text-pixora-text-muted hover:text-white hover:bg-pixora-hover'
              }`}
            >
              <div className="flex items-center space-x-2 truncate flex-1 mr-2">
                <FileText size={14} className={isActive ? 'text-pixora-selection' : 'text-pixora-text-dim'} />
                {isEditing ? (
                  <input
                    type="text"
                    value={editingName}
                    autoFocus
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={() => handleFinishRename(page.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleFinishRename(page.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="bg-pixora-surface border border-pixora-selection text-white px-1 py-0.5 rounded outline-none w-full"
                  />
                ) : (
                  <span className="truncate">{page.name}</span>
                )}
              </div>

              {/* Action Icons on hover */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                <button
                  onClick={e => handleStartRename(page.id, page.name, e)}
                  title="Rename"
                  className="p-0.5 hover:text-white transition-colors"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    duplicatePage(page.id);
                  }}
                  title="Duplicate Page"
                  className="p-0.5 hover:text-white transition-colors"
                >
                  <Copy size={12} />
                </button>
                {document.pages.length > 1 && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      deletePage(page.id);
                    }}
                    title="Delete Page"
                    className="p-0.5 hover:text-pixora-danger transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
