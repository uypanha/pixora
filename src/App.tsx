import { useState, useEffect, useRef } from 'react';
import { DocumentProvider, useDocument } from './document/documentContext';
import { EditorProvider, useEditor } from './editor/editorContext';
import { PixoraDocument } from './types/document';
import { useAutosave } from './storage/autosave';
import { loadActiveProject } from './storage/db';
import { Canvas } from './canvas/Canvas';
import { TopToolbar } from './components/toolbar/TopToolbar';
import { LayerTree } from './layers/LayerTree';
import { PropertiesPanel } from './properties/PropertiesPanel';
import { Launcher } from './components/launcher/Launcher';
import { ExportModal } from './export/ExportModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { ContextMenu } from './components/menu/ContextMenu';
import { MobileTopBar } from './mobile/MobileTopBar';
import { MobileBottomNav } from './mobile/MobileBottomNav';
import { MobileFloatingTools } from './mobile/MobileFloatingTools';
import { MobileBottomSheet } from './mobile/MobileBottomSheet';
import { useKeyboardShortcuts } from './editor/shortcuts';
import { PhotoEditor } from './editors/photo/PhotoEditor';

import { HomeScreen } from './components/home/HomeScreen';

function EditorApp() {
  const { document, setDocument } = useDocument();
  const { status: autosaveStatus } = useAutosave(document);

  const {
    setMobileActiveTab,
    setIsMobileMenuOpen,
    setIsExportModalOpen,
    setIsShortcutsModalOpen,
  } = useEditor();

  const [currentScreen, setCurrentScreen] = useState<'home' | 'editor'>('home');
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  // Hidden file input for Cmd+O shortcut
  const hiddenFileInputRef = useRef<HTMLInputElement | null>(null);

  const navigateToEditor = (doc?: PixoraDocument) => {
    if (doc) {
      setDocument(doc, true);
    }
    setCurrentScreen('editor');
    try {
      if (window.location.hash !== '#editor') {
        window.history.pushState({ screen: 'editor' }, '', '#editor');
      }
    } catch (_) {}
  };

  const navigateToHome = () => {
    setCurrentScreen('home');
    setMobileActiveTab(null);
    setIsMobileMenuOpen(false);
    setIsExportModalOpen(false);
    setIsShortcutsModalOpen(false);
    try {
      if (window.location.hash === '#editor') {
        if (window.history.state?.screen === 'editor') {
          window.history.back();
        } else {
          window.history.replaceState({ screen: 'home' }, '', window.location.pathname + window.location.search);
        }
      }
    } catch (_) {}
  };

  // Sync with browser history and phone hardware / gesture back button
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // If user navigates back and hash is not '#editor', go back to home screen instead of exiting
      if (window.location.hash === '#editor' || e.state?.screen === 'editor') {
        setCurrentScreen('editor');
      } else {
        setCurrentScreen('home');
        setMobileActiveTab(null);
        setIsMobileMenuOpen(false);
        setIsExportModalOpen(false);
        setIsShortcutsModalOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setMobileActiveTab, setIsMobileMenuOpen, setIsExportModalOpen, setIsShortcutsModalOpen]);

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

  const hasCheckedRecoveryRef = useRef(false);

  // Check for local project recovery on startup (run once only on mount)
  useEffect(() => {
    if (hasCheckedRecoveryRef.current) return;
    hasCheckedRecoveryRef.current = true;

    async function checkLocalRecovery() {
      const recovered = await loadActiveProject();
      const hasContent =
        recovered &&
        (Object.keys(recovered.objects || {}).length > 0 || !!recovered.photo);
      if (hasContent) {
        setDocument(recovered, true);
      }
      setCurrentScreen(prev => {
        if (prev === 'editor') return prev;
        if (window.location.hash === '#editor' && hasContent) {
          return 'editor';
        }
        if (window.location.hash === '#editor') {
          try {
            window.history.replaceState({ screen: 'home' }, '', window.location.pathname + window.location.search);
          } catch (_) {}
        }
        return 'home';
      });
    }
    checkLocalRecovery();
  }, [setDocument]);

  useKeyboardShortcuts(() => {
    hiddenFileInputRef.current?.click();
  });

  const hasActiveContent =
    Object.keys(document.objects || {}).length > 0 || !!document.photo;

  if (currentScreen === 'home') {
    return (
      <HomeScreen
        onOpenProject={(doc) => {
          navigateToEditor(doc);
        }}
        onResumeActiveProject={
          hasActiveContent ? () => navigateToEditor() : undefined
        }
        hasActiveProject={hasActiveContent}
        activeProjectName={document.metadata.name}
      />
    );
  }

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
            navigateToEditor(doc);
          } catch (err: any) {
            alert(err.message);
          }
        }}
      />

      {document.projectType === 'photo' ? (
        <PhotoEditor onOpenLauncher={navigateToHome} />
      ) : (
        <>
          {/* Top Header */}
          {isMobile ? (
            <MobileTopBar onOpenLauncher={navigateToHome} />
          ) : (
            <TopToolbar
              onOpenLauncher={navigateToHome}
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

          <ExportModal />
          <ShortcutsModal />
          <ContextMenu />
        </>
      )}

      {/* Modals & Dialogs */}
      <Launcher
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
        onSelectProject={doc => {
          navigateToEditor(doc);
          setIsLauncherOpen(false);
        }}
        hasActiveProject={hasActiveContent}
        activeProjectName={document.metadata.name}
      />
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
