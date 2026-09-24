import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  FolderOpen,
  Plus,
  Clock,
  Trash2,
  Copy,
  Download,
  Smartphone,
  Monitor,
  Camera,
  Layers,
  Sparkles,
  ArrowRight,
  MoreVertical,
  X,
  HardDrive,
  Database,
  Archive,
  Keyboard,
  Share2,
  CheckCircle2,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Laptop,
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
  duplicateRecentProject,
  RecentProjectItem,
} from '../../storage/db';
import { importPixoraFile } from '../../import/pixoraImporter';
import { savePixoraFile } from '../../export/pixoraExporter';
import { PixoraLogo } from '../common/PixoraLogo';
import { useOptionalEditor } from '../../editor/editorContext';

interface HomeScreenProps {
  onOpenProject: (doc: PixoraDocument) => void;
  onResumeActiveProject?: () => void;
  hasActiveProject?: boolean;
  activeProjectName?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenProject,
}) => {
  const optionalEditor = useOptionalEditor();

  const [recents, setRecents] = useState<RecentProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'canvas' | 'photo'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'az' | 'size'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Mobile Bottom Action Sheet state
  const [mobileSheetItem, setMobileSheetItem] = useState<RecentProjectItem | null>(null);

  // Modals & UI state
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customW, setCustomW] = useState(1200);
  const [customH, setCustomH] = useState(800);
  const [customName, setCustomName] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(() => {
    try {
      return localStorage.getItem('pixora_hide_how_it_works') !== 'true';
    } catch {
      return true;
    }
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadRecents();
  }, []);

  // Close card menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const loadRecents = async () => {
    const list = await getRecentProjects();
    setRecents(list);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleOpenLocalFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const doc = await importPixoraFile(file);
      onOpenProject(doc);
    } catch (err: any) {
      alert(err.message || 'Failed to open project.');
    }
    e.target.value = '';
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
          projectName: file.name.replace(/\.[^/.]+$/, ''),
          assetName: file.name,
          width: img.width,
          height: img.height,
        });
        onOpenProject(doc);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCreateFromPreset = (preset: ProjectPreset) => {
    const doc = createDefaultProject(preset, `${preset.name} Design`);
    onOpenProject(doc);
  };

  const handleCreateBlankCanvas = () => {
    const defaultPreset = PROJECT_PRESETS[0];
    const doc = createDefaultProject(defaultPreset, 'Untitled Design');
    onOpenProject(doc);
  };

  const handleCreateCustom = () => {
    const customPreset: ProjectPreset = {
      id: 'custom',
      name: 'Custom Frame',
      category: 'custom',
      width: customW,
      height: customH,
      description: `Custom ${customW} × ${customH}`,
    };
    const doc = createDefaultProject(customPreset, customName.trim() || 'Custom Design');
    setIsCustomModalOpen(false);
    onOpenProject(doc);
  };

  const handleCreateSample = () => {
    const doc = createSampleProject();
    onOpenProject(doc);
  };

  const handleCreateSamplePhoto = () => {
    const dataUrl = generateSamplePhotoDataUrl();
    const doc = createDefaultPhotoProject(dataUrl, {
      projectName: 'Scenic Sunset Photo',
      assetName: 'sunset-landscape.jpg',
      width: 1600,
      height: 1060,
    });
    onOpenProject(doc);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('Delete this project from recent history?')) {
      await deleteRecentProject(id);
      await loadRecents();
      showToast('Project deleted from IndexedDB');
    }
  };

  const handleDuplicate = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const duplicated = await duplicateRecentProject(id);
    if (duplicated) {
      await loadRecents();
      showToast('Project duplicated');
    }
  };

  const handleExport = (doc: PixoraDocument, e?: React.MouseEvent) => {
    e?.stopPropagation();
    savePixoraFile(doc);
    showToast('Snapshot exported (.pixora)');
  };

  const handleBackupAll = () => {
    const json = JSON.stringify(recents, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixora-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Snapshot backup compiled (${recents.length} projects)`);
  };

  const handleDismissHowItWorks = () => {
    setShowHowItWorks(false);
    try {
      localStorage.setItem('pixora_hide_how_it_works', 'true');
    } catch {}
    showToast('Tip dismissed');
  };

  // Compute storage utilization
  const storageUsedMB = useMemo(() => {
    let bytes = 0;
    for (const item of recents) {
      bytes += item.thumbnail ? item.thumbnail.length * 1.5 : 85000;
    }
    const mb = Math.max(1.4, Number((bytes / (1024 * 1024)).toFixed(1)));
    return mb;
  }, [recents]);

  const storageQuotaMB = 500;
  const storagePercent = Math.min(100, Number(((storageUsedMB / storageQuotaMB) * 100).toFixed(1)));

  const canvasCount = useMemo(
    () => recents.filter((r) => (r.projectType || 'canvas') === 'canvas').length,
    [recents]
  );
  const photoCount = useMemo(
    () => recents.filter((r) => r.projectType === 'photo').length,
    [recents]
  );

  const filteredRecents = useMemo(() => {
    let list = recents.filter((item) => {
      // Type filter
      if (filterType !== 'all') {
        const itemType = item.projectType || 'canvas';
        if (itemType !== filterType) return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(query);
      }
      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === 'az') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'size') {
        const sizeA = a.thumbnail ? a.thumbnail.length : 0;
        const sizeB = b.thumbnail ? b.thumbnail.length : 0;
        return sizeB - sizeA;
      }
      return 0;
    });

    return list;
  }, [recents, filterType, searchQuery, sortBy]);

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  const getEstimatedFileSize = (item: RecentProjectItem) => {
    if (item.projectType === 'photo') {
      const mb = ((item.thumbnail ? item.thumbnail.length : 250000) * 0.00003 + 2.4).toFixed(1);
      return `${mb} MB`;
    }
    const mb = ((item.thumbnail ? item.thumbnail.length : 80000) * 0.000015 + 0.9).toFixed(1);
    return `${mb} MB`;
  };

  const getDimensionsLabel = (item: RecentProjectItem) => {
    if (item.projectType === 'photo') {
      return '2400 × 3000 px';
    }
    const defaultDims = ['1200 × 630 px', 'A4 • 300 DPI', '1920 × 1080 px', '390 × 844 px'];
    const idx = Math.abs(item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % defaultDims.length;
    return defaultDims[idx];
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0B0F19] text-slate-100 select-none overflow-hidden font-sans">
      {/* Hidden file inputs */}
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

      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#111827]/90 backdrop-blur-md border-b border-[#1F2937] shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
        <div className="h-16 w-full px-4 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Brand & Navigation */}
          <div className="flex items-center gap-6 min-w-0">
            <div className="flex items-center gap-2.5 shrink-0">
              <PixoraLogo size={32} className="w-8 h-8 rounded-lg shadow-md" />
              <span className="font-semibold text-lg text-white tracking-tight">Pixora</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <span className="px-3 py-1.5 rounded-lg bg-[#1E293B] text-indigo-400 font-semibold border border-indigo-500/20 text-xs">
                Projects
              </span>
              <button
                onClick={handleCreateBlankCanvas}
                className="px-3 py-1.5 rounded-lg text-slate-400 text-xs hover:bg-[#1E293B]/70 hover:text-slate-100 transition-colors"
              >
                Canvas Editor
              </button>
              <button
                onClick={() => photoInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg text-slate-400 text-xs hover:bg-[#1E293B]/70 hover:text-slate-100 transition-colors"
              >
                Photo Editor
              </button>
            </nav>
          </div>

          {/* Center: Offline Status Pill (Desktop) */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#182234] border border-emerald-500/20 text-emerald-400 text-xs">
              <Laptop size={14} />
              <span>Saved to this browser</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Storage Meter Badge (Desktop) */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1E293B] border border-[#334155]/60 text-slate-300 text-xs cursor-help"
              title={`Local Browser Storage: ${storageUsedMB} MB used in IndexedDB`}
            >
              <HardDrive size={14} className="text-slate-400" />
              <span className="tabular-nums">{storageUsedMB} MB</span>
            </div>

            {/* Keyboard Shortcuts Button */}
            <button
              onClick={() => optionalEditor?.setIsShortcutsModalOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-[#1E293B] hover:text-slate-100 transition-colors"
              title="Keyboard Shortcuts"
              type="button"
            >
              <Keyboard size={16} />
            </button>

            {/* Avatar Pill */}
            <div className="w-8 h-8 rounded-full bg-indigo-600/80 ring-2 ring-indigo-400/30 flex items-center justify-center text-white text-xs font-semibold">
              P
            </div>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto w-full pt-16 pb-20 md:pb-12 bg-[#0B0F19]">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto flex flex-col gap-6">

          {/* Hero Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                <span>Offline First • Local Workspace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Your projects</h1>
              <p className="text-sm text-slate-400 max-w-2xl">
                Create something beautiful directly on your device
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={handleOpenLocalFile}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1E293B] border border-[#334155] text-slate-200 text-xs font-medium hover:bg-[#283548] hover:text-white transition-colors shadow-sm"
                type="button"
              >
                <FolderOpen size={15} />
                <span>Import Project</span>
              </button>
              <button
                onClick={handleBackupAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1E293B] border border-[#334155] text-slate-200 text-xs font-medium hover:bg-[#283548] hover:text-white transition-colors shadow-sm"
                title="Backup all projects"
                type="button"
              >
                <Archive size={15} />
                <span>Backup All</span>
              </button>
            </div>
          </div>

          {/* IndexedDB Local Storage Banner & Meter */}
          <div className="relative overflow-hidden rounded-xl bg-[#182234] border border-indigo-500/20 p-4 lg:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-black/20">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400">
                <Database size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">Stored locally in this browser</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold">
                    IndexedDB
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  Clearing website cookies or browsing data will remove your projects. Export your files anytime to back them up to your personal computer or cloud storage.
                </p>
                {/* Storage Meter Bar */}
                <div className="pt-2 flex flex-col gap-1 max-w-md">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>IndexedDB Pool</span>
                    <span className="text-slate-200 font-medium">
                      {storageUsedMB} MB / {storageQuotaMB} MB ({storagePercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#111827] h-1.5 rounded-full overflow-hidden border border-slate-700/50">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, storagePercent)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleBackupAll}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-semibold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
              type="button"
            >
              <Share2 size={14} />
              <span>Export Snapshot</span>
            </button>
          </div>

          {/* Quick Start Action Tiles (New Canvas & Edit Photo) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {/* New Canvas Tile */}
            <div className="group relative rounded-xl bg-[#182234] border border-[#273647] hover:border-indigo-500/50 p-6 lg:p-7 flex flex-col justify-between shadow-md hover:shadow-indigo-500/10 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 transition-transform group-hover:scale-105 duration-300 shadow-sm">
                    <Layers size={24} />
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#111827] border border-[#334155] text-slate-300 font-medium">
                    Vector &amp; Raster
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                    New Canvas
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Multi-layer graphic design, vector shapes, frames, visual compositions, and styled editorial typography.
                  </p>
                </div>
              </div>
              <div className="pt-6 mt-4 flex items-center justify-between border-t border-[#273647]">
                <button
                  onClick={handleCreateBlankCanvas}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 shadow-md shadow-indigo-900/40 active:scale-95 transition-all"
                  type="button"
                >
                  <Plus size={16} />
                  <span>Create Canvas</span>
                </button>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Figma / SVG ready</span>
                </div>
              </div>
            </div>

            {/* Edit Photo Tile */}
            <div className="group relative rounded-xl bg-[#182234] border border-[#273647] hover:border-sky-500/50 p-6 lg:p-7 flex flex-col justify-between shadow-md hover:shadow-sky-500/10 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 transition-transform group-hover:scale-105 duration-300 shadow-sm">
                    <Camera size={24} />
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#111827] border border-[#334155] text-slate-300 font-medium">
                    Non-destructive
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-white group-hover:text-sky-300 transition-colors">
                    Edit a Photo
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Crop, tune exposure and curves, apply tonal LUT filters, and add styled text overlays directly to images.
                  </p>
                </div>
              </div>
              <div className="pt-6 mt-4 flex items-center justify-between border-t border-[#273647]">
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#24334a] border border-[#3a4d6b] text-white text-xs font-semibold hover:bg-[#2d405d] shadow-sm active:scale-95 transition-all"
                  type="button"
                >
                  <Camera size={16} className="text-sky-400" />
                  <span>Open Photo</span>
                </button>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>RAW, WebP, JPEG, PNG</span>
                </div>
              </div>
            </div>
          </div>

          {/* Presets & Templates Strip ("Start a New Project") */}
          <div className="rounded-xl bg-[#182234] border border-[#273647] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-400" />
                <span>Start a New Project</span>
              </h2>
              <button
                onClick={() => setIsCustomModalOpen(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium flex items-center gap-1"
              >
                <span>Custom Size</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {/* Blank Canvas */}
              <button
                onClick={handleCreateBlankCanvas}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#111827] border border-[#273647] hover:border-indigo-500/50 hover:bg-[#1E293B] text-center transition-all group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2 group-hover:bg-indigo-500/20">
                  <Plus size={18} />
                </div>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">Blank Canvas</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Custom</span>
              </button>

              {/* Mobile App */}
              <button
                onClick={() => handleCreateFromPreset(PROJECT_PRESETS[0])}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#111827] border border-[#273647] hover:border-indigo-500/50 hover:bg-[#1E293B] text-center transition-all group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-2 group-hover:bg-sky-500/20">
                  <Smartphone size={18} />
                </div>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">Mobile App</span>
                <span className="text-[10px] text-slate-400 mt-0.5">390 × 844</span>
              </button>

              {/* Desktop Web */}
              <button
                onClick={() => handleCreateFromPreset(PROJECT_PRESETS[2])}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#111827] border border-[#273647] hover:border-indigo-500/50 hover:bg-[#1E293B] text-center transition-all group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2 group-hover:bg-indigo-500/20">
                  <Monitor size={18} />
                </div>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">Desktop Web</span>
                <span className="text-[10px] text-slate-400 mt-0.5">1440 × 900</span>
              </button>

              {/* Edit Photo */}
              <button
                onClick={() => photoInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#111827] border border-[#273647] hover:border-sky-500/50 hover:bg-[#1E293B] text-center transition-all group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-2 group-hover:bg-sky-500/20">
                  <Camera size={18} />
                </div>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">Edit Photo</span>
                <span className="text-[10px] text-slate-400 mt-0.5">From File</span>
              </button>

              {/* Load Sample Project */}
              <button
                onClick={handleCreateSample}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#111827] border border-[#273647] hover:border-purple-500/50 hover:bg-[#1E293B] text-center transition-all group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 group-hover:bg-purple-500/20">
                  <Sparkles size={18} />
                </div>
                <span className="text-xs font-semibold text-purple-300 group-hover:text-white">
                  ✨ Load Sample Project
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">UI Template</span>
              </button>

              {/* Load Sample Photo */}
              <button
                onClick={handleCreateSamplePhoto}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#111827] border border-[#273647] hover:border-emerald-500/50 hover:bg-[#1E293B] text-center transition-all group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:bg-emerald-500/20">
                  <Camera size={18} />
                </div>
                <span className="text-xs font-semibold text-emerald-300 group-hover:text-white">
                  Load Sample Photo
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Landscape</span>
              </button>

              {/* Custom Canvas */}
              <button
                onClick={() => setIsCustomModalOpen(true)}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#111827] border border-[#273647] hover:border-indigo-500/50 hover:bg-[#1E293B] text-center transition-all group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center mb-2 group-hover:bg-slate-700">
                  <SlidersHorizontal size={18} />
                </div>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white">Custom Size</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Enter W × H</span>
              </button>
            </div>
          </div>

          {/* Search, Filter & View Controls */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={16} />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by name, tags, or dimensions..."
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-[#111827] border border-[#273647] text-white placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Tabs, Sort & Layout Switcher */}
            <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5">
              {/* Filter Pills */}
              <div className="inline-flex rounded-lg bg-[#111827] border border-[#273647] p-1 gap-1">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    filterType === 'all'
                      ? 'bg-[#1E293B] text-indigo-300 shadow-sm border border-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  type="button"
                >
                  All Projects ({recents.length})
                </button>
                <button
                  onClick={() => setFilterType('canvas')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    filterType === 'canvas'
                      ? 'bg-[#1E293B] text-indigo-300 shadow-sm border border-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  type="button"
                >
                  Canvas ({canvasCount})
                </button>
                <button
                  onClick={() => setFilterType('photo')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    filterType === 'photo'
                      ? 'bg-[#1E293B] text-sky-300 shadow-sm border border-sky-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  type="button"
                >
                  Photos ({photoCount})
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  aria-label="Sort projects"
                  className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-[#111827] border border-[#273647] text-slate-200 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="newest" className="bg-[#111827] text-slate-200">
                    Last edited (Newest first)
                  </option>
                  <option value="az" className="bg-[#111827] text-slate-200">
                    Alphabetical (A-Z)
                  </option>
                  <option value="size" className="bg-[#111827] text-slate-200">
                    Largest file size
                  </option>
                </select>
              </div>

              {/* View Layout Switcher */}
              <div className="flex items-center rounded-lg bg-[#111827] border border-[#273647] p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded transition-all ${
                    viewMode === 'grid' ? 'text-indigo-400 bg-[#1E293B]' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Grid view"
                  type="button"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded transition-all ${
                    viewMode === 'list' ? 'text-indigo-400 bg-[#1E293B]' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="List view"
                  type="button"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Projects Content Area */}
          {filteredRecents.length === 0 ? (
            /* Empty State */
            <div className="rounded-xl bg-[#182234] border border-[#273647] p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#111827] border border-[#273647] flex items-center justify-center text-slate-400">
                <FolderOpen size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {searchQuery ? 'No matching projects found' : 'No recent projects yet'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  {searchQuery
                    ? 'Try adjusting your search query or clear the filter.'
                    : 'Start a new vector design canvas or import a photo to begin creating.'}
                </p>
              </div>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={handleCreateBlankCanvas}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  Create Blank Canvas
                </button>
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-[#24334a] hover:bg-[#2d405d] text-white text-xs font-semibold border border-[#3a4d6b] transition-colors"
                >
                  Open Photo
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {filteredRecents.map((item) => {
                const isPhoto = item.projectType === 'photo';
                const fileSize = getEstimatedFileSize(item);
                const dims = getDimensionsLabel(item);
                const photoAsset = item.data?.photo?.sourceAssetId
                  ? item.data.assets?.[item.data.photo.sourceAssetId]
                  : null;
                const hasThumbnail = !!item.thumbnail || !!photoAsset?.dataUrl;
                const thumbnailSrc = item.thumbnail || photoAsset?.dataUrl;

                return (
                  <article
                    key={item.id}
                    onClick={() => onOpenProject(item.data)}
                    className="group rounded-xl bg-[#182234] border border-[#273647] hover:border-indigo-500/40 flex flex-col overflow-hidden shadow-sm hover:shadow-lg hover:shadow-black/40 transition-all duration-200 cursor-pointer"
                  >
                    {/* Card Thumbnail */}
                    <div className="relative w-full aspect-[16/10] bg-[#111827] overflow-hidden">
                      {hasThumbnail && thumbnailSrc ? (
                        <img
                          src={thumbnailSrc}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#111827] via-[#141b2a] to-[#182234] relative group-hover:scale-105 transition-transform duration-500">
                          {/* Subtle background grid pattern */}
                          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px] opacity-25" />
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md relative z-10 ${
                              isPhoto ? 'bg-sky-500/20 text-sky-400' : 'bg-indigo-500/20 text-indigo-400'
                            }`}
                          >
                            {isPhoto ? <Camera size={24} /> : <Layers size={24} />}
                          </div>
                        </div>
                      )}

                      {/* Top Type Pill */}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm border backdrop-blur-sm text-white ${
                            isPhoto
                              ? 'bg-sky-600/90 border-sky-400/30'
                              : 'bg-indigo-600/90 border-indigo-400/30'
                          }`}
                        >
                          {isPhoto ? <Camera size={12} /> : <Layers size={12} />}
                          <span>{isPhoto ? 'Photo' : 'Canvas'}</span>
                        </span>
                      </div>

                      {/* Top Right Menu Trigger */}
                      <div className="absolute top-3 right-3 opacity-90 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.innerWidth < 768) {
                              setMobileSheetItem(item);
                            } else {
                              setActiveMenuId(activeMenuId === item.id ? null : item.id);
                            }
                          }}
                          className="w-8 h-8 rounded-lg bg-[#111827]/90 backdrop-blur-md text-slate-200 border border-[#334155] flex items-center justify-center hover:bg-[#1E293B] hover:text-white shadow-sm"
                          title="Project options"
                          type="button"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Desktop Dropdown Menu */}
                        {activeMenuId === item.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-9 w-44 bg-[#111827] border border-[#273647] rounded-xl shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs"
                          >
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);
                                await handleDuplicate(item.id);
                              }}
                              className="w-full px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-[#1E293B] flex items-center gap-2"
                            >
                              <Copy size={13} />
                              <span>Duplicate</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);
                                if (item.data) handleExport(item.data);
                              }}
                              className="w-full px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-[#1E293B] flex items-center gap-2"
                            >
                              <Download size={13} />
                              <span>Export (.pixora)</span>
                            </button>
                            <div className="h-[1px] bg-[#273647] my-1" />
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);
                                await handleDelete(item.id);
                              }}
                              className="w-full px-3 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2"
                            >
                              <Trash2 size={13} />
                              <span>Delete Project</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Bottom Dimensions Pill */}
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-[#0B0F19]/85 backdrop-blur-sm text-slate-200 border border-slate-700/50 text-[10px] font-mono tabular-nums">
                        {dims}
                      </div>
                    </div>

                    {/* Card Content & Details */}
                    <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                          <Clock size={13} className="text-emerald-400" />
                          <span>Edited {formatRelativeTime(item.updatedAt)}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#273647]/70">
                        <span className="text-xs text-slate-400 font-mono">{fileSize}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleDuplicate(item.id, e)}
                            className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-[#24334a] transition-colors"
                            title="Duplicate"
                            type="button"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.data) handleExport(item.data, e);
                            }}
                            className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-[#24334a] transition-colors"
                            title="Export"
                            type="button"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                            type="button"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {/* Start from a Template Dashed Card */}
              <div
                onClick={() => setIsCustomModalOpen(true)}
                className="rounded-xl bg-[#111827]/70 border-2 border-dashed border-[#273647] hover:border-indigo-500/50 p-6 flex flex-col items-center justify-center text-center gap-3 shadow-sm min-h-[240px] group hover:bg-[#182234]/60 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-[#1E293B] border border-[#334155] flex items-center justify-center text-indigo-400 shadow-sm group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Plus size={22} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm text-white">Start from a template</h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Choose from preset social sizes, paper print dimensions, or device mockups.
                  </p>
                </div>
                <span className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1">
                  <span>Explore Template Library</span>
                  <ArrowRight size={13} />
                </span>
              </div>
            </div>
          ) : (
            /* List View */
            <div className="rounded-xl bg-[#182234] border border-[#273647] overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#273647] bg-[#111827] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Last Modified</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#273647]/50">
                  {filteredRecents.map((item) => {
                    const isPhoto = item.projectType === 'photo';
                    return (
                      <tr
                        key={item.id}
                        onClick={() => onOpenProject(item.data)}
                        className="hover:bg-[#1E293B]/60 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isPhoto
                                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                                  : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                              }`}
                            >
                              {isPhoto ? <Camera size={16} /> : <Layers size={16} />}
                            </div>
                            <span className="font-semibold text-slate-100 group-hover:text-indigo-300 truncate">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                              isPhoto
                                ? 'bg-sky-950/60 text-sky-400 border-sky-500/20'
                                : 'bg-indigo-950/60 text-indigo-400 border-indigo-500/20'
                            }`}
                          >
                            {isPhoto ? 'Photo' : 'Canvas'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {formatRelativeTime(item.updatedAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDuplicate(item.id)}
                              className="p-1.5 rounded hover:bg-[#24334a] text-slate-400 hover:text-slate-100"
                              title="Duplicate"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (item.data) handleExport(item.data);
                              }}
                              className="p-1.5 rounded hover:bg-[#24334a] text-slate-400 hover:text-slate-100"
                              title="Export"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* "How Pixora works" Guide / Tip Card (Dismissible) */}
          {showHowItWorks && (
            <aside className="relative rounded-xl bg-[#182234] border border-[#273647] p-6 shadow-lg overflow-hidden mt-2">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-4 max-w-4xl">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <Sparkles size={14} />
                    </span>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">How Pixora works</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs w-5 h-5 rounded-full bg-[#111827] border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                          1
                        </span>
                        <h3 className="font-semibold text-xs text-slate-200">Instant Start</h3>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        No sign-up or accounts required. Launch the workspace and start designing right away with zero telemetry overhead.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs w-5 h-5 rounded-full bg-[#111827] border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                          2
                        </span>
                        <h3 className="font-semibold text-xs text-slate-200">Local &amp; Private</h3>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Files never touch a remote server. Everything is calculated in WebAssembly and rendered locally in your GPU memory.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs w-5 h-5 rounded-full bg-[#111827] border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                          3
                        </span>
                        <h3 className="font-semibold text-xs text-slate-200">Quick Export</h3>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Save crisp PNG, WebP, JPG, or SVG vectors in exact pixel scales with color space profiles preserved for production.
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDismissHowItWorks}
                  aria-label="Dismiss tutorial reference"
                  className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:bg-[#1E293B] hover:text-white transition-colors"
                  title="Dismiss guide"
                  type="button"
                >
                  <X size={16} />
                </button>
              </div>
            </aside>
          )}

        </div>
      </main>

      {/* Mobile Bottom Sheet Menu (Slide up) */}
      {mobileSheetItem && (
        <div
          onClick={() => setMobileSheetItem(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-[#182234] border-t border-[#273647] p-4 rounded-t-2xl flex flex-col gap-3 shadow-2xl animate-in slide-in-from-bottom duration-200 pb-safe"
          >
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-1" />
            <div className="flex items-center justify-between pb-1">
              <span className="font-semibold text-sm text-white truncate pr-4">
                {mobileSheetItem.name}
              </span>
              <button
                onClick={() => setMobileSheetItem(null)}
                className="w-7 h-7 rounded-full bg-[#1E293B] flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex flex-col gap-1 text-xs">
              <button
                onClick={() => {
                  const data = mobileSheetItem.data;
                  setMobileSheetItem(null);
                  if (data) onOpenProject(data);
                }}
                className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-[#1E293B] text-slate-100 text-left font-medium"
              >
                <Layers size={18} className="text-indigo-400" />
                <span>Open in Editor</span>
              </button>
              <button
                onClick={async () => {
                  const id = mobileSheetItem.id;
                  setMobileSheetItem(null);
                  await handleDuplicate(id);
                }}
                className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-[#1E293B] text-slate-100 text-left font-medium"
              >
                <Copy size={18} className="text-sky-400" />
                <span>Duplicate Project</span>
              </button>
              <button
                onClick={() => {
                  const data = mobileSheetItem.data;
                  setMobileSheetItem(null);
                  if (data) handleExport(data);
                }}
                className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-[#1E293B] text-slate-100 text-left font-medium"
              >
                <Download size={18} className="text-slate-300" />
                <span>Export Snapshot (.pixora)</span>
              </button>
              <button
                onClick={async () => {
                  const id = mobileSheetItem.id;
                  setMobileSheetItem(null);
                  await handleDelete(id);
                }}
                className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-red-500/10 text-red-400 text-left font-medium"
              >
                <Trash2 size={18} className="text-red-400" />
                <span>Delete from IndexedDB</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe bg-[#0B0F19]/90 backdrop-blur-xl border-t border-[#1F2937] shadow-[0_-2px_12px_rgba(0,0,0,0.35)] md:hidden">
        <div className="flex justify-around items-center h-16 px-2">
          <button
            className="flex flex-col items-center justify-center w-16 h-12 text-indigo-400 font-semibold"
            type="button"
          >
            <FolderOpen size={20} />
            <span className="text-[10px] mt-1">Projects</span>
          </button>
          <button
            onClick={handleCreateBlankCanvas}
            className="flex flex-col items-center justify-center w-16 h-12 text-slate-400 hover:text-slate-100 transition-colors"
            type="button"
          >
            <Layers size={20} />
            <span className="text-[10px] mt-1">Canvas</span>
          </button>
          <button
            onClick={() => photoInputRef.current?.click()}
            className="flex flex-col items-center justify-center w-16 h-12 text-slate-400 hover:text-slate-100 transition-colors"
            type="button"
          >
            <Camera size={20} />
            <span className="text-[10px] mt-1">Photo</span>
          </button>
          <button
            onClick={() => optionalEditor?.setIsShortcutsModalOpen(true)}
            className="flex flex-col items-center justify-center w-16 h-12 text-slate-400 hover:text-slate-100 transition-colors"
            type="button"
          >
            <Keyboard size={20} />
            <span className="text-[10px] mt-1">Shortcuts</span>
          </button>
        </div>
      </nav>

      {/* Interactive Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-[#1E293B] border border-indigo-500/30 text-white px-4 py-2 rounded-full shadow-2xl text-xs font-medium flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Custom Size Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#182234] border border-[#273647] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#273647] pb-3">
              <h3 className="text-sm font-bold text-white">Custom Canvas Dimensions</h3>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Custom Design"
                  className="w-full bg-[#111827] border border-[#273647] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    min={100}
                    max={8000}
                    value={customW}
                    onChange={(e) => setCustomW(Number(e.target.value))}
                    className="w-full bg-[#111827] border border-[#273647] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    min={100}
                    max={8000}
                    value={customH}
                    onChange={(e) => setCustomH(Number(e.target.value))}
                    className="w-full bg-[#111827] border border-[#273647] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#273647]">
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#1E293B]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustom}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Create Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
