/**
 * Den Desktop Top Bar
 * Clean search input with keyboard hint, clear-search control,
 * library status, and working dark/light theme switch.
 */

import React from 'react';
import { Search, X, DownloadCloud, Sparkles, Moon, Sun } from 'lucide-react';
import { AppSettings, ThemeMode } from '../types/shelf';
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

  const toggleTheme = () => {
    const nextTheme: ThemeMode = settings.theme === 'dark' ? 'light' : 'dark';
    onUpdateSettings({ theme: nextTheme });
  };

  return (
    <header
      className="h-[52px] border-b border-[#E3E6EA] dark:border-[#282C34] bg-white dark:bg-[#17191E] px-5 flex items-center justify-between gap-4 select-none shrink-0 transition-colors"
      aria-label="Den Top Bar"
    >
      {/* Left: Search Bar */}
      <div className="flex items-center gap-2 flex-1 max-w-xl">
        <div className="relative w-full flex items-center">
          <Search className="w-4 h-4 text-[#747A84] dark:text-[#9CA3AF] absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && searchQuery) {
                onClearSearch();
              }
            }}
            placeholder='Search files by name, type, or size...'
            className="w-full bg-[#F5F6F8] dark:bg-[#1F2228] hover:bg-[#ECEEF1]/70 dark:hover:bg-[#252932] focus:bg-white dark:focus:bg-[#17191E] border border-[#E3E6EA] dark:border-[#282C34] focus:border-[#3478E8] text-[#202124] dark:text-[#F3F4F6] text-xs pl-9 pr-20 py-2 rounded-lg outline-none transition-all placeholder:text-[#9AA0A6] dark:placeholder:text-[#6B7280]"
          />

          <div className="absolute right-2.5 flex items-center gap-1.5">
            {searchQuery ? (
              <button
                onClick={onClearSearch}
                title="Clear search"
                className="text-[#747A84] hover:text-[#202124] dark:hover:text-[#F3F4F6] transition-colors p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onOpenQuickSearch}
                title="Open Quick Search"
                className="flex items-center gap-0.5 text-[10px] font-mono font-medium text-[#747A84] dark:text-[#9CA3AF] bg-white dark:bg-[#252932] border border-[#E3E6EA] dark:border-[#282C34] px-1.5 py-0.5 rounded shadow-2xs hover:border-[#3478E8] transition-colors cursor-pointer"
              >
                <span>{settings.searchShortcut}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right: Library Status & Clean Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Concise Library Count */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#747A84] dark:text-[#9CA3AF] border-r border-[#ECEEF1] dark:border-[#282C34] pr-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="font-medium text-[#202124] dark:text-[#F3F4F6] tabular-nums">{summary.count} files</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums font-mono">{summary.formattedSize}</span>
        </div>

        {/* Quick Search Spotlight Button */}
        <button
          onClick={onOpenQuickSearch}
          className="flex items-center gap-1.5 text-xs font-medium text-[#5F6368] dark:text-[#9CA3AF] hover:text-[#202124] dark:hover:text-[#F3F4F6] bg-[#F5F6F8] dark:bg-[#1F2228] hover:bg-[#ECEEF1] dark:hover:bg-[#252932] px-2.5 py-1.5 rounded-lg border border-[#E3E6EA] dark:border-[#282C34] transition-colors cursor-pointer"
          title="Open Quick Search (⌘K / Ctrl+K)"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#3478E8]" />
          <span className="hidden sm:inline">Quick Search</span>
        </button>

        {/* Recent Downloads Toggle */}
        <button
          onClick={onToggleRecentDownloads}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
            isRecentDownloadsOpen
              ? 'bg-[#3478E8] text-white border-[#3478E8]'
              : 'text-[#5F6368] dark:text-[#9CA3AF] hover:text-[#202124] dark:hover:text-[#F3F4F6] bg-[#F5F6F8] dark:bg-[#1F2228] hover:bg-[#ECEEF1] dark:hover:bg-[#252932] border-[#E3E6EA] dark:border-[#282C34]'
          }`}
          title="Recent Downloads"
        >
          <DownloadCloud className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Downloads</span>
        </button>

        {/* Real Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center text-[#747A84] dark:text-[#9CA3AF] hover:text-[#202124] dark:hover:text-[#F3F4F6] bg-[#F5F6F8] dark:bg-[#1F2228] hover:bg-[#ECEEF1] dark:hover:bg-[#252932] p-1.5 rounded-lg border border-[#E3E6EA] dark:border-[#282C34] transition-colors cursor-pointer"
          title={settings.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>
    </header>
  );
};
