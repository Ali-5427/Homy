/**
 * Den Settings View
 * Comprehensive desktop preferences covering:
 * - Appearance (Light / Dark)
 * - Authorized Indexed Folders (Add / Remove)
 * - Indexing Lifecycle (Rebuild / Clear index)
 * - Global Shortcut & Tray preferences
 * - Saved Searches Management
 */

import React, { useState } from 'react';
import {
  Settings,
  HardDrive,
  Plus,
  Trash2,
  RefreshCw,
  Keyboard,
  DownloadCloud,
  Check,
} from 'lucide-react';
import { AppSettings, IndexedLocation, SavedSearch, ThemeMode } from '../../types/shelf';

interface SettingsViewProps {
  settings: AppSettings;
  locations: IndexedLocation[];
  savedSearches: SavedSearch[];
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onAddFolder: () => void;
  onRemoveLocation: (id: string) => void;
  onRebuildIndex: () => void;
  onClearIndex: () => void;
  onDeleteSavedSearch: (id: string) => void;
  onRenameSavedSearch: (id: string, newTitle: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  locations,
  savedSearches,
  onUpdateSettings,
  onAddFolder,
  onRemoveLocation,
  onRebuildIndex,
  onClearIndex,
  onDeleteSavedSearch,
  onRenameSavedSearch,
}) => {
  const [editingSearchId, setEditingSearchId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRebuild = () => {
    onRebuildIndex();
    setStatusMessage('Index refreshed.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleClear = () => {
    if (
      window.confirm(
        'Clear all Den index data? Your original local files and folders will NOT be deleted.'
      )
    ) {
      onClearIndex();
      setStatusMessage('Den index cleared.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl pb-16 select-none">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#5F6368] dark:text-[#9CA3AF]" />
          <h1 className="text-2xl font-semibold tracking-tight text-[#202124] dark:text-[#F3F4F6]">
            Settings
          </h1>
        </div>
        <p className="text-xs text-[#747A84] dark:text-[#9CA3AF] mt-1">
          Configure Den workspace appearance, indexed folders, and shortcuts.
        </p>
      </div>

      {statusMessage && (
        <div className="bg-[#EBF3FF] dark:bg-[#1E293B] border border-[#CCE2FF] dark:border-[#334155] text-[#1A54B8] dark:text-[#60A5FA] text-xs p-3 rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 1. Appearance */}
      <section className="bg-white dark:bg-[#17191E] border border-[#E3E6EA] dark:border-[#282C34] rounded-2xl p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[#202124] dark:text-[#F3F4F6]">Theme</h2>
          <p className="text-xs text-[#747A84] dark:text-[#9CA3AF]">
            Choose interface color mode.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-xs">
          {(['light', 'dark'] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onUpdateSettings({ theme: mode })}
              className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                settings.theme === mode
                  ? 'border-[#3478E8] bg-[#EBF3FF]/40 dark:bg-[#3478E8]/10 ring-1 ring-[#3478E8] text-[#3478E8]'
                  : 'border-[#E3E6EA] dark:border-[#282C34] bg-[#F8F9FB] dark:bg-[#1F2228] hover:border-[#CBD0D7] text-[#202124] dark:text-[#F3F4F6]'
              }`}
            >
              <div className="text-xs font-semibold capitalize">
                {mode}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 2. Authorized Locations */}
      <section className="bg-white dark:bg-[#17191E] border border-[#E3E6EA] dark:border-[#282C34] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#202124] dark:text-[#F3F4F6]">Indexed Folders</h2>
            <p className="text-xs text-[#747A84] dark:text-[#9CA3AF]">
              Folders authorized for local search and visual categories.
            </p>
          </div>
          <button
            onClick={onAddFolder}
            className="px-3 py-1.5 text-xs font-medium text-white bg-[#3478E8] hover:bg-[#2563EB] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Folder</span>
          </button>
        </div>

        <div className="divide-y divide-[#ECEEF1] dark:divide-[#282C34] border border-[#ECEEF1] dark:border-[#282C34] rounded-xl overflow-hidden">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="p-3 px-4 flex items-center justify-between bg-[#F8F9FB] dark:bg-[#1F2228] hover:bg-white dark:hover:bg-[#17191E] transition-colors"
            >
              <div className="flex items-center gap-3">
                <HardDrive className="w-4 h-4 text-[#747A84] dark:text-[#9CA3AF]" />
                <div>
                  <div className="text-xs font-semibold text-[#202124] dark:text-[#F3F4F6]">
                    {loc.displayName}
                  </div>
                  <div className="text-[11px] text-[#747A84] dark:text-[#9CA3AF] font-mono">
                    {loc.fullPath}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#747A84] dark:text-[#9CA3AF] font-mono tabular-nums">
                  {loc.fileCount} files
                </span>
                {!loc.isDefault && (
                  <button
                    onClick={() => onRemoveLocation(loc.id)}
                    className="p-1.5 text-[#747A84] hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove from index"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={handleRebuild}
            className="px-3 py-1.5 text-xs font-medium text-[#5F6368] dark:text-[#9CA3AF] hover:text-[#202124] dark:hover:text-[#F3F4F6] bg-[#F5F6F8] dark:bg-[#1F2228] hover:bg-[#ECEEF1] dark:hover:bg-[#252932] border border-[#E3E6EA] dark:border-[#282C34] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rebuild Index</span>
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg transition-colors cursor-pointer"
          >
            Clear Index Cache
          </button>
        </div>
      </section>

      {/* 3. Keyboard Shortcut & Tray */}
      <section className="bg-white dark:bg-[#17191E] border border-[#E3E6EA] dark:border-[#282C34] rounded-2xl p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[#202124] dark:text-[#F3F4F6]">Integration</h2>
          <p className="text-xs text-[#747A84] dark:text-[#9CA3AF]">
            Shortcut and system tray configuration.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#F8F9FB] dark:bg-[#1F2228] border border-[#ECEEF1] dark:border-[#282C34] rounded-xl">
            <div className="flex items-center gap-2.5">
              <Keyboard className="w-4 h-4 text-[#747A84] dark:text-[#9CA3AF]" />
              <div>
                <div className="text-xs font-semibold text-[#202124] dark:text-[#F3F4F6]">
                  Quick Search Shortcut
                </div>
                <div className="text-[11px] text-[#747A84] dark:text-[#9CA3AF]">
                  Desktop spotlight shortcut
                </div>
              </div>
            </div>

            <span className="text-xs font-mono font-semibold bg-white dark:bg-[#17191E] border border-[#E3E6EA] dark:border-[#282C34] px-2.5 py-1 rounded shadow-2xs text-[#202124] dark:text-[#F3F4F6]">
              {settings.searchShortcut}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#F8F9FB] dark:bg-[#1F2228] border border-[#ECEEF1] dark:border-[#282C34] rounded-xl">
            <div className="flex items-center gap-2.5">
              <DownloadCloud className="w-4 h-4 text-[#747A84] dark:text-[#9CA3AF]" />
              <div>
                <div className="text-xs font-semibold text-[#202124] dark:text-[#F3F4F6]">
                  Recent Downloads Panel
                </div>
                <div className="text-[11px] text-[#747A84] dark:text-[#9CA3AF]">
                  Access recent downloads from Menu Bar / System Tray
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.trayEnabled}
                onChange={(e) => onUpdateSettings({ trayEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3478E8]"></div>
            </label>
          </div>
        </div>
      </section>

      {/* 4. Saved Searches */}
      <section className="bg-white dark:bg-[#17191E] border border-[#E3E6EA] dark:border-[#282C34] rounded-2xl p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[#202124] dark:text-[#F3F4F6]">Saved Searches</h2>
          <p className="text-xs text-[#747A84] dark:text-[#9CA3AF]">
            Bookmarks shown in sidebar navigation.
          </p>
        </div>

        {savedSearches.length > 0 ? (
          <div className="divide-y divide-[#ECEEF1] dark:divide-[#282C34] border border-[#ECEEF1] dark:border-[#282C34] rounded-xl overflow-hidden">
            {savedSearches.map((s) => (
              <div
                key={s.id}
                className="p-3 px-4 flex items-center justify-between bg-[#F8F9FB] dark:bg-[#1F2228] hover:bg-white dark:hover:bg-[#17191E] transition-colors"
              >
                {editingSearchId === s.id ? (
                  <div className="flex items-center gap-2 flex-1 mr-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="bg-white dark:bg-[#17191E] border border-[#3478E8] text-xs px-2 py-1 rounded outline-none flex-1 text-[#202124] dark:text-[#F3F4F6]"
                    />
                    <button
                      onClick={() => {
                        onRenameSavedSearch(s.id, editTitle);
                        setEditingSearchId(null);
                      }}
                      className="text-xs text-white bg-[#3478E8] px-2 py-1 rounded cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingSearchId(null)}
                      className="text-xs text-[#747A84] px-2 py-1 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs font-semibold text-[#202124] dark:text-[#F3F4F6]">{s.title}</div>
                    <div className="text-[11px] text-[#747A84] dark:text-[#9CA3AF] font-mono">&ldquo;{s.query}&rdquo;</div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {editingSearchId !== s.id && (
                    <button
                      onClick={() => {
                        setEditingSearchId(s.id);
                        setEditTitle(s.title);
                      }}
                      className="text-xs text-[#3478E8] hover:underline cursor-pointer"
                    >
                      Rename
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteSavedSearch(s.id)}
                    className="p-1.5 text-[#747A84] hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove saved search"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#9AA0A6] italic">No saved searches.</p>
        )}
      </section>

      {/* 5. App Info */}
      <div className="pt-2 border-t border-[#ECEEF1] dark:border-[#282C34] flex items-center justify-between text-xs text-[#747A84] dark:text-[#9CA3AF]">
        <span>App: <strong className="text-[#202124] dark:text-[#F3F4F6]">Den</strong></span>
        <span>Version: <strong className="text-[#202124] dark:text-[#F3F4F6] font-mono">1.0.0</strong></span>
      </div>
    </div>
  );
};
