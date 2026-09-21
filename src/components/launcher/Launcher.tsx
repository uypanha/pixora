import React, { useState, useEffect, useRef } from 'react';
import {
  FolderOpen,
  Plus,
  Clock,
  Trash2,
  Smartphone,
  Tablet,
  Monitor,
  Presentation,
  Share2,
  X,
  FileCheck,
  ArrowRight,
} from 'lucide-react';
import { PixoraDocument } from '../../types/document';
import { PROJECT_PRESETS, ProjectPreset } from '../../types/preset';
import { createDefaultProject, createSampleProject } from '../../document/defaultProject';
import {
  getRecentProjects,
  deleteRecentProject,
  clearAllProjects,
  RecentProjectItem,
} from '../../storage/db';
import { importPixoraFile } from '../../import/pixoraImporter';

interface LauncherProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (doc: PixoraDocument) => void;
  hasActiveProject: boolean;
  activeProjectName?: string;
}

export const Launcher: React.FC<LauncherProps> = ({
  isOpen,
  onClose,
  onSelectProject,
  hasActiveProject,
  activeProjectName,
}) => {
  const [recents, setRecents] = useState<RecentProjectItem[]>([]);
  const [customW, setCustomW] = useState(1200);
  const [customH, setCustomH] = useState(800);
  const [projectName, setProjectName] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'recents'>('create');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRecents();
    }
  }, [isOpen]);

  const loadRecents = async () => {
    const list = await getRecentProjects();
    setRecents(list);
  };

  if (!isOpen) return null;

  const handleCreateFromPreset = (preset?: ProjectPreset) => {
    const name = projectName.trim() || (preset ? `${preset.name} Design` : 'Untitled Design');
    const doc = createDefaultProject(preset, name);
    onSelectProject(doc);
    onClose();
  };

  const handleCreateCustom = () => {
    const name = projectName.trim() || 'Custom Design';
    const customPreset: ProjectPreset = {
      id: 'custom',
      name: 'Custom Frame',
      category: 'custom',
      width: customW,
      height: customH,
      description: `Custom ${customW} × ${customH}`,
    };
    const doc = createDefaultProject(customPreset, name);
    onSelectProject(doc);
    onClose();
  };

  const handleCreateSample = () => {
    const doc = createSampleProject();
    onSelectProject(doc);
    onClose();
  };

  const handleOpenLocalFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const doc = await importPixoraFile(file);
      onSelectProject(doc);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to open project.');
    }
    e.target.value = '';
  };

  const handleDeleteRecent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteRecentProject(id);
    await loadRecents();
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all local projects stored in this browser?')) {
      await clearAllProjects();
      await loadRecents();
    }
  };

  const getPresetIcon = (cat: string) => {
    switch (cat) {
      case 'mobile':
        return <Smartphone size={18} className="text-sky-400" />;
      case 'tablet':
        return <Tablet size={18} className="text-purple-400" />;
      case 'desktop':
        return <Monitor size={18} className="text-indigo-400" />;
      case 'presentation':
        return <Presentation size={18} className="text-pink-400" />;
      case 'social':
        return <Share2 size={18} className="text-emerald-400" />;
      default:
        return <Plus size={18} className="text-white" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pixora,application/json"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="bg-pixora-surface border border-pixora-border rounded-2xl shadow-pixora-modal w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-pixora-border bg-pixora-surface">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-black tracking-tighter">P</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center space-x-2">
                <span>Pixora</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-pixora-elevated text-pixora-selection border border-pixora-border">
                  Local-First
                </span>
              </h2>
              <p className="text-xs text-pixora-text-muted">
                Create something beautiful directly on your device
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenLocalFile}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-pixora-elevated hover:bg-pixora-hover text-xs font-medium text-pixora-text rounded-lg border border-pixora-border transition-colors"
            >
              <FolderOpen size={14} />
              <span>Open .pixora File</span>
            </button>
            {hasActiveProject && (
              <button
                onClick={onClose}
                className="text-pixora-text-muted hover:text-white p-1 rounded-lg hover:bg-pixora-hover transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Local Recovery Banner */}
        {hasActiveProject && (
          <div className="px-6 py-3 bg-gradient-to-r from-indigo-950/40 to-sky-950/30 border-b border-pixora-border/60 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs">
              <FileCheck size={16} className="text-emerald-400" />
              <span className="text-white font-medium">We found a locally saved project:</span>
              <span className="text-pixora-selection font-semibold truncate max-w-xs">
                "{activeProjectName || 'Untitled Project'}"
              </span>
            </div>
            <button
              onClick={onClose}
              className="flex items-center space-x-1 px-3 py-1 bg-pixora-accent hover:bg-pixora-accent-hover text-white text-xs font-semibold rounded-md shadow-sm transition-all"
            >
              <span>Continue Editing</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center border-b border-pixora-border px-6 bg-pixora-bg">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-3 text-xs font-semibold mr-6 border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-pixora-accent text-white'
                : 'border-transparent text-pixora-text-muted hover:text-white'
            }`}
          >
            New Project
          </button>
          <button
            onClick={() => setActiveTab('recents')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'recents'
                ? 'border-pixora-accent text-white'
                : 'border-transparent text-pixora-text-muted hover:text-white'
            }`}
          >
            <span>Recent Projects</span>
            <span className="px-1.5 py-0.2 rounded-full bg-pixora-elevated text-[10px] text-pixora-text-dim">
              {recents.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'create' ? (
            <div className="space-y-5">
              {/* Project Name & Sample button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 max-w-sm">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-pixora-text-muted mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter project name..."
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    className="w-full bg-pixora-elevated border border-pixora-border focus:border-pixora-selection rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleCreateSample}
                    className="px-3.5 py-2 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/40 hover:to-indigo-600/40 text-purple-200 border border-purple-500/40 rounded-lg text-xs font-medium transition-all"
                  >
                    ✨ Load Sample Project
                  </button>
                </div>
              </div>

              {/* Standard Presets Grid */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-pixora-text-muted mb-2">
                  Canvas Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PROJECT_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => handleCreateFromPreset(preset)}
                      className="group p-3.5 bg-pixora-elevated hover:bg-pixora-hover rounded-xl border border-pixora-border hover:border-pixora-accent/50 text-left transition-all flex flex-col justify-between h-28"
                    >
                      <div className="flex items-center justify-between w-full">
                        {getPresetIcon(preset.category)}
                        <span className="text-[11px] font-mono text-pixora-text-dim group-hover:text-pixora-selection transition-colors">
                          {preset.width} × {preset.height}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-pixora-selection transition-colors">
                          {preset.name}
                        </div>
                        <div className="text-[10px] text-pixora-text-dim truncate">
                          {preset.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Size Option */}
              <div className="bg-pixora-elevated p-4 rounded-xl border border-pixora-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-white">Custom Dimensions</div>
                  <div className="text-[11px] text-pixora-text-dim">
                    Create a blank canvas with specific width & height
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-pixora-surface px-2 py-1.5 rounded border border-pixora-border text-xs">
                    <span className="text-pixora-text-dim mr-1 font-mono">W</span>
                    <input
                      type="number"
                      min={100}
                      max={8000}
                      value={customW}
                      onChange={e => setCustomW(Number(e.target.value))}
                      className="bg-transparent text-white font-mono w-16 text-right outline-none"
                    />
                  </div>
                  <span className="text-pixora-text-dim">×</span>
                  <div className="flex items-center bg-pixora-surface px-2 py-1.5 rounded border border-pixora-border text-xs">
                    <span className="text-pixora-text-dim mr-1 font-mono">H</span>
                    <input
                      type="number"
                      min={100}
                      max={8000}
                      value={customH}
                      onChange={e => setCustomH(Number(e.target.value))}
                      className="bg-transparent text-white font-mono w-16 text-right outline-none"
                    />
                  </div>

                  <button
                    onClick={handleCreateCustom}
                    className="px-4 py-2 bg-pixora-accent hover:bg-pixora-accent-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Recents Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-pixora-text-dim">
                <span>Projects stored locally in your browser (IndexedDB)</span>
                {recents.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-pixora-danger hover:underline text-[11px]"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {recents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-pixora-text-dim">
                  <Clock size={32} className="mb-2 opacity-40" />
                  <p>No recent local projects found.</p>
                  <p className="text-[11px] mt-1 text-pixora-text-dim/70">
                    Projects you create are automatically autosaved to this device.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recents.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectProject(item.data);
                        onClose();
                      }}
                      className="group p-3.5 bg-pixora-elevated hover:bg-pixora-hover rounded-xl border border-pixora-border hover:border-pixora-accent/40 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3 truncate flex-1 mr-2">
                        <div className="w-10 h-10 rounded-lg bg-pixora-surface border border-pixora-border flex items-center justify-center text-pixora-selection group-hover:bg-pixora-accent/20 transition-colors shrink-0">
                          <FolderOpen size={18} />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-white truncate group-hover:text-pixora-selection transition-colors">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-pixora-text-dim flex items-center space-x-2 mt-0.5">
                            <span>{item.objectCount} objects</span>
                            <span>•</span>
                            <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={e => handleDeleteRecent(item.id, e)}
                        title="Delete from browser recovery"
                        className="p-1.5 text-pixora-text-dim hover:text-pixora-danger rounded hover:bg-pixora-surface transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 bg-pixora-elevated border-t border-pixora-border flex items-center justify-between text-[11px] text-pixora-text-dim">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Your project is stored on this device. No cloud storage, no account.</span>
          </div>
          <span>Format: .pixora (v1)</span>
        </div>
      </div>
    </div>
  );
};
