/**
 * Den Quick Look Modal
 * Fast, focused visual preview invoked via Space key or preview buttons.
 */

import React, { useEffect } from 'react';
import { X, ExternalLink, Download } from 'lucide-react';
import { FileItem, OSPlatform } from '../types/shelf';
import { storageEngine } from '../services/storage';
import { osAdapter } from '../services/osAdapter';

interface QuickLookModalProps {
  file: FileItem | null;
  onClose: () => void;
  platform: OSPlatform;
}

export const QuickLookModal: React.FC<QuickLookModalProps> = ({
  file,
  onClose,
  platform,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!file) return null;

  const formattedSize = storageEngine.formatBytes(file.size);
  const formattedDate = storageEngine.formatDate(file.modifiedAt);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-[#E3E6EA] max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="h-12 px-4 border-b border-[#ECEEF1] flex items-center justify-between bg-[#F8F9FB]">
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-semibold text-[#202124] truncate">
              {file.displayName}
            </span>
            <span className="text-[11px] text-[#747A84] font-mono">
              ({formattedSize})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => osAdapter.openFile(file)}
              className="px-2.5 py-1 text-xs font-medium text-white bg-[#3478E8] hover:bg-[#2563EB] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-[#747A84] hover:text-[#202124] hover:bg-neutral-200/60 rounded-md transition-colors cursor-pointer"
              title="Close Quick Look (Space or Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Big Preview Area */}
        <div className="flex-1 bg-[#F5F6F8] p-6 flex items-center justify-center overflow-auto min-h-[350px]">
          {file.previewUrl ? (
            <img
              src={file.previewUrl}
              alt={file.displayName}
              referrerPolicy="no-referrer"
              className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm"
            />
          ) : (
            <div className="text-center p-8 space-y-2">
              <span className="text-4xl font-mono uppercase font-bold text-[#747A84]">
                .{file.extension}
              </span>
              <p className="text-xs text-[#747A84]">
                Local file preview is ready. No cloud data transfer.
              </p>
            </div>
          )}
        </div>

        {/* Footer Details */}
        <div className="px-5 py-3 border-t border-[#ECEEF1] bg-white flex items-center justify-between text-xs text-[#747A84]">
          <div className="flex items-center gap-3">
            <span>Kind: <strong className="text-[#202124] capitalize">{file.kind}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Modified: <strong className="text-[#202124]">{formattedDate}</strong></span>
            {file.sourceAttribution && (
              <>
                <span aria-hidden="true">·</span>
                <span>Source: <strong className="text-[#3478E8]">{file.sourceAttribution.source}</strong></span>
              </>
            )}
          </div>
          <span className="text-[11px] font-mono text-[#9AA0A6]">
            Press Space or Esc to dismiss
          </span>
        </div>
      </div>
    </div>
  );
};
