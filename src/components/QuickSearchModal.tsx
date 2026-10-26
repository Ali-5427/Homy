/**
 * Den Quick Search Floating Spotlight Panel
 * Compact floating modal for instant desktop file lookups with keyboard shortcuts.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CornerDownLeft, ExternalLink, FolderOpen, ArrowDown, ArrowUp } from 'lucide-react';
import { FileItem, OSPlatform } from '../types/shelf';
import { storageEngine } from '../services/storage';
import { osAdapter } from '../services/osAdapter';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFileInDen: (file: FileItem) => void;
  platform: OSPlatform;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectFileInDen,
  platform,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const allFiles = storageEngine.getFiles(false);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredFiles = query.trim()
    ? allFiles.filter(
        (f) =>
          f.displayName.toLowerCase().includes(query.toLowerCase()) ||
          f.extension.toLowerCase().includes(query.toLowerCase()) ||
          f.locationPath.toLowerCase().includes(query.toLowerCase())
      )
    : allFiles.slice(0, 7); // Recent files first-open state

  const modKey = platform === 'mac' ? '⌘' : 'Ctrl';
  const fileManager = platform === 'mac' ? 'Finder' : 'Explorer';

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredFiles.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredFiles.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredFiles[selectedIndex];
      if (!current) return;

      if (e.metaKey || e.ctrlKey) {
        // Cmd+Enter / Ctrl+Enter: reveal in Den main window
        onSelectFileInDen(current);
        onClose();
      } else {
        // Enter: Open in OS default app
        osAdapter.openFile(current);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-start justify-center pt-24 p-4 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-[#E3E6EA] max-w-xl w-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3 border-b border-[#ECEEF1] flex items-center gap-3 bg-[#F8F9FB]">
          <Search className="w-4 h-4 text-[#747A84] ml-1 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a file name, extension, or location..."
            className="flex-1 bg-transparent text-sm text-[#202124] placeholder:text-[#9AA0A6] outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#747A84] hover:text-[#202124] rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="text-[10px] font-mono text-[#9AA0A6] px-1.5 py-0.5 border border-[#E3E6EA] rounded bg-white">
              ESC to close
            </span>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={file.id}
                  onClick={() => {
                    onSelectFileInDen(file);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#EBF3FF] text-[#202124]' : 'hover:bg-[#F5F6F8] text-[#5F6368]'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate flex-1 mr-3">
                    {/* Small thumbnail stage */}
                    <div className="w-9 h-9 rounded-lg bg-white border border-[#E3E6EA] overflow-hidden flex items-center justify-center shrink-0">
                      {file.previewUrl ? (
                        <img
                          src={file.previewUrl}
                          alt={file.displayName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-mono font-bold uppercase text-[#747A84]">
                          {file.extension}
                        </span>
                      )}
                    </div>

                    <div className="truncate">
                      <div className="text-xs font-semibold text-[#202124] truncate">
                        {file.displayName}
                      </div>
                      <div className="text-[10px] text-[#747A84] truncate font-mono">
                        {file.locationPath} · {storageEngine.formatBytes(file.size)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-[#747A84]">
                    {isSelected && (
                      <span className="text-[10px] font-mono text-[#3478E8] flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-[#CCE2FF]">
                        <span>Enter to Open</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center space-y-1 text-xs text-[#747A84]">
              <p>No matching local files found.</p>
              <p className="text-[11px] text-[#9AA0A6]">
                Only authorized folders are searched.
              </p>
            </div>
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="p-2.5 px-4 bg-[#F8F9FB] border-t border-[#ECEEF1] flex items-center justify-between text-[11px] text-[#747A84] font-mono select-none">
          <div className="flex items-center gap-3">
            <span><strong>↵</strong> Open</span>
            <span><strong>{modKey}+↵</strong> Inspect in Den</span>
            <span><strong>↑↓</strong> Navigate</span>
          </div>
          <span><strong>Esc</strong> Dismiss</span>
        </div>
      </div>
    </div>
  );
};
