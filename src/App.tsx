/**
 * Shelf Desktop Application
 * Main Entry Point and Orchestration Engine.
 * A calm, visual desktop application for finding, understanding,
 * and safely reviewing local files across macOS and Windows.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ActiveView,
  FileItem,
  FileKind,
  IndexedLocation,
  SavedSearch,
  AppSettings,
  SourceType,
  CleanupCategory,
} from './types/shelf';
import { storageEngine } from './services/storage';
import { osAdapter } from './services/osAdapter';
import { parseNaturalQuery, filterFiles } from './services/searchParser';

import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Inspector } from './components/Inspector';
import { QuickLookModal } from './components/QuickLookModal';
import { QuickSearchModal } from './components/QuickSearchModal';
import { RecentDownloadsPopover } from './components/RecentDownloadsPopover';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ContextualAudioBar } from './components/ContextualAudioBar';

import { HomeView } from './components/views/HomeView';
import { CategoryView } from './components/views/CategoryView';
import { SearchResultsView } from './components/views/SearchResultsView';
import { DownloadedFromView } from './components/views/DownloadedFromView';
import { DuplicatesView } from './components/views/DuplicatesView';
import { CleanUpView } from './components/views/CleanUpView';
import { SettingsView } from './components/views/SettingsView';

export default function App() {
  // Reactive Storage State
  const [files, setFiles] = useState<FileItem[]>(() => storageEngine.getFiles(false));
  const [locations, setLocations] = useState<IndexedLocation[]>(() => storageEngine.getLocations());
  const [settings, setSettings] = useState<AppSettings>(() => storageEngine.getSettings());
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() => storageEngine.getSavedSearches());

  // Subscribe to storage engine updates
  useEffect(() => {
    return storageEngine.subscribe(() => {
      setFiles(storageEngine.getFiles(false));
      setLocations(storageEngine.getLocations());
      setSettings(storageEngine.getSettings());
      setSavedSearches(storageEngine.getSavedSearches());
    });
  }, []);

  // Sync OS adapter platform when settings change
  useEffect(() => {
    osAdapter.setPlatform(settings.platform);
  }, [settings.platform]);

  // Navigation State
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'home' });
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [removedChipIds, setRemovedChipIds] = useState<Set<string>>(new Set());

  // Modal & Overlay States
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isRecentDownloadsOpen, setIsRecentDownloadsOpen] = useState(false);
  const [quickLookFile, setQuickLookFile] = useState<FileItem | null>(null);

  // Safe Trash Confirmation State
  const [trashConfirmation, setTrashConfirmation] = useState<{
    isOpen: boolean;
    files: FileItem[];
    title?: string;
    description?: string;
  }>({
    isOpen: false,
    files: [],
  });

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K, Space for Quick Look, Esc)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for Quick Search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen((prev) => !prev);
        return;
      }

      // Check if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      // Space for Quick Look if file is selected and not in input field
      if (e.key === ' ' && !isInput && selectedFile && !quickLookFile && !isQuickSearchOpen) {
        e.preventDefault();
        setQuickLookFile(selectedFile);
        return;
      }

      // Escape to close modals or deselect
      if (e.key === 'Escape') {
        if (quickLookFile) {
          setQuickLookFile(null);
        } else if (isQuickSearchOpen) {
          setIsQuickSearchOpen(false);
        } else if (isRecentDownloadsOpen) {
          setIsRecentDownloadsOpen(false);
        } else if (searchQuery) {
          setSearchQuery('');
        } else if (selectedFile) {
          setSelectedFile(null);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedFile, quickLookFile, isQuickSearchOpen, isRecentDownloadsOpen, searchQuery]);

  // Parse natural language search query
  const parsedSearch = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        chips: [],
        filters: { query: '', sortBy: 'date' as const, sortOrder: 'desc' as const },
        textQuery: '',
        isLiteralFallback: false,
        unrecognizedTerms: [],
      };
    }
    const res = parseNaturalQuery(searchQuery);
    // Filter out chips user explicitly removed
    const activeChips = res.chips.filter((c) => !removedChipIds.has(c.id));
    return { ...res, chips: activeChips };
  }, [searchQuery, removedChipIds]);

  // Compute search-filtered files
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return filterFiles(files, parsedSearch.filters, parsedSearch.textQuery);
  }, [files, searchQuery, parsedSearch]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setRemovedChipIds(new Set()); // Reset removed chips on new query
  };

  const handleRemoveChip = (chipId: string) => {
    setRemovedChipIds((prev) => new Set(prev).add(chipId));
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setRemovedChipIds(new Set());
  };

  const handleAddFolder = async () => {
    const selected = await osAdapter.selectFolder();
    if (selected) {
      storageEngine.addLocation(selected.path, selected.name);
    }
  };

  const handleRequestTrash = (
    filesToTrash: FileItem[],
    title?: string,
    description?: string
  ) => {
    if (settings.confirmBeforeTrash) {
      setTrashConfirmation({
        isOpen: true,
        files: filesToTrash,
        title,
        description,
      });
    } else {
      executeTrash(filesToTrash);
    }
  };

  const executeTrash = (filesToTrash: FileItem[]) => {
    const ids = filesToTrash.map((f) => f.id);
    storageEngine.moveToTrash(ids);
    if (selectedFile && ids.includes(selectedFile.id)) {
      setSelectedFile(null);
    }
    setTrashConfirmation({ isOpen: false, files: [] });
  };

  // Render Main Content View
  const renderMainContent = () => {
    // If active search query exists, prioritize search results view
    if (searchQuery.trim()) {
      return (
        <SearchResultsView
          rawQuery={searchQuery}
          chips={parsedSearch.chips}
          filters={parsedSearch.filters}
          filteredFiles={searchResults}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
          onQuickLook={setQuickLookFile}
          onRemoveChip={handleRemoveChip}
          onSaveSearch={(title, q) => storageEngine.addSavedSearch(title, q)}
          onClearSearch={handleClearSearch}
          isLiteralFallback={parsedSearch.isLiteralFallback}
        />
      );
    }

    switch (activeView.type) {
      case 'home':
        return (
          <HomeView
            theme={settings.theme}
            onNavigate={setActiveView}
            onSelectFile={setSelectedFile}
            onQuickLook={setQuickLookFile}
          />
        );

      case 'recents':
        return (
          <CategoryView
            title="Recents"
            files={[...files].sort((a, b) => b.modifiedAt - a.modifiedAt)}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            onQuickLook={setQuickLookFile}
          />
        );

      case 'category':
        return (
          <CategoryView
            title={`${activeView.kind.charAt(0).toUpperCase() + activeView.kind.slice(1)}`}
            kind={activeView.kind}
            files={files.filter((f) => f.kind === activeView.kind)}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            onQuickLook={setQuickLookFile}
          />
        );

      case 'smart':
        if (activeView.subview === 'large-files') {
          return (
            <CategoryView
              title="Large Files"
              files={files.filter((f) => f.size > 50 * 1024 * 1024)}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              onQuickLook={setQuickLookFile}
            />
          );
        } else {
          return (
            <CategoryView
              title="Screenshots"
              files={files.filter((f) => f.isScreenshot)}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              onQuickLook={setQuickLookFile}
            />
          );
        }

      case 'sources':
        return (
          <DownloadedFromView
            initialSource={activeView.selectedSource}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            onQuickLook={setQuickLookFile}
          />
        );

      case 'duplicates':
        return (
          <DuplicatesView
            platform={settings.platform}
            onRequestTrash={(candFiles, title, desc) =>
              handleRequestTrash(candFiles, title, desc)
            }
            onSelectFile={setSelectedFile}
            onQuickLook={setQuickLookFile}
          />
        );

      case 'cleanup':
        return (
          <CleanUpView
            initialCategory={activeView.category}
            platform={settings.platform}
            onRequestTrash={(candFiles, title, desc) =>
              handleRequestTrash(candFiles, title, desc)
            }
            onSelectFile={setSelectedFile}
            onQuickLook={setQuickLookFile}
          />
        );

      case 'saved-search': {
        const saved = savedSearches.find((s) => s.id === activeView.searchId);
        if (saved) {
          return (
            <SearchResultsView
              rawQuery={saved.query}
              chips={parseNaturalQuery(saved.query).chips}
              filters={parseNaturalQuery(saved.query).filters}
              filteredFiles={filterFiles(files, parseNaturalQuery(saved.query).filters)}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              onQuickLook={setQuickLookFile}
              onRemoveChip={() => {}}
              onSaveSearch={(t, q) => storageEngine.addSavedSearch(t, q)}
              onClearSearch={() => setActiveView({ type: 'home' })}
              isLiteralFallback={false}
            />
          );
        }
        return null;
      }

      case 'location': {
        const loc = locations.find((l) => l.id === activeView.locationId);
        return (
          <CategoryView
            title={loc ? loc.displayName : 'Authorized Folder'}
            files={files.filter((f) => f.locationId === activeView.locationId)}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            onQuickLook={setQuickLookFile}
          />
        );
      }

      case 'settings':
        return (
          <SettingsView
            settings={settings}
            locations={locations}
            savedSearches={savedSearches}
            onUpdateSettings={(part) => storageEngine.updateSettings(part)}
            onAddFolder={handleAddFolder}
            onRemoveLocation={(id) => storageEngine.removeLocation(id)}
            onRebuildIndex={() => storageEngine.resetIndex()}
            onClearIndex={() => storageEngine.clearAllIndexData()}
            onDeleteSavedSearch={(id) => storageEngine.removeSavedSearch(id)}
            onRenameSavedSearch={(id, title) => storageEngine.renameSavedSearch(id, title)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9FB] text-[#202124] select-none">
      {/* 1. Left Navigation Sidebar */}
      <Sidebar
        activeView={activeView}
        onNavigate={(view) => {
          handleClearSearch();
          setActiveView(view);
        }}
        locations={locations}
        savedSearches={savedSearches}
        onAddFolder={handleAddFolder}
        theme={settings.theme}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Desktop Top Bar */}
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
          onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
          onToggleRecentDownloads={() => setIsRecentDownloadsOpen((prev) => !prev)}
          isRecentDownloadsOpen={isRecentDownloadsOpen}
          settings={settings}
          onUpdateSettings={(part) => storageEngine.updateSettings(part)}
        />

        {/* Recent Downloads Menu-bar / Tray Popover */}
        <RecentDownloadsPopover
          isOpen={isRecentDownloadsOpen}
          onClose={() => setIsRecentDownloadsOpen(false)}
          onSelectFile={setSelectedFile}
          onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
          onOpenSettings={() => {
            handleClearSearch();
            setActiveView({ type: 'settings' });
          }}
          platform={settings.platform}
        />

        {/* Content Viewport with Contextual Inspector Split */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* Scrollable Canvas */}
          <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
            {renderMainContent()}
          </main>

          {/* Contextual File Inspector (Opens on right side without discarding browse context) */}
          {selectedFile && (
            <Inspector
              file={selectedFile}
              onClose={() => setSelectedFile(null)}
              onQuickLook={setQuickLookFile}
              onRequestTrash={(f) =>
                handleRequestTrash(
                  [f],
                  `Move ${f.displayName} to ${osAdapter.getTrashName()}?`,
                  `This file will be sent to your OS ${osAdapter.getTrashName()}. You can restore it anytime.`
                )
              }
              platform={settings.platform}
            />
          )}
        </div>

        {/* Contextual Audio Bar (strictly when audio file is selected) */}
        {selectedFile && selectedFile.kind === 'audio' && (
          <ContextualAudioBar
            selectedFile={selectedFile}
            onClose={() => setSelectedFile(null)}
          />
        )}
      </div>

      {/* 3. Floating Modals */}
      {/* Quick Search Spotlight Modal */}
      <QuickSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        onSelectFileInShelf={(file) => {
          setSelectedFile(file);
        }}
        platform={settings.platform}
      />

      {/* Quick Look Preview Modal */}
      <QuickLookModal
        file={quickLookFile}
        onClose={() => setQuickLookFile(null)}
        platform={settings.platform}
      />

      {/* Review-First Trash Confirmation Modal */}
      <ConfirmationModal
        isOpen={trashConfirmation.isOpen}
        filesToTrash={trashConfirmation.files}
        title={trashConfirmation.title}
        description={trashConfirmation.description}
        platform={settings.platform}
        onConfirm={() => executeTrash(trashConfirmation.files)}
        onCancel={() => setTrashConfirmation({ isOpen: false, files: [] })}
      />
    </div>
  );
}
