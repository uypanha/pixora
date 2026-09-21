import { useState, useEffect, useRef } from 'react';
import { DocumentProvider, useDocument } from './document/documentContext';
import { EditorProvider } from './editor/editorContext';
import { useAutosave } from './storage/autosave';
import { loadActiveProject } from './storage/db';
import { Canvas } from './canvas/Canvas';
import { TopToolbar } from './components/toolbar/TopToolbar';
import { LayerTree } from './layers/LayerTree';
import { PropertiesPanel } from './properties/PropertiesPanel';
import { Launcher } from './components/launcher/Launcher';
import { ExportModal } from './export/ExportModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { MobileTopBar } from './mobile/MobileTopBar';
import { MobileBottomNav } from './mobile/MobileBottomNav';
import { MobileFloatingTools } from './mobile/MobileFloatingTools';
import { MobileBottomSheet } from './mobile/MobileBottomSheet';
import { useKeyboardShortcuts } from './editor/shortcuts';

function EditorApp() {
  const { document, setDocument } = useDocument();
  const { status: autosaveStatus } = useAutosave(document);

  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  // Hidden file input for Cmd+O shortcut
  const hiddenFileInputRef = useRef<HTMLInputElement | null>(null);

  // Responsive breakpoint listener
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      if (w < 1200) {
        setShowLeftSidebar(false);
        setShowRightSidebar(false);
      } else {
        setShowLeftSidebar(true);
        setShowRightSidebar(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check for local project recovery on startup
  useEffect(() => {
    async function checkLocalRecovery() {
      const recovered = await loadActiveProject();
      if (recovered && Object.keys(recovered.objects).length > 0) {
        setDocument(recovered, true);
        // Show launcher with "Continue Editing" banner
        setIsLauncherOpen(true);
      } else {
        // First time opening: show launcher to choose a preset
        setIsLauncherOpen(true);
      }
    }
    checkLocalRecovery();
  }, [setDocument]);

  useKeyboardShortcuts(() => {
    hiddenFileInputRef.current?.click();
  });

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-pixora-bg select-none">
      {/* Hidden file input for Cmd+O */}
      <input
        ref={hiddenFileInputRef}
        type="file"
        accept=".pixora,application/json"
        className="hidden"
        onChange={async e => {
          const file = e.target.files?.[0];
          if (!file) return;
          const { importPixoraFile } = await import('./import/pixoraImporter');
          try {
            const doc = await importPixoraFile(file);
            setDocument(doc, true);
          } catch (err: any) {
            alert(err.message);
          }
        }}
      />

      {/* Top Header */}
      {isMobile ? (
        <MobileTopBar onOpenLauncher={() => setIsLauncherOpen(true)} />
      ) : (
        <TopToolbar
          onOpenLauncher={() => setIsLauncherOpen(true)}
          autosaveStatus={autosaveStatus}
        />
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left Sidebar (Desktop / Tablet toggle) */}
        {!isMobile && showLeftSidebar && <LayerTree />}

        {/* Center Canvas */}
        <main className="flex-1 relative overflow-hidden flex flex-col">
          <Canvas />

          {/* Mobile Floating Tools & Sheets */}
          {isMobile && <MobileFloatingTools />}
        </main>

        {/* Right Properties Panel (Desktop / Tablet toggle) */}
        {!isMobile && showRightSidebar && <PropertiesPanel />}

        {/* Mobile Bottom Sheets & Navigation */}
        {isMobile && (
          <>
            <MobileBottomSheet />
            <MobileBottomNav />
          </>
        )}
      </div>

      {/* Modals & Dialogs */}
      <Launcher
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
        onSelectProject={doc => {
          setDocument(doc, true);
          setIsLauncherOpen(false);
        }}
        hasActiveProject={Object.keys(document.objects).length > 0}
        activeProjectName={document.metadata.name}
      />

      <ExportModal />
      <ShortcutsModal />
    </div>
  );
}

export default function App() {
  return (
    <DocumentProvider>
      <EditorProvider>
        <EditorApp />
      </EditorProvider>
    </DocumentProvider>
  );
}
