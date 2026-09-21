import React, { useRef } from 'react';
import {
  MousePointer,
  Hand,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Download,
  FolderOpen,
  HelpCircle,
  Maximize2,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useDocument } from '../../document/documentContext';
import { useEditor } from '../../editor/editorContext';
import { Tool } from '../../types/editor';
import { AutosaveStatus } from '../../storage/autosave';
import { savePixoraFile } from '../../export/pixoraExporter';
import { importPixoraFile } from '../../import/pixoraImporter';
import { importImageFile } from '../../import/imageImporter';
import { ShapesDropdown } from './ShapesDropdown';

interface TopToolbarProps {
  onOpenLauncher: () => void;
  autosaveStatus: AutosaveStatus;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  onOpenLauncher,
  autosaveStatus,
}) => {
  const {
    document,
    updateMetadata,
    canUndo,
    canRedo,
    undo,
    redo,
    setDocument,
    addObject,
  } = useDocument();

  const {
    activeTool,
    setActiveTool,
    viewport,
    zoomIn,
    zoomOut,
    resetZoom,
    setSelectedIds,
    setIsExportModalOpen,
    setIsShortcutsModalOpen,
  } = useEditor();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const doc = await importPixoraFile(file);
      setDocument(doc, true);
    } catch (err: any) {
      alert(err.message || 'Failed to open project.');
    }
    e.target.value = '';
  };

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { asset, imageObject } = await importImageFile(file, 200, 200);
      addObject(imageObject, null, asset);
      setSelectedIds([imageObject.id]);
      setActiveTool('select');
    } catch (err: any) {
      alert(err.message || 'Failed to import image.');
    }
    e.target.value = '';
  };

  const handleSaveClick = () => {
    savePixoraFile(document);
  };

  const coreTools: { id: Tool; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'select', label: 'Select', icon: <MousePointer size={16} />, shortcut: 'V' },
    { id: 'hand', label: 'Hand', icon: <Hand size={16} />, shortcut: 'H' },
  ];

  return (
    <header className="h-12 bg-pixora-surface border-b border-pixora-border px-3 flex items-center justify-between select-none z-30 shrink-0">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pixora,application/json"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleImageChange}
      />

      {/* Left: Brand, Project Name & Menu actions */}
      <div className="flex items-center space-x-3">
        {/* Pixora Logo Icon & Launcher trigger */}
        <button
          onClick={onOpenLauncher}
          title="Open Project Launcher / Start Screen"
          className="flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-pixora-hover transition-colors group"
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-black tracking-tighter">P</span>
          </div>
          <span className="font-bold text-sm tracking-wide text-white group-hover:text-pixora-selection transition-colors">
            Pixora
          </span>
        </button>

        <div className="h-4 w-[1px] bg-pixora-border" />

        {/* Project Name Input */}
        <input
          type="text"
          value={document.metadata.name}
          onChange={e => updateMetadata({ name: e.target.value })}
          title="Click to rename project"
          className="bg-transparent hover:bg-pixora-elevated focus:bg-pixora-elevated text-xs md:text-sm font-medium text-pixora-text px-2 py-1 rounded border border-transparent focus:border-pixora-border outline-none transition-colors w-32 md:w-48 truncate"
        />

        {/* Autosave Status Badge */}
        <div className="hidden lg:flex items-center space-x-1.5 text-xs text-pixora-text-dim px-2">
          {autosaveStatus === 'saved' && (
            <>
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span className="text-emerald-400/80">Saved locally</span>
            </>
          )}
          {autosaveStatus === 'saving' && (
            <>
              <RefreshCw size={13} className="text-amber-400 animate-spin" />
              <span className="text-amber-400/80">Saving...</span>
            </>
          )}
          {autosaveStatus === 'unsaved' && (
            <>
              <AlertCircle size={13} className="text-pixora-text-dim" />
              <span>Unsaved changes</span>
            </>
          )}
        </div>
      </div>

      {/* Center: Tools & Undo/Redo */}
      <div className="flex items-center space-x-1">
        {/* Undo / Redo */}
        <div className="flex items-center bg-pixora-elevated rounded-lg p-0.5 border border-pixora-border mr-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl/Cmd+Z)"
            className="p-1.5 rounded text-pixora-text-muted hover:text-white disabled:opacity-30 disabled:hover:text-pixora-text-muted transition-colors"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl/Cmd+Shift+Z)"
            className="p-1.5 rounded text-pixora-text-muted hover:text-white disabled:opacity-30 disabled:hover:text-pixora-text-muted transition-colors"
          >
            <Redo2 size={16} />
          </button>
        </div>

        {/* Creation Tools */}
        <div className="flex items-center bg-pixora-elevated rounded-lg p-0.5 border border-pixora-border">
          {/* Select & Hand */}
          {coreTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              title={`${tool.label} (${tool.shortcut})`}
              className={`p-1.5 rounded transition-all ${
                activeTool === tool.id
                  ? 'bg-pixora-accent text-white shadow-sm'
                  : 'text-pixora-text-muted hover:text-white hover:bg-pixora-hover'
              }`}
            >
              {tool.icon}
            </button>
          ))}

          <div className="w-px h-4 bg-pixora-border mx-0.5" />

          {/* Shapes Dropdown (Frame, Rect, Ellipse, Line, Text) */}
          <ShapesDropdown />

          <div className="w-px h-4 bg-pixora-border mx-0.5" />

          {/* Import Image Button */}
          <button
            onClick={handleImageClick}
            title="Import Image (PNG, JPG, WebP, SVG)"
            className="p-1.5 rounded text-pixora-text-muted hover:text-white hover:bg-pixora-hover transition-colors"
          >
            <ImageIcon size={16} />
          </button>
        </div>
      </div>

      {/* Right: Zoom, Save, Export & Help */}
      <div className="flex items-center space-x-2">
        {/* Zoom Controls */}
        <div className="hidden sm:flex items-center bg-pixora-elevated rounded-lg p-0.5 border border-pixora-border text-xs">
          <button
            onClick={zoomOut}
            title="Zoom Out"
            className="px-2 py-1 text-pixora-text-muted hover:text-white transition-colors"
          >
            -
          </button>
          <button
            onClick={resetZoom}
            title="Reset Zoom to 100%"
            className="px-1.5 py-1 font-mono text-pixora-text hover:text-white transition-colors"
          >
            {Math.round(viewport.zoom * 100)}%
          </button>
          <button
            onClick={zoomIn}
            title="Zoom In"
            className="px-2 py-1 text-pixora-text-muted hover:text-white transition-colors"
          >
            +
          </button>
        </div>

        {/* Open Project File */}
        <button
          onClick={handleOpenClick}
          title="Open .pixora Project File"
          className="hidden md:flex items-center space-x-1 px-2.5 py-1.5 bg-pixora-elevated hover:bg-pixora-hover text-xs font-medium text-pixora-text rounded-lg border border-pixora-border transition-colors"
        >
          <FolderOpen size={14} />
          <span>Open</span>
        </button>

        {/* Save Project File */}
        <button
          onClick={handleSaveClick}
          title="Save as .pixora File to Device"
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-pixora-elevated hover:bg-pixora-hover text-xs font-medium text-pixora-text rounded-lg border border-pixora-border transition-colors"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Save</span>
        </button>

        {/* Export Button */}
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-pixora-accent hover:bg-pixora-accent-hover text-xs font-semibold text-white rounded-lg shadow-sm transition-all"
        >
          <Maximize2 size={14} />
          <span>Export</span>
        </button>

        {/* Keyboard Shortcuts Cheat Sheet */}
        <button
          onClick={() => setIsShortcutsModalOpen(true)}
          title="Keyboard Shortcuts"
          className="p-1.5 text-pixora-text-muted hover:text-white transition-colors rounded-lg hover:bg-pixora-hover"
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  );
};
