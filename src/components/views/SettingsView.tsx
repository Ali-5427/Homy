/**
 * Shelf Settings View
 * Comprehensive desktop preferences covering:
 * - Appearance (Playful / Minimal / System)
 * - Authorized Indexed Folders (Add / Remove from Index)
 * - Indexing Lifecycle (Rebuild / Clear index without deleting originals)
 * - Global Shortcut & Tray preferences
 * - Saved Searches Management (Rename / Delete)
 * - Autonomous Cleanup Rules (Strictly off by default)
 * - On-Device Privacy Architecture & Disclosures
 * - One-time Purchase & License status (strictly non-operational pending owner setup)
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
  Bookmark,
  ShieldCheck,
  CreditCard,
  Info,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { AppSettings, IndexedLocation, SavedSearch, ThemeMode } from '../../types/shelf';
import { storageEngine } from '../../services/storage';

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
  const [rebuildStatus, setRebuildStatus] = useState<string | null>(null);

  const handleRebuild = () => {
    onRebuildIndex();
    setRebuildStatus('Local index refreshed successfully.');
    setTimeout(() => setRebuildStatus(null), 3000);
  };

  const handleClear = () => {
    if (
      window.confirm(
        'Clear all Shelf index data? Your original local files and folders will NOT be deleted.'
      )
    ) {
      onClearIndex();
      setRebuildStatus('Shelf index cache cleared.');
      setTimeout(() => setRebuildStatus(null), 3000);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl pb-16 select-none">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#5F6368]" />
          <h1 className="text-2xl font-semibold tracking-tight text-[#202124]">
            Settings &amp; Privacy
          </h1>
        </div>
        <p className="text-xs text-[#747A84] mt-1">
          Configure Shelf workspace appearance, authorized local folders, and local privacy preferences.
        </p>
      </div>

      {rebuildStatus && (
        <div className="bg-[#EBF3FF] border border-[#CCE2FF] text-[#1A54B8] text-xs p-3 rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{rebuildStatus}</span>
        </div>
      )}

      {/* 1. Appearance */}
      <section className="bg-white border border-[#E3E6EA] rounded-2xl p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[#202124]">Appearance &amp; Theme</h2>
          <p className="text-xs text-[#747A84]">
            Select visual theme for category shelves and UI surfaces.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(['playful', 'minimal', 'system'] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onUpdateSettings({ theme: mode })}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                settings.theme === mode
                  ? 'border-[#3478E8] bg-[#EBF3FF]/40 ring-1 ring-[#3478E8]'
                  : 'border-[#E3E6EA] bg-[#F8F9FB] hover:border-[#CBD0D7]'
              }`}
            >
              <div className="text-xs font-semibold capitalize text-[#202124]">
                {mode}
              </div>
              <div className="text-[11px] text-[#747A84] mt-0.5">
                {mode === 'playful'
                  ? 'Soft category tints'
                  : mode === 'minimal'
                  ? 'Monochrome neutral'
                  : 'Follows OS mode'}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 2. Authorized Locations */}
      <section className="bg-white border border-[#E3E6EA] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#202124]">Authorized Locations</h2>
            <p className="text-xs text-[#747A84]">
              Shelf only indexes folders you explicitly authorize. Removing a location removes it from Shelf without deleting original files.
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

        <div className="divide-y divide-[#ECEEF1] border border-[#ECEEF1] rounded-xl overflow-hidden">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="p-3 px-4 flex items-center justify-between bg-[#F8F9FB] hover:bg-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <HardDrive className="w-4 h-4 text-[#747A84]" />
                <div>
                  <div className="text-xs font-semibold text-[#202124]">
                    {loc.displayName}
                  </div>
                  <div className="text-[11px] text-[#747A84] font-mono">
                    {loc.fullPath}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#747A84] font-mono tabular-nums">
                  {loc.fileCount} files
                </span>
                {!loc.isDefault && (
                  <button
                    onClick={() => onRemoveLocation(loc.id)}
                    className="p-1.5 text-[#747A84] hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove from Shelf index"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Indexing Controls */}
        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={handleRebuild}
            className="px-3 py-1.5 text-xs font-medium text-[#5F6368] hover:text-[#202124] bg-[#F5F6F8] hover:bg-[#ECEEF1] border border-[#E3E6EA] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rebuild Index</span>
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer"
          >
            Clear Shelf Index Data
          </button>
        </div>
      </section>

      {/* 3. Keyboard Shortcut & Tray */}
      <section className="bg-white border border-[#E3E6EA] rounded-2xl p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[#202124]">Desktop Integration</h2>
          <p className="text-xs text-[#747A84]">
            Configure Quick Search shortcut and Recent Downloads menu-bar/tray panel.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#F8F9FB] border border-[#ECEEF1] rounded-xl">
            <div className="flex items-center gap-2.5">
              <Keyboard className="w-4 h-4 text-[#747A84]" />
              <div>
                <div className="text-xs font-semibold text-[#202124]">
                  Quick Search Shortcut
                </div>
                <div className="text-[11px] text-[#747A84]">
                  Registered desktop spotlight hotkey
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold bg-white border border-[#E3E6EA] px-2.5 py-1 rounded shadow-2xs text-[#202124]">
                {settings.searchShortcut}
              </span>
              <span className="text-[11px] text-emerald-700 bg-[#F3FAF6] border border-[#CEEFE0] px-2 py-0.5 rounded">
                Active
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#F8F9FB] border border-[#ECEEF1] rounded-xl">
            <div className="flex items-center gap-2.5">
              <DownloadCloud className="w-4 h-4 text-[#747A84]" />
              <div>
                <div className="text-xs font-semibold text-[#202124]">
                  Recent Downloads Tray Panel
                </div>
                <div className="text-[11px] text-[#747A84]">
                  Surface recent downloads from the macOS Menu Bar or Windows System Tray
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
              <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3478E8]"></div>
            </label>
          </div>
        </div>
      </section>

      {/* 4. Saved Searches Management */}
      <section className="bg-white border border-[#E3E6EA] rounded-2xl p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[#202124]">Saved Searches</h2>
          <p className="text-xs text-[#747A84]">
            Manage your bookmarked searches shown in the left sidebar.
          </p>
        </div>

        {savedSearches.length > 0 ? (
          <div className="divide-y divide-[#ECEEF1] border border-[#ECEEF1] rounded-xl overflow-hidden">
            {savedSearches.map((s) => (
              <div
                key={s.id}
                className="p-3 px-4 flex items-center justify-between bg-[#F8F9FB] hover:bg-white transition-colors"
              >
                {editingSearchId === s.id ? (
                  <div className="flex items-center gap-2 flex-1 mr-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="bg-white border border-[#3478E8] text-xs px-2 py-1 rounded outline-none flex-1"
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
                    <div className="text-xs font-semibold text-[#202124]">{s.title}</div>
                    <div className="text-[11px] text-[#747A84] font-mono">&ldquo;{s.query}&rdquo;</div>
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
          <p className="text-xs text-[#9AA0A6] italic">No saved searches yet.</p>
        )}
      </section>

      {/* 5. Automatic Cleanup Policy (Strictly off by default) */}
      <section className="bg-white border border-[#E3E6EA] rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#202124]">
              Autonomous Cleanup Rules
            </h2>
            <p className="text-xs text-[#747A84]">
              Automatic background trashing is strictly disabled in Shelf release builds.
            </p>
          </div>
          <span className="text-[11px] font-mono text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
            Non-Operational
          </span>
        </div>

        <div className="bg-[#FFFBF2] border border-[#FFE39E] rounded-xl p-3 text-xs text-[#747A84] leading-relaxed">
          <strong className="text-[#202124]">Review-First Safety Guarantee:</strong> Shelf will never delete, move, or trash files automatically. All cleanup proposals require manual user review and explicit confirmation before dispatching to the OS Trash/Recycle Bin.
        </div>
      </section>

      {/* 6. On-Device Privacy Architecture */}
      <section className="bg-white border border-[#E3E6EA] rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-sm font-semibold text-[#202124]">
            Local-Only Privacy Architecture
          </h2>
        </div>

        <div className="text-xs text-[#5F6368] space-y-2 leading-relaxed">
          <p>
            • <strong>Zero Network Transmission:</strong> File names, paths, hashes, extracted metadata, thumbnails, and search queries remain 100% on your computer.
          </p>
          <p>
            • <strong>No Cloud AI or Remote LLM:</strong> Search queries and file parsing are computed with deterministic local algorithms. No file content is sent to third-party models or cloud processors.
          </p>
          <p>
            • <strong>Least Privilege:</strong> Only the folders you explicitly select above are indexed. Shelf does not scan system directories or unauthorized partitions.
          </p>
          <p>
            • <strong>Index Storage Location:</strong> Shelf index cache is isolated to your local device application directory.
          </p>
        </div>
      </section>

      {/* 7. Purchase & License Placeholder */}
      <section className="bg-white border border-[#E3E6EA] rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#3478E8]" />
            <h2 className="text-sm font-semibold text-[#202124]">
              One-Time Purchase &amp; License
            </h2>
          </div>
          <span className="text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            Awaiting Provider Configuration
          </span>
        </div>

        <p className="text-xs text-[#5F6368] leading-relaxed">
          Shelf is distributed exclusively as a one-time purchase with no recurring subscriptions. Real payment verification and email installer delivery remain strictly non-operational until the product owner configures payment providers, pricing, and license policies.
        </p>

        <div className="pt-2 border-t border-[#ECEEF1] flex items-center justify-between text-xs text-[#747A84]">
          <span>App Version: <strong className="text-[#202124] font-mono">1.0.0-desktop</strong></span>
          <span>Target Architecture: <strong className="text-[#202124]">macOS &amp; Windows (Shared Core)</strong></span>
        </div>
      </section>
    </div>
  );
};
