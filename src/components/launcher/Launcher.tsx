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
  Camera,
  Layout,
  UploadCloud,
  Sparkles,
} from 'lucide-react';
import { PixoraDocument } from '../../types/document';
import { PROJECT_PRESETS, ProjectPreset } from '../../types/preset';
import { createDefaultProject, createSampleProject } from '../../document/defaultProject';
import {
  createDefaultPhotoProject,
  generateSamplePhotoDataUrl,
} from '../../document/defaultPhotoProject';
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
  const [projectTypeTab, setProjectTypeTab] = useState<'canvas' | 'photo'>('canvas');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const doc = createDefaultPhotoProject(dataUrl, {
          projectName: projectName.trim() || file.name.replace(/\.[^/.]+$/, ''),
          assetName: file.name,
          width: img.width,
          height: img.height,
        });
        onSelectProject(doc);
        onClose();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCreateSamplePhoto = () => {
    const dataUrl = generateSamplePhotoDataUrl();
    const doc = createDefaultPhotoProject(dataUrl, {
      projectName: projectName.trim() || 'Scenic Sunset Photo',
      assetName: 'sunset-landscape.jpg',
      width: 1600,
      height: 1060,
    });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2.5 sm:p-4 select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pixora,application/json"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      <div className="bg-pixora-surface border border-pixora-border rounded-2xl shadow-pixora-modal w-full max-w-3xl max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-5 border-b border-pixora-border bg-pixora-surface gap-3">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white text-sm font-black tracking-tighter">P</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white tracking-wide flex items-center space-x-2">
                <span>Pixora</span>
                <span className="text-[10px] sm:text-[11px] font-normal px-1.5 sm:px-2 py-0.5 rounded-full bg-pixora-elevated text-pixora-selection border border-pixora-border whitespace-nowrap">
                  Local-First
                </span>
              </h2>
              <p className="text-xs text-pixora-text-muted truncate max-w-[180px] xs:max-w-xs sm:max-w-none">
                Create something beautiful directly on your device
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={handleOpenLocalFile}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 bg-pixora-elevated hover:bg-pixora-hover text-xs font-medium text-pixora-text rounded-lg border border-pixora-border transition-colors whitespace-nowrap"
            >
              <FolderOpen size={14} className="flex-shrink-0" />
              <span className="hidden sm:inline">Open .pixora File</span>
              <span className="sm:hidden">Open File</span>
            </button>
            {hasActiveProject && (
              <button
                onClick={onClose}
                className="text-pixora-text-muted hover:text-white p-1 rounded-lg hover:bg-pixora-hover transition-colors flex-shrink-0"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Local Recovery Banner */}
        {hasActiveProject && (
          <div className="px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-indigo-950/40 to-sky-950/30 border-b border-pixora-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2 text-xs min-w-0 flex-1">
              <FileCheck size={16} className="text-emerald-400 flex-shrink-0" />
              <div className="flex items-center space-x-1.5 min-w-0">
                <span className="text-white font-medium whitespace-nowrap">Locally saved project:</span>
                <span className="text-pixora-selection font-semibold truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs">
                  "{activeProjectName || 'Untitled Project'}"
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center space-x-1 px-3 py-1.5 sm:py-1 bg-pixora-accent hover:bg-pixora-accent-hover text-white text-xs font-semibold rounded-md shadow-sm transition-all whitespace-nowrap self-end sm:self-auto w-full sm:w-auto"
            >
              <span>Continue Editing</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center border-b border-pixora-border px-4 sm:px-6 bg-pixora-bg">
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'create' ? (
            <div className="space-y-4 sm:space-y-5">
              {/* Project Type Switcher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 p-1 bg-pixora-bg rounded-xl border border-pixora-border">
                <button
                  type="button"
                  onClick={() => setProjectTypeTab('canvas')}
                  className={`flex items-start sm:items-center gap-3 p-3 rounded-lg text-left transition-all ${
                    projectTypeTab === 'canvas'
                      ? 'bg-pixora-elevated border border-pixora-accent/40 shadow-sm'
                      : 'hover:bg-pixora-hover/60 border border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 ${
                      projectTypeTab === 'canvas'
                        ? 'bg-sky-500/20 text-sky-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Layout size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                      <span>Canvas Project</span>
                      {projectTypeTab === 'canvas' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 font-normal">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-pixora-text-dim mt-0.5 leading-snug">
                      Multi-page design, vector shapes, frames, layouts
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProjectTypeTab('photo')}
                  className={`flex items-start sm:items-center gap-3 p-3 rounded-lg text-left transition-all ${
                    projectTypeTab === 'photo'
                      ? 'bg-pixora-elevated border border-emerald-500/40 shadow-sm'
                      : 'hover:bg-pixora-hover/60 border border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 ${
                      projectTypeTab === 'photo'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Camera size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                      <span>Photo Project</span>
                      {projectTypeTab === 'photo' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-normal">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-pixora-text-dim mt-0.5 leading-snug">
                      Single-image editor, non-destructive filters & retouch
                    </div>
                  </div>
                </button>
              </div>

              {/* Project Name */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 sm:max-w-sm">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-pixora-text-muted mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    placeholder={
                      projectTypeTab === 'photo'
                        ? 'Enter photo project name...'
                        : 'Enter project name...'
                    }
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    className="w-full bg-pixora-elevated border border-pixora-border focus:border-pixora-selection rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                {projectTypeTab === 'canvas' ? (
                  <div className="flex items-end">
                    <button
                      onClick={handleCreateSample}
                      className="w-full sm:w-auto px-3.5 py-2 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/40 hover:to-indigo-600/40 text-purple-200 border border-purple-500/40 rounded-lg text-xs font-medium transition-all text-center"
                    >
                      ✨ Load Sample Project
                    </button>
                  </div>
                ) : (
                  <div className="flex items-end">
                    <button
                      onClick={handleCreateSamplePhoto}
                      className="w-full sm:w-auto px-3.5 py-2 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/40 hover:to-teal-600/40 text-emerald-200 border border-emerald-500/40 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={13} />
                      <span>Load Sample Photo</span>
                    </button>
                  </div>
                )}
              </div>

              {projectTypeTab === 'canvas' ? (
                <>
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
                </>
              ) : (
                /* Photo Project Creation Options */
                <div className="space-y-4">
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className="p-6 sm:p-8 border-2 border-dashed border-emerald-500/30 hover:border-emerald-500/70 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center text-center group"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <UploadCloud size={26} />
                    </div>
                    <div className="text-sm font-bold text-white mb-1">
                      Choose a Photo from Your Device
                    </div>
                    <div className="text-xs text-pixora-text-dim max-w-sm">
                      JPEG, PNG, WebP or HEIC. Photos remain entirely on your device and are never uploaded to any cloud.
                    </div>
                    <button
                      type="button"
                      className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all w-full sm:w-auto"
                    >
                      Browse Files
                    </button>
                  </div>

                  {/* Photo Editor Feature Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs text-pixora-text-dim">
                    <div className="p-3 bg-pixora-elevated rounded-xl border border-pixora-border">
                      <div className="font-semibold text-white mb-1">Non-Destructive</div>
                      <div>Original photo asset is preserved. Adjustments and filters are live-rendered.</div>
                    </div>
                    <div className="p-3 bg-pixora-elevated rounded-xl border border-pixora-border">
                      <div className="font-semibold text-white mb-1">Pro Adjustments</div>
                      <div>Light, color, details, vignette, grain, spot healing retouch, and text layers.</div>
                    </div>
                    <div className="p-3 bg-pixora-elevated rounded-xl border border-pixora-border">
                      <div className="font-semibold text-white mb-1">High-Res Export</div>
                      <div>Export directly to JPEG, PNG, or WebP with custom resolution scales.</div>
                    </div>
                  </div>
                </div>
              )}
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
                  {recents.map(item => {
                    const isPhoto = item.projectType === 'photo';
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectProject(item.data);
                          onClose();
                        }}
                        className="group p-3.5 bg-pixora-elevated hover:bg-pixora-hover rounded-xl border border-pixora-border hover:border-pixora-accent/40 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3 truncate flex-1 mr-2">
                          <div
                            className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
                              isPhoto
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20'
                                : 'bg-pixora-surface border-pixora-border text-pixora-selection group-hover:bg-pixora-accent/20'
                            } transition-colors`}
                          >
                            {isPhoto ? <Camera size={18} /> : <Layout size={18} />}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-semibold text-white truncate group-hover:text-pixora-selection transition-colors flex items-center gap-1.5">
                              <span>{item.name}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                                  isPhoto
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                                }`}
                              >
                                {isPhoto ? 'Photo' : 'Canvas'}
                              </span>
                            </div>
                            <div className="text-[11px] text-pixora-text-dim flex items-center space-x-2 mt-0.5">
                              <span>{isPhoto ? 'Photo Project' : `${item.objectCount} objects`}</span>
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
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-pixora-elevated border-t border-pixora-border flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-0 text-[11px] text-pixora-text-dim text-center sm:text-left">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
            <span>Your project is stored on this device. No cloud storage, no account.</span>
          </div>
          <span className="text-pixora-text-dim/80 whitespace-nowrap">Format: .pixora (v2)</span>
        </div>
      </div>
    </div>
  );
};
