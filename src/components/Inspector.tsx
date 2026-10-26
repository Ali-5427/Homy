/**
 * Shelf File Inspector Drawer
 * Shows rich local metadata, preview stage, provenance/source attribution,
 * and native actions (Open, Reveal in Finder/Explorer, Copy Path, Move to Trash).
 */

import React from 'react';
import {
  X,
  ExternalLink,
  FolderOpen,
  Copy,
  Trash2,
  HardDrive,
  Calendar,
  Layers,
  Eye,
  Check,
} from 'lucide-react';
import { FileItem, OSPlatform } from '../types/shelf';
import { storageEngine } from '../services/storage';
import { osAdapter } from '../services/osAdapter';

interface InspectorProps {
  file: FileItem | null;
  onClose: () => void;
  onQuickLook: (file: FileItem) => void;
  onRequestTrash: (file: FileItem) => void;
  platform: OSPlatform;
}

export const Inspector: React.FC<InspectorProps> = ({
  file,
  onClose,
  onQuickLook,
  onRequestTrash,
  platform,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  if (!file) return null;

  const fileManager = platform === 'mac' ? 'Finder' : 'File Explorer';
  const trashName = platform === 'mac' ? 'Trash' : 'Recycle Bin';
  const formattedSize = storageEngine.formatBytes(file.size);
  const formattedDate = new Date(file.modifiedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleCopyPath = async () => {
    await osAdapter.copyPath(file);
    setCopied(true);
    setStatusMessage('Path copied to clipboard');
    setTimeout(() => {
      setCopied(false);
      setStatusMessage(null);
    }, 2500);
  };

  const handleShowInFileManager = async () => {
    const res = await osAdapter.showInFileManager(file);
    setStatusMessage(res.message || null);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleOpenFile = async () => {
    const res = await osAdapter.openFile(file);
    setStatusMessage(res.message || null);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <aside
      className="w-80 shrink-0 border-l border-[#E3E6EA] bg-[#FFFFFF] flex flex-col h-full select-none shadow-xs z-20"
      aria-label="File Inspector"
    >
      {/* Header */}
      <div className="h-[52px] px-4 border-b border-[#E3E6EA] flex items-center justify-between">
        <span className="text-xs font-semibold text-[#202124]">File Inspector</span>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-[#747A84] hover:text-[#202124] hover:bg-[#F5F6F8] transition-colors cursor-pointer"
          title="Close Inspector (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Large Preview Stage */}
        <div className="space-y-2">
          <div
            onClick={() => onQuickLook(file)}
            className="w-full h-44 bg-[#F5F6F8] border border-[#E3E6EA] rounded-xl overflow-hidden flex items-center justify-center p-2 relative group cursor-pointer hover:border-[#3478E8] transition-colors"
          >
            {file.previewUrl ? (
              <img
                src={file.previewUrl}
                alt={file.displayName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center space-y-1">
                <span className="text-2xl font-mono uppercase font-bold text-[#747A84]">
                  .{file.extension}
                </span>
                <span className="text-[11px] text-[#9AA0A6] block">Safe preview</span>
              </div>
            )}

            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-white/95 text-[#202124] text-xs font-medium px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#3478E8]" />
                Quick Look (Space)
              </span>
            </div>
          </div>

          <div className="px-0.5">
            <h3 className="text-sm font-semibold text-[#202124] break-all leading-snug">
              {file.displayName}
            </h3>
            <span className="text-xs text-[#747A84] block mt-0.5 font-mono">
              {formattedSize} · .{file.extension.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="bg-[#EBF3FF] border border-[#CCE2FF] text-[#1A54B8] text-xs px-3 py-2 rounded-lg flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{statusMessage}</span>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleOpenFile}
            className="w-full bg-[#3478E8] hover:bg-[#2563EB] text-white text-xs font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open File</span>
          </button>

          <button
            onClick={handleShowInFileManager}
            className="w-full bg-[#F5F6F8] hover:bg-[#ECEEF1] border border-[#E3E6EA] text-[#202124] text-xs font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#5F6368]" />
            <span className="truncate">In {fileManager}</span>
          </button>
        </div>

        {/* Metadata Details Grid */}
        <div className="space-y-3 pt-2 border-t border-[#ECEEF1]">
          <div className="text-[11px] font-semibold text-[#747A84] tracking-wide uppercase">
            File Information
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[#747A84] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#9AA0A6]" />
                Kind
              </span>
              <span className="font-medium text-[#202124] capitalize">{file.kind}</span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="text-[#747A84] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#9AA0A6]" />
                Modified
              </span>
              <span className="font-medium text-[#202124] text-right">{formattedDate}</span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="text-[#747A84] flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-[#9AA0A6]" />
                Location
              </span>
              <span className="font-mono text-[11px] text-[#202124] text-right truncate max-w-[170px]" title={file.locationPath}>
                {file.locationPath}
              </span>
            </div>

            {file.dimensions && (
              <div className="flex items-start justify-between gap-2">
                <span className="text-[#747A84]">Dimensions</span>
                <span className="font-mono text-xs text-[#202124]">
                  {file.dimensions.width} × {file.dimensions.height} px
                </span>
              </div>
            )}

            {file.duration && (
              <div className="flex items-start justify-between gap-2">
                <span className="text-[#747A84]">Duration</span>
                <span className="font-mono text-xs text-[#202124]">
                  {storageEngine.formatDuration(file.duration)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Source Attribution (Honest local metadata) */}
        <div className="space-y-2 pt-2 border-t border-[#ECEEF1]">
          <div className="text-[11px] font-semibold text-[#747A84] tracking-wide uppercase">
            Downloaded From / Source
          </div>

          {file.sourceAttribution ? (
            <div className="bg-[#F8F9FB] border border-[#E3E6EA] rounded-lg p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#202124]">
                  {file.sourceAttribution.source}
                </span>
                <span className="text-[10px] font-mono text-[#5F6368] capitalize">
                  {file.sourceAttribution.confidence}
                </span>
              </div>
              {file.sourceAttribution.evidence && (
                <p className="text-[11px] text-[#747A84]">
                  {file.sourceAttribution.evidence}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#9AA0A6] italic">
              No local source header found for this file.
            </p>
          )}
        </div>

        {/* Secondary Actions */}
        <div className="space-y-2 pt-3 border-t border-[#ECEEF1]">
          <button
            onClick={handleCopyPath}
            className="w-full bg-[#FFFFFF] hover:bg-[#F5F6F8] border border-[#E3E6EA] text-[#202124] text-xs font-medium py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#5F6368]" />}
            <span>{copied ? 'Path Copied!' : 'Copy File Path'}</span>
          </button>

          <button
            onClick={() => onRequestTrash(file)}
            className="w-full bg-[#FFFFFF] hover:bg-red-50 border border-red-200 text-red-600 text-xs font-medium py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Move to {trashName}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
