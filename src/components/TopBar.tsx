/**
 * Den Desktop Top Bar
 * Search input with keyboard hint, clear-search control, quiet library status,
 * Recent Downloads tray access, and Quick Search trigger.
 */

import React from 'react';
import { Search, X, DownloadCloud, Sparkles, Monitor, Moon, Sun } from 'lucide-react';
import { AppSettings, OSPlatform, ThemeMode } from '../types/shelf';
import { storageEngine } from '../services/storage';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  onOpenQuickSearch: () => void;
  onToggleRecentDownloads: () => void;
  isRecentDownloadsOpen: boolean;
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  onOpenQuickSearch,
  onToggleRecentDownloads,
  isRecentDownloadsOpen,
  settings,
  onUpdateSettings,
}) => {
  const summary = storageEngine.getLibrarySummary();

  const togglePlatform = () => {
    const nextPlatform: OSPlatform = settings.platform === 'mac' ? 'windows' : 'mac';
    const nextShortcut = nextPlatform === 'mac' ? '⌘K' : 'Ctrl+K';
    onUpdateSettings({ platform: nextPlatform, searchShortcut: nextShortcut });
  };

  const toggleTheme = () => {
    const themeCycle: ThemeMode[] = ['playful', 'minimal', 'system'];
    const nextIndex = (themeCycle.indexOf(settings.theme) + 1) % themeCycle.length;
    onUpdateSettings({ theme: themeCycle[nextIndex] });
  };

  return (
    <header
      className="h-[52px] border-b border-[#E3E6EA] bg-[#FFFFFF] px-5 flex items-center justify-between gap-4 select-none shrink-0"
      aria-label="Den Top Bar"
    >
      {/* Left: Search Bar */}
      <div className="flex items-center gap-2 flex-1 max-w-xl">
        <div className="relative w-full flex items-center">
          <Search className="w-4 h-4 text-[#747A84] absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && searchQuery) {
                onClearSearch();
              }
            }}
            placeholder='Search files or describe: e.g. "pdfs from last week over 5 mb"'
            className="w-full bg-[#F5F6F8] hover:bg-[#ECEEF1]/70 focus:bg-[#FFFFFF] border border-[#E3E6EA] focus:border-[#3478E8] text-[#202124] text-xs pl-9 pr-20 py-2 rounded-lg outline-none transition-all placeholder:text-[#9AA0A6]"
          />

          <div className="absolute right-2.5 flex items-center gap-1.5">
            {searchQuery ? (
              <button
                onClick={onClearSearch}
                title="Clear search"
                className="text-[#747A84] hover:text-[#202124] transition-colors p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onOpenQuickSearch}
                title="Open Quick Search"
                className="flex items-center gap-0.5 text-[10px] font-mono font-medium text-[#747A84] bg-white border border-[#E3E6EA] px-1.5 py-0.5 rounded shadow-2xs hover:border-[#3478E8] transition-colors cursor-pointer"
              >
                <span>{settings.searchShortcut}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right: Library Index Summary & Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quiet Library Status */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#747A84] border-r border-[#ECEEF1] pr-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="font-medium text-[#202124] tabular-nums">{summary.count} files</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums font-mono">{summary.formattedSize}</span>
          <span className="text-[10px] text-[#9AA0A6] ml-0.5 font-normal">(Indexed)</span>
        </div>

        {/* Quick Search Spotlight Button */}
        <button
          onClick={onOpenQuickSearch}
          className="flex items-center gap-1.5 text-xs font-medium text-[#5F6368] hover:text-[#202124] bg-[#F5F6F8] hover:bg-[#ECEEF1] px-2.5 py-1.5 rounded-lg border border-[#E3E6EA] transition-colors cursor-pointer"
          title="Open floating Quick Search panel"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#3478E8]" />
          <span className="hidden sm:inline">Quick Search</span>
        </button>

        {/* Recent Downloads Tray Popover Toggle */}
        <button
          onClick={onToggleRecentDownloads}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
            isRecentDownloadsOpen
              ? 'bg-[#3478E8] text-white border-[#3478E8]'
              : 'text-[#5F6368] hover:text-[#202124] bg-[#F5F6F8] hover:bg-[#ECEEF1] border-[#E3E6EA]'
          }`}
          title="Recent Downloads panel"
        >
          <DownloadCloud className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Downloads</span>
        </button>

        {/* Platform Simulator (Mac / Win) */}
        <button
          onClick={togglePlatform}
          className="flex items-center gap-1 text-[11px] font-mono text-[#747A84] hover:text-[#202124] bg-[#F5F6F8] hover:bg-[#ECEEF1] px-2 py-1.5 rounded-lg border border-[#E3E6EA] transition-colors cursor-pointer"
          title={`Currently in ${settings.platform.toUpperCase()} mode. Click to toggle between macOS and Windows conventions.`}
        >
          <Monitor className="w-3 h-3 text-[#747A84]" />
          <span className="uppercase">{settings.platform}</span>
        </button>

        {/* Theme Cycler (Playful / Minimal / System) */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1 text-[11px] text-[#747A84] hover:text-[#202124] bg-[#F5F6F8] hover:bg-[#ECEEF1] p-1.5 rounded-lg border border-[#E3E6EA] transition-colors cursor-pointer"
          title={`Current Theme: ${settings.theme.toUpperCase()}`}
        >
          {settings.theme === 'playful' ? (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-700" />
          )}
        </button>
      </div>
    </header>
  );
};
