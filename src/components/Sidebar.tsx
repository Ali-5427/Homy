/**
 * Den Desktop Sidebar
 * Exact information architecture: Brand mark, Home, Recents, 6 Categories,
 * Smart Views (Large Files, Screenshots), Downloaded From, Duplicates,
 * Clean Up, Saved Searches, Locations, and Settings.
 */

import React from 'react';
import {
  Folder,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  Layers,
  Sparkles,
  Camera,
  DownloadCloud,
  Copy,
  Trash2,
  Clock,
  HardDrive,
  Plus,
  Settings,
  Bookmark,
  ChevronRight,
} from 'lucide-react';
import { ActiveView, FileKind, IndexedLocation, SavedSearch, ThemeMode } from '../types/shelf';
import { storageEngine } from '../services/storage';

interface SidebarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  locations: IndexedLocation[];
  savedSearches: SavedSearch[];
  onAddFolder: () => void;
  theme: ThemeMode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  locations,
  savedSearches,
  onAddFolder,
  theme,
}) => {
  const allFiles = storageEngine.getFiles(false);

  const getCategoryCount = (kind: FileKind) => {
    return allFiles.filter((f) => f.kind === kind).length;
  };

  const getLargeFilesCount = () => {
    return allFiles.filter((f) => f.size > 50 * 1024 * 1024).length;
  };

  const getScreenshotsCount = () => {
    return allFiles.filter((f) => f.isScreenshot).length;
  };

  const isActive = (view: ActiveView): boolean => {
    if (view.type !== activeView.type) return false;
    if (view.type === 'category' && activeView.type === 'category') {
      return view.kind === activeView.kind;
    }
    if (view.type === 'smart' && activeView.type === 'smart') {
      return view.subview === activeView.subview;
    }
    if (view.type === 'saved-search' && activeView.type === 'saved-search') {
      return view.searchId === activeView.searchId;
    }
    if (view.type === 'location' && activeView.type === 'location') {
      return view.locationId === activeView.locationId;
    }
    return true;
  };

  const navItemClass = (active: boolean) =>
    `flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer select-none ${
      active
        ? 'bg-white text-[#202124] shadow-xs font-semibold'
        : 'text-[#5F6368] hover:text-[#202124] hover:bg-neutral-200/50'
    }`;

  return (
    <aside
      className="w-[220px] shrink-0 border-r border-[#E3E6EA] bg-[#F8F9FB] flex flex-col justify-between h-full select-none"
      aria-label="Den Sidebar Navigation"
    >
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Brand Mark and Title */}
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3478E8] to-[#1A54B8] flex items-center justify-center text-white shadow-xs">
            {/* Original Den Mark: stacked folder shelf layers */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16a1 1 0 0 1 1 1v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1Z" />
              <path d="M4 11h16" />
              <path d="M4 16h16" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight text-[#202124]">Den</span>
            <span className="text-[10px] text-[#747A84] block font-mono">Local Desktop</span>
          </div>
        </div>

        {/* Primary Views: Home & Recents */}
        <div className="space-y-0.5">
          <button
            onClick={() => onNavigate({ type: 'home' })}
            className={`w-full ${navItemClass(isActive({ type: 'home' }))}`}
          >
            <div className="flex items-center gap-2">
              <Folder className="w-3.5 h-3.5" />
              <span>Home</span>
            </div>
            <span className="text-[11px] text-[#747A84] tabular-nums">{allFiles.length}</span>
          </button>

          <button
            onClick={() => onNavigate({ type: 'recents' })}
            className={`w-full ${navItemClass(isActive({ type: 'recents' }))}`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Recents</span>
            </div>
          </button>
        </div>

        {/* Categories Section */}
        <div className="space-y-0.5">
          <div className="px-3 pb-1 text-[11px] font-medium text-[#747A84] tracking-wide">
            Categories
          </div>

          <button
            onClick={() => onNavigate({ type: 'category', kind: 'image' })}
            className={`w-full ${navItemClass(isActive({ type: 'category', kind: 'image' }))}`}
          >
            <div className="flex items-center gap-2">
              <Image className="w-3.5 h-3.5 text-indigo-500" />
              <span>Images</span>
            </div>
            <span className="text-[11px] text-[#747A84] tabular-nums">{getCategoryCount('image')}</span>
          </button>

          <button
            onClick={() => onNavigate({ type: 'category', kind: 'video' })}
            className={`w-full ${navItemClass(isActive({ type: 'category', kind: 'video' }))}`}
          >
            <div className="flex items-center gap-2">
              <Video className="w-3.5 h-3.5 text-blue-500" />
              <span>Videos</span>
            </div>
            <span className="text-[11px] text-[#747A84] tabular-nums">{getCategoryCount('video')}</span>
          </button>

          <button
            onClick={() => onNavigate({ type: 'category', kind: 'audio' })}
            className={`w-full ${navItemClass(isActive({ type: 'category', kind: 'audio' }))}`}
          >
            <div className="flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-amber-500" />
              <span>Music</span>
            </div>
            <span className="text-[11px] text-[#747A84] tabular-nums">{getCategoryCount('audio')}</span>
          </button>

          <button
            onClick={() => onNavigate({ type: 'category', kind: 'document' })}
            className={`w-full ${navItemClass(isActive({ type: 'category', kind: 'document' }))}`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Documents</span>
            </div>
            <span className="text-[11px] text-[#747A84] tabular-nums">{getCategoryCount('document')}</span>
          </button>

          <button
            onClick={() => onNavigate({ type: 'category', kind: 'archive' })}
            className={`w-full ${navItemClass(isActive({ type: 'category', kind: 'archive' }))}`}
          >
            <div className="flex items-center gap-2">
              <Archive className="w-3.5 h-3.5 text-yellow-600" />
              <span>Archives</span>
            </div>
            <span className="text-[11px] text-[#747A84] tabular-nums">{getCategoryCount('archive')}</span>
          </button>

          <button
            onClick={() => onNavigate({ type: 'category', kind: 'app' })}
            className={`w-full ${navItemClass(isActive({ type: 'category', kind: 'app' }))}`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-pink-500" />
              <span>Apps</span>
            </div>
            <span className="text-[11px] text-[#747A84] tabular-nums">{getCategoryCount('app')}</span>
          </button>
        </div>

        {/* Smart Views */}
        <div className="space-y-0.5">
          <div className="px-3 pb-1 text-[11px] font-medium text-[#747A84] tracking-wide">
            Smart Views
          </div>

          <button
            onClick={() => onNavigate({ type: 'smart', subview: 'large-files' })}
            className={`w-full ${navItemClass(isActive({ type: 'smart', subview: 'large-files' }))}`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
              <span>Large Files</span>
            </div>
            <span className="text-[11px] text-[#747A84] tabular-nums">{getLargeFilesCount()}</span>
          </button>

          <button
            onClick={() => onNavigate({ type: 'smart', subview: 'screenshots' })}
            className={`w-full ${navItemClass(isActive({ type: 'smart', subview: 'screenshots' }))}`}
          >
            <div className="flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-neutral-600" />
              <span>Screenshots</span>
            </div>
            <span className="text-[11px] text-[#747A84] tabular-nums">{getScreenshotsCount()}</span>
          </button>
        </div>

        {/* Workspaces & Reviews */}
        <div className="space-y-0.5">
          <div className="px-3 pb-1 text-[11px] font-medium text-[#747A84] tracking-wide">
            Reviews & Sources
          </div>

          <button
            onClick={() => onNavigate({ type: 'sources' })}
            className={`w-full ${navItemClass(isActive({ type: 'sources' }))}`}
          >
            <div className="flex items-center gap-2">
              <DownloadCloud className="w-3.5 h-3.5 text-neutral-600" />
              <span>Downloaded From</span>
            </div>
          </button>

          <button
            onClick={() => onNavigate({ type: 'duplicates' })}
            className={`w-full ${navItemClass(isActive({ type: 'duplicates' }))}`}
          >
            <div className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-neutral-600" />
              <span>Duplicates</span>
            </div>
          </button>

          <button
            onClick={() => onNavigate({ type: 'cleanup' })}
            className={`w-full ${navItemClass(isActive({ type: 'cleanup' }))}`}
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 text-neutral-600" />
              <span>Clean Up</span>
            </div>
          </button>
        </div>

        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <div className="space-y-0.5">
            <div className="px-3 pb-1 text-[11px] font-medium text-[#747A84] tracking-wide">
              Saved Searches
            </div>
            {savedSearches.map((s) => (
              <button
                key={s.id}
                onClick={() => onNavigate({ type: 'saved-search', searchId: s.id })}
                className={`w-full ${navItemClass(isActive({ type: 'saved-search', searchId: s.id }))}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Bookmark className="w-3 h-3 shrink-0 text-neutral-500" />
                  <span className="truncate">{s.title}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Authorized Locations */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between px-3 pb-1">
            <span className="text-[11px] font-medium text-[#747A84] tracking-wide">
              Locations
            </span>
            <button
              onClick={onAddFolder}
              title="Authorize Folder for Indexing"
              className="text-[#747A84] hover:text-[#202124] transition-colors p-0.5 rounded cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => onNavigate({ type: 'location', locationId: loc.id })}
              className={`w-full ${navItemClass(isActive({ type: 'location', locationId: loc.id }))}`}
            >
              <div className="flex items-center gap-2 truncate">
                <HardDrive className="w-3 h-3 shrink-0 text-neutral-500" />
                <span className="truncate">{loc.displayName}</span>
              </div>
              <span className="text-[10px] text-[#747A84] tabular-nums font-mono">{loc.fileCount}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Settings Link */}
      <div className="p-3 border-t border-[#E3E6EA] bg-[#F8F9FB]">
        <button
          onClick={() => onNavigate({ type: 'settings' })}
          className={`w-full ${navItemClass(isActive({ type: 'settings' }))}`}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-[#5F6368]" />
            <span>Settings</span>
          </div>
          <span className="text-[10px] text-[#747A84] font-mono capitalize">{theme}</span>
        </button>
      </div>
    </aside>
  );
};
