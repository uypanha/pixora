import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LayoutGrid,
  List,
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
  Layout,
  Sparkles,
  ArrowRight,
  UploadCloud,
  MoreVertical,
  X,
  SlidersHorizontal,
  HardDrive,
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
  clearAllProjects,
  RecentProjectItem,
} from '../../storage/db';
import { importPixoraFile } from '../../import/pixoraImporter';
import { savePixoraFile } from '../../export/pixoraExporter';

interface HomeScreenProps {
  onOpenProject: (doc: PixoraDocument) => void;
  onResumeActiveProject?: () => void;
  hasActiveProject: boolean;
  activeProjectName?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenProject,
  onResumeActiveProject,
  hasActiveProject,
  activeProjectName,
}) => {
  const [recents, setRecents] = useState<RecentProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'canvas' | 'photo'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customW, setCustomW] = useState(1200);
  const [customH, setCustomH] = useState(800);
  const [customName, setCustomName] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadRecents();
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const loadRecents = async () => {
    const list = await getRecentProjects();
    setRecents(list);
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
    }
  };

  const handleDuplicate = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const duplicated = await duplicateRecentProject(id);
    if (duplicated) {
      await loadRecents();
    }
  };

  const handleExport = (doc: PixoraDocument, e?: React.MouseEvent) => {
    e?.stopPropagation();
    savePixoraFile(doc);
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all local projects stored in this browser?')) {
      await clearAllProjects();
      await loadRecents();
    }
  };

  const filteredRecents = useMemo(() => {
    return recents.filter((item) => {
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
  }, [recents, filterType, searchQuery]);

  const canvasCount = useMemo(
    () => recents.filter((r) => (r.projectType || 'canvas') === 'canvas').length,
    [recents]
  );
  const photoCount = useMemo(
    () => recents.filter((r) => r.projectType === 'photo').length,
    [recents]
  );

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

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
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
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 sm:px-6 flex items-center justify-between gap-4 flex-shrink-0 z-20">
        {/* Brand */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-black tracking-tighter">P</span>
          </div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-white tracking-wide">Pixora</h1>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-sky-400 border border-slate-700/80">
              Local-First
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-auto hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recent projects..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-800/80 border border-slate-700/80 focus:border-sky-500 rounded-lg text-xs text-white placeholder-slate-400 outline-none transition-all"
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
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          {hasActiveProject && onResumeActiveProject && (
            <button
              onClick={onResumeActiveProject}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              title="Return to the currently open project in the editor"
            >
              <span>Continue: {activeProjectName || 'Untitled'}</span>
              <ArrowRight size={13} />
            </button>
          )}

          <button
            onClick={handleOpenLocalFile}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
          >
            <FolderOpen size={14} className="text-slate-400" />
            <span className="hidden sm:inline">Open .pixora File</span>
            <span className="sm:hidden">Open</span>
          </button>
        </div>
      </header>

      {/* Main Layout: Left Sidebar + Center Dashboard Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar (Desktop) */}
        <aside className="w-56 border-r border-slate-800/80 bg-slate-900/40 p-4 hidden md:flex flex-col justify-between flex-shrink-0">
          <div className="space-y-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2">
                Views
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => setFilterType('all')}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    filterType === 'all'
                      ? 'bg-sky-500/15 text-sky-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Clock size={16} />
                    <span>Recent Projects</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {recents.length}
                  </span>
                </button>

                <button
                  onClick={() => setFilterType('canvas')}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    filterType === 'canvas'
                      ? 'bg-sky-500/15 text-sky-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Layout size={16} />
                    <span>Canvas Projects</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {canvasCount}
                  </span>
                </button>

                <button
                  onClick={() => setFilterType('photo')}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    filterType === 'photo'
                      ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Camera size={16} />
                    <span>Photo Projects</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {photoCount}
                  </span>
                </button>
              </nav>
            </div>

            {/* Quick Actions */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2">
                New Project
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={handleCreateBlankCanvas}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                >
                  <Plus size={14} className="text-sky-400" />
                  <span>Blank Canvas</span>
                </button>
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                >
                  <Plus size={14} className="text-emerald-400" />
                  <span>New Photo Edit</span>
                </button>
                <button
                  onClick={() => setIsCustomModalOpen(true)}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                >
                  <SlidersHorizontal size={14} className="text-purple-400" />
                  <span>Custom Size...</span>
                </button>
              </div>
            </div>
          </div>

          {/* Storage Details */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center space-x-1.5 text-slate-300 font-medium mb-1">
              <HardDrive size={13} className="text-emerald-400" />
              <span>Offline & Local</span>
            </div>
            <div className="text-[10px] leading-tight mb-2 text-slate-400">
              Projects autosave to IndexedDB on this device.
            </div>
            {recents.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors"
              >
                Clear All Projects
              </button>
            )}
          </div>
        </aside>

        {/* Dashboard Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Quick Start / Templates Carousel */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Start a New Project
                  </h2>
                  <p className="text-xs text-slate-400">
                    Create something beautiful directly on your device
                  </p>
                </div>

                {/* Mobile Search input */}
                <div className="sm:hidden w-36">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Template / Quick Start Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Blank Canvas */}
                <button
                  onClick={handleCreateBlankCanvas}
                  className="group p-3 bg-slate-900/80 hover:bg-slate-800/90 rounded-xl border border-slate-800 hover:border-sky-500/50 text-left transition-all flex flex-col justify-between h-28"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">
                      Blank Canvas
                    </div>
                    <div className="text-[10px] text-slate-400">1200 × 800</div>
                  </div>
                </button>

                {/* 2. Mobile App Concept */}
                <button
                  onClick={() => handleCreateFromPreset(PROJECT_PRESETS[0])}
                  className="group p-3 bg-slate-900/80 hover:bg-slate-800/90 rounded-xl border border-slate-800 hover:border-sky-500/50 text-left transition-all flex flex-col justify-between h-28"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors">
                      Mobile App
                    </div>
                    <div className="text-[10px] text-slate-400">390 × 844</div>
                  </div>
                </button>

                {/* 3. Desktop Web */}
                <button
                  onClick={() => handleCreateFromPreset(PROJECT_PRESETS[2])}
                  className="group p-3 bg-slate-900/80 hover:bg-slate-800/90 rounded-xl border border-slate-800 hover:border-indigo-500/50 text-left transition-all flex flex-col justify-between h-28"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Monitor size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      Desktop Web
                    </div>
                    <div className="text-[10px] text-slate-400">1440 × 900</div>
                  </div>
                </button>

                {/* 4. Open Photo from Device */}
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="group p-3 bg-slate-900/80 hover:bg-slate-800/90 rounded-xl border border-slate-800 hover:border-emerald-500/50 text-left transition-all flex flex-col justify-between h-28"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UploadCloud size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                      Edit Photo
                    </div>
                    <div className="text-[10px] text-slate-400">From Device</div>
                  </div>
                </button>

                {/* 5. ✨ Load Sample Project */}
                <button
                  onClick={handleCreateSample}
                  className="group p-3 bg-gradient-to-tr from-purple-950/40 to-indigo-950/40 hover:from-purple-900/50 hover:to-indigo-900/50 rounded-xl border border-purple-800/40 hover:border-purple-500/60 text-left transition-all flex flex-col justify-between h-28"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-purple-200 group-hover:text-purple-100 transition-colors">
                      ✨ Load Sample Project
                    </div>
                    <div className="text-[10px] text-purple-300/70">Vector UI Demo</div>
                  </div>
                </button>

                {/* 6. Load Sample Photo */}
                <button
                  onClick={handleCreateSamplePhoto}
                  className="group p-3 bg-gradient-to-tr from-teal-950/40 to-emerald-950/40 hover:from-teal-900/50 hover:to-emerald-900/50 rounded-xl border border-teal-800/40 hover:border-teal-500/60 text-left transition-all flex flex-col justify-between h-28"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-teal-200 group-hover:text-teal-100 transition-colors">
                      Load Sample Photo
                    </div>
                    <div className="text-[10px] text-teal-300/70">Sunset Landscape</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Projects Section */}
            <div>
              {/* Filter Tabs & View Mode Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterType === 'all'
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    All Projects ({recents.length})
                  </button>
                  <button
                    onClick={() => setFilterType('canvas')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterType === 'canvas'
                        ? 'bg-sky-500/20 text-sky-400 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    Canvas ({canvasCount})
                  </button>
                  <button
                    onClick={() => setFilterType('photo')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterType === 'photo'
                        ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    Photos ({photoCount})
                  </button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 self-end sm:self-auto">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${
                      viewMode === 'grid'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Grid view"
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded ${
                      viewMode === 'list'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="List view"
                  >
                    <List size={15} />
                  </button>
                </div>
              </div>

              {/* Projects Gallery */}
              <div className="mt-5">
                {filteredRecents.length === 0 ? (
                  /* Empty State */
                  <div className="py-16 text-center flex flex-col items-center justify-center bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-8">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mb-3">
                      <Clock size={24} />
                    </div>
                    <div className="text-sm font-semibold text-white mb-1">
                      {searchQuery ? 'No matching projects found' : 'No recent projects yet'}
                    </div>
                    <p className="text-xs text-slate-400 max-w-sm mb-4">
                      {searchQuery
                        ? `No projects matching "${searchQuery}". Try a different keyword.`
                        : 'Projects you create or edit will automatically appear here on your dashboard.'}
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCreateBlankCanvas}
                        className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                      >
                        Create Canvas Project
                      </button>
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                      >
                        Open Photo
                      </button>
                    </div>
                  </div>
                ) : viewMode === 'grid' ? (
                  /* Grid View Cards */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredRecents.map((item) => {
                      const isPhoto = item.projectType === 'photo';
                      const photoAsset = item.data.photo?.sourceAssetId
                        ? item.data.assets?.[item.data.photo.sourceAssetId]
                        : null;
                      const hasThumbnail = !!item.thumbnail || !!photoAsset?.dataUrl;
                      const thumbnailSrc = item.thumbnail || photoAsset?.dataUrl;

                      return (
                        <div
                          key={item.id}
                          onClick={() => onOpenProject(item.data)}
                          className="group relative bg-slate-900/70 hover:bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col overflow-hidden"
                        >
                          {/* Visual Thumbnail Area */}
                          <div className="h-36 w-full bg-slate-950/60 relative overflow-hidden flex items-center justify-center border-b border-slate-800/80">
                            {hasThumbnail && thumbnailSrc ? (
                              <img
                                src={thumbnailSrc}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : isPhoto ? (
                              <div className="flex flex-col items-center justify-center text-emerald-400/50">
                                <Camera size={36} />
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-sky-400/40">
                                <Layout size={36} />
                                <span className="text-[10px] text-slate-500 mt-1">
                                  {item.objectCount} objects
                                </span>
                              </div>
                            )}

                            {/* Type Badge */}
                            <div className="absolute top-2.5 left-2.5">
                              <span
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-md shadow backdrop-blur-md ${
                                  isPhoto
                                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-sky-950/80 text-sky-400 border border-sky-500/30'
                                }`}
                              >
                                {isPhoto ? 'Photo' : 'Canvas'}
                              </span>
                            </div>

                            {/* Three dots menu button */}
                            <div className="absolute top-2.5 right-2.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === item.id ? null : item.id);
                                }}
                                className="p-1 rounded-md bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                              >
                                <MoreVertical size={14} />
                              </button>

                              {/* Dropdown Menu */}
                              {activeMenuId === item.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 mt-1 w-40 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                                >
                                  <button
                                    onClick={() => onOpenProject(item.data)}
                                    className="w-full px-3 py-1.5 text-xs text-left text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
                                  >
                                    <ArrowRight size={13} />
                                    <span>Open Project</span>
                                  </button>
                                  <button
                                    onClick={(e) => handleDuplicate(item.id, e)}
                                    className="w-full px-3 py-1.5 text-xs text-left text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
                                  >
                                    <Copy size={13} />
                                    <span>Duplicate</span>
                                  </button>
                                  <button
                                    onClick={(e) => handleExport(item.data, e)}
                                    className="w-full px-3 py-1.5 text-xs text-left text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
                                  >
                                    <Download size={13} />
                                    <span>Export .pixora</span>
                                  </button>
                                  <div className="h-[1px] bg-slate-800 my-1" />
                                  <button
                                    onClick={(e) => handleDelete(item.id, e)}
                                    className="w-full px-3 py-1.5 text-xs text-left text-rose-400 hover:bg-rose-950/30 flex items-center space-x-2"
                                  >
                                    <Trash2 size={13} />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Footer Info */}
                          <div className="p-3.5 flex flex-col justify-between flex-1">
                            <h3
                              title={item.name}
                              className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors truncate mb-1"
                            >
                              {item.name}
                            </h3>
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>
                                {isPhoto
                                  ? photoAsset
                                    ? `${photoAsset.width} × ${photoAsset.height}`
                                    : 'Photo Project'
                                  : `${item.objectCount} objects`}
                              </span>
                              <span title={new Date(item.updatedAt).toLocaleString()}>
                                {formatRelativeTime(item.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* List View */
                  <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                          <th className="py-3 px-4">Project</th>
                          <th className="py-3 px-4 hidden sm:table-cell">Type</th>
                          <th className="py-3 px-4 hidden md:table-cell">Details</th>
                          <th className="py-3 px-4">Last Modified</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredRecents.map((item) => {
                          const isPhoto = item.projectType === 'photo';
                          const photoAsset = item.data.photo?.sourceAssetId
                            ? item.data.assets?.[item.data.photo.sourceAssetId]
                            : null;
                          return (
                            <tr
                              key={item.id}
                              onClick={() => onOpenProject(item.data)}
                              className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-3">
                                  <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                      isPhoto
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-sky-500/20 text-sky-400'
                                    }`}
                                  >
                                    {isPhoto ? <Camera size={15} /> : <Layout size={15} />}
                                  </div>
                                  <span className="font-semibold text-white group-hover:text-sky-300 transition-colors truncate max-w-xs">
                                    {item.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 hidden sm:table-cell">
                                <span
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                                    isPhoto
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-sky-950 text-sky-400 border border-sky-500/30'
                                  }`}
                                >
                                  {isPhoto ? 'Photo' : 'Canvas'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-400 hidden md:table-cell">
                                {isPhoto
                                  ? photoAsset
                                    ? `${photoAsset.width} × ${photoAsset.height}`
                                    : 'Photo Project'
                                  : `${item.objectCount} objects`}
                              </td>
                              <td className="py-3 px-4 text-slate-400">
                                {formatRelativeTime(item.updatedAt)}
                              </td>
                              <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end space-x-1">
                                  <button
                                    onClick={() => handleDuplicate(item.id)}
                                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                                    title="Duplicate"
                                  >
                                    <Copy size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleExport(item.data)}
                                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                                    title="Export"
                                  >
                                    <Download size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
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
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Custom Size Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Custom Canvas Dimensions</h3>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Custom Design"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-sky-500"
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-sky-500"
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustom}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
