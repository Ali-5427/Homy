/**
 * Shelf Recent Downloads Menu-Bar / Tray Panel
 * Surfaces up to ten recent download files with quick OS actions,
 * matching native tray and menu-bar specifications.
 */

import React, { useEffect, useRef } from 'react';
import {
  DownloadCloud,
  FolderOpen,
  Sparkles,
  Settings,
  ExternalLink,
  X,
} from 'lucide-react';
import { FileItem, OSPlatform } from '../types/shelf';
import { storageEngine } from '../services/storage';
import { osAdapter } from '../services/osAdapter';

interface RecentDownloadsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: FileItem) => void;
  onOpenQuickSearch: () => void;
  onOpenSettings: () => void;
  platform: OSPlatform;
}

export const RecentDownloadsPopover: React.FC<RecentDownloadsPopoverProps> = ({
  isOpen,
  onClose,
  onSelectFile,
  onOpenQuickSearch,
  onOpenSettings,
  platform,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const allFiles = storageEngine.getFiles(false);

  // Up to 10 recent downloads
  const recentDownloads = allFiles
    .filter((f) => f.locationPath.toLowerCase().includes('downloads'))
    .sort((a, b) => b.modifiedAt - a.modifiedAt)
    .slice(0, 10);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fileManager = platform === 'mac' ? 'Finder' : 'Explorer';

  const handleOpenDownloadsFolder = () => {
    // Reveal first download in file manager to open the folder
    if (recentDownloads[0]) {
      osAdapter.showInFileManager(recentDownloads[0]);
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute top-14 right-6 w-96 bg-white rounded-2xl shadow-xl border border-[#E3E6EA] z-40 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="p-3.5 px-4 border-b border-[#ECEEF1] bg-[#F8F9FB] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DownloadCloud className="w-4 h-4 text-[#3478E8]" />
          <h3 className="text-xs font-semibold text-[#202124]">Recent Downloads</h3>
          <span className="text-[10px] font-mono text-[#747A84] bg-white px-1.5 py-0.5 rounded border border-[#E3E6EA]">
            {recentDownloads.length} files
          </span>
        </div>

        <button
          onClick={onClose}
          className="text-[#747A84] hover:text-[#202124] p-1 rounded-md transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Action: Open Downloads Folder */}
      <div className="px-3 py-2 bg-neutral-50/80 border-b border-[#ECEEF1] flex items-center justify-between">
        <span className="text-[11px] text-[#747A84]">Authorized path: ~/Downloads</span>
        <button
          onClick={handleOpenDownloadsFolder}
          className="text-[11px] font-medium text-[#3478E8] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <FolderOpen className="w-3 h-3" />
          <span>Open in {fileManager}</span>
        </button>
      </div>

      {/* Files List */}
      <div className="max-h-80 overflow-y-auto p-2 space-y-1">
        {recentDownloads.length > 0 ? (
          recentDownloads.map((file) => (
            <div
              key={file.id}
              onClick={() => {
                onSelectFile(file);
                onClose();
              }}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F5F6F8] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 truncate mr-2">
                <div className="w-8 h-8 rounded-lg bg-[#F5F6F8] border border-[#E3E6EA] overflow-hidden flex items-center justify-center shrink-0">
                  {file.previewUrl ? (
                    <img
                      src={file.previewUrl}
                      alt={file.displayName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[9px] font-mono font-bold uppercase text-[#747A84]">
                      {file.extension}
                    </span>
                  )}
                </div>

                <div className="truncate">
                  <div className="text-xs font-medium text-[#202124] truncate group-hover:text-[#3478E8] transition-colors">
                    {file.displayName}
                  </div>
                  <div className="text-[10px] text-[#747A84] font-mono flex items-center gap-1.5">
                    <span>{storageEngine.formatBytes(file.size)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{storageEngine.formatDate(file.modifiedAt)}</span>
                    {file.sourceAttribution && file.sourceAttribution.source !== 'Unknown' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#3478E8]">{file.sourceAttribution.source}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  osAdapter.openFile(file);
                }}
                title="Open file"
                className="opacity-0 group-hover:opacity-100 p-1 text-[#747A84] hover:text-[#202124] transition-opacity cursor-pointer shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-xs text-[#747A84] italic">
            No files currently in indexed Downloads.
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="p-2.5 px-4 bg-[#F8F9FB] border-t border-[#ECEEF1] flex items-center justify-between text-xs text-[#5F6368]">
        <button
          onClick={() => {
            onClose();
            onOpenQuickSearch();
          }}
          className="flex items-center gap-1 hover:text-[#202124] transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#3478E8]" />
          <span>Quick Search</span>
        </button>

        <button
          onClick={() => {
            onClose();
            onOpenSettings();
          }}
          className="flex items-center gap-1 hover:text-[#202124] transition-colors cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-[#747A84]" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};
